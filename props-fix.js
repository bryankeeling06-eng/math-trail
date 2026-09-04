    (function onePropEach() {
      if (typeof drawGround !== "function") return;
      var prev = drawGround;

      function markX(w, scroll, seed) {
        var span = w + 280;
        return ((seed - scroll * 0.55) % span + span) % span - 80;
      }

      function drawStar(cx, cy, r) {
        ctx.fillStyle = "#ffd166";
        ctx.beginPath();
        for (var i = 0; i < 5; i++) {
          var a = -Math.PI / 2 + i * Math.PI * 2 / 5;
          var b = a + Math.PI / 5;
          ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
          ctx.lineTo(cx + Math.cos(b) * (r * 0.42), cy + Math.sin(b) * (r * 0.42));
        }
        ctx.closePath();
        ctx.fill();
      }

      function drawOneSnowman(x, gy) {
        ctx.fillStyle = "#fff";
        ctx.beginPath(); ctx.arc(x, gy - 18, 20, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x, gy - 46, 15, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x, gy - 70, 12, 0, Math.PI * 2); ctx.fill();
        var swave = Math.sin((state.t || 0) * 4) * 12;
        ctx.strokeStyle = "#8b5a2b"; ctx.lineWidth = 3; ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(x - 14, gy - 46); ctx.lineTo(x - 30, gy - 56);
        ctx.moveTo(x + 14, gy - 46); ctx.lineTo(x + 28, gy - 58 - swave);
        ctx.stroke();
        ctx.fillStyle = "#1b1b1b";
        ctx.beginPath();
        ctx.arc(x, gy - 36, 2.4, 0, Math.PI * 2);
        ctx.arc(x, gy - 46, 2.4, 0, Math.PI * 2);
        ctx.arc(x, gy - 56, 2.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#c0392b";
        ctx.beginPath(); ctx.ellipse(x, gy - 62, 16, 5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillRect(x + 10, gy - 64, 8, 16);
        ctx.fillStyle = "#1b2a41";
        ctx.beginPath(); ctx.arc(x - 4, gy - 73, 1.6, 0, Math.PI * 2); ctx.arc(x + 4, gy - 73, 1.6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#e67e22";
        ctx.beginPath(); ctx.moveTo(x, gy - 70); ctx.lineTo(x + 12, gy - 68); ctx.lineTo(x, gy - 66); ctx.fill();
        ctx.fillStyle = "#1b1b1b";
        ctx.fillRect(x - 16, gy - 84, 32, 7);
        ctx.fillRect(x - 11, gy - 106, 22, 22);
        ctx.fillStyle = "#c0392b"; ctx.fillRect(x - 11, gy - 86, 22, 3);
      }

      function drawGroundedTree(tx, gy) {
        var base = gy + 6;
        ctx.fillStyle = "#6b3a16"; ctx.fillRect(tx - 6, base - 22, 12, 22);
        ctx.fillStyle = "#1b6b34";
        ctx.beginPath(); ctx.moveTo(tx, base - 78); ctx.lineTo(tx + 40, base - 22); ctx.lineTo(tx - 40, base - 22); ctx.closePath(); ctx.fill();
        ctx.fillStyle = "#218c44";
        ctx.beginPath(); ctx.moveTo(tx, base - 102); ctx.lineTo(tx + 30, base - 52); ctx.lineTo(tx - 30, base - 52); ctx.closePath(); ctx.fill();
        ctx.fillStyle = "#2e8b3a";
        ctx.beginPath(); ctx.moveTo(tx, base - 122); ctx.lineTo(tx + 20, base - 80); ctx.lineTo(tx - 20, base - 80); ctx.closePath(); ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.ellipse(tx, base - 78, 18, 5, 0, 0, Math.PI * 2);
        ctx.ellipse(tx, base - 52, 26, 5, 0, 0, Math.PI * 2);
        ctx.ellipse(tx, base - 24, 34, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        var baubles = [[tx-16,base-40,"#e74c3c"],[tx+14,base-36,"#f4c430"],[tx-6,base-58,"#6ec6ff"],[tx+12,base-64,"#ff4d8d"],[tx-10,base-88,"#ffd166"],[tx+8,base-92,"#e74c3c"],[tx+18,base-48,"#7dffb3"],[tx-22,base-32,"#c56cff"]];
        for (var i = 0; i < baubles.length; i++) {
          ctx.fillStyle = baubles[i][2];
          ctx.beginPath(); ctx.arc(baubles[i][0], baubles[i][1], 3.4, 0, Math.PI * 2); ctx.fill();
        }
        drawStar(tx, base - 132, 10);
      }

      function drawOneScarecrow(x, gy) {
        ctx.fillStyle = "#8b5a2b"; ctx.fillRect(x - 4, gy - 100, 8, 100);
        ctx.fillStyle = "#c45a2a"; ctx.fillRect(x - 18, gy - 78, 36, 34);
        ctx.fillStyle = "#6b3a16"; ctx.fillRect(x - 18, gy - 48, 36, 5);
        var wave = Math.sin((state.t || 0) * 4) * 14;
        ctx.strokeStyle = "#6b3a16"; ctx.lineWidth = 6; ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(x - 18, gy - 68); ctx.lineTo(x - 36, gy - 56);
        ctx.moveTo(x + 18, gy - 68); ctx.lineTo(x + 36, gy - 60 - wave);
        ctx.stroke();
        ctx.fillStyle = "#ffe0bd";
        ctx.beginPath(); ctx.arc(x, gy - 92, 13, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#5d3a1a";
        ctx.beginPath(); ctx.arc(x - 5, gy - 94, 1.6, 0, Math.PI * 2); ctx.arc(x + 5, gy - 94, 1.6, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = "#5d3a1a"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(x, gy - 88, 4, 0.2, Math.PI - 0.2); ctx.stroke();
        ctx.fillStyle = "#d4a017";
        ctx.beginPath(); ctx.ellipse(x, gy - 100, 22, 5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillRect(x - 12, gy - 118, 24, 18);
        ctx.fillStyle = "#c9843a"; ctx.fillRect(x - 12, gy - 102, 24, 3);
        function crow(cx, cy, flip) {
          ctx.save(); ctx.translate(cx, cy); ctx.scale(flip, 1);
          ctx.fillStyle = "#1a1a1a";
          ctx.beginPath(); ctx.ellipse(0, 0, 7, 4.2, -0.2, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.ellipse(6, -2, 4, 3.2, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = "#f4c430";
          ctx.beginPath(); ctx.moveTo(10, -2); ctx.lineTo(15, -0.5); ctx.lineTo(10, 1); ctx.fill();
          ctx.restore();
        }
        crow(x - 8, gy - 126, 1);
        crow(x + 14, gy - 128, -1);
      }

      var PROP_COLS = {
        "#8b5a2b":1,"#c45a2a":1,"#6b3a16":1,"#d4a017":1,"#ffe0bd":1,"#c9843a":1,
        "#1b6b34":1,"#ffd166":1,"#c0392b":1,"#e67e22":1,"#1b1b1b":1,"#1a1a1a":1
      };

      drawGround = function(w, h, gy, scroll) {
        var b = state.biome || 0;
        if (b !== 5 && b !== 7) { prev(w, h, gy, scroll); return; }
        var rawFill = ctx.fill.bind(ctx);
        var rawFillRect = ctx.fillRect.bind(ctx);
        var rawStroke = ctx.stroke.bind(ctx);
        var rawArc = ctx.arc.bind(ctx);
        var rawEllipse = ctx.ellipse.bind(ctx);
        var hide = false;
        function col() { return String(ctx.fillStyle || "").toLowerCase(); }
        ctx.arc = function(x, y, r, a0, a1, ccw) {
          if (r >= 7 && y < gy + 6) hide = true;
          return rawArc(x, y, r, a0, a1, ccw);
        };
        ctx.ellipse = function(x, y, rx, ry, rot, a0, a1, ccw) {
          if (rx >= 10 && y < gy) hide = true;
          return rawEllipse(x, y, rx, ry, rot, a0, a1, ccw);
        };
        ctx.fill = function() {
          var c = col();
          if (hide || PROP_COLS[c] || (b === 7 && (c === "#fff" || c === "#ffffff" || c.indexOf("255, 255, 255") !== -1) && hide)) {
            hide = false;
            return;
          }
          hide = false;
          return rawFill();
        };
        ctx.fillRect = function(x, y, rw, rh) {
          if (y < gy && rh >= 6 && rw >= 6) return;
          return rawFillRect(x, y, rw, rh);
        };
        ctx.stroke = function() {
          if (hide || PROP_COLS[String(ctx.strokeStyle || "").toLowerCase()]) { hide = false; return; }
          return rawStroke();
        };
        prev(w, h, gy, scroll);
        ctx.fill = rawFill;
        ctx.fillRect = rawFillRect;
        ctx.stroke = rawStroke;
        ctx.arc = rawArc;
        ctx.ellipse = rawEllipse;
        if (b === 7) {
          var smx = markX(w, scroll, 700);
          drawOneSnowman(smx, gy);
          drawGroundedTree(smx - 95, gy);
        } else {
          drawOneScarecrow(markX(w, scroll, 760), gy);
        }
      };
    })();
