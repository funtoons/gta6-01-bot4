// City generation for Solmarina: a seeded road grid, blocks with
// pseudo-height buildings, districts, props, traffic lights and the road
// graph the traffic drives on. The same seed always builds the same city.
function generateSolmarinaWorld(seed) {
  const rng = seededRandom(seed);
  const S = CONFIG.worldSize, gap = CONFIG.roadGap, rw = CONFIG.roadWidth;
  const roads = [];
  for (let i = 0; i <= 10; i++) roads.push(140 + i * gap);
  const world = {
    size: S, roads, buildings: [], props: [], palms: [], lamps: [],
    lights: [], intersections: [], boats: [], ramps: [], shops: [],
    packages: [], billboards: [], rng,
  };
  for (let i = 0; i < roads.length; i++) for (let j = 0; j < roads.length; j++) {
    world.intersections.push({ x: roads[i], y: roads[j] });
    if ((i + j) % 2 === 0) world.lights.push({ x: roads[i], y: roads[j] });
  }
  // Buildings: one to three per block, with a roof colour from the district.
  for (let i = 0; i < roads.length - 1; i++) for (let j = 0; j < roads.length - 1; j++) {
    const x0 = roads[i] + rw / 2 + 14, x1 = roads[i + 1] - rw / 2 - 14;
    const y0 = roads[j] + rw / 2 + 14, y1 = roads[j + 1] - rw / 2 - 14;
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    if (i === 5 && j === 5) { world.props.push({ kind: 'fountain', x: cx, y: cy, r: 46 }); continue; }
    if (i === 2 && j === 8) { world.props.push({ kind: 'stadium', x: cx, y: cy, w: 150, h: 110 }); continue; }
    const n = randomInt(rng, 1, 3);
    for (let k = 0; k < n; k++) {
      const bw = randomRange(rng, 46, Math.max(50, (x1 - x0) / n - 12));
      const bh = randomRange(rng, 40, Math.max(44, (y1 - y0) / n - 12));
      const bx = x0 + ((x1 - x0) / n) * k + randomRange(rng, 4, 14);
      const by = y0 + randomRange(rng, 4, Math.max(6, (y1 - y0) - bh - 8));
      const d = solmarinaDistrictAt(cx, cy);
      world.buildings.push({
        x: bx, y: by, w: Math.min(bw, x1 - bx - 6), h: Math.min(bh, y1 - by - 6),
        hgt: randomRange(rng, 22, 96), roof: randomPick(rng, d.roofs),
      });
    }
  }
  // Props: palms along Bayside beach and parks, lamps along roads, billboards.
  for (let k = 0; k < 90; k++) {
    const x = randomRange(rng, 2380, 2560), y = randomRange(rng, 200, 2400);
    world.palms.push({ x, y, s: randomRange(rng, 0.8, 1.3) });
  }
  for (let k = 0; k < 40; k++) {
    world.palms.push({ x: randomRange(rng, 200, 2400), y: randomRange(rng, 200, 2400), s: randomRange(rng, 0.7, 1.1) });
  }
  for (const rx of roads) for (let y = 220; y < S; y += 460) {
    world.lamps.push({ x: rx + rw / 2 + 8, y });
    world.lamps.push({ x: rx - rw / 2 - 8, y: y + 230 });
  }
  world.billboards = [
    { x: 1300, y: 1060, text: 'SOLMARINA SUNSET CRUISE' },
    { x: 1060, y: 1520, text: 'NEON MILE — EAT. PLAY. STAY.' },
    { x: 1980, y: 1290, text: 'PORTO VERDE FISH MARKET' },
    { x: 580, y: 1060, text: 'PALM COURT GOLF CLUB' },
  ];
  for (let k = 0; k < 7; k++) world.boats.push({ x: randomRange(rng, 2530, 2580), y: randomRange(rng, 300, 2300), a: randomRange(rng, 0, 6.28) });
  world.ramps = [{ x: 1750, y: 2200, a: 0 }, { x: 600, y: 1520, a: 0 }, { x: 2200, y: 1060, a: 0 }];
  world.shops = [
    { kind: 'respray', name: 'Sunshine Spray', x: 1060, y: 1980 },
    { kind: 'gunshop', name: 'Iron & Sons', x: 1520, y: 600 },
    { kind: 'safehouse', name: 'Rio\'s Safehouse', x: 830, y: 830 },
    { kind: 'diner', name: 'Zola\'s Diner', x: 1290, y: 1290 },
    { kind: 'chopshop', name: 'Chop Shop', x: 700, y: 1980 },
  ];
  // Twenty hidden packages, scattered deterministically.
  const prng = seededRandom(seed + 77);
  for (let k = 0; k < CONFIG.packages; k++) {
    world.packages.push({ x: randomRange(prng, 220, 2400), y: randomRange(prng, 220, 2400), taken: false });
  }
  return world;
}
function solmarinaDistrictAt(x, y) {
  for (const d of CONFIG.districts) {
    if (x >= d.x0 && x < d.x1 && y >= d.y0 && y < d.y1) return d;
  }
  return CONFIG.districts[0];
}
function solmarinaHitsBuilding(x, y, r) {
  const W = G.world;
  for (const b of W.buildings) {
    if (x + r > b.x && x - r < b.x + b.w && y + r > b.y && y - r < b.y + b.h) return b;
  }
  return null;
}
function solmarinaOnRoad(x, y) {
  const rw = CONFIG.roadWidth / 2;
  for (const rx of G.world.roads) if (Math.abs(x - rx) <= rw) return true;
  for (const ry of G.world.roads) if (Math.abs(y - ry) <= rw) return true;
  return false;
}
function solmarinaLightState(light) {
  // Six-second cycle: vertical green, then horizontal green.
  const phase = Math.floor(G.time / 6) % 2;
  return phase === 0 ? 'v' : 'h';
}
function solmarinaResolveCircle(x, y, r) {
  // Push a circle out of buildings; returns corrected {x, y, hit}.
  const b = solmarinaHitsBuilding(x, y, r);
  if (!b) return { x, y, hit: false };
  const dxl = (x + r) - b.x, dxr = (b.x + b.w) - (x - r);
  const dyt = (y + r) - b.y, dyb = (b.y + b.h) - (y - r);
  const m = Math.min(dxl, dxr, dyt, dyb);
  if (m === dxl) x = b.x - r; else if (m === dxr) x = b.x + b.w + r;
  else if (m === dyt) y = b.y - r; else y = b.y + b.h + r;
  return { x, y, hit: true };
}
