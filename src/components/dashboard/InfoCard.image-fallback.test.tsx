import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { InfoCard, type InfoCardData } from "@/components/dashboard/InfoCard";

describe("InfoCard image fallback", () => {
	it("shows a placeholder when attraction image fails to load", () => {
		const card: InfoCardData = {
			id: "test-card",
			image: "https://example.com/non-existing-image.jpg",
			category: "Plaże i zatoczki",
			date: "Sobota 03.10",
			title: "Loutro",
			description: "Opis atrakcji",
			alt: "Widok zatoki",
			content: <div>Treść</div>,
		};

		render(<InfoCard card={card} />);

		fireEvent.error(screen.getByAltText("Widok zatoki"));

		expect(screen.getByText("Zdjęcie wkrótce")).toBeInTheDocument();
	});
});
