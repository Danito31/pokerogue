"""buildings.py - 11 batiments x 3 niveaux (+ terrain vide) -> bld_<k>_<lv> (54x58) et bldui_<k>_<lv> (160x120)."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *

BLD_COL.update({'hdv': '#4a6ab8', 'chasse': '#6a7a3a', 'biblio': '#8a5ac8', 'labo': '#d0508a',
                'entrepot': '#8a7050', 'marche': '#d8b838'})
BLD_NAMES = ['auberge', 'ferme', 'camp', 'inf', 'forge', 'hdv', 'chasse', 'biblio', 'labo', 'entrepot', 'marche']
AZ, EL = 20, 30
PPUS, UPPU = {1: 0.086, 2: 0.118, 3: 0.152}, {1: 0.060, 2: 0.068, 3: 0.082}
WIN = '#ffe08a'
GRASS, GRASS_D, DIRT = '#58a650', '#458c40', '#8a6a4a'
RED = '#ff5a5a'


# ------------------------------------------------------------------ petits accessoires
def crate(x, y, s=0.5, m=WOOD_L, z=0, rot=0):
    box((s, s, s), (x, y, z), m, (0, 0, rot), 0.02)
    box((s * 1.02, s * 0.12, s * 0.12), (x, y, z + s * 0.45), WOOD_D, (0, 0, rot))


def barrel(x, y, s=0.32, z=0):
    cyl(s, s * 2.1, (x, y, z), WOOD, 10, bevel=0.02)
    cyl(s * 1.05, s * 0.18, (x, y, z + s * 0.5), STONE_D, 10)
    cyl(s * 1.05, s * 0.18, (x, y, z + s * 1.5), STONE_D, 10)


def sack(x, y, c=CREAM, s=0.3, z=0):
    sph(s, (x, y, z + s * 0.8), c, 8, 6, (1, 1, 1.15))


def flag(x, y, h, col, z=0, w=0.9, hh=0.55, rot=0):
    cyl(0.05, h, (x, y, z), WOOD_D, 6)
    poly([(0, 0), (w, -hh * 0.15), (w * 0.8, -hh * 0.5), (w, -hh * 0.85), (0, -hh)], 0.05,
         (x, y, z + h), col, (0, 0, rot))
    sph(0.09, (x, y, z + h + 0.06), GOLDM, 6, 4)


def tree(x, y, s=1.0, col='#3f9a4c'):
    cyl(0.14 * s, 0.7 * s, (x, y, 0), WOOD_D, 6)
    sph(0.62 * s, (x, y, 1.05 * s), col, 8, 6)
    sph(0.42 * s, (x + 0.2 * s, y - 0.1 * s, 1.5 * s), '#4aa856', 7, 5)


def bush(x, y, s=0.4, col='#4aa856'):
    sph(s, (x, y, s * 0.6), col, 7, 5, (1.2, 1, 0.8))


def rock(x, y, s=0.35, col=STONE):
    sph(s, (x, y, s * 0.4), col, 6, 4, (1.2, 1, 0.7))


def lantern(x, y, z, s=0.12):
    box((s, s, s * 1.4), (x, y, z), WIN, bevel=0.01).data.materials[0] = mat(WIN, 1)
    box((s * 1.3, s * 1.3, s * 0.25), (x, y, z + s * 1.4), DARK)


def fire(x, y, s=0.3, z=0):
    for i, a in enumerate((0, 60, 120)):
        box((s * 1.6, s * 0.28, s * 0.28), (x, y, z), WOOD_D, (0, 0, a))
    cyl(s * 0.55, s * 1.5, (x, y, z + s * 0.25), FIRE, 6, r2=0.0).data.materials[0] = mat(FIRE, 1)
    cyl(s * 0.3, s * 1.0, (x, y, z + s * 0.35), '#ffe27a', 6, r2=0.0).data.materials[0] = mat('#ffe27a', 1)


def win(x, y, z, w=0.55, h=0.6, rot=0, frame=WOOD_D, d=0.14):
    box((w + 0.16, d, h + 0.16), (x, y, z), frame, (0, 0, rot), 0.01)
    o = box((w, d + 0.04, h), (x, y, z + 0.08), WIN, (0, 0, rot))
    o.data.materials.clear(); o.data.materials.append(mat(WIN, 1))
    box((0.06, d + 0.06, h), (x, y, z + 0.08), frame, (0, 0, rot))


def door(x, y, z=0, w=0.8, h=1.25, col=WOOD_D, arch=False, rot=0):
    box((w + 0.2, 0.18, h + 0.1), (x, y, z), WOOD, (0, 0, rot), 0.02)
    box((w, 0.22, h), (x, y, z), col, (0, 0, rot))
    box((0.08, 0.26, 0.08), (x + w * 0.3, y, z + h * 0.45), GOLDM, (0, 0, rot))


def planks(W, D, h, y_front, step=0.42, col=WOOD_D, z=0):
    n = int(W / step)
    for i in range(n + 1):
        x = -W / 2 + i * W / n
        box((0.06, 0.05, h), (x, y_front - 0.02, z), col)


def bricks(W, D, h, z0=0.0, col=STONE_D, step=0.5):
    """lignes de joints sur la facade avant et le flanc droit."""
    z = z0 + step
    while z < z0 + h - 0.1:
        box((W + 0.02, 0.04, 0.05), (0, -D / 2 - 0.015, z), col)
        box((0.04, D + 0.02, 0.05), (W / 2 + 0.015, 0, z), col)
        z += step
    for j, z in enumerate([z0 + step * i for i in range(int(h / step))]):
        off = (j % 2) * 0.35
        x = -W / 2 + 0.35 + off
        while x < W / 2 - 0.1:
            box((0.045, 0.04, step), (x, -D / 2 - 0.015, z), col)
            x += 0.7


def chimney(x, y, z, h=1.1, w=0.5, col=STONE_D, smoke=False):
    box((w, w, h), (x, y, z), col, bevel=0.02)
    box((w * 1.25, w * 1.25, 0.12), (x, y, z + h), STONE)


def stall(x, y, col, w=1.4, d=1.0, h=1.0, rot=0):
    for dx in (-w / 2, w / 2):
        for dy in (-d / 2, d / 2):
            cyl(0.05, h, (x + dx, y + dy, 0), WOOD_D, 6)
    box((w, d * 0.8, 0.5), (x, y + 0.05, 0), WOOD, bevel=0.02)
    n = 5
    for i in range(n):
        c = col if i % 2 == 0 else CREAM
        prism(w / n, d * 1.15, 0.4, (x - w / 2 + (i + 0.5) * w / n, y, h), c, rot=(0, 0, 0)).rotation_euler = (0, 0, 0)
    for i in range(3):
        sph(0.11, (x - 0.4 + i * 0.4, y - 0.1, 0.62), ['#ff6b3d', '#6fdc6f', '#ffcf4a'][i], 6, 4)


# ------------------------------------------------------------------ niveau 1 : campement
def tent(col, W=2.8, D=2.4, H=2.0, x=0, y=0):
    prism(W, D, H, (x, y, 0), col, ov=0.0, name='tent')
    box((W + 0.04, 0.1, 0.1), (x, y, H), CREAM)                      # faitage
    for s_ in (-1, 1):                                               # bandes claires
        box((W + 0.03, 0.06, 0.2), (x, y + s_ * D * 0.34, H * 0.32), CREAM, (s_ * -32, 0, 0))
    poly([(-0.5, 0), (0.5, 0), (0, 1.35)], 0.06, (x, y - D / 2 - 0.02, 0.0), DARK, name='opening')
    for sx in (-1, 1):
        cyl(0.06, H + 0.5, (x + sx * W / 2, y - D / 2 - 0.05, 0), WOOD_D, 6)
    cyl(0.05, 0.5, (x + W / 2, y, H), WOOD_D, 6)


def lv1(k, C):
    tent(C, 2.8, 2.4, 2.0, -0.2, 0.2)
    flag(1.2, 0.5, 2.9, C, z=0, rot=0)
    fire(1.5, -1.3, 0.28)
    for p in [(-1.9, -1.2), (-1.5, -1.5)]:
        rock(p[0], p[1], 0.22)
    F1[k](C)


def f1_auberge(C):
    barrel(-2.0, -0.9); barrel(-1.65, -1.3, 0.26)
    box((0.9, 0.5, 0.45), (0.2, -1.6, 0), WOOD, bevel=0.02); box((1.0, 0.6, 0.08), (0.2, -1.6, 0.45), WOOD_L)


def f1_ferme(C):
    for i in range(3):
        box((1.5, 0.22, 0.14), (-1.5, -1.6 + i * 0.4, 0), DIRT)
        for j in range(4):
            sph(0.1, (-2.1 + j * 0.4, -1.6 + i * 0.4, 0.22), '#6fdc6f', 5, 4)
    cyl(0.5, 0.45, (1.7, -1.5, 0), '#e8c860', 8, r2=0.1)


def f1_camp(C):
    for x in (-2.0, -1.2):
        cyl(0.06, 0.9, (x, -1.5, 0), WOOD_D, 6); box((0.6, 0.06, 0.1), (x, -1.5, 0.65), WOOD_D)
        sph(0.2, (x, -1.5, 1.05), '#d9b070', 6, 5)
    box((0.1, 0.06, 0.9), (1.4, -1.8, 0.2), STONE_L, (0, 20, 0)); box((0.3, 0.06, 0.06), (1.35, -1.8, 0.35), WOOD_D)


def f1_inf(C):
    box((0.18, 0.1, 0.62), (0, -1.28, 1.55), RED); box((0.62, 0.1, 0.18), (0, -1.28, 1.77), RED)
    box((1.1, 0.5, 0.3), (-1.8, -1.3, 0), CREAM, bevel=0.03); box((1.1, 0.2, 0.34), (-1.8, -1.3, 0.3), '#e8e0c8')
    cyl(0.18, 0.5, (1.9, -1.4, 0), '#a8f0ff', 8).data.materials[0] = mat('#8fe8d8', 1)


def f1_forge(C):
    box((0.9, 0.5, 0.45), (-1.7, -1.4, 0), STONE_D, bevel=0.03); box((1.1, 0.6, 0.15), (-1.7, -1.4, 0.45), '#4a4660')
    box((0.4, 0.5, 0.3), (-1.7, -1.4, 0.6), '#4a4660')
    o = box((0.5, 0.3, 0.2), (1.6, -1.5, 0), FIRE); o.data.materials.clear(); o.data.materials.append(mat(FIRE, 1))
    box((0.9, 0.6, 0.5), (1.6, -1.5, 0), STONE_D, bevel=0.03)
    box((0.8, 0.2, 0.2), (1.6, -1.8, 0.5), '#8d86a8')


def f1_hdv(C):
    flag(-1.7, -0.3, 3.4, GOLDM, rot=0)
    box((1.4, 0.6, 0.4), (0.3, -1.7, 0), STONE_D, bevel=0.03); box((1.0, 0.3, 0.9), (0.3, -1.8, 0.4), WOOD_L)
    crate(2.0, -1.2, 0.45); sack(-2.0, -1.3)


def f1_chasse(C):
    box((1.6, 0.08, 0.08), (-1.6, -1.4, 1.2), WOOD_D); cyl(0.05, 1.2, (-2.4, -1.4, 0), WOOD_D, 6); cyl(0.05, 1.2, (-0.8, -1.4, 0), WOOD_D, 6)
    for i in range(3):
        box((0.25, 0.06, 0.55), (-2.0 + i * 0.4, -1.4, 0.65), '#c9885a', (0, 0, 0))
    cyl(0.45, 0.07, (1.8, -1.4, 0.55), CREAM, 12, rot=(90, 0, 0)); cyl(0.2, 0.08, (1.8, -1.44, 0.55), RED, 12, rot=(90, 0, 0))
    cyl(0.05, 0.6, (1.8, -1.3, 0), WOOD_D, 6)


def f1_biblio(C):
    for i, c in enumerate(['#c0453a', '#4a6ab8', '#5a9a3a', GOLDM]):
        box((0.5, 0.2, 0.1 + i * 0.01 + 0.07), (-1.9, -1.4, i * 0.17), c)
    box((0.7, 0.5, 0.9), (1.8, -1.4, 0), WOOD, bevel=0.02); box((0.8, 0.6, 0.1), (1.8, -1.45, 0.9), WOOD_L, (-15, 0, 0))
    box((0.5, 0.35, 0.05), (1.8, -1.45, 1.02), CREAM, (-15, 0, 0))


def f1_labo(C):
    cyl(0.45, 0.6, (-1.9, -1.4, 0), '#3a3a4a', 10, r2=0.5)
    cyl(0.4, 0.05, (-1.9, -1.4, 0.62), '#6fdc6f', 10).data.materials[0] = mat('#6fdc6f', 1)
    for i, c in enumerate(['#ff7ad9', '#6fd3ff', '#ffe27a']):
        sph(0.15, (1.5 + i * 0.35, -1.5, 0.35 + 0.15), c, 6, 5).data.materials[0] = mat(c, 1)
        cyl(0.05, 0.2, (1.5 + i * 0.35, -1.5, 0.45), '#d0f0ff', 6)
    box((1.4, 0.5, 0.3), (1.8, -1.5, 0), WOOD, bevel=0.02)


def f1_entrepot(C):
    crate(-2.0, -1.3, 0.55); crate(-1.4, -1.5, 0.45); crate(-1.8, -1.3, 0.45, z=0.55)
    barrel(1.8, -1.4); sack(1.3, -1.7); sack(2.2, -1.7, '#d9c49a')


def f1_marche(C):
    stall(-1.9, -1.5, C, 1.3, 0.9, 0.9)
    crate(1.9, -1.4, 0.5); sph(0.12, (1.9, -1.4, 0.62), '#ff6b3d', 6, 4); sack(1.4, -1.6)


F1 = dict(auberge=f1_auberge, ferme=f1_ferme, camp=f1_camp, inf=f1_inf, forge=f1_forge, hdv=f1_hdv,
          chasse=f1_chasse, biblio=f1_biblio, labo=f1_labo, entrepot=f1_entrepot, marche=f1_marche)


# ------------------------------------------------------------------ niveau 2 : bois
def lv2(k, C):
    W, D, wh, rh = 3.6, 2.8, 1.7, 1.5
    if k in ('ferme', 'entrepot', 'chasse'):
        W = 4.0
    if k == 'entrepot':
        wh = 2.0
    box((W + 0.2, D + 0.2, 0.2), (0, 0, 0), STONE, bevel=0.02)
    box((W, D, wh), (0, 0, 0.2), WOOD, bevel=0.02, name='walls')
    planks(W, D, wh, -D / 2, z=0.2)
    box((0.1, D, wh), (W / 2 - 0.02, 0, 0.2), WOOD_D); box((0.1, D, wh), (-W / 2 + 0.02, 0, 0.2), WOOD_D)
    box((W + 0.1, 0.1, 0.12), (0, -D / 2, 0.2 + wh - 0.1), WOOD_D)
    prism(W, D, rh, (0, 0, 0.2 + wh), C, ov=0.32, name='roof')
    box((W + 0.9, 0.12, 0.12), (0, 0, 0.2 + wh + rh), '#e8e0c8')
    door(0 if k != 'ferme' else -0.8, -D / 2, 0.2)
    win(-1.2 if k != 'ferme' else 0.3, -D / 2, 1.0)
    win(1.2, -D / 2, 1.0)
    d = dict(W=W, D=D, wh=wh + 0.2, rh=rh, C=C)
    F2[k](d)


def f2_auberge(d):
    chimney(1.1, 0.4, 2.2, 1.0)
    box((0.07, 0.07, 0.9), (-2.3, -1.7, 0.3), WOOD_D); box((0.8, 0.07, 0.07), (-1.9, -1.7, 1.1), WOOD_D)
    box((0.55, 0.1, 0.45), (-1.9, -1.7, 0.7), GOLDM, bevel=0.02)
    barrel(2.3, -1.2); barrel(2.0, -1.6, 0.26)
    cyl(0.12, 0.2, (-1.9, -1.76, 0.8), CREAM, 6, rot=(90, 0, 0))


def f2_ferme(d):
    box((1.6, 0.1, 1.6), (0.8, -1.42, 0.3), WOOD_D)    # grande porte de grange
    box((1.7, 0.12, 0.09), (0.8, -1.46, 0.9), CREAM, (0, 0, 0)); box((0.09, 0.12, 1.6), (0.8, -1.46, 0.3), CREAM)
    cyl(0.7, 0.7, (-2.6, -1.8, 0), '#e8c860', 8, r2=0.1); cyl(0.3, 0.4, (-2.6, -1.8, 0.7), '#e8c860', 8, r2=0.0)
    for i in range(3):
        for j in range(5):
            sph(0.1, (-3.1 + j * 0.45 + 5.0, -2.2 + i * 0.36, 0.22), '#6fdc6f', 5, 4)
        box((2.2, 0.2, 0.12), (2.5, -2.2 + i * 0.36, 0), DIRT)
    for x in range(-2, 3):
        box((0.08, 0.08, 0.55), (x * 0.55 - 0.3, -2.7, 0), WOOD_D)
    box((2.8, 0.06, 0.08), (-0.3, -2.7, 0.35), WOOD_D)


def f2_camp(d):
    for x in (-2.7, -2.0, 2.2):
        cyl(0.07, 1.1, (x, -1.9, 0), WOOD_D, 6); box((0.75, 0.08, 0.12), (x, -1.9, 0.78), WOOD_D)
        sph(0.24, (x, -1.9, 1.3), '#d9b070', 6, 5)
    box((1.3, 0.12, 0.9), (-0.9, -1.55, 0.2), WOOD_D, name='rack')
    for i, x in enumerate((-1.3, -0.95, -0.6)):
        box((0.07, 0.08, 1.0), (x, -1.62, 0.25), STONE_L, (0, 12 * (i - 1), 0))
    flag(1.8, -1.4, 2.3, d['C'])
    box((0.5, 0.5, 0.5), (2.9, -1.2, 0), WOOD_L)


def f2_inf(d):
    box((0.32, 0.12, 1.1), (0, -d['D'] / 2 - 0.05, 2.2), RED if False else CREAM)
    box((1.1, 0.12, 0.32), (0, -d['D'] / 2 - 0.05, 2.6), CREAM)
    box((0.2, 0.14, 0.86), (0, -d['D'] / 2 - 0.06, 2.3), RED); box((0.86, 0.14, 0.2), (0, -d['D'] / 2 - 0.06, 2.64), RED)
    for i, c in enumerate(['#8fe8d8', '#ff7ad9', '#a8f0ff']):
        sph(0.17, (-2.3 + i * 0.4, -1.8, 0.4), c, 6, 5).data.materials[0] = mat(c, 1)
    box((1.3, 0.6, 0.35), (-2.4, -1.8, 0), CREAM, bevel=0.03)
    box((0.9, 0.4, 0.6), (2.4, -1.6, 0), '#e8e0c8')
    chimney(1.2, 0.5, 2.2, 0.9)


def f2_forge(d):
    chimney(-1.0, 0.3, 2.2, 2.2, 0.7, '#4a4660')
    cyl(0.28, 0.18, (-1.0, 0.3, 4.5), FIRE, 8).data.materials[0] = mat(FIRE, 1)
    box((1.2, 0.6, 0.7), (1.5, -1.8, 0), '#4a4660', bevel=0.03)
    box((0.9, 0.5, 0.2), (1.5, -1.8, 0.7), '#6f6a86'); box((0.4, 0.4, 0.3), (1.5, -1.8, 0.9), '#6f6a86')
    o = box((0.8, 0.14, 0.36), (-1.6, -d['D'] / 2 - 0.02, 0.4), FIRE); o.data.materials.clear(); o.data.materials.append(mat(FIRE, 1))
    barrel(2.5, -1.2); box((0.9, 0.5, 0.5), (-2.4, -1.7, 0), STONE_D)


def f2_hdv(d):
    # tour centrale avec horloge
    cyl(0.9, 1.4, (0, 0.2, d['wh'] + d['rh'] * 0.6), WOOD, 8, bevel=0.02)
    cyl(1.05, 0.2, (0, 0.2, d['wh'] + d['rh'] * 0.6 + 1.4), WOOD_D, 8)
    cyl(1.0, 1.4, (0, 0.2, d['wh'] + d['rh'] * 0.6 + 1.6), d['C'], 8, r2=0.0)
    cyl(0.34, 0.08, (0, -0.74, d['wh'] + d['rh'] * 0.6 + 0.7), CREAM, 12, rot=(90, 0, 0))
    flag(0, 0.2, 1.1, GOLDM, z=d['wh'] + d['rh'] * 0.6 + 3.0)
    for x in (-1.9, 1.9):
        crate(x, -1.8, 0.5)
    box((2.0, 0.8, 0.2), (0, -1.9, 0), STONE_L); box((1.5, 0.5, 0.2), (0, -2.2, 0), STONE)


def f2_chasse(d):
    for i in range(2):   # bois de cerf
        cyl(0.04, 0.6, (-0.3 + i * 0.6, -d['D'] / 2 - 0.1, 2.0), CREAM, 5, rot=(0, 25 * (1 - 2 * i), 0))
    box((0.5, 0.1, 0.4), (0, -d['D'] / 2 - 0.08, 1.8), '#c9885a')
    box((1.8, 0.08, 0.1), (2.4, -1.6, 1.3), WOOD_D); cyl(0.06, 1.3, (1.6, -1.6, 0), WOOD_D, 6); cyl(0.06, 1.3, (3.2, -1.6, 0), WOOD_D, 6)
    for i in range(3):
        box((0.28, 0.05, 0.6), (1.9 + i * 0.5, -1.6, 0.65), '#c9885a')
    cyl(0.5, 0.07, (-2.7, -1.5, 0.8), CREAM, 12, rot=(90, 0, 0)); cyl(0.2, 0.08, (-2.7, -1.54, 0.8), RED, 12, rot=(90, 0, 0)); cyl(0.05, 0.8, (-2.7, -1.4, 0), WOOD_D, 6)
    tree(-3.2, 0.8, 0.9)


def f2_biblio(d):
    cyl(0.4, 0.1, (0, -d['D'] / 2 - 0.05, 2.2), CREAM, 12, rot=(90, 0, 0))
    o = cyl(0.3, 0.12, (0, -d['D'] / 2 - 0.08, 2.2), WIN, 12, rot=(90, 0, 0)); o.data.materials.clear(); o.data.materials.append(mat(WIN, 1))
    for i, c in enumerate(['#c0453a', '#4a6ab8', '#5a9a3a', GOLDM, '#8a5ac8']):
        box((0.6, 0.25, 0.14), (-2.4, -1.8, i * 0.16 + 0.02), c)
    cyl(0.1, 0.8, (2.2, -1.8, 0), WOOD_D, 6); box((0.7, 0.5, 0.08), (2.2, -1.8, 0.8), WOOD_L, (-20, 0, 0))
    box((0.5, 0.35, 0.06), (2.2, -1.82, 0.86), CREAM, (-20, 0, 0))
    chimney(1.2, 0.3, 2.2, 0.9)


def f2_labo(d):
    chimney(-1.2, 0.3, 2.2, 1.6, 0.6, STONE_D)
    for i in range(3):
        sph(0.18 + i * 0.04, (-1.2 + i * 0.1, 0.3, 4.0 + i * 0.45), '#b8f0c8', 6, 5, (1, 1, 0.8))
    cyl(0.6, 0.55, (2.4, -1.7, 0), '#3a3a4a', 10, r2=0.65)
    cyl(0.5, 0.05, (2.4, -1.7, 0.58), '#6fdc6f', 10).data.materials[0] = mat('#6fdc6f', 1)
    for i, c in enumerate(['#ff7ad9', '#6fd3ff', '#ffe27a']):
        sph(0.17, (-2.5 + i * 0.4, -1.8, 0.62), c, 6, 5).data.materials[0] = mat(c, 1)
        cyl(0.06, 0.25, (-2.5 + i * 0.4, -1.8, 0.7), '#d0f0ff', 6)
    box((1.4, 0.6, 0.45), (-2.1, -1.8, 0), WOOD, bevel=0.02)
    cyl(0.4, 0.1, (0, -d['D'] / 2 - 0.05, 2.1), '#6fdc6f', 12, rot=(90, 0, 0)).data.materials[0] = mat('#6fdc6f', 1)


def f2_entrepot(d):
    box((1.8, 0.12, 1.6), (0, -d['D'] / 2 - 0.02, 0.2), WOOD_D); box((0.08, 0.14, 1.6), (0, -d['D'] / 2 - 0.02, 0.2), CREAM)
    box((2.0, 0.14, 0.1), (0, -d['D'] / 2 - 0.03, 1.8), CREAM)
    crate(-2.7, -1.6, 0.6); crate(-2.0, -1.8, 0.5); crate(-2.55, -1.6, 0.5, z=0.6)
    barrel(2.7, -1.7); barrel(2.2, -2.0, 0.28); sack(2.9, -1.2); sack(2.5, -1.3, '#d9c49a')
    box((0.8, 0.08, 0.5), (-1.2, -d['D'] / 2 - 0.04, 2.3), WOOD_L)


def f2_marche(d):
    stall(-2.3, -2.0, d['C'], 1.4, 1.0, 1.0)
    stall(2.3, -2.0, '#ff6b3d', 1.4, 1.0, 1.0)
    box((1.4, 0.1, 0.5), (0, -d['D'] / 2 - 0.04, 1.8), d['C'])
    flag(0, 0, 1.2, GOLDM, z=d['wh'] + d['rh'])
    crate(0.9, -1.8, 0.5); sph(0.14, (0.9, -1.8, 0.62), '#ff6b3d', 6, 4)


F2 = dict(auberge=f2_auberge, ferme=f2_ferme, camp=f2_camp, inf=f2_inf, forge=f2_forge, hdv=f2_hdv,
          chasse=f2_chasse, biblio=f2_biblio, labo=f2_labo, entrepot=f2_entrepot, marche=f2_marche)


# ------------------------------------------------------------------ niveau 3 : pierre
def lv3(k, C):
    W, D, wh, rh = 4.8, 3.4, 2.5, 1.9
    box((W + 0.4, D + 0.4, 0.3), (0, 0, 0), STONE_D, bevel=0.03)
    box((W, D, wh), (0, 0, 0.3), STONE, bevel=0.03, name='walls')
    bricks(W, D, wh, 0.3)
    box((W + 0.1, D + 0.1, 0.2), (0, 0, 0.3 + wh), STONE_L, bevel=0.02)
    prism(W - 0.4, D, rh, (0, 0, 0.5 + wh), C, ov=0.4, name='roof')
    box((W + 0.6, 0.16, 0.16), (0, 0, 0.5 + wh + rh), STONE_L)
    for sx in (-1, 1):                       # tourelles d'angle
        x = sx * (W / 2 + 0.05)
        cyl(0.62, wh + 1.0, (x, -D / 2, 0), STONE, 10, bevel=0.02)
        cyl(0.7, 0.18, (x, -D / 2, wh + 0.9), STONE_L, 10)
        cyl(0.85, 1.4, (x, -D / 2, wh + 1.05), C, 10, r2=0.0)
        flag(x, -D / 2, 0.9, C, z=wh + 2.4, w=0.7, hh=0.4)
        win(x, -D / 2 - 0.55, 1.6, 0.3, 0.5, 0, STONE_D)
    box((1.3, 0.3, 1.9), (0, -D / 2 - 0.05, 0.3), STONE_L, bevel=0.03)       # portail voute
    cyl(0.65, 0.3, (0, -D / 2 - 0.05, 2.2), STONE_L, 12, rot=(90, 0, 0))
    box((0.95, 0.34, 1.55), (0, -D / 2 - 0.08, 0.3), WOOD_D)
    cyl(0.48, 0.34, (0, -D / 2 - 0.08, 1.85), WOOD_D, 12, rot=(90, 0, 0))
    box((0.08, 0.36, 1.5), (0, -D / 2 - 0.1, 0.3), WOOD)
    win(-1.5, -D / 2, 1.5, 0.5, 0.8, 0, STONE_D); win(1.5, -D / 2, 1.5, 0.5, 0.8, 0, STONE_D)
    d = dict(W=W, D=D, wh=wh + 0.5, rh=rh, C=C)
    F3[k](d)


def f3_auberge(d):
    chimney(1.3, 0.5, 3.5, 1.5, 0.7); chimney(-1.5, 0.5, 3.5, 1.2, 0.6)
    box((0.1, 0.1, 1.2), (-3.0, -2.5, 0), WOOD_D); box((1.3, 0.1, 0.1), (-2.4, -2.5, 1.2), WOOD_D)
    box((0.8, 0.12, 0.65), (-2.4, -2.5, 0.5), GOLDM, bevel=0.03)
    cyl(0.2, 0.14, (-2.4, -2.58, 0.7), CREAM, 8, rot=(90, 0, 0))
    barrel(3.2, -2.0); barrel(2.8, -2.4, 0.28); barrel(3.4, -1.6, 0.28)
    lantern(0.9, -d['D'] / 2 - 0.35, 2.4); lantern(-0.9, -d['D'] / 2 - 0.35, 2.4)


def f3_ferme(d):
    cyl(0.9, 4.2, (3.2, 0.2, 0), STONE, 12, bevel=0.02); cyl(1.05, 0.2, (3.2, 0.2, 4.0), STONE_L, 12)
    cyl(1.0, 1.1, (3.2, 0.2, 4.2), d['C'], 12, r2=0.0)
    # moulin
    cyl(0.12, 0.3, (-0.0, 0.6, d['wh'] + d['rh'] * 0.9), WOOD_D, 6, rot=(90, 0, 0))
    for a in (0, 90):
        box((0.16, 0.06, 2.0), (-2.5, -2.45, 2.2), CREAM, (0, 0, 0)).rotation_euler = (0, math.radians(a + 25), 0)
    cyl(0.14, 2.0, (-2.5, -2.3, 0), WOOD_D, 6, r2=0.1)
    for i in range(4):
        box((2.4, 0.25, 0.14), (-0.4, -2.4 - i * 0.0, 0), '#3a2c20') if False else None
    for i in range(3):
        box((2.2, 0.26, 0.14), (0.4, -2.3 - 0.0 - i * 0.4, 0), DIRT)
        for j in range(5):
            sph(0.1, (-0.5 + j * 0.45, -2.3 - i * 0.4, 0.22), '#6fdc6f', 5, 4)
    cyl(0.6, 0.7, (-3.4, -1.4, 0), '#e8c860', 8, r2=0.1)


def f3_camp(d):
    for x in (-3.4, -2.6, 3.0):
        cyl(0.08, 1.2, (x, -2.4, 0), WOOD_D, 6); box((0.9, 0.1, 0.14), (x, -2.4, 0.85), WOOD_D)
        sph(0.27, (x, -2.4, 1.4), '#d9b070', 6, 5)
    for x in range(-3, 4):
        box((0.1, 0.1, 0.7), (x * 0.45 + 0.0, -3.0, 0), WOOD_D) if False else None
    flag(-0.0, 0.5, 1.4, d['C'], z=d['wh'] + d['rh'], w=1.0, hh=0.6)
    box((1.6, 0.14, 1.0), (1.1, -d['D'] / 2 - 0.4, 0.3), WOOD_D)
    for i in range(4):
        box((0.08, 0.1, 1.1), (0.55 + i * 0.35, -d['D'] / 2 - 0.5, 0.35), STONE_L, (0, 10 * (i - 1.5), 0))
    cyl(0.5, 0.08, (-1.6, -d['D'] / 2 - 0.1, 2.2), CREAM, 12, rot=(90, 0, 0)); cyl(0.3, 0.1, (-1.6, -d['D'] / 2 - 0.13, 2.2), RED, 12, rot=(90, 0, 0))


def f3_inf(d):
    cyl(1.0, 0.3, (0, 0, d['wh'] + d['rh'] * 0.9), STONE_L, 12)
    cyl(0.9, 0.9, (0, 0, d['wh'] + d['rh'] * 0.9 + 0.3), CREAM, 12)
    sph(0.95, (0, 0, d['wh'] + d['rh'] * 0.9 + 1.2), d['C'], 12, 8, (1, 1, 0.8))
    box((0.24, 0.2, 0.9), (0, -0.0, d['wh'] + d['rh'] * 0.9 + 2.0), RED); box((0.8, 0.2, 0.24), (0, 0, d['wh'] + d['rh'] * 0.9 + 2.3), RED)
    box((0.3, 0.14, 1.2), (0, -d['D'] / 2 - 0.3, 3.3), CREAM); box((1.2, 0.14, 0.3), (0, -d['D'] / 2 - 0.3, 3.75), CREAM)
    box((0.18, 0.16, 0.9), (0, -d['D'] / 2 - 0.32, 3.45), RED); box((0.9, 0.16, 0.18), (0, -d['D'] / 2 - 0.32, 3.81), RED)
    for i, c in enumerate(['#8fe8d8', '#ff7ad9', '#a8f0ff']):
        sph(0.2, (-3.1 + i * 0.45, -2.4, 0.5), c, 6, 5).data.materials[0] = mat(c, 1)
    box((1.5, 0.7, 0.4), (-3.1, -2.4, 0), CREAM, bevel=0.03)


def f3_forge(d):
    chimney(-1.3, 0.5, 3.5, 3.0, 0.9, '#4a4660')
    chimney(1.2, 0.6, 3.5, 2.2, 0.7, '#4a4660')
    for x, z in ((-1.3, 6.5), (1.2, 5.7)):
        cyl(0.3, 0.2, (x, 0.5 if x < 0 else 0.6, z), FIRE, 8).data.materials[0] = mat(FIRE, 1)
    box((1.7, 0.8, 0.9), (2.9, -2.2, 0), '#4a4660', bevel=0.04)
    box((1.3, 0.6, 0.25), (2.9, -2.2, 0.9), '#6f6a86'); box((0.6, 0.5, 0.4), (2.9, -2.2, 1.15), '#6f6a86')
    box((1.2, 0.12, 0.7), (0, -d['D'] / 2 - 0.4, 0.3), '#4a4660') if False else None
    o = box((1.0, 0.14, 0.5), (-2.2, -d['D'] / 2 - 0.02, 0.5), FIRE); o.data.materials.clear(); o.data.materials.append(mat(FIRE, 1))
    barrel(-3.2, -2.1); box((1.0, 0.6, 0.6), (-3.1, -1.0, 0), STONE_D)


def f3_hdv(d):
    zz = d['wh'] + d['rh'] * 0.6
    cyl(1.4, 2.4, (0, 0.4, zz), STONE, 10, bevel=0.02); cyl(1.6, 0.3, (0, 0.4, zz + 2.4), STONE_L, 10)
    cyl(1.5, 0.35, (0, 0.4, zz + 2.7), d['C'], 10)
    sph(1.4, (0, 0.4, zz + 3.0), d['C'], 12, 8, (1, 1, 1.0))
    cyl(0.1, 1.2, (0, 0.4, zz + 4.3), GOLDM, 6)
    flag(0, 0.4, 1.0, GOLDM, z=zz + 5.0, w=0.9)
    cyl(0.5, 0.1, (0, -1.1, zz + 1.4), CREAM, 14, rot=(90, 0, 0))
    o = cyl(0.42, 0.12, (0, -1.12, zz + 1.4), WIN, 14, rot=(90, 0, 0)); o.data.materials.clear(); o.data.materials.append(mat(WIN, 1))
    for i in range(3):
        box((3.2 - i * 0.4, 0.6, 0.18), (0, -d['D'] / 2 - 0.9 + i * 0.2, i * 0.18), STONE_L)
    for x in (-2.4, 2.4):
        flag(x, -d['D'] / 2 - 0.2, 1.8, GOLDM, z=0.3, w=0.7, hh=0.4)


def f3_chasse(d):
    for i in range(2):
        cyl(0.05, 0.9, (-0.45 + i * 0.9, -d['D'] / 2 - 0.3, 2.9), CREAM, 5, rot=(0, 25 * (1 - 2 * i), 0))
        cyl(0.04, 0.5, (-0.45 + i * 0.9, -d['D'] / 2 - 0.3, 3.2), CREAM, 5, rot=(0, 55 * (1 - 2 * i), 0))
    sph(0.35, (0, -d['D'] / 2 - 0.3, 2.7), '#c9885a', 8, 6)
    # mirador
    for sx in (-0.9, 0.9):
        for sy in (-0.9, 0.9):
            cyl(0.1, 2.2, (3.3 + sx, 0.0 + sy, 0), WOOD_D, 6)
    box((2.4, 2.4, 0.2), (3.3, 0, 2.2), WOOD); pyramid(2.9, 2.9, 1.2, (3.3, 0, 2.4), d['C'])
    box((2.4, 0.08, 0.4), (3.3, -1.1, 2.4), WOOD_D)
    box((2.2, 0.1, 0.1), (-2.8, -2.4, 1.3), WOOD_D); cyl(0.07, 1.3, (-3.8, -2.4, 0), WOOD_D, 6); cyl(0.07, 1.3, (-1.8, -2.4, 0), WOOD_D, 6)
    for i in range(4):
        box((0.3, 0.05, 0.6), (-3.5 + i * 0.5, -2.4, 0.65), '#c9885a')
    tree(-3.4, 1.5, 1.0)


def f3_biblio(d):
    for x in (-1.8, 1.8):
        cyl(0.22, 2.4, (x, -d['D'] / 2 - 0.35, 0.3), CREAM, 8, bevel=0.01); cyl(0.3, 0.14, (x, -d['D'] / 2 - 0.35, 2.7), STONE_L, 8)
    box((4.2, 0.4, 0.2), (0, -d['D'] / 2 - 0.35, 2.8), STONE_L)
    zz = d['wh'] + d['rh'] * 0.5
    cyl(1.3, 1.0, (0, 0.2, zz), STONE, 10); sph(1.35, (0, 0.2, zz + 1.0), d['C'], 12, 8, (1, 1, 0.9))
    cyl(0.06, 0.8, (0, 0.2, zz + 2.15), GOLDM, 6)
    poly(star_pts(5, 0.4, 0.17), 0.1, (0, 0.2, zz + 3.15), GOLDM).data.materials[0] = mat(GOLDM, 1)
    cyl(0.5, 0.1, (0, -d['D'] / 2 - 0.5, 3.35), CREAM, 12, rot=(90, 0, 0)) if False else None
    for i, c in enumerate(['#c0453a', '#4a6ab8', '#5a9a3a', GOLDM, '#8a5ac8', '#c0453a']):
        box((0.7, 0.3, 0.16), (-3.2, -2.3, i * 0.18), c)
    box((0.7, 0.3, 0.16), (3.2, -2.4, 0.0), '#4a6ab8'); box((0.7, 0.3, 0.16), (3.2, -2.4, 0.17), GOLDM)


def f3_labo(d):
    zz = d['wh'] + d['rh'] * 0.5
    cyl(0.95, 1.4, (-1.5, 0.5, zz), '#6f6a86', 10); sph(1.0, (-1.5, 0.5, zz + 1.4), '#b8f0e0', 12, 8, (1, 1, 1.0)).data.materials[0] = mat('#7fe8c8', 1)
    cyl(0.07, 1.0, (-1.5, 0.5, zz + 2.3), GOLDM, 6)
    chimney(1.5, 0.4, 3.5, 2.3, 0.7, STONE_D)
    for i in range(3):
        sph(0.24 + i * 0.05, (1.5 + i * 0.1, 0.4, 6.0 + i * 0.55), '#b8f0c8', 6, 5, (1, 1, 0.8))
    for i, c in enumerate(['#ff7ad9', '#6fd3ff', '#ffe27a', '#6fdc6f']):
        sph(0.22, (-3.4 + i * 0.5, -2.4, 0.9), c, 6, 5).data.materials[0] = mat(c, 1)
        cyl(0.07, 0.3, (-3.4 + i * 0.5, -2.4, 1.05), '#d0f0ff', 6)
    box((2.2, 0.7, 0.7), (-2.9, -2.4, 0), WOOD, bevel=0.02)
    cyl(0.8, 0.7, (3.2, -2.2, 0), '#3a3a4a', 10, r2=0.85); cyl(0.7, 0.05, (3.2, -2.2, 0.72), '#6fdc6f', 10).data.materials[0] = mat('#6fdc6f', 1)
    cyl(0.5, 0.12, (0, -d['D'] / 2 - 0.3, 3.5), '#6fdc6f', 12, rot=(90, 0, 0)).data.materials[0] = mat('#6fdc6f', 1)


def f3_entrepot(d):
    box((2.4, 0.16, 2.1), (0, -d['D'] / 2 - 0.4, 0.3), WOOD_D); box((0.1, 0.18, 2.1), (0, -d['D'] / 2 - 0.4, 0.3), CREAM)
    box((2.6, 0.18, 0.14), (0, -d['D'] / 2 - 0.42, 2.45), CREAM)
    # grue
    box((0.16, 0.16, 3.0), (3.4, -0.5, 0), WOOD_D); box((2.0, 0.16, 0.16), (2.5, -0.5, 3.0), WOOD_D); box((0.04, 0.04, 1.0), (1.6, -0.5, 2.0), CREAM)
    crate(1.6, -0.5, 0.45, z=1.55)
    crate(-3.3, -2.3, 0.7); crate(-2.5, -2.5, 0.55); crate(-3.2, -2.3, 0.55, z=0.7)
    barrel(3.3, -2.2); barrel(2.8, -2.5, 0.28); sack(2.3, -2.2); sack(3.7, -1.6, '#d9c49a')


def f3_marche(d):
    stall(-3.1, -2.5, d['C'], 1.6, 1.1, 1.1); stall(3.1, -2.5, '#ff6b3d', 1.6, 1.1, 1.1)
    for i in range(7):
        box((0.7, 0.08, 0.5), (-2.1 + i * 0.7, -d['D'] / 2 - 0.45, 2.5), d['C'] if i % 2 == 0 else CREAM)
    flag(0, 0.3, 1.5, GOLDM, z=d['wh'] + d['rh'], w=1.0, hh=0.6)
    flag(-2.0, -1.0, 1.2, d['C'], z=d['wh'] + 0.4, w=0.7, hh=0.4)
    sack(1.0, -2.3); sack(1.5, -2.4, '#d9c49a'); crate(-1.2, -2.4, 0.55); sph(0.15, (-1.2, -2.4, 0.7), '#ff6b3d', 6, 4)


F3 = dict(auberge=f3_auberge, ferme=f3_ferme, camp=f3_camp, inf=f3_inf, forge=f3_forge, hdv=f3_hdv,
          chasse=f3_chasse, biblio=f3_biblio, labo=f3_labo, entrepot=f3_entrepot, marche=f3_marche)


# ------------------------------------------------------------------ decor illustration (collection ui_only)
def ui_decor(k, lv):
    with use_coll('ui_only'):
        cyl(6.2, 0.25, (0, 0, -0.25), GRASS, 20, name='ground')
        cyl(5.6, 0.1, (0, 0, -0.02), GRASS_D, 20, name='ground2')
        box((1.6, 3.2, 0.06), (0, -3.6, 0), '#c9a86a', bevel=0.01)       # chemin
        for p in [(-5.0, 1.5, 1.1), (5.0, 1.0, 1.0), (-4.2, 3.2, 0.8), (4.6, 3.0, 0.9), (0, 5.0, 1.0)]:
            tree(*p)
        for p in [(-3.8, -2.6), (4.2, -2.4), (-5.4, -1.0), (5.5, -1.2)]:
            bush(*p)
        for p in [(-3.2, -4.2), (3.4, -4.4)]:
            rock(*p, 0.4)
        for i, (x, y) in enumerate([(-2.2, -4.5), (2.0, -4.2), (-1.0, -5.2), (1.4, -5.0), (-4.5, -3.6), (4.4, -3.5)]):
            sph(0.09, (x, y, 0.1), ['#ffe066', '#ff8fb3', '#ffffff'][i % 3], 5, 4)


def build(k, lv):
    reset_scene()
    C = BLD_COL[k]
    {1: lv1, 2: lv2, 3: lv3}[lv](k, C)
    ui_decor(k, lv)
    add_render('bld_%s_%d' % (k, lv), 54, 58, mode='fixed', ppu=PPUS[lv], anchor=(27, 45), hide=['ui_only'], az=AZ, el=EL, t_light=0.90)
    add_render('bldui_%s_%d' % (k, lv), 160, 120, mode='fixed', ppu=UPPU[lv], anchor=(80, 74), az=AZ, el=EL, ss=3, t_light=0.90)
    finish_model('bld_%s_%d' % (k, lv))


def build_plot():
    reset_scene()
    cyl(1.9, 0.15, (0, 0, 0), '#8a6a4a', 12, name='dirt', bevel=0.02)
    cyl(1.5, 0.05, (0, 0, 0.15), '#a98a5a', 12)
    for p in [(-1.3, -0.6), (1.4, 0.5), (0.8, -1.1), (-0.9, 0.9)]:
        rock(p[0], p[1], 0.2)
    cyl(0.07, 1.4, (0.1, -0.3, 0.1), WOOD_D, 6)
    box((1.1, 0.1, 0.7), (0.1, -0.35, 1.0), WOOD_L, bevel=0.02)
    box((0.3, 0.12, 0.08), (0.1, -0.4, 1.3), WOOD_D); box((0.08, 0.12, 0.3), (0.1, -0.4, 1.15), WOOD_D)
    for i, (x, y) in enumerate([(-1.0, -1.0), (1.2, -0.7), (-0.2, 1.1)]):
        sph(0.08, (x, y, 0.2), ['#ffe066', '#ff8fb3', '#ffffff'][i], 5, 4)
        cyl(0.03, 0.2, (x, y, 0.15), '#4aa856', 4)
    for x in (-1.5, 1.5):
        cyl(0.06, 0.55, (x, -1.0, 0.1), WOOD_D, 6)
    box((3.0, 0.06, 0.07), (0, -1.0, 0.4), WOOD_D)
    add_render('plot_empty', 54, 36, mode='fixed', ppu=0.088, anchor=(27, 28), az=AZ, el=EL, t_light=0.90)
    finish_model('plot_empty')


if __name__ == '__main__':
    args = sys.argv[1:]
    ks = [a for a in args if a in BLD_NAMES] or ([] if 'plot' in args else BLD_NAMES)
    lvs = [int(a) for a in args if a.isdigit()] or [1, 2, 3]
    if 'plot' in args or not args:
        build_plot()
    for k in ks:
        for lv in lvs:
            build(k, lv)
