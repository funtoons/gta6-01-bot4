// The Solmarina HUD, minimap and menus: wanted stars, cash, speed,
// dispatch panel, weapon slots, subtitles with portraits, and every menu
// screen. All of it is drawn on the canvas from live game state.
function drawSolmarinaHud(ctx) {
  G.menuButtons = [];
  if (G.state === 'title') { drawSolmarinaTitle(ctx); return; }
  if (G.state === 'howto') { drawSolmarinaHowTo(ctx); return; }
  if (G.state === 'map') { drawSolmarinaMapScreen(ctx); return; }
  if (G.state === 'stats') { drawSolmarinaStatsScreen(ctx); return; }
  drawSolmarinaMarker(ctx);
  drawSolmarinaObjective(ctx);
  drawSolmarinaWanted(ctx);
  drawSolmarinaCash(ctx);
  drawSolmarinaHealth(ctx);
  drawSolmarinaDispatch(ctx);
  drawSolmarinaSpeed(ctx);
  drawSolmarinaMinimap(ctx);
  drawSolmarinaSubtitles(ctx);
  drawSolmarinaDistrict(ctx);
  if (G.damageFlash > 0) {
    ctx.fillStyle = 'rgba(200, 0, 0, ' + (G.damageFlash * 0.4) + ')';
    ctx.fillRect(0, 0, 1280, 720);
  }
  if (G.state === 'pause') drawSolmarinaPause(ctx);
  if (G.state === 'busted') drawSolmarinaEndCard(ctx, 'BUSTED', G.bustedReason || '', 'Respawn');
  if (G.state === 'wasted') drawSolmarinaEndCard(ctx, 'WASTED', 'You woke up at Solmarina General — $500 hospital bill', 'Respawn');
  if (G.state === 'missionpass') drawSolmarinaEndCard(ctx, 'MISSION PASSED', G.passText || '', 'Continue');
  if (G.state === 'missionfail') drawSolmarinaEndCard(ctx, 'MISSION FAILED', G.failText || '', 'Retry mission');
  if (G.state === 'ending') drawSolmarinaEndCard(ctx, 'PAYDAY', G.endingText || '', 'Keep playing');
}
function solmarinaPanel(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(12, 12, 20, 0.72)';
  ctx.beginPath(); ctx.roundRect(x, y, w, h, 10); ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)'; ctx.lineWidth = 1; ctx.stroke();
}
function solmarinaButton(ctx, x, y, w, h, label, action) {
  const hover = G.input.mouseX >= x && G.input.mouseX <= x + w && G.input.mouseY >= y && G.input.mouseY <= y + h;
  ctx.fillStyle = hover ? 'rgba(255, 180, 60, 0.9)' : 'rgba(30, 30, 44, 0.85)';
  ctx.beginPath(); ctx.roundRect(x, y, w, h, 8); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.stroke();
  ctx.fillStyle = hover ? '#1a1a1a' : '#ffffff';
  ctx.font = 'bold 17px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText(label, x + w / 2, y + h / 2 + 6);
  G.menuButtons.push({ x, y, w, h, action });
}
function drawSolmarinaMarker(ctx) {
  if (!G.marker) return;
  const cam = G.camera;
  const sx = 640 + (G.marker.x - cam.x) * cam.zoom;
  const sy = 360 + (G.marker.y - cam.y) * cam.zoom;
  const pulse = 26 + Math.sin(G.time * 4) * 5;
  ctx.strokeStyle = '#ffd23a'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.arc(sx, sy, pulse, 0, 6.29); ctx.stroke();
  ctx.fillStyle = '#ffd23a';
  ctx.beginPath(); ctx.moveTo(sx, sy - 34); ctx.lineTo(sx - 9, sy - 16); ctx.lineTo(sx + 9, sy - 16); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(255, 210, 58, 0.5)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(sx, sy, pulse + 12, 0, 6.29); ctx.stroke();
}
function drawSolmarinaObjective(ctx) {
  if (!G.objective) return;
  solmarinaPanel(ctx, 16, 86, 420, 44);
  ctx.fillStyle = '#ffd23a'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'left';
  ctx.fillText('OBJECTIVE', 30, 104);
  ctx.fillStyle = '#ffffff'; ctx.font = '15px sans-serif';
  ctx.fillText(G.objective.slice(0, 52), 30, 124);
  if (G.hint) {
    ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.font = '13px sans-serif';
    ctx.fillText(G.hint.slice(0, 60), 30, 148);
  }
}
function drawSolmarinaWanted(ctx) {
  solmarinaPanel(ctx, 16, 14, 220, 62);
  ctx.fillStyle = '#ffffff'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'left';
  ctx.fillText('WANTED', 30, 32);
  for (let i = 0; i < 5; i++) {
    ctx.font = '26px sans-serif';
    ctx.fillStyle = i < G.wanted ? '#ffd23a' : 'rgba(255,255,255,0.25)';
    ctx.fillText('★', 30 + i * 30, 60);
  }
  if (G.wanted > 0 && G.evade > 0.5) {
    ctx.fillStyle = '#7aff5a'; ctx.font = 'bold 12px sans-serif';
    ctx.fillText('EVADING ' + Math.ceil(8 - G.evade) + 's', 190, 32);
  }
}
function drawSolmarinaCash(ctx) {
  solmarinaPanel(ctx, 1044, 14, 220, 62);
  ctx.fillStyle = '#7aff5a'; ctx.font = 'bold 24px sans-serif'; ctx.textAlign = 'right';
  ctx.fillText('$' + G.cash.toLocaleString('en-US'), 1250, 42);
  ctx.fillStyle = '#ffffff'; ctx.font = '13px sans-serif';
  const mins = 17 * 60 + 30 + Math.floor(G.time / 60);
  const hh = String(Math.floor(mins / 60) % 24).padStart(2, '0');
  const mm = String(mins % 60).padStart(2, '0');
  ctx.fillText(hh + ':' + mm + '  •  ' + CONFIG.radioStations[G.radio], 1250, 64);
}
function drawSolmarinaHealth(ctx) {
  solmarinaPanel(ctx, 16, 164, 220, 64);
  ctx.fillStyle = '#ffffff'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'left';
  ctx.fillText('HEALTH', 30, 182);
  ctx.fillStyle = '#333'; ctx.fillRect(30, 188, 150, 8);
  ctx.fillStyle = '#3aff5a'; ctx.fillRect(30, 188, 150 * Math.max(0, G.player.health) / 100, 8);
  ctx.fillStyle = '#ffffff'; ctx.fillText('ARMOR', 30, 210);
  ctx.fillStyle = '#333'; ctx.fillRect(30, 216, 150, 6);
  ctx.fillStyle = '#5aaaff'; ctx.fillRect(30, 216, 150 * Math.max(0, G.player.armor) / 100, 6);
}
function drawSolmarinaDispatch(ctx) {
  if (G.wanted === 0) return;
  const units = G.cops.slice(0, 5);
  const h = 34 + units.length * 24;
  solmarinaPanel(ctx, 1024, 86, 240, h);
  ctx.fillStyle = '#ff7070'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'left';
  ctx.fillText('SCPD DISPATCH', 1038, 108);
  units.forEach((c, i) => {
    const t = c.kind === 'car' ? c.car : c.ped;
    const d = t ? Math.round(Math.hypot(t.x - G.player.x, t.y - G.player.y)) : 0;
    let status = c.status || 'PURSUIT';
    if (G.heli && i === 0) status = 'SPOTLIGHT';
    if (G.roadblock && i === 1) status = 'ROADBLOCK';
    if (c.kind === 'car' && c.car && d < 60) status = 'RAMMING';
    ctx.fillStyle = '#ffffff'; ctx.font = '13px sans-serif';
    ctx.fillText(c.name + ' — ' + status, 1038, 132 + i * 24);
    ctx.fillStyle = '#ffd23a'; ctx.textAlign = 'right';
    ctx.fillText(d + 'm', 1250, 132 + i * 24);
    ctx.textAlign = 'left';
  });
}
function drawSolmarinaSpeed(ctx) {
  const p = G.player;
  if (!p.car) {
    solmarinaPanel(ctx, 1094, 620, 170, 84);
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('ON FOOT', 1110, 642);
    drawSolmarinaWeaponSlots(ctx, 1110, 656);
    return;
  }
  solmarinaPanel(ctx, 1094, 620, 170, 84);
  ctx.fillStyle = '#ffffff'; ctx.font = 'bold 34px sans-serif'; ctx.textAlign = 'right';
  ctx.fillText(String(Math.round(Math.abs(p.car.speed) * 0.36)), 1230, 656);
  ctx.font = '12px sans-serif'; ctx.fillStyle = '#ffd23a';
  ctx.fillText('km/h', 1252, 656);
  ctx.font = '13px sans-serif'; ctx.fillStyle = '#ffffff'; ctx.textAlign = 'left';
  const def = CONFIG.cars[p.car.type];
  ctx.fillText(def ? def.name : p.car.type, 1110, 674);
  drawSolmarinaWeaponSlots(ctx, 1110, 682);
}
function drawSolmarinaWeaponSlots(ctx, x, y) {
  const slots = [{ key: 'fists', label: 'FISTS' }, { key: 'pistol', label: 'PISTOL' }];
  slots.forEach((s, i) => {
    const bx = x + i * 78;
    ctx.fillStyle = G.player.weapon === s.key ? 'rgba(255, 210, 58, 0.85)' : 'rgba(255,255,255,0.16)';
    ctx.beginPath(); ctx.roundRect(bx, y, 70, 20, 5); ctx.fill();
    ctx.fillStyle = G.player.weapon === s.key ? '#1a1a1a' : '#ffffff';
    ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
    const ammo = s.key === 'pistol' ? ' ' + G.player.ammo : '';
    ctx.fillText(s.label + ammo, bx + 35, y + 14);
  });
}
function drawSolmarinaMinimap(ctx) {
  const size = 180, ox = 16, oy = 508, scale = size / CONFIG.worldSize;
  solmarinaPanel(ctx, ox - 6, oy - 6, size + 12, size + 12);
  ctx.save();
  ctx.beginPath(); ctx.rect(ox, oy, size, size); ctx.clip();
  ctx.fillStyle = '#20242c'; ctx.fillRect(ox, oy, size, size);
  for (const d of CONFIG.districts) {
    ctx.fillStyle = d.ground; ctx.fillRect(ox + d.x0 * scale, oy + d.y0 * scale, (d.x1 - d.x0) * scale, (d.y1 - d.y0) * scale);
  }
  ctx.strokeStyle = '#e8e4d8'; ctx.lineWidth = 2;
  for (const rx of G.world.roads) { ctx.beginPath(); ctx.moveTo(ox + rx * scale, oy); ctx.lineTo(ox + rx * scale, oy + size); ctx.stroke(); }
  for (const ry of G.world.roads) { ctx.beginPath(); ctx.moveTo(ox, oy + ry * scale); ctx.lineTo(ox + size, oy + ry * scale); ctx.stroke(); }
  ctx.fillStyle = '#ffd23a';
  for (const pkg of G.world.packages) if (!pkg.taken) ctx.fillRect(ox + pkg.x * scale - 1, oy + pkg.y * scale - 1, 3, 3);
  ctx.fillStyle = '#7aff5a';
  for (const s of G.world.shops) ctx.fillRect(ox + s.x * scale - 2, oy + s.y * scale - 2, 4, 4);
  ctx.fillStyle = '#ff4040';
  for (const c of G.cops) {
    const t = c.kind === 'car' ? c.car : c.ped;
    if (t) ctx.fillRect(ox + t.x * scale - 2, oy + t.y * scale - 2, 5, 5);
  }
  if (G.marker) {
    ctx.fillStyle = '#ffd23a';
    ctx.beginPath(); ctx.arc(ox + G.marker.x * scale, oy + G.marker.y * scale, 5, 0, 6.29); ctx.fill();
  }
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(ox + G.player.x * scale, oy + G.player.y * scale, 5, 0, 6.29); ctx.fill();
  ctx.strokeStyle = '#000'; ctx.stroke();
  ctx.restore();
  ctx.fillStyle = '#ffffff'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'left';
  ctx.fillText('SOLMARINA', ox, oy - 12);
}
function drawSolmarinaSubtitles(ctx) {
  if (!G.dialog || G.time > G.dialog.until) return;
  solmarinaPanel(ctx, 340, 640, 600, 64);
  ctx.fillStyle = '#c83828';
  ctx.beginPath(); ctx.arc(372, 672, 20, 0, 6.29); ctx.fill();
  ctx.fillStyle = '#ffffff'; ctx.font = 'bold 15px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText(G.dialog.speaker[0], 372, 677);
  ctx.fillStyle = '#ffd23a'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'left';
  ctx.fillText(G.dialog.speaker.toUpperCase(), 402, 662);
  ctx.fillStyle = '#ffffff'; ctx.font = '14px sans-serif';
  wrapSolmarinaText(ctx, G.dialog.text, 402, 680, 520, 17);
}
function wrapSolmarinaText(ctx, text, x, y, maxW, lh) {
  const words = text.split(' ');
  let line = '', yy = y;
  for (const w of words) {
    if (ctx.measureText(line + w).width > maxW) { ctx.fillText(line, x, yy); line = ''; yy += lh; }
    line += w + ' ';
  }
  ctx.fillText(line, x, yy);
}
function drawSolmarinaDistrict(ctx) {
  const d = solmarinaDistrictAt(G.player.x, G.player.y);
  ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText(d.name.toUpperCase(), 640, 30);
  const rank = CONFIG.respectRanks[Math.min(4, Math.floor(G.stats.missions / 2))];
  ctx.fillStyle = '#ffd23a'; ctx.font = 'bold 12px sans-serif';
  ctx.fillText('RESPECT: ' + rank.toUpperCase(), 640, 50);
}
function drawSolmarinaTitle(ctx) {
  ctx.fillStyle = 'rgba(20, 8, 30, 0.45)'; ctx.fillRect(0, 0, 1280, 720);
  ctx.fillStyle = '#ffd23a'; ctx.font = 'bold 92px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('SOLMARINA', 640, 210);
  ctx.fillStyle = '#ffffff'; ctx.font = 'bold 24px sans-serif';
  ctx.fillText('An open-world crime story — sun, sea, and a $50,000 debt', 640, 252);
  ctx.font = '16px sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fillText('Rio Calloway is back in town. Mama Zola has work. The Gulls want him gone.', 640, 282);
  solmarinaButton(ctx, 520, 330, 240, 48, 'NEW GAME', 'new');
  if (solmarinaHasSave()) solmarinaButton(ctx, 520, 390, 240, 48, 'CONTINUE', 'continue');
  solmarinaButton(ctx, 520, 450, 240, 48, 'HOW TO PLAY', 'howto');
  ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.font = '14px sans-serif';
  ctx.fillText('WASD drive & walk  •  E enter car  •  Mouse aim, click shoot  •  M map  •  P pause', 640, 540);
  ctx.fillText('An original game. Not affiliated with Rockstar Games.', 640, 566);
}
function drawSolmarinaHowTo(ctx) {
  ctx.fillStyle = 'rgba(20, 8, 30, 0.55)'; ctx.fillRect(0, 0, 1280, 720);
  solmarinaPanel(ctx, 340, 90, 600, 520);
  ctx.fillStyle = '#ffd23a'; ctx.font = 'bold 28px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('HOW TO PLAY', 640, 140);
  ctx.fillStyle = '#ffffff'; ctx.font = '16px sans-serif'; ctx.textAlign = 'left';
  const lines = [
    'W A S D / Arrows — walk and drive', 'Mouse — aim, Click — shoot / punch',
    'E — enter or exit a car, talk, start jobs', 'Space — handbrake (skid)',
    'Shift — sprint on foot', 'R — change radio station',
    'M — world map', 'P / Esc — pause menu',
    '', 'Earn cash from missions, taxi fares, races and',
    'vigilante work. Spend it on respray and weapons.',
    'Lose the cops by breaking line of sight, or pay',
    'for a respray at Sunshine Spray.',
  ];
  lines.forEach((l, i) => ctx.fillText(l, 380, 180 + i * 26));
  solmarinaButton(ctx, 540, 540, 200, 44, 'BACK', 'title');
}
function drawSolmarinaPause(ctx) {
  ctx.fillStyle = 'rgba(10, 10, 20, 0.6)'; ctx.fillRect(0, 0, 1280, 720);
  ctx.fillStyle = '#ffd23a'; ctx.font = 'bold 44px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('PAUSED', 640, 150);
  solmarinaButton(ctx, 520, 190, 240, 46, 'RESUME', 'resume');
  solmarinaButton(ctx, 520, 246, 240, 46, 'WORLD MAP', 'map');
  solmarinaButton(ctx, 520, 302, 240, 46, 'STATS', 'stats');
  solmarinaButton(ctx, 520, 358, 240, 46, 'MUSIC: ' + (G.audio.muted ? 'OFF' : 'ON'), 'mute');
  solmarinaButton(ctx, 520, 414, 240, 46, 'QUIT TO TITLE', 'title');
}
function drawSolmarinaMapScreen(ctx) {
  ctx.fillStyle = 'rgba(10, 10, 20, 0.85)'; ctx.fillRect(0, 0, 1280, 720);
  const size = 560, ox = 360, oy = 70, scale = size / CONFIG.worldSize;
  ctx.fillStyle = '#20242c'; ctx.fillRect(ox, oy, size, size);
  for (const d of CONFIG.districts) {
    ctx.fillStyle = d.ground; ctx.fillRect(ox + d.x0 * scale, oy + d.y0 * scale, (d.x1 - d.x0) * scale, (d.y1 - d.y0) * scale);
  }
  ctx.strokeStyle = '#e8e4d8'; ctx.lineWidth = 3;
  for (const rx of G.world.roads) { ctx.beginPath(); ctx.moveTo(ox + rx * scale, oy); ctx.lineTo(ox + rx * scale, oy + size); ctx.stroke(); }
  for (const ry of G.world.roads) { ctx.beginPath(); ctx.moveTo(ox, oy + ry * scale); ctx.lineTo(ox + size, oy + ry * scale); ctx.stroke(); }
  ctx.fillStyle = '#ffffff'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'left';
  for (const s of G.world.shops) { ctx.fillStyle = '#7aff5a'; ctx.fillRect(ox + s.x * scale - 3, oy + s.y * scale - 3, 6, 6); ctx.fillStyle = '#fff'; ctx.fillText(s.name, ox + s.x * scale + 8, oy + s.y * scale + 4); }
  if (G.marker) { ctx.fillStyle = '#ffd23a'; ctx.beginPath(); ctx.arc(ox + G.marker.x * scale, oy + G.marker.y * scale, 8, 0, 6.29); ctx.fill(); }
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(ox + G.player.x * scale, oy + G.player.y * scale, 7, 0, 6.29); ctx.fill();
  ctx.fillStyle = '#ffd23a'; ctx.font = 'bold 26px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('SOLMARINA — WORLD MAP', 640, 40);
  solmarinaButton(ctx, 540, 660, 200, 44, 'CLOSE', 'resume');
}
function drawSolmarinaStatsScreen(ctx) {
  ctx.fillStyle = 'rgba(10, 10, 20, 0.85)'; ctx.fillRect(0, 0, 1280, 720);
  solmarinaPanel(ctx, 340, 80, 600, 540);
  ctx.fillStyle = '#ffd23a'; ctx.font = 'bold 30px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('RIO CALLOWAY — CAREER STATS', 640, 130);
  ctx.fillStyle = '#ffffff'; ctx.font = '17px sans-serif'; ctx.textAlign = 'left';
  const rows = [
    ['Missions completed', G.stats.missions + ' / 6'],
    ['Cash earned', '$' + G.stats.cashEarned.toLocaleString('en-US')],
    ['Cash on hand', '$' + G.cash.toLocaleString('en-US')],
    ['Cars stolen', String(G.stats.carsStolen)],
    ['Taxi fares', String(G.stats.fares)],
    ['Hidden packages', G.stats.packages + ' / 20'],
    ['Best stunt', String(G.stats.bestStunt) + ' m air'],
    ['Time played', Math.floor(G.stats.playTime / 60) + ' min'],
    ['Save slot', solmarinaHasSave() ? 'Slot 1 — Solmarina' : 'Empty'],
  ];
  rows.forEach((r, i) => {
    ctx.fillText(r[0], 390, 180 + i * 40);
    ctx.textAlign = 'right'; ctx.fillStyle = '#ffd23a';
    ctx.fillText(r[1], 890, 180 + i * 40);
    ctx.textAlign = 'left'; ctx.fillStyle = '#ffffff';
  });
  ctx.fillStyle = '#ffffff'; ctx.font = '15px sans-serif';
  ctx.fillText('Story: ' + (G.stats.missionsDone || []).map((id) => CONFIG.missions[id - 1].name).join('  •  '), 390, 560);
  solmarinaButton(ctx, 540, 660, 200, 44, 'CLOSE', 'resume');
}
function drawSolmarinaEndCard(ctx, title, text, buttonLabel) {
  ctx.fillStyle = 'rgba(10, 10, 20, 0.72)'; ctx.fillRect(0, 0, 1280, 720);
  ctx.fillStyle = title === 'WASTED' || title === 'BUSTED' ? '#ff5050' : '#ffd23a';
  ctx.font = 'bold 64px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText(title, 640, 300);
  ctx.fillStyle = '#ffffff'; ctx.font = '19px sans-serif';
  ctx.fillText(text, 640, 350);
  solmarinaButton(ctx, 540, 400, 200, 48, buttonLabel, 'endcard');
}
