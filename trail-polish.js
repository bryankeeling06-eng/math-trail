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
        if (state.gate && !state.gate.smashed) x = Math.min(x, state.gate.x - 120);
        return Math.max(70, x);
      }

      function drawBuddyInShip(gy) {
        var x = shipX();
        var hover = Math.sin((state.t || 0) * 3.2) * 5;
        var y = gy - 18 + hover;
        ctx.save();
        ctx.fillStyle = "rgba(80,180,255,0.22)";
        ctx.beginPath();
        ctx.moveTo(x - 10, y + 10);
        ctx.lineTo(x - 16, y + 28 + Math.sin((state.t || 0) * 14) * 6);
        ctx.lineTo(x - 2, y + 10);
        ctx.fill();
        ctx.fillStyle = "rgba(255,180,70,0.55)";
        ctx.beginPath();
        ctx.moveTo(x + 2, y + 10);
        ctx.lineTo(x + 8, y + 24 + Math.cos((state.t || 0) * 16) * 5);
        ctx.lineTo(x + 12, y + 10);
        ctx.fill();
        ctx.fillStyle = "#8ea0b8";
        ctx.beginPath(); ctx.ellipse(x, y + 10, 42, 16, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#c5d3e6";
        ctx.beginPath(); ctx.ellipse(x, y + 7, 36, 11, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#d7e4f5";
        ctx.beginPath(); ctx.ellipse(x, y - 16, 22, 20, 0, Math.PI, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = "#9aa8bb"; ctx.lineWidth = 3; ctx.stroke();
        ctx.fillStyle = "#7ad0ff";
        ctx.beginPath(); ctx.ellipse(x + 2, y - 18, 13, 12, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = "#eef6ff"; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = "#c9843a";
        ctx.beginPath(); ctx.arc(x + 1, y - 20, 7.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#ffe0bd";
        ctx.beginPath(); ctx.arc(x + 3, y - 19, 3.2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#c9843a";
        ctx.beginPath(); ctx.moveTo(x - 4, y - 24); ctx.lineTo(x - 2, y - 31); ctx.lineTo(x + 1, y - 24); ctx.fill();
        ctx.beginPath(); ctx.moveTo(x + 6, y - 24); ctx.lineTo(x + 4, y - 31); ctx.lineTo(x + 2, y - 24); ctx.fill();
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
          { speed: 0.18, amp: 28, base: gy - 90, depth: 52 },
          { speed: 0.32, amp: 22, base: gy - 40, depth: 38 }
        ];
        var span = w + 120;
        for (var L = 0; L < layers.length; L++) {
          var layer = layers[L];
          for (var i = 0; i < 95; i++) {
            var a = hash(i * 17.3 + L * 91.1);
            var b = hash(i * 9.7 + L * 4.2 + 20);
            var c = hash(i * 3.1 + L * 13.8 + 50);
            var d = hash(i * 21.4 + L * 2.6 + 80);
            var seed = a * span;
            var sx = ((seed - scroll * layer.speed) % span + span) % span - 30;
            var ridge = hillY(sx, scroll, layer);
            var nextY = gy + 8;
            var room = Math.max(12, nextY - ridge);
            var sy = ridge + 4 + b * Math.min(layer.depth, room - 4);
            if (sy > gy + 10) continue;
            ctx.fillStyle = cols[Math.floor(c * cols.length)];
            ctx.beginPath();
            if (d > 0.55) {
              ctx.ellipse(sx, sy, 2.8 + a * 1.4, 1.05, d * Math.PI, 0, Math.PI * 2);
            } else {
              ctx.arc(sx, sy, 1.3 + b * 1.4, 0, Math.PI * 2);
            }
            ctx.fill();
          }
        }
        for (var g = 0; g < 40; g++) {
          var p = hash(g * 14.2 + 3.3);
          var q = hash(g * 8.8 + 7.1);
          var r = hash(g * 19.5 + 1.4);
          var gx = ((p * (w + 40) - scroll * 0.9) % (w + 40) + (w + 40)) % (w + 40) - 12;
          var gy2 = gy + 2 + q * 14;
          ctx.fillStyle = cols[Math.floor(r * cols.length)];
          ctx.beginPath();
          if (p > 0.5) ctx.ellipse(gx, gy2, 2.4, 1, q * Math.PI, 0, Math.PI * 2);
          else ctx.arc(gx, gy2, 1.4 + q, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      function drawFallingSnow(w, h) {
        if (!state.snowflakes || !state.snowflakes.length) {
          state.snowflakes = [];
          for (var s = 0; s < 56; s++) {
            state.snowflakes.push({
              x: Math.random() * (w + 40),
              y: Math.random() * h,
              r: 1.5 + Math.random() * 2.4,
              v: 26 + Math.random() * 40,
              w: 0.4 + Math.random() * 0.8
            });
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
          if (candyTrail() && typeof drawHills !== "function") sprinkleHills(w, h, gy, scroll);
          if (snowTrail()) drawFallingSnow(w, h);
        };
      }
    })();
