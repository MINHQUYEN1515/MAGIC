package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	AppEnv   string
	HTTPPort string

	DatabaseURL string

	JWTSecret string
	JWTTTL    time.Duration

	ZaloAppID     string
	ZaloAppSecret string

	CORSOrigins []string
}

// Load đọc cấu hình từ biến môi trường (và file .env nếu có).
func Load() (*Config, error) {
	_ = godotenv.Load()

	ttlHours, err := strconv.Atoi(getEnv("JWT_TTL_HOURS", "72"))
	if err != nil {
		return nil, fmt.Errorf("JWT_TTL_HOURS không hợp lệ: %w", err)
	}

	cfg := &Config{
		AppEnv:        getEnv("APP_ENV", "development"),
		HTTPPort:      getEnv("HTTP_PORT", "8080"),
		DatabaseURL:   getEnv("DATABASE_URL", "postgres://magic:magic@localhost:5432/magic?sslmode=disable"),
		JWTSecret:     os.Getenv("JWT_SECRET"),
		JWTTTL:        time.Duration(ttlHours) * time.Hour,
		ZaloAppID:     os.Getenv("ZALO_APP_ID"),
		ZaloAppSecret: os.Getenv("ZALO_APP_SECRET"),
		CORSOrigins:   splitCSV(getEnv("CORS_ORIGINS", "*")),
	}

	if cfg.JWTSecret == "" {
		return nil, fmt.Errorf("thiếu JWT_SECRET")
	}
	return cfg, nil
}

func (c *Config) IsProduction() bool { return c.AppEnv == "production" }

func getEnv(key, fallback string) string {
	if v, ok := os.LookupEnv(key); ok && v != "" {
		return v
	}
	return fallback
}

func splitCSV(s string) []string {
	parts := strings.Split(s, ",")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		if p = strings.TrimSpace(p); p != "" {
			out = append(out, p)
		}
	}
	return out
}
