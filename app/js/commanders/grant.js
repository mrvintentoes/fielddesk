'use strict';
FD.defineCommander({
  id: 'grant',
  name: 'Grant',
  full: 'Ulysses S. Grant',
  dates: '1822–1885',
  epithet: 'Strike, and keep moving on',
  era: 'Nineteenth century',
  tone: '#2d4a78',
  selfWords: ['Ulysses S. Grant', 'Ulysses_S._Grant', 'Ulysses Grant', 'General Grant', 'U. S. Grant'],
  rivalWords: ['Vicksburg', 'Shiloh', 'Fort Donelson', 'Fort_Donelson', 'Appomattox', 'Robert E. Lee', 'Robert_E._Lee', 'Pemberton', 'Chattanooga', 'Cold Harbor', 'Cold_Harbor', 'Spotsylvania', 'Overland Campaign', 'Overland_Campaign'],
  theme: {
    label: 'Union Army',
    vars: {
      '--paper': '#edece2',
      '--paper-2': '#e1dfd1',
      '--paper-3': '#d3d1c0',
      '--card': '#f8f7f0',
      '--ink': '#1c2029',
      '--ink-2': '#484d57',
      '--ink-3': '#7a7e84',
      '--rule': '#c7c5b3',
      '--accent': '#2d4a78',
      '--accent-soft': '#d3dcea',
      '--green': '#39603f',
      '--green-soft': '#d6e1d0',
      '--brass': '#a5822e',
      '--amber-soft': '#efe0b0',
      '--blue': '#23588a'
    },
    band: 'linear-gradient(90deg, #2d4a78 0 70%, #b08a30 70% 85%, #8c3b33 85%)'
  },
  decisions: [
    { id: 'grant-intelligence', category: 'intelligence', title: "Sharpe's bureau at headquarters", when: '1864–65',
      summary: "The Army of the Potomac already had, from 1863, a Bureau of Military Information under Colonel George H. Sharpe, which put prisoner and deserter interrogations, scouts' reports, captured papers and newspapers together into one running estimate of Lee's army. During the siege of Petersburg Grant brought Sharpe to his own headquarters at City Point so that the estimates came straight to him, and the bureau also handled reports from Unionist agents inside Richmond. It did not prevent surprises, Early's raid on Washington in July 1864 among them, but Grant generally knew which Confederate divisions were in front of him and when troops had been sent away.",
      cite: 'Bureau of Military Information, 1863–65; Edwin Fishel, The Secret War for the Union (1996)', url: 'https://en.wikipedia.org/wiki/Bureau_of_Military_Information' },
    { id: 'grant-tempo', category: 'tempo', title: 'Henry, Donelson and the haversacks', when: 'February 1862',
      summary: "Fort Henry on the Tennessee fell to the gunboats on 6 February, and Grant marched at once across the dozen miles to Fort Donelson on the Cumberland rather than wait to be reinforced or told to go. When the garrison attacked on the 15th and drove back his right, he arrived to find the line in confusion, learned that captured Confederates were carrying several days' rations in their haversacks, and concluded that they were trying to break out, not to win a battle, and must be as disordered as his own men. He ordered an immediate attack on the other flank. The fort surrendered the next morning with something like 12,000 or more prisoners.",
      cite: 'Battle of Fort Donelson, 11–16 February 1862; Grant, Personal Memoirs, ch. 22', url: 'https://en.wikipedia.org/wiki/Battle_of_Fort_Donelson' },
    { id: 'grant-logistics', category: 'logistics', title: 'Cutting loose below Vicksburg', when: 'April–May 1863',
      summary: "After months of failed approaches from the north, Grant marched down the west bank, had the fleet run past the batteries and crossed the Mississippi well below Vicksburg at the end of April. Rather than build up a base and wait for another army to join him, he moved inland with what the wagons could carry, chiefly ammunition, hard bread, coffee and salt, and took meat and forage from the country. He was never wholly without a wagon line, a point historians stress against the legend, but he accepted a thin one. In under three weeks the army marched roughly 180 miles, won five actions, separated the two Confederate forces and shut Pemberton in Vicksburg, which surrendered on 4 July.",
      cite: 'Vicksburg campaign, 1863; Grant, Personal Memoirs, chs 33–35', url: 'https://en.wikipedia.org/wiki/Vicksburg_campaign' },
    { id: 'grant-recovery', category: 'recovery', title: 'The second day at Shiloh', when: '6–7 April 1862',
      summary: "Grant's army was surprised in its camps near Pittsburg Landing on 6 April and driven back most of the way to the river with heavy loss; he had not entrenched and had not expected an attack. Several officers thought of retreat. Grant held a last line with massed artillery at dusk, brought Lew Wallace's division and the leading divisions of Buell's army into line overnight, and attacked at daylight, recovering the lost ground by afternoon. The two days cost roughly 23,000 casualties on both sides together, more than any American battle before it.",
      cite: 'Battle of Shiloh, 6–7 April 1862; Grant, Personal Memoirs, chs 24–25', url: 'https://en.wikipedia.org/wiki/Battle_of_Shiloh' }
  ],
  quotes: [
    { text: 'No terms except an unconditional and immediate surrender can be accepted. I propose to move immediately upon your works.', source: 'Note to General Simon B. Buckner, Fort Donelson, 16 February 1862',
      status: 'attested', note: 'The source of the nickname "Unconditional Surrender" Grant.' },
    { text: 'I propose to fight it out on this line if it takes all summer.', source: 'Dispatch to Washington from near Spotsylvania Court House, 11 May 1864', status: 'attested',
      note: 'Written in the first week of the Overland Campaign and at once released to the newspapers.' },
    { text: 'I never forgot that he had as much reason to fear my forces as I had his. The lesson was valuable.', source: 'Personal Memoirs of U. S. Grant (1885), ch. 18',
      status: 'attested', note: "On finding a Confederate colonel's camp abandoned at his approach in Missouri in 1861.", url: 'https://www.gutenberg.org/ebooks/4367' },
    { text: 'I have always regretted that the last assault at Cold Harbor was ever made.', source: 'Personal Memoirs of U. S. Grant (1885), ch. 55', status: 'attested',
      note: 'On the attack of 3 June 1864.' }
  ],
  remarks: [
    { on: 'any', text: 'Well. Let us see what is actually there.' },
    { on: 'any', text: 'I would not spend long deciding. Read it, make up your mind, and move.' },
    { on: 'any', text: 'Plain enough. I like a page that says what it means.' },
    { on: 'maps', text: 'Good. Once I had looked at a map properly I could carry it in my head. Look at it properly.' },
    { on: 'encyclopedia', text: 'A lot of facts. Pick out the three that matter and act on those.' },
    { on: 'news', text: 'The papers had me drunk, beaten or retreating most weeks. I kept on. Read them lightly.' },
    { on: 'search', text: 'Find out where the thing is and go to it as directly as you can. That is most of the business.' },
    { on: 'shopping', text: 'I once sold firewood on a street corner and clerked in a leather store. Do not ask me about bargains.' },
    { on: 'social', text: 'A good deal of noise. I never found that talk moved an army a mile.' },
    { on: 'video', text: 'I have little patience for shows. Tell me when it gets to the point.' },
    { on: 'mail', text: 'Write it so it cannot be misunderstood. You will find it comes out short.' },
    { on: 'code', text: "Engineers' work. Mine opened a supply line at Chattanooga in under a week. Good tools, plainly used." },
    { on: 'weather', text: 'Mud. It stopped the army more than once. It dries.' },
    { on: 'money', text: 'I was swindled in business late in life and wrote a book to pay the debt. Watch your partners.' },
    { on: 'travel', text: 'I have a superstition against turning back once I have started. Go on to where you were going.' },
    { on: 'sport', text: 'Horses I understand. The rest I will watch quietly.' },
    { on: 'history', text: 'Most battles look tidier written down than they were. I was at several.' },
    { on: 'self', text: 'About me, is it. I said what I had to say in two volumes. They are plain and I believe accurate.' },
    { on: 'rival', text: 'I knew a good many of them from Mexico and the old army. Good soldiers. It helped to know how they thought.' }
  ],
  portrait: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" aria-hidden="true" focusable="false">' +
    '<circle cx="32" cy="32" r="30" fill="#e0d8bf"/><circle cx="32" cy="32" r="26.6" fill="none" stroke="#2a2520" stroke-opacity=".16" stroke-width=".6"/>' +
    '<path d="M10.5 53C13 45.5 20 43.5 26.5 41.5L37.5 41.5C44 43.5 51 45.5 53.5 53A30 30 0 0 1 10.5 53Z" fill="#2e4168"/>' +
    '<path d="M27 41.8L32 48.5L37 41.8Z" fill="#f7f1e3"/>' +
    '<path d="M24.6 42.2L32 52L39.4 42.2L37.5 41.5L32 48.8L26.5 41.5Z" fill="#22304f"/>' +
    '<path d="M32 52L32 62" stroke="#2a2520" stroke-opacity=".4" stroke-width=".8"/>' +
    '<circle cx="28.2" cy="53.4" r="1" fill="#b08a30"/><circle cx="27.6" cy="58" r="1" fill="#b08a30"/><circle cx="35.8" cy="53.4" r="1" fill="#b08a30"/><circle cx="36.4" cy="58" r="1" fill="#b08a30"/>' +
    '<path d="M13.6 48.8L21.4 45.2L22.6 48.2L14.8 51.8ZM50.4 48.8L42.6 45.2L41.4 48.2L49.2 51.8Z" fill="#1a2540" stroke="#c9a13a" stroke-width=".9" stroke-linejoin="round"/>' +
    '<circle cx="16.4" cy="49.3" r=".6" fill="#f1ede0"/><circle cx="18.2" cy="48.5" r=".6" fill="#f1ede0"/><circle cx="20" cy="47.7" r=".6" fill="#f1ede0"/>' +
    '<circle cx="47.6" cy="49.3" r=".6" fill="#f1ede0"/><circle cx="45.8" cy="48.5" r=".6" fill="#f1ede0"/><circle cx="44" cy="47.7" r=".6" fill="#f1ede0"/>' +
    '<path d="M28 32L28 42.5Q32 46 36 42.5L36 32Z" fill="#e6cba6"/>' +
    '<ellipse cx="32" cy="26.5" rx="8.3" ry="10.2" fill="#e6cba6"/><path d="M32 16.3A8.3 10.2 0 0 1 32 36.7A5 10.2 0 0 0 32 16.3Z" fill="#b98f63" fill-opacity=".38"/>' +
    '<path d="M23.5 25.5C23.4 35.5 27.5 40.6 32 40.6C36.5 40.6 40.6 35.5 40.5 25.5C39.6 29.4 36.6 30.6 34.4 30.2C33 29.8 31 29.8 29.6 30.2C27.4 30.6 24.4 29.4 23.5 25.5Z" fill="#5c4130"/>' +
    '<path d="M29.4 33.6Q32 34.8 34.6 33.6" fill="none" stroke="#2a2520" stroke-opacity=".45" stroke-width=".7" stroke-linecap="round"/>' +
    '<path d="M23.6 26C22.6 18.6 27.2 15.4 32 15.4C36.8 15.4 41.4 18.6 40.4 26C39.8 22.4 38.2 20.2 35.4 19.8C32.6 19.5 30.2 20.6 27.6 20C25.4 20.8 24.2 23 23.6 26Z" fill="#5c4130"/>' +
    '<circle cx="32" cy="32" r="29.6" fill="none" stroke="#a07a2c" stroke-width="2.2"/><circle cx="32" cy="32" r="31" fill="none" stroke="#2a2520" stroke-opacity=".35" stroke-width=".6"/></svg>'
});
