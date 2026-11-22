// Звуки игры: короткие синтезированные эффекты и настоящие мемные нарезки Меллстроя.
const Sfx = (() => {
  let ctx = null;
  let muted = false;

  // Настоящие мемные нарезки: «сладость, приятность и вкусность», «я уже красный»
  // и аплодисменты. Файлы лежат в assets/sfx, декодируются один раз.
  const MEMES = {
    eat: 'assets/sfx/eat.mp3?v=2',
    bravo: 'assets/sfx/bravo.mp3?v=2',
    red: 'assets/sfx/red.mp3?v=2',
  };
  const buffers = {};
  const clips = {}; // замеры нарезки: тихое начало и пик — чтобы срез звучал, а не молчал
  const playing = {};
  let memeLoading = false;

  function ac() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') {
      const p = ctx.resume();
      if (p && p.catch) p.catch(() => {});
    }
    return ctx;
  }

  function env(node, t0, attack, hold, release, peak) {
    const g = node.gain;
    g.cancelScheduledValues(t0);
    g.setValueAtTime(0.0001, t0);
    g.exponentialRampToValueAtTime(peak, t0 + attack);
    g.exponentialRampToValueAtTime(peak * 0.7, t0 + attack + hold);
    g.exponentialRampToValueAtTime(0.0001, t0 + attack + hold + release);
  }

  function tone({ freq = 440, type = 'sine', dur = 0.15, peak = 0.2, slide = null, delay = 0 }) {
    const c = ac();
    if (!c || muted) return;
    const t0 = c.currentTime + delay;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slide), t0 + dur);
    env(gain, t0, 0.008, dur * 0.5, dur * 0.6, peak);
    osc.connect(gain).connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  function noise({ dur = 0.14, peak = 0.25, hp = 1200, delay = 0 }) {
    const c = ac();
    if (!c || muted) return;
    const t0 = c.currentTime + delay;
    const len = Math.floor(c.sampleRate * dur);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.2);
    }
    const src = c.createBufferSource();
    src.buffer = buf;
    const filter = c.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = hp;
    const gain = c.createGain();
    gain.gain.setValueAtTime(peak, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter).connect(gain).connect(c.destination);
    src.start(t0);
  }

  async function loadMemes() {
    const c = ac();
    if (!c || memeLoading) return;
    memeLoading = true;
    await Promise.all(Object.entries(MEMES).map(async ([key, url]) => {
      try {
        const res = await fetch(url);
        const data = await res.arrayBuffer();
        const buf = await c.decodeAudioData(data);
        buffers[key] = buf;
        clips[key] = measure(buf);
      } catch (e) { /* нет сети или битый файл — останется синтез */ }
    }));
  }

  // Нарезки с myinstants нередко начинаются с тишины и записаны тихо.
  // Ищем первый громкий участок и пик, чтобы играть сразу голос и на слышимой громкости.
  function measure(buf) {
    const d = buf.getChannelData(0);
    const win = Math.floor(buf.sampleRate * 0.02) || 1;
    let peak = 0;
    const env = [];
    for (let i = 0; i + win <= d.length; i += win) {
      let sum = 0;
      for (let j = i; j < i + win; j++) {
        const v = d[j];
        sum += v * v;
        if (Math.abs(v) > peak) peak = Math.abs(v);
      }
      env.push(Math.sqrt(sum / win));
    }
    const loud = Math.max(...env) * 0.25;
    const leadIndex = env.findIndex((v) => v > loud);
    return {
      lead: Math.max(0, leadIndex) * 0.02,
      peak,
      gain: peak > 0.001 ? Math.min(6, 0.8 / peak) : 1,
    };
  }

  function stopMeme(key) {
    const src = playing[key];
    if (!src) return;
    try { src.stop(); } catch (e) { /* уже остановлен */ }
    delete playing[key];
  }

  // Срез нарезки: offset/dur в секундах, чтобы вписать звук в длину гифки
  function meme(key, { offset = 0, dur = 0, peak = 0.5, delay = 0 } = {}) {
    const c = ac();
    const buf = buffers[key];
    if (!c || muted || !buf) return false;
    stopMeme(key);
    const clip = clips[key] || { lead: 0, gain: 1 };
    const from = Math.min(buf.duration - 0.05, offset + clip.lead);
    const t0 = c.currentTime + 0.01 + delay;
    const realDur = Math.min(dur || buf.duration - from, buf.duration - from);
    const src = c.createBufferSource();
    const gain = c.createGain();
    const vol = Math.min(1, peak * clip.gain);
    src.buffer = buf;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.03);
    gain.gain.setValueAtTime(vol, t0 + Math.max(0.05, realDur - 0.12));
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + realDur);
    src.connect(gain).connect(c.destination);
    src.start(t0, from, realDur);
    src.onended = () => { if (playing[key] === src) delete playing[key]; };
    playing[key] = src;
    return true;
  }

  function stopMemes() {
    for (const key of Object.keys(playing)) stopMeme(key);
  }

  return {
    init: () => { ac(); loadMemes(); },
    preload: () => loadMemes(),
    meme,
    stopMemes,
    get muted() { return muted; },
    toggleMute() {
      muted = !muted;
      if (muted) stopMemes();
      return muted;
    },
    cut() {
      noise({ dur: 0.12, peak: 0.3, hp: 2600 });
      tone({ freq: 1800, type: 'triangle', dur: 0.07, peak: 0.09, slide: 700 });
    },
    star() {
      tone({ freq: 880, type: 'sine', dur: 0.1, peak: 0.16 });
      tone({ freq: 1320, type: 'sine', dur: 0.14, peak: 0.13, delay: 0.07 });
    },
    fail() {
      tone({ freq: 300, type: 'sawtooth', dur: 0.3, peak: 0.14, slide: 90 });
      noise({ dur: 0.35, peak: 0.12, hp: 200, delay: 0.05 });
    },
    puff() {
      noise({ dur: 0.5, peak: 0.16, hp: 500 });
      tone({ freq: 300, type: 'sine', dur: 0.4, peak: 0.08, slide: 900 });
    },
    click() {
      tone({ freq: 660, type: 'square', dur: 0.05, peak: 0.1 });
    },
  };
})();
