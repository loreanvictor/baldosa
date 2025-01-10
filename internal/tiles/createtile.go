package tiles

import (
	"context"
	"errors"
	"log/slog"

	"github.com/loreanvictor/baldosa.git/internal/storage"
)

type createTileRequest struct {
	X int32 `json:"x"`
	Y int32 `json:"y"`

	Title    string `json:"title"`
	Subtitle string `json:"subtitle"`
	Link     string `json:"link"`

	Image string `json:"image"`
}

type createTileResponse struct {
	Tile storage.Tile `json:"tile"`
}

func (s *tilesServer) CreateTile(ctx context.Context, request createTileRequest) (createTileResponse, error) {
	err := validateCreateTileRequest(request)
	if err != nil {
		slog.InfoContext(ctx, "invalid request body", "error", err)
		return createTileResponse{}, err
	}

	tile, err := s.querier.CreateOrphanTile(ctx, s.pool, storage.CreateOrphanTileParams{
		X:        request.X,
		Y:        request.Y,
		Title:    request.Title,
		Subtitle: request.Subtitle,
		Image:    request.Image,
		Link:     request.Link,
	})
	return createTileResponse{Tile: tile}, err
}

func validateCreateTileRequest(request createTileRequest) error {
	if len(request.Title) == 0 {
		return errors.New("title is required")
	}
	if len(request.Title) > 120 {
		return errors.New("title is too long")
	}

	if len(request.Subtitle) > 120 {
		return errors.New("subtitle is too long")
	}

	if err := ValidateLink(request.Link); err != nil {
		return err
	}

	return nil
}
