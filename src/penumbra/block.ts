import { z } from 'zod';

/**
 * Represents metadata about a given block.
 */
export class BlockInfo {
  private constructor(
    /** The height of this block. */
    public height: number,
    /** The time where this block was created. */
    public created: Date,
  ) {}

  /** How to parse this from a database row. */
  public static DB_SCHEMA = z
    .tuple([z.number(), z.coerce.date()])
    .transform(x => new BlockInfo(...x));

  /** How to parse this from a JSON object. */
  public static JSON_SCHEMA = z
    .object({
      height: z.number(),
      created: z.coerce.date(),
    })
    .transform(x => new BlockInfo(x.height, x.created));
}
