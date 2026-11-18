"""galaxy.py - galaxie / dirigeable : planete_1..10 (64x64), planete_joueur (80x80), galaxie_fond (320x180, PIL),
bateau_vol (4 images 64x48), ile_pillage / ile_defense (160x120).
Usage : galaxy.py planets | fond | bateau | iles | all"""
import sys, os, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *
from buildings import (AZ, EL, GRASS, GRASS_D, DIRT, WIN, RED, crate, barrel, sack, flag, tree, bush, rock, lantern, fire, win, door,
                       planks, bricks, chimney, em, smoke, EM_FIRE, bunting)
from buildings2 import (banner, ballista, hay, fence, horse, ARC, ARC_L, WHITE_S, E, crystal)

GLOWC, GLOWL = '#ffd070', '#fff4c0'


# ------------------------------------------------------------------ planetes
def fbm(seed):
    r = random.Random(seed)
    comps = [(r.uniform(2.5, 7.0), r.uniform(2.5, 7.0), r.uniform(2.5, 7.0), r.uniform(0, 6.3), r.uniform(0.4, 1.0)) for _ in range(5)]

    def f(x, y, z):
        return sum(w * math.sin(a * x + b * y + c * z + p) for a, b, c, p, w in comps) / 2.5
    return f


def patch_sphere(r, colfn, seg=48, rings=28, name='planet'):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=rings, radius=r)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    idx = {}
    for p in me.polygons:
        c = p.center.normalized()
        col = colfn(c.x, c.y, c.z)
        e = isinstance(col, tuple)
        h = col[0] if e else col
        if (h, e) not in idx:
            me.materials.append(mat(h, 1.0 if e else 0.0))
            idx[(h, e)] = len(me.materials) - 1
        p.material_index = idx[(h, e)]
        p.use_smooth = True
    o = bpy.data.objects.new(name, me)
    (S['coll'] or bpy.context.scene.collection).objects.link(o)
    return o


def onsphere(R, n, x_axis_roll=0):
    """position + rotation pour poser un objet (axe Z local) sur la sphere a la normale n."""
    n = Vector(n).normalized()
    q = n.to_track_quat('Z', 'Y')
    return tuple(n * R), tuple(math.degrees(a) for a in q.to_euler())


def village(R, n, k=1.0, spread=0.13):
    """minuscule village lumineux : lueur chaude + 4 fenetres/lanternes + petits toits."""
    n = Vector(n).normalized()
    rs = random.Random(7)
    up = Vector((0, 0, 1))
    t1 = n.cross(up).normalized()
    t2 = n.cross(t1).normalized()
    pts = [(0, 0), (spread, 0.03), (-spread * 0.9, -0.04), (0.05, -spread), (-0.04, spread * 0.8)]
    for i, (a, b) in enumerate(pts):
        p = (n + t1 * a + t2 * b).normalized() * R
        loc, rot = onsphere(R * 1.0, p)
        box((0.075 * k, 0.075 * k, 0.07 * k), loc, '#2a2038', rot, 0, 'house')
        o = box((0.05 * k, 0.05 * k, 0.05 * k), loc, GLOWC, rot, 0, 'glow')
        E(o, GLOWC if i else GLOWL)
        o.location = tuple(Vector(loc) + Vector(loc).normalized() * 0.045 * k)


def spike(R, n, h, r_, col, e=False, n_=5):
    loc, rot = onsphere(R * 0.98, n)
    o = cyl(r_, h, loc, col, n_, r2=0.0, rot=rot)
    if e:
        E(o, col)
    return o


def P_forest(R):
    f = fbm(1)
    def c(x, y, z):
        v = f(x * 1.2, y * 1.2, z * 1.2)
        if v < -0.15: return '#3f86d8'
        if v < -0.05: return '#e0cc86'
        if v < 0.25: return '#3f9a4c'
        if v < 0.5: return '#2f7a3c'
        return '#58b058'
    patch_sphere(R, c)
    for n in [(0.5, -0.8, 0.3), (-0.6, -0.7, 0.5), (0.1, -0.6, -0.6), (0.9, -0.4, 0.0)]:
        loc, rot = onsphere(R * 0.99, n)
        cyl(0.17, 0.3, loc, '#1f6a34', 6, r2=0.0, rot=rot)
    return (-0.25, -0.9, -0.1)


def P_desert(R):
    f = fbm(2)
    def c(x, y, z):
        v = f(x * 1.3, y * 1.3, z * 1.3)
        if v < -0.45: return '#a8683a'
        if v < 0.0: return '#c89a48'
        if v < 0.45: return '#e0b860'
        return '#f0d890'
    patch_sphere(R, c)
    for n in [(0.5, -0.8, 0.4), (-0.6, -0.7, 0.3), (0.3, -0.5, -0.7)]:
        loc, rot = onsphere(R * 0.99, n)
        cyl(0.2, 0.2, loc, '#b8803a', 6, r2=0.08, rot=rot)
    return (0.25, -0.9, 0.1)


def P_ice(R):
    f = fbm(3)
    def c(x, y, z):
        v = f(x * 1.2, y * 1.2, z * 1.2) + abs(z) * 0.6
        if v < 0.0: return '#8ac0e8'
        if v < 0.45: return '#b8e0f8'
        if v < 0.8: return '#e8f4ff'
        return '#ffffff'
    patch_sphere(R, c)
    for n in [(0.6, -0.7, 0.3), (-0.5, -0.8, 0.2), (0.0, -0.6, 0.7)]:
        spike(R, n, 0.3, 0.1, '#d8f2ff', n_=4)
    return (-0.3, -0.9, -0.15)


def P_volcanic(R):
    f = fbm(4)
    def c(x, y, z):
        v = f(x * 1.5, y * 1.5, z * 1.5)
        if v > 0.62: return ('#ff6a2a',)
        if v > 0.55: return ('#ffb030',)
        if v < -0.3: return '#2a1e2c'
        if v < 0.2: return '#4a3038'
        return '#6a3a34'
    patch_sphere(R, c)
    loc, rot = onsphere(R * 0.97, (0.55, -0.5, 0.65))
    cyl(0.4, 0.45, loc, '#4a3038', 8, r2=0.14, rot=rot)
    o = cyl(0.14, 0.05, tuple(Vector(loc) + Vector(loc).normalized() * 0.44), '#ff8a2a', 8, rot=rot); E(o, '#ffb030')
    return (-0.4, -0.88, -0.1)


def P_ocean(R):
    f = fbm(5)
    def c(x, y, z):
        v = f(x * 1.6, y * 1.6, z * 1.6)
        if v > 0.55: return '#d8c888'
        if v > 0.42: return '#4aa860'
        if v < -0.3: return '#1e4a9a'
        if v < 0.1: return '#2a6ac8'
        return '#4a9ae8'
    patch_sphere(R, c)
    return (0.3, -0.62, 0.7)


def P_crystal(R):
    f = fbm(6)
    def c(x, y, z):
        v = f(x * 1.2, y * 1.2, z * 1.2)
        if v < -0.2: return '#5a46b8'
        if v < 0.2: return '#7a5ad8'
        if v < 0.55: return '#a07af0'
        return '#5ad0e0'
    patch_sphere(R, c)
    for i, n in enumerate([(0.5, -0.7, 0.45), (-0.6, -0.6, 0.45), (0.2, -0.5, -0.7), (-0.2, -0.95, 0.1), (0.85, -0.4, -0.2), (-0.85, -0.3, 0.2)]):
        spike(R, n, 0.55 if i < 3 else 0.35, 0.14, '#9af0ff' if i % 2 else '#e6d0ff', True, 5)
    return (0.12, -0.92, -0.2)


def P_ruins(R):
    f = fbm(7)
    def c(x, y, z):
        v = f(x * 1.4, y * 1.4, z * 1.4)
        if v < -0.3: return '#5a6a48'
        if v < 0.15: return '#7a7260'
        if v < 0.5: return '#9a9078'
        return '#b8ae90'
    patch_sphere(R, c)
    for n in [(0.6, -0.7, 0.35), (0.45, -0.75, 0.3), (-0.55, -0.7, 0.4), (0.1, -0.5, 0.8)]:
        loc, rot = onsphere(R * 0.99, n)
        box((0.14, 0.14, 0.38), loc, '#d8d0b4', rot, 0)
    return (-0.2, -0.9, -0.3)


def P_gas(R):
    def c(x, y, z):
        b = math.sin(z * 7.5 + math.sin(x * 3.0) * 0.5)
        if b < -0.6: return '#b8683a'
        if b < -0.1: return '#d8985a'
        if b < 0.4: return '#e8c080'
        return '#f0d8a0'
    o = patch_sphere(R, c)
    o.rotation_euler = (math.radians(-16), 0, math.radians(8))
    # anneaux (plan incline)
    for rr, ww, col in ((1.85, 0.3, '#c8a878'), (1.55, 0.2, '#e8d4a8')):
        t = torus(rr, ww * 0.5, (0, 0, 0), col, 36, 4, (62, 0, 8), scale=(1, 1, 0.1))
        t.rotation_euler = (math.radians(14), 0, math.radians(-10))
    # lune habitee (village lumineux)
    mo = sph(0.34, (-1.3, -1.3, -0.55), '#8a8aa8', 8, 6)
    for dx, dz in ((0.0, 0.0), (0.12, -0.05), (-0.1, 0.1)):
        g = sph(0.05, (-1.3 + dx, -1.62, -0.55 + dz), GLOWC, 5, 4); E(g, GLOWC)
    return None


def P_dark(R):
    f = fbm(9)
    def c(x, y, z):
        v = f(x * 1.5, y * 1.5, z * 1.5)
        if v > 0.55: return ('#9a6aff',)
        if v < -0.2: return '#2a2250'
        if v < 0.3: return '#403470'
        return '#5e4e9a'
    patch_sphere(R, c)
    for n in [(0.6, -0.7, 0.4), (-0.5, -0.8, 0.3), (0.0, -0.5, -0.8)]:
        spike(R, n, 0.4, 0.1, '#1e1a38', n_=4)
        loc, rot = onsphere(R * 1.15, n)
        E(sph(0.045, loc, '#c8a0ff', 5, 4), '#c8a0ff')
    return (-0.3, -0.9, 0.15)


def P_holy(R):
    f = fbm(10)
    def c(x, y, z):
        v = f(x * 1.2, y * 1.2, z * 1.2) + 0.2 * z
        if v < -0.1: return '#e0b040'
        if v < 0.3: return '#f4d868'
        if v < 0.6: return '#fff0b0'
        return '#ffffff'
    patch_sphere(R, c)
    t = torus(1.45, 0.045, (0, 0, 0), mat('#fff4c0', 1), 36, 4, (0, 0, 0), scale=(1, 1, 1))
    t.rotation_euler = (math.radians(24), 0, math.radians(-12))
    for n in [(0.5, -0.7, 0.4), (-0.6, -0.7, 0.3)]:
        loc, rot = onsphere(R * 0.99, n)
        cyl(0.12, 0.35, loc, '#ffffff', 6, rot=rot); cyl(0.17, 0.08, tuple(Vector(loc) + Vector(loc).normalized() * 0.33), '#ffe27a', 6, rot=rot)
    return (0.2, -0.9, -0.2)


PLANETS = [P_forest, P_desert, P_ice, P_volcanic, P_ocean, P_crystal, P_ruins, P_gas, P_dark, P_holy]


def planet(n):
    reset_scene()
    R = 1.0
    v = PLANETS[n - 1](R)
    if v:
        village(R, v)
    else:
        pass
    add_render('planete_%d' % n, 64, 64, mode='fit', az=0, el=8, ss=6, margin=1, t_dark=0.42, t_light=0.80)
    finish_model('planete_%d' % n)


def planete_joueur():
    reset_scene()
    R = 1.0
    f = fbm(11)
    def c(x, y, z):
        v = f(x * 1.3, y * 1.3, z * 1.3)
        if v < -0.35: return '#3f86d8'
        if v < -0.25: return '#e0cc86'
        if v < 0.2: return '#58b058'
        if v < 0.5: return '#3f9a4c'
        return '#2f7a3c'
    patch_sphere(R, c)
    # tour des etoiles (pierre + toit violet + etoile or)
    n = Vector((0.1, -0.55, 0.83)).normalized()
    loc, rot = onsphere(R * 0.98, n)
    g = empty('tower', loc, rot)
    parts = [cyl(0.14, 0.62, (0, 0, 0), STONE, 8), cyl(0.18, 0.08, (0, 0, 0.6), STONE_L, 8), cyl(0.2, 0.28, (0, 0, 0.68), '#8a5ac8', 8, r2=0.0),
             cyl(0.2, 0.06, (0, 0, 0), STONE_D, 8)]
    st = poly(star_pts(5, 0.11, 0.05), 0.04, (0, -0.0, 1.0), GOLDM, (90, 0, 0), 0); E(st, '#ffd84a')
    parts.append(st)
    wn = box((0.05, 0.04, 0.1), (0, -0.135, 0.3), WIN, (0, 0, 0)); E(wn, WIN); parts.append(wn)
    for p in parts:
        p.parent = g
    village(R, (-0.35, -0.9, 0.0), 1.0, 0.12)
    for nn in [(0.7, -0.65, 0.2), (0.55, -0.5, 0.65), (-0.6, -0.55, 0.55), (0.3, -0.9, -0.3)]:
        loc, rot = onsphere(R * 0.99, nn)
        cyl(0.13, 0.26, loc, '#2f7a3c', 6, r2=0.0, rot=rot)
    add_render('planete_joueur', 80, 80, mode='fit', az=0, el=6, ss=6, margin=1, t_dark=0.42, t_light=0.80)
    finish_model('planete_joueur')


# ------------------------------------------------------------------ fond de galaxie (PIL, tileable horizontalement)
def galaxie_fond():
    W, H = 320, 180
    rng = np.random.RandomState(42)
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)

    def pnoise(seed, fx, fy, octs=4):
        r = np.random.RandomState(seed)
        out = np.zeros((H, W), np.float32)
        amp = 1.0
        for o in range(octs):
            kx, ky = max(1, int(fx * 2 ** o)), fy * 2 ** o
            ph = r.uniform(0, 6.28, 4)
            a = np.sin(2 * np.pi * kx * xx / W + ph[0] + 1.3 * np.sin(2 * np.pi * (kx + 1) * xx / W * 0.5 + yy * ky * 0.02 + ph[1]))
            b = np.sin(yy * ky * 0.045 + ph[2] + 2.0 * np.sin(2 * np.pi * kx * xx / W + ph[3]))
            out += amp * (a * b)
            amp *= 0.55
        return out / 1.8
    n1, n2, n3 = pnoise(1, 2, 2), pnoise(2, 3, 3), pnoise(3, 1, 1)
    base = np.zeros((H, W, 3), np.float32)
    top, bot = np.array([0x0c, 0x0a, 0x24], np.float32), np.array([0x1c, 0x12, 0x40], np.float32)
    g = (yy / H)[..., None]
    base[:] = top * (1 - g) + bot * g
    # nebuleuses : bandes diagonales (violet / bleu / rose) quantifiees
    cloud = n1 * 0.7 + n2 * 0.5 + np.sin(yy / H * 3.14 + 0.6) * 0.3
    cloud2 = n3 * 0.8 + n2 * 0.3
    pal_p = [(0x1c, 0x12, 0x40), (0x2c, 0x1a, 0x5c), (0x40, 0x24, 0x7c), (0x5a, 0x30, 0x98)]
    pal_b = [(0x10, 0x1c, 0x48), (0x18, 0x30, 0x70), (0x24, 0x48, 0x94)]
    out = base.copy()
    for t, c in zip((0.05, 0.28, 0.5, 0.72), pal_p):
        out[cloud > t] = c
    for t, c in zip((0.35, 0.58, 0.8), pal_b):
        out[(cloud2 > t) & (cloud < 0.5)] = c
    hot = (cloud > 0.9) & (cloud2 > 0.1)
    out[hot] = (0x9a, 0x50, 0xc0)
    im = Image.fromarray(out.astype(np.uint8), 'RGB')
    px = np.array(im)
    # etoiles
    for i in range(210):
        x, y = rng.randint(0, W), rng.randint(0, H)
        k = rng.rand()
        px[y, x] = (0xf2, 0xe6, 0xc9) if k > 0.55 else ((0x9a, 0xb0, 0xff) if k > 0.25 else (0x6a, 0x6a, 0xb0))
    for i in range(14):
        x, y = rng.randint(2, W - 2), rng.randint(2, H - 2)
        c = ((0xff, 0xf4, 0xc0), (0xc0, 0xe0, 0xff), (0xff, 0xc0, 0xf0))[i % 3]
        px[y, x] = (0xff, 0xff, 0xff)
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            px[y + dy, (x + dx) % W] = c
    # lointaines planetes / lune
    for cx, cy, r, c1, c2 in ((236, 40, 9, (0x6a, 0x5a, 0xb8), (0x3a, 0x2c, 0x78)), (52, 128, 5, (0x4a, 0x8a, 0xc8), (0x24, 0x48, 0x84))):
        for y in range(cy - r, cy + r + 1):
            for x in range(cx - r, cx + r + 1):
                d = math.hypot(x - cx, y - cy)
                if d <= r:
                    lit = (x - cx) * 0.6 + (y - cy) * 0.6 < r * 0.35
                    px[y, x] = c1 if lit else c2
    Image.fromarray(px, 'RGB').save(os.path.join(PNG_DIR, 'galaxie_fond.png'))


# ------------------------------------------------------------------ dirigeable en vol (4 images 64x48)
def airship():
    reset_scene()
    RED_, CRM, BLU = '#c0453a', CREAM, '#4a6ab8'
    g = empty('ship', (0, 0, 0))
    ps = []
    st = [mat(RED_), mat(CRM), mat(BLU), mat(CRM)]
    bal = striped_sphere(1.5, (0, 0, 3.4), st, 8, (0.9, 0.9, 1.95), 16, 10, name='balloon')
    bal.rotation_euler = (0, math.radians(90), 0)
    ps.append(bal)
    # ceinture / ailerons
    ps.append(poly([(0, 0), (-1.2, 0.9), (-1.2, -0.9)], 0.1, (-2.7, 0, 3.4), RED_, (0, 0, 0), 0, 'fin_v'))
    ps.append(poly([(0, 0), (-1.2, 0.9), (-1.2, -0.9)], 0.1, (-2.7, 0, 3.4), RED_, (90, 0, 0), 0, 'fin_h'))
    # nacelle
    ps.append(poly([(-1.9, 1.0), (1.9, 1.0), (2.3, 1.3), (1.5, 0.0), (-1.3, 0.0)], 1.1, (0, 0, 0.7), WOOD, (0, 0, 0), 0.03, 'hull'))
    ps.append(poly([(-1.9, 0.3), (1.9, 0.3), (2.1, 0.0), (-1.7, 0.0)], 1.15, (0, 0, 1.4), WOOD_D, (0, 0, 0), 0, 'band'))
    ps.append(box((4.3, 0.1, 0.12), (0, -0.5, 2.0), GOLDM))
    for x in (-1.6, -0.5, 0.6, 1.7):
        ps.append(box((0.1, 0.1, 0.6), (x, -0.5, 1.4), WOOD_D))
    for x in (-1.2, 0.3, 1.4):
        o = sph(0.22, (x, -0.58, 0.75), TEAL, 6, 4, (1, 0.3, 1)); E(o, TEAL); ps.append(o)
    # cordages
    for sx in (-1.4, 1.4):
        ps.append(rod3((sx, -0.4, 2.0), (sx * 0.8, -0.3, 2.7), 0.05, WOOD_D))
        ps.append(rod3((sx, 0.4, 2.0), (sx * 0.8, 0.3, 2.7), 0.05, WOOD_D))
    # fanion
    ps.append(poly([(0, 0), (0.9, -0.25), (0, -0.55)], 0.05, (0.0, 0, 5.5), GOLDM, (0, 0, 0), 0, 'flag'))
    ps.append(cyl(0.04, 0.5, (0, 0, 5.3), WOOD_D, 5))
    for p in ps:
        p.parent = g
    # helice arriere
    pg = empty('prop', (-2.6, 0, 1.0))
    pg.parent = g
    hub = cyl(0.2, 0.4, (0, 0, 0), STONE_D, 6, rot=(0, 90, 0), center=True); hub.parent = pg
    blades = []
    for a in (0, 120, 240):
        bl = box((0.08, 0.34, 1.15), (-0.12, 0, 0), '#b8fff0', (a, 0, 0), 0.0)
        bl.data.materials.clear(); bl.data.materials.append(mat('#b8fff0', 1)); bl.parent = pg
    # petites ailes magiques
    for s_ in (-1, 1):
        w = poly([(0, 0), (0.6, 0.5), (1.6, 0.7), (1.2, 0.0), (1.5, -0.5), (0.6, -0.3)], 0.08, (0.4, s_ * 0.7, 0.8), GOLDM, (s_ * 78, 0, 0), 0, 'wing')
        w.parent = g
    add_render('bv', 64, 48, mode='fixed', ppu=0.113, anchor=(31, 41), az=18, el=10, ss=6, margin=1, t_light=0.9)
    sc = bpy.context.scene
    sc['px_ambient'] = 0.30
    spec = json.loads(sc['px_renders'])[0]
    frames = []
    bob = [0.0, 0.11, 0.2, 0.11]
    sway = [0.0, 0.05, 0.0, -0.05]
    d = os.path.join(TMPD, 'bv'); os.makedirs(d, exist_ok=True)
    for i in range(4):
        g.location = (0, 0, bob[i])
        bal.location = (0, 0, 3.4 + sway[i])
        pg.rotation_euler = (math.radians(i * 30), 0, 0)
        spec['key'] = 'bv_%d' % i
        frames.append(Image.open(run_render(spec, d)).convert('RGBA'))
    sheet(frames).save(os.path.join(PNG_DIR, 'bateau_vol.png'))
    save_blend('bateau_vol')


# ------------------------------------------------------------------ iles (pillage / defense)
def island(ground=GRASS, ground2=GRASS_D):
    cyl(6.2, 0.25, (0, 0, -0.25), ground, 20, name='ground')
    cyl(5.6, 0.1, (0, 0, -0.02), ground2, 20, name='ground2')


def house(x, y, W=2.0, D=1.6, wh=1.2, rh=1.0, wall=WOOD, roof='#c0453a', burnt=False):
    box((W, D, wh), (x, y, 0), WOOD_D if burnt else wall, bevel=0.02)
    prism(W, D, rh, (x, y, wh), '#3a2c3a' if burnt else roof, ov=0.2)
    win(x - W * 0.25, y - D / 2, 0.55, 0.35, 0.35)
    door(x + W * 0.2, y - D / 2, 0, 0.5, 0.8)


def figure(x, y, col, s=1.0, weapon=True, z=0):
    cyl(0.17 * s, 0.6 * s, (x, y, z), col, 6, r2=0.12 * s)
    sph(0.15 * s, (x, y, z + 0.72 * s), '#e8b890', 6, 5)
    sph(0.16 * s, (x, y + 0.02, z + 0.78 * s), DARK, 6, 4, (1, 1, 0.7))
    if weapon:
        rod3((x + 0.25 * s, y, z + 0.1), (x + 0.3 * s, y, z + 1.2 * s), 0.025 * s, '#c9d2e0')


def flames(x, y, s=1.0, z=0):
    fire(x, y, 0.35 * s, z)


def black_smoke(x, y, z, n=4, s=0.3):
    smoke(x, y, z, n, s, cols=('#5a5468', '#3a3448'))


def ile_pillage():
    reset_scene()
    island('#6a8a40', '#587a38')
    box((1.6, 3.2, 0.06), (0, -3.6, 0), '#c9a86a', bevel=0.01)
    for p in [(-5.0, 1.5, 1.1), (5.0, 1.0, 1.0), (4.6, 3.0, 0.9)]:
        tree(*p)
    # maisons : une ecroulee, une en feu
    house(-2.8, 0.6, 2.2, 1.7, 1.2, 1.0, WOOD, '#c0453a')
    house(2.6, 0.9, 2.0, 1.6, 1.2, 1.0, burnt=True)
    flames(2.6, 0.9, 2.6, 2.2); flames(3.3, 0.4, 1.8, 2.1)
    black_smoke(2.6, 0.9, 2.8, 5, 0.36); black_smoke(-2.4, 0.6, 2.4, 4, 0.3)
    flames(-2.2, 0.7, 1.6, 2.2)
    # rempart brise
    box((2.2, 0.8, 1.5), (-1.2, -2.2, 0), STONE, bevel=0.03); bricks(2.2, 0.8, 1.5, 0)
    box((1.2, 0.8, 0.8), (1.2, -2.2, 0), STONE, bevel=0.03)
    for i, (x, y, z, r_) in enumerate([(0.2, -2.5, 0, 25), (0.5, -1.9, 0, -30), (-0.1, -1.7, 0, 60), (1.6, -2.7, 0, 10)]):
        box((0.4, 0.35, 0.3), (x, y, z), STONE_L, (0, 0, r_), 0.02)
    box((0.3, 0.3, 0.3), (-2.0, -2.2, 1.5), STONE_L); box((0.3, 0.3, 0.3), (-0.5, -2.2, 1.5), STONE_L)
    # drapeau ennemi, assaillants, echelle
    flag(0.4, -0.2, 2.8, '#2a1a3a', w=1.1)
    for x, y, c in ((-0.6, -3.1, '#6a2a3a'), (0.4, -3.4, '#3a2a58'), (1.4, -3.0, '#6a2a3a'), (-1.6, -3.6, '#3a2a58')):
        figure(x, y, c, 1.6)
    rod3((-1.7, -3.0, 0), (-1.5, -2.0, 1.4), 0.05, WOOD_L); rod3((-1.3, -3.0, 0), (-1.1, -2.0, 1.4), 0.05, WOOD_L)
    # butin
    crate(-0.4, 0.2, 0.5); sack(-0.8, -0.2); barrel(0.3, 0.6)
    add_render('ile_pillage', 160, 120, mode='fixed', ppu=0.060, anchor=(80, 74), az=AZ, el=EL, ss=3, t_light=0.9)
    finish_model('ile_pillage')


def ile_defense():
    reset_scene()
    island()
    box((1.6, 3.2, 0.06), (0, -3.6, 0), '#c9a86a', bevel=0.01)
    for p in [(-5.0, 1.5, 1.1), (5.0, 1.0, 1.0), (4.6, 3.0, 0.9)]:
        tree(*p)
    house(-2.6, 1.8, 2.0, 1.6, 1.1, 0.9); house(2.8, 2.0, 2.0, 1.6, 1.1, 0.9, WOOD, '#4a6ab8')
    smoke(-2.6, 1.8, 2.0, 3, 0.2)
    ST = '#aeb2c4'
    for x0, w in ((-4.2, 3.0), (1.2, 3.0)):
        box((w, 1.0, 1.6), (x0 + w / 2, -2.0, 0), ST, bevel=0.02); bricks(w, 1.0, 1.6, 0)
        box((w + 0.1, 1.2, 0.16), (x0 + w / 2, -2.0, 1.6), STONE_L)
        for i in range(4):
            box((0.45, 0.3, 0.4), (x0 + 0.4 + i * 0.75, -2.45, 1.76), STONE_L)
    # tour centrale
    cyl(1.0, 3.2, (0, -2.0, 0), ST, 8, bevel=0.02); cyl(1.2, 0.2, (0, -2.0, 3.2), STONE_L, 8)
    for i in range(4):
        a = math.radians(i * 90 + 45); box((0.5, 0.5, 0.4), (math.cos(a) * 1.05, -2.0 + math.sin(a) * 1.05, 3.5), STONE_L)
    E(box((0.3, 0.12, 0.55), (0, -3.0, 1.8), WIN), WIN)
    cyl(1.0, 0.0001, (0, -2.0, 3.6), ST, 8)
    flag(0, -2.0, 1.4, '#4a6ab8', z=3.4, w=1.2)
    ballista(-2.7, -2.0, 1.76, 1.3, -80); ballista(2.8, -2.0, 1.76, 1.3, -100)
    banner(-1.4, -2.55, 0.7, '#4a6ab8', 0.9); banner(1.4, -2.55, 0.7, '#4a6ab8', 0.9)
    for x, c in ((-3.5, '#4a6ab8'), (-1.7, '#4a6ab8'), (3.4, '#4a6ab8')):
        figure(x, -2.0, c, 1.4, z=1.76)
    # pieux + fleches en vol
    for i in range(7):
        cyl(0.08, 0.8, (-3.3 + i * 1.1, -3.4, 0), WOOD_D, 5, r2=0.0).rotation_euler = (math.radians(-22), 0, 0)
    for x, y, z, tx, ty, tz in ((-2.0, -2.0, 2.0, -0.2, -4.2, 0.9), (2.3, -2.0, 2.0, 1.2, -4.6, 1.2), (-2.6, -2.0, 1.9, -2.6, -4.8, 0.6)):
        rod3((x, y, z), (tx, ty, tz), 0.035, '#e8e0c8')
    figure(-0.9, -4.6, '#6a2a3a', 1.6); figure(1.6, -4.9, '#3a2a58', 1.6)
    crate(0.0, 0.8, 0.5); barrel(0.7, 0.6)
    add_render('ile_defense', 160, 120, mode='fixed', ppu=0.062, anchor=(80, 74), az=AZ, el=EL, ss=3, t_light=0.9)
    finish_model('ile_defense')


if __name__ == '__main__':
    a = sys.argv[1:] or ['all']
    ids = [int(x) for x in a if x.isdigit()]
    if 'planets' in a or 'all' in a:
        for n in (ids or range(1, 11)):
            planet(n)
        if not ids:
            planete_joueur()
    elif ids:
        for n in ids: planet(n)
    if 'joueur' in a: planete_joueur()
    if 'fond' in a or 'all' in a: galaxie_fond()
    if 'bateau' in a or 'all' in a: airship()
    if 'iles' in a or 'all' in a:
        ile_pillage(); ile_defense()
