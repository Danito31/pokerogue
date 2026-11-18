"""mounts.py - montures de l'Ecurie : icones 32x32 `mt_<id>` (via REG, rendues par icons.py) et sprites de carte 54x40 `mts_<id>`.
Usage sprites : /opt/bvenv/bin/python blender/mounts.py [ids...]"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from icon_parts import *


def horse(col, mane, hoof='#3a2c4a', armor=None, saddle='#c0392b', big=False, pony=False):
    """cheval de profil, tourne vers la droite, canevas [-1,1]."""
    dk = shade(col, -.35)
    sc = .86 if pony else 1.0
    with xf(0, sc, 0, -.08 if pony else 0):
        # queue + jambes arriere/avant (fond)
        fill(stroke([(-.62, .12), (-.86, .0), (-.9, -.3), (-.82, -.5)], .2, .1), mane, step=.01)
        for x in (-.42, .38):
            fill(stroke([(x, -.2), (x + .02, -.62), (x, -.84)], .17, .12), dk, step=.01)
            fill(rect(x, -.88, .2, .1), hoof, step=.01, nolayer=True, th=.02, bv=0)
        # corps
        fill(ngon(-.06, -.04, .66, .36, 22), col, step=.02)
        # cou + tete
        fill([(.3, .1), (.52, .62), (.7, .66), (.88, .3), (.98, .08), (.92, -.06), (.74, .0), (.56, -.12), (.4, -.3)], col, step=.02)
        # oreille + criniere
        fill([(.5, .6), (.54, .82), (.64, .64)], dk, step=.01, nolayer=True, th=.02, bv=0)
        fill(stroke([(.5, .66), (.36, .44), (.22, .26), (.0, .3)], .15, .08), mane, step=.01)
        # jambes premier plan
        for x in (-.26, .56):
            fill(stroke([(x, -.2), (x + .03, -.62), (x + .02, -.84)], .19, .14), col, step=.01)
            fill(rect(x + .02, -.88, .22, .11), hoof, step=.01, nolayer=True, th=.02, bv=0)
        # oeil + naseau
        fill(ngon(.74, .34, .05, n=8), WHITE, True, nolayer=True)
        fill(rect(.97, .0, .06, .06), dk, nolayer=True, th=.02, bv=0)
        lay(.05)
        # selle
        fill(rect(-.08, .31, .5, .16), saddle, step=.02)
        fill(rect(-.08, .22, .5, .1), '#e0b040', nolayer=True, th=.02, bv=0)
        lay(.04)
        if armor:
            # barde (plaque de poitrail + chanfrein) et housse
            fill([(.2, .28), (.5, .3), (.56, -.22), (.36, -.42), (.18, -.2)], armor, step=.02)
            fill(rect(.37, .02, .08, .5, -8), '#e0b040', nolayer=True, th=.02, bv=0)
            fill([(.76, .52), (.98, .1), (.9, .02), (.72, .3)], armor, step=.02)
            fill([(.9, .2), (.98, .14), (.93, .5)] if False else [(.74, .5), (.8, .86), (.86, .5)], '#ff5a5a', step=.01)  # plumet
            fill([(-.5, .3), (-.1, .22), (.1, -.1), (-.3, -.3), (-.6, -.1)], shade(armor, -.15), step=.02)
        lay(.03)


def wing(col, tip):
    pass


def griffon(col='#c8903f', fth='#f2ead6', bk='#ffcf4a'):
    dk = shade(col, -.35)
    # aile arriere
    for k, (a, L) in enumerate(((105, .8), (125, .85), (145, .8))):
        ar = math.radians(a)
        fill(stroke([(-.05 + L * math.cos(ar) * t * .9, .2 + L * math.sin(ar) * t * .95) for t in (0, .25, .5, .75, 1)], .0, 0, lambda t: .3 * sm(t, .5) + .03), shade(fth, -.3), step=.01)
    # queue de lion
    fill(stroke([(-.55, -.15), (-.8, -.35), (-.92, -.62)], .12, .07), col, step=.01)
    fill(ngon(-.93, -.68, .13, n=8), dk, step=.01)
    # pattes arriere
    fill(stroke([(-.4, -.2), (-.3, -.55), (-.18, -.72)], .22, .12), dk, step=.01)
    fill(stroke([(.25, -.2), (.3, -.55), (.48, -.7)], .2, .1), dk, step=.01)
    # corps de lion
    fill(ngon(-.2, -.12, .6, .34, 22), col, step=.02)
    # poitrail emplume / cou
    fill([(.2, -.3), (.1, .1), (.3, .45), (.48, .5), (.52, .1), (.5, -.3)], fth, step=.02)
    # tete d'aigle
    fill(ngon(.42, .52, .26, .24, 14), fth, step=.02)
    fill([(.6, .62), (.98, .46), (.84, .3), (.6, .38)], bk, step=.02)
    fill(ngon(.5, .6, .06, n=8), '#2a2040', nolayer=True, th=.02, bv=0)
    fill([(.3, .72), (.2, .98), (.42, .76)], fth, step=.01)
    # pattes avant (serres)
    fill(stroke([(.28, -.2), (.34, -.58), (.5, -.72)], .2, .1), col, step=.01)
    fill([(.48, -.66), (.72, -.72), (.68, -.84), (.46, -.82)], bk, step=.01)
    fill(stroke([(-.15, -.25), (-.1, -.58), (.06, -.72)], .2, .1), col, step=.01)
    fill([(.04, -.66), (.28, -.72), (.24, -.84), (.02, -.82)], bk, step=.01)
    lay(.04)
    # aile avant
    for k, (a, L) in enumerate(((80, 1.0), (102, 1.05), (124, 1.0), (146, .85))):
        ar = math.radians(a)
        fill(stroke([(.0 + L * math.cos(ar) * t * .95, .15 + L * math.sin(ar) * t * .95) for t in (0, .2, .4, .6, .8, 1)], .0, 0, lambda t: .34 * sm(t, .5) + .03), mix('#e8c070', fth, k / 4) if False else shade('#d8c8a0', -.07 * (3 - k)), step=.012)
    lay(.04)


def draw(k):
    if k == 'poney':
        horse('#9a6a3a', '#4a2c1a', pony=True, saddle='#4a7ae0')
    elif k == 'destrier':
        horse('#5a4a58', '#1d1430', armor='#aab4c8', big=True)
    elif k == 'griffon':
        griffon()


for _k in ('poney', 'destrier', 'griffon'):
    REG['mt_' + _k] = (32, (lambda k=_k: draw(k)), None)


def render_sprite(key, fn, w=54, h=40, ss=6, ext=None, dz=0.0):
    clear_scene()
    sc = bpy.context.scene
    sc['px_ambient'] = .42
    fn()
    cam = setup_camera()
    ext = ext or 2.1 * w / 32 * .95
    aim_camera(cam, 0, 0, ext, (0, 0, dz), None, w, h)
    setup_lights(0, 0, ambient=.42, sun_k=2.6)
    A, Sh = render_passes(w * ss, h * ss, shade_samples=10)
    img = postprocess(A, Sh, w, h, ss, True, .52, .9)
    img.save(os.path.join(PNG_DIR, key + '.png'))


if __name__ == '__main__':
    ids = sys.argv[1:] or ['poney', 'destrier', 'griffon']
    reset_scene()
    for k in ids:
        render_sprite('mts_' + k, lambda k=k: draw(k))
    print('mounts :', ids)
