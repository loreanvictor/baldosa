package users

import (
	"encoding/json"
	"log/slog"
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/minio/minio-go/v7"

	"github.com/loreanvictor/baldosa.git/internal/storage"
	"github.com/loreanvictor/baldosa.git/internal/webtoken"
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

	mux.HandleFunc("/users/{rpc}", s.handleRequest)
}

func (s *server) handleRequest(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "invalid method", http.StatusMethodNotAllowed)
		return
	}

	rpc := r.PathValue("rpc")

	ctx := r.Context()
	var err error
	var response any

	switch rpc {
	case "Signup":
		request := SignupRequest{}
		err = json.NewDecoder(r.Body).Decode(&request)
		if err != nil {
			http.Error(w, "invalid request body", http.StatusBadRequest)
			return
		}
		response, err = s.Signup(ctx, request)
	case "Login":
		request := LoginRequest{}
		err = json.NewDecoder(r.Body).Decode(&request)
		if err != nil {
			http.Error(w, "invalid request body", http.StatusBadRequest)
			return
		}
		response, err = s.Login(ctx, request)
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
