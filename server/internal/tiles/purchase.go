package tiles

import (
	"context"
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"strconv"

	"github.com/loreanvictor/baldosa.git/server/internal/middleware"
	"github.com/loreanvictor/baldosa.git/server/internal/storage"
)

var (
	ErrUnauthorized  = errors.New("unauthorized")
	ErrAlreadyExists = errors.New("tile already exists")
)

type PurchaseRequest struct {
	X int32 `json:"x"`
	Y int32 `json:"y"`
}

type PurchaseResponse struct{}

func (s *tilesServer) Purchase(ctx context.Context, request PurchaseRequest) (PurchaseResponse, error) {
	username := middleware.GetCtxUsername(ctx)

	resp, err := s.GetTile(ctx, GetTileRequest{
		X: request.X,
		Y: request.Y,
	})
	if err != nil {
		return PurchaseResponse{}, err
	}

	if resp.Price == 0 {
		return PurchaseResponse{}, ErrAlreadyExists
	}

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return PurchaseResponse{}, err
	}
	defer tx.Rollback(ctx)

	_, err = s.querier.SpendCoins(ctx, tx, resp.Price, username)
	if err != nil {
		return PurchaseResponse{}, err
	}

	_, err = s.querier.CreateTile(ctx, tx, request.X, request.Y, &username)
	if err != nil {
		return PurchaseResponse{}, err
	}

	err = tx.Commit(ctx)
	return PurchaseResponse{}, err
}

func (s *tilesServer) PurchaseHandler(w http.ResponseWriter, r *http.Request) {
	xRaw := r.PathValue("x")
	yRaw := r.PathValue("y")

	x, errX := strconv.ParseInt(xRaw, 10, 32)
	y, errY := strconv.ParseInt(yRaw, 10, 32)
	if errX != nil || errY != nil {
		http.Error(w, "invalid coordinates", http.StatusBadRequest)
	}

	ctx := r.Context()

	request := PurchaseRequest{
		X: int32(x),
		Y: int32(y),
	}
	response, err := s.Purchase(middleware.WithCtxValues(ctx, r), request)

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
