package routes

import (
	"github.com/gin-gonic/gin"

	"magic/backend/internal/di"
)

// userRoutes: các route của người dùng, đều cần JWT.
func userRoutes(api *gin.RouterGroup, c *di.Container) {
	g := api.Group("", c.RequireAuth)
	g.GET("/me", c.UserHandler.Me) // GET /api/v1/me
}
