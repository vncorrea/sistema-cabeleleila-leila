import { useState, useEffect } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { Header } from '@/components/Header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar, ChevronRight, Clock } from 'lucide-react'
import { clientsApi, salonServicesApi, appointmentsApi, usersApi, getToken, getUser } from '@/lib/api'
import type { Client, SalonService } from '@/lib/api'
import { DateTimePicker } from '@/components/DateTimePicker'
import { PhoneInput } from '@/components/PhoneInput'
import { formatPhone } from '@/lib/phoneMask'
import { toast } from 'sonner'

export function BookAppointmentPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [services, setServices] = useState<SalonService[]>([])
  const [selectedClient, setSelectedClient] = useState('')
  const [selectedServices, setSelectedServices] = useState<number[]>([])
  const [dateTime, setDateTime] = useState('')
  const [notes, setNotes] = useState('')
  const [isNewClientOpen, setIsNewClientOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [existingClientId, setExistingClientId] = useState<number | null>(null)
  const [assignedUserId, setAssignedUserId] = useState<string>('')
  const [professionals, setProfessionals] = useState<{ id: number; name: string; email: string }[]>([])
  const [occupiedSlots, setOccupiedSlots] = useState<string[]>([])

  const location = useLocation()
  const [searchParams] = useSearchParams()
  const isLoggedIn = !!getToken()
  const user = getUser()
  const isReceptionist = user?.role === 'receptionist' || user?.role === 'admin'

  const emailFromContext = (location.state as { clientEmail?: string } | null)?.clientEmail ?? searchParams.get('email') ?? ''

  useEffect(() => {
    salonServicesApi.list().then((r) => setServices(r.data.data)).catch(() => toast.error('Erro ao carregar serviços.'))
    if (isLoggedIn) {
      clientsApi.list().then((r) => setClients(r.data.data)).catch(() => toast.error('Erro ao carregar clientes.'))
      if (isReceptionist) {
        usersApi.professionals().then((r) => setProfessionals(r.data.data)).catch(() => toast.error('Erro ao carregar cabelereiras.'))
      }
    }
  }, [isLoggedIn, isReceptionist])

  useEffect(() => {
    if (!isLoggedIn && emailFromContext.trim()) {
      clientsApi
        .lookup(emailFromContext.trim())
        .then(({ data }) => {
          setGuestName(data.data.name)
          setGuestEmail(data.data.email)
          setGuestPhone(data.data.phone ? formatPhone(data.data.phone.replace(/\D/g, '')) : '')
          setExistingClientId(data.data.id)
        })
        .catch(() => {})
    }
  }, [isLoggedIn, emailFromContext])

  const dateOnly = dateTime ? dateTime.slice(0, 10) : ''
  useEffect(() => {
    if (!isReceptionist || !assignedUserId || !dateOnly) {
      setOccupiedSlots([])
      return
    }
    appointmentsApi
      .getOccupiedSlots(dateOnly, Number(assignedUserId))
      .then(({ data }) => setOccupiedSlots(data.data.occupied_slots))
      .catch(() => setOccupiedSlots([]))
  }, [isReceptionist, assignedUserId, dateOnly])

  const toggleService = (id: number) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

  const getTotalDuration = () =>
    selectedServices.reduce((total, id) => {
      const s = services.find((x) => x.id === id)
      return total + (s?.duration_minutes ?? 0)
    }, 0)

  const getTotalPrice = () =>
    selectedServices.reduce((total, id) => {
      const s = services.find((x) => x.id === id)
      return total + Number(s?.price ?? 0)
    }, 0)

  const handleNewClient = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim() || !newEmail.trim()) {
      toast.error('Nome e e-mail são obrigatórios.')
      return
    }
    try {
      const { data } = await clientsApi.create({
        name: newName.trim(),
        email: newEmail.trim(),
        phone: newPhone.trim() || undefined,
      })
      setClients((prev) => [...prev, data.data])
      setSelectedClient(String(data.data.id))
      setNewName('')
      setNewEmail('')
      setNewPhone('')
      setIsNewClientOpen(false)
      toast.success('Cliente cadastrado.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao cadastrar.')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedServices.length === 0 || !dateTime) {
      toast.error('Preencha data/hora e pelo menos um serviço.')
      return
    }
    if (isLoggedIn) {
      if (!selectedClient) {
        toast.error('Selecione um cliente.')
        return
      }
    } else {
      if (!existingClientId && (!guestName.trim() || !guestEmail.trim())) {
        toast.error('Preencha nome e e-mail.')
        return
      }
    }
    setIsLoading(true)
    try {
    if (isLoggedIn) {
      await appointmentsApi.create({
        client_id: Number(selectedClient),
        starts_at: dateTime,
        salon_service_ids: selectedServices,
        notes: notes.trim() || undefined,
        assigned_user_id: assignedUserId ? Number(assignedUserId) : undefined,
      })
      } else {
        if (existingClientId) {
          await appointmentsApi.create({
            client_id: existingClientId,
            starts_at: dateTime,
            salon_service_ids: selectedServices,
            notes: notes.trim() || undefined,
          })
        } else {
          await appointmentsApi.create({
            client_name: guestName.trim(),
            client_email: guestEmail.trim(),
            client_phone: guestPhone.trim() || undefined,
            starts_at: dateTime,
            salon_service_ids: selectedServices,
            notes: notes.trim() || undefined,
          })
        }
      }
      toast.success('Agendamento realizado com sucesso.')
      setSelectedClient('')
      setSelectedServices([])
      setDateTime('')
      setNotes('')
      setAssignedUserId('')
      setExistingClientId(null)
      setGuestName('')
      setGuestEmail('')
      setGuestPhone('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao agendar.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto max-w-3xl px-6 py-12 lg:px-8">
        <div className="text-center mb-10">
          <h1 className="font-serif text-3xl font-bold text-foreground mb-2">
            Novo Agendamento
          </h1>
          <p className="text-muted-foreground">
            Preencha os dados abaixo para agendar seu horário
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="mb-6">
            <CardContent className="pt-6">
              {isLoggedIn ? (
                <>
                  <Collapsible open={isNewClientOpen} onOpenChange={setIsNewClientOpen}>
                    <CollapsibleTrigger asChild>
                      <Button variant="outline" className="w-full justify-between mb-6" type="button">
                        <span className="flex items-center gap-2">
                          <ChevronRight
                            className={`h-4 w-4 transition-transform ${isNewClientOpen ? 'rotate-90' : ''}`}
                          />
                          Cadastrar novo cliente
                        </span>
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-4 mb-6 p-4 bg-secondary/50 rounded-lg">
                      <FieldGroup>
                        <Field>
                          <FieldLabel htmlFor="newClientName">Nome completo</FieldLabel>
                          <Input
                            id="newClientName"
                            placeholder="Nome do cliente"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                          />
                        </Field>
                      </FieldGroup>
                      <FieldGroup>
                        <Field>
                          <FieldLabel htmlFor="newClientEmail">E-mail</FieldLabel>
                          <Input
                            id="newClientEmail"
                            type="email"
                            placeholder="email@exemplo.com"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                          />
                        </Field>
                      </FieldGroup>
                      <FieldGroup>
                        <Field>
                          <FieldLabel htmlFor="newClientPhone">Telefone</FieldLabel>
                          <PhoneInput
                            id="newClientPhone"
                            value={newPhone}
                            onChange={setNewPhone}
                            className="h-12"
                          />
                        </Field>
                      </FieldGroup>
                      <Button type="button" variant="secondary" className="w-full" onClick={handleNewClient}>
                        Salvar cliente
                      </Button>
                    </CollapsibleContent>
                  </Collapsible>

                  <FieldGroup>
                    <Field>
                      <FieldLabel>Cliente</FieldLabel>
                      <Select value={selectedClient || undefined} onValueChange={(v) => setSelectedClient(v ?? '')}>
                        <SelectTrigger size="lg" className="h-12 w-full">
                          {selectedClient ? (
                            <span className="truncate">
                              {(() => {
                                const c = clients.find((x) => String(x.id) === selectedClient)
                                return c ? `${c.name} – ${c.email}` : selectedClient
                              })()}
                            </span>
                          ) : (
                            <SelectValue placeholder="Selecione um cliente" />
                          )}
                        </SelectTrigger>
                        <SelectContent>
                          {clients.map((c) => (
                            <SelectItem key={c.id} value={String(c.id)}>
                              {c.name} – {c.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  </FieldGroup>

                  {isReceptionist && professionals.length > 0 && (
                    <FieldGroup>
                      <Field>
                        <FieldLabel>Cabelereira</FieldLabel>
                        <Select value={assignedUserId || undefined} onValueChange={(v) => setAssignedUserId(v ?? '')}>
                          <SelectTrigger size="lg" className="h-12 w-full">
                            {assignedUserId ? (
                              <span className="truncate">
                                {professionals.find((p) => String(p.id) === assignedUserId)?.name ?? assignedUserId}
                              </span>
                            ) : (
                              <SelectValue placeholder="Selecione a cabelereira" />
                            )}
                          </SelectTrigger>
                          <SelectContent>
                            {professionals.map((p) => (
                              <SelectItem key={p.id} value={String(p.id)}>
                                {p.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                    </FieldGroup>
                  )}
                </>
              ) : (
                <div className="space-y-4 mb-6 p-4 bg-secondary/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Agendando sem login? Preencha seus dados:</p>
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="guestName">Nome completo</FieldLabel>
                      <Input
                        id="guestName"
                        placeholder="Seu nome"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                      />
                    </Field>
                  </FieldGroup>
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="guestEmail">E-mail</FieldLabel>
                      <Input
                        id="guestEmail"
                        type="email"
                        placeholder="seu@email.com"
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                      />
                    </Field>
                  </FieldGroup>
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="guestPhone">Telefone (opcional)</FieldLabel>
                      <PhoneInput
                        id="guestPhone"
                        value={guestPhone}
                        onChange={setGuestPhone}
                        className="h-12"
                      />
                    </Field>
                  </FieldGroup>
                </div>
              )}

              <FieldGroup className="mt-6">
                <Field>
                  <FieldLabel>Data e hora</FieldLabel>
                  <DateTimePicker
                    value={dateTime}
                    onChange={setDateTime}
                    minDate={new Date()}
                    occupiedSlots={isReceptionist && assignedUserId && dateOnly ? occupiedSlots : undefined}
                  />
                </Field>
              </FieldGroup>

              <div className="mt-6">
                <FieldLabel className="mb-4 block">Serviços</FieldLabel>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {services.map((service) => (
                    <div
                      key={service.id}
                      className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                        selectedServices.includes(service.id)
                          ? 'border-foreground/30 bg-secondary'
                          : 'border-border hover:border-foreground/20'
                      }`}
                      onClick={() => toggleService(service.id)}
                    >
                      <Checkbox
                        checked={selectedServices.includes(service.id)}
                        onCheckedChange={() => toggleService(service.id)}
                      />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{service.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {service.duration_minutes} min - R$ {Number(service.price).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedServices.length > 0 && (
                <div className="mt-6 p-4 bg-secondary/50 rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Duração total: {getTotalDuration()} min</span>
                    </div>
                    <div className="font-semibold">Total: R$ {getTotalPrice().toFixed(2)}</div>
                  </div>
                </div>
              )}

              <FieldGroup className="mt-6">
                <Field>
                  <FieldLabel htmlFor="notes">Observações (opcional)</FieldLabel>
                  <Textarea
                    id="notes"
                    placeholder="Alguma observação especial..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>

          <Button
            type="submit"
            size="lg"
            className="w-full h-14 text-base"
            disabled={
                isLoading ||
                selectedServices.length === 0 ||
                !dateTime ||
                (isLoggedIn ? !selectedClient : !guestName.trim() || !guestEmail.trim())
              }
          >
            {isLoading ? (
              'Agendando...'
            ) : (
              <>
                <Calendar className="mr-2 h-5 w-5" />
                Agendar
              </>
            )}
          </Button>
        </form>
      </main>
    </div>
  )
}
