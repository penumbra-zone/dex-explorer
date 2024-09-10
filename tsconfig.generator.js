import fs from 'fs';
import tmpExcludes from './tmp-lint-excludes.js';

const tsconfig = {
  compilerOptions: {
    composite: true,
    exactOptionalPropertyTypes: false,
    lib: ['ESNext', 'DOM', 'DOM.Iterable', 'DOM.AsyncIterable'],
    noEmit: true,
    target: 'ESNext',
    skipLibCheck: true,
    plugins: [
      {
        name: 'next',
      },
    ],
    paths: {
      '@/*': ['./src/*', './styles/*'],
    },
    allowJs: true,
    incremental: true,
    jsx: 'preserve',
  },
  extends: ['@tsconfig/strictest/tsconfig.json', '@tsconfig/vite-react/tsconfig.json'],
  include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts', 'styles/styles.d.ts'],
  exclude: ['node_modules'],
  // exclude: ['node_modules', ...tmpExcludes],
};

fs.writeFileSync('tsconfig.json', JSON.stringify(tsconfig, null, 2));
