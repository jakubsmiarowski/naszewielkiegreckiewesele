import { AnimatePresence, motion } from "framer-motion";
import {
	ChevronRight,
	ExternalLink,
	Heart,
	Mail,
	Maximize2,
	Search,
	X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from "@/components/ui/carousel";
import { Input } from "@/components/ui/input";

const MAP_QUERY = "Lefka Ori Hotel, Chora Sfakion, Crete";
const MAP_QUERY_PARAM = encodeURIComponent(MAP_QUERY);
const MAP_EMBED_URL = `https://www.google.com/maps?q=${MAP_QUERY_PARAM}&output=embed`;
const MAP_LINK_URL = `https://www.google.com/maps/search/?api=1&query=${MAP_QUERY_PARAM}`;

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
	buttonLabel,
	onButtonClick,
	theme = "primary",
}: {
	title: string;
	dateLabel: string;
	targetDate: Date | null;
	buttonLabel?: string;
	onButtonClick?: () => void;
	theme?: "primary" | "sunset";
}) {
	const { days, hours, minutes } = useCountdown(targetDate);
	const themeClasses =
		theme === "sunset"
			? "bg-[#FDE68A] text-[#7C2D12]"
			: "bg-primary text-primary-foreground";
	const accentClasses =
		theme === "sunset"
			? "bg-white/60 text-[#7C2D12]"
			: "bg-white/20 text-primary-foreground";

	return (
		<div
			className={`relative overflow-hidden p-6 rounded-2xl shadow-lg text-center ${themeClasses}`}
		>
			<div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_top_right,var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
			<Heart className="size-10 mx-auto mb-2 fill-current" />
			<h4 className="text-lg font-bold mb-1">{title}</h4>
			<p className="opacity-80 text-sm mb-6">{dateLabel}</p>
			<div className="grid grid-cols-3 gap-2 mb-4">
				{[
					{ val: days, label: "Dni", id: "days" },
					{ val: hours, label: "Godz", id: "hours" },
					{ val: minutes, label: "Min", id: "mins" },
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
	const label = useMemo(() => {
		if (!eventDate) return "2 Października 2026, Kreta";
		return eventDate.toLocaleDateString("pl-PL", {
			day: "2-digit",
			month: "long",
			year: "numeric",
		});
	}, [eventDate]);

	return (
		<CountdownCard
			title="Wielki Dzień"
			dateLabel={`${label}, Kreta`}
			targetDate={eventDate}
			buttonLabel="Dodaj do kalendarza"
			onButtonClick={onAddToCalendar}
			theme="primary"
		/>
	);
}

export function DeadlineCountdownWidget({
	deadline,
}: {
	deadline: Date | null;
}) {
	const label = useMemo(() => {
		if (!deadline) return "28 Lutego 2026";
		return deadline.toLocaleDateString("pl-PL", {
			day: "2-digit",
			month: "long",
			year: "numeric",
		});
	}, [deadline]);

	return (
		<CountdownCard
			title="Dajcie nam znać do"
			dateLabel={label}
			targetDate={deadline}
			theme="sunset"
		/>
	);
}

// emergency contacts widget
export function EmergencyContactsWidget() {
	const contacts = [
		{ name: "Kamila", phone: "123456789", role: "bride" },
		{ name: "Kuba", phone: "123456789", role: "groom" },
		{ name: "Magda", phone: "123456789", role: "maid of honor" },
		{ name: "Matuesz", phone: "123456789", role: "best man" },
	];

	return (
		<div className="bg-background p-6 rounded-2xl shadow-sm border border-border">
			<h4 className="text-lg font-bold text-foreground mb-4">
				Emergency Contacts
			</h4>
			<ul className="flex flex-col gap-3">
				{contacts.map((contact) => (
					<li key={contact.name}>
						<a href="#" className="flex items-center justify-between group">
							<span className="text-muted-foreground text-sm font-medium group-hover:text-primary transition-colors">
								{contact.name}
							</span>
							<span className="bg-muted text-muted-foreground text-xs font-bold px-2 py-1 rounded-md">
								{contact.role.charAt(0).toUpperCase() + contact.role.slice(1)}
							</span>
							<span className="bg-muted text-muted-foreground text-xs font-bold px-2 py-1 rounded-md">
								{contact.phone}
							</span>
							<ChevronRight className="hidden" />{" "}
						</a>
					</li>
				))}
			</ul>
		</div>
	);
}

// widget with picture slides of dogs
export function DogSlideshowWidget() {
	const dogImages = [
		"https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=600&h=600",
		"https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=600&h=600",
		"https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=600&h=600",
		"https://images.unsplash.com/photo-1534361960057-19889db9621e?auto=format&fit=crop&w=600&h=600",
		"https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=600&h=600",
	];

	return (
		<div className="bg-background p-6 rounded-2xl shadow-sm border border-border">
			<h4 className="text-lg font-bold text-foreground mb-4">Nasze Pieski</h4>
			<Carousel className="w-full">
				<CarouselContent>
					{dogImages.map((src, index) => (
						<CarouselItem key={src}>
							<div className="p-1">
								<Card className="border-none shadow-none">
									<CardContent className="flex aspect-square items-center justify-center p-0 overflow-hidden rounded-xl">
										<img
											src={src}
											alt={`Dog ${index + 1}`}
											className="object-cover w-full h-full"
										/>
									</CardContent>
								</Card>
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

export function ExpandableMapWidget() {
	const [isOpen, setIsOpen] = useState(false);

	useEffect(() => {
		if (!isOpen) return;
		const originalOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = originalOverflow;
		};
	}, [isOpen]);

	useEffect(() => {
		if (!isOpen) return;
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				setIsOpen(false);
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isOpen]);

	return (
		<>
			<button
				type="button"
				onClick={() => setIsOpen(true)}
				className="w-full text-left bg-background p-6 rounded-2xl shadow-sm border border-border cursor-pointer"
			>
				<div className="mb-3 flex items-center justify-between gap-3">
					<h4 className="text-lg font-bold text-foreground">Mapa miejsca</h4>
					<Maximize2 className="size-4 text-muted-foreground" />
				</div>
				<p className="mb-4 text-sm text-muted-foreground">
					Lefka Ori, Chora Sfakion, Kreta
				</p>
				<div className="overflow-hidden rounded-xl border border-border bg-muted">
					<iframe
						title="Mapa Lefka Ori Hotel, Chora Sfakion"
						src={MAP_EMBED_URL}
						className="h-48 w-full pointer-events-none"
						loading="lazy"
						referrerPolicy="no-referrer-when-downgrade"
					/>
				</div>
				<p className="mt-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
					Kliknij, aby powiększyć mapę
				</p>
			</button>

			<AnimatePresence>
				{isOpen && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
						onClick={() => setIsOpen(false)}
					>
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							className="absolute inset-0 bg-black/65 backdrop-blur-sm"
						/>
						<motion.div
							initial={{ opacity: 0, y: 16, scale: 0.98 }}
							animate={{ opacity: 1, y: 0, scale: 1 }}
							exit={{ opacity: 0, y: 8, scale: 0.98 }}
							transition={{ duration: 0.2, ease: "easeOut" }}
							role="dialog"
							aria-modal="true"
							aria-label="Mapa Lefka Ori w Chora Sfakion"
							className="relative z-10 w-full max-w-5xl rounded-2xl border border-border bg-background p-4 shadow-2xl sm:p-6"
							onClick={(event) => event.stopPropagation()}
						>
							<div className="mb-4 flex items-start justify-between gap-4">
								<div>
									<h4 className="text-xl font-bold text-foreground">
										Lefka Ori Hotel
									</h4>
									<p className="text-sm text-muted-foreground">
										Chora Sfakion, Crete
									</p>
								</div>
								<button
									type="button"
									onClick={() => setIsOpen(false)}
									className="inline-flex size-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
									aria-label="Zamknij mapę"
								>
									<X className="size-4" />
								</button>
							</div>

							<div className="overflow-hidden rounded-xl border border-border bg-muted">
								<iframe
									title="Duża mapa Lefka Ori Hotel, Chora Sfakion"
									src={MAP_EMBED_URL}
									className="h-[55vh] min-h-[320px] w-full"
									loading="lazy"
									referrerPolicy="no-referrer-when-downgrade"
								/>
							</div>

							<a
								href={MAP_LINK_URL}
								target="_blank"
								rel="noopener noreferrer"
								className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
							>
								<ExternalLink className="size-4" />
								Otwórz w Google Maps
							</a>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
		</>
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
