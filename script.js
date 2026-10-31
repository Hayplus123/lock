const APPSCRIPT_URL = "https://script.google.com/macros/s/AKfycbxMPQMRw3yaWadbtPsjoG-1oWwS8XefXsjyw7v97a7CqYKsKcIEkjknS2tw_ee6rRIt2w/exec";

const LEVEL1_COMBO = [3, 8, 1, 4];
let currentDials = [0, 0, 0, 0];
let sessionToken = null;

// ==========================================
// MOUSE TELEMETRY & ANTI-BOT BEHAVIOR GUARD
// ==========================================
let mouseTelemetry = {
  totalDistance: 0,
  lastX: null,
  lastY: null,
  jitterCount: 0,
  isMoving: false,
  lastMoveTime: Date.now()
};

window.addEventListener('mousemove', (e) => {
  const now = Date.now();
  const x = (e.clientX / window.innerWidth) * 100;
  const y = (e.clientY / window.innerHeight) * 100;
  
  document.body.style.setProperty('--mouse-x', `${x}%`);
  document.body.style.setProperty('--mouse-y', `${y}%`);

  if (mouseTelemetry.lastX !== null && mouseTelemetry.lastY !== null) {
    const dx = Math.abs(e.clientX - mouseTelemetry.lastX);
    const dy = Math.abs(e.clientY - mouseTelemetry.lastY);
    const distance = Math.sqrt(dx * dx + dy * dy);

    mouseTelemetry.totalDistance += distance;

    if (distance > 0 && distance < 3) {
      mouseTelemetry.jitterCount++;
    }
  }

  mouseTelemetry.lastX = e.clientX;
  mouseTelemetry.lastY = e.clientY;
  mouseTelemetry.lastMoveTime = now;
});

// ⏱️ 5-MINUTE IDLE TIMEOUT
const IDLE_LIMIT_MS = 5 * 60 * 1000;
setInterval(() => {
  const timeSinceLastMove = Date.now() - mouseTelemetry.lastMoveTime;
  if (sessionToken && timeSinceLastMove > IDLE_LIMIT_MS) {
    triggerHackerTrap("Session terminated due to 5 minutes of inactivity / idle timeout.");
  }
}, 10000);

// ==========================================
// 📡 ADMIN TELEMETRY & EMERGENCY LOCKDOWN SYNC (0.5 sec speed)
// ==========================================
setInterval(async () => {
  if (!sessionToken) return;

  try {
    const currentLevelName = document.querySelector('.step.active')?.innerText || "START GATE";
    
    // Explicitly check all possible level input fields to grab what the player is typing
    const inputIds = ['lvl2-input', 'lvl3-input', 'lvl4-num-input', 'lvl4-2fa-input', 'lvl5-input'];
    let lastTypedInput = "";
    
    for (const id of inputIds) {
      const el = document.getElementById(id);
      // Check if element exists and is visible (not hidden by parent or class)
      if (el && window.getComputedStyle(el).display !== 'none' && !el.closest('.hidden')) {
        lastTypedInput = el.value;
        break;
      }
    }

    const res = await fetch(APPSCRIPT_URL, {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({
        action: "update_telemetry",
        sessionToken: sessionToken,
        mouseX: Math.round((mouseTelemetry.lastX / window.innerWidth) * 100) || 0,
        mouseY: Math.round((mouseTelemetry.lastY / window.innerHeight) * 100) || 0,
        level: currentLevelName,
        lastInput: lastTypedInput
      })
    });
    
    const data = await res.json();
    
    // If you click Emergency Lockdown on your admin page, this instantly traps the player!
    if (data.lockdown) {
      triggerHackerTrap("🚨 EMERGENCY LOCKDOWN ENGAGED BY SYSTEM ADMINISTRATOR.");
    }
  } catch (e) {}
}, 500); // 500ms (0.5 seconds)

function verifyMouseBehavior() {
  if (mouseTelemetry.totalDistance < 10) {
    console.warn("[-] BOT TRAP: Zero mouse movement detected!");
    return false;
  }
  return true;
}

// ==========================================
// 😈 THE EVIL HACKER TRAP (HONEYPOT REDIRECT)
// ==========================================
function triggerHackerTrap(reason = "Automated script signature detected.") {
  playSound("snd-error");
  
  fetch(APPSCRIPT_URL, {
    method: "POST",
    mode: "cors",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify({ action: "report_cheat", sessionToken: sessionToken, reason: reason })
  }).catch(e => {});

  document.body.innerHTML = `
    <div style="
      background-color: #080b10;
      color: #ff0055;
      width: 100vw;
      height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      font-family: 'Courier New', Courier, monospace;
      text-align: center;
      padding: 20px;
      border: 5px solid #ff0055;
      box-shadow: inset 0 0 50px rgba(255, 0, 85, 0.5);
    ">
      <h1 style="font-size: 2.5rem; text-shadow: 0 0 20px #ff0055; margin-bottom: 20px;">🚨 HONEYPOT TRAP ACTIVATED 🚨</h1>
      <p style="color: #00f3ff; font-size: 1.2rem; margin-bottom: 10px;">> ACCESS DENIED: BOT / IDLE / LOCKDOWN SIGNATURE CONFIRMED</p>
      <p style="color: #8a9bb8; font-size: 0.9rem; max-width: 600px; margin-bottom: 30px;">Reason: ${reason}</p>
      <p style="color: #ffcc00; font-size: 1rem;">[!] Flushing session and resetting...</p>
    </div>
  `;

  setTimeout(() => {
    location.reload();
  }, 3500);
}

// ==========================================
// CORE HELPERS
// ==========================================
function log(msg, type = "normal") {
  const c = document.getElementById("console");
  if (!c) return;
  const time = new Date().toLocaleTimeString();
  let classAttr = type === "err" ? 'class="err"' : type === "success" ? 'class="success"' : '';
  c.innerHTML += `<div ${classAttr}>[${time}] > ${msg}</div>`;
  c.scrollTop = c.scrollHeight;
}

function playSound(soundId) {
  try {
    const sound = document.getElementById(soundId);
    if (sound) {
      sound.currentTime = 0;
      sound.play().catch(e => {});
    }
  } catch (err) {}
}

function triggerPop() {
  const card = document.getElementById("lock-card");
  if (card) {
    card.classList.remove("pop-animation");
    void card.offsetWidth;
    card.classList.add("pop-animation");
  }
}

function setStepState(levelNum, state) {
  const el = document.getElementById(`step-${levelNum}`);
  if (!el) return;
  el.classList.remove("hidden");
  if (state === "cleared") {
    el.className = "step cleared";
  } else if (state === "active") {
    el.className = "step active";
  } else {
    el.className = "step";
  }
}

async function sendAppsScriptRequest(actionData) {
  try {
    if (sessionToken) {
      actionData.sessionToken = sessionToken;
    }

    const response = await fetch(APPSCRIPT_URL, {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify(actionData)
    });
    
    const data = await response.json();
    if (data.penalty) {
      triggerHackerTrap("Server-side rate limit exceeded / Blasting attack flagged.");
    }
    return data;
  } catch (err) {
    log("AppScript Connection Error: " + err.message, "err");
    return { status: "error", correct: false };
  }
}

// ==========================================
// GAMEPLAY LOGIC (LEVELS 1 - 5)
// ==========================================
async function startHackingAttempt() {
  playSound("snd-success");
  log("INITIALIZING HACKING SEQUENCE... CONTACTING REMOTE MAINFRAME...", "success");

  const response = await sendAppsScriptRequest({ action: "start_session" });
  
  if (response && response.sessionToken) {
    sessionToken = response.sessionToken;
    triggerPop();
    log("SESSION ESTABLISHED. LEVEL 1 ENGAGED.", "success");

    document.getElementById("start-gate-container").classList.add("hidden");
    document.getElementById("lvl1-container").classList.remove("hidden");
    setStepState(1, "active");
  } else {
    playSound("snd-error");
    log("Handshake failed. Check backend connection.", "err");
  }
}

function changeDial(index, delta) {
  currentDials[index] = (currentDials[index] + delta + 10) % 10;
  document.getElementById(`dial-${index}`).innerText = currentDials[index];
  playSound("snd-click");
}

async function submitLevel1() {
  const isCorrect = currentDials.every((val, idx) => val === LEVEL1_COMBO[idx]);
  if (isCorrect) {
    triggerPop();
    playSound("snd-success");
    log("LEVEL 1 CRACKED! Notifying mainframe...", "success");

    await sendAppsScriptRequest({ action: "complete_level1" });

    document.getElementById("lvl1-badge").innerText = "UNLOCKED";
    document.getElementById("lvl1-badge").classList.add("unlocked");
    setStepState(1, "cleared");

    setTimeout(() => {
      document.getElementById("lvl1-container").classList.add("hidden");
      document.getElementById("lvl2-container").classList.remove("hidden");
      setStepState(2, "active");
      log("LEVEL 2 ENGAGED");
    }, 1000);
  } else {
    playSound("snd-error");
    log("LEVEL 1 FAILED", "err");
  }
}

async function submitLevel2() {
  const inputPw = document.getElementById("lvl2-input").value;
  if (!inputPw) return log("Enter a password!", "err");

  const response = await sendAppsScriptRequest({ action: "verify_level2", guess: inputPw });

  if (response.correct) {
    triggerPop();
    playSound("snd-success");
    log("LEVEL 2 CRACKED!", "success");
    document.getElementById("lvl2-badge").innerText = "UNLOCKED";
    document.getElementById("lvl2-badge").classList.add("unlocked");
    setStepState(2, "cleared");

    setTimeout(() => {
      document.getElementById("lvl2-container").classList.add("hidden");
      document.getElementById("lvl3-container").classList.remove("hidden");
      setStepState(3, "active");
      log("LEVEL 3 ENGAGED");
    }, 1000);
  } else {
    playSound("snd-error");
    log(`LEVEL 2 FAILED -> [${inputPw}]`, "err");
  }
}

async function submitLevel3() {
  const guess = document.getElementById("lvl3-input").value;
  if (!guess) return log("Enter a guess first!", "err");

  const response = await sendAppsScriptRequest({ action: "verify_level3", guess: guess });

  if (response.correct) {
    triggerPop();
    playSound("snd-success");
    log("LEVEL 3 CRACKED!", "success");
    document.getElementById("lvl3-badge").innerText = "UNLOCKED";
    document.getElementById("lvl3-badge").classList.add("unlocked");
    setStepState(3, "cleared");

    setTimeout(() => {
      document.getElementById("lvl3-container").classList.add("hidden");
      document.getElementById("lvl4-container").classList.remove("hidden");
      setStepState(4, "active");
      log("LEVEL 4 ENGAGED");
    }, 1000);
  } else {
    playSound("snd-error");
    log(`LEVEL 3 FAILED -> [${guess}]`, "err");
  }
}

async function submitLevel4Step1() {
  const masterNum = document.getElementById("lvl4-num-input").value;
  if (!masterNum) return log("Enter Master Number!", "err");

  const response = await sendAppsScriptRequest({ action: "verify_level4_step1", guess: masterNum });

  if (response.correct) {
    playSound("snd-success");
    log("LEVEL 4 (STEP 1) CRACKED!", "success");
    document.getElementById("lvl4-step1-box").classList.add("hidden");
    document.getElementById("lvl4-step2-box").classList.remove("hidden");
  } else {
    playSound("snd-error");
    log(`LEVEL 4 (STEP 1) FAILED -> [${masterNum}]`, "err");
  }
}

async function submitLevel4Step2() {
  const tokenInput = document.getElementById("lvl4-2fa-input").value;
  if (!tokenInput) return log("Enter 2FA Code!", "err");

  const response = await sendAppsScriptRequest({ action: "verify_level4_step2", token: tokenInput });

  if (response.correct) {
    triggerPop();
    playSound("snd-success");
    log("LEVEL 4 CLEARED! INJECTING SECRET FINAL LEVEL...", "success");
    document.getElementById("lvl4-badge").innerText = "UNLOCKED";
    document.getElementById("lvl4-badge").classList.add("unlocked");
    setStepState(4, "cleared");

    setTimeout(() => {
      document.getElementById("lvl4-container").classList.add("hidden");

      const progressBar = document.getElementById("progress-bar");
      progressBar.innerHTML += `<div id="step-5" class="step active">LVL 5</div>`;

      const lockCard = document.getElementById("lock-card");
      const lvl5Div = document.createElement("div");
      lvl5Div.id = "lvl5-container";
      lvl5Div.innerHTML = `
        <div class="lock-header">
          <span class="lock-title" style="color: var(--neon-red);">⚠️ LEVEL 5: THE FINAL STAND ⚠️</span>
          <span class="status-badge" id="lvl5-badge">ACTIVE</span>
        </div>
        <p class="instruction">SECRET LEVEL UNLOCKED! A 10-character alphanumeric final code was generated in the 2FA Spreadsheet. Infiltrate it to trigger sirens!</p>
        <div class="input-group">
          <input type="text" id="lvl5-input" placeholder="10-CHAR FINAL CODE" autocomplete="off"/>
          <button class="btn-submit" style="background: var(--neon-red); color: #fff;" onclick="submitLevel5()">BREACH FINAL STAND</button>
        </div>
        <div id="victory-box" class="victory-screen hidden">
          <h2>🚨 SIRENS BLAZING 🚨</h2>
          <p>YOU HAVE INFILTRATED THE SYSTEM</p>
        </div>
      `;
      lockCard.insertBefore(lvl5Div, document.getElementById("console"));
      log("⚠️ LEVEL 5 (THE FINAL STAND) ENGAGED!");
    }, 1000);

  } else {
    playSound("snd-error");
    log(`LEVEL 4 (STEP 2) FAILED -> [${tokenInput}]`, "err");
  }
}

async function submitLevel5() {
  const codeInput = document.getElementById("lvl5-input").value;
  if (!codeInput) return log("Enter the 10-char final code!", "err");

  const response = await sendAppsScriptRequest({ action: "verify_level5", code: codeInput });

  if (response.correct) {
    document.getElementById("lock-card").classList.add("siren-active");
    document.body.classList.add("siren-active");
    
    document.getElementById("lvl5-input").parentElement.classList.add("hidden");
    document.getElementById("victory-box").classList.remove("hidden");
    document.getElementById("lvl5-badge").innerText = "INFILTRATED";
    document.getElementById("lvl5-badge").classList.add("unlocked");
    setStepState(5, "cleared");

    log("🚨 SYSTEM FULLY INFILTRATED! SIRENS ACTIVE!", "success");
    playSound("snd-siren");
  } else {
    playSound("snd-error");
    log(`LEVEL 5 FAILED: Invalid Final Code -> [${codeInput}]`, "err");
  }
}