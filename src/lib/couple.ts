import { isDemoMode } from "@/lib/app-mode";

type CoupleNames = {
	first: string;
	second: string;
};

const PRODUCTION_COUPLE: CoupleNames = {
	first: "Kamila",
	second: "Kuba",
};

const DEMO_COUPLE: CoupleNames = {
	first: "Nadia",
	second: "Leon",
};

export function getCoupleNames(): CoupleNames {
	return isDemoMode() ? DEMO_COUPLE : PRODUCTION_COUPLE;
}

export function getCoupleLabel(): string {
	const { first, second } = getCoupleNames();
	return `${first} & ${second}`;
}
