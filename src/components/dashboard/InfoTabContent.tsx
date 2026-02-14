import { useMutation, useQuery } from "convex/react";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import {
	type InfoCardData,
	InfoCardGrid,
	type InfoCardLabels,
} from "@/components/dashboard/InfoCard";
import { PlanTimeline } from "@/components/dashboard/PlanTimeline";
import {
	ATTRACTION_ANCHORS,
	type AttractionAnchorId,
	type MainTabId,
	type QaPublicQuestion,
} from "@/components/dashboard/types";
import { toast } from "@/components/ui/use-toast";
import { type AppLocale, useLocale } from "@/lib/locale";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

const MAP_QUERY = "Lefka Ori Hotel, Chora Sfakion, Crete";
const MAP_QUERY_PARAM = encodeURIComponent(MAP_QUERY);
const MAP_EMBED_URL = `https://www.google.com/maps?q=${MAP_QUERY_PARAM}&output=embed`;
const MAP_LINK_URL = `https://www.google.com/maps/search/?api=1&query=${MAP_QUERY_PARAM}`;
const ASSET_CDN_BASE_URL =
	import.meta.env.VITE_ASSET_CDN_BASE_URL?.trim() ?? "";

const CARD_LABELS: Record<AppLocale, InfoCardLabels> = {
	pl: {
		imageFallbackLabel: "Zdjęcie wkrótce",
		learnMoreLabel: "Dowiedz się więcej",
		closeLabel: "Zamknij",
	},
	en: {
		imageFallbackLabel: "Image coming soon",
		learnMoreLabel: "Learn more",
		closeLabel: "Close",
	},
};

const QA_CONTENT: Record<
	AppLocale,
	{
		pendingAnswerMessage: string;
		baseQuestions: Array<{ question: string; answer: string }>;
		emptyQuestionTitle: string;
		emptyQuestionDescription: string;
		questionAddedTitle: string;
		questionAddedDescription: string;
		submitFailedTitle: string;
		submitFailedDescription: string;
		headerDescription: string;
		askerPrefix: string;
		defaultAsker: string;
		extraQuestionTitle: string;
		extraQuestionDescription: string;
		questionPlaceholder: string;
		sendingLabel: string;
		sendLabel: string;
	}
> = {
	pl: {
		pendingAnswerMessage:
			"Kuba jeszcze się zastanawia i odpowie jak szybko może.",
		baseQuestions: [
			{
				question: "Jaki jest dress code?",
				answer:
					"Elegancko, ale na luzie. Będzie gorąco, więc nie trzeba zakładać garnituru. Najważniejsze, żeby było schludnie i wygodnie.",
			},
			{
				question: "Czy warto mieć przy sobie gotówkę?",
				answer:
					"Tak, zdecydowanie warto. To mała miejscowość, więc czasem może nie być zasięgu albo działającego bankomatu.",
			},
			{
				question: "Co najlepiej spakować na wyjazd?",
				answer:
					"Przyda się ważny dokument, wygodne buty, buty do pływania, klapki, okulary przeciwsłoneczne, nakrycie głowy i strój kąpielowy.",
			},
			{
				question: "Czy planujemy wspólne aktywności poza weselem?",
				answer:
					"Tak. W zakładce Atrakcje znajdziesz nasze propozycje na wspólne wypady i spokojniejsze dni.",
			},
		],
		emptyQuestionTitle: "Wpisz pytanie",
		emptyQuestionDescription: "Treść pytania nie może być pusta.",
		questionAddedTitle: "Pytanie dodane",
		questionAddedDescription:
			"Dzięki! Twoje pytanie jest już widoczne w puli Q&A.",
		submitFailedTitle: "Nie udało się dodać pytania",
		submitFailedDescription: "Spróbuj ponownie za chwilę.",
		headerDescription:
			"Zebraliśmy najczęstsze pytania i odpowiedzi. Nowe pytania od gości od razu trafiają do wspólnej puli.",
		askerPrefix: "Pytanie od",
		defaultAsker: "Gość",
		extraQuestionTitle: "Masz dodatkowe pytanie?",
		extraQuestionDescription:
			"Zadaj je poniżej, będzie widoczne dla wszystkich w tej sekcji.",
		questionPlaceholder: "Twoje pytanie...",
		sendingLabel: "Wysyłanie...",
		sendLabel: "Wyślij pytanie",
	},
	en: {
		pendingAnswerMessage:
			"Kuba is still thinking about it and will answer as soon as possible.",
		baseQuestions: [
			{
				question: "What is the dress code?",
				answer:
					"Elegant but relaxed. It will be warm, so a full suit is not required. The key is to be neat and comfortable.",
			},
			{
				question: "Should I carry cash?",
				answer:
					"Yes, it is a good idea. This is a small town, so card terminals or ATMs may occasionally be unavailable.",
			},
			{
				question: "What should I pack?",
				answer:
					"Bring valid ID, comfortable shoes, water shoes, flip-flops, sunglasses, a hat, and swimwear.",
			},
			{
				question: "Are we planning activities outside the wedding day?",
				answer:
					"Yes. In the Attractions tab you can find ideas for shared trips and more relaxed days.",
			},
		],
		emptyQuestionTitle: "Enter a question",
		emptyQuestionDescription: "Question text cannot be empty.",
		questionAddedTitle: "Question added",
		questionAddedDescription:
			"Thanks! Your question is now visible in the shared Q&A list.",
		submitFailedTitle: "Could not add question",
		submitFailedDescription: "Please try again in a moment.",
		headerDescription:
			"We collected the most common questions and answers. New guest questions are added to the shared list right away.",
		askerPrefix: "Question from",
		defaultAsker: "Guest",
		extraQuestionTitle: "Have another question?",
		extraQuestionDescription:
			"Ask below and it will be visible to everyone in this section.",
		questionPlaceholder: "Your question...",
		sendingLabel: "Sending...",
		sendLabel: "Send question",
	},
};

function cdnAsset(path: string) {
	if (!path.startsWith("/")) return path;
	if (!ASSET_CDN_BASE_URL) return path;
	return `${ASSET_CDN_BASE_URL.replace(/\/+$/, "")}${path}`;
}

export function InfoTabContent({
	activeTab,
	invitationId,
	focusAttractionId,
	onAttractionFocused,
	onOpenAttraction,
	onOpenCarpool,
	canOpenCarpool = true,
}: {
	activeTab: MainTabId;
	invitationId?: string;
	focusAttractionId?: AttractionAnchorId | null;
	onAttractionFocused?: () => void;
	onOpenAttraction?: (anchorId: AttractionAnchorId) => void;
	onOpenCarpool?: () => void;
	canOpenCarpool?: boolean;
}) {
	const { locale } = useLocale();

	switch (activeTab) {
		case "Plan zabawy":
			return <InfoPlanTemplate onOpenAttraction={onOpenAttraction} />;
		case "Logistyka":
			return (
				<InfoLogisticsTemplate
					locale={locale}
					onOpenCarpool={onOpenCarpool}
					canOpenCarpool={canOpenCarpool}
				/>
			);
		case "Atrakcje":
			return (
				<InfoAttractionsTemplate
					locale={locale}
					focusAttractionId={focusAttractionId}
					onAttractionFocused={onAttractionFocused}
				/>
			);
		case "Q&A":
			return <InfoQATemplate locale={locale} invitationId={invitationId} />;
		default:
			return <InfoOverview locale={locale} />;
	}
}

function InfoOverview({ locale }: { locale: AppLocale }) {
	const cards = useMemo<InfoCardData[]>(() => {
		if (locale === "en") {
			return [
				{
					id: "info-rsvp",
					image:
						"https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1200&q=80",
					category: "RSVP",
					date: "February 2026",
					title: "Confirm attendance",
					description:
						"Fill in the RSVP form for your invitation group and update it if needed.",
					alt: "Notebook and pen next to a coffee cup",
					content: (
						<ul className="space-y-2 text-sm text-muted-foreground">
							<li>One shared RSVP form for your invitation</li>
							<li>Create and update modes are supported</li>
							<li>Guest list is included in the form</li>
						</ul>
					),
				},
				{
					id: "info-plan",
					image:
						"https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
					category: "Schedule",
					date: "September 2026",
					title: "Day-by-day plan",
					description: "Each day is described in detail.",
					alt: "Sea view at sunset",
					content: (
						<p className="text-sm text-muted-foreground">
							You can find day-by-day details in the Schedule tab.
						</p>
					),
				},
			];
		}

		return [
			{
				id: "info-rsvp",
				image:
					"https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1200&q=80",
				category: "RSVP",
				date: "Luty 2026",
				title: "Potwierdź obecność",
				description:
					"Formularz do potwierdzenia obecności dla całego zaproszenia.",
				alt: "Notatnik i długopis przy filiżance kawy",
				content: (
					<ul className="space-y-2 text-sm text-muted-foreground">
						<li>Formularz dla całej grupy z zaproszenia</li>
						<li>Możliwość późniejszej aktualizacji</li>
						<li>Lista gości dostępna bezpośrednio w formularzu</li>
					</ul>
				),
			},
			{
				id: "info-plan",
				image:
					"https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
				category: "Plan zabawy",
				date: "Wrzesień 2026",
				title: "Harmonogram dni",
				description: "Każdy dzień jest szczegółowo rozpisany.",
				alt: "Widok na morze o zachodzie słońca",
				content: (
					<p className="text-sm text-muted-foreground">
						W zakładce planu znajdziesz godzinowy harmonogram i aktywności.
					</p>
				),
			},
		];
	}, [locale]);

	const cardLabels = CARD_LABELS[locale];

	return (
		<div className="space-y-6">
			<div className="rounded-2xl border border-border bg-white p-4 shadow-sm space-y-5 sm:p-6 sm:space-y-6">
				<div>
					<h3 className="text-xl font-bold text-foreground sm:text-2xl">
						{locale === "en"
							? "Our Big Greek Wedding"
							: "Nasze Wielkie Greckie Wesele"}
					</h3>
					<p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
						{locale === "en"
							? "We will be in Greece from September 30 to October 4, 2026. The main ceremony takes place on October 1, 2026."
							: "Widujemy się w Grecji od 30 września do 4 października. Główna uroczystość: 1 października 2026."}
					</p>
				</div>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="rounded-xl bg-[var(--color-background-light)] p-4">
						<p className="text-xs uppercase tracking-widest text-muted-foreground">
							{locale === "en" ? "Location" : "Miejsce"}
						</p>
						<p className="font-semibold text-foreground mt-1">
							{locale === "en" ? "Crete, Greece" : "Kreta, Grecja"}
						</p>
					</div>
					<div className="rounded-xl bg-[var(--color-background-light)] p-4">
						<p className="text-xs uppercase tracking-widest text-muted-foreground">
							{locale === "en" ? "Important dates" : "Ważne daty"}
						</p>
						<p className="font-semibold text-foreground mt-1">
							30.09 – 04.10.2026
						</p>
					</div>
				</div>
				<p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
					{locale === "en"
						? "If you need help with travel or accommodation, let us know in the RSVP form."
						: "Jeśli potrzebujesz pomocy z podróżą lub noclegiem, daj nam znać w formularzu RSVP."}
				</p>
			</div>
			<InfoCardGrid cards={cards} labels={cardLabels} />
		</div>
	);
}

function InfoPlanTemplate({
	onOpenAttraction,
}: {
	onOpenAttraction?: (anchorId: AttractionAnchorId) => void;
}) {
	return (
		<div className="space-y-6">
			<PlanTimeline onOpenAttraction={onOpenAttraction} />
		</div>
	);
}

function InfoLogisticsTemplate({
	locale,
	onOpenCarpool,
	canOpenCarpool,
}: {
	locale: AppLocale;
	onOpenCarpool?: () => void;
	canOpenCarpool: boolean;
}) {
	const title = locale === "en" ? "Logistics" : "Logistyka";
	const transportTitle = locale === "en" ? "Transport" : "Środki transportu";
	const hotelTitle = locale === "en" ? "Hotel" : "Hotel";
	const costsTitle = locale === "en" ? "Costs" : "Koszty";
	const carpoolAccessMessage =
		locale === "en"
			? "To access Car Pool, complete your RSVP first."
			: "Aby wejść do Car Pool, najpierw odpowiedz na RSVP.";

	return (
		<div className="space-y-6">
			<div className="rounded-2xl border border-border bg-white p-4 shadow-sm space-y-4 sm:p-6">
				<h3 className="text-xl font-bold text-foreground sm:text-2xl">
					{title}
				</h3>
				<div className="space-y-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
					<div>
						<h4 className="text-xs font-semibold uppercase tracking-widest text-foreground sm:text-sm">
							{transportTitle}
						</h4>
						<ul className="mt-2 space-y-2">
							<li>
								{locale === "en" ? "Renting a car." : "Wypożyczenie auta."}
							</li>
							<li>
								{locale === "en"
									? "Joining another guest using the "
									: "Zabranie się z kimś z innych gości używając opcji "}
								{onOpenCarpool && canOpenCarpool ? (
									<button
										type="button"
										onClick={onOpenCarpool}
										className="font-medium text-foreground underline underline-offset-4 hover:opacity-80"
									>
										Car Pool
									</button>
								) : (
									"Car Pool"
								)}
								.
							</li>
							{!canOpenCarpool && (
								<li className="text-xs sm:text-sm">{carpoolAccessMessage}</li>
							)}
						</ul>
					</div>
					<div>
						<h4 className="text-sm font-semibold uppercase tracking-widest text-foreground">
							{hotelTitle}
						</h4>
						<p className="mt-2">
							{locale === "en"
								? "We are planning accommodation in a few nearby guesthouses. Late September and early October are still busy in this region. One of these guesthouses hosts the restaurant where the wedding reception takes place."
								: "Noclegi planujemy w kilku pensjonatach. Przełom września i października jest nadal popularny. W jednym z pensjonatów znajduje się restauracja, w której odbędzie się wesele."}
						</p>
						<p className="mt-2">
							{locale === "en"
								? "If you plan to arrive earlier or leave later and need help booking extra nights, mark it in the RSVP form and we will assist."
								: "Jeśli planujesz przylot wcześniej lub wylot później i potrzebujesz wsparcia z rezerwacją dodatkowych noclegów, zaznacz to w formularzu RSVP, a my to załatwimy."}
						</p>
					</div>
					<div>
						<h4 className="text-sm font-semibold uppercase tracking-widest text-foreground">
							{costsTitle}
						</h4>
						<p className="mt-2">
							{locale === "en"
								? "We cover accommodation from Wednesday to Sunday. Guests cover flights and transfer to Chora Sfakion."
								: "Noclegi od środy do niedzieli opłacamy my. Po Waszej stronie zostaje lot i dotarcie do Chory Sfakion."}
						</p>
						<p className="mt-2">
							{locale === "en"
								? "If someone wants to arrive earlier or stay longer, extra nights are paid individually."
								: "Jeśli ktoś planuje przylecieć wcześniej lub zostać dłużej, dodatkowe noclegi opłaca we własnym zakresie."}
						</p>
					</div>
				</div>
			</div>
			<div className="rounded-2xl border border-border bg-white p-4 shadow-sm space-y-4 sm:p-6">
				<div>
					<a
						href={MAP_LINK_URL}
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex text-lg font-bold text-foreground hover:underline sm:text-xl"
					>
						Lefka Ori Hotel
					</a>
					<p className="text-sm text-muted-foreground mt-1">
						Chora Sfakion, Crete
					</p>
				</div>
				<div className="overflow-hidden rounded-xl border border-border bg-muted">
					<iframe
						title={
							locale === "en"
								? "Map of Lefka Ori Hotel, Chora Sfakion"
								: "Mapa Lefka Ori Hotel, Chora Sfakion"
						}
						src={MAP_EMBED_URL}
						className="h-[48vh] min-h-[260px] w-full sm:h-[55vh] sm:min-h-[320px]"
						loading="lazy"
						referrerPolicy="no-referrer-when-downgrade"
					/>
				</div>
			</div>
		</div>
	);
}

function InfoAttractionsTemplate({
	locale,
	focusAttractionId,
	onAttractionFocused,
}: {
	locale: AppLocale;
	focusAttractionId?: AttractionAnchorId | null;
	onAttractionFocused?: () => void;
}) {
	useEffect(() => {
		if (!focusAttractionId) return;
		const element = document.getElementById(focusAttractionId);
		if (!element) return;
		element.scrollIntoView({ behavior: "smooth", block: "start" });
		onAttractionFocused?.();
	}, [focusAttractionId, onAttractionFocused]);

	const cards = useMemo<InfoCardData[]>(() => {
		if (locale === "en") {
			return [
				{
					id: "attractions-loutro",
					anchorId: ATTRACTION_ANCHORS.loutroSaturdayTrip,
					image: cdnAsset("/images/loutro4.webp"),
					category: "Beaches & coves",
					date: "Sat 10/03 • 20-30 min boat ride",
					title: "Loutro",
					description:
						"On Saturday we invite you to a shared trip with a friendly local captain to the beautiful white village of Loutro.",
					alt: "Seaside village with white houses and turquoise water",
					content: (
						<div className="space-y-4 text-sm text-muted-foreground">
							<p>
								Loutro is one of the most charming places in the Sfakia region.
								No car traffic creates a relaxed, holiday atmosphere.
							</p>
							<ul className="space-y-2 list-disc pl-5">
								<li>Boat ride from Chora Sfakion.</li>
								<li>
									Optional stop or walk to Glyka Nera (Sweet Water Beach).
								</li>
								<li>Plenty of views and small tavernas for a relaxed lunch.</li>
								<li>A great option if you want a calm and scenic day.</li>
							</ul>
							<a
								href="https://maps.google.com/?q=Loutro+Crete"
								target="_blank"
								rel="noopener noreferrer"
								className="inline-flex items-center font-semibold text-primary hover:underline"
							>
								View Loutro on map
							</a>
						</div>
					),
				},
				{
					id: "attractions-glyka-nera",
					image: cdnAsset("/images/glykanera.webp"),
					category: "Beaches & coves",
					date: "Boat or hike",
					title: "Glyka Nera (Sweet Water Beach)",
					description:
						"A wild beach under cliffs, known for crystal-clear water and a quieter atmosphere.",
					alt: "Rocky beach under high cliffs",
					content: (
						<div className="space-y-4 text-sm text-muted-foreground">
							<p>
								One of the most iconic beaches in southern Crete, with very
								clear water and spectacular views.
							</p>
							<ul className="space-y-2 list-disc pl-5">
								<li>Easiest access: by boat from Chora Sfakion.</li>
								<li>For active guests: coastal hike from Sfakia or Loutro.</li>
								<li>Bring water shoes, sun protection, and drinking water.</li>
							</ul>
							<a
								href="https://maps.google.com/?q=Glyka+Nera+Beach+Crete"
								target="_blank"
								rel="noopener noreferrer"
								className="inline-flex items-center font-semibold text-primary hover:underline"
							>
								View Glyka Nera on map
							</a>
						</div>
					),
				},
				{
					id: "attractions-frangokastello",
					image: cdnAsset("/images/frangokastello.webp"),
					category: "History & beach",
					date: "20-25 min by car",
					title: "Frangokastello",
					description:
						"A Venetian fortress by the beach, perfect for a half-day trip.",
					alt: "Stone fortress next to a sandy beach",
					content: (
						<div className="space-y-4 text-sm text-muted-foreground">
							<p>
								Frangokastello combines a historic site with a broad, gentle
								beach. Great if you want an easy day without a long hike.
							</p>
							<ul className="space-y-2 list-disc pl-5">
								<li>The fortress is small but very photogenic.</li>
								<li>The beach is sandy and usually calmer than big resorts.</li>
								<li>Nearby seasonal tavernas and cafes are available.</li>
							</ul>
							<a
								href="https://maps.google.com/?q=Frangokastello+Crete"
								target="_blank"
								rel="noopener noreferrer"
								className="inline-flex items-center font-semibold text-primary hover:underline"
							>
								View Frangokastello on map
							</a>
						</div>
					),
				},
				{
					id: "attractions-imbros",
					image: cdnAsset("/images/imbros.webp"),
					category: "Hiking",
					date: "20 min by car",
					title: "Imbros Gorge",
					description:
						"A shorter and easier alternative to Samaria, perfect for an active morning.",
					alt: "Narrow rocky gorge with hiking trail",
					content: (
						<div className="space-y-4 text-sm text-muted-foreground">
							<p>
								Imbros is a great choice if you want to see a Cretan gorge
								without a full-day trek.
							</p>
							<ul className="space-y-2 list-disc pl-5">
								<li>The walk usually takes around 2-3 hours.</li>
								<li>The route is clear, but some parts are rocky.</li>
								<li>Afterward, return by taxi or arranged transfer.</li>
							</ul>
							<a
								href="https://maps.google.com/?q=Imbros+Gorge+Crete"
								target="_blank"
								rel="noopener noreferrer"
								className="inline-flex items-center font-semibold text-primary hover:underline"
							>
								View Imbros Gorge on map
							</a>
						</div>
					),
				},
				{
					id: "attractions-aradena",
					image: cdnAsset("/images/aradena.webp"),
					category: "Views",
					date: "20-30 min by car",
					title: "Aradena Gorge and Bridge",
					description:
						"Dramatic Sfakia landscapes, a bridge over the gorge, and excellent viewpoints.",
					alt: "Bridge over a deep rocky gorge",
					content: (
						<div className="space-y-4 text-sm text-muted-foreground">
							<p>
								Aradena is impressive even without hiking the full gorge. The
								bridge viewpoint alone is worth the drive.
							</p>
							<ul className="space-y-2 list-disc pl-5">
								<li>Best reached by car directly to Aradena Bridge.</li>
								<li>Perfect for photos and a short walk.</li>
								<li>Be careful on windy days.</li>
							</ul>
							<a
								href="https://maps.google.com/?q=Aradena+Bridge+Crete"
								target="_blank"
								rel="noopener noreferrer"
								className="inline-flex items-center font-semibold text-primary hover:underline"
							>
								View Aradena Bridge on map
							</a>
						</div>
					),
				},
				{
					id: "attractions-anopoli",
					image: cdnAsset("/images/anopoli.webp"),
					category: "Local vibe",
					date: "20-30 min by car",
					title: "Anopoli and the Sfakia plateau",
					description:
						"A mountain village with authentic atmosphere and views of the southern coast.",
					alt: "Mountain road with sea view",
					content: (
						<div className="space-y-4 text-sm text-muted-foreground">
							<p>
								Anopoli is ideal if you want a break from beaches and a look at
								the more traditional side of the region.
							</p>
							<ul className="space-y-2 list-disc pl-5">
								<li>Scenic access road with many viewpoints.</li>
								<li>You can combine it with lunch in a local taverna.</li>
								<li>A great calm afternoon outside the busiest spots.</li>
							</ul>
							<a
								href="https://maps.google.com/?q=Anopoli+Sfakia+Crete"
								target="_blank"
								rel="noopener noreferrer"
								className="inline-flex items-center font-semibold text-primary hover:underline"
							>
								View Anopoli on map
							</a>
						</div>
					),
				},
			];
		}

		return [
			{
				id: "attractions-loutro",
				anchorId: ATTRACTION_ANCHORS.loutroSaturdayTrip,
				image: cdnAsset("/images/loutro4.webp"),
				category: "Plaże i zatoczki",
				date: "Sobota 03.10 • Rejs 20-30 min",
				title: "Loutro",
				description:
					"W sobotę zapraszamy na wyjątkową, wspólną wycieczkę z zaprzyjaźnionym kapitanem do malowniczej, białej wioski Loutro.",
				alt: "Nadmorska miejscowość z białą zabudową i turkusową wodą",
				content: (
					<div className="space-y-4 text-sm text-muted-foreground">
						<p>
							Loutro to jedna z najbardziej klimatycznych miejscowości w
							regionie Sfakia. Brak ruchu samochodowego robi świetny, wakacyjny
							klimat.
						</p>
						<ul className="space-y-2 list-disc pl-5">
							<li>Rejs łodzią z Chora Sfakion.</li>
							<li>
								Możliwość postoju lub spaceru na słynną plażę Glyka Nera (Sweet
								Water Beach).
							</li>
							<li>
								Błogi relaks na miejscu: piękne widoki, kameralne tawerny i czas
								na spokojne delektowanie się chwilą przy zimnym napoju.
							</li>
							<li>
								Idealna propozycja dla tych, którzy chcą odpocząć i nacieszyć
								się niezwykłym krajobrazem.
							</li>
						</ul>
						<a
							href="https://maps.google.com/?q=Loutro+Crete"
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center font-semibold text-primary hover:underline"
						>
							Zobacz Loutro na mapie
						</a>
					</div>
				),
			},
			{
				id: "attractions-glyka-nera",
				image: cdnAsset("/images/glykanera.webp"),
				category: "Plaże i zatoczki",
				date: "Łódź lub trekking",
				title: "Glyka Nera (Sweet Water Beach)",
				description:
					"Dzika plaża pod klifami, znana z krystalicznej wody i spokojniejszej atmosfery.",
				alt: "Kamienista plaża pod wysokimi klifami",
				content: (
					<div className="space-y-4 text-sm text-muted-foreground">
						<p>
							To jedna z najbardziej charakterystycznych plaż południowej Krety.
							Woda jest bardzo przejrzysta, a krajobraz naprawdę spektakularny.
						</p>
						<ul className="space-y-2 list-disc pl-5">
							<li>Najprostszy dojazd: łódką z Chora Sfakion.</li>
							<li>
								Dla aktywnych: dojście pieszo od strony Sfakii lub Loutro (szlak
								nadmorski).
							</li>
							<li>
								Warto zabrać buty do wody, nakrycie głowy i zapas wody pitnej.
							</li>
						</ul>
						<a
							href="https://maps.google.com/?q=Glyka+Nera+Beach+Crete"
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center font-semibold text-primary hover:underline"
						>
							Zobacz Glyka Nera na mapie
						</a>
					</div>
				),
			},
			{
				id: "attractions-frangokastello",
				image: cdnAsset("/images/frangokastello.webp"),
				category: "Historia i plaża",
				date: "Auto 20-25 min",
				title: "Frangokastello",
				description:
					"Wenecka twierdza tuż przy plaży, dobre miejsce na półdniowy wypad.",
				alt: "Kamienna twierdza przy piaszczystej plaży",
				content: (
					<div className="space-y-4 text-sm text-muted-foreground">
						<p>
							Frangokastello łączy zwiedzanie zabytku z relaksem na szerokiej,
							łagodnej plaży. Dobre miejsce, jeśli chcecie dzień bez długiego
							trekkingu.
						</p>
						<ul className="space-y-2 list-disc pl-5">
							<li>Twierdza jest niewielka, ale bardzo fotogeniczna.</li>
							<li>
								Plaża jest piaszczysta i zwykle spokojniejsza niż duże kurorty.
							</li>
							<li>W okolicy działają tawerny i kawiarnie sezonowe.</li>
						</ul>
						<a
							href="https://maps.google.com/?q=Frangokastello+Crete"
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center font-semibold text-primary hover:underline"
						>
							Zobacz Frangokastello na mapie
						</a>
					</div>
				),
			},
			{
				id: "attractions-imbros",
				image: cdnAsset("/images/imbros.webp"),
				category: "Trekking",
				date: "Auto 20 min",
				title: "Wąwóz Imbros",
				description:
					"Krótsza i łatwiejsza alternatywa dla Samarii, idealna na aktywny poranek.",
				alt: "Wąski skalny wąwóz z pieszym szlakiem",
				content: (
					<div className="space-y-4 text-sm text-muted-foreground">
						<p>
							Imbros to bardzo dobry wybór dla osób, które chcą zobaczyć
							kreteński wąwóz bez całodziennej wyprawy.
						</p>
						<ul className="space-y-2 list-disc pl-5">
							<li>Przejście zajmuje zwykle około 2-3 godziny.</li>
							<li>Szlak jest czytelny, ale miejscami kamienisty.</li>
							<li>
								Po zejściu można wrócić do Chora Sfakion taksówką lub umówionym
								transportem.
							</li>
						</ul>
						<a
							href="https://maps.google.com/?q=Imbros+Gorge+Crete"
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center font-semibold text-primary hover:underline"
						>
							Zobacz Imbros Gorge na mapie
						</a>
					</div>
				),
			},
			{
				id: "attractions-aradena",
				image: cdnAsset("/images/aradena.webp"),
				category: "Widoki",
				date: "Auto 20-30 min",
				title: "Wąwóz Aradena i most",
				description:
					"Surowe krajobrazy Sfakii, most nad przepaścią i świetne punkty widokowe.",
				alt: "Most nad głębokim skalnym wąwozem",
				content: (
					<div className="space-y-4 text-sm text-muted-foreground">
						<p>
							Aradena robi duże wrażenie, nawet jeśli nie planujecie pełnego
							zejścia dnem wąwozu. Sam punkt widokowy na moście jest wart
							dojazdu.
						</p>
						<ul className="space-y-2 list-disc pl-5">
							<li>Najlepiej podjechać autem do mostu Aradena.</li>
							<li>To miejsce na zdjęcia i krótki spacer po okolicy.</li>
							<li>Przy silnym wietrze warto zachować większą ostrożność.</li>
						</ul>
						<a
							href="https://maps.google.com/?q=Aradena+Bridge+Crete"
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center font-semibold text-primary hover:underline"
						>
							Zobacz Aradena Bridge na mapie
						</a>
					</div>
				),
			},
			{
				id: "attractions-anopoli",
				image: cdnAsset("/images/anopoli.webp"),
				category: "Lokalny klimat",
				date: "Auto 20-30 min",
				title: "Anopoli i płaskowyż Sfakia",
				description:
					"Górska miejscowość z autentycznym klimatem i widokami na południowe wybrzeże.",
				alt: "Górska droga i widok na morze",
				content: (
					<div className="space-y-4 text-sm text-muted-foreground">
						<p>
							Anopoli to dobry plan, gdy chcecie odetchnąć od plaż i zobaczyć
							bardziej tradycyjną stronę regionu.
						</p>
						<ul className="space-y-2 list-disc pl-5">
							<li>
								Malownicza droga dojazdowa z licznymi punktami widokowymi.
							</li>
							<li>Można połączyć z lunchem w lokalnej tawernie.</li>
							<li>Dobre miejsce na spokojne popołudnie poza tłumem.</li>
						</ul>
						<a
							href="https://maps.google.com/?q=Anopoli+Sfakia+Crete"
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center font-semibold text-primary hover:underline"
						>
							Zobacz Anopoli na mapie
						</a>
					</div>
				),
			},
		];
	}, [locale]);

	const cardLabels = CARD_LABELS[locale];

	return (
		<div className="space-y-6">
			<div className="rounded-2xl border border-border bg-white p-4 shadow-sm space-y-4 sm:p-6">
				<h3 className="text-xl font-bold text-foreground sm:text-2xl">
					{locale === "en" ? "Attractions" : "Atrakcje"}
				</h3>
				<p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
					{locale === "en"
						? "We collected 6 proven options close to Chora Sfakion. Each card opens a modal with a short description and a map link."
						: "Zebraliśmy 6 sprawdzonych propozycji blisko Chora Sfakion. Każda kartka otwiera modal z krótkim opisem i linkiem do mapy."}
				</p>
			</div>
			<InfoCardGrid cards={cards} labels={cardLabels} />
		</div>
	);
}

function InfoQATemplate({
	locale,
	invitationId,
}: {
	locale: AppLocale;
	invitationId?: string;
}) {
	const copy = QA_CONTENT[locale];
	const submitQuestion = useMutation(api.questions.submitQuestion);
	const communityQuestions = useQuery(api.questions.listPublic, {}) as
		| QaPublicQuestion[]
		| undefined;
	const [questionDraft, setQuestionDraft] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const mergedQuestions = useMemo(() => {
		const base = copy.baseQuestions.map((item, index) => ({
			id: `base-${index}`,
			question: item.question,
			answer: item.answer,
			askerDisplayName: undefined,
			createdAt: undefined,
		}));
		const fromGuests = (communityQuestions ?? []).map((item) => ({
			id: item._id,
			question: item.question,
			answer:
				item.status === "answered" && item.answer
					? item.answer
					: copy.pendingAnswerMessage,
			askerDisplayName: item.askerDisplayName,
			createdAt: item.createdAt,
		}));
		return [...base, ...fromGuests];
	}, [communityQuestions, copy]);

	const handleSubmitQuestion = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const question = questionDraft.trim();
		if (!question) {
			toast({
				variant: "destructive",
				title: copy.emptyQuestionTitle,
				description: copy.emptyQuestionDescription,
			});
			return;
		}

		try {
			setIsSubmitting(true);
			const payload: { question: string; invitationId?: Id<"invitations"> } = {
				question,
			};
			if (invitationId) {
				payload.invitationId = invitationId as Id<"invitations">;
			}
			await submitQuestion(payload);
			setQuestionDraft("");
			toast({
				variant: "success",
				title: copy.questionAddedTitle,
				description: copy.questionAddedDescription,
			});
		} catch (_error) {
			toast({
				variant: "destructive",
				title: copy.submitFailedTitle,
				description: copy.submitFailedDescription,
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="space-y-6">
			<div className="rounded-2xl border border-border bg-white p-4 shadow-sm space-y-4 sm:p-6">
				<h3 className="text-xl font-bold text-foreground sm:text-2xl">Q&A</h3>
				<p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
					{copy.headerDescription}
				</p>
				<div className="space-y-5">
					{mergedQuestions.map((item) => (
						<div
							key={item.id}
							className="rounded-xl bg-[var(--color-background-light)] p-3 sm:p-4"
						>
							<h4 className="text-[11px] font-semibold uppercase tracking-widest text-foreground sm:text-sm">
								{item.question}
							</h4>
							<p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
								{item.answer}
							</p>
							{item.createdAt && (
								<p className="mt-3 text-xs text-muted-foreground/80">
									{copy.askerPrefix}:{" "}
									{item.askerDisplayName ?? copy.defaultAsker} •{" "}
									{new Date(item.createdAt).toLocaleDateString(
										locale === "en" ? "en-US" : "pl-PL",
									)}
								</p>
							)}
						</div>
					))}
				</div>
			</div>

			<div className="rounded-2xl border border-border bg-white p-4 shadow-sm space-y-4 sm:p-6">
				<h3 className="text-lg font-bold text-foreground sm:text-xl">
					{copy.extraQuestionTitle}
				</h3>
				<p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
					{copy.extraQuestionDescription}
				</p>
				<form className="space-y-3" onSubmit={handleSubmitQuestion}>
					<textarea
						value={questionDraft}
						onChange={(event) => setQuestionDraft(event.target.value)}
						placeholder={copy.questionPlaceholder}
						maxLength={400}
						rows={3}
						className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground shadow-xs focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
					/>
					<div className="flex items-center justify-between gap-3">
						<p className="text-xs text-muted-foreground">
							{questionDraft.length}/400
						</p>
						<button
							type="submit"
							disabled={isSubmitting}
							className="px-4 py-2 rounded-full bg-[var(--color-primary)] text-white text-sm font-semibold hover:bg-[var(--color-primary-dark)] disabled:cursor-not-allowed disabled:opacity-70 transition"
						>
							{isSubmitting ? copy.sendingLabel : copy.sendLabel}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
