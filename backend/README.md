# Magic Backend

Go + Gin + PostgreSQL (GORM), đăng nhập qua Zalo Mini App.

## Chạy local

```bash
cp .env.example .env      # điền JWT_SECRET, ZALO_APP_SECRET
make db-up                # khởi động Postgres bằng Docker
make run                  # http://localhost:8080
make test
```

## Cấu trúc (theo tính năng)

```
cmd/api/                 entrypoint, graceful shutdown
internal/
  modules/               mỗi tính năng = 1 package tự chứa
    user/                model, repository, handler, module
    auth/                service, handler, module (đăng nhập Zalo)
    health/              /health
  pkg/                   thư viện dùng chung, không chứa nghiệp vụ
    token/               tạo/kiểm tra JWT
    zalo/                Zalo Graph API client
  middleware/            RequireAuth, UserID(c)
  config/                biến môi trường
  database/              kết nối Postgres
  server/                gom các module, CORS, AutoMigrate
```

### Thêm tính năng mới (vd: `order`)

1. Tạo `internal/modules/order/` gồm `model.go`, `repository.go`, `service.go`, `handler.go`, `module.go`.
2. `module.go` cài interface `server.Module`:
   ```go
   func (m *Module) Models() []any { return []any{&Order{}} }
   func (m *Module) RegisterRoutes(public, protected *gin.RouterGroup) {
       protected.GET("/orders", m.handler.List)
   }
   ```
3. Thêm `order.NewModule(db)` vào danh sách `modules` trong `internal/server/router.go`.
   Bảng sẽ tự được tạo khi khởi động.

Module có thể dùng lại module khác qua field export (vd: `auth` dùng `userMod.Repo`).

## API

| Method | Path               | Auth | Mô tả |
|--------|--------------------|------|-------|
| GET    | `/health`          | –    | Kiểm tra server + DB |
| POST   | `/api/v1/auth/zalo`| –    | `{"access_token": "..."}` → `{"token", "user"}` |
| GET    | `/api/v1/me`       | JWT  | Thông tin người dùng hiện tại |

## Luồng đăng nhập Zalo

1. Mini app gọi `getAccessToken()` từ `zmp-sdk`.
2. Gửi token đó lên `POST /api/v1/auth/zalo`.
3. Backend gọi `graph.zalo.me/v2.0/me` (kèm `appsecret_proof`) để xác thực, lưu user, trả về JWT.
4. Các request sau gửi header `Authorization: Bearer <jwt>`.
