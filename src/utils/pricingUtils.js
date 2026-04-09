const toNumberOrNull = (value) => {
  if (value === '' || value === null || value === undefined) return null
  const number = Number(value)
  if (Number.isNaN(number)) return null
  return number
}

const normalizeDate = (value) => {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
}

const hasWeekendInRange = (checkIn, checkOut) => {
  const start = normalizeDate(checkIn)
  const end = normalizeDate(checkOut)
  if (!start || !end || start >= end) return false

  const cursor = new Date(start)
  while (cursor < end) {
    const day = cursor.getUTCDay()
    if (day === 5 || day === 6) return true
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }

  return false
}

const buildSettings = (settings = {}) => ({
  price_general_base: toNumberOrNull(settings.price_general_base),
  price_general_min: toNumberOrNull(settings.price_general_min),
  price_general_extra: toNumberOrNull(settings.price_general_extra),
  price_per_person_base: toNumberOrNull(settings.price_per_person_base),
  price_weekend_pct: toNumberOrNull(settings.price_weekend_pct),
  price_peak_pct: toNumberOrNull(settings.price_peak_pct),
  price_child_pct: toNumberOrNull(settings.price_child_pct) ?? 50,
  price_full_house_min: toNumberOrNull(settings.price_full_house_min),
  price_full_house_base: toNumberOrNull(settings.price_full_house_base),
  price_full_house_peak: toNumberOrNull(settings.price_full_house_peak),
})

const getEffectiveUnitBase = (unit, settings) => {
  const unitBase = toNumberOrNull(unit?.price_base)
  const generalBase = settings.price_general_base
  const base = unitBase ?? generalBase
  if (base === null) return null

  const unitMin = toNumberOrNull(unit?.price_min)
  const generalMin = settings.price_general_min
  const minFloor = unitMin ?? generalMin

  if (minFloor === null) return base
  return Math.max(base, minFloor)
}

const getEffectiveExtraRate = (unit, settings) => {
  const unitExtra = toNumberOrNull(unit?.price_extra_person)
  return unitExtra ?? settings.price_general_extra
}

export const buildPricingSuggestion = ({
  selectedUnits = [],
  settings = {},
  checkIn,
  checkOut,
  adults = 1,
  minors = 0,
  children = 0,
  infants = 0,
  ageSettings = null,
  usePeak = false,
  useFullHouse = false,
  allUnitsSelected = false,
}) => {
  const normalizedSettings = buildSettings(settings)
  const weekend = hasWeekendInRange(checkIn, checkOut)

  if (!selectedUnits.length) {
    const baseGeneral = normalizedSettings.price_general_base
    const perPersonBase = normalizedSettings.price_per_person_base
    if (baseGeneral === null && perPersonBase === null) {
      return {
        nightly: null,
        originLabel: '',
        unitBreakdown: [],
        extras: null,
        estimatedLabel: '',
      }
    }

    const persons = Math.max(Number(adults || 0) + Number(minors || 0) + Number(children || 0) + Number(infants || 0), 1)
  const extraPersons = Math.max(persons - 2, 0)
    const baseAmount = baseGeneral ?? 0
  const perPersonAmount = (perPersonBase ?? 0) * extraPersons
    const nightly = baseAmount + perPersonAmount

    const formulaParts = []
    if (baseGeneral !== null) {
      formulaParts.push(`base $${baseAmount.toLocaleString('es-CO')}`)
    }
    if (perPersonBase !== null && extraPersons > 0) {
      formulaParts.push(`${extraPersons} persona(s) × $${(perPersonBase ?? 0).toLocaleString('es-CO')}`)
    }

    const estimateExpression = formulaParts.length ? formulaParts.join(' + ') : '$0'

    return {
      nightly,
      originLabel: 'Sugerido: tarifa general sin unidad asignada',
      unitBreakdown: [],
      extras: null,
      estimatedLabel: `Estimado: ${estimateExpression} = $${nightly.toLocaleString('es-CO')}/noche`,
    }
  }

  if (useFullHouse && allUnitsSelected) {
    const fullHouseBase = usePeak
      ? (normalizedSettings.price_full_house_peak ?? normalizedSettings.price_full_house_base)
      : normalizedSettings.price_full_house_base

    if (fullHouseBase !== null) {
      const fullHouseMin = normalizedSettings.price_full_house_min
      const nightly = fullHouseMin === null ? fullHouseBase : Math.max(fullHouseBase, fullHouseMin)
      return {
        nightly,
        originLabel: usePeak ? 'Sugerido: tarifa pico full house' : 'Sugerido: tarifa base full house',
        unitBreakdown: [],
        extras: null,
        estimatedLabel: '',
      }
    }
  }

  const weekendPct = normalizedSettings.price_weekend_pct || 0
  const peakPct = usePeak ? (normalizedSettings.price_peak_pct || 0) : 0

  const unitBreakdown = selectedUnits.map((unit) => {
    const base = getEffectiveUnitBase(unit, normalizedSettings)
    if (base === null) {
      return {
        unitId: unit.id,
        unitName: unit.name || 'Unidad',
        nightly: null,
        label: 'Sin tarifa configurada',
      }
    }

    let nightly = base
    let label = unit?.price_base !== null && unit?.price_base !== undefined
      ? `Sugerido: tarifa base ${unit.name || 'unidad'}`
      : 'Sugerido: tarifa base general de la cuenta'

    if (weekend && weekendPct > 0) {
      nightly = nightly * (1 + weekendPct / 100)
      label = `Sugerido: tarifa fin de semana · base $${base.toLocaleString('es-CO')} + ${weekendPct}% = $${Math.round(nightly).toLocaleString('es-CO')}`
    }

    if (peakPct > 0) {
      nightly = nightly * (1 + peakPct / 100)
      label = `Sugerido: tarifa pico · ${Math.round(nightly).toLocaleString('es-CO')}`
    }

    return {
      unitId: unit.id,
      unitName: unit.name || 'Unidad',
      nightly,
      label,
    }
  })

  const validNightly = unitBreakdown
    .map((item) => item.nightly)
    .filter((value) => value !== null)

  if (!validNightly.length) {
    return {
      nightly: null,
      originLabel: '',
      unitBreakdown,
      extras: null,
      estimatedLabel: '',
    }
  }

  const capacityIncluded = selectedUnits.reduce((sum, unit) => {
    const capacity = Number(unit?.capacity || 2)
    return sum + (Number.isNaN(capacity) ? 2 : Math.max(capacity, 1))
  }, 0)

  const adultCount = Math.max(Number(adults || 0), 0)
  const minorsCount = Math.max(Number(minors || 0), 0)
  const childrenCount = Math.max(Number(children || 0), 0)
  const infantsCount = Math.max(Number(infants || 0), 0)
  const extraAdults = Math.max(adultCount - capacityIncluded, 0)

  const extraRates = selectedUnits
    .map((unit) => getEffectiveExtraRate(unit, normalizedSettings))
    .filter((rate) => rate !== null)

  const extraRate = extraRates.length
    ? (extraRates.reduce((sum, rate) => sum + rate, 0) / extraRates.length)
    : null

  const minorsPct = ageSettings?.minors_price_pct ?? normalizedSettings.price_child_pct
  const childrenPct = ageSettings?.children_price_pct ?? normalizedSettings.price_child_pct
  const infantsPct = ageSettings?.infants_price_pct ?? 0
  const minorsRate = extraRate === null ? null : (extraRate * (minorsPct / 100))
  const childRate = extraRate === null ? null : (extraRate * (childrenPct / 100))
  const infantsRate = extraRate === null ? null : (extraRate * (infantsPct / 100))
  const extrasNightly = extraRate === null
    ? 0
    : (extraAdults * extraRate) +
      (minorsCount * (minorsRate || 0)) +
      (childrenCount * (childRate || 0)) +
      (infantsCount * (infantsRate || 0))

  const unitNightly = validNightly.reduce((sum, value) => sum + value, 0)
  const nightly = unitNightly + extrasNightly

  const extras = extraRate === null
    ? null
    : {
        capacityIncluded,
        extraAdults,
        minorsCount,
        childrenCount,
        infantsCount,
        extraRate,
        minorsRate: minorsRate || 0,
        minorsPct,
        childRate: childRate || 0,
        childrenPct,
        infantsRate: infantsRate || 0,
        infantsPct,
        nightlyTotal: extrasNightly,
      }

  return {
    nightly,
    originLabel: unitBreakdown.length > 1 ? 'Sugerido: tarifas por unidad consolidadas' : (unitBreakdown[0]?.label || ''),
    unitBreakdown,
    extras,
    estimatedLabel: '',
  }
}
