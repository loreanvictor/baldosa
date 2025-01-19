// Code generated by sqlc. DO NOT EDIT.
// versions:
//   sqlc v1.27.0

package storage

import (
	"context"
)

type Querier interface {
	CreateTile(ctx context.Context, db DBTX, x int32, y int32, owner string) (Tile, error)
	CreateUser(ctx context.Context, db DBTX, email string, password string) (User, error)
	EditTileByOwner(ctx context.Context, db DBTX, arg EditTileByOwnerParams) (Tile, error)
	GetTile(ctx context.Context, db DBTX, x int32, y int32) (Tile, error)
	GetUser(ctx context.Context, db DBTX, email string) (User, error)
	SpendCoins(ctx context.Context, db DBTX, coins int32, email string) (User, error)
}

var _ Querier = (*Queries)(nil)
