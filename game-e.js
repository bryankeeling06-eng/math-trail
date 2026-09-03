    (function scenePolish() {
      function wx(w, scroll, seed) {
        var span = w + 280;
        return ((seed - scroll * 0.55) % span + span) % span - 80;
      }
      function treeX(t, scroll) {
        var span = viewW() + 240;
        return ((t.x - scroll * 0.55) % span + span) % span - 60;
      }

      function crow(cx, cy, flip) {
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
        ctx.beginPath();
        ctx.moveTo(-2, 0);
        ctx.quadraticCurveTo(-8, -8, 2, -3);
        ctx.closePath();
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

      function lollipop(t, scroll, gy) {
        var x = treeX(t, scroll);
        var y = gy + 8;
        var h = t.h || 90;
        var colors = ["#ff4d8d", "#7c4dff", "#ffd93d", "#2ecc71", "#ff6b6b", "#54a0ff"];
        var col = colors[(t.kind || 0) % colors.length];
        ctx.fillStyle = "#fff8e7";
        ctx.fillRect(x - 4, y - h * 0.55, 7, h * 0.55);
        ctx.fillStyle = "#ff8ab8";
        for (var i = 0; i < 4; i++) ctx.fillRect(x - 4, y - h * 0.52 + i * 14, 7, 6);
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(x, y - h * 0.62, 18 + h * 0.04, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(x, y - h * 0.62, 10 + h * 0.02, 0, Math.PI * 2);
        ctx.stroke();
      }

      function snowCap(t, scroll, gy) {
        var x = treeX(t, scroll);
        var y = gy + 8;
        ctx.fillStyle = "rgba(255,255,255,0.95)";
        ctx.beginPath();
        ctx.arc(x - 8, y - t.h * 0.62, 10, 0, Math.PI * 2);
        ctx.arc(x + 8, y - t.h * 0.6, 9, 0, Math.PI * 2);
        ctx.arc(x, y - t.h * 0.7, 12, 0, Math.PI * 2);
        ctx.fill();
      }

      if (typeof drawTree === "function") {
        var rawTree = drawTree;
        drawTree = function(t, scroll, gy) {
          var b = state.biome || 0;
          if (b === 6) { lollipop(t, scroll, gy); return; }
          rawTree(t, scroll, gy);
          if (b === 7) snowCap(t, scroll, gy);
        };
      }

      if (typeof drawLandmark === "function") {
        var rawLand = drawLandmark;
        drawLandmark = function(w, h, gy, scroll) {
          var b = state.biome || 0;
          if (b === 0) return;
          rawLand(w, h, gy, scroll);
        };
      }

      if (typeof drawGround === "function") {
        var rawGround = drawGround;
        drawGround = function(w, h, gy, scroll) {
          rawGround(w, h, gy, scroll);
          var b = state.biome || 0;
          if (b === 5) {
            var x = wx(w, scroll, 760);
            var th = (typeof biomeTheme === "function") ? biomeTheme() : { grass: "#7a9a3a", grassTop: "#c4d46a" };
            ctx.fillStyle = th.grass || "#7a9a3a";
            ctx.fillRect(x - 48, gy - 124, 108, 124);
            ctx.fillStyle = th.grassTop || "#c4d46a";
            ctx.fillRect(x - 48, gy - 8, 108, 12);
            ctx.fillStyle = "#8b5a2b";
            ctx.fillRect(x - 5, gy - 86, 8, 86);
            ctx.strokeStyle = "#6b3a16";
            ctx.lineWidth = 5;
            ctx.lineCap = "round";
            ctx.beginPath();
            ctx.moveTo(x - 1, gy - 70);
            ctx.lineTo(x - 28, gy - 58);
            ctx.lineTo(x - 38, gy - 46);
            ctx.moveTo(x - 1, gy - 70);
            ctx.lineTo(x + 28, gy - 56);
            ctx.lineTo(x + 40, gy - 44);
            ctx.stroke();
            ctx.fillStyle = "#c45a2a";
            ctx.beginPath();
            ctx.arc(x - 38, gy - 46, 5, 0, Math.PI * 2);
            ctx.arc(x + 40, gy - 44, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#c9843a";
            ctx.fillRect(x - 16, gy - 78, 32, 28);
            ctx.fillStyle = "#ffe0bd";
            ctx.beginPath();
            ctx.arc(x - 1, gy - 92, 13, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#2c2418";
            ctx.fillRect(x - 16, gy - 108, 30, 8);
            ctx.fillRect(x - 10, gy - 118, 18, 12);
            ctx.fillStyle = "#5d3a1a";
            ctx.beginPath();
            ctx.arc(x - 6, gy - 94, 1.6, 0, Math.PI * 2);
            ctx.arc(x + 4, gy - 94, 1.6, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = "#5d3a1a";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x - 1, gy - 88, 4, 0.15, Math.PI - 0.15);
            ctx.stroke();
            crow(x - 20, gy - 112, 1);
            crow(x + 18, gy - 108, -1);
          }
          if (b === 7) {
            var sx = wx(w, scroll, 700);
            ctx.fillStyle = "#fff";
            ctx.fillRect(sx - 22, gy - 92, 44, 22);
            ctx.fillStyle = "#1b1b1b";
            ctx.fillRect(sx - 14, gy - 68, 28, 6);
            ctx.fillRect(sx - 9, gy - 84, 18, 16);
            ctx.fillStyle = "#c0392b";
            ctx.beginPath();
            ctx.ellipse(sx, gy - 50, 16, 5, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillRect(sx + 10, gy - 52, 8, 18);
            ctx.fillStyle = "#1b1b1b";
            ctx.beginPath();
            ctx.arc(sx, gy - 28, 2.2, 0, Math.PI * 2);
            ctx.arc(sx, gy - 38, 2.2, 0, Math.PI * 2);
            ctx.arc(sx, gy - 47, 2.2, 0, Math.PI * 2);
            ctx.fill();
          }
        };
      }
    })();
