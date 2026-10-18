import { REGIONS, ETHNIC_GROUPS, TYPES, NOISE } from './categories.js';

/**
 * Chữ thường, chuẩn hoá Unicode (NFC). Giữ nguyên dấu tiếng Việt:
 * bỏ dấu sẽ làm "đạo"→"dao", "miếu"→"mieu", "phụ chú"→"phu chu" khớp nhầm.
 */
export function normalize(s) {
  return s.normalize('NFC').toLowerCase().replace(/[’`´]/g, "'");
}

const isCJK = (s) => /[㐀-鿿]/.test(s);
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const cache = new Map();

/** Từ khoá chữ Latin phải khớp nguyên từ ("hex" không khớp "hexagon"); chữ Hán khớp chuỗi con. */
function pattern(kw) {
  if (!cache.has(kw)) {
    const k = escapeRe(normalize(kw));
    cache.set(kw, new RegExp(isCJK(kw) ? k : `(?<![\\p{L}\\p{N}])${k}(?![\\p{L}\\p{N}])`, 'gu'));
  }
  return cache.get(kw);
}

function countHits(text, keywords) {
  return hitStats(text, keywords).total;
}

function hitStats(text, keywords) {
  let total = 0;
  const distinct = new Set();
  for (const kw of keywords) {
    const n = text.match(pattern(kw))?.length ?? 0;
    if (n) {
      total += n;
      distinct.add(normalize(kw));
    }
  }
  return { total, distinct: distinct.size };
}

function scoreAll(table, title, body) {
  return Object.entries(table).map(([id, { keywords }]) => ({
    id,
    title: countHits(title, keywords),
    body: countHits(body, keywords),
  }));
}

function pickBest(scores) {
  let best = { id: 'khac', title: 0, body: 0 };
  const weight = (s) => s.title * 3 + s.body;
  for (const s of scores) if (weight(s) > weight(best)) best = s;
  return best;
}

function stripNoise(s) {
  for (const n of NOISE) s = s.replace(pattern(n), ' ');
  return s;
}

function guessRegionByLanguage(lang, text) {
  const l = String(lang).toLowerCase();
  if (/^(zh|chi|chinese)/.test(l)) return 'trung_quoc';
  if (/^(vi|vie|vietnamese)/.test(l)) return 'viet_nam';
  const cjk = text.match(/[\u3400-\u9fff]/g)?.length ?? 0;
  if (cjk > text.length * 0.3) return 'trung_quoc';
  if (/[ăâđêôơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/.test(text)) return 'viet_nam';
  return 'khac';
}

const ALL_TYPE_KEYWORDS = Object.values(TYPES).flatMap((t) => t.keywords);

/**
 * Phân loại bằng từ khoá. Liên quan khi tiêu đề có từ khoá loại bùa, hoặc
 * nội dung có ít nhất 2 từ khoá khác nhau (≥ 3 lần). Một từ lặp lại nhiều lần
 * (vd "thần chú" trong truyện, "bùa yêu" là tên bài hát) thường là nhiễu.
 * Với Wikipedia bắt buộc tiêu đề phải khớp.
 */
export function classifyByKeywords({ title, text, lang = '', source = '' }) {
  const t = stripNoise(normalize(title));
  const b = stripNoise(normalize(text ?? ''));

  const type = pickBest(scoreAll(TYPES, t, b));
  const body = hitStats(b, ALL_TYPE_KEYWORDS);
  const ethnic_groups = Object.entries(ETHNIC_GROUPS)
    .filter(([, kws]) => countHits(t, kws) + countHits(b, kws) > 0)
    .map(([name]) => name);

  let region = pickBest(scoreAll(REGIONS, t, b)).id;
  if (ethnic_groups.length > 0) region = 'dan_toc_thieu_so';
  else if (region === 'khac') region = guessRegionByLanguage(lang, t + b);

  return {
    // Bài Wikipedia đúng chủ đề luôn có từ khoá trong tiêu đề; chỉ nhắc trong thân bài thường là nhiễu.
    relevant: type.title > 0 || (source !== 'wikipedia' && body.distinct >= 2 && body.total >= 3),
    region,
    type: type.id,
    ethnic_groups,
    summary_vi: null,
    hits: type.title + body.total,
    method: 'keywords',
  };
}
