package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
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

	db, err := database.Connect(cfg.DatabaseURL, !cfg.IsProduction())
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

	errCh := make(chan error, 1)
	go func() {
		slog.Info("HTTP server đang chạy", "port", cfg.HTTPPort, "env", cfg.AppEnv)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			errCh <- err
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	select {
	case err := <-errCh:
		return err
	case <-quit:
	}

	slog.Info("đang tắt server...")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	return srv.Shutdown(ctx)
}
