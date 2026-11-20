// Side activities: taxi fares, vigilante work in a police car, checkpoint
// races, and the respray garage that clears the wanted level.
function updateSolmarinaActivities(dt) {
  const p = G.player;
  // Taxi fare in progress.
  if (G.fare) {
    const dest = G.fare.dest;
    const px = p.car ? p.car.x : p.x, py = p.car ? p.car.y : p.y;
    G.marker = { x: dest[0], y: dest[1], r: 70 };
    G.fare.timer -= dt;
    G.objective = 'Taxi fare — deliver in ' + Math.max(0, Math.ceil(G.fare.timer)) + 's';
    if (Math.hypot(dest[0] - px, dest[1] - py) < 70) {
      const tip = Math.max(0, Math.round(G.fare.timer)) * 2;
      const pay = 120 + tip;
      G.cash += pay; G.stats.cashEarned += pay; G.stats.fares++;
      addFloater(px, py - 30, 'FARE PAID +$' + pay, '#7aff5a');
      playGameSound('pickup', 0.6);
      G.fare = null; G.marker = null; G.objective = 'Free roam';
    } else if (G.fare.timer <= 0) {
      G.fare = null; G.marker = null; G.objective = 'Free roam';
      G.hint = 'Fare lost — the passenger walked away';
    }
  }
  // Vigilante: in a police car, marked criminal cars pay for a wreck.
  if (p.car && p.car.type === 'police') {
    if (!G.vigilanteTarget || G.vigilanteTarget.wrecked) {
      const cands = G.cars.filter((c) => c.driver === 'traffic' && !c.wrecked);
      if (cands.length) {
        G.vigilanteTarget = randomPick(G.rng, cands);
        G.vigilanteTarget.criminal = true;
        G.hint = 'VIGILANTE: stop the marked criminal car';
      }
    }
    if (G.vigilanteTarget && G.vigilanteTarget.wrecked) {
      G.cash += 400; G.stats.cashEarned += 400;
      addFloater(G.vigilanteTarget.x, G.vigilanteTarget.y - 30, 'VIGILANTE +$400', '#7aff5a');
      G.vigilanteTarget = null;
    }
  }
  // Race in progress.
  if (G.race) {
    const cp = G.race.points[G.race.next];
    if (cp) {
      G.marker = { x: cp[0], y: cp[1], r: 70 };
      const px = p.car ? p.car.x : p.x, py = p.car ? p.car.y : p.y;
      G.race.timer += dt;
      G.objective = G.race.name + ' — checkpoint ' + (G.race.next + 1) + '/' + G.race.points.length + ' — ' + G.race.timer.toFixed(1) + 's';
      if (Math.hypot(cp[0] - px, cp[1] - py) < 70) {
        G.race.next++;
        playGameSound('pickup', 0.5);
        if (G.race.next >= G.race.points.length) {
          const t = G.race.timer;
          const prize = t <= G.race.par ? 800 : 250;
          G.cash += prize; G.stats.cashEarned += prize;
          addFloater(px, py - 30, 'RACE DONE ' + t.toFixed(1) + 's +$' + prize, '#7aff5a');
          G.race = null; G.marker = null; G.objective = 'Free roam';
        }
      }
    }
  }
  // Respray garage: drive in with heat and cash to clear the wanted level.
  const shop = G.world.shops.find((s) => s.kind === 'respray');
  if (shop && p.car && G.wanted > 0 && Math.hypot(p.car.x - shop.x, p.car.y - shop.y) < 80 && G.cash >= 200) {
    G.cash -= 200; G.wanted = 0; G.cops = []; G.heli = null; G.evade = 0;
    p.car.color = randomPick(G.rng, CONFIG.cars[p.car.type].colors);
    addFloater(shop.x, shop.y - 30, 'RESPRAY — HEAT CLEARED -$200', '#7aff5a');
    playGameSound('pickup', 0.6);
  }
  // Gun shop: walk in to buy a pistol and ammo.
  const gun = G.world.shops.find((s) => s.kind === 'gunshop');
  if (gun && !p.car && Math.hypot(p.x - gun.x, p.y - gun.y) < 60 && G.cash >= 500 && p.weapon !== 'pistol') {
    G.cash -= 500; p.weapon = 'pistol'; p.ammo = 60;
    addFloater(gun.x, gun.y - 30, 'P9 PISTOL BOUGHT -$500', '#ffd23a');
    playGameSound('pickup', 0.6);
  }
}
function startSolmarinaFare(ped) {
  ped.waiting = false;
  const dest = randomPick(G.rng, [[1290, 1290], [2470, 600], [580, 1980], [1980, 2200], [1060, 1060]]);
  G.fare = { ped, dest, timer: 75 };
  G.hint = 'Taxi fare: take the passenger to the marker';
  playGameSound('pickup', 0.5);
}
function nearestSolmarinaRace(x, y) {
  for (const r of CONFIG.races) {
    if (Math.hypot(r.start[0] - x, r.start[1] - y) < 70) return r;
  }
  return null;
}
function startSolmarinaRace(race) {
  G.race = { name: race.name, points: race.points, next: 0, timer: 0, par: race.par };
  G.hint = 'Race started: ' + race.name + ' — hit every checkpoint';
  playGameSound('mission', 0.5);
}
