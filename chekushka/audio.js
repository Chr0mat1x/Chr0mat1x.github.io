// Простые синтезированные звуки — без внешних файлов.
const Sfx = (() => {
  let ctx = null;
  let muted = false;

  function ac() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
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

  return {
    init: () => { ac(); },
    get muted() { return muted; },
    toggleMute() { muted = !muted; return muted; },
    cut() {
      noise({ dur: 0.12, peak: 0.3, hp: 2600 });
      tone({ freq: 1800, type: 'triangle', dur: 0.07, peak: 0.09, slide: 700 });
    },
    star() {
      tone({ freq: 880, type: 'sine', dur: 0.1, peak: 0.16 });
      tone({ freq: 1320, type: 'sine', dur: 0.14, peak: 0.13, delay: 0.07 });
    },
    chomp() {
      tone({ freq: 220, type: 'square', dur: 0.09, peak: 0.12, slide: 90 });
      noise({ dur: 0.1, peak: 0.16, hp: 400, delay: 0.02 });
    },
    win() {
      const notes = [392, 523, 659, 784];
      notes.forEach((f, i) => tone({ freq: f, type: 'triangle', dur: 0.16, peak: 0.16, delay: i * 0.09 }));
      tone({ freq: 1568, type: 'sine', dur: 0.35, peak: 0.1, delay: 0.4 });
    },
    fail() {
      tone({ freq: 300, type: 'sawtooth', dur: 0.3, peak: 0.14, slide: 90 });
      noise({ dur: 0.35, peak: 0.12, hp: 200, delay: 0.05 });
    },
    puff() {
      noise({ dur: 0.5, peak: 0.16, hp: 500 });
      tone({ freq: 300, type: 'sine', dur: 0.4, peak: 0.08, slide: 900 });
    },
    bite() {
      noise({ dur: 0.08, peak: 0.22, hp: 900 });
      tone({ freq: 150, type: 'square', dur: 0.07, peak: 0.1, slide: 70 });
    },
    slurp() {
      tone({ freq: 430, type: 'sine', dur: 0.2, peak: 0.12, slide: 170 });
      noise({ dur: 0.18, peak: 0.1, hp: 700 });
    },
    applause() {
      for (let i = 0; i < 16; i++) {
        noise({ dur: 0.06, peak: 0.09 + Math.random() * 0.07, hp: 1500, delay: i * 0.085 });
      }
      tone({ freq: 660, type: 'triangle', dur: 0.5, peak: 0.07, delay: 0.1 });
    },
    whistle() {
      tone({ freq: 1150, type: 'sine', dur: 0.28, peak: 0.09, slide: 2100 });
    },
    groan() {
      tone({ freq: 115, type: 'sawtooth', dur: 0.85, peak: 0.12, slide: 68 });
      noise({ dur: 0.6, peak: 0.09, hp: 160, delay: 0.08 });
    },
    click() {
      tone({ freq: 660, type: 'square', dur: 0.05, peak: 0.1 });
    },
  };
})();
