"""ui.py - icones de ressources 16x16, etoile, cadre 9-slice, boutons, ornements."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *


def res_food():
    sph(0.9, (0, 0, 0.9), '#d9794a', 10, 8, (1.0, 0.8, 0.9))        # gigot
    cyl(0.18, 1.5, (0.5, 0, 1.1), CREAM, 8, rot=(0, 50, 0))
    sph(0.28, (1.35, 0, 2.15), CREAM, 6, 4); sph(0.28, (1.05, 0, 2.4), CREAM, 6, 4)
    sph(0.35, (-0.35, -0.55, 1.3), '#f0a070', 6, 4, (1, 0.5, 0.6))
    add_render('res_food', 16, 16, mode='fit', az=10, el=35, margin=1, ss=8)


def res_wood():
    for (x, z) in ((-0.6, 0.45), (0.6, 0.45), (0, 1.35)):
        cyl(0.55, 2.6, (x, -1.3, z), WOOD, 10, rot=(-90, 0, 0), bevel=0.0)
        cyl(0.4, 0.05, (x, -1.31, z), '#e0b080', 10, rot=(-90, 0, 0)) if False else None
        o = cyl(0.42, 0.1, (x, -1.35, z), '#e8c090', 10, rot=(90, 0, 0)); o.location.y = -1.35
        cyl(0.2, 0.12, (x, -1.42, z), '#c98f5a', 8, rot=(90, 0, 0)).location.y = -1.42
    add_render('res_wood', 16, 16, mode='fit', az=-35, el=22, margin=1, ss=8)


def res_stone():
    sph(1.0, (0, 0, 0.7), '#a9a6b8', 5, 4, (1.3, 1, 0.8))
    sph(0.6, (1.1, -0.4, 0.4), '#8d8aa0', 5, 3, (1.2, 1, 0.8))
    sph(0.5, (-0.9, -0.5, 0.4), '#c3c0d2', 5, 3, (1.1, 1, 0.8))
    for o in bpy.context.scene.objects:
        for p in o.data.polygons:
            p.use_smooth = False
    add_render('res_stone', 16, 16, mode='fit', az=15, el=40, margin=1, ss=8)


def res_gold():
    for z in (0, 0.3, 0.6):
        cyl(1.0, 0.28, (0, 0, z), GOLDM, 14, bevel=0.03)
    cyl(0.7, 0.05, (0, 0, 0.88), '#fff0a0', 14)
    cyl(0.85, 0.28, (1.0, -0.8, 0.0), '#ffcf4a', 14)
    cyl(0.85, 0.28, (1.0, -0.8, 0.3), '#ffcf4a', 14)
    cyl(0.6, 0.05, (1.0, -0.8, 0.58), '#fff0a0', 14)
    add_render('res_gold', 16, 16, mode='fit', az=15, el=42, margin=1, ss=8)


def res_shard():
    cyl(0.8, 1.6, (0, 0, 1.2), '#ff7ad9', 5, r2=0.0, rot=(0, 0, 0), name='c1')
    cyl(0.8, 1.2, (0, 0, 1.2), '#c0489a', 5, r2=0.0, rot=(180, 0, 0), name='c2').location.z = 1.2
    cyl(0.4, 1.1, (0.8, 0.0, 0.0), '#ff9ae6', 5, r2=0.0, rot=(0, 0, 0)).rotation_euler = (0, math.radians(25), 0)
    cyl(0.3, 0.9, (-0.7, 0.0, 0.0), '#ff9ae6', 5, r2=0.0).rotation_euler = (0, math.radians(-25), 0)
    add_render('res_shard', 16, 16, mode='fit', az=0, el=18, margin=1, ss=8, t_light=0.8)


def star(on=True, key_='ui_star'):
    c, d = (GOLDM, '#fff0a0') if on else ('#4a4670', '#6a6496')
    poly(star_pts(5, 1.0, 0.45), 0.35, (0, 0, 0), c, (0, 0, 0), 0.05)
    poly(star_pts(5, 0.62, 0.28), 0.4, (0, -0.02, 0.0), d, (0, 0, 0), 0.03)
    add_render(key_, 16, 16, mode='fit', az=0, el=12, margin=1, ss=8, t_light=0.8)


def panel():
    box((6, 6, 0.12), (0, 0, 0), CREAM)
    box((5.4, 5.4, 0.12), (0, 0, 0.12), '#14122a')
    box((5.0, 5.0, 0.12), (0, 0, 0.24), PANEL)
    box((4.5, 4.5, 0.06), (0, 0, 0.36), PANEL2)
    box((4.3, 4.3, 0.06), (0, 0, 0.42), PANEL)
    for sx in (-1, 1):
        for sy in (-1, 1):
            sph(0.42, (sx * 2.55, sy * 2.55, 0.35), GOLDM, 8, 6)
    add_render('ui_panel', 48, 48, mode='fit', az=0, el=89, margin=0, ss=6, outline=False, t_light=0.9)


def corner():
    for pts in ([(0, 0), (2.4, 0), (2.4, 0.5), (0.5, 0.5), (0.5, 2.4), (0, 2.4)],):
        poly(pts, 0.4, (0, 0, 0), GOLDM, (90, 0, 0), 0.04)
    sph(0.5, (0.45, 0.2, 0.45), '#ff7ad9', 8, 6)
    add_render('ui_corner', 16, 16, mode='fit', az=0, el=89, margin=1, ss=8)


def divider():
    box((7.0, 0.35, 0.3), (0, 0, 0), GOLDM, bevel=0.04)
    poly([(0, 0.7), (0.6, 0), (0, -0.7), (-0.6, 0)], 0.5, (0, 0, 0.3), '#ff7ad9', (90, 0, 0), 0.04)
    for s_ in (-1, 1):
        sph(0.3, (s_ * 1.2, 0, 0.3), GOLDM, 8, 6)
    add_render('ui_divider', 64, 8, mode='fit', az=0, el=60, margin=1, ss=8, t_light=0.8)


def button(col, key_):
    box((5.0, 1.6, 0.5), (0, 0, 0), col, bevel=0.12)
    box((4.5, 1.2, 0.1), (0, 0, 0.5), col, bevel=0.04)
    add_render(key_, 48, 16, mode='fit', az=0, el=62, margin=0, ss=8, t_light=0.8, t_dark=0.5)


UI = [('res_food', res_food), ('res_wood', res_wood), ('res_stone', res_stone), ('res_gold', res_gold),
      ('res_shard', res_shard), ('ui_star', lambda: star(True, 'ui_star')), ('ui_star_off', lambda: star(False, 'ui_star_off')),
      ('ui_panel', panel), ('ui_corner', corner), ('ui_divider', divider),
      ('ui_button', lambda: button(RUST, 'ui_button')), ('ui_button_alt', lambda: button(PANEL2, 'ui_button_alt')),
      ('ui_button_hot', lambda: button('#4de0c0', 'ui_button_hot'))]

if __name__ == '__main__':
    for k, fn in UI:
        if len(sys.argv) > 1 and k not in sys.argv[1:]:
            continue
        reset_scene()
        fn()
        finish_model(k)
