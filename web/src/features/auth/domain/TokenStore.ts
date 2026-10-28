export interface TokenStore {
  get(): string | null;
  save(token: string): void;
  clear(): void;
}
