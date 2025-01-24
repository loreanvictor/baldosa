package tiles

import (
	"context"
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"strconv"

	"github.com/jackc/pgx/v5"

	"github.com/loreanvictor/baldosa.git/server/internal/storage"
)

type GetTileRequest struct {
	X int32 `json:"x"`
	Y int32 `json:"y"`
}

type GetTileResponse struct {
	Tile  storage.Tile `json:"tile,omitempty"`
	Price int32        `json:"price,omitempty"`
}

func (s *server) GetTile(ctx context.Context, request GetTileRequest) (GetTileResponse, error) {
	tile, err := s.querier.GetTile(ctx, s.pool, request.X, request.Y)

	if errors.Is(err, pgx.ErrNoRows) {
		return GetTileResponse{
			Price: TileBasePrice,
		}, nil
	}

	return GetTileResponse{Tile: tile}, err
}

func (s *server) GetTileHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "invalid method", http.StatusMethodNotAllowed)
		return
	}

	xRaw := r.PathValue("x")
	yRaw := r.PathValue("y")

	x, errX := strconv.ParseInt(xRaw, 10, 32)
	y, errY := strconv.ParseInt(yRaw, 10, 32)
	if errX != nil || errY != nil {
		http.Error(w, "invalid coordinates", http.StatusBadRequest)
	}

	ctx := r.Context()

	request := GetTileRequest{
		X: int32(x),
		Y: int32(y),
	}
	response, err := s.GetTile(ctx, request)

	if err != nil {
		slog.ErrorContext(
			ctx, "request failed",
			"path", r.URL.Path,
			"error", err,
		)

		code, storageErr := storage.TransformPgxError(err)
		if storageErr != nil {
			http.Error(w, storageErr.Error(), code)
		} else {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}

		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	err = json.NewEncoder(w).Encode(response)
	if err != nil {
		slog.ErrorContext(
			ctx, "failed to encode response",
			"error", err,
			"path", r.URL.Path,
			"response", response,
		)
		http.Error(w, "failed to encode response", http.StatusInternalServerError)
		return
	}
}
