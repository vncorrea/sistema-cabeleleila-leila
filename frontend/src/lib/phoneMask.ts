/**
 * Brazilian phone: (XX) XXXXX-XXXX or (XX) XXXX-XXXX
 * Stores and accepts only digits; format for display.
 */
export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) {
    return digits.length ? `(${digits}` : ''
  }
  if (digits.length <= 7) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

export function phoneToDigits(value: string): string {
  return value.replace(/\D/g, '')
}
