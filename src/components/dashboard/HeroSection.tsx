import { Megaphone } from "lucide-react";

export function HeroSection() {
	return (
		<div
			className="w-full relative bg-cover bg-center h-[400px]"
			style={{
				backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.6)), url("https://lh3.googleusercontent.com/aida-public/AB6AXuDLVfJAJwBDpH13NRCRU0g1G5frlybVefjK9mkm-dYE0NGSNkDCoXuV5m_ZSfMTJxVBqcuNFzt1DsSxVlWpfXkfxQFNxN6to4jUpJ1ZPaXVcndtfLajblOAk21djI1Zqr-GbV8lyq7pjcg7vtLJQXkKDIHd7Nyzzn6B7g-B5HZmJkpfOor2isk5FqRw4LBAuq0w_fDI_TYfABixmqc8WrOAWnjkPZ8vxYTMv80g0-MkMATdF-tDN0fsIAc2Bdp9G0RMIMOgerT7jxE")`,
			}}
		>
			{/* TODO Remove this once done */}
			<button
				type="button"
				onClick={() => {
					document.cookie = "crux=; path=/; max-age=0";
					window.location.href = "/";
				}}
				className="absolute top-4 right-4 z-10 text-white/80 hover:text-white text-sm font-medium hover:bg-white/10 px-3 py-1.5 rounded-full transition-colors flex items-center gap-2"
			>
				<span>Wyloguj</span>
				<span className="i-lucide-log-out h-4 w-4" />
			</button>

			<div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
				<span className="inline-flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-sm px-4 py-1.5 text-xs font-bold text-white uppercase tracking-wider mb-4 border border-white/30">
					<Megaphone className="size-4" />
					Ważne Informacje
				</span>
				<h1 className="text-white text-4xl md:text-5xl lg:text-6xl font-black leading-tight tracking-[-0.033em] max-w-3xl mb-4">
					Nasze Greckie Wesele
				</h1>
				<p className="text-gray-200 text-base md:text-lg font-medium max-w-2xl leading-relaxed">
					Tutaj znajdziecie najnowsze aktualności, zmiany w harmonogramie oraz
					wskazówki dotyczące podróży i pobytu na Krecie.
				</p>
			</div>
		</div>
	);
}
