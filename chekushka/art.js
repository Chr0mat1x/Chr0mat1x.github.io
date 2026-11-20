// Вся графика рисуется процедурно: ни одного внешнего файла.
const Art = (() => {
  const CARD = {
    base: '#c98a3e',
    baseDark: '#b1722c',
    paper: '#dc9f52',
    paperLight: '#e6b06a',
    ink: 'rgba(124, 74, 22, 0.55)',
    inkSoft: 'rgba(124, 74, 22, 0.28)',
  };

  const MOUTH = { x: 0, y: 26 };

  function rng(seed) {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function roundRect(ctx, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  // наклейка-вырезка: спрайт по центру точки
  function sticker(ctx, key, cx, cy, scale = 1, rot = 0) {
    const im = Assets.get(key);
    if (!im) return;
    const dw = im.naturalWidth * scale;
    const dh = im.naturalHeight * scale;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);
    ctx.globalAlpha = 0.26;
    ctx.fillStyle = '#3a2308';
    ctx.fillRect(-dw / 2 + 5, -dh / 2 + 6, dw, dh);
    ctx.globalAlpha = 1;
    ctx.drawImage(im, -dw / 2, -dh / 2, dw, dh);
    ctx.restore();
  }

  // ---------- фон: гофрокартон с наклеенными кусками ----------
  function buildBackground(w, h, seed = 7) {
    const cv = document.createElement('canvas');
    cv.width = w;
    cv.height = h;
    const ctx = cv.getContext('2d');
    const R = rng(seed);

    const plate = Assets.get('cardboard');
    if (plate) {
      ctx.drawImage(plate, 0, 0, w, h);
      sticker(ctx, 'crayfish', 96, 548, 0.9, -0.1);
      sticker(ctx, 'shashlik', 494, 715, 0.78, 0.16);
      return cv;
    }

    const g = ctx.createLinearGradient(0, 0, w * 0.6, h);
    g.addColorStop(0, '#d4923f');
    g.addColorStop(0.45, CARD.base);
    g.addColorStop(1, '#b4742b');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // волокна картона
    for (let i = 0; i < 2600; i++) {
      const x = R() * w;
      const y = R() * h;
      const l = 4 + R() * 26;
      ctx.strokeStyle = R() > 0.5
        ? `rgba(255, 226, 170, ${0.03 + R() * 0.05})`
        : `rgba(96, 55, 14, ${0.03 + R() * 0.06})`;
      ctx.lineWidth = 0.6 + R() * 1.6;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (R() - 0.5) * 4, y + l);
      ctx.stroke();
    }

    // наклеенные куски бумаги
    for (let i = 0; i < 14; i++) {
      const pw = 80 + R() * 300;
      const ph = 70 + R() * 280;
      const px = R() * (w - pw);
      const py = R() * (h - ph);
      ctx.save();
      ctx.translate(px + pw / 2, py + ph / 2);
      ctx.rotate((R() - 0.5) * 0.18);
      ctx.fillStyle = R() > 0.5 ? CARD.paper : CARD.paperLight;
      ctx.globalAlpha = 0.5 + R() * 0.3;
      roundRect(ctx, -pw / 2, -ph / 2, pw, ph, 6);
      ctx.fill();
      ctx.globalAlpha = 0.18;
      ctx.strokeStyle = '#7a4512';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    }

    // скотч
    for (let i = 0; i < 9; i++) {
      const tw = 70 + R() * 60;
      const th = 20 + R() * 10;
      ctx.save();
      ctx.translate(R() * w, R() * h);
      ctx.rotate((R() - 0.5) * 1.4);
      ctx.fillStyle = 'rgba(240, 220, 180, 0.32)';
      ctx.fillRect(-tw / 2, -th / 2, tw, th);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.fillRect(-tw / 2, -th / 2, tw, th * 0.35);
      ctx.restore();
    }

    drawDoodles(ctx, w, h, R);

    // виньетка и мягкая тень по краям
    const v = ctx.createRadialGradient(w / 2, h * 0.45, h * 0.15, w / 2, h * 0.5, h * 0.78);
    v.addColorStop(0, 'rgba(0, 0, 0, 0)');
    v.addColorStop(1, 'rgba(70, 36, 4, 0.45)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, w, h);

    return cv;
  }

  function sketchStar(ctx, cx, cy, r, rot = 0) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);
    for (let pass = 0; pass < 2; pass++) {
      ctx.beginPath();
      for (let i = 0; i <= 10; i++) {
        const a = (Math.PI / 5) * i - Math.PI / 2;
        const rad = i % 2 === 0 ? r : r * 0.45;
        const jitter = pass === 0 ? 0 : 0.8;
        const x = Math.cos(a) * rad + (Math.random() - 0.5) * jitter;
        const y = Math.sin(a) * rad + (Math.random() - 0.5) * jitter;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = pass === 0 ? CARD.ink : CARD.inkSoft;
      ctx.lineWidth = pass === 0 ? 3 : 1.4;
      ctx.lineJoin = 'round';
      ctx.stroke();
    }
    ctx.restore();
  }

  function sketchCreature(ctx, cx, cy, s) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(s, s);
    ctx.strokeStyle = CARD.ink;
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    // тело
    ctx.beginPath();
    ctx.moveTo(-34, 18);
    ctx.bezierCurveTo(-42, -12, -22, -38, 0, -38);
    ctx.bezierCurveTo(24, -38, 42, -14, 34, 18);
    ctx.bezierCurveTo(30, 30, -30, 30, -34, 18);
    ctx.stroke();
    // усики
    ctx.beginPath();
    ctx.moveTo(-4, -37);
    ctx.quadraticCurveTo(-6, -50, 2, -52);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(3, -54, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = CARD.ink;
    ctx.fill();
    // глаза
    for (const ex of [-12, 12]) {
      ctx.beginPath();
      ctx.arc(ex, -10, 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(ex + 2, -9, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    // рот
    ctx.beginPath();
    ctx.moveTo(-9, 8);
    ctx.quadraticCurveTo(0, 16, 9, 8);
    ctx.stroke();
    ctx.restore();
  }

  function drawDoodles(ctx, w, h, R) {
    sketchStar(ctx, w * 0.18, h * 0.075, 20, -0.2);
    sketchStar(ctx, w * 0.72, h * 0.30, 17, 0.3);
    sketchCreature(ctx, w * 0.66, h * 0.075, 0.95);

    // «ХА»
    ctx.save();
    ctx.translate(w * 0.22, h * 0.35);
    ctx.rotate(-0.12);
    ctx.font = '700 34px "Trebuchet MS", sans-serif';
    ctx.fillStyle = CARD.inkSoft;
    ctx.fillText('ХА', 0, 0);
    ctx.restore();

    // стрелки вверх
    for (const [ax, ay, s] of [[w * 0.78, h * 0.94, 1], [w * 0.2, h * 0.88, 0.7]]) {
      ctx.save();
      ctx.translate(ax, ay);
      ctx.scale(s, s);
      ctx.strokeStyle = CARD.inkSoft;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeRect(-22, -26, 44, 52);
      ctx.beginPath();
      ctx.moveTo(0, 14);
      ctx.lineTo(0, -12);
      ctx.moveTo(-9, -4);
      ctx.lineTo(0, -13);
      ctx.lineTo(9, -4);
      ctx.stroke();
      ctx.restore();
    }

    // каракули-царапины
    ctx.strokeStyle = CARD.inkSoft;
    for (let i = 0; i < 5; i++) {
      ctx.save();
      ctx.translate(R() * w, R() * h);
      ctx.rotate(R() * 6.28);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-18, 0);
      ctx.quadraticCurveTo(-6, -8, 4, 0);
      ctx.quadraticCurveTo(12, 7, 20, 0);
      ctx.stroke();
      ctx.restore();
    }
  }

  // ---------- верёвка ----------
  function drawRope(ctx, pts, alpha = 1, cut = false) {
    if (pts.length < 2) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.strokeStyle = '#3f2711';
    ctx.lineWidth = 7;
    ctx.stroke();
    ctx.strokeStyle = cut ? '#8a5a2c' : '#6d4523';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255, 220, 170, 0.25)';
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.restore();
  }

  function drawAnchor(ctx, x, y, t = 0) {
    const im = Assets.get('button');
    if (im) {
      const k = (1 + Math.sin(t * 3) * 0.03) * 0.74;
      const d = im.naturalWidth * k;
      ctx.save();
      ctx.globalAlpha *= 1;
      ctx.drawImage(im, x - d / 2, y - d / 2, d, d);
      ctx.restore();
      return;
    }
    ctx.save();
    ctx.translate(x, y);
    const pulse = 1 + Math.sin(t * 3) * 0.03;
    ctx.scale(pulse, pulse);
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, Math.PI * 2);
    ctx.fillStyle = '#2c4f8e';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, Math.PI * 2);
    ctx.strokeStyle = '#1b2f57';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, 8.5, 0, Math.PI * 2);
    ctx.fillStyle = '#4f7fd0';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-3, -3.5, 3.4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(190, 220, 255, 0.85)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#12213d';
    ctx.fill();
    ctx.restore();
  }

  // ---------- чекушка с кружкой ----------
  function drawBottle(ctx, x, y, rot, scale = 1) {
    const im = Assets.get('bottle');
    if (im) {
      const dh = 132 * scale;
      const dw = dh * (im.naturalWidth / im.naturalHeight);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.drawImage(im, -dw / 2, -dh * 0.47, dw, dh);
      ctx.restore();
      return;
    }
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.scale(scale, scale);

    // тень-подложка под бутылкой
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = '#3a2308';
    ctx.beginPath();
    ctx.ellipse(4, 66, 34, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    const bw = 27;      // половина ширины корпуса
    const top = -62;    // горлышко
    const bottom = 64;

    // стекло
    const glass = ctx.createLinearGradient(-bw, 0, bw, 0);
    glass.addColorStop(0, '#cfe0d8');
    glass.addColorStop(0.22, '#f4fbff');
    glass.addColorStop(0.55, '#e2eef2');
    glass.addColorStop(0.85, '#b9ccd3');
    glass.addColorStop(1, '#93a9b2');
    ctx.fillStyle = glass;
    ctx.beginPath();
    ctx.moveTo(-11, top + 14);
    ctx.lineTo(-11, -24);
    ctx.quadraticCurveTo(-bw, -12, -bw, 2);
    ctx.lineTo(-bw, bottom - 8);
    ctx.quadraticCurveTo(-bw, bottom, -bw + 8, bottom);
    ctx.lineTo(bw - 8, bottom);
    ctx.quadraticCurveTo(bw, bottom, bw, bottom - 8);
    ctx.lineTo(bw, 2);
    ctx.quadraticCurveTo(bw, -12, 11, -24);
    ctx.lineTo(11, top + 14);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(90, 120, 130, 0.55)';
    ctx.lineWidth = 1.6;
    ctx.stroke();

    // блик
    ctx.save();
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = '#ffffff';
    roundRect(ctx, -bw + 6, -14, 6, 58, 3);
    ctx.fill();
    ctx.restore();

    // жидкость
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(-bw + 3, 6);
    ctx.lineTo(bw - 3, 6);
    ctx.lineTo(bw - 3, bottom - 8);
    ctx.quadraticCurveTo(bw - 3, bottom - 2, bw - 9, bottom - 2);
    ctx.lineTo(-bw + 9, bottom - 2);
    ctx.quadraticCurveTo(-bw + 3, bottom - 2, -bw + 3, bottom - 8);
    ctx.closePath();
    ctx.fillStyle = 'rgba(226, 240, 240, 0.5)';
    ctx.fill();
    ctx.restore();

    // крышка
    ctx.fillStyle = '#cfd6da';
    roundRect(ctx, -13, top - 2, 26, 16, 4);
    ctx.fill();
    ctx.strokeStyle = '#8e989c';
    ctx.lineWidth = 1.4;
    ctx.stroke();
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(-13, top + 3 + i * 3.4);
      ctx.lineTo(13, top + 3 + i * 3.4);
      ctx.strokeStyle = 'rgba(120, 130, 135, 0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // этикетка
    ctx.save();
    roundRect(ctx, -bw, -4, bw * 2, 44, 3);
    ctx.fillStyle = '#22467f';
    ctx.fill();
    ctx.strokeStyle = '#132a52';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillRect(-bw, 32, bw * 2, 4);

    ctx.fillStyle = '#ffffff';
    ctx.font = '700 10px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const label = 'ЧЕКУШКА';
    const lw = ctx.measureText(label).width;
    const fit = Math.min(1, (bw * 2 - 8) / lw);
    ctx.save();
    ctx.translate(0, 5);
    ctx.scale(fit, fit);
    ctx.fillText(label, 0, 0);
    ctx.restore();
    ctx.fillStyle = '#cfe0ff';
    ctx.font = '700 6px "Trebuchet MS", sans-serif';
    ctx.fillText('ЛЮБОВЬ • 0.25 Л', 0, 18);
    ctx.save();
    ctx.translate(0, 26);
    ctx.fillStyle = '#f2f5f8';
    for (let i = 0; i < 16; i++) ctx.fillRect(-bw + 2 + i * 3.2, Math.sin(i * 1.7) * 1.4, 1.6, 3.4);
    ctx.restore();
    ctx.restore();

    drawMug(ctx, 36, 26);
    ctx.restore();
  }

  function drawMug(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);
    // ручка
    ctx.beginPath();
    ctx.arc(21, 4, 12, -Math.PI / 2.2, Math.PI / 2.2);
    ctx.strokeStyle = 'rgba(225, 240, 245, 0.75)';
    ctx.lineWidth = 6;
    ctx.stroke();
    // стакан
    const g = ctx.createLinearGradient(-16, 0, 16, 0);
    g.addColorStop(0, 'rgba(200, 225, 230, 0.9)');
    g.addColorStop(0.5, 'rgba(255, 255, 255, 0.95)');
    g.addColorStop(1, 'rgba(180, 210, 215, 0.9)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-15, -22);
    ctx.lineTo(15, -22);
    ctx.lineTo(13, 22);
    ctx.lineTo(-13, 22);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(110, 140, 148, 0.6)';
    ctx.lineWidth = 1.4;
    ctx.stroke();
    // пиво
    ctx.beginPath();
    ctx.moveTo(-14, -12);
    ctx.lineTo(14, -12);
    ctx.lineTo(13, 21);
    ctx.lineTo(-13, 21);
    ctx.closePath();
    ctx.fillStyle = '#e0a12b';
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 214, 120, 0.55)';
    ctx.fillRect(-12, -10, 5, 30);
    // пена
    ctx.fillStyle = '#fdfbf2';
    ctx.beginPath();
    ctx.ellipse(0, -17, 15, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(-7, -20, 6, 5, 0, 0, Math.PI * 2);
    ctx.ellipse(6, -21, 7, 5.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // ---------- звезда уровня ----------
  function drawStar(ctx, x, y, r, t, collected) {
    if (collected) {
      ctx.save();
      ctx.globalAlpha = 0.18;
      ctx.translate(x, y);
      starPath(ctx, r * 0.55, 0);
      ctx.fillStyle = '#fff2c0';
      ctx.fill();
      ctx.restore();
      return;
    }
    ctx.save();
    ctx.translate(x, y);
    const pulse = 1 + Math.sin(t * 2.6) * 0.07;
    ctx.scale(pulse, pulse);
    ctx.rotate(Math.sin(t * 1.4) * 0.12);

    ctx.shadowColor = 'rgba(255, 214, 90, 0.9)';
    ctx.shadowBlur = 22;
    const g = ctx.createLinearGradient(0, -r, 0, r);
    g.addColorStop(0, '#fff4b8');
    g.addColorStop(0.5, '#ffcf45');
    g.addColorStop(1, '#f2a11c');
    starPath(ctx, r, 0);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(150, 90, 10, 0.85)';
    ctx.lineWidth = 2.4;
    ctx.stroke();

    ctx.save();
    ctx.scale(0.42, 0.42);
    starPath(ctx, r, 0);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fill();
    ctx.restore();
    ctx.restore();
  }

  function starPath(ctx, r, rot) {
    ctx.beginPath();
    for (let i = 0; i <= 10; i++) {
      const a = (Math.PI / 5) * i - Math.PI / 2 + rot;
      const rad = i % 2 === 0 ? r : r * 0.45;
      const px = Math.cos(a) * rad;
      const py = Math.sin(a) * rad;
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
  }

  // ---------- шипы ----------
  function drawHazard(ctx, h) {
    ctx.save();
    ctx.translate(h.x, h.y);
    const w = h.w;
    const n = Math.max(3, Math.round(w / 24));
    const step = w / n;
    // шипы
    for (let i = 0; i < n; i++) {
      const bx = -w / 2 + i * step;
      const g = ctx.createLinearGradient(0, -22, 0, 6);
      g.addColorStop(0, '#f2f4f6');
      g.addColorStop(1, '#8d97a0');
      ctx.beginPath();
      ctx.moveTo(bx + 2, 6);
      ctx.lineTo(bx + step / 2, -24);
      ctx.lineTo(bx + step - 2, 6);
      ctx.closePath();
      ctx.fillStyle = g;
      ctx.fill();
      ctx.strokeStyle = 'rgba(60, 70, 80, 0.7)';
      ctx.lineWidth = 1.3;
      ctx.stroke();
    }
    // основание
    roundRect(ctx, -w / 2 - 4, 4, w + 8, 16, 5);
    ctx.fillStyle = '#5d4a38';
    ctx.fill();
    ctx.strokeStyle = '#3a2c1e';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  // ---------- вентилятор (поток воздуха) ----------
  function drawFan(ctx, f, t) {
    ctx.save();
    ctx.translate(f.x, f.y);
    ctx.globalAlpha = f.used ? 0.25 : 1;

    if (!f.used) {
      // струи воздуха уходят вверх
      for (let i = 0; i < 3; i++) {
        const ph = (t * 1.1 + i / 3) % 1;
        const yy = -f.r * (0.35 + ph * 0.9);
        const a = Math.sin(ph * Math.PI) * 0.5;
        ctx.beginPath();
        ctx.moveTo(-20 + i * 20, yy);
        ctx.quadraticCurveTo(-14 + i * 20, yy - 16, -20 + i * 20, yy - 30);
        ctx.strokeStyle = `rgba(190, 232, 255, ${a})`;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.stroke();
      }
    }

    // корпус
    ctx.beginPath();
    ctx.arc(0, 0, 30, 0, Math.PI * 2);
    ctx.fillStyle = f.used ? '#5a6068' : '#c9d3dc';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#8c98a4';
    ctx.stroke();

    // лопасти
    ctx.save();
    ctx.rotate(f.used ? 0.3 : t * 7);
    for (let i = 0; i < 4; i++) {
      ctx.rotate(Math.PI / 2);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(15, -7, 21, 6);
      ctx.quadraticCurveTo(8, 9, 0, 0);
      ctx.fillStyle = f.used ? '#7d858f' : '#7fc4e8';
      ctx.fill();
    }
    ctx.restore();

    // ступица и решётка
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#4c5661';
    ctx.fill();
    ctx.strokeStyle = 'rgba(140, 152, 164, 0.75)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * -30, Math.sin(a) * -30);
      ctx.lineTo(Math.cos(a) * 30, Math.sin(a) * 30);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(0, 0, 30, 0, Math.PI * 2);
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#8c98a4';
    ctx.stroke();
    ctx.restore();
  }

  // ---------- Меллстрой ----------
  // Кадры нарезаны из видео: 0..4 — ухмылка, shout — орёт.
  const MEL_FRAME = { w: 194, h: 222, mouthX: 95, mouthY: 103 };

  // Мемные нарезки: «сладость, приятность и вкусность» и «браво, босс».
  const MEME_SHEETS = {
    eat: { key: 'eat', cols: 6, rows: 5, fw: 200, fh: 154, count: 30, fps: 14, k: 1.92, oy: 0.6 },
    bravo: { key: 'bravo', cols: 7, rows: 6, fw: 200, fh: 175, count: 38, fps: 13, k: 1.9, oy: 0.50 },
  };

  function drawMemeSheet(ctx, x, y, s, t, name) {
    const m = MEME_SHEETS[name];
    const im = m && Assets.get(m.key);
    if (!im) return false;
    const f = Math.floor((t * m.fps) % m.count);
    const col = f % m.cols;
    const row = Math.floor(f / m.cols);
    const dw = m.fw * s * m.k;
    const dh = m.fh * s * m.k;
    ctx.save();
    ctx.translate(x + MOUTH.x * s, y + MOUTH.y * s);
    ctx.shadowColor = 'rgba(42, 22, 6, 0.55)';
    ctx.shadowBlur = 16 * s;
    ctx.shadowOffsetY = 7 * s;
    ctx.drawImage(
      im,
      col * m.fw, row * m.fh, m.fw, m.fh,
      -dw / 2, -dh * m.oy, dw, dh,
    );
    ctx.restore();
    return true;
  }

  function melFrame(state, t) {
    if (state === 'sad') return Assets.get('melShout');
    const order = ['mel0', 'mel1', 'mel2', 'mel3', 'mel4', 'mel3', 'mel2', 'mel1'];
    return Assets.get(order[Math.floor(t * 5) % order.length]);
  }

  function drawMellstroySprite(ctx, x, y, s, t, state) {
    if (state === 'chew' && drawMemeSheet(ctx, x, y, s, t, 'eat')) return true;
    if (state === 'bravo' && drawMemeSheet(ctx, x, y, s, t, 'bravo')) return true;
    const im = melFrame(state, t);
    if (!im) return false;
    const k = s * 1.16;
    const mouthX = x + MOUTH.x * s;
    const mouthY = y + MOUTH.y * s;
    const bob = Math.sin(t * 1.8) * 3;
    const shout = state === 'sad' ? Math.sin(t * 40) * 0.02 : 0;
    ctx.save();
    ctx.translate(mouthX, mouthY + bob);
    ctx.rotate(shout);
    // мягкая тень-подложка под вырезкой, чтобы фото не «висело» в воздухе
    ctx.shadowColor = 'rgba(42, 22, 6, 0.55)';
    ctx.shadowBlur = 16 * s;
    ctx.shadowOffsetY = 7 * s;
    ctx.drawImage(
      im,
      -MEL_FRAME.mouthX * k,
      -MEL_FRAME.mouthY * k,
      im.naturalWidth * k,
      im.naturalHeight * k,
    );
    ctx.shadowColor = 'transparent';
    ctx.restore();
    return true;
  }

  function drawMellstroy(ctx, x, y, s, t, state) {
    if (drawMellstroySprite(ctx, x, y, s, t, state)) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    const bob = Math.sin(t * 1.8) * 2.2;
    const chew = state === 'chew' ? Math.abs(Math.sin(t * 16)) : 0;

    // тень
    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = '#2a1606';
    ctx.beginPath();
    ctx.ellipse(0, 226, 132, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // рубашка
    ctx.save();
    ctx.translate(0, 96 + bob * 0.4);
    const shirt = ctx.createLinearGradient(-120, 0, 120, 0);
    shirt.addColorStop(0, '#24327a');
    shirt.addColorStop(0.5, '#38509f');
    shirt.addColorStop(1, '#1d2a66');
    ctx.beginPath();
    ctx.moveTo(-58, -6);
    ctx.bezierCurveTo(-124, 6, -132, 60, -136, 132);
    ctx.lineTo(136, 132);
    ctx.bezierCurveTo(132, 60, 124, 6, 58, -6);
    ctx.closePath();
    ctx.fillStyle = shirt;
    ctx.fill();
    ctx.strokeStyle = '#16205a';
    ctx.lineWidth = 3;
    ctx.stroke();

    // цветочный принт
    const flowerColors = ['#f2e14c', '#e8503a', '#f7f7f2', '#59c26b', '#e07fb5'];
    let seed = 0;
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 7; col++) {
        seed++;
        const fx = -120 + col * 40 + (row % 2) * 20 - 4;
        const fy = 8 + row * 26;
        const r = 5 + ((seed * 37) % 5);
        ctx.beginPath();
        ctx.arc(fx, fy, r, 0, Math.PI * 2);
        ctx.fillStyle = flowerColors[seed % flowerColors.length];
        ctx.globalAlpha = 0.85;
        ctx.fill();
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(fx + r * 0.4, fy - r * 0.4, r * 0.45, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }
    // воротник
    ctx.beginPath();
    ctx.moveTo(-30, -8);
    ctx.lineTo(0, 26);
    ctx.lineTo(30, -8);
    ctx.closePath();
    ctx.fillStyle = '#f0f2f5';
    ctx.fill();
    ctx.restore();

    // шея
    ctx.save();
    ctx.translate(0, 74 + bob * 0.6);
    ctx.fillStyle = '#e0ab84';
    roundRect(ctx, -26, -24, 52, 46, 14);
    ctx.fill();
    ctx.restore();

    // голова
    ctx.save();
    ctx.translate(0, bob);
    const skin = ctx.createRadialGradient(-18, -26, 20, 0, 6, 118);
    skin.addColorStop(0, '#f7d1ac');
    skin.addColorStop(0.7, '#eec09a');
    skin.addColorStop(1, '#d9a077');
    ctx.beginPath();
    ctx.ellipse(0, 0, 92, 104, 0, 0, Math.PI * 2);
    ctx.fillStyle = skin;
    ctx.fill();
    ctx.strokeStyle = 'rgba(160, 108, 70, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // уши
    for (const sx of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(sx * 92, 8, 14, 22, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#eec09a';
      ctx.fill();
      ctx.stroke();
    }

    // волосы: короткая стрижка с пробором
    ctx.beginPath();
    ctx.moveTo(-92, -18);
    ctx.bezierCurveTo(-96, -86, -46, -116, 4, -112);
    ctx.bezierCurveTo(56, -108, 94, -76, 92, -18);
    ctx.bezierCurveTo(76, -46, 62, -56, 44, -58);
    ctx.bezierCurveTo(26, -60, 10, -50, -6, -58);
    ctx.bezierCurveTo(-22, -66, -34, -52, -52, -54);
    ctx.bezierCurveTo(-68, -56, -84, -44, -92, -18);
    ctx.closePath();
    const hairG = ctx.createLinearGradient(0, -116, 0, -20);
    hairG.addColorStop(0, '#7a6249');
    hairG.addColorStop(1, '#54412d');
    ctx.fillStyle = hairG;
    ctx.fill();
    ctx.strokeStyle = 'rgba(50, 36, 22, 0.55)';
    ctx.lineWidth = 1.6;
    ctx.stroke();

    // брови
    ctx.strokeStyle = '#4a3623';
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    const browY = state === 'sad' ? -38 : -34;
    ctx.beginPath();
    ctx.moveTo(-56, browY + (state === 'sad' ? -4 : 0));
    ctx.quadraticCurveTo(-42, browY - 8, -26, browY - 1);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(26, browY - 1);
    ctx.quadraticCurveTo(42, browY - 9, 56, browY + (state === 'sad' ? -4 : 0));
    ctx.stroke();

    // глаза
    for (const sx of [-1, 1]) {
      const ex = sx * 38;
      const ey = -6;
      if (state === 'chew') {
        ctx.beginPath();
        ctx.lineWidth = 6;
        ctx.strokeStyle = '#3a2a1a';
        ctx.arc(ex, ey + 2, 12, Math.PI * 1.15, Math.PI * 1.85);
        ctx.stroke();
      } else if (state === 'sad') {
        ctx.beginPath();
        ctx.ellipse(ex, ey + 2, 10, 12, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(ex, ey + 7, 5.5, 0, Math.PI * 2);
        ctx.fillStyle = '#3a2a1a';
        ctx.fill();
        ctx.beginPath();
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#3a2a1a';
        ctx.arc(ex, ey - 4, 11, Math.PI * 1.1, Math.PI * 1.9);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.ellipse(ex, ey, 13, 14, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = 'rgba(120, 80, 50, 0.6)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(ex - sx * 2, ey + 2, 7, 0, Math.PI * 2);
        ctx.fillStyle = '#2f4a63';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(ex - sx * 5, ey - 2, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      }
    }

    // нос
    ctx.beginPath();
    ctx.moveTo(0, 12);
    ctx.quadraticCurveTo(-9, 30, 0, 34);
    ctx.quadraticCurveTo(9, 30, 0, 12);
    ctx.fillStyle = 'rgba(205, 150, 110, 0.6)';
    ctx.fill();

    // румянец
    for (const sx of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(sx * 58, 40, 20, 12, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(232, 128, 110, 0.3)';
      ctx.fill();
    }

    // рот
    if (state === 'sad') {
      ctx.beginPath();
      ctx.moveTo(-20, 62);
      ctx.quadraticCurveTo(0, 48, 20, 62);
      ctx.strokeStyle = '#7d3a2c';
      ctx.lineWidth = 5;
      ctx.stroke();
    } else if (state === 'chew') {
      const open = 6 + chew * 16;
      ctx.beginPath();
      ctx.ellipse(MOUTH.x, MOUTH.y + 12, 26, open, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#5c1f1f';
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(MOUTH.x, MOUTH.y + 12 + open * 0.4, 16, open * 0.45, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#cf5a5a';
      ctx.fill();
    } else {
      // открытый рот — ждёт чекушку
      const open = 30 + Math.sin(t * 2.4) * 3;
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(MOUTH.x, MOUTH.y + 10, 40, open, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#4a1414';
      ctx.fill();
      ctx.strokeStyle = 'rgba(90, 30, 25, 0.8)';
      ctx.lineWidth = 3;
      ctx.stroke();
      // язык
      ctx.beginPath();
      ctx.ellipse(MOUTH.x, MOUTH.y + 10 + open * 0.45, 24, open * 0.42, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#d1615f';
      ctx.fill();
      // зубы
      ctx.beginPath();
      ctx.moveTo(-34, MOUTH.y + 10 - open + 6);
      ctx.quadraticCurveTo(0, MOUTH.y + 10 - open + 18, 34, MOUTH.y + 10 - open + 6);
      ctx.lineTo(34, MOUTH.y + 10 - open + 2);
      ctx.quadraticCurveTo(0, MOUTH.y + 10 - open + 12, -34, MOUTH.y + 10 - open + 2);
      ctx.closePath();
      ctx.fillStyle = '#fbf7ee';
      ctx.fill();
      ctx.restore();
    }

    // лёгкая ухмылка по краям
    if (state === 'idle') {
      ctx.beginPath();
      ctx.arc(0, MOUTH.y + 10, 52, 0.25, Math.PI - 0.25);
      ctx.strokeStyle = 'rgba(140, 70, 50, 0.35)';
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    ctx.restore();
    ctx.restore();
  }

  // ---------- ножницы-курсор ----------
  function drawScissors(ctx, x, y, angle, open, dragging) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    const spread = dragging ? 0.05 : 0.22 + open * 0.25;
    for (const dir of [-1, 1]) {
      ctx.save();
      ctx.rotate(dir * spread);
      // лезвие
      ctx.beginPath();
      ctx.moveTo(-2, 0);
      ctx.lineTo(40, -5);
      ctx.lineTo(40, 1);
      ctx.closePath();
      const bg = ctx.createLinearGradient(0, -6, 0, 6);
      bg.addColorStop(0, '#f4f7fa');
      bg.addColorStop(1, '#9aa7b2');
      ctx.fillStyle = bg;
      ctx.fill();
      ctx.strokeStyle = '#5c6771';
      ctx.lineWidth = 1.4;
      ctx.stroke();
      // ручка
      ctx.beginPath();
      ctx.arc(-16, dir * 4, 9, 0, Math.PI * 2);
      ctx.fillStyle = '#c8382f';
      ctx.fill();
      ctx.strokeStyle = '#8d241d';
      ctx.lineWidth = 2;
      ctx.stroke();
      // шейка ручки
      ctx.beginPath();
      ctx.moveTo(-8, dir * 4);
      ctx.lineTo(-2, 0);
      ctx.strokeStyle = '#a8302a';
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.restore();
    }
    // винт
    ctx.beginPath();
    ctx.arc(0, 0, 3.2, 0, Math.PI * 2);
    ctx.fillStyle = '#5c6771';
    ctx.fill();
    ctx.restore();
  }

  return {
    MOUTH,
    buildBackground,
    drawRope,
    drawAnchor,
    drawBottle,
    drawStar,
    drawHazard,
    drawFan,
    drawMellstroy,
    drawScissors,
    roundRect,
  };
})();
