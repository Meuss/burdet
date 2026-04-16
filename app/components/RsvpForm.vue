<script setup lang="ts">
import { computed, reactive, ref } from 'vue';

type YesNo = 'oui' | 'non' | '';

interface FormState {
    fullName: string;
    plusOne: string;
    address: string;
    phone: string;
    email: string;
    transportBus: YesNo;
    transportTaxi: YesNo;
    transportSelf: YesNo;
    dietary: string;
    message: string;
    // honeypot
    website: string;
}

const form = reactive<FormState>({
    fullName: '',
    plusOne: '',
    address: '',
    phone: '',
    email: '',
    transportBus: '',
    transportTaxi: '',
    transportSelf: '',
    dietary: '',
    message: '',
    website: '',
});

type Status = 'idle' | 'submitting' | 'success' | 'error';
const status = ref<Status>('idle');
const errorMessage = ref('');
const validationErrors = ref<Record<string, string>>({});

const isSubmitting = computed(() => status.value === 'submitting');

function encodeForNetlify(data: Record<string, string>): string {
    return Object.keys(data)
        .map((key) => encodeURIComponent(key) + '=' + encodeURIComponent(data[key] ?? ''))
        .join('&');
}

function validate(): boolean {
    const errors: Record<string, string> = {};
    if (!form.fullName.trim()) errors.fullName = 'Merci d’indiquer votre nom et prénom.';
    if (!form.address.trim()) errors.address = 'Merci d’indiquer votre adresse complète.';
    if (!form.phone.trim()) errors.phone = 'Merci d’indiquer un numéro de téléphone.';
    if (!form.transportBus) errors.transportBus = 'Merci de répondre.';
    if (!form.transportTaxi) errors.transportTaxi = 'Merci de répondre.';
    if (!form.transportSelf) errors.transportSelf = 'Merci de répondre.';
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) {
        errors.email = 'Adresse e-mail invalide.';
    }
    validationErrors.value = errors;
    return Object.keys(errors).length === 0;
}

async function onSubmit() {
    errorMessage.value = '';
    if (!validate()) return;

    status.value = 'submitting';

    const payload = {
        fullName: form.fullName.trim(),
        plusOne: form.plusOne.trim(),
        address: form.address.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        transportBus: form.transportBus,
        transportTaxi: form.transportTaxi,
        transportSelf: form.transportSelf,
        dietary: form.dietary.trim(),
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
    }
}
</script>

<template>
    <section id="rsvp" class="px-6 py-20 md:py-28">
        <div class="mx-auto max-w-2xl">
            <div class="text-center">
                <h2 class="section-title">Confirmer ma présence</h2>
                <div class="mb-10 mt-6 flex justify-center">
                    <div class="rule"></div>
                </div>
                <p class="font-serif text-base leading-relaxed text-ink/80">
                    Merci de remplir ce formulaire afin que nous puissions tout préparer pour vous accueillir.
                </p>
            </div>

            <div v-if="status === 'success'" class="mt-12 border border-gold/40 bg-[#fafaf7] p-10 text-center">
                <p class="font-display text-4xl text-gold">Merci&nbsp;!</p>
                <p class="mt-4 font-serif text-lg text-ink/80">
                    Votre réponse a bien été enregistrée. Nous avons hâte de célébrer ce moment avec vous.
                </p>
            </div>

            <form v-else class="mt-12 space-y-8" novalidate @submit.prevent="onSubmit">
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
                            class="mt-2 w-full border-b border-ink/30 bg-transparent px-0 py-2 font-serif text-lg text-ink placeholder:text-ink/30 focus:border-gold focus:outline-none"
                            :class="{ 'border-red-600': validationErrors.fullName }"
                        />
                        <p v-if="validationErrors.fullName" class="mt-1 text-sm text-red-700">
                            {{ validationErrors.fullName }}
                        </p>
                    </div>

                    <div class="md:col-span-2">
                        <label class="eyebrow block" for="plusOne">Nom et prénom de l’accompagnant·e</label>
                        <input
                            id="plusOne"
                            v-model="form.plusOne"
                            type="text"
                            class="mt-2 w-full border-b border-ink/30 bg-transparent px-0 py-2 font-serif text-lg text-ink placeholder:text-ink/30 focus:border-gold focus:outline-none"
                        />
                    </div>

                    <div class="md:col-span-2">
                        <label class="eyebrow block" for="address">Adresse, ville, code postal *</label>
                        <textarea
                            id="address"
                            v-model="form.address"
                            rows="2"
                            autocomplete="street-address"
                            required
                            class="mt-2 w-full resize-none border-b border-ink/30 bg-transparent px-0 py-2 font-serif text-lg text-ink placeholder:text-ink/30 focus:border-gold focus:outline-none"
                            :class="{ 'border-red-600': validationErrors.address }"
                        ></textarea>
                        <p v-if="validationErrors.address" class="mt-1 text-sm text-red-700">
                            {{ validationErrors.address }}
                        </p>
                    </div>

                    <div>
                        <label class="eyebrow block" for="phone">Téléphone *</label>
                        <input
                            id="phone"
                            v-model="form.phone"
                            type="tel"
                            autocomplete="tel"
                            required
                            class="mt-2 w-full border-b border-ink/30 bg-transparent px-0 py-2 font-serif text-lg text-ink placeholder:text-ink/30 focus:border-gold focus:outline-none"
                            :class="{ 'border-red-600': validationErrors.phone }"
                        />
                        <p v-if="validationErrors.phone" class="mt-1 text-sm text-red-700">
                            {{ validationErrors.phone }}
                        </p>
                    </div>

                    <div>
                        <label class="eyebrow block" for="email">E-mail</label>
                        <input
                            id="email"
                            v-model="form.email"
                            type="email"
                            autocomplete="email"
                            class="mt-2 w-full border-b border-ink/30 bg-transparent px-0 py-2 font-serif text-lg text-ink placeholder:text-ink/30 focus:border-gold focus:outline-none"
                            :class="{ 'border-red-600': validationErrors.email }"
                        />
                        <p v-if="validationErrors.email" class="mt-1 text-sm text-red-700">
                            {{ validationErrors.email }}
                        </p>
                    </div>
                </div>

                <fieldset class="space-y-6 border-t border-gold/30 pt-8">
                    <legend class="eyebrow">Transports</legend>

                    <RsvpYesNo
                        v-model="form.transportBus"
                        name="transportBus"
                        label="Je souhaite bénéficier du transport entre la cérémonie et la réception *"
                        :error="validationErrors.transportBus"
                    />
                    <RsvpYesNo
                        v-model="form.transportTaxi"
                        name="transportTaxi"
                        label="Je pense contacter le taxi pour mon retour (ne m’engage à rien) *"
                        :error="validationErrors.transportTaxi"
                    />
                    <RsvpYesNo
                        v-model="form.transportSelf"
                        name="transportSelf"
                        label="Je me débrouille pour les déplacements *"
                        :error="validationErrors.transportSelf"
                    />
                </fieldset>

                <div class="border-t border-gold/30 pt-8">
                    <label class="eyebrow block" for="dietary">Restrictions alimentaires</label>
                    <textarea
                        id="dietary"
                        v-model="form.dietary"
                        rows="2"
                        placeholder="Allergies, régime particulier…"
                        class="mt-2 w-full resize-none border-b border-ink/30 bg-transparent px-0 py-2 font-serif text-lg text-ink placeholder:text-ink/30 focus:border-gold focus:outline-none"
                    ></textarea>
                </div>

                <div>
                    <label class="eyebrow block" for="message">Un petit mot pour les mariés</label>
                    <textarea
                        id="message"
                        v-model="form.message"
                        rows="4"
                        class="mt-2 w-full resize-none border-b border-ink/30 bg-transparent px-0 py-2 font-serif text-lg text-ink placeholder:text-ink/30 focus:border-gold focus:outline-none"
                    ></textarea>
                </div>

                <p v-if="status === 'error'" class="text-center font-serif text-base text-red-700">
                    {{ errorMessage }}
                </p>

                <div class="flex justify-center pt-4">
                    <button
                        type="submit"
                        :disabled="isSubmitting"
                        class="inline-flex items-center justify-center border border-gold bg-gold px-10 py-3 font-sans text-xs uppercase tracking-widest text-paper transition-colors hover:bg-gold-dark disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {{ isSubmitting ? 'Envoi…' : 'Envoyer ma réponse' }}
                    </button>
                </div>
            </form>
        </div>
    </section>
</template>
