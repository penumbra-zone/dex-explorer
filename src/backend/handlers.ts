import { NextApiRequest, NextApiResponse } from 'next';

type Handler = (req: NextApiRequest, res: NextApiResponse) => Promise<void>;

/**
 * Decorate a request handler to catch and return the right status on any error.
 */
export function withCaughtErrors(context: string, f: Handler): Handler {
  return async (req, res) => {
    try {
      await f(req, res);
    } catch (error) {
      const message = `Internal error in ${context}: ${String(error)}`;
      console.error(message);
      res.status(500).json({ error: message });
    }
  };
}
