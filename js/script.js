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
// ================================================================
(function () {
  const d = document;
  const guard = fn => { try { fn(); } catch (e) {} };
  guard(() => {
    const canvas = d.getElementById('heroSakura');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0, height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let animId = null;
    let startTime = performance.now();

    const branchSegments = [
      { x1: 1.02, y1: -0.02, x2: 0.88, y2: 0.12, t0: 0.00, t1: 0.20, w1: 13, w2: 9.5 },
      { x1: 0.88, y1: 0.12,  x2: 0.76, y2: 0.22, t0: 0.15, t1: 0.40, w1: 9.5, w2: 6.5 },
      { x1: 0.76, y1: 0.22,  x2: 0.64, y2: 0.28, t0: 0.32, t1: 0.60, w1: 6.5, w2: 4.2 },
      { x1: 0.64, y1: 0.28,  x2: 0.54, y2: 0.31, t0: 0.50, t1: 0.80, w1: 4.2, w2: 2.2 },
      { x1: 0.54, y1: 0.31,  x2: 0.45, y2: 0.33, t0: 0.70, t1: 1.00, w1: 2.2, w2: 1.2 },
      { x1: 0.88, y1: 0.12,  x2: 0.80, y2: 0.05, t0: 0.20, t1: 0.45, w1: 5.5, w2: 3.2 },
      { x1: 0.80, y1: 0.05,  x2: 0.72, y2: 0.02, t0: 0.38, t1: 0.65, w1: 3.2, w2: 1.5 },
      { x1: 0.72, y1: 0.02,  x2: 0.66, y2: 0.01, t0: 0.55, t1: 0.82, w1: 1.5, w2: 0.8 },
      { x1: 0.76, y1: 0.22,  x2: 0.70, y2: 0.34, t0: 0.35, t1: 0.60, w1: 5.0, w2: 2.8 },
      { x1: 0.70, y1: 0.34,  x2: 0.63, y2: 0.44, t0: 0.52, t1: 0.80, w1: 2.8, w2: 1.5 },
      { x1: 0.63, y1: 0.44,  x2: 0.58, y2: 0.50, t0: 0.72, t1: 0.98, w1: 1.5, w2: 0.8 },
      { x1: 0.64, y1: 0.28,  x2: 0.57, y2: 0.20, t0: 0.52, t1: 0.75, w1: 3.2, w2: 1.6 },
      { x1: 0.57, y1: 0.20,  x2: 0.50, y2: 0.16, t0: 0.68, t1: 0.92, w1: 1.6, w2: 0.8 },
      { x1: 0.54, y1: 0.31,  x2: 0.48, y2: 0.39, t0: 0.74, t1: 0.95, w1: 1.8, w2: 0.8 }
    ];

    const flowers = [
      { rx: 0.88, ry: 0.12, bloomDelay: 1.0, size: 14, angle: 0.3 },
      { rx: 0.80, ry: 0.05, bloomDelay: 1.3, size: 13, angle: -0.5 },
      { rx: 0.72, ry: 0.02, bloomDelay: 1.8, size: 11, angle: 0.8 },
      { rx: 0.66, ry: 0.01, bloomDelay: 2.1, size: 9,  angle: -0.2 },
      { rx: 0.84, ry: 0.09, bloomDelay: 1.5, size: 10, angle: 1.1 },
      { rx: 0.76, ry: 0.22, bloomDelay: 1.2, size: 15, angle: -0.7 },
      { rx: 0.70, ry: 0.34, bloomDelay: 1.7, size: 14, angle: 0.4 },
      { rx: 0.63, ry: 0.44, bloomDelay: 2.2, size: 13, angle: -0.9 },
      { rx: 0.58, ry: 0.50, bloomDelay: 2.6, size: 11, angle: 0.2 },
      { rx: 0.67, ry: 0.38, bloomDelay: 2.0, size: 9,  angle: 1.4 },
      { rx: 0.64, ry: 0.28, bloomDelay: 1.6, size: 14, angle: 0.6 },
      { rx: 0.57, ry: 0.20, bloomDelay: 2.0, size: 12, angle: -0.3 },
      { rx: 0.50, ry: 0.16, bloomDelay: 2.5, size: 10, angle: 0.9 },
      { rx: 0.54, ry: 0.31, bloomDelay: 2.2, size: 13, angle: -0.6 },
      { rx: 0.48, ry: 0.39, bloomDelay: 2.7, size: 11, angle: 0.5 },
      { rx: 0.45, ry: 0.33, bloomDelay: 2.8, size: 10, angle: -1.2 },
      { rx: 0.75, ry: 0.16, bloomDelay: 1.4, size: 8,  angle: 0.1 },
      { rx: 0.59, ry: 0.25, bloomDelay: 2.3, size: 7,  angle: -0.8 },
      { rx: 0.52, ry: 0.35, bloomDelay: 2.9, size: 8,  angle: 1.0 }
    ];

    const petals = [];
    for (let i = 0; i < 22; i++) {
      petals.push({
        x: 0.4 + Math.random() * 0.65,
        y: Math.random() * 1.1 - 0.1,
        speedY: 0.0003 + Math.random() * 0.00045,
        speedX: -0.00015 - Math.random() * 0.00025,
        swaySpeed: 1.2 + Math.random() * 1.8,
        swayAmp: 0.0008 + Math.random() * 0.0012,
        phase: Math.random() * Math.PI * 2,
        size: 5 + Math.random() * 6,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 1.5,
        opacity: 0.4 + Math.random() * 0.45
      });
    }

    function resize() {
      const rect = canvas.getBoundingClientRect();
      width = rect.width || window.innerWidth;
      height = rect.height || window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    window.addEventListener('resize', resize, { passive: true });
    resize();

    function drawFlower(cx, cy, radius, progress, baseAngle) {
      if (progress <= 0) return;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(baseAngle);
      ctx.scale(progress, progress);
      const petalNum = 5;
      for (let i = 0; i < petalNum; i++) {
        const a = (i * 2 * Math.PI) / petalNum;
        ctx.save();
        ctx.rotate(a);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(-radius * 0.45, -radius * 0.45, -radius * 0.55, -radius * 0.85, -radius * 0.18, -radius);
        ctx.lineTo(0, -radius * 0.85);
        ctx.lineTo(radius * 0.18, -radius);
        ctx.bezierCurveTo(radius * 0.55, -radius * 0.85, radius * 0.45, -radius * 0.45, 0, 0);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
        ctx.shadowBlur = 4;
        ctx.fill();
        ctx.shadowColor = 'transparent';
        ctx.strokeStyle = 'rgba(10, 10, 10, 0.8)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
      }
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.22, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(10, 10, 10, 0.85)';
      ctx.fill();
      for (let j = 0; j < 5; j++) {
        const ta = (j * 2 * Math.PI) / 5 + 0.3;
        ctx.beginPath();
        ctx.arc(Math.cos(ta) * radius * 0.4, Math.sin(ta) * radius * 0.4, 1.1, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(10, 10, 10, 0.7)';
        ctx.fill();
      }
      ctx.restore();
    }

    function drawFallingPetal(x, y, size, rot, opacity) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(-size * 0.4, -size * 0.4, -size * 0.5, -size * 0.85, -size * 0.15, -size);
      ctx.lineTo(0, -size * 0.82);
      ctx.lineTo(size * 0.15, -size);
      ctx.bezierCurveTo(size * 0.5, -size * 0.85, size * 0.4, -size * 0.4, 0, 0);
      ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 0.88})`;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.08)';
      ctx.shadowBlur = 3;
      ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.strokeStyle = `rgba(10, 10, 10, ${opacity * 0.65})`;
      ctx.lineWidth = 0.8;
      ctx.stroke();
      ctx.restore();
    }

    const reduced = ('matchMedia' in window) && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function render(now) {
      const elapsed = reduced ? 10 : (now - startTime) / 1000;
      ctx.clearRect(0, 0, width, height);

      const branchGrowthDuration = 2.6;
      const branchProgress = reduced ? 1 : Math.min(1, elapsed / branchGrowthDuration);
      const windSway = reduced ? 0 : Math.sin(elapsed * 0.8) * 0.003;

      branchSegments.forEach(seg => {
        if (branchProgress <= seg.t0) return;
        const segP = Math.min(1, (branchProgress - seg.t0) / (seg.t1 - seg.t0));
        if (segP <= 0) return;
        const ease = segP * (2 - segP);
        const x1 = seg.x1 * width;
        const y1 = (seg.y1 + windSway * (seg.t0 + 0.2)) * height;
        const targetX2 = (seg.x1 + (seg.x2 - seg.x1) * ease) * width;
        const targetY2 = (seg.y1 + (seg.y2 - seg.y1) * ease + windSway * (seg.t1 + 0.2)) * height;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(targetX2, targetY2);
        ctx.strokeStyle = '#0a0a0a';
        ctx.lineWidth = seg.w1 - (seg.w1 - seg.w2) * ease;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
      });

      flowers.forEach(fl => {
        if (!reduced && elapsed < fl.bloomDelay) return;
        const flowerAge = reduced ? 10 : (elapsed - fl.bloomDelay);
        const bloomDur = 0.85;
        let bloomScale = 1;
        if (!reduced) {
          if (flowerAge < bloomDur) {
            const p = flowerAge / bloomDur;
            bloomScale = Math.sin(p * Math.PI * 0.5) * (1 + 0.15 * (1 - p));
          } else {
            const breathe = Math.sin(elapsed * 1.5 + fl.rx * 10) * 0.03;
            bloomScale = 1 + breathe;
          }
        }
        const fx = fl.rx * width;
        const fy = (fl.ry + windSway * 1.2) * height;
        drawFlower(fx, fy, fl.size, bloomScale, fl.angle + windSway * 3);
      });

      if (!reduced) {
        petals.forEach(p => {
          p.y += p.speedY;
          p.x += p.speedX + Math.sin(elapsed * p.swaySpeed + p.phase) * p.swayAmp;
          p.rot += p.rotSpeed * 0.02;
          if (p.y > 1.05 || p.x < 0.25) {
            p.y = -0.05;
            p.x = 0.55 + Math.random() * 0.45;
          }
          drawFallingPetal(p.x * width, p.y * height, p.size, p.rot, p.opacity);
        });
      }

      if (!reduced) {
        animId = requestAnimationFrame(render);
      }
    }

    animId = requestAnimationFrame(render);

    window.addEventListener('beforeunload', () => {
      if (animId) cancelAnimationFrame(animId);
    });
  });
})();
