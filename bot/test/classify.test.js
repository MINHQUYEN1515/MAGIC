import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classifyByKeywords, normalize } from '../src/classify/keywords.js';
import { buildCaption } from '../src/telegram.js';

test('normalize giữ dấu, chỉ hạ chữ thường', () => {
  assert.equal(normalize('Bùa Ngải Đen'), 'bùa ngải đen');
});

test('cổ trùng của người Miêu → dân tộc thiểu số / cổ trùng', () => {
  const r = classifyByKeywords({ title: '苗族蛊术', text: '苗疆的蛊是一种传说中的巫术' });
  assert.equal(r.relevant, true);
  assert.equal(r.region, 'dan_toc_thieu_so');
  assert.equal(r.type, 'co_trung');
  assert.deepEqual(r.ethnic_groups, ["H'Mông / Miêu"]);
});

test('bùa Lỗ Ban ở Việt Nam → Việt Nam / phù chú', () => {
  const r = classifyByKeywords({ title: 'Bùa Lỗ Ban', text: 'Một loại bùa chú lưu truyền ở Việt Nam' });
  assert.equal(r.region, 'viet_nam');
  assert.equal(r.type, 'phu_chu');
});

test('bùa yêu Trung Quốc', () => {
  const r = classifyByKeywords({ title: '情蛊与情降', text: '中国 民间 love charm' });
  assert.equal(r.region, 'trung_quoc');
  assert.equal(r.type, 'bua_yeu');
});

test('"ngải cứu" (rau) không bị coi là liên quan', () => {
  const r = classifyByKeywords({ title: 'Ngải cứu', text: 'Ngải cứu là cây thuốc, dùng nấu canh, Artemisia vulgaris' });
  assert.equal(r.relevant, false);
});

test('caption không vượt 1024 ký tự và escape HTML', () => {
  const doc = { title: 'A <b> & B', url: 'https://x.y', source: 'wikipedia', text: 'x'.repeat(5000) };
  const cls = { region: 'viet_nam', type: 'thu_em', ethnic_groups: ['Mường'], summary_vi: 'y'.repeat(3000) };
  const c = buildCaption(doc, cls);
  assert.ok(c.length <= 1024, `dài ${c.length}`);
  assert.match(c, /A &lt;b&gt; &amp; B/);
  assert.match(c, /#VietNam #ThuEm #Muong #wikipedia/);
});

test('không khớp nhầm do bỏ dấu: đạo, miếu, phụ chú, miền', () => {
  const r = classifyByKeywords({
    title: 'Văn phạm Pali',
    text: 'Sách về đạo Phật ở miền Nam, có phụ chú. Ngôi miếu cổ được nung gạch.',
  });
  assert.equal(r.relevant, false);
  assert.deepEqual(r.ethnic_groups, []);
});

test('từ Latin phải khớp nguyên từ', () => {
  const r = classifyByKeywords({ title: 'Hexagon geometry', text: 'a hexagonal shape' });
  assert.equal(r.relevant, false);
});

test('không có từ khoá khu vực thì đoán theo ngôn ngữ', () => {
  assert.equal(classifyByKeywords({ title: '660号辰州符咒大全', text: '' }).region, 'trung_quoc');
  assert.equal(classifyByKeywords({ title: 'Bùa chú dân gian', text: '', lang: 'vi' }).region, 'viet_nam');
});

test('một từ khoá lặp lại trong nội dung (tên bài hát/truyện) là nhiễu', () => {
  const r = classifyByKeywords({ title: 'Bích Phương', text: 'Ca sĩ nổi tiếng với bài Bùa yêu. Bùa yêu đứng đầu bảng xếp hạng. Bùa yêu...' });
  assert.equal(r.relevant, false);
});

test('"miêu tả", "chăm chỉ" không bị coi là dân tộc', () => {
  const r = classifyByKeywords({ title: 'Bùa hộ mệnh', text: 'Sách miêu tả người chăm chỉ đeo bùa.' });
  assert.deepEqual(r.ethnic_groups, []);
});

test('Wikipedia: chỉ nhắc trong thân bài thì không tính', () => {
  const text = 'Vua bị nghi dùng 巫蛊 và 厌胜 để hại người, có cả bùa ngải.';
  assert.equal(classifyByKeywords({ title: 'Đường Thuận Tông', text, source: 'wikipedia' }).relevant, false);
  assert.equal(classifyByKeywords({ title: 'Some book', text, source: 'archive' }).relevant, true);
});

test('đếm số lần khớp để lọc nhiễu trước khi gọi AI', () => {
  assert.equal(classifyByKeywords({ title: 'Spell checker', text: 'a screenshot' }).hits, 0);
  assert.ok(classifyByKeywords({ title: 'Lê Thị Nhị', text: 'giai thoại bùa yêu Sài Gòn' }).hits > 0);
});
