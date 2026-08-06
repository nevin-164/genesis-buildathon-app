import "server-only";

import bcrypt from "bcryptjs";

/**
 * bcrypt stores the cost inside the hash, so raising this only affects new
 * passwords — existing hashes keep verifying at whatever cost they were made.
 */
const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
