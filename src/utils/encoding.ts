import { bech32m } from 'bech32';
import { z } from 'zod';

/** The type of bech32 strings with a given prefix. */
export type Bech32String<P extends string> = `${P}${string}`;

/** Convert a base64 string to a bech32 string with a given prefix. */
export function base64tobech32<P extends string>(prefix: P, data: string): Bech32String<P> {
  return bech32m.encode(prefix, bech32m.toWords(Buffer.from(data, 'base64'))) as Bech32String<P>;
}

/** Convert a bech32 string to a base64 string */
export function bech32Tobase64(data: string): string {
  return Buffer.from(bech32m.fromWords(bech32m.decode(data).words)).toString('base64');
}

/** Convert a byte array to a bech32 string with a given prefix. */
export function uint8ArrayToBech32<P extends string>(prefix: P, data: Uint8Array): Bech32String<P> {
  return bech32m.encode(prefix, bech32m.toWords(data)) as Bech32String<P>;
}

/**
 * A zod validator for bech32 strings with a given prefix.
 *
 * @example `zBech32('plpid')` for LP identifiers.
 */
export function zBech32<P extends string>(x: P): z.ZodType<Bech32String<P>> {
  return z.custom<Bech32String<P>>(val => {
    return typeof val === 'string' && val.startsWith(x);
  });
}

/**
 * A zod validator for base64 strings.
 */
export function zBase64(): z.ZodType<string> {
  return z.string().refine(
    str => {
      // Regular expression that matches base64 strings
      const base64Regex = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
      return base64Regex.test(str);
    },
    {
      message: 'Invalid base64 string',
    },
  );
}
