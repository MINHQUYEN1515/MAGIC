package zalo

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestGetProfile(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Header.Get("access_token") != "good" {
			w.Write([]byte(`{"error":-501,"message":"Invalid access token"}`))
			return
		}
		if r.Header.Get("appsecret_proof") != appSecretProof("good", "secret") {
			t.Errorf("appsecret_proof sai")
		}
		w.Write([]byte(`{"id":"123","name":"Quyen","picture":{"data":{"url":"https://a/b.jpg"}}}`))
	}))
	defer srv.Close()

	c := NewClient("secret").WithGraphURL(srv.URL)

	p, err := c.GetProfile(context.Background(), "good")
	if err != nil {
		t.Fatalf("lỗi không mong đợi: %v", err)
	}
	if p.ID != "123" || p.Name != "Quyen" || p.Picture.Data.URL != "https://a/b.jpg" {
		t.Fatalf("profile sai: %+v", p)
	}

	if _, err := c.GetProfile(context.Background(), "bad"); !errors.Is(err, ErrInvalidToken) {
		t.Fatalf("mong đợi ErrInvalidToken, nhận %v", err)
	}
}
