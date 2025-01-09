// Code generated by sqlc. DO NOT EDIT.
// versions:
//   sqlc v1.27.0

package storage

import (
	"context"
)

type Querier interface {
	AssignTile(ctx context.Context, owner *string, iD int64) (Tile, error)
	CreateOrphanTile(ctx context.Context, arg CreateOrphanTileParams) (Tile, error)
	CreateUser(ctx context.Context, email string, password string) (User, error)
	EditTile(ctx context.Context, arg EditTileParams) (Tile, error)
	GetTileByID(ctx context.Context, id int64) (Tile, error)
	GetTileRange(ctx context.Context, x1 int64, x2 int64, y1 int64, y2 int64) ([]Tile, error)
}

var _ Querier = (*Queries)(nil)