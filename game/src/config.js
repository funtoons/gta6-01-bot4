// Solmarina city data: districts, vehicles, weapons and the six story
// missions. Every string the player reads is English; the city, people and
// crew names are original. This file only holds data — the systems that use
// it live in the other src files.
function solmarinaConfig() {
  return {
    worldSize: 2600,
    roadGap: 230,
    roadWidth: 64,
    seed: 1,
    districts: [
      { name: 'Neon Mile', x0: 900, y0: 900, x1: 1750, y1: 1750, ground: '#b98a4e', roofs: ['#7a4a6e', '#4a5a8a', '#8a3a4a', '#3a6a7a'] },
      { name: 'Porto Verde', x0: 1750, y0: 350, x1: 2350, y1: 1250, ground: '#a8895a', roofs: ['#6a5a4a', '#5a6a7a', '#7a6a3a'] },
      { name: 'Palm Court', x0: 350, y0: 350, x1: 900, y1: 900, ground: '#9aa860', roofs: ['#c8a878', '#a88868', '#b89090'] },
      { name: 'The Yards', x0: 350, y0: 1750, x1: 1100, y1: 2350, ground: '#8a7a5e', roofs: ['#5e5a55', '#6e5a4a', '#4a4a52'] },
      { name: 'Sunnyside', x0: 1100, y0: 1750, x1: 2100, y1: 2350, ground: '#b39a68', roofs: ['#c07858', '#7898a8', '#a8a078'] },
      { name: 'Bayside', x0: 2350, y0: 350, x1: 2600, y1: 2350, ground: '#e0c890', roofs: ['#d8b088', '#c89878'] },
    ],
    cars: {
      sedan: { name: 'Meridian Sedan', top: 340, accel: 260, grip: 2.6, colors: ['#c8c8d0', '#5a7ab8', '#b85a5a', '#3a3a44'] },
      coupe: { name: 'Vela Coupe', top: 400, accel: 320, grip: 2.9, colors: ['#e0b83a', '#d83a5a', '#2a2a30', '#e8e8e8'] },
      muscle: { name: 'Bravado Muscle', top: 380, accel: 360, grip: 2.3, colors: ['#c83828', '#282828', '#3a6a3a', '#e07820'] },
      van: { name: 'Cargo Van', top: 280, accel: 200, grip: 2.2, colors: ['#d8d8d8', '#6a8a9a', '#b8a05a'] },
      taxi: { name: 'Sol Cab', top: 330, accel: 270, grip: 2.6, colors: ['#f0c020'] },
      police: { name: 'SCPD Interceptor', top: 420, accel: 380, grip: 3.0, colors: ['#20242c'] },
    },
    weapons: {
      fists: { name: 'Fists', damage: 12, rate: 0.45, range: 46, ammo: Infinity },
      pistol: { name: 'P9 Pistol', damage: 34, rate: 0.28, range: 520, ammo: 60 },
    },
    radioStations: ['SOL FM 98.5', 'PALM WAVE', 'NEON NIGHTS'],
    respectRanks: ['Nobody', 'Wheelman', 'Hustler', 'Street Legend', 'King of Solmarina'],
    dispatchNames: ['Unit 7', 'Unit 12', 'Unit 3', 'Unit 21', 'Unit 9', 'Unit 15', 'Unit 30', 'Unit 5'],
    missions: [
      { id: 1, name: 'Back in Town', reward: 500, briefing: 'Zola: Rio, you are back. Walk to my diner, then drive my car to the stash house. Keep it quiet.', steps: [
        { type: 'goto', x: 1290, y: 1290, r: 70, text: 'Walk to Zola\'s Diner' },
        { type: 'drive', x: 1750, y: 1750, r: 80, text: 'Drive Zola\'s car to the stash house' } ] },
      { id: 2, name: 'Hot Wheels', reward: 1200, briefing: 'Zola: The Gulls parked a muscle car near the docks. Steal it, deliver it to the chop shop, and lose the heat.', steps: [
        { type: 'steal', x: 1980, y: 580, r: 90, text: 'Steal the marked muscle car' },
        { type: 'drive', x: 700, y: 1980, r: 80, text: 'Deliver the car to the chop shop' },
        { type: 'loseheat', text: 'Lose the wanted level' } ] },
      { id: 3, name: 'Collection Run', reward: 1800, briefing: 'Big Alonzo wants his money. Collect three debts across town. The debtors will not pay quietly.', steps: [
        { type: 'collect', count: 3, spots: [[1520, 1520], [580, 580], [1980, 1980]], r: 70, text: 'Collect the debts (0/3)' },
        { type: 'fight', count: 3, text: 'Deal with the thugs (0/3)' } ] },
      { id: 4, name: 'The Drop', reward: 2500, briefing: 'A package must reach Bayside in 90 seconds, and the cops are already watching. Drive fast, stay clean.', steps: [
        { type: 'timed', x: 2470, y: 1750, r: 90, seconds: 90, text: 'Deliver the package to Bayside' } ] },
      { id: 5, name: 'Harbor Heat', reward: 4000, briefing: 'The Gulls run a warehouse at Porto Verde. Hit it hard, grab the cash, and get out alive.', steps: [
        { type: 'goto', x: 1980, y: 810, r: 80, text: 'Reach the Gulls warehouse' },
        { type: 'fight', count: 5, text: 'Clear the warehouse crew (0/5)' },
        { type: 'collect', count: 1, spots: [[2050, 810]], r: 60, text: 'Grab the cash' } ] },
      { id: 6, name: 'Payday', reward: 50000, briefing: 'The Gulls cash truck leaves the docks at dusk. Take it, survive the four-star chase, and bring it to Zola. Your debt ends tonight.', steps: [
        { type: 'steal', x: 2210, y: 600, r: 90, text: 'Steal the Gulls cash truck' },
        { type: 'drive', x: 1290, y: 1290, r: 90, text: 'Bring the truck to Zola\'s Diner' },
        { type: 'survive', seconds: 20, text: 'Survive the chase (20s)' } ] },
    ],
    packages: 20,
    races: [
      { name: 'Neon Mile Sprint', start: [1060, 1060], points: [[1520, 1060], [1520, 1520], [1060, 1520], [1060, 1060]], par: 45 },
      { name: 'Bayside Dash', start: [2400, 600], points: [[2400, 1520], [2400, 2200], [1750, 2200]], par: 50 },
      { name: 'Yards Loop', start: [600, 1980], points: [[1060, 1980], [1060, 2200], [600, 2200]], par: 40 },
    ],
  };
}
const CONFIG = solmarinaConfig();
