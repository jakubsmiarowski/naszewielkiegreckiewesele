import { ArrowRight, PlaneTakeoff } from "lucide-react";

export function FeaturedPost() {
	return (
		<div className="group cursor-pointer flex flex-col md:flex-row overflow-hidden rounded-2xl bg-card shadow-sm hover:shadow-lg transition-all duration-300 border border-border">
			<div
				className="md:w-2/5 aspect-video md:aspect-auto bg-cover bg-center relative overflow-hidden"
				style={{
					backgroundImage: `url("https://lh3.googleusercontent.com/aida-public/AB6AXuBExwuy1ARLI8PUXL2udnSgt4PNqZIdcQM_tZ7nqT0tg_CbI8eheBRSuev0qsErKTJ5WXp_kC7DKfV77Qjzmc5bR172cEsSlL0mbgyhIuotaH46ALS6g-b39FBoRsdaISqyqd3QL-45xPPUgvAvqywtPNaL90zTs44YQVJPa2FXMSGhUI9VJPLfzEqTmeh1JoBO8ZpfCLHy1D9VuY4n_9EI-FFt5CSJDxPdRlcDiDBpzhqPyvkVaxyjfwcwCjnwPXaPnze6_JfpRVo")`,
				}}
			>
				<div className="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
					Pilne
				</div>
			</div>
			<div className="flex-1 p-6 md:p-8 flex flex-col justify-center">
				<div className="flex items-center gap-2 text-primary mb-3">
					<PlaneTakeoff className="size-5" />
					<span className="text-sm font-bold uppercase tracking-wide">
						Transport
					</span>
				</div>
				<h3 className="text-2xl font-bold text-card-foreground mb-3 group-hover:text-primary transition-colors">
					Ważna zmiana dotycząca transferów z lotniska
				</h3>
				<p className="text-muted-foreground mb-6 line-clamp-2">
					Ze względu na zmianę rozkładu lotów, przesunęliśmy godziny odjazdów
					naszych busów. Prosimy o sprawdzenie nowych godzin i potwierdzenie
					przybycia.
				</p>
				<div className="flex items-center justify-between mt-auto">
					<span className="text-xs font-medium text-muted-foreground">
						15 Czerwca 2024
					</span>
					<span className="flex items-center gap-1 text-sm font-bold text-primary group-hover:translate-x-1 transition-transform">
						Czytaj więcej
						<ArrowRight className="size-5" />
					</span>
				</div>
			</div>
		</div>
	);
}
