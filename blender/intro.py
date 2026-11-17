"""intro.py - planches de l'intro en bande dessinee : intro_1..intro_6 (320x180), fx_vortex (8 x 96x96), intro_frame (48x48, 9-slice 12).

Contrairement aux autres scripts (camera orthographique, fond transparent) on utilise ici de vraies scenes en PERSPECTIVE,
eclairees (Cycles CPU) : lumiere de l'ecran, lune, neons. Post-traitement "pixel art" :
  rendu 3x -> reduction (moyenne) -> halo (glow) -> palette UNIQUE partagee par les 6 planches (median cut + couleurs du jeu)
  -> tramage ordonne leger -> contour 1 px #1d1430 entre objets (passes d'identifiants + profondeur).
Usage : intro.py [1..6 | panels | vortex | frame]   (sans argument : tout)
"""
import sys, os, random, tempfile
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *
from mathutils import Quaternion
from PIL import ImageFilter, ImageDraw

W, H, SS = 320, 180, 3
CACHE = os.path.join(tempfile.gettempdir(), 'px_intro_cache')
os.makedirs(CACHE, exist_ok=True)

# ---- couleurs de la scene (coherentes d'une planche a l'autre)
HOOD, HOOD_D, HOOD_L = '#a32638', '#7a1a2c', '#c4384a'
SKIN, HAIR, PANTS = '#e6a47c', '#3b2f55', '#34406a'
WALL, WALL_D, FLOOR = '#4a4880', '#3a3868', '#3d2f52'
SCREEN_L = '#78b4ff'
PINK, TEALC, GOLDC = '#ff7ad9', '#4de0c0', '#ffcf4a'

_M = {}


def M(hexcol, e=0.0, rough=0.9):
    k = (hexcol, e, rough)
    if k in _M and _M[k].name in bpy.data.materials:
        return _M[k]
    m = bpy.data.materials.new('i_%s_%s' % (hexcol.lstrip('#'), e))
    m.use_nodes = True
    nt = m.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    if e:
        sh = nt.nodes.new('ShaderNodeEmission')
        sh.inputs['Color'].default_value = hex_lin(hexcol)
        sh.inputs['Strength'].default_value = e
    else:
        sh = nt.nodes.new('ShaderNodeBsdfPrincipled')
        sh.inputs['Base Color'].default_value = hex_lin(hexcol)
        sh.inputs['Roughness'].default_value = rough
        for kk in ('Specular IOR Level', 'Specular'):
            if kk in sh.inputs:
                sh.inputs[kk].default_value = 0.15
    nt.links.new(sh.outputs[0], out.inputs['Surface'])
    _M[k] = m
    return m


def GM(stops, e=1.0, axis=2):
    """Materiau emissif a degrade le long d'un axe (coordonnees generees 0..1). stops=[(pos, hex)]."""
    name = 'g_%s_%s_%d' % ('_'.join('%s' % s[1].lstrip('#') for s in stops), e, axis)
    m = bpy.data.materials.get(name)
    if m:
        return m
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    em = nt.nodes.new('ShaderNodeEmission')
    em.inputs['Strength'].default_value = e
    tc = nt.nodes.new('ShaderNodeTexCoord')
    sp = nt.nodes.new('ShaderNodeSeparateXYZ')
    cr = nt.nodes.new('ShaderNodeValToRGB')
    el = cr.color_ramp.elements
    while len(el) < len(stops):
        el.new(0.5)
    for i, (p, c) in enumerate(stops):
        el[i].position = p
        el[i].color = hex_lin(c)
    nt.links.new(tc.outputs['Generated'], sp.inputs[0])
    nt.links.new(sp.outputs[axis], cr.inputs['Fac'])
    nt.links.new(cr.outputs['Color'], em.inputs['Color'])
    nt.links.new(em.outputs[0], out.inputs['Surface'])
    return m


class G:
    """with G('nom') : les objets crees dedans forment un groupe (un seul contour exterieur)."""
    def __init__(self, name):
        self.name = name
    def __enter__(self):
        self.before = set(bpy.data.objects.keys())
        return self
    def __exit__(self, *a):
        for k in set(bpy.data.objects.keys()) - self.before:
            bpy.data.objects[k]['grp'] = self.name


def new_scene(sky=None):
    sc = reset_scene()
    _M.clear()
    sc.render.film_transparent = False
    sc.render.dither_intensity = 0.0
    sc.cycles.use_denoising = True
    try:
        sc.cycles.denoiser = 'OPENIMAGEDENOISE'
    except Exception:
        pass
    bpy.context.preferences.filepaths.save_version = 0
    w = bpy.data.worlds.new('w')
    w.use_nodes = True
    nt = w.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    out = nt.nodes.new('ShaderNodeOutputWorld')
    bg = nt.nodes.new('ShaderNodeBackground')
    if sky:
        tc = nt.nodes.new('ShaderNodeTexCoord')
        sp = nt.nodes.new('ShaderNodeSeparateXYZ')
        mr = nt.nodes.new('ShaderNodeMapRange')
        mr.inputs[1].default_value, mr.inputs[2].default_value = -0.05, 0.75
        cr = nt.nodes.new('ShaderNodeValToRGB')
        el = cr.color_ramp.elements
        while len(el) < len(sky):
            el.new(0.5)
        for i, (p, c) in enumerate(sky):
            el[i].position = p
            el[i].color = hex_lin(c)
        nt.links.new(tc.outputs['Generated'], sp.inputs[0])
        nt.links.new(sp.outputs[2], mr.inputs[0])
        nt.links.new(mr.outputs[0], cr.inputs['Fac'])
        nt.links.new(cr.outputs['Color'], bg.inputs['Color'])
        bg.inputs['Strength'].default_value = 1.0
    else:
        bg.inputs['Color'].default_value = hex_lin('#3a3280')
        bg.inputs['Strength'].default_value = 1.0
    nt.links.new(bg.outputs[0], out.inputs[0])
    sc.world = w
    return sc


def cam_at(loc, tgt, lens=28, roll=0.0):
    sc = bpy.context.scene
    cd = bpy.data.cameras.new('cam')
    cd.type = 'PERSP'
    cd.lens = lens
    cd.sensor_width = 36
    cd.sensor_fit = 'HORIZONTAL'
    cd.clip_start, cd.clip_end = 0.05, 400
    co = bpy.data.objects.new('cam', cd)
    sc.collection.objects.link(co)
    q = (Vector(tgt) - Vector(loc)).to_track_quat('-Z', 'Y')
    q = q @ Quaternion((0, 0, 1), math.radians(roll))
    co.rotation_euler = q.to_euler()
    co.location = loc
    sc.camera = co
    return co


def light(kind, loc, tgt=None, energy=100, col='#ffffff', size=0.5, size_y=None, spot=60, blend=0.4):
    sc = bpy.context.scene
    ld = bpy.data.lights.new('L', kind)
    ld.energy = energy
    r_, g_, b_ = h2rgb(col)
    ld.color = (r_ / 255, g_ / 255, b_ / 255)
    if kind == 'AREA':
        ld.shape = 'RECTANGLE'
        ld.size, ld.size_y = size, size_y or size
    elif kind == 'POINT':
        ld.shadow_soft_size = size
    elif kind == 'SPOT':
        ld.shadow_soft_size = size
        ld.spot_size = math.radians(spot)
        ld.spot_blend = blend
    elif kind == 'SUN':
        ld.angle = math.radians(3)
    lo = bpy.data.objects.new('L', ld)
    sc.collection.objects.link(lo)
    lo.location = loc
    if tgt is not None:
        lo.rotation_euler = (Vector(tgt) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
    lo.visible_camera = False
    return lo


def emis(o, hexcol, e=1.0):
    o.data.materials.clear()
    o.data.materials.append(M(hexcol, e))
    return o


# ---------------------------------------------------------------- petits objets du decor
def can(x, y, z, col='#2fa8e8', rot=(0, 0, 0), s=1.0, stripe='#7cff5a'):
    g = empty('can', (x, y, z), rot, s)
    cyl(0.033, 0.125, (0, 0, 0), col, 10).parent = g
    cyl(0.0335, 0.03, (0, 0, 0.045), stripe, 10).parent = g
    cyl(0.03, 0.008, (0, 0, 0.125), '#c9d2e0', 10).parent = g
    return g


def paper(x, y, z, rot=(0, 0, 0), s=1.0, col='#f2ead6', lines=True):
    g = empty('paper', (x, y, z), rot, s)
    box((0.21, 0.297, 0.003), (0, 0, 0), col, center=True).parent = g
    if lines:
        for i in range(3):
            box((0.15, 0.012, 0.004), (0, -0.08 + i * 0.07, 0.0), '#6a78b8', center=True).parent = g
    return g


def figurine(x, y, z, col='#ff7ad9', hair='#4de0c0', rot=(0, 0, 0), s=1.0, name='fig'):
    g = empty(name, (x, y, z), rot, s)
    cyl(0.07, 0.015, (0, 0, 0), '#1d1d2e', 14).parent = g
    cyl(0.045, 0.16, (0, 0, 0.015), col, 10, r2=0.025).parent = g
    sph(0.05, (0, 0, 0.22), SKIN, 10, 8).parent = g
    sph(0.058, (0, -0.01, 0.235), hair, 10, 8, (1, 1, 0.9)).parent = g
    for sx in (-1, 1):
        cyl(0.018, 0.12, (sx * 0.07, 0, 0.17), hair, 6, r2=0.0, rot=(0, sx * 20, 0)).parent = g
    return g


def monitor(x, y, z, mode='title', w=0.95, h=0.55):
    """Ecran oriente vers -y."""
    with G('monitor'):
        box((w + 0.07, 0.05, h + 0.07), (x, y + 0.02, z + 0.2), '#15141f', bevel=0.012)
        box((0.09, 0.07, 0.17), (x, y + 0.04, z + 0.03), '#1b1a28')
        box((0.4, 0.22, 0.03), (x, y + 0.05, z), '#1b1a28', bevel=0.01)
    cz = z + 0.2 + (h + 0.07) / 2
    sy = y - 0.006
    with G('screen'):
        screen_content((x, sy, cz), w, h, mode)
    return (x, sy, cz)


def screen_content(c, w, h, mode='title'):
    cx, y, cz = c

    def px(u, v):   # coordonnees ecran (-0.5..0.5) -> monde
        return (cx + u * w, y - 0.004, cz + v * h)
    sky = box((w, 0.004, h), (cx, y, cz), '#000000', center=True)
    sky.data.materials.clear()
    if mode == 'burst':
        sky.data.materials.append(GM([(0, '#9ff4e0'), (1, '#e8fffa')], 1.6))
        return
    sky.data.materials.append(GM([(0, '#6a3a9a'), (0.28, '#2c2a78'), (0.6, '#171858'), (1, '#0b0c33')], 1.0))
    rg = random.Random(5)
    for i in range(26):                                  # etoiles
        u, v = rg.uniform(-0.48, 0.48), rg.uniform(-0.05, 0.47)
        s = rg.choice((0.006, 0.008, 0.011))
        c_ = '#ffffff' if i % 3 else GOLDC
        emis(box((s, 0.002, s), px(u, v), '#000000', center=True), c_, 2.0)
    # collines
    o = poly([(a * w, b * h) for a, b in [(-0.5, -0.5), (0.5, -0.5), (0.5, -0.36), (0.3, -0.31), (0.12, -0.38), (-0.1, -0.33), (-0.32, -0.4), (-0.5, -0.34)]],
             0.003, (cx, y - 0.003, cz), '#000000', (0, 0, 0), 0)
    emis(o, '#100d2c', 1.0)
    # tour (a gauche, monte vers les etoiles)
    tx = -0.18
    segs = [(-0.4, 0.10, 0.075), (-0.2, 0.075, 0.06), (0.0, 0.06, 0.05), (0.2, 0.05, 0.04)]
    for i, (v0, wb, wt) in enumerate(segs):
        v1 = segs[i + 1][0] if i + 1 < len(segs) else 0.34
        pts = [(tx - wb, v0), (tx + wb, v0), (tx + wt, v1), (tx - wt, v1)]
        o = poly([(a * w, b * h) for a, b in pts], 0.003, (cx, y - 0.003, cz), '#000000', (0, 0, 0), 0)
        emis(o, '#a9a4c4' if i % 2 == 0 else '#9b96b8', 1.0)
        pts2 = [(tx + wb * 0.25, v0), (tx + wb, v0), (tx + wt, v1), (tx + wt * 0.25, v1)]
        o = poly([(a * w, b * h) for a, b in pts2], 0.003, (cx, y - 0.0045, cz), '#000000', (0, 0, 0), 0)
        emis(o, '#6f6a96', 1.0)
        for j in range(2):                                # fenetres dorees
            vv = v0 + (v1 - v0) * (0.3 + 0.35 * j)
            emis(box((0.02 * w, 0.002, 0.03 * h), px(tx - 0.012 + 0.02 * (j % 2), vv), '#000000', center=True), GOLDC, 2.0)
    o = poly([(-0.06 * w, 0), (0.06 * w, 0), (0, 0.12 * h)], 0.003, (cx + tx * w, y - 0.003, cz + 0.34 * h), '#000000', (0, 0, 0), 0)
    emis(o, '#d2603a', 1.0)
    st = poly(star_pts(4, 0.06 * h, 0.014 * h), 0.003, (cx + tx * w, y - 0.005, cz + 0.49 * h * 0.97), '#000000', (0, 0, 0), 0)
    emis(st, '#ffffff', 3.0)
    if mode == 'fall':
        return
    # titre : barres dorees "texte" + sous-titre
    bars = [(-0.30, 0.10), (-0.17, 0.09), (-0.05, 0.11), (0.08, 0.10), (0.20, 0.12), (0.34, 0.08)]
    for u, ww in bars:
        emis(box((ww * w * 0.72, 0.003, 0.085 * h), px(u * 0.72 + 0.17, 0.37), '#000000', bevel=0.004, center=True), GOLDC, 2.2)
    for u, ww in [(-0.12, 0.26), (0.17, 0.2)]:
        emis(box((ww * w * 0.8, 0.003, 0.03 * h), px(u * 0.8 + 0.2, 0.27), '#000000', center=True), '#fff0a0', 1.6)
    # bouton "start"
    emis(box((0.30 * w, 0.003, 0.11 * h), px(0.2, -0.24), '#000000', bevel=0.006, center=True), GOLDC, 2.0)
    o = emis(box((0.27 * w, 0.003, 0.085 * h), px(0.2, -0.24), '#000000', bevel=0.006, center=True), TEALC, 2.6)
    o.location.y -= 0.0012
    for u in (-0.04, 0.0, 0.04, 0.08):
        o = emis(box(((0.025 if u != 0.08 else 0.04) * w, 0.003, 0.03 * h), px(0.15 + u, -0.24), '#000000', center=True), '#ffffff', 2.5)
        o.location.y -= 0.0025


# ---------------------------------------------------------------- personnage
def figure(at, yaw=0.0, lean=6, head=(0, 0), arms='desk', mouth=0.0, wide=False, face=True, s=1.0, hand_target=None, hand_world=None):
    """Jeune adulte en hoodie rouge sombre, cheveux sombres en bataille. Origine = bassin, regarde +y."""
    root = empty('fig', at, (0, 0, yaw), s)
    to = empty('torso', (0, 0, 0), (-lean, 0, 0))
    to.parent = root

    def P(o, par=to):
        o.parent = par
        return o
    with G('perso'):
        P(box((0.42, 0.24, 0.52), (0, 0, 0.0), HOOD, bevel=0.05))
        P(box((0.27, 0.03, 0.1), (0, 0.115, 0.1), HOOD_D, bevel=0.012))
        P(sph(0.2, (0, -0.09, 0.53), HOOD_D, 10, 6, (1, 0.55, 0.38)))                 # capuche
        P(cyl(0.055, 0.09, (0, 0, 0.5), SKIN, 8))                                     # cou
        hd = empty('head', (0, 0.02, 0.72), (head[1], 0, head[0]))
        hd.parent = to

        def Q(o):
            return P(o, hd)
        Q(sph(0.125, (0, 0, 0), SKIN, 14, 10, (0.92, 0.98, 1.1)))
        Q(sph(0.14, (0, -0.03, 0.03), HAIR, 12, 8, (1.0, 1.0, 0.98)))
        rg = random.Random(11)
        for i in range(11):                                                           # meches en bataille
            a = rg.uniform(0, 2 * math.pi)
            el = rg.uniform(20, 80)
            d = Vector((math.cos(a) * math.cos(math.radians(el)), math.sin(a) * math.cos(math.radians(el)) * 0.9, math.sin(math.radians(el))))
            if d.y > 0.55:
                d.y *= 0.3
            q = d.to_track_quat('Z', 'Y').to_euler()
            Q(cyl(0.05, 0.1, tuple(d * 0.12 + Vector((0, -0.03, 0.03))), HAIR, 6, r2=0.0, rot=[math.degrees(t) for t in q]))
        for i, (x_, z_) in enumerate(((-0.06, 0.1), (0.02, 0.11), (0.08, 0.09))):     # frange
            Q(cyl(0.034, 0.11, (x_, 0.105, z_), HAIR, 6, r2=0.0, rot=(160 + (i - 1) * 8, (i - 1) * 14, 0)))
        for sx in (-1, 1):
            Q(sph(0.03, (sx * 0.118, 0.0, -0.005), SKIN, 8, 6, (0.5, 0.8, 1.0)))
        if face:
            er = 0.034 if wide else 0.028
            for sx in (-1, 1):
                Q(sph(er, (sx * 0.05, 0.108, 0.015), '#ffffff', 10, 8, (1, 0.45, 1.15 if wide else 1.0), name='eye'))
                Q(sph(er * 0.58, (sx * 0.05, 0.123, 0.013), '#3550b0', 8, 6, (1, 0.4, 1.0)))
                Q(sph(er * 0.3, (sx * 0.05, 0.128, 0.013), '#14122a', 6, 4, (1, 0.4, 1.0)))
                hl = sph(er * 0.2, (sx * 0.05 + 0.007, 0.131, 0.024), '#ffffff', 6, 4, (1, 0.4, 1))
                emis(hl, '#ffffff', 4.0)
                Q(hl)
                Q(box((0.05, 0.012, 0.011), (sx * 0.05, 0.106, 0.058 + (0.012 if wide else 0)), HAIR, (0, 0, sx * (-8 if wide else 8)), center=True))
            Q(cyl(0.014, 0.025, (0, 0.121, -0.025), '#e5ae88', 6, r2=0.004, rot=(-90, 0, 0)))
            if mouth > 0:
                Q(sph(0.02 * (0.7 + mouth), (0, 0.112, -0.065), '#4a1020', 8, 6, (1, 0.4, 0.5 + mouth)))
            else:
                Q(box((0.035, 0.01, 0.007), (0, 0.112, -0.065), '#7a3a40', center=True))
        sh = 0.24
        for sx in (-1, 1):
            if arms == 'desk':
                el_, ha = (sx * 0.31, 0.12, -0.24), (sx * (0.12 if sx < 0 else 0.30), 0.52, -0.3)
            else:   # reach
                el_, ha = (sx * 0.36, 0.32, 0.16), (sx * 0.2, 0.7, 0.34)
            if hand_target and sx > 0:
                ha = hand_target
                if hand_world:
                    bpy.context.view_layer.update()
                    ha = tuple(to.matrix_world.inverted() @ Vector(hand_world))
            P(rod3((sx * sh, 0, 0.18), el_, 0.058, HOOD, 8))
            P(rod3(el_, ha, 0.05, HOOD, 8))
            P(sph(0.048, ha, SKIN, 8, 6))
    with G('perso'):
        for sx in (-1, 1):
            kn = (sx * 0.11, 0.42, 0.0)
            ft = (sx * 0.11, 0.48, -0.5)
            P(rod3((sx * 0.1, 0, -0.03), kn, 0.075, PANTS, 8), root)
            P(rod3(kn, ft, 0.065, PANTS, 8), root)
            P(box((0.1, 0.2, 0.07), (sx * 0.11, 0.54, -0.55), '#e8e8f0', bevel=0.02), root)
    return root


def chair(x, y, yaw=0, tilt=0, z=0.0):
    g = empty('chair', (x, y, z), (tilt, 0, yaw))
    with G('chair'):
        for o in (box((0.52, 0.5, 0.1), (0, 0, 0.44), '#25243a', bevel=0.03),
                  box((0.5, 0.1, 0.6), (0, -0.25, 0.5), '#25243a', (-6, 0, 0), bevel=0.04),
                  box((0.5, 0.025, 0.14), (0, -0.30, 0.92), HOOD_D, (-6, 0, 0), bevel=0.01),
                  box((0.06, 0.45, 0.04), (-0.29, 0, 0.62), '#1b1a28'), box((0.06, 0.45, 0.04), (0.29, 0, 0.62), '#1b1a28'),
                  cyl(0.035, 0.34, (0, 0, 0.12), '#8a8aa0', 8)):
            o.parent = g
        for i in range(5):
            a = 72 * i + 20
            box((0.32, 0.045, 0.035), (math.cos(math.radians(a)) * 0.16, math.sin(math.radians(a)) * 0.16, 0.07), '#1b1a28', (0, 0, a)).parent = g
            sph(0.035, (math.cos(math.radians(a)) * 0.31, math.sin(math.radians(a)) * 0.31, 0.035), '#101018', 6, 4).parent = g
    return g


# ---------------------------------------------------------------- piece
RW, RD, RH = 2.4, 3.4, 2.7     # demi-largeur x, y avant (mur d'entree), hauteur
YM = 2.0                       # mur du fond


def room(screen='title'):
    ymax = YM
    with G('murs'):
        box((2 * RW, RD + ymax, 0.05), (0, (ymax - RD) / 2, -0.05), FLOOR)
        box((2 * RW, 0.1, RH), (0, ymax + 0.05, 0), WALL)                    # fond
        box((0.1, RD + ymax, RH), (-RW - 0.05, (ymax - RD) / 2, 0), WALL_D)  # gauche
        box((0.1, RD + ymax, RH), (RW + 0.05, (ymax - RD) / 2, 0), WALL_D)   # droite
        box((2 * RW, RD + ymax, 0.05), (0, (ymax - RD) / 2, RH), '#2a2850')  # plafond
        box((2 * RW, 0.1, RH), (0, -RD - 0.05, 0), WALL)                     # entree
        box((2 * RW, 0.02, 0.12), (0, ymax - 0.01, 0), '#2c2a54')            # plinthe
    with G('porte'):
        box((0.9, 0.06, 2.05), (1.5, -RD + 0.03, 0), '#6a4a3a', bevel=0.01)
        sph(0.04, (1.15, -RD + 0.08, 1.0), GOLDM, 8, 6)
    with G('tapis'):
        cyl(1.0, 0.012, (-0.3, -0.7, 0.0), '#3a5a9a', 24)
        cyl(0.8, 0.014, (-0.3, -0.7, 0.0), '#5a7ac8', 24)
    with G('neon'):
        emis(box((3.6, 0.03, 0.04), (0, ymax - 0.03, 2.5)), PINK, 6.0)
        emis(box((0.04, 0.03, 0.9), (-1.8, ymax - 0.03, 1.6)), PINK, 5.0)
    with G('bureau'):
        box((2.0, 0.8, 0.05), (0.2, 1.55, 0.72), '#6a4a38', bevel=0.012)
        for sx in (-1, 1):
            box((0.05, 0.75, 0.72), (0.2 + sx * 0.95, 1.55, 0), '#2a2236')
        box((1.9, 0.02, 0.4), (0.2, 1.93, 0.3), '#2a2236')
    monitor(0.2, 1.75, 0.77, screen)
    with G('clavier'):
        box((0.46, 0.15, 0.025), (0.05, 1.32, 0.77), '#232338', bevel=0.008)
        for i in range(2):
            box((0.42, 0.04, 0.006), (0.05, 1.3 + i * 0.05, 0.795), '#5a5a8a')
    with G('souris'):
        box((0.07, 0.11, 0.03), (0.5, 1.32, 0.77), '#232338', bevel=0.02)
    with G('etagere'):
        for zz in (0.95, 1.45, 1.95):
            box((0.28, 1.5, 0.04), (RW - 0.14, 0.9, zz), '#5a3c2e')
    rg = random.Random(3)
    cols = ['#ff7ad9', '#4de0c0', '#ffcf4a', '#6fd3ff', '#c58bff', '#ff6b3d']
    hairs = ['#4de0c0', '#ff7ad9', '#c58bff', '#ffcf4a', '#3550b0', '#ff6b3d']
    for i in range(12):
        zz = (0.97, 1.47, 1.97)[i // 4]
        with G('fig%d' % i):
            figurine(RW - 0.14 + rg.uniform(-0.03, 0.03), 0.3 + (i % 4) * 0.38, zz, cols[i % 6], hairs[(i * 5) % 6], (0, 0, rg.uniform(-100, -60) - 20 * (i % 2)), 1.25)
    with G('lit'):
        box((1.15, 2.1, 0.32), (-RW + 0.6, 0.85, 0.0), '#3a2c52', bevel=0.02)
        box((1.1, 2.0, 0.1), (-RW + 0.6, 0.85, 0.32), '#e8dff0', bevel=0.03)
        box((1.1, 1.1, 0.14), (-RW + 0.6, 1.3, 0.42), '#4a78c8', bevel=0.05)    # couette
        box((0.55, 0.38, 0.13), (-RW + 0.6, 0.0, 0.42), '#fff6e8', bevel=0.05)   # oreiller
        box((1.15, 0.06, 0.7), (-RW + 0.6, ymax - 0.05, 0.3), '#3a2c52')
    with G('fenetre'):                                                         # fenetre (mur gauche)
        emis(box((0.04, 1.0, 0.95), (-RW, 1.0, 0.88), '#000000'), '#2a3c8a', 1.5)
        for (yy, zz, sy_, sz_) in ((1.0, 0.85, 1.1, 0.06), (1.0, 1.85, 1.1, 0.06), (0.5, 0.85, 0.06, 1.05), (1.5, 0.85, 0.06, 1.05), (1.0, 0.85, 0.06, 1.05)):
            box((0.06, sy_, sz_), (-RW + 0.02, yy, zz), '#2a1c40')
        st = poly(star_pts(4, 0.1, 0.025), 0.01, (-RW + 0.04, 0.8, 1.5), '#000000', (0, 0, 90))
        st.rotation_euler = (0, 0, math.radians(90))
        emis(st, '#ffffff', 4.0)
    posters(ymax)
    with G('bazar'):
        for (x, y, z, c, st) in [(-0.45, 1.5, 0.745, '#2fa8e8', '#7cff5a'), (-0.38, 1.62, 0.745, '#e8486a', '#ffe27a'), (0.97, 1.5, 0.745, '#7cff5a', '#2a2236'),
                                 (0.85, 1.68, 0.745, '#2fa8e8', '#7cff5a'), (-1.2, 0.0, 0.0, '#e8486a', '#ffe27a'), (-1.0, -0.15, 0.0, '#2fa8e8', '#7cff5a'),
                                 (-0.7, 0.3, 0.0, '#7cff5a', '#2a2236'), (-1.35, 0.5, 0.0, '#2fa8e8', '#7cff5a')]:
            can(x, y, z, c, (0, 0, 0), 1.2, st)
        for (x, y, z, rz) in [(-0.55, 1.35, 0.745, 20), (-0.7, 1.55, 0.745, -15), (1.0, 1.3, 0.745, 8)]:
            paper(x, y, z + 0.004, (0, 0, rz), 1.0)
        box((0.32, 0.32, 0.06), (-0.7, 1.85, 0.745), '#d2603a', bevel=0.01)            # boite pizza
        cyl(0.04, 0.09, (0.78, 1.82, 0.745), '#f2ead6', 10)                              # tasse
        for i in range(3):
            box((0.13, 0.19, 0.025), (1.05, 1.9, 0.745 + i * 0.026), ['#c04a6a', '#4a6ab8', '#4a9a6a'][i], (0, 0, i * 8))     # mangas
        for i, (x, y) in enumerate([(-0.85, -0.2), (-1.05, 0.4), (-0.6, -0.5), (-1.45, -0.1)]):
            paper(x, y, 0.004, (0, 0, i * 53), 1.0)


def posters(ymax):
    specs = [(-1.05, 1.55, 0.62, 0.86, '#ff7ad9', '#ffcf4a', 'girl'), (1.55, 1.75, 0.6, 0.8, '#3fb0e8', '#fff6c0', 'robot'),
             (-0.2, 2.1, 0.5, 0.36, '#4de0c0', '#14122a', 'sun'), (0.0, 1.8, 0.55, 0.75, '#8a5ac8', '#ff7ad9', 'girl')]
    for i, (x, z, w, h, c1, c2, kind) in enumerate(specs):
        with G('poster%d' % i):
            if i == 3:     # sur le mur de gauche, a droite de la fenetre
                cx, cy = -RW + 0.03, -0.35
                box((0.02, w, h), (-RW + 0.015, cy, z - h), c1)
                sph(0.09, (cx, cy, z - h * 0.35), SKIN, 8, 6, (0.2, 1, 1.1))
                sph(0.13, (cx, cy, z - h * 0.32), c2, 8, 6, (0.15, 1, 1.1))
                box((0.012, 0.28, h * 0.3), (cx, cy, z - h * 0.95), '#ffffff')
                continue
            box((w, 0.02, h), (x, ymax - 0.012, z - h), c1)
            cx, cy = x, ymax - 0.025
            zb = z - h
            if kind == 'girl':
                sph(0.1 * w / 0.6, (cx, cy, zb + h * 0.62), SKIN, 8, 6, (1, 0.2, 1.1))
                sph(0.14 * w / 0.6, (cx, cy + 0.006, zb + h * 0.64), c2, 8, 6, (1, 0.15, 1.1))
                box((0.28 * w / 0.6, 0.012, h * 0.3), (cx, cy, zb + h * 0.1), '#ffffff')
            elif kind == 'robot':
                box((0.28, 0.012, 0.3), (cx, cy, zb + h * 0.25), '#2a3a6a')
                box((0.18, 0.014, 0.1), (cx, cy, zb + h * 0.62), '#c9d2e0')
                emis(box((0.06, 0.016, 0.03), (cx, cy, zb + h * 0.68), '#000000'), '#ff5a5a', 2.0)
                box((0.34, 0.012, 0.06), (cx, cy, zb + 0.05), c2)
            else:
                cyl(0.12, 0.012, (cx, cy, zb + h * 0.4), c2, 16, rot=(90, 0, 0))
                box((0.46, 0.012, 0.06), (cx, cy, zb + 0.04), c2)


def room_lights(rim=True, moon=True, top=True, k=1.0):
    if moon:
        light('AREA', (-2.0, 1.0, 1.4), (0.5, 0.8, 0.5), 150, '#6a8cff', 1.0, 1.0)   # lune par la fenetre
    if rim:
        light('POINT', (0.0, 1.8, 2.3), None, 100 * k, PINK, 0.3)
    if top:
        light('POINT', (0.0, 0.0, 2.5), None, 150 * k, '#8a7ad8', 0.4)


# ---------------------------------------------------------------- panneaux
def p2():
    sc = new_scene()
    room('title')
    chair(0.2, 0.62, 8)
    figure((0.2, 0.7, 0.55), yaw=6, lean=8, head=(-4, 4), arms='desk', face=False)
    room_lights()
    light('AREA', (0.2, 1.55, 1.3), (0.2, -0.4, 1.0), 900, SCREEN_L, 1.0, 0.7)
    light('POINT', (0.2, 1.3, 0.9), None, 55, '#9cc8ff', 0.2)
    cam_at((0.55, -0.9, 1.45), (0.2, 1.3, 1.08), 24)
    return sc


def p3():
    sc = new_scene()
    room('title')
    light('POINT', (0.2, 1.0, 1.1), None, 80, '#9cc8ff', 0.3)
    cam_at((-0.12, 0.62, 1.2), (0.2, 1.74, 1.26), 38)
    return sc


def p4():
    sc = new_scene()
    room('title')
    chair(0.2, 0.62, 8)
    figure((0.2, 0.7, 0.55), yaw=6, lean=14, head=(8, -4), arms='desk', mouth=0.6, wide=True, hand_target=(0.3, 0.5, -0.3), hand_world=(0.5, 1.31, 0.855))
    room_lights(top=False, k=0.5)
    light('AREA', (0.2, 1.6, 1.3), (0.2, 0.7, 1.25), 30, SCREEN_L, 0.95, 0.55)
    light('POINT', (-0.3, 1.2, 1.2), None, 18, '#ff9a60', 0.2)
    cam_at((-0.6, 1.68, 1.12), (0.08, 0.98, 1.1), 30)
    return sc


def p5():
    sc = new_scene()
    room('burst')
    chair(0.1, 0.2, 200, 24, 0.1)
    figure((0.25, 0.95, 1.05), yaw=4, lean=40, head=(0, 8), arms='reach', mouth=1.0, wide=True, hand_target=(0.16, 0.8, 0.4))
    rg = random.Random(9)
    for i in range(14):
        t = rg.uniform(0.15, 0.9)
        x = 0.2 + rg.uniform(-0.85, 0.85) * (1 - t) ** 0.5 * 1.1
        y = 1.5 - (1 - t) * 2.0 + rg.uniform(-0.1, 0.1) - 0.2
        z = 1.25 + rg.uniform(-0.7, 0.6) * (1 - t * 0.6)
        r_ = (rg.uniform(0, 360), rg.uniform(0, 360), rg.uniform(0, 360))
        if abs(x - 0.25) < 0.55 and abs(y - 0.95) < 0.6 and abs(z - 1.1) < 0.6:
            x += 0.9
        with G('fly%d' % i):
            k = i % 4
            if k == 0:
                can(x, y, z, ('#2fa8e8', '#e8486a', '#7cff5a')[i % 3], r_, 1.8, '#ffe27a')
            elif k == 1:
                paper(x, y, z, r_, 1.8)
            elif k == 2:
                figurine(x, y, z, PINK if i % 2 else TEALC, TEALC if i % 2 else GOLDC, r_, 2.4)
            else:
                paper(x, y, z, r_, 1.9, '#fff6c0')
    with G('vortex'):
        vortex_geo((0.2, 1.62, 1.22), 1.35)
    room_lights(k=0.4)
    light('POINT', (0.2, 1.3, 1.25), None, 250, '#6ff0d0', 0.4)
    light('POINT', (0.2, 1.0, 1.4), None, 120, GOLDC, 0.3)
    light('AREA', (0.2, 1.62, 1.25), (0.2, -0.5, 1.0), 220, '#c8fff4', 1.0, 0.6)
    cam_at((-1.9, -0.5, 1.5), (0.3, 1.25, 1.2), 22, -3)
    return sc


def p6():
    sc = new_scene()
    room('fall')
    chair(0.2, 0.55, 150, 0)
    for i, (x, y, z, rx, rz) in enumerate([(-0.1, 0.3, 0.55, 20, 30), (0.5, 0.2, 0.9, -30, 80), (0.8, 0.9, 0.15, 5, 10), (0.0, 0.9, 0.35, 15, 130),
                                         (-0.5, 0.6, 0.02, 0, 60), (1.0, -0.1, 0.02, 0, 100), (0.3, -0.3, 0.02, 0, 170), (0.6, 0.45, 0.55, 40, 20)]):
        with G('pap%d' % i):
            paper(x, y, z + 0.004, (rx, 0, rz), 2.0 if z > 0.1 else 1.5)
    with G('can'):
        can(0.9, 0.3, 0.033, '#2fa8e8', (0, 90, 70), 1.4)
    with G('sparkle'):
        st = poly(star_pts(4, 0.2, 0.035), 0.01, (0.75, 1.6, 1.75), '#000000', (0, 0, 0))
        emis(st, '#ffffff', 6.0)
        st2 = poly(star_pts(4, 0.1, 0.02), 0.01, (0.75, 1.59, 1.75), '#000000', (0, 45, 0))
        emis(st2, GOLDC, 6.0)
    with G('spin'):
        for k, (r_, a0, a1) in enumerate(((0.55, 20, 130), (0.55, 200, 300), (0.75, 100, 190))):
            emis(crescent(r_, a0, a1, 0.05, (0.2, 0.55, 0.85 + k * 0.1), '#000000', 0.01, 12, (90, 0, 0)), '#ffffff', 2.5)
    sz_ = 0.77 + 0.2 + (0.55 + 0.07) / 2
    with G('petit'):
        tiny_fall((0.2 - 0.18 * 0.95 + 0.06, 1.75 - 0.014, sz_ + 0.2 * 0.55))
    room_lights()
    light('AREA', (0.2, 1.55, 1.3), (0.2, 0.0, 1.0), 160, '#8ab4ff', 1.0, 0.7)
    light('POINT', (0.75, 1.4, 1.75), None, 60, GOLDC, 0.1)
    cam_at((0.95, -2.7, 1.62), (0.1, 1.1, 0.98), 24)
    return sc


def tiny_fall(c):
    """Petit personnage rouge qui tombe tete en bas dans l'ecran."""
    x, y, z = c
    g = empty('tiny', (x, y, z), (0, 0, 0))
    emis(box((0.038, 0.004, 0.05), (0, 0, 0), '#000000', (0, 0, 12), center=True), HOOD_L, 2.2).parent = g
    emis(sph(0.02, (0.004, 0, 0.04), '#000000', 8, 6), '#ffe0c0', 2.2).parent = g
    emis(sph(0.022, (0.002, 0.001, 0.05), '#000000', 8, 6, (1, 0.5, 0.8)), '#1d1430', 2.0).parent = g
    for sx in (-1, 1):
        emis(box((0.01, 0.004, 0.03), (sx * 0.03, 0, 0.03), '#000000', (0, 0, sx * -40), center=True), HOOD_L, 2.2).parent = g
        emis(box((0.01, 0.004, 0.035), (sx * 0.012, 0, -0.04), '#000000', (0, 0, sx * 10), center=True), '#8aa0ff', 2.0).parent = g
    for i in range(3):
        emis(box((0.004, 0.003, 0.07 - i * 0.015), (-0.03 + i * 0.03, 0.001, 0.12 + i * 0.01), '#000000', center=True), '#ffffff', 2.5).parent = g
    g.rotation_euler = (0, math.radians(165), 0)
    g.scale = (1.7, 1.7, 1.7)


def p1():
    sky = [(0.0, '#7a5a9e'), (0.18, '#3a3488'), (0.5, '#161850'), (1.0, '#080a30')]
    sc = new_scene(sky)
    rg = random.Random(4)
    with G('sol'):
        box((60, 40, 0.05), (0, 0, -0.05), '#2c2a48')
        box((60, 3.2, 0.12), (0, -2.1, -0.02), '#6a6688')         # trottoir
        box((60, 0.18, 0.15), (0, -0.5, -0.02), '#8a86a8')         # bordure
    BX, BY = 0.0, 3.0
    with G('immeuble'):
        box((4.4, 3.4, 8.6), (BX, BY, 0), '#54486f', bevel=0.03)
        box((4.7, 3.7, 0.3), (BX, BY, 8.6), '#4a3c66')
        for lv in range(5):
            box((4.5, 0.12, 0.12), (BX, BY - 1.72, 1.45 + lv * 1.6), '#8a7aa8')
    for lv in range(5):
        for col in range(3):
            x = BX - 1.3 + col * 1.3
            z = 1.2 + lv * 1.55 + 0.45
            lit = (lv == 3 and col == 1)
            with G('win%d_%d' % (lv, col)):
                box((0.85, 0.08, 0.1), (x, BY - 1.72, z - 0.04), '#2a2040')
                emis(box((0.8, 0.06, 0.8), (x, BY - 1.72, z), '#000000'), '#86c0ff' if lit else '#1c1a48', 4.0 if lit else 0.9)
                if not lit:
                    box((0.04, 0.07, 0.8), (x, BY - 1.73, z), '#3a2c5a')
                    box((0.8, 0.07, 0.04), (x, BY - 1.73, z + 0.2), '#3a2c5a')
                else:
                    box((0.9, 0.09, 0.07), (x, BY - 1.73, z - 0.45), '#c9d2e0')
                    box((0.07, 0.1, 0.8), (x - 0.4, BY - 1.74, z), '#2a2040')
                    box((0.07, 0.1, 0.8), (x + 0.4, BY - 1.74, z), '#2a2040')
                    box((0.9, 0.1, 0.07), (x, BY - 1.74, z + 0.4), '#2a2040')
                    box((0.26, 0.03, 0.22), (x - 0.04, BY - 1.74, z - 0.12), '#18163a', bevel=0.02)   # silhouette devant l'ecran
                    sph(0.075, (x - 0.04, BY - 1.745, z + 0.08), '#18163a', 8, 6)
    with G('porte'):
        box((0.9, 0.08, 1.3), (BX, BY - 1.72, 0.0), '#4a2c3a')
        emis(box((0.5, 0.06, 0.12), (BX, BY - 1.75, 1.45), '#000000'), '#ffcf4a', 2.5)
        box((1.3, 0.35, 0.1), (BX, BY - 1.85, 0.0), '#8a86a8')
    with G('toit'):
        box((0.9, 0.9, 0.7), (-1.2, BY, 8.9), '#5a4c76')
        cyl(0.55, 0.9, (1.0, BY, 8.9), '#7a4a30', 10)
        cyl(0.55, 0.3, (1.0, BY, 9.8), '#5a3a28', 10, r2=0.0)
        rod3((-1.3, BY, 9.2), (-1.3, BY, 10.8), 0.03, '#2a2040')
        rod3((-1.7, BY, 10.3), (-0.9, BY, 10.3), 0.025, '#2a2040')
        emis(sph(0.06, (-1.3, BY, 10.85), '#ff3a3a', 6, 4), '#ff3a3a', 6.0)
    with G('voisin_g'):
        box((3.6, 3.2, 6.0), (-4.6, BY + 0.3, 0), '#4a3c6c')
        box((3.8, 3.4, 0.25), (-4.6, BY + 0.3, 6.0), '#382e58')
    with G('voisin_d'):
        box((4.0, 3.4, 5.0), (4.9, BY + 0.2, 0), '#524272')
        box((4.2, 3.6, 0.25), (4.9, BY + 0.2, 5.0), '#382e58')
    for (bx, byy, ww, hh, seed) in ((-4.6, BY + 0.3 - 1.62, 3.6, 6.0, 1), (4.9, BY + 0.2 - 1.72, 4.0, 5.0, 2)):
        r2 = random.Random(seed)
        with G('vwin%d' % seed):
            for lv in range(int(hh // 1.5)):
                for cl in range(3):
                    warm = r2.random() < 0.35
                    emis(box((0.55, 0.05, 0.6), (bx - ww / 2 + 0.6 + cl * (ww - 1.2) / 2, byy, 1.0 + lv * 1.4), '#000000'), '#e0a850' if warm else '#1c1a48', 1.8 if warm else 0.8)
    with G('ville'):
        for i in range(14):
            x = -26 + i * 4.2 + rg.uniform(-1, 1)
            box((rg.uniform(2.5, 4), 2.5, rg.uniform(4, 12)), (x, 20, 0), '#1e1a44')
    with G('lampadaire'):
        cyl(0.07, 3.4, (-2.6, -1.9, 0), '#2a2040', 8)
        box((0.6, 0.08, 0.08), (-2.35, -1.9, 3.35), '#2a2040')
        emis(box((0.3, 0.2, 0.1), (-2.1, -1.9, 3.28), '#000000'), '#ffe0a0', 6.0)
    with G('distrib'):
        box((0.8, 0.7, 1.7), (2.6, -1.6, 0), '#2a3a8a', bevel=0.03)
        emis(box((0.6, 0.03, 1.2), (2.6, -1.97, 0.35), '#000000'), '#7ad8ff', 2.4)
    sun = light('SUN', (0, 0, 5), None, 0, '#a0b8ff')
    sun.data.energy = 0.5
    sun.rotation_euler = (math.radians(58), 0, math.radians(-28))
    light('POINT', (-2.1, -2.0, 3.2), None, 900, '#ffd89a', 0.2)
    light('AREA', (BX - 0.3, BY - 2.6, 5.0), (BX, BY, 5.0), 500, '#7ab4ff', 0.6, 0.6)
    light('POINT', (2.6, -2.5, 1.0), None, 80, '#7ad8ff', 0.2)
    cam_at((1.6, -12.5, 1.3), (-0.1, BY, 5.3), 28, 0)
    return sc


def vortex_geo(c, R, scale=1.0, arms=6, per=26):
    """Tourbillon de rubans emissifs (teal/or/rose) jaillissant de c vers -y."""
    cx, cy, cz = c
    cols = [TEALC, GOLDC, PINK]
    for a in range(arms):
        base = 2 * math.pi * a / arms
        col = cols[a % 3]
        for i in range(per):
            t = i / (per - 1)
            ang = base + t * 2.8 * math.pi
            r = R * (0.12 + 0.88 * t ** 0.8)
            L = 0.16 * (1 - t * 0.5) * R
            wd = 0.075 * (1 - t * 0.6) * R
            o = box((L, wd, wd), (cx + math.cos(ang) * r, cy - t * 0.9 * scale, cz + math.sin(ang) * r), '#000000', center=True)
            o.rotation_euler = (math.radians(ang * 0 + 0), math.radians(math.degrees(-ang) - 90 + 20), 0)
            emis(o, col, 1.3)
    emis(sph(0.2 * R, (cx, cy - 0.04, cz), '#000000', 10, 8), '#ffffff', 3.0)
    emis(torus(0.36 * R, 0.04 * R, (cx, cy - 0.05, cz), '#000000', 24, 5, (90, 0, 0)), TEALC, 1.8)
    emis(torus(0.62 * R, 0.035 * R, (cx, cy - 0.3, cz), '#000000', 24, 5, (90, 0, 0)), GOLDC, 1.8)


EXPO = {4: -0.9, 5: -0.4, 1: -0.1}
PANELS = {1: p1, 2: p2, 3: p3, 4: p4, 5: p5, 6: p6}
GLOW = {1: 0.5, 2: 0.4, 3: 0.5, 4: 0.1, 5: 0.3, 6: 0.4}


# ---------------------------------------------------------------- rendu + post-traitement
def _override_all(mat_for):
    saved = []
    for o in bpy.context.scene.objects:
        if o.type != 'MESH':
            continue
        if not o.material_slots:
            o.data.materials.append(mat_for(o))
            saved.append((o, -1, None))
            continue
        for i, sl in enumerate(o.material_slots):
            saved.append((o, i, sl.material))
            sl.material = mat_for(o)

    def restore():
        for o, i, m in saved:
            if i >= 0:
                o.material_slots[i].material = m
            else:
                o.data.materials.clear()
    return restore


def _flat(col_lin, name):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    em = nt.nodes.new('ShaderNodeEmission')
    em.inputs['Color'].default_value = col_lin
    nt.links.new(em.outputs[0], out.inputs['Surface'])
    return m


def render_panel(n):
    sc = PANELS[n]()
    sc.render.resolution_x, sc.render.resolution_y = W * SS, H * SS
    sc.render.resolution_percentage = 100
    sc.view_settings.view_transform = 'Standard'
    sc.view_settings.look = 'None'
    sc.view_settings.exposure = EXPO.get(n, 0.0)
    sc.cycles.samples = int(os.environ.get('INTRO_SAMPLES', 56))
    p = os.path.join(TMPD, 'beauty.png')
    sc.render.filepath = p
    bpy.ops.render.render(write_still=True)
    beauty = np.asarray(Image.open(p).convert('RGB')).astype(np.float32) / 255.0
    # ---- passes identifiants / profondeur
    sc.cycles.use_denoising = False
    sc.cycles.samples = 1
    sc.render.filter_size = 0.01
    sc.view_settings.view_transform = 'Raw'
    sc.view_settings.exposure = 0.0
    sc.world.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.0
    sc.world.node_tree.nodes['Background'].inputs['Color'].default_value = (0, 0, 0, 1)
    for nd in list(sc.world.node_tree.nodes['Background'].inputs['Color'].links):
        sc.world.node_tree.links.remove(nd)
    mats, idx = {}, [0]

    def idmat(o):
        g = o.get('grp') or o.name
        if g not in mats:
            idx[0] += 1
            v = idx[0]
            mats[g] = _flat(((v * 53 % 251 + 2) / 255, (v * 97 % 253 + 2) / 255, (v * 29 % 249 + 2) / 255, 1), 'id_' + g)
        return mats[g]
    rs = _override_all(idmat)
    sc.render.filepath = os.path.join(TMPD, 'id.png')
    bpy.ops.render.render(write_still=True)
    ids = np.asarray(Image.open(sc.render.filepath).convert('RGB')).astype(np.int32)
    rs()
    dm = bpy.data.materials.new('depth')
    dm.use_nodes = True
    nt = dm.node_tree
    for nn in list(nt.nodes):
        nt.nodes.remove(nn)
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    em = nt.nodes.new('ShaderNodeEmission')
    cd = nt.nodes.new('ShaderNodeCameraData')
    mr = nt.nodes.new('ShaderNodeMath'); mr.operation = 'MULTIPLY'; mr.inputs[1].default_value = 255.0 / 40.0
    fl = nt.nodes.new('ShaderNodeMath'); fl.operation = 'FLOOR'
    fr = nt.nodes.new('ShaderNodeMath'); fr.operation = 'FRACT'
    dv = nt.nodes.new('ShaderNodeMath'); dv.operation = 'DIVIDE'; dv.inputs[1].default_value = 255.0
    cm = nt.nodes.new('ShaderNodeCombineXYZ')
    nt.links.new(cd.outputs['View Z Depth'], mr.inputs[0])
    nt.links.new(mr.outputs[0], fl.inputs[0]); nt.links.new(mr.outputs[0], fr.inputs[0])
    nt.links.new(fl.outputs[0], dv.inputs[0])
    nt.links.new(dv.outputs[0], cm.inputs[0]); nt.links.new(fr.outputs[0], cm.inputs[1])
    nt.links.new(cm.outputs[0], em.inputs['Color'])
    nt.links.new(em.outputs[0], out.inputs['Surface'])
    rs = _override_all(lambda o: dm)
    sc.render.filepath = os.path.join(TMPD, 'depth.png')
    bpy.ops.render.render(write_still=True)
    dp = np.asarray(Image.open(sc.render.filepath).convert('RGB')).astype(np.float32)
    rs()
    o = SS // 2
    ids_s = ids[o::SS, o::SS]
    idv = ids_s[..., 0] * 65536 + ids_s[..., 1] * 256 + ids_s[..., 2]
    dp_s = dp[o::SS, o::SS]
    depth = dp_s[..., 0] + dp_s[..., 1] / 255.0
    sky = idv == 0
    depth = np.where(sky, 1e9, depth)
    small = beauty[:H * SS, :W * SS].reshape(H, SS, W, SS, 3).mean(axis=(1, 3))
    np.savez(os.path.join(CACHE, 'p%d.npz' % n), small=small, idv=idv, depth=depth, sky=sky)
    path = os.path.join(MODELS, 'intro_%d.blend' % n)
    bpy.ops.wm.save_as_mainfile(filepath=path, compress=True)
    try:
        os.remove(path + '1')
    except OSError:
        pass


BAYER = np.array([[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]], np.float32) / 16.0 - 0.5


def glow(small, k):
    lum = small @ np.array([0.3, 0.55, 0.15], np.float32)
    mask = np.clip((lum - 0.72) * 3.5, 0, 1)[..., None] * small
    im = Image.fromarray((np.clip(mask, 0, 1) * 255).astype(np.uint8))
    g1 = np.asarray(im.filter(ImageFilter.GaussianBlur(3))).astype(np.float32) / 255.0
    g2 = np.asarray(im.filter(ImageFilter.GaussianBlur(9))).astype(np.float32) / 255.0
    return np.clip(small + k * (0.9 * g1 + 0.8 * g2), 0, 1)


def finalize(only=None):
    """Palette commune + contours + etoiles ; ecrit intro_1..6.png."""
    data = {}
    for n in range(1, 7):
        f = os.path.join(CACHE, 'p%d.npz' % n)
        if os.path.exists(f):
            data[n] = np.load(f)
    sm = {n: np.clip(glow(d['small'], GLOW[n]) ** 0.92, 0, 1) for n, d in data.items()}
    mosaic = np.concatenate([sm[n] for n in sorted(sm)], axis=0)
    q = Image.fromarray((mosaic * 255).astype(np.uint8)).quantize(colors=64, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
    pal = np.array(q.getpalette()[:64 * 3], np.float32).reshape(-1, 3)
    extra = [OLC, '#ffffff', GOLDC, TEALC, PINK, '#f2e6c9', HOOD, HOOD_L, '#ffe0b0', '#b8fff0', '#fff0a0', '#2a2858']
    pal = np.concatenate([pal, np.array([h2rgb(c) for c in extra], np.float32)], 0)
    outs = []
    for n in sorted(data):
        if only and n not in only:
            continue
        d = data[n]
        rgb = sm[n] * 255.0 + BAYER[(np.arange(H) % 4)[:, None], (np.arange(W) % 4)[None, :]][..., None] * 5.0
        col = snap_palette(rgb, pal).astype(np.uint8)
        idv, depth, sky = d['idv'], d['depth'], d['sky']
        ol = np.zeros((H, W), bool)
        for dy, dx in ((0, 1), (0, -1), (1, 0), (-1, 0)):
            ids_n = np.roll(idv, (dy, dx), (0, 1))
            dep_n = np.roll(depth, (dy, dx), (0, 1))
            farther = (depth > dep_n + 0.02) | ((np.abs(depth - dep_n) <= 0.02) & (idv > ids_n))
            m = (ids_n != idv) & farther
            if dy == 1: m[0, :] = False
            if dy == -1: m[-1, :] = False
            if dx == 1: m[:, 0] = False
            if dx == -1: m[:, -1] = False
            ol |= m
        col[ol] = h2rgb(OLC)
        if n == 1:
            col = stars(col, sky)
        outs.append((n, Image.fromarray(col, 'RGB').convert('RGBA')))
    for n, im in outs:
        im.save(os.path.join(PNG_DIR, 'intro_%d.png' % n))
    return outs


def stars(col, sky):
    """Etoiles du ciel nocturne (planche 1) : pixels + une etoile brillante en croix avec halo."""
    rg = random.Random(77)
    ys, xs = np.where(sky)
    top = ys < int(H * 0.62)
    cand = list(zip(xs[top], ys[top]))
    out = col.copy()
    for _ in range(80):
        x, y = cand[rg.randrange(len(cand))]
        if sky[max(y - 1, 0):y + 2, max(x - 1, 0):x + 2].all():
            out[y, x] = rg.choice(((255, 255, 255), (255, 240, 170), (184, 255, 240), (200, 190, 255)))
    sx, sy_ = 262, 34
    for dx in range(-9, 10):
        for dy in range(-9, 10):
            xx, yy = sx + dx, sy_ + dy
            if not (0 <= xx < W and 0 <= yy < H) or not sky[yy, xx]:
                continue
            ad, bd = abs(dx), abs(dy)
            if (dy == 0 and ad <= 8) or (dx == 0 and bd <= 8):
                out[yy, xx] = (255, 255, 255) if ad + bd <= 5 else (255, 240, 170)
            elif ad == bd and ad <= 3:
                out[yy, xx] = (255, 240, 170) if ad <= 2 else (184, 255, 240)
            elif ad + bd <= 2:
                out[yy, xx] = (255, 255, 255)
            elif ad + bd <= 4 and (dx + dy) % 2 == 0:
                out[yy, xx] = (120, 130, 210)
    return out


# ---------------------------------------------------------------- vortex anime
def fx_vortex():
    sc = new_scene()
    sc.render.film_transparent = True
    sc.cycles.use_denoising = False
    N = 8
    sc.frame_start, sc.frame_end = 0, N - 1
    arms, per = 6, 18
    cols = [TEALC, GOLDC, PINK]
    root = empty('vortex')
    for a in range(arms):
        base = 2 * math.pi * a / arms
        col = cols[a % 3]
        for i in range(per):
            t = i / (per - 1)
            ang = base + t * 1.9 * math.pi
            r = 0.35 + 2.0 * t ** 0.9
            L = 0.30 + 0.5 * t
            wd = 0.30 * (1 - 0.65 * t)
            o = box((L, 0.2, wd), (math.cos(ang) * r, 0, math.sin(ang) * r), '#000000', center=True)
            o.rotation_euler = (0, -(ang + math.pi / 2 + 0.25), 0)
            emis(o, col if i % 7 else '#ffffff', 1.0)
            o.parent = root
    emis(sph(0.38, (0, 0.1, 0), '#000000', 12, 8), '#ffffff', 1.0)
    for R, c, w in ((0.62, TEALC, 0.09), (0.95, GOLDC, 0.07)):
        emis(torus(R, w, (0, 0.05, 0), '#000000', 28, 5, (90, 0, 0)), c, 1.0)
    for f in range(N):
        root.rotation_euler = (0, math.radians(-360.0 / arms * 2 * f / N), 0)
        root.keyframe_insert('rotation_euler', frame=f)
    linear_keys(root)
    pal = [h2rgb(c) for c in (TEALC, GOLDC, PINK, '#ffffff')]
    pal += [(0x2a, 0x9a, 0x88), (0xb8, 0x8a, 0x20), (0xb0, 0x4a, 0x9a), (0xb8, 0xff, 0xf0), (0xff, 0xf0, 0xa0), (0xff, 0xc4, 0xf0)]
    fr = render_fx_frames(N, 96, 96, (0, 0, 5.6, (0, 0, 0)), pal, 3, outline=False)
    ensure_pil_save(sheet(fr), 'fx_vortex')
    p = os.path.join(MODELS, 'fx_vortex.blend')
    bpy.ops.wm.save_as_mainfile(filepath=p, compress=True)
    try:
        os.remove(p + '1')
    except OSError:
        pass


def frame9():
    """Cadre de case de BD 48x48, 9-slice 12 : bordure encre epaisse + fin liseré blanc interieur."""
    ink, white, grey = h2rgb('#0e0a1c') + (255,), h2rgb('#f2e6c9') + (255,), h2rgb('#8a7a9a') + (255,)
    im = Image.new('RGBA', (48, 48), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rectangle((0, 0, 47, 47), outline=ink, width=4)
    d.rectangle((4, 4, 43, 43), outline=white, width=1)
    d.rectangle((5, 5, 42, 42), outline=grey, width=1)
    for (x, y) in ((0, 0), (47, 0), (0, 47), (47, 47)):
        im.putpixel((x, y), (0, 0, 0, 0))
    for (x, y) in ((4, 4), (43, 4), (4, 43), (43, 43)):
        im.putpixel((x, y), ink)
    px = im.load()
    for y in range(6, 42):
        for x in range(6, 42):
            px[x, y] = (0, 0, 0, 0)
    im.save(os.path.join(PNG_DIR, 'intro_frame.png'))


if __name__ == '__main__':
    a = sys.argv[1:]
    nums = [int(x) for x in a if x.isdigit()]
    if not a or 'panels' in a or nums:
        for n in (nums or range(1, 7)):
            t = time.time()
            render_panel(n)
            print('panel', n, '%.0fs' % (time.time() - t), flush=True)
        finalize()
    if not a or 'vortex' in a:
        fx_vortex()
    if not a or 'frame' in a:
        frame9()
