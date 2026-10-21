// Package di là composition root: nơi DUY NHẤT khởi tạo client, module và nối chúng với nhau.
//
// Thêm tính năng mới:
//  1. thêm field cho module vào Container
//  2. khởi tạo nó trong NewContainer (sau các module nó phụ thuộc)
//  3. thêm nó vào danh sách trong Modules()
package di

import (
	"gorm.io/gorm"

	"magic/backend/internal/config"
	"magic/backend/internal/modules"
	"magic/backend/internal/modules/auth"
	"magic/backend/internal/modules/health"
	"magic/backend/internal/modules/user"
	"magic/backend/pkg/token"
	"magic/backend/pkg/zalo"
)

type Container struct {
	DB *gorm.DB

	// Client dùng chung, không chứa nghiệp vụ.
	Tokens *token.Manager // tạo/kiểm tra JWT: auth cấp token, middleware kiểm tra token
	Zalo   *zalo.Client   // gọi Zalo Graph API để xác thực người dùng

	// Module tính năng.
	Health *health.Handler
	User   *user.Module
	Auth   *auth.Module
}

func NewContainer(cfg *config.Config, db *gorm.DB) *Container {
	c := &Container{DB: db}

	c.Tokens = token.NewManager(cfg.JWTSecret, cfg.JWTTTL)
	c.Zalo = zalo.NewClient(cfg.ZaloAppSecret)

	// Module nào cần module khác thì khởi tạo module kia trước (auth cần User.Repo).
	c.Health = health.NewHandler(db)
	c.User = user.NewModule(db)
	c.Auth = auth.NewModule(c.User.Repo, c.Zalo, c.Tokens)

	return c
}

// Modules trả về các module có route/model để server gắn route và chạy migrate.
func (c *Container) Modules() []modules.Module {
	return []modules.Module{
		c.User,
		c.Auth,
	}
}
