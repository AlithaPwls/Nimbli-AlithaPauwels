-- Stretch naar de sterren: volledige rules_engine_v1 pose_config (pariteit met preset in code).
-- Pas de WHERE-clause aan als jullie titel anders is. Vereist pose_config.version (DB constraint).

update public.exercises
set
  pose_enabled = true,
  pose_config = $json$
{
  "version": 1,
  "type": "rules_engine_v1",
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
    "betweenReps": {
      "line1": "Rep {done} van {repsTarget} — goed zo!",
      "line2": "Nog {remaining} herhaling(en) te gaan. Straks: rustpositie, daarna rep {nextRep}."
    },
    "waitRest": {
      "line1": "Rustpositie",
      "line2": "Laat je armen langs je zij hangen. Daarna: rep {nextRep} van {repsTarget} (ellebogen en polsen boven je ogen)."
    },
    "waitUp": {
      "line1": "Stretch naar de sterren",
      "line2": "Rep {nextRep} van {repsTarget} — strek omhoog: ellebogen én polsen boven je ogen."
    },
    "holding": {
      "line1": "Rep {nextRep} van {repsTarget} — houd vol!",
      "line2": ""
    },
    "waitDown": {
      "line1": "Rep {nextRep} van {repsTarget}",
      "line2": "Laat je armen rustig terug naar je zij zakken (rust voor de volgende rep)."
    },
    "complete": {
      "line1": "Alle {repsTarget} herhalingen klaar!",
      "line2": "Super gedaan — je hebt de stretch volbracht."
    }
  }
}
$json$::jsonb
where
  is_archived = false
  and (
    lower(title) like '%stretch%sterren%'
    or lower(title) like '%stretch%naar%de%sterren%'
  );
