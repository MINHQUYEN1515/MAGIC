# miniapp — React + TypeScript + TanStack Query (clean architecture)

```bash
cp .env.example .env   # VITE_API_BASE_URL trỏ tới backend Go
yarn                   # cài dependency
yarn dev               # http://localhost:3000
yarn test              # vitest
yarn lint && yarn typecheck
yarn build
```

## Kiến trúc

```
src/
├── app/                      # Composition root: ghép mọi thứ lại
│   ├── di/container.ts       # interface (domain) ↔ implementation (infrastructure)
│   ├── providers/            # QueryClient, AppProviders
│   └── router.tsx
├── core/                     # Hạ tầng dùng chung, không biết gì về nghiệp vụ
│   ├── config/env.ts
│   ├── http/                 # HttpClient (interface) + FetchHttpClient, HttpError
│   └── storage/
├── features/<tên>/
│   ├── domain/               # Entity + interface repository. TS thuần, không React
│   ├── application/          # Use case (1 class = 1 hành động). TS thuần, không React
│   ├── infrastructure/       # Gọi API, DTO ↔ entity, lưu trữ
│   └── presentation/         # Hook TanStack Query, page, component
├── shared/ui/                # Component UI không có nghiệp vụ
└── test/                     # Setup + helper render với container giả
```

Chiều phụ thuộc chỉ trỏ vào trong: `presentation → application → domain ← infrastructure`.
ESLint chặn `domain/` và `application/` import React, TanStack Query, `infrastructure/`, `presentation/` hay `app/`.

Luồng một request: component → hook (`useQuery`/`useMutation`) → `useDeps()` lấy use case → use case gọi interface repository → `container.ts` đã gắn implementation gọi API.

## Thêm feature mới

1. `domain/`: entity + `XxxRepository` interface.
2. `application/`: use case nhận repository qua constructor.
3. `infrastructure/`: `XxxApiRepository implements XxxRepository`, DTO + hàm map.
4. Đăng ký trong `app/di/container.ts` (thêm vào type `Container`).
5. `presentation/`: `xxxKeys.ts` (query key), hook gọi `useDeps().xxx.execute()`, page; thêm route trong `app/router.tsx`.

Test use case bằng repository giả (không cần React), test UI bằng `renderWithProviders(ui, { useCase: fake })`.

## Đăng nhập

`POST /auth/zalo {"access_token"}` → lưu JWT vào localStorage → `FetchHttpClient` tự gắn `Authorization: Bearer`.
Gặp 401 thì xoá token, xoá cache query và chuyển về `/login`. Trên trình duyệt thì dán access token Zalo thủ công;
khi chạy trong Zalo Mini App thì lấy token bằng `getAccessToken()` của zmp-sdk.
