/*
  THE LEDGER — habit tracker logic
  ---------------------------------
  This file has no build step and no server. Everything lives in the
  browser's localStorage, which means:
    - data is private to THIS device (that's why each phone needs its
      own install — see the README)
    - no login, no backend, no cost

  Read top to bottom, it's written in the order things actually happen.
*/

// ---------- 1. Helpers for dates ----------
// We store dates as plain "YYYY-MM-DD" strings so they're easy to
// compare and easy to read if you ever peek at localStorage yourself.
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

// ---------- 2. Loading & saving ----------
// habits = [{ id, name, log: { "2026-08-17": true, "2026-08-18": true } }]
const STORAGE_KEY = "ledger.habits.v1";
const OWNER_KEY = "ledger.owner.v1";

function loadHabits() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Couldn't read saved habits, starting fresh.", e);
    return [];
  }
}
function saveHabits(habits) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
}

let habits = loadHabits();

// ---------- 3. Streak math ----------
// Current streak = how many days in a row, counting back from today,
// have a check mark. If today isn't checked yet, we still count
// yesterday's streak so it doesn't look like it vanished at midnight.
function currentStreak(habit) {
  let streak = 0;
  let offset = habit.log[todayStr()] ? 0 : 1; // start from today or yesterday
  while (habit.log[daysAgoStr(offset)]) {
    streak++;
    offset++;
  }
  return streak;
}

function bestStreakAcrossAll() {
  let best = 0;
  habits.forEach(h => { best = Math.max(best, currentStreak(h)); });
  return best;
}

// ---------- 4. Rendering ----------
const ledgerEl = document.getElementById("ledger");
const emptyEl = document.getElementById("emptyState");

function render() {
  ledgerEl.innerHTML = "";
  emptyEl.hidden = habits.length > 0;

  habits.forEach(habit => {
    const doneToday = !!habit.log[todayStr()];
    const streak = currentStreak(habit);

    const row = document.createElement("div");
    row.className = "entry" + (doneToday ? " done" : "");

    // checkbox / stamp button
    const checkBtn = document.createElement("button");
    checkBtn.className = "check-btn";
    checkBtn.setAttribute("aria-label", `Mark ${habit.name} ${doneToday ? "not done" : "done"} for today`);
    checkBtn.textContent = doneToday ? "✓" : "";
    checkBtn.addEventListener("click", () => toggleToday(habit.id));

    // middle: name + last 7 days
    const mid = document.createElement("div");
    mid.className = "entry-mid";
    const name = document.createElement("div");
    name.className = "entry-name";
    name.textContent = habit.name;
    const week = document.createElement("div");
    week.className = "week";
    for (let i = 6; i >= 0; i--) {
      const dot = document.createElement("span");
      const ds = daysAgoStr(i);
      dot.className = "day-dot" + (habit.log[ds] ? " hit" : "") + (i === 0 ? " today-marker" : "");
      week.appendChild(dot);
    }
    mid.appendChild(name);
    mid.appendChild(week);

    // right: streak count + delete
    const right = document.createElement("div");
    right.className = "entry-right";
    const badge = document.createElement("span");
    badge.className = "streak-badge" + (streak === 0 ? " zero" : "");
    badge.textContent = streak === 0 ? "—" : `${streak}d`;
    const del = document.createElement("button");
    del.className = "del-btn";
    del.textContent = "remove";
    del.addEventListener("click", () => removeHabit(habit.id));
    right.appendChild(badge);
    right.appendChild(del);

    row.appendChild(checkBtn);
    row.appendChild(mid);
    row.appendChild(right);
    ledgerEl.appendChild(row);
  });

  // stats row
  document.getElementById("statActive").textContent =
    habits.filter(h => h.log[todayStr()]).length;
  document.getElementById("statBest").textContent = bestStreakAcrossAll();
  document.getElementById("statTotal").textContent = habits.length;
}

// ---------- 5. Actions ----------
function toggleToday(id) {
  const habit = habits.find(h => h.id === id);
  if (!habit) return;
  const t = todayStr();
  if (habit.log[t]) {
    delete habit.log[t];
  } else {
    habit.log[t] = true;
  }
  saveHabits(habits);
  render();
}

function addHabit(name) {
  habits.push({
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    name: name.trim(),
    log: {}
  });
  saveHabits(habits);
  render();
}

function removeHabit(id) {
  habits = habits.filter(h => h.id !== id);
  saveHabits(habits);
  render();
}

// ---------- 6. Wiring up the page ----------
document.getElementById("addForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const input = document.getElementById("habitInput");
  if (input.value.trim()) {
    addHabit(input.value);
    input.value = "";
  }
});

document.getElementById("todayLabel").textContent =
  new Date().toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" });

// owner name (purely cosmetic, per-device)
function loadOwner() {
  return localStorage.getItem(OWNER_KEY) || "you";
}
document.getElementById("ownerLabel").textContent = loadOwner();

const whoModal = document.getElementById("whoModal");
document.getElementById("whoBtn").addEventListener("click", () => {
  document.getElementById("whoInput").value = loadOwner() === "you" ? "" : loadOwner();
  whoModal.hidden = false;
});
document.getElementById("whoCancel").addEventListener("click", () => whoModal.hidden = true);
document.getElementById("whoSave").addEventListener("click", () => {
  const val = document.getElementById("whoInput").value.trim() || "you";
  localStorage.setItem(OWNER_KEY, val);
  document.getElementById("ownerLabel").textContent = val;
  whoModal.hidden = true;
});

// ---------- 7. PWA install support ----------
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(err =>
      console.warn("Service worker registration failed:", err)
    );
  });
}

// ---------- 8. First render ----------
render();
