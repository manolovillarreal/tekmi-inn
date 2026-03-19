<template>
  <section v-if="isVisible" class="rounded-lg border border-[#E5E7EB] bg-[#F8F9FC] p-4 text-sm text-[#111827]">
    <div class="space-y-1">
      <p class="flex items-center justify-between gap-3">
        <span>Noches</span>
        <strong>{{ calculations.nights }}</strong>
      </p>
      <p class="flex items-center justify-between gap-3">
        <span>Precio por noche</span>
        <strong>{{ formatMoney(pricePerNightNumber) }}</strong>
      </p>
      <p class="flex items-center justify-between gap-3">
        <span>Subtotal</span>
        <strong>{{ formatMoney(calculations.subtotal) }}</strong>
      </p>
      <p v-if="discountPercentageNumber > 0" class="flex items-center justify-between gap-3">
        <span>Descuento ({{ discountPercentageNumber }}%)</span>
        <strong>-{{ formatMoney(calculations.discountAmt) }}</strong>
      </p>
      <p v-if="commissionPercentageNumber > 0" class="flex items-center justify-between gap-3">
        <span>Comision ({{ commissionPercentageNumber }}%)</span>
        <strong>-{{ formatMoney(calculations.commissionAmt) }}</strong>
      </p>
    </div>

    <div class="mt-3 border-t border-[#E5E7EB] pt-3">
      <p class="flex items-center justify-between gap-3 text-base font-semibold">
        <span>Total cliente</span>
        <span>{{ formatMoney(calculations.totalCliente) }}</span>
      </p>
      <p v-if="commissionPercentageNumber > 0" class="mt-1 flex items-center justify-between gap-3 text-sm font-medium text-[#4C2FFF]">
        <span>Ingreso neto</span>
        <span>{{ formatMoney(calculations.netAmount) }}</span>
      </p>
      <p v-if="showPerUnit" class="mt-2 flex items-center justify-between gap-3 text-xs text-[#6B7280]">
        <span>Por unidad</span>
        <span>{{ formatMoney(calculations.perUnit) }}</span>
      </p>
      <p v-if="showPerPerson" class="mt-1 flex items-center justify-between gap-3 text-xs text-[#6B7280]">
        <span>Por persona</span>
        <span>{{ formatMoney(calculations.perPerson) }}</span>
      </p>
    </div>
  </section>
</template>

<script setup>
import { computed, watch } from 'vue'

const props = defineProps({
  checkIn: { type: String, default: '' },
  checkOut: { type: String, default: '' },
  pricePerNight: { type: Number, default: 0 },
  discountPercentage: { type: Number, default: 0 },
  commissionPercentage: { type: Number, default: 0 },
  units: { type: Array, default: () => [] },
  adults: { type: Number, default: 1 },
  children: { type: Number, default: 0 },
  currency: { type: String, default: 'COP' }
})

const emit = defineEmits(['update'])

const parseDate = (value) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date
}

const nights = computed(() => {
  const from = parseDate(props.checkIn)
  const to = parseDate(props.checkOut)
  if (!from || !to) return 0
  const diff = Math.ceil((to.getTime() - from.getTime()) / 86400000)
  return diff > 0 ? diff : 0
})

const pricePerNightNumber = computed(() => Number(props.pricePerNight || 0))
const discountPercentageNumber = computed(() => Number(props.discountPercentage || 0))
const commissionPercentageNumber = computed(() => Number(props.commissionPercentage || 0))
const totalPeople = computed(() => Math.max(Number(props.adults || 0) + Number(props.children || 0), 0))
const unitsCount = computed(() => (Array.isArray(props.units) ? props.units.length : 0))

const calculations = computed(() => {
  const subtotal = pricePerNightNumber.value * nights.value
  const discountAmt = subtotal * discountPercentageNumber.value / 100
  const totalCliente = Math.max(subtotal - discountAmt, 0)
  const commissionAmt = totalCliente * commissionPercentageNumber.value / 100
  const netAmount = Math.max(totalCliente - commissionAmt, 0)

  return {
    nights: nights.value,
    subtotal,
    discountAmt,
    totalCliente,
    commissionAmt,
    netAmount,
    perUnit: unitsCount.value > 0 ? totalCliente / unitsCount.value : 0,
    perPerson: totalPeople.value > 0 ? totalCliente / totalPeople.value : 0
  }
})

const isVisible = computed(() => {
  return Boolean(props.checkIn && props.checkOut && nights.value > 0 && pricePerNightNumber.value > 0)
})

const showPerUnit = computed(() => unitsCount.value > 1)
const showPerPerson = computed(() => totalPeople.value > 0)

const formatMoney = (value) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: props.currency,
    maximumFractionDigits: 0
  }).format(Number(value || 0))
}

watch(calculations, (value) => {
  emit('update', { ...value })
}, { immediate: true, deep: true })
</script>
