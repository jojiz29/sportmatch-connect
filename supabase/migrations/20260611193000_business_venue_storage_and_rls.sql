-- Las empresas administran únicamente sus propias sedes.
drop policy if exists "courts_business_insert" on public.courts;
create policy "courts_business_insert"
on public.courts for insert
to authenticated
with check (
  auth.uid() = owner_id
  and exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.user_role = 'BUSINESS'
  )
);

drop policy if exists "courts_business_update" on public.courts;
create policy "courts_business_update"
on public.courts for update
to authenticated
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

drop policy if exists "courts_business_delete" on public.courts;
create policy "courts_business_delete"
on public.courts for delete
to authenticated
using (auth.uid() = owner_id);

-- Las imágenes viven en Storage; courts.image_url guarda solamente la referencia pública.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'venue-images',
  'venue-images',
  true,
  2621440,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "venue_images_public_read" on storage.objects;
create policy "venue_images_public_read"
on storage.objects for select
using (bucket_id = 'venue-images');

drop policy if exists "venue_images_business_insert" on storage.objects;
create policy "venue_images_business_insert"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'venue-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "venue_images_business_delete" on storage.objects;
create policy "venue_images_business_delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'venue-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);
