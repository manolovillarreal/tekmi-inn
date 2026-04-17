<template>
  <section class="doc-content-section border-b pb-4">
    <div class="flex items-baseline justify-between gap-3">
      <h1 class="doc-content-title text-xl font-semibold">Cotización</h1>

      <div class="flex items-center gap-2">
        <span class="text-xs font-mono text-gray-400">{{ safeQuotationNumber }} · {{ safeReferenceDisplay }}</span>
        <span
          class="rounded-full px-2 py-0.5 text-xs font-semibold"
          :class="isQuoteExpired ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'"
        >
          {{ isQuoteExpired ? 'Vencida' : 'Vigente' }}
        </span>
        <span class="text-xs text-gray-400">{{ safeCurrentDateLabel }}</span>
      </div>
    </div>

    <div class="mt-3 rounded-md border border-gray-100 bg-gray-50 px-3 py-2">
      <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Solicitante</p>
      <div class="grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-gray-700">
        <p><span class="font-semibold">Nombre:</span> {{ safeGuestName }}</p>
        <p><span class="font-semibold">Teléfono:</span> {{ safeGuestPhone }}</p>
      </div>
    </div>

    <div class="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-gray-700 print:grid-cols-3 md:grid-cols-3">
      <p v-if="safeUnitsLabel"><span class="font-semibold">Unidad:</span> {{ safeUnitsLabel }}</p>
      <p><span class="font-semibold">Check-in:</span> {{ safeCheckInLabel }}</p>
      <p><span class="font-semibold">Check-out:</span> {{ safeCheckOutLabel }}</p>
      <p><span class="font-semibold">Noches:</span> {{ safeNights }}</p>
      <p><span class="font-semibold">Personas:</span> {{ safeTotalPersons }}</p>
      <p v-if="safeQuoteExpiresLabel" :class="isQuoteExpired ? 'text-orange-600' : 'text-gray-700'">
        <span class="font-semibold">Válida hasta:</span> {{ safeQuoteExpiresLabel }}
      </p>
    </div>
  </section>

  <section v-if="showFinancialSection" class="doc-content-section border-b py-4">
    <h2 class="doc-content-subtitle text-sm font-semibold uppercase tracking-wide">Resumen financiero</h2>
    <div class="mt-3 space-y-1 text-sm text-gray-700">
      <p class="flex justify-between gap-3"><span>Precio por noche:</span> <span class="font-medium">{{ toMoney(pricePerNight) }}</span></p>
      <p class="flex justify-between gap-3"><span>Subtotal:</span> <span class="font-medium">{{ toMoney(subtotal) }}</span></p>
      <p v-if="safeDiscountPercentage > 0" class="flex justify-between gap-3"><span>Descuento ({{ safeDiscountPercentage }}%):</span> <span class="font-medium">-{{ toMoney(discountAmount) }}</span></p>

      <div class="my-4 border-t border-dashed border-gray-300"></div>

      <p class="flex justify-between gap-3 font-semibold text-gray-900"><span>Total:</span> <span>{{ toMoney(totalCustomer) }}</span></p>
    </div>
  </section>

  <section class="doc-content-section border-b py-4">
    <h2 class="doc-content-subtitle text-sm font-semibold uppercase tracking-wide">Notas</h2>
    <p class="mt-3 text-sm text-gray-700">Esta cotizacion no constituye una reserva confirmada.</p>
    <p v-if="safeQuoteExpiresLabel" class="mt-2 text-sm text-gray-700">Valida hasta el {{ safeQuoteExpiresLabel }}.</p>
  </section>
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
