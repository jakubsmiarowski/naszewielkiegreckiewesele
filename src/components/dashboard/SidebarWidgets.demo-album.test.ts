import { describe, expect, it } from "vitest";
import { getAlbumImagesForMode } from "@/components/dashboard/SidebarWidgets";

describe("DogSlideshowWidget demo album assets", () => {
	it("uses only public sample image URLs in demo mode", () => {
		const images = getAlbumImagesForMode(true);

		expect(images.length).toBeGreaterThan(0);
		expect(images.every((src) => src.startsWith("https://"))).toBe(true);
		expect(images.some((src) => src.includes("/images/dawid.webp"))).toBe(false);
		expect(images.some((src) => src.includes("/images/franek.webp"))).toBe(
			false,
		);
	});

	it("keeps private local images in production mode", () => {
		const images = getAlbumImagesForMode(false);

		expect(images.some((src) => src === "/images/dawid.webp")).toBe(true);
		expect(images.some((src) => src === "/images/franek.webp")).toBe(true);
	});
});
