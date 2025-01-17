package middleware

import (
	"net/http"
	"regexp"

	"github.com/loreanvictor/baldosa.git/server/internal/webtoken"
)

var (
	authHeaderRegexp = regexp.MustCompile(`(?m)^Bearer ((?:\.?[A-Za-z0-9-_]+){3})$`)
)

func WithAuthentication(next http.HandlerFunc, tokens webtoken.WebToken) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ClearSecureHeaders(r)

		defer next(w, r)

		rawAuthHeader := r.Header.Get("Authorization")
		if rawAuthHeader == "" {
			return
		}

		matches := authHeaderRegexp.FindStringSubmatch(rawAuthHeader)

		if len(matches) != 2 {
			return
		}

		username, err := tokens.Validate(matches[1])
		if err != nil {
			return
		}

		SetUsername(r, username)
	}
}

func WithAuthorization(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		c := GetUsername(r)
		if c == "" {
			w.WriteHeader(http.StatusUnauthorized)
			return
		}

		next(w, r)
	}
}
