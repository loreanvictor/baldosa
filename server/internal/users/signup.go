package users

import (
	"context"
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"regexp"

	"golang.org/x/crypto/bcrypt"

	"github.com/loreanvictor/baldosa.git/server/internal/storage"
)

var (
	ErrInvalidEmail  = errors.New("invalid email")
	ErrShortPassword = errors.New("password must be at least 8 characters")

	emailRegex = regexp.MustCompile(`^[a-zA-Z0-9._%+-]{1,100}@[a-zA-Z0-9.-]{1,100}$`)
)

type SignupRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type SignupResponse struct {
	JWT string `json:"jwt"`
}

func (s *server) Signup(ctx context.Context, req SignupRequest) (SignupResponse, error) {
	if err := validateEmail(req.Email); err != nil {
		return SignupResponse{}, err
	}

	if err := validatePassword(req.Password); err != nil {
		return SignupResponse{}, err
	}

	password, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return SignupResponse{}, err
	}

	user, err := s.querier.CreateUser(ctx, s.pool, req.Email, string(password))
	if err != nil {
		return SignupResponse{}, err
	}

	jwt, err := s.tokens.Generate(user.Email)
	if err != nil {
		return SignupResponse{}, err
	}

	return SignupResponse{JWT: jwt}, nil
}

func (s *server) SignupHandler(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	request := SignupRequest{}
	err := json.NewDecoder(r.Body).Decode(&request)
	if err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}
	response, err := s.Signup(ctx, request)

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

func validateEmail(email string) error {
	if !emailRegex.MatchString(email) {
		return ErrInvalidEmail
	}

	return nil
}

func validatePassword(password string) error {
	if len(password) < 8 {
		return ErrShortPassword
	}

	return nil
}
