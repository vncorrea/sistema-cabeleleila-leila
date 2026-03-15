import { useState, useEffect } from 'react'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/style.css'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar as CalendarIcon, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const TIME_SLOTS = (() => {
  const slots: string[] = []
  for (let h = 8; h <= 20; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`, `${String(h).padStart(2, '0')}:30`)
  }
  return slots
})()

type DateTimePickerProps = {
  value: string
  onChange: (isoLocal: string) => void
  minDate?: Date
  className?: string
  /** When set, only these time slots are shown as available (trava de agendamento). */
  occupiedSlots?: string[]
}

export function DateTimePicker({ value, onChange, minDate, className, occupiedSlots }: DateTimePickerProps) {
  const [showCalendar, setShowCalendar] = useState(false)
  const selectedDate = value ? new Date(value) : null
  const timePart = value && value.length >= 16 ? value.slice(11, 16) : '09:00'
  const dateOnly = value ? value.slice(0, 10) : null

  const availableSlots =
    occupiedSlots && occupiedSlots.length > 0
      ? TIME_SLOTS.filter((t) => !occupiedSlots.includes(t))
      : TIME_SLOTS

  const today = new Date()
  const disabledBefore = minDate ?? new Date(today.getFullYear(), today.getMonth(), today.getDate())

  const handleSelectDay = (day: Date | undefined) => {
    if (!day) return
    const dateStr = format(day, 'yyyy-MM-dd')
    onChange(`${dateStr}T${timePart}`)
    setShowCalendar(false)
  }

  const handleSelectTime = (time: string | null) => {
    if (!time) return
    const d = dateOnly ?? format(disabledBefore, 'yyyy-MM-dd')
    onChange(`${d}T${time}`)
  }

  const handleOpenCalendar = () => {
    if (!dateOnly) {
      const d = format(disabledBefore, 'yyyy-MM-dd')
      onChange(`${d}T${timePart}`)
    }
    setShowCalendar((v) => !v)
  }

  useEffect(() => {
    if (availableSlots.length > 0 && !availableSlots.includes(timePart)) {
      const d = dateOnly ?? format(disabledBefore, 'yyyy-MM-dd')
      onChange(`${d}T${availableSlots[0]}`)
    }
  }, [availableSlots.join(','), timePart, dateOnly])

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <label className="text-sm font-medium text-foreground mb-1.5 block">Data</label>
          <Button
            type="button"
            variant="outline"
            className="w-full justify-start gap-2 h-12 text-left font-normal"
            onClick={handleOpenCalendar}
          >
            <CalendarIcon className="h-4 w-4" />
            {dateOnly
              ? format(new Date(dateOnly + 'T12:00:00'), "EEEE, d 'de' MMMM", { locale: ptBR })
              : 'Selecione a data'}
          </Button>
        </div>
        <div className="flex-1">
          <label className="text-sm font-medium text-foreground mb-1.5 block">Horário</label>
          <Select value={timePart} onValueChange={handleSelectTime}>
            <SelectTrigger size="lg" className="h-12 w-full">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {availableSlots.length === 0 ? (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  Nenhum horário disponível nesta data.
                </div>
              ) : (
                availableSlots.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      {showCalendar && (
        <Card className="border-primary/20">
          <CardContent className="p-4">
            <DayPicker
              mode="single"
              selected={selectedDate ?? undefined}
              onSelect={handleSelectDay}
              disabled={{ before: disabledBefore }}
              locale={ptBR}
              className={cn(
                'rdp rosa [&_.rdp-day_button]:rounded-md [&_.rdp-day_button:hover]:bg-primary/15',
                '[&_.rdp-selected]:bg-primary [&_.rdp-selected]:text-primary-foreground',
                '[&_.rdp-today]:font-semibold [&_.rdp-today]:text-primary'
              )}
            />
          </CardContent>
        </Card>
      )}

      {dateOnly && timePart && (
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <Clock className="h-4 w-4" />
          {format(new Date(dateOnly + 'T12:00:00'), "EEEE, d 'de' MMMM", { locale: ptBR })} às {timePart}
        </p>
      )}
    </div>
  )
}
