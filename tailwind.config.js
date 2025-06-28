import daisyui from 'daisyui';

/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      spacing: {
        // Design system spacing tokens
        xs: '4px', // 0.25rem
        sm: '8px', // 0.5rem
        md: '12px', // 0.75rem
        lg: '16px', // 1rem
        xl: '24px', // 1.5rem
        '2xl': '32px', // 2rem
        '3xl': '48px', // 3rem
      },
      minHeight: {
        'message-card': '56px', // Fixed height for avatars
        'input-area': '40px', // Consistent input height
      },
      maxHeight: {
        textarea: '120px', // Max textarea height
        dropdown: '200px', // Max dropdown height
      },
      animation: {
        'fade-in': 'fadeIn 0.15s ease-out',
        'slide-up': 'slideUp 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [daisyui],
  daisyui: {
    themes: ['light', 'dark'],
    base: false,
    utils: true,
  },
};

export default config;
