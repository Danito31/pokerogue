"""extras.py - portail de la tour (64x80) et bateau montgolfier magique (96x96 + illustration 200x150)."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *
from buildings import lantern

TEAL_E, TEAL_L = '#4de0c0', '#b8fff0'


def portail():
    reset_scene()
    for i, (w, z) in enumerate(((7.0, 0), (6.2, 0.25), (5.4, 0.5))):
        box((w, 2.6 - i * 0.3, 0.25), (0, 0, z), STONE_L if i else STONE, bevel=0.03)
    z0 = 0.75
    for sx in (-1, 1):
        x = sx * 2.2
        box((1.0, 1.0, 0.4), (x, 0, z0), STONE_D, bevel=0.03)
        box((0.85, 0.85, 3.6), (x, 0, z0 + 0.4), STONE, bevel=0.03)
        box((1.1, 1.1, 0.3), (x, 0, z0 + 4.0), STONE_L, bevel=0.03)
        for k in range(3):
            box((0.28, 0.1, 0.28), (x, -0.45, z0 + 1.0 + k * 0.9), '#ff7ad9', (0, 0, 45), center=True).data.materials[0] = mat('#ff7ad9', 1)
        cyl(0.28, 0.35, (x, 0, z0 + 4.3), STONE_D, 8)
        cyl(0.2, 0.4, (x, 0, z0 + 4.65), FIRE, 6, r2=0.0).data.materials[0] = mat(FIRE, 1)
    zt = z0 + 4.0
    crescent(2.15, 0, 180, 0.95, (0, 0, zt), STONE, 0.95, 24, name='arch', taper=0.0)
    box((0.8, 1.05, 0.55), (0, 0, zt + 2.0), STONE_L, bevel=0.03)
    poly(star_pts(5, 0.3, 0.13), 0.12, (0, -0.55, zt + 2.3), GOLDM).data.materials[0] = mat(GOLDM, 1)
    pts = [(-1.7, z0 + 0.4), (1.7, z0 + 0.4), (1.7, zt)] + [(math.cos(math.radians(a)) * 1.7, zt + math.sin(math.radians(a)) * 1.7) for a in range(0, 181, 15)][1:] + [(-1.7, zt)]
    o = poly(pts, 0.25, (0, 0.05, 0), TEAL_E, (0, 0, 0), 0, 'portal')
    o.data.materials.clear(); o.data.materials.append(mat(TEAL_E, 1))
    for i, (R, c) in enumerate(((1.1, TEAL_L), (0.55, '#ffffff'))):
        t = torus(R, 0.09, (0, -0.2, z0 + 2.3 if False else zt - 0.6 + 0.0), mat(c, 1), 20, 4, (90, 0, 0))
    add_render('portail', 64, 80, mode='fit', az=12, el=20, ss=4, margin=1, t_light=0.9)
    finish_model('portail')


def bateau():
    reset_scene()
    RED, CRM = '#c0453a', CREAM
    stripe = [mat(RED), mat(CRM), mat('#4a6ab8'), mat(CRM)]
    b = striped_sphere(2.5, (0, 0, 6.0), stripe, 8, (1, 1, 1.18), 16, 10)
    cyl(1.3, 0.8, (0, 0, 3.15), RED, 10, r2=0.8, name='skirt')
    cyl(0.9, 0.12, (0, 0, 3.1), GOLDM, 10)
    # coque
    poly([(-2.6, 1.9), (-2.0, 1.1), (-1.6, 0.0), (1.6, 0.0), (2.2, 1.1), (3.0, 2.2), (2.3, 1.3), (-2.3, 1.3)][:0] or
         [(-2.7, 1.8), (2.7, 1.8), (3.1, 2.3), (2.3, 1.2), (1.6, 0.0), (-1.6, 0.0), (-2.2, 1.2)], 1.5, (0, 0, 0), WOOD, (0, 0, 0), 0.03, 'hull')
    poly([(-2.7, 1.8), (2.7, 1.8), (2.5, 1.55), (-2.5, 1.55)], 1.6, (0, 0, 0), GOLDM, (0, 0, 0), 0.02, 'trim')
    poly([(-2.2, 1.0), (2.1, 1.0), (1.95, 0.8), (-2.05, 0.8)], 1.56, (0, 0, 0), WOOD_D, (0, 0, 0), 0.0, 'band')
    for x in (-1.6, -0.6, 0.6, 1.6):
        box((0.12, 0.12, 0.7), (x, -0.7, 1.8), WOOD_D)
    box((5.2, 0.1, 0.12), (0, -0.7, 2.45), WOOD_D)
    for x in (-1.6, -0.6, 0.6, 1.6):
        box((0.12, 0.12, 0.7), (x, 0.7, 1.8), WOOD_D)
    box((5.2, 0.1, 0.12), (0, 0.7, 2.45), WOOD_D)
    for x in (-1.5, 0.0, 1.5):
        o = sph(0.3, (x, -0.78, 0.95), TEAL_E, 8, 5, (1, 0.3, 1)); o.data.materials.clear(); o.data.materials.append(mat(TEAL_E, 1))
    # mat + voile + fanion
    cyl(0.09, 3.2, (-0.5, 0, 1.8), WOOD_D, 6)
    poly([(0, 0), (1.5, 0.2), (0, 2.2)], 0.06, (-0.4, 0, 2.2), CRM, (0, 0, 0), 0, 'sail')
    poly([(0, 0), (0.9, -0.2), (0, -0.5)], 0.05, (-0.5, 0, 4.7), GOLDM, (0, 0, 0), 0, 'flag')
    # ailes magiques
    for s_ in (-1, 1):
        poly([(0, 0), (0.7, 0.6), (2.2, 0.9), (1.6, 0.1), (2.0, -0.5), (0.8, -0.3)], 0.1, (0.0, s_ * 0.95, 1.4), '#ffe27a' if False else GOLDM, (0, 0, 0), 0.0, 'wing').rotation_euler = (math.radians(s_ * 80), 0, math.radians(0))
    # hélice arrière
    g = empty('prop', (3.1, 0, 1.3))
    cyl(0.14, 0.4, (0, 0, 0), STONE_D, 6, rot=(0, 90, 0)).parent = g
    for a in (0, 120, 240):
        bl = box((0.1, 0.18, 0.9), (0.2, 0, 0), '#b8fff0', (a, 0, 0), 0.0)
        bl.data.materials.clear(); bl.data.materials.append(mat(TEAL_L, 1)); bl.parent = g
    # cordes + brûleur
    for sx in (-1, 1):
        for sy in (-1, 1):
            rod3((sx * 1.9, sy * 0.6, 2.1), (sx * 0.95, sy * 0.35, 3.3), 0.045, WOOD_D)
    f = cyl(0.3, 0.6, (0, 0, 2.55), FIRE, 6, r2=0.0); f.data.materials.clear(); f.data.materials.append(mat(FIRE, 1))
    lantern(2.2, -0.7, 2.5, 0.2)
    for i, (x, z, s) in enumerate([(-3.6, 5.5, .5), (3.7, 7.5, .6), (-3.2, 2.0, .4), (3.6, 3.2, .4)]):
        p = poly(star_pts(4, 1, 0.22), 0.1, (x, -1.2, z), mat(GOLDM if i % 2 else '#ff7ad9', 1), (0, 0, 0), 0)
        p.scale = (s, s, s)
    with use_coll('ui_only'):
        for (x, z, s) in [(-5.2, 1.0, 1.1), (5.0, 4.0, 0.9), (-4.0, 9.0, 0.8), (4.5, -0.8, 1.2)]:
            for dx, dz, r in ((0, 0, .9), (-.8, -.2, .6), (.8, -.2, .65), (.3, .4, .6)):
                sph(r * s, (x + dx * s, 3.0, z + dz * s), '#eef2ff', 8, 6, (1.2, 1, 0.8))
    add_render('bateau', 96, 96, mode='fit', az=25, el=18, ss=4, margin=1, hide=['ui_only'], t_light=0.9)
    add_render('bateau_ui', 200, 150, mode='fit', az=25, el=18, ss=3, margin=2, t_light=0.9)
    finish_model('bateau')


if __name__ == '__main__':
    a = sys.argv[1:]
    if not a or 'portail' in a: portail()
    if not a or 'bateau' in a: bateau()
