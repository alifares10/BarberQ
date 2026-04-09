drop policy if exists "shop_media_read" on storage.objects;
create policy "shop_media_read"
on storage.objects
for select
to authenticated
using (bucket_id = 'shop-media');

drop policy if exists "shop_media_insert_own_folder" on storage.objects;
create policy "shop_media_insert_own_folder"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'shop-media'
  and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists "shop_media_update_own_folder" on storage.objects;
create policy "shop_media_update_own_folder"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'shop-media'
  and split_part(name, '/', 1) = auth.uid()::text
)
with check (
  bucket_id = 'shop-media'
  and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists "shop_media_delete_own_folder" on storage.objects;
create policy "shop_media_delete_own_folder"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'shop-media'
  and split_part(name, '/', 1) = auth.uid()::text
);
