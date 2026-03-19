import { supabase } from '../services/supabase'

const ALLOWED_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'

export const generateReferenceCode = () => {
  let code = ''
  for (let i = 0; i < 6; i += 1) {
    const index = Math.floor(Math.random() * ALLOWED_ALPHABET.length)
    code += ALLOWED_ALPHABET[index]
  }
  return code.toUpperCase()
}

export const formatReferenceDisplay = (code, guestName) => {
  const normalizedCode = String(code || '').trim().toUpperCase()
  if (!normalizedCode) return '-'

  const name = String(guestName || '').trim()
  if (!name) return normalizedCode

  const parts = name.split(/\s+/).filter(Boolean)
  const lastName = parts.length > 0 ? parts[parts.length - 1].toUpperCase() : ''
  if (!lastName) return normalizedCode

  return `${normalizedCode} · ${lastName}`
}

export const isReferenceCodeAvailable = async (code, accountId) => {
  const normalizedCode = String(code || '').trim().toUpperCase()
  if (!normalizedCode) return false
  if (!accountId) throw new Error('accountId es obligatorio para validar referencia.')

  const { count, error } = await supabase
    .from('reservations')
    .select('id', { count: 'exact', head: true })
    .eq('account_id', accountId)
    .eq('reference_code', normalizedCode)
    .in('status', ['confirmed', 'in_stay'])

  if (error) throw error
  return Number(count || 0) === 0
}

export const generateUniqueReferenceCode = async (accountId) => {
  if (!accountId) throw new Error('accountId es obligatorio para generar referencia única.')

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const code = generateReferenceCode()
    const available = await isReferenceCodeAvailable(code, accountId)
    if (available) return code
  }

  throw new Error('No fue posible generar un código de referencia único. Intenta nuevamente.')
}

export { ALLOWED_ALPHABET }

// --- Inquiry numbers ---

/**
 * Generates the next inquiry number for an account in the given month.
 *
 * @param {{ date?: Date, previousInquiryNumber?: string|null }} options
 * @returns {string}  e.g. "INQ-202506-0001"
 */
export const generateInquiryNumber = ({ date = new Date(), previousInquiryNumber = null } = {}) => {
  const yearMonth = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`

  let nextSequence = 1
  if (previousInquiryNumber) {
    const parts = previousInquiryNumber.split('-')
    const currentSeq = Number(parts[2] || '0')
    if (!Number.isNaN(currentSeq)) {
      nextSequence = currentSeq + 1
    }
  }

  return `INQ-${yearMonth}-${String(nextSequence).padStart(4, '0')}`
}
