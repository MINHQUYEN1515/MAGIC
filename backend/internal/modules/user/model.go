package user

import "time"

type User struct {
	ID uint `gorm:"primaryKey" json:"id"`
	// Con trỏ để NULL được: user đăng ký bằng email không có zalo_id và ngược lại.
	ZaloID       *string   `gorm:"uniqueIndex;size:64" json:"zalo_id"`
	Email        *string   `gorm:"uniqueIndex;size:255" json:"email"`
	PasswordHash string    `gorm:"size:255" json:"-"`
	Name         string    `gorm:"size:255" json:"name"`
	Avatar       string    `gorm:"size:1024" json:"avatar"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}
