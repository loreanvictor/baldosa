package publisher

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/loreanvictor/baldosa.git/server/internal/storage"
)

type Publisher interface {
	Process(ctx context.Context, x, y int32) error
}

type Config struct {
	Addr    string        `mapstructure:"addr"`
	APIKey  string        `mapstructure:"api_key"`
	Timeout time.Duration `mapstructure:"timeout"`
}

type ProcessRequest struct {
	X        int32  `json:"x"`
	Y        int32  `json:"y"`
	Title    string `json:"title"`
	Subtitle string `json:"subtitle"`
	Link     string `json:"link"`
}

type publisher struct {
	client http.Client
	addr   string
	apiKey string

	querier storage.Querier
	pool    *pgxpool.Pool
}

func New(
	config Config,
	querier storage.Querier,
	pool *pgxpool.Pool,
) Publisher {
	return &publisher{
		client: http.Client{
			Timeout: config.Timeout,
		},
		addr:   config.Addr,
		apiKey: config.APIKey,

		querier: querier,
		pool:    pool,
	}
}

func (p *publisher) Process(ctx context.Context, x, y int32) error {
	tile, err := p.querier.GetTile(ctx, p.pool, x, y)
	if err != nil {
		slog.ErrorContext(ctx, "failed to get tile", "error", err)
		return err
	}

	body := ProcessRequest{
		X:        tile.X,
		Y:        tile.Y,
		Title:    tile.Title,
		Subtitle: tile.Subtitle,
		Link:     tile.Link,
	}

	buf := bytes.NewBuffer(nil)
	err = json.NewEncoder(buf).Encode(body)
	if err != nil {
		slog.ErrorContext(ctx, "failed to encode request body", "error", err)
		return err
	}

	req, err := http.NewRequest(http.MethodPost, fmt.Sprintf("%s/process", p.addr), buf)
	if err != nil {
		slog.ErrorContext(ctx, "failed to create request", "error", err)
		return err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")
	req.Header.Set("Authorization", "Bearer "+p.apiKey)

	resp, err := p.client.Do(req)
	if err != nil {
		slog.ErrorContext(ctx, "failed to send request", "error", err)
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		slog.ErrorContext(ctx, "request failed", "status", resp.StatusCode)
		return errors.New("request failed")
	}

	return nil
}