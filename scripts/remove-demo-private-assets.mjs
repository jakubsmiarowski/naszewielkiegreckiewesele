#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

const PRIVATE_DEMO_ASSETS = [
	"images/azja.webp",
	"images/alajan.webp",
	"images/dawid.webp",
	"images/franek.webp",
	"images/kite.webp",
	"images/sadowa.webp",
	"images/uro.webp",
	"images/wataha.webp",
	"images/wojtek.webp",
];

async function removeIfExists(filePath) {
	try {
		await fs.unlink(filePath);
		console.log(`[demo-assets] removed ${filePath}`);
	} catch (error) {
		if (error && typeof error === "object" && "code" in error) {
			if (error.code === "ENOENT") {
				return;
			}
		}
		throw error;
	}
}

async function main() {
	const rootDir = process.cwd();
	const distClientDir = path.join(rootDir, "dist", "client");

	await Promise.all(
		PRIVATE_DEMO_ASSETS.map((asset) =>
			removeIfExists(path.join(distClientDir, asset)),
		),
	);
}

main().catch((error) => {
	console.error(`[demo-assets] ${error.message}`);
	process.exitCode = 1;
});
