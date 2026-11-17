"""fx.py - animations d'attaque : feuilles de sprites horizontales fx_<nom> (48x48 x8 ; ultimes 96x96 x10).
Chaque effet est une VRAIE scene Blender animee (images cles de position/rotation/echelle) rendue image par image."""
import sys, os, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *

PALS = {
    'steel': ['#5a6a8a', '#c9d2e0', '#ffffff', '#ff9a3a', '#ffd88a'],
    'gardien': ['#2a58a8', '#5aa8ff', '#a8dcff', '#ffffff', '#4de0c0'],
    'assassin': ['#3a2060', '#8a5ac8', '#e0c8ff', '#ffffff', '#ff5a5a'],
    'archer': ['#2f7a3a', '#6fdc6f', '#c9f0a0', '#ffffff', '#a9744a', '#c9d2e0'],
    'sorcier': ['#8a2a7a', '#ff7ad9', '#ffc4f0', '#ffffff', '#ffcf4a', '#ff8a3a'],
    'soigneur': ['#2f9a5a', '#5fe07a', '#c8ffd8', '#ffffff', '#ffe27a'],
    'soutien': ['#c08a20', '#ffcf4a', '#fff0a0', '#ffffff', '#ff7ad9'],
}


def elem_pal(c):
    r, g, b = h2rgb(c)
    d = '#%02x%02x%02x' % (int(r * .45), int(g * .4), int(b * .6))
    m = c
    l = '#%02x%02x%02x' % tuple(int(v + (255 - v) * .55) for v in (r, g, b))
    return [d, m, l, '#ffffff']


def E(h):
    return mat(h, 1)


def track(o, pts, N):
    """pts = [(frame, {loc,rot,scl})...]. Invisible (echelle 0) hors de [premier, dernier]."""
    pts = sorted(pts, key=lambda p: p[0])
    f0, d0 = pts[0]
    fl, dl = pts[-1]
    if f0 > 0:
        key(o, f0 - 1, loc=d0.get('loc', o.location), rot=d0.get('rot', [math.degrees(a) for a in o.rotation_euler]), scl=0.0)
    for f, d in pts:
        key(o, f, loc=d.get('loc'), rot=d.get('rot'), scl=d.get('scl', 1.0))
    if fl < N - 1:
        key(o, fl + 1, loc=dl.get('loc', o.location), rot=dl.get('rot'), scl=0.0)
    linear_keys(o)


def grow_fade(o, f0, f1, N, s=1.0, loc=None, loc2=None, rot=None, rot2=None, peak=0.35, s0=0.2):
    """apparition rapide, plateau, retrecissement : motif standard."""
    fm = f0 + max(1, int((f1 - f0) * peak))
    L1 = loc if loc is not None else tuple(o.location)
    L2 = loc2 if loc2 is not None else L1
    R1 = rot if rot is not None else [math.degrees(a) for a in o.rotation_euler]
    R2 = rot2 if rot2 is not None else R1
    lm = tuple(Vector(L1).lerp(Vector(L2), peak))
    rm = [a + (b - a) * peak for a, b in zip(R1, R2)]
    pts = [(f0, dict(loc=L1, rot=R1, scl=s * s0)), (fm, dict(loc=lm, rot=rm, scl=s)),
           (f1, dict(loc=L2, rot=R2, scl=s * 0.25))]
    track(o, pts, N)


def diamond(L, w, at, m, rot=0.0, th=0.1, name='ray'):
    o = poly([(0, 0), (L * .5, w), (L, 0), (L * .5, -w)], th, at, m, (0, rot, 0), 0, name)
    return o


def ray_burst(n, r0, L, w, m, f0, f1, N, rot0=0, spin=0, center=(0, 0, 0), s=1.0, alt=0.6):
    e = empty('burst', center)
    for i in range(n):
        a = rot0 + 360.0 / n * i
        d = poly([(r0, 0), (r0 + L * (alt if i % 2 else 1) * .5, w), (r0 + L * (alt if i % 2 else 1), 0), (r0 + L * (alt if i % 2 else 1) * .5, -w)],
                 0.1, (0, 0, 0), m, (0, -a, 0), 0, 'ray')
        d.parent = e
    grow_fade(e, f0, f1, N, s, rot=(0, 0, 0), rot2=(0, spin, 0), peak=0.4, s0=0.3)
    return e


def ring(R, w, m, f0, f1, N, s0=0.4, s1=1.2, at=(0, 0, 0), facing=True, tilt=0, seg=28):
    o = torus(R, w, at, m, seg, 5, (90 if facing else tilt, 0, 0))
    track(o, [(f0, dict(loc=at, rot=(90 if facing else tilt, 0, 0), scl=s0)),
              (f1, dict(loc=at, rot=(90 if facing else tilt, 0, 0), scl=s1))], N)
    return o


def sparkle(at, s, m, f0, f1, N, rise=0.0):
    o = poly(star_pts(4, 1, 0.22, 90), 0.1, at, m, (0, 0, 0), 0, 'sparkle')
    fm = (f0 + f1) // 2
    p2 = (at[0], at[1], at[2] + rise)
    track(o, [(f0, dict(loc=at, rot=(0, 0, 0), scl=s * 0.2)), (fm, dict(loc=((at[0] + p2[0]) / 2, 0, (at[2] + p2[2]) / 2), rot=(0, 45, 0), scl=s)),
              (f1, dict(loc=p2, rot=(0, 90, 0), scl=s * 0.2))], N)
    return o


def sparks(n, r0, r1, size, m, f0, f1, N, seed=1, center=(0, 0, 0), spread=360, base=0, gravity=0.0):
    rg = random.Random(seed)
    for i in range(n):
        a = math.radians(base + rg.uniform(0, spread))
        r_a, r_b = r0 * rg.uniform(.8, 1.2), r1 * rg.uniform(.7, 1.2)
        s_ = size * rg.uniform(.7, 1.3)
        p1 = (center[0] + math.cos(a) * r_a, 0, center[2] + math.sin(a) * r_a)
        p2 = (center[0] + math.cos(a) * r_b, 0, center[2] + math.sin(a) * r_b - gravity)
        o = poly([(0, s_ * .5), (s_ * .5, 0), (0, -s_ * .5), (-s_ * .5, 0)], 0.1, p1, m, (0, 0, 0), 0, 'spark')
        ff0 = f0 + rg.randint(0, 1)
        track(o, [(ff0, dict(loc=p1, rot=(0, 0, 0), scl=1.0)), (f1, dict(loc=p2, rot=(0, 90, 0), scl=0.3))], N)


def orb(r, cols, at, f0, f1, N, s0=0.4, s1=1.0, smid=None, name='orb', seg=14):
    o = sph(r, at, facing_mat(cols), seg, 9, name=name)
    pts = [(f0, dict(loc=at, rot=(0, 0, 0), scl=s0)), (f1, dict(loc=at, rot=(0, 0, 0), scl=s1))]
    if smid:
        pts.insert(1, ((f0 + f1) // 2, dict(loc=at, rot=(0, 0, 0), scl=smid)))
    track(o, pts, N)
    return o


def arc_sweep(r, a0, a1, widths, mats, f0, N, center=(0, 0, 0), stay=3, seg_n=None, thick=0.14, grow=0):
    """Croissant balaye : plusieurs sous-arcs qui apparaissent un par un puis disparaissent dans le meme ordre."""
    n = len(widths)
    for i in range(n):
        aa = a0 + (a1 - a0) * i / n
        bb = a0 + (a1 - a0) * (i + 1) / n + (a1 - a0) / n * 0.12
        for j, m in enumerate(mats):
            w = widths[i] * (1.0 if j == 0 else 0.45)
            o = crescent(r, aa, bb, w, center, m, thick + 0.02 * (j), 6, name='arc', taper=0.0)
            track(o, [(f0 + i, dict(loc=center, rot=(0, 0, 0), scl=1.0)),
                      (f0 + i + stay + (n - i) // 2, dict(loc=center, rot=(0, 0, 0), scl=0.6))], N)


# ---------------------------------------------------------------- effets de role (48x48 x 8)
def fx_slash(N=8, big=False):
    P = PALS['steel']
    arc_sweep(1.45, 140, -50, [0.3, 0.65, 0.9, 0.7, 0.28], [E(P[1]), E(P[2])], 0, N, (-0.5, 0, -0.45), 3)
    arc_sweep(1.1, 135, -20, [0.16, 0.34, 0.44, 0.3], [E(P[3])], 1, N, (-0.7, 0, -0.7), 3) if True else None
    sparks(7, 0.9, 2.1, 0.22, E(P[4]), 4, 7, N, 3, (0.7, 0, -0.6), 140, -70)
    return P


def fx_shield(N=8):
    P = PALS['gardien']
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=1, radius=1.5)
    me = bpy.data.meshes.new('dome')
    bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new('dome', me)
    (S['coll'] or bpy.context.scene.collection).objects.link(o)
    me.materials.append(E(P[1]))
    w = o.modifiers.new('wire', 'WIREFRAME'); w.thickness = 0.16; w.use_even_offset = True
    track(o, [(0, dict(loc=(0, 0, 0), rot=(0, 0, 0), scl=0.45)), (2, dict(loc=(0, 0, 0), rot=(0, 20, 0), scl=1.05)),
              (5, dict(loc=(0, 0, 0), rot=(0, 40, 0), scl=0.97)), (7, dict(loc=(0, 0, 0), rot=(0, 60, 0), scl=1.1))], N)
    o2 = sph(1.45, (0, 0, 0), facing_mat([P[1], P[0], P[0]]), 12, 8)
    o2.modifiers.new('wire', 'WIREFRAME').thickness = 0.0
    bpy.data.objects.remove(o2)
    ring(1.5, 0.09, E(P[2]), 1, 7, N, 0.5, 1.1, facing=True)
    sparkle((1.0, 0, 1.0), 0.45, E(P[3]), 2, 6, N)
    sparkle((-1.1, 0, 0.5), 0.35, E(P[3]), 3, 7, N)
    return P


def fx_stab(N=8):
    P = PALS['assassin']
    for i, a in enumerate((45, -45)):
        o = diamond(3.6, 0.22, (-1.8 * math.cos(math.radians(a)), 0, -1.8 * math.sin(math.radians(a))), E(P[2]), -a)
        o.location = (-1.8 * math.cos(math.radians(a)), 0, 1.8 * math.sin(math.radians(a)) * -1)
        o.location = (-1.8 * math.cos(math.radians(a)), 0, -1.8 * math.sin(math.radians(a)))
        o.rotation_euler = (0, math.radians(-a), 0)
        track(o, [(1 + i, dict(loc=tuple(o.location), rot=(0, -a, 0), scl=0.4)), (3 + i, dict(loc=tuple(o.location), rot=(0, -a, 0), scl=1.0)),
                  (6 + i if i == 0 else 7, dict(loc=tuple(o.location), rot=(0, -a, 0), scl=0.3))], N)
        o2 = diamond(3.6, 0.1, tuple(o.location), E(P[3]), -a, 0.14)
        o2.rotation_euler = (0, math.radians(-a), 0)
        track(o2, [(1 + i, dict(loc=tuple(o.location), rot=(0, -a, 0), scl=0.4)), (3 + i, dict(loc=tuple(o.location), rot=(0, -a, 0), scl=1.0)),
                   (6 + i if i == 0 else 7, dict(loc=tuple(o.location), rot=(0, -a, 0), scl=0.3))], N)
    st = poly(star_pts(4, 1.1, 0.2), 0.12, (0, 0, 0), E(P[3]), (0, 0, 0), 0, 'flash')
    track(st, [(2, dict(loc=(0, 0, 0), rot=(0, 0, 0), scl=0.4)), (4, dict(loc=(0, 0, 0), rot=(0, 45, 0), scl=1.3)), (7, dict(loc=(0, 0, 0), rot=(0, 90, 0), scl=0.2))], N)
    sparks(6, 0.5, 1.9, 0.22, E(P[4]), 3, 7, N, 5)
    return P


def fx_arrow(N=8, count=1):
    P = PALS['archer']
    g = empty('arrow', (-2.2, 0, 0))
    cyl(0.07, 2.0, (-1.0, 0, 0), E(P[4]), 6, rot=(0, 90, 0)).parent = g
    cyl(0.2, 0.55, (1.0, 0, 0), E(P[5]), 6, r2=0.0, rot=(0, 90, 0)).parent = g
    for s_ in (1, -1):
        poly([(-1.0, 0), (-1.4, 0.35 * s_), (-0.7, 0.04 * s_)], 0.06, (0, 0, 0), E(P[1])).parent = g
    d = diamond(2.4, 0.12, (-3.6, 0, 0), E(P[3]), 0)
    d.parent = g
    track(g, [(0, dict(loc=(-2.4, 0, 0), rot=(0, 0, 0), scl=1.0)), (4, dict(loc=(0.55, 0, 0), rot=(0, 0, 0), scl=1.0)), (5, dict(loc=(0.65, 0, 0), rot=(0, 0, 0), scl=0.0))], N)
    ray_burst(8, 0.15, 1.0, 0.22, E(P[2]), 5, 7, N, 0, 25, (0.65, 0, 0))
    ring(0.7, 0.08, E(P[3]), 5, 7, N, 0.3, 1.2, at=(0.65, 0, 0))
    sparks(5, 0.3, 1.5, 0.2, E(P[1]), 5, 7, N, 7, (0.65, 0, 0))
    return P


def fx_blast(N=8):
    P = PALS['sorcier']
    orb(0.5, [P[0], P[1], P[2], P[3]], (0, 0, 0), 0, 3, N, 0.3, 0.9, 1.0)
    sh = sph(1.0, (0, 0, 0), facing_mat([P[0], P[1], P[2]]), 14, 9)
    track(sh, [(3, dict(loc=(0, 0, 0), rot=(0, 0, 0), scl=0.9)), (5, dict(loc=(0, 0, 0), rot=(0, 0, 0), scl=1.5)), (7, dict(loc=(0, 0, 0), rot=(0, 0, 0), scl=1.9))], N)
    ring(1.3, 0.1, E(P[3]), 3, 7, N, 0.5, 1.4)
    ray_burst(8, 1.2, 0.8, 0.2, E(P[4]), 4, 7, N, 10, 20)
    sparks(8, 0.9, 2.0, 0.22, E(P[5]), 4, 7, N, 11)
    return P


def fx_heal(N=8):
    P = PALS['soigneur']
    for s_ in (-1, 1):
        b = box((0.18, 0.1, 3.2), (s_ * 0.85, 0, -1.5), E(P[2]))
        track(b, [(0, dict(loc=(s_ * 0.85, 0, -1.5), rot=(0, 0, 0), scl=(1, 1, 0.3))), (2, dict(loc=(s_ * 0.85, 0, -1.5), rot=(0, 0, 0), scl=(1, 1, 1))),
                  (6, dict(loc=(s_ * 0.85, 0, -1.5), rot=(0, 0, 0), scl=(1, 1, 0.8))), (7, dict(loc=(s_ * 0.85, 0, -1.5), rot=(0, 0, 0), scl=(0.5, 1, 0.3)))], N)
    for i in range(3):
        r = torus(0.9, 0.1, (0, 0, -1.3), E(P[1] if i != 1 else P[2]), 24, 5, (0, 0, 0))
        track(r, [(i, dict(loc=(0, 0, -1.3), rot=(0, 0, 0), scl=1.0)), (i + 4, dict(loc=(0, 0, 1.4), rot=(0, 0, 0), scl=0.7))], N)
    cr = empty('cross', (0, 0, 0))
    box((0.34, 0.1, 1.0), (0, 0, -0.5), E(P[3]), (0, 0, 0)).parent = cr
    box((1.0, 0.1, 0.34), (-0.5, 0, -0.17), E(P[3])).parent = cr
    track(cr, [(2, dict(loc=(0, 0, 0.1), rot=(0, 0, 0), scl=0.3)), (4, dict(loc=(0, 0, 0.3), rot=(0, 0, 0), scl=1.1)), (7, dict(loc=(0, 0, 0.9), rot=(0, 0, 0), scl=0.4))], N)
    for i, (x, z) in enumerate([(-1.3, -1.2), (1.2, -0.8), (-0.4, -1.5), (0.5, -1.4), (1.5, -1.5)]):
        sparkle((x, 0, z), 0.4, E(P[4] if i % 2 else P[2]), i % 3, 4 + i % 3 + 2, N, 1.8)
    return P


def fx_buff(N=8):
    P = PALS['soutien']
    r = torus(1.3, 0.1, (0, 0, -1.2), E(P[1]), 28, 5, (0, 0, 0), scale=(1, 0.3, 1))
    track(r, [(0, dict(loc=(0, 0, -1.2), rot=(0, 0, 0), scl=0.4)), (2, dict(loc=(0, 0, -1.2), rot=(0, 0, 0), scl=1.0)), (7, dict(loc=(0, 0, -1.2), rot=(0, 0, 0), scl=1.15))], N)
    g = empty('runes', (0, 0, -1.2))
    for i in range(6):
        a = math.radians(60 * i)
        box((0.26, 0.26, 0.26), (math.cos(a) * 1.3, 0, math.sin(a) * 0.4 * 1.3), E(P[3] if i % 2 else P[2]), (0, 0, 45), center=True).parent = g
    track(g, [(0, dict(loc=(0, 0, -1.2), rot=(0, 0, 0), scl=0.4)), (2, dict(loc=(0, 0, -1.2), rot=(0, 0, 0), scl=1.0)), (7, dict(loc=(0, 0, -1.2), rot=(0, 0, 0), scl=1.15))], N)
    for i in range(3):
        c = poly([(-0.7, -0.4), (0, 0.3), (0.7, -0.4), (0.7, -0.05), (0, 0.65), (-0.7, -0.05)], 0.1, (0, 0, -1.0), E(P[2] if i == 1 else P[1]), (0, 0, 0), 0, 'chev')
        track(c, [(i + 1, dict(loc=(0, 0, -1.0), rot=(0, 0, 0), scl=0.8)), (i + 5, dict(loc=(0, 0, 1.4), rot=(0, 0, 0), scl=0.5))], N)
    for i, x in enumerate((-1.2, 1.2, 0.0)):
        sparkle((x, 0, -0.6 + i * 0.2), 0.35, E(P[4] if i == 1 else P[3]), i, i + 5, N, 1.5)
    return P


# ---------------------------------------------------------------- impacts d'element (48x48 x 8)
def el_feu(N=8):
    P = ['#c0301a', '#ff6b3d', '#ffb04a', '#fff0a0']
    for i, (x, h, d) in enumerate([(-0.6, 1.6, 0), (0.6, 1.8, 1), (0, 2.4, 0)]):
        a = cyl(0.55 + 0.1 * (i == 2), h, (x, 0, -1.0), facing_mat(P[:3]) if False else E(P[1 + (i == 2)]), 7, r2=0.0)
        b = cyl(0.3, h * 0.65, (x, 0, -1.0), E(P[2 + (i == 2)]), 7, r2=0.0)
        for o in (a, b):
            track(o, [(d, dict(loc=(x, 0, -1.4), rot=(0, 0, 0), scl=0.2)), (d + 2, dict(loc=(x, 0, -1.0), rot=(0, 5 * (i - 1), 0), scl=1.0)),
                      (6, dict(loc=(x * 1.2, 0, -0.5), rot=(0, 10 * (i - 1), 0), scl=0.8)), (7, dict(loc=(x * 1.2, 0, 0), rot=(0, 0, 0), scl=0.3))], N)
    orb(0.8, P, (0, 0, -0.6), 0, 4, N, 0.4, 1.1, 0.9)
    sparks(9, 0.8, 2.0, 0.25, E(P[2]), 2, 7, N, 21, (0, 0, -0.3), 200, -20, -0.2) if False else sparks(9, 0.8, 2.0, 0.25, E(P[2]), 2, 7, N, 21, (0, 0, -0.3))
    return P


def el_glace(N=8):
    P = ['#2f7fb0', '#6fd3ff', '#c4efff', '#ffffff']
    fm = facing_mat([P[0], P[1], P[2]])
    for i in range(8):
        a = 45 * i + 22
        L = 1.5 if i % 2 == 0 else 1.0
        e = empty('shard', (0, 0, 0), (0, -a + 90, 0))
        c = cyl(0.3, L, (0, 0, 0), fm, 4, r2=0.0, rot=(0, 90, 0))
        c.location = (0.2, 0, 0); c.parent = e
        track(e, [(1, dict(loc=(0, 0, 0), rot=(0, -a + 90, 0), scl=0.2)), (3, dict(loc=(0, 0, 0), rot=(0, -a + 90, 0), scl=1.0)),
                  (5, dict(loc=(0, 0, 0), rot=(0, -a + 90, 0), scl=1.1)), (7, dict(loc=(0.0, 0, 0), rot=(0, -a + 90, 0), scl=1.5))], N)
    st = poly(star_pts(4, 1.2, 0.3), 0.14, (0, 0, 0), E(P[3]), (0, 0, 0), 0, 'flash')
    track(st, [(0, dict(loc=(0, 0, 0), rot=(0, 0, 0), scl=0.4)), (2, dict(loc=(0, 0, 0), rot=(0, 45, 0), scl=1.0)), (4, dict(loc=(0, 0, 0), rot=(0, 90, 0), scl=0.2))], N)
    sparks(8, 0.8, 2.0, 0.2, E(P[2]), 4, 7, N, 31, (0, 0, 0))
    return P


def zig(pts, r, m, f0, f1, N):
    objs = []
    for a, b in zip(pts[:-1], pts[1:]):
        objs.append(rod3(a, b, r, m, 5))
    for p in pts[1:-1]:
        objs.append(sph(r * 1.1, p, m, 6, 4))
    e = empty('zig')
    for o in objs:
        o.parent = e
    track(e, [(f0, dict(loc=(0, 0, 0), rot=(0, 0, 0), scl=1.0)), (f1, dict(loc=(0, 0, 0), rot=(0, 0, 0), scl=0.8))], N)


def el_foudre(N=8):
    P = ['#6a3aa8', '#c58bff', '#ecd0ff', '#ffffff']
    for f0, f1, off in ((0, 3, 0.0), (2, 5, 0.5), (4, 7, -0.5)):
        pts = [(0.2 + off, 0, 2.2), (-0.4 + off, 0, 1.0), (0.5 + off, 0, 0.4), (-0.3 + off, 0, -0.6), (0.3 + off, 0, -1.5)]
        zig(pts, 0.17, E(P[1]), f0, f1, N)
        zig(pts, 0.07, E(P[3]), f0, f1, N)
    st = poly(star_pts(8, 1.3, 0.3), 0.12, (0, 0, -0.5), E(P[2]), (0, 0, 0), 0, 'flash')
    track(st, [(1, dict(loc=(0, 0, -0.5), rot=(0, 0, 0), scl=0.4)), (3, dict(loc=(0, 0, -0.5), rot=(0, 20, 0), scl=1.1)), (6, dict(loc=(0, 0, -0.5), rot=(0, 40, 0), scl=0.3))], N)
    ring(0.9, 0.08, E(P[1]), 2, 7, N, 0.4, 1.4, (0, 0, -0.5))
    sparks(8, 0.7, 2.0, 0.2, E(P[3]), 2, 7, N, 41, (0, 0, -0.5))
    return P


def el_nature(N=8):
    P = ['#2f8a3a', '#6fdc6f', '#c4f5a0', '#ffe27a']
    rg = random.Random(9)
    for i in range(9):
        a = 40 * i + rg.uniform(-10, 10)
        r2 = 1.1 + rg.uniform(0, 0.8)
        p2 = (math.cos(math.radians(a)) * r2, 0, math.sin(math.radians(a)) * r2 - 0.2)
        o = sph(0.38, (0, 0, 0), E(P[1] if i % 2 else P[2]), 8, 5, (1.0, 0.25, 0.5))
        track(o, [(0, dict(loc=(0, 0, 0), rot=(0, 0, 0), scl=0.3)), (3, dict(loc=tuple(Vector(p2) * .7), rot=(0, 120 + a, 0), scl=1.0)),
                  (7, dict(loc=p2, rot=(0, 300 + a, 0), scl=0.5))], N)
        o2 = sph(0.2, (0, 0, 0), E(P[0]), 6, 4, (1.0, 0.2, 0.4))
        track(o2, [(0, dict(loc=(0, 0, 0), rot=(0, 0, 0), scl=0.3)), (3, dict(loc=tuple(Vector(p2) * .7), rot=(0, 120 + a, 0), scl=1.0)),
                   (7, dict(loc=p2, rot=(0, 300 + a, 0), scl=0.5))], N)
    f = empty('bloom', (0, 0, 0))
    for i in range(6):
        sph(0.5, (math.cos(math.radians(60 * i)) * 0.5, 0, math.sin(math.radians(60 * i)) * 0.5), E(P[2] if i % 2 else P[1]), 8, 5, (0.8, 0.3, 0.8)).parent = f
    sph(0.28, (0, 0, 0), E(P[3]), 8, 5, (1, 0.5, 1)).parent = f
    track(f, [(0, dict(loc=(0, 0, 0), rot=(0, 0, 0), scl=0.3)), (2, dict(loc=(0, 0, 0), rot=(0, 30, 0), scl=1.1)), (6, dict(loc=(0, 0, 0), rot=(0, 90, 0), scl=0.9)), (7, dict(loc=(0, 0, 0), rot=(0, 120, 0), scl=0.2))], N)
    return P


def el_sacre(N=8):
    P = ['#c09020', '#ffe27a', '#fff6c8', '#ffffff']
    ray_burst(8, 0.2, 2.1, 0.22, E(P[1]), 0, 7, N, 0, 30, (0, 0, 0), 1.0, 0.55)
    ray_burst(8, 0.2, 1.3, 0.12, E(P[3]), 1, 6, N, 22.5, -20, (0, 0, 0), 1.0, 0.6)
    cr = empty('cross')
    box((0.3, 0.1, 1.3), (0, 0, -0.65), E(P[3])).parent = cr
    box((1.3, 0.1, 0.3), (-0.65, 0, -0.15), E(P[3])).parent = cr
    cr.location = (0, 0, 0.0)
    track(cr, [(0, dict(loc=(0, 0, 0.1), rot=(0, 0, 0), scl=0.3)), (2, dict(loc=(0, 0, 0.1), rot=(0, 0, 0), scl=1.0)), (7, dict(loc=(0, 0, 0.1), rot=(0, 0, 0), scl=0.4))], N)
    ring(1.0, 0.08, E(P[2]), 1, 7, N, 0.4, 1.5)
    for i in range(3):
        sparkle((math.cos(i * 2.1) * 1.4, 0, math.sin(i * 2.1) * 1.4), 0.4, E(P[3]), 2 + i, 6 + i % 2, N)
    return P


def el_ombre(N=8):
    P = ['#2a1850', '#8a7bd8', '#c9bff5', '#14122a']
    o = sph(0.8, (0, 0, 0), facing_mat([P[1], P[0], P[3]]), 14, 9)
    track(o, [(0, dict(loc=(0, 0, 0), rot=(0, 0, 0), scl=0.3)), (3, dict(loc=(0, 0, 0), rot=(0, 0, 0), scl=1.2)), (7, dict(loc=(0, 0, 0), rot=(0, 0, 0), scl=0.5))], N)
    for i in range(7):
        e = empty('tend', (0, 0, 0), (0, -(360 / 7 * i + 15), 0))
        c = cyl(0.28, 1.7, (0, 0, 0), E(P[1]), 5, r2=0.0, rot=(0, 90, 0))
        c.location = (0.5, 0, 0); c.parent = e
        c2 = cyl(0.14, 1.2, (0, 0, 0), E(P[0]), 5, r2=0.0, rot=(0, 90, 0))
        c2.location = (0.5, 0.05, 0); c2.parent = e
        track(e, [(1, dict(loc=(0, 0, 0), rot=(0, -(360 / 7 * i + 15), 0), scl=0.2)), (3, dict(loc=(0, 0, 0), rot=(0, -(360 / 7 * i + 15), 0), scl=1.0)),
                  (7, dict(loc=(0, 0, 0), rot=(0, -(360 / 7 * i + 15 + 40), 0), scl=0.6))], N)
    for i in range(5):
        a = i * 1.3
        s_ = sph(0.2, (0, 0, 0), E(P[2]), 6, 4)
        track(s_, [(2 + i % 2, dict(loc=(math.cos(a) * 0.6, 0, math.sin(a) * 0.6), rot=(0, 0, 0), scl=1.0)), (7, dict(loc=(math.cos(a) * 1.8, 0, math.sin(a) * 1.8 + 0.5), rot=(0, 0, 0), scl=0.3))], N)
    return P


def el_arcane(N=8):
    P = ['#a02a8a', '#ff7ad9', '#ffc4f0', '#ffffff']
    g = empty('rune')
    torus(1.4, 0.08, (0, 0, 0), E(P[1]), 28, 5, (90, 0, 0)).parent = g
    for i in range(8):
        a = math.radians(45 * i)
        box((0.22, 0.12, 0.22), (math.cos(a) * 1.4, 0, math.sin(a) * 1.4), E(P[2] if i % 2 else P[3]), (0, 45, 0), center=True).parent = g
    for rot in (90, 150):
        poly(star_pts(3, 1.1, 0.55, 90), 0.08, (0, 0, 0), E(P[1] if rot == 90 else P[2]), (0, rot - 90, 0), 0).parent = g
    track(g, [(0, dict(loc=(0, 0, 0), rot=(0, 0, 0), scl=0.3)), (2, dict(loc=(0, 0, 0), rot=(0, 40, 0), scl=1.0)), (6, dict(loc=(0, 0, 0), rot=(0, 120, 0), scl=1.1)), (7, dict(loc=(0, 0, 0), rot=(0, 160, 0), scl=0.4))], N)
    orb(0.4, [P[0], P[1], P[2]], (0, 0, 0), 1, 6, N, 0.4, 1.0, 1.2)
    for i in range(4):
        sparkle((math.cos(i * 1.6 + 0.4) * 1.6, 0, math.sin(i * 1.6 + 0.4) * 1.6), 0.4, E(P[3]), 1 + i, 5 + i, N)
    return P


# ---------------------------------------------------------------- ultimes (96x96 x 10)
def ult_guerrier(N=10):
    P = PALS['steel']
    arc_sweep(2.6, 150, -60, [0.3, 0.6, 0.85, 0.9, 0.7, 0.3], [E(P[1]), E(P[2])], 0, N, (-0.5, 0, -0.2), 3)
    arc_sweep(2.0, 145, -40, [0.15, 0.35, 0.5, 0.35, 0.15], [E(P[3])], 1, N, (-0.7, 0, -0.5), 3)
    ring(2.6, 0.18, E(P[3]), 3, 9, N, 0.3, 1.2, (0, 0, -2.0), facing=False, tilt=0)
    ring(1.8, 0.14, E(P[4]), 4, 9, N, 0.3, 1.2, (0, 0, -2.0), facing=False, tilt=0)
    rg = random.Random(3)
    for i in range(7):
        a = rg.uniform(20, 160)
        o = box((0.3, 0.3, 0.3), (0, 0, 0), E(P[0] if i % 2 else P[1]), (0, 30, 30), center=True)
        x0 = rg.uniform(-2.5, 2.5)
        track(o, [(3 + i % 3, dict(loc=(x0, 0, -2.0), rot=(0, 0, 0), scl=1.0)), (9, dict(loc=(x0 * 1.2, 0, rg.uniform(0.5, 2.5)), rot=(0, 200, 0), scl=0.4))], N)
    sparks(12, 1.5, 3.8, 0.35, E(P[4]), 4, 9, N, 5, (0.8, 0, -0.5), 140, -70)
    return P


def ult_gardien(N=10):
    P = PALS['gardien']
    bm = bmesh.new(); bmesh.ops.create_icosphere(bm, subdivisions=3, radius=2.6)
    me = bpy.data.meshes.new('dome'); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new('dome', me); (S['coll'] or bpy.context.scene.collection).objects.link(o)
    me.materials.append(E(P[1]))
    o.modifiers.new('wire', 'WIREFRAME').thickness = 0.13
    track(o, [(0, dict(loc=(0, 0, 0), rot=(0, 0, 0), scl=0.3)), (3, dict(loc=(0, 0, 0), rot=(0, 30, 0), scl=1.05)), (8, dict(loc=(0, 0, 0), rot=(0, 90, 0), scl=1.0)), (9, dict(loc=(0, 0, 0), rot=(0, 110, 0), scl=1.25))], N)
    for i, s_ in enumerate((1.0, 0.8)):
        ring(2.7 * s_, 0.14, E(P[2] if i == 0 else P[4]), 1, 9, N, 0.4, 1.1)
    g = empty('emblems')
    for i in range(4):
        a = math.radians(90 * i + 45)
        pts = [(-0.5, 0.6), (0.5, 0.6), (0.5, 0.0), (0, -0.7), (-0.5, 0.0)]
        poly(pts, 0.14, (math.cos(a) * 2.6, 0, math.sin(a) * 2.6), E(P[3] if i % 2 else P[2]), (0, 0, 0), 0).parent = g
    track(g, [(2, dict(loc=(0, 0, 0), rot=(0, 0, 0), scl=0.4)), (5, dict(loc=(0, 0, 0), rot=(0, 90, 0), scl=1.0)), (9, dict(loc=(0, 0, 0), rot=(0, 200, 0), scl=0.8))], N)
    for i, (x, z) in enumerate([(1.8, 1.8), (-1.9, 1.0), (0.2, 2.4), (-1.0, -1.8), (1.5, -1.4)]):
        sparkle((x, 0, z), 0.7, E(P[3]), 2 + i, 7 + i % 3, N)
    return P


def ult_assassin(N=10):
    P = PALS['assassin']
    fl = sph(1.4, (0, 0, 0), facing_mat([P[0], P[0], P[1]]), 14, 9)
    track(fl, [(1, dict(loc=(0, 0, 0), rot=(0, 0, 0), scl=0.4)), (4, dict(loc=(0, 0, 0), rot=(0, 0, 0), scl=1.6)), (8, dict(loc=(0, 0, 0), rot=(0, 0, 0), scl=0.6))], N)
    angs = [20, 70, -35, 110, -70, 45]
    for i, a in enumerate(angs):
        for L, w, m in ((6.2, 0.34, E(P[2])), (6.2, 0.14, E(P[3]))):
            o = diamond(L, w, (0, 0, 0), m, -a, 0.12)
            o.location = (-L / 2 * math.cos(math.radians(a)), 0, -L / 2 * math.sin(math.radians(a)))
            o.rotation_euler = (0, math.radians(-a), 0)
            lc = tuple(o.location)
            track(o, [(i + 1, dict(loc=lc, rot=(0, -a, 0), scl=0.3)), (i + 2, dict(loc=lc, rot=(0, -a, 0), scl=1.0)), (min(N - 1, i + 5), dict(loc=lc, rot=(0, -a, 0), scl=0.3))], N)
    st = poly(star_pts(4, 2.6, 0.4), 0.12, (0, 0, 0), E(P[3]), (0, 0, 0), 0)
    track(st, [(4, dict(loc=(0, 0, 0), rot=(0, 0, 0), scl=0.4)), (6, dict(loc=(0, 0, 0), rot=(0, 45, 0), scl=1.1)), (9, dict(loc=(0, 0, 0), rot=(0, 90, 0), scl=0.3))], N)
    sparks(12, 1.0, 3.6, 0.35, E(P[4]), 4, 9, N, 8)
    return P


def ult_archer(N=10):
    P = PALS['archer']
    rg = random.Random(12)
    for i in range(11):
        x = -3.2 + i * 0.64 + rg.uniform(-.2, .2)
        t0 = int(i * 0.4)
        g = empty('arr', (x + 1.2, 0, 4.2))
        cyl(0.12, 1.6, (0, 0, 0), E(P[4]), 6, rot=(0, 0, 0)).parent = g
        cyl(0.3, 0.6, (0, 0, 0), E(P[5]), 6, r2=0.0, rot=(180, 0, 0)).parent = g
        poly([(0, 1.5), (0.3, 1.9), (0.04, 1.2)], 0.06, (0, 0, 0), E(P[1])).parent = g
        g.rotation_euler = (0, math.radians(-18), 0)
        gy = -2.3 + rg.uniform(-.3, .5)
        track(g, [(t0, dict(loc=(x + 1.2, 0, 4.2), rot=(0, -18, 0), scl=1.0)), (t0 + 4, dict(loc=(x, 0, gy + 0.8), rot=(0, -18, 0), scl=1.0)), (t0 + 5, dict(loc=(x, 0, gy + 0.8), rot=(0, -18, 0), scl=0.0))], N)
        if t0 + 5 < N:
            ring(0.6, 0.1, E(P[3]), t0 + 4, min(N - 1, t0 + 7), N, 0.3, 1.0, (x, 0, gy), facing=False, tilt=0)
            ray_burst(6, 0.1, 0.8, 0.15, E(P[2]), t0 + 4, min(N - 1, t0 + 7), N, 0, 20, (x, 0, gy + 0.2))
    return P


def ult_sorcier(N=10):
    P = PALS['sorcier']
    m = orb(1.1, [P[0], P[1], P[2], P[3]], (3.0, 0, 3.4), 0, 0, N)
    track(m, [(0, dict(loc=(3.0, 0, 3.6), rot=(0, 0, 0), scl=0.6)), (4, dict(loc=(0.0, 0, 0.0), rot=(0, 0, 0), scl=1.0)), (5, dict(loc=(0, 0, 0), rot=(0, 0, 0), scl=0.0))], N)
    tr = diamond(3.5, 0.4, (0, 0, 0), E(P[5]), 0)
    tr.location = (3.0, 0, 3.6); tr.rotation_euler = (0, math.radians(-135 + 180), 0)
    track(tr, [(0, dict(loc=(4.0, 0, 4.6), rot=(0, 45, 0), scl=0.6)), (3, dict(loc=(1.5, 0, 1.8), rot=(0, 45, 0), scl=1.0)), (4, dict(loc=(0.3, 0, 0.3), rot=(0, 45, 0), scl=0.2))], N)
    sh = sph(1.0, (0, 0, 0), facing_mat([P[0], P[1], P[2]]), 16, 10)
    track(sh, [(4, dict(loc=(0, 0, 0), rot=(0, 0, 0), scl=1.2)), (6, dict(loc=(0, 0, 0), rot=(0, 0, 0), scl=2.4)), (9, dict(loc=(0, 0, 0), rot=(0, 0, 0), scl=3.0))], N)
    sh2 = sph(1.0, (0, 0, 0.5), facing_mat([P[5], P[4], P[3]]), 16, 10)
    track(sh2, [(4, dict(loc=(0, 0, 0.3), rot=(0, 0, 0), scl=0.8)), (6, dict(loc=(0, 0, 0.5), rot=(0, 0, 0), scl=1.5)), (8, dict(loc=(0, 0, 0.8), rot=(0, 0, 0), scl=1.7))], N)
    ring(2.0, 0.16, E(P[3]), 4, 9, N, 0.4, 1.5)
    ring(2.6, 0.2, E(P[4]), 5, 9, N, 0.3, 1.3, (0, 0, -1.5), facing=False)
    ray_burst(10, 2.2, 1.5, 0.3, E(P[4]), 5, 9, N, 8, 25)
    sparks(14, 1.5, 4.0, 0.35, E(P[5]), 5, 9, N, 17)
    return P


def ult_soigneur(N=10):
    P = PALS['soigneur']
    for s_, w in ((-1, 1.7), (1, 1.7), (0, 0.5)):
        b = box((0.4 if s_ else 1.0, 0.12, 7.0), (s_ * w, 0, -3.5), E(P[2] if s_ else P[3]))
        loc = (s_ * w, 0, -3.5)
        track(b, [(0, dict(loc=loc, rot=(0, 0, 0), scl=(1, 1, 0.2))), (3, dict(loc=loc, rot=(0, 0, 0), scl=(1, 1, 1))), (8, dict(loc=loc, rot=(0, 0, 0), scl=(1, 1, 0.9))), (9, dict(loc=loc, rot=(0, 0, 0), scl=(0.3, 1, 0.3)))], N)
    for i in range(5):
        r = torus(2.0 - 0.1 * (i % 2), 0.16, (0, 0, -2.4), E(P[1] if i % 2 else P[2]), 28, 5, (0, 0, 0), scale=(1, 1, 1))
        track(r, [(i, dict(loc=(0, 0, -2.4), rot=(0, 0, 0), scl=1.0)), (min(N - 1, i + 5), dict(loc=(0, 0, 2.6), rot=(0, 0, 0), scl=0.7))], N)
    cr = empty('cross')
    box((0.7, 0.12, 2.4), (0, 0, -1.2), E(P[3])).parent = cr
    box((2.4, 0.12, 0.7), (-1.2, 0, -0.35), E(P[3])).parent = cr
    track(cr, [(2, dict(loc=(0, 0, 0.6), rot=(0, 0, 0), scl=0.3)), (5, dict(loc=(0, 0, 0.7), rot=(0, 0, 0), scl=1.2)), (9, dict(loc=(0, 0, 1.4), rot=(0, 0, 0), scl=0.5))], N)
    rg = random.Random(7)
    for i in range(10):
        sparkle((rg.uniform(-2.8, 2.8), 0, rg.uniform(-2.8, 0.5)), rg.uniform(0.5, 0.9), E(P[4] if i % 2 else P[2]), i % 4, 5 + i % 4 + 1, N, 3.0)
    return P


def ult_soutien(N=10):
    P = PALS['soutien']
    for i, (R, d) in enumerate(((2.8, 1), (1.9, -1))):
        g = empty('rr')
        torus(R, 0.12, (0, 0, 0), E(P[1 + i]), 32, 5, (0, 0, 0)).parent = g
        for j in range(8 if i == 0 else 6):
            a = 2 * math.pi * j / (8 if i == 0 else 6)
            box((0.4, 0.4, 0.4), (math.cos(a) * R, math.sin(a) * R, 0), E(P[3] if j % 2 else P[2]), (0, 0, 45), center=True).parent = g
        g.location = (0, 0, -1.8)
        g.scale = (1, 0.3, 1)
        key(g, 0, loc=(0, 0, -1.8), rot=(0, 0, 0), scl=(0.3, 0.1, 0.3))
        key(g, 3, loc=(0, 0, -1.8), rot=(0, 0, d * 60), scl=(1, 0.3, 1))
        key(g, 9, loc=(0, 0, -1.8), rot=(0, 0, d * 200), scl=(1.1, 0.33, 1.1))
        linear_keys(g)
    for i in range(4):
        c = poly([(-1.1, -0.6), (0, 0.5), (1.1, -0.6), (1.1, -0.1), (0, 1.0), (-1.1, -0.1)], 0.12, (0, 0, -1.5), E(P[2] if i % 2 else P[1]), (0, 0, 0), 0)
        track(c, [(i + 1, dict(loc=(0, 0, -1.5), rot=(0, 0, 0), scl=0.9)), (min(N - 1, i + 6), dict(loc=(0, 0, 3.2), rot=(0, 0, 0), scl=0.5))], N)
    ray_burst(12, 0.5, 3.0, 0.3, E(P[2]), 2, 9, N, 0, 15, (0, 0, 0.3), 1.0, 0.5)
    for i in range(5):  # notes de musique : tete + hampe + fanion
        x = -2.6 + i * 1.3
        n = empty('note', (x, 0, -0.8))
        sph(0.3, (0, 0, 0), E(P[4] if i % 2 else P[3]), 8, 5, (1.2, 0.5, 0.9)).parent = n
        box((0.1, 0.1, 1.2), (0.3, 0, 0), E(P[4] if i % 2 else P[3])).parent = n
        box((0.4, 0.1, 0.2), (0.3, 0, 1.0), E(P[4] if i % 2 else P[3]), (0, 0, 0)).parent = n
        track(n, [(i // 2, dict(loc=(x, 0, -0.8), rot=(0, 0, 0), scl=0.6)), (min(N - 1, 5 + i // 2 + 1), dict(loc=(x, 0, 2.4 + (i % 2) * 0.6), rot=(0, 0, 0), scl=1.0)), (min(N - 1, 9), dict(loc=(x, 0, 3.0), rot=(0, 0, 0), scl=0.3))], N)
    return P


FX = {
    'slash': (fx_slash, 8, 48), 'shield': (fx_shield, 8, 48), 'stab': (fx_stab, 8, 48), 'arrow': (fx_arrow, 8, 48),
    'blast': (fx_blast, 8, 48), 'heal': (fx_heal, 8, 48), 'buff': (fx_buff, 8, 48),
    'el_feu': (el_feu, 8, 48), 'el_glace': (el_glace, 8, 48), 'el_foudre': (el_foudre, 8, 48), 'el_nature': (el_nature, 8, 48),
    'el_sacre': (el_sacre, 8, 48), 'el_ombre': (el_ombre, 8, 48), 'el_arcane': (el_arcane, 8, 48),
    'ult_guerrier': (ult_guerrier, 10, 96), 'ult_gardien': (ult_gardien, 10, 96), 'ult_assassin': (ult_assassin, 10, 96),
    'ult_archer': (ult_archer, 10, 96), 'ult_sorcier': (ult_sorcier, 10, 96), 'ult_soigneur': (ult_soigneur, 10, 96),
    'ult_soutien': (ult_soutien, 10, 96)}


def build(name):
    fn, N, fs = FX[name]
    reset_scene()
    sc = bpy.context.scene
    sc.frame_start, sc.frame_end = 0, N - 1
    P = fn(N)
    cam = (0, 20, 4.6 if fs == 48 else 6.4, (0, 0, 0))
    spec = dict(key='fx_' + name, n=N, fw=fs, fh=fs, cam=list(cam[:3]), ss=4 if fs == 48 else 3, palette=P)
    sc['px_fx'] = json.dumps(spec)
    out = render_fx(spec)
    save_blend('fx_' + name)
    return out


def render_fx(spec):
    pal = [h2rgb(c) for c in spec['palette']]
    for o in bpy.context.scene.objects:
        if o.type == 'MESH':
            for ms in o.material_slots:
                m = ms.material
                if m and m.get('px_fx'):
                    pal += [h2rgb(m['px_hex'])]
    # couleurs des rampes facing
    for m in bpy.data.materials:
        if m.get('px_fx') and m.node_tree:
            for n in m.node_tree.nodes:
                if n.bl_idname == 'ShaderNodeValToRGB':
                    for e in n.color_ramp.elements:
                        c = e.color
                        pal.append(tuple(int(round(((x * 12.92) if x <= 0.0031308 else (1.055 * x ** (1 / 2.4) - 0.055)) * 255)) for x in c[:3]))
    for m in bpy.data.materials:
        if m.get('px_hex') and not m.name.startswith('pass_'):
            pal.append(h2rgb(m['px_hex']))
    pal = list(dict.fromkeys(pal))
    fr = render_fx_frames(spec['n'], spec['fw'], spec['fh'], (spec['cam'][0], spec['cam'][1], spec['cam'][2], (0, 0, 0)), pal, spec['ss'])
    img = sheet(fr)
    p = ensure_pil_save(img, spec['key'])
    return p


if __name__ == '__main__':
    names = sys.argv[1:] or list(FX)
    for n in names:
        build(n)
