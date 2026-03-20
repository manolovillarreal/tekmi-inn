<template>
  <div class="p-3 sm:p-6 max-w-4xl mx-auto">
    <div class="mb-6 flex items-center gap-3">
      <button
        type="button"
        class="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-[#6B7280] hover:text-[#111827] transition-colors"
        title="Volver"
        @click="router.back()"
      >
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5" aria-hidden="true">
          <path d="M13 16l-5-6 5-6" />
        </svg>
      </button>
    </div>
    
    <ReservationForm />
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import ReservationForm from '../components/reservations/ReservationForm.vue'
const router = useRouter()
</script>
