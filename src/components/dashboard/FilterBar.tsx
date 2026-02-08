import { Button } from "@/components/ui/button";
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
}: {
	filtersOverride?: string[];
	activeFilter?: string;
	onSelect?: (value: string) => void;
}) {
	const items = filtersOverride ?? filters;

	return (
		<div className="flex flex-wrap gap-3 pb-2 border-b border-border">
			{items.map((filter, index) => {
				const isActive = activeFilter
					? filter === activeFilter
					: index === 0;
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
					{filter}
				</Button>
				);
			})}
		</div>
	);
}
