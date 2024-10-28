import { tailwindConfig as v2TailwindConfig } from './src/shared/ui/tailwindConfig';

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx,css}', './app/**/*.{js,ts,jsx,tsx,mdx,css}'],
  theme: v2TailwindConfig.theme,
  plugins: [],
};
