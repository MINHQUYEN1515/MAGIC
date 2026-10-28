package auth

import (
	"context"
	"errors"
	"strings"

	"golang.org/x/crypto/bcrypt"

	"magic/backend/internal/modules/user"
	"magic/backend/pkg/token"
	"magic/backend/pkg/zalo"
)

var ErrInvalidCredentials = errors.New("email hoặc mật khẩu không đúng")

type Service struct {
	users  *user.Repository
	zalo   *zalo.Client
	tokens *token.Manager
}

func NewService(users *user.Repository, z *zalo.Client, tm *token.Manager) *Service {
	return &Service{users: users, zalo: z, tokens: tm}
}

// LoginWithZalo xác thực access token Zalo, lưu/cập nhật user và cấp JWT của hệ thống.
func (s *Service) LoginWithZalo(ctx context.Context, accessToken string) (string, *user.User, error) {
	profile, err := s.zalo.GetProfile(ctx, accessToken)
	if err != nil {
		return "", nil, err
	}

	u := &user.User{
		ZaloID: &profile.ID,
		Name:   profile.Name,
		Avatar: profile.Picture.Data.URL,
	}
	if err := s.users.UpsertByZaloID(ctx, u); err != nil {
		return "", nil, err
	}

	return s.issue(u)
}

// Register tạo tài khoản email/mật khẩu và cấp JWT luôn (đăng ký xong là đăng nhập).
func (s *Service) Register(ctx context.Context, name, email, password string) (string, *user.User, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", nil, err
	}
	email = normalizeEmail(email)
	u := &user.User{
		Email:        &email,
		PasswordHash: string(hash),
		Name:         strings.TrimSpace(name),
	}
	if err := s.users.Create(ctx, u); err != nil {
		return "", nil, err
	}
	return s.issue(u)
}

// Login kiểm tra email/mật khẩu. Sai email hay sai mật khẩu đều trả cùng một lỗi.
func (s *Service) Login(ctx context.Context, email, password string) (string, *user.User, error) {
	u, err := s.users.FindByEmail(ctx, normalizeEmail(email))
	if errors.Is(err, user.ErrNotFound) {
		return "", nil, ErrInvalidCredentials
	}
	if err != nil {
		return "", nil, err
	}
	// User tạo từ Zalo không có mật khẩu → PasswordHash rỗng, bcrypt trả lỗi.
	if bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(password)) != nil {
		return "", nil, ErrInvalidCredentials
	}
	return s.issue(u)
}

func (s *Service) issue(u *user.User) (string, *user.User, error) {
	jwt, err := s.tokens.Generate(u.ID)
	if err != nil {
		return "", nil, err
	}
	return jwt, u, nil
}

func normalizeEmail(email string) string {
	return strings.ToLower(strings.TrimSpace(email))
}
