-- ═══════════════════════════════════════════════════════════════════════════
-- INSERT TEST PLAYS SCRIPT
--
-- Purpose: Insert sample plays with assignments for testing the AI question
--          generation system
--
-- What this does:
-- 1. Inserts playbook_metadata (simulated uploaded files)
-- 2. Inserts plays with proper classification
-- 3. Inserts play_assignments for each position
-- 4. Ready for AI question generation
--
-- Prerequisites:
-- - You must have an org_id and team_id to use
-- - Run cleanup-playbook-data.sql first if you want a fresh start
--
-- After running this:
-- - Go to coach playbook page
-- - Click "Regenerate Questions" on any play
-- - AI will generate 10-12 questions for each play
-- ═══════════════════════════════════════════════════════════════════════════

-- IMPORTANT: Replace these with your actual IDs
-- You can get these by running: SELECT id FROM organizations; and SELECT id FROM teams;
\set org_id '986d0f15-e926-4f76-89e1-bf7c7f731923'
\set team_id 'YOUR_TEAM_ID_HERE'

-- Or you can manually replace :org_id and :team_id in the script below

-- ═══════════════════════════════════════════════════════════════════════════
-- Test Play 1: Gun Trips Mesh (Pass Play)
-- ═══════════════════════════════════════════════════════════════════════════

-- Insert metadata
INSERT INTO playbook_metadata (
  id,
  team_id,
  org_id,
  file_name,
  content_type,
  side_of_ball,
  formation_name,
  concept_name,
  play_type,
  unit,
  playbook_section,
  primary_classification,
  situation,
  is_active
) VALUES (
  gen_random_uuid(),
  :team_id,
  :org_id,
  'test-gun-trips-mesh.png',
  'play',
  'offense',
  'Gun Trips Right',
  'Mesh',
  'PASS',
  'O',
  'Pass Game',
  'Levels Concept',
  '3rd Down',
  true
) RETURNING id;

-- Save this ID and use it below (or use WITH clause)
-- Let's use a CTE approach:

WITH new_metadata AS (
  INSERT INTO playbook_metadata (
    team_id,
    org_id,
    file_name,
    content_type,
    side_of_ball,
    formation_name,
    concept_name,
    play_type,
    unit,
    playbook_section,
    primary_classification,
    situation,
    is_active
  ) VALUES (
    :team_id,
    :org_id,
    'test-gun-trips-mesh.png',
    'play',
    'offense',
    'Gun Trips Right',
    'Mesh',
    'PASS',
    'O',
    'Pass Game',
    'Levels Concept',
    '3rd Down',
    true
  ) RETURNING id
),
new_play AS (
  INSERT INTO plays (
    team_id,
    org_id,
    name,
    short_name,
    play_type,
    concept,
    formation_name,
    content_status,
    is_published,
    playbook_metadata_id,
    unit,
    playbook_section,
    primary_classification,
    situation
  )
  SELECT
    :team_id,
    :org_id,
    'Gun Trips Mesh',
    'Mesh',
    'PASS',
    'Mesh Concept',
    'Gun Trips Right',
    'draft',
    true,
    id,
    'O',
    'Pass Game',
    'Levels Concept',
    '3rd Down'
  FROM new_metadata
  RETURNING id, org_id
)
INSERT INTO play_assignments (
  play_id,
  org_id,
  position,
  alignment,
  landmark,
  assignment,
  key_read,
  category,
  display_order
)
SELECT
  new_play.id,
  new_play.org_id,
  position,
  alignment,
  landmark,
  assignment,
  key_read,
  category,
  display_order
FROM new_play, (VALUES
  ('QB', 'Gun', 'Under center', '3-step drop, read safety rotation', 'High safety to #2 side', 'formation', 1),
  ('RB', 'Offset right', 'Behind right guard', 'Check-release to flat', 'Mike linebacker', 'protection', 2),
  ('X', 'Split left 12 yards', 'On numbers', '15-yard dig from #1', 'Leverage of corner', 'route', 3),
  ('Z', 'Split right 12 yards', 'On numbers', '12-yard comeback', 'Corner depth', 'route', 4),
  ('H', 'Slot right 5 yards', 'Inside #1', 'Mesh at 5 yards', 'Inside leverage', 'route', 5),
  ('Y', 'Slot left 5 yards', 'Inside #1', 'Mesh at 5 yards opposite direction', 'Inside leverage', 'route', 6)
) AS assignments(position, alignment, landmark, assignment, key_read, category, display_order);

-- ═══════════════════════════════════════════════════════════════════════════
-- Test Play 2: Pro I Power (Run Play)
-- ═══════════════════════════════════════════════════════════════════════════

WITH new_metadata AS (
  INSERT INTO playbook_metadata (
    team_id,
    org_id,
    file_name,
    content_type,
    side_of_ball,
    formation_name,
    concept_name,
    play_type,
    unit,
    playbook_section,
    primary_classification,
    situation,
    is_active
  ) VALUES (
    :team_id,
    :org_id,
    'test-pro-i-power.png',
    'play',
    'offense',
    'Pro I',
    'Power',
    'RUN',
    'O',
    'Run Game',
    'Gap Scheme',
    'Short Yardage',
    true
  ) RETURNING id
),
new_play AS (
  INSERT INTO plays (
    team_id,
    org_id,
    name,
    short_name,
    play_type,
    concept,
    formation_name,
    content_status,
    is_published,
    playbook_metadata_id,
    unit,
    playbook_section,
    primary_classification,
    situation
  )
  SELECT
    :team_id,
    :org_id,
    'Pro I Power Right',
    'Power',
    'RUN',
    'Power',
    'Pro I',
    'draft',
    true,
    id,
    'O',
    'Run Game',
    'Gap Scheme',
    'Short Yardage'
  FROM new_metadata
  RETURNING id, org_id
)
INSERT INTO play_assignments (
  play_id,
  org_id,
  position,
  alignment,
  landmark,
  assignment,
  key_read,
  category,
  display_order
)
SELECT
  new_play.id,
  new_play.org_id,
  position,
  alignment,
  landmark,
  assignment,
  key_read,
  category,
  display_order
FROM new_play, (VALUES
  ('QB', 'Under center', 'Behind center', 'Mesh and ride, hand off to RB', 'Backside defensive end', 'formation', 1),
  ('FB', 'Behind QB', 'Strong side', 'Lead block through hole, target Mike LB', 'Mike linebacker flow', 'blocking', 2),
  ('RB', 'Behind FB', 'Strong side', 'Take mesh, follow FB through hole', 'Frontside A-gap', 'blocking', 3),
  ('LT', 'Split 3 feet', 'Outside shade', 'Base block on defensive end', 'Defensive end', 'blocking', 4),
  ('LG', 'Split 2 feet', 'Center gap', 'Pull and lead through hole', 'First linebacker in hole', 'blocking', 5),
  ('C', 'Over ball', 'Nose guard', 'Block backside A-gap', 'Nose guard', 'blocking', 6),
  ('RG', 'Split 2 feet', 'Right A-gap', 'Down block on defensive tackle', 'Defensive tackle', 'blocking', 7),
  ('RT', 'Split 3 feet', 'Outside shade', 'Down block on defensive tackle', 'Defensive tackle', 'blocking', 8),
  ('Y', 'Tight to line', 'Outside RT', 'Block down on defensive end', 'Defensive end', 'blocking', 9),
  ('X', 'Split left 12 yards', 'On numbers', 'Block corner, crack down on safety', 'Corner leverage', 'blocking', 10),
  ('Z', 'Split right 10 yards', 'On numbers', 'Stalk block corner', 'Corner', 'blocking', 11)
) AS assignments(position, alignment, landmark, assignment, key_read, category, display_order);

-- ═══════════════════════════════════════════════════════════════════════════
-- Test Play 3: Gun Spread Stick (Pass Play - 3rd Down)
-- ═══════════════════════════════════════════════════════════════════════════

WITH new_metadata AS (
  INSERT INTO playbook_metadata (
    team_id,
    org_id,
    file_name,
    content_type,
    side_of_ball,
    formation_name,
    concept_name,
    play_type,
    unit,
    playbook_section,
    primary_classification,
    situation,
    is_active
  ) VALUES (
    :team_id,
    :org_id,
    'test-gun-spread-stick.png',
    'play',
    'offense',
    'Gun Spread',
    'Stick',
    'PASS',
    'O',
    'Pass Game',
    'Horizontal Stretch',
    '3rd and Medium',
    true
  ) RETURNING id
),
new_play AS (
  INSERT INTO plays (
    team_id,
    org_id,
    name,
    short_name,
    play_type,
    concept,
    formation_name,
    content_status,
    is_published,
    playbook_metadata_id,
    unit,
    playbook_section,
    primary_classification,
    situation
  )
  SELECT
    :team_id,
    :org_id,
    'Gun Spread Stick Nod',
    'Stick',
    'PASS',
    'Stick',
    'Gun Spread',
    'draft',
    true,
    id,
    'O',
    'Pass Game',
    'Horizontal Stretch',
    '3rd and Medium'
  FROM new_metadata
  RETURNING id, org_id
)
INSERT INTO play_assignments (
  play_id,
  org_id,
  position,
  alignment,
  landmark,
  assignment,
  key_read,
  category,
  display_order
)
SELECT
  new_play.id,
  new_play.org_id,
  position,
  alignment,
  landmark,
  assignment,
  key_read,
  category,
  display_order
FROM new_play, (VALUES
  ('QB', 'Gun', 'Behind center', '3-step drop, hi-lo read', 'Flat defender to #2 side', 'formation', 1),
  ('RB', 'Offset left', 'Behind left guard', 'Pass protect, check release', 'Blitzing linebacker', 'protection', 2),
  ('X', 'Split left 12 yards', 'On numbers', 'Vertical stem, stick route at 5 yards', 'Corner leverage', 'route', 3),
  ('Z', 'Split right 12 yards', 'On numbers', 'Go route, clear out deep third', 'Safety rotation', 'route', 4),
  ('H', 'Slot left 6 yards', 'Inside #1', 'Speed out to flat at 5 yards', 'Flat defender', 'route', 5),
  ('Y', 'Flex right 3 yards', 'Outside #1', '7-yard comeback', 'Corner depth', 'route', 6)
) AS assignments(position, alignment, landmark, assignment, key_read, category, display_order);

-- ═══════════════════════════════════════════════════════════════════════════
-- Verification
-- ═══════════════════════════════════════════════════════════════════════════

SELECT '✅ Test plays inserted!' as status;

SELECT
  'plays' as table_name,
  COUNT(*) as count
FROM plays
WHERE org_id = :org_id;

SELECT
  p.name,
  p.play_type,
  p.concept,
  p.content_status,
  COUNT(pa.id) as assignment_count
FROM plays p
LEFT JOIN play_assignments pa ON p.id = pa.play_id
WHERE p.org_id = :org_id
GROUP BY p.id, p.name, p.play_type, p.concept, p.content_status
ORDER BY p.created_at DESC;

SELECT '
Next steps:
1. Go to /coach/playbook
2. Click on any of these plays
3. Click "Regenerate Questions"
4. Wait ~10-20 seconds
5. Check the database for AI-generated questions!

Query to check questions:
SELECT question_type, topic, difficulty, question_prompt
FROM flashcard_templates
WHERE play_id IN (SELECT id FROM plays WHERE org_id = :org_id)
ORDER BY created_at DESC;
' as next_steps;
