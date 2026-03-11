import type { ReactNode } from "react";
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
import { normalizeConvexErrorMessage } from "@/lib/convex-error";
import { cn } from "@/lib/utils";

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

function normalizeDisplayMessage(value?: string) {
	if (!value) return "Brak danych";
	return normalizeConvexErrorMessage(value) || value;
}

function normalizeDisplayRoute(value?: string) {
	const normalized = value?.trim();
	if (!normalized) return "Brak danych";
	return normalized;
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

function DetailItem({
	label,
	value,
	mono = false,
}: {
	label: string;
	value: string | number;
	mono?: boolean;
}) {
	return (
		<div className="rounded-xl border border-border/70 bg-white p-3">
			<dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
				{label}
			</dt>
			<dd
				className={cn(
					"mt-2 break-words text-sm text-foreground",
					mono && "font-mono text-xs leading-5",
				)}
			>
				{value}
			</dd>
		</div>
	);
}

function DetailBlock({
	title,
	children,
}: {
	title: string;
	children: ReactNode;
}) {
	return (
		<section className="space-y-2">
			<h5 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
				{title}
			</h5>
			<div className="overflow-hidden rounded-2xl border border-border/80 bg-white">
				{children}
			</div>
		</section>
	);
}

function JsonPanel({
	value,
	maxHeightClass,
}: {
	value?: string;
	maxHeightClass: string;
}) {
	return (
		<pre
			className={cn(
				"overflow-auto whitespace-pre-wrap break-words bg-white px-4 py-3 font-mono text-xs leading-5 text-foreground",
				maxHeightClass,
			)}
		>
			{formatJsonBlock(value)}
		</pre>
	);
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
	const selectedMessage = normalizeDisplayMessage(selectedError?.message);

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
				<div className="grid gap-2 text-sm font-medium text-foreground">
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
							<SelectItem value={ALL_FILTER_VALUE}>
								Wszystkie statusy
							</SelectItem>
							<SelectItem value="new">Nowe</SelectItem>
							<SelectItem value="investigating">W analizie</SelectItem>
							<SelectItem value="resolved">Zamknięte</SelectItem>
						</SelectContent>
					</Select>
				</div>

				<div className="grid gap-2 text-sm font-medium text-foreground">
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
				</div>

				<div className="grid gap-2 text-sm font-medium text-foreground">
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
				</div>
			</div>

			<div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
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
								const displayMessage = normalizeDisplayMessage(
									event.lastMessage,
								);

								return (
									<li key={event._id}>
										<Button
											type="button"
											variant="ghost"
											onClick={() => onSelectError(event._id)}
											className={cn(
												"h-auto w-full rounded-2xl border px-4 py-4 text-left",
												"flex flex-col items-start gap-3 transition-colors",
												isSelected
													? "border-(--color-primary) bg-white shadow-sm ring-1 ring-(--color-primary)/10"
													: "border-transparent bg-white/80 hover:border-border hover:bg-white",
											)}
										>
											<div className="flex w-full flex-wrap items-center justify-between gap-2">
												<div className="flex flex-wrap items-center gap-2">
													<Badge variant={getStatusVariant(event.status)}>
														{getStatusLabel(event.status)}
													</Badge>
													<span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
														{getKindLabel(event.kind)}
													</span>
												</div>
												<p className="text-xs text-muted-foreground">
													{formatDateTime(event.lastSeenAt)}
												</p>
											</div>

											<p className="w-full break-words text-sm font-semibold leading-6 text-foreground">
												{displayMessage}
											</p>

											<div className="grid w-full gap-2 text-xs text-muted-foreground sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
												<span className="break-words">
													{normalizeDisplayRoute(event.lastRoute)}
												</span>
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
							<div className="flex flex-wrap items-start justify-between gap-3">
								<div className="min-w-0 flex-1">
									<p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
										{getKindLabel(selectedError.kind)}
									</p>
									<h4 className="mt-1 break-words text-lg font-bold leading-8 text-foreground">
										{selectedMessage}
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

							<dl className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
								<DetailItem
									label="Fingerprint"
									value={selectedError.fingerprint}
									mono
								/>
								<DetailItem
									label="Trasa"
									value={normalizeDisplayRoute(selectedError.route)}
									mono
								/>
								<DetailItem
									label="Wystąpienia"
									value={selectedError.occurrenceCount}
								/>
								<DetailItem
									label="Pierwsze wystąpienie"
									value={formatDateTime(selectedError.firstSeenAt)}
								/>
								<DetailItem
									label="Ostatnie wystąpienie"
									value={formatDateTime(selectedError.lastSeenAt)}
								/>
								<DetailItem
									label="Release"
									value={selectedError.release ?? "Brak danych"}
								/>
								<DetailItem
									label="Invitation ID"
									value={selectedError.invitationId ?? "Brak danych"}
									mono
								/>
								<DetailItem
									label="User agent"
									value={selectedError.userAgent ?? "Brak danych"}
									mono
								/>
							</dl>

							<DetailBlock title="Device info">
								<JsonPanel
									value={selectedError.deviceInfo}
									maxHeightClass="max-h-56"
								/>
							</DetailBlock>

							<DetailBlock title="Context">
								<JsonPanel
									value={selectedError.contextJson}
									maxHeightClass="max-h-64"
								/>
							</DetailBlock>

							<DetailBlock title="Payload RSVP">
								<JsonPanel
									value={selectedError.payloadJson}
									maxHeightClass="max-h-72"
								/>
							</DetailBlock>

							<DetailBlock title="Stack trace">
								<pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words bg-white px-4 py-3 font-mono text-xs leading-5 text-foreground">
									{selectedError.stack ?? "Brak stack trace"}
								</pre>
							</DetailBlock>
						</div>
					)}
				</div>
			</div>
		</section>
	);
}
