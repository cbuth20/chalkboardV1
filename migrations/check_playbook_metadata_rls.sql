-- Check and fix RLS policies for playbook_metadata table
-- This ensures service role can delete records

-- First, let's see what policies exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'playbook_metadata';

-- Enable RLS if not already enabled
ALTER TABLE playbook_metadata ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Allow service role full access" ON playbook_metadata;
DROP POLICY IF EXISTS "Allow authenticated users to read" ON playbook_metadata;
DROP POLICY IF EXISTS "Allow team members to manage" ON playbook_metadata;

-- Policy 1: Service role has full access (bypasses RLS anyway, but good to be explicit)
CREATE POLICY "Service role full access"
ON playbook_metadata
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy 2: Authenticated users can read all playbook_metadata
CREATE POLICY "Authenticated users can read playbook_metadata"
ON playbook_metadata
FOR SELECT
TO authenticated
USING (true);

-- Policy 3: Users can insert their own team's playbook_metadata
CREATE POLICY "Users can insert their team playbook_metadata"
ON playbook_metadata
FOR INSERT
TO authenticated
WITH CHECK (
  team_id IN (
    SELECT team_id FROM team_members WHERE user_id = auth.uid()
  )
);

-- Policy 4: Users can update their own team's playbook_metadata
CREATE POLICY "Users can update their team playbook_metadata"
ON playbook_metadata
FOR UPDATE
TO authenticated
USING (
  team_id IN (
    SELECT team_id FROM team_members WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  team_id IN (
    SELECT team_id FROM team_members WHERE user_id = auth.uid()
  )
);

-- Policy 5: Users can delete their own team's playbook_metadata
CREATE POLICY "Users can delete their team playbook_metadata"
ON playbook_metadata
FOR DELETE
TO authenticated
USING (
  team_id IN (
    SELECT team_id FROM team_members WHERE user_id = auth.uid()
  )
);

-- Verify policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'playbook_metadata'
ORDER BY policyname;
