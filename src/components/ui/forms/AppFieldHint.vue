<template>
  <p v-if="message" class="flex items-center gap-1 text-xs" :class="hintClass">
    <span v-if="type === 'error'" class="inline-flex h-3.5 w-3.5 items-center justify-center">
      <svg viewBox="0 0 20 20" fill="currentColor" class="h-3.5 w-3.5" aria-hidden="true">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.53-10.78a.75.75 0 00-1.06-1.06L10 8.69 7.53 6.22a.75.75 0 10-1.06 1.06L8.94 9.75l-2.47 2.47a.75.75 0 101.06 1.06L10 10.81l2.47 2.47a.75.75 0 101.06-1.06L11.06 9.75l2.47-2.47z" clip-rule="evenodd" />
      </svg>
    </span>
    <span v-else-if="type === 'success'" class="inline-flex h-3.5 w-3.5 items-center justify-center">
      <svg viewBox="0 0 20 20" fill="currentColor" class="h-3.5 w-3.5" aria-hidden="true">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.03-9.28a.75.75 0 10-1.06-1.06L9.25 10.38 8.03 9.16a.75.75 0 10-1.06 1.06l1.75 1.75a.75.75 0 001.06 0l3.25-3.25z" clip-rule="evenodd" />
      </svg>
    </span>
    <span>{{ message }}</span>
  </p>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  message: { type: String, default: '' },
  type: {
    type: String,
    default: 'hint',
    validator: (value) => ['hint', 'error', 'success'].includes(value)
  }
})

const hintClass = computed(() => {
  if (props.type === 'error') return 'text-[#EF4444]'
  if (props.type === 'success') return 'text-[#10B981]'
  return 'text-[#6B7280]'
})
</script>
