<template>
    <section class="px-6 pb-16 pt-8">
        <div class="mx-auto flex max-w-md justify-center">
            <figure
                class="polaroid -rotate-2 bg-paper p-3 pb-4 shadow-xl ring-1 ring-black/5 transition duration-500 ease-emph-out hover:rotate-0 sm:p-4 sm:pb-5"
            >
                <div class="overflow-hidden bg-ink/5">
                    <NuxtImg
                        src="/vive-les-mariés.jpg"
                        alt="Stéphanie et Jérémy"
                        class="block h-auto w-full"
                        width="560"
                        height="786"
                        loading="lazy"
                        sizes="(max-width: 640px) 80vw, 420px"
                    />
                </div>
                <figcaption class="mt-3 text-center font-display text-3xl leading-none text-gold">
                    Vive les mariés&nbsp;!
                </figcaption>
            </figure>
        </div>
    </section>
</template>

<style scoped>
.polaroid {
    transform-origin: center;
}
</style>
