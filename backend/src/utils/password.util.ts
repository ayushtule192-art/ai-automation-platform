import bcrypt from "bcryptjs";

/** Cost factor for bcrypt — 12 is a good balance for production */
const SALT_ROUNDS = 12;

/** Hash a plaintext password using bcrypt */
export async function hashPassword(plaintext: string): Promise<string> {
  return bcrypt.hash(plaintext, SALT_ROUNDS);
}

/** Compare a plaintext password against a stored bcrypt hash */
export async function comparePassword(
  plaintext: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plaintext, hash);
}
