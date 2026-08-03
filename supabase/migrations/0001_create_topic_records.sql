create extension if not exists "pgcrypto";

create table if not exists topic_records (
  id uuid primary key default gen_random_uuid(),
  topic text not null,
  recorded_by text not null,
  recorded_at timestamp with time zone default now()
);

