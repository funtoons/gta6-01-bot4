// The Solmarina renderer: camera, sunset palette, long evening shadows,
// pseudo-height buildings, cars, pedestrians, the police helicopter with
// its spotlight, and the additive glow pass. Every pixel on screen comes
// from the live game state — screenshots are real renders of this loop.
function drawSolmarinaWorld(ctx) {
  const cam = G.camera;
  const sx = (G.shake > 0 ? (G.rng() - 0.5) * G.shake : 0);
  const sy = (G.shake > 0 ? (G.rng() - 0.5) * G.shake : 0);
  ctx.save();
  ctx.translate(640, 360);
  ctx.scale(cam.zoom, cam.zoom);
  ctx.translate(-cam.x + sx, -cam.y + sy);
  drawSolmarinaGround(ctx);
  drawSolmarinaRoads(ctx);
  drawSolmarinaProps(ctx);
  drawSolmarinaBuildings(ctx);
  drawSolmarinaSkids(ctx);
  for (const car of G.cars) drawSolmarinaCar(ctx, car);
  for (const ped of G.peds) drawSolmarinaPed(ctx, ped);
  drawSolmarinaPlayer(ctx);
  if (G.heli) drawSolmarinaHeli(ctx, G.heli);
  drawSolmarinaParticles(ctx);
  drawSolmarinaFloaters(ctx);
  ctx.restore();
  drawSolmarinaSunset(ctx);
}
function drawSolmarinaGround(ctx) {
  const S = CONFIG.worldSize;
  ctx.fillStyle = '#a8895a'; ctx.fillRect(-80, -80, S + 160, S + 160);
  for (const d of CONFIG.districts) {
    ctx.fillStyle = d.ground; ctx.fillRect(d.x0, d.y0, d.x1 - d.x0, d.y1 - d.y0);
  }
  // Bayside beach and the sea beyond it, with a moving shimmer.
  ctx.fillStyle = '#e8d49a'; ctx.fillRect(2350, 140, 150, S - 280);
  ctx.fillStyle = '#2a7a9a'; ctx.fillRect(2500, 140, 100, S - 280);
  ctx.fillStyle = '#3a9aba';
  for (let y = 180; y < S - 140; y += 46) {
    const off = Math.sin(G.time * 1.4 + y * 0.05) * 8;
    ctx.fillRect(2510 + off, y, 70, 4);
  }
  // Parks: green squares with a path.
  ctx.fillStyle = '#7a9a4a';
  ctx.fillRect(580, 580, 120, 120); ctx.fillRect(1980, 1520, 120, 120); ctx.fillRect(830, 1980, 120, 90);
}
function drawSolmarinaRoads(ctx) {
  const rw = CONFIG.roadWidth, S = CONFIG.worldSize;
  ctx.fillStyle = '#3c3a44';
  for (const rx of G.world.roads) ctx.fillRect(rx - rw / 2, 0, rw, S);
  for (const ry of G.world.roads) ctx.fillRect(0, ry - rw / 2, S, rw);
  // Sidewalks and crosswalks.
  ctx.fillStyle = '#8a8478';
  for (const rx of G.world.roads) { ctx.fillRect(rx - rw / 2 - 10, 0, 10, S); ctx.fillRect(rx + rw / 2, 0, 10, S); }
  for (const ry of G.world.roads) { ctx.fillRect(0, ry - rw / 2 - 10, S, 10); ctx.fillRect(0, ry + rw / 2, S, 10); }
  ctx.fillStyle = '#e8e4d8';
  for (const ix of G.world.intersections) {
    for (let k = -2; k <= 2; k++) {
      ctx.fillRect(ix.x - 22 + k * 10, ix.y - rw / 2 - 4, 6, 8);
      ctx.fillRect(ix.x - 22 + k * 10, ix.y + rw / 2 - 4, 6, 8);
    }
  }
  // Centre dashes, warm in the sunset.
  ctx.fillStyle = '#d8b84a';
  for (const rx of G.world.roads) for (let y = 40; y < S; y += 56) ctx.fillRect(rx - 2, y, 4, 26);
  for (const ry of G.world.roads) for (let x = 40; x < S; x += 56) ctx.fillRect(x, ry - 2, 26, 4);
  // Traffic lights.
  for (const L of G.world.lights) {
    const st = solmarinaLightState(L);
    ctx.fillStyle = '#222222'; ctx.fillRect(L.x - 5, L.y - 34, 10, 22);
    ctx.fillStyle = st === 'v' ? '#3aff5a' : '#ff3a3a'; ctx.beginPath(); ctx.arc(L.x, L.y - 27, 4, 0, 6.29); ctx.fill();
    ctx.fillStyle = st === 'h' ? '#3aff5a' : '#ff3a3a'; ctx.beginPath(); ctx.arc(L.x, L.y - 17, 4, 0, 6.29); ctx.fill();
  }
}
function drawSolmarinaProps(ctx) {
  for (const p of G.world.palms) {
    ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 4 * p.s;
    ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + 4 * p.s, p.y - 16 * p.s); ctx.stroke();
    ctx.fillStyle = '#3a8a3a';
    for (let k = 0; k < 5; k++) {
      const a = k * 1.26 + 0.4;
      ctx.beginPath(); ctx.ellipse(p.x + 4 * p.s + Math.cos(a) * 10 * p.s, p.y - 16 * p.s + Math.sin(a) * 6 * p.s, 12 * p.s, 4 * p.s, a, 0, 6.29); ctx.fill();
    }
  }
  for (const L of G.world.lamps) {
    ctx.strokeStyle = '#4a4a4a'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(L.x, L.y); ctx.lineTo(L.x, L.y - 18); ctx.stroke();
    drawSolmarinaGlow(ctx, L.x, L.y - 20, 16, 'rgba(255, 200, 90, 0.5)');
    ctx.fillStyle = '#ffdd88'; ctx.beginPath(); ctx.arc(L.x, L.y - 20, 3, 0, 6.29); ctx.fill();
  }
  for (const b of G.world.billboards) {
    ctx.fillStyle = '#2a2a30'; ctx.fillRect(b.x - 60, b.y - 44, 120, 34);
    ctx.fillStyle = '#ff9a3a'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(b.text, b.x, b.y - 24);
    ctx.fillStyle = '#4a4a4a'; ctx.fillRect(b.x - 4, b.y - 10, 8, 22);
  }
  for (const pr of G.world.props) {
    if (pr.kind === 'fountain') {
      ctx.fillStyle = '#5a9ac8'; ctx.beginPath(); ctx.arc(pr.x, pr.y, pr.r, 0, 6.29); ctx.fill();
      ctx.fillStyle = '#8ac8e8'; ctx.beginPath(); ctx.arc(pr.x, pr.y, pr.r * 0.6, 0, 6.29); ctx.fill();
    } else if (pr.kind === 'stadium') {
      ctx.fillStyle = '#3a7a4a'; ctx.fillRect(pr.x - pr.w / 2, pr.y - pr.h / 2, pr.w, pr.h);
      ctx.strokeStyle = '#e8e8e8'; ctx.lineWidth = 3; ctx.strokeRect(pr.x - pr.w / 2, pr.y - pr.h / 2, pr.w, pr.h);
    }
  }
  for (const b of G.world.boats) {
    ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.a);
    ctx.fillStyle = '#e8e8e8'; ctx.fillRect(-16, -6, 32, 12);
    ctx.fillStyle = '#c83828'; ctx.fillRect(-6, -4, 10, 8);
    ctx.restore();
  }
  for (const r of G.world.ramps) {
    ctx.save(); ctx.translate(r.x, r.y); ctx.rotate(r.a);
    ctx.fillStyle = '#e07820'; ctx.fillRect(-22, -14, 44, 28);
    ctx.fillStyle = '#ffd23a'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('JUMP', 0, 4);
    ctx.restore();
  }
}
function drawSolmarinaBuildings(ctx) {
  // Long evening shadows first, then side faces and roofs (painter order).
  const list = G.world.buildings.slice().sort((a, b) => (a.y + a.h) - (b.y + b.h));
  ctx.fillStyle = 'rgba(40, 20, 10, 0.35)';
  for (const b of list) {
    ctx.beginPath();
    ctx.moveTo(b.x - b.hgt * 0.55, b.y + b.h + b.hgt * 0.3);
    ctx.lineTo(b.x + b.w - b.hgt * 0.55, b.y + b.h + b.hgt * 0.3);
    ctx.lineTo(b.x + b.w, b.y + b.h); ctx.lineTo(b.x, b.y + b.h);
    ctx.closePath(); ctx.fill();
  }
  for (const b of list) {
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.fillRect(b.x, b.y + b.h, b.w, b.hgt * 0.35);
    ctx.fillStyle = b.roof;
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    ctx.fillRect(b.x, b.y, b.w, 6);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(b.x + 6, b.y + 6, 10, 8); ctx.fillRect(b.x + b.w - 18, b.y + b.h - 14, 12, 8);
    ctx.fillStyle = '#ffd23a';
    for (let wx = b.x + 10; wx < b.x + b.w - 8; wx += 18) {
      for (let wy = b.y + 14; wy < b.y + b.h - 8; wy += 18) ctx.fillRect(wx, wy, 7, 9);
    }
  }
}
function drawSolmarinaSkids(ctx) {
  ctx.strokeStyle = 'rgba(20,20,20,0.55)'; ctx.lineWidth = 4;
  for (const s of G.skids) {
    ctx.globalAlpha = Math.max(0, s.life / 6);
    ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x + Math.cos(s.a) * 22, s.y + Math.sin(s.a) * 22); ctx.stroke();
  }
  ctx.globalAlpha = 1;
}
function drawSolmarinaCar(ctx, car) {
  ctx.save(); ctx.translate(car.x, car.y); ctx.rotate(car.angle);
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(-22, -10, 46, 24);
  const def = CONFIG.cars[car.type] || CONFIG.cars.sedan;
  ctx.fillStyle = car.color || def.colors[0];
  ctx.beginPath(); ctx.roundRect(-23, -11, 46, 22, 6); ctx.fill();
  ctx.fillStyle = 'rgba(180,220,255,0.75)'; ctx.fillRect(-6, -9, 14, 18);
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(-19, -12, 8, 5); ctx.fillRect(-19, 7, 8, 5); ctx.fillRect(11, -12, 8, 5); ctx.fillRect(11, 7, 8, 5);
  if (car.type === 'taxi') { ctx.fillStyle = '#222'; ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('TAXI', 0, 3); }
  if (car.type === 'police') {
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 8px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('SCPD', 0, 3);
    const flash = Math.floor(G.time * 6) % 2 === 0;
    drawSolmarinaGlow(ctx, -2, -11, 14, flash ? 'rgba(255,40,40,0.7)' : 'rgba(40,80,255,0.7)');
    ctx.fillStyle = flash ? '#ff3030' : '#3050ff';
    ctx.fillRect(-6, -13, 12, 4);
  }
  if (car.burning) { drawSolmarinaGlow(ctx, 0, 0, 20, 'rgba(255,120,30,0.45)'); }
  if (car.damage > 60) { ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(-23, -11, 12, 22); }
  ctx.restore();
  if (car === G.player.car) {
    ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(car.x, car.y, 34, 0, 6.29); ctx.stroke();
  }
}
function drawSolmarinaPed(ctx, ped) {
  const bob = ped.moving ? Math.sin(G.time * 10 + ped.x) * 2 : 0;
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath(); ctx.ellipse(ped.x + 3, ped.y + 8, 7, 3, 0, 0, 6.29); ctx.fill();
  ctx.fillStyle = ped.color;
  ctx.beginPath(); ctx.arc(ped.x, ped.y + bob, 7, 0, 6.29); ctx.fill();
  ctx.fillStyle = '#e8b88a'; ctx.beginPath(); ctx.arc(ped.x, ped.y - 9 + bob, 5, 0, 6.29); ctx.fill();
  if (ped.cop) {
    ctx.fillStyle = '#20242c'; ctx.fillRect(ped.x - 7, ped.y - 4 + bob, 14, 10);
    ctx.fillStyle = '#3050ff'; ctx.fillRect(ped.x - 7, ped.y - 4 + bob, 14, 3);
  }
  if (ped.bubble) {
    const bw = ctx.measureText(ped.bubble).width + 18;
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.beginPath(); ctx.roundRect(ped.x - bw / 2, ped.y - 40 + bob, bw, 18, 8); ctx.fill();
    ctx.fillStyle = '#222'; ctx.font = '9px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(ped.bubble, ped.x, ped.y - 28 + bob);
  }
}
function drawSolmarinaPlayer(ctx) {
  const p = G.player;
  if (p.car) return;
  const bob = p.moving ? Math.sin(G.time * 12) * 2 : 0;
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath(); ctx.ellipse(p.x + 4, p.y + 9, 8, 3, 0, 0, 6.29); ctx.fill();
  ctx.fillStyle = '#c83828';
  ctx.beginPath(); ctx.arc(p.x, p.y + bob, 8, 0, 6.29); ctx.fill();
  ctx.fillStyle = '#e8b88a'; ctx.beginPath(); ctx.arc(p.x, p.y - 10 + bob, 6, 0, 6.29); ctx.fill();
  ctx.fillStyle = '#222'; ctx.fillRect(p.x - 6, p.y - 16 + bob, 12, 3);
  ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(p.x, p.y, 20, 0, 6.29); ctx.stroke();
}
function drawSolmarinaHeli(ctx, heli) {
  ctx.save(); ctx.translate(heli.x, heli.y); ctx.scale(1.3, 1.3);
  // Spotlight cone onto the player.
  const px = (G.player.x - heli.x) / 1.3, py = (G.player.y - heli.y) / 1.3;
  const grad = ctx.createLinearGradient(0, 0, px, py);
  grad.addColorStop(0, 'rgba(255, 250, 200, 0.6)'); grad.addColorStop(1, 'rgba(255, 250, 200, 0.12)');
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.moveTo(-8, 6); ctx.lineTo(px - 40, py - 30); ctx.lineTo(px + 40, py + 30); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255,250,200,0.4)';
  ctx.beginPath(); ctx.ellipse(px, py, 46, 34, 0, 0, 6.29); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(4, 8, 22, 9, 0, 0, 6.29); ctx.fill();
  ctx.fillStyle = '#20242c'; ctx.beginPath(); ctx.ellipse(0, 0, 20, 9, 0, 0, 6.29); ctx.fill();
  ctx.fillStyle = '#8ac8e8'; ctx.beginPath(); ctx.ellipse(10, 0, 7, 5, 0, 0, 6.29); ctx.fill();
  ctx.strokeStyle = '#888'; ctx.lineWidth = 3;
  const ra = G.time * 22;
  ctx.beginPath(); ctx.moveTo(Math.cos(ra) * 30, Math.sin(ra) * 4); ctx.lineTo(-Math.cos(ra) * 30, -Math.sin(ra) * 4); ctx.stroke();
  ctx.restore();
}
function drawSolmarinaParticles(ctx) {
  for (const p of G.particles) {
    const a = Math.max(0, p.life / p.max);
    if (p.glow) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (0.5 + a), 0, 6.29); ctx.fill();
      ctx.restore();
    } else {
      ctx.globalAlpha = a * 0.6; ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, 6.29); ctx.fill();
      ctx.globalAlpha = 1;
    }
  }
}
function drawSolmarinaFloaters(ctx) {
  ctx.font = 'bold 15px sans-serif'; ctx.textAlign = 'center';
  for (const f of G.floaters) {
    ctx.globalAlpha = Math.max(0, f.life / 1.6);
    ctx.fillStyle = f.color; ctx.fillText(f.text, f.x, f.y);
  }
  ctx.globalAlpha = 1;
}
function drawSolmarinaGlow(ctx, x, y, r, color) {
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(x, y, r, 0, 6.29); ctx.fill();
  ctx.restore();
}
function drawSolmarinaSunset(ctx) {
  // Golden-hour wash plus a vignette: the whole city sits in one sunset.
  const g = ctx.createLinearGradient(0, 0, 0, 720);
  g.addColorStop(0, 'rgba(255, 140, 60, 0.10)');
  g.addColorStop(0.6, 'rgba(255, 110, 80, 0.05)');
  g.addColorStop(1, 'rgba(120, 40, 120, 0.10)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 1280, 720);
  const v = ctx.createRadialGradient(640, 360, 300, 640, 360, 720);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(20,0,30,0.28)');
  ctx.fillStyle = v; ctx.fillRect(0, 0, 1280, 720);
}
