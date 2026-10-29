package middleware

import (
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/time/rate"
)

type Clients struct {
	limit      *rate.Limiter
	lastUpdate time.Time
}

var (
	clients = make(map[string]*Clients)
	mu      sync.Mutex
)

func getLimit(ip string) *rate.Limiter {
	mu.Lock()
	defer mu.Unlock()

	limit, ok := clients[ip]
	if !ok {
		limit = &Clients{
			limit: rate.NewLimiter(10, 20),
		}
		clients[ip] = limit
	}
	clients[ip].lastUpdate = time.Now()
	return limit.limit

}
func CleanupClients() {
	ticker := time.NewTicker(time.Minute)

	for range ticker.C {
		mu.Lock()
		for ip, client := range clients {
			if time.Since(client.lastUpdate) > 3*time.Minute {
				delete(clients, ip)
			}
		}
		mu.Unlock()
	}
}
func RateLimit() gin.HandlerFunc {
	return func(c *gin.Context) {
		if !getLimit(c.ClientIP()).Allow() {
			c.AbortWithStatusJSON(429, gin.H{"error": "Quá nhiều yêu cầu, vui lòng thử lại sau"})
			return
		}
		c.Next()
	}
}
