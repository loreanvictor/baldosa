package main

import (
	"context"
	"log"
	"log/slog"
	"net"
	"net/http"
	"os"

	"github.com/loreanvictor/baldosa.git/internal/storage"
	"github.com/loreanvictor/baldosa.git/internal/tiles"
)

func main() {
	ctx := context.Background()

	config := loadConfig()

	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	slog.SetDefault(logger)

	pool, err := storage.NewConnectionPool(ctx, config.Database.ConnString)
	if err != nil {
		log.Fatalf("Failed to create pool: %v", err)
	}
	defer pool.Close()

	err = storage.EnsureMigrations(config.Database.ConnString)
	if err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}

	querier := storage.New()

	s3Client := getS3Client(ctx, config.S3Client)

	mux := http.NewServeMux()

	tiles.RegisterServer(mux, pool, querier, s3Client)

	s := http.Server{
		Addr:    config.HTTPServer.Addr,
		Handler: mux,
		BaseContext: func(_ net.Listener) context.Context {
			return ctx
		},
	}

	log.Printf("Server listening on %s", config.HTTPServer.Addr)
	if err := s.ListenAndServe(); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
