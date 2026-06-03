-- Fix AI-generated pose_config for Regenboog Stretch and Plank (invalid yWithin shoulder–nose, etc.)

update public.exercises
set
  pose_config = $json$
{
  "version": 1,
  "type": "rules_engine_v1",
  "repsTarget": 10,
  "thresholds": {
    "visMin": 0.55,
    "deltaY": 0.04,
    "aboveEyesDelta": 0.04
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
    "waitUp": { "line1": "Regenboog Strekking", "line2": "Strek je armen omhoog boven je ogen." },
    "holding": { "line1": "Hou vol!", "line2": "Nog {secondsLeft} s — blijf staan." },
    "waitDown": { "line1": "Klaar", "line2": "Laat je armen rustig zakken." },
    "complete": { "line1": "Klaar!", "line2": "Super — je deed het geweldig!" }
  }
}
$json$::jsonb
where
  is_archived = false
  and pose_enabled = true
  and lower(title) like '%regenboog%';

update public.exercises
set
  pose_config = $json$
{
  "version": 1,
  "type": "rules_engine_v1",
  "repsTarget": 10,
  "thresholds": {
    "visMin": 0.55,
    "deltaY": 0.04,
    "kneeHipLevelMaxDelta": 0.06
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
    "up": [
      { "op": "visible", "points": ["LEFT_SHOULDER", "RIGHT_SHOULDER", "LEFT_HIP", "RIGHT_HIP", "LEFT_ELBOW", "RIGHT_ELBOW"] },
      { "op": "yWithin", "a": "LEFT_SHOULDER", "b": "LEFT_HIP", "maxDelta": 0.06 },
      { "op": "yWithin", "a": "RIGHT_SHOULDER", "b": "RIGHT_HIP", "maxDelta": 0.06 },
      { "op": "yWithin", "a": "LEFT_HIP", "b": "RIGHT_HIP", "maxDelta": 0.06 },
      { "op": "angle", "a": "LEFT_SHOULDER", "b": "LEFT_HIP", "c": "LEFT_KNEE", "minDeg": 155, "maxDeg": 180 },
      { "op": "angle", "a": "RIGHT_SHOULDER", "b": "RIGHT_HIP", "c": "RIGHT_KNEE", "minDeg": 155, "maxDeg": 180 }
    ],
    "rest": [
      { "op": "below", "a": "LEFT_WRIST", "b": "LEFT_SHOULDER", "delta": 0.045 },
      { "op": "below", "a": "RIGHT_WRIST", "b": "RIGHT_SHOULDER", "delta": 0.045 }
    ]
  },
  "copy": {
    "waitUp": { "line1": "Plank", "line2": "Ga op je handen en tenen. Houd je lichaam recht!" },
    "holding": { "line1": "Hou vol!", "line2": "Nog {secondsLeft} s — blijf stil staan." },
    "waitDown": { "line1": "Klaar", "line2": "Laat je lichaam rustig zakken." },
    "complete": { "line1": "Klaar!", "line2": "Goed gedaan — je bent sterk!" }
  }
}
$json$::jsonb
where
  is_archived = false
  and pose_enabled = true
  and lower(title) = 'plank';
