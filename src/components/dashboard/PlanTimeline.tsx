import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronsUpDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { AttractionAnchorId } from "@/components/dashboard/types";
import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { getPlanTimelineDays } from "@/data/plan-timeline";
import { useLocale } from "@/lib/locale";
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

export function PlanTimeline({
	onOpenAttraction,
}: {
	onOpenAttraction?: (anchorId: AttractionAnchorId) => void;
}) {
	const { locale } = useLocale();
	const planTimelineDays = useMemo(() => getPlanTimelineDays(locale), [locale]);
	const [activeDayId, setActiveDayId] = useState(planTimelineDays[0]?.id);
	const [open, setOpen] = useState(false);

	useEffect(() => {
		if (planTimelineDays.some((day) => day.id === activeDayId)) {
			return;
		}
		setActiveDayId(planTimelineDays[0]?.id);
	}, [activeDayId, planTimelineDays]);

	const activeDay = useMemo(
		() => planTimelineDays.find((day) => day.id === activeDayId),
		[activeDayId, planTimelineDays],
	);

	if (!activeDay) {
		return null;
	}

	return (
		<div className="space-y-6">
			{/* Mobile View - Popover */}
			<div className="md:hidden w-full pb-4 border-b border-border">
				<Popover open={open} onOpenChange={setOpen}>
					<PopoverTrigger asChild>
						<Button
							variant="outline"
							role="combobox"
							aria-expanded={open}
							className="w-full justify-between bg-background border-border text-foreground hover:bg-muted/50"
						>
							{activeDay.label}
							<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
						</Button>
					</PopoverTrigger>
					<PopoverContent
						className="w-[--radix-popover-trigger-width] p-0"
						align="start"
					>
						<div className="flex flex-col">
							{planTimelineDays.map((day) => (
								<Button
									key={day.id}
									variant="ghost"
									className={cn(
										"justify-start font-normal rounded-none first:rounded-t-md last:rounded-b-md h-auto py-3 px-4",
										day.id === activeDayId && "bg-muted font-medium",
									)}
									onClick={() => {
										setActiveDayId(day.id);
										setOpen(false);
									}}
								>
									<Check
										className={cn(
											"mr-2 h-4 w-4",
											day.id === activeDayId ? "opacity-100" : "opacity-0",
										)}
									/>
									{day.label}
								</Button>
							))}
						</div>
					</PopoverContent>
				</Popover>
			</div>

			{/* Desktop View - Tabs */}
			<div
				role="tablist"
				aria-label={locale === "en" ? "Schedule days" : "Dni planu zabawy"}
				className="hidden md:flex flex-wrap gap-3"
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
					{locale === "en" ? "Day plan" : "Plan dnia"}
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
									{event.attractionAnchorId && onOpenAttraction && (
										<Button
											type="button"
											variant="link"
											className="mt-2 h-auto p-0 text-primary"
											onClick={() => {
												if (event.attractionAnchorId) {
													onOpenAttraction(event.attractionAnchorId);
												}
											}}
										>
											{event.attractionCtaLabel ??
												(locale === "en"
													? "View related attraction"
													: "Zobacz powiązaną atrakcję")}
										</Button>
									)}
								</div>
							</motion.li>
						))}
					</motion.ul>
				</AnimatePresence>
			</div>
		</div>
	);
}
