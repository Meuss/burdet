<script setup lang="ts">
type YesNo = 'oui' | 'non' | '';

defineProps<{
    modelValue: YesNo;
    name: string;
    label: string;
    error?: string;
}>();

defineEmits<{
    (e: 'update:modelValue', value: YesNo): void;
}>();
</script>

<template>
    <div>
        <p class="font-serif text-base text-ink">{{ label }}</p>
        <div class="mt-3 flex gap-3">
            <label
                v-for="option in ['oui', 'non'] as const"
                :key="option"
                class="flex-1 cursor-pointer border border-ink/20 px-4 py-3 text-center font-sans text-xs uppercase tracking-widest transition duration-150 ease-emph-out focus-within:border-gold focus-within:ring-1 focus-within:ring-gold/40 active:scale-[0.98]"
                :class="
                    modelValue === option
                        ? 'border-gold bg-gold text-paper'
                        : 'text-ink/70 hover:border-gold hover:text-ink'
                "
            >
                <input
                    type="radio"
                    :name="name"
                    :value="option"
                    :checked="modelValue === option"
                    class="sr-only"
                    @change="$emit('update:modelValue', option)"
                />
                {{ option }}
            </label>
        </div>
        <Transition name="error">
            <p v-if="error" class="mt-1 text-sm text-red-700">{{ error }}</p>
        </Transition>
    </div>
</template>

<style scoped>
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

@media (prefers-reduced-motion: reduce) {
    .error-enter-active,
    .error-leave-active {
        transition-duration: 120ms;
    }
    .error-enter-from {
        transform: none;
    }
}
</style>
