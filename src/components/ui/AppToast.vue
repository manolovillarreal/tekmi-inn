<template>
  <Teleport to="body">
    <div class="pointer-events-none fixed bottom-4 right-4 z-[120] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toastStore.toasts"
          :key="toast.id"
          class="pointer-events-auto rounded-lg border px-4 py-3 shadow-2xl"
          :class="typeClassMap[toast.type] || typeClassMap.info"
          role="status"
          aria-live="polite"
        >
          <div class="flex items-start justify-between gap-3">
            <p class="text-sm font-semibold leading-5">{{ toast.message }}</p>
            <button
              class="shrink-0 text-xs font-semibold opacity-80 transition-opacity hover:opacity-100"
              type="button"
              @click="toastStore.removeToast(toast.id)"
            >
              Cerrar
            </button>
          </div>
          <div v-if="toast.actions?.length" class="mt-2 flex flex-wrap gap-3">
            <button
              v-for="action in toast.actions"
              :key="action.label"
              type="button"
              class="text-xs font-bold underline opacity-90 transition-opacity hover:opacity-100"
              @click="action.callback(); toastStore.removeToast(toast.id)"
            >
              {{ action.label }}
            </button>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { useToastStore } from '../../stores/toast'

const toastStore = useToastStore()

const typeClassMap = {
  success: 'bg-[#059669] border-[#047857] text-white',
  error: 'bg-[#DC2626] border-[#B91C1C] text-white',
  info: 'bg-[#2563EB] border-[#1D4ED8] text-white',
  warning: 'bg-[#EA580C] border-[#C2410C] text-white',
}
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
