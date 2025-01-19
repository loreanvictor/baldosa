package users

import (
	"context"
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"

	"golang.org/x/crypto/bcrypt"

	"github.com/loreanvictor/baldosa.git/server/internal/storage"
)

var (
	ErrInvalidCredentials = errors.New("invalid credentials")
)

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LoginResponse struct {
	storage.User

	JWT string `json:"jwt"`
}

func (s *server) Login(ctx context.Context, req LoginRequest) (LoginResponse, error) {
	user, err := s.querier.GetUser(ctx, s.pool, req.Email)
	if err != nil {
		return LoginResponse{}, err
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		return LoginResponse{}, err
	}

	jwt, err := s.tokens.Generate(user.Email)
	if err != nil {
		return LoginResponse{}, err
	}

	user.Password = ""

	return LoginResponse{
		JWT:  jwt,
		User: user,
	}, nil
}

func (s *server) LoginHandler(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	request := LoginRequest{}
	err := json.NewDecoder(r.Body).Decode(&request)
	if err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}
	response, err := s.Login(ctx, request)

	if err != nil {
		slog.ErrorContext(
			ctx, "request failed",
			"path", r.URL.Path,
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
			"path", r.URL.Path,
			"error", err,
			"response", response,
		)
		http.Error(w, "failed to encode response", http.StatusInternalServerError)
		return
	}
}
