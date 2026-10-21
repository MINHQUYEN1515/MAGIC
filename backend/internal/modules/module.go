// Package modules chứa các tính năng của backend; mỗi thư mục con là một module.
package modules

import "github.com/gin-gonic/gin"

// Module là "hợp đồng" mà mỗi tính năng trong internal/modules phải có.
type Module interface {
	// Models trả về các struct cần tạo bảng trong DB (không có bảng thì trả nil).
	Models() []any
	// RegisterRoutes gắn route của module.
	//   public:    /api/v1, ai cũng gọi được
	//   protected: /api/v1, bắt buộc header "Authorization: Bearer <jwt>"
	RegisterRoutes(public, protected *gin.RouterGroup)
}
