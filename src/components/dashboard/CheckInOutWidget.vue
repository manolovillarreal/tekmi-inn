<template>
  <div class="card">
    <h2 class="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">Entradas y Salidas</h2>

    <div v-if="loading" class="py-4 text-center text-sm text-gray-400">Cargando...</div>
    <div v-else class="grid grid-cols-1 gap-6 sm:grid-cols-2">

      <!-- HOY -->
      <div>
        <p class="mb-3 text-sm font-semibold text-gray-800">Hoy</p>
        <div class="space-y-3">
          <div>
            <p class="mb-1.5 text-xs font-medium uppercase tracking-wide text-emerald-700">Entradas</p>
            <p v-if="todayEntradas.length === 0" class="text-xs italic text-gray-400">Ninguna</p>
            <div v-else class="space-y-1.5">
              <button
                v-for="item in todayEntradas"
                :key="'te-' + item.reservationId"
                type="button"
                class="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-left transition-shadow hover:border-gray-300 hover:shadow-sm"
                @click="goTo(item.reservationId)"
              >
                <div class="flex items-center justify-between gap-2">
                  <div class="min-w-0">
                    <p class="truncate text-sm font-semibold text-gray-900">{{ item.guestName }}</p>
                    <p class="truncate text-xs text-gray-500">{{ item.unitLabel }}</p>
                  </div>
                  <ReservationBadge :status="item.status" />
                </div>
              </button>
            </div>
          </div>

          <div>
            <p class="mb-1.5 text-xs font-medium uppercase tracking-wide text-orange-700">Salidas</p>
            <p v-if="todaySalidas.length === 0" class="text-xs italic text-gray-400">Ninguna</p>
            <div v-else class="space-y-1.5">
              <button
                v-for="item in todaySalidas"
                :key="'ts-' + item.reservationId"
                type="button"
                class="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-left transition-shadow hover:border-gray-300 hover:shadow-sm"
                @click="goTo(item.reservationId)"
              >
                <div class="flex items-center justify-between gap-2">
                  <div class="min-w-0">
                    <p class="truncate text-sm font-semibold text-gray-900">{{ item.guestName }}</p>
                    <p class="truncate text-xs text-gray-500">{{ item.unitLabel }}</p>
                  </div>
                  <ReservationBadge :status="item.status" />
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- MANANA -->
      <div>
        <p class="mb-3 text-sm font-semibold text-gray-800">Manana</p>
        <div class="space-y-3">
          <div>
            <p class="mb-1.5 text-xs font-medium uppercase tracking-wide text-emerald-700">Entradas</p>
            <p v-if="tomorrowEntradas.length === 0" class="text-xs italic text-gray-400">Ninguna</p>
            <div v-else class="space-y-1.5">
              <button
                v-for="item in tomorrowEntradas"
                :key="'mne-' + item.reservationId"
                type="button"
                class="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-left transition-shadow hover:border-gray-300 hover:shadow-sm"
                @click="goTo(item.reservationId)"
              >
                <div class="flex items-center justify-between gap-2">
                  <div class="min-w-0">
                    <p class="truncate text-sm font-semibold text-gray-900">{{ item.guestName }}</p>
                    <p class="truncate text-xs text-gray-500">{{ item.unitLabel }}</p>
                  </div>
                  <ReservationBadge :status="item.status" />
                </div>
              </button>
            </div>
          </div>

          <div>
            <p class="mb-1.5 text-xs font-medium uppercase tracking-wide text-orange-700">Salidas</p>
            <p v-if="tomorrowSalidas.length === 0" class="text-xs italic text-gray-400">Ninguna</p>
            <div v-else class="space-y-1.5">
              <button
                v-for="item in tomorrowSalidas"
                :key="'mns-' + item.reservationId"
                type="button"
                class="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-left transition-shadow hover:border-gray-300 hover:shadow-sm"
                @click="goTo(item.reservationId)"
              >
                <div class="flex items-center justify-between gap-2">
                  <div class="min-w-0">
                    <p class="truncate text-sm font-semibold text-gray-900">{{ item.guestName }}</p>
                    <p class="truncate text-xs text-gray-500">{{ item.unitLabel }}</p>
                  </div>
                  <ReservationBadge :status="item.status" />
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../../services/supabase'
import { useAccountStore } from '../../stores/account'
import ReservationBadge from '../ui/ReservationBadge.vue'

const router = useRouter()
const accountStore = useAccountStore()

const loading = ref(true)
const todayEntradas = ref([])
const todaySalidas = ref([])
const tomorrowEntradas = ref([])
const tomorrowSalidas = ref([])

const goTo = (id) => {
  router.push('/reservas/' + id)
}

const getLocalIso = (date) => {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}

onMounted(async () => {
  loading.value = true
  try {
    const accountId = accountStore.getRequiredAccountId()

    const todayDate = new Date()
    const tomorrowDate = new Date()
    tomorrowDate.setDate(tomorrowDate.getDate() + 1)

    const today = getLocalIso(todayDate)
    const tomorrowIso = getLocalIso(tomorrowDate)

    const orFilter = 'start_date.eq.' + today + ',end_date.eq.' + today + ',start_date.eq.' + tomorrowIso + ',end_date.eq.' + tomorrowIso

    const { data, error } = await supabase
      .from('occupancies')
      .select('reservation_id, units(name), reservations!inner(id, guest_name, status, check_in, check_out)')
      .eq('account_id', accountId)
      .eq('occupancy_type', 'reservation')
      .or(orFilter)

    if (error) throw error

    const resMap = new Map()
    for (const row of data || []) {
      const res = row.reservations
      if (!res) continue
      const key = row.reservation_id
      if (!resMap.has(key)) {
        resMap.set(key, {
          reservationId: key,
          guestName: res.guest_name || 'Huesped',
          status: res.status || '',
          checkIn: res.check_in ? String(res.check_in).slice(0, 10) : '',
          checkOut: res.check_out ? String(res.check_out).slice(0, 10) : '',
          unitNames: [],
        })
      }
      const unitName = row.units?.name
      if (unitName && !resMap.get(key).unitNames.includes(unitName)) {
        resMap.get(key).unitNames.push(unitName)
      }
    }

    const all = Array.from(resMap.values()).map((r) => ({
      ...r,
      unitLabel: r.unitNames.join(', '),
    }))

    todayEntradas.value = all.filter((r) => r.checkIn === today)
    todaySalidas.value = all.filter((r) => r.checkOut === today)
    tomorrowEntradas.value = all.filter((r) => r.checkIn === tomorrowIso)
    tomorrowSalidas.value = all.filter((r) => r.checkOut === tomorrowIso)
  } catch (e) {
    console.warn('[CheckInOutWidget] fetch failed:', e?.message)
  } finally {
    loading.value = false
  }
})
</script>