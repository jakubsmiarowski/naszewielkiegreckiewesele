import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { RsvpTab } from "@/components/dashboard/RsvpTab";
import type { InvitationData, RsvpSettings } from "@/components/dashboard/types";

const {
	useMutationMock,
	useQueryMock,
	toastMock,
	captureClientErrorMock,
} = vi.hoisted(() => ({
	useMutationMock: vi.fn(),
	useQueryMock: vi.fn(),
	toastMock: vi.fn(),
	captureClientErrorMock: vi.fn(),
}));

vi.mock("convex/react", () => ({
	useMutation: useMutationMock,
	useQuery: useQueryMock,
}));

vi.mock("@tanstack/react-router", () => ({
	useLocation: () => ({ pathname: "/dashboard", search: "" }),
}));

vi.mock("@/components/rsvp/RsvpForm", () => ({
	RsvpForm: ({
		onSubmit,
	}: {
		onSubmit?: (data: {
			guestAttendances: Record<string, "yes" | "no">;
			transport: "own" | "bus";
			carpoolDriverOptIn: "yes" | "no";
			arrivalDateTime: string;
			departureDateTime: string;
			message: string;
			childrenCount: number;
			needsExtraNightsHelp: boolean;
		}) => void;
	}) => (
		<button
			type="button"
			onClick={() =>
				onSubmit?.({
					guestAttendances: { guest1: "yes" },
					transport: "own",
					carpoolDriverOptIn: "no",
					arrivalDateTime: "2026-10-01T10:00",
					departureDateTime: "2026-10-05T10:00",
					message: "Test RSVP",
					childrenCount: 0,
					needsExtraNightsHelp: false,
				})
			}
		>
			Wyślij RSVP
		</button>
	),
}));

vi.mock("@/components/ui/use-toast", () => ({
	toast: toastMock,
}));

vi.mock("@/lib/locale", () => ({
	useLocale: () => ({ locale: "pl" }),
}));

vi.mock("@/lib/telemetry", () => ({
	useTelemetry: () => ({
		captureClientError: captureClientErrorMock,
	}),
}));

const invitationData = {
	invitation: {
		_id: "invitation-1",
		hasPlusOne: false,
		guestAttendances: { guest1: "yes" },
	},
	guests: [{ _id: "guest1", fullName: "Anna Kowalska" }],
} as InvitationData;

const settings = {
	rsvpDeadline: "2026-12-01T23:59",
	rsvpGraceDeadline: "2026-12-15T23:59",
	carpoolDeadline: "2026-12-15T23:59",
} satisfies RsvpSettings;

describe("RsvpTab telemetry", () => {
	beforeEach(() => {
		useMutationMock.mockReset();
		useQueryMock.mockReset();
		toastMock.mockReset();
		captureClientErrorMock.mockReset();
		useQueryMock.mockReturnValue({
			openOffers: [],
			myOffers: [],
		});
	});

	it("reports a telemetry event when RSVP save fails", async () => {
		const updateRsvpMock = vi
			.fn()
			.mockRejectedValue(new Error("Backend unavailable"));
		const createCarpoolRequestMock = vi.fn();
		useMutationMock
			.mockReturnValueOnce(updateRsvpMock)
			.mockReturnValueOnce(createCarpoolRequestMock);

		render(<RsvpTab invitationData={invitationData} settings={settings} />);

		fireEvent.click(screen.getByRole("button", { name: "Wyślij RSVP" }));

		await waitFor(() => {
			expect(captureClientErrorMock).toHaveBeenCalledWith(
				expect.objectContaining({
					kind: "rsvp_submit_error",
					invitationId: "invitation-1",
					message: "Backend unavailable",
					route: "/dashboard",
					payload: expect.objectContaining({
						message: "Test RSVP",
					}),
					context: expect.objectContaining({
						stage: "updateRsvp.final",
						locale: "pl",
					}),
				}),
			);
		});

		expect(toastMock).toHaveBeenCalledWith(
			expect.objectContaining({
				variant: "destructive",
				title: "Nie udało się zapisać RSVP",
			}),
		);
	});
});
