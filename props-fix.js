    (function onePropEach() {
      if (typeof drawGround !== "function") return;
      var prev = drawGround;
      drawGround = function(w, h, gy, scroll) {
        var b = state.biome || 0;
        var skipStack = (b === 5 || b === 7);
        if (!skipStack) {
          prev(w, h, gy, scroll);
          return;
        }
        var hidden = false;
        var rawFill = ctx.fill.bind(ctx);
        var rawStroke = ctx.stroke.bind(ctx);
        var rawFillRect = ctx.fillRect.bind(ctx);
        var rawFillText = ctx.fillText ? ctx.fillText.bind(ctx) : null;
        function mute() {
          if (hidden) return;
          hidden = true;
          ctx.fill = function() {};
          ctx.stroke = function() {};
          ctx.fillRect = function() {};
          if (ctx.fillText) ctx.fillText = function() {};
        }
        function unmute() {
          if (!hidden) return;
          hidden = false;
          ctx.fill = rawFill;
          ctx.stroke = rawStroke;
          ctx.fillRect = rawFillRect;
          if (rawFillText) ctx.fillText = rawFillText;
        }
        var span = w + 280;
        var mark = b === 7
          ? ((700 - scroll * 0.55) % span + span) % span - 80
          : ((760 - scroll * 0.55) % span + span) % span - 80;
        var rawArc = ctx.arc.bind(ctx);
        ctx.arc = function(x, y, r, a0, a1, ccw) {
          if (Math.abs(x - mark) < 50 && y < gy + 8) mute();
          return rawArc(x, y, r, a0, a1, ccw);
        };
        prev(w, h, gy, scroll);
        ctx.arc = rawArc;
        unmute();

        if (b === 7) {
          var smx = mark;
          ctx.fillStyle = "#fff";
          ctx.beginPath(); ctx.arc(smx, gy - 18, 20, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(smx, gy - 46, 15, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(smx, gy - 70, 12, 0, Math.PI * 2); ctx.fill();
          var swave = Math.sin((state.t || 0) * 4) * 12;
          ctx.strokeStyle = "#8b5a2b"; ctx.lineWidth = 3; ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(smx - 14, gy - 46); ctx.lineTo(smx - 30, gy - 56);
          ctx.moveTo(smx + 14, gy - 46); ctx.lineTo(smx + 28, gy - 58 - swave);
          ctx.stroke();
          ctx.fillStyle = "#1b1b1b";
          ctx.beginPath();
          ctx.arc(smx, gy - 36, 2.4, 0, Math.PI * 2);
          ctx.arc(smx, gy - 46, 2.4, 0, Math.PI * 2);
          ctx.arc(smx, gy - 56, 2.4, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#c0392b";
          ctx.beginPath(); ctx.ellipse(smx, gy - 62, 16, 5, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillRect(smx + 10, gy - 64, 8, 16);
          ctx.fillStyle = "#1b2a41";
          ctx.beginPath(); ctx.arc(smx - 4, gy - 73, 1.6, 0, Math.PI * 2); ctx.arc(smx + 4, gy - 73, 1.6, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = "#e67e22";
          ctx.beginPath(); ctx.moveTo(smx, gy - 70); ctx.lineTo(smx + 12, gy - 68); ctx.lineTo(smx, gy - 66); ctx.fill();
          ctx.fillStyle = "#1b1b1b";
          ctx.fillRect(smx - 16, gy - 84, 32, 7);
          ctx.fillRect(smx - 11, gy - 106, 22, 22);
          ctx.fillStyle = "#c0392b"; ctx.fillRect(smx - 11, gy - 86, 22, 3);
          var tx = smx - 95;
          ctx.fillStyle = "#1b6b34";
          ctx.beginPath(); ctx.moveTo(tx, gy - 150); ctx.lineTo(tx + 46, gy - 70); ctx.lineTo(tx - 46, gy - 70); ctx.fill();
          ctx.fillStyle = "#16552a";
          ctx.beginPath(); ctx.moveTo(tx, gy - 128); ctx.lineTo(tx + 34, gy - 72); ctx.lineTo(tx - 34, gy - 72); ctx.fill();
          ctx.fillStyle = "#7a4a22"; ctx.fillRect(tx - 5, gy - 70, 10, 18);
          ctx.fillStyle = "#ffd166";
          ctx.beginPath(); ctx.moveTo(tx, gy - 166); ctx.lineTo(tx + 8, gy - 150); ctx.lineTo(tx - 8, gy - 150); ctx.fill();
        }

        if (b === 5) {
          var x = mark;
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
      };
    })();
