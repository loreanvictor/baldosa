package tiles

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"regexp"
	"time"
)

var (
	ErrInvalidContentType = errors.New("invalid content type")

	acceptContentTypeRegexp = regexp.MustCompile(`^image/(png)$`)
)

type PrepImageUploadRequest struct {
	X int32 `json:"x"`
	Y int32 `json:"y"`

	ContentType string `json:"content_type"`
}

type PrepImageUploadResponse struct {
	UploadUrl string `json:"upload_url"`
	Key       string `json:"key"`
}

func (s *tilesServer) PrepImageUpload(ctx context.Context,
	request PrepImageUploadRequest) (PrepImageUploadResponse, error) {

	if !acceptContentTypeRegexp.MatchString(request.ContentType) {
		slog.WarnContext(ctx, "invalid content type", "content_type", request.ContentType)
		return PrepImageUploadResponse{}, ErrInvalidContentType
	}

	objectKey := fmt.Sprintf("tile-%d-%d", request.X, request.Y)

	url, err := s.s3Client.PresignedPutObject(ctx, "baldosa", objectKey, 30*time.Minute)
	if err != nil {
		slog.ErrorContext(ctx, "failed to presign put object", "error", err)
		return PrepImageUploadResponse{}, err
	}

	return PrepImageUploadResponse{
		UploadUrl: url.String(),
		Key:       objectKey,
	}, nil
}
