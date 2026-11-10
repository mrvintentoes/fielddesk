'use strict';
FD.defineCommander({
  id: 'bolivar',
  name: 'Bolívar',
  full: 'Simón Bolívar',
  dates: '1783–1830',
  epithet: 'Beaten often, never for long',
  era: 'Age of revolutions',
  tone: '#a02a2c',
  selfWords: ['Bolívar', 'Bolivar', 'Bol%C3%ADvar', 'El Libertador'],
  rivalWords: ['Boyacá', 'Boyaca', 'Boyac%C3%A1', 'Carabobo', 'Morillo', 'Boves', 'Barreiro', 'Monteverde', 'Junín', 'Ayacucho', 'Pantano de Vargas'],
  theme: {
    label: 'Gran Colombia',
    vars: {
      '--paper': '#f7f3e3',
      '--paper-2': '#eee8d0',
      '--paper-3': '#e3dbbd',
      '--card': '#fdfbf1',
      '--ink': '#22201b',
      '--ink-2': '#524d3d',
      '--ink-3': '#867f68',
      '--rule': '#d6cda9',
      '--accent': '#a02a2c',
      '--accent-soft': '#f0d6cd',
      '--green': '#2c6646',
      '--green-soft': '#d6e4d2',
      '--brass': '#b58f1c',
      '--amber-soft': '#f4e3a6',
      '--blue': '#234586'
    },
    band: 'linear-gradient(90deg, #d4ad2a 0 50%, #234586 50% 75%, #a02a2c 75%)'
  },
  decisions: [
    { id: 'bolivar-intelligence', category: 'intelligence', title: 'Reading New Granada from Casanare', when: '1818–19',
      summary: "Stalemated against Morillo in Venezuela, Bolívar had sent Santander into the plains of Casanare in 1818 to raise a division on the edge of New Granada. Santander's reports the following spring, that a royalist thrust into the plains had failed and that the highlands were thinly held and restless under the viceroy, were the basis of the plan Bolívar put to his officers at a council on the Apure in May 1819. He chose the rainy season, when the royalists did not expect an army to move across the flooded plains at all.",
      cite: "Bolívar's campaign to liberate New Granada, 1819", url: 'https://en.wikipedia.org/wiki/Battle_of_Boyac%C3%A1' },
    { id: 'bolivar-tempo', category: 'tempo', title: 'The Admirable Campaign', when: 'May–August 1813',
      summary: "Starting from Cúcuta on the border with a force usually put at well under a thousand men and leave from the government of New Granada to go only a short distance, Bolívar kept moving. He took Mérida and Trujillo, beat separated royalist detachments one after another before they could unite, and entered Caracas in early August, roughly three months after setting out. The speed restored a Venezuelan republic; it did not make it secure, and the republic fell again the following year. The campaign also produced his decree of war to the death, which remains controversial.",
      cite: 'Admirable Campaign, 1813', url: 'https://en.wikipedia.org/wiki/Admirable_Campaign' },
    { id: 'bolivar-logistics', category: 'logistics', title: 'What the Páramo de Pisba cost', when: 'June–July 1819',
      summary: "To reach the highlands unexpectedly Bolívar marched for weeks across the flooded llanos and then took the highest and least guarded pass, the Páramo de Pisba, at close to 4,000 metres. The plainsmen and the British and Irish volunteers went up thinly clothed; almost all the horses and a good many men died of cold and exhaustion, and the army that came down at Socha in early July could not have fought. The villages of the district fed and clothed it and found it horses and recruits, and within about a month it fought at Pantano de Vargas and won at Boyacá on 7 August.",
      cite: "Bolívar's campaign to liberate New Granada, 1819", url: 'https://en.wikipedia.org/wiki/Bol%C3%ADvar%27s_campaign_to_liberate_New_Granada' },
    { id: 'bolivar-recovery', category: 'recovery', title: 'From Jamaica and Haiti back to the Orinoco', when: '1815–17',
      summary: "By 1815 the second Venezuelan republic had been destroyed and a Spanish expeditionary army under Morillo was reconquering the north of the continent; Bolívar was an exile in Jamaica, where he set out his case in the letter of September 1815. He then went to Haiti, whose president, Alexandre Pétion, gave him ships, arms and money and asked in return that he free the slaves in the lands he liberated. The first landing in 1816 failed and he returned to Haiti to try again. The second took hold, and in 1817 he moved the base of the war to Angostura on the Orinoco, with river access to the sea and to the plains.",
      cite: 'Jamaica Letter, 6 September 1815; expeditions from Haiti, 1816', url: 'https://en.wikipedia.org/wiki/Sim%C3%B3n_Bol%C3%ADvar' }
  ],
  quotes: [
    { text: 'He who serves a revolution ploughs the sea.', source: 'Letter to General Juan José Flores, Barranquilla, 9 November 1830, trans.', status: 'attested',
      note: 'Written five weeks before his death, as one of a list of bitter conclusions.' },
    { text: 'We are a small human race of our own; we possess a world apart, surrounded by broad seas.', source: 'Jamaica Letter (Carta de Jamaica), Kingston, 6 September 1815, trans.',
      status: 'attested', note: 'The sentence continues.', url: 'https://en.wikipedia.org/wiki/Jamaica_Letter' },
    { text: 'Morality and enlightenment are the poles of a republic; morality and enlightenment are our first necessities.', source: 'Address to the Congress of Angostura, 15 February 1819, trans.',
      status: 'attested', note: 'In Spanish, "Moral y luces son los polos de una República".' },
    { text: 'If Nature opposes us, we shall fight against her and make her obey us.', source: 'Said in the ruins of Caracas after the earthquake of 26 March 1812, as reported by José Domingo Díaz, Recuerdos sobre la rebelión de Caracas (1829), trans.',
      status: 'attributed', note: 'The only source is Díaz, a royalist and a bitter enemy, writing years later to show Bolívar as impious. It may be true in substance; the wording cannot be checked.' }
  ],
  remarks: [
    { on: 'any', text: 'Read quickly, friend. A continent does not wait for a man to finish the page.' },
    { on: 'any', text: 'I have crossed colder mountains for less information than this.' },
    { on: 'any', text: 'Every page is a small republic: easily founded, and harder to keep in order.' },
    { on: 'maps', text: 'A map of roads. The enemy watched the roads, so I took the páramo. Look for what is not drawn.' },
    { on: 'encyclopedia', text: 'The Enlightenment in one volume. My tutor Rodríguez would have made me walk it rather than read it.' },
    { on: 'news', text: 'News from everywhere at once. In my day it came by mule, a month late and already false.' },
    { on: 'search', text: 'So many answers. Choose as I chose allies: the ones that will still be there after a defeat.' },
    { on: 'shopping', text: 'Muskets, blankets, horses: I bought them all on credit and promises. Mind the terms.' },
    { on: 'social', text: 'Many voices, each one certain. I have presided over congresses. I recommend a short agenda.' },
    { on: 'video', text: 'A spectacle. Good; but Boyacá itself took about two hours. Do not stay all evening.' },
    { on: 'mail', text: 'Letters! I dictated to several secretaries at once and still fell behind. Answer the important one first.' },
    { on: 'code', text: 'A constitution for machines. I drafted several for men. Write it clearly; they will amend it anyway.' },
    { on: 'weather', text: 'Rain? We waded the flooded llanos for days, the water to our waists. You may take an umbrella.' },
    { on: 'money', text: 'Finance. Liberty is costly, and creditors are patient only until the victory. Read the small print.' },
    { on: 'travel', text: 'A journey. I rode farther than most men of my time and slept in a hammock. Travel light.' },
    { on: 'history', text: 'Old wars. Notice who came back after losing everything. That is the chapter worth reading.' },
    { on: 'self', text: 'A page about Bolívar. I hope it is honest about my failures. I counted them myself; it took some time.' },
    { on: 'rival', text: 'An adversary. Read him justly: after the armistice of 1820 Morillo and I dined and slept under one roof.' }
  ],
  portrait: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" aria-hidden="true" focusable="false">' +
    '<circle cx="32" cy="32" r="30" fill="#e8dcb8"/><circle cx="32" cy="32" r="26.6" fill="none" stroke="#2a2520" stroke-opacity=".16" stroke-width=".6"/>' +
    '<path d="M10.5 53C13 45.5 20 43.5 26.5 41.5L37.5 41.5C44 43.5 51 45.5 53.5 53A30 30 0 0 1 10.5 53Z" fill="#26335a"/>' +
    '<path d="M32 46L32 62" stroke="#2a2520" stroke-opacity=".4" stroke-width=".8"/>' +
    '<path d="M25 45L30 59.5M39 45L34 59.5" fill="none" stroke="#c9a13a" stroke-width="1.5" stroke-dasharray="1.5 1.1"/>' +
    '<path d="M22.4 46L27 60.4M41.6 46L37 60.4" fill="none" stroke="#c9a13a" stroke-opacity=".7" stroke-width=".6"/>' +
    '<path d="M11.4 51C12.6 46.6 17 44.8 20.6 44.3L21.8 47.8C18.6 48.4 15.4 50.4 14 53.6ZM52.6 51C51.4 46.6 47 44.8 43.4 44.3L42.2 47.8C45.4 48.4 48.6 50.4 50 53.6Z" fill="#c9a13a"/>' +
    '<path d="M28 32L28 42.5Q32 46 36 42.5L36 32Z" fill="#dcbd96"/><path d="M28 36.5Q32 40 36 36.5L36 39Q32 42 28 39Z" fill="#b98f63" fill-opacity=".55"/>' +
    '<path d="M24.4 35.8L28.6 39.4L31.4 47.6L25 43.2ZM39.6 35.8L35.4 39.4L32.6 47.6L39 43.2Z" fill="#a02a2c" stroke="#c9a13a" stroke-width=".6" stroke-linejoin="round"/>' +
    '<ellipse cx="32" cy="26.5" rx="7.8" ry="10.2" fill="#dcbd96"/><path d="M32 16.3A7.8 10.2 0 0 1 32 36.7A4.7 10.2 0 0 0 32 16.3Z" fill="#b98f63" fill-opacity=".38"/>' +
    '<path d="M24.3 25.5C23.8 30 24.6 33.8 26.8 36C26.2 32.6 26 29 26.2 25.5ZM39.7 25.5C40.2 30 39.4 33.8 37.2 36C37.8 32.6 38 29 37.8 25.5Z" fill="#2b2019"/>' +
    '<path d="M23.9 27C21.8 23.6 22 19.4 24.2 17.4C24.4 14.6 27 13.2 29.2 13.9C30.6 12.2 33.4 12.2 34.8 13.9C37 13.2 39.6 14.6 39.8 17.4C42 19.4 42.2 23.6 40.1 27C40.2 23.4 39 21.4 37 20.6C35.4 21.9 33.2 21.3 32.2 20C30.8 21.5 28.6 21.8 27 20.6C25 21.4 23.8 23.4 23.9 27Z" fill="#2b2019"/>' +
    '<path d="M26 16.8Q27.6 15.4 29.4 16.6M31 15.2Q32.8 14.2 34.4 15.6M35.8 17Q37.4 16.2 38.6 17.8" fill="none" stroke="#f7f1e3" stroke-opacity=".22" stroke-width=".6" stroke-linecap="round"/>' +
    '<circle cx="32" cy="32" r="29.6" fill="none" stroke="#a07a2c" stroke-width="2.2"/><circle cx="32" cy="32" r="31" fill="none" stroke="#2a2520" stroke-opacity=".35" stroke-width=".6"/></svg>'
});
