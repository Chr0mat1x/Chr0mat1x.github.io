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
// ART v4 — Чёрно-белая цветущая ветка сакуры (Hero Sakura)
// Ч/б лайн-арт по референсу: сучковатый ствол входит из верхнего
// правого угла, дальше идут веточки, на них бутоны и крупные
// 5-лепестковые цветы с тычинками, с ветки срываются лепестки.
// ================================================================
(function () {
  const d = document;
  const guard = fn => { try { fn(); } catch (e) {} };
  guard(() => {
    const canvas = d.getElementById('heroSakura');
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rAF = cb => (requestAnimationFrame || (f => setTimeout(f, 16)))(cb);
    const TAU = Math.PI * 2;

    // -------- Мелочи --------
    const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
    const lerp = (a, b, t) => a + (b - a) * t;
    const easeOut = t => 1 - (1 - t) * (1 - t);
    const easeSoft = t => 1 - (1 - t) * (1 - t) * (1 - t);
    const hash = n => {                    // предсказуемый «рандом» 0..1
      const s = Math.sin(n * 12.9898) * 43758.5453;
      return s - Math.floor(s);
    };

    // -------- Сцена --------
    // Дизайн-координаты: dx — влево от правого края hero, dy — вниз от верхнего.
    // Бокс BOX_W × BOX_H переносится на холст с общим масштабом scale.
    const BOX_W = 780, BOX_H = 620, PAD = 60;
    const reduced = ('matchMedia' in window) &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fine = ('matchMedia' in window) &&
      window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    let width = 0, height = 0, dpr = 1, scale = 1;
    let elapsed = 0, last = 0, animId = null, running = false, started = false;
    let growEnd = 3, bloomEnd = 4;         // посчитаются по скелету
    let baked = false, layer = null;       // слой с выросшим «деревом»
    let par = 0, parY = 0, parTX = 0, parTY = 0;
    const sprites = new Map();             // кэш отрисованных цветов и бутонов

    // -------- Скелет ветки --------
    // pts — узлы осевой линии, w — толщина [у основания, на конце],
    // at — где ветка крепится к родителю (доля его длины),
    // speed — скорость роста в дизайн-пикселях за секунду, bump — «сучковатость».
    const TRUNK = 0;
    const limbs = [
      { pts: [[-70, -70], [10, 12], [100, 84], [196, 142], [306, 184], [420, 214], [512, 228], [578, 236]],
        w: [34, 7], speed: 360, bump: .18 },
      { pts: [[100, 84], [152, 38], [214, 8], [296, -12], [382, -22]],
        w: [14, 3.2], parent: TRUNK, at: .29, speed: 400, bump: .14 },
      { pts: [[306, 184], [338, 248], [350, 318], [344, 392], [322, 458], [292, 512]],
        w: [15, 3], parent: TRUNK, at: .585, speed: 400, bump: .16 },
      { pts: [[196, 142], [224, 104], [252, 76], [276, 56]],
        w: [8, 2.4], parent: TRUNK, at: .435, speed: 440, bump: .12 },
      { pts: [[240, -2], [268, 24], [288, 48]],
        w: [6.5, 2.2], parent: 1, at: .38, speed: 440, bump: .12 },
      { pts: [[348, 310], [394, 330], [432, 340]],
        w: [6.5, 2.2], parent: 2, at: .35, speed: 440, bump: .12 },
      { pts: [[336, 424], [382, 442], [414, 452]],
        w: [6, 2], parent: 2, at: .72, speed: 440, bump: .12 },
      { pts: [[424, 214], [470, 196], [508, 184]],
        w: [7, 2.4], parent: TRUNK, at: .74, speed: 440, bump: .12 },
      { pts: [[100, 84], [128, 58], [152, 42]],
        w: [7, 2.4], parent: TRUNK, at: .315, speed: 420, bump: .12 },
      { pts: [[238, 90], [264, 84], [286, 92]],
        w: [5, 1.8], parent: 3, at: .55, speed: 460, bump: .1 },
      { pts: [[346, 348], [300, 362], [270, 372]],
        w: [6, 2.2], parent: 2, at: .55, speed: 440, bump: .12 },
      { pts: [[404, 332], [420, 300], [430, 276]],
        w: [5, 1.8], parent: 5, at: .6, speed: 460, bump: .1 },
      { pts: [[44, 40], [86, 20], [124, 12]],
        w: [6, 2.2], parent: TRUNK, at: .19, speed: 430, bump: .12 },
      { pts: [[312, 26], [338, 12], [362, 8]],
        w: [4.5, 1.6], parent: 4, at: .55, speed: 460, bump: .1 },
      { pts: [[472, 196], [494, 168], [502, 144]],
        w: [5, 1.8], parent: 7, at: .62, speed: 460, bump: .1 },
      { pts: [[578, 236], [606, 262], [620, 292]],
        w: [5, 1.6], parent: TRUNK, at: .93, speed: 430, bump: .1 }
    ];



    // -------- Цветы и бутоны --------
    // l — ветка, t — доля по её длине, off — смещение от оси (знак = сторона),
    // r — радиус, sq — ракурс (сжатие), hero — крупный цветок с тычинками,
    // d — задержка распускания, bud — цветок распускается из бутона.
    const F = (l, t, off, r, sq, hero, d, bud) => ({
      l, t, off, r, sq, hero: hero ? 1 : 0, d, bud: bud ? 1 : 0
    });
    const B = (l, t, off, r, d) => ({ l, t, off, r, d });

    const blooms = [
      F(0, .30, -36, 35, .94, 0, .06, 1),
      F(0, .44, 60, 52, 1, 1, .30),          // главный цветок
      F(0, .55, -24, 18, .82, 0, .10),
      F(0, .63, 54, 45, .96, 1, .42),        // второй крупный
      F(0, .74, -44, 30, .90, 0, .24),
      F(0, .86, 38, 25, .86, 0, .18),
      F(0, .97, -15, 15, .80, 0, .14),
      F(1, .24, 32, 27, .92, 0, .10),
      F(1, .52, 28, 21, .82, 0, .14, 1),
      F(1, .78, -24, 16, .86, 0, .10),
      F(1, .97, 10, 12, .76, 0, .05),
      F(2, .16, -34, 22, .86, 0, .10),
      F(2, .32, 48, 38, .95, 1, .34),
      F(2, .52, -38, 30, .88, 0, .20),
      F(2, .70, 40, 25, .90, 0, .14, 1),
      F(2, .88, -28, 17, .80, 0, .10),
      F(3, .62, 28, 18, .86, 0, .10),
      F(3, .95, 8, 11, .76, 0, .05),
      F(4, .80, 24, 16, .86, 0, .10),
      F(5, .75, -26, 15, .80, 0, .10, 1),
      F(6, .85, 22, 14, .80, 0, .10),
      F(7, .70, -28, 17, .86, 0, .10),
      F(8, .80, 19, 13, .80, 0, .05),
      F(9, .80, -21, 14, .80, 0, .10),
      F(10, .85, 17, 12, .78, 0, .05),
      F(11, .80, -19, 13, .80, 0, .05),
      F(12, .85, 15, 12, .78, 0, .05),
      F(13, .80, -17, 13, .80, 0, .05),
      F(14, .80, 15, 11, .78, 0, .05),
      F(15, .80, -15, 12, .78, 0, .05)
    ];

    const buds = [
      B(0, .20, 42, 10, .05), B(0, .50, 34, 9, .12),
      B(1, .99, -8, 9, .05), B(2, .97, 10, 10, .08),
      B(3, .99, -12, 10, .05), B(4, .97, -10, 8, .05),
      B(5, .97, 12, 9, .05), B(6, .96, 14, 9, .05),
      B(7, .96, 14, 10, .05), B(8, .98, 10, 8, .05),
      B(9, .95, -10, 9, .05), B(10, .97, -12, 8, .05),
      B(11, .93, -10, 8, .05), B(12, .95, 12, 9, .05),
      B(13, .97, -10, 8, .05), B(14, .95, 10, 8, .05),
      B(15, .98, -12, 9, .05)
    ];

    // -------- Геометрия --------
    function smooth(pts, per) {            // Catmull-Rom → плотная полилиния
      const out = [], n = pts.length;
      for (let i = 0; i < n - 1; i++) {
        const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || pts[i + 1];
        for (let s = 0; s < per; s++) {
          const t = s / per, t2 = t * t, t3 = t2 * t;
          out.push({
            x: .5 * (2 * p1[0] + (-p0[0] + p2[0]) * t +
              (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 +
              (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
            y: .5 * (2 * p1[1] + (-p0[1] + p2[1]) * t +
              (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 +
              (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)
          });
        }
      }
      out.push({ x: pts[n - 1][0], y: pts[n - 1][1] });
      return out;
    }

    function pointAt(sp, cum, dist) {      // точка, касательная и нормаль по длине
      const total = cum[cum.length - 1];
      const s = clamp(dist, 0, total);
      let j = 1;
      while (j < cum.length - 1 && cum[j] < s) j++;
      const a = sp[j - 1], b = sp[j];
      const t = clamp((s - cum[j - 1]) / Math.max(.0001, cum[j] - cum[j - 1]), 0, 1);
      const dx = b.x - a.x, dy = b.y - a.y, m = Math.hypot(dx, dy) || 1;
      return {
        x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t),
        tx: dx / m, ty: dy / m, nx: -dy / m, ny: dx / m
      };
    }

    function widthAt(lb, t) {
      return Math.max(.9, lerp(lb.w[0], lb.w[1], t) * (1 + lb.bump * Math.sin(t * 9.2 + lb.seed)));
    }

    function buildTree() {
      limbs.forEach((lb, i) => {
        if (lb.parent != null) {           // прирастаем точно к телу родителя
          const p = limbs[lb.parent];
          const at = pointAt(p.sp, p.cum, p.len * lb.at);
          lb.pts[0] = [-at.x, at.y];       // родитель живёт в экранных X — возвращаем в дизайн
        }
        // зеркалим X: дальше всё живёт в экранных координатах
        // (dx влево от правого края = -X, dy вниз = +Y)
        lb.sp = smooth(lb.pts.map(p => [-p[0], p[1]]), 7);
        lb.cum = [0];
        let total = 0;
        for (let j = 1; j < lb.sp.length; j++) {
          total += Math.hypot(lb.sp[j].x - lb.sp[j - 1].x, lb.sp[j].y - lb.sp[j - 1].y);
          lb.cum.push(total);
        }
        lb.len = total || 1;
        lb.tan = lb.sp.map((p, j) => {
          const a = lb.sp[Math.max(0, j - 1)], b = lb.sp[Math.min(lb.sp.length - 1, j + 1)];
          const dx = b.x - a.x, dy = b.y - a.y, m = Math.hypot(dx, dy) || 1;
          return { x: dx / m, y: dy / m };
        });
        lb.seed = i * 3.7 + 1;
        if (lb.parent == null) {
          lb.t0 = 0;
        } else {
          const p = limbs[lb.parent];
          lb.t0 = p.t0 + (p.t1 - p.t0) * lb.at + .05;
        }
        lb.t1 = lb.t0 + Math.max(.28, lb.len / lb.speed);
      });

      growEnd = limbs.reduce((m, l) => Math.max(m, l.t1), 0);

      const anchor = o => {
        const lb = limbs[o.l];
        const p = pointAt(lb.sp, lb.cum, lb.len * o.t);
        o.ax = p.x; o.ay = p.y;            // точка крепления на ветке
        o.ox = -p.nx * o.off;              // off > 0 — «ниже» ветки (внешняя сторона)
        o.oy = -p.ny * o.off;
        o.cx = p.x + o.ox;                 // центр цветка
        o.cy = p.y + o.oy;
        return o;
      };

      blooms.forEach((fl, i) => {
        anchor(fl);
        fl.seed = 7.3 + i * 2.1;
        fl.at = limbs[fl.l].t1 + fl.d;     // момент распускания
      });
      buds.forEach((bd, i) => {
        anchor(bd);
        bd.seed = 31.7 + i * 3.3;
        bd.at = limbs[bd.l].t1 + bd.d;     // момент появления
      });
      // цветы «из бутона»: бутон раскрывается за секунду до цветка
      blooms.slice().forEach((fl, i) => {
        if (!fl.bud) return;
        fl.at += .75;
        buds.push(anchor({
          l: fl.l, t: fl.t, off: fl.off, r: fl.r * .42, d: fl.d,
          seed: 90.5 + i, at: fl.at - .75, into: fl
        }));
      });

      bloomEnd = blooms.reduce((m, f) => Math.max(m, f.at + 1.05), 0);
      blooms.sort((a, b) => b.r - a.r);    // крупные цветы поверх мелких
    }

    // -------- Дерево --------
    function drawLimb(g, lb, prog) {       // ствол/ветка как сужающаяся «лента»
      const p = clamp(prog, 0, 1);
      if (p <= .002) return;
      const total = lb.len, stop = total * p;
      const left = [], right = [];
      for (let j = 0; j < lb.sp.length; j++) {
        if (lb.cum[j] > stop) break;
        const pt = lb.sp[j], tan = lb.tan[j];
        const hw = widthAt(lb, lb.cum[j] / total) * .5;
        left.push([pt.x - tan.y * hw, pt.y + tan.x * hw]);
        right.push([pt.x + tan.y * hw, pt.y - tan.x * hw]);
      }
      if (p < 1) {                         // ровный «растущий» срез на конце
        const tip = pointAt(lb.sp, lb.cum, stop);
        const hw = widthAt(lb, p) * .24;
        left.push([tip.x - tip.ty * hw, tip.y + tip.tx * hw]);
        right.push([tip.x + tip.ty * hw, tip.y - tip.tx * hw]);
      }
      if (left.length < 2) return;
      g.beginPath();
      g.moveTo(left[0][0], left[0][1]);
      for (let j = 1; j < left.length; j++) g.lineTo(left[j][0], left[j][1]);
      for (let j = right.length - 1; j >= 0; j--) g.lineTo(right[j][0], right[j][1]);
      g.closePath();
      g.fillStyle = '#0a0a0a';
      g.fill();
    }

    function bakeLayer() {                 // выросшее дерево — в отдельный слой
      const w = BOX_W + PAD * 2, h = BOX_H + PAD * 2;
      if (!layer) {
        layer = d.createElement('canvas');
      }
      if (layer.width !== Math.ceil(w * dpr) || layer.height !== Math.ceil(h * dpr)) {
        layer.width = Math.ceil(w * dpr);
        layer.height = Math.ceil(h * dpr);
      }
      const g = layer.getContext('2d');
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, w, h);
      g.translate(BOX_W + PAD, PAD);       // слой живёт в дизайн-координатах
      limbs.forEach(lb => drawLimb(g, lb, 1));
      baked = true;
    }

    // ============================================================
    // Отрисовка: лепесток, цветок, бутон
    // ============================================================
    function petalPath(g, len, wid, notch, point) {   // лепесток «смотрит» вверх (−Y)
      const n = clamp(notch, 0, 1), p = clamp(point || 0, 0, 1);
      const tip = -len * (.95 + .1 * p);
      g.beginPath();
      g.moveTo(0, 0);
      g.bezierCurveTo(-wid * .95, -len * .24, -wid, -len * .68, -wid * .52, tip);
      if (n > 0) {
        g.quadraticCurveTo(-wid * .26, -len * (.95 - .2 * n), 0, -len * (.95 - .17 * n));
        g.quadraticCurveTo(wid * .26, -len * (.95 - .2 * n), wid * .52, tip);
      } else {                                          // для бутонов — острый кончик
        g.quadraticCurveTo(0, -len * (1.02 + .18 * p), wid * .52, tip);
      }
      g.bezierCurveTo(wid, -len * .68, wid * .95, -len * .24, 0, 0);
      g.closePath();
    }

    function paintFlower(g, r, seed, open, hero, sq) {
      const base = hash(seed) * TAU;
      const lw = Math.max(.7, r * .055);
      g.save();
      g.rotate(base);
      g.scale(1, sq);
      for (let i = 0; i < 5; i++) {
        const o = clamp((open - i * .09) / .5, 0, 1);   // лепестки раскрываются по очереди
        if (o <= 0) continue;
        const e = easeSoft(o);
        const len = r * lerp(.55, 1, e) * (.93 + .14 * hash(seed + i * 7.1));
        const wid = len * (.52 + .05 * hash(seed + i * 13.7));
        g.save();
        g.rotate(i * TAU / 5 + (1 - e) * -1.15 + (hash(seed + i * 3.3) - .5) * .18);
        petalPath(g, len, wid, 1);
        g.fillStyle = 'rgba(255,255,255,.97)';
        g.fill();
        g.lineWidth = lw;
        g.strokeStyle = 'rgba(10,10,10,.9)';
        g.stroke();
        g.lineWidth = Math.max(.5, r * .028);          // прожилки на лепестке
        g.strokeStyle = 'rgba(10,10,10,.15)';
        for (let v = -1; v <= 1; v += 2) {
          g.beginPath();
          g.moveTo(v * wid * .18, -len * .2);
          g.quadraticCurveTo(v * wid * .36, -len * .52, v * wid * .3, -len * .8);
          g.stroke();
        }
        g.restore();
      }
      g.restore();

      g.save();
      g.rotate(base);
      g.scale(1, sq);
      if (hero && open > .8) {                         // длинные тычинки-«усики»
        const n = 9 + Math.floor(hash(seed + 21.3) * 5);
        g.lineWidth = Math.max(.6, r * .022);
        g.strokeStyle = 'rgba(10,10,10,.5)';
        for (let i = 0; i < n; i++) {
          const a = i * TAU / n + (hash(seed + i * 5.5) - .5) * .5;
          const len = r * (.95 + hash(seed + i * 9.1) * .6);
          const ex = Math.cos(a) * len, ey = Math.sin(a) * len;
          g.beginPath();
          g.moveTo(Math.cos(a) * r * .06, Math.sin(a) * r * .06);
          g.quadraticCurveTo(Math.cos(a + .14) * len * .62, Math.sin(a + .14) * len * .62, ex, ey);
          g.stroke();
          g.beginPath();
          g.arc(ex, ey, Math.max(.7, r * .035), 0, TAU);
          g.fillStyle = 'rgba(10,10,10,.65)';
          g.fill();
        }
      }
      const cn = 7 + Math.floor(hash(seed + 31.7) * 4); // пыльники в центре
      for (let i = 0; i < cn; i++) {
        const a = i * TAU / cn + (hash(seed + i * 11.3) - .5) * .8;
        const d2 = r * (.08 + hash(seed + i * 17.9) * .3);
        g.beginPath();
        g.arc(Math.cos(a) * d2, Math.sin(a) * d2, r * (.05 + hash(seed + i * 23.1) * .05), 0, TAU);
        g.fillStyle = 'rgba(10,10,10,.85)';
        g.fill();
      }
      g.save();                                        // чашелистик у основания
      g.translate(0, r * .1);
      g.scale(.55, 1);
      g.beginPath();
      g.arc(0, 0, r * .16, 0, TAU);
      g.fillStyle = 'rgba(10,10,10,.9)';
      g.fill();
      g.restore();
      g.restore();
    }

    function paintBud(g, r, seed, open) {
      const lw = Math.max(.7, r * .1);
      g.save();
      g.rotate((hash(seed) - .5) * .6);
      for (let i = -1; i <= 1; i++) {                  // три сомкнутых лепестка
        const k = i === 0 ? 1.05 : .8;
        g.save();
        g.rotate(i * (.3 + .4 * open));
        petalPath(g, r * 2 * k * (1 + .08 * open), r * .42 * (i === 0 ? 1 : .88), 0, 1);
        g.fillStyle = 'rgba(255,255,255,.97)';
        g.fill();
        g.lineWidth = lw;
        g.strokeStyle = 'rgba(10,10,10,.85)';
        g.stroke();
        g.restore();
      }
      g.beginPath();                                   // чашелистик
      g.moveTo(-r * .5, 0);
      g.quadraticCurveTo(0, -r * .32, r * .5, 0);
      g.quadraticCurveTo(0, r * .18, -r * .5, 0);
      g.fillStyle = 'rgba(10,10,10,.85)';
      g.fill();
      g.restore();
    }

    function sprite(kind, r, seed, hero, sq) {         // кэш готовых цветов/бутонов
      const key = [kind, r.toFixed(1), seed.toFixed(1), hero ? 1 : 0, sq.toFixed(2), dpr].join('|');
      const hit = sprites.get(key);
      if (hit) return hit;
      const size = Math.ceil(kind === 'flower' ? r * (hero ? 3.4 : 2.9) : r * 5.4);
      const c = d.createElement('canvas');
      c.width = c.height = Math.max(1, Math.ceil(size * dpr));
      const g = c.getContext('2d');
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.translate(size / 2, size / 2);
      if (kind === 'flower') paintFlower(g, r, seed, 1, hero, sq);
      else paintBud(g, r, seed, 1);
      const rec = { c, size };
      sprites.set(key, rec);
      return rec;
    }



    // ============================================================
    // Размещение цветов и бутонов
    // ============================================================
    function stock(g, o) {                 // цветоножка от ветки к цветку/бутону
      const mx = (o.ax + o.cx) / 2 - (o.cy - o.ay) * .14;
      const my = (o.ay + o.cy) / 2 + (o.cx - o.ax) * .14;
      g.beginPath();
      g.moveTo(o.ax, o.ay);
      g.quadraticCurveTo(mx, my, o.cx, o.cy);
      g.lineWidth = Math.max(1.1, o.r * .13);
      g.lineCap = 'round';
      g.strokeStyle = '#0a0a0a';
      g.stroke();
    }

    const outward = o => Math.atan2(o.oy, o.ox) + Math.PI / 2;

    function drawBloom(g, fl, t) {
      const open = clamp((t - fl.at) / 1.0, 0, 1);       // распускание
      if (open <= 0) return;
      stock(g, fl);
      g.save();
      g.translate(fl.cx, fl.cy);
      g.rotate(outward(fl) + (hash(fl.seed) - .5) * .6);
      if (open < 1) {                                    // живая отрисовка раскрытия
        const s = lerp(.34, 1, easeOut(open));
        g.scale(s, s);
        paintFlower(g, fl.r, fl.seed, open, fl.hero, fl.sq);
      } else {                                           // дальше — готовый спрайт
        const k = reduced ? 1 : 1 + Math.sin(t * 1.05 + fl.seed) * .012;
        g.scale(k, k);
        const sp = sprite('flower', fl.r, fl.seed, fl.hero, fl.sq);
        g.drawImage(sp.c, -sp.size / 2, -sp.size / 2, sp.size, sp.size);
      }
      g.restore();
    }

    function drawBud(g, bd, t) {
      const age = t - bd.at;
      if (age <= 0) return;
      const open = bd.into ? clamp((t - (bd.into.at - .55)) / .55, 0, 1) : 0;
      if (open >= 1) return;                             // бутон стал цветком
      const pop = clamp(age / .35, 0, 1);                // появление с лёгким «пыхом»
      stock(g, bd);
      g.save();
      g.translate(bd.cx, bd.cy);
      g.rotate(outward(bd) + (hash(bd.seed) - .5) * 1.1);
      const s = easeOut(pop) * (1 + .14 * (1 - pop));
      g.scale(s, s);
      if (open > 0) {
        paintBud(g, bd.r, bd.seed, open);
      } else {
        const sp = sprite('bud', bd.r, bd.seed, 0, 1);
        g.drawImage(sp.c, -sp.size / 2, -sp.size / 2, sp.size, sp.size);
      }
      g.restore();
    }

    // ============================================================
    // Опадающие лепестки
    // ============================================================
    const petals = [];

    const screenPos = o => ({ x: width + par + o.cx * scale, y: parY + o.cy * scale });

    function pickBloom(t) {
      const open = blooms.filter(f => t > f.at + 1.1);
      if (!open.length) return null;
      for (let k = 0; k < 6; k++) {                      // крупные цветы сыплются охотнее
        const f = open[Math.floor(Math.random() * open.length)];
        if (Math.random() < f.r / 46 + .22) return f;
      }
      return open[Math.floor(Math.random() * open.length)];
    }

    function placePetal(p, t) {
      const f = pickBloom(t);
      if (!f) { p.on = 0; return; }
      const s = screenPos(f);
      const k = Math.max(.55, scale);
      p.x = s.x + (Math.random() - .5) * f.r * scale * 1.2;
      p.y = s.y + (Math.random() - .5) * f.r * scale * 1.2;
      p.vx = -(5 + Math.random() * 13) * k;              // лёгкий снос влево
      p.vy = (7 + Math.random() * 13) * k;
      p.r = 6 + Math.random() * 6;                       // радиус в дизайн-пикселях
      p.rot = Math.random() * TAU;
      p.vr = (Math.random() - .5) * 2.6;
      p.flip = Math.random() * TAU;                      // «порхание» лепестка
      p.fs = 1.1 + Math.random() * 1.8;
      p.ph = Math.random() * TAU;
      p.a = .55 + Math.random() * .45;
      p.on = 1;
    }

    function drawPetal(g, p) {
      g.save();
      g.translate(p.x, p.y);
      g.rotate(p.rot);
      g.scale(Math.max(.08, Math.abs(Math.cos(p.flip))), 1);
      const r = p.r * scale;
      petalPath(g, r * 1.7, r * .9, 1);
      g.fillStyle = `rgba(255,255,255,${(p.a * .97).toFixed(3)})`;
      g.fill();
      g.lineWidth = Math.max(.55, r * .12);
      g.strokeStyle = `rgba(10,10,10,${(p.a * .8).toFixed(3)})`;
      g.stroke();
      g.restore();
    }

    // ============================================================
    // Размеры, кадр и жизненный цикл
    // ============================================================
    function initPetals() {
      const n = width < 720 ? 12 : 24;
      petals.length = 0;
      for (let i = 0; i < n; i++) {
        petals.push({ t0: bloomEnd * .55 + i * .34 });   // сыплются по одному, не залпом
      }
    }

    function layout() {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, Math.round(rect.width || window.innerWidth));
      height = Math.max(1, Math.round(rect.height || window.innerHeight));
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.ceil(width * dpr);
      canvas.height = Math.ceil(height * dpr);
      scale = clamp(Math.min(width / 1440, height / 900) * (width < 720 ? .74 : 1), .34, 1.6);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sprites.clear();
      baked = false;
      initPetals();
    }

    function render(t, dt) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      par += (parTX - par) * .05;
      parY += (parTY - parY) * .05;
      const sway = reduced ? 0 : Math.sin(t * .48) * .0045 + Math.sin(t * 1.27 + 1.7) * .0016;

      ctx.save();
      ctx.translate(width + par, parY);      // якорь — правый верхний угол hero
      ctx.rotate(sway);                      // ветка чуть качается на ветру
      ctx.scale(scale, scale);

      if (baked && layer) {
        ctx.drawImage(layer, -(BOX_W + PAD), -PAD, BOX_W + PAD * 2, BOX_H + PAD * 2);
      } else {
        limbs.forEach(lb => drawLimb(ctx, lb,
          clamp((t - lb.t0) / Math.max(.001, lb.t1 - lb.t0), 0, 1)));
        if (t >= growEnd) bakeLayer();       // выросло — переносим в слой
      }
      buds.forEach(bd => drawBud(ctx, bd, t));
      blooms.forEach(fl => drawBloom(ctx, fl, t));
      ctx.restore();

      if (reduced) return;

      // лепестки летят в экранных пикселях — рисуем уже вне «ветки»
      petals.forEach(p => {
        if (t < p.t0) return;
        if (!p.on) placePetal(p, t);
        if (!p.on) return;
        p.vy += 22 * dt;                              // гравитация
        p.x += (p.vx + Math.sin(t * 1.25 + p.ph) * 16) * dt;
        p.y += p.vy * dt;
        p.rot += p.vr * dt;
        p.flip += p.fs * dt;
        if (p.y > height + 50 || p.x < -60) placePetal(p, t);
        drawPetal(ctx, p);
      });
    }

    function frame(now) {
      animId = null;
      if (!last) last = now;
      const dt = clamp((now - last) / 1000, 0, .05);
      last = now;
      elapsed += dt;
      render(elapsed, dt);
      if (running) animId = rAF(frame);
    }

    function start() {
      if (running || reduced) return;
      running = true;
      last = 0;
      animId = rAF(frame);
    }

    function stop() {
      running = false;
      if (animId) cancelAnimationFrame(animId);
      animId = null;
    }

    let visible = true;

    function boot() {
      buildTree();
      layout();

      const relayout = () => {                     // ресайз и загрузка шрифтов
        layout();
        if (reduced) {
          elapsed = bloomEnd + 2;
          render(elapsed, 0);
        } else if (visible && started) {
          start();
        }
      };

      // шрифты могут изменить высоту hero — пересчитываем сцену
      if (d.fonts && d.fonts.ready && d.fonts.ready.then) {
        d.fonts.ready.then(() => relayout()).catch(() => {});
      }

      let rz = null;
      window.addEventListener('resize', () => {
        clearTimeout(rz);
        rz = setTimeout(relayout, 160);
      }, { passive: true });

      if (reduced) {                               // уважаем «уменьшить анимацию»
        elapsed = bloomEnd + 2;
        render(elapsed, 0);                        // одна статичная распустившаяся ветка
        return;
      }

      const begin = () => {
        if (!started) {
          started = true;
          // даём прелоадеру уехать, чтобы рост ветки было видно
          setTimeout(start, Math.max(0, 1750 - performance.now()));
        } else {
          start();
        }
      };

      if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver(es => {
          es.forEach(en => {
            visible = en.isIntersecting;
            if (visible) begin(); else stop();     // вне экрана — не жжём батарею
          });
        }, { threshold: 0 });
        io.observe(canvas);

        d.addEventListener('visibilitychange', () => {
          if (d.hidden) stop();
          else if (visible) start();
        });
      } else {
        begin();
      }

      if (fine) {                            // лёгкий параллакс от мыши (как у контента hero)
        window.addEventListener('mousemove', e => {
          parTX = (e.clientX / window.innerWidth - .5) * -7;
          parTY = (e.clientY / window.innerHeight - .5) * -5;
        }, { passive: true });
      }

      window.addEventListener('beforeunload', stop);
    }

    boot();
  });
})();

