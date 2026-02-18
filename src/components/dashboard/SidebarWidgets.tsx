import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Clock3, Heart, type LucideIcon, Mail, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from "@/components/ui/carousel";
import { Input } from "@/components/ui/input";
import { getGreekPhraseCards } from "@/data/plan-timeline";
import { isDemoMode } from "@/lib/app-mode";
import { type AppLocale, useLocale } from "@/lib/locale";
import { WEDDING_EVENT } from "@/lib/wedding-event";

export function SearchWidget() {
	return (
		<div className="bg-background p-6 rounded-2xl shadow-sm border border-border">
			<h4 className="text-lg font-bold text-foreground mb-4">Szukaj</h4>
			<div className="relative">
				<Input
					className="w-full pl-10 pr-4 bg-muted border-none text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
					placeholder="Wpisz frazę..."
					type="text"
				/>
				<Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-5" />
			</div>
		</div>
	);
}

function useCountdown(targetDate: Date | null) {
	const [timeLeft, setTimeLeft] = useState(() => {
		if (!targetDate) return { days: 0, hours: 0, minutes: 0 };
		const diff = Math.max(targetDate.getTime() - Date.now(), 0);
		const days = Math.floor(diff / (1000 * 60 * 60 * 24));
		const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
		const minutes = Math.floor((diff / (1000 * 60)) % 60);
		return { days, hours, minutes };
	});

	useEffect(() => {
		if (!targetDate) return;
		const interval = setInterval(() => {
			const diff = Math.max(targetDate.getTime() - Date.now(), 0);
			const days = Math.floor(diff / (1000 * 60 * 60 * 24));
			const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
			const minutes = Math.floor((diff / (1000 * 60)) % 60);
			setTimeLeft({ days, hours, minutes });
		}, 60000);
		return () => clearInterval(interval);
	}, [targetDate]);

	return timeLeft;
}

function CountdownCard({
	title,
	dateLabel,
	targetDate,
	icon: Icon,
	buttonLabel,
	onButtonClick,
	theme = "event",
	locale,
}: {
	title: string;
	dateLabel: string;
	targetDate: Date | null;
	icon: LucideIcon;
	buttonLabel?: string;
	onButtonClick?: () => void;
	theme?: "event" | "deadline";
	locale: AppLocale;
}) {
	const { days, hours, minutes } = useCountdown(targetDate);
	const themeClasses =
		theme === "deadline"
			? "bg-[#899349] text-white"
			: "bg-primary text-primary-foreground";
	const accentClasses =
		theme === "deadline"
			? "bg-white/20 text-white"
			: "bg-white/20 text-primary-foreground";

	return (
		<div
			className={`relative overflow-hidden p-6 rounded-2xl shadow-lg text-center ${themeClasses}`}
		>
			<div
				aria-hidden
				className="pointer-events-none absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_top_right,var(--tw-gradient-stops))] from-white via-transparent to-transparent"
			/>
			<Icon className="size-10 mx-auto mb-2" />
			<h4 className="text-lg font-bold mb-1">{title}</h4>
			<p className="opacity-80 text-sm mb-6">{dateLabel}</p>
			<div className="grid grid-cols-3 gap-2 mb-4">
				{[
					{ val: days, label: locale === "en" ? "Days" : "Dni", id: "days" },
					{
						val: hours,
						label: locale === "en" ? "Hours" : "Godz",
						id: "hours",
					},
					{
						val: minutes,
						label: locale === "en" ? "Min" : "Min",
						id: "mins",
					},
				].map((item) => (
					<div
						key={item.id}
						className={`${accentClasses} rounded-lg p-2 backdrop-blur-sm`}
					>
						<span className="block text-2xl font-black">{item.val}</span>
						<span className="text-[10px] uppercase font-bold opacity-80">
							{item.label}
						</span>
					</div>
				))}
			</div>
			{buttonLabel && onButtonClick && (
				<Button
					variant="secondary"
					className="w-full font-bold text-sm hover:bg-white/90"
					onClick={onButtonClick}
				>
					{buttonLabel}
				</Button>
			)}
		</div>
	);
}

export function EventCountdownWidget({
	eventDate,
	onAddToCalendar,
}: {
	eventDate: Date | null;
	onAddToCalendar: () => void;
}) {
	const { locale } = useLocale();
	const label = useMemo(() => {
		const fallbackDate = new Date(WEDDING_EVENT.startIso);
		const displayDate = eventDate ?? fallbackDate;
		return displayDate.toLocaleDateString(locale === "en" ? "en-US" : "pl-PL", {
			day: "2-digit",
			month: "long",
			year: "numeric",
		});
	}, [eventDate, locale]);

	return (
		<CountdownCard
			title={locale === "en" ? "The Big Day" : "Wielki Dzień"}
			dateLabel={`${label}`}
			targetDate={eventDate}
			icon={Heart}
			buttonLabel={locale === "en" ? "Add to calendar" : "Dodaj do kalendarza"}
			onButtonClick={onAddToCalendar}
			theme="event"
			locale={locale}
		/>
	);
}

export function DeadlineCountdownWidget({
	deadline,
}: {
	deadline: Date | null;
}) {
	const { locale } = useLocale();
	const label = useMemo(() => {
		if (!deadline)
			return locale === "en" ? "February 28, 2026" : "28 Lutego 2026";
		return deadline.toLocaleDateString(locale === "en" ? "en-US" : "pl-PL", {
			day: "2-digit",
			month: "long",
			year: "numeric",
		});
	}, [deadline, locale]);

	return (
		<CountdownCard
			title={locale === "en" ? "Please RSVP by" : "Dajcie nam znać do"}
			dateLabel={label}
			targetDate={deadline}
			icon={Clock3}
			theme="deadline"
			locale={locale}
		/>
	);
}

export function EmergencyContactsWidget() {
	const { locale } = useLocale();
	const demoMode = isDemoMode();
	const contacts = demoMode
		? [
				{
					name: "Nadia",
					phone: "+48 500 111 222",
					role: locale === "en" ? "Bride" : "Panna Młoda",
				},
				{
					name: "Leon",
					phone: "+48 500 333 444",
					role: locale === "en" ? "Groom" : "Pan Młody",
				},
				{
					name: "Julia",
					phone: "+48 500 555 666",
					role: locale === "en" ? "Witness" : "Świadkowa",
				},
				{
					name: "Michał",
					phone: "+48 500 777 888",
					role: locale === "en" ? "Witness" : "Świadek",
				},
			]
		: [
				{
					name: "Kamila",
					phone: "739 046 625",
					role: locale === "en" ? "Bride" : "Panna Młoda",
				},
				{
					name: "Kuba",
					phone: "881 233 694",
					role: locale === "en" ? "Groom" : "Pan Młody",
				},
				{
					name: "Magda",
					phone: "501 604 101",
					role: locale === "en" ? "Witness" : "Świadek",
				},
				{
					name: "Mateusz",
					phone: "501 604 101",
					role: locale === "en" ? "Witness" : "Świadek",
				},
			];

	return (
		<div className="bg-background p-6 rounded-2xl shadow-sm border border-border">
			<h4 className="text-lg font-bold text-foreground mb-4">
				{locale === "en" ? "Important contacts" : "Ważne kontakty"}
			</h4>
			<ul className="flex flex-col gap-3">
				{contacts.map((contact) => (
					<li key={contact.name}>
						<div className="grid grid-cols-3 items-center gap-2 group">
							<span className="text-muted-foreground text-sm font-medium transition-colors">
								{contact.name}
							</span>
							<span className="text-muted-foreground text-sm font-medium rounde-md justify-self-left">
								{contact.role.charAt(0).toUpperCase() + contact.role.slice(1)}
							</span>
							<span className="text-muted-foreground text-sm font-medium rounded-md justify-self-end">
								{contact.phone}
							</span>
						</div>
					</li>
				))}
			</ul>
		</div>
	);
}

export function GreekPhrasesWidget() {
	const { locale } = useLocale();
	const greekPhraseCards = useMemo(() => getGreekPhraseCards(locale), [locale]);
	const prefersReducedMotion = useReducedMotion();
	const [activePhraseIndex, setActivePhraseIndex] = useState(0);

	useEffect(() => {
		if (greekPhraseCards.length < 2) {
			return;
		}

		const interval = window.setInterval(() => {
			setActivePhraseIndex((currentIndex) => {
				return (currentIndex + 1) % greekPhraseCards.length;
			});
		}, 10000);

		return () => window.clearInterval(interval);
	}, [greekPhraseCards.length]);

	const activePhrase = greekPhraseCards[activePhraseIndex];
	if (!activePhrase) {
		return null;
	}

	return (
		<div className="rounded-2xl border border-border bg-background p-4 shadow-sm sm:p-6">
			<div className="mb-4 flex items-center justify-between gap-2">
				<h4 className="text-lg font-bold text-foreground">
					{locale === "en" ? "Greek phrases" : "Greckie powiedzonka"}
				</h4>
				<span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
					{activePhraseIndex + 1}/{greekPhraseCards.length}
				</span>
			</div>

			<AnimatePresence mode="wait" initial={false}>
				<motion.div
					key={activePhrase.id}
					initial={{ opacity: 0, x: prefersReducedMotion ? 0 : 40 }}
					animate={{ opacity: 1, x: 0 }}
					exit={{ opacity: 0, x: prefersReducedMotion ? 0 : -40 }}
					transition={{ duration: 0.35, ease: "easeOut" }}
					className="space-y-4"
				>
					<div>
						<p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
							{locale === "en" ? "In English" : "Po polsku"}
						</p>
						<p className="mt-1 text-sm font-medium leading-relaxed text-foreground sm:text-base">
							{activePhrase.sourceText}
						</p>
					</div>

					<div>
						<p className="text-[10px] font-semibold uppercase tracking-wide text-primary">
							{locale === "en" ? "In Greek" : "Po grecku"}
						</p>
						<p className="mt-1 text-sm font-semibold leading-relaxed text-foreground sm:text-base">
							{activePhrase.greek}
						</p>
						{activePhrase.isApproximate && (
							<p className="mt-2 text-[10px] uppercase tracking-wide text-muted-foreground">
								{locale === "en"
									? "Approximate translation"
									: "Luźne tłumaczenie"}
							</p>
						)}
					</div>
				</motion.div>
			</AnimatePresence>
		</div>
	);
}

export function DogSlideshowWidget() {
	const { locale } = useLocale();
	const albumImages = [
		"/images/azja.webp",
		"/images/alajan.webp",
		"/images/dawid.webp",
		"/images/franek.webp",
		"/images/kite.webp",
		"/images/sadowa.webp",
		"/images/uro.webp",
		"/images/wataha.webp",
		"/images/wojtek.webp",
	];

	return (
		<div className="bg-background p-6 rounded-2xl shadow-sm border border-border">
			<h4 className="text-lg font-bold text-foreground mb-4">
				{locale === "en" ? "Album" : "Album"}
			</h4>
			<Carousel className="w-full">
				<CarouselContent className="-ml-0">
					{albumImages.map((src, index) => (
						<CarouselItem key={src} className="pl-0">
							<div className="overflow-hidden rounded-xl aspect-square">
								<img
									src={src}
									alt={`${locale === "en" ? "Album photo" : "Zdjęcie z albumu"} ${index + 1}`}
									className="object-cover w-full h-full"
								/>
							</div>
						</CarouselItem>
					))}
				</CarouselContent>
				<div className="flex justify-center gap-2 mt-2">
					<CarouselPrevious className="static translate-y-0" />
					<CarouselNext className="static translate-y-0" />
				</div>
			</Carousel>
		</div>
	);
}

export function NewsletterWidget() {
	return (
		<div className="bg-background p-6 rounded-2xl shadow-sm border border-border">
			<div className="flex items-center gap-3 mb-4">
				<div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
					<Mail className="size-5" />
				</div>
				<div>
					<h4 className="text-sm font-bold text-foreground">Powiadomienia</h4>
					<p className="text-xs text-muted-foreground">Bądź na bieżąco!</p>
				</div>
			</div>
			<p className="text-sm text-muted-foreground mb-4">
				Zostaw swój email, aby otrzymywać powiadomienia o nowych wpisach.
			</p>
			<div className="flex flex-col gap-3">
				<Input
					className="bg-muted border-none text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
					placeholder="Twój adres email"
					type="email"
				/>
				<Button className="w-full font-bold">Zapisz się</Button>
			</div>
		</div>
	);
}
