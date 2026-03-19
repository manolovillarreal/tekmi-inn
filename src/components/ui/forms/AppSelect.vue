<template>
  <div class="space-y-1">
    <label v-if="label" :for="selectId" class="block text-sm font-medium transition-colors" :class="labelClass">
      {{ label }}
    </label>

    <div class="relative">
      <select
        :id="selectId"
        :value="selectValue"
        :multiple="multiple"
        :disabled="disabled || loading"
        class="block w-full rounded-md border bg-[#FFFFFF] pl-3 text-sm text-[#111827] transition outline-none"
        :class="selectClass"
        @change="onChange"
        @focus="isFocused = true"
        @blur="isFocused = false"
      >
        <option v-if="!multiple" value="">{{ placeholder }}</option>
        <option
          v-for="option in options"
          :key="option.value"
          :value="option.value"
          :disabled="option.disabled"
        >
          {{ option.label }}
        </option>
      </select>

      <button
        v-if="showClear"
        type="button"
        class="absolute inset-y-0 right-8 flex items-center pr-1 text-[#6B7280] hover:text-[#111827]"
        @click="clearValue"
      >
        <span class="text-base leading-none">×</span>
      </button>

      <div v-if="loading" class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
        <svg class="h-4 w-4 animate-spin text-[#6B7280]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2" class="opacity-20" />
          <path d="M21 12a9 9 0 00-9-9" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        </svg>
      </div>

      <div v-else class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-[#6B7280]">
        <svg viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4" aria-hidden="true">
          <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clip-rule="evenodd" />
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
  modelValue: { type: [String, Number, Array, Object, Boolean], default: '' },
  label: { type: String, default: '' },
  options: { type: Array, default: () => [] },
  placeholder: { type: String, default: 'Seleccionar...' },
  disabled: { type: Boolean, default: false },
  error: { type: String, default: '' },
  hint: { type: String, default: '' },
  loading: { type: Boolean, default: false },
  multiple: { type: Boolean, default: false },
  clearable: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue', 'change'])

const isFocused = ref(false)
const selectId = `app-select-${Math.random().toString(36).slice(2, 10)}`

const selectValue = computed(() => {
  if (props.multiple) return Array.isArray(props.modelValue) ? props.modelValue : []
  return props.modelValue ?? ''
})

const hasValue = computed(() => {
  if (props.multiple) return Array.isArray(selectValue.value) && selectValue.value.length > 0
  return selectValue.value !== '' && selectValue.value !== null && selectValue.value !== undefined
})

const showClear = computed(() => props.clearable && !props.disabled && !props.loading && hasValue.value)

const labelClass = computed(() => {
  if (props.error) return 'text-[#EF4444]'
  if (isFocused.value) return 'text-[#4C2FFF]'
  return 'text-[#6B7280]'
})

const selectClass = computed(() => {
  if (props.disabled || props.loading) {
    return 'cursor-not-allowed border-[#E5E7EB] bg-[#F8F9FC] pr-10 text-[#9CA3AF]'
  }

  if (props.error) {
    return 'border-[#EF4444] pr-10 ring-[3px] ring-[rgba(239,68,68,0.20)]'
  }

  return 'border-[#E5E7EB] pr-10 focus:border-[#4C2FFF] focus:ring-[3px] focus:ring-[rgba(76,47,255,0.20)]'
})

const clearValue = () => {
  const next = props.multiple ? [] : ''
  emit('update:modelValue', next)
  emit('change', next)
}

const onChange = (event) => {
  let next

  if (props.multiple) {
    next = Array.from(event.target.selectedOptions).map((option) => option.value)
  } else {
    next = event.target.value
  }

  emit('update:modelValue', next)
  emit('change', next)
}
</script>
