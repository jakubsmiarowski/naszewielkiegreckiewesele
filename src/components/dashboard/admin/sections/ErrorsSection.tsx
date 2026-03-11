import type {
	AdminErrorEvent,
	AdminErrorEventDetail,
	ClientTelemetryKind,
	ErrorEventStatus,
} from "@/components/dashboard/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

const ALL_FILTER_VALUE = "__all__";

interface ErrorsSectionProps {
	errorEvents?: AdminErrorEvent[];
	selectedErrorId: string | null;
	selectedError?: AdminErrorEventDetail | null;
	newErrorCount: number;
	statusFilter: ErrorEventStatus | typeof ALL_FILTER_VALUE;
	kindFilter: ClientTelemetryKind | typeof ALL_FILTER_VALUE;
	routeFilter: string;
	availableRoutes: string[];
	statusMutationId: string | null;
	onStatusFilterChange: (
		value: ErrorEventStatus | typeof ALL_FILTER_VALUE,
	) => void;
	onKindFilterChange: (
		value: ClientTelemetryKind | typeof ALL_FILTER_VALUE,
	) => void;
	onRouteFilterChange: (value: string) => void;
	onSelectError: (errorId: string) => void;
	onSetErrorStatus: (status: ErrorEventStatus) => void;
}

function formatDateTime(value: number) {
	return new Date(value).toLocaleString("pl-PL");
}

function formatJsonBlock(value?: string) {
	if (!value) return "Brak danych";
	try {
		return JSON.stringify(JSON.parse(value), null, 2);
	} catch {
		return value;
	}
}

function getKindLabel(kind: ClientTelemetryKind) {
	switch (kind) {
		case "runtime_error":
			return "Crash JS";
		case "unhandled_rejection":
			return "Unhandled promise";
		case "rsvp_submit_error":
			return "Błąd RSVP";
	}
}

function getStatusLabel(status: ErrorEventStatus) {
	switch (status) {
		case "new":
			return "Nowy";
		case "investigating":
			return "W analizie";
		case "resolved":
			return "Zamknięty";
	}
}

function getStatusVariant(status: ErrorEventStatus) {
	switch (status) {
		case "new":
			return "destructive" as const;
		case "investigating":
			return "secondary" as const;
		case "resolved":
			return "outline" as const;
	}
}

export function ErrorsSection({
	errorEvents,
	selectedErrorId,
	selectedError,
	newErrorCount,
	statusFilter,
	kindFilter,
	routeFilter,
	availableRoutes,
	statusMutationId,
	onStatusFilterChange,
	onKindFilterChange,
	onRouteFilterChange,
	onSelectError,
	onSetErrorStatus,
}: ErrorsSectionProps) {
	return (
		<section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h3 className="text-xl font-bold text-foreground">Błędy aplikacji</h3>
					<p className="mt-1 text-sm text-muted-foreground">
						Crashe klienta, unhandled promise i problemy z zapisem RSVP.
					</p>
				</div>
				<Badge
					variant={newErrorCount > 0 ? "destructive" : "secondary"}
					className="font-semibold"
				>
					Nowe: {newErrorCount}
				</Badge>
			</div>

			<div className="mt-5 grid gap-3 md:grid-cols-3">
				<label className="grid gap-2 text-sm font-medium text-foreground">
					<span>Status</span>
					<Select
						value={statusFilter}
						onValueChange={(value) =>
							onStatusFilterChange(
								value as ErrorEventStatus | typeof ALL_FILTER_VALUE,
							)
						}
					>
						<SelectTrigger className="w-full rounded-xl bg-white">
							<SelectValue placeholder="Wszystkie statusy" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value={ALL_FILTER_VALUE}>Wszystkie statusy</SelectItem>
							<SelectItem value="new">Nowe</SelectItem>
							<SelectItem value="investigating">W analizie</SelectItem>
							<SelectItem value="resolved">Zamknięte</SelectItem>
						</SelectContent>
					</Select>
				</label>

				<label className="grid gap-2 text-sm font-medium text-foreground">
					<span>Typ błędu</span>
					<Select
						value={kindFilter}
						onValueChange={(value) =>
							onKindFilterChange(
								value as ClientTelemetryKind | typeof ALL_FILTER_VALUE,
							)
						}
					>
						<SelectTrigger className="w-full rounded-xl bg-white">
							<SelectValue placeholder="Wszystkie typy" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value={ALL_FILTER_VALUE}>Wszystkie typy</SelectItem>
							<SelectItem value="runtime_error">Crash JS</SelectItem>
							<SelectItem value="unhandled_rejection">
								Unhandled promise
							</SelectItem>
							<SelectItem value="rsvp_submit_error">Błąd RSVP</SelectItem>
						</SelectContent>
					</Select>
				</label>

				<label className="grid gap-2 text-sm font-medium text-foreground">
					<span>Trasa</span>
					<Select value={routeFilter} onValueChange={onRouteFilterChange}>
						<SelectTrigger className="w-full rounded-xl bg-white">
							<SelectValue placeholder="Wszystkie trasy" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value={ALL_FILTER_VALUE}>Wszystkie trasy</SelectItem>
							{availableRoutes.map((route) => (
								<SelectItem key={route} value={route}>
									{route}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</label>
			</div>

			<div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
				<div className="rounded-2xl border border-border bg-(--color-background-light) p-3">
					{!errorEvents ? (
						<p className="p-3 text-sm text-muted-foreground">
							Ładowanie błędów...
						</p>
					) : errorEvents.length === 0 ? (
						<p className="p-3 text-sm text-muted-foreground">
							Brak błędów pasujących do filtrów.
						</p>
					) : (
						<ul className="space-y-2">
							{errorEvents.map((event) => {
								const isSelected = selectedErrorId === event._id;

								return (
									<li key={event._id}>
										<Button
											type="button"
											variant="ghost"
											onClick={() => onSelectError(event._id)}
											className={`flex h-auto w-full flex-col items-start gap-2 rounded-xl border px-4 py-3 text-left ${
												isSelected
													? "border-(--color-primary) bg-white shadow-sm"
													: "border-transparent bg-white/80 hover:bg-white"
											}`}
										>
											<div className="flex w-full flex-wrap items-center justify-between gap-2">
												<Badge variant={getStatusVariant(event.status)}>
													{getStatusLabel(event.status)}
												</Badge>
												<p className="text-xs text-muted-foreground">
													{formatDateTime(event.lastSeenAt)}
												</p>
											</div>
											<p className="line-clamp-2 text-sm font-semibold text-foreground">
												{event.lastMessage}
											</p>
											<div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
												<span>{getKindLabel(event.kind)}</span>
												<span>•</span>
												<span>{event.lastRoute ?? "brak trasy"}</span>
												<span>•</span>
												<span>Wystąpień: {event.occurrenceCount}</span>
											</div>
										</Button>
									</li>
								);
							})}
						</ul>
					)}
				</div>

				<div className="rounded-2xl border border-border bg-(--color-background-light) p-4">
					{!selectedError ? (
						<p className="text-sm text-muted-foreground">
							Wybierz błąd z listy, aby zobaczyć szczegóły.
						</p>
					) : (
						<div className="space-y-5">
							<div className="flex flex-wrap items-center justify-between gap-3">
								<div>
									<p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
										{getKindLabel(selectedError.kind)}
									</p>
									<h4 className="mt-1 text-lg font-bold text-foreground">
										{selectedError.message}
									</h4>
								</div>
								<div className="flex flex-wrap gap-2">
									<Button
										type="button"
										size="sm"
										variant={
											selectedError.status === "new" ? "destructive" : "outline"
										}
										disabled={statusMutationId === selectedError._id}
										onClick={() => onSetErrorStatus("new")}
									>
										Nowy
									</Button>
									<Button
										type="button"
										size="sm"
										variant={
											selectedError.status === "investigating"
												? "secondary"
												: "outline"
										}
										disabled={statusMutationId === selectedError._id}
										onClick={() => onSetErrorStatus("investigating")}
									>
										W analizie
									</Button>
									<Button
										type="button"
										size="sm"
										variant={
											selectedError.status === "resolved"
												? "default"
												: "outline"
										}
										disabled={statusMutationId === selectedError._id}
										onClick={() => onSetErrorStatus("resolved")}
									>
										Zamknięty
									</Button>
								</div>
							</div>

							<dl className="grid gap-3 text-sm md:grid-cols-2">
								<div>
									<dt className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
										Fingerprint
									</dt>
									<dd className="mt-1 break-all font-mono text-xs text-foreground">
										{selectedError.fingerprint}
									</dd>
								</div>
								<div>
									<dt className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
										Trasa
									</dt>
									<dd className="mt-1 text-foreground">
										{selectedError.route ?? "Brak danych"}
									</dd>
								</div>
								<div>
									<dt className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
										Pierwsze wystąpienie
									</dt>
									<dd className="mt-1 text-foreground">
										{formatDateTime(selectedError.firstSeenAt)}
									</dd>
								</div>
								<div>
									<dt className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
										Ostatnie wystąpienie
									</dt>
									<dd className="mt-1 text-foreground">
										{formatDateTime(selectedError.lastSeenAt)}
									</dd>
								</div>
								<div>
									<dt className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
										Wystąpienia
									</dt>
									<dd className="mt-1 text-foreground">
										{selectedError.occurrenceCount}
									</dd>
								</div>
								<div>
									<dt className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
										Release
									</dt>
									<dd className="mt-1 text-foreground">
										{selectedError.release ?? "Brak danych"}
									</dd>
								</div>
								<div>
									<dt className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
										Invitation ID
									</dt>
									<dd className="mt-1 break-all text-foreground">
										{selectedError.invitationId ?? "Brak danych"}
									</dd>
								</div>
								<div>
									<dt className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
										User agent
									</dt>
									<dd className="mt-1 break-all text-foreground">
										{selectedError.userAgent ?? "Brak danych"}
									</dd>
								</div>
							</dl>

							<div className="space-y-3">
								<div>
									<p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
										Device info
									</p>
									<pre className="mt-1 overflow-x-auto rounded-xl bg-white p-3 text-xs text-foreground">
										{formatJsonBlock(selectedError.deviceInfo)}
									</pre>
								</div>
								<div>
									<p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
										Context
									</p>
									<pre className="mt-1 overflow-x-auto rounded-xl bg-white p-3 text-xs text-foreground">
										{formatJsonBlock(selectedError.contextJson)}
									</pre>
								</div>
								<div>
									<p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
										Payload RSVP
									</p>
									<pre className="mt-1 overflow-x-auto rounded-xl bg-white p-3 text-xs text-foreground">
										{formatJsonBlock(selectedError.payloadJson)}
									</pre>
								</div>
								<div>
									<p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
										Stack trace
									</p>
									<pre className="mt-1 overflow-x-auto rounded-xl bg-white p-3 text-xs text-foreground">
										{selectedError.stack ?? "Brak stack trace"}
									</pre>
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
		</section>
	);
}
