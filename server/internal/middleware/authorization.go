package middleware

import (
	"net/http"
	"regexp"

	"github.com/loreanvictor/baldosa.git/server/internal/webtoken"
)

var (
	authHeaderRegexp = regexp.MustCompile(`(?m)^Bearer ((?:\.?[A-Za-z0-9-_]+){3})$`)
)

func NewJWTAuthorizationMiddleware(tokens webtoken.WebToken) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		rawAuthHeader := r.Header.Get("Authorization")
		if rawAuthHeader == "" {
			w.WriteHeader(http.StatusUnauthorized)
			return
		}

		matches := authHeaderRegexp.FindStringSubmatch(rawAuthHeader)

		if len(matches) != 2 {
			w.WriteHeader(http.StatusUnauthorized)
			return
		}

		claims, err := tokens.Validate(matches[1])
		if err != nil {
			w.WriteHeader(http.StatusUnauthorized)
			return
		}

	}
}
