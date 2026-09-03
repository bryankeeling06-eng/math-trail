    (function trailPlayFix() {
      var SMALL = { slide: 1, dance: 1, highfive: 1 };
      if (state.buddyX == null) state.buddyX = 112;

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

      function drawBetterPond(w, h, gy) {
        var x = w * 0.62;
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

      function drawCow(w, h, gy, scroll) {
        var x = w * 0.55 - (scroll * 0.2) % 30;
        var y = gy + 2;
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

      var oldLandmark = drawLandmark;
      drawLandmark = function(w, h, gy, scroll) {
        if ((state.biome || 0) === 3) return;
        oldLandmark(w, h, gy, scroll);
      };

      var oldGround = drawGround;
      drawGround = function(w, h, gy, scroll) {
        oldGround(w, h, gy, scroll);
        var b = state.biome || 0;
        if (b === 2) drawBetterPond(w, h, gy);
        if (b === 3) drawBetterTreehouse(w, h, gy, scroll);
        if (b === 4) drawCow(w, h, gy, scroll);
      };

      var rawJump = jump;
      jump = function() {
        if (state.didJump) return;
        if (!state.gate || state.gate.smashed) return;
        var dist = state.gate.x - (state.heroX || 180);
        if (dist > 360 || dist <= -10) return;
        if (SMALL[state.winMove]) {
          state.didJump = true;
          state.buddyRush = true;
          state.heroVy = -220;
          state.grounded = false;
          return;
        }
        rawJump();
      };

      var oldChoose = chooseAnswer;
      chooseAnswer = function(i) {
        var was = state.answered;
        oldChoose(i);
        if (state.answered && !was && state.screen === "play") {
          state.buddyHop = 1.2;
          if (SMALL[state.winMove]) state.buddyRush = true;
        }
      };

      buddyDrawX = function() {
        if (state.buddyRush) return state.buddyX || 112;
        var bx = (state.heroX || 180) - 68;
        if (state.gate && !state.gate.smashed) bx = Math.min(bx, state.gate.x - 110);
        return Math.max(72, bx);
      };

      var oldDrawBuddy = drawBuddy;
      drawBuddy = function(x, gy) {
        var hop = 0;
        if (state.buddyHop > 0) hop = Math.sin(Math.min(1, state.buddyHop) * Math.PI) * 18;
        var bx = state.buddyX != null ? state.buddyX : x;
        oldDrawBuddy(bx, gy - hop);
      };

      var oldTick = tickTrail;
      tickTrail = function(dt) {
        if (state.buddyHop > 0) state.buddyHop -= dt;
        var home = (state.heroX || 180) - 68;
        if (state.buddyRush && state.gate && !state.gate.smashed) {
          state.buddyX = (state.buddyX || home) + 420 * dt;
          if (state.buddyX >= state.gate.x - 36) {
            smashGate(true);
            state.rushing = false;
            state.buddyRush = false;
          }
        } else {
          if (state.buddyX == null) state.buddyX = home;
          state.buddyX += (home - state.buddyX) * Math.min(1, dt * 6);
          if (state.gate && !state.gate.smashed) state.buddyX = Math.min(state.buddyX, state.gate.x - 110);
        }
        oldTick(dt);
        if (state.answered && state.rushing && state.gate && !state.gate.smashed && !state.didJump) {
          jump();
        }
      };
    })();
