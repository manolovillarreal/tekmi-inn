<template>
  <label class="inline-flex items-start gap-3" :class="disabled ? 'cursor-not-allowed' : 'cursor-pointer'">
    <button
      type="button"
      role="switch"
      :aria-checked="Boolean(modelValue)"
      :disabled="disabled || loading"
      class="relative inline-flex items-center rounded-full transition duration-200"
      :class="trackClass"
      @click="toggle"
    >
      <span class="inline-flex items-center justify-center rounded-full bg-white shadow-sm transition duration-200" :class="thumbClass">
        <svg v-if="loading" class="h-3 w-3 animate-spin text-[#6B7280]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2" class="opacity-20" />
          <path d="M21 12a9 9 0 00-9-9" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        </svg>
      </span>
    </button>

    <span class="space-y-0.5">
      <span class="block text-sm font-medium text-[#111827]">{{ label }}</span>
      <span v-if="description" class="block text-xs text-[#6B7280]">{{ description }}</span>
    </span>
  </label>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  label: { type: String, default: '' },
  description: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md'].includes(value)
  }
})

const emit = defineEmits(['update:modelValue'])

const sizeMap = computed(() => {
  if (props.size === 'sm') {
    return {
      track: 'h-5 w-9',
      thumb: 'h-4 w-4',
      on: 'translate-x-4',
      off: 'translate-x-0.5'
    }
  }

  return {
    track: 'h-6 w-11',
    thumb: 'h-5 w-5',
    on: 'translate-x-5',
    off: 'translate-x-0.5'
  }
})

const trackClass = computed(() => {
  const base = sizeMap.value.track
  if (props.disabled || props.loading) {
    return [base, 'bg-[#E5E7EB] opacity-70']
  }

  return [base, props.modelValue ? 'bg-[#4C2FFF]' : 'bg-[#E5E7EB]']
})

const thumbClass = computed(() => {
  return [
    sizeMap.value.thumb,
    props.modelValue ? sizeMap.value.on : sizeMap.value.off
  ]
})

const toggle = () => {
  if (props.disabled || props.loading) return
  emit('update:modelValue', !props.modelValue)
}
</script>
