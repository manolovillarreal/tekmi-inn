<template>
  <div class="border-t border-[#E5E7EB] pt-4" :class="containerClass">
    <slot name="extra" />

    <div class="flex items-center gap-2">
      <button
        type="button"
        class="touch-target rounded-md border border-transparent px-4 py-2 text-sm font-medium text-[#6B7280] hover:bg-[#F8F9FC]"
        :disabled="loading"
        @click="$emit('cancel')"
      >
        {{ cancelLabel }}
      </button>

      <button
        type="button"
        class="touch-target inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-60"
        :class="submitClass"
        :disabled="loading || submitDisabled"
        @click="$emit('submit')"
      >
        <svg v-if="loading" class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2" class="opacity-20" />
          <path d="M21 12a9 9 0 00-9-9" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        </svg>
        {{ submitLabel }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  loading: { type: Boolean, default: false },
  submitLabel: { type: String, default: 'Guardar' },
  cancelLabel: { type: String, default: 'Cancelar' },
  submitDisabled: { type: Boolean, default: false },
  destructive: { type: Boolean, default: false },
  align: {
    type: String,
    default: 'right',
    validator: (value) => ['right', 'between'].includes(value)
  }
})

defineEmits(['submit', 'cancel'])

const containerClass = computed(() => props.align === 'between' ? 'flex items-center justify-between gap-3' : 'flex items-center justify-end gap-3')
const submitClass = computed(() => props.destructive ? 'bg-[#EF4444] hover:bg-[#DC2626]' : 'bg-[#4C2FFF] hover:bg-[#2D1B69]')
</script>


