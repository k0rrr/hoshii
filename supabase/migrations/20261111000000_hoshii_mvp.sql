-- HOSHII MVP: additive schema and RLS setup.
-- Existing demand rows are retained. Apply only after reviewing the target project.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'HOSHIIユーザー' check (char_length(display_name) between 1 and 40),
  created_at timestamptz not null default now()
);

create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  demand_id uuid not null references public.demands(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint votes_demand_user_unique unique (demand_id, user_id)
);

create table if not exists public.vote_answers (
  id uuid primary key default gen_random_uuid(),
  vote_id uuid not null unique references public.votes(id) on delete cascade,
  price_range text not null check (price_range in ('〜500円', '501〜1,000円', '1,001〜2,000円', '2,001円以上')),
  usage_frequency text not null check (usage_frequency in ('週に数回', '週に1回', '月に数回', '月に1回以下')),
  comment text check (comment is null or char_length(comment) <= 240),
  created_at timestamptz not null default now()
);

-- Keep the existing user_id column, but ensure it references an authenticated user.
do $$
begin
  if not exists (
    select 1
    from pg_constraint c
    join pg_attribute a on a.attrelid = c.conrelid and a.attnum = any(c.conkey)
    where c.conrelid = 'public.demands'::regclass
      and c.confrelid = 'auth.users'::regclass
      and c.contype = 'f'
      and a.attname = 'user_id'
  ) then
    alter table public.demands
      add constraint demands_user_id_auth_users_fkey
      foreign key (user_id) references auth.users(id) on delete cascade;
  end if;
end $$;

alter table public.demands alter column created_at set default now();
create index if not exists demands_area_category_created_at_idx
  on public.demands (area, category, created_at desc);
create index if not exists votes_user_id_created_at_idx
  on public.votes (user_id, created_at desc);

alter table public.demands enable row level security;
alter table public.profiles enable row level security;
alter table public.votes enable row level security;
alter table public.vote_answers enable row level security;

-- Replace existing demand write policies so permissive legacy policies cannot bypass ownership.
do $$
declare p record;
begin
  for p in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'demands'
      and cmd in ('INSERT', 'UPDATE', 'DELETE', 'ALL')
  loop
    execute format('drop policy %I on public.demands', p.policyname);
  end loop;
end $$;

drop policy if exists demands_public_read on public.demands;
drop policy if exists demands_insert_owner on public.demands;
drop policy if exists demands_update_owner on public.demands;
drop policy if exists demands_delete_owner on public.demands;
create policy demands_public_read on public.demands for select using (true);
create policy demands_insert_owner on public.demands for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy demands_update_owner on public.demands for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy demands_delete_owner on public.demands for delete to authenticated
  using (user_id = (select auth.uid()));

-- Profiles expose only a display name; each user can edit only their own row.
drop policy if exists profiles_public_read on public.profiles;
drop policy if exists profiles_update_owner on public.profiles;
create policy profiles_public_read on public.profiles for select using (true);
create policy profiles_update_owner on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Votes are private per user. Public counts are returned by a narrow aggregate function below.
drop policy if exists votes_read_owner on public.votes;
drop policy if exists votes_insert_owner on public.votes;
drop policy if exists votes_delete_owner on public.votes;
create policy votes_read_owner on public.votes for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists vote_answers_read_owner on public.vote_answers;
drop policy if exists vote_answers_insert_owner on public.vote_answers;
create policy vote_answers_read_owner on public.vote_answers for select to authenticated
  using (exists (
    select 1 from public.votes v where v.id = vote_id and v.user_id = (select auth.uid())
  ));

-- Create a profile from signup metadata without storing the email in the public schema.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(nullif(left(trim(new.raw_user_meta_data ->> 'display_name'), 40), ''), 'HOSHIIユーザー')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

insert into public.profiles (id, display_name)
select u.id,
  coalesce(nullif(left(trim(u.raw_user_meta_data ->> 'display_name'), 40), ''), 'HOSHIIユーザー')
from auth.users u
on conflict (id) do nothing;

drop trigger if exists on_auth_user_created_hoshii on auth.users;
create trigger on_auth_user_created_hoshii
after insert on auth.users
for each row execute function public.handle_new_user();

-- One atomic action: prevent duplicate votes and ensure answer + vote are stored together.
create or replace function public.submit_vote(
  p_demand_id uuid,
  p_price_range text,
  p_usage_frequency text,
  p_comment text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare new_vote_id uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'ログインが必要です' using errcode = '42501';
  end if;
  if p_price_range not in ('〜500円', '501〜1,000円', '1,001〜2,000円', '2,001円以上') then
    raise exception '希望価格帯が正しくありません' using errcode = '22023';
  end if;
  if p_usage_frequency not in ('週に数回', '週に1回', '月に数回', '月に1回以下') then
    raise exception '利用頻度が正しくありません' using errcode = '22023';
  end if;
  if p_comment is not null and char_length(p_comment) > 240 then
    raise exception 'コメントは240文字以内です' using errcode = '22023';
  end if;

  insert into public.votes (demand_id, user_id)
  values (p_demand_id, (select auth.uid()))
  returning id into new_vote_id;

  insert into public.vote_answers (vote_id, price_range, usage_frequency, comment)
  values (new_vote_id, p_price_range, p_usage_frequency, nullif(trim(p_comment), ''));

  return new_vote_id;
end;
$$;

revoke all on function public.submit_vote(uuid, text, text, text) from public, anon;
grant execute on function public.submit_vote(uuid, text, text, text) to authenticated;

-- Return aggregate counts only; raw comments and other users' vote identities remain private.
create or replace function public.get_demand_stats(p_demand_ids uuid[])
returns table (
  demand_id uuid,
  supporter_count bigint,
  price_counts jsonb,
  frequency_counts jsonb
)
language sql
stable
security definer
set search_path = ''
as $$
  select d.id,
    (select count(*) from public.votes v where v.demand_id = d.id),
    coalesce((
      select jsonb_object_agg(q.price_range, q.answer_count)
      from (
        select va.price_range, count(*) as answer_count
        from public.votes v
        join public.vote_answers va on va.vote_id = v.id
        where v.demand_id = d.id
        group by va.price_range
      ) q
    ), '{}'::jsonb),
    coalesce((
      select jsonb_object_agg(q.usage_frequency, q.answer_count)
      from (
        select va.usage_frequency, count(*) as answer_count
        from public.votes v
        join public.vote_answers va on va.vote_id = v.id
        where v.demand_id = d.id
        group by va.usage_frequency
      ) q
    ), '{}'::jsonb)
  from public.demands d
  where d.id = any(coalesce(p_demand_ids, '{}'::uuid[]));
$$;

grant execute on function public.get_demand_stats(uuid[]) to anon, authenticated;

grant select on public.demands to anon, authenticated;
grant insert, update, delete on public.demands to authenticated;
grant select on public.profiles to anon, authenticated;
grant update on public.profiles to authenticated;
revoke all on public.votes from anon, authenticated;
revoke all on public.vote_answers from anon, authenticated;
grant select on public.votes to authenticated;
grant select on public.vote_answers to authenticated;

-- Validate new writes while preserving pre-existing rows for review.
do $$
begin
  if not exists (select 1 from pg_constraint where conrelid = 'public.demands'::regclass and conname = 'demands_content_valid') then
    alter table public.demands add constraint demands_content_valid check (
      title is not null and char_length(btrim(title)) between 1 and 80
      and description is not null and char_length(btrim(description)) between 1 and 300
      and area is not null and char_length(btrim(area)) between 1 and 80
      and category is not null and category in ('飲食', 'カフェ', 'ジム', '買い物', 'その他')
    ) not valid;
  end if;
end $$;
