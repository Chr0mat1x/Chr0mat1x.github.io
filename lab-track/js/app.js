/* ============================================================
   ЛАБ-ТРЕК · игровой движок
   ============================================================ */
(() => {
  'use strict';

  const LS_KEY = 'labtrack-v1';
  const $ = s => document.querySelector(s);
  const app = $('#app');
  const hud = $('#hud');

  /* ---------------- состояние ---------------- */
  const defaults = () => ({
    name: '',
    xp: 0,
    unlocked: ['mechanics'],
    sectorsDone: {},
    stars: {},
    modulesDone: {},
    bestAcc: {},
    ach: [],
    maxStreak: 0,
    examGrade: null,
    correct: 0,
    total: 0,
    speedHits: 0
  });

  let S = load();
  function load() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return defaults();
      return Object.assign(defaults(), JSON.parse(raw));
    } catch (e) { return defaults(); }
  }
  function save() { localStorage.setItem(LS_KEY, JSON.stringify(S)); }

  /* ---------------- уровни / XP ---------------- */
  const LEVELS = (() => {
    const m = {};
    for (let l = 1; l <= 60; l++) m[l] = Math.round(70 * Math.pow(l, 1.3));
    return m;
  })();
  function levelInfo(xp) {
    let lvl = 1, base = 0, next = LEVELS[1];
    while (xp >= next && lvl < 60) { lvl++; base = next; next = LEVELS[lvl]; }
    return { lvl, cur: xp - base, need: next - base };
  }
  function addXp(n) {
    const before = levelInfo(S.xp).lvl;
    S.xp += n;
    const after = levelInfo(S.xp).lvl;
    if (after > before) showToast(`Уровень ${after}! Продолжай разгон.`, 'lv');
    updateHud();
  }

  /* ---------------- утилиты ---------------- */
  const $A = a => a[Math.floor(Math.random() * a.length)];
  const shuffle = a => {
    a = a.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const sec = id => SECTORS.find(s => s.id === id);
  const isDone = id => !!S.sectorsDone[id];
  const isUnlocked = id => S.unlocked.includes(id);
  const isExamSec = id => id === 'exam';

  /* ---------------- иконки (монохромные, без эмодзи) ---------------- */
  const ICONS = {
    flask: '<path d="M9 3h6"/><path d="M10 3v5.2L4.6 17.4A2 2 0 0 0 6.4 20.5h11.2a2 2 0 0 0 1.8-3.1L14 8.2V3"/><path d="M7.4 14.5h9.2"/>',
    robot: '<rect x="4" y="8.5" width="16" height="10.5" rx="3"/><path d="M12 4.2v4"/><circle cx="12" cy="3.2" r="1.3"/><circle cx="9" cy="13.5" r="1.15" fill="currentColor" stroke="none"/><circle cx="15" cy="13.5" r="1.15" fill="currentColor" stroke="none"/><path d="M9.5 16.6h5"/>',
    cap: '<path d="M2.2 9.2 12 5.2l9.8 4-9.8 4-9.8-4Z"/><path d="M6 11.2v4.6c0 1.2 2.7 2.6 6 2.6s6-1.4 6-2.6v-4.6"/><path d="M21.8 9.2v5"/>',
    lock: '<rect x="5" y="10.5" width="14" height="9.5" rx="2.2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
    check: '<path d="M4 12.5 9.2 18 20 6.5"/>',
    bolt: '<path d="M13 2 4.5 13.5H11l-1 8.5L19.5 10.5H13l1-8.5Z"/>',
    flame: '<path d="M12 3c3 4 6 5.4 6 9a6 6 0 0 1-12 0c0-2 1-3.3 2.6-5 .3 1.7 1.2 2.4 2.2 2.6C10 7.5 11 5.4 12 3Z"/>',
    gear: '<circle cx="12" cy="12" r="3.2"/><path d="M12 2.3v2.6M12 19.1v2.6M2.3 12h2.6M19.1 12h2.6M4.9 4.9l1.9 1.9M17.2 17.2l1.9 1.9M19.1 4.9l-1.9 1.9M6.8 17.2l-1.9 1.9"/>',
    snow: '<path d="M12 2v20M3.6 6.9l16.8 10.2M20.4 6.9 3.6 17.1"/><path d="M12 6l2.3-2.1M12 6 9.7 3.9M12 18l2.3 2.1M12 18l-2.3 2.1"/>',
    wave: '<path d="M2 10c2-3.2 4-3.2 6 0s4 3.2 6 0 4-3.2 6 0"/><path d="M2 16c2-3.2 4-3.2 6 0s4 3.2 6 0 4-3.2 6 0"/>',
    atom: '<circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/><ellipse cx="12" cy="12" rx="9.6" ry="4.1"/><ellipse cx="12" cy="12" rx="9.6" ry="4.1" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="9.6" ry="4.1" transform="rotate(120 12 12)"/>',
    star: '<path d="M12 3.2l2.6 5.5 6 .8-4.4 4.2 1.2 5.9L12 16.8l-5.4 2.8 1.2-5.9L3.4 9.5l6-.8L12 3.2Z"/>',
    diamond: '<path d="M6.4 3h11.2l3.4 6-9 12L3 9l3.4-6Z"/><path d="M3 9h18M9 3 7.2 9 12 21l4.8-12L15 3"/>',
    rocket: '<path d="M12 3c3 1.8 5 5.2 5 9l-2.4 2.4H9.4L7 12c0-3.8 2-7.2 5-9Z"/><circle cx="12" cy="9.2" r="1.6"/><path d="M9.4 14.4 6.5 17.4l1 3 3-1.1M14.6 14.4l2.9 3-1 3-3-1.1"/>',
    plug: '<path d="M9 2.5v4.6M15 2.5v4.6"/><path d="M6 7.1h12v4a6 6 0 0 1-12 0v-4Z"/><path d="M12 17.1v4.4"/>'
  };
  function icon(name) {
    return `<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;
  }

  function currentSectorId() {
    for (const s of SECTORS) if (isUnlocked(s.id) && !isDone(s.id) && !isExamSec(s.id)) return s.id;
    if (isUnlocked('exam') && !isDone('exam')) return 'exam';
    return 'exam';
  }

  /* ---------------- тосты ---------------- */
  const toasts = $('#toasts');
  function showToast(msg, type = '') {
    const el = document.createElement('div');
    el.className = 'toast' + (type ? ' ' + type : '');
    el.textContent = msg;
    toasts.appendChild(el);
    setTimeout(() => { el.style.transition = 'opacity .45s'; el.style.opacity = '0'; setTimeout(() => el.remove(), 450); }, 2600);
    while (toasts.children.length > 3) toasts.firstChild.remove();
  }

  /* ---------------- достижения ---------------- */
  function grant(id) {
    if (S.ach.includes(id)) return;
    const a = ACHIEVEMENTS.find(x => x.id === id);
    if (!a) return;
    S.ach.push(id);
    showToast(`Метка: ${a.name} ${a.icon}`, 'ach');
  }
  function checkAch() {
    if (S.correct >= 1) grant('first');
    if (S.maxStreak >= 5) grant('streak5');
    if (S.maxStreak >= 10) grant('streak10');
    if (S.sectorsDone.mechanics) grant('s_mechanics');
    if (S.sectorsDone.thermal) grant('s_thermal');
    if (S.sectorsDone.electric) grant('s_electric');
    if (S.sectorsDone.waves) grant('s_waves');
    if (S.sectorsDone.quantum) grant('s_quantum');
    if (S.sectorsDone.exam || isDone('exam')) grant('exam_done');
    if (isDone('exam') && Object.keys(S.sectorsDone).length >= SECTORS.length) grant('all_sectors');
    if (Object.values(S.stars).some(v => v >= 3)) grant('three_stars');
    if (Object.values(S.bestAcc).some(v => v === 100)) grant('flawless');
    if (S.speedHits >= 1) grant('speed');
  }

  /* ---------------- HUD ---------------- */
  function updateHud() {
    hud.hidden = false;
    const li = levelInfo(S.xp);
    $('#hudName').textContent = S.name || 'Лаборант';
    $('#hudLevel').textContent = 'Ур. ' + li.lvl;
    $('#hudStreak').textContent = '✦ ' + S.maxStreak;
    $('#hudXpBar').style.width = Math.round(li.cur / Math.max(1, li.need) * 100) + '%';
  }

  /* ---------------- роутер ---------------- */
  const views = {};

  function show(name, params) {
    clearInterval(timer);
    updateHud();
    const fn = views[name];
    if (!fn) return;
    hud.hidden = name === 'welcome' && !S.name;
    app.innerHTML = fn(params || {});
    document.querySelectorAll('.hud-nav [data-nav]').forEach(b => b.classList.remove('on'));
    const id = ['map', 'formulas', 'achievements'].includes(name) ? name : 'map';
    const nb = hud.querySelector(`.hud-nav [data-nav="${id}"]`);
    if (nb) nb.classList.add('on');
    window.scrollTo(0, 0);
  }

  /* ================= WELCOME ================= */
  views.welcome = () => {
    const li = levelInfo(S.xp);
    return `
    <section class="view center stagger">
      <p class="kicker">Физика · ОГЭ · Игра</p>
      <div class="orb-field" style="margin-top:44px">
        <div class="orb orb-1"></div>
        <div class="orb orb-2"></div>
        <div class="orb orb-3"></div>
        <div class="orb orb-4"></div>
        <div class="orb orb-5"></div>
        <div class="orb orb-6"></div>
      </div>
      <h1 class="title-big" style="margin-top:6px">ЛАБ-<span class="accent">ТРЕК</span></h1>
      <p class="sub mt-sm">Разгони заряд знаний в ускорителе <b>«Импульс»</b>.<br>Пять секторов физики, боссы, формулы и метки — готовься к ОГЭ играючи.</p>
      <hr class="intro-rule">
      ${S.name ? `
        <p class="mono dim">С возвращением, <b class="accent">${esc(S.name)}</b> · ур. ${li.lvl} · меток ${S.ach.length}</p>
        <div class="row mt"><button class="btn primary big" data-nav="map">Продолжить разгон</button>
        <button class="btn ghost big" data-action="reset">Новый лаборант</button></div>
      ` : `
        <form class="name-form" id="nameForm">
          <input class="name-input" id="nameInput" maxlength="24" placeholder="Имя лаборанта" autocomplete="off">
          <button class="btn primary" type="submit">Начать</button>
        </form>
        <p class="statrow"><span>5 секторов</span><span>50+ заданий</span><span>босс-битвы</span><span>формулы</span></p>
      `}
    </section>`;
  };

  /* ================= MAP ================= */
  views.map = () => {
    const cur = currentSectorId();
    const li = levelInfo(S.xp);
    const doneCount = Object.keys(S.sectorsDone).length;
    return `
    <section class="view">
      <div class="stagger">
        <div class="row spread">
          <div>
            <p class="kicker">Станция «Импульс»</p>
            <h1 class="title-big" style="font-size:clamp(1.6rem,5vw,2.9rem)">Карта <span class="accent">ускорителя</span></h1>
          </div>
          <div class="panel pad" style="min-width:215px">
            <div class="mono faint" style="font-size:.7rem;letter-spacing:.2em;text-transform:uppercase">Лаборант</div>
            <div class="mono" style="font-size:1.45rem;font-weight:700;color:var(--amber);overflow:hidden;text-overflow:ellipsis">${esc(S.name)}</div>
            <div class="mono dim" style="font-size:.8rem">ур. ${li.lvl}</div>
            <div class="hud-xp" style="max-width:none;margin:9px 0 5px"><div class="hud-xp-inner" style="width:${Math.round(li.cur / Math.max(1, li.need) * 100)}%"></div></div>
            <div class="mono dim" style="font-size:.72rem">${li.cur} / ${li.need} X</div>
          </div>
        </div>
        <div class="panel pad mt ring-card">${ringSVG()}</div>
        <div class="statrow" style="margin-top:22px">
          <span>Секторов: <b>${doneCount} / ${SECTORS.length}</b></span>
          <span>Точность: <b>${S.total ? Math.round(S.correct / S.total * 100) : 0}%</b></span>
          <span>Лучшая серия: <b>${S.maxStreak}</b></span>
          <span>Меток: <b>${S.ach.length} / ${ACHIEVEMENTS.length}</b></span>
        </div>
        <p class="dim mt" style="font-size:.86rem;text-align:center">Кликни по сектору, чтобы войти. Пройди модуль → сразись с боссом → открой следующий сектор.</p>
      </div>
    </section>`;
  };

  function ringSVG() {
    const cx = 360, cy = 360, R = 248;
    const cur = currentSectorId();
    const col = { done: '#5ee08a', current: '#ffb340', next: '#3f5d8c', locked: '#2b3d57' };
    let nodes = '';
    SECTORS.forEach((ssec, i) => {
      const ang = (-90 + i * 60) * Math.PI / 180;
      const x = cx + R * Math.cos(ang), y = cy + R * Math.sin(ang);
      const done = isDone(ssec.id);
      const unlocked = isUnlocked(ssec.id);
      const cls = done ? 'done' : unlocked ? (ssec.id === cur ? 'current' : 'next') : 'locked';
      const c = col[cls];
      const inner = cls === 'current' || cls === 'done' ? c : '#0d1520';
      const txt = cls === 'current' ? '#1a1205' : cls === 'locked' ? '#4a6188' : cls === 'done' ? '#06210f' : '#c7d5e6';
      let below;
      if (cls === 'locked') {
        below = `<svg x="${x - 9}" y="${y + 4}" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4a6188" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS.lock}</svg>`;
      } else if (done) {
        below = `<svg x="${x - 9}" y="${y + 4}" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#06210f" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${ICONS.check}</svg>`;
      } else {
        below = `<text x="${x}" y="${y + 19}" text-anchor="middle" fill="${txt}" font-size="9.5" letter-spacing="1" font-family="JetBrains Mono, monospace">${ssec.short}</text>`;
      }
      nodes += `
        <g class="node-link ${cls}" data-sector="${ssec.id}" role="button" tabindex="0" aria-label="${ssec.title}">
          <circle class="node-glow" cx="${x}" cy="${y}" r="46" fill="${c}" opacity=".3"/>
          <circle class="node-port" cx="${x}" cy="${y}" r="34" fill="${inner}" stroke="${c}" stroke-width="2.5"/>
          <circle cx="${x}" cy="${y}" r="34" fill="none" stroke="${c}" stroke-width=".6" opacity=".45" stroke-dasharray="4 5"/>
          <text class="node-num" x="${x}" y="${y + 2}" text-anchor="middle" fill="${txt}" font-size="18" font-weight="700" font-family="JetBrains Mono, monospace">${ssec.code}</text>
          ${below}
        </g>`;
    });
    let arcs = '';
    for (let i = 0; i < SECTORS.length; i++) {
      const a1 = (-90 + i * 60) * Math.PI / 180;
      const a2 = (-90 + (i + 1) * 60) * Math.PI / 180;
      const x1 = cx + R * Math.cos(a1), y1 = cy + R * Math.sin(a1);
      const x2 = cx + R * Math.cos(a2), y2 = cy + R * Math.sin(a2);
      arcs += `<path d="M ${x1} ${y1} A ${R} ${R} 0 0 1 ${x2} ${y2}" fill="none" stroke="#24405f" stroke-width="1.6" stroke-dasharray="3 7" opacity=".55"/>`;
    }
    const li = levelInfo(S.xp);
    return `
    <svg class="ring-svg" viewBox="0 0 720 720" role="img" aria-label="Карта секторов">
      <circle cx="${cx}" cy="${cy}" r="294" fill="none" stroke="#1b2c45" stroke-width="1.5" opacity=".7"/>
      <circle cx="${cx}" cy="${cy}" r="302" fill="none" stroke="#16243a" stroke-width="9" stroke-dasharray="1 26" opacity=".6"/>
      <circle cx="${cx}" cy="${cy}" r="120" fill="none" stroke="#1e3350" stroke-width="1" stroke-dasharray="5 8" opacity=".8"/>
      ${arcs}
      <g class="beam-rotor"><circle class="beam-dot" cx="${cx}" cy="${cy - 298}" r="6" fill="#ffb340"/></g>
      ${nodes}
      <text class="ring-label" x="${cx}" y="${cy - 20}" text-anchor="middle" font-size="30" font-family="Unbounded, sans-serif" font-weight="800">ЛАБ-ТРЕК</text>
      <text class="ring-label amber" x="${cx}" y="${cy + 15}" text-anchor="middle" font-size="12" letter-spacing="4">УРОВЕНЬ ${li.lvl}</text>
      <text class="ring-label" x="${cx}" y="${cy + 41}" text-anchor="middle" font-size="11" letter-spacing="2">разгон знаний</text>
    </svg>`;
  }

  /* ================= SECTOR (интро) ================= */
  views.sector = p => {
    const s = sec(p.id);
    if (!s) return views.map();
    const isExam = isExamSec(s.id);
    const done = isDone(s.id);
    const curr = currentSectorId();
    const acc = S.bestAcc[s.id];
    const stars = S.stars[s.id] || 0;
    const bossOpen = S.modulesDone[s.id] || done;

    const moduleBtn = `
      <button class="action-btn" data-action="module" data-sector="${s.id}">
        <span class="ab-icon" style="color:var(--cyan)">${icon('flask')}</span>
        <span><span class="ab-t">Тренировочный модуль</span>
        <span class="ab-d">8 вопросов по теме · с пояснениями</span></span>
        <span class="ab-meta">${acc != null ? 'точность ' + acc + '%' : 'не пройден'}</span>
      </button>`;

    const bossBtn = isExam ? `
      <button class="action-btn" data-action="exam" data-sector="exam">
        <span class="ab-icon" style="color:var(--amber)">${icon('cap')}</span>
        <span><span class="ab-t">Старт экзамена</span>
        <span class="ab-d">15 заданий · 30 секунд на задание · оценка 2–5</span></span>
        <span class="ab-meta">${S.examGrade != null ? 'оценка ' + S.examGrade : 'доступен'}</span>
      </button>` : `
      <button class="action-btn ${bossOpen ? '' : 'locked'}" data-action="boss" data-sector="${s.id}" ${bossOpen ? '' : 'disabled'}>
        <span class="ab-icon" style="color:${s.bossAccent}">${icon('robot')}</span>
        <span><span class="ab-t">Битва с боссом</span>
        <span class="ab-d">${esc(s.boss)} · ${s.bossTag}</span></span>
        <span class="ab-meta">${done ? 'пройден ✓' : bossOpen ? 'доступен' : 'после модуля'}</span>
      </button>`;

    return `
    <section class="view">
      <div class="stagger">
        <div class="row spread">
          <div>
            <p class="kicker">Сектор ${s.code} · ${s.short}</p>
            <h1 class="title-big" style="font-size:clamp(1.7rem,5.5vw,3.2rem)">${s.title}</h1>
          </div>
          <div class="panel pad"><span class="stars">${starRow(stars)}</span></div>
        </div>
        <p class="sub mt">${s.desc}</p>

        <div class="sector-layout">
          <div class="panel pad">
            <h3 class="mono" style="font-size:.78rem;color:var(--cyan);letter-spacing:.2em;text-transform:uppercase">Темы сектора</h3>
            <ul class="spec-list">
              ${s.themes.map((t, i) => `<li><span class="bul">${String(i + 1).padStart(2, '0')}</span>${t}</li>`).join('')}
            </ul>
          </div>
          <div class="action-stack">
            ${isExam ? '' : moduleBtn}
            ${bossBtn}
            ${curr === s.id && !done && !isExam ? `<p class="dim mt-sm" style="font-size:.85rem">▶ Это твой следующий сектор: пройди модуль, затем босса.</p>` : ''}
          </div>
        </div>

        <div class="panel pad mt" style="border-left:3px solid var(--amber);display:flex;gap:12px;align-items:flex-start">
          <span style="color:var(--amber);flex:none;font-size:1.4rem;line-height:1.2">${icon('robot')}</span>
          <p class="mono" style="font-size:.95rem"><b style="color:var(--amber)">${esc(s.boss)}</b> <span class="dim">— ${s.intro}</span></p>
        </div>

        <div class="row mt-lg"><button class="btn ghost" data-nav="map">← Карта</button></div>
      </div>
    </section>`;
  };

  function starRow(n) {
    let out = '';
    for (let i = 1; i <= 3; i++) {
      const on = n >= i;
      out += `<svg class="star ${on ? 'lit' : ''}" viewBox="0 0 24 24" fill="${on ? '#ffb340' : '#3a4a63'}"><path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.2 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z"/></svg>`;
    }
    return out;
  }

  /* ================= КВИЗ-ДВИЖОК ================= */
  let Q = null;
  let timer = null;

  function startModule(sectorId) {
    Q = {
      type: 'module', sectorId,
      pool: shuffle(QUESTIONS[sectorId]).slice(0, 8),
      i: 0, total: 8, correct: 0, combo: 0, streak: 0,
      bossHp: 0, bossMaxHp: 0, lives: 0, exam: false
    };
    renderQuiz();
  }

  function startBoss(sectorId) {
    const s = sec(sectorId);
    Q = {
      type: 'boss', sectorId,
      pool: shuffle(QUESTIONS[sectorId]).slice(0, 8),
      i: 0, total: 8, correct: 0, combo: 0, streak: 0,
      bossHp: 6, bossMaxHp: 6, lives: 3, exam: false,
      bossName: s.boss, bossAccent: s.bossAccent, bossVisor: s.visor, bossTag: s.bossTag
    };
    renderQuiz();
  }

  function startExam() {
    const chosen = shuffle([...EXAM_POOL.keys()]).slice(0, 15).map(k => EXAM_POOL[k]);
    Q = {
      type: 'exam', sectorId: 'exam',
      pool: chosen.map(([sid, qi]) => QUESTIONS[sid][qi]),
      i: 0, total: 15, correct: 0, combo: 0, streak: 0,
      bossHp: 0, bossMaxHp: 0, lives: 0, exam: true
    };
    renderQuiz();
  }

  function renderQuiz() {
    clearInterval(timer);
    updateHud();
    const qItem = Q.pool[Q.i];
    const idx = Q.i + 1;
    const isBoss = Q.type === 'boss';
    const s = sec(Q.sectorId);
    const title = Q.exam ? 'ЭКЗАМЕН' : (isBoss ? `БИТВА · ${Q.bossName}` : `СЕКТОР ${s.code} · ${s.short}`);

    const optsHtml = `<div id="opts">
      ${qItem.opts.map((o, i) =>
        `<button class="opt" data-i="${i}"><span class="let">${String.fromCharCode(65 + i)}</span><span>${o}</span></button>`).join('')}
    </div>`;

    const body = isBoss ? `
      <div class="boss-stage">
        <div class="boss-figure idle" id="bossFigure">
          ${bossSVG(Q.bossVisor)}
          <div class="boss-name" style="color:${Q.bossAccent}">${esc(Q.bossName)}</div>
          <div class="boss-tag">${Q.bossTag}</div>
        </div>
        <div>
          ${bossBar()}
          <div class="timer-shell" style="margin-top:16px"><div class="timer-bar" id="timerBar"></div></div>
          <div class="q-meta">Задание ${idx} / ${Q.total} · верный ответ наносит урон</div>
          <div class="q-text">${qItem.q}</div>
          ${optsHtml}
          <div class="feedback" id="feedback"></div>
        </div>
      </div>` : `
      <div class="quiz-top">
        <span>${title}</span>
        <div class="quiz-progress"><i style="width:${idx / Q.total * 100}%"></i></div>
        <span class="mono">${idx} / ${Q.total}</span>
        <span class="combo ${Q.combo < 2 ? 'zero' : ''}">×${Q.combo}</span>
      </div>
      <div class="timer-shell"><div class="timer-bar" id="timerBar"></div></div>
      <div class="q-meta">Задание ${idx} / ${Q.total} · трек ${title}</div>
      <div class="q-text">${qItem.q}</div>
      ${optsHtml}
      <div class="feedback" id="feedback"></div>`;

    app.innerHTML = `
      <section class="view">
        <div class="panel pad" style="max-width:860px;margin:0 auto">
          ${body}
        </div>
      </section>`;

    app.querySelectorAll('#opts .opt').forEach(o => o.addEventListener('click', () => {
      if (o.disabled) return;
      o.disabled = true;
      onAnswer(Number(o.dataset.i));
    }));

    Q.tLeft = 30; Q.tMax = 30;
    const tb = $('#timerBar');
    const step = () => {
      Q.tLeft -= 0.1;
      if (Q.tLeft <= 5) tb.classList.add('low');
      tb.style.width = Math.max(0, Q.tLeft / Q.tMax * 100) + '%';
      if (Q.tLeft <= 0) { clearInterval(timer); onAnswer(-1); }
    };
    timer = setInterval(step, 100);
  }

  function bossBar() {
    const hpPct = Q.bossHp / Q.bossMaxHp * 100;
    return `
      <div class="hp-wrap">
        <div class="hp-labels"><span>${esc(Q.bossName)}</span><b id="hpNum">${Q.bossHp} / ${Q.bossMaxHp}</b></div>
        <div class="hp-track ${Q.bossHp <= 0 ? 'dead' : ''}" id="hpTrack"><div class="hp-fill" id="hpFill" style="width:${hpPct}%"></div></div>
        <div class="player-hp" id="playerHp">${[0, 1, 2].map(i => `<span class="shield ${i < Q.lives ? '' : 'lost'}">⚡</span>`).join('')}</div>
      </div>`;
  }

  function bossSVG(vc) {
    return `
    <svg class="boss-svg" viewBox="0 0 200 170" aria-hidden="true">
      <defs><filter id="vglow"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
      <rect x="30" y="58" width="140" height="86" rx="22" fill="#16243a" stroke="${vc}" stroke-width="2.5"/>
      <rect x="54" y="30" width="92" height="14" rx="7" fill="#1c2e49" stroke="#3b5780" stroke-width="1.5"/>
      <circle cx="62" cy="37" r="4" fill="#ff5f52"/>
      <circle cx="138" cy="37" r="4" fill="#ffb340"/>
      <rect class="visir-glow" x="52" y="78" width="96" height="40" rx="12" fill="#0a0f16" stroke="${vc}" stroke-width="2.5" style="color:${vc}"/>
      <circle cx="84" cy="98" r="10" fill="${vc}" opacity=".9"/>
      <circle cx="116" cy="98" r="10" fill="${vc}" opacity=".9"/>
      <rect x="100" y="90" width="4" height="16" rx="2" fill="${vc}"/>
      <rect x="78" y="128" width="44" height="7" rx="3.5" fill="#0a0f16" stroke="${vc}" stroke-width="1.5" opacity=".8"/>
      <circle cx="28" cy="100" r="10" fill="none" stroke="#3b5780" stroke-width="2" stroke-dasharray="3 3"/>
      <circle cx="172" cy="100" r="10" fill="none" stroke="#3b5780" stroke-width="2" stroke-dasharray="3 3"/>
      <path d="M100 30 v-16" stroke="#3b5780" stroke-width="2.5"/>
      <circle cx="100" cy="8" r="5" fill="${vc}" style="color:${vc}"/>
    </svg>`;
  }

  function onAnswer(choice) {
    clearInterval(timer);
    const qItem = Q.pool[Q.i];
    const opts = [...app.querySelectorAll('#opts .opt')];
    const fb = $('#feedback');
    opts.forEach(o => o.disabled = true);
    const correct = choice === qItem.ans;

    if (correct) {
      S.correct++; S.total++;
      Q.correct++; Q.combo++; Q.streak++;
      S.maxStreak = Math.max(S.maxStreak, Q.streak);
      if (Q.tLeft >= Q.tMax - 5 && Q.streak === 1) S.speedHits++;
      const comboEl = app.querySelector('.combo');
      if (comboEl) { comboEl.textContent = '×' + Q.combo; comboEl.classList.toggle('zero', Q.combo < 2); }
      const xp = 10 + Math.min(Q.combo, 6) * 2;
      opts[qItem.ans].classList.add('correct');
      if (Q.type === 'boss') {
        const dmg = 1 + (Q.combo >= 3 ? 1 : 0);
        Q.bossHp = Math.max(0, Q.bossHp - dmg);
        addXp(xp + 5);
        const fig = $('#bossFigure');
        if (fig) { fig.classList.add('hit'); setTimeout(() => fig.classList.remove('hit'), 380); }
        const hf = $('#hpFill');
        if (hf) hf.style.width = Q.bossHp / Q.bossMaxHp * 100 + '%';
        const hn = $('#hpNum');
        if (hn) hn.textContent = `${Q.bossHp} / ${Q.bossMaxHp}`;
        const boom = document.createElement('div');
        boom.className = 'boom show';
        boom.innerHTML = icon('star');
        $('#app .panel').prepend(boom);
        setTimeout(() => boom.remove(), 850);
        feedback(fb, 'ok', `● <b style="color:var(--green)">УДАР ${dmg === 2 ? '×' : ''}${dmg}</b>${dmg === 2 ? ' <span class="dim">КРИТ!</span>' : ''} · +${xp + 5} X`, qItem.hint, bossAfter);
      } else {
        addXp(xp);
        feedback(fb, 'ok', `● Верно · <b style="color:var(--green)">+${xp} X</b> · серия ×${Q.combo}`, qItem.hint, nextStep);
      }
    } else {
      S.total++;
      Q.combo = 0;
      opts.forEach((o, i) => {
        if (i === qItem.ans) o.classList.add('correct');
        else if (i === choice) o.classList.add('wrong');
        else o.classList.add('dim');
      });
      if (Q.type === 'boss') {
        Q.lives--;
        const ph = $('#playerHp');
        if (ph) ph.innerHTML = [0, 1, 2].map(i => `<span class="shield ${i < Q.lives ? '' : 'lost'}">⚡</span>`).join('');
        if (Q.lives <= 0) { defeat(); return; }
        feedback(fb, 'no', '● Промах · <span class="dim">щиты просели</span>', qItem.hint, bossAfter);
      } else {
        feedback(fb, 'no', '● Неверно', qItem.hint, nextStep);
      }
    }
    save();
    checkAch();
  }

  function feedback(fb, typ, head, hint, next) {
    fb.className = 'feedback show ' + typ;
    fb.innerHTML = `<div class="fb-head">${head}</div><div class="fb-text">${hint}</div>
      <div class="mt-sm"><button class="btn primary" id="fbNext">Продолжить →</button></div>`;
    $('#fbNext').onclick = next;
  }

  function bossAfter() {
    if (Q.bossHp <= 0) {
      const fig = $('#bossFigure');
      if (fig) fig.classList.add('dead');
      setTimeout(bossVictory, 1000);
      return;
    }
    if (Q.lives <= 0) { defeat(); return; }
    nextStep();
  }

  function nextStep() {
    Q.i++;
    if (Q.i >= Q.total) {
      if (Q.type === 'module') moduleResult();
      else if (Q.type === 'exam') finishExam();
      else if (Q.type === 'boss') { if (Q.bossHp > 0) Q.bossHp = 0; bossVictory(); }
      return;
    }
    renderQuiz();
  }

  function defeat() {
    const s = sec(Q.sectorId);
    app.innerHTML = `
      <section class="view center">
        <p class="kicker">Статус: разрядка</p>
        <h1 class="title-big" style="font-size:clamp(2rem,8vw,4.4rem)"><span class="accent">ПОРАЖЕНИЕ</span></h1>
        <p class="sub mt">${esc(Q.bossName)} вырубил твои щиты. Формулы уже близко — попробуй ещё раз.</p>
        <div class="row mt-lg">
          <button class="btn primary big" data-action="boss" data-sector="${s.id}">Реванш</button>
          <button class="btn ghost big" data-nav="map">К карте</button>
        </div>
      </section>`;
  }

  function moduleResult() {
    const s = sec(Q.sectorId);
    const acc = Math.round(Q.correct / Q.total * 100);
    S.modulesDone[s.id] = true;
    S.bestAcc[s.id] = Math.max(S.bestAcc[s.id] || 0, acc);
    save();
    checkAch();
    app.innerHTML = `
      <section class="view center">
        <p class="kicker">Модуль завершён</p>
        <h1 class="title-big" style="font-size:clamp(1.9rem,7vw,3.4rem)">${Q.correct} <span class="dim" style="font-size:.5em">из ${Q.total}</span></h1>
        <div class="result-score">
          <div class="big-num">${acc}<small>%</small></div>
          <div class="xp-splash">точность ${acc}% · формулы закреплены — босс ждёт</div>
        </div>
        <div class="result-actions">
          <button class="btn primary big" data-action="boss" data-sector="${s.id}">К боссу →</button>
          <button class="btn ghost big" data-action="module" data-sector="${s.id}">Ещё раз</button>
          <button class="btn ghost big" data-nav="map">Карта</button>
        </div>
      </section>`;
  }

  function finishExam() {
    const score = Q.correct;
    const g = gradeOf(score);
    S.examGrade = g;
    S.sectorsDone.exam = true;
    S.modulesDone.exam = true;
    S.stars.exam = Math.max(S.stars.exam || 0, g >= 5 ? 3 : g >= 4 ? 2 : g >= 3 ? 1 : 0);
    save();
    checkAch();
    app.innerHTML = `
      <section class="view center">
        <p class="kicker">Тренировочный ОГЭ</p>
        <h1 class="title-big" style="font-size:clamp(1.9rem,7vw,3.4rem)">Баллы: <span class="accent">${score}</span><span class="dim" style="font-size:.5em"> / ${Q.total}</span></h1>
        <div class="result-score">
          <div class="big-num">${gradeOf(score)}<small>оценка</small></div>
          <div class="xp-splash">+${score * 12} X · шкала 5-балльная</div>
        </div>
        <p class="sub mt">${verdictOf(gradeOf(score))}</p>
        <div class="result-actions mt-lg">
          <button class="btn primary big" data-nav="map">К карте →</button>
          <button class="btn ghost big" data-action="exam">Пересдача</button>
        </div>
      </section>`;
    S.examGrade = gradeOf(score);
    addXp(score * 12);
    save();
    checkAch();
  }

  function gradeOf(score) {
    return score >= 13 ? 5 : score >= 10 ? 4 : score >= 6 ? 3 : 2;
  }
  function verdictOf(g) {
    return g >= 4 ? 'Экзамен сдан! Поздравляю, лаборант.' :
      g === 3 ? 'Почти отлично — подтяни слабые сектора.' :
      'Пока рано. Вернись в сектора и повтори теорию.';
  }

  function bossVictory() {
    const s = sec(Q.sectorId);
    const acc = Math.round(Q.correct / Q.total * 100);
    const firstClear = !S.sectorsDone[s.id];
    S.sectorsDone[s.id] = true;
    S.modulesDone[s.id] = true;
    S.bestAcc[s.id] = Math.max(S.bestAcc[s.id] || 0, acc);
    const stars = acc >= 90 ? 3 : acc >= 70 ? 2 : 1;
    S.stars[s.id] = Math.max(S.stars[s.id] || 0, stars);
    const bonus = 60 + stars * 20;
    addXp(bonus);
    const order = SECTORS.map(x => x.id).filter(x => !isExamSec(x)).concat('exam');
    const idx = order.indexOf(s.id);
    if (idx >= 0 && idx < order.length - 1) {
      const nextId = order[idx + 1];
      if (!S.unlocked.includes(nextId)) {
        S.unlocked.push(nextId);
        showToast(`Открыт сектор «${sec(nextId).title}»`, 'ach');
      }
    }
    save();
    checkAch();
    const msg = $A(PHRASES.bossWin);
    app.innerHTML = `
      <section class="view center">
        <p class="kicker">Боевой статус</p>
        <h1 class="title-big" style="font-size:clamp(1.9rem,7vw,3.6rem)"><span class="accent">${msg}</span></h1>
        <div class="result-score">
          <span class="stars">${starRow(stars)}</span>
          <div class="big-num">${Q.correct}<small>/${Q.total}</small></div>
          <div class="xp-splash">+${bonus} X бонус · точность ${acc}%${firstClear ? ' · сектор очищен' : ''}</div>
        </div>
        <div class="result-actions">
          <button class="btn primary big" data-nav="map">К карте →</button>
          <button class="btn ghost big" data-action="boss" data-sector="${s.id}">Реванш</button>
        </div>
      </section>`;
  }

  /* ================= FORMULAS ================= */
  views.formulas = () => {
    const cards = FORMULAS.map(f => {
      if (!f.items.length) return `
        <div class="panel fcard note">
          <div class="fcard-t"><span class="no">06</span>Шпаргалка экзамена</div>
          <p class="note-body">Формулы всех разделов — в карточках выше. Освежи их перед «Экзаменом».</p>
        </div>`;
      return `
        <div class="panel fcard">
          <div class="fcard-t"><span class="no">${f.no}</span>${f.title}</div>
          <ul class="fs">
            ${f.items.map(([n, ff]) => `<li><span class="fn">${n}</span><span class="ff">${ff}</span></li>`).join('')}
          </ul>
        </div>`;
    }).join('');
    return `
      <section class="view">
        <p class="kicker">Зал формул</p>
        <h1 class="title-big" style="font-size:clamp(1.6rem,5vw,2.8rem)">Формулы и <span class="accent">константы</span></h1>
        <p class="sub mt">Обращайся перед любым сектором — на экзамене такие подсказок не будет.</p>
        <div class="formulas-grid stagger">${cards}</div>
      </section>`;
  };

  /* ================= ACHIEVEMENTS ================= */
  views.achievements = () => {
    const cards = ACHIEVEMENTS.map(a => {
      const got = S.ach.includes(a.id);
      return `
        <div class="panel ach-card ${got ? 'unlocked' : 'locked'}">
          <span class="ach-badge">${icon(a.icon)}</span>
          <span>
            <div class="ach-name">${a.name}</div>
            <div class="ach-desc">${a.desc}</div>
            ${got ? `<div class="ach-stamp">★ получено</div>` : ''}
          </span>
        </div>`;
    }).join('');
    return `
      <section class="view">
        <p class="kicker">Достижения</p>
        <h1 class="title-big" style="font-size:clamp(1.6rem,5vw,2.8rem)">Метки <span class="accent">лаборанта</span></h1>
        <div class="statrow"><span>Получено: <b>${S.ach.length} / ${ACHIEVEMENTS.length}</b></span></div>
        <div class="ach-grid stagger">${cards}</div>
        <div class="mt-lg"><button class="btn ghost" data-action="reset">Сбросить весь прогресс</button></div>
      </section>`;
  };

  /* ================= СОБЫТИЯ ================= */
  document.addEventListener('click', e => {
    const nav = e.target.closest('[data-nav]');
    if (nav) { show(nav.dataset.nav); return; }
    const act = e.target.closest('[data-action]');
    if (act) {
      const a = act.dataset.action;
      if (a === 'reset') {
        if (confirm('Стереть весь прогресс лаборанта?')) {
          S = defaults(); save(); show('welcome');
        }
        return;
      }
      if (a === 'module') startModule(act.dataset.sector);
      if (a === 'boss') startBoss(act.dataset.sector);
      if (a === 'exam') startExam();
      return;
    }
    const node = e.target.closest('.node-link');
    if (node) {
      const sid = node.dataset.sector;
      if (isUnlocked(sid)) show('sector', { id: sid });
      else showToast('Сектор закрыт — сначала разблокируй предыдущий');
    }
  });

  document.addEventListener('keydown', e => {
    if (app.querySelector('#opts') && e.key >= '1' && e.key <= '4') {
      const opts = [...app.querySelectorAll('#opts .opt')];
      const i = Number(e.key) - 1;
      if (opts[i] && !opts[i].disabled) onAnswer(i);
    }
  });

  document.addEventListener('submit', e => {
    if (e.target.id === 'nameForm') {
      e.preventDefault();
      S.name = ($('#nameInput')?.value || '').trim().slice(0, 24) || 'Лаборант';
      save();
      show('map');
    }
  });

  // клики по узлам карты (для accessibility) — Enter/Space
  document.addEventListener('keydown', e => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('.node-link')) {
      e.preventDefault();
      e.target.click();
    }
  });

  /* ================= ЧАСТИЦЫ ================= */
  const cv = $('#particles');
  const pctx = cv.getContext('2d');
  let parts = [];
  function sizeCanvas() {
    cv.width = innerWidth; cv.height = innerHeight;
    const n = Math.min(34, Math.floor(innerWidth / 46));
    parts = Array.from({ length: n }, () => ({
      x: Math.random() * cv.width,
      y: Math.random() * cv.height,
      r: .5 + Math.random() * 1.6,
      vy: -.12 - Math.random() * .34,
      vx: (Math.random() - .5) * .12,
      c: ['255,179,64', '73,215,226', '233,228,211', '255,107,43'][Math.floor(Math.random() * 4)],
      a: .07 + Math.random() * .3
    }));
  }
  function drawParts() {
    pctx.clearRect(0, 0, cv.width, cv.height);
    for (const p of parts) {
      p.x += p.vx; p.y += p.vy;
      if (p.y < -10) { p.y = cv.height + 10; p.x = Math.random() * cv.width; }
      if (p.x < -10) p.x = cv.width + 10;
      if (p.x > cv.width + 10) p.x = -10;
      pctx.beginPath();
      pctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      pctx.fillStyle = `rgba(${p.c},${p.a})`;
      pctx.fill();
    }
    requestAnimationFrame(drawParts);
  }
  sizeCanvas();
  addEventListener('resize', sizeCanvas);
  drawParts();

  /* ================= deep-links (hash) ================= */
  function routeFromHash() {
    const h = (location.hash || '').replace(/^#\/?/, '');
    if (!h) return false;
    const [a, b] = h.split('/');
    if (a === 'sector' && b && sec(b)) { show('sector', { id: b }); return true; }
    if (a === 'module' && b && QUESTIONS[b]) { startModule(b); return true; }
    if (a === 'boss' && b && QUESTIONS[b]) { startBoss(b); return true; }
    if (a === 'exam') { startExam(); return true; }
    if (a === 'formulas') { show('formulas'); return true; }
    if (a === 'ach') { show('achievements'); return true; }
    return false;
  }
  addEventListener('hashchange', () => { if (S.name) routeFromHash(); });

  /* ================= СТАРТ ================= */
  updateHud();
  if (!S.name) show('welcome');
  else if (!routeFromHash()) show('map');
})();