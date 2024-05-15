const nextConfig = {
  webpack: (config) => {
    config.experiments = {
      ...(config.experiments ?? {}),
      asyncWebAssembly: true,
    };
    return config;
  },
  // Support emitting a fully built docroot, via nextjs,
  // for serving via `node server.js`. See docs at pick
  // https://nextjs.org/docs/pages/building-your-application/deploying#docker-image
  output: 'standalone',
}

module.exports = nextConfig;