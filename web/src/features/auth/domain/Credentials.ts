export type Credentials = {
  email: string;
  password: string;
};

export type Registration = Credentials & {
  name: string;
};

// Khớp ràng buộc của backend (bcrypt chỉ nhận tối đa 72 byte).
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 72;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email);
}
