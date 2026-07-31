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
| **Deliver** | `civiti-og-card.svg` — **artwork only, with all text converted to outlines** |
| **Canvas** | `viewBox="0 0 1200 630"`. This ratio is declared in `og:image:width`/`height`; anything else makes the tags lie and breaks first-render on Facebook and LinkedIn. |
| **Safe area** | The mark and the wordmark must both sit inside the central **630 × 630 square** (x 285–915). Secondary copy only needs the central 1080 × 566. |
| **I handle** | Rasterising to an opaque PNG under 300 KB — WhatsApp gives up on heavy images and falls back to a bare text link. |

**Outline the text.** This environment has no Fira Sans installed, so live `<text>` elements would
rasterise in the wrong typeface. Converted to paths, the card renders exactly as you drew it.

**Design it centred, and check it as a square.** WhatsApp's small preview — the layout it uses most
of the time — renders a *square* thumbnail, which is a centre crop of the card. A left-aligned
composition loses everything outside x 285–915, which is how the first version of this card shipped
with the mark cropped clean off in every WhatsApp share. Before delivering, crop the card to its
central square and confirm the brand still reads. Secondary copy getting sliced there is fine; the
mark disappearing is not.

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

**Deliver three SVGs, not six PNGs.** These are pure artwork with no type in them, so SVG is lossless
and I can generate every platform raster at the exact size, opacity and colour depth each one needs.

| Deliver | Canvas | Notes |
|---|---|---|
| `civiti-icon-app.svg` | `0 0 1024 1024` | The full tile: opaque `#14213D` field, light mark. Square with no pre-rounded corners — iOS and Android both apply their own masks. Becomes the iOS `icon.png` and the Android background layer. |
| `civiti-icon-foreground.svg` | `0 0 1024 1024` | Mark only, transparent field, for the Android adaptive foreground. **Keep the mark inside the central 66% — roughly a 676 px circle.** The sound arcs sit near the right edge of the mark's own viewBox, so scaled naively they get clipped by circular masks. They need insetting, not just scaling. |
| `civiti-icon-mono.svg` | `0 0 1024 1024` | Solid-white silhouette on transparency, for Android 13+ themed icons. The system tints it a single colour, so the orange arcs cannot carry meaning here — the shape has to read on its own. |

From those I generate: iOS `icon.png` at 1024² flattened with no alpha channel (the App Store
rejects transparency), the three Android adaptive layers, `splash-icon.png` at 512², and the Expo
web `favicon.png` at 48².

---

## Already handled — do not duplicate

These exist and are wired up. Listed so you can match them, not remake them:

- `civiti-mark.svg` / `civiti-mark-light.svg` — the mark, both variants
- `civiti-icon.svg` — the navy tile, the canonical icon composition
- `apple-touch-icon.png` (180 × 180) and `favicon-32.png` — generated from the tile
- `public/images/screenshots/harta-bucuresti.webp` — the landing hero product shot

## Delivery

Four SVGs in total: `civiti-og-card.svg`, `civiti-icon-app.svg`, `civiti-icon-foreground.svg`,
`civiti-icon-mono.svg`. Drop them in the design project and I will rasterise, optimise and wire them
into both repos.

Vector sources only, please — no PNGs. Rasterising here means each platform gets exactly the size,
alpha handling and weight it requires, and we keep an editable source for the next time something
needs regenerating.

Flag anything where these constraints fight the composition you want. The canvas ratios, the safe
zones and the outlined text are platform requirements rather than preferences; everything aesthetic
is yours.
