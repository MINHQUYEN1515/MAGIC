package routes

import (
	"github.com/gin-gonic/gin"

	"magic/backend/internal/di"
)

// authRoutes: /api/v1/auth/...
func authRoutes(api *gin.RouterGroup, c *di.Container) {
	g := api.Group("/auth")
	g.POST("/register", c.AuthHandler.Register) // POST /api/v1/auth/register  (public)
	g.POST("/login", c.AuthHandler.Login)       // POST /api/v1/auth/login     (public)
	g.POST("/zalo", c.AuthHandler.ZaloLogin)    // POST /api/v1/auth/zalo      (public)
}
