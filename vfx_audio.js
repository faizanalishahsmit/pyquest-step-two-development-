/* ==========================================================================
   PYQUEST: SOLO CODE LEVELING (AAA+ EDITION)
   File 3/5: vfx_audio.js — 60FPS Canvas Anime VFX Engine & Web Audio Synth
   100% Offline Zero-Dependency HTML5 <canvas> 2D + Web Audio API Singleton
   ========================================================================== */

(function () {
  "use strict";

  if (window.VFXAudio && window.VFXAudio.__initializedSingleton) {
    return;
  }

  /* ========================================================================
     MATH & COLOR UTILITIES
     ======================================================================== */
  const TAU = Math.PI * 2;

  function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  }

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function pick(arr) {
    return arr[(Math.random() * arr.length) | 0];
  }

  function midiToFreq(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  /* ========================================================================
     MAIN SINGLETON CONTROLLER: VFXAudioSystem
     ======================================================================== */
  class VFXAudioSystem {
    constructor() {
      this.__initializedSingleton = true;
      this.domBound = false;
      this.loopRunning = false;
      this.lastFrameTime = 0;

      // Canvas & Stage References
      this.canvas = null;
      this.ctx2d = null;
      this.battleStage = null;
      this.heroEl = null;
      this.enemyEl = null;
      this.audioToggleBtn = null;
      this.resizeObserver = null;
      this.bossClassObserver = null;

      this.width = window.innerWidth || 1280;
      this.height = window.innerHeight || 720;
      this.dpr = 1;

      // Atmosphere State
      this._bossMode = false;
      this.bossPulsePhase = 0;

      // Active 60FPS Visual Entity Pools
      this.ambientEmbers = [];
      this.slashes = [];
      this.sparks = [];
      this.debris = [];
      this.shockwaves = [];
      this.beams = [];
      this.lightningBolts = [];
      this.clawTears = [];
      this.glitchRects = [];
      this.manaRings = [];
      this.plusParticles = [];
      this.shadowEyeWaves = [];
      this.ariseVortices = [];
      this.screenFlashes = [];
      this.floatingTexts = [];
      this.scheduledTimers = [];

      // Floating Text Anti-Overlap Tracking
      this.recentTextStamp = { hero: 0, enemy: 0, center: 0 };
      this.recentTextStack = { hero: 0, enemy: 0, center: 0 };

      // Web Audio API State
      this.audioCtx = null;
      this.masterGain = null;
      this.compressor = null;
      this.sfxGain = null;
      this.bgmGain = null;
      this.whiteNoiseBuffer = null;
      this.crackleNoiseBuffer = null;
      this.distortionCurve = null;

      this.isMuted = false;
      this.audioUnlocked = false;

      // BGM Sequencer State
      this.bgmMode = null; // 'normal' | 'boss' | null
      this.desiredBGMMode = null;
      this.bgmSchedulerId = null;
      this.bgmNextNoteTime = 0;
      this.bgmStep = 0;

      // Click Guard so multiple listeners on #audio-toggle never double-flip
      this._buttonClickActive = false;
      this._buttonClickHandled = false;

      // Compatibility tracker for Step 1 engine.js
      this._lastCompatSlashMode = "light";
    }

    get bossMode() {
      return this._bossMode;
    }

    set bossMode(val) {
      this.setBossAtmosphere(Boolean(val));
    }

    /* ======================================================================
       INITIALIZATION, DOM BINDING & RESIZE
       ====================================================================== */
    init() {
      this.cacheDOM();
      this.setupCanvas();
      this.seedAmbientEmbers();
      this.bindGlobalUnlockAndToggle();
      this.observeEnemyBossState();

      if (!this.loopRunning) {
        this.loopRunning = true;
        this.lastFrameTime = performance.now();
        requestAnimationFrame((ts) => this.renderLoop(ts));
      }
    }

    cacheDOM() {
      this.canvas = document.getElementById("vfx-canvas");
      this.battleStage = document.getElementById("battle-stage");
      this.heroEl = document.getElementById("hero-container");
      this.enemyEl = document.getElementById("enemy-container");
      this.audioToggleBtn = document.getElementById("audio-toggle");
    }

    setupCanvas() {
      if (!this.canvas) return;
      this.ctx2d = this.canvas.getContext("2d", { alpha: true });
      this.resizeCanvas();

      if (!this._windowResizeBound) {
        this._windowResizeBound = true;
        window.addEventListener("resize", () => this.resizeCanvas(), { passive: true });
      }

      if (typeof ResizeObserver !== "undefined" && this.battleStage && !this.resizeObserver) {
        this.resizeObserver = new ResizeObserver(() => this.resizeCanvas());
        this.resizeObserver.observe(this.battleStage);
      }
    }

    resizeCanvas() {
      if (!this.canvas || !this.ctx2d) return;
      const host = this.battleStage || this.canvas.parentElement;
      const cssW =
        (host && host.clientWidth) ||
        (host && host.getBoundingClientRect().width) ||
        window.innerWidth ||
        1280;
      const cssH =
        (host && host.clientHeight) ||
        (host && host.getBoundingClientRect().height) ||
        window.innerHeight ||
        720;

      this.dpr = clamp(window.devicePixelRatio || 1, 1, 2);
      this.width = Math.max(320, cssW);
      this.height = Math.max(200, cssH);

      const targetW = Math.round(this.width * this.dpr);
      const targetH = Math.round(this.height * this.dpr);

      if (this.canvas.width !== targetW || this.canvas.height !== targetH) {
        this.canvas.width = targetW;
        this.canvas.height = targetH;
      }
      this.ctx2d.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    }

    observeEnemyBossState() {
      if (typeof MutationObserver === "undefined" || !this.enemyEl || this.bossClassObserver) {
        return;
      }
      const syncFromClass = () => {
        if (!this.enemyEl) return;
        const hasBossScale = this.enemyEl.classList.contains("boss-scale");
        if (hasBossScale !== this._bossMode) {
          this.setBossAtmosphere(hasBossScale);
        }
      };
      syncFromClass();
      this.bossClassObserver = new MutationObserver(syncFromClass);
      this.bossClassObserver.observe(this.enemyEl, {
        attributes: true,
        attributeFilter: ["class"],
      });
    }

    bindGlobalUnlockAndToggle() {
      if (!this._unlockListenersBound) {
        this._unlockListenersBound = true;
        const unlockHandler = () => {
          this.unlockAudio();
        };
        window.addEventListener("pointerdown", unlockHandler, { passive: true, capture: true });
        window.addEventListener("click", unlockHandler, { passive: true, capture: true });
        window.addEventListener("keydown", unlockHandler, { passive: true, capture: true });
      }

      const btn = document.getElementById("audio-toggle");
      if (btn && !btn.dataset.vfxAudioBound) {
        btn.dataset.vfxAudioBound = "true";
        this.audioToggleBtn = btn;

        // Capture-phase guard ensures that even if engine.js also attaches a click
        // listener on #audio-toggle calling toggleMute(), a single click only flips once.
        btn.addEventListener(
          "click",
          () => {
            this._buttonClickActive = true;
            this._buttonClickHandled = false;
            this.toggleMute();
            setTimeout(() => {
              this._buttonClickActive = false;
              this._buttonClickHandled = false;
            }, 0);
          },
          true
        );

        this.syncMuteButtonUI();
      }
    }

    syncMuteButtonUI() {
      const btn = this.audioToggleBtn || document.getElementById("audio-toggle");
      if (!btn) return;
      this.audioToggleBtn = btn;

      const labelText = this.isMuted ? "🔇 MUTE" : "🔊 SFX/BGM ON";
      const innerSpan = btn.querySelector("#audio-toggle-label") || btn.querySelector("span");
      if (innerSpan) {
        innerSpan.textContent = labelText;
      } else {
        btn.textContent = labelText;
      }

      btn.dataset.muted = String(this.isMuted);
      btn.classList.toggle("muted", this.isMuted);
      btn.classList.toggle("audio-muted", this.isMuted);
      btn.setAttribute("aria-pressed", String(!this.isMuted));
    }

    /* ======================================================================
       STAGE COORDINATE RESOLVER (#hero-container, #enemy-container, center)
       ====================================================================== */
    getTargetPosition(targetType = "center", verticalRatio = 0.54) {
      if (targetType && typeof targetType === "object" && typeof targetType.x === "number") {
        return { x: targetType.x, y: targetType.y };
      }

      this.cacheDOM();
      const stage = this.battleStage || this.canvas;
      const stageRect = stage
        ? stage.getBoundingClientRect()
        : { left: 0, top: 0, width: this.width, height: this.height };

      const scaleX = stageRect.width > 0 ? stageRect.width / this.width : 1;
      const scaleY = stageRect.height > 0 ? stageRect.height / this.height : 1;

      const normalized = String(targetType || "center").toLowerCase();

      if (normalized === "hero") {
        if (this.heroEl) {
          const r = this.heroEl.getBoundingClientRect();
          if (r.width > 0 && r.height > 0) {
            return {
              x: (r.left - stageRect.left + r.width * 0.52) / scaleX,
              y: (r.top - stageRect.top + r.height * verticalRatio) / scaleY,
            };
          }
        }
        return { x: this.width * 0.19, y: this.height * 0.66 };
      }

      if (normalized === "enemy") {
        if (this.enemyEl) {
          const r = this.enemyEl.getBoundingClientRect();
          if (r.width > 0 && r.height > 0) {
            return {
              x: (r.left - stageRect.left + r.width * 0.5) / scaleX,
              y: (r.top - stageRect.top + r.height * verticalRatio) / scaleY,
            };
          }
        }
        return { x: this.width * 0.78, y: this.height * 0.38 };
      }

      return { x: this.width * 0.5, y: this.height * 0.48 };
    }

    scheduleEffect(delayMs, fn) {
      const id = setTimeout(() => {
        const idx = this.scheduledTimers.indexOf(id);
        if (idx !== -1) this.scheduledTimers.splice(idx, 1);
        fn();
      }, delayMs);
      this.scheduledTimers.push(id);
    }

    /* ======================================================================
       1. AMBIENT DUNGEON ATMOSPHERE (NORMAL MANA vs BOSS HELLFIRE)
       ====================================================================== */
    seedAmbientEmbers() {
      const count = 60;
      this.ambientEmbers = [];
      for (let i = 0; i < count; i++) {
        this.ambientEmbers.push(this.createAmbientEmber(true));
      }
    }

    createAmbientEmber(randomY = false) {
      const isBoss = this._bossMode;
      const normalPalette = ["#00f3ff", "#9d4edd", "#00f3ff", "#c77dff", "#38bdf8"];
      const bossPalette = ["#ff1e42", "#ff4d00", "#120208", "#ff003c", "#7a0019"];
      const color = isBoss ? pick(bossPalette) : pick(normalPalette);
      const isDarkCore = color === "#120208";

      return {
        x: rand(0, this.width),
        y: randomY ? rand(0, this.height) : rand(this.height * 0.68, this.height + 28),
        radius: isBoss ? rand(1.6, 4.4) : rand(1.3, 3.6),
        vy: isBoss ? rand(-2.25, -0.95) : rand(-1.05, -0.35),
        vxBase: isBoss ? rand(-0.55, 0.55) : rand(-0.28, 0.28),
        swayAmp: isBoss ? rand(0.45, 1.35) : rand(0.2, 0.65),
        swayFreq: rand(0.015, 0.045),
        phase: rand(0, TAU),
        alpha: rand(0.32, 0.88),
        color,
        rimColor: isDarkCore ? "#ff1e42" : null,
        shape: Math.random() < 0.38 ? "diamond" : "orb",
      };
    }

    setBossAtmosphere(isBoss) {
      const nextState = Boolean(isBoss);
      const changed = this._bossMode !== nextState;
      this._bossMode = nextState;

      if (changed && this.ambientEmbers.length > 0) {
        const normalPalette = ["#00f3ff", "#9d4edd", "#00f3ff", "#c77dff", "#38bdf8"];
        const bossPalette = ["#ff1e42", "#ff4d00", "#120208", "#ff003c", "#7a0019"];
        for (let i = 0; i < this.ambientEmbers.length; i++) {
          const e = this.ambientEmbers[i];
          const c = nextState ? pick(bossPalette) : pick(normalPalette);
          e.color = c;
          e.rimColor = c === "#120208" ? "#ff1e42" : null;
          e.vy = nextState ? rand(-2.25, -0.95) : rand(-1.05, -0.35);
          e.swayAmp = nextState ? rand(0.45, 1.35) : rand(0.2, 0.65);
        }
      }
    }

    /* ======================================================================
       2. ANIME SLASH & ATTACK VFX (light | heavy | ultimate | enemy_hit)
       ====================================================================== */
    triggerAttackVFX(type = "light") {
      if (!this.canvas) this.init();
      const mode = String(type || "light").toLowerCase();

      if (mode === "light") {
        this.spawnLightSlashVFX();
      } else if (mode === "heavy") {
        this.spawnHeavyCrossCleaveVFX();
      } else if (mode === "ultimate") {
        this.spawnUltimateMonarchVFX();
      } else if (mode === "enemy_hit" || mode === "enemy" || mode === "counter") {
        this.spawnEnemyCounterClawVFX();
      } else {
        this.spawnLightSlashVFX();
      }
    }

    spawnLightSlashVFX() {
      const target = this.getTargetPosition("enemy", 0.54);

      // High-speed diagonal glowing cyan crescent arc (#00f3ff)
      this.slashes.push({
        x: target.x,
        y: target.y,
        angle: -0.62,
        radius: 122,
        thickness: 15,
        arcSpan: 1.95,
        color: "#00f3ff",
        secondaryColor: "#7df9ff",
        coreColor: "#ffffff",
        life: 1.0,
        decay: 0.058,
        scaleVel: 0.018,
        scale: 0.88,
      });

      // Fast secondary glint streak along katana cut plane
      this.slashes.push({
        x: target.x + 6,
        y: target.y - 4,
        angle: -0.62,
        radius: 148,
        thickness: 5,
        arcSpan: 1.55,
        color: "#ffffff",
        secondaryColor: "#00f3ff",
        coreColor: "#ffffff",
        life: 0.9,
        decay: 0.075,
        scaleVel: 0.025,
        scale: 0.94,
      });

      // Brief white impact ring + cyan halo ring
      this.shockwaves.push({
        x: target.x,
        y: target.y,
        radius: 10,
        maxRadius: 118,
        lineWidth: 7,
        color: "#ffffff",
        glowColor: "#00f3ff",
        dashed: false,
        life: 1.0,
        decay: 0.072,
      });

      // 34 directional electric sparks along & around diagonal katana vector
      const slashDir = -0.62;
      for (let i = 0; i < 34; i++) {
        const alongCut = i < 22;
        const sign = i % 2 === 0 ? 1 : -1;
        const angle = alongCut
          ? slashDir + (sign === 1 ? 0 : Math.PI) + rand(-0.42, 0.42)
          : rand(0, TAU);
        const speed = alongCut ? rand(5.5, 14.5) : rand(3.0, 9.0);
        const offsetAlong = rand(-65, 65);
        this.sparks.push({
          x: target.x + Math.cos(slashDir) * offsetAlong,
          y: target.y + Math.sin(slashDir) * offsetAlong,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          drag: 0.92,
          gravity: 0.08,
          length: rand(10, 24),
          size: rand(2.0, 3.8),
          color: i % 3 === 0 ? "#ffffff" : i % 2 === 0 ? "#00f3ff" : "#7df9ff",
          life: 1.0,
          decay: rand(0.032, 0.055),
          electric: true,
        });
      }

      // Crisp mini electric arc crackles across enemy
      for (let b = 0; b < 3; b++) {
        this.spawnJaggedBolt(
          target.x + rand(-55, -15),
          target.y + rand(-45, 45),
          target.x + rand(15, 55),
          target.y + rand(-45, 45),
          "#00f3ff",
          7,
          0.085
        );
      }
    }

    spawnHeavyCrossCleaveVFX() {
      const target = this.getTargetPosition("enemy", 0.54);

      // Slash 1: Blazing Golden Cleave
      this.slashes.push({
        x: target.x,
        y: target.y,
        angle: -0.74,
        radius: 146,
        thickness: 20,
        arcSpan: 2.15,
        color: "#ffd60a",
        secondaryColor: "#ff9e00",
        coreColor: "#ffffff",
        life: 1.0,
        decay: 0.044,
        scaleVel: 0.016,
        scale: 0.85,
      });

      // Slash 2 (55ms stagger): Neon Magenta Counter-Diagonal X-Cleave
      this.scheduleEffect(55, () => {
        this.slashes.push({
          x: target.x,
          y: target.y,
          angle: 0.74,
          radius: 150,
          thickness: 20,
          arcSpan: 2.15,
          color: "#ff007f",
          secondaryColor: "#e040fb",
          coreColor: "#ffffff",
          life: 1.0,
          decay: 0.044,
          scaleVel: 0.016,
          scale: 0.85,
        });

        // Secondary magenta dashed shockwave
        this.shockwaves.push({
          x: target.x,
          y: target.y,
          radius: 18,
          maxRadius: 185,
          lineWidth: 5,
          color: "#ff007f",
          glowColor: "#e040fb",
          dashed: true,
          rotation: 0.4,
          life: 1.0,
          decay: 0.045,
        });
      });

      // Heavy golden outer shockwave ring
      this.shockwaves.push({
        x: target.x,
        y: target.y,
        radius: 14,
        maxRadius: 165,
        lineWidth: 10,
        color: "#ffd60a",
        glowColor: "#ff9e00",
        dashed: false,
        life: 1.0,
        decay: 0.042,
      });

      this.screenFlashes.push({
        color: "rgba(255, 214, 10, 0.16)",
        life: 1.0,
        decay: 0.11,
      });

      // 54 explosive angular debris shards + high-energy sparks
      const palette = ["#ffd60a", "#ff007f", "#ff9e00", "#e040fb", "#ffffff"];
      for (let i = 0; i < 54; i++) {
        const angle = rand(0, TAU);
        const speed = rand(3.2, 13.8);
        if (i < 32) {
          this.debris.push({
            x: target.x + rand(-14, 14),
            y: target.y + rand(-14, 14),
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - rand(0.5, 2.2),
            drag: 0.95,
            gravity: 0.22,
            size: rand(4.5, 10.5),
            rot: rand(0, TAU),
            vRot: rand(-0.26, 0.26),
            sides: i % 3 === 0 ? 3 : 4,
            color: pick(palette),
            life: 1.0,
            decay: rand(0.02, 0.036),
          });
        } else {
          this.sparks.push({
            x: target.x,
            y: target.y,
            vx: Math.cos(angle) * (speed * 1.15),
            vy: Math.sin(angle) * (speed * 1.15),
            drag: 0.93,
            gravity: 0.12,
            length: rand(12, 26),
            size: rand(2.4, 4.2),
            color: pick(palette),
            life: 1.0,
            decay: rand(0.026, 0.044),
            electric: false,
          });
        }
      }
    }

    spawnUltimateMonarchVFX() {
      const heroPos = this.getTargetPosition("hero", 0.5);
      const enemyPos = this.getTargetPosition("enemy", 0.52);

      // Extend beam past enemy to edge of screen for screen-spanning impact
      const dx = enemyPos.x - heroPos.x;
      const dy = enemyPos.y - heroPos.y;
      const dist = Math.hypot(dx, dy) || 1;
      const ux = dx / dist;
      const uy = dy / dist;
      const endX = enemyPos.x + ux * Math.max(this.width, 450);
      const endY = enemyPos.y + uy * Math.max(this.width, 450);

      // Phase 1: Dark Purple / Cyan Screen-Spanning Shadow Monarch Live-Code Beam
      this.beams.push({
        x1: heroPos.x + ux * 28,
        y1: heroPos.y + uy * 12,
        x2: endX,
        y2: endY,
        impactX: enemyPos.x,
        impactY: enemyPos.y,
        width: 58,
        outerColor: "#9d4edd",
        midColor: "#00f3ff",
        coreColor: "#10002b",
        rimColor: "#ffffff",
        phase: 0,
        life: 1.0,
        decay: 0.026,
      });

      // Coiling lightning arcs from Hero to Enemy
      for (let i = 0; i < 3; i++) {
        this.spawnJaggedBolt(
          heroPos.x + ux * 25,
          heroPos.y,
          enemyPos.x,
          enemyPos.y,
          i % 2 === 0 ? "#00f3ff" : "#c77dff",
          11,
          0.042
        );
      }

      this.screenFlashes.push({
        color: "rgba(157, 78, 221, 0.24)",
        life: 1.0,
        decay: 0.07,
      });

      // Phase 2: Rapid Dimensional Judgment Cuts around Enemy
      const cutCount = 8;
      for (let c = 0; c < cutCount; c++) {
        this.scheduleEffect(65 + c * 38, () => {
          const cutAngle = (c * Math.PI) / 4 + rand(-0.28, 0.28);
          const ox = enemyPos.x + rand(-52, 52);
          const oy = enemyPos.y + rand(-48, 48);
          const isCyan = c % 2 === 0;

          this.slashes.push({
            x: ox,
            y: oy,
            angle: cutAngle,
            radius: rand(125, 178),
            thickness: rand(11, 17),
            arcSpan: rand(1.9, 2.45),
            color: isCyan ? "#00f3ff" : "#c77dff",
            secondaryColor: "#7b2cbf",
            coreColor: c % 3 === 0 ? "#10002b" : "#ffffff",
            life: 1.0,
            decay: 0.052,
            scaleVel: 0.02,
            scale: 0.86,
          });

          this.spawnJaggedBolt(
            ox - Math.cos(cutAngle) * 85,
            oy - Math.sin(cutAngle) * 85,
            ox + Math.cos(cutAngle) * 85,
            oy + Math.sin(cutAngle) * 85,
            isCyan ? "#00f3ff" : "#9d4edd",
            6,
            0.09
          );
        });
      }

      // Phase 3: Massive Purple/Cyan Shockwave Nova
      this.scheduleEffect(250, () => {
        this.shockwaves.push({
          x: enemyPos.x,
          y: enemyPos.y,
          radius: 16,
          maxRadius: 280,
          lineWidth: 14,
          color: "#9d4edd",
          glowColor: "#c77dff",
          dashed: false,
          life: 1.0,
          decay: 0.03,
        });

        this.shockwaves.push({
          x: enemyPos.x,
          y: enemyPos.y,
          radius: 10,
          maxRadius: 225,
          lineWidth: 8,
          color: "#00f3ff",
          glowColor: "#00f3ff",
          dashed: true,
          rotation: 0,
          life: 1.0,
          decay: 0.034,
        });

        this.shockwaves.push({
          x: enemyPos.x,
          y: enemyPos.y,
          radius: 6,
          maxRadius: 155,
          lineWidth: 5,
          color: "#ffffff",
          glowColor: "#00f3ff",
          dashed: false,
          life: 1.0,
          decay: 0.045,
        });

        this.screenFlashes.push({
          color: "rgba(0, 243, 255, 0.22)",
          life: 1.0,
          decay: 0.065,
        });

        const novaColors = ["#00f3ff", "#9d4edd", "#c77dff", "#ffffff", "#3c096c"];
        for (let p = 0; p < 76; p++) {
          const ang = (p / 76) * TAU + rand(-0.08, 0.08);
          const spd = rand(4.0, 16.5);
          if (p % 3 === 0) {
            this.debris.push({
              x: enemyPos.x,
              y: enemyPos.y,
              vx: Math.cos(ang) * spd,
              vy: Math.sin(ang) * spd,
              drag: 0.95,
              gravity: 0.06,
              size: rand(5, 11),
              rot: rand(0, TAU),
              vRot: rand(-0.24, 0.24),
              sides: 4,
              color: pick(novaColors),
              life: 1.0,
              decay: rand(0.018, 0.032),
            });
          } else {
            this.sparks.push({
              x: enemyPos.x,
              y: enemyPos.y,
              vx: Math.cos(ang) * spd,
              vy: Math.sin(ang) * spd,
              drag: 0.94,
              gravity: 0.04,
              length: rand(14, 30),
              size: rand(2.5, 4.5),
              color: pick(novaColors),
              life: 1.0,
              decay: rand(0.022, 0.038),
              electric: true,
            });
          }
        }
      });
    }

    spawnEnemyCounterClawVFX() {
      const heroPos = this.getTargetPosition("hero", 0.54);

      // Jagged Crimson/Red Triple Claw Tear Marks over Hero's position
      const offsets = [-30, 0, 30];
      offsets.forEach((perpOffset, idx) => {
        this.scheduleEffect(idx * 36, () => {
          const angle = 0.68; // Top-left to bottom-right vicious diagonal claw rake
          const nx = -Math.sin(angle) * perpOffset;
          const ny = Math.cos(angle) * perpOffset;
          const cx = heroPos.x + nx;
          const cy = heroPos.y + ny;
          const halfLen = idx === 1 ? 105 : 88;

          const segments = 9;
          const points = [];
          for (let s = 0; s <= segments; s++) {
            const t = s / segments - 0.5;
            const jitter =
              s === 0 || s === segments ? 0 : (s % 2 === 0 ? 1 : -1) * rand(4.5, 11.5);
            points.push({
              x: cx + Math.cos(angle) * (t * halfLen * 2) - Math.sin(angle) * jitter,
              y: cy + Math.sin(angle) * (t * halfLen * 2) + Math.cos(angle) * jitter,
            });
          }

          this.clawTears.push({
            points,
            color: "#ff1e42",
            woundColor: "#3b000b",
            coreColor: "#ffd6e0",
            width: idx === 1 ? 13 : 10,
            life: 1.0,
            decay: 0.038,
          });
        });
      });

      // Red static digital glitch rectangles around Hero & HUD field
      for (let g = 0; g < 20; g++) {
        const nearHero = g < 15;
        this.glitchRects.push({
          x: nearHero
            ? heroPos.x + rand(-115, 115)
            : rand(this.width * 0.05, this.width * 0.95),
          y: nearHero
            ? heroPos.y + rand(-105, 95)
            : rand(this.height * 0.1, this.height * 0.9),
          w: rand(24, 110),
          h: rand(4, 18),
          vxJitter: rand(-12, 12),
          color: g % 5 === 0 ? "#00f3ff" : g % 2 === 0 ? "#ff1e42" : "#990022",
          alpha: rand(0.55, 0.95),
          life: 1.0,
          decay: rand(0.045, 0.085),
        });
      }

      // Crimson impact ring + subtle red flash
      this.shockwaves.push({
        x: heroPos.x,
        y: heroPos.y,
        radius: 12,
        maxRadius: 135,
        lineWidth: 7,
        color: "#ff1e42",
        glowColor: "#ff003c",
        dashed: true,
        rotation: 0.2,
        life: 1.0,
        decay: 0.055,
      });

      this.screenFlashes.push({
        color: "rgba(255, 30, 66, 0.22)",
        life: 1.0,
        decay: 0.09,
      });

      // Blood-red spark burst (42 particles)
      const redPalette = ["#ff1e42", "#ff4d6d", "#a4133c", "#ffffff", "#800f2f"];
      for (let i = 0; i < 42; i++) {
        const ang = rand(0, TAU);
        const spd = rand(3.5, 13.2);
        this.sparks.push({
          x: heroPos.x + rand(-12, 12),
          y: heroPos.y + rand(-12, 12),
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          drag: 0.92,
          gravity: 0.16,
          length: rand(10, 24),
          size: rand(2.2, 4.2),
          color: pick(redPalette),
          life: 1.0,
          decay: rand(0.03, 0.052),
          electric: true,
        });
      }
    }

    spawnJaggedBolt(x1, y1, x2, y2, color = "#00f3ff", steps = 8, decay = 0.075) {
      const points = [{ x: x1, y: y1 }];
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.hypot(dx, dy) || 1;
      const spread = clamp(len * 0.14, 12, 42);

      for (let i = 1; i < steps; i++) {
        const t = i / steps;
        points.push({
          x: x1 + dx * t + rand(-spread, spread),
          y: y1 + dy * t + rand(-spread, spread),
        });
      }
      points.push({ x: x2, y: y2 });

      this.lightningBolts.push({
        points,
        color,
        life: 1.0,
        decay,
      });
    }

    /* ======================================================================
       3. FLOATING ANIME COMBAT TEXT
       ====================================================================== */
    spawnFloatingText(text, targetType = "enemy", styleOrColor = null) {
      if (!this.canvas) this.init();
      const content = String(text ?? "");
      if (!content) return;

      // Resolve Target Coordinates & Anti-Overlap Stacking
      let anchorKey = "center";
      if (typeof targetType === "string") {
        const t = targetType.toLowerCase();
        if (t === "hero" || t === "enemy" || t === "center") anchorKey = t;
      }

      const basePos = this.getTargetPosition(targetType, 0.22);
      const now = performance.now();
      if (typeof targetType === "string") {
        if (now - this.recentTextStamp[anchorKey] < 380) {
          this.recentTextStack[anchorKey] = (this.recentTextStack[anchorKey] + 1) % 4;
        } else {
          this.recentTextStack[anchorKey] = 0;
        }
        this.recentTextStamp[anchorKey] = now;
      }
      const stackOffset =
        typeof targetType === "string" ? this.recentTextStack[anchorKey] * 28 : 0;

      // Resolve Style / Color Preset
      const resolved = this.resolveFloatingTextStyle(content, styleOrColor);

      this.floatingTexts.push({
        text: content,
        x: clamp(basePos.x + rand(-10, 10), 90, Math.max(120, this.width - 90)),
        y: Math.max(36, basePos.y - stackOffset),
        vx: rand(-0.25, 0.25),
        vy: -2.4,
        color: resolved.color,
        glowColor: resolved.glowColor,
        strokeColor: resolved.strokeColor,
        baseScale: resolved.scale,
        fontSize: resolved.fontSize,
        age: 0,
        maxAge: 1.0,
        speed: 0.017,
      });
    }

    resolveFloatingTextStyle(text, styleOrColor) {
      const upper = text.toUpperCase();
      const presets = {
        crit: { color: "#00f3ff", glowColor: "#00f3ff", scale: 1.24, fontSize: 23 },
        critical: { color: "#ffd60a", glowColor: "#ff9e00", scale: 1.28, fontSize: 24 },
        heavy: { color: "#ffd60a", glowColor: "#ff007f", scale: 1.22, fontSize: 23 },
        ultimate: { color: "#c77dff", glowColor: "#00f3ff", scale: 1.32, fontSize: 25 },
        damage: { color: "#ff1e42", glowColor: "#ff1e42", scale: 1.18, fontSize: 22 },
        error: { color: "#ff1e42", glowColor: "#ff003c", scale: 1.18, fontSize: 22 },
        enemy: { color: "#ff1e42", glowColor: "#ff1e42", scale: 1.18, fontSize: 22 },
        heal: { color: "#00f59b", glowColor: "#00f3ff", scale: 1.18, fontSize: 22 },
        xp: { color: "#ffd60a", glowColor: "#00f3ff", scale: 1.16, fontSize: 21 },
        shadow: { color: "#c77dff", glowColor: "#9d4edd", scale: 1.2, fontSize: 22 },
        hint: { color: "#c77dff", glowColor: "#9d4edd", scale: 1.16, fontSize: 21 },
        arise: { color: "#c77dff", glowColor: "#00f3ff", scale: 1.34, fontSize: 25 },
      };

      if (styleOrColor && typeof styleOrColor === "object") {
        const col = styleOrColor.color || "#00f3ff";
        return {
          color: col,
          glowColor: styleOrColor.glowColor || col,
          strokeColor: styleOrColor.strokeColor || "#040711",
          scale: styleOrColor.scale || 1.15,
          fontSize: styleOrColor.fontSize || 22,
        };
      }

      if (typeof styleOrColor === "string" && styleOrColor.trim()) {
        const key = styleOrColor.trim().toLowerCase();
        if (presets[key]) {
          return {
            strokeColor: "#040711",
            ...presets[key],
          };
        }
        // Treat as explicit CSS color (#hex, rgb, named color)
        return {
          color: styleOrColor,
          glowColor: styleOrColor,
          strokeColor: "#040711",
          scale: upper.includes("CRIT") || upper.includes("ARISE") ? 1.25 : 1.15,
          fontSize: 22,
        };
      }

      // Auto-infer from combat text content
      if (upper.includes("HEAL") || (upper.includes("+") && upper.includes("HP"))) {
        return { strokeColor: "#040711", ...presets.heal };
      }
      if (upper.includes("ARISE") || upper.includes("SHADOW")) {
        return { strokeColor: "#040711", ...presets.arise };
      }
      if (
        upper.includes("ERROR") ||
        upper.includes("COUNTER") ||
        (upper.includes("-") && upper.includes("%"))
      ) {
        return { strokeColor: "#040711", ...presets.damage };
      }
      if (upper.includes("CRIT") || upper.includes("XP")) {
        return { strokeColor: "#040711", ...presets.crit };
      }
      return {
        color: "#00f3ff",
        glowColor: "#00f3ff",
        strokeColor: "#040711",
        scale: 1.15,
        fontSize: 22,
      };
    }

    /* ======================================================================
       4. SPECIAL UTILITY VFX (HEAL, SHADOW HINT EYE WAVE, ARISE VORTEX)
       ====================================================================== */
    triggerHealVFX() {
      if (!this.canvas) this.init();
      const heroBase = this.getTargetPosition("hero", 0.78);
      const heroCenter = this.getTargetPosition("hero", 0.52);

      // Rising green/cyan spiralling mana rings around Hero
      for (let r = 0; r < 5; r++) {
        this.scheduleEffect(r * 95, () => {
          this.manaRings.push({
            x: heroBase.x,
            y: heroBase.y + 12,
            vy: -2.35,
            rx: 68 - r * 4,
            ry: 22 - r * 1.2,
            rotation: r * 0.5,
            vRot: 0.09,
            color: r % 2 === 0 ? "#00f59b" : "#00f3ff",
            life: 1.0,
            decay: 0.021,
          });
        });
      }

      // Rising glowing "+" plus particles around Hero
      for (let i = 0; i < 18; i++) {
        this.plusParticles.push({
          x: heroCenter.x + rand(-68, 68),
          y: heroBase.y + rand(-25, 25),
          vy: rand(-2.8, -1.35),
          swayPhase: rand(0, TAU),
          swaySpeed: rand(0.05, 0.11),
          swayAmp: rand(0.5, 1.4),
          size: rand(11, 20),
          color: i % 3 === 0 ? "#00f3ff" : i % 4 === 0 ? "#ffffff" : "#00f59b",
          life: 1.0,
          decay: rand(0.016, 0.028),
        });
      }

      // Spiralling emerald/cyan mana sparkles
      for (let s = 0; s < 26; s++) {
        const angle = (s / 26) * TAU;
        this.sparks.push({
          x: heroCenter.x + Math.cos(angle) * rand(20, 62),
          y: heroBase.y + rand(-30, 15),
          vx: Math.cos(angle + 1.4) * rand(1.2, 3.0),
          vy: rand(-4.4, -1.8),
          drag: 0.97,
          gravity: -0.03,
          length: rand(6, 13),
          size: rand(2.2, 3.8),
          color: s % 2 === 0 ? "#00f59b" : "#00f3ff",
          life: 1.0,
          decay: rand(0.02, 0.034),
          electric: false,
        });
      }
    }

    triggerShadowHintVFX() {
      if (!this.canvas) this.init();
      const center = this.getTargetPosition("center", 0.44);

      // Purple Shadow Eye Wave sweeping across the entire screen
      this.shadowEyeWaves.push({
        cx: center.x,
        cy: center.y,
        sweepProgress: 0,
        maxRadius: Math.hypot(this.width, this.height) * 0.72,
        life: 1.0,
        decay: 0.019,
      });

      // Trailing shadow-violet motes across the sweep plane
      for (let i = 0; i < 36; i++) {
        this.sparks.push({
          x: center.x + rand(-180, 180),
          y: center.y + rand(-70, 70),
          vx: rand(-4.5, 4.5),
          vy: rand(-2.2, 2.2),
          drag: 0.95,
          gravity: -0.02,
          length: rand(10, 20),
          size: rand(2.4, 4.0),
          color: i % 4 === 0 ? "#00f3ff" : i % 2 === 0 ? "#c77dff" : "#9d4edd",
          life: 1.0,
          decay: rand(0.02, 0.035),
          electric: false,
        });
      }
    }

    triggerAriseVFX() {
      if (!this.canvas) this.init();
      const cx = this.width * 0.5;
      const cy = this.height * 0.5;

      // Massive Dark-Purple & Black Abyssal Vortex swirling in screen center
      const particles = [];
      const palette = ["#9d4edd", "#7b2cbf", "#c77dff", "#080112", "#10002b", "#00f3ff"];
      const total = 96;
      for (let i = 0; i < total; i++) {
        const maxDist = Math.min(this.width, this.height) * 0.56;
        const dist = rand(28, maxDist);
        const color = pick(palette);
        particles.push({
          angle: rand(0, TAU),
          dist,
          angularVel: rand(0.055, 0.135) * (i % 7 === 0 ? -1 : 1),
          radialPull: rand(1.1, 3.4),
          size: rand(3.2, 8.8),
          tailLen: rand(0.14, 0.34),
          color,
          rimColor: color === "#080112" || color === "#10002b" ? "#c77dff" : null,
        });
      }

      this.ariseVortices.push({
        cx,
        cy,
        ringRot: 0,
        particles,
        life: 1.0,
        decay: 0.0115,
      });

      this.screenFlashes.push({
        color: "rgba(16, 0, 43, 0.48)",
        life: 1.0,
        decay: 0.035,
      });

      // Abyssal shadow lightning arcs radiating from vortex core
      for (let b = 0; b < 5; b++) {
        this.scheduleEffect(b * 90, () => {
          const ang = (b / 5) * TAU + rand(-0.3, 0.3);
          this.spawnJaggedBolt(
            cx,
            cy,
            cx + Math.cos(ang) * 185,
            cy + Math.sin(ang) * 155,
            b % 2 === 0 ? "#c77dff" : "#00f3ff",
            9,
            0.045
          );
        });
      }
    }

    /* ======================================================================
       60FPS MASTER CANVAS RENDER LOOP
       ====================================================================== */
    renderLoop(timestamp) {
      if (!this.loopRunning) return;

      const rawDt = timestamp - (this.lastFrameTime || timestamp);
      this.lastFrameTime = timestamp;
      const dt = clamp(rawDt / 16.6667, 0.35, 2.4);

      if (this.ctx2d && this.canvas) {
        const ctx = this.ctx2d;
        const w = this.width;
        const h = this.height;

        ctx.clearRect(0, 0, w, h);

        this.renderBossAtmosphereGlow(ctx, w, h, dt);
        this.renderAmbientEmbers(ctx, w, h, dt);
        this.renderAriseVortices(ctx, dt);
        this.renderShadowEyeWaves(ctx, w, h, dt);
        this.renderBeams(ctx, dt);
        this.renderShockwaves(ctx, dt);
        this.renderManaRings(ctx, dt);
        this.renderLightningBolts(ctx, dt);
        this.renderSlashes(ctx, dt);
        this.renderClawTears(ctx, dt);
        this.renderGlitchRects(ctx, dt);
        this.renderDebris(ctx, dt);
        this.renderSparks(ctx, dt);
        this.renderPlusParticles(ctx, dt);
        this.renderScreenFlashes(ctx, w, h, dt);
        this.renderFloatingTexts(ctx, dt);
      }

      requestAnimationFrame((ts) => this.renderLoop(ts));
    }

    renderBossAtmosphereGlow(ctx, w, h, dt) {
      if (!this._bossMode) return;
      this.bossPulsePhase += 0.045 * dt;
      const intensity = 0.1 + Math.sin(this.bossPulsePhase) * 0.045;

      ctx.save();
      const grad = ctx.createLinearGradient(0, h, 0, h * 0.35);
      grad.addColorStop(0, `rgba(255, 20, 56, ${intensity.toFixed(3)})`);
      grad.addColorStop(0.55, `rgba(95, 0, 24, ${(intensity * 0.45).toFixed(3)})`);
      grad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, h * 0.35, w, h * 0.65);
      ctx.restore();
    }

    renderAmbientEmbers(ctx, w, h, dt) {
      for (let i = 0; i < this.ambientEmbers.length; i++) {
        const e = this.ambientEmbers[i];
        e.phase += e.swayFreq * dt;
        e.x += (e.vxBase + Math.sin(e.phase) * e.swayAmp) * dt;
        e.y += e.vy * dt;

        if (e.y < -18 || e.x < -24 || e.x > w + 24) {
          this.ambientEmbers[i] = this.createAmbientEmber(false);
          continue;
        }

        const flicker = 0.72 + Math.sin(e.phase * 2.1) * 0.28;
        ctx.save();
        ctx.globalAlpha = clamp(e.alpha * flicker, 0.08, 0.95);
        ctx.fillStyle = e.color;
        ctx.shadowBlur = this._bossMode ? 12 : 9;
        ctx.shadowColor = e.rimColor || e.color;

        if (e.shape === "diamond") {
          ctx.translate(e.x, e.y);
          ctx.rotate(Math.PI * 0.25);
          const s = e.radius * 1.45;
          ctx.fillRect(-s * 0.5, -s * 0.5, s, s);
          if (e.rimColor) {
            ctx.strokeStyle = e.rimColor;
            ctx.lineWidth = 1.2;
            ctx.strokeRect(-s * 0.5, -s * 0.5, s, s);
          }
        } else {
          ctx.beginPath();
          ctx.arc(e.x, e.y, e.radius, 0, TAU);
          ctx.fill();
          if (e.rimColor) {
            ctx.strokeStyle = e.rimColor;
            ctx.lineWidth = 1.2;
            ctx.stroke();
          }
        }
        ctx.restore();
      }
    }

    renderSlashes(ctx, dt) {
      for (let i = this.slashes.length - 1; i >= 0; i--) {
        const s = this.slashes[i];
        s.life -= s.decay * dt;
        s.scale += s.scaleVel * dt;
        if (s.life <= 0) {
          this.slashes.splice(i, 1);
          continue;
        }

        const r = s.radius * s.scale;
        const halfArc = s.arcSpan * 0.5;
        const tipX = Math.cos(halfArc) * r;
        const tipY = Math.sin(halfArc) * r;
        const bellyOuter = r + s.thickness * s.life;
        const bellyInner = Math.max(8, r - s.thickness * 0.55 * s.life);

        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.angle);
        ctx.globalAlpha = clamp(s.life * 1.15, 0, 1);

        // Outer Glowing Anime Crescent Blade Wave
        ctx.shadowBlur = 28;
        ctx.shadowColor = s.color;
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.moveTo(tipX, -tipY);
        ctx.quadraticCurveTo(bellyOuter, 0, tipX, tipY);
        ctx.quadraticCurveTo(bellyInner, 0, tipX, -tipY);
        ctx.closePath();
        ctx.fill();

        // Razor-Sharp Core Crescent
        ctx.shadowBlur = 12;
        ctx.shadowColor = s.secondaryColor || s.color;
        ctx.fillStyle = s.coreColor || "#ffffff";
        const coreOuter = r + s.thickness * 0.36 * s.life;
        const coreInner = r - s.thickness * 0.16 * s.life;
        ctx.beginPath();
        ctx.moveTo(tipX, -tipY * 0.92);
        ctx.quadraticCurveTo(coreOuter, 0, tipX, tipY * 0.92);
        ctx.quadraticCurveTo(coreInner, 0, tipX, -tipY * 0.92);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
      }
    }

    renderShockwaves(ctx, dt) {
      for (let i = this.shockwaves.length - 1; i >= 0; i--) {
        const sw = this.shockwaves[i];
        sw.life -= sw.decay * dt;
        if (sw.life <= 0) {
          this.shockwaves.splice(i, 1);
          continue;
        }

        const progress = 1 - sw.life;
        const eased = 1 - Math.pow(1 - progress, 2.4);
        const curRadius = sw.radius + (sw.maxRadius - sw.radius) * eased;

        ctx.save();
        ctx.translate(sw.x, sw.y);
        if (sw.dashed) {
          sw.rotation = (sw.rotation || 0) + 0.04 * dt;
          ctx.rotate(sw.rotation);
          ctx.setLineDash([16, 10]);
        }
        ctx.globalAlpha = clamp(sw.life, 0, 1);
        ctx.strokeStyle = sw.color;
        ctx.lineWidth = Math.max(1.2, sw.lineWidth * sw.life);
        ctx.shadowBlur = 22;
        ctx.shadowColor = sw.glowColor || sw.color;
        ctx.beginPath();
        ctx.arc(0, 0, curRadius, 0, TAU);
        ctx.stroke();
        ctx.restore();
      }
    }

    renderBeams(ctx, dt) {
      for (let i = this.beams.length - 1; i >= 0; i--) {
        const b = this.beams[i];
        b.life -= b.decay * dt;
        b.phase += 0.38 * dt;
        if (b.life <= 0) {
          this.beams.splice(i, 1);
          continue;
        }

        const pulse = 0.85 + Math.sin(b.phase * 2.2) * 0.15;
        const curW = b.width * b.life * pulse;
        const dx = b.x2 - b.x1;
        const dy = b.y2 - b.y1;
        const angle = Math.atan2(dy, dx);
        const len = Math.hypot(dx, dy);

        ctx.save();
        ctx.globalAlpha = clamp(b.life * 1.2, 0, 1);
        ctx.lineCap = "round";

        // 1. Wide Purple Shadow Aura
        ctx.shadowBlur = 36;
        ctx.shadowColor = b.outerColor;
        ctx.strokeStyle = b.outerColor;
        ctx.lineWidth = curW * 1.35;
        ctx.beginPath();
        ctx.moveTo(b.x1, b.y1);
        ctx.lineTo(b.x2, b.y2);
        ctx.stroke();

        // 2. Electric Cyan Plasma Sheath
        ctx.shadowBlur = 22;
        ctx.shadowColor = b.midColor;
        ctx.strokeStyle = b.midColor;
        ctx.lineWidth = curW * 0.72;
        ctx.beginPath();
        ctx.moveTo(b.x1, b.y1);
        ctx.lineTo(b.x2, b.y2);
        ctx.stroke();

        // 3. White-Hot Rim Core + Abyssal Void Center
        ctx.strokeStyle = b.rimColor;
        ctx.lineWidth = curW * 0.36;
        ctx.beginPath();
        ctx.moveTo(b.x1, b.y1);
        ctx.lineTo(b.x2, b.y2);
        ctx.stroke();

        ctx.strokeStyle = b.coreColor;
        ctx.lineWidth = Math.max(2, curW * 0.18);
        ctx.beginPath();
        ctx.moveTo(b.x1, b.y1);
        ctx.lineTo(b.x2, b.y2);
        ctx.stroke();

        // 4. Helical Spiralling Ribbon along Beam
        ctx.translate(b.x1, b.y1);
        ctx.rotate(angle);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        const step = 22;
        for (let x = 0; x <= Math.min(len, this.width * 1.2); x += step) {
          const y = Math.sin(x * 0.045 - b.phase * 2.5) * (curW * 0.58);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.restore();

        // Muzzle & Enemy Singularity Orbs
        ctx.save();
        ctx.globalAlpha = clamp(b.life, 0, 1);
        ctx.fillStyle = "#00f3ff";
        ctx.shadowBlur = 30;
        ctx.shadowColor = "#9d4edd";
        ctx.beginPath();
        ctx.arc(b.x1, b.y1, curW * 0.55, 0, TAU);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(b.impactX, b.impactY, curW * 0.72, 0, TAU);
        ctx.fill();
        ctx.restore();
      }
    }

    renderLightningBolts(ctx, dt) {
      for (let i = this.lightningBolts.length - 1; i >= 0; i--) {
        const bolt = this.lightningBolts[i];
        bolt.life -= (bolt.decay || 0.08) * dt;
        if (bolt.life <= 0) {
          this.lightningBolts.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = clamp(bolt.life, 0, 1);
        ctx.lineJoin = "miter";
        ctx.lineCap = "round";

        ctx.shadowBlur = 18;
        ctx.shadowColor = bolt.color;
        ctx.strokeStyle = bolt.color;
        ctx.lineWidth = 4.2 * bolt.life;
        ctx.beginPath();
        bolt.points.forEach((pt, idx) => {
          if (idx === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        });
        ctx.stroke();

        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = Math.max(1, 1.6 * bolt.life);
        ctx.stroke();
        ctx.restore();
      }
    }

    renderClawTears(ctx, dt) {
      for (let i = this.clawTears.length - 1; i >= 0; i--) {
        const tear = this.clawTears[i];
        tear.life -= tear.decay * dt;
        if (tear.life <= 0) {
          this.clawTears.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = clamp(tear.life * 1.15, 0, 1);
        ctx.lineCap = "round";
        ctx.lineJoin = "bevel";

        // Outer Crimson Slash Glow
        ctx.shadowBlur = 24;
        ctx.shadowColor = tear.color;
        ctx.strokeStyle = tear.color;
        ctx.lineWidth = tear.width * tear.life;
        ctx.beginPath();
        tear.points.forEach((pt, idx) => {
          if (idx === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        });
        ctx.stroke();

        // Dark Wound Core + Hot Pink/White Edge
        ctx.shadowBlur = 0;
        ctx.strokeStyle = tear.woundColor;
        ctx.lineWidth = Math.max(2, tear.width * 0.5 * tear.life);
        ctx.stroke();

        ctx.strokeStyle = tear.coreColor;
        ctx.lineWidth = Math.max(1.2, tear.width * 0.22 * tear.life);
        ctx.stroke();
        ctx.restore();
      }
    }

    renderGlitchRects(ctx, dt) {
      for (let i = this.glitchRects.length - 1; i >= 0; i--) {
        const g = this.glitchRects[i];
        g.life -= g.decay * dt;
        if (g.life <= 0) {
          this.glitchRects.splice(i, 1);
          continue;
        }

        const shiftX = (Math.random() - 0.5) * g.vxJitter * 2;
        ctx.save();
        ctx.globalAlpha = clamp(g.alpha * g.life, 0, 0.95);
        ctx.fillStyle = g.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#ff1e42";
        ctx.fillRect(g.x + shiftX - g.w * 0.5, g.y - g.h * 0.5, g.w, g.h);
        ctx.restore();
      }
    }

    renderDebris(ctx, dt) {
      for (let i = this.debris.length - 1; i >= 0; i--) {
        const d = this.debris[i];
        d.x += d.vx * dt;
        d.y += d.vy * dt;
        d.vx *= Math.pow(d.drag, dt);
        d.vy = d.vy * Math.pow(d.drag, dt) + d.gravity * dt;
        d.rot += d.vRot * dt;
        d.life -= d.decay * dt;

        if (d.life <= 0) {
          this.debris.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.translate(d.x, d.y);
        ctx.rotate(d.rot);
        ctx.globalAlpha = clamp(d.life, 0, 1);
        ctx.fillStyle = d.color;
        ctx.shadowBlur = 12;
        ctx.shadowColor = d.color;

        const r = d.size * (0.55 + d.life * 0.45);
        ctx.beginPath();
        for (let s = 0; s < d.sides; s++) {
          const a = (s / d.sides) * TAU;
          const px = Math.cos(a) * r;
          const py = Math.sin(a) * r * 0.72;
          if (s === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    }

    renderSparks(ctx, dt) {
      for (let i = this.sparks.length - 1; i >= 0; i--) {
        const p = this.sparks[i];
        const prevX = p.x;
        const prevY = p.y;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= Math.pow(p.drag, dt);
        p.vy = p.vy * Math.pow(p.drag, dt) + p.gravity * dt;
        p.life -= p.decay * dt;

        if (p.life <= 0) {
          this.sparks.splice(i, 1);
          continue;
        }

        const speed = Math.hypot(p.vx, p.vy) || 0.01;
        const tailX = p.x - (p.vx / speed) * p.length * p.life;
        const tailY = p.y - (p.vy / speed) * p.length * p.life;

        ctx.save();
        ctx.globalAlpha = clamp(p.life, 0, 1);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = Math.max(1.2, p.size * p.life);
        ctx.lineCap = "round";
        ctx.shadowBlur = 12;
        ctx.shadowColor = p.color;
        ctx.beginPath();
        ctx.moveTo(tailX || prevX, tailY || prevY);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
        ctx.restore();
      }
    }

    renderManaRings(ctx, dt) {
      for (let i = this.manaRings.length - 1; i >= 0; i--) {
        const ring = this.manaRings[i];
        ring.y += ring.vy * dt;
        ring.rotation += ring.vRot * dt;
        ring.life -= ring.decay * dt;
        if (ring.life <= 0) {
          this.manaRings.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.translate(ring.x, ring.y);
        ctx.globalAlpha = clamp(ring.life, 0, 1);
        ctx.strokeStyle = ring.color;
        ctx.lineWidth = 3.6 * ring.life;
        ctx.shadowBlur = 18;
        ctx.shadowColor = ring.color;

        // 3D-perspective tilted spiralling mana ellipse
        ctx.beginPath();
        ctx.ellipse(0, 0, ring.rx, ring.ry, 0, 0, TAU);
        ctx.stroke();

        // Orbiting bright mana bead on the spiral ring
        const orbX = Math.cos(ring.rotation * 3) * ring.rx;
        const orbY = Math.sin(ring.rotation * 3) * ring.ry;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(orbX, orbY, 3.5, 0, TAU);
        ctx.fill();
        ctx.restore();
      }
    }

    renderPlusParticles(ctx, dt) {
      for (let i = this.plusParticles.length - 1; i >= 0; i--) {
        const pl = this.plusParticles[i];
        pl.swayPhase += pl.swaySpeed * dt;
        pl.x += Math.sin(pl.swayPhase) * pl.swayAmp * dt;
        pl.y += pl.vy * dt;
        pl.life -= pl.decay * dt;

        if (pl.life <= 0) {
          this.plusParticles.splice(i, 1);
          continue;
        }

        const arm = pl.size * 0.5;
        const thick = Math.max(2.5, pl.size * 0.24);

        ctx.save();
        ctx.translate(pl.x, pl.y);
        ctx.globalAlpha = clamp(pl.life, 0, 1);
        ctx.fillStyle = pl.color;
        ctx.shadowBlur = 14;
        ctx.shadowColor = pl.color;
        ctx.fillRect(-arm, -thick * 0.5, arm * 2, thick);
        ctx.fillRect(-thick * 0.5, -arm, thick, arm * 2);
        ctx.restore();
      }
    }

    renderShadowEyeWaves(ctx, w, h, dt) {
      for (let i = this.shadowEyeWaves.length - 1; i >= 0; i--) {
        const wave = this.shadowEyeWaves[i];
        wave.life -= wave.decay * dt;
        wave.sweepProgress = 1 - wave.life;
        if (wave.life <= 0) {
          this.shadowEyeWaves.splice(i, 1);
          continue;
        }

        const p = wave.sweepProgress;
        const waveX = p * (w + 260) - 130;
        const radius = p * wave.maxRadius;

        ctx.save();

        // 1. Horizontal Shadow Wave Curtain sweeping across screen
        const sweepGrad = ctx.createLinearGradient(waveX - 140, 0, waveX + 80, 0);
        sweepGrad.addColorStop(0, "rgba(157, 78, 221, 0)");
        sweepGrad.addColorStop(0.6, `rgba(157, 78, 221, ${(0.28 * wave.life).toFixed(3)})`);
        sweepGrad.addColorStop(0.85, `rgba(0, 243, 255, ${(0.22 * wave.life).toFixed(3)})`);
        sweepGrad.addColorStop(1, "rgba(0, 243, 255, 0)");
        ctx.fillStyle = sweepGrad;
        ctx.fillRect(0, 0, w, h);

        // 2. Concentric Psychic Shadow Pulse Rings
        ctx.globalAlpha = clamp(wave.life, 0, 1);
        ctx.strokeStyle = "#9d4edd";
        ctx.lineWidth = 5 * wave.life;
        ctx.shadowBlur = 24;
        ctx.shadowColor = "#c77dff";
        ctx.beginPath();
        ctx.arc(wave.cx, wave.cy, radius, 0, TAU);
        ctx.stroke();

        ctx.strokeStyle = "#00f3ff";
        ctx.lineWidth = 2.5 * wave.life;
        ctx.beginPath();
        ctx.arc(wave.cx, wave.cy, radius * 0.72, 0, TAU);
        ctx.stroke();

        // 3. Holographic Shadow Monarch Abyssal Eye Sigil
        const eyeScale = 0.85 + Math.sin(Math.min(1, p * 2.2) * Math.PI) * 0.35;
        ctx.translate(wave.cx, wave.cy);
        ctx.scale(eyeScale, eyeScale);

        // Outer Shadow Eye Almond Contour
        ctx.fillStyle = "rgba(16, 0, 43, 0.82)";
        ctx.strokeStyle = "#c77dff";
        ctx.lineWidth = 3.2;
        ctx.shadowBlur = 26;
        ctx.shadowColor = "#9d4edd";
        ctx.beginPath();
        ctx.moveTo(-92, 0);
        ctx.quadraticCurveTo(0, -54, 92, 0);
        ctx.quadraticCurveTo(0, 54, -92, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Glowing Violet Iris
        ctx.strokeStyle = "#9d4edd";
        ctx.fillStyle = "rgba(157, 78, 221, 0.35)";
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.arc(0, 0, 26, 0, TAU);
        ctx.fill();
        ctx.stroke();

        // Vertical Slit Monarch Pupil (#00f3ff)
        ctx.fillStyle = "#00f3ff";
        ctx.shadowColor = "#00f3ff";
        ctx.beginPath();
        ctx.moveTo(0, -24);
        ctx.quadraticCurveTo(9, 0, 0, 24);
        ctx.quadraticCurveTo(-9, 0, 0, -24);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
      }
    }

    renderAriseVortices(ctx, dt) {
      for (let i = this.ariseVortices.length - 1; i >= 0; i--) {
        const v = this.ariseVortices[i];
        v.life -= v.decay * dt;
        v.ringRot += 0.032 * dt;
        if (v.life <= 0) {
          this.ariseVortices.splice(i, 1);
          continue;
        }

        const alpha = clamp(Math.min(1, v.life * 1.4), 0, 1);

        ctx.save();
        ctx.translate(v.cx, v.cy);
        ctx.globalAlpha = alpha;

        // 1. Deep Abyssal Singularity Radial Aura
        const grad = ctx.createRadialGradient(0, 0, 8, 0, 0, 210);
        grad.addColorStop(0, "rgba(7, 1, 18, 0.95)");
        grad.addColorStop(0.32, "rgba(60, 9, 108, 0.65)");
        grad.addColorStop(0.68, "rgba(157, 78, 221, 0.25)");
        grad.addColorStop(1, "rgba(16, 0, 43, 0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, 210, 0, TAU);
        ctx.fill();

        // 2. Counter-Rotating Necromancer Extraction Magic Rings
        ctx.save();
        ctx.rotate(v.ringRot);
        ctx.setLineDash([18, 10]);
        ctx.strokeStyle = "#c77dff";
        ctx.lineWidth = 3;
        ctx.shadowBlur = 20;
        ctx.shadowColor = "#9d4edd";
        ctx.beginPath();
        ctx.arc(0, 0, 128, 0, TAU);
        ctx.stroke();
        ctx.restore();

        ctx.save();
        ctx.rotate(-v.ringRot * 1.4);
        ctx.setLineDash([10, 14]);
        ctx.strokeStyle = "#00f3ff";
        ctx.lineWidth = 2.2;
        ctx.shadowBlur = 16;
        ctx.shadowColor = "#00f3ff";
        ctx.beginPath();
        ctx.arc(0, 0, 86, 0, TAU);
        ctx.stroke();
        ctx.restore();

        // 3. Swirling Dark-Purple & Abyssal-Black Vortex Particles
        for (let pIdx = 0; pIdx < v.particles.length; pIdx++) {
          const p = v.particles[pIdx];
          p.angle += p.angularVel * dt;
          p.dist -= p.radialPull * dt;
          if (p.dist < 12) {
            p.dist = rand(140, Math.min(this.width, this.height) * 0.52);
          }

          const x1 = Math.cos(p.angle - p.tailLen) * (p.dist + 8);
          const y1 = Math.sin(p.angle - p.tailLen) * (p.dist + 8) * 0.82;
          const x2 = Math.cos(p.angle) * p.dist;
          const y2 = Math.sin(p.angle) * p.dist * 0.82;

          ctx.strokeStyle = p.rimColor || p.color;
          ctx.lineWidth = p.size;
          ctx.lineCap = "round";
          ctx.shadowBlur = 14;
          ctx.shadowColor = p.rimColor || p.color;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();

          if (p.rimColor) {
            ctx.strokeStyle = p.color;
            ctx.lineWidth = Math.max(1.5, p.size * 0.55);
            ctx.stroke();
          }
        }

        ctx.restore();
      }
    }

    renderScreenFlashes(ctx, w, h, dt) {
      for (let i = this.screenFlashes.length - 1; i >= 0; i--) {
        const fl = this.screenFlashes[i];
        fl.life -= fl.decay * dt;
        if (fl.life <= 0) {
          this.screenFlashes.splice(i, 1);
          continue;
        }
        ctx.save();
        ctx.globalAlpha = clamp(fl.life, 0, 1);
        ctx.fillStyle = fl.color;
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
      }
    }

    renderFloatingTexts(ctx, dt) {
      for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
        const ft = this.floatingTexts[i];
        ft.age += ft.speed * dt;
        if (ft.age >= ft.maxAge) {
          this.floatingTexts.splice(i, 1);
          continue;
        }

        // Pop-in elastic bounce physics + upward drift + smooth fade-out
        let popScale = 1.0;
        if (ft.age < 0.14) {
          const t = ft.age / 0.14;
          popScale = 0.28 + t * 1.08; // 0.28 -> 1.36 overshoot
        } else if (ft.age < 0.28) {
          const t = (ft.age - 0.14) / 0.14;
          popScale = 1.36 - t * 0.36; // 1.36 -> 1.00 settle
        }

        ft.x += ft.vx * dt;
        ft.y += ft.vy * dt;
        ft.vy *= Math.pow(0.965, dt);
        if (Math.abs(ft.vy) < 0.65) ft.vy = -0.65;

        const fadeAlpha = ft.age > 0.65 ? 1 - (ft.age - 0.65) / 0.35 : 1.0;
        const pxSize = Math.round(ft.fontSize * ft.baseScale * popScale);

        ctx.save();
        ctx.globalAlpha = clamp(fadeAlpha, 0, 1);
        ctx.font = `italic 900 ${pxSize}px "Segoe UI", "Impact", "Arial Black", sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.lineJoin = "round";

        // Outer Neon Glow + Dark Abyssal Stroke
        ctx.shadowBlur = 16;
        ctx.shadowColor = ft.glowColor;
        ctx.strokeStyle = ft.strokeColor;
        ctx.lineWidth = 5.5;
        ctx.strokeText(ft.text, ft.x, ft.y);

        // Crisp Glowing Fill
        ctx.fillStyle = ft.color;
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
      }
    }

    /* ======================================================================
       WEB AUDIO API SYNTHESIZER CORE & AUTO-UNLOCK
       ====================================================================== */
    ensureAudioContext() {
      if (!this.audioCtx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return null;

        try {
          this.audioCtx = new AudioCtx();

          // Gentle master limiter so layered explosions + BGM never clip
          this.compressor = this.audioCtx.createDynamicsCompressor();
          this.compressor.threshold.setValueAtTime(-8, this.audioCtx.currentTime);
          this.compressor.knee.setValueAtTime(12, this.audioCtx.currentTime);
          this.compressor.ratio.setValueAtTime(8, this.audioCtx.currentTime);
          this.compressor.attack.setValueAtTime(0.003, this.audioCtx.currentTime);
          this.compressor.release.setValueAtTime(0.18, this.audioCtx.currentTime);

          this.masterGain = this.audioCtx.createGain();
          this.masterGain.gain.setValueAtTime(this.isMuted ? 0.0001 : 0.9, this.audioCtx.currentTime);

          this.sfxGain = this.audioCtx.createGain();
          this.sfxGain.gain.setValueAtTime(0.88, this.audioCtx.currentTime);

          this.bgmGain = this.audioCtx.createGain();
          this.bgmGain.gain.setValueAtTime(0.24, this.audioCtx.currentTime);

          this.sfxGain.connect(this.masterGain);
          this.bgmGain.connect(this.masterGain);
          this.masterGain.connect(this.compressor);
          this.compressor.connect(this.audioCtx.destination);

          this.buildNoiseBuffers();
          this.buildDistortionCurve();
        } catch (_err) {
          this.audioCtx = null;
          return null;
        }
      }
      return this.audioCtx;
    }

    unlockAudio() {
      const ctx = this.ensureAudioContext();
      if (!ctx) return;

      if (ctx.state === "suspended") {
        ctx
          .resume()
          .then(() => {
            this.audioUnlocked = true;
            if (!this.isMuted && this.desiredBGMMode && !this.bgmSchedulerId) {
              this.startBGM(this.desiredBGMMode);
            }
          })
          .catch(() => {});
      } else if (ctx.state === "running") {
        this.audioUnlocked = true;
        if (!this.isMuted && this.desiredBGMMode && !this.bgmSchedulerId) {
          this.startBGM(this.desiredBGMMode);
        }
      }
    }

    buildNoiseBuffers() {
      if (!this.audioCtx) return;
      const sr = this.audioCtx.sampleRate;
      const length = Math.floor(sr * 1.5);

      // Smooth White Noise Buffer (for sword whooshes & thunderous booms)
      this.whiteNoiseBuffer = this.audioCtx.createBuffer(1, length, sr);
      const whiteData = this.whiteNoiseBuffer.getChannelData(0);
      for (let i = 0; i < length; i++) {
        whiteData[i] = Math.random() * 2 - 1;
      }

      // Impulse / Electric Crackle Noise Buffer (for lightning & glitch bursts)
      this.crackleNoiseBuffer = this.audioCtx.createBuffer(1, length, sr);
      const crackleData = this.crackleNoiseBuffer.getChannelData(0);
      for (let i = 0; i < length; i++) {
        const r = Math.random();
        crackleData[i] = r > 0.88 ? (Math.random() * 2 - 1) * 1.0 : (Math.random() * 2 - 1) * 0.16;
      }
    }

    buildDistortionCurve() {
      const samples = 512;
      const curve = new Float32Array(samples);
      const k = 36;
      for (let i = 0; i < samples; i++) {
        const x = (i * 2) / samples - 1;
        curve[i] = ((3 + k) * x * 20 * (Math.PI / 180)) / (Math.PI + k * Math.abs(x));
      }
      this.distortionCurve = curve;
    }

    toggleMute() {
      if (this._buttonClickActive && this._buttonClickHandled) {
        return this.isMuted;
      }
      if (this._buttonClickActive) {
        this._buttonClickHandled = true;
      }

      this.isMuted = !this.isMuted;
      const ctx = this.ensureAudioContext();

      if (this.isMuted) {
        if (ctx && this.masterGain) {
          const now = ctx.currentTime;
          this.masterGain.gain.cancelScheduledValues(now);
          this.masterGain.gain.setTargetAtTime(0.0001, now, 0.015);
        }
        const resumeMode = this.bgmMode || this.desiredBGMMode;
        this.stopBGM();
        this.desiredBGMMode = resumeMode;
      } else {
        this.unlockAudio();
        if (ctx && this.masterGain) {
          const now = ctx.currentTime;
          this.masterGain.gain.cancelScheduledValues(now);
          this.masterGain.gain.setTargetAtTime(0.9, now, 0.02);
        }
        this.playSFX("ui_click");
        if (this.desiredBGMMode) {
          this.startBGM(this.desiredBGMMode);
        }
      }

      this.syncMuteButtonUI();
      return this.isMuted;
    }

    /* Low-level Oscillator & Filtered Noise Synth Primitives */
    synthTone({
      type = "sine",
      freq = 440,
      endFreq = null,
      startTime = 0,
      attack = 0.004,
      duration = 0.18,
      gain = 0.18,
      filterType = null,
      filterFreq = 2400,
      filterEndFreq = null,
      filterQ = 1,
      detune = 0,
      distort = false,
      dest = null,
    }) {
      const ctx = this.audioCtx;
      if (!ctx) return;

      const t0 = Math.max(ctx.currentTime, startTime || ctx.currentTime);
      const tEnd = t0 + Math.max(0.015, duration);

      const osc = ctx.createOscillator();
      const env = ctx.createGain();

      osc.type = type;
      osc.detune.setValueAtTime(detune, t0);
      osc.frequency.setValueAtTime(Math.max(18, freq), t0);
      if (endFreq !== null && endFreq !== undefined) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(18, endFreq), tEnd);
      }

      env.gain.setValueAtTime(0.0001, t0);
      env.gain.linearRampToValueAtTime(Math.max(0.0002, gain), t0 + Math.min(attack, duration * 0.45));
      env.gain.exponentialRampToValueAtTime(0.0001, tEnd);

      let lastNode = osc;
      if (distort && this.distortionCurve) {
        const shaper = ctx.createWaveShaper();
        shaper.curve = this.distortionCurve;
        shaper.oversample = "2x";
        lastNode.connect(shaper);
        lastNode = shaper;
      }

      if (filterType) {
        const biq = ctx.createBiquadFilter();
        biq.type = filterType;
        biq.Q.setValueAtTime(filterQ, t0);
        biq.frequency.setValueAtTime(Math.max(25, filterFreq), t0);
        if (filterEndFreq !== null && filterEndFreq !== undefined) {
          biq.frequency.exponentialRampToValueAtTime(Math.max(25, filterEndFreq), tEnd);
        }
        lastNode.connect(biq);
        lastNode = biq;
      }

      lastNode.connect(env);
      env.connect(dest || this.sfxGain);

      osc.start(t0);
      osc.stop(tEnd + 0.02);
    }

    synthNoise({
      crackle = false,
      startTime = 0,
      attack = 0.005,
      duration = 0.2,
      gain = 0.22,
      filterType = "bandpass",
      filterFreq = 1200,
      filterEndFreq = null,
      filterQ = 1.8,
      dest = null,
    }) {
      const ctx = this.audioCtx;
      if (!ctx) return;
      const buf = crackle ? this.crackleNoiseBuffer : this.whiteNoiseBuffer;
      if (!buf) return;

      const t0 = Math.max(ctx.currentTime, startTime || ctx.currentTime);
      const tEnd = t0 + Math.max(0.015, duration);

      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;

      const biq = ctx.createBiquadFilter();
      biq.type = filterType;
      biq.Q.setValueAtTime(filterQ, t0);
      biq.frequency.setValueAtTime(Math.max(30, filterFreq), t0);
      if (filterEndFreq !== null && filterEndFreq !== undefined) {
        biq.frequency.exponentialRampToValueAtTime(Math.max(30, filterEndFreq), tEnd);
      }

      const env = ctx.createGain();
      env.gain.setValueAtTime(0.0001, t0);
      env.gain.linearRampToValueAtTime(Math.max(0.0002, gain), t0 + Math.min(attack, duration * 0.4));
      env.gain.exponentialRampToValueAtTime(0.0001, tEnd);

      src.connect(biq);
      biq.connect(env);
      env.connect(dest || this.sfxGain);

      src.start(t0, Math.random() * 0.4);
      src.stop(tEnd + 0.02);
    }

    /* ======================================================================
       PROCEDURAL SFX LIBRARY (11 CANONICAL SOUNDS + ALIASES)
       ====================================================================== */
    playSFX(soundName) {
      if (this.isMuted) return;
      const ctx = this.ensureAudioContext();
      if (!ctx) return;
      if (ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }

      const now = ctx.currentTime;
      const key = String(soundName || "ui_click").toLowerCase().trim();

      switch (key) {
        case "ui_click":
        case "click": {
          // Crisp Persona-style high-tech holographic menu blip
          this.synthTone({
            type: "triangle",
            freq: 920,
            endFreq: 1840,
            startTime: now,
            attack: 0.002,
            duration: 0.052,
            gain: 0.14,
          });
          this.synthTone({
            type: "sine",
            freq: 2480,
            endFreq: 3120,
            startTime: now + 0.012,
            attack: 0.002,
            duration: 0.04,
            gain: 0.08,
          });
          break;
        }

        case "slash_light":
        case "light": {
          // Filtered noise swoosh + metallic high-frequency katana ring
          this.synthNoise({
            crackle: false,
            startTime: now,
            attack: 0.008,
            duration: 0.17,
            gain: 0.28,
            filterType: "bandpass",
            filterFreq: 720,
            filterEndFreq: 3900,
            filterQ: 2.2,
          });
          this.synthTone({
            type: "sawtooth",
            freq: 460,
            endFreq: 1320,
            startTime: now,
            attack: 0.004,
            duration: 0.11,
            gain: 0.14,
            filterType: "highpass",
            filterFreq: 600,
          });
          // Metallic high-frequency katana ring partials
          this.synthTone({
            type: "sine",
            freq: 1580,
            endFreq: 1540,
            startTime: now + 0.018,
            attack: 0.002,
            duration: 0.26,
            gain: 0.13,
          });
          this.synthTone({
            type: "triangle",
            freq: 2390,
            endFreq: 2320,
            startTime: now + 0.018,
            attack: 0.002,
            duration: 0.22,
            gain: 0.09,
          });
          break;
        }

        case "slash_heavy":
        case "heavy": {
          // Deep sub-bass impact + dual metallic cleave + electric crackle
          this.synthTone({
            type: "sine",
            freq: 125,
            endFreq: 32,
            startTime: now,
            attack: 0.003,
            duration: 0.34,
            gain: 0.38,
          });
          // Cleave 1 & Cleave 2 (staggered 60ms)
          [0, 0.062].forEach((offset, idx) => {
            this.synthNoise({
              crackle: false,
              startTime: now + offset,
              attack: 0.006,
              duration: 0.2,
              gain: 0.28,
              filterType: "bandpass",
              filterFreq: idx === 0 ? 520 : 680,
              filterEndFreq: idx === 0 ? 2900 : 3600,
              filterQ: 2.0,
            });
            this.synthTone({
              type: "sawtooth",
              freq: idx === 0 ? 280 : 360,
              endFreq: idx === 0 ? 960 : 1240,
              startTime: now + offset,
              attack: 0.003,
              duration: 0.16,
              gain: 0.16,
            });
            this.synthTone({
              type: "triangle",
              freq: idx === 0 ? 1320 : 1760,
              endFreq: idx === 0 ? 1260 : 1680,
              startTime: now + offset + 0.015,
              attack: 0.002,
              duration: 0.28,
              gain: 0.11,
            });
          });
          // Electric crackle tail
          this.synthNoise({
            crackle: true,
            startTime: now + 0.05,
            attack: 0.004,
            duration: 0.26,
            gain: 0.22,
            filterType: "highpass",
            filterFreq: 2100,
            filterQ: 3.5,
          });
          break;
        }

        case "slash_ultimate":
        case "ultimate": {
          // 1) Charging laser riser (0.0s -> 0.3s)
          this.synthTone({
            type: "sawtooth",
            freq: 140,
            endFreq: 1360,
            startTime: now,
            attack: 0.02,
            duration: 0.3,
            gain: 0.22,
            filterType: "lowpass",
            filterFreq: 350,
            filterEndFreq: 6400,
            filterQ: 3.2,
          });
          this.synthTone({
            type: "sine",
            freq: 280,
            endFreq: 2720,
            startTime: now,
            attack: 0.02,
            duration: 0.3,
            gain: 0.16,
          });

          // 2) Thunderous shadow explosion at 0.30s
          const boomT = now + 0.29;
          this.synthTone({
            type: "sine",
            freq: 105,
            endFreq: 24,
            startTime: boomT,
            attack: 0.004,
            duration: 0.68,
            gain: 0.46,
          });
          this.synthNoise({
            crackle: false,
            startTime: boomT,
            attack: 0.005,
            duration: 0.58,
            gain: 0.38,
            filterType: "lowpass",
            filterFreq: 2200,
            filterEndFreq: 130,
            filterQ: 2.4,
          });

          // Rapid dimensional judgment-cut slices
          [0.31, 0.37, 0.43].forEach((cutOff, i) => {
            this.synthNoise({
              crackle: false,
              startTime: now + cutOff,
              attack: 0.003,
              duration: 0.09,
              gain: 0.2,
              filterType: "bandpass",
              filterFreq: 1400 + i * 500,
              filterEndFreq: 4800,
              filterQ: 2.8,
            });
          });

          // 3) Crystalline shatter partials
          const crystalFreqs = [2349.3, 3136.0, 3951.1, 4698.6, 5873.3];
          crystalFreqs.forEach((cf, idx) => {
            this.synthTone({
              type: "sine",
              freq: cf,
              endFreq: cf * 0.96,
              startTime: now + 0.42 + idx * 0.026,
              attack: 0.002,
              duration: 0.26,
              gain: 0.09,
            });
          });
          break;
        }

        case "enemy_attack":
        case "enemy_hit":
        case "damage_hit": {
          // Distorted sawtooth crunch + low bass thud + glitch noise
          this.synthTone({
            type: "sawtooth",
            freq: 175,
            endFreq: 44,
            startTime: now,
            attack: 0.003,
            duration: 0.3,
            gain: 0.26,
            distort: true,
            filterType: "lowpass",
            filterFreq: 1800,
            filterEndFreq: 260,
            filterQ: 2.8,
          });
          this.synthTone({
            type: "sine",
            freq: 92,
            endFreq: 28,
            startTime: now,
            attack: 0.002,
            duration: 0.32,
            gain: 0.38,
          });
          this.synthNoise({
            crackle: true,
            startTime: now,
            attack: 0.002,
            duration: 0.22,
            gain: 0.26,
            filterType: "bandpass",
            filterFreq: 1650,
            filterEndFreq: 520,
            filterQ: 2.2,
          });
          // Stepped digital glitch chirps
          [0.03, 0.075, 0.12].forEach((gt, idx) => {
            this.synthTone({
              type: "square",
              freq: idx === 1 ? 820 : 310,
              endFreq: idx === 1 ? 190 : 640,
              startTime: now + gt,
              attack: 0.001,
              duration: 0.038,
              gain: 0.11,
            });
          });
          break;
        }

        case "potion_heal":
        case "heal": {
          // Ascending magical arpeggio chime (C5 -> E5 -> G5 -> B5 -> C6)
          const notes = [523.25, 659.25, 783.99, 987.77, 1046.5];
          notes.forEach((freq, idx) => {
            const t = now + idx * 0.072;
            const dur = idx === notes.length - 1 ? 0.42 : 0.24;
            this.synthTone({
              type: "sine",
              freq,
              startTime: t,
              attack: 0.008,
              duration: dur,
              gain: 0.16,
            });
            this.synthTone({
              type: "triangle",
              freq: freq * 2,
              startTime: t,
              attack: 0.005,
              duration: dur * 0.75,
              gain: 0.065,
            });
          });
          break;
        }

        case "shadow_hint":
        case "hint": {
          // Mysterious dark reverb pulse (A3 -> E4 minor chord + cavern feedback tail)
          const chord = [
            { freq: 220.0, delay: 0.0, dur: 0.72, gain: 0.18 },   // A3
            { freq: 261.63, delay: 0.05, dur: 0.68, gain: 0.12 }, // C4 (dark minor third)
            { freq: 329.63, delay: 0.11, dur: 0.78, gain: 0.17 }, // E4
          ];
          chord.forEach((n) => {
            // Primary pulse + 2 decaying cavern reverb echoes
            [0, 0.16, 0.32].forEach((echoOff, eIdx) => {
              const decayMult = Math.pow(0.46, eIdx);
              this.synthTone({
                type: "triangle",
                freq: n.freq,
                endFreq: n.freq * 0.995,
                startTime: now + n.delay + echoOff,
                attack: 0.035,
                duration: n.dur,
                gain: n.gain * decayMult,
                filterType: "lowpass",
                filterFreq: 1400 - eIdx * 300,
                filterQ: 2.0,
              });
            });
          });
          this.synthNoise({
            crackle: false,
            startTime: now,
            attack: 0.06,
            duration: 0.55,
            gain: 0.09,
            filterType: "bandpass",
            filterFreq: 480,
            filterEndFreq: 980,
            filterQ: 3.5,
          });
          break;
        }

        case "boss_alarm":
        case "siren": {
          // Dual-tone apocalyptic industrial siren sweep (3 urgent cycles)
          for (let cycle = 0; cycle < 3; cycle++) {
            const cStart = now + cycle * 0.44;
            // Rising sweep
            [220, 330].forEach((baseF, idx) => {
              this.synthTone({
                type: idx === 0 ? "sawtooth" : "square",
                freq: baseF,
                endFreq: baseF * 2.45,
                startTime: cStart,
                attack: 0.015,
                duration: 0.22,
                gain: idx === 0 ? 0.17 : 0.11,
                detune: idx * 7,
                filterType: "lowpass",
                filterFreq: 900,
                filterEndFreq: 2800,
                filterQ: 4.0,
              });
              // Falling sweep
              this.synthTone({
                type: idx === 0 ? "sawtooth" : "square",
                freq: baseF * 2.45,
                endFreq: baseF * 0.88,
                startTime: cStart + 0.21,
                attack: 0.01,
                duration: 0.21,
                gain: idx === 0 ? 0.15 : 0.1,
                detune: -idx * 7,
                filterType: "lowpass",
                filterFreq: 2600,
                filterEndFreq: 700,
                filterQ: 4.0,
              });
            });
          }
          break;
        }

        case "arise_extract":
        case "arise": {
          // Deep Solo-Leveling sub-bass drop + eerie resonant choir-like synth chord
          this.synthTone({
            type: "sine",
            freq: 82,
            endFreq: 22,
            startTime: now,
            attack: 0.01,
            duration: 1.15,
            gain: 0.46,
          });
          this.synthNoise({
            crackle: false,
            startTime: now,
            attack: 0.18,
            duration: 0.95,
            gain: 0.18,
            filterType: "bandpass",
            filterFreq: 240,
            filterEndFreq: 880,
            filterQ: 3.0,
          });

          // Formant-filtered abyssal D-minor choir voices (D3, A3, D4, F4, A4)
          const choirNotes = [146.83, 220.0, 293.66, 349.23, 440.0];
          choirNotes.forEach((freq, idx) => {
            [-8, 8].forEach((det) => {
              this.synthTone({
                type: "sawtooth",
                freq,
                startTime: now + 0.08 + idx * 0.045,
                attack: 0.22,
                duration: 1.25,
                gain: 0.065,
                detune: det,
                filterType: "bandpass",
                filterFreq: idx % 2 === 0 ? 720 : 1180,
                filterEndFreq: idx % 2 === 0 ? 960 : 840,
                filterQ: 4.2,
              });
            });
          });
          break;
        }

        case "victory": {
          // Heroic anime fanfare melody (D5 -> D5 -> D5 -> A5 -> F5 -> G5 -> A5 -> D6)
          const melody = [
            { f: 587.33, t: 0.0, d: 0.11 },
            { f: 587.33, t: 0.12, d: 0.11 },
            { f: 587.33, t: 0.24, d: 0.11 },
            { f: 880.0, t: 0.36, d: 0.28 },
            { f: 698.46, t: 0.66, d: 0.18 },
            { f: 783.99, t: 0.86, d: 0.18 },
            { f: 880.0, t: 1.06, d: 0.18 },
            { f: 1174.66, t: 1.26, d: 0.55 },
          ];
          melody.forEach((n) => {
            this.synthTone({
              type: "sawtooth",
              freq: n.f,
              startTime: now + n.t,
              attack: 0.008,
              duration: n.d,
              gain: 0.14,
              filterType: "lowpass",
              filterFreq: 3400,
              filterQ: 1.5,
            });
            this.synthTone({
              type: "triangle",
              freq: n.f * 0.5,
              startTime: now + n.t,
              attack: 0.008,
              duration: n.d,
              gain: 0.11,
            });
          });
          break;
        }

        case "defeat": {
          // Descending dramatic minor synth power-down
          const notes = [
            { f: 293.66, t: 0.0, d: 0.26 },  // D4
            { f: 277.18, t: 0.22, d: 0.26 }, // C#4
            { f: 261.63, t: 0.44, d: 0.28 }, // C4
            { f: 220.0, t: 0.68, d: 0.34 },  // A3
          ];
          notes.forEach((n) => {
            this.synthTone({
              type: "sawtooth",
              freq: n.f,
              endFreq: n.f * 0.94,
              startTime: now + n.t,
              attack: 0.015,
              duration: n.d,
              gain: 0.15,
              filterType: "lowpass",
              filterFreq: 1500,
              filterEndFreq: 380,
            });
          });
          // Final power-down tape-stop glide
          this.synthTone({
            type: "sawtooth",
            freq: 146.83,
            endFreq: 34,
            startTime: now + 0.95,
            attack: 0.02,
            duration: 0.65,
            gain: 0.22,
            filterType: "lowpass",
            filterFreq: 900,
            filterEndFreq: 95,
          });
          break;
        }

        default: {
          this.synthTone({
            type: "triangle",
            freq: 880,
            endFreq: 1320,
            startTime: now,
            duration: 0.06,
            gain: 0.12,
          });
          break;
        }
      }
    }

    /* ======================================================================
       PROCEDURAL CYBERPUNK / ANIME BATTLE BGM SEQUENCER
       mode = 'normal' (120 BPM D-minor) | mode = 'boss' (150 BPM S-Rank Boss)
       ====================================================================== */
    startBGM(mode = "normal") {
      const targetMode = String(mode || "normal").toLowerCase() === "boss" ? "boss" : "normal";
      this.desiredBGMMode = targetMode;

      if (this.isMuted) return;

      const ctx = this.ensureAudioContext();
      if (!ctx) return;

      if (ctx.state === "suspended") {
        // Will auto-start as soon as unlockAudio() resumes context on user interaction
        return;
      }

      if (this.bgmSchedulerId && this.bgmMode === targetMode) {
        return;
      }

      this.stopBGM(true);
      this.bgmMode = targetMode;
      this.bgmStep = 0;
      this.bgmNextNoteTime = ctx.currentTime + 0.05;

      // Non-blocking Web Audio lookahead scheduler
      this.bgmSchedulerId = setInterval(() => {
        this.scheduleBGMSteps();
      }, 80);
    }

    stopBGM(keepDesired = false) {
      if (this.bgmSchedulerId) {
        clearInterval(this.bgmSchedulerId);
        this.bgmSchedulerId = null;
      }
      this.bgmMode = null;
      if (!keepDesired) {
        this.desiredBGMMode = null;
      }
    }

    scheduleBGMSteps() {
      if (this.isMuted || !this.audioCtx || this.audioCtx.state !== "running" || !this.bgmMode) {
        return;
      }

      const isBoss = this.bgmMode === "boss";
      const bpm = isBoss ? 150 : 120;
      const sixteenthDur = 60 / bpm / 4; // 0.125s @ 120BPM, 0.10s @ 150BPM
      const lookaheadWindow = 0.22;

      while (this.bgmNextNoteTime < this.audioCtx.currentTime + lookaheadWindow) {
        this.triggerBGMStep(this.bgmStep, this.bgmNextNoteTime, sixteenthDur, isBoss);
        this.bgmNextNoteTime += sixteenthDur;
        this.bgmStep = (this.bgmStep + 1) % 16;
      }
    }

    triggerBGMStep(step, time, stepDur, isBoss) {
      if (!isBoss) {
        // NORMAL MODE (120 BPM): Cool rhythmic D-minor cyber-dungeon synth pulse
        // MIDI 38 = D2, 41 = F2, 43 = G2, 45 = A2, 36 = C2, 33 = A1
        const normalBass = [38, 38, null, 38, 41, null, 38, 43, 38, 38, null, 45, 43, 41, 36, 33];
        const normalArp = [null, null, 69, null, null, 74, null, null, null, null, 77, null, 76, null, 74, null];

        const bassMidi = normalBass[step];
        if (bassMidi !== null) {
          this.synthTone({
            type: "sawtooth",
            freq: midiToFreq(bassMidi),
            startTime: time,
            attack: 0.005,
            duration: stepDur * 0.85,
            gain: 0.22,
            filterType: "lowpass",
            filterFreq: step % 4 === 0 ? 780 : 520,
            filterEndFreq: 160,
            filterQ: 2.8,
            dest: this.bgmGain,
          });
        }

        const arpMidi = normalArp[step];
        if (arpMidi !== null) {
          this.synthTone({
            type: "triangle",
            freq: midiToFreq(arpMidi),
            startTime: time,
            attack: 0.004,
            duration: stepDur * 1.1,
            gain: 0.09,
            filterType: "lowpass",
            filterFreq: 2200,
            dest: this.bgmGain,
          });
        }

        // Subtle four-on-the-floor cyber kick & off-beat hi-hat tick
        if (step % 4 === 0) {
          this.synthTone({
            type: "sine",
            freq: 110,
            endFreq: 36,
            startTime: time,
            attack: 0.002,
            duration: 0.11,
            gain: 0.24,
            dest: this.bgmGain,
          });
        } else if (step % 4 === 2) {
          this.synthNoise({
            crackle: false,
            startTime: time,
            attack: 0.001,
            duration: 0.035,
            gain: 0.06,
            filterType: "highpass",
            filterFreq: 5200,
            dest: this.bgmGain,
          });
        }
      } else {
        // BOSS MODE (150 BPM): Intense fast-paced S-Rank Boss D-Phrygian combat bassline
        // MIDI 38 = D2, 50 = D3, 39 = Eb2, 41 = F2, 43 = G2, 44 = Ab2, 45 = A2
        const bossBass = [38, 50, 38, 39, 38, 50, 41, 43, 38, 50, 44, 43, 41, 39, 38, 45];
        const bossLead = [62, null, null, 63, null, null, 65, null, 68, null, 67, null, 65, null, 63, 69];

        const bassMidi = bossBass[step];
        if (bassMidi !== null) {
          this.synthTone({
            type: "sawtooth",
            freq: midiToFreq(bassMidi),
            startTime: time,
            attack: 0.003,
            duration: stepDur * 0.82,
            gain: 0.26,
            filterType: "lowpass",
            filterFreq: step % 2 === 0 ? 1350 : 920,
            filterEndFreq: 210,
            filterQ: 3.6,
            dest: this.bgmGain,
          });
        }

        const leadMidi = bossLead[step];
        if (leadMidi !== null) {
          this.synthTone({
            type: "square",
            freq: midiToFreq(leadMidi),
            startTime: time,
            attack: 0.004,
            duration: stepDur * 0.9,
            gain: 0.085,
            filterType: "lowpass",
            filterFreq: 2400,
            filterQ: 2.0,
            dest: this.bgmGain,
          });
        }

        // Driving Boss Percussion
        if (step % 4 === 0 || step === 14) {
          this.synthTone({
            type: "sine",
            freq: 135,
            endFreq: 38,
            startTime: time,
            attack: 0.002,
            duration: 0.1,
            gain: 0.3,
            dest: this.bgmGain,
          });
        }
        if (step === 4 || step === 12) {
          this.synthNoise({
            crackle: false,
            startTime: time,
            attack: 0.002,
            duration: 0.085,
            gain: 0.13,
            filterType: "bandpass",
            filterFreq: 1900,
            filterQ: 1.4,
            dest: this.bgmGain,
          });
        } else if (step % 2 === 1) {
          this.synthNoise({
            crackle: false,
            startTime: time,
            attack: 0.001,
            duration: 0.028,
            gain: 0.065,
            filterType: "highpass",
            filterFreq: 6200,
            dest: this.bgmGain,
          });
        }
      }
    }
  }

  /* ========================================================================
     PUBLIC SINGLETON EXPORT: window.VFXAudio
     ======================================================================== */
  const controller = new VFXAudioSystem();

  window.VFXAudio = {
    __initializedSingleton: true,

    init() {
      controller.init();
    },

    triggerAttackVFX(type) {
      controller.triggerAttackVFX(type);
    },

    spawnFloatingText(text, targetType, color) {
      controller.spawnFloatingText(text, targetType, color);
    },

    triggerHealVFX() {
      controller.triggerHealVFX();
    },

    triggerShadowHintVFX() {
      controller.triggerShadowHintVFX();
    },

    triggerAriseVFX() {
      controller.triggerAriseVFX();
    },

    setBossAtmosphere(isBoss) {
      controller.setBossAtmosphere(isBoss);
    },

    playSFX(soundName) {
      controller.playSFX(soundName);
    },

    startBGM(mode) {
      controller.startBGM(mode);
    },

    stopBGM() {
      controller.stopBGM();
    },

    toggleMute() {
      return controller.toggleMute();
    },

    get bossMode() {
      return controller.bossMode;
    },

    set bossMode(val) {
      controller.bossMode = val;
    },

    get isMuted() {
      return controller.isMuted;
    },
  };

  /* ========================================================================
     SEAMLESS COMPATIBILITY ADAPTER FOR EXISTING STEP 1 engine.js
     Ensures existing PyQuestAudio / PyQuestVFX calls invoke VFXAudio natively
     ======================================================================== */
  window.PyQuestAudio = {
    initContext() {
      controller.unlockAudio();
    },
    toggleMute() {
      return controller.toggleMute();
    },
    playClick() {
      controller.playSFX("ui_click");
      if (!controller.bgmMode && !controller.desiredBGMMode) {
        controller.startBGM(controller.bossMode ? "boss" : "normal");
      }
    },
    playSlash(mode = "light") {
      const m = String(mode || "light").toLowerCase();
      controller._lastCompatSlashMode = m;
      if (m === "ultimate") controller.playSFX("slash_ultimate");
      else if (m === "heavy") controller.playSFX("slash_heavy");
      else controller.playSFX("slash_light");

      const targetBGM = controller.bossMode ? "boss" : "normal";
      if (controller.bgmMode !== targetBGM) {
        controller.startBGM(targetBGM);
      }
    },
    playDamageHit() {
      controller.playSFX("enemy_attack");
      controller.triggerAttackVFX("enemy_hit");
    },
    playHeal() {
      controller.playSFX("potion_heal");
      controller.triggerHealVFX();
    },
    playBossSiren() {
      controller.setBossAtmosphere(true);
      controller.playSFX("boss_alarm");
      controller.startBGM("boss");
    },
    playArise() {
      controller.playSFX("arise_extract");
      controller.triggerAriseVFX();
    },
    playVictory() {
      controller.playSFX("victory");
    },
    playDefeat() {
      controller.playSFX("defeat");
    },
    stopBGM() {
      controller.stopBGM();
    },
  };

  window.PyQuestVFX = {
    init() {
      controller.init();
    },
    resize() {
      controller.resizeCanvas();
    },
    triggerSlash(_targetX, _targetY, _color = "#00f3ff", isUltimate = false) {
      if (isUltimate || controller._lastCompatSlashMode === "ultimate") {
        controller.triggerAttackVFX("ultimate");
      } else if (controller._lastCompatSlashMode === "heavy") {
        controller.triggerAttackVFX("heavy");
      } else {
        controller.triggerAttackVFX("light");
      }
      controller._lastCompatSlashMode = "light";
    },
    triggerLightningBolt(x1, y1, x2, y2, color = "#00f3ff") {
      controller.spawnJaggedBolt(x1, y1, x2, y2, color, 8, 0.075);
    },
    spawnExplosion(x, y, color = "#00f3ff", count = 24) {
      if (String(color).toLowerCase() === "#9d4edd" && count <= 30) {
        // Triggered by Shadow 50/50 shop item in Step 1 engine.js
        controller.playSFX("shadow_hint");
        controller.triggerShadowHintVFX();
        return;
      }
      for (let i = 0; i < count; i++) {
        const ang = rand(0, TAU);
        const spd = rand(2.5, 9.5);
        controller.sparks.push({
          x,
          y,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          drag: 0.93,
          gravity: 0.08,
          length: rand(8, 18),
          size: rand(2.0, 3.8),
          color: i % 4 === 0 ? "#ffffff" : color,
          life: 1.0,
          decay: rand(0.028, 0.048),
          electric: false,
        });
      }
    },
    spawnFloatingText(text, x, y, color = "#00f3ff", scale = 1) {
      controller.spawnFloatingText(text, { x, y }, { color, scale });
    },
  };

  /* Auto-initialize on DOMContentLoaded (or immediately if DOM is ready) */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      window.VFXAudio.init();
    });
  } else {
    window.VFXAudio.init();
  }
})();
