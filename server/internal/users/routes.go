package users

import (
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/loreanvictor/baldosa.git/server/internal/middleware"
	"github.com/loreanvictor/baldosa.git/server/internal/storage"
	"github.com/loreanvictor/baldosa.git/server/internal/webtoken"
)

type server struct {
	mux     *http.ServeMux
	pool    *pgxpool.Pool
	querier storage.Querier
	tokens  webtoken.WebToken
}

func NewServer(
	pool *pgxpool.Pool,
	querier storage.Querier,
	token webtoken.WebToken,
) http.Handler {
	s := &server{
		mux:     http.NewServeMux(),
		pool:    pool,
		querier: querier,
		tokens:  token,
	}

	s.mux.HandleFunc("POST /users", s.SignupHandler)
	s.mux.HandleFunc("POST /users/login", s.LoginHandler)
	s.mux.HandleFunc("GET /users/me", middleware.WithAuthorization(s.MeHandler))

	return s
}

func (s *server) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	s.mux.ServeHTTP(w, r)
}
