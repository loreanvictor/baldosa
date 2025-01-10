package tiles

import (
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"

	"github.com/loreanvictor/baldosa.git/internal/storage"
)

func (s *tilesServer) CreateTile(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Invalid method", http.StatusMethodNotAllowed)
		return
	}

	ctx := r.Context()
	var err error

	params := storage.CreateOrphanTileParams{}
	err = json.NewDecoder(r.Body).Decode(&params)
	if err != nil {
		slog.InfoContext(r.Context(), "Invalid request body")
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	err = validateCreateOrphanTileParams(params)
	if err != nil {
		slog.InfoContext(r.Context(), "Invalid request body", "error", err.Error())
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	tile, err := s.querier.CreateOrphanTile(ctx, s.pool, params)
	if err != nil {
		slog.ErrorContext(
			r.Context(), "failed to create tile",
			"error", err,
			"params", params,
		)

		code, storageErr := storage.TransformPgxError(err)
		if storageErr != nil {
			http.Error(w, storageErr.Error(), code)
		} else {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}

		return
	}

	tileJSON := tile.JSON()
	w.Header().Set("Content-Type", "application/json")
	w.Write(tileJSON)
}

func validateCreateOrphanTileParams(params storage.CreateOrphanTileParams) error {
	if len(params.Title) == 0 {
		return errors.New("title is required")
	}
	if len(params.Title) > 120 {
		return errors.New("title is too long")
	}

	if len(params.Subtitle) > 120 {
		return errors.New("subtitle is too long")
	}

	if err := ValidateLink(params.Link); err != nil {
		return err
	}

	return nil
}
