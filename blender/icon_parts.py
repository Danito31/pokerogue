"""icon_parts.py - composants d'emblemes de haut niveau (silhouettes, objets, fonds) construits sur iconlib."""
from iconlib import *

F = dict(soutien='#ffcf4a', soin='#5fe07a', protection='#bfe8ff', degats='#ff5a5a', controle='#c58bff', defense='#a9a6b8',
         chance='#4de0c0', decouverte='#6fd3ff', cuisine='#e8945a', celerite='#ff9a3a')
ROLE = dict(guerrier=('#b9c4d8', '#3558b8'), gardien=('#bfe8ff', '#e0b040'), assassin=('#6a5c9a', '#c0392b'),
            archer=('#3f8f52', '#a9744a'), sorcier=('#6a48b8', '#ff7ad9'), soigneur=('#3fb0a0', '#5fe07a'), soutien=('#ffcf4a', '#ff5a5a'))
STEEL, STEEL_D, GOLD, GOLDM = '#c9d2e0', '#8a93aa', '#ffcf4a', '#e0b040'
WOODC, WOOD_D, SKIN, CREAM, DARK = '#b9824f', '#9a6440', '#f2c9a0', '#f2ead6', '#3a2c4a'
RED, GREEN, BLUE, PURP, PINK, TEAL, ORANGE, CYAN = '#ff5a5a', '#5fe07a', '#4a7ae0', '#a070f0', '#ff7ad9', '#4de0c0', '#ff9a3a', '#6fd3ff'


def P(k):
    return pal(F.get(k, k))


def person(cx, cz, s, col, head=None, rot=0):
    with xf(rot, s, cx, cz):
        fill(ngon(0, .62, .3, .3, 14), head or col)
        fill([(-.45, -.9), (-.52, .1), (-.25, .35), (.25, .35), (.52, .1), (.45, -.9)], col)
    lay(.04)


def bg_rays(base, n=14, r1=.98, r2=.62, ring_r=None):
    """fond d'ultime : eclats rayonnants (ton moyen) + onde."""
    pl = pal(base)
    fill(star(0, 0, n, r1, r2, 90), mix(base, '#1d1040', .35), True, step=.012)
    fill(star(0, 0, n, r1 * .86, r2 * .9, 90 + 90 / n), mix(base, '#1d1040', .12), True, step=.012)
    if ring_r:
        shock(0, 0, ring_r, .1, (pl[1], pl[2], pl[3]))
    lay(.04)


def cut(rot, L, w, pl, dx=0, dz=0, taper=.5, head=0.0):
    """coup de lame quasi droit (arc de grand rayon) de longueur L, oriente rot (deg, 0 = horizontal)."""
    R = 3.2
    half = math.degrees(math.asin(min(.99, L / 2 / R)))
    with xf(rot, 1, dx, dz):
        slash(0, -R, R, 90 - half, 90 + half, w, pl, taper=taper, head=head)


def pot(cx, cz, s, col, steam=None, lid=False):
    with xf(0, s, cx, cz):
        fill([(-.85, .35), (-.8, -.3), (-.45, -.75), (.45, -.75), (.8, -.3), (.85, .35)], col)
        fill(rect(0, .42, 1.9, .22), shade(col, -.25), step=.02)
        fill(ngon(-.95, .3, .16), shade(col, -.25), step=.02)
        fill(ngon(.95, .3, .16), shade(col, -.25), step=.02)
        fill(rect(-.35, -.3, .1, .6, 18), shade(col, .5), True, nolayer=True)
        lay(.04)
        if steam:
            for x in (-.4, 0, .4):
                fill(stroke([(x, .6), (x + .15, .85), (x - .1, 1.1), (x + .08, 1.35)], .12, .05), steam, True, step=.01)
    lay(.04)


def bowl(cx, cz, s, col, content=None):
    with xf(0, s, cx, cz):
        if content:
            fill(ngon(0, .0, .8, .3, 18), content, step=.02)
        fill([(-.95, .0), (.95, .0)] + [(.95 * math.cos(math.radians(a)), -.95 * math.sin(math.radians(a))) for a in range(0, 181, 15)][1:-1][::-1][::-1], col, step=.03) if False else None
        fill([(.95 * math.cos(math.radians(a)), .05 + .85 * math.sin(math.radians(a))) for a in range(180, 361, 15)], col, step=.03)
        fill(rect(0, -.88, .6, .12), shade(col, -.3), step=.02)
    lay(.04)


def knight(cx, cz, s, col):
    pts = [(-.6, -.9), (.6, -.9), (.55, -.6), (.3, -.45), (.5, .05), (.4, .55), (.05, .95), (-.1, .72), (-.6, .3), (-.7, .08), (-.5, -.05), (-.25, .1), (-.05, -.05), (-.3, -.45), (-.55, -.6)]
    with xf(0, s, cx, cz):
        fill(pts, col)
        fill(ngon(.12, .42, .06, n=6), DARK, False, nolayer=True, bv=0, th=.01)
    lay(.05)


def wolf(cx, cz, s, col, rot=0, flip=False):
    pts = [(-.85, -.9), (-.75, -.1), (-.8, .8), (-.4, .45), (.0, .55), (.15, .9), (.35, .35), (.6, .15), (.95, -.05), (.95, -.3), (.45, -.38), (.25, -.7), (-.1, -.9)]
    with xf(rot, s, cx, cz, flip=flip):
        fill(pts, col)
        fill([(.35, .0), (.55, .06), (.5, -.02)], DARK, False, nolayer=True, bv=0, th=.01)
        fill(ngon(.3, .08, .06, n=6), WHITE, True, nolayer=True)
        fill([(.85, -.1), (.97, -.14), (.9, -.28)], DARK, False, nolayer=True, bv=0, th=.01)
        fill([(-.8, .8), (-.55, .4), (-.4, .45)], shade(col, -.4), nolayer=True, th=.01, bv=0)
    lay(.05)


def boot(cx, cz, s, col, sole=None, rot=0):
    with xf(rot, s, cx, cz):
        fill([(-.4, .8), (.3, .8), (.35, -.05), (.9, -.3), (.95, -.8), (-.45, -.8)], col)
        fill(rect(.1, -.82, 1.4, .18), sole or shade(col, -.4), step=.02)
        fill(rect(-.05, .75, .8, .2), shade(col, .3), step=.02)
    lay(.05)


def magnifier(cx, cz, s, col=STEEL, lens=None, rot=0, handle=WOOD_D):
    with xf(rot, s, cx, cz):
        fill(stroke([(.35, -.35), (.9, -.9)], .22), handle, step=.03)
        fill(ngon(-.15, .15, .62, n=22), col, step=.03)
        fill(ngon(-.15, .15, .46, n=22), lens or '#cfeaff', step=.02)
        fill(rect(-.32, .32, .3, .08, 40), WHITE, True, nolayer=True)
    lay(.05)


def chili(cx, cz, s, col, rot=0, stem='#4aa856'):
    path = [(-.7, .75), (-.2, .55), (.25, .15), (.55, -.35), (.75, -.9)]
    with xf(rot, s, cx, cz):
        fill(stroke(path, .7, .08, lambda t: .62 * (1 - t) ** .7 + .04), col, step=.03)
        fill(stroke([(-.75, .8), (-.95, 1.0)], .12), stem, step=.02)
        fill(ngon(-.7, .72, .2, .2, 8), stem, step=.02)
        fill(stroke([(-.45, .55), (.05, .3), (.35, -.1)], .1), shade(col, .55), True, nolayer=True)
    lay(.05)


def drumstick(cx, cz, s, col, bone=CREAM, rot=0):
    with xf(rot, s, cx, cz):
        fill(stroke([(.1, -.2), (.7, -.85)], .22), bone, step=.03)
        fill(ngon(.78, -.78, .17), bone, step=.02)
        fill(ngon(.63, -.93, .15), bone, step=.02)
        fill(ngon(-.2, .25, .62, .55, 16), col, step=.03)
        fill(ngon(-.4, .42, .2, .15, 8, 30), shade(col, .45), True, nolayer=True)
    lay(.05)


def cloche(cx, cz, s, col, lifted=True):
    with xf(0, s, cx, cz):
        fill(rect(0, -.78, 1.95, .2), shade(col, -.25))
        dz = .22 if lifted else 0
        pts = [(-.8 * math.cos(math.radians(a)), -.35 + dz + .95 * math.sin(math.radians(a))) for a in range(0, 181, 12)]
        fill([(-.85, -.55 + dz)] + pts[1:-1] + [(.85, -.55 + dz)], col)
        fill(ngon(0, .72 + dz, .13), shade(col, -.2), step=.02)
        fill(stroke([(-.5, .0 + dz), (-.3, .3 + dz)], .1), WHITE, True, nolayer=True)
    lay(.05)


def cape(cx, cz, s, col, rot=0):
    with xf(rot, s, cx, cz):
        fill([(-.35, .85), (.35, .85), (.75, -.3), (.55, -.9), (.25, -.7), (0, -.95), (-.25, -.7), (-.55, -.9), (-.75, -.3)], col)
        fill(rect(0, .78, .8, .15), shade(col, .3), step=.02)
    lay(.05)


def clock(cx, cz, r, col, face=CREAM, hands=DARK, rot=0):
    with xf(rot, 1, cx, cz):
        fill(ngon(0, 0, r, n=28), col, step=.03)
        fill(ngon(0, 0, r * .8, n=28), face, step=.02)
        fill(stroke([(0, 0), (0, r * .6)], r * .1), hands, nolayer=True, bv=0, th=.01)
        fill(stroke([(0, 0), (r * .42, -r * .1)], r * .1), hands, nolayer=True, bv=0, th=.01)
        fill(ngon(0, 0, r * .1, n=8), hands, nolayer=True, bv=0, th=.01)
    lay(.08)


def pouch(cx, cz, s, col, rot=0):
    with xf(rot, s, cx, cz):
        fill([(-.45, .45), (.45, .45), (.85, -.3), (.6, -.85), (-.6, -.85), (-.85, -.3)], col)
        fill([(-.5, .45), (.5, .45), (.3, .72), (-.3, .72)], shade(col, -.2), step=.02)
        fill(stroke([(-.5, .6), (.5, .6)], .1), GOLDM, step=.02)
    lay(.05)


def chest(cx, cz, s, col, band=GOLDM, open_=True):
    with xf(0, s, cx, cz):
        fill(rect(0, -.45, 1.7, .9), col)
        fill(rect(0, -.45, .3, .9), band, step=.02)
        fill(rect(0, -.08, 1.7, .15), band, step=.02)
        if open_:
            fill([(-.85, .0), (.85, .0), (.7, .65), (-.7, .65)], shade(col, -.15), step=.02)
        else:
            fill([(-.85, 0), (.85, 0), (.7, .55), (-.7, .55)], col, step=.02)
        fill(rect(0, -.3, .2, .24), DARK, False, nolayer=True, bv=0, th=.01)
    lay(.05)


def paw(cx, cz, s, col):
    with xf(0, s, cx, cz):
        fill(ngon(0, -.3, .5, .42, 14), col)
        for x, z, a in ((-.62, .22, 20), (-.22, .6, 8), (.22, .6, -8), (.62, .22, -20)):
            fill(ngon(x, z, .2, .26, 10, a), col, step=.02)
    lay(.05)


def die(cx, cz, s, col, pips=6, rot=0, pipc=DARK):
    P6 = [(-.42, .42), (-.42, 0), (-.42, -.42), (.42, .42), (.42, 0), (.42, -.42)]
    with xf(rot, s, cx, cz):
        fill(rect(0, 0, 1.6, 1.6), col, bv=.08)
        for x, z in P6[:pips]:
            fill(ngon(x, z, .15, n=8), pipc, False, nolayer=True, bv=0, th=.01)
    lay(.06)


def horseshoe(cx, cz, s, col, rot=0):
    with xf(rot, s, cx, cz):
        path = [(-.72, .75), (-.72, .1)] + arcpath(0, .1, .72, 180, 360, 12)[1:-1][::-1][::-1] + [(.72, .1), (.72, .75)]
        path = [(-.72, .8), (-.72, .15)] + [(.72 * math.cos(math.radians(a)), .15 + .85 * math.sin(math.radians(a))) for a in range(190, 351, 10)] + [(.72, .15), (.72, .8)]
        fill(stroke(path, .34), col, step=.03)
        for x, z in ((-.72, .55), (-.62, -.3), (0, -.7), (.62, -.3), (.72, .55)):
            fill(ngon(x, z, .06, n=6), DARK, False, nolayer=True, bv=0, th=.01)
    lay(.05)


def lantern(cx, cz, s, col, glow_c=GOLD):
    with xf(0, s, cx, cz):
        fill(rect(0, .85, .9, .12), col)
        fill(rect(0, -.8, .9, .15), col)
        fill(rect(0, 0, .7, 1.4), '#3a3a58', step=.02)
        fill(rect(0, 0, .5, 1.1), glow_c, True, step=.02)
        fill(stroke(arcpath(0, .85, .3, 0, 180, 8), .08), col, step=.02)
    lay(.05)


def crystal(cx, cz, s, base, rot=0):
    pl = pal(base)
    with xf(rot, s, cx, cz):
        shard(0, -1, 0, 1, .55, pl, mid=.45)
        with xf(0, .5, -.65, -.5):
            shard(0, -1, 0, 1, .55, pl, mid=.45)
        with xf(20, .5, .6, -.5):
            shard(0, -1, 0, 1, .55, pl, mid=.45)


def anvil(cx, cz, s, col, rot=0):
    with xf(rot, s, cx, cz):
        fill([(-.95, .5), (.55, .5), (.95, .35), (.5, .1), (.3, -.1), (.35, -.45), (.7, -.7), (.7, -.9), (-.7, -.9), (-.7, -.7), (-.35, -.45), (-.3, -.1), (-.6, .15), (-.95, .2)], col)
        fill(rect(-.05, .42, 1.5, .1), shade(col, .45), True, nolayer=True)
    lay(.05)


def scroll(cx, cz, s, col=CREAM, rot=0, rod=WOOD_D):
    with xf(rot, s, cx, cz):
        fill(rect(0, 0, 1.4, 1.5), col)
        fill(rect(0, .78, 1.7, .18), rod, step=.02)
        fill(rect(0, -.78, 1.7, .18), rod, step=.02)
        for z in (.35, .05, -.25):
            fill(stroke([(-.5, z), (.5, z)], .07), shade(col, -.35), nolayer=True, bv=0, th=.01)
    lay(.05)


def mask(cx, cz, s, col, eye=DARK, grim=True):
    with xf(0, s, cx, cz):
        fill([(-.8, .6), (0, .8), (.8, .6), (.75, -.25), (.35, -.85), (0, -.95), (-.35, -.85), (-.75, -.25)], col)
        for sx in (-1, 1):
            fill([(sx * .15, .2), (sx * .7, .38), (sx * .6, .05), (sx * .3, -.02)], eye, False, nolayer=True, bv=0, th=.01)
        if grim:
            fill([(-.5, -.35), (-.25, -.25), (0, -.4), (.25, -.25), (.5, -.35), (.42, -.58), (.2, -.48), (0, -.62), (-.2, -.48), (-.42, -.58)], eye, False, nolayer=True, bv=0, th=.01)
    lay(.06)


def trap(cx, cz, s, col, tooth, rot=0):
    with xf(rot, s, cx, cz):
        fill(rect(0, -.75, 1.9, .2), shade(col, -.2))
        fill([(-.9, -.65)] + [(-.9 + .3 * i, -.65 + (0 if i % 2 == 0 else 0)) for i in range(0)] + [(.9, -.65), (.9, .0), (-.9, .0)], col, step=.03)
        for i in range(6):
            x0 = -.9 + i * .3
            fill([(x0, .0), (x0 + .15, .5), (x0 + .3, .0)], tooth, step=.01)
        fill(ngon(0, -.35, .22, n=10), DARK, False, nolayer=True, bv=0, th=.01)
    lay(.05)


def stone(cx, cz, s, col, rot=0):
    with xf(rot, s, cx, cz):
        fill([(-.85, -.7), (-.95, .1), (-.5, .8), (.3, .9), (.9, .35), (.85, -.55), (.3, -.85)], col)
        fill([(-.6, .55), (-.2, .78), (.3, .72), (-.1, .45)], shade(col, .35), True, nolayer=True)
    lay(.05)


def candle(cx, cz, s, col=CREAM, flame_c=ORANGE, lit=True):
    with xf(0, s, cx, cz):
        fill(rect(0, -.3, .5, 1.2), col)
        fill(rect(0, -.95, .9, .14), GOLDM, step=.02)
        fill(stroke([(0, .3), (0, .45)], .05), DARK, bv=0, th=.01, step=.01)
        if lit:
            flame(0, .72, .26, pal(flame_c), hw=.6)
    lay(.04)


def sparks(pts, col=WHITE, r=.1):
    for x, z in pts:
        sparkle(x, z, r, col)
    lay(.03)


def head_helm(cx, cz, s, col, plume=None, visor=True, rot=0):
    with xf(rot, s, cx, cz):
        if plume:
            fill(stroke([(.0, .55), (.35, 1.0), (.8, .75), (.9, .2)], .3, .12), plume, step=.02)
        fill([(-.7, -.8), (-.75, .15), (-.4, .75), (.4, .75), (.75, .15), (.7, -.8), (.3, -.8), (.3, -.5), (-.3, -.5), (-.3, -.8)], col)
        if visor:
            fill([(-.62, .15), (.62, .15), (.55, -.08), (-.55, -.08)], DARK, False, nolayer=True, bv=0, th=.01)
            fill(rect(0, .05, .1, .5), DARK, False, nolayer=True, bv=0, th=.01)
        fill(rect(-.35, .55, .3, .08, -30), WHITE, True, nolayer=True)
    lay(.05)


def stag(cx, cz, s, col, ant=None):
    ant = ant or shade(col, -.25)
    with xf(0, s, cx, cz):
        for sx in (-1, 1):
            with xf(0, 1, 0, 0, flip=(sx < 0)):
                fill(stroke([(.2, .2), (.45, .65), (.5, 1.0)], .1), ant, step=.01)
                fill(stroke([(.4, .55), (.8, .6)], .08), ant, step=.01)
                fill(stroke([(.45, .8), (.75, .95)], .07), ant, step=.01)
        fill([(-.5, .25), (.5, .25), (.35, -.3), (0, -.95), (-.35, -.3)], col)
        for sx in (-1, 1):
            fill(ngon(sx * .22, -.0, .09, n=6), DARK, False, nolayer=True, bv=0, th=.01)
        fill(ngon(0, -.78, .1, n=6), DARK, False, nolayer=True, bv=0, th=.01)
    lay(.05)
