import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crawl } from '../src/crawler.js';

test('crawl dừng ngay khi signal đã huỷ, không gọi nguồn nào', async () => {
  const r = await crawl({ dryRun: true, signal: AbortSignal.abort() });
  assert.deepEqual(r, { sent: 0, skipped: 0, errors: 0, stopped: true });
});
