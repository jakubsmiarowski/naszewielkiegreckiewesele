import { describe, expect, it } from "vitest";
import { badgeVariants } from "@/components/ui/badge";

describe("badgeVariants", () => {
	it("does not force accent foreground text on outline hover links", () => {
		const classes = badgeVariants({ variant: "outline" });
		expect(classes).not.toContain("[a&]:hover:text-accent-foreground");
	});

	it("does not force accent foreground text on ghost hover links", () => {
		const classes = badgeVariants({ variant: "ghost" });
		expect(classes).not.toContain("[a&]:hover:text-accent-foreground");
	});
});
