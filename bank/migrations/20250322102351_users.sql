create table users (
  id                    uuid primary key,
  first_name            varchar(255) not null,
  last_name             varchar(255) not null,
  email                 varchar(255) unique not null,
  email_verified_at     timestamptz default null,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create table passkeys (
  id                    uuid primary key default gen_random_uuid(),
  key_name              varchar(255) not null,
  user_id               uuid not null references users(id) on delete cascade,
  credential_id         bytea unique not null,
  passkey_data          jsonb not null,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
