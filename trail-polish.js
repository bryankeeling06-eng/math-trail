    (function trailPolish() {
      function inSpace() {
        return (state.biome || 0) === 9 || !!state.launching;
      }
      function candyTrail() {
        return (state.biome || 0) === 6;
      }
      function snowTrail() {
        return (state.biome || 0) === 7;
      }

      function shipX() {
        var x = 108;
        if (state.heroX) x = Math.max(84, state.heroX - 86);
        if (state.gate && !state.gate.smashed && !state.beamUp) x = Math.min(x, state.gate.x - 120);
        return Math.max(70, x);
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
        ctx.fillStyle = "#c9843a";
        ctx.beginPath(); ctx.arc(x + 1, y - 20, 7.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#1b2a41";
        ctx.beginPath(); ctx.arc(x - 1, y - 21, 1.2, 0, Math.PI * 2); ctx.arc(x + 4, y - 21, 1.2, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }

      if (typeof drawBuddy === "function") {
        var rawBuddy = drawBuddy;
        drawBuddy = function(x, gy) {
          if (inSpace()) { drawBuddyInShip(gy); return; }
          rawBuddy(x, gy);
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
        var layers = [
          { speed: 0.18, amp: 28, base: gy - 90, depth: 48 },
          { speed: 0.32, amp: 22, base: gy - 40, depth: 28 }
        ];
        var span = w + 120;
        for (var L = 0; L < layers.length; L++) {
          var layer = layers[L];
          for (var i = 0; i < 80; i++) {
            var a = hash(i * 17.3 + L * 91.1);
            var b = hash(i * 9.7 + L * 4.2 + 20);
            var c = hash(i * 3.1 + L * 13.8 + 50);
            var d = hash(i * 21.4 + L * 2.6 + 80);
            var seed = a * span;
            var sx = ((seed - scroll * layer.speed) % span + span) % span - 30;
            var ridge = hillY(sx, scroll, layer);
            var sy = ridge + 8 + b * layer.depth;
            if (sy > gy - 8) continue;
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
          ctx.fillStyle = "#fff7fb";
          ctx.fillRect(x - 3, gy - 46, 6, 46);
          ctx.fillStyle = heads[i % heads.length];
          ctx.beginPath(); ctx.arc(x, gy - 58, 16, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = "rgba(255,255,255,0.5)"; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(x, gy - 58, 8, 0.2, 2.2); ctx.stroke();
        }
      }

      function drawFallingSnow(w, h) {
        if (!state.snowflakes || !state.snowflakes.length) {
          state.snowflakes = [];
          for (var s = 0; s < 56; s++) {
            state.snowflakes.push({ x: Math.random() * (w + 40), y: Math.random() * h, r: 1.5 + Math.random() * 2.4, v: 26 + Math.random() * 40, w: 0.4 + Math.random() * 0.8 });
          }
        }
        ctx.fillStyle = "rgba(255,255,255,0.92)";
        for (var i = 0; i < state.snowflakes.length; i++) {
          var f = state.snowflakes[i];
          f.y += f.v * 0.016;
          f.x += Math.sin((state.t || 0) * f.w + i) * 0.6;
          if (f.y > h + 8) { f.y = -8; f.x = Math.random() * w; }
          ctx.beginPath();
          ctx.arc(((f.x % (w + 20)) + (w + 20)) % (w + 20), f.y, f.r, 0, Math.PI * 2);
          ctx.fill();
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
        ctx.fillStyle = "#7dffb3";
        ctx.beginPath(); ctx.arc(gx, 20, 3, 0, Math.PI * 2); ctx.fill();
        ctx.translate(gx, gy - lift);
        ctx.globalAlpha = fade;
        ctx.fillStyle = "#8b5a2b";
        if (typeof roundRect === "function") {
          roundRect(-48, -150, 18, 168, 6); ctx.fill();
          roundRect(30, -150, 18, 168, 6); ctx.fill();
          ctx.fillStyle = "#c9843a";
          roundRect(-54, -168, 108, 36, 10); ctx.fill();
          ctx.fillStyle = "#fff8e7";
          roundRect(-70, -128, 140, 70, 12); ctx.fill();
        } else {
          ctx.fillRect(-48, -150, 18, 168);
          ctx.fillRect(30, -150, 18, 168);
          ctx.fillStyle = "#c9843a"; ctx.fillRect(-54, -168, 108, 36);
          ctx.fillStyle = "#fff8e7"; ctx.fillRect(-70, -128, 140, 70);
        }
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
          if (candyTrail()) drawSuckers(w, gy, scroll);
          if (snowTrail()) drawFallingSnow(w, h);
        };
      }

      if (typeof drawGate === "function") {
        var rawGate = drawGate;
        drawGate = function(g, gy) {
          if (inSpace() && (state.beamUp || (g && g.smashed && state.answered))) {
            drawAlienBeam(g, gy);
            return;
          }
          rawGate(g, gy);
        };
      }

      if (typeof chooseAnswer === "function") {
        var rawChoose = chooseAnswer;
        chooseAnswer = function(i) {
          rawChoose(i);
          if (inSpace() && state.answered) {
            state.rushing = false;
            state.dancing = false;
            state.sliding = false;
            state.beamUp = true;
            state.beamT = 0;
            if (state.gate) {
              state.gate.smashed = true;
              state.gate.smashT = 0;
            }
          }
        };
      }

      if (typeof smashGate === "function") {
        var rawSmash = smashGate;
        smashGate = function(success) {
          if (inSpace() && success) {
            state.beamUp = true;
            state.beamT = 0;
            state.rushing = false;
            if (state.gate) { state.gate.smashed = true; state.gate.smashT = 0; }
            return;
          }
          rawSmash(success);
        };
      }

      var lastT = 0;
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
