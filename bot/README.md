# Magic Bot

Bot Node.js cào tài liệu về bùa ngải (Trung Quốc, Việt Nam, dân tộc thiểu số), phân loại rồi gửi về Telegram.

## Cài đặt

```bash
npm install
cp .env.example .env
```

1. Tạo bot với [@BotFather](https://t.me/BotFather), dán token vào `TELEGRAM_BOT_TOKEN`.
2. `npm start`, nhắn `/start` cho bot (hoặc thêm bot vào nhóm rồi gõ `/start`) → bot trả về chat ID.
3. Dán chat ID vào `TELEGRAM_CHAT_ID`, khởi động lại.
4. (Tuỳ chọn) điền `TINYFISH_API_KEY` để agent TinyFish mở trang tài liệu, phân loại và viết giải thích
   (mỗi lượt trừ tiền ví TinyFish; có key này thì bỏ qua OpenAI). Hoặc điền `OPENAI_API_KEY` (lấy tại [platform.openai.com](https://platform.openai.com/api-keys)) để phân loại
   bằng OpenAI (`OPENAI_MODEL`, mặc định `gpt-4o-mini`): chính xác hơn, lọc nhiễu tốt hơn, xem được ảnh và viết
   giải thích tiếng Việt. Không có key thì bot phân loại bằng từ khoá.

## Chạy

| Lệnh | Việc |
|---|---|
| `npm start` | Chạy bot: nhận lệnh Telegram + tự cào theo `CRON_SCHEDULE` |
| `npm run crawl` | Cào một lần và gửi Telegram |
| `npm run crawl:dry` | Cào một lần, chỉ lưu file local, không gửi, không ghi nhớ |
| `npm test` | Test bộ phân loại |

Lệnh trong Telegram (chỉ chat `TELEGRAM_CHAT_ID` được dùng): `/start`, `/crawl`, `/stop`, `/resume`, `/stats`.
`/stop` ngừng thu thập: dừng lượt đang chạy (sau tài liệu hiện tại) và tắt cào tự động, kể cả sau khi khởi động lại
(lưu ở `data/bot-state.json`). `/resume` bật lại; `/crawl` vẫn cào thủ công được khi đang tạm dừng.

Nếu có biến `PORT` (Vercel/Render/Railway tự đặt), bot mở `GET /health` ở cổng đó để nền tảng biết bot đã chạy.

Log in ra màn hình (hoặc `docker compose logs -f`) theo từng bước: tìm kiếm, tải ảnh/PDF, phân loại, lưu, gửi.
Đặt `LOG_LEVEL=debug` để xem chi tiết từng request và từng ảnh, ví dụ `LOG_LEVEL=debug npm run crawl:dry`.

## Chạy bằng Docker

```bash
docker compose up -d --build        # chạy bot nền, tự khởi động lại khi máy bật
docker compose logs -f              # xem log
docker compose down                 # dừng

# Cào một lần (không cần chờ lịch cron)
docker compose run --rm bot node src/cli.js
docker compose run --rm bot node src/cli.js --dry-run
```

Cấu hình đọc từ `.env`. Thư mục `data/` được mount ra ngoài nên tài liệu và danh sách đã gửi
không mất khi build lại. Giờ cron theo `Asia/Ho_Chi_Minh`.

## Nguồn

Chỉ nhận tài liệu **có ảnh hoặc PDF**; không lưu văn bản `.txt`.

- **Wikimedia Commons:** ảnh lá bùa, vật phẩm, nghi lễ và sách PDF thuộc phạm vi công cộng.
- **Wikipedia** tiếng Việt, Trung, Anh: ảnh minh hoạ trong bài (nội dung bài chỉ dùng để phân loại).
- **Internet Archive:** sách PDF (nếu ≤ `MAX_FILE_MB` và không bị giới hạn bản quyền) + ảnh bìa.
  Bỏ qua kho truyện mạng và báo chí.

Từ khoá tìm kiếm nằm ở `src/queries.js`.

## Phân loại & giải thích

- **Khu vực:** Trung Quốc · Việt Nam · Dân tộc thiểu số · Khác
- **Loại:** Bùa yêu · Bùa hộ mệnh · Cổ trùng · Ngải · Phù chú/Phù lục · Thư ếm/Tà thuật · Nghi lễ/Shaman · Khác
- **Dân tộc:** H'Mông/Miêu, Thái, Mường, Khmer, Chăm, Tày/Nùng, Dao, Choang, Di, Tây Nguyên

Mỗi tài liệu có một file `giai-thich.pdf` gồm: loại bùa, nguồn gốc, chức năng (theo tín ngưỡng dân gian),
từng hình ảnh kèm mô tả + tác giả/giấy phép, và cách phòng tránh.
Có `OPENAI_API_KEY` thì OpenAI xem ảnh và viết giải thích riêng cho từng tài liệu; không có thì dùng
nội dung mặc định theo loại trong `src/classify/categories.js` (`EXPLANATIONS`).

## Dữ liệu

```
data/docs/<KhuVuc>/<Loai>/<ten-tai-lieu>/
  anh-1.jpg, anh-2.png ...   ảnh gốc (tối đa MAX_IMAGES)
  <ten-sach>.pdf             sách gốc (nếu có)
  giai-thich.pdf             giải thích
data/seen.json               tài liệu đã xử lý (xoá để gửi lại từ đầu)
```

Telegram nhận: album ảnh (caption có nhãn + hashtag) → `giai-thich.pdf` → PDF gốc.

Font `fonts/NotoSansCJKsc-*.otf` (SIL Open Font License) dùng để PDF hiển thị đúng chữ Việt và chữ Hán.

## Cấu trúc

```
src/
  index.js           chế độ bot (lệnh + cron)
  cli.js             cào một lần
  crawler.js         cào → phân loại → lưu → gửi
  sources/           commons.js, wikipedia.js, archive.js, wikimedia.js
  classify/          categories.js (+ giải thích mặc định), keywords.js, openai.js, tinyfish.js
  pdf.js             tạo giai-thich.pdf
  telegram.js        định dạng caption, gửi album ảnh + PDF
  store.js           chống gửi trùng
  http.js            fetch có User-Agent, retry, giới hạn kích thước
```
