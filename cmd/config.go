package main

import (
	"log"
	"strings"

	"github.com/spf13/viper"
)

type Config struct {
	Database   DatabaseConfig   `mapstructure:"database"`
	HTTPServer HTTPServerConfig `mapstructure:"http_server"`
	S3Client   S3ClientConfig   `mapstructure:"s3_client"`
}

type DatabaseConfig struct {
	ConnString string `mapstructure:"conn_string"`
}

type HTTPServerConfig struct {
	Addr string `mapstructure:"addr"`
}

type S3ClientConfig struct {
	Endpoint        string `mapstructure:"endpoint"`
	Region          string `mapstructure:"region"`
	AccessKeyID     string `mapstructure:"access_key_id"`
	SecretAccessKey string `mapstructure:"secret_access_key"`
	Bucket          string `mapstructure:"bucket"`
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
