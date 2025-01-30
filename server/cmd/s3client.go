package main

import (
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"

	"github.com/loreanvictor/baldosa.git/server/internal/clients/s3bucket"
)

func getS3Client(s3Config S3ClientConfig) (s3bucket.S3Bucket, error) {
	s3Client := s3.New(s3.Options{
		Region:      s3Config.Region,
		Credentials: credentials.NewStaticCredentialsProvider(s3Config.AccessKeyID, s3Config.SecretAccessKey, ""),
	})

	b := s3bucket.New(s3Client, s3Config.Bucket, s3Config.PresignedExpiry)
	return b, nil
}
