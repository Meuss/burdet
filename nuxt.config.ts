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
            ],
            link: [
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
