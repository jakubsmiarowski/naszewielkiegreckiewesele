import { ChevronDown, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import type { AdminInvitation } from "@/components/dashboard/types";
import { Button } from "@/components/ui/button";
import { formatLocalDate } from "@/lib/date-time";

interface DeparturesSectionProps {
	invitations: AdminInvitation[];
}

export function DeparturesSection({ invitations }: DeparturesSectionProps) {
	const [expandedDepartureDates, setExpandedDepartureDates] = useState<
		Record<string, boolean>
	>({});

	const departures = useMemo(() => {
		return invitations
			.filter((i) => i.departureDateTime)
			.slice()
			.sort((a, b) => {
				return (
					new Date(a.departureDateTime ?? "").getTime() -
					new Date(b.departureDateTime ?? "").getTime()
				);
			});
	}, [invitations]);

	const departuresByDate = useMemo(() => {
		const groups: Record<string, AdminInvitation[]> = {};
		for (const invitation of departures) {
			const dateKey = invitation.departureDateTime?.split("T")[0] ?? "unknown";
			if (!groups[dateKey]) {
				groups[dateKey] = [];
			}
			groups[dateKey].push(invitation);
		}
		return groups;
	}, [departures]);

	const sortedDepartureDates = useMemo(() => {
		return Object.keys(departuresByDate).sort();
	}, [departuresByDate]);

	const toggleDepartureDate = (date: string) => {
		setExpandedDepartureDates((previous) => ({
			...previous,
			[date]: !previous[date],
		}));
	};

	return (
		<div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
			<h3 className="text-xl font-bold text-foreground mb-4">Wyloty (data)</h3>
			{departures.length === 0 ? (
				<p className="text-muted-foreground">Brak danych o wylotach.</p>
			) : (
				<div className="space-y-3">
					{sortedDepartureDates.map((date) => {
						const isExpanded = expandedDepartureDates[date];
						const group = departuresByDate[date];
						const label =
							date === "unknown" ? "Nieznana data" : formatLocalDate(date);

						return (
							<div
								key={date}
								className="rounded-xl border border-gray-100 bg-white overflow-hidden"
							>
								<Button
									variant="ghost"
									onClick={() => toggleDepartureDate(date)}
									className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition text-left h-auto rounded-none font-normal"
								>
									<span className="font-semibold text-foreground">{label}</span>
									<div className="flex items-center gap-2 text-muted-foreground">
										<span className="text-xs">{group.length}</span>
										{isExpanded ? (
											<ChevronDown className="h-4 w-4" />
										) : (
											<ChevronRight className="h-4 w-4" />
										)}
									</div>
								</Button>
								{isExpanded && (
									<div className="p-2 bg-white">
										{group.map((invitation) => (
											<div
												key={invitation._id}
												className="py-2 px-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 rounded-md transition-colors flex justify-between items-center"
											>
												<span className="text-sm font-medium text-foreground">
													{invitation.displayName}
												</span>
											</div>
										))}
									</div>
								)}
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}
