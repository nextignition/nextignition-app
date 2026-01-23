-- Add avatar_url to profiles (required by app/(tabs)/profile.tsx)
-- Fixes PostgREST schema cache error: PGRST204 "Could not find the 'avatar_url' column of 'profiles'"

alter table public.profiles
add column if not exists avatar_url text;

-- Optional: ask PostgREST to reload schema cache (works on Supabase-managed PostgREST)
do $$
begin
  perform pg_notify('pgrst', 'reload schema');
exception
  when others then
    -- ignore if notify channel isn't available in this environment
    null;
end $$;


