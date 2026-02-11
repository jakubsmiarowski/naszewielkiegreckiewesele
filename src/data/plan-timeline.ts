import {
	ATTRACTION_ANCHORS,
	type AttractionAnchorId,
} from "@/components/dashboard/types";

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
	polish: string;
	greek: string;
	isApproximate?: boolean;
};

export const planTimelineDays: PlanDay[] = [
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
					"W środę jest tylko jeden lot o 17:30, więc na miejscu będziecie o 21:25. Do Chory Sfakion dotrzecie późno.",
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
					"Zanim spotkamy się po południu, macie moment oddechu. My zajmiemy się przygotowaniami, a Wam zostawiamy czas na relaks, zwiedzanie lub leniwe plażowanie.",
				tag: "Relaks",
				location: "Według uznania",
			},
			{
				id: "thu-ceremony",
				time: "15:00",
				title: "Ślub",
				description:
					"Spotykamy się w starym porcie lub na plaży niedaleko restauracji. Ceremonię poprowadzi Ojciec Mateusz albo urzędnik.",
				// "Spotykamy się w starym porcie lub na plaży niedaleko knajpy. Ceremonię poprowadzi Mateusz (bestman) albo urzędnik/konsul z Aten.",
				tag: "Ceremonia",
				location: "Stary port / plaża",
			},
			{
				id: "thu-party",
				time: "Po uroczystości",
				title: "Wesele",
				description:
					// https://www.youtube.com/watch?v=MFKqiFG6HVs&list=PLrrQclmFn_7cfbELsVdc1F5SoKdNWCIWf&index=3
					// "Przechodzimy do restauracji na biesiadowanie, toast i zabawę. Chcemy, żeby to był nasz wspólny, radosny wieczór.",
					"Zapraszamy dalej na wspólne biesiadowanie, tańce i śpiewy — Kawałek tekstu z mamma mia",
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
				description: "Bez budzika z mimoską w ręku i uśmiechem na twarzy.",
				tag: "Relaks",
				location: "Według uznania",
			},
			{
				id: "fri-afterparty",
				time: "Popołudnie",
				title: "Poprawiny",
				description:
					"Jeśli będziecie mieć ochotę, idziemy do pobliskiego baru z widokiem na morze. A jeśli ktoś woli wolniejsze tempo, może wybrać relaks po swojemu.",
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
					"Możemy zrobić wspólną wyprawę do malowniczego miasteczka i odkryć jedną z najpiękniejszych zatok. Jeśli taki plan Wam pasuje, chętnie zorganizujemy to razem.",
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
					"Jeśli wolicie spokojniejszy dzień, możemy zostać na miejscu i postawić na plażowanie oraz zwiedzanie wyspy.",
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
				title: "Powrót do Poldonu",
				description:
					"W niedzielę jest tylko wczesny lot, więc spotykamy się na pożegnanie przed dalszą drogą.",
				tag: "Pożegnanie",
				location: "Chora Sfakion",
			},
			{
				id: "sun-flight",
				time: "10:10",
				title: "Wylot",
				description: "Dziękujemy, za wspólnie spędzony czas!",
				tag: "Logistyka",
				location: "Lotnisko Chania",
			},
		],
	},
];

export const greekPhraseCards: GreekPhraseCard[] = [
	{
		id: "good-morning",
		polish: "Dzień dobry",
		greek: "Καλημέρα (Kaliméra)",
	},
	{
		id: "dont-ask",
		polish: "Nie pytaj, bo kociej mordy dostaniesz.",
		greek: "Μη ρωτάς, θα έχουμε μπελάδες. (Mi rotás, tha échoume beládes.)",
		isApproximate: true,
	},
	{
		id: "good-evening",
		polish: "Dobry wieczór",
		greek: "Καλησπέρα (Kalispéra)",
	},
	{
		id: "boar-forest",
		polish: "Pytasz dzika, czy sra w lesie?",
		greek:
			"Ρωτάς αν ο ήλιος βγαίνει κάθε μέρα; (Rotás an o ílios vgaínei káthe méra;)",
		isApproximate: true,
	},
	{
		id: "thank-you-very-much",
		polish: "Bardzo dziękuję",
		greek: "Ευχαριστώ πολύ (Efcharistó polý)",
	},
	{
		id: "dont-care",
		polish: "Mam cię w dupie.",
		greek: "Σε έχω γραμμένο. (Se écho gramméno.)",
		isApproximate: true,
	},
	{
		id: "cheers",
		polish: "Na zdrowie!",
		greek: "Στην υγειά μας! (Stin ygeiá mas!)",
	},
	{
		id: "small-kebab",
		polish: "Poproszę małego kebaba.",
		greek: "Ένα μικρό κεμπάπ, παρακαλώ. (Éna mikró kebáp, parakaló.)",
	},
];
