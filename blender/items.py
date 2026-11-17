"""items.py - 22 icones d'equipement 24x24 : item_<key>.png"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *

STEEL, STEEL_D, STEEL_L = '#c9d2e0', '#8a93aa', '#eef2fa'
LEATH, LEATH_L = '#7a4a30', '#a9744a'
RED, BLUE, PURP, GREEN, PINK, TEALC = '#c0453a', '#4a6ab8', '#8a5ac8', '#4aa856', '#ff7ad9', '#4de0c0'
G = {'o': None}


def P():  # objet parent courant
    return G['o']


def add(o):
    o.parent = G['o']
    return o


def rod(p0, p1, r, m, n=8, y=0.0):
    dx, dz = p1[0] - p0[0], p1[1] - p0[1]
    L = math.hypot(dx, dz)
    ang = math.degrees(math.atan2(dx, dz))
    return add(cyl(r, L, (p0[0], y, p0[1]), m, n, rot=(0, ang, 0)))


def Pl(pts, th, m, at=(0, 0, 0), bevel=0.02, rot=(0, 0, 0)):
    return add(poly(pts, th, at, m, rot, bevel))


def Bx(size, at, m, rot=(0, 0, 0), bevel=0.02, center=False):
    return add(box(size, at, m, rot, bevel, center=center))


def Sp(r, at, m, scale=(1, 1, 1), seg=10, rings=7):
    return add(sph(r, at, m, seg, rings, scale))


def emis(o, hexcol):
    o.data.materials.clear(); o.data.materials.append(mat(hexcol, 1))
    return o


def blade(w, L, m, at=(0, 0, 0), th=0.16, tip=0.5, rot=(0, 0, 0)):
    return Pl([(-w / 2, 0), (w / 2, 0), (w / 2, L - tip), (0, L), (-w / 2, L - tip)], th, m, at, 0.02, rot)


def sword():
    blade(0.34, 2.0, STEEL, (0, 0, 0.5), 0.14)
    blade(0.12, 1.8, STEEL_L, (0, -0.1, 0.55), 0.06, 0.3)
    Bx((1.0, 0.2, 0.18), (0, 0, 0.42), GOLDM)
    rod((0, 0.0), (0, 0.45), 0.1, LEATH)
    Sp(0.14, (0, 0, 0.0), GOLDM)


def axe():
    rod((0, 0), (0, 2.5), 0.1, WOOD)
    Pl([(0.05, 2.45), (0.95, 2.7), (1.1, 1.9), (0.7, 1.55), (0.05, 1.75)], 0.2, STEEL)
    Pl([(0.05, 2.3), (0.7, 2.45), (0.85, 1.95), (0.05, 1.9)], 0.12, STEEL_L, at=(0, -0.08, 0))
    Pl([(-0.05, 2.5), (-0.3, 2.55), (-0.3, 1.75), (-0.05, 1.8)], 0.18, STEEL_D)
    Sp(0.13, (0, 0, 0), GOLDM)


def spear():
    rod((0, 0), (0, 2.6), 0.07, WOOD)
    blade(0.42, 0.9, STEEL, (0, 0, 2.15), 0.12, 0.35)
    Bx((0.2, 0.2, 0.12), (0, 0, 2.1), GOLDM)
    Pl([(0.05, 1.95), (0.7, 1.8), (0.55, 1.65), (0.7, 1.5), (0.05, 1.6)], 0.05, RED)


def shield():
    pts = [(-0.95, 1.1), (0.95, 1.1), (0.95, 0.1), (0.0, -1.2), (-0.95, 0.1)]
    Pl(pts, 0.22, GOLDM)
    Pl([(x * 0.8, z * 0.8 + 0.1) for x, z in pts], 0.3, RED, at=(0, 0.0, 0))
    Pl([(-0.12, 0.95), (0.12, 0.95), (0.12, -0.9), (-0.12, -0.9)], 0.34, CREAM) if False else None
    Pl([(-0.7, 0.55), (0.7, 0.55), (0.7, 0.35), (-0.7, 0.35)], 0.34, CREAM) if False else None
    Sp(0.3, (0, -0.15, 0.3), GOLDM, (1, 0.6, 1))
    Pl(star_pts(4, 0.28, 0.08), 0.1, GOLDM, at=(0, -0.2, 0.3)) if False else None


def daggers():
    for s_ in (-1, 1):
        g = empty('d', (0, 0, 0), (0, 40 * s_, 0)); G['o'] = g
        blade(0.3, 1.5, STEEL, (0, 0, 0.45), 0.12, 0.4)
        blade(0.1, 1.3, STEEL_L, (0, -0.08, 0.5), 0.05, 0.3)
        Bx((0.7, 0.16, 0.14), (0, 0, 0.38), GOLDM)
        rod((0, 0.0), (0, 0.38), 0.09, LEATH if s_ > 0 else PURP)
        Sp(0.11, (0, 0, 0), GOLDM)
        G['o'] = None
    G['o'] = None


def bow():
    add(crescent(1.35, -62, 62, 0.28, (-0.9, 0, 0), WOOD, 0.2, 20, name='bow', taper=0.5))
    add(crescent(1.35, -62, 62, 0.08, (-0.9, 0, 0), WOOD_L, 0.22, 20, name='bow2', taper=0.4)) if False else None
    p = 1.35
    top = (-0.9 + math.cos(math.radians(62)) * p, math.sin(math.radians(62)) * p)
    bot = (top[0], -top[1])
    rod(bot, top, 0.045, CREAM, 5)
    rod((-1.0, 0.0), (1.4, 0.0), 0.06, LEATH_L, 6)
    Pl([(1.4, -0.22), (1.75, 0), (1.4, 0.22)], 0.08, STEEL)
    Pl([(-1.0, 0), (-1.3, 0.25), (-1.3, 0.0), (-1.3, -0.25)], 0.05, RED)


def crossbow():
    Bx((2.0, 0.3, 0.3), (-1.0, 0, -0.15), WOOD, bevel=0.03)
    Bx((0.5, 0.34, 0.45), (-1.1, 0, -0.3), WOOD_D)
    add(crescent(1.2, -70, 70, 0.28, (0.2, 0, 0), WOOD_D, 0.24, 18, rot=(0, 0, 0), name='cb', taper=0.5)).rotation_euler = (0, 0, 0)
    rod((0.2 + math.cos(math.radians(70)) * 1.2, -math.sin(math.radians(70)) * 1.2), (0.2 + math.cos(math.radians(70)) * 1.2, math.sin(math.radians(70)) * 1.2), 0.04, CREAM, 5)
    rod((-0.6, 0.12), (0.9, 0.12), 0.05, STEEL, 6)
    Pl([(0.9, 0.0), (1.2, 0.12), (0.9, 0.24)], 0.08, STEEL)


def staff():
    rod((0, 0), (0, 2.5), 0.1, WOOD)
    Sp(0.38, (0, 0, 2.95), TEALC, (1, 1, 1), 12, 8)
    emis(Sp(0.2, (0, 0, 2.95), '#d8fff4'), '#d8fff4')
    add(torus(0.34, 0.07, (0, 0, 2.95), GOLDM, 14, 5, (90, 0, 0)))
    for s_ in (-1, 1):
        Pl([(0.0, 2.35), (0.4 * s_, 2.55), (0.5 * s_, 3.2), (0.18 * s_, 2.7), (0.1 * s_, 2.4)], 0.12, GOLDM)
    Sp(0.12, (0, 0, 0), GOLDM)


def grimoire():
    Bx((1.7, 0.55, 2.2), (0, 0, -1.1), PURP, bevel=0.06)
    Bx((1.55, 0.4, 2.05), (0.06, -0.0, -1.02), CREAM, bevel=0.03).location.y = 0.12
    Bx((1.7, 0.6, 2.2), (0, -0.3, -1.1), PURP, bevel=0.06).scale = (1, 0.18, 1)
    Bx((0.2, 0.64, 2.24), (-0.8, 0, -1.12), '#6a3aa8')
    Pl(star_pts(5, 0.38, 0.17), 0.1, GOLDM, at=(0.05, -0.38, -0.3))
    Bx((0.3, 0.1, 0.4), (0.82, -0.3, -0.3), GOLDM)
    for z in (-1.9, -0.45):
        Bx((0.3, 0.64, 0.3), (-0.78, 0, z), GOLDM) if False else None
    G['o'].rotation_euler = (math.radians(-8), 0, math.radians(32))


def sceptre():
    rod((0, 0), (0, 2.5), 0.1, GOLDM)
    for z in (0.3, 1.2):
        Sp(0.15, (0, 0, z), GOLDM, (1, 1, 0.7))
    emis(Sp(0.42, (0, 0, 2.9), PINK, (1, 1, 1.15), 4, 3), PINK)
    for s_ in (-1, 1):
        Pl([(0, 2.55), (0.45 * s_, 2.65), (0.6 * s_, 3.25), (0.28 * s_, 2.95), (0.12 * s_, 2.7)], 0.1, GOLDM)
    Sp(0.13, (0, 0, 0), GOLDM)


def relic():
    cyl(0.55, 0.14, (0, 0, -1.2), GOLDM, 10, bevel=0.02).parent = G['o']
    rod((0, -1.1), (0, -0.2), 0.14, GOLDM)
    Sp(0.22, (0, 0, -0.6), GOLDM, (1.2, 1.2, 0.8))
    cyl(0.45, 1.0, (0, 0, -0.2), GOLDM, 14, r2=0.95, bevel=0.02).parent = G['o']
    add(torus(0.95, 0.1, (0, 0, 0.8), GOLDM, 16, 5))
    emis(Sp(0.3, (0, -0.55, 0.3), TEALC, (1, 0.6, 1.2), 6, 4), TEALC)
    for i, a in enumerate((0, 90, 180, 270)):
        emis(Sp(0.08, (0.62 * math.cos(math.radians(a + 45)), -0.0 - 0.45, 0.28 + 0.0), '#ff7ad9', (1, 1, 1), 5, 3), '#ff7ad9') if False else None


def lute():
    Sp(0.85, (0, 0, -0.75), WOOD_L, (1, 0.5, 1.15), 14, 9)
    cyl(0.28, 0.1, (0, -0.2, -0.75), DARK, 10, rot=(90, 0, 0)).parent = G['o']
    Bx((0.26, 0.14, 1.6), (0, 0, 0.0), LEATH, bevel=0.02)
    Pl([(-0.22, 1.55), (0.22, 1.55), (0.22, 1.95), (-0.22, 1.95)], 0.18, WOOD_D, (0, 0, 0))
    for x in (-0.1, 0.1):
        rod((x, -0.6), (x, 1.5), 0.03, CREAM, 4, y=-0.1)
    Sp(0.07, (-0.28, 0, 1.75), GOLDM); Sp(0.07, (0.28, 0, 1.75), GOLDM)


def banner():
    rod((0, -1.2), (0, 2.5), 0.07, WOOD, 6)
    Sp(0.13, (0, 0, 2.55), GOLDM)
    Pl([(0.05, 2.3), (1.45, 2.3), (1.45, 0.7), (0.75, 0.2), (0.05, 0.7)], 0.1, RED)
    Pl([(0.05, 2.3), (1.45, 2.3), (1.45, 2.1), (0.05, 2.1)], 0.14, GOLDM)
    Pl(star_pts(5, 0.4, 0.17), 0.14, GOLDM, at=(0.75, -0.04, 1.45))


def armor_l():
    Pl([(-0.7, 1.2), (-0.35, 1.3), (0, 1.0), (0.35, 1.3), (0.7, 1.2), (0.85, 0.2), (0.6, -0.3), (0.6, -1.2), (-0.6, -1.2), (-0.6, -0.3), (-0.85, 0.2)], 0.3, LEATH_L)
    Pl([(-0.35, 1.3), (0, 1.0), (0.35, 1.3), (0.2, 1.3), (0, 1.1), (-0.2, 1.3)], 0.34, LEATH)
    Bx((1.3, 0.34, 0.16), (0, 0, -0.6), LEATH, center=True)
    Bx((0.3, 0.38, 0.3), (0, 0, -0.6), GOLDM, center=True)
    for x in (-0.3, 0.3):
        Bx((0.1, 0.34, 1.2), (x, 0, 0.0), LEATH, center=True) if False else None
    Pl([(-0.12, 0.8), (0.12, 0.8), (0.12, -0.3), (-0.12, -0.3)], 0.36, LEATH)


def armor_h():
    Pl([(-0.75, 1.0), (-0.3, 1.15), (0.3, 1.15), (0.75, 1.0), (0.8, 0.0), (0.6, -0.9), (0.4, -1.25), (-0.4, -1.25), (-0.6, -0.9), (-0.8, 0.0)], 0.4, STEEL)
    Pl([(-0.5, 0.9), (0.5, 0.9), (0.55, 0), (0.4, -0.8), (-0.4, -0.8), (-0.55, 0)], 0.46, STEEL_D)
    for s_ in (-1, 1):
        Sp(0.5, (0.95 * s_, 0, 0.95), STEEL, (1, 0.8, 0.8))
        Sp(0.3, (0.95 * s_, -0.2, 1.05), RED, (1, 0.5, 0.6), 8, 5) if False else None
    Pl([(-0.12, 0.9), (0.12, 0.9), (0.12, -1.0), (-0.12, -1.0)], 0.5, RED)
    Pl([(-0.5, 0.2), (0.5, 0.2), (0.5, 0.0), (-0.5, 0.0)], 0.5, RED) if False else None
    Bx((0.9, 0.52, 0.16), (0, 0, -0.55), GOLDM, center=True)


def robe():
    Pl([(-0.45, 1.3), (0.45, 1.3), (0.7, 0.8), (1.05, 0.3), (0.9, 0.05), (0.55, 0.2), (0.85, -1.3), (-0.85, -1.3), (-0.55, 0.2), (-0.9, 0.05), (-1.05, 0.3), (-0.7, 0.8)], 0.3, PURP)
    Pl([(-0.45, 1.3), (0.45, 1.3), (0.0, 0.7)], 0.34, '#6a3aa8')
    Pl([(-0.85, -1.0), (0.85, -1.0), (0.85, -1.3), (-0.85, -1.3)], 0.34, GOLDM)
    Bx((1.2, 0.34, 0.15), (0, 0, -0.35), GOLDM, center=True)
    Pl(star_pts(5, 0.28, 0.12), 0.34, GOLDM, at=(0, -0.02, 0.35))


def potion(liq, shine, sym):
    cyl(0.9, 1.35, (0, 0, -1.3), '#cfe6f0', 14, bevel=0.03, smooth=True) if False else None
    Sp(0.95, (0, 0, -0.45), liq, (1, 0.8, 1), 14, 10)
    add(torus(0.3, 0.06, (0, 0, 0.35), '#ffffff', 10, 5))
    cyl(0.26, 0.7, (0, 0, 0.25), '#d8eef8', 10).parent = G['o']
    cyl(0.31, 0.18, (0, 0, 0.9), '#d8eef8', 10).parent = G['o']
    cyl(0.24, 0.35, (0, 0, 1.05), WOOD, 10, r2=0.2).parent = G['o']
    Pl(sym, 0.1, shine, at=(0, -0.7, -0.45))
    Sp(0.12, (-0.45, -0.55, -0.1), '#ffffff', (1, 0.6, 1.4), 6, 4)


def potion_h():
    potion('#e04a4a', CREAM, [(-0.1, 0.4), (0.1, 0.4), (0.1, 0.1), (0.4, 0.1), (0.4, -0.1), (0.1, -0.1), (0.1, -0.4), (-0.1, -0.4), (-0.1, -0.1), (-0.4, -0.1), (-0.4, 0.1), (-0.1, 0.1)])


def potion_e():
    potion('#3a90e0', '#ffe27a', [(0.12, 0.45), (-0.25, -0.02), (0.0, -0.02), (-0.12, -0.45), (0.28, 0.1), (0.03, 0.1)])


def torch():
    rod((0, -1.3), (0, 1.0), 0.17, WOOD, 8)
    cyl(0.25, 0.5, (0, 0, 0.8), LEATH, 8, r2=0.2).parent = G['o']
    emis(cyl(0.48, 1.4, (0, 0, 1.0), FIRE, 8, r2=0.0, smooth=True), FIRE).parent = G['o']
    emis(cyl(0.3, 0.95, (0, -0.0, 1.0), '#ffcf4a', 8, r2=0.0), '#ffcf4a').parent = G['o']
    emis(cyl(0.14, 0.5, (0, -0.05, 1.0), '#fff4c0', 8, r2=0.0), '#fff4c0').parent = G['o']


def pickaxe():
    rod((0, -1.5), (0, 1.3), 0.12, WOOD)
    add(crescent(1.2, 20, 160, 0.4, (0, 0, 0.1), STEEL, 0.22, 16, name='pk', taper=0.5))
    Bx((0.4, 0.28, 0.4), (0, 0, 1.15), STEEL_D, center=True)


def key():
    add(torus(0.42, 0.14, (0, 0, 1.5), GOLDM, 14, 6, (90, 0, 0)))
    rod((0, -1.2), (0, 1.1), 0.14, GOLDM)
    for z, l in ((-1.2, 0.55), (-0.8, 0.45), (-0.4, 0.35)):
        Bx((l, 0.2, 0.22), (l / 2, 0, z + 0.1), GOLDM, center=True)
    Sp(0.12, (0, 0, 1.5), '#ff7ad9') if False else None


def rope():
    for i, (R, z) in enumerate([(0.95, 0.0), (0.95, 0.3), (0.95, 0.6), (0.62, 0.0), (0.62, 0.3), (0.62, 0.6)]):
        add(torus(R, 0.17, (0, 0, z + 0.2), '#d9b070' if i % 2 == 0 else '#b88c50', 16, 6, (0, 0, 0)))
    for t in range(6):
        a = math.radians(30 + 60 * t)
        Bx((0.1, 0.1, 0.1), (math.cos(a) * 0.95, math.sin(a) * 0.95, 0.66), '#8a6a3a', center=True) if False else None
    add(torus(0.3, 0.17, (0, 0, 0.4), '#b88c50', 10, 6))
    rod((0.95, 0.0), (1.6, -0.9), 0.15, '#d9b070', 6)
    Sp(0.17, (1.6, -0.9, 0), '#b88c50', (1, 1, 1), 6, 4) if False else None


def cape():
    # cape a capuche : drape bordeaux, capuche pointue, fermoir dore
    Pl([(-0.55, 1.1), (0.55, 1.1), (0.95, 0.3), (1.15, -1.3), (0.0, -1.0), (-1.15, -1.3), (-0.95, 0.3)], 0.3, '#7a2a5a')
    Pl([(-0.3, -0.2), (0.3, -0.2), (0.45, -1.0), (0.0, -0.8), (-0.45, -1.0)], 0.34, '#a8407a')
    Pl([(-0.6, 1.0), (0.0, 1.75), (0.6, 1.0), (0.0, 0.3)], 0.42, '#5a1a40')
    Pl([(-0.25, 1.0), (0.0, 1.3), (0.25, 1.0), (0.0, 0.6)], 0.46, DARK)
    Pl([(-1.15, -1.3), (1.15, -1.3), (1.1, -1.05), (-1.1, -1.05)], 0.34, GOLDM)
    Sp(0.2, (0, -0.25, 0.28), GOLDM)


def compass():
    add(cyl(1.15, 0.3, (0, 0, -0.15), GOLDM, 20, rot=(90, 0, 0), bevel=0.03))
    add(cyl(0.95, 0.34, (0, -0.02, -0.15), CREAM, 20, rot=(90, 0, 0)))
    add(torus(1.05, 0.1, (0, -0.2, -0.15), GOLDM, 20, 5, (90, 0, 0)))
    add(cyl(0.28, 0.2, (0, 0, 1.0), GOLDM, 8, rot=(90, 0, 0)))
    add(torus(0.3, 0.08, (0, 0, 1.4), GOLDM, 10, 5, (90, 0, 0)))
    Pl([(-0.26, -0.15), (0, 0.95), (0.26, -0.15)], 0.16, RED, at=(0, -0.3, -0.15))
    Pl([(-0.26, -0.15), (0, -1.25), (0.26, -0.15)], 0.16, '#4a6ab8', at=(0, -0.3, 0.0))
    for a in (0, 90, 180, 270):
        r_ = math.radians(a)
        Bx((0.12, 0.1, 0.2), (math.sin(r_) * 0.82, -0.25, math.cos(r_) * 0.82 - 0.15), '#3a2c4a', center=True)
    Sp(0.14, (0, -0.4, -0.15), GOLDM)
    G['o'].rotation_euler = (0, math.radians(-20), 0)


def armor_c():
    # gilet de cuir : bretelles, lacet central, rivets, ceinture sombre
    Pl([(-0.75, 1.2), (-0.3, 1.3), (0, 0.95), (0.3, 1.3), (0.75, 1.2), (0.95, 0.4), (0.7, -0.2), (0.7, -1.25), (-0.7, -1.25), (-0.7, -0.2), (-0.95, 0.4)], 0.3, '#8a5a3a')
    Pl([(-0.3, 1.3), (0, 0.95), (0.3, 1.3), (0.55, 1.25), (0.15, 0.6), (-0.15, 0.6), (-0.55, 1.25)], 0.36, '#c98f5a')
    Pl([(-0.7, -0.45), (0.7, -0.45), (0.7, -0.8), (-0.7, -0.8)], 0.36, '#4a2c20')
    Bx((0.34, 0.4, 0.3), (0, 0, -0.62), GOLDM, center=True)
    for z in (0.3, -0.05):
        Pl([(-0.3, z + 0.12), (0.3, z + 0.12), (0.3, z), (-0.3, z)], 0.38, CREAM)
    for x in (-0.55, 0.55):
        for z in (0.8, 0.2):
            Sp(0.1, (x, -0.2, z), GOLDM)
    Pl([(-0.05, 0.55), (0.05, 0.55), (0.05, -0.4), (-0.05, -0.4)], 0.4, '#4a2c20')


def hourglass():
    SAND = '#ffcf4a'
    for z in (-1.55, 1.55):
        cyl(0.95, 0.22, (0, 0, z - 0.1), WOOD, 8, bevel=0.02)
    for a in (45, 135, 225, 315):
        r_ = math.radians(a)
        cyl(0.09, 3.0, (math.cos(r_) * 0.78, math.sin(r_) * 0.78, -1.4), WOOD_D, 6)
    cyl(0.78, 1.45, (0, 0, 0.05), '#cfe6f0', 12, r2=0.1)
    cyl(0.78, 1.45, (0, 0, -1.5), '#cfe6f0', 12, r2=0.1, rot=(180, 0, 0)).location.z = -0.05
    emis(cyl(0.6, 0.95, (0, 0, -1.45), SAND, 10, r2=0.5), SAND)
    emis(cyl(0.45, 0.8, (0, 0, 0.25), SAND, 10, r2=0.05), SAND)
    emis(cyl(0.05, 0.4, (0, 0, -0.3), SAND, 6), SAND)

ITEMS = {  # cle: (fonction, rotation_roll_Y, az, el, ss)
    'epee': (sword, 45), 'hache': (axe, 40), 'lance': (spear, 45), 'bouclier': (shield, 0), 'dagues': (daggers, 0),
    'arc': (bow, 35), 'arbalete': (crossbow, 30), 'baton': (staff, 40), 'grimoire': (grimoire, 0),
    'sceptre': (sceptre, 40), 'relique': (relic, 0), 'luth': (lute, 40), 'etendard': (banner, 0),
    'armure_legere': (armor_l, 0), 'armure_lourde': (armor_h, 0), 'robe': (robe, 0),
    'potion_soin': (potion_h, 0), 'potion_energie': (potion_e, 0), 'torche': (torch, 35),
    'pioche': (pickaxe, 40), 'armure_cuir': (armor_c, 0), 'cape': (cape, 0), 'potion': (potion_h, 0),
    'elixir': (potion_e, 0), 'boussole': (compass, 0), 'sablier': (hourglass, 0), 'cle': (key, 45), 'rope': (rope, 0), 'corde': (rope, 0)}


def build(k):
    reset_scene()
    fn, roll = ITEMS[k]
    g = empty('item_' + k, (0, 0, 0), (0, roll, 0))
    G['o'] = g
    fn()
    G['o'] = None
    el = 28 if k not in ('corde',) else 55
    add_render('item_' + k, 24, 24, mode='fit', az=12, el=el, ss=6, margin=1, t_light=0.9)
    finish_model('item_' + k)


if __name__ == '__main__':
    ks = sys.argv[1:] or [k for k in ITEMS if k != 'rope']
    for k in ks:
        build(k)
