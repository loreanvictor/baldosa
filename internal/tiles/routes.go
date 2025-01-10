package tiles

import (
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/loreanvictor/baldosa.git/internal/storage"
)

type tilesServer struct {
	pool    *pgxpool.Pool
	querier storage.Querier
}

func RegisterServer(
	mux *http.ServeMux,
	pool *pgxpool.Pool,
	querier storage.Querier,
) {
	s := &tilesServer{
		pool:    pool,
		querier: querier,
	}

	mux.HandleFunc("/tiles/{TileID}", s.GetTile)
	mux.HandleFunc("/tiles", s.CreateTile)
}
