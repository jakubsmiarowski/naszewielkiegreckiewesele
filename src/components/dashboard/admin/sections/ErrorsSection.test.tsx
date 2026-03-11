import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ErrorsSection } from "./ErrorsSection";

describe("ErrorsSection", () => {
	it("renders grouped errors and lets admin update the selected status", () => {
		const onSetErrorStatus = vi.fn();

		render(
			<ErrorsSection
				errorEvents={[
					{
						_id: "error-1",
						kind: "rsvp_submit_error",
						status: "new",
						fingerprint: "rsvp:error",
						occurrenceCount: 3,
						firstSeenAt: 1_700_000_000_000,
						lastSeenAt: 1_700_000_100_000,
						lastMessage: "Nie udało się zapisać RSVP",
						lastRoute: "/dashboard",
						release: "1.0.0-local",
					},
				]}
				selectedErrorId="error-1"
				selectedError={{
					_id: "error-1",
					kind: "rsvp_submit_error",
					status: "new",
					fingerprint: "rsvp:error",
					occurrenceCount: 3,
					firstSeenAt: 1_700_000_000_000,
					lastSeenAt: 1_700_000_100_000,
					message: "Nie udało się zapisać RSVP",
					route: "/dashboard",
					release: "1.0.0-local",
					payloadJson: '{"message":"Test RSVP"}',
					contextJson: '{"stage":"updateRsvp.final"}',
					deviceInfo: '{"platform":"iPhone"}',
				}}
				newErrorCount={1}
				statusFilter="__all__"
				kindFilter="__all__"
				routeFilter="__all__"
				availableRoutes={["/dashboard"]}
				statusMutationId={null}
				onStatusFilterChange={vi.fn()}
				onKindFilterChange={vi.fn()}
				onRouteFilterChange={vi.fn()}
				onSelectError={vi.fn()}
				onSetErrorStatus={onSetErrorStatus}
			/>,
		);

		expect(screen.getByText("Błędy aplikacji")).toBeInTheDocument();
		expect(screen.getByText("Nie udało się zapisać RSVP")).toBeInTheDocument();
		expect(screen.getByText("Wystąpień: 3")).toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: "W analizie" }));

		expect(onSetErrorStatus).toHaveBeenCalledWith("investigating");
	});
});
