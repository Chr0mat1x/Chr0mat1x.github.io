// ============ PRELOADER ============
function hidePreloader() {
  const preloader = document.getElementById('preloader');
  if (preloader) preloader.classList.add('preloader--hidden');
}
window.addEventListener('load', () => setTimeout(hidePreloader, 1700));
document.addEventListener('DOMContentLoaded', () => setTimeout(hidePreloader, 1700));
// Аварийное скрытие через 2 секунды в любом случае
setTimeout(hidePreloader, 2000);
// ============ REVEAL ON SCROLL ============
const revealEls = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('reveal--visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  revealEls.forEach(el => io.observe(el));
} else {
  // Нет IntersectionObserver — показываем всё сразу
  document.documentElement.classList.add('reveal-fallback');
}
// Страховка: если за 3 сек что-то осталось скрытым — показываем всё
setTimeout(() => document.documentElement.classList.add('reveal-fallback'), 3000);

// ============ HEADER SCROLL ============

// ============ HEADER SCROLL ============
const header = document.getElementById('header');
window.addEventListener('scroll', () => {
  header.classList.toggle('header--scrolled', window.scrollY > 40);
});

// ============ BURGER / MOBILE NAV ============
const burger = document.getElementById('burger');
const nav = document.getElementById('nav');
burger.addEventListener('click', () => {
  burger.classList.toggle('burger--open');
  nav.classList.toggle('nav--open');
  // Блокируем прокрутку страницы под открытым меню
  document.body.classList.toggle('menu-locked', nav.classList.contains('nav--open'));
});
nav.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    burger.classList.remove('burger--open');
    nav.classList.remove('nav--open');
    document.body.classList.remove('menu-locked');
  });
});

// ============ CUSTOM CURSOR ============
const cursor = document.getElementById('cursor');
document.addEventListener('mousemove', e => {
  cursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
});
document.querySelectorAll('a, button, summary, input, textarea').forEach(el => {
  el.addEventListener('mouseenter', () => cursor.classList.add('cursor--big'));
  el.addEventListener('mouseleave', () => cursor.classList.remove('cursor--big'));
});

// ============ CONTACT FORM ============
const form = document.getElementById('form');
const formStatus = document.getElementById('formStatus');
const submitBtn = document.getElementById('submitBtn');

// Локализация сообщений формы: RU по умолчанию, EN если <html lang="en">
const isEn = document.documentElement.lang === 'en';
const MSG = isEn ? {
  fill: 'Fill in your name and contact — otherwise we can\'t reach you.',
  sending: 'Sending...',
  sent: 'Request sent! We\'ll get back to you within a day.',
  errorNote: 'Open your mail app — the message is pre-filled, just hit send.',
  button: 'Send request'
} : {
  fill: 'Заполните имя и контакт — без них не свяжемся.',
  sending: 'Отправляем...',
  sent: 'Заявка отправлена! Ответим в течение дня.',
  errorNote: 'Открываем почту — отправьте письмо оттуда.',
  button: 'Отправить заявку'
};

// Ссылки на поля берём один раз на верхнем уровне
const fieldName = form.querySelector('input[name="name"]');
const fieldContact = form.querySelector('input[name="contact"]');
const fieldMessage = form.querySelector('textarea[name="message"]');

form.addEventListener('submit', e => {
  e.preventDefault();

  let valid = true;

  [fieldName, fieldContact].forEach(field => {
    if (!field.value.trim()) {
      field.classList.add('invalid');
      valid = false;
    } else {
      field.classList.remove('invalid');
    }
  });

  if (!valid) {
    formStatus.textContent = MSG.fill;
    formStatus.className = 'form__status form__status--err';
    return;
  }

  // ============ ОТПРАВКА ЗАЯВКИ ============
  submitBtn.disabled = true;
  submitBtn.textContent = MSG.sending;

  const finish = () => {
    submitBtn.disabled = false;
    submitBtn.textContent = MSG.button;
  };

  fetch('https://formspree.io/f/xrpgkdze', {
    method: 'POST',
    headers: { 'Accept': 'application/json' },
    body: new FormData(form)
  })
    .then(res => {
      if (res.ok) {
        formStatus.textContent = MSG.sent;
        formStatus.className = 'form__status form__status--ok';
        form.reset();
      } else {
        throw new Error('bad status');
      }
    })
    .catch(() => {
      // Резервный путь — открыть почтовую программу с готовым письмом
      const subject = encodeURIComponent(isEn ? 'Request from Chr0mat1x website' : 'Заявка с сайта Chr0mat1x');
      const body = encodeURIComponent(
        `${isEn ? 'Name' : 'Имя'}: ${fieldName.value.trim()}\n${isEn ? 'Contact' : 'Контакт'}: ${fieldContact.value.trim()}\n${isEn ? 'Project' : 'О проекте'}: ${fieldMessage.value.trim() || (isEn ? '—' : '—')}`
      );
      window.location.href = `mailto:sumarokovart@gmail.com?subject=${subject}&body=${body}`;
      formStatus.textContent = MSG.errorNote;
      formStatus.className = 'form__status form__status--ok';
    })
    .finally(finish);
});

// Убираем подсветку ошибки при вводе
[fieldName, fieldContact].forEach(field => {
  field.addEventListener('input', () => field.classList.remove('invalid'));
});
// ================================================================
// ART MOTION — кинематографичные анимации и интерактив
// Каждая фича изолирована: сбой одной не ломает остальные
// ================================================================
(function () {
  const d = document;
  const IS_EN = d.documentElement.lang === 'en';
  const fine = ('matchMedia' in window) &&
    window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const rAF = cb => (requestAnimationFrame || (f => setTimeout(f, 16)))(cb);
  const guard = fn => { try { fn(); } catch (e) { /* не рушим сайт */ } };

  // ---- КИНЕМАТОГРАФИЧНОЕ ЗЕРНО ----
  guard(() => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300">' +
      '<filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch"/></filter>' +
      '<rect width="100%" height="100%" filter="url(%23n)"/></svg>';
    const g = d.createElement('div');
    g.className = 'grain';
    g.style.backgroundImage = "url('data:image/svg+xml;charset=utf-8," +
      encodeURIComponent(svg).replace(/'/g, '%27') + "')";
    d.body.appendChild(g);
  });

  // ---- ЛИНИЯ ПРОГРЕССА СКРОЛЛА ----
  guard(() => {
    const bar = d.createElement('div');
    bar.className = 'progress';
    d.body.appendChild(bar);
    const upd = () => {
      const h = d.documentElement.scrollHeight - window.innerHeight;
      const p = h > 0 ? Math.min(1, Math.max(0, window.scrollY / h)) : 0;
      bar.style.transform = `scaleX(${p})`;
    };
    window.addEventListener('scroll', upd, { passive: true });
    window.addEventListener('resize', upd, { passive: true });
    upd();
  });

  // ---- ПРЕЛОАДЕР: разбивка на буквы с каскадом ----
  guard(() => {
    const pl = d.querySelector('.preloader__text');
    if (!pl) return;
    const chars = Array.from(pl.textContent);
    pl.textContent = '';
    chars.forEach((ch, i) => {
      const s = d.createElement('span');
      s.className = 'pl';
      s.style.setProperty('--i', i);
      s.textContent = ch;
      pl.appendChild(s);
    });
    rAF(() => rAF(() => pl.classList.add('preloader__text--in')));
  });

  // ---- БЕГУЩАЯ СТРОКА под hero ----
  guard(() => {
    const words = IS_EN ? ['Black', 'White', 'Code'] : ['Чёрное', 'Белое', 'Код'];
    const strip = d.createElement('div');
    strip.className = 'marquee';
    strip.setAttribute('aria-hidden', 'true');
    const track = d.createElement('div');
    track.className = 'marquee__track';
    const build = arr => arr.forEach(w => {
      const it = d.createElement('span');
      it.className = 'marquee__item';
      const b = d.createElement('span');
      b.textContent = w;
      it.appendChild(b);
      track.appendChild(it);
    });
    const half = [];
    for (let k = 0; k < 5; k++) half.push.apply(half, words);
    build(half);
    build(half); // дублируем для бесшовного цикла (-50%)
    strip.appendChild(track);
    const hero = d.getElementById('hero');
    const services = d.getElementById('services');
    if (hero && services) hero.parentNode.insertBefore(strip, services);
    else d.body.insertBefore(strip, d.body.firstChild);
  });
// ---- РАЗБИВКА ЗАГОЛОВКОВ на буквы ----
  guard(() => {
    d.querySelectorAll('.section__title').forEach(t => {
      if (t.querySelector('.l')) return;
      const chars = Array.from(t.textContent);
      t.textContent = '';
      const newWord = () => {
        const w = d.createElement('span');
        w.className = 'w';
        w.style.whiteSpace = 'nowrap';
        t.appendChild(w);
        return w;
      };
      let cur = newWord();
      chars.forEach((ch, i) => {
        if (ch === ' ' || ch === '\u00A0') {
          t.appendChild(d.createTextNode('\u0020'));
          cur = newWord();
        } else {
          const s = d.createElement('span');
          s.className = 'l';
          s.style.setProperty('--i', i);
          s.textContent = ch;
          cur.appendChild(s);
        }
      });
    });
  });

  // ---- ОБЁРТКА текста кнопок в span.t (заливка под текстом) ----
  guard(() => {
    d.querySelectorAll('.btn').forEach(b => {
      if (!b.querySelector('.t')) {
        const wrap = d.createElement('span');
        wrap.className = 't';
        while (b.firstChild) wrap.appendChild(b.firstChild);
        b.appendChild(wrap);
      }
    });
  });

  // ---- СЧЁТЧИКИ СТАТИСТИКИ ----
  const runCounter = el => {
    const m = el.textContent.match(/^(\d+)(.*)$/);
    if (!m) return;
    const target = +m[1], suffix = m[2];
    const dur = 1300, t0 = performance.now();
    const ease = p => p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
    const tick = () => {
      const p = Math.min(1, (performance.now() - t0) / dur);
      el.textContent = Math.round(ease(p) * target) + suffix;
      if (p < 1) rAF(tick);
    };
    tick();
  };

  // ---- Наблюдатель: заголовки + счётчики по мере появления ----
  guard(() => {
    const els = Array.from(d.querySelectorAll('.section__title'))
      .map(el => ({ el, run: t => t.classList.add('title--in') }))
      .concat(Array.from(d.querySelectorAll('.stat__num'))
        .map(el => ({ el, run: runCounter })));
    if (!('IntersectionObserver' in window)) { els.forEach(o => o.run(o.el)); return; }
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          const o = els.find(x => x.el === en.target);
          if (o) o.run(en.target);
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.25 });
    els.forEach(o => io.observe(o.el));
  });

  // ---- Мышиные эффекты (параллакс, магнит, прожектор) — только на ПК ----
  if (fine) {
    guard(() => {
      const hero = d.getElementById('hero');
      if (!hero) return;
      const grid = hero.querySelector('.hero__grid');
      const content = hero.querySelector('.container');
      window.addEventListener('scroll', () => {
        if (grid) grid.style.transform = `translateY(${window.scrollY * .15}px)`;
      }, { passive: true });
      if (content) {
        hero.addEventListener('mousemove', e => {
          const tx = (e.clientX / window.innerWidth - .5) * 10;
          const ty = (e.clientY / window.innerHeight - .5) * 8;
          content.style.transform = `translate(${tx}px, ${ty}px)`;
        });
        hero.addEventListener('mouseleave', () => { content.style.transform = ''; });
      }
    });

    guard(() => {
      d.querySelectorAll('.btn').forEach(b => {
        b.addEventListener('mousemove', e => {
          const r = b.getBoundingClientRect();
          const dx = ((e.clientX - r.left) / r.width - .5) * 12;
          const dy = ((e.clientY - r.top) / r.height - .5) * 8;
          b.style.transform = `translate(${dx}px, ${dy}px)`;
        });
        b.addEventListener('mouseleave', () => { b.style.transform = ''; });
      });
    });

    guard(() => {
      d.querySelectorAll('.service, .price').forEach(c => {
        c.addEventListener('mousemove', e => {
          const r = c.getBoundingClientRect();
          c.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
          c.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
        });
      });
    });
  }
})();
// ================================================================
// ART v2 — передовые эффекты (шлейф курсора, hero cinematic, декрипт,
// 3D-наклон карточек, чернильный риппл)
// ================================================================
(function () {
  const d = document;
  const rAF = cb => (requestAnimationFrame || (f => setTimeout(f, 16)))(cb);
  const guard = fn => { try { fn(); } catch (e) {} };
  const mm = q => ('matchMedia' in window) ? window.matchMedia(q).matches : null;
  const fine = mm('(hover: hover) and (pointer: fine)') === true;
  const reduced = mm('(prefers-reduced-motion: reduce)') === true;

  // 1) Сглаживающая точка-хвост за курсором
  guard(() => {
    if (!fine || reduced) return;
    const dot = d.createElement('div');
    dot.className = 'cursor-dot';
    d.body.appendChild(dot);
    let tx = window.innerWidth / 2, ty = window.innerHeight / 2;
    let cx = tx, cy = ty;
    d.addEventListener('mousemove', e => { tx = e.clientX; ty = e.clientY; }, { passive: true });
    const loop = () => {
      cx += (tx - cx) * .22; cy += (ty - cy) * .22;
      dot.style.transform = `translate(${cx - 3}px, ${cy - 3}px)`;
      rAF(loop);
    };
    loop();
  });

  // 2) Hero: масштаб+затухание при скролле, 3D-наклон за мышкой
  guard(() => {
    const hero = d.getElementById('hero');
    const title = hero && hero.querySelector('.hero__title');
    if (!hero || !title) return;
    let rotX = 0, rotY = 0, sc = 1, op = 1;
    const apply = () => {
      title.style.transform = `perspective(1100px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(${sc})`;
      title.style.opacity = String(op);
    };
    const onScroll = () => {
      const p = Math.min(1, Math.max(0, window.scrollY / (window.innerHeight * .75)));
      sc = 1 - p * .4; op = 1 - p * .9;
      apply();
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    if (fine && !reduced) {
      hero.addEventListener('mousemove', e => {
        rotY = ((e.clientX / window.innerWidth) - .5) * 8;
        rotX = ((e.clientY / window.innerHeight) - .5) * -6;
        apply();
      });
      hero.addEventListener('mouseleave', () => { rotX = 0; rotY = 0; apply(); });
    }
  });

  // 3) Хакер-декрипт заголовков (буквы «расшифровываются» в слово)
  const runScramble = title => {
    const letters = Array.from(title.querySelectorAll('.l'));
    if (!letters.length) return;
    const real = letters.map(L => L.textContent);
    const glyphs = 'ABCDEFGHIJKLMNOPQRSTUVWXYZабвгдежзиклмнопрстуфхцчшщъыьэюя0123456789';
    const dur = 900, t0 = performance.now();
    const rnd = () => glyphs[Math.floor(Math.random() * glyphs.length)];
    const tick = () => {
      const p = Math.min(1, (performance.now() - t0) / dur);
      const settled = Math.floor(p * letters.length);
      letters.forEach((L, i) => { L.textContent = (p >= 1 || i < settled) ? real[i] : rnd(); });
      if (p < 1) rAF(tick);
    };
    tick();
  };
  guard(() => {
    if (reduced) return;
    const titles = Array.from(d.querySelectorAll('.section__title'));
    if (!('IntersectionObserver' in window)) { titles.forEach(runScramble); return; }
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) { runScramble(en.target); io.unobserve(en.target); }
      });
    }, { threshold: 0.2 });
    titles.forEach(t => io.observe(t));
  });

  // 4) 3D-наклон карточек услуг и тарифов
  guard(() => {
    if (!fine || reduced) return;
    d.querySelectorAll('.service, .price').forEach(c => {
      c.addEventListener('mousemove', e => {
        const r = c.getBoundingClientRect();
        const ry = ((e.clientX - r.left) / r.width - .5) * 6;
        const rx = ((e.clientY - r.top) / r.height - .5) * -6;
        c.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-3px)`;
      });
      c.addEventListener('mouseleave', () => { c.style.transform = ''; });
    });
  });

  // 5) Чернильный риппл по клику (кнопки + карточки)
  guard(() => {
    if (reduced) return;
    d.querySelectorAll('.btn, .service, .price').forEach(el => {
      el.addEventListener('click', function (e) {
        const r = d.createElement('span');
        r.className = 'ripple';
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        r.style.width = r.style.height = size + 'px';
        r.style.left = (e.clientX - rect.left - size / 2) + 'px';
        r.style.top = (e.clientY - rect.top - size / 2) + 'px';
        this.appendChild(r);
        setTimeout(() => r.remove(), 600);
      });
    });
  });
})();
// ================================================================
// ART v3 — 3D-наклон формы заявки за курсором
// ================================================================
(function () {
  const d = document;
  const guard = fn => { try { fn(); } catch (e) {} };
  guard(() => {
    if (!('matchMedia' in window)) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const form = d.querySelector('.form');
    if (!form) return;
    form.addEventListener('mousemove', e => {
      const r = form.getBoundingClientRect();
      const ry = ((e.clientX - r.left) / r.width - .5) * 5;
      const rx = ((e.clientY - r.top) / r.height - .5) * -5;
      form.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`;
    });
    form.addEventListener('mouseleave', () => { form.style.transform = ''; });
  });
})();

// ================================================================
// ART — сакура в hero. Ветка рисуется процедурно, а не из картинки:
// из правого нижнего угла прорастает изогнутый ствол, от него — тонкие
// веточки, на их концах раскрываются пятилепестковые цветы и бутоны.
// Всё «оживает» по мере роста: сначала тянется ствол, затем по фронту
// распускаются цветы, после — с ветки сыплются лепестки. Поверх —
// лёгкое покачивание и параллакс за курсором.
// ================================================================
(function (d) {
  if (!d) return;
  const canvas = d.getElementById('heroSakura');
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const BASE_W = 1000, BASE_H = 430;   // система координат рисунка
  const INK = '#0a0a0a';
  const BG = 'rgba(245,245,245,.94)';
  const TAU = Math.PI * 2;
  const REVEAL = 2400;                 // мс на прорастание всей ветки

  const calm = window.matchMedia('(prefers-reduced-motion: reduce)');
  const fine = window.matchMedia('(hover:hover) and (pointer:fine)').matches;

  // --- ствол: входит справа, плавной S-дугой уходит к левому кончику ---
  const SPINE = [[1020, 180], [900, 158], [790, 146], [690, 140], [590, 140],
                 [490, 132], [400, 116], [320, 96], [240, 80], [165, 74],
                 [100, 82], [55, 98]];
  const SPINE_W = [14, 13, 11.5, 10, 8.6, 7.2, 5.9, 4.6, 3.4, 2.5, 1.7, 1.1];

  // --- веточки: [точки, ширины, порог проявления по стволу 0..1] ---
  const TWIGS = [
    { p: [[690, 140], [678, 104], [672, 74], [670, 52]], w: [5.6, 4, 2.6, 1.4], thr: .342 },
    { p: [[590, 140], [574, 110], [564, 86], [560, 66]], w: [5, 3.6, 2.3, 1.2], thr: .446 },
    { p: [[490, 132], [472, 104], [462, 82], [458, 64]], w: [4.6, 3.3, 2.1, 1.1], thr: .549 },
    { p: [[400, 116], [384, 90], [376, 70], [372, 54]], w: [4.2, 3, 1.9, 1], thr: .643 },
    { p: [[320, 96], [304, 74], [296, 58], [292, 44]], w: [3.8, 2.7, 1.7, .95], thr: .726 },
    { p: [[900, 158], [884, 124], [878, 100], [876, 80]], w: [5.8, 4.1, 2.6, 1.4], thr: .124 },
    { p: [[790, 146], [776, 116], [768, 96], [766, 78]], w: [5.2, 3.7, 2.4, 1.3], thr: .238 },
    { p: [[690, 140], [700, 112], [704, 94], [706, 78]], w: [4.6, 3.3, 2.1, 1.1], thr: .342 },
    { p: [[240, 80], [218, 96], [202, 106], [190, 112]], w: [3.2, 2.3, 1.5, .85], thr: .808 },
    { p: [[165, 74], [148, 90], [138, 100]], w: [2.8, 2, 1.2], thr: .886 }
  ];

  // --- цветы: [x, y, радиус, поворот, порог проявления] ---
  const BLOSSOMS = [
    [670, 48, 24, -.3, .40], [560, 62, 23, .35, .50], [458, 60, 22, .1, .60],
    [372, 50, 22, -.4, .70], [292, 40, 20, .25, .78], [876, 76, 23, .2, .18],
    [766, 74, 22, -.25, .30], [706, 74, 21, .45, .40], [190, 114, 18, -.5, .86],
    [138, 102, 17, .3, .93], [600, 134, 16, .2, .52], [430, 124, 16, -.3, .65],
    [820, 120, 15, .4, .22], [615, 96, 14, -.2, .55], [500, 100, 14, .3, .62]
  ];
  // --- бутоны: [x, y, радиус, поворот, порог] ---
  const BUDS = [
    [700, 142, 7, 1.4, .36], [490, 130, 6, 1.2, .57],
    [790, 148, 7, 1.5, .26], [240, 82, 6, 1.3, .84]
  ];

  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const ease = p => (p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
  const easeBack = p => {
    const c = 1.70158 + 1;
    return 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2);
  };

  // ---------------------------------------------------------- геометрия
  // Catmull-Rom: гладкая линия через опорные точки + своя ширина на точку.
  function smooth(pts, seg) {
    if (pts.length < 2) return [];
    const p = [pts[0]].concat(pts, [pts[pts.length - 1]]);
    const out = [];
    for (let i = 1; i < p.length - 2; i++) {
      const p0 = p[i - 1], p1 = p[i], p2 = p[i + 1], p3 = p[i + 2];
      for (let s = 0; s < seg; s++) {
        const t = s / seg, t2 = t * t, t3 = t2 * t;
        out.push([
          0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
          0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)
        ]);
      }
    }
    out.push(pts[pts.length - 1]);
    return out;
  }

  // Готовим линию: точки + ширина в каждой точке + накопленная длина.
  function prep(pts, widths) {
    const seg = 10;
    const line = smooth(pts, seg);
    const n = pts.length - 1;
    const w = new Array(line.length);
    for (let i = 0; i < line.length; i++) {
      w[i] = widths[Math.min(n, Math.floor(i / seg))];
    }
    const cum = [0];
    for (let i = 1; i < line.length; i++) {
      cum.push(cum[i - 1] + Math.hypot(line[i][0] - line[i - 1][0], line[i][1] - line[i - 1][1]));
    }
    return { line: line, w: w, cum: cum, total: cum[cum.length - 1] || 1 };
  }

  // Рисуем линию не целиком, а до доли upto её длины — эффект прорастания.
  function strokePath(g, L, upto) {
    const lim = clamp(upto, 0, 1) * L.total;
    g.lineCap = 'round'; g.lineJoin = 'round';
    g.strokeStyle = INK;
    for (let i = 1; i < L.line.length; i++) {
      if (L.cum[i] > lim) break;
      g.lineWidth = Math.max(.6, L.w[i]);
      g.beginPath();
      g.moveTo(L.line[i - 1][0], L.line[i - 1][1]);
      g.lineTo(L.line[i][0], L.line[i][1]);
      g.stroke();
    }
  }

  const SP = prep(SPINE, SPINE_W);
  const TW = TWIGS.map(t => ({ L: prep(t.p, t.w), thr: t.thr }));

  // ------------------------------------------------------- цветок / бутон
  function petal(g, rx, ry) {
    g.beginPath();
    g.moveTo(0, -ry);
    g.bezierCurveTo(rx, -ry * .5, rx, ry * .6, 0, ry);
    g.bezierCurveTo(-rx, ry * .6, -rx, -ry * .5, 0, -ry);
    g.closePath();
  }

  function blossom(g, x, y, r, rot, k) {
    if (k <= .001) return;
    g.save();
    g.translate(x, y); g.rotate(rot); g.scale(k, k);
    const pr = r * .52, pl = r * .5;
    for (let i = 0; i < 5; i++) {
      g.save();
      g.rotate(i * TAU / 5);
      g.translate(0, -pr);
      petal(g, pl * 1.02, pl);
      g.fillStyle = BG; g.fill();
      g.lineWidth = Math.max(1, r * .085);
      g.strokeStyle = INK; g.stroke();
      g.restore();
    }
    g.beginPath();
    g.arc(0, 0, Math.max(1, r * .1), 0, TAU);
    g.fillStyle = INK; g.fill();
    g.restore();
  }

  function bud(g, x, y, r, rot, k) {
    if (k <= .001) return;
    g.save();
    g.translate(x, y); g.rotate(rot); g.scale(k, k);
    g.beginPath();
    g.ellipse(0, 0, r * .42, r * .6, 0, 0, TAU);
    g.fillStyle = BG; g.fill();
    g.lineWidth = Math.max(1, r * .18);
    g.strokeStyle = INK; g.stroke();
    g.restore();
  }

  // Рисуем сцену целиком: ветка + цветы. prog — общий прогресс 0..1.
  // Каждый элемент доводится до 100% ровно к prog = 1.
  function drawScene(g, prog) {
    strokePath(g, SP, ease(clamp(prog / .55, 0, 1)));
    for (let i = 0; i < TW.length; i++) {
      const t = TW[i];
      strokePath(g, t.L, ease(clamp((prog - t.thr) / (1 - t.thr), 0, 1)));
    }
    for (let i = 0; i < BLOSSOMS.length; i++) {
      const b = BLOSSOMS[i];
      blossom(g, b[0], b[1], b[2], b[3], easeBack(clamp((prog - b[4]) / (1 - b[4]), 0, 1)));
    }
    for (let i = 0; i < BUDS.length; i++) {
      const b = BUDS[i];
      bud(g, b[0], b[1], b[2], b[3], easeBack(clamp((prog - b[4]) / (1 - b[4]), 0, 1)));
    }
  }

  // --------------------------------------------------------- лепестки
  const petals = [];
  const SPOTS = BLOSSOMS.map(b => [b[0], b[1]]);
  function spawn(p) {
    const s = SPOTS[(Math.random() * SPOTS.length) | 0];
    p.x = s[0] + (Math.random() - .5) * 30;
    p.y = s[1] + (Math.random() - .5) * 22;
    p.vx = -(4 + Math.random() * 9);
    p.vy = (6 + Math.random() * 11);
    p.r = 5 + Math.random() * 5;
    p.rot = Math.random() * TAU;
    p.vr = (Math.random() - .5) * 2.4;
    p.flip = Math.random() * TAU;
    p.a = .5 + Math.random() * .45;
    p.on = 1;
  }

  function drawPetal(g, p) {
    g.save();
    g.translate(p.x, p.y); g.rotate(p.rot);
    g.scale(Math.max(.08, Math.abs(Math.cos(p.flip))), 1);
    petal(g, p.r * 1.7, p.r * .9);
    g.fillStyle = 'rgba(247,247,247,' + p.a.toFixed(3) + ')'; g.fill();
    g.lineWidth = Math.max(.55, p.r * .12);
    g.strokeStyle = 'rgba(10,10,10,' + (p.a * .8).toFixed(3) + ')'; g.stroke();
    g.restore();
  }

  function fall(p, dt) {
    p.x += p.vx * dt * .06;
    p.y += p.vy * dt * .06;
    p.rot += p.vr * dt * .0016;
    p.flip += dt * .0016;
    if (p.y > BASE_H + 40 || p.x < -40) { p.on = 0; return; }
    drawPetal(ctx, p);
  }

  // ------------------------------------------------------------- кадры
  let dpr = 1;
  let raf = 0, on = false, away = false, t0 = 0;
  let parX = 0, parY = 0;
  let scene = null, sx = null, cached = false;

  function layout() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.ceil(BASE_W * dpr);
    canvas.height = Math.ceil(BASE_H * dpr);
    scene = d.createElement('canvas');
    scene.width = canvas.width;
    scene.height = canvas.height;
    sx = scene.getContext('2d');
    cached = false;
  }

  function buildScene() {
    sx.setTransform(dpr, 0, 0, dpr, 0, 0);
    sx.clearRect(0, 0, BASE_W, BASE_H);
    drawScene(sx, 1);
    cached = true;
  }

  function frame(ts) {
    raf = 0;
    if (!on) return;
    if (!t0) t0 = ts;
    const el = ts - t0;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, BASE_W, BASE_H);

    // покачивание вокруг правого основания + параллакс за курсором
    ctx.save();
    const sway = Math.sin(el / 2600) * .012;
    ctx.translate(parX + Math.sin(el / 3200) * 3, parY);
    ctx.translate(BASE_W * .9, BASE_H * .55);
    ctx.rotate(sway);
    ctx.translate(-BASE_W * .9, -BASE_H * .55);

    if (!cached) {
      drawScene(ctx, clamp(el / REVEAL, 0, 1));
      if (el > REVEAL) { buildScene(); }
    } else {
      ctx.drawImage(scene, 0, 0, BASE_W, BASE_H);
    }

    // падающие лепестки — после проявления основной массы
    const want = (window.innerWidth < 720 ? 8 : 16);
    while (petals.length < want) petals.push({ on: 0 });
    for (let i = 0; i < petals.length; i++) {
      const q = petals[i];
      if (!q.on) {
        if (el > REVEAL * .6 + (i % 7) * 90) spawn(q);
        else continue;
      }
      fall(q, 16);
    }
    // Чистим «погасшие» лепестки после всплесков, чтобы массив не рос бесконечно.
    if (petals.length > 160) {
      for (let i = petals.length - 1; i >= 0 && petals.length > want; i--) {
        if (!petals[i].on) petals.splice(i, 1);
      }
    }

    ctx.restore();
    raf = requestAnimationFrame(frame);
  }

  function staticFrame() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, BASE_W, BASE_H);
    drawScene(ctx, 1);
  }

  function start() {
    if (on || calm.matches) return;
    on = true; t0 = 0;
    raf = requestAnimationFrame(frame);
  }
  function stop() {
    on = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  // -------------------------------------------------------------- запуск
  function boot() {
    layout();
    if (calm.matches) { staticFrame(); return; }

    start();

    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(es => {
        es.forEach(e => {
          if (e.isIntersecting) { away = false; start(); }
          else { away = true; stop(); }
        });
      }, { threshold: 0 });
      io.observe(canvas);
    }

    d.addEventListener('visibilitychange', () => {
      if (d.hidden) stop();
      else if (!away) start();
    });

    let rz = 0;
    window.addEventListener('resize', () => {
      clearTimeout(rz);
      rz = setTimeout(() => {
        layout();
        if (calm.matches) staticFrame();
      }, 180);
    }, { passive: true });

    if (fine) {
      window.addEventListener('mousemove', e => {
        parX = (e.clientX / window.innerWidth - .5) * -10;
        parY = (e.clientY / window.innerHeight - .5) * -7;
      }, { passive: true });

      // Интерактив с веткой: клик по hero — всплеск лепестков,
      // движение курсора — редкие лепестки, как будто ветка отзывается.
      const hero = canvas.closest ? canvas.closest('.hero') : null;
      if (hero) {
        const toBase = e => {
          const r = canvas.getBoundingClientRect();
          if (!r.width || !r.height) return null;
          const bx = (e.clientX - r.left) / r.width * BASE_W;
          const by = (e.clientY - r.top) / r.height * BASE_H;
          return (bx > -30 && bx < BASE_W + 30 && by > -30 && by < BASE_H + 30) ? [bx, by] : null;
        };
        hero.addEventListener('click', e => {
          const b = toBase(e);
          if (!b) return;
          for (let i = 0; i < 14; i++) {
            const p = { on: 0 };
            spawn(p);
            p.x = b[0]; p.y = b[1];
            p.vx = (Math.random() - .5) * 18;
            p.vy = -3 + Math.random() * 9;
            p.a = .55 + Math.random() * .4;
            petals.push(p);
          }
        });
        let lastMove = 0;
        hero.addEventListener('mousemove', e => {
          const now = performance.now();
          if (now - lastMove < 260) return;
          lastMove = now;
          const b = toBase(e);
          if (!b) return;
          const p = { on: 0 };
          spawn(p);
          p.x = b[0]; p.y = b[1];
          p.vy = 3 + Math.random() * 6; p.vx = -(2 + Math.random() * 8);
          petals.push(p);
        }, { passive: true });
      }
    }

    window.addEventListener('beforeunload', stop);
  }

  boot();
})(document);
// ================================================================
// ART v4 — дополнительные эффекты «вау»: прожектор за курсором,
// кинематографичный посимвольный вход hero-заголовка, магнитные ссылки.
// Всё изолировано и отключается при «уменьшить анимации».
// ================================================================
(function () {
  const d = document;
  const mm = q => ('matchMedia' in window) ? window.matchMedia(q).matches : false;
  const fine = mm('(hover: hover) and (pointer: fine)');
  const reduced = mm('(prefers-reduced-motion: reduce)');
  const guard = fn => { try { fn(); } catch (e) {} };

  // ---- ПРОЖЕКТОР за курсором: мягкий свет, оживляющий плоские секции ----
  guard(() => {
    if (!fine || reduced) return;
    const spot = d.createElement('div');
    spot.className = 'spotlight';
    d.body.appendChild(spot);
    let tx = window.innerWidth / 2, ty = window.innerHeight / 2;
    let cx = tx, cy = ty;
    d.addEventListener('mousemove', e => { tx = e.clientX; ty = e.clientY; }, { passive: true });
    const loop = () => {
      cx += (tx - cx) * .14; cy += (ty - cy) * .14;
      spot.style.setProperty('--sx', cx + 'px');
      spot.style.setProperty('--sy', cy + 'px');
      requestAnimationFrame(loop);
    };
    loop();
  });

  // ---- HERO-ЗАГОЛОВОК: посимвольный вход с 3D-разворотом ----
  guard(() => {
    const title = d.querySelector('.hero__title');
    if (!title || reduced) return;
    let idx = 0;
    title.querySelectorAll(':scope > span').forEach(line => {
      const text = line.textContent;
      line.textContent = '';
      Array.from(text).forEach(ch => {
        if (ch === ' ') { line.appendChild(d.createTextNode(' ')); return; }
        const s = d.createElement('span');
        s.className = 'hl';
        s.style.setProperty('--i', idx++);
        s.textContent = ch;
        line.appendChild(s);
      });
    });
    // запускаем после прелоадера
    const go = () => title.classList.add('hero__title--lit');
    if (d.readyState === 'complete') setTimeout(go, 1750);
    else window.addEventListener('load', () => setTimeout(go, 1750));
    setTimeout(go, 2600); // страховка
  });

  // ---- МАГНИТНЫЕ ссылки: тянутся к курсору ----
  guard(() => {
    if (!fine || reduced) return;
    d.querySelectorAll('.nav__link, .contact__link, .logo, .lang-switch').forEach(el => {
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        const dx = (e.clientX - r.left - r.width / 2) / r.width * 14;
        const dy = (e.clientY - r.top - r.height / 2) / r.height * 10;
        el.style.transform = 'translate(' + dx.toFixed(2) + 'px,' + dy.toFixed(2) + 'px)';
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
  });
})();

