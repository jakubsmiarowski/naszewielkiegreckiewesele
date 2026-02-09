import {
	createFileRoute,
	useLocation,
	useNavigate,
} from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { DashboardFooter } from "@/components/dashboard/DashboardFooter";
import { isAdminEmail } from "@/lib/admin";
import { authClient, signInWithGoogle } from "@/lib/auth-client";
import { useInvitationSession } from "@/lib/invitation-session";

export const Route = createFileRoute("/")({ component: LandingPage });

function LandingPage() {
	const navigate = useNavigate();
	const prefersReducedMotion = useReducedMotion();
	const { invitationId, isLoading: isSessionLoading } = useInvitationSession();
	const { data: adminSession, isPending: isAdminPending } =
		authClient.useSession();
	const isAdmin = isAdminEmail(adminSession?.user?.email);

	const [showPinForm, setShowPinForm] = useState(false);
	const [pinCode, setPinCode] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const location = useLocation();
	const searchError = useMemo(() => {
		const params = new URLSearchParams(location.search);
		return params.get("error");
	}, [location.search]);

	const resolvedError = error ?? (searchError ? "Nieprawidłowy kod." : null);

	useEffect(() => {
		if (searchError) {
			setShowPinForm(true);
		}
	}, [searchError]);

	useEffect(() => {
		if (!isSessionLoading && invitationId) {
			navigate({ to: "/dashboard" });
		}
	}, [invitationId, isSessionLoading, navigate]);

	useEffect(() => {
		if (!isAdminPending && isAdmin) {
			navigate({ to: "/dashboard" });
		}
	}, [isAdmin, isAdminPending, navigate]);

	const handleGoogleLogin = async () => {
		try {
			await signInWithGoogle();
		} catch (error) {
			console.error("Login failed:", error);
		}
	};

	const handlePinSubmit = async () => {
		setIsSubmitting(true);
		setError(null);
		try {
			const response = await fetch("/api/invitations/login", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ shortCode: pinCode }),
			});

			if (!response.ok) {
				setError("Nieprawidłowy kod. Sprawdź zaproszenie.");
				setIsSubmitting(false);
				return;
			}

			navigate({ to: "/dashboard" });
		} catch (err) {
			setError(err instanceof Error ? err.message : "Nie udało się zalogować.");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="relative flex min-h-screen w-full flex-col font-display overflow-x-hidden">
			{/* Specific Landing Page Header */}
			<header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
				<div className="max-w-[1280px] mx-auto">
					<div className="flex items-center justify-between px-4 py-4 sm:px-6 sm:py-6 lg:px-10">
						<div className="flex items-center gap-3 text-white">
							<span className="material-symbols-outlined text-3xl">
								favorite
							</span>
							<h2 className="text-xl font-bold tracking-tight">K & K</h2>
						</div>
					</div>
				</div>
			</header>

			{/* Hero Section */}
			<section className="relative flex min-h-screen w-full items-center justify-center overflow-hidden">
				<div className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat bg-hero-pattern scale-100" />

				<div className="relative z-10 flex flex-col items-center justify-center gap-6 px-5 pb-16 pt-20 text-center sm:gap-8 sm:px-4 sm:pb-0 sm:pt-0">
					<div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 backdrop-blur-md sm:px-6">
						<span className="text-xs font-bold uppercase tracking-[0.2em] text-white sm:text-sm">
							Zaproszenie na Ślub
						</span>
					</div>

					<div className="space-y-4">
						<h1 className="text-6xl font-black text-white leading-tight tracking-tighter drop-shadow-2xl sm:text-7xl md:text-9xl">
							Kamila <br className="md:hidden" />
							<span className="text-blue-300">&</span> Kuba
						</h1>

						<div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 text-white/95">
							<div className="flex items-center gap-2 text-lg font-medium tracking-wide sm:text-xl">
								<span className="material-symbols-outlined">
									calendar_month
								</span>
								<span>12 Sierpnia 2024</span>
							</div>
							<span className="hidden md:block h-2 w-2 rounded-full bg-blue-400" />
							<div className="flex items-center gap-2 text-lg font-medium tracking-wide sm:text-xl">
								<span className="material-symbols-outlined">location_on</span>
								<span>Kreta, Grecja</span>
							</div>
						</div>
					</div>

					{/* Login Method Selection */}
					<div className="mt-8 w-full max-w-md overflow-hidden rounded-2xl border border-white/20 bg-white/10 p-5 shadow-2xl backdrop-blur-xl glass-card sm:mt-12 sm:rounded-3xl sm:p-8">
						<h3 className="mb-4 text-white font-bold text-lg sm:mb-6">
							Zaloguj się, aby zobaczyć szczegóły
						</h3>

						<div className="relative">
							<AnimatePresence mode="wait" initial={false}>
								{!showPinForm ? (
									<motion.div
										key="pin-entry"
										initial={{ opacity: 0, x: prefersReducedMotion ? 0 : -40 }}
										animate={{ opacity: 1, x: 0 }}
										exit={{ opacity: 0, x: prefersReducedMotion ? 0 : 40 }}
										transition={{ duration: 0.35, ease: "easeOut" }}
										className="flex flex-col gap-4"
									>
										<p className="text-white/70 text-sm">
											Wpisz kod z zaproszenia lub zeskanuj QR.
										</p>
										<button
											type="button"
											onClick={() => setShowPinForm(true)}
											className="flex h-14 w-full items-center justify-center gap-3 rounded-xl border-2 border-white/40 bg-white/5 text-white font-bold transition-all hover:bg-white/20 hover:border-white"
										>
											<span className="material-symbols-outlined">key</span>
											Wpisz kod
										</button>
										<p className="text-white/50 text-xs leading-relaxed">
											Dostęp tylko dla zaproszonych gości. <br />
											Masz problem? Skontaktuj się z nami.
										</p>
									</motion.div>
								) : (
									<motion.div
										key="pin-form"
										initial={{ opacity: 0, x: prefersReducedMotion ? 0 : 40 }}
										animate={{ opacity: 1, x: 0 }}
										exit={{ opacity: 0, x: prefersReducedMotion ? 0 : -40 }}
										transition={{ duration: 0.35, ease: "easeOut" }}
										className="flex flex-col gap-4"
									>
										<label className="text-white/70 text-sm" htmlFor="pin">
											Kod z zaproszenia
										</label>
										<input
											id="pin"
											value={pinCode}
											onChange={(e) => {
												setPinCode(e.target.value);
												if (error) setError(null);
											}}
											className="h-12 rounded-xl bg-white/10 border border-white/30 px-4 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
											placeholder="Wpisz 6-cyfrowy kod"
											inputMode="numeric"
											autoComplete="one-time-code"
										/>
										{resolvedError && (
											<p className="text-red-200 text-xs">{resolvedError}</p>
										)}
										<div className="flex gap-3">
											<button
												type="button"
												onClick={() => setShowPinForm(false)}
												className="flex-1 h-12 rounded-xl border border-white/30 text-white/80 hover:text-white hover:border-white/60 transition"
											>
												Wstecz
											</button>
											<button
												type="button"
												onClick={handlePinSubmit}
												disabled={
													isSubmitting ||
													pinCode.replace(/\s+/g, "").trim().length < 6
												}
												className="flex-1 h-12 rounded-xl bg-white text-gray-900 font-bold hover:bg-gray-100 transition disabled:opacity-60"
											>
												{isSubmitting ? "Sprawdzam..." : "Wejdź"}
											</button>
										</div>
									</motion.div>
								)}
							</AnimatePresence>
						</div>

						<div className="mt-6 border-t border-white/20 pt-5 sm:mt-8 sm:pt-6">
							<p className="text-white/50 text-xs uppercase tracking-widest mb-3">
								Panel organizatorów
							</p>
							<button
								type="button"
								onClick={handleGoogleLogin}
								className="flex h-12 w-full items-center justify-center gap-3 rounded-xl bg-white text-gray-900 font-bold shadow-lg transition-all hover:bg-gray-50 hover:scale-[1.02] cursor-pointer"
							>
								<svg className="w-6 h-6" viewBox="0 0 24 24">
									<path
										d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
										fill="#4285F4"
									/>
									<path
										d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
										fill="#34A853"
									/>
									<path
										d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
										fill="#FBBC05"
									/>
									<path
										d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
										fill="#EA4335"
									/>
								</svg>
								Zaloguj przez Google
							</button>
						</div>
					</div>
				</div>

				<div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0]">
					<svg
						className="relative block w-full h-[60px] md:h-[100px]"
						data-name="Layer 1"
						preserveAspectRatio="none"
						viewBox="0 0 1200 120"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path d="M0,0 Q600,220 1200,0 V120 H0 Z" fill="#F8FAFC" />
					</svg>
				</div>
			</section>

			<DashboardFooter />
		</div>
	);
}
