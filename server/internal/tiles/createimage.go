package tiles

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"regexp"
	"strconv"

	"github.com/loreanvictor/baldosa.git/server/internal/middleware"
	"github.com/loreanvictor/baldosa.git/server/internal/storage"
)

var (
	ErrInvalidContentType = errors.New("invalid content type")

	acceptContentTypeRegexp = regexp.MustCompile(`^image/(jpeg|png)$`)
)

type CreateImageRequest struct {
	X int32 `json:"x"`
	Y int32 `json:"y"`

	ContentType string `json:"content_type"`
}

type CreateImageResponse struct {
	UploadUrl string `json:"upload_url"`
	Key       string `json:"key"`
}

func (s *server) CreateImage(ctx context.Context,
	request CreateImageRequest) (CreateImageResponse, error) {

	username := middleware.GetCtxUsername(ctx)

	if !acceptContentTypeRegexp.MatchString(request.ContentType) {
		slog.WarnContext(ctx, "invalid content type", "content_type", request.ContentType)
		return CreateImageResponse{}, ErrInvalidContentType
	}

	tile, err := s.querier.GetTile(ctx, s.pool, request.X, request.Y)
	if err != nil {
		return CreateImageResponse{}, err
	}

	if tile.Owner != username {
		return CreateImageResponse{}, ErrUnauthorized
	}

	objectKey := fmt.Sprintf("tile-%d-%d", request.X, request.Y)

	url, err := s.s3Client.PresignedPut(ctx, objectKey)
	if err != nil {
		slog.ErrorContext(ctx, "failed to presign put object", "error", err)
		return CreateImageResponse{}, err
	}

	return CreateImageResponse{
		UploadUrl: url,
		Key:       objectKey,
	}, nil
}

func (s *server) CreateImageHandler(w http.ResponseWriter, r *http.Request) {
	xRaw := r.PathValue("x")
	yRaw := r.PathValue("y")

	x, errX := strconv.ParseInt(xRaw, 10, 32)
	y, errY := strconv.ParseInt(yRaw, 10, 32)
	if errX != nil || errY != nil {
		http.Error(w, "invalid coordinates", http.StatusBadRequest)
	}

	ctx := r.Context()

	request := CreateImageRequest{}
	err := json.NewDecoder(r.Body).Decode(&request)
	if err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	request.X = int32(x)
	request.Y = int32(y)

	response, err := s.CreateImage(middleware.WithCtxValues(ctx, r), request)

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
