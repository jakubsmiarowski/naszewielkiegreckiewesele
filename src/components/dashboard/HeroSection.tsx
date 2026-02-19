import { Megaphone } from "lucide-react";
import { isDemoMode } from "@/lib/app-mode";
import { useLocale } from "@/lib/locale";

export function HeroSection() {
	const { locale } = useLocale();
	const demoMode = isDemoMode();
	const copy =
		locale === "en"
			? {
					badge: "Important Updates",
					title: "Our Greek Wedding",
					description:
						demoMode
							? "Here you can find sample updates, schedule changes, and travel tips for your stay in Santorini."
							: "Here you can find the latest updates, schedule changes, and travel tips for your stay in Crete.",
				}
			: {
					badge: "Ważne Informacje",
					title: "Nasze Greckie Wesele",
					description:
						demoMode
							? "Tutaj znajdziecie przykładowe aktualności, zmiany w harmonogramie oraz wskazówki dotyczące pobytu na Santorini."
							: "Tutaj znajdziecie najnowsze aktualności, zmiany w harmonogramie oraz wskazówki dotyczące podróży i pobytu na Krecie.",
				};

	return (
		<div
			className="w-full relative bg-cover bg-center h-[400px]"
			style={{
				backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.6)), url("https://lh3.googleusercontent.com/aida-public/AB6AXuDLVfJAJwBDpH13NRCRU0g1G5frlybVefjK9mkm-dYE0NGSNkDCoXuV5m_ZSfMTJxVBqcuNFzt1DsSxVlWpfXkfxQFNxN6to4jUpJ1ZPaXVcndtfLajblOAk21djI1Zqr-GbV8lyq7pjcg7vtLJQXkKDIHd7Nyzzn6B7g-B5HZmJkpfOor2isk5FqRw4LBAuq0w_fDI_TYfABixmqc8WrOAWnjkPZ8vxYTMv80g0-MkMATdF-tDN0fsIAc2Bdp9G0RMIMOgerT7jxE")`,
			}}
		>
			<div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
				<span className="inline-flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-sm px-4 py-1.5 text-xs font-bold text-white uppercase tracking-wider mb-4 border border-white/30">
					<Megaphone className="size-4" />
					{copy.badge}
				</span>
				<h1 className="text-white text-4xl md:text-5xl lg:text-6xl font-black leading-tight tracking-[-0.033em] max-w-3xl mb-4">
					{copy.title}
				</h1>
				<p className="text-gray-200 text-base md:text-lg font-medium max-w-2xl leading-relaxed">
					{copy.description}
				</p>
			</div>
		</div>
	);
}
