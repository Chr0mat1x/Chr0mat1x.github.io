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

// ================================================================
// ART v5 — интерактивная сеть частиц в hero (библиотека tsParticles,
// MIT, cdn.jsdelivr.net). Монохром, линии тянутся к курсору, клик
// добавляет частицы. Если библиотека не загрузилась или включён
// режим «уменьшить анимации» — просто ничего не рисуем.
// ================================================================
(function () {
  const d = document;
  const reduced = ('matchMedia' in window) && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) return;
  const host = d.getElementById('heroParticles');
  if (!host) return;
  const tp = window.tsParticles;
  if (!tp || typeof tp.load !== 'function') return;

  const small = window.innerWidth < 720;
  const dark = '#111111';

  try {
    const runner = tp.load({ element: host, options: {
      fullScreen: { enable: false },
      detectRetina: true,
      fpsLimit: 60,
      background: { color: 'transparent' },
      particles: {
        number: { value: small ? 60 : 140, density: { enable: true, width: 1500, height: 850 } },
        color: { value: dark },
        opacity: { value: { min: 0.45, max: 0.9 } },
        size: { value: { min: 1.8, max: 4.2 } },
        links: { enable: true, distance: 170, color: dark, opacity: 0.6, width: 1.4 },
        move: { enable: true, speed: 0.9, direction: 'none', random: true, outModes: { default: 'bounce' } }
      },
      interactivity: {
        detectsOn: 'window',
        events: {
          onHover: { enable: true, mode: ['grab', 'bubble'] },
          onClick: { enable: true, mode: 'push' },
          resize: { enable: true }
        },
        modes: {
          grab: { distance: 190, links: { opacity: 0.7 } },
          bubble: { distance: 160, size: 4.5, duration: 2, opacity: 0.75 },
          push: { quantity: 5 }
        }
      }
    } });
    // v3 может вернуть промис; глушим любые отказы, чтобы не сыпать в консоль.
    if (runner && typeof runner.catch === 'function') runner.catch(() => { host.style.display = 'none'; });

  } catch (e) {
    host.style.display = 'none';
  }
})();


// ================================================================
// ART v6 — «вау»-слой: декод hero-подписи, каскадные индикаторы
// статистики, 3D-разворот номеров секций, каскад шагов процесса.
// Изолировано, уважает «уменьшить анимации».
// ================================================================
(function () {
  const d = document;
  const mm = q => ('matchMedia' in window) ? window.matchMedia(q).matches : false;
  const reduced = mm('(prefers-reduced-motion: reduce)');
  const guard = fn => { try { fn(); } catch (e) {} };

  // ---- HERO-ПОДПИСЬ: декод из «шума» после прелоадера ----
  guard(() => {
    const tag = d.querySelector('.hero__tag');
    if (!tag || reduced) return;
    const real = tag.textContent;
    const glyphs = 'АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЩЭЮЯ/▮▯#*';
    const start = () => {
      const t0 = performance.now();
      const dur = Math.min(1100, real.length * 55);
      const tick = () => {
        const p = Math.min(1, (performance.now() - t0) / dur);
        const settled = Math.floor(p * real.length);
        let out = '';
        for (let i = 0; i < real.length; i++) {
          const ch = real[i];
          if (ch === ' ') { out += ' '; continue; }
          out += (p >= 1 || i < settled) ? ch : glyphs[(Math.random() * glyphs.length) | 0];
        }
        tag.textContent = out;
        if (p < 1) requestAnimationFrame(tick); else tag.textContent = real;
      };
      tick();
    };
    if (d.readyState === 'complete') setTimeout(start, 1800);
    else window.addEventListener('load', () => setTimeout(start, 1800));
    setTimeout(start, 2800); // страховка
  });

  // ---- ПРОЦЕСС: индексы + каскадный вход шагов ----
  guard(() => {
    const proc = d.querySelector('.process');
    if (!proc) return;
    const steps = proc.querySelectorAll('.process__step');
    steps.forEach((s, i) => s.style.setProperty('--i', i));
    if (reduced || !('IntersectionObserver' in window)) { proc.classList.add('proc--in'); return; }
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { proc.classList.add('proc--in'); io.unobserve(proc); }
      });
    }, { threshold: 0.15 });
    io.observe(proc);
  });

  // ---- НОМЕРА СЕКЦИЙ: 3D-разворот при появлении ----
  guard(() => {
    const heads = Array.from(d.querySelectorAll('.section__head'));
    if (!heads.length) return;
    if (reduced || !('IntersectionObserver' in window)) { heads.forEach(h => h.classList.add('num--in')); return; }
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('num--in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.4 });
    heads.forEach(h => io.observe(h));
  });

  // ---- СТАТИСТИКА: каскад «прорастающих» индикаторов ----
  guard(() => {
    const stats = d.querySelector('.hero__stats');
    if (!stats) return;
    stats.querySelectorAll('.stat').forEach((s, i) => s.style.setProperty('--i', i));
    const go = () => stats.classList.add('stats--in');
    if (reduced) { go(); return; }
    if (d.readyState === 'complete') setTimeout(go, 1900);
    else window.addEventListener('load', () => setTimeout(go, 1900));
    setTimeout(go, 2900); // страховка
  });
})();

// ---- FAQ: индекс для каскадного вылета пунктов ----
(function () {
  try {
    document.querySelectorAll('.faq .faq__item').forEach(function (it, i) {
      it.style.setProperty('--i', i);
    });
  } catch (e) {}
})();
