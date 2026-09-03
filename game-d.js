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
    })();
