    (function scenePolish() {
      function treeX(t, scroll) {
        var span = viewW() + 240;
        return ((t.x - scroll * 0.55) % span + span) % span - 60;
      }

      function lollipop(t, scroll, gy) {
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
          ctx.strokeStyle = col2;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(x, y - h * 0.66, 6, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          ctx.fillStyle = col;
          ctx.beginPath();
          ctx.ellipse(x, y - h * 0.64, 16, 20, 0.15, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = col2;
          ctx.beginPath();
          ctx.ellipse(x, y - h * 0.64, 9, 12, 0.15, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#fff8e7";
          ctx.beginPath();
          ctx.moveTo(x - 8, y - h * 0.82);
          ctx.lineTo(x, y - h * 0.9);
          ctx.lineTo(x + 8, y - h * 0.82);
          ctx.closePath();
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(x - 8, y - h * 0.46);
          ctx.lineTo(x, y - h * 0.38);
          ctx.lineTo(x + 8, y - h * 0.46);
          ctx.closePath();
          ctx.fill();
        }
      }

      function snowCap(t, scroll, gy) {
        var x = treeX(t, scroll);
        var y = gy + 8;
        var r = 22 + (t.h || 90) * 0.08;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.ellipse(x, y - t.h * 0.55 - r * 0.45, r * 0.85, r * 0.38, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x - 16, y - t.h * 0.42 - 10, 14, 7, -0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x + 16, y - t.h * 0.42 - 10, 14, 7, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x - 6, y - t.h * 0.7, 8, 0, Math.PI * 2);
        ctx.arc(x + 8, y - t.h * 0.68, 7, 0, Math.PI * 2);
        ctx.fill();
      }

      if (typeof drawTree === "function") {
        drawTree = function(t, scroll, gy) {
          var b = state.biome || 0;
          if (b === 6) { lollipop(t, scroll, gy); return; }
          var span = viewW() + 240;
          var x = ((t.x - scroll * 0.55) % span + span) % span - 60;
          var y = gy + 8;
          ctx.fillStyle = "#7a4a22";
          ctx.fillRect(x - 6, y - t.h * 0.45, 12, t.h * 0.45);
          ctx.fillStyle = t.kind === 0 ? "#2e8b3a" : t.kind === 1 ? "#3aa34a" : "#1f7a32";
          ctx.beginPath();
          ctx.arc(x, y - t.h * 0.55, 22 + t.h * 0.08, 0, Math.PI * 2);
          ctx.arc(x - 16, y - t.h * 0.42, 16, 0, Math.PI * 2);
          ctx.arc(x + 16, y - t.h * 0.42, 16, 0, Math.PI * 2);
          ctx.fill();
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
    })();
