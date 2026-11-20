// Boot and the main loop for Solmarina: state machine, camera, menu
// actions, and the per-frame update order. This file glues the systems
// together; each system lives in its own file.
let G = null;
function bootSolmarinaGame() {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const params = new URLSearchParams(window.location.search);
  const seed = parseInt(params.get('seed') || '1', 10) || 1;
  G = {
    canvas, ctx, seed, rng: seededRandom(seed * 1000 + 7),
    time: 0, frame: 0, state: 'title', prevState: 'play',
    world: null, cars: [], peds: [], cops: [], particles: [], skids: [], floaters: [],
    player: { x: 830, y: 830, angle: 0, moving: false, car: null, health: 100, armor: 0, weapon: 'fists', ammo: 0, fireCooldown: 0 },
    camera: { x: 1300, y: 1300, zoom: 1 }, cameraZoom: 1,
    input: createInputState(canvas),
    audio: { ctx: null, master: null, volume: 0.8, muted: false, musicStep: 0, musicBeat: 0 },
    radio: 0, cash: 200, wanted: 0, evade: 0, heli: null, roadblock: false,
    mission: null, missionKills: 0, lastMissionId: 0, marker: null,
    objective: 'Visit Zola\'s Diner for work', hint: '', dialog: null, dialogQueue: [],
    fare: null, race: null, vigilanteTarget: null,
    stats: { missions: 0, missionsDone: [], cashEarned: 0, carsStolen: 0, fares: 0, packages: 0, bestStunt: 0, playTime: 0 },
    shake: 0, damageFlash: 0, gunfireAt: null, gunfireAtTime: 0,
    bustedReason: '', passText: '', failText: '', endingText: '', menuButtons: [], shot: null,
  };
  window.SOLMARINA = G;
  G.world = generateSolmarinaWorld(seed);
  resetSolmarinaActors();
  const shot = params.get('shot');
  if (shot) {
    stageSolmarinaShot(shot);
    G.camera.x = G.player.x; G.camera.y = G.player.y;
    G.camera.zoom = G.cameraZoom;
  }
  canvas.addEventListener('pointerdown', ensureSolmarinaAudio);
  window.addEventListener('keydown', ensureSolmarinaAudio, { once: false });
  requestAnimationFrame(runSolmarinaLoop);
}
function resetSolmarinaActors() {
  G.cars = []; G.peds = []; G.cops = [];
  const spots = [
    ['sedan', 830, 1000, 1.57], ['coupe', 1060, 1200, 4.71], ['muscle', 1520, 830, 0],
    ['van', 1980, 1060, 3.14], ['taxi', 1290, 1750, 1.57], ['sedan', 1750, 1520, 0],
    ['coupe', 600, 900, 1.57], ['sedan', 2210, 1290, 4.71], ['muscle', 830, 1980, 0],
    ['taxi', 1980, 2210, 1.57], ['sedan', 1290, 2210, 0], ['van', 1060, 370, 4.71],
  ];
  for (const s of spots) spawnSolmarinaCar(s[0], s[1], s[2], s[3], 'parked');
  for (let i = 0; i < 14; i++) spawnSolmarinaTrafficCar();
  for (let i = 0; i < 24; i++) spawnSolmarinaPed();
}
function newSolmarinaGame() {
  const keepStats = { missions: 0, missionsDone: [], cashEarned: 0, carsStolen: 0, fares: 0, packages: 0, bestStunt: 0, playTime: 0 };
  G.stats = keepStats;
  G.cash = 200; G.wanted = 0; G.evade = 0; G.heli = null; G.cops = [];
  G.player.x = 830; G.player.y = 830; G.player.health = 100; G.player.armor = 0;
  G.player.weapon = 'fists'; G.player.ammo = 0; G.player.car = null;
  G.fare = null; G.race = null; G.vigilanteTarget = null; G.marker = null;
  G.camera.x = 830; G.camera.y = 830;
  resetSolmarinaActors();
  G.state = 'play';
  startSolmarinaMission(1);
}
function continueSolmarinaGame() {
  const data = loadSolmarinaGame();
  if (!data) { newSolmarinaGame(); return; }
  resetSolmarinaActors();
  applySolmarinaSave(data);
  G.state = 'play';
  G.objective = 'Free roam — visit Zola\'s Diner for the next job';
  const next = (G.stats.missionsDone || []).length + 1;
  if (next <= 6 && !G.mission) startSolmarinaMission(next);
}
function respawnSolmarinaPlayer() {
  G.player.x = 830; G.player.y = 830; G.player.health = 100; G.player.armor = 50;
  G.player.car = null; G.wanted = 0; G.cops = []; G.heli = null;
  G.camera.x = 830; G.camera.y = 830;
  G.state = 'play';
  G.objective = 'Free roam — visit Zola\'s Diner for the next job';
}
function handleSolmarinaMenu(action) {
  if (action === 'new') newSolmarinaGame();
  else if (action === 'continue') continueSolmarinaGame();
  else if (action === 'howto') { G.prevState = G.state; G.state = 'howto'; }
  else if (action === 'title') { G.state = 'title'; }
  else if (action === 'resume') { G.state = G.prevState === 'play' ? 'play' : 'play'; }
  else if (action === 'map') { G.prevState = 'play'; G.state = 'map'; }
  else if (action === 'stats') { G.prevState = G.state; G.state = 'stats'; }
  else if (action === 'mute') { G.audio.muted = !G.audio.muted; if (G.audio.master) G.audio.master.gain.value = G.audio.muted ? 0 : G.audio.volume; }
  else if (action === 'endcard') {
    if (G.state === 'busted' || G.state === 'wasted') respawnSolmarinaPlayer();
    else if (G.state === 'missionpass') {
      G.state = 'play';
      const next = G.lastMissionId + 1;
      if (next <= 6) startSolmarinaMission(next);
    } else if (G.state === 'missionfail') {
      G.state = 'play';
      if (G.lastMissionId >= 1) startSolmarinaMission(G.lastMissionId);
    } else if (G.state === 'ending') { G.state = 'play'; }
  }
}
function runSolmarinaLoop(t) {
  requestAnimationFrame(runSolmarinaLoop);
  if (!G) return;
  const now = t || 0;
  const dt = G.lastT ? Math.min(0.05, Math.max(0.001, (now - G.lastT) / 1000)) : 0.016;
  G.lastT = now;
  G.time += dt;
  G.frame++;
  if (G.state === 'play') G.stats.playTime += dt;
  G.damageFlash = Math.max(0, G.damageFlash - dt);
  // Menu clicks.
  if (G.input.mousePressed) {
    for (const b of G.menuButtons) {
      if (G.input.mouseX >= b.x && G.input.mouseX <= b.x + b.w && G.input.mouseY >= b.y && G.input.mouseY <= b.y + b.h) {
        handleSolmarinaMenu(b.action);
        break;
      }
    }
  }
  // Global keys.
  if (inputPressed(G.input, 'KeyP') || inputPressed(G.input, 'Escape')) {
    if (G.state === 'play') { G.prevState = 'play'; G.state = 'pause'; }
    else if (G.state === 'pause') G.state = 'play';
    else if (G.state === 'map' || G.state === 'stats') G.state = 'play';
  }
  if (inputPressed(G.input, 'KeyM')) {
    if (G.state === 'play') { G.prevState = 'play'; G.state = 'map'; }
    else if (G.state === 'map') G.state = 'play';
  }
  if (G.state === 'title' && (inputPressed(G.input, 'Enter') || inputPressed(G.input, 'Space'))) newSolmarinaGame();
  if (G.state === 'play') {
    updateRioPlayer(dt);
    updateSolmarinaTraffic(dt);
    updateSolmarinaPedestrians(dt);
    updateSolmarinaPolice(dt);
    updateSolmarinaCombat(dt);
    updateSolmarinaMissions(dt);
    updateSolmarinaActivities(dt);
    updateSolmarinaEffects(dt);
    updateSolmarinaAudio(dt);
    // Camera follows Rio, with a lookahead in the direction of travel.
    const focus = G.player.car || G.player;
    const look = G.player.car ? Math.min(120, Math.abs(G.player.car.speed) * 0.25) : 40;
    const tx = focus.x + Math.cos(G.player.angle) * look;
    const ty = focus.y + Math.sin(G.player.angle) * look;
    G.camera.x += (tx - G.camera.x) * Math.min(1, dt * 4);
    G.camera.y += (ty - G.camera.y) * Math.min(1, dt * 4);
    G.camera.zoom += (G.cameraZoom - G.camera.zoom) * Math.min(1, dt * 2);
  } else if (G.state === 'title') {
    // Slow cinematic pan over Neon Mile for the title backdrop.
    G.camera.x = 1300 + Math.cos(G.time * 0.08) * 260;
    G.camera.y = 1300 + Math.sin(G.time * 0.08) * 260;
    G.camera.zoom = 0.85;
    updateSolmarinaEffects(dt);
  }
  drawSolmarinaWorld(G.ctx);
  drawSolmarinaHud(G.ctx);
  inputEndFrame(G.input);
}
document.addEventListener('DOMContentLoaded', bootSolmarinaGame);
