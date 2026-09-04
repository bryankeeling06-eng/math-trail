(function dailyTrail() {
  var DAILY = [
    { id: "hills", name: "Sunny Hills", goal: "Picnic Spot", arrive: "You made it to the picnic!" },
    { id: "pond", name: "Duck Pond", goal: "Treehouse", arrive: "The ducks say hi!" },
    { id: "night", name: "Firefly Night", goal: "Sunny Hills", arrive: "Fireflies!" },
    { id: "pumpkin", name: "Pumpkin Patch", goal: "Candy Trail", arrive: "Pumpkins everywhere!" },
    { id: "candy", name: "Candy Trail", goal: "Snowy Hill", arrive: "Sweet candy trail!" },
    { id: "snow", name: "Snowy Hill", goal: "Firefly Night", arrive: "Snow day!" }
  ];

  function dayIndex() {
    var d = new Date();
    var start = new Date(d.getFullYear(), 0, 0);
    var diff = d - start;
    var oneDay = 86400000;
    return Math.floor(diff / oneDay);
  }

  function pickDaily() {
    var i = dayIndex() % DAILY.length;
    return DAILY[i];
  }

  function applyDaily() {
    var today = pickDaily();
    var idx = -1;
    for (var k = 0; k < PLACES.length; k++) {
      if (PLACES[k].id === today.id) { idx = k; break; }
    }
    if (idx < 0) idx = 0;
    state.placeIndex = idx;
    state.biome = idx;
    if (typeof refreshGoal === "function") refreshGoal();
    if (typeof updateHud === "function") updateHud();
  }

  // Rotate the start of the trail each day, but keep the full loop order.
  var origArrive = arriveAtNextPlace;
  arriveAtNextPlace = function() {
    origArrive();
  };

  var origStart = startGame;
  startGame = function(fromSave) {
    if (!fromSave) applyDaily();
    return origStart(fromSave);
  };

  // Show today's trail name on the menu.
  function tagToday() {
    var el = document.getElementById("runGoal");
    if (el) el.textContent = "Today's trail: " + pickDaily().name;
    var tag = document.querySelector(".menu .tag");
    if (tag && tag.id !== "runGoal") {
      // leave existing tags alone
    }
  }
  tagToday();
  setInterval(tagToday, 60000);
})();
