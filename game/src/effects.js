// Particles, skid marks, floating texts and screen shake for Solmarina.
// Everything here is drawn by the render loop from live game state.
function spawnExplosion(x, y, big) {
  const n = big ? 46 : 26;
  for (let i = 0; i < n; i++) {
    const a = G.rng() * Math.PI * 2, sp = 40 + G.rng() * (big ? 320 : 180);
    G.particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.5 + G.rng() * 0.7, max: 1.2, size: 3 + G.rng() * 7, color: ['#ffdd55', '#ff8822', '#ff4422', '#888888'][Math.floor(G.rng() * 4)], glow: true });
  }
  G.shake = Math.max(G.shake, big ? 14 : 8);
  playGameSound('crash', 0.7);
}
function spawnSparks(x, y, n) {
  for (let i = 0; i < (n || 8); i++) {
    const a = G.rng() * Math.PI * 2, sp = 120 + G.rng() * 220;
    G.particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.2 + G.rng() * 0.25, max: 0.45, size: 2 + G.rng() * 2, color: '#ffdd88', glow: true });
  }
}
function spawnSmoke(x, y, n) {
  for (let i = 0; i < (n || 6); i++) {
    G.particles.push({ x: x + (G.rng() - 0.5) * 20, y: y + (G.rng() - 0.5) * 20, vx: (G.rng() - 0.5) * 30, vy: -20 - G.rng() * 30, life: 0.6 + G.rng() * 0.8, max: 1.4, size: 6 + G.rng() * 10, color: '#999999', glow: false });
  }
}
function spawnMuzzleFlash(x, y, angle) {
  G.particles.push({ x: x + Math.cos(angle) * 18, y: y + Math.sin(angle) * 18, vx: 0, vy: 0, life: 0.07, max: 0.07, size: 16, color: '#ffee88', glow: true });
}
function addFloater(x, y, text, color) {
  G.floaters.push({ x, y, text, color: color || '#ffffff', life: 1.6 });
}
function updateSolmarinaEffects(dt) {
  for (let i = G.particles.length - 1; i >= 0; i--) {
    const p = G.particles[i];
    p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.96; p.vy *= 0.96;
    if (p.life <= 0) G.particles.splice(i, 1);
  }
  for (let i = G.floaters.length - 1; i >= 0; i--) {
    const f = G.floaters[i];
    f.life -= dt; f.y -= 28 * dt;
    if (f.life <= 0) G.floaters.splice(i, 1);
  }
  for (let i = G.skids.length - 1; i >= 0; i--) {
    G.skids[i].life -= dt;
    if (G.skids[i].life <= 0) G.skids.splice(i, 1);
  }
  G.shake = Math.max(0, G.shake - dt * 30);
}
