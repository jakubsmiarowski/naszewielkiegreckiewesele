import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { InfoTabContent } from "@/components/dashboard/InfoTabContent";
import { LocaleProvider } from "@/lib/locale";

describe("InfoTabContent logistics carpool access", () => {
	it("shows RSVP requirement and hides the Car Pool button when access is blocked", () => {
		const onOpenCarpool = vi.fn();

		render(
			<LocaleProvider>
				<InfoTabContent
					activeTab="Logistyka"
					onOpenCarpool={onOpenCarpool}
					canOpenCarpool={false}
				/>
			</LocaleProvider>,
		);

		expect(
			screen.getByText("Aby wejść do Car Pool, najpierw odpowiedz na RSVP."),
		).toBeInTheDocument();
		expect(
			screen.queryByRole("button", { name: "Car Pool" }),
		).not.toBeInTheDocument();
	});

	it("shows the Car Pool button when access is available", () => {
		const onOpenCarpool = vi.fn();

		render(
			<LocaleProvider>
				<InfoTabContent
					activeTab="Logistyka"
					onOpenCarpool={onOpenCarpool}
					canOpenCarpool
				/>
			</LocaleProvider>,
		);

		expect(
			screen.queryByText("Aby wejść do Car Pool, najpierw odpowiedz na RSVP."),
		).not.toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Car Pool" }),
		).toBeInTheDocument();
	});
});
