package main

import (
	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"

	"github.com/loreanvictor/baldosa.git/server/internal/clients/s3bucket"
)

func getS3Client(s3Config S3ClientConfig) s3bucket.S3Bucket {
	client, err := minio.New(s3Config.Endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(s3Config.AccessKeyID, s3Config.SecretAccessKey, ""),
		Secure: s3Config.Secure,
	})

	if err != nil {
		panic(err)
	}

	return s3bucket.New(client, s3Config.Bucket, s3Config.PresignedExpiry)
}
