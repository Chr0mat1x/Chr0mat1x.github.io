# AGENTS.md

## Что это
«Чекушка для Меллстроя» — браузерная пародия на Cut the Rope на чистом canvas (без сборки и библиотек).

## Запуск локально
```bash
python3 -m http.server 12000   # затем http://localhost:12000
```

## Публикация
GitHub Pages: `Chr0mat1x/Chr0mat1x.github.io`, папка `chekushka/`.
Живой адрес: https://chr0mat1x.github.io/chekushka/ (с ?v=42 и 100 уровнями)

Токен `GITHUB_TOKEN` не умеет создавать репозитории (`Resource not accessible by integration`),
но пушит в существующие. Поэтому новый репозиторий не заводим — деплой идёт в личный GitHub Pages.

```bash
git clone https://x-access-token:$GITHUB_TOKEN@github.com/Chr0mat1x/Chr0mat1x.github.io.git /tmp/pages
# без rsync: cp -a assets /tmp/pages/chekushka/assets (rsync в образе нет)
cp index.html style.css assets.js audio.js art.js levels.js game.js /tmp/pages/chekushka/
rm -rf /tmp/pages/chekushka/assets && cp -a assets /tmp/pages/chekushka/assets
# затем commit + push; Pages подхватывает примерно за минуту
```

## Правила кода
- Стиль: vanilla JS, `const`/`let`, точки с запятой в конце инструкций, 2 пробела отступ.
- При изменении ассетов/скриптов бампать `?v=N` в `index.html`, иначе браузер отдаёт кеш.
- Проверка синтаксиса: `node --check game.js` (и так для остальных файлов).

## Спрайт-листы мемных нарезок
`assets/eat_sheet.png` (6x5, 200x154, 30 кадров), `assets/bravo_sheet.png` (7x6, 200x175, 38 кадров),
`assets/red_sheet.png` (6x4, 200x240, 24 кадра).
Метрики лежат в `MEME_SHEETS` в `art.js`. Собираются из гифок tenor скриптом:
зелёный фон вырезается по HSV, остаются компоненты с bbox >= 40x40,
альфа смягчается, низ кадра гасится градиентом.

У `red_sheet.png` фон не зелёный, а комнатный, поэтому там rembg (u2net) на кадре целиком, кадрирование
по bbox «розовой» маски лица (HSV), мягкая растушёвка краёв тайла и гашение низа градиентом.
Источник — `/tmp/mell/v3/xzmMs_TBEW4.gif`, сборка: `/tmp/mell/red2/build_tight.py` (тайл 200x240).

## Мем «я уже красный»
`RED_STREAK` в game.js = 3. `lose()` инкрементит `G.loseStreak` и при достижении порога ставит
`melState = 'red'`; `win()` обнуляет серию. В `drawWorld` состояния `red` и `bravo` пропускаются,
а рисуются после оверлея, иначе гифка уходит под панель.

## Уровни
`levels.js` — 100 уровней, координаты в логической системе 576x1024. Проходимость проверяется
скриптами в `tools/`:
* `node tools/check-levels.js [номера]` — трассирует случайные резы (TRIES, по умолчанию 300),
  печатает win% и распределение звёзд, в конце `ALL LEVELS OK` либо список проблем.
* `node tools/tune-stars.js <номер> [прогонов]` — старый подборщик звёзд по коридорам по y
  (переменные `BANDS`, `XMAX`, `MIN_SEP`, `TOPN`); оставлен для ручных экспериментов.
* `node tools/gen-levels.js <с> <по>` — генератор уровней по архетипам (`single`, `fanUp`, `fanSide`,
  `double`, `swing2`, `spikes`, `gate`, `combo`). Пишет результат в `/tmp/gen-levels.json`.
* `node tools/build-levels.js` — пересобирает `levels.js` из `/tmp/gen-levels.json`
  (`stars` берутся из результата подбора, `def` их не затирает).
* `node tools/fix-stars.js <номер> [попыток]` — пересобирает только звёзды готового уровня по
  реальным траекториям побед и правит строку `stars` в `levels.js`.
* `node tools/regen-level.js <номер> [архетип] [порог]` — перегенерировать один уровень.
* `node tools/rebuild-levels.js` — пересобрать все 100 уровней из `tools/archetypes2.js` + `tools/gen-levels.js`.
* `node tools/audit-stars.js` — проверяет, что тройка звёзд лежит на реальных траекториях побед.
* `node tools/name-levels.js` — переименовывает уровни по их архетипу (`KINDS` — план архетипов по номерам).



## Разнообразие уровней
26 архетипов, раскладка задаётся в `tools/gen-levels.js` (`ORDER`) и `tools/archetypes2.js`.
Динамика уровня живёт в полях данных:
* `hazards[].patrol` — шипы ездят (`axis`, `amp`, `speed`, `phase`), позиция считается от `G.t`.
* `mel.patrol` — Меллстрой ходит по `x` (`amp`, `speed`, `phase`).
* `fans[].pulse` — вентилятор мигает (`period`, `duty`, `phase`), в `stepPhysics` выключенный поток пропускается.
* `ropes[].osc` — якорь качается/ездит (`axis` — `x`/`y`, либо круг при `orbit`).

Картон уникален для каждого уровня: `ensureBg` передаёт `11 + G.level * 131` в `Art.buildBackground`,
`dressCardboard` раскидывает скотч, пятна, царапки и стикеры. Цвет фона не перекрашивается: слой
`drawLevelTint` с палитрами `TINTS` убран, фон «плыл» от уровня к уровню. Подсказки на канве тоже убраны
(поле `hint` в данных осталось неиспользуемым).
Проверка вёрстки без прохождения: `_preview.html?lvl=N` (не деплоить).


## Звук под мемные гифки
`GIF_SFX` в game.js привязывает звуки к номерам кадров спрайт-листа (`fps` и `count` должны совпадать
с `MEME_SHEETS` в art.js): `chew` — чавканье и хлебальник (`bite`, `slurp`), `bravo` — аплодисменты и свист,
`red` — утробный стон. `gifSfx()` вызывается из игрового цикла и помнит последний кадр (`gifHit`),
поэтому звук не дублируется на каждом тике. Сами звуки — синтез в `audio.js`.

Критерий готовности уровня: win ≥ ~15% и хотя бы одна траектория на 3 звезды
(на практике держим средний win ~40% и 3★ у 10–30% побед).

## Расстановка звёзд
`pickStars(def, paths, relax)` в `tools/gen-levels.js` берёт точки траекторий побед, фильтрует их
через `free()` и делит на три группы по ходу падения (звезда 1 — сверху, 3 — у рта).
`free()` отбраковывает точки:
* у стен и HUD: `x ∈ [68, 508]`, `y ∈ [330, 930]` (в `relax`-режиме для старых плотных уровней —
  `x ∈ [52, 524]`, `y ∈ [300, 945]`);
* на вырезке Меллстроя — прямоугольник от рта: `|dx| < 112`, `dy ∈ (-116, 142)`
  (спрайт 194x222 при `s = 0.86`, точка отсчёта — рот, а не центр головы);
* на бутылке — прямоугольник `|dx| < 48`, `dy ∈ (-66, 74)`; радиус тут не работает,
  бутылка высокая и узкая;
* в шипах, в вентиляторах (`f.r + 34`), у якорей верёвок.
Звёзды в тройке не ближе `70` px друг к другу (в `relax` — `52`).

Быстрая проверка геометрии без симуляции:

```bash
node -e "const {LEVELS}=require('./tools/check-levels');let b=0;LEVELS.forEach((L,i)=>{L.stars.forEach(s=>{const dx=Math.abs(s.x-L.bottle.x),dy=s.y-L.bottle.y;if(dx<40&&dy>-62&&dy<70){console.log(i+1,'в бутылке');b++}if(Math.abs(s.x-L.mel.x)<106&&s.y>L.mel.y-118&&s.y<L.mel.y+134){console.log(i+1,'на вырезке');b++}})});console.log('проблем',b)"
```

## Особенности отрисовки
`drawWorld` рисует Меллстроя, но в состоянии `bravo` он рисуется ПОСЛЕ `drawWinOverlay`,
иначе гифка уходит под панель победы.

## Звук мемных гифок
Нарезки лежат в `assets/sfx/` (`eat.mp3` — «сладость, приятность и вкусность»,
`bravo.mp3` — аплодисменты, `red.mp3` — «я уже красный»). Источник — myinstants.
`AudioContext` создаётся только по первому жесту: `Sfx.preload()` качает mp3 в `ArrayBuffer`,
а `Sfx.unlock()` (виснет на `pointerdown`/`keydown`/`touchend`) декодирует их. Если создать
контекст при загрузке страницы, Chrome оставляет его suspended и звука нет вообще.
Файлы с myinstants часто начинаются с 1–3 с тишины и записаны тихо, поэтому `measure()`
считает первый громкий участок (`lead`) и пик, а `meme()` играет с этой точки и с поднятой громкостью.
Без этого срез в 1.5 с попадал в тишину и звук «не слышно».
Привязка к состояниям — `MEL_SFX` в `game.js` (`chew`, `bravo`, `red`), запуск — `melSfx()`
по смене `G.melState`.
