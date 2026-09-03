    (function extraTrailsMenu() {
      var NEW_PLACES = [
        { id: "hills", name: "Sunny Hills", goal: "Picnic Spot", arrive: "You made it to the picnic!" },
        { id: "picnic", name: "Picnic Spot", goal: "Duck Pond", arrive: "Picnic time!" },
        { id: "pond", name: "Duck Pond", goal: "Treehouse", arrive: "The ducks say hi!" },
        { id: "treehouse", name: "Treehouse", goal: "Red Barn", arrive: "Up in the treehouse!" },
        { id: "barn", name: "Red Barn", goal: "Pumpkin Patch", arrive: "The red barn!" },
        { id: "pumpkin", name: "Pumpkin Patch", goal: "Candy Trail", arrive: "Pumpkins everywhere!" },
        { id: "candy", name: "Candy Trail", goal: "Snowy Hill", arrive: "Sweet candy trail!" },
        { id: "snow", name: "Snowy Hill", goal: "Firefly Night", arrive: "Snow day!" },
        { id: "night", name: "Firefly Night", goal: "Outer Space", arrive: "Fireflies!" },
        { id: "space", name: "Outer Space", goal: "Sunny Hills", arrive: "Blast off!" }
      ];
      if (typeof PLACES !== "undefined") {
        PLACES.splice(0, PLACES.length);
        for (var i = 0; i < NEW_PLACES.length; i++) PLACES.push(NEW_PLACES[i]);
      } else {
        PLACES = NEW_PLACES;
      }
      var jump = document.getElementById("trailJump");
      if (jump && jump.parentNode) jump.parentNode.removeChild(jump);
      if (typeof refreshGoal === "function") refreshGoal();

      drawLandmark = function() {};

      if (!state.snowflakes) {
        state.snowflakes = [];
        for (var s = 0; s < 48; s++) {
          state.snowflakes.push({
            x: Math.random() * 1200,
            y: Math.random() * 700,
            r: 1.4 + Math.random() * 2.4,
            v: 28 + Math.random() * 42,
            w: 0.4 + Math.random() * 0.8
          });
        }
      }

      function treeX(t, scroll) {
        var span = viewW() + 240;
        return ((t.x - scroll * 0.55) % span + span) % span - 60;
      }

      function drawLollipopTree(t, scroll, gy) {
        var x = treeX(t, scroll);
        var y = gy + 8;
        var h = t.h || 90;
        var colors = ["#ff4d8d", "#7c4dff", "#ffd93d", "#2ecc71", "#ff6b6b", "#54a0ff"];
        var col = colors[(t.kind || 0) % colors.length];
        var col2 = colors[((t.kind || 0) + 2) % colors.length];
        ctx.fillStyle = "#fff8e7";
        ctx.fillRect(x - 4, y - h * 0.58, 8, h * 0.58);
        ctx.fillStyle = "#ff8ab8";
        for (var i = 0; i < 5; i++) ctx.fillRect(x - 4, y - h * 0.55 + i * 12, 8, 5);
        if ((t.kind || 0) % 2 === 0) {
          ctx.fillStyle = col;
          ctx.beginPath();
          ctx.arc(x, y - h * 0.66, 20 + h * 0.04, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#fff";
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.arc(x, y - h * 0.66, 12, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          ctx.fillStyle = col;
          ctx.beginPath();
          ctx.ellipse(x, y - h * 0.64, 16, 20, 0.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = col2;
          ctx.beginPath();
          ctx.ellipse(x, y - h * 0.64, 8, 11, 0.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      function drawSnowOnTree(t, scroll, gy) {
        var x = treeX(t, scroll);
        var y = gy + 8;
        var r = 22 + t.h * 0.08;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.ellipse(x, y - t.h * 0.55 - r * 0.4, r * 0.85, r * 0.34, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x - 16, y - t.h * 0.42 - 10, 14, 7, -0.2, 0, Math.PI * 2);
        ctx.ellipse(x + 16, y - t.h * 0.42 - 10, 14, 7, 0.2, 0, Math.PI * 2);
        ctx.fill();
      }

      function drawAsteroid(t, scroll, gy) {
        var x = treeX(t, scroll);
        var y = 90 + (t.h || 80) * 0.7;
        ctx.fillStyle = "#8a7a6a";
        ctx.beginPath();
        ctx.ellipse(x, y, 16 + (t.kind || 0) * 3, 12, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#6a5a4a";
        ctx.beginPath();
        ctx.arc(x - 6, y - 2, 4, 0, Math.PI * 2);
        ctx.arc(x + 5, y + 3, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      if (typeof drawTree === "function") {
        var rawDrawTree = drawTree;
        drawTree = function(t, scroll, gy) {
          var b = state.biome || 0;
          if (b === 6) { drawLollipopTree(t, scroll, gy); return; }
          if (b === 9) { drawAsteroid(t, scroll, gy); return; }
          rawDrawTree(t, scroll, gy);
          if (b === 7) drawSnowOnTree(t, scroll, gy);
        };
      }

      if (typeof biomeTheme === "function") {
        var prevTheme = biomeTheme;
        biomeTheme = function() {
          if ((state.biome || 0) === 9 || state.launching) {
            return { sky0: "#050816", sky1: "#10183a", sky2: "#1a1448", sun: "#f4f0c8", hillA: "#141428", hillB: "#1c1c38", grass: "#12122a", grassTop: "#1a1a36", dirt: "#0a0a18", night: true };
          }
          return prevTheme();
        };
      }

      function drawCrow(cx, cy, flip) {
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

      function dressScarecrow(w, h, gy, scroll) {
        var span = w + 280;
        var x = ((760 - scroll * 0.55) % span + span) % span - 80;
        ctx.fillStyle = "#8b5a2b";
        ctx.fillRect(x - 4, gy - 100, 8, 100);
        ctx.fillStyle = "#c45a2a";
        ctx.fillRect(x - 18, gy - 78, 36, 34);
        ctx.fillStyle = "#6b3a16";
        ctx.fillRect(x - 18, gy - 48, 36, 5);
        ctx.strokeStyle = "#6b3a16";
        ctx.lineWidth = 6;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(x - 18, gy - 68);
        ctx.lineTo(x - 36, gy - 56);
        ctx.moveTo(x + 18, gy - 68);
        ctx.lineTo(x + 36, gy - 56);
        ctx.stroke();
        ctx.fillStyle = "#ffe0bd";
        ctx.beginPath();
        ctx.arc(x, gy - 92, 13, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#5d3a1a";
        ctx.beginPath();
        ctx.arc(x - 5, gy - 94, 1.6, 0, Math.PI * 2);
        ctx.arc(x + 5, gy - 94, 1.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#5d3a1a";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, gy - 88, 4, 0.2, Math.PI - 0.2);
        ctx.stroke();
        ctx.fillStyle = "#d4a017";
        ctx.beginPath();
        ctx.ellipse(x, gy - 100, 22, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(x - 12, gy - 118, 24, 18);
        ctx.fillStyle = "#c9843a";
        ctx.fillRect(x - 12, gy - 102, 24, 3);
        drawCrow(x - 36, gy - 62, 1);
        drawCrow(x + 36, gy - 62, -1);
      }

      function dressSnowman(w, h, gy, scroll) {
        var span = w + 280;
        var x = ((700 - scroll * 0.55) % span + span) % span - 80;
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(x, gy - 18, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x, gy - 46, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x, gy - 70, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#8b5a2b";
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(x - 14, gy - 46);
        ctx.lineTo(x - 30, gy - 56);
        ctx.moveTo(x + 14, gy - 46);
        ctx.lineTo(x + 30, gy - 54);
        ctx.stroke();
        ctx.fillStyle = "#1b1b1b";
        ctx.beginPath();
        ctx.arc(x, gy - 36, 2.6, 0, Math.PI * 2);
        ctx.arc(x, gy - 46, 2.6, 0, Math.PI * 2);
        ctx.arc(x, gy - 56, 2.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#c0392b";
        ctx.beginPath();
        ctx.ellipse(x, gy - 62, 18, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(x + 12, gy - 64, 9, 20);
        ctx.fillStyle = "#1b2a41";
        ctx.beginPath();
        ctx.arc(x - 4, gy - 73, 1.7, 0, Math.PI * 2);
        ctx.arc(x + 4, gy - 73, 1.7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#e67e22";
        ctx.beginPath();
        ctx.moveTo(x, gy - 70);
        ctx.lineTo(x + 13, gy - 68);
        ctx.lineTo(x, gy - 66);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#1b1b1b";
        ctx.fillRect(x - 16, gy - 84, 32, 7);
        ctx.fillRect(x - 11, gy - 106, 22, 22);
        ctx.fillStyle = "#c0392b";
        ctx.fillRect(x - 11, gy - 86, 22, 3);
      }

      function drawFallingSnow(w, h, dt) {
        var flakes = state.snowflakes || [];
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        for (var i = 0; i < flakes.length; i++) {
          var f = flakes[i];
          f.y += f.v * (dt || 0.016);
          f.x += Math.sin(state.t * f.w + i) * 0.6;
          if (f.y > h + 8) { f.y = -8; f.x = Math.random() * w; }
          ctx.beginPath();
          ctx.arc(f.x % (w + 20), f.y, f.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      function drawSpaceScene(w, h, gy, scroll) {
        ctx.fillStyle = "#050816";
        ctx.fillRect(0, 0, w, h);
        for (var i = 0; i < 40; i++) {
          var sx = (i * 97 + scroll * 0.12) % w;
          var sy = 16 + (i * 53) % (h - 30);
          ctx.fillStyle = "rgba(255,255,230," + (0.35 + 0.55 * Math.abs(Math.sin(state.t * 3 + i))) + ")";
          ctx.beginPath();
          ctx.arc(sx, sy, i % 5 === 0 ? 2.2 : 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = "#3d7dff";
        ctx.beginPath();
        ctx.arc(w * 0.82, 70, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#2ecc71";
        ctx.beginPath();
        ctx.arc(w * 0.78, 66, 10, 0.2, 2.2);
        ctx.fill();
        ctx.fillStyle = "#f4c430";
        ctx.beginPath();
        ctx.arc(90, 58, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#12122a";
        ctx.fillRect(0, gy + 8, w, h);
        ctx.fillStyle = "#1a1a36";
        ctx.fillRect(0, gy, w, 12);
      }

      function drawSuit(px, py, suited, jet, blast) {
        if (!suited && !jet && !blast) return;
        ctx.save();
        ctx.translate(px, py);
        if (jet || suited) {
          ctx.fillStyle = "#cfd8e6";
          ctx.fillRect(-20, -62, 10, 28);
          ctx.fillRect(10, -62, 10, 28);
          ctx.fillStyle = "#8a93a6";
          ctx.fillRect(-18, -58, 6, 20);
          ctx.fillRect(12, -58, 6, 20);
        }
        if (blast) {
          ctx.fillStyle = "#ff8a3c";
          ctx.beginPath();
          ctx.moveTo(-16, -34);
          ctx.lineTo(-12, -34 + 18 + Math.random() * 10);
          ctx.lineTo(-8, -34);
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(8, -34);
          ctx.lineTo(12, -34 + 18 + Math.random() * 10);
          ctx.lineTo(16, -34);
          ctx.fill();
          ctx.fillStyle = "#ffe66d";
          ctx.beginPath();
          ctx.moveTo(-14, -34);
          ctx.lineTo(-12, -34 + 10);
          ctx.lineTo(-10, -34);
          ctx.fill();
        }
        if (suited) {
          ctx.fillStyle = "#eef3ff";
          ctx.beginPath();
          ctx.ellipse(0, -58, 16, 20, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#7ec8ff";
          ctx.beginPath();
          ctx.ellipse(3, -60, 10, 12, 0.1, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#d0d7e4";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(0, -58, 16, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
      }

      if (typeof drawGround === "function") {
        var rawGround = drawGround;
        drawGround = function(w, h, gy, scroll) {
          if ((state.biome || 0) === 9 || (state.launching && state.launch > 3.2)) {
            drawSpaceScene(w, h, gy, scroll);
          } else {
            rawGround(w, h, gy, scroll);
          }
          var b = state.biome || 0;
          if (b === 5) dressScarecrow(w, h, gy, scroll);
          if (b === 7) {
            dressSnowman(w, h, gy, scroll);
            drawFallingSnow(w, h, 0.016);
          }
        };
      }

      if (typeof drawHero === "function") {
        var innerHero = drawHero;
        drawHero = function(x, gy) {
          var sway = (state.arriveFlash > 0 || state.dancing) && !state.launching ? Math.sin(state.t * 11) * 20 : 0;
          var visX = (x + sway) * 2;
          var rawEll = ctx.ellipse;
          ctx.ellipse = function(ex, ey, rx, ry, rot, a0, a1) {
            if (Math.abs(rx - 26) < 1.5 && Math.abs(ry - 8) < 1.5) {
              return rawEll.call(ctx, visX, gy + 16, rx, ry, rot, a0, a1);
            }
            return rawEll.apply(ctx, arguments);
          };
          innerHero(x, gy);
          ctx.ellipse = rawEll;
          var suited = !!state.suited || (state.biome === 9);
          var jet = !!state.hasJet || (state.biome === 9);
          var blast = !!state.blasting || (state.launching && state.launch > 3.4);
          var dropSuit = state.suitY != null ? state.suitY : 0;
          var dropJet = state.jetY != null ? state.jetY : 0;
          if (state.launching && state.launch < 1.4) {
            drawSuit(visX, dropSuit, true, false, false);
          } else if (state.launching && state.launch < 2.6) {
            drawSuit(visX, gy + (state.heroY || 0), true, false, false);
            drawSuit(visX, dropJet, false, true, false);
          } else if (suited || jet || blast) {
            drawSuit(visX, gy + (state.heroY || 0), suited, jet, blast);
          }
        };
      }

      if (typeof arriveAtNextPlace === "function") {
        var prevArrive = arriveAtNextPlace;
        arriveAtNextPlace = function() {
          prevArrive();
          var p = (typeof currentPlace === "function") ? currentPlace() : null;
          if (p && p.id === "space") {
            state.dancing = false;
            state.arriveFlash = 0;
            state.launching = true;
            state.launch = 0;
            state.speed = 0;
            state.suited = false;
            state.hasJet = false;
            state.blasting = false;
            state.suitY = -40;
            state.jetY = -80;
            var toastEl = document.getElementById("toast");
            if (toastEl) toastEl.classList.remove("show");
          }
        };
      }

      if (typeof tickTrail === "function" && typeof bump === "function") {
        var rawTick = tickTrail;
        tickTrail = function(dt) {
          if (state.biome === 7 && state.snowflakes) {
            var h = (typeof viewH === "function") ? viewH() : 500;
            var w = (typeof viewW === "function") ? viewW() : 800;
            for (var i = 0; i < state.snowflakes.length; i++) {
              var f = state.snowflakes[i];
              f.y += f.v * dt;
              if (f.y > h + 10) { f.y = -10; f.x = Math.random() * w; }
            }
          }
          if (state.launching) {
            state.launch = (state.launch || 0) + dt;
            state.speed = 0;
            state.dancing = false;
            var w = (typeof viewW === "function") ? viewW() : 800;
            var target = w * 0.25;
            state.heroX += (target - (state.heroX || 180)) * Math.min(1, dt * 3);
            var gy = (typeof groundY === "function") ? groundY() : 360;
            if (state.launch < 1.4) {
              state.suitY += (gy - 8 - state.suitY) * Math.min(1, dt * 4);
            } else {
              state.suited = true;
              state.suitY = gy + (state.heroY || 0);
            }
            if (state.launch >= 1.4 && state.launch < 2.6) {
              state.jetY += (gy - 8 - state.jetY) * Math.min(1, dt * 4);
            }
            if (state.launch >= 2.6) state.hasJet = true;
            if (state.launch >= 3.4) {
              state.blasting = true;
              state.heroY = (state.heroY || 0) - 220 * dt;
            }
            if (state.launch >= 5.6) {
              state.launching = false;
              state.blasting = false;
              state.heroY = 0;
              state.suited = true;
              state.hasJet = true;
              state.biome = 9;
              if (state.holdSpeed != null) state.speed = state.holdSpeed;
              else state.speed = (typeof speedForLevel === "function") ? speedForLevel(state.level || 1) : 88;
              state.holdSpeed = null;
            }
            var pb = document.getElementById("problemBanner");
            var pn = document.getElementById("levelChip");
            if (pb) pb.style.visibility = "hidden";
            if (pn) pn.style.visibility = "hidden";
          }
          rawTick(dt);
          if ((state.biome || 0) !== 9 && !state.launching) {
            state.suited = false;
            state.hasJet = false;
            state.blasting = false;
          }
          if (state.launching) {
            state.speed = 0;
            var w2 = (typeof viewW === "function") ? viewW() : 800;
            state.heroX = Math.min(state.heroX || 180, w2 * 0.28);
          }
          if (state.screen !== "play") return;
          if (!state.gate || state.gate.smashed || state.answered || state.launching) return;
          var vis = (state.heroX || 180) * 2;
          if (vis + 24 >= state.gate.x - 40) bump();
        };
      }
    })();
