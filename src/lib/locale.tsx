import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";

export type AppLocale = "pl" | "en";

const STORAGE_KEY = "nwgw:locale";
const DEFAULT_LOCALE: AppLocale = "pl";

interface LocaleContextValue {
	locale: AppLocale;
	setLocale: (locale: AppLocale) => void;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function isAppLocale(value: string): value is AppLocale {
	return value === "pl" || value === "en";
}

export function resolveLocale(value: string | null | undefined): AppLocale {
	if (!value) return DEFAULT_LOCALE;
	return isAppLocale(value) ? value : DEFAULT_LOCALE;
}

export function LocaleProvider({ children }: { children: ReactNode }) {
	const [locale, setLocale] = useState<AppLocale>(DEFAULT_LOCALE);

	useEffect(() => {
		const storedLocale = resolveLocale(
			window.localStorage.getItem(STORAGE_KEY),
		);
		setLocale(storedLocale);
	}, []);

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
