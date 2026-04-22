export const copyTextToClipboard = async (value) => {
  const text = String(value || '')

  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // Continue with fallback for mobile browsers that block Clipboard API.
    }
  }

  if (typeof document === 'undefined') {
    throw new Error('Clipboard not available')
  }

  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.top = '-9999px'
  textarea.style.left = '-9999px'
  document.body.appendChild(textarea)

  let success = false
  try {
    textarea.focus()
    textarea.select()
    textarea.setSelectionRange(0, textarea.value.length)
    success = document.execCommand('copy')
  } finally {
    document.body.removeChild(textarea)
  }

  if (!success) {
    throw new Error('Clipboard not available')
  }

  return true
}
