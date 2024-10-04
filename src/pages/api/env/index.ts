import { NextApiRequest, NextApiResponse } from 'next';
import { getClientSideEnvs } from '@/utils/env/getClientSideEnvs';

export default function env(
  _req: NextApiRequest,
  res: NextApiResponse,
) {
  const env = getClientSideEnvs();
  res.status(200).json(env);
}
