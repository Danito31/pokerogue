"""iconlib.py - bibliotheque d'emblemes parametriques (arcs, eclats, boucliers, orbes, armes, outils...) + rendu Blender.

Repere : le canevas de l'icone est le carre [-1,1]x[-1,1] (x droite, z haut). Chaque forme est un polygone 2D extrude (poly()),
empile vers la camera (axe -Y). Deux familles de materiaux :
  * solide  (e=False) : ombrage toon 3 teintes a partir de la passe d'ombrage (biseau + ombres portees) ;
  * lumineux (e=True) : teinte plate (effets : arcs, eclats, flammes...), empiles en 3-4 couches (bord sombre -> coeur blanc).
Rendu : camera orthographique de face, 2 passes Cycles (albedo + ombrage), pixelisation, contour 1 px #1d1430.
"""
import sys, os, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *

C = {'y': 0.0, 'xf': (1, 0, 0, 1, 0, 0), 'solid': set(), 'emit': set(), 'n': 0}
WHITE = '#ffffff'
DK = '#2a2040'


# ------------------------------------------------------------------ couleurs
def hx(rgb):
    return '#%02x%02x%02x' % tuple(max(0, min(255, int(round(v)))) for v in rgb)


def mix(a, b, t):
    A, B = h2rgb(a), h2rgb(b)
    return hx([A[i] + (B[i] - A[i]) * t for i in range(3)])


def pal(base, white=WHITE):
    """(sombre, moyen, clair, blanc) pour un effet lumineux."""
    return (mix(mix(base, '#1d1040', .6), base, .05), base, mix(base, white, .58), white)


def shade(base, k):  # k<0 assombrit (vers violet sombre), k>0 eclaircit
    return mix(base, '#2a1850', -k) if k < 0 else mix(base, WHITE, k)


# ------------------------------------------------------------------ transformation 2D
class xf:
    """with xf(rot=deg, s=echelle, dx, dz, flip=bool): applique une similitude aux formes dessinees dans le bloc."""
    def __init__(s, rot=0, s_=1, dx=0, dz=0, flip=False, **k):
        s.rot, s.sc, s.dx, s.dz, s.flip = rot, k.get('s', s_), dx, dz, flip

    def __enter__(s):
        s.old = C['xf']
        a = math.radians(s.rot)
        c, sn = math.cos(a) * s.sc, math.sin(a) * s.sc
        fx = -1 if s.flip else 1
        a0, b0, c0, d0, e0, f0 = (c * fx, sn * fx, -sn, c, s.dx, s.dz)
        A, B, Cc, D, E, F = s.old
        C['xf'] = (A * a0 + Cc * b0, B * a0 + D * b0, A * c0 + Cc * d0, B * c0 + D * d0,
                   A * e0 + Cc * f0 + E, B * e0 + D * f0 + F)

    def __exit__(s, *a):
        C['xf'] = s.old


def T(p):
    A, B, Cc, D, E, F = C['xf']
    return (A * p[0] + Cc * p[1] + E, B * p[0] + D * p[1] + F)


def M(col, emit=False):
    if emit:
        if col in C['solid']:
            r, g, b = h2rgb(col)
            col = '#%02x%02x%02x' % (r ^ 1, g, b)
        C['emit'].add(col)
    else:
        if col in C['emit']:
            r, g, b = h2rgb(col)
            col = '#%02x%02x%02x' % (r ^ 2, g, b)
        C['solid'].add(col)
    return mat(col, 1.0 if emit else 0.0)


# ------------------------------------------------------------------ primitives
def clean(pts):
    out = []
    for p in pts:
        if not out or math.hypot(p[0] - out[-1][0], p[1] - out[-1][1]) > 1e-3:
            out.append(p)
    if len(out) > 1 and math.hypot(out[0][0] - out[-1][0], out[0][1] - out[-1][1]) < 1e-3:
        out.pop()
    return out


def fill(pts, col, e=False, th=0.05, bv=0.035, step=0.06, nolayer=False):
    """polygone rempli (coordonnees locales, transformees par xf)."""
    P = clean([T(p) for p in pts])
    if len(P) < 3:
        return None
    o = poly(P, th, (0, C['y'], 0), M(col, e), (0, 0, 0), 0 if e else bv, name='p%d' % C['n'])
    C['n'] += 1
    if not nolayer:
        C['y'] -= step
    return o


def lay(d=0.06):
    C['y'] -= d


def ngon(cx, cz, rx, rz=None, n=24, rot=0):
    rz = rx if rz is None else rz
    return [(cx + rx * math.cos(math.radians(rot + 360 * i / n)), cz + rz * math.sin(math.radians(rot + 360 * i / n))) for i in range(n)]


def star(cx, cz, n, r1, r2, rot=90):
    return [(cx + (r1 if i % 2 == 0 else r2) * math.cos(math.radians(rot + 180 * i / n)),
             cz + (r1 if i % 2 == 0 else r2) * math.sin(math.radians(rot + 180 * i / n))) for i in range(2 * n)]


def rect(cx, cz, w, h, rot=0):
    c, s = math.cos(math.radians(rot)), math.sin(math.radians(rot))
    return [(cx + x * c - z * s, cz + x * s + z * c) for x, z in ((-w / 2, -h / 2), (w / 2, -h / 2), (w / 2, h / 2), (-w / 2, h / 2))]


def arcpath(cx, cz, r, a0, a1, n=20, rz=None):
    rz = r if rz is None else rz
    return [(cx + r * math.cos(math.radians(a0 + (a1 - a0) * i / n)), cz + rz * math.sin(math.radians(a0 + (a1 - a0) * i / n))) for i in range(n + 1)]


def stroke(path, w0, w1=None, prof=None):
    """polygone d'un trait epais le long d'un chemin. largeur w0->w1 (ou prof(t))."""
    path = clean(path)
    n = len(path)
    Lp, Rp = [], []
    for i in range(n):
        p, a, b = path[i], path[max(i - 1, 0)], path[min(i + 1, n - 1)]
        dx, dz = b[0] - a[0], b[1] - a[1]
        l = math.hypot(dx, dz) or 1
        nx, nz = -dz / l, dx / l
        t = i / max(n - 1, 1)
        w = (prof(t) if prof else (w0 + ((w0 if w1 is None else w1) - w0) * t)) / 2
        w = max(w, 0.004)
        Lp.append((p[0] + nx * w, p[1] + nz * w))
        Rp.append((p[0] - nx * w, p[1] - nz * w))
    return Lp + Rp[::-1]


def seg(x0, z0, x1, z1, w0, w1=None):
    return stroke([(x0, z0), (x1, z1)], w0, w1)


def sm(t, p=1.0):
    return max(0.0, math.sin(math.pi * t)) ** p


# ------------------------------------------------------------------ effets lumineux (couches)
def glow(pts, pl, shrink=(1, .7, .42, .18), off=(0, .02, .035, .045), c0=None):
    """pts empiles en couches concentriques : sombre -> moyen -> clair -> blanc (lumineux, teinte plate)."""
    if c0 is None:
        c0 = (sum(p[0] for p in pts) / len(pts), sum(p[1] for p in pts) / len(pts))
    cx, cz = c0
    for s_, o_, col in zip(shrink, off, pl):
        if s_ <= 0:
            continue
        fill([(cx + (p[0] - cx) * s_ - o_, cz + (p[1] - cz) * s_ + o_) for p in pts], col, True, step=0.012)
    lay(0.05)


def gstroke(path, w, pl, prof=None, w1=None, fr=(1, .62, .3, .0)):
    """trait lumineux a coeur clair : couches de largeurs decroissantes."""
    for i, col in enumerate(pl):
        f = fr[i] if i < len(fr) else 0
        if f <= 0:
            continue
        pf = (lambda t, f=f: prof(t) * f) if prof else None
        fill(stroke(path, w * f, (w if w1 is None else w1) * f, pf), col, True, step=0.012)
    lay(0.05)


def slash(cx, cz, r, a0, a1, w, pl, rz=None, taper=0.8, head=0.0):
    """arc de slash : croissant effile, bord colore, coeur blanc. head>0 : plus epais vers la fin."""
    path = arcpath(cx, cz, r, a0, a1, 28, rz)

    def prof(t):
        b = sm(t, taper)
        if head:
            b *= (1 - head) + head * t * 1.6
        return w * b
    for f, col in zip((1, .66, .36, .14), pl):
        fill(stroke(path, 0, 0, lambda t, f=f: prof(t) * f), col, True, step=0.012)
    lay(0.05)


def burst(cx, cz, n, r1, r2, pl, rot=90):
    """etoile d'impact : pointes longues, coeur lumineux."""
    glow(star(cx, cz, n, r1, r2, rot), pl, shrink=(1, .72, .46, .22), off=(0, .02, .03, .04), c0=(cx, cz))


def orb(cx, cz, r, col, e=False, gl=True):
    """orbe/sphere : disque + reflet."""
    if e:
        glow(ngon(cx, cz, r), pal(col), shrink=(1, .78, .5, .24), off=(0, r * .08, r * .14, r * .2), c0=(cx, cz))
    else:
        fill(ngon(cx, cz, r), col, bv=min(.1, r * .4))
        if gl and r > .12:
            fill(ngon(cx - r * .35, cz + r * .35, r * .22, r * .16, 8, 40), WHITE, True, nolayer=True)
            lay(0.04)


def ring(cx, cz, r, w, col, e=False, a0=0, a1=359.9, n=36, rz=None, **k):
    fill(stroke(arcpath(cx, cz, r, a0, a1, n, rz), w), col, e, **k)


def shock(cx, cz, r, w, pl, a0=0, a1=359.9, rz=None):
    path = arcpath(cx, cz, r, a0, a1, 40, rz)
    for f, col in zip((1, .6, .25), pl[:3]):
        fill(stroke(path, w * f), col, True, step=0.012)
    lay(0.05)


def sparkle(cx, cz, r, col=WHITE, e=True, k=.28):
    """etincelle a 4 branches."""
    fill(star(cx, cz, 4, r, r * k, 90), col, e, step=0.02)


def shard(x0, z0, x1, z1, w, pl, mid=.38):
    """eclat/cristal allonge (kite) de la base (x0,z0) a la pointe (x1,z1)."""
    dx, dz = x1 - x0, z1 - z0
    L = math.hypot(dx, dz) or 1
    ux, uz = dx / L, dz / L
    nx, nz = -uz, ux
    bx, bz = x0 + dx * mid, z0 + dz * mid
    pts = [(x0, z0), (bx + nx * w, bz + nz * w), (x1, z1), (bx - nx * w, bz - nz * w)]
    fill(pts, pl[0], True, step=.012)
    fill([(x0 + dx * .06, z0 + dz * .06), (bx + nx * w * .8, bz + nz * w * .8), (x1 - dx * .06, z1 - dz * .06), (bx - nx * w * .7, bz - nz * w * .7)], pl[1], True, step=.012)
    fill([(x0 + dx * .1, z0 + dz * .1), (bx + nx * w * .62, bz + nz * w * .62), (x1 - dx * .12, z1 - dz * .12), (bx + nx * w * .05, bz + nz * w * .05)], pl[2], True, step=.012)
    fill([(bx + nx * w * .2, bz + nz * w * .2), (bx + nx * w * .5, bz + nz * w * .5), (x0 + dx * .72, z0 + dz * .72)], pl[3], True, step=.012)
    lay(0.05)


def bolt(cx, cz, s, pl, rot=0):
    pts = [(.2, 1.0), (-.5, -.08), (-.04, -.08), (-.3, -1.0), (.5, .1), (.06, .1), (.46, 1.0)]
    with xf(rot, s, cx, cz):
        glow(pts, pl, shrink=(1, .62, .3, 0), off=(0, .05, .08, 0), c0=(0, 0))


def zig(path, w, pl):
    """eclair ramifie : trait anguleux lumineux."""
    for f, col in zip((1, .55, .22), pl[:3]):
        fill(stroke(path, w * f, w * f * .6), col, True, step=0.012)
    lay(0.05)


def flame(cx, cz, s, pl, rot=0, lean=.3, hw=.55):
    """flamme (pointe en haut) : silhouette + langues interieures."""
    def outline(sc, lean_):
        n = 24
        L, R = [], []
        for i in range(n + 1):
            t = i / n
            z = -1 + 2 * t
            w = hw * sc * (math.sin(math.pi * min(1, t ** .7)) ** .85) * (1 - .15 * t)
            c = lean_ * (t ** 2.2)
            wob = .06 * math.sin(t * 9) * (1 - t)
            L.append((c - w + wob, z * sc)); R.append((c + w + wob, z * sc))
        return L + R[::-1]
    with xf(rot, s, cx, cz):
        fill(outline(1, lean), pl[0], True, step=0.012)
        with xf(0, 1, -.03, -.08):
            fill(outline(.74, lean * .8), pl[1], True, step=0.012)
        with xf(0, 1, -.05, -.2):
            fill(outline(.46, lean * .5), pl[2], True, step=0.012)
        with xf(0, 1, -.06, -.34):
            fill(outline(.22, 0), pl[3], True, step=0.012)
    lay(0.05)


def drop(cx, cz, s, col, e=False, rot=0, shine=True):
    body = [(0, 1.0)] + [(.64 * math.cos(math.radians(a)), -.32 + .64 * math.sin(math.radians(a))) for a in range(30, -211, -15)]
    with xf(rot, s, cx, cz):
        fill(body, col, e)
        if shine:
            fill([(-.3, -.15), (-.18, .12), (-.1, .0), (-.2, -.2)], WHITE, True, nolayer=True)
            lay(.04)


def heart(cx, cz, s, col, e=False, rot=0):
    pts = []
    for i in range(32):
        t = 2 * math.pi * i / 32
        x = 16 * math.sin(t) ** 3
        z = 13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t)
        pts.append((x / 17, (z + 2) / 15))
    with xf(rot, s, cx, cz):
        fill(pts, col, e)


def cross(cx, cz, s, col, e=False, t=.34, rot=0):
    pts = [(-t, 1), (t, 1), (t, t), (1, t), (1, -t), (t, -t), (t, -1), (-t, -1), (-t, -t), (-1, -t), (-1, t), (-t, t)]
    with xf(rot, s, cx, cz):
        fill(pts, col, e)


def leaf(cx, cz, s, rot, col, e=False, vein=None, w=.55):
    path = [(0, -1 + 2 * i / 14) for i in range(15)]
    with xf(rot, s, cx, cz):
        fill(stroke(path, 0, 0, lambda t: 2 * w * sm(t, .8)), col, e)
        if vein:
            fill(stroke([(0, -.85), (0, .55)], .08), vein, True, nolayer=True)
            lay(.04)


def arrow(x0, z0, x1, z1, col, head=.3, w=.12, hcol=None, fl=None, e=False, hw=None):
    """fleche de (x0,z0) vers la pointe (x1,z1)."""
    dx, dz = x1 - x0, z1 - z0
    L = math.hypot(dx, dz) or 1
    ux, uz = dx / L, dz / L
    nx, nz = -uz, ux
    hw = head * .55 if hw is None else hw
    fill(stroke([(x0, z0), (x1 - ux * head * .6, z1 - uz * head * .6)], w), col, e, step=0.02)
    hb = (x1 - ux * head, z1 - uz * head)
    fill([(x1, z1), (hb[0] + nx * hw, hb[1] + nz * hw), (hb[0] - nx * hw, hb[1] - nz * hw)], hcol or col, e, step=0.02)
    if fl:
        for k in (0, .12):
            bx, bz = x0 + ux * k, z0 + uz * k
            fill([(bx, bz), (bx - ux * .16 + nx * .12, bz - uz * .16 + nz * .12), (bx - ux * .1, bz - uz * .1), (bx - ux * .16 - nx * .12, bz - uz * .16 - nz * .12)], fl, e, step=0.01)
    lay(.04)


def note(cx, cz, s, col, e=False):
    with xf(0, s, cx, cz):
        fill(ngon(-.3, -.6, .34, .24, 12, 25), col, e, step=0.02)
        fill(rect(.0, .1, .12, 1.6), col, e, step=0.02)
        fill([(.0, 1.0), (.55, .55), (.5, .25), (.0, .6)], col, e, step=0.02)
    lay(.04)


def crown(cx, cz, s, col, gem=None, e=False):
    pts = [(-.9, -.55), (-.9, .5), (-.45, .1), (0, .75), (.45, .1), (.9, .5), (.9, -.55)]
    with xf(0, s, cx, cz):
        fill(pts, col, e)
        fill(rect(0, -.45, 1.8, .22), shade(col, -.25), e, step=0.02)
        for x in (-.9, 0, .9):
            fill(ngon(x, .55 if x else .8, .13), shade(col, .45), True, step=0.01)
        if gem:
            fill(ngon(0, -.1, .14), gem, True, step=0.01)
    lay(.04)


def skull(cx, cz, s, col, eye=DK, e=False):
    with xf(0, s, cx, cz):
        fill(ngon(0, .2, .72, .68, 20), col, e, step=0.03)
        fill(rect(0, -.55, .78, .5), col, e, step=0.02, bv=.03)
        for sx in (-1, 1):
            fill(ngon(sx * .27, .12, .2, .24, 10), eye, False, nolayer=True, bv=0, th=.01)
        fill([(0, -.08), (-.1, -.26), (.1, -.26)], eye, False, nolayer=True, bv=0, th=.01)
        for x in (-.2, 0, .2):
            fill(rect(x, -.64, .05, .26), eye, False, nolayer=True, bv=0, th=.01)
    lay(.08)


def eye(cx, cz, s, col, pupil=DK, iris=None, e=False, slit=False):
    up = [(x, .55 * (1 - x * x) ** .8) for x in [-.8 + .1 * i for i in range(17)]]
    dn = [(x, -.55 * (1 - x * x) ** .8) for x in [.8 - .1 * i for i in range(17)]]
    pts = [(-1, 0)] + up + [(1, 0)] + dn
    with xf(0, s, cx, cz):
        fill(pts, col, e, step=.03)
        fill(ngon(0, 0, .42, .42, 16), iris or pupil, False, step=0.02, bv=.03)
        if slit:
            fill([(0, .4), (.13, 0), (0, -.4), (-.13, 0)], pupil, False, nolayer=True, bv=0, th=.01)
        else:
            fill(ngon(0, 0, .22, .22, 10), pupil, False, nolayer=True, bv=0, th=.01)
        fill(ngon(-.14, .15, .08, .08, 6), WHITE, True, nolayer=True)
    lay(.08)


def shield(cx, cz, s, col, trim=None, e=False, kind='heater', emblem=None):
    if kind == 'round':
        body = ngon(0, 0, .9, .9, 28)
    elif kind == 'kite':
        body = [(-.75, .75), (0, .95), (.75, .75), (.7, .0), (.38, -.55), (0, -1.0), (-.38, -.55), (-.7, .0)]
    elif kind == 'pavise':
        body = [(-.7, .95), (.7, .95), (.74, -.2), (.4, -.9), (-.4, -.9), (-.74, -.2)]
    else:
        body = [(-.8, .85), (-.4, .95), (0, .85), (.4, .95), (.8, .85), (.8, .05), (.55, -.5), (0, -1.0), (-.55, -.5), (-.8, .05)]
    with xf(0, s, cx, cz):
        fill(body, trim or shade(col, -.35), e, step=.03, bv=.04)
        with xf(0, .8, 0, .02):
            fill(body, col, e, step=.03, bv=.04)
        if emblem == 'cross':
            cross(0, .0, .4, WHITE, True, t=.32)
        elif emblem == 'star':
            fill(star(0, 0, 5, .5, .22), WHITE, True, step=.02)
        elif emblem == 'chev':
            fill([(-.5, .3), (0, -.1), (.5, .3), (.5, .05), (0, -.4), (-.5, .05)], WHITE, True, step=.02)
    lay(.06)


def sword(cx=0, cz=0, s=1, rot=0, col='#dfe6f2', hilt='#e0b040', grip='#7a4a30', w=.2, L=1.0):
    """epee pointe en haut : lame -.25..L, garde, poignee, pommeau (pour s=1 : hauteur ~2)."""
    with xf(rot, s, cx, cz):
        fill([(-w, -.25), (w, -.25), (w, .75 * L), (0, 1.0 * L), (-w, .75 * L)], col, step=.03)
        fill([(-.04, -.2), (.04, -.2), (.04, .8 * L), (0, .94 * L)], shade(col, .6), True, nolayer=True)
        lay(.04)
        fill(rect(0, -.28, .78, .13), hilt, step=.03)
        fill(rect(0, -.6, .12, .45), grip, step=.03)
        fill(ngon(0, -.88, .13), hilt, step=.03)


def dagger(cx=0, cz=0, s=1, rot=0, col='#dfe6f2', hilt='#7a4a30', guard='#e0b040', w=.17, L=1.0):
    with xf(rot, s, cx, cz):
        fill([(-w, -.05), (w, -.05), (w * .9, .65 * L), (0, 1.0 * L), (-w * .9, .65 * L)], col, step=.03)
        fill([(-.03, 0), (.03, 0), (.03, .6 * L), (0, .9 * L)], shade(col, .6), True, nolayer=True)
        lay(.04)
        fill(rect(0, -.1, .55, .1), guard, step=.03)
        fill(rect(0, -.4, .1, .36), hilt, step=.03)
        fill(ngon(0, -.62, .1), guard, step=.03)


def axe(cx=0, cz=0, s=1, rot=0, col='#dfe6f2', haft='#7a4a30', double=False):
    with xf(rot, s, cx, cz):
        fill(stroke([(0, -1), (0, .95)], .14), haft, step=.03)
        hd = [(.05, .85), (.55, .98), (.9, .62), (.78, .1), (.9, -.2), (.5, -.12), (.05, .0)]
        fill(hd, col, step=.03)
        fill([(.12, .8), (.5, .88), (.78, .6), (.12, .45)], shade(col, .45), True, nolayer=True)
        lay(.04)
        if double:
            with xf(0, 1, 0, 0, flip=True):
                fill(hd, col, step=.03)
        fill(ngon(0, .95, .09), '#e0b040', step=.03)


def hammer(cx=0, cz=0, s=1, rot=0, col='#9aa0b8', haft='#7a4a30', head=(.95, .5)):
    with xf(rot, s, cx, cz):
        fill(stroke([(0, -1), (0, .7)], .15), haft, step=.03)
        fill(rect(0, .62, head[0] * 1.5, head[1] * .9), col, step=.03)
        fill(rect(-.15, .72, head[0] * 1.1, .1), shade(col, .45), True, nolayer=True)
        lay(.04)


def bow(cx=0, cz=0, s=1, rot=0, col='#a9744a', string=WHITE, flip=False):
    with xf(rot, s, cx, cz, flip=flip):
        path = [(-.55 * math.cos(math.radians(a)) + .35, .95 * math.sin(math.radians(a))) for a in range(-90, 91, 10)]
        fill(stroke(path, .2, .2, lambda t: .09 + .15 * sm(t, .6)), col, step=.03)
        fill(stroke([(.35, -.95), (.35, .95)], .035), string, True, step=.02)
    lay(.04)


def staff(cx=0, cz=0, s=1, rot=0, col='#a9744a', top=None):
    with xf(rot, s, cx, cz):
        fill(stroke([(0, -1), (0, .7)], .14, .12), col, step=.03)
        if top:
            orb(0, .8, .28, top, e=True)


def bannerpole(cx, cz, s, col, pole='#a9744a', tip='#ffcf4a', rot=0):
    with xf(rot, s, cx, cz):
        fill(stroke([(-.5, -1), (-.5, 1)], .1), pole, step=.03)
        fill(star(-.5, 1.0, 3, .15, .08, 90), tip, step=.02)
        fill([(-.45, .85), (.2, .8), (.7, .88), (.55, .5), (.8, .1), (.2, .18), (-.45, .1)], col, step=.03)
        fill([(-.4, .8), (.1, .76), (.1, .62), (-.4, .65)], shade(col, .35), True, nolayer=True)
    lay(.05)


def gear(cx, cz, r, col, n=8, hole=.3, e=False):
    pts = []
    for i in range(n * 4):
        a = math.radians(360 * i / (n * 4) - 360 / (n * 8))
        rr = r if i % 4 in (0, 1) else r * .74
        pts.append((cx + rr * math.cos(a), cz + rr * math.sin(a)))
    fill(pts, col, e, step=.03)
    fill(ngon(cx, cz, r * hole, n=14), DK, False, nolayer=True, bv=0, th=.01)
    lay(.04)


def book(cx, cz, s, cover, page='#f2ead6', open_=True, rot=0):
    with xf(rot, s, cx, cz):
        if open_:
            fill([(-1, .5), (0, .35), (1, .5), (1, -.6), (0, -.75), (-1, -.6)], cover, step=.03)
            fill([(-.9, .45), (-.04, .3), (-.04, -.62), (-.9, -.5)], page, step=.02)
            fill([(.9, .45), (.04, .3), (.04, -.62), (.9, -.5)], shade(page, -.1), step=.02)
            for z in (.1, -.1, -.3):
                fill(stroke([(-.75, z), (-.2, z - .03)], .05), shade(page, -.3), nolayer=True, bv=0, th=.01)
        else:
            fill(rect(0, 0, 1.4, 1.8), cover, step=.03)
            fill(rect(0, 0, 1.1, 1.5), shade(cover, .3), nolayer=True, th=.03)
            fill(rect(-.62, 0, .16, 1.8), shade(cover, -.3), step=.02)
    lay(.04)


def flask(cx, cz, s, liquid, glass='#bfe8ff', e_liq=False, rot=0):
    pts = [(-.18, .95), (.18, .95), (.18, .45), (.7, -.55), (.7, -.8), (-.7, -.8), (-.7, -.55), (-.18, .45)]
    with xf(rot, s, cx, cz):
        fill(pts, glass, step=.03)
        fill([(-.52, -.2), (.52, -.2), (.7, -.55), (.7, -.8), (-.7, -.8), (-.7, -.55)], liquid, e_liq, step=.02)
        fill(rect(0, 1.0, .5, .2), '#a9744a', step=.03)
        fill(ngon(.25, -.5, .1), WHITE, True, nolayer=True)
    lay(.05)


def coin(cx, cz, r, col, mark='star', e=False):
    fill(ngon(cx, cz, r, n=24), shade(col, -.3), e, step=.03)
    fill(ngon(cx, cz, r * .82, n=24), col, e, step=.03)
    if mark == 'star':
        fill(star(cx, cz, 5, r * .5, r * .22), shade(col, .55), True, step=.02)
    elif mark == 'skull':
        skull(cx, cz, r * .45, shade(col, .55))
    fill(ngon(cx - r * .35, cz + r * .45, r * .1, n=6), WHITE, True, nolayer=True)
    lay(.04)


def clover(cx, cz, s, col, e=False):
    with xf(0, s, cx, cz):
        for a in (45, 135, 225, 315):
            with xf(a, 1, 0, 0):
                fill(ngon(0, .45, .42, .48, 16), col, e, step=.03)
        fill(stroke([(0, -.1), (.15, -.9)], .12), shade(col, -.3), step=.02)
    lay(.04)


def tower(cx, cz, s, col, e=False):
    with xf(0, s, cx, cz):
        fill([(-.55, -.95), (.55, -.95), (.5, .5), (.7, .5), (.7, .95), (.4, .95), (.4, .75), (.15, .75), (.15, .95), (-.15, .95), (-.15, .75), (-.4, .75), (-.4, .95), (-.7, .95), (-.7, .5), (-.5, .5)], col, e)
        fill([(-.12, -.2), (.12, -.2), (.12, .35), (-.12, .35)], DK, False, nolayer=True, bv=0, th=.01)
        fill([(-.15, -.95), (.15, -.95), (.15, -.55), (-.15, -.55)], DK, False, nolayer=True, bv=0, th=.01)
    lay(.05)


def hourglass(cx, cz, s, col, sand, glass='#cfe8ff'):
    with xf(0, s, cx, cz):
        fill(rect(0, .95, 1.3, .16), col, step=.02)
        fill(rect(0, -.95, 1.3, .16), col, step=.02)
        fill([(-.55, .85), (.55, .85), (.08, .0), (.55, -.85), (-.55, -.85), (-.08, .0)], glass, step=.03)
        fill([(-.4, -.8), (.4, -.8), (.22, -.45), (-.22, -.45)], sand, True, step=.02)
        fill([(-.3, .7), (.3, .7), (.06, .08), (-.06, .08)], sand, True, step=.02)
    lay(.05)


def hexa(cx, cz, r, col, e=False, rot=0):
    fill(ngon(cx, cz, r, n=6, rot=rot + 30), col, e)


def rune(cx, cz, s, col, kind=0, w=.16, e=True):
    """glyphe runique simple (quelques traits)."""
    L = {
        0: [[(-.4, .9), (-.4, -.9)], [(-.4, .2), (.5, .9)], [(-.4, -.1), (.5, -.9)]],
        1: [[(0, .95), (0, -.95)], [(-.55, .4), (0, .95), (.55, .4)], [(-.5, -.1), (.5, -.1)]],
        2: [[(-.5, .9), (.5, .9), (-.5, -.9), (.5, -.9)]],
        3: [[(-.5, .9), (0, -.9), (.5, .9)], [(-.3, 0), (.3, 0)]],
        4: [[(-.5, -.9), (-.5, .9), (.5, .1), (-.5, .1)], [(0, .1), (.5, -.9)]],
        5: [[(0, .95), (0, -.95)], [(-.5, .5), (.5, -.5)], [(.5, .5), (-.5, -.5)]],
    }[kind % 6]
    with xf(0, s, cx, cz):
        for p in L:
            fill(stroke(p, w), col, e, step=.01)
    lay(.04)


def thorn_ring(cx, cz, r, col, n=3):
    for i in range(n):
        a = 360 * i / n
        fill(stroke(arcpath(cx, cz, r, a, a + 150, 14), .12, .12, lambda t: .05 + .12 * sm(t, .5)), col, step=.02)
        for t in (.3, .65):
            ang = math.radians(a + 150 * t)
            px, pz = cx + r * math.cos(ang), cz + r * math.sin(ang)
            fill([(px - .06 * math.sin(ang), pz + .06 * math.cos(ang)), (px + .06 * math.sin(ang), pz - .06 * math.cos(ang)),
                  (px + .24 * math.cos(ang), pz + .24 * math.sin(ang))], shade(col, .3), step=.01)
    lay(.04)


def hand(cx, cz, s, col, fist=True, rot=0, cuff=None):
    with xf(rot, s, cx, cz):
        if fist:
            fill([(-.62, -.5), (-.65, .2), (-.45, .6), (.45, .6), (.68, .2), (.6, -.5), (.35, -.8), (-.35, -.8)], col, step=.03)
            for x in (-.33, -.0, .33):
                fill(stroke([(x, .55), (x, .05)], .03), shade(col, -.4), nolayer=True, bv=0, th=.01)
            fill([(-.62, -.15), (-.2, -.05), (-.1, -.35), (-.5, -.5)], shade(col, -.15), step=.02)
        else:
            fill(stroke([(-.62, -.15), (-.2, -.3)], .22), col, step=.01) if False else None
            fill([(-.4, -.8), (-.45, -.1), (.45, -.1), (.4, -.8)], col, step=.02)
            for x, L in ((-.32, .85), (-.11, 1.0), (.11, .95), (.32, .75)):
                fill(stroke([(x, -.25), (x, -.25 + L)], .2, .17), col, step=.004)
            fill(stroke([(-.4, -.45), (-.85, .05)], .22, .18), col, step=.004)
            lay(.03)
        if cuff:
            fill(rect(0, -.95, 1.0, .32), cuff, step=.02)
    lay(.05)


def wings(cx, cz, s, col, e=False, mirror=True, rot=0):
    """paire d'ailes (plumes en eventail)."""
    for sx in ((1, -1) if mirror else (1,)):
        with xf(rot, s, cx, cz, flip=(sx < 0)):
            for i, (a, L) in enumerate(((20, 1.0), (45, .95), (68, .82), (90, .66))):
                ar = math.radians(a)
                pts = stroke([(.1 + L * math.cos(ar) * .95 * k / 8, L * math.sin(ar) * .95 * k / 8) for k in range(9)], 0, 0, lambda t: .3 * sm(t, .5) + .02)
                fill(pts, col if e else shade(col, -.08 * (3 - i)), e, step=.012)
    lay(.05)


def mountain(cx, cz, s, col, snow=WHITE):
    with xf(0, s, cx, cz):
        fill([(-1, -.8), (-.35, .6), (-.1, .2), (.3, 1.0), (1, -.8)], col, step=.03)
        fill([(.3, 1.0), (.1, .55), (.3, .6), (.5, .45), (.52, .5)], snow, step=.02)
    lay(.05)


def tree(cx, cz, s, col, trunk='#7a4a30'):
    with xf(0, s, cx, cz):
        fill([(-.12, -.95), (.12, -.95), (.1, -.1), (-.1, -.1)], trunk, step=.03)
        fill(ngon(0, .25, .8, .72, 14), col, step=.03)
        fill(ngon(-.45, -.1, .45, .4, 12), shade(col, -.1), step=.02)
        fill(ngon(.45, -.1, .45, .4, 12), shade(col, -.1), step=.02)
    lay(.05)


def chain(cx, cz, s, col, rot=0, n=4):
    with xf(rot, s, cx, cz):
        for i in range(n):
            z = -.9 + 1.8 * i / (n - 1)
            if i % 2 == 0:
                ring(0, z, .3, .13, col, rz=.38)
            else:
                ring(0, z, .22, .13, shade(col, -.15), rz=.38)
    lay(.04)


def spike_ring(cx, cz, r, n, col, L=.25, w=.1, e=False):
    for i in range(n):
        a = math.radians(360 * i / n)
        c, s_ = math.cos(a), math.sin(a)
        fill([(cx + r * c - w * s_, cz + r * s_ + w * c), (cx + (r + L) * c, cz + (r + L) * s_), (cx + r * c + w * s_, cz + r * s_ - w * c)], col, e, step=.01)
    lay(.04)


def plate(cx, cz, r, col, rim, e=False):
    """disque de fond : anneau + plaque."""
    fill(ngon(cx, cz, r, n=40), rim, e, step=.02, bv=.04)
    fill(ngon(cx, cz, r - .11, n=40), col, e, step=.02, bv=.03)


# ------------------------------------------------------------------ moteur de rendu
REG = {}


def icon(key, size=32, post=None):
    """decorateur : enregistre une recette. post : 'rim' (liseré blanc d'ultime) ou None."""
    def d(f):
        REG[key] = (size, f, post)
        return f
    return d


def clear_scene():
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o)
    for m in list(bpy.data.meshes):
        bpy.data.meshes.remove(m)
    for m in list(bpy.data.materials):
        bpy.data.materials.remove(m)
    C.update(y=0.0, xf=(1, 0, 0, 1, 0, 0), n=0)
    C['solid'].clear(); C['emit'].clear()


def inner_rim(img, color=(255, 255, 255), k=.8):
    a = np.array(img)
    al = a[..., 3] > 0
    ol = (a[..., 0] == 0x1d) & (a[..., 1] == 0x14) & (a[..., 2] == 0x30) & al
    body = al & ~ol
    er = body.copy()
    er[1:, :] &= body[:-1, :]; er[:-1, :] &= body[1:, :]; er[:, 1:] &= body[:, :-1]; er[:, :-1] &= body[:, 1:]
    edge = body & ~er
    for i in range(3):
        a[..., i][edge] = (a[..., i][edge] * (1 - k) + color[i] * k).astype(np.uint8)
    return Image.fromarray(a, 'RGBA')


def render_icon(key, size, fn, post, out_dir, ss=6, t_dark=.52, t_light=.9, outline=True, ext=2.0, ambient=.42):
    clear_scene()
    sc = bpy.context.scene
    sc['px_ambient'] = ambient
    fn()
    cam = setup_camera()
    aim_camera(cam, 0, 0, ext, (0, 0, 0), None, size, size)
    setup_lights(0, 0, ambient=ambient, sun_k=2.6)
    A, Sh = render_passes(size * ss, size * ss, shade_samples=10)
    img = postprocess(A, Sh, size, size, ss, outline, t_dark, t_light)
    if post == 'rim':
        img = inner_rim(img)
    img.save(os.path.join(out_dir, key + '.png'))
    return img


def run_keys(keys, out_dir=PNG_DIR, **kw):
    t0 = time.time()
    for k in keys:
        size, fn, post = REG[k]
        render_icon(k, size, fn, post, out_dir, **kw)
    return time.time() - t0
