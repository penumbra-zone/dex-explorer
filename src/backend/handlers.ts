import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

type Handler<T> = (req: NextApiRequest, res: NextApiResponse<T>) => Promise<void>;

/**
 * Decorate a request handler to catch and return the right status on any error.
 *
 * This will map:
 *  - parsing errors (using zod) to 400 status errors,
 *  - anything else to 500 status errors.
 */
export function withCaughtErrors<T>(
  context: string,
  f: Handler<T>,
): Handler<T | { error: string }> {
  return async (req, res) => {
    try {
      await f(req, res);
    } catch (e) {
      if (e instanceof z.ZodError) {
        res.status(400).json({ error: e.toString() });
      } else {
        res.status(500).json({ error: `internal error [${context}]: ${String(e)}` });
      }
    }
  };
}
