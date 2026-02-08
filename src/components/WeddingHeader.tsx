import { Link } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";

export function WeddingHeader() {
	const { data: session } = authClient.useSession();

	return (
		<header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200 transition-all duration-300">
			<div className="max-w-[1280px] mx-auto">
				<div className="flex items-center justify-between px-6 lg:px-10 py-4">
					{/* Logo */}
					<Link
						to="/"
						className="flex items-center gap-3 text-[var(--color-primary)] cursor-pointer hover:opacity-80 transition-opacity"
					>
						<span className="text-3xl">❤️</span>
						<h2 className="text-xl font-bold tracking-tight">K & K</h2>
					</Link>

					{/* Desktop Menu */}
					<nav className="hidden md:flex items-center gap-8">
						<Link
							to="/"
							className="text-sm font-medium hover:text-[var(--color-primary)] transition-colors"
						>
							Strona Główna
						</Link>
						{session?.user && (
							<>
								<Link
									to="/dashboard"
									className="text-sm font-medium hover:text-[var(--color-primary)] transition-colors"
								>
									Plan
								</Link>
								<Link
									to="/rsvp"
									className="text-sm font-medium hover:text-[var(--color-primary)] transition-colors"
								>
									RSVP
								</Link>
								<Link
									to="/admin"
									className="text-sm font-medium hover:text-[var(--color-primary)] transition-colors"
								>
									Admin
								</Link>
							</>
						)}
					</nav>

					{/* Actions */}
					<div className="flex items-center gap-3">
						{session?.user ? (
							<button
								type="button"
								onClick={() => authClient.signOut()}
								className="h-10 flex items-center justify-center rounded-lg bg-gray-100 px-4 text-sm font-bold text-gray-900 hover:bg-gray-200 transition-colors"
							>
								Wyloguj
							</button>
						) : (
							<Link
								to="/rsvp"
								className="h-10 flex items-center justify-center rounded-lg bg-[var(--color-primary)] px-6 text-sm font-bold text-white shadow-lg shadow-blue-500/30 hover:bg-blue-700 hover:shadow-blue-500/50 transition-all hover:-translate-y-0.5"
							>
								RSVP
							</Link>
						)}
					</div>
				</div>
			</div>
		</header>
	);
}
