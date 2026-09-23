/* Math Trail — consolidated game.js
 * Final place trail (loops):
 *   Sunny Hills → Picnic Spot → Duck Pond → Treehouse → Red Barn →
 *   Pumpkin Patch → Candy Trail → Snowy Hill → Firefly Night → Outer Space → (back)
 * Biome index matches placeIndex: 0..9 (space = 9).
 * Save key: mathTrailSaveV5
 */

// ===== CORE (game-a) =====


    const canvas = document.getElementById("game");
    const ctx = canvas.getContext("2d");
    const stage = document.getElementById("stage");
    const menu = document.getElementById("menu");
    const endcard = document.getElementById("endcard");
    const answersEl = document.getElementById("answers");
    const banner = document.getElementById("problemBanner");
    const toast = document.getElementById("toast");
    const heartsEl = document.getElementById("hearts");
    const scoreChip = document.getElementById("scoreChip");
    const levelChip = document.getElementById("levelChip");

    function resize() {
      const r = stage.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = r.width * dpr;
      canvas.height = r.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = true;
    }
    window.addEventListener("resize", resize);
    resize();

    const state = {
      screen: "menu",
      mode: "add",
      lives: 3,
      stars: 0,
      character: "fox",
      owned: ["fox"],
      colors: {},
      score: 0,
      streak: 0,
      level: 1,
      t: 0,
      scroll: 0,
      speed: 88,
      heroX: 180,
      heroY: 0,
      heroVy: 0,
      grounded: true,
      runPhase: 0,
      invuln: 0,
      gate: null,
      flash: 0,
      particles: [],
      clouds: [],
      trees: [],
      answered: false,
      nextGateIn: 0,
      bonusUsed: false,
      bonusTime: 0,
      rushing: false,
      muted: false,
      paused: false,
      bestLevel: 1,
      placeIndex: 0,
      stones: 0,
      arriving: 0,
      winMove: "flip",
      winT: 0,
      lookX: 0,
      blinkT: 0,
      birdT: 0,
      sliding: false,
      dancing: false,
      biome: 0,
      stamps: [],
      runStamps: [],
      musicStep: 0,
      musicAcc: 0,
      titleWave: 0,
      gateWarn: false,
    };

    var PLACES = [
      { id: "hills", name: "Sunny Hills", goal: "Picnic Spot", arrive: "Sunny hills ahead!" },
      { id: "picnic", name: "Picnic Spot", goal: "Duck Pond", arrive: "Picnic time!" },
      { id: "pond", name: "Duck Pond", goal: "Treehouse", arrive: "The ducks say hi!" },
      { id: "treehouse", name: "Treehouse", goal: "Red Barn", arrive: "Up in the treehouse!" },
      { id: "barn", name: "Red Barn", goal: "Pumpkin Patch", arrive: "Welcome to the red barn!" },
      { id: "pumpkin", name: "Pumpkin Patch", goal: "Candy Trail", arrive: "Pumpkins everywhere!" },
      { id: "candy", name: "Candy Trail", goal: "Snowy Hill", arrive: "Sweet candy trail!" },
      { id: "snow", name: "Snowy Hill", goal: "Firefly Night", arrive: "Snow day!" },
      { id: "night", name: "Firefly Night", goal: "Outer Space", arrive: "Fireflies everywhere!" },
      { id: "space", name: "Outer Space", goal: "Sunny Hills", arrive: "Blast off!" }
    ];
    var WIN_MOVES = ["flip", "cartwheel", "bounce"]; // jump-only gate clears

    function rand(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
    function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

    let ac;
    function audio() {
      if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)();
      if (ac.state === "suspended") ac.resume();
      return ac;
    }
    function beep(freq, dur, type, gain) {
      if (state.muted) return;
      try {
        const a = audio();
        const o = a.createOscillator();
        const g = a.createGain();
        o.type = type || "sine";
        o.frequency.value = freq;
        g.gain.value = gain || 0.08;
        g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);
        o.connect(g).connect(a.destination);
        o.start();
        o.stop(a.currentTime + dur);
      } catch (e) {}
    }
    function sfxGood() { beep(523, 0.12, "triangle", 0.07); setTimeout(function(){ beep(784, 0.18, "triangle", 0.07); }, 90); }
    function sfxBad() { beep(180, 0.22, "sawtooth", 0.05); }
    function sfxJump() { beep(420, 0.1, "square", 0.04); }
    function sfxLevel() { [523, 659, 784, 1046].forEach(function(f, i){ setTimeout(function(){ beep(f, 0.16, "triangle", 0.06); }, i * 90); }); }
    function sfxStone() { beep(660, 0.09, "sine", 0.05); beep(880, 0.12, "triangle", 0.04); }
    function sfxArrive() { [392, 523, 659, 784, 1046].forEach(function(f, i){ setTimeout(function(){ beep(f, 0.2, "sine", 0.05); }, i * 110); }); }

    function seedWorld() {
      state.clouds = Array.from({ length: 8 }, function(_, i) {
        return { x: i * 220 + rand(0, 80), y: 40 + rand(0, 140), s: 0.6 + Math.random() * 0.8, w: 70 + rand(0, 50) };
      });
      state.trees = Array.from({ length: 12 }, function(_, i) {
        return { x: i * 180 + rand(0, 60), h: 70 + rand(0, 50), kind: rand(0, 2) };
      });
    }

    function topForLevel(level) {
      // Always single digits 0-9. Levels only open more of that range.
      return [5, 7, 9][Math.min(level - 1, 2)];
    }
    function speedForLevel(level) {
      if (level <= 5) return 88 + (level - 1) * 10;
      return 128 + (level - 5) * 18;
    }

    function generateProblem() {
      const top = topForLevel(state.level);
      let a, b, answer, text;
      var op = state.mode;
      if (op === "mix") op = Math.random() < 0.5 ? "add" : "sub";
      if (op === "add") {
        a = rand(0, top);
        b = rand(0, Math.max(0, top - a));
        answer = a + b;
        text = a + " + " + b;
      } else {
        a = rand(0, top);
        b = rand(0, a);
        answer = a - b;
        text = a + " − " + b;
      }
      const opts = new Set([answer]);
      while (opts.size < 3) {
        const w = rand(0, 9);
        if (w !== answer) opts.add(w);
      }
      const choices = Array.from(opts);
      for (let i = choices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = choices[i];
        choices[i] = choices[j];
        choices[j] = tmp;
      }
      return { answer: answer, text: text, choices: choices };
    }

    function currentPlace() { return PLACES[state.placeIndex % PLACES.length]; }
    function nextPlace() { return PLACES[(state.placeIndex + 1) % PLACES.length]; }

    function spawnGate() {
      const p = generateProblem();
      var style = "normal";
      if (Math.random() < 0.14) style = pick(["rainbow", "tiny", "wide"]);
      var theme = (typeof gateThemeId === "function") ? gateThemeId() : "hills";
      state.gate = { x: viewW() + 420, problem: p, smashed: false, smashT: 0, hit: false, style: style, theme: theme, fallNums: [] };
      state.answered = false;
      state.gateWarn = false;
      state.rushing = false;
      state.jumpArc = false;
      state.didJump = false;
      state.flipAng = 0;
      state.sliding = false;
      state.dancing = false;
      state.winT = 0;
      state.nextGateIn = 0;
      banner.textContent = p.text + " = ?";
      banner.classList.add("show");
      const buttons = answersEl.querySelectorAll(".ans");
      buttons.forEach(function(btn, i) {
        btn.textContent = p.choices[i];
        btn.classList.remove("correct-flash", "wrong-flash");
      });
      answersEl.classList.add("show");
    }

    function viewW() { return stage.getBoundingClientRect().width; }
    function viewH() { return stage.getBoundingClientRect().height; }
    function groundY() { return viewH() * 0.72; }

    function showToast(msg) {
      toast.textContent = msg;
      toast.classList.add("show");
      setTimeout(function(){ toast.classList.remove("show"); }, 1400);
    }
    var GOOD_LINES = ["Good job!", "Amazing!", "Look at you go!", "Yes, you got it!", "Super work!", "Nice one!", "Woohoo!"];
    var KIND_LINES = ["You'll get it next time!", "So close, you can do it!", "That's okay!", "Try the next one!", "Almost!", "Keep going, you've got this!"];
    var VOICE_CLIPS = {
      "Good job!": "voices/good-job.mp3",
      "Amazing!": "voices/amazing.mp3",
      "Look at you go!": "voices/look-at-you-go.mp3",
      "Yes, you got it!": "voices/yes-you-got-it.mp3",
      "Super work!": "voices/super-work.mp3",
      "Nice one!": "voices/nice-one.mp3",
      "Woohoo!": "voices/woohoo.mp3",
      "You'll get it next time!": "voices/you-ll-get-it-next-time.mp3",
      "So close, you can do it!": "voices/so-close-you-can-do-it.mp3",
      "That's okay!": "voices/that-s-okay.mp3",
      "Try the next one!": "voices/try-the-next-one.mp3",
      "Almost!": "voices/almost.mp3",
      "Keep going, you've got this!": "voices/keep-going-you-ve-got-this.mp3",
      "Bonus life! Answer in 5 seconds!": "voices/bonus-life-answer-in-5-seconds.mp3",
      "Extra life! Look at you go!": "voices/extra-life-look-at-you-go.mp3",
      "Time's up!": "voices/time-s-up.mp3"
    };

    var kidVoice = null;
    function scoreVoice(v) {
      var n = ((v && v.name) || "").toLowerCase();
      var lang = ((v && v.lang) || "").toLowerCase();
      var s = 0;
      if (lang.indexOf("en") === 0) s += 8;
      ["samantha","karen","moira","tessa","ava","allison","susan","zira","salli","ivy","joanna","jenny","fiona","victoria","female","woman","girl","child","kid","soft"].forEach(function(w){ if (n.indexOf(w) !== -1) s += 12; });
      if (n.indexOf("robot") !== -1 || n.indexOf("bad news") !== -1 || n.indexOf("whisper") !== -1) s -= 20;
      if (v && v.localService) s += 3;
      return s;
    }
    function pickKidVoice() {
      if (!window.speechSynthesis) return null;
      var list = window.speechSynthesis.getVoices() || [];
      if (!list.length) return null;
      var best = null, bestScore = -1;
      for (var i = 0; i < list.length; i++) {
        var sc = scoreVoice(list[i]);
        if (sc > bestScore) { bestScore = sc; best = list[i]; }
      }
      kidVoice = best;
      return kidVoice;
    }
    if (window.speechSynthesis) {
      pickKidVoice();
      window.speechSynthesis.addEventListener("voiceschanged", function(){ kidVoice = null; pickKidVoice(); });
    }
    var voicePlayer = null;
    var voiceCache = {};
    function preloadVoices() {
      try {
        Object.keys(VOICE_CLIPS).forEach(function(k) {
          var src = VOICE_CLIPS[k];
          if (voiceCache[src]) return;
          var a = new Audio(src);
          a.preload = "auto";
          a.load();
          voiceCache[src] = a;
        });
      } catch (e) {}
    }
    function speakTTS(msg) {
      if (!window.speechSynthesis) return;
      try {
        var u = new SpeechSynthesisUtterance(msg);
        var v = kidVoice || pickKidVoice();
        if (v) u.voice = v;
        u.rate = 1.05;
        u.pitch = 1.12;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(u);
      } catch (e) {}
    }
    function speakLine(msg) {
      showToast(msg);
      if (state.muted) return;
      try {
        var src = VOICE_CLIPS[msg];
        if (!src) {
          var keys = Object.keys(VOICE_CLIPS);
          for (var i = 0; i < keys.length; i++) {
            if (msg.indexOf("Bonus") !== -1 && keys[i].indexOf("Bonus") !== -1) { src = VOICE_CLIPS[keys[i]]; break; }
            if (msg.indexOf("Extra life") !== -1 && keys[i].indexOf("Extra") !== -1) { src = VOICE_CLIPS[keys[i]]; break; }
            if (msg.indexOf("Time") !== -1 && keys[i].indexOf("Time") !== -1) { src = VOICE_CLIPS[keys[i]]; break; }
          }
        }
        if (!src) { speakTTS(msg); return; }
        if (window.speechSynthesis) window.speechSynthesis.cancel();
        if (voicePlayer) { try { voicePlayer.pause(); voicePlayer.currentTime = 0; } catch (e1) {} }
        voicePlayer = new Audio(src);
        voicePlayer.preload = "auto";
        voicePlayer.volume = 1;
        var play = voicePlayer.play();
        if (play && play.catch) play.catch(function(){ speakTTS(msg); });
      } catch (e) { speakTTS(msg); }
    }
    function cheer() { speakLine(GOOD_LINES[Math.floor(Math.random() * GOOD_LINES.length)]); }
    function comfort() { speakLine(KIND_LINES[Math.floor(Math.random() * KIND_LINES.length)]); }

    const SAVE_KEY = "mathTrailSaveV5";
    const ADMIN_KEY = "mathTrailAdminPreview";

    function loadSave() {
      try {
        var key = state.admin ? ADMIN_KEY : SAVE_KEY;
        var raw = localStorage.getItem(key);
        if (!state.admin && !raw) raw = localStorage.getItem("mathTrailSaveV4");
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        return null;
      }
    }

    function writeSave(extra) {
      var data = loadSave() || {};
      if (!state.admin) data.stars = state.stars;
      data.mode = state.mode;
      data.character = state.character;
      data.owned = state.owned;
      data.colors = state.colors;
      data.muted = !!state.muted;
      if (!state.admin) data.bestLevel = Math.max(state.bestLevel || 1, state.level || 1);
      if (state.stamps && state.stamps.length) data.stamps = state.stamps;
      if (extra) {
        for (var k in extra) data[k] = extra[k];
      }
      try { localStorage.setItem(state.admin ? ADMIN_KEY : SAVE_KEY, JSON.stringify(data)); } catch (e) {}
      refreshStarBank();
    }

    function saveRun() {
      writeSave({
        hasRun: state.lives > 0 && state.screen === "play",
        lives: state.lives,
        score: state.score,
        streak: state.streak,
        level: state.level,
        placeIndex: state.placeIndex,
        stones: state.stones
      });
    }

    function clearRun() {
      writeSave({ hasRun: false, lives: 3, score: 0, streak: 0, level: 1 });
    }

    function refreshStarBank() {
      var el = document.getElementById("starBank");
      if (el) el.textContent = "⭐ Saved stars: " + state.stars;
      var cont = document.getElementById("continueBtn");
      var data = loadSave();
      if (cont) {
        if (data && data.hasRun && data.lives > 0) cont.classList.remove("hidden");
        else cont.classList.add("hidden");
      }
    }

    function renderStones() {
      var el = document.getElementById("stoneChip");
      if (!el) return;
      var html = "";
      for (var i = 0; i < 5; i++) html += '<span class="stone' + (i < state.stones ? " on" : "") + '"></span>';
      el.innerHTML = html;
    }
    function refreshGoal() {
      var el = document.getElementById("runGoal");
      if (el) el.textContent = "Next stop: " + nextPlace().name;
      var placeEl = document.getElementById("placeChip");
      if (placeEl) placeEl.textContent = currentPlace().name;
    }
    function updateHud() {
      heartsEl.textContent = Array.from({ length: 3 }, function(_, i) { return i < state.lives ? "❤" : "♡"; }).join(" ");
      scoreChip.textContent = "⭐ " + state.stars;
      if (levelChip) levelChip.textContent = currentPlace().name;
      renderStones();
      refreshGoal();
    }

    function startGame(fromSave) {
      audio();
      state.muted = false;
      var muteBtn = document.getElementById("muteBtn");
      if (muteBtn) muteBtn.textContent = "🔊";
      preloadVoices();
      var data = loadSave() || {};
      if (!fromSave) {
        state.lives = 3;
        state.score = 0;
        state.streak = 0;
        state.level = 1;
        state.bonusUsed = false;
      } else {
        state.mode = data.mode || state.mode;
        state.lives = Math.max(1, data.lives || 3);
        state.score = data.score || 0;
        state.streak = data.streak || 0;
        state.level = data.level || 1;
        document.querySelectorAll(".mode").forEach(function(b) {
          b.classList.toggle("selected", b.dataset.mode === state.mode);
        });
      }
      state.stars = data.stars || state.stars || 0;
      state.screen = "play";
      state.t = 0;
      state.scroll = 0;
      state.speed = speedForLevel(state.level);
      state.heroVy = 0;
      state.heroY = 0;
      state.heroX = 180;
      state.rushing = false;
      state.grounded = true;
      state.runPhase = 0;
      state.invuln = 0;
      state.particles = [];
      state.flash = 0;
      state.nextGateIn = 0.9;
      state.gate = null;
      state.bonusTime = 0;
      state.paused = false;
      if (!fromSave) {
        state.placeIndex = 0;
        state.stones = 0;
        state.arriving = 0;
        state.biome = 0;
        state.runStamps = [];
      } else {
        state.placeIndex = data.placeIndex || 0;
        state.stones = data.stones || 0;
        state.biome = state.placeIndex;
      }
      state.musicAcc = 0;
      state.lookX = 0;
      var mask = document.getElementById("pauseMask");
      if (mask) mask.classList.add("hidden");
      seedWorld();
      menu.classList.add("hidden");
      endcard.classList.add("hidden");
      answersEl.classList.remove("show");
      banner.classList.remove("show");
      updateHud();
      saveRun();
    }

    function endGame() {
      state.screen = "end";
      state.blinkT = 0;
      state.invuln = 0;
      state.flash = 0;
      state.lookX = 0;
      state.sliding = false;
      state.dancing = false;
      state.jumpArc = false;
      state.heroY = 0;
      state.heroVy = 0;
      state.leapX = 0;
      answersEl.classList.remove("show");
      banner.classList.remove("show");
      endcard.classList.remove("hidden");
      document.getElementById("endTitle").textContent = state.score >= 10 ? "Math star!" : "Nice run!";
      document.getElementById("endStats").textContent =
        "You solved " + state.score + " problem" + (state.score === 1 ? "" : "s") +
        " on " + (state.mode === "add" ? "addition" : state.mode === "sub" ? "subtraction" : "mixed facts") +
        ". Last stop: " + currentPlace().name + ".";
      var endStars = document.getElementById("endStars");
      if (endStars) endStars.textContent = "⭐ Stars kept: " + state.stars + "  (they stay saved)";
      var stampEl = document.getElementById("endStamps");
      if (stampEl) {
        var got = (state.runStamps && state.runStamps.length) ? state.runStamps : [];
        var all = state.stamps || [];
        var line = got.length ? ("Stamps this run: " + got.join(" · ")) : "Play again to collect trail stamps.";
        stampEl.textContent = line + (all.length ? ("  ·  Book: " + all.length + "/" + PLACES.length) : "");
      }
      clearRun();
    }

    function addStamp(name) {
      if (!state.stamps) state.stamps = [];
      if (!state.runStamps) state.runStamps = [];
      if (state.runStamps.indexOf(name) === -1) state.runStamps.push(name);
      if (state.stamps.indexOf(name) === -1) state.stamps.push(name);
    }

    function arriveAtNextPlace() {
      state.placeIndex = (state.placeIndex + 1) % PLACES.length;
      state.biome = state.placeIndex;
      state.stones = 0;
      state.arriving = 2.4;
      state.stars += 1;
      addStamp(currentPlace().name);
      sfxArrive();
      // Arrival title card (drawArrival) owns the welcome — skip stacked toast.
      refreshGoal();
    }

    function chooseAnswer(i) {
      if ((state.screen !== "play" && state.screen !== "bonus") || !state.gate || state.answered || state.gate.smashed) return;
      const choice = state.gate.problem.choices[i];
      const buttons = answersEl.querySelectorAll(".ans");
      if (choice === state.gate.problem.answer) {
        state.answered = true;
        buttons[i].classList.add("correct-flash");
        sfxGood();
        if (state.screen === "bonus") {
          state.answered = true;
          state.lives = 1;
          state.invuln = 1.6;
          state.screen = "play";
          state.bonusTime = 0;
      state.paused = false;
      var mask = document.getElementById("pauseMask");
      if (mask) mask.classList.add("hidden");
          state.nextGateIn = 1.6;
          if (state.gate) smashGate(true);
          speakLine("Extra life! Look at you go!");
          updateHud();
          saveRun();
          return;
        }
        state.rushing = true;
        state.winMove = pick(WIN_MOVES);
        state.winT = 0;
        state.lookX = (i - 1) * 18;
        state.score += 1;
        state.stars += 1;
        state.streak += 1;
        state.stones = Math.min(5, (state.stones || 0) + 1);
        sfxStone();
        if (state.streak % 5 === 0) {
          state.level += 1;
          state.bestLevel = Math.max(state.bestLevel || 1, state.level);
          state.speed = speedForLevel(state.level);
          sfxLevel();
          arriveAtNextPlace();
          cheer();
        } else {
          cheer();
        }
        updateHud();
        saveRun();
      } else {
        buttons[i].classList.add("wrong-flash");
        sfxBad();
        if (state.screen === "bonus") {
          speakLine("You'll get it next time!");
          setTimeout(endGame, 700);
          return;
        }
        bump();
      }
    }

    function jump() {
      if (state.didJump) return;
      state.didJump = true;
      var move = state.winMove || "flip";
      // Always clear gates by jumping over — never slide under or skim the ground.
      state.sliding = false;
      state.dancing = false;
      if (move === "bounce") state.heroVy = -880;
      else if (move === "cartwheel") state.heroVy = -980;
      else state.heroVy = -1080;
      state.grounded = false;
      state.jumpArc = true;
      state.flipAng = 0;
      sfxJump();
    }

    function smashGate(success) {
      if (!state.gate) return;
      state.gate.smashed = true;
      state.gate.smashT = 0;
      burst(Math.min(state.gate.x, viewW() - 40), groundY() - 70, success ? "#f4c430" : "#e74c3c");
      state.nextGateIn = success ? 1.5 : 1.8;
    }

    function dropGateNumbers() {
      if (!state.gate || !state.gate.problem) return;
      var txt = String(state.gate.problem.text || "");
      state.gate.fallNums = [];
      for (var i = 0; i < txt.length; i++) {
        if (txt[i] === " ") continue;
        state.gate.fallNums.push({
          ch: txt[i],
          x: (i - txt.length / 2) * 16,
          y: -110,
          vx: (Math.random() - 0.5) * 90,
          vy: -40 - Math.random() * 80,
          rot: (Math.random() - 0.5) * 2,
          life: 1.1
        });
      }
    }

    function bump() {
      if (state.invuln > 0) return;
      comfort();
      dropGateNumbers();
      state.lives -= 1;
      state.invuln = 1.2;
      state.flash = 0.35;
      state.streak = 0;
      state.stones = 0;
      updateHud();
      saveRun();
      if (state.gate && !state.gate.smashed) {
        state.gate.hit = true;
        smashGate(false);
      }
      if (state.lives <= 0) {
        if (!state.bonusUsed) setTimeout(startBonus, 650);
        else setTimeout(endGame, 700);
      }
    }

    function startBonus() {
      if (state.screen === "end") return;
      state.bonusUsed = true;
      state.screen = "bonus";
      state.bonusTime = 5;
      state.answered = false;
      spawnGate();
      if (state.gate) state.gate.x = viewW() * 0.62;
      speakLine("Bonus life! Answer in 5 seconds!");
      banner.classList.add("show");
      answersEl.classList.add("show");
    }

    function burst(x, y, color) {
      for (let i = 0; i < 16; i++) {
        state.particles.push({
          x: x, y: y,
          vx: (Math.random() - 0.5) * 280,
          vy: -80 - Math.random() * 220,
          life: 0.5 + Math.random() * 0.4,
          color: color,
          r: 4 + Math.random() * 5
        });
      }
    }

    document.querySelectorAll(".mode").forEach(function(btn) {
      btn.addEventListener("click", function() {
        document.querySelectorAll(".mode").forEach(function(b) { b.classList.remove("selected"); });
        btn.classList.add("selected");
        state.mode = btn.dataset.mode;
      });
    });
    document.getElementById("startBtn").addEventListener("click", function() { startGame(false); });
    document.getElementById("continueBtn").addEventListener("click", function() { startGame(true); });
    document.getElementById("againBtn").addEventListener("click", function() {
      endcard.classList.add("hidden");
      menu.classList.remove("hidden");
      state.screen = "menu";
      // Clear leftover play FX so menu hero does not flicker/blink-stuck
      state.blinkT = 0;
      state.invuln = 0;
      state.flash = 0;
      state.lookX = 0;
      state.sliding = false;
      state.dancing = false;
      state.jumpArc = false;
      state.heroY = 0;
      state.heroVy = 0;
      state.leapX = 0;
      refreshStarBank();
    });
    document.getElementById("shopOpen").addEventListener("click", openShop);
    document.getElementById("shopBack").addEventListener("click", closeShop);

    function refreshMuteBtn() {
      document.getElementById("muteBtn").textContent = state.muted ? "🔇" : "🔊";
    }
    function stopVoice() {
      if (voicePlayer) { try { voicePlayer.pause(); } catch (e) {} }
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    }
    function setPaused(on) {
      if (state.screen !== "play" && state.screen !== "bonus") return;
      state.paused = !!on;
      document.getElementById("pauseMask").classList.toggle("hidden", !state.paused);
      document.getElementById("pauseBtn").textContent = state.paused ? "▶" : "⏸";
      if (state.paused) stopVoice();
    }
    function toggleMute() {
      state.muted = !state.muted;
      if (state.muted) stopVoice();
      refreshMuteBtn();
      writeSave({});
    }
    document.getElementById("muteBtn").addEventListener("click", function(e){ e.stopPropagation(); toggleMute(); });
    document.getElementById("pauseBtn").addEventListener("click", function(e){
      e.stopPropagation();
      if (state.screen === "play" || state.screen === "bonus") setPaused(!state.paused);
    });
    document.getElementById("resumeBtn").addEventListener("click", function(){ setPaused(false); });
    refreshMuteBtn();
    const CATALOG = [
      { id: "fox", name: "Fox", price: 0, emo: "🦊", body: "#ff8a3c", belly: "#ffe0bd", ear: "fox", acc: "none" },
      { id: "cat", name: "Cat", price: 8, emo: "🐱", body: "#d4a017", belly: "#fff3c4", ear: "cat", acc: "none" },
      { id: "bunny", name: "Bunny", price: 12, emo: "🐰", body: "#f3f0ea", belly: "#ffffff", ear: "bunny", acc: "none" },
      { id: "cape", name: "Super Cape", price: 10, emo: "🦸", body: "#ff8a3c", belly: "#ffe0bd", ear: "fox", acc: "cape" },
      { id: "robot", name: "Robot", price: 15, emo: "🤖", body: "#6aa8d8", belly: "#d7ecff", ear: "robot", acc: "antenna" },
      { id: "penguin", name: "Penguin", price: 18, emo: "🐧", body: "#2c3340", belly: "#ffffff", ear: "round", acc: "none" },
      { id: "unicorn", name: "Unicorn", price: 20, emo: "🦄", body: "#f4b6d2", belly: "#fff0f7", ear: "fox", acc: "horn" },
      { id: "dragon", name: "Dragon", price: 25, emo: "🐲", body: "#3cb371", belly: "#d4f5d8", ear: "fox", acc: "wings" },
      { id: "owl", name: "Owl", price: 30, emo: "🦉", body: "#8d6e63", belly: "#ffe0bd", ear: "owl", acc: "none", unlock: 15 },
      { id: "frog", name: "Frog", price: 30, emo: "🐸", body: "#3cb371", belly: "#d4f5d8", ear: "round", acc: "none", unlock: 15 },
      { id: "chick", name: "Chick", price: 30, emo: "🐤", body: "#f4c430", belly: "#fff3c4", ear: "round", acc: "none", unlock: 15 },
      { id: "mouse", name: "Mouse", price: 30, emo: "🐭", body: "#c9d6e4", belly: "#ffffff", ear: "bear", acc: "none", unlock: 15 },
      { id: "pig", name: "Pig", price: 30, emo: "🐷", body: "#f4b6d2", belly: "#fff0f7", ear: "bear", acc: "none", unlock: 15 },
      { id: "duck", name: "Duck", price: 30, emo: "🦆", body: "#f4c430", belly: "#fff3c4", ear: "round", acc: "none", unlock: 15 },
      { id: "hedgehog", name: "Hedgehog", price: 30, emo: "🦔", body: "#8d6e63", belly: "#ffe0bd", ear: "fox", acc: "none", unlock: 15 },
      { id: "squirrel", name: "Squirrel", price: 30, emo: "🐿️", body: "#d4a017", belly: "#fff3c4", ear: "fox", acc: "none", unlock: 15 },
      { id: "bear", name: "Bear", price: 40, emo: "🐻", body: "#8d6e63", belly: "#ffe0bd", ear: "bear", acc: "none", unlock: 25 },
      { id: "raccoon", name: "Raccoon", price: 40, emo: "🦝", body: "#7a7f89", belly: "#f3f0ea", ear: "fox", acc: "mask", unlock: 25 },
      { id: "wolf", name: "Wolf", price: 40, emo: "🐺", body: "#7a7f89", belly: "#f3f0ea", ear: "fox", acc: "none", unlock: 25 },
      { id: "deer", name: "Deer", price: 40, emo: "🦌", body: "#d4a017", belly: "#fff3c4", ear: "fox", acc: "horn", unlock: 25 },
      { id: "seal", name: "Seal", price: 40, emo: "🦭", body: "#7a7f89", belly: "#ffffff", ear: "round", acc: "none", unlock: 25 },
      { id: "koala", name: "Koala", price: 40, emo: "🐨", body: "#7a7f89", belly: "#f3f0ea", ear: "bear", acc: "none", unlock: 25 },
      { id: "monkey", name: "Monkey", price: 40, emo: "🐵", body: "#d4a017", belly: "#ffe0bd", ear: "bear", acc: "none", unlock: 25 },
      { id: "turtle", name: "Turtle", price: 40, emo: "🐢", body: "#3cb371", belly: "#d4f5d8", ear: "round", acc: "none", unlock: 25 },
      { id: "tiger", name: "Tiger", price: 50, emo: "🐯", body: "#ff8a3c", belly: "#fff3c4", ear: "cat", acc: "none", unlock: 30 },
      { id: "panda", name: "Panda", price: 50, emo: "🐼", body: "#f3f0ea", belly: "#ffffff", ear: "bear", acc: "mask", unlock: 30 },
      { id: "lion", name: "Lion", price: 50, emo: "🦁", body: "#d4a017", belly: "#fff3c4", ear: "fox", acc: "none", unlock: 30 },
      { id: "elephant", name: "Elephant", price: 50, emo: "🐘", body: "#7a7f89", belly: "#f3f0ea", ear: "round", acc: "none", unlock: 30 },
      { id: "giraffe", name: "Giraffe", price: 50, emo: "🦒", body: "#f4c430", belly: "#fff3c4", ear: "fox", acc: "none", unlock: 30 },
      { id: "croc", name: "Crocodile", price: 50, emo: "🐊", body: "#3cb371", belly: "#d4f5d8", ear: "round", acc: "none", unlock: 30 },
      { id: "shark", name: "Shark", price: 50, emo: "🦈", body: "#6aa8d8", belly: "#d7ecff", ear: "round", acc: "none", unlock: 30 },
      { id: "bee", name: "Bee", price: 50, emo: "🐝", body: "#f4c430", belly: "#2c3340", ear: "round", acc: "wings", unlock: 30 },
      { id: "phoenix", name: "Phoenix", price: 60, emo: "🔥", body: "#e74c3c", belly: "#f4c430", ear: "fox", acc: "wings", unlock: 35 },
      { id: "knight", name: "Knight", price: 60, emo: "🛡️", body: "#7a7f89", belly: "#d7ecff", ear: "robot", acc: "antenna", unlock: 35 },
      { id: "wizard", name: "Wizard", price: 60, emo: "🧙", body: "#9b59b6", belly: "#fff0f7", ear: "fox", acc: "cape", unlock: 35 },
      { id: "alien", name: "Alien", price: 60, emo: "👽", body: "#3cb371", belly: "#d4f5d8", ear: "round", acc: "antenna", unlock: 35 },
      { id: "dino", name: "Dino", price: 60, emo: "🦖", body: "#3cb371", belly: "#d4f5d8", ear: "fox", acc: "none", unlock: 35 },
      { id: "ninja", name: "Ninja", price: 60, emo: "🥷", body: "#2c3340", belly: "#7a7f89", ear: "round", acc: "mask", unlock: 35 },
      { id: "fairy", name: "Fairy", price: 60, emo: "🧚", body: "#f4b6d2", belly: "#fff0f7", ear: "fox", acc: "wings", unlock: 35 },
      { id: "viking", name: "Viking", price: 60, emo: "🪓", body: "#8d6e63", belly: "#ffe0bd", ear: "fox", acc: "horn", unlock: 35 }
    ];

    var PALETTE = ["#ff8a3c","#e74c3c","#f4c430","#3cb371","#2ecc71","#3498db","#6aa8d8","#9b59b6","#f4b6d2","#8d6e63","#2c3340","#f3f0ea"];



// ===== CORE CONT (game-b) =====

    function mixBelly(hex) {
      hex = (hex || "#ff8a3c").replace("#","");
      var r = parseInt(hex.slice(0,2),16), g = parseInt(hex.slice(2,4),16), b = parseInt(hex.slice(4,6),16);
      r = Math.round(r + (255-r)*0.62);
      g = Math.round(g + (255-g)*0.62);
      b = Math.round(b + (255-b)*0.62);
      return "#" + [r,g,b].map(function(n){ return n.toString(16).padStart(2,"0"); }).join("");
    }

    function costume() {
      var base = CATALOG[0];
      for (var i = 0; i < CATALOG.length; i++) if (CATALOG[i].id === state.character) base = CATALOG[i];
      var c = {};
      for (var k in base) c[k] = base[k];
      if (state.colors && state.colors[c.id]) c.body = state.colors[c.id];
      c.belly = mixBelly(c.body);
      return c;
    }

    function renderShop() {
      document.getElementById("shopStars").textContent = "⭐ " + state.stars + " stars";
      var grid = document.getElementById("shopGrid");
      grid.innerHTML = "";
      CATALOG.forEach(function(it) {
        var owned = state.owned.indexOf(it.id) !== -1;
        var wearing = state.character === it.id;
        var need = it.unlock || 0;
        var locked = !owned && need > (state.bestLevel || 1);
        var btn = document.createElement("button");
        btn.className = "item" + (owned ? " owned" : "") + (wearing ? " wearing" : "") + (locked ? " locked" : "");
        var label = locked ? ("Unlock at Lv " + need) : wearing ? "Wearing" : owned ? "Wear" : (it.price === 0 ? "Free" : "Buy ⭐" + it.price);
        btn.innerHTML = '<div class="emo">' + it.emo + '</div><div class="nm">' + it.name + '</div><div class="pr">' + label + '</div>';
        if (owned) {
          var row = document.createElement("div");
          row.className = "swatches";
          var current = (state.colors && state.colors[it.id]) || it.body;
          PALETTE.forEach(function(col) {
            var s = document.createElement("button");
            s.type = "button";
            s.className = "swatch" + (col.toLowerCase() === current.toLowerCase() ? " on" : "");
            s.style.background = col;
            s.addEventListener("click", function(e) {
              e.stopPropagation();
              setCostumeColor(it.id, col);
            });
            row.appendChild(s);
          });
          btn.appendChild(row);
        }
        btn.addEventListener("click", function() { buyOrWear(it.id); });
        grid.appendChild(btn);
      });
    }

    function buyOrWear(id) {
      var it = null;
      for (var i = 0; i < CATALOG.length; i++) if (CATALOG[i].id === id) it = CATALOG[i];
      if (!it) return;
      var owned = state.owned.indexOf(id) !== -1;
      if (!owned) {
        if ((it.unlock || 0) > (state.bestLevel || 1)) {
          showToast("Reach level " + it.unlock + " first");
          return;
        }
        if (state.stars < it.price) {
          showToast("Need " + it.price + " stars");
          return;
        }
        state.stars -= it.price;
        state.owned.push(id);
        showToast("Bought " + it.name + "!");
      }
      state.character = id;
      writeSave({});
      updateHud();
      renderShop();
    }

    function setCostumeColor(id, col) {
      if (state.owned.indexOf(id) === -1) return;
      if (!state.colors) state.colors = {};
      state.colors[id] = col;
      state.character = id;
      writeSave({});
      renderShop();
    }

    function openShop() {
      menu.classList.add("hidden");
      endcard.classList.add("hidden");
      document.getElementById("shop").classList.remove("hidden");
      renderShop();
    }
    function closeShop() {
      document.getElementById("shop").classList.add("hidden");
      menu.classList.remove("hidden");
      refreshStarBank();
    }

    (function bootSave() {
      state.admin = /(?:\?|&)admin=1(?:&|$)/.test(location.search) || location.hash === "#admin";
      var data = loadSave();
      if (data && typeof data.stars === "number") state.stars = data.stars;
      if (data && data.character) state.character = data.character;
      if (data && data.owned && data.owned.length) state.owned = data.owned;
      if (data && data.colors) state.colors = data.colors;
      if (data && data.muted) state.muted = true;
      if (data && data.bestLevel) state.bestLevel = data.bestLevel;
      if (data && data.stamps) state.stamps = data.stamps;
      if (state.admin) {
        state.bestLevel = 99;
        state.stars = Math.max(state.stars, 999);
      } else {
        if ((state.bestLevel || 1) >= 90) state.bestLevel = 1;
        var keep = ["fox"];
        (state.owned || []).forEach(function(id) {
          var it = null;
          for (var i = 0; i < CATALOG.length; i++) if (CATALOG[i].id === id) it = CATALOG[i];
          if (!it || !it.unlock || it.unlock <= (state.bestLevel || 1)) {
            if (keep.indexOf(id) === -1) keep.push(id);
          }
        });
        state.owned = keep;
        if (state.owned.indexOf(state.character) === -1) state.character = "fox";
      }
      if (state.owned.indexOf("fox") === -1) state.owned.unshift("fox");
      if (data && data.mode) {
        state.mode = data.mode;
        document.querySelectorAll(".mode").forEach(function(b) {
          b.classList.toggle("selected", b.dataset.mode === state.mode);
        });
      }
      updateHud();
      refreshStarBank();
      if (state.admin) {
        var tag = document.querySelector(".menu .tag");
        if (tag) tag.textContent = "ADMIN preview · all costumes unlocked";
        setTimeout(openShop, 80);
      }
    })();
    answersEl.querySelectorAll(".ans").forEach(function(btn) {
      btn.addEventListener("click", function() { chooseAnswer(Number(btn.dataset.i)); });
    });
    window.addEventListener("keydown", function(e) {
      if (e.key === "1" || e.key === "2" || e.key === "3") chooseAnswer(Number(e.key) - 1);
      if ((e.key === "Enter" || e.key === " ") && state.screen === "menu") startGame();
      if (e.key === "p" || e.key === "P" || e.key === "Escape") {
        if (state.screen === "play" || state.screen === "bonus") setPaused(!state.paused);
      }
      if (e.key === "m" || e.key === "M") toggleMute();
    });

    function roundRect(x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }

    function biomeTheme() {
      var b = state.biome || 0;
      var themes = [
        { sky0: "#6bb8ff", sky1: "#b8e4ff", sky2: "#e7f7c8", sun: "#ffe27a", hillA: "#8fd18a", hillB: "#6fc16a", grass: "#4caf50", grassTop: "#7ed56a", dirt: "#5d3a1a", night: false },
        { sky0: "#7ec8ff", sky1: "#ffe7b0", sky2: "#f7e3a8", sun: "#ffd36a", hillA: "#9ad46a", hillB: "#7cbe58", grass: "#5cba5a", grassTop: "#8fe06c", dirt: "#6a4420", night: false },
        { sky0: "#6ec4e8", sky1: "#b8e8ef", sky2: "#c8e8c0", sun: "#ffe27a", hillA: "#6fc9a8", hillB: "#4eb08e", grass: "#3fa87a", grassTop: "#7ed9a8", dirt: "#3d5a4a", night: false },
        { sky0: "#7eb6ff", sky1: "#c5e4c0", sky2: "#d7efb0", sun: "#ffe27a", hillA: "#5aa35a", hillB: "#3e8b44", grass: "#3d8f40", grassTop: "#6ec85c", dirt: "#4a3016", night: false },
        { sky0: "#8ec6f0", sky1: "#f0d9a8", sky2: "#e8c98a", sun: "#ffcf66", hillA: "#b7d36a", hillB: "#8fb24a", grass: "#6aa83a", grassTop: "#9ad45a", dirt: "#6b3a18", night: false },
        { sky0: "#1a2744", sky1: "#2c3e6b", sky2: "#1e3a3a", sun: "#f4f0c8", hillA: "#2f5a48", hillB: "#24463a", grass: "#1f4a32", grassTop: "#2e6a44", dirt: "#1a2418", night: true }
      ];
      return themes[b % themes.length];
    }

    function drawSky(w, h) {
      var th = biomeTheme();
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, th.sky0);
      g.addColorStop(0.55, th.sky1);
      g.addColorStop(1, th.sky2);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = th.sun;
      ctx.beginPath();
      ctx.arc(w - 90, th.night ? 58 : 70, th.night ? 26 : 38, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = th.night ? "rgba(244,240,200,0.18)" : "rgba(255,226,122,0.28)";
      ctx.beginPath();
      ctx.arc(w - 90, th.night ? 58 : 70, th.night ? 48 : 62, 0, Math.PI * 2);
      ctx.fill();
      if (th.night) {
        for (var i = 0; i < 18; i++) {
          var sx = (i * 73 + state.scroll * 0.02) % w;
          var sy = 20 + (i * 37) % 140;
          ctx.fillStyle = "rgba(255,255,210," + (0.4 + Math.sin(state.t * 3 + i) * 0.35) + ")";
          ctx.beginPath();
          ctx.arc(sx, sy, i % 4 === 0 ? 2.4 : 1.4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    function drawCloud(c, scroll) {
      const x = ((c.x - scroll * 0.25) % (viewW() + 200)) - 80;
      ctx.fillStyle = "rgba(255,255,255,0.88)";
      ctx.beginPath();
      ctx.ellipse(x, c.y, c.w * 0.55, 18 * c.s, 0, 0, Math.PI * 2);
      ctx.ellipse(x + 28 * c.s, c.y - 10, 22 * c.s, 16 * c.s, 0, 0, Math.PI * 2);
      ctx.ellipse(x + 52 * c.s, c.y, 26 * c.s, 16 * c.s, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    function drawHills(w, h, gy, scroll) {
      var th = biomeTheme();
      [{ color: th.hillA, speed: 0.18, amp: 28, base: gy - 90 }, { color: th.hillB, speed: 0.32, amp: 22, base: gy - 40 }].forEach(function(L) {
        ctx.fillStyle = L.color;
        ctx.beginPath();
        ctx.moveTo(0, h);
        ctx.lineTo(0, L.base);
        for (let x = 0; x <= w + 20; x += 16) {
          const n = Math.sin((x + scroll * L.speed) * 0.008) * L.amp + Math.sin((x + scroll * L.speed) * 0.019) * (L.amp * 0.45);
          ctx.lineTo(x, L.base + n);
        }
        ctx.lineTo(w, h);
        ctx.closePath();
        ctx.fill();
      });
    }

    function drawTree(t, scroll, gy) {
      const span = viewW() + 240;
      const x = ((t.x - scroll * 0.55) % span + span) % span - 60;
      const y = gy + 8;
      ctx.fillStyle = "#7a4a22";
      ctx.fillRect(x - 6, y - t.h * 0.45, 12, t.h * 0.45);
      ctx.fillStyle = t.kind === 0 ? "#2e8b3a" : t.kind === 1 ? "#3aa34a" : "#1f7a32";
      ctx.beginPath();
      ctx.arc(x, y - t.h * 0.55, 22 + t.h * 0.08, 0, Math.PI * 2);
      ctx.arc(x - 16, y - t.h * 0.42, 16, 0, Math.PI * 2);
      ctx.arc(x + 16, y - t.h * 0.42, 16, 0, Math.PI * 2);
      ctx.fill();
    }

    function drawGround(w, h, gy, scroll) {
      var th = biomeTheme();
      ctx.fillStyle = th.dirt;
      ctx.fillRect(0, gy + 18, w, h);
      ctx.fillStyle = th.grass;
      ctx.fillRect(0, gy, w, 26);
      ctx.fillStyle = th.grassTop;
      ctx.fillRect(0, gy, w, 10);
      ctx.strokeStyle = "rgba(40,90,30,0.25)";
      ctx.lineWidth = 2;
      for (let x = -((scroll * 0.9) % 40); x < w; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, gy + 10);
        ctx.lineTo(x + 16, gy + 24);
        ctx.stroke();
      }
    }

    function drawLandmark(w, h, gy, scroll) {
      var b = state.biome || 0;
      var x = w * 0.72 - (scroll * 0.12) % 40;
      if (b === 1) {
        ctx.fillStyle = "#c0392b";
        ctx.fillRect(x - 46, gy - 8, 92, 8);
        ctx.fillStyle = "#fff8e7";
        for (var i = 0; i < 6; i++) {
          for (var j = 0; j < 4; j++) {
            if ((i + j) % 2 === 0) ctx.fillRect(x - 42 + i * 14, gy - 6 + j * 2, 14, 2);
          }
        }
        ctx.fillStyle = "#d4a017";
        ctx.beginPath();
        ctx.ellipse(x + 28, gy - 18, 16, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#8b5a2b";
        ctx.fillRect(x + 20, gy - 28, 16, 10);
      } else if (b === 2) {
        ctx.fillStyle = "#4aa3c7";
        ctx.beginPath();
        ctx.ellipse(x, gy + 10, 110, 18, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#7fd0e8";
        ctx.beginPath();
        ctx.ellipse(x - 10, gy + 6, 70, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#f4c430";
        ctx.beginPath();
        ctx.ellipse(x - 40, gy - 6 + Math.sin(state.t * 2) * 2, 10, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x + 30, gy - 2 + Math.sin(state.t * 2 + 1) * 2, 8, 5, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (b === 3) {
        ctx.fillStyle = "#6b3a16";
        ctx.fillRect(x - 10, gy - 120, 20, 120);
        ctx.fillStyle = "#2e8b3a";
        ctx.beginPath();
        ctx.arc(x, gy - 150, 54, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#8b5a2b";
        ctx.fillRect(x + 8, gy - 90, 46, 28);
        ctx.fillStyle = "#c9843a";
        ctx.fillRect(x + 8, gy - 96, 50, 8);
      } else if (b === 4) {
        ctx.fillStyle = "#c0392b";
        ctx.fillRect(x - 50, gy - 90, 100, 90);
        ctx.fillStyle = "#8b1e13";
        ctx.beginPath();
        ctx.moveTo(x - 62, gy - 88);
        ctx.lineTo(x, gy - 130);
        ctx.lineTo(x + 62, gy - 88);
        ctx.fill();
        ctx.fillStyle = "#fff3c4";
        ctx.fillRect(x - 16, gy - 48, 18, 22);
        ctx.fillStyle = "#5d3a1a";
        ctx.fillRect(x + 18, gy - 36, 16, 36);
        ctx.strokeStyle = "#8b5a2b";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(x - 90, gy - 22);
        ctx.lineTo(x - 52, gy - 22);
        ctx.stroke();
      } else if (b === 5) {
        ctx.fillStyle = "#f4f0c8";
        ctx.beginPath();
        ctx.arc(w - 90, 58, 26, 0, Math.PI * 2);
        ctx.fill();
        for (var k = 0; k < 10; k++) {
          var fx = (k * 97 + scroll * 0.4) % w;
          var fy = gy - 40 - (k * 17) % 80;
          ctx.fillStyle = "rgba(210,255,120," + (0.45 + Math.sin(state.t * 6 + k) * 0.4) + ")";
          ctx.beginPath();
          ctx.arc(fx, fy, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        ctx.fillStyle = "#2e8b3a";
        ctx.beginPath();
        ctx.arc(x, gy - 70, 28, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#7a4a22";
        ctx.fillRect(x - 6, gy - 50, 12, 50);
      }
    }

    function buddyDrawX() {
      var bx = 110;
      if (state.heroX && !state.rushing) bx = Math.max(90, state.heroX - 72);
      if (state.gate && !state.gate.smashed) bx = Math.min(bx, state.gate.x - 100);
      return Math.max(70, bx);
    }

    function buddyThemeId() {
      if (typeof gateThemeId === "function") return gateThemeId();
      var ids = ["hills","picnic","pond","treehouse","barn","pumpkin","candy","snow","night","space"];
      return ids[(state.biome || 0) % ids.length] || "hills";
    }

    function drawBuddy(x, gy) {
      var bx = x;
      var bob = Math.sin((state.runPhase || 0) * 2 + 1) * 3;
      var by = gy + bob;
      var theme = buddyThemeId();
      var sad = state.flash > 0 || state.invuln > 0.6;
      ctx.fillStyle = "rgba(0,0,0,0.14)";
      ctx.beginPath();
      ctx.ellipse(bx, gy + 16, 16, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      function eyes(ex, ey, gap) {
        gap = gap == null ? 4 : gap;
        ctx.fillStyle = "#1b2a41";
        ctx.beginPath();
        if (sad) {
          ctx.arc(ex - gap, ey, 2, Math.PI, 0);
          ctx.arc(ex + gap, ey, 2, Math.PI, 0);
        } else {
          ctx.arc(ex - gap, ey - 1, 2.1, 0, Math.PI * 2);
          ctx.arc(ex + gap, ey - 1, 2.1, 0, Math.PI * 2);
        }
        ctx.fill();
      }

      if (theme === "picnic") {
        // Ant buddy
        var leg = Math.sin((state.runPhase || 0) * 6) * 3;
        ctx.strokeStyle = "#1b2a41";
        ctx.lineWidth = 2;
        [[-10, -2], [0, 0], [10, 2]].forEach(function(L, i) {
          ctx.beginPath();
          ctx.moveTo(bx + L[0] * 0.4, by - 10);
          ctx.lineTo(bx + L[0] - 8, by + 4 + leg * (i % 2 ? 1 : -1));
          ctx.moveTo(bx + L[0] * 0.4, by - 10);
          ctx.lineTo(bx + L[0] + 8, by + 4 + leg * (i % 2 ? -1 : 1));
          ctx.stroke();
        });
        ctx.fillStyle = "#2c2c2c";
        ctx.beginPath(); ctx.ellipse(bx - 12, by - 10, 8, 6, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(bx, by - 12, 7, 6, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(bx + 12, by - 16, 8, 7, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = "#1b2a41";
        ctx.beginPath(); ctx.moveTo(bx + 16, by - 22); ctx.quadraticCurveTo(bx + 22, by - 34, bx + 18, by - 40); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(bx + 18, by - 22); ctx.quadraticCurveTo(bx + 28, by - 32, bx + 26, by - 38); ctx.stroke();
        eyes(bx + 14, by - 17, 3);
        // tiny crumb
        ctx.fillStyle = "#e8d5a3";
        roundRect(bx - 4, by - 22, 8, 5, 2); ctx.fill();
        return;
      }

      if (theme === "pond") {
        // Frog buddy
        ctx.fillStyle = "#3cb371";
        ctx.beginPath(); ctx.ellipse(bx, by - 12, 18, 12, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#2e8b57";
        ctx.beginPath(); ctx.ellipse(bx - 14, by - 2, 8, 5, -0.4, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(bx + 14, by - 2, 8, 5, 0.4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#fff8e7";
        ctx.beginPath(); ctx.arc(bx - 7, by - 22, 6, 0, Math.PI * 2); ctx.arc(bx + 7, by - 22, 6, 0, Math.PI * 2); ctx.fill();
        eyes(bx, by - 22, 7);
        ctx.fillStyle = "#e74c3c";
        ctx.beginPath(); ctx.ellipse(bx, by - 8, 5, 2, 0, 0, Math.PI * 2); ctx.fill();
        return;
      }

      if (theme === "treehouse") {
        // Owl buddy
        ctx.fillStyle = "#8b6914";
        ctx.beginPath(); ctx.ellipse(bx, by - 18, 16, 20, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#f5e6c8";
        ctx.beginPath(); ctx.ellipse(bx, by - 14, 10, 12, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#fff8e7";
        ctx.beginPath(); ctx.arc(bx - 7, by - 28, 7, 0, Math.PI * 2); ctx.arc(bx + 7, by - 28, 7, 0, Math.PI * 2); ctx.fill();
        eyes(bx, by - 28, 7);
        ctx.fillStyle = "#e67e22";
        ctx.beginPath(); ctx.moveTo(bx - 3, by - 22); ctx.lineTo(bx + 3, by - 22); ctx.lineTo(bx, by - 16); ctx.fill();
        ctx.fillStyle = "#5d4e37";
        ctx.beginPath(); ctx.moveTo(bx - 12, by - 38); ctx.lineTo(bx - 4, by - 34); ctx.lineTo(bx - 10, by - 30); ctx.fill();
        ctx.beginPath(); ctx.moveTo(bx + 12, by - 38); ctx.lineTo(bx + 4, by - 34); ctx.lineTo(bx + 10, by - 30); ctx.fill();
        return;
      }

      if (theme === "barn") {
        // Chick buddy
        ctx.fillStyle = "#f4c430";
        ctx.beginPath(); ctx.ellipse(bx, by - 14, 14, 12, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(bx + 2, by - 28, 10, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#e67e22";
        ctx.beginPath(); ctx.moveTo(bx + 10, by - 28); ctx.lineTo(bx + 20, by - 26); ctx.lineTo(bx + 10, by - 24); ctx.fill();
        ctx.beginPath(); ctx.moveTo(bx - 4, by - 2); ctx.lineTo(bx - 2, by + 8); ctx.lineTo(bx + 2, by - 2); ctx.fill();
        ctx.beginPath(); ctx.moveTo(bx + 4, by - 2); ctx.lineTo(bx + 6, by + 8); ctx.lineTo(bx + 10, by - 2); ctx.fill();
        ctx.fillStyle = "#e74c3c";
        ctx.beginPath(); ctx.moveTo(bx - 2, by - 36); ctx.lineTo(bx + 2, by - 36); ctx.lineTo(bx, by - 42); ctx.fill();
        eyes(bx + 2, by - 30, 3.5);
        return;
      }

      if (theme === "pumpkin") {
        // Turkey buddy
        var fan = ["#c0392b", "#e67e22", "#f4c430", "#e74c3c", "#d35400"];
        for (var fi = 0; fi < fan.length; fi++) {
          var ang = -0.9 + fi * 0.45;
          ctx.fillStyle = fan[fi];
          ctx.beginPath();
          ctx.moveTo(bx, by - 18);
          ctx.ellipse(bx + Math.sin(ang) * 6, by - 34, 8, 18, ang, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = "#8b5a2b";
        ctx.beginPath(); ctx.ellipse(bx, by - 14, 14, 11, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#c9843a";
        ctx.beginPath(); ctx.arc(bx + 2, by - 28, 10, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#e67e22";
        ctx.beginPath(); ctx.moveTo(bx + 10, by - 28); ctx.lineTo(bx + 20, by - 26); ctx.lineTo(bx + 10, by - 24); ctx.fill();
        ctx.fillStyle = "#e74c3c";
        ctx.beginPath(); ctx.moveTo(bx + 8, by - 22); ctx.lineTo(bx + 12, by - 14); ctx.lineTo(bx + 6, by - 18); ctx.fill();
        ctx.fillStyle = "#5d4e37";
        ctx.beginPath(); ctx.moveTo(bx - 4, by - 2); ctx.lineTo(bx - 2, by + 8); ctx.lineTo(bx + 2, by - 2); ctx.fill();
        ctx.beginPath(); ctx.moveTo(bx + 4, by - 2); ctx.lineTo(bx + 6, by + 8); ctx.lineTo(bx + 10, by - 2); ctx.fill();
        eyes(bx + 2, by - 30, 3.5);
        return;
      }

      if (theme === "candy") {
        // Marshmallow buddy
        ctx.fillStyle = "#ffe6f0";
        roundRect(bx - 14, by - 36, 28, 34, 10); ctx.fill();
        ctx.fillStyle = "#ff7eb3";
        roundRect(bx - 14, by - 14, 28, 10, 4); ctx.fill();
        eyes(bx, by - 24, 5);
        ctx.fillStyle = "#ff4d8d";
        ctx.beginPath(); ctx.arc(bx, by - 16, 3, 0, Math.PI); ctx.fill();
        // sprinkle
        ["#4ecdc4","#f4c430","#a29bfe"].forEach(function(c, i) {
          ctx.fillStyle = c;
          ctx.fillRect(bx - 8 + i * 7, by - 34, 4, 2);
        });
        return;
      }

      if (theme === "snow") {
        // Penguin chick buddy
        ctx.fillStyle = "#2c3340";
        ctx.beginPath(); ctx.ellipse(bx, by - 16, 13, 16, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.beginPath(); ctx.ellipse(bx, by - 12, 8, 11, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(bx, by - 32, 10, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#2c3340";
        ctx.beginPath(); ctx.arc(bx, by - 34, 10, Math.PI, 0); ctx.fill();
        ctx.fillStyle = "#e67e22";
        ctx.beginPath(); ctx.moveTo(bx - 2, by - 30); ctx.lineTo(bx + 10, by - 28); ctx.lineTo(bx - 2, by - 26); ctx.fill();
        eyes(bx - 1, by - 34, 3.5);
        return;
      }

      if (theme === "night") {
        // Cute small firefly buddy (ages 5–6)
        var ft = state.t || 0;
        var pulse = 0.55 + Math.sin(ft * 7) * 0.35;
        // Soft small glow halo (not a huge blob)
        ctx.fillStyle = "rgba(180,255,100," + (0.18 + pulse * 0.22) + ")";
        ctx.beginPath(); ctx.arc(bx, by - 14, 7.5, 0, Math.PI * 2); ctx.fill();
        // Thin translucent wing strokes
        var flap = Math.sin(ft * 18) * 0.35;
        ctx.strokeStyle = "rgba(255,255,255,0.5)";
        ctx.lineWidth = 1.15;
        ctx.beginPath(); ctx.ellipse(bx - 5, by - 18, 5.2, 2.1, -0.55 + flap, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(bx + 5, by - 18, 5.2, 2.1, 0.55 - flap, 0, Math.PI * 2); ctx.stroke();
        // Tiny dark/olive body
        ctx.fillStyle = "#3a4a28";
        ctx.beginPath(); ctx.ellipse(bx, by - 18, 3.4, 5, 0, 0, Math.PI * 2); ctx.fill();
        // Bright yellow-green glowing abdomen (pulses with state.t)
        ctx.fillStyle = "rgba(200,255,80," + pulse + ")";
        ctx.beginPath(); ctx.ellipse(bx, by - 10, 4, 5.5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "rgba(255,255,150," + (0.45 + pulse * 0.4) + ")";
        ctx.beginPath(); ctx.ellipse(bx, by - 10, 2.1, 3, 0, 0, Math.PI * 2); ctx.fill();
        // Small head + simple eyes
        ctx.fillStyle = "#2d3a20";
        ctx.beginPath(); ctx.arc(bx, by - 24, 3.4, 0, Math.PI * 2); ctx.fill();
        eyes(bx, by - 24, 2.2);
        return;
      }

      if (theme === "space") {
        // Little alien buddy (ship wrapper may still draw around this)
        ctx.fillStyle = "#7dffb3";
        ctx.beginPath(); ctx.ellipse(bx, by - 14, 14, 12, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(bx, by - 30, 16, 14, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#1b2a41";
        ctx.beginPath(); ctx.ellipse(bx - 5, by - 32, 4, 6, 0, 0, Math.PI * 2); ctx.ellipse(bx + 5, by - 32, 4, 6, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.beginPath(); ctx.arc(bx - 5, by - 33, 1.5, 0, Math.PI * 2); ctx.arc(bx + 5, by - 33, 1.5, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = "#7dffb3";
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(bx - 6, by - 42); ctx.lineTo(bx - 10, by - 52); ctx.moveTo(bx + 6, by - 42); ctx.lineTo(bx + 10, by - 52); ctx.stroke();
        ctx.fillStyle = "#f4c430";
        ctx.beginPath(); ctx.arc(bx - 10, by - 52, 3, 0, Math.PI * 2); ctx.arc(bx + 10, by - 52, 3, 0, Math.PI * 2); ctx.fill();
        return;
      }

      // hills default: chipmunk / squirrel buddy
      ctx.fillStyle = "#c9843a";
      roundRect(bx - 14, by - 28, 28, 22, 10); ctx.fill();
      ctx.fillStyle = "#ffe0bd";
      roundRect(bx - 8, by - 20, 16, 12, 6); ctx.fill();
      ctx.fillStyle = "#c9843a";
      ctx.beginPath(); ctx.arc(bx, by - 36, 12, 0, Math.PI * 2); ctx.fill();
      // stripes
      ctx.fillStyle = "#a86b2d";
      roundRect(bx - 3, by - 44, 6, 18, 2); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(bx - 8, by - 42); ctx.lineTo(bx - 4, by - 54); ctx.lineTo(bx, by - 42); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(bx + 8, by - 42); ctx.lineTo(bx + 4, by - 54); ctx.lineTo(bx, by - 42); ctx.fill();
      // bushy tail
      ctx.fillStyle = "#c9843a";
      ctx.beginPath();
      ctx.moveTo(bx - 12, by - 16);
      ctx.quadraticCurveTo(bx - 34, by - 36, bx - 18, by - 48);
      ctx.quadraticCurveTo(bx - 8, by - 30, bx - 12, by - 16);
      ctx.fill();
      eyes(bx, by - 37, 4);
      var hat = costume();
      ctx.fillStyle = hat.body;
      ctx.beginPath(); ctx.ellipse(bx, by - 48, 10, 4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(bx - 6, by - 58, 12, 10);
    }

    function drawBird(x, gy) {
      if (!state.birdT || state.birdT <= 0) return;
      var t = 1 - Math.max(0, Math.min(1, state.birdT));
      var bx = x + 36;
      var by = gy + state.heroY - 88 - Math.sin(t * Math.PI) * 18;
      ctx.fillStyle = "#f4c430";
      ctx.beginPath();
      ctx.ellipse(bx, by, 10, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#e74c3c";
      ctx.beginPath();
      ctx.moveTo(bx + 10, by);
      ctx.lineTo(bx + 16, by + 2);
      ctx.lineTo(bx + 10, by + 4);
      ctx.fill();
      ctx.fillStyle = "#1b2a41";
      ctx.beginPath();
      ctx.arc(bx + 4, by - 1, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }

    function drawHero(x, gy) {
      var duck = state.sliding ? 16 : 0;
      var dance = state.dancing ? Math.sin(state.t * 14) * 8 : 0;
      const y = gy + state.heroY - 8 + duck;
      var idle = (state.screen === "menu" || state.screen === "end");
      const bob = Math.sin(state.runPhase * 2) * (state.grounded ? 3 : 0) + (idle ? Math.sin(state.t * 2) * 2 : 0);
      if (state.invuln > 0 && (state.screen === "play" || state.screen === "bonus") && Math.floor(state.t * 16) % 2 === 0) return;
      const c = costume();
      ctx.fillStyle = "rgba(0,0,0,0.18)";
      ctx.beginPath();
      ctx.ellipse(x, gy + 16, 26, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.save();
      ctx.translate(x + dance, 0);
      if (state.jumpArc) {
        var ang = state.flipAng || 0;
        if (state.winMove === "cartwheel") ang = state.flipAng * 1.15;
        else if (state.winMove === "slide" || state.winMove === "dance") ang = Math.sin(state.winT * 8) * 0.18;
        else if (state.winMove === "bounce") ang = Math.sin(state.flipAng) * 0.35;
        else if (state.winMove === "highfive") ang = Math.min(0.4, state.flipAng * 0.2);
        ctx.translate(x, gy + state.heroY - 48);
        ctx.rotate(ang);
        ctx.translate(-x, -(gy + state.heroY - 48));
      }
      if (c.acc === "cape") {
        ctx.fillStyle = "#c0392b";
        ctx.beginPath();
        ctx.moveTo(x - 8, y - 50 + bob);
        ctx.quadraticCurveTo(x - 48, y - 20 + bob, x - 20, y - 8 + bob);
        ctx.lineTo(x - 6, y - 28 + bob);
        ctx.fill();
      }
      if (c.acc === "wings") {
        var flap = Math.sin(state.runPhase) * 10;
        function wing(side) {
          var sx = x + side * 14;
          var sy = y - 50 + bob;
          var out = side * (62 + flap * 0.15);
          ctx.fillStyle = c.body;
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.quadraticCurveTo(sx + out * 0.35, sy - 38 - flap, sx + out, sy - 28 - flap);
          ctx.quadraticCurveTo(sx + out * 1.12, sy - 4, sx + out * 0.95, sy + 22 + flap * 0.4);
          ctx.quadraticCurveTo(sx + out * 0.72, sy + 8, sx + out * 0.62, sy + 30 + flap * 0.25);
          ctx.quadraticCurveTo(sx + out * 0.42, sy + 12, sx + out * 0.28, sy + 34);
          ctx.quadraticCurveTo(sx + side * 10, sy + 8, sx, sy + 6);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = c.belly;
          ctx.beginPath();
          ctx.moveTo(sx + side * 4, sy + 2);
          ctx.quadraticCurveTo(sx + out * 0.28, sy - 20 - flap * 0.5, sx + out * 0.72, sy - 16 - flap);
          ctx.quadraticCurveTo(sx + out * 0.55, sy + 6, sx + side * 6, sy + 8);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = c.body;
          ctx.lineWidth = 3;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(sx + out, sy - 28 - flap);
          ctx.moveTo(sx, sy);
          ctx.lineTo(sx + out * 0.95, sy + 22 + flap * 0.4);
          ctx.moveTo(sx, sy);
          ctx.lineTo(sx + out * 0.62, sy + 30 + flap * 0.25);
          ctx.stroke();
        }
        wing(-1);
        wing(1);
      }
      ctx.fillStyle = c.body;
      roundRect(x - 22, y - 58 + bob, 44, 42, 16);
      ctx.fill();
      ctx.fillStyle = c.belly;
      roundRect(x - 12, y - 42 + bob, 24, 22, 10);
      ctx.fill();
      ctx.fillStyle = c.body;
      if (c.ear === "robot") {
        roundRect(x - 24, y - 96 + bob, 48, 40, 4);
        ctx.fill();
        ctx.fillStyle = "#1b2a41";
        roundRect(x - 18, y - 86 + bob, 36, 12, 3);
        ctx.fill();
        ctx.fillStyle = "#7dffb3";
        roundRect(x - 14, y - 83 + bob, 10, 6, 2);
        ctx.fill();
        roundRect(x + 4, y - 83 + bob, 10, 6, 2);
        ctx.fill();
        ctx.fillStyle = c.body;
      } else {
        ctx.beginPath();
        ctx.arc(x, y - 72 + bob, 22, 0, Math.PI * 2);
        ctx.fill();
      }
      if (c.ear === "fox" || c.ear === "cat") {
        ctx.beginPath();
        ctx.moveTo(x - 18, y - 84 + bob);
        ctx.lineTo(x - (c.ear === "cat" ? 14 : 8), y - (c.ear === "cat" ? 104 : 108) + bob);
        ctx.lineTo(x - 2, y - 86 + bob);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x + 18, y - 84 + bob);
        ctx.lineTo(x + (c.ear === "cat" ? 14 : 8), y - (c.ear === "cat" ? 104 : 108) + bob);
        ctx.lineTo(x + 2, y - 86 + bob);
        ctx.fill();
        if (c.ear === "cat") {
          ctx.fillStyle = "#f7c1d4";
          ctx.beginPath();
          ctx.moveTo(x - 14, y - 86 + bob);
          ctx.lineTo(x - 13, y - 98 + bob);
          ctx.lineTo(x - 6, y - 86 + bob);
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(x + 14, y - 86 + bob);
          ctx.lineTo(x + 13, y - 98 + bob);
          ctx.lineTo(x + 6, y - 86 + bob);
          ctx.fill();
          ctx.fillStyle = c.body;
        }
      } else if (c.ear === "bunny") {
        ctx.fillStyle = c.body;
        roundRect(x - 16, y - 118 + bob, 10, 34, 6);
        ctx.fill();
        roundRect(x + 6, y - 118 + bob, 10, 34, 6);
        ctx.fill();
        ctx.fillStyle = "#f7c1d4";
        roundRect(x - 13, y - 112 + bob, 4, 22, 3);
        ctx.fill();
        roundRect(x + 9, y - 112 + bob, 4, 22, 3);
        ctx.fill();
        ctx.fillStyle = c.body;
      }
      if (c.ear === "bear" || c.ear === "owl") {
        ctx.fillStyle = c.body;
        ctx.beginPath();
        ctx.arc(x - 16, y - 90 + bob, c.ear === "owl" ? 7 : 9, 0, Math.PI * 2);
        ctx.arc(x + 16, y - 90 + bob, c.ear === "owl" ? 7 : 9, 0, Math.PI * 2);
        ctx.fill();
      }
      if (c.acc === "mask") {
        ctx.fillStyle = "rgba(20,24,32,0.55)";
        ctx.beginPath();
        ctx.ellipse(x, y - 74 + bob, 18, 8, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      if (c.acc === "antenna") {
        ctx.strokeStyle = "#4a6d88";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x, y - 92 + bob);
        ctx.lineTo(x, y - 112 + bob);
        ctx.stroke();
        ctx.fillStyle = "#e74c3c";
        ctx.beginPath();
        ctx.arc(x, y - 114 + bob, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      if (c.acc === "horn") {
        ctx.fillStyle = "#f4d35e";
        ctx.beginPath();
        ctx.moveTo(x - 4, y - 90 + bob);
        ctx.lineTo(x, y - 118 + bob);
        ctx.lineTo(x + 4, y - 90 + bob);
        ctx.fill();
      }
      var look = Math.max(-6, Math.min(6, state.lookX || 0));
      var blink = (state.blinkT || 0) > 0;
      ctx.fillStyle = "#1b2a41";
      if (blink) {
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#1b2a41";
        ctx.beginPath();
        ctx.moveTo(x - 10 + look, y - 74 + bob);
        ctx.lineTo(x - 4 + look, y - 74 + bob);
        ctx.moveTo(x + 4 + look, y - 74 + bob);
        ctx.lineTo(x + 10 + look, y - 74 + bob);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(x - 7 + look, y - 74 + bob, 3.2, 0, Math.PI * 2);
        ctx.arc(x + 7 + look, y - 74 + bob, 3.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(x - 6 + look, y - 75.5 + bob, 1.2, 0, Math.PI * 2);
        ctx.arc(x + 8 + look, y - 75.5 + bob, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
      if (c.ear === "cat") {
        ctx.fillStyle = "#f4a7c0";
        ctx.beginPath();
        ctx.moveTo(x - 5, y - 66 + bob);
        ctx.lineTo(x + 5, y - 66 + bob);
        ctx.lineTo(x, y - 59 + bob);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "#1b2a41";
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(x, y - 59 + bob);
        ctx.lineTo(x, y - 54 + bob);
        ctx.moveTo(x, y - 54 + bob);
        ctx.lineTo(x - 4, y - 51 + bob);
        ctx.moveTo(x, y - 54 + bob);
        ctx.lineTo(x + 4, y - 51 + bob);
        ctx.stroke();
      } else if (c.ear !== "robot") {
        ctx.fillStyle = c.belly;
        ctx.beginPath();
        ctx.ellipse(x + 10, y - 64 + bob, 10, 7, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#1b2a41";
        ctx.beginPath();
        ctx.arc(x + 16, y - 65 + bob, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      if (c.ear === "cat") {
        ctx.strokeStyle = "#1b2a41";
        ctx.lineWidth = 1.6;
        ctx.lineCap = "round";
        [[-1,-8],[-1,0],[-1,8],[1,-8],[1,0],[1,8]].forEach(function(w) {
          ctx.beginPath();
          ctx.moveTo(x + (w[0] < 0 ? -6 : 14), y - 64 + bob);
          ctx.lineTo(x + (w[0] < 0 ? -28 : 36), y - 64 + bob + w[1]);
          ctx.stroke();
        });
      }
      const swing = Math.sin(state.runPhase) * (state.grounded ? 10 : 4);
      ctx.fillStyle = c.body;
      if (c.id === "penguin") {
        ctx.fillStyle = "#f4c430";
        roundRect(x - 16, y - 16 + bob, 10, 14, 4);
        ctx.fill();
        roundRect(x + 6, y - 16 + bob, 10, 14, 4);
        ctx.fill();
        ctx.fillStyle = c.body;
        ctx.beginPath();
        ctx.ellipse(x - 30, y - 38 + bob, 16, 7, 0.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x + 30, y - 38 + bob, 16, 7, -0.15, 0, Math.PI * 2);
        ctx.fill();
      } else if (c.id === "robot") {
        ctx.fillStyle = c.body;
        roundRect(x - 16, y - 18 + bob, 12, 18, 3);
        ctx.fill();
        roundRect(x + 4, y - 18 + bob, 12, 18, 3);
        ctx.fill();
        ctx.fillStyle = c.body;
        roundRect(x - 40, y - 48 + bob, 22, 8, 3);
        ctx.fill();
        roundRect(x + 18, y - 48 + bob, 22, 8, 3);
        ctx.fill();
        ctx.fillStyle = mixBelly(c.body);
        roundRect(x - 46, y - 51 + bob, 10, 14, 3);
        ctx.fill();
        roundRect(x + 36, y - 51 + bob, 10, 14, 3);
        ctx.fill();
      } else {
        roundRect(x - 16, y - 22 + bob, 10, 26 + swing * 0.15, 5);
        ctx.fill();
        roundRect(x + 6, y - 22 + bob, 10, 26 - swing * 0.15, 5);
        ctx.fill();
        ctx.strokeStyle = c.body;
        ctx.lineWidth = 8;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(x - 20, y - 30 + bob);
        ctx.quadraticCurveTo(x - 42, y - 50 + bob - swing, x - 38, y - 18 + bob);
        ctx.stroke();
      }
      ctx.restore();
    }

    function gateThemeId() {
      try {
        if (typeof currentPlace === "function" && currentPlace()) return currentPlace().id;
      } catch (e) {}
      var ids = ["hills","picnic","pond","treehouse","barn","pumpkin","candy","snow","night","space"];
      return ids[(state.biome || 0) % ids.length] || "hills";
    }

    function drawGateSupports(theme, gy, style) {
      function hayBale(x, y, w, h) {
        ctx.fillStyle = "#e0b34d";
        roundRect(x - w / 2, y - h, w, h, 8);
        ctx.fill();
        ctx.strokeStyle = "#c6922e";
        ctx.lineWidth = 2;
        roundRect(x - w / 2, y - h, w, h, 8);
        ctx.stroke();
        ctx.strokeStyle = "#a8731f";
        ctx.beginPath();
        ctx.moveTo(x - w / 2 + 4, y - h * 0.55);
        ctx.lineTo(x + w / 2 - 4, y - h * 0.55);
        ctx.stroke();
      }
      function pumpkin(x, y, r) {
        ctx.fillStyle = "#e67e22";
        ctx.beginPath(); ctx.ellipse(x, y, r * 1.15, r, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#d35400";
        ctx.beginPath(); ctx.ellipse(x - r * 0.35, y, r * 0.45, r * 0.85, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#2ecc71";
        roundRect(x - 3, y - r - 8, 6, 10, 2); ctx.fill();
      }
      function block(x, y, s, color) {
        ctx.fillStyle = color;
        roundRect(x - s / 2, y - s, s, s, 4); ctx.fill();
        ctx.strokeStyle = "rgba(0,0,0,0.12)";
        ctx.lineWidth = 2;
        roundRect(x - s / 2, y - s, s, s, 4); ctx.stroke();
      }
      function lantern(x, y) {
        ctx.fillStyle = "#5d4e37";
        roundRect(x - 4, y - 150, 8, 90, 3); ctx.fill();
        ctx.fillStyle = "#f4c430";
        roundRect(x - 16, y - 168, 32, 28, 6); ctx.fill();
        ctx.fillStyle = "#fff6c8";
        roundRect(x - 10, y - 162, 20, 16, 4); ctx.fill();
      }

      if (theme === "barn") {
        hayBale(-42, gy + 8, 54, 36);
        hayBale(-42, gy - 26, 48, 32);
        hayBale(-42, gy - 56, 42, 28);
        hayBale(42, gy + 8, 54, 36);
        hayBale(42, gy - 26, 48, 32);
        hayBale(42, gy - 56, 42, 28);
        ctx.fillStyle = "#8b5a2b";
        roundRect(-18, gy - 168, 36, 14, 4); ctx.fill();
        return;
      }
      if (theme === "treehouse") {
        block(-48, gy + 6, 34, "#e74c3c");
        block(-48, gy - 28, 30, "#3498db");
        block(-48, gy - 56, 26, "#f4c430");
        block(48, gy + 6, 34, "#2ecc71");
        block(48, gy - 28, 30, "#9b59b6");
        block(48, gy - 56, 26, "#e67e22");
        // ball
        ctx.fillStyle = "#ff6b6b";
        ctx.beginPath(); ctx.arc(-8, gy - 8, 12, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.beginPath(); ctx.arc(-12, gy - 12, 3, 0, Math.PI * 2); ctx.fill();
        // teddy peek
        ctx.fillStyle = "#c9843a";
        ctx.beginPath(); ctx.arc(14, gy - 18, 10, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(8, gy - 26, 5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(20, gy - 26, 5, 0, Math.PI * 2); ctx.fill();
        return;
      }
      if (theme === "pumpkin") {
        pumpkin(-44, gy - 8, 22);
        pumpkin(-44, gy - 42, 18);
        pumpkin(44, gy - 8, 22);
        pumpkin(44, gy - 42, 18);
        pumpkin(0, gy + 10, 14);
        return;
      }
      if (theme === "candy") {
        // candy-cane posts
        [[-44, 1], [44, -1]].forEach(function(p) {
          var x = p[0], flip = p[1];
          ctx.save();
          ctx.translate(x, gy);
          ctx.scale(flip, 1);
          ctx.strokeStyle = "#fff";
          ctx.lineWidth = 14;
          ctx.lineCap = "round";
          ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -120); ctx.quadraticCurveTo(0, -150, 28, -150); ctx.stroke();
          ctx.strokeStyle = "#e74c3c";
          ctx.lineWidth = 14;
          ctx.setLineDash([12, 12]);
          ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -120); ctx.quadraticCurveTo(0, -150, 28, -150); ctx.stroke();
          ctx.setLineDash([]);
          ctx.restore();
        });
        // lollipop topper
        ctx.fillStyle = "#ff7eb3";
        ctx.beginPath(); ctx.arc(0, gy - 168, 16, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#fff6c8";
        roundRect(-3, gy - 152, 6, 22, 2); ctx.fill();
        return;
      }
      if (theme === "snow") {
        function snowman(x) {
          ctx.fillStyle = "#f5fbff";
          ctx.beginPath(); ctx.arc(x, gy - 10, 22, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(x, gy - 42, 16, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(x, gy - 68, 12, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = "#1b2a41";
          ctx.beginPath(); ctx.arc(x - 4, gy - 70, 1.6, 0, Math.PI * 2); ctx.arc(x + 4, gy - 70, 1.6, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = "#e67e22";
          ctx.beginPath(); ctx.moveTo(x, gy - 66); ctx.lineTo(x + 12, gy - 64); ctx.lineTo(x, gy - 62); ctx.fill();
          ctx.fillStyle = "#c0392b";
          roundRect(x - 14, gy - 82, 28, 8, 3); ctx.fill();
        }
        snowman(-46); snowman(46);
        return;
      }
      if (theme === "pond") {
        // cattail posts
        [-46, 46].forEach(function(x) {
          ctx.strokeStyle = "#6b8e23";
          ctx.lineWidth = 5;
          ctx.beginPath(); ctx.moveTo(x, gy + 6); ctx.lineTo(x, gy - 130); ctx.stroke();
          ctx.fillStyle = "#8b5a2b";
          roundRect(x - 7, gy - 150, 14, 28, 6); ctx.fill();
          ctx.fillStyle = "#2ecc71";
          ctx.beginPath(); ctx.ellipse(x + 12, gy - 100, 10, 4, 0.4, 0, Math.PI * 2); ctx.fill();
        });
        // lily pads
        ctx.fillStyle = "#27ae60";
        ctx.beginPath(); ctx.ellipse(-10, gy + 8, 22, 8, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(18, gy + 12, 16, 6, -0.3, 0, Math.PI * 2); ctx.fill();
        return;
      }
      if (theme === "picnic") {
        // picnic blanket posts as baskets
        [-46, 46].forEach(function(x) {
          ctx.fillStyle = "#c9843a";
          roundRect(x - 22, gy - 40, 44, 36, 6); ctx.fill();
          ctx.fillStyle = "#a86b2d";
          roundRect(x - 26, gy - 52, 52, 14, 6); ctx.fill();
          ctx.strokeStyle = "#8b5a2b";
          ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(x, gy - 52, 16, Math.PI, 0); ctx.stroke();
        });
        // watermelon slice
        ctx.fillStyle = "#e74c3c";
        ctx.beginPath(); ctx.moveTo(-18, gy - 8); ctx.arc(0, gy - 8, 22, 0.2, Math.PI - 0.2); ctx.closePath(); ctx.fill();
        ctx.fillStyle = "#2ecc71";
        ctx.beginPath(); ctx.arc(0, gy - 8, 22, 0.2, Math.PI - 0.2); ctx.lineWidth = 5; ctx.strokeStyle = "#27ae60"; ctx.stroke();
        return;
      }
      if (theme === "night") {
        lantern(-46, gy); lantern(46, gy);
        ctx.fillStyle = "#f4c430";
        for (var i = 0; i < 5; i++) {
          var fx = -30 + i * 15;
          var fy = gy - 40 - Math.sin((state.t || 0) * 4 + i) * 8;
          ctx.globalAlpha = 0.75;
          ctx.beginPath(); ctx.arc(fx, fy, 3, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;
        return;
      }
      if (theme === "space") {
        [-48, 48].forEach(function(x) {
          ctx.fillStyle = "#8ea0b8";
          roundRect(x - 14, gy - 140, 28, 148, 8); ctx.fill();
          ctx.fillStyle = "#c5d3e6";
          roundRect(x - 10, gy - 130, 20, 40, 6); ctx.fill();
          ctx.fillStyle = "#7ad0ff";
          ctx.beginPath(); ctx.arc(x, gy - 150, 16, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = "#f4c430";
          ctx.beginPath(); ctx.arc(x, gy - 150, 6, 0, Math.PI * 2); ctx.fill();
        });
        // little planet
        ctx.fillStyle = "#9b59b6";
        ctx.beginPath(); ctx.arc(0, gy - 8, 14, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = "#d2b4de";
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.ellipse(0, gy - 8, 22, 6, -0.3, 0, Math.PI * 2); ctx.stroke();
        return;
      }
      // hills / default: wooden posts (keep rainbow accent)
      var post = style === "rainbow" ? "#9b59b6" : "#8b5a2b";
      var beam = style === "rainbow" ? "#f4c430" : "#c9843a";
      ctx.fillStyle = post;
      roundRect(-48, gy - 150, 18, 168, 6); ctx.fill();
      roundRect(30, gy - 150, 18, 168, 6); ctx.fill();
      ctx.fillStyle = beam;
      roundRect(-54, gy - 168, 108, 36, 10); ctx.fill();
      if (style === "rainbow") {
        var cols = ["#e74c3c","#f4c430","#2ecc71","#3498db","#9b59b6"];
        for (var i = 0; i < cols.length; i++) {
          ctx.fillStyle = cols[i];
          ctx.fillRect(-50 + i * 20, gy - 166, 20, 8);
        }
      } else {
        // wildflowers on posts
        ["#e74c3c","#f4c430","#9b59b6"].forEach(function(c, i) {
          ctx.fillStyle = c;
          ctx.beginPath(); ctx.arc(-39 + i * 4, gy - 156, 4, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(39 + i * 3, gy - 158, 4, 0, Math.PI * 2); ctx.fill();
        });
      }
    }

    function drawGate(g, gy) {
      const smash = g.smashed ? Math.min(1, g.smashT * 2.2) : 0;
      var style = g.style || "normal";
      var scale = style === "tiny" ? 0.72 : style === "wide" ? 1.18 : 1;
      var theme = g.theme || gateThemeId();
      ctx.save();
      ctx.translate(g.x + (g.hit ? Math.sin(state.t * 40) * 4 : 0), 0);
      ctx.globalAlpha = 1 - smash;
      ctx.rotate(smash * 0.4);
      ctx.scale(scale, scale);
      drawGateSupports(theme, gy, style);
      // Shared problem board (readable on every trail)
      var boardStroke = theme === "space" ? "#7ad0ff" : theme === "candy" ? "#ff7eb3" : theme === "night" ? "#f4c430" : style === "rainbow" ? "#9b59b6" : "#d7b07a";
      ctx.fillStyle = theme === "space" ? "#1b2a41" : "#fff8e7";
      roundRect(-70, gy - 128, 140, 70, 12);
      ctx.fill();
      ctx.strokeStyle = boardStroke;
      ctx.lineWidth = 3;
      roundRect(-70, gy - 128, 140, 70, 12);
      ctx.stroke();
      if (!g.fallNums || !g.fallNums.length) {
        ctx.fillStyle = theme === "space" ? "#e8f4ff" : "#1b2a41";
        ctx.font = "800 22px Nunito, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(g.problem.text, 0, gy - 98);
      }
      ctx.font = "700 16px Fredoka, sans-serif";
      ctx.fillStyle = theme === "space" ? "#9ec9e8" : "#5a6b7d";
      ctx.fillText("= ?", 0, gy - 74);
      if (g.fallNums) {
        g.fallNums.forEach(function(n) {
          ctx.save();
          ctx.globalAlpha = Math.max(0, n.life);
          ctx.translate(n.x, gy + n.y);
          ctx.rotate(n.rot || 0);
          ctx.fillStyle = theme === "space" ? "#e8f4ff" : "#1b2a41";
          ctx.font = "800 22px Nunito, sans-serif";
          ctx.fillText(n.ch, 0, 0);
          ctx.restore();
        });
      }
      ctx.restore();
    }

    function drawParticles(dt) {
      state.particles = state.particles.filter(function(p) { return p.life > 0; });
      state.particles.forEach(function(p) {
        p.life -= dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 520 * dt;
        ctx.globalAlpha = Math.max(0, p.life * 2);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      });
    }

    function tickTrail(dt) {
      state.winT += dt;
      if (state.lookX) state.lookX *= Math.max(0, 1 - dt * 2.2);
      if (state.birdT > 0) state.birdT -= dt;
      if (state.blinkT > 0) state.blinkT -= dt;
      else if ((state.invuln || 0) <= 0 && (state.flash || 0) <= 0 && Math.random() < dt * 0.35) state.blinkT = 0.12;
      if (state.arriving > 0) state.arriving -= dt;
      if (state.gate && state.gate.fallNums) {
        state.gate.fallNums.forEach(function(n) {
          n.life -= dt;
          n.x += n.vx * dt;
          n.y += n.vy * dt;
          n.vy += 420 * dt;
          n.rot += dt * 3;
        });
      }
      if (!state.muted && !state.paused && (state.screen === "play" || state.screen === "bonus")) {
        state.musicAcc += dt;
        if (state.musicAcc > 0.42) {
          state.musicAcc = 0;
          var roots = [262, 294, 330, 349, 392, 220];
          var r = roots[(state.biome || 0) % roots.length];
          var seq = [0, 2, 4, 7, 4, 2];
          state.musicStep = (state.musicStep || 0) + 1;
          beep(r * Math.pow(2, seq[state.musicStep % seq.length] / 12), 0.16, "sine", 0.02);
        }
      }
    }

    let last = performance.now();
    function frame(now) {
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      const w = viewW(), h = viewH(), gy = groundY();

      drawSky(w, h);
      state.clouds.forEach(function(c) { drawCloud(c, state.scroll); });
      drawHills(w, h, gy, state.scroll);
      state.trees.forEach(function(t) { drawTree(t, state.scroll, gy); });
      drawLandmark(w, h, gy, state.scroll);
      drawGround(w, h, gy, state.scroll);

      if (state.paused && (state.screen === "play" || state.screen === "bonus")) {
        if (state.gate) drawGate(state.gate, gy);
        drawBuddy(buddyDrawX(), gy);
        drawHero(state.heroX, gy);
        drawBird(state.heroX, gy);
      } else if (state.screen === "bonus") {
        state.t += dt;
        state.runPhase += dt * 3;
        state.bonusTime -= dt;
        tickTrail(dt);
        if (state.gate) drawGate(state.gate, gy);
        drawBuddy(buddyDrawX(), gy);
        drawHero(state.heroX, gy);
        drawBird(state.heroX, gy);
        banner.textContent = (state.gate ? state.gate.problem.text + " = ?" : "") + "   " + Math.max(0, Math.ceil(state.bonusTime)) + "s";
        banner.classList.add("show");
        if (state.bonusTime <= 0 && state.screen === "bonus") {
          speakLine("Time's up!");
          state.screen = "end";
          setTimeout(endGame, 400);
        }
      } else if (state.screen === "play") {
        state.t += dt;
        tickTrail(dt);
        var move = (state.arriving > 0) ? state.speed * 0.35 : state.speed;
        state.scroll += move * dt;
        state.runPhase += dt * (state.grounded ? 6.5 : 3);
        if (state.invuln > 0) state.invuln -= dt;
        if (state.flash > 0) state.flash -= dt;
        if (state.nextGateIn > 0) state.nextGateIn -= dt;

        state.heroVy += (state.jumpArc ? 1320 : 1750) * dt;
        state.heroY += state.heroVy * dt;
        if (state.heroY > 0) {
          state.heroY = 0;
          state.heroVy = 0;
          state.grounded = true;
          state.jumpArc = false;
        }

        if (state.jumpArc) {
          state.flipAng = Math.min(Math.PI * 2, state.flipAng + 7.6 * dt);
        }

        if (state.answered && state.rushing && state.gate && !state.gate.smashed) {
          state.heroX = Math.min(state.heroX + 90 * dt, 220);
          var dist = state.gate.x - state.heroX;
          if (!state.didJump && dist < 210 && dist > 40) jump();
          // Smash only mid-jump over the gate — never by running into it.
          if (state.didJump && state.jumpArc && state.heroY < -40 && dist <= 70) {
            smashGate(true);
            state.rushing = false;
          }
        } else if (state.heroX > 180) {
          state.heroX = Math.max(180, state.heroX - 260 * dt);
          if (state.heroX <= 180.5) {
            state.heroX = 180;
            state.rushing = false;
          }
        }

        if (state.gate) {
          var closeIn = (state.answered && state.rushing && !state.gate.smashed) ? 280 : 0;
          state.gate.x -= (state.speed + closeIn) * dt;
          if (state.gate.smashed) state.gate.smashT += dt;
          if (!state.gate.smashed && !state.answered && (state.heroX + 28) >= (state.gate.x - 48)) bump();
          const readyForNext = state.gate.smashed && state.gate.smashT > 0.45 && state.nextGateIn <= 0 && state.heroX <= 200 && state.arriving <= 0;
          if (state.gate.x < -160 || readyForNext) {
            state.gate = null;
            if (state.lives > 0 && state.arriving <= 0) spawnGate();
          } else {
            drawGate(state.gate, gy);
          }
        } else if (state.lives > 0 && state.nextGateIn <= 0 && state.arriving <= 0) {
          spawnGate();
        }

        drawBuddy(buddyDrawX(), gy);
        drawHero(state.heroX, gy);
        drawBird(state.heroX, gy);
        drawParticles(dt);
        if (state.arriving > 0) {
          // Soft wash only — place title lives on drawArrival card (no ghost rename).
          ctx.fillStyle = "rgba(255,247,209," + (Math.min(0.28, state.arriving * 0.12)) + ")";
          ctx.fillRect(0, 0, w, h);
        }
        if (state.flash > 0) {
          ctx.fillStyle = "rgba(220,40,40," + (state.flash * 0.28) + ")";
          ctx.fillRect(0, 0, w, h);
        }
      } else {
        state.t += dt;
        state.scroll += 22 * dt;
        state.runPhase += dt * 4;
        tickTrail(dt);
        drawBuddy(buddyDrawX(), gy);
        drawHero(state.heroX, gy);
      }

      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  

// ===== TRAIL LANDMARKS (game-c) =====

    (function trailPlayFix() {
      /* PLACES already set to full trail in core */
      var SMALL = { slide: 1, dance: 1, highfive: 1 };
      if (state.buddyX == null) state.buddyX = 112;
      function homeX() {
        var w = (typeof viewW === "function") ? viewW() : 800;
        return Math.max(64, Math.min(170, w * 0.2));
      }

      function duck(dx, dy, flip) {
        ctx.save();
        ctx.translate(dx, dy);
        ctx.scale(flip || 1, 1);
        ctx.fillStyle = "#fff6d8";
        ctx.beginPath();
        ctx.ellipse(0, 2, 16, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#f1c40f";
        ctx.beginPath();
        ctx.arc(13, -5, 7.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#e67e22";
        ctx.beginPath();
        ctx.moveTo(19, -6);
        ctx.lineTo(28, -3);
        ctx.lineTo(19, 0);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#1b2a41";
        ctx.beginPath();
        ctx.arc(15, -7, 1.7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#2c3e50";
        ctx.beginPath();
        ctx.ellipse(-4, 6, 5, 2, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      function worldX(w, scroll, seed) {
        var span = w + 280;
        return ((seed - scroll * 0.55) % span + span) % span - 80;
      }

      function drawPicnic(w, h, gy, scroll) {
        var x = worldX(w, scroll, 420);
        var y = gy + 4;
        ctx.fillStyle = "#c0392b";
        ctx.fillRect(x - 50, y - 6, 100, 10);
        ctx.fillStyle = "#fff8e7";
        for (var i = 0; i < 7; i++) {
          for (var j = 0; j < 5; j++) {
            if ((i + j) % 2 === 0) ctx.fillRect(x - 48 + i * 14, y - 4 + j * 2, 14, 2);
          }
        }
        ctx.fillStyle = "#d4a017";
        ctx.beginPath();
        ctx.ellipse(x + 26, y - 16, 16, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#8b5a2b";
        ctx.fillRect(x + 18, y - 26, 16, 10);
      }

      function drawBetterPond(w, h, gy, scroll) {
        var x = worldX(w, scroll, 680);
        ctx.fillStyle = "#245a38";
        ctx.beginPath();
        ctx.ellipse(x, gy + 22, 168, 38, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#15608a";
        ctx.beginPath();
        ctx.ellipse(x, gy + 18, 150, 28, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#3db7d4";
        ctx.beginPath();
        ctx.ellipse(x - 24, gy + 8, 78, 9, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#2e8b3a";
        ctx.lineWidth = 4;
        ctx.lineCap = "round";
        for (var r = 0; r < 6; r++) {
          var rx = x - 150 + r * 12;
          ctx.beginPath();
          ctx.moveTo(rx, gy + 10);
          ctx.quadraticCurveTo(rx - 6, gy - 16, rx + 3, gy - 32);
          ctx.stroke();
        }
        duck(x - 40, gy + 6 + Math.sin(state.t * 2) * 2, 1);
        duck(x + 48, gy + 10 + Math.sin(state.t * 2 + 1.1) * 2, -1);
      }

      function treeScrollX(w, scroll) {
        var span = w + 240;
        var trees = state.trees || [];
        var tree = trees[3] || trees[0];
        if (!tree) return w * 0.72;
        return ((tree.x - scroll * 0.55) % span + span) % span - 60;
      }

      function drawBetterTreehouse(w, h, gy, scroll) {
        var x = treeScrollX(w, scroll || 0);
        ctx.fillStyle = "#6b3a16";
        ctx.fillRect(x - 10, gy - 128, 20, 128);
        ctx.fillStyle = "#2e8b3a";
        ctx.beginPath();
        ctx.arc(x, gy - 158, 58, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#1f7a32";
        ctx.beginPath();
        ctx.arc(x - 28, gy - 140, 28, 0, Math.PI * 2);
        ctx.arc(x + 30, gy - 138, 26, 0, Math.PI * 2);
        ctx.fill();
        var hx = x + 8, hy = gy - 100;
        ctx.fillStyle = "#c9843a";
        ctx.fillRect(hx, hy, 56, 40);
        ctx.fillStyle = "#8b3a1a";
        ctx.beginPath();
        ctx.moveTo(hx - 8, hy + 4);
        ctx.lineTo(hx + 28, hy - 18);
        ctx.lineTo(hx + 64, hy + 4);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#7ec8ff";
        ctx.fillRect(hx + 8, hy + 12, 16, 14);
        ctx.strokeStyle = "#5d3a1a";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(hx + 16, hy + 12);
        ctx.lineTo(hx + 16, hy + 26);
        ctx.moveTo(hx + 8, hy + 19);
        ctx.lineTo(hx + 24, hy + 19);
        ctx.stroke();
        ctx.fillStyle = "#6b3a16";
        ctx.fillRect(hx + 34, hy + 18, 12, 22);
        ctx.strokeStyle = "#8b5a2b";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(hx + 8, hy + 40);
        ctx.lineTo(hx - 8, gy);
        ctx.moveTo(hx + 20, hy + 40);
        ctx.lineTo(hx + 4, gy);
        ctx.stroke();
        ctx.lineWidth = 2;
        for (var s = 0; s < 5; s++) {
          var t = (s + 1) / 6;
          var y1 = hy + 40 + (gy - hy - 40) * t;
          ctx.beginPath();
          ctx.moveTo(hx + 8 - 16 * t, y1);
          ctx.lineTo(hx + 20 - 16 * t, y1);
          ctx.stroke();
        }
      }

      function drawBarn(w, h, gy, scroll) {
        var x = worldX(w, scroll, 900);
        ctx.fillStyle = "#c0392b";
        ctx.fillRect(x - 50, gy - 90, 100, 90);
        ctx.fillStyle = "#8b1e13";
        ctx.beginPath();
        ctx.moveTo(x - 62, gy - 88);
        ctx.lineTo(x, gy - 130);
        ctx.lineTo(x + 62, gy - 88);
        ctx.fill();
        ctx.fillStyle = "#fff3c4";
        ctx.fillRect(x - 16, gy - 48, 18, 22);
        ctx.fillStyle = "#5d3a1a";
        ctx.fillRect(x + 18, gy - 36, 16, 36);
        ctx.strokeStyle = "#8b5a2b";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(x - 90, gy - 22);
        ctx.lineTo(x - 52, gy - 22);
        ctx.stroke();
        drawCowAt(x - 78, gy + 2);
      }

      function drawCowAt(x, y) {
        ctx.fillStyle = "rgba(0,0,0,0.14)";
        ctx.beginPath();
        ctx.ellipse(x, y + 16, 28, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#f7f4ea";
        ctx.beginPath();
        ctx.ellipse(x, y - 18, 28, 16, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#2b2b2b";
        ctx.beginPath();
        ctx.ellipse(x - 10, y - 20, 8, 6, 0, 0, Math.PI * 2);
        ctx.ellipse(x + 12, y - 14, 7, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#f7f4ea";
        ctx.fillRect(x - 18, y - 8, 8, 22);
        ctx.fillRect(x + 10, y - 8, 8, 22);
        ctx.fillStyle = "#2b2b2b";
        ctx.fillRect(x - 18, y + 10, 8, 6);
        ctx.fillRect(x + 10, y + 10, 8, 6);
        ctx.fillStyle = "#f7f4ea";
        ctx.beginPath();
        ctx.arc(x + 26, y - 28, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#f4b6c2";
        ctx.beginPath();
        ctx.ellipse(x + 32, y - 24, 8, 5, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#1b2a41";
        ctx.beginPath();
        ctx.arc(x + 30, y - 31, 1.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#e8d9a8";
        ctx.beginPath();
        ctx.arc(x + 20, y - 38, 4, 0, Math.PI * 2);
        ctx.arc(x + 30, y - 40, 3.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#c9843a";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x - 26, y - 12);
        ctx.quadraticCurveTo(x - 38, y - 6, x - 30, y + 4);
        ctx.stroke();
      }

      function drawNight(w, h, gy, scroll) {
        ctx.fillStyle = "rgba(12, 18, 48, 0.18)";
        ctx.fillRect(0, 0, w, gy);
        ctx.fillStyle = "#f7e7a1";
        ctx.beginPath();
        ctx.arc(w * 0.82, 70, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(12,18,48,0.18)";
        ctx.beginPath();
        ctx.arc(w * 0.84, 64, 16, 0, Math.PI * 2);
        ctx.fill();
        for (var i = 0; i < 16; i++) {
          var fx = worldX(w, scroll, 80 + i * 97);
          var fy = 50 + (i * 37) % 90 + Math.sin(state.t * 3 + i) * 6;
          ctx.fillStyle = "rgba(255, 230, 90, " + (0.35 + 0.45 * Math.abs(Math.sin(state.t * 5 + i))) + ")";
          ctx.beginPath();
          ctx.arc(fx, fy, 3.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      function drawArrival(w, h) {
        if (!(state.arriveFlash > 0)) return;
        var a = Math.min(1, state.arriveFlash / 0.35);
        if (state.arriveFlash < 0.45) a = state.arriveFlash / 0.45;
        var boxW = Math.min(420, w * 0.72);
        var boxH = 108;
        var x = Math.round((w - boxW) / 2);
        var y = Math.round(h * 0.22);
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, a));
        // Soft card — less muddy than a full dark slab mid-screen
        ctx.fillStyle = "rgba(255, 248, 231, 0.94)";
        roundRect(x, y, boxW, boxH, 18);
        ctx.fill();
        ctx.strokeStyle = "#f4c430";
        ctx.lineWidth = 4;
        roundRect(x, y, boxW, boxH, 18);
        ctx.stroke();
        var place = (typeof currentPlace === "function" && currentPlace()) ? currentPlace() : { name: "New place", arrive: "You made it!" };
        ctx.textAlign = "center";
        ctx.fillStyle = "#1b2a41";
        ctx.font = "800 30px Nunito, sans-serif";
        ctx.fillText(place.name, w / 2, y + 44);
        ctx.fillStyle = "#5a6b7d";
        ctx.font = "700 16px Fredoka, sans-serif";
        ctx.fillText(place.arrive || ("Welcome to " + place.name), w / 2, y + 74);
        ctx.fillStyle = "#c9843a";
        ctx.font = "700 13px Nunito, sans-serif";
        ctx.fillText("Trail stamp earned!", w / 2, y + 96);
        ctx.restore();
      }

      var rawTheme = biomeTheme;
      biomeTheme = function() {
        var b = state.biome || 0;
        if (b === 5) return { sky0: "#f4a25a", sky1: "#ffd08a", sky2: "#f3e0a8", sun: "#ffcf66", hillA: "#c4b05a", hillB: "#9a8a3a", grass: "#7a9a3a", grassTop: "#c4d46a", dirt: "#6b3a18", night: false };
        if (b === 6) return { sky0: "#ff9ad2", sky1: "#ffd0f0", sky2: "#ffe8c8", sun: "#ff8ab8", hillA: "#ff9ac8", hillB: "#f07ab0", grass: "#f48cc0", grassTop: "#ffb6d8", dirt: "#c45a8a", night: false };
        if (b === 7) return { sky0: "#c8e4ff", sky1: "#eef7ff", sky2: "#d8ecff", sun: "#fff6d0", hillA: "#d8e8f4", hillB: "#c0d4e4", grass: "#eef6ff", grassTop: "#ffffff", dirt: "#9ab0c4", night: false };
        if (b === 8) {
          return { sky0: "#1a2744", sky1: "#2c3e6b", sky2: "#3d4f7a", sun: "#f4e4a6", hillA: "#2a3d2e", hillB: "#1e2e22", grass: "#2f4a34", grassTop: "#3d5c42", dirt: "#1b1520", night: true };
        }
        return rawTheme();
      };

      function drawPumpkinPatch(w, h, gy, scroll) {
        var x = worldX(w, scroll, 760);
        ctx.fillStyle = "#8b5a2b";
        ctx.fillRect(x - 8, gy - 78, 10, 78);
        ctx.fillStyle = "#c9843a";
        ctx.beginPath();
        ctx.moveTo(x - 28, gy - 78);
        ctx.lineTo(x - 3, gy - 58);
        ctx.lineTo(x + 22, gy - 78);
        ctx.lineTo(x + 22, gy - 52);
        ctx.lineTo(x - 28, gy - 52);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#ffe0bd";
        ctx.beginPath();
        ctx.arc(x - 3, gy - 92, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#5d3a1a";
        ctx.fillRect(x - 18, gy - 100, 8, 6);
        ctx.fillRect(x + 4, gy - 100, 8, 6);
        ctx.beginPath();
        ctx.arc(x - 8, gy - 94, 1.6, 0, Math.PI * 2);
        ctx.arc(x + 2, gy - 94, 1.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#5d3a1a";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x - 3, gy - 88, 4, 0.15, Math.PI - 0.15);
        ctx.stroke();
        function pumpkin(px, py, s) {
          ctx.fillStyle = "#e67e22";
          ctx.beginPath();
          ctx.ellipse(px, py, 16 * s, 12 * s, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#d35400";
          ctx.beginPath();
          ctx.ellipse(px - 7 * s, py, 8 * s, 11 * s, 0, 0, Math.PI * 2);
          ctx.ellipse(px + 7 * s, py, 8 * s, 11 * s, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#2e8b3a";
          ctx.fillRect(px - 2, py - 16 * s, 3, 7 * s);
        }
        pumpkin(x - 36, gy - 8, 1);
        pumpkin(x + 28, gy - 6, 0.85);
        pumpkin(x + 52, gy - 4, 0.7);
      }

      function drawCandyTrail(w, h, gy, scroll) {
        var x = worldX(w, scroll, 740);
        ctx.fillStyle = "#ff4d8d";
        ctx.fillRect(x - 6, gy - 92, 8, 92);
        ctx.fillStyle = "#fff";
        for (var i = 0; i < 6; i++) ctx.fillRect(x - 6, gy - 88 + i * 14, 8, 6);
        ctx.fillStyle = "#ff4d8d";
        ctx.beginPath();
        ctx.arc(x - 2, gy - 118, 26, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(x - 2, gy - 118, 16, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = "#7c4dff";
        ctx.beginPath();
        ctx.arc(x + 40, gy - 18, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#2ecc71";
        ctx.beginPath();
        ctx.arc(x + 62, gy - 12, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffd93d";
        ctx.beginPath();
        ctx.arc(x - 40, gy - 14, 10, 0, Math.PI * 2);
        ctx.fill();
      }

      function drawSnowHill(w, h, gy, scroll) {
        ctx.fillStyle = "rgba(255,255,255,0.55)";
        ctx.fillRect(0, gy - 8, w, 18);
        var x = worldX(w, scroll, 700);
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(x, gy - 16, 18, 0, Math.PI * 2);
        ctx.arc(x, gy - 40, 14, 0, Math.PI * 2);
        ctx.arc(x, gy - 60, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#1b2a41";
        ctx.beginPath();
        ctx.arc(x - 4, gy - 62, 1.5, 0, Math.PI * 2);
        ctx.arc(x + 4, gy - 62, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#e67e22";
        ctx.beginPath();
        ctx.moveTo(x, gy - 58);
        ctx.lineTo(x + 12, gy - 56);
        ctx.lineTo(x, gy - 54);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "#8b5a2b";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x - 12, gy - 40);
        ctx.lineTo(x - 26, gy - 50);
        ctx.moveTo(x + 12, gy - 40);
        ctx.lineTo(x + 26, gy - 48);
        ctx.stroke();
        ctx.fillStyle = "#2e6a44";
        ctx.beginPath();
        ctx.moveTo(x + 70, gy);
        ctx.lineTo(x + 86, gy - 54);
        ctx.lineTo(x + 102, gy);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.moveTo(x + 74, gy - 40);
        ctx.lineTo(x + 86, gy - 58);
        ctx.lineTo(x + 98, gy - 40);
        ctx.closePath();
        ctx.fill();
      }

      var oldLandmark = drawLandmark;
      drawLandmark = function(w, h, gy, scroll) {
        var b = state.biome || 0;
        if (b === 1 || b === 2 || b === 3 || b === 4 || b === 5 || b === 6 || b === 7) return;
        oldLandmark(w, h, gy, scroll);
      };

      var oldGround = drawGround;
      drawGround = function(w, h, gy, scroll) {
        oldGround(w, h, gy, scroll);
        var b = state.biome || 0;
        if (b === 1) drawPicnic(w, h, gy, scroll);
        if (b === 2) drawBetterPond(w, h, gy, scroll);
        if (b === 3) drawBetterTreehouse(w, h, gy, scroll);
        if (b === 4) drawBarn(w, h, gy, scroll);
        if (b === 5) drawPumpkinPatch(w, h, gy, scroll);
        if (b === 6) drawCandyTrail(w, h, gy, scroll);
        if (b === 7) drawSnowHill(w, h, gy, scroll);
        if (b === 8) drawNight(w, h, gy, scroll);
        drawArrival(w, h);
      };

      var rawJump = jump;
      jump = function() {
        if (state.didJump) return;
        if (!state.gate || state.gate.smashed) return;
        var dist = state.gate.x - (state.heroX || 180);
        if (dist > 360 || dist <= -10) return;
        // Never hand the clear to a buddy slide/skim — hero jumps over.
        state.buddyRush = false;
        rawJump();
      };

      var oldChoose = chooseAnswer;
      chooseAnswer = function(i) {
        var was = state.answered;
        oldChoose(i);
        if (state.answered && !was && state.screen === "play") {
          state.buddyHop = 1.2;
          state.buddyRush = false;
        }
      };

      buddyDrawX = function() {
        if (state.buddyRush) return state.buddyX || 112;
        var bx = (state.heroX || 180) - 68;
        if (state.gate && !state.gate.smashed) bx = Math.min(bx, state.gate.x - 110);
        return Math.max(72, bx);
      };

      function drawBatWings(x, gy) {
        var duck = state.sliding ? 16 : 0;
        var dance = state.dancing ? Math.sin(state.t * 14) * 8 : 0;
        var y = gy + (state.heroY || 0) - 8 + duck;
        var idle = (state.screen === "menu" || state.screen === "end");
        var bob = Math.sin(state.runPhase * 2) * (state.grounded ? 3 : 0) + (idle ? Math.sin(state.t * 2) * 2 : 0);
        var flap = Math.sin(state.t * 8) * 5;
        ctx.save();
        ctx.translate(x + dance, 0);
        if (state.jumpArc) {
          ctx.translate(x, gy + (state.heroY || 0) - 48);
          ctx.rotate(state.flipAng || 0);
          ctx.translate(-x, -(gy + (state.heroY || 0) - 48));
        }
        function wing(side) {
          ctx.save();
          ctx.translate(x + side * 12, y - 50 + bob);
          ctx.scale(side, 1);
          ctx.rotate(-0.12 + flap * 0.012);
          ctx.fillStyle = "#8f3a1c";
          ctx.beginPath();
          ctx.moveTo(0, 4);
          ctx.quadraticCurveTo(14, -32, 22, -50);
          ctx.quadraticCurveTo(30, -44, 36, -16);
          ctx.quadraticCurveTo(46, 6, 48, 24);
          ctx.quadraticCurveTo(38, 12, 34, 28);
          ctx.quadraticCurveTo(26, 12, 22, 30);
          ctx.quadraticCurveTo(14, 12, 10, 24);
          ctx.quadraticCurveTo(6, 10, 0, 8);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = "#c45a2a";
          ctx.beginPath();
          ctx.moveTo(6, 6);
          ctx.quadraticCurveTo(16, -24, 22, -40);
          ctx.quadraticCurveTo(28, -14, 34, 8);
          ctx.quadraticCurveTo(24, 12, 8, 10);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = "#5c1e10";
          ctx.lineWidth = 2.2;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(0, 4);
          ctx.quadraticCurveTo(14, -32, 22, -50);
          ctx.moveTo(0, 4);
          ctx.quadraticCurveTo(20, -6, 36, -16);
          ctx.moveTo(0, 4);
          ctx.quadraticCurveTo(22, 6, 48, 24);
          ctx.moveTo(0, 4);
          ctx.lineTo(34, 28);
          ctx.moveTo(0, 4);
          ctx.lineTo(22, 30);
          ctx.stroke();
          ctx.restore();
        }
        wing(-1);
        wing(1);
        ctx.restore();
      }

      var rawCostume = costume;
      costume = function() {
        var c = rawCostume();
        if (c.id === "dragon") c.acc = "none";
        return c;
      };

      var rawDrawHero = drawHero;
      drawHero = function(x, gy) {
        var c = rawCostume();
        var dragon = c && c.id === "dragon";
        var dx = x, dy = gy;
        if (state.arriveFlash > 0 || state.dancing) {
          dy = gy - Math.abs(Math.sin(state.t * 10)) * 26;
          dx = x + Math.sin(state.t * 11) * 20;
        }
        if (dragon) drawBatWings(dx, dy);
        var rawEllipse = ctx.ellipse;
        var used = false;
        ctx.ellipse = function(ex, ey, rx, ry, rot, a0, a1) {
          if (!used && Math.abs(ey - (gy + 16)) < 1 && Math.abs(rx - 26) < 1) {
            used = true;
            var dance = state.dancing ? Math.sin(state.t * 14) * 8 : 0;
            return rawEllipse.call(ctx, ex + dx + dance, ey, rx, ry, rot, a0, a1);
          }
          return rawEllipse.apply(ctx, arguments);
        };
        rawDrawHero(dx, dy);
        ctx.ellipse = rawEllipse;
      };

      var oldDrawBuddy = drawBuddy;
      drawBuddy = function(x, gy) {
        var hop = 0;
        if (state.buddyHop > 0) hop = Math.sin(Math.min(1, state.buddyHop) * Math.PI) * 18;
        var bx = state.buddyX != null ? state.buddyX : x;
        oldDrawBuddy(bx, gy - hop);
      };

      function throwConfetti() {
        var w = (typeof viewW === "function") ? viewW() : 800;
        var h = (typeof viewH === "function") ? viewH() : 500;
        var colors = ["#f4c430", "#ff6b6b", "#4ecdc4", "#ffe66d", "#a29bfe", "#fd79a8", "#55efc4"];
        for (var i = 0; i < 42; i++) {
          state.particles.push({
            x: w * Math.random(),
            y: -10 - Math.random() * 80,
            vx: (Math.random() - 0.5) * 160,
            vy: 40 + Math.random() * 180,
            life: 1.2 + Math.random() * 0.8,
            color: colors[i % colors.length],
            r: 3 + Math.random() * 5
          });
        }
        if (typeof burst === "function") {
          burst(w * 0.5, h * 0.28, "#f4c430");
          burst(w * 0.3, h * 0.22, "#ff6b6b");
          burst(w * 0.7, h * 0.22, "#4ecdc4");
        }
      }

      if (typeof arriveAtNextPlace === "function") {
        var oldArrive = arriveAtNextPlace;
        arriveAtNextPlace = function() {
          oldArrive();
          state.arriveFlash = 2.6;
          state.arriving = 2.6;
          state.dancing = true;
          state.holdSpeed = state.speed;
          state.speed = 0;
          state.confettiT = 0;
          var toastEl = document.getElementById("toast");
          if (toastEl) toastEl.classList.remove("show");
          throwConfetti();
        };
      }

      var oldTick = tickTrail;
      tickTrail = function(dt) {
        if (state.buddyHop > 0) state.buddyHop -= dt;
        if (state.arriveFlash > 0) state.arriveFlash -= dt;
        if (state.arriveFlash > 0) {
          state.dancing = true;
          state.speed = 0;
          // One confetti burst at the start — no continuous spray over the title card.
        } else if (state.holdSpeed != null) {
          state.speed = state.holdSpeed;
          state.holdSpeed = null;
          state.dancing = false;
        }
        var pb = document.getElementById("problemBanner");
        var pn = document.getElementById("levelChip");
        if (pb) pb.style.visibility = (state.arriveFlash > 0.25) ? "hidden" : "";
        if (pn) pn.style.visibility = (state.arriveFlash > 0.25) ? "hidden" : "";
        var hx = homeX();
        if (!state.answered && !state.rushing) state.heroX = hx;
        state.heroX = Math.min(state.heroX || hx, Math.max(hx + 30, viewW() * 0.42));
        var home = (state.heroX || hx) - Math.min(68, hx * 0.45);
        // Buddy no longer smashes gates — hero must jump them.
        if (state.buddyRush) state.buddyRush = false;
        {
          if (state.buddyX == null) state.buddyX = home;
          state.buddyX += (home - state.buddyX) * Math.min(1, dt * 6);
          if (state.gate && !state.gate.smashed) state.buddyX = Math.min(state.buddyX, state.gate.x - 110);
        }
        oldTick(dt);
        var keep = homeX();
        if (!state.answered && !state.rushing) state.heroX = keep;
        state.heroX = Math.min(state.heroX || keep, viewW() * 0.46);
        if (state.answered && state.rushing && state.gate && !state.gate.smashed && !state.didJump) {
          jump();
        }
      };
    })();


// ===== SPACE / EXTRA TRAILS (game-d) =====

    (function extraTrailsMenu() {
      /* Keep consolidated PLACES (do not overwrite with short trail). */
      if (typeof refreshGoal === "function") refreshGoal();
      var jump = document.getElementById("trailJump");
      if (jump && jump.parentNode) jump.parentNode.removeChild(jump);
      if (typeof refreshGoal === "function") refreshGoal();

      if (!state.snowflakes) {
        state.snowflakes = [];
        for (var s = 0; s < 48; s++) {
          state.snowflakes.push({
            x: Math.random() * 1200,
            y: Math.random() * 700,
            r: 1.4 + Math.random() * 2.4,
            v: 28 + Math.random() * 42,
            w: 0.4 + Math.random() * 0.8
          });
        }
      }

      function treeX(t, scroll) {
        var span = viewW() + 240;
        return ((t.x - scroll * 0.55) % span + span) % span - 60;
      }

      function drawLollipopTree(t, scroll, gy) {
        var x = treeX(t, scroll);
        var y = gy + 8;
        var h = t.h || 90;
        var colors = ["#ff4d8d", "#7c4dff", "#ffd93d", "#2ecc71", "#ff6b6b", "#54a0ff"];
        var col = colors[(t.kind || 0) % colors.length];
        var col2 = colors[((t.kind || 0) + 2) % colors.length];
        ctx.fillStyle = "#fff8e7";
        ctx.fillRect(x - 4, y - h * 0.58, 8, h * 0.58);
        ctx.fillStyle = "#ff8ab8";
        for (var i = 0; i < 5; i++) ctx.fillRect(x - 4, y - h * 0.55 + i * 12, 8, 5);
        if ((t.kind || 0) % 2 === 0) {
          ctx.fillStyle = col;
          ctx.beginPath();
          ctx.arc(x, y - h * 0.66, 20 + h * 0.04, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#fff";
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.arc(x, y - h * 0.66, 12, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          ctx.fillStyle = col;
          ctx.beginPath();
          ctx.ellipse(x, y - h * 0.64, 16, 20, 0.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = col2;
          ctx.beginPath();
          ctx.ellipse(x, y - h * 0.64, 8, 11, 0.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      function drawSnowOnTree(t, scroll, gy) {
        var x = treeX(t, scroll);
        var y = gy + 8;
        var r = 22 + t.h * 0.08;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.ellipse(x, y - t.h * 0.55 - r * 0.4, r * 0.85, r * 0.34, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x - 16, y - t.h * 0.42 - 10, 14, 7, -0.2, 0, Math.PI * 2);
        ctx.ellipse(x + 16, y - t.h * 0.42 - 10, 14, 7, 0.2, 0, Math.PI * 2);
        ctx.fill();
      }

      function drawAsteroid(t, scroll, gy) {
        var x = treeX(t, scroll);
        var y = 90 + (t.h || 80) * 0.7;
        ctx.fillStyle = "#8a7a6a";
        ctx.beginPath();
        ctx.ellipse(x, y, 16 + (t.kind || 0) * 3, 12, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#6a5a4a";
        ctx.beginPath();
        ctx.arc(x - 6, y - 2, 4, 0, Math.PI * 2);
        ctx.arc(x + 5, y + 3, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      if (typeof drawTree === "function") {
        var rawDrawTree = drawTree;
        drawTree = function(t, scroll, gy) {
          var b = state.biome || 0;
          if (b === 6) { drawLollipopTree(t, scroll, gy); return; }
          if (b === 9) { drawAsteroid(t, scroll, gy); return; }
          rawDrawTree(t, scroll, gy);
          if (b === 7) drawSnowOnTree(t, scroll, gy);
        };
      }

      if (typeof biomeTheme === "function") {
        var prevTheme = biomeTheme;
        biomeTheme = function() {
          if ((state.biome || 0) === 9 || state.launching || (typeof currentPlace === "function" && currentPlace() && currentPlace().id === "space")) {
            return { sky0: "#050816", sky1: "#10183a", sky2: "#1a1448", sun: "#f4f0c8", hillA: "#141428", hillB: "#1c1c38", grass: "#12122a", grassTop: "#1a1a36", dirt: "#0a0a18", night: true };
          }
          return prevTheme();
        };
      }

      function drawCrow(cx, cy, flip) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(flip || 1, 1);
        ctx.fillStyle = "#1b1b1b";
        ctx.beginPath();
        ctx.ellipse(0, 0, 7, 4.2, -0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(6, -2, 4, 3.2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#f4c430";
        ctx.beginPath();
        ctx.moveTo(10, -2);
        ctx.lineTo(15, -0.5);
        ctx.lineTo(10, 1);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      function dressScarecrow(w, h, gy, scroll) {
        var span = w + 280;
        var x = ((760 - scroll * 0.55) % span + span) % span - 80;
        ctx.fillStyle = "#8b5a2b";
        ctx.fillRect(x - 4, gy - 100, 8, 100);
        ctx.fillStyle = "#c45a2a";
        ctx.fillRect(x - 18, gy - 78, 36, 34);
        ctx.fillStyle = "#6b3a16";
        ctx.fillRect(x - 18, gy - 48, 36, 5);
        ctx.strokeStyle = "#6b3a16";
        ctx.lineWidth = 6;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(x - 18, gy - 68);
        ctx.lineTo(x - 36, gy - 56);
        ctx.moveTo(x + 18, gy - 68);
        ctx.lineTo(x + 36, gy - 56);
        ctx.stroke();
        ctx.fillStyle = "#ffe0bd";
        ctx.beginPath();
        ctx.arc(x, gy - 92, 13, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#5d3a1a";
        ctx.beginPath();
        ctx.arc(x - 5, gy - 94, 1.6, 0, Math.PI * 2);
        ctx.arc(x + 5, gy - 94, 1.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#5d3a1a";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, gy - 88, 4, 0.2, Math.PI - 0.2);
        ctx.stroke();
        ctx.fillStyle = "#d4a017";
        ctx.beginPath();
        ctx.ellipse(x, gy - 100, 22, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(x - 12, gy - 118, 24, 18);
        ctx.fillStyle = "#c9843a";
        ctx.fillRect(x - 12, gy - 102, 24, 3);
        drawCrow(x - 36, gy - 62, 1);
        drawCrow(x + 36, gy - 62, -1);
      }

      function dressSnowman(w, h, gy, scroll) {
        var span = w + 280;
        var x = ((700 - scroll * 0.55) % span + span) % span - 80;
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(x, gy - 18, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x, gy - 46, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x, gy - 70, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#8b5a2b";
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(x - 14, gy - 46);
        ctx.lineTo(x - 30, gy - 56);
        ctx.moveTo(x + 14, gy - 46);
        ctx.lineTo(x + 30, gy - 54);
        ctx.stroke();
        ctx.fillStyle = "#1b1b1b";
        ctx.beginPath();
        ctx.arc(x, gy - 36, 2.6, 0, Math.PI * 2);
        ctx.arc(x, gy - 46, 2.6, 0, Math.PI * 2);
        ctx.arc(x, gy - 56, 2.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#c0392b";
        ctx.beginPath();
        ctx.ellipse(x, gy - 62, 18, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(x + 12, gy - 64, 9, 20);
        ctx.fillStyle = "#1b2a41";
        ctx.beginPath();
        ctx.arc(x - 4, gy - 73, 1.7, 0, Math.PI * 2);
        ctx.arc(x + 4, gy - 73, 1.7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#e67e22";
        ctx.beginPath();
        ctx.moveTo(x, gy - 70);
        ctx.lineTo(x + 13, gy - 68);
        ctx.lineTo(x, gy - 66);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#1b1b1b";
        ctx.fillRect(x - 16, gy - 84, 32, 7);
        ctx.fillRect(x - 11, gy - 106, 22, 22);
        ctx.fillStyle = "#c0392b";
        ctx.fillRect(x - 11, gy - 86, 22, 3);
      }

      function drawFallingSnow(w, h, dt) {
        var flakes = state.snowflakes || [];
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        for (var i = 0; i < flakes.length; i++) {
          var f = flakes[i];
          f.y += f.v * (dt || 0.016);
          f.x += Math.sin(state.t * f.w + i) * 0.6;
          if (f.y > h + 8) { f.y = -8; f.x = Math.random() * w; }
          ctx.beginPath();
          ctx.arc(f.x % (w + 20), f.y, f.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      function drawSpaceScene(w, h, gy, scroll) {
        ctx.fillStyle = "#050816";
        ctx.fillRect(0, 0, w, h);
        for (var i = 0; i < 40; i++) {
          var sx = (i * 97 + scroll * 0.12) % w;
          var sy = 16 + (i * 53) % (h - 30);
          ctx.fillStyle = "rgba(255,255,230," + (0.35 + 0.55 * Math.abs(Math.sin(state.t * 3 + i))) + ")";
          ctx.beginPath();
          ctx.arc(sx, sy, i % 5 === 0 ? 2.2 : 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = "#3d7dff";
        ctx.beginPath();
        ctx.arc(w * 0.82, 70, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#2ecc71";
        ctx.beginPath();
        ctx.arc(w * 0.78, 66, 10, 0.2, 2.2);
        ctx.fill();
        ctx.fillStyle = "#f4c430";
        ctx.beginPath();
        ctx.arc(90, 58, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#12122a";
        ctx.fillRect(0, gy + 8, w, h);
        ctx.fillStyle = "#1a1a36";
        ctx.fillRect(0, gy, w, 12);
      }

      function drawSuit(px, py, suited, jet, blast) {
        if (!suited && !jet && !blast) return;
        ctx.save();
        ctx.translate(px, py);
        if (jet || suited) {
          ctx.fillStyle = "#cfd8e6";
          ctx.fillRect(-20, -62, 10, 28);
          ctx.fillRect(10, -62, 10, 28);
          ctx.fillStyle = "#8a93a6";
          ctx.fillRect(-18, -58, 6, 20);
          ctx.fillRect(12, -58, 6, 20);
        }
        if (blast) {
          ctx.fillStyle = "#ff8a3c";
          ctx.beginPath();
          ctx.moveTo(-16, -34);
          ctx.lineTo(-12, -34 + 18 + Math.random() * 10);
          ctx.lineTo(-8, -34);
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(8, -34);
          ctx.lineTo(12, -34 + 18 + Math.random() * 10);
          ctx.lineTo(16, -34);
          ctx.fill();
          ctx.fillStyle = "#ffe66d";
          ctx.beginPath();
          ctx.moveTo(-14, -34);
          ctx.lineTo(-12, -34 + 10);
          ctx.lineTo(-10, -34);
          ctx.fill();
        }
        if (suited) {
          ctx.fillStyle = "#eef3ff";
          ctx.beginPath();
          ctx.ellipse(0, -58, 16, 20, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#7ec8ff";
          ctx.beginPath();
          ctx.ellipse(3, -60, 10, 12, 0.1, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#d0d7e4";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(0, -58, 16, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
      }

      if (typeof drawGround === "function") {
        var rawGround = drawGround;
        drawGround = function(w, h, gy, scroll) {
          var b = state.biome || 0;
          if (b === 9 || (state.launching && state.launch > 3.2)) {
            drawSpaceScene(w, h, gy, scroll);
          } else {
            rawGround(w, h, gy, scroll);
          }
          if (b === 5) dressScarecrow(w, h, gy, scroll);
          if (b === 7) {
            dressSnowman(w, h, gy, scroll);
            drawFallingSnow(w, h, 0.016);
          }
        };
      }

      if (typeof drawHero === "function") {
        var innerHero = drawHero;
        drawHero = function(x, gy) {
          var sway = (state.arriveFlash > 0 || state.dancing) && !state.launching ? Math.sin(state.t * 11) * 20 : 0;
          var visX = (x + sway) * 2;
          var rawEll = ctx.ellipse;
          ctx.ellipse = function(ex, ey, rx, ry, rot, a0, a1) {
            if (Math.abs(rx - 26) < 1.5 && Math.abs(ry - 8) < 1.5) {
              return rawEll.call(ctx, visX, gy + 16, rx, ry, rot, a0, a1);
            }
            return rawEll.apply(ctx, arguments);
          };
          innerHero(x, gy);
          ctx.ellipse = rawEll;
          var suited = !!state.suited || (state.biome === 9);
          var jet = !!state.hasJet || (state.biome === 9);
          var blast = !!state.blasting || (state.launching && state.launch > 3.4);
          var dropSuit = state.suitY != null ? state.suitY : 0;
          var dropJet = state.jetY != null ? state.jetY : 0;
          if (state.launching && state.launch < 1.4) {
            drawSuit(visX, dropSuit, true, false, false);
          } else if (state.launching && state.launch < 2.6) {
            drawSuit(visX, gy + (state.heroY || 0), true, false, false);
            drawSuit(visX, dropJet, false, true, false);
          } else if (suited || jet || blast) {
            drawSuit(visX, gy + (state.heroY || 0), suited, jet, blast);
          }
        };
      }

      if (typeof arriveAtNextPlace === "function") {
        var prevArrive = arriveAtNextPlace;
        arriveAtNextPlace = function() {
          prevArrive();
          var p = (typeof currentPlace === "function") ? currentPlace() : null;
          if (p && p.id === "space") {
            state.dancing = false;
            state.arriveFlash = 0;
            state.launching = true;
            state.launch = 0;
            state.speed = 0;
            state.suited = false;
            state.hasJet = false;
            state.blasting = false;
            state.suitY = -40;
            state.jetY = -80;
            var toastEl = document.getElementById("toast");
            if (toastEl) toastEl.classList.remove("show");
          }
        };
      }

      if (typeof tickTrail === "function" && typeof bump === "function") {
        var rawTick = tickTrail;
        tickTrail = function(dt) {
          if (state.biome === 7 && state.snowflakes) {
            var h = (typeof viewH === "function") ? viewH() : 500;
            var w = (typeof viewW === "function") ? viewW() : 800;
            for (var i = 0; i < state.snowflakes.length; i++) {
              var f = state.snowflakes[i];
              f.y += f.v * dt;
              if (f.y > h + 10) { f.y = -10; f.x = Math.random() * w; }
            }
          }
          if (state.launching) {
            state.launch = (state.launch || 0) + dt;
            state.speed = 0;
            state.dancing = false;
            var w = (typeof viewW === "function") ? viewW() : 800;
            var target = w * 0.25;
            state.heroX += (target - (state.heroX || 180)) * Math.min(1, dt * 3);
            var gy = (typeof groundY === "function") ? groundY() : 360;
            if (state.launch < 1.4) {
              state.suitY += (gy - 8 - state.suitY) * Math.min(1, dt * 4);
            } else {
              state.suited = true;
              state.suitY = gy + (state.heroY || 0);
            }
            if (state.launch >= 1.4 && state.launch < 2.6) {
              state.jetY += (gy - 8 - state.jetY) * Math.min(1, dt * 4);
            }
            if (state.launch >= 2.6) state.hasJet = true;
            if (state.launch >= 3.4) {
              state.blasting = true;
              state.heroY = (state.heroY || 0) - 220 * dt;
            }
            if (state.launch >= 5.6) {
              state.launching = false;
              state.blasting = false;
              state.heroY = 0;
              state.suited = true;
              state.hasJet = true;
              state.biome = 9;
              if (state.holdSpeed != null) state.speed = state.holdSpeed;
              else state.speed = (typeof speedForLevel === "function") ? speedForLevel(state.level || 1) : 88;
              state.holdSpeed = null;
            }
            var pb = document.getElementById("problemBanner");
            var pn = document.getElementById("levelChip");
            if (pb) pb.style.visibility = "hidden";
            if (pn) pn.style.visibility = "hidden";
          }
          rawTick(dt);
          if ((state.biome || 0) !== 9 && !state.launching) {
            state.suited = false;
            state.hasJet = false;
            state.blasting = false;
          }
          if (state.launching) {
            state.speed = 0;
            var w2 = (typeof viewW === "function") ? viewW() : 800;
            state.heroX = Math.min(state.heroX || 180, w2 * 0.28);
          }
          if (state.screen !== "play") return;
          if (!state.gate || state.gate.smashed || state.answered || state.launching) return;
          var vis = (state.heroX || 180) * 2;
          if (vis + 24 >= state.gate.x - 40) bump();
        };
      }
    })();


// ===== SPACE SUIT DRAW FIX (game-e) =====

    (function wearTheSuit() {
      function on() {
        return !!(state.suited || state.biome === 9 || (state.launching && state.launch > 1.35));
      }
      if (typeof costume === "function") {
        var rawC = costume;
        costume = function() {
          var c = rawC();
          if (on() || state.wearSuit) {
            c.body = "#e8eef8";
            c.belly = "#b7c4d6";
            c.acc = "none";
          }
          return c;
        };
      }
      function visX(x) {
        var sway = (state.arriveFlash > 0 || state.dancing) && !state.launching ? Math.sin(state.t * 11) * 20 : 0;
        return (x + sway) * 2;
      }
      function visY(gy) {
        var bounce = (state.arriveFlash > 0 || state.dancing) && !state.launching ? Math.abs(Math.sin(state.t * 10)) * 26 : 0;
        var bob = Math.sin((state.runPhase || 0) * 2) * ((state.grounded !== false) ? 3 : 0);
        return gy + (state.heroY || 0) - bounce + bob;
      }
      if (typeof drawHero === "function") {
        var inner = drawHero;
        drawHero = function(x, gy) {
          var keepSuit = state.suited;
          var keepJet = state.hasJet;
          var keepBio = state.biome;
          var keepLaunch = state.launching;
          var keepBlast = state.blasting;
          state.wearSuit = !!(keepSuit || keepBio === 9 || (keepLaunch && state.launch > 1.35));
          state.suited = false;
          state.hasJet = false;
          state.blasting = false;
          if (keepBio === 9) state.biome = 8;
          state.launching = false;
          inner(x, gy);
          state.suited = keepSuit;
          state.hasJet = keepJet;
          state.biome = keepBio;
          state.launching = keepLaunch;
          state.blasting = keepBlast;
        };
      }
    })();


// ===== POLISH RESTORE (game-f) =====

    (function restoreTrailPolish() {
      if (typeof ctx !== "undefined" && ctx) {
        if (ctx.arc) {
          var rawArc = ctx.arc.bind(ctx);
          ctx.arc = function(x, y, r, a0, a1, ccw) {
            rawArc(x, y, Math.max(0.2, Math.abs(Number(r)) || 0.2), a0, a1, ccw);
          };
        }
        if (ctx.ellipse) {
          var rawEl = ctx.ellipse.bind(ctx);
          ctx.ellipse = function(x, y, rx, ry, rot, a0, a1, ccw) {
            rawEl(x, y, Math.max(0.2, Math.abs(Number(rx)) || 0.2), Math.max(0.2, Math.abs(Number(ry)) || 0.2), rot || 0, a0, a1, ccw);
          };
        }
      }
      function forceStart() {
        var tp = document.getElementById("turnPhone");
        if (tp) tp.style.display = "none";
        var menuEl = document.getElementById("menu");
        if (menuEl) menuEl.classList.add("hidden");
        if (typeof state !== "undefined") { state.screen = "play"; state.paused = false; }
        try { if (typeof startGame === "function") startGame(false); } catch (err) { console.error(err); }
      }
      window.__mtStart = forceStart;
      var startBtn = document.getElementById("startBtn");
      if (startBtn) startBtn.addEventListener("click", forceStart);
      if (typeof frame === "function") {
        var rawFrame = frame;
        frame = function(now) {
          try { rawFrame(now); } catch (err) { console.error(err); requestAnimationFrame(frame); }
        };
      }
      function drawBuddyProp(bx, by, b, gy) {
        ctx.save();
        if (b === 1) {
          ctx.strokeStyle = "#8b5a2b"; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.moveTo(bx + 8, by - 20); ctx.lineTo(bx + 2, by - 62); ctx.stroke();
          ctx.fillStyle = "#e74c3c";
          ctx.beginPath();
          ctx.moveTo(bx + 2, by - 62);
          ctx.quadraticCurveTo(bx - 26, by - 50, bx - 28, by - 38);
          ctx.lineTo(bx + 2, by - 44);
          ctx.quadraticCurveTo(bx + 30, by - 50, bx + 32, by - 38);
          ctx.lineTo(bx + 2, by - 62);
          ctx.fill();
        } else if (b === 2) {
          // Bread lives in the pond only (see drawBreadAndChasingDucks); never attach to kid.
        } else if (b === 3) {
          ctx.fillStyle = "#8b5a2b"; ctx.fillRect(bx + 12, by - 36, 4, 28);
          ctx.fillStyle = "#7f8c8d"; ctx.fillRect(bx + 4, by - 42, 20, 10);
        } else if (b === 4) {
          ctx.fillStyle = "#cfd4da"; ctx.fillRect(bx + 6, by - 28, 22, 20); ctx.fillRect(bx + 4, by - 32, 26, 6);
          ctx.fillStyle = "#2c3e50"; ctx.font = "bold 7px sans-serif"; ctx.textAlign = "center";
          ctx.fillText("MILK", bx + 17, by - 14);
        } else if (b === 5) {
          ctx.fillStyle = "#e67e22";
          ctx.beginPath(); ctx.ellipse(bx + 18, by - 12, 9, 7, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = "#2e8b3a"; ctx.fillRect(bx + 16, by - 20, 3, 6);
        } else if (b === 6) {
          ctx.strokeStyle = "#fff8e7"; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.moveTo(bx + 14, by - 4); ctx.lineTo(bx + 14, by - 22); ctx.stroke();
          ctx.fillStyle = "#ff4d8d";
          ctx.beginPath(); ctx.arc(bx + 14, by - 30, 11, 0, Math.PI * 2); ctx.fill();
        } else if (b === 7) {
          ctx.strokeStyle = "#8b5a2b"; ctx.lineWidth = 4;
          ctx.beginPath(); ctx.moveTo(bx + 14, by - 6); ctx.lineTo(bx + 14, by - 34); ctx.stroke();
          ctx.fillStyle = "#95a5a6";
          ctx.beginPath(); ctx.moveTo(bx + 4, by - 34); ctx.lineTo(bx + 24, by - 34); ctx.lineTo(bx + 22, by - 46); ctx.lineTo(bx + 6, by - 46); ctx.fill();
        } else if (b === 8) {
          ctx.fillStyle = "rgba(210,240,255,0.45)"; ctx.fillRect(bx + 6, by - 36, 18, 22);
          ctx.fillStyle = "#7dffb3";
          var t = state.t || 0;
          ctx.beginPath();
          ctx.arc(bx + 12 + Math.sin(t * 7) * 2, by - 24, 2.2, 0, Math.PI * 2);
          ctx.arc(bx + 18 + Math.cos(t * 8) * 2, by - 28, 1.8, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
      function drawHatCrow(cx, cy, flip) {
        ctx.save(); ctx.translate(cx, cy); ctx.scale(flip || 1, 1);
        ctx.fillStyle = "#1a1a1a";
        ctx.beginPath(); ctx.ellipse(0, 0, 8, 5, -0.25, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(7, -3, 5, 4, 0.1, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#f4c430";
        ctx.beginPath(); ctx.moveTo(11, -3); ctx.lineTo(17, -2); ctx.lineTo(11, 0); ctx.fill();
        ctx.restore();
      }
      if (typeof drawGround === "function") {
        var rawG = drawGround;
        drawGround = function(w, h, gy, scroll) {
          rawG(w, h, gy, scroll);
          var b = state.biome || 0;
          if (b === 6) {
            var cols = ["#ff4d8d", "#fff", "#7dffb3", "#ffd166", "#6ec6ff"];
            for (var s = 0; s < 40; s++) {
              var spx = ((s * 67 - scroll * 0.22) % (w + 20) + (w + 20)) % (w + 20) - 10;
              ctx.fillStyle = cols[s % cols.length];
              ctx.beginPath(); ctx.arc(spx, gy - 40 - (s % 5) * 14, 2, 0, Math.PI * 2); ctx.fill();
            }
          }
          if (b === 8) {
            for (var i = 0; i < 24; i++) {
              var fx = ((80 + i * 73 - scroll * 0.35) % (w + 40) + (w + 40)) % (w + 40) - 20;
              var fy = 40 + (i * 47) % Math.max(40, gy - 20);
              ctx.fillStyle = "rgba(255,230,90,0.7)";
              ctx.beginPath(); ctx.arc(fx, fy, 2.4, 0, Math.PI * 2); ctx.fill();
            }
          }
          if (b === 7) {
            var spanS = w + 280;
            var smx = ((700 - scroll * 0.55) % spanS + spanS) % spanS - 80;
            ctx.fillStyle = "#fff";
            ctx.beginPath();
            ctx.arc(smx, gy - 18, 20, 0, Math.PI * 2);
            ctx.arc(smx, gy - 46, 15, 0, Math.PI * 2);
            ctx.arc(smx, gy - 70, 12, 0, Math.PI * 2);
            ctx.fill();
            var swave = Math.sin((state.t || 0) * 4) * 14;
            ctx.strokeStyle = "#8b5a2b"; ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(smx - 14, gy - 46); ctx.lineTo(smx - 30, gy - 56);
            ctx.moveTo(smx + 14, gy - 46); ctx.lineTo(smx + 28, gy - 58 - swave);
            ctx.stroke();
            ctx.fillStyle = "#1b1b1b";
            ctx.fillRect(smx - 16, gy - 84, 32, 7); ctx.fillRect(smx - 11, gy - 106, 22, 22);
            var tx = smx - 95;
            ctx.fillStyle = "#1b6b34";
            ctx.beginPath(); ctx.moveTo(tx, gy - 150); ctx.lineTo(tx + 52, gy - 70); ctx.lineTo(tx - 52, gy - 70); ctx.fill();
            ctx.fillStyle = "#ffd166";
            ctx.beginPath(); ctx.moveTo(tx, gy - 168); ctx.lineTo(tx + 10, gy - 150); ctx.lineTo(tx - 10, gy - 150); ctx.fill();
          }
          if (b === 5) {
            var span = w + 280;
            var x = ((760 - scroll * 0.55) % span + span) % span - 80;
            ctx.fillStyle = "#8b5a2b"; ctx.fillRect(x - 4, gy - 100, 8, 100);
            ctx.fillStyle = "#c45a2a"; ctx.fillRect(x - 18, gy - 78, 36, 34);
            var wave = Math.sin((state.t || 0) * 4) * 16;
            ctx.strokeStyle = "#6b3a16"; ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.moveTo(x - 18, gy - 68); ctx.lineTo(x - 34, gy - 56);
            ctx.moveTo(x + 18, gy - 68); ctx.lineTo(x + 34, gy - 62 - wave);
            ctx.stroke();
            ctx.fillStyle = "#ffe0bd";
            ctx.beginPath(); ctx.arc(x, gy - 92, 13, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = "#d4a017"; ctx.fillRect(x - 12, gy - 118, 24, 18);
            drawHatCrow(x - 8, gy - 126, 1);
            drawHatCrow(x + 14, gy - 128, -1);
          }
        };
      }
      if (typeof drawBuddy === "function") {
        var prev = drawBuddy;
        drawBuddy = function(x, gy) {
          var b = state.biome || 0;
          if (b === 9) {
            var hover = Math.sin((state.t || 0) * 5) * 6;
            var rimY = gy - 10 + hover;
            var keep = state.biome; state.biome = 0; prev(x, rimY + 6); state.biome = keep;
            ctx.fillStyle = "rgba(90,190,235,0.24)";
            ctx.beginPath();
            ctx.moveTo(x - 24, rimY + 2);
            ctx.quadraticCurveTo(x - 24, rimY - 50, x, rimY - 54);
            ctx.quadraticCurveTo(x + 24, rimY - 50, x + 24, rimY + 2);
            ctx.closePath(); ctx.fill();
            ctx.strokeStyle = "#c5cedd"; ctx.lineWidth = 3; ctx.stroke();
            ctx.fillStyle = "#8e99ab";
            ctx.beginPath(); ctx.ellipse(x, rimY + 8, 42, 16, 0, 0, Math.PI * 2); ctx.fill();
            return;
          }
          // Trail buddy is themed per place; skip old hand-prop overlays.
          prev(x, gy);
        };
      }
    })();


// ===== SHOP / CREW + HATS =====

    (function shopPatch() {
      if (typeof CATALOG === "undefined") return;
      var slim = [
        { id: "fox", name: "Fox", price: 0, emo: "🦊", body: "#ff8a3c", belly: "#ffe0bd", ear: "fox", acc: "none" },
        { id: "cat", name: "Cat", price: 8, emo: "🐱", body: "#d4a017", belly: "#fff3c4", ear: "cat", acc: "none" },
        { id: "bunny", name: "Bunny", price: 12, emo: "🐰", body: "#f3f0ea", belly: "#ffffff", ear: "bunny", acc: "none" },
        { id: "penguin", name: "Penguin", price: 18, emo: "🐧", body: "#2c3340", belly: "#ffffff", ear: "round", acc: "none" },
        { id: "frog", name: "Frog", price: 22, emo: "🐸", body: "#3cb371", belly: "#d4f5d8", ear: "round", acc: "none", unlock: 8 },
        { id: "owl", name: "Owl", price: 26, emo: "🦉", body: "#8d6e63", belly: "#ffe0bd", ear: "owl", acc: "none", unlock: 12 },
        { id: "bear", name: "Bear", price: 30, emo: "🐻", body: "#8d6e63", belly: "#ffe0bd", ear: "bear", acc: "none", unlock: 18 },
        { id: "robot", name: "Robot", price: 34, emo: "🤖", body: "#6aa8d8", belly: "#d7ecff", ear: "robot", acc: "antenna", unlock: 22 }
      ];
      CATALOG.splice(0, CATALOG.length);
      slim.forEach(function(it) { CATALOG.push(it); });

      window.HATS = [
        { id: "none", name: "No hat", price: 0, emo: "✨", acc: "none" },
        { id: "cape", name: "Super Cape", price: 10, emo: "🦸", acc: "cape" },
        { id: "starcape", name: "Star Cape", price: 14, emo: "🌟", acc: "starcape" },
        { id: "picnic", name: "Picnic Hat", price: 12, emo: "🧿", acc: "picnic" },
        { id: "straw", name: "Barn Hat", price: 12, emo: "👒", acc: "straw" },
        { id: "firefly", name: "Firefly Jar", price: 16, emo: "🫢", acc: "firefly", unlock: 10 },
        { id: "backpack", name: "Trail Pack", price: 16, emo: "🎒", acc: "backpack" },
        { id: "wizard", name: "Wizard Hat", price: 20, emo: "🧙", acc: "wizard", unlock: 15 },
        { id: "ninja", name: "Ninja Mask", price: 20, emo: "🥷", acc: "mask", unlock: 15 },
        { id: "horn", name: "Magic Horn", price: 22, emo: "🦤", acc: "horn", unlock: 18 },
        { id: "wings", name: "Trail Wings", price: 28, emo: "🪽", acc: "wings", unlock: 20 }
      ];
      var OLD_HAT_FROM = {
        cape: "cape", unicorn: "horn", dragon: "wings", wizard: "wizard",
        ninja: "ninja", fairy: "wings", phoenix: "wings", bee: "wings",
        viking: "horn", deer: "horn", raccoon: "ninja", panda: "ninja"
      };

      function findItem(list, id) {
        for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
        return list[0];
      }

      state.hat = state.hat || "none";
      state.ownedHats = state.ownedHats || ["none"];
      state.shopTab = state.shopTab || "crew";
      if (state.ownedHats.indexOf("none") === -1) state.ownedHats.unshift("none");

      var data = loadSave() || {};
      if (data.hat) state.hat = data.hat;
      if (data.ownedHats && data.ownedHats.length) state.ownedHats = data.ownedHats;
      var keep = ["fox"];
      (state.owned || []).forEach(function(id) {
        if (OLD_HAT_FROM[id]) {
          var hid = OLD_HAT_FROM[id];
          if (state.ownedHats.indexOf(hid) === -1) state.ownedHats.push(hid);
          return;
        }
        var it = findItem(CATALOG, id);
        if (it && it.id === id) {
          if (keep.indexOf(id) === -1) keep.push(id);
        }
      });
      state.owned = keep;
      if (state.owned.indexOf(state.character) === -1) state.character = "fox";
      if (state.ownedHats.indexOf(state.hat) === -1) state.hat = "none";

      costume = function() {
        var base = findItem(CATALOG, state.character);
        var c = {};
        for (var k in base) c[k] = base[k];
        if (state.colors && state.colors[c.id]) c.body = state.colors[c.id];
        c.belly = mixBelly(c.body);
        var hat = findItem(HATS, state.hat || "none");
        c.hat = hat.id;
        if (hat.acc && hat.acc !== "none") c.acc = hat.acc;
        return c;
      };

      var _writeSave = writeSave;
      writeSave = function(extra) {
        extra = extra || {};
        extra.hat = state.hat || "none";
        extra.ownedHats = state.ownedHats || ["none"];
        _writeSave(extra);
      };

      window.buyOrWearHat = function(id) {
        var it = findItem(HATS, id);
        if (!it) return;
        var owned = state.ownedHats.indexOf(id) !== -1 || id === "none";
        state.hat = id;
        if (!owned && id !== "none") {
          if ((it.unlock || 0) > (state.bestLevel || 1)) {
            showToast("Preview · unlock at level " + it.unlock);
          } else if (state.stars < it.price) {
            showToast("Preview · need " + it.price + " stars to keep");
          } else {
            state.stars -= it.price;
            state.ownedHats.push(id);
            showToast("Bought " + it.name + "!");
            owned = true;
          }
        }
        if (owned) writeSave({});
        updateHud();
        renderShop();
      };

      renderShop = function() {
        var starsEl = document.getElementById("shopStars");
        if (starsEl) starsEl.textContent = "⭐ " + state.stars + " stars";
        var tab = state.shopTab || "crew";
        document.querySelectorAll(".shopTab").forEach(function(b) {
          b.classList.toggle("selected", b.dataset.tab === tab);
        });
        var grid = document.getElementById("shopGrid");
        if (!grid) return;
        grid.innerHTML = "";
        var list = tab === "hats" ? HATS : CATALOG;
        list.forEach(function(it) {
          var isHat = tab === "hats";
          var owned = isHat ? state.ownedHats.indexOf(it.id) !== -1 : state.owned.indexOf(it.id) !== -1;
          var wearing = isHat ? (state.hat || "none") === it.id : state.character === it.id;
          var need = it.unlock || 0;
          var locked = !owned && need > (state.bestLevel || 1);
          var btn = document.createElement("button");
          btn.type = "button";
          btn.className = "item" + (owned ? " owned" : "") + (wearing ? " wearing" : "") + (locked ? " locked" : "");
          var label = locked ? ("Preview · Lv " + need) : wearing ? "Wearing" : owned ? "Wear" : (it.price === 0 ? "Free" : "Buy ⭐" + it.price);
          btn.innerHTML = '<div class="emo">' + it.emo + '</div><div class="nm">' + it.name + '</div><div class="pr">' + label + '</div>';
          if (!isHat && owned) {
            var row = document.createElement("div");
            row.className = "swatches";
            var current = (state.colors && state.colors[it.id]) || it.body;
            PALETTE.forEach(function(col) {
              var s = document.createElement("button");
              s.type = "button";
              s.className = "swatch" + (col.toLowerCase() === current.toLowerCase() ? " on" : "");
              s.style.background = col;
              s.addEventListener("click", function(e) {
                e.stopPropagation();
                setCostumeColor(it.id, col);
              });
              row.appendChild(s);
            });
            btn.appendChild(row);
          }
          btn.addEventListener("click", function() {
            if (isHat) buyOrWearHat(it.id);
            else buyOrWear(it.id);
          });
          grid.appendChild(btn);
        });
      };

      var _drawHero = drawHero;
      drawHero = function(x, gy) {
        _drawHero(x, gy);
        var c = costume();
        var extra = { picnic:1, straw:1, firefly:1, backpack:1, wizard:1, starcape:1 };
        if (!extra[c.acc]) return;
        var duck = state.sliding ? 16 : 0;
        var dance = state.dancing ? Math.sin(state.t * 14) * 8 : 0;
        var y = gy + state.heroY - 8 + duck;
        var idle = (state.screen === "menu" || state.screen === "end");
        var bob = Math.sin(state.runPhase * 2) * (state.grounded ? 3 : 0) + (idle ? Math.sin(state.t * 2) * 2 : 0);
        ctx.save();
        ctx.translate(dance, 0);
        if (c.acc === "picnic") {
          ctx.fillStyle = "#c0392b";
          ctx.beginPath(); ctx.ellipse(x, y - 96 + bob, 20, 6, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = "#fff8e7";
          ctx.beginPath(); ctx.ellipse(x, y - 100 + bob, 12, 8, 0, Math.PI, Math.PI * 2); ctx.fill();
        }
        if (c.acc === "straw") {
          ctx.fillStyle = "#e2b84a";
          ctx.beginPath(); ctx.ellipse(x, y - 94 + bob, 22, 6, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = "#c9922a";
          if (typeof roundRect === "function") { roundRect(x - 10, y - 108 + bob, 20, 14, 6); ctx.fill(); }
        }
        if (c.acc === "firefly") {
          ctx.fillStyle = "rgba(255,255,220,0.55)";
          ctx.fillRect(x + 10, y - 112 + bob, 16, 18);
          ctx.strokeStyle = "#7a4b00"; ctx.lineWidth = 2; ctx.strokeRect(x + 10, y - 112 + bob, 16, 18);
          ctx.fillStyle = "#f4c430";
          ctx.beginPath(); ctx.arc(x + 18, y - 102 + bob, 3.2, 0, Math.PI * 2); ctx.fill();
        }
        if (c.acc === "backpack") {
          ctx.fillStyle = "#2b6cb0"; ctx.fillRect(x - 28, y - 52 + bob, 14, 22);
          ctx.fillStyle = "#f4c430"; ctx.fillRect(x - 26, y - 46 + bob, 10, 8);
        }
        if (c.acc === "wizard") {
          ctx.fillStyle = "#6c3483";
          ctx.beginPath(); ctx.moveTo(x - 16, y - 92 + bob); ctx.lineTo(x, y - 128 + bob); ctx.lineTo(x + 16, y - 92 + bob); ctx.fill();
          ctx.fillStyle = "#f4c430";
          ctx.beginPath(); ctx.arc(x + 6, y - 108 + bob, 2.4, 0, Math.PI * 2); ctx.fill();
        }
        if (c.acc === "starcape") {
          ctx.fillStyle = "#f4c430";
          ctx.beginPath();
          ctx.moveTo(x - 8, y - 50 + bob);
          ctx.quadraticCurveTo(x - 48, y - 16 + bob, x - 18, y - 6 + bob);
          ctx.lineTo(x - 6, y - 28 + bob);
          ctx.fill();
        }
        ctx.restore();
      };

      document.querySelectorAll(".shopTab").forEach(function(btn) {
        btn.addEventListener("click", function() {
          state.shopTab = btn.dataset.tab;
          renderShop();
        });
      });
      writeSave({});
    })();


// ===== PROPS FIX =====

    (function onePropEach() {
      if (typeof drawGround !== "function") return;
      var prev = drawGround;

      function markX(w, scroll, seed) {
        var span = w + 280;
        return ((seed - scroll * 0.55) % span + span) % span - 80;
      }

      function drawStar(cx, cy, r) {
        ctx.fillStyle = "#ffd166";
        ctx.beginPath();
        for (var i = 0; i < 5; i++) {
          var a = -Math.PI / 2 + i * Math.PI * 2 / 5;
          var b = a + Math.PI / 5;
          ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
          ctx.lineTo(cx + Math.cos(b) * (r * 0.42), cy + Math.sin(b) * (r * 0.42));
        }
        ctx.closePath();
        ctx.fill();
      }

      function drawOneSnowman(x, gy) {
        ctx.fillStyle = "#fff";
        ctx.beginPath(); ctx.arc(x, gy - 18, 20, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x, gy - 46, 15, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x, gy - 70, 12, 0, Math.PI * 2); ctx.fill();
        var swave = Math.sin((state.t || 0) * 4) * 12;
        ctx.strokeStyle = "#8b5a2b"; ctx.lineWidth = 3; ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(x - 14, gy - 46); ctx.lineTo(x - 30, gy - 56);
        ctx.moveTo(x + 14, gy - 46); ctx.lineTo(x + 28, gy - 58 - swave);
        ctx.stroke();
        ctx.fillStyle = "#1b1b1b";
        ctx.beginPath();
        ctx.arc(x, gy - 36, 2.4, 0, Math.PI * 2);
        ctx.arc(x, gy - 46, 2.4, 0, Math.PI * 2);
        ctx.arc(x, gy - 56, 2.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#c0392b";
        ctx.beginPath(); ctx.ellipse(x, gy - 62, 16, 5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillRect(x + 10, gy - 64, 8, 16);
        ctx.fillStyle = "#1b2a41";
        ctx.beginPath(); ctx.arc(x - 4, gy - 73, 1.6, 0, Math.PI * 2); ctx.arc(x + 4, gy - 73, 1.6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#e67e22";
        ctx.beginPath(); ctx.moveTo(x, gy - 70); ctx.lineTo(x + 12, gy - 68); ctx.lineTo(x, gy - 66); ctx.fill();
        ctx.fillStyle = "#1b1b1b";
        ctx.fillRect(x - 16, gy - 84, 32, 7);
        ctx.fillRect(x - 11, gy - 106, 22, 22);
        ctx.fillStyle = "#c0392b"; ctx.fillRect(x - 11, gy - 86, 22, 3);
      }

      function drawGroundedTree(tx, gy) {
        var base = gy + 6;
        ctx.fillStyle = "#6b3a16"; ctx.fillRect(tx - 6, base - 22, 12, 22);
        ctx.fillStyle = "#1b6b34";
        ctx.beginPath(); ctx.moveTo(tx, base - 78); ctx.lineTo(tx + 40, base - 22); ctx.lineTo(tx - 40, base - 22); ctx.closePath(); ctx.fill();
        ctx.fillStyle = "#218c44";
        ctx.beginPath(); ctx.moveTo(tx, base - 102); ctx.lineTo(tx + 30, base - 52); ctx.lineTo(tx - 30, base - 52); ctx.closePath(); ctx.fill();
        ctx.fillStyle = "#2e8b3a";
        ctx.beginPath(); ctx.moveTo(tx, base - 122); ctx.lineTo(tx + 20, base - 80); ctx.lineTo(tx - 20, base - 80); ctx.closePath(); ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.ellipse(tx, base - 78, 18, 5, 0, 0, Math.PI * 2);
        ctx.ellipse(tx, base - 52, 26, 5, 0, 0, Math.PI * 2);
        ctx.ellipse(tx, base - 24, 34, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        var baubles = [[tx-16,base-40,"#e74c3c"],[tx+14,base-36,"#f4c430"],[tx-6,base-58,"#6ec6ff"],[tx+12,base-64,"#ff4d8d"],[tx-10,base-88,"#ffd166"],[tx+8,base-92,"#e74c3c"],[tx+18,base-48,"#7dffb3"],[tx-22,base-32,"#c56cff"]];
        for (var i = 0; i < baubles.length; i++) {
          ctx.fillStyle = baubles[i][2];
          ctx.beginPath(); ctx.arc(baubles[i][0], baubles[i][1], 3.4, 0, Math.PI * 2); ctx.fill();
        }
        drawStar(tx, base - 132, 10);
      }

      function drawOneScarecrow(x, gy) {
        ctx.fillStyle = "#8b5a2b"; ctx.fillRect(x - 4, gy - 100, 8, 100);
        ctx.fillStyle = "#c45a2a"; ctx.fillRect(x - 18, gy - 78, 36, 34);
        ctx.fillStyle = "#6b3a16"; ctx.fillRect(x - 18, gy - 48, 36, 5);
        var wave = Math.sin((state.t || 0) * 4) * 14;
        ctx.strokeStyle = "#6b3a16"; ctx.lineWidth = 6; ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(x - 18, gy - 68); ctx.lineTo(x - 36, gy - 56);
        ctx.moveTo(x + 18, gy - 68); ctx.lineTo(x + 36, gy - 60 - wave);
        ctx.stroke();
        ctx.fillStyle = "#ffe0bd";
        ctx.beginPath(); ctx.arc(x, gy - 92, 13, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#5d3a1a";
        ctx.beginPath(); ctx.arc(x - 5, gy - 94, 1.6, 0, Math.PI * 2); ctx.arc(x + 5, gy - 94, 1.6, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = "#5d3a1a"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(x, gy - 88, 4, 0.2, Math.PI - 0.2); ctx.stroke();
        ctx.fillStyle = "#d4a017";
        ctx.beginPath(); ctx.ellipse(x, gy - 100, 22, 5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillRect(x - 12, gy - 118, 24, 18);
        ctx.fillStyle = "#c9843a"; ctx.fillRect(x - 12, gy - 102, 24, 3);
        function crow(cx, cy, flip) {
          ctx.save(); ctx.translate(cx, cy); ctx.scale(flip, 1);
          ctx.fillStyle = "#1a1a1a";
          ctx.beginPath(); ctx.ellipse(0, 0, 7, 4.2, -0.2, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.ellipse(6, -2, 4, 3.2, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = "#f4c430";
          ctx.beginPath(); ctx.moveTo(10, -2); ctx.lineTo(15, -0.5); ctx.lineTo(10, 1); ctx.fill();
          ctx.restore();
        }
        crow(x - 8, gy - 126, 1);
        crow(x + 14, gy - 128, -1);
      }

      var PROP_COLS = {
        "#8b5a2b":1,"#c45a2a":1,"#6b3a16":1,"#d4a017":1,"#ffe0bd":1,"#c9843a":1,
        "#1b6b34":1,"#ffd166":1,"#c0392b":1,"#e67e22":1,"#1b1b1b":1,"#1a1a1a":1
      };

      drawGround = function(w, h, gy, scroll) {
        var b = state.biome || 0;
        if (b !== 5 && b !== 7) { prev(w, h, gy, scroll); return; }
        var rawFill = ctx.fill.bind(ctx);
        var rawFillRect = ctx.fillRect.bind(ctx);
        var rawStroke = ctx.stroke.bind(ctx);
        var rawArc = ctx.arc.bind(ctx);
        var rawEllipse = ctx.ellipse.bind(ctx);
        var hide = false;
        function col() { return String(ctx.fillStyle || "").toLowerCase(); }
        ctx.arc = function(x, y, r, a0, a1, ccw) {
          if (r >= 7 && y < gy + 6) hide = true;
          return rawArc(x, y, r, a0, a1, ccw);
        };
        ctx.ellipse = function(x, y, rx, ry, rot, a0, a1, ccw) {
          if (rx >= 10 && y < gy) hide = true;
          return rawEllipse(x, y, rx, ry, rot, a0, a1, ccw);
        };
        ctx.fill = function() {
          var c = col();
          if (hide || PROP_COLS[c] || (b === 7 && (c === "#fff" || c === "#ffffff" || c.indexOf("255, 255, 255") !== -1) && hide)) {
            hide = false;
            return;
          }
          hide = false;
          return rawFill();
        };
        ctx.fillRect = function(x, y, rw, rh) {
          if (y < gy && rh >= 6 && rw >= 6) return;
          return rawFillRect(x, y, rw, rh);
        };
        ctx.stroke = function() {
          if (hide || PROP_COLS[String(ctx.strokeStyle || "").toLowerCase()]) { hide = false; return; }
          return rawStroke();
        };
        prev(w, h, gy, scroll);
        ctx.fill = rawFill;
        ctx.fillRect = rawFillRect;
        ctx.stroke = rawStroke;
        ctx.arc = rawArc;
        ctx.ellipse = rawEllipse;
        if (b === 7) {
          var smx = markX(w, scroll, 700);
          drawOneSnowman(smx, gy);
          drawGroundedTree(smx - 95, gy);
        } else {
          drawOneScarecrow(markX(w, scroll, 760), gy);
        }
      };
    })();


// ===== TRAIL POLISH =====

    (function trailPolish() {
      function placeId() {
        try {
          if (typeof currentPlace === "function" && currentPlace()) return currentPlace().id;
        } catch (e) {}
        return "";
      }
      function inSpace() {
        var b = state.biome || 0;
        return b === 9 || placeId() === "space" || !!state.launching;
      }
      function candyTrail() {
        return (state.biome || 0) === 6 || placeId() === "candy";
      }
      function snowTrail() {
        return (state.biome || 0) === 7 || placeId() === "snow";
      }
      function pondTrail() {
        return (state.biome || 0) === 2 || placeId() === "pond";
      }

      // Jump-only clears: do not add beam / non-jump win moves.
      if (typeof WIN_MOVES !== "undefined") {
        var JUMP_ONLY = ["flip", "cartwheel", "bounce"];
        WIN_MOVES.length = 0;
        for (var ji = 0; ji < JUMP_ONLY.length; ji++) WIN_MOVES.push(JUMP_ONLY[ji]);
      }

      function shipX() {
        return 92;
      }

      function drawBuddyInShip(gy) {
        var x = shipX();
        var hover = Math.sin((state.t || 0) * 3.2) * 5;
        var y = gy - 18 + hover;
        ctx.save();
        ctx.fillStyle = "#8ea0b8";
        ctx.beginPath(); ctx.ellipse(x, y + 10, 42, 16, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#c5d3e6";
        ctx.beginPath(); ctx.ellipse(x, y + 7, 36, 11, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#d7e4f5";
        ctx.beginPath(); ctx.ellipse(x, y - 16, 22, 20, 0, Math.PI, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#7ad0ff";
        ctx.beginPath(); ctx.ellipse(x + 2, y - 18, 13, 12, 0, 0, Math.PI * 2); ctx.fill();
        // Alien buddy in the cockpit
        ctx.fillStyle = "#7dffb3";
        ctx.beginPath(); ctx.arc(x + 1, y - 20, 7.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#1b2a41";
        ctx.beginPath(); ctx.ellipse(x - 2, y - 21, 2.2, 3.2, 0, 0, Math.PI * 2); ctx.ellipse(x + 4, y - 21, 2.2, 3.2, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }

      function wrapPondX(w, scroll) {
        var span = w + 280;
        return ((680 - scroll * 0.55) % span + span) % span - 80;
      }

      function clamp(v, a, b) {
        return Math.max(a, Math.min(b, v));
      }

      function drawPondDuck(dx, dy, flip) {
        ctx.save();
        ctx.translate(dx, dy);
        ctx.scale(flip || 1, 1);
        ctx.fillStyle = "#fff6d8";
        ctx.beginPath(); ctx.ellipse(0, 2, 16, 8, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#f1c40f";
        ctx.beginPath(); ctx.arc(13, -5, 7.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#e67e22";
        ctx.beginPath(); ctx.moveTo(19, -6); ctx.lineTo(28, -3); ctx.lineTo(19, 0); ctx.fill();
        ctx.restore();
      }

      function drawBreadAndChasingDucks(w, gy, scroll, buddyX, buddyY) {
        var pondX = wrapPondX(w, scroll);
        if (pondX < -160 || pondX > w + 160) {
          // Pond off-screen: reset toss so next appearance can arc once from the edge.
          state.breadToss = null;
          state.breadInPond = false;
          return;
        }
        var left = pondX - 110;
        var right = pondX + 110;
        var waterY = gy + 10;
        var bob = Math.sin((state.t || 0) * 2.2) * 1.4;
        var restX = clamp(pondX - 8, left + 20, right - 20);
        var restY = waterY + bob;
        // Optional one-time toss FROM pond edge INTO water (never from kid/buddy).
        if (!state.breadInPond && !state.breadToss) {
          state.breadToss = {
            start: state.t || 0,
            sx: left + 18,
            sy: waterY - 6,
            tx: restX,
            ty: waterY
          };
        }
        var p = 1;
        var breadX = restX;
        var breadY = restY;
        if (state.breadToss && !state.breadInPond) {
          p = Math.min(1, Math.max(0, ((state.t || 0) - state.breadToss.start) / 1.15));
          breadX = state.breadToss.sx + (state.breadToss.tx - state.breadToss.sx) * p;
          breadY = state.breadToss.sy + (state.breadToss.ty - state.breadToss.sy) * p - Math.sin(p * Math.PI) * 18;
          breadX = clamp(breadX, left + 16, right - 16);
          if (p >= 1) {
            state.breadInPond = true;
            breadX = restX;
            breadY = restY;
          }
        }
        // Always keep bread in the pond while the pond is on screen (kid walking away does not clear it).
        ctx.fillStyle = "#e8d5a3";
        ctx.fillRect(breadX, breadY, 9, 6);
        var chase = Math.min(1, p);
        var d1 = clamp(pondX - 40 + chase * (breadX - (pondX - 40)) * 0.45, left + 24, right - 24);
        var d2 = clamp(pondX + 48 + chase * (breadX - (pondX + 48)) * 0.45, left + 24, right - 24);
        drawPondDuck(d1, waterY - 2 + Math.sin((state.t || 0) * 2) * 2, 1);
        drawPondDuck(d2, waterY + 2 + Math.sin((state.t || 0) * 2 + 1.1) * 2, -1);
      }

      if (typeof drawBuddy === "function") {
        var rawBuddy = drawBuddy;
        drawBuddy = function(x, gy) {
          if (inSpace()) { drawBuddyInShip(gy); return; }
          if (!pondTrail()) {
            state.breadToss = null;
            state.breadInPond = false;
            rawBuddy(x, gy);
            return;
          }
          var rawFill = ctx.fill.bind(ctx);
          var rawFillRect = ctx.fillRect.bind(ctx);
          var rawEllipse = ctx.ellipse.bind(ctx);
          var rawArc = ctx.arc.bind(ctx);
          var nearWater = false;
          ctx.ellipse = function(ex, ey, rx, ry, rot, a0, a1, ccw) {
            if (ey > gy - 2) nearWater = true;
            return rawEllipse(ex, ey, rx, ry, rot, a0, a1, ccw);
          };
          ctx.arc = function(ax, ay, r, a0, a1, ccw) {
            if (ay > gy - 2) nearWater = true;
            return rawArc(ax, ay, r, a0, a1, ccw);
          };
          ctx.fill = function() {
            if (nearWater) { nearWater = false; return; }
            return rawFill();
          };
          ctx.fillRect = function(rx, ry, rw, rh) {
            if (rw <= 12 && rh <= 8) return;
            return rawFillRect(rx, ry, rw, rh);
          };
          rawBuddy(x, gy);
          ctx.fill = rawFill;
          ctx.fillRect = rawFillRect;
          ctx.ellipse = rawEllipse;
          ctx.arc = rawArc;
        };
      }

      function hillY(x, scroll, layer) {
        var n = Math.sin((x + scroll * layer.speed) * 0.008) * layer.amp +
                Math.sin((x + scroll * layer.speed) * 0.019) * (layer.amp * 0.45);
        return layer.base + n;
      }
      function hash(n) {
        var x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
        return x - Math.floor(x);
      }
      function sprinkleHills(w, h, gy, scroll) {
        var cols = ["#ff4d8d", "#fff7fb", "#7dffb3", "#ffd166", "#6ec6ff", "#c56cff", "#ff8ab8", "#ff6b6b", "#ffe66d", "#ffffff"];
        // Same speeds/amps/bases as drawHills candy layers; sprinkles pin to the filled face only.
        var layers = [
          { speed: 0.18, amp: 28, base: gy - 90 },
          { speed: 0.32, amp: 22, base: gy - 40 }
        ];
        var span = w + 120;
        for (var L = 0; L < layers.length; L++) {
          var layer = layers[L];
          // Prefer front/near layer density
          var count = L === 1 ? 90 : 40;
          for (var i = 0; i < count; i++) {
            var a = hash(i * 17.3 + L * 91.1);
            var b = hash(i * 9.7 + L * 4.2 + 20);
            var c = hash(i * 3.1 + L * 13.8 + 50);
            var d = hash(i * 21.4 + L * 2.6 + 80);
            var seed = a * span;
            var sx = ((seed - scroll * layer.speed) % span + span) % span - 30;
            var ridge = hillY(sx, scroll, layer);
            var sy = ridge + 3 + b * 8;
            if (sy < ridge || sy > gy - 6) continue;
            ctx.fillStyle = cols[Math.floor(c * cols.length)];
            ctx.beginPath();
            if (d > 0.55) ctx.ellipse(sx, sy, 2.8 + a * 1.4, 1.05, d * Math.PI, 0, Math.PI * 2);
            else ctx.arc(sx, sy, 1.3 + b * 1.4, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
      function drawSuckers(w, gy, scroll) {
        var heads = ["#ff4d8d", "#7dffb3", "#6ec6ff", "#c56cff", "#ffd166"];
        for (var i = 0; i < 5; i++) {
          var x = ((140 + i * 210 - scroll * 0.55) % (w + 80) + (w + 80)) % (w + 80) - 20;
          ctx.fillStyle = "#fff7fb"; ctx.fillRect(x - 3, gy - 46, 6, 46);
          ctx.fillStyle = heads[i % heads.length];
          ctx.beginPath(); ctx.arc(x, gy - 58, 16, 0, Math.PI * 2); ctx.fill();
        }
      }
      function drawFallingSnow(w, h) {
        if (!state.snowflakes || !state.snowflakes.length) {
          state.snowflakes = [];
          for (var s = 0; s < 56; s++) state.snowflakes.push({ x: Math.random() * (w + 40), y: Math.random() * h, r: 1.5 + Math.random() * 2.4, v: 26 + Math.random() * 40, w: 0.4 + Math.random() * 0.8 });
        }
        ctx.fillStyle = "rgba(255,255,255,0.92)";
        for (var i = 0; i < state.snowflakes.length; i++) {
          var f = state.snowflakes[i];
          f.y += f.v * 0.016;
          f.x += Math.sin((state.t || 0) * f.w + i) * 0.6;
          if (f.y > h + 8) { f.y = -8; f.x = Math.random() * w; }
          ctx.beginPath(); ctx.arc(((f.x % (w + 20)) + (w + 20)) % (w + 20), f.y, f.r, 0, Math.PI * 2); ctx.fill();
        }
      }

      function drawAlienBeam(g, gy) {
        var t = Math.min(1, state.beamT || 0);
        var lift = t * 160;
        var fade = 1 - Math.max(0, t - 0.7) / 0.3;
        var gx = g.x;
        ctx.save();
        ctx.globalAlpha = 0.55 * fade;
        ctx.fillStyle = "#7dffb3";
        ctx.beginPath();
        ctx.moveTo(gx - 18, 36);
        ctx.lineTo(gx - 56, gy - lift + 10);
        ctx.lineTo(gx + 56, gy - lift + 10);
        ctx.lineTo(gx + 18, 36);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = fade;
        ctx.fillStyle = "#9be7a8";
        ctx.beginPath(); ctx.ellipse(gx, 28, 38, 12, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#c8ffd4";
        ctx.beginPath(); ctx.ellipse(gx, 16, 22, 16, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#3cb371";
        ctx.beginPath(); ctx.arc(gx - 8, 14, 4, 0, Math.PI * 2); ctx.arc(gx + 8, 14, 4, 0, Math.PI * 2); ctx.fill();
        ctx.translate(gx, gy - lift);
        ctx.fillStyle = "#8b5a2b";
        ctx.fillRect(-48, -150, 18, 168);
        ctx.fillRect(30, -150, 18, 168);
        ctx.fillStyle = "#c9843a"; ctx.fillRect(-54, -168, 108, 36);
        ctx.fillStyle = "#fff8e7"; ctx.fillRect(-70, -128, 140, 70);
        if (g.problem) {
          ctx.fillStyle = "#1b2a41";
          ctx.font = "800 22px Nunito, sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(g.problem.text, 0, -98);
        }
        ctx.restore();
      }

      if (typeof drawHills === "function") {
        var rawHills = drawHills;
        drawHills = function(w, h, gy, scroll) {
          rawHills(w, h, gy, scroll);
          if (candyTrail()) sprinkleHills(w, h, gy, scroll);
        };
      }

      if (typeof drawGround === "function") {
        var rawGround = drawGround;
        drawGround = function(w, h, gy, scroll) {
          rawGround(w, h, gy, scroll);
          if (pondTrail()) {
            var bx = state.buddyX != null ? state.buddyX : 112;
            drawBreadAndChasingDucks(w, gy, scroll, bx, gy);
          } else {
            state.breadToss = null;
            state.breadInPond = false;
          }
          if (candyTrail()) drawSuckers(w, gy, scroll);
          if (snowTrail()) drawFallingSnow(w, h);
        };
      }

      if (typeof drawGate === "function") {
        var rawGate = drawGate;
        drawGate = function(g, gy) {
          if (state.beamUp && g) { drawAlienBeam(g, gy); return; }
          rawGate(g, gy);
        };
      }

      function startBeam() {
        if (!state.answered || state.winMove !== "beam") return false;
        state.rushing = false;
        state.buddyRush = false;
        state.dancing = false;
        state.sliding = false;
        state.jumpArc = false;
        state.beamUp = true;
        state.beamT = 0;
        return true;
      }

      if (typeof spawnGate === "function") {
        var rawSpawn = spawnGate;
        spawnGate = function() {
          state.beamUp = false;
          state.beamT = 0;
          state.buddyRush = false;
          return rawSpawn();
        };
      }

      if (typeof chooseAnswer === "function") {
        var rawChoose = chooseAnswer;
        chooseAnswer = function(i) {
          rawChoose(i);
          // Keep beam FX off the clear path — gates are jumped only.
          if (state.answered && state.screen === "play") {
            state.beamUp = false;
            state.winMove = (state.winMove === "beam" || state.winMove === "buddy" || state.winMove === "slide")
              ? "flip"
              : state.winMove;
          }
        };
      }

      if (typeof smashGate === "function") {
        var rawSmash = smashGate;
        smashGate = function(success) {
          if (success && state.answered) startBeam();
          rawSmash(success);
          if (success) state.nextGateIn = Math.max(state.nextGateIn || 0, 1.6);
        };
      }

      if (typeof tickTrail === "function") {
        var rawPolishTick = tickTrail;
        tickTrail = function(dt) {
          if (!state.answered) state.buddyRush = false;
          rawPolishTick(dt);
        };
      }

      if (typeof requestAnimationFrame === "function") {
        (function tickBeam() {
          if (state && state.beamUp) {
            state.beamT = (state.beamT || 0) + 0.018;
            if (state.beamT > 1.15) state.beamUp = false;
          }
          requestAnimationFrame(tickBeam);
        })();
      }
    })();


// ===== ANIMAL LOOKS =====

    (function animalLooks() {
      if (typeof drawHero !== "function") return;
      var raw = drawHero;

      function who() {
        var id = state.character || "fox";
        if (typeof costume === "function") {
          var c = costume();
          if (c && c.id) id = c.id;
        }
        return id;
      }

      function pose(x, gy) {
        var duck = state.sliding ? 16 : 0;
        var dance = state.dancing ? Math.sin(state.t * 14) * 8 : 0;
        var y = gy + (state.heroY || 0) - 8 + duck;
        var idle = (state.screen === "menu" || state.screen === "end");
        var bob = Math.sin((state.runPhase || 0) * 2) * ((state.grounded !== false) ? 3 : 0) + (idle ? Math.sin((state.t || 0) * 2) * 2 : 0);
        var look = Math.max(-6, Math.min(6, state.lookX || 0));
        return { y: y, bob: bob, dance: dance, look: look };
      }

      function shadow(x, gy) {
        ctx.fillStyle = "rgba(0,0,0,0.18)";
        ctx.beginPath();
        ctx.ellipse(x, gy + 16, 26, 8, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      function beginSpin(x, gy) {
        if (!state.jumpArc) return;
        var ang = state.flipAng || 0;
        if (state.winMove === "cartwheel") ang = state.flipAng * 1.15;
        else if (state.winMove === "slide" || state.winMove === "dance") ang = Math.sin(state.winT * 8) * 0.18;
        else if (state.winMove === "bounce") ang = Math.sin(state.flipAng) * 0.35;
        else if (state.winMove === "highfive") ang = Math.min(0.4, state.flipAng * 0.2);
        ctx.translate(x, gy + (state.heroY || 0) - 48);
        ctx.rotate(ang);
        ctx.translate(-x, -(gy + (state.heroY || 0) - 48));
      }

      function drawHats(x, gy) {
        var c = typeof costume === "function" ? costume() : {};
        var acc = c.acc || "none";
        if (!acc || acc === "none" || acc === "antenna") return;
        var p = pose(x, gy), y = p.y, bob = p.bob;
        ctx.save();
        ctx.translate(p.dance, 0);
        beginSpin(x, gy);
        if (acc === "cape" || acc === "starcape") {
          ctx.fillStyle = acc === "starcape" ? "#f4c430" : "#c0392b";
          ctx.beginPath();
          ctx.moveTo(x - 6, y - 48 + bob);
          ctx.quadraticCurveTo(x - 46, y - 16 + bob, x - 16, y - 4 + bob);
          ctx.lineTo(x - 4, y - 26 + bob);
          ctx.fill();
        }
        if (acc === "picnic") {
          ctx.fillStyle = "#c0392b";
          ctx.beginPath(); ctx.ellipse(x, y - 86 + bob, 20, 6, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = "#fff8e7";
          ctx.beginPath(); ctx.ellipse(x, y - 90 + bob, 13, 8, 0, Math.PI, Math.PI * 2); ctx.fill();
        }
        if (acc === "straw") {
          ctx.fillStyle = "#e2b84a";
          ctx.beginPath(); ctx.ellipse(x, y - 82 + bob, 22, 6, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = "#c9922a";
          ctx.fillRect(x - 10, y - 96 + bob, 20, 14);
        }
        if (acc === "wizard") {
          ctx.fillStyle = "#6c3483";
          ctx.beginPath(); ctx.moveTo(x - 16, y - 80 + bob); ctx.lineTo(x, y - 118 + bob); ctx.lineTo(x + 16, y - 80 + bob); ctx.fill();
          ctx.fillStyle = "#f4c430";
          ctx.beginPath(); ctx.arc(x + 6, y - 98 + bob, 2.4, 0, Math.PI * 2); ctx.fill();
        }
        if (acc === "firefly") {
          // Jar with a tiny glowing firefly inside
          var aft = state.t || 0;
          var afg = 0.5 + Math.sin(aft * 7) * 0.35;
          ctx.fillStyle = "rgba(220,240,255,0.35)";
          ctx.fillRect(x + 12, y - 78 + bob, 16, 18);
          ctx.strokeStyle = "#7a4b00"; ctx.lineWidth = 2; ctx.strokeRect(x + 12, y - 78 + bob, 16, 18);
          ctx.fillStyle = "#8b6914";
          ctx.fillRect(x + 11, y - 80 + bob, 18, 3);
          ctx.fillStyle = "rgba(180,255,80," + (0.22 + afg * 0.28) + ")";
          ctx.beginPath(); ctx.arc(x + 20, y - 68 + bob, 4.5, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = "#3a4a28";
          ctx.beginPath(); ctx.ellipse(x + 20, y - 70 + bob, 1.2, 2, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = "rgba(220,255,100," + afg + ")";
          ctx.beginPath(); ctx.arc(x + 20, y - 67 + bob, 2, 0, Math.PI * 2); ctx.fill();
        }
        if (acc === "backpack") {
          ctx.fillStyle = "#2b6cb0"; ctx.fillRect(x - 26, y - 46 + bob, 14, 22);
          ctx.fillStyle = "#f4c430"; ctx.fillRect(x - 24, y - 40 + bob, 10, 8);
        }
        if (acc === "mask") {
          ctx.fillStyle = "#1b2a41";
          ctx.fillRect(x - 14, y - 66 + bob, 28, 10);
        }
        if (acc === "horn") {
          ctx.fillStyle = "#f4c430";
          ctx.beginPath(); ctx.moveTo(x - 2, y - 78 + bob); ctx.lineTo(x + 2, y - 78 + bob); ctx.lineTo(x, y - 104 + bob); ctx.fill();
        }
        if (acc === "wings") {
          var flap = Math.sin(state.runPhase || 0) * 8;
          ctx.fillStyle = "#d7ecff";
          ctx.beginPath(); ctx.ellipse(x - 28, y - 40 + bob - flap, 16, 10, -0.4, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.ellipse(x + 28, y - 40 + bob - flap, 16, 10, 0.4, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
      }

      function drawBunny(x, gy) {
        var p = pose(x, gy), y = p.y, bob = p.bob, look = p.look;
        shadow(x, gy);
        ctx.save();
        ctx.translate(p.dance, 0);
        beginSpin(x, gy);
        ctx.fillStyle = "#efe6d6";
        ctx.beginPath(); ctx.ellipse(x - 18, y - 18 + bob, 7, 5, -0.4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#f6eee3";
        ctx.beginPath(); ctx.ellipse(x, y - 28 + bob, 20, 24, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#fffaf3";
        ctx.beginPath(); ctx.ellipse(x + 2, y - 24 + bob, 12, 16, 0.1, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#f6eee3";
        ctx.beginPath(); ctx.ellipse(x - 12, y - 6 + bob, 8, 5, 0.2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(x + 12, y - 6 + bob, 8, 5, -0.2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#f6eee3";
        ctx.beginPath(); ctx.ellipse(x - 10, y - 92 + bob, 6, 22, -0.18, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(x + 10, y - 94 + bob, 6, 23, 0.16, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#f4b6c8";
        ctx.beginPath(); ctx.ellipse(x - 10, y - 90 + bob, 2.4, 14, -0.18, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(x + 10, y - 92 + bob, 2.4, 15, 0.16, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#f6eee3";
        ctx.beginPath(); ctx.arc(x, y - 62 + bob, 18, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#fffaf3";
        ctx.beginPath(); ctx.ellipse(x + 1, y - 56 + bob, 11, 8, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#1b2a41";
        ctx.beginPath(); ctx.arc(x - 6 + look, y - 64 + bob, 2.6, 0, Math.PI * 2); ctx.arc(x + 7 + look, y - 64 + bob, 2.6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.beginPath(); ctx.arc(x - 5 + look, y - 65 + bob, 1, 0, Math.PI * 2); ctx.arc(x + 8 + look, y - 65 + bob, 1, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#f4a7c0";
        ctx.beginPath(); ctx.ellipse(x + 1, y - 56 + bob, 3.2, 2.4, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = "#1b2a41"; ctx.lineWidth = 1.2; ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(x - 4, y - 56 + bob); ctx.lineTo(x - 18, y - 58 + bob);
        ctx.moveTo(x - 4, y - 54 + bob); ctx.lineTo(x - 17, y - 50 + bob);
        ctx.moveTo(x + 6, y - 56 + bob); ctx.lineTo(x + 20, y - 58 + bob);
        ctx.moveTo(x + 6, y - 54 + bob); ctx.lineTo(x + 19, y - 50 + bob);
        ctx.stroke();
        ctx.restore();
        drawHats(x, gy);
      }

      function drawFrog(x, gy) {
        var p = pose(x, gy), y = p.y, bob = p.bob, look = p.look;
        shadow(x, gy);
        ctx.save();
        ctx.translate(p.dance, 0);
        beginSpin(x, gy);
        ctx.fillStyle = "#3cb371";
        ctx.beginPath(); ctx.ellipse(x - 16, y - 10 + bob, 10, 6, 0.2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(x + 16, y - 10 + bob, 10, 6, -0.2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(x, y - 28 + bob, 24, 20, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#d4f5d8";
        ctx.beginPath(); ctx.ellipse(x + 1, y - 24 + bob, 14, 12, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#3cb371";
        ctx.beginPath(); ctx.ellipse(x, y - 52 + bob, 22, 16, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#fffef2";
        ctx.beginPath(); ctx.ellipse(x - 10 + look * 0.3, y - 64 + bob, 8.5, 8.5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(x + 10 + look * 0.3, y - 64 + bob, 8.5, 8.5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = "#2e8b3a"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(x - 10 + look * 0.3, y - 64 + bob, 8.5, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(x + 10 + look * 0.3, y - 64 + bob, 8.5, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = "#1b2a41";
        ctx.beginPath(); ctx.arc(x - 10 + look, y - 64 + bob, 3.1, 0, Math.PI * 2); ctx.arc(x + 10 + look, y - 64 + bob, 3.1, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.beginPath(); ctx.arc(x - 9 + look, y - 66 + bob, 1.1, 0, Math.PI * 2); ctx.arc(x + 11 + look, y - 66 + bob, 1.1, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#2e8b3a";
        ctx.beginPath(); ctx.ellipse(x + 1, y - 46 + bob, 7, 3.2, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = "#2e8b3a"; ctx.lineWidth = 2; ctx.lineCap = "round";
        ctx.beginPath(); ctx.arc(x + 1, y - 44 + bob, 8, 0.15, Math.PI - 0.15); ctx.stroke();
        ctx.restore();
        drawHats(x, gy);
      }

      function drawOwl(x, gy) {
        var p = pose(x, gy), y = p.y, bob = p.bob, look = p.look;
        shadow(x, gy);
        ctx.save();
        ctx.translate(p.dance, 0);
        beginSpin(x, gy);
        ctx.fillStyle = "#7a5344";
        ctx.beginPath(); ctx.ellipse(x, y - 32 + bob, 22, 28, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#c9a27a";
        ctx.beginPath(); ctx.ellipse(x, y - 26 + bob, 12, 16, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#7a5344";
        ctx.beginPath(); ctx.moveTo(x - 16, y - 70 + bob); ctx.lineTo(x - 22, y - 86 + bob); ctx.lineTo(x - 6, y - 74 + bob); ctx.fill();
        ctx.beginPath(); ctx.moveTo(x + 16, y - 70 + bob); ctx.lineTo(x + 22, y - 86 + bob); ctx.lineTo(x + 6, y - 74 + bob); ctx.fill();
        ctx.fillStyle = "#d8c3a3";
        ctx.beginPath(); ctx.ellipse(x, y - 58 + bob, 20, 16, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#ffe9a8";
        ctx.beginPath(); ctx.arc(x - 8 + look * 0.2, y - 60 + bob, 8, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x + 8 + look * 0.2, y - 60 + bob, 8, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#1b2a41";
        ctx.beginPath(); ctx.arc(x - 8 + look, y - 60 + bob, 3.4, 0, Math.PI * 2); ctx.arc(x + 8 + look, y - 60 + bob, 3.4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.beginPath(); ctx.arc(x - 7 + look, y - 62 + bob, 1.2, 0, Math.PI * 2); ctx.arc(x + 9 + look, y - 62 + bob, 1.2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#e67e22";
        ctx.beginPath(); ctx.moveTo(x - 4, y - 52 + bob); ctx.lineTo(x, y - 44 + bob); ctx.lineTo(x + 4, y - 52 + bob); ctx.closePath(); ctx.fill();
        ctx.fillStyle = "#6b3f32";
        ctx.beginPath(); ctx.ellipse(x - 18, y - 36 + bob, 8, 16, -0.4, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(x + 18, y - 36 + bob, 8, 16, 0.4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#c9843a";
        ctx.beginPath(); ctx.ellipse(x - 8, y - 6 + bob, 5, 3, 0.2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(x + 8, y - 6 + bob, 5, 3, -0.2, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        drawHats(x, gy);
      }

      function drawPenguin(x, gy) {
        var p = pose(x, gy), y = p.y, bob = p.bob, look = p.look;
        var waddle = Math.sin((state.runPhase || 0) * 2) * 3;
        shadow(x, gy);
        ctx.save();
        ctx.translate(p.dance + waddle * 0.2, 0);
        beginSpin(x, gy);
        ctx.fillStyle = "#e67e22";
        ctx.beginPath(); ctx.ellipse(x - 9, y - 5 + bob, 8, 3.4, 0.15, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(x + 9, y - 5 + bob, 8, 3.4, -0.15, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#1b2430";
        ctx.beginPath(); ctx.ellipse(x, y - 32 + bob, 20, 28, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#f7f4ee";
        ctx.beginPath(); ctx.ellipse(x + 1, y - 28 + bob, 13, 20, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#1b2430";
        ctx.beginPath(); ctx.ellipse(x - 20, y - 34 + bob, 7, 14, 0.45, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(x + 20, y - 34 + bob, 7, 14, -0.45, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x, y - 62 + bob, 16, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#f7f4ee";
        ctx.beginPath(); ctx.ellipse(x - 6, y - 58 + bob, 6, 7, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(x + 6, y - 58 + bob, 6, 7, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#1b2a41";
        ctx.beginPath(); ctx.arc(x - 6 + look, y - 58 + bob, 2.5, 0, Math.PI * 2); ctx.arc(x + 6 + look, y - 58 + bob, 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.beginPath(); ctx.arc(x - 5 + look, y - 59 + bob, 0.9, 0, Math.PI * 2); ctx.arc(x + 7 + look, y - 59 + bob, 0.9, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#f4a259";
        ctx.beginPath();
        ctx.moveTo(x - 4.5, y - 51.5 + bob);
        ctx.lineTo(x + 4.5, y - 51.5 + bob);
        ctx.lineTo(x, y - 43 + bob);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#e67e22";
        ctx.beginPath();
        ctx.moveTo(x - 3, y - 51 + bob);
        ctx.lineTo(x + 3, y - 51 + bob);
        ctx.lineTo(x, y - 47 + bob);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        drawHats(x, gy);
      }

      function softBlink(x, y, bob, look, gap) {
        gap = gap == null ? 6 : gap;
        var blinking = (state.blinkT || 0) > 0;
        if (blinking) {
          ctx.strokeStyle = "#1b2a41";
          ctx.lineWidth = 2;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(x - gap - 3 + look, y + bob);
          ctx.lineTo(x - gap + 3 + look, y + bob);
          ctx.moveTo(x + gap - 3 + look, y + bob);
          ctx.lineTo(x + gap + 3 + look, y + bob);
          ctx.stroke();
          return true;
        }
        return false;
      }

      function drawFox(x, gy) {
        var p = pose(x, gy), y = p.y, bob = p.bob, look = p.look;
        shadow(x, gy);
        ctx.save();
        ctx.translate(p.dance, 0);
        beginSpin(x, gy);
        // bushy tail
        ctx.fillStyle = "#ff8a3c";
        ctx.beginPath(); ctx.ellipse(x - 28, y - 22 + bob, 14, 10, -0.55, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#ffe0bd";
        ctx.beginPath(); ctx.ellipse(x - 32, y - 22 + bob, 7, 5, -0.55, 0, Math.PI * 2); ctx.fill();
        // body
        ctx.fillStyle = "#ff8a3c";
        ctx.beginPath(); ctx.ellipse(x, y - 30 + bob, 20, 24, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#ffe0bd";
        ctx.beginPath(); ctx.ellipse(x + 2, y - 26 + bob, 11, 15, 0.08, 0, Math.PI * 2); ctx.fill();
        // feet
        ctx.fillStyle = "#e56f28";
        ctx.beginPath(); ctx.ellipse(x - 10, y - 6 + bob, 8, 4.5, 0.2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(x + 12, y - 6 + bob, 8, 4.5, -0.2, 0, Math.PI * 2); ctx.fill();
        // pointed ears
        ctx.fillStyle = "#ff8a3c";
        ctx.beginPath();
        ctx.moveTo(x - 16, y - 72 + bob); ctx.lineTo(x - 8, y - 98 + bob); ctx.lineTo(x - 2, y - 74 + bob);
        ctx.closePath(); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x + 16, y - 72 + bob); ctx.lineTo(x + 8, y - 98 + bob); ctx.lineTo(x + 2, y - 74 + bob);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = "#ffe0bd";
        ctx.beginPath();
        ctx.moveTo(x - 13, y - 74 + bob); ctx.lineTo(x - 8, y - 90 + bob); ctx.lineTo(x - 5, y - 74 + bob);
        ctx.closePath(); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x + 13, y - 74 + bob); ctx.lineTo(x + 8, y - 90 + bob); ctx.lineTo(x + 5, y - 74 + bob);
        ctx.closePath(); ctx.fill();
        // head + white muzzle
        ctx.fillStyle = "#ff8a3c";
        ctx.beginPath(); ctx.arc(x, y - 60 + bob, 17, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#fff6ea";
        ctx.beginPath(); ctx.ellipse(x + 1, y - 52 + bob, 10, 7.5, 0, 0, Math.PI * 2); ctx.fill();
        if (!softBlink(x, y - 62, bob, look, 6.5)) {
          ctx.fillStyle = "#1b2a41";
          ctx.beginPath(); ctx.arc(x - 6.5 + look, y - 62 + bob, 2.6, 0, Math.PI * 2); ctx.arc(x + 6.5 + look, y - 62 + bob, 2.6, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = "#fff";
          ctx.beginPath(); ctx.arc(x - 5.5 + look, y - 63.2 + bob, 1, 0, Math.PI * 2); ctx.arc(x + 7.5 + look, y - 63.2 + bob, 1, 0, Math.PI * 2); ctx.fill();
        }
        // dark nose
        ctx.fillStyle = "#1b2a41";
        ctx.beginPath(); ctx.ellipse(x + 1, y - 50 + bob, 2.6, 2, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = "#1b2a41"; ctx.lineWidth = 1.2; ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(x + 1, y - 48 + bob); ctx.lineTo(x + 1, y - 45 + bob);
        ctx.moveTo(x + 1, y - 45 + bob); ctx.quadraticCurveTo(x - 3, y - 43 + bob, x - 6, y - 44 + bob);
        ctx.moveTo(x + 1, y - 45 + bob); ctx.quadraticCurveTo(x + 5, y - 43 + bob, x + 8, y - 44 + bob);
        ctx.stroke();
        // cheek fluff
        ctx.fillStyle = "rgba(255,224,189,0.85)";
        ctx.beginPath(); ctx.ellipse(x - 12, y - 56 + bob, 5, 4, -0.2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(x + 14, y - 56 + bob, 5, 4, 0.2, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        drawHats(x, gy);
      }

      function drawCat(x, gy) {
        var p = pose(x, gy), y = p.y, bob = p.bob, look = p.look;
        shadow(x, gy);
        ctx.save();
        ctx.translate(p.dance, 0);
        beginSpin(x, gy);
        // soft tail curl
        ctx.strokeStyle = "#d4a017";
        ctx.lineWidth = 7;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(x - 16, y - 18 + bob);
        ctx.quadraticCurveTo(x - 34, y - 34 + bob, x - 28, y - 52 + bob);
        ctx.stroke();
        ctx.strokeStyle = "#f0c24a";
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(x - 16, y - 18 + bob);
        ctx.quadraticCurveTo(x - 32, y - 32 + bob, x - 28, y - 50 + bob);
        ctx.stroke();
        // body
        ctx.fillStyle = "#d4a017";
        ctx.beginPath(); ctx.ellipse(x, y - 28 + bob, 19, 22, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#fff3c4";
        ctx.beginPath(); ctx.ellipse(x + 1, y - 24 + bob, 11, 14, 0.05, 0, Math.PI * 2); ctx.fill();
        // feet
        ctx.fillStyle = "#c48f12";
        ctx.beginPath(); ctx.ellipse(x - 10, y - 6 + bob, 7.5, 4, 0.15, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(x + 11, y - 6 + bob, 7.5, 4, -0.15, 0, Math.PI * 2); ctx.fill();
        // pointed ears with pink inner
        ctx.fillStyle = "#d4a017";
        ctx.beginPath();
        ctx.moveTo(x - 15, y - 70 + bob); ctx.lineTo(x - 11, y - 94 + bob); ctx.lineTo(x - 3, y - 72 + bob);
        ctx.closePath(); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x + 15, y - 70 + bob); ctx.lineTo(x + 11, y - 94 + bob); ctx.lineTo(x + 3, y - 72 + bob);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = "#f7c1d4";
        ctx.beginPath();
        ctx.moveTo(x - 12, y - 72 + bob); ctx.lineTo(x - 10.5, y - 86 + bob); ctx.lineTo(x - 6, y - 72 + bob);
        ctx.closePath(); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x + 12, y - 72 + bob); ctx.lineTo(x + 10.5, y - 86 + bob); ctx.lineTo(x + 6, y - 72 + bob);
        ctx.closePath(); ctx.fill();
        // head
        ctx.fillStyle = "#d4a017";
        ctx.beginPath(); ctx.arc(x, y - 58 + bob, 16.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#fff3c4";
        ctx.beginPath(); ctx.ellipse(x + 1, y - 52 + bob, 9, 6.5, 0, 0, Math.PI * 2); ctx.fill();
        if (!softBlink(x, y - 60, bob, look, 6)) {
          ctx.fillStyle = "#1b2a41";
          ctx.beginPath(); ctx.arc(x - 6 + look, y - 60 + bob, 2.5, 0, Math.PI * 2); ctx.arc(x + 6 + look, y - 60 + bob, 2.5, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = "#fff";
          ctx.beginPath(); ctx.arc(x - 5 + look, y - 61.2 + bob, 0.95, 0, Math.PI * 2); ctx.arc(x + 7 + look, y - 61.2 + bob, 0.95, 0, Math.PI * 2); ctx.fill();
        }
        // pink nose
        ctx.fillStyle = "#f4a7c0";
        ctx.beginPath();
        ctx.moveTo(x - 3.5, y - 52 + bob); ctx.lineTo(x + 3.5, y - 52 + bob); ctx.lineTo(x, y - 47 + bob);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = "#1b2a41"; ctx.lineWidth = 1.15; ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(x, y - 47 + bob); ctx.lineTo(x, y - 44 + bob);
        ctx.moveTo(x, y - 44 + bob); ctx.lineTo(x - 4, y - 42 + bob);
        ctx.moveTo(x, y - 44 + bob); ctx.lineTo(x + 4, y - 42 + bob);
        ctx.stroke();
        // whiskers
        ctx.strokeStyle = "#1b2a41"; ctx.lineWidth = 1.35; ctx.lineCap = "round";
        [[-1, -6], [-1, 0], [-1, 6], [1, -6], [1, 0], [1, 6]].forEach(function(w) {
          ctx.beginPath();
          ctx.moveTo(x + (w[0] < 0 ? -7 : 9), y - 52 + bob);
          ctx.lineTo(x + (w[0] < 0 ? -24 : 26), y - 52 + bob + w[1]);
          ctx.stroke();
        });
        ctx.restore();
        drawHats(x, gy);
      }

      function drawBear(x, gy) {
        var p = pose(x, gy), y = p.y, bob = p.bob, look = p.look;
        shadow(x, gy);
        ctx.save();
        ctx.translate(p.dance, 0);
        beginSpin(x, gy);
        // heavier round body
        ctx.fillStyle = "#8d6e63";
        ctx.beginPath(); ctx.ellipse(x, y - 28 + bob, 24, 26, 0, 0, Math.PI * 2); ctx.fill();
        // soft belly
        ctx.fillStyle = "#ffe0bd";
        ctx.beginPath(); ctx.ellipse(x + 1, y - 24 + bob, 13, 16, 0, 0, Math.PI * 2); ctx.fill();
        // chunky feet
        ctx.fillStyle = "#6f5348";
        ctx.beginPath(); ctx.ellipse(x - 12, y - 5 + bob, 10, 5, 0.15, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(x + 13, y - 5 + bob, 10, 5, -0.15, 0, Math.PI * 2); ctx.fill();
        // round bear ears with inner ear
        ctx.fillStyle = "#8d6e63";
        ctx.beginPath(); ctx.arc(x - 16, y - 78 + bob, 10, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x + 16, y - 78 + bob, 10, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#c9a27a";
        ctx.beginPath(); ctx.arc(x - 16, y - 78 + bob, 5.2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x + 16, y - 78 + bob, 5.2, 0, Math.PI * 2); ctx.fill();
        // round head
        ctx.fillStyle = "#8d6e63";
        ctx.beginPath(); ctx.arc(x, y - 58 + bob, 20, 0, Math.PI * 2); ctx.fill();
        // short snout muzzle
        ctx.fillStyle = "#ffe0bd";
        ctx.beginPath(); ctx.ellipse(x + 1, y - 48 + bob, 11, 8, 0, 0, Math.PI * 2); ctx.fill();
        if (!softBlink(x, y - 62, bob, look, 7)) {
          ctx.fillStyle = "#1b2a41";
          ctx.beginPath(); ctx.arc(x - 7 + look, y - 62 + bob, 3, 0, Math.PI * 2); ctx.arc(x + 7 + look, y - 62 + bob, 3, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = "#fff";
          ctx.beginPath(); ctx.arc(x - 6 + look, y - 63.4 + bob, 1.1, 0, Math.PI * 2); ctx.arc(x + 8 + look, y - 63.4 + bob, 1.1, 0, Math.PI * 2); ctx.fill();
        }
        // darker nose
        ctx.fillStyle = "#3b2a22";
        ctx.beginPath(); ctx.ellipse(x + 1, y - 50 + bob, 4.2, 3.2, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.35)";
        ctx.beginPath(); ctx.arc(x - 0.5, y - 51 + bob, 1.2, 0, Math.PI * 2); ctx.fill();
        // small smile
        ctx.strokeStyle = "#5a4036"; ctx.lineWidth = 1.6; ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(x + 1, y - 47 + bob); ctx.lineTo(x + 1, y - 44 + bob);
        ctx.moveTo(x + 1, y - 44 + bob); ctx.quadraticCurveTo(x - 4, y - 41 + bob, x - 8, y - 43 + bob);
        ctx.moveTo(x + 1, y - 44 + bob); ctx.quadraticCurveTo(x + 6, y - 41 + bob, x + 10, y - 43 + bob);
        ctx.stroke();
        // arm cues
        ctx.fillStyle = "#7a5a4e";
        ctx.beginPath(); ctx.ellipse(x - 22, y - 30 + bob, 7, 12, 0.35, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(x + 22, y - 30 + bob, 7, 12, -0.35, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        drawHats(x, gy);
      }

      drawHero = function(x, gy) {
        // Skip draw only while invuln during active play — never on menu/end/shop
        if ((state.invuln || 0) > 0 && (state.screen === "play" || state.screen === "bonus") && Math.floor((state.t || 0) * 16) % 2 === 0) return;
        var id = who();
        if (id === "bunny") { drawBunny(x, gy); return; }
        if (id === "frog") { drawFrog(x, gy); return; }
        if (id === "owl") { drawOwl(x, gy); return; }
        if (id === "penguin") { drawPenguin(x, gy); return; }
        if (id === "fox") { drawFox(x, gy); return; }
        if (id === "cat") { drawCat(x, gy); return; }
        if (id === "bear") { drawBear(x, gy); return; }
        raw(x, gy);
      };
    })();


// ===== BIOME SYNC =====

/* daily-trail: fixed place order (no daily shuffle). Sync biome from placeIndex. */
(function dailyTrail() {
  function syncBiome() {
    var p = (typeof currentPlace === "function") ? currentPlace() : (PLACES && PLACES[state.placeIndex || 0]);
    if (p) state.biome = state.placeIndex % PLACES.length;
    if (typeof refreshGoal === "function") refreshGoal();
    var chip = document.getElementById("levelChip");
    if (chip && p) chip.textContent = p.name;
  }
  if (typeof startGame === "function") {
    var origStart = startGame;
    startGame = function(fromSave) {
      var out = origStart(fromSave);
      syncBiome();
      return out;
    };
  }
  if (typeof arriveAtNextPlace === "function") {
    var origArrive = arriveAtNextPlace;
    arriveAtNextPlace = function() {
      origArrive();
      syncBiome();
    };
  }
  syncBiome();
})();


// ===== SPACE SKY =====

(function spaceSky() {
  if (typeof drawGround !== "function") return;

  function inSpace() {
    var id = "";
    try {
      if (typeof currentPlace === "function" && currentPlace()) id = currentPlace().id;
    } catch (e) {}
    return (state.biome || 0) === 9 || id === "space" || !!state.launching;
  }

  if (state.spaceShips && state.spaceShips[0] && !state.spaceShips[0].accent) state.spaceShips = null;
  if (!state.spaceShips) {
    state.spaceShips = [];
    for (var i = 0; i < 5; i++) {
      state.spaceShips.push({
        x: Math.random() * 900,
        y: 36 + Math.random() * 140,
        s: 0.7 + Math.random() * 0.7,
        sp: 22 + Math.random() * 28,
        hue: ["#d7e4f5", "#c5d3e6", "#9ad0ff", "#e8eef8", "#b8c4d8"][i % 5],
        accent: ["#ff8a3c", "#7ad0ff", "#ffd166", "#c56cff", "#7dffb3"][i % 5],
        dir: Math.random() < 0.5 ? 1 : -1,
        kind: i % 2
      });
    }
  }
  if (!state.spacePlanets) {
    state.spacePlanets = [];
    var specs = [
      { x: 0.18, y: 70, r: 26, body: "#6ec6ff", shade: "#2b6cb0", ring: "#c5d3e6" },
      { x: 0.62, y: 120, r: 18, body: "#ffb36b", shade: "#c45a2a", ring: null },
      { x: 0.86, y: 60, r: 12, body: "#b388ff", shade: "#6a1b9a", ring: "#e1bee7" }
    ];
    for (var p = 0; p < specs.length; p++) state.spacePlanets.push(specs[p]);
  }

  function drawPlanet(pl, w) {
    var cx = w * pl.x;
    var cy = pl.y;
    var r = pl.r;
    ctx.fillStyle = pl.shade;
    ctx.beginPath();
    ctx.arc(cx + r * 0.25, cy + r * 0.2, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = pl.body;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.beginPath();
    ctx.arc(cx - r * 0.35, cy - r * 0.35, r * 0.35, 0, Math.PI * 2);
    ctx.fill();
    if (pl.ring) {
      ctx.strokeStyle = pl.ring;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(cx, cy, r * 1.7, r * 0.45, -0.3, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function drawShip(sh, dt) {
    sh.x += sh.sp * sh.dir * dt;
    var w = (typeof viewW === "function") ? viewW() : 800;
    if (sh.dir > 0 && sh.x > w + 70) { sh.x = -70; sh.y = 36 + Math.random() * 140; }
    if (sh.dir < 0 && sh.x < -70) { sh.x = w + 70; sh.y = 36 + Math.random() * 140; }
    var s = sh.s;
    ctx.save();
    ctx.translate(sh.x, sh.y);
    ctx.scale(sh.dir, 1);
    ctx.scale(s, s);
    ctx.fillStyle = "rgba(255,170,70,0.55)";
    ctx.beginPath();
    ctx.moveTo(-30, 2);
    ctx.lineTo(-46, 8);
    ctx.lineTo(-32, 0);
    ctx.lineTo(-46, -8);
    ctx.lineTo(-30, -2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#ffd166";
    ctx.beginPath();
    ctx.moveTo(-30, 0);
    ctx.lineTo(-40, 4);
    ctx.lineTo(-40, -4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = sh.hue;
    ctx.beginPath();
    ctx.moveTo(22, 0);
    ctx.lineTo(8, -9);
    ctx.lineTo(-22, -8);
    ctx.lineTo(-28, 0);
    ctx.lineTo(-22, 8);
    ctx.lineTo(8, 9);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = sh.accent || "#ff8a3c";
    ctx.beginPath();
    ctx.moveTo(-10, -8);
    ctx.lineTo(-18, -18);
    ctx.lineTo(-4, -8);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-10, 8);
    ctx.lineTo(-18, 18);
    ctx.lineTo(-4, 8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#7ec8ff";
    ctx.beginPath();
    ctx.ellipse(8, -1, 6, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#8ea0b8";
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.restore();
  }

  var rawGround = drawGround;
  drawGround = function(w, h, gy, scroll) {
    if (inSpace()) {
      ctx.fillStyle = "#050816";
      ctx.fillRect(0, 0, w, h);
      for (var i = 0; i < state.spacePlanets.length; i++) drawPlanet(state.spacePlanets[i], w);
      for (var j = 0; j < 70; j++) {
        var sx = ((j * 97 + scroll * 0.12) % (w + 40) + (w + 40)) % (w + 40) - 20;
        var sy = 16 + (j * 53) % Math.max(40, h - 40);
        var tw = 0.35 + 0.55 * Math.abs(Math.sin((state.t || 0) * 3 + j));
        ctx.fillStyle = "rgba(255,255,230," + tw + ")";
        ctx.beginPath();
        ctx.arc(sx, sy, j % 5 === 0 ? 2.2 : 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
      for (var k = 0; k < state.spaceShips.length; k++) drawShip(state.spaceShips[k], 0.016);
      ctx.fillStyle = "#12122a";
      ctx.fillRect(0, gy + 8, w, h);
      ctx.fillStyle = "#1a1a36";
      ctx.fillRect(0, gy, w, 12);
      return;
    }
    rawGround(w, h, gy, scroll);
  };

  if (typeof tickTrail === "function") {
    var rawTick = tickTrail;
    tickTrail = function(dt) {
      rawTick(dt);
      if (inSpace() && state.spaceShips) {
        for (var i = 0; i < state.spaceShips.length; i++) {
          state.spaceShips[i].x += state.spaceShips[i].sp * state.spaceShips[i].dir * dt;
        }
      }
    };
  }
})();


// ===== WIN BEATS =====

    (function winBeat() {
      var MOVES = ["flip", "cartwheel", "bounce"]; // jump-only
      if (typeof WIN_MOVES !== "undefined") {
        WIN_MOVES.length = 0;
        for (var i = 0; i < MOVES.length; i++) WIN_MOVES.push(MOVES[i]);
      }

      function gateDist() {
        if (!state.gate) return 9999;
        return state.gate.x - ((state.heroX || 180) + (state.leapX || 0));
      }

      function beginWin() {
        if (!state.answered || !state.gate) return;
        var m = state.winMove;
        if (MOVES.indexOf(m) < 0) {
          m = MOVES[(state.score || 1) % MOVES.length];
          state.winMove = m;
        }
        state.leapX = 0;
        state.didJump = false;
        state.jumpArc = false;
        state.beamUp = false;
        state.beamT = 0;
        state.buddyRush = false;
        state.rushing = true;
        state.sliding = false;
        state.dancing = false;
        state.winT = 0;
        state.winHold = 2.4;
        state.nextGateIn = Math.max(state.nextGateIn || 0, 2.4);
      }

      if (typeof jump === "function") {
        jump = function() {
          if (!state.answered || !state.gate) return;
          if (state.didJump) return;
          if (gateDist() > 340) return;
          state.didJump = true;
          state.sliding = false;
          state.dancing = false;
          var move = state.winMove || "flip";
          state.heroVy = move === "bounce" ? -880 : move === "cartwheel" ? -980 : -1080;
          state.grounded = false;
          state.jumpArc = true;
          state.flipAng = 0;
          if (typeof sfxJump === "function") sfxJump();
        };
      }

      if (typeof drawHero === "function") {
        var rawHero = drawHero;
        drawHero = function(x, gy) {
          rawHero(x + (state.leapX || 0), gy);
        };
      }
      if (typeof drawBird === "function") {
        var rawBird = drawBird;
        drawBird = function(x, gy) {
          rawBird(x + (state.leapX || 0), gy);
        };
      }

      if (typeof chooseAnswer === "function") {
        var rawChoose = chooseAnswer;
        chooseAnswer = function(i) {
          var was = state.answered;
          rawChoose(i);
          if (state.answered && !was && state.screen === "play") beginWin();
        };
      }

      if (typeof smashGate === "function") {
        var rawSmash = smashGate;
        smashGate = function(success) {
          rawSmash(success);
          if (success) {
            state.nextGateIn = Math.max(state.nextGateIn || 0, 1.3);
            state.winHold = Math.max(state.winHold || 0, 0.9);
          }
        };
      }

      if (typeof spawnGate === "function") {
        var rawSpawn = spawnGate;
        spawnGate = function() {
          if ((state.winHold || 0) > 0.08) return;
          if (state.gate && !state.gate.smashed) return;
          state.beamUp = false;
          state.beamT = 0;
          state.buddyRush = false;
          state.rushing = false;
          state.winHold = 0;
          state.leapX = 0;
          return rawSpawn();
        };
      }

      if (typeof tickTrail === "function") {
        var rawTick = tickTrail;
        tickTrail = function(dt) {
          if (dt > 0.05) dt = 0.05;
          rawTick(dt);
          if (state.screen !== "play") return;
          if ((state.winHold || 0) > 0) {
            state.winHold -= dt;
            state.nextGateIn = Math.max(state.nextGateIn || 0, state.winHold);
          }
          if (!state.gate) return;

          if (state.answered && !state.gate.smashed) {
            var dist = gateDist();
            // Jump over every gate — no beam lift, buddy smash, or run-through.
            if (dist < 300 && !state.didJump) jump();
            if (state.didJump) {
              state.leapX = Math.min(140, (state.leapX || 0) + 260 * dt);
              if ((state.heroY || 0) < -40 && dist <= 70) smashGate(true);
            }
          } else if ((state.leapX || 0) > 0) {
            state.leapX = Math.max(0, state.leapX - 380 * dt);
          }

          if (state.gate && state.gate.smashed && (state.winHold || 0) > 0) {
            state.nextGateIn = Math.max(state.nextGateIn || 0, state.winHold);
          }
        };
      }
    })();



// ===== PILOT LINK GATE =====
(function pilotLinkGate() {
  function parseUntil(raw) {
    if (!raw) return null;
    var m = String(raw).trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return null;
    var d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 23, 59, 59, 999);
    if (isNaN(d.getTime())) return null;
    return d;
  }
  function formatNice(d) {
    try {
      return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
    } catch (e) {
      return (d.getMonth() + 1) + "/" + d.getDate() + "/" + d.getFullYear();
    }
  }
  var params;
  try { params = new URLSearchParams(window.location.search || ""); } catch (e) { return; }
  var pilot = params.get("pilot");
  var until = parseUntil(params.get("until"));
  if (!pilot || !until) return;

  var banner = document.getElementById("pilotBanner");
  var ended = document.getElementById("pilotEnded");
  var menu = document.getElementById("menu");
  var shop = document.getElementById("shop");
  var endcard = document.getElementById("endcard");
  var now = new Date();
  var expired = now.getTime() > until.getTime();

  if (!expired) {
    if (banner) {
      banner.textContent = "Classroom pilot · free through " + formatNice(until);
      banner.classList.remove("hidden");
    }
    return;
  }

  function lockUi() {
    if (menu) menu.classList.add("hidden");
    if (shop) shop.classList.add("hidden");
    if (endcard) endcard.classList.add("hidden");
    if (ended) ended.classList.remove("hidden");
    var answers = document.getElementById("answers");
    if (answers) answers.classList.remove("show");
  }
  lockUi();

  if (typeof startGame === "function") {
    var realStart = startGame;
    startGame = function() {
      lockUi();
      return;
    };
  }
  ["startBtn", "continueBtn", "shopOpen", "againBtn"].forEach(function(id) {
    var el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("click", function(ev) {
      if (ev && ev.stopImmediatePropagation) ev.stopImmediatePropagation();
      if (ev && ev.preventDefault) ev.preventDefault();
      lockUi();
    }, true);
  });
})();

// ===== CONSOLIDATION FOOTER =====

(function consolidateFooter() {
  // Reaffirm final place list goals (idempotent).
  var FINAL = [
    { id: "hills", name: "Sunny Hills", goal: "Picnic Spot", arrive: "You made it to the picnic!" },
    { id: "picnic", name: "Picnic Spot", goal: "Duck Pond", arrive: "Picnic time!" },
    { id: "pond", name: "Duck Pond", goal: "Treehouse", arrive: "The ducks say hi!" },
    { id: "treehouse", name: "Treehouse", goal: "Red Barn", arrive: "Up in the treehouse!" },
    { id: "barn", name: "Red Barn", goal: "Pumpkin Patch", arrive: "The red barn!" },
    { id: "pumpkin", name: "Pumpkin Patch", goal: "Candy Trail", arrive: "Pumpkins everywhere!" },
    { id: "candy", name: "Candy Trail", goal: "Snowy Hill", arrive: "Sweet candy trail!" },
    { id: "snow", name: "Snowy Hill", goal: "Firefly Night", arrive: "Snow day!" },
    { id: "night", name: "Firefly Night", goal: "Outer Space", arrive: "Fireflies!" },
    { id: "space", name: "Outer Space", goal: "Sunny Hills", arrive: "Blast off!" }
  ];
  if (typeof PLACES !== "undefined") {
    PLACES.splice(0, PLACES.length);
    for (var i = 0; i < FINAL.length; i++) PLACES.push(FINAL[i]);
  }
  if (typeof refreshGoal === "function") refreshGoal();
  if (typeof updateHud === "function") updateHud();
})();
