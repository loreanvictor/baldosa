package middleware

import (
	"net/http"
	"strings"
)

func NewSimpleKey(simpleKey string) Middleware {
	key := strings.TrimSpace(simpleKey)
	if key == "" {
		panic("simpleKey cannot be empty")
	}

	return func(next http.HandlerFunc) http.HandlerFunc {
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

			if matches[1] != key {
				w.WriteHeader(http.StatusUnauthorized)
				return
			}

			next(w, r)
		}
	}
}
