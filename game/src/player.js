// Rio Calloway on foot: walk, sprint, enter and exit cars, and interact
// with the world. Driving itself lives in vehicles.js.
function updateRioPlayer(dt) {
  const p = G.player, input = G.input;
  if (p.car) return;
  let mx = 0, my = 0;
  if (inputDown(input, 'KeyW') || inputDown(input, 'ArrowUp')) my -= 1;
  if (inputDown(input, 'KeyS') || inputDown(input, 'ArrowDown')) my += 1;
  if (inputDown(input, 'KeyA') || inputDown(input, 'ArrowLeft')) mx -= 1;
  if (inputDown(input, 'KeyD') || inputDown(input, 'ArrowRight')) mx += 1;
  p.moving = (mx !== 0 || my !== 0);
  const sprint = inputDown(input, 'ShiftLeft') || inputDown(input, 'ShiftRight');
  const speed = sprint ? 260 : 165;
  if (p.moving) {
    const len = Math.hypot(mx, my); mx /= len; my /= len;
    p.angle = Math.atan2(my, mx);
    const nx = p.x + mx * speed * dt, ny = p.y + my * speed * dt;
    const fixed = solmarinaResolveCircle(nx, ny, 12);
    p.x = fixed.x; p.y = fixed.y;
    if (fixed.hit) playGameSound('thud', 0.08);
  }
  p.x = Math.max(60, Math.min(CONFIG.worldSize - 60, p.x));
  p.y = Math.max(60, Math.min(CONFIG.worldSize - 60, p.y));
  // Hidden packages: walk over one to collect it.
  for (const pkg of G.world.packages) {
    if (!pkg.taken && Math.hypot(p.x - pkg.x, p.y - pkg.y) < 26) {
      pkg.taken = true; G.stats.packages++;
      G.cash += 250; G.stats.cashEarned += 250;
      addFloater(pkg.x, pkg.y, '+$250  PACKAGE ' + G.stats.packages + '/20', '#ffd23a');
      playGameSound('pickup', 0.6);
    }
  }
  // Enter a nearby car, or start an interaction.
  if (inputPressed(input, 'KeyE') || inputPressed(input, 'KeyF')) {
    const car = nearestSolmarinaCar(p.x, p.y, 60);
    if (car) { enterSolmarinaCar(car); return; }
    const fare = nearestSolmarinaFare(p.x, p.y);
    if (fare) { startSolmarinaFare(fare); return; }
    const race = nearestSolmarinaRace(p.x, p.y);
    if (race) { startSolmarinaRace(race); return; }
  }
  // Punch on click when on foot.
  if (input.mousePressed && G.state === 'play') {
    const target = nearestSolmarinaEnemy(p.x, p.y, 60);
    if (target) {
      target.health -= CONFIG.weapons.fists.damage;
      playGameSound('punch', 0.6);
      spawnSparks(target.x, target.y, 5);
      if (target.health <= 0) killSolmarinaEnemy(target);
    } else {
      playGameSound('punch', 0.25);
    }
  }
}
function nearestSolmarinaCar(x, y, maxDist) {
  let best = null, bd = maxDist;
  for (const car of G.cars) {
    if (car === G.player.car) continue;
    const d = Math.hypot(car.x - x, car.y - y);
    if (d < bd) { bd = d; best = car; }
  }
  return best;
}
function enterSolmarinaCar(car) {
  const p = G.player;
  if (car.driver === 'police') return;
  const witnessed = car.driver === 'traffic' || car.driver === 'parked';
  if (witnessed && car.driver === 'parked' && !car.stolen) {
    car.stolen = true; G.stats.carsStolen++;
    raiseSolmarinaWanted(1, 'Car stolen');
  }
  if (car.driver === 'traffic') {
    // Pull the driver out: the car is now ours, the driver flees on foot.
    const driver = car.driverPed;
    if (driver) { driver.x = car.x + 30; driver.y = car.y + 30; driver.fleeing = true; }
    car.driver = 'player'; car.stolen = true; G.stats.carsStolen++;
    raiseSolmarinaWanted(1, 'Car stolen');
  }
  car.driver = 'player';
  p.car = car; p.x = car.x; p.y = car.y;
  G.hint = car.type === 'taxi' ? 'Taxi: drive to the fare marker for cash' : 'Drive with W A S D — Space is the handbrake';
}
function exitSolmarinaCar() {
  const p = G.player;
  if (!p.car) return;
  const car = p.car;
  p.x = car.x + Math.cos(car.angle + 1.57) * 34;
  p.y = car.y + Math.sin(car.angle + 1.57) * 34;
  car.driver = 'parked'; car.speed = 0;
  p.car = null;
}
