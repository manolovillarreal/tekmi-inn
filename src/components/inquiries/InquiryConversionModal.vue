<template>
  <BaseModal :isOpen="isOpen" title="Convertir en reserva" @close="handleClose">
    <form class="space-y-4" @submit.prevent="submitConversion">
      <p class="font-mono text-xs text-gray-500">Consulta: {{ props.inquiry?.inquiry_number || '-' }}</p>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label class="block text-sm font-medium text-gray-700">Nombre</label>
          <input v-model="form.guest_name" type="text" required class="mt-1 block w-full rounded-md border-gray-300">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Teléfono</label>
          <input v-model="form.guest_phone" type="text" class="mt-1 block w-full rounded-md border-gray-300">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Check-in</label>
          <input v-model="form.check_in" type="date" required class="mt-1 block w-full rounded-md border-gray-300">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Check-out</label>
          <input v-model="form.check_out" type="date" required class="mt-1 block w-full rounded-md border-gray-300">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Adultos</label>
          <input v-model="form.adults" type="number" min="1" class="mt-1 block w-full rounded-md border-gray-300">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Niños</label>
          <input v-model="form.children" type="number" min="0" class="mt-1 block w-full rounded-md border-gray-300">
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Unidades</label>
        <div class="max-h-44 space-y-1 overflow-y-auto rounded-md border border-gray-200 bg-gray-50 p-3">
          <p v-if="units.length === 0" class="text-sm text-gray-500">No hay unidades activas.</p>
          <label v-for="unit in units" :key="unit.id" class="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 text-sm text-gray-700 hover:bg-white">
            <input type="checkbox" :value="unit.id" v-model="form.unit_ids" class="rounded border-gray-300">
            <span>{{ unit.name }}</span>
          </label>
        </div>
      </div>

      <SourceSelector
        :modelValue="{ sourceTypeId: form.source_type_id, sourceDetailId: form.source_detail_id }"
        @update:modelValue="updateSourceSelection"
        @suggestions="applySourceSuggestions"
      />

      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label class="block text-sm font-medium text-gray-700">Precio por noche</label>
          <input v-model="form.price_per_night" type="number" min="0" step="0.01" class="mt-1 block w-full rounded-md border-gray-300">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Payment deadline</label>
          <input v-model="form.payment_deadline" type="date" class="mt-1 block w-full rounded-md border-gray-300">
        </div>
      </div>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <label class="block text-sm font-medium text-gray-700">Comisión</label>
          <input v-model="form.commission_name" type="text" class="mt-1 block w-full rounded-md border-gray-300" placeholder="Booking, agencia...">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">% Comisión</label>
          <input v-model="form.commission_percentage" type="number" min="0" step="0.01" class="mt-1 block w-full rounded-md border-gray-300">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">% Descuento</label>
          <input v-model="form.discount_percentage" type="number" min="0" step="0.01" class="mt-1 block w-full rounded-md border-gray-300">
        </div>
      </div>

      <div v-if="showCalculationPanel" class="rounded-md border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
        <p>Noches: <strong>{{ nights }}</strong></p>
        <p>Subtotal: <strong>${{ formatCurrency(subtotal) }}</strong></p>
        <p>Descuento ({{ Number(form.discount_percentage || 0) }}%): <strong>-${{ formatCurrency(discountAmount) }}</strong></p>
        <p>Total cliente: <strong>${{ formatCurrency(customerTotal) }}</strong></p>
        <p>Comisión ({{ Number(form.commission_percentage || 0) }}%): <strong>-${{ formatCurrency(commissionAmount) }}</strong></p>
        <p>Ingreso neto: <strong>${{ formatCurrency(netAmount) }}</strong></p>
      </div>

      <div v-if="selectedUnavailableNames.length > 0" class="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
        Las unidades seleccionadas no están disponibles en el rango: {{ selectedUnavailableNames.join(', ') }}.
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700">Notas</label>
        <textarea v-model="form.notes" rows="3" class="mt-1 block w-full rounded-md border-gray-300"></textarea>
      </div>

      <div v-if="syncIssue" class="rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <p>La reserva se creó, pero falló la sincronización de ocupación.</p>
        <p class="mt-1">{{ syncIssue.message }}</p>
        <div class="mt-3 flex gap-2">
          <button type="button" class="btn-secondary" @click="retrySync">Reintentar</button>
          <button type="button" class="btn-secondary" @click="goManual">Hacer manualmente</button>
        </div>
      </div>

      <p v-if="errorMessage" class="text-sm text-red-600">{{ errorMessage }}</p>

      <div class="flex justify-end gap-2 border-t pt-4">
        <button type="button" class="btn-secondary" @click="handleClose">Cancelar</button>
        <button type="submit" class="btn-primary" :disabled="submitting">{{ submitting ? 'Creando...' : 'Crear reserva' }}</button>
      </div>
    </form>
  </BaseModal>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../../services/supabase'
import { useAccountStore } from '../../stores/account'
import { useReservationsStore } from '../../stores/reservations'
import { useInquiriesStore } from '../../stores/inquiries'
import { useToast } from '../../composables/useToast'
import { generateUniqueReferenceCode } from '../../utils/referenceUtils'
import BaseModal from '../ui/BaseModal.vue'
import SourceSelector from '../sources/SourceSelector.vue'

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  inquiry: { type: Object, default: null }
})

const emit = defineEmits(['close', 'converted'])

const router = useRouter()
const accountStore = useAccountStore()
const reservationsStore = useReservationsStore()
const inquiriesStore = useInquiriesStore()
const toast = useToast()

const units = ref([])
const submitting = ref(false)
const errorMessage = ref('')
const selectedUnavailableNames = ref([])
const syncIssue = ref(null)

const form = ref(buildEmptyForm())

function buildEmptyForm() {
  return {
    guest_name: '',
    guest_phone: '',
    check_in: '',
    check_out: '',
    adults: 1,
    children: 0,
    unit_ids: [],
    price_per_night: '',
    commission_name: '',
    commission_percentage: '',
    discount_percentage: '',
    source: null,
    source_type_id: '',
    source_detail_id: '',
    payment_deadline: '',
    notes: ''
  }
}

const nights = computed(() => {
  if (!form.value.check_in || !form.value.check_out) return 0
  const start = new Date(form.value.check_in)
  const end = new Date(form.value.check_out)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0
  const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24))
  return diff > 0 ? diff : 0
})

const subtotal = computed(() => Number(form.value.price_per_night || 0) * nights.value)
const discountAmount = computed(() => subtotal.value * Number(form.value.discount_percentage || 0) / 100)
const customerTotal = computed(() => Math.max(subtotal.value - discountAmount.value, 0))
const commissionAmount = computed(() => customerTotal.value * Number(form.value.commission_percentage || 0) / 100)
const netAmount = computed(() => Math.max(customerTotal.value - commissionAmount.value, 0))
const showCalculationPanel = computed(() => nights.value > 0 && form.value.price_per_night !== '' && form.value.price_per_night != null)

watch(() => props.isOpen, async (open) => {
  if (!open) return
  await loadUnits()
  hydrateForm()
  await evaluateAvailability()
}, { immediate: true })

watch(
  () => [form.value.check_in, form.value.check_out, (form.value.unit_ids || []).join(',')],
  async () => {
    await evaluateAvailability()
  }
)

const loadUnits = async () => {
  const accountId = accountStore.getRequiredAccountId()
  const { data } = await supabase
    .from('units')
    .select('id, name, venue_id')
    .eq('account_id', accountId)
    .eq('is_active', true)
    .order('name', { ascending: true })
  units.value = data || []
}

const hydrateForm = () => {
  const inquiry = props.inquiry || {}
  form.value = {
    guest_name: inquiry.guest_name || '',
    guest_phone: inquiry.guest_phone || '',
    check_in: inquiry.check_in || '',
    check_out: inquiry.check_out || '',
    adults: inquiry.adults ?? 1,
    children: inquiry.children ?? 0,
    unit_ids: [...(inquiry.unit_ids || [])],
    price_per_night: inquiry.price_per_night ?? '',
    commission_name: inquiry.commission_name || '',
    commission_percentage: inquiry.commission_percentage ?? '',
    discount_percentage: inquiry.discount_percentage ?? '',
    source: inquiry.source || null,
    source_type_id: inquiry.source_type_id || '',
    source_detail_id: inquiry.source_detail_id || '',
    payment_deadline: '',
    notes: ''
  }
  errorMessage.value = ''
  syncIssue.value = null
}

const updateSourceSelection = (value) => {
  form.value.source_type_id = value?.sourceTypeId || ''
  form.value.source_detail_id = value?.sourceDetailId || ''
  if (!form.value.source_detail_id) form.value.source = null
}

const applySourceSuggestions = (payload) => {
  form.value.source = payload.sourceDetailName || payload.sourceDetailLabel || null
  if (!String(form.value.commission_name || '').trim()) form.value.commission_name = payload.sourceDetailLabel || ''
  if (form.value.commission_percentage === '' || form.value.commission_percentage == null) form.value.commission_percentage = Number(payload.commissionPercentage || 0)
  if (form.value.discount_percentage === '' || form.value.discount_percentage == null) form.value.discount_percentage = Number(payload.discountPercentage || 0)
}

const evaluateAvailability = async () => {
  selectedUnavailableNames.value = []
  if (!form.value.check_in || !form.value.check_out || form.value.unit_ids.length === 0) return

  const availability = await reservationsStore.getUnitAvailability(form.value.unit_ids, form.value.check_in, form.value.check_out)
  if (availability.unavailableUnitIds.length === 0) return

  selectedUnavailableNames.value = units.value
    .filter(unit => availability.unavailableUnitIds.includes(unit.id))
    .map(unit => unit.name)
}

const resolveVenueId = () => {
  if (form.value.unit_ids.length === 0) return null
  const firstUnit = units.value.find(u => u.id === form.value.unit_ids[0])
  return firstUnit?.venue_id || null
}

const formatCurrency = (value) => Number(value || 0).toLocaleString('es-CO')

const submitConversion = async () => {
  submitting.value = true
  errorMessage.value = ''
  syncIssue.value = null

  try {
    if (!form.value.guest_name?.trim()) throw new Error('El nombre del huésped es obligatorio.')
    if (!form.value.check_in || !form.value.check_out) throw new Error('Debes completar check-in y check-out.')
    if (new Date(form.value.check_in) >= new Date(form.value.check_out)) throw new Error('El check-out debe ser posterior al check-in.')
    if (form.value.unit_ids.length === 0) throw new Error('Debes seleccionar al menos una unidad.')
    if (selectedUnavailableNames.value.length > 0) throw new Error('Hay unidades no disponibles para las fechas seleccionadas.')

    const accountId = accountStore.getRequiredAccountId()

    // Shared reference code logic: reuse from inquiry if available, else generate and persist it first.
    let referenceCode = props.inquiry?.reference_code || null
    if (!referenceCode) {
      referenceCode = await generateUniqueReferenceCode(accountId)
      await inquiriesStore.updateInquiry(props.inquiry.id, { reference_code: referenceCode })
    }

    const payload = {
      venue_id: resolveVenueId(),
      unit_ids: [...form.value.unit_ids],
      guest_name: form.value.guest_name?.trim() || null,
      guest_phone: form.value.guest_phone?.trim() || null,
      check_in: form.value.check_in,
      check_out: form.value.check_out,
      adults: Number(form.value.adults || 1),
      children: Number(form.value.children || 0),
      price_per_night: Number(form.value.price_per_night || 0),
      total_amount: Number(customerTotal.value || 0),
      paid_amount: 0,
      commission_name: form.value.commission_name || null,
      commission_percentage: form.value.commission_percentage === '' ? null : Number(form.value.commission_percentage || 0),
      discount_percentage: form.value.discount_percentage === '' ? 0 : Number(form.value.discount_percentage || 0),
      source: form.value.source || null,
      source_type_id: form.value.source_type_id || null,
      source_detail_id: form.value.source_detail_id || null,
      payment_deadline: form.value.payment_deadline || null,
      notes: form.value.notes || null,
      status: 'confirmed',
      inquiry_id: props.inquiry.id,
      reference_code: referenceCode
    }

    if (!payload.venue_id) throw new Error('No se pudo determinar la sede a partir de las unidades seleccionadas.')

    const result = await reservationsStore.createReservation(payload)

    await inquiriesStore.updateInquiry(props.inquiry.id, {
      status: 'convertida',
      reservation_id: result.id,
      reference_code: referenceCode
    })

    if (result?.syncResult?.synced === false) {
      syncIssue.value = {
        reservationId: result.id,
        message: result.syncResult.error || 'No se pudo sincronizar la ocupación.'
      }
      toast.error('Reserva creada, pero falló la sincronización de ocupación.')
      return
    }

    toast.success('Reserva creada correctamente')
    emit('converted', result.id)
    emit('close')
    router.push(`/reservas/${result.id}`)
  } catch (err) {
    errorMessage.value = err.message || 'No se pudo convertir la consulta.'
  } finally {
    submitting.value = false
  }
}

const retrySync = async () => {
  if (!syncIssue.value?.reservationId) return

  const result = await reservationsStore.retryReservationOccupancySync(syncIssue.value.reservationId)
  if (result.synced) {
    toast.success('Ocupación sincronizada correctamente.')
    emit('converted', syncIssue.value.reservationId)
    emit('close')
    router.push(`/reservas/${syncIssue.value.reservationId}`)
    return
  }

  syncIssue.value = {
    reservationId: syncIssue.value.reservationId,
    message: result.error || 'Falló nuevamente la sincronización.'
  }
}

const goManual = () => {
  if (!syncIssue.value?.reservationId) return
  toast.warning('Gestiona la ocupación manualmente desde el detalle de la reserva.')
  emit('converted', syncIssue.value.reservationId)
  emit('close')
  router.push(`/reservas/${syncIssue.value.reservationId}`)
}

const handleClose = () => {
  if (submitting.value) return
  emit('close')
}
</script>
