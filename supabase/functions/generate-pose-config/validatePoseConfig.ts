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

  if (errors.length > 0) return { ok: false, errors }
  return { ok: true, value: input as unknown as ValidPoseConfig }
}
