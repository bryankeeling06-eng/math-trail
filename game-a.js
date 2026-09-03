
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
      { id: "hills", name: "Sunny Hills", goal: "Picnic Spot", arrive: "You made it to the picnic!" },
      { id: "picnic", name: "Picnic Spot", goal: "Duck Pond", arrive: "Picnic time!" },
      { id: "pond", name: "Duck Pond", goal: "Treehouse", arrive: "The ducks say hi!" },
      { id: "treehouse", name: "Treehouse", goal: "Red Barn", arrive: "Up in the treehouse!" },
      { id: "barn", name: "Red Barn", goal: "Firefly Night", arrive: "The red barn!" },
      { id: "night", name: "Firefly Night", goal: "Sunny Hills", arrive: "Fireflies!" }
    ];
    var WIN_MOVES = ["flip", "cartwheel", "slide", "highfive", "bounce", "dance"];

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
      state.gate = { x: viewW() + 420, problem: p, smashed: false, smashT: 0, hit: false, style: style, fallNums: [] };
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
        if (!src) return;
        if (window.speechSynthesis) window.speechSynthesis.cancel();
        if (voicePlayer) { try { voicePlayer.pause(); } catch (e1) {} }
        voicePlayer = new Audio(src);
        voicePlayer.volume = 1;
        var play = voicePlayer.play();
        if (play && play.catch) play.catch(function(){});
      } catch (e) {}
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
        stampEl.textContent = line + (all.length ? ("  ·  Book: " + all.length + "/6") : "");
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
      showToast(currentPlace().arrive || ("Welcome to " + currentPlace().name));
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
      state.sliding = move === "slide";
      state.dancing = move === "dance";
      if (move === "slide") state.heroVy = -240;
      else if (move === "dance") state.heroVy = -300;
      else if (move === "highfive") { state.heroVy = -520; state.birdT = 1.1; }
      else if (move === "bounce") state.heroVy = -680;
      else state.heroVy = -980;
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

