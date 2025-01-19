package main

import (
	"context"
	"fmt"

	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/s3"

	"github.com/loreanvictor/baldosa.git/server/internal/clients/s3bucket"
)

func getS3Client(ctx context.Context, s3Config S3ClientConfig) (s3bucket.S3Bucket, error) {
	cfg, err := config.LoadDefaultConfig(ctx)
	if err != nil {
		fmt.Println("Couldn't load default configuration. Have you set up your AWS account?")
		fmt.Println(err)
		return nil, err
	}

	s3Client := s3.NewFromConfig(cfg)

	return s3bucket.New(s3Client, s3Config.Bucket, s3Config.PresignedExpiry), nil
}
