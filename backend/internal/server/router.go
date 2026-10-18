package server

import (
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"magic/backend/internal/config"
	"magic/backend/internal/middleware"
	"magic/backend/internal/modules/auth"
	"magic/backend/internal/modules/health"
	"magic/backend/internal/modules/user"
	"magic/backend/internal/pkg/token"
	"magic/backend/internal/pkg/zalo"
)

// Module là hợp đồng chung mà mỗi tính năng trong internal/modules phải thoả mãn.
type Module interface {
	Models() []any
	RegisterRoutes(public, protected *gin.RouterGroup)
}

type Server struct {
	Engine  *gin.Engine
	modules []Module
	db      *gorm.DB
}

func New(cfg *config.Config, db *gorm.DB) *Server {
	if cfg.IsProduction() {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.New()
	r.Use(gin.Logger(), gin.Recovery())
	r.Use(cors.New(corsConfig(cfg.CORSOrigins)))

	tokens := token.NewManager(cfg.JWTSecret, cfg.JWTTTL)
	zaloClient := zalo.NewClient(cfg.ZaloAppSecret)

	// Đăng ký module mới tại đây.
	userMod := user.NewModule(db)
	modules := []Module{
		userMod,
		auth.NewModule(userMod.Repo, zaloClient, tokens),
	}

	r.GET("/health", health.NewHandler(db).Check)

	public := r.Group("/api/v1")
	protected := public.Group("", middleware.RequireAuth(tokens))
	for _, m := range modules {
		m.RegisterRoutes(public, protected)
	}

	return &Server{Engine: r, modules: modules, db: db}
}

// Migrate chạy AutoMigrate cho model của tất cả module.
func (s *Server) Migrate() error {
	var models []any
	for _, m := range s.modules {
		models = append(models, m.Models()...)
	}
	return s.db.AutoMigrate(models...)
}

func corsConfig(origins []string) cors.Config {
	c := cors.Config{
		AllowMethods:  []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:  []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders: []string{"Content-Length"},
		MaxAge:        12 * time.Hour,
	}
	if len(origins) == 1 && origins[0] == "*" {
		c.AllowAllOrigins = true
	} else {
		c.AllowOrigins = origins
	}
	return c
}
