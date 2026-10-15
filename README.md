<div align="center">

  <img src="assets/banner.svg" alt="Habit Ledger — Macrish Sun-Core v5.0 Banner" width="100%" />

  <br/><br/>

  [![Live Demo](https://img.shields.io/badge/Live%20App-Launch%20GitHub%20Pages-F59E0B?style=for-the-badge&logo=githubpages&logoColor=white)](https://mhkh361.github.io/habit-ledger/)
  [![Resource Drain](https://img.shields.io/badge/Resource%20Drain-0.00%25%20Zero%20CPU-10B981?style=for-the-badge&logo=speedtest&logoColor=white)](#-core-highlights--innovations)
  [![Audio Architecture](https://img.shields.io/badge/Audio-IndexedDB%20%2B%20WebAudio-EA580C?style=for-the-badge)](#-2-conversational-smart-alarm--wake-up-music)
  [![Local-First](https://img.shields.io/badge/Privacy-100%25%20Local--First-6366F1?style=for-the-badge)](#-3-ai-importance-scanner--memory-vault)
  [![PWA Ready](https://img.shields.io/badge/PWA-Offline%20Installable-D97706?style=for-the-badge)](#-pwa-installation-guide)

  <p align="center">
    <strong>A private, cognitive habit ledger engineered with Warm Daylight aesthetics, an Iron Man J.A.R.V.I.S. animated Solar Core HUD, and natural Bangla/English conversational alarm clock intelligence.</strong>
  </p>

</div>

---

## ⚡ Core Highlights & Innovations

> [!IMPORTANT]
> **Zero Battery Drain Guarantee**: The application contains **zero background `.ics` scripts** and stops all active tickers immediately whenever the browser tab or phone screen goes to sleep (`document.hidden`). When closed, it consumes exactly **0.00% CPU and 0.00% battery**.

### 🌟 1. Macrish Solar Core Entity (J.A.R.V.I.S. HUD)
* **Living Animated Sun Sphere**: Multi-layer SVG and CSS breathing corona rings that dynamically pulse and flare when speaking (`.speaking` reactive speech aura).
* **Soundwave Equalizer**: Live audio wave animation responsive to voice playback and chimes.
* **Modern Split-Sidebar Dock**: Clean side navigation icons (💬 Chat, ⏰ Alarms, 🏛️ Vault, 🔑 AI Key) providing maximum vertical canvas without visual clutter or text overlap.
* **Adaptive Cognitive Advice**: Real-time rhythm suggestions based on your daily block completions and streak milestones.

---

### ⏰ 2. Conversational Smart Alarm & Wake-up Music
* **Natural Bangla & English Voice Parsing**: Speak or type naturally —
  * *"আমাকে সকাল ৫টা বাজে উঠায় দিবা"* ➔ Automatically parses and schedules an alarm for `05:00 AM`.
  * *"Set alarm for 6:30 AM for morning run"* ➔ Sets `06:30 AM` labeled *Morning run*.
* **Custom MP3 / WAV Storage (IndexedDB)**: Select your favorite wake-up song (`.mp3` / `.wav`); it is permanently cached inside your device's local `MacrishAudioDB` (survives app reloads without re-uploading).
* **Native Web Audio Synthesis Fallback**: When no custom song is selected, a gentle, harmonic morning bell chime synthesizer rings.
* **Nightstand Mode (Screen Wake Lock API)**: Keeps your phone display softly awake while charging on your nightstand so you always have a bedside solar clock.
* **Full-Screen Wake-up Protocol**: An immersive glowing sunrise overlay with instant dismiss/snooze controls.

---

### 🏛️ 3. AI Importance Scanner & Memory Vault
* **Automated Insight Detection**: As you converse with Macrish, the rule-engine scans for core life decisions, strategic milestones, and personal resolutions (e.g., *"আমি সিদ্ধান্ত নিয়েছি যে প্রতিদিন সকালে ব্যায়াম করব"*).
* **Dedicated Local Vault**: Automatically saves scanned milestones into your private `Macrish_Vault` on-device.
* **Markdown Export**: Export your entire life insight ledger into standard `.md` notes with a single click.
* **30-Day Keep vs. Delete Audit**: An automated longitudinal review popup after 30 days allowing you to preserve timeless milestones or purge transient notes.

---

### ⏱️ 4. Daily Action Blocks & Habits Ledger
* **Time-Blocked Timetable**: Plan focused hourly slots (e.g. `09:00 - 11:30`) with live elapsed progress bars, checkbox confirmations, and instant status updates.
* **Permanent Paper-Ink Habits Ledger**: Daily habits with permanent streak memory and interactive 7-day dot matrix allowing historical backfills at any time.
* **4-Stage Horizon Analytics**: Consistency tracked across **7-Day Sprint**, **15-Day Audit**, **21-Day Habit Formation**, and **30-Day Master Milestone** horizons.

---

### 🎨 5. Warm Daylight Design Architecture
* **Alabaster Paper Palette**: Built on `#FAF8F5` core parchment, `#FFFFFF` crisp cards, and `#F4EFE6` linen surfaces.
* **Solar Amber Accents**: Sun gold (`#F59E0B`), warm amber (`#EA580C`), and gentle emerald (`#10B981`) checkmarks.
* **Classic Serif & Monospace Typography**: Elegant *Playfair Display* headings coupled with high-legibility *JetBrains Mono* telemetry.

---

## 📱 PWA Installation Guide

Install Habit Ledger directly onto your home screen for an app-like experience with 100% offline functionality.

### 🍏 iPhone / iPad (Safari)
1. Open the live link: **[https://mhkh361.github.io/habit-ledger/](https://mhkh361.github.io/habit-ledger/)** in **Safari**.
2. Tap the **Share** button (`⎙` / square with arrow) at the bottom.
3. Scroll down and tap **"Add to Home Screen"** (`➕`).
4. Tap **Add** in the top right corner.

### 🤖 Android (Chrome)
1. Open **[https://mhkh361.github.io/habit-ledger/](https://mhkh361.github.io/habit-ledger/)** in **Google Chrome**.
2. Tap the three-dot menu (**⋮**) in the top right.
3. Tap **"Install app"** (or **"Add to Home screen"**).
4. Tap **Install** to confirm.

---

## 💻 Local Development & Deployment

The codebase requires **zero external dependencies** or build steps. You can run it with vanilla Node.js:

```bash
# Clone the repository
git clone https://github.com/mhkh361/habit-ledger.git
cd habit-ledger

# Run the built-in zero-dependency local server
node server.cjs
```

Open your browser at:
- **Local Desktop:** `http://localhost:3000`
- **Mobile on Wi-Fi:** `http://<your-local-ip>:3000`

---

## 📂 Project Architecture

```
habit-ledger/
├── assets/
│   └── banner.svg         # Animated SVG Sun-Core header for GitHub
├── index.html             # Semantic HTML5 PWA & Macrish HUD layout
├── style.css              # Warm Daylight CSS system & HUD sidebar styling
├── app.js                 # Macrish Cognitive Engine, Bangla NLP & IndexedDB Audio
├── server.cjs             # Lightweight Node.js local dev server (0.0.0.0:3000)
├── sw.js                  # Service Worker v4 (Stale-while-revalidate offline cache)
├── manifest.json          # PWA Web Manifest (Standalone display, theme colors)
├── icon-192.png           # 192x192 PWA Home Screen Icon
├── icon-512.png           # 512x512 High-Res Splash Icon
└── README.md              # Project documentation & visual guide
```

---

## 🔒 Privacy & Local-First Contract

* **100% On-Device**: All habits, schedule slots, alarm times, audio files, and memory vault items remain exclusively on your device inside `localStorage` and `IndexedDB`.
* **Zero Telemetry**: No third-party analytics, no tracking cookies, no server tracking.
* **Optional Google Gemini Flash**: For advanced conversational intelligence, you can optionally provide your own client-side Gemini Flash API key. The key is stored solely in your browser's local memory and communicates directly with Google's API.

---

<div align="center">
  <sub>Habit Ledger v5.0 • Engineered for Fahad • Warm Daylight Architecture • 0% Resource Drain</sub>
</div>
