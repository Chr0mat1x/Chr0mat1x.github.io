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
// ART — сакура в hero. Исходный рисунок не перерисовывается: картинка
// img/sakura.png показывается как есть, а img/sakura-grow.png задаёт
// порядок проявления — сперва проступает ветка справа налево, затем по
// фронту раскрываются цветы и бутоны. Поверх — только падающие лепестки.
// ================================================================
(function (d) {
  if (!d) return;
  const guard = fn => { try { fn(); } catch (e) {} };

  guard(() => {
    const canvas = d.getElementById('heroSakura');
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Пути абсолютные: на /en/ относительные ушли бы в /en/img/
    const ART = '/img/sakura.png';
    const GROW = '/img/sakura-grow.png';
    const RATIO = 571 / 307;          // пропорции исходного рисунка
    const REVEAL = 2500;              // мс на проявление
    const STEPS = 150;                // ступеней фронта проявления
    const EDGE = 6;                   // резкость края проявления
    const MAXMASK = 600000;           // предел площади маски, px
    const TAU = Math.PI * 2;
    const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

    // Точки на ветке, от которых отрываются падающие лепестки.
    const SPOTS = [[.04, .57], [.11, .55], [.18, .61], [.25, .64], [.32, .62],
                   [.39, .60], [.46, .63], [.53, .62], [.60, .57], [.67, .54],
                   [.75, .52], [.82, .47], [.89, .37], [.96, .31]];

    const calm = window.matchMedia('(prefers-reduced-motion: reduce)');
    const fine = window.matchMedia('(hover:hover) and (pointer:fine)').matches;

    const artImg = new Image();
    const growImg = new Image();
    artImg.decoding = growImg.decoding = 'async';

    let ready = false;                // картинки загружены и пригодны
    let width = 1, height = 1, dpr = 1;
    let box = { x: 0, y: 0, w: 1, h: 1 };
    let comp = null, cctx = null;     // готовая к показу ветка
    let artCv = null;                 // исходный рисунок, не перетирается
    let mask = null, mctx = null;     // текущая маска проявления
    let levels = null, pix = null, pix32 = null;
    let shown = -1;                   // какая ступень маски уже в холсте
    let t0 = 0, raf = 0, on = false, away = false;
    let parX = 0, parY = 0;
    const petals = [];
    const lut = new Uint8Array(256);

    // ---------------------------------------------------------- геометрия
    // Ведём рисунок от правого края — так он и нарисован: ветка входит
    // в кадр справа, а тонкий кончик уходит влево.
    function layout() {
      const r = canvas.getBoundingClientRect();
      width = Math.max(1, Math.round(r.width || window.innerWidth));
      height = Math.max(1, Math.round(r.height || window.innerHeight));
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.ceil(width * dpr);
      canvas.height = Math.ceil(height * dpr);

      const wide = width >= 900;
      const w = clamp(width * (wide ? .48 : .92), 260, 800);
      const h = w / RATIO;
      box = { x: width - w, y: 0, w, h };
      build();
    }

    function build() {
      // Маску держим не крупнее MAXMASK — иначе проявление будет рваным
      // и проход по пикселям станет тяжёлым на телефонах.
      const res = Math.min(dpr, Math.sqrt(MAXMASK / (box.w * box.h)));
      const mw = Math.max(1, Math.round(box.w * res));
      const mh = Math.max(1, Math.round(box.h * res));

      // artCv — нетронутый рисунок. comp каждый раз собирается заново:
      // накладывать маску прямо на comp нельзя, destination-in съедал бы
      // картинку безвозвратно уже на первых кадрах.
      artCv = d.createElement('canvas');
      artCv.width = mw; artCv.height = mh;
      const actx = artCv.getContext('2d');
      actx.clearRect(0, 0, mw, mh);
      actx.drawImage(artImg, 0, 0, mw, mh);

      comp = d.createElement('canvas');
      comp.width = mw; comp.height = mh;
      cctx = comp.getContext('2d');

      mask = d.createElement('canvas');
      mask.width = mw; mask.height = mh;
      mctx = mask.getContext('2d', { willReadFrequently: true });

      const g = d.createElement('canvas');
      g.width = mw; g.height = mh;
      const gc = g.getContext('2d', { willReadFrequently: true });
      gc.drawImage(growImg, 0, 0, mw, mh);
      const data = gc.getImageData(0, 0, mw, mh).data;

      levels = new Uint8Array(mw * mh);
      for (let i = 0, j = 0; i < levels.length; i++, j += 4) {
        levels[i] = data[j];          // карта роста ч/б, все каналы равны
      }
      pix = mctx.createImageData(mw, mh);
      pix32 = new Uint32Array(pix.data.buffer);
      shown = -1;
    }

    // ------------------------------------------------- фронт проявления
    // Формируем маску по карте роста: пиксель появляется, когда фронт
    // доходит до его значения. Ступени считаем с запасом, чтобы при
    // p = 1 был виден весь рисунок целиком.
    function maskTo(p) {
      const thr = p * 300 - 24;
      for (let i = 0; i < 256; i++) {
        const v = Math.round((thr - i) * EDGE);
        lut[i] = v < 0 ? 0 : v > 255 ? 255 : v;
      }
      for (let i = 0; i < levels.length; i++) {
        pix32[i] = (lut[levels[i]] << 24) | 0x00ffffff;
      }
      mctx.putImageData(pix, 0, 0);
      cctx.globalCompositeOperation = 'source-over';
      cctx.clearRect(0, 0, comp.width, comp.height);
      cctx.drawImage(artCv, 0, 0);
      cctx.globalCompositeOperation = 'destination-in';
      cctx.drawImage(mask, 0, 0);
      cctx.globalCompositeOperation = 'source-over';
    }

    // --------------------------------------------------------- лепестки
    function spawn(p) {
      const s = SPOTS[(Math.random() * SPOTS.length) | 0];
      const k = box.w / 980;
      p.x = box.x + s[0] * box.w + (Math.random() - .5) * 30 * k;
      p.y = box.y + s[1] * box.h + (Math.random() - .5) * 22 * k;
      p.vx = -(4 + Math.random() * 11) * k;          // лёгкий снос влево
      p.vy = (7 + Math.random() * 13) * k;
      p.r = (5 + Math.random() * 6) * k;
      p.rot = Math.random() * TAU;
      p.vr = (Math.random() - .5) * 2.2;
      p.flip = Math.random() * TAU;                 // «порхание» лепестка
      p.a = .5 + Math.random() * .45;
    }

    function petalPath(g, rx, ry) {
      g.beginPath();
      g.moveTo(0, -ry);
      g.bezierCurveTo(rx, -ry * .5, rx, ry * .6, 0, ry);
      g.bezierCurveTo(-rx, ry * .6, -rx, -ry * .5, 0, -ry);
      g.closePath();
    }

    function drawPetal(g, p) {
      g.save();
      g.translate(p.x, p.y);
      g.rotate(p.rot);
      g.scale(Math.max(.08, Math.abs(Math.cos(p.flip))), 1);
      petalPath(g, p.r * 1.7, p.r * .9);
      g.fillStyle = 'rgba(255,255,255,' + p.a.toFixed(3) + ')';
      g.fill();
      g.lineWidth = Math.max(.55, p.r * .12);
      g.strokeStyle = 'rgba(10,10,10,' + (p.a * .8).toFixed(3) + ')';
      g.stroke();
      g.restore();
    }

    function fall(p, dt) {
      p.x += p.vx * dt * .06;
      p.y += p.vy * dt * .06;
      p.rot += p.vr * dt * .0016;
      p.flip += dt * .0016;
      if (p.y > height + 40 || p.x < -40) p.on = 0;
      else drawPetal(ctx, p);
    }

    // ------------------------------------------------------------- кадры
    function paint() {                                // разовая отрисовка
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(comp, box.x, box.y, box.w, box.h);
    }

    function frame(ts) {
      raf = 0;
      if (!on || !ready) return;
      if (!t0) t0 = ts;
      const k = box.w / 980;
      const el = ts - t0;
      const p = clamp(el / REVEAL, 0, 1);

      const st = Math.round(p * (STEPS - 1));
      if (st !== shown) { maskTo(p); shown = st; }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      // Едва заметное покачивание — рисунок остаётся живым после проявления.
      const sway = Math.sin(el / 3100) * 1.5 * k;
      ctx.save();
      ctx.translate(box.x + box.w / 2 + parX, box.y + box.h / 2 + parY);
      ctx.rotate(sway * .0012);
      ctx.translate(-box.w / 2, -box.h / 2);
      ctx.drawImage(comp, 0, 0, box.w, box.h);
      ctx.restore();

      const want = width < 720 ? 9 : 18;
      while (petals.length < want) petals.push({ on: 0 });
      for (let i = 0; i < petals.length; i++) {
        const q = petals[i];
        if (!q.on) {
          if (p > .55 + (i % 7) * .045) spawn(q);   // сыплются по одному
          else continue;
        }
        fall(q, 16);
      }

      raf = requestAnimationFrame(frame);
    }

    function start() {
      if (on || !ready || calm.matches) return;   // при спокойной анимации не крутим
      on = true;
      t0 = 0;
      raf = requestAnimationFrame(frame);
    }

    function stop() {
      on = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    }

    // -------------------------------------------------------------- запуск
    function boot() {
      if (!artImg.naturalWidth || !growImg.naturalWidth) return;  // hero пуст
      ready = true;
      layout();

      if (calm.matches) {                      // без анимации — статичный кадр
        maskTo(1);
        shown = STEPS - 1;
        paint();
      } else {
        start();
      }

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
          if (!ready) return;
          layout();
          if (calm.matches) { maskTo(1); paint(); }   // статичный кадр — перерисуем
        }, 180);
      }, { passive: true });

      if (fine) {                             // лёгкий параллакс за курсором
        window.addEventListener('mousemove', e => {
          parX = (e.clientX / window.innerWidth - .5) * -8;
          parY = (e.clientY / window.innerHeight - .5) * -6;
        }, { passive: true });
      }

      window.addEventListener('beforeunload', stop);
    }

    let got = 0;
    const hit = () => { if (++got === 2) boot(); };
    artImg.onload = growImg.onload = hit;
    artImg.onerror = growImg.onerror = hit;
    artImg.src = ART;
    growImg.src = GROW;
  });
})(document);

