-- name: CreateTile :one
insert into tiles(x, y, owner)
values (@x, @y, @owner)
returning *;

-- name: EditTileByOwner :one
update tiles
set title     = @title,
    subtitle  = @subtitle,
    link      = @link,
    updated_at=now()
where x = @x
  and y = @y
  and owner = @owner
returning *;

-- name: GetTile :one
select *
from tiles
where x = @x
  and y = @y;

-- name: GetTileAvailabilityMap :many
select x, y
from tiles
where x >= @x
  and y >= @y
  and x < @xx
  and y < @yy;
