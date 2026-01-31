
import { Star, Riddle } from './types';

export const INITIAL_TEAMS = [
  { name: "Admin", password: "D0bbyTar5", registered: true }
];

export const TEAM_DB = INITIAL_TEAMS;

export const STARS: Star[] = [
  {
    id: 'aldebaran',
    name: 'Aldebaran',
    constellation: 'Taurus',
    magnitude: 0.85,
    color: '#fb923c',
    x: 420,
    y: 550,
    fact: 'The brightest star in Taurus and the 14th brightest in the night sky.',
    mythology: 'The Eye of the Bull.'
  },
  {
    id: 'mirfak',
    name: 'Mirfak',
    constellation: 'Perseus',
    magnitude: 1.79,
    color: '#fef3c7',
    x: 350,
    y: 250,
    fact: 'A yellow-white supergiant and the brightest star in Perseus.',
    mythology: 'The Elbow of the Hero.'
  },
  {
    id: 'sirius',
    name: 'Sirius',
    constellation: 'Canis Major',
    magnitude: -1.46,
    color: '#e0f2fe',
    x: 800,
    y: 750,
    fact: 'The brightest star in the night sky.',
    mythology: 'The Greater Dog following Orion.'
  },
  {
    id: 'menkar',
    name: 'Menkar',
    constellation: 'Cetus',
    magnitude: 2.54,
    color: '#fca5a5',
    x: 600,
    y: 600,
    fact: 'An old red giant star in the constellation of Cetus.',
    mythology: 'The Nostrils of the Sea Monster.'
  },
  {
    id: 'jupiter',
    name: 'Jupiter',
    constellation: 'Solar System',
    magnitude: -2.94,
    color: '#fef3c7',
    x: 150,
    y: 400,
    fact: 'The largest planet in our solar system.',
    mythology: 'The King of the Gods.'
  }
];

export const SECTION_1_RIDDLES: Riddle[] = [
  {
    text: "Greetings, my observer. Have you come to me for my story? My tale-ah, old as time-but as I search, my mind finds none.\n\nPerhaps it was I guiding the dots in the sky, or perhaps the year’s chromatic quartet held these autumned hands. Or I could have been travelling along the void, carrying all the glow.\n\nAh! The old days return, I see myself as the gateway to the-ha!- spirit of a beast!\n\nBut oh, well… Assuredly you must yell my name, seer, for I must go, shadowing the Éxi.",
    targetStarId: "aldebaran",
    acceptedAnswers: ["aldebaran"],
    isCustom: true
  },
  {
    text: "For I am at the heart of a Warrior,\nSomewhere around the goat I reside,\nDon’t look at me,\nFor it may lead to your demise\nI may be old and close to death,\nFor the Bull near me has eyes cold as Ice\nWhat star would I be?",
    targetStarId: "mirfak",
    acceptedAnswers: ["mirfak"],
    isCustom: true
  },
  {
    text: "When i look at myself and others there’s not much of a difference that i see,\nBut these humans saw god in me,\nThey claimed i was the reason for the water surge,\nAnd in no time did i know i was the reason for the travel goods,\nWhen i rise, I stand lone in the sky, lustrous like a lonely watcher for you",
    targetStarId: "sirius",
    acceptedAnswers: ["sirius"],
    isCustom: true
  },
  {
    text: "Slain by two champions\nIn twain-told tales.\nThralled by the one with water;\nAt whiles in hide,\nAt whiles in scales.\n\nA star it breathes with a fire-bright shimmer.\nWhat name hight this star of wonder,\nAkin to a name that means “celestial dancer”?",
    targetStarId: "menkar",
    acceptedAnswers: ["menkar"],
    isCustom: true
  },
  {
    text: "The Giant who wished to die in peace,\nThe world wasn’t ready for such a piece,\nFor the mistress had not entered,\nThe System had not partnered\nThe Love Story so grand amongst the Solars\nAs one went for its demise, the other pulled him in\nWho is He that made Love win??",
    targetStarId: "jupiter",
    acceptedAnswers: ["jupiter"],
    isCustom: true
  }
];

export const SECTION_2_RIDDLES: Riddle[] = [
  {
    text: "",
    targetStarId: "polaris",
    imageUrls: ["https://i.ibb.co/8Ldf8JvV/3.jpg"],
    acceptedAnswers: ["polaris"],
  },
  {
    text: "",
    targetStarId: "pisces",
    imageUrls: ["https://i.ibb.co/FL9y8zQd/4.jpg"],
    acceptedAnswers: ["pisces"],
  },
  {
    text: "",
    targetStarId: "spica",
    imageUrls: ["https://i.ibb.co/G320BJjt/5.jpg"],
    acceptedAnswers: ["spica"],
  },
  {
    text: "",
    targetStarId: "alpheratz",
    imageUrls: ["https://i.ibb.co/PGMqxJmp/6.jpg"],
    acceptedAnswers: ["alpheratz"],
  },
  {
    text: "",
    targetStarId: "procyon",
    imageUrls: ["https://i.ibb.co/39LLJSkh/7.jpg"],
    acceptedAnswers: ["procyon"],
  }
];

export const SECTION_3_RIDDLES: Riddle[] = [
  {
    text: "It all begins with an Apple, for if it hadn’t fallen, Humanity would be unaware of the basicity of the Universe. The Concept of Gravity is as old as time, the very first questions as to why we fall down when jumped. Why must one jump from a high place? Why didn’t humanity just float? Why must it lose blood? Why must its skull crush? What happens after death? These questions were asked in the old Philosophical times, but even today in the mind of that one candidate whom everyone called Tarobby, a physicist in the pool of other eligible ones who thought they could fly to space in Humanity’s loneliest Journey. For its in one’s nature to follow curiosity more than any other emotion. Some called them pioneers. Most called them Fools. But to the World Interstellar Committee of Expedition (WICE), they were Voyagers.\n\nOn his last test in a pool of other 10, he was asked to do a certain task:\nOur Expedition begins with Isaac Newton, so you must make sure you follow the 28th Rule on him; down the path, you must look for pictures, the second one is of grave importance for the object in its hand is your next clue. Hop on to the next viewer’s object through the side list 6th amendment is question. The 6th amendment guides you to 5th most important discovery of mankind. In it lies the 7th wonder, see its picture, answer what it is pointing for? Answer the question to begin Lone Voyager’s Journey",
    targetStarId: "newton_apple",
    acceptedAnswers: ["Sagittarius A*", "Sagittarius A"],
    isCustom: true
  },
  {
    text: "He plan’s his way towards the pointing beam in a quest to search the light within:\n\nDeep in the throat of Sagittarius A*, where the galaxy’s spine curves to a point, Chant the opening rite until the sixty-third prayer is finally exhaled. It names a trio of titans, an invisible wind where the spirit is veiled; Take that silent gale and carry it to its vault of the shattered core.\nListen to the stones until the fifty-first murmur is caught; It names a rhythmic heart, a lighthouse the heavens begot. Follow the beam to its shrine and pace the spinning specter’s path, Until the hundred and fortieth step reveals a titan’s cold aftermath.\nCarry this heavy dust to the next station, the fallen one’s remains, And search the thirty-third trace for the weight that physics sustains. It points to the cooling embers, the faded ghosts of the sky; Seek their preamble’s sixty-third secret where the embers lie.\nThere, learn the law of the couple, the truth the duality remembers, Where gravity fetters two souls in a waltz of Twin Suns.",
    targetStarId: "twin_suns",
    acceptedAnswers: ["Binary Star", "Binary System",],
    isCustom: true
  },
  {
    text: "On his journey, he finds his spaceshuttle stuck between the two giant queens. In order to pass, he must solve the riddle to find the answer to get him back towards his original mission. \n\nBegin with the twin stars,\nSeek the one who commands all;\nBending and breaking every bright spark.\nHe hides within his second mansion,\nThe mafia, plotting his fourth mission\nBeyond his half a century mark.\n \nAfter you find the mafia,\nFollow where his secrets lie buried.\nBehold a portrait of him with his loyal shadows,\nBefore a strange brown arc, they gather.\nThe arc has cradled many sons,\nNurtured many stars.\nFirst name the arc, then seek its call.\n\nThe arc opens a path before you.\nNew worlds wait just beyond,\nFourteen steps from where you stand.\nPrecious as scattered jewels,\nThey sleep within a single chest.\nName it.",
    targetStarId: "cosmic_chest",
    acceptedAnswers: ["Solar System"],
    isCustom: true
  },
  {
    text: "His ship is caught in the tides of the Black Hole, his velocity crosses the maximum, the deck is filled with warnings and buzzers, all screaming as if the ship is crying for help, its body disintegrating into the accretion disk, the redness, the heat, the friction, it strips most of what once was the IBAC (International Black hole Associatory Counterdrive), leaving the Physicist in his piece of abandoned deck, still holding on as he enters the Schwarzchild Radius. Now he understood why the Association believed it to be a one-way journey, for he might never see the light again, or in fact, his Universe. But through darkness he finds a beam of light, continuing his from his previous venture\n\nBeginning in an empire of our own, look only to the whisper of text beneath the first portrait of the cosmic family. Follow that hidden roster to the inventory, then descend to the realm of the eight giants who cleared their paths. Above their description sits a \"Main\" crown, a title that separates true worlds from mere ice. You must now forsake our sun and travel deeper into the archives. There, amidst the history of discovery, lies the name of the stranger, the Exoplanet and this link to the foreign worlds is your next chapter.",
    targetStarId: "exoplanet",
    acceptedAnswers: ["Exoplanet", "Extrasolar Planet"],
    isCustom: true
  },
  {
    text: "Towards his journey, something else caught his attention “Life”.\nAlthough it is not so easy for him to reach his destination :\nAs the eclipse formed by a planet, satellite and our sun darkened the sky, the explorer noticed three glowing symbols beneath the shadowed Sun. Instinct told them the second held the key forward. Beyond it, there in the realm of Grand finale and Destruction two luminous routes stretched across space — one marked fifty, the other two-hundred-seven. Drawn to the greater mystery, the explorer followed the larger number. A radiant equation then formed among the stars, demanding balance rather than force.\n\n[[IMAGE_0]]\n\nWhen the explorer solved it, the answer didn’t speak aloud — instead, it quietly pointed them to the first word of the third cosmic clue, as if the universe itself had turned a page in an invisible script. An icy comet drifted past, its silver tail glowing beside a mighty rocket rising toward the heavens. In a hall of captured cosmic moments, the first image revealed hidden words to those who looked closely. The rocket’s name whispered the next clue. In a hall where moments of space were frozen in light, the explorer paused before the very first image.There, three quiet words — the ninth, tenth, and eleventh — revealed themselves to those who knew where to look. The trail then moved through the story of the mission itself, where triumph met sacrifice. Among the records of progress, the explorer discovered the resting place of India’s fallen lunar lander — a silent crash site etched into history — and from it, the next clue emerged. The explorer followed the clues to the rover’s journey across the lunar surface, where the fifth recorded image quietly revealed what came next. At last, in the realm where humans had walked beyond Earth, a single word waited just before a date frozen in time. When all the clues were gathered, the explorer finally understood —the trail pointed to the force behind India’s voyage to the stars. Then came a door, a doorway to his escape from all the hardships he faced, he saw an end and for the end he just had to put the full force in order to get out.",
    targetStarId: "isro_clue",
    acceptedAnswers: ["indian space research organisation"],
    isCustom: true,
    imageUrls: [
      "https://i.ibb.co/CkMNWrM/Whats-App-Image-2026-01-31-at-16-14-38.jpg"
    ]
  },
  {
    text: "The explorer placed the final gathered words into the glowing chamber of stars, certain the journey had reached its end. For a moment, the universe seemed to hold its breath. Light rippled outward like waves across a cosmic ocean. The path ahead shimmered, almost ready to open — and then suddenly collapsed inward, folding space like pages of a book snapping shut. In a flash of starlight, everything rewound. The explorer stood once more at the great celestial crossing — the two glowing paths stretching into infinity. One still bore the mark of fifty, the other two-hundred-seven. Understanding struck like thunder. The longer road had offered knowledge. But not the true escape. With a steady heart, the explorer turned from the deeper numbers and stepped onto the forgotten path — the one marked fifty. The cosmos shifted into flowing lines of glowing text, like a vast record of the universe’s past. Drawn toward the background of the story itself, the explorer drifted into the sixth glowing passage. There, far from the beginning and close to the end, one word pulsed brighter than all the others — the ninety-ninth in the stream of stars — waiting to be discovered. The moment it was touched, space rearranged itself once again. A vast hall of knowledge appeared, carved from starlight and shadow. Countless sections floated in the air like open chapters of the universe. Guided by instinct, the explorer passed six of them and entered the seventh — a place simply named for what it was: a gathering of truths. Beneath an image of the blazing heart of a galaxy, a quiet clue shimmered — the name of an instrument that could see what human eyes never could. The stars then reshaped into endless records of celestial objects — a great cosmic catalog of the universe stretching farther than sight. Within these glowing archives, a moment of discovery replayed itself. Voices echoed across the void, telling of scientists who, long ago in November 2003, uncovered a hidden neighbor of the Milky Way — a faint companion revealed through invisible light. From this recorded discovery, another word slowly rose and shone brighter than the rest. The journey led into a section where scientists disagreed and theories clashed, a place filled with cosmic debates and unanswered questions. At the very end of this passage, the explorer counted backward through the words until one final clue glowed with certainty. The explorer entered a section describing the great halo that surrounds a galaxy — broken into different parts that explained what it is made of. In the third part of this halo’s makeup, a clue appeared about the laws that control motion and gravity in the universe. Suddenly, the stars shattered into strange symbols. A riddle appeared, written in twisting, alien script. The explorer studied it patiently, breaking its code piece by piece until meaning finally emerged. And the meaning pointed forward.\n\n[[IMAGE_0]]\n\n[[IMAGE_1]]\n\nAt last, the universe began to tremble. Stars twisted into spirals of blazing light, space folding inward as though the cosmos itself were drawing a final breath. From the glowing abyss rose a colossal gateway — towering, radiant, and alive with pulsing energy — the true escape from the celestial maze. Its surface shimmered like liquid starlight. A final message burned across the gate, slow and powerful:THE KEY LIES NOT IN NUMBERS, NOR IN SYMBOLS, BUT IN THE GREAT THINKER WHO SHAPED THE LAWS YOU FOLLOWED. The glow split open. Beyond it appeared a vast portrait suspended in space — a lone figure beneath falling apples, eyes lifted toward the heavens as planets drifted around him in silent motion. Above the image, one word stood out — brighter, heavier, and written boldly against the stars. The explorer understood. Hands trembling, the answer was placed into the glowing lock of the universe. The cosmos exploded into light. Galaxies ignited. Stars sang. Space itself unfolded like dawn. The great gate shattered into brilliance. Freedom surged forward like a supernova.",
    targetStarId: "sir_isaac_newton",
    acceptedAnswers: ["Isaac Newton", "Sir Isaac Newton"],
    isCustom: true,
    imageUrls: [
      "https://i.ibb.co/v6gyqBF5/Whats-App-Image-2026-01-31-at-16-11-23-1.jpg",
      "https://i.ibb.co/hF868Xwd/Whats-App-Image-2026-01-31-at-16-11-24.jpg"
    ]
  }
];

export const DECORATIVE_STARS = Array.from({ length: 200 }).map((_, i) => ({
  id: `bg-star-${i}`,
  x: Math.random() * 1000,
  y: Math.random() * 1000,
  size: Math.random() * 2 + 0.5,
  opacity: Math.random() * 0.7 + 0.3,
  duration: 2 + Math.random() * 5,
  delay: Math.random() * 5
}));
