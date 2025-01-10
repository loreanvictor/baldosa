package main

import (
	"log"
	"strings"

	"github.com/spf13/viper"
)

type Config struct {
	Database   DatabaseConfig   `mapstructure:"database"`
	HTTPServer HTTPServerConfig `mapstructure:"http_server"`
}

type DatabaseConfig struct {
	ConnString string `mapstructure:"conn_string"`
}

type HTTPServerConfig struct {
	Addr string `mapstructure:"addr"`
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
