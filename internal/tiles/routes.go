package tiles

import (
	"encoding/json"
	"log/slog"
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

	mux.HandleFunc("/tiles/{rpc}", s.handleRequest)
}

func (s *tilesServer) handleRequest(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "invalid method", http.StatusMethodNotAllowed)
		return
	}

	rpc := r.PathValue("rpc")

	ctx := r.Context()
	var err error
	var response any

	switch rpc {
	case "GetTile":
		request := getTileRequest{}
		err = json.NewDecoder(r.Body).Decode(&request)
		if err != nil {
			http.Error(w, "invalid request body", http.StatusBadRequest)
			return
		}
		response, err = s.GetTile(ctx, request)
	case "CreateTile":
		request := createTileRequest{}
		err = json.NewDecoder(r.Body).Decode(&request)
		if err != nil {
			http.Error(w, "invalid request body", http.StatusBadRequest)
			return
		}
		response, err = s.CreateTile(ctx, request)
	default:
		http.Error(w, "invalid rpc", http.StatusNotFound)
	}

	if err != nil {
		slog.ErrorContext(
			ctx, "RPC failed",
			"rpc", rpc,
			"error", err,
		)

		code, storageErr := storage.TransformPgxError(err)
		if storageErr != nil {
			http.Error(w, storageErr.Error(), code)
		} else {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}

		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	err = json.NewEncoder(w).Encode(response)
	if err != nil {
		slog.ErrorContext(
			ctx, "failed to encode response",
			"error", err,
			"rpc", rpc,
			"response", response,
		)
		http.Error(w, "failed to encode response", http.StatusInternalServerError)
		return
	}
}
