// Tiện ích chung cho API MediaWiki (Wikipedia, Commons).

export const IMAGE_PROPS = {
  prop: 'imageinfo',
  iiprop: 'url|mime|size|extmetadata',
  iiurlwidth: '1024',
  iiextmetadatafilter: 'ImageDescription|LicenseShortName|Artist|ObjectName',
};

// Logo, biểu tượng, cờ, bản đồ... không phải ảnh tư liệu.
const JUNK = /logo|icon|flag|symbol|ambox|stub|disambig|commons-|wiki|edit-|question|padlock|portal|nuvola|crystal|folder|speaker|audio|locator|map of|blank|placeholder/i;

export function stripHtml(s = '') {
  return String(s).replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
}

/** Chuyển một trang File: thành ảnh dùng được (thumbnail JPEG/PNG ≤1024px), hoặc null. */
export function toImage(page) {
  const ii = page.imageinfo?.[0];
  if (!ii || JUNK.test(page.title)) return null;
  if (!/^image\/(jpeg|png|tiff)$|^application\/pdf$/.test(ii.mime)) return null;
  if ((ii.width ?? 0) < 300 || (ii.height ?? 0) < 200) return null;

  const meta = ii.extmetadata ?? {};
  return {
    url: ii.thumburl || ii.url,
    description: stripHtml(meta.ImageDescription?.value || meta.ObjectName?.value || page.title),
    license: stripHtml(meta.LicenseShortName?.value) || 'không rõ',
    artist: stripHtml(meta.Artist?.value) || 'không rõ',
    source: ii.descriptionurl,
    mime: ii.mime,
    original: { url: ii.url, size: ii.size, name: page.title.replace(/^File:/, '') },
  };
}
