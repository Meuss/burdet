<template>
    <section class="bg-[#fafaf7] px-6 py-20 md:py-28">
        <div class="mx-auto max-w-4xl">
            <div class="text-center">
                <h2 class="section-title">Programme</h2>
                <div class="mb-12 mt-6 flex justify-center">
                    <div class="rule"></div>
                </div>
            </div>

            <div class="grid gap-12 md:grid-cols-3">
                <article class="text-center">
                    <p class="eyebrow">14h00</p>
                    <h3 class="mt-3 font-serif text-2xl font-light text-ink">Cérémonie religieuse</h3>
                    <div class="mt-4 font-serif text-base leading-relaxed text-ink/80">
                        <p>Église Saint-Jean</p>
                        <p>Planche supérieure 9</p>
                        <p>1700 Fribourg</p>
                    </div>
                    <a
                        href="https://www.google.com/maps/search/%C3%89glise+Saint-Jean/@46.8030029,7.1622697,190m/data=!3m2!1e3!4b1?entry=ttu&g_ep=EgoyMDI2MDQxOS4wIKXMDSoASAFQAw%3D%3D"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="mt-5 inline-flex items-center gap-2 border border-gold/50 px-4 py-2 font-sans text-[11px] uppercase tracking-widest text-gold transition duration-200 ease-emph-out hover:border-gold hover:bg-gold hover:text-paper active:scale-[0.97]"
                    >
                        <svg
                            class="h-3.5 w-3.5"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            aria-hidden="true"
                        >
                            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                            <circle cx="12" cy="10" r="3" />
                        </svg>
                        Voir sur la carte
                    </a>
                </article>

                <article class="text-center">
                    <p class="eyebrow">Après la cérémonie</p>
                    <h3 class="mt-3 font-serif text-2xl font-light text-ink">Apéritif</h3>
                </article>

                <article class="text-center">
                    <p class="eyebrow">En soirée</p>
                    <h3 class="mt-3 font-serif text-2xl font-light text-ink">Repas &amp; festivités</h3>
                    <p class="mt-4 font-serif text-base italic leading-relaxed text-ink/60">
                        Le lieu reste une surprise.
                    </p>
                </article>
            </div>
        </div>
    </section>
</template>
