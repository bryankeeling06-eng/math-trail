    (function onePropEach() {
      if (typeof drawGround !== "function") return;
      var prev = drawGround;

      function drawStar(cx, cy, r) {
        ctx.fillStyle = "#ffd166";
        ctx.beginPath();
        for (var i = 0; i < 5; i++) {
          var a = -Math.PI / 2 + i * Math.PI * 2 / 5;
          var b = a + Math.PI / 5;
          ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
          ctx.lineTo(cx + Math.cos(b) * (r * 0.42), cy + Math.sin(b) * (r * 0.42));
        }
        ctx.closePath();
        ctx.fill();
      }

      function drawGroundedTree(tx, gy) {
        var base = gy + 6;
        ctx.fillStyle = "#6b3a16";
        ctx.fillRect(tx - 6, base - 22, 12, 22);
        ctx.fillStyle = "#1b6b34";
        ctx.beginPath();
        ctx.moveTo(tx, base - 78);
        ctx.lineTo(tx + 40, base - 22);
        ctx.lineTo(tx - 40, base - 22);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#218c44";
        ctx.beginPath();
        ctx.moveTo(tx, base - 102);
        ctx.lineTo(tx + 30, base - 52);
        ctx.lineTo(tx - 30, base - 52);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#2e8b3a";
        ctx.beginPath();
        ctx.moveTo(tx, base - 122);
        ctx.lineTo(tx + 20, base - 80);
        ctx.lineTo(tx - 20, base - 80);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.ellipse(tx, base - 78, 18, 5, 0, 0, Math.PI * 2);
        ctx.ellipse(tx, base - 52, 26, 5, 0, 0, Math.PI * 2);
        ctx.ellipse(tx, base - 24, 34, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        var baubles = [
          [tx - 16, base - 40, "#e74c3c"],
          [tx + 14, base - 36, "#f4c430"],
          [tx - 6, base - 58, "#6ec6ff"],
          [tx + 12, base - 64, "#ff4d8d"],
          [tx - 10, base - 88, "#ffd166"],
          [tx + 8, base - 92, "#e74c3c"],
          [tx + 18, base - 48, "#7dffb3"],
          [tx - 22, base - 32, "#c56cff"]
        ];
        for (var i = 0; i < baubles.length; i++) {
          ctx.fillStyle = baubles[i][2];
          ctx.beginPath();
          ctx.arc(baubles[i][0], baubles[i][1], 3.4, 0, Math.PI * 2);
          ctx.fill();
        }
        drawStar(tx, base - 132, 10);
      }

      drawGround = function(w, h, gy, scroll) {
        var b = state.biome || 0;
        if (b === 7) {
          var rawFill = ctx.fill.bind(ctx);
          ctx.fill = function() {
            var col = String(ctx.fillStyle || "").toLowerCase();
            if (col === "#1b6b34" || col === "#ffd166") return;
            return rawFill();
          };
          prev(w, h, gy, scroll);
          ctx.fill = rawFill;
          var span = w + 280;
          var smx = ((700 - scroll * 0.55) % span + span) % span - 80;
          drawGroundedTree(smx - 95, gy);
          return;
        }
        prev(w, h, gy, scroll);
      };
    })();
