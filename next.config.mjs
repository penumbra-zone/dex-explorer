/** @type {import('next').NextConfig} */

const nextConfig = {
  transpilePackages: ["@penumbra-zone/protobuf"],
  webpack: (config) => {
    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      use: ['@svgr/webpack'],
    })

    config.experiments.asyncWebAssembly = true;

    return config;
  },
  output: "standalone",
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
