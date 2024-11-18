import { tailwindConfig, withPenumbra } from '@penumbra-zone/ui/theme';

export default withPenumbra({
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx,css}'],
  theme: {
    extend: {
      colors: {
        ...tailwindConfig.theme.extend.colors,
        sell: {
          bg: 'rgba(175, 38, 38, 0.24)',
          text: '#F17878',
        },
        buy: {
          bg: 'rgba(28, 121, 63, 0.24)',
          text: '#55D383',
        },
        route: {
          text: '#F49C43',
        },
        border: {
          base: '#262626',
          faded: 'rgba(250,250,250,0.15)',
        },
      },
      backgroundImage: {
        ...tailwindConfig.theme.extend.backgroundImage,
        shimmer:
          'linear-gradient(90deg, rgba(250, 250, 250, 0.05) 0%, rgba(250, 250, 250, 0.10) 100%)',
      },
      keyframes: {
        ...tailwindConfig.theme.extend.keyframes,
        shimmer: {
          '0%': { left: '-50%' },
          '100%': { left: '150%' },
        },
      },
      animation: {
        ...tailwindConfig.theme.extend.animation,
        shimmer: 'shimmer 2s infinite',
      },
    },
  },
  plugins: [],
});
