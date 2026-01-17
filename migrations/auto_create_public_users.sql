-- Migration: Auto-create public.users record when auth user is created
-- This ensures the foreign key constraint on team_members.user_id is satisfied

-- Create function to handle new auth user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert new user into public.users table (only required columns)
  INSERT INTO public.users (auth_id, email, first_name, last_name, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      SPLIT_PART(NEW.email, '@', 1),
      'Player'
    )
  )
  ON CONFLICT (auth_id) DO NOTHING;  -- Skip if already exists

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Backfill existing auth users that don't have public.users records
INSERT INTO public.users (auth_id, email, first_name, last_name, display_name)
SELECT
  au.id as auth_id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'first_name', '') as first_name,
  COALESCE(au.raw_user_meta_data->>'last_name', '') as last_name,
  COALESCE(
    au.raw_user_meta_data->>'display_name',
    SPLIT_PART(au.email, '@', 1),
    'Player'
  ) as display_name
FROM auth.users au
LEFT JOIN public.users pu ON pu.auth_id = au.id
WHERE pu.id IS NULL;

-- Add comment
COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates a record in public.users when a new auth.users record is created. This ensures foreign key constraints on team_members work correctly.';
