// Chạy một lần: `npm run crawl` (gửi Telegram) hoặc `npm run crawl:dry` (chỉ lưu local).
import { config } from './config.js';
import { crawl } from './crawler.js';
import { classifierName } from './classify/index.js';
import { createTelegram } from './telegram.js';
import { createLogger } from './logger.js';

const log = createLogger('cli');

const dryRun = process.argv.includes('--dry-run');

if (!dryRun && (!config.telegramToken || !config.telegramChatId)) {
  log.error('Thiếu TELEGRAM_BOT_TOKEN hoặc TELEGRAM_CHAT_ID trong .env (hoặc chạy với --dry-run)');
  process.exit(1);
}

log.info(`Chế độ: ${dryRun ? 'dry-run (không gửi Telegram)' : 'gửi Telegram'} · phân loại bằng ${classifierName} · LOG_LEVEL=${process.env.LOG_LEVEL || 'info'}`);
const telegram = dryRun ? null : createTelegram(config.telegramToken, config.telegramChatId);
const r = await crawl({ telegram, dryRun });
log.info(`File lưu tại data/docs/`);
if (r.errors) process.exitCode = 1;
