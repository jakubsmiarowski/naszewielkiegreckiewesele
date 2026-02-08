import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { planTimelineDays } from "@/data/plan-timeline";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const listVariants = {
	hidden: { opacity: 0 },
	show: {
		opacity: 1,
		transition: { staggerChildren: 0.08, delayChildren: 0.05 },
	},
};

const itemVariants = {
	hidden: { opacity: 0, y: 16 },
	show: { opacity: 1, y: 0 },
};

export function PlanTimeline() {
	const [activeDayId, setActiveDayId] = useState(planTimelineDays[0]?.id);
	const activeDay = useMemo(
		() => planTimelineDays.find((day) => day.id === activeDayId),
		[activeDayId],
	);

	if (!activeDay) {
		return null;
	}

	return (
		<div className="space-y-6">
			<div
				role="tablist"
				aria-label="Dni planu zabawy"
				className="flex flex-wrap gap-3"
			>
				{planTimelineDays.map((day) => {
					const isActive = day.id === activeDay.id;
					return (
						<Button
							key={day.id}
							type="button"
							role="tab"
							aria-selected={isActive}
							variant={isActive ? "default" : "outline"}
							className={cn(
								"rounded-full px-5 transition-transform hover:scale-105",
								!isActive &&
									"bg-background text-muted-foreground hover:text-primary hover:border-primary border-border",
							)}
							onClick={() => setActiveDayId(day.id)}
						>
							{day.label}
						</Button>
					);
				})}
			</div>

			<div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
				<p className="text-xs uppercase tracking-widest text-muted-foreground">
					Plan dnia
				</p>
				<h4 className="text-2xl font-bold text-foreground mt-2">
					{activeDay.label}
				</h4>
				{activeDay.subtitle && (
					<p className="text-muted-foreground mt-2">{activeDay.subtitle}</p>
				)}
			</div>

			<div className="relative">
				<div className="absolute left-1.5 top-0 h-full w-px bg-gradient-to-b from-primary/40 via-primary/20 to-transparent" />
				<AnimatePresence mode="wait">
					<motion.ul
						key={activeDay.id}
						variants={listVariants}
						initial="hidden"
						animate="show"
						exit="hidden"
						className="space-y-6"
					>
						{activeDay.events.map((event) => (
							<motion.li
								key={event.id}
								variants={itemVariants}
								className="relative pl-10"
							>
								<span className="absolute left-0 top-6 size-3 rounded-full bg-primary ring-4 ring-background" />
								<div className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
									<div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
										<span className="font-semibold text-foreground">
											{event.time}
										</span>
										{event.tag && (
											<span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
												{event.tag}
											</span>
										)}
										{event.location && (
											<span className="text-muted-foreground">
												• {event.location}
											</span>
										)}
									</div>
									<h5 className="text-lg font-bold text-foreground mt-2">
										{event.title}
									</h5>
									<p className="text-muted-foreground mt-2 leading-relaxed">
										{event.description}
									</p>
								</div>
							</motion.li>
						))}
					</motion.ul>
				</AnimatePresence>
			</div>
		</div>
	);
}
