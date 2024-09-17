import { withCaughtErrors } from '@/backend/handlers';
import { NextApiRequest, NextApiResponse } from 'next';

function test(_req: NextApiRequest, res: NextApiResponse): Promise<void> {
  return new Promise(() => {
    res.status(200).json({ hello: 'world' });
    return;
  });
}

export default withCaughtErrors('test/000', test);
