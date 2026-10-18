// Log có thời gian, cấp độ và phạm vi. Đặt LOG_LEVEL=debug để xem chi tiết từng request.

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };
const min = LEVELS[(process.env.LOG_LEVEL || 'info').toLowerCase()] ?? LEVELS.info;

const color = process.stdout.isTTY && !process.env.NO_COLOR;
const paint = (code, s) => (color ? `\x1b[${code}m${s}\x1b[0m` : s);
const LABEL = {
  debug: paint('90', 'DEBUG'),
  info: paint('36', 'INFO '),
  warn: paint('33', 'WARN '),
  error: paint('31', 'ERROR'),
};

// "2026-10-18 16:40:12" theo múi giờ máy (Docker đặt TZ=Asia/Ho_Chi_Minh).
const now = () => new Date().toLocaleString('sv-SE');

function write(level, scope, args) {
  if (LEVELS[level] < min) return;
  const line = `${paint('90', now())} ${LABEL[level]} ${paint('35', `[${scope}]`)}`;
  (level === 'error' || level === 'warn' ? console.error : console.log)(line, ...args);
}

export function createLogger(scope) {
  return {
    debug: (...a) => write('debug', scope, a),
    info: (...a) => write('info', scope, a),
    warn: (...a) => write('warn', scope, a),
    error: (...a) => write('error', scope, a),
    child: (sub) => createLogger(`${scope}:${sub}`),
  };
}

/** Thời gian đã trôi qua, dạng "1.2s" / "3m05s". */
export function elapsed(start) {
  const ms = Date.now() - start;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}m${String(s % 60).padStart(2, '0')}s`;
}

export const formatBytes = (n) =>
  n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)}MB` : `${Math.max(1, Math.round(n / 1024))}KB`;
