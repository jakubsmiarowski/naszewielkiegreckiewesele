import type { CarpoolMediationAlert } from "@/components/dashboard/types";
import { Badge } from "@/components/ui/badge";
import { formatRoute } from "../helpers";

interface CarpoolAlertsSectionProps {
	mediationAlerts?: CarpoolMediationAlert[];
	pendingCarpoolCount: number;
	onResolveMediation: (requestId: string) => void;
}

export function CarpoolAlertsSection({
	mediationAlerts,
	pendingCarpoolCount,
	onResolveMediation,
}: CarpoolAlertsSectionProps) {
	return (
		<div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
			<div className="mb-4 flex flex-wrap items-center justify-between gap-2">
				<h3 className="text-xl font-bold text-foreground">Alerty Car Pool</h3>
				{pendingCarpoolCount > 0 && (
					<Badge variant="destructive">{pendingCarpoolCount}</Badge>
				)}
			</div>
			{!mediationAlerts ? (
				<p className="text-muted-foreground">Ładowanie alertów...</p>
			) : mediationAlerts.length === 0 ? (
				<p className="text-muted-foreground">
					Brak aktywnych próśb o pośrednictwo.
				</p>
			) : (
				<ul className="space-y-3">
					{mediationAlerts.map((alert) => (
						<li
							key={alert.requestId}
							className="rounded-xl bg-[var(--color-background-light)] p-4"
						>
							<p className="font-semibold text-foreground">
								{alert.passengerDisplayName} potrzebuje połączenia z{" "}
								{alert.driverDisplayName}
							</p>
							<p className="text-sm text-muted-foreground mt-1">
								Trasa: {formatRoute(alert.pickupPoint, alert.dropoffPoint)}
							</p>
							<p className="text-sm text-muted-foreground">
								Miejsca: {alert.seatsRequested}
							</p>
							<button
								type="button"
								onClick={() => onResolveMediation(alert.requestId)}
								className="mt-3 px-4 py-2 rounded-full text-sm font-semibold border border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition"
							>
								Oznacz jako połączone
							</button>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
