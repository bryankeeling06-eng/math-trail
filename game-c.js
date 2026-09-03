    (function trailPlayFix() {
      var oldChoose = chooseAnswer;
      chooseAnswer = function(i) {
        var was = state.answered;
        oldChoose(i);
        if (state.answered && !was && state.screen === "play") {
          state.buddyHop = 1.2;
          if (!state.didJump) jump();
        }
      };

      buddyDrawX = function() {
        var bx = (state.heroX || 180) - 68;
        if (state.gate && !state.gate.smashed) bx = Math.min(bx, state.gate.x - 110);
        return Math.max(72, bx);
      };

      var oldDrawBuddy = drawBuddy;
      drawBuddy = function(x, gy) {
        var hop = 0;
        if (state.buddyHop > 0) hop = Math.sin(Math.min(1, state.buddyHop) * Math.PI) * 18;
        oldDrawBuddy(x, gy - hop);
      };

      var oldTick = tickTrail;
      tickTrail = function(dt) {
        if (state.buddyHop > 0) state.buddyHop -= dt;
        oldTick(dt);
      };
    })();
