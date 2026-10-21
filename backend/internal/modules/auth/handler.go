package auth

import (
	"errors"
	"log/slog"
	"magic/backend/pkg/zalo"
	"net/http"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

type zaloLoginRequest struct {
	AccessToken string `json:"access_token" binding:"required"`
}

// ZaloLogin: POST /api/v1/auth/zalo  {"access_token": "<từ zmp-sdk getAccessToken>"}
func (h *Handler) ZaloLogin(c *gin.Context) {
	var req zaloLoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "thiếu access_token"})
		return
	}

	token, user, err := h.svc.LoginWithZalo(c.Request.Context(), req.AccessToken)
	if errors.Is(err, zalo.ErrInvalidToken) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "access token Zalo không hợp lệ"})
		return
	}
	if err != nil {
		slog.Error("zalo login", "err", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "lỗi máy chủ"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"token": token, "user": user})
}
