// Package zalo xác thực access token do Zalo Mini App (zmp-sdk getAccessToken) trả về.
package zalo

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"time"
)

const defaultGraphURL = "https://graph.zalo.me/v2.0"

var ErrInvalidToken = errors.New("access token Zalo không hợp lệ")

type Profile struct {
	ID      string `json:"id"`
	Name    string `json:"name"`
	Picture struct {
		Data struct {
			URL string `json:"url"`
		} `json:"data"`
	} `json:"picture"`
}

type Client struct {
	appSecret  string
	graphURL   string
	httpClient *http.Client
}

func NewClient(appSecret string) *Client {
	return &Client{
		appSecret:  appSecret,
		graphURL:   defaultGraphURL,
		httpClient: &http.Client{Timeout: 10 * time.Second},
	}
}

// WithGraphURL dùng cho test.
func (c *Client) WithGraphURL(u string) *Client {
	c.graphURL = u
	return c
}

// GetProfile gọi Zalo Graph API /me để lấy thông tin người dùng từ access token.
func (c *Client) GetProfile(ctx context.Context, accessToken string) (*Profile, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, c.graphURL+"/me?fields=id,name,picture", nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("access_token", accessToken)
	if c.appSecret != "" {
		req.Header.Set("appsecret_proof", appSecretProof(accessToken, c.appSecret))
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("gọi Zalo Graph API: %w", err)
	}
	defer resp.Body.Close()

	var body struct {
		Profile
		Error   int    `json:"error"`
		Message string `json:"message"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&body); err != nil {
		return nil, fmt.Errorf("đọc phản hồi Zalo: %w", err)
	}
	if body.Error != 0 || body.ID == "" {
		return nil, fmt.Errorf("%w: %d %s", ErrInvalidToken, body.Error, body.Message)
	}
	return &body.Profile, nil
}

func appSecretProof(accessToken, secret string) string {
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(accessToken))
	return hex.EncodeToString(mac.Sum(nil))
}
