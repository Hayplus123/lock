const MAIN_SPREADSHEET_ID = "1jQ2TrHu4JfOcvVPhFuV0yA_DmwrXCK3bE4HpEUUnO1Q";
const VERIFICATION_SPREADSHEET_ID = "1AS3Sfzd5cq7tm7c7ROFtbt-tzc8U7qm3umIvDKWtgrg";
const NOTIFICATION_EMAIL = "haydenfive17@gmail.com";

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    let response = { status: "success" };
    const cache = CacheService.getScriptCache();

    // Rate Limiting & Anti-Blasting Defense Check
    const clientIP = e.parameter && e.parameter.ip ? e.parameter.ip : "client_ip";
    if (!checkRateLimit(clientIP, cache)) {
      // TRIGGER ANTI-BLASTING PENALTY
      triggerHackerPenalty("Blasting attack detected! Rate limit exceeded (>25 req/min).");
      return ContentService.createTextOutput(JSON.stringify({ 
        correct: false, 
        error: "Rate limit exceeded! Hacker penalty triggered.", 
        penalty: true 
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 1. LEVEL 1 COMPLETED -> Issue Session Token (Stage 2)
    if (data.action === "complete_level1") {
      const sessionToken = generateRandomAlphaNumeric(24);
      cache.put(sessionToken, "2", 1800); // Token valid for 30 mins, set to stage 2
      response.sessionToken = sessionToken;
      logToSheet("Sheet1", [new Date(), "Level 1", "Session started"]);
      sendEmailAlert("🚨 SECURITY ALERT: Level 1 Breached!", "A user cracked Level 1 and initiated a session.");
    }

    // 2. VERIFY LEVEL 2
    else if (data.action === "verify_level2") {
      const stage = checkSession(data.sessionToken, 2, cache);
      if (!stage) return sendErrorResponse("Unauthorized or expired session. Complete Level 1 first!");

      const decodedTarget = "4920"; 
      if (data.guess === decodedTarget) {
        cache.put(data.sessionToken, "3", 1800); // Advance to stage 3
        response.correct = true;
        logToSheet("Sheet1", [new Date(), "Level 2", "Password accepted"]);
        sendEmailAlert("🚨 SECURITY ALERT: Level 2 Breached!", "A user cracked Level 2.");
      } else {
        response.correct = false;
        logToSheet("Sheet1", [new Date(), "Level 2 FAILED", `Guessed: ${data.guess}`]);
      }
    }

    // 3. VERIFY LEVEL 3
    else if (data.action === "verify_level3") {
      const stage = checkSession(data.sessionToken, 3, cache);
      if (!stage) return sendErrorResponse("Unauthorized step skipping detected!");

      const mainSheet = SpreadsheetApp.openById(MAIN_SPREADSHEET_ID).getSheetByName("Targets");
      const targetLvl3 = mainSheet.getRange("B2").getValue();
      
      if (parseInt(data.guess) === parseInt(targetLvl3)) {
        cache.put(data.sessionToken, "4", 1800); // Advance to stage 4
        response.correct = true;
        logToSheet("Sheet1", [new Date(), "Level 3", "Cloud vault breached"]);
        sendEmailAlert("🚨 SECURITY ALERT: Level 3 Breached!", "A user cracked Level 3.");
      } else {
        response.correct = false;
      }
    }

    // 4. VERIFY LEVEL 4 (STEP 1)
    else if (data.action === "verify_level4_step1") {
      const stage = checkSession(data.sessionToken, 4, cache);
      if (!stage) return sendErrorResponse("Unauthorized step skipping detected!");

      const mainSheet = SpreadsheetApp.openById(MAIN_SPREADSHEET_ID).getSheetByName("Targets");
      const targetLvl4 = mainSheet.getRange("B3").getValue();

      if (parseInt(data.guess) === parseInt(targetLvl4)) {
        const token = generateRandomAlphaNumeric(6);
        const verificationSheet = SpreadsheetApp.openById(VERIFICATION_SPREADSHEET_ID).getActiveSheet();
        verificationSheet.appendRow([new Date(), "Level 4 2FA Token", token]);
        response.correct = true;
      } else {
        response.correct = false;
      }
    }

    // 5. VERIFY LEVEL 4 (STEP 2) -> Advance to Stage 5
    else if (data.action === "verify_level4_step2") {
      const stage = checkSession(data.sessionToken, 4, cache);
      if (!stage) return sendErrorResponse("Unauthorized step skipping detected!");

      const verificationSheet = SpreadsheetApp.openById(VERIFICATION_SPREADSHEET_ID).getActiveSheet();
      const lastRow = verificationSheet.getLastRow();

      if (lastRow > 1) {
        const latestToken = verificationSheet.getRange(lastRow, 3).getValue();
        if (data.token.trim().toUpperCase() === String(latestToken).trim().toUpperCase()) {
          
          cache.put(data.sessionToken, "5", 1800); // Advance to final stage 5
          const finalSecretCode = generateRandomAlphaNumeric(10);
          verificationSheet.appendRow([new Date(), "LEVEL 5 FINAL STAND CODE", finalSecretCode]);
          
          response.correct = true;
          logToSheet("Sheet1", [new Date(), "Level 4", "2FA Passed, Level 5 unlocked"]);
        } else {
          response.correct = false;
        }
      } else {
        response.correct = false;
      }
    }

    // 6. VERIFY LEVEL 5 (FINAL STAND)
    else if (data.action === "verify_level5") {
      const stage = checkSession(data.sessionToken, 5, cache);
      if (!stage) return sendErrorResponse("Unauthorized final breach attempt!");

      const verificationSheet = SpreadsheetApp.openById(VERIFICATION_SPREADSHEET_ID).getActiveSheet();
      const lastRow = verificationSheet.getLastRow();

      if (lastRow > 1) {
        const latestCode = verificationSheet.getRange(lastRow, 3).getValue();
        if (data.code.trim().toUpperCase() === String(latestCode).trim().toUpperCase()) {
          response.correct = true;
          logToSheet("Sheet1", [new Date(), "LEVEL 5 COMPLETE", "SYSTEM FULLY INFILTRATED"]);
          sendEmailAlert("🚨 ULTIMATE ALERT: System Fully Infiltrated!", "Your friend successfully cleared Level 5 Final Stand!");
        } else {
          response.correct = false;
        }
      } else {
        response.correct = false;
      }
    }

    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function checkSession(token, requiredStage, cache) {
  if (!token) return false;
  const currentStage = cache.get(token);
  if (!currentStage) return false;
  return parseInt(currentStage) >= requiredStage;
}

function sendErrorResponse(msg) {
  return ContentService.createTextOutput(JSON.stringify({ correct: false, error: msg, penalty: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function checkRateLimit(userKey, cache) {
  let attempts = cache.get("rate_" + userKey);
  if (attempts && parseInt(attempts) > 25) return false;
  cache.put("rate_" + userKey, attempts ? parseInt(attempts) + 1 : 1, 60);
  return true;
}

// 🛡️ ANTI-BLASTING PENALTY HANDLER
function triggerHackerPenalty(reason) {
  try {
    const mainSheet = SpreadsheetApp.openById(MAIN_SPREADSHEET_ID).getSheetByName("Targets");
    
    // Instantly scramble Level 3 and Level 4 targets so brute-force attempts fail
    const newLvl3Target = Math.floor(Math.random() * 10000) + 1;
    const newLvl4Target = Math.floor(Math.random() * 100000) + 1;
    
    mainSheet.getRange("B2").setValue(newLvl3Target);
    mainSheet.getRange("B3").setValue(newLvl4Target);

    // Log the security breach in Sheet1 audit trail.
    logToSheet("Sheet1", [new Date(), "🚨 HACKER PENALTY TRIGGERED", reason]);

    // Dispatch emergency alert email to your inbox
    sendEmailAlert(
      "🚨 HACKER CAUGHT & PENALIZED!", 
      `Anti-cheat triggered!\nReason: ${reason}\n\nAction Taken:\n- Targets automatically scrambled.\n- New Level 3 Target: ${newLvl3Target}\n- New Level 4 Target: ${newLvl4Target}`
    );
  } catch (err) {
    console.error("Penalty execution error: " + err.toString());
  }
}

function logToSheet(sheetName, rowData) {
  const sheet = SpreadsheetApp.openById(MAIN_SPREADSHEET_ID).getSheetByName(sheetName);
  sheet.appendRow(rowData);
}

function sendEmailAlert(subject, body) {
  MailApp.sendEmail(NOTIFICATION_EMAIL, subject, body);
}

function generateRandomAlphaNumeric(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}