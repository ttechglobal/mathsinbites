// src/lib/modes.js
// Full 5-mode token system for MathsInBites
// Usage: import { MODES } from '@/lib/modes'

export const MODES = {
  normal: {
    id: 'normal', name: 'Normal Mode', emoji: '📗',
    tagline: 'Clean and simple — just learn',
    description: 'Classic green theme. Distraction-free, familiar, easy on the eyes.',
    font: 'Nunito, sans-serif', headingFont: 'Nunito, sans-serif',
    fontClass: 'font-nunito', headingFontClass: 'font-nunito',

    // Backgrounds
    mapBg: 'linear-gradient(180deg,#f0fdfa 0%,#ccfbf1 60%,#a7f3d0 100%)',
    lessonBg: '#f0fdfa', hudBg: 'rgba(255,255,255,0.95)',
    homeBg: '#f0fdfa', hookBg: '#f0fdfa',

    // Cards
    cardBg: '#ffffff', cardBorder: '1.5px solid #e0f2f1',
    cardRadius: 14, cardShadow: '0 3px 12px rgba(0,0,0,0.07)',
    lessonCard: '#ffffff', lessonBorder: '1.5px solid #e0f2f1',

    // Text
    textPrimary: '#1a1a1a', textSecondary: '#888888', textOnAccent: '#ffffff',

    // Accents
    accentColor: '#0d9488', accent2: '#f97316',
    correctColor: '#22c55e', wrongColor: '#ef4444',

    // Nav
    navBg: '#ffffff', navBorder: '#e8e8e8',
    navActive: '#0d9488', navActiveText: '#ffffff',
    navText: '#bbbbbb', navActivePill: 'rgba(13,148,136,0.12)',

    // Sidebar
    sidebarBg: '#ffffff', sidebarBorder: '#e8e8e8',
    sidebarText: '#1a1a1a', sidebarDim: '#888888',
    sidebarActive: 'rgba(13,148,136,0.1)', sidebarActiveBorder: '#0d9488',

    // Lesson internals
    mathBg: '#f8fffe', hintBg: 'rgba(13,148,136,0.06)',
    progressTrack: '#e0f2f1',
    correctOverlay: 'rgba(240,253,250,0.97)', wrongBg: '#fff5f5',

    // HUD badges
    badgeBg: 'rgba(13,148,136,0.1)', badgeBorder: 'rgba(13,148,136,0.25)',
    badgeText: '#1a1a1a',

    // Phrases
    correctPhrase: 'Correct! Well done! 🎉',
    wrongPhrase: "Not this time — here's how:",
    hookPhrase: "Let's work through this step by step. You've got this! 🚀",
    welcomeTitle: 'Hey! Ready to learn? 👋',

    // Buttons
    primaryBtn: {
      background: 'linear-gradient(135deg,#0d9488,#14b8a6)', color: '#fff',
      border: 'none', borderRadius: 12, padding: '12px 18px',
      fontFamily: 'Nunito, sans-serif', fontSize: 14, fontWeight: 900,
      cursor: 'pointer', textAlign: 'center',
    },
    ghostBtn: {
      background: 'transparent', color: '#888',
      border: '1.5px solid #e0f2f1', borderRadius: 12, padding: '12px 18px',
      fontFamily: 'Nunito, sans-serif', fontSize: 13, fontWeight: 700,
      cursor: 'pointer', textAlign: 'center',
    },

    // Quest map
    termAccents: ['#0d9488', '#f97316', '#8b5cf6'],
    nodeNext: 'linear-gradient(145deg,#0d9488,#14b8a6)',
    nodeLocked: 'linear-gradient(145deg,#e8e8e8,#d0d0d0)',
    nodeNextGlow: '#0d9488',
    pathStroke: 'rgba(13,148,136,0.25)',

    chestDone: '🏆', chestLocked: '🎁',
    endText: 'More topics coming soon…',
    floatSyms: ['x²','∑','π','√','∫','θ','∞','±','Δ'],
    floatColor: 'rgba(13,148,136,0.12)',
    floatFont: "'Courier New',monospace",
  },

  nova: {
    id: 'nova', name: 'Nova Mode', emoji: '🌌',
    tagline: 'Learn like the universe depends on it',
    description: 'Dark, cosmic, electric. For learners who want to feel powerful.',
    font: 'Fredoka One, Nunito, sans-serif', headingFont: 'Fredoka One, sans-serif',
    fontClass: 'font-fredoka', headingFontClass: 'font-fredoka',

    mapBg: 'linear-gradient(180deg,#0F0C29 0%,#1E1B4B 60%,#2D1B69 100%)',
    lessonBg: '#0F0C29', hudBg: 'rgba(15,12,41,0.95)',
    homeBg: 'linear-gradient(180deg,#0F0C29 0%,#1E1B4B 60%,#2D1B69 100%)',
    hookBg: '#1E1B4B',

    cardBg: '#1E1B4B', cardBorder: '1.5px solid rgba(165,180,252,0.12)',
    cardRadius: 14, cardShadow: '0 4px 16px rgba(0,0,0,0.4)',
    lessonCard: '#1E1B4B', lessonBorder: '1.5px solid rgba(165,180,252,0.12)',

    textPrimary: '#F8F7FF', textSecondary: '#A5B4FC', textOnAccent: '#0F0C29',

    accentColor: '#FCD34D', accent2: '#67E8F9',
    correctColor: '#A3E635', wrongColor: '#FF6B6B',

    navBg: '#1E1B4B', navBorder: 'rgba(165,180,252,0.1)',
    navActive: '#7C3AED', navActiveText: '#F8F7FF',
    navText: '#6D6B8F', navActivePill: 'linear-gradient(135deg,rgba(124,58,237,0.6),rgba(76,29,149,0.6))',

    sidebarBg: '#0F0C29', sidebarBorder: 'rgba(165,180,252,0.1)',
    sidebarText: '#F8F7FF', sidebarDim: 'rgba(165,180,252,0.5)',
    sidebarActive: 'rgba(124,58,237,0.3)', sidebarActiveBorder: '#7C3AED',

    mathBg: 'rgba(255,255,255,0.05)', hintBg: 'rgba(252,211,77,0.08)',
    progressTrack: 'rgba(165,180,252,0.12)',
    correctOverlay: 'rgba(15,12,41,0.97)', wrongBg: '#1E1B4B',

    badgeBg: 'rgba(255,255,255,0.08)', badgeBorder: 'rgba(165,180,252,0.2)',
    badgeText: '#F8F7FF',

    correctPhrase: 'Correct! +25 XP 🌟',
    wrongPhrase: "Not quite — here's the path:",
    hookPhrase: "Two equations, two unknowns — we'll eliminate one to find the other. Ready? 🚀",
    welcomeTitle: 'Kola here. Let\'s unlock the cosmos. 🌌',

    primaryBtn: {
      background: 'linear-gradient(135deg,#FCD34D,#F59E0B)', color: '#0F0C29',
      border: 'none', borderRadius: 12, padding: '12px 18px',
      fontFamily: 'Fredoka One, sans-serif', fontSize: 14, fontWeight: 900,
      cursor: 'pointer', textAlign: 'center',
    },
    ghostBtn: {
      background: 'rgba(255,255,255,0.05)', color: '#A5B4FC',
      border: '1.5px solid rgba(165,180,252,0.2)', borderRadius: 12,
      padding: '12px 18px', fontFamily: 'Nunito, sans-serif', fontSize: 13,
      fontWeight: 700, cursor: 'pointer', textAlign: 'center',
    },

    termAccents: ['#67E8F9', '#A3E635', '#FF6B6B'],
    nodeNext: 'linear-gradient(145deg,#FCD34D,#F59E0B)',
    nodeLocked: 'linear-gradient(145deg,#2a2550,#1e1b3a)',
    nodeNextGlow: '#FCD34D',
    pathStroke: 'rgba(165,180,252,0.15)',

    chestDone: '🌟', chestLocked: '🔮',
    endText: 'The universe has more lessons loading…',
    floatSyms: ['∑','π','∞','Δ','θ','λ','Ω','α','β'],
    floatColor: 'rgba(165,180,252,0.2)',
    floatFont: "'Fredoka One',sans-serif",
  },

  spark: {
    id: 'spark', name: 'Spark Mode', emoji: '✨',
    tagline: 'Every question lights something up',
    description: 'Bright, warm, joyful. For learners who love colour and energy.',
    font: 'Baloo 2, Nunito, sans-serif', headingFont: 'Baloo 2, sans-serif',
    fontClass: 'font-baloo', headingFontClass: 'font-baloo',

    mapBg: 'linear-gradient(180deg,#87CEEB 0%,#B0E2FF 35%,#FFFBF5 65%)',
    lessonBg: '#FFFBF5', hudBg: 'rgba(255,255,255,0.9)',
    homeBg: 'linear-gradient(180deg,#87CEEB 0%,#FFFBF5 100%)',
    hookBg: '#FFF7F0',

    cardBg: '#FFFFFF', cardBorder: '1.5px solid #F0E6D8',
    cardRadius: 16, cardShadow: '0 3px 12px rgba(0,0,0,0.07)',
    lessonCard: '#FFFFFF', lessonBorder: '1.5px solid #F0E6D8',

    textPrimary: '#2D2D2D', textSecondary: '#888888', textOnAccent: '#ffffff',

    accentColor: '#FF8C42', accent2: '#4ECDC4',
    correctColor: '#56C43A', wrongColor: '#E63946',

    navBg: '#FFFFFF', navBorder: '#F0E6D8',
    navActive: '#FF8C42', navActiveText: '#fff',
    navText: '#BBB', navActivePill: 'rgba(255,140,66,0.12)',

    sidebarBg: '#FFFFFF', sidebarBorder: '#F0E6D8',
    sidebarText: '#2D2D2D', sidebarDim: '#888',
    sidebarActive: 'rgba(255,140,66,0.1)', sidebarActiveBorder: '#FF8C42',

    mathBg: '#FFF7F0', hintBg: 'rgba(255,140,66,0.07)',
    progressTrack: '#F0E6D8',
    correctOverlay: 'rgba(255,251,245,0.97)', wrongBg: '#fff0f0',

    badgeBg: 'rgba(255,140,66,0.12)', badgeBorder: 'rgba(255,140,66,0.25)',
    badgeText: '#333',

    correctPhrase: 'Brilliant! You got it! 🎉',
    wrongPhrase: "Oops! Let me show you:",
    hookPhrase: "Imagine two friends selling snacks! Let's figure out how many each sold. This is fun! 🌟",
    welcomeTitle: "Ade here! Let's make maths FUN! ✨",

    primaryBtn: {
      background: 'linear-gradient(135deg,#FF8C42,#FF6B35)', color: 'white',
      border: 'none', borderRadius: 14, padding: '12px 18px',
      fontFamily: 'Baloo 2, sans-serif', fontSize: 14, fontWeight: 900,
      cursor: 'pointer', textAlign: 'center',
    },
    ghostBtn: {
      background: 'transparent', color: '#aaa',
      border: '1.5px solid #E8E8E8', borderRadius: 14, padding: '12px 18px',
      fontFamily: 'Nunito, sans-serif', fontSize: 13, fontWeight: 700,
      cursor: 'pointer', textAlign: 'center',
    },

    termAccents: ['#4ECDC4', '#FF8C42', '#C77DFF'],
    nodeNext: 'linear-gradient(145deg,#FFD93D,#FF8C42)',
    nodeLocked: 'linear-gradient(145deg,#F0F0F0,#E0E0E0)',
    nodeNextGlow: '#FF8C42',
    pathStroke: 'rgba(255,140,66,0.3)',

    chestDone: '🎉', chestLocked: '🎁',
    endText: 'More exciting topics loading! ⚡',
    floatSyms: ['☀️','⭐','✨','🌟','💡','🎯','🔥','💫','🌈'],
    floatColor: 'rgba(255,140,66,0.15)',
    floatFont: "'Baloo 2',sans-serif",
  },

  roots: {
    id: 'roots', name: 'Roots Mode', emoji: '🇳🇬',
    tagline: 'Our culture, our maths, our pride',
    description: 'Ankara patterns, bold Nigerian colours. Proudly and uniquely ours.',
    font: 'Syne, Nunito, sans-serif', headingFont: 'Syne, sans-serif',
    fontClass: 'font-syne', headingFontClass: 'font-syne',

    mapBg: 'linear-gradient(180deg,#FBF7F0 0%,#F5EDD8 50%,#EDE0C8 100%)',
    lessonBg: '#FBF7F0', hudBg: 'rgba(251,247,240,0.94)',
    homeBg: 'linear-gradient(180deg,#FBF7F0 0%,#F5EDD8 100%)',
    hookBg: '#FFF8EE',

    cardBg: '#FFFFFF', cardBorder: '1.5px solid #E8DCC8',
    cardRadius: 12, cardShadow: '0 3px 12px rgba(0,0,0,0.06)',
    lessonCard: '#FFFFFF', lessonBorder: '1.5px solid #E8DCC8',

    textPrimary: '#1A0505', textSecondary: '#7A6A55', textOnAccent: '#fff',

    accentColor: '#C0392B', accent2: '#2D6A4F',
    correctColor: '#2D6A4F', wrongColor: '#C0392B',

    navBg: '#FBF7F0', navBorder: '#E8DCC8',
    navActive: '#C0392B', navActiveText: '#fff',
    navText: '#B0A090', navActivePill: 'rgba(192,57,43,0.1)',

    sidebarBg: '#FBF7F0', sidebarBorder: '#E8DCC8',
    sidebarText: '#1A0505', sidebarDim: '#7A6A55',
    sidebarActive: 'rgba(192,57,43,0.08)', sidebarActiveBorder: '#C0392B',

    mathBg: '#FFF8EE', hintBg: 'rgba(192,57,43,0.05)',
    progressTrack: '#E8DCC8',
    correctOverlay: 'rgba(251,247,240,0.97)', wrongBg: '#FFF0EE',

    badgeBg: 'rgba(230,184,0,0.15)', badgeBorder: 'rgba(230,184,0,0.35)',
    badgeText: '#3D200A',

    correctPhrase: 'Ehen! Correct! Chukwu go bless! 🎊',
    wrongPhrase: "Chai! Almost — follow these steps:",
    hookPhrase: "Chidi and Amaka dey sell food for market — let's calculate their profits! Oya! 🇳🇬",
    welcomeTitle: "Chinwe dey here! Make we do maths together! 🇳🇬",

    primaryBtn: {
      background: 'linear-gradient(135deg,#C0392B,#96281B)', color: 'white',
      border: 'none', borderRadius: 10, padding: '12px 18px',
      fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 800,
      cursor: 'pointer', textAlign: 'center',
    },
    ghostBtn: {
      background: 'transparent', color: '#7A6A55',
      border: '1.5px solid #E8DCC8', borderRadius: 10, padding: '12px 18px',
      fontFamily: 'Nunito, sans-serif', fontSize: 13, fontWeight: 700,
      cursor: 'pointer', textAlign: 'center',
    },

    termAccents: ['#2D6A4F', '#C0392B', '#1A1F6B'],
    nodeNext: 'linear-gradient(145deg,#E6B800,#FFD700)',
    nodeLocked: 'linear-gradient(145deg,#E8E0D4,#D8D0C4)',
    nodeNextGlow: '#E6B800',
    pathStroke: 'rgba(192,57,43,0.2)',

    chestDone: '👑', chestLocked: '🎁',
    endText: 'More topics coming — e go sweet! 🇳🇬',
    floatSyms: ['◆','◇','✦','▲','●','◐','★','◈','⬡'],
    floatColor: 'rgba(192,57,43,0.08)',
    floatFont: "'Syne',sans-serif",
  },

  blaze: {
    id: 'blaze', name: 'Blaze Mode', emoji: '💥',
    tagline: 'Maths is your superpower',
    description: 'Bold comic energy, Nigerian superhero vibes. Maths has never looked this fierce.',
    font: 'Bangers, Nunito, sans-serif', headingFont: 'Bangers, sans-serif',
    fontClass: 'font-bangers', headingFontClass: 'font-bangers',

    mapBg: '#FFFEF5',
    lessonBg: '#FFFEF5', hudBg: 'rgba(255,254,245,0.95)',
    homeBg: '#FFFEF5', hookBg: '#FFFDE8',

    cardBg: '#FFFFFF', cardBorder: '2px solid #0d0d0d',
    cardRadius: 10, cardShadow: '3px 3px 0 #0d0d0d',
    lessonCard: '#FFFFFF', lessonBorder: '2px solid #0d0d0d',

    textPrimary: '#0d0d0d', textSecondary: '#555555', textOnAccent: '#0d0d0d',

    accentColor: '#E63946', accent2: '#1D3557',
    correctColor: '#2DC653', wrongColor: '#E63946',

    navBg: '#FFFEF5', navBorder: '#0d0d0d',
    navActive: '#E63946', navActiveText: '#fff',
    navText: '#aaa', navActivePill: 'rgba(230,57,70,0.1)',

    sidebarBg: '#FFFEF5', sidebarBorder: '#0d0d0d',
    sidebarText: '#0d0d0d', sidebarDim: '#555',
    sidebarActive: 'rgba(230,57,70,0.1)', sidebarActiveBorder: '#E63946',

    mathBg: '#FFFDE8', hintBg: '#FFF5C0',
    progressTrack: '#E8E8E8',
    correctOverlay: 'rgba(255,254,245,0.97)', wrongBg: '#FFF0F0',

    badgeBg: '#FFD700', badgeBorder: '#0d0d0d',
    badgeText: '#0d0d0d',

    correctPhrase: 'POW! YOU NAILED IT!! 💥',
    wrongPhrase: "BONK! Not quite — here's the move:",
    hookPhrase: "SUPER CHALLENGE INCOMING! Can you crack this maths mission?! ⚡",
    welcomeTitle: "ZAP ACTIVATED. MATHS MISSION BEGINS. ⚡",

    primaryBtn: {
      background: '#FFD700', color: '#0d0d0d',
      border: '2px solid #0d0d0d', borderRadius: 8,
      padding: '11px 18px', fontFamily: 'Bangers, sans-serif',
      fontSize: 16, letterSpacing: 1,
      cursor: 'pointer', textAlign: 'center',
      boxShadow: '3px 3px 0 #0d0d0d',
    },
    ghostBtn: {
      background: 'transparent', color: '#555',
      border: '2px solid #ccc', borderRadius: 8, padding: '11px 18px',
      fontFamily: 'Nunito, sans-serif', fontSize: 13, fontWeight: 700,
      cursor: 'pointer', textAlign: 'center',
      boxShadow: '2px 2px 0 #ccc',
    },

    termAccents: ['#00B4D8', '#E63946', '#FFD700'],
    nodeNext: '#FFD700',
    nodeLocked: '#E8E8E8',
    nodeNextGlow: '#FFD700',
    pathStroke: 'rgba(0,0,0,0.15)',

    chestDone: '💥', chestLocked: '🔒',
    endText: 'MORE MISSIONS UNLOCKING SOON. STAY READY. 💥',
    floatSyms: ['POW','ZAP','BAM','BOOM','WOW','KO!','YES','ACE','WIN'],
    floatColor: 'rgba(230,57,70,0.07)',
    floatFont: "'Bangers',sans-serif",
  },
  halima: {
    id: 'halima', name: 'Northern Mode', emoji: '📚',
    tagline: 'From Kano to the top of the class',
    description: 'Warm terracotta and sandy gold. For students who know hard work wins.',
    font: 'Sora, Nunito, sans-serif', headingFont: 'Sora, sans-serif',
    fontClass: 'font-sora', headingFontClass: 'font-sora',

    // Backgrounds — warm sandy tones of Northern Nigeria
    mapBg: 'linear-gradient(180deg,#FDF6EC 0%,#F5E6CC 60%,#EDD5A8 100%)',
    lessonBg: '#FDF6EC', hudBg: 'rgba(253,246,236,0.95)',
    homeBg: 'linear-gradient(180deg,#FDF6EC 0%,#F5E6CC 100%)',
    hookBg: '#FFF8EE',

    // Cards
    cardBg: '#FFFFFF', cardBorder: '1.5px solid #E8D5B0',
    cardRadius: 14, cardShadow: '0 3px 12px rgba(196,100,40,0.08)',
    lessonCard: '#FFFFFF', lessonBorder: '1.5px solid #E8D5B0',

    // Text
    textPrimary: '#2A1505', textSecondary: '#8A6A45', textOnAccent: '#ffffff',

    // Accents — terracotta + school navy
    accentColor: '#C46428', accent2: '#2A5298',
    correctColor: '#2A7A3B', wrongColor: '#C0392B',

    // Nav
    navBg: '#FDF6EC', navBorder: '#E8D5B0',
    navActive: '#C46428', navActiveText: '#ffffff',
    navText: '#C4A882', navActivePill: 'rgba(196,100,40,0.12)',

    // Sidebar
    sidebarBg: '#FDF6EC', sidebarBorder: '#E8D5B0',
    sidebarText: '#2A1505', sidebarDim: '#8A6A45',
    sidebarActive: 'rgba(196,100,40,0.09)', sidebarActiveBorder: '#C46428',

    // Lesson internals
    mathBg: '#FFF8EE', hintBg: 'rgba(196,100,40,0.06)',
    progressTrack: '#E8D5B0',
    correctOverlay: 'rgba(253,246,236,0.97)', wrongBg: '#FFF0EE',

    // HUD badges
    badgeBg: 'rgba(212,168,83,0.15)', badgeBorder: 'rgba(212,168,83,0.35)',
    badgeText: '#2A1505',

    // Phrases — warm, encouraging, school-proud
    correctPhrase: 'Na gode! Correct! Keep going! 📚',
    wrongPhrase: "No wahala — here's the working:",
    hookPhrase: "Halima dey here! This topic is easier than you think — let's break it down together! 🌟",
    welcomeTitle: "HalimaShine is ready! Let's make maths shine! 📚",

    // Buttons
    primaryBtn: {
      background: 'linear-gradient(135deg,#C46428,#A0480E)', color: '#fff',
      border: 'none', borderRadius: 12, padding: '12px 18px',
      fontFamily: 'Fredoka One, sans-serif', fontSize: 14, fontWeight: 900,
      cursor: 'pointer', textAlign: 'center',
    },
    ghostBtn: {
      background: 'transparent', color: '#8A6A45',
      border: '1.5px solid #E8D5B0', borderRadius: 12, padding: '12px 18px',
      fontFamily: 'Nunito, sans-serif', fontSize: 13, fontWeight: 700,
      cursor: 'pointer', textAlign: 'center',
    },

    // Quest map
    termAccents: ['#C46428', '#2A5298', '#D4A853'],
    nodeNext: 'linear-gradient(145deg,#D4A853,#C46428)',
    nodeLocked: 'linear-gradient(145deg,#E8D5B0,#D5C4A0)',
    nodeNextGlow: '#D4A853',
    pathStroke: 'rgba(196,100,40,0.22)',

    chestDone: '🏆', chestLocked: '🎁',
    endText: 'More topics coming — keep shining! 📚',
    floatSyms: ['x²', '∑', 'π', '√', '∫', 'θ', '∞', '±', 'Δ'],
    floatColor: 'rgba(196,100,40,0.09)',
    floatFont: "'Fredoka One',sans-serif",
  },

}

export const MODE_IDS = Object.keys(MODES)
