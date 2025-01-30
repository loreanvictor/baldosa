package main

import (
	"log"
	"strings"
	"time"

	"github.com/spf13/viper"

	"github.com/loreanvictor/baldosa.git/server/internal/clients/publisher"
)

type Config struct {
	Database              DatabaseConfig   `mapstructure:"database"`
	HTTPServer            HTTPServerConfig `mapstructure:"http_server"`
	S3SubmittedBucket     S3ClientConfig   `mapstructure:"s3_submitted_bucket"`
	S3PublishedBucket     S3ClientConfig   `mapstructure:"s3_published_bucket"`
	PublisherClientConfig publisher.Config `mapstructure:"publisher"`
	Crypto                CryptoConfig     `mapstructure:"crypto"`
}

type DatabaseConfig struct {
	ConnString string `mapstructure:"conn_string"`
}

type HTTPServerConfig struct {
	Addr           string   `mapstructure:"addr"`
	AllowedOrigins []string `mapstructure:"allowed_origins"`
}

type S3ClientConfig struct {
	Endpoint        string        `mapstructure:"endpoint"`
	Region          string        `mapstructure:"region"`
	AccessKeyID     string        `mapstructure:"access_key_id"`
	SecretAccessKey string        `mapstructure:"secret_access_key"`
	Bucket          string        `mapstructure:"bucket"`
	Secure          bool          `mapstructure:"secure"`
	PresignedExpiry time.Duration `mapstructure:"presigned_expiry"`
}

type CryptoConfig struct {
	JWTSecret string `mapstructure:"jwt_secret"`
	SimpleKey string `mapstructure:"simple_key"`
}

func loadConfig() Config {
	var config Config
	viper.SetConfigName("config")
	viper.AddConfigPath(".")
	viper.SetConfigType("yaml")

	viper.SetEnvKeyReplacer(strings.NewReplacer(".", "__"))
	viper.SetEnvPrefix("BALDOSA")
	viper.AutomaticEnv()

	if err := viper.ReadInConfig(); err != nil {
		log.Fatalf("Failed to read config: %v", err)
	}
	if err := viper.Unmarshal(&config); err != nil {
		log.Fatalf("Failed to unmarshal config: %v", err)
	}

	return config
}
