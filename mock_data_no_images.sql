-- =====================================================================
-- Mock Playbook Data - NO IMAGES VERSION
-- Quick test data without requiring image uploads
-- =====================================================================

-- Your org_id is already set
DO $$
DECLARE
  v_org_id UUID := '986d0f15-e926-4f76-89e1-bf7c7f731923';
  v_team_id UUID := NULL;

  -- Metadata IDs
  trips_mesh_meta_id UUID;
  inside_zone_meta_id UUID;
  four_verts_meta_id UUID;
  counter_meta_id UUID;
  bubble_meta_id UUID;
  stick_meta_id UUID;
  cover3_meta_id UUID;
  fire_zone_meta_id UUID;
  bear_meta_id UUID;
  cover2_meta_id UUID;
  kickoff_meta_id UUID;
  punt_meta_id UUID;

BEGIN

-- =====================================================================
-- OFFENSIVE PLAYS
-- =====================================================================

-- 1. Trips Right Mesh
INSERT INTO playbook_metadata (
  org_id, team_id, file_paths, side_of_ball, content_type,
  position_relevance, formation_name, custom_notes,
  unit, playbook_section, primary_classification, situation, play_type
) VALUES (
  v_org_id, v_team_id, ARRAY[]::TEXT[],
  'offense', 'play', ARRAY['all'],
  'Trips Right',
  'Mesh concept with slot receiver crossing over middle. X runs go, Z runs post, H and Y run mesh.',
  'O', 'Pass Game', 'PASS', '3rd Down', 'PASS'
) RETURNING id INTO trips_mesh_meta_id;

INSERT INTO plays (
  org_id, team_id, playbook_metadata_id,
  name, short_name, play_type, concept, formation_name,
  content_status, is_published,
  unit, playbook_section, primary_classification, situation
) VALUES (
  v_org_id, v_team_id, trips_mesh_meta_id,
  'Trips Right Mesh', 'Mesh', 'PASS', 'Mesh', 'Trips Right',
  'approved', true,
  'O', 'Pass Game', 'PASS', '3rd Down'
);

-- 2. Shotgun Inside Zone
INSERT INTO playbook_metadata (
  org_id, team_id, file_paths, side_of_ball, content_type,
  position_relevance, formation_name, custom_notes,
  unit, playbook_section, primary_classification, situation, play_type
) VALUES (
  v_org_id, v_team_id, ARRAY[]::TEXT[],
  'offense', 'play', ARRAY['all'],
  'Shotgun',
  'Inside zone run. OL blocks inside zone scheme, RB reads backside defensive end.',
  'O', 'Run Game', 'RUN', '1st-2nd Down', 'RUN'
) RETURNING id INTO inside_zone_meta_id;

INSERT INTO plays (
  org_id, team_id, playbook_metadata_id,
  name, short_name, play_type, concept, formation_name,
  content_status, is_published,
  unit, playbook_section, primary_classification, situation
) VALUES (
  v_org_id, v_team_id, inside_zone_meta_id,
  'Shotgun Inside Zone', 'Inside Zone', 'RUN', 'Zone', 'Shotgun',
  'approved', true,
  'O', 'Run Game', 'RUN', '1st-2nd Down'
);

-- 3. Four Verticals
INSERT INTO playbook_metadata (
  org_id, team_id, file_paths, side_of_ball, content_type,
  position_relevance, formation_name, custom_notes,
  unit, playbook_section, primary_classification, situation, play_type
) VALUES (
  v_org_id, v_team_id, ARRAY[]::TEXT[],
  'offense', 'play', ARRAY['all'],
  'Spread',
  'Four verticals concept. All receivers run vertical routes, QB reads high-low.',
  'O', 'Red Zone', 'PASS', 'Red Zone', 'PASS'
) RETURNING id INTO four_verts_meta_id;

INSERT INTO plays (
  org_id, team_id, playbook_metadata_id,
  name, short_name, play_type, concept, formation_name,
  content_status, is_published,
  unit, playbook_section, primary_classification, situation
) VALUES (
  v_org_id, v_team_id, four_verts_meta_id,
  'Spread Four Verticals', '4 Verts', 'PASS', 'Verticals', 'Spread',
  'approved', true,
  'O', 'Red Zone', 'PASS', 'Red Zone'
);

-- 4. Counter Trey
INSERT INTO playbook_metadata (
  org_id, team_id, file_paths, side_of_ball, content_type,
  position_relevance, formation_name, custom_notes,
  unit, playbook_section, primary_classification, situation, play_type
) VALUES (
  v_org_id, v_team_id, ARRAY[]::TEXT[],
  'offense', 'play', ARRAY['all'],
  'I-Formation',
  'Counter trey run. Pulling guards, FB leads through hole.',
  'O', 'Run Game', 'RUN', '1st-2nd Down', 'RUN'
) RETURNING id INTO counter_meta_id;

INSERT INTO plays (
  org_id, team_id, playbook_metadata_id,
  name, short_name, play_type, concept, formation_name,
  content_status, is_published,
  unit, playbook_section, primary_classification, situation
) VALUES (
  v_org_id, v_team_id, counter_meta_id,
  'I-Formation Counter Trey', 'Counter', 'RUN', 'Counter', 'I-Formation',
  'draft', false,
  'O', 'Run Game', 'RUN', '1st-2nd Down'
);

-- 5. Bubble Screen
INSERT INTO playbook_metadata (
  org_id, team_id, file_paths, side_of_ball, content_type,
  position_relevance, formation_name, custom_notes,
  unit, playbook_section, primary_classification, situation, play_type
) VALUES (
  v_org_id, v_team_id, ARRAY[]::TEXT[],
  'offense', 'play', ARRAY['all'],
  'Trips Left',
  'Quick bubble screen to slot receiver. Two inside receivers block downfield.',
  'O', 'Screen Game', 'PASS', '3rd & Short', 'SCREEN'
) RETURNING id INTO bubble_meta_id;

INSERT INTO plays (
  org_id, team_id, playbook_metadata_id,
  name, short_name, play_type, concept, formation_name,
  content_status, is_published,
  unit, playbook_section, primary_classification, situation
) VALUES (
  v_org_id, v_team_id, bubble_meta_id,
  'Trips Left Bubble Screen', 'Bubble', 'SCREEN', 'Bubble', 'Trips Left',
  'approved', true,
  'O', 'Screen Game', 'PASS', '3rd & Short'
);

-- 6. Stick Concept
INSERT INTO playbook_metadata (
  org_id, team_id, file_paths, side_of_ball, content_type,
  position_relevance, formation_name, custom_notes,
  unit, playbook_section, primary_classification, situation, play_type
) VALUES (
  v_org_id, v_team_id, ARRAY[]::TEXT[],
  'offense', 'play', ARRAY['all'],
  'Doubles',
  'Stick concept. Inside receiver runs 5-yard stick, outside runs vertical or corner.',
  'O', 'Pass Game', 'PASS', '3rd Down', 'PASS'
) RETURNING id INTO stick_meta_id;

INSERT INTO plays (
  org_id, team_id, playbook_metadata_id,
  name, short_name, play_type, concept, formation_name,
  content_status, is_published,
  unit, playbook_section, primary_classification, situation
) VALUES (
  v_org_id, v_team_id, stick_meta_id,
  'Doubles Stick', 'Stick', 'PASS', 'Stick', 'Doubles',
  'draft', false,
  'O', 'Pass Game', 'PASS', '3rd Down'
);

-- =====================================================================
-- DEFENSIVE PLAYS
-- =====================================================================

-- 7. Cover 3
INSERT INTO playbook_metadata (
  org_id, team_id, file_paths, side_of_ball, content_type,
  position_relevance, formation_name, custom_notes,
  unit, playbook_section, primary_classification, situation
) VALUES (
  v_org_id, v_team_id, ARRAY[]::TEXT[],
  'defense', 'coverage', ARRAY['all'],
  'Base 4-3',
  'Cover 3 zone coverage. Safeties and corner take deep thirds, linebackers take underneath zones.',
  'D', 'Pass Game', 'COVERAGE', '1st-2nd Down'
) RETURNING id INTO cover3_meta_id;

INSERT INTO plays (
  org_id, team_id, playbook_metadata_id,
  name, short_name, play_type, concept, formation_name,
  content_status, is_published,
  unit, playbook_section, primary_classification, situation,
  content_type
) VALUES (
  v_org_id, v_team_id, cover3_meta_id,
  'Base Cover 3', 'Cover 3', 'PASS', 'Cover 3', '4-3',
  'approved', true,
  'D', 'Pass Game', 'COVERAGE', '1st-2nd Down',
  'coverage'
);

-- 8. Fire Zone Blitz
INSERT INTO playbook_metadata (
  org_id, team_id, file_paths, side_of_ball, content_type,
  position_relevance, formation_name, custom_notes,
  unit, playbook_section, primary_classification, situation
) VALUES (
  v_org_id, v_team_id, ARRAY[]::TEXT[],
  'defense', 'coverage', ARRAY['all'],
  'Nickel',
  'Fire zone blitz. 5 rushers, 6 in coverage. Nickel and SAM bring pressure.',
  'D', 'Third Down', 'PRESSURE', '3rd & Long'
) RETURNING id INTO fire_zone_meta_id;

INSERT INTO plays (
  org_id, team_id, playbook_metadata_id,
  name, short_name, play_type, concept, formation_name,
  content_status, is_published,
  unit, playbook_section, primary_classification, situation,
  content_type
) VALUES (
  v_org_id, v_team_id, fire_zone_meta_id,
  'Nickel Fire Zone', 'Fire', 'PASS', 'Zone Blitz', 'Nickel',
  'approved', true,
  'D', 'Third Down', 'PRESSURE', '3rd & Long',
  'coverage'
);

-- 9. Bear Front
INSERT INTO playbook_metadata (
  org_id, team_id, file_paths, side_of_ball, content_type,
  position_relevance, formation_name, custom_notes,
  unit, playbook_section, primary_classification, situation
) VALUES (
  v_org_id, v_team_id, ARRAY[]::TEXT[],
  'defense', 'formation', ARRAY['all'],
  'Bear',
  'Bear front alignment. Defensive linemen in 0-technique, linebackers in A-gaps.',
  'D', 'Run Game', 'FRONT', 'Goal Line'
) RETURNING id INTO bear_meta_id;

INSERT INTO plays (
  org_id, team_id, playbook_metadata_id,
  name, short_name, play_type, concept, formation_name,
  content_status, is_published,
  unit, playbook_section, primary_classification, situation,
  content_type
) VALUES (
  v_org_id, v_team_id, bear_meta_id,
  'Bear Front', 'Bear', 'RUN', 'Bear', 'Bear',
  'draft', false,
  'D', 'Run Game', 'FRONT', 'Goal Line',
  'formation'
);

-- 10. Cover 2 Man
INSERT INTO playbook_metadata (
  org_id, team_id, file_paths, side_of_ball, content_type,
  position_relevance, formation_name, custom_notes,
  unit, playbook_section, primary_classification, situation
) VALUES (
  v_org_id, v_team_id, ARRAY[]::TEXT[],
  'defense', 'coverage', ARRAY['all'],
  'Base 4-3',
  'Cover 2 man coverage. Corners press man, safeties split deep halves.',
  'D', 'Red Zone', 'COVERAGE', 'Red Zone'
) RETURNING id INTO cover2_meta_id;

INSERT INTO plays (
  org_id, team_id, playbook_metadata_id,
  name, short_name, play_type, concept, formation_name,
  content_status, is_published,
  unit, playbook_section, primary_classification, situation,
  content_type
) VALUES (
  v_org_id, v_team_id, cover2_meta_id,
  'Cover 2 Man', 'C2 Man', 'PASS', 'Cover 2', '4-3',
  'approved', true,
  'D', 'Red Zone', 'COVERAGE', 'Red Zone',
  'coverage'
);

-- =====================================================================
-- SPECIAL TEAMS PLAYS
-- =====================================================================

-- 11. Kickoff
INSERT INTO playbook_metadata (
  org_id, team_id, file_paths, side_of_ball, content_type,
  position_relevance, formation_name, custom_notes,
  unit, playbook_section, primary_classification
) VALUES (
  v_org_id, v_team_id, ARRAY[]::TEXT[],
  'special_teams', 'play', ARRAY['all'],
  'Standard Kickoff',
  'Standard kickoff alignment. R4 and L4 are force players.',
  'ST', 'Kickoff', 'Kickoff'
) RETURNING id INTO kickoff_meta_id;

INSERT INTO plays (
  org_id, team_id, playbook_metadata_id,
  name, short_name, play_type, concept, formation_name,
  content_status, is_published,
  unit, playbook_section, primary_classification,
  content_type
) VALUES (
  v_org_id, v_team_id, kickoff_meta_id,
  'Standard Kickoff', 'KO', 'PASS', 'Kickoff', 'Standard',
  'approved', true,
  'ST', 'Kickoff', 'Kickoff',
  'play'
);

-- 12. Punt Safe
INSERT INTO playbook_metadata (
  org_id, team_id, file_paths, side_of_ball, content_type,
  position_relevance, formation_name, custom_notes,
  unit, playbook_section, primary_classification
) VALUES (
  v_org_id, v_team_id, ARRAY[]::TEXT[],
  'special_teams', 'play', ARRAY['all'],
  'Punt Formation',
  'Safe punt protection. Personal protectors scan for rushers.',
  'ST', 'Punt', 'Punt'
) RETURNING id INTO punt_meta_id;

INSERT INTO plays (
  org_id, team_id, playbook_metadata_id,
  name, short_name, play_type, concept, formation_name,
  content_status, is_published,
  unit, playbook_section, primary_classification,
  content_type
) VALUES (
  v_org_id, v_team_id, punt_meta_id,
  'Punt Safe', 'Punt', 'PASS', 'Punt', 'Standard',
  'approved', true,
  'ST', 'Punt', 'Punt',
  'play'
);

RAISE NOTICE 'Mock data inserted successfully!';
RAISE NOTICE '- 6 Offensive plays';
RAISE NOTICE '- 4 Defensive plays';
RAISE NOTICE '- 2 Special Teams plays';
RAISE NOTICE '- 8 Approved, 4 Draft';

END $$;
