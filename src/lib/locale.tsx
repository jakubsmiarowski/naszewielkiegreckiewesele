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

function readStoredLocale(defaultLocale: AppLocale) {
	if (typeof window === "undefined") {
		return defaultLocale;
	}

	try {
		return resolveLocale(window.localStorage.getItem(STORAGE_KEY), defaultLocale);
	} catch {
		return defaultLocale;
	}
}

function writeStoredLocale(locale: AppLocale) {
	if (typeof window === "undefined") {
		return;
	}

	try {
		window.localStorage.setItem(STORAGE_KEY, locale);
	} catch {
		// Ignore restricted storage environments.
	}
}

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
			writeStoredLocale(DEMO_LOCALE);
			return;
		}

		setLocale(readStoredLocale(defaultLocale));
	}, [defaultLocale, demoMode]);

	useEffect(() => {
		document.documentElement.lang = locale;
		writeStoredLocale(locale);
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
