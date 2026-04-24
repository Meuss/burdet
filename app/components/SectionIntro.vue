<template>
    <section class="px-6 py-20 md:py-28">
        <div
            class="mx-auto grid max-w-5xl items-center gap-12 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)] md:gap-16"
        >
            <figure class="mx-auto w-full max-w-sm md:max-w-none">
                <div class="relative">
                    <div class="absolute -inset-2 border border-gold/40 md:-inset-3" aria-hidden="true"></div>
                    <NuxtImg
                        src="/vive-les-mariés.jpg"
                        alt="Stéphanie et Jérémy"
                        class="relative block h-auto w-full"
                        width="800"
                        height="1124"
                        loading="lazy"
                        sizes="(max-width: 768px) 90vw, 480px"
                    />
                </div>
            </figure>

            <div class="text-center">
                <h2 class="section-title">On se marie&nbsp;!</h2>
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
                    <p>Merci d&rsquo;être à nos côtés pour cette belle aventure.</p>
                    <p class="font-display text-3xl text-gold md:text-4xl">
                        On compte sur vous pour mettre l&rsquo;ambiance&nbsp;!
                    </p>
                </div>
            </div>
        </div>
    </section>
</template>
