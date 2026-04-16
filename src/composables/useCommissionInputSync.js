import { computed } from 'vue'

const roundToTwo = (value) => {
  const parsed = Number(value || 0)
  if (!Number.isFinite(parsed)) return 0
  return Math.round(parsed * 100) / 100
}

export function useCommissionInputSync(formRef, nightsRef) {
  const commissionBaseAmount = computed(() => {
    const nights = Number(nightsRef.value || 0)
    const pricePerNight = Number(formRef.value?.price_per_night || 0)
    const discountPercentage = Number(formRef.value?.discount_percentage || 0)

    const subtotal = pricePerNight * nights
    const discountAmount = subtotal * discountPercentage / 100

    return Math.max(subtotal - discountAmount, 0)
  })

  const commissionAmountModel = computed({
    get() {
      const rawPercentage = formRef.value?.commission_percentage
      if (rawPercentage === '' || rawPercentage == null) return ''

      const percentage = Number(rawPercentage || 0)
      if (!Number.isFinite(percentage)) return ''

      return roundToTwo(commissionBaseAmount.value * percentage / 100)
    },
    set(value) {
      if (value === '' || value == null) {
        formRef.value.commission_percentage = ''
        return
      }

      const amount = Number(value)
      if (!Number.isFinite(amount)) return

      if (commissionBaseAmount.value <= 0) {
        formRef.value.commission_percentage = 0
        return
      }

      formRef.value.commission_percentage = roundToTwo((amount / commissionBaseAmount.value) * 100)
    }
  })

  return {
    commissionBaseAmount,
    commissionAmountModel,
  }
}
