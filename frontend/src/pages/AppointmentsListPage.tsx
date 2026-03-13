import { useState, useEffect } from 'react'
import { appointmentsApi } from '@/lib/api'
import type { Appointment } from '@/lib/api'
import { toast } from 'sonner'
import Swal from 'sweetalert2'
import { Button } from '@/components/ui/button'

export function AppointmentsListPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const load = () => {
    setLoading(true)
    appointmentsApi
      .list(startDate ? { start_date: startDate, end_date: endDate || startDate } : undefined)
      .then((res) => setAppointments(res.data.data))
      .catch(() => toast.error('Erro ao carregar agendamentos.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Agendamentos (equipe)</h1>
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Data início</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Data fim</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2"
          />
        </div>
        <Button onClick={load} disabled={loading}>
          Filtrar
        </Button>
      </div>
      {loading && <p className="text-muted-foreground">Carregando...</p>}
      <div className="space-y-2">
        {!loading && appointments.length === 0 && (
          <p className="text-muted-foreground">Nenhum agendamento.</p>
        )}
        {appointments.map((a) => (
          <div
            key={a.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-4"
          >
            <div>
              <p className="font-medium">
                {new Date(a.starts_at).toLocaleString('pt-BR')} – {a.status}
              </p>
              <p className="text-sm text-muted-foreground">
                {a.client?.name ?? `Cliente #${a.client_id}`}
                {a.items?.length ? ` – ${a.items.map((i) => i.salon_service?.name).join(', ')}` : ''}
              </p>
            </div>
            <div className="flex gap-2">
              {a.status === 'pending' && (
                <Button size="sm" onClick={() => handleConfirm(a.id)}>
                  Confirmar
                </Button>
              )}
              {a.status !== 'cancelled' && (
                <Button size="sm" variant="destructive" onClick={() => handleCancel(a.id)}>
                  Cancelar
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
