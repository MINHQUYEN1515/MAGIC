import { getJSON, sleep } from '../http.js';
import { config } from '../config.js';
import { wikipediaQueries } from '../queries.js';
import { IMAGE_PROPS, toImage } from './wikimedia.js';

// Trang giải trí trùng tên ("Bùa yêu (bài hát)", "X (phim)"...) không phải tài liệu.
const ENTERTAINMENT = /\((bài hát|phim|album|đĩa đơn|tiểu thuyết|truyện|nhân vật|chương trình|song|film|novel|album|character|TV series|電影|电影|歌曲|小说|小說|电视剧|電視劇)/i;

const api = (lang, params) =>
  `https://${lang}.wikipedia.org/w/api.php?` +
  new URLSearchParams({ format: 'json', formatversion: '2', origin: '*', ...params });

/** Sinh ra các bài Wikipedia khớp từ khoá. Nội dung chỉ dùng để phân loại, không lưu; tài liệu là ảnh trong bài. */
export async function* fetchWikipedia(log) {
  for (const [lang, q] of interleave(wikipediaQueries)) {
    {
      let search;
      try {
        search = await getJSON(api(lang, { action: 'query', list: 'search', srsearch: q, srlimit: '8' }));
      } catch (err) {
        log.warn(`[${lang}] tìm "${q}" lỗi: ${err.message}`);
        continue;
      }
      await sleep(config.requestDelayMs);
      log.info(`[${lang}] tìm "${q}" → ${search.query?.search?.length ?? 0} bài`);

      for (const hit of search.query?.search ?? []) {
        if (ENTERTAINMENT.test(hit.title)) {
          log.debug(`[${lang}] bỏ trang giải trí: ${hit.title}`);
          continue;
        }
        const id = `wikipedia:${lang}:${hit.pageid}`;
        yield {
          id,
          source: 'wikipedia',
          lang,
          query: q,
          title: hit.title,
          url: `https://${lang}.wikipedia.org/?curid=${hit.pageid}`,
          // Chỉ tải khi cần (bài chưa xử lý) để đỡ request thừa.
          load: async () => {
            const data = await getJSON(
              api(lang, {
                action: 'query', prop: 'extracts', explaintext: '1', pageids: String(hit.pageid),
                ...(lang === 'zh' ? { variant: 'zh-hans' } : {}),
              }),
            );
            await sleep(config.requestDelayMs);
            const imgs = await getJSON(
              api(lang, { action: 'query', generator: 'images', pageids: String(hit.pageid), gimlimit: '30', ...IMAGE_PROPS }),
            );
            await sleep(config.requestDelayMs);
            const images = (imgs.query?.pages ?? [])
              .map(toImage)
              .filter((i) => i && i.mime !== 'application/pdf')
              .slice(0, config.maxImages);
            return { text: data.query?.pages?.[0]?.extract ?? '', images, file: null };
          },
        };
      }
    }
  }
}

/** Xen kẽ từ khoá giữa các ngôn ngữ: vi[0], zh[0], en[0], vi[1]... */
function interleave(byLang) {
  const out = [];
  const langs = Object.keys(byLang);
  const max = Math.max(...langs.map((l) => byLang[l].length));
  for (let i = 0; i < max; i++) for (const l of langs) if (byLang[l][i]) out.push([l, byLang[l][i]]);
  return out;
}
