package user

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type Module struct {
	Repo    *Repository // export để module khác (vd: auth) dùng lại
	handler *Handler
}

func NewModule(db *gorm.DB) *Module {
	repo := NewRepository(db)
	return &Module{Repo: repo, handler: NewHandler(repo)}
}

func (m *Module) Models() []any { return []any{&User{}} }

func (m *Module) RegisterRoutes(public, protected *gin.RouterGroup) {
	protected.GET("/me", m.handler.Me)
}
