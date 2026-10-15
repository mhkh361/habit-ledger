/* ==========================================================================
   HABIT LEDGER v4.0 — MACRISH J.A.R.V.I.S. ENGINE
   Zero-Drain • Iron Man Arc-Reactor HUD • Conversational Alarm • AI Vault
   ========================================================================== */

// ---------- 1. Storage Keys & State ----------
const KEYS = {
  PROFILE: "ledger.profile.v4",
  HABITS: "ledger.habits.v4",
  SCHEDULE: "ledger.schedule.v4",
  ALARMS: "macrish.alarms.v4",
  VAULT: "macrish_vault_v4",
  CHAT_LOG: "macrish_daily_chat_log",
  LAST_ACTIVE: "macrish.lastActiveTimestamp",
  GEMINI_KEY: "macrish.geminiApiKey",
  GEMINI_MODEL: "macrish.geminiModel",
  VOICE_SPEAKBACK: "macrish.voiceSpeakback",
  VOICE_LANG: "macrish.voiceLanguage",
  WAKE_LOCK: "macrish.wakeLockSetting"
};

function generateId() {
  return typeof crypto !== "undefined" && crypto.randomUUID 
    ? crypto.randomUUID() 
    : "id_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
}

// Clean Slate Loaders: Zero hardcoded dummy data!
function loadProfile() {
  try {
    const raw = localStorage.getItem(KEYS.PROFILE);
    if (raw) return JSON.parse(raw);
    const initial = {
      name: "Fahad",
      goal: "Consistent Software Engineering & Daily Fitness",
      wakeTime: "05:00",
      reviewTime: "22:00",
      onboarded: true
    };
    saveProfile(initial);
    return initial;
  } catch (e) {
    return { name: "Fahad", goal: "Consistent Software Engineering & Daily Fitness", wakeTime: "05:00", reviewTime: "22:00", onboarded: true };
  }
}

function saveProfile(p) { localStorage.setItem(KEYS.PROFILE, JSON.stringify(p)); }

function loadHabits() {
  try {
    const raw = localStorage.getItem(KEYS.HABITS);
    return raw ? JSON.parse(raw) : []; // Clean slate
  } catch (e) { return []; }
}

function saveHabits(h) { localStorage.setItem(KEYS.HABITS, JSON.stringify(h)); }

function loadSchedule() {
  try {
    const raw = localStorage.getItem(KEYS.SCHEDULE);
    return raw ? JSON.parse(raw) : []; // Clean slate
  } catch (e) { return []; }
}

function saveSchedule(s) { localStorage.setItem(KEYS.SCHEDULE, JSON.stringify(s)); }

function loadAlarms() {
  try {
    const raw = localStorage.getItem(KEYS.ALARMS);
    if (raw) return JSON.parse(raw);
    // Default smart wake-up alarm at 5:00 AM
    const starterAlarms = [
      { id: generateId(), time: "05:00", label: "Morning Wake-Up Protocol", active: true }
    ];
    saveAlarms(starterAlarms);
    return starterAlarms;
  } catch (e) { return []; }
}

function saveAlarms(a) { localStorage.setItem(KEYS.ALARMS, JSON.stringify(a)); }

function loadVault() {
  try {
    const raw = localStorage.getItem(KEYS.VAULT);
    return raw ? JSON.parse(raw) : [];
  } catch (e) { return []; }
}

function saveVault(v) { localStorage.setItem(KEYS.VAULT, JSON.stringify(v)); }

function loadChatLog() {
  try {
    const raw = localStorage.getItem(KEYS.CHAT_LOG);
    if (raw) return JSON.parse(raw);
    return [
      { role: "macrish", text: "J.A.R.V.I.S. core active. Systems nominal, Fahad sir. Tell me what alarm, habit, or schedule to set.", timestamp: Date.now() }
    ];
  } catch (e) { return []; }
}

function saveChatLog(l) { localStorage.setItem(KEYS.CHAT_LOG, JSON.stringify(l)); }

let profile = loadProfile();
let habits = loadHabits();
let schedule = loadSchedule();
let alarms = loadAlarms();
let vault = loadVault();
let chatLog = loadChatLog();
let currentMilestoneStage = 7;
let wakeLockSentinel = null;
let activeAudioElement = null;
let synthIntervalId = null;
let audioCtx = null;

// ---------- 2. Date & Time Helpers ----------
function todayStr() {
  return dateStr(new Date());
}

function dateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function daysAgoStr(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return dateStr(d);
}

function formatTime12h(time24) {
  if (!time24) return "--:--";
  const [hStr, mStr] = time24.split(":");
  let h = parseInt(hStr, 10);
  const m = mStr || "00";
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}

function parseTimeToMinutes(time24) {
  if (!time24) return 0;
  const [h, m] = time24.split(":").map(Number);
  return h * 60 + m;
}

function currentMinutesNow() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

function triggerHaptic() {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    navigator.vibrate(15);
  }
}

// ---------- 3. IndexedDB Audio Storage for Custom Songs ----------
const DB_NAME = "MacrishAudioDB";
const STORE_NAME = "customSongs";

function openAudioDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveCustomAudioToDB(file) {
  const db = await openAudioDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const putReq = store.put(file, "alarmSong");
    putReq.onsuccess = () => resolve(true);
    putReq.onerror = () => reject(putReq.error);
  });
}

async function getCustomAudioFromDB() {
  try {
    const db = await openAudioDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get("alarmSong");
      getReq.onsuccess = () => resolve(getReq.result || null);
      getReq.onerror = () => resolve(null);
    });
  } catch (e) {
    return null;
  }
}

// ---------- 4. Web Audio API High-Fidelity Synthesizer Melody Fallback ----------
function playSynthesizerChime() {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 arpeggio
    const now = audioCtx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + idx * 0.22);

      // Smooth attack & decay
      gain.gain.setValueAtTime(0.001, now + idx * 0.22);
      gain.gain.exponentialRampToValueAtTime(0.28, now + idx * 0.22 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.22 + 1.2);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(now + idx * 0.22);
      osc.stop(now + idx * 0.22 + 1.3);
    });
  } catch (e) {
    console.warn("AudioContext error:", e);
  }
}

async function startAlarmSoundLoop() {
  stopAlarmSoundLoop();
  const customFile = await getCustomAudioFromDB();

  if (customFile) {
    const url = URL.createObjectURL(customFile);
    activeAudioElement = new Audio(url);
    activeAudioElement.loop = true;
    activeAudioElement.play().catch(e => {
      console.warn("Autoplay audio blocked, falling to synth:", e);
      synthIntervalId = setInterval(playSynthesizerChime, 3000);
      playSynthesizerChime();
    });
  } else {
    playSynthesizerChime();
    synthIntervalId = setInterval(playSynthesizerChime, 3200);
  }
}

function stopAlarmSoundLoop() {
  if (activeAudioElement) {
    activeAudioElement.pause();
    activeAudioElement.currentTime = 0;
    activeAudioElement = null;
  }
  if (synthIntervalId) {
    clearInterval(synthIntervalId);
    synthIntervalId = null;
  }
}

// ---------- 5. Screen Wake Lock API (Nightstand Mode) ----------
async function updateWakeLock(enabled) {
  localStorage.setItem(KEYS.WAKE_LOCK, enabled ? "true" : "false");
  if (enabled) {
    try {
      if ("wakeLock" in navigator) {
        wakeLockSentinel = await navigator.wakeLock.request("screen");
        wakeLockSentinel.addEventListener("release", () => {
          wakeLockSentinel = null;
        });
      }
    } catch (err) {
      console.warn("Wake Lock error:", err);
    }
  } else {
    if (wakeLockSentinel) {
      wakeLockSentinel.release();
      wakeLockSentinel = null;
    }
  }
}

// ---------- 6. Conversational Alarm Setting & NLP Parser ----------
function parseTimeFromText(text) {
  // Matches e.g. "৫টা", "সকাল ৫টা", "সকাল ৫:৩০", "5 am", "05:00", "7:30 pm"
  const bnToEnMap = { '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4', '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9' };
  let norm = text.replace(/[০-৯]/g, d => bnToEnMap[d]).toLowerCase();

  // Pattern 1: "সকাল ৫টা" or "রাত ৮টা" or "৫টা ৩০"
  const bnMatch = norm.match(/(সকাল|ভোর|দুপুর|বিকাল|সন্ধ্যা|রাত)?\s*(\d{1,2})(?::(\d{2})|টা\s*(\d{2})?|টা)?/);
  if (bnMatch && (norm.includes("টা") || norm.includes("বাজে") || norm.includes("alarm") || norm.includes("অ্যালার্ম"))) {
    let period = bnMatch[1] || "";
    let h = parseInt(bnMatch[2], 10);
    let m = parseInt(bnMatch[3] || bnMatch[4] || "0", 10);

    if (period.includes("রাত") || period.includes("সন্ধ্যা") || period.includes("বিকাল") || norm.includes("pm")) {
      if (h < 12) h += 12;
    } else if ((period.includes("সকাল") || period.includes("ভোর") || norm.includes("am")) && h === 12) {
      h = 0;
    }

    if (h >= 0 && h < 24 && m >= 0 && m < 60) {
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    }
  }

  // Pattern 2: "5:30 am", "5:00", "17:00"
  const enMatch = norm.match(/(\d{1,2}):(\d{2})\s*(am|pm)?/);
  if (enMatch) {
    let h = parseInt(enMatch[1], 10);
    let m = parseInt(enMatch[2], 10);
    let ampm = enMatch[3];
    if (ampm === "pm" && h < 12) h += 12;
    if (ampm === "am" && h === 12) h = 0;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }

  return null;
}

// ---------- Google Gemini Intelligence Client (1.5 & 2.5/2.0) ----------
function getGeminiApiKey() {
  return (localStorage.getItem(KEYS.GEMINI_KEY) || "").trim();
}

function setGeminiApiKey(key) {
  if (key) {
    localStorage.setItem(KEYS.GEMINI_KEY, key.trim());
  } else {
    localStorage.removeItem(KEYS.GEMINI_KEY);
  }
}

function getGeminiModel() {
  return localStorage.getItem(KEYS.GEMINI_MODEL) || "gemini-1.5-flash";
}

function setGeminiModel(model) {
  localStorage.setItem(KEYS.GEMINI_MODEL, model || "gemini-1.5-flash");
}

async function verifyGeminiApiKey(apiKey, model) {
  const cleanKey = apiKey.trim();
  const targetModel = model || getGeminiModel();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${encodeURIComponent(cleanKey)}`;
  const payload = {
    contents: [{ parts: [{ text: "Hello" }] }],
    generationConfig: { maxOutputTokens: 5 }
  };
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return response;
}

async function queryGeminiFlash(userInput, apiKey) {
  const cleanKey = apiKey.trim();
  let targetModel = getGeminiModel();
  const systemPrompt = `You are Macrish v5.0, an intelligent, respectful, and motivating personal AI companion (inspired by Iron Man's J.A.R.V.I.S.) for Fahad sir inside his Habit Ledger app.
Core Instructions:
- Keep answers direct, friendly, and actionable (2-4 sentences max unless the user specifically asks for a detailed plan or explanation).
- If the user writes in Bengali or Banglish, answer in warm, natural Bengali (বাংলা).
- If the user writes in English, answer in crisp English.
- Emphasize daily discipline, consistency, time management, and health.`;

  const payload = {
    contents: [
      {
        parts: [
          { text: `${systemPrompt}\n\nFahad sir: ${userInput}\n\nMacrish:` }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 350
    }
  };

  let url = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${encodeURIComponent(cleanKey)}`;
  let response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  // Graceful fallback to gemini-1.5-flash if 2.0/2.5 model returns 404
  if (response.status === 404 && targetModel !== "gemini-1.5-flash") {
    console.warn(`${targetModel} not found on endpoint, falling back to gemini-1.5-flash`);
    targetModel = "gemini-1.5-flash";
    url = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${encodeURIComponent(cleanKey)}`;
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `HTTP ${response.status}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("No response text from Gemini API");
  return text.trim();
}

// ---------- Live Talk (Web Speech API STT & TTS) ----------
const SpeechRecognition = typeof window !== "undefined" ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;
let recognitionInstance = null;
let isLiveTalkMode = false;
let isListeningActive = false;

function getVoiceLanguage() {
  return localStorage.getItem(KEYS.VOICE_LANG) || "bn-BD";
}

function setVoiceLanguage(lang) {
  localStorage.setItem(KEYS.VOICE_LANG, lang);
  if (recognitionInstance) {
    recognitionInstance.lang = lang;
  }
}

function isVoiceSpeakbackEnabled() {
  const stored = localStorage.getItem(KEYS.VOICE_SPEAKBACK);
  return stored === null ? true : stored === "true";
}

function setVoiceSpeakbackEnabled(val) {
  localStorage.setItem(KEYS.VOICE_SPEAKBACK, String(val));
}

function speakMacrishResponse(text) {
  if (!isVoiceSpeakbackEnabled() || typeof window === "undefined" || !window.speechSynthesis) return;

  try {
    window.speechSynthesis.cancel();

    // Clean text of markdown/symbols for clean pronunciation
    const clean = text
      .replace(/[#*_`~[\]()]/g, "")
      .replace(/https?:\/\/\S+/g, "")
      .replace(/[•-]/g, "")
      .trim();

    if (!clean) return;

    const utterance = new SpeechSynthesisUtterance(clean);
    const isBengali = /[\u0980-\u09FF]/.test(clean);
    utterance.lang = isBengali ? "bn-BD" : "en-US";
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      const match = voices.find(v => v.lang && v.lang.toLowerCase().startsWith(isBengali ? "bn" : "en"));
      if (match) utterance.voice = match;
    }

    const sunSphere = document.getElementById("macrishSunSphere");
    const stopBtn = document.getElementById("stopVoiceSpeechBtn");

    utterance.onstart = () => {
      if (sunSphere) sunSphere.classList.add("speaking");
      if (stopBtn) stopBtn.style.display = "inline-flex";
    };

    utterance.onend = () => {
      if (sunSphere) sunSphere.classList.remove("speaking");
      if (stopBtn) stopBtn.style.display = "none";
      // If Live Talk mode is active, restart listening for user response!
      if (isLiveTalkMode && recognitionInstance && !isListeningActive) {
        setTimeout(() => {
          if (isLiveTalkMode && !isListeningActive) {
            try { recognitionInstance.start(); } catch(e) {}
          }
        }, 350);
      }
    };

    utterance.onerror = () => {
      if (sunSphere) sunSphere.classList.remove("speaking");
      if (stopBtn) stopBtn.style.display = "none";
    };

    window.speechSynthesis.speak(utterance);
  } catch(e) {
    console.warn("Speech synthesis error:", e);
  }
}

async function processConversationalInput(userInput) {
  const input = userInput.trim();
  if (!input) return;

  // Append user message
  chatLog.push({ role: "user", text: input, timestamp: Date.now() });
  saveChatLog(chatLog);
  renderHudChat();

  // 1. Scan for AI Importance & Vault Storage
  scanAndStoreImportantInsights(input);

  // 2. Intent Evaluation
  const timeParsed = parseTimeFromText(input);
  const isAlarmRequest = input.includes("উঠায় দিবা") || input.includes("অ্যালার্ম") || input.includes("alarm") || input.includes("wake me");
  const isHabitRequest = input.toLowerCase().startsWith("add habit") || input.includes("অভ্যাস যোগ");
  const isScheduleRequest = input.toLowerCase().startsWith("add task") || input.includes("শিডিউল") || input.includes("টাস্ক");

  let botReply = "";

  if (timeParsed && isAlarmRequest) {
    // Add Alarm
    alarms.push({
      id: generateId(),
      time: timeParsed,
      label: "Morning Wake-Up Protocol",
      active: true
    });
    saveAlarms(alarms);
    botReply = `অবশ্যই ${profile.name} স্যার। সকাল ${formatTime12h(timeParsed)} বাজে ওয়েক-আপ অ্যালার্ম কনফিগার করা হয়েছে। সময়মতো ফুল-স্ক্রিন সান প্রটোকল সক্রিয় হবে।`;
  } else if (isHabitRequest) {
    const habitName = input.replace(/add habit/i, "").replace(/অভ্যাস যোগ করো/g, "").replace(/[:]/g, "").trim() || "Daily Focus";
    addHabit(habitName);
    botReply = `হলো ফাহাদ স্যার। '${habitName}' অভ্যাসটি আপনার পার্মানেন্ট লেজারে রেজিস্টার করা হয়েছে।`;
  } else if (isScheduleRequest) {
    const nowH = new Date().getHours();
    const startStr = `${String(nowH).padStart(2, "0")}:00`;
    const endStr = `${String(nowH + 1).padStart(2, "0")}:30`;
    const taskTitle = input.replace(/add task/i, "").replace(/টাস্ক/g, "").replace(/শিডিউল/g, "").trim() || "Focused Session";
    addScheduleTask(taskTitle, startStr, endStr);
    botReply = `টাইমটেবিলে '${taskTitle}' (${formatTime12h(startStr)} - ${formatTime12h(endStr)}) যুক্ত করা হয়েছে।`;
  } else {
    // 3. Conversational AI — Check for Gemini Flash Key
    const apiKey = getGeminiApiKey();
    if (apiKey) {
      const activeModel = getGeminiModel();
      const modelDisplayName = activeModel.includes("2.0") ? "Gemini 2.5 / 2.0" : (activeModel.includes("pro") ? "Gemini 1.5 Pro" : "Gemini 1.5 Flash");
      const chatContainer = document.getElementById("hudChatHistory");
      const tempId = "thinking_" + Date.now();
      if (chatContainer) {
        const thinkingBubble = document.createElement("div");
        thinkingBubble.className = "chat-bubble macrish";
        thinkingBubble.id = tempId;
        thinkingBubble.innerHTML = `
          <div class="chat-author-tag">MACRISH J.A.R.V.I.S.</div>
          <div class="thinking-pulse">⚡ Connecting to ${modelDisplayName}...</div>
        `;
        chatContainer.appendChild(thinkingBubble);
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }

      const sunSphere = document.getElementById("macrishSunSphere");
      if (sunSphere) sunSphere.classList.add("speaking");

      try {
        botReply = await queryGeminiFlash(input, apiKey);
      } catch (err) {
        console.warn("Gemini query error:", err);
        botReply = `(Offline Mode) ফাহাদ স্যার, অনলাইনে সংযোগে সমস্যা হয়েছে: ${err.message}। তবে লোকাল সব সিস্টেম সক্রিয় আছে।`;
      } finally {
        document.getElementById(tempId)?.remove();
        if (sunSphere) sunSphere.classList.remove("speaking");
      }
    } else {
      // Default J.A.R.V.I.S. Conversational Intelligence
      const greetings = [
        `জ্বী ফাহাদ স্যার। সব সিস্টেম ১০০% অপটিমাল। অ্যালার্ম সেট করতে পারেন (যেমন 'আমাকে সকাল ৫টা বাজে উঠায় দিবা'), নতুন কাজ যোগ করতে পারেন বা কোনো গুরুত্বপূর্ণ সিদ্ধান্ত জানাতে পারেন।`,
        `সিস্টেম প্রস্তুত ফাহাদ। কোনো সিদ্ধান্ত বা লক্ষ্য থাকলে শেয়ার করতে পারেন—AI Importance Scanner তা স্বয়ংক্রিয়ভাবে ভল্টে সংরক্ষণ করবে।`,
        `Protocol calibrated. All circuits running at zero background battery consumption. How may I serve your daily routine?`
      ];
      botReply = greetings[Math.floor(Math.random() * greetings.length)];
    }
  }

  chatLog.push({ role: "macrish", text: botReply, timestamp: Date.now() });
  saveChatLog(chatLog);
  renderHudChat();

  // Speak aloud if enabled
  speakMacrishResponse(botReply);

  // Pulse Solar Orb during speech
  const sunSphere = document.getElementById("macrishSunSphere");
  if (sunSphere) {
    sunSphere.classList.add("speaking");
    setTimeout(() => sunSphere.classList.remove("speaking"), 2500);
  }

  renderAll();
}

// ---------- 7. AI Importance Scanner & Macrish Vault ----------
function scanAndStoreImportantInsights(text) {
  const triggers = [
    "সিদ্ধান্ত", "লক্ষ্য", "decided", "decision", "goal", "plan to",
    "never forget", "rule:", "learned that", "important", "গুরুত্বপূর্ণ",
    "insight:", "ভবিষ্যৎ", "realized", "সমস্যা হলো", "বাধা"
  ];

  const matched = triggers.some(t => text.toLowerCase().includes(t));
  if (!matched && text.length < 25) return;

  if (matched) {
    let category = "Insight";
    if (text.includes("সিদ্ধান্ত") || text.toLowerCase().includes("decid")) category = "Decision";
    else if (text.includes("লক্ষ্য") || text.toLowerCase().includes("goal") || text.toLowerCase().includes("plan")) category = "Goal";
    else if (text.includes("মাইলফলক") || text.toLowerCase().includes("milestone")) category = "Milestone";

    const newVaultEntry = {
      id: generateId(),
      date: todayStr(),
      category: category,
      summary: text,
      rawContext: text,
      timestamp: Date.now(),
      status: "pending" // 'pending' | 'kept' | 'deleted'
    };

    vault.unshift(newVaultEntry);
    saveVault(vault);
    renderVaultView();
  }
}

function exportVaultToMarkdown() {
  if (vault.length === 0) {
    alert("Macrish Vault-এ কোনো নোট নেই।");
    return;
  }

  let md = `# Macrish Memory Vault — Life Insights & Decisions\n`;
  md += `User: ${profile.name}\nExported: ${new Date().toLocaleString()}\n\n---\n\n`;

  vault.forEach((item, idx) => {
    md += `### ${idx + 1}. [${item.category}] ${item.date}\n`;
    md += `> ${item.summary}\n\n`;
    md += `*Status:* ${item.status || 'kept'} | *ID:* ${item.id}\n\n`;
  });

  const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `macrish-vault-${todayStr()}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ---------- 8. Alarm Trigger & Wake-up Check ----------
function checkAlarms() {
  const now = new Date();
  const currentHM = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  alarms.forEach(al => {
    if (al.active && al.time === currentHM && !al.triggeredToday) {
      al.triggeredToday = true;
      triggerAlarmProtocol(al);
    }
    // Reset trigger tag when minute passes
    if (al.triggeredToday && al.time !== currentHM) {
      al.triggeredToday = false;
    }
  });
}

function triggerAlarmProtocol(al) {
  const overlay = document.getElementById("macrishAlarmOverlay");
  const timeDisp = document.getElementById("alarmTriggerTimeDisplay");
  const greeting = document.getElementById("alarmGreetingText");
  const labelDisp = document.getElementById("alarmTriggerLabelDisplay");

  timeDisp.textContent = formatTime12h(al.time);
  greeting.textContent = `শুভ সকাল ${profile.name}! এখন ${formatTime12h(al.time)} বাজে। ওঠার সময় হয়েছে!`;
  labelDisp.textContent = al.label || "Morning Wake-Up Protocol";

  overlay.hidden = false;
  startAlarmSoundLoop();
  triggerHaptic();
}

function stopAlarm() {
  stopAlarmSoundLoop();
  document.getElementById("macrishAlarmOverlay").hidden = true;
}

function snoozeAlarm() {
  stopAlarmSoundLoop();
  document.getElementById("macrishAlarmOverlay").hidden = true;
  // Reschedule 10 minutes later
  const now = new Date();
  now.setMinutes(now.getMinutes() + 10);
  const snoozeTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  alarms.push({
    id: generateId(),
    time: snoozeTime,
    label: "Snoozed Alarm (+10m)",
    active: true
  });
  saveAlarms(alarms);
  renderAll();
  alert(`অ্যালার্ম ১০ মিনিটের জন্য স্নুজ করা হয়েছে (${formatTime12h(snoozeTime)})।`);
}

// ---------- 9. Habits & Milestones Math ----------
function currentStreak(habit) {
  let streak = 0;
  let offset = habit.log[todayStr()] ? 0 : 1;
  while (habit.log[daysAgoStr(offset)]) {
    streak++;
    offset++;
  }
  return streak;
}

function habitBestStreak(habit) {
  const dates = Object.keys(habit.log).filter(d => habit.log[d]).sort();
  if (dates.length === 0) return 0;
  let max = 1;
  let cur = 1;
  for (let i = 1; i < dates.length; i++) {
    const p = new Date(dates[i - 1] + "T00:00:00");
    const c = new Date(dates[i] + "T00:00:00");
    const diff = Math.round((c - p) / 86400000);
    if (diff === 1) {
      cur++;
      if (cur > max) max = cur;
    } else if (diff > 1) {
      cur = 1;
    }
  }
  return Math.max(max, currentStreak(habit));
}

function bestStreakAcrossAll() {
  let best = 0;
  habits.forEach(h => { best = Math.max(best, habitBestStreak(h)); });
  return best;
}

function toggleHabitDay(id, ds) {
  const habit = habits.find(h => h.id === id);
  if (!habit) return;
  if (habit.log[ds]) {
    delete habit.log[ds];
  } else {
    habit.log[ds] = true;
  }
  triggerHaptic();
  saveHabits(habits);
  renderAll();
}

function addHabit(name) {
  habits.push({
    id: generateId(),
    name: name.trim(),
    log: {}
  });
  saveHabits(habits);
  renderAll();
}

function removeHabit(id) {
  const habit = habits.find(h => h.id === id);
  if (!habit) return;
  if (confirm(`Delete habit "${habit.name}"?`)) {
    habits = habits.filter(h => h.id !== id);
    saveHabits(habits);
    renderAll();
  }
}

// ---------- 10. Schedule Logic ----------
function getTodayTasks() {
  const t = todayStr();
  return schedule
    .filter(item => item.date === t)
    .sort((a, b) => parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime));
}

function addScheduleTask(title, startTime, endTime) {
  schedule.push({
    id: generateId(),
    title: title.trim(),
    date: todayStr(),
    startTime: startTime,
    endTime: endTime,
    completed: false,
    prompted: false
  });
  saveSchedule(schedule);
  renderAll();
}

function toggleScheduleTask(id) {
  const item = schedule.find(s => s.id === id);
  if (!item) return;
  item.completed = !item.completed;
  triggerHaptic();
  saveSchedule(schedule);
  renderAll();
}

function removeScheduleTask(id) {
  const item = schedule.find(s => s.id === id);
  if (!item) return;
  if (confirm(`Remove task "${item.title}"?`)) {
    schedule = schedule.filter(s => s.id !== id);
    saveSchedule(schedule);
    renderAll();
  }
}

// ---------- 11. 30-Day Memory Audit ("Keep vs. Delete") ----------
function open30DayAuditModal() {
  const modal = document.getElementById("memoryAuditModal");
  const container = document.getElementById("auditItemsContainer");
  container.innerHTML = "";

  if (vault.length === 0) {
    container.innerHTML = `<p style="text-align:center; color:var(--text-muted); padding:20px;">Macrish Vault বর্তমানে খালি। কোনো মেমরি অডিটের প্রয়োজন নেই।</p>`;
  } else {
    vault.forEach(item => {
      const row = document.createElement("div");
      row.className = "audit-row-card";
      row.innerHTML = `
        <div class="audit-row-body">
          <div style="font-size:11px; font-family:var(--font-mono); color:var(--hud-cyan);">${item.category} • ${item.date}</div>
          <div style="font-size:13.5px; color:var(--text-main); margin-top:2px;">${item.summary}</div>
        </div>
        <div class="audit-row-actions">
          <button class="audit-action-btn ${item.status === 'kept' ? 'kept' : ''}" data-id="${item.id}" data-action="keep">
            ${item.status === 'kept' ? '✓ Kept' : 'Keep 📌'}
          </button>
          <button class="audit-action-btn ${item.status === 'deleted' ? 'deleted' : ''}" data-id="${item.id}" data-action="delete">
            ${item.status === 'deleted' ? '✗ Purged' : 'Delete 🗑️'}
          </button>
        </div>
      `;

      row.querySelector('[data-action="keep"]').addEventListener("click", () => {
        item.status = "kept";
        saveVault(vault);
        open30DayAuditModal();
      });

      row.querySelector('[data-action="delete"]').addEventListener("click", () => {
        vault = vault.filter(v => v.id !== item.id);
        saveVault(vault);
        open30DayAuditModal();
        renderVaultView();
      });

      container.appendChild(row);
    });
  }

  modal.hidden = false;
}

// ---------- 12. Full UI Rendering ----------
function renderAll() {
  // 1. Identity & Clock
  document.getElementById("userNameLabel").textContent = profile.name || "Fahad";
  document.getElementById("avatarInitial").textContent = (profile.name || "F")[0].toUpperCase();
  document.getElementById("primaryGoalText").textContent = profile.goal || "Consistent Software Engineering & Daily Fitness";

  const now = new Date();
  document.getElementById("liveClock").textContent = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  document.getElementById("liveDate").textContent = now.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });

  // 2. Active Alarm Pill & Vault Pill in Header
  const activeAlarm = alarms.find(a => a.active);
  document.getElementById("activeAlarmPill").textContent = activeAlarm ? `⏰ ${formatTime12h(activeAlarm.time)}` : "⏰ No Alarm";
  document.getElementById("vaultCountPill").textContent = `🏛️ ${vault.length} Memories`;

  // 3. Daily Completion Progress Bar
  const todayTasks = getTodayTasks();
  const totalItems = todayTasks.length + habits.length;
  const completedItems = todayTasks.filter(t => t.completed).length + habits.filter(h => h.log[todayStr()]).length;
  const percent = totalItems === 0 ? 0 : Math.round((completedItems / totalItems) * 100);

  document.getElementById("dailyProgressPercent").textContent = `${percent}%`;
  document.getElementById("dailyProgressFill").style.width = `${percent}%`;
  document.getElementById("progressTrack").setAttribute("aria-valuenow", percent);
  document.getElementById("progressBreakdown").textContent = 
    `${completedItems} of ${totalItems} items completed today`;

  // 4. Render Schedule View
  const schedContainer = document.getElementById("scheduleList");
  const schedEmpty = document.getElementById("scheduleEmpty");
  schedContainer.innerHTML = "";
  schedEmpty.hidden = todayTasks.length > 0;
  document.getElementById("scheduleCountBadge").textContent = `${todayTasks.length} Slots`;

  const nowMin = currentMinutesNow();

  todayTasks.forEach(task => {
    const startMin = parseTimeToMinutes(task.startTime);
    const endMin = parseTimeToMinutes(task.endTime);
    const isNowActive = nowMin >= startMin && nowMin <= endMin;

    const row = document.createElement("div");
    row.className = `timeline-slot ${task.completed ? "completed" : ""} ${isNowActive && !task.completed ? "now-active" : ""}`;

    row.innerHTML = `
      <button class="slot-check-btn" type="button" aria-label="Toggle task ${task.title}">
        ${task.completed ? "✓" : ""}
      </button>
      <div class="slot-body">
        <div class="slot-time-strip">
          <span class="slot-time">${formatTime12h(task.startTime)} — ${formatTime12h(task.endTime)}</span>
          ${isNowActive && !task.completed ? '<span class="active-pulse-tag">NOW ACTIVE</span>' : ""}
        </div>
        <div class="slot-title">${task.title}</div>
      </div>
      <button class="slot-del-btn" type="button" aria-label="Delete task">remove</button>
    `;

    row.querySelector(".slot-check-btn").addEventListener("click", () => toggleScheduleTask(task.id));
    row.querySelector(".slot-del-btn").addEventListener("click", () => removeScheduleTask(task.id));
    schedContainer.appendChild(row);
  });

  // 5. Render Habits View
  const ledgerContainer = document.getElementById("ledgerList");
  const habitsEmpty = document.getElementById("habitsEmpty");
  ledgerContainer.innerHTML = "";
  habitsEmpty.hidden = habits.length > 0;

  habits.forEach(habit => {
    const doneToday = !!habit.log[todayStr()];
    const streak = currentStreak(habit);

    const card = document.createElement("div");
    card.className = `habit-card ${doneToday ? "done-today" : ""}`;

    const stampBtn = document.createElement("button");
    stampBtn.className = "habit-stamp-btn";
    stampBtn.type = "button";
    stampBtn.textContent = doneToday ? "✓" : "";
    stampBtn.addEventListener("click", () => toggleHabitDay(habit.id, todayStr()));

    const info = document.createElement("div");
    info.className = "habit-info";
    const nameEl = document.createElement("div");
    nameEl.className = "habit-name";
    nameEl.textContent = habit.name;

    const dotsWrap = document.createElement("div");
    dotsWrap.className = "habit-week-dots";
    for (let i = 6; i >= 0; i--) {
      const dot = document.createElement("button");
      const ds = daysAgoStr(i);
      dot.className = `history-dot ${habit.log[ds] ? "hit" : ""} ${i === 0 ? "today-marker" : ""}`;
      dot.type = "button";
      dot.title = ds;
      dot.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleHabitDay(habit.id, ds);
      });
      dotsWrap.appendChild(dot);
    }

    info.appendChild(nameEl);
    info.appendChild(dotsWrap);

    const right = document.createElement("div");
    right.className = "habit-right";
    const streakEl = document.createElement("span");
    streakEl.className = `streak-count ${streak === 0 ? "zero" : ""}`;
    streakEl.textContent = streak === 0 ? "—" : `${streak}d`;

    const delBtn = document.createElement("button");
    delBtn.className = "habit-del-btn";
    delBtn.type = "button";
    delBtn.textContent = "remove";
    delBtn.addEventListener("click", () => removeHabit(habit.id));

    right.appendChild(streakEl);
    right.appendChild(delBtn);

    card.appendChild(stampBtn);
    card.appendChild(info);
    card.appendChild(right);
    ledgerContainer.appendChild(card);
  });

  document.getElementById("statActive").textContent = habits.filter(h => h.log[todayStr()]).length;
  document.getElementById("statBest").textContent = bestStreakAcrossAll();

  // 6. Render Milestone Stages
  renderMilestoneRecap(currentMilestoneStage);

  // 7. Render Alarms & Vault in HUD
  renderAlarmsList();
  renderVaultView();
}

function renderHudChat() {
  const container = document.getElementById("hudChatHistory");
  if (!container) return;
  container.innerHTML = "";
  if (chatLog.length === 0) {
    const welcome = document.createElement("div");
    welcome.className = "chat-bubble macrish";
    welcome.innerHTML = `
      <div class="chat-author-tag">MACRISH J.A.R.V.I.S.</div>
      <div>Good day, Fahad sir. The solar core is online with 0% resource drain. How may I assist your rhythm today? You can command me in Bangla or English (e.g. <em>"আমাকে সকাল ৫টা বাজে উঠায় দিবা"</em>).</div>
    `;
    container.appendChild(welcome);
    return;
  }
  chatLog.forEach(msg => {
    const bubble = document.createElement("div");
    bubble.className = `chat-bubble ${msg.role}`;
    bubble.innerHTML = `
      <div class="chat-author-tag">${msg.role === "macrish" ? "MACRISH J.A.R.V.I.S." : profile.name || "FAHAD"}</div>
      <div>${msg.text}</div>
    `;
    container.appendChild(bubble);
  });
  container.scrollTop = container.scrollHeight;
}

function renderAlarmsList() {
  const container = document.getElementById("alarmListContainer");
  container.innerHTML = "";
  if (alarms.length === 0) {
    container.innerHTML = `<p style="font-size:12.5px; color:var(--text-muted);">No active wake-up alarms.</p>`;
    return;
  }

  alarms.forEach(al => {
    const item = document.createElement("div");
    item.className = "alarm-item-card";
    item.innerHTML = `
      <div>
        <span class="alarm-item-time">${formatTime12h(al.time)}</span>
        <span class="alarm-item-label">${al.label || "Alarm"}</span>
      </div>
      <button class="ghost-btn" style="color:var(--hud-danger); padding:4px 8px; font-size:11px;" type="button">Remove</button>
    `;
    item.querySelector("button").addEventListener("click", () => {
      alarms = alarms.filter(a => a.id !== al.id);
      saveAlarms(alarms);
      renderAll();
    });
    container.appendChild(item);
  });
}

function renderVaultView() {
  const mainList = document.getElementById("vaultList");
  const hudList = document.getElementById("hudVaultList");
  const vaultEmpty = document.getElementById("vaultEmpty");

  if (mainList) mainList.innerHTML = "";
  if (hudList) hudList.innerHTML = "";
  if (vaultEmpty) vaultEmpty.hidden = vault.length > 0;

  vault.forEach(item => {
    const card = document.createElement("div");
    card.className = "vault-item-card";
    const catClass = (item.category || "insight").toLowerCase();

    card.innerHTML = `
      <div class="vault-item-header">
        <span class="vault-category-pill ${catClass}">${item.category}</span>
        <span class="vault-item-date">${item.date}</span>
      </div>
      <div class="vault-item-summary">${item.summary}</div>
      <div class="vault-item-actions">
        <button class="ghost-btn" style="padding:4px 10px; font-size:11px; color:var(--hud-danger);" type="button">Delete</button>
      </div>
    `;

    card.querySelector("button").addEventListener("click", () => {
      vault = vault.filter(v => v.id !== item.id);
      saveVault(vault);
      renderVaultView();
      renderAll();
    });

    if (mainList) mainList.appendChild(card);
    if (hudList) hudList.appendChild(card.cloneNode(true));
  });
}

function renderMilestoneRecap(days) {
  const container = document.getElementById("milestoneCard");
  let totalLogs = 0;
  let totalOpportunities = days * habits.length;

  habits.forEach(h => {
    for (let i = 0; i < days; i++) {
      if (h.log[daysAgoStr(i)]) totalLogs++;
    }
  });

  const rate = totalOpportunities > 0 ? Math.round((totalLogs / totalOpportunities) * 100) : 0;

  container.innerHTML = `
    <div style="margin-bottom: 16px;">
      <h3 style="font-family: var(--font-serif); font-size: 20px; color: var(--text-main);">${days}-Day Horizon Recap</h3>
      <p style="font-size: 13px; color: var(--text-muted);">Longitudinal consistency analysis across ${days} days.</p>
    </div>

    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; margin-bottom: 16px;">
      <div style="background:var(--surface-raised); padding:14px; border-radius:var(--radius-md); text-align:center;">
        <div style="font-family:var(--font-serif); font-size:26px; color:var(--hud-cyan); font-weight:700;">${rate}%</div>
        <div style="font-size:11px; color:var(--text-muted); text-transform:uppercase; font-family:var(--font-mono);">Completion Rate</div>
      </div>
      <div style="background:var(--surface-raised); padding:14px; border-radius:var(--radius-md); text-align:center;">
        <div style="font-family:var(--font-serif); font-size:26px; color:var(--hud-gold); font-weight:700;">${totalLogs}</div>
        <div style="font-size:11px; color:var(--text-muted); text-transform:uppercase; font-family:var(--font-mono);">Total Habit Stamps</div>
      </div>
      <div style="background:var(--surface-raised); padding:14px; border-radius:var(--radius-md); text-align:center;">
        <div style="font-family:var(--font-serif); font-size:26px; color:var(--hud-emerald); font-weight:700;">${bestStreakAcrossAll()}d</div>
        <div style="font-size:11px; color:var(--text-muted); text-transform:uppercase; font-family:var(--font-mono);">Best Record Streak</div>
      </div>
    </div>
  `;
}

// ---------- 13. Setup Event Listeners & Modals ----------
function setupEvents() {
  // Navigation Tabs
  const tabSchedule = document.getElementById("tabScheduleBtn");
  const tabHabits = document.getElementById("tabHabitsBtn");
  const tabRecap = document.getElementById("tabRecapBtn");
  const tabVault = document.getElementById("tabVaultBtn");

  const viewSchedule = document.getElementById("scheduleView");
  const viewHabits = document.getElementById("habitsView");
  const viewRecap = document.getElementById("recapView");
  const viewVault = document.getElementById("vaultView");

  function setView(view) {
    tabSchedule.classList.toggle("active", view === "schedule");
    tabHabits.classList.toggle("active", view === "habits");
    tabRecap.classList.toggle("active", view === "recap");
    tabVault.classList.toggle("active", view === "vault");

    viewSchedule.hidden = view !== "schedule";
    viewHabits.hidden = view !== "habits";
    viewRecap.hidden = view !== "recap";
    viewVault.hidden = view !== "vault";
  }

  tabSchedule.addEventListener("click", () => setView("schedule"));
  tabHabits.addEventListener("click", () => setView("habits"));
  tabRecap.addEventListener("click", () => setView("recap"));
  tabVault.addEventListener("click", () => setView("vault"));

  // Milestone Tabs
  document.querySelectorAll(".stage-tab").forEach(btn => {
    btn.addEventListener("click", (e) => {
      document.querySelectorAll(".stage-tab").forEach(b => b.classList.remove("active"));
      e.target.classList.add("active");
      currentMilestoneStage = parseInt(e.target.getAttribute("data-stage"), 10);
      renderMilestoneRecap(currentMilestoneStage);
    });
  });

  // HUD Summoners & Modals
  const hudModal = document.getElementById("macrishHudModal");
  function openHud(initialTab = "chat") {
    hudModal.hidden = false;
    triggerHaptic();
    setHudTab(initialTab);
  }
  function closeHud() { hudModal.hidden = true; }

  document.getElementById("floatingArcBtn").addEventListener("click", () => openHud("chat"));
  const headerBtn = document.getElementById("headerMacrishBtn");
  if (headerBtn) headerBtn.addEventListener("click", () => openHud("chat"));
  const heroTalk = document.getElementById("heroTalkBtn");
  if (heroTalk) heroTalk.addEventListener("click", () => openHud("chat"));
  const heroAlarm = document.getElementById("heroAlarmBtn");
  if (heroAlarm) heroAlarm.addEventListener("click", () => openHud("alarm"));
  const heroSun = document.getElementById("heroSunTrigger");
  if (heroSun) heroSun.addEventListener("click", () => openHud("chat"));

  document.getElementById("toolbarAlarmBtn").addEventListener("click", () => openHud("alarm"));
  document.getElementById("closeHudBtn").addEventListener("click", closeHud);

  // HUD Side Navigation Items
  const hudTabChat = document.getElementById("hudTabChatBtn");
  const hudTabAlarm = document.getElementById("hudTabAlarmBtn");
  const hudTabVault = document.getElementById("hudTabVaultBtn");
  const hudTabApi = document.getElementById("hudTabApiBtn");

  const hudPanelChat = document.getElementById("hudPanelChat");
  const hudPanelAlarm = document.getElementById("hudPanelAlarm");
  const hudPanelVault = document.getElementById("hudPanelVault");
  const hudPanelApi = document.getElementById("hudPanelApi");

  function setHudTab(tab) {
    hudTabChat.classList.toggle("active", tab === "chat");
    hudTabAlarm.classList.toggle("active", tab === "alarm");
    hudTabVault.classList.toggle("active", tab === "vault");
    hudTabApi.classList.toggle("active", tab === "api");

    hudPanelChat.hidden = tab !== "chat";
    hudPanelAlarm.hidden = tab !== "alarm";
    hudPanelVault.hidden = tab !== "vault";
    hudPanelApi.hidden = tab !== "api";

    const subTitle = document.getElementById("hudSubTitle");
    if (subTitle) {
      if (tab === "chat") {
        subTitle.textContent = '"Good day, Fahad sir. The solar core is calibrated to your rhythm."';
      } else if (tab === "alarm") {
        subTitle.textContent = '"Smart Wake-up Alarms, Nightstand Charging & Audio Engine."';
      } else if (tab === "vault") {
        subTitle.textContent = '"AI Importance Scanner Vault & Milestone Audit Archive."';
      } else if (tab === "api") {
        subTitle.textContent = '"Client-Side Google Gemini Flash Neural Intelligence."';
      }
    }

    if (tab === "chat") {
      renderHudChat();
      setTimeout(() => document.getElementById("hudChatInput")?.focus(), 60);
    } else if (tab === "alarm") {
      renderAlarmsList();
    } else if (tab === "vault") {
      renderVaultView();
    } else if (tab === "api") {
      updateApiKeyUI();
    }
  }

  hudTabChat.addEventListener("click", () => setHudTab("chat"));
  hudTabAlarm.addEventListener("click", () => setHudTab("alarm"));
  hudTabVault.addEventListener("click", () => setHudTab("vault"));
  hudTabApi.addEventListener("click", () => setHudTab("api"));

  // Gemini 1.5 & 2.5 API Key & Model Configuration
  const apiKeyInput = document.getElementById("geminiApiKeyInput");
  const saveApiKeyBtn = document.getElementById("saveApiKeyBtn");
  const clearApiKeyBtn = document.getElementById("clearApiKeyBtn");
  const apiKeyStatus = document.getElementById("apiKeyStatus");
  const apiKeyStatusDot = document.getElementById("apiKeyStatusDot");
  const geminiModelSelect = document.getElementById("geminiModelSelect");
  const activeModelBadge = document.getElementById("activeModelBadge");

  function updateApiKeyUI() {
    const savedKey = getGeminiApiKey();
    const currentModel = getGeminiModel();

    if (geminiModelSelect) {
      geminiModelSelect.value = currentModel;
    }

    if (activeModelBadge) {
      if (currentModel === "gemini-2.0-flash") {
        activeModelBadge.textContent = "🚀 GEMINI 2.5 / 2.0 FLASH";
      } else if (currentModel === "gemini-1.5-pro") {
        activeModelBadge.textContent = "🧠 GEMINI 1.5 PRO";
      } else {
        activeModelBadge.textContent = "⚡ GEMINI 1.5 FLASH";
      }
    }

    if (apiKeyInput && !apiKeyInput.value) {
      apiKeyInput.value = savedKey;
    }

    if (savedKey) {
      const modelName = currentModel.includes("2.0") ? "Gemini 2.5 / 2.0 Flash" : (currentModel.includes("pro") ? "Gemini 1.5 Pro" : "Gemini 1.5 Flash");
      if (apiKeyStatus) apiKeyStatus.textContent = `Status: ${modelName} Active & Verified (Online AI Mode)`;
      if (apiKeyStatusDot) apiKeyStatusDot.className = "api-status-indicator active";
      if (clearApiKeyBtn) clearApiKeyBtn.style.display = "inline-block";
    } else {
      if (apiKeyStatus) apiKeyStatus.textContent = "Status: Using Built-in Offline Neural Engine";
      if (apiKeyStatusDot) apiKeyStatusDot.className = "api-status-indicator";
      if (clearApiKeyBtn) clearApiKeyBtn.style.display = "none";
    }
  }

  if (geminiModelSelect) {
    geminiModelSelect.addEventListener("change", (e) => {
      setGeminiModel(e.target.value);
      updateApiKeyUI();
    });
  }

  updateApiKeyUI();

  if (saveApiKeyBtn) {
    saveApiKeyBtn.addEventListener("click", async () => {
      const raw = (apiKeyInput?.value || "").trim();
      if (!raw) {
        alert("Please paste a valid Gemini API key (starts with AIzaSy...).");
        return;
      }

      const chosenModel = getGeminiModel();
      if (apiKeyStatus) apiKeyStatus.textContent = `Status: Verifying key with ${chosenModel}...`;
      if (apiKeyStatusDot) apiKeyStatusDot.className = "api-status-indicator verifying";
      saveApiKeyBtn.disabled = true;

      try {
        const res = await verifyGeminiApiKey(raw, chosenModel);
        if (res.ok) {
          setGeminiApiKey(raw);
          updateApiKeyUI();
          triggerHaptic();
          alert(`Success! ${chosenModel} is now active and verified.`);
        } else {
          const errData = await res.json().catch(() => ({}));
          const errMsg = errData.error?.message || `HTTP ${res.status}`;
          if (apiKeyStatus) apiKeyStatus.textContent = `Status: Invalid Key (${errMsg})`;
          if (apiKeyStatusDot) apiKeyStatusDot.className = "api-status-indicator error";
          alert(`Google AI returned an error: ${errMsg}\nPlease verify that your key is valid for ${chosenModel}.`);
        }
      } catch (err) {
        setGeminiApiKey(raw);
        updateApiKeyUI();
        if (apiKeyStatus) apiKeyStatus.textContent = "Status: Key saved locally (Network offline, will use when connected)";
        alert("Key saved locally. Note: Could not reach Google AI directly (check your internet connection).");
      } finally {
        saveApiKeyBtn.disabled = false;
      }
    });
  }

  if (clearApiKeyBtn) {
    clearApiKeyBtn.addEventListener("click", () => {
      setGeminiApiKey("");
      if (apiKeyInput) apiKeyInput.value = "";
      updateApiKeyUI();
      triggerHaptic();
      alert("Gemini API Key removed. Macrish is now in offline mode.");
    });
  }

  // Live Talk & Voice Speech Controls
  setupSpeechRecognition();

  const liveTalkMasterBtn = document.getElementById("liveTalkMasterBtn");
  const hudVoiceMicBtn = document.getElementById("hudVoiceMicBtn");
  const voiceLanguageSelect = document.getElementById("voiceLanguageSelect");
  const voiceSpeakbackCheckbox = document.getElementById("voiceSpeakbackCheckbox");
  const stopVoiceSpeechBtn = document.getElementById("stopVoiceSpeechBtn");

  if (voiceLanguageSelect) {
    voiceLanguageSelect.value = getVoiceLanguage();
    voiceLanguageSelect.addEventListener("change", (e) => {
      setVoiceLanguage(e.target.value);
    });
  }

  if (voiceSpeakbackCheckbox) {
    voiceSpeakbackCheckbox.checked = isVoiceSpeakbackEnabled();
    voiceSpeakbackCheckbox.addEventListener("change", (e) => {
      setVoiceSpeakbackEnabled(e.target.checked);
    });
  }

  if (stopVoiceSpeechBtn) {
    stopVoiceSpeechBtn.addEventListener("click", () => {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      const sunSphere = document.getElementById("macrishSunSphere");
      if (sunSphere) sunSphere.classList.remove("speaking");
      stopVoiceSpeechBtn.style.display = "none";
    });
  }

  if (liveTalkMasterBtn) {
    liveTalkMasterBtn.addEventListener("click", () => {
      if (!SpeechRecognition) {
        alert("Live Talk voice recognition is not supported in this browser. Please use Safari on iPhone or Chrome on Desktop/Android.");
        return;
      }
      isLiveTalkMode = !isLiveTalkMode;
      triggerHaptic();

      if (isLiveTalkMode) {
        liveTalkMasterBtn.classList.add("active");
        try {
          recognitionInstance.start();
        } catch(e) {
          console.warn(e);
        }
      } else {
        liveTalkMasterBtn.classList.remove("active");
        try {
          recognitionInstance.stop();
        } catch(e) {}
        if (window.speechSynthesis) window.speechSynthesis.cancel();
        updateVoiceUI(false);
      }
    });
  }

  if (hudVoiceMicBtn) {
    hudVoiceMicBtn.addEventListener("click", () => {
      if (!SpeechRecognition) {
        alert("Voice recognition is not supported in this browser. Please use Safari on iPhone or Chrome on Desktop/Android.");
        return;
      }
      triggerHaptic();
      if (isListeningActive) {
        try { recognitionInstance.stop(); } catch(e) {}
      } else {
        try { recognitionInstance.start(); } catch(e) { console.warn(e); }
      }
    });
  }

  // HUD Chat Submission
  document.getElementById("hudChatForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const input = document.getElementById("hudChatInput");
    const val = input.value;
    input.value = "";
    await processConversationalInput(val);
  });

  // Prompt suggestion chips
  document.querySelectorAll(".prompt-chip").forEach(chip => {
    chip.addEventListener("click", async (e) => {
      const prompt = e.target.getAttribute("data-prompt");
      await processConversationalInput(prompt);
    });
  });

  // Quick Alarm Form inside HUD
  document.getElementById("quickAlarmForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const time = document.getElementById("alarmTimeInput").value;
    const label = document.getElementById("alarmLabelInput").value || "Wake-Up Protocol";
    alarms.push({ id: generateId(), time, label, active: true });
    saveAlarms(alarms);
    renderAll();
    alert(`অ্যালার্ম সফলভাবে ${formatTime12h(time)} এ সেট করা হয়েছে!`);
  });

  // Custom Audio Song File Picker
  document.getElementById("customAudioFile").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (file) {
      await saveCustomAudioToDB(file);
      document.getElementById("audioStatusPill").textContent = `Custom: ${file.name}`;
      alert(`কাস্টম গান '${file.name}' সেভ করা হয়েছে!`);
    }
  });

  // Test Alarm Sound
  document.getElementById("testSoundBtn").addEventListener("click", () => {
    startAlarmSoundLoop();
    document.getElementById("testSoundBtn").hidden = true;
    document.getElementById("stopSoundBtn").hidden = false;
  });
  document.getElementById("stopSoundBtn").addEventListener("click", () => {
    stopAlarmSoundLoop();
    document.getElementById("testSoundBtn").hidden = false;
    document.getElementById("stopSoundBtn").hidden = true;
  });

  // Nightstand Wake Lock
  const wakeLockBox = document.getElementById("wakeLockCheckbox");
  wakeLockBox.checked = localStorage.getItem(KEYS.WAKE_LOCK) === "true";
  wakeLockBox.addEventListener("change", (e) => updateWakeLock(e.target.checked));

  // Alarm Overlay buttons
  document.getElementById("alarmStopBtn").addEventListener("click", stopAlarm);
  document.getElementById("alarmSnoozeBtn").addEventListener("click", snoozeAlarm);

  // 30-Day Audit Modal Handlers
  document.getElementById("open30DayAuditBtn").addEventListener("click", open30DayAuditModal);
  document.getElementById("closeAuditModal").addEventListener("click", () => {
    document.getElementById("memoryAuditModal").hidden = true;
  });
  document.getElementById("finishAuditBtn").addEventListener("click", () => {
    document.getElementById("memoryAuditModal").hidden = true;
  });
  document.getElementById("auditKeepAllBtn").addEventListener("click", () => {
    vault.forEach(v => v.status = "kept");
    saveVault(vault);
    open30DayAuditModal();
  });
  document.getElementById("auditDeleteAllBtn").addEventListener("click", () => {
    if (confirm("Macrish Vault-এর সমস্ত মেমরি মুছে ফেলতে চান?")) {
      vault = [];
      saveVault(vault);
      open30DayAuditModal();
      renderVaultView();
    }
  });

  // Vault Export & Manual Add
  document.getElementById("exportVaultFileBtn").addEventListener("click", exportVaultToMarkdown);
  const manualVaultModal = document.getElementById("manualVaultModal");
  document.getElementById("addVaultManualBtn").addEventListener("click", () => {
    manualVaultModal.hidden = false;
  });
  document.getElementById("closeManualVaultModal").addEventListener("click", () => {
    manualVaultModal.hidden = true;
  });
  document.getElementById("cancelManualVaultBtn").addEventListener("click", () => {
    manualVaultModal.hidden = true;
  });
  document.getElementById("manualVaultForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const cat = document.getElementById("vaultCategoryInput").value;
    const summary = document.getElementById("vaultSummaryInput").value.trim();
    if (summary) {
      vault.unshift({
        id: generateId(),
        date: todayStr(),
        category: cat,
        summary: summary,
        rawContext: summary,
        timestamp: Date.now(),
        status: "kept"
      });
      saveVault(vault);
      renderVaultView();
      manualVaultModal.hidden = true;
      document.getElementById("vaultSummaryInput").value = "";
    }
  });

  // Forms
  document.getElementById("addScheduleForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const title = document.getElementById("taskTitleInput").value;
    const start = document.getElementById("taskStartTime").value;
    const end = document.getElementById("taskEndTime").value;
    if (title && start && end) {
      addScheduleTask(title, start, end);
      document.getElementById("taskTitleInput").value = "";
    }
  });

  document.getElementById("addHabitForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const input = document.getElementById("habitInput");
    if (input.value.trim()) {
      addHabit(input.value);
      input.value = "";
    }
  });

  // Profile Modal
  const identityModal = document.getElementById("identityModal");
  document.getElementById("profileBadge").addEventListener("click", () => {
    document.getElementById("inputUserName").value = profile.name || "Fahad";
    document.getElementById("inputPrimaryGoal").value = profile.goal || "";
    document.getElementById("inputWakeTime").value = profile.wakeTime || "05:00";
    document.getElementById("inputReviewTime").value = profile.reviewTime || "22:00";
    identityModal.hidden = false;
  });
  document.getElementById("closeIdentityModal").addEventListener("click", () => identityModal.hidden = true);
  document.getElementById("cancelIdentityBtn").addEventListener("click", () => identityModal.hidden = true);
  document.getElementById("identityForm").addEventListener("submit", (e) => {
    e.preventDefault();
    profile.name = document.getElementById("inputUserName").value.trim() || "Fahad";
    profile.goal = document.getElementById("inputPrimaryGoal").value.trim() || "Consistent Software Engineering & Daily Fitness";
    profile.wakeTime = document.getElementById("inputWakeTime").value || "05:00";
    profile.reviewTime = document.getElementById("inputReviewTime").value || "22:00";
    saveProfile(profile);
    identityModal.hidden = true;
    renderAll();
  });

  // Full Data Export & Reset
  document.getElementById("exportDataBtn").addEventListener("click", () => {
    const data = { version: 4, exportedAt: new Date().toISOString(), profile, habits, schedule, alarms, vault };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `habit-ledger-v4-backup-${todayStr()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  });

  document.getElementById("clearDataPromptBtn").addEventListener("click", () => {
    if (confirm("সমস্ত লোকাল ডাটা রিসেট করতে চান? এটি আনডু করা যাবে না।")) {
      localStorage.clear();
      location.reload();
    }
  });

  // Keyboard Shortcuts
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeHud();
      document.getElementById("identityModal").hidden = true;
      document.getElementById("manualVaultModal").hidden = true;
      document.getElementById("memoryAuditModal").hidden = true;
    }
    if ((e.key === "m" || e.key === "M") && document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA") {
      openHud("chat");
    }
  });
}

// ---------- 14. On-Open Intelligence & Elapsed Time Calculation ----------
function handleOnOpenGreeting() {
  const lastActive = localStorage.getItem(KEYS.LAST_ACTIVE);
  const now = Date.now();
  localStorage.setItem(KEYS.LAST_ACTIVE, now.toString());

  if (lastActive) {
    const elapsedHours = Math.floor((now - parseInt(lastActive, 10)) / (1000 * 60 * 60));
    if (elapsedHours >= 5) {
      setTimeout(() => {
        const greetingMsg = `স্বাগতম ${profile.name}! গত ${elapsedHours} ঘণ্টা পর সিস্টেমে সংযোগ পাওয়া গেছে। অ্যাপ বন্ধ থাকা অবস্থায় ০% পাওয়ার কনজিউম হয়েছিল। আজকের অ্যালার্ম ও রিদম সম্পূর্ণ প্রস্তুত।`;
        chatLog.push({ role: "macrish", text: greetingMsg, timestamp: Date.now() });
        saveChatLog(chatLog);
        document.getElementById("botSuggestionText").textContent = greetingMsg;
      }, 500);
    }
  }
}

// ---------- 15. Lifecycle & Service Worker ----------
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(e => console.warn(e));
  });
}

// Startup
setupEvents();
renderAll();
handleOnOpenGreeting();

// Active-Session Ticker (Zero Background Drain: only triggers when tab is open!)
setInterval(() => {
  if (document.hidden) return; // 0% CPU when tab is hidden
  const now = new Date();
  document.getElementById("liveClock").textContent = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  checkAlarms();
  localStorage.setItem(KEYS.LAST_ACTIVE, Date.now().toString());
}, 10000);
