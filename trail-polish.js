    (function trailPolish() {
      function inSpace() {
        return (state.biome || 0) === 9 || !!state.launching;
      }
      function candyTrail() {
        return (state.biome || 0) === 6;
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
        ctx.beginPath();
        ctx.ellipse(x, y + 10, 42, 16, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#c5d3e6";
        ctx.beginPath();
        ctx.ellipse(x, y + 7, 36, 11, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#d7e4f5";
        ctx.beginPath();
        ctx.ellipse(x, y - 16, 22, 20, 0, Math.PI, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#9aa8bb";
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = "#7ad0ff";
        ctx.beginPath();
        ctx.ellipse(x + 2, y - 18, 13, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#eef6ff";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = "#c9843a";
        ctx.beginPath();
        ctx.arc(x + 1, y - 20, 7.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffe0bd";
        ctx.beginPath();
        ctx.arc(x + 3, y - 19, 3.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#c9843a";
        ctx.beginPath();
        ctx.moveTo(x - 4, y - 24);
        ctx.lineTo(x - 2, y - 31);
        ctx.lineTo(x + 1, y - 24);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x + 6, y - 24);
        ctx.lineTo(x + 4, y - 31);
        ctx.lineTo(x + 2, y - 24);
        ctx.fill();
        ctx.fillStyle = "#1b2a41";
        ctx.beginPath();
        ctx.arc(x - 1, y - 21, 1.2, 0, Math.PI * 2);
        ctx.arc(x + 4, y - 21, 1.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "rgba(230,245,255,0.7)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(x + 6, y - 22, 6, 7, -0.3, 0.2, 1.8);
        ctx.stroke();

        ctx.fillStyle = "#6b7c92";
        ctx.fillRect(x - 28, y + 2, 8, 6);
        ctx.fillRect(x + 20, y + 2, 8, 6);
        ctx.restore();
      }

      if (typeof drawBuddy === "function") {
        var rawBuddy = drawBuddy;
        drawBuddy = function(x, gy) {
          if (inSpace()) {
            drawBuddyInShip(gy);
            return;
          }
          rawBuddy(x, gy);
        };
      }

      function sprinkleHills(w, h, gy, scroll) {
        var cols = ["#ff4d8d", "#fff7fb", "#7dffb3", "#ffd166", "#6ec6ff", "#c56cff", "#ff8ab8"];
        var layers = [
          { speed: 0.18, amp: 28, base: gy - 90 },
          { speed: 0.32, amp: 22, base: gy - 40 }
        ];
        for (var L = 0; L < layers.length; L++) {
          var layer = layers[L];
          for (var i = 0; i < 28; i++) {
            var px = ((i * 47 + scroll * layer.speed * 0.35) % (w + 24)) - 8;
            var n = Math.sin((px + scroll * layer.speed) * 0.008) * layer.amp +
                    Math.sin((px + scroll * layer.speed) * 0.019) * (layer.amp * 0.45);
            var py = layer.base + n + 8 + (i % 5);
            ctx.fillStyle = cols[(i + L * 3) % cols.length];
            ctx.beginPath();
            ctx.ellipse(px, py, 2.2 + (i % 3) * 0.6, 1.4 + (i % 2) * 0.4, 0.4, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.save();
        for (var g = 0; g < 36; g++) {
          var gx = ((g * 39 - scroll * 0.55) % (w + 16)) - 6;
          var gy2 = gy + 4 + (g % 4) * 3;
          ctx.fillStyle = cols[g % cols.length];
          ctx.beginPath();
          ctx.arc(gx, gy2, 1.6 + (g % 3) * 0.4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      if (typeof drawHills === "function") {
        var rawHills = drawHills;
        drawHills = function(w, h, gy, scroll) {
          rawHills(w, h, gy, scroll);
          if (candyTrail()) sprinkleHills(w, h, gy, scroll);
        };
      } else if (typeof drawGround === "function") {
        var rawG = drawGround;
        drawGround = function(w, h, gy, scroll) {
          rawG(w, h, gy, scroll);
          if (candyTrail()) sprinkleHills(w, h, gy, scroll);
        };
      }
    })();
