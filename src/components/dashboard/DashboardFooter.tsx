import { getCoupleLabel } from "@/lib/couple";
import { isDemoMode } from "@/lib/app-mode";
import { useLocale } from "@/lib/locale";

export function DashboardFooter() {
	const { locale } = useLocale();
	const demoMode = isDemoMode();
	const location =
		locale === "en"
			? demoMode
				? "Santorini, Greece"
				: "Crete, Greece"
			: demoMode
				? "Santorini, Grecja"
				: "Kreta, Grecja";

	return (
		<footer className="bg-background-light py-20 px-6">
			<div className="max-w-4xl mx-auto flex flex-col items-center gap-10 text-center">
				<div className="pt-10 border-t border-gray-200 w-full max-w-lg">
					<p className="text-xs text-gray-400 font-medium uppercase tracking-widest">
						© 2026 {getCoupleLabel()} | {location}
					</p>
				</div>
			</div>
		</footer>
	);
}
