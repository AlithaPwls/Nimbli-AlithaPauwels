// Validator for AI-generated pose_config JSON.
//
// Checks the structure against the actual `rules_engine_v1` shape consumed by
// `src/lib/kind/poseRulesEngine.js`. Returns either the (lightly normalized)
// config or a list of human-readable errors so the Edge Function can decide
// to retry or fail.

const POSE_LANDMARK_NAMES = new Set([
  'NOSE',
  'LEFT_EYE_INNER', 'LEFT_EYE', 'LEFT_EYE_OUTER',
  'RIGHT_EYE_INNER', 'RIGHT_EYE', 'RIGHT_EYE_OUTER',
  'LEFT_EAR', 'RIGHT_EAR',
  'MOUTH_LEFT', 'MOUTH_RIGHT',
  'LEFT_SHOULDER', 'RIGHT_SHOULDER',
  'LEFT_ELBOW', 'RIGHT_ELBOW',
  'LEFT_WRIST', 'RIGHT_WRIST',
  'LEFT_PINKY', 'RIGHT_PINKY',
  'LEFT_INDEX', 'RIGHT_INDEX',
  'LEFT_THUMB', 'RIGHT_THUMB',
  'LEFT_HIP', 'RIGHT_HIP',
  'LEFT_KNEE', 'RIGHT_KNEE',
  'LEFT_ANKLE', 'RIGHT_ANKLE',
  'LEFT_HEEL', 'RIGHT_HEEL',
  'LEFT_FOOT_INDEX', 'RIGHT_FOOT_INDEX',
])

// Ops the runtime accepts (`op.trim().toLowerCase()` is applied in the engine,
// so all variants below collapse to a normalized form).
const OP_ALIASES: Record<string, string> = {
  visible: 'visible',
  above: 'above',
  below: 'below',
  aboveeyeline: 'aboveEyeLine',
  above_eye_line: 'aboveEyeLine',
  ywithin: 'yWithin',
  y_within: 'yWithin',
  distance: 'distance',
  angle: 'angle',
  collinear: 'collinear',
  allof: 'allOf',
  all_of: 'allOf',
  anyof: 'anyOf',
  any_of: 'anyOf',
  not: 'not',
}

const COPY_KEYS = ['waitUp', 'holding', 'waitDown', 'complete'] as const

/** Landmarks that must not appear in yWithin pairs (head/face — never level with shoulders in image space). */
const YWITHIN_FORBIDDEN = new Set([
  'NOSE',
  'LEFT_EYE_INNER',
  'LEFT_EYE',
  'LEFT_EYE_OUTER',
  'RIGHT_EYE_INNER',
  'RIGHT_EYE',
  'RIGHT_EYE_OUTER',
  'LEFT_EAR',
  'RIGHT_EAR',
  'MOUTH_LEFT',
  'MOUTH_RIGHT',
])

/** Finger, toe, heel — use WRIST / ANKLE instead (matches LANDMARK_GUIDE in prompt.ts). */
const DISCOURAGED_LANDMARKS = new Set([
  'LEFT_FOOT_INDEX',
  'RIGHT_FOOT_INDEX',
  'LEFT_HEEL',
  'RIGHT_HEEL',
  'LEFT_PINKY',
  'RIGHT_PINKY',
  'LEFT_INDEX',
  'RIGHT_INDEX',
  'LEFT_THUMB',
  'RIGHT_THUMB',
  'LEFT_EAR',
  'RIGHT_EAR',
  'MOUTH_LEFT',
  'MOUTH_RIGHT',
])

const MAX_VISIBLE_POINTS = 6
const MAX_UP_RULES = 8

type CopyLine = { line1: string; line2: string }
type Rule = Record<string, unknown> & { op: string }

export type ValidPoseConfig = {
  version: 1
  type: 'rules_engine_v1'
  repsTarget: number
  thresholds?: Record<string, number>
  timing?: Record<string, number>
  rules: { up: Rule[]; rest?: Rule[] }
  copy: { waitUp: CopyLine; holding: CopyLine; waitDown: CopyLine; complete: CopyLine }
}

export type ValidationResult =
  | { ok: true; value: ValidPoseConfig }
  | { ok: false; errors: string[] }

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v)
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v)
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0
}

function normalizeLandmarkName(v: unknown): string | null {
  if (typeof v === 'number') return null
  if (typeof v !== 'string') return null
  return v.trim().toUpperCase()
}

function flattenRules(rules: unknown): Rule[] {
  if (!rules) return []
  if (Array.isArray(rules)) {
    const out: Rule[] = []
    for (const r of rules) out.push(...flattenRules(r))
    return out
  }
  if (!isPlainObject(rules)) return []
  const rawOp = typeof rules.op === 'string' ? rules.op.trim().toLowerCase() : ''
  const op = OP_ALIASES[rawOp]
  if (op === 'allOf' || op === 'anyOf') {
    return flattenRules(rules.rules)
  }
  if (op === 'not' && rules.rule) {
    return flattenRules([rules.rule])
  }
  if (typeof rules.op === 'string') {
    return [rules as Rule]
  }
  return []
}

function validatePoseConfigSemantics(input: Record<string, unknown>, errors: string[]): void {
  const upFlat = flattenRules(isPlainObject(input.rules) ? input.rules.up : null)
  const restFlat = flattenRules(isPlainObject(input.rules) ? input.rules.rest : null)

  if (upFlat.length > MAX_UP_RULES) {
    errors.push(
      `rules.up: too many rules (${upFlat.length}); keep at most ${MAX_UP_RULES} (prefer 3–6 simple checks).`,
    )
  }

  let collinearCount = 0
  let hasYWithinOrAngle = false

  for (let i = 0; i < upFlat.length; i++) {
    const rule = upFlat[i]
    const path = `rules.up[${i}]`
    const rawOp = typeof rule.op === 'string' ? rule.op.trim().toLowerCase() : ''
    const op = OP_ALIASES[rawOp]

    if (op === 'visible' && Array.isArray(rule.points)) {
      if (rule.points.length > MAX_VISIBLE_POINTS) {
        errors.push(
          `${path}.points: at most ${MAX_VISIBLE_POINTS} landmarks per visible rule (got ${rule.points.length}).`,
        )
      }
    }

    if (op === 'above' || op === 'below') {
      const a = normalizeLandmarkName(rule.a)
      const b = normalizeLandmarkName(rule.b)
      const involvesNose = a === 'NOSE' || b === 'NOSE'
      const involvesTorso =
        (a && (a.includes('SHOULDER') || a.includes('ELBOW') || a.includes('WRIST') || a.includes('HIP'))) ||
        (b && (b.includes('SHOULDER') || b.includes('ELBOW') || b.includes('WRIST') || b.includes('HIP')))
      if (involvesNose && involvesTorso) {
        errors.push(
          `${path}: do not use ${op} between head (NOSE) and body landmarks — use aboveEyeLine for arms-up or yWithin for level body parts.`,
        )
      }
    }

    if (op === 'yWithin') {
      hasYWithinOrAngle = true
      const a = normalizeLandmarkName(rule.a)
      const b = normalizeLandmarkName(rule.b)
      if (a && YWITHIN_FORBIDDEN.has(a)) {
        errors.push(`${path}: yWithin must not use head landmark "${a}" — use aboveEyeLine, above, or below instead.`)
      }
      if (b && YWITHIN_FORBIDDEN.has(b)) {
        errors.push(`${path}: yWithin must not use head landmark "${b}" — use aboveEyeLine, above, or below instead.`)
      }
      const maxDelta = isFiniteNumber(rule.maxDelta)
        ? rule.maxDelta
        : isFiniteNumber(rule.tolerance)
          ? rule.tolerance
          : 0.04
      if (a && b && maxDelta < 0.06) {
        const shoulderNose =
          (a.includes('SHOULDER') && b === 'NOSE') || (b.includes('SHOULDER') && a === 'NOSE')
        if (shoulderNose) {
          errors.push(
            `${path}: yWithin between shoulder and NOSE is invalid (use aboveEyeLine for arms-up, or omit).`,
          )
        }
      }
    }

    if (op === 'angle') hasYWithinOrAngle = true

    if (op === 'collinear') {
      collinearCount += 1
      const tol = isFiniteNumber(rule.tol)
        ? rule.tol
        : isFiniteNumber(rule.tolerance)
          ? rule.tolerance
          : null
      if (tol != null && tol < 0.05) {
        errors.push(`${path}: collinear tol should be at least 0.05 for camera noise (got ${tol}).`)
      }
    }
  }

  if (collinearCount >= 2 && !hasYWithinOrAngle) {
    errors.push(
      'rules.up: multiple collinear rules without yWithin/angle — add body-line checks (yWithin shoulder–hip, angle hip–knee–ankle).',
    )
  }

  for (let i = 0; i < restFlat.length; i++) {
    const rule = restFlat[i]
    const path = `rules.rest[${i}]`
    const rawOp = typeof rule.op === 'string' ? rule.op.trim().toLowerCase() : ''
    const op = OP_ALIASES[rawOp]
    if (op !== 'yWithin') continue
    const a = normalizeLandmarkName(rule.a)
    const b = normalizeLandmarkName(rule.b)
    if ((a && YWITHIN_FORBIDDEN.has(a)) || (b && YWITHIN_FORBIDDEN.has(b))) {
      errors.push(
        `${path}: yWithin with head landmarks is invalid for rest — use below(wrist, shoulder) or omit rules.rest.`,
      )
    }
  }
}

function validateLandmarkRef(v: unknown, path: string, errors: string[]): void {
  if (typeof v === 'number') {
    if (!Number.isInteger(v) || v < 0 || v > 32) {
      errors.push(`${path}: numeric landmark must be an integer in 0..32 (got ${v}).`)
    }
    return
  }
  if (typeof v === 'string') {
    const key = v.trim().toUpperCase()
    if (!POSE_LANDMARK_NAMES.has(key)) {
      errors.push(`${path}: unknown landmark name "${v}".`)
      return
    }
    if (DISCOURAGED_LANDMARKS.has(key)) {
      const hint =
        key.includes('FOOT') || key.includes('HEEL')
          ? 'use LEFT_ANKLE / RIGHT_ANKLE for feet'
          : 'use LEFT_WRIST / RIGHT_WRIST for hands'
      errors.push(`${path}: do not use "${key}" — ${hint}.`)
    }
    return
  }
  errors.push(`${path}: landmark must be a string name or integer index.`)
}

function validateOptionalNumber(
  obj: Record<string, unknown>,
  key: string,
  path: string,
  errors: string[],
): void {
  if (obj[key] === undefined) return
  if (!isFiniteNumber(obj[key])) {
    errors.push(`${path}.${key}: must be a finite number when present.`)
  }
}

function validateRequiredNumber(
  obj: Record<string, unknown>,
  key: string,
  path: string,
  errors: string[],
): void {
  if (!isFiniteNumber(obj[key])) {
    errors.push(`${path}.${key}: required, must be a finite number.`)
  }
}

function validateRule(rule: unknown, path: string, errors: string[]): void {
  if (!isPlainObject(rule)) {
    errors.push(`${path}: rule must be an object.`)
    return
  }
  const rawOp = rule.op
  if (typeof rawOp !== 'string') {
    errors.push(`${path}.op: must be a string.`)
    return
  }
  const normalizedOp = OP_ALIASES[rawOp.trim().toLowerCase()]
  if (!normalizedOp) {
    errors.push(
      `${path}.op: unknown operator "${rawOp}". Allowed: visible, above, below, aboveEyeLine, yWithin, distance, angle, collinear, allOf, anyOf, not.`,
    )
    return
  }

  switch (normalizedOp) {
    case 'visible': {
      const points = rule.points
      if (!Array.isArray(points) || points.length === 0) {
        errors.push(`${path}.points: must be a non-empty array of landmark refs.`)
        return
      }
      points.forEach((p, i) => validateLandmarkRef(p, `${path}.points[${i}]`, errors))
      return
    }
    case 'above':
    case 'below': {
      validateLandmarkRef(rule.a, `${path}.a`, errors)
      validateLandmarkRef(rule.b, `${path}.b`, errors)
      validateOptionalNumber(rule, 'delta', path, errors)
      return
    }
    case 'aboveEyeLine': {
      validateLandmarkRef(rule.a, `${path}.a`, errors)
      validateOptionalNumber(rule, 'delta', path, errors)
      if (rule.eyeIndices !== undefined) {
        if (!Array.isArray(rule.eyeIndices) || rule.eyeIndices.length === 0) {
          errors.push(`${path}.eyeIndices: must be a non-empty array when present.`)
        } else {
          rule.eyeIndices.forEach((idx, i) => {
            if (!Number.isInteger(idx) || (idx as number) < 0 || (idx as number) > 32) {
              errors.push(`${path}.eyeIndices[${i}]: must be an integer in 0..32.`)
            }
          })
        }
      }
      return
    }
    case 'yWithin': {
      validateLandmarkRef(rule.a, `${path}.a`, errors)
      validateLandmarkRef(rule.b, `${path}.b`, errors)
      validateOptionalNumber(rule, 'maxDelta', path, errors)
      validateOptionalNumber(rule, 'tolerance', path, errors)
      return
    }
    case 'distance': {
      validateLandmarkRef(rule.a, `${path}.a`, errors)
      validateLandmarkRef(rule.b, `${path}.b`, errors)
      validateRequiredNumber(rule, 'max', path, errors)
      return
    }
    case 'angle': {
      validateLandmarkRef(rule.a, `${path}.a`, errors)
      validateLandmarkRef(rule.b, `${path}.b`, errors)
      validateLandmarkRef(rule.c, `${path}.c`, errors)
      validateRequiredNumber(rule, 'minDeg', path, errors)
      validateRequiredNumber(rule, 'maxDeg', path, errors)
      if (isFiniteNumber(rule.minDeg) && isFiniteNumber(rule.maxDeg) && rule.minDeg > rule.maxDeg) {
        errors.push(`${path}: minDeg (${rule.minDeg}) must be <= maxDeg (${rule.maxDeg}).`)
      }
      return
    }
    case 'collinear': {
      validateLandmarkRef(rule.a, `${path}.a`, errors)
      validateLandmarkRef(rule.b, `${path}.b`, errors)
      validateLandmarkRef(rule.c, `${path}.c`, errors)
      if (rule.tol === undefined && rule.tolerance === undefined) {
        errors.push(`${path}: requires "tol" (or "tolerance") as a finite number.`)
      } else {
        validateOptionalNumber(rule, 'tol', path, errors)
        validateOptionalNumber(rule, 'tolerance', path, errors)
      }
      return
    }
    case 'allOf':
    case 'anyOf': {
      const inner = rule.rules
      if (!Array.isArray(inner) || inner.length === 0) {
        errors.push(`${path}.rules: ${normalizedOp} requires a non-empty rules array.`)
        return
      }
      inner.forEach((r, i) => validateRule(r, `${path}.rules[${i}]`, errors))
      return
    }
    case 'not': {
      if (rule.rule === undefined) {
        errors.push(`${path}.rule: not requires an inner rule.`)
        return
      }
      validateRule(rule.rule, `${path}.rule`, errors)
      return
    }
  }
}

function validateRuleArray(value: unknown, path: string, errors: string[]): void {
  if (Array.isArray(value)) {
    if (value.length === 0) {
      errors.push(`${path}: must contain at least one rule.`)
      return
    }
    value.forEach((r, i) => validateRule(r, `${path}[${i}]`, errors))
    return
  }
  // The engine also accepts a single rule object; treat it the same way.
  if (isPlainObject(value)) {
    validateRule(value, path, errors)
    return
  }
  errors.push(`${path}: must be a rule object or a non-empty array of rules.`)
}

function validateCopyBlock(value: unknown, path: string, errors: string[]): void {
  if (!isPlainObject(value)) {
    errors.push(`${path}: must be an object with line1 and line2 strings.`)
    return
  }
  if (!isNonEmptyString(value.line1)) errors.push(`${path}.line1: required non-empty string.`)
  if (!isNonEmptyString(value.line2)) errors.push(`${path}.line2: required non-empty string.`)
}

function validateOptionalNumberMap(
  value: unknown,
  path: string,
  errors: string[],
): void {
  if (value === undefined) return
  if (!isPlainObject(value)) {
    errors.push(`${path}: must be an object of numbers when present.`)
    return
  }
  for (const [k, v] of Object.entries(value)) {
    if (!isFiniteNumber(v)) {
      errors.push(`${path}.${k}: must be a finite number.`)
    }
  }
}

export function validatePoseConfig(input: unknown): ValidationResult {
  const errors: string[] = []

  if (!isPlainObject(input)) {
    return { ok: false, errors: ['root: expected a JSON object.'] }
  }

  if (input.version !== 1) {
    errors.push(`version: must be the integer 1 (got ${JSON.stringify(input.version)}).`)
  }
  if (input.type !== 'rules_engine_v1') {
    errors.push(`type: must be "rules_engine_v1" (got ${JSON.stringify(input.type)}).`)
  }

  if (!Number.isInteger(input.repsTarget) || (input.repsTarget as number) < 1 || (input.repsTarget as number) > 50) {
    errors.push(`repsTarget: must be an integer in 1..50 (got ${JSON.stringify(input.repsTarget)}).`)
  }

  validateOptionalNumberMap(input.thresholds, 'thresholds', errors)
  validateOptionalNumberMap(input.timing, 'timing', errors)

  if (!isPlainObject(input.rules)) {
    errors.push('rules: must be an object with `up` (and optional `rest`).')
  } else {
    if (input.rules.up === undefined) {
      errors.push('rules.up: required (rule object or non-empty array of rules).')
    } else {
      validateRuleArray(input.rules.up, 'rules.up', errors)
    }
    if (input.rules.rest !== undefined) {
      validateRuleArray(input.rules.rest, 'rules.rest', errors)
    }
  }

  if (!isPlainObject(input.copy)) {
    errors.push('copy: must be an object with waitUp, holding, waitDown, complete.')
  } else {
    for (const k of COPY_KEYS) {
      if (input.copy[k] === undefined) {
        errors.push(`copy.${k}: required.`)
      } else {
        validateCopyBlock(input.copy[k], `copy.${k}`, errors)
      }
    }
  }

  if (errors.length === 0) {
    validatePoseConfigSemantics(input, errors)
  }

  if (errors.length > 0) return { ok: false, errors }
  return { ok: true, value: input as unknown as ValidPoseConfig }
}
