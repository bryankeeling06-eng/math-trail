(function dailyTrail() {
  function dayIndex() {
    var d = new Date();
    var start = new Date(d.getFullYear(), 0, 0);
    return Math.floor((d - start) / 86400000);
  }

  function pickDaily() {
    var list = (typeof PLACES !== "undefined" && PLACES.length) ? PLACES : [
      { id: "hills", name: "Sunny Hills" }
    ];
    return list[dayIndex() % list.length];
  }

  function applyDaily() {
    var today = pickDaily();
    var idx = 0;
    if (typeof PLACES !== "undefined") {
      for (var k = 0; k < PLACES.length; k++) {
        if (PLACES[k].id === today.id) { idx = k; break; }
      }
    }
    state.placeIndex = idx;
    state.biome = idx;
    if (typeof refreshGoal === "function") refreshGoal();
    if (typeof updateHud === "function") updateHud();
    tagToday();
  }

  function tagToday() {
    var today = pickDaily();
    var el = document.getElementById("runGoal");
    if (el) el.textContent = "Today's trail: " + today.name;
  }

  var origStart = startGame;
  startGame = function(fromSave) {
    if (!fromSave) applyDaily();
    return origStart(fromSave);
  };

  tagToday();
  setInterval(tagToday, 60000);
})();
