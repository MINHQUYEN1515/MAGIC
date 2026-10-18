// Chế độ bot: nhận lệnh Telegram + cào tự động theo lịch cron.
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import cron from 'node-cron';
import { GrammyError } from 'grammy';
import { config } from './config.js';
import { crawl } from './crawler.js';
import { Store } from './store.js';
import { classifierName } from './classify/index.js';
import { REGIONS, TYPES } from './classify/categories.js';
import { createTelegram } from './telegram.js';
import { createLogger } from './logger.js';
import { sleep } from './http.js';

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

// Trạng thái tạm dừng cào tự động, lưu ra file để khởi động lại vẫn giữ.
const stateFile = path.join(config.dataDir, 'bot-state.json');
let paused = false;
try {
  paused = Boolean(JSON.parse(await fs.readFile(stateFile, 'utf8')).paused);
} catch (err) {
  if (err.code !== 'ENOENT') log.warn(`Không đọc được ${stateFile}: ${err.message}`);
}

async function setPaused(value) {
  paused = value;
  await fs.mkdir(config.dataDir, { recursive: true });
  await fs.writeFile(stateFile, JSON.stringify({ paused }, null, 2));
  log.info(paused ? 'Đã tạm dừng cào tự động' : 'Đã bật lại cào tự động');
}

let current = null; // AbortController của lượt cào đang chạy
async function runCrawl(trigger) {
  if (!config.telegramChatId) return 'Chưa cấu hình TELEGRAM_CHAT_ID';
  if (current) return 'Đang cào rồi, đợi lượt hiện tại xong nhé.';
  current = new AbortController();
  log.info(`Kích hoạt cào: ${trigger}`);
  try {
    const r = await crawl({ telegram, signal: current.signal });
    return `${r.stopped ? '⏹ Đã dừng' : '✅ Xong'}: ${r.sent} tài liệu mới, ${r.skipped} không liên quan, ${r.errors} lỗi.`;
  } catch (err) {
    log.error(`Lượt cào thất bại: ${err.message}`);
    log.debug(err.stack);
    return `❌ Lỗi: ${err.message}`;
  } finally {
    current = null;
  }
}

// Chỉ chat đã cấu hình mới được ra lệnh cào.
const isOwner = (ctx) => String(ctx.chat?.id) === String(config.telegramChatId);

bot.command('start', (ctx) =>
  ctx.reply(
    `Chat ID của bạn: <code>${ctx.chat.id}</code>\n` +
      'Đặt giá trị này vào TELEGRAM_CHAT_ID trong .env rồi khởi động lại bot.\n\n' +
      '/crawl — cào ngay\n/stop — ngừng thu thập (dừng lượt đang chạy + tắt cào tự động)\n' +
      '/resume — bật lại cào tự động\n/stats — thống kê',
    { parse_mode: 'HTML' },
  ),
);

bot.command('crawl', async (ctx) => {
  if (!isOwner(ctx)) return ctx.reply('Bạn không có quyền dùng lệnh này.');
  await ctx.reply('⏳ Bắt đầu cào...');
  await ctx.reply(await runCrawl('lệnh /crawl'));
});

bot.command('stop', async (ctx) => {
  if (!isOwner(ctx)) return ctx.reply('Bạn không có quyền dùng lệnh này.');
  if (!paused) await setPaused(true);
  if (current) {
    current.abort();
    return ctx.reply('⏹ Đang dừng — xong tài liệu hiện tại sẽ ngừng. Đã tắt cào tự động, gõ /resume để bật lại.');
  }
  await ctx.reply('⏹ Đã tắt cào tự động. Gõ /resume để bật lại (vẫn dùng được /crawl để cào thủ công).');
});

bot.command('resume', async (ctx) => {
  if (!isOwner(ctx)) return ctx.reply('Bạn không có quyền dùng lệnh này.');
  if (!paused) return ctx.reply('Cào tự động đang bật sẵn rồi.');
  await setPaused(false);
  await ctx.reply(`▶️ Đã bật lại cào tự động theo lịch "${config.cron}".`);
});

bot.command('stats', async (ctx) => {
  if (!isOwner(ctx)) return ctx.reply('Bạn không có quyền dùng lệnh này.');
  const s = (await Store.load()).stats();
  const fmt = (obj, table) =>
    Object.entries(obj).map(([k, n]) => `  • ${table[k]?.label ?? k}: ${n}`).join('\n') || '  (chưa có)';
  await ctx.reply(
    `${paused ? '⏸ Cào tự động: tạm dừng' : `▶️ Cào tự động: bật (${config.cron})`}${current ? ' · đang cào' : ''}\n` +
      `📊 Đã xử lý ${s.total}, đã gửi ${s.sent}\n\nTheo khu vực:\n${fmt(s.byRegion, REGIONS)}\n\nTheo loại:\n${fmt(s.byType, TYPES)}`,
  );
});

bot.catch((err) => log.error(`Lỗi xử lý tin nhắn: ${err.message}`));

// Chỉ instance đang giữ long polling mới cào theo lịch, để lúc deploy chồng nhau không gửi trùng.
let polling = false;
cron.schedule(config.cron, () => {
  if (!paused && polling) runCrawl('cron');
});

log.info(`Bot đang chạy · lịch cào "${config.cron}"${paused ? ' (đang tạm dừng, /resume để bật)' : ''} · phân loại bằng ${classifierName} · chat nhận: ${config.telegramChatId || '(chưa đặt TELEGRAM_CHAT_ID)'}`);
// Nền tảng deploy chuyển request vào PORT và chờ server nhận kết nối mới coi là đã chạy.
if (config.port) {
  http
    .createServer((req, res) => {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ ok: true, paused, crawling: Boolean(current) }));
    })
    .listen(config.port, '0.0.0.0', () => log.info(`HTTP health check tại cổng ${config.port}`));
}

await bot.api.setMyCommands([
  { command: 'crawl', description: 'Cào ngay' },
  { command: 'stop', description: 'Ngừng thu thập' },
  { command: 'resume', description: 'Bật lại cào tự động' },
  { command: 'stats', description: 'Thống kê' },
]).catch((err) => log.warn(`Không đặt được menu lệnh: ${err.message}`));
// Nền tảng tắt container cũ khi deploy bản mới: dừng polling gọn để bản mới nhận getUpdates ngay.
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => {
    log.info(`Nhận ${signal} → dừng bot`);
    polling = false;
    bot.stop().finally(() => process.exit(0));
  });
}

// 409: Telegram chỉ cho một tiến trình getUpdates mỗi token. Thường là bản deploy cũ chưa tắt
// hoặc đang chạy thêm `npm start` ở máy khác → đợi rồi thử lại thay vì crash.
for (let attempt = 1; ; attempt++) {
  try {
    await bot.start({
      onStart: (me) => {
        polling = true;
        log.info(`Đã kết nối Telegram: @${me.username}`);
      },
    });
    break; // bot.stop() được gọi
  } catch (err) {
    polling = false;
    if (!(err instanceof GrammyError && err.error_code === 409)) throw err;
    const wait = Math.min(60, 10 * attempt);
    log.warn(`Telegram 409: đang có bot khác chạy cùng TELEGRAM_BOT_TOKEN (bản deploy cũ hoặc máy khác) → thử lại sau ${wait}s (lần ${attempt})`);
    await sleep(wait * 1000);
  }
}
