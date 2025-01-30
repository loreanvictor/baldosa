package tiles

import (
	"context"
	"net/http"
	"sync"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/loreanvictor/baldosa.git/server/internal/clients/publisher"
	"github.com/loreanvictor/baldosa.git/server/internal/clients/s3bucket"
	"github.com/loreanvictor/baldosa.git/server/internal/middleware"
	"github.com/loreanvictor/baldosa.git/server/internal/storage"
)

type server struct {
	mux             *http.ServeMux
	pool            *pgxpool.Pool
	querier         storage.Querier
	bucketSubmitted s3bucket.S3Bucket
	bucketPublished s3bucket.S3Bucket
	publisherClient publisher.Publisher

	// mapCache keeps generated tile availability maps in memory, protected by
	// mapCacheLock.
	mapCache     map[string][]byte
	mapCacheLock sync.RWMutex

	mapUpdateTaskChan chan mapUpdateTask
}

func NewServer(
	ctx context.Context,
	pool *pgxpool.Pool,
	querier storage.Querier,
	bucketSubmitted s3bucket.S3Bucket,
	bucketPublished s3bucket.S3Bucket,
	publisherClient publisher.Publisher,
) http.Handler {
	s := &server{
		mux:             http.NewServeMux(),
		pool:            pool,
		querier:         querier,
		bucketSubmitted: bucketSubmitted,
		bucketPublished: bucketPublished,
		publisherClient: publisherClient,

		mapCache:          make(map[string][]byte),
		mapCacheLock:      sync.RWMutex{},
		mapUpdateTaskChan: make(chan mapUpdateTask, 100),
	}

	s.mux.HandleFunc("GET /tiles/{x}/{y}", s.GetTileHandler)
	s.mux.HandleFunc("POST /tiles/{x}/{y}", middleware.WithAuthorization(s.PurchaseHandler))
	s.mux.HandleFunc("PUT /tiles/{x}/{y}", middleware.WithAuthorization(s.EditHandler))
	s.mux.HandleFunc("POST /tiles/{x}/{y}/images", middleware.WithAuthorization(s.CreateImageHandler))
	s.mux.HandleFunc("GET /tiles/map/{x}/{y}", s.GetMapHandler)

	s.RunPeriodicBitmapUpdateTask(ctx)

	return s
}

func (s *server) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	s.mux.ServeHTTP(w, r)
}
