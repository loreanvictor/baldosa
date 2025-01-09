package main

import (
	"context"
	"database/sql"

	_ "modernc.org/sqlite"

	"github.com/loreanvictor/baldosa.git/internal/storage"
)

func main() {
	ctx := context.Background()

	db, err := sql.Open("sqlite", "baldosa.db")
	if err != nil {
		panic(err)
	}

	q := storage.New(db)

	_, err = q.CreateUser(ctx, "admin", "admin")
	if err != nil {
		panic(err)
	}

	if err = db.Close(); err != nil {
		panic(err)

	}
}
