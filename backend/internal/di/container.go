// Package di là nơi DUY NHẤT khởi tạo mọi thứ của backend: client, repository, service,
// handler và middleware. Các nơi khác (routes, main) chỉ lấy ra dùng, không tự new.
package di

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"magic/backend/internal/config"
	"magic/backend/internal/middleware"
	"magic/backend/internal/modules/auth"
	"magic/backend/internal/modules/health"
	"magic/backend/internal/modules/user"
	"magic/backend/pkg/token"
	"magic/backend/pkg/zalo"
)

type Container struct {
	DB *gorm.DB

	// Client dùng chung
	Tokens *token.Manager // tạo/kiểm tra JWT
	Zalo   *zalo.Client   // gọi Zalo Graph API

	// Middleware
	RequireAuth gin.HandlerFunc // bắt buộc header "Authorization: Bearer <jwt>"

	// Module health
	HealthHandler *health.Handler

	// Module user
	UserRepo    *user.Repository
	UserHandler *user.Handler

	// Module auth
	AuthService *auth.Service
	AuthHandler *auth.Handler
}

func NewContainer(cfg *config.Config, db *gorm.DB) *Container {
	c := &Container{DB: db}

	// Client dùng chung
	c.Tokens = token.NewManager(cfg.JWTSecret, cfg.JWTTTL)
	c.Zalo = zalo.NewClient(cfg.ZaloAppSecret)

	// Middleware
	c.RequireAuth = middleware.RequireAuth(c.Tokens)

	// Module health
	c.HealthHandler = health.NewHandler(db)

	// Module user
	c.UserRepo = user.NewRepository(db)
	c.UserHandler = user.NewHandler(c.UserRepo)

	// Module auth (dùng UserRepo nên phải khởi tạo sau module user)
	c.AuthService = auth.NewService(c.UserRepo, c.Zalo, c.Tokens)
	c.AuthHandler = auth.NewHandler(c.AuthService)

	return c
}
