// Phân loại bằng TinyFish Web Agent: agent tự mở trang tài liệu, đọc nội dung + xem ảnh trên trang
// rồi trả JSON theo output_schema. Mỗi lượt chạy trừ tiền trong ví TinyFish.
import { REGIONS, TYPES } from './categories.js';
import { SCHEMA, SYSTEM } from './openai.js';

const API_URL = 'https://agent.tinyfish.ai/v1/automation/run';
// Đoạn văn bản gửi kèm goal để agent không phải cuộn đọc hết trang dài.
const MAX_CHARS = 3_000;
// Chỉ cần đọc trang và trả lời, giới hạn số bước để không tốn ví khi agent đi lạc.
const MAX_STEPS = 15;
const TIMEOUT_MS = 5 * 60_000;

// TinyFish không hỗ trợ additionalProperties trong output_schema.
const { additionalProperties, ...OUTPUT_SCHEMA } = SCHEMA;

/** Lỗi mang status/code giống SDK OpenAI để classify/index.js xử lý thử lại/tạm dừng chung. */
class TinyFishError extends Error {
  constructor(message, { status, code, headers } = {}) {
    super(message);
    this.name = 'TinyFishError';
    Object.assign(this, { status, code, headers });
  }
}

export function createTinyFishClassifier({ apiKey }) {
  /** @param images [{ url, description }] ảnh đã tải, cùng thứ tự với doc.images */
  return async function classifyWithTinyFish({ title, source, url, text }, images = []) {
    const imageList = images.map((img, i) => `${i + 1}. ${img.url}${img.description ? ` — ${img.description}` : ''}`).join('\n');
    const goal = [
      SYSTEM,
      `Hãy đọc trang này (tiêu đề "${title}", nguồn ${source}) và xem các ảnh trên trang, rồi trả kết quả theo schema. Không đăng nhập, không bấm sang trang khác.`,
      images.length ? `Có ${images.length} ảnh cần mô tả trong hinh_anh, theo đúng thứ tự:\n${imageList}` : 'Không có ảnh: hinh_anh để rỗng.',
      text ? `Trích nội dung:\n${text.slice(0, MAX_CHARS)}` : null,
    ].filter(Boolean).join('\n\n');

    let res;
    try {
      res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'X-API-Key': apiKey, 'content-type': 'application/json' },
        body: JSON.stringify({
          url,
          goal,
          output_schema: OUTPUT_SCHEMA,
          browser_profile: 'lite',
          agent_config: { max_steps: MAX_STEPS },
        }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch (err) {
      // Hết giờ thì không thử lại: lượt /run không huỷ được, gửi lại có thể bị trừ tiền hai lần.
      if (err.name === 'TimeoutError') throw new TinyFishError(`TinyFish quá ${TIMEOUT_MS / 60_000} phút không trả lời`);
      // Mất mạng: đánh dấu để classify/index.js thử lại.
      throw new TinyFishError(`TinyFish không kết nối được: ${err.message}`, { status: 408 });
    }

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = body.error?.message ?? body.message ?? body.detail ?? res.statusText;
      throw new TinyFishError(`${res.status} ${typeof msg === 'string' ? msg : JSON.stringify(msg)}`, {
        status: res.status,
        code: res.status === 402 ? 'insufficient_quota' : body.error?.code,
        headers: res.headers,
      });
    }
    if (body.status !== 'COMPLETED' || !body.result) {
      throw new TinyFishError(`TinyFish chạy thất bại (${body.status}): ${JSON.stringify(body.error ?? 'không có kết quả').slice(0, 200)}`);
    }

    const out = typeof body.result === 'string' ? JSON.parse(body.result) : body.result;
    if (!(out.region in REGIONS) || !(out.type in TYPES)) throw new Error('TinyFish trả về nhãn không hợp lệ');
    return {
      ...out,
      ethnic_groups: out.ethnic_groups ?? [],
      hinh_anh: out.hinh_anh ?? [],
      cach_phong_tranh: out.cach_phong_tranh ?? [],
      method: 'tinyfish',
      run_id: body.run_id,
    };
  };
}
