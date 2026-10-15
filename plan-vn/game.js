/* ============================================================
   ПЛАН — вертикальный срез визуальной новеллы
   Движок: тональности, шкалы, мини-игры, концовки
   ============================================================ */

/* ─────────── СОСТОЯНИЕ ─────────── */
const S = {
  stress: 1, humanity: 5, boss: 5, civ: 5, plan: 0,
  day: 1, flags: {}, empathyCount: 0, aggressionCount: 0
};

const TONES = {
  aggression: { ico: '⚡', label: 'Агрессия' },
  bureau:     { ico: '📄', label: 'Канцелярит' },
  empathy:    { ico: '🫀', label: 'Эмпатия' },
  sarcasm:    { ico: '🎭', label: 'Сарказм' }
};

const MAXSCALE = 10;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* ─────────── DOM ─────────── */
const $ = id => document.getElementById(id);
const el = {
  bg: $('bg'), stage: $('stage'), chapter: $('chapterCard'),
  speaker: $('speaker'), text: $('text'), choices: $('choices'), hint: $('hint'),
  nextBtn: $('nextBtn'),
  portrait: $('portraitWrap'), voice: $('voiceLayer'),
  dayNum: $('dayNum'), dayName: $('dayName'), planNum: $('planNum'),
  overlay: $('overlay'), ending: $('ending')
};

/* ─────────── HUD ─────────── */
function updateHUD() {
  el.dayNum.textContent = S.day;
  el.planNum.textContent = S.plan;
  const map = {
    stress: [S.stress, 'barStress', 'valStress'],
    humanity: [S.humanity, 'barHumanity', 'valHumanity'],
    boss: [S.boss, 'barBoss', 'valBoss'],
    civ: [S.civ, 'barCiv', 'valCiv']
  };
  for (const k in map) {
    const [v, bar, val] = map[k];
    $(bar).style.width = (v / MAXSCALE * 100) + '%';
    $(val).textContent = v;
  }
  $('barPlan').style.width = clamp(S.plan / 8 * 100, 0, 100) + '%';
  document.body.classList.toggle('stress-hi', S.stress >= 7);
}

/* ─────────── ЭФФЕКТЫ ВЫБОРА ─────────── */
function applyFx(fx) {
  if (!fx) return;
  const lines = [];
  if (fx.stress)    { S.stress = clamp(S.stress + fx.stress, 0, MAXSCALE); lines.push(`Стресс ${fx.stress > 0 ? '+' : ''}${fx.stress}`); }
  if (fx.humanity)  { S.humanity = clamp(S.humanity + fx.humanity, 0, MAXSCALE); lines.push(`Человечность ${fx.humanity > 0 ? '+' : ''}${fx.humanity}`); }
  if (fx.boss)      { S.boss = clamp(S.boss + fx.boss, 0, MAXSCALE); lines.push(`Начальство ${fx.boss > 0 ? '+' : ''}${fx.boss}`); }
  if (fx.civ)       { S.civ = clamp(S.civ + fx.civ, 0, MAXSCALE); lines.push(`Люди ${fx.civ > 0 ? '+' : ''}${fx.civ}`); }
  if (fx.plan)      { S.plan = clamp(S.plan + fx.plan, 0, 20); lines.push(`План ${fx.plan > 0 ? '+' : ''}${fx.plan}`); }
  if (fx.flag)      for (const f in fx.flag) S.flags[f] = (S.flags[f] || 0) + fx.flag[f];
  if (fx.empathy)   S.empathyCount++;
  if (fx.aggression) S.aggressionCount++;
  updateHUD();
  if (lines.length) toast(lines);
  if (fx.stress > 0 || fx.aggression) flash();
  if (S.stress >= 7) bleedStamp();
}

/* всплывающие дельты шкал — не затираются переходом к следующей реплике */
function toast(lines) {
  const d = document.createElement('div');
  d.className = 'toast';
  d.innerHTML = lines.map(l => {
    const up = /\+/.test(l);
    return `<span class="${up ? 'up' : 'down'}">${l}</span>`;
  }).join('');
  document.body.appendChild(d);
  setTimeout(() => { d.style.opacity = '0'; setTimeout(() => d.remove(), 400); }, 2600);
}

function flash() {
  const f = document.createElement('div');
  f.className = 'flash';
  document.body.appendChild(f);
  setTimeout(() => f.remove(), 460);
}

const BLEED_WORDS = ['НЕЯВКА', 'ОТКАЗ', 'ВЫГОВОР', 'ПЛАН', 'ФОРМА 23-Б', 'УКЛОНИСТ', 'СРОК'];
function bleedStamp() {
  const d = document.createElement('div');
  d.className = 'bleed';
  d.textContent = BLEED_WORDS[Math.floor(Math.random() * BLEED_WORDS.length)];
  d.style.top = (10 + Math.random() * 70) + '%';
  d.style.left = (5 + Math.random() * 70) + '%';
  d.style.fontSize = (16 + Math.random() * 22) + 'px';
  document.body.appendChild(d);
  setTimeout(() => d.remove(), 6000);
}

/* ─────────── ФОН И ПОРТРЕТ ─────────── */
/* Raster art (assets/*.png) is preloaded once; SVG art is only used as a
   fallback when a PNG is confirmed missing, so scenes never flicker. */
const ART = {};          // url -> true | false
function preloadArt() {
  const urls = [];
  for (const k in (typeof BACKGROUNDS !== 'undefined' ? BACKGROUNDS : {})) urls.push(`assets/bg_${k}.png`);
  for (const k in (typeof SPRITES !== 'undefined' ? SPRITES : {})) urls.push(`assets/ch_${k}.png`);
  return Promise.all(urls.map(url => new Promise(res => {
    const im = new Image();
    im.onload = () => { ART[url] = true; res(); };
    im.onerror = () => { ART[url] = false; res(); };
    im.src = url;
  })));
}
function rasterOk(url) { return ART[url] === true; }
function missing(url) { return ART[url] === false; }

let bgToken = 0, chToken = 0;
function setBG(name) {
  const token = ++bgToken;
  el.bg.className = 'bg bg-' + name;
  const raster = `assets/bg_${name}.png`;
  if (rasterOk(raster)) {
    el.bg.innerHTML = `<img class="bgimg" src="${raster}" alt="">`;
  } else {
    const svg = (typeof BACKGROUNDS !== 'undefined') && BACKGROUNDS[name];
    el.bg.innerHTML = svg || '';
    if (!missing(raster)) {
      const im = new Image();
      im.onload = () => { ART[raster] = true; if (token === bgToken) el.bg.innerHTML = `<img class="bgimg" src="${raster}" alt="">`; };
      im.onerror = () => { ART[raster] = false; };
      im.src = raster;
    }
  }
}
function setPortrait(key, side) {
  const token = ++chToken;
  if (!key) { el.portrait.className = ''; el.portrait.innerHTML = ''; return; }
  el.portrait.className = 'on' + (side === 'right' ? ' right' : '');
  const raster = `assets/ch_${key}.png`;
  const svg = (typeof SPRITES !== 'undefined') && SPRITES[key];
  const fallback = svg ? `<div class="sprite">${svg}</div>`
                       : `<div class="portrait"><div class="figure" style="--pc:#444"></div></div>`;
  if (rasterOk(raster)) {
    el.portrait.innerHTML = `<div class="sprite"><img class="chimg" src="${raster}" alt=""></div>`;
  } else {
    el.portrait.innerHTML = fallback;
    if (!missing(raster)) {
      const im = new Image();
      im.onload = () => { ART[raster] = true; if (token === chToken) el.portrait.innerHTML = `<div class="sprite"><img class="chimg" src="${raster}" alt=""></div>`; };
      im.onerror = () => { ART[raster] = false; };
      im.src = raster;
    }
  }
}

/* ─────────── ПЕЧАТНЫЙ ТЕКСТ ─────────── */
let typing = null, typeDone = true, pendingAdvance = null;
function typeText(target, str, cls, done) {
  if (typing) clearInterval(typing);
  target.className = (target === el.text ? 'text ' : '') + (cls || '');
  target.textContent = '';
  typeDone = false;
  let i = 0;
  const speed = S.stress >= 7 ? 14 : 22;
  typing = setInterval(() => {
    target.textContent = str.slice(0, ++i);
    if (i >= str.length) {
      clearInterval(typing); typing = null; typeDone = true;
      if (done) done();
    }
  }, speed);
  if (S.stress >= 7 && Math.random() < .3) target.classList.add('glitch');
}

function skipTyping() {
  if (typing) {
    clearInterval(typing); typing = null; typeDone = true;
    if (current && current.text) el.text.textContent = resolve(current.text);
    if (current && current.text) el.text.className = 'text ' + (current.tone || '');
  }
}

/* ─────────── РЕНДЕР УЗЛА ─────────── */
let current = null;
const resolve = v => (typeof v === 'function' ? v() : v);

function show(id) {
  const node = script[id];
  if (!node) { console.warn('нет узла', id); return; }
  current = node;
  el.hint.textContent = '';
  el.choices.innerHTML = '';
  el.nextBtn.hidden = true;
  clearTimer();

  if (node.day) { S.day = node.day; updateHUD(); }
  if (node.dayName) el.dayName.textContent = node.dayName;
  if (node.bg) setBG(node.bg);
  if ('portrait' in node) setPortrait(node.portrait, node.side);

  if (node.chapter)  return showChapter(node);
  if (node.minigame) return launchMinigame(node);
  if (node.ending)   return showEnding(node);
  if (node.choices)  return showChoices(node);

  renderLine(node);
}

function renderLine(node) {
  el.speaker.textContent = node.speaker || '';
  el.speaker.className = 'speaker ' + (node.tone === 'voice' ? 'voice' : node.tone === 'int' ? 'int' : '');
  const txt = resolve(node.text);
  pendingAdvance = () => {
    if (node.fx) applyFx(node.fx);
    if (node.next) show(node.next); else showChoicesFallback();
  };
  typeText(el.text, txt, node.tone, () => {
    el.nextBtn.hidden = false;
    if (node.auto) setTimeout(() => { if (current === node) advance(); }, 900);
  });
  // голосовые вставки поверх
  if (node.tone === 'voice') showVoice(txt);
}

function showVoice(txt) {
  const d = document.createElement('div');
  d.textContent = txt;
  d.style.cssText = 'position:absolute;top:14%;left:50%;transform:translateX(-50%);color:#8f7fd8;' +
    'font-style:italic;font-size:15px;opacity:.75;max-width:70%;text-align:center;pointer-events:none;' +
    'text-shadow:0 0 12px rgba(120,90,200,.5);transition:opacity 1s';
  el.voice.appendChild(d);
  setTimeout(() => { d.style.opacity = '0'; setTimeout(() => d.remove(), 1100); }, 2600);
}

function advance() {
  if (!typeDone) { skipTyping(); return; }
  if (pendingAdvance) { const f = pendingAdvance; pendingAdvance = null; f(); }
}

function showChoicesFallback() {
  el.hint.textContent = '…конец доступного фрагмента. Нажмите, чтобы начать заново.';
  el.choices.innerHTML = '';
  addChoice({ ico: '↺', tag: 'Заново', text: 'Пройти снова', to: 'start', restart: true });
}

/* ─────────── КАРТОЧКА ГЛАВЫ ─────────── */
function showChapter(node) {
  el.chapter.innerHTML = `<div class="k">${node.chapter.k}</div>
    <div class="t">${node.chapter.t}</div>
    <div class="s">${node.chapter.s || ''}</div>
    <div class="tap">нажмите, чтобы продолжить</div>`;
  el.chapter.classList.remove('hidden');
  el.chapter.onclick = e => {
    e.stopPropagation();   // иначе клик всплывёт на сцену и пропустит печать текста
    el.chapter.classList.add('hidden');
    el.chapter.onclick = null;
    show(node.next);
  };
}

/* ─────────── ВЫБОРЫ ─────────── */
function isLocked(c) {
  if (!c.lock) return false;
  const v = S[c.lock.scale];
  if (c.lock.max !== undefined && v > c.lock.max) return true;
  if (c.lock.min !== undefined && v < c.lock.min) return true;
  return false;
}

function showChoices(node) {
  el.speaker.textContent = node.prompt || 'Выберите, как ответить';
  el.speaker.className = 'speaker int';
  el.text.textContent = '';
  el.choices.innerHTML = '';

  if (node.pre && !S.flags['_pre_' + node.pre]) {
    S.flags['_pre_' + node.pre] = 1;
    el.text.textContent = resolve(node.pre);
  }

  node.choices.forEach((c, i) => {
    const locked = isLocked(c);
    const d = document.createElement('div');
    d.className = 'choice' + (locked ? ' locked' : '');
    d.dataset.t = c.t || 'bureau';
    d.style.animationDelay = (i * 0.06) + 's';
    const t = TONES[c.t] || { ico: '•', label: '' };
    d.innerHTML = `<span class="ico">${c.ico || t.ico}</span>
      <span class="body"><span class="tag">${c.tag || t.label}</span>${resolve(c.text)}</span>
      ${locked ? `<span class="why">${c.lock.why || 'недоступно'}</span>` : ''}`;
    if (!locked) d.onclick = () => {
      if (c.t === 'empathy') S.empathyCount++;
      if (c.t === 'aggression') S.aggressionCount++;
      if (c.fx) applyFx(c.fx);
      el.choices.innerHTML = '';
      if (c.restart) { resetGame(); return; }
      show(c.to);
    };
    el.choices.appendChild(d);
  });

  if (node.timer) startTimer(node.timer, node.timeoutTo);
}

/* ─────────── ТАЙМЕР ─────────── */
let timerInt = null;
function clearTimer() { if (timerInt) { clearInterval(timerInt); timerInt = null; } document.querySelectorAll('.timer').forEach(e => e.remove()); }
function startTimer(secs, timeoutTo) {
  const wrap = document.createElement('div');
  wrap.className = 'timer';
  wrap.innerHTML = '<i></i>';
  el.choices.appendChild(wrap);
  const bar = wrap.querySelector('i');
  let left = secs;
  timerInt = setInterval(() => {
    left -= 0.1;
    bar.style.width = clamp(left / secs * 100, 0, 100) + '%';
    if (left <= secs * 0.35) wrap.classList.add('warn');
    if (left <= 0) {
      clearTimer();
      el.choices.innerHTML = '';
      applyFx({ stress: 1 });
      el.hint.innerHTML = '<b>Время вышло. Молчание — тоже выбор.</b>';
      setTimeout(() => show(timeoutTo), 700);
    }
  }, 100);
}

/* ─────────── МИНИ-ИГРА: ПРОВЕРКА ДОКУМЕНТОВ ─────────── */
function launchMinigame(node) {
  if (node.minigame === 'docs') return mgDocs(node);
  if (node.minigame === 'persuade') return mgPersuade(node);
}

function mgDocs(node) {
  const d = node.data;
  el.overlay.classList.remove('hidden');
  el.overlay.innerHTML = `<div class="panel">
    <h2>Проверка документов</h2>
    <div class="sub">Найдите ${d.need} несовпадени${d.need === 1 ? 'е' : 'я'} · ${d.time} сек · Стресс ${S.stress}</div>
    <div class="docpair">
      <div class="doc"><h4>${d.left.title}</h4>${d.left.rows.map((r, i) =>
        `<div class="row"><span>${r[0]}</span><span class="hot" data-i="L${i}" data-f="${r[2] ? 1 : 0}">${r[1]}</span></div>`).join('')}
        <div class="stamp">${d.left.stamp || ''}</div></div>
      <div class="doc"><h4>${d.right.title}</h4>${d.right.rows.map((r, i) =>
        `<div class="row"><span>${r[0]}</span><span class="hot" data-i="R${i}" data-f="${r[2] ? 1 : 0}">${r[1]}</span></div>`).join('')}
        <div class="stamp">${d.right.stamp || ''}</div></div>
    </div>
    <div class="feedback" id="mgFb">Кликайте по строкам, где данные расходятся.</div>
    <div style="margin-top:14px;display:flex;justify-content:space-between;align-items:center">
      <span class="timer" style="flex:1;margin:0 18px 0 0"><i id="mgTime"></i></span>
      <button class="btn" id="mgDone" disabled>Закрыть дело</button>
    </div>
  </div>`;

  let found = 0, wrong = 0, left = d.time;
  const bar = $('mgTime');
  const tick = setInterval(() => {
    left -= 0.1; bar.style.width = clamp(left / d.time * 100, 0, 100) + '%';
    if (left <= 0) { clearInterval(tick); finish(); }
  }, 100);

  el.overlay.querySelectorAll('.hot').forEach(h => {
    h.onclick = () => {
      if (h.dataset.done) return;
      h.dataset.done = 1;
      if (h.dataset.f === '1') { h.classList.add('ok'); found++; }
      else { h.classList.add('bad'); wrong++; left = Math.max(1, left - 4); }
      $('mgFb').textContent = `Найдено: ${found}/${d.need} · Ошибок: ${wrong}`;
      if (found >= d.need) { clearInterval(tick); finish(); }
    };
  });

  function finish() {
    clearInterval(tick);
    const success = found >= d.need && wrong <= 1;
    $('mgFb').className = 'feedback ' + (success ? 'good' : 'bad');
    $('mgFb').textContent = success
      ? 'Документы сходятся. Дело закрыто по правилам.'
      : (wrong > 1 ? 'Вы отметили лишнее. Гражданин оспорил ваше решение.' : 'Вы не нашли расхождений вовремя.');
    $('mgDone').disabled = false;
    $('mgDone').onclick = () => {
      el.overlay.classList.add('hidden'); el.overlay.innerHTML = '';
      if (success) applyFx(d.onWin); else applyFx(d.onLose);
      show(success ? d.winTo : d.loseTo);
    };
  }
}

/* ─────────── МИНИ-ИГРА: УБЕЖДЕНИЕ ─────────── */
function mgPersuade(node) {
  const d = node.data;
  let picked = [];
  el.overlay.classList.remove('hidden');
  el.overlay.innerHTML = `<div class="panel">
    <h2>Убеждение</h2>
    <div class="sub">${d.sub} · нужно ${d.need} аргумента</div>
    <div class="argpool">${d.args.map((a, i) =>
      `<div class="arg" data-i="${i}">${a.text}</div>`).join('')}</div>
    <div class="slots">${Array.from({ length: d.need }).map((_, i) =>
      `<div class="slot" data-s="${i}">аргумент ${i + 1}</div>`).join('')}</div>
    <div class="feedback" id="mgFb">Выберите аргументы, которые ложатся на этого человека.</div>
    <div style="margin-top:16px;text-align:right"><button class="btn" id="mgGo" disabled>Сказать</button></div>
  </div>`;

  const args = el.overlay.querySelectorAll('.arg');
  const slots = el.overlay.querySelectorAll('.slot');

  function refresh() {
    slots.forEach((s, i) => {
      if (picked[i] !== undefined) { s.classList.add('filled'); s.textContent = d.args[picked[i]].short; }
      else { s.classList.remove('filled'); s.textContent = `аргумент ${i + 1}`; }
    });
    args.forEach((a, i) => a.classList.toggle('picked', picked.includes(i)));
    $('mgGo').disabled = picked.length < d.need;
  }

  args.forEach((a, i) => a.onclick = () => {
    if (picked.includes(i)) picked = picked.filter(x => x !== i);
    else if (picked.length < d.need) picked.push(i);
    refresh();
  });
  refresh();

  $('mgGo').onclick = () => {
    const score = picked.reduce((s, i) => s + (d.args[i].good ? 1 : 0), 0);
    const success = score >= d.need;
    el.overlay.classList.add('hidden'); el.overlay.innerHTML = '';
    applyFx(success ? d.onWin : d.onLose);
    if (d.winTo) show(success ? d.winTo : d.loseTo);
  };
}

/* ─────────── КОНЦОВКИ ─────────── */
function computeEnding() {
  const f = S.flags;
  // Осознанный выбор перед комиссией важнее накопленных шкал.
  if (f.final === 'break')  return 'E';                          // сломался
  if (f.final === 'expose') return (f.ally_igor || S.civ >= 6) ? 'B' : 'D'; // сдал схему
  if (f.final === 'quit')   return 'C';                          // ушёл сам
  if (f.final === 'cover')  return 'A';                          // прикрыл схему
  // Запасные ветки, если финального выбора почему-то не было.
  if (S.stress >= 10) return 'E';
  if (f.betrayed && !f.ally_igor) return 'D';
  return 'A';
}

const ENDINGS = {
  A: { code: 'Концовка A', title: 'Идеальный винтик', tag: 'План выполнен. Ты стал системой.',
       body: 'Тебя повышают. Через годы ты сидишь в кабинете с тяжёлыми шторами и дорогими часами,\nкоторые никто не должен замечать.\n\nВ дверь стучит молодой инспектор. Ты наливаешь ему чай и говоришь:\n— Гибкость, сынок. Гибкость. Люди гибнут от принципов, а живут от уступок.\n\nОн кивает. Он тебе верит. Он даже не понимает, что ты только что сделал.' },
  B: { code: 'Концовка B', title: 'Бумажный человек', tag: 'Ты не спас мир. Ты спас одного.',
       body: 'Начальника снимают. Тебя не повышают — слишком неудобный.\nТы остаёшься инспектором в том же кабинете 14.\n\nЗато Игорь забирает детей из школы сам. Он не благодарит тебя словами —\nон просто один раз приносит тебе кофе и молча ставит на стол.\n\nЭтого хватает. Не всё. Но хватает.' },
  C: { code: 'Концовка C', title: 'Побег', tag: 'Граница — это просто линия в окне автобуса.',
       body: 'Ты уезжаешь. Автобус, дождь, чужая речь в наушниках.\nОблегчение накрывает так, что становится страшно: ты не чувствуешь вины.\n\nЧерез месяц ты поймёшь, что оставил там всех:\nВасю с больными почками, Игоря с детьми, парня из подъезда,\nкоторого всё-таки забрали.\nТы свободен. Ты один. Это почти одно и то же.' },
  D: { code: 'Концовка D', title: 'По статье', tag: 'Ты сдал своих. Свои сдали тебя.',
       body: 'Увольнение по статье. Потом — дело. Потом — коридор с лампой,\nкоторая мигает так же, как в твоём подъезде.\n\nНа допросе тебя спрашивают, почему ты это сделал.\nТы хочешь сказать «потому что иначе было нельзя»,\nно понимаешь, что это та же фраза, которой Вася оправдывал всё.' },
  E: { code: 'Концовка E', title: 'Выгорание', tag: 'Ты не выбрал. Ты просто перестал.',
       body: 'Ты не выходишь на работу. Ни в понедельник, ни во вторник.\nТелефон звонит и замолкает. Потом звонит Вася. Ты не берёшь.\n\nКабинет 14 стоит пустым. Ведомость с галочками лежит на столе,\nкак будто кто-то вышел на минуту. Он не вернётся.\n\nКот Шумер запрыгивает на подоконник и смотрит в серое окно.\nБольше в комнате никого нет.' }
};

function showEnding(node) {
  const key = computeEnding();
  const e = ENDINGS[key];
  const hidden = S.humanity >= 7 && S.empathyCount >= 3;
  el.ending.classList.remove('hidden');
  el.ending.innerHTML = `
    <div class="code">${e.code}</div>
    <h1>${e.title}</h1>
    <div class="tagline">${e.tag}</div>
    <div class="body">${e.body}</div>
    ${hidden ? `<div class="epilogue">…а где-то один человек вспоминает тебя добрым словом.\nБез пафоса. Одной репликой.</div>` : ''}
    <div class="stats">
      Стресс: <b>${S.stress}</b> · Человечность: <b>${S.humanity}</b><br>
      Репутация у начальства: <b>${S.boss}</b> · у людей: <b>${S.civ}</b><br>
      Выполнение плана: <b>${S.plan}</b> · Актов эмпатии: <b>${S.empathyCount}</b>
      ${hidden ? '<br><span style="color:#7d9b6a">✦ Открыт скрытый эпилог</span>' : ''}
    </div>
    <div>
      <button onclick="resetGame()">Пройти иначе</button>
    </div>`;
}

function resetGame() {
  Object.assign(S, { stress: 1, humanity: 5, boss: 5, civ: 5, plan: 0, day: 1, flags: {}, empathyCount: 0, aggressionCount: 0 });
  el.ending.classList.add('hidden');
  el.overlay.classList.add('hidden');
  document.querySelectorAll('.bleed,.flash').forEach(e => e.remove());
  updateHUD();
  show('start');
}

/* ─────────── УПРАВЛЕНИЕ ─────────── */
function canAdvance() {
  if (!el.overlay.classList.contains('hidden')) return false;   // мини-игра открыта
  if (!el.ending.classList.contains('hidden')) return false;    // экран концовки
  if (!el.chapter.classList.contains('hidden')) return false;   // карточка главы
  return true;
}

/* На тач-экранах свайп не должен переключать реплику: тап — только явный,
   короткий и без смещения. Свайп вверх по сцене переключает реплику явно. */
let tapStart = null, swipeGuard = 0;
const isTouch = matchMedia('(hover:none)').matches || 'ontouchstart' in window;
document.getElementById('app').addEventListener('touchstart', e => {
  const t = e.touches[0];
  tapStart = { x: t.clientX, y: t.clientY, at: Date.now() };
}, { passive: true });

document.getElementById('app').addEventListener('touchend', e => {
  if (!isTouch || !tapStart) return;
  const t = e.changedTouches && e.changedTouches[0];
  if (!t) return;
  const dx = t.clientX - tapStart.x, dy = t.clientY - tapStart.y;
  const dist = Math.hypot(dx, dy);
  const wasTap = dist <= 12 && Date.now() - tapStart.at <= 700;
  tapStart = null;
  if (wasTap) return;                       // обычный тап обработает click
  swipeGuard = Date.now();                  // это был свайп — гасим следующий click
  if (dy < -45 && Math.abs(dy) > Math.abs(dx) && e.target.closest('#stage') && canAdvance()) {
    advance();                              // свайп вверх по сцене — следующая реплика
  }
}, { passive: true });

document.getElementById('app').addEventListener('click', e => {
  if (e.target.closest('.choice')) return;   // выбор обрабатывается сам
  if (e.target.closest('#nextBtn')) return;  // у кнопки свой обработчик
  if (isTouch && Date.now() - swipeGuard < 400) return;  // это отголосок свайпа
  if (!canAdvance()) return;
  advance();
});
el.nextBtn.addEventListener('click', e => {
  e.stopPropagation();
  if (!canAdvance()) return;
  advance();
});
document.onkeydown = e => {
  if (e.code === 'Space' || e.code === 'Enter') {
    e.preventDefault();
    if (!canAdvance()) return;
    advance();
  }
};

/* ─────────── СТАРТ ─────────── */
const jump = new URLSearchParams(location.search).get('node');
preloadArt().then(() => {
  updateHUD();
  show(jump && script[jump] ? jump : 'start');
});
