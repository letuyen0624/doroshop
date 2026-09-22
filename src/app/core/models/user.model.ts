export type UserRole = 'customer' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  /** SHA-256 của mật khẩu. Chỉ dùng cho demo, xem README. */
  passwordHash: string;
  role: UserRole;
}

/** Thông tin người dùng an toàn để hiển thị, không kèm mật khẩu. */
export type PublicUser = Omit<User, 'passwordHash'>;

export interface Credentials {
  email: string;
  password: string;
}

export interface RegisterPayload extends Credentials {
  name: string;
}
