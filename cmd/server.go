package main

import (
	"context"
	"log"

	"github.com/loreanvictor/baldosa.git/internal/storage"
)

func main() {
	ctx := context.Background()

	config := loadConfig()

	pool, err := storage.NewConnectionPool(ctx, config.Database.ConnString)
	if err != nil {
		log.Fatalf("Failed to create pool: %v", err)
	}
	defer pool.Close()

	err = storage.EnsureMigrations(config.Database.ConnString)
	if err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}
}
