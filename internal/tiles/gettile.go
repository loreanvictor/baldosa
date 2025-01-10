package tiles

import (
	"log/slog"
	"net/http"
	"strconv"

	"github.com/jackc/pgx/v5"
	"github.com/pkg/errors"
)

func (s *tilesServer) GetTile(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Invalid method", http.StatusMethodNotAllowed)
		return
	}

	rawTileID := r.PathValue("TileID")
	tileID, err := strconv.ParseInt(rawTileID, 10, 64)
	if err != nil {
		slog.InfoContext(r.Context(), "Invalid tile ID")
		http.Error(w, "Invalid tile ID", http.StatusBadRequest)
		return
	}

	tile, err := s.querier.GetTileByID(r.Context(), s.pool, tileID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			http.Error(w, "Tile not found", http.StatusNotFound)
			return
		}

		slog.ErrorContext(r.Context(), "Failed to get tile",
			"tileID", tileID)
		http.Error(w, "Failed to get tile", http.StatusInternalServerError)
		return
	}

	tileJSON := tile.JSON()
	w.Header().Set("Content-Type", "application/json")
	w.Write(tileJSON)
}
