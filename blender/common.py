"""
common.py - socle commun du pipeline d'assets 3D -> pixel art de "La Tour des Etoiles".

Principe :
  1. on construit un modele 3D procedural avec bpy (primitives + modificateurs),
     chaque materiau est defini par une couleur hex (et un drapeau "emissif") ;
  2. on le rend avec une camera ORTHOGRAPHIQUE (vue 3/4 type isometrique), fond transparent,
     en deux passes Cycles (CPU, peu d'echantillons, aucun GPU requis) :
        - passe "albedo"  : couleurs unies (emission) -> donne la couleur exacte de chaque materiau,
        - passe "ombrage" : diffuse blanc + soleil + ambiance -> donne lumiere/ombre (ombres portees reelles) ;
  3. post-traitement Pillow/numpy : reduction nearest/box, ombrage "toon" a 3 teintes
     (ombre violacee / base / lumiere chaude comme sh() du jeu), seuil alpha dur,
     contour 1 px #1d1430, palette limitee.
Les fichiers .blend gardent la specification de rendu (scene['px_renders']) -> rerender.py.
"""
import bpy, bmesh, math, os, sys, json, time
from mathutils import Vector, Matrix, Euler
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
ASSETS = os.path.join(ROOT, 'assets')
PNG_DIR = os.path.join(ASSETS, 'png')
MODELS = os.path.join(HERE, 'models')
import tempfile
TMPD = tempfile.mkdtemp(prefix='px_')
for d in (ASSETS, PNG_DIR, MODELS):
    os.makedirs(d, exist_ok=True)

# ---------------------------------------------------------------- palette du jeu
OLC = '#1d1430'
INK, PANEL, PANEL2, LINE, GOLD, RUST, TEAL = '#14122a', '#1c1b3c', '#2a2858', '#f2e6c9', '#ffcf4a', '#d2603a', '#4de0c0'
BLD_COL = {'auberge': '#c0453a', 'ferme': '#5a9a3a', 'camp': '#d08a2a', 'inf': '#3fb0a0', 'forge': '#5a5f78'}
ELEM_COL = {'feu': '#ff6b3d', 'glace': '#6fd3ff', 'foudre': '#c58bff', 'nature': '#6fdc6f',
            'sacre': '#ffe27a', 'ombre': '#8a7bd8', 'arcane': '#ff7ad9'}
# materiaux recurrents (repris des palettes de bSprite)
STONE, STONE_D, STONE_L = '#9a96ae', '#6f6a86', '#b9b5cc'
WOOD, WOOD_D, WOOD_L = '#a9744a', '#7a4a30', '#c98f5a'
CREAM, GOLDM, FIRE, DARK = '#f2ead6', '#e0b040', '#ff8a3a', '#3a2c4a'


def h2rgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def srgb2lin(c):
    c = c / 255.0
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def hex_lin(h, a=1.0):
    r, g, b = h2rgb(h)
    return (srgb2lin(r), srgb2lin(g), srgb2lin(b), a)


# ---------------------------------------------------------------- scene / materiaux
S = {'coll': None}   # etat global leger (collection courante)


def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'
    sc.cycles.device = 'CPU'
    sc.cycles.use_denoising = False
    sc.cycles.seed = 1
    sc.render.film_transparent = True
    sc.render.image_settings.file_format = 'PNG'
    sc.render.image_settings.color_mode = 'RGBA'
    sc.render.image_settings.color_depth = '8'
    sc.render.threads_mode = 'FIXED'
    sc.render.threads = 4
    sc.render.use_persistent_data = False
    S['coll'] = None
    sc['px_renders'] = '[]'
    return sc


class use_coll:
    """with use_coll('ui_only'): ... les objets crees vont dans la collection nommee."""
    def __init__(self, name):
        self.name = name
    def __enter__(self):
        sc = bpy.context.scene
        c = bpy.data.collections.get(self.name)
        if not c:
            c = bpy.data.collections.new(self.name)
            sc.collection.children.link(c)
        S['coll'] = c
        return c
    def __exit__(self, *a):
        S['coll'] = None


def mat(hexcol, emit=0.0):
    """Materiau 'toon' : une couleur hex. emit>0 -> materiau lumineux (fenetres, feu...)."""
    name = 'm_%s%s' % (hexcol.lstrip('#'), '_E' if emit else '')
    m = bpy.data.materials.get(name)
    if m:
        return m
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    if emit:
        sh = nt.nodes.new('ShaderNodeEmission')
        sh.inputs['Color'].default_value = hex_lin(hexcol)
        sh.inputs['Strength'].default_value = 1.0
    else:
        sh = nt.nodes.new('ShaderNodeBsdfPrincipled')
        sh.inputs['Base Color'].default_value = hex_lin(hexcol)
        sh.inputs['Roughness'].default_value = 1.0
        for k in ('Specular IOR Level', 'Specular'):
            if k in sh.inputs:
                sh.inputs[k].default_value = 0.0
    nt.links.new(sh.outputs[0], out.inputs['Surface'])
    m['px_hex'] = hexcol
    m['px_emit'] = float(emit)
    m.diffuse_color = hex_lin(hexcol)
    return m


def facing_mat(colors, invert=False, name=None, power=1.0):
    """Materiau lumineux 'toon spherique' pour les FX : rampe constante selon l'angle de vue."""
    name = name or 'fx_ramp_' + '_'.join(c.lstrip('#') for c in colors) + ('_i' if invert else '')
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
    lw = nt.nodes.new('ShaderNodeLayerWeight')
    lw.inputs['Blend'].default_value = 0.5
    cr = nt.nodes.new('ShaderNodeValToRGB')
    cr.color_ramp.interpolation = 'CONSTANT'
    n = len(colors)
    el = cr.color_ramp.elements
    while len(el) < n:
        el.new(0.5)
    for i, c in enumerate(colors[::-1]):    # colors[0] = bord (sombre) ... colors[-1] = centre (clair)
        el[i].position = i / n
        el[i].color = hex_lin(c)
    nt.links.new(lw.outputs['Facing'], cr.inputs['Fac'])
    nt.links.new(cr.outputs['Color'], em.inputs['Color'])
    nt.links.new(em.outputs[0], out.inputs['Surface'])
    m['px_hex'] = colors[-1]
    m['px_emit'] = 1.0
    m['px_fx'] = 1
    return m


def _finish(name, bm, m, at, rot, bevel, smooth=False):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new(name, me)
    (S['coll'] or bpy.context.scene.collection).objects.link(o)
    o.location = at
    o.rotation_euler = [math.radians(a) for a in rot]
    if m is not None:
        me.materials.append(m if not isinstance(m, str) else mat(m))
    if smooth:
        for p in me.polygons:
            p.use_smooth = True
    if bevel:
        b = o.modifiers.new('bevel', 'BEVEL')
        b.width = bevel
        b.segments = 1
        b.limit_method = 'ANGLE'
    return o


def box(size, at=(0, 0, 0), m=STONE, rot=(0, 0, 0), bevel=0.0, name='box', center=False):
    """Boite. `at` = centre du bas (centre si center=True). size=(x,y,z)."""
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    dz = 0 if center else size[2] / 2
    for v in bm.verts:
        v.co = Vector((v.co.x * size[0], v.co.y * size[1], v.co.z * size[2] + dz))
    return _finish(name, bm, m, at, rot, bevel)


def cyl(r, h, at=(0, 0, 0), m=STONE, n=12, r2=None, rot=(0, 0, 0), bevel=0.0, name='cyl', center=False, smooth=False):
    """Cylindre / tronc de cone / cone (r2=0). Base centree sur `at`."""
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=n, radius1=r,
                          radius2=(r if r2 is None else r2), depth=h)
    if not center:
        for v in bm.verts:
            v.co.z += h / 2
    return _finish(name, bm, m, at, rot, bevel, smooth)


def sph(r, at=(0, 0, 0), m=STONE, seg=12, rings=8, scale=(1, 1, 1), rot=(0, 0, 0), name='sph', smooth=True):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=rings, radius=r)
    for v in bm.verts:
        v.co = Vector((v.co.x * scale[0], v.co.y * scale[1], v.co.z * scale[2]))
    return _finish(name, bm, m, at, rot, 0, smooth)


def prism(w, d, h, at=(0, 0, 0), m=STONE, ov=0.0, rot=(0, 0, 0), name='roof', peak=0.0):
    """Toit a deux pans (faitage selon X). w=longueur X, d=profondeur Y, h=hauteur. ov=debord."""
    hw, hd = w / 2 + ov, d / 2 + ov
    bm = bmesh.new()
    v = [bm.verts.new(p) for p in [(-hw, -hd, 0), (hw, -hd, 0), (hw, hd, 0), (-hw, hd, 0),
                                   (-hw, 0, h), (hw, 0, h)]]
    for f in [(0, 1, 5, 4), (2, 3, 4, 5), (0, 4, 3), (1, 2, 5), (0, 3, 2, 1)]:
        bm.faces.new([v[i] for i in f])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return _finish(name, bm, m, at, rot, 0)


def pyramid(w, d, h, at=(0, 0, 0), m=STONE, rot=(0, 0, 0), name='pyr', top=0.0):
    """Pyramide a base rectangulaire (toit en pavillon / tente). top = demi-taille du sommet."""
    bm = bmesh.new()
    hw, hd = w / 2, d / 2
    pts = [(-hw, -hd, 0), (hw, -hd, 0), (hw, hd, 0), (-hw, hd, 0)]
    pts += [(-top, -top, h), (top, -top, h), (top, top, h), (-top, top, h)] if top else [(0, 0, h)]
    v = [bm.verts.new(p) for p in pts]
    if top:
        faces = [(0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7), (4, 5, 6, 7), (0, 3, 2, 1)]
    else:
        faces = [(0, 1, 4), (1, 2, 4), (2, 3, 4), (3, 0, 4), (0, 3, 2, 1)]
    for f in faces:
        bm.faces.new([v[i] for i in f])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return _finish(name, bm, m, at, rot, 0)


def poly(pts, thick, at=(0, 0, 0), m=STONE, rot=(0, 0, 0), bevel=0.0, name='poly'):
    """Polygone 2D (x,z) extrude en Y (epaisseur centree). Pour lames, boucliers, etoiles..."""
    bm = bmesh.new()
    n = len(pts)
    a = [bm.verts.new((x, -thick / 2, z)) for x, z in pts]
    b = [bm.verts.new((x, thick / 2, z)) for x, z in pts]
    bm.faces.new(a[::-1])
    bm.faces.new(b)
    for i in range(n):
        j = (i + 1) % n
        bm.faces.new([a[i], a[j], b[j], b[i]])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return _finish(name, bm, m, at, rot, bevel)


def torus(R, r, at=(0, 0, 0), m=STONE, seg=24, ring=8, rot=(0, 0, 0), name='torus', scale=(1, 1, 1)):
    bm = bmesh.new()
    vs = []
    for i in range(seg):
        a = 2 * math.pi * i / seg
        row = []
        for j in range(ring):
            b = 2 * math.pi * j / ring
            x = (R + r * math.cos(b)) * math.cos(a)
            y = (R + r * math.cos(b)) * math.sin(a)
            z = r * math.sin(b)
            row.append(bm.verts.new((x * scale[0], y * scale[1], z * scale[2])))
        vs.append(row)
    for i in range(seg):
        for j in range(ring):
            bm.faces.new([vs[i][j], vs[(i + 1) % seg][j], vs[(i + 1) % seg][(j + 1) % ring], vs[i][(j + 1) % ring]])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return _finish(name, bm, m, at, rot, 0, True)


def crescent(r, a0, a1, w, at=(0, 0, 0), m=STONE, thick=0.08, n=16, rot=(0, 0, 0), name='cres', taper=1.0):
    """Croissant (arc de cercle de largeur variable, pointu aux extremites) dans le plan XZ."""
    pts_o, pts_i = [], []
    for i in range(n + 1):
        t = i / n
        a = math.radians(a0 + (a1 - a0) * t)
        ww = w * (math.sin(math.pi * t) ** taper)
        pts_o.append((math.cos(a) * (r + ww / 2), math.sin(a) * (r + ww / 2)))
        pts_i.append((math.cos(a) * (r - ww / 2), math.sin(a) * (r - ww / 2)))
    pts = pts_o + pts_i[::-1][1:-1]
    return poly(pts, thick, at, m, rot, 0, name)


def star_pts(n, r1, r2, off=90):
    pts = []
    for i in range(n * 2):
        a = math.radians(off + 180 * i / n)
        r = r1 if i % 2 == 0 else r2
        pts.append((math.cos(a) * r, math.sin(a) * r))
    return pts


def join(objs, name='joined'):
    """Fusionne des objets (meme materiau ou non) en un seul maillage."""
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.join()
    objs[0].name = name
    return objs[0]


def parent_to(objs, parent):
    for o in objs:
        o.parent = parent
    return parent


def empty(name='grp', at=(0, 0, 0), rot=(0, 0, 0), scale=1.0):
    e = bpy.data.objects.new(name, None)
    (S['coll'] or bpy.context.scene.collection).objects.link(e)
    e.location = at
    e.rotation_euler = [math.radians(a) for a in rot]
    e.scale = (scale,) * 3
    return e


# ---------------------------------------------------------------- camera / lumieres
def vec_cam(az, el):
    a, e = math.radians(az), math.radians(el)
    return Vector((math.sin(a) * math.cos(e), -math.cos(a) * math.cos(e), math.sin(e)))


def setup_camera(az=28, el=32):
    sc = bpy.context.scene
    cam = bpy.data.objects.get('Camera')
    if not cam:
        cd = bpy.data.cameras.new('Camera')
        cam = bpy.data.objects.new('Camera', cd)
        sc.collection.objects.link(cam)
    cam.data.type = 'ORTHO'
    cam.data.clip_start, cam.data.clip_end = 0.1, 200
    sc.camera = cam
    return cam


def aim_camera(cam, az, el, ortho_scale, point=(0, 0, 0), pix=None, w=1, h=1, ppu=None):
    """Place la camera. `point` (monde) apparait au pixel `pix`=(px,py) (depuis le haut-gauche)."""
    d = vec_cam(az, el)
    base = d * 60
    quat = (-d).to_track_quat('-Z', 'Y')
    cam.rotation_euler = quat.to_euler()
    R = quat.to_matrix()
    right, up = R.col[0], R.col[1]
    cam.data.ortho_scale = ortho_scale
    u = ortho_scale / max(w, h)
    P = Vector(point) - base
    xc, yc = P.dot(right), P.dot(up)
    if pix is None:
        pix = (w / 2, h / 2)
    cx = xc - (pix[0] - w / 2) * u
    cy = yc + (pix[1] - h / 2) * u
    cam.location = base + right * cx + up * cy
    return right, up


def setup_lights(az, el, strength=1.0, ambient=0.30, sun_k=2.3, soft=3.0, mode='shade'):
    """Soleil venant de la haut-gauche (cote camera) + lumiere ambiante uniforme."""
    sc = bpy.context.scene
    for o in [o for o in sc.objects if o.type == 'LIGHT']:
        bpy.data.objects.remove(o)
    a = math.radians(az)
    h = Vector((math.sin(a), -math.cos(a), 0))
    r = Vector((math.cos(a), math.sin(a), 0))
    to_l = (-0.55 * r + 0.75 * h + Vector((0, 0, 1.1))).normalized()
    ld = bpy.data.lights.new('Sun', 'SUN')
    ld.energy = sun_k
    ld.angle = math.radians(soft)
    lo = bpy.data.objects.new('Sun', ld)
    sc.collection.objects.link(lo)
    lo.rotation_euler = to_l.to_track_quat('Z', 'Y').to_euler()
    w = bpy.data.worlds.get('px_world') or bpy.data.worlds.new('px_world')
    w.use_nodes = True
    bg = w.node_tree.nodes.get('Background')
    bg.inputs['Color'].default_value = (1, 1, 1, 1)
    bg.inputs['Strength'].default_value = ambient
    sc.world = w
    return lo


# ---------------------------------------------------------------- passes de rendu
def _flat_mats(mode):
    """Retourne un dict {materiau d'origine: materiau de remplacement} pour la passe demandee."""
    rep = {}
    for m in bpy.data.materials:
        if 'px_hex' not in m or m.get('px_fx'):
            continue
        hx, em = m['px_hex'], m['px_emit']
        nm = 'pass_%s_%s_%d' % (mode, hx.lstrip('#'), 1 if em else 0)
        n = bpy.data.materials.get(nm)
        if not n:
            n = bpy.data.materials.new(nm)
            n.use_nodes = True
            nt = n.node_tree
            for x in list(nt.nodes):
                nt.nodes.remove(x)
            out = nt.nodes.new('ShaderNodeOutputMaterial')
            if mode == 'albedo' or em:
                s = nt.nodes.new('ShaderNodeEmission')
                if mode == 'albedo':
                    s.inputs['Color'].default_value = hex_lin(hx)
                else:
                    s.inputs['Color'].default_value = (1, 1, 1, 1)
                    s.inputs['Strength'].default_value = 1.6
            else:
                s = nt.nodes.new('ShaderNodeBsdfDiffuse')
                s.inputs['Color'].default_value = (1, 1, 1, 1)
            nt.links.new(s.outputs[0], out.inputs['Surface'])
        rep[m] = n
    return rep


def _render_png(path, w, h, samples, view):
    sc = bpy.context.scene
    sc.render.resolution_x, sc.render.resolution_y = int(w), int(h)
    sc.render.resolution_percentage = 100
    sc.cycles.samples = samples
    sc.view_settings.view_transform = view
    sc.view_settings.look = 'None'
    sc.render.filepath = path
    bpy.ops.render.render(write_still=True)
    im = Image.open(path).convert('RGBA')
    a = np.asarray(im).astype(np.float32) / 255.0
    return a


def render_passes(W, H, shade_samples=40):
    """Rend (albedo RGBA, ombrage gris) a la resolution W x H avec la camera courante."""
    sc = bpy.context.scene
    objs = [o for o in sc.objects if o.type == 'MESH' and not o.hide_render]
    tmp = os.path.join(TMPD, '_tmp_pass.png')
    orig = {}
    for mode in ('albedo', 'shade'):
        rep = _flat_mats(mode)
        for o in objs:
            for i, sl in enumerate(o.material_slots):
                if sl.material in rep:
                    orig.setdefault((o, i), sl.material)
                    sl.material = rep[orig[(o, i)]]
        if mode == 'albedo':
            sc.world.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.0
            A = _render_png(tmp, W, H, 4, 'Standard')
            # retablit les materiaux d'origine avant la 2e passe
            for (o, i), m in orig.items():
                o.material_slots[i].material = m
            orig.clear()
        else:
            sc.world.node_tree.nodes['Background'].inputs['Strength'].default_value = sc['px_ambient']
            Sh = _render_png(tmp, W, H, shade_samples, 'Raw')
            for (o, i), m in orig.items():
                o.material_slots[i].material = m
            orig.clear()
    return A, Sh


def scene_albedos():
    out = {}
    for m in bpy.data.materials:
        if 'px_hex' in m and not m.get('px_fx') and not m.name.startswith('pass_'):
            out[m['px_hex'].lower()] = bool(m['px_emit'])
    return out


# ---------------------------------------------------------------- post-traitement pixel art
def box_down(a, ss):
    H, W = a.shape[0] // ss, a.shape[1] // ss
    return a[:H * ss, :W * ss].reshape(H, ss, W, ss, -1).mean(axis=(1, 3))


def lerp3(a, b, t):
    return tuple(a[i] + (b[i] - a[i]) * t for i in range(3))


def ramp(rgb, shade_t=(0.60, 0.10), light_t=(0.28, 0.18)):
    """3 teintes a la facon de sh() du jeu : ombre froide violacee, base, lumiere chaude."""
    r, g, b = rgb
    dark = (r * 0.58 + 28 * 0.5, g * 0.54 + 16 * 0.5, b * 0.66 + 70 * 0.5)
    dark = tuple(min(255, max(0, c * 0.78 + 8)) for c in dark)
    light = lerp3(rgb, (255, 236, 170), 0.16)
    light = tuple(min(255, c * 1.07) for c in light)
    return dark, rgb, light


def toon_shade(albedo_rgb_u8, emitmask, shade, t_dark=0.46, t_light=0.82):
    """albedo (H,W,3 uint8) + ombrage (H,W) -> couleurs a 3 teintes."""
    out = albedo_rgb_u8.astype(np.float32).copy()
    cols = np.unique(albedo_rgb_u8.reshape(-1, 3), axis=0)
    for c in cols:
        sel = np.all(albedo_rgb_u8 == c, axis=-1)
        if not sel.any():
            continue
        d, b, l = ramp(tuple(float(v) for v in c))
        s = shade
        out[sel & (s < t_dark)] = d
        out[sel & (s >= t_dark) & (s < t_light)] = b
        out[sel & (s >= t_light)] = l
    out[emitmask] = albedo_rgb_u8[emitmask]
    return out


def add_outline(img_rgba, color=OLC, diag=False):
    a = img_rgba[..., 3] > 0
    m = np.zeros_like(a)
    m[1:, :] |= a[:-1, :]
    m[:-1, :] |= a[1:, :]
    m[:, 1:] |= a[:, :-1]
    m[:, :-1] |= a[:, 1:]
    if diag:
        m[1:, 1:] |= a[:-1, :-1]
        m[:-1, :-1] |= a[1:, 1:]
        m[1:, :-1] |= a[:-1, 1:]
        m[:-1, 1:] |= a[1:, :-1]
    ol = m & ~a
    img_rgba[ol] = list(h2rgb(color)) + [255]
    return img_rgba


def snap_palette(rgb, pal):
    """rgb (H,W,3) -> couleurs les plus proches dans pal (liste de tuples)."""
    P = np.array(pal, dtype=np.float32)
    d = ((rgb[:, :, None, :] - P[None, None, :, :]) ** 2).sum(-1)
    return P[d.argmin(-1)]


def postprocess(A, Sh, w, h, ss, outline=True, t_dark=0.46, t_light=0.82, minalpha=0.5):
    alpha = box_down(A[..., 3:4], ss)[..., 0]
    wgt = A[..., 3:4]
    shade = box_down(Sh[..., :1] * wgt, ss)[..., 0] / np.maximum(alpha, 1e-4)
    mask = alpha >= minalpha
    al = scene_albedos()
    keys = list(al)
    pal = np.array([h2rgb(k) for k in keys], np.float32)
    rgb_full = A[..., :3] * 255.0
    d = ((rgb_full[:, :, None, :] - pal[None, None, :, :]) ** 2).sum(-1)
    idx = d.argmin(-1)
    idx = np.where(A[..., 3] > 0.5, idx, -1)
    H, W = idx.shape[0] // ss, idx.shape[1] // ss
    blk = idx[:H * ss, :W * ss].reshape(H, ss, W, ss).transpose(0, 2, 1, 3).reshape(H, W, ss * ss)
    cnt = np.stack([(blk == k).sum(-1) for k in range(len(keys))], -1)
    win = cnt.argmax(-1)
    snapped = pal[win].astype(np.uint8)
    emitmask = np.zeros(mask.shape, bool)
    for k, e in enumerate(keys):
        if al[e]:
            emitmask |= (win == k)
    col = toon_shade(snapped, emitmask, shade, t_dark, t_light)
    out = np.zeros((h, w, 4), np.uint8)
    out[..., :3] = np.clip(col, 0, 255).astype(np.uint8)
    out[..., 3] = np.where(mask, 255, 0)
    out[~mask, :3] = 0
    if outline:
        add_outline(out)
    return Image.fromarray(out, 'RGBA')


# ---------------------------------------------------------------- specifications de rendu
def add_render(key, w, h, mode='fit', az=28, el=32, ss=4, ppu=None, anchor=None, hide=(), outline=True,
               margin=2, point=(0, 0, 0), t_dark=0.46, t_light=0.82, rot_z=0, only=None, frame=None):
    """Enregistre un rendu dans la scene. mode='fit' : cadre automatiquement l'objet ;
    mode='fixed' : echelle fixe ppu = unites monde par pixel, `point` place en `anchor` (px,py)."""
    sc = bpy.context.scene
    lst = json.loads(sc['px_renders'])
    lst.append(dict(key=key, w=w, h=h, mode=mode, az=az, el=el, ss=ss, ppu=ppu, anchor=anchor, hide=list(hide),
                    outline=outline, margin=margin, point=list(point), t_dark=t_dark, t_light=t_light, only=only))
    sc['px_renders'] = json.dumps(lst)


def _visible_objs(hide):
    sc = bpy.context.scene
    objs = []
    for o in sc.objects:
        if o.type != 'MESH':
            continue
        cols = [c.name for c in o.users_collection]
        if any(c in hide for c in cols):
            continue
        objs.append(o)
    return objs


def _bbox_cam(objs, az, el):
    d = vec_cam(az, el)
    quat = (-d).to_track_quat('-Z', 'Y')
    R = quat.to_matrix()
    right, up = R.col[0], R.col[1]
    xs, ys = [], []
    dg = bpy.context.evaluated_depsgraph_get()
    for o in objs:
        oe = o.evaluated_get(dg)
        me = oe.to_mesh()
        mw = oe.matrix_world
        for v in me.vertices:
            p = mw @ v.co
            xs.append(p.dot(right))
            ys.append(p.dot(up))
        oe.to_mesh_clear()
    return min(xs), max(xs), min(ys), max(ys), right, up


def run_render(spec, out_dir=PNG_DIR):
    sc = bpy.context.scene
    sc['px_ambient'] = sc.get('px_ambient', 0.30)
    hidden = []
    for o in sc.objects:
        o.hide_render = False
    for o in sc.objects:
        if any(c.name in spec['hide'] for c in o.users_collection):
            o.hide_render = True
            hidden.append(o)
    if spec.get('only'):
        for o in sc.objects:
            if o.type == 'MESH' and not any(c.name in spec['only'] for c in o.users_collection):
                o.hide_render = True
    w, h, ss = spec['w'], spec['h'], spec['ss']
    cam = setup_camera()
    setup_lights(spec['az'], spec['el'], ambient=sc['px_ambient'])
    objs = [o for o in sc.objects if o.type == 'MESH' and not o.hide_render]
    if spec['mode'] == 'fit':
        x0, x1, y0, y1, right, up = _bbox_cam(objs, spec['az'], spec['el'])
        m = spec['margin'] + (1 if spec['outline'] else 0)
        u = max((x1 - x0) / max(w - 2 * m, 1), (y1 - y0) / max(h - 2 * m, 1))
        sc_ = u * max(w, h)
        # centre l'objet
        d = vec_cam(spec['az'], spec['el'])
        base = d * 60
        cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
        quat = (-d).to_track_quat('-Z', 'Y')
        cam.rotation_euler = quat.to_euler()
        cam.data.ortho_scale = sc_
        xb = base.dot(right)
        yb = base.dot(up)
        cam.location = base + right * (cx - xb) + up * (cy - yb)
    else:
        u = spec['ppu']
        aim_camera(cam, spec['az'], spec['el'], u * max(w, h), tuple(spec['point']), tuple(spec['anchor']), w, h)
    A, Sh = render_passes(w * ss, h * ss)
    img = postprocess(A, Sh, w, h, ss, spec['outline'], spec['t_dark'], spec['t_light'])
    for o in sc.objects:
        o.hide_render = False
    path = os.path.join(out_dir, spec['key'] + '.png')
    img.save(path)
    return path


def run_renders(out_dir=PNG_DIR, only=None):
    sc = bpy.context.scene
    outs = []
    for spec in json.loads(sc['px_renders']):
        if only and spec['key'] not in only:
            continue
        outs.append(run_render(spec, out_dir))
    return outs


def save_blend(name):
    path = os.path.join(MODELS, name + '.blend')
    bpy.ops.wm.save_as_mainfile(filepath=path, compress=True)
    return path


def finish_model(name, ambient=0.30):
    """A appeler a la fin d'un builder : sauve le .blend et lance les rendus enregistres."""
    sc = bpy.context.scene
    sc['px_ambient'] = ambient
    setup_camera()
    setup_lights(28, 32, ambient=ambient)
    paths = run_renders()
    save_blend(name)
    return paths


# ---------------------------------------------------------------- animation (FX)
def key(o, f, loc=None, rot=None, scl=None):
    """Pose une cle d'animation (image f). rot en degres. scl nombre ou tuple. scl=0 -> invisible."""
    if loc is not None:
        o.location = loc
        o.keyframe_insert('location', frame=f)
    if rot is not None:
        o.rotation_euler = [math.radians(a) for a in rot]
        o.keyframe_insert('rotation_euler', frame=f)
    if scl is not None:
        o.scale = (scl,) * 3 if isinstance(scl, (int, float)) else scl
        o.keyframe_insert('scale', frame=f)


def linear_keys(o):
    ad = o.animation_data
    if ad and ad.action:
        try:
            fcs = ad.action.fcurves
        except Exception:
            fcs = []
            for lay in ad.action.layers:
                for st in lay.strips:
                    for cb in st.channelbags:
                        fcs.extend(cb.fcurves)
        for fc in fcs:
            for k in fc.keyframe_points:
                k.interpolation = 'LINEAR'


def render_fx_frames(nframes, fw, fh, camspec, palette, ss=3, outline=False, minalpha=0.5):
    """Rend les nframes images de l'animation courante (scene.frame_set) -> liste d'images PIL."""
    sc = bpy.context.scene
    cam = setup_camera()
    cam.data.type = 'ORTHO'
    az, el, scale, ctr = camspec
    aim_camera(cam, az, el, scale, ctr, None, fw, fh)
    for o in [o for o in sc.objects if o.type == 'LIGHT']:
        bpy.data.objects.remove(o)
    w = bpy.data.worlds.get('px_world') or bpy.data.worlds.new('px_world')
    w.use_nodes = True
    w.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.0
    sc.world = w
    tmp = os.path.join(TMPD, '_tmp_fx.png')
    frames = []
    for f in range(nframes):
        sc.frame_set(f)
        A = _render_png(tmp, fw * ss, fh * ss, 6, 'Standard')
        alpha = box_down(A[..., 3:4], ss)[..., 0]
        wgt = A[..., 3:4]
        rgb = box_down(A[..., :3] * wgt, ss) / np.maximum(box_down(wgt, ss), 1e-4) * 255.0
        col = snap_palette(rgb, palette) if palette else rgb
        out = np.zeros((fh, fw, 4), np.uint8)
        out[..., :3] = col.astype(np.uint8)
        out[..., 3] = np.where(alpha >= minalpha, 255, 0)
        out[out[..., 3] == 0, :3] = 0
        if outline:
            add_outline(out)
        frames.append(Image.fromarray(out, 'RGBA'))
    return frames


def sheet(frames):
    w, h = frames[0].size
    s = Image.new('RGBA', (w * len(frames), h), (0, 0, 0, 0))
    for i, f in enumerate(frames):
        s.paste(f, (i * w, 0))
    return s


def ensure_pil_save(img, key_):
    p = os.path.join(PNG_DIR, key_ + '.png')
    img.save(p)
    return p


def rod3(p0, p1, r, m, n=6, name='rod'):
    """Cylindre entre deux points 3D."""
    a, b = Vector(p0), Vector(p1)
    d = b - a
    o = cyl(r, d.length, tuple(a), m, n, name=name)
    o.rotation_euler = d.to_track_quat('Z', 'Y').to_euler()
    return o


def striped_sphere(r, at, mats, bands=8, scale=(1, 1, 1), seg=16, rings=10, name='balloon'):
    """Sphere dont les fuseaux (longitudes) alternent les materiaux de `mats` -> montgolfiere."""
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=rings, radius=r)
    for v in bm.verts:
        v.co = Vector((v.co.x * scale[0], v.co.y * scale[1], v.co.z * scale[2]))
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    for m in mats:
        me.materials.append(m)
    for p in me.polygons:
        c = p.center
        a = math.atan2(c.y, c.x) % (2 * math.pi)
        p.material_index = int(a / (2 * math.pi) * seg) % len(mats)
        p.use_smooth = True
    o = bpy.data.objects.new(name, me)
    (S['coll'] or bpy.context.scene.collection).objects.link(o)
    o.location = at
    return o
