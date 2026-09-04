    (function winBeat() {
      var MOVES = ["flip", "cartwheel", "bounce", "buddy", "beam"];
      if (typeof WIN_MOVES !== "undefined") {
        WIN_MOVES.length = 0;
        for (var i = 0; i < MOVES.length; i++) WIN_MOVES.push(MOVES[i]);
      }

      function parkGateOnce() {
        if (!state.gate || state.gate.smashed || state.gateParked) return;
        var w = (typeof viewW === "function") ? viewW() : 800;
        var hx = state.heroX || 180;
        state.gate.x = Math.min(w * 0.7, hx + 160);
        state.gateParked = true;
      }

      function beginWin() {
        if (!state.answered || !state.gate) return;
        var m = state.winMove;
        if (MOVES.indexOf(m) < 0) {
          m = MOVES[(state.score || 1) % MOVES.length];
          state.winMove = m;
        }
        state.gateParked = false;
        state.leapX = 0;
        parkGateOnce();
        state.didJump = false;
        state.jumpArc = false;
        state.beamUp = false;
        state.beamT = 0;
        state.buddyRush = false;
        state.rushing = false;
        state.sliding = false;
        state.dancing = false;
        state.winT = 0;
        if (m === "beam") {
          state.beamUp = true;
          state.beamT = 0;
          state.winHold = 1.4;
        } else if (m === "buddy") {
          state.buddyRush = true;
          state.winHold = 1.25;
        } else {
          state.rushing = true;
          state.winHold = 1.6;
        }
        state.nextGateIn = Math.max(state.nextGateIn || 0, state.winHold);
      }

      if (typeof jump === "function") {
        jump = function() {
          if (!state.answered || !state.gate) return;
          if (state.didJump) return;
          if (state.winMove === "beam" || state.winMove === "buddy") return;
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
            state.nextGateIn = Math.max(state.nextGateIn || 0, 1.15);
            state.winHold = Math.max(state.winHold || 0, 0.7);
          }
        };
      }

      if (typeof spawnGate === "function") {
        var rawSpawn = spawnGate;
        spawnGate = function() {
          if ((state.winHold || 0) > 0.05) return;
          state.beamUp = false;
          state.beamT = 0;
          state.buddyRush = false;
          state.rushing = false;
          state.winHold = 0;
          state.gateParked = false;
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
            if (m === "beam") {
              state.beamUp = true;
              if ((state.beamT || 0) > 0.55) smashGate(true);
            } else if (m === "buddy") {
              state.buddyRush = true;
              if (state.buddyX == null) state.buddyX = 112;
              if (state.buddyX >= state.gate.x - 36) smashGate(true);
            } else {
              if (!state.didJump) jump();
              var need = Math.max(120, (state.gate.x || 400) - (state.heroX || 180) + 30);
              state.leapX = Math.min(need, (state.leapX || 0) + 280 * dt);
              var at = (state.heroX || 180) + (state.leapX || 0);
              if (at >= state.gate.x - 10) smashGate(true);
            }
          } else if ((state.leapX || 0) > 0 && (!state.answered || (state.winHold || 0) <= 0)) {
            state.leapX = Math.max(0, state.leapX - 420 * dt);
          }

          if (state.gate && state.gate.smashed && (state.winHold || 0) > 0) {
            state.nextGateIn = Math.max(state.nextGateIn || 0, state.winHold);
          }
        };
      }
    })();
