package tiles

import (
	"context"

	"github.com/loreanvictor/baldosa.git/server/internal/storage"
)

type getTileRequest struct {
	ID int64 `json:"id"`
}

type getTileResponse struct {
	Tile storage.Tile `json:"tile"`
}

func (s *tilesServer) GetTile(ctx context.Context, request getTileRequest) (getTileResponse, error) {
	tile, err := s.querier.GetTileByID(ctx, s.pool, request.ID)
	return getTileResponse{Tile: tile}, err
}
