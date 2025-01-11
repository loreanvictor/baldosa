package main

import (
	"context"
	"log"
	"log/slog"
	"net"
	"net/http"
	"os"

	"github.com/loreanvictor/baldosa.git/server/internal/storage"
	"github.com/loreanvictor/baldosa.git/server/internal/tiles"
	"github.com/loreanvictor/baldosa.git/server/internal/users"
	"github.com/loreanvictor/baldosa.git/server/internal/webtoken"
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

	s3Client := getS3Client(config.S3Client)

	mux := http.NewServeMux()

	users.RegisterServer(mux, pool, querier, s3Client, webtoken.New(config.Crypto.JWTSecret))
	tiles.RegisterServer(mux, pool, querier, s3Client)

	s := http.Server{
		Addr:    config.HTTPServer.Addr,
		Handler: mux,
		BaseContext: func(_ net.Listener) context.Context {
			return ctx
		},
	}

	slog.InfoContext(ctx, "server listening", "address", config.HTTPServer.Addr)
	if err := s.ListenAndServe(); err != nil {
		slog.ErrorContext(ctx, "failed to start server", "error", err)
		return
	}
}
