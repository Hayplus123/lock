const APPSCRIPT_URL = "https://script.google.com/macros/s/AKfycbxMPQMRw3yaWadbtPsjoG-1oWwS8XefXsjyw7v97a7CqYKsKcIEkjknS2tw_ee6rRIt2w/exec";

const LEVEL1_COMBO = [3, 8, 1, 4];
let currentDials = [0, 0, 0, 0];
let activeLevel = 1; // UI tracking only; backend holds ultimate truth

function log(msg, type = "normal") {
  const c = document.getElementById("console");
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
  card.classList.remove("pop-animation");
  void card.offsetWidth;
  card.classList.add("pop-animation");
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
// LEVEL 1 LOGIC
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
    log("LEVEL 1 CRACKED!", "success");
    document.getElementById("lvl1-badge").innerText = "UNLOCKED";
    document.getElementById("lvl1-badge").classList.add("unlocked");
    setStepState(1, "cleared");

    activeLevel = 2;
    sendAppsScriptRequest({ action: "breach_notification", level: "Level 1" });

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
  const decodedTarget = atob("NDkyMA==");

  if (inputPw === decodedTarget) {
    triggerPop();
    playSound("snd-success");
    log("LEVEL 2 CRACKED!", "success");
    document.getElementById("lvl2-badge").innerText = "UNLOCKED";
    document.getElementById("lvl2-badge").classList.add("unlocked");
    setStepState(2, "cleared");

    activeLevel = 3;
    sendAppsScriptRequest({ action: "breach_notification", level: "Level 2" });

    setTimeout(() => {
      document.getElementById("lvl2-container").classList.add("hidden");
      document.getElementById("lvl3-container").classList.remove("hidden");
      setStepState(3, "active");
      log("LEVEL 3 ENGAGED");
    }, 1000);
  } else {
    playSound("snd-error");
    log(`LEVEL 2 FAILED -> [${inputPw}]`, "err");
    sendAppsScriptRequest({ action: "wrong_guess_log", level: "Level 2", guess: inputPw });
  }
}

// ==========================================
// LEVEL 3 LOGIC (Server-Validated)
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

    activeLevel = 4;
    setTimeout(() => {
      document.getElementById("lvl3-container").classList.add("hidden");
      document.getElementById("lvl4-container").classList.remove("hidden");
      setStepState(4, "active");
      log("LEVEL 4 ENGAGED");
    }, 1000);
  } else {
    playSound("snd-error");
    log(`LEVEL 3 FAILED -> [${guess}]`, "err");
    // If they tried to skip levels, the backend catches it and penalizes them
    if (response.penalty) {
      location.reload(); // Hard reset if caught cheating
    }
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
  }
}

async function submitLevel4Step2() {
  const tokenInput = document.getElementById("lvl4-2fa-input").value;
  if (!tokenInput) return log("Enter 2FA Code!", "err");

  const response = await sendAppsScriptRequest({ action: "verify_level4_step2", token: tokenInput });

  if (response.correct) {
    triggerPop();
    playSound("snd-success");
    log("LEVEL 4 CLEARED! SECRET FINAL LEVEL UNLOCKED!", "success");
    document.getElementById("lvl4-badge").innerText = "UNLOCKED";
    document.getElementById("lvl4-badge").classList.add("unlocked");
    setStepState(4, "cleared");

    activeLevel = 5;
    setTimeout(() => {
      document.getElementById("lvl4-container").classList.add("hidden");
      document.getElementById("lvl5-container").classList.remove("hidden");
      setStepState(5, "active");
      log("⚠️ LEVEL 5 (THE FINAL STAND) ENGAGED!");
    }, 1000);
  } else {
    playSound("snd-error");
    log(`LEVEL 4 (STEP 2) FAILED -> [${tokenInput}]`, "err");
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
  }
}

// Freeze functions to prevent function tampering
Object.freeze(submitLevel1);
Object.freeze(submitLevel2);
Object.freeze(submitLevel3);
Object.freeze(submitLevel4Step1);
Object.freeze(submitLevel4Step2);
Object.freeze(submitLevel5);