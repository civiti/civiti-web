# Brief: brand assets, post logo consolidation

## Context

Civiti had four different marks in circulation, none of them chosen — each was added by whoever
was solving one surface, and nobody reconciled them. **We have now standardised on one: the
megaphone.** It is the only mark with a clean vector source and a reversed variant.

Everything on the website is already converted. Two surfaces still carry retired artwork and need
you, because both require typography or design judgement we should not fake.

## The mark — this is fixed, do not redraw it

Both variants live in `public/images/logo/`. They are 4 paths in exactly two brand colours on a
square `0 0 64 64` viewBox.

```svg
<!-- civiti-mark.svg — for light surfaces -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <path d="M10 26 L36 13 V51 L10 38 Z" fill="#14213D"></path>
  <rect x="16" y="38" width="9" height="14" rx="3" fill="#14213D"></rect>
  <path d="M44 22 A14 14 0 0 1 44 42" fill="none" stroke="#FCA311" stroke-width="4" stroke-linecap="round"></path>
  <path d="M51 15 A24 24 0 0 1 51 49" fill="none" stroke="#FCA311" stroke-width="4" stroke-linecap="round"></path>
</svg>
```

`civiti-mark-light.svg` is identical with `#14213D` swapped for `#FFFFFF`, for dark surfaces.

**Agreed icon treatment: navy tile, light mark.** `public/images/logo/civiti-icon.svg` is the
composed tile — full-bleed `#14213D` with the light mark inset to 82%. Every icon asset below uses
this composition so the App Store icon, the home-screen icon and the browser tab all match.

## Brand constants

```
--oxford-blue  #14213D      --orange-web       #FCA311
--platinum     #E5E5E5      --orange-web-dark  #9E6200   (text on light only — see below)
--white        #FFFFFF      --surface-muted    #F4F4F4
```

Typography is **Fira Sans**, weights 400 / 500 / 600 / 700.

`--orange-web` is 2.02:1 on white — it fails WCAG AA for text. Use it for fills, borders, large
display type, and anything on `--oxford-blue` (7.90:1 there). For orange *text* on a light surface
use `--orange-web-dark`, which is 5.00:1 on white.

---

# Asset 1 — Open Graph share card (highest priority)

**Replaces:** `public/images/logo/civiti-og-image.png`, which still shows a retired circled-"C"
monogram that appears on no other surface.

This is the image rendered every time anyone shares a Civiti link to WhatsApp, Facebook, LinkedIn
or Slack. It is the most-seen image we own. The metadata plumbing behind it is already correct —
absolute URL, declared dimensions, alt text — so the artwork is the only thing left.

| | |
|---|---|
| **Deliver** | `civiti-og-image.png` |
| **Dimensions** | **1200 × 630** exactly. This ratio is declared in `og:image:width`/`height`; anything else makes the tags lie and breaks first-render on Facebook and LinkedIn. |
| **Format** | PNG, opaque, **under 300 KB** — WhatsApp gives up on heavy images and falls back to a bare text link |
| **Safe area** | Keep all text and the mark within the central **1080 × 566**. Some clients crop to 1.91:1 with slack at the edges, and X may re-crop toward square. |

**Must contain:** the megaphone mark, the wordmark "Civiti" set in Fira Sans, and enough contrast to
read as a thumbnail roughly 500 px wide in a chat list.

**Free to change:** composition, whether the tagline and the `civiti.ro` pill from the old card
survive, background treatment. The old card used a navy field with an orange base bar — reuse that
or don't.

**Do not:** use `--orange-web` for any small text; put anything critical in the outer 60 px;
include a screenshot or user photography.

---

# Asset 2 — Mobile app icon set

**Replaces:** the icons in the `Civiti-Mobile` repo under `assets/images/`, which still carry a
retired speech-bubbles-and-arrow mark. That mark is currently the live App Store icon, so iPhone
visitors to the website see it in the smart app banner sitting on a megaphone-branded page.

All of these are the **navy tile with the light mark** — same composition as `civiti-icon.svg`.

| File | Size | Requirements |
|---|---|---|
| `icon.png` | **1024 × 1024** | iOS. **Fully opaque, no alpha channel** — the App Store rejects icons with transparency. Square, no pre-rounded corners: iOS applies its own mask. |
| `android-icon-foreground.png` | **1024 × 1024** | Mark only, transparent background. Android masks to various shapes, so keep the mark inside the central **66%** safe zone — roughly a 676 px circle. |
| `android-icon-background.png` | **1024 × 1024** | Flat `#14213D`, fully opaque. |
| `android-icon-monochrome.png` | **1024 × 1024** | Single-colour silhouette on transparency for Android 13+ themed icons. The system tints it, so ship it solid white and do not rely on the orange arcs carrying meaning. |
| `splash-icon.png` | **512 × 512** | Transparent background — the splash background colour is set in `app.config.ts`. |
| `favicon.png` | **48 × 48** | Expo web favicon. Opaque tile. |

**Note the 66% safe zone on the Android foreground.** The mark's sound arcs sit near the right edge
of the 64-unit viewBox; scaled naively into a 1024 square they will be clipped by circular masks.
They need to be inset, not just scaled.

---

## Already handled — do not duplicate

These exist and are wired up. Listed so you can match them, not remake them:

- `civiti-mark.svg` / `civiti-mark-light.svg` — the mark, both variants
- `civiti-icon.svg` — the navy tile, the canonical icon composition
- `apple-touch-icon.png` (180 × 180) and `favicon-32.png` — generated from the tile
- `public/images/screenshots/harta-bucuresti.webp` — the landing hero product shot

## Delivery

Drop files into the design project at the paths above and I will wire them in. Flag anything where
the constraints conflict with the composition you want — the dimensions and the opacity rules are
platform requirements rather than preferences, but everything aesthetic is yours.
