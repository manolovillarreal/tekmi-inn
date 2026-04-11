<template>
  <div class="p-3 sm:p-6 max-w-3xl mx-auto">
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
      <h1 class="text-2xl font-semibold text-gray-900">Editar reserva</h1>
    </div>

    <div v-if="loading" class="card py-10 text-center text-gray-500">Cargando reserva...</div>

    <div v-else-if="!res" class="card py-10 text-center">
      <h2 class="text-lg font-semibold text-gray-900">Reserva no encontrada</h2>
      <p class="mt-2 text-sm text-gray-500">La URL puede ser inválida o la reserva fue eliminada.</p>
    </div>

    <template v-else>
      <div v-if="!isEditable" class="space-y-4">
        <AppInlineAlert
          type="warning"
          title="Reserva no editable"
          message="Esta reserva no puede editarse porque ya tiene check-in físico registrado o su estado no lo permite."
        />
        <button type="button" class="btn-secondary" @click="router.back()">Volver</button>
      </div>

      <form v-else class="space-y-5" @submit.prevent="submitEdit">
        <p class="font-mono text-xs text-gray-500">{{ res.reservation_number || '' }}</p>

        <AppFormSection title="Huésped" :divider="true" :collapsible="true" :defaultOpen="true">
          <AppFormGrid :columns="2">
            <AppInput v-model="form.guest_first_name" label="Nombres" hint="Opcional" />
            <AppInput v-model="form.guest_last_name" label="Apellidos" hint="Opcional" />
          </AppFormGrid>
          <AppPhoneInput
            :countryCode="form.guest_phone_country_code"
            :phoneNumber="form.guest_phone"
            label="Teléfono"
            hint="Opcional"
            @update:countryCode="form.guest_phone_country_code = $event"
            @update:phoneNumber="form.guest_phone = $event"
          />
          <div class="rounded-lg border border-gray-200">
            <button
              type="button"
              class="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
              @click="showOptionalGuestFields = !showOptionalGuestFields"
            >
              <span>Datos adicionales</span>
              <svg
                class="h-4 w-4 text-gray-400 transition-transform"
                :class="{ 'rotate-180': showOptionalGuestFields }"
                viewBox="0 0 20 20" fill="none" stroke="currentColor"
                stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="M5 8l5 5 5-5" />
              </svg>
            </button>
            <div v-if="showOptionalGuestFields" class="border-t px-4 pb-4 pt-3 space-y-4">
              <AppInput v-model="form.guest_email" label="Email" type="email" hint="Opcional" />
              <AppFormGrid :columns="3">
                <AppCountrySelect v-model="form.guest_nationality" label="Nacionalidad" hint="Opcional" />
                <AppSelect v-model="form.guest_document_type" label="Tipo de documento" :options="documentTypeOptions" placeholder="Sin definir" hint="Opcional" />
                <AppInput v-model="form.guest_document_number" label="Número de documento" inputmode="numeric" hint="Opcional" />
              </AppFormGrid>
              <AppFormGrid :columns="2">
                <AppSelect v-model="form.guest_gender" label="Género" :options="genderOptions" placeholder="Sin especificar" hint="Opcional" />
                <AppDatePicker v-model="form.guest_birth_date" label="Fecha de nacimiento" hint="Opcional" />
              </AppFormGrid>
            </div>
          </div>
        </AppFormSection>

        <AppFormSection title="Fechas y unidades" :divider="true" :collapsible="true" :defaultOpen="true">
          <AppFormGrid :columns="2">
            <AppDatePicker v-model="form.check_in" label="Check-in" :error="fieldError('check_in')" />
            <AppDatePicker v-model="form.check_out" label="Check-out" :error="fieldError('check_out')" />
          </AppFormGrid>
          <div v-if="nights > 0" class="text-sm text-[#6B7280]">{{ nights }} noche{{ nights !== 1 ? 's' : '' }}</div>

          <AppFieldGroup title="Unidad(es)" :border="true" :compact="true">
            <div class="max-h-44 space-y-1 overflow-y-auto">
              <p v-if="units.length === 0" class="text-sm text-gray-500">No hay unidades activas.</p>
              <label
                v-for="unit in units"
                :key="unit.id"
                class="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 text-sm text-gray-700 hover:bg-white"
              >
                <input v-model="form.unit_ids" type="checkbox" :value="unit.id" class="rounded border-gray-300">
                <span>{{ unit.name }}</span>
              </label>
            </div>
          </AppFieldGroup>
        </AppFormSection>

        <AppFormSection title="Personas" :divider="true" :collapsible="true" :defaultOpen="true">
          <AppFormGrid :columns="2">
            <AppCounter v-model="form.adults" label="Adultos" :min="1" :max="20" />
            <AppCounter v-if="activeCategories.includes('minors')" v-model="form.minors" :label="ageCategoryLabels.minors" :min="0" :max="20" />
            <AppCounter v-if="activeCategories.includes('children')" v-model="form.children" :label="ageCategoryLabels.children" :min="0" :max="20" />
            <AppCounter v-if="activeCategories.includes('infants')" v-model="form.infants" :label="ageCategoryLabels.infants" :min="0" :max="20" />
          </AppFormGrid>
        </AppFormSection>

        <AppFormSection title="Precio y comisión" :divider="true" :collapsible="true" :defaultOpen="true">
          <AppFormGrid :columns="2">
            <AppInput v-model="form.price_per_night" type="number" label="Precio por noche" prefix="$" />
            <AppInput v-model="form.discount_percentage" type="number" label="Descuento" suffix="%" hint="Opcional" />
          </AppFormGrid>
          <AppInput v-model="form.commission_percentage" type="number" label="Comisión" suffix="%" hint="Opcional" />
          <PricingCalculatorPanel
            :checkIn="form.check_in"
            :checkOut="form.check_out"
            :pricePerNight="Number(form.price_per_night || 0)"
            :discountPercentage="Number(form.discount_percentage || 0)"
            :commissionPercentage="Number(form.commission_percentage || 0)"
            :units="form.unit_ids"
            :adults="Number(form.adults || 1)"
            :minors="Number(form.minors || 0)"
            :children="Number(form.children || 0)"
            :infants="Number(form.infants || 0)"
          />
        </AppFormSection>

        <AppFormSection title="Origen" :divider="true" :collapsible="true" :defaultOpen="false">
          <AppFieldGroup title="Canal de origen" :border="false" :compact="true">
            <SourceSelector
              :modelValue="{ sourceTypeId: form.source_type_id, sourceDetailId: form.source_detail_id, sourceName: form.source_name }"
              @update:modelValue="updateSourceSelection"
            />
          </AppFieldGroup>
        </AppFormSection>

        <AppFormSection title="Notas" :divider="true" :collapsible="true" :defaultOpen="false">
          <AppTextarea v-model="form.notes" label="Notas" hint="Opcional" :rows="2" :autoResize="true" />
        </AppFormSection>

        <AppInlineAlert v-if="errorMessage" type="error" :message="errorMessage" :dismissible="true" />

        <AppFormActions
          submit-label="Guardar cambios"
          cancel-label="Cancelar"
          :loading="submitting"
          @submit="submitEdit"
          @cancel="router.back()"
        />
      </form>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '../services/supabase'
import { syncReservationOccupancy } from '../services/reservationService'
import { useAccountStore } from '../stores/account'
import { useReservationsStore } from '../stores/reservations'
import { useToast } from '../composables/useToast'
import { useAgeCategorySettings } from '../composables/useAgeCategorySettings'
import SourceSelector from '../components/sources/SourceSelector.vue'
import {
  AppInput,
  AppSelect,
  AppCountrySelect,
  AppTextarea,
  AppDatePicker,
  AppCounter,
  AppFieldGroup,
  AppFormSection,
  AppFormActions,
  AppInlineAlert,
  AppFormGrid,
  AppPhoneInput,
  PricingCalculatorPanel
} from '@/components/ui/forms'
import { DOCUMENT_TYPES_ADULT as documentTypeOptions } from '../utils/documentTypes'

const route = useRoute()
const router = useRouter()
const accountStore = useAccountStore()
const reservationsStore = useReservationsStore()
const toast = useToast()
const { loadAgeCategorySettings, activeCategories, ageCategoryLabels } = useAgeCategorySettings()

const loading = ref(true)
const submitting = ref(false)
const errorMessage = ref('')
const res = ref(null)
const units = ref([])
const originalUnitIds = ref([])

const genderOptions = [
  { value: 'male', label: 'Masculino' },
  { value: 'female', label: 'Femenino' },
  { value: 'other', label: 'Otro' },
]

const showOptionalGuestFields = ref(false)

const form = ref({
  guest_first_name: '', guest_last_name: '',
  guest_phone: '', guest_phone_country_code: '+57',
  guest_email: '', guest_gender: '',
  guest_nationality: '', guest_document_type: '', guest_document_number: '', guest_birth_date: '',
  check_in: '', check_out: '',
  adults: 1, minors: 0, children: 0, infants: 0,
  unit_ids: [],
  price_per_night: '', discount_percentage: '', commission_percentage: '',
  source_type_id: '', source_detail_id: '', source_name: '',
  notes: ''
})

const isEditable = computed(() => {
  if (!res.value) return false
  return res.value.status === 'confirmed' && !res.value.checkin_date
})

const nights = computed(() => {
  if (!form.value.check_in || !form.value.check_out) return 0
  const start = new Date(form.value.check_in)
  const end = new Date(form.value.check_out)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0
  const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24))
  return diff > 0 ? diff : 0
})

const fieldError = (field) => {
  if (field === 'check_out' && form.value.check_in && form.value.check_out) {
    if (new Date(form.value.check_in) >= new Date(form.value.check_out)) return 'El check-out debe ser posterior al check-in.'
  }
  return ''
}

const updateSourceSelection = (value) => {
  form.value.source_type_id = value?.sourceTypeId || ''
  form.value.source_detail_id = value?.sourceDetailId || ''
  form.value.source_name = value?.sourceName || ''
}

onMounted(async () => {
  try {
    const accountId = accountStore.getRequiredAccountId()
    const [{ data, error }, { data: unitsData }] = await Promise.all([
      supabase
        .from('reservations')
        .select('*, source_detail_info:source_details!reservations_source_detail_id_fkey(id, source_type_id), guests!reservations_guest_id_fkey(*), venues(name), reservation_units(unit_id, units(*))')
        .eq('account_id', accountId)
        .eq('id', route.params.id)
        .single(),
      supabase.from('units').select('id, name, venue_id').eq('account_id', accountId).eq('is_active', true).order('name'),
      loadAgeCategorySettings()
    ])
    if (error) throw error
    res.value = data
    units.value = unitsData || []

    if (data) {
      const g = data.guests || {}
      const unitIds = (data.reservation_units || []).map(ru => ru.unit_id)
      originalUnitIds.value = [...unitIds]
      const hasOptionalData = !!(g.email || g.nationality || g.document_type || g.document_number || g.gender || g.birth_date)
      if (hasOptionalData) showOptionalGuestFields.value = true
      form.value = {
        guest_first_name: g.first_name || '',
        guest_last_name: g.last_name || '',
        guest_phone: g.phone || '',
        guest_phone_country_code: g.phone_country_code || '+57',
        guest_email: g.email || '',
        guest_gender: g.gender || '',
        guest_nationality: g.nationality || '',
        guest_document_type: g.document_type || '',
        guest_document_number: g.document_number || '',
        guest_birth_date: g.birth_date || '',
        check_in: data.check_in || '',
        check_out: data.check_out || '',
        adults: data.adults ?? 1,
        minors: data.minors ?? 0,
        children: data.children ?? 0,
        infants: data.infants ?? 0,
        unit_ids: unitIds,
        price_per_night: data.price_per_night ?? '',
        discount_percentage: data.discount_percentage ?? '',
        commission_percentage: data.commission_percentage ?? '',
        source_type_id: data.source_detail_info?.source_type_id || '',
        source_detail_id: data.source_detail_id || '',
        source_name: data.source_name || '',
        notes: data.notes || ''
      }
    }
  } catch (err) {
    toast.error(err.message || 'No se pudo cargar la reserva')
  } finally {
    loading.value = false
  }
})

const submitEdit = async () => {
  if (fieldError('check_out')) { errorMessage.value = fieldError('check_out'); return }
  submitting.value = true
  errorMessage.value = ''
  try {
    const accountId = accountStore.getRequiredAccountId()
    const id = res.value.id

    const subtotal = Number(form.value.price_per_night || 0) * nights.value
    const discountAmount = subtotal * Number(form.value.discount_percentage || 0) / 100
    const total_amount = Math.max(subtotal - discountAmount, 0)

    const { error: resError } = await supabase
      .from('reservations')
      .update({
        check_in: form.value.check_in,
        check_out: form.value.check_out,
        adults: Number(form.value.adults),
        minors: Number(form.value.minors),
        children: Number(form.value.children),
        infants: Number(form.value.infants),
        price_per_night: Number(form.value.price_per_night || 0),
        total_amount,
        discount_percentage: form.value.discount_percentage === '' ? null : Number(form.value.discount_percentage || 0),
        commission_percentage: form.value.commission_percentage === '' ? null : Number(form.value.commission_percentage || 0),
        source_detail_id: form.value.source_detail_id || null,
        source_name: form.value.source_name || null,
        notes: form.value.notes?.trim() || null,
      })
      .eq('id', id)
      .eq('account_id', accountId)
    if (resError) throw resError

    if (res.value.guest_id) {
      const { error: guestError } = await supabase
        .from('guests')
        .update({
          first_name: form.value.guest_first_name?.trim() || null,
          last_name: form.value.guest_last_name?.trim() || null,
          phone: form.value.guest_phone?.replace(/\s+/g, '').trim() || null,
          phone_country_code: form.value.guest_phone_country_code || '+57',
          email: form.value.guest_email?.trim() || null,
          gender: form.value.guest_gender || null,
          nationality: form.value.guest_nationality || null,
          document_type: form.value.guest_document_type || null,
          document_number: form.value.guest_document_number?.trim() || null,
          birth_date: form.value.guest_birth_date || null,
        })
        .eq('id', res.value.guest_id)
        .eq('account_id', accountId)
      if (guestError) throw guestError
    }

    const unitIdsChanged =
      form.value.unit_ids.length !== originalUnitIds.value.length ||
      form.value.unit_ids.some(u => !originalUnitIds.value.includes(u))

    const datesChanged =
      form.value.check_in !== res.value.check_in ||
      form.value.check_out !== res.value.check_out

    if (unitIdsChanged) {
      await reservationsStore.updateReservationUnits(id, form.value.unit_ids)
    } else if (datesChanged) {
      await syncReservationOccupancy(id)
    }

    toast.success('Reserva actualizada.')
    router.push(`/reservas/${id}`)
  } catch (err) {
    errorMessage.value = err.message || 'No se pudo guardar los cambios.'
  } finally {
    submitting.value = false
  }
}
</script>
