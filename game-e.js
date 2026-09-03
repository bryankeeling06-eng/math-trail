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
      function drawPack(px, gy, blast) {
        var y = gy + (state.heroY || 0);
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
        var y = gy + (state.heroY || 0);
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
    })();
