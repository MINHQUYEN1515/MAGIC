import { config } from '../config.js';
import { classifyByKeywords } from './keywords.js';
import { EXPLANATIONS, TYPES } from './categories.js';
import { createOpenAIClassifier } from './openai.js';
import { createTinyFishClassifier } from './tinyfish.js';
import { createLogger, elapsed } from '../logger.js';

const log = createLogger('classify');

// Ưu tiên TinyFish nếu có key, sau đó tới OpenAI, không có key nào thì phân loại bằng từ khoá.
const provider = config.tinyfishApiKey
  ? { name: 'TinyFish', keyVar: 'TINYFISH_API_KEY', billing: 'agent.tinyfish.ai', create: () => createTinyFishClassifier({ apiKey: config.tinyfishApiKey }) }
  : config.openaiApiKey
    ? { name: `OpenAI (${config.openaiModel})`, keyVar: 'OPENAI_API_KEY', billing: 'platform.openai.com', create: () => createOpenAIClassifier({ apiKey: config.openaiApiKey, model: config.openaiModel }) }
    : null;
let ai = provider?.create() ?? null;
const aiName = provider?.name.split(' ')[0];

export const classifierName = provider?.name ?? 'từ khoá';

// Key sai, bị thu hồi hoặc không được dùng ở khu vực này: gọi tiếp cũng vô ích.
const isAuthError = (err) => err.status === 401 || err.status === 403;

// Hết credit / vượt hạn mức thanh toán (TinyFish trả 402 khi ví không đủ tiền): tạm dừng gọi AI một thời gian.
// OpenAI dùng nhiều mã khác nhau (vd "You have no credits remaining" không có code insufficient_quota) nên xét cả nội dung.
const QUOTA_CODES = ['insufficient_quota', 'billing_not_active', 'billing_hard_limit_reached'];
const isQuotaExhausted = (err) =>
  err.status === 402 || (err.status === 429 && (QUOTA_CODES.includes(err.code) || /credit|quota|billing/i.test(err.message ?? '')));
const QUOTA_PAUSE_MS = 60 * 60_000;
let pausedUntil = 0;

// Lỗi tạm thời (giới hạn tốc độ, quá tải, mất mạng): đợi rồi thử lại.
const isTransient = (err) =>
  !isQuotaExhausted(err) &&
  ([408, 409, 429, 500, 502, 503, 504].includes(err.status) || err.name === 'APIConnectionError' || err.name === 'APIConnectionTimeoutError');

const shortMessage = (err) => String(err.message ?? err).replace(/\s+/g, ' ').slice(0, 200);

async function withRetry(fn, retries = 4) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (!isTransient(err) || attempt >= retries) throw err;
      const retryAfter = Number(err.headers?.get?.('retry-after')) * 1000 || 0;
      const wait = Math.max(retryAfter, 5000 * 2 ** attempt); // 5s, 10s, 20s, 40s
      log.warn(`  ${aiName} tạm lỗi (${shortMessage(err).slice(0, 80)}) → thử lại lần ${attempt + 1}/${retries} sau ${Math.round(wait / 1000)}s`);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
}

/** Bổ sung phần giải thích mặc định theo loại cho kết quả phân loại từ khoá. */
function withDefaultExplanation(cls, doc, images) {
  const ex = EXPLANATIONS[cls.type];
  return {
    ...cls,
    ten_bua: TYPES[cls.type].label,
    summary_vi: null,
    nguon_goc: '',
    chuc_nang: ex.chuc_nang,
    hinh_anh: images.map((_, i) => doc.images?.[i]?.description ?? ''),
    cach_phong_tranh: ex.phong_tranh,
  };
}

/**
 * Phân loại + giải thích. Dùng TinyFish/OpenAI (có xem ảnh) nếu có key, lỗi thì quay về từ khoá.
 * @param images [{ data: Buffer, mimeType }] ảnh đã tải, cùng thứ tự với doc.images
 */
export async function classify(doc, images = []) {
  const kw = classifyByKeywords(doc);
  const byKeywords = (fallback = false) => ({ ...withDefaultExplanation(kw, doc, images), fallback });
  if (!ai) return byKeywords();

  // Không có lấy một từ khoá nào → chắc chắn nhiễu, khỏi tốn lượt gọi API.
  if (kw.hits === 0) {
    log.info(`  không có từ khoá liên quan → bỏ, không gọi ${aiName}`);
    return byKeywords();
  }
  if (Date.now() < pausedUntil) return byKeywords(true);

  const start = Date.now();
  try {
    const cls = await withRetry(() => ai(doc, images));
    log.info(`  ${aiName} trả lời (${elapsed(start)}, ${images.length} ảnh): ${cls.relevant ? cls.ten_bua || cls.type : 'không liên quan'}`);
    return cls;
  } catch (err) {
    if (isAuthError(err)) {
      ai = null;
      log.error(`${provider.keyVar} không dùng được (${shortMessage(err)}) → chuyển sang phân loại từ khoá`);
    } else if (isQuotaExhausted(err)) {
      pausedUntil = Date.now() + QUOTA_PAUSE_MS;
      log.error(`${aiName} hết credit/hạn mức (kiểm tra billing tại ${provider.billing}) → tạm dùng phân loại từ khoá tới ${new Date(pausedUntil).toLocaleString('sv-SE')}`);
    } else {
      log.warn(`  ${aiName} lỗi (${elapsed(start)}): ${shortMessage(err)} → dùng từ khoá`);
    }
    return byKeywords(true);
  }
}
