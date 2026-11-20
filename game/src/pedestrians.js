// Pedestrians of Solmarina: they walk the sidewalks, cross at crosswalks,
// flee gunfire and crashes, and sometimes chat. A few wait for a taxi.
function updateSolmarinaPedestrians(dt) {
  const p = G.player;
  for (const ped of G.peds) {
    ped.moving = false;
    if (ped.fleeing) {
      const dx = ped.x - p.x, dy = ped.y - p.y, d = Math.hypot(dx, dy) || 1;
      ped.x += (dx / d) * 190 * dt; ped.y += (dy / d) * 190 * dt;
      ped.moving = true;
      if (d > 500) ped.fleeing = false;
    } else if (ped.waiting) {
      // Waiting for a taxi; stands still near the kerb.
    } else {
      ped.x += Math.cos(ped.angle) * ped.speed * dt;
      ped.y += Math.sin(ped.angle) * ped.speed * dt;
      ped.moving = true;
      // Turn at intersections, stay on the sidewalks.
      const nearX = G.world.roads.find((rx) => Math.abs(ped.x - rx) < 20);
      const nearY = G.world.roads.find((ry) => Math.abs(ped.y - ry) < 20);
      if ((nearX !== undefined || nearY !== undefined) && G.rng() < 0.02) {
        ped.angle = randomPick(G.rng, [0, 1.57, 3.14, 4.71]);
      }
      if (solmarinaHitsBuilding(ped.x, ped.y, 8)) ped.angle += 1.57;
      if (ped.x < 80 || ped.x > CONFIG.worldSize - 80 || ped.y < 80 || ped.y > CONFIG.worldSize - 80) ped.angle += 3.14;
    }
    // Ambient chatter bubbles, rarely.
    if (!ped.bubble && G.rng() < 0.001) {
      ped.bubble = randomPick(G.rng, ['Sunset in Solmarina!', 'Did you see the chase?', 'The Gulls run this town.', 'Best tacos on Neon Mile.', 'Traffic again...', 'Go Solmarina Suns!']);
      ped.bubbleTime = 2.5;
    }
    if (ped.bubble) { ped.bubbleTime -= dt; if (ped.bubbleTime <= 0) ped.bubble = null; }
    // Flee gunfire and crashes nearby.
    const danger = G.gunfireAt && Math.hypot(ped.x - G.gunfireAt.x, ped.y - G.gunfireAt.y) < 260;
    if (danger) ped.fleeing = true;
  }
  if (G.gunfireAt) { G.gunfireAtTime -= dt; if (G.gunfireAtTime <= 0) G.gunfireAt = null; }
  // Keep the streets populated near the player.
  if (G.peds.length < 34 && G.rng() < 0.08) spawnSolmarinaPed();
  for (let i = G.peds.length - 1; i >= 0; i--) {
    const ped = G.peds[i];
    if (!ped.cop && !ped.gang && Math.hypot(ped.x - p.x, ped.y - p.y) > 1600) G.peds.splice(i, 1);
  }
}
function spawnSolmarinaPed() {
  const p = G.player;
  const a = G.rng() * Math.PI * 2;
  const x = p.x + Math.cos(a) * 700, y = p.y + Math.sin(a) * 700;
  if (x < 80 || y < 80 || x > CONFIG.worldSize - 80 || y > CONFIG.worldSize - 80) return;
  if (solmarinaHitsBuilding(x, y, 10)) return;
  G.peds.push({
    x, y, angle: randomPick(G.rng, [0, 1.57, 3.14, 4.71]),
    speed: randomRange(G.rng, 40, 80),
    color: randomPick(G.rng, ['#e07820', '#3a7ab8', '#b83a7a', '#3a8a5a', '#c8a83a', '#7a5ab8']),
    bubble: null, bubbleTime: 0, fleeing: false, waiting: G.rng() < 0.12,
    health: 40, gang: false, cop: false,
  });
}
function nearestSolmarinaFare(x, y) {
  for (const ped of G.peds) {
    if (ped.waiting && Math.hypot(ped.x - x, ped.y - y) < 60) return ped;
  }
  return null;
}
function nearestSolmarinaEnemy(x, y, maxDist) {
  let best = null, bd = maxDist;
  for (const ped of G.peds) {
    if (!ped.gang && !ped.cop) continue;
    const d = Math.hypot(ped.x - x, ped.y - y);
    if (d < bd) { bd = d; best = ped; }
  }
  return best;
}
