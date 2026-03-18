import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DeadlineCountdownWidget } from "@/components/dashboard/SidebarWidgets";

vi.mock("@/lib/locale", () => ({
	useLocale: () => ({ locale: "pl" }),
}));

describe("DeadlineCountdownWidget", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date(2026, 2, 18, 12, 0, 0));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("refreshes countdown immediately when the deadline prop changes", () => {
		const { rerender } = render(
			<DeadlineCountdownWidget deadline={new Date(2026, 2, 18, 11, 59, 0)} />,
		);

		expect(screen.getAllByText("0")).toHaveLength(3);

		rerender(
			<DeadlineCountdownWidget deadline={new Date(2026, 2, 25, 19, 13, 0)} />,
		);

		expect(screen.getAllByText("7")).toHaveLength(2);
		expect(screen.getByText("13")).toBeTruthy();
	});

	it("keeps updating on the existing one-minute interval", () => {
		render(
			<DeadlineCountdownWidget deadline={new Date(2026, 2, 25, 19, 13, 0)} />,
		);

		expect(screen.getByText("13")).toBeTruthy();

		act(() => {
			vi.advanceTimersByTime(60_000);
		});

		expect(screen.getByText("12")).toBeTruthy();
	});
});
