import { config } from './config.js';
import { createLogger } from './logger.js';

const log = createLogger('http');

// Wikimedia yêu cầu User-Agent có thông tin liên hệ; thiếu thì dễ bị chặn (429/403).
export const userAgent = `MagicDocsBot/1.0 (${config.contact || 'folklore research bot'})`;

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** fetch có thử lại khi gặp 429/5xx/lỗi mạng, tôn trọng Retry-After. */
async function fetchWithRetry(url, { retries = 4, timeoutMs = 30_000, headers = {} } = {}) {
  for (let attempt = 0; ; attempt++) {
    let retryAfterMs = 0;
    try {
      log.debug(`GET ${url.slice(0, 140)}`);
      const res = await fetch(url, {
        headers: { 'User-Agent': userAgent, ...headers },
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (res.status === 429 || res.status >= 500) {
        retryAfterMs = Number(res.headers.get('retry-after')) * 1000 || 0;
        await res.body?.cancel();
        throw new Error(`HTTP ${res.status}`);
      }
      if (!res.ok) throw Object.assign(new Error(`HTTP ${res.status} ${url}`), { fatal: true });
      return res;
    } catch (err) {
      if (err.fatal || attempt >= retries) throw err;
      const wait = Math.max(retryAfterMs, 5000 * 2 ** attempt); // 5s, 10s, 20s, 40s
      log.warn(`${err.message} → thử lại lần ${attempt + 1}/${retries} sau ${Math.round(wait / 1000)}s: ${new URL(url).host}${new URL(url).pathname.slice(0, 60)}`);
      await sleep(wait);
    }
  }
}

export async function getJSON(url, opts) {
  const res = await fetchWithRetry(url, { ...opts, headers: { Accept: 'application/json' } });
  return res.json();
}

/** Tải file về Buffer, dừng nếu vượt maxBytes. Trả về { data, contentType }. */
export async function download(url, maxBytes) {
  const res = await fetchWithRetry(url, { timeoutMs: 5 * 60_000 });

  const len = Number(res.headers.get('content-length') || 0);
  if (len > maxBytes) {
    await res.body?.cancel();
    throw new Error(`file quá lớn (${len} bytes)`);
  }

  const chunks = [];
  let total = 0;
  for await (const chunk of res.body) {
    total += chunk.length;
    if (total > maxBytes) throw new Error('file quá lớn');
    chunks.push(chunk);
  }
  const contentType = (res.headers.get('content-type') || '').split(';')[0].trim();
  return { data: Buffer.concat(chunks), contentType };
}
