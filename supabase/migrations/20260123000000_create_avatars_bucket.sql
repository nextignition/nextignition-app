-- Create avatars storage bucket (and basic RLS policies) required by app/(tabs)/profile.tsx avatar upload.
-- NOTE: RLS policies do NOT create buckets. The bucket must exist in storage.buckets.

-- 1) Ensure bucket exists
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update
set name = excluded.name,
    public = excluded.public;

-- 2) Ensure RLS policies exist for storage.objects on avatars bucket
-- Supabase doesn't support "create policy if not exists", so we guard with pg_policies checks.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Users can upload own avatars'
  ) then
    execute $p$
      create policy "Users can upload own avatars"
      on storage.objects for insert
      with check (
        bucket_id = 'avatars'
        and (storage.foldername(name))[1] = auth.uid()::text
      );
    $p$;
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Public can view avatars'
  ) then
    execute $p$
      create policy "Public can view avatars"
      on storage.objects for select
      using (bucket_id = 'avatars');
    $p$;
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Users can update own avatars'
  ) then
    execute $p$
      create policy "Users can update own avatars"
      on storage.objects for update
      using (
        bucket_id = 'avatars'
        and (storage.foldername(name))[1] = auth.uid()::text
      );
    $p$;
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Users can delete own avatars'
  ) then
    execute $p$
      create policy "Users can delete own avatars"
      on storage.objects for delete
      using (
        bucket_id = 'avatars'
        and (storage.foldername(name))[1] = auth.uid()::text
      );
    $p$;
  end if;
end $$;


