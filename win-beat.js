    (function winBeat() {
      var MOVES = ["flip", "cartwheel", "bounce", "buddy", "beam"];
      if (typeof WIN_MOVES !== "undefined") {
        WIN_MOVES.length = 0;
        for (var i = 0; i < MOVES.length; i++) WIN_MOVES.push(MOVES[i]);
      }

      function visHero() {
        return (state.heroX || 180) * 2;
      }

      function parkGateOnce() {
        if (!state.gate || state.gate.smashed || state.gateParked) return;
        var w = (typeof viewW === "function") ? viewW() : 800;
        var hx = visHero();
        state.gate.x = Math.min(w * 0.72, hx + 170);
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
          state.winHold = 1.55;
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
          state.gateParked = false;
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
              state.rushing = true;
              if (!state.didJump) jump();
              if (state.didJump && state.gate) {
                var targetX = (state.gate.x + 40) / 2;
                state.heroX += (targetX - (state.heroX || 180)) * Math.min(1, dt * 5.5);
                if (visHero() >= state.gate.x - 8) smashGate(true);
              }
            }
          }

          if (state.gate && state.gate.smashed && (state.winHold || 0) > 0) {
            state.nextGateIn = Math.max(state.nextGateIn || 0, state.winHold);
          }
        };
      }
    })();
