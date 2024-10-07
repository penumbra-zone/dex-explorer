import { ClientEnv } from './types';

const defaults = {
  PENUMBRA_CHAIN_ID: 'penumbra-1',
  PENUMBRA_CUILOA_URL: 'https://cuiloa.testnet.penumbra.zone',
};

export function getClientSideEnv() {
  const whitelist: string[] = ['PENUMBRA_CHAIN_ID', 'PENUMBRA_CUILOA_URL'];

  const env = whitelist.reduce(
    (env, key) => ({
      ...env,
      [key]: process.env[key] ?? '',
    }),
    defaults,
  ) as ClientEnv;

  return env;
}
