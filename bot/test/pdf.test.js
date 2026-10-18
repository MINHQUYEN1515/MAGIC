import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { renderExplanationPdf } from '../src/pdf.js';
import { EXPLANATIONS } from '../src/classify/categories.js';

// PNG 1x1 hợp lệ, đủ để kiểm tra luồng nhúng ảnh.
function tinyPng() {
  const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc = (buf) => {
    let c = 0xffffffff;
    for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type), data]);
    const c = Buffer.alloc(4);
    c.writeUInt32BE(crc(body));
    return Buffer.concat([len, body, c]);
  };
  const ihdr = Buffer.from([0, 0, 0, 1, 0, 0, 0, 1, 8, 2, 0, 0, 0]);
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(Buffer.from([0, 200, 30, 30]))),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

test('tạo PDF giải thích có chữ Việt, chữ Hán và ảnh', async () => {
  const out = path.join(await fs.mkdtemp(path.join(os.tmpdir(), 'magic-')), 'giai-thich.pdf');
  await renderExplanationPdf(
    {
      doc: { title: 'Bùa Lỗ Ban 鲁班书', url: 'https://example.org' },
      cls: {
        region: 'viet_nam', type: 'phu_chu', ethnic_groups: [], method: 'keywords',
        ten_bua: 'Bùa Lỗ Ban', summary_vi: null, nguon_goc: '', chuc_nang: EXPLANATIONS.phu_chu.chuc_nang,
        hinh_anh: ['Lá bùa đỏ'], cach_phong_tranh: EXPLANATIONS.phu_chu.phong_tranh,
      },
      images: [
        { data: tinyPng(), license: 'CC0', artist: 'A', source: 'https://example.org' },
        { data: Buffer.from('không phải ảnh'), license: '', artist: '', source: '' }, // phải bị bỏ qua, không crash
      ],
    },
    out,
  );
  const pdf = await fs.readFile(out);
  assert.equal(pdf.subarray(0, 5).toString(), '%PDF-');
  assert.match(pdf.toString('latin1'), /NotoSansCJK/); // font Unicode đã được nhúng
});
