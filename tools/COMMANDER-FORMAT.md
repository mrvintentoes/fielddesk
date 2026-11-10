# Commander file format

One file per commander in `app/js/commanders/<id>.js`. Plain browser script, no modules:

```js
'use strict';
FD.defineCommander({
  id: 'scipio',                       // file name without .js
  name: 'Scipio',                     // short name shown under the portrait (max ~11 characters)
  full: 'Publius Cornelius Scipio Africanus',
  dates: '236–183 BC',
  epithet: 'One short line, at most about eight words',
  era: 'Ancient world',               // one of: Ancient world, Medieval world, Early modern, Age of revolutions, Nineteenth century
  tone: '#7b2d26',                    // medallion colour; white text must be readable on it
  selfWords: ['Scipio', 'Africanus'], // words that mean a page is about this commander
  rivalWords: ['Hannibal', 'Zama', 'Carthage'], // opponents, battles and places tied to them
  theme: {
    label: 'Roman Republic',          // 1–3 words naming the look
    vars: {                           // all fifteen, 6-digit hex
      '--paper': '#f4ecdd',   // main background (must stay light)
      '--paper-2': '#ece2cf', // toolbar and rail background, a step darker
      '--paper-3': '#e1d5bd', // hover and chips, another step darker
      '--card': '#fbf6ea',    // cards and inputs, lighter than paper
      '--ink': '#2a2520',     // body text
      '--ink-2': '#5a5146',   // secondary text
      '--ink-3': '#8a7e6e',   // faint text
      '--rule': '#d2c5ab',    // hairlines and borders
      '--accent': '#7b2d26',  // primary accent: buttons, active tab marker, headings
      '--accent-soft': '#ead3c8',
      '--green': '#2f5d50',   // "supports", "sourced", success. Need not be green, but must read as the positive colour
      '--green-soft': '#d5e2d6',
      '--brass': '#a07a2c',   // focus rings and small ornaments
      '--amber-soft': '#f0dfb4', // background of "scenario assumption" notes
      '--blue': '#2f4a6b'     // links
    },
    band: 'linear-gradient(90deg, #7b2d26 0 33%, #a07a2c 33% 66%, #2f5d50 66%)' // CSS background for a 3px ornamental strip under the toolbar
  },
  decisions: [                        // exactly four, in this order: intelligence, tempo, logistics, recovery
    { id: 'scipio-intelligence', category: 'intelligence', title: 'Short title', when: '209 BC',
      summary: 'Two to four sentences in our own words: what was decided and why it matters operationally.',
      cite: 'Polybius 10.8–9', url: 'https://…' }
  ],
  quotes: [                           // three to five
    { text: 'The words, in English.', source: 'Where it is recorded, e.g. Livy 30.30 (speech composed by Livy)',
      status: 'attested', note: 'optional caveat', url: 'https://… (optional)' }
  ],
  remarks: [                          // 14 to 18
    { on: 'maps', text: 'A short in-character remark, 150 characters at most.' }
  ],
  portrait: '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">…</svg>'
});
```

## Rules

**Decisions.** Our own paraphrase, never an invented quotation. Each needs a real, checkable citation
(ancient author with book and chapter, or a named battle or campaign) and an `https://` URL that is
very likely to exist: prefer exact English Wikipedia article titles for well-known battles and campaigns,
or the commander's main Wikipedia article. Hedge numbers ("roughly", "about"). Flag anything traditional
or disputed as such in the summary.

**Quotes.** Real words only, with where they are recorded. `status` is:
- `attested`: in the person's own writing, dispatches or orders, or recorded by a contemporary witness.
- `attributed`: put in their mouth by a later historian or by tradition (most ancient speeches).
- `disputed`: commonly repeated but doubtful or probably apocryphal. Say why in `note`.
If you are not sure of the exact wording, do not include it. A short well-attested line beats a famous
doubtful one. Translations are fine; say "trans." in `source` where it matters.

**Remarks.** These are Field Desk's own in-character asides shown now and then when the user opens a
web page; the app labels them as written for the app, not as quotations. Keep them dry, brief, in the
commander's voice and period mindset, about the *kind* of page, never about a real living person or
current politics, never insulting to any people or faith. `on` is one of:
`maps` (map sites), `encyclopedia` (Wikipedia and reference), `news`, `shopping`, `social`, `video`,
`mail`, `code` (GitHub, docs, programming), `search` (a search results page), `weather`, `money`
(banking, markets), `travel`, `sport`, `history` (military history pages in general), `self` (a page
about this commander), `rival` (a page about an opponent or one of their battles), `any` (fits any page).
Provide at least three `any` remarks and at least one for each of `maps`, `encyclopedia`, `news`,
`search`, `self`, `rival`, `history`.

**Theme.** The whole app takes these colours when the commander is the lead pin, so it must stay a quiet,
readable reading room with the flavour of the commander's world (Roman red and marble, French imperial
blue and gold, and so on). `node tools/build-commanders.js` enforces: light paper; ink on paper/card/
paper-2 at 9:1 or better; ink-2 at 5:1; accent, blue and green each at 4.5:1 on paper, card and paper-2;
white text at 4.5:1 on accent and on green; ink-3 at 3:1 on paper. No two commanders should share a
look: vary hue of the paper slightly (warm, cool, grey, green-tinged) as well as the accents.

**Portrait.** Inline SVG, `viewBox="0 0 64 64"`, no width/height, no ids, no text, no script, no links,
no `url()`. A round medallion background, shoulders, neck, head, minimal or no facial features, and one
or two unmistakable attributes. It is shown from 34px to 72px. Match the existing set (see
`app/js/commanders/caesar.js`, `napoleon.js`): flat shapes, thin dark outlines, muted palette.

After editing run `node tools/build-commanders.js`. It validates every file and regenerates
`app/js/commanders-index.js`.
