package tiles

import (
	"context"
	"fmt"
	"log/slog"
)

type mapUpdateTask struct {
	x int32
	y int32
}

func (s *server) RunPeriodicBitmapUpdateTask(ctx context.Context) {
	go func() {
		for {
			select {
			case <-ctx.Done():
				return
			case task := <-s.mapUpdateTaskChan:
				slog.InfoContext(ctx, "handling map update task", "x", task.x, "y", task.y)
				err := s.mapUpdateTaskHandler(ctx, task)
				if err != nil {
					slog.ErrorContext(ctx, "failed to handle map update task", "err", err)
					continue
				}
				slog.InfoContext(ctx, "map update task handled", "x", task.x, "y", task.y)
			}
		}
	}()
}

func (s *server) mapUpdateTaskHandler(ctx context.Context, task mapUpdateTask) error {
	ex := task.x - task.x%MapChunkSize
	ey := task.y - task.y%MapChunkSize

	m, err := s.updateMapCache(ctx, ex, ey)
	if err != nil {
		slog.ErrorContext(ctx, "failed to update map cache", "err", err)
		return err
	}

	err = s.bucketPublished.Put(ctx, fmt.Sprintf("maps-%d-%d.bin", ex, ey), m)

	if err != nil {
		slog.ErrorContext(ctx, "failed to upload map to S3", "err", err)
		return err
	}

	return nil
}
