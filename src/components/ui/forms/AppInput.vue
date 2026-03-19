<template>
  <div class="space-y-1">
    <label v-if="label" :for="inputId" class="block text-sm font-medium transition-colors" :class="labelClass">
      {{ label }}
      <span v-if="required" class="ml-0.5 text-[#EF4444]">*</span>
    </label>

    <div class="relative">
      <div
        v-if="hasPrefixContent"
        class="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center pl-3 text-sm text-[#6B7280]"
      >
        <slot name="prefix">
          <span v-if="prefix">{{ prefix }}</span>
          <svg v-else-if="iconLeft" viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4" aria-hidden="true">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16z" clip-rule="evenodd" />
          </svg>
        </slot>
      </div>

      <input
        :id="inputId"
        :value="inputValue"
        :type="type"
        :placeholder="placeholder"
        :required="required"
        :disabled="disabled || loading"
        :readonly="readonly"
        :maxlength="maxLength || null"
        class="block w-full rounded-md border bg-[#FFFFFF] text-sm text-[#111827] placeholder:text-[#9CA3AF] transition outline-none"
        :class="inputClass"
        @input="onInput"
        @focus="onFocus"
        @blur="onBlur"
      >

      <div
        v-if="hasSuffixContent"
        class="pointer-events-none absolute inset-y-0 right-0 z-10 flex items-center pr-3 text-sm text-[#6B7280]"
      >
        <slot name="suffix">
          <span v-if="suffix">{{ suffix }}</span>
          <svg v-else-if="iconRight" viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4" aria-hidden="true">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16z" clip-rule="evenodd" />
          </svg>
        </slot>
      </div>

      <div v-if="loading" class="pointer-events-none absolute inset-y-0 right-0 z-20 flex items-center pr-3">
        <svg class="h-4 w-4 animate-spin text-[#6B7280]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2" class="opacity-20" />
          <path d="M21 12a9 9 0 00-9-9" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        </svg>
      </div>

      <div v-else-if="success && !error" class="pointer-events-none absolute inset-y-0 right-0 z-20 flex items-center pr-3 text-[#10B981]">
        <svg viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4" aria-hidden="true">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.03-9.28a.75.75 0 10-1.06-1.06L9.25 10.38 8.03 9.16a.75.75 0 10-1.06 1.06l1.75 1.75a.75.75 0 001.06 0l3.25-3.25z" clip-rule="evenodd" />
        </svg>
      </div>
    </div>

    <div v-if="showFooter" class="flex items-start justify-between gap-2">
      <AppFieldHint
        :message="error || hint || ''"
        :type="error ? 'error' : success ? 'success' : 'hint'"
      />
      <p v-if="maxLength" class="shrink-0 text-xs text-[#6B7280]">
        {{ counterText }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, useSlots } from 'vue'
import AppFieldHint from './AppFieldHint.vue'

const props = defineProps({
  modelValue: { type: [String, Number, Boolean, Object, Array, Date], default: '' },
  label: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  type: { type: String, default: 'text' },
  required: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  readonly: { type: Boolean, default: false },
  error: { type: String, default: '' },
  hint: { type: String, default: '' },
  success: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  iconLeft: { type: String, default: '' },
  iconRight: { type: String, default: '' },
  maxLength: { type: Number, default: null },
  prefix: { type: String, default: '' },
  suffix: { type: String, default: '' }
})

const emit = defineEmits(['update:modelValue', 'focus', 'blur'])

const slots = useSlots()
const isFocused = ref(false)
const inputId = `app-input-${Math.random().toString(36).slice(2, 10)}`

const inputValue = computed(() => {
  if (props.modelValue === null || props.modelValue === undefined) return ''
  return props.modelValue
})

const hasPrefixContent = computed(() => Boolean(slots.prefix || props.prefix || props.iconLeft))
const hasSuffixContent = computed(() => Boolean(slots.suffix || props.suffix || props.iconRight))

const leftPaddingClass = computed(() => (hasPrefixContent.value ? 'pl-10' : 'pl-3'))
const rightPaddingClass = computed(() => {
  if (props.loading || props.success || hasSuffixContent.value) return 'pr-10'
  return 'pr-3'
})

const labelClass = computed(() => {
  if (props.error) return 'text-[#EF4444]'
  if (isFocused.value) return 'text-[#4C2FFF]'
  return 'text-[#6B7280]'
})

const inputClass = computed(() => {
  if (props.disabled || props.loading) {
    return [
      'cursor-not-allowed border-[#E5E7EB] bg-[#F8F9FC] text-[#9CA3AF]',
      leftPaddingClass.value,
      rightPaddingClass.value
    ]
  }

  if (props.error) {
    return [
      'border-[#EF4444] ring-[3px] ring-[rgba(239,68,68,0.20)]',
      leftPaddingClass.value,
      rightPaddingClass.value
    ]
  }

  if (props.success) {
    return [
      'border-[#10B981] focus:border-[#10B981] focus:ring-[3px] focus:ring-[rgba(16,185,129,0.20)]',
      leftPaddingClass.value,
      rightPaddingClass.value
    ]
  }

  return [
    'border-[#E5E7EB] focus:border-[#4C2FFF] focus:ring-[3px] focus:ring-[rgba(76,47,255,0.20)]',
    leftPaddingClass.value,
    rightPaddingClass.value
  ]
})

const currentLength = computed(() => String(inputValue.value ?? '').length)
const counterText = computed(() => `${currentLength.value}/${props.maxLength}`)
const showFooter = computed(() => Boolean(props.error || props.hint || props.maxLength))

const onInput = (event) => {
  emit('update:modelValue', event.target.value)
}

const onFocus = (event) => {
  isFocused.value = true
  emit('focus', event)
}

const onBlur = (event) => {
  isFocused.value = false
  emit('blur', event)
}
</script>
