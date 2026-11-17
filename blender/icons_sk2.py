"""icons_sk2.py - techniques d'arme / de specialisation (sk_tech_*) et ultimes (sk_ult_*) par role."""
from icon_parts import *

BL = pal('#5a8aff')          # guerrier : arc bleu acier
STL = pal('#b9c4d8')
VIO = pal('#8a5ac8')         # assassin
GRN = pal('#6fdc6f')         # archer
ARC = pal('#ff7ad9')         # sorcier arcane
SOI = pal('#5fe07a')         # soigneur
SOU = pal('#ffcf4a')         # soutien
GAR = pal('#bfe8ff')         # gardien


def T_(k, size=32):
    return icon(k, size)


def U_(k):
    return icon(k, 32, post='rim')


# ================================================================== GUERRIER
@T_('sk_tech_entaille')
def _():
    cut(-32, 2.0, .7, (BL[0], BL[1], '#cfe0ff', WHITE), taper=.5, head=.4)
    sparkle(.7, .65, .18)
    sparkle(-.7, -.35, .12)


@T_('sk_tech_fendoir')
def _():
    slash(.1, .1, .85, 30, 150, .5, BL, taper=.5)
    axe(.15, .02, .7, rot=-20, col='#c9d2e0')
    for x in (-.7, .0, .7):
        fill([(x - .13, -.95), (x, -.55), (x + .13, -.95)], '#9ab4ff', True, step=.01)


@T_('sk_tech_poing')
def _():
    burst(.1, .1, 9, .98, .5, pal('#ffcf4a'))
    hand(-.05, -.1, .7, '#5a82e0', fist=True)
    fill(stroke([(-.45, -.68), (.4, -.68)], .24), '#c9d2e0', step=.02)


@T_('sk_tech_epeiste')
def _():
    cut(45, 2.0, .5, BL, taper=.5)
    cut(-45, 2.0, .5, (BL[0], BL[1], '#cfe0ff', WHITE), taper=.5)
    sparkle(0, 0, .22)


@T_('sk_tech_berserker')
def _():
    p = pal('#ff4a3a')
    slash(.0, .1, .9, 190, 330, .5, p, taper=.5)
    axe(.05, .25, .85, rot=-25, col='#e04a3a', haft='#5a3a28')
    for x in (-.55, .1, .6):
        drop(x, -.7, .22, '#c0252a')


@T_('sk_tech_chevalier')
def _():
    for z in (.5, .1, -.3):
        fill(stroke([(-.95, z), (-.2, z)], .02, .16), '#9ab4ff', True, step=.01)
    fill(stroke([(-.9, -.1), (.9, .55)], .12), '#7a4a30', step=.02)
    fill([(.9, .55), (.55, .62), (.62, .3)], '#dfe6f2', step=.02)
    shield(.15, -.25, .6, '#ffcf4a', kind='kite', trim='#b88a20', emblem='cross')


# ---------------------------------------------------------------- GARDIEN
@T_('sk_tech_bouclier')
def _():
    shield(-.1, -.05, .85, F['protection'], emblem='chev', emcol='#3a6aa8')
    orb(.72, .65, .2, '#ffe27a', e=True)


@T_('sk_tech_paladin')
def _():
    burst(0, 0, 12, 1.0, .72, pal('#ffcf4a'))
    shield(0, 0, .72, '#ffcf4a', trim='#b88a20', emblem='cross')


@T_('sk_tech_rempart')
def _():
    fill(rect(0, 0, 1.9, 1.8), '#7a8aa8', step=.03)
    for z in (-.45, .45):
        fill(rect(0, z, 1.9, .06), '#4a5a78', nolayer=True, bv=0, th=.01)
    fill(rect(0, 0, .06, 1.8), '#4a5a78', nolayer=True, bv=0, th=.01)
    for x in (-.8, .8):
        for z in (-.75, -.2, .2, .75):
            fill(ngon(x, z, .1, n=6), '#c9d2e0', nolayer=True)
    fill(ngon(0, 0, .3, n=6), '#c9d2e0', nolayer=True)
    fill(ngon(0, 0, .16, n=6), '#5a6a8a', nolayer=True, bv=0, th=.01)


@T_('sk_tech_vengeur')
def _():
    spike_ring(0, 0, .72, 10, '#e0e6f2', L=.26, w=.12)
    shield(0, 0, .75, '#5a6a8a', kind='round', trim='#3a4a68')
    bolt(0, 0, .62, pal('#ffe27a'))


# ---------------------------------------------------------------- ASSASSIN
@T_('sk_tech_estoc')
def _():
    fill([(-.1, -.95), (.1, -.95), (.06, .35), (0, .95), (-.06, .35)], '#dfe6f2', step=.03)
    fill(stroke([(-.03, -.8), (-.01, .7)], .03), WHITE, True, nolayer=True)
    burst(0, .62, 6, .5, .12, pal('#ff5a5a'))
    fill(rect(0, -.7, .8, .12), '#e0b040', step=.02)


@T_('sk_tech_lameombre')
def _():
    fill(ngon(0, -.65, .92, .26, 20), '#4a2a7a', step=.02)
    fill(ngon(0, -.65, .6, .15, 20), '#2a1650', nolayer=True)
    dagger(0, -.2, .85, rot=0, col='#b890f0', guard='#8a5ac8', hilt='#4a3a6a')


@T_('sk_tech_eclaireur')
def _():
    for z, L in ((.5, 1), (.15, .8), (-.2, 1)):
        fill(stroke([(-.95, z - .1), (-.15, z - .1)], .02, .17), pal('#ff9a3a')[1], True, step=.01)
    dagger(.1, .0, .88, rot=-60, col='#e0e6f2', guard='#ff9a3a', hilt='#8a4a2a')
    sparkle(.8, .7, .15, '#ffd88a')


@T_('sk_tech_duelliste')
def _():
    for r_ in (42, -42):
        with xf(r_, 1.0, 0, -.2):
            fill([(-.05, -.95), (.05, -.95), (.03, .95), (0, 1.05), (-.03, .95)], '#dfe6f2', step=.02)
            fill(ngon(0, -.55, .3, .14, 10), '#e0b040', step=.02)
            fill(stroke([(0, -.65), (0, -.95)], .1), '#7a4a30', step=.02)
    hand(0, .5, .42, '#f2ead6', fist=False, rot=0, cuff='#c0392b')


@T_('sk_tech_empoisonneur')
def _():
    dagger(0, .1, .85, rot=0, col='#cfe8c8', guard='#4aa856')
    drop(.0, -.78, .28, '#5ad03a')
    fill(stroke([(.0, .55), (-.05, .1)], .12), '#5ad03a', True, step=.01)
    drop(.28, -.1, .16, '#5ad03a')
    fill(stroke([(.1, .55), (.1, .2)], .1), '#5ad03a', True, step=.01)


# ---------------------------------------------------------------- ARCHER
def _arrow_trail(x0, z0, x1, z1, pl, w=.1):
    dx, dz = x1 - x0, z1 - z0
    fill(stroke([(x0 - dx * .5, z0 - dz * .5), (x0, z0)], .02, .2), pl[1], True, step=.008)
    fill(stroke([(x0 - dx * .4, z0 - dz * .4), (x0, z0)], .01, .08), WHITE, True, step=.008)
    arrow(x0, z0, x1, z1, '#c9a070', .3, w, hcol='#e0e6f2', fl='#6fdc6f')


@T_('sk_tech_volee')
def _():
    for dz, dx in ((.5, .0), (.0, .15), (-.5, -.05)):
        _arrow_trail(-.2 + dx, -.5 + dz * 0.3 + dz, .85 + dx, .1 + dz, GRN)


@T_('sk_tech_tireur')
def _():
    ring(0, 0, .82, .1, '#c9f0a0', True)
    for a in (0, 90, 180, 270):
        with xf(a, 1, 0, 0):
            fill(stroke([(0, .5), (0, 1.0)], .1), '#c9f0a0', True, step=.005)
    arrow(-.55, -.6, .15, .1, '#c9a070', .32, .1, hcol='#e0e6f2', fl='#6fdc6f')
    fill(ngon(.15, .1, .1), '#ff5a5a', True, step=.01)


@T_('sk_tech_rodeur')
def _():
    thorn_ring(0, 0, .72, '#4aa856', 3)
    arrow(-.8, -.8, .8, .8, '#c9a070', .38, .12, hcol='#e0e6f2', fl='#6fdc6f')


@T_('sk_tech_tempete')
def _():
    for a in (-60, -30, 0, 30, 60):
        with xf(a, 1, 0, -.9):
            arrow(0, .0, 0, 1.75, '#c9a070', .34, .1, hcol='#ffe27a', fl='#ffe27a')
    bolt(-.62, .45, .38, pal('#ffe27a'))
    bolt(.62, .45, .38, pal('#ffe27a'))
    bolt(0, -.05, .3, pal('#ffe27a'))


# ---------------------------------------------------------------- SORCIER
@T_('sk_tech_deflagration')
def _():
    burst(0, 0, 8, .98, .55, pal('#8a5ac8'), rot=22)
    orb(0, 0, .5, '#c58bff', e=True)


@T_('sk_tech_glyphe')
def _():
    ring(0, -.3, .9, .12, '#ff7ad9', True, rz=.4)
    ring(0, -.3, .6, .09, '#ffc4f0', True, rz=.27)
    for a in range(0, 360, 60):
        r = math.radians(a)
        sparkle(.9 * math.cos(r), -.3 + .4 * math.sin(r), .1, '#ffc4f0')
    rune(0, .3, .5, '#ff7ad9', kind=4, w=.16)


@T_('sk_tech_elementaliste')
def _():
    cols = ['#ff6b3d', '#6fd3ff', '#6fdc6f', '#c58bff']
    for i, c in enumerate(cols):
        a0 = 90 * i
        pts = [(0, 0)] + [(.62 * math.cos(math.radians(a)), .62 * math.sin(math.radians(a))) for a in range(a0 + 3, a0 + 88, 12)]
        with xf(0, 1, .04 * math.cos(math.radians(a0 + 45)), .04 * math.sin(math.radians(a0 + 45))):
            glow(pts, pal(c), shrink=(1, .8, .5, 0), off=(0, .02, .04, 0), c0=(.2 * math.cos(math.radians(a0 + 45)), .2 * math.sin(math.radians(a0 + 45))))
    for a in range(45, 360, 90):
        r = math.radians(a)
        sparkle(.9 * math.cos(r), .9 * math.sin(r), .14, WHITE)


@T_('sk_tech_arcaniste')
def _():
    for a, s_ in ((-55, .8), (-18, .9), (18, .9), (55, .8)):
        with xf(a, 1, 0, -.75):
            fill([(0, .0), (.28, .9), (0, 1.75), (-.28, .9)], pal('#ff7ad9')[0], True, step=.012)
            fill([(0, .15), (.2, .9), (0, 1.55), (-.2, .9)], pal('#ff7ad9')[1], True, step=.012)
            fill([(0, .4), (.1, .9), (0, 1.3), (-.1, .9)], '#ffc4f0', True, step=.012)
    lay(.04)
    orb(0, -.75, .17, '#ffffff', e=True)


@T_('sk_tech_chrono')
def _():
    p = pal('#8a5ac8')
    ring(0, 0, .8, .14, '#c58bff', True)
    path = [(.5 * (t / 14) * math.cos(math.radians(t * 40)), .5 * (t / 14) * math.sin(math.radians(t * 40))) for t in range(0, 22)]
    gstroke(path, .15, p, fr=(1, .6, .3, 0))
    for a in range(0, 360, 90):
        r = math.radians(a)
        fill(ngon(.8 * math.cos(r), .8 * math.sin(r), .09), WHITE, True, step=.005)


@T_('sk_tech_occultiste')
def _():
    ring(0, 0, .9, .1, '#8a5ac8', True)
    for a in range(0, 360, 60):
        r = math.radians(a + 30)
        rune(.9 * math.cos(r), .9 * math.sin(r), .11, '#c58bff', kind=a // 60, w=.2)
    skull(0, -.02, .65, '#b890f0', eye='#2a1050')


# ---------------------------------------------------------------- SOIGNEUR
@T_('sk_tech_soin')
def _():
    drop(0, .0, 1.0, '#2f9a5a', shine=False)
    cross(0, -.12, .42, '#c8ffd8', True, t=.34)


@T_('sk_tech_pretre')
def _():
    fill([(-.3, 1), (.3, 1), (.55, -.5), (-.55, -.5)], pal('#ffe27a')[0], True, step=.01)
    fill([(-.18, 1), (.18, 1), (.34, -.5), (-.34, -.5)], pal('#ffe27a')[1], True, step=.01)
    fill([(-.07, 1), (.07, 1), (.12, -.5), (-.12, -.5)], WHITE, True, step=.01)
    lay(.04)
    cross(0, -.5, .5, '#5fe07a', t=.34)


@T_('sk_tech_druide')
def _():
    fill(stroke([(0, -.95), (.05, -.4), (0, -.1)], .14), '#3fae5a', step=.02)
    leaf(-.32, .3, .75, 32, '#5fe07a', vein='#c8ffd8', w=.42)
    leaf(.32, .3, .75, -32, '#5fe07a', vein='#c8ffd8', w=.42)
    leaf(0, .45, .72, 0, '#8af0a0', vein='#e8fff0', w=.38)
    leaf(-.4, -.55, .35, 60, '#3fae5a')
    sparkle(.7, .8, .13, '#c8ffd8')


@T_('sk_tech_hemo')
def _():
    drop(-.35, .25, .6, '#e83a4a')
    fill(stroke([(-.2, -.2), (.05, -.45), (.3, -.45)], .12), '#c0252a', step=.01)
    cross(.45, -.4, .38, '#5fe07a', t=.34)


# ---------------------------------------------------------------- SOUTIEN
def lute(cx, cz, s, col, rot=0, strings=True):
    with xf(rot, s, cx, cz):
        fill(stroke([(.2, .05), (.85, .8)], .2), WOOD_D, step=.02)
        fill(ngon(-.2, -.3, .62, .56, 16), col, step=.03)
        fill(ngon(-.2, -.3, .22, n=10), DARK, False, nolayer=True, bv=0, th=.01)
        fill(stroke([(-.45, -.4), (.1, .15)], .05), '#fff0a0', True, nolayer=True)
        fill(rect(.88, .85, .22, .3, -40), WOOD_D, step=.02)
    lay(.05)


@T_('sk_tech_ralliement')
def _():
    lute(-.2, -.15, .75, '#e0b040')
    for r_ in (.5, .85):
        shock(.1, .0, r_, .11, SOU, a0=-25, a1=50)
    fill([(.45, .7), (.75, .95), (1.0, .7), (1.0, .55), (.75, .8), (.45, .55)], '#ff5a5a', True, step=.01)


@T_('sk_tech_troubadour')
def _():
    lute(-.15, -.2, .8, '#e0b040')
    note(.55, .55, .35, '#4de0c0', True)
    note(.8, -.05, .28, '#4de0c0', True)
    note(-.6, .7, .25, '#4de0c0', True)


@T_('sk_tech_chantre')
def _():
    p = pal('#ff5a5a')
    fill(stroke([(-.85, -.5), (-.4, -.35), (.1, .0), (.4, .35)], .22, .85), '#c0392b', step=.03)
    fill(stroke([(-.8, -.5), (-.4, -.35), (.1, .0), (.4, .35)], .06, .3), '#ff9a8a', True, nolayer=True)
    fill(ngon(-.85, -.5, .16), GOLD, step=.01)
    fill(rect(.42, .36, .22, .88, 45), GOLD, step=.01) if False else None
    for r_ in (.5, .85):
        shock(.45, .45, r_, .11, SOU, a0=-30, a1=30)


@T_('sk_tech_enchanteur')
def _():
    sword(.1, .0, .85, rot=45, col='#dfe6f2')
    ring(.1, .0, .62, .09, '#ff7ad9', True)
    fill(star(.1, .0, 4, .5, .2, 45), '#ff7ad9', True, step=.01)
    staff(-.8, -.45, .6, rot=-50, col='#a9744a', top='#ffc4f0')


# ================================================================== ULTIMES (compositions chargees + liseré blanc interne)
@U_('sk_ult_guerrier')
def _():
    bg_rays('#3558b8', 12)
    for x, s_ in ((-.6, .4), (0, .44), (.6, .4)):
        person(x, -.62, s_, '#2a2040')
    slash(0, -.35, 1.0, 20, 160, .75, (BL[0], BL[1], '#cfe0ff', WHITE), taper=.5)


@U_('sk_ult_commandant')
def _():
    bg_rays('#b88a20', 14)
    bannerpole(.45, .0, .62, '#fff0c0', tip=WHITE, pole='#c98f5a')
    sword(-.4, -.05, .85, rot=-8)
    sparks([(-.8, .75)], WHITE, .16)


@U_('sk_ult_epeiste')
def _():
    for a in (0, 60, 120):
        cut(a, 2.0, .42, BL if a else (BL[0], BL[1], '#cfe0ff', WHITE), taper=.5)
    ring(0, 0, .9, .06, '#9ab4ff', True)
    sparkle(0, 0, .34, WHITE)


@U_('sk_ult_berserker')
def _():
    p = pal('#ff4a3a')
    flame(0, .0, 1.0, p, lean=.2, hw=.7)
    fill(ngon(0, .35, .32, .36, 12), '#3a1220', step=.02)
    fill(rect(0, -.2, .8, .85), '#3a1220', step=.02)
    fill(ngon(0, .35, .32, .36, 12), '#2a0a18', nolayer=True) if False else None
    fill([(-.2, .42), (-.05, .38), (-.05, .32), (-.2, .35)], '#ff5a5a', True, nolayer=True)
    fill([(.2, .42), (.05, .38), (.05, .32), (.2, .35)], '#ff5a5a', True, nolayer=True)
    fill(rect(0, .12, .26, .12), '#ff5a5a', True, nolayer=True)


@U_('sk_ult_chevalier')
def _():
    burst(0, 0, 12, 1.0, .5, pal('#ffcf4a'))
    shield(0, -.1, .75, '#3558b8', trim='#c9d2e0')
    sword(0, .22, .75, rot=0, col='#dfe6f2')


@U_('sk_ult_gardien')
def _():
    ring(0, 0, .92, .08, '#bfe8ff', True)
    for i in range(6):
        a = math.radians(60 * i + 30)
        hexa(.55 * math.cos(a), .55 * math.sin(a), .33, '#7ab8e8' if i % 2 else '#bfe8ff')
    hexa(0, 0, .33, '#ffe27a')


@U_('sk_ult_paladin')
def _():
    fill([(-.6, 1), (.6, 1), (.9, -.9), (-.9, -.9)], pal('#ffe27a')[0], True, step=.01)
    fill([(-.38, 1), (.38, 1), (.6, -.9), (-.6, -.9)], pal('#ffe27a')[1], True, step=.01)
    fill([(-.15, 1), (.15, 1), (.25, -.9), (-.25, -.9)], WHITE, True, step=.01)
    lay(.04)
    hammer(0, .1, .66, rot=0, col='#8a93aa', haft='#7a4a30', head=(1.0, .7))
    fill(star(0, -.78, 4, .3, .1, 90), WHITE, True, step=.01)


@U_('sk_ult_rempart')
def _():
    fill(rect(0, -.6, 1.95, .8), '#7a8aa8', step=.02)
    for x in (-.8, -.27, .27, .8):
        fill(rect(x, -.15, .38, .32), '#7a8aa8', step=.01)
    fill(rect(0, -.6, 1.95, .06), '#4a5a78', nolayer=True, bv=0, th=.01)
    person(0, .25, .7, '#bfe8ff', head='#e8f4ff')
    fill(rect(0, -.2, .5, .3), '#9ab4d8', nolayer=True)
    sparks([(-.75, .7), (.75, .6)], '#bfe8ff', .15)


@U_('sk_ult_vengeur')
def _():
    spike_ring(-.3, -.1, .72, 8, '#e0e6f2', L=.22, w=.11)
    shield(-.3, -.1, .78, '#5a6a8a', kind='round', trim='#3a4a68')
    bolt(-.3, -.1, .35, pal('#ffe27a'))
    bolt(.62, .25, .5, pal('#ff5a5a'), rot=-30)
    bolt(.7, -.5, .3, pal('#ff5a5a'), rot=20)


@U_('sk_ult_assassin')
def _():
    fill(ngon(0, 0, .96, n=28), '#1a1030', step=.02)
    cut(45, 2.0, .55, pal('#ff4a4a'), taper=.4)
    cut(-45, 2.0, .55, pal('#ff4a4a'), taper=.4)
    burst(0, 0, 8, .38, .1, pal('#ff4a4a'))


@U_('sk_ult_lameombre')
def _():
    glow(ngon(0, 0, .52, n=24), pal('#a070f0'), shrink=(1, .78, 0, 0), off=(0, 0, 0, 0), c0=(0, 0))
    fill(ngon(.3, .14, .42, n=24), '#241446', True, step=.01)
    for a in (0, 120, 240):
        with xf(a, 1, 0, 0):
            dagger(0, 1.0, .68, rot=180, col='#d0b8f8', guard='#8a5ac8', hilt='#4a3a6a')
    lay(.03)
    sparkle(-.25, .2, .16, WHITE)


@U_('sk_ult_eclaireur')
def _():
    for a in range(0, 360, 60):
        with xf(a, 1, 0, 0):
            arrow(0, .98, 0, .5, '#c9a070', .25, .08, hcol='#ffd88a', e=False)
    eye(0, 0, .52, '#fff0d8', pupil='#6a2a10', iris='#ff9a3a', slit=True)


@U_('sk_ult_duelliste')
def _():
    ring(0, 0, .92, .1, '#e8d8d8', True)
    ring(0, 0, .75, .05, '#c0392b', True)
    for r_ in (40, -40):
        with xf(r_, 1, 0, 0):
            fill([(-.05, -.7), (.05, -.7), (.03, .75), (0, .85), (-.03, .75)], '#dfe6f2', step=.02)
            fill(ngon(0, -.45, .22, .12, 10), '#e0b040', step=.02)
            fill(stroke([(0, -.55), (0, -.8)], .1), '#7a4a30', step=.02)


@U_('sk_ult_empoisonneur')
def _():
    p = pal('#5ad03a')
    for x, z, r in ((-.45, -.1, .5), (.45, -.1, .5), (0, .3, .55), (0, -.4, .5), (-.3, .45, .35), (.35, .45, .38)):
        fill(ngon(x, z, r, n=14), '#3a8a2a' if (x + z) > 0 else '#4aaa3a', True, step=.01)
    for x, z, r in ((-.28, .05, .5), (.28, .15, .42)):
        fill(ngon(x, z, r * .7, n=12), '#8af070', True, step=.01)
    lay(.03)
    for x, z, s_ in ((-.4, -.15, .3), (.35, .3, .26), (.2, -.45, .22)):
        skull(x, z, s_, '#e8f8d8', eye='#2a5a20')


# ---- archer ults
@U_('sk_ult_archer')
def _():
    bg_rays('#3f8f52', 10)
    for x in (-.55, -.05, .5):
        arrow(x + .45, .85, x - .05, -.1, '#c9a070', .26, .09, hcol='#e0e6f2', fl='#6fdc6f')
    for x in (-.8, .3):
        arrow(x + .35, .5, x + .0, -.5, '#c9a070', .26, .09, hcol='#e0e6f2', fl='#6fdc6f')
    shock(0, -.8, .8, .08, GRN, a0=200, a1=340, rz=.2)


@U_('sk_ult_tireur')
def _():
    ring(0, 0, .85, .12, '#c9f0a0', True)
    for a in (0, 90, 180, 270):
        with xf(a, 1, 0, 0):
            fill(stroke([(0, .45), (0, 1.0)], .1), '#c9f0a0', True, step=.005)
    shock(0, 0, .55, .1, ('#ffffff', '#c9f0a0', WHITE), a0=0, a1=359)
    arrow(-.55, -.55, .25, .25, '#c9a070', .38, .14, hcol='#ffffff', fl='#6fdc6f')
    burst(.3, .3, 8, .5, .15, pal('#ffffff'))


@U_('sk_ult_rodeur')
def _():
    glow(ngon(0, 0, .96), pal('#2f7a3a'), shrink=(1, .88, 0, 0), off=(0, 0, 0, 0), c0=(0, 0))
    stag(0, -.05, .8, '#4aa856', ant='#7a4a30')
    for x, z, a in ((-.75, .5, 40), (.78, .45, -40), (-.7, -.5, 110), (.7, -.55, -110)):
        leaf(x, z, .28, a, '#9ae07a')


@U_('sk_ult_tempete')
def _():
    gstroke([(.5 * (t / 16) * math.cos(math.radians(t * 36)) * 1.8, .5 * (t / 16) * math.sin(math.radians(t * 36)) * 1.8) for t in range(0, 19)], .24, GRN, fr=(1, .6, .3, 0))
    for a in (30, 150, 270):
        with xf(a - 90, 1, 0, 0):
            arrow(.1, .35, .1, .98, '#c9a070', .3, .1, hcol='#e0e6f2')
    bolt(0, 0, .5, pal('#ffe27a'))


# ---- sorcier ults
@U_('sk_ult_sorcier')
def _():
    p = pal('#8a5ac8')
    shock(0, -.5, .95, .1, pal('#c58bff'), a0=190, a1=350, rz=.35)
    fill(stroke([(-.9, .95), (.15, -.1)], .95, .25, lambda t: .15 + .65 * t), p[0], True, step=.012)
    fill(stroke([(-.8, .8), (.15, -.1)], .6, .1, lambda t: .1 + .5 * t), p[1], True, step=.012)
    orb(.2, -.2, .5, '#c58bff', e=True)
    burst(.2, -.2, 8, .8, .35, pal('#ff7ad9'))


@U_('sk_ult_elementaliste')
def _():
    for (x, z, c) in ((0, .62, '#ff6b3d'), (.62, 0, '#6fd3ff'), (0, -.62, '#6fdc6f'), (-.62, 0, '#c58bff')):
        fill(stroke([(x * .3, z * .3), (x, z)], .22), pal(c)[1], True, step=.01)
        orb(x, z, .27, c, e=True)
    orb(0, 0, .3, '#ffffff', e=True)
    ring(0, 0, .45, .08, '#fff0d8', True)


@U_('sk_ult_arcaniste')
def _():
    ring(0, 0, .85, .24, '#ff7ad9', True, rz=.3) if False else None
    shock(0, 0, .88, .2, pal('#ff7ad9'), rz=.38)
    orb(0, 0, .38, '#1a0820', e=False, gl=False)
    ring(0, 0, .4, .07, '#ffc4f0', True)
    sparks([(-.8, .6), (.8, -.55), (.6, .75)], '#ffc4f0', .14)


@U_('sk_ult_chrono')
def _():
    clock(0, 0, .75, '#8a5ac8', face='#d8c8f8')
    fill(stroke([(0, 0), (-.1, .45)], .12), '#c0392b', nolayer=True, bv=0, th=.01)
    fill(stroke([(0, 0), (.3, -.1)], .1), '#2a1050', nolayer=True, bv=0, th=.01)
    for a, d in ((60, .95), (160, .9), (250, .95), (330, .92)):
        r = math.radians(a)
        fill([(.95 * d * math.cos(r), .95 * d * math.sin(r)), ((.95 * d - .25) * math.cos(r + .2), (.95 * d - .25) * math.sin(r + .2)), ((.95 * d - .25) * math.cos(r - .2), (.95 * d - .25) * math.sin(r - .2))], '#c58bff', True, step=.005)


@U_('sk_ult_occultiste')
def _():
    ring(0, -.55, .9, .13, '#8a5ac8', True, rz=.3)
    ring(0, -.55, .62, .08, '#c58bff', True, rz=.2)
    fill(stroke([(0, -.6), (0, -.1)], .2), '#d8c8f8', step=.02)
    for x, hh in ((-.3, .45), (-.1, .62), (.1, .6), (.3, .45)):
        fill(stroke([(x, -.1), (x + (x * .3), -.1 + hh)], .14, .1), '#d8c8f8', step=.004)
    fill(stroke([(-.42, -.2), (-.78, .1)], .14, .1), '#d8c8f8', step=.004)
    fill(ngon(0, -.15, .32, .25, 10), '#d8c8f8', step=.01)
    sparks([(.8, .6)], '#c58bff', .14)


# ---- soigneur ults
@U_('sk_ult_soigneur')
def _():
    ring(0, 0, .9, .1, '#c8ffd8', True)
    for a in range(0, 360, 60):
        with xf(a, 1, 0, 0):
            leaf(0, .45, .52, 0, '#5fe07a' if a % 120 == 0 else '#3fae5a', w=.5)
    orb(0, 0, .26, '#ffe27a', e=True)


@U_('sk_ult_pretre')
def _():
    wings(0, .15, .98, '#e8fff0', e=False, mirror=True)
    cross(0, -.05, .5, '#5fe07a', t=.34)
    burst(0, -.05, 8, .5, .2, pal('#ffe27a')) if False else None


@U_('sk_ult_druide')
def _():
    fill(ngon(0, .25, .95, .78, 16), '#2f9a5a', step=.02)
    fill([(-.14, -.95), (.14, -.95), (.1, 0), (-.1, 0)], '#7a4a30', step=.02)
    for x, z in ((-.55, .35), (.0, .6), (.55, .3), (-.3, .0), (.3, .0)):
        fill(ngon(x, z, .26, .26, 10), '#5fe07a', step=.003)
    for x, z in ((-.35, .5), (.25, .35), (.55, .55), (-.6, .15), (.0, .25)):
        fill(star(x, z, 5, .12, .06), '#ff9ad0', True, step=.003)
    lay(.03)
    sparks([(-.8, -.5), (.8, -.6)], '#ffc4f0', .13)


@U_('sk_ult_hemo')
def _():
    p = pal('#e83a4a')
    slash(0, .35, .95, 195, 345, .72, p, taper=.5)
    drop(0, .3, .55, '#ff5a6a')
    sparks([(-.75, .6), (.75, .6)], '#ffb0b8', .14)


# ---- soutien ults
@U_('sk_ult_soutien')
def _():
    for z in (.1, .32, .54, .76):
        fill(stroke(arcpath(0, -1.2, 1.2 + z, 62, 118, 12), .1), '#e0b040', step=.003)
    for i in range(5):
        a = math.radians(66 + 12 * i)
        fill(star((1.55) * math.cos(a), -1.2 + 1.55 * math.sin(a), 5, .17, .08), '#fff0a0', True, step=.003)
    lay(.03)
    note(-.3, -.5, .45, '#ffcf4a', True)
    note(.3, -.55, .4, '#fff0a0', True)
    sparks([(-.8, .6), (.8, .6)], WHITE, .16)


@U_('sk_ult_troubadour')
def _():
    p = pal('#ff8a3a')
    flame(.0, -.15, .62, p, lean=.2)
    lute(-.15, -.2, .7, '#e0b040')
    for x, z, c in ((.6, .65, '#ffcf4a'), (-.7, .6, '#ff7ad9'), (.2, .8, '#4de0c0'), (.8, .15, '#ff5a5a')):
        note(x, z, .22, c, True)


@U_('sk_ult_chantre')
def _():
    bannerpole(-.5, .0, .8, '#c0392b', tip=GOLD)
    fill(stroke([(-.15, -.55), (.2, -.35), (.5, -.1), (.7, .15)], .16, .7), '#e0b040', step=.02)
    fill(ngon(-.2, -.58, .12), '#c0392b', step=.01)
    for r_ in (.4, .75):
        shock(.7, .2, r_, .1, pal('#ff5a5a'), a0=-40, a1=40)


@U_('sk_ult_enchanteur')
def _():
    p = pal('#ff7ad9')
    ring(0, 0, .9, .1, '#ff7ad9', True)
    fill(star(0, 0, 8, .85, .38, 90), p[0], True, step=.01)
    fill(star(0, 0, 8, .62, .3, 90), p[1], True, step=.01)
    fill(star(0, 0, 8, .4, .2, 90), p[2], True, step=.01)
    orb(0, 0, .15, '#ffffff', e=True)
