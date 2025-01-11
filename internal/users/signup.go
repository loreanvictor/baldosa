package users

import (
	"context"
	"errors"
	"regexp"
	"strings"

	"golang.org/x/crypto/bcrypt"

	"github.com/loreanvictor/baldosa.git/internal/storage"
	"github.com/loreanvictor/baldosa.git/internal/webtoken"
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
	Token string       `json:"jwt"`
	User  storage.User `json:"user"`
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

	jwt, err := s.tokens.Generate(webtoken.Claims{Email: user.Email})
	if err != nil {
		return SignupResponse{}, err
	}

	return SignupResponse{Token: jwt}, nil
}

func validateEmail(email string) error {
	if !strings.Contains(email, "@") {
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
