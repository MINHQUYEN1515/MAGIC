// Package routes là routes tổng: nhìn file này là thấy toàn bộ API.
// Route chi tiết của từng module nằm ở file con cùng thư mục (auth.go, user.go...).
package routes

import (
	"github.com/gin-gonic/gin"

	"magic/backend/internal/di"
)

// Register gắn tất cả route vào engine.
func Register(r *gin.Engine, c *di.Container) {
	r.GET("/health", c.HealthHandler.Check) // nằm ngoài /api/v1 cho hệ thống giám sát gọi

	api := r.Group("/api/v1")

	// Thêm module mới: tạo file <module>.go cùng thư mục rồi gọi ở đây.
	authRoutes(api, c) // /api/v1/auth/...
	userRoutes(api, c) // /api/v1/me
}
