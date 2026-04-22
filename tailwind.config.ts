import type { Config } from 'tailwindcss';

export default {
    content: ['./app/components/**/*.{vue,js,ts}', './app/layouts/**/*.vue', './app/pages/**/*.vue', './app/app.vue'],
    theme: {
        extend: {
            colors: {
                gold: {
                    DEFAULT: '#b08a3e',
                    dark: '#8c6a28',
                    light: '#d4b878',
                },
                ink: '#111111',
                paper: '#ffffff',
            },
            fontFamily: {
                display: ['"Great Vibes"', 'cursive'],
                serif: ['"Cormorant Garamond"', 'serif'],
                sans: ['"Inter"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
            },
            letterSpacing: {
                wider: '0.12em',
                widest: '0.3em',
            },
            transitionTimingFunction: {
                'emph-out': 'cubic-bezier(0.23, 1, 0.32, 1)',
            },
        },
    },
    plugins: [],
} satisfies Config;
