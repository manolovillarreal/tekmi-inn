<template>
  <section class="doc-content-section border-b pb-4">
    <div class="flex flex-wrap items-start justify-between gap-2">
      <div>
        <h1 class="doc-content-title text-2xl font-bold text-gray-900">{{ safeGuestName }}</h1>
        <p class="mt-0.5 text-sm text-gray-500">Ref. {{ safeReferenceDisplay }} · Nro. {{ safeQuotationNumber }}</p>
      </div>
      <div class="flex flex-col items-end gap-1">
        <span
          class="rounded-full px-2.5 py-0.5 text-xs font-semibold"
          :class="isQuoteExpired ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'"
        >
          {{ isQuoteExpired ? 'Vencida' : 'Vigente' }}
        </span>
        <p class="text-xs text-gray-400">{{ safeCurrentDateLabel }}</p>
      </div>
    </div>

    <div class="mt-3 grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
      <div>
        <p class="text-xs font-medium uppercase tracking-wide text-gray-400">Check-in</p>
        <p class="font-semibold text-gray-900">{{ safeCheckInLabel }}</p>
      </div>
      <div>
        <p class="text-xs font-medium uppercase tracking-wide text-gray-400">Check-out</p>
        <p class="font-semibold text-gray-900">{{ safeCheckOutLabel }}</p>
      </div>
      <div>
        <p class="text-xs font-medium uppercase tracking-wide text-gray-400">Noches</p>
        <p class="font-semibold text-gray-900">{{ safeNights }}</p>
      </div>
      <div>
        <p class="text-xs font-medium uppercase tracking-wide text-gray-400">Personas</p>
        <p class="font-semibold text-gray-900">{{ safeTotalPersons }}</p>
      </div>
    </div>

    <p
      v-if="safeQuoteExpiresLabel"
      class="mt-2 text-xs"
      :class="isQuoteExpired ? 'text-orange-600' : 'text-gray-400'"
    >
      {{ isQuoteExpired ? 'Venció el' : 'Válida hasta' }} {{ safeQuoteExpiresLabel }}
    </p>
  </section>

  <section class="doc-content-section border-b py-4">
    <h2 class="doc-content-subtitle text-sm font-semibold uppercase tracking-wide">Datos del solicitante</h2>
    <div class="mt-3 grid grid-cols-1 gap-2 text-sm text-gray-700 md:grid-cols-2">
      <p><span class="font-semibold">Nombre:</span> {{ safeGuestName }}</p>
      <p><span class="font-semibold">Telefono:</span> {{ safeGuestPhone }}</p>
    </div>
  </section>

  <section v-if="showStaySection" class="doc-content-section border-b py-4">
    <h2 class="doc-content-subtitle text-sm font-semibold uppercase tracking-wide">Detalle de la estadia</h2>
    <div class="mt-3 grid grid-cols-1 gap-2 text-sm text-gray-700 md:grid-cols-2">
      <p v-if="safeUnitsLabel"><span class="font-semibold">Unidades:</span> {{ safeUnitsLabel }}</p>
      <p><span class="font-semibold">Check-in:</span> {{ safeCheckInLabel }}</p>
      <p><span class="font-semibold">Check-out:</span> {{ safeCheckOutLabel }}</p>
      <p><span class="font-semibold">Noches:</span> {{ safeNights }}</p>
      <p><span class="font-semibold">Adultos:</span> {{ safeAdults }} · <span class="font-semibold">Ninos:</span> {{ safeChildren }}</p>
    </div>
  </section>

  <section v-if="showFinancialSection" class="doc-content-section border-b py-4">
    <h2 class="doc-content-subtitle text-sm font-semibold uppercase tracking-wide">Resumen financiero</h2>
    <div class="mt-3 space-y-1 text-sm text-gray-700">
      <p class="flex justify-between gap-3"><span>Precio por noche:</span> <span class="font-medium">{{ toMoney(pricePerNight) }}</span></p>
      <p class="flex justify-between gap-3"><span>Subtotal:</span> <span class="font-medium">{{ toMoney(subtotal) }}</span></p>
      <p v-if="safeDiscountPercentage > 0" class="flex justify-between gap-3"><span>Descuento ({{ safeDiscountPercentage }}%):</span> <span class="font-medium">-{{ toMoney(discountAmount) }}</span></p>
    </div>

    <div class="my-4 border-t border-dashed border-gray-300"></div>

    <div class="space-y-1 text-sm text-gray-700">
      <p class="flex justify-between gap-3 font-semibold text-gray-900"><span>Total:</span> <span>{{ toMoney(totalCustomer) }}</span></p>
    </div>
  </section>

  <section class="doc-content-section border-b py-4">
    <h2 class="doc-content-subtitle text-sm font-semibold uppercase tracking-wide">Notas</h2>
    <p class="mt-3 text-sm text-gray-700">Esta cotizacion no constituye una reserva confirmada.</p>
    <p v-if="safeQuoteExpiresLabel" class="mt-2 text-sm text-gray-700">Valida hasta el {{ safeQuoteExpiresLabel }}.</p>
  </section>

  <footer class="pt-4 text-sm text-gray-700">
    <p>{{ safeFooterContactLine }}</p>
    <p class="mt-2"><span class="font-semibold">Generado el:</span> {{ safeGeneratedAtLabel }}</p>
  </footer>
</template>

<script setup>
import { computed } from 'vue'
import { formatCop } from '../../utils/voucherUtils'
import { QUOTATION_PREVIEW_MOCK } from '../../utils/documentMocks'

const props = defineProps({
  guestName: { type: String, default: QUOTATION_PREVIEW_MOCK.guestName },
  referenceDisplay: { type: String, default: QUOTATION_PREVIEW_MOCK.referenceDisplay },
  quotationNumber: { type: String, default: QUOTATION_PREVIEW_MOCK.quotationNumber },
  isQuoteExpired: { type: Boolean, default: QUOTATION_PREVIEW_MOCK.isQuoteExpired },
  currentDateLabel: { type: String, default: QUOTATION_PREVIEW_MOCK.currentDateLabel },
  quoteExpiresLabel: { type: String, default: QUOTATION_PREVIEW_MOCK.quoteExpiresLabel },
  checkInLabel: { type: String, default: QUOTATION_PREVIEW_MOCK.checkInLabel },
  checkOutLabel: { type: String, default: QUOTATION_PREVIEW_MOCK.checkOutLabel },
  nights: { type: [Number, String], default: QUOTATION_PREVIEW_MOCK.nights },
  totalPersons: { type: [Number, String], default: QUOTATION_PREVIEW_MOCK.totalPersons },
  guestPhone: { type: String, default: QUOTATION_PREVIEW_MOCK.guestPhone },
  unitsLabel: { type: String, default: QUOTATION_PREVIEW_MOCK.unitsLabel },
  adults: { type: [Number, String], default: QUOTATION_PREVIEW_MOCK.adults },
  children: { type: [Number, String], default: QUOTATION_PREVIEW_MOCK.children },
  showStaySection: { type: Boolean, default: QUOTATION_PREVIEW_MOCK.showStaySection },
  showFinancialSection: { type: Boolean, default: QUOTATION_PREVIEW_MOCK.showFinancialSection },
  pricePerNight: { type: [Number, String], default: QUOTATION_PREVIEW_MOCK.pricePerNight },
  subtotal: { type: [Number, String], default: QUOTATION_PREVIEW_MOCK.subtotal },
  discountPercentage: { type: [Number, String], default: QUOTATION_PREVIEW_MOCK.discountPercentage },
  discountAmount: { type: [Number, String], default: QUOTATION_PREVIEW_MOCK.discountAmount },
  totalCustomer: { type: [Number, String], default: QUOTATION_PREVIEW_MOCK.totalCustomer },
  footerContactLine: { type: String, default: QUOTATION_PREVIEW_MOCK.footerContactLine },
  generatedAtLabel: { type: String, default: QUOTATION_PREVIEW_MOCK.generatedAtLabel },
})

const safeGuestName = computed(() => props.guestName || '-')
const safeReferenceDisplay = computed(() => props.referenceDisplay || '-')
const safeQuotationNumber = computed(() => props.quotationNumber || '-')
const safeCurrentDateLabel = computed(() => props.currentDateLabel || '-')
const safeQuoteExpiresLabel = computed(() => props.quoteExpiresLabel || '')
const safeCheckInLabel = computed(() => props.checkInLabel || '-')
const safeCheckOutLabel = computed(() => props.checkOutLabel || '-')
const safeNights = computed(() => props.nights ?? 0)
const safeTotalPersons = computed(() => props.totalPersons ?? 0)
const safeGuestPhone = computed(() => props.guestPhone || '-')
const safeUnitsLabel = computed(() => props.unitsLabel || '')
const safeAdults = computed(() => props.adults ?? 0)
const safeChildren = computed(() => props.children ?? 0)
const safeFooterContactLine = computed(() => props.footerContactLine || '-')
const safeGeneratedAtLabel = computed(() => props.generatedAtLabel || '-')
const safeDiscountPercentage = computed(() => Number(props.discountPercentage || 0))

const toMoney = (value) => {
  if (typeof value === 'string') return value
  return formatCop(Number(value || 0))
}
</script>

<style scoped>
.doc-content-title,
.doc-content-subtitle {
  color: var(--doc-accent);
}

.doc-content-section {
  break-inside: avoid;
  page-break-inside: avoid;
}
</style>
