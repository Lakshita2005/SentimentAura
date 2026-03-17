/**
 * SentimentAura — Sentiment Engine
 * Multi-dimensional emotion analysis using a curated lexicon.
 * Detects 8 Plutchik emotions, overall polarity, tone, and word-level attribution.
 */

const EMOTION_LEXICON = {
  // ── JOY ──
  joy: {
    high: ['ecstatic', 'thrilled', 'elated', 'overjoyed', 'euphoric', 'blissful', 'jubilant', 'exhilarated', 'delighted', 'rapturous'],
    medium: ['happy', 'glad', 'cheerful', 'pleased', 'joyful', 'content', 'grateful', 'amused', 'excited', 'wonderful', 'fantastic', 'amazing', 'awesome', 'brilliant', 'great', 'excellent', 'love', 'loving', 'loved', 'adore', 'enjoy', 'enjoying', 'enjoyed', 'celebrate', 'celebrating', 'proud', 'pride', 'paradise', 'blessed', 'beautiful', 'radiant', 'sunshine', 'laugh', 'laughing', 'smile', 'smiling', 'grinning'],
    low: ['okay', 'fine', 'nice', 'good', 'pleasant', 'alright', 'decent', 'fair', 'satisfactory', 'comfortable', 'calm', 'relaxed', 'peaceful', 'serene', 'cool', 'neat', 'sweet', 'appreciate', 'thankful', 'hopeful', 'optimistic', 'positive']
  },
  // ── SADNESS ──
  sadness: {
    high: ['devastated', 'heartbroken', 'miserable', 'anguished', 'despairing', 'grief', 'grieving', 'shattered', 'crushed', 'inconsolable', 'hopeless', 'suicidal', 'depressed', 'tormented', 'wretched'],
    medium: ['sad', 'unhappy', 'sorrowful', 'gloomy', 'melancholy', 'dejected', 'downcast', 'disheartened', 'disappointed', 'regretful', 'lonely', 'lonesome', 'crying', 'tearful', 'weeping', 'mourning', 'hurt', 'wounded', 'broken', 'suffering', 'painful', 'distressed', 'troubled', 'desperate', 'miss', 'missing', 'lost', 'empty'],
    low: ['down', 'low', 'blue', 'bummed', 'upset', 'bothered', 'displeased', 'discouraged', 'unease', 'uneasy', 'wistful', 'nostalgic', 'sigh', 'meh', 'dull', 'bland', 'flat', 'tired', 'weary', 'exhausted', 'drained']
  },
  // ── ANGER ──
  anger: {
    high: ['furious', 'enraged', 'livid', 'seething', 'infuriated', 'outraged', 'irate', 'wrathful', 'ballistic', 'apoplectic', 'hate', 'hatred', 'loathe', 'despise', 'abhor', 'detest', 'murderous', 'vengeance', 'revenge'],
    medium: ['angry', 'mad', 'annoyed', 'irritated', 'frustrated', 'agitated', 'provoked', 'resentful', 'hostile', 'bitter', 'fed up', 'pissed', 'disgusted', 'offended', 'indignant', 'exasperated', 'fuming', 'boiling', 'steaming', 'raging'],
    low: ['bothered', 'irked', 'miffed', 'displeased', 'impatient', 'testy', 'grumpy', 'cranky', 'moody', 'snappy', 'edgy', 'tense', 'cross', 'sore', 'sulky', 'huffy']
  },
  // ── FEAR ──
  fear: {
    high: ['terrified', 'petrified', 'horrified', 'panic', 'panicking', 'paranoid', 'phobia', 'dread', 'dreading', 'nightmarish', 'traumatized', 'traumatic', 'hysterical', 'frantic'],
    medium: ['afraid', 'scared', 'fearful', 'frightened', 'alarmed', 'anxious', 'nervous', 'worried', 'worrying', 'uneasy', 'apprehensive', 'threatened', 'intimidated', 'shaky', 'trembling', 'haunted', 'spooked', 'startled'],
    low: ['unsure', 'uncertain', 'hesitant', 'cautious', 'wary', 'doubtful', 'skeptical', 'suspicious', 'concerned', 'uncomfortable', 'restless', 'jittery', 'fidgety', 'queasy', 'tense']
  },
  // ── SURPRISE ──
  surprise: {
    high: ['astonished', 'astounded', 'flabbergasted', 'stunned', 'stupefied', 'dumbfounded', 'thunderstruck', 'gobsmacked', 'mind-blown', 'jaw-dropping', 'unbelievable', 'incredible', 'miraculous', 'phenomenal'],
    medium: ['surprised', 'amazed', 'shocked', 'startled', 'bewildered', 'baffled', 'perplexed', 'speechless', 'awestruck', 'wonder', 'wondering', 'unexpected', 'unforeseen', 'remarkable', 'extraordinary', 'wow', 'whoa', 'omg'],
    low: ['curious', 'intrigued', 'puzzled', 'confused', 'questioning', 'pondering', 'interesting', 'unusual', 'peculiar', 'odd', 'strange', 'weird', 'hmm', 'huh']
  },
  // ── DISGUST ──
  disgust: {
    high: ['revolting', 'repulsive', 'nauseating', 'vile', 'abhorrent', 'loathsome', 'sickening', 'grotesque', 'atrocious', 'vomit', 'repugnant', 'putrid', 'foul', 'filthy', 'abominable'],
    medium: ['disgusting', 'disgusted', 'gross', 'nasty', 'awful', 'terrible', 'horrible', 'dreadful', 'appalling', 'repelled', 'distasteful', 'offensive', 'obnoxious', 'hideous', 'horrid', 'ghastly', 'gruesome', 'ugh', 'yuck', 'eww'],
    low: ['unpleasant', 'dislike', 'distaste', 'aversion', 'cringe', 'tacky', 'tasteless', 'trashy', 'sleazy', 'slimy', 'creepy', 'icky', 'yucky', 'bleh']
  },
  // ── TRUST ──
  trust: {
    high: ['devoted', 'faithful', 'loyal', 'trustworthy', 'reliable', 'dependable', 'steadfast', 'unwavering', 'committed', 'dedicated', 'wholehearted', 'genuine', 'authentic', 'sincere', 'honorable'],
    medium: ['trust', 'trusting', 'believe', 'believing', 'confident', 'confidence', 'assured', 'secure', 'safe', 'comfortable', 'support', 'supporting', 'supportive', 'honest', 'truthful', 'integrity', 'respect', 'respectful', 'admire', 'admiring', 'value', 'valued'],
    low: ['accept', 'accepting', 'agree', 'agreeable', 'allow', 'open', 'receptive', 'willing', 'cooperative', 'reasonable', 'fair', 'balanced', 'understanding', 'patient', 'tolerant', 'forgiving']
  },
  // ── ANTICIPATION ──
  anticipation: {
    high: ['thrilling', 'exhilarating', 'electrifying', 'riveting', 'passionate', 'obsessed', 'absolutely', 'cannot wait', 'dying to', 'desperate for', 'yearning', 'craving', 'longing', 'burning'],
    medium: ['eager', 'excited', 'enthusiastic', 'looking forward', 'anticipating', 'expecting', 'hopeful', 'optimistic', 'aspiring', 'ambitious', 'motivated', 'inspired', 'determined', 'ready', 'prepared', 'planning', 'dreaming', 'wishing', 'wanting', 'hoping'],
    low: ['curious', 'interested', 'considering', 'thinking about', 'contemplating', 'exploring', 'wondering', 'maybe', 'perhaps', 'possibly', 'potentially', 'eventually', 'someday', 'soon']
  }
};

const NEGATION_WORDS = new Set([
  'not', 'no', 'never', 'neither', 'nobody', 'nothing', 'nowhere', 'nor',
  "don't", "doesn't", "didn't", "won't", "wouldn't", "couldn't", "shouldn't",
  "can't", "cannot", "isn't", "aren't", "wasn't", "weren't", "haven't", "hasn't",
  "hadn't", "barely", "hardly", "scarcely", "seldom", "rarely"
]);

const INTENSIFIERS = {
  'very': 1.3, 'really': 1.3, 'extremely': 1.5, 'incredibly': 1.5, 'absolutely': 1.5,
  'totally': 1.4, 'completely': 1.4, 'utterly': 1.5, 'truly': 1.3, 'deeply': 1.4,
  'highly': 1.3, 'terribly': 1.4, 'awfully': 1.4, 'remarkably': 1.3, 'exceptionally': 1.4,
  'so': 1.2, 'such': 1.2, 'quite': 1.1, 'rather': 1.1, 'pretty': 1.1,
  'most': 1.3, 'super': 1.3, 'mega': 1.4, 'ultra': 1.5, 'way': 1.2
};

const DIMINISHERS = {
  'slightly': 0.6, 'somewhat': 0.7, 'a bit': 0.7, 'a little': 0.7, 'kind of': 0.7,
  'sort of': 0.7, 'barely': 0.5, 'hardly': 0.5, 'mildly': 0.6, 'marginally': 0.5,
  'just': 0.8, 'only': 0.8, 'merely': 0.6
};

const TONE_PATTERNS = {
  aggressive: [
    /\byou always\b/i, /\byou never\b/i, /\bshut up\b/i, /\bstupid\b/i,
    /\bidiot\b/i, /\bdumb\b/i, /\bpathetic\b/i, /\bworthless\b/i,
    /\buseless\b/i, /\bget lost\b/i, /\bgo away\b/i, /\bi don't care\b/i,
    /\bwhat(?:'s| is) wrong with you/i, /\bhow dare you\b/i,
    /!{2,}/, /[A-Z]{4,}/
  ],
  passive_aggressive: [
    /\bwhatever\b/i, /\bfine\b.*\bdo what you want\b/i, /\bi guess\b/i,
    /\bif you say so\b/i, /\bno offense\b/i, /\bjust saying\b/i,
    /\bi'm not mad\b/i, /\bit's fine\b/i, /\bsure\b.*\b(whatever|okay)\b/i,
    /\bthanks for nothing\b/i, /\bmust be nice\b/i,
    /\bi would have thought\b/i, /\bi'm sorry you feel that way\b/i
  ],
  sarcastic: [
    /\byeah right\b/i, /\boh great\b/i, /\boh wonderful\b/i,
    /\boh perfect\b/i, /\bwow\b.*\bjust\b/i, /\bsure\b.*\bbuddy\b/i,
    /\bthat's just great\b/i, /\bhow lovely\b/i, /\boh how nice\b/i,
    /\breally\?\s*really\?/i, /\bbravo\b/i, /\bclap\s*clap\b/i,
    /\bclearly\b/i, /\bobviously\b/i
  ],
  empathetic: [
    /\bi understand\b/i, /\bi feel you\b/i, /\bthat must be\b/i,
    /\bi'm here for you\b/i, /\bi'm sorry to hear\b/i,
    /\btake your time\b/i, /\bit's okay\b/i, /\byou're not alone\b/i,
    /\bi care\b/i, /\bhow are you feeling\b/i, /\bthat sounds hard\b/i,
    /\bi appreciate\b/i, /\bthank you for sharing\b/i
  ],
  formal: [
    /\bregarding\b/i, /\bfurthermore\b/i, /\bmoreover\b/i,
    /\bnevertheless\b/i, /\bconsequently\b/i, /\btherefore\b/i,
    /\bin accordance\b/i, /\bplease be advised\b/i, /\bkindly\b/i,
    /\bi would like to\b/i, /\bplease find\b/i, /\brespectfully\b/i,
    /\bsincerely\b/i, /\bpursuant\b/i
  ],
  informal: [
    /\bgonna\b/i, /\bwanna\b/i, /\bgotta\b/i, /\bya\b/i,
    /\blol\b/i, /\bomg\b/i, /\bbtw\b/i, /\bidk\b/i,
    /\bimo\b/i, /\btbh\b/i, /\bngl\b/i, /\bfr\b/i,
    /\bbruh\b/i, /\bdude\b/i, /\bchill\b/i, /\bvibes\b/i,
    /\blit\b/i, /\bbro\b/i, /\byolo\b/i, /\bfomo\b/i
  ]
};

export function analyzeSentiment(text) {
  if (!text || !text.trim()) return null;

  const words = tokenize(text);
  const emotions = { joy: 0, sadness: 0, anger: 0, fear: 0, surprise: 0, disgust: 0, trust: 0, anticipation: 0 };
  const wordAttributions = [];

  for (let i = 0; i < words.length; i++) {
    const word = words[i].toLowerCase();
    const prevWord = i > 0 ? words[i - 1].toLowerCase() : '';
    const prevPrevWord = i > 1 ? words[i - 2].toLowerCase() : '';
    const isNegated = NEGATION_WORDS.has(prevWord) || NEGATION_WORDS.has(prevPrevWord);

    let intensifierMult = 1;
    if (INTENSIFIERS[prevWord]) intensifierMult = INTENSIFIERS[prevWord];
    if (DIMINISHERS[prevWord]) intensifierMult = DIMINISHERS[prevWord];

    for (const [emotion, levels] of Object.entries(EMOTION_LEXICON)) {
      let baseScore = 0;
      if (levels.high.includes(word)) baseScore = 90;
      else if (levels.medium.includes(word)) baseScore = 55;
      else if (levels.low.includes(word)) baseScore = 25;

      if (baseScore > 0) {
        let finalScore = baseScore * intensifierMult;
        if (isNegated) {
          const opposite = getOpposite(emotion);
          if (opposite) {
            emotions[opposite] += finalScore * 0.6;
            wordAttributions.push({ word: words[i], emotion: opposite, intensity: finalScore * 0.6, negated: true });
          }
        } else {
          emotions[emotion] += finalScore;
          wordAttributions.push({ word: words[i], emotion, intensity: finalScore, negated: false });
        }
      }
    }
  }

  const maxPossible = Math.max(...Object.values(emotions), 1);
  const normalizedEmotions = {};
  for (const [emotion, score] of Object.entries(emotions)) {
    normalizedEmotions[emotion] = Math.min(100, Math.round((score / maxPossible) * 100));
  }

  const positiveScore = emotions.joy + emotions.trust + emotions.anticipation + emotions.surprise * 0.3;
  const negativeScore = emotions.sadness + emotions.anger + emotions.fear + emotions.disgust;
  const total = positiveScore + negativeScore || 1;
  const polarity = {
    label: positiveScore > negativeScore * 1.2 ? 'Positive' :
      negativeScore > positiveScore * 1.2 ? 'Negative' : 'Neutral',
    positivePercent: Math.round((positiveScore / total) * 100),
    negativePercent: Math.round((negativeScore / total) * 100),
    confidence: Math.round(Math.abs(positiveScore - negativeScore) / total * 100)
  };

  const tones = detectTones(text);

  const dominant = Object.entries(normalizedEmotions)
    .sort((a, b) => b[1] - a[1])
    .filter(([, v]) => v > 0);

  return {
    emotions: normalizedEmotions,
    polarity,
    tones,
    dominant: dominant.length > 0 ? dominant[0][0] : 'neutral',
    dominantScore: dominant.length > 0 ? dominant[0][1] : 0,
    topEmotions: dominant.slice(0, 3).map(([k, v]) => ({ emotion: k, score: v })),
    wordAttributions,
    rawEmotions: emotions
  };
}

function tokenize(text) {
  return text.replace(/[^\w\s'-]/g, ' ').split(/\s+/).filter(w => w.length > 0);
}

function getOpposite(emotion) {
  const pairs = { joy: 'sadness', sadness: 'joy', anger: 'trust', trust: 'anger', fear: 'anticipation', anticipation: 'fear', surprise: 'anticipation', disgust: 'trust' };
  return pairs[emotion] || null;
}

function detectTones(text) {
  const detected = [];
  for (const [tone, patterns] of Object.entries(TONE_PATTERNS)) {
    let matchCount = 0;
    for (const pattern of patterns) {
      if (pattern.test(text)) matchCount++;
    }
    if (matchCount > 0) {
      detected.push({
        tone: tone.replace('_', '-'),
        strength: matchCount >= 3 ? 'strong' : matchCount >= 2 ? 'moderate' : 'mild'
      });
    }
  }
  if (detected.length === 0) detected.push({ tone: 'neutral', strength: 'moderate' });
  return detected;
}

export const EMOTION_EMOJIS = {
  joy: '😊', sadness: '😢', anger: '😠', fear: '😨',
  surprise: '😲', disgust: '🤢', trust: '🤝', anticipation: '🔮'
};

export const EMOTION_COLORS = {
  joy: '#FFD93D', sadness: '#6C9BCF', anger: '#FF6B6B', fear: '#A66CFF',
  surprise: '#FF9F43', disgust: '#6BCB77', trust: '#4D96FF', anticipation: '#FF6EC7'
};
