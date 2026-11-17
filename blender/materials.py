"""materials.py - icones de craft/evolution 24x24 : mat_* (parchemins, tomes, pierres, materiaux, essences) + ui_enclume / ui_evolution 32x32."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *

STEEL, STEEL_D, STEEL_L = '#c9d2e0', '#8a93aa', '#eef2fa'
TIER = {  # couleur principale / sombre / claire par rarete (1..6 etoiles ; 5 rarete competence = or)
    1: ('#aab0c0', '#7a8096', '#e6e9f2'), 2: ('#4aa856', '#2f7a3c', '#8be08f'), 3: ('#4a8ae8', '#2e5ab0', '#8cc0ff'),
    4: ('#9a5ae0', '#6a34a8', '#c8a0ff'), 5: ('#ffcf4a', '#c08a20', '#fff0a0'), 6: ('#ff7ad9', '#c0489a', '#ffc0ee')}
RAINBOW = ['#ff5a5a', '#ffb84a', '#fff06a', '#6fdc6f', '#6fd3ff', '#c58bff']


def E(h):
    return mat(h, 1)


def B(size, at, m, rot=(0, 0, 0), bevel=0.03, center=False):
    return box(size, at, m, rot, bevel, center=center)


def C(r, h, at, m, n=10, r2=None, rot=(0, 0, 0), center=False, smooth=False):
    return cyl(r, h, at, m, n, r2, rot, 0.0, center=center, smooth=smooth)


def S(r, at, m, scale=(1, 1, 1), seg=10, rings=7):
    return sph(r, at, m, seg, rings, scale)


def Pl(pts, th, m, at=(0, 0, 0), rot=(0, 0, 0), bevel=0.02):
    return poly(pts, th, at, m, rot, bevel)


def sparkle(at, r, col='#ffffff', th=0.12):
    return Pl(star_pts(4, r, r * 0.22), th, E(col), at)


def rod(p0, p1, r, m, n=8, y=0.0):
    dx, dz = p1[0] - p0[0], p1[1] - p0[1]
    L = math.hypot(dx, dz)
    return C(r, L, (p0[0], y, p0[1]), m, n, rot=(0, math.degrees(math.atan2(dx, dz)), 0))


def render(key_, sz=24, az=12, el=28, **kw):
    kw.setdefault('t_light', 0.9)
    add_render(key_, sz, sz, mode='fit', az=az, el=el, ss=6, margin=1, **kw)


# ------------------------------------------------------------------ parchemins
def parchemin(t):
    c, d, l = TIER[t]
    paper = ['#e4e4ea', '#e4efd8', '#dce8f6', '#e8dcf2', '#f6ecc0', '#fbe6f4'][t - 1]
    papd = ['#a8a8b8', '#9fb888', '#98b0d0', '#b098cc', '#d0b878', '#d8a8c8'][t - 1]
    L = 3.0
    g = empty('scroll', (0, 0, 1.6), (0, -38, 0))     # tout le rouleau est incline
    def A(o):
        o.parent = g
        return o
    A(C(0.7, L, (-L / 2, 0, 0), paper, 12, rot=(0, 90, 0), smooth=True))
    A(B((L * 0.9, 0.5, 0.18), (0, 0.0, -0.62), papd, bevel=0.0, center=True)) if False else None
    for s_ in (-1, 1):
        x = s_ * (L / 2)
        A(C(0.58, 0.1, (x, 0, 0), papd, 12, rot=(0, 90, 0), center=True))
        A(C(0.3, 0.14, (x + s_ * 0.02, 0, 0), '#f2ead6', 10, rot=(0, 90, 0)))
    if t >= 3:
        capc = '#e0b040' if t >= 4 else '#a9744a'
        for s_ in (-1, 1):
            x = s_ * (L / 2 + 0.28)
            A(C(0.52, 0.45, (x, 0, 0), capc, 10, rot=(0, 90, 0), center=True))
            A(S(0.3, (x + s_ * 0.3, 0, 0), capc))
    if t >= 5:
        for s_ in (-1, 1):
            A(S(0.2, (s_ * (L / 2 + 0.75), 0, 0), E('#ff7ad9' if t == 6 else '#ff6a4a')))
    # ruban / ceinture
    if t >= 2:
        if t == 6:
            for i, rc in enumerate(RAINBOW[:5]):
                A(C(0.78, 0.13, (-0.34 + i * 0.17, 0, 0), E(rc), 12, rot=(0, 90, 0), center=True))
        else:
            A(C(0.78, 0.5 if t == 2 else 0.4, (0, 0, 0), c if t >= 3 else l, 12, rot=(0, 90, 0), center=True))
            if t >= 4:
                A(C(0.8, 0.12, (0, 0, 0), '#ffcf4a' if t == 5 else l, 12, rot=(0, 90, 0), center=True))
    # sceau de cire (face camera = -Y)
    A(C(0.62, 0.2, (0, -0.68, 0), d, 10, rot=(90, 0, 0), center=True))
    A(C(0.5, 0.22, (0, -0.74, 0), c if t != 6 else '#ff7ad9', 10, rot=(90, 0, 0), center=True))
    A(Pl(star_pts(5 if t > 1 else 4, 0.32, 0.14), 0.1, E(l) if t >= 5 else l, at=(0, -0.88, 0), rot=(0, 0, 0)))
    if t >= 4:
        rb = '#c0453a' if t in (4, 5) else '#6fd3ff'
        A(Pl([(-0.22, 0), (0.0, 0.3), (0.22, 0), (0.3, -1.0), (0.0, -0.75), (-0.3, -1.0)], 0.07, rb, at=(0.05, -0.95, -0.55), rot=(0, 38, 0)))
    if t >= 5:
        sparkle((-1.7, -0.9, 2.3), 0.55, '#fff0a0' if t == 5 else '#ffffff')
        sparkle((1.9, -0.9, 2.2), 0.38, '#fff0a0' if t == 5 else '#c8f0ff')
    if t == 6:
        sparkle((0.3, -0.9, 3.0), 0.45, '#ffffff')
        sparkle((2.0, -0.9, -0.9), 0.3, '#ffc0ee')
        sparkle((-2.0, -0.9, -0.6), 0.3, '#c8f0ff')
    render('mat_parchemin_%d' % t, el=22, az=6)


# ------------------------------------------------------------------ tomes
def tome(t):
    cov = {1: ('#8a90a4', '#5a6076', '#c0c6d6'), 2: ('#3f9a4c', '#2a6a34', '#8be08f'), 3: ('#3f70d0', '#2a4a90', '#8cc0ff'),
           4: ('#8a4ad0', '#5a2a90', '#c8a0ff'), 5: ('#e0a82a', '#a8741a', '#fff0a0')}[t]
    c, d, l = cov
    W, T, H = 2.0, 0.6, 2.7
    Z = H / 2 + 0.1
    GD = '#ffcf4a'
    def X(size, at, m, **kw):
        return B(size, (at[0], at[1], at[2] + Z), m, center=True, **kw)
    X((W, T, H), (0, 0, 0), '#f2ead6')
    X((W + 0.12, 0.13, H + 0.14), (0, -T / 2 - 0.0, 0), c, bevel=0.05)
    X((W + 0.12, 0.13, H + 0.14), (0, T / 2, 0), d, bevel=0.05)
    X((0.34, T + 0.14, H + 0.14), (-W / 2, 0, 0), d, bevel=0.05)
    fy = -T / 2 - 0.09
    for z in (-0.8, 0, 0.8):
        X((0.4, T + 0.2, 0.1), (-W / 2, 0, z), GD if t >= 2 else l, bevel=0.01)
    if t == 1:
        X((1.1, 0.05, 0.1), (0.1, fy - 0.02, 0.5), l, bevel=0)
        X((1.1, 0.05, 0.1), (0.1, fy - 0.02, 0.2), l, bevel=0)
        X((0.16, 0.05, 0.9), (0.55, fy - 0.03, -1.15), '#c0453a', bevel=0)
    if t >= 2:
        for sx in (-1, 1):
            for sz in (-1, 1):
                X((0.46, 0.07, 0.46), (0.12 + sx * 0.82, fy - 0.02, sz * (H / 2 - 0.12)), GD, bevel=0.01)
    if t == 2:
        X((1.2, 0.07, 0.12), (0.12, fy - 0.03, 0.2), GD, bevel=0)
        X((0.16, 0.05, 0.9), (0.6, fy - 0.03, -1.15), '#c0453a', bevel=0)
    if t >= 3:
        Pl([(0, 0.6), (0.55, 0), (0, -0.6), (-0.55, 0)], 0.1, GD, at=(0.12, fy - 0.05, Z + 0.15))
        Pl([(0, 0.42), (0.38, 0), (0, -0.42), (-0.38, 0)], 0.12, E(l), at=(0.12, fy - 0.07, Z + 0.15))
    if t >= 4:
        X((1.6, 0.07, 0.1), (0.12, fy - 0.03, 0.95), GD, bevel=0)
        X((1.6, 0.07, 0.1), (0.12, fy - 0.03, -0.65), GD, bevel=0)
        S(0.16, (0.12 + 1.05, fy - 0.1, Z + 0.15), E('#ffcf4a'))
    if t == 5:
        Pl(star_pts(5, 0.7, 0.3), 0.1, E('#fff0a0'), at=(0.12, fy - 0.12, Z + 0.15))
        sparkle((-0.5, -0.6, 3.7), 0.55, '#fff0a0')
        sparkle((1.6, -0.7, 3.1), 0.35, '#ffffff')
        sparkle((-1.7, -0.7, 2.5), 0.3, '#fff0a0')
    render('mat_tome_%d' % t, az=-24, el=24)


# ------------------------------------------------------------------ pierres d'eveil
def pierre(t):
    c, d, l = TIER[t]
    r = 1.15 + 0.05 * t
    hb = 1.5 * r
    base = '#e0b040'
    z0 = 0.15 + hb
    if t >= 4:
        torus(r * 0.98, 0.07, (0, 0, z0 + 0.02), base, 12, 4)
    C(r, hb, (0, 0, z0 - hb / 2), c, 6, r2=0.0, rot=(180, 0, 0), center=True)    # pavillon
    C(r, r * 0.55, (0, 0, z0 + r * 0.275), d if t != 6 else '#c0489a', 6, r2=r * 0.7, center=True)  # couronne
    C(r * 0.7, 0.05, (0, 0, z0 + r * 0.55), E(l), 6)      # table
    Pl([(-r * 0.7, 0.05), (-r * 0.2, 0.3), (-r * 0.15, -hb * 0.5), (-r * 0.55, -0.0)], 0.04, E(l), at=(0, -r * 0.88, z0 + 0.05)) if False else None
    if t == 6:
        for i, rc in enumerate(RAINBOW):
            a0 = math.radians(60 * i)
            B((0.34, 0.06, 0.6), (math.cos(a0 - 1.57) * 0.0 + (-0.8 + i * 0.32), -r * 0.62, z0 - 1.1), E(rc), bevel=0)
    elif t >= 2:
        B((0.3, 0.06, 0.55), (-0.5, -r * 0.7, z0 - 0.95), E(l), bevel=0)
    if t >= 3:
        sparkle((-1.45, -0.5, z0 + 1.0), 0.4 + 0.05 * t, '#ffffff')
    if t >= 4:
        sparkle((1.45, -0.5, z0 + 0.7), 0.32, '#ffffff' if t != 5 else '#fff0a0')
    if t >= 5:
        sparkle((0.2, -0.5, z0 + 1.7), 0.4, '#fff0a0' if t == 5 else '#ffffff')
        sparkle((-1.6, -0.5, z0 - 0.2), 0.25, '#fff0a0' if t == 5 else '#c8f0ff')
    if t == 6:
        sparkle((1.7, -0.5, z0 + 1.6), 0.28, '#ffc0ee')
    render('mat_pierre_%d' % t, az=8, el=14)


# ------------------------------------------------------------------ materiaux d'artisanat
def minerai():
    for (x, y, z, r, sc, col) in ((0, 0, 0.8, 1.1, (1.2, 1, 0.85), '#6f6a86'), (1.0, -0.5, 0.45, 0.65, (1.2, 1, 0.8), '#58546e'),
                                  (-0.95, -0.4, 0.45, 0.6, (1.1, 1, 0.8), '#7e7a98')):
        o = S(r, (x, y, z), col, sc, 6, 4)
        for p in o.data.polygons:
            p.use_smooth = False
    for (x, y, z) in ((0.2, -0.95, 1.0), (-0.5, -0.85, 0.7), (0.7, -0.8, 0.35), (-1.2, -0.8, 0.5), (0.6, -0.9, 1.15)):
        S(0.2, (x, y, z), '#d2603a', (1, 0.8, 1), 5, 4)
    S(0.14, (-0.2, -1.0, 1.2), E('#9fe0ff'), (1, 0.5, 1), 5, 3)
    render('mat_minerai', az=15, el=34)


def ingot(at, c, d, l, scale=1.0, y=0):
    s = scale
    Pl([(-1.1 * s, 0), (1.1 * s, 0), (0.8 * s, 0.7 * s), (-0.8 * s, 0.7 * s)], 0.9 * s, c, at=(at[0], y, at[2]))
    B((1.4 * s, 0.7 * s, 0.1 * s), (at[0], y - 0.0, at[2] + 0.69 * s), l, bevel=0.02, center=False).location.y = y
    B((0.06 * s, 0.94 * s, 0.5 * s), (at[0] - 0.95 * s, y, at[2] + 0.08 * s), d, bevel=0.0)


def lingot():
    ingot((0, 0, 0), '#a8aec0', '#6f7690', '#eef2fa', 1.0, 0.0)
    ingot((0, 0, 0.7), '#b4bacb', '#6f7690', '#ffffff', 0.7, 0.0)
    B((2.0, 0.9, 0.0001), (0, 0, 0), '#a8aec0') if False else None
    render('mat_lingot', az=18, el=32)


def mithril():
    c = '#9fd0f0'
    ingot((0, 0, 0), c, '#5a8ab8', '#e0f4ff', 1.0, 0.0)
    ingot((0, 0, 0.7), '#b0dcf8', '#5a8ab8', '#ffffff', 0.7, 0.0)
    B((1.2, 0.05, 0.12), (0, -0.46, 0.3), E('#6fd3ff'), bevel=0)
    sparkle((1.2, -0.5, 1.9), 0.4, '#ffffff')
    sparkle((-1.1, -0.5, 1.4), 0.25, '#c8f0ff')
    render('mat_mithril', az=18, el=32)


def cuir():
    b, bd, bl = '#a9744a', '#7a4a30', '#c98f5a'
    pts = [(-1.0, 1.1), (-0.5, 1.0), (0, 1.15), (0.5, 1.0), (1.0, 1.1), (1.3, 0.6), (0.9, 0.2), (1.15, -0.5), (0.8, -1.2), (0.3, -0.8), (0, -1.1),
           (-0.3, -0.8), (-0.8, -1.2), (-1.15, -0.5), (-0.9, 0.2), (-1.3, 0.6)]
    Pl(pts, 0.22, b, at=(0, 0, 0), rot=(-62, 0, 0), bevel=0.05)
    Pl([(x * 0.78, z * 0.78) for x, z in pts], 0.26, bl, at=(0, 0, 0), rot=(-62, 0, 0), bevel=0.04)
    for i in range(7):
        a = -0.7 + i * 0.23
        S(0.08, (a * 1.3, -0.5 - 0.0, 0.3), '#f2e6c9', (1, 1, 1), 4, 3)
    for (x, z) in ((-0.5, 0.4), (0.5, 0.4), (0, -0.4)):
        S(0.13, (x, -0.2, z * 0.6 + 0.1), bd)
    render('mat_cuir', az=0, el=55)


def tissu():
    c, d, l = '#4a6ab8', '#2e4a88', '#9cc0ff'
    C(0.9, 2.6, (-1.3, 0, 1.0), c, 14, rot=(0, 90, 0), smooth=True)
    for x in (-0.6, 0.35):
        C(0.93, 0.28, (x, 0, 1.0), l, 14, rot=(0, 90, 0), center=True).location.x = x
    for s_ in (-1, 1):
        C(0.5, 0.16, (s_ * 1.3, 0, 1.0), '#f2ead6', 10, rot=(0, 90, 0), center=True)
        C(0.2, 0.2, (s_ * 1.3, 0, 1.0), d, 8, rot=(0, 90, 0), center=True)
    B((2.4, 0.8, 0.12), (0, -1.0, 0.1), c, rot=(-12, 0, 0), bevel=0.0)
    B((2.4, 0.1, 0.1), (0, -1.43, 0.08), l, bevel=0.0)
    render('mat_tissu', az=10, el=26)


def bois():
    for i, (z, dx, col) in enumerate(((0, 0.0, '#8a4a30'), (0.55, 0.25, '#a65a3a'), (1.1, -0.2, '#8a4a30'))):
        B((2.6, 1.1, 0.5), (dx, 0, z), col, bevel=0.04)
        B((2.6, 0.04, 0.07), (dx, -0.55, z + 0.18), '#5a2e20', bevel=0.0)
        B((2.6, 0.04, 0.07), (dx, -0.55, z + 0.35), '#c98f5a', bevel=0.0) if False else None
        # tranche (cernes)
        C(0.22, 0.06, (dx + 1.3, 0, z + 0.25), '#e0b080', 8, rot=(0, 90, 0))
    B((0.4, 0.05, 0.4), (0.0, -0.58, 0.0), '#e0b040', bevel=0.0) if False else None
    for dx in (-0.5, 0.7):
        S(0.1, (dx, -0.56, 1.45), '#e0b040', (1, 0.4, 1), 6, 4)
    for x in (-0.85, 0.85):
        B((0.2, 1.14, 1.7), (x, 0, 0), '#e0b040', bevel=0.02)
    render('mat_bois', az=-30, el=38)


def cristal():
    c, d, l = '#6fd3ff', '#3a8ac0', '#d8f6ff'
    for (x, y, h, r, rz, col) in ((0, 0, 2.8, 0.62, 0, c), (-0.9, -0.1, 2.2, 0.4, 32, '#ff7ad9'), (0.9, -0.1, 2.0, 0.38, -34, '#c58bff')):
        o = C(r, h * 0.8, (x, y, 0.0), col, 6, r2=r * 0.7, rot=(0, rz, 0))
        t_ = C(r * 0.7, h * 0.35, (0, 0, 0), l if col == c else col, 6, r2=0.0)
        t_.parent = o
        t_.location = (0, 0, h * 0.8)
    sparkle((1.2, -0.7, 2.3), 0.4, '#ffffff')
    render('mat_cristal', az=10, el=22)


def emis(o, h):
    o.data.materials.clear(); o.data.materials.append(E(h)); return o


def croc():
    n = '#f2ead6'
    C(0.55, 1.1, (0, 0, 0), '#d8cdb0', 10, r2=0.5)
    o = C(0.5, 1.4, (0, 0, 1.0), n, 10, r2=0.28, rot=(0, 10, 0))
    o2 = C(0.28, 1.5, (0.25, 0, 2.35), n, 10, r2=0.0, rot=(0, 28, 0))
    B((0.09, 0.07, 1.6), (-0.15, -0.35, 0.6), '#ffffff', rot=(0, 8, 0), bevel=0).location.x = -0.18
    for z in (0.15, 0.6):
        C(0.58, 0.1, (0, 0, z), '#a9744a', 10)
    S(0.08, (0.15, -0.3, 0.0), '#d2603a')
    render('mat_croc', az=10, el=24, )


def noyau():
    S(1.0, (0, 0, 1.1), '#ff8a3a', (1, 1, 1), 14, 10)
    emis(S(0.62, (0, 0, 1.1), '#fff0a0', (1, 1, 1), 12, 8), '#fff0a0')
    emis(S(0.8, (0, -0.1, 1.1), '#ffb050', (1, 1, 1), 12, 8), '#ffb050') if False else None
    C(0.0001, 0, (0, 0, 0), '#000000') if False else None
    torus(1.25, 0.08, (0, 0, 1.1), '#6a4a6a', 20, 5, (90, 0, 0))
    torus(1.25, 0.08, (0, 0, 1.1), '#6a4a6a', 20, 5, (90, 0, 90))
    for a in range(0, 360, 90):
        r_ = math.radians(a + 45)
        C(0.12, 0.5, (math.cos(r_) * 1.2, -0.2 + math.sin(r_) * 0.0, 1.1 + math.sin(r_) * 1.2), '#ff5a2a', 4, r2=0.0, rot=(0, math.degrees(r_) - 90 - 90 + 90, 0)) if False else None
    sparkle((1.3, -0.8, 2.2), 0.35, '#ffffff')
    render('mat_noyau', az=0, el=20)


def poussiere():
    c = '#6a5ac0'
    S(1.1, (0, 0, 0.95), c, (1.0, 0.9, 0.95), 12, 9)
    S(0.55, (0, 0, 2.05), '#5a4aa8', (1, 0.9, 1), 10, 6)
    torus(0.45, 0.1, (0, 0, 1.85), '#ffcf4a', 12, 5)
    Pl([(-0.4, 0), (0, 0.35), (0.4, 0), (0.55, -0.45), (0, -0.2), (-0.55, -0.45)], 0.1, '#ffcf4a', at=(0, -0.55, 1.7)) if False else None
    Pl(star_pts(5, 0.4, 0.17), 0.08, E('#fff0a0'), at=(0, -0.98, 1.0))
    for (x, z, r) in ((-1.4, 2.4, 0.3), (1.3, 2.2, 0.38), (0.2, 3.0, 0.24), (1.7, 1.2, 0.2), (-1.6, 1.1, 0.2)):
        sparkle((x, -0.5, z), r, '#fff0a0')
    render('mat_poussiere', az=10, el=20)


EMBL = {
    'feu': [(0, 0.6), (0.38, 0.1), (0.2, -0.1), (0.3, -0.5), (0, -0.62), (-0.3, -0.5), (-0.38, 0.0), (-0.12, 0.2)],
    'glace': [(0, 0.6), (0.2, 0.2), (0.6, 0), (0.2, -0.2), (0, -0.6), (-0.2, -0.2), (-0.6, 0), (-0.2, 0.2)],
    'foudre': [(0.15, 0.65), (-0.35, -0.05), (0, -0.05), (-0.15, -0.65), (0.4, 0.1), (0.05, 0.1)],
    'nature': [(0, 0.62), (0.4, 0.2), (0.35, -0.3), (0, -0.62), (-0.35, -0.3), (-0.4, 0.2)],
    'sacre': star_pts(5, 0.65, 0.28),
    'ombre': None,
    'arcane': star_pts(4, 0.65, 0.18),
}


def essence(k):
    col = ELEM_COL[k]
    dk = '#' + ''.join('%02x' % int(int(col[i:i + 2], 16) * 0.55) for i in (1, 3, 5))
    gl = '#dff4ff'
    S(1.2, (0, 0, 1.15), col, (1, 1, 1), 14, 10)                       # fiole (liquide)
    S(1.25, (0, 0, 1.15), '#cfe6f0', (1, 1, 1), 14, 10) if False else None
    C(0.36, 0.8, (0, 0, 2.1), '#cfe6f0', 10)
    C(0.34, 0.55, (0, 0, 2.85), '#a9744a', 8, r2=0.4)
    torus(0.4, 0.08, (0, 0, 2.15), '#e0b040', 12, 5)
    torus(1.18, 0.07, (0, 0, 1.15), '#cfe6f0', 18, 4, (90, 0, 0)) if False else None
    S(0.17, (-0.65, -0.95, 1.75), E('#ffffff'), (1, 0.4, 1.4), 5, 4)
    pts = EMBL[k]
    if k == 'ombre':
        pts = None
        crescent(0.42, 60, 300, 0.4, (0, -1.15, 1.1), E('#e8e0ff'), 0.08, 14, rot=(0, 0, 0))
    else:
        Pl(pts, 0.1, E('#ffffff'), at=(0, -1.15, 1.05))
    render('mat_essence_' + k, az=8, el=20)


# ------------------------------------------------------------------ UI 32x32
def enclume():
    D, M, L = '#5a5f78', '#8a93aa', '#c9d2e0'
    B((2.6, 1.3, 0.35), (0, 0, 0), '#3a2c4a', bevel=0.04)
    B((1.7, 0.9, 0.6), (0, 0, 0.35), D, bevel=0.04)
    Pl([(-1.0, 0), (1.0, 0), (0.5, 0.45), (-0.5, 0.45)], 0.8, D, at=(0, 0, 0.9), bevel=0.02)
    B((2.2, 1.1, 0.5), (0, 0, 1.35), M, bevel=0.06)
    Pl([(1.1, 1.85), (2.6, 1.85), (1.1, 1.35)], 0.9, M, at=(0, 0, 0.0), bevel=0.04).location.z = 0
    B((1.9, 0.15, 0.12), (0, -0.52, 1.82), L, bevel=0.0)
    # marteau pose dessus
    rod((-0.9, 1.9), (0.3, 3.2), 0.1, '#a9744a', 8, -0.05)
    B((0.95, 0.6, 0.6), (0.25, -0.05, 3.1), '#8a93aa', rot=(0, -37, 0), bevel=0.05, center=True)
    B((0.2, 0.62, 0.62), (0.6, -0.05, 3.4), '#c9d2e0', rot=(0, -37, 0), bevel=0.02, center=True)
    sparkle((-1.4, -0.8, 2.3), 0.45, '#ffcf4a')
    sparkle((1.9, -0.8, 2.9), 0.3, '#ffffff')
    sparkle((-1.7, -0.8, 3.2), 0.25, '#ff8a3a')
    render('ui_enclume', sz=32, az=14, el=22)


def evolution():
    G1, G2 = '#ffcf4a', '#fff0a0'
    # gros etoile montante
    Pl(star_pts(5, 1.3, 0.58), 0.35, G1, at=(0, 0, 2.3), bevel=0.06)
    Pl(star_pts(5, 0.85, 0.38), 0.4, E(G2), at=(0, -0.03, 2.3), bevel=0.04)
    # fleche vers le haut
    Pl([(0, 1.0), (0.85, 0.15), (0.35, 0.15), (0.35, -0.95), (-0.35, -0.95), (-0.35, 0.15), (-0.85, 0.15)], 0.3, '#4de0c0', at=(0, 0, -0.2), bevel=0.05)
    Pl([(0, 0.7), (0.5, 0.15), (0.12, 0.15), (0.12, -0.6), (-0.12, -0.6), (-0.12, 0.15), (-0.5, 0.15)], 0.34, E('#b8fff0'), at=(0, -0.02, -0.15), bevel=0.02)
    # anneaux / etincelles
    sparkle((-1.9, -0.4, 3.3), 0.4, '#ff7ad9')
    sparkle((1.9, -0.4, 3.0), 0.32, '#ffffff')
    sparkle((-1.7, -0.4, 0.9), 0.28, '#6fd3ff')
    sparkle((1.7, -0.4, 0.7), 0.3, '#ff7ad9')
    render('ui_evolution', sz=32, az=0, el=8)


# ------------------------------------------------------------------ registre
JOBS = {}
for t in range(1, 7):
    JOBS['mat_parchemin_%d' % t] = (lambda t=t: parchemin(t))
    JOBS['mat_pierre_%d' % t] = (lambda t=t: pierre(t))
for t in range(1, 6):
    JOBS['mat_tome_%d' % t] = (lambda t=t: tome(t))
for k, fn in (('minerai', minerai), ('lingot', lingot), ('mithril', mithril), ('cuir', cuir), ('tissu', tissu), ('bois', bois),
              ('cristal', cristal), ('croc', croc), ('noyau', noyau), ('poussiere', poussiere)):
    JOBS['mat_' + k] = fn
for k in ELEM_COL:
    JOBS['mat_essence_' + k] = (lambda k=k: essence(k))
JOBS['ui_enclume'] = enclume
JOBS['ui_evolution'] = evolution

if __name__ == '__main__':
    only = sys.argv[1:]
    for k, fn in JOBS.items():
        if only and not any(k == o or k.startswith(o) for o in only):
            continue
        reset_scene()
        fn()
        finish_model(k)
