// Vehicles: player driving physics, traffic that follows the road graph
// and stops at red lights, parked cars, and spawning around the player.
function updateSolmarinaTraffic(dt) {
  const input = G.input;
  for (const car of G.cars) {
    if (car.driver === 'player') updateSolmarinaPlayerCar(car, dt, input);
    else if (car.driver === 'traffic') updateSolmarinaTrafficCar(car, dt);
    else if (car.driver === 'police') updateSolmarinaPoliceCar(car, dt);
    else if (car.driver === 'parked') { car.speed = 0; }
    if (car.burning) {
      car.burnTime -= dt;
      if (G.rng() < 0.3) spawnSmoke(car.x, car.y, 1);
      if (car.burnTime <= 0) {
        spawnExplosion(car.x, car.y, true);
        car.burning = false; car.wrecked = true; car.speed = 0;
        if (car.driver === 'police') removeSolmarinaCopCar(car);
      }
    }
  }
  // Keep traffic dense near the player, sparse far away.
  if (G.cars.length < 26 && G.rng() < 0.05) spawnSolmarinaTrafficCar();
  for (let i = G.cars.length - 1; i >= 0; i--) {
    const car = G.cars[i];
    if (car.driver === 'traffic' && Math.hypot(car.x - G.player.x, car.y - G.player.y) > 1500) {
      G.cars.splice(i, 1);
    }
  }
  // Car-car separation so traffic does not pile up.
  for (let i = 0; i < G.cars.length; i++) for (let j = i + 1; j < G.cars.length; j++) {
    const a = G.cars[i], b = G.cars[j];
    const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
    if (d > 0.01 && d < 44) {
      const push = (44 - d) / 2, nx = dx / d, ny = dy / d;
      if (a.driver !== 'player') { a.x -= nx * push; a.y -= ny * push; }
      if (b.driver !== 'player') { b.x += nx * push; b.y += ny * push; }
      if ((a.driver === 'player' || b.driver === 'player') && Math.abs(a.speed - b.speed) > 120) {
        const hit = a.driver === 'player' ? a : b;
        damageSolmarinaCar(hit, 6);
        if (G.rng() < 0.4) playGameSound('crash', 0.3);
      }
    }
  }
}
function updateSolmarinaPlayerCar(car, dt, input) {
  const def = CONFIG.cars[car.type] || CONFIG.cars.sedan;
  const fwd = (inputDown(input, 'KeyW') || inputDown(input, 'ArrowUp')) ? 1 : 0;
  const rev = (inputDown(input, 'KeyS') || inputDown(input, 'ArrowDown')) ? 1 : 0;
  const steer = ((inputDown(input, 'KeyA') || inputDown(input, 'ArrowLeft')) ? -1 : 0) +
    ((inputDown(input, 'KeyD') || inputDown(input, 'ArrowRight')) ? 1 : 0);
  const brake = inputDown(input, 'Space');
  if (fwd) car.speed += def.accel * dt * (car.speed < 0 ? 2.2 : 1);
  if (rev) car.speed -= def.accel * 0.8 * dt;
  if (!fwd && !rev) car.speed *= Math.pow(0.4, dt);
  if (brake) {
    car.speed *= Math.pow(0.05, dt);
    if (Math.abs(car.speed) > 120 && G.rng() < 0.6) {
      G.skids.push({ x: car.x - Math.cos(car.angle) * 14, y: car.y - Math.sin(car.angle) * 14, a: car.angle, life: 6 });
      spawnSmoke(car.x, car.y, 1);
    }
  }
  car.speed = Math.max(-140, Math.min(def.top, car.speed));
  const turnRate = def.grip * (0.4 + Math.min(1, Math.abs(car.speed) / 220));
  car.angle += steer * turnRate * dt * (car.speed >= 0 ? 1 : -1) * Math.sign(car.speed || 1);
  moveSolmarinaCar(car, dt);
  // Stunt jumps: hit a ramp fast and catch air.
  for (const r of G.world.ramps) {
    if (Math.hypot(car.x - r.x, car.y - r.y) < 30 && Math.abs(car.speed) > 260 && !car.airborne) {
      car.airborne = 0.9; G.stats.bestStunt = Math.max(G.stats.bestStunt, Math.round(Math.abs(car.speed) / 10));
      G.cash += 150; G.stats.cashEarned += 150;
      addFloater(car.x, car.y - 30, 'STUNT JUMP +$150', '#7aff5a');
      playGameSound('pickup', 0.5);
    }
  }
  if (car.airborne) car.airborne -= dt;
  if (inputPressed(input, 'KeyE')) exitSolmarinaCar();
  if (inputPressed(input, 'KeyR')) { G.radio = (G.radio + 1) % 3; G.hint = 'Radio: ' + CONFIG.radioStations[G.radio]; }
}
function moveSolmarinaCar(car, dt) {
  const nx = car.x + Math.cos(car.angle) * car.speed * dt;
  const ny = car.y + Math.sin(car.angle) * car.speed * dt;
  const hit = solmarinaHitsBuilding(nx, ny, 20);
  if (hit) {
    if (Math.abs(car.speed) > 180) { damageSolmarinaCar(car, 10); playGameSound('crash', 0.5); spawnSparks(nx, ny, 8); }
    car.speed *= -0.25;
    return;
  }
  car.x = Math.max(40, Math.min(CONFIG.worldSize - 40, nx));
  car.y = Math.max(40, Math.min(CONFIG.worldSize - 40, ny));
}
function updateSolmarinaTrafficCar(car, dt) {
  const def = CONFIG.cars[car.type] || CONFIG.cars.sedan;
  const target = Math.min(def.top * 0.55, 190);
  // Stop at a red light when approaching an intersection.
  let blocked = false;
  for (const L of G.world.lights) {
    const d = Math.hypot(car.x - L.x, car.y - L.y);
    if (d < 70) {
      const st = solmarinaLightState(L);
      const movingV = Math.abs(Math.sin(car.angle)) > 0.7;
      if ((st === 'v' && !movingV) || (st === 'h' && movingV)) { blocked = true; break; }
    }
  }
  if (blocked) { car.speed = Math.max(0, car.speed - 300 * dt); }
  else car.speed += (target - car.speed) * 0.8 * dt;
  // At an intersection, sometimes turn onto the crossing road.
  const nearX = G.world.roads.find((rx) => Math.abs(car.x - rx) < 14);
  const nearY = G.world.roads.find((ry) => Math.abs(car.y - ry) < 14);
  if (nearX !== undefined && nearY !== undefined && G.rng() < 0.01) {
    car.angle = randomPick(G.rng, [0, 1.57, 3.14, 4.71]);
  }
  moveSolmarinaCar(car, dt);
}
function damageSolmarinaCar(car, amount) {
  car.damage = (car.damage || 0) + amount;
  if (car.damage > 75 && !car.burning) { car.burning = true; car.burnTime = 3; }
  if (car.damage > 100 && !car.wrecked) {
    spawnExplosion(car.x, car.y, true);
    car.wrecked = true; car.speed = 0;
    if (car === G.player.car) { G.player.car = null; G.player.health -= 25; }
  }
}
function spawnSolmarinaCar(type, x, y, angle, driver) {
  const def = CONFIG.cars[type] || CONFIG.cars.sedan;
  const car = {
    type, x, y, angle: angle || 0, speed: 0, driver: driver || 'parked',
    color: randomPick(G.rng, def.colors), damage: 0, burning: false, wrecked: false, stolen: false,
  };
  G.cars.push(car);
  return car;
}
function spawnSolmarinaTrafficCar() {
  const p = G.player;
  const a = G.rng() * Math.PI * 2;
  const x = p.x + Math.cos(a) * 900, y = p.y + Math.sin(a) * 900;
  if (x < 80 || y < 80 || x > CONFIG.worldSize - 80 || y > CONFIG.worldSize - 80) return;
  if (!solmarinaOnRoad(x, y)) return;
  const type = randomPick(G.rng, ['sedan', 'sedan', 'coupe', 'van', 'taxi']);
  const car = spawnSolmarinaCar(type, x, y, randomPick(G.rng, [0, 1.57, 3.14, 4.71]), 'traffic');
  car.speed = 120;
}
