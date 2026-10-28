# Magic Backend

Go + Gin + PostgreSQL (GORM), đăng ký/đăng nhập bằng email + mật khẩu (giữ thêm đăng nhập Zalo).

## Chạy local

```bash
cp .env.example .env      # điền JWT_SECRET, ZALO_APP_SECRET
make db-up                # khởi động Postgres bằng Docker
make run                  # http://localhost:8080
make test
```

## Cấu trúc

```
cmd/api/                 entrypoint, migrate, graceful shutdown
internal/
  di/                    container.go: nơi DUY NHẤT khởi tạo repo, service, handler, middleware
  routes/                routes tổng (routes.go) + route con của từng module (auth.go, user.go)
  modules/               mỗi tính năng = 1 package (model, repository, service, handler)
    user/
    auth/                đăng nhập Zalo
    health/              /health
  middleware/            RequireAuth, UserID(c)
  config/                biến môi trường
  database/              kết nối Postgres, Migrate (danh sách bảng)
  server/                tạo Gin, CORS, gắn routes tổng
pkg/                     thư viện dùng chung, không chứa nghiệp vụ
  token/                 tạo/kiểm tra JWT
  zalo/                  Zalo Graph API client
```

### Thêm tính năng mới (vd: `order`)

1. Tạo `internal/modules/order/` gồm `model.go`, `repository.go`, `service.go`, `handler.go`.
2. Khai báo trong `internal/di/container.go`: thêm field `OrderRepo`, `OrderHandler`... và khởi tạo chúng trong `NewContainer`.
3. Tạo `internal/routes/order.go`:
   ```go
   func orderRoutes(api *gin.RouterGroup, c *di.Container) {
       g := api.Group("/orders", c.RequireAuth)
       g.GET("", c.OrderHandler.List) // GET /api/v1/orders
   }
   ```
   rồi gọi `orderRoutes(api, c)` trong `internal/routes/routes.go`.
4. Có bảng thì thêm `&order.Order{}` vào `internal/database/migrate.go`.

## API

| Method | Path               | Auth | Mô tả |
|--------|--------------------|------|-------|
| GET    | `/health`          | –    | Kiểm tra server + DB |
| POST   | `/api/v1/auth/register` | – | `{"name", "email", "password"}` → 201 `{"token", "user"}`; 409 nếu trùng email |
| POST   | `/api/v1/auth/login`    | – | `{"email", "password"}` → `{"token", "user"}`; 401 nếu sai |
| POST   | `/api/v1/auth/zalo`| –    | `{"access_token": "..."}` → `{"token", "user"}` |
| GET    | `/api/v1/me`       | JWT  | Thông tin người dùng hiện tại |

## Đăng ký / đăng nhập email

Mật khẩu 8–72 ký tự (giới hạn của bcrypt), lưu dạng bcrypt hash (`password_hash`, không bao giờ trả ra JSON).
Email được trim + lowercase trước khi lưu/tìm. Sai email hay sai mật khẩu đều trả cùng lỗi 401.
`zalo_id` và `email` đều nullable + unique: một user có thể chỉ có một trong hai.

## Luồng đăng nhập Zalo (không còn dùng ở web/, giữ lại API)

1. Mini app gọi `getAccessToken()` từ `zmp-sdk`.
2. Gửi token đó lên `POST /api/v1/auth/zalo`.
3. Backend gọi `graph.zalo.me/v2.0/me` (kèm `appsecret_proof`) để xác thực, lưu user, trả về JWT.
4. Các request sau gửi header `Authorization: Bearer <jwt>`.
