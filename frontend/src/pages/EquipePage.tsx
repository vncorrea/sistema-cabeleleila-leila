import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { Header } from '@/components/Header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Empty, EmptyIcon, EmptyTitle, EmptyDescription } from '@/components/ui/empty'
import { format } from 'date-fns'
import { Calendar, Search, Users, CheckCircle, UserCircle, CalendarClock } from 'lucide-react'
import Swal from 'sweetalert2'
import { appointmentsApi, usersApi, getUser } from '@/lib/api'
import type { Appointment } from '@/lib/api'
import { toast } from 'sonner'
import { DateTimePicker } from '@/components/DateTimePicker'
import { formatSalonDate, formatSalonTime } from '@/lib/salonDate'

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

function servicesLabel(appointment: Appointment): string {
  return appointment.items?.map((i) => i.salon_service?.name).filter(Boolean).join(', ') ?? ''
}

export function EquipePage() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [filterAssignedUserId, setFilterAssignedUserId] = useState<string>('')
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [professionals, setProfessionals] = useState<{ id: number; name: string; email: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  const [rescheduleId, setRescheduleId] = useState<number | null>(null)
  const [rescheduleDateTime, setRescheduleDateTime] = useState('')
  const [savingReschedule, setSavingReschedule] = useState(false)
  const user = getUser()

  useEffect(() => {
    usersApi.professionals().then((r) => setProfessionals(r.data.data)).catch(() => {})
  }, [])

  const load = () => {
    setLoading(true)
    const params: { start_date?: string; end_date?: string; assigned_user_id?: number } = {}
    if (startDate || endDate) {
      params.start_date = startDate || undefined
      params.end_date = endDate || startDate || undefined
    }
    if (filterAssignedUserId) {
      params.assigned_user_id = Number(filterAssignedUserId)
    }
    appointmentsApi
      .list(Object.keys(params).length ? params : undefined)
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

  const handleChangeAssigned = async (appointmentId: number, newAssignedUserId: number | null) => {
    setUpdatingId(appointmentId)
    try {
      await appointmentsApi.update(appointmentId, {
        assigned_user_id: newAssignedUserId ?? undefined,
        by_staff: true,
      })
      toast.success('Cabelereira alterada.')
      load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao alterar.')
    } finally {
      setUpdatingId(null)
    }
  }

  const handleReschedule = async () => {
    if (!rescheduleId || !rescheduleDateTime) return
    setSavingReschedule(true)
    try {
      await appointmentsApi.update(rescheduleId, {
        starts_at: rescheduleDateTime,
        by_staff: true,
      })
      toast.success('Agendamento reagendado.')
      setRescheduleId(null)
      setRescheduleDateTime('')
      load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao reagendar.')
    } finally {
      setSavingReschedule(false)
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
    <div className="min-h-screen w-full bg-background">
      <Header />

      <main className="w-full max-w-7xl mx-auto px-6 py-12 lg:px-8">
        <div className="text-center mb-10">
          <h1 className="font-serif text-3xl font-bold text-foreground mb-2">
            Agendamentos da Equipe
          </h1>
          <p className="text-muted-foreground">Gerencie os agendamentos</p>
        </div>

        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <FieldGroup>
                <Field>
                  <FieldLabel>Cabelereira</FieldLabel>
                  <Select
                    value={filterAssignedUserId || 'all'}
                    onValueChange={(v) => setFilterAssignedUserId(v === 'all' || v == null ? '' : v)}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue>
                        {!filterAssignedUserId || filterAssignedUserId === 'all'
                          ? 'Todas'
                          : professionals.find((p) => String(p.id) === filterAssignedUserId)?.name ?? 'Todas'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {professionals.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </FieldGroup>
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
                      className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center justify-between p-4 rounded-lg border gap-4"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1 flex-wrap">
                          <span className="font-medium">
                            {formatSalonDate(appointment.starts_at)}, {formatSalonTime(appointment.starts_at)}
                          </span>
                          <Badge className={status.className}>{status.label}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {appointment.client?.name ?? `Cliente #${appointment.client_id}`} –{' '}
                          {servicesLabel(appointment)}
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                          <UserCircle className="h-4 w-4 shrink-0" />
                          <Select
                            value={appointment.assigned_user_id ? String(appointment.assigned_user_id) : 'none'}
                            onValueChange={(v) =>
                              handleChangeAssigned(
                                appointment.id,
                                v === 'none' ? null : Number(v)
                              )
                            }
                            disabled={updatingId === appointment.id}
                          >
                            <SelectTrigger className="h-8 w-auto max-w-[180px] text-xs">
                              <SelectValue>
                                {appointment.assigned_to?.name ?? 'Sem cabelereira'}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Sem cabelereira</SelectItem>
                              {professionals.map((p) => (
                                <SelectItem key={p.id} value={String(p.id)}>
                                  {p.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 shrink-0">
                        {appointment.status !== 'cancelled' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            onClick={() => {
                              setRescheduleId(appointment.id)
                              const d = new Date(appointment.starts_at)
                              setRescheduleDateTime(format(d, "yyyy-MM-dd'T'HH:mm"))
                            }}
                            disabled={rescheduleId !== null && rescheduleId !== appointment.id}
                          >
                            <CalendarClock className="h-3.5 w-3.5" />
                            Reagendar
                          </Button>
                        )}
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
                      {rescheduleId === appointment.id && (
                        <div className="w-full sm:basis-full mt-4 pt-4 border-t border-border space-y-4">
                          <p className="text-sm font-medium">Nova data e horário:</p>
                          <DateTimePicker
                            value={rescheduleDateTime}
                            onChange={setRescheduleDateTime}
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
