import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const IMAGES_DIR = path.join(process.cwd(), "public", "images");
const JPG_EXTENSIONS = new Set([".jpg", ".jpeg"]);
const WEBP_QUALITY = 82;

function applyExifOrientation(pipeline, orientation) {
  switch (orientation) {
    case 2:
      return pipeline.flop();
    case 3:
      return pipeline.rotate(180);
    case 4:
      return pipeline.flip();
    case 5:
      return pipeline.rotate(90).flop();
    case 6:
      return pipeline.rotate(90);
    case 7:
      return pipeline.rotate(270).flop();
    case 8:
      return pipeline.rotate(270);
    default:
      return pipeline;
  }
}

async function run() {
  const entries = await fs.readdir(IMAGES_DIR, { withFileTypes: true });
  const jpgFiles = entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => JPG_EXTENSIONS.has(path.extname(name).toLowerCase()))
    .sort((a, b) => a.localeCompare(b));

  if (jpgFiles.length === 0) {
    console.log("No JPG/JPEG files found in public/images.");
    return;
  }

  let converted = 0;
  let skipped = 0;

  for (const fileName of jpgFiles) {
    const inputPath = path.join(IMAGES_DIR, fileName);
    const outputName = `${path.parse(fileName).name}.webp`;
    const outputPath = path.join(IMAGES_DIR, outputName);

    try {
      await fs.access(outputPath);
      skipped += 1;
      console.log(`skip  ${fileName} -> ${outputName} (already exists)`);
      continue;
    } catch {
      // Output file does not exist, proceed with conversion.
    }

    const metadata = await sharp(inputPath).metadata();
    const oriented = applyExifOrientation(sharp(inputPath), metadata.orientation);
    await oriented.webp({ quality: WEBP_QUALITY }).toFile(outputPath);
    converted += 1;
    console.log(`ok    ${fileName} -> ${outputName}`);
  }

  console.log(`\nDone. Converted: ${converted}, skipped: ${skipped}`);
}

run().catch((error) => {
  console.error("jpg-to-webp failed:", error);
  process.exitCode = 1;
});
