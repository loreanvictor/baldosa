package tiles

import (
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/loreanvictor/baldosa.git/server/internal/clients/publisher"
	"github.com/loreanvictor/baldosa.git/server/internal/clients/s3bucket"
	"github.com/loreanvictor/baldosa.git/server/internal/middleware"
	"github.com/loreanvictor/baldosa.git/server/internal/storage"
)

type server struct {
	pool            *pgxpool.Pool
	querier         storage.Querier
	s3Client        s3bucket.S3Bucket
	publisherClient publisher.Publisher
}

func RegisterServer(
	mux *http.ServeMux,
	pool *pgxpool.Pool,
	querier storage.Querier,
	s3Client s3bucket.S3Bucket,
	publisherClient publisher.Publisher,
	simpleKeyMW middleware.Middleware,
) {
	s := &server{
		pool:            pool,
		querier:         querier,
		s3Client:        s3Client,
		publisherClient: publisherClient,
	}

	mux.HandleFunc("GET /tiles/{x}/{y}", s.GetTileHandler)
	mux.HandleFunc("POST /tiles/{x}/{y}", middleware.WithAuthorization(s.PurchaseHandler))
	mux.HandleFunc("PUT /tiles/{x}/{y}", middleware.WithAuthorization(s.EditHandler))
	mux.HandleFunc("POST /tiles/{x}/{y}/images", middleware.WithAuthorization(s.CreateImageHandler))
	mux.HandleFunc("GET /tiles/map/{x}/{y}", simpleKeyMW(s.GetMapHandler))
}
