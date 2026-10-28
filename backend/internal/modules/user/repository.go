package user

import (
	"context"
	"errors"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

var (
	ErrNotFound   = errors.New("không tìm thấy người dùng")
	ErrEmailTaken = errors.New("email đã được sử dụng")
)

type Repository struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) FindByID(ctx context.Context, id uint) (*User, error) {
	var u User
	err := r.db.WithContext(ctx).First(&u, id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrNotFound
	}
	return &u, err
}

func (r *Repository) FindByEmail(ctx context.Context, email string) (*User, error) {
	var u User
	err := r.db.WithContext(ctx).Where("email = ?", email).First(&u).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrNotFound
	}
	return &u, err
}

// Create tạo user mới; trùng email trả về ErrEmailTaken (cần TranslateError trong gorm.Config).
func (r *Repository) Create(ctx context.Context, u *User) error {
	err := r.db.WithContext(ctx).Create(u).Error
	if errors.Is(err, gorm.ErrDuplicatedKey) {
		return ErrEmailTaken
	}
	return err
}

// UpsertByZaloID tạo mới hoặc cập nhật tên/avatar theo zalo_id.
func (r *Repository) UpsertByZaloID(ctx context.Context, u *User) error {
	return r.db.WithContext(ctx).Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "zalo_id"}},
		DoUpdates: clause.AssignmentColumns([]string{"name", "avatar", "updated_at"}),
	}).Create(u).Error
}
