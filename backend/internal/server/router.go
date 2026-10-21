// Package server dựng ứng dụng HTTP từ các dependency đã khởi tạo sẵn trong di.Container.
//
// Đọc theo thứ tự trong hàm New:
//
//  1. newEngine    – tạo Gin và gắn middleware chung (log, bắt panic, CORS)
//  2. mountRoutes  – gắn route: /health và /api/v1/... của từng module
//
// Server không tự khởi tạo module; thêm tính năng mới thì sửa internal/di/container.go.
package server

import (
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"magic/backend/internal/config"
	"magic/backend/internal/di"
	"magic/backend/internal/middleware"
	"magic/backend/internal/modules"
)

// Server giữ engine HTTP (main.go dùng để chạy) và danh sách module (Migrate dùng để tạo bảng).
type Server struct {
	Engine  *gin.Engine
	modules []modules.Module
	db      *gorm.DB
}

// New dựng server từ config và container. Được gọi một lần trong cmd/api/main.go.
func New(cfg *config.Config, c *di.Container) *Server {
	r := newEngine(cfg)
	mountRoutes(r, c)
	return &Server{Engine: r, modules: c.Modules(), db: c.DB}
}

// newEngine tạo Gin và gắn các middleware chạy cho MỌI request.
func newEngine(cfg *config.Config) *gin.Engine {
	if cfg.IsProduction() {
		gin.SetMode(gin.ReleaseMode) // tắt log debug của Gin
	}

	r := gin.New()
	r.Use(gin.Logger())                          // in log mỗi request
	r.Use(gin.Recovery())                        // handler bị panic thì trả 500 thay vì sập server
	r.Use(cors.New(corsConfig(cfg.CORSOrigins))) // cho phép mini app (khác domain) gọi API
	return r
}

// mountRoutes gắn tất cả route vào engine:
//
//	GET  /health          kiểm tra server + DB (nằm ngoài /api/v1 cho hệ thống giám sát gọi)
//	     /api/v1/...      route public của từng module
//	     /api/v1/...      route protected của từng module (qua RequireAuth)
func mountRoutes(r *gin.Engine, c *di.Container) {
	r.GET("/health", c.Health.Check)

	public := r.Group("/api/v1")
	// Cùng tiền tố /api/v1 nhưng có thêm middleware kiểm tra JWT.
	protected := public.Group("", middleware.RequireAuth(c.Tokens))

	for _, m := range c.Modules() {
		m.RegisterRoutes(public, protected)
	}
}

// Migrate tạo/cập nhật bảng DB cho model của tất cả module (GORM AutoMigrate).
func (s *Server) Migrate() error {
	var models []any
	for _, m := range s.modules {
		models = append(models, m.Models()...)
	}
	return s.db.AutoMigrate(models...)
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
