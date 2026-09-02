window.MT_VOICES=window.MT_VOICES||{};
(function () {
  var aliases = {
    "Yes, you got it!": "Good job!",
    "You'll get it next time!": "That's okay!",
    "So close, you can do it!": "Almost!",
    "Keep going, you've got this!": "Try the next one!",
    "Bonus life! Answer in 5 seconds!": "Look at you go!",
    "Extra life! Look at you go!": "Look at you go!"
  };
  for (var k in aliases) {
    var cur = window.MT_VOICES[k];
    if (!cur || cur === "PLACEHOLDER" || cur.indexOf("data:audio") !== 0) {
      if (window.MT_VOICES[aliases[k]]) window.MT_VOICES[k] = window.MT_VOICES[aliases[k]];
    }
  }
})();
