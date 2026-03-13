import { useState, useEffect } from 'react'
import { Header } from '@/components/Header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Empty, EmptyIcon, EmptyTitle, EmptyDescription } from '@/components/ui/empty'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import { CalendarDays, Clock, User } from 'lucide-react'
import { appointmentsApi } from '@/lib/api'
import type { Appointment } from '@/lib/api'
import { toast } from 'sonner'
import { getToken } from '@/lib/api'
import { cn } from '@/lib/utils'

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pendente', className: 'bg-[#FEF9E7] text-[#8A7B00]' },
  confirmed: { label: 'Confirmado', className: 'bg-[#E6F7E6] text-[#2B822B]' },
  completed: { label: 'Concluído', className: 'bg-[#E0F2FF] text-[#007BFF]' },
  cancelled: { label: 'Cancelado', className: 'bg-[#FFECEB] text-[#c41e1e]' },
}

function formatTime(startsAt: string) {
  return new Date(startsAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function servicesLabel(appointment: Appointment): string {
  return appointment.items?.map((i) => i.salon_service?.name).filter(Boolean).join(', ') ?? ''
}

type ValuePiece = Date | null
type Value = ValuePiece | [ValuePiece, ValuePiece]

export function CalendarPage() {
  const [date, setDate] = useState<Value>(new Date())
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

  const singleDate = Array.isArray(date) ? date[0] : date
  const dateStr = singleDate ? singleDate.toISOString().slice(0, 10) : ''

  useEffect(() => {
    if (!dateStr) return
    const start = dateStr
    const end = dateStr
    setLoading(true)
    appointmentsApi
      .list({ start_date: start, end_date: end })
      .then((res) => setAppointments(res.data.data))
      .catch(() => {
        toast.error('Erro ao carregar agendamentos.')
        setAppointments([])
      })
      .finally(() => setLoading(false))
  }, [dateStr])

  const isLoggedIn = !!getToken()

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="mx-auto max-w-2xl px-6 py-12">
          <Empty>
            <EmptyIcon>
              <CalendarDays className="h-10 w-10" />
            </EmptyIcon>
            <EmptyTitle>Faça login para ver o calendário</EmptyTitle>
            <EmptyDescription>
              Acesse com sua conta para visualizar os agendamentos no calendário.
            </EmptyDescription>
          </Empty>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto max-w-5xl px-6 py-12 lg:px-8">
        <div className="text-center mb-10">
          <h1 className="font-serif text-3xl font-bold text-foreground mb-2">
            Calendário de Agendamentos
          </h1>
          <p className="text-muted-foreground">
            Selecione um dia para ver os agendamentos
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Calendário</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                value={date}
                onChange={setDate}
                locale="pt-BR"
                className={cn(
                  'w-full border-0 bg-transparent [&_.react-calendar__tile]:rounded-md',
                  '[&_.react-calendar__tile]:p-2 [&_.react-calendar__month-view__days__day]:text-sm',
                  '[&_.react-calendar__tile--now]:bg-primary/10 [&_.react-calendar__tile--now]:font-semibold',
                  '[&_.react-calendar__tile:enabled:hover]:bg-secondary [&_.react-calendar__tile--active]:bg-primary [&_.react-calendar__tile--active]:text-primary-foreground',
                  '[&_.react-calendar__navigation__label]:font-semibold [&_.react-calendar__month-view__weekdays__weekday]:text-muted-foreground [&_.react-calendar__month-view__weekdays__weekday]:text-xs'
                )}
              />
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">
                {singleDate
                  ? singleDate.toLocaleDateString('pt-BR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                    })
                  : 'Selecione um dia'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-muted-foreground py-8 text-center">Carregando...</p>
              ) : appointments.length === 0 ? (
                <Empty>
                  <EmptyIcon>
                    <Clock className="h-8 w-8" />
                  </EmptyIcon>
                  <EmptyTitle>Nenhum agendamento neste dia</EmptyTitle>
                  <EmptyDescription>
                    Não há agendamentos para a data selecionada.
                  </EmptyDescription>
                </Empty>
              ) : (
                <div className="space-y-3">
                  {appointments.map((appointment) => {
                    const status = statusConfig[appointment.status] ?? {
                      label: appointment.status,
                      className: 'bg-muted text-muted-foreground',
                    }
                    return (
                      <div
                        key={appointment.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border gap-3"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{formatTime(appointment.starts_at)}</span>
                            <Badge className={status.className}>{status.label}</Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <User className="h-4 w-4" />
                            <span>{appointment.client?.name ?? `Cliente #${appointment.client_id}`}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {servicesLabel(appointment)}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
