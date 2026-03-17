# SentimentAura — Advanced Emotion Intelligence

An advanced AI-powered sentiment analyzer that detects multi-dimensional emotions, nuanced tones, and provides word-level attribution.

## ✨ Features

- **Multi-Dimensional Analysis**: Detects 8 core emotions (Joy, Trust, Fear, Surprise, etc.).
- **Nuanced Tones**: Identifies Aggressive, Passive-Aggressive, Sarcastic, and Empathetic tones.
- **Word-Level Map**: Visualizes which specific words triggered which emotions.
- **Speech Recognition**: Type with your voice directly in the browser.
- **Visual Spectrum**: Dynamic radar chart to visualize your emotional profile.
- **Design**: Premium Glassmorphism 2.0 aesthetic with animated particles.

## 🚀 How to Run

Since the project uses ES modules, you must run it through a local web server.

### Live Demo
Check out the live application here:
**[https://sentiment-aura-sand.vercel.app](https://sentiment-aura-sand.vercel.app)**

### Option 1: Using npx (Recommended)
Open your terminal in the project directory and run:
```bash
npx serve .
```

### Option 2: Using Python
If you have Python installed:
```bash
python -m http.server 3000
```

### Accessing the App
Once the server is running, open your browser to:
**[http://localhost:3000](http://localhost:3000)**

## 🛠️ Tech Stack
- **HTML5/CSS3**: Custom Glassmorphism design system.
- **Vanilla JavaScript**: Pure logic with no heavy framework dependencies.
- **Speech API**: Native browser speech recognition.
- **Canvas API**: For the particle system and radar visualizations.
