import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";
import { isDemoMode } from "@/lib/app-mode";

export type AppLocale = "pl" | "en";

const STORAGE_KEY = "nwgw:locale";
const DEFAULT_LOCALE: AppLocale = "pl";
const DEMO_LOCALE: AppLocale = "en";

interface LocaleContextValue {
	locale: AppLocale;
	setLocale: (locale: AppLocale) => void;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function isAppLocale(value: string): value is AppLocale {
	return value === "pl" || value === "en";
}

export function resolveLocale(
	value: string | null | undefined,
	defaultLocale: AppLocale = DEFAULT_LOCALE,
): AppLocale {
	if (!value) return defaultLocale;
	return isAppLocale(value) ? value : defaultLocale;
}

export function LocaleProvider({ children }: { children: ReactNode }) {
	const demoMode = isDemoMode();
	const defaultLocale = demoMode ? DEMO_LOCALE : DEFAULT_LOCALE;
	const [locale, setLocale] = useState<AppLocale>(defaultLocale);

	useEffect(() => {
		if (demoMode) {
			setLocale(DEMO_LOCALE);
			window.localStorage.setItem(STORAGE_KEY, DEMO_LOCALE);
			return;
		}

		const storedLocale = resolveLocale(
			window.localStorage.getItem(STORAGE_KEY),
			defaultLocale,
		);
		setLocale(storedLocale);
	}, [defaultLocale, demoMode]);

	useEffect(() => {
		document.documentElement.lang = locale;
		window.localStorage.setItem(STORAGE_KEY, locale);
	}, [locale]);

	const value = useMemo(
		() => ({
			locale,
			setLocale,
		}),
		[locale],
	);

	return (
		<LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
	);
}

export function useLocale() {
	const context = useContext(LocaleContext);
	if (!context) {
		throw new Error("useLocale must be used within LocaleProvider");
	}

	return context;
}
