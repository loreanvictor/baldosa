package users

import (
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/minio/minio-go/v7"

	"github.com/loreanvictor/baldosa.git/server/internal/middleware"
	"github.com/loreanvictor/baldosa.git/server/internal/storage"
	"github.com/loreanvictor/baldosa.git/server/internal/webtoken"
)

type server struct {
	pool     *pgxpool.Pool
	querier  storage.Querier
	s3Client *minio.Client
	tokens   webtoken.WebToken
}

func RegisterServer(
	mux *http.ServeMux,
	pool *pgxpool.Pool,
	querier storage.Querier,
	s3Client *minio.Client,
	token webtoken.WebToken,
) {
	s := &server{
		pool:     pool,
		querier:  querier,
		s3Client: s3Client,
		tokens:   token,
	}

	mux.HandleFunc("POST /users", s.SignupHandler)
	mux.HandleFunc("POST /users/login", s.LoginHandler)
	mux.HandleFunc("GET /users/me", middleware.WithAuthorization(s.MeHandler))
}
