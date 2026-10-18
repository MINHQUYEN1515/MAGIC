import { getJSON, sleep } from '../http.js';
import { config } from '../config.js';
import { archiveQueries } from '../queries.js';

const asText = (v) => (Array.isArray(v) ? v.join(' ') : v || '');

// Kho truyện mạng Trung Quốc và báo chí: rất nhiều kết quả trùng từ khoá nhưng không phải tài liệu.
const EXCLUDED_COLLECTIONS = ['cwfap-archive', 'newspapers'];
const FICTION = /小说|小說|网文|穿越|同人|novel|fiction|fanfic/i;

/** Sinh ra tài liệu dạng văn bản (sách, PDF) trên Internet Archive. */
export async function* fetchArchive(log) {
  for (const q of archiveQueries) {
    const url =
      'https://archive.org/advancedsearch.php?' +
      new URLSearchParams([
        ['q', `(${q}) AND mediatype:texts AND -collection:(${EXCLUDED_COLLECTIONS.join(' OR ')})`],
        ['fl[]', 'identifier'], ['fl[]', 'title'], ['fl[]', 'description'],
        ['fl[]', 'subject'], ['fl[]', 'language'], ['fl[]', 'year'], ['fl[]', 'collection'],
        ['rows', '10'], ['output', 'json'],
      ]);

    let res;
    try {
      res = await getJSON(url);
    } catch (err) {
      log.warn(`tìm "${q}" lỗi: ${err.message}`);
      continue;
    }
    await sleep(config.requestDelayMs);
    log.info(`tìm "${q}" → ${res.response?.docs?.length ?? 0} kết quả`);

    for (const item of res.response?.docs ?? []) {
      if (FICTION.test(asText(item.subject))) {
        log.debug(`bỏ truyện/tiểu thuyết: ${asText(item.title)}`);
        continue;
      }
      const ident = item.identifier;
      yield {
        id: `archive:${ident}`,
        source: 'archive',
        lang: asText(item.language),
        query: q,
        title: asText(item.title) || ident,
        url: `https://archive.org/details/${ident}`,
        load: async () => {
          const meta = await getJSON(`https://archive.org/metadata/${encodeURIComponent(ident)}`);
          await sleep(config.requestDelayMs);

          const text = [
            asText(item.title), asText(item.subject), asText(item.year),
            stripHtml(asText(meta.metadata?.description ?? item.description)),
          ].join('\n');

          // Sách cho mượn có bản quyền → không tải file, chỉ gửi link.
          const restricted = String(meta.metadata?.['access-restricted-item']) === 'true';
          const pdf = restricted ? null : pickPdf(meta.files ?? []);
          const rights = stripHtml(asText(meta.metadata?.rights ?? meta.metadata?.licenseurl)) || 'xem trang nguồn';
          return {
            text,
            images: [{
              url: `https://archive.org/services/img/${encodeURIComponent(ident)}`,
              description: `Ảnh bìa: ${asText(item.title) || ident}`,
              license: rights,
              artist: asText(meta.metadata?.creator) || 'không rõ',
              source: `https://archive.org/details/${ident}`,
            }],
            file: pdf && {
              name: pdf.name.split('/').pop(),
              size: Number(pdf.size || 0),
              url: `https://archive.org/download/${encodeURIComponent(ident)}/${pdf.name
                .split('/').map(encodeURIComponent).join('/')}`,
            },
          };
        },
      };
    }
  }
}

function pickPdf(files) {
  const pdfs = files.filter((f) => /\.pdf$/i.test(f.name) && f.private !== 'true');
  return pdfs.find((f) => f.source === 'original') ?? pdfs[0] ?? null;
}

function stripHtml(s) {
  return s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}
