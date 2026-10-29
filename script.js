const APPSCRIPT_URL = "https://script.google.com/macros/s/AKfycbxMPQMRw3yaWadbtPsjoG-1oWwS8XefXsjyw7v97a7CqYKsKcIEkjknS2tw_ee6rRIt2w/exec";

const LEVEL1_COMBO = [3, 8, 1, 4];
let currentDials = [0, 0, 0, 0];
let activeLevel = 1;

function log(msg, type = "normal") {
  const c = document.getElementById("console");
  const time = new Date().toLocaleTimeString();
  let classAttr = type === "err" ? 'class="err"' : type === "success" ? 'class="success"' : '';
  c.innerHTML += `<div ${classAttr}>[${time}] > ${msg}</div>`;
  c.scrollTop = c.scrollHeight;
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
    return { status: "error" };
  }
}

async function triggerDemotionPenalty(reason) {
  log(`🚨 SECURITY BREACH: ${reason}. DEMOTING USER!`, "err");
  await sendAppsScriptRequest({ action: "demote_penalty", reason: reason });

  if (activeLevel > 1) activeLevel--;

  document.getElementById("lvl1-container").classList.add("hidden");
  document.getElementById("lvl2-container").classList.add("hidden");
  document.getElementById("lvl3-container").classList.add("hidden");
  document.getElementById("lvl4-container").classList.add("hidden");
  document.getElementById("lvl5-container").classList.add("hidden");

  if (activeLevel === 1) {
    document.getElementById("lvl1-container").classList.remove("hidden");
    setStepState(1, "active");
    setStepState(2, "");
  } else if (activeLevel === 2) {
    document.getElementById("lvl2-container").classList.remove("hidden");
    setStepState(2, "active");
    setStepState(3, "");
  } else if (activeLevel === 3) {
    document.getElementById("lvl3-container").classList.remove("hidden");
    setStepState(3, "active");
    setStepState(4, "");
  } else if (activeLevel === 4) {
    document.getElementById("lvl4-container").classList.remove("hidden");
    setStepState(4, "active");
  }
}

// ==========================================
// LEVEL 1 LOGIC
// ==========================================
function changeDial(index, delta) {
  currentDials[index] = (currentDials[index] + delta + 10) % 10;
  document.getElementById(`dial-${index}`).innerText = currentDials[index];
}

async function submitLevel1() {
  if (activeLevel !== 1) return triggerDemotionPenalty("Out-of-order submission on Level 1");

  const isCorrect = currentDials.every((val, idx) => val === LEVEL1_COMBO[idx]);
  if (isCorrect) {
    triggerPop();
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
    log("LEVEL 1 FAILED", "err");
  }
}

// ==========================================
// LEVEL 2 LOGIC
// ==========================================
async function submitLevel2() {
  if (activeLevel !== 2) return triggerDemotionPenalty("Sequence skip on Level 2");

  const inputPw = document.getElementById("lvl2-input").value;
  const decodedTarget = atob("NDkyMA==");

  if (inputPw === decodedTarget) {
    triggerPop();
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
    log(`LEVEL 2 FAILED -> [${inputPw}]`, "err");
    sendAppsScriptRequest({ action: "wrong_guess_log", level: "Level 2", guess: inputPw });
  }
}

// ==========================================
// LEVEL 3 LOGIC
// ==========================================
async function submitLevel3() {
  if (activeLevel !== 3) return triggerDemotionPenalty("Sequence skip on Level 3");

  const guess = document.getElementById("lvl3-input").value;
  if (!guess) return log("Enter a guess first!", "err");

  const response = await sendAppsScriptRequest({ action: "verify_level3", guess: guess });

  if (response.correct) {
    triggerPop();
    log("LEVEL 3 CRACKED!", "success");
    document.getElementById("lvl3-badge").innerText = "UNLOCKED";
    document.getElementById("lvl3-badge").classList.add("unlocked");
    setStepState(3, "cleared");

    activeLevel = 4;
    sendAppsScriptRequest({ action: "breach_notification", level: "Level 3" });

    setTimeout(() => {
      document.getElementById("lvl3-container").classList.add("hidden");
      document.getElementById("lvl4-container").classList.remove("hidden");
      setStepState(4, "active");
      log("LEVEL 4 ENGAGED");
    }, 1000);
  } else {
    log(`LEVEL 3 FAILED -> [${guess}]`, "err");
  }
}

// ==========================================
// LEVEL 4 LOGIC
// ==========================================
async function submitLevel4Step1() {
  if (activeLevel !== 4) return triggerDemotionPenalty("Sequence skip on Level 4");

  const masterNum = document.getElementById("lvl4-num-input").value;
  if (!masterNum) return log("Enter Master Number!", "err");

  const response = await sendAppsScriptRequest({ action: "verify_level4_step1", guess: masterNum });

  if (response.correct) {
    log("LEVEL 4 (STEP 1) CRACKED!", "success");
    document.getElementById("lvl4-step1-box").classList.add("hidden");
    document.getElementById("lvl4-step2-box").classList.remove("hidden");
  } else {
    log(`LEVEL 4 (STEP 1) FAILED -> [${masterNum}]`, "err");
  }
}

async function submitLevel4Step2() {
  if (activeLevel !== 4) return triggerDemotionPenalty("Unauthorized 2FA submission");

  const tokenInput = document.getElementById("lvl4-2fa-input").value;
  if (!tokenInput) return log("Enter 2FA Code!", "err");

  const response = await sendAppsScriptRequest({ action: "verify_level4_step2", token: tokenInput });

  if (response.correct) {
    triggerPop();
    log("LEVEL 4 CLEARED! SECRET FINAL LEVEL UNLOCKED!", "success");
    document.getElementById("lvl4-badge").innerText = "UNLOCKED";
    document.getElementById("lvl4-badge").classList.add("unlocked");
    setStepState(4, "cleared");

    activeLevel = 5;
    sendAppsScriptRequest({ action: "breach_notification", level: "Level 4" });

    // Transition to Secret Level 5
    setTimeout(() => {
      document.getElementById("lvl4-container").classList.add("hidden");
      document.getElementById("lvl5-container").classList.remove("hidden");
      setStepState(5, "active");
      log("⚠️ LEVEL 5 (THE FINAL STAND) ENGAGED!");
    }, 1000);
  } else {
    log(`LEVEL 4 (STEP 2) FAILED -> [${tokenInput}]`, "err");
  }
}

// ==========================================
// LEVEL 5 LOGIC (SECRET FINAL STAND)
// ==========================================
async function submitLevel5() {
  if (activeLevel !== 5) return triggerDemotionPenalty("Unauthorized Level 5 submission");

  const codeInput = document.getElementById("lvl5-input").value;
  if (!codeInput) return log("Enter the 10-char final code!", "err");

  log("Verifying Final Stand Code against 2FA Spreadsheet...");

  const response = await sendAppsScriptRequest({ action: "verify_level5", code: codeInput });

  if (response.correct) {
    // TRIGGER SIREN & VICTORY ANIMATION
    document.getElementById("lock-card").classList.add("siren-active");
    document.body.classList.add("siren-active");
    
    document.getElementById("lvl5-input").parentElement.classList.add("hidden");
    document.getElementById("victory-box").classList.remove("hidden");
    document.getElementById("lvl5-badge").innerText = "INFILTRATED";
    document.getElementById("lvl5-badge").classList.add("unlocked");
    setStepState(5, "cleared");

    log("🚨 SYSTEM FULLY INFILTRATED! SIRENS ACTIVE!", "success");
    sendAppsScriptRequest({ action: "breach_notification", level: "Level 5 (FINAL STAND COMPLETE)" });
  } else {
    log(`LEVEL 5 FAILED: Invalid Final Code -> [${codeInput}]`, "err");
  }
}

Object.freeze(submitLevel1);
Object.freeze(submitLevel2);
Object.freeze(submitLevel3);
Object.freeze(submitLevel4Step1);
Object.freeze(submitLevel4Step2);
Object.freeze(submitLevel5);