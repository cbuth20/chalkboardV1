-- Fix: prevent auth.users -> public.users trigger from failing on UNIQUE(email)
-- Problem:
--   If a row already exists in public.users with the same email (often with auth_id NULL),
--   the trigger insert can throw a unique_violation and Supabase Auth returns:
--     "Database error creating new user"
--
-- Solution:
--   1) If a public.users row exists with the same email and auth_id IS NULL, we attach auth_id.
--   2) Otherwise, we attempt to insert, but swallow unique violations so auth user creation is not blocked.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- If a placeholder user exists (same email, no auth_id), attach the auth_id
  UPDATE public.users
  SET auth_id = NEW.id
  WHERE email = NEW.email
    AND auth_id IS NULL;

  -- If we updated an existing row, we're done
  IF FOUND THEN
    RETURN NEW;
  END IF;

  -- Otherwise, try to insert a new row.
  BEGIN
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
    );
  EXCEPTION
    WHEN unique_violation THEN
      -- Don't block auth user creation if a conflicting row already exists.
      NULL;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

