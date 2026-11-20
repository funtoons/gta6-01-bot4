// Keyboard and mouse state for Solmarina: held keys, pressed-this-frame
// edges, and the mouse position in canvas pixels.
function createInputState(canvas) {
  const input = {
    keys: {}, pressed: {}, mouseX: 640, mouseY: 360, mouseDown: false,
    mousePressed: false, wheel: 0,
  };
  window.addEventListener('keydown', (e) => {
    if (!input.keys[e.code]) input.pressed[e.code] = true;
    input.keys[e.code] = true;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
  });
  window.addEventListener('keyup', (e) => { input.keys[e.code] = false; });
  canvas.addEventListener('mousemove', (e) => {
    const r = canvas.getBoundingClientRect();
    input.mouseX = (e.clientX - r.left) * (canvas.width / r.width);
    input.mouseY = (e.clientY - r.top) * (canvas.height / r.height);
  });
  canvas.addEventListener('mousedown', (e) => {
    if (e.button === 0) { input.mouseDown = true; input.mousePressed = true; }
  });
  window.addEventListener('mouseup', () => { input.mouseDown = false; });
  canvas.addEventListener('wheel', (e) => { input.wheel += e.deltaY; e.preventDefault(); }, { passive: false });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  return input;
}
function inputDown(input, code) { return !!input.keys[code]; }
function inputPressed(input, code) {
  const hit = !!input.pressed[code];
  if (hit) input.pressed[code] = false;
  return hit;
}
function inputEndFrame(input) {
  input.pressed = {};
  input.mousePressed = false;
  input.wheel = 0;
}
