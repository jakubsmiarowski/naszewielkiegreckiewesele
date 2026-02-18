#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

const rootDir = process.cwd();
const clientAssetsDir = path.join(rootDir, "dist", "client", "assets");
const serverAssetsDir = path.join(rootDir, "dist", "server", "assets");

function getSingleAsset(files, prefix) {
	const matches = files.filter(
		(file) => file.startsWith(`${prefix}-`) && file.endsWith(".js"),
	);

	if (matches.length !== 1) {
		throw new Error(
			`Expected exactly one "${prefix}-*.js" asset, found ${matches.length}.`,
		);
	}

	return matches[0];
}

function rewriteManifestContent(
	content,
	assets,
) {
	return content
		.replace(/\/assets\/main-[^"]+\.js/g, `/assets/${assets.main}`)
		.replace(/\/assets\/index-[^"]+\.js/g, `/assets/${assets.index}`)
		.replace(
			/\/assets\/invitation-session-[^"]+\.js/g,
			`/assets/${assets.invitationSession}`,
		)
		.replace(/\/assets\/dashboard-[^"]+\.js/g, `/assets/${assets.dashboard}`)
		.replace(/\/assets\/verify-[^"]+\.js/g, `/assets/${assets.verify}`);
}

async function main() {
	const clientFiles = await fs.readdir(clientAssetsDir);
	const serverFiles = await fs.readdir(serverAssetsDir);

	const assets = {
		main: getSingleAsset(clientFiles, "main"),
		index: getSingleAsset(clientFiles, "index"),
		invitationSession: getSingleAsset(clientFiles, "invitation-session"),
		dashboard: getSingleAsset(clientFiles, "dashboard"),
		verify: getSingleAsset(clientFiles, "verify"),
	};

	const startManifestFiles = serverFiles.filter(
		(file) =>
			file.startsWith("_tanstack-start-manifest_v-") && file.endsWith(".js"),
	);

	if (startManifestFiles.length === 0) {
		throw new Error(
			`Could not find TanStack start manifest in ${serverAssetsDir}.`,
		);
	}

	for (const manifestFile of startManifestFiles) {
		const manifestPath = path.join(serverAssetsDir, manifestFile);
		const original = await fs.readFile(manifestPath, "utf8");
		const rewritten = rewriteManifestContent(original, assets);

		if (original !== rewritten) {
			await fs.writeFile(manifestPath, rewritten, "utf8");
			console.log(`[fix-start-manifest] Updated ${manifestFile}`);
		} else {
			console.log(
				`[fix-start-manifest] No changes needed for ${manifestFile}`,
			);
		}
	}
}

main().catch((error) => {
	console.error(`[fix-start-manifest] ${error.message}`);
	process.exitCode = 1;
});
