export interface ClientEnv {
  PENUMBRA_CHAIN_ID: string;
  PENUMBRA_CUILOA_URL: string;
}

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