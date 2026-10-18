import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createTinyFishClassifier, OUTPUT_SCHEMA } from '../src/classify/tinyfish.js';

const realFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = realFetch; });

const doc = { title: 'Bùa Lỗ Ban', source: 'wikipedia', url: 'https://vi.wikipedia.org/wiki/X', text: 'nội dung' };
const reply = (status, body) => async () => new Response(JSON.stringify(body), { status });

test('gửi url + output_schema không có additionalProperties, trả kết quả có method tinyfish', async () => {
  let sent;
  globalThis.fetch = async (url, init) => {
    sent = { url, init, body: JSON.parse(init.body) };
    return reply(200, {
      run_id: 'r1', status: 'COMPLETED',
      result: { relevant: true, region: 'trung_quoc', type: 'phu_chu', ethnic_groups: [], ten_bua: 'x', summary_vi: 's',
        nguon_goc: '', chuc_nang: '', hinh_anh: ['ảnh 1'], cach_phong_tranh: [] },
    })();
  };
  const cls = await createTinyFishClassifier({ apiKey: 'k' })(doc, [{ url: 'https://img/1.jpg', description: 'lá bùa' }]);
  assert.equal(sent.url, 'https://agent.tinyfish.ai/v1/automation/run');
  assert.equal(sent.init.headers['X-API-Key'], 'k');
  assert.equal(sent.body.url, doc.url);
  assert.equal('additionalProperties' in sent.body.output_schema, false);
  assert.match(sent.body.goal, /1\. https:\/\/img\/1\.jpg — lá bùa/);
  assert.equal(cls.method, 'tinyfish');
  assert.equal(cls.type, 'phu_chu');
});

test('402 (ví hết tiền) → lỗi status 402', async () => {
  globalThis.fetch = reply(402, { error: { message: 'Wallet balance too low to start this run' } });
  await assert.rejects(createTinyFishClassifier({ apiKey: 'k' })(doc), (err) => err.status === 402 && /Wallet/.test(err.message));
});

test('run FAILED → lỗi', async () => {
  globalThis.fetch = reply(200, { status: 'FAILED', result: null, error: { message: 'blocked' } });
  await assert.rejects(createTinyFishClassifier({ apiKey: 'k' })(doc), /thất bại \(FAILED\)/);
});

test('output_schema chỉ chứa từ khoá TinyFish hỗ trợ (không description/additionalProperties)', () => {
  const bad = [];
  const walk = (node, at) => {
    for (const [k, v] of Object.entries(node)) {
      if (['description', 'additionalProperties'].includes(k)) bad.push(`${at}/${k}`);
      if (k === 'properties') for (const [name, sub] of Object.entries(v)) walk(sub, `${at}/properties/${name}`);
      else if (k === 'items') walk(v, `${at}/items`);
    }
  };
  walk(OUTPUT_SCHEMA, '#');
  assert.deepEqual(bad, []);
  assert.ok(OUTPUT_SCHEMA.properties.relevant.type === 'boolean');
  assert.ok(OUTPUT_SCHEMA.properties.region.enum.length > 0);
  assert.ok(OUTPUT_SCHEMA.required.includes('hinh_anh'));
});
