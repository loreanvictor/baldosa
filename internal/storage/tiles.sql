-- name: CreateOrphanTile :one
insert into tiles(x, y, title, subtitle, image, link)
values (@x, @y, @title, @subtitle, @image, @link)
returning *;

-- name: AssignTile :one
update tiles
set owner=@owner
where id = @id
returning *;

-- name: EditTile :one
update tiles
set title=@title,
    subtitle=@subtitle,
    image=@image,
    link=@link,
    updated_at=current_timestamp
where id = @id
returning *;

-- name: GetTileByID :one
select *
from tiles
where id = @id;

-- name: GetTileRange :many
select *
from tiles
where x >= @x1
  and x <= @x2
  and y >= @y1
  and y <= @y2;
