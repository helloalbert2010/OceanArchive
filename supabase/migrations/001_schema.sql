create extension if not exists pgcrypto;

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author text not null check (char_length(author) between 1 and 24),
  title text not null check (char_length(title) between 1 and 60),
  body text not null check (char_length(body) between 1 and 2000),
  images text[] not null default '{}',
  likes integer not null default 0 check (likes >= 0),
  text_analysis text not null,
  image_analysis text,
  created_at timestamptz not null default now()
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author text not null default '海上来客' check (char_length(author) between 1 and 24),
  body text not null check (char_length(body) between 1 and 400),
  created_at timestamptz not null default now()
);

create index if not exists posts_created_at_idx on public.posts(created_at desc);
create index if not exists comments_post_id_idx on public.comments(post_id, created_at);

alter table public.posts enable row level security;
alter table public.comments enable row level security;

create policy "posts are publicly readable" on public.posts for select using (true);
create policy "anyone can publish posts" on public.posts for insert with check (true);
create policy "comments are publicly readable" on public.comments for select using (true);
create policy "anyone can comment" on public.comments for insert with check (true);

create or replace function public.increment_post_likes(target_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  next_likes integer;
begin
  update public.posts set likes = likes + 1 where id = target_id returning likes into next_likes;
  return next_likes;
end;
$$;

grant execute on function public.increment_post_likes(uuid) to anon, authenticated;

insert into storage.buckets (id, name, public)
values ('post-images', 'post-images', true)
on conflict (id) do update set public = excluded.public;

create policy "post images are publicly readable" on storage.objects
for select using (bucket_id = 'post-images');

create policy "anyone can upload post images" on storage.objects
for insert with check (bucket_id = 'post-images');
