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

export const planTimelineDays: PlanDay[] = [
	{
		id: "2026-09-30",
		label: "Środa 30.09",
		date: "2026-09-30",
		subtitle: "Przyloty i spokojny start",
		events: [
			{
				id: "wed-flight",
				time: "20:00",
				title: "Wylot i późny przylot do Chanii",
				description:
					"W środę jest tylko jeden lot około 20:00, więc na miejscu w Chanii będziemy mniej więcej o 23:00. Do Chory Sfakion dotrzemy późno.",
				tag: "Logistyka",
				location: "Chania / Chora Sfakion",
			},
			{
				id: "wed-early-arrivals",
				time: "Wieczór",
				title: "Luźne spotkanie dla osób na miejscu",
				description:
					"Jeśli jesteście już na Krecie, spotkajmy się bez presji na spokojny wieczór i wspólne wejście w klimat wyjazdu.",
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
				time: "Do 15:00",
				title: "Czas wolny",
				description:
					"Przed popołudniowym spotkaniem mamy spokojny czas dla siebie. My będziemy się szykować, a Wy możecie wypocząć, pospacerować albo spędzić dzień tak, jak lubicie.",
				tag: "Relaks",
				location: "Według uznania",
			},
			{
				id: "thu-ceremony",
				time: "16:00",
				title: "Krótka ceremonia",
				description:
					"Spotykamy się w starym porcie lub na plaży niedaleko knajpy. Ceremonię poprowadzi Mateusz (bestman) albo urzędnik/konsul z Aten.",
				tag: "Ceremonia",
				location: "Stary port / plaża przy knajpie",
			},
			{
				id: "thu-party",
				time: "Po ceremonii",
				title: "Zdjęcia i wspólne świętowanie",
				description:
					"Po krótkiej sesji zdjęciowej przechodzimy do knajpy na biesiadowanie, toast i zabawę. Chcemy, żeby to był nasz wspólny, radosny wieczór.",
				tag: "Wesele",
				location: "Knajpa weselna",
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
				time: "Od rana",
				title: "Spokojny start dnia",
				description:
					"Startujemy na luzie, bez budzika i bez presji czasu. To dzień na odpoczynek po weselu i łapanie oddechu.",
				tag: "Relaks",
				location: "Chora Sfakion",
			},
			{
				id: "fri-afterparty",
				time: "Popołudnie",
				title: "Poprawiny na wzgórzu",
				description:
					"Jeśli będziecie mieć ochotę, idziemy do pobliskiego baru na wzgórzu na poprawiny. A jeśli ktoś woli wolniejsze tempo, pełna dowolność.",
				tag: "Integracja",
				location: "Bar na wzgórzu (opcjonalnie)",
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
					"Możemy zrobić wspólną wyprawę do Loutro i odkryć jedną z najpiękniejszych zatok. Jeśli taki plan Was kręci, chętnie organizujemy to razem.",
				tag: "Atrakcje",
				location: "Loutro (opcjonalnie)",
				attractionAnchorId: ATTRACTION_ANCHORS.loutroSaturdayTrip,
				attractionCtaLabel: "Zobacz atrakcje i plan wycieczki do Loutro",
			},
			{
				id: "sat-free-time",
				time: "Alternatywnie",
				title: "Plaża i lokalne atrakcje",
				description:
					"Jeśli wolicie spokojniejszy dzień, możemy zostać na miejscu i postawić na plażowanie oraz lokalne atrakcje w okolicy. Decydujemy wspólnie.",
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
				time: "Wcześnie rano",
				title: "Wspólne śniadanie i pożegnanie",
				description:
					"W niedzielę jest tylko jeden lot około 10:00, więc spotykamy się na szybkie śniadanie i spokojnie żegnamy przed drogą do domów.",
				tag: "Pożegnanie",
				location: "Domki / okolica",
			},
			{
				id: "sun-flight",
				time: "Około 10:00",
				title: "Wylot",
				description:
					"Dziękujemy, że tworzycie ten wyjazd razem z nami. Wracamy z pięknymi wspomnieniami i ogromną wdzięcznością.",
				tag: "Logistyka",
				location: "Lotnisko Chania",
			},
		],
	},
];
