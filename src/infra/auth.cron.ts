import { timingSafeEqual } from "node:crypto";

const eqConstantTime = (a: string, b: string): boolean => {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
};

export const isAuthorisedCron = (
  authorizationHeader: string | null,
  secret: string | undefined
): boolean => {
  if (!secret || secret.length < 16) return false;
  if (!authorizationHeader) return false;
  const expected = `Bearer ${secret}`;
  return eqConstantTime(authorizationHeader, expected);
};
