package tiles

import (
	"math/rand"
	"net/http"
	"strconv"
)

const (
	MapChunkSize = 256
)

func (s *server) GetMapHandler(w http.ResponseWriter, r *http.Request) {
	xRaw := r.PathValue("x")
	yRaw := r.PathValue("y")

	x, errX := strconv.ParseInt(xRaw, 10, 32)
	y, errY := strconv.ParseInt(yRaw, 10, 32)
	if errX != nil || errY != nil {
		http.Error(w, "invalid coordinates", http.StatusBadRequest)
	}

	ctx := r.Context()

	if x%MapChunkSize != 0 || y%MapChunkSize != 0 {
		http.Error(w, "invalid coordinates", http.StatusBadRequest)
		return
	}

	tiles, err := s.querier.GetTileAvailabilityMap(ctx, s.pool, int32(x), int32(y), int32(x+MapChunkSize), int32(y+MapChunkSize))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	m := make([]byte, MapChunkSize*MapChunkSize)
	for _, t := range tiles {
		index := t.Y*MapChunkSize + t.X
		m[index] = byte(rand.Intn(255) + 1)
	}

	w.Header().Set("Content-Type", "application/octet-stream")
	w.WriteHeader(http.StatusOK)
	w.Write(m)
}
