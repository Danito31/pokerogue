"""buildings2.py - 6 batiments supplementaires x 3 niveaux : taverne, mage, chantier, remparts, ecurie, sanctuaire.
Meme chaine de rendu que buildings.py : bld_<k>_<lv> (54x58) + bldui_<k>_<lv> (160x120)."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from buildings import *
from buildings import PPUS, UPPU, AZ, EL

NEW = {'taverne': '#c4682e', 'mage': '#5a3ad8', 'chantier': '#2f9ccf', 'remparts': '#9aa6b8', 'ecurie': '#9a5a2a', 'sanctuaire': '#f4e9b0'}
BLD_COL.update(NEW)
NAMES2 = list(NEW)
ARC, ARC_L, ARC_D = '#b07aff', '#e6d0ff', '#6a3ac0'
GLOW = '#fff3a8'
HAY, HAY_D = '#e0c060', '#b8963a'
PPU2 = {('mage', 1): 0.088, ('mage', 2): 0.138, ('mage', 3): 0.172, ('chantier', 2): 0.130, ('chantier', 3): 0.170, ('remparts', 3): 0.170,
        ('sanctuaire', 2): 0.125, ('sanctuaire', 3): 0.172, ('taverne', 3): 0.152}
UPPU2 = {('mage', 1): 0.066, ('mage', 2): 0.082, ('mage', 3): 0.098, ('chantier', 2): 0.076, ('chantier', 3): 0.092, ('sanctuaire', 2): 0.072, ('sanctuaire', 3): 0.096,
         ('remparts', 3): 0.090, ('taverne', 3): 0.086}
WHITE_S, WHITE_SD, WHITE_SL = '#e9e6f2', '#b4b0cc', '#f8f6ff'


def E(o, col):
    return em(o, col)


def hay(x, y, z=0, s=0.5, rot=0):
    box((s * 1.4, s, s * 0.8), (x, y, z), HAY, (0, 0, rot), 0.03)
    box((s * 1.44, s * 0.1, s * 0.82), (x, y - s * 0.2, z), HAY_D, (0, 0, rot))


def fence(x0, y0, x1, y1, h=0.6, n=4, col=WOOD):
    for i in range(n + 1):
        t = i / n
        cyl(0.06, h, (x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, 0), WOOD_D, 6)
    for z in (h * 0.4, h * 0.8):
        rod3((x0, y0, z), (x1, y1, z), 0.04, col)


def mug(x, y, z, s=0.3, rot=0):
    cyl(s * 0.5, s, (x, y, z), CREAM, 8, rot=(90, 0, 0))
    cyl(s * 0.52, s * 0.28, (x, y - s * 0.0, z + s * 0.0), '#e8a020', 8, rot=(90, 0, 0)).location.y = y - s * 0.52
    torus(s * 0.3, s * 0.07, (x + s * 0.55, y, z + s * 0.5), CREAM, 8, 4, (90, 0, 0))


def hang_sign(x, y, z, kind='mug', s=1.0):
    cyl(0.07, 1.3 * s + 0.4, (x, y, z), WOOD_D, 6)
    box((0.9 * s, 0.08, 0.08), (x + 0.45 * s, y, z + 1.3 * s + 0.3), WOOD_D)
    box((0.7 * s, 0.1, 0.7 * s), (x + 0.55 * s, y, z + 0.5 * s + 0.2), WOOD_L, bevel=0.02)
    for dx in (0.15, 0.95):
        box((0.04, 0.04, 0.5 * s), (x + dx * s * 0.8 + 0.0, y, z + 1.3 * s + 0.0 - 0.0), WOOD_D) if False else None
    mug(x + 0.5 * s, y - 0.08, z + 0.45 * s + 0.2, 0.42 * s)


def horse(x, y, z=0, s=1.0, rot=0, col='#6a3a22', mane='#2a1a14'):
    g = empty('horse', (x, y, z), (0, 0, rot), s)
    parts = []
    parts.append(sph(0.5, (0, 0, 0.95), col, 8, 6, (1.5, 0.7, 0.8)))
    parts.append(sph(0.32, (0.65, 0, 1.05), col, 6, 5, (1.0, 0.8, 1.0)))
    parts.append(rod3((0.55, 0, 1.0), (0.95, 0, 1.55), 0.19, col))
    parts.append(box((0.5, 0.26, 0.3), (1.05, 0, 1.4), col, (0, -20, 0)))
    parts.append(box((0.1, 0.1, 0.3), (0.82, 0.0, 1.7), col))
    parts.append(box((0.1, 0.28, 0.5), (0.72, 0, 1.45), mane, (0, 25, 0)))
    for lx, ly in ((0.55, 0.16), (0.55, -0.16), (-0.55, 0.16), (-0.55, -0.16)):
        parts.append(cyl(0.08, 0.7, (lx, ly, 0.0), col, 5))
        parts.append(cyl(0.085, 0.14, (lx, ly, 0.0), '#2a1a14', 5))
    parts.append(rod3((-0.75, 0, 1.0), (-1.05, 0, 0.55), 0.09, mane))
    for p in parts:
        p.parent = g
    return g


def balloon_env(x, y, z, r=1.0, tilt=0):
    st = [mat('#c0453a'), mat(CREAM), mat('#2f9ccf'), mat(CREAM)]
    return striped_sphere(r, (x, y, z), st, 8, (1, 1, 1.15), 16, 10)


def scaffold(x, y, w, d, h, floors=2, z=0):
    for sx in (-1, 1):
        for sy in (-1, 1):
            cyl(0.07, h, (x + sx * w / 2, y + sy * d / 2, z), WOOD_D, 6)
    for f in range(1, floors + 1):
        zz = z + f * h / floors
        box((w + 0.2, d + 0.2, 0.08), (x, y, zz - 0.04), WOOD_L)
        for sy in (-1, 1):
            box((w + 0.1, 0.07, 0.07), (x, y + sy * d / 2, zz - 0.3), WOOD_D)
    for sy in (-1,):
        rod3((x - w / 2, y + sy * d / 2 - 0.03, z), (x + w / 2, y + sy * d / 2 - 0.03, z + h * 0.5), 0.045, WOOD_D)
        rod3((x + w / 2, y + sy * d / 2 - 0.03, z), (x - w / 2, y + sy * d / 2 - 0.03, z + h * 0.5), 0.045, WOOD_D)


def crane(x, y, h=4.0, jib=2.6, z=0, d=1):
    box((0.5, 0.5, 0.2), (x, y, z), STONE_D)
    cyl(0.1, h, (x, y, z), WOOD_D, 6)
    rod3((x, y, z + 0.2), (x, y, z + h), 0.0, WOOD_D) if False else None
    box((jib, 0.14, 0.14), (x + d * jib / 2 - d * 0.5 * 0, y, z + h), WOOD, bevel=0.01) if d > 0 else box((jib, 0.14, 0.14), (x - jib / 2, y, z + h), WOOD)
    ex = x + d * jib
    rod3((x, y, z + h + 0.55), (x + d * jib * 0.95, y, z + h), 0.03, WOOD_D)
    rod3((x, y, z + h + 0.55), (x, y, z + h), 0.03, WOOD_D)
    cyl(0.025, h * 0.35, (x + d * jib * 0.85, y, z + h * 0.62), '#d8c8a0', 4)
    box((0.3, 0.3, 0.3), (x + d * jib * 0.85, y, z + h * 0.62 - 0.25), WOOD_L, bevel=0.02)
    box((0.1, 0.1, 0.5), (x - d * 0.5, y, z + h - 0.1), STONE_D)


def crenel(W, D, z, n, col=STONE_L, along='x', at=(0, 0)):
    for i in range(n):
        t = -W / 2 + (i + 0.5) * W / n
        if i % 2 == 0:
            box((W / n * 0.8, 0.3, 0.35), (at[0] + t, at[1] - D / 2 + 0.15, z), col) if along == 'x' else None


def ballista(x, y, z, s=1.0, rot=0):
    g = empty('bal', (x, y, z), (0, 0, rot), s)
    ps = [box((0.9, 0.35, 0.25), (0, 0, 0), WOOD_D, bevel=0.02),
          box((1.0, 0.18, 0.18), (0.15, 0, 0.25), WOOD, bevel=0.01),
          poly([(-0.1, 0), (0.6, 0.25), (0.9, 0.0), (0.6, -0.25)], 0.08, (0.4, 0.0, 0.5), WOOD_L, (90, 0, 0)),
          box((0.05, 0.9, 0.06), (0.75, 0, 0.5), CREAM),
          rod3((0.0, 0, 0.55), (1.4, 0, 0.55), 0.05, STEEL_ if False else '#c9d2e0'),
          cyl(0.09, 0.22, (1.4, 0, 0.55), '#c9d2e0', 4, r2=0.0, rot=(0, 90, 0)),
          cyl(0.12, 0.3, (0, 0, -0.3), WOOD_D, 6)]
    for p in ps:
        p.parent = g


def banner(x, y, z, col, h=1.2, w=0.5, rot=0):
    box((w + 0.1, 0.07, 0.08), (x, y, z + h), GOLDM, (0, 0, rot))
    poly([(-w / 2, 0), (w / 2, 0), (w / 2, -h), (0, -h * 0.8), (-w / 2, -h)], 0.04, (x, y - 0.03, z + h), col, (0, 0, rot))
    poly(star_pts(4, 0.14, 0.05), 0.05, (x, y - 0.06, z + h * 0.55), GOLDM, (0, 0, rot))


def crystal(x, y, z, s=1.0, col=ARC, tone=ARC_L):
    E(cyl(0.38 * s, 0.9 * s, (x, y, z + 0.9 * s), col, 6, r2=0.0), col)
    E(cyl(0.38 * s, 0.9 * s, (x, y, z), col, 6, r2=0.0, rot=(180, 0, 0)).__setattr__('location', (x, y, z + 0.9 * s)) or sph(0.01, (x, y, z)), col) if False else None
    c = cyl(0.38 * s, 0.9 * s, (x, y, z + 0.9 * s), col, 6, r2=0.0, rot=(180, 0, 0)); E(c, col)
    E(cyl(0.2 * s, 0.5 * s, (x, y, z + 0.9 * s), tone, 6, r2=0.0), tone)


def rune_float(x, y, z, s=0.3, col=ARC_L, k=0):
    pts = [star_pts(4, 1, 0.3), [(-1, -1), (1, -1), (0, 1)], [(-0.6, -1), (0.6, -1), (1, 0), (0.6, 1), (-0.6, 1), (-1, 0)]][k % 3]
    p = poly(pts, 0.08, (x, y, z), col, (0, 0, 0), 0)
    p.scale = (s, s, s)
    E(p, col)


def shrine_star(x, y, z, s=0.5):
    p = poly(star_pts(5, s, s * 0.45), 0.14, (x, y, z), GOLDM, (0, 0, 0), 0.01)
    E(p, '#ffd84a')


# ================================================================== TAVERNE
def taverne(lv, C):
    if lv == 1:
        box((3.0, 2.4, 1.3), (0, 0.2, 0), WOOD, bevel=0.02)
        planks(3.0, 2.4, 1.3, -1.0)
        prism(3.0, 2.4, 1.1, (0, 0.2, 1.3), C, ov=0.3)
        door(-0.5, -1.0, 0, 0.7, 1.0)
        win(0.8, -1.0, 0.5, 0.5, 0.45)
        chimney(0.9, 0.7, 1.6, 0.8)
        smoke(0.9, 0.7, 2.5, 3, 0.2)
        hang_sign(1.9, -1.3, 0, s=1.15)
        barrel(-1.9, -1.2); barrel(-1.5, -1.5, 0.24)
        box((1.0, 0.5, 0.4), (0.0, -1.8, 0), WOOD, bevel=0.02); box((1.1, 0.6, 0.07), (0, -1.8, 0.4), WOOD_L)
    elif lv == 2:
        W, D, wh, rh = 3.8, 2.8, 1.7, 1.5
        box((W + 0.2, D + 0.2, 0.2), (0, 0, 0), STONE, bevel=0.02)
        box((W, D, wh), (0, 0, 0.2), WOOD, bevel=0.02)
        planks(W, D, wh, -D / 2, z=0.2)
        box((W + 0.1, 0.1, 0.12), (0, -D / 2, 0.2 + wh - 0.1), WOOD_D)
        prism(W, D, rh, (0, 0, 0.2 + wh), C, ov=0.32)
        box((W + 0.9, 0.12, 0.12), (0, 0, 0.2 + wh + rh), '#e8e0c8')
        door(-0.2, -D / 2, 0.2); win(-1.4, -D / 2, 1.0); win(1.1, -D / 2, 1.0); win(1.1, 0.0, 2.0, 0.4, 0.4) if False else None
        chimney(1.2, 0.5, 2.2, 1.1)
        smoke(1.2, 0.5, 3.4, 3, 0.25)
        hang_sign(-2.3, -1.8, 0, s=1.4)
        barrel(2.4, -1.3); barrel(2.0, -1.7, 0.26)
        box((0.9, 0.5, 0.45), (2.2, 0.3, 0), WOOD, bevel=0.02) if False else None
        lantern(0.9, -D / 2 - 0.12, 1.9, 0.15)
    else:
        W, D, wh, rh = 4.8, 3.4, 2.5, 1.9
        box((W + 0.4, D + 0.4, 0.3), (0, 0, 0), STONE_D, bevel=0.03)
        box((W, D, 1.2), (0, 0, 0.3), STONE, bevel=0.03)
        bricks(W, D, 1.2, 0.3)
        box((W, D, wh - 1.2), (0, 0, 1.5), WOOD, bevel=0.02)
        planks(W, D, wh - 1.2, -D / 2, z=1.5)
        box((W + 0.2, D + 0.2, 0.18), (0, 0, 1.5), WOOD_D)
        prism(W - 0.4, D, rh, (0, 0, 0.3 + wh), C, ov=0.4)
        box((W + 0.6, 0.16, 0.16), (0, 0, 0.3 + wh + rh), WOOD_L)
        door(-0.3, -D / 2, 0.3, 0.9, 1.0)
        for x in (-1.8, 0.9, 1.8):
            win(x, -D / 2, 1.9, 0.5, 0.6)
        win(1.0, -D / 2, 0.7, 0.5, 0.4)
        chimney(1.5, 0.7, 3.3, 1.5, 0.6)
        chimney(-1.6, 0.7, 3.2, 1.3, 0.6)
        smoke(1.5, 0.7, 4.9, 3, 0.28); smoke(-1.6, 0.7, 4.6, 3, 0.25)
        hang_sign(-2.9, -2.0, 0, s=1.6)
        barrel(2.8, -1.8); barrel(3.2, -1.5, 0.28); barrel(2.5, -2.2, 0.26)
        box((1.2, 0.6, 0.5), (-0.2, -D / 2 - 0.5, 0), WOOD, bevel=0.02); box((1.3, 0.7, 0.07), (-0.2, -D / 2 - 0.5, 0.5), WOOD_L)
        lantern(-1.0, -D / 2 - 0.12, 1.1, 0.16); lantern(1.2, -D / 2 - 0.12, 1.1, 0.16)
        bunting(-2.0, -D / 2 - 0.3, 2.5, 9, 0.5)


# ================================================================== MAGE
def tower_body(r, h, z, col=STONE, n=10, band=True):
    cyl(r, h, (0, 0, z), col, n, bevel=0.02)
    if band:
        cyl(r * 1.05, 0.12, (0, 0, z + h * 0.5), STONE_D, n)


def arcane_win(r, z, ang=-90, w=0.34, h=0.6):
    a = math.radians(ang)
    o = box((w, 0.12, h), (math.cos(a) * r * 0.98, math.sin(a) * r * 0.98, z), ARC_L, (0, 0, ang + 90))
    E(o, ARC_L)


def mage(lv, C):
    P = '#6a48b8'
    if lv == 1:
        cyl(1.7, 0.2, (0, 0, 0), STONE_D, 10, bevel=0.02)
        tower_body(1.0, 2.3, 0.2, STONE, 9)
        cyl(1.35, 0.12, (0, 0, 2.5), STONE_L, 9)
        cyl(1.5, 1.4, (0, 0, 2.55), P, 9, r2=0.0)
        arcane_win(1.2, 1.1); door(0, -1.18, 0.2, 0.6, 0.9)
        crystal(0, 0, 4.1, 0.9)
        rune_float(-1.3, -0.6, 3.6, 0.2, ARC_L, 0); rune_float(1.4, -0.4, 3.0, 0.2, ARC, 1)
        rock(1.7, -1.2, 0.25); 
        E(cyl(0.2, 0.08, (-1.6, -1.2, 0.0), ARC, 6), ARC)
    elif lv == 2:
        cyl(2.1, 0.22, (0, 0, 0), STONE_D, 10, bevel=0.02)
        tower_body(1.1, 3.4, 0.22, STONE, 10)
        for z in (1.6, 2.8): arcane_win(1.1, z)
        arcane_win(1.1, 1.6, -30); arcane_win(1.1, 2.8, -150)
        door(0, -1.09, 0.22, 0.7, 1.1)
        cyl(1.5, 0.22, (0, 0, 3.6), STONE_L, 10, bevel=0.02)
        for i in range(8):
            a = math.radians(i * 45 + 22)
            box((0.3, 0.3, 0.3), (math.cos(a) * 1.35, math.sin(a) * 1.35, 3.82), STONE_L)
        cyl(0.9, 0.9, (0, 0, 3.8), STONE, 9)
        cyl(1.2, 1.5, (0, 0, 4.7), P, 9, r2=0.0)
        crystal(0, 0, 6.3, 0.8)
        torus(1.0, 0.04, (0, 0, 6.6), mat(ARC_L, 1), 20, 4, (70, 0, 0))
        for i, (x, y, z) in enumerate([(-1.8, -0.8, 4.8), (1.9, -0.6, 4.2), (-1.5, 0.8, 5.8)]):
            rune_float(x, y, z, 0.25, ARC_L if i % 2 else ARC, i)
        tree(2.5, 0.5, 0.6)
    else:
        cyl(2.6, 0.26, (0, 0, 0), STONE_D, 10, bevel=0.02)
        tower_body(1.15, 4.0, 0.26, STONE, 12)
        for z in (1.3, 2.4, 3.5):
            for a in (-90, -30, -150):
                arcane_win(1.15, z, a)
        door(0, -1.13, 0.26, 0.8, 1.2)
        # tourelle laterale
        cyl(0.7, 2.2, (1.7, 0.4, 0.26), STONE_L, 8, bevel=0.02); cyl(0.9, 1.0, (1.7, 0.4, 2.46), P, 8, r2=0.0)
        arcane_win(0.8, 1.3, -90) if False else None
        E(box((0.28, 0.12, 0.5), (1.7, -0.27, 1.3), ARC_L), ARC_L)
        cyl(1.6, 0.24, (0, 0, 4.26), STONE_L, 12, bevel=0.02)
        for i in range(10):
            a = math.radians(i * 36 + 18)
            box((0.34, 0.34, 0.38), (math.cos(a) * 1.45, math.sin(a) * 1.45, 4.5), STONE_L)
        cyl(0.95, 1.0, (0, 0, 4.5), STONE, 10)
        cyl(1.3, 1.6, (0, 0, 5.5), P, 10, r2=0.0)
        crystal(0, 0, 7.1, 0.9)
        torus(1.15, 0.05, (0, 0, 7.5), mat(ARC_L, 1), 22, 4, (70, 0, 0))
        for i, (x, y, z) in enumerate([(-2.0, -1.0, 6.0), (2.3, -0.6, 5.4), (-1.7, 1.0, 7.0), (1.3, -1.4, 7.4), (-2.4, -0.2, 4.6)]):
            rune_float(x, y, z, 0.28, ARC_L if i % 2 else ARC, i)
        E(cyl(0.45, 0.07, (-2.6, -2.0, 0.0), ARC, 8), ARC); E(cyl(0.3, 0.09, (-2.6, -2.0, 0.0), ARC_L, 8), ARC_L)
        rock(2.9, -1.7, 0.3); bush(-3.1, -1.2, 0.4)


# ================================================================== CHANTIER
def chantier(lv, C):
    if lv == 1:
        box((4.0, 3.0, 0.15), (0, 0.2, 0), WOOD_L, bevel=0.02)
        scaffold(-0.6, 0.2, 2.2, 1.6, 2.0, 1)
        balloon_env(1.2, 0.5, 0.9, 0.85)
        crate(-1.9, -1.4, 0.5); crate(-1.3, -1.6, 0.4, z=0)
        box((1.6, 0.3, 0.2), (0.3, -1.4, 0.15), WOOD_D); box((1.4, 0.3, 0.2), (0.3, -1.4, 0.35), WOOD_L)
        flag(1.8, -1.2, 1.8, C, rot=0)
    elif lv == 2:
        box((5.2, 3.8, 0.2), (0, 0.1, 0), WOOD_L, bevel=0.02)
        box((5.2, 0.15, 0.2), (0, -1.9, 0.0), WOOD_D)
        scaffold(-0.9, 0.2, 2.8, 2.0, 3.2, 2)
        crane(1.9, 0.6, 4.4, 2.8, 0.2, -1)
        balloon_env(1.7, -0.4, 1.3, 1.1)
        cyl(0.7, 0.5, (1.7, -0.4, 0.1), '#c0453a', 8, r2=0.4)
        crate(-2.3, -1.5, 0.6); crate(-1.6, -1.7, 0.5); sack(2.4, -1.7)
        box((1.6, 0.35, 0.22), (0.4, -1.5, 0.2), WOOD_D); box((1.4, 0.35, 0.22), (0.4, -1.5, 0.42), WOOD_L)
        flag(-2.4, 1.0, 2.6, C)
    else:
        box((6.2, 4.4, 0.25), (0, 0.1, 0), WOOD_L, bevel=0.02)
        box((6.2, 0.18, 0.25), (0, -2.2, 0.0), WOOD_D)
        # coque de dirigeable a moitie construite : berceau + couples + bordage partiel
        for x in (-2.6, 2.6):
            box((0.3, 2.6, 0.7), (x, 0.2, 0.25), WOOD_D)
        n = 7
        for i in range(n):
            x = -2.4 + i * 0.8
            for sy in (-1, 1):
                rod3((x, sy * 0.35, 1.1), (x, sy * 1.15, 2.3 - abs(i - 3) * 0.04 * 0 - (0.2 if i in (0, n - 1) else 0)), 0.07, WOOD)
            box((0.1, 1.7, 0.08), (x, 0.2, 1.0), WOOD)
        box((5.6, 0.16, 0.16), (0, 0.2, 0.95), WOOD_D)
        for sy in (-1, 1):
            box((5.6, 0.1, 0.1), (0, 0.2 + sy * 1.15, 2.25), WOOD_D)
        # bordage fini a l'avant
        poly([(-0.2, 0), (2.8, 0), (3.2, 1.2), (2.9, 1.2), (-0.2, 1.1)], 0.1, (0, -0.98, 1.05), WOOD_L, (0, 0, 0), 0.01, 'planking')
        poly([(-0.2, 0), (2.8, 0), (3.2, 1.2), (2.9, 1.2), (-0.2, 1.1)], 0.1, (0, -0.98, 1.05), WOOD_L, (0, 0, 0), 0.01, 'planking')
        poly([(1.2, 0.2), (2.8, 0.2), (3.0, 0.8), (1.2, 0.8)], 0.06, (0, -1.05, 1.05), '#e0b040', (0, 0, 0), 0)
        cyl(0.7, 0.2, (-2.9, 0.2, 1.1), STONE_D, 6, rot=(0, 90, 0)) if False else None
        # enveloppe tendue au-dessus
        balloon_env(0.3, 0.2, 4.2, 1.7)
        for sx in (-1, 1):
            rod3((sx * 1.0, 0.6, 2.4), (sx * 0.6, 0.5, 3.0), 0.05, WOOD_D)
        scaffold(-2.6, -1.0, 1.4, 1.2, 3.0, 2) if False else None
        crane(3.0, 1.0, 5.2, 3.2, 0.25, -1)
        crate(-3.0, -1.7, 0.7); crate(-2.2, -1.9, 0.55); sack(3.2, -1.7)
        flag(-2.9, 1.4, 3.2, C)
        # helice posee au sol
        for a in (0, 120, 240):
            box((0.1, 0.18, 0.6), (3.0, -1.5, 0.3), WOOD_L, (a + 30, 0, 0)).location.z = 0.7
        cyl(0.12, 0.3, (3.0, -1.5, 0.45), STONE_D, 6, rot=(0, 90, 0))


# ================================================================== REMPARTS
def remparts(lv, C):
    ST = '#aeb2c4'
    if lv == 1:
        box((4.2, 1.0, 0.25), (0, 0, 0), STONE_D, bevel=0.02)
        for i in range(9):
            h = 1.5 if i % 2 else 1.3
            cyl(0.17, h, (-1.9 + i * 0.47, -0.4, 0.2), WOOD, 6, r2=0.1)
        for i in range(9):
            cyl(0.17, 1.4, (-1.9 + i * 0.47, 0.4, 0.2), WOOD_L, 6, r2=0.1)
        box((4.0, 0.12, 0.1), (0, -0.5, 0.8), WOOD_D)
        # petite tour de guet en bois
        for sx in (-1, 1):
            for sy in (-1, 1):
                cyl(0.08, 2.2, (1.8 + sx * 0.45, 0.2 + sy * 0.45, 0.2), WOOD_D, 6)
        box((1.3, 1.3, 0.12), (1.8, 0.2, 2.4), WOOD_L)
        pyramid(1.6, 1.6, 0.9, (1.8, 0.2, 2.5), C)
        banner(-1.2, -0.65, 1.2, '#c0453a', 0.9)
        for p in [(-1.6, -1.6), (0.4, -1.8)]: rock(p[0], p[1], 0.25)
    elif lv == 2:
        box((5.6, 1.4, 0.2), (0, 0, 0), STONE_D, bevel=0.02)
        box((5.0, 1.0, 1.7), (-0.3, 0, 0.2), ST, bevel=0.02)
        bricks(5.0, 1.0, 1.7, 0.2)
        box((5.2, 1.3, 0.16), (-0.3, 0, 1.9), STONE_L)
        for i in range(6):
            box((0.5, 0.3, 0.4), (-2.3 + i * 0.9, -0.45, 2.06), STONE_L)
        # tour
        cyl(0.95, 3.4, (2.2, 0.0, 0.2), ST, 8, bevel=0.02)
        cyl(1.15, 0.2, (2.2, 0.0, 3.4), STONE_L, 8)
        for i in range(8):
            a = math.radians(i * 45 + 22)
            if i % 2 == 0: box((0.42, 0.42, 0.4), (2.2 + math.cos(a) * 1.0, math.sin(a) * 1.0, 3.8), STONE_L)
        cyl(1.2, 1.0, (2.2, 0.0, 3.6), STONE_D, 8) if False else None
        cyl(0.85, 0.9, (2.2, 0.0, 3.6), STONE, 8)
        cyl(1.15, 1.3, (2.2, 0.0, 4.5), C, 8, r2=0.0) if False else None
        E(box((0.3, 0.12, 0.55), (2.2, -0.9, 2.0), WIN), WIN)
        door(-0.5, -0.5, 0.2, 0.9, 1.2, arch=True)
        banner(0.7, -0.62, 1.2, '#c0453a', 1.0, 0.55); banner(-1.8, -0.62, 1.2, '#c0453a', 1.0, 0.55)
        flag(2.2, 0.0, 1.2, '#c0453a', z=4.5)
        for p in [(-2.6, -1.5), (-1.0, -1.9)]: rock(p[0], p[1], 0.3)
        bush(0.8, -1.8, 0.4)
    else:
        box((6.4, 1.6, 0.25), (0, 0, 0), STONE_D, bevel=0.03)
        box((5.8, 1.2, 2.2), (-0.3, 0, 0.25), ST, bevel=0.02)
        bricks(5.8, 1.2, 2.2, 0.25)
        box((6.0, 1.5, 0.2), (-0.3, 0, 2.45), STONE_L)
        for i in range(7):
            box((0.5, 0.3, 0.45), (-2.9 + i * 0.9, -0.6, 2.65), STONE_L)
        cyl(1.15, 4.4, (2.5, 0.0, 0.25), ST, 8, bevel=0.02)
        for z in (1.5, 3.0):
            E(box((0.3, 0.12, 0.6), (2.5, -1.1, z), WIN), WIN)
        cyl(1.4, 0.24, (2.5, 0.0, 4.65), STONE_L, 8)
        for i in range(8):
            if i % 2 == 0:
                a = math.radians(i * 45 + 22); box((0.5, 0.5, 0.5), (2.5 + math.cos(a) * 1.2, math.sin(a) * 1.2, 4.9), STONE_L)
        cyl(1.0, 0.0001, (2.5, 0, 4.9), STONE_D, 8)
        ballista(2.5, -0.2, 4.9, 1.5, -20)
        flag(2.5, 0.4, 1.4, '#c0453a', z=4.9, w=1.1)
        door(-0.6, -0.6, 0.25, 1.0, 1.4, arch=True)
        banner(1.0, -0.72, 1.4, '#c0453a', 1.2, 0.6); banner(-2.3, -0.72, 1.4, '#c0453a', 1.2, 0.6)
        # petite tour d'extremite gauche
        cyl(0.7, 3.0, (-3.4, 0.0, 0.25), ST, 8, bevel=0.02); cyl(0.9, 1.0, (-3.4, 0, 3.25), C, 8, r2=0.0)
        # fosse de pieux
        for i in range(6):
            cyl(0.07, 0.6, (-1.4 + i * 0.55, -1.6, 0.0), WOOD_D, 5, r2=0.0).rotation_euler = (math.radians(-18), 0, 0)
        rock(-2.6, -1.9, 0.3); rock(1.8, -2.0, 0.35)


# ================================================================== ECURIE
def ecurie(lv, C):
    if lv == 1:
        for sx in (-1, 1):
            cyl(0.1, 1.8, (sx * 1.6, 0.6, 0), WOOD_D, 6)
        box((3.6, 1.6, 0.1), (0, 0.4, 1.7), WOOD, (-8, 0, 0))
        prism(3.8, 1.8, 0.7, (0, 0.5, 1.7), C, ov=0.2)
        box((3.4, 0.2, 1.7), (0, 1.15, 0), WOOD_D)
        hay(-1.0, 0.3, 0, 0.6); hay(-0.3, 0.2, 0, 0.5); hay(-0.9, 0.3, 0.5, 0.5)
        horse(1.4, -0.9, 0, 0.9, 200)
        fence(-2.0, -1.4, 2.0, -1.4, 0.7, 6)
        fence(2.0, -1.4, 2.0, -0.2, 0.7, 2)
        sack(-1.9, -0.7, HAY, 0.28)
    elif lv == 2:
        W, D, wh, rh = 3.6, 3.0, 1.6, 1.3
        box((W + 0.2, D + 0.2, 0.2), (-0.8, 0.2, 0), STONE, bevel=0.02)
        box((W, D, wh), (-0.8, 0.2, 0.2), WOOD, bevel=0.02)
        planks(W, D, wh, 0.2 - D / 2, z=0.2)
        box((W + 0.1, 0.1, 0.12), (-0.8, 0.2 - D / 2, 0.2 + wh - 0.1), WOOD_D)
        prism(W, D, rh, (-0.8, 0.2, 0.2 + wh), C, ov=0.32)
        box((W + 0.8, 0.12, 0.12), (-0.8, 0.2, 0.2 + wh + rh), '#e8e0c8')
        # box a chevaux : demi-portes
        for x in (-1.9, -0.3):
            box((1.0, 0.1, 1.3), (x, 0.2 - D / 2 - 0.02, 0.2), WOOD_D); box((1.1, 0.12, 0.1), (x, 0.2 - D / 2 - 0.03, 0.9), WOOD_L)
        horse(-1.9, -0.9, 0.2, 0.0001, 0) if False else None
        pass
        hay(0.5, -1.3, 0.0, 0.0001) if False else None
        hay(1.4, 0.0, 0, 0.55) if False else None; hay(-3.0, -1.3, 0, 0.5)
        horse(2.6, -1.0, 0, 0.85, 200)
        fence(1.0, -2.0, 3.2, -2.0, 0.7, 4); fence(3.2, -2.0, 3.2, -0.4, 0.7, 3)
        lantern(-1.1, -1.35, 1.7, 0.14)
        sph(0.0001, (0, 0, 0), WOOD)
        cyl(0.05, 0.6, (-3.0, -1.5, 0), WOOD_D, 6); box((0.7, 0.07, 0.4), (-2.9, -1.5, 0.5), GOLDM)
        tree(-3.4, 1.4, 0.8)
    else:
        W, D, wh, rh = 5.4, 3.2, 2.0, 1.7
        box((W + 0.4, D + 0.4, 0.3), (-0.4, 0.2, 0), STONE_D, bevel=0.03)
        box((W, D, wh), (-0.4, 0.2, 0.3), WOOD, bevel=0.02)
        planks(W, D, wh, 0.2 - D / 2, z=0.3)
        box((W + 0.1, D + 0.1, 0.2), (-0.4, 0.2, 0.3 + wh), WOOD_D)
        prism(W - 0.2, D, rh, (-0.4, 0.2, 0.5 + wh), C, ov=0.4)
        box((W + 0.6, 0.15, 0.15), (-0.4, 0.2, 0.5 + wh + rh), '#e8e0cc')
        for x in (-2.2, -0.8, 0.6):
            box((1.0, 0.12, 1.5), (x, 0.2 - D / 2 - 0.02, 0.3), WOOD_D); box((1.1, 0.14, 0.1), (x, 0.2 - D / 2 - 0.04, 1.05), WOOD_L)
            box((0.9, 0.1, 0.9), (x, 0.2 - D / 2 - 0.04, 1.2), '#2a2038') if False else None
        horse(-2.9, -2.2, 0, 0.75, 20, '#e8e0cc', '#9a9ab0')
        # lucarne et girouette
        box((0.9, 0.7, 0.8), (-0.4, 0.2, 0.5 + wh + 0.7), WOOD_L, bevel=0.02); prism(1.0, 0.8, 0.5, (-0.4, 0.2, 0.5 + wh + 1.5), C)
        win(-0.4, -0.2, 0.5 + wh + 0.75, 0.4, 0.4)
        cyl(0.04, 0.9, (-0.4, 0.2, 0.5 + wh + rh), GOLDM, 5)
        poly([(0, 0), (0.7, 0.1), (0.5, -0.1), (0.0, -0.2)], 0.04, (-0.4, 0.2, 0.5 + wh + rh + 0.85), GOLDM)
        # enclos
        hay(2.9, 0.8, 0, 0.55); hay(2.9, 0.8, 0.45, 0.5); hay(3.4, 0.2, 0, 0.5)
        fence(1.0, -2.2, 3.8, -2.2, 0.75, 5); fence(3.8, -2.2, 3.8, -0.2, 0.75, 3)
        horse(2.9, -1.0, 0, 0.9, 200)
        horse(1.5, -1.9, 0, 0.55, 20, '#c0884a', '#5a3a22') if False else None
        lantern(-3.0, -1.5, 1.7, 0.15) if False else None
        barrel(-3.5, -1.6); box((1.0, 0.45, 0.3), (-2.4, -2.0, 0), WOOD, bevel=0.02)
        box((0.85, 0.35, 0.08), (-2.4, -2.0, 0.3), '#6fa8dc')


# ================================================================== SANCTUAIRE
def column(x, y, z, h, r=0.22, col=WHITE_S):
    cyl(r * 1.4, 0.18, (x, y, z), WHITE_SD, 8, bevel=0.01)
    cyl(r, h, (x, y, z + 0.18), col, 8)
    cyl(r * 1.4, 0.16, (x, y, z + 0.18 + h), WHITE_SL, 8, bevel=0.01)


def sanctuaire(lv, C):
    if lv == 1:
        cyl(1.9, 0.2, (0, 0, 0), WHITE_SD, 8, bevel=0.02)
        cyl(1.6, 0.2, (0, 0, 0.2), WHITE_S, 8, bevel=0.02)
        for sx in (-1, 1):
            for sy in (-1, 1):
                column(sx * 1.0, sy * 0.8, 0.4, 1.7, 0.18)
        pyramid(3.0, 2.4, 1.1, (0, 0, 2.55), WHITE_SL, top=0.1) if False else None
        box((2.8, 2.2, 0.2), (0, 0, 2.45), WHITE_S, bevel=0.02)
        prism(2.8, 2.2, 0.9, (0, 0, 2.65), GOLDM, ov=0.1)
        box((0.7, 0.7, 0.6), (0, 0, 0.4), WHITE_SL, bevel=0.03)
        shrine_star(0, -0.4, 1.35, 0.35)
        E(cyl(0.12, 1.5, (0, 0, 0.9), GLOW, 6, r2=0.0), GLOW) if False else None
        rock(2.0, -1.2, 0.25)
        for x in (-1.9, 1.8): E(sph(0.1, (x, -1.5, 0.5)), GLOW)
    elif lv == 2:
        cyl(2.6, 0.22, (0, 0, 0), WHITE_SD, 8, bevel=0.02)
        cyl(2.3, 0.22, (0, 0, 0.22), WHITE_S, 8, bevel=0.02)
        cyl(2.0, 0.2, (0, 0, 0.44), WHITE_SL, 8, bevel=0.02)
        for i in range(6):
            a = math.radians(i * 60 + 30)
            column(math.cos(a) * 1.5, math.sin(a) * 1.5 - 0.1, 0.64, 2.0, 0.2)
        cyl(1.85, 0.22, (0, 0, 2.98), WHITE_S, 6, rot=(0, 0, 0))
        cyl(1.8, 1.4, (0, 0, 3.2), GOLDM, 6, r2=0.25)
        shrine_star(0, -0.2, 4.9, 0.4)
        box((0.9, 0.9, 0.7), (0, 0.1, 0.64), WHITE_SL, bevel=0.03)
        shrine_star(0, -0.35, 1.55, 0.4)
        E(cyl(0.3, 2.0, (0, 0.1, 4.6), GLOW, 8, r2=0.12), '#fff7c8')
        for x, y in [(-3.0, -1.8), (3.0, -1.5)]:
            cyl(0.14, 0.9, (x, y, 0), WHITE_S, 6); E(sph(0.2, (x, y, 1.05), GLOW, 6, 5), GLOW)
        rock(3.2, 1.0, 0.3)
    else:
        cyl(3.2, 0.26, (0, 0, 0), WHITE_SD, 8, bevel=0.02)
        cyl(2.9, 0.26, (0, 0, 0.26), WHITE_S, 8, bevel=0.02)
        cyl(2.5, 0.24, (0, 0, 0.52), WHITE_SL, 8, bevel=0.02)
        for i in range(8):
            a = math.radians(i * 45 + 22.5)
            column(math.cos(a) * 1.95, math.sin(a) * 1.95 - 0.1, 0.76, 2.4, 0.22)
        cyl(2.3, 0.26, (0, 0, 3.54), WHITE_S, 8)
        torus(1.95, 0.4, (0, 0, 3.95), GOLDM, 8, 6)
        for i in range(8):
            a = math.radians(i * 45 + 22.5)
            rod3((math.cos(a) * 1.95, math.sin(a) * 1.95, 4.0), (math.cos(a) * 0.5, math.sin(a) * 0.5, 4.9), 0.07, GOLDM)
        shrine_star(0, 0, 7.0, 0.6)
        # autel + etoile + rayon
        box((1.1, 1.1, 0.8), (0, 0, 0.76), WHITE_SL, bevel=0.03)
        box((1.3, 1.3, 0.14), (0, 0, 1.56), GOLDM, bevel=0.02)
        shrine_star(0, -0.2, 2.0, 0.5)
        o = cyl(0.6, 4.8, (0, 0, 2.2), GLOW, 10, r2=0.45); E(o, '#fff7c8')
        E(cyl(0.28, 4.8, (0, 0, 2.2), '#ffffff', 8, r2=0.2), '#ffffff')
        for x, y in [(-3.6, -1.9), (3.6, -1.6), (-3.4, 1.6)]:
            cyl(0.16, 1.0, (x, y, 0), WHITE_S, 6); E(sph(0.24, (x, y, 1.15), GLOW, 6, 5), GLOW)
        for sx in (-1, 1):
            box((0.8, 0.5, 0.2), (sx * 1.0, -2.6, 0), WHITE_SD); box((0.7, 0.4, 0.2), (sx * 1.0, -2.6, 0.2), WHITE_S)
        rock(3.6, 1.2, 0.35)


FN = dict(taverne=taverne, mage=mage, chantier=chantier, remparts=remparts, ecurie=ecurie, sanctuaire=sanctuaire)
ROOF2 = {'taverne': '#c4682e', 'mage': '#5a3ad8', 'chantier': '#2f9ccf', 'remparts': '#7a4a6a', 'ecurie': '#9a5a2a', 'sanctuaire': '#f4e9b0'}


def build2(k, lv):
    reset_scene()
    C = ROOF2[k]
    FN[k](lv, C)
    ui_decor(k, lv)
    add_render('bld_%s_%d' % (k, lv), 54, 58, mode='fixed', ppu=PPU2.get((k, lv), PPUS[lv]), anchor=(27, 45), hide=['ui_only'], az=AZ, el=EL, t_light=0.90)
    add_render('bldui_%s_%d' % (k, lv), 160, 120, mode='fixed', ppu=UPPU2.get((k, lv), UPPU[lv]), anchor=(80, 74), az=AZ, el=EL, ss=3, t_light=0.90)
    finish_model('bld_%s_%d' % (k, lv))


if __name__ == '__main__':
    args = sys.argv[1:]
    ks = [a for a in args if a in NAMES2] or NAMES2
    lvs = [int(a) for a in args if a.isdigit()] or [1, 2, 3]
    for k in ks:
        for lv in lvs:
            build2(k, lv)
