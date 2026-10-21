// Đọc và kiểm tra biến môi trường một lần duy nhất; nơi khác chỉ import `env`.
function required(key: string, value: string | undefined): string {
  if (!value) throw new Error(`Thiếu biến môi trường ${key} (xem .env.example)`);
  return value;
}

export const env = {
  apiBaseUrl: required('VITE_API_BASE_URL', import.meta.env.VITE_API_BASE_URL).replace(/\/$/, ''),
} as const;
