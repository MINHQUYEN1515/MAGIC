package auth

import (
	"context"

	"magic/backend/internal/modules/user"
	"magic/backend/pkg/token"
	"magic/backend/pkg/zalo"
)

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
		ZaloID: profile.ID,
		Name:   profile.Name,
		Avatar: profile.Picture.Data.URL,
	}
	if err := s.users.UpsertByZaloID(ctx, u); err != nil {
		return "", nil, err
	}

	jwt, err := s.tokens.Generate(u.ID)
	if err != nil {
		return "", nil, err
	}
	return jwt, u, nil
}
