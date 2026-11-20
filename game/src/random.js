// Seeded random numbers for Solmarina: the city, the traffic and the shot
// staging all come from one seed, so the same seed always builds the same
// city and the same screenshots.
function seededRandom(seed) {
  let a = seed >>> 0;
  return function nextRandom() {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function randomRange(rng, lo, hi) { return lo + rng() * (hi - lo); }
function randomPick(rng, list) { return list[Math.floor(rng() * list.length)]; }
function randomInt(rng, lo, hi) { return lo + Math.floor(rng() * (hi - lo + 1)); }
