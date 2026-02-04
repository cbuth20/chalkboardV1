-- ================================================================
-- TEST PLAYS FOR GAMES CENTER
-- 8 plays (4 offense, 4 defense) for testing question generation
-- Replace USER_ID and ORG_ID with your actual values
-- ================================================================

-- Set your user_id and org_id here
\set user_id '82844ede-4ad2-44be-9307-bf7798926a1e'
\set org_id '986d0f15-e926-4f76-89e1-bf7c7f731923'

-- ================================================================
-- OFFENSIVE PLAYS
-- ================================================================

-- 1. Shotgun Spread - Slant Concept (Quick Passing)
INSERT INTO player_plays (
  id, user_id, org_id, name, short_name, play_type, concept,
  formation_name, diagram_type, side_of_ball, unit, content_status,
  diagram_data
) VALUES (
  gen_random_uuid(),
  :'user_id',
  :'org_id',
  'Shotgun Spread - Quick Slants',
  'Quick Slants',
  'PASS',
  'Slant Concept',
  'Shotgun Spread',
  'pass',
  'offense',
  'O',
  'draft',
  '{
    "mode": "pass",
    "routes": [
      {"points": [{"x": 30, "y": 61}, {"x": 38, "y": 50}], "playerId": "wr1"},
      {"points": [{"x": 70, "y": 61}, {"x": 62, "y": 50}], "playerId": "wr3"},
      {"points": [{"x": 59, "y": 61}, {"x": 57, "y": 50}], "playerId": "wr2"}
    ],
    "blocking": [],
    "defensePlayers": [
      {"x": 30, "y": 48, "id": "cb1", "side": "defense", "group": "secondary", "label": "CB"},
      {"x": 70, "y": 48, "id": "cb2", "side": "defense", "group": "secondary", "label": "CB"},
      {"x": 50, "y": 35, "id": "fs", "side": "defense", "group": "secondary", "label": "FS"},
      {"x": 58, "y": 42, "id": "ss", "side": "defense", "group": "secondary", "label": "SS"},
      {"x": 50, "y": 54, "id": "mlb", "side": "defense", "group": "linebacker", "label": "MLB"},
      {"x": 40, "y": 59, "id": "de1", "side": "defense", "group": "line", "label": "DE"},
      {"x": 60, "y": 59, "id": "de2", "side": "defense", "group": "line", "label": "DE"}
    ],
    "offensePlayers": [
      {"x": 50, "y": 70, "id": "qb", "side": "offense", "group": "backfield", "label": "QB"},
      {"x": 45, "y": 70, "id": "rb", "side": "offense", "group": "backfield", "label": "RB"},
      {"x": 30, "y": 61, "id": "wr1", "side": "offense", "group": "skill", "label": "X"},
      {"x": 70, "y": 61, "id": "wr3", "side": "offense", "group": "skill", "label": "Z"},
      {"x": 59, "y": 61, "id": "wr2", "side": "offense", "group": "skill", "label": "H"},
      {"x": 42, "y": 61, "id": "lt", "side": "offense", "group": "line", "label": "LT"},
      {"x": 46, "y": 61, "id": "lg", "side": "offense", "group": "line", "label": "LG"},
      {"x": 50, "y": 61, "id": "c", "side": "offense", "group": "line", "label": "C"},
      {"x": 54, "y": 61, "id": "rg", "side": "offense", "group": "line", "label": "RG"},
      {"x": 58, "y": 61, "id": "rt", "side": "offense", "group": "line", "label": "RT"}
    ]
  }'::jsonb
);

-- 2. I-Form - Power Run
INSERT INTO player_plays (
  id, user_id, org_id, name, short_name, play_type, concept,
  formation_name, diagram_type, side_of_ball, unit, content_status,
  diagram_data
) VALUES (
  gen_random_uuid(),
  :'user_id',
  :'org_id',
  'I-Form Power Right',
  'Power Right',
  'RUN',
  'Power',
  'I-Formation',
  'pass',
  'offense',
  'O',
  'draft',
  '{
    "mode": "pass",
    "routes": [],
    "blocking": [
      {"from": "lg", "to": {"x": 52, "y": 55}},
      {"from": "fb", "to": {"x": 56, "y": 58}}
    ],
    "ballCarrierPath": [{"x": 45, "y": 68}, {"x": 52, "y": 62}, {"x": 56, "y": 50}],
    "defensePlayers": [
      {"x": 50, "y": 54, "id": "mlb", "side": "defense", "group": "linebacker", "label": "MLB"},
      {"x": 42, "y": 54, "id": "wlb", "side": "defense", "group": "linebacker", "label": "WLB"},
      {"x": 58, "y": 54, "id": "slb", "side": "defense", "group": "linebacker", "label": "SLB"},
      {"x": 40, "y": 59, "id": "de1", "side": "defense", "group": "line", "label": "DE"},
      {"x": 60, "y": 59, "id": "de2", "side": "defense", "group": "line", "label": "DE"},
      {"x": 46, "y": 59, "id": "dt1", "side": "defense", "group": "line", "label": "DT"},
      {"x": 54, "y": 59, "id": "dt2", "side": "defense", "group": "line", "label": "DT"}
    ],
    "offensePlayers": [
      {"x": 50, "y": 70, "id": "qb", "side": "offense", "group": "backfield", "label": "QB"},
      {"x": 45, "y": 68, "id": "rb", "side": "offense", "group": "backfield", "label": "RB"},
      {"x": 50, "y": 66, "id": "fb", "side": "offense", "group": "backfield", "label": "FB"},
      {"x": 30, "y": 61, "id": "wr1", "side": "offense", "group": "skill", "label": "X"},
      {"x": 70, "y": 61, "id": "wr3", "side": "offense", "group": "skill", "label": "Z"},
      {"x": 42, "y": 61, "id": "lt", "side": "offense", "group": "line", "label": "LT"},
      {"x": 46, "y": 61, "id": "lg", "side": "offense", "group": "line", "label": "LG"},
      {"x": 50, "y": 61, "id": "c", "side": "offense", "group": "line", "label": "C"},
      {"x": 54, "y": 61, "id": "rg", "side": "offense", "group": "line", "label": "RG"},
      {"x": 58, "y": 61, "id": "rt", "side": "offense", "group": "line", "label": "RT"}
    ]
  }'::jsonb
);

-- 3. Trips Right - Mesh Concept
INSERT INTO player_plays (
  id, user_id, org_id, name, short_name, play_type, concept,
  formation_name, diagram_type, side_of_ball, unit, content_status,
  diagram_data
) VALUES (
  gen_random_uuid(),
  :'user_id',
  :'org_id',
  'Trips Right - Mesh Concept',
  'Mesh',
  'PASS',
  'Mesh',
  'Trips Right',
  'pass',
  'offense',
  'O',
  'draft',
  '{
    "mode": "pass",
    "routes": [
      {"points": [{"x": 60, "y": 61}, {"x": 40, "y": 50}], "playerId": "wr1"},
      {"points": [{"x": 70, "y": 61}, {"x": 50, "y": 50}], "playerId": "wr3"},
      {"points": [{"x": 65, "y": 61}, {"x": 65, "y": 35}], "playerId": "wr2"}
    ],
    "blocking": [],
    "defensePlayers": [
      {"x": 30, "y": 48, "id": "cb1", "side": "defense", "group": "secondary", "label": "CB"},
      {"x": 70, "y": 48, "id": "cb2", "side": "defense", "group": "secondary", "label": "CB"},
      {"x": 50, "y": 35, "id": "fs", "side": "defense", "group": "secondary", "label": "FS"},
      {"x": 58, "y": 42, "id": "ss", "side": "defense", "group": "secondary", "label": "SS"},
      {"x": 50, "y": 54, "id": "mlb", "side": "defense", "group": "linebacker", "label": "MLB"}
    ],
    "offensePlayers": [
      {"x": 50, "y": 70, "id": "qb", "side": "offense", "group": "backfield", "label": "QB"},
      {"x": 45, "y": 70, "id": "rb", "side": "offense", "group": "backfield", "label": "RB"},
      {"x": 30, "y": 61, "id": "wr4", "side": "offense", "group": "skill", "label": "X"},
      {"x": 60, "y": 61, "id": "wr1", "side": "offense", "group": "skill", "label": "H"},
      {"x": 65, "y": 61, "id": "wr2", "side": "offense", "group": "skill", "label": "Y"},
      {"x": 70, "y": 61, "id": "wr3", "side": "offense", "group": "skill", "label": "Z"},
      {"x": 42, "y": 61, "id": "lt", "side": "offense", "group": "line", "label": "LT"},
      {"x": 46, "y": 61, "id": "lg", "side": "offense", "group": "line", "label": "LG"},
      {"x": 50, "y": 61, "id": "c", "side": "offense", "group": "line", "label": "C"},
      {"x": 54, "y": 61, "id": "rg", "side": "offense", "group": "line", "label": "RG"},
      {"x": 58, "y": 61, "id": "rt", "side": "offense", "group": "line", "label": "RT"}
    ]
  }'::jsonb
);

-- 4. Empty Formation - Spacing Concept
INSERT INTO player_plays (
  id, user_id, org_id, name, short_name, play_type, concept,
  formation_name, diagram_type, side_of_ball, unit, content_status,
  diagram_data
) VALUES (
  gen_random_uuid(),
  :'user_id',
  :'org_id',
  'Empty - Spacing Concept',
  'Spacing',
  'PASS',
  'Spacing',
  'Empty Spread',
  'pass',
  'offense',
  'O',
  'draft',
  '{
    "mode": "pass",
    "routes": [
      {"points": [{"x": 30, "y": 61}, {"x": 32, "y": 45}], "playerId": "wr1"},
      {"points": [{"x": 40, "y": 61}, {"x": 42, "y": 42}], "playerId": "wr2"},
      {"points": [{"x": 60, "y": 61}, {"x": 58, "y": 42}], "playerId": "wr3"},
      {"points": [{"x": 70, "y": 61}, {"x": 68, "y": 45}], "playerId": "wr4"},
      {"points": [{"x": 59, "y": 70}, {"x": 56, "y": 55}], "playerId": "rb"}
    ],
    "blocking": [],
    "defensePlayers": [
      {"x": 30, "y": 48, "id": "cb1", "side": "defense", "group": "secondary", "label": "CB"},
      {"x": 70, "y": 48, "id": "cb2", "side": "defense", "group": "secondary", "label": "CB"},
      {"x": 50, "y": 35, "id": "fs", "side": "defense", "group": "secondary", "label": "FS"},
      {"x": 50, "y": 54, "id": "mlb", "side": "defense", "group": "linebacker", "label": "MLB"},
      {"x": 42, "y": 54, "id": "wlb", "side": "defense", "group": "linebacker", "label": "WLB"},
      {"x": 58, "y": 54, "id": "slb", "side": "defense", "group": "linebacker", "label": "SLB"}
    ],
    "offensePlayers": [
      {"x": 50, "y": 70, "id": "qb", "side": "offense", "group": "backfield", "label": "QB"},
      {"x": 59, "y": 70, "id": "rb", "side": "offense", "group": "backfield", "label": "RB"},
      {"x": 30, "y": 61, "id": "wr1", "side": "offense", "group": "skill", "label": "X"},
      {"x": 40, "y": 61, "id": "wr2", "side": "offense", "group": "skill", "label": "H"},
      {"x": 60, "y": 61, "id": "wr3", "side": "offense", "group": "skill", "label": "Y"},
      {"x": 70, "y": 61, "id": "wr4", "side": "offense", "group": "skill", "label": "Z"},
      {"x": 42, "y": 61, "id": "lt", "side": "offense", "group": "line", "label": "LT"},
      {"x": 46, "y": 61, "id": "lg", "side": "offense", "group": "line", "label": "LG"},
      {"x": 50, "y": 61, "id": "c", "side": "offense", "group": "line", "label": "C"},
      {"x": 54, "y": 61, "id": "rg", "side": "offense", "group": "line", "label": "RG"},
      {"x": 58, "y": 61, "id": "rt", "side": "offense", "group": "line", "label": "RT"}
    ]
  }'::jsonb
);

-- ================================================================
-- DEFENSIVE PLAYS
-- ================================================================

-- 5. Cover 3 Buzz (Cornerback drops to flat)
INSERT INTO player_plays (
  id, user_id, org_id, name, short_name, play_type, concept,
  formation_name, diagram_type, side_of_ball, unit, content_status,
  diagram_data
) VALUES (
  gen_random_uuid(),
  :'user_id',
  :'org_id',
  'Cover 3 Buzz',
  'Cover 3 Buzz',
  'PASS',
  'Cover 3',
  '4-3 Base',
  'pass',
  'defense',
  'D',
  'draft',
  '{
    "mode": "pass",
    "routes": [],
    "blocking": [],
    "defensePlayers": [
      {"x": 35, "y": 48, "id": "cb1", "side": "defense", "group": "secondary", "label": "CB", "coverage": "flat"},
      {"x": 68, "y": 35, "id": "cb2", "side": "defense", "group": "secondary", "label": "CB", "coverage": "deep_third"},
      {"x": 50, "y": 30, "id": "fs", "side": "defense", "group": "secondary", "label": "FS", "coverage": "deep_third"},
      {"x": 32, "y": 35, "id": "ss", "side": "defense", "group": "secondary", "label": "SS", "coverage": "deep_third"},
      {"x": 50, "y": 54, "id": "mlb", "side": "defense", "group": "linebacker", "label": "MLB", "coverage": "hook"},
      {"x": 42, "y": 50, "id": "wlb", "side": "defense", "group": "linebacker", "label": "WLB", "coverage": "curl"},
      {"x": 58, "y": 50, "id": "slb", "side": "defense", "group": "linebacker", "label": "SLB", "coverage": "flat"},
      {"x": 40, "y": 59, "id": "de1", "side": "defense", "group": "line", "label": "DE"},
      {"x": 60, "y": 59, "id": "de2", "side": "defense", "group": "line", "label": "DE"},
      {"x": 46, "y": 59, "id": "dt1", "side": "defense", "group": "line", "label": "DT"},
      {"x": 54, "y": 59, "id": "dt2", "side": "defense", "group": "line", "label": "DT"}
    ],
    "offensePlayers": [
      {"x": 50, "y": 70, "id": "qb", "side": "offense", "group": "backfield", "label": "QB"},
      {"x": 30, "y": 61, "id": "wr1", "side": "offense", "group": "skill", "label": "X"},
      {"x": 70, "y": 61, "id": "wr3", "side": "offense", "group": "skill", "label": "Z"},
      {"x": 42, "y": 61, "id": "lt", "side": "offense", "group": "line", "label": "LT"},
      {"x": 50, "y": 61, "id": "c", "side": "offense", "group": "line", "label": "C"},
      {"x": 58, "y": 61, "id": "rt", "side": "offense", "group": "line", "label": "RT"}
    ]
  }'::jsonb
);

-- 6. Tampa 2 Coverage
INSERT INTO player_plays (
  id, user_id, org_id, name, short_name, play_type, concept,
  formation_name, diagram_type, side_of_ball, unit, content_status,
  diagram_data
) VALUES (
  gen_random_uuid(),
  :'user_id',
  :'org_id',
  'Tampa 2 Coverage',
  'Tampa 2',
  'PASS',
  'Tampa 2',
  '4-3 Base',
  'pass',
  'defense',
  'D',
  'draft',
  '{
    "mode": "pass",
    "routes": [],
    "blocking": [],
    "defensePlayers": [
      {"x": 32, "y": 46, "id": "cb1", "side": "defense", "group": "secondary", "label": "CB", "coverage": "flat"},
      {"x": 68, "y": 46, "id": "cb2", "side": "defense", "group": "secondary", "label": "CB", "coverage": "flat"},
      {"x": 40, "y": 30, "id": "fs", "side": "defense", "group": "secondary", "label": "FS", "coverage": "deep_half"},
      {"x": 60, "y": 30, "id": "ss", "side": "defense", "group": "secondary", "label": "SS", "coverage": "deep_half"},
      {"x": 50, "y": 40, "id": "mlb", "side": "defense", "group": "linebacker", "label": "MLB", "coverage": "deep_middle"},
      {"x": 42, "y": 52, "id": "wlb", "side": "defense", "group": "linebacker", "label": "WLB", "coverage": "hook"},
      {"x": 58, "y": 52, "id": "slb", "side": "defense", "group": "linebacker", "label": "SLB", "coverage": "hook"},
      {"x": 40, "y": 59, "id": "de1", "side": "defense", "group": "line", "label": "DE"},
      {"x": 60, "y": 59, "id": "de2", "side": "defense", "group": "line", "label": "DE"},
      {"x": 46, "y": 59, "id": "dt1", "side": "defense", "group": "line", "label": "DT"},
      {"x": 54, "y": 59, "id": "dt2", "side": "defense", "group": "line", "label": "DT"}
    ],
    "offensePlayers": [
      {"x": 50, "y": 70, "id": "qb", "side": "offense", "group": "backfield", "label": "QB"},
      {"x": 30, "y": 61, "id": "wr1", "side": "offense", "group": "skill", "label": "X"},
      {"x": 70, "y": 61, "id": "wr3", "side": "offense", "group": "skill", "label": "Z"},
      {"x": 42, "y": 61, "id": "lt", "side": "offense", "group": "line", "label": "LT"},
      {"x": 50, "y": 61, "id": "c", "side": "offense", "group": "line", "label": "C"},
      {"x": 58, "y": 61, "id": "rt", "side": "offense", "group": "line", "label": "RT"}
    ]
  }'::jsonb
);

-- 7. Cover 1 Robber
INSERT INTO player_plays (
  id, user_id, org_id, name, short_name, play_type, concept,
  formation_name, diagram_type, side_of_ball, unit, content_status,
  diagram_data
) VALUES (
  gen_random_uuid(),
  :'user_id',
  :'org_id',
  'Cover 1 Robber',
  'Cover 1 Robber',
  'PASS',
  'Cover 1',
  '4-3 Base',
  'pass',
  'defense',
  'D',
  'draft',
  '{
    "mode": "pass",
    "routes": [],
    "blocking": [],
    "defensePlayers": [
      {"x": 30, "y": 48, "id": "cb1", "side": "defense", "group": "secondary", "label": "CB", "coverage": "man"},
      {"x": 70, "y": 48, "id": "cb2", "side": "defense", "group": "secondary", "label": "CB", "coverage": "man"},
      {"x": 50, "y": 30, "id": "fs", "side": "defense", "group": "secondary", "label": "FS", "coverage": "deep_middle"},
      {"x": 58, "y": 42, "id": "ss", "side": "defense", "group": "secondary", "label": "SS", "coverage": "robber"},
      {"x": 50, "y": 54, "id": "mlb", "side": "defense", "group": "linebacker", "label": "MLB", "coverage": "man"},
      {"x": 42, "y": 54, "id": "wlb", "side": "defense", "group": "linebacker", "label": "WLB", "coverage": "man"},
      {"x": 58, "y": 54, "id": "slb", "side": "defense", "group": "linebacker", "label": "SLB", "coverage": "blitz"},
      {"x": 40, "y": 59, "id": "de1", "side": "defense", "group": "line", "label": "DE"},
      {"x": 60, "y": 59, "id": "de2", "side": "defense", "group": "line", "label": "DE"},
      {"x": 46, "y": 59, "id": "dt1", "side": "defense", "group": "line", "label": "DT"},
      {"x": 54, "y": 59, "id": "dt2", "side": "defense", "group": "line", "label": "DT"}
    ],
    "offensePlayers": [
      {"x": 50, "y": 70, "id": "qb", "side": "offense", "group": "backfield", "label": "QB"},
      {"x": 45, "y": 70, "id": "rb", "side": "offense", "group": "backfield", "label": "RB"},
      {"x": 30, "y": 61, "id": "wr1", "side": "offense", "group": "skill", "label": "X"},
      {"x": 70, "y": 61, "id": "wr3", "side": "offense", "group": "skill", "label": "Z"},
      {"x": 42, "y": 61, "id": "lt", "side": "offense", "group": "line", "label": "LT"},
      {"x": 50, "y": 61, "id": "c", "side": "offense", "group": "line", "label": "C"},
      {"x": 58, "y": 61, "id": "rt", "side": "offense", "group": "line", "label": "RT"}
    ]
  }'::jsonb
);

-- 8. Quarters Coverage (Cover 4)
INSERT INTO player_plays (
  id, user_id, org_id, name, short_name, play_type, concept,
  formation_name, diagram_type, side_of_ball, unit, content_status,
  diagram_data
) VALUES (
  gen_random_uuid(),
  :'user_id',
  :'org_id',
  'Quarters Coverage',
  'Cover 4',
  'PASS',
  'Quarters',
  '4-3 Base',
  'pass',
  'defense',
  'D',
  'draft',
  '{
    "mode": "pass",
    "routes": [],
    "blocking": [],
    "defensePlayers": [
      {"x": 32, "y": 35, "id": "cb1", "side": "defense", "group": "secondary", "label": "CB", "coverage": "deep_quarter"},
      {"x": 68, "y": 35, "id": "cb2", "side": "defense", "group": "secondary", "label": "CB", "coverage": "deep_quarter"},
      {"x": 40, "y": 32, "id": "fs", "side": "defense", "group": "secondary", "label": "FS", "coverage": "deep_quarter"},
      {"x": 60, "y": 32, "id": "ss", "side": "defense", "group": "secondary", "label": "SS", "coverage": "deep_quarter"},
      {"x": 50, "y": 48, "id": "mlb", "side": "defense", "group": "linebacker", "label": "MLB", "coverage": "hook"},
      {"x": 36, "y": 50, "id": "wlb", "side": "defense", "group": "linebacker", "label": "WLB", "coverage": "flat"},
      {"x": 64, "y": 50, "id": "slb", "side": "defense", "group": "linebacker", "label": "SLB", "coverage": "flat"},
      {"x": 40, "y": 59, "id": "de1", "side": "defense", "group": "line", "label": "DE"},
      {"x": 60, "y": 59, "id": "de2", "side": "defense", "group": "line", "label": "DE"},
      {"x": 46, "y": 59, "id": "dt1", "side": "defense", "group": "line", "label": "DT"},
      {"x": 54, "y": 59, "id": "dt2", "side": "defense", "group": "line", "label": "DT"}
    ],
    "offensePlayers": [
      {"x": 50, "y": 70, "id": "qb", "side": "offense", "group": "backfield", "label": "QB"},
      {"x": 45, "y": 70, "id": "rb", "side": "offense", "group": "backfield", "label": "RB"},
      {"x": 30, "y": 61, "id": "wr1", "side": "offense", "group": "skill", "label": "X"},
      {"x": 70, "y": 61, "id": "wr3", "side": "offense", "group": "skill", "label": "Z"},
      {"x": 59, "y": 61, "id": "wr2", "side": "offense", "group": "skill", "label": "H"},
      {"x": 42, "y": 61, "id": "lt", "side": "offense", "group": "line", "label": "LT"},
      {"x": 50, "y": 61, "id": "c", "side": "offense", "group": "line", "label": "C"},
      {"x": 58, "y": 61, "id": "rt", "side": "offense", "group": "line", "label": "RT"}
    ]
  }'::jsonb
);
