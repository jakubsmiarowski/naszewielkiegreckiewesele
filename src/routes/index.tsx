import {
	createFileRoute,
	useLocation,
	useNavigate,
} from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useId, useMemo, useState } from "react";
import { DashboardFooter } from "@/components/dashboard/DashboardFooter";
import { isDemoMode } from "@/lib/app-mode";
import { authClient, signInWithGoogle } from "@/lib/auth-client";
import { getCoupleNames } from "@/lib/couple";
import { useInvitationSession } from "@/lib/invitation-session";

export const Route = createFileRoute("/")({ component: LandingPage });

function LandingPage() {
	const navigate = useNavigate();
	const prefersReducedMotion = useReducedMotion();
	const { invitationId, isLoading: isSessionLoading } = useInvitationSession();
	const isDemoEnvironment = isDemoMode();
	const couple = getCoupleNames();
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
	const demoPins = useMemo(() => {
		const raw =
			(import.meta.env.VITE_DEMO_GUEST_PINS as string | undefined) ?? "";
		const parsed = raw
			.split(/[,\n; ]+/)
			.map((value) => value.trim())
			.filter(Boolean);
		if (parsed.length > 0) {
			return parsed;
		}
		return ["111111", "222222", "333333"];
	}, []);
	const copy = useMemo(
		() =>
			isDemoEnvironment
				? {
						invalidCode: "Invalid code. Check your invitation.",
						inviteBadge: "Wedding Invitation",
						locationLabel: "CRETE, GREECE",
						demoTitle: "Demo mode",
						demoDescription:
							"Use one of the ready PIN codes to enter prepared scenarios.",
						demoGuide: "Open demo testing guide",
						loginTitle: "Sign in to view details",
						enterHint: "Enter your invitation code or scan QR",
						enterCodeButton: "Enter code",
						guestsOnly: "Access for invited guests only",
						codeLabel: "Invitation code",
						codePlaceholder: "Enter 6-digit code",
						backButton: "Back",
						enterButton: "Enter",
						checkingButton: "Checking...",
						organizerPanel: "Organizer panel",
						googleButton: "Sign in with Google",
						loginFailed: "Could not sign in.",
					}
				: {
						invalidCode: "Nieprawidłowy kod. Sprawdź zaproszenie.",
						inviteBadge: "Zaproszenie na Ślub",
						locationLabel: "KRETA, GRECJA",
						demoTitle: "Tryb demo",
						demoDescription:
							"Użyj jednego z gotowych PIN-ów, aby wejść do przygotowanych scenariuszy.",
						demoGuide: "Otwórz instrukcję testowania demo",
						loginTitle: "Zaloguj się, aby zobaczyć szczegóły",
						enterHint: "Wpisz kod z zaproszenia lub zeskanuj QR",
						enterCodeButton: "Wpisz kod",
						guestsOnly: "Dostęp tylko dla zaproszonych gości",
						codeLabel: "Kod z zaproszenia",
						codePlaceholder: "Wpisz 6-cyfrowy kod",
						backButton: "Wstecz",
						enterButton: "Wejdź",
						checkingButton: "Sprawdzam...",
						organizerPanel: "Panel organizatorów",
						googleButton: "Zaloguj przez Google",
						loginFailed: "Nie udało się zalogować.",
					},
		[isDemoEnvironment],
	);

	const resolvedError = error ?? (searchError ? copy.invalidCode : null);

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
				setError(copy.invalidCode);
				setIsSubmitting(false);
				return;
			}

			navigate({ to: "/dashboard" });
		} catch (err) {
			setError(err instanceof Error ? err.message : copy.loginFailed);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handlePickDemoPin = (pin: string) => {
		setShowPinForm(true);
		setPinCode(pin);
		setError(null);
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
							{copy.inviteBadge}
						</span>
					</div>

					<div className="space-y-4">
						<h1 className="text-6xl font-black text-white leading-tight tracking-tighter drop-shadow-2xl sm:text-7xl md:text-9xl">
							{couple.first} <br className="md:hidden" />
							<span className="text-blue-300">&</span> {couple.second}
						</h1>

						<div className="mx-auto w-full max-w-md text-white/95">
							<div className="grid grid-cols-[1fr_auto_1fr] items-center">
								<span className="justify-self-end pr-3 text-lg font-medium tracking-wide sm:pr-4 sm:text-xl">
									01 | 10 | 2026
								</span>
								<span className="h-1.5 w-1.5 rounded-full bg-white/90" />
								<span className="justify-self-start pl-3 text-lg font-medium uppercase tracking-wide sm:pl-4 sm:text-xl">
									{copy.locationLabel}
								</span>
							</div>
						</div>
					</div>

					{isDemoEnvironment && (
						<div className="w-full max-w-md rounded-2xl border border-amber-200 bg-amber-50/95 p-4 text-left text-amber-950 shadow-lg sm:rounded-3xl sm:p-5">
							<p className="text-xs font-semibold uppercase tracking-wide">
								{copy.demoTitle}
							</p>
							<p className="mt-2 text-sm">{copy.demoDescription}</p>
							<div className="mt-3 flex flex-wrap gap-2">
								{demoPins.map((pin) => (
									<button
										key={pin}
										type="button"
										onClick={() => handlePickDemoPin(pin)}
										className="rounded-full border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-900 transition hover:bg-amber-100"
									>
										{pin}
									</button>
								))}
							</div>
							<a
								href="/demo.html"
								className="mt-3 inline-block text-xs font-semibold underline"
							>
								{copy.demoGuide}
							</a>
						</div>
					)}

					<div className="mt-8 w-full max-w-md overflow-hidden rounded-2xl border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-xl glass-card sm:mt-12 sm:rounded-3xl sm:p-8">
						<div className="flex flex-col gap-6">
							<h3 className="text-white font-bold text-lg text-center">
								{copy.loginTitle}
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
											<p className="text-white text-sm">{copy.enterHint}</p>
											<button
												type="button"
												onClick={() => setShowPinForm(true)}
												className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border-2 border-white/30 bg-white/5 text-white font-bold transition-all hover:bg-white/20 hover:border-white"
											>
												{copy.enterCodeButton}
											</button>
											<p className="text-white/50 text-xs leading-relaxed">
												{copy.guestsOnly}
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
												{copy.codeLabel}
											</label>
											<input
												id={pinInputId}
												value={pinCode}
												onChange={(e) => {
													setPinCode(e.target.value);
													if (error) setError(null);
												}}
												className="h-12 rounded-xl bg-white/10 border border-white/30 px-4 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
												placeholder={copy.codePlaceholder}
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
													{copy.backButton}
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
													{isSubmitting
														? copy.checkingButton
														: copy.enterButton}
												</button>
											</div>
										</motion.div>
									)}
								</AnimatePresence>
							</div>

							<div className="border-t border-white/20 pt-6">
								<p className="text-white text-sm mb-4 text-center">
									{copy.organizerPanel}
								</p>

								<button
									type="button"
									onClick={handleGoogleLogin}
									className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border-2 border-white/30 bg-white/5 text-white font-bold transition-all hover:bg-white/20 hover:border-white"
								>
									{copy.googleButton}
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
