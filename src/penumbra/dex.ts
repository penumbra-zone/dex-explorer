import { z } from 'zod';
import { base64tobech32, Bech32String, zBase64, zBech32 } from '@/utils/encoding';
import { BlockInfo } from './block';

/** The identifiers for generic assets */
export type AssetID = Bech32String<'passet'>;

/** The identifiers for liquidity positions */
export type LPID = Bech32String<'plpid'>;

const LPState_ALL = ['opened', 'closed', 'withdrawn'] as const;
/** Represents the current state of a Liquidity Position. */
export type LPState = (typeof LPState_ALL)[number];

/**
 * Represents an event where execution happened against a liquidity position.
 *
 * I.e. when someone performed a swap and ended up moving money through here.
 */
export class LPExecution {
  private constructor(
    /** The amount of value flowing into or out of the first asset. */
    public inflow1: bigint,
    /** The amount of value flowing into or out of the second asset. */
    public inflow2: bigint,
    /** The start asset of the execution that reached this LP. */
    public contextStart: AssetID,
    /** The end asset of the execution that reached this LP. */
    public contextEnd: AssetID,
  ) {}

  /** How to parse this type from a database row */
  public static DB_SCHEMA = z
    .tuple([
      z.coerce.bigint(),
      z.coerce.bigint(),
      zBase64().transform(x => base64tobech32('passet', x)),
      zBase64().transform(x => base64tobech32('passet', x)),
    ])
    .transform(x => new LPExecution(...x));

  /** How to parse this type from a JSON object */
  public static JSON_SCHEMA = z
    .object({
      inflow1: z.coerce.bigint(),
      inflow2: z.coerce.bigint(),
      contextStart: zBech32('passet'),
      contextEnd: zBech32('passet'),
    })
    .transform(x => new LPExecution(x.inflow1, x.inflow2, x.contextStart, x.contextEnd));

  /** Convert this object into JSON, encoding the big integers as strings. */
  toJSON(): unknown {
    return {
      ...this,
      inflow1: this.inflow1.toString(),
      inflow2: this.inflow2.toString(),
    };
  }
}

/**
 * Represents an update to a liquidity position.
 *
 * This type is generic over whether or not the execution is present.
 *
 * This allows queries which specifically fetch the execution to not need a type assertion,
 * since they can know at validation time tthat the execution was there.
 */
export class LPUpdate<B extends boolean = false> {
  private constructor(
    /** The unique identifier of this update, across all LPs. */
    public id: number,
    /** Information about the block where this update happened. */
    public block: BlockInfo,
    /** The canonical identifier of the position being updated. */
    public positionId: LPID,
    /** The new state of the position. */
    public state: LPState,
    /** The new reserves of the first asset. */
    public reserves1: bigint,
    /** The new reserves of the second asset. */
    public reserves2: bigint,
    /** The execution associated with this update, if any. */
    public execution: LPExecution | (B extends true ? never : undefined),
  ) {}

  /** How to parse this data from a database row. */
  static dbSchema<B extends boolean>(hasExecution: B) {
    return z
      .tuple([
        z.number(),
        BlockInfo.DB_SCHEMA,
        zBase64().transform(x => base64tobech32('plpid', x)),
        z.enum(LPState_ALL),
        z.coerce.bigint(),
        z.coerce.bigint(),
        LPExecution.DB_SCHEMA.optional()
          .nullable()
          .transform(x => (!x ? undefined : x)) // a bit of a hack to get undefined
          .transform(x => {
            if (hasExecution && !x) {
              return z.NEVER;
            }
            return x as LPExecution | (B extends true ? never : undefined);
          }),
      ])
      .transform(x => new LPUpdate<B>(...x));
  }

  /** How to parse this data from json. */
  public static JSON_SCHEMA = z
    .object({
      id: z.number(),
      block: BlockInfo.JSON_SCHEMA,
      positionId: zBech32('plpid'),
      state: z.enum(LPState_ALL),
      reserves1: z.coerce.bigint(),
      reserves2: z.coerce.bigint(),
      execution: LPExecution.JSON_SCHEMA.optional(),
    })
    .transform(
      x =>
        new LPUpdate(x.id, x.block, x.positionId, x.state, x.reserves1, x.reserves2, x.execution),
    );

  /** Convert this object into JSON, encoding the big integers as strings. */
  toJSON(): unknown {
    return {
      ...this,
      reserves1: this.reserves1.toString(),
      reserves2: this.reserves2.toString(),
    };
  }
}
