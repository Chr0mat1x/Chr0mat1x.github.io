# AGENTS.md

## Что это
«Чекушка для Меллстроя» — браузерная пародия на Cut the Rope на чистом canvas (без сборки и библиотек).

## Запуск локально
```bash
python3 -m http.server 12000   # затем http://localhost:12000
```

## Публикация
GitHub Pages: `Chr0mat1x/Chr0mat1x.github.io`, папка `chekushka/`.
Живой адрес: https://chr0mat1x.github.io/chekushka/

Токен `GITHUB_TOKEN` не умеет создавать репозитории (`Resource not accessible by integration`),
но пушит в существующие. Поэтому новый репозиторий не заводим — деплой идёт в личный GitHub Pages.

```bash
git clone https://x-access-token:$GITHUB_TOKEN@github.com/Chr0mat1x/Chr0mat1x.github.io.git /tmp/pages
# скопировать файлы игры в /tmp/pages/chekushka, затем commit + push
```

## Правила кода
- Стиль: vanilla JS, `const`/`let`, точки с запятой в конце инструкций, 2 пробела отступ.
- При изменении ассетов/скриптов бампать `?v=N` в `index.html`, иначе браузер отдаёт кеш.
- Проверка синтаксиса: `node --check game.js` (и так для остальных файлов).

## Спрайт-листы мемных нарезок
`assets/eat_sheet.png` (6x5, 200x154, 30 кадров) и `assets/bravo_sheet.png` (7x6, 200x175, 38 кадров).
Метрики лежат в `MEME_SHEETS` в `art.js`. Собираются из гифок tenor скриптом:
зелёный фон вырезается по HSV, остаются компоненты с bbox >= 40x40,
альфа смягчается, низ кадра гасится градиентом.

## Особенности отрисовки
`drawWorld` рисует Меллстроя, но в состоянии `bravo` он рисуется ПОСЛЕ `drawWinOverlay`,
иначе гифка уходит под панель победы.
