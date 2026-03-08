import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { InvitationsSection } from "@/components/dashboard/admin/sections/InvitationsSection";
import type { AdminInvitation } from "@/components/dashboard/types";

const invitation: AdminInvitation = {
	_id: "invitation-1",
	displayName: "Anna i Jan Kowalscy",
	shortCode: "ABCD",
	qrToken: "qr-token-1",
	answeredForAll: true,
	guests: [
		{
			_id: "guest-1",
			fullName: "Anna Kowalska",
		},
		{
			_id: "guest-2",
			fullName: "Jan Kowalski",
		},
	],
};

describe("InvitationsSection render", () => {
	it("renders the invitation table without throwing", () => {
		const markup = renderToString(
			<InvitationsSection
				invitations={[invitation]}
				onRelationChange={vi.fn()}
				onCopyInvitationLink={vi.fn()}
			/>,
		);

		expect(markup).toContain("Zaproszenia");
		expect(markup).toContain("Liczba");
		expect(markup).toContain("2 os.");
		expect(markup).toContain("Kopiuj link");
	});
});
