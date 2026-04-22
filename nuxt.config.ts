// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    compatibilityDate: '2025-07-15',
    devtools: { enabled: true },
    modules: ['@nuxt/image', '@nuxtjs/tailwindcss'],
    css: ['~/assets/css/main.css'],
    tailwindcss: {
        cssPath: '~/assets/css/main.css',
    },
    nitro: {
        preset: 'static',
    },
    app: {
        head: {
            htmlAttrs: { lang: 'fr' },
            title: 'Stéphanie & Jérémy — 18 juillet 2026',
            meta: [
                { charset: 'utf-8' },
                { name: 'viewport', content: 'width=device-width, initial-scale=1' },
                { name: 'theme-color', content: '#c49b3d' },
                { name: 'robots', content: 'noindex, nofollow' },
                {
                    name: 'description',
                    content:
                        'Stéphanie et Jérémy se marient le 18 juillet 2026 à Fribourg. Retrouvez ici toutes les informations pratiques et confirmez votre présence.',
                },
                { property: 'og:title', content: 'Stéphanie & Jérémy — 18 juillet 2026' },
                {
                    property: 'og:description',
                    content: 'Mariage de Stéphanie et Jérémy le 18 juillet 2026 à Fribourg.',
                },
                { property: 'og:type', content: 'website' },
                { property: 'og:url', content: 'https://stephanie-jeremy.ch/' },
                { property: 'og:image', content: 'https://stephanie-jeremy.ch/og-image.png' },
                { property: 'og:image:width', content: '1200' },
                { property: 'og:image:height', content: '630' },
                { property: 'og:image:alt', content: 'Stéphanie & Jérémy — 18 juillet 2026 à Fribourg' },
                { property: 'og:locale', content: 'fr_CH' },
                { name: 'twitter:card', content: 'summary_large_image' },
                { name: 'twitter:title', content: 'Stéphanie & Jérémy — 18 juillet 2026' },
                {
                    name: 'twitter:description',
                    content: 'Mariage de Stéphanie et Jérémy le 18 juillet 2026 à Fribourg.',
                },
                { name: 'twitter:image', content: 'https://stephanie-jeremy.ch/og-image.png' },
            ],
            link: [
                { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
                { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico', sizes: '16x16 32x32 48x48' },
                { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
                { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
                { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
                {
                    rel: 'stylesheet',
                    href: 'https://fonts.googleapis.com/css2?family=Great+Vibes&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,400&family=Inter:wght@300;400;500;600&display=swap',
                },
            ],
        },
    },
});
