<template>
  <div :class="inModal ? 'space-y-6' : 'space-y-6 max-w-2xl mx-auto'">

    <!-- Step progress indicator -->
    <nav class="flex items-center gap-1 text-sm" aria-label="Pasos del formulario">
      <template v-for="(stepLabel, i) in STEP_LABELS" :key="i">
        <button
          type="button"
          class="flex items-center gap-1.5 rounded px-2 py-1 transition-colors"
          :class="stepButtonClass(i + 1)"
          :disabled="i + 1 > maxReachedStep"
          @click="goToStep(i + 1)"
        >
          <span
            class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold"
            :class="stepCircleClass(i + 1)"
          >{{ i + 1 }}</span>
          <span class="hidden sm:inline">{{ stepLabel }}</span>
        </button>
        <span v-if="i < STEP_LABELS.length - 1" class="text-gray-300">›</span>
      </template>
    </nav>

    <!-- Step 1: Disponibilidad -->
    <template v-if="currentStep === 1">
      <AppFormSection title="Fechas y personas" :divider="true">
        <AppFormGrid :columns="2">
          <AppDatePicker
            v-model="form.check_in"
            label="Check-in"
            :min="todayIso"
            :error="s1Touched.check_in && !form.check_in ? 'Requerido' : ''"
            @blur="s1Touched.check_in = true"
            @update:modelValue="onDatesChange"
          />
          <AppDatePicker
            v-model="form.check_out"
            label="Check-out"
            :min="form.check_in || todayIso"
            :error="s1Touched.check_out && checkOutError"
            @blur="s1Touched.check_out = true"
            @update:modelValue="onDatesChange"
          />
        </AppFormGrid>

        <AppFormGrid :columns="2">
          <AppCounter v-model="form.adults" label="Adultos" :min="1" :max="20" />
          <AppCounter v-model="form.children" label="Niños" :min="0" :max="20" />
        </AppFormGrid>

        <p class="text-sm text-gray-500">
          Total de personas: <strong class="text-gray-900">{{ totalPersonas }}</strong>
        </p>
      </AppFormSection>

      <!-- Availability results -->
      <div v-if="avail.checked && !avail.loading">
        <div v-if="avail.available.length === 0">
          <AppInlineAlert
            type="warning"
            message="No hay unidades disponibles para ese rango y número de personas."
          />
        </div>
        <div v-else class="space-y-2">
          <p class="text-sm font-semibold text-emerald-700">
            {{ avail.available.length }} {{ avail.available.length === 1 ? 'unidad disponible' : 'unidades disponibles' }}
          </p>
          <div class="divide-y divide-gray-100 rounded-md border border-gray-200 bg-white text-sm">
            <div
              v-for="unit in avail.available"
              :key="unit.id"
              class="flex items-center gap-3 px-3 py-2"
            >
              <span class="font-medium text-gray-900">{{ unit.name }}</span>
              <span v-if="!avail.singleVenue" class="text-gray-400">· {{ unit.venues?.name }}</span>
              <span class="text-gray-400">· hasta {{ unit.capacity }} pers.</span>
            </div>
          </div>
        </div>
      </div>

      <AppInlineAlert v-if="avail.error" type="error" :message="avail.error" />

      <div class="flex items-center gap-3">
        <button
          v-if="form.check_in && form.check_out && !checkOutError"
          type="button"
          class="btn-secondary"
          :disabled="avail.loading"
          @click="runAvailabilityCheck"
        >
          {{ avail.loading ? 'Verificando…' : (avail.checked ? 'Verificar de nuevo' : 'Verificar disponibilidad') }}
        </button>

        <button
          type="button"
          class="btn-primary"
          :disabled="!canProceedStep1"
          @click="nextStep"
        >
          Continuar
        </button>
      </div>
    </template>

    <!-- Step 2: Huésped -->
    <template v-if="currentStep === 2">
      <AppFormSection title="Datos del huésped" :divider="true">
        <AppFormGrid :columns="2">
          <AppInput
            v-model="form.guest_name"
            label="Nombre"
            required
            :error="s2Touched.guest_name && !form.guest_name?.trim() ? 'El nombre es obligatorio.' : ''"
            @blur="s2Touched.guest_name = true"
          />
          <AppInput
            v-model="form.guest_phone"
            label="Teléfono"
            hint="Opcional"
          />
        </AppFormGrid>

        <AppTextarea
          v-model="form.notes"
          label="Notas internas"
          :rows="2"
          :autoResize="true"
          hint="Opcional"
        />
      </AppFormSection>

      <div class="flex items-center gap-3">
        <button type="button" class="btn-secondary" @click="prevStep">Atrás</button>
        <button type="button" class="btn-primary" :disabled="!form.guest_name?.trim()" @click="nextStep">Continuar</button>
      </div>
    </template>

    <!-- Step 3: Origen y precio -->
    <template v-if="currentStep === 3">
      <AppFormSection title="Canal de origen" :divider="true">
        <SourceSelector
          :modelValue="{ sourceTypeId: form.source_type_id, sourceDetailId: form.source_detail_id }"
          @update:modelValue="onSourceChange"
          @suggestions="onSourceSuggestions"
        />
      </AppFormSection>

      <AppFormSection title="Cotización" :divider="true">
        <AppInput
          v-model="form.price_per_night"
          type="number"
          label="Precio por noche"
          prefix="$"
          hint="Opcional"
        />

        <AppFormGrid :columns="2">
          <AppInput v-model="form.discount_percentage" type="number" label="Descuento" suffix="%" hint="Opcional" />
          <AppInput v-model="form.commission_percentage" type="number" label="Comisión" suffix="%" hint="Opcional" />
        </AppFormGrid>

        <AppDatePicker v-model="form.quote_expires_at" label="Cotización válida hasta" hint="Opcional" />

        <PricingCalculatorPanel
          :checkIn="form.check_in"
          :checkOut="form.check_out"
          :pricePerNight="Number(form.price_per_night || 0)"
          :discountPercentage="Number(form.discount_percentage || 0)"
          :commissionPercentage="Number(form.commission_percentage || 0)"
          :adults="form.adults"
          :children="form.children"
        />
      </AppFormSection>

      <div class="flex items-center gap-3">
        <button type="button" class="btn-secondary" @click="prevStep">Atrás</button>
        <button type="button" class="btn-primary" @click="nextStep">Continuar</button>
      </div>
    </template>

    <!-- Step 4: Confirmar -->
    <template v-if="currentStep === 4">
      <!-- Summary card -->
      <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm space-y-1">
        <p><span class="text-gray-500">Huésped:</span> <strong>{{ form.guest_name }}</strong><span v-if="form.guest_phone" class="ml-2 text-gray-400">{{ form.guest_phone }}</span></p>
        <p><span class="text-gray-500">Check-in:</span> <strong>{{ form.check_in }}</strong> → <strong>{{ form.check_out }}</strong><span v-if="nights > 0" class="text-gray-400"> ({{ nights }} noches)</span></p>
        <p><span class="text-gray-500">Personas:</span> <strong>{{ totalPersonas }}</strong> ({{ form.adults }} adultos, {{ form.children }} niños)</p>
        <p v-if="form.price_per_night"><span class="text-gray-500">Precio/noche:</span> <strong>${{ Number(form.price_per_night).toLocaleString('es-CO') }}</strong></p>
      </div>

      <!-- Mode toggle -->
      <div class="flex gap-3">
        <button
          type="button"
          :class="saveMode === 'inquiry' ? 'btn-primary' : 'btn-secondary'"
          @click="saveMode = 'inquiry'"
        >
          Guardar como consulta
        </button>
        <button
          type="button"
          :class="saveMode === 'reservation' ? 'btn-primary' : 'btn-secondary'"
          @click="saveMode = 'reservation'"
        >
          Crear reserva
        </button>
      </div>

      <!-- Reservation-specific fields -->
      <template v-if="saveMode === 'reservation'">
        <AppFormSection title="Unidad" :divider="true">
          <p class="text-sm text-gray-500 mb-2">Selecciona la unidad para esta reserva.</p>

          <div v-if="avail.checked && avail.available.length > 0" class="space-y-1">
            <label
              v-for="unit in avail.available"
              :key="unit.id"
              class="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-gray-50 border border-transparent"
              :class="form.unit_ids.includes(unit.id) ? 'border-primary/30 bg-primary/5' : ''"
            >
              <input
                type="checkbox"
                :value="unit.id"
                v-model="form.unit_ids"
                class="rounded border-gray-300"
              >
              <span class="font-medium">{{ unit.name }}</span>
              <span v-if="!avail.singleVenue" class="text-gray-400 text-xs">· {{ unit.venues?.name }}</span>
            </label>
          </div>

          <!-- If no availability check done yet or no available units, show all active units -->
          <div v-else class="space-y-1">
            <p v-if="allUnitsLoading" class="text-sm text-gray-400">Cargando unidades…</p>
            <label
              v-for="unit in allUnits"
              :key="unit.id"
              class="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-gray-50"
            >
              <input
                type="checkbox"
                :value="unit.id"
                v-model="form.unit_ids"
                class="rounded border-gray-300"
              >
              <span class="font-medium">{{ unit.name }}</span>
            </label>
          </div>

          <AppInlineAlert
            v-if="s4Touched.unit_ids && form.unit_ids.length === 0"
            type="error"
            message="Selecciona al menos una unidad."
          />
        </AppFormSection>

        <AppFormSection title="Detalles de la reserva" :divider="true">
          <AppFormGrid :columns="2">
            <AppSelect
              v-model="form.status"
              label="Estado"
              :options="RESERVATION_STATUS_OPTIONS"
            />
            <AppDatePicker
              v-model="form.payment_deadline"
              label="Límite de pago"
              hint="Opcional"
            />
          </AppFormGrid>
        </AppFormSection>

        <AppFormSection title="Abono inicial" :divider="true">
          <AppToggle v-model="addInitialPayment" label="Registrar abono inicial" />
          <template v-if="addInitialPayment">
            <AppFormGrid :columns="2">
              <AppInput
                v-model="payment.amount"
                type="number"
                label="Monto"
                prefix="$"
              />
              <AppSelect
                v-model="payment.method"
                label="Método"
                :options="PAYMENT_METHOD_OPTIONS"
              />
            </AppFormGrid>
            <AppInput
              v-model="payment.reference"
              label="Referencia"
              hint="Opcional"
            />
            <AppDatePicker
              v-model="payment.payment_date"
              label="Fecha de pago"
            />
          </template>
        </AppFormSection>
      </template>

      <AppInlineAlert v-if="submitError" type="error" :message="submitError" />

      <div class="flex items-center gap-3">
        <button type="button" class="btn-secondary" @click="prevStep">Atrás</button>
        <button type="button" class="btn-primary" :disabled="saving" @click="save">
          {{
            saving ? 'Guardando…' :
            saveMode === 'reservation' ? 'Crear reserva' : 'Guardar consulta'
          }}
        </button>
        <button v-if="inModal" type="button" class="text-sm text-gray-500 underline" @click="emit('cancel')">Cancelar</button>
      </div>
    </template>

  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import SourceSelector from '../sources/SourceSelector.vue'
import {
  AppInput,
  AppTextarea,
  AppDatePicker,
  AppCounter,
  AppFormGrid,
  AppFormSection,
  AppInlineAlert,
  AppToggle,
  AppSelect,
  PricingCalculatorPanel
} from '@/components/ui/forms'
import { useAvailability } from '../../composables/useAvailability'
import { useAccountStore } from '../../stores/account'
import { useReservationsStore } from '../../stores/reservations'
import { useInquiriesStore } from '../../stores/inquiries'
import { supabase } from '../../services/supabase'
import { useToast } from '../../composables/useToast'

const props = defineProps({
  initialCheckIn: { type: String, default: '' },
  initialCheckOut: { type: String, default: '' },
  initialPersonas: { type: Number, default: 2 },
  inModal: { type: Boolean, default: false }
})

const emit = defineEmits(['saved', 'cancel'])

const router = useRouter()
const accountStore = useAccountStore()
const reservationsStore = useReservationsStore()
const inquiriesStore = useInquiriesStore()
const toast = useToast()
const avail = useAvailability()

const STEP_LABELS = ['Disponibilidad', 'Huésped', 'Cotización', 'Confirmar']
const RESERVATION_STATUS_OPTIONS = [
  { value: 'confirmed', label: 'Confirmada' },
  { value: 'in_stay', label: 'En estadía' }
]
const PAYMENT_METHOD_OPTIONS = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'otro', label: 'Otro' }
]

const todayIso = new Date().toISOString().slice(0, 10)

const currentStep = ref(1)
const maxReachedStep = ref(1)
const saveMode = ref('inquiry')
const saving = ref(false)
const submitError = ref('')
const addInitialPayment = ref(false)
const allUnits = ref([])
const allUnitsLoading = ref(false)

// Form data
const form = ref({
  check_in: props.initialCheckIn || '',
  check_out: props.initialCheckOut || '',
  adults: Math.max(1, props.initialPersonas > 1 ? props.initialPersonas - 1 : props.initialPersonas),
  children: 0,
  guest_name: '',
  guest_phone: '',
  notes: '',
  price_per_night: '',
  discount_percentage: '',
  commission_percentage: '',
  commission_name: '',
  quote_expires_at: '',
  source: null,
  source_type_id: '',
  source_detail_id: '',
  unit_ids: [],
  status: 'confirmed',
  payment_deadline: ''
})

const payment = ref({
  amount: '',
  method: 'transferencia',
  reference: '',
  payment_date: todayIso
})

// Touched trackers per step
const s1Touched = ref({ check_in: false, check_out: false })
const s2Touched = ref({ guest_name: false })
const s4Touched = ref({ unit_ids: false })

// Computed
const totalPersonas = computed(() => Number(form.value.adults || 0) + Number(form.value.children || 0))

const nights = computed(() => {
  if (!form.value.check_in || !form.value.check_out) return 0
  const diff = (new Date(form.value.check_out) - new Date(form.value.check_in)) / 86400000
  return diff > 0 ? Math.ceil(diff) : 0
})

const checkOutError = computed(() => {
  if (!form.value.check_out) return 'Requerido'
  if (form.value.check_in && form.value.check_out <= form.value.check_in) return 'Debe ser posterior al check-in'
  return ''
})

const canProceedStep1 = computed(() => {
  return !!form.value.check_in && !checkOutError.value
})

// Helpers
const stepButtonClass = (step) => {
  if (step === currentStep.value) return 'text-primary font-semibold'
  if (step < currentStep.value) return 'text-gray-600 hover:text-gray-900'
  if (step > maxReachedStep.value) return 'text-gray-300 cursor-not-allowed'
  return 'text-gray-500 hover:text-gray-700'
}

const stepCircleClass = (step) => {
  if (step === currentStep.value) return 'bg-primary text-white'
  if (step < currentStep.value) return 'bg-green-100 text-green-700'
  return 'bg-gray-100 text-gray-400'
}

const goToStep = (step) => {
  if (step <= maxReachedStep.value) currentStep.value = step
}

const nextStep = () => {
  if (currentStep.value < STEP_LABELS.length) {
    currentStep.value++
    if (currentStep.value > maxReachedStep.value) maxReachedStep.value = currentStep.value
  }
}

const prevStep = () => {
  if (currentStep.value > 1) currentStep.value--
}

const onDatesChange = () => {
  if (avail.checked?.value) avail.reset()
}

const runAvailabilityCheck = async () => {
  const accountId = accountStore.getRequiredAccountId()
  await avail.checkAvailability({
    accountId,
    checkIn: form.value.check_in,
    checkOut: form.value.check_out,
    personas: totalPersonas.value
  })
}

const onSourceChange = (value) => {
  form.value.source_type_id = value?.sourceTypeId || ''
  form.value.source_detail_id = value?.sourceDetailId || ''
  if (!form.value.source_detail_id) form.value.source = null
}

const onSourceSuggestions = (payload) => {
  form.value.source = payload.sourceDetailName || payload.sourceDetailLabel || null
  if (!String(form.value.commission_name || '').trim()) {
    form.value.commission_name = payload.sourceDetailLabel || ''
  }
  if (form.value.commission_percentage === '' || form.value.commission_percentage === null) {
    form.value.commission_percentage = Number(payload.commissionPercentage || 0)
  }
  if (form.value.discount_percentage === '' || form.value.discount_percentage === null) {
    form.value.discount_percentage = Number(payload.discountPercentage || 0)
  }
}

const save = async () => {
  submitError.value = ''

  if (saveMode.value === 'reservation') {
    s4Touched.value.unit_ids = true
    if (form.value.unit_ids.length === 0) return
  }

  saving.value = true
  try {
    if (saveMode.value === 'reservation') {
      const paymentData = addInitialPayment.value && Number(payment.value.amount || 0) > 0
        ? payment.value
        : null

      const result = await reservationsStore.createReservationWithPayment(
        {
          check_in: form.value.check_in,
          check_out: form.value.check_out,
          adults: form.value.adults,
          children: form.value.children,
          guest_name: form.value.guest_name,
          guest_phone: form.value.guest_phone,
          unit_ids: form.value.unit_ids,
          price_per_night: form.value.price_per_night !== '' ? Number(form.value.price_per_night) : null,
          discount_percentage: Number(form.value.discount_percentage || 0),
          commission_percentage: Number(form.value.commission_percentage || 0),
          commission_name: form.value.commission_name || null,
          source: form.value.source,
          source_type_id: form.value.source_type_id || null,
          source_detail_id: form.value.source_detail_id || null,
          status: form.value.status,
          payment_deadline: form.value.payment_deadline || null,
          notes: form.value.notes || null
        },
        paymentData
      )

      toast.success('Reserva creada correctamente.')
      emit('saved', result)

      if (!props.inModal) {
        router.push(`/reservas/${result.id}`)
      }
    } else {
      const result = await inquiriesStore.createInquiry({
        check_in: form.value.check_in,
        check_out: form.value.check_out,
        adults: form.value.adults,
        children: form.value.children,
        guest_name: form.value.guest_name,
        guest_phone: form.value.guest_phone,
        price_per_night: form.value.price_per_night !== '' ? Number(form.value.price_per_night) : null,
        discount_percentage: form.value.discount_percentage !== '' ? Number(form.value.discount_percentage) : 0,
        commission_percentage: form.value.commission_percentage !== '' ? Number(form.value.commission_percentage) : 0,
        commission_name: form.value.commission_name || null,
        quote_expires_at: form.value.quote_expires_at || null,
        source: form.value.source,
        source_type_id: form.value.source_type_id || null,
        source_detail_id: form.value.source_detail_id || null,
        notes: form.value.notes || null
      })

      toast.success('Consulta guardada correctamente.')
      emit('saved', result)

      if (!props.inModal) {
        router.push(`/consultas/${result.id}`)
      }
    }
  } catch (err) {
    submitError.value = err.message || 'Ocurrió un error al guardar.'
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  // Pre-run availability check if dates come from URL params
  if (props.initialCheckIn && props.initialCheckOut) {
    const accountId = accountStore.getRequiredAccountId()
    await avail.checkAvailability({
      accountId,
      checkIn: props.initialCheckIn,
      checkOut: props.initialCheckOut,
      personas: props.initialPersonas
    })
  }

  // Load all units as fallback for reservation mode
  allUnitsLoading.value = true
  try {
    const accountId = accountStore.getRequiredAccountId()
    const { data } = await supabase
      .from('units')
      .select('id, name, venue_id, venues(name)')
      .eq('account_id', accountId)
      .eq('is_active', true)
      .order('name')
    allUnits.value = data || []
  } finally {
    allUnitsLoading.value = false
  }
})
</script>
