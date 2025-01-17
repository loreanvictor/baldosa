package storage

import (
	"embed"
	"errors"
	"fmt"
	"io/fs"
	"net/http"
	"net/url"
	"strings"

	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database/pgx/v5"
	"github.com/golang-migrate/migrate/v4/source/httpfs"
)

//go:embed migrations
var migrationFiles embed.FS

func EnsureMigrations(connString string) error {
	postgres := pgx.Postgres{}
	driver, err := postgres.Open(connString)
	if err != nil {
		return err
	}

	dbName, err := extractDBName(connString)
	if err != nil {
		return err
	}

	httpFS, err := fs.Sub(migrationFiles, "migrations")
	if err != nil {
		return err
	}

	srcDriver, err := httpfs.New(http.FS(httpFS), ".")
	if err != nil {
		return err
	}
	m, err := migrate.NewWithInstance(
		"httpfs",
		srcDriver,
		dbName, driver)
	if err != nil {
		return err
	}

	err = m.Up()
	if err != nil && !errors.Is(err, migrate.ErrNoChange) {
		return err
	}

	return nil
}

func extractDBName(connString string) (string, error) {
	u, err := url.Parse(connString)
	if err != nil {
		return "", fmt.Errorf("error parsing connection string: %v", err)
	}

	dbname := strings.TrimPrefix(u.Path, "/")
	return dbname, nil
}
