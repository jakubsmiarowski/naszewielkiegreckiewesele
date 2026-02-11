import { describe, expect, it } from "vitest";
import { buttonVariants } from "@/components/ui/button";

describe("buttonVariants", () => {
	it("does not force accent foreground text on outline hover", () => {
		const classes = buttonVariants({ variant: "outline" });
		expect(classes).not.toContain("hover:text-accent-foreground");
	});

	it("does not force accent foreground text on ghost hover", () => {
		const classes = buttonVariants({ variant: "ghost" });
		expect(classes).not.toContain("hover:text-accent-foreground");
	});
});
