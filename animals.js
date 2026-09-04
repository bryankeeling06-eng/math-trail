    (function animalLooks() {
      if (typeof drawHero !== "function") return;
      var raw = drawHero;

      function who() {
        var id = state.character || "fox";
        if (typeof costume === "function") {
          var c = costume();
          if (c && c.id) id = c.id;
        }
        return id;
      }

      function pose(x, gy) {
        var duck = state.sliding ? 16 : 0;
        var dance = state.dancing ? Math.sin(state.t * 14) * 8 : 0;
        var y = gy + (state.heroY || 0) - 8 + duck;
        var idle = (state.screen === "menu" || state.screen === "end");
        var bob = Math.sin((state.runPhase || 0) * 2) * ((state.grounded !== false) ? 3 : 0) + (idle ? Math.sin((state.t || 0) * 2) * 2 : 0);
        var look = Math.max(-6, Math.min(6, state.lookX || 0));
        return { y: y, bob: bob, dance: dance, look: look };
      }

      function shadow(x, gy) {
        ctx.fillStyle = "rgba(0,0,0,0.18)";
        ctx.beginPath();
        ctx.ellipse(x, gy + 16, 26, 8, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      function beginSpin(x, gy) {
        if (!state.jumpArc) return;
        var ang = state.flipAng || 0;
        if (state.winMove === "cartwheel") ang = state.flipAng * 1.15;
        else if (state.winMove === "slide" || state.winMove === "dance") ang = Math.sin(state.winT * 8) * 0.18;
        else if (state.winMove === "bounce") ang = Math.sin(state.flipAng) * 0.35;
        else if (state.winMove === "highfive") ang = Math.min(0.4, state.flipAng * 0.2);
        ctx.translate(x, gy + (state.heroY || 0) - 48);
        ctx.rotate(ang);
        ctx.translate(-x, -(gy + (state.heroY || 0) - 48));
      }

      function drawBunny(x, gy) {
        var p = pose(x, gy), y = p.y, bob = p.bob, look = p.look;
        shadow(x, gy);
        ctx.save();
        ctx.translate(p.dance, 0);
        beginSpin(x, gy);
        ctx.fillStyle = "#efe6d6";
        ctx.beginPath(); ctx.ellipse(x - 18, y - 18 + bob, 7, 5, -0.4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#f6eee3";
        ctx.beginPath(); ctx.ellipse(x, y - 28 + bob, 20, 24, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#fffaf3";
        ctx.beginPath(); ctx.ellipse(x + 2, y - 24 + bob, 12, 16, 0.1, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#f6eee3";
        ctx.beginPath(); ctx.ellipse(x - 12, y - 6 + bob, 8, 5, 0.2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(x + 12, y - 6 + bob, 8, 5, -0.2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#f6eee3";
        ctx.beginPath(); ctx.ellipse(x - 10, y - 92 + bob, 6, 22, -0.18, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(x + 10, y - 94 + bob, 6, 23, 0.16, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#f4b6c8";
        ctx.beginPath(); ctx.ellipse(x - 10, y - 90 + bob, 2.4, 14, -0.18, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(x + 10, y - 92 + bob, 2.4, 15, 0.16, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#f6eee3";
        ctx.beginPath(); ctx.arc(x, y - 62 + bob, 18, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#fffaf3";
        ctx.beginPath(); ctx.ellipse(x + 1, y - 56 + bob, 11, 8, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#1b2a41";
        ctx.beginPath(); ctx.arc(x - 6 + look, y - 64 + bob, 2.6, 0, Math.PI * 2); ctx.arc(x + 7 + look, y - 64 + bob, 2.6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.beginPath(); ctx.arc(x - 5 + look, y - 65 + bob, 1, 0, Math.PI * 2); ctx.arc(x + 8 + look, y - 65 + bob, 1, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#f4a7c0";
        ctx.beginPath(); ctx.ellipse(x + 1, y - 56 + bob, 3.2, 2.4, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = "#1b2a41"; ctx.lineWidth = 1.2; ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(x - 4, y - 56 + bob); ctx.lineTo(x - 18, y - 58 + bob);
        ctx.moveTo(x - 4, y - 54 + bob); ctx.lineTo(x - 17, y - 50 + bob);
        ctx.moveTo(x + 6, y - 56 + bob); ctx.lineTo(x + 20, y - 58 + bob);
        ctx.moveTo(x + 6, y - 54 + bob); ctx.lineTo(x + 19, y - 50 + bob);
        ctx.stroke();
        ctx.restore();
      }

      function drawFrog(x, gy) {
        var p = pose(x, gy), y = p.y, bob = p.bob, look = p.look;
        shadow(x, gy);
        ctx.save();
        ctx.translate(p.dance, 0);
        beginSpin(x, gy);
        ctx.fillStyle = "#3cb371";
        ctx.beginPath(); ctx.ellipse(x - 16, y - 10 + bob, 10, 6, 0.2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(x + 16, y - 10 + bob, 10, 6, -0.2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(x, y - 28 + bob, 24, 20, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#d4f5d8";
        ctx.beginPath(); ctx.ellipse(x + 1, y - 24 + bob, 14, 12, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#3cb371";
        ctx.beginPath(); ctx.ellipse(x, y - 52 + bob, 22, 16, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#fffef2";
        ctx.beginPath(); ctx.ellipse(x - 10 + look * 0.3, y - 64 + bob, 8.5, 8.5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(x + 10 + look * 0.3, y - 64 + bob, 8.5, 8.5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = "#2e8b3a"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(x - 10 + look * 0.3, y - 64 + bob, 8.5, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(x + 10 + look * 0.3, y - 64 + bob, 8.5, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = "#1b2a41";
        ctx.beginPath(); ctx.arc(x - 10 + look, y - 64 + bob, 3.1, 0, Math.PI * 2); ctx.arc(x + 10 + look, y - 64 + bob, 3.1, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.beginPath(); ctx.arc(x - 9 + look, y - 66 + bob, 1.1, 0, Math.PI * 2); ctx.arc(x + 11 + look, y - 66 + bob, 1.1, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#2e8b3a";
        ctx.beginPath(); ctx.ellipse(x + 1, y - 46 + bob, 7, 3.2, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = "#2e8b3a"; ctx.lineWidth = 2; ctx.lineCap = "round";
        ctx.beginPath(); ctx.arc(x + 1, y - 44 + bob, 8, 0.15, Math.PI - 0.15); ctx.stroke();
        ctx.restore();
      }

      function drawOwl(x, gy) {
        var p = pose(x, gy), y = p.y, bob = p.bob, look = p.look;
        shadow(x, gy);
        ctx.save();
        ctx.translate(p.dance, 0);
        beginSpin(x, gy);
        ctx.fillStyle = "#7a5344";
        ctx.beginPath(); ctx.ellipse(x, y - 32 + bob, 22, 28, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#c9a27a";
        ctx.beginPath(); ctx.ellipse(x, y - 26 + bob, 12, 16, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#7a5344";
        ctx.beginPath(); ctx.moveTo(x - 16, y - 70 + bob); ctx.lineTo(x - 22, y - 86 + bob); ctx.lineTo(x - 6, y - 74 + bob); ctx.fill();
        ctx.beginPath(); ctx.moveTo(x + 16, y - 70 + bob); ctx.lineTo(x + 22, y - 86 + bob); ctx.lineTo(x + 6, y - 74 + bob); ctx.fill();
        ctx.fillStyle = "#d8c3a3";
        ctx.beginPath(); ctx.ellipse(x, y - 58 + bob, 20, 16, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#ffe9a8";
        ctx.beginPath(); ctx.arc(x - 8 + look * 0.2, y - 60 + bob, 8, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x + 8 + look * 0.2, y - 60 + bob, 8, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#1b2a41";
        ctx.beginPath(); ctx.arc(x - 8 + look, y - 60 + bob, 3.4, 0, Math.PI * 2); ctx.arc(x + 8 + look, y - 60 + bob, 3.4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.beginPath(); ctx.arc(x - 7 + look, y - 62 + bob, 1.2, 0, Math.PI * 2); ctx.arc(x + 9 + look, y - 62 + bob, 1.2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#e67e22";
        ctx.beginPath(); ctx.moveTo(x - 4, y - 52 + bob); ctx.lineTo(x, y - 44 + bob); ctx.lineTo(x + 4, y - 52 + bob); ctx.closePath(); ctx.fill();
        ctx.fillStyle = "#6b3f32";
        ctx.beginPath(); ctx.ellipse(x - 18, y - 36 + bob, 8, 16, -0.4, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(x + 18, y - 36 + bob, 8, 16, 0.4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#c9843a";
        ctx.beginPath(); ctx.ellipse(x - 8, y - 6 + bob, 5, 3, 0.2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(x + 8, y - 6 + bob, 5, 3, -0.2, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }

      function drawPenguin(x, gy) {
        var p = pose(x, gy), y = p.y, bob = p.bob, look = p.look;
        var waddle = Math.sin((state.runPhase || 0) * 2) * 3;
        shadow(x, gy);
        ctx.save();
        ctx.translate(p.dance + waddle * 0.2, 0);
        beginSpin(x, gy);
        ctx.fillStyle = "#e67e22";
        ctx.beginPath(); ctx.ellipse(x - 9, y - 5 + bob, 8, 3.4, 0.15, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(x + 9, y - 5 + bob, 8, 3.4, -0.15, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#1b2430";
        ctx.beginPath(); ctx.ellipse(x, y - 32 + bob, 20, 28, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#f7f4ee";
        ctx.beginPath(); ctx.ellipse(x + 1, y - 28 + bob, 13, 20, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#1b2430";
        ctx.beginPath(); ctx.ellipse(x - 20, y - 34 + bob, 7, 14, 0.45, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(x + 20, y - 34 + bob, 7, 14, -0.45, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x, y - 62 + bob, 16, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#f7f4ee";
        ctx.beginPath(); ctx.ellipse(x - 6, y - 58 + bob, 6, 7, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(x + 6, y - 58 + bob, 6, 7, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#1b2a41";
        ctx.beginPath(); ctx.arc(x - 6 + look, y - 58 + bob, 2.5, 0, Math.PI * 2); ctx.arc(x + 6 + look, y - 58 + bob, 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.beginPath(); ctx.arc(x - 5 + look, y - 59 + bob, 0.9, 0, Math.PI * 2); ctx.arc(x + 7 + look, y - 59 + bob, 0.9, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#f4a259";
        ctx.beginPath();
        ctx.moveTo(x - 4.5, y - 51.5 + bob);
        ctx.lineTo(x + 4.5, y - 51.5 + bob);
        ctx.lineTo(x, y - 43 + bob);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#e67e22";
        ctx.beginPath();
        ctx.moveTo(x - 3, y - 51 + bob);
        ctx.lineTo(x + 3, y - 51 + bob);
        ctx.lineTo(x, y - 47 + bob);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      drawHero = function(x, gy) {
        var id = who();
        if (id === "bunny") { drawBunny(x, gy); return; }
        if (id === "frog") { drawFrog(x, gy); return; }
        if (id === "owl") { drawOwl(x, gy); return; }
        if (id === "penguin") { drawPenguin(x, gy); return; }
        raw(x, gy);
      };
    })();
