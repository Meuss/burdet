<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';

const figureRef = ref<HTMLElement | null>(null);
const shine = ref(false);
let observer: IntersectionObserver | null = null;

onMounted(() => {
    if (!figureRef.value) return;
    if (typeof IntersectionObserver === 'undefined') {
        shine.value = true;
        return;
    }
    observer = new IntersectionObserver(
        (entries) => {
            for (const entry of entries) {
                if (entry.isIntersecting) {
                    shine.value = true;
                    observer?.disconnect();
                    observer = null;
                }
            }
        },
        { threshold: 0.35 },
    );
    observer.observe(figureRef.value);
});

onBeforeUnmount(() => {
    observer?.disconnect();
    observer = null;
});
</script>

<template>
    <section class="px-6 py-20 md:py-28">
        <div class="mx-auto grid max-w-5xl items-center gap-12 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)] md:gap-16">
            <figure
                ref="figureRef"
                :class="[
                    'polaroid mx-auto w-full max-w-xs -rotate-2 bg-paper p-3 pb-4 shadow-xl ring-1 ring-black/5 transition duration-500 ease-emph-out hover:rotate-0 sm:p-4 sm:pb-5 md:max-w-sm',
                    { 'is-visible': shine },
                ]"
            >
                <div class="shine-wrap relative overflow-hidden bg-ink/5">
                    <NuxtImg
                        src="/vive-les-mariés.jpg"
                        alt="Stéphanie et Jérémy"
                        class="block h-auto w-full"
                        width="800"
                        height="1124"
                        loading="lazy"
                        sizes="(max-width: 768px) 80vw, 380px"
                    />
                </div>
            </figure>

            <div class="text-center">
                <h2 class="section-title">Le grand jour approche&nbsp;!</h2>
                <div class="mb-10 mt-6 flex justify-center">
                    <div class="rule"></div>
                </div>

                <div class="space-y-6 font-serif text-lg leading-relaxed text-ink md:text-xl">
                    <p>Nous sommes heureux de vous convier à notre mariage qui aura lieu le</p>
                    <p class="font-serif text-2xl text-gold md:text-3xl">samedi 18 juillet 2026</p>
                    <p>14h00</p>
                    <p>
                        Église Saint-Jean<br />
                        Planche supérieure 9<br />
                        1700 Fribourg
                    </p>
                    <p class="font-display text-3xl text-gold md:text-4xl">
                        Nous comptons sur vous pour mettre l&rsquo;ambiance&nbsp;!
                    </p>
                </div>
            </div>
        </div>
    </section>
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
}

.polaroid.is-visible .shine-wrap::after {
    animation: shine 1.4s cubic-bezier(0.23, 1, 0.32, 1) 0.25s forwards;
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

@media (prefers-reduced-motion: reduce) {
    .polaroid.is-visible .shine-wrap::after {
        animation: none;
    }
}
</style>
