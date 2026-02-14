import {
	ATTRACTION_ANCHORS,
	type AttractionAnchorId,
} from "@/components/dashboard/types";
import type { AppLocale } from "@/lib/locale";

export type PlanEvent = {
	id: string;
	time: string;
	title: string;
	description: string;
	tag?: string;
	location?: string;
	attractionAnchorId?: AttractionAnchorId;
	attractionCtaLabel?: string;
};

export type PlanDay = {
	id: string;
	label: string;
	date: string;
	subtitle?: string;
	events: PlanEvent[];
};

export type GreekPhraseCard = {
	id: string;
	sourceText: string;
	greek: string;
	isApproximate?: boolean;
};

const planTimelineDaysByLocale: Record<AppLocale, PlanDay[]> = {
	pl: [
		{
			id: "2026-09-30",
			label: "Środa 30.09",
			date: "2026-09-30",
			subtitle: "Przyloty i spokojny start",
			events: [
				{
					id: "wed-flight",
					time: "17:30",
					title: "Wylot i późny przylot do Chanii",
					description:
						"W środę jest tylko jeden lot o 17:30, więc na miejscu będziecie około 21:25. Do Chory Sfakion dotrzecie późnym wieczorem.",
					tag: "Logistyka",
					location: "Chania / Chora Sfakion",
				},
				{
					id: "wed-early-arrivals",
					time: "Wieczór",
					title: "Luźne spotkanie dla osób na miejscu",
					description:
						"Jeśli jesteście już na Krecie, spotkajmy się i spędźmy wspólnie czas.",
					tag: "Integracja",
					location: "Według uznania",
				},
			],
		},
		{
			id: "2026-10-01",
			label: "Czwartek 01.10",
			date: "2026-10-01",
			subtitle: "Dzień wesela",
			events: [
				{
					id: "thu-free-time",
					time: "Do 14:00",
					title: "Czas wolny",
					description:
						"Przed popołudniowym spotkaniem macie czas na relaks, zwiedzanie albo plażę. My zajmiemy się przygotowaniami.",
					tag: "Relaks",
					location: "Według uznania",
				},
				{
					id: "thu-ceremony",
					time: "15:00",
					title: "Ślub",
					description:
						"Spotykamy się w starym porcie lub na plaży niedaleko restauracji. Ceremonię poprowadzi Ojciec Mateusz albo urzędnik.",
					tag: "Ceremonia",
					location: "Stary port / plaża",
				},
				{
					id: "thu-party",
					time: "Po uroczystości",
					title: "Wesele",
					description:
						"Po ceremonii zapraszamy na wspólne biesiadowanie, tańce i świętowanie do nocy.",
					tag: "Przyjęcie",
					location: "Restauracja Lefka Ori",
				},
			],
		},
		{
			id: "2026-10-02",
			label: "Piątek 02.10",
			date: "2026-10-02",
			subtitle: "Poprawiny bez pośpiechu",
			events: [
				{
					id: "fri-slow-start",
					time: "Rano",
					title: "Spokojny start dnia",
					description: "Bez budzika, z mimosą w ręku i uśmiechem na twarzy.",
					tag: "Relaks",
					location: "Według uznania",
				},
				{
					id: "fri-afterparty",
					time: "Popołudnie",
					title: "Poprawiny",
					description:
						"Jeśli będziecie mieć ochotę, idziemy do pobliskiego baru z widokiem na morze. Kto woli, może postawić na spokojny relaks.",
					tag: "Integracja",
					location: "Bar",
				},
			],
		},
		{
			id: "2026-10-03",
			label: "Sobota 03.10",
			date: "2026-10-03",
			subtitle: "Wycieczka albo czas wolny",
			events: [
				{
					id: "sat-loutro",
					time: "W ciągu dnia",
					title: "Opcjonalna wycieczka do Loutro",
					description:
						"Możemy zrobić wspólną wyprawę do malowniczego miasteczka i odkryć jedną z najpiękniejszych zatok. Jeśli macie ochotę, zorganizujemy to razem.",
					tag: "Atrakcje",
					location: "Loutro (opcjonalnie)",
					attractionAnchorId: ATTRACTION_ANCHORS.loutroSaturdayTrip,
					attractionCtaLabel: "Zobacz atrakcje i plan wycieczki do Loutro",
				},
				{
					id: "sat-free-time",
					time: "Alternatywnie",
					title: "Plaża i atrakcje",
					description:
						"Jeśli wolicie spokojniejszy dzień, możecie zostać na miejscu i postawić na plażowanie oraz zwiedzanie wyspy.",
					tag: "Relaks",
					location: "Okolica Chory Sfakion",
				},
			],
		},
		{
			id: "2026-10-04",
			label: "Niedziela 04.10",
			date: "2026-10-04",
			subtitle: "Wczesny powrót",
			events: [
				{
					id: "sun-breakfast",
					time: "Rano",
					title: "Pożegnanie",
					description:
						"W niedzielę mamy tylko poranny lot, więc spotykamy się jeszcze na krótkie pożegnanie.",
					tag: "Pożegnanie",
					location: "Chora Sfakion",
				},
				{
					id: "sun-flight",
					time: "10:10",
					title: "Wylot",
					description: "Dziękujemy za wspólnie spędzony czas!",
					tag: "Logistyka",
					location: "Lotnisko Chania",
				},
			],
		},
	],
	en: [
		{
			id: "2026-09-30",
			label: "Wednesday 09/30",
			date: "2026-09-30",
			subtitle: "Arrivals and an easy start",
			events: [
				{
					id: "wed-flight",
					time: "5:30 PM",
					title: "Departure and late arrival in Chania",
					description:
						"On Wednesday there is only one flight at 5:30 PM, so you should land around 9:25 PM. You will reach Chora Sfakion late in the evening.",
					tag: "Logistics",
					location: "Chania / Chora Sfakion",
				},
				{
					id: "wed-early-arrivals",
					time: "Evening",
					title: "Casual meetup for early arrivals",
					description:
						"If you are already in Crete, let’s meet and spend some relaxed time together.",
					tag: "Social",
					location: "As preferred",
				},
			],
		},
		{
			id: "2026-10-01",
			label: "Thursday 10/01",
			date: "2026-10-01",
			subtitle: "Wedding day",
			events: [
				{
					id: "thu-free-time",
					time: "Until 2:00 PM",
					title: "Free time",
					description:
						"Before we meet in the afternoon, you have time to relax, explore, or enjoy the beach while we handle preparations.",
					tag: "Relax",
					location: "As preferred",
				},
				{
					id: "thu-ceremony",
					time: "3:00 PM",
					title: "Ceremony",
					description:
						"We will gather at the old harbor or on the beach near the restaurant. The ceremony will be led by Father Mateusz or an official.",
					tag: "Ceremony",
					location: "Old harbor / beach",
				},
				{
					id: "thu-party",
					time: "After the ceremony",
					title: "Wedding reception",
					description:
						"After the ceremony, join us for dinner, dancing, and celebration into the night.",
					tag: "Reception",
					location: "Lefka Ori Restaurant",
				},
			],
		},
		{
			id: "2026-10-02",
			label: "Friday 10/02",
			date: "2026-10-02",
			subtitle: "Afterparty, no rush",
			events: [
				{
					id: "fri-slow-start",
					time: "Morning",
					title: "Slow start",
					description: "No alarm clock, just a mimosa and a smile.",
					tag: "Relax",
					location: "As preferred",
				},
				{
					id: "fri-afterparty",
					time: "Afternoon",
					title: "Afterparty",
					description:
						"If you are up for it, we can head to a nearby seaside bar. If not, enjoy a slower pace your own way.",
					tag: "Social",
					location: "Bar",
				},
			],
		},
		{
			id: "2026-10-03",
			label: "Saturday 10/03",
			date: "2026-10-03",
			subtitle: "Trip day or free time",
			events: [
				{
					id: "sat-loutro",
					time: "Daytime",
					title: "Optional trip to Loutro",
					description:
						"We can organize a shared trip to this picturesque village and one of the most beautiful bays in the area.",
					tag: "Attractions",
					location: "Loutro (optional)",
					attractionAnchorId: ATTRACTION_ANCHORS.loutroSaturdayTrip,
					attractionCtaLabel: "View attractions and Loutro trip plan",
				},
				{
					id: "sat-free-time",
					time: "Alternative",
					title: "Beach and local activities",
					description:
						"If you prefer a calmer day, stay nearby for beach time and island exploring.",
					tag: "Relax",
					location: "Around Chora Sfakion",
				},
			],
		},
		{
			id: "2026-10-04",
			label: "Sunday 10/04",
			date: "2026-10-04",
			subtitle: "Early return",
			events: [
				{
					id: "sun-breakfast",
					time: "Morning",
					title: "Farewell",
					description:
						"Sunday has only an early flight, so we will say goodbye before heading out.",
					tag: "Farewell",
					location: "Chora Sfakion",
				},
				{
					id: "sun-flight",
					time: "10:10 AM",
					title: "Departure",
					description: "Thank you for celebrating with us!",
					tag: "Logistics",
					location: "Chania Airport",
				},
			],
		},
	],
};

const greekPhraseCardsByLocale: Record<AppLocale, GreekPhraseCard[]> = {
	pl: [
		{
			id: "good-morning",
			sourceText: "Dzień dobry",
			greek: "Καλημέρα (Kaliméra)",
		},
		{
			id: "good-evening",
			sourceText: "Dobry wieczór",
			greek: "Καλησπέρα (Kalispéra)",
		},
		{
			id: "thank-you-very-much",
			sourceText: "Bardzo dziękuję",
			greek: "Ευχαριστώ πολύ (Efcharistó polý)",
		},
		{
			id: "cheers",
			sourceText: "Na zdrowie!",
			greek: "Στην υγειά μας! (Stin ygeiá mas!)",
		},
		{
			id: "yes-no",
			sourceText: "Tak / Nie",
			greek: "Ναι / Όχι (Ne / Ochi)",
		},
		{
			id: "please",
			sourceText: "Proszę",
			greek: "Παρακαλώ (Parakaló)",
		},
		{
			id: "excuse-me",
			sourceText: "Przepraszam",
			greek: "Συγγνώμη (Syngnómi)",
		},
		{
			id: "where-is-beach",
			sourceText: "Gdzie jest plaża?",
			greek: "Πού είναι η παραλία; (Pú íne i paralía?)",
			isApproximate: true,
		},
	],
	en: [
		{
			id: "good-morning",
			sourceText: "Good morning",
			greek: "Καλημέρα (Kaliméra)",
		},
		{
			id: "good-evening",
			sourceText: "Good evening",
			greek: "Καλησπέρα (Kalispéra)",
		},
		{
			id: "thank-you-very-much",
			sourceText: "Thank you very much",
			greek: "Ευχαριστώ πολύ (Efcharistó polý)",
		},
		{
			id: "cheers",
			sourceText: "Cheers",
			greek: "Στην υγειά μας! (Stin ygeiá mas!)",
		},
		{
			id: "yes-no",
			sourceText: "Yes / No",
			greek: "Ναι / Όχι (Ne / Ochi)",
		},
		{
			id: "please",
			sourceText: "Please",
			greek: "Παρακαλώ (Parakaló)",
		},
		{
			id: "excuse-me",
			sourceText: "Excuse me",
			greek: "Συγγνώμη (Syngnómi)",
		},
		{
			id: "where-is-beach",
			sourceText: "Where is the beach?",
			greek: "Πού είναι η παραλία; (Pú íne i paralía?)",
			isApproximate: true,
		},
	],
};

export function getPlanTimelineDays(locale: AppLocale): PlanDay[] {
	return planTimelineDaysByLocale[locale];
}

export function getGreekPhraseCards(locale: AppLocale): GreekPhraseCard[] {
	return greekPhraseCardsByLocale[locale];
}
