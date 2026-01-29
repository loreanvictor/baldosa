create type reaction_type as enum ('like');

create table reactions (
  bid_id uuid not null references bids(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  reaction reaction_type not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (bid_id, user_id)
);

-- speeds up fetching liked bids for a user
create index reactions_user_id_idx on reactions(user_id);

-- speeds up tallying reactions for a specific bid
create index reactions_bid_id_idx on reactions(bid_id);

-- speeds up tallying specific reaction types for a specific bid
create index reactions_bid_id_reaction_idx on reactions(bid_id, reaction);

-- summary table to keep track of reaction counts per bid
create table reaction_summary (
  bid_id uuid primary key references bids(id) on delete cascade,
  like_count integer not null default 0,
  updated_at timestamptz not null default now(),
  check (like_count >= 0)
);
