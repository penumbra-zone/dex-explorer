const path = require("path");

const nextConfig = {
  webpack: (config, { isServer }) => {
    // Add Babel loader to handle TypeScript files
    config.module.rules.push({
      test: /\.(ts|tsx)$/,
      exclude: /node_modules/,
      use: [
        {
          loader: "babel-loader",
          options: {
            presets: [
              [
                "@babel/preset-env",
                {
                  targets: {
                    esmodules: true,
                  },
                },
              ],
              "@babel/preset-typescript",
              "@babel/preset-react",
            ],
            plugins: ["@babel/plugin-syntax-top-level-await"],
          },
        },
      ],
    });

    config.module.rules.push({
      test: /\.(ts|tsx)$/,
      include: /node_modules/,
      use: [
        {
          loader: "babel-loader",
          options: {
            presets: [
              [
                "@babel/preset-env",
                {
                  targets: {
                    esmodules: true,
                  },
                },
              ],
              "@babel/preset-typescript",
              "@babel/preset-react",
            ],
            plugins: ["@babel/plugin-syntax-top-level-await"],
          },
        },
      ],
    });

    // Ensure WebAssembly files are handled correctly
    config.module.rules.push({
      test: /\.wasm$/,
      type: "webassembly/async",
    });

    // Enable WebAssembly and top-level await
    config.experiments = {
      asyncWebAssembly: true,
      topLevelAwait: true,
      syncWebAssembly: true,
    };

    return config;
  },
  output: "standalone",
};

module.exports = nextConfig;
