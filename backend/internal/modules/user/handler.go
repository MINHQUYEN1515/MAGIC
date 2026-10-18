package user

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"

	"magic/backend/internal/middleware"
)

type Handler struct {
	repo *Repository
}

func NewHandler(repo *Repository) *Handler {
	return &Handler{repo: repo}
}

// Me: GET /api/v1/me (cần JWT)
func (h *Handler) Me(c *gin.Context) {
	u, err := h.repo.FindByID(c.Request.Context(), middleware.UserID(c))
	if errors.Is(err, ErrNotFound) {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "lỗi máy chủ"})
		return
	}
	c.JSON(http.StatusOK, u)
}
