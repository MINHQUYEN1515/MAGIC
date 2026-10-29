package middleware

import (
	"magic/backend/pkg/token"
	"net/http"
	"strings"

	AppConstants "magic/backend/pkg/constants"

	"github.com/gin-gonic/gin"
)

// RequireAuth yêu cầu header "Authorization: Bearer <jwt>".
func RequireAuth(tm *token.Manager) gin.HandlerFunc {
	return func(c *gin.Context) {
		raw, ok := strings.CutPrefix(c.GetHeader("Authorization"), "Bearer ")
		if !ok || raw == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "thiếu token"})
			return
		}
		id, err := tm.Parse(raw)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "token không hợp lệ"})
			return
		}
		c.Set(AppConstants.UserIDKey, id)
		c.Next()
	}
}

// UserID trả về ID người dùng đã xác thực (dùng sau RequireAuth).
func UserID(c *gin.Context) uint {
	return c.GetUint(AppConstants.UserIDKey)
}
