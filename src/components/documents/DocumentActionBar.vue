<template>
  <div class="document-action-bar print:hidden" :class="mobile ? 'is-mobile' : 'is-desktop'">
    <button type="button" class="btn-secondary text-sm" :class="mobile ? 'w-full min-h-[44px]' : ''" @click="$emit('back')">
      {{ backLabel }}
    </button>

    <div class="flex items-center gap-2" :class="mobile ? 'w-full flex-col' : ''">
      <button
        type="button"
        class="btn-secondary text-sm"
        :class="mobile ? 'w-full min-h-[44px]' : ''"
        :disabled="disabled"
        @click="$emit('copy')"
      >
        Copiar para WhatsApp
      </button>
      <button
        type="button"
        class="btn-primary text-sm"
        :class="mobile ? 'w-full min-h-[44px]' : ''"
        :disabled="disabled"
        @click="$emit('print')"
      >
        Imprimir / Guardar PDF
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  mobile: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  backLabel: {
    type: String,
    default: '← Volver',
  },
})

defineEmits(['back', 'copy', 'print'])
</script>

<style scoped>
.document-action-bar {
  display: flex;
  gap: 8px;
}

.document-action-bar.is-desktop {
  position: sticky;
  top: 0;
  z-index: 20;
  margin-bottom: 16px;
  align-items: center;
  justify-content: space-between;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #ffffff;
  padding: 10px;
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.08);
}

.document-action-bar.is-mobile {
  position: fixed;
  left: 12px;
  right: 12px;
  bottom: 12px;
  z-index: 40;
  flex-direction: column;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.96);
  padding: 10px;
  backdrop-filter: blur(6px);
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.16);
}
</style>
