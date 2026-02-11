import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AdminUserRecord } from "../types";

interface AdminsSectionProps {
	newAdminEmail: string;
	newAdminEmailId: string;
	adminMutationEmail: string | null;
	adminUsers?: AdminUserRecord[];
	onNewAdminEmailChange: (value: string) => void;
	onAddAdmin: () => void;
	onSetAdminStatus: (email: string, nextIsActive: boolean) => void;
}

export function AdminsSection({
	newAdminEmail,
	newAdminEmailId,
	adminMutationEmail,
	adminUsers,
	onNewAdminEmailChange,
	onAddAdmin,
	onSetAdminStatus,
}: AdminsSectionProps) {
	return (
		<div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
			<h3 className="text-xl font-bold text-foreground mb-4">
				Administratorzy
			</h3>
			<div className="flex flex-col gap-3 md:flex-row md:items-end">
				<div className="flex-1">
					<label
						htmlFor={newAdminEmailId}
						className="mb-2 block text-sm font-medium text-foreground"
					>
						Dodaj nowy e-mail admina
					</label>
					<Input
						id={newAdminEmailId}
						type="email"
						value={newAdminEmail}
						onChange={(event) => onNewAdminEmailChange(event.target.value)}
						placeholder="nowy-admin@domena.pl"
					/>
				</div>
				<Button
					type="button"
					onClick={onAddAdmin}
					disabled={
						Boolean(adminMutationEmail) || newAdminEmail.trim().length < 5
					}
					className="h-9 rounded-full bg-[var(--color-primary)] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70 hover:bg-[var(--color-primary)]/90"
				>
					Dodaj admina
				</Button>
			</div>

			<div className="mt-5 space-y-2">
				{!adminUsers ? (
					<p className="text-sm text-muted-foreground">Ładowanie listy...</p>
				) : adminUsers.length === 0 ? (
					<p className="text-sm text-muted-foreground">
						Brak administratorów w bazie.
					</p>
				) : (
					adminUsers.map((admin) => (
						<div
							key={admin._id}
							className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-100 bg-[var(--color-background-light)] p-3"
						>
							<div>
								<p className="font-medium text-foreground">{admin.email}</p>
								<p className="text-xs text-muted-foreground">
									Status: {admin.isActive ? "aktywny" : "nieaktywny"}
								</p>
							</div>
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => onSetAdminStatus(admin.email, !admin.isActive)}
								disabled={adminMutationEmail === admin.email}
								className={`rounded-full px-3 py-1.5 text-xs font-semibold transition h-auto ${
									admin.isActive
										? "border border-red-300 text-red-700 hover:bg-red-50 hover:text-red-800"
										: "border border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
								} disabled:cursor-not-allowed disabled:opacity-70`}
							>
								{adminMutationEmail === admin.email
									? "Zapisywanie..."
									: admin.isActive
										? "Dezaktywuj"
										: "Przywróć"}
							</Button>
						</div>
					))
				)}
			</div>
		</div>
	);
}
