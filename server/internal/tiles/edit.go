package tiles

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"strconv"

	"github.com/loreanvictor/baldosa.git/server/internal/middleware"
	"github.com/loreanvictor/baldosa.git/server/internal/storage"
)

type EditRequest struct {
	X int32 `json:"x"`
	Y int32 `json:"y"`

	Title    string `json:"title"`
	Subtitle string `json:"subtitle"`
	Link     string `json:"link"`
}

type EditResponse struct{}

func (s *server) Edit(ctx context.Context, request EditRequest) (EditResponse, error) {
	username := middleware.GetCtxUsername(ctx)

	if err := validateTile(request.Title, request.Subtitle, request.Link); err != nil {
		return EditResponse{}, err
	}

	_, err := s.querier.EditTileByOwner(ctx, s.pool, storage.EditTileByOwnerParams{
		Title:    request.Title,
		Subtitle: request.Subtitle,
		Link:     request.Link,
		X:        request.X,
		Y:        request.Y,
		Owner:    username,
	})

	if err != nil {
		return EditResponse{}, err
	}

	objectKey := fmt.Sprintf("tile-%d-%d", request.X, request.Y)
	hasChanged, err := s.s3Client.ChangedRecently(ctx, objectKey)
	if hasChanged {
		err = s.publisherClient.Publish(ctx, request.X, request.Y)
		if err != nil {
			return EditResponse{}, err
		}
	}

	return EditResponse{}, err
}

func validateTile(title, subtitle, link string) error {
	if len(title) == 0 {
		return errors.New("title is required")
	}
	if len(title) > 120 {
		return errors.New("title is too long")
	}

	if len(subtitle) > 120 {
		return errors.New("subtitle is too long")
	}

	if err := ValidateLink(link); err != nil {
		return err
	}

	return nil
}

func (s *server) EditHandler(w http.ResponseWriter, r *http.Request) {
	xRaw := r.PathValue("x")
	yRaw := r.PathValue("y")

	x, errX := strconv.ParseInt(xRaw, 10, 32)
	y, errY := strconv.ParseInt(yRaw, 10, 32)
	if errX != nil || errY != nil {
		http.Error(w, "invalid coordinates", http.StatusBadRequest)
	}

	ctx := r.Context()

	request := EditRequest{}
	err := json.NewDecoder(r.Body).Decode(&request)
	if err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	request.X = int32(x)
	request.Y = int32(y)

	response, err := s.Edit(middleware.WithCtxValues(ctx, r), request)

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
