# Mock Playbook Data

This folder contains SQL scripts to populate your database with sample playbook data for testing.

## Quick Start (No Images)

The fastest way to get test data is to run the script without images:

### Option 1: Supabase Dashboard SQL Editor

1. Go to your Supabase Dashboard
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the entire contents of `mock_data_no_images.sql`
5. Paste into the editor
6. Click **Run**

You should see: "Mock data inserted successfully!"

### Option 2: Command Line (if you have psql)

```bash
psql -h YOUR_SUPABASE_HOST -U postgres -d postgres -f mock_data_no_images.sql
```

## What Gets Created

This script creates **12 plays** across all units:

### Offensive Plays (6)
- ✅ **Trips Right Mesh** - Pass Game, 3rd Down (Approved)
- ✅ **Shotgun Inside Zone** - Run Game, 1st-2nd Down (Approved)
- ✅ **Spread Four Verticals** - Red Zone, Pass (Approved)
- 📝 **I-Formation Counter Trey** - Run Game (Draft)
- ✅ **Trips Left Bubble Screen** - Screen Game, 3rd & Short (Approved)
- 📝 **Doubles Stick** - Pass Game, 3rd Down (Draft)

### Defensive Plays (4)
- ✅ **Base Cover 3** - Coverage, 1st-2nd Down (Approved)
- ✅ **Nickel Fire Zone** - Pressure, 3rd & Long (Approved)
- 📝 **Bear Front** - Front, Goal Line (Draft)
- ✅ **Cover 2 Man** - Coverage, Red Zone (Approved)

### Special Teams Plays (2)
- ✅ **Standard Kickoff** - Kickoff (Approved)
- ✅ **Punt Safe** - Punt (Approved)

**Legend:**
- ✅ = Approved & Published (visible to players)
- 📝 = Draft (coach review needed)

## View Your Mock Data

After running the script:

1. **Coach Playbook View**: `/coach/playbook`
   - You'll see plays organized by Unit → Section → Classification
   - Use the status filter to see Draft vs Approved plays
   - Try the search and filters

2. **Database Tables**:
   - `playbook_metadata` - 12 records
   - `plays` - 12 records

## Adding Placeholder Images (Optional)

If you want to add placeholder images to make it more realistic:

### Step 1: Create Simple Placeholder Images

You can use any simple football diagram images, or create basic placeholders:

**Option A: Use a design tool**
- Use Canva, Figma, or PowerPoint
- Create 800x600px images
- Label them with play names
- Export as PNG

**Option B: Use placeholder image services**
- Go to https://placehold.co/800x600/png
- Save 12 images with descriptive names

**Option C: Use actual play diagrams**
- If you have any existing play diagrams, use those

### Step 2: Upload to Supabase Storage

1. Go to your Supabase Dashboard
2. Click **Storage** in the left sidebar
3. Click on **Chalkboard Bucket**
4. Create a folder: `public/mock-plays/`
5. Upload your images with these names:
   - `trips-mesh.png`
   - `inside-zone.png`
   - `four-verts.png`
   - `counter-trey.png`
   - `bubble-screen.png`
   - `stick.png`
   - `cover3.png`
   - `fire-zone.png`
   - `bear-front.png`
   - `cover2-man.png`
   - `kickoff.png`
   - `punt-safe.png`

### Step 3: Run the Script with Images

After uploading images, you can run `mock_data_insert.sql` instead:

1. Open `mock_data_insert.sql`
2. Verify the org_id is correct (already set to your org)
3. Run in Supabase SQL Editor

The plays will now have associated images in the library!

## Cleaning Up Mock Data

To remove all mock data:

```sql
-- Delete plays (will cascade to assignments/flashcards)
DELETE FROM plays
WHERE org_id = '986d0f15-e926-4f76-89e1-bf7c7f731923'
AND name IN (
  'Trips Right Mesh', 'Shotgun Inside Zone', 'Spread Four Verticals',
  'I-Formation Counter Trey', 'Trips Left Bubble Screen', 'Doubles Stick',
  'Base Cover 3', 'Nickel Fire Zone', 'Bear Front', 'Cover 2 Man',
  'Standard Kickoff', 'Punt Safe'
);

-- Delete metadata
DELETE FROM playbook_metadata
WHERE org_id = '986d0f15-e926-4f76-89e1-bf7c7f731923'
AND formation_name IN (
  'Trips Right', 'Shotgun', 'Spread', 'I-Formation', 'Trips Left', 'Doubles',
  'Base 4-3', 'Nickel', 'Bear', 'Standard Kickoff', 'Punt Formation'
);
```

## Testing Workflows

With this mock data, you can test:

1. **Organized View**:
   - See plays grouped by Unit (O/D/ST)
   - Expand/collapse sections
   - View classifications

2. **Filters**:
   - Filter by Unit
   - Filter by Status (Draft/Approved)
   - Filter by Section
   - Search plays

3. **Status Management**:
   - Approve draft plays
   - Unpublish plays
   - Bulk operations

4. **Table View**:
   - See all data in table format
   - Sort and filter
   - Multi-select

## Troubleshooting

**Error: "relation does not exist"**
- Make sure you've run migrations 013 and 014 first

**Error: "invalid input value for enum"**
- Check that the unit_type enum exists
- Run migration 013 again if needed

**Plays not showing in coach view**
- Check the status filter - make sure it's set to "All Statuses"
- Verify org_id matches your user's org

**No images showing**
- That's normal if you used `mock_data_no_images.sql`
- Images are optional and can be added later

## Next Steps

After inserting mock data:
1. View plays in `/coach/playbook`
2. Test the filters and search
3. Try approving/unpublishing plays
4. Test multi-select operations
5. Upload your own real plays to replace mock data
