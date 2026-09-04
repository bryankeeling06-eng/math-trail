    (function winBeat() {
      var MOVES = ["flip", "cartwheel", "bounce", "buddy", "beam"];
      if (typeof WIN_MOVES !== "undefined") {
        WIN_MOVES.length = 0;
        for (var i = 0; i < MOVES.length; i++) WIN_MOVES.push(MOVES[i]);
      }

      function visHero() {
        return (state.heroX || 180) * 2;
      }

      function parkGate() {
        if (!state.gate || state.gate.smashed) return;
        var w = (typeof viewW === "function") ? viewW() : 800;
        var hx = visHero();
        var minX = hx + 150;
        var maxX = w * 0.78;
        var target = Math.max(minX, Math.min(maxX, w * 0.68));
        if (state.gate.x > target + 8) state.gate.x = target;
        if (state.gate.x < minX) state.gate.x = minX;
      }

      function beginWin() {
        if (!state.answered || !state.gate) return;
        var m = state.winMove;
        if (MOVES.indexOf(m) < 0) {
          m = MOVES[(state.score || 1) % MOVES.length];
          state.winMove = m;
        }
        parkGate();
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
          state.winHold = 1.45;
        }
        state.nextGateIn = Math.max(state.nextGateIn || 0, state.winHold);
      }

      if (typeof jump === "function") {
        var rawJump = jump;
        jump = function() {
          if (!state.answered || !state.gate) return;
          if (state.didJump) return;
          if (state.winMove === "beam" || state.winMove === "buddy") return;
          state.didJump = true;
          state.sliding = false;
          state.dancing = false;
          state.heroVy = -920;
          state.grounded = false;
          state.jumpArc = true;
          state.flipAng = 0;
          if (typeof sfxJump === "function") sfxJump();
        };
      }

      if (typeof chooseAnswer === "function") {
        var rawChoose = chooseAnswer;
        chooseAnswer = function(i) {
          var was = state.answered;
          rawChoose(i);
          if (state.answered && !was && state.screen === "play") {
            beginWin();
          }
        };
      }

      if (typeof smashGate === "function") {
        var rawSmash = smashGate;
        smashGate = function(success) {
          rawSmash(success);
          if (success) {
            state.nextGateIn = Math.max(state.nextGateIn || 0, 1.25);
            state.winHold = Math.max(state.winHold || 0, 0.85);
            state.rushing = false;
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
            parkGate();
            var m = state.winMove;
            if (m === "beam") {
              state.beamUp = true;
              if ((state.beamT || 0) > 0.55 && !state.gate.smashed) smashGate(true);
            } else if (m === "buddy") {
              state.buddyRush = true;
              var home = state.buddyX != null ? state.buddyX : 112;
              if (state.buddyX == null) state.buddyX = home;
              if (state.buddyX >= state.gate.x - 40) smashGate(true);
            } else {
              state.rushing = true;
              if (!state.didJump) jump();
              if (state.didJump && (state.heroY || 0) > -8 && state.jumpArc === false) {
                if (!state.gate.smashed) smashGate(true);
              } else if ((state.winHold || 0) < 0.55 && !state.gate.smashed) {
                smashGate(true);
              }
            }
          }

          if (state.gate && state.gate.smashed && (state.winHold || 0) > 0) {
            state.nextGateIn = Math.max(state.nextGateIn || 0, state.winHold);
          }
        };
      }
    })();
