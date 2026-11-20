// Combat: Rio's weapons, mouse aim, gang members who fight back, and
// what happens when an enemy goes down.
function updateSolmarinaCombat(dt) {
  const p = G.player;
  p.fireCooldown = Math.max(0, (p.fireCooldown || 0) - dt);
  // Aim at the mouse; shoot on click when armed and on foot or driving.
  if (G.input.mousePressed && G.state === 'play' && p.weapon !== 'fists') {
    fireRioWeapon();
  }
  if (G.input.mousePressed && G.state === 'play' && p.weapon === 'fists' && p.car) {
    // Drive-by punch does nothing; keep the click for later.
  }
  // Gang members approach, strafe and shoot.
  for (const ped of G.peds) {
    if (!ped.gang) continue;
    const dx = p.x - ped.x, dy = p.y - ped.y, d = Math.hypot(dx, dy) || 1;
    ped.moving = false;
    if (d < 420) {
      ped.cooldown = (ped.cooldown || 0) - dt;
      if (d > 180) { ped.x += (dx / d) * 120 * dt; ped.y += (dy / d) * 120 * dt; ped.moving = true; }
      else { ped.x += (-dy / d) * 60 * dt; ped.y += (dx / d) * 60 * dt; ped.moving = true; }
      if (ped.cooldown <= 0 && d < 380) {
        ped.cooldown = 1.1 + G.rng() * 0.8;
        G.gunfireAt = { x: ped.x, y: ped.y }; G.gunfireAtTime = 0.4;
        spawnMuzzleFlash(ped.x, ped.y, Math.atan2(dy, dx));
        playGameSound('gunshot', 0.3);
        if (G.rng() < 0.55) damageRioPlayer(9, ped);
      }
    }
  }
  // Health regen is slow; armor absorbs first.
  if (p.health < 100 && p.health > 0) p.health = Math.min(100, p.health + 1.2 * dt);
}
function fireRioWeapon() {
  const p = G.player;
  const w = CONFIG.weapons[p.weapon];
  if (!w || p.fireCooldown > 0) return;
  if (p.ammo <= 0 && p.weapon !== 'fists') { G.hint = 'Out of ammo — visit Iron & Sons'; playGameSound('thud', 0.3); return; }
  p.fireCooldown = w.rate;
  if (p.weapon !== 'fists') p.ammo--;
  const ox = p.car ? p.car.x : p.x, oy = p.car ? p.car.y : p.y;
  // Aim from the player toward the mouse in world space.
  const wx = G.camera.x + (G.input.mouseX - 640) / G.camera.zoom;
  const wy = G.camera.y + (G.input.mouseY - 360) / G.camera.zoom;
  const angle = Math.atan2(wy - oy, wx - ox);
  p.angle = angle;
  spawnMuzzleFlash(ox, oy, angle);
  playGameSound('gunshot', 0.55);
  G.gunfireAt = { x: ox, y: oy }; G.gunfireAtTime = 0.5;
  // Hit the nearest gang member or cop along the shot line.
  let best = null, bd = w.range;
  for (const ped of G.peds) {
    if (!ped.gang && !ped.cop) continue;
    const d = Math.hypot(ped.x - ox, ped.y - oy);
    if (d > w.range) continue;
    const ang = Math.atan2(ped.y - oy, ped.x - ox);
    let diff = Math.abs(ang - angle); if (diff > Math.PI) diff = Math.PI * 2 - diff;
    if (diff < 0.18 && d < bd) { bd = d; best = ped; }
  }
  if (best) {
    best.health -= w.damage;
    spawnSparks(best.x, best.y, 6);
    if (best.health <= 0) killSolmarinaEnemy(best);
    else best.fleeing = false;
  }
  // Shooting in public raises the heat.
  if (G.wanted < 2) raiseSolmarinaWanted(1, 'Shots fired');
}
function damageRioPlayer(amount, from) {
  const p = G.player;
  if (p.armor > 0) { const absorbed = Math.min(p.armor, amount); p.armor -= absorbed; amount -= absorbed; }
  p.health -= amount;
  G.damageFlash = Math.max(G.damageFlash, 0.5);
  if (p.health <= 0) wastedSolmarina();
}
function killSolmarinaEnemy(ped) {
  spawnSparks(ped.x, ped.y, 14);
  G.cash += 80; G.stats.cashEarned += 80;
  addFloater(ped.x, ped.y - 20, '+$80', '#7aff5a');
  if (ped.gang) {
    G.missionKills = (G.missionKills || 0) + 1;
    if (G.rng() < 0.4) { G.player.ammo += 12; addFloater(ped.x, ped.y - 40, '+12 AMMO', '#ffd23a'); }
  }
  if (ped.cop) raiseSolmarinaWanted(1, 'Officer down');
  const idx = G.peds.indexOf(ped);
  if (idx >= 0) G.peds.splice(idx, 1);
  for (let i = G.cops.length - 1; i >= 0; i--) if (G.cops[i].ped === ped) G.cops.splice(i, 1);
}
function spawnSolmarinaGang(x, y, n) {
  for (let i = 0; i < n; i++) {
    G.peds.push({
      x: x + (G.rng() - 0.5) * 120, y: y + (G.rng() - 0.5) * 120,
      angle: 0, speed: 110, color: '#3a3a44', bubble: null, bubbleTime: 0,
      fleeing: false, waiting: false, health: 70, gang: true, cop: false,
      cooldown: 0.5 + G.rng(), moving: false,
    });
  }
}
