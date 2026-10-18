// Chế độ bot: nhận lệnh Telegram + cào tự động theo lịch cron.
import cron from 'node-cron';
import { config } from './config.js';
import { crawl } from './crawler.js';
import { Store } from './store.js';
import { classifierName } from './classify/index.js';
import { REGIONS, TYPES } from './classify/categories.js';
import { createTelegram } from './telegram.js';
import { createLogger } from './logger.js';

const log = createLogger('bot');

if (!config.telegramToken) {
  log.error('Thiếu TELEGRAM_BOT_TOKEN trong .env');
  process.exit(1);
}

const telegram = createTelegram(config.telegramToken, config.telegramChatId);
const { bot } = telegram;

// Ghi lại mọi lệnh nhận được.
bot.use((ctx, next) => {
  if (ctx.message?.text?.startsWith('/')) {
    log.info(`Lệnh ${ctx.message.text.split(/\s/)[0]} từ chat ${ctx.chat.id} (${ctx.from?.username ?? ctx.from?.first_name ?? '?'})`);
  }
  return next();
});

let running = false;
async function runCrawl(trigger) {
  if (!config.telegramChatId) return 'Chưa cấu hình TELEGRAM_CHAT_ID';
  if (running) return 'Đang cào rồi, đợi lượt hiện tại xong nhé.';
  running = true;
  log.info(`Kích hoạt cào: ${trigger}`);
  try {
    const r = await crawl({ telegram });
    return `✅ Xong: ${r.sent} tài liệu mới, ${r.skipped} không liên quan, ${r.errors} lỗi.`;
  } catch (err) {
    log.error(`Lượt cào thất bại: ${err.message}`);
    log.debug(err.stack);
    return `❌ Lỗi: ${err.message}`;
  } finally {
    running = false;
  }
}

// Chỉ chat đã cấu hình mới được ra lệnh cào.
const isOwner = (ctx) => String(ctx.chat?.id) === String(config.telegramChatId);

bot.command('start', (ctx) =>
  ctx.reply(
    `Chat ID của bạn: <code>${ctx.chat.id}</code>\n` +
      'Đặt giá trị này vào TELEGRAM_CHAT_ID trong .env rồi khởi động lại bot.\n\n' +
      '/crawl — cào ngay\n/stats — thống kê',
    { parse_mode: 'HTML' },
  ),
);

bot.command('crawl', async (ctx) => {
  if (!isOwner(ctx)) return ctx.reply('Bạn không có quyền dùng lệnh này.');
  await ctx.reply('⏳ Bắt đầu cào...');
  await ctx.reply(await runCrawl('lệnh /crawl'));
});

bot.command('stats', async (ctx) => {
  if (!isOwner(ctx)) return ctx.reply('Bạn không có quyền dùng lệnh này.');
  const s = (await Store.load()).stats();
  const fmt = (obj, table) =>
    Object.entries(obj).map(([k, n]) => `  • ${table[k]?.label ?? k}: ${n}`).join('\n') || '  (chưa có)';
  await ctx.reply(
    `📊 Đã xử lý ${s.total}, đã gửi ${s.sent}\n\nTheo khu vực:\n${fmt(s.byRegion, REGIONS)}\n\nTheo loại:\n${fmt(s.byType, TYPES)}`,
  );
});

bot.catch((err) => log.error(`Lỗi xử lý tin nhắn: ${err.message}`));

cron.schedule(config.cron, () => runCrawl('cron'));

log.info(`Bot đang chạy · lịch cào "${config.cron}" · phân loại bằng ${classifierName} · chat nhận: ${config.telegramChatId || '(chưa đặt TELEGRAM_CHAT_ID)'}`);
await bot.start();
