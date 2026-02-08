import { Calendar } from "lucide-react";

interface PostCardProps {
	image: string;
	category: string;
	date: string;
	title: string;
	description: string;
	alt: string;
}

export function PostCard({
	image,
	category,
	date,
	title,
	description,
	alt,
}: PostCardProps) {
	return (
		<article className="group flex flex-col bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-border">
			<div className="relative h-56 overflow-hidden">
				<div
					className="absolute inset-0 bg-cover bg-center transform group-hover:scale-105 transition-transform duration-700"
					role="img"
					aria-label={alt}
					style={{ backgroundImage: `url("${image}")` }}
				/>
				<div className="absolute top-4 left-4 bg-white/90 dark:bg-black/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-foreground">
					{category}
				</div>
			</div>
			<div className="p-6 flex flex-col flex-1">
				<div className="flex items-center gap-2 mb-3 text-muted-foreground text-sm">
					<Calendar className="size-5" />
					<span>{date}</span>
				</div>
				<h3 className="text-xl font-bold text-card-foreground mb-3 leading-snug group-hover:text-primary transition-colors">
					{title}
				</h3>
				<p className="text-muted-foreground text-sm leading-relaxed mb-4 line-clamp-3">
					{description}
				</p>
				<a
					href="#"
					className="mt-auto inline-flex items-center text-primary font-bold text-sm hover:underline"
				>
					{category === "Atrakcje"
						? "Sprawdź mapę"
						: category === "Harmonogram"
							? "Zobacz plan"
							: "Zobacz inspiracje"}
				</a>
			</div>
		</article>
	);
}

export function PostGrid() {
	const posts = [
		{
			image:
				"https://lh3.googleusercontent.com/aida-public/AB6AXuAKgdKxhvyatdpJUGr_3HxPo4FhUMksxWr0-vk8nfwF6AEU1Q_ZOXAsVwYDpQ9adnksvAkuB3J8fx6gP6BSk2ErX7pBQaMurqrswv0jwRq5NOduxi_D6PfWhDUW8MsfhFFZQYaVaa3sGOsZh-Pc_EkIz370ILmRREOM0UYs2bnRungE-XDVV6kyAQKLkObCoSjJXdTUQ_qQgNsxVa7YsR7fR0JStS0ZsVs6vr1uwxOpx9U2VcPEoRbKXfse0sZF9hwsryOv6xLOVWs",
			category: "Dress Code",
			date: "10 Czerwca 2024",
			title: 'Styl "Greek Chic" - co to właściwie znaczy?',
			description:
				"Przygotowaliśmy dla Was krótki przewodnik z inspiracjami. Biel, beż, błękit i przewiewne materiały to klucz do sukcesu w greckim słońcu.",
			alt: "Elegant beige dress and suit details on a hanger",
			id: "post1",
		},
		{
			image:
				"https://lh3.googleusercontent.com/aida-public/AB6AXuC-WGIqbU1Wv40MHdO3Udg2IqwOucPjM2fZY-gOj1-RsPcTRALxW2fhvHVlWAwIwJ0WaII95uQ-gSckaB_6gEO8xuDSKg3hhwQdNZTOarsMRSHcKRJQ1SxBhHXZwoG6Ide-1HokKeiVW0HE83e_zphWJnVzW8eYCwGz6-Vc0UmHJQVdS0L61y_NwS2QffQYzFgJ_xh7ZUMjZ-dceUtcnVWdfu-nqpg-qOwAhWHLjIwf6j4s5oZXeCByR9v2uRFQKAgCi7ND_QV8r8Q",
			category: "Atrakcje",
			date: "05 Czerwca 2024",
			title: "Gdzie zjeść najlepsze Souvlaki w okolicy?",
			description:
				"Nie samą ceremonią człowiek żyje! Oto lista naszych ulubionych tawern, które musicie odwiedzić przed lub po weselu.",
			alt: "Plate of greek salad with feta cheese and olives",
			id: "post2",
		},
		{
			image:
				"https://lh3.googleusercontent.com/aida-public/AB6AXuAqSR-4bs-paw_8ISj0i22ccBOASrjQrdrTOBiAnNV980t-Nmr6YT0wwfHrkngLrGxpcjodUoSnBP6vaofREJx1vS-fNd22VosY2jNc9XXHHOBs1-XnCOBlPAJsaWHoPG0XGsgCgUcrE1duSC2EEl-ik8eG3uXjY83VK7lo2xeQ8WF61Bn5S5BTbjYxyNxoLpQOEIJOeJSzCquT5mR2xh37XCI26zuRqSnGbeUXfWreCenbYBNWTqlV1AXBUlts6qAUebzPz-9s5T4",
			category: "Harmonogram",
			date: "28 Maja 2024",
			title: "Plan Dnia: Od ceremonii do świtu",
			description:
				"Dokładna rozpiska godzinowa naszego wielkiego dnia. Sprawdźcie, o której zaczynamy koktajl powitalny!",
			alt: "Beautiful sunset over the Aegean sea",
			id: "post3",
		},
		{
			image:
				"https://lh3.googleusercontent.com/aida-public/AB6AXuCgrZzrMTgqmyoxagQ3qQfQj2SHRIJ-u9WKMr5BeIe0KisovH5VLhCmZJDLOZRuE6cSXDTa4T0B7N1z8BQJSn48631QcOcPdvFyIAbx9TAdkwDRtLjYo-JwcOfohYiDKqlJ1cRvwHwiGTVrwhlH_6-6kVrzX-O9Pf-ZqXhq51bpA8VFIb-Kz8a_rtLu9_-ciA7G-R_463JkBYR43bouRt57ANceHrRq4NG2eBYdVVK_vPIiXCYPsQxmR5qlE4SIAt5RzM3H0WLcXHk",
			category: "Q&A",
			date: "20 Maja 2024",
			title: "Prezenty ślubne: Wasza obecność jest najważniejsza",
			description:
				"Wiele osób pytało o listę prezentów. Odpowiadamy na najczęstsze pytania dotyczące podarunków.",
			alt: "Wedding gift boxes wrapped elegantly",
			id: "post4",
		},
	];

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
			{posts.map((post) => (
				<PostCard key={post.id} {...post} />
			))}
		</div>
	);
}
