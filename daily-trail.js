(function dailyTrail() {
  function dayIndex() {
    var d = new Date();
    var start = new Date(d.getFullYear(), 0, 0);
    return Math.floor((d - start) / 86400000);
  }

  function shuffleDay(list, seed) {
    var a = [];
    for (var i = 0; i < list.length; i++) a.push(list[i]);
    var s = seed || 1;
    for (var n = a.length - 1; n > 0; n--) {
      s = (s * 16807) % 2147483647;
      var j = s % (n + 1);
      var t = a[n];
      a[n] = a[j];
      a[j] = t;
    }
    return a;
  }

  function applyDaily() {
    if (typeof PLACES === "undefined" || !PLACES.length) return;
    if (!state._dailyBase) {
      state._dailyBase = [];
      for (var i = 0; i < PLACES.length; i++) state._dailyBase.push(PLACES[i]);
    }
    var day = dayIndex();
    var route = shuffleDay(state._dailyBase, day + 17);
    PLACES.splice(0, PLACES.length);
    for (var r = 0; r < route.length; r++) PLACES.push(route[r]);
    state.placeIndex = 0;
    state.biome = 0;
    if (typeof refreshGoal === "function") refreshGoal();
    if (typeof updateHud === "function") updateHud();
    tagToday();
  }

  function tagToday() {
    var p = (typeof PLACES !== "undefined" && PLACES[0]) ? PLACES[0] : null;
    var n = (typeof PLACES !== "undefined" && PLACES[1]) ? PLACES[1] : null;
    var el = document.getElementById("runGoal");
    if (el && p) {
      el.textContent = "Today: " + p.name + (n ? " → " + n.name : "");
    }
  }

  if (typeof startGame === "function") {
    var origStart = startGame;
    startGame = function(fromSave) {
      var out = origStart(fromSave);
      if (!fromSave) applyDaily();
      return out;
    };
  }

  applyDaily();
  setInterval(tagToday, 60000);
})();
