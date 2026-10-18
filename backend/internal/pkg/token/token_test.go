package token

import (
	"testing"
	"time"
)

func TestJWTRoundTrip(t *testing.T) {
	m := NewManager("secret", time.Hour)
	tok, err := m.Generate(42)
	if err != nil {
		t.Fatal(err)
	}
	id, err := m.Parse(tok)
	if err != nil || id != 42 {
		t.Fatalf("mong đợi 42, nhận %d (%v)", id, err)
	}
}

func TestJWTRejects(t *testing.T) {
	m := NewManager("secret", time.Hour)
	tok, _ := m.Generate(1)

	if _, err := NewManager("other", time.Hour).Parse(tok); err == nil {
		t.Fatal("phải từ chối token ký bằng secret khác")
	}
	expired, _ := NewManager("secret", -time.Minute).Generate(1)
	if _, err := m.Parse(expired); err == nil {
		t.Fatal("phải từ chối token hết hạn")
	}
	if _, err := m.Parse("rác"); err == nil {
		t.Fatal("phải từ chối token sai định dạng")
	}
}
