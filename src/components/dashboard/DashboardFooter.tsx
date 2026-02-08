import { useLocation } from "@tanstack/react-router";

export function DashboardFooter() {
	const location = useLocation();
	const isLandingPage = location.pathname === "/";

	return (
		<footer className="bg-background-light py-20 px-6">
			<div className="max-w-4xl mx-auto flex flex-col items-center gap-10 text-center">
				<div className="pt-10 border-t border-gray-200 w-full max-w-lg">
					<p className="text-xs text-gray-400 font-medium uppercase tracking-widest">
						© 2026 Kamila & Kuba | Kreta, Grecja
					</p>
				</div>
			</div>
		</footer>
	);
}
