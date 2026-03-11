import { describe, expect, it } from "vitest";
import {
	buildTelemetryReportArgs,
	computeTelemetryFingerprint,
} from "./telemetry";

describe("telemetry helpers", () => {
	it("builds a stable fingerprint from core error properties", () => {
		expect(
			computeTelemetryFingerprint({
				kind: "rsvp_submit_error",
				route: "/dashboard",
				message: "Could not save RSVP",
				stack: "Error: Could not save RSVP\nat submit",
			}),
		).toBe(
			"rsvp_submit_error:/dashboard:could-not-save-rsvp:error:-could-not-save-rsvp",
		);
	});

	it("redacts sensitive payload and context keys before serialization", () => {
		const args = buildTelemetryReportArgs({
			kind: "rsvp_submit_error",
			route: "/dashboard",
			message: "Could not save RSVP",
			payload: {
				token: "secret",
				guestAttendances: { guest1: "yes" },
			},
			context: {
				adminAccessToken: "top-secret",
				nested: {
					qrToken: "qr-secret",
				},
			},
		});

		expect(args.payloadJson).toContain('"token":"[Redacted]"');
		expect(args.payloadJson).toContain('"guestAttendances":{"guest1":"yes"}');
		expect(args.contextJson).toContain('"adminAccessToken":"[Redacted]"');
		expect(args.contextJson).toContain('"qrToken":"[Redacted]"');
	});

	it("omits payload serialization when no payload is provided", () => {
		const args = buildTelemetryReportArgs({
			kind: "runtime_error",
			route: "/dashboard",
			message: "Unexpected runtime error",
		});

		expect(args.payloadJson).toBeUndefined();
	});
});
