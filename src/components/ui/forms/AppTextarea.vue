<template>
  <div class="space-y-1">
    <label v-if="label" class="block text-sm font-medium transition-colors" :class="labelClass">
      {{ label }}
    </label>

    <textarea
      ref="textareaRef"
      :value="textareaValue"
      :rows="rows"
      :placeholder="placeholder"
      :maxlength="maxLength || null"
      :disabled="disabled"
      class="block w-full rounded-md border bg-[#FFFFFF] px-3 py-2 text-sm text-[#111827] placeholder:text-[#9CA3AF] transition outline-none"
      :class="textareaClass"
      @input="onInput"
      @focus="isFocused = true"
      @blur="isFocused = false"
    ></textarea>

    <div class="flex items-start justify-between gap-2">
      <AppFieldHint :message="error || hint || ''" :type="error ? 'error' : 'hint'" />
      <p v-if="maxLength" class="shrink-0 text-xs text-[#6B7280]">{{ counterText }}</p>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import AppFieldHint from './AppFieldHint.vue'

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  label: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  rows: { type: Number, default: 3 },
  autoResize: { type: Boolean, default: false },
  maxLength: { type: Number, default: null },
  disabled: { type: Boolean, default: false },
  error: { type: String, default: '' },
  hint: { type: String, default: '' }
})

const emit = defineEmits(['update:modelValue'])

const isFocused = ref(false)
const textareaRef = ref(null)

const textareaValue = computed(() => props.modelValue ?? '')

const labelClass = computed(() => {
  if (props.error) return 'text-[#EF4444]'
  if (isFocused.value) return 'text-[#4C2FFF]'
  return 'text-[#6B7280]'
})

const textareaClass = computed(() => {
  if (props.disabled) return 'cursor-not-allowed border-[#E5E7EB] bg-[#F8F9FC] text-[#9CA3AF]'
  if (props.error) return 'border-[#EF4444] ring-[3px] ring-[rgba(239,68,68,0.20)]'
  return 'border-[#E5E7EB] focus:border-[#4C2FFF] focus:ring-[3px] focus:ring-[rgba(76,47,255,0.20)]'
})

const counterText = computed(() => `${String(textareaValue.value).length}/${props.maxLength}`)

const resizeIfNeeded = async () => {
  if (!props.autoResize || !textareaRef.value) return
  await nextTick()
  textareaRef.value.style.height = 'auto'
  textareaRef.value.style.height = `${textareaRef.value.scrollHeight}px`
}

const onInput = (event) => {
  emit('update:modelValue', event.target.value)
  if (props.autoResize) {
    event.target.style.height = 'auto'
    event.target.style.height = `${event.target.scrollHeight}px`
  }
}

watch(() => props.modelValue, () => {
  resizeIfNeeded()
}, { immediate: true })
</script>
