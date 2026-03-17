/*
 * SentimentAura — Main Application Controller
 * Orchestrates particles, radar chart, sentiment engine, suggestion engine,
 * and all UI animations.
 */
import { analyzeSentiment, EMOTION_EMOJIS, EMOTION_COLORS } from './sentiment-engine.js';
import { generateSuggestions } from './suggestion-engine.js';
// ══════════════════════════════════════════
// GLOBALS
// ══════════════════════════════════════════
let analysisCount = 0;
const history = [];
// ══════════════════════════════════════════
// DOM REFS
// ══════════════════════════════════════════
const $ = id => document.getElementById(id);
const userInput = $('userInput');
const charCount = $('charCount');
const analyzeBtn = $('analyzeBtn');
const resultsSection = $('resultsSection');
const historySection = $('historySection');
const historyList = $('historyList');
const analysisCountEl = $('analysisCount');
const micBtn = $('micBtn');
const micStatus = $('micStatus');
const micStatusText = $('micStatusText');
// ══════════════════════════════════════════
// SPEECH RECOGNITION
// ══════════════════════════════════════════
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
let isRecording = false;
function initSpeechRecognition() {
    if (!SpeechRecognition) {
        micBtn.title = 'Speech recognition not supported in this browser';
        micBtn.style.opacity = '0.3';
        micBtn.style.cursor = 'not-allowed';
        return;
    }
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    let finalTranscript = '';
    recognition.onstart = () => {
        isRecording = true;
        micBtn.classList.add('recording');
        micBtn.querySelector('.mic-icon').classList.add('hidden');
        micBtn.querySelector('.mic-icon-stop').classList.remove('hidden');
        micStatus.classList.remove('hidden');
        micStatusText.textContent = 'Listening...';
        finalTranscript = userInput.value;
    };
    recognition.onresult = (event) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                finalTranscript += (finalTranscript ? ' ' : '') + transcript;
            } else {
                interimTranscript += transcript;
            }
        }
        userInput.value = finalTranscript + (interimTranscript ? ' ' + interimTranscript : '');
        charCount.textContent = userInput.value.length;
        analyzeBtn.disabled = userInput.value.trim().length === 0;
        micStatusText.textContent = interimTranscript ? 'Hearing you...' : 'Listening...';
    };
    recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
            micStatusText.textContent = 'Microphone access denied';
            setTimeout(stopRecording, 2000);
        } else if (event.error !== 'no-speech') {
            micStatusText.textContent = 'Error — try again';
            setTimeout(stopRecording, 1500);
        }
    };
    recognition.onend = () => {
        // If still recording, restart (continuous mode can timeout)
        if (isRecording) {
            try { recognition.start(); } catch (e) { stopRecording(); }
        }
    };
}
function startRecording() {
    if (!recognition) return;
    try {
        recognition.start();
    } catch (e) {
        // Already started
        stopRecording();
    }
}
function stopRecording() {
    isRecording = false;
    if (recognition) {
        try { recognition.stop(); } catch (e) { }
    }
    micBtn.classList.remove('recording');
    micBtn.querySelector('.mic-icon').classList.remove('hidden');
    micBtn.querySelector('.mic-icon-stop').classList.add('hidden');
    micStatus.classList.add('hidden');
}
micBtn.addEventListener('click', () => {
    if (!SpeechRecognition) {
        alert('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
        return;
    }
    if (isRecording) {
        stopRecording();
    } else {
        startRecording();
    }
});
initSpeechRecognition();
// ══════════════════════════════════════════
// PARTICLE SYSTEM
// ══════════════════════════════════════════
const canvas = $('particleCanvas');
const ctx = canvas.getContext('2d');
let particles = [];
const PARTICLE_COUNT = 80;
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();
class Particle {
    constructor() { this.reset(); }
    reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2.5 + 0.5;
        this.speedX = (Math.random() - 0.5) * 0.4;
        this.speedY = (Math.random() - 0.5) * 0.4;
        this.opacity = Math.random() * 0.4 + 0.1;
        const colors = ['168,85,247', '6,182,212', '236,72,153', '245,158,11'];
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.pulse = Math.random() * Math.PI * 2;
        this.pulseSpeed = Math.random() * 0.02 + 0.005;
    }
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.pulse += this.pulseSpeed;
        if (this.x < -10 || this.x > canvas.width + 10 || this.y < -10 || this.y > canvas.height + 10) {
            this.reset();
        }
    }
    draw() {
        const dynamicOpacity = this.opacity * (0.6 + 0.4 * Math.sin(this.pulse));
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.color},${dynamicOpacity})`;
        ctx.fill();
        // Glow
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.color},${dynamicOpacity * 0.15})`;
        ctx.fill();
    }
}
function initParticles() {
    particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(new Particle());
}
function drawConnections() {
    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 120) {
                const opacity = (1 - dist / 120) * 0.08;
                ctx.beginPath();
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.strokeStyle = `rgba(168,85,247,${opacity})`;
                ctx.lineWidth = 0.5;
                ctx.stroke();
            }
        }
    }
}
function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => { p.update(); p.draw(); });
    drawConnections();
    requestAnimationFrame(animateParticles);
}
initParticles();
animateParticles();
// ══════════════════════════════════════════
// INPUT HANDLING
// ══════════════════════════════════════════
userInput.addEventListener('input', () => {
    const len = userInput.value.length;
    charCount.textContent = len;
    analyzeBtn.disabled = len === 0;
});
// Sample chips
document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
        userInput.value = chip.dataset.text;
        charCount.textContent = userInput.value.length;
        analyzeBtn.disabled = false;
        userInput.focus();
        // Visual feedback
        chip.style.transform = 'scale(0.95)';
        setTimeout(() => chip.style.transform = '', 200);
    });
});
// Analyze button
analyzeBtn.addEventListener('click', () => {
    const text = userInput.value.trim();
    if (!text) return;
    runAnalysis(text);
});
// Enter key (Ctrl+Enter)
userInput.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter' && userInput.value.trim()) {
        runAnalysis(userInput.value.trim());
    }
});
// ══════════════════════════════════════════
// MAIN ANALYSIS FLOW
// ══════════════════════════════════════════
function runAnalysis(text) {
    // Loading state
    analyzeBtn.classList.add('loading');
    analyzeBtn.disabled = true;
    // Simulate brief processing for dramatic effect
    setTimeout(() => {
        const result = analyzeSentiment(text);
        const suggestions = generateSuggestions(text, result);
        if (!result) {
            analyzeBtn.classList.remove('loading');
            analyzeBtn.disabled = false;
            return;
        }
        // Update counter
        analysisCount++;
        analysisCountEl.textContent = analysisCount;
        // Store in history
        history.unshift({ text, result, suggestions, time: new Date() });
        // Render results
        renderPolarity(result.polarity);
        renderEmotionBars(result.emotions);
        drawRadarChart(result.emotions);
        renderTones(result.tones);
        renderWordChips(text, result.wordAttributions);
        renderSuggestions(suggestions);
        renderHistory();
        // Show results
        resultsSection.classList.remove('hidden');
        historySection.classList.remove('hidden');
        // Re-trigger animations by re-adding class
        resultsSection.style.display = 'none';
        void resultsSection.offsetHeight; // force reflow
        resultsSection.style.display = '';
        // Scroll to results
        setTimeout(() => {
            resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
        // Remove loading
        analyzeBtn.classList.remove('loading');
        analyzeBtn.disabled = false;
    }, 800);
}
// ══════════════════════════════════════════
// RENDER: POLARITY
// ══════════════════════════════════════════
function renderPolarity(polarity) {
    const circle = $('polarityCircle');
    const circumference = 326.73;
    const percent = polarity.confidence;
    const offset = circumference - (percent / 100) * circumference;
    // Color based on polarity
    let color;
    let emoji;
    if (polarity.label === 'Positive') { color = '#10b981'; emoji = '😊'; }
    else if (polarity.label === 'Negative') { color = '#ef4444'; emoji = '😔'; }
    else { color = '#a0a0b8'; emoji = '😐'; }
    circle.style.stroke = color;
    circle.style.strokeDashoffset = offset;
    $('polarityEmoji').textContent = emoji;
    $('polarityLabel').textContent = polarity.label;
    $('positiveBar').style.width = polarity.positivePercent + '%';
    $('positiveValue').textContent = polarity.positivePercent + '%';
    $('negativeBar').style.width = polarity.negativePercent + '%';
    $('negativeValue').textContent = polarity.negativePercent + '%';
    $('confidenceValue').textContent = polarity.confidence + '%';
}
// ══════════════════════════════════════════
// RENDER: EMOTION BARS
// ══════════════════════════════════════════
function renderEmotionBars(emotions) {
    const container = $('emotionBars');
    container.innerHTML = '';
    const emotionOrder = ['joy', 'trust', 'anticipation', 'surprise', 'fear', 'sadness', 'anger', 'disgust'];
    emotionOrder.forEach((emotion, i) => {
        const score = emotions[emotion];
        const item = document.createElement('div');
        item.className = 'emotion-bar-item';
        item.style.animationDelay = `${i * 0.08}s`;
        item.innerHTML = `
      <span class="emo-icon">${EMOTION_EMOJIS[emotion]}</span>
      <div class="emo-info">
        <div class="emo-name">${emotion}</div>
        <div class="emo-track">
          <div class="emo-fill" style="width:0%;background:${EMOTION_COLORS[emotion]}"></div>
        </div>
      </div>
      <span class="emo-score" style="color:${EMOTION_COLORS[emotion]}">${score}</span>
    `;
        container.appendChild(item);
        // Animate bar fill
        requestAnimationFrame(() => {
            setTimeout(() => {
                item.querySelector('.emo-fill').style.width = score + '%';
            }, 100 + i * 80);
        });
    });
}
// ══════════════════════════════════════════
// RENDER: RADAR CHART
// ══════════════════════════════════════════
function drawRadarChart(emotions) {
    const canv = $('radarCanvas');
    const c = canv.getContext('2d');
    const W = canv.width, H = canv.height;
    const cx = W / 2, cy = H / 2;
    const radius = Math.min(W, H) / 2 - 40;
    const labels = ['joy', 'trust', 'anticipation', 'surprise', 'fear', 'sadness', 'anger', 'disgust'];
    const n = labels.length;
    c.clearRect(0, 0, W, H);
    // Grid rings
    for (let ring = 1; ring <= 4; ring++) {
        const r = (radius / 4) * ring;
        c.beginPath();
        for (let i = 0; i <= n; i++) {
            const angle = (Math.PI * 2 / n) * i - Math.PI / 2;
            const x = cx + r * Math.cos(angle);
            const y = cy + r * Math.sin(angle);
            i === 0 ? c.moveTo(x, y) : c.lineTo(x, y);
        }
        c.closePath();
        c.strokeStyle = 'rgba(255,255,255,0.06)';
        c.lineWidth = 1;
        c.stroke();
    }
    // Axis lines
    for (let i = 0; i < n; i++) {
        const angle = (Math.PI * 2 / n) * i - Math.PI / 2;
        c.beginPath();
        c.moveTo(cx, cy);
        c.lineTo(cx + radius * Math.cos(angle), cy + radius * Math.sin(angle));
        c.strokeStyle = 'rgba(255,255,255,0.05)';
        c.lineWidth = 1;
        c.stroke();
    }
    // Data polygon
    const gradient = c.createLinearGradient(cx - radius, cy - radius, cx + radius, cy + radius);
    gradient.addColorStop(0, 'rgba(168,85,247,0.35)');
    gradient.addColorStop(0.5, 'rgba(6,182,212,0.35)');
    gradient.addColorStop(1, 'rgba(236,72,153,0.35)');
    c.beginPath();
    labels.forEach((label, i) => {
        const value = emotions[label] / 100;
        const angle = (Math.PI * 2 / n) * i - Math.PI / 2;
        const x = cx + radius * value * Math.cos(angle);
        const y = cy + radius * value * Math.sin(angle);
        i === 0 ? c.moveTo(x, y) : c.lineTo(x, y);
    });
    c.closePath();
    c.fillStyle = gradient;
    c.fill();
    c.strokeStyle = 'rgba(168,85,247,0.8)';
    c.lineWidth = 2;
    c.stroke();
    // Data points + labels
    labels.forEach((label, i) => {
        const value = emotions[label] / 100;
        const angle = (Math.PI * 2 / n) * i - Math.PI / 2;
        const x = cx + radius * value * Math.cos(angle);
        const y = cy + radius * value * Math.sin(angle);
        // Dot
        c.beginPath();
        c.arc(x, y, 4, 0, Math.PI * 2);
        c.fillStyle = EMOTION_COLORS[label];
        c.fill();
        c.strokeStyle = '#fff';
        c.lineWidth = 1.5;
        c.stroke();
        // Glow
        c.beginPath();
        c.arc(x, y, 8, 0, Math.PI * 2);
        const glowColor = EMOTION_COLORS[label].replace('#', '');
        const r2 = parseInt(glowColor.slice(0, 2), 16);
        const g2 = parseInt(glowColor.slice(2, 4), 16);
        const b2 = parseInt(glowColor.slice(4, 6), 16);
        c.fillStyle = `rgba(${r2},${g2},${b2},0.25)`;
        c.fill();
        // Label
        const lx = cx + (radius + 22) * Math.cos(angle);
        const ly = cy + (radius + 22) * Math.sin(angle);
        c.fillStyle = 'rgba(240,240,245,0.7)';
        c.font = '11px Inter, sans-serif';
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        const emoji = EMOTION_EMOJIS[label];
        c.font = '14px serif';
        c.fillText(emoji, lx, ly - 8);
        c.font = '10px Inter, sans-serif';
        c.fillStyle = 'rgba(240,240,245,0.5)';
        c.fillText(label, lx, ly + 8);
    });
}
// ══════════════════════════════════════════
// RENDER: TONES
// ══════════════════════════════════════════
function renderTones(tones) {
    const container = $('toneTags');
    container.innerHTML = '';
    tones.forEach((t, i) => {
        const tag = document.createElement('span');
        tag.className = `tone-tag ${t.tone}`;
        tag.style.animationDelay = `${i * 0.1}s`;
        tag.innerHTML = `${t.tone} <span class="tone-strength">${t.strength}</span>`;
        container.appendChild(tag);
    });
}
// ══════════════════════════════════════════
// RENDER: WORD CHIPS
// ══════════════════════════════════════════
function renderWordChips(text, attributions) {
    const container = $('wordChips');
    container.innerHTML = '';
    const words = text.replace(/[^\w\s'-]/g, ' ').split(/\s+/).filter(w => w.length > 0);
    const attrMap = {};
    attributions.forEach(a => {
        const key = a.word.toLowerCase();
        if (!attrMap[key] || a.intensity > attrMap[key].intensity) {
            attrMap[key] = a;
        }
    });
    words.forEach((word, i) => {
        const attr = attrMap[word.toLowerCase()];
        const chip = document.createElement('span');
        chip.style.animationDelay = `${i * 0.04}s`;
        if (attr) {
            const color = EMOTION_COLORS[attr.emotion];
            const hexToRgba = (hex, alpha) => {
                const h = hex.replace('#', '');
                return `rgba(${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)},${alpha})`;
            };
            chip.className = 'word-chip';
            chip.style.background = hexToRgba(color, 0.12);
            chip.style.borderColor = hexToRgba(color, 0.3);
            chip.style.color = color;
            chip.innerHTML = `
        ${word}
        <span class="chip-tooltip">${attr.emotion} ${attr.negated ? '(negated)' : ''} — intensity: ${Math.round(attr.intensity)}</span>
      `;
        } else {
            chip.className = 'word-chip word-neutral';
            chip.textContent = word;
        }
        container.appendChild(chip);
    });
}
// ══════════════════════════════════════════
// RENDER: SUGGESTIONS
// ══════════════════════════════════════════
function renderSuggestions(suggestions) {
    const container = $('suggestionCards');
    container.innerHTML = '';
    suggestions.forEach((s, i) => {
        const card = document.createElement('div');
        const isAffirmation = s.category === 'affirmation';
        card.className = `suggestion-card ${isAffirmation ? 'affirmation' : ''} ${s.tone}`;
        card.style.animationDelay = `${i * 0.15}s`;
        let html = `<div class="suggestion-tone ${s.tone}">${getToneIcon(s.tone)} ${s.tone}</div>`;
        if (s.alternative) {
            html += `<div class="suggestion-text">${escapeHtml(s.alternative)}</div>`;
        }
        html += `<div class="suggestion-reason">${escapeHtml(s.reason)}</div>`;
        card.innerHTML = html;
        container.appendChild(card);
    });
}
function getToneIcon(tone) {
    const icons = { empathetic: '💚', professional: '💼', neutral: '⚖️', positive: '✨' };
    return icons[tone] || '💬';
}
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
// ══════════════════════════════════════════
// RENDER: HISTORY
// ══════════════════════════════════════════
function renderHistory() {
    historyList.innerHTML = '';
    history.slice(0, 8).forEach((entry, i) => {
        const item = document.createElement('div');
        item.className = 'history-item';
        item.style.animation = `fadeInUp 0.4s ease-out ${i * 0.05}s both`;
        item.innerHTML = `
      <span class="history-emoji">${EMOTION_EMOJIS[entry.result.dominant] || '😐'}</span>
      <span class="history-text">${escapeHtml(entry.text)}</span>
      <span class="history-dominant">${entry.result.dominant}</span>
    `;
        item.addEventListener('click', () => {
            userInput.value = entry.text;
            charCount.textContent = entry.text.length;
            analyzeBtn.disabled = false;
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
        historyList.appendChild(item);
    });
}
