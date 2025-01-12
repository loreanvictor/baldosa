-- name: CreateOrphanTile :one
insert into tiles(x, y, title, subtitle, link)
values (@x, @y, @title, @subtitle, @link)
returning *;

-- name: CreateTile :one
insert into tiles(x, y, owner)
values (@x, @y, @owner)
returning *;

-- name: AssignTile :one
update tiles
set owner = @owner
where id = @id
returning *;

-- name: EditTile :one
update tiles
set title     = @title,
    subtitle  = @subtitle,
    link      = @link,
    updated_at=now()
where id = @id
returning *;

-- name: GetTileByID :one
select *
from tiles
where id = @id;

-- name: GetTile :one
select *
from tiles
where x = @x
  and y = @y;

-- name: GetTileRange :many
select *
from tiles
where x >= @x1
  and x <= @x2
  and y >= @y1
  and y <= @y2;
