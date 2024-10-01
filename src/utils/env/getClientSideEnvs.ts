export function getClientSideEnvs() {
  const whitelist: string[] = ['PENUMBRA_CHAIN_ID', 'PENUMBRA_CUILOA_URL'];

  const envs = whitelist.reduce(
    (envs: Record<string, string>, key) => ({
      ...envs,
      [key]: process.env[key] ?? '',
    }),
    {},
  );

  return envs;
}
