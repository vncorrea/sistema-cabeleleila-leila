import { Input } from '@/components/ui/input'
import { formatPhone } from '@/lib/phoneMask'
import type { ComponentProps } from 'react'

type PhoneInputProps = Omit<ComponentProps<typeof Input>, 'value' | 'onChange' | 'type'> & {
  value: string
  onChange: (value: string) => void
}

export function PhoneInput({ value, onChange, ...props }: PhoneInputProps) {
  const displayValue = value ? formatPhone(value.replace(/\D/g, '')) : value

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 11)
    onChange(formatPhone(digits))
  }

  return (
    <Input
      type="tel"
      inputMode="numeric"
      autoComplete="tel"
      placeholder="(00) 00000-0000"
      value={displayValue}
      onChange={handleChange}
      {...props}
    />
  )
}
