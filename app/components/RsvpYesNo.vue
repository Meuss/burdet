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
                class="flex-1 cursor-pointer border border-ink/20 px-4 py-3 text-center font-sans text-xs uppercase tracking-widest transition-colors"
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
        <p v-if="error" class="mt-1 text-sm text-red-700">{{ error }}</p>
    </div>
</template>
