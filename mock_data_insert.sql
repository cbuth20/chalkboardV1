-- =====================================================================
-- Mock Playbook Data for Testing
--
-- This script creates sample plays across all units (O/D/ST) with
-- proper classification for testing the playbook system.
--
-- BEFORE RUNNING:
-- 1. Replace 'YOUR_ORG_ID_HERE' with your actual org_id
-- 2. Replace 'YOUR_TEAM_ID_HERE' with your actual team_id (or NULL)
-- 3. Upload placeholder images to Supabase Storage at public/mock-plays/
--    OR set file_paths to empty array if you don't have images yet
-- =====================================================================

-- Set your IDs here
\set org_id '986d0f15-e926-4f76-89e1-bf7c7f731923'
\set team_id NULL

-- =====================================================================
-- OFFENSIVE PLAYS
-- =====================================================================

-- 1. Trips Right Mesh (Pass Game - 3rd Down)
INSERT INTO playbook_metadata (
  org_id, team_id, file_paths, side_of_ball, content_type,
  position_relevance, formation_name, custom_notes,
  unit, playbook_section, primary_classification, situation, play_type
) VALUES (
  :'org_id', :'team_id',
  ARRAY['public/mock-plays/trips-mesh.png'],
  'offense', 'play', ARRAY['all'],
  'Trips Right',
  'Mesh concept with slot receiver crossing over middle. X runs go, Z runs post, H and Y run mesh.',
  'O', 'Pass Game', 'PASS', '3rd Down', 'PASS'
) RETURNING id \gset trips_mesh_meta_id

INSERT INTO plays (
  org_id, team_id, playbook_metadata_id,
  name, short_name, play_type, concept, formation_name,
  content_status, is_published,
  unit, playbook_section, primary_classification, situation
) VALUES (
  :'org_id', :'team_id', :'trips_mesh_meta_id',
  'Trips Right Mesh', 'Mesh', 'PASS', 'Mesh', 'Trips Right',
  'approved', true,
  'O', 'Pass Game', 'PASS', '3rd Down'
);

-- 2. Shotgun Inside Zone (Run Game - 1st-2nd Down)
INSERT INTO playbook_metadata (
  org_id, team_id, file_paths, side_of_ball, content_type,
  position_relevance, formation_name, custom_notes,
  unit, playbook_section, primary_classification, situation, play_type
) VALUES (
  :'org_id', :'team_id',
  ARRAY['public/mock-plays/inside-zone.png'],
  'offense', 'play', ARRAY['all'],
  'Shotgun',
  'Inside zone run. OL blocks inside zone scheme, RB reads backside defensive end.',
  'O', 'Run Game', 'RUN', '1st-2nd Down', 'RUN'
) RETURNING id \gset inside_zone_meta_id

INSERT INTO plays (
  org_id, team_id, playbook_metadata_id,
  name, short_name, play_type, concept, formation_name,
  content_status, is_published,
  unit, playbook_section, primary_classification, situation
) VALUES (
  :'org_id', :'team_id', :'inside_zone_meta_id',
  'Shotgun Inside Zone', 'Inside Zone', 'RUN', 'Zone', 'Shotgun',
  'approved', true,
  'O', 'Run Game', 'RUN', '1st-2nd Down'
);

-- 3. Four Verticals (Pass Game - Red Zone)
INSERT INTO playbook_metadata (
  org_id, team_id, file_paths, side_of_ball, content_type,
  position_relevance, formation_name, custom_notes,
  unit, playbook_section, primary_classification, situation, play_type
) VALUES (
  :'org_id', :'team_id',
  ARRAY['public/mock-plays/four-verts.png'],
  'offense', 'play', ARRAY['all'],
  'Spread',
  'Four verticals concept. All receivers run vertical routes, QB reads high-low.',
  'O', 'Red Zone', 'PASS', 'Red Zone', 'PASS'
) RETURNING id \gset four_verts_meta_id

INSERT INTO plays (
  org_id, team_id, playbook_metadata_id,
  name, short_name, play_type, concept, formation_name,
  content_status, is_published,
  unit, playbook_section, primary_classification, situation
) VALUES (
  :'org_id', :'team_id', :'four_verts_meta_id',
  'Spread Four Verticals', '4 Verts', 'PASS', 'Verticals', 'Spread',
  'approved', true,
  'O', 'Red Zone', 'PASS', 'Red Zone'
);

-- 4. Counter Trey (Run Game - 1st-2nd Down)
INSERT INTO playbook_metadata (
  org_id, team_id, file_paths, side_of_ball, content_type,
  position_relevance, formation_name, custom_notes,
  unit, playbook_section, primary_classification, situation, play_type
) VALUES (
  :'org_id', :'team_id',
  ARRAY['public/mock-plays/counter-trey.png'],
  'offense', 'play', ARRAY['all'],
  'I-Formation',
  'Counter trey run. Pulling guards, FB leads through hole.',
  'O', 'Run Game', 'RUN', '1st-2nd Down', 'RUN'
) RETURNING id \gset counter_meta_id

INSERT INTO plays (
  org_id, team_id, playbook_metadata_id,
  name, short_name, play_type, concept, formation_name,
  content_status, is_published,
  unit, playbook_section, primary_classification, situation
) VALUES (
  :'org_id', :'team_id', :'counter_meta_id',
  'I-Formation Counter Trey', 'Counter', 'RUN', 'Counter', 'I-Formation',
  'draft', false,
  'O', 'Run Game', 'RUN', '1st-2nd Down'
);

-- 5. Bubble Screen (Screen Game - 3rd & Short)
INSERT INTO playbook_metadata (
  org_id, team_id, file_paths, side_of_ball, content_type,
  position_relevance, formation_name, custom_notes,
  unit, playbook_section, primary_classification, situation, play_type
) VALUES (
  :'org_id', :'team_id',
  ARRAY['public/mock-plays/bubble-screen.png'],
  'offense', 'play', ARRAY['all'],
  'Trips Left',
  'Quick bubble screen to slot receiver. Two inside receivers block downfield.',
  'O', 'Screen Game', 'PASS', '3rd & Short', 'SCREEN'
) RETURNING id \gset bubble_meta_id

INSERT INTO plays (
  org_id, team_id, playbook_metadata_id,
  name, short_name, play_type, concept, formation_name,
  content_status, is_published,
  unit, playbook_section, primary_classification, situation
) VALUES (
  :'org_id', :'team_id', :'bubble_meta_id',
  'Trips Left Bubble Screen', 'Bubble', 'SCREEN', 'Bubble', 'Trips Left',
  'approved', true,
  'O', 'Screen Game', 'PASS', '3rd & Short'
);

-- 6. Stick Concept (Pass Game - 3rd Down)
INSERT INTO playbook_metadata (
  org_id, team_id, file_paths, side_of_ball, content_type,
  position_relevance, formation_name, custom_notes,
  unit, playbook_section, primary_classification, situation, play_type
) VALUES (
  :'org_id', :'team_id',
  ARRAY['public/mock-plays/stick.png'],
  'offense', 'play', ARRAY['all'],
  'Doubles',
  'Stick concept. Inside receiver runs 5-yard stick, outside runs vertical or corner.',
  'O', 'Pass Game', 'PASS', '3rd Down', 'PASS'
) RETURNING id \gset stick_meta_id

INSERT INTO plays (
  org_id, team_id, playbook_metadata_id,
  name, short_name, play_type, concept, formation_name,
  content_status, is_published,
  unit, playbook_section, primary_classification, situation
) VALUES (
  :'org_id', :'team_id', :'stick_meta_id',
  'Doubles Stick', 'Stick', 'PASS', 'Stick', 'Doubles',
  'draft', false,
  'O', 'Pass Game', 'PASS', '3rd Down'
);

-- =====================================================================
-- DEFENSIVE PLAYS
-- =====================================================================

-- 7. Cover 3 (Coverage)
INSERT INTO playbook_metadata (
  org_id, team_id, file_paths, side_of_ball, content_type,
  position_relevance, formation_name, custom_notes,
  unit, playbook_section, primary_classification, situation
) VALUES (
  :'org_id', :'team_id',
  ARRAY['public/mock-plays/cover3.png'],
  'defense', 'coverage', ARRAY['all'],
  'Base 4-3',
  'Cover 3 zone coverage. Safeties and corner take deep thirds, linebackers take underneath zones.',
  'D', 'Pass Game', 'COVERAGE', '1st-2nd Down'
) RETURNING id \gset cover3_meta_id

INSERT INTO plays (
  org_id, team_id, playbook_metadata_id,
  name, short_name, play_type, concept, formation_name,
  content_status, is_published,
  unit, playbook_section, primary_classification, situation,
  content_type
) VALUES (
  :'org_id', :'team_id', :'cover3_meta_id',
  'Base Cover 3', 'Cover 3', 'PASS', 'Cover 3', '4-3',
  'approved', true,
  'D', 'Pass Game', 'COVERAGE', '1st-2nd Down',
  'coverage'
);

-- 8. Fire Zone Blitz (Pressure)
INSERT INTO playbook_metadata (
  org_id, team_id, file_paths, side_of_ball, content_type,
  position_relevance, formation_name, custom_notes,
  unit, playbook_section, primary_classification, situation
) VALUES (
  :'org_id', :'team_id',
  ARRAY['public/mock-plays/fire-zone.png'],
  'defense', 'coverage', ARRAY['all'],
  'Nickel',
  'Fire zone blitz. 5 rushers, 6 in coverage. Nickel and SAM bring pressure.',
  'D', 'Third Down', 'PRESSURE', '3rd & Long'
) RETURNING id \gset fire_zone_meta_id

INSERT INTO plays (
  org_id, team_id, playbook_metadata_id,
  name, short_name, play_type, concept, formation_name,
  content_status, is_published,
  unit, playbook_section, primary_classification, situation,
  content_type
) VALUES (
  :'org_id', :'team_id', :'fire_zone_meta_id',
  'Nickel Fire Zone', 'Fire', 'PASS', 'Zone Blitz', 'Nickel',
  'approved', true,
  'D', 'Third Down', 'PRESSURE', '3rd & Long',
  'coverage'
);

-- 9. Bear Front (Front)
INSERT INTO playbook_metadata (
  org_id, team_id, file_paths, side_of_ball, content_type,
  position_relevance, formation_name, custom_notes,
  unit, playbook_section, primary_classification, situation
) VALUES (
  :'org_id', :'team_id',
  ARRAY['public/mock-plays/bear-front.png'],
  'defense', 'formation', ARRAY['all'],
  'Bear',
  'Bear front alignment. Defensive linemen in 0-technique, linebackers in A-gaps.',
  'D', 'Run Game', 'FRONT', 'Goal Line'
) RETURNING id \gset bear_meta_id

INSERT INTO plays (
  org_id, team_id, playbook_metadata_id,
  name, short_name, play_type, concept, formation_name,
  content_status, is_published,
  unit, playbook_section, primary_classification, situation,
  content_type
) VALUES (
  :'org_id', :'team_id', :'bear_meta_id',
  'Bear Front', 'Bear', 'RUN', 'Bear', 'Bear',
  'draft', false,
  'D', 'Run Game', 'FRONT', 'Goal Line',
  'formation'
);

-- 10. Cover 2 Man (Coverage)
INSERT INTO playbook_metadata (
  org_id, team_id, file_paths, side_of_ball, content_type,
  position_relevance, formation_name, custom_notes,
  unit, playbook_section, primary_classification, situation
) VALUES (
  :'org_id', :'team_id',
  ARRAY['public/mock-plays/cover2-man.png'],
  'defense', 'coverage', ARRAY['all'],
  'Base 4-3',
  'Cover 2 man coverage. Corners press man, safeties split deep halves.',
  'D', 'Red Zone', 'COVERAGE', 'Red Zone'
) RETURNING id \gset cover2_meta_id

INSERT INTO plays (
  org_id, team_id, playbook_metadata_id,
  name, short_name, play_type, concept, formation_name,
  content_status, is_published,
  unit, playbook_section, primary_classification, situation,
  content_type
) VALUES (
  :'org_id', :'team_id', :'cover2_meta_id',
  'Cover 2 Man', 'C2 Man', 'PASS', 'Cover 2', '4-3',
  'approved', true,
  'D', 'Red Zone', 'COVERAGE', 'Red Zone',
  'coverage'
);

-- =====================================================================
-- SPECIAL TEAMS PLAYS
-- =====================================================================

-- 11. Kickoff (Special Teams)
INSERT INTO playbook_metadata (
  org_id, team_id, file_paths, side_of_ball, content_type,
  position_relevance, formation_name, custom_notes,
  unit, playbook_section, primary_classification
) VALUES (
  :'org_id', :'team_id',
  ARRAY['public/mock-plays/kickoff.png'],
  'special_teams', 'play', ARRAY['all'],
  'Standard Kickoff',
  'Standard kickoff alignment. R4 and L4 are force players.',
  'ST', 'Kickoff', 'Kickoff'
) RETURNING id \gset kickoff_meta_id

INSERT INTO plays (
  org_id, team_id, playbook_metadata_id,
  name, short_name, play_type, concept, formation_name,
  content_status, is_published,
  unit, playbook_section, primary_classification,
  content_type
) VALUES (
  :'org_id', :'team_id', :'kickoff_meta_id',
  'Standard Kickoff', 'KO', 'PASS', 'Kickoff', 'Standard',
  'approved', true,
  'ST', 'Kickoff', 'Kickoff',
  'play'
);

-- 12. Punt Safe (Special Teams)
INSERT INTO playbook_metadata (
  org_id, team_id, file_paths, side_of_ball, content_type,
  position_relevance, formation_name, custom_notes,
  unit, playbook_section, primary_classification
) VALUES (
  :'org_id', :'team_id',
  ARRAY['public/mock-plays/punt-safe.png'],
  'special_teams', 'play', ARRAY['all'],
  'Punt Formation',
  'Safe punt protection. Personal protectors scan for rushers.',
  'ST', 'Punt', 'Punt'
) RETURNING id \gset punt_meta_id

INSERT INTO plays (
  org_id, team_id, playbook_metadata_id,
  name, short_name, play_type, concept, formation_name,
  content_status, is_published,
  unit, playbook_section, primary_classification,
  content_type
) VALUES (
  :'org_id', :'team_id', :'punt_meta_id',
  'Punt Safe', 'Punt', 'PASS', 'Punt', 'Standard',
  'approved', true,
  'ST', 'Punt', 'Punt',
  'play'
);

-- =====================================================================
-- Summary
-- =====================================================================
-- This script creates:
-- - 6 Offensive plays (Pass, Run, Screen)
-- - 4 Defensive plays (Coverage, Pressure, Front)
-- - 2 Special Teams plays (Kickoff, Punt)
--
-- Mix of statuses:
-- - 8 Approved & Published
-- - 4 Draft (not published)
-- =====================================================================
