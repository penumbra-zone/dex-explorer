import { ClientEnv } from './types';

export function getClientSideEnv() {
  const whitelist: string[] = ['PENUMBRA_CHAIN_ID', 'PENUMBRA_CUILOA_URL'];

  const env = whitelist.reduce(
    (env, key) => ({
      ...env,
      [key]: process.env[key] ?? '',
    }),
    {},
  ) as ClientEnv;

  return env;
}