package middleware

import (
	"context"
	"net/http"
)

func WithCtxValues(ctx context.Context, r *http.Request) context.Context {
	ctx = context.WithValue(ctx, usernameHeader, GetUsername(r))

	return ctx
}

func GetCtxUsername(ctx context.Context) string {
	username, ok := ctx.Value(usernameHeader).(string)
	if ok {
		return username
	}
	return ""
}
