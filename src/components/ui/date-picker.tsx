import * as React from "react"
import { format } from "date-fns"
import { pl } from "date-fns/locale"
import { ChevronDownIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

type DatePickerProps = {
  value?: Date
  onChange: (date: Date | undefined) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  id?: string
}

function DatePicker({
  value,
  onChange,
  placeholder = "Wybierz datę",
  className,
  disabled,
  id,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          id={id}
          className={cn(
            "w-full justify-between text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          {value ? format(value, "PPP", { locale: pl }) : (
            <span>{placeholder}</span>
          )}
          <ChevronDownIcon className="ml-2 h-4 w-4 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto overflow-hidden p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          captionLayout="dropdown"
          defaultMonth={value}
          onSelect={(selected) => {
            onChange(selected)
            setOpen(false)
          }}
          initialFocus
          locale={pl}
        />
      </PopoverContent>
    </Popover>
  )
}

export { DatePicker }
