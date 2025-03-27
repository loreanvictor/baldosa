create table one_time_codes (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references users(id) on delete cascade,
  code                  varchar(6) not null,
  subject               varchar(255) not null,
  created_at            timestamptz not null default now(),
  expires_at            timestamptz not null default now()
)
