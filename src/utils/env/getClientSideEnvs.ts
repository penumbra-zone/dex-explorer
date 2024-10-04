import { ClientEnv } from './types';

export function getClientSideEnvs() {
  const whitelist: string[] = ['PENUMBRA_CHAIN_ID', 'PENUMBRA_CUILOA_URL'];

  const envs: ClientEnv = whitelist.reduce(
    (envs, key) => ({
      ...envs,
      [key]: process.env[key] ?? '',
    }),
    {},
  );

  return envs;
}