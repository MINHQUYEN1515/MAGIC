import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const int = (v, d) => (Number.isFinite(Number.parseInt(v, 10)) ? Number.parseInt(v, 10) : d);

export const config = {
  telegramToken: process.env.TELEGRAM_BOT_TOKEN || '',
  telegramChatId: process.env.TELEGRAM_CHAT_ID || '',
  cron: process.env.CRON_SCHEDULE || '0 */6 * * *',
  maxPerSource: int(process.env.MAX_PER_SOURCE, 8),
  maxFileBytes: Math.min(int(process.env.MAX_FILE_MB, 45), 50) * 1024 * 1024,
  maxImages: Math.min(int(process.env.MAX_IMAGES, 6), 10),
  requestDelayMs: int(process.env.REQUEST_DELAY_MS, 1500),
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  contact: process.env.BOT_CONTACT || '',
  dataDir: path.join(root, 'data'),
  fontsDir: path.join(root, 'fonts'),
};
