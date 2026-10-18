import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from './config.js';

const file = path.join(config.dataDir, 'seen.json');

/** Ghi nhớ tài liệu đã xử lý để không gửi trùng. */
export class Store {
  constructor(items = {}) {
    this.items = items;
  }

  static async load() {
    try {
      return new Store(JSON.parse(await fs.readFile(file, 'utf8')));
    } catch (err) {
      if (err.code === 'ENOENT') return new Store();
      throw err;
    }
  }

  has(id) {
    return id in this.items;
  }

  mark(id, info) {
    this.items[id] = { ...info, at: new Date().toISOString() };
  }

  async save() {
    await fs.mkdir(config.dataDir, { recursive: true });
    const tmp = `${file}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(this.items, null, 2));
    await fs.rename(tmp, file);
  }

  stats() {
    const sent = Object.values(this.items).filter((i) => i.status === 'sent');
    const by = (key) =>
      sent.reduce((acc, i) => ((acc[i[key]] = (acc[i[key]] ?? 0) + 1), acc), {});
    return { total: Object.keys(this.items).length, sent: sent.length, byRegion: by('region'), byType: by('type') };
  }
}
