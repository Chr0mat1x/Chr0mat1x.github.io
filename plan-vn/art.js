/* ============================================================
   ПЛАН — ВЕКТОРНЫЙ АРТ (SVG)
   Спрайты персонажей и фоны, нарисованы вручную в аниме/cel-shade стиле.
   ============================================================ */

let _uid = 0;
const uid = () => 'a' + (++_uid);

/* ─────────── СПРАЙТ ПЕРСОНАЖА ───────────
   viewBox 0 0 600 900 — поясной портрет. */
function charSVG(c) {
  const o = Object.assign({
    key: 'x',
    skin: '#e9c4a1', skinSh: '#cfa07d',
    hair: '#4a3527', hairSh: '#33241a',
    cloth: '#4d523c', clothSh: '#3a3f2d', clothHi: '#5d6248',
    shirt: '#eae6dc', shirtSh: '#d6d0c2',
    iris: '#5a4a38', brow: '#3a2a1e', lip: '#a8675a',
    style: 'short', mouth: 'neutral', tilt: 0,
    stubble: 0, glasses: 0, cap: 0, epaulettes: 0, tie: 0,
    earrings: 0, circles: 0, wrinkles: 0, scars: 0
  }, c);

  const g = uid();
  const mouthPath = {
    neutral: 'M281 349 Q300 357 319 349',
    frown:   'M281 354 Q300 344 319 354',
    smirk:   'M283 352 Q304 361 321 343',
    smile:   'M282 346 Q300 360 318 346',
    open:    'M286 344 Q300 366 314 344 Q300 352 286 344',
    flat:    'M282 350 L318 350'
  }[o.mouth] || 'M281 349 Q300 357 319 349';

  /* — шея — */
  const neck = `
    <path d="M268 366 L268 424 Q300 444 332 424 L332 366 Z" fill="${o.skin}"/>
    <path d="M258 372 Q300 424 342 372 Q334 398 300 408 Q266 398 258 372 Z" fill="${o.skinSh}" opacity=".85"/>`;

  /* — торс: пиджак/куртка/форма — */
  const torso = `
    <path d="M118 900 L150 552 Q162 452 246 424 Q274 448 300 448 Q326 448 354 424 Q438 452 450 552 L482 900 Z" fill="${o.cloth}"/>
    <path d="M240 430 Q300 552 360 430 L360 900 L240 900 Z" fill="${o.shirt}"/>
    <path d="M246 428 L300 478 L274 512 L232 452 Z" fill="${o.shirtSh}"/>
    <path d="M354 428 L300 478 L326 512 L368 452 Z" fill="${o.shirtSh}"/>
    <path d="M118 900 L150 552 Q162 452 246 424 L296 476 Q258 626 250 900 Z" fill="${o.cloth}"/>
    <path d="M482 900 L450 552 Q438 452 354 424 L304 476 Q342 626 350 900 Z" fill="${o.cloth}"/>
    <path d="M246 424 L296 476 L288 500 Q250 560 240 640 L226 470 Z" fill="${o.clothHi}" opacity=".55"/>
    <path d="M354 424 L304 476 L312 500 Q350 560 360 640 L374 470 Z" fill="${o.clothSh}" opacity=".7"/>
    ${o.tie ? `
      <path d="M300 486 L286 512 L300 626 L314 512 Z" fill="${o.tie}"/>
      <path d="M287 474 L313 474 L309 500 L291 500 Z" fill="${o.tie}"/>` : ''}
    ${o.epaulettes ? `
      <path d="M156 500 L232 470 L238 502 L164 534 Z" fill="${o.clothSh}"/>
      <path d="M444 500 L368 470 L362 502 L436 534 Z" fill="${o.clothSh}"/>
      ${Array.from({ length: o.epaulettes }).map((_, i) =>
        `<circle cx="${186 + i * 26}" cy="${492 - i * 8}" r="6" fill="#c9b26a" stroke="#8a7320" stroke-width="1.5"/>`).join('')}` : ''}`;

  /* — голова — */
  const head = `
    <ellipse cx="203" cy="272" rx="15" ry="23" fill="${o.skin}"/>
    <ellipse cx="397" cy="272" rx="15" ry="23" fill="${o.skin}"/>
    <path d="M205 252 C205 150 258 118 300 118 C342 118 395 150 395 252 C395 322 358 392 300 414 C242 392 205 322 205 252 Z" fill="${o.skin}"/>
    <path d="M205 252 C205 150 258 118 300 118 C342 118 395 150 395 252 C395 300 372 350 340 372 C368 330 372 250 300 250 C228 250 232 330 260 372 C228 350 205 300 205 252 Z" fill="${o.skinSh}" opacity=".28"/>`;

  /* — уши/лоб тени — */
  const browY = o.style === 'slick' ? 236 : 232;

  /* — глаза (аниме, крупные) — */
  function eye(cx, mirror) {
    const m = mirror ? -1 : 1;
    const dx = d => cx + d * m;
    return `
      <ellipse cx="${cx}" cy="272" rx="31" ry="27" fill="#fdfbf7"/>
      <circle cx="${dx(3)}" cy="274" r="20" fill="${o.iris}"/>
      <circle cx="${dx(3)}" cy="274" r="9" fill="#181310"/>
      <circle cx="${dx(9)}" cy="265" r="6.5" fill="#ffffff" opacity=".92"/>
      <circle cx="${dx(-5)}" cy="282" r="3" fill="#ffffff" opacity=".45"/>
      <path d="M${dx(-30)} 264 Q${cx} 244 ${dx(30)} 262" stroke="#2a1f18" stroke-width="7.5" fill="none" stroke-linecap="round"/>
      <path d="M${dx(30)} 262 L${dx(38)} 256" stroke="#2a1f18" stroke-width="6" fill="none" stroke-linecap="round"/>
      <path d="M${dx(-24)} 296 Q${cx} 306 ${dx(24)} 296" stroke="${o.skinSh}" stroke-width="3" fill="none" opacity=".7"/>`;
  }

  const eyes = `
    ${eye(263, false)}
    ${eye(337, true)}
    <path d="M232 ${browY} Q263 ${browY - 14} 292 ${browY - 2}" stroke="${o.brow}" stroke-width="9" fill="none" stroke-linecap="round"/>
    <path d="M368 ${browY} Q337 ${browY - 14} 308 ${browY - 2}" stroke="${o.brow}" stroke-width="9" fill="none" stroke-linecap="round"/>`;

  const face = `
    <path d="M300 292 q7 15 -3 19" stroke="${o.skinSh}" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="${mouthPath}" stroke="${o.lip}" stroke-width="5.5" fill="none" stroke-linecap="round"/>
    ${o.circles ? `
      <path d="M234 302 Q263 318 292 302" stroke="#b98f78" stroke-width="6" opacity=".5" fill="none"/>
      <path d="M366 302 Q337 318 308 302" stroke="#b98f78" stroke-width="6" opacity=".5" fill="none"/>` : ''}
    ${o.wrinkles ? `
      <path d="M232 228 Q263 218 292 226" stroke="${o.skinSh}" stroke-width="3" opacity=".6" fill="none"/>
      <path d="M368 228 Q337 218 308 226" stroke="${o.skinSh}" stroke-width="3" opacity=".6" fill="none"/>
      <path d="M244 328 Q262 322 280 328" stroke="${o.skinSh}" stroke-width="3" opacity=".5" fill="none"/>
      <path d="M356 328 Q338 322 320 328" stroke="${o.skinSh}" stroke-width="3" opacity=".5" fill="none"/>` : ''}
    ${o.stubble ? `
      <path d="M234 314 Q300 402 366 314 Q358 400 300 418 Q242 400 234 314 Z" fill="#6a5a48" opacity=".26"/>
      <g fill="#4a3e30" opacity=".35">
        ${Array.from({ length: 46 }).map(() => {
          const x = 244 + Math.random() * 112, y = 322 + Math.random() * 84;
          return `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="1.6"/>`;
        }).join('')}
      </g>` : ''}
    ${o.scars ? `<path d="M356 244 L372 300" stroke="#b98f78" stroke-width="3" opacity=".7"/>` : ''}`;

  /* — волосы — */
  const bangsShort = `
    <path d="M198 252 Q194 128 300 116 Q406 128 402 252 Q392 186 342 172 Q318 196 288 174 Q244 196 216 178 Q204 200 198 252 Z" fill="${o.hair}"/>
    <path d="M214 216 Q252 176 300 178 Q348 176 386 216 Q356 194 300 198 Q244 194 214 216 Z" fill="${o.hairSh}" opacity=".55"/>
    <path d="M236 168 Q266 138 306 140 Q286 154 262 178 Z" fill="${o.hairSh}" opacity=".35"/>`;

  const bangsSlick = `
    <path d="M200 240 Q200 128 300 118 Q400 128 400 240 Q392 166 300 154 Q208 166 200 240 Z" fill="${o.hair}"/>
    <path d="M206 214 Q300 160 394 214 Q356 186 300 182 Q244 186 206 214 Z" fill="${o.hairSh}" opacity=".5"/>
    <path d="M300 154 Q340 158 372 186 Q330 168 300 166 Z" fill="${o.hairSh}" opacity=".4"/>`;

  const bangsLong = `
    <path d="M194 244 Q192 126 300 114 Q408 126 406 244 L424 660 Q382 606 372 424 Q362 300 300 300 Q238 300 228 424 Q218 606 176 660 Z" fill="${o.hair}"/>
    <path d="M214 218 Q254 174 300 176 Q346 174 386 218 Q354 192 300 196 Q246 192 214 218 Z" fill="${o.hairSh}" opacity=".5"/>
    <path d="M196 300 Q200 180 240 150 Q214 220 210 420 Q206 560 186 640 Q182 470 196 300 Z" fill="${o.hairSh}" opacity=".35"/>`;

  const hair = o.style === 'slick' ? bangsSlick
             : o.style === 'long' ? bangsLong
             : bangsShort;

  /* — очки — */
  const glasses = o.glasses ? `
    <g fill="none" stroke="#26221e" stroke-width="6">
      <rect x="228" y="246" width="70" height="52" rx="14" fill="#dff0ff" fill-opacity=".12"/>
      <rect x="302" y="246" width="70" height="52" rx="14" fill="#dff0ff" fill-opacity=".12"/>
      <path d="M298 266 L302 266"/>
      <path d="M228 262 L206 258"/>
      <path d="M372 262 L394 258"/>
    </g>` : '';

  /* — фуражка/кепка — */
  const cap = o.cap ? `
    <path d="M198 168 Q300 92 402 168 L406 190 Q300 162 194 190 Z" fill="${o.cloth}"/>
    <path d="M196 188 Q300 162 404 188 L404 200 Q300 178 196 200 Z" fill="${o.clothSh}"/>
    <path d="M186 190 Q300 226 414 190 Q300 214 186 190 Z" fill="#26261f"/>
    <circle cx="300" cy="150" r="11" fill="#c9b26a" stroke="#8a7320" stroke-width="2"/>
    <path d="M300 141 l3.2 6.6 7.3 1 -5.3 5.1 1.3 7.2 -6.5 -3.4 -6.5 3.4 1.3 -7.2 -5.3 -5.1 7.3 -1 Z" fill="#8a7320"/>` : '';

  /* — серёжки — */
  const earrings = o.earrings ? `
    <circle cx="203" cy="298" r="6" fill="#c9b26a" stroke="#8a7320" stroke-width="1.5"/>
    <circle cx="397" cy="298" r="6" fill="#c9b26a" stroke="#8a7320" stroke-width="1.5"/>` : '';

  const gid = 'bg' + g;
  return `<svg viewBox="0 0 600 900" preserveAspectRatio="xMidYMax meet" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block">
    <defs>
      <linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${o.clothHi}" stop-opacity=".0"/>
        <stop offset="1" stop-color="#000" stop-opacity=".28"/>
      </linearGradient>
    </defs>
    ${torso}
    <rect x="0" y="0" width="600" height="900" fill="url(#${gid})"/>
    ${neck}
    ${head}
    ${eyes}
    ${face}
    ${hair}
    ${glasses}
    ${cap}
    ${earrings}
  </svg>`;
}

/* ─────────── СПРАЙТЫ ─────────── */
const SPRITES = {
  alexey: charSVG({
    key: 'alexey', skin: '#e9c4a1', skinSh: '#cfa07d',
    hair: '#4a3527', hairSh: '#33241a',
    cloth: '#4d523c', clothSh: '#3a3f2d', clothHi: '#61674c',
    iris: '#5a6b52', mouth: 'frown', stubble: 1, circles: 1
  }),
  vasya: charSVG({
    key: 'vasya', skin: '#d9b394', skinSh: '#b98a68',
    hair: '#b6aea2', hairSh: '#8d867b',
    cloth: '#5b5546', clothSh: '#454035', clothHi: '#6d6653',
    iris: '#6a6a60', mouth: 'flat', stubble: 1, wrinkles: 1, cap: 1
  }),
  boss: charSVG({
    key: 'boss', skin: '#e3bd9c', skinSh: '#c79a76',
    hair: '#2e2620', hairSh: '#1c1712',
    cloth: '#3f4a34', clothSh: '#2f3827', clothHi: '#525e42',
    shirt: '#e6e2d6', shirtSh: '#cfcabb',
    iris: '#4a3a2a', mouth: 'smirk', style: 'slick', epaulettes: 2, tie: '#3a3a2e'
  }),
  oksana: charSVG({
    key: 'oksana', skin: '#ecc7a6', skinSh: '#d0a382',
    hair: '#7a4a3a', hairSh: '#5c3427',
    cloth: '#6a5a58', clothSh: '#524544', clothHi: '#7d6a68',
    shirt: '#efe9dd', shirtSh: '#dad2c4',
    iris: '#6a4a34', lip: '#b5605a', mouth: 'smile', style: 'long', earrings: 1
  }),
  denys: charSVG({
    key: 'denys', skin: '#e6c3a3', skinSh: '#caa07d',
    hair: '#3a3a42', hairSh: '#26262c',
    cloth: '#4a5a6a', clothSh: '#374552', clothHi: '#5b6d7e',
    shirt: '#e8e8ea', shirtSh: '#d2d2d6',
    iris: '#4a5a6a', mouth: 'neutral', glasses: 1
  }),
  igor: charSVG({
    key: 'igor', skin: '#dfb894', skinSh: '#c2966f',
    hair: '#4a3a2e', hairSh: '#332820',
    cloth: '#3f3a34', clothSh: '#2e2a25', clothHi: '#514b43',
    shirt: '#d8d2c6', shirtSh: '#c2bcae',
    iris: '#4a4038', mouth: 'frown', stubble: 1, circles: 1
  }),
  koval: charSVG({
    key: 'koval', skin: '#e2bd9a', skinSh: '#c69a75',
    hair: '#3a2e24', hairSh: '#261d16',
    cloth: '#3f5a4a', clothSh: '#2f4438', clothHi: '#4f6d5a',
    shirt: '#e9e5da', shirtSh: '#d4cfc2',
    iris: '#4a3a2a', mouth: 'neutral', style: 'short'
  }),

  /* ── Часть 2: «Бронь» ── */
  gritsenko: charSVG({
    key: 'gritsenko', skin: '#dcb491', skinSh: '#bd9270',
    hair: '#9a958c', hairSh: '#736f67',
    cloth: '#2f3542', clothSh: '#232833', clothHi: '#3d4453',
    shirt: '#e7e3d7', shirtSh: '#cfcabb',
    iris: '#4a4a44', mouth: 'smirk', style: 'slick', wrinkles: 1, tie: '#5a2f2f'
  }),
  larysa: charSVG({
    key: 'larysa', skin: '#ecc6a4', skinSh: '#cfa07e',
    hair: '#5a3a2c', hairSh: '#412a20',
    cloth: '#6a5560', clothSh: '#523f49', clothHi: '#7d6773',
    shirt: '#efe9dd', shirtSh: '#dad2c4',
    iris: '#5a4436', lip: '#a85a58', mouth: 'smile', style: 'long', earrings: 1, glasses: 1
  }),
  taras: charSVG({
    key: 'taras', skin: '#e4c1a0', skinSh: '#c69b78',
    hair: '#3a3228', hairSh: '#282218',
    cloth: '#46586a', clothSh: '#354554', clothHi: '#57697c',
    shirt: '#e6e6ea', shirtSh: '#d0d0d6',
    iris: '#4a5a6a', mouth: 'neutral', glasses: 1, circles: 1, stubble: 1
  }),
  vlad: charSVG({
    key: 'vlad', skin: '#e8c6a6', skinSh: '#cca27f',
    hair: '#241f1c', hairSh: '#15110f',
    cloth: '#3a3a3a', clothSh: '#2a2a2a', clothHi: '#4c4c4c',
    shirt: '#f0f0f0', shirtSh: '#d8d8d8',
    iris: '#3a3a3a', mouth: 'smirk', style: 'short', earrings: 1
  }),
  maryna: charSVG({
    key: 'maryna', skin: '#eac4a2', skinSh: '#cf9f7d',
    hair: '#2e2a28', hairSh: '#1c1917',
    cloth: '#5a4a3a', clothSh: '#443628', clothHi: '#6d5b48',
    shirt: '#e9e4d8', shirtSh: '#d4cec0',
    iris: '#4a3a2a', lip: '#b0605a', mouth: 'neutral', style: 'long', earrings: 1
  }),
  dmytro: charSVG({
    key: 'dmytro', skin: '#dcb491', skinSh: '#bd9270',
    hair: '#3a2e26', hairSh: '#28201a',
    cloth: '#44484a', clothSh: '#33363a', clothHi: '#565a5e',
    shirt: '#ddd8cc', shirtSh: '#c6c1b4',
    iris: '#4a4238', mouth: 'frown', stubble: 1, circles: 1
  })
};

/* ─────────── ФОНЫ ───────────
   viewBox 0 0 1600 900, slice. */
const BACKGROUNDS = {
  office: `<svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block">
    <defs>
      <linearGradient id="ow" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#8f9a92"/><stop offset="1" stop-color="#b9bcae"/>
      </linearGradient>
      <linearGradient id="ofl" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#4a4c46"/><stop offset="1" stop-color="#33352f"/>
      </linearGradient>
    </defs>
    <rect width="1600" height="900" fill="#6d6f64"/>
    <rect width="1600" height="620" fill="#7a7c6f"/>
    <rect y="620" width="1600" height="280" fill="#5c5a4e"/>
    <rect x="60" y="90" width="560" height="430" fill="url(#ow)"/>
    <rect x="60" y="90" width="560" height="430" fill="none" stroke="#4a4a40" stroke-width="10"/>
    <g fill="#e6e4d8" opacity=".9">
      ${Array.from({ length: 22 }).map((_, i) => `<rect x="${66 + i * 26}" y="96" width="9" height="418"/>`).join('')}
    </g>
    <g stroke="#55584c" stroke-width="4" opacity=".5">
      ${Array.from({ length: 10 }).map((_, i) => `<line x1="60" y1="${100 + i * 44}" x2="620" y2="${100 + i * 44}"/>`).join('')}
    </g>
    <rect x="60" y="90" width="560" height="430" fill="#c9cbb8" opacity=".18"/>
    <rect x="900" y="40" width="640" height="70" fill="#3d3f38"/>
    <rect x="930" y="110" width="580" height="26" fill="#e9e6d2" opacity=".55"/>
    <rect x="1040" y="150" width="380" height="500" fill="#565248"/>
    <rect x="1040" y="150" width="380" height="500" fill="none" stroke="#3c3931" stroke-width="8"/>
    <g fill="#4a473e">
      ${Array.from({ length: 3 }).map((_, r) => Array.from({ length: 2 }).map((_, c) =>
        `<rect x="${1062 + c * 180}" y="${176 + r * 152}" width="152" height="120" rx="4"/>`).join('')).join('')}
    </g>
    <g fill="#d8d2be" opacity=".85">
      ${Array.from({ length: 14 }).map(() => `<rect x="${1075 + Math.random() * 330}" y="${190 + Math.random() * 400}" width="${40 + Math.random() * 60}" height="7" rx="2" transform="rotate(${(Math.random() * 14 - 7).toFixed(1)} 1100 300)"/>`).join('')}
    </g>
    <path d="M0 700 L1600 700 L1600 900 L0 900 Z" fill="url(#ofl)"/>
    <rect x="120" y="640" width="700" height="40" fill="#6b5c44"/>
    <rect x="120" y="680" width="700" height="24" fill="#4f4433"/>
    <rect x="180" y="500" width="230" height="150" rx="8" fill="#3a3a38"/>
    <rect x="196" y="514" width="198" height="118" rx="4" fill="#6f7d6a"/>
    <rect x="240" y="650" width="60" height="40" fill="#2c2c2a"/>
    <g fill="#e2dccb">
      ${Array.from({ length: 9 }).map(() => `<rect x="${440 + Math.random() * 300}" y="${560 + Math.random() * 60}" width="${70 + Math.random() * 50}" height="8" rx="2" transform="rotate(${(Math.random() * 24 - 12).toFixed(1)} 500 580)"/>`).join('')}
    </g>
    <rect x="0" y="0" width="1600" height="900" fill="#2a2c26" opacity=".18"/>
  </svg>`,

  corridor: `<svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block">
    <defs>
      <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#3a3c36"/><stop offset="1" stop-color="#20221e"/>
      </linearGradient>
      <radialGradient id="cl" cx=".5" cy="0" r="1">
        <stop offset="0" stop-color="#f3ecc6" stop-opacity=".85"/><stop offset="1" stop-color="#f3ecc6" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="1600" height="900" fill="url(#cg)"/>
    <path d="M0 900 L0 120 L560 300 L560 900 Z" fill="#3f413a"/>
    <path d="M1600 900 L1600 120 L1040 300 L1040 900 Z" fill="#3f413a"/>
    <rect x="560" y="300" width="480" height="600" fill="#4a4c44"/>
    <rect x="620" y="340" width="360" height="520" fill="#33352f"/>
    <rect x="700" y="120" width="200" height="200" fill="#57594f"/>
    <rect x="700" y="120" width="200" height="200" fill="none" stroke="#2c2e28" stroke-width="8"/>
    <g fill="#4d4f47">
      <rect x="180" y="430" width="240" height="470" rx="4"/>
      <rect x="1180" y="430" width="240" height="470" rx="4"/>
    </g>
    <g fill="#2b2d28">
      <rect x="210" y="470" width="180" height="200"/>
      <rect x="1210" y="470" width="180" height="200"/>
    </g>
    <circle cx="360" cy="600" r="8" fill="#b8b090"/>
    <circle cx="1240" cy="600" r="8" fill="#b8b090"/>
    <rect x="760" y="60" width="80" height="26" fill="#d9d4b4"/>
    <rect x="740" y="86" width="120" height="16" fill="#3a3c36"/>
    <ellipse cx="800" cy="330" rx="380" ry="300" fill="url(#cl)"/>
    <rect x="0" y="0" width="1600" height="900" fill="#141612" opacity=".3"/>
  </svg>`,

  boss: `<svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block">
    <defs>
      <linearGradient id="bw" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#6d6a5c"/><stop offset="1" stop-color="#4a483e"/>
      </linearGradient>
    </defs>
    <rect width="1600" height="900" fill="#4f4c40"/>
    <rect width="1600" height="640" fill="#5c584a"/>
    <rect y="640" width="1600" height="260" fill="#3a362c"/>
    <g>
      <rect x="1000" y="80" width="180" height="560" fill="#7a2f28"/>
      <rect x="1180" y="80" width="90" height="560" fill="#8f3a30"/>
      <rect x="1270" y="80" width="180" height="560" fill="#7a2f28"/>
    </g>
    <rect x="960" y="60" width="40" height="600" fill="#2e2a22"/>
    <rect x="140" y="80" width="300" height="380" fill="url(#bw)"/>
    <rect x="140" y="80" width="300" height="380" fill="none" stroke="#2e2a22" stroke-width="12"/>
    <path d="M290 180 l40 80 -80 0 Z" fill="#b9a24a" opacity=".5"/>
    <rect x="0" y="700" width="1600" height="40" fill="#6b5c44"/>
    <rect x="60" y="620" width="900" height="90" fill="#5c4f3a"/>
    <rect x="60" y="710" width="900" height="30" fill="#443a2b"/>
    <rect x="120" y="560" width="200" height="60" rx="6" fill="#2f2f2b"/>
    <rect x="150" y="500" width="140" height="90" fill="#3a3a36"/>
    <ellipse cx="220" cy="548" rx="60" ry="14" fill="#1e1e1c"/>
    <rect x="0" y="0" width="1600" height="900" fill="#1c1a14" opacity=".28"/>
  </svg>`,

  street: `<svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block">
    <defs>
      <linearGradient id="sk" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#9aa0a2"/><stop offset="1" stop-color="#c3c4bd"/>
      </linearGradient>
      <linearGradient id="rd" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#4c4e4c"/><stop offset="1" stop-color="#2f3130"/>
      </linearGradient>
    </defs>
    <rect width="1600" height="900" fill="url(#sk)"/>
    <g fill="#7c7e78">
      <rect x="0" y="150" width="260" height="500"/>
      <rect x="300" y="60" width="220" height="590"/>
      <rect x="560" y="220" width="180" height="430"/>
      <rect x="780" y="120" width="240" height="530"/>
      <rect x="1060" y="200" width="200" height="450"/>
      <rect x="1300" y="80" width="300" height="570"/>
    </g>
    <g fill="#5f615b" opacity=".8">
      <rect x="0" y="150" width="260" height="500" fill="none" stroke="#5a5c56" stroke-width="6"/>
      <rect x="300" y="60" width="220" height="590" fill="none" stroke="#5a5c56" stroke-width="6"/>
    </g>
    <g fill="#3f423e" opacity=".65">
      ${Array.from({ length: 6 }).map((_, c) => Array.from({ length: 6 }).map((_, r) =>
        `<rect x="${20 + c * 40}" y="${180 + r * 70}" width="24" height="40"/>`).join('')).join('')}
      ${Array.from({ length: 5 }).map((_, c) => Array.from({ length: 7 }).map((_, r) =>
        `<rect x="${318 + c * 42}" y="${90 + r * 72}" width="24" height="42"/>`).join('')).join('')}
    </g>
    <rect y="650" width="1600" height="250" fill="url(#rd)"/>
    <rect y="650" width="1600" height="8" fill="#6d6f68"/>
    <g fill="#c9c9be" opacity=".55">
      ${Array.from({ length: 7 }).map((_, i) => `<rect x="${120 + i * 220}" y="762" width="90" height="12" rx="3"/>`).join('')}
    </g>
    <rect y="700" width="1600" height="200" fill="#20221f" opacity=".25"/>
    <g fill="#2e302c">
      <rect x="1300" y="560" width="14" height="200"/>
      <rect x="1240" y="540" width="140" height="26" rx="6"/>
      <ellipse cx="1310" cy="540" rx="90" ry="20" fill="#3a3c38"/>
    </g>
    <ellipse cx="800" cy="640" rx="900" ry="120" fill="#d8d8d0" opacity=".12"/>
  </svg>`,

  home: `<svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block">
    <defs>
      <linearGradient id="hw" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#8b93a0"/><stop offset="1" stop-color="#5c636e"/>
      </linearGradient>
    </defs>
    <rect width="1600" height="900" fill="#5a5145"/>
    <rect width="1600" height="640" fill="#6b6153"/>
    <rect y="640" width="1600" height="260" fill="#4a4238"/>
    <rect x="1020" y="90" width="440" height="380" fill="url(#hw)"/>
    <rect x="1020" y="90" width="440" height="380" fill="none" stroke="#3a342b" stroke-width="14"/>
    <line x1="1240" y1="90" x2="1240" y2="470" stroke="#3a342b" stroke-width="10"/>
    <line x1="1020" y1="280" x2="1460" y2="280" stroke="#3a342b" stroke-width="10"/>
    <g fill="#3f3a31">
      <rect x="150" y="420" width="620" height="200" rx="18"/>
      <rect x="150" y="600" width="620" height="60" rx="10"/>
      <rect x="190" y="660" width="60" height="60"/>
      <rect x="680" y="660" width="60" height="60"/>
    </g>
    <rect x="200" y="470" width="180" height="110" rx="12" fill="#7a6a56"/>
    <rect x="410" y="470" width="180" height="110" rx="12" fill="#7a6a56"/>
    <ellipse cx="300" cy="700" rx="180" ry="26" fill="#2e2a22" opacity=".5"/>
    <g fill="#2e2a22">
      <rect x="0" y="700" width="1600" height="12" opacity=".3"/>
    </g>
    <path d="M1150 640 q40 -50 80 0 q-40 40 -80 0 Z" fill="#4a4038"/>
    <ellipse cx="1190" cy="628" rx="30" ry="22" fill="#5c4f42"/>
    <rect x="0" y="0" width="1600" height="900" fill="#241f18" opacity=".22"/>
  </svg>`,

  stair: `<svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block">
    <defs>
      <radialGradient id="sl" cx=".5" cy=".1" r=".8">
        <stop offset="0" stop-color="#f0e9b8" stop-opacity=".9"/><stop offset="1" stop-color="#f0e9b8" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="1600" height="900" fill="#2c2f2a"/>
    <rect width="1600" height="700" fill="#383b34"/>
    <path d="M0 900 L0 200 L900 120 L900 900 Z" fill="#42453d"/>
    <path d="M1600 900 L1600 240 L1000 180 L1000 900 Z" fill="#33362f"/>
    <g fill="#4a4d44">
      ${Array.from({ length: 8 }).map((_, i) =>
        `<rect x="${40 + i * 12}" y="${420 + i * 60}" width="${780 - i * 20}" height="22"/>`).join('')}
    </g>
    <g stroke="#5c6055" stroke-width="10" fill="none">
      <path d="M120 420 Q520 300 900 250"/>
      <path d="M120 900 L120 420"/>
      <path d="M900 900 L900 250"/>
    </g>
    <rect x="1120" y="300" width="220" height="520" rx="6" fill="#4a4d44"/>
    <rect x="1150" y="340" width="160" height="440" fill="#2e312b"/>
    <circle cx="1290" cy="560" r="9" fill="#c2b98f"/>
    <rect x="640" y="60" width="70" height="20" fill="#d9d4b4"/>
    <ellipse cx="675" cy="330" rx="420" ry="330" fill="url(#sl)"/>
    <rect x="0" y="0" width="1600" height="900" fill="#0f110e" opacity=".3"/>
  </svg>`,

  cafe: `<svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block">
    <defs>
      <linearGradient id="cf" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#8a6f4e"/><stop offset="1" stop-color="#5e4a33"/>
      </linearGradient>
    </defs>
    <rect width="1600" height="900" fill="#6a563c"/>
    <rect width="1600" height="620" fill="url(#cf)"/>
    <rect y="620" width="1600" height="280" fill="#4a3b28"/>
    <g>
      <rect x="90" y="120" width="420" height="320" fill="#9fb0b8"/>
      <rect x="90" y="120" width="420" height="320" fill="none" stroke="#3a2e20" stroke-width="16"/>
      <line x1="300" y1="120" x2="300" y2="440" stroke="#3a2e20" stroke-width="12"/>
      <line x1="90" y1="280" x2="510" y2="280" stroke="#3a2e20" stroke-width="12"/>
    </g>
    <g fill="#5c4830">
      <rect x="1080" y="200" width="420" height="380" rx="8"/>
      <g fill="#4a3a26">
        ${Array.from({ length: 4 }).map((_, r) => Array.from({ length: 4 }).map((_, c) =>
          `<rect x="${1100 + c * 100}" y="${220 + r * 90}" width="80" height="70" rx="4"/>`).join('')).join('')}
      </g>
    </g>
    <rect x="0" y="700" width="1600" height="40" fill="#3a2e20"/>
    <g fill="#6b5334">
      <rect x="140" y="600" width="380" height="30" rx="6"/>
      <rect x="170" y="630" width="24" height="180"/>
      <rect x="466" y="630" width="24" height="180"/>
      <rect x="700" y="640" width="300" height="26" rx="6"/>
      <rect x="720" y="666" width="20" height="160"/>
      <rect x="960" y="666" width="20" height="160"/>
    </g>
    <ellipse cx="300" cy="596" rx="30" ry="10" fill="#d8cbb4"/>
    <ellipse cx="820" cy="636" rx="26" ry="9" fill="#d8cbb4"/>
    <rect x="0" y="0" width="1600" height="900" fill="#2a1e12" opacity=".22"/>
  </svg>`,

  /* ── Часть 2: «Бронь» ── */

  /* Поликлиника: очередь, лампы, зелёные стены */
  clinic: `<svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block">
    <defs>
      <linearGradient id="c2w" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#a9b6a4"/><stop offset="1" stop-color="#c7cfc0"/>
      </linearGradient>
      <linearGradient id="c2f" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#6f7a6b"/><stop offset="1" stop-color="#525a4e"/>
      </linearGradient>
    </defs>
    <rect width="1600" height="900" fill="url(#c2w)"/>
    <rect y="560" width="1600" height="340" fill="url(#c2f)"/>
    <g stroke="#8d9a86" stroke-width="3" opacity=".5">
      ${Array.from({ length: 9 }).map((_, i) => `<line x1="0" y1="${60 + i * 56}" x2="1600" y2="${60 + i * 56}"/>`).join('')}
    </g>
    <rect x="120" y="120" width="300" height="200" fill="#dfe6da" stroke="#7d8a76" stroke-width="8"/>
    <rect x="140" y="140" width="260" height="160" fill="#b9c7b2" opacity=".7"/>
    <rect x="1180" y="90" width="340" height="250" fill="#e3e9dd" stroke="#7d8a76" stroke-width="8"/>
    <text x="1350" y="230" font-family="monospace" font-size="52" fill="#5a6a54" text-anchor="middle">086/О</text>
    <rect x="560" y="300" width="480" height="34" fill="#7c8a74"/>
    <rect x="560" y="334" width="480" height="12" fill="#5f6b58"/>
    <g fill="#4e5748">
      <rect x="80" y="640" width="220" height="16" rx="6"/>
      <rect x="96" y="656" width="18" height="90"/>
      <rect x="266" y="656" width="18" height="90"/>
      <rect x="360" y="640" width="220" height="16" rx="6"/>
      <rect x="376" y="656" width="18" height="90"/>
      <rect x="546" y="656" width="18" height="90"/>
      <rect x="640" y="640" width="220" height="16" rx="6"/>
      <rect x="656" y="656" width="18" height="90"/>
      <rect x="826" y="656" width="18" height="90"/>
      <rect x="920" y="640" width="220" height="16" rx="6"/>
      <rect x="936" y="656" width="18" height="90"/>
      <rect x="1106" y="656" width="18" height="90"/>
    </g>
    <g fill="#cfd6c8" opacity=".85">
      <rect x="1360" y="620" width="180" height="120" rx="10"/>
      <rect x="1380" y="600" width="140" height="30" rx="8"/>
    </g>
    <ellipse cx="800" cy="120" rx="230" ry="26" fill="#eef3ea" opacity=".5"/>
    <rect x="0" y="0" width="1600" height="900" fill="#3a4a36" opacity=".14"/>
  </svg>`,

  /* Райадминистрация: длинный коридор, ковровая дорожка, портреты */
  admin: `<svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block">
    <defs>
      <linearGradient id="a2w" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#8a7f6d"/><stop offset="1" stop-color="#a89c86"/>
      </linearGradient>
    </defs>
    <rect width="1600" height="900" fill="url(#a2w)"/>
    <rect y="620" width="1600" height="280" fill="#5b5244"/>
    <polygon points="0,900 1600,900 1050,470 550,470" fill="#6d5c46"/>
    <polygon points="550,470 1050,470 900,900 700,900" fill="#8c2f2f" opacity=".55"/>
    <polygon points="0,0 1600,0 1050,470 550,470" fill="#4a4234" opacity=".85"/>
    <g fill="#6a5f4c">
      <rect x="0" y="0" width="560" height="480"/>
      <rect x="1040" y="0" width="560" height="480"/>
    </g>
    <g fill="#b8ab8e" stroke="#3f382c" stroke-width="5">
      ${Array.from({ length: 5 }).map((_, i) => `<rect x="${60 + i * 100}" y="90" width="70" height="92"/>`).join('')}
      ${Array.from({ length: 5 }).map((_, i) => `<rect x="${1090 + i * 100}" y="90" width="70" height="92"/>`).join('')}
    </g>
    <g fill="#8f7a5c" opacity=".8">
      ${Array.from({ length: 10 }).map((_, i) => `<circle cx="${95 + i * 100 - (i > 4 ? 60 : 0) + (i > 4 ? 1060 : 0)}" cy="130" r="20"/>`).join('')}
    </g>
    <g fill="#d8cdb4" opacity=".5">
      <rect x="620" y="470" width="360" height="18"/>
      <rect x="640" y="488" width="320" height="10"/>
    </g>
    <ellipse cx="800" cy="240" rx="300" ry="40" fill="#e6ddc8" opacity=".22"/>
    <rect x="0" y="0" width="1600" height="900" fill="#2a2318" opacity=".26"/>
  </svg>`,

  /* Приёмная/очередь в ТЦК: стулья, табло, толпа силуэтами */
  queue: `<svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block">
    <defs>
      <linearGradient id="q2w" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#9aa094"/><stop offset="1" stop-color="#c2c5b8"/>
      </linearGradient>
    </defs>
    <rect width="1600" height="900" fill="url(#q2w)"/>
    <rect y="600" width="1600" height="300" fill="#7c7a6c"/>
    <g fill="#5f5f54" opacity=".55">
      ${Array.from({ length: 11 }).map((_, i) => {
        const x = 70 + i * 140;
        const h = 190 + (i % 3) * 26;
        return `<g><ellipse cx="${x}" cy="${700 - h}" rx="26" ry="30"/><path d="M${x - 40} ${700} Q${x - 34} ${700 - h + 30} ${x} ${700 - h + 24} Q${x + 34} ${700 - h + 30} ${x + 40} ${700} Z"/></g>`;
      }).join('')}
    </g>
    <rect x="0" y="150" width="1600" height="120" fill="#3d3f38"/>
    <rect x="40" y="180" width="1520" height="60" fill="#1c1d1a"/>
    <text x="800" y="228" font-family="monospace" font-size="44" fill="#d8a13a" text-anchor="middle" letter-spacing="6">ЗАПРОС 07 · ОКНО 3</text>
    <g fill="#e2ded0" opacity=".9">
      ${Array.from({ length: 3 }).map((_, i) => `<rect x="${70 + i * 90}" y="300" width="70" height="240" rx="4"/>`).join('')}
      ${Array.from({ length: 3 }).map((_, i) => `<rect x="${1300 + i * 90}" y="300" width="70" height="240" rx="4"/>`).join('')}
    </g>
    <g fill="#4e5046">
      <rect x="420" y="720" width="120" height="16" rx="6"/>
      <rect x="436" y="736" width="14" height="70"/>
      <rect x="510" y="736" width="14" height="70"/>
      <rect x="1060" y="720" width="120" height="16" rx="6"/>
      <rect x="1076" y="736" width="14" height="70"/>
      <rect x="1150" y="736" width="14" height="70"/>
    </g>
    <rect x="0" y="0" width="1600" height="900" fill="#2c2e28" opacity=".2"/>
  </svg>`,

  /* Кафе-подвал: тёплый свет, стол, ночь за окном */
  cafe2: `<svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block">
    <defs>
      <linearGradient id="cf2" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#3a2c22"/><stop offset="1" stop-color="#241a14"/>
      </linearGradient>
      <radialGradient id="cf2l" cx=".5" cy=".3" r=".7">
        <stop offset="0" stop-color="#e8b877" stop-opacity=".55"/><stop offset="1" stop-color="#e8b877" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="1600" height="900" fill="url(#cf2)"/>
    <rect width="1600" height="900" fill="url(#cf2l)"/>
    <rect x="1180" y="120" width="340" height="260" rx="10" fill="#0e0c0a" stroke="#5a4436" stroke-width="10"/>
    <g fill="#c9a35e" opacity=".5">
      ${Array.from({ length: 12 }).map(() => `<circle cx="${1200 + Math.random() * 300}" cy="${140 + Math.random() * 220}" r="${1 + Math.random() * 2.4}"/>`).join('')}
    </g>
    <rect x="0" y="640" width="1600" height="60" fill="#5a3f2a"/>
    <rect x="0" y="700" width="1600" height="200" fill="#3c2a1c"/>
    <g fill="#6b4a30">
      <rect x="180" y="700" width="180" height="22" rx="8"/>
      <rect x="200" y="722" width="20" height="150"/>
      <rect x="322" y="722" width="20" height="150"/>
      <rect x="700" y="700" width="180" height="22" rx="8"/>
      <rect x="720" y="722" width="20" height="150"/>
      <rect x="842" y="722" width="20" height="150"/>
    </g>
    <g fill="#d9c7a4" opacity=".9">
      <ellipse cx="270" cy="690" rx="34" ry="12"/>
      <ellipse cx="270" cy="678" rx="22" ry="9"/>
      <ellipse cx="790" cy="690" rx="34" ry="12"/>
      <ellipse cx="790" cy="678" rx="22" ry="9"/>
    </g>
    <ellipse cx="800" cy="60" rx="300" ry="90" fill="#e8b877" opacity=".14"/>
    <rect x="0" y="0" width="1600" height="900" fill="#120c08" opacity=".28"/>
  </svg>`,

  /* Ночь, парк у многоэтажки: фонари, дождь, силуэты деревьев */
  night: `<svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block">
    <defs>
      <linearGradient id="n2s" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#1c2432"/><stop offset="1" stop-color="#2e3a48"/>
      </linearGradient>
      <radialGradient id="n2l" cx=".5" cy=".5" r=".5">
        <stop offset="0" stop-color="#e8d8a0" stop-opacity=".5"/><stop offset="1" stop-color="#e8d8a0" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="1600" height="900" fill="url(#n2s)"/>
    <g fill="#151a22">
      <rect x="40" y="240" width="360" height="420"/>
      <rect x="440" y="180" width="300" height="480"/>
      <rect x="1200" y="220" width="360" height="440"/>
    </g>
    <g fill="#d8c478" opacity=".75">
      ${Array.from({ length: 26 }).map(() => {
        const bx = [40, 440, 1200][Math.floor(Math.random() * 3)];
        const bw = [360, 300, 360][[40, 440, 1200].indexOf(bx)];
        return `<rect x="${bx + 24 + Math.random() * (bw - 70)}" y="${200 + Math.random() * 420}" width="26" height="18" opacity="${0.25 + Math.random() * 0.6}"/>`;
      }).join('')}
    </g>
    <rect y="660" width="1600" height="240" fill="#1a2028"/>
    <g stroke="#3c4654" stroke-width="3" opacity=".5">
      ${Array.from({ length: 40 }).map(() => {
        const x = Math.random() * 1600, y = Math.random() * 500;
        return `<line x1="${x.toFixed(0)}" y1="${y.toFixed(0)}" x2="${(x - 10).toFixed(0)}" y2="${(y + 60).toFixed(0)}"/>`;
      }).join('')}
    </g>
    <g>
      <rect x="820" y="360" width="12" height="310" fill="#2a3038"/>
      <circle cx="826" cy="350" r="34" fill="url(#n2l)"/>
      <circle cx="826" cy="350" r="12" fill="#f0e2b0"/>
      <rect x="1100" y="420" width="10" height="250" fill="#2a3038"/>
      <circle cx="1105" cy="412" r="28" fill="url(#n2l)"/>
      <circle cx="1105" cy="412" r="10" fill="#f0e2b0"/>
    </g>
    <g fill="#0f141a">
      <ellipse cx="640" cy="640" rx="90" ry="60"/>
      <rect x="632" y="560" width="16" height="90"/>
      <ellipse cx="200" cy="660" rx="70" ry="46"/>
      <rect x="194" y="600" width="12" height="70"/>
    </g>
    <rect x="0" y="0" width="1600" height="900" fill="#0a0e14" opacity=".22"/>
  </svg>`
};
