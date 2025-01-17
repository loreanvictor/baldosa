package s3bucket

import (
	"context"
	"errors"
	"log/slog"
	"time"

	"github.com/minio/minio-go/v7"
)

type S3Bucket interface {
	PresignedPut(ctx context.Context, key string) (string, error)
	ChangedRecently(ctx context.Context, key string) (bool, error)
}

type s3bucket struct {
	client          *minio.Client
	bucketName      string
	presignedExpiry time.Duration
}

func New(client *minio.Client, bucketName string, presignedExpiry time.Duration) S3Bucket {
	return &s3bucket{client, bucketName, presignedExpiry}
}

func (s *s3bucket) PresignedPut(ctx context.Context, key string) (string, error) {
	url, err := s.client.PresignedPutObject(ctx, s.bucketName, key, s.presignedExpiry)
	if err != nil {
		slog.ErrorContext(ctx, "failed to presign put object", "error", err)
		return "", err
	}

	return url.String(), nil
}

func (s *s3bucket) ChangedRecently(ctx context.Context, key string) (bool, error) {
	attrs, err := s.client.GetObjectAttributes(ctx, s.bucketName, key, minio.ObjectAttributesOptions{})
	if err != nil {
		var minioErr minio.ErrorResponse
		ok := errors.As(err, &minioErr)
		if !ok || minioErr.Code != "NoSuchKey" {
			return false, err
		}
	}

	if attrs != nil && attrs.LastModified.After(time.Now().Add(-s.presignedExpiry)) {
		return true, nil
	}

	return false, nil
}
