(function spaceSky() {
  if (typeof drawGround !== "function") return;

  function inSpace() {
    return (state.biome || 0) === 5 || !!state.launching;
  }

  if (!state.spaceShips) {
    state.spaceShips = [];
    for (var i = 0; i < 5; i++) {
      state.spaceShips.push({
        x: Math.random() * 900,
        y: 40 + Math.random() * 160,
        s: 0.6 + Math.random() * 0.9,
        sp: 18 + Math.random() * 34,
        hue: ["#ff8a3c", "#7ad0ff", "#c8ffd4", "#ffd166", "#c56cff"][i % 5],
        dir: Math.random() < 0.5 ? 1 : -1
      });
    }
  }
  if (!state.spacePlanets) {
    state.spacePlanets = [];
    var specs = [
      { x: 0.18, y: 70, r: 26, body: "#6ec6ff", shade: "#2b6cb0", ring: "#c5d3e6" },
      { x: 0.62, y: 120, r: 18, body: "#ffb36b", shade: "#c45a2a", ring: null },
      { x: 0.86, y: 60, r: 12, body: "#b388ff", shade: "#6a1b9a", ring: "#e1bee7" }
    ];
    for (var p = 0; p < specs.length; p++) {
      state.spacePlanets.push(specs[p]);
    }
  }

  function drawPlanet(pl, w) {
    var cx = w * pl.x;
    var cy = pl.y;
    var r = pl.r;
    ctx.fillStyle = pl.shade;
    ctx.beginPath();
    ctx.arc(cx + r * 0.25, cy + r * 0.2, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = pl.body;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.beginPath();
    ctx.arc(cx - r * 0.35, cy - r * 0.35, r * 0.35, 0, Math.PI * 2);
    ctx.fill();
    if (pl.ring) {
      ctx.strokeStyle = pl.ring;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(cx, cy, r * 1.7, r * 0.45, -0.3, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function drawShip(sh, dt) {
    sh.x += sh.sp * sh.dir * dt;
    var w = (typeof viewW === "function") ? viewW() : 800;
    if (sh.dir > 0 && sh.x > w + 60) { sh.x = -60; sh.y = 40 + Math.random() * 160; }
    if (sh.dir < 0 && sh.x < -60) { sh.x = w + 60; sh.y = 40 + Math.random() * 160; }
    var s = sh.s;
    ctx.save();
    ctx.translate(sh.x, sh.y);
    ctx.scale(sh.dir, 1);
    ctx.scale(s, s);
    ctx.fillStyle = "rgba(255,180,80,0.5)";
    ctx.beginPath();
    ctx.moveTo(-26, 0);
    ctx.lineTo(-40, 5);
    ctx.lineTo(-40, -5);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = sh.hue;
    ctx.beginPath();
    ctx.ellipse(0, 0, 18, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#eef3ff";
    ctx.beginPath();
    ctx.ellipse(4, -1, 7, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1b2a41";
    ctx.beginPath();
    ctx.arc(5, -1, 1.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#c5d3e6";
    ctx.beginPath();
    ctx.moveTo(-10, -9);
    ctx.lineTo(-2, -16);
    ctx.lineTo(4, -9);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  var rawGround = drawGround;
  drawGround = function(w, h, gy, scroll) {
    if (inSpace()) {
      ctx.fillStyle = "#050816";
      ctx.fillRect(0, 0, w, h);
      for (var i = 0; i < state.spacePlanets.length; i++) drawPlanet(state.spacePlanets[i], w);
      for (var j = 0; j < 70; j++) {
        var sx = ((j * 97 + scroll * 0.12) % (w + 40) + (w + 40)) % (w + 40) - 20;
        var sy = 16 + (j * 53) % Math.max(40, h - 40);
        var tw = 0.35 + 0.55 * Math.abs(Math.sin((state.t || 0) * 3 + j));
        ctx.fillStyle = "rgba(255,255,230," + tw + ")";
        ctx.beginPath();
        ctx.arc(sx, sy, j % 5 === 0 ? 2.2 : 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
      for (var k = 0; k < state.spaceShips.length; k++) drawShip(state.spaceShips[k], 0.016);
      ctx.fillStyle = "#12122a";
      ctx.fillRect(0, gy + 8, w, h);
      ctx.fillStyle = "#1a1a36";
      ctx.fillRect(0, gy, w, 12);
      return;
    }
    rawGround(w, h, gy, scroll);
  };

  if (typeof tickTrail === "function") {
    var rawTick = tickTrail;
    tickTrail = function(dt) {
      rawTick(dt);
      if (inSpace() && state.spaceShips) {
        for (var i = 0; i < state.spaceShips.length; i++) {
          state.spaceShips[i].x += state.spaceShips[i].sp * state.spaceShips[i].dir * dt;
        }
      }
    };
  }
})();
