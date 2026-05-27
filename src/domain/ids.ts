import { ulid } from "ulid";

export type Id = string & { readonly __brand: "Id" };

export const newId = (): Id => ulid() as Id;
export const isId = (v: unknown): v is Id =>
  typeof v === "string" && /^[0-9A-HJKMNP-TV-Z]{26}$/.test(v);
