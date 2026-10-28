import type { HttpClient } from './HttpClient';
import { HttpError } from './HttpError';

type Options = {
  baseUrl: string;
  getToken?: () => string | null;
  onUnauthorized?: () => void;
};

export class FetchHttpClient implements HttpClient {
  private readonly opts: Options;

  constructor(opts: Options) {
    this.opts = opts;
  }

  get<T>(path: string): Promise<T> {
    return this.request<T>('GET', path);
  }

  post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('POST', path, body);
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    const token = this.opts.getToken?.();
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${this.opts.baseUrl}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    const data: unknown = res.status === 204 ? undefined : await res.json().catch(() => undefined);
    if (!res.ok) {
      if (res.status === 401) this.opts.onUnauthorized?.();
      // Backend trả lỗi dạng {"error": "..."}
      const message = (data as { error?: string } | undefined)?.error ?? `Lỗi HTTP ${res.status}`;
      throw new HttpError(res.status, message);
    }
    return data as T;
  }
}
