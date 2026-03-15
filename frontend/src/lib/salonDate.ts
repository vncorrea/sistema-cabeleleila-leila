/**
 * Salon timezone (GMT-3). Use for displaying appointment date/time so it always
 * shows the salon local time regardless of the user's browser timezone.
 */
const SALON_TIMEZONE = 'America/Sao_Paulo'

export function formatSalonDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: SALON_TIMEZONE,
  })
}

export function formatSalonTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: SALON_TIMEZONE,
  })
}

export function formatSalonDateTime(isoString: string): string {
  return new Date(isoString).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: SALON_TIMEZONE,
  })
}
