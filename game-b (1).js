    function mixBelly(hex) {
      hex = (hex || "#ff8a3c").replace("#","");
      var r = parseInt(hex.slice(0,2),16), g = parseInt(hex.slice(2,4),16), b = parseInt(hex.slice(4,6),16);
      r = Math.round(r + (255-r)*0.62);
      g = Math.round(g + (255-g)*0.62);
      b = Math.round(b + (255-b)*0.62);
      return "#" + [r,g,b].map(function(n){ return n.toString(16).padStart(2,"0"); }).join("");
    }

    function costume() {
      var base = CATALOG[0];
      for (var i = 0; i < CATALOG.length; i++) if (CATALOG[i].id === state.character) base = CATALOG[i];
      var c = {};
      for (var k in base) c[k] = base[k];
      if (state.colors && state.colors[c.id]) c.body = state.colors[c.id];
      c.belly = mixBelly(c.body);
      return c;
    }

    function renderShop() {
      document.getElementById("shopStars").textContent = "⭐ " + state.stars + " stars";
      var grid = document.getElementById("shopGrid");
      grid.innerHTML = "";
      CATALOG.forEach(function(it) {
        var owned = state.owned.indexOf(it.id) !== -1;
        var wearing = state.character === it.id;
        var need = it.unlock || 0;
        var locked = !owned && need > (state.bestLevel || 1);
        var btn = document.createElement("button");
        btn.className = "item" + (owned ? " owned" : "") + (wearing ? " wearing" : "") + (locked ? " locked" : "");
        var label = locked ? ("Unlock at Lv " + need) : wearing ? "Wearing" : owned ? "Wear" : (it.price === 0 ? "Free" : "Buy ⭐" + it.price);
        btn.innerHTML = '<div class="emo">' + it.emo + '</div><div class="nm">' + it.name + '</div><div class="pr">' + label + '</div>';
        if (owned) {
          var row = document.createElement("div");
          row.className = "swatches";
          var current = (state.colors && state.colors[it.id]) || it.body;
          PALETTE.forEach(function(col) {
            var s = document.createElement("button");
            s.type = "button";
            s.className = "swatch" + (col.toLowerCase() === current.toLowerCase() ? " on" : "");
            s.style.background = col;
            s.addEventListener("click", function(e) {
              e.stopPropagation();
              setCostumeColor(it.id, col);
            });
            row.appendChild(s);
          });
          btn.appendChild(row);
        }
        btn.addEventListener("click", function() { buyOrWear(it.id); });
        grid.appendChild(btn);
      });
    }

    function buyOrWear(id) {
      var it = null;
      for (var i = 0; i < CATALOG.length; i++) if (CATALOG[i].id === id) it = CATALOG[i];
      if (!it) return;
      var owned = state.owned.indexOf(id) !== -1;
      if (!owned) {
        if ((it.unlock || 0) > (state.bestLevel || 1)) {
          showToast("Reach level " + it.unlock + " first");
          return;
        }
        if (state.stars < it.price) {
          showToast("Need " + it.price + " stars");
          return;
        }
        state.stars -= it.price;
        state.owned.push(id);
        showToast("Bought " + it.name + "!");
      }
      state.character = id;
      writeSave({});
      updateHud();
      renderShop();
    }

    function setCostumeColor(id, col) {
      if (state.owned.indexOf(id) === -1) return;
      if (!state.colors) state.colors = {};
      state.colors[id] = col;
      state.character = id;
      writeSave({});
      renderShop();
    }

    function openShop() {
      menu.classList.add("hidden");
      endcard.classList.add("hidden");
      document.getElementById("shop").classList.remove("hidden");
      renderShop();
    }
    function closeShop() {
      document.getElementById("shop").classList.add("hidden");
      menu.classList.remove("hidden");
      refreshStarBank();
    }

    (function bootSave() {
      state.admin = /(?:\?|&)admin=1(?:&|$)/.test(location.search) || location.hash === "#admin";
      var data = loadSave();
      if (data && typeof data.stars === "number") state.stars = data.stars;
      if (data && data.character) state.character = data.character;
      if (data && data.owned && data.owned.length) state.owned = data.owned;
      if (data && data.colors) state.colors = data.colors;
      if (data && data.muted) state.muted = true;
      if (data && data.bestLevel) state.bestLevel = data.bestLevel;
      if (data && data.stamps) state.stamps = data.stamps;
      if (state.admin) {
        state.bestLevel = 99;
        state.stars = Math.max(state.stars, 999);
      } else {
        if ((state.bestLevel || 1) >= 90) state.bestLevel = 1;
        var keep = ["fox"];
        (state.owned || []).forEach(function(id) {
          var it = null;
          for (var i = 0; i < CATALOG.length; i++) if (CATALOG[i].id === id) it = CATALOG[i];
          if (!it || !it.unlock || it.unlock <= (state.bestLevel || 1)) {
            if (keep.indexOf(id) === -1) keep.push(id);
          }
        });
        state.owned = keep;
        if (state.owned.indexOf(state.character) === -1) state.character = "fox";
      }
      if (state.owned.indexOf("fox") === -1) state.owned.unshift("fox");
      if (data && data.mode) {
        state.mode = data.mode;
        document.querySelectorAll(".mode").forEach(function(b) {
          b.classList.toggle("selected", b.dataset.mode === state.mode);
        });
      }
      updateHud();
      refreshStarBank();
      if (state.admin) {
        var tag = document.querySelector(".menu .tag");
        if (tag) tag.textContent = "ADMIN preview · all costumes unlocked";
        setTimeout(openShop, 80);
      }
    })();
    answersEl.querySelectorAll(".ans").forEach(function(btn) {
      btn.addEventListener("click", function() { chooseAnswer(Number(btn.dataset.i)); });
    });
    window.addEventListener("keydown", function(e) {
      if (e.key === "1" || e.key === "2" || e.key === "3") chooseAnswer(Number(e.key) - 1);
      if ((e.key === "Enter" || e.key === " ") && state.screen === "menu") startGame();
      if (e.key === "p" || e.key === "P" || e.key === "Escape") {
        if (state.screen === "play" || state.screen === "bonus") setPaused(!state.paused);
      }
      if (e.key === "m" || e.key === "M") toggleMute();
    });

    function roundRect(x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }

    function biomeTheme() {
      var b = state.biome || 0;
      var themes = [
        { sky0: "#6bb8ff", sky1: "#b8e4ff", sky2: "#e7f7c8", sun: "#ffe27a", hillA: "#8fd18a", hillB: "#6fc16a", grass: "#4caf50", grassTop: "#7ed56a", dirt: "#5d3a1a", night: false },
        { sky0: "#7ec8ff", sky1: "#ffe7b0", sky2: "#f7e3a8", sun: "#ffd36a", hillA: "#9ad46a", hillB: "#7cbe58", grass: "#5cba5a", grassTop: "#8fe06c", dirt: "#6a4420", night: false },
        { sky0: "#6ec4e8", sky1: "#b8e8ef", sky2: "#c8e8c0", sun: "#ffe27a", hillA: "#6fc9a8", hillB: "#4eb08e", grass: "#3fa87a", grassTop: "#7ed9a8", dirt: "#3d5a4a", night: false },
        { sky0: "#7eb6ff", sky1: "#c5e4c0", sky2: "#d7efb0", sun: "#ffe27a", hillA: "#5aa35a", hillB: "#3e8b44", grass: "#3d8f40", grassTop: "#6ec85c", dirt: "#4a3016", night: false },
        { sky0: "#8ec6f0", sky1: "#f0d9a8", sky2: "#e8c98a", sun: "#ffcf66", hillA: "#b7d36a", hillB: "#8fb24a", grass: "#6aa83a", grassTop: "#9ad45a", dirt: "#6b3a18", night: false },
        { sky0: "#1a2744", sky1: "#2c3e6b", sky2: "#1e3a3a", sun: "#f4f0c8", hillA: "#2f5a48", hillB: "#24463a", grass: "#1f4a32", grassTop: "#2e6a44", dirt: "#1a2418", night: true }
      ];
      return themes[b % themes.length];
    }

    function drawSky(w, h) {
      var th = biomeTheme();
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, th.sky0);
      g.addColorStop(0.55, th.sky1);
      g.addColorStop(1, th.sky2);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = th.sun;
      ctx.beginPath();
      ctx.arc(w - 90, th.night ? 58 : 70, th.night ? 26 : 38, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = th.night ? "rgba(244,240,200,0.18)" : "rgba(255,226,122,0.28)";
      ctx.beginPath();
      ctx.arc(w - 90, th.night ? 58 : 70, th.night ? 48 : 62, 0, Math.PI * 2);
      ctx.fill();
      if (th.night) {
        for (var i = 0; i < 18; i++) {
          var sx = (i * 73 + state.scroll * 0.02) % w;
          var sy = 20 + (i * 37) % 140;
          ctx.fillStyle = "rgba(255,255,210," + (0.4 + Math.sin(state.t * 3 + i) * 0.35) + ")";
          ctx.beginPath();
          ctx.arc(sx, sy, i % 4 === 0 ? 2.4 : 1.4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    function drawCloud(c, scroll) {
      const x = ((c.x - scroll * 0.25) % (viewW() + 200)) - 80;
      ctx.fillStyle = "rgba(255,255,255,0.88)";
      ctx.beginPath();
      ctx.ellipse(x, c.y, c.w * 0.55, 18 * c.s, 0, 0, Math.PI * 2);
      ctx.ellipse(x + 28 * c.s, c.y - 10, 22 * c.s, 16 * c.s, 0, 0, Math.PI * 2);
      ctx.ellipse(x + 52 * c.s, c.y, 26 * c.s, 16 * c.s, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    function drawHills(w, h, gy, scroll) {
      var th = biomeTheme();
      [{ color: th.hillA, speed: 0.18, amp: 28, base: gy - 90 }, { color: th.hillB, speed: 0.32, amp: 22, base: gy - 40 }].forEach(function(L) {
        ctx.fillStyle = L.color;
        ctx.beginPath();
        ctx.moveTo(0, h);
        ctx.lineTo(0, L.base);
        for (let x = 0; x <= w + 20; x += 16) {
          const n = Math.sin((x + scroll * L.speed) * 0.008) * L.amp + Math.sin((x + scroll * L.speed) * 0.019) * (L.amp * 0.45);
          ctx.lineTo(x, L.base + n);
        }
        ctx.lineTo(w, h);
        ctx.closePath();
        ctx.fill();
      });
    }

    function drawTree(t, scroll, gy) {
      const span = viewW() + 240;
      const x = ((t.x - scroll * 0.55) % span + span) % span - 60;
      const y = gy + 8;
      ctx.fillStyle = "#7a4a22";
      ctx.fillRect(x - 6, y - t.h * 0.45, 12, t.h * 0.45);
      ctx.fillStyle = t.kind === 0 ? "#2e8b3a" : t.kind === 1 ? "#3aa34a" : "#1f7a32";
      ctx.beginPath();
      ctx.arc(x, y - t.h * 0.55, 22 + t.h * 0.08, 0, Math.PI * 2);
      ctx.arc(x - 16, y - t.h * 0.42, 16, 0, Math.PI * 2);
      ctx.arc(x + 16, y - t.h * 0.42, 16, 0, Math.PI * 2);
      ctx.fill();
    }

    function drawGround(w, h, gy, scroll) {
      var th = biomeTheme();
      ctx.fillStyle = th.dirt;
      ctx.fillRect(0, gy + 18, w, h);
      ctx.fillStyle = th.grass;
      ctx.fillRect(0, gy, w, 26);
      ctx.fillStyle = th.grassTop;
      ctx.fillRect(0, gy, w, 10);
      ctx.strokeStyle = "rgba(40,90,30,0.25)";
      ctx.lineWidth = 2;
      for (let x = -((scroll * 0.9) % 40); x < w; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, gy + 10);
        ctx.lineTo(x + 16, gy + 24);
        ctx.stroke();
      }
    }

    function drawLandmark(w, h, gy, scroll) {
      var b = state.biome || 0;
      var x = w * 0.72 - (scroll * 0.12) % 40;
      if (b === 1) {
        ctx.fillStyle = "#c0392b";
        ctx.fillRect(x - 46, gy - 8, 92, 8);
        ctx.fillStyle = "#fff8e7";
        for (var i = 0; i < 6; i++) {
          for (var j = 0; j < 4; j++) {
            if ((i + j) % 2 === 0) ctx.fillRect(x - 42 + i * 14, gy - 6 + j * 2, 14, 2);
          }
        }
        ctx.fillStyle = "#d4a017";
        ctx.beginPath();
        ctx.ellipse(x + 28, gy - 18, 16, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#8b5a2b";
        ctx.fillRect(x + 20, gy - 28, 16, 10);
      } else if (b === 2) {
        ctx.fillStyle = "#4aa3c7";
        ctx.beginPath();
        ctx.ellipse(x, gy + 10, 110, 18, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#7fd0e8";
        ctx.beginPath();
        ctx.ellipse(x - 10, gy + 6, 70, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#f4c430";
        ctx.beginPath();
        ctx.ellipse(x - 40, gy - 6 + Math.sin(state.t * 2) * 2, 10, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x + 30, gy - 2 + Math.sin(state.t * 2 + 1) * 2, 8, 5, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (b === 3) {
        ctx.fillStyle = "#6b3a16";
        ctx.fillRect(x - 10, gy - 120, 20, 120);
        ctx.fillStyle = "#2e8b3a";
        ctx.beginPath();
        ctx.arc(x, gy - 150, 54, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#8b5a2b";
        ctx.fillRect(x + 8, gy - 90, 46, 28);
        ctx.fillStyle = "#c9843a";
        ctx.fillRect(x + 8, gy - 96, 50, 8);
      } else if (b === 4) {
        ctx.fillStyle = "#c0392b";
        ctx.fillRect(x - 50, gy - 90, 100, 90);
        ctx.fillStyle = "#8b1e13";
        ctx.beginPath();
        ctx.moveTo(x - 62, gy - 88);
        ctx.lineTo(x, gy - 130);
        ctx.lineTo(x + 62, gy - 88);
        ctx.fill();
        ctx.fillStyle = "#fff3c4";
        ctx.fillRect(x - 16, gy - 48, 18, 22);
        ctx.fillStyle = "#5d3a1a";
        ctx.fillRect(x + 18, gy - 36, 16, 36);
        ctx.strokeStyle = "#8b5a2b";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(x - 90, gy - 22);
        ctx.lineTo(x - 52, gy - 22);
        ctx.stroke();
      } else if (b === 5) {
        ctx.fillStyle = "#f4f0c8";
        ctx.beginPath();
        ctx.arc(w - 90, 58, 26, 0, Math.PI * 2);
        ctx.fill();
        for (var k = 0; k < 10; k++) {
          var fx = (k * 97 + scroll * 0.4) % w;
          var fy = gy - 40 - (k * 17) % 80;
          ctx.fillStyle = "rgba(210,255,120," + (0.45 + Math.sin(state.t * 6 + k) * 0.4) + ")";
          ctx.beginPath();
          ctx.arc(fx, fy, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        ctx.fillStyle = "#2e8b3a";
        ctx.beginPath();
        ctx.arc(x, gy - 70, 28, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#7a4a22";
        ctx.fillRect(x - 6, gy - 50, 12, 50);
      }
    }

    function buddyDrawX() {
      var bx = 110;
      if (state.heroX && !state.rushing) bx = Math.max(90, state.heroX - 72);
      if (state.gate && !state.gate.smashed) bx = Math.min(bx, state.gate.x - 100);
      return Math.max(70, bx);
    }

    function drawBuddy(x, gy) {
      var bx = x;
      var by = gy + Math.sin(state.runPhase * 2 + 1) * 3;
      ctx.fillStyle = "rgba(0,0,0,0.14)";
      ctx.beginPath();
      ctx.ellipse(bx, gy + 16, 16, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#c9843a";
      roundRect(bx - 14, by - 28, 28, 22, 10);
      ctx.fill();
      ctx.fillStyle = "#ffe0bd";
      roundRect(bx - 8, by - 20, 16, 12, 6);
      ctx.fill();
      ctx.fillStyle = "#c9843a";
      ctx.beginPath();
      ctx.arc(bx, by - 36, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(bx - 8, by - 42);
      ctx.lineTo(bx - 4, by - 54);
      ctx.lineTo(bx, by - 42);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(bx + 8, by - 42);
      ctx.lineTo(bx + 4, by - 54);
      ctx.lineTo(bx, by - 42);
      ctx.fill();
      var sad = state.flash > 0 || state.invuln > 0.6;
      ctx.fillStyle = "#1b2a41";
      ctx.beginPath();
      if (sad) {
        ctx.arc(bx - 4, by - 37, 2, Math.PI, 0);
        ctx.arc(bx + 4, by - 37, 2, Math.PI, 0);
      } else {
        ctx.arc(bx - 4, by - 38, 2.2, 0, Math.PI * 2);
        ctx.arc(bx + 4, by - 38, 2.2, 0, Math.PI * 2);
      }
      ctx.fill();
      var hat = costume();
      ctx.fillStyle = hat.body;
      ctx.beginPath();
      ctx.ellipse(bx, by - 48, 10, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(bx - 6, by - 58, 12, 10);
    }

    function drawBird(x, gy) {
      if (!state.birdT || state.birdT <= 0) return;
      var t = 1 - Math.max(0, Math.min(1, state.birdT));
      var bx = x + 36;
      var by = gy + state.heroY - 88 - Math.sin(t * Math.PI) * 18;
      ctx.fillStyle = "#f4c430";
      ctx.beginPath();
      ctx.ellipse(bx, by, 10, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#e74c3c";
      ctx.beginPath();
      ctx.moveTo(bx + 10, by);
      ctx.lineTo(bx + 16, by + 2);
      ctx.lineTo(bx + 10, by + 4);
      ctx.fill();
      ctx.fillStyle = "#1b2a41";
      ctx.beginPath();
      ctx.arc(bx + 4, by - 1, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }

    function drawHero(x, gy) {
      var duck = state.sliding ? 16 : 0;
      var dance = state.dancing ? Math.sin(state.t * 14) * 8 : 0;
      const y = gy + state.heroY - 8 + duck;
      var idle = (state.screen === "menu" || state.screen === "end");
      const bob = Math.sin(state.runPhase * 2) * (state.grounded ? 3 : 0) + (idle ? Math.sin(state.t * 2) * 2 : 0);
      if (state.invuln > 0 && Math.floor(state.t * 16) % 2 === 0) return;
      const c = costume();
      ctx.fillStyle = "rgba(0,0,0,0.18)";
      ctx.beginPath();
      ctx.ellipse(x, gy + 16, 26, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.save();
      ctx.translate(x + dance, 0);
      if (state.jumpArc) {
        var ang = state.flipAng || 0;
        if (state.winMove === "cartwheel") ang = state.flipAng * 1.15;
        else if (state.winMove === "slide" || state.winMove === "dance") ang = Math.sin(state.winT * 8) * 0.18;
        else if (state.winMove === "bounce") ang = Math.sin(state.flipAng) * 0.35;
        else if (state.winMove === "highfive") ang = Math.min(0.4, state.flipAng * 0.2);
        ctx.translate(x, gy + state.heroY - 48);
        ctx.rotate(ang);
        ctx.translate(-x, -(gy + state.heroY - 48));
      }
      if (c.acc === "cape") {
        ctx.fillStyle = "#c0392b";
        ctx.beginPath();
        ctx.moveTo(x - 8, y - 50 + bob);
        ctx.quadraticCurveTo(x - 48, y - 20 + bob, x - 20, y - 8 + bob);
        ctx.lineTo(x - 6, y - 28 + bob);
        ctx.fill();
      }
      if (c.acc === "wings") {
        var flap = Math.sin(state.runPhase) * 10;
        function wing(side) {
          var sx = x + side * 14;
          var sy = y - 50 + bob;
          var out = side * (62 + flap * 0.15);
          ctx.fillStyle = c.body;
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.quadraticCurveTo(sx + out * 0.35, sy - 38 - flap, sx + out, sy - 28 - flap);
          ctx.quadraticCurveTo(sx + out * 1.12, sy - 4, sx + out * 0.95, sy + 22 + flap * 0.4);
          ctx.quadraticCurveTo(sx + out * 0.72, sy + 8, sx + out * 0.62, sy + 30 + flap * 0.25);
          ctx.quadraticCurveTo(sx + out * 0.42, sy + 12, sx + out * 0.28, sy + 34);
          ctx.quadraticCurveTo(sx + side * 10, sy + 8, sx, sy + 6);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = c.belly;
          ctx.beginPath();
          ctx.moveTo(sx + side * 4, sy + 2);
          ctx.quadraticCurveTo(sx + out * 0.28, sy - 20 - flap * 0.5, sx + out * 0.72, sy - 16 - flap);
          ctx.quadraticCurveTo(sx + out * 0.55, sy + 6, sx + side * 6, sy + 8);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = c.body;
          ctx.lineWidth = 3;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(sx + out, sy - 28 - flap);
          ctx.moveTo(sx, sy);
          ctx.lineTo(sx + out * 0.95, sy + 22 + flap * 0.4);
          ctx.moveTo(sx, sy);
          ctx.lineTo(sx + out * 0.62, sy + 30 + flap * 0.25);
          ctx.stroke();
        }
        wing(-1);
        wing(1);
      }
      ctx.fillStyle = c.body;
      roundRect(x - 22, y - 58 + bob, 44, 42, 16);
      ctx.fill();
      ctx.fillStyle = c.belly;
      roundRect(x - 12, y - 42 + bob, 24, 22, 10);
      ctx.fill();
      ctx.fillStyle = c.body;
      if (c.ear === "robot") {
        roundRect(x - 24, y - 96 + bob, 48, 40, 4);
        ctx.fill();
        ctx.fillStyle = "#1b2a41";
        roundRect(x - 18, y - 86 + bob, 36, 12, 3);
        ctx.fill();
        ctx.fillStyle = "#7dffb3";
        roundRect(x - 14, y - 83 + bob, 10, 6, 2);
        ctx.fill();
        roundRect(x + 4, y - 83 + bob, 10, 6, 2);
        ctx.fill();
        ctx.fillStyle = c.body;
      } else {
        ctx.beginPath();
        ctx.arc(x, y - 72 + bob, 22, 0, Math.PI * 2);
        ctx.fill();
      }
      if (c.ear === "fox" || c.ear === "cat") {
        ctx.beginPath();
        ctx.moveTo(x - 18, y - 84 + bob);
        ctx.lineTo(x - (c.ear === "cat" ? 14 : 8), y - (c.ear === "cat" ? 104 : 108) + bob);
        ctx.lineTo(x - 2, y - 86 + bob);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x + 18, y - 84 + bob);
        ctx.lineTo(x + (c.ear === "cat" ? 14 : 8), y - (c.ear === "cat" ? 104 : 108) + bob);
        ctx.lineTo(x + 2, y - 86 + bob);
        ctx.fill();
        if (c.ear === "cat") {
          ctx.fillStyle = "#f7c1d4";
          ctx.beginPath();
          ctx.moveTo(x - 14, y - 86 + bob);
          ctx.lineTo(x - 13, y - 98 + bob);
          ctx.lineTo(x - 6, y - 86 + bob);
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(x + 14, y - 86 + bob);
          ctx.lineTo(x + 13, y - 98 + bob);
          ctx.lineTo(x + 6, y - 86 + bob);
          ctx.fill();
          ctx.fillStyle = c.body;
        }
      } else if (c.ear === "bunny") {
        ctx.fillStyle = c.body;
        roundRect(x - 16, y - 118 + bob, 10, 34, 6);
        ctx.fill();
        roundRect(x + 6, y - 118 + bob, 10, 34, 6);
        ctx.fill();
        ctx.fillStyle = "#f7c1d4";
        roundRect(x - 13, y - 112 + bob, 4, 22, 3);
        ctx.fill();
        roundRect(x + 9, y - 112 + bob, 4, 22, 3);
        ctx.fill();
        ctx.fillStyle = c.body;
      }
      if (c.ear === "bear" || c.ear === "owl") {
        ctx.fillStyle = c.body;
        ctx.beginPath();
        ctx.arc(x - 16, y - 90 + bob, c.ear === "owl" ? 7 : 9, 0, Math.PI * 2);
        ctx.arc(x + 16, y - 90 + bob, c.ear === "owl" ? 7 : 9, 0, Math.PI * 2);
        ctx.fill();
      }
      if (c.acc === "mask") {
        ctx.fillStyle = "rgba(20,24,32,0.55)";
        ctx.beginPath();
        ctx.ellipse(x, y - 74 + bob, 18, 8, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      if (c.acc === "antenna") {
        ctx.strokeStyle = "#4a6d88";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x, y - 92 + bob);
        ctx.lineTo(x, y - 112 + bob);
        ctx.stroke();
        ctx.fillStyle = "#e74c3c";
        ctx.beginPath();
        ctx.arc(x, y - 114 + bob, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      if (c.acc === "horn") {
        ctx.fillStyle = "#f4d35e";
        ctx.beginPath();
        ctx.moveTo(x - 4, y - 90 + bob);
        ctx.lineTo(x, y - 118 + bob);
        ctx.lineTo(x + 4, y - 90 + bob);
        ctx.fill();
      }
      var look = Math.max(-6, Math.min(6, state.lookX || 0));
      var blink = (state.blinkT || 0) > 0;
      ctx.fillStyle = "#1b2a41";
      if (blink) {
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#1b2a41";
        ctx.beginPath();
        ctx.moveTo(x - 10 + look, y - 74 + bob);
        ctx.lineTo(x - 4 + look, y - 74 + bob);
        ctx.moveTo(x + 4 + look, y - 74 + bob);
        ctx.lineTo(x + 10 + look, y - 74 + bob);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(x - 7 + look, y - 74 + bob, 3.2, 0, Math.PI * 2);
        ctx.arc(x + 7 + look, y - 74 + bob, 3.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(x - 6 + look, y - 75.5 + bob, 1.2, 0, Math.PI * 2);
        ctx.arc(x + 8 + look, y - 75.5 + bob, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
      if (c.ear === "cat") {
        ctx.fillStyle = "#f4a7c0";
        ctx.beginPath();
        ctx.moveTo(x - 5, y - 66 + bob);
        ctx.lineTo(x + 5, y - 66 + bob);
        ctx.lineTo(x, y - 59 + bob);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "#1b2a41";
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(x, y - 59 + bob);
        ctx.lineTo(x, y - 54 + bob);
        ctx.moveTo(x, y - 54 + bob);
        ctx.lineTo(x - 4, y - 51 + bob);
        ctx.moveTo(x, y - 54 + bob);
        ctx.lineTo(x + 4, y - 51 + bob);
        ctx.stroke();
      } else if (c.ear !== "robot") {
        ctx.fillStyle = c.belly;
        ctx.beginPath();
        ctx.ellipse(x + 10, y - 64 + bob, 10, 7, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#1b2a41";
        ctx.beginPath();
        ctx.arc(x + 16, y - 65 + bob, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      if (c.ear === "cat") {
        ctx.strokeStyle = "#1b2a41";
        ctx.lineWidth = 1.6;
        ctx.lineCap = "round";
        [[-1,-8],[-1,0],[-1,8],[1,-8],[1,0],[1,8]].forEach(function(w) {
          ctx.beginPath();
          ctx.moveTo(x + (w[0] < 0 ? -6 : 14), y - 64 + bob);
          ctx.lineTo(x + (w[0] < 0 ? -28 : 36), y - 64 + bob + w[1]);
          ctx.stroke();
        });
      }
      const swing = Math.sin(state.runPhase) * (state.grounded ? 10 : 4);
      ctx.fillStyle = c.body;
      if (c.id === "penguin") {
        ctx.fillStyle = "#f4c430";
        roundRect(x - 16, y - 16 + bob, 10, 14, 4);
        ctx.fill();
        roundRect(x + 6, y - 16 + bob, 10, 14, 4);
        ctx.fill();
        ctx.fillStyle = c.body;
        ctx.beginPath();
        ctx.ellipse(x - 30, y - 38 + bob, 16, 7, 0.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x + 30, y - 38 + bob, 16, 7, -0.15, 0, Math.PI * 2);
        ctx.fill();
      } else if (c.id === "robot") {
        ctx.fillStyle = c.body;
        roundRect(x - 16, y - 18 + bob, 12, 18, 3);
        ctx.fill();
        roundRect(x + 4, y - 18 + bob, 12, 18, 3);
        ctx.fill();
        ctx.fillStyle = c.body;
        roundRect(x - 40, y - 48 + bob, 22, 8, 3);
        ctx.fill();
        roundRect(x + 18, y - 48 + bob, 22, 8, 3);
        ctx.fill();
        ctx.fillStyle = mixBelly(c.body);
        roundRect(x - 46, y - 51 + bob, 10, 14, 3);
        ctx.fill();
        roundRect(x + 36, y - 51 + bob, 10, 14, 3);
        ctx.fill();
      } else {
        roundRect(x - 16, y - 22 + bob, 10, 26 + swing * 0.15, 5);
        ctx.fill();
        roundRect(x + 6, y - 22 + bob, 10, 26 - swing * 0.15, 5);
        ctx.fill();
        ctx.strokeStyle = c.body;
        ctx.lineWidth = 8;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(x - 20, y - 30 + bob);
        ctx.quadraticCurveTo(x - 42, y - 50 + bob - swing, x - 38, y - 18 + bob);
        ctx.stroke();
      }
      ctx.restore();
    }

    function drawGate(g, gy) {
      const smash = g.smashed ? Math.min(1, g.smashT * 2.2) : 0;
      var style = g.style || "normal";
      var scale = style === "tiny" ? 0.72 : style === "wide" ? 1.18 : 1;
      ctx.save();
      ctx.translate(g.x + (g.hit ? Math.sin(state.t * 40) * 4 : 0), 0);
      ctx.globalAlpha = 1 - smash;
      ctx.rotate(smash * 0.4);
      ctx.scale(scale, scale);
      var post = style === "rainbow" ? "#9b59b6" : "#8b5a2b";
      var beam = style === "rainbow" ? "#f4c430" : "#c9843a";
      ctx.fillStyle = post;
      roundRect(-48, gy - 150, 18, 168, 6);
      ctx.fill();
      roundRect(30, gy - 150, 18, 168, 6);
      ctx.fill();
      ctx.fillStyle = beam;
      roundRect(-54, gy - 168, 108, 36, 10);
      ctx.fill();
      if (style === "rainbow") {
        var cols = ["#e74c3c","#f4c430","#2ecc71","#3498db","#9b59b6"];
        for (var i = 0; i < cols.length; i++) {
          ctx.fillStyle = cols[i];
          ctx.fillRect(-50 + i * 20, gy - 166, 20, 8);
        }
      }
      ctx.fillStyle = "#fff8e7";
      roundRect(-70, gy - 128, 140, 70, 12);
      ctx.fill();
      ctx.strokeStyle = style === "rainbow" ? "#9b59b6" : "#d7b07a";
      ctx.lineWidth = 3;
      roundRect(-70, gy - 128, 140, 70, 12);
      ctx.stroke();
      if (!g.fallNums || !g.fallNums.length) {
        ctx.fillStyle = "#1b2a41";
        ctx.font = "800 22px Nunito, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(g.problem.text, 0, gy - 98);
      }
      ctx.font = "700 16px Fredoka, sans-serif";
      ctx.fillStyle = "#5a6b7d";
      ctx.fillText("= ?", 0, gy - 74);
      if (g.fallNums) {
        g.fallNums.forEach(function(n) {
          ctx.save();
          ctx.globalAlpha = Math.max(0, n.life);
          ctx.translate(n.x, gy + n.y);
          ctx.rotate(n.rot || 0);
          ctx.fillStyle = "#1b2a41";
          ctx.font = "800 22px Nunito, sans-serif";
          ctx.fillText(n.ch, 0, 0);
          ctx.restore();
        });
      }
      ctx.restore();
    }

    function drawParticles(dt) {
      state.particles = state.particles.filter(function(p) { return p.life > 0; });
      state.particles.forEach(function(p) {
        p.life -= dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 520 * dt;
        ctx.globalAlpha = Math.max(0, p.life * 2);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      });
    }

    function tickTrail(dt) {
      state.winT += dt;
      if (state.lookX) state.lookX *= Math.max(0, 1 - dt * 2.2);
      if (state.birdT > 0) state.birdT -= dt;
      if (state.blinkT > 0) state.blinkT -= dt;
      else if (Math.random() < dt * 0.35) state.blinkT = 0.12;
      if (state.arriving > 0) state.arriving -= dt;
      if (state.gate && state.gate.fallNums) {
        state.gate.fallNums.forEach(function(n) {
          n.life -= dt;
          n.x += n.vx * dt;
          n.y += n.vy * dt;
          n.vy += 420 * dt;
          n.rot += dt * 3;
        });
      }
      if (!state.muted && !state.paused && (state.screen === "play" || state.screen === "bonus")) {
        state.musicAcc += dt;
        if (state.musicAcc > 0.42) {
          state.musicAcc = 0;
          var roots = [262, 294, 330, 349, 392, 220];
          var r = roots[(state.biome || 0) % roots.length];
          var seq = [0, 2, 4, 7, 4, 2];
          state.musicStep = (state.musicStep || 0) + 1;
          beep(r * Math.pow(2, seq[state.musicStep % seq.length] / 12), 0.16, "sine", 0.02);
        }
      }
    }

    let last = performance.now();
    function frame(now) {
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      const w = viewW(), h = viewH(), gy = groundY();

      drawSky(w, h);
      state.clouds.forEach(function(c) { drawCloud(c, state.scroll); });
      drawHills(w, h, gy, state.scroll);
      state.trees.forEach(function(t) { drawTree(t, state.scroll, gy); });
      drawLandmark(w, h, gy, state.scroll);
      drawGround(w, h, gy, state.scroll);

      if (state.paused && (state.screen === "play" || state.screen === "bonus")) {
        if (state.gate) drawGate(state.gate, gy);
        drawBuddy(buddyDrawX(), gy);
        drawHero(state.heroX, gy);
        drawBird(state.heroX, gy);
      } else if (state.screen === "bonus") {
        state.t += dt;
        state.runPhase += dt * 3;
        state.bonusTime -= dt;
        tickTrail(dt);
        if (state.gate) drawGate(state.gate, gy);
        drawBuddy(buddyDrawX(), gy);
        drawHero(state.heroX, gy);
        drawBird(state.heroX, gy);
        banner.textContent = (state.gate ? state.gate.problem.text + " = ?" : "") + "   " + Math.max(0, Math.ceil(state.bonusTime)) + "s";
        banner.classList.add("show");
        if (state.bonusTime <= 0 && state.screen === "bonus") {
          speakLine("Time's up!");
          state.screen = "end";
          setTimeout(endGame, 400);
        }
      } else if (state.screen === "play") {
        state.t += dt;
        tickTrail(dt);
        var move = (state.arriving > 0) ? state.speed * 0.35 : state.speed;
        state.scroll += move * dt;
        state.runPhase += dt * (state.grounded ? 6.5 : 3);
        if (state.invuln > 0) state.invuln -= dt;
        if (state.flash > 0) state.flash -= dt;
        if (state.nextGateIn > 0) state.nextGateIn -= dt;

        state.heroVy += (state.jumpArc ? 1320 : 1750) * dt;
        state.heroY += state.heroVy * dt;
        if (state.heroY > 0) {
          state.heroY = 0;
          state.heroVy = 0;
          state.grounded = true;
          state.jumpArc = false;
        }

        if (state.jumpArc) {
          state.flipAng = Math.min(Math.PI * 2, state.flipAng + 7.6 * dt);
        }

        if (state.answered && state.rushing && state.gate && !state.gate.smashed) {
          state.heroX = Math.min(state.heroX + 90 * dt, 220);
          var dist = state.gate.x - state.heroX;
          if (!state.didJump && dist < 210 && dist > 40) jump();
          if (state.gate.x < state.heroX + 56) {
            smashGate(true);
            state.rushing = false;
          }
        } else if (state.heroX > 180) {
          state.heroX = Math.max(180, state.heroX - 260 * dt);
          if (state.heroX <= 180.5) {
            state.heroX = 180;
            state.rushing = false;
          }
        }

        if (state.gate) {
          var closeIn = (state.answered && state.rushing && !state.gate.smashed) ? 280 : 0;
          state.gate.x -= (state.speed + closeIn) * dt;
          if (state.gate.smashed) state.gate.smashT += dt;
          if (!state.gate.smashed && !state.answered && (state.heroX + 28) >= (state.gate.x - 48)) bump();
          const readyForNext = state.gate.smashed && state.gate.smashT > 0.45 && state.nextGateIn <= 0 && state.heroX <= 200 && state.arriving <= 0;
          if (state.gate.x < -160 || readyForNext) {
            state.gate = null;
            if (state.lives > 0 && state.arriving <= 0) spawnGate();
          } else {
            drawGate(state.gate, gy);
          }
        } else if (state.lives > 0 && state.nextGateIn <= 0 && state.arriving <= 0) {
          spawnGate();
        }

        drawBuddy(buddyDrawX(), gy);
        drawHero(state.heroX, gy);
        drawBird(state.heroX, gy);
        drawParticles(dt);
        if (state.arriving > 0) {
          ctx.fillStyle = "rgba(255,247,209," + (Math.min(0.28, state.arriving * 0.12)) + ")";
          ctx.fillRect(0, 0, w, h);
          ctx.fillStyle = "#7a4b00";
          ctx.font = "800 28px Fredoka, sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(currentPlace().name, w / 2, gy - 160);
        }
        if (state.flash > 0) {
          ctx.fillStyle = "rgba(220,40,40," + (state.flash * 0.28) + ")";
          ctx.fillRect(0, 0, w, h);
        }
      } else {
        state.t += dt;
        state.scroll += 22 * dt;
        state.runPhase += dt * 4;
        tickTrail(dt);
        drawBuddy(buddyDrawX(), gy);
        drawHero(state.heroX, gy);
      }

      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  