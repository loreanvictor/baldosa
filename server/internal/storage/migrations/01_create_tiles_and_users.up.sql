create table users
(
    email      text primary key,
    password   text      not null,

    created_at timestamp not null default current_timestamp,
    updated_at timestamp not null default current_timestamp
);

create table tiles
(
    id         int primary key,

    x          int       not null,
    y          int       not null,

    owner      text,
    title      text      not null check ( length(title) > 0 ),
    subtitle   text      not null default '',
    image      text      not null,
    link       text      not null default '',

    created_at timestamp not null default current_timestamp,
    updated_at timestamp not null default current_timestamp,

    constraint fk_owner foreign key (owner) references users (email) on delete restrict,
    constraint unique_xy unique (x, y)
);
