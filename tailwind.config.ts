import { withPenumbra, tailwindConfig } from '@penumbra-zone/ui/theme';

export default withPenumbra({
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx,css}'],
  theme: {
    extend: {
      backgroundImage: {
        ...tailwindConfig.theme.extend.backgroundImage,
        shimmer:
          'linear-gradient(90deg, rgba(250, 250, 250, 0.05) 0%, rgba(250, 250, 250, 0.10) 100%)',
      },
    },
  },
  plugins: [],
});
