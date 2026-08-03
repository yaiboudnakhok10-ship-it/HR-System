create extension if not exists "pgcrypto";

create table if not exists public.topic_records (
  id uuid primary key default gen_random_uuid(),
  topic text not null,
  recorded_by text not null,
  recorded_at timestamp with time zone default now()
);

grant select, insert, update, delete on table public.topic_records to anon, authenticated;
