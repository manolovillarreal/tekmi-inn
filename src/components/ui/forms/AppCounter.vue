<template>
  <div class="space-y-1">
    <label v-if="label" class="block text-sm font-medium text-[#6B7280]">{{ label }}</label>

    <div class="inline-flex items-center rounded-md border border-[#E5E7EB] bg-[#FFFFFF]">
      <button
        type="button"
        :disabled="isDecreaseDisabled"
        class="inline-flex items-center justify-center border-r border-[#E5E7EB] text-[#111827] transition"
        :class="buttonClass"
        @click="decrease"
      >
        -
      </button>

      <input
        :value="displayValue"
        type="text"
        readonly
        :disabled="disabled"
        class="border-0 bg-transparent text-center font-medium text-[#111827] outline-none"
        :class="inputClass"
      >

      <button
        type="button"
        :disabled="isIncreaseDisabled"
        class="inline-flex items-center justify-center border-l border-[#E5E7EB] text-[#111827] transition"
        :class="buttonClass"
        @click="increase"
      >
        +
      </button>
    </div>

    <AppFieldHint :message="hint" type="hint" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import AppFieldHint from './AppFieldHint.vue'

const props = defineProps({
  modelValue: { type: Number, default: 0 },
  label: { type: String, default: '' },
  min: { type: Number, default: 0 },
  max: { type: Number, default: null },
  step: { type: Number, default: 1 },
  disabled: { type: Boolean, default: false },
  hint: { type: String, default: '' },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md'].includes(value)
  }
})

const emit = defineEmits(['update:modelValue'])

const safeValue = computed(() => Number.isFinite(Number(props.modelValue)) ? Number(props.modelValue) : props.min)
const displayValue = computed(() => String(safeValue.value))

const isDecreaseDisabled = computed(() => props.disabled || safeValue.value <= props.min)
const isIncreaseDisabled = computed(() => {
  if (props.disabled) return true
  if (props.max === null || props.max === undefined) return false
  return safeValue.value >= props.max
})

const buttonClass = computed(() => {
  const sizeClass = props.size === 'sm' ? 'h-11 w-11 text-sm' : 'h-11 w-11 text-base'
  return [
    sizeClass,
    'hover:bg-[#F8F9FC] active:bg-[#EEF2FF] active:border-[#4C2FFF] disabled:cursor-not-allowed disabled:bg-[#F8F9FC] disabled:text-[#9CA3AF]'
  ]
})

const inputClass = computed(() => props.size === 'sm' ? 'h-11 w-12 text-sm' : 'h-11 w-14 text-base')

const decrease = () => {
  if (isDecreaseDisabled.value) return
  emit('update:modelValue', safeValue.value - props.step)
}

const increase = () => {
  if (isIncreaseDisabled.value) return
  emit('update:modelValue', safeValue.value + props.step)
}
</script>


