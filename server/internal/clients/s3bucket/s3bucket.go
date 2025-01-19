package s3bucket

import (
	"context"
	"errors"
	"log/slog"
	"time"

	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/s3/types"
)

type S3Bucket interface {
	PresignedPut(ctx context.Context, key string) (string, error)
	ChangedRecently(ctx context.Context, key string) (bool, error)
}

type s3bucket struct {
	client          *s3.Client
	preSignClient   *s3.PresignClient
	bucketName      string
	presignedExpiry time.Duration
}

func New(client *s3.Client, bucketName string, presignedExpiry time.Duration) S3Bucket {
	return &s3bucket{
		client,
		s3.NewPresignClient(client, s3.WithPresignExpires(presignedExpiry)),
		bucketName,
		presignedExpiry,
	}
}

func (s *s3bucket) PresignedPut(ctx context.Context, key string) (string, error) {
	resp, err := s.preSignClient.PresignPutObject(ctx, &s3.PutObjectInput{
		Bucket: &s.bucketName,
		Key:    &key,
	})
	if err != nil {
		return "", err
	}

	return resp.URL, nil
}

func (s *s3bucket) ChangedRecently(ctx context.Context, key string) (bool, error) {
	resp, err := s.client.HeadObject(ctx, &s3.HeadObjectInput{
		Bucket: &s.bucketName,
		Key:    &key,
	})

	if err != nil {
		var noKey *types.NoSuchKey
		if errors.As(err, &noKey) {
			slog.WarnContext(
				ctx, "can't get object. no such key exists",
				"bucket", s.bucketName,
				"key", key,
			)
			err = noKey
		} else {
			slog.ErrorContext(ctx, "couldn't get object",
				"bucket", s.bucketName,
				"key", key,
				"error", err,
			)
		}
		return false, err
	}

	if resp.LastModified == nil {
		return false, nil
	}

	if time.Since(*resp.LastModified) < s.presignedExpiry {
		return true, nil
	}

	return false, nil
}
