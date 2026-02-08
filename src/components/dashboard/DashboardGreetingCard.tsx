import { motion } from "framer-motion";

export function DashboardGreetingCard({ greeting }: { greeting: string }) {
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
			<p className="text-muted-foreground mt-2">
				Jesteśmy niesamowicie szczęśliwi, że jesteś z nami w tej przygodzie.
			</p>
			<div className="mt-4 space-y-6">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="rounded-xl bg-[var(--color-background-light)] p-4">
						<p className="text-xs uppercase tracking-widest text-muted-foreground">
							Miejsce
						</p>
						<p className="font-semibold text-foreground mt-1">Kreta, Grecja</p>
					</div>
					<div className="rounded-xl bg-[var(--color-background-light)] p-4">
						<p className="text-xs uppercase tracking-widest text-muted-foreground">
							Ważne daty
						</p>
						<p className="font-semibold text-foreground mt-1">
							30.09 – 04.10.2026
						</p>
					</div>
				</div>
				<p className="text-muted-foreground">
					Jeśli potrzebujesz pomocy z podróżą lub noclegiem, daj nam znać w
					formularzu RSVP.
				</p>
			</div>
		</div>
	);
}
