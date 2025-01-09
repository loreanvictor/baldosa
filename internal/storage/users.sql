-- name: CreateUser :one
insert into users(email, password)
values (@email, @password)
returning *;
