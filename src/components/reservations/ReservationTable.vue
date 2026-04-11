<template>
  <div class="card overflow-hidden !p-0">
    <div v-if="isMobile" class="space-y-3 p-3">
      <div v-if="loading" class="rounded-lg border border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
        Cargando reservas...
      </div>
      <div v-else-if="reservations.length === 0" class="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
        No hay reservas para mostrar.
      </div>

      <DataCard
        v-for="res in reservations"
        v-else
        :key="res.id"
        :title="res.guest_display_name || 'Desconocido'"
        :subtitle="`${res.reservation_number || '-'} · ${res.reference_code || '-'}`"
        :badge="mobileBadge(res)"
        :meta="mobileMeta(res)"
        :actions="mobileActions(res)"
        :onClick="() => handleView(res)"
      />
    </div>

    <div v-else class="overflow-x-auto">
      <table class="w-full text-left border-collapse">
        <thead class="bg-gray-50 text-xs uppercase text-gray-500 font-semibold border-b border-gray-200">
          <tr>
            <th class="hidden xl:table-cell px-6 py-4">Nro</th>
            <th class="hidden xl:table-cell px-6 py-4">Código</th>
            <th class="px-6 py-4">Huésped</th>
            <th class="px-6 py-4">Unidades</th>
            <th class="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors" @click="sortBy('check_in')">
              <span class="inline-flex items-center gap-1">
                <span>Fechas</span>
                <span class="text-[10px] leading-none text-gray-400" :class="sortKey === 'check_in' ? 'text-gray-700' : ''">
                  {{ sortKey === 'check_in' ? (sortDir === 'asc' ? '↑' : sortDir === 'desc' ? '↓' : '↕') : '↕' }}
                </span>
              </span>
            </th>
            <th class="px-6 py-4 text-center">Noches</th>
            <th class="px-6 py-4">Estadía</th>
            <th class="px-6 py-4">Estado</th>
            <th v-if="showFinancialColumns" class="px-6 py-4">Montos</th>
            <th v-if="showFinancialColumns" class="px-6 py-4">Saldo</th>
            <th class="px-6 py-4 text-right">Acciones</th>
          </tr>
        </thead>
        
        <tbody class="divide-y divide-gray-200 text-sm">
          <tr v-if="loading">
            <td :colspan="tableColumnCount" class="px-6 py-12 text-center text-gray-400">Cargando reservas...</td>
          </tr>
          <tr v-else-if="reservations.length === 0">
            <td :colspan="tableColumnCount" class="px-6 py-12 text-center text-gray-500 italic">No hay reservas para mostrar.</td>
          </tr>
          
          <tr 
            v-for="res in reservations" 
            :key="res.id"
            class="cursor-pointer hover:bg-gray-50 transition-colors group"
            :class="getRowClass(res)"
            @click="handleView(res)"
          >
            <td class="hidden xl:table-cell px-6 py-4 font-mono text-xs text-gray-600">
              {{ res.reservation_number || '-' }}
            </td>

            <td class="hidden xl:table-cell px-6 py-4 font-mono text-xs text-gray-700">
              {{ res.reference_code || '-' }}
            </td>

            <!-- Huésped -->
            <td class="px-6 py-4 font-medium text-gray-900 border-l-[3px] border-transparent" :class="getLeftBorderClass(res)">
              {{ res.guest_display_name || 'Desconocido' }}
            </td>
            
            <!-- Unidades -->
            <td class="px-6 py-4 text-gray-600">{{ res.unit_names_display || 'Sin unidades' }}</td>
            
            <!-- Fechas -->
            <td class="px-6 py-4 whitespace-nowrap">
              <span class="block text-gray-900" :class="{'font-bold': isToday(res.check_in)}">{{ formatDate(res.check_in) }}</span>
              <span class="block text-gray-500 text-xs">hasta {{ formatDate(res.check_out) }}</span>
            </td>

            <!-- Noches -->
            <td class="px-6 py-4 text-center text-gray-700">
              {{ getReservationNights(res) }}
            </td>
            
            <!-- Estadía -->
            <td class="px-6 py-4 text-gray-600">
              <span class="block">{{ Number(res.adults || 0) + Number(res.children || 0) }} pax</span>
              <span class="block text-xs text-gray-400">{{ Number(res.adults || 0) }} ad / {{ Number(res.children || 0) }} ni</span>
              <span class="block text-xs text-gray-400">{{ res.source_display_label || formatSource(res.source) }}</span>
            </td>
            
            <!-- Estado -->
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="flex items-center gap-2">
                <ReservationBadge :status="res.status" />
              </div>
            </td>
            
            <!-- Total -->
            <td v-if="showFinancialColumns" class="px-6 py-4 text-gray-900">
              <span class="block whitespace-nowrap">Total: {{ res.total_amount != null ? `$${formatCurrency(res.total_amount)}` : '—' }}</span>
              <span class="block whitespace-nowrap text-xs text-gray-500">Pagado: ${{ formatCurrency(res.paid_amount || 0) }}</span>
              <span v-if="Number(res.commission_percentage || 0) > 0" class="mt-1 block text-xs text-gray-500">
                Comisión {{ getCommissionSummary(res).name }} ({{ getCommissionSummary(res).percentage }}%): ${{ formatCurrency(getCommissionSummary(res).amount) }} → Neto: ${{ formatCurrency(getCommissionSummary(res).netAmount) }}
              </span>
            </td>
            
            <!-- Saldo -->
            <td v-if="showFinancialColumns" class="px-6 py-4 whitespace-nowrap font-medium">
               <span v-if="res.balance === 0 || res.balance === '0'" class="text-emerald-600">Pagado</span>
               <span v-else-if="res.balance != null" class="text-red-600">${{ formatCurrency(res.balance) }}</span>
              <span v-else class="text-gray-400">—</span>
            </td>
            
            <!-- Acciones -->
            <td class="px-6 py-4 text-right" @click.stop>
              <div class="relative inline-block text-left">
                <button
                  class="touch-target inline-flex h-11 w-11 items-center justify-center rounded text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                  type="button"
                  @click.stop="toggleMenu(res.id)"
                >
                  ...
                </button>

                <div
                  v-if="openMenuId === res.id"
                  class="absolute right-0 z-10 mt-1 w-40 rounded-md border border-gray-200 bg-white py-1 shadow-lg"
                >
                  <button
                    v-if="res.guest_wa_url"
                    class="touch-target block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                    @click.stop="window.open(res.guest_wa_url, '_blank'); openMenuId = ''"
                  >
                    📱 WhatsApp
                  </button>
                  <button class="touch-target block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50" @click.stop="handleView(res)">
                    Ver detalle
                  </button>
                  <button
                    v-if="can('payments', 'create')"
                    class="touch-target block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                    @click.stop="handleRegisterPayment(res)"
                  >
                    Registrar pago
                  </button>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="flex items-center justify-between border-t border-gray-200 bg-white px-6 py-3 text-sm text-gray-600">
      <p>
        Mostrando {{ reservations.length }} de {{ totalCount }} reservas · Página {{ page }} de {{ totalPages }}
      </p>
      <div class="flex items-center gap-2">
        <button v-if="page > 1" class="btn-secondary text-sm" :disabled="loading" @click="$emit('page-change', page - 1)">Anterior</button>
        <button v-if="page < totalPages" class="btn-secondary text-sm" :disabled="loading" @click="$emit('page-change', page + 1)">Siguiente</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import ReservationBadge from '../ui/ReservationBadge.vue'
import DataCard from '../ui/DataCard.vue'
import { getCommissionSummary } from '../../utils/reservations'
import { usePermissions } from '../../composables/usePermissions'
import { useBreakpoint } from '../../composables/useBreakpoint'

const { can } = usePermissions()
const { isMobile } = useBreakpoint()

const props = defineProps({
  reservations: { type: Array, required: true },
  loading: { type: Boolean, default: false },
  sortKey: { type: String, default: 'check_in' },
  sortDir: { type: String, default: 'desc' },
  page: { type: Number, default: 1 },
  pageSize: { type: Number, default: 25 },
  totalCount: { type: Number, default: 0 }
})

const emit = defineEmits(['view', 'sort-change', 'page-change', 'register-payment'])
const openMenuId = ref('')

const totalPages = computed(() => {
  if (!props.pageSize || props.pageSize <= 0) return 1
  const pages = Math.ceil((props.totalCount || 0) / props.pageSize)
  return pages > 0 ? pages : 1
})

const showFinancialColumns = computed(() => {
  return can('payments', 'view') || can('reports', 'view_financial')
})

const tableColumnCount = computed(() => (showFinancialColumns.value ? 9 : 7))

const sortBy = (key) => {
  if (key === 'check_in') {
    emit('sort-change', 'check_in')
  }
}

const toggleMenu = (reservationId) => {
  openMenuId.value = openMenuId.value === reservationId ? '' : reservationId
}

const handleView = (reservation) => {
  openMenuId.value = ''
  emit('view', reservation)
}

const handleRegisterPayment = (reservation) => {
  openMenuId.value = ''
  emit('register-payment', reservation)
}

const isToday = (dateStr) => {
  const d = new Date()
  const today = d.toISOString().split('T')[0]
  return dateStr === today
}

const getRowClass = (res) => {
  if (res.status === 'in_stay' && isToday(res.check_in)) return 'bg-emerald-50/30'
  return ''
}

const getLeftBorderClass = (res) => {
  return ''
}

const formatDate = (ds) => {
  if(!ds) return '-'
  return new Date(ds).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', timeZone: 'UTC' })
}

const formatCurrency = (val) => Number(val).toLocaleString('es-CO')

const formatSource = (src) => {
  const map = { whatsapp: 'WhatsApp', instagram: 'Instagram', telefono: 'Teléfono', directo: 'Directo', agencia: 'Agencia' }
  return map[src] || src
}

const getReservationNights = (reservation) => {
  const checkIn = reservation?.check_in
  const checkOut = reservation?.check_out
  if (!checkIn || !checkOut) return '—'

  const start = new Date(checkIn)
  const end = new Date(checkOut)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return '—'

  const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24))
  return Number.isFinite(nights) && nights >= 0 ? nights : '—'
}

const mobileBadge = (res) => {
  const map = {
    confirmed: { label: 'Confirmada', type: 'info' },
    in_stay: { label: 'En estadia', type: 'success' },
    completed: { label: 'Finalizada', type: 'ghost' },
    cancelled: { label: 'Cancelada', type: 'danger' }
  }

  return map[res.status] || { label: res.status || 'Sin estado', type: 'ghost' }
}

const mobileMeta = (res) => {
  const meta = [
    { label: 'Fechas', value: `${formatDate(res.check_in)} -> ${formatDate(res.check_out)}` },
    { label: 'Noches', value: String(getReservationNights(res)) },
    { label: 'Unidades', value: res.unit_names_display || 'Sin unidades' },
    { label: 'Personas', value: `${Number(res.adults || 0) + Number(res.children || 0)} pax` },
    { label: 'Origen', value: res.source_display_label || formatSource(res.source) || '-' }
  ]

  if (showFinancialColumns.value) {
    meta.push({ label: 'Total', value: res.total_amount != null ? `$${formatCurrency(res.total_amount)}` : '—' })
    meta.push({ label: 'Saldo', value: res.balance === 0 || res.balance === '0' ? 'Pagado' : res.balance != null ? `$${formatCurrency(res.balance)}` : '—' })
  }

  return meta
}

const mobileActions = (res) => {
  const actions = []

  if (res.guest_wa_url) {
    actions.push({ label: '📱 WhatsApp', type: 'whatsapp', handler: () => window.open(res.guest_wa_url, '_blank') })
  }

  actions.push({ label: 'Ver detalle', type: 'primary', handler: () => handleView(res) })

  if (can('payments', 'create')) {
    actions.push({ label: 'Pago', type: 'ghost', handler: () => handleRegisterPayment(res) })
  }

  return actions
}
</script>



