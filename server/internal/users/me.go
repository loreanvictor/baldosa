package users

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"

	"github.com/loreanvictor/baldosa.git/server/internal/middleware"
	"github.com/loreanvictor/baldosa.git/server/internal/storage"
)

func (s *server) Me(ctx context.Context) (storage.User, error) {
	username := middleware.GetCtxUsername(ctx)
	user, err := s.querier.GetUser(ctx, s.pool, username)

	if err != nil {
		return storage.User{}, err
	}

	user.Password = ""

	return user, nil
}

func (s *server) MeHandler(w http.ResponseWriter, r *http.Request) {
	ctx := middleware.WithCtxValues(r.Context(), r)

	response, err := s.Me(ctx)

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
			"path", r.URL.Path,
			"error", err,
			"response", response,
		)
		http.Error(w, "failed to encode response", http.StatusInternalServerError)
		return
	}

}
