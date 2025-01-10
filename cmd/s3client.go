package main

import (
	"context"

	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

func getS3Client(ctx context.Context, s3Config S3ClientConfig) *s3.Client {
	cfg, err := config.LoadDefaultConfig(ctx,
		config.WithBaseEndpoint(s3Config.Endpoint),
		config.WithRegion(s3Config.Region),
		config.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(
			s3Config.AccessKeyID,
			s3Config.SecretAccessKey,
			"",
		)),
	)
	if err != nil {
		panic(err)
	}

	client := s3.NewFromConfig(cfg, func(o *s3.Options) {
		o.Region = s3Config.Region
		o.UseAccelerate = true
	})

	return client
}
