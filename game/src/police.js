// The wanted system and the Solmarina City Police: foot cops at low heat,
// patrol cars from two stars, roadblocks and a helicopter at four stars,
// and the evade meter that lets a clean getaway clear the heat.
function updateSolmarinaPolice(dt) {
  const p = G.player;
  // Spawn pressure scales with the wanted level.
  const wantCars = G.wanted >= 2 ? Math.min(2 + G.wanted, 6) : 0;
  const wantCops = G.wanted === 1 ? 2 : (G.wanted === 2 ? 2 : 0);
  const copCars = G.cops.filter((c) => c.kind === 'car').length;
  const footCops = G.cops.filter((c) => c.kind === 'foot').length;
  if (G.wanted > 0 && copCars < wantCars && G.rng() < 0.03) spawnSolmarinaPoliceCar();
  if (G.wanted > 0 && footCops < wantCops && G.rng() < 0.02) spawnSolmarinaFootCop();
  if (G.wanted >= 4 && !G.heli && G.rng() < 0.02) {
    G.heli = { x: p.x + 200, y: p.y - 300 };
    G.hint = 'Police helicopter overhead — break line of sight!';
  }
  if (G.wanted < 4) G.heli = null;
  if (G.heli) {
    G.heli.x += (p.x - G.heli.x) * 0.5 * dt;
    G.heli.y += (p.y - 190 - G.heli.y) * 0.5 * dt;
  }
  // Evade: no cop close and no line of sight for a while clears a star.
  let seen = false;
  for (const c of G.cops) {
    const t = c.kind === 'car' ? c.car : c.ped;
    if (t && Math.hypot(t.x - p.x, t.y - p.y) < 420) { seen = true; break; }
  }
  if (G.wanted > 0) {
    if (seen) { G.evade = 0; }
    else {
      G.evade += dt;
      if (G.evade > 8) { G.wanted--; G.evade = 0; addFloater(p.x, p.y - 40, 'HEAT DOWN — ' + G.wanted + ' STARS', '#7aff5a'); }
    }
  }
  // Busted: a foot cop touches Rio while he is on foot at low health.
  if (p.health <= 25 && !p.car) {
    for (const c of G.cops) {
      if (c.kind === 'foot' && c.ped && Math.hypot(c.ped.x - p.x, c.ped.y - p.y) < 26) {
        bustedSolmarina('BUSTED — the SCPD caught you');
        return;
      }
    }
  }
  // Foot cops chase on foot.
  for (const c of G.cops) {
    if (c.kind !== 'foot' || !c.ped) continue;
    const dx = p.x - c.ped.x, dy = p.y - c.ped.y, d = Math.hypot(dx, dy) || 1;
    if (d < 500) {
      c.ped.x += (dx / d) * 150 * dt; c.ped.y += (dy / d) * 150 * dt;
      c.ped.moving = true;
      if (d < 30 && p.health > 0) { p.health -= 12 * dt; if (p.health <= 0) wastedSolmarina(); }
    }
  }
  // Roadblocks at four stars: two patrol cars parked across the road ahead.
  if (G.wanted >= 4 && !G.roadblock && G.rng() < 0.005) {
    G.roadblock = true;
    const a = p.car ? p.car.angle : p.angle;
    const bx = p.x + Math.cos(a) * 420, by = p.y + Math.sin(a) * 420;
    spawnSolmarinaCar('police', bx, by, a + 1.57, 'parked');
    spawnSolmarinaCar('police', bx + 60, by + 40, a + 1.57, 'parked');
    G.hint = 'ROADBLOCK AHEAD';
  }
  if (G.wanted < 4) G.roadblock = false;
}
function updateSolmarinaPoliceCar(car, dt) {
  const p = G.player;
  const tx = p.car ? p.car.x : p.x, ty = p.car ? p.car.y : p.y;
  const dx = tx - car.x, dy = ty - car.y, d = Math.hypot(dx, dy) || 1;
  const wantAngle = Math.atan2(dy, dx);
  let da = wantAngle - car.angle;
  while (da > Math.PI) da -= Math.PI * 2;
  while (da < -Math.PI) da += Math.PI * 2;
  car.angle += Math.max(-2.6 * dt, Math.min(2.6 * dt, da));
  const def = CONFIG.cars.police;
  const target = d > 300 ? def.top : (d > 120 ? def.top * 0.8 : 200);
  car.speed += (target - car.speed) * 1.2 * dt;
  moveSolmarinaCar(car, dt);
  // Ramming: a hard hit on the player's car damages it and shakes the screen.
  car.ramCd = Math.max(0, (car.ramCd || 0) - dt);
  if (p.car && d < 52 && Math.abs(car.speed) > 150 && car.ramCd <= 0) {
    damageSolmarinaCar(p.car, 4);
    car.ramCd = 0.6;
    G.shake = Math.max(G.shake, 6);
    if (G.rng() < 0.3) playGameSound('crash', 0.25);
  }
}
function spawnSolmarinaPoliceCar() {
  const p = G.player;
  const a = G.rng() * Math.PI * 2;
  const car = spawnSolmarinaCar('police', p.x + Math.cos(a) * 700, p.y + Math.sin(a) * 700, 0, 'police');
  car.speed = 200;
  G.cops.push({ kind: 'car', car, name: randomPick(G.rng, CONFIG.dispatchNames), status: 'PURSUIT' });
  return car;
}
function spawnSolmarinaFootCop() {
  const p = G.player;
  const a = G.rng() * Math.PI * 2;
  const ped = {
    x: p.x + Math.cos(a) * 300, y: p.y + Math.sin(a) * 300, angle: 0, speed: 150,
    color: '#20242c', bubble: null, bubbleTime: 0, fleeing: false, waiting: false,
    health: 60, gang: false, cop: true, moving: true,
  };
  G.peds.push(ped);
  G.cops.push({ kind: 'foot', ped, name: randomPick(G.rng, CONFIG.dispatchNames), status: 'FOOT PURSUIT' });
  return ped;
}
function removeSolmarinaCopCar(car) {
  for (let i = G.cops.length - 1; i >= 0; i--) {
    if (G.cops[i].car === car) G.cops.splice(i, 1);
  }
  car.driver = 'parked';
  G.wanted = Math.max(1, G.wanted);
}
function raiseSolmarinaWanted(stars, reason) {
  const before = G.wanted;
  G.wanted = Math.min(5, G.wanted + stars);
  if (G.wanted > before) {
    G.hint = reason + ' — wanted level ' + G.wanted;
    addFloater(G.player.x, G.player.y - 44, 'WANTED ' + G.wanted + ' ★', '#ff5050');
  }
}
function bustedSolmarina(reason) {
  if (G.state !== 'play') return;
  G.state = 'busted';
  const lost = Math.min(G.cash, 300);
  G.cash -= lost;
  G.wanted = 0; G.cops = []; G.heli = null;
  G.bustedReason = reason + ' — lost $' + lost + ' and your weapons';
  G.player.weapon = 'fists'; G.player.ammo = 0;
  playGameSound('fail', 0.7);
  saveSolmarinaGame();
}
function wastedSolmarina() {
  if (G.state !== 'play') return;
  G.state = 'wasted';
  const lost = Math.min(G.cash, 500);
  G.cash -= lost;
  G.wanted = 0; G.cops = []; G.heli = null;
  G.player.health = 100; G.player.armor = 0;
  playGameSound('fail', 0.7);
  saveSolmarinaGame();
}
