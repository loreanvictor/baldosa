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
	return ctx.Value(usernameHeader).(string)
}
