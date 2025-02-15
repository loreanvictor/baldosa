create table tiles (
    x int not null,
    y int not null,
    color_hex char(7) not null,
    primary key (x, y)
) without rowid;

create index idx_tiles_xy on tiles (x, y);