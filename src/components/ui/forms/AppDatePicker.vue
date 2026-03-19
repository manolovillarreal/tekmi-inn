<template>
  <div class="space-y-1">
    <label v-if="label" class="block text-sm font-medium transition-colors" :class="labelClass">
      {{ label }}
    </label>

    <div class="relative">
      <input
        :value="inputValue"
        type="date"
        :min="min || null"
        :max="max || null"
        :placeholder="placeholder"
        :disabled="disabled"
        class="block w-full rounded-md border bg-[#FFFFFF] px-3 pr-10 py-2 text-sm text-[#111827] transition outline-none"
        :class="inputClass"
        @input="onInput"
        @focus="isFocused = true"
        @blur="isFocused = false"
      >

      <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-[#6B7280]">
        <svg viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4" aria-hidden="true">
          <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v9a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm10 7H4v6h12V9z" clip-rule="evenodd" />
        </svg>
      </div>
    </div>

    <AppFieldHint :message="error || hint || ''" :type="error ? 'error' : 'hint'" />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import AppFieldHint from './AppFieldHint.vue'

const props = defineProps({
  modelValue: { type: String, default: null },
  label: { type: String, default: '' },
  min: { type: String, default: '' },
  max: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  error: { type: String, default: '' },
  hint: { type: String, default: '' },
  placeholder: { type: String, default: '' }
})

const emit = defineEmits(['update:modelValue'])

const isFocused = ref(false)

const inputValue = computed(() => props.modelValue || '')

const labelClass = computed(() => {
  if (props.error) return 'text-[#EF4444]'
  if (isFocused.value) return 'text-[#4C2FFF]'
  return 'text-[#6B7280]'
})

const inputClass = computed(() => {
  if (props.disabled) return 'cursor-not-allowed border-[#E5E7EB] bg-[#F8F9FC] text-[#9CA3AF]'
  if (props.error) return 'border-[#EF4444] ring-[3px] ring-[rgba(239,68,68,0.20)]'
  return 'border-[#E5E7EB] focus:border-[#4C2FFF] focus:ring-[3px] focus:ring-[rgba(76,47,255,0.20)]'
})

const onInput = (event) => {
  const value = event.target.value
  emit('update:modelValue', value === '' ? null : value)
}
</script>
