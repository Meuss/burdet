<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref } from 'vue';

type YesNo = 'oui' | 'non' | '';

interface FormState {
    fullName: string;
    plusOne: string;
    address: string;
    locality: string;
    email: string;
    childrenCount: string;
    dietary: string;
    ownVehicle: YesNo;
    message: string;
    // honeypot
    website: string;
}

const form = reactive<FormState>({
    fullName: '',
    plusOne: '',
    address: '',
    locality: '',
    email: '',
    childrenCount: '',
    dietary: '',
    ownVehicle: '',
    message: '',
    website: '',
});

type Status = 'idle' | 'submitting' | 'success' | 'error';
const status = ref<Status>('idle');
const errorMessage = ref('');
const validationErrors = ref<Record<string, string>>({});

const isSubmitting = computed(() => status.value === 'submitting');

const showSlowMessage = ref(false);
let slowMessageTimer: ReturnType<typeof setTimeout> | null = null;

function startSubmitFeedback() {
    showSlowMessage.value = false;
    if (slowMessageTimer) clearTimeout(slowMessageTimer);
    slowMessageTimer = setTimeout(() => {
        if (status.value === 'submitting') showSlowMessage.value = true;
    }, 800);
}

function stopSubmitFeedback() {
    if (slowMessageTimer) {
        clearTimeout(slowMessageTimer);
        slowMessageTimer = null;
    }
    showSlowMessage.value = false;
}

onBeforeUnmount(stopSubmitFeedback);

function encodeForNetlify(data: Record<string, string>): string {
    return Object.keys(data)
        .map((key) => encodeURIComponent(key) + '=' + encodeURIComponent(data[key] ?? ''))
        .join('&');
}

function validate(): boolean {
    const errors: Record<string, string> = {};
    if (!form.fullName.trim()) errors.fullName = 'Merci d’indiquer votre nom et prénom.';
    if (!form.address.trim()) errors.address = 'Merci d’indiquer votre adresse.';
    if (!form.locality.trim()) errors.locality = 'Merci d’indiquer votre localité.';
    if (!form.ownVehicle) errors.ownVehicle = 'Merci de répondre.';
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) {
        errors.email = 'Adresse e-mail invalide.';
    }
    if (form.childrenCount && !/^\d+$/.test(form.childrenCount.trim())) {
        errors.childrenCount = 'Merci d’indiquer un nombre.';
    }
    validationErrors.value = errors;
    return Object.keys(errors).length === 0;
}

async function onSubmit() {
    errorMessage.value = '';
    if (!validate()) return;

    status.value = 'submitting';
    startSubmitFeedback();

    const payload = {
        fullName: form.fullName.trim(),
        plusOne: form.plusOne.trim(),
        address: form.address.trim(),
        locality: form.locality.trim(),
        email: form.email.trim(),
        childrenCount: form.childrenCount.trim(),
        dietary: form.dietary.trim(),
        ownVehicle: form.ownVehicle,
        message: form.message.trim(),
        website: form.website,
    };

    try {
        const res = await fetch('/.netlify/functions/submit-rsvp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(body.message ?? `Erreur ${res.status}`);
        }

        // Fire-and-forget Netlify Forms submission (belt-and-braces backup).
        fetch('/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: encodeForNetlify({ 'form-name': 'rsvp', ...payload }),
        }).catch(() => {
            /* best-effort — server already captured the primary sinks */
        });

        status.value = 'success';
    } catch (err) {
        status.value = 'error';
        errorMessage.value =
            err instanceof Error ? err.message : 'Une erreur inattendue est survenue. Merci de réessayer.';
    } finally {
        stopSubmitFeedback();
    }
}
</script>

<template>
    <section id="rsvp" class="px-6 py-20 md:py-28">
        <div class="mx-auto max-w-2xl">
            <div class="text-center">
                <h2 class="section-title">Inscription</h2>
                <div class="mb-10 mt-6 flex justify-center">
                    <div class="rule"></div>
                </div>
                <p class="font-serif text-base leading-relaxed text-ink/80">
                    Merci de remplir ce formulaire pour confirmer votre participation.
                </p>
            </div>

            <Transition name="swap" mode="out-in">
                <div
                    v-if="status === 'success'"
                    key="success"
                    class="mt-12 border border-gold/40 bg-[#fafaf7] p-10 text-center"
                >
                    <p class="font-display text-4xl text-gold">Merci&nbsp;!</p>
                    <p class="mt-4 font-serif text-lg text-ink/80">
                        Votre réponse a bien été enregistrée. Nous avons hâte de célébrer ce moment avec vous.
                    </p>
                </div>

                <form v-else key="form" class="mt-12 space-y-8" novalidate @submit.prevent="onSubmit">
                    <!-- Honeypot -->
                    <div class="hidden" aria-hidden="true">
                        <label>
                            Ne pas remplir
                            <input v-model="form.website" type="text" name="website" tabindex="-1" autocomplete="off" />
                        </label>
                    </div>

                    <div class="grid gap-6 md:grid-cols-2">
                        <div class="md:col-span-2">
                            <label class="eyebrow block" for="fullName">Nom et prénom *</label>
                            <input
                                id="fullName"
                                v-model="form.fullName"
                                type="text"
                                autocomplete="name"
                                required
                                class="mt-2 w-full border-b border-ink/30 bg-transparent px-0 py-2 font-serif text-lg text-ink transition-colors duration-150 ease-out placeholder:text-ink/30 focus:border-gold focus:outline-none"
                                :class="{ 'border-red-600': validationErrors.fullName }"
                            />
                            <Transition name="error">
                                <p v-if="validationErrors.fullName" class="mt-1 text-sm text-red-700">
                                    {{ validationErrors.fullName }}
                                </p>
                            </Transition>
                        </div>

                        <div class="md:col-span-2">
                            <label class="eyebrow block" for="plusOne">Nom et prénom de l’accompagnant·e</label>
                            <input
                                id="plusOne"
                                v-model="form.plusOne"
                                type="text"
                                class="mt-2 w-full border-b border-ink/30 bg-transparent px-0 py-2 font-serif text-lg text-ink transition-colors duration-150 ease-out placeholder:text-ink/30 focus:border-gold focus:outline-none"
                            />
                        </div>

                        <div class="md:col-span-2">
                            <label class="eyebrow block" for="address">Adresse *</label>
                            <input
                                id="address"
                                v-model="form.address"
                                type="text"
                                autocomplete="street-address"
                                required
                                class="mt-2 w-full border-b border-ink/30 bg-transparent px-0 py-2 font-serif text-lg text-ink transition-colors duration-150 ease-out placeholder:text-ink/30 focus:border-gold focus:outline-none"
                                :class="{ 'border-red-600': validationErrors.address }"
                            />
                            <Transition name="error">
                                <p v-if="validationErrors.address" class="mt-1 text-sm text-red-700">
                                    {{ validationErrors.address }}
                                </p>
                            </Transition>
                        </div>

                        <div class="md:col-span-2">
                            <label class="eyebrow block" for="locality">Localité *</label>
                            <input
                                id="locality"
                                v-model="form.locality"
                                type="text"
                                autocomplete="address-level2"
                                required
                                class="mt-2 w-full border-b border-ink/30 bg-transparent px-0 py-2 font-serif text-lg text-ink transition-colors duration-150 ease-out placeholder:text-ink/30 focus:border-gold focus:outline-none"
                                :class="{ 'border-red-600': validationErrors.locality }"
                            />
                            <Transition name="error">
                                <p v-if="validationErrors.locality" class="mt-1 text-sm text-red-700">
                                    {{ validationErrors.locality }}
                                </p>
                            </Transition>
                        </div>

                        <div class="md:col-span-2">
                            <label class="eyebrow block" for="email">Adresse e-mail</label>
                            <input
                                id="email"
                                v-model="form.email"
                                type="email"
                                autocomplete="email"
                                class="mt-2 w-full border-b border-ink/30 bg-transparent px-0 py-2 font-serif text-lg text-ink transition-colors duration-150 ease-out placeholder:text-ink/30 focus:border-gold focus:outline-none"
                                :class="{ 'border-red-600': validationErrors.email }"
                            />
                            <Transition name="error">
                                <p v-if="validationErrors.email" class="mt-1 text-sm text-red-700">
                                    {{ validationErrors.email }}
                                </p>
                            </Transition>
                        </div>

                        <div class="md:col-span-2">
                            <label class="eyebrow block" for="childrenCount">Nombre d'enfants présents</label>
                            <input
                                id="childrenCount"
                                v-model="form.childrenCount"
                                type="text"
                                inputmode="numeric"
                                class="mt-2 w-full border-b border-ink/30 bg-transparent px-0 py-2 font-serif text-lg text-ink transition-colors duration-150 ease-out placeholder:text-ink/30 focus:border-gold focus:outline-none"
                                :class="{ 'border-red-600': validationErrors.childrenCount }"
                            />
                            <Transition name="error">
                                <p v-if="validationErrors.childrenCount" class="mt-1 text-sm text-red-700">
                                    {{ validationErrors.childrenCount }}
                                </p>
                            </Transition>
                        </div>
                    </div>

                    <div class="border-t border-gold/30 pt-8">
                        <label class="eyebrow block" for="dietary">Restrictions alimentaires</label>
                        <textarea
                            id="dietary"
                            v-model="form.dietary"
                            rows="2"
                            placeholder="Allergies, régime particulier…"
                            class="mt-2 w-full resize-none border-b border-ink/30 bg-transparent px-0 py-2 font-serif text-lg text-ink transition-colors duration-150 ease-out placeholder:text-ink/30 focus:border-gold focus:outline-none"
                        ></textarea>
                    </div>

                    <div class="border-t border-gold/30 pt-8">
                        <RsvpYesNo
                            v-model="form.ownVehicle"
                            name="ownVehicle"
                            label="Préférez-vous vous déplacer avec votre propre véhicule ? *"
                            :error="validationErrors.ownVehicle"
                        />
                    </div>

                    <div>
                        <label class="eyebrow block" for="message">Un petit mot pour les mariés</label>
                        <textarea
                            id="message"
                            v-model="form.message"
                            rows="4"
                            class="mt-2 w-full resize-none border-b border-ink/30 bg-transparent px-0 py-2 font-serif text-lg text-ink transition-colors duration-150 ease-out placeholder:text-ink/30 focus:border-gold focus:outline-none"
                        ></textarea>
                    </div>

                    <Transition name="error">
                        <p v-if="status === 'error'" class="text-center font-serif text-base text-red-700">
                            {{ errorMessage }}
                        </p>
                    </Transition>

                    <div class="flex flex-col items-center pt-4">
                        <button
                            type="submit"
                            :disabled="isSubmitting"
                            :aria-busy="isSubmitting"
                            :class="[
                                'submit-btn relative inline-flex min-w-[15rem] items-center justify-center overflow-hidden border border-gold bg-gold px-10 py-3 font-sans text-xs uppercase tracking-widest text-paper transition duration-200 ease-emph-out hover:bg-gold-dark active:scale-[0.98] disabled:cursor-progress disabled:active:scale-100',
                                { 'is-submitting': isSubmitting },
                            ]"
                        >
                            <Transition name="btn-swap" mode="out-in">
                                <span
                                    v-if="isSubmitting"
                                    key="loading"
                                    class="inline-flex items-center gap-2.5"
                                    aria-live="polite"
                                >
                                    <svg
                                        class="spinner h-4 w-4"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        aria-hidden="true"
                                    >
                                        <circle
                                            cx="12"
                                            cy="12"
                                            r="9"
                                            stroke="currentColor"
                                            stroke-opacity="0.3"
                                            stroke-width="2.5"
                                        />
                                        <path
                                            d="M21 12a9 9 0 0 0-9-9"
                                            stroke="currentColor"
                                            stroke-width="2.5"
                                            stroke-linecap="round"
                                        />
                                    </svg>
                                    <span>Envoi en cours</span>
                                </span>
                                <span v-else key="idle">Envoyer ma réponse</span>
                            </Transition>
                        </button>

                        <Transition name="hint">
                            <p
                                v-if="showSlowMessage"
                                class="mt-4 font-serif text-sm italic leading-relaxed text-ink/60"
                                aria-live="polite"
                            >
                                Cela peut prendre quelques instants, merci de patienter…
                            </p>
                        </Transition>
                    </div>
                </form>
            </Transition>
        </div>
    </section>
</template>

<style scoped>
.swap-enter-active {
    transition:
        opacity 260ms cubic-bezier(0.23, 1, 0.32, 1),
        transform 260ms cubic-bezier(0.23, 1, 0.32, 1);
}
.swap-leave-active {
    transition:
        opacity 160ms cubic-bezier(0.23, 1, 0.32, 1),
        transform 160ms cubic-bezier(0.23, 1, 0.32, 1);
}
.swap-enter-from {
    opacity: 0;
    transform: scale(0.97);
}
.swap-leave-to {
    opacity: 0;
    transform: scale(0.98);
}

.error-enter-active {
    transition:
        opacity 180ms cubic-bezier(0.23, 1, 0.32, 1),
        transform 180ms cubic-bezier(0.23, 1, 0.32, 1);
}
.error-leave-active {
    transition: opacity 120ms ease-out;
}
.error-enter-from {
    opacity: 0;
    transform: translateY(-4px);
}
.error-leave-to {
    opacity: 0;
}

.btn-swap-enter-active,
.btn-swap-leave-active {
    transition:
        opacity 160ms cubic-bezier(0.23, 1, 0.32, 1),
        transform 160ms cubic-bezier(0.23, 1, 0.32, 1);
}
.btn-swap-enter-from {
    opacity: 0;
    transform: translateY(4px);
}
.btn-swap-leave-to {
    opacity: 0;
    transform: translateY(-4px);
}

.spinner {
    animation: spinner-rotate 0.9s linear infinite;
}
@keyframes spinner-rotate {
    to {
        transform: rotate(360deg);
    }
}

.submit-btn.is-submitting {
    cursor: progress;
}
.submit-btn.is-submitting::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(
        110deg,
        transparent 30%,
        rgba(255, 255, 255, 0.18) 45%,
        rgba(255, 255, 255, 0.32) 50%,
        rgba(255, 255, 255, 0.18) 55%,
        transparent 70%
    );
    transform: translateX(-100%);
    animation: btn-shimmer 1.6s cubic-bezier(0.4, 0, 0.2, 1) infinite;
    pointer-events: none;
}
@keyframes btn-shimmer {
    to {
        transform: translateX(100%);
    }
}

.hint-enter-active {
    transition:
        opacity 320ms cubic-bezier(0.23, 1, 0.32, 1),
        transform 320ms cubic-bezier(0.23, 1, 0.32, 1);
}
.hint-leave-active {
    transition:
        opacity 200ms ease-out,
        transform 200ms ease-out;
}
.hint-enter-from {
    opacity: 0;
    transform: translateY(6px);
}
.hint-leave-to {
    opacity: 0;
    transform: translateY(-2px);
}

@media (prefers-reduced-motion: reduce) {
    .swap-enter-active,
    .swap-leave-active,
    .error-enter-active,
    .error-leave-active,
    .btn-swap-enter-active,
    .btn-swap-leave-active,
    .hint-enter-active,
    .hint-leave-active {
        transition-duration: 120ms;
    }
    .swap-enter-from,
    .swap-leave-to,
    .error-enter-from,
    .btn-swap-enter-from,
    .btn-swap-leave-to,
    .hint-enter-from,
    .hint-leave-to {
        transform: none;
    }
    .spinner {
        animation: spinner-rotate 2.4s linear infinite;
    }
    .submit-btn.is-submitting::after {
        animation: none;
        display: none;
    }
}
</style>
