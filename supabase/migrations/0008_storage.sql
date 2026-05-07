-- 0008_storage.sql — Storage buckets and policies

insert into storage.buckets (id, name, public) values
  ('receipts',  'receipts',  false),
  ('evidence',  'evidence',  false),
  ('voice',     'voice',     false),
  ('avatars',   'avatars',   true),
  ('shop',      'shop',      true)
on conflict (id) do nothing;

-- receipts bucket: owner write, owner + parent read.
drop policy if exists receipts_owner_rw on storage.objects;
create policy receipts_owner_rw on storage.objects
  for all to authenticated
  using (
    bucket_id = 'receipts'
    and (
      auth.uid()::text = split_part(name, '/', 1)
      or private.is_parent_of(auth.uid(), (split_part(name, '/', 1))::uuid)
    )
  )
  with check (
    bucket_id = 'receipts'
    and auth.uid()::text = split_part(name, '/', 1)
  );

drop policy if exists evidence_owner_rw on storage.objects;
create policy evidence_owner_rw on storage.objects
  for all to authenticated
  using (
    bucket_id = 'evidence'
    and (
      auth.uid()::text = split_part(name, '/', 1)
      or private.is_parent_of(auth.uid(), (split_part(name, '/', 1))::uuid)
    )
  )
  with check (
    bucket_id = 'evidence'
    and auth.uid()::text = split_part(name, '/', 1)
  );

drop policy if exists voice_owner_rw on storage.objects;
create policy voice_owner_rw on storage.objects
  for all to authenticated
  using (
    bucket_id = 'voice'
    and auth.uid()::text = split_part(name, '/', 1)
  )
  with check (
    bucket_id = 'voice'
    and auth.uid()::text = split_part(name, '/', 1)
  );

drop policy if exists avatars_owner_write on storage.objects;
create policy avatars_owner_write on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = split_part(name, '/', 1)
  );

-- Public read for avatars/shop is granted by the bucket's public flag.
