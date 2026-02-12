import {
	createFileRoute,
	useLocation,
	useNavigate,
} from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useId, useMemo, useState } from "react";
import { DashboardFooter } from "@/components/dashboard/DashboardFooter";
import { authClient, signInWithGoogle } from "@/lib/auth-client";
import { useInvitationSession } from "@/lib/invitation-session";

export const Route = createFileRoute("/")({ component: LandingPage });

function LandingPage() {
	const navigate = useNavigate();
	const prefersReducedMotion = useReducedMotion();
	const { invitationId, isLoading: isSessionLoading } = useInvitationSession();
	const { data: adminSession, isPending: isAdminPending } =
		authClient.useSession();
	const adminEmail = adminSession?.user?.email ?? null;
	const pinInputId = useId();

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
		if (isAdminPending || !adminEmail) {
			return;
		}

		let isCancelled = false;
		const checkAdminAccess = async () => {
			try {
				const response = await fetch("/api/admin/session");
				if (!isCancelled && response.ok) {
					navigate({ to: "/dashboard" });
				}
			} catch (_error) {
				// Non-admin users should stay on landing page.
			}
		};

		checkAdminAccess();
		return () => {
			isCancelled = true;
		};
	}, [adminEmail, isAdminPending, navigate]);

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

			<section className="relative flex min-h-screen w-full items-center justify-center overflow-hidden">
				<div className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat bg-hero-pattern scale-100" />

				<div className="relative z-10 flex flex-col items-center justify-center gap-6 px-5 pb-16 pt-20 text-center sm:gap-8 sm:px-4 sm:pb-0 sm:pt-0">
					<div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 backdrop-blur-md sm:px-6">
						<span className="text-sm font-bold uppercase tracking-[0.2em] text-white">
							Zaproszenie na Ślub
						</span>
					</div>

					<div className="space-y-4">
						<h1 className="text-6xl font-black text-white leading-tight tracking-tighter drop-shadow-2xl sm:text-7xl md:text-9xl">
							Kamila <br className="md:hidden" />
							<span className="text-blue-300">&</span> Kuba
						</h1>

						<div className="mx-auto w-full max-w-md text-white/95">
							<div className="grid grid-cols-[1fr_auto_1fr] items-center">
								<span className="justify-self-end pr-3 text-lg font-medium tracking-wide sm:pr-4 sm:text-xl">
									01 | 10 | 2026
								</span>
								<span className="h-1.5 w-1.5 rounded-full bg-white/90" />
								<span className="justify-self-start pl-3 text-lg font-medium uppercase tracking-wide sm:pl-4 sm:text-xl">
									Kreta, Grecja
								</span>
							</div>
						</div>
					</div>

					<div className="mt-8 w-full max-w-md overflow-hidden rounded-2xl border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-xl glass-card sm:mt-12 sm:rounded-3xl sm:p-8">
						<div className="flex flex-col gap-6">
							<h3 className="text-white font-bold text-lg text-center">
								Zaloguj się, aby zobaczyć szczegóły
							</h3>

							<div className="relative">
								<AnimatePresence mode="wait" initial={false}>
									{!showPinForm ? (
										<motion.div
											key="pin-entry"
											initial={{
												opacity: 0,
												x: prefersReducedMotion ? 0 : -40,
											}}
											animate={{ opacity: 1, x: 0 }}
											exit={{ opacity: 0, x: prefersReducedMotion ? 0 : 40 }}
											transition={{ duration: 0.35, ease: "easeOut" }}
											className="flex flex-col items-center gap-4 text-center"
										>
											<p className="text-white text-sm">
												Wpisz kod z zaproszenia lub zeskanuj QR
											</p>
											<button
												type="button"
												onClick={() => setShowPinForm(true)}
												className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border-2 border-white/30 bg-white/5 text-white font-bold transition-all hover:bg-white/20 hover:border-white"
											>
												Wpisz kod
											</button>
											<p className="text-white/50 text-xs leading-relaxed">
												Dostęp tylko dla zaproszonych gości
											</p>
										</motion.div>
									) : (
										<motion.div
											key="pin-form"
											initial={{ opacity: 0, x: prefersReducedMotion ? 0 : 40 }}
											animate={{ opacity: 1, x: 0 }}
											exit={{ opacity: 0, x: prefersReducedMotion ? 0 : -40 }}
											transition={{ duration: 0.35, ease: "easeOut" }}
											className="flex flex-col gap-4 text-left"
										>
											<label
												className="text-white text-sm"
												htmlFor={pinInputId}
											>
												Kod z zaproszenia
											</label>
											<input
												id={pinInputId}
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

							<div className="border-t border-white/20 pt-6">
								<p className="text-white text-sm mb-4 text-center">
									Panel organizatorów
								</p>

								<button
									type="button"
									onClick={handleGoogleLogin}
									className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border-2 border-white/30 bg-white/5 text-white font-bold transition-all hover:bg-white/20 hover:border-white"
								>
									Zaloguj przez Google
								</button>
							</div>
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
						<title>Dekoracyjna fala</title>
						<path d="M0,0 Q600,220 1200,0 V120 H0 Z" fill="#F8FAFC" />
					</svg>
				</div>
			</section>

			<DashboardFooter />
		</div>
	);
}
