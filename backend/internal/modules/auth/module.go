package auth

import (
	"github.com/gin-gonic/gin"

	"magic/backend/internal/modules/user"
	"magic/backend/internal/pkg/token"
	"magic/backend/internal/pkg/zalo"
)

type Module struct {
	handler *Handler
}

func NewModule(users *user.Repository, z *zalo.Client, tm *token.Manager) *Module {
	return &Module{handler: NewHandler(NewService(users, z, tm))}
}

func (m *Module) Models() []any { return nil }

func (m *Module) RegisterRoutes(public, protected *gin.RouterGroup) {
	public.POST("/auth/zalo", m.handler.ZaloLogin)
}
