// Connected Web App URL
const APPSCRIPT_URL = "https://script.google.com/macros/s/AKfycbxMPQMRw3yaWadbtPsjoG-1oWwS8XefXsjyw7v97a7CqYKsKcIEkjknS2tw_ee6rRIt2w/exec";

// Level 1 Combination stored in JS
const LEVEL1_COMBO = [3, 8, 1, 4];
let currentDials = [0, 0, 0, 0];

// Track current active level server-side/client-side state to prevent skipping
let activeLevel = 1;

// Logging helper
function log(msg, type = "normal") {
  const c = document.getElementById("console");
  const time = new Date().toLocaleTimeString();
  let classAttr = type === "err" ? 'class="err"' : type === "success" ? 'class="success"' : '';
  c.innerHTML += `<div ${classAttr}>[${time}] > ${msg}</div>`;
  c.scrollTop = c.scrollHeight;
}

// Pop lock visual effect
function triggerPop() {
  const card = document.getElementById("lock-card");
  card.classList.remove("pop-animation");
  void card.offsetWidth; // trigger reflow
  card.classList.add("pop-animation");
}

// Update UI progress steps
function setStepState(levelNum, state) {
  const el = document.getElementById(`step-${levelNum}`);
  if (state === "cleared") {
    el.className = "step cleared";
  } else if (state === "active") {
    el.className = "step active";
  }
}

// Send logs, verification checks, and alerts to Google Apps Script
async function sendAppsScriptRequest(actionData) {
  try {
    const response = await fetch(APPSCRIPT_URL, {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify(actionData)
    });
    return await response.json();
  } catch (err) {
    log("AppScript Connection Error: " + err.message, "err");
    return { status: "error" };
  }
}

// ==========================================
// SECURITY TRAP: Detect & Shoot Back at Tampering
// ==========================================
function triggerSecurityCountermeasure(cheatType, suspiciousData = "") {
  log(`🚨 SECURITY BREACH DETECTED: ${cheatType}`, "err");
  console.error(`%c[COUNTER-ATTACK ACTIVATED] Unauthorized tampering intercepted: ${cheatType}`, "color: #ff0055; font-size: 14px; font-weight: bold;");

  // Send a special "tamper_alert" to your Google Spreadsheet & email alert!
  sendAppsScriptRequest({
    action: "tamper_alert",
    cheatType: cheatType,
    details: suspiciousData || "Attempted console override or sequence skip."
  });

  // Punish the hacker in the UI
  document.getElementById("lock-card").style.borderColor = "var(--neon-red)";
  log("⚠️ WARNING: Your IP and cheat attempt have been logged to the central command server!", "err");
}

// ==========================================
// LEVEL 1 LOGIC
// ==========================================
function changeDial(index, delta) {
  currentDials[index] = (currentDials[index] + delta + 10) % 10;
  document.getElementById(`dial-${index}`).innerText = currentDials[index];
}

async function submitLevel1() {
  if (activeLevel !== 1) {
    triggerSecurityCountermeasure("Level Bypass Attempt", "Tried submitting Level 1 out of order.");
    return;
  }

  const isCorrect = currentDials.every((val, idx) => val === LEVEL1_COMBO[idx]);

  if (isCorrect) {
    triggerPop();
    log("LEVEL 1 CRACKED! Combination Accepted.", "success");
    document.getElementById("lvl1-badge").innerText = "UNLOCKED";
    document.getElementById("lvl1-badge").classList.add("unlocked");
    setStepState(1, "cleared");

    activeLevel = 2; // Advance legitimate state
    sendAppsScriptRequest({ action: "breach_notification", level: "Level 1" });

    setTimeout(() => {
      document.getElementById("lvl1-container").classList.add("hidden");
      document.getElementById("lvl2-container").classList.remove("hidden");
      setStepState(2, "active");
      log("LEVEL 2 ENGAGED: Fetching password file...");
    }, 1000);

  } else {
    log("LEVEL 1 FAILED: Incorrect Dial Combination.", "err");
  }
}

// ==========================================
// LEVEL 2 LOGIC
// ==========================================
async function submitLevel2() {
  if (activeLevel !== 2) {
    triggerSecurityCountermeasure("Level 2 Bypass", "Attempted to skip Level 2 or submit out of order.");
    return;
  }

  const inputPw = document.getElementById("lvl2-input").value;

  try {
    log("Fetching passwords.json from server...");
    const res = await fetch("passwords.json");
    const data = await res.json();

    if (inputPw === data.level2_password) {
      triggerPop();
      log("LEVEL 2 CRACKED! Password Accepted.", "success");
      document.getElementById("lvl2-badge").innerText = "UNLOCKED";
      document.getElementById("lvl2-badge").classList.add("unlocked");
      setStepState(2, "cleared");

      activeLevel = 3; // Advance state
      sendAppsScriptRequest({ action: "breach_notification", level: "Level 2" });

      setTimeout(() => {
        document.getElementById("lvl2-container").classList.add("hidden");
        document.getElementById("lvl3-container").classList.remove("hidden");
        setStepState(3, "active");
        log("LEVEL 3 ENGAGED: Ready for cloud guess verification.");
      }, 1000);

    } else {
      log(`LEVEL 2 FAILED: Incorrect password guessed -> [${inputPw}]`, "err");
      // Log wrong guesses to trace what they tried!
      sendAppsScriptRequest({ action: "wrong_guess_log", level: "Level 2", guess: inputPw });
    }
  } catch (err) {
    log("Error loading JSON config file.", "err");
  }
}

// ==========================================
// LEVEL 3 LOGIC
// ==========================================
async function submitLevel3() {
  if (activeLevel !== 3) {
    triggerSecurityCountermeasure("Level 3 Bypass", "Attempted to skip Level 3.");
    return;
  }

  const guess = document.getElementById("lvl3-input").value;
  if (!guess) return log("Enter a guess first!", "err");

  log(`Transmitting Level 3 guess (${guess}) to Google Apps Script...`);

  const response = await sendAppsScriptRequest({
    action: "verify_level3",
    guess: guess
  });

  if (response.correct) {
    triggerPop();
    log("LEVEL 3 CRACKED! Remote Number Verified.", "success");
    document.getElementById("lvl3-badge").innerText = "UNLOCKED";
    document.getElementById("lvl3-badge").classList.add("unlocked");
    setStepState(3, "cleared");

    activeLevel = 4; // Advance state
    sendAppsScriptRequest({ action: "breach_notification", level: "Level 3" });

    setTimeout(() => {
      document.getElementById("lvl3-container").classList.add("hidden");
      document.getElementById("lvl4-container").classList.remove("hidden");
      setStepState(4, "active");
      log("LEVEL 4 ENGAGED: Master Number Verification required.");
    }, 1000);

  } else {
    log(`LEVEL 3 FAILED: Incorrect guess -> [${guess}]`, "err");
  }
}

// ==========================================
// LEVEL 4 LOGIC
// ==========================================
async function submitLevel4Step1() {
  if (activeLevel !== 4) {
    triggerSecurityCountermeasure("Level 4 Bypass", "Attempted to skip Level 4.");
    return;
  }

  const masterNum = document.getElementById("lvl4-num-input").value;
  if (!masterNum) return log("Enter Master Number!", "err");

  log("Verifying Level 4 Master Number...");

  const response = await sendAppsScriptRequest({
    action: "verify_level4_step1",
    guess: masterNum
  });

  if (response.correct) {
    log("LEVEL 4 (STEP 1) CRACKED! Master Number matched.", "success");
    log("Random 2FA letter code generated in Verification Spreadsheet!", "success");

    document.getElementById("lvl4-step1-box").classList.add("hidden");
    document.getElementById("lvl4-step2-box").classList.remove("hidden");

  } else {
    log(`LEVEL 4 (STEP 1) FAILED: Incorrect master guess -> [${masterNum}]`, "err");
  }
}

async function submitLevel4Step2() {
  if (activeLevel !== 4) {
    triggerSecurityCountermeasure("Level 4 Step 2 Bypass", "Unauthorized 2FA submission.");
    return;
  }

  const tokenInput = document.getElementById("lvl4-2fa-input").value;
  if (!tokenInput) return log("Enter 2FA Code!", "err");

  log("Verifying 2FA Letter Code against Verification Spreadsheet...");

  const response = await sendAppsScriptRequest({
    action: "verify_level4_step2",
    token: tokenInput
  });

  if (response.correct) {
    triggerPop();
    log("🏆 SYSTEM FULLY BREACHED! ALL LOCKS CLEARED!", "success");
    document.getElementById("lvl4-badge").innerText = "UNLOCKED";
    document.getElementById("lvl4-badge").classList.add("unlocked");
    setStepState(4, "cleared");

    sendAppsScriptRequest({ action: "breach_notification", level: "Level 4 (FINAL COMPLETE)" });

  } else {
    log(`LEVEL 4 (STEP 2) FAILED: Invalid 2FA token -> [${tokenInput}]`, "err");
  }
}

// ==========================================
// TAMPER-PROOF WATCHDOG (Freezes functions if overwritten)
// ==========================================
Object.freeze(submitLevel1);
Object.freeze(submitLevel2);
Object.freeze(submitLevel3);
Object.freeze(submitLevel4Step1);
Object.freeze(submitLevel4Step2);