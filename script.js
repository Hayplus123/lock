const APPSCRIPT_URL = "https://script.google.com/macros/s/AKfycbxMPQMRw3yaWadbtPsjoG-1oWwS8XefXsjyw7v97a7CqYKsKcIEkjknS2tw_ee6rRIt2w/exec";

const LEVEL1_COMBO = [3, 8, 1, 4];
let currentDials = [0, 0, 0, 0];
let sessionToken = null; // Secured server-side token tracking state

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
    // Automatically attach sessionToken to every secure request
    if (sessionToken) {
      actionData.sessionToken = sessionToken;
    }

    const response = await fetch(APPSCRIPT_URL, {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify(actionData)
    });
    return await response.json();
  } catch (err) {
    log("AppScript Connection Error: " + err.message, "err");
    return { status: "error", correct: false };
  }
}

// ==========================================
// LEVEL 1 LOGIC (Issues Session Token on Success)
// ==========================================
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
    log("LEVEL 1 CRACKED! Requesting session token...", "success");

    // Ask server to initialize session
    const response = await sendAppsScriptRequest({ action: "complete_level1" });
    if (response && response.sessionToken) {
      sessionToken = response.sessionToken; // Store secure token
    }

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

// ==========================================
// LEVEL 2 LOGIC
// ==========================================
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
    if (response.penalty) location.reload();
  }
}

// ==========================================
// LEVEL 3 LOGIC
// ==========================================
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
    if (response.penalty) location.reload();
  }
}

// ==========================================
// LEVEL 4 LOGIC
// ==========================================
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
    if (response.penalty) location.reload();
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

    // DYNAMICALLY INJECT LEVEL 5 (Prevents console DOM spoofing)
    setTimeout(() => {
      document.getElementById("lvl4-container").classList.add("hidden");

      // Inject Step 5 into progress bar
      const progressBar = document.getElementById("progress-bar");
      progressBar.innerHTML += `<div id="step-5" class="step active">LVL 5</div>`;

      // Inject Level 5 container into the lock card
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
    if (response.penalty) location.reload();
  }
}

// ==========================================
// LEVEL 5 LOGIC
// ==========================================
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
    if (response.penalty) location.reload();
  }
}

// Freeze functions to protect core code structure
Object.freeze(submitLevel1);
Object.freeze(submitLevel2);
Object.freeze(submitLevel3);
Object.freeze(submitLevel4Step1);
Object.freeze(submitLevel4Step2);
Object.freeze(submitLevel5);