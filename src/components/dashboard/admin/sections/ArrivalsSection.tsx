import { ChevronDown, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import type { AdminInvitation } from "@/components/dashboard/types";
import { formatLocalDate } from "@/lib/date-time";

interface ArrivalsSectionProps {
	invitations: AdminInvitation[];
}

export function ArrivalsSection({ invitations }: ArrivalsSectionProps) {
	const [expandedArrivalDates, setExpandedArrivalDates] = useState<
		Record<string, boolean>
	>({});

	const arrivals = useMemo(() => {
		return invitations
			.filter((i) => i.arrivalDateTime)
			.slice()
			.sort((a, b) => {
				return (
					new Date(a.arrivalDateTime ?? "").getTime() -
					new Date(b.arrivalDateTime ?? "").getTime()
				);
			});
	}, [invitations]);

	const arrivalsByDate = useMemo(() => {
		const groups: Record<string, AdminInvitation[]> = {};
		for (const invitation of arrivals) {
			const dateKey = invitation.arrivalDateTime?.split("T")[0] ?? "unknown";
			if (!groups[dateKey]) {
				groups[dateKey] = [];
			}
			groups[dateKey].push(invitation);
		}
		return groups;
	}, [arrivals]);

	const sortedArrivalDates = useMemo(() => {
		return Object.keys(arrivalsByDate).sort();
	}, [arrivalsByDate]);

	const toggleArrivalDate = (date: string) => {
		setExpandedArrivalDates((previous) => ({
			...previous,
			[date]: !previous[date],
		}));
	};

	return (
		<div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
			<h3 className="text-xl font-bold text-foreground mb-4">
				Przyloty (data)
			</h3>
			{arrivals.length === 0 ? (
				<p className="text-muted-foreground">Brak danych o przylotach.</p>
			) : (
				<div className="space-y-3">
					{sortedArrivalDates.map((date) => {
						const isExpanded = expandedArrivalDates[date];
						const group = arrivalsByDate[date];
						const label =
							date === "unknown" ? "Nieznana data" : formatLocalDate(date);

						return (
							<div
								key={date}
								className="rounded-xl border border-gray-100 bg-white overflow-hidden"
							>
								<button
									type="button"
									onClick={() => toggleArrivalDate(date)}
									className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition text-left"
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
								</button>
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
