// Package server tạo engine HTTP: middleware chung (log, bắt panic, CORS) rồi gắn routes tổng.
package server

import (
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"

	"magic/backend/internal/config"
	"magic/backend/internal/di"
	"magic/backend/internal/routes"
)

// New tạo engine HTTP. Được gọi một lần trong cmd/api/main.go.
func New(cfg *config.Config, c *di.Container) *gin.Engine {
	if cfg.IsProduction() {
		gin.SetMode(gin.ReleaseMode) // tắt log debug của Gin
	}

	r := gin.New()
	r.Use(gin.Logger())                          // in log mỗi request
	r.Use(gin.Recovery())                        // handler bị panic thì trả 500 thay vì sập server
	r.Use(cors.New(corsConfig(cfg.CORSOrigins))) // cho phép web (khác domain) gọi API

	routes.Register(r, c)
	return r
}

// corsConfig: origins là danh sách domain được phép gọi API; ["*"] nghĩa là cho phép tất cả.
func corsConfig(origins []string) cors.Config {
	c := cors.Config{
		AllowMethods:  []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:  []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders: []string{"Content-Length"},
		MaxAge:        12 * time.Hour, // trình duyệt nhớ kết quả preflight 12 tiếng
	}
	if len(origins) == 1 && origins[0] == "*" {
		c.AllowAllOrigins = true
	} else {
		c.AllowOrigins = origins
	}
	return c
}
