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
      if (typeof refreshGoal === "function") refreshGoal();
      var goal = document.getElementById("runGoal");
      if (goal) goal.textContent = "Trail has 9 stops · Next: Picnic Spot";

      function jumpTo(id) {
        var idx = 0;
        for (var i = 0; i < PLACES.length; i++) if (PLACES[i].id === id) idx = i;
        if (typeof startGame === "function") startGame(false);
        state.placeIndex = idx;
        state.biome = idx;
        state.stones = 0;
        if (typeof updateHud === "function") updateHud();
      }

      var menu = document.getElementById("menu");
      if (menu && !document.getElementById("trailJump")) {
        var row = document.createElement("div");
        row.id = "trailJump";
        row.style.cssText = "display:flex;flex-wrap:wrap;gap:6px;margin:10px 0 0;justify-content:center;";
        var label = document.createElement("div");
        label.style.cssText = "width:100%;font-size:13px;opacity:0.75;font-weight:700;margin-top:8px;";
        label.textContent = "Jump to a new trail";
        row.appendChild(label);
        [["pumpkin", "🎃 Pumpkin"], ["candy", "🍭 Candy"], ["snow", "⛄ Snow"]].forEach(function (pair) {
          var b = document.createElement("button");
          b.type = "button";
          b.className = "mode";
          b.textContent = pair[1];
          b.addEventListener("click", function () { jumpTo(pair[0]); });
          row.appendChild(b);
        });
        var start = document.getElementById("startBtn");
        if (start && start.parentNode) start.parentNode.insertBefore(row, start.nextSibling);
      }
    })();
