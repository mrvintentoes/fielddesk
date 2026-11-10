'use strict';
FD.defineCommander({
  id: 'suvorov',
  name: 'Suvorov',
  full: 'Alexander Vasilyevich Suvorov',
  dates: '1730–1800',
  epithet: 'The eye, speed and the onslaught',
  era: 'Age of revolutions',
  tone: '#2a4f3e',
  selfWords: ['Suvorov', 'Suworow', 'Souvorov'],
  rivalWords: ['Izmail', 'Rymnik', 'Trebbia', 'Battle of Novi', 'Battle_of_Novi', 'Masséna', 'Massena', 'Macdonald', 'Moreau', 'Joubert', 'Gotthard'],
  theme: {
    label: 'Imperial Russia',
    vars: {
      '--paper': '#eef1ee',
      '--paper-2': '#e1e7e2',
      '--paper-3': '#d1dad4',
      '--card': '#f9fbf9',
      '--ink': '#1c2420',
      '--ink-2': '#47534c',
      '--ink-3': '#78837c',
      '--rule': '#c2ccc5',
      '--accent': '#2a4f3e',
      '--accent-soft': '#d2e0d7',
      '--green': '#1f6072',
      '--green-soft': '#d0e2e6',
      '--brass': '#b8691f',
      '--amber-soft': '#f2e2c6',
      '--blue': '#3a4c8a'
    },
    band: 'linear-gradient(90deg, #1c2420 0 20%, #c4701f 20% 40%, #1c2420 40% 60%, #c4701f 60% 80%, #1c2420 80%)'
  },
  decisions: [
    { id: 'suvorov-intelligence', category: 'intelligence', title: 'Rehearsing Izmail on a copy of its wall', when: 'December 1790',
      summary: "Sent to take the Ottoman fortress of Izmail on the Danube after other commanders had given up the siege, Suvorov spent little more than a week on preparation before storming it. He reconnoitred the works himself and had a ditch and rampart like those of the fortress dug out of sight of the garrison, where the troops practised by night with fascines and scaling ladders. The assault before dawn on 22 December (11 December Old Style) carried the walls in columns from several sides at once; the loss of life in the town was very heavy.",
      cite: 'Siege of Izmail, December 1790', url: 'https://en.wikipedia.org/wiki/Siege_of_Izmail' },
    { id: 'suvorov-tempo', category: 'tempo', title: 'The forced march to the Trebbia', when: 'June 1799',
      summary: "With Macdonald's French army coming up from the south of Italy to join Moreau, Suvorov left a covering force and drove his Russians and Austrians east from Alessandria to meet Macdonald first. The usual figure is roughly 80 km in about a day and a half in summer heat, with many men falling out on the road. He attacked off the march on the Tidone and fought for three days along the Trebbia, 17–19 June; Macdonald retreated with heavy loss and the two French armies were kept apart.",
      cite: 'Battle of the Trebbia, 17–19 June 1799', url: 'https://en.wikipedia.org/wiki/Battle_of_Trebbia_(1799)' },
    { id: 'suvorov-logistics', category: 'logistics', title: 'No mules at Taverne', when: 'September 1799',
      summary: "A cautionary case. Suvorov's plan to cross the St Gotthard into Switzerland depended on some 1,400 pack mules that his Austrian allies were to have waiting at Taverne. When he arrived in mid-September they were not there, and about five days went by while animals were collected and, by the usual account, roughly 1,500 Cossack horses were turned into pack animals. The delay mattered: he forced the pass on 24 September, and Masséna beat Korsakov at Zurich on the 25th and 26th, before the two Russian forces could combine.",
      cite: "Suvorov's Swiss campaign, September 1799", url: 'https://en.wikipedia.org/wiki/Suvorov%27s_Swiss_campaign' },
    { id: 'suvorov-recovery', category: 'recovery', title: 'Out of the trap over the Panixer', when: 'Sept–Oct 1799',
      summary: "In the Muota valley Suvorov learned that Korsakov had been beaten at Zurich and that the army he had come to join no longer held the field; the French were closing the exits. After a council of war he turned east, fought his way over the Pragel pass to Glarus, and, finding the way north barred, took the army over the snowbound Panixer Pass to the upper Rhine in early October. The guns and much of the baggage were lost and several thousand men with them, but the larger part of the army came out as a formed body.",
      cite: "Suvorov's Swiss campaign, September–October 1799", url: 'https://en.wikipedia.org/wiki/Suvorov%27s_Swiss_campaign' }
  ],
  quotes: [
    { text: 'The bullet is a fool, the bayonet is a fine fellow.', source: 'The Science of Victory (Nauka pobezhdat), written c. 1795–96, trans.',
      status: 'attested', note: 'From the section addressed to the soldiers; the Russian is "Pulya dura, shtyk molodets".', url: 'https://en.wikipedia.org/wiki/The_Science_of_Victory' },
    { text: 'Easy in training, hard on the march; hard in training, easy on the march.', source: 'The Science of Victory, c. 1795–96, trans.',
      status: 'attested', note: 'The familiar "Train hard, fight easy" and "Hard in training, easy in battle" are later paraphrases of this line.' },
    { text: 'Three military arts: the first, the eye; the second, speed; the third, the onslaught.', source: 'The Science of Victory, c. 1795–96, trans. and abridged',
      status: 'attested', note: 'The three headings (glazomer, bystrota, natisk) are his; the explanation he gives under each is omitted here.' },
    { text: 'Perish yourself, but rescue your comrade.', source: 'The Science of Victory, c. 1795–96, trans.',
      status: 'attested', note: 'Long since a Russian proverb.' }
  ],
  remarks: [
    { on: 'any', text: 'A page that is slow to arrive has lost the battle already. Speed, speed, speed.' },
    { on: 'any', text: 'Read it once, and well. He who reads twice has marched the same road twice.' },
    { on: 'any', text: 'I rise at cock-crow and crow myself to wake the camp. You, I see, are still reading.' },
    { on: 'maps', text: 'A map! Good. Now learn it so well that you may throw it away at the gallop.' },
    { on: 'encyclopedia', text: 'Everything is written here? Then no one may answer me "I cannot know". I detest "I cannot know".' },
    { on: 'news', text: 'News is a courier who left yesterday. March to where the matter will be tomorrow.' },
    { on: 'search', text: 'You asked, and it answered at once. This is how a staff should behave. Promote it.' },
    { on: 'shopping', text: 'A soldier needs boots, biscuit and a cloak. Count what is in that basket again.' },
    { on: 'social', text: 'So many voices and no word of command. My roosters keep better order.' },
    { on: 'video', text: 'Moving pictures. Good for drill: let the recruits see the ladder climbed before they climb it.' },
    { on: 'mail', text: 'Write short. A report should fit on a drum-head and leave room for the sketch.' },
    { on: 'code', text: 'Rehearse on a copy of the wall before you storm the wall. I see your trade knows this.' },
    { on: 'weather', text: 'Snow in the pass? We crossed the Gotthard in September and the Panixer in October. Take a cloak.' },
    { on: 'money', text: 'Gold is slow and heavy. I prefer bread, which marches with the regiment.' },
    { on: 'travel', text: 'A journey! Pack light, start before dawn, and count the mules yourself before you set out.' },
    { on: 'history', text: 'Old battles. Read them for the marches, not the paintings. The paintings never show the boots.' },
    { on: 'self', text: 'They write of Suvorov. Good. Skip the anecdotes about the rooster and read the part about training.' },
    { on: 'rival', text: 'A worthy opponent. Study him gladly: first the eye, then speed, then the attack.' }
  ],
  portrait: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" aria-hidden="true" focusable="false">' +
    '<circle cx="32" cy="32" r="30" fill="#dfe0cf"/><circle cx="32" cy="32" r="26.6" fill="none" stroke="#2a2520" stroke-opacity=".16" stroke-width=".6"/>' +
    '<path d="M10.5 53C13 45.5 20 43.5 26.5 41.5L37.5 41.5C44 43.5 51 45.5 53.5 53A30 30 0 0 1 10.5 53Z" fill="#2f4a3a"/>' +
    '<path d="M26.6 41.6L32 50L37.4 41.6Z" fill="#f7f1e3"/>' +
    '<path d="M16.6 45.8L22.4 43.3L40.6 59.8L33.6 61.7Z" fill="#6f9cc4"/>' +
    '<path d="M16.6 45.8L33.6 61.7M22.4 43.3L40.6 59.8" fill="none" stroke="#2a2520" stroke-opacity=".3" stroke-width=".5"/>' +
    '<path d="M42 46.6L43.2 49.6L46.2 50.8L43.2 52L42 55L40.8 52L37.8 50.8L40.8 49.6Z" fill="#f1ede0" stroke="#2a2520" stroke-opacity=".5" stroke-width=".4"/>' +
    '<path d="M39.2 48L44.8 53.6M44.8 48L39.2 53.6" stroke="#f1ede0" stroke-width=".9" stroke-linecap="round"/>' +
    '<circle cx="42" cy="50.8" r="1.2" fill="#b8691f"/>' +
    '<path d="M28 32L28 42.5Q32 46 36 42.5L36 32Z" fill="#e6cba6"/><path d="M28 36.5Q32 40 36 36.5L36 39Q32 42 28 39Z" fill="#b98f63" fill-opacity=".55"/>' +
    '<path d="M25.6 38.4L28.6 40.2L31 46.4L26 42.8ZM38.4 38.4L35.4 40.2L33 46.4L38 42.8Z" fill="#9a3324"/>' +
    '<path d="M23.6 22C22.6 26 23 30 24.8 32.6C24.8 29 25 25.5 26 22ZM40.4 22C41.4 26 41 30 39.2 32.6C39.2 29 39 25.5 38 22Z" fill="#f4f0e4" stroke="#2a2520" stroke-opacity=".45" stroke-width=".4"/>' +
    '<ellipse cx="32" cy="27.5" rx="7.6" ry="10.2" fill="#e6cba6"/><path d="M32 17.3A7.6 10.2 0 0 1 32 37.7A4.6 10.2 0 0 0 32 17.3Z" fill="#b98f63" fill-opacity=".38"/>' +
    '<path d="M24.2 26C22.8 20 25.2 15.8 29.4 15C30.6 12.4 33.2 10.8 36.4 10.8C35.4 12.4 35.6 14 36.6 15.4C40.2 16.8 41.4 21 39.8 26C39.3 23 37.4 21.2 33 20.8C28.8 20.6 25.3 22.4 24.2 26Z" fill="#f4f0e4" stroke="#2a2520" stroke-opacity=".45" stroke-width=".5" stroke-linejoin="round"/>' +
    '<path d="M30.8 15C31.6 13.4 33 12.2 34.8 11.6M27.4 18C29.4 16.6 32.6 16.2 35.6 17M26 20.6C28 18.8 31 18.4 33.4 19" fill="none" stroke="#2a2520" stroke-opacity=".28" stroke-width=".5" stroke-linecap="round"/>' +
    '<circle cx="32" cy="32" r="29.6" fill="none" stroke="#a07a2c" stroke-width="2.2"/><circle cx="32" cy="32" r="31" fill="none" stroke="#2a2520" stroke-opacity=".35" stroke-width=".6"/></svg>'
});
