package middleware

import (
	"net/http"
)

const (
	usernameHeader = "X-Username"
)

func ClearSecureHeaders(r *http.Request) {
	r.Header.Del(usernameHeader)
}

func SetUsername(r *http.Request, username string) {
	r.Header.Set(usernameHeader, username)
}

func GetUsername(r *http.Request) string {
	sc := r.Header.Get(usernameHeader)
	return sc
}
