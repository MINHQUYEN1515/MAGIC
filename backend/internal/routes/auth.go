package routes

import (
	"github.com/gin-gonic/gin"

	"magic/backend/internal/di"
)

// authRoutes: /api/v1/auth/...
func authRoutes(api *gin.RouterGroup, c *di.Container) {
	g := api.Group("/auth")
	g.POST("/zalo", c.AuthHandler.ZaloLogin) // POST /api/v1/auth/zalo  (public)
}
