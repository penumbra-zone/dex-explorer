import { z } from 'zod';
import { base64tobech32, Bech32String, zBase64, zBech32 } from '@/utils/encoding';

const LPState_ALL = ['opened', 'closed', 'withdrawn'] as const;
/** Represents the current state of a Liquidity Position. */
export type LPState = (typeof LPState_ALL)[number];

/**
 * Represents an update to a liquidity position.
 */
export class LPUpdate {
  private constructor(
    /** The unique identifier of this update, across all LPs. */
    public id: number,
    /** The block height where this update happened. */
    public height: number,
    /** The canonical identifier of the position being updated. */
    public positionId: Bech32String<'plpid'>,
    /** The new state of the position. */
    public state: LPState,
    /** The new reserves of the first asset. */
    public reserves1: bigint,
    /** The new reserves of the second asset. */
    public reserves2: bigint,
  ) {}

  /** How to parse this data from a database row. */
  public static DB_SCHEMA = z
    .tuple([
      z.number(),
      z.number(),
      zBase64().transform(x => base64tobech32('plpid', x)),
      z.enum(LPState_ALL),
      z.coerce.bigint(),
      z.coerce.bigint(),
    ])
    .transform(x => new LPUpdate(...x));

  /** How to parse this data from json. */
  public static JSON_SCHEMA = z
    .object({
      id: z.number(),
      height: z.number(),
      positionId: zBech32('plpid'),
      state: z.enum(LPState_ALL),
      reserves1: z.coerce.bigint(),
      reserves2: z.coerce.bigint(),
    })
    .transform(x => new LPUpdate(x.id, x.height, x.positionId, x.state, x.reserves1, x.reserves2));

  /** Convert this object into JSON, encoding the big integers as strings. */
  toJSON(): string {
    return JSON.stringify({
      ...this,
      reserves1: this.reserves1.toString(),
      reserves2: this.reserves1.toString(),
    });
  }
}
