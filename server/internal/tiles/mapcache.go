package tiles

import (
	"context"
	"fmt"
)

func (s *server) getMapCache(ctx context.Context, x, y int32) ([]byte, error) {
	ex := x - x%MapChunkSize
	ey := y - y%MapChunkSize

	s.mapCacheLock.RLock()
	cached, ok := s.mapCache[fmt.Sprintf("%d,%d", ex, ey)]
	s.mapCacheLock.RUnlock()

	if ok {
		return cached, nil
	}

	return s.updateMapCache(ctx, x, y)
}

func (s *server) updateMapCache(ctx context.Context, x, y int32) ([]byte, error) {
	ex := x - x%MapChunkSize
	ey := y - y%MapChunkSize

	tiles, err := s.querier.GetTileAvailabilityMap(ctx, s.pool, ex, ey, x+MapChunkSize, y+MapChunkSize)
	if err != nil {
		return nil, err
	}

	m := make([]byte, MapChunkSize*MapChunkSize/8)
	for _, tile := range tiles {
		setBitTileInBitmap(m, tile.X, tile.Y)
	}

	s.mapCacheLock.Lock()
	defer s.mapCacheLock.Unlock()
	s.mapCache[fmt.Sprintf("%d,%d", x, y)] = m

	return m, nil
}
