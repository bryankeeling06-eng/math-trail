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

      function drawBuddyProp(bx, by, b, gy) {
        ctx.save();
        if (b === 1) {
          ctx.strokeStyle = "#8b5a2b";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(bx + 8, by - 20);
          ctx.lineTo(bx + 2, by - 62);
          ctx.stroke();
          ctx.fillStyle = "#e74c3c";
          ctx.beginPath();
          ctx.moveTo(bx + 2, by - 62);
          ctx.quadraticCurveTo(bx - 26, by - 50, bx - 28, by - 38);
          ctx.lineTo(bx + 2, by - 44);
          ctx.quadraticCurveTo(bx + 30, by - 50, bx + 32, by - 38);
          ctx.lineTo(bx + 2, by - 62);
          ctx.fill();
          ctx.strokeStyle = "#c0392b";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(bx + 2, by - 62);
          ctx.lineTo(bx - 18, by - 42);
          ctx.moveTo(bx + 2, by - 62);
          ctx.lineTo(bx + 22, by - 42);
          ctx.stroke();
        } else if (b === 2) {
          var cycle = ((state.t || 0) % 2.4);
          ctx.fillStyle = "#e8d5a3";
          if (cycle < 0.25) {
            ctx.fillRect(bx + 10, by - 22, 10, 7);
            ctx.fillStyle = "#c9a66b";
            ctx.fillRect(bx + 10, by - 20, 10, 2);
          }
          var p = Math.min(1, Math.max(0, (cycle - 0.2) / 1.4));
          if (cycle >= 0.2) {
            var breadX = bx + 18 + p * 70;
            var breadY = by - 18 + p * 34 + Math.sin(p * 3.1) * 8;
            ctx.fillStyle = "#e8d5a3";
            ctx.fillRect(breadX, breadY, 9, 6);
            var duckX = bx + 90 - (1 - p) * 40;
            var duckY = gy + 8 + Math.sin((state.t || 0) * 3) * 2;
            ctx.fillStyle = "#f4c430";
            ctx.beginPath();
            ctx.ellipse(duckX, duckY, 10, 6, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#e67e22";
            ctx.beginPath();
            ctx.moveTo(duckX - 10, duckY);
            ctx.lineTo(duckX - 16, duckY + 2);
            ctx.lineTo(duckX - 10, duckY + 3);
            ctx.fill();
          }
        } else if (b === 3) {
          ctx.fillStyle = "#8b5a2b";
          ctx.fillRect(bx + 12, by - 36, 4, 28);
          ctx.fillStyle = "#7f8c8d";
          ctx.fillRect(bx + 4, by - 42, 20, 10);
          ctx.fillStyle = "#95a5a6";
          ctx.fillRect(bx + 6, by - 40, 16, 6);
        } else if (b === 4) {
          ctx.fillStyle = "#cfd4da";
          ctx.fillRect(bx + 6, by - 28, 22, 20);
          ctx.fillRect(bx + 4, by - 32, 26, 6);
          ctx.font = "bold 7px sans-serif";
          ctx.textAlign = "center";
          ctx.fillStyle = "#2c3e50";
          ctx.fillText("MILK", bx + 17, by - 14);
        } else if (b === 5) {
          ctx.fillStyle = "#e67e22";
          ctx.beginPath();
          ctx.ellipse(bx + 18, by - 12, 9, 7, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#2e8b3a";
          ctx.fillRect(bx + 16, by - 20, 3, 6);
        } else if (b === 6) {
          ctx.strokeStyle = "#fff8e7";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(bx + 14, by - 4);
          ctx.lineTo(bx + 14, by - 22);
          ctx.stroke();
          ctx.fillStyle = "#ff4d8d";
          ctx.beginPath();
          ctx.arc(bx + 14, by - 30, 11, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#fff";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(bx + 14, by - 30, 8, 0.2, 2.2);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(bx + 14, by - 30, 5, 2.4, 4.6);
          ctx.stroke();
        } else if (b === 7) {
          ctx.strokeStyle = "#8b5a2b";
          ctx.lineWidth = 4;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(bx + 14, by - 6);
          ctx.lineTo(bx + 14, by - 34);
          ctx.stroke();
          ctx.strokeStyle = "#7f8c8d";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(bx + 14, by - 8, 5, 0, Math.PI);
          ctx.stroke();
          ctx.fillStyle = "#95a5a6";
          ctx.beginPath();
          ctx.moveTo(bx + 4, by - 34);
          ctx.lineTo(bx + 24, by - 34);
          ctx.lineTo(bx + 22, by - 46);
          ctx.lineTo(bx + 6, by - 46);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = "#7f8c8d";
          ctx.stroke();
        } else if (b === 8) {
          ctx.fillStyle = "rgba(210,240,255,0.45)";
          ctx.fillRect(bx + 6, by - 36, 18, 22);
          ctx.strokeStyle = "#a8d4ea";
          ctx.lineWidth = 2;
          ctx.strokeRect(bx + 6, by - 36, 18, 22);
          ctx.fillStyle = "#d0eaf8";
          ctx.fillRect(bx + 4, by - 40, 22, 6);
          ctx.fillStyle = "#7dffb3";
          var t = state.t || 0;
          ctx.beginPath();
          ctx.arc(bx + 12 + Math.sin(t * 7) * 2, by - 24 + Math.cos(t * 6) * 2, 2.2, 0, Math.PI * 2);
          ctx.arc(bx + 18 + Math.cos(t * 8) * 2, by - 28 + Math.sin(t * 5) * 2, 1.8, 0, Math.PI * 2);
          ctx.arc(bx + 15 + Math.sin(t * 9) * 2, by - 20 + Math.cos(t * 7) * 2, 1.6, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      function drawHatCrow(cx, cy, flip) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(flip || 1, 1);
        ctx.fillStyle = "#1a1a1a";
        ctx.beginPath();
        ctx.moveTo(-8, 2);
        ctx.lineTo(-14, 6);
        ctx.lineTo(-6, 5);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(0, 0, 8, 5, -0.25, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(7, -3, 5, 4, 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-2, -2);
        ctx.quadraticCurveTo(-4, -10, 8, -8);
        ctx.quadraticCurveTo(2, -3, -1, 1);
        ctx.fill();
        ctx.strokeStyle = "#1a1a1a";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-2, 4);
        ctx.lineTo(-2, 8);
        ctx.moveTo(2, 4);
        ctx.lineTo(2, 8);
        ctx.stroke();
        ctx.fillStyle = "#f4c430";
        ctx.beginPath();
        ctx.moveTo(11, -3);
        ctx.lineTo(17, -2);
        ctx.lineTo(11, 0);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(8, -4, 1.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#111";
        ctx.beginPath();
        ctx.arc(8.4, -4, 0.7, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      if (typeof drawGround === "function") {
        var rawG = drawGround;
        drawGround = function(w, h, gy, scroll) {
          rawG(w, h, gy, scroll);
          var b = state.biome || 0;
          if (b === 8) {
            for (var i = 0; i < 28; i++) {
              var fx = ((80 + i * 73 - scroll * 0.35) % (w + 40) + (w + 40)) % (w + 40) - 20;
              var fy = 40 + (i * 47) % (gy - 20) + Math.sin((state.t || 0) * 3 + i) * 8;
              ctx.fillStyle = "rgba(255,230,90," + (0.3 + 0.5 * Math.abs(Math.sin((state.t || 0) * 5 + i))) + ")";
              ctx.beginPath();
              ctx.arc(fx, fy, 2.4 + (i % 3) * 0.6, 0, Math.PI * 2);
              ctx.fill();
            }
          }
          if (b !== 5) return;
          var span = w + 280;
          var x = ((760 - scroll * 0.55) % span + span) % span - 80;
          var wave = Math.sin((state.t || 0) * 4) * 16;
          ctx.fillStyle = "#c45a2a";
          ctx.beginPath();
          ctx.arc(x - 36, gy - 62, 10, 0, Math.PI * 2);
          ctx.arc(x + 36, gy - 62, 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#6b3a16";
          ctx.lineWidth = 6;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(x - 18, gy - 68);
          ctx.lineTo(x - 34, gy - 56);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(x + 18, gy - 68);
          ctx.lineTo(x + 34 + wave * 0.15, gy - 62 - wave);
          ctx.stroke();
          ctx.fillStyle = "#c45a2a";
          ctx.beginPath();
          ctx.ellipse(x - 34, gy - 54, 6, 5, -0.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.ellipse(x + 34 + wave * 0.15, gy - 62 - wave, 6, 5, 0.2, 0, Math.PI * 2);
          ctx.fill();
          drawHatCrow(x - 8, gy - 126, 1);
          drawHatCrow(x + 14, gy - 128, -1);
        };
      }

      if (typeof drawBuddy === "function") {
        var rawBuddy = drawBuddy;
        drawBuddy = function(x, gy) {
          var b = state.biome || 0;
          if (b === 9) {
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
            rawBuddy(x, rimY + 4);
            ctx.fillStyle = "#8e99ab";
            ctx.beginPath();
            ctx.ellipse(x, rimY + 8, 40, 16, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#d5dce8";
            ctx.beginPath();
            ctx.ellipse(x, rimY + 4, 30, 11, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = "#c5cedd";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.ellipse(x, rimY - 28, 22, 32, 0, Math.PI, 0);
            ctx.stroke();
            ctx.fillStyle = "rgba(90,190,235,0.20)";
            ctx.beginPath();
            ctx.ellipse(x, rimY - 28, 22, 32, 0, Math.PI, 0);
            ctx.fill();
            return;
          }
          rawBuddy(x, gy);
          if (b === 0) return;
          var hop = 0;
          if (state.buddyHop > 0) hop = Math.sin(Math.min(1, state.buddyHop) * Math.PI) * 18;
          var by = gy + Math.sin(state.runPhase * 2 + 1) * 3 - hop;
          drawBuddyProp(x, by, b, gy);
        };
      }
    })();
