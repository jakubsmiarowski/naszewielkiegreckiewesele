import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { buildLocalDateTime, parseLocalDateTime } from "@/lib/date-time";

interface DeadlinesSectionProps {
	deadline: string;
	graceDeadline: string;
	carpoolDeadline: string;
	onDeadlineChange: (value: string) => void;
	onGraceDeadlineChange: (value: string) => void;
	onCarpoolDeadlineChange: (value: string) => void;
	onSave: () => void;
}

export function DeadlinesSection({
	deadline,
	graceDeadline,
	carpoolDeadline,
	onDeadlineChange,
	onGraceDeadlineChange,
	onCarpoolDeadlineChange,
	onSave,
}: DeadlinesSectionProps) {
	return (
		<div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
			<h3 className="text-xl font-bold text-foreground mb-4">Terminy RSVP</h3>
			<div className="flex flex-col gap-4">
				<DateTimeField
					label="Deadline"
					value={deadline}
					onChange={onDeadlineChange}
				/>
				<DateTimeField
					label="Grace"
					value={graceDeadline}
					onChange={onGraceDeadlineChange}
				/>
				<DateTimeField
					label="Car Pool"
					value={carpoolDeadline}
					onChange={onCarpoolDeadlineChange}
				/>
			</div>
			<Button
				type="button"
				onClick={onSave}
				className="mt-4 px-4 py-2 rounded-full bg-[var(--color-primary)] text-white font-semibold hover:bg-[var(--color-primary)]/90 h-auto"
			>
				Zapisz terminy
			</Button>
		</div>
	);
}

function DateTimeField({
	label,
	value,
	onChange,
}: {
	label: string;
	value: string;
	onChange: (value: string) => void;
}) {
	const initialParsed = parseLocalDateTime(value);
	const [selectedDate, setSelectedDate] = useState<Date | undefined>(
		initialParsed.date,
	);
	const [selectedTime, setSelectedTime] = useState<string>(initialParsed.time);
	const lastValueRef = useRef(value);

	useEffect(() => {
		if (value !== lastValueRef.current) {
			lastValueRef.current = value;
			const parsed = parseLocalDateTime(value);
			setSelectedDate(parsed.date);
			setSelectedTime(parsed.time);
		}
	}, [value]);

	useEffect(() => {
		const nextValue = buildLocalDateTime(selectedDate, selectedTime);
		if (nextValue && nextValue !== value) {
			lastValueRef.current = nextValue;
			onChange(nextValue);
		}
	}, [onChange, selectedDate, selectedTime, value]);

	return (
		<div>
			<p className="text-xs uppercase tracking-widest text-muted-foreground">
				{label}
			</p>
			<div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
				<DatePicker
					value={selectedDate}
					onChange={setSelectedDate}
					placeholder="Wybierz datę"
					className="h-10 w-full rounded-xl border-gray-200 bg-gray-50 px-4"
				/>
				<Input
					type="time"
					value={selectedTime}
					onChange={(event) => setSelectedTime(event.target.value)}
					step={60}
					className="h-10 w-full rounded-xl border-gray-200 bg-gray-50 px-4"
				/>
			</div>
		</div>
	);
}
