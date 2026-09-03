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
        { id: "night", name: "Firefly Night", goal: "Sunny Hills", arrive: "Fireflies!" }
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

      if (typeof drawTree === "function") {
        var rawDrawTree = drawTree;
        drawTree = function(t, scroll, gy) {
          var b = state.biome || 0;
          if (b === 6) { drawLollipopTree(t, scroll, gy); return; }
          rawDrawTree(t, scroll, gy);
          if (b === 7) drawSnowOnTree(t, scroll, gy);
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
        ctx.strokeStyle = "#6b3a16";
        ctx.lineWidth = 7;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(x, gy - 72);
        ctx.lineTo(x - 38, gy - 52);
        ctx.lineTo(x - 52, gy - 30);
        ctx.moveTo(x, gy - 72);
        ctx.lineTo(x + 38, gy - 50);
        ctx.lineTo(x + 54, gy - 28);
        ctx.stroke();
        ctx.fillStyle = "#c45a2a";
        ctx.beginPath();
        ctx.ellipse(x - 52, gy - 28, 7, 6, -0.3, 0, Math.PI * 2);
        ctx.ellipse(x + 54, gy - 26, 7, 6, 0.3, 0, Math.PI * 2);
        ctx.fill();
        drawCrow(x - 20, gy - 118, 1);
        drawCrow(x + 20, gy - 116, -1);
      }

      function dressSnowman(w, h, gy, scroll) {
        var span = w + 280;
        var x = ((700 - scroll * 0.55) % span + span) % span - 80;
        ctx.fillStyle = "#1b1b1b";
        ctx.beginPath();
        ctx.arc(x, gy - 28, 2.8, 0, Math.PI * 2);
        ctx.arc(x, gy - 42, 2.8, 0, Math.PI * 2);
        ctx.arc(x, gy - 54, 2.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#c0392b";
        ctx.beginPath();
        ctx.ellipse(x, gy - 62, 20, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(x + 14, gy - 64, 10, 24);
        ctx.fillStyle = "#1b1b1b";
        ctx.fillRect(x - 18, gy - 82, 36, 8);
        ctx.fillRect(x - 12, gy - 108, 24, 26);
        ctx.fillStyle = "#c0392b";
        ctx.fillRect(x - 12, gy - 86, 24, 4);
      }

      if (typeof drawGround === "function") {
        var rawGround = drawGround;
        drawGround = function(w, h, gy, scroll) {
          rawGround(w, h, gy, scroll);
          var b = state.biome || 0;
          if (b === 5) dressScarecrow(w, h, gy, scroll);
          if (b === 7) dressSnowman(w, h, gy, scroll);
        };
      }
    })();
