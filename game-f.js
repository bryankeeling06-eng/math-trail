    (function restoreTrailPolish() {
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
        if (typeof state !== "undefined") { state.screen = "play"; state.paused = false; }
        try { if (typeof startGame === "function") startGame(false); } catch (err) { console.error(err); }
      }
      window.__mtStart = forceStart;
      var startBtn = document.getElementById("startBtn");
      if (startBtn) startBtn.addEventListener("click", forceStart);
      if (typeof frame === "function") {
        var rawFrame = frame;
        frame = function(now) {
          try { rawFrame(now); } catch (err) { console.error(err); requestAnimationFrame(frame); }
        };
      }
      function drawBuddyProp(bx, by, b, gy) {
        ctx.save();
        if (b === 1) {
          ctx.strokeStyle = "#8b5a2b"; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.moveTo(bx + 8, by - 20); ctx.lineTo(bx + 2, by - 62); ctx.stroke();
          ctx.fillStyle = "#e74c3c";
          ctx.beginPath();
          ctx.moveTo(bx + 2, by - 62);
          ctx.quadraticCurveTo(bx - 26, by - 50, bx - 28, by - 38);
          ctx.lineTo(bx + 2, by - 44);
          ctx.quadraticCurveTo(bx + 30, by - 50, bx + 32, by - 38);
          ctx.lineTo(bx + 2, by - 62);
          ctx.fill();
        } else if (b === 2) {
          var ww = (typeof viewW === "function") ? viewW() : 800;
          var spanP = ww + 280;
          var pondX = ((680 - (state.scroll || 0) * 0.55) % spanP + spanP) % spanP - 80;
          var dist = pondX - bx;
          if (!state.breadToss && dist > 50 && dist < 170) {
            state.breadToss = { start: state.t || 0, sx: bx + 12, sy: by - 20, tx: pondX - 10, ty: gy + 8 };
          }
          if (state.breadToss && dist < -120) state.breadToss = null;
          var flying = state.breadToss && ((state.t || 0) - state.breadToss.start) > 0.04;
          if (!flying) { ctx.fillStyle = "#e8d5a3"; ctx.fillRect(bx + 10, by - 22, 10, 7); }
          var p = 0, breadX = pondX;
          if (state.breadToss && flying) {
            p = Math.min(1, Math.max(0, ((state.t || 0) - state.breadToss.start) / 1.15));
            breadX = state.breadToss.sx + (state.breadToss.tx - state.breadToss.sx) * p;
            var breadY = state.breadToss.sy + (state.breadToss.ty - state.breadToss.sy) * p - Math.sin(p * Math.PI) * 28;
            ctx.fillStyle = "#e8d5a3"; ctx.fillRect(breadX, breadY, 9, 6);
          }
          function swimDuck(dx, dy, flip) {
            ctx.save(); ctx.translate(dx, dy); ctx.scale(flip, 1);
            ctx.fillStyle = "#f4c430";
            ctx.beginPath(); ctx.ellipse(0, 2, 12, 7, 0, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(10, -3, 5.2, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = "#e67e22";
            ctx.beginPath(); ctx.moveTo(14, -3); ctx.lineTo(22, -1); ctx.lineTo(14, 1); ctx.fill();
            ctx.restore();
          }
          swimDuck((pondX - 40) + p * (breadX - (pondX - 40)) * 0.5, gy + 8, 1);
          swimDuck((pondX + 48) + p * (breadX - (pondX + 48)) * 0.5, gy + 10, -1);
        } else if (b === 3) {
          ctx.fillStyle = "#8b5a2b"; ctx.fillRect(bx + 12, by - 36, 4, 28);
          ctx.fillStyle = "#7f8c8d"; ctx.fillRect(bx + 4, by - 42, 20, 10);
        } else if (b === 4) {
          ctx.fillStyle = "#cfd4da"; ctx.fillRect(bx + 6, by - 28, 22, 20); ctx.fillRect(bx + 4, by - 32, 26, 6);
          ctx.fillStyle = "#2c3e50"; ctx.font = "bold 7px sans-serif"; ctx.textAlign = "center";
          ctx.fillText("MILK", bx + 17, by - 14);
        } else if (b === 5) {
          ctx.fillStyle = "#e67e22";
          ctx.beginPath(); ctx.ellipse(bx + 18, by - 12, 9, 7, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = "#2e8b3a"; ctx.fillRect(bx + 16, by - 20, 3, 6);
        } else if (b === 6) {
          ctx.strokeStyle = "#fff8e7"; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.moveTo(bx + 14, by - 4); ctx.lineTo(bx + 14, by - 22); ctx.stroke();
          ctx.fillStyle = "#ff4d8d";
          ctx.beginPath(); ctx.arc(bx + 14, by - 30, 11, 0, Math.PI * 2); ctx.fill();
        } else if (b === 7) {
          ctx.strokeStyle = "#8b5a2b"; ctx.lineWidth = 4;
          ctx.beginPath(); ctx.moveTo(bx + 14, by - 6); ctx.lineTo(bx + 14, by - 34); ctx.stroke();
          ctx.fillStyle = "#95a5a6";
          ctx.beginPath(); ctx.moveTo(bx + 4, by - 34); ctx.lineTo(bx + 24, by - 34); ctx.lineTo(bx + 22, by - 46); ctx.lineTo(bx + 6, by - 46); ctx.fill();
        } else if (b === 8) {
          ctx.fillStyle = "rgba(210,240,255,0.45)"; ctx.fillRect(bx + 6, by - 36, 18, 22);
          ctx.fillStyle = "#7dffb3";
          var t = state.t || 0;
          ctx.beginPath();
          ctx.arc(bx + 12 + Math.sin(t * 7) * 2, by - 24, 2.2, 0, Math.PI * 2);
          ctx.arc(bx + 18 + Math.cos(t * 8) * 2, by - 28, 1.8, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
      function drawHatCrow(cx, cy, flip) {
        ctx.save(); ctx.translate(cx, cy); ctx.scale(flip || 1, 1);
        ctx.fillStyle = "#1a1a1a";
        ctx.beginPath(); ctx.ellipse(0, 0, 8, 5, -0.25, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(7, -3, 5, 4, 0.1, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#f4c430";
        ctx.beginPath(); ctx.moveTo(11, -3); ctx.lineTo(17, -2); ctx.lineTo(11, 0); ctx.fill();
        ctx.restore();
      }
      if (typeof drawGround === "function") {
        var rawG = drawGround;
        drawGround = function(w, h, gy, scroll) {
          rawG(w, h, gy, scroll);
          var b = state.biome || 0;
          if (b === 6) {
            var cols = ["#ff4d8d", "#fff", "#7dffb3", "#ffd166", "#6ec6ff"];
            for (var s = 0; s < 40; s++) {
              var spx = ((s * 67 - scroll * 0.22) % (w + 20) + (w + 20)) % (w + 20) - 10;
              ctx.fillStyle = cols[s % cols.length];
              ctx.beginPath(); ctx.arc(spx, gy - 40 - (s % 5) * 14, 2, 0, Math.PI * 2); ctx.fill();
            }
          }
          if (b === 8) {
            for (var i = 0; i < 24; i++) {
              var fx = ((80 + i * 73 - scroll * 0.35) % (w + 40) + (w + 40)) % (w + 40) - 20;
              var fy = 40 + (i * 47) % Math.max(40, gy - 20);
              ctx.fillStyle = "rgba(255,230,90,0.7)";
              ctx.beginPath(); ctx.arc(fx, fy, 2.4, 0, Math.PI * 2); ctx.fill();
            }
          }
          if (b === 7) {
            var spanS = w + 280;
            var smx = ((700 - scroll * 0.55) % spanS + spanS) % spanS - 80;
            ctx.fillStyle = "#fff";
            ctx.beginPath();
            ctx.arc(smx, gy - 18, 20, 0, Math.PI * 2);
            ctx.arc(smx, gy - 46, 15, 0, Math.PI * 2);
            ctx.arc(smx, gy - 70, 12, 0, Math.PI * 2);
            ctx.fill();
            var swave = Math.sin((state.t || 0) * 4) * 14;
            ctx.strokeStyle = "#8b5a2b"; ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(smx - 14, gy - 46); ctx.lineTo(smx - 30, gy - 56);
            ctx.moveTo(smx + 14, gy - 46); ctx.lineTo(smx + 28, gy - 58 - swave);
            ctx.stroke();
            ctx.fillStyle = "#1b1b1b";
            ctx.fillRect(smx - 16, gy - 84, 32, 7); ctx.fillRect(smx - 11, gy - 106, 22, 22);
            var tx = smx - 95;
            ctx.fillStyle = "#1b6b34";
            ctx.beginPath(); ctx.moveTo(tx, gy - 150); ctx.lineTo(tx + 52, gy - 70); ctx.lineTo(tx - 52, gy - 70); ctx.fill();
            ctx.fillStyle = "#ffd166";
            ctx.beginPath(); ctx.moveTo(tx, gy - 168); ctx.lineTo(tx + 10, gy - 150); ctx.lineTo(tx - 10, gy - 150); ctx.fill();
          }
          if (b === 5) {
            var span = w + 280;
            var x = ((760 - scroll * 0.55) % span + span) % span - 80;
            ctx.fillStyle = "#8b5a2b"; ctx.fillRect(x - 4, gy - 100, 8, 100);
            ctx.fillStyle = "#c45a2a"; ctx.fillRect(x - 18, gy - 78, 36, 34);
            var wave = Math.sin((state.t || 0) * 4) * 16;
            ctx.strokeStyle = "#6b3a16"; ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.moveTo(x - 18, gy - 68); ctx.lineTo(x - 34, gy - 56);
            ctx.moveTo(x + 18, gy - 68); ctx.lineTo(x + 34, gy - 62 - wave);
            ctx.stroke();
            ctx.fillStyle = "#ffe0bd";
            ctx.beginPath(); ctx.arc(x, gy - 92, 13, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = "#d4a017"; ctx.fillRect(x - 12, gy - 118, 24, 18);
            drawHatCrow(x - 8, gy - 126, 1);
            drawHatCrow(x + 14, gy - 128, -1);
          }
        };
      }
      if (typeof drawBuddy === "function") {
        var prev = drawBuddy;
        drawBuddy = function(x, gy) {
          var b = state.biome || 0;
          if (b === 9) {
            var hover = Math.sin((state.t || 0) * 5) * 6;
            var rimY = gy - 10 + hover;
            var keep = state.biome; state.biome = 0; prev(x, rimY + 6); state.biome = keep;
            ctx.fillStyle = "rgba(90,190,235,0.24)";
            ctx.beginPath();
            ctx.moveTo(x - 24, rimY + 2);
            ctx.quadraticCurveTo(x - 24, rimY - 50, x, rimY - 54);
            ctx.quadraticCurveTo(x + 24, rimY - 50, x + 24, rimY + 2);
            ctx.closePath(); ctx.fill();
            ctx.strokeStyle = "#c5cedd"; ctx.lineWidth = 3; ctx.stroke();
            ctx.fillStyle = "#8e99ab";
            ctx.beginPath(); ctx.ellipse(x, rimY + 8, 42, 16, 0, 0, Math.PI * 2); ctx.fill();
            return;
          }
          prev(x, gy);
          if (b !== 0) drawBuddyProp(x, gy + Math.sin((state.runPhase || 0) * 2 + 1) * 3, b, gy);
        };
      }
    })();
