import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { Header } from '@/components/Header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import { Empty, EmptyIcon, EmptyTitle, EmptyDescription } from '@/components/ui/empty'
import { Calendar, Search, Users, CheckCircle } from 'lucide-react'
import Swal from 'sweetalert2'
import { appointmentsApi, getUser } from '@/lib/api'
import type { Appointment } from '@/lib/api'
import { toast } from 'sonner'

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: {
    label: 'Pendente',
    className: 'bg-[#FEF9E7] text-[#8A7B00] hover:bg-[#FEF9E7]',
  },
  confirmed: {
    label: 'Confirmado',
    className: 'bg-[#E6F7E6] text-[#2B822B] hover:bg-[#E6F7E6]',
  },
  completed: {
    label: 'Concluído',
    className: 'bg-[#E0F2FF] text-[#007BFF] hover:bg-[#E0F2FF]',
  },
  cancelled: {
    label: 'Cancelado',
    className: 'bg-[#FFECEB] text-[#c41e1e] hover:bg-[#FFECEB]',
  },
}

function formatDate(startsAt: string) {
  return new Date(startsAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function formatTime(startsAt: string) {
  return new Date(startsAt).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function servicesLabel(appointment: Appointment): string {
  return appointment.items?.map((i) => i.salon_service?.name).filter(Boolean).join(', ') ?? ''
}

export function EquipePage() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const user = getUser()

  const load = () => {
    setLoading(true)
    const params =
      startDate || endDate
        ? { start_date: startDate || undefined, end_date: endDate || startDate || undefined }
        : undefined
    appointmentsApi
      .list(params)
      .then((res) => setAppointments(res.data.data))
      .catch(() => toast.error('Erro ao carregar agendamentos.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const handleFilter = () => load()

  const handleConfirm = async (id: number) => {
    try {
      await appointmentsApi.confirm(id)
      toast.success('Agendamento confirmado.')
      load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao confirmar.')
    }
  }

  const handleCancel = async (id: number) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Cancelar agendamento?',
      text: 'Deseja realmente cancelar este agendamento?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sim, cancelar',
      cancelButtonText: 'Não',
    })
    if (!isConfirmed) return
    try {
      await appointmentsApi.cancel(id, true)
      toast.success('Agendamento cancelado.')
      load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao cancelar.')
    }
  }

  const totalAppointments = appointments.length
  const confirmedCount = appointments.filter((a) => a.status === 'confirmed').length

  if (user?.role === 'professional') {
    return <Navigate to="/" replace />
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto max-w-5xl px-6 py-12 lg:px-8">
        <div className="text-center mb-10">
          <h1 className="font-serif text-3xl font-bold text-foreground mb-2">
            Agendamentos da Equipe
          </h1>
          <p className="text-muted-foreground">Gerencie os agendamentos</p>
        </div>

        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <FieldGroup>
                <Field>
                  <FieldLabel>Data início</FieldLabel>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-11"
                  />
                </Field>
              </FieldGroup>
              <FieldGroup>
                <Field>
                  <FieldLabel>Data fim</FieldLabel>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="h-11"
                  />
                </Field>
              </FieldGroup>
              <Button onClick={handleFilter} className="h-11" disabled={loading}>
                <Search className="mr-2 h-4 w-4" />
                Filtrar
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f0f0f0]">
                <Users className="h-6 w-6 text-[#2d2d2d]" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Agendamentos</p>
                <p className="text-2xl font-bold">{totalAppointments}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FDF2F4]">
                <Calendar className="h-6 w-6 text-[#c77b8a]" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">No período</p>
                <p className="text-2xl font-bold">{totalAppointments}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E6F7E6]">
                <CheckCircle className="h-6 w-6 text-[#2B822B]" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Confirmados</p>
                <p className="text-2xl font-bold">{confirmedCount}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista de agendamentos</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground py-8 text-center">Carregando...</p>
            ) : appointments.length === 0 ? (
              <Empty>
                <EmptyIcon>
                  <Calendar className="h-8 w-8" />
                </EmptyIcon>
                <EmptyTitle>Nenhum agendamento</EmptyTitle>
                <EmptyDescription>
                  Não há agendamentos para o período selecionado.
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
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border gap-4"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-medium">
                            {formatDate(appointment.starts_at)}, {formatTime(appointment.starts_at)}
                          </span>
                          <Badge className={status.className}>{status.label}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {appointment.client?.name ?? `Cliente #${appointment.client_id}`} –{' '}
                          {servicesLabel(appointment)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {appointment.status === 'pending' && (
                          <Button size="sm" onClick={() => handleConfirm(appointment.id)}>
                            Confirmar
                          </Button>
                        )}
                        {appointment.status !== 'cancelled' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-[#ffdada] bg-[#f9eded] text-[#c41e1e] hover:bg-[#f9eded] hover:text-[#c41e1e]"
                            onClick={() => handleCancel(appointment.id)}
                          >
                            Cancelar
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
