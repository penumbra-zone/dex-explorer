/** @type {import('next').NextConfig} */

const nextConfig = {
  transpilePackages: ["@penumbra-zone/protobuf"],
  experimental: {
    swcPlugins: [
      [
        "@preact-signals/safe-react/swc",
        { mode: "auto" }
      ],
    ],
  },
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
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
