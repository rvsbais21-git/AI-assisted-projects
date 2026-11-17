-- PURGATORY cloud sync schema
-- Run once in Supabase SQL Editor. Never expose a service_role/secret key.

create table if not exists public.purgatory_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  version bigint not null default 1 check (version > 0),
  updated_at timestamptz not null default now()
);
alter table public.purgatory_state enable row level security;

drop policy if exists "Users can read their own PURGATORY state" on public.purgatory_state;
create policy "Users can read their own PURGATORY state" on public.purgatory_state
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Users can insert their own PURGATORY state" on public.purgatory_state;
create policy "Users can insert their own PURGATORY state" on public.purgatory_state
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Users can update their own PURGATORY state" on public.purgatory_state;
create policy "Users can update their own PURGATORY state" on public.purgatory_state
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

grant select, insert, update on public.purgatory_state to authenticated;

-- Compare-and-swap prevents one device silently overwriting another.
create or replace function public.save_purgatory_state(p_data jsonb, p_expected_version bigint)
returns table(saved boolean, current_version bigint, current_updated_at timestamptz)
language plpgsql security invoker set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_version bigint;
  v_updated_at timestamptz;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;

  if p_expected_version = 0 then
    insert into public.purgatory_state(user_id, data, version, updated_at)
    values (v_user_id, coalesce(p_data, '{}'::jsonb), 1, now())
    on conflict (user_id) do nothing
    returning version, updated_at into v_version, v_updated_at;
    if found then
      return query select true, v_version, v_updated_at;
      return;
    end if;
  else
    update public.purgatory_state
       set data = coalesce(p_data, '{}'::jsonb), version = version + 1, updated_at = now()
     where user_id = v_user_id and version = p_expected_version
    returning version, updated_at into v_version, v_updated_at;
    if found then
      return query select true, v_version, v_updated_at;
      return;
    end if;
  end if;

  select s.version, s.updated_at into v_version, v_updated_at
    from public.purgatory_state s where s.user_id = v_user_id;
  return query select false, v_version, v_updated_at;
end;
$$;
grant execute on function public.save_purgatory_state(jsonb, bigint) to authenticated;

-- Private file bucket; object paths must begin with the authenticated user UUID.
insert into storage.buckets (id, name, public)
values ('purgatory-files', 'purgatory-files', false)
on conflict (id) do update set public = false;

drop policy if exists "Users can read their own PURGATORY files" on storage.objects;
create policy "Users can read their own PURGATORY files" on storage.objects
  for select to authenticated using (bucket_id = 'purgatory-files' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "Users can upload their own PURGATORY files" on storage.objects;
create policy "Users can upload their own PURGATORY files" on storage.objects
  for insert to authenticated with check (bucket_id = 'purgatory-files' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "Users can update their own PURGATORY files" on storage.objects;
create policy "Users can update their own PURGATORY files" on storage.objects
  for update to authenticated using (bucket_id = 'purgatory-files' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'purgatory-files' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "Users can delete their own PURGATORY files" on storage.objects;
create policy "Users can delete their own PURGATORY files" on storage.objects
  for delete to authenticated using (bucket_id = 'purgatory-files' and (storage.foldername(name))[1] = auth.uid()::text);

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'purgatory_state') then
    alter publication supabase_realtime add table public.purgatory_state;
  end if;
end $$;
