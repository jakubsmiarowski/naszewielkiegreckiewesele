import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { ChevronDownIcon } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type DatePickerProps = {
	value?: Date;
	onChange: (date: Date | undefined) => void;
	placeholder?: string;
	className?: string;
	disabled?: boolean;
	id?: string;
	withTime?: boolean;
	timeValue?: string;
	onTimeChange?: (value: string) => void;
	timeStep?: number;
};

function DatePicker({
	value,
	onChange,
	placeholder = "Wybierz datę",
	className,
	disabled,
	id,
	withTime = false,
	timeValue = "",
	onTimeChange,
	timeStep = 60,
}: DatePickerProps) {
	const [open, setOpen] = React.useState(false);
	const timeInputId = id ? `${id}-time` : undefined;
	const buttonLabel = value
		? withTime && timeValue
			? `${format(value, "PPP", { locale: pl })} ${timeValue}`
			: format(value, "PPP", { locale: pl })
		: placeholder;

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
						className,
					)}
				>
					<span className="truncate">{buttonLabel}</span>
					<ChevronDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-60" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-auto overflow-hidden p-0" align="start">
				<Calendar
					mode="single"
					selected={value}
					captionLayout="dropdown"
					defaultMonth={value}
					onSelect={(selected) => {
						onChange(selected);
						if (!withTime) {
							setOpen(false);
						}
					}}
					initialFocus
					locale={pl}
				/>
				{withTime && (
					<div className="border-t border-border p-3">
						<label
							htmlFor={timeInputId}
							className="mb-1.5 block text-xs uppercase tracking-wide text-muted-foreground"
						>
							Godzina
						</label>
						<Input
							id={timeInputId}
							type="time"
							value={timeValue}
							onChange={(event) => onTimeChange?.(event.target.value)}
							step={timeStep}
							className="h-10 w-full"
							disabled={disabled}
						/>
					</div>
				)}
			</PopoverContent>
		</Popover>
	);
}

export { DatePicker };
