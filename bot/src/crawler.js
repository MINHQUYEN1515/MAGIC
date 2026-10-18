import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from './config.js';
import { download, sleep } from './http.js';
import { createLogger, elapsed, formatBytes } from './logger.js';
import { Store } from './store.js';
import { classify } from './classify/index.js';
import { REGIONS, TYPES } from './classify/categories.js';
import { renderExplanationPdf } from './pdf.js';
import { fetchWikipedia } from './sources/wikipedia.js';
import { fetchCommons } from './sources/commons.js';
import { fetchArchive } from './sources/archive.js';

const log = createLogger('crawl');

const SOURCES = { wikipedia: fetchWikipedia, commons: fetchCommons, archive: fetchArchive };

const IMAGE_TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png' };
const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // giới hạn ảnh của Telegram

const safeName = (s) => s.replace(/[\\/:*?"<>|\n\r]+/g, '_').replace(/\s+/g, ' ').slice(0, 100).trim() || 'tai-lieu';

/** Tải các ảnh JPEG/PNG của tài liệu; ảnh lỗi hoặc sai định dạng thì bỏ qua. */
async function fetchImages(doc, ilog) {
  const out = [];
  const list = (doc.images ?? []).slice(0, config.maxImages);
  for (const [i, img] of list.entries()) {
    try {
      const { data, contentType } = await download(img.url, MAX_IMAGE_BYTES);
      if (IMAGE_TYPES[contentType]) {
        out.push({ ...img, data, mimeType: contentType });
        ilog.debug(`  ảnh ${i + 1}/${list.length}: ${contentType} ${formatBytes(data.length)}`);
      } else {
        ilog.debug(`  ảnh ${i + 1}/${list.length}: bỏ (định dạng ${contentType || 'không rõ'})`);
      }
      await sleep(config.requestDelayMs);
    } catch (err) {
      ilog.warn(`  bỏ ảnh ${i + 1}/${list.length}: ${err.message}`);
    }
  }
  return out;
}

/** Tải PDF gốc nếu có và không quá lớn. */
async function fetchSourcePdf(doc, ilog) {
  if (!doc.file) return null;
  if (doc.file.size > config.maxFileBytes) {
    ilog.info(`  PDF gốc ${formatBytes(doc.file.size)} > ${formatBytes(config.maxFileBytes)} → chỉ gửi link`);
    return null;
  }
  try {
    const start = Date.now();
    const { data } = await download(doc.file.url, config.maxFileBytes);
    if (data.subarray(0, 4).toString() !== '%PDF') {
      ilog.warn('  file tải về không phải PDF → bỏ');
      return null;
    }
    ilog.info(`  tải PDF gốc ${formatBytes(data.length)} (${elapsed(start)})`);
    return { data, name: safeName(doc.file.name.replace(/\.pdf$/i, '')) + '.pdf' };
  } catch (err) {
    ilog.warn(`  không tải được PDF gốc: ${err.message}`);
    return null;
  }
}

/**
 * Lưu vào data/docs/<KhuVuc>/<Loai>/<ten-tai-lieu>/:
 *   anh-1.jpg..., <sách gốc>.pdf, giai-thich.pdf
 */
async function saveItem(doc, cls, images, sourcePdf) {
  const dir = path.join(config.dataDir, 'docs', REGIONS[cls.region].tag, TYPES[cls.type].tag, safeName(doc.title));
  await fs.mkdir(dir, { recursive: true });

  const imagePaths = [];
  for (const [i, img] of images.entries()) {
    const p = path.join(dir, `anh-${i + 1}.${IMAGE_TYPES[img.mimeType]}`);
    await fs.writeFile(p, img.data);
    imagePaths.push(p);
  }

  let sourcePath = null;
  if (sourcePdf) {
    sourcePath = path.join(dir, sourcePdf.name === 'giai-thich.pdf' ? 'tai-lieu-goc.pdf' : sourcePdf.name);
    await fs.writeFile(sourcePath, sourcePdf.data);
  }

  const explanationPath = path.join(dir, 'giai-thich.pdf');
  await renderExplanationPdf({ doc, cls, images }, explanationPath);

  return { dir, images: imagePaths, sourcePdf: sourcePath, explanationPdf: explanationPath };
}

/**
 * Cào tất cả nguồn, phân loại, lưu (chỉ PDF + ảnh) và gửi tài liệu mới.
 * @param {{ telegram?: { sendItem: Function }, dryRun?: boolean }} opts
 */
export async function crawl({ telegram, dryRun = false } = {}) {
  const runStart = Date.now();
  const store = await Store.load();
  const result = { sent: 0, skipped: 0, errors: 0 };
  log.info(`Bắt đầu lượt cào${dryRun ? ' (dry-run)' : ''}: tối đa ${config.maxPerSource} tài liệu/nguồn, đã nhớ ${Object.keys(store.items).length} tài liệu`);

  for (const [name, fetchSource] of Object.entries(SOURCES)) {
    const slog = log.child(name);
    const srcStart = Date.now();
    const stat = { sent: 0, noMedia: 0, irrelevant: 0, known: 0, errors: 0 };
    const seenThisRun = new Set();
    slog.info('▶ bắt đầu nguồn');

    for await (const item of fetchSource(slog)) {
      if (stat.sent >= config.maxPerSource) {
        slog.info(`đủ ${config.maxPerSource} tài liệu, dừng nguồn`);
        break;
      }
      if (store.has(item.id) || seenThisRun.has(item.id)) {
        stat.known++;
        slog.debug(`bỏ qua (đã xử lý): ${item.title}`);
        continue;
      }
      seenThisRun.add(item.id);

      const itemStart = Date.now();
      slog.info(`● ${item.title}  (từ khoá "${item.query}")`);
      try {
        const doc = { ...item, ...(await item.load()) };

        // Chỉ nhận tài liệu có ảnh hoặc PDF.
        const images = await fetchImages(doc, slog);
        const sourcePdf = await fetchSourcePdf(doc, slog);
        slog.info(`  media: ${images.length}/${doc.images?.length ?? 0} ảnh${sourcePdf ? ' + PDF gốc' : ''}`);
        if (!images.length && !sourcePdf) {
          store.mark(item.id, { status: 'no-media', title: doc.title });
          stat.noMedia++;
          slog.info('  → bỏ: không có ảnh/PDF');
          continue;
        }

        const cls = await classify(doc, images);
        if (!cls.relevant) {
          // AI đang lỗi/hết hạn mức thì không ghi nhớ, để lần sau có AI xét lại.
          if (!cls.fallback) store.mark(item.id, { status: 'irrelevant', title: doc.title });
          stat.irrelevant++;
          slog.info(`  → bỏ: không liên quan (${cls.method}${cls.fallback ? ', sẽ xét lại khi có AI' : ''})`);
          continue;
        }
        slog.info(`  phân loại (${cls.method}): ${REGIONS[cls.region].label} / ${TYPES[cls.type].label}` +
          (cls.ethnic_groups.length ? ` / ${cls.ethnic_groups.join(', ')}` : ''));

        const saved = await saveItem(doc, cls, images, sourcePdf);
        slog.info(`  lưu: ${path.relative(config.dataDir, saved.dir)}/`);

        if (!dryRun) {
          await telegram.sendItem(doc, cls, saved);
          slog.info('  đã gửi Telegram');
        }

        store.mark(item.id, {
          status: 'sent', title: doc.title, url: doc.url, region: cls.region, type: cls.type, dir: saved.dir,
        });
        stat.sent++;
        slog.info(`  ✓ xong (${elapsed(itemStart)})`);
      } catch (err) {
        stat.errors++;
        slog.error(`  ✗ lỗi: ${err.message}`);
        slog.debug(err.stack);
      } finally {
        // Dry-run không ghi nhớ, để lần chạy thật vẫn gửi các tài liệu này.
        if (!dryRun) await store.save();
      }
    }

    slog.info(`■ xong nguồn (${elapsed(srcStart)}): ${stat.sent} mới, ${stat.noMedia} không có ảnh/PDF, ` +
      `${stat.irrelevant} không liên quan, ${stat.known} đã xử lý trước, ${stat.errors} lỗi`);
    result.sent += stat.sent;
    result.skipped += stat.noMedia + stat.irrelevant;
    result.errors += stat.errors;
  }

  log.info(`Kết thúc lượt cào (${elapsed(runStart)}): ${result.sent} mới, ${result.skipped} bỏ qua, ${result.errors} lỗi`);
  return result;
}
