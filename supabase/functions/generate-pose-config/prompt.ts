// Prompt builders for the OpenRouter call that turns two pose landmark
// snapshots into a `rules_engine_v1` pose_config JSON.

const SCHEMA_DOC = `
Output schema (rules_engine_v1):

{
  "version": 1,
  "type": "rules_engine_v1",
  "repsTarget": <int 1..50>,
  "thresholds": {
    "visMin": 0.55,
    "deltaY": 0.04,
    "aboveEyesDelta": 0.04,
    "kneeHipLevelMaxDelta": 0.04,
    "kneeAngleMinDeg": <optional number>,
    "kneeAngleMaxDeg": <optional number>
  },
  "timing": {
    "stableUpMs": 280,
    "holdGraceMs": 450,
    "holdRequiredMs": 2000,
    "stableDownMs": 350,
    "betweenRepsMs": 1600,
    "restStableMs": 320
  },
  "rules": {
    "up":   [ <rule>, ... ],          // required, non-empty
    "rest": [ <rule>, ... ]           // optional; omit to use default (wrists below shoulders)
  },
  "copy": {
    "waitUp":   { "line1": "<NL>", "line2": "<NL>" },
    "holding":  { "line1": "<NL>", "line2": "<NL>" },
    "waitDown": { "line1": "<NL>", "line2": "<NL>" },
    "complete": { "line1": "<NL>", "line2": "<NL>" }
  }
}

Allowed rule operators (\`op\`):

- visible:      { "op": "visible", "points": ["LEFT_WRIST", ...] }
- above:        { "op": "above", "a": "<lm>", "b": "<lm>", "delta"?: number }       // a clearly higher on screen than b (smaller y)
- below:        { "op": "below", "a": "<lm>", "b": "<lm>", "delta"?: number }       // a clearly lower than b
- aboveEyeLine: { "op": "aboveEyeLine", "a": "<lm>", "delta"?: number }             // a above the visible eye line
- yWithin:      { "op": "yWithin", "a": "<lm>", "b": "<lm>", "maxDelta"?: number }  // |a.y - b.y| <= maxDelta
- distance:     { "op": "distance", "a": "<lm>", "b": "<lm>", "max": number }       // 2D distance <= max
- angle:        { "op": "angle", "a": "<lm>", "b": "<lm>", "c": "<lm>", "minDeg": number, "maxDeg": number }
- collinear:    { "op": "collinear", "a": "<lm>", "b": "<lm>", "c": "<lm>", "tol": number }
- allOf:        { "op": "allOf", "rules": [ <rule>, ... ] }
- anyOf:        { "op": "anyOf", "rules": [ <rule>, ... ] }
- not:          { "op": "not", "rule": <rule> }

Landmark names are case-sensitive. The engine accepts many MediaPipe points, but you must use ONLY the
important body landmarks below (see LANDMARK_GUIDE in the system message).

Coordinate system: image-normalized. x in [0,1] (left to right), y in [0,1] (top to bottom).
Smaller y = HIGHER on screen. \`above\` means smaller y.

Copy strings MUST be in Dutch. You may use placeholders \`{nextRep}\`, \`{repsTarget}\`,
\`{done}\`, \`{remaining}\`, \`{secondsLeft}\`. Keep lines short and child-friendly.
`.trim()

const LANDMARK_GUIDE = `
Landmark priority (use ONLY these in visible, above, below, yWithin, angle, collinear, distance):

PREFERRED — core body (pick 3–6 per exercise from this list):
- Arms: LEFT_SHOULDER, RIGHT_SHOULDER, LEFT_ELBOW, RIGHT_ELBOW, LEFT_WRIST, RIGHT_WRIST
- Torso / legs: LEFT_HIP, RIGHT_HIP, LEFT_KNEE, RIGHT_KNEE, LEFT_ANKLE, RIGHT_ANKLE
- Head (sparingly): NOSE — only when the exercise truly needs facing the camera; never pair NOSE in yWithin

Hand position = WRIST (not fingers). Foot / leg end = ANKLE (not toes or heel).

NEVER use in any rule (validation will reject):
- Fingers: LEFT_PINKY, RIGHT_PINKY, LEFT_INDEX, RIGHT_INDEX, LEFT_THUMB, RIGHT_THUMB
- Toes / foot detail: LEFT_FOOT_INDEX, RIGHT_FOOT_INDEX, LEFT_HEEL, RIGHT_HEEL
- Face detail: LEFT_EAR, RIGHT_EAR, MOUTH_LEFT, MOUTH_RIGHT, and all EYE_* landmarks in visible/yWithin/angle
  (aboveEyeLine already uses the eye line internally — do not list eyes in "visible")

Examples:
- Stretch arms up → WRIST + ELBOW + aboveEyeLine
- Flamingo → HIP + KNEE + ANKLE on standing leg
- Plank → SHOULDER + HIP + KNEE (+ ELBOW/WRIST if arms matter), never FOOT_INDEX
`.trim()

const RULES_GUIDE = `
Robustness rules (critical — the runtime uses strict allOf on every rule in rules.up):

1. Keep rules.up small: one "visible" rule with at most 6 landmarks from LANDMARK_GUIDE (preferred list only).
2. NEVER use yWithin with NOSE or any EYE landmark. Head and shoulders are never at the same height in image space.
3. Use yWithin only for landmarks that can share height in the TARGET snapshot (e.g. KNEE+HIP,
   LEFT_HIP+RIGHT_HIP, SHOULDER+HIP for plank-like poses). Derive pairs from the supplied landmark y values.
4. Arms overhead / stretch up: use aboveEyeLine on BOTH elbows AND BOTH wrists (four rules), not yWithin with nose.
5. Rest pose: prefer wrists below shoulders (below), or omit rules.rest to use the app default.
6. Avoid collinear as the only geometry; prefer yWithin and/or angle for body line (plank, bridge).
7. Follow LANDMARK_GUIDE: no finger or toe landmarks; WRIST not INDEX/THUMB; ANKLE not FOOT_INDEX/HEEL.
8. Tolerances: delta / maxDelta / tol usually 0.04–0.08; do not go below 0.04.
9. CRITICAL: Every rule in rules.up MUST pass on the TARGET snapshot landmarks in the user message.
   Before adding above/below/yWithin, check y values in TARGET:
   - above(a,b) only if y(a) < y(b) - 0.04 (a higher on screen than b)
   - below(a,b) only if y(a) > y(b) + 0.04 (a lower on screen than b)
   NEVER above(SHOULDER, NOSE) or below(SHOULDER, NOSE) — shoulders have larger y than nose in standing/stretch.
   NEVER below(SHOULDER, HIP) when y(shoulder) < y(hip) in TARGET (standing). Use yWithin for similar heights.
`.trim()

const EXAMPLE_STRETCH = `
Example (arms-up stretch, like "stretch naar de sterren"):

{
  "version": 1,
  "type": "rules_engine_v1",
  "repsTarget": 10,
  "thresholds": { "visMin": 0.55, "deltaY": 0.04, "aboveEyesDelta": 0.04 },
  "timing": {
    "stableUpMs": 280, "holdGraceMs": 450, "holdRequiredMs": 2000,
    "stableDownMs": 350, "betweenRepsMs": 1600, "restStableMs": 320
  },
  "rules": {
    "up": [
      { "op": "visible", "points": ["LEFT_ELBOW", "RIGHT_ELBOW", "LEFT_WRIST", "RIGHT_WRIST"] },
      { "op": "aboveEyeLine", "a": "LEFT_ELBOW" },
      { "op": "aboveEyeLine", "a": "RIGHT_ELBOW" },
      { "op": "aboveEyeLine", "a": "LEFT_WRIST" },
      { "op": "aboveEyeLine", "a": "RIGHT_WRIST" }
    ],
    "rest": [
      { "op": "below", "a": "LEFT_WRIST", "b": "LEFT_SHOULDER", "delta": 0.045 },
      { "op": "below", "a": "RIGHT_WRIST", "b": "RIGHT_SHOULDER", "delta": 0.045 }
    ]
  },
  "copy": {
    "waitUp":   { "line1": "Stretch", "line2": "Strek je armen omhoog boven je ogen." },
    "holding":  { "line1": "Hou vol!", "line2": "Nog {secondsLeft} s — blijf staan." },
    "waitDown": { "line1": "Klaar", "line2": "Laat je armen rustig zakken." },
    "complete": { "line1": "Klaar!", "line2": "Super gedaan!" }
  }
}
`.trim()

const EXAMPLE = `
Example (flamingo, balance on left leg):

{
  "version": 1,
  "type": "rules_engine_v1",
  "repsTarget": 1,
  "thresholds": { "visMin": 0.55, "deltaY": 0.04, "kneeHipLevelMaxDelta": 0.04 },
  "timing": {
    "stableUpMs": 400, "holdGraceMs": 500, "holdRequiredMs": 3000,
    "stableDownMs": 350, "betweenRepsMs": 1600, "restStableMs": 320
  },
  "rules": {
    "up": [
      { "op": "visible", "points": ["LEFT_HIP", "LEFT_KNEE", "LEFT_ANKLE"] },
      { "op": "yWithin", "a": "LEFT_KNEE", "b": "LEFT_HIP" },
      { "op": "angle", "a": "LEFT_HIP", "b": "LEFT_KNEE", "c": "LEFT_ANKLE", "minDeg": 70, "maxDeg": 110 }
    ]
  },
  "copy": {
    "waitUp":   { "line1": "Flamingo", "line2": "Zoek balans: voet tegen je knie en blijf stil." },
    "holding":  { "line1": "Hou vol!", "line2": "Nog {secondsLeft} s — blijf stil staan." },
    "waitDown": { "line1": "Klaar",    "line2": "Ga rustig terug naar een normale stand." },
    "complete": { "line1": "Klaar!",   "line2": "Super — je hield je balans." }
  }
}
`.trim()

export function buildSystemPrompt(): string {
  return [
    'You generate exercise pose configurations for a children\'s physiotherapy app.',
    'You receive two MediaPipe pose snapshots from an uploaded video:',
    '  - REST pose: the relaxed/starting position.',
    '  - TARGET pose: the position the child must reach and hold.',
    'Your job: produce ONE valid JSON object that follows the `rules_engine_v1` schema below.',
    'The `rules.up` array must describe the TARGET pose (booleans the engine checks while the child is holding).',
    'The `rules.rest` array (optional) should describe the REST pose so the engine can detect the relaxed starting state.',
    'Prefer simple, robust rules (visibility + 2-4 geometric checks). Avoid over-constraining.',
    'Compare REST vs TARGET landmark y values in the user message before choosing operators.',
    '',
    LANDMARK_GUIDE,
    '',
    RULES_GUIDE,
    '',
    SCHEMA_DOC,
    '',
    EXAMPLE_STRETCH,
    '',
    EXAMPLE,
    '',
    'Respond with ONLY the JSON object. No prose, no markdown fences, no commentary.',
  ].join('\n')
}

type LandmarkPoint = {
  name?: string
  index?: number
  x?: number
  y?: number
  z?: number
  visibility?: number
}

type Snapshot = {
  pose?: {
    landmarks?: LandmarkPoint[]
  }
}

export function compactLandmarks(snap: Snapshot): Array<Record<string, number | string>> {
  const lm = Array.isArray(snap?.pose?.landmarks) ? snap.pose!.landmarks! : []
  return lm.map((p) => ({
    name: p.name ?? `INDEX_${p.index ?? '?'}`,
    x: Number((p.x ?? 0).toFixed(4)),
    y: Number((p.y ?? 0).toFixed(4)),
    z: Number((p.z ?? 0).toFixed(4)),
    visibility: Number((p.visibility ?? 0).toFixed(3)),
  }))
}

const EYE_NAMES = [
  'LEFT_EYE_INNER',
  'LEFT_EYE',
  'LEFT_EYE_OUTER',
  'RIGHT_EYE_INNER',
  'RIGHT_EYE',
  'RIGHT_EYE_OUTER',
] as const

function findLandmarkY(snap: Snapshot, name: string): number | null {
  const lm = Array.isArray(snap?.pose?.landmarks) ? snap.pose!.landmarks! : []
  for (const p of lm) {
    const n = typeof p.name === 'string' ? p.name.trim().toUpperCase() : ''
    if (n !== name) continue
    const y = Number(p.y)
    return Number.isFinite(y) ? y : null
  }
  return null
}

function minEyeY(snap: Snapshot): number | null {
  let min = Infinity
  for (const name of EYE_NAMES) {
    const y = findLandmarkY(snap, name)
    if (y != null && y < min) min = y
  }
  return Number.isFinite(min) ? min : null
}

/**
 * Hints derived from snapshot geometry so the model avoids impossible rules (e.g. yWithin shoulder–nose).
 */
export function buildLandmarkHints(rest: Snapshot, target: Snapshot): string[] {
  const hints: string[] = []
  const pairs: Array<[string, string, string]> = [
    ['LEFT_SHOULDER', 'NOSE', 'TARGET'],
    ['RIGHT_SHOULDER', 'NOSE', 'TARGET'],
    ['LEFT_SHOULDER', 'LEFT_HIP', 'TARGET'],
    ['LEFT_HIP', 'RIGHT_HIP', 'TARGET'],
    ['LEFT_KNEE', 'LEFT_HIP', 'TARGET'],
  ]

  for (const [a, b, label] of pairs) {
    const ya = findLandmarkY(target, a)
    const yb = findLandmarkY(target, b)
    if (ya == null || yb == null) continue
    const dy = Math.abs(ya - yb)
    hints.push(
      `${label}: |y(${a})-y(${b})|=${dy.toFixed(3)} — yWithin needs maxDelta >= ${dy.toFixed(2)} to pass; prefer above/below/angle/aboveEyeLine when dy > 0.06.`,
    )
    if ((a.includes('SHOULDER') && b === 'NOSE') || (b.includes('SHOULDER') && a === 'NOSE')) {
      hints.push(`Do NOT use yWithin/above/below between ${a} and ${b} (observed dy=${dy.toFixed(3)}).`)
    }
    if (ya != null && yb != null) {
      if (ya < yb - 0.04) {
        hints.push(`${label}: above(${a}, ${b}) would PASS on TARGET; below(${a}, ${b}) would FAIL.`)
      } else if (ya > yb + 0.04) {
        hints.push(`${label}: below(${a}, ${b}) would PASS on TARGET; above(${a}, ${b}) would FAIL.`)
      } else {
        hints.push(`${label}: yWithin(${a}, ${b}) with maxDelta >= ${dy.toFixed(2)} would PASS; above/below likely FAIL.`)
      }
    }
  }

  const eyeY = minEyeY(target)
  if (eyeY != null) {
    for (const arm of ['LEFT_ELBOW', 'RIGHT_ELBOW', 'LEFT_WRIST', 'RIGHT_WRIST'] as const) {
      const y = findLandmarkY(target, arm)
      if (y == null) continue
      if (y < eyeY - 0.03) {
        hints.push(`TARGET: ${arm} is above eye line (y=${y.toFixed(3)} vs eyes ${eyeY.toFixed(3)}) — use aboveEyeLine for ${arm} in rules.up.`)
      }
    }
  }

  const restWrist = findLandmarkY(rest, 'LEFT_WRIST')
  const restShoulder = findLandmarkY(rest, 'LEFT_SHOULDER')
  if (restWrist != null && restShoulder != null && restWrist > restShoulder + 0.03) {
    hints.push(
      'REST: wrists below shoulders — rules.rest can use below(WRIST, SHOULDER) or omit rules.rest for app default.',
    )
  }

  return hints
}

export function buildUserPrompt(args: {
  exerciseTitle: string
  goalId: string
  repsCount: number
  rest: Snapshot
  target: Snapshot
}): string {
  const { exerciseTitle, goalId, repsCount, rest, target } = args
  const payload = {
    exercise: {
      title: exerciseTitle,
      goalId,
      repsCount,
    },
    rest: { landmarks: compactLandmarks(rest) },
    target: { landmarks: compactLandmarks(target) },
  }
  const hints = buildLandmarkHints(rest, target)
  const hintBlock =
    hints.length > 0
      ? ['', 'Landmark hints (use these when picking operators and maxDelta):', ...hints.map((h) => `- ${h}`)]
      : []

  return [
    'Generate a `pose_config` (rules_engine_v1) for the exercise below.',
    'Use `repsTarget` equal to the supplied `repsCount`.',
    'Write all `copy` strings in Dutch, child-friendly tone.',
    ...hintBlock,
    '',
    '```json',
    JSON.stringify(payload, null, 2),
    '```',
  ].join('\n')
}
