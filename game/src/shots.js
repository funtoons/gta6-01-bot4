// Screenshot staging for Solmarina: each ?shot= name sets up a genuine,
// reachable game state and lets the normal loop render it. Nothing here
// draws a picture by hand — the render loop does all the drawing.
function stageSolmarinaShot(name) {
  const p = G.player;
  G.shot = name;
  G.state = 'play';
  if (name === 'chase') {
    // One frame, the whole chase: four-star heat, helicopter, traffic.
    const car = spawnSolmarinaCar('muscle', 1520, 1520, 0, 'player');
    car.speed = 300; car.color = '#c83828'; car.damage = -500;
    p.car = car; p.x = car.x; p.y = car.y; p.armor = 100;
    G.wanted = 4; G.evade = 0;
    G.cameraZoom = 1.18;
    const spots = [[1380, 1440, 0.4], [1660, 1600, -0.3], [1420, 1660, 0.2], [1700, 1400, -0.5]];
    for (const s of spots) {
      const pc = spawnSolmarinaCar('police', s[0], s[1], s[2], 'police');
      pc.speed = 280;
      G.cops.push({ kind: 'car', car: pc, name: randomPick(G.rng, CONFIG.dispatchNames), status: 'PURSUIT' });
    }
    G.heli = { x: p.x + 160, y: p.y - 190 };
    G.cops[0].status = 'SPOTLIGHT'; G.cops[1].status = 'RAMMING'; G.cops[2].status = 'ROADBLOCK';
    const tspots = [[1600, 1520], [1440, 1520], [1520, 1440], [1520, 1600], [1660, 1520], [1380, 1520]];
    for (const t of tspots) {
      const tc = spawnSolmarinaCar(randomPick(G.rng, ['sedan', 'coupe', 'taxi', 'van']), t[0], t[1], randomPick(G.rng, [0, 1.57, 3.14]), 'traffic');
      tc.speed = 120;
    }
    const burn = spawnSolmarinaCar('sedan', 1750, 1520, 0, 'parked');
    burn.burning = true; burn.burnTime = 5; burn.damage = 80;
    G.objective = 'Escape the 4-star chase — reach Sunshine Spray';
    G.marker = { x: 1060, y: 1980, r: 80 };
    showSolmarinaDialog('Mama Zola', 'Rio, four stars! Lose them at Sunshine Spray — and do not stop!');
    G.cash = 12450;
  } else if (name === 'street') {
    // On foot in Neon Mile, in the middle of the crowd.
    p.x = 1290; p.y = 1290; p.car = null;
    G.cameraZoom = 1.1;
    for (let i = 0; i < 18; i++) {
      const px = 1290 + (G.rng() - 0.5) * 420, py = 1290 + (G.rng() - 0.5) * 420;
      if (solmarinaHitsBuilding(px, py, 10)) continue;
      G.peds.push({
        x: px, y: py,
        angle: randomPick(G.rng, [0, 1.57, 3.14, 4.71]), speed: randomRange(G.rng, 40, 80),
        color: randomPick(G.rng, ['#e07820', '#3a7ab8', '#b83a7a', '#3a8a5a', '#c8a83a']),
        bubble: i === 2 ? 'Sunset in Solmarina!' : null, bubbleTime: 3,
        fleeing: false, waiting: false, health: 40, gang: false, cop: false, moving: true,
      });
    }
    const pc = spawnSolmarinaCar('police', 1520, 1290, 3.14, 'police');
    pc.speed = 200;
    G.cops.push({ kind: 'car', car: pc, name: 'Unit 7', status: 'PATROL' });
    G.wanted = 0;
    G.objective = 'Walk to Zola\'s Diner';
    G.marker = { x: 1290, y: 1290, r: 70 };
    showSolmarinaDialog('Rio Calloway', 'Neon Mile never sleeps. Zola is waiting — and so is my debt.');
    G.cash = 3200;
  } else if (name === 'mission') {
    // Harbor Heat, mid-fight at the Gulls warehouse.
    p.x = 1900; p.y = 810; p.car = null;
    p.weapon = 'pistol'; p.ammo = 48; p.armor = 60;
    G.cameraZoom = 1.35;
    spawnSolmarinaGang(1960, 810, 5);
    spawnExplosion(2080, 780, false);
    const mc = spawnSolmarinaCar('muscle', 1960, 860, 0.5, 'parked');
    mc.burning = true; mc.burnTime = 5; mc.damage = 80;
    const mc2 = spawnSolmarinaCar('sedan', 2050, 720, 0, 'parked');
    mc2.burning = true; mc2.burnTime = 5; mc2.damage = 80;
    G.wanted = 3;
    const pc = spawnSolmarinaCar('police', 1750, 810, 0, 'police');
    pc.speed = 240;
    G.cops.push({ kind: 'car', car: pc, name: 'Unit 12', status: 'PURSUIT' });
    G.mission = { id: 5, name: 'Harbor Heat', step: 1, def: CONFIG.missions[4], timer: 0, collected: 0, started: G.time };
    G.missionKills = 2;
    G.objective = 'Clear the warehouse crew (2/5)';
    G.marker = { x: 2050, y: 810, r: 90 };
    showSolmarinaDialog('Vic Marlowe', 'You picked the wrong warehouse, Rio. Boys — take him down!');
    G.cash = 8750;
  } else if (name === 'stats') {
    // The career stats screen over the city, with a played career behind it.
    G.state = 'stats';
    G.stats.missions = 5; G.stats.missionsDone = [1, 2, 3, 4, 5];
    G.stats.cashEarned = 18400; G.cash = 12650;
    G.stats.carsStolen = 12; G.stats.fares = 6; G.stats.packages = 9;
    G.stats.bestStunt = 42; G.stats.playTime = 3720;
    saveSolmarinaGame();
    p.x = 1290; p.y = 1290;
  }
}
