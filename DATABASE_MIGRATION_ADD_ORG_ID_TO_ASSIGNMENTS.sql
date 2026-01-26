-- Add org_id column to play_assignments table for proper multi-tenancy scoping
-- This column should reference the organizations table and be required

-- Step 1: Add the column as nullable first
ALTER TABLE play_assignments
ADD COLUMN org_id UUID;

-- Step 2: Backfill existing rows with org_id from their related play
UPDATE play_assignments pa
SET org_id = p.org_id
FROM plays p
WHERE pa.play_id = p.id;

-- Step 3: Make the column NOT NULL (now that all rows have values)
ALTER TABLE play_assignments
ALTER COLUMN org_id SET NOT NULL;

-- Step 4: Add foreign key constraint
ALTER TABLE play_assignments
ADD CONSTRAINT play_assignments_org_id_fkey
FOREIGN KEY (org_id)
REFERENCES organizations(id)
ON DELETE CASCADE;

-- Step 5: Add index for performance on org_id queries
CREATE INDEX idx_play_assignments_org_id ON play_assignments(org_id);

-- Add comment
COMMENT ON COLUMN play_assignments.org_id IS
'Organization that owns this assignment. Required for multi-tenancy scoping.';
