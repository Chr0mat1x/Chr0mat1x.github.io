# -*- coding: utf-8 -*-
"""Сборка графики сакуры для hero из авторского рисунка.

Запуск из корня репозитория:  python tools/build_art.py

Что делает:
  1. Обрезает tools/sakura_ref.png по содержимому и убирает белое поле,
     превращая его в настоящую прозрачность (рисунок не перерисовывается).
  2. Задаёт ось ветки опорными точками, снятыми с самого рисунка.
  3. Считает карту роста: 0 — проявляется первым, 255 — последним.
     Ствол сжимается к началу, поэтому сначала проступает ветка,
     затем по фронту раскрываются цветы и бутоны.
  4. Кладёт результат в img/sakura.png и img/sakura-grow.png.
"""
import os
import numpy as np
from PIL import Image
from scipy import ndimage

SRC = os.path.join('tools', 'sakura_ref.png')
PREVIEW = os.path.join('tools', '_preview')
os.makedirs(PREVIEW, exist_ok=True)
im = Image.open(SRC).convert('RGB')
a = np.asarray(im).astype(np.int16)
H, W = a.shape[:2]
lum = a.mean(axis=2)

# The snip caught a dark strip of the chat UI on the left; ignore that strip.
X0 = 14
work = lum[:, X0:]
ink = work < 140
ink = ndimage.binary_opening(ink, np.ones((2, 2)))

ys, xs = np.nonzero(ink)
print('source', W, 'x', H)
print('ink bbox in cropped coords x', xs.min(), xs.max(), 'y', ys.min(), ys.max())

# Margin so strokes are not clipped at the edges.
M = 4
bx0, bx1 = max(0, xs.min() - M), xs.max() + M
by0, by1 = max(0, ys.min() - M), ys.max() + M
print('final art box', (bx0 + X0, by0, bx1 - bx0 + 1, by1 - by0 + 1))

crop = lum[by0:by1 + 1, bx0 + X0:bx1 + X0 + 1].astype(np.float32)
ch, cw = crop.shape

# White paper -> transparent, pencil shading kept as grey via alpha.
alpha = np.clip((252.0 - crop) / 205.0, 0, 1)
alpha[alpha < .02] = 0
print('ink coverage %', round(100 * float((alpha > 0).mean()), 2))

art = np.zeros((ch, cw, 4), dtype=np.uint8)
art[..., 3] = (alpha * 255).astype(np.uint8)
Image.fromarray(art, 'RGBA').save(os.path.join(PREVIEW, '_art_cut.png'))
print('art size', (cw, ch))

# ---------------------------------------------------------------- ось ветки
# Ось ветки задаём опорными точками, снятыми с самого рисунка: она идёт
# от толстого правого конца вниз-влево, в середине доходит до самой нижней
# точки и плавно уходит вверх к тонкому левому кончику.
CONTROL = [(75, 188), (110, 199), (150, 205), (195, 206), (240, 200),
           (280, 201), (320, 197), (360, 188), (400, 175), (440, 162),
           (480, 152), (520, 120), (571, 95)]
cx = np.array([p[0] for p in CONTROL], dtype=np.float64)
cy = np.array([p[1] for p in CONTROL], dtype=np.float64)
ax_full = np.arange(cw, dtype=np.float64)
axis_y = np.interp(ax_full, cx, cy)
axis_y = ndimage.uniform_filter1d(axis_y, size=9)
axis_y = np.clip(axis_y, 0, ch - 1)
print('axis y at left/mid/right: %.0f %.0f %.0f' % (
    axis_y[0], axis_y[cw // 2], axis_y[-1]))

# Насколько ось реально лежит на тёмной полосе — самопроверка.
dark = crop < 140
on = 0
for x in range(60, cw):
    y = int(round(axis_y[x]))
    if 0 <= y < ch and dark[max(0, y - 3):y + 4, x].any():
        on += 1
print('axis on ink: %d of %d columns (%.0f%%)' % (on, cw - 60, 100.0 * on / (cw - 60)))

# ------------------------------------------------------- карта роста 0..255
N = 400
ax_full = np.arange(cw, dtype=np.float64)
si = np.linspace(0, cw - 1, N).astype(int)
px, py = ax_full[si], axis_y[si]
seg = np.hypot(np.diff(px), np.diff(py))
arc = np.concatenate(([0], np.cumsum(seg)))
total = arc[-1]

grid_y, grid_x = np.mgrid[0:ch, 0:cw]
best_s = np.full((ch, cw), np.inf)
best_d = np.full((ch, cw), np.inf)
for i in range(N - 1):                       # проекция на ось, кусочно-по-отрезкам
    x0, x1, y0, y1 = px[i], px[i + 1], py[i], py[i + 1]
    dx, dy = x1 - x0, y1 - y0
    L2 = dx * dx + dy * dy
    t = 0.0 if L2 == 0 else np.clip(((grid_x - x0) * dx + (grid_y - y0) * dy) / L2, 0, 1)
    d = np.hypot(grid_x - (x0 + t * dx), grid_y - (y0 + t * dy))
    s = arc[i] + t * (arc[i + 1] - arc[i])
    upd = d < best_d
    best_d[upd] = d[upd]
    best_s[upd] = s[upd]

# От оси к краям проявление идёт с задержкой — «чернило расползается».
# Задержка задаётся в долях полной длины проявления на каждый пиксель от оси.
RADIAL = 1.15 / total
prog = best_s / total + RADIAL * np.minimum(best_d, 130.0)

# Ствол проявляется заметно раньше крон: сжимаем его прогресс к началу.
trunk = best_d <= 11
prog = np.where(trunk, prog * .52, prog)

ink_mask = alpha > 0
lo, hi = prog[ink_mask].min(), prog[ink_mask].max()
prog = (prog - lo) / (hi - lo)
prog = np.where(ink_mask, prog, 1.0)        # пустое место не проявляется
grow = (np.clip(prog, 0, 1) * 255).astype(np.uint8)
Image.fromarray(grow, 'L').save(os.path.join(PREVIEW, '_art_grow.png'))

# Превью: рисунок поверх карты роста + сама ось.
prev = np.dstack([(alpha * 255).astype(np.uint8)] * 3)
prev = (prev * .55 + np.dstack([grow] * 3).astype(np.float32) * .45).astype(np.uint8)
prev[py.astype(int), px.astype(int)] = [255, 0, 0]

# Увеличенный кусок для сверки оси с веткой.
prev = Image.fromarray(prev, 'RGB')
prev.save(os.path.join(PREVIEW, '_art_growprev.png'))

# Увеличенные куски — для глазомерной сверки оси с веткой.
Z = 3
arr = np.asarray(prev)
for tag, xa, xb in (('right', 420, cw), ('left', 0, 240), ('mid', 200, 440)):
    zoom = np.kron(arr[:, xa:xb], np.ones((Z, Z, 1), dtype=np.uint8))
    Image.fromarray(zoom, 'RGB').save(os.path.join(PREVIEW, '_zoom_%s.png' % tag))

# Опорные точки для опадающих лепестков — вдоль оси, чуть выше ветки.
anchors = []
for k in range(14):
    t = .04 + .92 * k / 13.
    x = int(t * (cw - 1))
    y = int(axis_y[x] - 12 - 6 * np.sin(k * 1.7))
    anchors.append([round(x / cw, 4), round(y / ch, 4)])
print('anchors (в js/script.js, массив SPOTS):')
print('[' + ', '.join('[%s, %s]' % (p[0], p[1]) for p in anchors) + ']')

# ------------------------------------------------------------ готовые ассеты
os.makedirs('img', exist_ok=True)
art_out = Image.fromarray(art, 'RGBA')
art_out.save('img/sakura.png', optimize=True)
Image.fromarray(grow, 'L').save('img/sakura-grow.png', optimize=True)
print('img/sakura.png      %dx%d  %d bytes' % (
    cw, ch, os.path.getsize('img/sakura.png')))
print('img/sakura-grow.png %dx%d  %d bytes' % (
    cw, ch, os.path.getsize('img/sakura-grow.png')))
print('grow range', int(grow.min()), int(grow.max()),
      '| dark px %d' % int((grow < 128).sum()))

print('--- grow along the axis (should be low) ---')
row = []
for x in range(10, cw, 50):
    y = int(round(axis_y[x]))
    lo_y, hi_y = max(0, y - 4), min(ch, y + 5)
    patch = grow[lo_y:hi_y, x][alpha[lo_y:hi_y, x] > 0]
    row.append('x=%d:%s' % (x, '-' if patch.size == 0 else str(int(patch.mean()))))
print(' '.join(row))
trunk_px = ink_mask & (best_d <= 11)
print('trunk px %d, mean grow %.0f | all ink mean %.0f' % (
    int(trunk_px.sum()), float(grow[trunk_px].mean()), float(grow[ink_mask].mean())))