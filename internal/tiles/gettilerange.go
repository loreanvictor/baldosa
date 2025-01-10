package tiles

import (
	"context"

	"github.com/loreanvictor/baldosa.git/internal/storage"
)

type GetTileRangeRequest struct {
	XLow  int32 `json:"x_low"`
	XHigh int32 `json:"x_high"`
	YLow  int32 `json:"y_low"`
	YHigh int32 `json:"y_high"`
}

type GetTileRangeResponse struct {
	Tiles []storage.Tile `json:"tiles"`
}

func (s *tilesServer) GetTileRange(ctx context.Context, request GetTileRangeRequest) (GetTileRangeResponse, error) {
	tiles, err := s.querier.GetTileRange(
		ctx,
		s.pool,
		request.XLow,
		request.XHigh,
		request.YLow,
		request.YHigh,
	)
	return GetTileRangeResponse{Tiles: tiles}, err
}
