(function dailyTrail() {
  var BIOME = {
    hills: 0,
    picnic: 1,
    pond: 2,
    treehouse: 3,
    barn: 4,
    space: 5
  };

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

  function biomeOf(place) {
    if (!place) return 0;
    if (BIOME[place.id] != null) return BIOME[place.id];
    return 0;
  }

  function syncBiome() {
    var p = (typeof currentPlace === "function") ? currentPlace() : (PLACES && PLACES[state.placeIndex || 0]);
    state.biome = biomeOf(p);
    if (typeof refreshGoal === "function") refreshGoal();
    var chip = document.getElementById("levelChip");
    if (chip && p) chip.textContent = p.name;
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
    for (var r = 0; r < route.length; r++) {
      var here = route[r];
      var nxt = route[(r + 1) % route.length];
      here.goal = nxt.name;
      PLACES.push(here);
    }
    state.placeIndex = 0;
    syncBiome();
    tagToday();
  }

  function tagToday() {
    var p = (typeof PLACES !== "undefined" && PLACES[0]) ? PLACES[0] : null;
    var n = (typeof PLACES !== "undefined" && PLACES[1]) ? PLACES[1] : null;
    var el = document.getElementById("runGoal");
    if (el && p) el.textContent = "Today: " + p.name + (n ? " \u2192 " + n.name : "");
  }

  if (typeof startGame === "function") {
    var origStart = startGame;
    startGame = function(fromSave) {
      var out = origStart(fromSave);
      if (!fromSave) applyDaily();
      else syncBiome();
      return out;
    };
  }

  if (typeof arriveAtNextPlace === "function") {
    var origArrive = arriveAtNextPlace;
    arriveAtNextPlace = function() {
      origArrive();
      syncBiome();
    };
  }

  applyDaily();
  setInterval(tagToday, 60000);
})();
