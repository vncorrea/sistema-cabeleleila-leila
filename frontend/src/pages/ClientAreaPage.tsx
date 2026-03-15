import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Header } from '@/components/Header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import { Empty, EmptyIcon, EmptyTitle, EmptyDescription } from '@/components/ui/empty'
import { Calendar, Clock, User, CalendarClock } from 'lucide-react'
import { appointmentsApi } from '@/lib/api'
import type { Appointment } from '@/lib/api'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { DateTimePicker } from '@/components/DateTimePicker'
import { formatSalonDate, formatSalonTime } from '@/lib/salonDate'

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pendente', className: 'bg-[#FEF9E7] text-[#8A7B00]' },
  confirmed: { label: 'Confirmado', className: 'bg-[#E6F7E6] text-[#2B822B]' },
  completed: { label: 'Concluído', className: 'bg-[#E0F2FF] text-[#007BFF]' },
  cancelled: { label: 'Cancelado', className: 'bg-[#FFECEB] text-[#c41e1e]' },
}

const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000

function servicesLabel(appointment: Appointment): string {
  return appointment.items?.map((i) => i.salon_service?.name).filter(Boolean).join(', ') ?? ''
}

function canReschedule(appointment: Appointment): boolean {
  if (appointment.status !== 'pending' && appointment.status !== 'confirmed') return false
  const startsAt = new Date(appointment.starts_at).getTime()
  return startsAt - Date.now() >= TWO_DAYS_MS
}

export function ClientAreaPage() {
  const [email, setEmail] = useState('')
  const [emailInput, setEmailInput] = useState('')
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(false)
  const [rescheduleId, setRescheduleId] = useState<number | null>(null)
  const [rescheduleDateTime, setRescheduleDateTime] = useState('')
  const [savingReschedule, setSavingReschedule] = useState(false)

  const handleAccess = async (e: React.FormEvent) => {
    e.preventDefault()
    const value = emailInput.trim().toLowerCase()
    if (!value) {
      toast.error('Informe o e-mail usado no agendamento.')
      return
    }
    setLoading(true)
    try {
      const { data } = await appointmentsApi.listByClientEmail(value)
      setAppointments(data.data)
      setEmail(value)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao buscar agendamentos.')
    } finally {
      setLoading(false)
    }
  }

  const handleReschedule = async () => {
    if (!rescheduleId || !rescheduleDateTime || !email) return
    setSavingReschedule(true)
    try {
      await appointmentsApi.clientReschedule(rescheduleId, email, rescheduleDateTime)
      toast.success('Agendamento reagendado com sucesso.')
      setRescheduleId(null)
      setRescheduleDateTime('')
      const { data } = await appointmentsApi.listByClientEmail(email)
      setAppointments(data.data)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao reagendar.')
    } finally {
      setSavingReschedule(false)
    }
  }

  const handleBack = () => {
    setEmail('')
    setAppointments([])
    setEmailInput('')
    setRescheduleId(null)
    setRescheduleDateTime('')
  }

  return (
    <div className="min-h-screen w-full bg-background">
      <Header />

      <main className="w-full max-w-7xl mx-auto px-6 py-12 lg:px-8">
        <div className="text-center mb-10">
          <h1 className="font-serif text-3xl font-bold text-foreground mb-2">
            Área do cliente
          </h1>
          <p className="text-muted-foreground">
            Veja seus agendamentos e reagende quando precisar (até 2 dias antes)
          </p>
        </div>

        {!email ? (
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleAccess} className="space-y-4">
                <FieldGroup>
                  <Field>
                    <FieldLabel>E-mail</FieldLabel>
                    <Input
                      type="email"
                      placeholder="E-mail usado no agendamento"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="h-12"
                    />
                  </Field>
                </FieldGroup>
                <p className="text-sm text-muted-foreground">
                  Informe o mesmo e-mail que você usou ao fazer o agendamento.
                </p>
                <Button type="submit" className="w-full h-12" disabled={loading}>
                  {loading ? 'Buscando...' : 'Acessar meus agendamentos'}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <p className="text-sm text-muted-foreground">
                Agendamentos para <strong>{email}</strong>
              </p>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={handleBack}>
                  Trocar e-mail
                </Button>
                <Link to="/agendar" state={{ clientEmail: email }}>
                  <Button size="sm">
                    <Calendar className="mr-2 h-4 w-4" />
                    Novo agendamento
                  </Button>
                </Link>
              </div>
            </div>

            {appointments.length === 0 ? (
              <Empty>
                <EmptyIcon>
                  <CalendarClock className="h-10 w-10" />
                </EmptyIcon>
                <EmptyTitle>Nenhum agendamento encontrado</EmptyTitle>
                <EmptyDescription>
                  Não há agendamentos para este e-mail. Faça um novo agendamento ou verifique o e-mail informado.
                </EmptyDescription>
                <Link to="/agendar" state={{ clientEmail: email }} className="inline-block mt-4">
                  <Button>Fazer agendamento</Button>
                </Link>
              </Empty>
            ) : (
              <div className="space-y-4">
                {appointments.map((appointment) => {
                  const status = statusConfig[appointment.status] ?? {
                    label: appointment.status,
                    className: 'bg-muted text-muted-foreground',
                  }
                  const isRescheduling = rescheduleId === appointment.id
                  const canEditByRule = canReschedule(appointment)

                  return (
                    <Card key={appointment.id} className="overflow-hidden">
                      <CardContent className="p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">
                                  {formatSalonDate(appointment.starts_at)}, {formatSalonTime(appointment.starts_at)}
                                </span>
                              </div>
                              <Badge className={status.className}>{status.label}</Badge>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground text-sm">
                              <User className="h-4 w-4" />
                              <span>{appointment.client?.name ?? 'Cliente'}</span>
                              <span className="text-border">|</span>
                              <span>{servicesLabel(appointment)}</span>
                            </div>
                          </div>
                          {(appointment.status === 'pending' || appointment.status === 'confirmed') && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1"
                              onClick={() => {
                                setRescheduleId(appointment.id)
                                const d = new Date(appointment.starts_at)
                                setRescheduleDateTime(format(d, "yyyy-MM-dd'T'HH:mm"))
                              }}
                              disabled={rescheduleId !== null && !isRescheduling}
                            >
                              <CalendarClock className="h-3.5 w-3.5" />
                              Reagendar
                            </Button>
                          )}
                        </div>

                        {isRescheduling && (
                          <div className="mt-6 pt-6 border-t border-border space-y-4">
                            <p className="text-sm font-medium">Escolha a nova data e horário:</p>
                            <DateTimePicker
                              value={rescheduleDateTime}
                              onChange={setRescheduleDateTime}
                              minDate={new Date()}
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={handleReschedule}
                                disabled={!rescheduleDateTime || savingReschedule}
                              >
                                {savingReschedule ? 'Salvando...' : 'Confirmar reagendamento'}
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setRescheduleId(null)
                                  setRescheduleDateTime('')
                                }}
                              >
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        )}

                        {!canEditByRule && (appointment.status === 'pending' || appointment.status === 'confirmed') && !isRescheduling && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Alterações só podem ser feitas até 2 dias antes. Para mudar com menos de 2 dias, entre em contato com o salão por telefone.
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </>
        )}

        <p className="text-center text-sm text-muted-foreground mt-8">
          Não tem agendamento?{' '}
          <Link to="/agendar" state={email ? { clientEmail: email } : undefined} className="text-primary hover:underline">
            Agende aqui
          </Link>
        </p>
      </main>
    </div>
  )
}
