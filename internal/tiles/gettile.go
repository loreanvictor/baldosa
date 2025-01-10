package tiles

import (
	"encoding/json"
	"log/slog"
	"net/http"

	"github.com/loreanvictor/baldosa.git/internal/storage"
)

type getTileRequest struct {
	ID int64 `json:"id"`
}

type getTileResponse struct {
	Tile storage.Tile `json:"tile"`
}

func (s *tilesServer) GetTile(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "invalid method", http.StatusMethodNotAllowed)
		return
	}

	ctx := r.Context()
	var err error

	request := getTileRequest{}
	err = json.NewDecoder(r.Body).Decode(&request)
	if err != nil {
		slog.InfoContext(ctx, "invalid request body")
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	tile, err := s.querier.GetTileByID(ctx, s.pool, request.ID)
	if err != nil {
		slog.ErrorContext(
			ctx, "failed to get tile",
			"error", err,
			"request", request,
		)

		code, storageErr := storage.TransformPgxError(err)
		if storageErr != nil {
			http.Error(w, storageErr.Error(), code)
		} else {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}

		return
	}

	response := getTileResponse{Tile: tile}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	err = json.NewEncoder(w).Encode(response)
	if err != nil {
		slog.ErrorContext(ctx, "failed to encode response", "error", err)
		http.Error(w, "failed to encode response", http.StatusInternalServerError)
	}
}
