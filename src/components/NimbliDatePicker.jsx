import { useMemo, useState } from 'react'
import { CalendarIcon, ChevronDown } from 'lucide-react'
import { nl } from 'date-fns/locale'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { formatDateNlShort, parseIsoDateLocal, toIsoDateLocal } from '@/lib/dateInput.js'
import { cn } from '@/lib/utils'

const CURRENT_YEAR = new Date().getFullYear()
const MIN_BIRTH_YEAR = CURRENT_YEAR - 25

export default function NimbliDatePicker({
  label,
  value = '',
  onChange,
  placeholder = 'dd/mm/jjjj',
  id,
  required = false,
  disabled = false,
  className,
}) {
  const [open, setOpen] = useState(false)
  const selected = useMemo(() => parseIsoDateLocal(value), [value])
  const display = selected ? formatDateNlShort(selected) : placeholder

  const defaultMonth = selected ?? new Date(CURRENT_YEAR - 8, 0, 1)

  function handleSelect(date) {
    onChange?.(toIsoDateLocal(date))
    if (date) setOpen(false)
  }

  return (
    <div className={cn('flex w-full flex-col gap-1.5 text-left', className)}>
      {label ? (
        <label htmlFor={id} className="text-sm font-semibold text-nimbli-ink">
          {label}
          {required ? '*' : ''}
        </label>
      ) : null}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            id={id}
            type="button"
            disabled={disabled}
            aria-label={label || 'Kies een datum'}
            aria-expanded={open}
            className={cn(
              'flex h-12 w-full cursor-pointer items-center justify-between gap-2 rounded-lg border border-[#7c7c7c] bg-white px-3 text-sm transition-colors duration-200',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-nimbli/40',
              'disabled:cursor-not-allowed disabled:opacity-50',
              selected ? 'text-nimbli-ink' : 'text-[#7c7c7c]'
            )}
          >
            <span className="flex min-w-0 items-center gap-2">
              <CalendarIcon className="size-4 shrink-0 text-nimbli" aria-hidden />
              <span className="truncate">{display}</span>
            </span>
            <ChevronDown
              className={cn('size-4 shrink-0 text-nimbli-muted transition-transform', open && 'rotate-180')}
              aria-hidden
            />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className={cn(
            'w-auto border-[#e1dbd3] p-0 shadow-[0_4px_16px_rgba(48,45,45,0.12)]',
            '[&_[data-selected-single=true]]:bg-nimbli [&_[data-selected-single=true]]:text-white',
            '[&_[data-range-start=true]]:bg-nimbli [&_[data-range-end=true]]:bg-nimbli'
          )}
        >
          <Calendar
            mode="single"
            locale={nl}
            captionLayout="dropdown"
            selected={selected}
            onSelect={handleSelect}
            defaultMonth={defaultMonth}
            fromYear={MIN_BIRTH_YEAR}
            toYear={CURRENT_YEAR}
            disabled={(date) => date > new Date()}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
