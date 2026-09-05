    (function winBeat() {
      var MOVES = ["flip", "cartwheel", "bounce", "buddy", "beam"];
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
        state.winHold = 2.2;
        state.nextGateIn = Math.max(state.nextGateIn || 0, 2.2);
      }

      if (typeof jump === "function") {
        jump = function() {
          if (!state.answered || !state.gate) return;
          if (state.didJump) return;
          if (state.winMove === "beam" || state.winMove === "buddy") return;
          if (gateDist() > 210) return;
          state.didJump = true;
          state.sliding = false;
          state.dancing = false;
          state.heroVy = -980;
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
            state.nextGateIn = Math.max(state.nextGateIn || 0, 1.2);
            state.winHold = Math.max(state.winHold || 0, 0.85);
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
          rawTick(dt);
          if (state.screen !== "play") return;
          if ((state.winHold || 0) > 0) {
            state.winHold -= dt;
            state.nextGateIn = Math.max(state.nextGateIn || 0, state.winHold);
          }
          if (!state.gate) return;

          if (state.answered && !state.gate.smashed) {
            var m = state.winMove;
            var dist = gateDist();
            if (m === "beam") {
              if (dist < 280) {
                state.beamUp = true;
                if ((state.beamT || 0) > 0.45) smashGate(true);
              }
            } else if (m === "buddy") {
              if (dist < 240) {
                state.buddyRush = true;
                if (state.buddyX == null) state.buddyX = 112;
                if (state.buddyX >= state.gate.x - 36) smashGate(true);
              }
            } else {
              if (dist < 200 && !state.didJump) jump();
              if (state.didJump) {
                state.leapX = Math.min(90, (state.leapX || 0) + 220 * dt);
                if (dist <= 20) smashGate(true);
              }
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
