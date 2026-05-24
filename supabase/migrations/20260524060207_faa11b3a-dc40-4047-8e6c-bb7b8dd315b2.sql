
insert into storage.buckets (id, name, public)
values ('book-covers', 'book-covers', true)
on conflict (id) do nothing;

create policy "Public can view book covers"
on storage.objects for select
using (bucket_id = 'book-covers');

create policy "Authenticated can upload book covers"
on storage.objects for insert
to authenticated
with check (bucket_id = 'book-covers');

create policy "Authenticated can update book covers"
on storage.objects for update
to authenticated
using (bucket_id = 'book-covers');

create policy "Authenticated can delete book covers"
on storage.objects for delete
to authenticated
using (bucket_id = 'book-covers');
