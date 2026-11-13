/* ==========================================================================
   PYQUEST: SOLO CODE LEVELING (AAA+ EDITION)
   File 5/5: engine.js — Core RPG State Machine, Combat Deck & Modal Controller
   ========================================================================== */

(function () {
  "use strict";

  if (window.__PYQUEST_BOOTED__) return;
  window.__PYQUEST_BOOTED__ = true;

  const GameState = {
    currentClass: "python",
    currentLevel: 1,
    unlockedLevels: {
      python: 10,
      javascript: 10,
      cpp: 10,
    },
    extractedShadows: {
      python: false,
      javascript: false,
      cpp: false,
    },
    lang: "en", // "en" | "ur"
    xp: 50,
    streak: 0,
    maxStreakInGate: 0,
    attemptsInGate: 0,
    correctInGate: 0,
    heroHP: 100,
    heroMaxHP: 100,
    enemyHP: 100,
    enemyMaxHP: 100,
    timerSeconds: 15.0,
    timerMax: 15.0,
    timerInterval: null,
    awaitingNext: false,
    fiftyFiftyUsed: false,
  };

  /* ========================================================================
     DOM ELEMENT REFERENCES
     ======================================================================== */
  const DOM = {};

  function cacheDOM() {
    DOM.hudClassIcon = document.getElementById("hud-class-icon");
    DOM.hudClassName = document.getElementById("hud-class-name");
    DOM.rankBadgeText = document.getElementById("rank-badge-text");
    DOM.levelIndicatorText = document.getElementById("level-indicator-text");
    DOM.xpValue = document.getElementById("xp-value");
    DOM.streakBadge = document.getElementById("hud-streak-badge");
    DOM.streakCount = document.getElementById("streak-count");

    DOM.bossTimerContainer = document.getElementById("boss-timer-container");
    DOM.bossTimerBar = document.getElementById("boss-timer-bar");
    DOM.bossTimerText = document.getElementById("boss-timer-text");
    DOM.gateMapBtn = document.getElementById("gate-map-btn");

    DOM.shopPotionBtn = document.getElementById("shop-potion-btn");
    DOM.shop5050Btn = document.getElementById("shop-5050-btn");
    DOM.shopSkipBtn = document.getElementById("shop-skip-btn");
    DOM.langToggle = document.getElementById("lang-toggle");
    DOM.langToggleLabel = document.getElementById("lang-toggle-label");
    DOM.audioToggle = document.getElementById("audio-toggle");
    DOM.audioToggleLabel = document.getElementById("audio-toggle-label");

    DOM.battleStage = document.getElementById("battle-stage");
    DOM.stageGateTitle = document.getElementById("stage-gate-title");
    DOM.shadowCompanionSlot = document.getElementById("shadow-companion-slot");
    DOM.shadowPetLabel = document.getElementById("shadow-pet-label");

    DOM.heroContainer = document.getElementById("hero-container");
    DOM.heroSvg = document.getElementById("hero-svg");
    DOM.heroShadowBuffBadge = document.getElementById("hero-shadow-buff-badge");
    DOM.heroHpTrail = document.getElementById("hero-hp-trail");
    DOM.heroHpFill = document.getElementById("hero-hp-fill");
    DOM.heroHpText = document.getElementById("hero-hp-text");

    DOM.enemyContainer = document.getElementById("enemy-container");
    DOM.enemyName = document.getElementById("enemy-name");
    DOM.enemyRankTag = document.getElementById("enemy-rank-tag");
    DOM.enemyHpTrail = document.getElementById("enemy-hp-trail");
    DOM.enemyHpFill = document.getElementById("enemy-hp-fill");
    DOM.enemyHpText = document.getElementById("enemy-hp-text");

    DOM.attackModeBadge = document.getElementById("attack-mode-badge");
    DOM.combatKeybindHint = document.getElementById("combat-keybind-hint");
    DOM.questionText = document.getElementById("question-text");
    DOM.codeLineNumbers = document.getElementById("code-line-numbers");
    DOM.codeSnippetContent = document.getElementById("code-snippet-content");

    DOM.optionsGrid = document.getElementById("options-grid");
    DOM.optionBtns = Array.from(document.querySelectorAll(".option-btn"));
    DOM.terminalInputZone = document.getElementById("terminal-input-zone");
    DOM.liveCodeInput = document.getElementById("live-code-input");
    DOM.executeCodeBtn = document.getElementById("execute-code-btn");

    DOM.feedbackDrawer = document.getElementById("feedback-drawer");
    DOM.feedbackStatusTitle = document.getElementById("feedback-status-title");
    DOM.feedbackExplanationText = document.getElementById("feedback-explanation-text");
    DOM.nextStrikeBtn = document.getElementById("next-strike-btn");

    DOM.classSelectModal = document.getElementById("class-select-modal");
    DOM.classCards = Array.from(document.querySelectorAll(".hunter-class-card"));
    DOM.gateLevelsGrid = document.getElementById("gate-levels-grid");
    DOM.startGateBtn = document.getElementById("start-gate-btn");

    DOM.bossWarningOverlay = document.getElementById("boss-warning-overlay");
    DOM.bossWarningName = document.getElementById("boss-warning-name");

    DOM.ariseModal = document.getElementById("arise-modal");
    DOM.ariseBuffDesc = document.getElementById("arise-buff-desc");
    DOM.ariseExtractBtn = document.getElementById("arise-extract-btn");

    DOM.resultModal = document.getElementById("result-modal");
    DOM.resultTitle = document.getElementById("result-title");
    DOM.resultSubtitle = document.getElementById("result-subtitle");
    DOM.resultXpEarned = document.getElementById("result-xp-earned");
    DOM.resultStreakMax = document.getElementById("result-streak-max");
    DOM.resultRankStatus = document.getElementById("result-rank-status");
    DOM.resultAccuracy = document.getElementById("result-accuracy");
    DOM.resultNextBtn = document.getElementById("result-next-btn");
    DOM.resultRetryBtn = document.getElementById("result-retry-btn");
    DOM.resultClassBtn = document.getElementById("result-class-btn");
  }

  /* ========================================================================
     HELPERS & RANK CALCULATION
     ======================================================================== */
  function getActiveClassData() {
    return window.PYQUEST_DATA.CLASSES[GameState.currentClass];
  }

  function getActiveLevelData() {
    const cls = getActiveClassData();
    return cls.levels[GameState.currentLevel - 1] || cls.levels[0];
  }

  function getCurrentRankObj() {
    const ranks = window.PYQUEST_DATA.HUNTER_RANKS;
    let current = ranks[0];
    for (const r of ranks) {
      if (GameState.xp >= r.minXP) current = r;
    }
    return current;
  }

  function hasActiveShadowBuff() {
    return (
      GameState.extractedShadows[GameState.currentClass] ||
      GameState.extractedShadows.python ||
      GameState.extractedShadows.javascript ||
      GameState.extractedShadows.cpp
    );
  }

  function getUnitCenter(el) {
    if (!el) return { x: window.innerWidth * 0.5, y: window.innerHeight * 0.4 };
    const rect = el.getBoundingClientRect();
    const stageRect = DOM.battleStage
      ? DOM.battleStage.getBoundingClientRect()
      : { left: 0, top: 0 };
    return {
      x: rect.left - stageRect.left + rect.width * 0.5,
      y: rect.top - stageRect.top + rect.height * 0.5,
    };
  }

  /* ========================================================================
     HUD, HP BARS & STREAK AURA UPDATES
     ======================================================================== */
  function updateHUD() {
    const cls = getActiveClassData();
    const lvl = getActiveLevelData();
    const rankObj = getCurrentRankObj();

    if (DOM.hudClassIcon) DOM.hudClassIcon.textContent = cls.icon;
    if (DOM.hudClassName) DOM.hudClassName.textContent = cls.name;
    if (DOM.rankBadgeText) DOM.rankBadgeText.textContent = rankObj.badge;
    if (DOM.levelIndicatorText) {
      DOM.levelIndicatorText.textContent = `GATE ${String(lvl.level).padStart(2, "0")} / 10`;
    }
    if (DOM.xpValue) DOM.xpValue.textContent = String(GameState.xp);
    if (DOM.streakCount) DOM.streakCount.textContent = `🔥 ${GameState.streak}`;

    // Awakened Shadow Monarch Aura when Streak >= 3
    if (GameState.streak >= 3) {
      DOM.heroContainer?.classList.add("awakened-aura");
      DOM.streakBadge?.classList.add("streak-hot");
    } else {
      DOM.heroContainer?.classList.remove("awakened-aura");
      DOM.streakBadge?.classList.remove("streak-hot");
    }

    // Shadow Companion Slot visibility
    if (hasActiveShadowBuff()) {
      DOM.shadowCompanionSlot?.classList.add("shadow-active");
      if (DOM.shadowPetLabel) DOM.shadowPetLabel.textContent = cls.shadowBuffText;
      if (DOM.heroShadowBuffBadge) DOM.heroShadowBuffBadge.textContent = "👻 SHADOW ARMY BUFF";
    } else {
      DOM.shadowCompanionSlot?.classList.remove("shadow-active");
      if (DOM.heroShadowBuffBadge) DOM.heroShadowBuffBadge.textContent = "⚡ MONARCH CORE";
    }

    // Update Shop Button Disabled States
    if (DOM.shopPotionBtn) {
      DOM.shopPotionBtn.disabled = GameState.xp < 15 || GameState.heroHP >= GameState.heroMaxHP;
    }
    if (DOM.shop5050Btn) {
      DOM.shop5050Btn.disabled =
        GameState.xp < 10 ||
        GameState.fiftyFiftyUsed ||
        lvl.mode === "ultimate" ||
        GameState.awaitingNext;
    }
    if (DOM.shopSkipBtn) {
      DOM.shopSkipBtn.disabled = GameState.xp < 2 || GameState.awaitingNext;
    }
  }

  function updateHPBars() {
    const heroPct = Math.max(0, Math.min(100, (GameState.heroHP / GameState.heroMaxHP) * 100));
    const enemyPct = Math.max(0, Math.min(100, (GameState.enemyHP / GameState.enemyMaxHP) * 100));

    if (DOM.heroHpFill) DOM.heroHpFill.style.width = `${heroPct}%`;
    setTimeout(() => {
      if (DOM.heroHpTrail) DOM.heroHpTrail.style.width = `${heroPct}%`;
    }, 180);
    if (DOM.heroHpText) {
      DOM.heroHpText.textContent = `${Math.ceil(GameState.heroHP)}/${GameState.heroMaxHP} HP`;
    }

    if (DOM.enemyHpFill) DOM.enemyHpFill.style.width = `${enemyPct}%`;
    setTimeout(() => {
      if (DOM.enemyHpTrail) DOM.enemyHpTrail.style.width = `${enemyPct}%`;
    }, 180);
    if (DOM.enemyHpText) {
      DOM.enemyHpText.textContent = `${Math.ceil(GameState.enemyHP)}/${GameState.enemyMaxHP} HP`;
    }
  }

  /* ========================================================================
     15s COUNTDOWN TIMER
     ======================================================================== */
  function startCombatTimer() {
    stopCombatTimer();
    const bonusSeconds = hasActiveShadowBuff() ? 5.0 : 0.0;
    GameState.timerMax = 15.0 + bonusSeconds;
    GameState.timerSeconds = GameState.timerMax;
    renderTimerBar();

    GameState.timerInterval = setInterval(() => {
      if (GameState.awaitingNext) return;
      GameState.timerSeconds = Math.max(0, GameState.timerSeconds - 0.1);
      renderTimerBar();

      if (GameState.timerSeconds <= 0) {
        stopCombatTimer();
        handleTimeExpired();
      }
    }, 100);
  }

  function stopCombatTimer() {
    if (GameState.timerInterval) {
      clearInterval(GameState.timerInterval);
      GameState.timerInterval = null;
    }
  }

  function renderTimerBar() {
    const pct = Math.max(0, Math.min(100, (GameState.timerSeconds / GameState.timerMax) * 100));
    if (DOM.bossTimerBar) DOM.bossTimerBar.style.width = `${pct}%`;
    if (DOM.bossTimerText) DOM.bossTimerText.textContent = `${GameState.timerSeconds.toFixed(1)}s`;
  }

  function handleTimeExpired() {
    const lvl = getActiveLevelData();
    const msg =
      GameState.lang === "ur"
        ? `Waqt khatam! ${lvl.enemyName} ne counter-attack kar diya! Sahi jawab: ${
            lvl.mode === "ultimate" ? lvl.hint : lvl.options[lvl.correctIndex]
          }`
        : `Time expired! ${lvl.enemyName} unleashed a counter-strike! Correct answer: ${
            lvl.mode === "ultimate" ? lvl.hint : lvl.options[lvl.correctIndex]
          }`;
    executeEnemyCounterHit(msg);
  }

  /* ========================================================================
     LOAD LEVEL / GATE INTO BATTLE STAGE & COMBAT DECK
     ======================================================================== */
  function loadGateLevel(levelNum, showBossAlert = true) {
    const cls = getActiveClassData();
    GameState.currentLevel = Math.max(1, Math.min(cls.levels.length, levelNum));
    const lvl = getActiveLevelData();

    GameState.awaitingNext = false;
    GameState.fiftyFiftyUsed = false;
    GameState.heroHP = GameState.heroMaxHP;
    GameState.enemyMaxHP = lvl.isBoss ? 200 : 100;
    GameState.enemyHP = GameState.enemyMaxHP;
    GameState.attemptsInGate = 0;
    GameState.correctInGate = 0;
    GameState.maxStreakInGate = GameState.streak;

    // Close feedback drawer & modals
    DOM.feedbackDrawer?.classList.remove("drawer-open", "feedback-wrong");
    DOM.resultModal?.classList.add("hidden");
    DOM.ariseModal?.classList.add("hidden");

    // Stage Banner & Enemy Setup
    if (DOM.stageGateTitle) {
      DOM.stageGateTitle.textContent = `DUNGEON GATE ${String(lvl.level).padStart(
        2,
        "0"
      )} // ${lvl.gateRank.toUpperCase()} — ${cls.name}`;
    }
    if (DOM.enemyName) DOM.enemyName.textContent = lvl.enemyName;
    if (DOM.enemyRankTag) DOM.enemyRankTag.textContent = lvl.gateRank.toUpperCase();

    // S-Rank Boss Scale & Warning Overlay
    if (lvl.isBoss) {
      DOM.enemyContainer?.classList.add("boss-scale");
      if (showBossAlert && DOM.bossWarningOverlay) {
        if (DOM.bossWarningName) {
          DOM.bossWarningName.textContent = `${lvl.enemyName} HAS ENTERED THE RED GATE`;
        }
        DOM.bossWarningOverlay.classList.remove("hidden");
        window.PyQuestAudio?.playBossSiren();
        setTimeout(() => {
          DOM.bossWarningOverlay?.classList.add("hidden");
        }, 2100);
      }
    } else {
      DOM.enemyContainer?.classList.remove("boss-scale");
      DOM.bossWarningOverlay?.classList.add("hidden");
    }

    renderQuestionDeck();
    updateHPBars();
    updateHUD();
    startCombatTimer();
  }

  function renderQuestionDeck() {
    const lvl = getActiveLevelData();

    // Attack Mode Badge
    DOM.attackModeBadge?.classList.remove("mode-heavy", "mode-ultimate");
    if (lvl.mode === "light") {
      if (DOM.attackModeBadge) DOM.attackModeBadge.textContent = "⚡ LIGHT ATTACK: QUICK MCQ";
      if (DOM.combatKeybindHint) {
        DOM.combatKeybindHint.textContent = "KEYS [A] [B] [C] [D] OR CLICK TO STRIKE";
      }
    } else if (lvl.mode === "heavy") {
      DOM.attackModeBadge?.classList.add("mode-heavy");
      if (DOM.attackModeBadge) DOM.attackModeBadge.textContent = "🔥 HEAVY ATTACK: BUG BREAKER";
      if (DOM.combatKeybindHint) {
        DOM.combatKeybindHint.textContent = "ANALYZE THE BUG & SELECT THE FIX [A-D]";
      }
    } else {
      DOM.attackModeBadge?.classList.add("mode-ultimate");
      if (DOM.attackModeBadge) {
        DOM.attackModeBadge.textContent = "🌌 ULTIMATE SKILL: LIVE CODE TERMINAL";
      }
      if (DOM.combatKeybindHint) {
        DOM.combatKeybindHint.textContent = `HINT: ${lvl.hint} — PRESS ENTER TO SLASH`;
      }
    }

    // Bilingual Prompt
    if (DOM.questionText) {
      DOM.questionText.textContent = lvl.prompt[GameState.lang] || lvl.prompt.en;
    }

    // Code Snippet & Line Numbers
    const lines = lvl.code.split("\n");
    if (DOM.codeLineNumbers) {
      DOM.codeLineNumbers.textContent = lines.map((_, i) => i + 1).join("\n");
    }
    if (DOM.codeSnippetContent) {
      DOM.codeSnippetContent.textContent = lvl.code;
    }

    // Switch between MCQ Grid and Live Terminal Input
    if (lvl.mode === "ultimate") {
      DOM.optionsGrid?.classList.add("hidden");
      DOM.terminalInputZone?.classList.remove("hidden");
      if (DOM.liveCodeInput) {
        DOM.liveCodeInput.value = "";
        DOM.liveCodeInput.placeholder =
          GameState.lang === "ur"
            ? `Code likhein (Maslan: ${lvl.hint})...`
            : `Type code to cast Ultimate Slash (e.g. ${lvl.hint})...`;
        setTimeout(() => DOM.liveCodeInput?.focus(), 60);
      }
    } else {
      DOM.terminalInputZone?.classList.add("hidden");
      DOM.optionsGrid?.classList.remove("hidden");
      const letters = ["[A]", "[B]", "[C]", "[D]"];
      DOM.optionBtns.forEach((btn, idx) => {
        btn.disabled = false;
        btn.classList.remove("option-correct", "option-wrong", "option-eliminated");
        const badge = btn.querySelector(".keybind-badge");
        const txt = btn.querySelector(".option-text");
        if (badge) badge.textContent = letters[idx];
        if (txt) txt.textContent = lvl.options[idx] || "";
      });
    }
  }

  /* ========================================================================
     COMBAT RESOLUTION: HERO DASH SLASH vs ENEMY COUNTER-LUNGE
     ======================================================================== */
  function handleOptionSelect(selectedIndex) {
    if (GameState.awaitingNext) return;
    const lvl = getActiveLevelData();
    if (lvl.mode === "ultimate") return;

    GameState.attemptsInGate++;
    stopCombatTimer();

    const chosenBtn = DOM.optionBtns[selectedIndex];
    if (selectedIndex === lvl.correctIndex) {
      chosenBtn?.classList.add("option-correct");
      executeHeroSlashSuccess();
    } else {
      chosenBtn?.classList.add("option-wrong");
      DOM.optionBtns[lvl.correctIndex]?.classList.add("option-correct");
      executeEnemyCounterHit(lvl.explain[GameState.lang] || lvl.explain.en);
    }
  }

  function handleTerminalExecute() {
    if (GameState.awaitingNext) return;
    const lvl = getActiveLevelData();
    if (lvl.mode !== "ultimate") return;

    const rawInput = (DOM.liveCodeInput?.value || "").trim();
    if (!rawInput) return;

    GameState.attemptsInGate++;
    stopCombatTimer();

    const normalized = rawInput.replace(/\s+/g, "");
    const isMatch = (lvl.acceptedAnswers || []).some(
      (ans) => ans.replace(/\s+/g, "") === normalized
    );

    if (isMatch) {
      executeHeroSlashSuccess();
    } else {
      const explainText =
        (lvl.explain[GameState.lang] || lvl.explain.en) +
        ` [Expected: ${lvl.hint}]`;
      executeEnemyCounterHit(explainText);
    }
  }

  function executeHeroSlashSuccess() {
    const lvl = getActiveLevelData();
    GameState.awaitingNext = true;
    GameState.correctInGate++;
    GameState.streak++;
    if (GameState.streak > GameState.maxStreakInGate) {
      GameState.maxStreakInGate = GameState.streak;
    }

    // Calculate XP & Damage
    const baseXP = lvl.isBoss ? 80 : lvl.mode === "ultimate" ? 45 : lvl.mode === "heavy" ? 35 : 25;
    const streakBonus = GameState.streak >= 3 ? 15 : 0;
    const shadowMult = hasActiveShadowBuff() ? 1.15 : 1.0;
    const earnedXP = Math.round((baseXP + streakBonus) * shadowMult);
    GameState.xp += earnedXP;

    // Deal lethal damage to Enemy for this gate
    const dmgDealt = GameState.enemyHP;
    GameState.enemyHP = 0;

    // Trigger Camera Zoom, Hero Diagonal Dash & Katana Swing CSS Classes
    DOM.battleStage?.classList.add("cam-zoom-slash");
    DOM.heroContainer?.classList.add("hero-dash-attack");
    DOM.heroSvg?.classList.add("slash-swing");

    // Audio & 60FPS Canvas VFX
    window.PyQuestAudio?.playSlash(lvl.mode);
    const heroPos = getUnitCenter(DOM.heroContainer);
    const enemyPos = getUnitCenter(DOM.enemyContainer);

    const slashColor =
      lvl.mode === "ultimate" ? "#c77dff" : GameState.streak >= 3 ? "#ffd60a" : "#00f3ff";

    window.PyQuestVFX?.triggerLightningBolt(
      heroPos.x,
      heroPos.y,
      enemyPos.x,
      enemyPos.y,
      slashColor
    );
    window.PyQuestVFX?.triggerSlash(
      enemyPos.x,
      enemyPos.y,
      slashColor,
      lvl.mode === "ultimate" || GameState.streak >= 3
    );
    window.PyQuestVFX?.spawnFloatingText(
      `⚡ -${dmgDealt} HP! (+${earnedXP} XP)`,
      enemyPos.x,
      enemyPos.y - 40,
      "#00f3ff",
      1.25
    );

    updateHPBars();
    updateHUD();

    setTimeout(() => {
      DOM.battleStage?.classList.remove("cam-zoom-slash");
      DOM.heroContainer?.classList.remove("hero-dash-attack");
      DOM.heroSvg?.classList.remove("slash-swing");
    }, 620);

    // Show System Explanation Drawer
    openFeedbackDrawer(true, lvl.explain[GameState.lang] || lvl.explain.en);
  }

  function executeEnemyCounterHit(explanationMsg) {
    GameState.awaitingNext = true;
    GameState.streak = 0;

    const counterDmg = 35;
    GameState.heroHP = Math.max(0, GameState.heroHP - counterDmg);

    // Enemy Counter-Lunge & Heavy Screen Shake + Crimson Flash
    DOM.enemyContainer?.classList.add("enemy-counter-lunge");
    document.body.classList.add("screen-shake-heavy");

    window.PyQuestAudio?.playDamageHit();
    const heroPos = getUnitCenter(DOM.heroContainer);
    const enemyPos = getUnitCenter(DOM.enemyContainer);

    window.PyQuestVFX?.triggerLightningBolt(
      enemyPos.x,
      enemyPos.y,
      heroPos.x,
      heroPos.y,
      "#ff1e42"
    );
    window.PyQuestVFX?.spawnExplosion(heroPos.x, heroPos.y, "#ff1e42", 30);
    window.PyQuestVFX?.spawnFloatingText(
      `💥 -${counterDmg} HP COUNTER!`,
      heroPos.x,
      heroPos.y - 35,
      "#ff1e42",
      1.2
    );

    updateHPBars();
    updateHUD();

    setTimeout(() => {
      DOM.enemyContainer?.classList.remove("enemy-counter-lunge");
      document.body.classList.remove("screen-shake-heavy");
    }, 580);

    openFeedbackDrawer(false, explanationMsg);
  }

  function openFeedbackDrawer(isSuccess, explanationText) {
    if (!DOM.feedbackDrawer) return;
    DOM.feedbackDrawer.classList.remove("feedback-wrong");
    if (!isSuccess) {
      DOM.feedbackDrawer.classList.add("feedback-wrong");
    }

    if (DOM.feedbackStatusTitle) {
      if (isSuccess) {
        DOM.feedbackStatusTitle.textContent =
          GameState.lang === "ur"
            ? "⚡ CRITICAL HIT // SYSTEM EXPLANATION"
            : "⚡ CRITICAL HIT // SYSTEM ANALYSIS";
      } else {
        DOM.feedbackStatusTitle.textContent =
          GameState.lang === "ur"
            ? "🚨 COUNTER DAMAGE TAKEN // BUG DETECTED"
            : "🚨 COUNTER DAMAGE TAKEN // SYSTEM DIAGNOSTIC";
      }
    }

    if (DOM.feedbackExplanationText) {
      DOM.feedbackExplanationText.textContent = explanationText;
    }

    DOM.feedbackDrawer.classList.add("drawer-open");
  }

  function handleNextStrikeClick() {
    DOM.feedbackDrawer?.classList.remove("drawer-open", "feedback-wrong");
    const lvl = getActiveLevelData();

    // Check if Enemy was defeated
    if (GameState.enemyHP <= 0) {
      if (lvl.isBoss && !GameState.extractedShadows[GameState.currentClass]) {
        openAriseModal();
      } else {
        openResultModal(true);
      }
      return;
    }

    // Check if Hero HP reached 0
    if (GameState.heroHP <= 0) {
      openResultModal(false);
      return;
    }

    // Otherwise let the player retry the strike in the current gate
    GameState.awaitingNext = false;
    renderQuestionDeck();
    updateHUD();
    startCombatTimer();
  }

  /* ========================================================================
     IN-BATTLE HUNTER SHOP (POTION, SHADOW 50/50, DODGE/SKIP)
     ======================================================================== */
  function usePotionShop() {
    if (GameState.xp < 15 || GameState.heroHP >= GameState.heroMaxHP) return;
    GameState.xp -= 15;
    const healAmount = Math.round(GameState.heroMaxHP * 0.3);
    GameState.heroHP = Math.min(GameState.heroMaxHP, GameState.heroHP + healAmount);

    window.PyQuestAudio?.playHeal();
    const heroPos = getUnitCenter(DOM.heroContainer);
    window.PyQuestVFX?.spawnExplosion(heroPos.x, heroPos.y, "#00f59b", 26);
    window.PyQuestVFX?.spawnFloatingText(
      `🧪 +${healAmount} HP HEALED!`,
      heroPos.x,
      heroPos.y - 40,
      "#00f59b",
      1.15
    );

    updateHPBars();
    updateHUD();
  }

  function useShadow5050Shop() {
    const lvl = getActiveLevelData();
    if (
      GameState.xp < 10 ||
      GameState.fiftyFiftyUsed ||
      lvl.mode === "ultimate" ||
      GameState.awaitingNext
    ) {
      return;
    }
    GameState.xp -= 10;
    GameState.fiftyFiftyUsed = true;

    const wrongIndices = [0, 1, 2, 3].filter((i) => i !== lvl.correctIndex);
    // Shuffle and eliminate 2 wrong answers
    wrongIndices.sort(() => Math.random() - 0.5);
    const toEliminate = wrongIndices.slice(0, 2);

    toEliminate.forEach((idx) => {
      const btn = DOM.optionBtns[idx];
      if (btn) {
        btn.disabled = true;
        btn.classList.add("option-eliminated");
      }
    });

    window.PyQuestAudio?.playClick();
    const enemyPos = getUnitCenter(DOM.enemyContainer);
    window.PyQuestVFX?.spawnExplosion(enemyPos.x, enemyPos.y, "#9d4edd", 22);
    window.PyQuestVFX?.spawnFloatingText(
      "👁️ SHADOW 50/50 ACTIVATED!",
      enemyPos.x,
      enemyPos.y - 30,
      "#c77dff",
      1.1
    );

    updateHUD();
  }

  function useDodgeSkipShop() {
    if (GameState.xp < 2 || GameState.awaitingNext) return;
    GameState.xp -= 2;
    stopCombatTimer();

    window.PyQuestAudio?.playClick();
    const heroPos = getUnitCenter(DOM.heroContainer);
    window.PyQuestVFX?.spawnExplosion(heroPos.x, heroPos.y, "#00f3ff", 20);
    window.PyQuestVFX?.spawnFloatingText(
      "⏭️ SHADOW STEP DODGE!",
      heroPos.x,
      heroPos.y - 35,
      "#00f3ff",
      1.15
    );

    const nextLvl = GameState.currentLevel < 10 ? GameState.currentLevel + 1 : 1;
    loadGateLevel(nextLvl, true);
  }

  /* ========================================================================
     MODALS: CLASS/GATE SELECT, ARISE EXTRACTION & VICTORY/DEFEAT
     ======================================================================== */
  function renderGateGridInModal() {
    if (!DOM.gateLevelsGrid) return;
    const cls = getActiveClassData();
    DOM.gateLevelsGrid.innerHTML = "";

    cls.levels.forEach((lvl) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "gate-level-btn";
      if (lvl.level === GameState.currentLevel) btn.classList.add("gate-active");
      if (lvl.isBoss) btn.classList.add("gate-boss");

      const titleSpan = document.createElement("span");
      titleSpan.textContent = lvl.isBoss
        ? `🔥 GATE ${lvl.level}`
        : `GATE ${String(lvl.level).padStart(2, "0")}`;

      const subSmall = document.createElement("small");
      subSmall.textContent = lvl.gateRank;

      btn.appendChild(titleSpan);
      btn.appendChild(subSmall);

      btn.addEventListener("click", () => {
        window.PyQuestAudio?.playClick();
        GameState.currentLevel = lvl.level;
        renderGateGridInModal();
      });

      DOM.gateLevelsGrid.appendChild(btn);
    });
  }

  function openClassSelectModal() {
    stopCombatTimer();
    DOM.classCards.forEach((card) => {
      card.classList.toggle("selected", card.dataset.class === GameState.currentClass);
    });
    renderGateGridInModal();
    DOM.classSelectModal?.classList.remove("hidden");
  }

  function openAriseModal() {
    stopCombatTimer();
    const cls = getActiveClassData();
    if (DOM.ariseBuffDesc) {
      DOM.ariseBuffDesc.textContent = `SHADOW EXTRACTION: ${cls.shadowBossName} (${cls.shadowBuffText})`;
    }
    window.PyQuestAudio?.playArise();
    DOM.ariseModal?.classList.remove("hidden");
  }

  function handleAriseExtract() {
    const cls = getActiveClassData();
    GameState.extractedShadows[GameState.currentClass] = true;
    GameState.xp += 100;

    window.PyQuestAudio?.playArise();
    const heroPos = getUnitCenter(DOM.heroContainer);
    window.PyQuestVFX?.spawnExplosion(heroPos.x - 40, heroPos.y, "#9d4edd", 50);
    window.PyQuestVFX?.spawnFloatingText(
      `👻 ARISE! ${cls.shadowBossName} JOINED!`,
      heroPos.x,
      heroPos.y - 50,
      "#c77dff",
      1.3
    );

    DOM.ariseModal?.classList.add("hidden");
    updateHUD();
    openResultModal(true);
  }

  function openResultModal(isVictory) {
    stopCombatTimer();
    const rankObj = getCurrentRankObj();
    const accuracy =
      GameState.attemptsInGate > 0
        ? Math.round((GameState.correctInGate / GameState.attemptsInGate) * 100)
        : 100;

    if (isVictory) {
      window.PyQuestAudio?.playVictory();
      if (DOM.resultTitle) {
        DOM.resultTitle.textContent =
          GameState.currentLevel === 10
            ? "👑 S-RANK RED GATE CONQUERED!"
            : "🏆 DUNGEON GATE CLEARED!";
      }
      if (DOM.resultSubtitle) {
        DOM.resultSubtitle.textContent =
          GameState.lang === "ur"
            ? "System Evaluation Complete — Hunter Rank aur XP update ho gaye!"
            : "System Evaluation Complete — Hunter Rank Progress Updated";
      }
    } else {
      window.PyQuestAudio?.playDefeat();
      if (DOM.resultTitle) DOM.resultTitle.textContent = "💀 SYSTEM ALERT: HUNTER DOWN";
      if (DOM.resultSubtitle) {
        DOM.resultSubtitle.textContent =
          GameState.lang === "ur"
            ? "Vitality khatam ho gayi! Dobara koshish karein."
            : "Hunter vitality depleted! Re-enter the gate and strike again.";
      }
    }

    if (DOM.resultXpEarned) DOM.resultXpEarned.textContent = `${GameState.xp} XP`;
    if (DOM.resultStreakMax) DOM.resultStreakMax.textContent = `🔥 ${GameState.maxStreakInGate}`;
    if (DOM.resultRankStatus) DOM.resultRankStatus.textContent = rankObj.short;
    if (DOM.resultAccuracy) DOM.resultAccuracy.textContent = `${accuracy}%`;

    DOM.resultModal?.classList.remove("hidden");
  }

  /* ========================================================================
     EVENT LISTENERS & KEYBOARD SHORTCUTS
     ======================================================================== */
  function bindEvents() {
    // MCQ Option Buttons
    DOM.optionBtns.forEach((btn, idx) => {
      btn.addEventListener("click", () => handleOptionSelect(idx));
    });

    // Live Code Terminal Execute
    DOM.executeCodeBtn?.addEventListener("click", () => handleTerminalExecute());
    DOM.liveCodeInput?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleTerminalExecute();
      }
    });

    // Feedback Drawer Next Strike
    DOM.nextStrikeBtn?.addEventListener("click", () => handleNextStrikeClick());

    // In-Battle Hunter Shop
    DOM.shopPotionBtn?.addEventListener("click", () => usePotionShop());
    DOM.shop5050Btn?.addEventListener("click", () => useShadow5050Shop());
    DOM.shopSkipBtn?.addEventListener("click", () => useDodgeSkipShop());

    // Bilingual 1-Click Toggle (Roman Urdu / English)
    DOM.langToggle?.addEventListener("click", () => {
      window.PyQuestAudio?.playClick();
      GameState.lang = GameState.lang === "en" ? "ur" : "en";
      if (DOM.langToggle) DOM.langToggle.dataset.lang = GameState.lang;
      if (DOM.langToggleLabel) {
        DOM.langToggleLabel.textContent =
          GameState.lang === "ur" ? "🇵🇰 Roman Urdu" : "🇬🇧 English";
      }
      const lvl = getActiveLevelData();
      if (DOM.questionText) {
        DOM.questionText.textContent = lvl.prompt[GameState.lang] || lvl.prompt.en;
      }
      if (DOM.feedbackExplanationText && DOM.feedbackDrawer?.classList.contains("drawer-open")) {
        DOM.feedbackExplanationText.textContent = lvl.explain[GameState.lang] || lvl.explain.en;
      }
    });

    // Audio Synth Toggle
    DOM.audioToggle?.addEventListener("click", () => {
      const muted = window.PyQuestAudio?.toggleMute();
      if (DOM.audioToggle) DOM.audioToggle.dataset.muted = String(muted);
      if (DOM.audioToggleLabel) {
        DOM.audioToggleLabel.textContent = muted ? "🔇 MUTE" : "🔊 SFX/BGM ON";
      }
    });

    // Dungeon Gate Map Modal
    DOM.gateMapBtn?.addEventListener("click", () => {
      window.PyQuestAudio?.playClick();
      openClassSelectModal();
    });

    DOM.classCards.forEach((card) => {
      card.addEventListener("click", () => {
        window.PyQuestAudio?.playClick();
        const chosenClass = card.dataset.class || "python";
        GameState.currentClass = chosenClass;
        DOM.classCards.forEach((c) => c.classList.toggle("selected", c === card));
        renderGateGridInModal();
      });
    });

    DOM.startGateBtn?.addEventListener("click", () => {
      window.PyQuestAudio?.playClick();
      DOM.classSelectModal?.classList.add("hidden");
      loadGateLevel(GameState.currentLevel, true);
    });

    // ARISE Extraction Button
    DOM.ariseExtractBtn?.addEventListener("click", () => handleAriseExtract());

    // Result Modal Buttons
    DOM.resultNextBtn?.addEventListener("click", () => {
      window.PyQuestAudio?.playClick();
      DOM.resultModal?.classList.add("hidden");
      const nextLvl = GameState.currentLevel < 10 ? GameState.currentLevel + 1 : 1;
      loadGateLevel(nextLvl, true);
    });

    DOM.resultRetryBtn?.addEventListener("click", () => {
      window.PyQuestAudio?.playClick();
      DOM.resultModal?.classList.add("hidden");
      loadGateLevel(GameState.currentLevel, false);
    });

    DOM.resultClassBtn?.addEventListener("click", () => {
      window.PyQuestAudio?.playClick();
      DOM.resultModal?.classList.add("hidden");
      openClassSelectModal();
    });

    // Global Keyboard Shortcuts ([A-D] for MCQ, Enter for Next Strike)
    window.addEventListener("keydown", (e) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === "input" || activeTag === "textarea") return;

      if (GameState.awaitingNext && e.key === "Enter") {
        e.preventDefault();
        handleNextStrikeClick();
        return;
      }

      if (!GameState.awaitingNext) {
        const key = e.key.toUpperCase();
        const map = { A: 0, B: 1, C: 2, D: 3, "1": 0, "2": 1, "3": 2, "4": 3 };
        if (key in map) {
          const idx = map[key];
          const btn = DOM.optionBtns[idx];
          if (btn && !btn.disabled && !DOM.optionsGrid?.classList.contains("hidden")) {
            handleOptionSelect(idx);
          }
        }
      }
    });
  }

  /* ========================================================================
     BOOT GAME ENGINE
     ======================================================================== */
  function initGame() {
    cacheDOM();
    window.PyQuestVFX?.init();
    bindEvents();
    loadGateLevel(1, false);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initGame);
  } else {
    initGame();
  }
})();
