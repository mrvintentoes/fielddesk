window.FD = window.FD || {};

// Commander comparison data. Summaries are our own paraphrase of the cited
// sources; nothing here is a quotation. Figures are approximate.

FD.CATEGORIES = [
  { id: 'intelligence', label: 'Intelligence' },
  { id: 'tempo', label: 'Marching tempo' },
  { id: 'logistics', label: 'Logistics' },
  { id: 'recovery', label: 'Recovery after setbacks' }
];

FD.COMMANDERS = [
  {
    id: 'alexander',
    name: 'Alexander',
    full: 'Alexander III of Macedon',
    dates: '356–323 BC',
    epithet: 'Speed, shock and the personal example',
    tone: '#7a5c14',
    decisions: [
      {
        id: 'alexander-intelligence',
        category: 'intelligence',
        title: 'Riding the ground before Gaugamela',
        when: '331 BC',
        summary: 'On sighting the Persian host, Alexander did not attack at once. Following Parmenion\'s advice, as Arrian tells it, he halted, and rode over the prospective battlefield with light troops and Companion cavalry to check it for obstacles and prepared ground. The pause cost a day but meant he fought on terrain he had seen for himself rather than on Darius\'s terms.',
        cite: 'Arrian, Anabasis 3.9',
        url: 'https://en.wikipedia.org/wiki/Battle_of_Gaugamela'
      },
      {
        id: 'alexander-tempo',
        category: 'tempo',
        title: 'The pursuit of Darius',
        when: '330 BC',
        summary: 'Learning that Darius was a prisoner of his own nobles, Alexander left the slower part of the army behind and pressed on with picked cavalry and the fittest infantry, marching largely by night. Arrian records a final stage of about 400 stades covered in a single night. He reached the Persian column too late to take Darius alive, but the chase ended Darius\'s reign; what resistance remained passed to Bessus in the eastern satrapies.',
        cite: 'Arrian, Anabasis 3.20–21',
        url: 'https://en.wikipedia.org/wiki/Darius_III'
      },
      {
        id: 'alexander-logistics',
        category: 'logistics',
        title: 'Beating a navy from the land',
        when: '334–332 BC',
        summary: 'At Miletus Alexander paid off most of his fleet, which he could neither afford nor trust to beat the Persian navy at sea. Instead he set out to capture the harbours along the coast that the Persian ships depended on for crews and landing places. The long siege of Tyre followed from that logic: in the speech Arrian gives him, he would not go on to Egypt, or inland after Darius, with an enemy naval base behind him.',
        cite: 'Arrian, Anabasis 1.20, 2.17',
        url: 'https://en.wikipedia.org/wiki/Siege_of_Tyre_(332_BC)'
      },
      {
        id: 'alexander-recovery',
        category: 'recovery',
        title: 'Turning back at the Hyphasis',
        when: '326 BC',
        summary: 'On the river Hyphasis (Beas) the army, worn out after years of campaigning and the monsoon, declined to go further east; Arrian gives Coenus as its spokesman. After keeping to his tent until the third day Alexander accepted the refusal, announced that the sacrifices were unfavourable, and ordered the return. He gave way rather than break the instrument he depended on.',
        cite: 'Arrian, Anabasis 5.25–29',
        url: 'https://en.wikipedia.org/wiki/Indian_campaign_of_Alexander_the_Great'
      }
    ]
  },
  {
    id: 'hannibal',
    name: 'Hannibal',
    full: 'Hannibal Barca',
    dates: '247–c. 183 BC',
    epithet: 'Reading the opponent before the ground',
    tone: '#2f5d50',
    decisions: [
      {
        id: 'hannibal-intelligence',
        category: 'intelligence',
        title: 'Studying Flaminius, then baiting him',
        when: '217 BC',
        summary: 'Polybius says Hannibal made enquiries about the consul Flaminius and judged him over-confident and sensitive to public opinion. He marched past the Roman army, wasting the Etruscan countryside in plain view to provoke a pursuit, then laid an ambush in the defile beside Lake Trasimene. Polybius draws the general lesson himself: knowing the opposing commander\'s character is a first duty.',
        cite: 'Polybius, Histories 3.80–84',
        url: 'https://penelope.uchicago.edu/Thayer/E/Roman/Texts/Polybius/3*.html'
      },
      {
        id: 'hannibal-tempo',
        category: 'tempo',
        title: 'Through the Arno marshes',
        when: '217 BC',
        summary: 'To enter Etruria Hannibal chose the short, flooded route through the marshes (Polybius does not name them; Livy puts them on the Arno), where the Romans did not expect him, over the longer, obvious roads. The army waded for about four days and three nights with little chance to rest, losing many pack animals; Hannibal himself lost the sight of one eye to an infection. The price bought him a position beyond the Roman covering forces.',
        cite: 'Polybius, Histories 3.78–79; Livy 22.2',
        url: 'https://penelope.uchicago.edu/Thayer/E/Roman/Texts/Polybius/3*.html'
      },
      {
        id: 'hannibal-logistics',
        category: 'logistics',
        title: 'Seizing the depot at Cannae',
        when: '216 BC',
        summary: 'Once the season allowed supplies to be drawn from the new crops, Hannibal left his winter quarters at Gerunium and captured the citadel of Cannae, where the Romans had been collecting grain and stores from the district around Canusium. The stroke fed his own army and unsettled the Roman one, whose commanders wrote to the Senate for instructions. It helped bring on the pitched battle he wanted.',
        cite: 'Polybius, Histories 3.107',
        url: 'https://en.wikipedia.org/wiki/Battle_of_Cannae'
      },
      {
        id: 'hannibal-recovery',
        category: 'recovery',
        title: 'Oxen and torches in the Ager Falernus',
        when: '217 BC',
        summary: 'Fabius had closed the passes out of the Falernian plain, shutting Hannibal in with his plunder. By night Hannibal had bundles of dry wood tied to the horns of roughly two thousand captured oxen, lit, and the herd driven up a ridge; the Roman guard on the pass left its post to meet what looked like a column on the move. The Carthaginian army then marched out through the unguarded pass.',
        cite: 'Polybius, Histories 3.93–94; Livy 22.16–17',
        url: 'https://en.wikipedia.org/wiki/Battle_of_Ager_Falernus'
      }
    ]
  },
  {
    id: 'caesar',
    name: 'Caesar',
    full: 'Gaius Julius Caesar',
    dates: '100–44 BC',
    epithet: 'Celerity, engineering and nerve',
    tone: '#7b2d26',
    decisions: [
      {
        id: 'caesar-intelligence',
        category: 'intelligence',
        title: 'Volusenus scouts the British coast',
        when: '55 BC',
        summary: 'Traders questioned about Britain could tell Caesar little about its harbours or peoples, so before embarking he sent the tribune Gaius Volusenus ahead in a warship to look for landing places. Volusenus returned on the fifth day having observed the shore without risking a landing. The report was thin, and the difficult opposed landing that followed shows the limits of reconnaissance done from the deck of a ship.',
        cite: 'Caesar, Gallic War 4.20–21',
        url: 'https://penelope.uchicago.edu/Thayer/E/Roman/Texts/Caesar/Gallic_War/home.html'
      },
      {
        id: 'caesar-tempo',
        category: 'tempo',
        title: 'Over the snowbound Cévennes',
        when: '52 BC',
        summary: 'When revolt broke out in winter with Caesar cut off from his legions, he had his men clear a path through the Cévennes, where by his account the snow lay very deep, and appeared without warning in Arvernian territory. The raid drew Vercingetorix back to defend his own people. Caesar used the respite to hurry by another route to his army.',
        cite: 'Caesar, Gallic War 7.8–9',
        url: 'https://penelope.uchicago.edu/Thayer/E/Roman/Texts/Caesar/Gallic_War/home.html'
      },
      {
        id: 'caesar-logistics',
        category: 'logistics',
        title: 'Ilerda: winning by thirst',
        when: '49 BC',
        summary: 'In Spain, having outmarched the retreating Pompeian army of Afranius and Petreius, Caesar refused his soldiers\' demand for an immediate battle. He writes that he hoped to finish the business without bloodshed by cutting the enemy off from supply. Hemmed in away from water and forage, the Pompeians surrendered within days and their legions were disbanded.',
        cite: 'Caesar, Civil War 1.72–87',
        url: 'https://en.wikipedia.org/wiki/Battle_of_Ilerda'
      },
      {
        id: 'caesar-recovery',
        category: 'recovery',
        title: 'From Dyrrhachium to Pharsalus',
        when: '48 BC',
        summary: 'After Pompey broke his siege lines at Dyrrhachium with heavy loss, Caesar addressed the troops, gave up the blockade and slipped away, starting by night, before Pompey could exploit the success. He moved inland to Thessaly, where his men could be fed and rested and his detached forces rejoined him. About a month later he fought and won at Pharsalus.',
        cite: 'Caesar, Civil War 3.73–75',
        url: 'https://en.wikipedia.org/wiki/Battle_of_Dyrrhachium_(48_BC)'
      }
    ]
  },
  {
    id: 'napoleon',
    name: 'Napoleon',
    full: 'Napoleon Bonaparte',
    dates: '1769–1821',
    epithet: 'Dispersed to march, united to fight',
    tone: '#2c3e5c',
    decisions: [
      {
        id: 'napoleon-intelligence',
        category: 'intelligence',
        title: 'A cavalry screen in the Black Forest',
        when: '1805',
        summary: 'While the corps of the Grande Armée wheeled north and east around the Austrian army at Ulm, Murat\'s cavalry reserve demonstrated in the Black Forest passes, the direction from which a French attack was expected. The screen held Mack\'s attention to the west and hid the real line of march. By the time the Austrians understood, the French were across the Danube behind them.',
        cite: 'Ulm campaign, September–October 1805',
        url: 'https://en.wikipedia.org/wiki/Ulm_campaign'
      },
      {
        id: 'napoleon-tempo',
        category: 'tempo',
        title: 'From the Channel to the Danube',
        when: 'Aug–Oct 1805',
        summary: 'In late August 1805 Napoleon turned the army encamped around Boulogne away from England and sent it east. Roughly 200,000 men in separate corps, each on its own roads, reached the Rhine in about a month and the Danube early in October. The pace and the dispersal together put the army on the Austrian line of retreat before Russian help could arrive; Mack signed a capitulation at Ulm on 17 October and his troops marched out on the 20th.',
        cite: 'War of the Third Coalition, 1805',
        url: 'https://en.wikipedia.org/wiki/War_of_the_Third_Coalition'
      },
      {
        id: 'napoleon-logistics',
        category: 'logistics',
        title: 'Lingering in Moscow',
        when: '1812',
        summary: 'A cautionary case. Napoleon entered a largely abandoned Moscow in mid-September 1812 and stayed about five weeks expecting the Tsar to negotiate, at the end of a supply line hundreds of miles long. He did not march out until 19 October. Turned back at Maloyaroslavets onto the already stripped Smolensk road, the army met the first hard cold short of food, horses and winter clothing.',
        cite: 'French invasion of Russia, 1812',
        url: 'https://en.wikipedia.org/wiki/French_invasion_of_Russia'
      },
      {
        id: 'napoleon-recovery',
        category: 'recovery',
        title: 'Aspern-Essling to Wagram',
        when: '1809',
        summary: 'In May 1809 Napoleon\'s attempt to cross the Danube below Vienna was beaten back at Aspern-Essling when the single bridge behind him was repeatedly broken. He kept hold of Lobau island, spent about six weeks turning it into a fortified base with stronger, protected bridges, and called in reinforcements. On the night of 4–5 July he crossed again in far greater force and won at Wagram.',
        cite: 'Battles of Aspern-Essling and Wagram, 1809',
        url: 'https://en.wikipedia.org/wiki/Battle_of_Wagram'
      }
    ]
  },
  {
    id: 'turenne',
    name: 'Turenne',
    full: 'Henri de La Tour d\'Auvergne, vicomte de Turenne',
    dates: '1611–1675',
    epithet: 'Manoeuvre as the decisive arm',
    tone: '#5a3a5e',
    decisions: [
      {
        id: 'turenne-intelligence',
        category: 'intelligence',
        title: 'The hidden march behind the Vosges',
        when: 'Dec 1674 – Jan 1675',
        summary: 'With a larger Imperial and Brandenburg army settled into winter quarters in Alsace, Turenne let it be thought that his own campaign was over. He then marched south in midwinter on the far side of the Vosges, using the mountains as a screen, and re-entered Alsace by the Belfort gap. The surprised allies were beaten at Turckheim on 5 January 1675 and withdrew across the Rhine.',
        cite: 'Battle of Turckheim, 5 January 1675',
        url: 'https://en.wikipedia.org/wiki/Battle_of_Turckheim'
      },
      {
        id: 'turenne-tempo',
        category: 'tempo',
        title: 'The dash to Sinsheim',
        when: 'June 1674',
        summary: 'Learning that an Imperial force under Caprara and the Duke of Lorraine was moving to join a second army under Bournonville, Turenne crossed the Rhine at Philippsburg and covered the distance to it in a few days of hard marching. He caught and attacked it at Sinsheim on 16 June 1674 before the junction could be made. He won, at a heavy cost, and soon recrossed the Rhine; the victory did not end the campaign, but it delayed the enemy\'s concentration.',
        cite: 'Battle of Sinsheim, 16 June 1674',
        url: 'https://en.wikipedia.org/wiki/Battle_of_Sinsheim'
      },
      {
        id: 'turenne-logistics',
        category: 'logistics',
        title: 'Laying waste the Palatinate',
        when: 'Summer 1674',
        summary: 'After Sinsheim, Turenne\'s troops stripped and burned much of the Palatinate between the Rhine and the Neckar so that an Imperial army could not subsist there within reach of Alsace. As a supply-denial measure it worked for a season. It was condemned at the time and has been ever since, and how far it was ordered policy rather than indiscipline is still debated.',
        cite: 'Franco-Dutch War, Rhine campaign of 1674',
        url: 'https://en.wikipedia.org/wiki/Franco-Dutch_War'
      },
      {
        id: 'turenne-recovery',
        category: 'recovery',
        title: 'Mergentheim to Allerheim',
        when: '1645',
        summary: 'In early May 1645 the Bavarian general Mercy surprised Turenne\'s army while it was dispersed in quarters near Mergentheim (Herbsthausen) and wrecked most of his infantry. Turenne brought off the remnant, fell back on his Hessian allies and was joined by a French army under the duc d\'Enghien, the future Condé. On 3 August the combined force attacked Mercy at Allerheim, the second battle of Nördlingen; the victory was dearly bought, and Mercy was killed.',
        cite: 'Battles of Herbsthausen (Mergentheim) and Allerheim (Second Nördlingen), 1645',
        url: 'https://en.wikipedia.org/wiki/Battle_of_Herbsthausen'
      }
    ]
  }
];

FD.commander = id => FD.COMMANDERS.find(c => c.id === id);
