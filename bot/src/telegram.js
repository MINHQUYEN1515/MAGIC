import { Bot, InputFile, InputMediaBuilder } from 'grammy';
import { REGIONS, TYPES } from './classify/categories.js';
import { sleep } from './http.js';
import { createLogger } from './logger.js';

const log = createLogger('telegram');

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const hashtag = (s) => '#' + s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').replace(/[^\p{L}\p{N}]/gu, '');

/** Caption HTML cho một tài liệu (Telegram giới hạn caption 1024 ký tự). */
export function buildCaption(doc, cls, { maxLen = 1024 } = {}) {
  const head = [
    `<b>${esc(doc.title)}</b>`,
    `🌏 ${esc(REGIONS[cls.region].label)}  •  🔮 ${esc(TYPES[cls.type].label)}`,
    cls.ethnic_groups.length ? `👥 ${esc(cls.ethnic_groups.join(', '))}` : null,
  ];
  const tail = [
    `🔗 ${esc(doc.url)}`,
    [hashtag(REGIONS[cls.region].tag), hashtag(TYPES[cls.type].tag), ...cls.ethnic_groups.map(hashtag), `#${doc.source}`].join(' '),
  ];

  const fixed = [...head, ...tail].filter(Boolean).join('\n').length + 2;
  let summary = cls.summary_vi || cls.chuc_nang || excerpt(doc.text);
  const room = maxLen - fixed - 5;
  if (summary.length > room) summary = summary.slice(0, Math.max(0, room - 1)) + '…';

  return [...head, summary ? `\n${esc(summary)}\n` : null, ...tail].filter(Boolean).join('\n');
}

function excerpt(text = '') {
  return text.replace(/\s+/g, ' ').trim().slice(0, 400);
}

export function createTelegram(token, chatId) {
  const bot = new Bot(token);
  const html = { parse_mode: 'HTML' };

  return {
    bot,
    /**
     * Gửi một tài liệu: album ảnh (caption ở ảnh đầu) → PDF giải thích → PDF gốc (nếu có).
     * @param saved { images: string[], explanationPdf: string, sourcePdf: string | null }
     */
    async sendItem(doc, cls, saved) {
      const caption = buildCaption(doc, cls);

      log.debug(`  gửi ${saved.images.length} ảnh, giai-thich.pdf${saved.sourcePdf ? ', PDF gốc' : ''} → chat ${chatId}`);
      if (saved.images.length === 1) {
        await bot.api.sendPhoto(chatId, new InputFile(saved.images[0]), { caption, ...html });
      } else if (saved.images.length > 1) {
        await bot.api.sendMediaGroup(
          chatId,
          saved.images.map((p, i) => InputMediaBuilder.photo(new InputFile(p), i === 0 ? { caption, ...html } : {})),
        );
      }
      await sleep(1500);

      const explanationCaption = saved.images.length
        ? `📄 <b>Giải thích:</b> loại bùa, chức năng, mô tả hình ảnh, cách phòng tránh — ${esc(doc.title)}`.slice(0, 1024)
        : caption;
      await bot.api.sendDocument(chatId, new InputFile(saved.explanationPdf), { caption: explanationCaption, ...html });

      if (saved.sourcePdf) {
        await sleep(1500);
        await bot.api.sendDocument(chatId, new InputFile(saved.sourcePdf), {
          caption: `📚 <b>Tài liệu gốc:</b> ${esc(doc.title)}`.slice(0, 1024),
          ...html,
        });
      }
      await sleep(3000); // tránh giới hạn ~20 tin/phút với nhóm
    },
  };
}
