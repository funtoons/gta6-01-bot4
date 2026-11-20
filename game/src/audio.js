// Synthesized sound for Solmarina: WebAudio only, no audio files. The
// audio context starts on the first user gesture; every effect is an
// oscillator or a noise burst, and the three radio stations are simple
// step-sequenced chord patterns.
function playGameSound(name, vol) {
  const A = G.audio;
  if (!A || !A.ctx || A.muted) return;
  const v = (vol === undefined ? 0.5 : vol) * A.volume;
  const t = A.ctx.currentTime;
  if (name === 'gunshot') {
    const len = 0.14, buf = A.ctx.createBuffer(1, A.ctx.sampleRate * len, A.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const src = A.ctx.createBufferSource(); src.buffer = buf;
    const g = A.ctx.createGain(); g.gain.value = v;
    src.connect(g); g.connect(A.master); src.start(t);
  } else if (name === 'punch' || name === 'thud') {
    const o = A.ctx.createOscillator(), g = A.ctx.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(140, t);
    o.frequency.exponentialRampToValueAtTime(50, t + 0.12);
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
    o.connect(g); g.connect(A.master); o.start(t); o.stop(t + 0.15);
  } else if (name === 'pickup') {
    [660, 880, 1320].forEach((f, i) => {
      const o = A.ctx.createOscillator(), g = A.ctx.createGain();
      o.type = 'triangle'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t + i * 0.07);
      g.gain.exponentialRampToValueAtTime(v * 0.6, t + i * 0.07 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.07 + 0.22);
      o.connect(g); g.connect(A.master); o.start(t + i * 0.07); o.stop(t + i * 0.07 + 0.25);
    });
  } else if (name === 'mission') {
    [523, 659, 784, 1046].forEach((f, i) => {
      const o = A.ctx.createOscillator(), g = A.ctx.createGain();
      o.type = 'square'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t + i * 0.11);
      g.gain.exponentialRampToValueAtTime(v * 0.25, t + i * 0.11 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.11 + 0.3);
      o.connect(g); g.connect(A.master); o.start(t + i * 0.11); o.stop(t + i * 0.11 + 0.32);
    });
  } else if (name === 'fail') {
    [330, 262, 196].forEach((f, i) => {
      const o = A.ctx.createOscillator(), g = A.ctx.createGain();
      o.type = 'sawtooth'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t + i * 0.16);
      g.gain.exponentialRampToValueAtTime(v * 0.2, t + i * 0.16 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.16 + 0.35);
      o.connect(g); g.connect(A.master); o.start(t + i * 0.16); o.stop(t + i * 0.16 + 0.4);
    });
  } else if (name === 'crash') {
    const len = 0.3, buf = A.ctx.createBuffer(1, A.ctx.sampleRate * len, A.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2);
    const src = A.ctx.createBufferSource(); src.buffer = buf;
    const flt = A.ctx.createBiquadFilter(); flt.type = 'lowpass'; flt.frequency.value = 900;
    const g = A.ctx.createGain(); g.gain.value = v;
    src.connect(flt); flt.connect(g); g.connect(A.master); src.start(t);
  }
}
function ensureSolmarinaAudio() {
  const A = G.audio;
  if (A.ctx) { if (A.ctx.state === 'suspended') A.ctx.resume(); return; }
  try {
    A.ctx = new (window.AudioContext || window.webkitAudioContext)();
    A.master = A.ctx.createGain(); A.master.gain.value = A.volume; A.master.connect(A.ctx.destination);
    A.engine = A.ctx.createOscillator(); A.engine.type = 'sawtooth'; A.engine.frequency.value = 60;
    A.engineGain = A.ctx.createGain(); A.engineGain.gain.value = 0;
    const flt = A.ctx.createBiquadFilter(); flt.type = 'lowpass'; flt.frequency.value = 420;
    A.engine.connect(flt); flt.connect(A.engineGain); A.engineGain.connect(A.master);
    A.engine.start();
    A.siren = A.ctx.createOscillator(); A.siren.type = 'sine'; A.siren.frequency.value = 700;
    A.sirenGain = A.ctx.createGain(); A.sirenGain.gain.value = 0;
    A.siren.connect(A.sirenGain); A.sirenGain.connect(A.master); A.siren.start();
  } catch (e) { A.ctx = null; }
}
function updateSolmarinaAudio(dt) {
  const A = G.audio;
  if (!A || !A.ctx || A.muted) return;
  const speed = G.player.car ? Math.abs(G.player.car.speed) : 0;
  if (A.engineGain) A.engineGain.gain.value = G.player.car ? 0.02 + speed / 9000 : 0;
  if (A.engine) A.engine.frequency.value = 55 + speed * 0.35;
  const sirenOn = G.wanted > 0 && G.cops.length > 0;
  if (A.sirenGain) A.sirenGain.gain.value = sirenOn ? 0.035 : 0;
  if (sirenOn && A.siren) A.siren.frequency.value = (Math.floor(G.time * 2.4) % 2 === 0) ? 660 : 880;
  // Radio: a tiny step sequencer, one chord pattern per station.
  A.musicStep = (A.musicStep || 0) + dt;
  if (A.musicStep > 0.42) {
    A.musicStep = 0;
    A.musicBeat = ((A.musicBeat || 0) + 1) % 16;
    const chords = [[220, 277, 330], [174, 220, 262], [196, 247, 294], [146, 220, 293]];
    const chord = chords[Math.floor(A.musicBeat / 4) % 4];
    const f = chord[A.musicBeat % 3] * (G.radio === 2 ? 1.5 : 1);
    const o = A.ctx.createOscillator(), g = A.ctx.createGain();
    o.type = G.radio === 1 ? 'triangle' : 'sawtooth'; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, A.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.028 * A.volume, A.ctx.currentTime + 0.03);
    g.gain.exponentialRampToValueAtTime(0.001, A.ctx.currentTime + 0.4);
    o.connect(g); g.connect(A.master); o.start(); o.stop(A.ctx.currentTime + 0.42);
  }
}
