import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { Header } from '@/components/Header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
import { Calendar, Search, User } from 'lucide-react'
import Swal from 'sweetalert2'
import { clientsApi, appointmentsApi, getUser } from '@/lib/api'
import type { Client, Appointment } from '@/lib/api'
import { toast } from 'sonner'
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

function totalPrice(appointment: Appointment): number {
  if (!appointment.items?.length) return 0
  return appointment.items.reduce((sum, item) => sum + Number(item.salon_service?.price ?? 0), 0)
}

function servicesLabel(appointment: Appointment): string {
  return appointment.items?.map((i) => i.salon_service?.name).filter(Boolean).join(', ') ?? ''
}

export function HistoryPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClient, setSelectedClient] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [suggestedDate, setSuggestedDate] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const user = getUser()

  useEffect(() => {
    clientsApi.list().then((r) => setClients(r.data.data)).catch(() => toast.error('Erro ao carregar clientes.'))
  }, [])

  const loadHistory = async () => {
    if (startDate && endDate && startDate > endDate) {
      toast.error('Data início não pode ser maior que data fim.')
      return
    }
    setLoading(true)
    try {
      const { data } = await appointmentsApi.historyWithSuggestion({
        ...(selectedClient ? { client_id: Number(selectedClient) } : {}),
        ...(startDate ? { start_date: startDate } : {}),
        ...(endDate ? { end_date: endDate } : {}),
      })
      setAppointments(data.data.appointments)
      setSuggestedDate(data.data.suggested_date)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao carregar histórico.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadHistory()
  }, [])

  const handleSearch = () => {
    loadHistory()
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
      await appointmentsApi.cancel(id, false)
      toast.success('Agendamento cancelado.')
      handleSearch()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao cancelar.')
    }
  }

  if (user?.role === 'professional') {
    return <Navigate to="/" replace />
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto max-w-4xl px-6 py-12 lg:px-8">
        <div className="text-center mb-10">
          <h1 className="font-serif text-3xl font-bold text-foreground mb-2">
            Histórico de Agendamentos
          </h1>
          <p className="text-muted-foreground">Consulte seus agendamentos anteriores</p>
        </div>

        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <FieldGroup>
                <Field>
                  <FieldLabel>Cliente (opcional)</FieldLabel>
                  <Select value={selectedClient || undefined} onValueChange={(v) => setSelectedClient(v ?? '')}>
                    <SelectTrigger size="lg" className="h-11 w-full">
                      {selectedClient ? (
                        <span className="truncate">
                          {clients.find((c) => String(c.id) === selectedClient)?.name ?? selectedClient}
                        </span>
                      ) : (
                        <SelectValue placeholder="Selecione" />
                      )}
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </FieldGroup>
              <FieldGroup>
                <Field>
                  <FieldLabel>Data início (opcional)</FieldLabel>
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
                  <FieldLabel>Data fim (opcional)</FieldLabel>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="h-11"
                  />
                </Field>
              </FieldGroup>
              <Button onClick={handleSearch} className="h-11" disabled={loading}>
                <Search className="mr-2 h-4 w-4" />
                {loading ? 'Buscando...' : 'Buscar'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {suggestedDate && (
          <div className="mb-6 rounded-lg border border-primary/30 bg-primary/5 p-4">
            <p className="text-sm font-medium">
              Você já tem agendamento nesta semana. Sugerimos agendar outros serviços no mesmo dia:{' '}
              <strong>
                {new Date(suggestedDate + 'T12:00:00').toLocaleDateString('pt-BR')}
              </strong>
            </p>
          </div>
        )}

        {appointments.length === 0 && !loading ? (
          <Empty>
            <EmptyIcon>
              <Calendar className="h-10 w-10" />
            </EmptyIcon>
            <EmptyTitle>Nenhum agendamento encontrado</EmptyTitle>
            <EmptyDescription>
              Não encontramos agendamentos. Ajuste os filtros ou busque sem filtros para ver os últimos 30 dias.
            </EmptyDescription>
          </Empty>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment) => {
              const status = statusConfig[appointment.status] ?? {
                label: appointment.status,
                className: 'bg-muted text-muted-foreground',
              }
              return (
                <Card key={appointment.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {formatSalonDate(appointment.starts_at)}, {formatSalonTime(appointment.starts_at)}
                            </span>
                          </div>
                          <Badge className={status.className}>{status.label}</Badge>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <User className="h-4 w-4" />
                          <span>{appointment.client?.name ?? `Cliente #${appointment.client_id}`}</span>
                          <span className="text-border">|</span>
                          <span>{servicesLabel(appointment)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-semibold text-lg">
                          R$ {totalPrice(appointment).toFixed(2)}
                        </span>
                        {appointment.status === 'confirmed' && (
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
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
