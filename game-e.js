    (function wearTheSuit() {
      function on() {
        return !!(state.suited || state.biome === 9 || (state.launching && state.launch > 1.35));
      }
      if (typeof costume === "function") {
        var rawC = costume;
        costume = function() {
          var c = rawC();
          if (on() || state.wearSuit) {
            c.body = "#e8eef8";
            c.belly = "#b7c4d6";
            c.acc = "none";
          }
          return c;
        };
      }
      function visX(x) {
        var sway = (state.arriveFlash > 0 || state.dancing) && !state.launching ? Math.sin(state.t * 11) * 20 : 0;
        return (x + sway) * 2;
      }
      function visY(gy) {
        var bounce = (state.arriveFlash > 0 || state.dancing) && !state.launching ? Math.abs(Math.sin(state.t * 10)) * 26 : 0;
        var bob = Math.sin((state.runPhase || 0) * 2) * ((state.grounded !== false) ? 3 : 0);
        return gy + (state.heroY || 0) - bounce + bob;
      }
      function drawPack(px, gy, blast) {
        var y = visY(gy);
        if (blast) {
          ctx.fillStyle = "#ff7a2e";
          ctx.beginPath();
          ctx.moveTo(px - 24, y - 30);
          ctx.lineTo(px - 18, y - 6 + Math.random() * 10);
          ctx.lineTo(px - 12, y - 30);
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(px + 12, y - 30);
          ctx.lineTo(px + 18, y - 6 + Math.random() * 10);
          ctx.lineTo(px + 24, y - 30);
          ctx.fill();
        }
        ctx.fillStyle = "#7d8798";
        ctx.fillRect(px - 28, y - 64, 12, 30);
        ctx.fillRect(px + 16, y - 64, 12, 30);
        ctx.fillStyle = "#c5cedd";
        ctx.fillRect(px - 26, y - 60, 8, 22);
        ctx.fillRect(px + 18, y - 60, 8, 22);
      }
      function drawHelm(px, gy) {
        var y = visY(gy);
        ctx.strokeStyle = "#9aa6b8";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.ellipse(px, y - 80, 17, 19, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = "rgba(90,190,235,0.32)";
        ctx.beginPath();
        ctx.ellipse(px + 3, y - 80, 10, 12, 0.08, 0, Math.PI * 2);
        ctx.fill();
      }
      if (typeof drawHero === "function") {
        var inner = drawHero;
        drawHero = function(x, gy) {
          var keepSuit = state.suited;
          var keepJet = state.hasJet;
          var keepBio = state.biome;
          var keepLaunch = state.launching;
          var keepBlast = state.blasting;
          state.wearSuit = !!(keepSuit || keepBio === 9 || (keepLaunch && state.launch > 1.35));
          state.suited = false;
          state.hasJet = false;
          state.blasting = false;
          if (keepBio === 9) state.biome = 8;
          state.launching = false;
          var px = visX(x);
          var blast = !!(keepBlast || (keepLaunch && state.launch > 3.4));
          if (keepJet || keepBio === 9 || (keepLaunch && state.launch > 2.55)) drawPack(px, gy, blast);
          inner(x, gy);
          state.suited = keepSuit;
          state.hasJet = keepJet;
          state.biome = keepBio;
          state.launching = keepLaunch;
          state.blasting = keepBlast;
          if (keepLaunch && state.launch < 1.4) {
            ctx.fillStyle = "#eef3ff";
            ctx.beginPath();
            ctx.ellipse(px, state.suitY || -40, 16, 18, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "rgba(80,180,230,0.4)";
            ctx.beginPath();
            ctx.ellipse(px + 3, state.suitY || -40, 9, 11, 0, 0, Math.PI * 2);
            ctx.fill();
          } else if (on()) {
            drawHelm(px, gy);
          }
          if (keepLaunch && state.launch >= 1.4 && state.launch < 2.6) {
            ctx.fillStyle = "#8b95a8";
            ctx.fillRect(px - 22, (state.jetY || -80) - 10, 12, 26);
            ctx.fillRect(px + 10, (state.jetY || -80) - 10, 12, 26);
          }
        };
      }

      function drawBuddyProp(bx, by, b) {
        var hx = bx + 16;
        var hy = by - 18;
        ctx.save();
        if (b === 1) {
          ctx.strokeStyle = "#8b5a2b";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(hx, hy + 18);
          ctx.lineTo(hx, hy - 8);
          ctx.stroke();
          ctx.fillStyle = "#e74c3c";
          ctx.beginPath();
          ctx.moveTo(hx, hy - 8);
          ctx.quadraticCurveTo(hx + 22, hy - 2, hx, hy + 10);
          ctx.closePath();
          ctx.fill();
        } else if (b === 2) {
          ctx.fillStyle = "#e8d5a3";
          ctx.fillRect(hx - 6, hy - 2, 14, 8);
          ctx.fillStyle = "#c9a66b";
          ctx.fillRect(hx - 6, hy + 1, 14, 2);
        } else if (b === 3) {
          ctx.strokeStyle = "#8b5a2b";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(hx - 4, hy + 16);
          ctx.lineTo(hx + 2, hy - 10);
          ctx.stroke();
          ctx.fillStyle = "#c0392b";
          ctx.fillRect(hx - 2, hy - 14, 10, 6);
        } else if (b === 4) {
          ctx.fillStyle = "#bdc3c7";
          ctx.fillRect(hx - 5, hy - 2, 12, 10);
          ctx.fillRect(hx + 6, hy, 4, 6);
        } else if (b === 5) {
          ctx.fillStyle = "#e67e22";
          ctx.beginPath();
          ctx.ellipse(hx + 2, hy + 2, 8, 6, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#2e8b3a";
          ctx.fillRect(hx, hy - 6, 3, 5);
        } else if (b === 6) {
          ctx.strokeStyle = "#fff8e7";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(hx, hy + 16);
          ctx.lineTo(hx, hy - 2);
          ctx.stroke();
          ctx.fillStyle = "#ff4d8d";
          ctx.beginPath();
          ctx.arc(hx, hy - 8, 8, 0, Math.PI * 2);
          ctx.fill();
        } else if (b === 7) {
          ctx.strokeStyle = "#7f8c8d";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(hx - 2, hy + 16);
          ctx.lineTo(hx + 4, hy - 6);
          ctx.stroke();
          ctx.fillStyle = "#95a5a6";
          ctx.beginPath();
          ctx.moveTo(hx - 8, hy - 2);
          ctx.lineTo(hx + 10, hy - 8);
          ctx.lineTo(hx + 10, hy - 2);
          ctx.closePath();
          ctx.fill();
        } else if (b === 8) {
          ctx.fillStyle = "rgba(180,230,255,0.45)";
          ctx.beginPath();
          ctx.arc(hx + 2, hy - 4, 8, Math.PI, 0);
          ctx.fill();
          ctx.strokeStyle = "#d0e8f8";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(hx + 2, hy - 4, 8, Math.PI, 0);
          ctx.stroke();
          ctx.fillStyle = "#7dffb3";
          ctx.beginPath();
          ctx.arc(hx, hy - 6, 1.6, 0, Math.PI * 2);
          ctx.arc(hx + 4, hy - 3, 1.4, 0, Math.PI * 2);
          ctx.fill();
        } else if (b === 9) {
          ctx.fillStyle = "#f4c430";
          ctx.beginPath();
          ctx.moveTo(hx + 2, hy - 12);
          ctx.lineTo(hx + 4, hy - 4);
          ctx.lineTo(hx + 12, hy - 4);
          ctx.lineTo(hx + 6, hy + 1);
          ctx.lineTo(hx + 8, hy + 8);
          ctx.lineTo(hx + 2, hy + 4);
          ctx.lineTo(hx - 4, hy + 8);
          ctx.lineTo(hx - 2, hy + 1);
          ctx.lineTo(hx - 8, hy - 4);
          ctx.lineTo(hx, hy - 4);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      }

      function drawHatCrow(cx, cy, flip) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(flip || 1, 1);
        ctx.fillStyle = "#1b1b1b";
        ctx.beginPath();
        ctx.ellipse(0, 0, 7, 4.2, -0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(6, -2, 4, 3.2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#f4c430";
        ctx.beginPath();
        ctx.moveTo(10, -2);
        ctx.lineTo(15, -0.5);
        ctx.lineTo(10, 1);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      if (typeof drawGround === "function") {
        var rawG = drawGround;
        drawGround = function(w, h, gy, scroll) {
          rawG(w, h, gy, scroll);
          if ((state.biome || 0) !== 5) return;
          var span = w + 280;
          var x = ((760 - scroll * 0.55) % span + span) % span - 80;
          ctx.fillStyle = "#7a9a3a";
          ctx.beginPath();
          ctx.arc(x - 36, gy - 62, 11, 0, Math.PI * 2);
          ctx.arc(x + 36, gy - 62, 11, 0, Math.PI * 2);
          ctx.fill();
          drawHatCrow(x - 10, gy - 124, 1);
          drawHatCrow(x + 12, gy - 122, -1);
        };
      }

      if (typeof drawBuddy === "function") {
        var rawBuddy = drawBuddy;
        drawBuddy = function(x, gy) {
          rawBuddy(x, gy);
          var b = state.biome || 0;
          if (b === 0) return;
          var hop = 0;
          if (state.buddyHop > 0) hop = Math.sin(Math.min(1, state.buddyHop) * Math.PI) * 18;
          var by = gy + Math.sin(state.runPhase * 2 + 1) * 3 - hop;
          drawBuddyProp(x, by, b);
        };
      }
    })();
