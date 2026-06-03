// Edge Function: generate-pose-config
//
// Receives two pose landmark snapshots (rest + target) plus exercise metadata
// and asks OpenRouter to produce a `pose_config` JSON in `rules_engine_v1`
// shape. The API key stays server-side via Supabase Secrets.

// Supabase Edge runtime injects `Deno`; declare locally so editor TS (which
// does not load Deno types) stops flagging it as unknown.
declare const Deno: {
  serve: (handler: (req: Request) => Response | Promise<Response>) => void
  env: { get: (key: string) => string | undefined }
}

import { corsHeaders } from '../_shared/cors.ts'
import { buildSystemPrompt, buildUserPrompt, compactLandmarks } from './prompt.ts'
import { validatePoseConfig } from './validatePoseConfig.ts'
import { checkPoseConfigAgainstSnapshots } from './snapshotRuleCheck.ts'
import { buildFallbackPoseConfig } from './fallbackPoseConfig.ts'

const MAX_AI_ATTEMPTS = 3

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const DEFAULT_MODEL = 'openai/gpt-4o-mini'

type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string }
type AiCallResult =
  | { ok: true; parsed: Record<string, unknown>; rawContent: string; usage: unknown }
  | { ok: false; response: Response }

function jsonResponse(
  body: unknown,
  init: { status?: number; headers?: Record<string, string> } = {},
) {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
      ...(init.headers ?? {}),
    },
  })
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0
}

function isLandmarkPayload(v: unknown): boolean {
  if (!v || typeof v !== 'object') return false
  const pose = (v as { pose?: unknown }).pose
  if (!pose || typeof pose !== 'object') return false
  const landmarks = (pose as { landmarks?: unknown }).landmarks
  return Array.isArray(landmarks) && landmarks.length > 0
}

function extractJsonObject(raw: string): unknown | null {
  const trimmed = raw.trim()
  try {
    return JSON.parse(trimmed)
  } catch {
    // Some models wrap JSON in ```json fences despite instructions to not.
  }
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
  if (fenced && fenced[1]) {
    try {
      return JSON.parse(fenced[1])
    } catch {
      // Fall through.
    }
  }
  const firstBrace = trimmed.indexOf('{')
  const lastBrace = trimmed.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try {
      return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1))
    } catch {
      // Fall through.
    }
  }
  return null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'method_not_allowed' }, { status: 405 })
  }

  const authHeader = req.headers.get('Authorization') ?? ''
  if (!authHeader.toLowerCase().startsWith('bearer ')) {
    return jsonResponse({ error: 'unauthorized' }, { status: 401 })
  }

  const openrouterKey = Deno.env.get('OPENROUTER_API_KEY')
  if (!openrouterKey) {
    return jsonResponse(
      { error: 'server_misconfigured', details: 'OPENROUTER_API_KEY is not set.' },
      { status: 500 },
    )
  }
  const model = Deno.env.get('OPENROUTER_MODEL') ?? DEFAULT_MODEL

  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return jsonResponse({ error: 'invalid_json' }, { status: 400 })
  }

  const exerciseTitle = body.exerciseTitle
  const goalId = body.goalId
  const repsCount = body.repsCount
  const rest = body.rest
  const target = body.target

  if (
    !isNonEmptyString(exerciseTitle) ||
    !isNonEmptyString(goalId) ||
    typeof repsCount !== 'number' ||
    !Number.isFinite(repsCount) ||
    !isLandmarkPayload(rest) ||
    !isLandmarkPayload(target)
  ) {
    return jsonResponse(
      {
        error: 'invalid_payload',
        details:
          'Expected: exerciseTitle (string), goalId (string), repsCount (number), rest (landmark payload), target (landmark payload).',
      },
      { status: 400 },
    )
  }

  const systemPrompt = buildSystemPrompt()
  const userPrompt = buildUserPrompt({
    exerciseTitle: exerciseTitle as string,
    goalId: goalId as string,
    repsCount: repsCount as number,
    // deno-lint-ignore no-explicit-any
    rest: rest as any,
    // deno-lint-ignore no-explicit-any
    target: target as any,
  })

  const baseMessages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ]

  const restSnap = rest as Parameters<typeof checkPoseConfigAgainstSnapshots>[1]
  const targetSnap = target as Parameters<typeof checkPoseConfigAgainstSnapshots>[2]

  const messages: ChatMessage[] = [...baseMessages]
  let lastRaw = ''
  let lastErrors: string[] = []
  let totalUsage: unknown = null
  let attempts = 0

  for (let attempt = 0; attempt < MAX_AI_ATTEMPTS; attempt++) {
    attempts += 1
    const call = await callOpenRouter(openrouterKey, model, messages)
    if (!call.ok) return call.response

    lastRaw = call.rawContent
    if (call.usage) totalUsage = call.usage

    const accept = acceptGeneratedPoseConfig(call.parsed, restSnap, targetSnap)
    if (accept.ok) {
      return jsonResponse({
        poseConfig: attachReferenceTargetLandmarks(accept.value, target),
        model,
        usage: totalUsage,
        retried: attempt > 0,
        attempts,
        frameTest: { ok: true },
        source: 'ai',
      })
    }

    lastErrors = accept.errors
    messages.push({ role: 'assistant', content: call.rawContent })
    messages.push({
      role: 'user',
      content: [
        'The previous JSON did not pass validation and/or snapshot tests on the REST/TARGET frames.',
        'rules.up MUST pass on TARGET landmarks; rules.rest (or default rest) MUST pass on REST.',
        'Do NOT use above/below with NOSE and shoulders. Use aboveEyeLine for arms above eyes.',
        'Fix every issue and return ONLY corrected JSON (no markdown fences).',
        'Errors:',
        ...accept.errors.map((e) => `- ${e}`),
      ].join('\n'),
    })
  }

  const fallback = buildFallbackPoseConfig({
    exerciseTitle: exerciseTitle as string,
    repsCount: repsCount as number,
    rest: restSnap,
    target: targetSnap,
  })

  if (fallback) {
    return jsonResponse({
      poseConfig: attachReferenceTargetLandmarks(fallback.config, target),
      model,
      usage: totalUsage,
      retried: attempts > 1,
      attempts,
      frameTest: { ok: true },
      source: 'fallback',
      fallbackKind: fallback.kind,
      aiErrors: lastErrors,
    })
  }

  return jsonResponse(
    {
      error: 'ai_schema_invalid',
      details: `AI could not produce valid pose_config after ${MAX_AI_ATTEMPTS} attempts and fallback failed.`,
      lastErrors,
      lastRaw: lastRaw.slice(0, 800),
    },
    { status: 502 },
  )
})

function acceptGeneratedPoseConfig(
  parsed: unknown,
  rest: Parameters<typeof checkPoseConfigAgainstSnapshots>[1],
  target: Parameters<typeof checkPoseConfigAgainstSnapshots>[2],
):
  | { ok: true; value: Record<string, unknown> }
  | { ok: false; errors: string[] } {
  const schema = validatePoseConfig(parsed)
  if (!schema.ok) {
    return { ok: false, errors: schema.errors }
  }
  const snapshot = checkPoseConfigAgainstSnapshots(schema.value, rest, target)
  if (!snapshot.ok) {
    return { ok: false, errors: snapshot.errors }
  }
  return { ok: true, value: schema.value as unknown as Record<string, unknown> }
}

function attachReferenceTargetLandmarks(
  poseConfig: Record<string, unknown>,
  targetSnapshot: unknown,
): Record<string, unknown> {
  if (!isLandmarkPayload(targetSnapshot)) return poseConfig
  return {
    ...poseConfig,
    reference: {
      target: {
        landmarks: compactLandmarks(targetSnapshot as Parameters<typeof compactLandmarks>[0]),
      },
    },
  }
}

async function callOpenRouter(
  apiKey: string,
  model: string,
  messages: ChatMessage[],
): Promise<AiCallResult> {
  let aiResp: Response
  try {
    aiResp = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://nimbli.local',
        'X-Title': 'Nimbli generate-pose-config',
      },
      body: JSON.stringify({
        model,
        response_format: { type: 'json_object' },
        messages,
      }),
    })
  } catch (e) {
    return {
      ok: false,
      response: jsonResponse(
        {
          error: 'ai_unreachable',
          details: e instanceof Error ? e.message : 'fetch failed',
        },
        { status: 502 },
      ),
    }
  }

  if (!aiResp.ok) {
    const errText = await aiResp.text().catch(() => '')
    return {
      ok: false,
      response: jsonResponse(
        {
          error: 'ai_http_error',
          status: aiResp.status,
          details: errText.slice(0, 500),
        },
        { status: 502 },
      ),
    }
  }

  let aiBody: {
    choices?: Array<{ message?: { content?: string } }>
    usage?: unknown
  }
  try {
    aiBody = await aiResp.json()
  } catch {
    return {
      ok: false,
      response: jsonResponse(
        { error: 'ai_invalid_json', details: 'AI response was not JSON.' },
        { status: 502 },
      ),
    }
  }

  const content = aiBody.choices?.[0]?.message?.content
  if (typeof content !== 'string' || content.trim().length === 0) {
    return {
      ok: false,
      response: jsonResponse(
        { error: 'ai_empty_response', details: 'No content in choices[0].message.' },
        { status: 502 },
      ),
    }
  }

  const parsed = extractJsonObject(content)
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return {
      ok: false,
      response: jsonResponse(
        {
          error: 'ai_invalid_json',
          details: 'Could not parse a JSON object from the AI response.',
          raw: content.slice(0, 500),
        },
        { status: 502 },
      ),
    }
  }

  return {
    ok: true,
    parsed: parsed as Record<string, unknown>,
    rawContent: content,
    usage: aiBody.usage,
  }
}
