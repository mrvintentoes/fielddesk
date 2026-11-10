window.FD = window.FD || {};

/*
 * Field Desk - first-run scenario "Fog of War: Ulm, October 1805".
 * Pure data plus one pure function (map) that returns an SVG string.
 *
 * kind:'sourced'    = a historical claim backed by the numbered sources in refs.
 * kind:'assumption' = a scenario simplification, a judgement about what Mack
 *                     knew and when, or a counterfactual.
 * All strengths and losses are approximate; the sources disagree.
 */
(function () {
  'use strict';

  var ULM = {
    title: 'Fog of War: Ulm, October 1805',

    role: "You are Feldmarschall-Leutnant Karl Mack, chief of staff of the Austrian army in Bavaria. The young Archduke Ferdinand holds the command in name; the Emperor's confidence, and so the real decision, is yours.",

    premise: "Austria has gone to war with France in alliance with Russia, and your army has pushed forward to Ulm on the upper Danube to await the Russians. You expected the French to come at you from the west, through the Black Forest, as they always have. Over a few days in early October the reports stop fitting that picture.",

    stages: [
      {
        id: 's1',
        label: 'The picture from Ulm',
        date: 'To 6 October 1805',
        intro: "This is the situation as it could reasonably be read at your headquarters in the first days of October. Nothing here is hindsight.",
        intel: [
          {
            text: "Your army, very roughly 70,000 men by most counts, stands around Ulm and south along the Iller, facing west toward the exits of the Black Forest. A detached corps under Kienmayer watches the Danube downstream toward Ingolstadt, far out on your right.",
            kind: 'sourced', refs: [1, 10, 11],
            note: 'Strength figures for the army in Bavaria vary from source to source.'
          },
          {
            text: "French cavalry is showing itself in the Black Forest passes to your west, on the roads French armies used in earlier wars.",
            kind: 'sourced', refs: [1, 10],
            note: 'The cavalry demonstration is well attested; how much weight Mack gave it day by day is reconstructed by historians.'
          },
          {
            text: "Kutuzov's Russian army is marching across the Habsburg lands to join you. Its leading troops cannot be on the Inn, far to your east, before the middle of October, and the whole army not until later in the month.",
            kind: 'sourced', refs: [1, 11],
            note: 'Accounts differ on the exact dates of the Russian arrival on the Inn.'
          },
          {
            text: "Reports speak of strong French columns marching east through W\u00fcrttemberg and Franconia, well to the north of you and beyond your right flank.",
            kind: 'sourced', refs: [1, 9, 10],
            note: 'The marches are fact. How complete the reports reaching Ulm were, and on which day, is our simplification.'
          },
          {
            text: "French troops are said to have marched straight through the Prussian territory of Ansbach in the first days of October. You had counted on neutral Prussian ground to cover your northern flank.",
            kind: 'sourced', refs: [1, 10, 11],
            note: 'Bernadotte and Marmont crossed Ansbach territory in the days from about 3 October. That Mack relied on Prussian neutrality is the usual reading of the histories; when word reached Ulm is our guess.'
          },
          {
            text: "You have no reliable count of the French army in Germany, and no certainty which of these movements is the main effort and which is a screen.",
            kind: 'assumption', refs: [],
            note: 'A scenario summary of Mack\u2019s uncertainty, not a documented statement of his.'
          }
        ]
      },
      {
        id: 's2',
        label: 'The Danube is crossed',
        date: '7\u20138 October 1805',
        intro: "Within two days the reports from your right turn from rumour into events. They arrive late, piecemeal, and partly through fugitives.",
        intel: [
          {
            text: "On 7 October French troops force crossings of the Danube at and around Donauw\u00f6rth, roughly 70 km downstream of Ulm. They are now on the south bank, behind your right.",
            kind: 'sourced', refs: [1, 2, 10],
            note: 'The crossings are sourced. How quickly and how fully they were reported at Ulm is our simplification.'
          },
          {
            text: "Kienmayer, too weak to hold the river line, is falling back away from you, east and south-east toward Munich.",
            kind: 'sourced', refs: [1, 2],
            note: 'The withdrawal is sourced. What Mack knew of it on these days is our simplification.'
          },
          {
            text: "On 8 October Auffenberg's division, sent toward the threatened flank, is caught at Wertingen by French cavalry and infantry and loses roughly half its strength, most of it as prisoners.",
            kind: 'sourced', refs: [2, 1],
            note: 'The action is sourced. That you know its full scale by the night of the 8th is our assumption.'
          },
          {
            text: "French troops are reported heading for Augsburg and the line of the Lech, across your road to the east.",
            kind: 'sourced', refs: [1, 9],
            note: 'The French were in Augsburg by about 9 October. How much of this Mack had been told on the 8th is our guess.'
          },
          {
            text: "Ulm's defences are unfinished, and the army around it has been marched hard in bad weather on short supplies.",
            kind: 'sourced', refs: [9, 11],
            note: 'A general characterisation drawn from the campaign histories, not a single dated report.'
          },
          {
            text: "The west has stayed quiet. The cavalry in the Black Forest has not come on, and nobody can tell you whether anything stands behind it.",
            kind: 'assumption', refs: [],
            note: 'A scenario summary of the picture at headquarters.'
          }
        ]
      },
      {
        id: 's3',
        label: 'Your move',
        date: 'Night of 8\u20139 October 1805',
        intro: "The enemy is on your line of retreat in unknown strength. You must decide tonight what the army does at daybreak, on what you know and no more.",
        intel: [
          {
            text: "You do not know how many French are across the Danube, or where their main body is. It may be a strong detachment sent to frighten you out of Ulm, or the whole army.",
            kind: 'assumption', refs: []
          },
          {
            text: "You do not know whether the north bank between Ulm and Donauw\u00f6rth is held in strength or merely passed over by columns that have since moved on.",
            kind: 'assumption', refs: []
          },
          {
            text: "The Russians are still at least a fortnight from any place where they could help you, and the Inn itself lies more than 200 km to your east.",
            kind: 'sourced', refs: [1, 11],
            note: 'Arrival dates vary between accounts; what Mack was told about Russian progress is our simplification.'
          },
          {
            text: "Archduke Ferdinand, your commander in name, and several of your generals do not trust your judgement. The decision is nonetheless yours.",
            kind: 'sourced', refs: [7, 1],
            note: 'The divided command is well attested; the quarrel sharpened in the days that followed.'
          }
        ]
      }
    ],

    options: [
      {
        id: 'east',
        label: 'Break out east along the south bank',
        summary: "March the whole army down the south bank toward Augsburg and the Lech, and fight through to Kienmayer, Munich and the road by which the Russians are coming.",
        risk: "It is the shortest way home, and so the road an enemy who has crossed at Donauw\u00f6rth is most likely to be standing on."
      },
      {
        id: 'north',
        label: 'Cross to the north bank and march north-east',
        summary: "Cross the Danube at Ulm and G\u00fcnzburg and march toward N\u00f6rdlingen and Bohemia, cutting across the roads the French themselves have just used.",
        risk: "You give up Bavaria and the direct road to Vienna, and you do not know what the French have left on that bank."
      },
      {
        id: 'south',
        label: 'Slip south toward the Tyrol',
        summary: "Go up the Iller by Memmingen into the mountains, to join the Austrian forces in the Tyrol and keep the army in being.",
        risk: "You leave the Danube valley and the Russians to their fate, on poor mountain roads with winter coming."
      },
      {
        id: 'stand',
        label: 'Stand at Ulm and wait for the Russians',
        summary: "Hold the army together around Ulm, astride the river, and make the French come to you until Kutuzov arrives in their rear.",
        risk: "If the French are in strength and the Russians are late, every day you wait closes another road."
      }
    ],

    outcome: {
      summary: "Mack did a little of each and none of it fully. He tried twice to move by the north bank, drew back both times, sent detachments off in different directions, and then persuaded himself that it was Napoleon who was retreating. By 15 October the French ringed Ulm; Mack signed a capitulation on the 17th and on 20 October roughly 25,000 men laid down their arms.",
      timeline: [
        {
          date: '9 October',
          text: "Ney's corps attacks the Danube bridges at G\u00fcnzburg and wins a crossing there, just as Mack is preparing to pass the army to the north bank there. The Austrians fall back on Ulm.",
          refs: [3, 1], kind: 'sourced'
        },
        {
          date: '9\u201310 October',
          text: "French corps fill the country between the Lech and Ulm and occupy Augsburg. Bernadotte, with Davout in support, turns east toward Munich to hold off the Russians.",
          refs: [1, 10], kind: 'sourced'
        },
        {
          date: '11 October',
          text: "At Haslach-Jungingen an Austrian push along the north bank meets Dupont's single division, left isolated there. Outnumbered several times over, it holds through the day and withdraws at night. The fight showed how thinly the north bank was held.",
          refs: [4, 1, 10], kind: 'sourced'
        },
        {
          date: '12\u201313 October',
          text: "Orders and counter-orders. Werneck's corps is sent north-east toward Heidenheim, Riesch to hold the bridge at Elchingen, Jella\u010di\u0107 south toward the Vorarlberg. Napoleon, seeing the gap on the north bank, turns his corps back toward Ulm.",
          refs: [1, 5, 9], kind: 'sourced'
        },
        {
          date: 'About 13 October',
          text: "Mack convinces himself that Napoleon is retreating toward the Rhine, on rumours of a British landing and of trouble in France. Tradition credits the French spy Schulmeister with planting the story; how much he really did is disputed.",
          refs: [8, 1, 10], kind: 'sourced'
        },
        {
          date: '14 October',
          text: "Ney forces the bridge at Elchingen, beats Riesch and closes the north bank. At about the same time (13 or 14 October; accounts differ) Soult takes Memmingen and its garrison, shutting the road south.",
          refs: [5, 1], kind: 'sourced'
        },
        {
          date: '14\u201318 October',
          text: "Archduke Ferdinand leaves Ulm for the north-east with a body of cavalry. Murat runs down Werneck's corps, which surrenders at Trochtelfingen about 18 October; Ferdinand reaches Bohemia with a remnant.",
          refs: [1, 6], kind: 'sourced'
        },
        {
          date: '15\u201317 October',
          text: "The French take the heights overlooking Ulm and bring guns to bear on the town. On the 17th Mack signs a capitulation, at first to take effect on 25 October if no relief has arrived by then.",
          refs: [6, 1, 10], kind: 'sourced'
        },
        {
          date: '20 October',
          text: "Persuaded that no relief can come, Mack gives up early. Roughly 25,000 men march out of Ulm and lay down their arms; with the detachments taken elsewhere, most of the army that entered Bavaria is lost. Jella\u010di\u0107 gets away south, only to capitulate in the Vorarlberg in November.",
          refs: [1, 6], kind: 'sourced'
        }
      ],
      verdicts: {
        east: {
          headline: 'Into the mass of the Grande Arm\u00e9e',
          text: "This is the move Napoleon expected, and he arranged his corps between the Lech and Ulm to meet it. A march on Augsburg would likely have ended in a battle against much greater numbers with the Danube at the army's back. Many historians judge that only an immediate march, before the French had closed up, gave it any chance, and probably not a good one.",
          kind: 'assumption', refs: [1, 10, 11]
        },
        north: {
          headline: 'Probably the best chance, at a price',
          text: "For several days the north bank was the weak point of the French net; on 11 October a single division was all that stood there. Many historians judge that a prompt march by the whole army would likely have saved a large part of it and embarrassed the French supply lines. It would still have been a pursuit, and the fate of Werneck's infantry shows what Murat's cavalry could do to a column caught on the road.",
          kind: 'assumption', refs: [4, 1, 10, 9]
        },
        south: {
          headline: 'An army saved, a campaign abandoned',
          text: "The road by Memmingen stayed open until about 13 or 14 October, and Jella\u010di\u0107's corps did get away along it. The army would likely have survived for the moment, but shut up in the mountains, with the Danube road to Vienna uncovered and Kutuzov left to face the French alone. Jella\u010di\u0107's capitulation in November suggests the refuge was not a lasting one.",
          kind: 'assumption', refs: [1, 11]
        },
        stand: {
          headline: 'Close to what happened',
          text: "Standing only works if relief can arrive, and the Russians were weeks away. With unfinished works and thin supplies, an army held at Ulm was likely to be surrounded and starved or stormed, as it very nearly was. Most historians judge this the worst of the four, which is why Mack's drift into it is the centre of the story.",
          kind: 'assumption', refs: [1, 6, 10]
        }
      },
      historicalChoice: "On our reading, which is a judgement and not a sourced fact, Mack's conduct most resembled a hesitant 'north' that kept collapsing into 'stand': he began the north-bank move on the 9th and again on the 11th, abandoned it both times, and ended by waiting in Ulm. He also sent one corps south, so a fragment of 'south' was tried as well."
    },

    assumptions: [
      "The decision is fixed on the night of 8\u20139 October. In reality Mack revised his plans almost daily between the 7th and the 14th, and there was no single moment of choice.",
      "The four options are tidy versions of courses that were discussed or partly attempted. The real alternatives overlapped, and Mack mixed them.",
      "You decide alone. In fact command was split between Mack and Archduke Ferdinand, with other generals objecting, and that quarrel shaped what the army did.",
      "What Mack knew, and on which day he knew it, is reconstructed from secondary accounts. Reports reached Ulm late and garbled; the stages here are cleaner than his real picture.",
      "All strengths and losses are approximate. The sources disagree, sometimes by thousands.",
      "The verdicts on the roads not taken are judgements about what might have happened, not facts, and historians do not all agree on them.",
      "The map is a schematic. Distances, river courses and unit positions are simplified, and it is not to scale."
    ],

    sources: [
      { n: 1, title: 'Ulm campaign', author: 'Wikipedia', year: '', kind: 'web',
        url: 'https://en.wikipedia.org/wiki/Ulm_campaign',
        note: 'Overview of the whole campaign, with strengths and a day-by-day outline. A starting point; check its figures against the print histories.' },
      { n: 2, title: 'Battle of Wertingen', author: 'Wikipedia', year: '', kind: 'web',
        url: 'https://en.wikipedia.org/wiki/Battle_of_Wertingen',
        note: 'The French crossing at Donauw\u00f6rth, Kienmayer\u2019s withdrawal and the destruction of Auffenberg\u2019s division on 8 October.' },
      { n: 3, title: 'Battle of G\u00fcnzburg', author: 'Wikipedia', year: '', kind: 'web',
        url: 'https://en.wikipedia.org/wiki/Battle_of_G%C3%BCnzburg',
        note: 'Ney\u2019s fight for the G\u00fcnzburg bridges on 9 October and what Mack was attempting there.' },
      { n: 4, title: 'Battle of Haslach-Jungingen', author: 'Wikipedia', year: '', kind: 'web',
        url: 'https://en.wikipedia.org/wiki/Battle_of_Haslach-Jungingen',
        note: 'Dupont\u2019s isolated division on the north bank, 11 October, with the range of strength estimates.' },
      { n: 5, title: 'Battle of Elchingen', author: 'Wikipedia', year: '', kind: 'web',
        url: 'https://en.wikipedia.org/wiki/Battle_of_Elchingen',
        note: 'Ney\u2019s victory of 14 October and the Austrian dispositions on the days before it.' },
      { n: 6, title: 'Battle of Ulm', author: 'Wikipedia', year: '', kind: 'web',
        url: 'https://en.wikipedia.org/wiki/Battle_of_Ulm',
        note: 'The investment of Ulm, the capitulation of 17 October and the surrender on the 20th.' },
      { n: 7, title: 'Karl Mack von Leiberich', author: 'Wikipedia', year: '', kind: 'web',
        url: 'https://en.wikipedia.org/wiki/Karl_Mack_von_Leiberich',
        note: 'Mack\u2019s career, his position beside Archduke Ferdinand, and his court martial afterwards.' },
      { n: 8, title: 'Charles Louis (Karl) Schulmeister', author: 'Wikipedia', year: '', kind: 'web',
        url: 'https://en.wikipedia.org/wiki/Special:Search/Charles_Louis_Schulmeister',
        note: 'The link is a Wikipedia title lookup, since the article is filed under the French form of his name. The spy traditionally credited with deceiving Mack. Much of the story rests on later, colourful accounts; treat it with caution.' },
      { n: 9, title: 'The Ulm Campaign, 1805', author: 'F. N. Maude', year: '1912', kind: 'web',
        url: 'https://archive.org/search?query=Maude+%22Ulm+Campaign%22+1805',
        note: 'Public-domain staff history with detailed marches and orders. Dated in its judgements, useful for the sequence of movements. The link is a search of the Internet Archive, not a specific scan.' },
      { n: 10, title: 'The Campaigns of Napoleon', author: 'David G. Chandler', year: '1966', kind: 'print',
        url: '',
        note: 'The standard English narrative of the French manoeuvre and of Napoleon\u2019s expectations of Mack.' },
      { n: 11, title: 'The End of the Old Order: Napoleon and Europe, 1801\u20131805', author: 'Frederick W. Kagan', year: '2006', kind: 'print',
        url: '',
        note: 'The fullest modern account of Austrian and Russian planning, and the most sympathetic to Mack\u2019s difficulties.' }
    ],

    map: function (stage, choice) {
      stage = parseInt(stage, 10);
      if (!(stage >= 1 && stage <= 4)) { stage = 1; }
      if (['east', 'north', 'south', 'stand'].indexOf(choice) === -1) { choice = null; }

      var PAPER = '#f4ecdd', INK = '#2a2520', RIVER = '#5b7c99', FR = '#2f4a6b',
          OCHRE = '#c9973f', ROUTE = '#a4472c', MUTED = '#6f6557';
      var FONT = 'Iowan Old Style, Palatino Linotype, Palatino, Georgia, serif';
      var o = [];

      function esc(s) {
        return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      }
      // Text with a paper-coloured halo so labels stay readable over lines.
      function T(x, y, s, opt) {
        opt = opt || {};
        o.push('<text x="' + x + '" y="' + y + '" font-size="' + (opt.size || 12) + '"' +
          ' text-anchor="' + (opt.anchor || 'start') + '"' +
          (opt.italic ? ' font-style="italic"' : '') +
          (opt.bold ? ' font-weight="700"' : '') +
          (opt.spacing ? ' letter-spacing="' + opt.spacing + '"' : '') +
          (opt.rotate ? ' transform="rotate(' + opt.rotate + ' ' + x + ' ' + y + ')"' : '') +
          ' fill="' + (opt.fill || INK) + '" stroke="' + PAPER + '" stroke-width="3.5"' +
          ' stroke-linejoin="round" paint-order="stroke">' + esc(s) + '</text>');
      }
      function town(x, y, name, lx, ly, opt) {
        o.push('<circle cx="' + x + '" cy="' + y + '" r="3.2" fill="' + PAPER + '" stroke="' + INK + '" stroke-width="1.5"/>');
        T(lx, ly, name, opt);
      }
      // Unit markers, centred on (x, y).
      function austrian(x, y, big) {
        var w = big ? 32 : 26, h = big ? 20 : 16;
        o.push('<rect x="' + (x - w / 2) + '" y="' + (y - h / 2) + '" width="' + w + '" height="' + h +
          '" rx="2" fill="' + OCHRE + '" stroke="' + INK + '" stroke-width="1.6"/>' +
          '<path d="M' + (x - w / 2) + ' ' + (y + h / 2) + ' L' + (x + w / 2) + ' ' + (y - h / 2) +
          '" stroke="#fffaf0" stroke-width="2.2"/>' +
          '<rect x="' + (x - w / 2) + '" y="' + (y - h / 2) + '" width="' + w + '" height="' + h +
          '" rx="2" fill="none" stroke="' + INK + '" stroke-width="1.6"/>');
      }
      function french(x, y) {
        o.push('<rect x="' + (x - 13) + '" y="' + (y - 8) + '" width="26" height="16" rx="2" fill="' + FR +
          '" stroke="' + INK + '" stroke-width="1.2"/>');
      }
      function reported(x, y) {
        o.push('<rect x="' + (x - 13) + '" y="' + (y - 8) + '" width="26" height="16" rx="2" fill="' + PAPER +
          '" stroke="' + FR + '" stroke-width="1.8" stroke-dasharray="4 3"/>' +
          '<text x="' + x + '" y="' + (y + 4.5) + '" font-size="13" font-weight="700" text-anchor="middle" fill="' + FR + '">?</text>');
      }
      function clash(x, y) {
        var pts = [], i, r, a;
        for (i = 0; i < 16; i++) {
          r = (i % 2) ? 4 : 9.5;
          a = Math.PI * i / 8;
          pts.push((x + r * Math.sin(a)).toFixed(1) + ',' + (y - r * Math.cos(a)).toFixed(1));
        }
        o.push('<polygon points="' + pts.join(' ') + '" fill="' + ROUTE + '" stroke="' + PAPER + '" stroke-width="1"/>');
      }
      // Quadratic arrow with a hand-drawn head (no marker ids needed).
      function arrow(x0, y0, cx, cy, x1, y1, opt) {
        opt = opt || {};
        var w = opt.width || 2, col = opt.color || INK, op = opt.opacity == null ? 1 : opt.opacity;
        var a = Math.atan2(y1 - cy, x1 - cx), hl = opt.head || (w * 2.6 + 5), hw = hl * 0.5;
        var bx = x1 - hl * Math.cos(a), by = y1 - hl * Math.sin(a);
        var p1 = (bx - hw * Math.sin(a)).toFixed(1) + ',' + (by + hw * Math.cos(a)).toFixed(1);
        var p2 = (bx + hw * Math.sin(a)).toFixed(1) + ',' + (by - hw * Math.cos(a)).toFixed(1);
        o.push('<g opacity="' + op + '"><path d="M' + x0 + ' ' + y0 + ' Q' + cx + ' ' + cy + ' ' +
          bx.toFixed(1) + ' ' + by.toFixed(1) + '" fill="none" stroke="' + col + '" stroke-width="' + w + '"' +
          (opt.dash ? ' stroke-dasharray="' + opt.dash + '"' : '') + ' stroke-linecap="round"/>' +
          '<polygon points="' + x1 + ',' + y1 + ' ' + p1 + ' ' + p2 + '" fill="' + col + '"/></g>');
      }

      o.push('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 440" role="img" font-family="' + FONT + '"' +
        ' aria-label="Schematic map of the upper Danube around Ulm, October 1805">');
      o.push('<rect x="0" y="0" width="720" height="440" fill="' + PAPER + '"/>');
      o.push('<rect x="6" y="6" width="708" height="428" fill="none" stroke="' + INK + '" stroke-width="1" opacity="0.35"/>');

      // Black Forest: hatched band on the far left edge.
      var i, hy;
      for (i = 0; i < 21; i++) {
        hy = 128 + i * 9;
        o.push('<path d="M14 ' + (hy + 10) + ' L36 ' + hy + '" stroke="' + MUTED + '" stroke-width="1.2" opacity="0.55"/>');
      }
      T(52, 222, 'BLACK FOREST', { size: 11, rotate: -90, anchor: 'middle', fill: MUTED, spacing: 2 });

      // Rivers.
      o.push('<g fill="none" stroke="' + RIVER + '" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M8 322 Q150 305 270 262 Q340 240 400 216 Q460 185 500 150 Q540 136 600 127 L712 113" stroke-width="5"/>' +
        '<path d="M292 432 Q296 350 270 262" stroke-width="3"/>' +
        '<path d="M562 432 Q556 300 548 268 Q538 200 532 140" stroke-width="3"/>' +
        '</g>');
      T(128, 300, 'Danube', { size: 12, italic: true, fill: RIVER, rotate: -11 });
      T(303, 412, 'Iller', { size: 12, italic: true, fill: RIVER });
      T(566, 372, 'Lech', { size: 12, italic: true, fill: RIVER });

      // Edge labels.
      T(700, 34, 'to Bohemia', { size: 12, italic: true, anchor: 'end', fill: MUTED });
      arrow(660, 44, 680, 40, 702, 42, { width: 1.4, color: MUTED });
      T(696, 280, 'to the Inn and', { size: 12, italic: true, anchor: 'end', fill: MUTED });
      T(696, 295, 'the Russians', { size: 12, italic: true, anchor: 'end', fill: MUTED });
      arrow(676, 304, 690, 304, 706, 304, { width: 1.4, color: MUTED });
      T(318, 428, 'to the Tyrol', { size: 12, italic: true, fill: MUTED });
      T(18, 428, 'Schematic, not to scale', { size: 11, italic: true, fill: MUTED });

      // North arrow.
      o.push('<path d="M30 60 L30 26" stroke="' + INK + '" stroke-width="1.6"/>' +
        '<polygon points="30,18 25,30 35,30" fill="' + INK + '"/>');
      T(30, 76, 'N', { size: 12, anchor: 'middle', bold: true });

      // Routes (stage 3 and 4), drawn under the towns and markers.
      if (stage >= 3) {
        var routes = {
          east: function (on) {
            arrow(290, 270, 400, 276, 522, 268, on);
            T(425, 263, 'east', { size: 11, italic: true, anchor: 'middle', fill: ROUTE });
          },
          north: function (on) {
            arrow(275, 247, 285, 160, 424, 97, on);
            T(302, 150, 'north-east', { size: 11, italic: true, anchor: 'end', fill: ROUTE });
          },
          south: function (on) {
            arrow(262, 278, 256, 340, 271, 408, on);
            T(250, 340, 'south', { size: 11, italic: true, anchor: 'end', fill: ROUTE });
          },
          stand: function (on) {
            o.push('<circle cx="270" cy="262" r="27" fill="none" stroke="' + ROUTE + '" stroke-width="' +
              (on.width > 3 ? 4 : 2) + '" opacity="' + on.opacity + '"' + (on.width > 3 ? '' : ' stroke-dasharray="5 4"') + '/>');
          }
        };
        var ids = ['east', 'north', 'south', 'stand'], k;
        for (k = 0; k < ids.length; k++) {
          if (choice === null) {
            routes[ids[k]]({ width: 2.5, color: ROUTE, opacity: 0.4, dash: '7 5' });
          } else if (choice === ids[k]) {
            routes[ids[k]]({ width: 5, color: ROUTE, opacity: 1 });
          }
        }
      }

      // Towns.
      town(110, 100, 'Stuttgart', 118, 104);
      town(440, 82, 'N\u00f6rdlingen', 448, 78);
      town(500, 150, 'Donauw\u00f6rth', 492, 140, { anchor: 'end' });
      town(672, 118, 'Ingolstadt', 676, 104, { anchor: 'middle' });
      town(400, 216, 'G\u00fcnzburg', 406, 238);
      town(548, 268, 'Augsburg', 541, 289, { anchor: 'end' });
      town(682, 350, 'Munich', 682, 369, { anchor: 'middle' });
      town(258, 226, 'Haslach', 250, 224, { anchor: 'end' });
      town(318, 234, 'Elchingen', 324, 215);
      town(291, 378, 'Memmingen', 300, 384);
      town(492, 214, 'Wertingen', 492, 234, { anchor: 'middle' });
      T(248, 296, 'Ulm', { size: 14, bold: true, anchor: 'end' });

      // Austrian main army at Ulm (all stages).
      austrian(270, 262, true);
      T(248, 311, stage < 4 ? 'Mack: main army' : 'Mack: shut in', { size: 11, italic: true, anchor: 'end' });

      if (stage === 1) {
        austrian(312, 330);
        T(330, 334, 'Iller line', { size: 11, italic: true });
        austrian(602, 158);
        T(602, 182, 'Kienmayer', { size: 11, italic: true, anchor: 'middle' });
        french(76, 250);
        T(94, 254, 'French cavalry', { size: 11, italic: true, fill: FR });
        reported(200, 150);
        reported(332, 96);
        reported(585, 66);
        T(332, 80, 'columns reported', { size: 11, italic: true, anchor: 'middle', fill: FR });
        T(585, 90, 'through Ansbach?', { size: 11, italic: true, anchor: 'middle', fill: FR });
      }

      if (stage === 2 || stage === 3) {
        austrian(312, 330);
        T(330, 334, 'Iller line', { size: 11, italic: true });
        // Black Forest screen is now in doubt.
        reported(76, 250);
        T(94, 254, 'still there?', { size: 11, italic: true, fill: FR });
        reported(200, 150);
        reported(332, 96);
        // The crossings.
        french(514, 112);
        french(506, 172);
        arrow(514, 122, 512, 140, 509, 160, { width: 1.8, color: FR, head: 8 });
        T(532, 108, 'French cross, 7 Oct', { size: 11, italic: true, fill: FR });
        clash(492, 214);
        T(492, 247, '8 Oct', { size: 11, italic: true, anchor: 'middle', fill: ROUTE });
        // Kienmayer falls back east.
        austrian(604, 204);
        T(604, 190, 'Kienmayer', { size: 11, italic: true, anchor: 'middle' });
        arrow(620, 212, 640, 222, 658, 240, { width: 2, color: INK, head: 9 });
        reported(588, 252);
      }

      if (stage === 4) {
        // The net as it actually closed.
        french(372, 178); T(390, 182, 'Ney', { size: 11, italic: true, fill: FR });
        french(392, 296); T(410, 300, 'Lannes, Murat', { size: 11, italic: true, fill: FR });
        french(338, 322); T(356, 326, 'Marmont', { size: 11, italic: true, fill: FR });
        french(338, 356); T(356, 360, 'Soult', { size: 11, italic: true, fill: FR });
        french(588, 252); T(606, 250, 'Napoleon', { size: 11, italic: true, fill: FR });
        french(612, 326); T(612, 350, 'Bernadotte, Davout', { size: 11, italic: true, anchor: 'middle', fill: FR });
        // Dated actions.
        clash(258, 226); T(250, 210, '11 Oct', { size: 11, italic: true, anchor: 'end', fill: ROUTE });
        clash(318, 234); T(324, 201, '14 Oct', { size: 11, italic: true, fill: ROUTE });
        clash(291, 378); T(300, 398, '14 Oct', { size: 11, italic: true, fill: ROUTE });
        clash(492, 214); T(492, 247, '8 Oct', { size: 11, italic: true, anchor: 'middle', fill: ROUTE });
        // The pieces that got away, for a time.
        austrian(200, 366);
        T(182, 370, 'Jella\u010di\u0107', { size: 11, italic: true, anchor: 'end' });
        arrow(200, 376, 201, 390, 203, 404, { width: 2, color: INK, head: 9 });
        austrian(604, 204);
        T(604, 190, 'Kienmayer', { size: 11, italic: true, anchor: 'middle' });
        arrow(620, 212, 640, 222, 658, 240, { width: 2, color: INK, head: 9 });
      }

      // Legend.
      o.push('<g transform="translate(590 386)">' +
        '<rect x="0" y="0" width="16" height="10" rx="1.5" fill="' + OCHRE + '" stroke="' + INK + '" stroke-width="1.2"/>' +
        '<rect x="0" y="15" width="16" height="10" rx="1.5" fill="' + FR + '" stroke="' + INK + '" stroke-width="1"/>' +
        '<rect x="0" y="30" width="16" height="10" rx="1.5" fill="' + PAPER + '" stroke="' + FR + '" stroke-width="1.4" stroke-dasharray="3 2"/>' +
        '</g>');
      T(612, 395, 'Austrian', { size: 11 });
      T(612, 410, 'French, located', { size: 11 });
      T(612, 425, 'French, reported', { size: 11 });

      o.push('</svg>');
      return o.join('');
    }
  };

  window.FD.ULM = ULM;
}());
