<template>
  <section class="space-y-4">
    <header class="flex items-start justify-between gap-3" :class="divider ? 'pb-3 border-b border-[#E5E7EB]' : ''">
      <div>
        <h3 class="text-sm font-medium text-[#111827]">{{ title }}</h3>
        <p v-if="description" class="mt-1 text-[13px] text-[#6B7280]">{{ description }}</p>
      </div>

      <div class="flex items-center gap-2">
        <slot name="actions" />
        <button
          v-if="collapsible"
          type="button"
          class="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F8F9FC]"
          @click="toggle"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4 transition-transform" :class="isOpen ? 'rotate-180' : ''" aria-hidden="true">
            <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
    </header>

    <Transition name="app-section-collapse">
      <div v-show="isOpen" class="space-y-4">
        <slot />
      </div>
    </Transition>
  </section>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  collapsible: { type: Boolean, default: false },
  defaultOpen: { type: Boolean, default: true },
  divider: { type: Boolean, default: true }
})

const isOpen = ref(props.defaultOpen)

watch(() => props.defaultOpen, (value) => {
  isOpen.value = value
})

const toggle = () => {
  if (!props.collapsible) return
  isOpen.value = !isOpen.value
}
</script>

<style scoped>
.app-section-collapse-enter-active,
.app-section-collapse-leave-active {
  transition: all 200ms ease;
  overflow: hidden;
}

.app-section-collapse-enter-from,
.app-section-collapse-leave-to {
  opacity: 0;
  max-height: 0;
}

.app-section-collapse-enter-to,
.app-section-collapse-leave-from {
  opacity: 1;
  max-height: 800px;
}
</style>
