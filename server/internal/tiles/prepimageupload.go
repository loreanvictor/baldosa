package tiles

import (
	"context"
	"errors"
	"log/slog"
	"regexp"
	"time"

	"github.com/google/uuid"
)

var (
	ErrInvalidContentType = errors.New("invalid content type")

	acceptContentTypeRegexp = regexp.MustCompile(`^image/(png)$`)
)

type PrepImageUploadRequest struct {
	ContentType string `json:"content_type"`
}

type PrepImageUploadResponse struct {
	UploadUrl string `json:"upload_url"`
}

func (s *tilesServer) PrepImageUpload(ctx context.Context,
	request PrepImageUploadRequest) (PrepImageUploadResponse, error) {

	if !acceptContentTypeRegexp.MatchString(request.ContentType) {
		slog.WarnContext(ctx, "invalid content type", "content_type", request.ContentType)
		return PrepImageUploadResponse{}, ErrInvalidContentType
	}

	objectKey, err := uuid.NewRandom()
	if err != nil {
		slog.ErrorContext(ctx, "failed to generate object key", "error", err)
		return PrepImageUploadResponse{}, err
	}

	url, err := s.s3Client.PresignedPutObject(ctx, "baldosa", objectKey.String(), 30*time.Minute)
	if err != nil {
		slog.ErrorContext(ctx, "failed to presign put object", "error", err)
		return PrepImageUploadResponse{}, err
	}

	return PrepImageUploadResponse{
		UploadUrl: url.String(),
	}, nil

}
