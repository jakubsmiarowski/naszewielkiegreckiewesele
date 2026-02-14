import { motion } from "framer-motion";
import { useLocale } from "@/lib/locale";

export function DashboardGreetingCard({ greeting }: { greeting: string }) {
	const { locale } = useLocale();
	const copy =
		locale === "en"
			? {
					intro:
						"Welcome to our wedding page. Greece is waiting and we cannot wait to celebrate with you.",
					locationLabel: "Location",
					locationValue: "Crete, Greece",
					datesLabel: "Important dates",
					help: "If you need help with travel or accommodation, let us know in the RSVP form.",
				}
			: {
					intro:
						"Witaj na naszej stronie ślubnej! Grecja już czeka, a my nie możemy się doczekać.",
					locationLabel: "Miejsce",
					locationValue: "Kreta, Grecja",
					datesLabel: "Ważne daty",
					help: "Jeśli potrzebujesz pomocy z podróżą lub noclegiem, daj nam znać w formularzu RSVP.",
				};

	return (
		<div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
			<motion.h2
				key={greeting}
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
				className="text-3xl md:text-4xl font-black text-foreground"
			>
				{greeting}
			</motion.h2>
			<p className="text-muted-foreground mt-2">{copy.intro}</p>
			<div className="mt-4 space-y-6">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="rounded-xl bg-[var(--color-background-light)] p-4">
						<p className="text-xs uppercase tracking-widest text-muted-foreground">
							{copy.locationLabel}
						</p>
						<p className="font-semibold text-foreground mt-1">
							{copy.locationValue}
						</p>
					</div>
					<div className="rounded-xl bg-[var(--color-background-light)] p-4">
						<p className="text-xs uppercase tracking-widest text-muted-foreground">
							{copy.datesLabel}
						</p>
						<p className="font-semibold text-foreground mt-1">
							30.09 – 04.10.2026
						</p>
					</div>
				</div>
				<p className="text-muted-foreground">{copy.help}</p>
			</div>
		</div>
	);
}
