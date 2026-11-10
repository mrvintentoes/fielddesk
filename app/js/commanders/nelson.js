'use strict';
FD.defineCommander({
  id: 'nelson',
  name: 'Nelson',
  full: 'Horatio Nelson, 1st Viscount Nelson',
  dates: '1758–1805',
  epithet: 'Engage the enemy more closely',
  era: 'Age of revolutions',
  tone: '#1f3a5f',
  selfWords: ['Horatio Nelson', 'Horatio_Nelson', 'Lord Nelson', 'Admiral Nelson', 'Viscount Nelson'],
  rivalWords: ['Trafalgar', 'Battle of the Nile', 'Battle_of_the_Nile', 'Aboukir', 'Abukir', 'Villeneuve', 'Brueys', 'Battle of Copenhagen', 'Battle_of_Copenhagen', 'Cape St Vincent', 'Cape_St._Vincent', 'Santa Cruz de Tenerife'],
  theme: {
    label: 'Royal Navy',
    vars: {
      '--paper': '#e8edef',
      '--paper-2': '#dae2e6',
      '--paper-3': '#cad5db',
      '--card': '#f6f9fa',
      '--ink': '#161f2a',
      '--ink-2': '#414e5b',
      '--ink-3': '#72808c',
      '--rule': '#bac6ce',
      '--accent': '#1f3a5f',
      '--accent-soft': '#cfdbe8',
      '--green': '#23655a',
      '--green-soft': '#cfe2dd',
      '--brass': '#a88734',
      '--amber-soft': '#f0e4bf',
      '--blue': '#235a96'
    },
    band: 'linear-gradient(90deg, #1f3a5f 0 40%, #b8963c 40% 60%, #1f3a5f 60%)'
  },
  decisions: [
    { id: 'nelson-intelligence', category: 'intelligence', title: 'Searching for Bonaparte without frigates', when: 'May–August 1798',
      summary: "Sent into the Mediterranean to find the French expedition from Toulon, Nelson lost touch with his frigates when a gale dismasted his flagship in May, and had to hunt with ships of the line alone and almost no scouts. Reasoning from scraps of news that the target was Egypt, he reached Alexandria at the end of June a few days ahead of the French, found the harbour empty, and sailed away again; they landed behind him. He came back by way of Sicily and on 1 August found the fleet at anchor in Aboukir Bay, where he attacked the same evening. The guess was right and the reconnaissance was not, which cost about a month.",
      cite: 'Mediterranean campaign of 1798; Battle of the Nile, 1 August 1798', url: 'https://en.wikipedia.org/wiki/Mediterranean_campaign_of_1798' },
    { id: 'nelson-tempo', category: 'tempo', title: 'The chase to the West Indies and back', when: 'May–July 1805',
      summary: "When Villeneuve slipped out of Toulon and through the Straits, Nelson, once sure of the direction, followed across the Atlantic with about ten ships of the line against a combined fleet of nearly twice that. He reached Barbados in early June after a passage of a little over three weeks, was sent the wrong way by a false report, and then turned straight back for Europe when he learned Villeneuve had gone, sending a fast brig ahead to warn the Admiralty. He fought no battle, but the pursuit cut short the French stay in the Caribbean and the warning let Calder meet Villeneuve off Finisterre.",
      cite: 'Trafalgar campaign, 1805', url: 'https://en.wikipedia.org/wiki/Trafalgar_campaign' },
    { id: 'nelson-logistics', category: 'logistics', title: 'A healthy fleet off Toulon', when: '1803–05',
      summary: "For the better part of two years Nelson kept his fleet at sea watching Toulon with no dockyard nearer than Malta or Gibraltar. He watered and rested the ships in the sheltered anchorage of the Maddalena islands off Sardinia and sent agents round the coasts to buy bullocks, onions, wine and Sicilian lemons, treating fresh provisions as a matter for the admiral himself. The sick lists stayed remarkably short for the period, and the ships were fit to cross the Atlantic at a few days' notice in 1805.",
      cite: 'Mediterranean command, 1803–05 (Nicolas, Dispatches and Letters of Lord Nelson, vols 5–6)', url: 'https://en.wikipedia.org/wiki/Horatio_Nelson' },
    { id: 'nelson-recovery', category: 'recovery', title: 'After Tenerife', when: '1797–98',
      summary: "In July 1797 Nelson's night assault by boats on Santa Cruz de Tenerife failed with several hundred casualties, and his right arm, shattered as he stepped ashore, was amputated that night. He wrote to his commander-in-chief, with his left hand, that he expected never to be employed again. He went home, waited out a slow and painful healing, and asked for a ship as soon as the wound closed; in the spring of 1798 he rejoined the fleet off Cadiz in the Vanguard, and on 1 August he destroyed the French fleet at the Nile.",
      cite: 'Battle of Santa Cruz de Tenerife, July 1797', url: 'https://en.wikipedia.org/wiki/Battle_of_Santa_Cruz_de_Tenerife_(1797)' }
  ],
  quotes: [
    { text: 'England expects that every man will do his duty.', source: 'Signal to the fleet before Trafalgar, 21 October 1805', status: 'attested',
      note: 'Nelson asked for "England confides"; his signal lieutenant, John Pasco, suggested "expects" because it was in the signal book and need not be spelt out.', url: 'https://en.wikipedia.org/wiki/England_expects_that_every_man_will_do_his_duty' },
    { text: 'In case signals can neither be seen or perfectly understood, no captain can do very wrong if he places his ship alongside that of an enemy.',
      source: 'Memorandum to the fleet, off Cadiz, 9 October 1805', status: 'attested', note: 'The sentence begins with "But"; spelling and capitals modernised.' },
    { text: 'Was I to die this moment, "Want of Frigates" would be found stamped on my heart.', source: 'Letter to Earl Spencer, 9 August 1798', status: 'attested',
      note: 'Written a week after the Nile, about the search that preceded it.' },
    { text: 'Thank God, I have done my duty.', source: 'Dying words aboard Victory, 21 October 1805, as reported by the surgeon William Beatty, Authentic Narrative of the Death of Lord Nelson (1807)',
      status: 'attested', note: 'Reported by witnesses, who differ: Beatty has him repeat this several times; the chaplain Alexander Scott remembered the last words as "God and my country".' }
  ],
  remarks: [
    { on: 'any', text: 'Do not hover off this page. Go straight at it; something must always be left to chance.' },
    { on: 'any', text: 'I have but one good eye to give this page, and I assure you it has my whole attention.' },
    { on: 'any', text: 'A fair wind and a clear page. I ask no more, except perhaps a little glory.' },
    { on: 'maps', text: 'A chart! Show me the soundings. Where an enemy has room to swing at anchor, we have room to pass inside him.' },
    { on: 'encyclopedia', text: 'A book of all knowledge. Pray turn to my name; I should like to see how long the entry runs.' },
    { on: 'news', text: 'The gazettes! Is there a dispatch of mine in them? No? Then it is a dull day for news.' },
    { on: 'search', text: 'I searched the whole Mediterranean without a frigate to my name. You find your answer in a moment. I envy you.' },
    { on: 'shopping', text: 'Lemons, onions, fresh beef. Buy those before anything else and your people will thank you.' },
    { on: 'social', text: 'So many signals flying at once that no captain could read them. Hoist one, and make it plain.' },
    { on: 'video', text: 'A moving picture of events! Had we such a thing at the Nile, all England would have seen it by breakfast.' },
    { on: 'mail', text: 'Letters! I learned to write mine left-handed rather than miss a post. Answer them, my dear friend.' },
    { on: 'code', text: 'A signal book, I perceive. Keep it short: the best signal is the one that needs no second hoist.' },
    { on: 'weather', text: 'Watch the glass. Before Trafalgar I signalled the fleet to prepare to anchor at close of day; a gale was coming.' },
    { on: 'travel', text: 'A voyage? I was sea-sick at the start of nearly every one of mine and went all the same. Go.' },
    { on: 'sport', text: 'A contest. Then let it be decisive. I never cared for a drawn battle.' },
    { on: 'history', text: 'Old actions. Observe how often the bolder plan turned out to be the safer one.' },
    { on: 'self', text: 'A page about Nelson. I shall not pretend to be displeased. Does it give the Nile its due?' },
    { on: 'rival', text: 'A brave enemy deserves an honest account. I trust this page gives one; I should have.' }
  ],
  portrait: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" aria-hidden="true" focusable="false">' +
    '<circle cx="32" cy="32" r="30" fill="#dcdccb"/><circle cx="32" cy="32" r="26.6" fill="none" stroke="#2a2520" stroke-opacity=".16" stroke-width=".6"/>' +
    '<path d="M10.5 53C13 45.5 20 43.5 26.5 41.5L37.5 41.5C44 43.5 51 45.5 53.5 53A30 30 0 0 1 10.5 53Z" fill="#243352"/>' +
    '<path d="M26.4 41.8L32 50.5L37.6 41.8Z" fill="#f7f1e3"/>' +
    '<path d="M25 42.4L32 53L39 42.4" fill="none" stroke="#b8963c" stroke-width="1.2" stroke-linejoin="round"/>' +
    '<path d="M11.4 51C12.6 46.6 17 44.8 20.6 44.3L21.8 47.8C18.6 48.4 15.4 50.4 14 53.6ZM52.6 51C51.4 46.6 47 44.8 43.4 44.3L42.2 47.8C45.4 48.4 48.6 50.4 50 53.6Z" fill="#b8963c"/>' +
    '<path d="M12.6 52.4L12 55.4M14.4 51.2L14 54.6M16.4 50.2L16.2 53.4M47.6 50.2L47.8 53.4M49.6 51.2L50 54.6M51.4 52.4L52 55.4" stroke="#b8963c" stroke-width=".9" stroke-linecap="round"/>' +
    '<path d="M14.2 50.6C19 49.6 25 50 31.2 51.6L30.6 56.2C25 54.8 20 54.6 15.8 55.6Z" fill="#3d5280" stroke="#141c2e" stroke-opacity=".7" stroke-width=".5" stroke-linejoin="round"/>' +
    '<path d="M28.6 50.9L31.9 51.7L31.2 56.4L27.9 55.6Z" fill="#f7f1e3" stroke="#b8963c" stroke-width=".6"/>' +
    '<path d="M41.6 49.2L42.6 51.6L45 52.6L42.6 53.6L41.6 56L40.6 53.6L38.2 52.6L40.6 51.6Z" fill="#f1ede0" stroke="#2a2520" stroke-opacity=".5" stroke-width=".35"/>' +
    '<path d="M28 32L28 42.5Q32 46 36 42.5L36 32Z" fill="#e6cba6"/><path d="M28 36.5Q32 40 36 36.5L36 39Q32 42 28 39Z" fill="#b98f63" fill-opacity=".55"/>' +
    '<path d="M27.4 39.2Q32 42.4 36.6 39.2L36.6 41.6Q32 44.6 27.4 41.6Z" fill="#2a2520"/>' +
    '<path d="M23.2 22C22.2 26.5 22.8 31 24.8 33.6C24.6 29.5 24.8 25.5 25.8 22ZM40.8 22C41.8 26.5 41.2 31 39.2 33.6C39.4 29.5 39.2 25.5 38.2 22Z" fill="#cfc8b6" stroke="#2a2520" stroke-opacity=".3" stroke-width=".3"/>' +
    '<ellipse cx="32" cy="28" rx="8" ry="10.2" fill="#e6cba6"/><path d="M32 17.8A8 10.2 0 0 1 32 38.2A4.8 10.2 0 0 0 32 17.8Z" fill="#b98f63" fill-opacity=".38"/>' +
    '<path d="M27 5.8L32 14M29.5 4.6L32 14M32 4.2L32 14M34.5 4.6L32 14M37 5.8L32 14" fill="none" stroke="#2a2520" stroke-opacity=".5" stroke-width="1.7" stroke-linecap="round"/>' +
    '<path d="M27 5.8L32 14M29.5 4.6L32 14M32 4.2L32 14M34.5 4.6L32 14M37 5.8L32 14" fill="none" stroke="#f7f3e6" stroke-width="1" stroke-linecap="round"/>' +
    '<path d="M10.6 24.4C15 14 25 10.4 32 10.4C39 10.4 49 14 53.4 24.4C46 21.4 40 20.6 32 20.6C24 20.6 18 21.4 10.6 24.4Z" fill="#1e2433"/>' +
    '<path d="M13.4 20.6C18 14.6 25.4 11.8 32 11.8C38.6 11.8 46 14.6 50.6 20.6" fill="none" stroke="#b8963c" stroke-width="1"/>' +
    '<circle cx="32" cy="15.4" r="2.2" fill="#f1ede0" stroke="#2a2520" stroke-opacity=".5" stroke-width=".4"/><circle cx="32" cy="15.4" r=".9" fill="#b8963c"/>' +
    '<circle cx="32" cy="32" r="29.6" fill="none" stroke="#a07a2c" stroke-width="2.2"/><circle cx="32" cy="32" r="31" fill="none" stroke="#2a2520" stroke-opacity=".35" stroke-width=".6"/></svg>'
});
