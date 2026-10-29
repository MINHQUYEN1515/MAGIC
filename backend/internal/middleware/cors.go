package middleware

import (
	"time"

	"github.com/gin-contrib/cors"
)

func CorsConfig(origins []string) cors.Config {
	c := cors.Config{
		AllowMethods:  []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:  []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders: []string{"Content-Length"},
		MaxAge:        12 * time.Hour, // trình duyệt nhớ kết quả preflight 12 tiếng
	}
	if len(origins) == 1 && origins[0] == "*" {
		c.AllowAllOrigins = true
	} else {
		c.AllowOrigins = origins
	}
	return c
}
