    (function extraTrailsMenu() {
      if (typeof PLACES !== "undefined") {
        var havePumpkin = false;
        for (var i = 0; i < PLACES.length; i++) if (PLACES[i].id === "pumpkin") havePumpkin = true;
        if (!havePumpkin) {
          PLACES[4].goal = "Pumpkin Patch";
          PLACES.splice(5, 0,
            { id: "pumpkin", name: "Pumpkin Patch", goal: "Candy Trail", arrive: "Pumpkins everywhere!" },
            { id: "candy", name: "Candy Trail", goal: "Snowy Hill", arrive: "Sweet candy trail!" },
            { id: "snow", name: "Snowy Hill", goal: "Firefly Night", arrive: "Snow day!" }
          );
        }
      }
      if (typeof refreshGoal === "function") refreshGoal();
      var jump = document.getElementById("trailJump");
      if (jump && jump.parentNode) jump.parentNode.removeChild(jump);
    })();
