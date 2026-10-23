package main

import (
	"log/slog"
	"net/http"
	"os"
	"time"

	"magic/backend/internal/config"
	"magic/backend/internal/database"
	"magic/backend/internal/di"
	"magic/backend/internal/server"
)

func main() {
	if err := run(); err != nil {
		slog.Error("server dừng do lỗi", "err", err)
		os.Exit(1)
	}
}

func run() error {
	cfg, err := config.Load()
	if err != nil {
		return err
	}

	db, err := database.Connect(cfg)
	if err != nil {
		return err
	}
	if err := database.Migrate(db); err != nil {
		return err
	}

	srv := &http.Server{
		Addr:              ":" + cfg.HTTPPort,
		Handler:           server.New(cfg, di.NewContainer(cfg, db)),
		ReadHeaderTimeout: 10 * time.Second,
	}

	if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		return err
	}
	return nil
}
