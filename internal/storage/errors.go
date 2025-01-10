package storage

import (
	"errors"
	"fmt"
	"net/http"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"

	"github.com/loreanvictor/baldosa.git/pkg/pgerrcode"
)

var (
	ErrUniqXYConstraint = errors.New("unique x-y constraint failed")

	ErrUniqueViolation     = errors.New("unique constraint violation")
	ErrDatabaseUnavailable = errors.New("database is unavailable")
	ErrStringFieldTooLong  = errors.New("string field is too long")
	ErrNumberOutOfRange    = errors.New("number is out of range")
	ErrCheckFailed         = errors.New("check constraint failed")
	ErrNotNullViolation    = errors.New("not null constraint failed")
	ErrForeignKeyViolation = errors.New("foreign key constraint failed")
	ErrNotFound            = errors.New("not found")
)

func TransformPgxError(err error) (int, error) {
	var pgErr *pgconn.PgError

	if errors.As(err, &pgErr) {
		switch pgErr.Code {
		case pgerrcode.UniqueViolation:
			if pgErr.ConstraintName == "unique_xy" {
				return http.StatusConflict, ErrUniqXYConstraint
			}
			return http.StatusConflict, errors.Join(ErrUniqueViolation, fmt.Errorf("%s", pgErr.ConstraintName))

		case pgerrcode.StringDataRightTruncationDataException:
			return http.StatusBadRequest, errors.Join(ErrStringFieldTooLong, fmt.Errorf("%s", pgErr.ColumnName))

		case pgerrcode.NumericValueOutOfRange:
			return http.StatusBadRequest, errors.Join(ErrNumberOutOfRange, fmt.Errorf("%s", pgErr.ColumnName))

		case pgerrcode.CheckViolation:
			return http.StatusNotAcceptable, errors.Join(ErrCheckFailed, fmt.Errorf("%s", pgErr.ConstraintName))

		case pgerrcode.NotNullViolation:
			return http.StatusBadRequest, errors.Join(ErrNotNullViolation, fmt.Errorf("%s", pgErr.ColumnName))

		case pgerrcode.ForeignKeyViolation:
			return http.StatusPreconditionFailed, errors.Join(ErrForeignKeyViolation, fmt.Errorf("%s", pgErr.ColumnName))

		case pgerrcode.InsufficientResources, pgerrcode.DiskFull, pgerrcode.OutOfMemory, pgerrcode.TooManyConnections,
			pgerrcode.ConfigurationLimitExceeded:
			return http.StatusServiceUnavailable, ErrDatabaseUnavailable

		default:
			return http.StatusInternalServerError, err
		}
	}

	if errors.Is(err, pgx.ErrNoRows) {
		return http.StatusNotFound, ErrNotFound
	}

	return http.StatusInternalServerError, err
}
