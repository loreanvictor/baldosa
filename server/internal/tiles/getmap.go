package tiles

import (
	"fmt"
	"net/http"
	"strconv"

	"github.com/samber/lo"

	"github.com/loreanvictor/baldosa.git/server/internal/storage"
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

	s.mapCacheLock.RLock()
	cached, ok := s.mapCache[fmt.Sprintf("%d,%d", x, y)]
	s.mapCacheLock.RUnlock()

	if ok {
		w.Header().Set("Content-Type", "application/octet-stream")
		w.WriteHeader(http.StatusOK)
		w.Write(cached)
		return
	}

	tiles, err := s.querier.GetTileAvailabilityMap(ctx, s.pool, int32(x), int32(y), int32(x+MapChunkSize), int32(y+MapChunkSize))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	m := make([]byte, MapChunkSize*MapChunkSize/8)
	lo.ForEach(tiles, func(tile storage.GetTileAvailabilityMapRow, _ int) {
		setBitTileInBitmap(m, tile.X, tile.Y)
	})

	s.mapCacheLock.Lock()
	s.mapCache[fmt.Sprintf("%d,%d", x, y)] = m
	s.mapCacheLock.Unlock()

	w.Header().Set("Content-Type", "application/octet-stream")
	w.WriteHeader(http.StatusOK)
	w.Write(m)
}

func setBitTileInBitmap(bitmap []byte, x, y int32) {
	ex := x % MapChunkSize
	ey := y % MapChunkSize
	bitNum := ex + ey*MapChunkSize
	byteNum := bitNum / 8
	byteIdx := bitNum % 8

	bitmap[byteNum] |= 1 << byteIdx
}
