    (function attachShipDome() {
      if (typeof ctx !== "undefined" && ctx) {
        if (ctx.arc) {
          var rawArc = ctx.arc.bind(ctx);
          ctx.arc = function(x, y, r, a0, a1, ccw) {
            rawArc(x, y, Math.max(0.2, Math.abs(Number(r)) || 0.2), a0, a1, ccw);
          };
        }
        if (ctx.ellipse) {
          var rawEl = ctx.ellipse.bind(ctx);
          ctx.ellipse = function(x, y, rx, ry, rot, a0, a1, ccw) {
            rawEl(x, y, Math.max(0.2, Math.abs(Number(rx)) || 0.2), Math.max(0.2, Math.abs(Number(ry)) || 0.2), rot || 0, a0, a1, ccw);
          };
        }
      }
      function forceStart() {
        var tp = document.getElementById("turnPhone");
        if (tp) tp.style.display = "none";
        var menuEl = document.getElementById("menu");
        if (menuEl) menuEl.classList.add("hidden");
        var endEl = document.getElementById("endcard");
        if (endEl) endEl.classList.add("hidden");
        if (typeof state !== "undefined") {
          state.screen = "play";
          state.paused = false;
        }
        try {
          if (typeof startGame === "function") startGame(false);
        } catch (err) {
          console.error(err);
        }
      }
      window.__mtStart = forceStart;
      var startBtn = document.getElementById("startBtn");
      if (startBtn) {
        startBtn.onclick = forceStart;
        startBtn.addEventListener("click", forceStart);
      }
      var turn = document.getElementById("turnPhone");
      if (turn) {
        turn.style.cursor = "pointer";
        turn.addEventListener("click", forceStart);
      }
      if (typeof frame === "function") {
        var rawFrame = frame;
        frame = function(now) {
          try {
            rawFrame(now);
          } catch (err) {
            console.error(err);
            requestAnimationFrame(frame);
          }
        };
      }
      if (typeof drawBuddy !== "function") return;
      var prev = drawBuddy;
      drawBuddy = function(x, gy) {
        if ((state.biome || 0) !== 9) return prev(x, gy);
        var hover = Math.sin((state.t || 0) * 5) * 6;
        var rimY = gy - 10 + hover;
        ctx.fillStyle = "rgba(120,200,255,0.16)";
        ctx.beginPath();
        ctx.ellipse(x, gy + 18 + hover, 32, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ff8a3c";
        ctx.beginPath();
        ctx.moveTo(x - 12, rimY + 10);
        ctx.lineTo(x - 7, rimY + 24 + Math.random() * 6);
        ctx.lineTo(x - 2, rimY + 10);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x + 2, rimY + 10);
        ctx.lineTo(x + 7, rimY + 24 + Math.random() * 6);
        ctx.lineTo(x + 12, rimY + 10);
        ctx.fill();
        if (typeof prev === "function") {
          var keep = state.biome;
          state.biome = 0;
          prev(x, rimY + 6);
          state.biome = keep;
        }
        ctx.fillStyle = "rgba(90,190,235,0.24)";
        ctx.beginPath();
        ctx.moveTo(x - 24, rimY + 2);
        ctx.quadraticCurveTo(x - 24, rimY - 50, x, rimY - 54);
        ctx.quadraticCurveTo(x + 24, rimY - 50, x + 24, rimY + 2);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "#c5cedd";
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.fillStyle = "#8e99ab";
        ctx.beginPath();
        ctx.ellipse(x, rimY + 8, 42, 16, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#d5dce8";
        ctx.beginPath();
        ctx.ellipse(x, rimY + 5, 32, 11, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#b7c0ce";
        ctx.beginPath();
        ctx.ellipse(x, rimY + 2, 26, 5, 0, 0, Math.PI * 2);
        ctx.fill();
      };
    })();
