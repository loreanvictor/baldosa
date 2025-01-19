create table users
(
    email      text primary key,
    password   text        not null,
    coins      int         not null default 100,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table tiles
(
    x          int         not null,
    y          int         not null,

    owner      text        not null
        constraint tiles_owner_fk references users (email) on delete restrict,
    title      text        not null default '',
    subtitle   text        not null default '',
    link       text        not null default '',

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    expires_at timestamptz not null default now(),

    primary key (x, y)
);

create or replace function update_updated_at_column()
    returns trigger as
$$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger set_updated_at_before_insert_or_update_user
    before insert or update
    on users
    for each row
execute procedure update_updated_at_column();

create trigger set_updated_at_before_insert_or_update_tile
    before insert or update
    on tiles
    for each row
execute procedure update_updated_at_column();
