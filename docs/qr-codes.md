# QR Code Generation

This project ships a script that generates QR codes for each invitation based on the current Convex data.

## Prereqs
1. Ensure `VITE_CONVEX_URL` points to the Convex deployment you want to use.
2. Install dependencies so the `qrcode` package is available.

## Production (paper invitations)
```bash
node scripts/generate-qr.mjs \
  --base-url https://naszewielkiegreckiewesele.com \
  --out-dir qr-codes/production
```

## Local testing (a couple of codes)
```bash
node scripts/generate-qr.mjs \
  --base-url http://localhost:3000 \
  --out-dir qr-codes/local \
  --limit 2
```

## Output
- QR images are written into the output directory.
- `index.csv` and `index.json` contain the mapping of `displayName`, `shortCode`, `qrToken`, `url`, and file name.
