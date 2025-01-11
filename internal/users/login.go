package users

import (
	"context"
	"errors"

	"golang.org/x/crypto/bcrypt"

	"github.com/loreanvictor/baldosa.git/internal/storage"
	"github.com/loreanvictor/baldosa.git/internal/webtoken"
)

var (
	ErrInvalidCredentials = errors.New("invalid credentials")
)

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LoginResponse struct {
	Token string       `json:"jwt"`
	User  storage.User `json:"user"`
}

func (s *server) Login(ctx context.Context, req LoginRequest) (LoginResponse, error) {
	user, err := s.querier.GetUser(ctx, s.pool, req.Email)
	if err != nil {
		return LoginResponse{}, err
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		return LoginResponse{}, err
	}

	jwt, err := s.tokens.Generate(webtoken.Claims{Email: user.Email})
	if err != nil {
		return LoginResponse{}, err
	}

	return LoginResponse{
		Token: jwt,
		User:  user,
	}, nil
}
