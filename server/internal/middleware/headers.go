package middleware

import (
	"encoding/json"
	"net/http"

	"github.com/loreanvictor/baldosa.git/server/internal/webtoken"
)

const (
	claimsHeader = "X-Claims"
)

func ClearClaims(r *http.Request) {
	r.Header.Del(claimsHeader)
}

func SetClaims(r *http.Request, value webtoken.Claims) {
	s, _ := json.Marshal(value)
	r.Header.Set(claimsHeader, string(s))
}

func GetClaims(r *http.Request) *webtoken.Claims {
	sc := r.Header.Get(claimsHeader)

	var c webtoken.Claims
	err := json.Unmarshal([]byte(sc), &c)
	if err != nil {
		return nil
	}
	return &c
}
