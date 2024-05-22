const nextConfig = {
  webpack: (config) => {
    config.experiments = {
      ...(config.experiments ?? {}),
      asyncWebAssembly: true,
    };
    return config;
  },
  output: "standalone",
};

module.exports = nextConfig;
