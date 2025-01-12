-- name: CreateUser :one
insert into users(email, password)
values (@email, @password)
returning *;

-- name: GetUser :one
select *
from users
where email = @email;

-- name: SpendCoins :one
update users
set coins = coins - @coins
where email = @email
returning *;
