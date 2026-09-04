    (function shopPatch() {
      if (typeof CATALOG === "undefined") return;
      var slim = [
        { id: "fox", name: "Fox", price: 0, emo: "🦊", body: "#ff8a3c", belly: "#ffe0bd", ear: "fox", acc: "none" },
        { id: "cat", name: "Cat", price: 8, emo: "🐱", body: "#d4a017", belly: "#fff3c4", ear: "cat", acc: "none" },
        { id: "bunny", name: "Bunny", price: 12, emo: "🐰", body: "#f3f0ea", belly: "#ffffff", ear: "bunny", acc: "none" },
        { id: "penguin", name: "Penguin", price: 18, emo: "🐧", body: "#2c3340", belly: "#ffffff", ear: "round", acc: "none" },
        { id: "frog", name: "Frog", price: 22, emo: "🐸", body: "#3cb371", belly: "#d4f5d8", ear: "round", acc: "none", unlock: 8 },
        { id: "owl", name: "Owl", price: 26, emo: "🦉", body: "#8d6e63", belly: "#ffe0bd", ear: "owl", acc: "none", unlock: 12 },
        { id: "bear", name: "Bear", price: 30, emo: "🐻", body: "#8d6e63", belly: "#ffe0bd", ear: "bear", acc: "none", unlock: 18 },
        { id: "robot", name: "Robot", price: 34, emo: "🤖", body: "#6aa8d8", belly: "#d7ecff", ear: "robot", acc: "antenna", unlock: 22 }
      ];
      CATALOG.splice(0, CATALOG.length);
      slim.forEach(function(it) { CATALOG.push(it); });

      window.HATS = [
        { id: "none", name: "No hat", price: 0, emo: "✨", acc: "none" },
        { id: "cape", name: "Super Cape", price: 10, emo: "🦸", acc: "cape" },
        { id: "starcape", name: "Star Cape", price: 14, emo: "🌟", acc: "starcape" },
        { id: "picnic", name: "Picnic Hat", price: 12, emo: "🧿", acc: "picnic" },
        { id: "straw", name: "Barn Hat", price: 12, emo: "👒", acc: "straw" },
        { id: "firefly", name: "Firefly Jar", price: 16, emo: "🫢", acc: "firefly", unlock: 10 },
        { id: "backpack", name: "Trail Pack", price: 16, emo: "🎒", acc: "backpack" },
        { id: "wizard", name: "Wizard Hat", price: 20, emo: "🧙", acc: "wizard", unlock: 15 },
        { id: "ninja", name: "Ninja Mask", price: 20, emo: "🥷", acc: "mask", unlock: 15 },
        { id: "horn", name: "Magic Horn", price: 22, emo: "🦤", acc: "horn", unlock: 18 },
        { id: "wings", name: "Trail Wings", price: 28, emo: "🪽", acc: "wings", unlock: 20 }
      ];
      var OLD_HAT_FROM = {
        cape: "cape", unicorn: "horn", dragon: "wings", wizard: "wizard",
        ninja: "ninja", fairy: "wings", phoenix: "wings", bee: "wings",
        viking: "horn", deer: "horn", raccoon: "ninja", panda: "ninja"
      };

      function findItem(list, id) {
        for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
        return list[0];
      }

      state.hat = state.hat || "none";
      state.ownedHats = state.ownedHats || ["none"];
      state.shopTab = state.shopTab || "crew";
      if (state.ownedHats.indexOf("none") === -1) state.ownedHats.unshift("none");

      var data = loadSave() || {};
      if (data.hat) state.hat = data.hat;
      if (data.ownedHats && data.ownedHats.length) state.ownedHats = data.ownedHats;
      var keep = ["fox"];
      (state.owned || []).forEach(function(id) {
        if (OLD_HAT_FROM[id]) {
          var hid = OLD_HAT_FROM[id];
          if (state.ownedHats.indexOf(hid) === -1) state.ownedHats.push(hid);
          return;
        }
        var it = findItem(CATALOG, id);
        if (it && it.id === id) {
          if (keep.indexOf(id) === -1) keep.push(id);
        }
      });
      state.owned = keep;
      if (state.owned.indexOf(state.character) === -1) state.character = "fox";
      if (state.ownedHats.indexOf(state.hat) === -1) state.hat = "none";

      costume = function() {
        var base = findItem(CATALOG, state.character);
        var c = {};
        for (var k in base) c[k] = base[k];
        if (state.colors && state.colors[c.id]) c.body = state.colors[c.id];
        c.belly = mixBelly(c.body);
        var hat = findItem(HATS, state.hat || "none");
        c.hat = hat.id;
        if (hat.acc && hat.acc !== "none") c.acc = hat.acc;
        return c;
      };

      var _writeSave = writeSave;
      writeSave = function(extra) {
        extra = extra || {};
        extra.hat = state.hat || "none";
        extra.ownedHats = state.ownedHats || ["none"];
        _writeSave(extra);
      };

      window.buyOrWearHat = function(id) {
        var it = findItem(HATS, id);
        if (!it) return;
        var owned = state.ownedHats.indexOf(id) !== -1 || id === "none";
        state.hat = id;
        if (!owned && id !== "none") {
          if ((it.unlock || 0) > (state.bestLevel || 1)) {
            showToast("Preview · unlock at level " + it.unlock);
          } else if (state.stars < it.price) {
            showToast("Preview · need " + it.price + " stars to keep");
          } else {
            state.stars -= it.price;
            state.ownedHats.push(id);
            showToast("Bought " + it.name + "!");
            owned = true;
          }
        }
        if (owned) writeSave({});
        updateHud();
        renderShop();
      };

      renderShop = function() {
        var starsEl = document.getElementById("shopStars");
        if (starsEl) starsEl.textContent = "⭐ " + state.stars + " stars";
        var tab = state.shopTab || "crew";
        document.querySelectorAll(".shopTab").forEach(function(b) {
          b.classList.toggle("selected", b.dataset.tab === tab);
        });
        var grid = document.getElementById("shopGrid");
        if (!grid) return;
        grid.innerHTML = "";
        var list = tab === "hats" ? HATS : CATALOG;
        list.forEach(function(it) {
          var isHat = tab === "hats";
          var owned = isHat ? state.ownedHats.indexOf(it.id) !== -1 : state.owned.indexOf(it.id) !== -1;
          var wearing = isHat ? (state.hat || "none") === it.id : state.character === it.id;
          var need = it.unlock || 0;
          var locked = !owned && need > (state.bestLevel || 1);
          var btn = document.createElement("button");
          btn.type = "button";
          btn.className = "item" + (owned ? " owned" : "") + (wearing ? " wearing" : "") + (locked ? " locked" : "");
          var label = locked ? ("Preview · Lv " + need) : wearing ? "Wearing" : owned ? "Wear" : (it.price === 0 ? "Free" : "Buy ⭐" + it.price);
          btn.innerHTML = '<div class="emo">' + it.emo + '</div><div class="nm">' + it.name + '</div><div class="pr">' + label + '</div>';
          if (!isHat && owned) {
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
          btn.addEventListener("click", function() {
            if (isHat) buyOrWearHat(it.id);
            else buyOrWear(it.id);
          });
          grid.appendChild(btn);
        });
      };

      var _drawHero = drawHero;
      drawHero = function(x, gy) {
        _drawHero(x, gy);
        var c = costume();
        var extra = { picnic:1, straw:1, firefly:1, backpack:1, wizard:1, starcape:1 };
        if (!extra[c.acc]) return;
        var duck = state.sliding ? 16 : 0;
        var dance = state.dancing ? Math.sin(state.t * 14) * 8 : 0;
        var y = gy + state.heroY - 8 + duck;
        var idle = (state.screen === "menu" || state.screen === "end");
        var bob = Math.sin(state.runPhase * 2) * (state.grounded ? 3 : 0) + (idle ? Math.sin(state.t * 2) * 2 : 0);
        ctx.save();
        ctx.translate(dance, 0);
        if (c.acc === "picnic") {
          ctx.fillStyle = "#c0392b";
          ctx.beginPath(); ctx.ellipse(x, y - 96 + bob, 20, 6, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = "#fff8e7";
          ctx.beginPath(); ctx.ellipse(x, y - 100 + bob, 12, 8, 0, Math.PI, Math.PI * 2); ctx.fill();
        }
        if (c.acc === "straw") {
          ctx.fillStyle = "#e2b84a";
          ctx.beginPath(); ctx.ellipse(x, y - 94 + bob, 22, 6, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = "#c9922a";
          if (typeof roundRect === "function") { roundRect(x - 10, y - 108 + bob, 20, 14, 6); ctx.fill(); }
        }
        if (c.acc === "firefly") {
          ctx.fillStyle = "rgba(255,255,220,0.55)";
          ctx.fillRect(x + 10, y - 112 + bob, 16, 18);
          ctx.strokeStyle = "#7a4b00"; ctx.lineWidth = 2; ctx.strokeRect(x + 10, y - 112 + bob, 16, 18);
          ctx.fillStyle = "#f4c430";
          ctx.beginPath(); ctx.arc(x + 18, y - 102 + bob, 3.2, 0, Math.PI * 2); ctx.fill();
        }
        if (c.acc === "backpack") {
          ctx.fillStyle = "#2b6cb0"; ctx.fillRect(x - 28, y - 52 + bob, 14, 22);
          ctx.fillStyle = "#f4c430"; ctx.fillRect(x - 26, y - 46 + bob, 10, 8);
        }
        if (c.acc === "wizard") {
          ctx.fillStyle = "#6c3483";
          ctx.beginPath(); ctx.moveTo(x - 16, y - 92 + bob); ctx.lineTo(x, y - 128 + bob); ctx.lineTo(x + 16, y - 92 + bob); ctx.fill();
          ctx.fillStyle = "#f4c430";
          ctx.beginPath(); ctx.arc(x + 6, y - 108 + bob, 2.4, 0, Math.PI * 2); ctx.fill();
        }
        if (c.acc === "starcape") {
          ctx.fillStyle = "#f4c430";
          ctx.beginPath();
          ctx.moveTo(x - 8, y - 50 + bob);
          ctx.quadraticCurveTo(x - 48, y - 16 + bob, x - 18, y - 6 + bob);
          ctx.lineTo(x - 6, y - 28 + bob);
          ctx.fill();
        }
        ctx.restore();
      };

      document.querySelectorAll(".shopTab").forEach(function(btn) {
        btn.addEventListener("click", function() {
          state.shopTab = btn.dataset.tab;
          renderShop();
        });
      });
      writeSave({});
    })();
