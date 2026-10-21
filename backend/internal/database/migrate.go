package database

import (
	"gorm.io/gorm"

	"magic/backend/internal/modules/user"
)

// Migrate tạo/cập nhật bảng cho các model. Module mới có bảng thì thêm model vào đây.
func Migrate(db *gorm.DB) error {
	return db.AutoMigrate(
		&user.User{},
	)
}
