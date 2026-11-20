// Saving Solmarina: one localStorage slot with cash, mission progress,
// stats and Rio's position. Continue on the title screen restores it.
function saveSolmarinaGame() {
  try {
    const data = {
      cash: G.cash, missions: G.stats.missions, missionsDone: G.stats.missionsDone || [],
      cashEarned: G.stats.cashEarned, carsStolen: G.stats.carsStolen, fares: G.stats.fares,
      packages: G.stats.packages, bestStunt: G.stats.bestStunt, playTime: G.stats.playTime,
      x: G.player.x, y: G.player.y, health: G.player.health, weapon: G.player.weapon, ammo: G.player.ammo,
    };
    window.localStorage.setItem('solmarina-save-v1', JSON.stringify(data));
    return true;
  } catch (e) { return false; }
}
function loadSolmarinaGame() {
  try {
    const raw = window.localStorage.getItem('solmarina-save-v1');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) { return null; }
}
function solmarinaHasSave() {
  try { return !!window.localStorage.getItem('solmarina-save-v1'); } catch (e) { return false; }
}
function applySolmarinaSave(data) {
  G.cash = data.cash; G.stats.missions = data.missions;
  G.stats.missionsDone = data.missionsDone || [];
  G.stats.cashEarned = data.cashEarned || 0;
  G.stats.carsStolen = data.carsStolen || 0;
  G.stats.fares = data.fares || 0;
  G.stats.packages = data.packages || 0;
  G.stats.bestStunt = data.bestStunt || 0;
  G.stats.playTime = data.playTime || 0;
  G.player.x = data.x; G.player.y = data.y;
  G.player.health = data.health || 100;
  G.player.weapon = data.weapon || 'fists';
  G.player.ammo = data.ammo || 0;
  // Restore collected packages so the counter stays honest.
  for (let i = 0; i < Math.min(G.stats.packages, G.world.packages.length); i++) G.world.packages[i].taken = true;
}
