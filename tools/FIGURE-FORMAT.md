# Commander figure format

Each pinned commander has a standing 2D figure shown at the top of the drawer. One file per commander,
`app/js/figures/<id>.js`, loaded only when that commander's file is opened:

```js
'use strict';
FD.defineFigure('caesar', '<svg viewBox="0 0 240 360" xmlns="http://www.w3.org/2000/svg">…</svg>');
```

## The house style (all twenty must look like one set)

- **Canvas**: `viewBox="0 0 240 360"`, no width/height, transparent background (no backdrop rect).
- **Pose**: standing, facing the viewer, turned very slightly to their left, three-quarter length: from the
  top of the headgear down to about the knees, where the figure is cut off by the bottom edge (y = 360).
  Head centre near (120, 78), head about 46 wide and 56 tall. Shoulders around y = 128, about 104 wide
  (x 68 to 172). Waist near y = 220. One arm hangs or rests on a sword hilt; the other holds the commander's
  signature object across the body or at the side (baton, telescope, map, scroll, sword, spear, book).
- **Line**: every shape has `stroke="#2a2520"` with `stroke-width="2"` and `stroke-linejoin="round"`; small
  details use `stroke-width="1.2"`. Flat fills only: no gradients, filters, patterns, masks or images.
- **Colour**: a muted, slightly desaturated period palette, at most about eight fills per figure. Shade with one
  darker flat shape per garment, not gradients. Skin tones are flat and vary appropriately by person.
- **Face**: simple and dignified. Two small dark eyes inside `<g class="fig-eyes">` (ellipses about 2.4 x 3),
  eyebrows optional, a short nose line, no mouth or a very short neutral line; beard, moustache and hair as
  flat shapes. No caricature.
- **Detail level**: around 60 to 120 SVG elements. It is shown about 150 px wide, and about 90 px wide in the
  comparison view, so favour bold recognisable shapes: headgear, coat cut, sash, decorations, weapon.
- **Animation hooks** (the app animates these; do not add `<animate>`, `<style>` or `<script>`):
  wrap the whole upper body, head included, in `<g class="fig-breathe">`; put anything that hangs free (cloak,
  cape, sash ends, coat tails, a banner) in `<g class="fig-sway">`; a plume, crest or tassel in
  `<g class="fig-plume">`; the eyes in `<g class="fig-eyes">`. `fig-sway` and `fig-plume` may sit inside
  `fig-breathe`.
- **Forbidden**: `id` attributes, `<text>`, `<style>`, `<script>`, `href`, `url(...)`, `<image>`, `<use>`,
  gradients, `filter`, external anything. All artwork must be original, drawn by you as paths and shapes.
- **Accuracy**: dress, armour and headgear should be right for the person and period. No flags of modern
  states, no anachronisms. When the historical appearance is unknown (Subutai, Khalid, Hannibal), use
  period-appropriate dress and keep it generic and respectful.

## Checking your work

`node tools/build-figures.js` validates every figure file and writes a contact sheet HTML at
`test/out/figures.html`. Render that page (or your own) with the pre-installed Playwright
(`require('playwright')`, `chromium.launch()` with no options; do not run `playwright install`), look at
the screenshot at both 150 px and 90 px width, and iterate until each figure is recognisable and the set
matches. Compare against any figures already present in `app/js/figures/`.
