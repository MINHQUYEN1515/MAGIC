package user

import "time"

type User struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	ZaloID    string    `gorm:"uniqueIndex;size:64;not null" json:"zalo_id"`
	Name      string    `gorm:"size:255" json:"name"`
	Avatar    string    `gorm:"size:1024" json:"avatar"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
