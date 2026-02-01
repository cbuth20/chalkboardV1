-- ═══════════════════════════════════════════════════════════════════════════
-- QUICK RESET AND TEST SCRIPT
--
-- This script will:
-- 1. Clean up existing playbook data
-- 2. Insert 3 test plays with assignments
-- 3. Ready for AI question generation testing
--
-- USAGE:
-- 1. Find your org_id: SELECT id, name FROM organizations;
-- 2. Find your team_id: SELECT id, name FROM teams WHERE org_id = 'YOUR_ORG_ID';
-- 3. Replace the IDs in the variables below
-- 4. Run this entire script
-- ═══════════════════════════════════════════════════════════════════════════

-- ⚠️ REPLACE THESE WITH YOUR ACTUAL IDs ⚠️
DO $$
DECLARE
  v_org_id UUID := '986d0f15-e926-4f76-89e1-bf7c7f731923';  -- ← REPLACE THIS
  v_team_id UUID := '00000000-0000-0000-0000-000000000000'; -- ← REPLACE THIS

  v_metadata_id_1 UUID;
  v_metadata_id_2 UUID;
  v_metadata_id_3 UUID;
  v_play_id_1 UUID;
  v_play_id_2 UUID;
  v_play_id_3 UUID;
BEGIN

  -- Show current state
  RAISE NOTICE '=== CURRENT STATE ===';
  RAISE NOTICE 'Plays: %', (SELECT COUNT(*) FROM plays WHERE org_id = v_org_id);
  RAISE NOTICE 'Assignments: %', (SELECT COUNT(*) FROM play_assignments WHERE org_id = v_org_id);
  RAISE NOTICE 'Questions: %', (SELECT COUNT(*) FROM flashcard_templates WHERE org_id = v_org_id);

  -- Step 1: Clean up existing data for this org
  RAISE NOTICE '';
  RAISE NOTICE '=== CLEANING UP ===';

  DELETE FROM flashcard_templates WHERE org_id = v_org_id;
  RAISE NOTICE 'Deleted flashcard_templates';

  DELETE FROM play_assignments WHERE org_id = v_org_id;
  RAISE NOTICE 'Deleted play_assignments';

  DELETE FROM plays WHERE org_id = v_org_id;
  RAISE NOTICE 'Deleted plays';

  DELETE FROM playbook_metadata WHERE org_id = v_org_id;
  RAISE NOTICE 'Deleted playbook_metadata';

  -- Step 2: Insert test plays
  RAISE NOTICE '';
  RAISE NOTICE '=== INSERTING TEST PLAYS ===';

  -- ═══════════════════════════════════════════════════════════════════════
  -- Play 1: Gun Trips Mesh
  -- ═══════════════════════════════════════════════════════════════════════

  INSERT INTO playbook_metadata (
    team_id, org_id, file_name, content_type, side_of_ball,
    formation_name, concept_name, play_type, unit,
    playbook_section, primary_classification, situation, is_active
  ) VALUES (
    v_team_id, v_org_id, 'test-gun-trips-mesh.png', 'play', 'offense',
    'Gun Trips Right', 'Mesh', 'PASS', 'O',
    'Pass Game', 'Levels Concept', '3rd Down', true
  ) RETURNING id INTO v_metadata_id_1;

  INSERT INTO plays (
    team_id, org_id, name, short_name, play_type, concept,
    formation_name, content_status, is_published, playbook_metadata_id,
    unit, playbook_section, primary_classification, situation
  ) VALUES (
    v_team_id, v_org_id, 'Gun Trips Mesh', 'Mesh', 'PASS', 'Mesh Concept',
    'Gun Trips Right', 'draft', true, v_metadata_id_1,
    'O', 'Pass Game', 'Levels Concept', '3rd Down'
  ) RETURNING id INTO v_play_id_1;

  INSERT INTO play_assignments (play_id, org_id, position, alignment, landmark, assignment, key_read, category, display_order) VALUES
    (v_play_id_1, v_org_id, 'QB', 'Gun', 'Under center', '3-step drop, read safety rotation', 'High safety to #2 side', 'formation', 1),
    (v_play_id_1, v_org_id, 'RB', 'Offset right', 'Behind right guard', 'Check-release to flat', 'Mike linebacker', 'protection', 2),
    (v_play_id_1, v_org_id, 'X', 'Split left 12 yards', 'On numbers', '15-yard dig from #1', 'Leverage of corner', 'route', 3),
    (v_play_id_1, v_org_id, 'Z', 'Split right 12 yards', 'On numbers', '12-yard comeback', 'Corner depth', 'route', 4),
    (v_play_id_1, v_org_id, 'H', 'Slot right 5 yards', 'Inside #1', 'Mesh at 5 yards', 'Inside leverage', 'route', 5),
    (v_play_id_1, v_org_id, 'Y', 'Slot left 5 yards', 'Inside #1', 'Mesh at 5 yards opposite', 'Inside leverage', 'route', 6);

  RAISE NOTICE 'Inserted: Gun Trips Mesh (6 assignments)';

  -- ═══════════════════════════════════════════════════════════════════════
  -- Play 2: Pro I Power
  -- ═══════════════════════════════════════════════════════════════════════

  INSERT INTO playbook_metadata (
    team_id, org_id, file_name, content_type, side_of_ball,
    formation_name, concept_name, play_type, unit,
    playbook_section, primary_classification, situation, is_active
  ) VALUES (
    v_team_id, v_org_id, 'test-pro-i-power.png', 'play', 'offense',
    'Pro I', 'Power', 'RUN', 'O',
    'Run Game', 'Gap Scheme', 'Short Yardage', true
  ) RETURNING id INTO v_metadata_id_2;

  INSERT INTO plays (
    team_id, org_id, name, short_name, play_type, concept,
    formation_name, content_status, is_published, playbook_metadata_id,
    unit, playbook_section, primary_classification, situation
  ) VALUES (
    v_team_id, v_org_id, 'Pro I Power Right', 'Power', 'RUN', 'Power',
    'Pro I', 'draft', true, v_metadata_id_2,
    'O', 'Run Game', 'Gap Scheme', 'Short Yardage'
  ) RETURNING id INTO v_play_id_2;

  INSERT INTO play_assignments (play_id, org_id, position, alignment, landmark, assignment, key_read, category, display_order) VALUES
    (v_play_id_2, v_org_id, 'QB', 'Under center', 'Behind center', 'Mesh and ride, hand off to RB', 'Backside defensive end', 'formation', 1),
    (v_play_id_2, v_org_id, 'FB', 'Behind QB', 'Strong side', 'Lead block, target Mike LB', 'Mike linebacker flow', 'blocking', 2),
    (v_play_id_2, v_org_id, 'RB', 'Behind FB', 'Strong side', 'Take mesh, follow FB', 'Frontside A-gap', 'blocking', 3),
    (v_play_id_2, v_org_id, 'LG', 'Split 2 feet', 'Center gap', 'Pull and lead through hole', 'First linebacker in hole', 'blocking', 4),
    (v_play_id_2, v_org_id, 'Y', 'Tight to line', 'Outside RT', 'Block down on defensive end', 'Defensive end', 'blocking', 5);

  RAISE NOTICE 'Inserted: Pro I Power (5 assignments)';

  -- ═══════════════════════════════════════════════════════════════════════
  -- Play 3: Gun Spread Stick
  -- ═══════════════════════════════════════════════════════════════════════

  INSERT INTO playbook_metadata (
    team_id, org_id, file_name, content_type, side_of_ball,
    formation_name, concept_name, play_type, unit,
    playbook_section, primary_classification, situation, is_active
  ) VALUES (
    v_team_id, v_org_id, 'test-gun-spread-stick.png', 'play', 'offense',
    'Gun Spread', 'Stick', 'PASS', 'O',
    'Pass Game', 'Horizontal Stretch', '3rd and Medium', true
  ) RETURNING id INTO v_metadata_id_3;

  INSERT INTO plays (
    team_id, org_id, name, short_name, play_type, concept,
    formation_name, content_status, is_published, playbook_metadata_id,
    unit, playbook_section, primary_classification, situation
  ) VALUES (
    v_team_id, v_org_id, 'Gun Spread Stick Nod', 'Stick', 'PASS', 'Stick',
    'Gun Spread', 'draft', true, v_metadata_id_3,
    'O', 'Pass Game', 'Horizontal Stretch', '3rd and Medium'
  ) RETURNING id INTO v_play_id_3;

  INSERT INTO play_assignments (play_id, org_id, position, alignment, landmark, assignment, key_read, category, display_order) VALUES
    (v_play_id_3, v_org_id, 'QB', 'Gun', 'Behind center', '3-step drop, hi-lo read', 'Flat defender to #2 side', 'formation', 1),
    (v_play_id_3, v_org_id, 'RB', 'Offset left', 'Behind left guard', 'Pass protect', 'Blitzing linebacker', 'protection', 2),
    (v_play_id_3, v_org_id, 'X', 'Split left 12 yards', 'On numbers', 'Stick route at 5 yards', 'Corner leverage', 'route', 3),
    (v_play_id_3, v_org_id, 'Z', 'Split right 12 yards', 'On numbers', 'Go route, clear deep third', 'Safety rotation', 'route', 4),
    (v_play_id_3, v_org_id, 'H', 'Slot left 6 yards', 'Inside #1', 'Speed out to flat at 5 yards', 'Flat defender', 'route', 5),
    (v_play_id_3, v_org_id, 'Y', 'Flex right 3 yards', 'Outside #1', '7-yard comeback', 'Corner depth', 'route', 6);

  RAISE NOTICE 'Inserted: Gun Spread Stick (6 assignments)';

  -- Show final state
  RAISE NOTICE '';
  RAISE NOTICE '=== FINAL STATE ===';
  RAISE NOTICE 'Plays: %', (SELECT COUNT(*) FROM plays WHERE org_id = v_org_id);
  RAISE NOTICE 'Assignments: %', (SELECT COUNT(*) FROM play_assignments WHERE org_id = v_org_id);
  RAISE NOTICE 'Questions: %', (SELECT COUNT(*) FROM flashcard_templates WHERE org_id = v_org_id);
  RAISE NOTICE '';
  RAISE NOTICE '✅ Ready to test!';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Go to /coach/playbook';
  RAISE NOTICE '2. Click on any play to expand';
  RAISE NOTICE '3. Click "Regenerate Questions"';
  RAISE NOTICE '4. Wait ~10-20 seconds';
  RAISE NOTICE '5. Check database for questions!';

END $$;

-- Show the plays that were created
SELECT
  p.name,
  p.play_type,
  p.concept,
  p.situation,
  COUNT(pa.id) as assignments
FROM plays p
LEFT JOIN play_assignments pa ON p.id = pa.play_id
GROUP BY p.id, p.name, p.play_type, p.concept, p.situation
ORDER BY p.name;
