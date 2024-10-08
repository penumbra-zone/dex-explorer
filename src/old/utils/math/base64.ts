import { validateSchema } from './validation';
import { z } from 'zod';

export const Base64StringSchema = z.string().refine(
  str => {
    // Regular expression that matches base64 strings
    const base64Regex = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
    return base64Regex.test(str);
  },
  {
    message: 'Invalid base64 string',
  },
);

export type Base64Str = z.infer<typeof Base64StringSchema>;

export const InnerBase64Schema = z.object({ inner: Base64StringSchema });

export const base64ToUint8Array = (base64: string): Uint8Array => {
  const validated = validateSchema(Base64StringSchema, base64);
  const binString = atob(validated);
  return Uint8Array.from(binString, byte => byte.codePointAt(0) ?? 0);
};

export const uint8ArrayToBase64 = (byteArray: Uint8Array): string => {
  const binString = String.fromCodePoint(...byteArray);
  return btoa(binString);
};
