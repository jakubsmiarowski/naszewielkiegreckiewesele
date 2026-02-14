import { Check, ChevronsUpDown } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const filters = ["RSVP", "Plan zabawy", "Logistyka", "Atrakcje", "Q&A"];

// RSVP
// Formularz do potwierdzenia obecności z shared
// dwa mode - create / update
// Lista gości

// Plan zabawy
// Kazdy dzien szczegolowo rozpisany

// Logistyce
// hotel lefka ori lub wokol w zaleznosci od przybycia
// transport z lotniska do hotelu -> samemu autem 1:30h lub busem z 2 link w zaleznosci od liczby ppl
// transport z hotelu na lotnisko -> samemu autem 1:30h lub busem z 2 link w zaleznosci od liczby ppl link autobusy

// Atrakcje
// Lista atrakcji na Krecie
// Linki do atrakcji

// Q&A
// Lista pytań i odpowiedzi
// co zabrac ze soba? lista rzeczy do zabrania wazny dowod japonki wygodne buty okulary kostium kapielowy
// czy brac cash?
// dzieci
// dress code
//
// Formularz do zadawania pytań

export function FilterBar({
	filtersOverride,
	activeFilter,
	onSelect,
	badges,
	showCarpoolTab,
	labelsById,
}: {
	filtersOverride?: string[];
	activeFilter?: string;
	onSelect?: (value: string) => void;
	badges?: Partial<Record<string, number>>;
	showCarpoolTab?: boolean;
	labelsById?: Partial<Record<string, string>>;
}) {
	const items = (filtersOverride ?? filters).filter(
		(item) => item !== "Car Pool" || showCarpoolTab,
	);
	const [open, setOpen] = useState(false);
	const labelForItem = (item: string) => labelsById?.[item] ?? item;

	const activeItem = items.find((item) => item === activeFilter) || items[0];

	return (
		<>
			{/* Mobile View - Popover */}
			<div className="md:hidden w-full">
				<Popover open={open} onOpenChange={setOpen}>
					<PopoverTrigger asChild>
						<Button
							variant="outline"
							role="combobox"
							aria-expanded={open}
							className="w-full justify-between bg-background border-border text-foreground hover:bg-muted/50"
						>
							<div className="flex items-center gap-2">
								<span>{labelForItem(activeItem)}</span>
								{(badges?.[activeItem] ?? 0) > 0 && (
									<Badge
										variant="destructive"
										className="min-w-5 justify-center px-1.5 py-0"
									>
										{badges?.[activeItem]}
									</Badge>
								)}
							</div>
							<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
						</Button>
					</PopoverTrigger>
					<PopoverContent
						className="w-[--radix-popover-trigger-width] p-0"
						align="start"
					>
						<div className="flex flex-col">
							{items.map((filter) => (
								<Button
									key={filter}
									variant="ghost"
									className={cn(
										"justify-start font-normal rounded-none first:rounded-t-md last:rounded-b-md h-auto py-3 px-4",
										filter === activeFilter && "bg-muted font-medium",
									)}
									onClick={() => {
										onSelect?.(filter);
										setOpen(false);
									}}
								>
									<div className="mr-2 w-4">
										<Check
											className={cn(
												"h-4 w-4",
												filter === activeFilter ? "opacity-100" : "opacity-0",
											)}
										/>
									</div>
									<span>{labelForItem(filter)}</span>
									{(badges?.[filter] ?? 0) > 0 && (
										<Badge
											variant="destructive"
											className="ml-auto min-w-5 justify-center px-1.5 py-0"
										>
											{badges?.[filter]}
										</Badge>
									)}
								</Button>
							))}
						</div>
					</PopoverContent>
				</Popover>
			</div>

			{/* Desktop View - Tabs */}
			<div className="hidden md:flex flex-wrap gap-3">
				{items.map((filter, index) => {
					const isActive = activeFilter ? filter === activeFilter : index === 0;

					return (
						<Button
							key={filter}
							variant={isActive ? "default" : "outline"}
							className={cn(
								"rounded-full px-5 transition-transform hover:scale-105",
								!isActive &&
									"bg-background text-muted-foreground hover:text-primary hover:border-primary border-border",
							)}
							onClick={() => onSelect?.(filter)}
						>
							<span>{labelForItem(filter)}</span>
							{(badges?.[filter] ?? 0) > 0 && (
								<Badge
									variant={isActive ? "secondary" : "destructive"}
									className="min-w-5 justify-center px-1.5 py-0"
								>
									{badges?.[filter]}
								</Badge>
							)}
						</Button>
					);
				})}
			</div>
		</>
	);
}
