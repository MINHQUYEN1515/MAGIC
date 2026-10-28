package auth

import (
	"errors"
	"log/slog"
	"magic/backend/internal/modules/user"
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

type registerRequest struct {
	Name     string `json:"name" binding:"required,max=255"`
	Email    string `json:"email" binding:"required,email,max=255"`
	Password string `json:"password" binding:"required,min=8,max=72"` // bcrypt chỉ nhận tối đa 72 byte
}

// Register: POST /api/v1/auth/register  {"name", "email", "password"}
func (h *Handler) Register(c *gin.Context) {
	var req registerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "cần tên, email hợp lệ và mật khẩu 8–72 ký tự"})
		return
	}

	token, u, err := h.svc.Register(c.Request.Context(), req.Name, req.Email, req.Password)
	if errors.Is(err, user.ErrEmailTaken) {
		c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
		return
	}
	if err != nil {
		slog.Error("register", "err", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "lỗi máy chủ"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"token": token, "user": u})
}

type loginRequest struct {
	Email    string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// Login: POST /api/v1/auth/login  {"email", "password"}
func (h *Handler) Login(c *gin.Context) {
	var req loginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "thiếu email hoặc mật khẩu"})
		return
	}

	token, u, err := h.svc.Login(c.Request.Context(), req.Email, req.Password)
	if errors.Is(err, ErrInvalidCredentials) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}
	if err != nil {
		slog.Error("login", "err", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "lỗi máy chủ"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"token": token, "user": u})
}
