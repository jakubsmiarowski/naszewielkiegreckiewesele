export type PlanEvent = {
	id: string;
	time: string;
	title: string;
	description: string;
	tag?: string;
	location?: string;
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
		label: "Środa 30.09.2026",
		date: "2026-09-30",
		subtitle: "Przyloty i integracja",
		events: [
			{
				id: "wed-checkin",
				time: "12:00–16:00",
				title: "Przyloty i check-in",
				description:
					"Luźne zameldowanie w hotelu, odbiór pakietów powitalnych i czas na odpoczynek po podróży.",
				tag: "Logistyka",
				location: "Hotel Lefka Ori",
			},
			{
				id: "wed-meetup",
				time: "18:00",
				title: "Spotkanie powitalne",
				description:
					"Kawa, lemoniada i szybkie przywitanie się ze wszystkimi przed wieczorem.",
				tag: "Integracja",
				location: "Taras hotelowy",
			},
			{
				id: "wed-dinner",
				time: "20:00",
				title: "Kolacja w tawernie",
				description:
					"Nieformalne rozpoczęcie wspólnego pobytu w greckim klimacie.",
				tag: "Kolacja",
				location: "Tawerna przy plaży",
			},
		],
	},
	{
		id: "2026-10-01",
		label: "Czwartek 01.10.2026",
		date: "2026-10-01",
		subtitle: "Wspólne odkrywanie wyspy",
		events: [
			{
				id: "thu-breakfast",
				time: "09:30",
				title: "Wspólne śniadanie",
				description:
					"Start dnia na spokojnie. Poznajmy się lepiej przed atrakcjami.",
				tag: "Relaks",
				location: "Restauracja hotelowa",
			},
			{
				id: "thu-city",
				time: "12:00",
				title: "Spacer po Chanii",
				description:
					"Zwiedzanie starego portu, wąskich uliczek i lokalnych kawiarenek.",
				tag: "Atrakcje",
				location: "Chania",
			},
			{
				id: "thu-sunset",
				time: "19:30",
				title: "Zachód słońca i przekąski",
				description:
					"Lekka kolacja i chwila na wspólne zdjęcia w złotym świetle.",
				tag: "Integracja",
				location: "Punkt widokowy",
			},
		],
	},
	{
		id: "2026-10-02",
		label: "Piątek 02.10.2026",
		date: "2026-10-02",
		subtitle: "Dzień wesela",
		events: [
			{
				id: "fri-prep",
				time: "10:00–14:00",
				title: "Relaks i przygotowania",
				description:
					"Czas na makijaż, fryzurę i spokojne przygotowania do ceremonii.",
				tag: "Przygotowania",
				location: "Pokoje hotelowe",
			},
			{
				id: "fri-ceremony",
				time: "15:30",
				title: "Ceremonia",
				description:
					"Oficjalny moment, na który wszyscy czekaliśmy. Do zobaczenia na miejscu!",
				tag: "Ceremonia",
				location: "Ogród przy willi",
			},
			{
				id: "fri-photos",
				time: "17:00",
				title: "Sesja zdjęciowa i toast",
				description:
					"Krótkie zdjęcia z bliskimi i pierwszy toast za nowy rozdział.",
				tag: "Zdjęcia",
				location: "Taras widokowy",
			},
			{
				id: "fri-party",
				time: "19:30",
				title: "Wesele i afterparty",
				description:
					"Kolacja, tańce i niespodzianki. Zostajemy do ostatniego utworu!",
				tag: "Wesele",
				location: "Sala weselna",
			},
		],
	},
	{
		id: "2026-10-03",
		label: "Sobota 03.10.2026",
		date: "2026-10-03",
		subtitle: "Lekki dzień regeneracji",
		events: [
			{
				id: "sat-beach",
				time: "11:00",
				title: "Plażowanie i regeneracja",
				description:
					"Czas na leniwy poranek, kąpiele i chwilę dla siebie po weselu.",
				tag: "Relaks",
				location: "Plaża miejska",
			},
			{
				id: "sat-cruise",
				time: "14:00",
				title: "Rejs po zatoce",
				description:
					"Opcjonalna wycieczka łodzią z przystankiem na kąpiel w krystalicznej wodzie.",
				tag: "Atrakcje",
				location: "Marina",
			},
			{
				id: "sat-evening",
				time: "20:00",
				title: "Wieczór chill & muzyka",
				description:
					"Luźne spotkanie przy muzyce, deserach i świetnych wspomnieniach.",
				tag: "Integracja",
				location: "Lounge hotelowy",
			},
		],
	},
	{
		id: "2026-10-04",
		label: "Niedziela 04.10.2026",
		date: "2026-10-04",
		subtitle: "Pożegnania",
		events: [
			{
				id: "sun-brunch",
				time: "09:30",
				title: "Brunch po weselu",
				description:
					"Ostatnie wspólne śniadanie i czas na podsumowanie wyjazdu.",
				tag: "Brunch",
				location: "Restauracja hotelowa",
			},
			{
				id: "sun-farewell",
				time: "12:00",
				title: "Pożegnania i zdjęcia",
				description:
					"Krótka chwila na wspólne zdjęcia przed wyjazdami.",
				tag: "Integracja",
				location: "Lobby",
			},
			{
				id: "sun-transfer",
				time: "14:00–18:00",
				title: "Transfery na lotnisko",
				description:
					"Wyjazdy zgodnie z godzinami lotów. Pomagamy przy organizacji transportu.",
				tag: "Logistyka",
				location: "Parking hotelowy",
			},
		],
	},
];
