<template>
  <div class="app-form-grid" :class="[gapClass, collapseClass]" :style="gridStyle">
    <slot />
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  columns: { type: Number, default: 2 },
  gap: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg'].includes(value)
  },
  collapseAt: { type: String, default: 'md' }
})

const safeColumns = computed(() => {
  if ([1, 2, 3].includes(props.columns)) return props.columns
  return 2
})

const gridStyle = computed(() => ({
  '--form-grid-columns': safeColumns.value
}))

const gapClass = computed(() => {
  if (props.gap === 'sm') return 'gap-3'
  if (props.gap === 'lg') return 'gap-6'
  return 'gap-4'
})

const collapseClass = computed(() => {
  if (props.collapseAt === 'sm') return 'collapse-sm'
  if (props.collapseAt === 'lg') return 'collapse-lg'
  return 'collapse-md'
})
</script>

<style scoped>
.app-form-grid {
  display: grid;
  grid-template-columns: repeat(var(--form-grid-columns), minmax(0, 1fr));
}

@media (max-width: 639px) {
  .collapse-sm {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 767px) {
  .collapse-md {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 1023px) {
  .collapse-lg {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
