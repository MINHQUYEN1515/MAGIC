package auth

import (
	"github.com/gin-gonic/gin"

	"magic/backend/internal/modules/user"
	"magic/backend/pkg/token"
	"magic/backend/pkg/zalo"
)

type Module struct {
	handler *Handler
}

func NewModule(users *user.Repository, z *zalo.Client, tm *token.Manager) *Module {
	return &Module{handler: NewHandler(NewService(users, z, tm))}
}

func (m *Module) Models() []any { return nil }

// RegisterRoutes gom route của module vào một nhóm con: /api/v1/auth/...
func (m *Module) RegisterRoutes(public, protected *gin.RouterGroup) {
	g := public.Group("/auth")
	g.POST("/zalo", m.handler.ZaloLogin) // POST /api/v1/auth/zalo
}
