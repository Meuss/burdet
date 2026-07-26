<template>
    <main class="flex min-h-dvh items-center justify-center px-6 py-12">
        <div
            class="grid w-full max-w-4xl items-center justify-items-center gap-12 text-center md:grid-cols-2 md:gap-16"
        >
            <figure
                class="polaroid w-full max-w-[min(260px,38vh)] -rotate-2 bg-paper p-3 pb-4 shadow-xl ring-1 ring-black/5 transition duration-500 ease-emph-out hover:rotate-0 sm:p-4 sm:pb-5 md:max-w-[min(320px,60vh)]"
            >
                <div class="shine-wrap relative overflow-hidden bg-ink/5">
                    <NuxtImg
                        src="/vive-les-mariés.jpg"
                        alt="Stéphanie et Jérémy"
                        class="block h-auto w-full"
                        width="800"
                        height="1124"
                        sizes="(max-width: 768px) 70vw, 320px"
                    />
                </div>
            </figure>

            <div>
                <h1 class="reveal font-serif text-3xl font-light leading-snug text-gold md:text-4xl">
                    Merci d'avoir partagé<br />
                    ce jour avec nous
                </h1>

                <div class="reveal reveal-late mt-10 flex flex-col items-center gap-6">
                    <div class="rule"></div>
                    <p class="font-display text-4xl text-gold md:text-5xl">Stéphanie &amp; Jérémy</p>
                    <p class="font-serif text-sm uppercase tracking-widest text-ink/60">
                        18 juillet 2026 &middot; Fribourg
                    </p>
                </div>
            </div>
        </div>
    </main>
</template>

<style scoped>
.shine-wrap::after {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: linear-gradient(
        115deg,
        transparent 38%,
        rgba(255, 255, 255, 0.18) 46%,
        rgba(255, 255, 255, 0.55) 50%,
        rgba(255, 255, 255, 0.18) 54%,
        transparent 62%
    );
    transform: translateX(-130%);
    opacity: 0;
    animation: shine 1.4s cubic-bezier(0.23, 1, 0.32, 1) 0.6s forwards;
}

@keyframes shine {
    0% {
        transform: translateX(-130%);
        opacity: 0;
    }
    15% {
        opacity: 1;
    }
    85% {
        opacity: 1;
    }
    100% {
        transform: translateX(130%);
        opacity: 0;
    }
}

.reveal {
    opacity: 0;
    animation: reveal 0.9s cubic-bezier(0.23, 1, 0.32, 1) 0.3s forwards;
}

.reveal-late {
    animation-delay: 0.5s;
}

@keyframes reveal {
    from {
        opacity: 0;
        transform: translateY(12px);
    }
    to {
        opacity: 1;
        transform: none;
    }
}

@media (prefers-reduced-motion: reduce) {
    .shine-wrap::after {
        animation: none;
    }

    .reveal {
        opacity: 1;
        animation: none;
    }
}
</style>
