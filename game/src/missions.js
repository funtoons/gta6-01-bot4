// Story missions: six jobs from Mama Zola against Big Alonzo's debt and
// the Gulls crew. Each mission is a list of steps; the engine below runs
// any step type, so a mission is data, not a special case.
function startSolmarinaMission(id) {
  const def = CONFIG.missions.find((m) => m.id === id);
  if (!def) return;
  G.mission = { id: def.id, name: def.name, step: 0, def, timer: 0, collected: 0, started: G.time };
  G.missionKills = 0;
  G.lastMissionId = id;
  // Mission props: the marked car for a steal job, Zola's car for the drive.
  if (id === 1) spawnSolmarinaCar('coupe', 1330, 1330, 0, 'parked');
  if (id === 2) spawnSolmarinaCar('muscle', 1980, 580, 0, 'parked');
  if (id === 6) spawnSolmarinaCar('van', 2120, 580, 0, 'parked');
  showSolmarinaDialog('Mama Zola', def.briefing);
  G.objective = def.steps[0].text;
  playGameSound('mission', 0.5);
  G.hint = 'Mission started: ' + def.name;
}
function updateSolmarinaMissions(dt) {
  const M = G.mission;
  if (!M) return;
  const step = M.def.steps[M.step];
  if (!step) { completeSolmarinaMission(); return; }
  const p = G.player;
  if (step.type === 'goto' || step.type === 'drive' || step.type === 'timed' || step.type === 'steal') {
    const tx = step.x, ty = step.y;
    const px = p.car ? p.car.x : p.x, py = p.car ? p.car.y : p.y;
    const d = Math.hypot(tx - px, ty - py);
    G.marker = { x: tx, y: ty, r: step.r || 80 };
    if (step.type === 'timed') {
      if (!M.timer) M.timer = step.seconds;
      M.timer -= dt;
      G.objective = step.text + ' — ' + Math.max(0, Math.ceil(M.timer)) + 's';
      if (M.timer <= 0 && d > (step.r || 80)) { failSolmarinaMission('Too slow — the drop missed its window'); return; }
    } else {
      G.objective = step.text;
    }
    if (d < (step.r || 80)) {
      if (step.type === 'steal') {
        const car = nearestSolmarinaCar(tx, ty, 120);
        if (car && car.driver === 'player') { advanceSolmarinaMission(); return; }
        G.objective = step.text + ' — get in the marked car';
        G.marker = { x: tx, y: ty, r: 120 };
        return;
      }
      advanceSolmarinaMission();
    }
  } else if (step.type === 'collect') {
    G.objective = step.text.replace(/\(\d+\/\d+\)/, '(' + M.collected + '/' + step.count + ')');
    const spots = step.spots || [];
    const spot = spots[Math.min(M.collected, spots.length - 1)];
    if (spot) G.marker = { x: spot[0], y: spot[1], r: step.r || 70 };
    const px = p.car ? p.car.x : p.x, py = p.car ? p.car.y : p.y;
    if (spot && Math.hypot(spot[0] - px, spot[1] - py) < (step.r || 70)) {
      M.collected++;
      G.cash += 300; G.stats.cashEarned += 300;
      addFloater(px, py - 30, '+$300 DEBT COLLECTED', '#ffd23a');
      playGameSound('pickup', 0.6);
      if (M.collected >= step.count) advanceSolmarinaMission();
    }
  } else if (step.type === 'fight') {
    G.objective = step.text.replace(/\(\d+\/\d+\)/, '(' + (G.missionKills || 0) + '/' + step.count + ')');
    G.marker = null;
    if ((G.missionKills || 0) >= step.count) advanceSolmarinaMission();
  } else if (step.type === 'loseheat') {
    G.objective = step.text + ' — wanted ' + G.wanted + ' ★';
    if (G.wanted === 0) advanceSolmarinaMission();
  } else if (step.type === 'survive') {
    if (!M.timer) M.timer = step.seconds;
    M.timer -= dt;
    G.objective = step.text.replace(/\(\d+s\)/, '(' + Math.max(0, Math.ceil(M.timer)) + 's)');
    G.objective = step.text + ' — ' + Math.max(0, Math.ceil(M.timer)) + 's left';
    if (M.timer <= 0) advanceSolmarinaMission();
  }
}
function advanceSolmarinaMission() {
  const M = G.mission;
  M.step++; M.timer = 0; M.collected = 0; G.missionKills = 0;
  if (M.step >= M.def.steps.length) { completeSolmarinaMission(); return; }
  G.objective = M.def.steps[M.step].text;
  if (M.def.steps[M.step].type === 'fight') {
    const gx = M.def.id === 5 ? 2050 : G.player.x + 120;
    const gy = M.def.id === 5 ? 810 : G.player.y;
    spawnSolmarinaGang(gx, gy, M.def.steps[M.step].count);
  }
  playGameSound('pickup', 0.5);
}
function completeSolmarinaMission() {
  const M = G.mission;
  G.lastMissionId = M.id;
  G.cash += M.def.reward; G.stats.cashEarned += M.def.reward;
  G.stats.missions++;
  G.stats.missionsDone = G.stats.missionsDone || [];
  G.stats.missionsDone.push(M.id);
  showSolmarinaDialog('Mama Zola', 'Job done, Rio. $' + M.def.reward + ' is yours. The debt is getting smaller.');
  playGameSound('mission', 0.7);
  G.mission = null; G.marker = null; G.objective = 'Free roam — visit Zola\'s Diner for the next job';
  G.state = 'missionpass';
  G.passText = M.name + ' COMPLETE — $' + M.def.reward;
  saveSolmarinaGame();
  if (M.id === 6) {
    G.state = 'ending';
    G.endingText = 'PAYDAY — the debt is cleared. Solmarina is yours, Rio.';
  }
}
function failSolmarinaMission(reason) {
  G.mission = null; G.marker = null;
  G.state = 'missionfail';
  G.failText = reason;
  playGameSound('fail', 0.7);
}
function showSolmarinaDialog(speaker, text) {
  G.dialog = { speaker, text, until: G.time + 6 };
  G.dialogQueue = G.dialogQueue || [];
}
