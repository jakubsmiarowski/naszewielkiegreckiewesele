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
						lastMessage:
							"[CONVEX M(invitations:updateRsvp)] [Request ID: abc123] Server Error Uncaught Error: Podaj datę i godzinę przylotu. at handler (../../convex/invitations.ts:320:13) Called by client",
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
					message:
						"[CONVEX M(invitations:updateRsvp)] [Request ID: abc123] Server Error Uncaught Error: Podaj datę i godzinę przylotu. at handler (../../convex/invitations.ts:320:13) Called by client",
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

		expect(screen.getByText("Błędy aplikacji")).toBeTruthy();
		expect(
			screen.getAllByText("Podaj datę i godzinę przylotu.").length,
		).toBeGreaterThan(0);
		expect(screen.getByText("Wystąpień: 3")).toBeTruthy();
		expect(screen.getByText("Context")).toBeTruthy();
		expect(screen.getByText("Payload RSVP")).toBeTruthy();
		expect(screen.getByText("Stack trace")).toBeTruthy();

		fireEvent.click(screen.getByRole("button", { name: "W analizie" }));

		expect(onSetErrorStatus).toHaveBeenCalledWith("investigating");
	});
});
