"""icons_game.py - icones 32x32 : blessures d'expedition (inj_*) et categories de recherche du mage (rs_*)."""
from icon_parts import *
import mounts  # noqa  (enregistre mt_* dans REG)

SKINB, CRM2 = '#f0d4a8', '#f8f4ea'
BLOOD, BLOOD_D = '#d8352a', '#8a1a22'


def I(k):
    return icon(k, 32)


@I('inj_legere')
def _():
    with xf(40, 1, 0, 0):
        fill(rect(0, 0, 1.9, .72), SKINB, step=.03, bv=.05)
        fill(rect(0, 0, .72, .72), CRM2, step=.03, bv=.03)
        for sx in (-1, 1):
            for z in (-.2, 0, .2):
                fill(ngon(sx * .72, z, .045, n=6), '#b08a5a', nolayer=True, bv=0, th=.01)
        fill(rect(0, 0, .5, .08), '#c9c6d8', nolayer=True, bv=0, th=.01)
    lay(.04)
    fill(ngon(-.62, -.55, .1, n=8), '#ff8a9a', nolayer=True, bv=0, th=.01)


@I('inj_profonde')
def _():
    with xf(30, 1, 0, 0):
        fill(rect(0, 0, 1.9, .95), CRM2, step=.03, bv=.05)
        for x in (-.7, -.35, .7, .35):
            fill(rect(x, 0, .07, .95), '#c9c6d8', nolayer=True, bv=0, th=.01)
        fill(ngon(0, 0, .46, .38, 12), BLOOD, nolayer=True, bv=0, th=.01)
        fill(ngon(.02, .03, .26, .2, 10), BLOOD_D, nolayer=True, bv=0, th=.01)
    lay(.05)
    drop(.62, -.62, .3, BLOOD)
    drop(-.7, -.7, .2, BLOOD)


def bone(cx, cz, L, rot, col='#f2ead6'):
    with xf(rot, 1, cx, cz):
        fill(rect(0, 0, L, .26), col, step=.02)
        for sx in (-1, 1):
            for sz in (-1, 1):
                fill(ngon(sx * L / 2, sz * .16, .17, n=8), col, step=.0)
        lay(.03)


@I('inj_fracture')
def _():
    # os brise : deux moities decalees, eclat + attelle
    bone(-.45, .25, 1.1, 35)
    bone(.4, -.35, 1.1, 20)
    fill([(-.1, .0), (.1, .22), (.18, .02), (.34, .14)], '#2a2040', nolayer=True, bv=0, th=.01)
    fill(star(0, 0, 4, .32, .1, 90), '#ffcf4a', True, nolayer=True)
    lay(.04)
    fill(stroke([(-.9, -.75), (.9, -.45)], .2), WOODC, step=.02)
    fill(stroke([(-.9, -.95), (.9, -.65)], .08), WOOD_D, step=.02)
    fill(rect(-.5, -.66, .12, .5, -12), CRM2, step=.02)
    fill(rect(.25, -.55, .12, .5, -12), CRM2, step=.02)


@I('inj_trauma')
def _():
    fill(ngon(0, -.12, .68, .72, 20), '#f0c8a0', step=.03)
    fill(ngon(0, .05, .66, .5, 14, 90), '#c9885a', nolayer=True, bv=0, th=.01) if False else None
    for sx in (-1, 1):
        fill(ngon(sx * .27, -.12, .13, .16, 8), DARK, nolayer=True, bv=0, th=.01)
    fill(stroke([(-.1, -.5), (.08, -.58), (-.04, -.66), (.12, -.7)], .06), DARK, nolayer=True, bv=0, th=.01) if False else None
    fill(rect(0, -.52, .3, .06), DARK, nolayer=True, bv=0, th=.01)
    # fissure
    fill(stroke([(.05, .6), (-.12, .4), (.1, .22), (-.08, .05)], .11), '#3a2230', nolayer=True, bv=0, th=.01)
    lay(.05)
    for i, (x, z, s) in enumerate(((-.7, .72, .24), (0, .92, .2), (.72, .7, .26))):
        fill(star(x, z, 5, s, s * .45), '#ffcf4a', True, nolayer=True)
    lay(.04)


@I('inj_epuisement')
def _():
    # batterie presque vide + goutte de sueur
    fill(rect(-.1, -.15, 1.5, .85), '#6a7090', step=.03, bv=.04)
    fill(rect(.8, -.15, .18, .36), '#6a7090', step=.0)
    fill(rect(-.1, -.15, 1.3, .65), '#1c1b3c', nolayer=True, bv=0, th=.01)
    fill(rect(-.62, -.15, .2, .45), BLOOD, True, nolayer=True)
    lay(.03)
    for x in (-.28, .0):
        fill(rect(x, -.15, .18, .45), '#3a3858', nolayer=True, bv=0, th=.01)
    lay(.04)
    drop(.55, .62, .52, '#6fd3ff', True)
    drop(-.5, .6, .26, '#6fd3ff', True)


# ------------------------------------------------------------------ categories de recherche (plaque ronde coloree + embleme)
def rplate(c):
    fill(ngon(0, 0, .98, n=32), shade(c, -.45), step=.02)
    fill(ngon(0, 0, .88, n=32), shade(c, -.1), step=.02)
    fill(ngon(0, 0, .72, n=32), shade(c, -.35), step=.02)


@I('rs_arcane')
def _():
    c = '#b070ff'
    rplate(c)
    pl = pal('#ff7ad9')
    burst(0, 0, 4, .62, .16, pl, rot=90)
    orb(0, 0, .26, '#ffd8ff', True)
    sparkle(.5, .5, .15)
    sparkle(-.5, -.45, .12)


@I('rs_nature')
def _():
    c = '#4fae50'
    rplate(c)
    leaf(-.2, .02, .55, 20, '#7ae070', vein='#2f7a3c')
    leaf(.25, -.08, .45, -35, '#a8f080', vein='#2f7a3c')
    fill(stroke([(0, -.7), (-.02, -.2)], .1), '#7a4a30', step=.02)


@I('rs_elementaire')
def _():
    c = '#e0603a'
    rplate(c)
    flame(0, .02, .55, pal('#ff8a3a'))
    drop(-.5, -.35, .26, '#6fd3ff', True)
    bolt(.52, -.3, .3, pal('#ffe27a'), 10)


@I('rs_sacre')
def _():
    c = '#e8c040'
    rplate(c)
    fill(ngon(0, 0, .6, n=24), '#fff4c0', True, step=.01)
    fill(star(0, 0, 5, .52, .24), '#ffcf4a', True, step=.02)
    cross(0, 0, .22, '#ffffff', True, t=.34)


@I('rs_obscur')
def _():
    c = '#5a3a98'
    rplate(c)
    ro, ri, cx_ = .62, .52, .3
    out = [(ro * math.cos(math.radians(a)), ro * math.sin(math.radians(a))) for a in range(0, 360, 6)]
    out = [p for p in out if math.hypot(p[0] - cx_, p[1]) >= ri]
    k = max(range(len(out)), key=lambda i: math.hypot(out[i][0] - out[i - 1][0], out[i][1] - out[i - 1][1]))
    out = out[k:] + out[:k]
    inn = [(cx_ + ri * math.cos(math.radians(a)), ri * math.sin(math.radians(a))) for a in range(0, 360, 6)]
    inn = [p for p in inn if math.hypot(*p) <= ro]
    inn.sort(key=lambda p: -math.atan2(p[1], p[0] - cx_) % (2 * math.pi))
    inn.sort(key=lambda p: -((math.degrees(math.atan2(p[1], p[0] - cx_)) + 90) % 360))
    fill(out + inn, '#c8a8ff', True, step=.02)
    sparkle(.42, .38, .14, '#e8d0ff')


@I('rs_temporel')
def _():
    c = '#3f9ad0'
    rplate(c)
    hourglass(0, 0, .6, '#e0b040', '#ffe27a')


@I('rs_navigation')
def _():
    c = '#2f8a8a'
    rplate(c)
    ring(0, 0, .56, .1, '#e0b040')
    fill([(0, .62), (.17, 0), (0, -.1), (-.17, 0)], '#ff5a5a', step=.02)
    fill([(0, -.62), (.17, 0), (0, .1), (-.17, 0)], '#e8e0c8', step=.02)
    fill(ngon(0, 0, .09, n=8), '#e0b040', step=.02)


@I('rs_defense')
def _():
    c = '#6a78a8'
    rplate(c)
    shield(0, 0, .6, '#c9d2e0', '#e0b040')
    fill(star(0, .05, 5, .3, .13), '#e0b040', step=.02)
