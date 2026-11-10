'use strict';
FD.defineCommander({
  id: 'wellington',
  name: 'Wellington',
  full: 'Arthur Wellesley, 1st Duke of Wellington',
  dates: '1769–1852',
  epithet: 'Guessing the other side of the hill',
  era: 'Age of revolutions',
  tone: '#8a2320',
  selfWords: ['Duke of Wellington', 'Duke_of_Wellington', 'Arthur Wellesley', 'Arthur_Wellesley', 'Lord Wellington'],
  rivalWords: ['Waterloo', 'Torres Vedras', 'Torres_Vedras', 'Salamanca', 'Vitoria', 'Talavera', 'Assaye', 'Masséna', 'Massena', 'Soult', 'Marmont', 'Peninsular War', 'Peninsular_War'],
  theme: {
    label: 'Regency Britain',
    vars: {
      '--paper': '#ece4cc',
      '--paper-2': '#e0d6b9',
      '--paper-3': '#d2c7a5',
      '--card': '#f6f0de',
      '--ink': '#1b1a17',
      '--ink-2': '#48443a',
      '--ink-3': '#787261',
      '--rule': '#c5ba98',
      '--accent': '#8a2320',
      '--accent-soft': '#e6cdc0',
      '--green': '#2c5438',
      '--green-soft': '#d2dcc6',
      '--brass': '#8a7238',
      '--amber-soft': '#eedca2',
      '--blue': '#263a63'
    },
    band: 'linear-gradient(90deg, #1b1a17 0 42%, #8a2320 42% 58%, #1b1a17 58%)'
  },
  decisions: [
    { id: 'wellington-intelligence', category: 'intelligence', title: 'Exploring officers and the broken cipher', when: '1811–13',
      summary: "Wellington built his picture of the French from several sources at once: well-mounted exploring officers such as Colquhoun Grant, who rode in uniform behind the French armies, and Spanish guerrillas, who brought in captured couriers and dispatches. On his staff George Scovell worked on the intercepted letters and by the summer of 1812 had largely broken the Great Paris Cipher used between Joseph Bonaparte and the marshals. Reading the enemy's correspondence showed how far apart and how short of men the French armies were before Salamanca, and again in 1813.",
      cite: "Peninsular War, 1811–13; Mark Urban, The Man Who Broke Napoleon's Codes (2001)", url: 'https://en.wikipedia.org/wiki/George_Scovell' },
    { id: 'wellington-tempo', category: 'tempo', title: 'Round the French right to Vitoria', when: 'May–June 1813',
      summary: "Instead of advancing up the main road against the French river lines, Wellington sent the larger part of his army under Graham north of the Douro through the hills of Trás-os-Montes, country the French thought impassable for an army, and came down behind their right. Turned in this way again and again, the French gave up the Douro, Burgos and the line of the Ebro without a battle. In about a month the army covered several hundred miles and on 21 June beat Joseph's combined armies at Vitoria, taking almost all their guns and baggage.",
      cite: 'Battle of Vitoria, 21 June 1813', url: 'https://en.wikipedia.org/wiki/Battle_of_Vitoria' },
    { id: 'wellington-logistics', category: 'logistics', title: 'The Lines of Torres Vedras', when: '1809–11',
      summary: "In October 1809 Wellington ordered his engineers to fortify the hills north of Lisbon, and over the following year Portuguese labour built belts of redoubts across the peninsula with so little publicity that the French, and most of his own army, knew almost nothing of them. He fell back inside in October 1810 with the country in front stripped, as far as the people could be made to do it, of food and transport. Masséna judged the lines too strong to attack, stayed before them for about a month, then starved in central Portugal through the winter and retreated in March 1811 having lost, by common estimates, some 25,000 men, most of them to hunger and disease.",
      cite: 'Lines of Torres Vedras, 1809–11', url: 'https://en.wikipedia.org/wiki/Lines_of_Torres_Vedras' },
    { id: 'wellington-recovery', category: 'recovery', title: 'After the retreat from Burgos', when: '1812–13',
      summary: "The siege of Burgos failed in October 1812 for want of heavy guns, and the retreat to the Portuguese frontier in foul weather cost several thousand men, many of them stragglers, with discipline breaking down on the road. Wellington rebuked his officers in a circular, put the army into winter quarters and used the months to rest it, draw reinforcements and change its equipment, issuing tents and lighter camp kettles for the next campaign. He also accepted command of the Spanish armies. In May 1813 he marched out with roughly 80,000 allied troops for the campaign that ended at Vitoria.",
      cite: 'Siege of Burgos and retreat, September–November 1812', url: 'https://en.wikipedia.org/wiki/Siege_of_Burgos' }
  ],
  quotes: [
    { text: "All the business of war, and indeed all the business of life, is to endeavour to find out what you don't know by what you do; that's what I called \"guessing what was at the other side of the hill.\"",
      source: 'Conversation recorded by John Wilson Croker, 1852, in The Croker Papers (1884)', status: 'attested', note: "Recorded by a listener in Wellington's last weeks, not written by him." },
    { text: 'It has been a damned nice thing — the nearest run thing you ever saw in your life.', source: 'To Thomas Creevey at Brussels, 19 June 1815, in The Creevey Papers (1903)',
      status: 'attested', note: 'Reported by Creevey, who spoke with him the morning after Waterloo. "Nice" here means finely balanced. Often misquoted as "a damned close-run thing".' },
    { text: "By God! I don't think it would have done if I had not been there.", source: 'To Thomas Creevey at Brussels, 19 June 1815, in The Creevey Papers (1903)',
      status: 'attested', note: 'From the same conversation, as Creevey wrote it down.' },
    { text: 'Such a desperate action could not be fought, and such advantages could not be gained, without great loss; and I am sorry to add that ours has been immense.',
      source: 'Waterloo dispatch to Earl Bathurst, 19 June 1815', status: 'attested', note: 'The sentence opens "Your Lordship will observe that"; those words are omitted here.', url: 'https://en.wikipedia.org/wiki/Waterloo_dispatch' }
  ],
  remarks: [
    { on: 'any', text: 'I have seen worse. I have also seen a good deal better. Carry on.' },
    { on: 'any', text: 'Read it through before you form an opinion. It is a habit I recommend to my generals.' },
    { on: 'any', text: 'If you believe everything on this page, you will believe anything.' },
    { on: 'maps', text: 'A map is well enough. I should still wish to know what is on the other side of that hill.' },
    { on: 'encyclopedia', text: 'A great many facts, compiled by a great many hands. Check the dates; somebody always gets the dates wrong.' },
    { on: 'news', text: 'The newspapers again. They had me beaten every winter in the Peninsula. I was not.' },
    { on: 'search', text: 'Ten answers where one was wanted. Take the one with a source and dismiss the rest.' },
    { on: 'shopping', text: 'Buy what is needed, pay for it, and keep the receipt. An army that pays its way gets fed.' },
    { on: 'social', text: 'A deal of talk. I have found that the less one says in public, the less there is to retract.' },
    { on: 'video', text: 'I do not care for spectacle. If it instructs, watch it; if it merely cheers, we have work to do.' },
    { on: 'mail', text: 'Answer it today, and briefly. I answered mine the day it came, by candle if need be.' },
    { on: 'code', text: 'Rope, not fine harness: when something breaks, tie a knot and go on. I trust this is that sort of work.' },
    { on: 'weather', text: 'Rain. It rained all the night before Waterloo as well. One gets on with it.' },
    { on: 'money', text: 'Accounts. Good. I know of no part of war that is not, in the end, a matter of accounts.' },
    { on: 'travel', text: 'Wherever you are going, inquire first about the roads and the bread. The scenery will keep.' },
    { on: 'history', text: 'The history of a battle is like the history of a ball: everyone recalls a different evening. Read with care.' },
    { on: 'self', text: 'A page about me. I dare say it is too long, and I dare say it mentions the boots.' },
    { on: 'rival', text: 'A capable enemy. I never thought otherwise, which is why I chose my ground with some care.' }
  ],
  portrait: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" aria-hidden="true" focusable="false">' +
    '<circle cx="32" cy="32" r="30" fill="#e3d6b4"/><circle cx="32" cy="32" r="26.6" fill="none" stroke="#2a2520" stroke-opacity=".16" stroke-width=".6"/>' +
    '<path d="M10.5 53C13 45.5 20 43.5 26.5 41.5L37.5 41.5C44 43.5 51 45.5 53.5 53A30 30 0 0 1 10.5 53Z" fill="#27304a"/>' +
    '<path d="M13 50Q21 47 27 58M51 50Q43 47 37 58" fill="none" stroke="#2a2520" stroke-opacity=".4" stroke-width=".8" stroke-linecap="round"/>' +
    '<path d="M28 32L28 42.5Q32 46 36 42.5L36 32Z" fill="#e6cba6"/>' +
    '<path d="M26.8 37.2Q32 40.6 37.2 37.2L38.2 43L32 52L25.8 43Z" fill="#f7f1e3" stroke="#2a2520" stroke-opacity=".3" stroke-width=".4"/>' +
    '<path d="M27.6 40.6Q32 43 36.4 40.6M29 44.4L32 46.2L35 44.4" fill="none" stroke="#2a2520" stroke-opacity=".3" stroke-width=".6" stroke-linecap="round"/>' +
    '<path d="M24.2 38.6L27 40.2L31.4 52.4L24.4 45ZM39.8 38.6L37 40.2L32.6 52.4L39.6 45Z" fill="#1a2136"/>' +
    '<circle cx="29.6" cy="57" r=".9" fill="#a07a2c"/><circle cx="34.4" cy="57" r=".9" fill="#a07a2c"/>' +
    '<path d="M23.6 22C22.8 26 23.2 30 24.8 32.6C24.8 29 25 25.5 26 22ZM40.4 22C41.2 26 40.8 30 39.2 32.6C39.2 29 39 25.5 38 22Z" fill="#6b5a48"/>' +
    '<ellipse cx="32" cy="28" rx="8" ry="10.2" fill="#e6cba6"/><path d="M32 17.8A8 10.2 0 0 1 32 38.2A4.8 10.2 0 0 0 32 17.8Z" fill="#b98f63" fill-opacity=".38"/>' +
    '<path d="M18.6 24.4C21 13.5 27.5 6.6 33.6 6C39 7 43 14 43.2 22.8C38.5 20.6 31.5 20.2 25.6 21.8C23 22.5 20.6 23.5 18.6 24.4Z" fill="#2a2520"/>' +
    '<path d="M21.4 22C24 14 29 8.6 33.8 8C38 9.4 41 14.6 41.6 20.6" fill="none" stroke="#f7f1e3" stroke-opacity=".3" stroke-width=".7"/>' +
    '<path d="M35.6 9.6L37.4 19.4" stroke="#f7f1e3" stroke-opacity=".45" stroke-width=".9" stroke-linecap="round"/><circle cx="37.5" cy="19.6" r="1.1" fill="#a07a2c"/>' +
    '<circle cx="32" cy="32" r="29.6" fill="none" stroke="#a07a2c" stroke-width="2.2"/><circle cx="32" cy="32" r="31" fill="none" stroke="#2a2520" stroke-opacity=".35" stroke-width=".6"/></svg>'
});
