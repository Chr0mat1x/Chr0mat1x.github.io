// Спрайты-вырезки из видео. Грузятся один раз, art.js рисует их вместо процедурных.
const Assets = (() => {
  const DEFS = {
    cardboard: 'assets/cardboard.jpg',
    mel0: 'assets/mel_idle0.png',
    mel1: 'assets/mel_idle1.png',
    mel2: 'assets/mel_idle2.png',
    mel3: 'assets/mel_idle3.png',
    mel4: 'assets/mel_idle4.png',
    melShout: 'assets/mel_shout.png',
    bottle: 'assets/bottle.png',
    eat: 'assets/eat_sheet.png',
    bravo: 'assets/bravo_sheet.png',
    red: 'assets/red_sheet.png?v=2',
    button: 'assets/button.png',
    shashlik: 'assets/shashlik.png',
    crayfish: 'assets/crayfish.png',
  };

  const img = {};
  for (const [key, src] of Object.entries(DEFS)) {
    const el = new Image();
    el.src = src;
    img[key] = el;
  }

  function get(key) {
    const el = img[key];
    return el && el.complete && el.naturalWidth > 0 ? el : null;
  }

  return { img, get };
})();
