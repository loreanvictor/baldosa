-- transactions are designed based on the OCSL model.
-- in this model we have an immutable ledger of transactions, that
-- can be forked into new or merged into existing transactions. A user's
-- balance is represented by a transaction from the user to themselves.
-- see https://gist.github.com/loreanvictor/3425d6d52228bc3dd953b2d636d50f86
-- for further info.
create table transactions (
  id                    uuid         primary key default gen_random_uuid(),
  sender                uuid         default null references users(id),
  receiver              uuid         default null references users(id),
  consumes              uuid         default null references transactions(id),
  consumed_value        integer      not null,
  merges                uuid         default null references transactions(id),
  merged_value          integer      not null default 0,

  -- a state transaction is a snapshot of a user's balance,
  -- represented by a transaction from the user to themselves.
  is_state              boolean      not null generated always as (
                                       (sender is null and sender_sys is null) or
                                       coalesce(sender = receiver, false) or
                                       coalesce(sender_sys = receiver_sys, false)
                                     ) stored,

  -- the transaction can be from, or to, a system account,
  -- instead of a normal user.
  sender_sys            varchar(255) default null,
  receiver_sys          varchar(255) default null,

  consumed              boolean      not null default false,
  merged                boolean      not null default false,
  note                  varchar(255) default null,
  created_at            timestamptz  not null default now(),
  issued_by             uuid         not null references users(id),

  -- we define some integrity constraints directly
  -- on the table here. note that not all constraints are
  -- efficiently expressed in SQL, due to multi-row nature
  -- of them.

  -- the transaction is either from a normal user or a system user
  constraint user_or_system_sender
    check ((sender is null) or (sender_sys is null)),

  -- the transaction is either to a normal user or a system user
  constraint user_or_system_receiver
    check ((receiver is null) or (receiver_sys is null)),

  -- each transaction MUST have a receiver
  constraint receiver_defined 
    check ((receiver is not null) or (receiver_sys is not null)),

  -- only state transactions can merge other transactions
  constraint only_states_can_merge
    check ((is_state = true) or (merges is null)),

  -- if there is a sender, the transaction must consume another transaction
  constraint no_consume_without_sender
    check (((sender is null) and (sender_sys is null)) = (consumes is null))
);

-- this index allows quickly fetching
-- a user's balance (the state transaction thats not
-- consumed or merged yet).)
create index idx_user_balance
  on transactions (receiver)
  where is_state is true and consumed is false and merged is false;

-- this index allows quickly fetching all
-- available transactions a user can spend (or merge
-- into their balance).)
create index idx_user_open_offers
  on transactions (receiver)
  where consumed is false and merged is false;

-- this index allows quickly fetching
-- a system user's balance (the state transaction thats not
-- consumed or merged yet).
create index idx_system_user_balance
  on transactions (receiver_sys)
  where is_state is true and consumed is false and merged is false;

-- this index allows quickly fetching all
-- open offers for a system user.
create index idx_system_user_open_offers
  on transactions (receiver_sys)
  where consumed is false and merged is false;

-- this function, and the subsequent trigger,
-- ensure that core transaction data is immutable,
-- and can't be changed once created, providing
-- additional integrity guarantees.
create function ensure_transaction_immutability() returns trigger as $$
  begin
    if 
      old.sender         is distinct from         new.sender or
      old.sender_sys     is distinct from     new.sender_sys or
      old.receiver       is distinct from       new.receiver or
      old.receiver_sys   is distinct from   new.receiver_sys or
      old.consumes       is distinct from       new.consumes or
      old.consumed_value is distinct from new.consumed_value or
      old.merges         is distinct from         new.merges or
      old.merged_value   is distinct from   new.merged_value or
      old.note           is distinct from           new.note or
      old.created_at     is distinct from     new.created_at
    then
      raise exception 'Cannot update readonly transaction columns';
    end if;
    return new;
  end;
$$ language plpgsql;

create trigger immutable_transactions
  before update on transactions
  for each row execute procedure ensure_transaction_immutability();

-- ensures consumed transactions are marked as such.
-- similarly, ensures that merged transactions are marked as such.
create function consume_transaction() returns trigger as $$
  begin
    if new.consumes is not null then
      update transactions set consumed = true where id = new.consumes;
    end if;
    if new.merges is not null then
      update transactions set merged = true where id = new.merges;
    end if;
    return new;
  end;
$$ language plpgsql;

create trigger mark_consumed_transactions
  before insert on transactions
  for each row execute procedure consume_transaction();
