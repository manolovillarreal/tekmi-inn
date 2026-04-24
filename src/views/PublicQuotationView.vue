<template>
  <div class="min-h-screen bg-gray-100 px-4 py-10 pb-24">
    <div class="mx-auto max-w-2xl space-y-6">

      <!-- Loading -->
      <section v-if="state === 'loading'" class="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500 shadow-sm">
        Cargando cotización...
      </section>

      <!-- Not found -->
      <section v-else-if="state === 'not_found'" class="rounded-xl border border-red-200 bg-white p-8 text-center shadow-sm">
        <h2 class="text-xl font-semibold text-red-700">Cotización no encontrada</h2>
        <p class="mt-3 text-sm text-gray-600">El enlace puede ser inválido o la cotización fue eliminada.</p>
      </section>

      <!-- Content -->
      <template v-else-if="state === 'content' && data">
        <article class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7 space-y-5">

          <!-- Header -->
          <header class="border-b border-gray-100 pb-5 text-center">
            <img
              v-if="data.logo_url"
              :src="data.logo_url"
              :alt="data.business_name"
              class="mx-auto mb-3 h-16 w-16 rounded-xl border border-gray-200 bg-white object-contain"
            />
            <h1 class="text-2xl font-bold tracking-tight text-gray-900">{{ data.business_name }}</h1>
            <p class="mt-1 text-sm font-medium text-gray-500">Cotización de hospedaje</p>
            <p
              v-if="data.reference_code || data.quotation_number || data.quote_number"
              class="mt-3 inline-flex rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-600"
            >
              {{ data.reference_code || data.quotation_number || data.quote_number }}
            </p>
          </header>

          <!-- Estado -->
          <section class="space-y-2">
            <div v-if="data.is_expired" class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              ⚠️ Esta cotización ha vencido.
            </div>
            <div v-else-if="data.expiry_formatted" class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
              ✅ Cotización vigente hasta el {{ data.expiry_formatted }}.
            </div>
            <div v-else class="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
              ✅ Cotización vigente.
            </div>
          </section>

          <!-- Detalles estadía -->
          <section class="rounded-xl border border-gray-200 bg-gray-50 p-4 sm:p-5">
            <h2 class="text-base font-semibold text-gray-900">
              Hola {{ data.guest_name || 'Huésped' }} 👋
            </h2>
            <div class="mt-3 space-y-1.5 text-sm leading-relaxed text-gray-700">
              <p><strong>Check-in:</strong> {{ formatLong(data.check_in) }}</p>
              <p><strong>Check-out:</strong> {{ formatLong(data.check_out) }}</p>
              <p>
                {{ data.nights }} {{ data.nights === 1 ? 'noche' : 'noches' }} ·
                {{ data.total_guests }} {{ data.total_guests === 1 ? 'persona' : 'personas' }}
              </p>
              <p v-if="data.units_label"><strong>Unidades:</strong> {{ data.units_label }}</p>
            </div>
          </section>

          <!-- Precios -->
          <section v-if="data.price_per_night && data.nights > 0" class="rounded-xl border border-gray-200 bg-gray-50 p-4 sm:p-5">
            <h3 class="text-sm font-semibold uppercase tracking-wide text-gray-500">Detalle de precios</h3>
            <div class="mt-3 space-y-2 text-sm text-gray-700">
              <div class="flex items-center justify-between gap-3">
                <span>Precio por noche</span>
                <span class="font-medium text-gray-900">{{ formatCop(data.price_per_night) }}</span>
              </div>
              <div v-if="data.discount_percentage > 0" class="flex items-center justify-between gap-3 text-emerald-700">
                <span>Descuento ({{ data.discount_percentage }}%)</span>
                <span class="font-medium">-{{ formatCop(data.discount_amount) }}</span>
              </div>
              <div class="mt-2 border-t border-gray-200 pt-2 flex items-center justify-between gap-3 text-base font-bold text-gray-900">
                <span>Total</span>
                <span>{{ formatCop(data.total) }}</span>
              </div>
            </div>
          </section>

          <!-- Condiciones -->
          <section v-if="data.conditions || data.politica_reserva" class="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
            <h3 class="text-sm font-semibold uppercase tracking-wide text-gray-500">Condiciones y políticas</h3>

            <div v-if="data.conditions" class="mt-3 text-sm text-gray-700">
              <p class="font-medium text-gray-900">Condiciones del alojamiento</p>
              <p class="mt-1 whitespace-pre-wrap leading-relaxed">{{ data.conditions }}</p>
            </div>

            <div v-if="data.politica_reserva" class="mt-4 text-sm text-gray-700" :class="data.conditions ? 'border-t border-gray-100 pt-4' : ''">
              <p class="font-medium text-gray-900">Política de reserva</p>
              <p class="mt-1 whitespace-pre-wrap leading-relaxed">{{ data.politica_reserva }}</p>
            </div>
          </section>

          <!-- Footer -->
          <footer class="border-t border-gray-100 pt-4 text-center text-xs text-gray-500 space-y-1">
            <p>Para confirmar o consultar, contáctanos.</p>
            <p class="font-medium text-gray-700">{{ data.business_name }}</p>
          </footer>
        </article>

      </template>

    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const state = ref('loading')
const data = ref(null)

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '')

const formatLong = (value) => {
  if (!value) return '-'
  const date = new Date(`${value}T00:00:00Z`)
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}

const formatCop = (value) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(Number(value || 0))

onMounted(async () => {
  const token = route.params.token
  if (!token) {
    state.value = 'not_found'
    return
  }

  try {
    const res = await fetch(
      `${supabaseUrl}/functions/v1/public-quote?token=${encodeURIComponent(token)}&format=json`,
      { headers: { 'Content-Type': 'application/json' } }
    )

    if (!res.ok) {
      state.value = 'not_found'
      return
    }

    const json = await res.json()
    if (json?.error === 'not_found') {
      state.value = 'not_found'
      return
    }

    data.value = json
    state.value = 'content'
  } catch {
    state.value = 'not_found'
  }
})
</script>
