package main

import (
	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

func getS3Client(s3Config S3ClientConfig) *minio.Client {
	client, err := minio.New(s3Config.Endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(s3Config.AccessKeyID, s3Config.SecretAccessKey, ""),
		Secure: s3Config.Secure,
	})

	if err != nil {
		panic(err)
	}

	return client
}
