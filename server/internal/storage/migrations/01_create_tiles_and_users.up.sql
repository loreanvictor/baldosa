create table users
(
    email      text primary key,
    password   text        not null,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table tiles
(
    id         bigserial primary key,

    x          int         not null,
    y          int         not null,

    owner      text,
    title      text        not null check ( length(title) > 0 ),
    subtitle   text        not null default '',
    image      text        not null default '',
    link       text        not null default '',

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    constraint fk_owner foreign key (owner) references users (email) on delete restrict,
    constraint unique_xy unique (x, y)
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
