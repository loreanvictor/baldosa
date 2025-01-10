package tiles

import (
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"

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

func (s *tilesServer) CreateTile(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "invalid method", http.StatusMethodNotAllowed)
		return
	}

	ctx := r.Context()
	var err error

	request := createTileRequest{}
	err = json.NewDecoder(r.Body).Decode(&request)
	if err != nil {
		slog.InfoContext(ctx, "invalid request body")
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	err = validateCreateTileRequest(request)
	if err != nil {
		slog.InfoContext(ctx, "invalid request body", "error", err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	tile, err := s.querier.CreateOrphanTile(ctx, s.pool, storage.CreateOrphanTileParams{
		X:        request.X,
		Y:        request.Y,
		Title:    request.Title,
		Subtitle: request.Subtitle,
		Image:    request.Image,
		Link:     request.Link,
	})
	if err != nil {
		slog.ErrorContext(
			ctx, "failed to create tile",
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

	response := createTileResponse{Tile: tile}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	err = json.NewEncoder(w).Encode(response)

	if err != nil {
		slog.ErrorContext(ctx, "failed to encode response", "error", err)
		http.Error(w, "failed to encode response", http.StatusInternalServerError)
	}
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
