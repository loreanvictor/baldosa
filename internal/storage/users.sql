-- name: CreateUser :one
insert into users(email, password)
values (@email, @password)
returning *;


-- name: GetUser :one
select *
from users
where email = @email;
