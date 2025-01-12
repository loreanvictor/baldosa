package webtoken

import (
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

const (
	issuerName          = "baldosa"
	tokenValidityPeriod = time.Hour * 24 * 14
)

type WebToken interface {
	Generate(string) (string, error)
	Validate(string) (string, error)
}

type Claims struct {
	Email string `json:"email"`
}

type customClaims struct {
	jwt.RegisteredClaims
	Claims
}

type webToken struct {
	secret string
}

func New(secret string) WebToken {
	return &webToken{secret: secret}
}

func (w webToken) Generate(subject string) (string, error) {
	id, err := uuid.NewRandom()
	if err != nil {
		return "", err
	}

	claims := jwt.RegisteredClaims{
		Issuer:    issuerName,
		Subject:   subject,
		Audience:  jwt.ClaimStrings{issuerName},
		ExpiresAt: jwt.NewNumericDate(time.Now().Add(tokenValidityPeriod)),
		NotBefore: jwt.NewNumericDate(time.Now()),
		IssuedAt:  jwt.NewNumericDate(time.Now()),
		ID:        id.String(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(w.secret))
}

func (w webToken) Validate(token string) (string, error) {
	t, err := jwt.Parse(token, func(t *jwt.Token) (interface{}, error) {
		return []byte(w.secret), nil
	})

	if err != nil {
		return "", err
	}

	if !t.Valid {
		return "", jwt.ErrSignatureInvalid
	}

	return t.Claims.GetSubject()
}
