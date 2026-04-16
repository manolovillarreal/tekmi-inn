import { computed, ref } from 'vue'

const roundToTwo = (value) => {
  const parsed = Number(value || 0)
  if (!Number.isFinite(parsed)) return 0
  return Math.round(parsed * 100) / 100
}

export function useCommissionInputSync(formRef, nightsRef) {
  const isEditingCommissionAmount = ref(false)
  const commissionAmountDraft = ref('')

  const commissionBaseAmount = computed(() => {
    const nights = Number(nightsRef.value || 0)
    const pricePerNight = Number(formRef.value?.price_per_night || 0)
    const discountPercentage = Number(formRef.value?.discount_percentage || 0)

    const subtotal = pricePerNight * nights
    const discountAmount = subtotal * discountPercentage / 100

    return Math.max(subtotal - discountAmount, 0)
  })

  const syncPercentageFromAmount = (value) => {
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

  const startCommissionAmountEdit = () => {
    isEditingCommissionAmount.value = true

    const rawPercentage = formRef.value?.commission_percentage
    if (rawPercentage === '' || rawPercentage == null) {
      commissionAmountDraft.value = ''
      return
    }

    const percentage = Number(rawPercentage || 0)
    commissionAmountDraft.value = Number.isFinite(percentage)
      ? String(roundToTwo(commissionBaseAmount.value * percentage / 100))
      : ''
  }

  const finishCommissionAmountEdit = () => {
    if (isEditingCommissionAmount.value) {
      syncPercentageFromAmount(commissionAmountDraft.value)
    }

    isEditingCommissionAmount.value = false
    commissionAmountDraft.value = ''
  }

  const commissionAmountModel = computed({
    get() {
      if (isEditingCommissionAmount.value) return commissionAmountDraft.value

      const rawPercentage = formRef.value?.commission_percentage
      if (rawPercentage === '' || rawPercentage == null) return ''

      const percentage = Number(rawPercentage || 0)
      if (!Number.isFinite(percentage)) return ''

      return roundToTwo(commissionBaseAmount.value * percentage / 100)
    },
    set(value) {
      const nextValue = value === '' || value == null ? '' : String(value)
      commissionAmountDraft.value = nextValue
      syncPercentageFromAmount(nextValue)
    }
  })

  return {
    commissionBaseAmount,
    commissionAmountModel,
    startCommissionAmountEdit,
    finishCommissionAmountEdit,
  }
}
