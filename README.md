# qr — Slonig QR scanner

Small standalone React + Vite + TypeScript PWA, managed with pnpm.

## Start

```sh
corepack enable
pnpm install
pnpm dev
```

For a release, run `pnpm build` and deploy `dist/` to HTTPS. Mobile camera access needs HTTPS (or localhost for development).

## Interface

- Centered **Scan a QR code** button; a modal opens the camera (rear camera preferred).
- Switch camera, close, retry camera permission, and scan another QR code.
- Exact `https://app.slonig.org` URLs open immediately after scanning.
- Other URLs show **This is not Slonig**, and non-URLs show **This is not a web link**. Scanned data is never displayed and there are no copy/open-link controls.
- Language choices are placed below the Scan button, styled like `LanguageSelector` from `slonig-frontend/packages/page-settings/src/LanguageSelector.tsx` (inline native-language chips with active underline/border).
- Modal follows the same simple white, neutral-edge Slonig UI pattern. The original QR page background (`#fffaf3`) is unchanged.

## Translations

All 17 language codes and `public/locales/<lang>/translation.json` remain in the project. English fallback is used for untranslated strings. To translate with AI:

```sh
cp .env.example .env
# Configure OPENAI_API_KEY
pnpm i18n:build
```

## Tests

```sh
pnpm test
```

URL matching tests run without downloading packages using `node --test tests/*.test.mjs`.

Note: Browser camera access must be tested on a real device and the complete build requires installing pnpm dependencies.
