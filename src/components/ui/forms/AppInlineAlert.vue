<template>
  <div v-if="visible" class="relative rounded-lg border p-3" :class="alertClass">
    <div class="flex items-start gap-2">
      <span class="mt-0.5 shrink-0" :class="iconClass">
        <svg v-if="type === 'error'" viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4" aria-hidden="true">
          <path fill-rule="evenodd" d="M18 10A8 8 0 112 10a8 8 0 0116 0zm-8-4a.75.75 0 00-.75.75v4.5a.75.75 0 001.5 0v-4.5A.75.75 0 0010 6zm0 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
        </svg>
        <svg v-else-if="type === 'warning'" viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4" aria-hidden="true">
          <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.72-1.36 3.485 0l5.58 9.92c.75 1.332-.213 2.981-1.742 2.981H4.42c-1.53 0-2.492-1.65-1.743-2.982l5.58-9.92zM11 7a1 1 0 10-2 0v3a1 1 0 102 0V7zm-1 7a1.25 1.25 0 100-2.5A1.25 1.25 0 0010 14z" clip-rule="evenodd" />
        </svg>
        <svg v-else-if="type === 'success'" viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4" aria-hidden="true">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.03-9.28a.75.75 0 10-1.06-1.06L9.25 10.38 8.03 9.16a.75.75 0 10-1.06 1.06l1.75 1.75a.75.75 0 001.06 0l3.25-3.25z" clip-rule="evenodd" />
        </svg>
        <svg v-else viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4" aria-hidden="true">
          <path fill-rule="evenodd" d="M18 10A8 8 0 112 10a8 8 0 0116 0zm-8-4a.75.75 0 00-.75.75v.5a.75.75 0 001.5 0v-.5A.75.75 0 0010 6zm.75 4a.75.75 0 00-1.5 0v4a.75.75 0 001.5 0v-4z" clip-rule="evenodd" />
        </svg>
      </span>

      <div class="min-w-0 flex-1">
        <p v-if="title" class="text-sm font-semibold">{{ title }}</p>
        <p v-if="message" class="mt-1 text-sm">{{ message }}</p>
        <div v-if="$slots.default" class="mt-2 text-sm">
          <slot />
        </div>
        <div v-if="$slots.actions" class="mt-3 flex flex-wrap items-center gap-2">
          <slot name="actions" />
        </div>
      </div>
    </div>

    <button
      v-if="dismissible"
      type="button"
      class="absolute right-2 top-2 text-sm opacity-80 hover:opacity-100"
      :class="iconClass"
      @click="visible = false"
    >
      ×
    </button>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  type: {
    type: String,
    default: 'info',
    validator: (value) => ['error', 'warning', 'info', 'success'].includes(value)
  },
  title: { type: String, default: '' },
  message: { type: String, default: '' },
  dismissible: { type: Boolean, default: false }
})

const visible = ref(true)

watch(() => [props.type, props.title, props.message], () => {
  visible.value = true
})

const alertClass = computed(() => {
  if (props.type === 'error') return 'border-l-[3px] border-[#FCA5A5] bg-[#FEF2F2] text-[#991B1B]'
  if (props.type === 'warning') return 'border-l-[3px] border-[#FCD34D] bg-[#FFF7ED] text-[#92400E]'
  if (props.type === 'success') return 'border-l-[3px] border-[#6EE7B7] bg-[#ECFDF5] text-[#065F46]'
  return 'border-l-[3px] border-[#BFDBFE] bg-[#EFF6FF] text-[#1D4ED8]'
})

const iconClass = computed(() => {
  if (props.type === 'error') return 'text-[#991B1B]'
  if (props.type === 'warning') return 'text-[#92400E]'
  if (props.type === 'success') return 'text-[#065F46]'
  return 'text-[#1D4ED8]'
})
</script>
