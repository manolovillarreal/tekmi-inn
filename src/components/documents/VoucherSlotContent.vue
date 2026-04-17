<template>
  <section class="doc-content-section border-b pb-4">
    <div class="flex items-baseline justify-between gap-3">
      <div>
        <h1 class="doc-content-title text-xl font-semibold">Comprobante de Reserva</h1>
        <p class="mt-1 text-xs text-gray-400">Este documento no constituye factura de venta.</p>
      </div>
      <span class="text-xs font-mono text-gray-400">{{ safeReferenceCode }} · {{ resolvedGuestData.name }} · Emitido {{ safeIssuedAtLabel }}</span>
    </div>

    <div class="mt-3 rounded-md border border-gray-100 bg-gray-50 px-3 py-2">
      <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Titular</p>
      <div class="grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-gray-700 print:grid-cols-2">
        <p><span class="font-semibold">Nombre:</span> {{ resolvedGuestData.name }}</p>
        <p><span class="font-semibold">Documento:</span> {{ resolvedGuestData.document }}</p>
        <p><span class="font-semibold">Teléfono:</span> {{ resolvedGuestData.phone }}</p>
        <p><span class="font-semibold">Email:</span> {{ resolvedGuestData.email }}</p>
      </div>
    </div>

    <div class="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-gray-700 print:grid-cols-3 md:grid-cols-3">
      <p><span class="font-semibold">Unidad:</span> {{ safeUnitLabel }}</p>
      <p><span class="font-semibold">Check-in:</span> {{ safeCheckInLabel }}</p>
      <p><span class="font-semibold">Check-out:</span> {{ safeCheckOutLabel }}</p>
      <p><span class="font-semibold">Origen:</span> {{ safeSourceLabel }}</p>
      <p><span class="font-semibold">Noches:</span> {{ safeNights }}</p>
      <p><span class="font-semibold">Huéspedes:</span> {{ safeAdults }} · <span class="font-semibold">Ninos:</span> {{ safeChildren }}</p>
    </div>
  </section>

  <section class="doc-content-section border-b py-4">
    <h2 class="doc-content-subtitle text-sm font-semibold uppercase tracking-wide">Resumen financiero</h2>

    <div class="mt-3 space-y-1 text-sm text-gray-700">
      <p class="flex justify-between gap-3"><span>Precio por noche:</span> <span class="font-medium">{{ toMoney(pricePerNight) }}</span></p>
      <p class="flex justify-between gap-3"><span>Total reserva:</span> <span class="font-medium">{{ toMoney(totalAmount) }}</span></p>
    </div>

    <div class="my-4 border-t border-dashed border-gray-300"></div>

    <div class="space-y-2 text-sm text-gray-700">
      <p class="font-semibold">Pagos registrados:</p>
      <div v-if="payments.length === 0" class="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500">
        No hay pagos registrados.
      </div>
      <table v-else class="w-full text-left text-sm">
        <thead class="text-xs uppercase text-gray-500">
          <tr>
            <th class="py-1">Fecha</th>
            <th class="py-1">Metodo</th>
            <th class="py-1">Ref</th>
            <th class="py-1 text-right">Monto</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="payment in payments" :key="payment.id" class="border-t border-gray-100">
            <td class="py-2">{{ payment.payment_date || '-' }}</td>
            <td class="py-2 capitalize">{{ payment.method || '-' }}</td>
            <td class="py-2">{{ payment.reference || '-' }}</td>
            <td class="py-2 text-right font-medium">{{ toMoney(payment.amount) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="my-4 border-t border-dashed border-gray-300"></div>

    <div class="space-y-1 text-sm">
      <p class="flex justify-between gap-3 text-gray-700"><span>Total pagado:</span> <span class="font-medium">{{ toMoney(totalPaid) }}</span></p>
      <p class="flex justify-between gap-3 font-semibold" :class="balanceClass">
        <span>Saldo pendiente:</span>
        <span>{{ toMoney(balance) }}</span>
      </p>
    </div>
  </section>

  <footer class="pt-4 text-sm text-gray-700"></footer>
</template>

<script setup>
import { computed } from 'vue'
import { formatCop } from '../../utils/voucherUtils'
import { VOUCHER_PREVIEW_MOCK } from '../../utils/documentMocks'

const props = defineProps({
  referenceCode: { type: String, default: VOUCHER_PREVIEW_MOCK.referenceCode },
  issuedAtLabel: { type: String, default: VOUCHER_PREVIEW_MOCK.issuedAtLabel },
  guestData: { type: Object, default: () => ({ ...VOUCHER_PREVIEW_MOCK.guestData }) },
  unitLabel: { type: String, default: VOUCHER_PREVIEW_MOCK.unitLabel },
  checkInLabel: { type: String, default: VOUCHER_PREVIEW_MOCK.checkInLabel },
  checkOutLabel: { type: String, default: VOUCHER_PREVIEW_MOCK.checkOutLabel },
  sourceLabel: { type: String, default: VOUCHER_PREVIEW_MOCK.sourceLabel },
  nights: { type: [Number, String], default: VOUCHER_PREVIEW_MOCK.nights },
  adults: { type: [Number, String], default: VOUCHER_PREVIEW_MOCK.adults },
  children: { type: [Number, String], default: VOUCHER_PREVIEW_MOCK.children },
  pricePerNight: { type: [Number, String], default: VOUCHER_PREVIEW_MOCK.pricePerNight },
  totalAmount: { type: [Number, String], default: VOUCHER_PREVIEW_MOCK.totalAmount },
  totalPaid: { type: [Number, String], default: VOUCHER_PREVIEW_MOCK.totalPaid },
  balance: { type: [Number, String], default: VOUCHER_PREVIEW_MOCK.balance },
  payments: { type: Array, default: () => [...VOUCHER_PREVIEW_MOCK.payments] },
})

const resolvedGuestData = computed(() => ({
  ...VOUCHER_PREVIEW_MOCK.guestData,
  ...(props.guestData || {}),
}))

const safeReferenceCode = computed(() => props.referenceCode || '-')
const safeIssuedAtLabel = computed(() => props.issuedAtLabel || '-')
const safeUnitLabel = computed(() => props.unitLabel || '-')
const safeCheckInLabel = computed(() => props.checkInLabel || '-')
const safeCheckOutLabel = computed(() => props.checkOutLabel || '-')
const safeSourceLabel = computed(() => props.sourceLabel || '-')
const safeNights = computed(() => props.nights ?? 0)
const safeAdults = computed(() => props.adults ?? 0)
const safeChildren = computed(() => props.children ?? 0)

const toMoney = (value) => {
  if (typeof value === 'string') return value
  return formatCop(Number(value || 0))
}

const balanceClass = computed(() => Number(props.balance || 0) > 0 ? 'text-red-600' : 'text-emerald-700')
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
