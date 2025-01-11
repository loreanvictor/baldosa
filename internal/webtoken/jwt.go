package webtoken

import (
	"time"

	"github.com/golang-jwt/jwt/v5"
)

const (
	issuerName          = "baldosa"
	tokenValidityPeriod = time.Hour * 24 * 14
)

type WebToken interface {
	Generate(Claims) (string, error)
	Validate(string) (Claims, error)
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

func (w webToken) Generate(c Claims) (string, error) {
	claims := customClaims{
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    issuerName,
			Subject:   c.Email,
			Audience:  jwt.ClaimStrings{issuerName},
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(tokenValidityPeriod)),
			NotBefore: jwt.NewNumericDate(time.Now()),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			ID:        "",
		},
		Claims: c,
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(w.secret))
}

func (w webToken) Validate(token string) (Claims, error) {
	t, err := jwt.Parse(token, func(t *jwt.Token) (interface{}, error) {
		return []byte(w.secret), nil
	})

	if err != nil {
		return Claims{}, err
	}

	if !t.Valid {
		return Claims{}, jwt.ErrSignatureInvalid
	}

	claims := t.Claims.(*customClaims)

	if claims.Email != claims.Subject {
		return Claims{}, jwt.ErrTokenInvalidClaims
	}

	return claims.Claims, nil
}
