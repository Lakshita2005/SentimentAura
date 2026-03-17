/**
 * SentimentAura — Suggestion Engine
 * Generates alternative phrasings based on detected sentiment patterns.
 */

const AGGRESSIVE_PATTERNS = [
  {
    pattern: /\byou always\s+(.+)/i,
    suggestions: [
      { text: (m) => `I've noticed that ${m[1]} happens frequently, and I'd like to discuss it`, reason: 'Replaces accusation with an observation using "I" statements' },
      { text: (m) => `It seems like ${m[1]} is a recurring pattern — can we talk about it?`, reason: 'Frames the issue as a shared concern' },
      { text: (m) => `I feel concerned when ${m[1]} keeps happening`, reason: 'Uses feeling-based language instead of blaming' }
    ]
  },
  {
    pattern: /\byou never\s+(.+)/i,
    suggestions: [
      { text: (m) => `I would appreciate it if you could ${m[1]}`, reason: 'Turns a complaint into a constructive request' },
      { text: (m) => `It would mean a lot to me if ${m[1]} happened more often`, reason: 'Expresses the desired outcome positively' },
      { text: (m) => `I've been feeling like ${m[1]} hasn't been happening lately — can we talk?`, reason: 'Opens dialogue without accusation' }
    ]
  },
  {
    pattern: /\bshut up\b/i,
    suggestions: [
      { text: () => `I need a moment to collect my thoughts`, reason: 'Expresses the need for space without being dismissive' },
      { text: () => `Could we take a pause and revisit this calmly?`, reason: 'Suggests a break instead of silencing the other person' },
      { text: () => `I'm feeling overwhelmed — let's continue this later`, reason: 'Acknowledges your own state honestly' }
    ]
  },
  {
    pattern: /\b(stupid|idiot|dumb|moron|fool)\b/i,
    suggestions: [
      { text: () => `I disagree with that approach, and here's why...`, reason: 'Focuses on the idea, not the person' },
      { text: () => `I think there might be a better way to look at this`, reason: 'Redirects to constructive dialogue' },
      { text: () => `That perspective doesn't resonate with me — let me share mine`, reason: 'Maintains respect while disagreeing' }
    ]
  },
  {
    pattern: /\bi hate\s+(.+)/i,
    suggestions: [
      { text: (m) => `I'm really struggling with ${m[1]}`, reason: 'Expresses difficulty without absolute negativity' },
      { text: (m) => `${m[1]} is something I find very challenging`, reason: 'Reframes hatred as a difficulty to overcome' },
      { text: (m) => `I have strong feelings about ${m[1]} — let me explain why`, reason: 'Acknowledges intensity while opening discussion' }
    ]
  },
  {
    pattern: /\bi don'?t care\b/i,
    suggestions: [
      { text: () => `I'm feeling indifferent about this right now`, reason: 'Honestly states your feeling without dismissing others' },
      { text: () => `This isn't a priority for me at the moment, but I respect your perspective`, reason: 'Validates the other person while expressing your stance' },
      { text: () => `I need some time before I can engage with this topic`, reason: 'Acknowledges emotional unavailability' }
    ]
  },
  {
    pattern: /\b(what(?:'s| is) wrong with you|how dare you)\b/i,
    suggestions: [
      { text: () => `I'm surprised by what happened, and I'd like to understand your perspective`, reason: 'Seeks understanding instead of attacking' },
      { text: () => `That wasn't what I expected — can we talk about why it happened?`, reason: 'Opens a constructive conversation' },
      { text: () => `I felt hurt by that, and I'd appreciate an explanation`, reason: 'Uses "I" statements to express impact' }
    ]
  }
];

const PASSIVE_AGGRESSIVE_PATTERNS = [
  {
    pattern: /\b(whatever|fine|if you say so)\b/i,
    suggestions: [
      { text: () => `I see your point, even if I don't fully agree`, reason: 'Acknowledges the other view honestly' },
      { text: () => `I have a different perspective — would you like to hear it?`, reason: 'Invites dialogue instead of withdrawing' },
      { text: () => `I'm not entirely comfortable with this, and I'd like to discuss it further`, reason: 'States discomfort directly' }
    ]
  },
  {
    pattern: /\bthanks for nothing\b/i,
    suggestions: [
      { text: () => `I was hoping for more help with this — could we try again?`, reason: 'Expresses disappointment as a request' },
      { text: () => `I appreciate the effort, but I still need assistance with...`, reason: 'Separates acknowledgment from the request' },
      { text: () => `I feel unsupported in this situation and would like to work together on it`, reason: 'Uses direct feeling-based communication' }
    ]
  },
  {
    pattern: /\bmust be nice\b/i,
    suggestions: [
      { text: () => `I'm happy for you — I'm also working toward something similar`, reason: 'Replaces envy with aspiration' },
      { text: () => `That sounds great! I'd love to hear how you got there`, reason: 'Turns resentment into curiosity' }
    ]
  }
];

const NEGATIVE_PATTERNS = [
  {
    pattern: /\bi('m| am) (so )?(sad|depressed|down|miserable|hopeless)\b/i,
    suggestions: [
      { text: (m) => `I'm going through a tough time and could use some support`, reason: 'Reaches out for help instead of suffering silently' },
      { text: () => `I'm not feeling my best right now, but I'm working through it`, reason: 'Acknowledges the struggle with hope' },
      { text: () => `I'd like to talk about what's been weighing on me`, reason: 'Opens up for healing conversation' }
    ]
  },
  {
    pattern: /\bi('m| am) (so )?(scared|afraid|terrified|anxious|worried)\b/i,
    suggestions: [
      { text: () => `I'm feeling uncertain about this, and I'd like to talk it through`, reason: 'Reframes fear as a discussion topic' },
      { text: () => `This situation is making me uncomfortable — can we explore options?`, reason: 'Channels anxiety into problem-solving' },
      { text: () => `I have some concerns I'd like to share`, reason: 'Professional way to express worry' }
    ]
  },
  {
    pattern: /\b(this is|it's|that's) (so |really |very )?(bad|terrible|horrible|awful|worst)\b/i,
    suggestions: [
      { text: () => `This situation is challenging, and I think we can find ways to improve it`, reason: 'Shifts from complaint to solution-oriented thinking' },
      { text: () => `I'm not satisfied with how things are going — here's what I suggest`, reason: 'Pairs dissatisfaction with action' },
      { text: () => `There's definitely room for improvement here`, reason: 'Diplomatic way to express dissatisfaction' }
    ]
  },
  {
    pattern: /\bnobody (cares|likes|loves|understands)\b/i,
    suggestions: [
      { text: () => `I'm feeling unheard and would like more connection`, reason: 'Expresses the underlying need directly' },
      { text: () => `I've been feeling disconnected lately and would like to change that`, reason: 'Frames loneliness as something actionable' },
      { text: () => `I need to feel more valued in my relationships`, reason: 'States the core emotional need' }
    ]
  }
];

const ALL_PATTERNS = [
  ...AGGRESSIVE_PATTERNS.map(p => ({ ...p, category: 'aggressive' })),
  ...PASSIVE_AGGRESSIVE_PATTERNS.map(p => ({ ...p, category: 'passive-aggressive' })),
  ...NEGATIVE_PATTERNS.map(p => ({ ...p, category: 'negative' }))
];

export function generateSuggestions(text, sentimentResult) {
  if (!text || !text.trim()) return [];

  const suggestions = [];
  const tones = ['empathetic', 'professional', 'neutral'];

  for (const entry of ALL_PATTERNS) {
    const match = text.match(entry.pattern);
    if (match) {
      entry.suggestions.forEach((s, i) => {
        suggestions.push({
          alternative: s.text(match),
          reason: s.reason,
          category: entry.category,
          tone: tones[i % tones.length]
        });
      });
    }
  }

  if (suggestions.length === 0 && sentimentResult) {
    const { polarity, dominant, tones: detectedTones } = sentimentResult;

    if (polarity.label === 'Negative' || ['anger', 'sadness', 'fear', 'disgust'].includes(dominant)) {
      suggestions.push({
        alternative: `I'd like to express that ${text.toLowerCase().replace(/^i\s+/i, 'I ')}... and I'm open to finding a better approach together.`,
        reason: 'Adds openness and collaborative intent to your expression',
        category: 'general-negative',
        tone: 'empathetic'
      });
      suggestions.push({
        alternative: reframeNegative(text),
        reason: 'Reframes the statement with a more constructive perspective',
        category: 'general-negative',
        tone: 'professional'
      });
    }

    const hasAggressiveTone = detectedTones?.some(t =>
      t.tone === 'aggressive' || t.tone === 'passive-aggressive' || t.tone === 'sarcastic'
    );
    if (hasAggressiveTone) {
      suggestions.push({
        alternative: `I want to be direct: ${softenen(text)}`,
        reason: 'Maintains directness while removing hostile undertones',
        category: 'tone-correction',
        tone: 'neutral'
      });
    }
  }

  if (suggestions.length === 0 && sentimentResult?.polarity?.label === 'Positive') {
    suggestions.push({
      alternative: null,
      reason: 'Your words carry a positive and constructive tone — great communication!',
      category: 'affirmation',
      tone: 'positive'
    });
  }

  if (suggestions.length === 0) {
    suggestions.push({
      alternative: null,
      reason: 'Your message is neutral and clear. No immediate improvements needed.',
      category: 'affirmation',
      tone: 'neutral'
    });
  }

  return suggestions.slice(0, 4);
}

function reframeNegative(text) {
  return text
    .replace(/\bi hate\b/gi, "I'm not fond of")
    .replace(/\bterrible\b/gi, 'challenging')
    .replace(/\bhorrible\b/gi, 'difficult')
    .replace(/\bawful\b/gi, 'less than ideal')
    .replace(/\bstupid\b/gi, 'unclear')
    .replace(/\bidiot\b/gi, 'person')
    .replace(/\bdumb\b/gi, 'unaware')
    .replace(/\buseless\b/gi, 'not yet effective')
    .replace(/\bworthless\b/gi, 'undervalued')
    .replace(/\bpathetic\b/gi, 'struggling')
    .replace(/\bworst\b/gi, 'most challenging')
    .replace(/\bbad\b/gi, 'not ideal');
}

function softenen(text) {
  return text
    .replace(/!+/g, '.')
    .replace(/\bYOU\b/g, 'you')
    .replace(/[A-Z]{3,}/g, m => m.charAt(0) + m.slice(1).toLowerCase())
    .replace(/\byou always\b/gi, 'it often seems like')
    .replace(/\byou never\b/gi, 'it would help if')
    .replace(/\bshut up\b/gi, "let's take a pause")
    .trim();
}
