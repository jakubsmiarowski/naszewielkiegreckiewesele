import type { AdminInvitation } from "@/components/dashboard/types";
import { formatLocalDate } from "@/lib/date-time";
import { RELATION_OPTIONS } from "@/lib/greetings";
import { getInvitationAttendanceStats } from "../helpers";

interface InvitationsSectionProps {
	invitations: AdminInvitation[];
	onSeedInvitations: () => void;
	onRelationChange: (guestId: string, relation: string | undefined) => void;
	onCopyInvitationLink: (token: string) => void;
}

export function InvitationsSection({
	invitations,
	onSeedInvitations,
	onRelationChange,
	onCopyInvitationLink,
}: InvitationsSectionProps) {
	return (
		<>
			{invitations.length === 0 && (
				<div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
					<p className="text-muted-foreground">
						Brak zaproszeń w bazie. Możesz je teraz załadować z listy.
					</p>
					<button
						type="button"
						onClick={onSeedInvitations}
						className="mt-4 px-4 py-2 rounded-full bg-[var(--color-primary)] text-white font-semibold"
					>
						Załaduj zaproszenia
					</button>
				</div>
			)}
			<div className="rounded-2xl border border-border bg-white p-6 shadow-sm overflow-x-auto">
				<h3 className="text-xl font-bold text-foreground mb-4">Zaproszenia</h3>
				{invitations.length === 0 ? (
					<p className="text-sm text-muted-foreground">
						Brak zaproszeń do wyświetlenia.
					</p>
				) : (
					<table className="w-full text-sm">
						<thead>
							<tr className="text-left text-xs uppercase tracking-widest text-muted-foreground">
								<th className="py-2 pr-4">Goście</th>
								<th className="py-2 pr-4">Relacja</th>
								<th className="py-2 pr-4">PIN</th>
								<th className="py-2 pr-4">QR</th>
								<th className="py-2 pr-4">RSVP</th>
								<th className="py-2 pr-4">Transport</th>
								<th className="py-2 pr-4">Przylot</th>
								<th className="py-2 pr-4">Dzieci</th>
								<th className="py-2 pr-4">Nocleg</th>
								<th className="py-2 pr-4">+1</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-100">
							{invitations.map((invitation) => {
								const attendanceStats =
									getInvitationAttendanceStats(invitation);
								const attendanceSummary =
									attendanceStats.confirmed > 0
										? "yes"
										: attendanceStats.pending === 0 &&
												attendanceStats.declined > 0
											? "no"
											: undefined;

								return (
									<tr
										key={invitation._id}
										className="align-middle border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors"
									>
										<td className="py-4 pr-4">
											<div className="flex items-center gap-3">
												<div
													className={`w-2.5 h-2.5 rounded-full shrink-0 ${
														attendanceSummary === "yes"
															? "bg-green-500 shadow-[0_0_0_2px_rgba(34,197,94,0.2)]"
															: attendanceSummary === "no"
																? "bg-red-500 shadow-[0_0_0_2px_rgba(239,68,68,0.2)]"
																: "bg-gray-200"
													}`}
													title={
														attendanceSummary === "yes"
															? "Potwierdzone"
															: attendanceSummary === "no"
																? "Odmowa"
																: "Brak odpowiedzi"
													}
												/>
												<div>
													<div className="space-y-1">
														{invitation.guests.map((guest) => {
															return (
																<div
																	key={guest._id}
																	className="text-sm font-medium text-foreground flex items-center gap-2"
																>
																	<span>{guest.fullName}</span>
																</div>
															);
														})}
													</div>
												</div>
											</div>
										</td>
										<td className="py-4 pr-4">
											<div className="space-y-2">
												{invitation.guests.map((guest) => (
													<div key={guest._id}>
														<select
															value={guest.relation ?? ""}
															onChange={(event) =>
																onRelationChange(
																	guest._id,
																	event.target.value || undefined,
																)
															}
															className="text-xs rounded-md border border-gray-200 bg-white px-2 py-1.5 focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] outline-none transition-all w-32"
														>
															{RELATION_OPTIONS.map((option) => (
																<option key={option.value} value={option.value}>
																	{option.label}
																</option>
															))}
														</select>
													</div>
												))}
											</div>
										</td>
										<td className="py-4 pr-4">
											<code className="px-2 py-1 rounded bg-gray-100 text-xs font-mono text-gray-700 border border-gray-200">
												{invitation.shortCode}
											</code>
										</td>
										<td className="py-4 pr-4">
											<button
												type="button"
												onClick={() => onCopyInvitationLink(invitation.qrToken)}
												className="text-xs font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] hover:underline flex items-center gap-1"
											>
												<span className="i-lucide-link h-3 w-3" />
												Kopiuj link
											</button>
										</td>
										<td className="py-4 pr-4">
											<div className="flex flex-col gap-0.5">
												<span className="text-sm font-medium text-foreground">
													Tak: {attendanceStats.confirmed} / Nie:{" "}
													{attendanceStats.declined}
												</span>
												{attendanceStats.pending > 0 && (
													<span className="text-[10px] uppercase tracking-wider text-muted-foreground">
														Brak odpowiedzi: {attendanceStats.pending}
													</span>
												)}
												{invitation.answeredForAll === false && (
													<span className="text-[10px] uppercase tracking-wider text-amber-600 font-medium bg-amber-50 px-1.5 py-0.5 rounded self-start">
														Tylko: {invitation.answeredForName ?? "1 os."}
													</span>
												)}
											</div>
										</td>
										<td className="py-4 pr-4">
											<span className="text-sm text-foreground">
												{invitation.transport
													? invitation.transport === "bus"
														? "Bus"
														: "Własny"
													: "-"}
											</span>
										</td>
										<td className="py-4 pr-4 text-sm text-foreground whitespace-nowrap">
											{formatLocalDate(invitation.arrivalDateTime) || "-"}
										</td>
										<td className="py-4 pr-4 text-sm text-foreground">
											{formatChildrenSummary(
												invitation.childrenCount,
												invitation.childrenSleepOption,
											)}
										</td>
										<td className="py-4 pr-4 text-sm text-foreground">
											{formatAccommodationType(invitation.accommodationType)}
										</td>
										<td className="py-4 pr-4 text-sm text-foreground">
											<div className="flex flex-col">
												{invitation.plusOneAttendance && (
													<span
														className={
															invitation.plusOneAttendance === "yes"
																? "text-green-600"
																: "text-red-600"
														}
													>
														{invitation.plusOneAttendance === "yes"
															? "Tak"
															: "Nie"}
													</span>
												)}
												{invitation.plusOneName && (
													<span className="text-xs text-muted-foreground">
														{invitation.plusOneName}
													</span>
												)}
												{!invitation.plusOneAttendance && "-"}
											</div>
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				)}
			</div>
		</>
	);
}

function formatChildrenSummary(
	childrenCount: number | undefined,
	childrenSleepOption: "extraBed" | "crib" | undefined,
) {
	const normalizedChildrenCount =
		typeof childrenCount === "number" &&
		Number.isFinite(childrenCount) &&
		childrenCount > 0
			? Math.min(3, Math.trunc(childrenCount))
			: 0;
	if (normalizedChildrenCount < 1) return "-";
	const sleepLabel =
		childrenSleepOption === "extraBed"
			? "Dostawka"
			: childrenSleepOption === "crib"
				? "Łóżeczko"
				: "Brak";
	return `${normalizedChildrenCount} (${sleepLabel})`;
}

function formatAccommodationType(
	value: "hostProvided" | "selfArranged" | undefined,
) {
	if (value === "hostProvided") return "Od nas";
	if (value === "selfArranged") return "Własny zakres";
	return "-";
}
