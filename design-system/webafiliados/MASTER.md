# Design System: WebAfiliados (MASTER) — "Asfalto"

Chosen by the user on 2026-10-29 from 4 animated directions (canvas: Voltaje, Asfalto, Ruta, Pop).
Reason: highest impact for scooter buyers and most distinctive on social media.

## Direction
Urban editorial. Huge uppercase condensed-black headlines, cream paper, ink lines, one hot orange.
Square shapes, 2px ink borders, solid offset shadows on hover, stickers, a running ticker.
Dark mode inverts paper and ink; orange stays.

## Tokens (CSS variables in `src/styles/global.css`)

| Token | Light | Dark | Use |
|---|---|---|---|
| `--bg` | #F2EFE9 | #111111 | Page (paper) |
| `--surface` | #FFFFFF | #1C1B19 | Cards |
| `--surface-2` | #E4DFD5 | #2A2824 | Bar tracks, chips |
| `--border` | #111111 | #F2EFE9 | 2px ink lines |
| `--fg` | #111111 | #F2EFE9 | Text (ink) |
| `--muted` | #4A463F | #B8B1A5 | Secondary text |
| `--accent` | #FF4F12 | #FF4F12 | Fills: CTAs, highlights, ticker text on ink |
| `--on-accent` | #111111 | #111111 | Text on accent (white fails contrast) |
| `--accent-ink` | #B8370A | #FF6A33 | Accent as text on paper |
| `--good` | #11683A | #4ADE80 | Price drop |
| `--bad` | #B91C1C | #F87171 | Price rise |

Contrast checked (all ≥ 4.5:1): ink/paper 16.4, muted 8.2 / 8.9, accent-ink 5.1 / 6.6, ink on orange 5.7.
Never white text on orange.

## Typography
- Display: **Archivo Black**, uppercase, tracking −0.04em, line-height 0.86–0.9. H1 clamp(56px, 11vw, 150px).
- Body and UI: **Archivo Variable** (400–700). Labels: uppercase, 700, tracking 0.08–0.12em.
- Self-hosted via @fontsource. Prices and specs `tabular-nums`.

## Shape
- Radius 0 on cards, buttons and inputs. Pills (999px) only for small nav highlights and badges.
- Borders 2px `--border`. Hover: translate(−3px, −3px) + 6px 6px 0 solid shadow in `--border`.

## Motion
- Headline "slam": rise 40px + skew 4° → 0, 0.8s cubic-bezier(.2,.8,.2,1).
- Stickers: scale .4 + rotate −30° → overshoot → final tilt, cubic-bezier(.34,1.56,.64,1), staggered.
- Ticker: infinite linear marquee 22–30s, pauses on hover, static when motion is reduced.
- Numbers: slide up from a clipped box.
- Everything disabled under `prefers-reduced-motion`; final state shown.

## Rules
- Icons: inline Lucide SVG, never emoji (✦ in the ticker is a text separator, aria-hidden).
- Touch targets ≥ 44px; visible focus ring 2px `--accent-ink`, offset 2px.
- Container `max-width: 72rem`, padding 16px mobile / 24px desktop. Stickers hidden below 768px.
- Affiliate links `rel="sponsored nofollow noopener"`, deliberate click only. Prices always dated.
