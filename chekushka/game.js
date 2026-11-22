const W = 576;
const H = 1024;

const RED_STREAK = 3; // столько поражений подряд — и Меллстрой уже красный

const PHYS = {
  gravity: 0.5,
  damping: 0.999,
  iterations: 9,
  attach: 62,        // шея чекушки до центра
  catchRadius: 66,
  starRadius: 34,
  magnetRadius: 150,
  magnetForce: 0.2,
};

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

let bg = null;
let bgDirty = true;

// ---------- состояние ----------
const G = {
  mode: 'title',        // title | play | win | lose
  level: 0,
  t: 0,
  bottle: null,
  ropes: [],
  stars: [],
  hazards: [],
  fans: [],
  mel: null,
  melState: 'idle',
  particles: [],
  trail: [],
  pointer: { x: -999, y: -999, down: false, angle: -0.4 },
  swipePrev: null,
  shake: 0,
  winTimer: 0,
  loseReason: '',
  loseStreak: 0,
  saved: loadProgress(),
};

// ---------- сохранение прогресса ----------
function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem('chekushka-progress') || '{}') || {};
  } catch (e) {
    return {};
  }
}

function saveProgress() {
  try {
    localStorage.setItem('chekushka-progress', JSON.stringify(G.saved));
  } catch (e) { /* приватный режим — не критично */ }
}

function bestStars(level) {
  return G.saved[level] || 0;
}

// ---------- утилиты ----------
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);

function segCross(x1, y1, x2, y2, x3, y3, x4, y4) {
  const d = (x2 - x1) * (y4 - y3) - (y2 - y1) * (x4 - x3);
  if (Math.abs(d) < 1e-6) return false;
  const t = ((x3 - x1) * (y4 - y3) - (y3 - y1) * (x4 - x3)) / d;
  const u = ((x3 - x1) * (y2 - y1) - (y3 - y1) * (x2 - x1)) / d;
  return t >= 0 && t <= 1 && u >= 0 && u <= 1;
}

// ---------- построение уровня ----------
function buildLevel(index) {
  const L = LEVELS[index];
  G.level = index;
  G.bottle = { x: L.bottle.x, y: L.bottle.y, px: L.bottle.x, py: L.bottle.y, vx: 0, vy: 0, rot: 0 };
  G.mel = {
    x: L.mel.x, y: L.mel.y, s: L.mel.s, state: 'idle',
    bx: L.mel.x, patrol: L.mel.patrol || null,
  };
  G.melState = 'idle';
  lastMelState = 'idle';
  Sfx.stopMemes();
  G.particles = [];
  G.trail = [];
  G.swipePrev = null;
  G.winTimer = 0;
  G.shake = 0;
  G.loseReason = '';
  G.levelTime = 0;
  G.stars = L.stars.map((s) => ({ x: s.x, y: s.y, got: false, pop: 0 }));
  G.hazards = L.hazards.map((h) => ({ ...h, bx: h.x, by: h.y }));
  G.fans = L.fans.map((f) => ({ ...f, used: false, on: true }));
  G.ropes = L.ropes.map((r) => makeRope(r, L.bottle));
}

function makeRope(def, bottle) {
  const neckY = bottle.y - PHYS.attach;
  const ax = def.a.x;
  const ay = def.a.y;
  const segLen = 20;
  const d = Math.hypot(bottle.x - ax, neckY - ay);
  const n = Math.max(4, Math.round(d / segLen));
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    pts.push({
      x: ax + (bottle.x - ax) * t,
      y: ay + (neckY - ay) * t,
      px: ax + (bottle.x - ax) * t,
      py: ay + (neckY - ay) * t,
      pin: i === 0,
    });
  }
  return {
    pts,
    rest: d / n,
    active: true,
    alpha: 1,
    osc: def.osc || null,
    baseX: ax,
    baseY: ay,
    age: 0,
  };
}

function mouthPoint() {
  return {
    x: G.mel.x + Art.MOUTH.x * G.mel.s,
    y: G.mel.y + Art.MOUTH.y * G.mel.s + 10 * G.mel.s,
  };
}

// ---------- физика ----------
function verlet(p, ax, ay) {
  const vx = (p.x - p.px) * PHYS.damping;
  const vy = (p.y - p.py) * PHYS.damping;
  p.px = p.x;
  p.py = p.y;
  p.x += vx + ax;
  p.y += vy + ay;
}

function stepPhysics(dt) {
  const t = G.t;
  const b = G.bottle;

  // Патрулирующие шипы, мигающие вентиляторы и шагающий Меллстрой.
  // Всё считается от G.t, поэтому трассировка в tools/check-levels даёт те же уровни.
  for (const h of G.hazards) {
    const p = h.patrol;
    if (!p) continue;
    const s = Math.sin(t * p.speed + (p.phase || 0)) * p.amp;
    if (p.axis === 'y') h.y = h.by + s;
    else h.x = h.bx + s;
  }
  for (const f of G.fans) {
    if (!f.pulse) { f.on = true; continue; }
    const ph = ((t + (f.pulse.phase || 0)) % f.pulse.period) / f.pulse.period;
    f.on = ph < (f.pulse.duty || 0.55);
  }
  if (G.mel.patrol) {
    const p = G.mel.patrol;
    G.mel.x = G.mel.bx + Math.sin(t * p.speed + (p.phase || 0)) * p.amp;
  }

  for (const rope of G.ropes) {
    if (!rope.active) { rope.alpha = Math.max(0, rope.alpha - dt * 1.8); continue; }
    rope.age += dt;
    // качающийся якорь: по горизонтали, по вертикали или по кругу
    if (rope.osc) {
      const o = rope.osc;
      const a = t * o.speed + (o.phase || 0);
      let nx = rope.baseX;
      let ny = rope.baseY;
      if (o.axis === 'y') ny += Math.sin(a) * o.amp;
      else if (o.axis === 'circle') {
        nx += Math.sin(a) * o.amp;
        ny += Math.cos(a) * o.amp * (o.ratio || 0.55);
      } else nx += Math.sin(a) * o.amp;
      rope.pts[0].x = nx;
      rope.pts[0].px = nx;
      rope.pts[0].y = ny;
      rope.pts[0].py = ny;
    }
    for (let i = 1; i < rope.pts.length; i++) verlet(rope.pts[i], 0, PHYS.gravity);
  }

  // магнит к рту — чтобы уровни были прощающими
  const m = mouthPoint();
  const free = G.ropes.every((r) => !r.active);
  let axx = 0;
  let ayy = PHYS.gravity;
  if (free) {
    const d = dist(b.x, b.y, m.x, m.y);
    if (d < PHYS.magnetRadius && d > 1) {
      const k = PHYS.magnetForce * (1 - d / PHYS.magnetRadius);
      axx += ((m.x - b.x) / d) * k * 12;
      ayy += ((m.y - b.y) / d) * k * 12;
    }
  }
  verlet(b, axx, ayy);

  // констрейнты
  for (let it = 0; it < PHYS.iterations; it++) {
    for (const rope of G.ropes) {
      if (!rope.active) continue;
      const pts = rope.pts;
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i];
        const c = pts[i + 1];
        const dx = c.x - a.x;
        const dy = c.y - a.y;
        const d = Math.hypot(dx, dy) || 1e-6;
        const diff = (d - rope.rest) / d;
        if (a.pin) {
          c.x -= dx * diff;
          c.y -= dy * diff;
        } else {
          a.x += dx * diff * 0.5;
          a.y += dy * diff * 0.5;
          c.x -= dx * diff * 0.5;
          c.y -= dy * diff * 0.5;
        }
      }
      // крепление чекушки к концу верёвки — за горлышко
      const tip = pts[pts.length - 1];
      const c = Math.cos(b.rot);
      const s = Math.sin(b.rot);
      const neckX = b.x + PHYS.attach * s;
      const neckY = b.y - PHYS.attach * c;
      const dx = neckX - tip.x;
      const dy = neckY - tip.y;
      b.x -= dx * 0.5;
      b.y -= dy * 0.5;
      tip.x += dx * 0.5;
      tip.y += dy * 0.5;
    }
  }

  // наклон чекушки — по биссектрисе верёвок, но в мягких пределах
  const hold = G.ropes.filter((r) => r.active);
  if (hold.length) {
    let sx = 0;
    let sy = 0;
    for (const r of hold) {
      const tip = r.pts[r.pts.length - 1];
      const dx = tip.x - b.x;
      const dy = tip.y - b.y;
      const d = Math.hypot(dx, dy) || 1e-6;
      sx += dx / d;
      sy += dy / d;
    }
    const target = clamp(Math.atan2(sx, -sy), -0.3, 0.3);
    b.rot = lerp(b.rot, target, 0.14);
  } else {
    b.rot = lerp(b.rot, clamp(b.vx * 0.045, -0.5, 0.5), 0.08);
  }

  b.vx = b.x - b.px;
  b.vy = b.y - b.py;

  // стенки
  if (b.x < 22) { b.x = 22; b.px = b.x + b.vx * 0.5; }
  if (b.x > W - 22) { b.x = W - 22; b.px = b.x + b.vx * 0.5; }
  if (b.y < -120) { b.y = -120; b.py = b.y + b.vy * 0.4; }

  // звёзды
  for (const s of G.stars) {
    if (s.got) { s.pop = Math.max(0, s.pop - dt * 2); continue; }
    if (dist(b.x, b.y, s.x, s.y) < PHYS.starRadius) {
      s.got = true;
      s.pop = 1;
      Sfx.star();
      burst(s.x, s.y, '#ffd45c', 14, 3.2);
    }
  }

  // вентилятор
  for (const f of G.fans) {
    if (f.used || f.on === false) continue;
    if (dist(b.x, b.y, f.x, f.y) < f.r) {
      f.used = true;
      b.px = b.x - f.dir.x;
      b.py = b.y - f.dir.y;
      Sfx.puff();
      burst(f.x, f.y, '#a9e2ff', 16, 4);
    }
  }

  // шипы
  for (const h of G.hazards) {
    if (Math.abs(b.x - h.x) < h.w / 2 + 8 && b.y > h.y - 26 && b.y < h.y + 24) {
      lose('Чекушка на шипах');
      return;
    }
  }

  // в рот
  if (dist(b.x, b.y, m.x, m.y) < PHYS.catchRadius) {
    win();
    return;
  }

  if (b.y > H + 90) lose('Чекушка улетела вниз');
}

function burst(x, y, color, count, speed) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const v = speed * (0.4 + Math.random() * 0.9);
    G.particles.push({
      x, y,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v - 1,
      life: 0.5 + Math.random() * 0.5,
      max: 1,
      color,
      size: 2 + Math.random() * 4,
      grav: 0.18,
    });
  }
}

// ---------- переходы ----------
function startLevel(i) {
  buildLevel(clamp(i, 0, LEVELS.length - 1));
  G.mode = 'play';
  G.melState = 'idle';
}

function win() {
  if (G.mode !== 'play') return;
  G.mode = 'win';
  G.melState = 'chew';
  G.winTimer = 0;
  G.loseStreak = 0;
  const b = G.bottle;
  const m = mouthPoint();
  b.x = m.x;
  b.y = m.y;
  b.px = b.x;
  b.py = b.y;
  b.rot = 0;
  for (const r of G.ropes) { r.active = false; r.alpha = 0; }
  const got = G.stars.filter((s) => s.got).length;
  const key = String(G.level);
  G.saved[key] = Math.max(G.saved[key] || 0, got);
  saveProgress();
}

function lose(reason) {
  if (G.mode !== 'play') return;
  G.mode = 'lose';
  G.loseStreak += 1;
  G.melState = G.loseStreak >= RED_STREAK ? 'red' : 'sad';
  G.loseReason = reason;
  G.shake = 16;
  if (G.melState !== 'red') Sfx.fail();
}

// ---------- ввод ----------
function toLocal(e) {
  const r = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - r.left) / r.width) * W,
    y: ((e.clientY - r.top) / r.height) * H,
  };
}

const buttons = [];

function button(id, x, y, w, h, label, opts = {}) {
  buttons.push({ id, x, y, w, h, label, ...opts });
}

function hitButton(px, py) {
  for (let i = buttons.length - 1; i >= 0; i--) {
    const b = buttons[i];
    if (px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h) return b;
  }
  return null;
}

function handleButton(b) {
  Sfx.init();
  Sfx.click();
  switch (b.id) {
    case 'play':
      startLevel(0);
      break;
    case 'next':
      startLevel(G.level + 1);
      break;
    case 'home':
      buildLevel(0);
      G.mode = 'title';
      break;
    case 'retry':
      startLevel(G.level);
      break;
    case 'restart':
      startLevel(G.level);
      break;
    case 'mute':
      // Включили звук — сразу слышно, что он работает
      if (!Sfx.toggleMute()) Sfx.meme('bravo', { dur: 0.7 });
      break;
  }
}

canvas.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  Sfx.init();
  const p = toLocal(e);
  G.pointer.x = p.x;
  G.pointer.y = p.y;
  G.pointer.down = true;
  try {
    canvas.setPointerCapture(e.pointerId);
  } catch (err) { /* синтетические события и старые движки */ }

  const b = hitButton(p.x, p.y);
  if (b) { handleButton(b); return; }

  if (G.mode === 'title') { startLevel(0); return; }
  if (G.mode === 'win' || G.mode === 'lose') return;

  G.swipePrev = { x: p.x, y: p.y };
  G.trail.push({ x: p.x, y: p.y, life: 0.35 });
});

canvas.addEventListener('pointermove', (e) => {
  const p = toLocal(e);
  const dx = p.x - G.pointer.x;
  const dy = p.y - G.pointer.y;
  if (Math.hypot(dx, dy) > 3) G.pointer.angle = Math.atan2(dy, dx);
  G.pointer.x = p.x;
  G.pointer.y = p.y;

  if (!G.pointer.down || G.mode !== 'play') return;

  G.trail.push({ x: p.x, y: p.y, life: 0.35 });
  if (G.trail.length > 40) G.trail.shift();

  if (G.swipePrev) {
    cutAlong(G.swipePrev, p);
    G.swipePrev = { x: p.x, y: p.y };
  }
});

function endPointer() {
  G.pointer.down = false;
  G.swipePrev = null;
}

canvas.addEventListener('pointerup', endPointer);
canvas.addEventListener('pointercancel', endPointer);
canvas.addEventListener('pointerleave', () => { G.pointer.x = -999; G.pointer.y = -999; });

function cutAlong(a, b) {
  for (const rope of G.ropes) {
    if (!rope.active) continue;
    const pts = rope.pts;
    for (let i = 0; i < pts.length - 1; i++) {
      if (segCross(a.x, a.y, b.x, b.y, pts[i].x, pts[i].y, pts[i + 1].x, pts[i + 1].y)) {
        rope.active = false;
        Sfx.cut();
        const cx = (pts[i].x + pts[i + 1].x) / 2;
        const cy = (pts[i].y + pts[i + 1].y) / 2;
        burst(cx, cy, '#7a5230', 10, 2.4);
        burst(cx, cy, '#fff3d0', 5, 3);
        break;
      }
    }
  }
}

// ---------- отрисовка ----------
let bgLevel = -1;

function ensureBg() {
  // ждём, пока догрузится фото-картон из видео
  if (!Assets.get('cardboard')) { bgDirty = true; return; }
  if (bgDirty || !bg || bgLevel !== G.level) {
    bg = Art.buildBackground(W, H, 11 + G.level * 131);
    bgLevel = G.level;
    bgDirty = false;
  }
}

function draw() {
  ensureBg();
  if (!bg) return;
  ctx.save();
  if (G.shake > 0) {
    ctx.translate((Math.random() - 0.5) * G.shake, (Math.random() - 0.5) * G.shake);
  }
  ctx.drawImage(bg, 0, 0);

  if (G.mode === 'title') {
    drawTitle();
    ctx.restore();
    return;
  }

  drawWorld();
  drawHud();

  if (G.mode === 'win') {
    drawWinOverlay();
    if (G.melState === 'bravo') {
      Art.drawMellstroy(ctx, G.mel.x, G.mel.y, G.mel.s, G.t, 'bravo');
    }
  }
  if (G.mode === 'lose') {
    drawLoseOverlay();
    if (G.melState === 'red') {
      Art.drawMellstroy(ctx, G.mel.x, G.mel.y, G.mel.s, G.t, 'red');
    }
  }

  ctx.restore();
}

function drawWorld() {
  for (const h of G.hazards) Art.drawHazard(ctx, h);
  for (const f of G.fans) Art.drawFan(ctx, f, G.t);

  for (const s of G.stars) {
    Art.drawStar(ctx, s.x, s.y, 21 + s.pop * 26, G.t, s.got || s.pop > 0);
  }

  for (const r of G.ropes) {
    if (r.alpha <= 0) continue;
    Art.drawRope(ctx, r.pts, r.alpha, !r.active);
  }
  for (const r of G.ropes) {
    if (r.alpha <= 0) continue;
    ctx.save();
    ctx.globalAlpha = r.alpha;
    Art.drawAnchor(ctx, r.pts[0].x, r.pts[0].y, G.t + r.baseX * 0.01);
    ctx.restore();
  }

  // частицы
  for (const p of G.particles) {
    ctx.save();
    ctx.globalAlpha = clamp(p.life, 0, 1);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  if (G.melState !== 'bravo' && G.melState !== 'red') {
    Art.drawMellstroy(ctx, G.mel.x, G.mel.y, G.mel.s, G.t, G.melState);
  }

  if (G.mode === 'play') {
    Art.drawBottle(ctx, G.bottle.x, G.bottle.y, G.bottle.rot);
  } else if (G.mode === 'win') {
    const k = clamp(1 - G.winTimer * 2.1, 0, 1);
    if (k > 0.01) {
      const m = mouthPoint();
      Art.drawBottle(ctx, m.x, m.y + 26 * (1 - k), 0, 0.5 * k + 0.5);
    }
  }

  drawSwipe();
}

function drawSwipe() {
  if (G.trail.length > 1) {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (let pass = 0; pass < 2; pass++) {
      ctx.beginPath();
      ctx.moveTo(G.trail[0].x, G.trail[0].y);
      for (let i = 1; i < G.trail.length; i++) ctx.lineTo(G.trail[i].x, G.trail[i].y);
      ctx.strokeStyle = pass === 0 ? 'rgba(255, 255, 255, 0.35)' : 'rgba(255, 236, 190, 0.8)';
      ctx.lineWidth = pass === 0 ? 9 : 3;
      ctx.stroke();
    }
    ctx.restore();
  }
}

function drawHud() {
  ctx.save();
  // плашка уровня
  Art.roundRect(ctx, W / 2 - 92, 22, 184, 46, 23);
  ctx.fillStyle = 'rgba(46, 26, 6, 0.62)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 220, 160, 0.35)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#ffe9bd';
  ctx.font = '700 20px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`УРОВЕНЬ ${G.level + 1}/${LEVELS.length}`, W / 2, 46);

  // звёзды в HUD
  const got = G.stars.filter((s) => s.got).length;
  for (let i = 0; i < G.stars.length; i++) {
    ctx.save();
    ctx.translate(W / 2 - (G.stars.length - 1) * 17 + i * 34, 92);
    ctx.scale(0.55, 0.55);
    ctx.globalAlpha = i < got ? 1 : 0.28;
    Art.drawStar(ctx, 0, 0, 20, 0, false);
    ctx.restore();
  }
  ctx.restore();

  // кнопки
  buttons.length = 0;
  const rBtn = { x: W - 74, y: 22, w: 52, h: 46 };
  const mBtn = { x: 22, y: 22, w: 52, h: 46 };
  drawIconButton(rBtn, 'restart');
  drawIconButton(mBtn, 'mute');

}

function drawIconButton(rect, id) {
  button(id, rect.x, rect.y, rect.w, rect.h);
  const hovered = G.pointer.x >= rect.x && G.pointer.x <= rect.x + rect.w &&
    G.pointer.y >= rect.y && G.pointer.y <= rect.y + rect.h;
  Art.roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 14);
  ctx.fillStyle = hovered ? 'rgba(70, 40, 10, 0.8)' : 'rgba(46, 26, 6, 0.62)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 220, 160, 0.35)';
  ctx.lineWidth = 2;
  ctx.stroke();

  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = '#ffe9bd';
  ctx.fillStyle = '#ffe9bd';
  ctx.lineWidth = 2.6;
  ctx.lineCap = 'round';
  if (id === 'restart') {
    ctx.beginPath();
    ctx.arc(0, 0, 11, 0.5, Math.PI * 1.85);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(6, -14);
    ctx.lineTo(13, -11);
    ctx.lineTo(8, -4);
    ctx.closePath();
    ctx.fill();
  } else {
    const muted = Sfx.muted;
    ctx.beginPath();
    ctx.moveTo(-10, -5);
    ctx.lineTo(-4, -5);
    ctx.lineTo(3, -11);
    ctx.lineTo(3, 11);
    ctx.lineTo(-4, 5);
    ctx.lineTo(-10, 5);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    if (muted) {
      ctx.moveTo(7, -6);
      ctx.lineTo(17, 6);
      ctx.moveTo(17, -6);
      ctx.lineTo(7, 6);
    } else {
      ctx.arc(4, 0, 9, -0.8, 0.8);
      ctx.moveTo(16, -8);
      ctx.arc(4, 0, 15, -0.7, 0.7);
    }
    ctx.stroke();
  }
  ctx.restore();
}

function drawTitle() {
  const t = G.t;
  ctx.save();
  Art.drawMellstroy(ctx, W / 2, H - 300, 0.96, t, 'idle');

  // заголовок
  ctx.save();
  ctx.translate(W / 2, 232);
  ctx.rotate(-0.045);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '900 54px "Trebuchet MS", sans-serif';
  ctx.fillStyle = 'rgba(60, 30, 4, 0.45)';
  ctx.fillText('ЧЕКУШКА', 4, 6);
  const g = ctx.createLinearGradient(0, -30, 0, 34);
  g.addColorStop(0, '#fff6d2');
  g.addColorStop(0.55, '#ffd75e');
  g.addColorStop(1, '#e79b13');
  ctx.fillStyle = g;
  ctx.strokeStyle = 'rgba(90, 50, 8, 0.9)';
  ctx.lineWidth = 5;
  ctx.strokeText('ЧЕКУШКА', 0, 0);
  ctx.fillText('ЧЕКУШКА', 0, 0);
  ctx.font = '700 30px "Trebuchet MS", sans-serif';
  ctx.strokeStyle = 'rgba(90, 50, 8, 0.85)';
  ctx.lineWidth = 4;
  ctx.strokeText('ДЛЯ МЕЛЛСТРОЯ', 0, 50);
  ctx.fillText('ДЛЯ МЕЛЛСТРОЯ', 0, 50);
  ctx.restore();

  // подпись
  ctx.textAlign = 'center';
  ctx.font = '600 19px "Trebuchet MS", sans-serif';
  ctx.fillStyle = 'rgba(255, 233, 189, 0.85)';
  ctx.fillText('режь верёвки свайпом и корми Меллстроя', W / 2, 322);

  // прогресс
  const total = LEVELS.length;
  const done = LEVELS.reduce((sum, _, i) => sum + (G.saved[String(i)] || 0), 0);
  ctx.font = '700 16px "Trebuchet MS", sans-serif';
  ctx.fillStyle = 'rgba(255, 233, 189, 0.65)';
  ctx.fillText(`звёзд собрано: ${done} из ${total * 3}`, W / 2, 478);

  // кнопка
  buttons.length = 0;
  const bw = 260;
  const bh = 76;
  const bx = W / 2 - bw / 2;
  const by = 372;
  button('play', bx, by, bw, bh);
  const hovered = G.pointer.x >= bx && G.pointer.x <= bx + bw && G.pointer.y >= by && G.pointer.y <= by + bh;
  Art.roundRect(ctx, bx, by + (hovered ? 2 : 5), bw, bh, 26);
  ctx.fillStyle = 'rgba(40, 22, 4, 0.55)';
  ctx.fill();
  Art.roundRect(ctx, bx, by, bw, bh, 26);
  const bg2 = ctx.createLinearGradient(0, by, 0, by + bh);
  bg2.addColorStop(0, hovered ? '#ffe98f' : '#ffd964');
  bg2.addColorStop(1, hovered ? '#f0b52c' : '#dd9a15');
  ctx.fillStyle = bg2;
  ctx.fill();
  ctx.strokeStyle = 'rgba(90, 50, 8, 0.9)';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.fillStyle = '#4a2a06';
  ctx.font = '900 32px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('ИГРАТЬ', W / 2, by + bh / 2 + 1);
  ctx.restore();
}

function drawPanel(y, h) {
  ctx.save();
  Art.roundRect(ctx, 40, y, W - 80, h, 26);
  ctx.fillStyle = 'rgba(28, 16, 4, 0.78)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 220, 160, 0.45)';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();
}

function drawPillButton(x, y, w, h, label, id, primary = true) {
  button(id, x, y, w, h);
  const hovered = G.pointer.x >= x && G.pointer.x <= x + w && G.pointer.y >= y && G.pointer.y <= y + h;
  Art.roundRect(ctx, x, y + (hovered ? 2 : 4), w, h, 22);
  ctx.fillStyle = 'rgba(40, 22, 4, 0.5)';
  ctx.fill();
  Art.roundRect(ctx, x, y, w, h, 22);
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  if (primary) {
    g.addColorStop(0, hovered ? '#ffe98f' : '#ffd964');
    g.addColorStop(1, hovered ? '#f0b52c' : '#dd9a15');
  } else {
    g.addColorStop(0, hovered ? '#d3b98c' : '#c0a577');
    g.addColorStop(1, hovered ? '#a98f63' : '#97804f');
  }
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = 'rgba(90, 50, 8, 0.9)';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = '#4a2a06';
  ctx.font = '900 24px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + w / 2, y + h / 2 + 1);
}

function drawWinOverlay() {
  ctx.save();
  ctx.fillStyle = 'rgba(20, 10, 2, 0.35)';
  ctx.fillRect(0, 0, W, H);
  drawPanel(300, 340);

  const bravoAge = G.winTimer - 1.9;
  const pop = bravoAge >= 0 ? 1 + 0.22 * Math.max(0, 1 - bravoAge * 3.2) : 1;

  ctx.save();
  ctx.translate(W / 2, 366);
  ctx.scale(pop, pop);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = bravoAge >= 0 ? '#ffdf8a' : '#ffe9bd';
  ctx.font = '900 32px "Trebuchet MS", sans-serif';
  ctx.fillText(bravoAge >= 0 ? 'БРАВО, БОСС!' : 'МЕЛЛСТРОЙ НАКОРМЛЕН', 0, 0);
  ctx.restore();

  const got = G.stars.filter((s) => s.got).length;
  for (let i = 0; i < G.stars.length; i++) {
    ctx.save();
    ctx.translate(W / 2 - (G.stars.length - 1) * 46 + i * 92, 446);
    ctx.globalAlpha = i < got ? 1 : 0.22;
    Art.drawStar(ctx, 0, 0, 33, G.t, false);
    ctx.restore();
  }

  ctx.fillStyle = 'rgba(255, 233, 189, 0.7)';
  ctx.font = '600 18px "Trebuchet MS", sans-serif';
  ctx.fillText(`звёзд собрано: ${got} из ${G.stars.length}`, W / 2, 504);

  const isLast = G.level + 1 >= LEVELS.length;
  drawPillButton(W / 2 - 146, 540, 132, 64, 'ЕЩЁ РАЗ', 'retry', false);
  drawPillButton(W / 2 + 14, 540, 132, 64, isLast ? 'СНАЧАЛА' : 'ДАЛЬШЕ', isLast ? 'home' : 'next');

  if (isLast) {
    ctx.fillStyle = 'rgba(255, 233, 189, 0.75)';
    ctx.font = '600 16px "Trebuchet MS", sans-serif';
    ctx.fillText('это был последний уровень, братан', W / 2, 628);
  }
  ctx.restore();
}

function drawLoseOverlay() {
  const red = G.melState === 'red' && Assets.get('red');
  ctx.save();
  ctx.fillStyle = 'rgba(40, 10, 2, 0.35)';
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (red) {
    drawPanel(336, 296);
    ctx.fillStyle = '#ff8f6e';
    ctx.font = '900 27px "Trebuchet MS", sans-serif';
    ctx.fillText('Я УЖЕ КРАСНЫЙ,', W / 2, 388);
    ctx.fillText('КУЛЬТУРНО НЕ ПОЛУЧИТСЯ', W / 2, 424);
    ctx.fillStyle = 'rgba(255, 233, 189, 0.7)';
    ctx.font = '600 18px "Trebuchet MS", sans-serif';
    ctx.fillText(G.loseReason, W / 2, 464);
    ctx.fillText(`проигрышей подряд: ${G.loseStreak}`, W / 2, 494);
    drawPillButton(W / 2 - 120, 524, 240, 66, 'ЕЩЁ РАЗ', 'retry');
  } else {
    drawPanel(360, 250);
    ctx.fillStyle = '#ffd0a0';
    ctx.font = '900 30px "Trebuchet MS", sans-serif';
    ctx.fillText('МЕЛЛСТРОЙ РАССТРОЕН', W / 2, 412);
    ctx.fillStyle = 'rgba(255, 233, 189, 0.7)';
    ctx.font = '600 18px "Trebuchet MS", sans-serif';
    ctx.fillText(G.loseReason, W / 2, 452);
    drawPillButton(W / 2 - 120, 500, 240, 66, 'ЕЩЁ РАЗ', 'retry');
  }
  ctx.restore();
}

// Звук под мемные гифки: каждая нарезка Меллстроя озвучена своей цитатой
const MEL_SFX = {
  // «сладость, приятность и вкусность» — Меллстрой жуёт добычу
  chew: ['eat', { dur: 1.9, peak: 1 }],
  // аплодисменты на «Браво, босс!»
  bravo: ['bravo', { dur: 3.2, peak: 1 }],
  // «я уже красный, культурно не получится»
  red: ['red', { dur: 3.4, peak: 1 }],
};
let lastMelState = 'idle';

function melSfx() {
  if (G.melState === lastMelState) return;
  lastMelState = G.melState;
  const clip = MEL_SFX[G.melState];
  if (clip) Sfx.meme(clip[0], clip[1]);
}

// ---------- цикл ----------
let last = performance.now();
let acc = 0;

function frame(now) {
  const rawDt = Math.min(0.05, (now - last) / 1000);
  last = now;
  acc += rawDt;
  const STEP = 1 / 60;

  while (acc >= STEP) {
    G.t += STEP;
    if (G.mode === 'play') { G.levelTime += STEP; stepPhysics(STEP); }
    if (G.mode === 'win') {
      G.winTimer += STEP;
      G.melState = G.winTimer < 1.9 ? 'chew' : 'bravo';
    }
    if (G.shake > 0) G.shake = Math.max(0, G.shake - STEP * 60);

    for (const s of G.stars) if (s.pop > 0 && s.got) s.pop = Math.max(0, s.pop - STEP * 1.6);
    for (const p of G.particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.grav;
      p.life -= STEP * 1.6;
    }
    G.particles = G.particles.filter((p) => p.life > 0);
    melSfx();
    for (const t of G.trail) t.life -= STEP * 3;
    G.trail = G.trail.filter((t) => t.life > 0);

    acc -= STEP;
  }

  draw();
  requestAnimationFrame(frame);
}

// ---------- размер канвы ----------
function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingQuality = 'high';
}

window.addEventListener('resize', resize);
resize();

buildLevel(0);
G.mode = 'title';
Sfx.preload();

requestAnimationFrame(frame);
