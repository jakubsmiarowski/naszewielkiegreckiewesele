import { useMutation, useQuery } from "convex/react";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import {
	type InfoCardData,
	InfoCardGrid,
} from "@/components/dashboard/InfoCard";
import { PlanTimeline } from "@/components/dashboard/PlanTimeline";
import {
	ATTRACTION_ANCHORS,
	type AttractionAnchorId,
	type MainTabId,
	type QaPublicQuestion,
} from "@/components/dashboard/types";
import { toast } from "@/components/ui/use-toast";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

const MAP_QUERY = "Lefka Ori Hotel, Chora Sfakion, Crete";
const MAP_QUERY_PARAM = encodeURIComponent(MAP_QUERY);
const MAP_EMBED_URL = `https://www.google.com/maps?q=${MAP_QUERY_PARAM}&output=embed`;
const MAP_LINK_URL = `https://www.google.com/maps/search/?api=1&query=${MAP_QUERY_PARAM}`;
const ASSET_CDN_BASE_URL =
	import.meta.env.VITE_ASSET_CDN_BASE_URL?.trim() ?? "";

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
}: {
	activeTab: MainTabId;
	invitationId?: string;
	focusAttractionId?: AttractionAnchorId | null;
	onAttractionFocused?: () => void;
	onOpenAttraction?: (anchorId: AttractionAnchorId) => void;
	onOpenCarpool?: () => void;
}) {
	switch (activeTab) {
		case "Plan zabawy":
			return <InfoPlanTemplate onOpenAttraction={onOpenAttraction} />;
		case "Logistyka":
			return <InfoLogisticsTemplate onOpenCarpool={onOpenCarpool} />;
		case "Atrakcje":
			return (
				<InfoAttractionsTemplate
					focusAttractionId={focusAttractionId}
					onAttractionFocused={onAttractionFocused}
				/>
			);
		case "Q&A":
			return <InfoQATemplate invitationId={invitationId} />;
		default:
			return <InfoOverview />;
	}
}

function InfoOverview() {
	const cards: InfoCardData[] = [
		{
			id: "info-rsvp",
			image:
				"https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1200&q=80",
			category: "RSVP",
			date: "Luty 2026",
			title: "Potwierdź obecność",
			description:
				"Formularz do potwierdzenia obecności z shared. Dwa mode - create / update. Lista gości.",
			alt: "Notatnik i długopis przy filiżance kawy",
			content: (
				<ul className="space-y-2 text-sm text-muted-foreground">
					<li>Formularz do potwierdzenia obecności z shared</li>
					<li>dwa mode - create / update</li>
					<li>Lista gości</li>
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
			description: "Kazdy dzien szczegolowo rozpisany.",
			alt: "Widok na morze o zachodzie słońca",
			content: (
				<p className="text-sm text-muted-foreground">
					Kazdy dzien szczegolowo rozpisany.
				</p>
			),
		},
	];

	return (
		<div className="space-y-6">
			<div className="rounded-2xl border border-border bg-white p-4 shadow-sm space-y-5 sm:p-6 sm:space-y-6">
				<div>
					<h3 className="text-xl font-bold text-foreground sm:text-2xl">
						Nasze Wielkie Greckie Wesele
					</h3>
					<p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
						Widujemy się w Grecji od 30 września do 4 października. Główna
						uroczystość: 1 października 2026.
					</p>
				</div>
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
				<p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
					Jeśli potrzebujesz pomocy z podróżą lub noclegiem, daj nam znać w
					formularzu RSVP.
				</p>
			</div>
			<InfoCardGrid cards={cards} />
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
	onOpenCarpool,
}: {
	onOpenCarpool?: () => void;
}) {
	return (
		<div className="space-y-6">
			<div className="rounded-2xl border border-border bg-white p-4 shadow-sm space-y-4 sm:p-6">
				<h3 className="text-xl font-bold text-foreground sm:text-2xl">
					Logistyka
				</h3>
				<div className="space-y-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
					<div>
						<h4 className="text-xs font-semibold uppercase tracking-widest text-foreground sm:text-sm">
							Środki transportu
						</h4>
						<ul className="mt-2 space-y-2">
							<li>Wypożyczenie auta.</li>
							<li>
								Zabranie się z kimś z innych gości używając opcji{" "}
								{onOpenCarpool ? (
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
						</ul>
					</div>
					<div>
						<h4 className="text-sm font-semibold uppercase tracking-widest text-foreground">
							Hotel
						</h4>
						<p className="mt-2">
							Noclegi planujemy w kilku pensjonatach. Okazuje się, ze przełom
							września i października jest nadal popularny. W jednym z
							pensjonatów znajduje się restauracja, w której odbędzie się
							wesele.
						</p>
						<p className="mt-2">
							Jeśli planujesz przylot wcześniej lub wylot później i potrzebujesz
							wsparcia z rezerwacją dodatkowych noclegów, zaznacz to w
							formularzu RSVP a my to załatwimy.
						</p>
					</div>
					<div>
						<h4 className="text-sm font-semibold uppercase tracking-widest text-foreground">
							Koszty
						</h4>
						<p className="mt-2">
							Noclegi od środy do niedzieli opłacamy my. Po waszej stronie
							zostaje lot i dotarcie do Chory Sfakion.
						</p>
						<p className="mt-2">
							Jeśli ktoś planuje przylecieć wcześniej lub zostać dłużej,
							dodatkowe noclegi opłaca we własnym zakresie.
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
						title="Mapa Lefka Ori Hotel, Chora Sfakion"
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
	focusAttractionId,
	onAttractionFocused,
}: {
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

	const cards: InfoCardData[] = [
		{
			id: "attractions-loutro",
			anchorId: ATTRACTION_ANCHORS.loutroSaturdayTrip,
			image: cdnAsset("/images/loutro4.webp"),
			category: "Plaże i zatoczki",
			date: "Sobota 03.10 • Rejs 20-30 min",
			title: "Loutro",
			description:
				"Biała wioska bez samochodów. W sobotę możemy zrobić wspólną wycieczkę ze znajomym kapitanem.",
			alt: "Nadmorska miejscowość z białą zabudową i turkusową wodą",
			content: (
				<div className="space-y-4 text-sm text-muted-foreground">
					<p>
						Loutro to jedna z najbardziej klimatycznych miejscowości w regionie
						Sfakia. Brak ruchu samochodowego robi świetny, wakacyjny klimat.
					</p>
					<ul className="space-y-2 list-disc pl-5">
						<li>Najwygodniej dopłynąć łodzią z Chora Sfakion.</li>
						<li>
							W sobotę planujemy wspólną wycieczkę dla wszystkich ze znajomym
							kapitanem.
						</li>
						<li>
							Po drodze można wysiąść lub dojść do plaży Glyka Nera (Sweet Water
							Beach).
						</li>
						<li>W samej zatoce jest sporo tawern na lekki lunch.</li>
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
						Imbros to bardzo dobry wybór dla osób, które chcą zobaczyć kreteński
						wąwóz bez całodziennej wyprawy.
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
						zejścia dnem wąwozu. Sam punkt widokowy na moście jest wart dojazdu.
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
						<li>Malownicza droga dojazdowa z licznymi punktami widokowymi.</li>
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

	return (
		<div className="space-y-6">
			<div className="rounded-2xl border border-border bg-white p-4 shadow-sm space-y-4 sm:p-6">
				<h3 className="text-xl font-bold text-foreground sm:text-2xl">
					Atrakcje
				</h3>
				<p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
					Zebraliśmy 6 sprawdzonych propozycji blisko Chora Sfakion. Każda
					kartka otwiera modal z krótkim opisem i linkiem do mapy.
				</p>
			</div>
			<InfoCardGrid cards={cards} />
		</div>
	);
}

const PENDING_ANSWER_MESSAGE =
	"Kuba jeszcze się zastanawia i odpowie jak szybko może.";

const BASE_QA = [
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
			"Przyda się ważny dokument, wygodne buty, klapki, okulary przeciwsłoneczne, nakrycie głowy i strój kąpielowy.",
	},
	{
		question: "Czy planujemy wspólne aktywności poza weselem?",
		answer:
			"Tak. W zakładce Atrakcje znajdziesz nasze propozycje na wspólne wypady i spokojniejsze dni.",
	},
];

function InfoQATemplate({ invitationId }: { invitationId?: string }) {
	const submitQuestion = useMutation(api.questions.submitQuestion);
	const communityQuestions = useQuery(api.questions.listPublic, {}) as
		| QaPublicQuestion[]
		| undefined;
	const [questionDraft, setQuestionDraft] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const mergedQuestions = useMemo(() => {
		const base = BASE_QA.map((item, index) => ({
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
					: PENDING_ANSWER_MESSAGE,
			askerDisplayName: item.askerDisplayName,
			createdAt: item.createdAt,
		}));
		return [...base, ...fromGuests];
	}, [communityQuestions]);

	const handleSubmitQuestion = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const question = questionDraft.trim();
		if (!question) {
			toast({
				variant: "destructive",
				title: "Wpisz pytanie",
				description: "Treść pytania nie może być pusta.",
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
				title: "Pytanie dodane",
				description: "Dzięki! Twoje pytanie jest już widoczne w puli Q&A.",
			});
		} catch (_error) {
			toast({
				variant: "destructive",
				title: "Nie udało się dodać pytania",
				description: "Spróbuj ponownie za chwilę.",
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
					Zebraliśmy najczęstsze pytania i odpowiedzi. Nowe pytania od gości od
					razu trafiają do wspólnej puli.
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
									Pytanie od: {item.askerDisplayName ?? "Gość"} •{" "}
									{new Date(item.createdAt).toLocaleDateString("pl-PL")}
								</p>
							)}
						</div>
					))}
				</div>
			</div>

			<div className="rounded-2xl border border-border bg-white p-4 shadow-sm space-y-4 sm:p-6">
				<h3 className="text-lg font-bold text-foreground sm:text-xl">
					Masz dodatkowe pytanie?
				</h3>
				<p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
					Zadaj je poniżej, będzie widoczne dla wszystkich w tej sekcji.
				</p>
				<form className="space-y-3" onSubmit={handleSubmitQuestion}>
					<textarea
						value={questionDraft}
						onChange={(event) => setQuestionDraft(event.target.value)}
						placeholder="Twoje pytanie..."
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
							{isSubmitting ? "Wysyłanie..." : "Wyślij pytanie"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
