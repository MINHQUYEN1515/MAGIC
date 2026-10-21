import type { KeyValueStorage } from '@/core/storage/KeyValueStorage';
import type { TokenStore } from '../domain/TokenStore';

const KEY = 'auth.token';

export class StorageTokenStore implements TokenStore {
  private readonly storage: KeyValueStorage;

  constructor(storage: KeyValueStorage) {
    this.storage = storage;
  }

  get(): string | null {
    return this.storage.get(KEY);
  }

  save(token: string): void {
    this.storage.set(KEY, token);
  }

  clear(): void {
    this.storage.remove(KEY);
  }
}
