<template>
  <section
    class="rounded-lg bg-[#FFFFFF]"
    :class="containerClass"
  >
    <header v-if="title || subtitle" class="mb-3">
      <p v-if="title" class="text-[12px] font-semibold uppercase tracking-wide text-[#6B7280]">{{ title }}</p>
      <p v-if="subtitle" class="mt-1 text-xs text-[#6B7280]">{{ subtitle }}</p>
    </header>

    <div class="grid" :class="gridClass">
      <slot />
    </div>

    <footer v-if="$slots.footer" class="mt-3 border-t border-[#E5E7EB] pt-3">
      <slot name="footer" />
    </footer>
  </section>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  tone: {
    type: String,
    default: 'neutral',
    validator: (value) => ['neutral', 'info', 'warning', 'error'].includes(value)
  },
  columns: { type: Number, default: 1 },
  compact: { type: Boolean, default: false },
  border: { type: Boolean, default: true }
})

const containerClass = computed(() => {
  const classes = []

  if (props.border) classes.push('border border-[#E5E7EB]')
  classes.push(props.compact ? 'p-3' : 'p-4')

  if (props.tone === 'info') classes.push('border-l-[3px] border-l-[#2563EB]')
  if (props.tone === 'warning') classes.push('border-l-[3px] border-l-[#F59E0B]')
  if (props.tone === 'error') classes.push('border-l-[3px] border-l-[#EF4444]')

  return classes
})

const gridClass = computed(() => {
  if (props.columns === 3) return 'grid-cols-1 gap-4 md:grid-cols-3'
  if (props.columns === 2) return 'grid-cols-1 gap-4 md:grid-cols-2'
  return 'grid-cols-1 gap-4'
})
</script>
