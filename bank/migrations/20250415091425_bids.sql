-- each bid represents a proposal to publish some content to a tile.
-- each bid accompanies a transaction. bids only will be considered
-- if their corresponding transaction is unused at the time of the auction.
--
-- the auction will happen when there is a bid on a tile, and it has
-- never had anything published to it, or the last time content was published
-- to it was more than a day ago.
create table bids (
  id              uuid          primary key default gen_random_uuid(), 
  bidder          uuid          not null references users(id),
  tx              uuid          not null references transactions(id) unique,

  x               int           not null,
  y               int           not null,

  -- content is kept flexible here, so changes in content schema
  -- won't affect the bidding system.
  --
  -- NOTE: bids are designed to be immutable, so if the content is
  -- supposed to change after the bid is submitted, technically
  -- the previous bid SHOULD be rescinded and a new bid MUST be
  -- submitted.
  content         jsonb         not null,

  -- the amount here should be equivalent to the amount of coins
  -- offered via the transaction. this constrained should be checked
  -- at bid creation time in code.
  amount          integer       not null,

  created_at      timestamptz   not null default now(),
  published_at    timestamptz   default null,

  -- bids might get rejected before or after they are published,
  -- for violating content policies. any details of a rejection can
  -- be stored in this field.
  rejection       jsonb         default null
);

-- this partial index speeds up fetching all open bids,
-- either on a tile or in general (though it is designed
-- specifically for filtering or grouping on a tile)
create index idx_open_bids_by_xy
  on bids (x, y, amount desc)
  include (tx, id, content)
  where published_at is null and rejection is null
;

-- this index speeds up fetching bids of a user
create index idx_open_bids_by_user on bids (bidder);

-- this index on transactions table ensures unused transactions
-- can be swiftly joined with the bids table to ensure the
-- underlying transaction of a bid isn't spent in the meanwhile.
create index idx_unused_transactions
  on transactions (id)
  where consumed is false and merged is false
;

-- this table holds info on published content on a tile.
-- this is technically a "view" (or a "materialized view")
-- on bids, but it is kept as separate state for performance.
-- additionally, keeping it separate allows graceful unpublishing
-- of content from tiles without affecting bids.
create table published_tiles (
  x                  int           not null,
  y                  int           not null,
  last_published_at  timestamptz   not null default now(),
  occupant_bid       uuid          default null references bids(id),

  primary key (x, y)
);

-- the corresponding auction of a given tile x,y needs to happen ASAP if:
-- * there is no last publish (nothing ever published here),
-- * there are no occupying bids (the last published bid is either rejected
--   or the content removed for some other reason, e.g. by the user),
-- * the last published bid is more than a day old.
--
-- this index speeds up range scans for tiles with last publish time
-- later than a specified interval.
create index idx_tiles_publish_time on published_tiles (last_published_at);

-- this index helps join published tiles with bids
create index idx_tiles_occupant on published_tiles (occupant_bid);
