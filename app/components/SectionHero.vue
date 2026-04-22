<template>
    <section class="relative flex min-h-[90vh] flex-col items-center justify-center px-6 py-24 text-center">
        <p class="eyebrow mb-8">Samedi 18 juillet 2026 &middot; Fribourg</p>

        <h1 class="flex flex-col items-center gap-2 font-display text-6xl leading-none md:text-8xl">
            <span class="text-gold">Stéphanie</span>
            <span class="font-serif text-2xl uppercase tracking-widest text-ink md:text-3xl">&amp;</span>
            <span class="text-gold">Jérémy</span>
        </h1>

        <div class="mt-12 flex flex-col items-center gap-4">
            <div class="rule"></div>
            <p class="font-serif text-lg uppercase tracking-widest text-ink md:text-xl">
                18.07.2026
                <span class="mx-3 text-gold">|</span>
                14:00
                <span class="mx-3 text-gold">|</span>
                Fribourg
            </p>
            <div class="rule"></div>
        </div>

        <a
            href="#rsvp"
            class="mt-16 inline-block border border-gold px-8 py-3 font-sans text-xs uppercase tracking-widest text-gold transition duration-200 ease-emph-out hover:bg-gold hover:text-paper active:scale-[0.97]"
        >
            Confirmer ma présence
        </a>

        <svg
            class="heart-draw mt-14 h-16 w-40 text-gold md:h-20 md:w-52"
            viewBox="0 0 200 80"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
        >
            <path
                pathLength="1"
                d="M 30 48 C 10 40, 8 18, 28 12 C 42 8, 50 22, 52 35 C 54 22, 62 8, 76 12 C 96 18, 94 40, 74 48 C 62 55, 52 62, 50 55 C 60 55, 82 52, 100 49 C 120 46, 142 48, 160 52 C 172 55, 180 60, 178 64 C 176 67, 170 66, 170 62 C 170 60, 174 60, 174 58"
            />
        </svg>
    </section>
</template>

<style scoped>
.heart-draw path {
    stroke-dasharray: 1;
    stroke-dashoffset: 1;
    animation: heart-draw 2s cubic-bezier(0.65, 0, 0.35, 1) 0.4s forwards;
}

@media (prefers-reduced-motion: reduce) {
    .heart-draw path {
        animation: none;
        stroke-dashoffset: 0;
    }
}

@keyframes heart-draw {
    to {
        stroke-dashoffset: 0;
    }
}
</style>
