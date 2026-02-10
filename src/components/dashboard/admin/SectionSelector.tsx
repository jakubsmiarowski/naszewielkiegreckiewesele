import { ChevronsUpDown } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import type { AdminSectionId, AdminSectionMeta } from "./types";

interface SectionSelectorProps {
	sections: AdminSectionMeta[];
	activeSection: AdminSectionId;
	onSelect: (sectionId: AdminSectionId) => void;
}

export function SectionSelector({
	sections,
	activeSection,
	onSelect,
}: SectionSelectorProps) {
	const [isOpen, setIsOpen] = useState(false);
	const activeSectionMeta = sections.find(
		(section) => section.id === activeSection,
	);

	return (
		<div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div>
					<p className="text-xs uppercase tracking-widest text-muted-foreground">
						Nawigacja sekcji
					</p>
					<h3 className="mt-1 text-xl font-bold text-foreground">
						{activeSectionMeta?.title}
					</h3>
					<p className="mt-1 text-sm text-muted-foreground">
						{activeSectionMeta?.description}
					</p>
				</div>
				<Popover open={isOpen} onOpenChange={setIsOpen}>
					<PopoverTrigger asChild>
						<Button variant="outline" className="min-w-56 justify-between">
							Wybierz sekcję
							<ChevronsUpDown className="h-4 w-4 opacity-60" />
						</Button>
					</PopoverTrigger>
					<PopoverContent align="end" className="w-96 p-2">
						<div className="space-y-1">
							{sections.map((section) => {
								const isActive = section.id === activeSection;
								return (
									<button
										key={section.id}
										type="button"
										onClick={() => {
											onSelect(section.id);
											setIsOpen(false);
										}}
										className={`flex w-full items-start justify-between gap-3 rounded-lg px-3 py-2 text-left transition ${
											isActive
												? "bg-[var(--color-primary)]/10"
												: "hover:bg-muted/70"
										}`}
									>
										<div>
											<p className="text-sm font-semibold text-foreground">
												{section.title}
											</p>
											<p className="text-xs text-muted-foreground">
												{section.description}
											</p>
										</div>
										{typeof section.pendingCount === "number" &&
											section.pendingCount > 0 && (
												<Badge
													variant="destructive"
													className="mt-0.5 min-w-6 justify-center px-1.5"
												>
													{section.pendingCount}
												</Badge>
											)}
									</button>
								);
							})}
						</div>
					</PopoverContent>
				</Popover>
			</div>
		</div>
	);
}
