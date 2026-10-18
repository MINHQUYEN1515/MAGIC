import { getJSON, sleep } from '../http.js';
import { config } from '../config.js';
import { commonsQueries } from '../queries.js';
import { IMAGE_PROPS, toImage } from './wikimedia.js';

const api = (params) =>
  'https://commons.wikimedia.org/w/api.php?' +
  new URLSearchParams({ action: 'query', format: 'json', formatversion: '2', origin: '*', ...params });

/** Sinh ra ảnh và sách PDF trên Wikimedia Commons. Mỗi file là một tài liệu. */
export async function* fetchCommons(log) {
  for (const q of commonsQueries) {
    let res;
    try {
      res = await getJSON(api({ generator: 'search', gsrsearch: q, gsrnamespace: '6', gsrlimit: '10', ...IMAGE_PROPS }));
    } catch (err) {
      log.warn(`tìm "${q}" lỗi: ${err.message}`);
      continue;
    }
    await sleep(config.requestDelayMs);
    log.info(`tìm "${q}" → ${res.query?.pages?.length ?? 0} file`);

    for (const page of res.query?.pages ?? []) {
      const image = toImage(page);
      if (!image) {
        log.debug(`bỏ file (không phải ảnh/PDF dùng được): ${page.title}`);
        continue;
      }
      const isPdf = image.mime === 'application/pdf';

      yield {
        id: `commons:${page.pageid}`,
        source: 'commons',
        lang: '',
        query: q,
        title: page.title.replace(/^File:/, '').replace(/\.[a-z0-9]+$/i, ''),
        url: image.source,
        load: async () => ({
          text: `${page.title}\n${image.description}`,
          // Với PDF, thumbnail là ảnh trang đầu.
          images: [{ ...image, description: isPdf ? `Trang đầu: ${image.description}` : image.description }],
          file: isPdf ? image.original : null,
        }),
      };
    }
  }
}
