package tiles

import (
	"log/slog"
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

	m, err := s.getMapCache(ctx, int32(x), int32(y))
	if err != nil {
		slog.ErrorContext(ctx, "failed to get map cache", "err", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

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
