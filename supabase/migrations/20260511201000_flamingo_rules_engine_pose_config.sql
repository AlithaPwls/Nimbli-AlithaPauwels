-- Flamingo (linkerbeen): zelfde logica als `flamingoPose.js` via rules_engine_v1 + nieuwe op `yWithin`.
-- Zet `pose_config.type` op `rules_engine_v1` (niet `flamingo_left_90`), `pose_enabled = true`.
-- Pas de WHERE-clause aan als jullie titel anders is.

update public.exercises
set
  pose_enabled = true,
  pose_config = $json$
{
  "version": 1,
  "type": "rules_engine_v1",
  "repsTarget": 1,
  "thresholds": {
    "visMin": 0.55,
    "deltaY": 0.04,
    "kneeHipLevelMaxDelta": 0.04,
    "kneeAngleMinDeg": 70,
    "kneeAngleMaxDeg": 110
  },
  "timing": {
    "stableUpMs": 400,
    "holdGraceMs": 500,
    "holdRequiredMs": 3000,
    "stableDownMs": 350,
    "betweenRepsMs": 1600,
    "restStableMs": 320
  },
  "rules": {
    "up": [
      { "op": "visible", "points": ["LEFT_HIP", "LEFT_KNEE", "LEFT_ANKLE"] },
      { "op": "yWithin", "a": "LEFT_KNEE", "b": "LEFT_HIP" },
      {
        "op": "angle",
        "a": "LEFT_HIP",
        "b": "LEFT_KNEE",
        "c": "LEFT_ANKLE",
        "minDeg": 70,
        "maxDeg": 110
      }
    ]
  },
  "copy": {
    "waitUp": {
      "line1": "Flamingo",
      "line2": "Zoek balans: voet tegen je knie en blijf stil."
    },
    "holding": {
      "line1": "Hou vol!",
      "line2": "Nog {secondsLeft} s — blijf stil staan."
    },
    "waitDown": {
      "line1": "Klaar",
      "line2": "Ga rustig terug naar een normale stand."
    },
    "complete": {
      "line1": "Klaar!",
      "line2": "Super — je hield je balans."
    }
  }
}
$json$::jsonb
where
  is_archived = false
  and lower(title) like '%flamingo%';
