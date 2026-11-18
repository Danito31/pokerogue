"""events.py - 10 illustrations d'evenements d'expedition 160x120 : evt_<k> (meme diorama d'ile que les batiments).
Usage : events.py [cle ...]"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *
from buildings import (AZ, EL, GRASS, GRASS_D, DIRT, WIN, crate, barrel, sack, flag, tree, bush, rock, lantern, fire, win, door,
                       em, smoke, tent, EM_FIRE, EM_GREEN)
from buildings2 import hay, horse, banner, ARC, ARC_L, E, rune_float, WHITE_S, WHITE_SD
from galaxy import figure

PATH = '#c9a86a'


def ground(g=GRASS, g2=GRASS_D, path=True, deco=True):
    cyl(6.2, 0.25, (0, 0, -0.25), g, 20, name='ground')
    cyl(5.6, 0.1, (0, 0, -0.02), g2, 20, name='ground2')
    if path:
        box((1.6, 3.4, 0.06), (0, -3.6, 0), PATH, bevel=0.01)
        box((1.4, 3.0, 0.06), (0.2, -0.6, 0), PATH, bevel=0.01)
    if deco:
        for i, (x, y) in enumerate([(-3.2, -4.2), (3.4, -4.0), (-4.6, -2.6), (4.6, -2.8), (-1.0, -5.2), (1.6, -5.0)]):
            sph(0.09, (x, y, 0.1), ['#ffe066', '#ff8fb3', '#ffffff'][i % 3], 5, 4)


def person(x, y, col, s=1.3, hat=None, rot=0, z=0, face='#e8b890'):
    cyl(0.17 * s, 0.6 * s, (x, y, z), col, 6, r2=0.12 * s, rot=(0, 0, rot))
    sph(0.15 * s, (x, y, z + 0.72 * s), face, 6, 5)
    if hat:
        cyl(0.2 * s, 0.05 * s, (x, y, z + 0.82 * s), hat, 8); cyl(0.12 * s, 0.16 * s, (x, y, z + 0.84 * s), hat, 8)


def hooded(x, y, col, trim, s=1.5):
    cyl(0.3 * s, 0.95 * s, (x, y, 0), col, 8, r2=0.12 * s)
    sph(0.19 * s, (x, y, 1.0 * s), col, 7, 5, (1, 1, 1.1))
    sph(0.12 * s, (x, y - 0.1 * s, 0.98 * s), '#1a1226', 6, 4, (1, 0.6, 1))
    E(sph(0.025 * s, (x - 0.05 * s, y - 0.16 * s, 1.0 * s)), '#ffffff')
    box((0.5 * s, 0.1, 0.07 * s), (x, y - 0.29 * s, 0.25 * s), trim)
    cyl(0.04 * s, 1.4 * s, (x + 0.38 * s, y - 0.1, 0), WOOD_D, 5)


def wheel(x, y, z, r=0.5):
    torus(r, 0.07, (x, y, z), WOOD_D, 14, 4, (90, 0, 0))
    cyl(0.09, 0.14, (x, y, z), WOOD_L, 6, rot=(90, 0, 0), center=True)
    for a in (0, 60, 120):
        box((0.06, 0.06, r * 2), (x, y, z), WOOD_D, (0, a, 0), center=True)


class scaled:
    """with scaled((cx, cy), k): les objets crees dans le bloc sont agrandis d'un facteur k autour de (cx, cy)."""
    def __init__(s, c, k):
        s.c, s.k = c, k
    def __enter__(s):
        s.before = set(bpy.data.objects)
    def __exit__(s, *a):
        new = [o for o in bpy.data.objects if o not in s.before and o.parent is None]
        e = empty('scl', (s.c[0] * (1 - s.k), s.c[1] * (1 - s.k), 0), scale=s.k)
        for o in new:
            o.parent = e


def evt_marchand():
    ground()
    cx, cy = -0.6, 0.2
    box((3.0, 1.7, 0.2), (cx, cy, 0.55), WOOD, bevel=0.02)
    for sy in (-1, 1):
        box((3.0, 0.1, 0.45), (cx, cy + sy * 0.8, 0.75), WOOD_L)
    wheel(cx - 0.9, cy - 0.95, 0.5, 0.55); wheel(cx + 0.9, cy - 0.95, 0.5, 0.55)
    # bache arrondie a rayures
    for i in range(6):
        c = '#c0453a' if i % 2 == 0 else CREAM
        x = cx - 1.3 + i * 0.52
        prism(0.52, 1.8, 0.0001, (x, cy, 2.3), c) if False else None
        box((0.52, 1.9, 0.12), (x, cy, 1.95 + 0.2 * (1 - abs(i - 2.5) / 2.5)), c, (0, 0, 0))
    for sx in (-1, 1):
        for sy in (-1, 1):
            cyl(0.05, 1.5, (cx + sx * 1.4, cy + sy * 0.8, 0.7), WOOD_D, 5)
    crate(cx - 0.6, cy + 0.1, 0.6, z=0.65); sack(cx + 0.5, cy, '#d9c49a', 0.4, 0.65); barrel(cx + 1.0, cy + 0.2, 0.28, 0.65)
    E(box((0.3, 0.3, 0.25), (cx, cy - 0.85, 1.7), WIN), WIN)
    horse(2.4, 0.5, 0, 1.15, 180, '#b0885a', '#4a3020')
    rod3((1.7, 0.4, 0.9), (cx + 1.5, cy - 0.3, 0.9), 0.04, WOOD_D)
    person(1.0, -2.0, '#4a6ab8', 1.5, '#8a5ac8')
    box((1.4, 0.1, 0.8), (1.9, -2.2, 1.0), WOOD_L, (0, 0, 0))
    for i, c in enumerate(['#ff6b3d', '#6fdc6f', '#ffcf4a', '#6fd3ff']):
        sph(0.12, (1.45 + i * 0.3, -2.3, 0.45), c, 6, 4)
    box((1.3, 0.8, 0.4), (1.9, -2.3, 0.0), WOOD, bevel=0.02)
    tree(-4.6, 1.8, 1.1); tree(4.8, 1.4, 1.0); bush(-3.8, -2.4); rock(3.6, -2.6, 0.4)


def evt_blesse():
    ground()
    # adventurier allonge au bord du chemin
    sc_ = scaled((-0.5, -1.0), 1.7); sc_.__enter__()
    cyl(0.28, 1.2, (-0.9, -1.0, 0.18), '#4a6ab8', 8, rot=(0, 90, 0), center=False)
    box((1.3, 0.55, 0.28), (-0.9, -1.1, 0.0), '#4a6ab8', (0, 0, 8), 0.04)
    sph(0.32, (0.35, -1.05, 0.34), '#e8b890', 8, 6)
    sph(0.34, (0.36, -1.03, 0.42), '#7a4a30', 8, 5, (1, 1, 0.6))
    box((0.45, 0.2, 0.14), (0.3, -1.3, 0.55), '#e8e0c8')
    box((0.1, 0.2, 0.3), (-0.4, -1.45, 0.0), '#c0453a'); box((1.0, 0.05, 0.05), (-0.1, -1.2, 0.34), '#e8e0c8')
    cyl(0.14, 0.7, (-1.7, -1.4, 0.0), '#6a4a30', 6, rot=(0, 80, 0))
    for dx, dy in ((-0.5, -0.65), (-0.2, -0.7), (-1.2, -0.6)):
        sph(0.07, (dx, dy, 0.1), '#d8352a', 5, 4)
    sc_.__exit__()
    # epee plantee + sac + gourde
    rod3((1.5, -0.7, 0.0), (1.4, -0.7, 1.5), 0.05, '#dfe6f2'); box((0.6, 0.08, 0.08), (1.45, -0.7, 1.15), GOLDM)
    sph(0.4, (-2.1, -0.6, 0.35), WOOD_L, 8, 6, (1, 0.8, 0.9)); cyl(0.13, 0.3, (-1.6, -0.5, 0.0), '#6fa8dc', 6)
    # arbre + arbres, panneau
    cyl(0.06, 1.2, (2.6, -2.0, 0), WOOD_D, 6); box((1.0, 0.1, 0.5), (2.7, -2.0, 0.9), WOOD_L, (0, 0, 8))
    tree(-4.2, 1.4, 1.2); tree(4.4, 1.6, 1.0); tree(-2.6, 2.6, 0.9); bush(3.6, -0.6); rock(-3.4, -2.6, 0.4)
    fire(1.8, 1.6, 0.0001) if False else None


def evt_coffre():
    ground('#5f9a48', '#4f8a3c')
    tent('#8a5a3a', 2.8, 2.4, 1.9, -1.8, 1.4)
    # feu eteint
    for i in range(6):
        a = math.radians(i * 60)
        sph(0.2, (1.2 + math.cos(a) * 0.65, -0.2 + math.sin(a) * 0.65, 0.12), '#6f6a86', 6, 4, (1, 1, 0.7))
    cyl(0.5, 0.1, (1.2, -0.2, 0.0), '#2a2430', 8)
    for a in (0, 70, 140):
        box((1.0, 0.12, 0.12), (1.2, -0.2, 0.1), WOOD_D, (0, 0, a))
    smoke(1.2, -0.2, 0.3, 2, 0.1, cols=('#9a96ae', '#7a7690'))
    # coffre
    cx, cy = 0.2, -2.0
    box((1.3, 0.8, 0.6), (cx, cy, 0.0), WOOD, bevel=0.03)
    cyl(0.4, 1.3, (cx - 0.65, cy, 0.6), WOOD_L, 10, rot=(0, 90, 0), center=True).scale = (1, 1, 1.0)
    for sx in (-0.45, 0.45):
        box((0.12, 0.86, 0.62), (cx + sx, cy, 0.0), '#4a4660')
    box((0.22, 0.1, 0.28), (cx, cy - 0.42, 0.35), GOLDM)
    E(sph(0.2, (cx, cy, 0.95), '#ffe27a', 7, 5), '#ffe27a')
    for dx, dy in ((0.15, -0.5), (-0.3, -0.55), (0.45, -0.4)):
        E(sph(0.07, (cx + dx, cy + dy, 0.75), '#ffe27a', 5, 4), '#ffe27a')
    # camp abandonne
    crate(-0.6, -0.7, 0.6, rot=20); barrel(-2.6, -1.0); sack(2.8, -1.2, CREAM, 0.4)
    cyl(0.05, 1.5, (2.8, 1.5, 0), WOOD_D, 5); poly([(0, 0), (1.0, -0.1), (0.6, -0.4), (1.0, -0.7), (0, -0.7)], 0.04, (2.8, 1.5, 1.5), '#6a2a3a')
    box((0.7, 0.4, 0.3), (-3.4, 0.0, 0.0), '#d9b070', (0, 0, 20))
    tree(-4.8, 2.4, 1.1); tree(4.6, 1.2, 1.1); bush(3.8, -2.4); rock(-3.6, -3.0, 0.4)
    skull = sph(0.14, (-1.4, -2.6, 0.14), '#e8e0c8', 6, 5)


FOG, FOG_D = '#cfd4ee', '#a8aed4'


def fogpuff(x, y, z, r):
    sph(r * 0.72, (x, y, z), FOG if (int(x * 7 + y * 3) % 2 == 0) else FOG_D, 8, 6, (1.3, 1.0, 0.7))


def evt_creature():
    ground('#4e7a58', '#3f6a4c', False, False)
    for x, y in ((-4.4, 1.2), (4.6, 0.8), (-2.8, 3.2), (2.6, 3.4)):
        cyl(0.2, 2.6, (x, y, 0), '#3a3048', 6, r2=0.1); rod3((x, y, 1.9), (x + 0.8, y, 2.7), 0.06, '#3a3048'); rod3((x, y, 1.5), (x - 0.7, y, 2.2), 0.05, '#3a3048')
    # creature : silhouette sombre, bois, yeux lumineux
    cx, cy = 0.0, 0.3
    sph(1.3, (cx, cy, 1.8), '#2a2040', 9, 7, (1, 0.9, 1.3))
    sph(0.62, (cx, cy - 0.1, 3.4), '#2a2040', 8, 6)
    for sx in (-1, 1):
        rod3((cx + sx * 0.3, cy, 3.3), (cx + sx * 0.9, cy, 4.2), 0.09, '#3a3048'); rod3((cx + sx * 0.7, cy, 3.9), (cx + sx * 1.2, cy, 4.0), 0.06, '#3a3048')
        rod3((cx + sx * 0.8, cy, 4.2), (cx + sx * 0.6, cy, 4.8), 0.06, '#3a3048')
        E(sph(0.11, (cx + sx * 0.25, cy - 0.58, 3.45), '#ffe27a', 6, 4, (1, 0.5, 1)), '#ffe27a')
        cyl(0.2, 1.0, (cx + sx * 0.6, cy, 0.0), '#2a2040', 6)
    E(box((0.3, 0.05, 0.05), (cx, cy - 0.62, 3.1), '#8a7bd8'), '#8a7bd8')
    # brume
    for i, (x, y, z, r) in enumerate([(-2.6, -1.6, 0.5, 1.0), (-1.2, -2.2, 0.4, 1.1), (0.3, -2.4, 0.4, 1.2), (1.8, -2.0, 0.5, 1.1), (3.1, -1.4, 0.5, 1.0),
                                       (-3.4, 0.2, 0.7, 1.1), (3.7, 0.4, 0.7, 1.1), (-1.6, -0.8, 0.9, 0.9), (1.7, -0.7, 0.9, 0.9), (0.0, -1.0, 0.5, 1.0),
                                       (-2.4, 1.8, 0.8, 1.0), (2.5, 1.9, 0.8, 1.0), (-0.9, -1.5, 1.4, 0.8), (1.0, -1.5, 1.3, 0.8)]):
        fogpuff(x, y, z, r)
    for x, y, z in ((-0.6, -3.0, 0.9), (2.0, -3.2, 1.0), (-2.4, -2.6, 1.0)):
        fogpuff(x, y, z, 0.8)


def evt_passage():
    ground('#5a8a48', '#4a7a3c', False, False)
    # paroi rocheuse
    box((8.0, 1.6, 2.6), (0, 2.0, 0), '#7a7690', bevel=0.05)
    for x, w, h in ((-3.2, 1.8, 3.4), (-1.6, 1.4, 3.0), (3.0, 1.8, 3.5), (1.8, 1.5, 3.1)):
        box((w, 1.7, h), (x, 2.0, 0), '#6f6a86', (0, 0, 0), 0.08)
    # porte lumineuse (arche)
    box((2.2, 0.5, 2.6), (0, 1.0, 0), STONE_L, bevel=0.04)
    o = box((1.5, 0.6, 1.9), (0, 0.85, 0), '#fff0a8'); E(o, '#fff0a8')
    E(cyl(0.75, 0.6, (0, 0.85, 1.9), '#fff0a8', 12, rot=(90, 0, 0)), '#fff0a8')
    box((1.5, 0.62, 0.0001), (0, 0.8, 0), '#fff0a8')
    E(box((0.5, 0.62, 1.5), (0, 0.8, 0.2), '#ffffff'), '#ffffff')
    for sx in (-1, 1):
        box((0.35, 0.6, 2.4), (sx * 1.25, 0.95, 0), STONE_D, bevel=0.03)
    box((3.0, 0.6, 0.35), (0, 0.9, 2.6), STONE_D, bevel=0.03) if False else None
    for sx in (-1, 1):
        cyl(0.05, 1.2, (sx * 1.9, -0.6, 0), WOOD_D, 5); E(cyl(0.14, 0.3, (sx * 1.9, -0.6, 1.2), '#ff8a3a', 5, r2=0.0), '#ff8a3a')
    # lierre, runes, gravats
    for x in (-1.0, 1.1, -0.2):
        rod3((x, 0.65, 2.6), (x + 0.1, 0.6, 1.6), 0.05, '#3f9a4c')
    rune_float(-2.2, 1.0, 2.2, 0.22, ARC_L, 0); rune_float(2.2, 1.0, 2.0, 0.22, ARC, 1)
    for x, y in ((-1.6, -0.3), (1.9, -0.2), (0.6, -0.7), (-0.8, -1.2)):
        rock(x, y, 0.3)
    # explorateur de dos
    person(0.2, -1.8, '#4a6ab8', 1.6, '#8a5ac8')
    tree(-4.8, -0.5, 1.2); tree(4.8, -0.4, 1.1); bush(-3.6, -2.6); bush(3.6, -2.6)


def evt_faction():
    ground()
    hooded(-1.9, 0.0, '#5a3ab8', '#ffcf4a', 1.55)
    hooded(0.0, 0.5, '#2a2a30', '#c0453a', 1.7)
    hooded(1.9, 0.0, '#2f7a50', '#e8e0c8', 1.55)
    for x, y, c in ((-2.7, 1.2, '#5a3ab8'), (0.0, 1.9, '#c0453a'), (2.7, 1.2, '#2f7a50')):
        banner(x, y, 1.6, c, 1.6, 0.75)
        cyl(0.05, 2.2, (x, y, 0), WOOD_D, 5)
    # parchemin tendu + pied
    box((0.5, 0.35, 0.05), (0.0, -1.2, 0.9), '#f2ead6', (-30, 0, 0))
    box((0.6, 0.45, 0.3), (0.0, -1.2, 0.0), WOOD, bevel=0.02)
    E(sph(0.1, (0.3, -1.2, 1.1), '#ff7a7a', 5, 4), '#ff7a7a')
    crate(-3.2, -1.6, 0.6); barrel(3.4, -1.4)
    tree(-4.8, 2.0, 1.1); tree(4.8, 2.4, 1.0); rock(3.4, -3.0, 0.4); bush(-3.6, -3.0)


def evt_embuscade():
    ground('#6a9a40', '#5a8a38', True, False)
    rng = np.random.RandomState(5)
    for i in range(70):
        x, y = rng.uniform(-5.0, 5.0), rng.uniform(-3.4, 3.8)
        if abs(x - 0.1) < 0.9 and y < 1.8:
            continue
        h = rng.uniform(1.0, 1.9)
        c = ['#c8b848', '#8ab838', '#a8c848'][i % 3]
        o = cyl(0.12, h, (x, y, 0), c, 4, r2=0.0)
        o.rotation_euler = (math.radians(rng.uniform(-9, 9)), math.radians(rng.uniform(-9, 9)), 0)
    # voyageur au centre du chemin
    person(0.15, -1.6, '#4a6ab8', 1.6, '#8a5ac8')
    cyl(0.04, 1.4, (0.55, -1.6, 0), WOOD_D, 5)
    # silhouettes + yeux rouges dans les herbes
    for x, y in ((-1.6, 0.8), (1.7, 1.0), (-0.6, 2.4), (-2.9, -0.4)):
        sph(0.3, (x, y, 0.6), '#2a2040', 6, 5, (1, 1, 1.4))
        for sx in (-1, 1):
            E(sph(0.05, (x + sx * 0.1, y - 0.26, 0.82), '#ff3a3a', 4, 3), '#ff3a3a')
        rod3((x + 0.35, y - 0.1, 0.4), (x + 0.5, y - 0.1, 1.5), 0.03, '#dfe6f2')
    # fleches en vol
    for x, y, z, tx, ty, tz in ((-1.2, 1.0, 1.4, 0.0, -1.2, 1.0), (1.4, 1.3, 1.6, 0.3, -1.3, 1.2)):
        rod3((x, y, z), (tx, ty, tz), 0.03, '#e8e0c8')
    tree(-4.8, 2.4, 1.1); tree(4.8, 2.6, 1.0); rock(3.6, -2.6, 0.4)


def evt_autel():
    ground('#4e7a58', '#3f6a4c', False, False)
    cyl(3.0, 0.25, (0, 0.4, 0), '#6f6a86', 10, bevel=0.02); cyl(2.5, 0.25, (0, 0.4, 0.25), '#7f7a98', 10)
    # colonnes ruinees
    for x, y, h in ((-2.2, -0.2, 2.4), (2.2, -0.1, 1.5), (-1.9, 2.4, 1.9), (2.0, 2.6, 2.8)):
        cyl(0.4, 0.2, (x, y, 0.5), STONE_D, 8); cyl(0.3, h, (x, y, 0.7), STONE, 8)
        sph(0.35, (x, y, 0.8), '#4a8a48', 6, 4, (1, 1, 0.5))
    box((0.8, 0.8, 0.3), (-2.9, 0.8, 0.5), STONE_L, (0, 0, 20))
    # autel
    box((2.0, 1.1, 0.8), (0, 0.6, 0.5), STONE_D, bevel=0.03)
    box((1.5, 0.9, 0.7), (0, 0.6, 1.3), STONE, bevel=0.03)
    box((2.1, 1.2, 0.2), (0, 0.6, 2.0), STONE_L, bevel=0.03)
    E(box((0.9, 0.06, 0.12), (0, 0.0, 1.7), '#4de0c0'), '#4de0c0')
    E(box((0.12, 0.06, 0.6), (0, 0.0, 1.45), '#4de0c0'), '#4de0c0')
    E(poly(star_pts(4, 0.45, 0.14), 0.1, (0, 0.5, 3.0), '#ffe27a'), '#ffe27a')
    E(sph(0.16, (0, 0.55, 2.55), '#ffffff', 6, 5), '#ffffff')
    for x in (-0.6, 0.6):
        cyl(0.1, 0.35, (x, 0.5, 2.2), '#d8d0b4', 6); E(cyl(0.07, 0.2, (x, 0.5, 2.55), '#ff8a3a', 5, r2=0.0), '#ff8a3a')
    for i, (x, y) in enumerate(((-1.3, -1.0), (1.2, -1.2), (0.0, -1.6))):
        E(poly(star_pts(4, 0.2, 0.07), 0.06, (x, y, 0.3), '#4de0c0'), '#4de0c0')
    tree(-4.8, 0.6, 1.2); tree(4.8, 0.8, 1.1); bush(-3.2, -3.0); rock(3.4, -3.0, 0.4)


def evt_source():
    ground('#5a9a50', '#4a8a44', True, False)
    # bassin rocheux
    cyl(2.3, 0.3, (0.1, 0.2, 0.0), '#7f7a98', 12, bevel=0.03)
    cyl(1.9, 0.12, (0.1, 0.2, 0.3), '#6fd3ff', 12)
    E(cyl(1.3, 0.04, (0.1, 0.2, 0.42), '#9ae8ff', 12), '#9ae8ff')
    E(cyl(0.6, 0.04, (0.1, 0.2, 0.46), '#e0faff', 10), '#e0faff')
    for i in range(10):
        a = math.radians(i * 36)
        sph(0.3 + 0.08 * (i % 3), (0.1 + math.cos(a) * 2.2, 0.2 + math.sin(a) * 2.2, 0.2), STONE if i % 2 else STONE_D, 6, 4, (1.2, 1, 0.8))
    # rocher + cascade
    box((1.6, 1.0, 2.3), (0.1, 2.0, 0), '#6f6a86', (0, 0, 0), 0.1); box((1.2, 0.9, 0.5), (0.0, 1.9, 2.3), STONE, bevel=0.1)
    E(box((0.5, 0.3, 2.2), (0.1, 1.45, 0.3), '#9ae8ff'), '#9ae8ff')
    # lueurs de soin
    for i, (x, y, z) in enumerate(((-1.1, -0.4, 1.3), (1.4, -0.5, 1.6), (0.3, -0.9, 2.2), (-0.4, 0.8, 2.6), (1.5, 1.0, 2.3), (-1.6, 0.9, 1.9))):
        c = ['#7dffa8', '#c8fff0'][i % 2]
        if i % 2:
            E(cyl(0.09, 0.3, (x, y, z), c, 4), c); E(box((0.3, 0.09, 0.09), (x - 0.15, y, z + 0.1), c), c)
        else:
            E(sph(0.1, (x, y, z), c, 5, 4), c)
    for x, y, c in ((-2.2, -1.4, '#ff8fb3'), (2.5, -1.2, '#ffe066'), (-3.0, 1.0, '#ffffff'), (3.0, 1.4, '#ff8fb3'), (-1.0, -2.2, '#ffe066')):
        cyl(0.03, 0.3, (x, y, 0), '#3f9a4c', 4); sph(0.1, (x, y, 0.36), c, 5, 4)
    tree(-4.6, 1.5, 1.2); tree(4.7, 1.8, 1.1); bush(3.6, -2.4); rock(-3.6, -2.6, 0.4)


def evt_piege():
    ground('#7a8a48', '#6a7a40')
    # fosse
    sc_ = scaled((0.0, -0.3), 1.45); sc_.__enter__()
    cyl(1.8, 0.03, (0.0, -0.3, 0.0), '#1a1020', 12)
    cyl(1.5, 0.03, (0.0, -0.3, 0.03), '#0e0818', 12)
    for i in range(9):
        a = math.radians(i * 40 + 10); r_ = 0.2 + 0.9 * ((i * 37) % 10) / 10
        cyl(0.11, 0.9, (math.cos(a) * r_, -0.3 + math.sin(a) * r_, 0.0), '#dfe6f2', 5, r2=0.0)
    cyl(0.14, 1.0, (0.0, -0.3, 0.0), '#dfe6f2', 5, r2=0.0)
    # couverture a moitie effondree : planches + feuillage
    box((1.9, 0.35, 0.1), (-0.5, 0.2, 0.95), WOOD_L, (0, -14, 10)); box((1.5, 0.35, 0.1), (-0.9, -0.5, 0.75), WOOD, (0, 12, -20))
    for dx, dy in ((-1.2, 0.1), (-0.7, 0.45), (-0.2, 0.4), (-1.4, -0.6)):
        sph(0.35, (dx, dy, 0.8), '#4aa856', 6, 4, (1.2, 1, 0.4))
    sc_.__exit__()
    # os / chapeau / corde, panneau d'alerte
    box((0.6, 0.12, 0.12), (1.6, -1.6, 0.0), '#e8e0c8', (0, 0, 30)); sph(0.14, (2.0, -1.4, 0.15), '#e8e0c8', 6, 5)
    cyl(0.28, 0.05, (-1.8, -1.5, 0.0), '#8a5ac8', 8); cyl(0.16, 0.25, (-1.8, -1.5, 0.05), '#8a5ac8', 8, r2=0.05)
    rod3((1.3, 1.2, 0.0), (1.2, 1.2, 0.9), 0.06, WOOD_D); rod3((-2.4, 1.2, 0.0), (-2.4, 1.2, 0.9), 0.06, WOOD_D)
    rod3((1.2, 1.2, 0.7), (-2.4, 1.2, 0.7), 0.025, '#d8c8a0')
    cyl(0.06, 1.3, (2.4, 0.4, 0), WOOD_D, 5); poly([(-0.4, 0), (0.4, 0), (0.4, 0.7), (-0.4, 0.7)], 0.08, (2.4, 0.35, 1.3), WOOD_L, (0, 0, 0), 0.01)
    E(poly(star_pts(3, 0.3, 0.12, 90), 0.06, (2.4, 0.28, 1.65), '#ff5a5a'), '#ff5a5a')
    tree(-4.7, 1.8, 1.1); tree(4.6, 2.3, 1.0); bush(-3.6, -2.8); rock(3.8, -2.6, 0.4)


KEYS = ['marchand', 'blesse', 'coffre', 'creature', 'passage', 'faction', 'embuscade', 'autel', 'source', 'piege']


def build(k):
    reset_scene()
    globals()['evt_' + k]()
    add_render('evt_' + k, 160, 120, mode='fixed', ppu=0.060, anchor=(80, 74), az=AZ, el=EL, ss=3, t_light=0.90)
    finish_model('evt_' + k)


if __name__ == '__main__':
    for k in ([a for a in sys.argv[1:] if a in KEYS] or KEYS):
        build(k)
