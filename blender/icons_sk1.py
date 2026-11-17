"""icons_sk1.py - competences d'arbre par famille (sk_<id>), ames (sk_ame_*) et competences de sous-classe (sk_sub_*)."""
from icon_parts import *


def I(k):
    return icon(k, 32)


# ================================================================== SOUTIEN (dore)
@I('sk_cri')
def _():
    p = P('soutien')
    ellipse = ngon(-.5, 0, .38, .48, 16)
    fill(ellipse, '#d04a5a', step=.03)
    fill(ngon(-.46, -.05, .25, .36, 14), '#4a1830', False, nolayer=True, bv=0, th=.01)
    fill(ngon(-.46, -.22, .17, .14, 10), '#ff8a9a', False, nolayer=True, bv=0, th=.01)
    for r_, w in ((.42, .17), (.7, .17), (.98, .15)):
        slash(-.2, 0, r_, -42, 42, w * 1.9, p, taper=.5)


@I('sk_inspir')
def _():
    p = P('soutien')
    burst(0, .38, 5, .85, .38, p, rot=90)
    person(0, -.62, .55, '#d8a060', head=SKIN)
    sparks([(-.75, .75), (.78, .7)], p[2], .15)


@I('sk_donabs')
def _():
    p = P('soutien')
    hand(-.78, -.3, .5, SKIN, fist=False, rot=-70)
    hand(.78, -.3, .5, '#e0b080', fist=False, rot=70)
    glow(ngon(0, .1, .5), p, shrink=(1, .8, .5, 0), off=(0, 0, 0, 0))
    heart(0, .1, .42, '#ff5a8a', True)
    sparks([(0, .78), (-.55, .58), (.55, .58)], WHITE, .13)


@I('sk_aura')
def _():
    p = P('soutien')
    for r_ in (.92, .64):
        shock(0, 0, r_, .17, p)
    orb(0, 0, .3, F['soutien'], e=True)


@I('sk_miroir')
def _():
    fill(stroke([(0, -.55), (0, -1.0)], .2), GOLDM, step=.02)
    fill(ngon(0, .22, .68, .78, 22), GOLD, step=.03)
    fill(ngon(0, .22, .53, .63, 22), '#cfeaff', step=.02)
    fill(stroke([(-.25, .6), (.05, .8)], .09), WHITE, True, nolayer=True)
    heart(0, .2, .3, '#ff5a7a', True)


@I('sk_chef')
def _():
    p = P('soutien')
    fill([(-.75, -.95), (.75, -.95), (.5, -.65), (-.5, -.65)], '#8a7050', step=.03)
    fill(stroke([(-.15, -.8), (-.15, .95)], .12), WOODC, step=.03)
    fill([(-.1, .9), (.9, .5), (.55, .35), (.9, .1), (-.1, .0)], GOLD, step=.03)
    fill([(-.05, .8), (.6, .52), (-.05, .35)], shade(GOLD, .5), True, nolayer=True)
    fill(star(-.15, 1.0, 3, .13, .06), WHITE, True, step=.02)


@I('sk_refrain')
def _():
    p = P('soutien')
    gstroke(arcpath(0, -.05, .5, 200, 520, 22), .16, p, fr=(1, .45, 0, 0))
    note(-.55, -.5, .42, GOLD, True)
    note(.55, -.3, .38, F['soutien'], True)
    note(.05, .55, .45, '#fff0a0', True)


@I('sk_sub_etendard')
def _():
    fill([(-.6, -.95), (.6, -.95), (.4, -.75), (-.4, -.75)], '#8a7050', step=.03)
    fill(stroke([(-.45, -.8), (-.45, .95)], .12), WOODC, step=.03)
    fill(stroke([(-.45, .85), (.9, .85)], .08), GOLDM, step=.02)
    pts = [(-.4, .8), (0, .86), (.4, .8), (.85, .84), (.85, -.3), (.4, -.25), (0, -.33), (-.4, -.27)]
    fill(pts, GOLD, step=.03)
    fill([(-.3, .65), (.8, .7), (.8, .5), (-.3, .46)], shade(GOLD, .5), True, nolayer=True)
    fill(star(.2, .2, 5, .28, .12), '#c0392b', step=.02)
    fill(star(-.45, 1.0, 4, .13, .05), WHITE, True, step=.02)


@I('sk_sub_conteur')
def _():
    p = P('soutien')
    book(0, -.45, .85, '#c08a20', CREAM)
    for x, z, r in ((0, .62, .34), (-.6, .38, .2), (.62, .42, .22)):
        fill(star(x, z, 5, r, r * .45), GOLD, True, step=.02)
        fill(star(x, z, 5, r * .5, r * .22), WHITE, True, step=.02)


@I('sk_sub_tacticien')
def _():
    fill(rect(0, 0, 1.75, 1.5), '#e8d9a8', step=.03)
    fill(rect(0, 0, 1.55, 1.3), '#f2e8c4', step=.02)
    arrow(-.65, -.45, .1, .3, '#c0392b', .35, .1)
    arrow(.65, -.5, .2, -.1, '#4a6ab8', .32, .1)
    fill(ngon(.25, .08, .2, n=12), GOLD, step=.02)
    fill([(.05, -.3), (.45, -.3), (.35, -.1), (.15, -.1)], GOLD, step=.02)
    fill(ngon(.25, .06, .13, n=10), shade(GOLD, .4), True, nolayer=True)


# ================================================================== SOIN (vert)
@I('sk_premsoins')
def _():
    cross(0, 0, .82, F['soin'], t=.36)
    fill(stroke([(-.75, -.5), (.75, .5)], .42), '#f2ead6', step=.03)
    for t in (-.4, -.1, .2, .5):
        fill(stroke([(t * 1.1 - .12, t * .74 + .22), (t * 1.1 + .12, t * .74 - .22)], .06), '#c9b890', nolayer=True, bv=0, th=.01)


@I('sk_rosee')
def _():
    leaf(0, -.15, .95, 35, '#3fae5a', vein='#a8f0b8', w=.5)
    for x, z, r in ((-.5, .55, .22), (.2, .7, .26), (.7, .2, .2)):
        drop(x, z, r * 1.3, '#bfe8ff', shine=True)


@I('sk_regen')
def _():
    p = P('soin')
    gstroke([(0.82 * (t / 20) ** .8 * math.cos(math.radians(t * 28 - 90)) * .95, -.85 + 1.7 * t / 20) for t in range(0, 21)], .28, p, fr=(1, .6, .28, 0))
    cross(.45, .62, .27, '#e8fff0', True, t=.34)
    cross(-.5, -.25, .16, '#bfffd0', True, t=.34)


@I('sk_bened')
def _():
    p = P('soin')
    burst(0, .1, 10, .95, .5, p, rot=90)
    fill([(-.3, -.8), (-.38, -.1), (-.1, .65), (0, .8), (.1, .65), (.38, -.1), (.3, -.8)], SKIN, step=.03)
    fill([(0, .8), (0, -.8)], SKIN, bv=0, th=.01, nolayer=True) if False else None
    fill(stroke([(0, .75), (0, -.5)], .05), '#b07a50', nolayer=True, bv=0, th=.01)
    fill(rect(0, -.85, .8, .2), '#f2ead6', step=.02)
    sparks([(-.7, .7), (.72, .62)], GOLD, .15)


@I('sk_souffle')
def _():
    p = P('soin')
    gstroke(arcpath(0, 0, .6, 90, 410, 26), .3, p, prof=lambda t: .12 + .34 * t, fr=(1, .6, .3, 0))
    gstroke(arcpath(0, 0, .2, 120, 400, 18), .2, p, prof=lambda t: .1 + .12 * t, fr=(1, .5, 0, 0))
    leaf(.55, .55, .42, -50, '#3fae5a', vein='#a8f0b8')


@I('sk_rappel')
def _():
    p = P('gold' if False else '#ffe27a')
    fill(stroke([(.9, .95), (.1, .2)], .5, .05, lambda t: .05 + .45 * (1 - t) ** .3 * (1 - t)), '#ffe27a', True, step=.01)
    fill(star(.1, .15, 5, .36, .17), '#fff6b0', True, step=.02)
    fill(star(.1, .15, 5, .2, .09), WHITE, True, step=.02)
    person(0, -.7, .5, '#2f9a5a', rot=90)
    fill(ngon(-.55, -.75, .17), '#2f9a5a', step=.02)
    sparkle(-.6, .45, .2, '#a8f0b8')


@I('sk_vampir')
def _():
    p = P('soin')
    glow(ngon(0, .1, .85), (mix(p[0], '#101010', .2), p[1]), shrink=(1, .7), off=(0, .0), c0=(0, .1)) if False else None
    fill([(-.8, .75), (.8, .75), (.65, .5), (.15, -.55), (0, -.8), (-.15, -.55), (-.65, .5)], '#f2ead6', step=.03)
    fill([(-.45, .55), (.45, .55), (.1, -.35), (-.1, -.35)], '#c0453a', step=.02)
    fill([(-.65, .75), (-.1, .75), (-.2, .45), (-.55, .55)], F['soin'], True, nolayer=True)
    drop(0, -.62, .28, '#e83a4a')


@I('sk_phenix')
def _():
    p = P('#ffcf4a')
    flame(.1, -.05, .85, pal('#ff8a3a'), lean=.5, hw=.5)
    leaf(0, -.15, .85, 35, '#7fe07a', vein='#fff0a0', w=.38)
    fill(stroke([(-.45, -.6), (.2, .1)], .06), '#2f9a5a', nolayer=True, bv=0, th=.01)
    sparks([(-.65, .6)], GOLD, .15)


@I('sk_mainten')
def _():
    hand(-.35, -.2, .62, '#5fe07a', fist=False, rot=-75)
    person(.6, -.35, .3, '#2f9a5a', head='#a8f0b8')
    sparks([(.2, .5), (.62, .55), (-.3, .65)], '#e8fff0', .17)
    sparkle(.25, .15, .13, GOLD)


@I('sk_sub_medic')
def _():
    fill(stroke(arcpath(0, .35, .45, 10, 170, 10), .13), '#5a3a28', step=.02)
    fill([(-.6, .45), (.6, .45), (.95, -.55), (-.95, -.55)], WOODC, step=.03)
    fill(rect(0, -.7, 1.9, .26), WOOD_D, step=.02)
    fill(ngon(0, -.05, .32), WHITE, step=.02)
    cross(0, -.05, .22, F['soin'], t=.36)


# ================================================================== PROTECTION (bleu ciel)
@I('sk_egide')
def _():
    burst(0, 0, 8, 1.0, .72, P('protection'), rot=90)
    shield(0, 0, .72, F['protection'], emblem='star')


@I('sk_murviv')
def _():
    wallc = '#8aa8c8'
    fill(rect(0, -.25, 1.9, 1.2), wallc, step=.03)
    for z in (-.7, -.4, -.1, .2):
        fill(stroke([(-.95, z), (.95, z)], .05), '#4a6a90', nolayer=True, bv=0, th=.01)
    for i, z in enumerate((-.55, -.25, .05)):
        for x in ((-.45, .3) if i % 2 == 0 else (-.1, .7, -.8)):
            fill(stroke([(x, z - .15), (x, z + .15)], .05), '#4a6a90', nolayer=True, bv=0, th=.01)
    fill([(-.95, .35), (.95, .35), (.95, .8), (.6, .8), (.6, .6), (.2, .6), (.2, .8), (-.2, .8), (-.2, .6), (-.6, .6), (-.6, .8), (-.95, .8)], wallc, step=.03)
    fill([(-.5, .15), (0, .6), (.5, .15), (.5, -.1), (0, .35), (-.5, -.1)], '#ff5a5a', True, step=.02)


@I('sk_garde')
def _():
    person(.1, -.1, 1.0, '#4a5a8a', head='#d8b090')
    shield(-.28, -.3, .5, F['protection'], emblem='chev')


@I('sk_coeur')
def _():
    shield(0, -.05, .9, F['protection'])
    heart(0, .05, .52, '#ff5a6a')
    fill([(.02, .55), (-.08, .3), (.1, .15), (-.05, -.15), (.08, -.3), (.03, -.2), (.16, .1), (0, .28)], DARK, False, nolayer=True, bv=0, th=.01)
    fill(stroke([(-.04, .5), (-.1, .3), (.06, .12), (-.06, -.1), (.04, -.28)], .06), DARK, False, nolayer=True, bv=0, th=.01)


@I('sk_promesse')
def _():
    p = P('protection')
    gstroke([(-.9, -.55), (-.5, -.1), (0, -.25), (.5, -.1), (.9, -.55)], .22, p, fr=(1, .6, .3, 0))
    fill(stroke(arcpath(-.2, .12, .42, -20, 200, 14), .2), SKIN, step=.03)
    fill(stroke(arcpath(.2, .12, .42, -20, 200, 14)[::-1], .2), '#e0b080', step=.03)
    fill(stroke([(-.62, -.3), (-.62, .1)], .2), SKIN, step=.02)
    fill(stroke([(.62, -.3), (.62, .1)], .2), '#e0b080', step=.02)
    sparkle(0, .75, .17, WHITE)


@I('sk_dernier')
def _():
    candle(0, .1, .75, lit=True)
    shield(0, -.5, .65, F['protection'])


@I('sk_sentinel')
def _():
    shield(0, 0, .95, F['protection'], trim='#4a7ab0', kind='kite')
    eye(0, .05, .5, '#fff6d8', pupil='#1d3a6a', iris='#4a7ae0')


@I('sk_sub_exorciste')
def _():
    glow(ngon(0, 0, .95), pal('#bfe8ff'), shrink=(1, .85, 0, 0), off=(0, 0, 0, 0), c0=(0, 0))
    fill(rect(0, 0, 1.0, 1.55), '#f2ead6', step=.03)
    fill(rect(0, .65, 1.0, .14), '#c0392b', step=.01)
    fill(ngon(0, .05, .27, n=16), GOLD, step=.02)
    fill(ngon(0, .05, .17, n=16), '#f2ead6', nolayer=True, bv=0, th=.01)
    for x in (-.28, .28):
        fill(stroke([(x, -.2), (x, -.65)], .1), '#c0392b', nolayer=True, bv=0, th=.01)
    fill(stroke([(0, .55), (0, -.1)], .06), '#c0392b', nolayer=True, bv=0, th=.01)


@I('sk_sub_garde')
def _():
    person(.55, -.35, .55, '#4a5a8a', head='#d8b090')
    shield(-.15, 0, .95, F['protection'], kind='pavise', emblem='cross')


# ================================================================== DEGATS (rouge)
@I('sk_frappe')
def _():
    p = P('degats')
    shock(0, 0, .86, .12, p)
    burst(0, 0, 8, .8, .28, p, rot=90)


@I('sk_tourb')
def _():
    p = P('degats')
    slash(0, 0, .72, 100, 450, .42, p, head=.8, taper=.4)
    sparkle(.72, .62, .15, WHITE)


@I('sk_grace')
def _():
    skull(0, -.55, .55, '#e8e0d8')
    dagger(0, .2, .8, rot=180, col='#e0e6f2', hilt=WOOD_D)
    burst(0, -.18, 6, .4, .15, P('degats'))


@I('sk_brute')
def _():
    p = P('degats')
    hand(.05, -.05, .85, '#e86a5a', fist=True)
    for z in (.55, .2, -.15):
        fill(stroke([(-.95, z), (-.68, z)], .09), '#ffb0a0', True, step=.01)
    burst(.78, .62, 4, .3, .1, p)


@I('sk_gloire')
def _():
    for sx in (-1, 1):
        with xf(0, 1, 0, 0, flip=(sx < 0)):
            fill(stroke(arcpath(0, 0, .68, 250, 380 - 20, 12), .1), '#a02a2a', step=.01)
            for a, r in ((255, 1), (280, 1), (305, 1), (330, .95), (355, .8)):
                x, z = .68 * math.cos(math.radians(a)), .68 * math.sin(math.radians(a))
                with xf(a + 90 - 25, 1, x, z):
                    leaf(.0, .22, .3, 0, '#ff5a5a' if int(a) % 2 else '#e03a3a', vein=None, w=.45)
    fill(star(0, .75, 5, .26, .12), GOLD, step=.02)


@I('sk_meteore')
def _():
    p = P('#ff6b3d')
    fill(stroke([(-.9, .9), (.2, -.2)], .9, .2, lambda t: .15 + .75 * t), p[0], True, step=.012)
    fill(stroke([(-.8, .8), (.2, -.2)], .6, .1, lambda t: .1 + .5 * t), p[1], True, step=.012)
    fill(stroke([(-.7, .7), (.2, -.2)], .3, .1, lambda t: .05 + .26 * t), '#ffd88a', True, step=.012)
    fill(ngon(.4, -.4, .46, n=12), '#7a3a2a', step=.03)
    fill(ngon(.32, -.32, .3, n=10), '#a8553a', nolayer=True)
    fill(ngon(.5, -.52, .13, n=8), '#4a2420', nolayer=True, bv=0, th=.01)
    sparks([(.8, .3)], '#ffd88a', .14)


@I('sk_lame')
def _():
    shock(0, 0, .9, .1, P('degats'))
    sword(0, 0, .85, rot=0, col='#e0e6f2')
    for x, z in ((-.5, .5), (.5, -.2), (-.45, -.45)):
        fill(star(x, z, 5, .18, .08), GOLD, True, step=.02)


@I('sk_brasier')
def _():
    flame(0, 0, .95, pal('#ff4a3a'), lean=.4, hw=.62)
    gstroke(arcpath(0, -.1, .3, 100, 430, 18), .12, (pal('#ff4a3a')[0], '#ffcf4a', '#fff0a0', WHITE), fr=(1, .6, 0, 0))


@I('sk_chaine')
def _():
    p = P('controle')
    zig([(.3, .95), (-.2, .35), (.15, .25), (-.35, -.35), (.0, -.4), (-.2, -.95)], .3, p)
    zig([(.0, .3), (.5, .05), (.3, -.1), (.8, -.45)], .2, p)
    zig([(-.15, -.05), (-.6, .15), (-.75, .5)], .16, p)
    sparkle(.8, -.45, .17)


@I('sk_rayon')
def _():
    p = P('#ffcf4a')
    fill([(-.28, 1), (.28, 1), (.5, -.55), (-.5, -.55)], p[0], True, step=.012)
    fill([(-.18, 1), (.18, 1), (.3, -.55), (-.3, -.55)], p[1], True, step=.012)
    fill([(-.08, 1), (.08, 1), (.14, -.55), (-.14, -.55)], WHITE, True, step=.012)
    lay(.05)
    for r_, c in ((.85, '#5a3a3a'), (.55, '#ff5a5a'), (.25, '#ffffff')):
        fill(ngon(0, -.6, r_, r_ * .35, 22), c, step=.02)
    burst(0, -.6, 6, .5, .15, p)


@I('sk_nova')
def _():
    p = P('#ff7ad9')
    shock(0, 0, .85, .14, p)
    orb(0, 0, .42, '#ff7ad9', e=True)
    for a in range(0, 360, 45):
        r = math.radians(a)
        fill(star(.82 * math.cos(r), .82 * math.sin(r), 4, .14, .05), WHITE, True, step=.01)


@I('sk_ecrase')
def _():
    fill(stroke([(-.95, -.7), (.95, -.7)], .22), '#5a4a6a', step=.02)
    for a in (200, 240, 270, 300, 340):
        r = math.radians(a)
        fill(stroke([(0, -.65), (.5 * math.cos(r) + (.1 if a % 2 else -.1), -.65 + .5 * -math.sin(r) * -.5 + .3), (.9 * math.cos(r), -.65 + .7)], .08, .02), '#ff5a5a', True, step=.01) if False else None
    for dx in (-.8, -.45, 0, .45, .8):
        fill(stroke([(dx * .3, -.65), (dx * .7, -.35), (dx, -.1)], .1, .03), '#ff5a5a', True, step=.01)
    hammer(.25, .35, .7, rot=-40)
    burst(0, -.62, 8, .45, .15, P('degats'))


@I('sk_couronne')
def _():
    for i in range(3):
        fill(rect(-.5 + .5 * i, -.85 + .22 * i, .5, .2 * (i + 1) + .1), shade('#c0453a', .1 * i - .1), step=.02)
        fill(rect(-.5 + .5 * i, -.7 + .3 * i + .1 * i, .5, .06), '#ff9a8a', True, nolayer=True)
    crown(.0, .45, .55, '#ff5a5a', gem=GOLD)
    arrow(-.8, -.2, -.5, .3, '#ff9a8a', .22, .07, e=True)


@I('sk_moidabord')
def _():
    hand(.0, -.2, .75, '#ff7a6a', fist=False, rot=15)
    coin(-.5, .55, .32, GOLD)
    fill(stroke(arcpath(-.2, .5, .6, 60, -40, 10), .07), '#ff9a8a', True, nolayer=True)
    sparkle(.6, .65, .17)


# ================================================================== CONTROLE (violet)
@I('sk_entrave')
def _():
    for i in range(8):
        a = 360 * i / 8
        x, z = .72 * math.cos(math.radians(a)), .72 * math.sin(math.radians(a))
        with xf(a + 90, 1, x, z):
            if i % 2:
                ring(0, 0, .2, .13, '#9a6ad8', rz=.12)
            else:
                ring(0, 0, .24, .15, '#c58bff', rz=.16)


@I('sk_pointf')
def _():
    for r_, c in ((.92, '#a070f0'), (.66, '#f2e6ff'), (.4, '#a070f0'), (.17, '#f2e6ff')):
        fill(ngon(0, 0, r_), c, step=.02)
    fill(stroke([(.0, .6), (-.1, .3), (.1, .1), (-.1, -.12), (.08, -.35), (0, -.7)], .13), DARK, nolayer=True, bv=0, th=.01)
    fill(stroke([(.1, .1), (.45, .2)], .08), DARK, nolayer=True, bv=0, th=.01)
    fill(stroke([(-.1, -.12), (-.5, -.2)], .08), DARK, nolayer=True, bv=0, th=.01)


@I('sk_intim')
def _():
    mask(0, 0, .95, '#a070f0')
    for x in (-.55, .55):
        fill(star(x, .72, 4, .15, .05), '#f2e6ff', True, step=.01)


@I('sk_etourd')
def _():
    hammer(0, -.05, .75, rot=35)
    for a in (40, 160, 280):
        r = math.radians(a)
        fill(star(.78 * math.cos(r), .75 * math.sin(r) + .1, 5, .2, .09), '#ffe27a', True, step=.01)
    lay(.04)


@I('sk_analyse')
def _():
    hexa(-.2, .2, .65, '#7a50b8')
    fill(stroke([(-.2, .2), (-.2, .55)], .08), '#f2e6ff', True, nolayer=True)
    fill(stroke([(-.2, .2), (.12, .0)], .08), '#f2e6ff', True, nolayer=True)
    fill(stroke([(-.2, .2), (-.52, .0)], .08), '#f2e6ff', True, nolayer=True)
    magnifier(.28, -.2, .78, '#b9b5cc', lens='#e6d8ff', handle='#6a48b8')


@I('sk_temps')
def _():
    hourglass(0, 0, .88, '#6a48b8', '#c58bff', glass='#d8c8f8')
    fill(stroke([(-.1, .55), (.05, .2), (-.08, 0), (.06, -.3)], .09), DARK, nolayer=True, bv=0, th=.01)


@I('sk_lancegl')
def _():
    p = pal('#7a8aff')
    shard(-.7, -.7, .75, .75, .36, p, mid=.4)
    with xf(0, 1, 0, 0):
        shard(-.85, .1, -.25, .55, .15, pal('#9ad8ff'))
        shard(.1, -.85, .6, -.25, .15, pal('#9ad8ff'))
    sparkle(-.5, .72, .15)


@I('sk_ronces')
def _():
    thorn_ring(0, 0, .65, '#5aa83a', 3)
    with xf(60, 1, 0, 0):
        thorn_ring(0, 0, .42, '#9a6ad8', 3)
    sparkle(.7, .65, .13, '#e6d8ff')


@I('sk_toxine')
def _():
    drop(0, .05, .95, '#5ad03a')
    skull(0, -.1, .34, '#e8f8d8', eye='#2a5a20')
    for x, z in ((.6, .6), (-.62, .5)):
        fill(ngon(x, z, .1), '#8af070', True, step=.01)


@I('sk_malefice')
def _():
    for a in range(0, 360, 60):
        r = math.radians(a + 30)
        rune(.82 * math.cos(r), .78 * math.sin(r), .15, '#8a5ad8', kind=a // 60, w=.17)
    eye(0, 0, .62, '#e6d8ff', pupil='#2a1050', iris='#a070f0', slit=True)


@I('sk_echiquier')
def _():
    for i in range(4):
        for j in range(2):
            fill(rect(-.75 + .5 * i, -.75 + .26 * j, .5, .26), '#a070f0' if (i + j) % 2 else '#3a2a5a', step=.005, nolayer=True, bv=0, th=.02)
    lay(.04)
    knight(0, .12, .75, '#c58bff')


@I('sk_sub_runiste')
def _():
    stone(0, 0, .95, '#8a86a0')
    rune(0, .02, .45, '#c58bff', kind=4, w=.18)
    sparkle(.65, .6, .14, WHITE)


@I('sk_sub_saboteur')
def _():
    trap(0, -.05, .95, '#6a6a8a', '#c58bff')
    sparkle(.6, .6, .15, '#c58bff')


@I('sk_sub_pisteur')
def _():
    for r_, c in ((.92, '#a070f0'), (.7, '#4a2a7a'), (.5, '#c58bff')):
        fill(ngon(0, 0, r_), c, step=.02)
    paw(0, -.03, .42, '#f2e6ff')


# ================================================================== DEFENSE (gris acier)
@I('sk_peau')
def _():
    fill(stroke([(-.8, -.7), (-.2, -.1), (.5, .35), (.85, .7)], .62, .5), '#8a86a0', step=.03)
    for (x, z) in ((-.35, -.35), (.0, 0), (.38, .35), (.65, .6), (-.05, -.4), (.3, -.05), (.6, .2)):
        fill(ngon(x, z, .17, .15, 8), '#c9c6d8', step=.005)
        fill(ngon(x - .04, z + .04, .06, n=5), WHITE, True, nolayer=True)
    fill(ngon(.88, .75, .2, n=8), '#a9a6b8', step=.02)


@I('sk_vigueur')
def _():
    heart(0, .05, .92, '#8a86a0')
    heart(-.05, .12, .62, '#a9a6b8')
    cross(0, .05, .3, WHITE, True, t=.34)


@I('sk_riposte')
def _():
    sword(-.1, .0, .82, rot=40)
    sword(.1, 0, .82, rot=-40)
    gstroke(arcpath(0, -.1, .85, 200, 340, 12), .13, P('#c9c6d8'), fr=(1, .5, 0, 0))
    fill([(-.88, -.2), (-.65, -.5), (-1.0, -.55)], '#ff9a3a', True, step=.01)


@I('sk_inebr')
def _():
    stone(0, -.55, .85, '#8a86a0')
    boot(0, .15, .75, '#a9a6b8', sole='#5a5870', rot=0)
    for dx in (-.7, .7):
        fill(stroke([(dx, -.2), (dx * 1.1, -.5), (dx * .9, -.85)], .09, .03), DARK, nolayer=True, bv=0, th=.01)


@I('sk_forter')
def _():
    tower(0, 0, .95, '#a9a6b8')


@I('sk_refus')
def _():
    flame(0, .4, .62, pal('#ff6b3d'), lean=.25)
    skull(0, -.3, .78, '#c9c6d8')
    fill(stroke([(.05, .05), (-.1, -.15), (.1, -.35)], .07), DARK, nolayer=True, bv=0, th=.01)


@I('sk_epines')
def _():
    spike_ring(0, -.15, .62, 9, '#d8d6e4', L=.32, w=.12)
    fill([(-.85, -.5)] + [(.85 * math.cos(math.radians(a)), -.5 + 1.15 * math.sin(math.radians(a))) for a in range(180, -1, -15)] + [(.85, -.5)], '#8a86a0', step=.03)
    fill(rect(0, -.55, 1.8, .22), '#6a6880', step=.02)
    for x, z in ((-.35, .2), (.15, .35), (.45, -.05), (-.1, -.1)):
        fill(ngon(x, z, .17, .13, 6), '#a9a6b8', nolayer=True)


@I('sk_roc')
def _():
    stone(0, 0, 1.0, '#8a86a0')
    fill(stroke([(.0, .75), (-.1, .3), (.1, 0), (-.05, -.5), (.05, -.75)], .17), '#fff6c0', True, step=.01)
    fill(stroke([(.0, .75), (-.1, .3), (.1, 0), (-.05, -.5), (.05, -.75)], .07), WHITE, True, step=.01)
    shock(0, 0, .95, .07, P('#c9c6d8'), a0=20, a1=70)
    shock(0, 0, .95, .07, P('#c9c6d8'), a0=200, a1=250)


# ================================================================== CHANCE (turquoise)
@I('sk_fortune')
def _():
    coin(0, 0, .8, '#4de0c0', mark='star')
    sparks([(.72, .72), (-.78, .55)], WHITE, .18)


@I('sk_lynx')
def _():
    eye(0, 0, .9, '#c8fff0', pupil='#0a3a30', iris='#2fb89a', slit=True)
    sparkle(.7, .55, .13)


@I('sk_coupch')
def _():
    gstroke([(-.9, -.6), (-.5, -.2)], .12, P('#4de0c0'), fr=(1, .6, .2, 0))
    gstroke([(-.95, -.2), (-.6, .05)], .09, P('#4de0c0'), fr=(1, .6, .2, 0))
    die(.15, .05, .72, '#f2fff8', pips=6, rot=18, pipc='#1a8a74')
    sparks([(.75, .75), (-.5, .7)], '#4de0c0', .16)


@I('sk_toutrien')
def _():
    fill(ngon(0, 0, .85, n=28), '#2a8a78', step=.03)
    # moitie gauche (etoile) / moitie droite (crane)
    fill([(0, .78), (-.78 * 0.0, .78)] + [(.78 * math.cos(math.radians(a)), .78 * math.sin(math.radians(a))) for a in range(90, 271, 15)] + [(0, -.78)], '#4de0c0', step=.02)
    fill([(0, .78)] + [(.78 * math.cos(math.radians(a)), .78 * math.sin(math.radians(a))) for a in range(90, -91, -15)] + [(0, -.78)], '#3a4a5a', step=.02)
    fill(star(-.36, 0, 5, .26, .12), WHITE, True, step=.02)
    skull(.36, 0, .27, '#d8e8e0', eye='#3a4a5a')


@I('sk_trefle')
def _():
    clover(0, .05, .95, '#4de0c0')
    sparkle(.7, .7, .15)


@I('sk_leste')
def _():
    crystal(.25, .45, .45, '#4de0c0')
    hand(-.1, -.4, .72, '#2a9a86', fist=False, rot=-25, cuff='#1f6a5c')
    sparkle(.7, .75, .14)


@I('sk_tresor')
def _():
    p = P('#4de0c0')
    shard(0, .0, 0, 1.0, .35, p)
    shard(-.2, .1, -.8, .65, .16, p)
    shard(.2, .1, .8, .65, .16, p)
    chest(0, -.6, .75, '#7a4a30')


@I('sk_aubaine')
def _():
    for r_, c in ((.88, '#3a4a5a'), (.64, '#e8fff8'), (.4, '#3a4a5a'), (.17, '#e8fff8')):
        fill(ngon(0, -.1, r_, r_ * .85), c, step=.02)
    horseshoe(.15, .45, .68, '#4de0c0', rot=-20)
    fill(stroke([(-.5, -.1), (-.3, -.3), (-.45, -.5)], .08), DARK, nolayer=True, bv=0, th=.01)


@I('sk_sub_contreb')
def _():
    pouch(0, .35, .75, '#2a9a86')
    for x, z, r in ((-.4, -.55, .22), (.1, -.7, .22), (.5, -.4, .2), (.0, -.3, .18)):
        coin(x, z, r, '#4de0c0', mark=None)


# ================================================================== DECOUVERTE (cyan)
@I('sk_erudit')
def _():
    book(0, -.2, .95, '#3a8ad8', CREAM)
    fill(star(0, .55, 5, .34, .15), '#6fd3ff', True, step=.02)
    fill(star(0, .55, 5, .18, .08), WHITE, True, step=.02)


@I('sk_flair')
def _():
    fill(ngon(0, 0, .9, n=28), '#3a8ad8', step=.03)
    fill(ngon(0, 0, .72, n=28), '#e8f4ff', step=.02)
    for a in (0, 90, 180, 270):
        with xf(a, 1, 0, 0):
            fill([(-.06, .5), (.06, .5), (0, .72)], '#3a8ad8', nolayer=True, bv=0, th=.01)
    fill([(0, .62), (.17, 0), (0, -.1), (-.17, 0)], '#ff5a5a', step=.02)
    fill([(0, -.62), (.17, 0), (0, .1), (-.17, 0)], '#3a8ad8', step=.01)
    fill(ngon(0, 0, .07), GOLD, step=.01)
    sparkle(.55, .55, .14)


@I('sk_invent')
def _():
    gear(-.1, -.1, .72, '#6fd3ff', n=8)
    burst(.62, .65, 4, .38, .1, P('#ffcf4a'))


@I('sk_etude')
def _():
    book(0, -.15, .95, '#3a8ad8', CREAM)
    for x in (-.35, -.1, .15):
        fill(stroke([(x + .3, .7), (x - .1, .1)], .09, .03), '#ff5a5a', True, step=.005)
    lay(.03)


@I('sk_alchim')
def _():
    flask(0, -.1, .82, '#6fd3ff', e_liq=True)
    for x, z, r in ((-.15, .72, .13), (.18, .95, .1), (.05, 1.0 - .05, .07)):
        fill(ngon(x, z, r), '#e8f8ff', True, step=.01)
    orb(.0, -.3, .12, '#e8f8ff', e=True)


@I('sk_carto')
def _():
    fill([(-.85, .65), (-.3, .8), (.3, .6), (.85, .75), (.85, -.65), (.3, -.8), (-.3, -.6), (-.85, -.75)], '#efe0b0', step=.03)
    for x in (-.3, .3):
        fill(stroke([(x, .75 if x < 0 else .6), (x, -.75 if x > 0 else -.6)], .05), '#c9b890', nolayer=True, bv=0, th=.01)
    fill(stroke([(-.6, -.3), (-.2, .2), (.2, -.1)], .06), '#c9a06a', nolayer=True, bv=0, th=.01)
    fill(stroke([(.25, -.35), (.65, .05)], .18), '#3ab0e8', True, step=.01)
    fill(stroke([(.65, -.35), (.25, .05)], .18), '#3ab0e8', True, step=.01)


@I('sk_eureka')
def _():
    p = P('#6fd3ff')
    burst(0, .25, 8, .95, .62, p, rot=90) if False else None
    fill(ngon(0, .25, .62), '#6fd3ff', True, step=.02)
    fill(ngon(-.05, .3, .45), '#cfeeff', True, step=.02)
    fill([(-.3, -.2), (.3, -.2), (.2, -.6), (-.2, -.6)], '#8a93aa', step=.03)
    fill(rect(0, -.78, .38, .16), '#5a5f78', step=.02)
    fill(rect(0, .35, .1, .35), '#d02a4a', True, nolayer=True)
    fill(ngon(0, .06, .07), '#d02a4a', True, nolayer=True)
    for a in (150, 90, 30):
        r = math.radians(a)
        fill(stroke([(.78 * math.cos(r), .25 + .78 * math.sin(r)), (.98 * math.cos(r), .25 + .98 * math.sin(r))], .09), '#cfeeff', True, step=.005)


@I('sk_sub_alchi')
def _():
    flask(-.35, .3, .6, '#6fd3ff', e_liq=True, rot=-50)
    for (x, z, r) in ((.15, -.1, .2), (.45, -.35, .26), (.2, -.62, .2), (.72, -.1, .14), (.62, -.7, .13)):
        drop(x, z, r * 1.4, '#6fd3ff', e=True, shine=False, rot=(x * 40))
    fill(stroke([(.0, .05), (.4, -.3)], .14), '#6fd3ff', True, step=.005)


# ================================================================== CUISINE (ambre)
@I('sk_encas')
def _():
    fill([(-.95, .1), (-.8, .5), (-.35, .72), (.35, .72), (.8, .5), (.95, .1)], '#e8a85a', step=.03)
    for x in (-.5, -.15, .2, .55):
        fill(ngon(x, .5, .07, n=6), '#f8d898', True, nolayer=True)
    fill([(-1.0, .0), (1.0, .0), (.9, -.15), (.5, -.08), (.1, -.18), (-.3, -.08), (-.9, -.15)], '#5fb040', step=.02)
    fill(rect(0, -.3, 1.8, .2), '#c0453a', step=.02)
    fill(rect(0, -.48, 1.7, .14), '#f2d878', step=.02)
    fill([(-.9, -.56), (.9, -.56), (.8, -.85), (-.8, -.85)], '#d0903f', step=.02)


@I('sk_festin')
def _():
    drumstick(0, 0, 1.0, '#d9892a', rot=0)
    sparks([(.7, .7), (-.85, -.2)], GOLD, .16)


@I('sk_ragout')
def _():
    pot(0, -.25, .88, '#6a5a6a', steam='#f2ead6')
    fill(ngon(0, .2, .74, .13, 14), '#c0652a', nolayer=True)


@I('sk_epices')
def _():
    chili(0, 0, 1.0, '#e0402a', rot=-10)
    flame(.7, .6, .3, pal('#ff8a3a'))
    flame(-.55, .65, .2, pal('#ffcf4a'))


@I('sk_banquet')
def _():
    p = P('#ffcf4a')
    cloche(0, -.2, .95, GOLD, lifted=True)
    for x in (-.4, .05, .5):
        fill(stroke([(x, -.5), (x + .12, -.25), (x - .08, 0), (x + .1, .2)], .09, .04), '#f2ead6', True, step=.005)
    fill(ngon(0, -.75, .65, .1, 14), '#c0453a', nolayer=True)


@I('sk_gouter')
def _():
    pot(.0, -.5, .7, '#6a5a6a')
    fill(stroke([(.6, .95), (.1, .1)], .13), GOLDM, step=.02)
    fill(ngon(.0, -.02, .26, .34, 12, 30), GOLD, step=.02)
    fill(ngon(-.03, .0, .15, .22, 10, 30), shade(GOLD, .45), True, nolayer=True)
    for x, z in ((-.3, .5), (-.7, .0)):
        sparkle(x, z, .14, '#f8d898')


# ================================================================== CELERITE (orange)
@I('sk_elan')
def _():
    boot(-.1, -.1, .8, '#d86a2a', sole='#7a3a1a')
    for sx, k in ((1, 0), ):
        with xf(10, .5, .35, .35):
            wings(0, 0, 1, '#ffd0a0', mirror=False, rot=0)
    sparks([(-.8, .75)], '#ffd0a0', .14)


@I('sk_double')
def _():
    p = P('#ff9a3a')
    slash(0, 0, 1.0, 55, 120, .24, p, taper=.4)
    with xf(0, 1, .42, -.2):
        slash(0, 0, 1.0, 55, 120, .24, p, taper=.4)
    with xf(0, 1, -.42, .1):
        slash(0, 0, 1.0, 55, 120, .24, p, taper=.4)


@I('sk_assaut')
def _():
    p = P('#ff9a3a')
    bolt(0, 0, .95, p, rot=-45)
    fill([(.9, .9), (.35, .85), (.9, .3)], '#ffd88a', True, step=.01)
    fill([(.9, .9), (.52, .84), (.9, .5)], WHITE, True, step=.01)


@I('sk_premier')
def _():
    drop(-.35, -.1, .55, '#e83a4a', rot=0)
    for i, z in enumerate((.1, .42, .74)):
        fill([(.1, z), (.55, z + .3), (1.0, z), (1.0, z - .2), (.55, z + .1), (.1, z - .2)], '#ff9a3a', True, step=.01)
        fill([(.35, z - .05), (.55, z + .12), (.75, z - .05), (.75, z - .12), (.55, z + .04), (.35, z - .12)], '#ffe0b0', True, step=.01)
    lay(.03)


@I('sk_furie')
def _():
    p = P('#ff9a3a')
    for i, dx in enumerate((-.62, -.2, .22, .64)):
        gstroke([(dx - .25, .95), (dx, .3), (dx + .25, -.95)], .28, p, prof=lambda t: .06 + .26 * sm(t, .6) * 1.0, fr=(1, .6, .28, 0))


@I('sk_fougue')
def _():
    p = P('#ff9a3a')
    flame(0, -.35, .62, p, lean=.2)
    flame(0, .5, .52, pal('#ffcf4a'), lean=.2)
    for z in (-.1, .35):
        fill([(-.75, z - .2), (0, z + .35), (.75, z - .2), (.75, z - .45), (0, z + .1), (-.75, z - .45)], '#ff6b3d', True, step=.01)


@I('sk_voile')
def _():
    cape(-.1, .05, 1.0, '#7a50b8', rot=0)
    for x, z, r in ((.55, .5, .28), (.78, .1, .22), (.42, -.3, .3), (.75, -.62, .2), (.2, -.8, .2)):
        fill(ngon(x, z, r, n=10), '#ff9a3a' if z > -.4 else '#ffcf8a', True, step=.01)
    lay(.03)


@I('sk_hate')
def _():
    p = pal('#ff9a3a')
    with xf(0, .55, -.9, .05):
        wings(0, 0, 1, '#ffb060', mirror=False, rot=100)
    clock(.15, 0, .68, '#ff9a3a', face='#fff0d8')
    with xf(0, .6, .95, .1):
        wings(0, 0, 1, '#ffb060', mirror=False, rot=70) if False else None


@I('sk_foncer')
def _():
    p = P('#ff9a3a')
    for z, L in ((.4, .9), (0, 1.1), (-.4, .8)):
        fill(stroke([(-.95 + (1 - L) * .3, z), (-.05, z)], .02, .2), p[1], True, step=.01)
        fill(stroke([(-.9 + (1 - L) * .3, z), (-.15, z)], .01, .08), WHITE, True, step=.01)
    head_helm(.35, 0, .72, '#b9c4d8', plume='#ff9a3a')


@I('sk_sub_dompteur')
def _():
    wolf(0, 0, .98, '#ff9a3a')
    fill(stroke([(.2, -.55), (.55, -.62)], .08), '#fff0d8', nolayer=True, bv=0, th=.01)


# ================================================================== AMES (couleur de voie : coeur vert, lame rouge, esprit cyan)
@I('sk_ame_altruiste')
def _():
    hand(-.62, -.35, .55, SKIN, fist=False, rot=-60)
    hand(.62, -.35, .55, '#e0b080', fist=False, rot=60)
    glow(ngon(0, .1, .55), pal('#5fe07a'), shrink=(1, .9, 0, 0), off=(0, 0, 0, 0)) if False else None
    heart(0, .1, .5, GOLD, True)
    sparks([(0, .75)], WHITE, .15)


@I('sk_ame_ambitieux')
def _():
    sword(0, -.2, .78, rot=0)
    crown(0, .6, .5, '#ff5a5a', gem=GOLD)


@I('sk_ame_calculateur')
def _():
    fill([(0, 1), (.95, 0), (0, -1), (-.95, 0)], '#4a2a7a', step=.03)
    fill([(0, .82), (.77, 0), (0, -.82), (-.77, 0)], '#c58bff', step=.02)
    eye(0, 0, .58, '#f2e6ff', pupil='#2a1050', iris='#6a48b8')


@I('sk_ame_impulsif')
def _():
    p = P('#ff9a3a')
    flame(0, 0, .95, p, lean=-.1, hw=.5)
    bolt(0, .0, .6, (pal('#ffe27a')[1], '#fff0a0', WHITE, WHITE), rot=0)


@I('sk_ame_stoique')
def _():
    shock(0, .15, .92, .09, P('#c9c6d8'), a0=0, a1=360)
    fill(ngon(0, .15, .8, n=30), '#4a4a68', step=.02)
    mountain(0, .0, .78, '#a9a6b8')


@I('sk_ame_curieux')
def _():
    fill(star(-.1, .1, 5, .85, .38), '#6fd3ff', True, step=.02)
    fill(star(-.1, .1, 5, .5, .22), '#cfeeff', True, step=.02)
    magnifier(.28, -.25, .65)


@I('sk_ame_gourmand')
def _():
    bowl(0, -.25, .85, '#e8945a', content='#c0652a')
    for x in (-.35, .0, .35):
        fill(stroke([(x, .25), (x + .12, .5), (x - .08, .75), (x + .08, .95)], .1, .04), '#f2ead6', True, step=.005)
    fill(stroke([(.7, .8), (.25, .1)], .1), GOLDM, step=.01)


@I('sk_ame_egoiste')
def _():
    glow(ngon(0, 0, .95), pal('#ff5a5a'), shrink=(1, .82, 0, 0), off=(0, 0, 0, 0), c0=(0, 0))
    person(0, -.1, .95, '#2a2040', head='#2a2040')
    fill(stroke([(-.3, .52), (.3, .52)], .05), '#4a3a60', nolayer=True, bv=0, th=.01)


@I('sk_ame_opportuniste')
def _():
    coin(0, .05, .8, '#4de0c0', mark=None)
    fill(stroke([(.05, .3), (.35, .25)], .08), DARK, nolayer=True, bv=0, th=.01)
    fill(ngon(-.3, .22, .08, n=8), DARK, nolayer=True, bv=0, th=.01)
    fill(stroke(arcpath(0, -.05, .32, 200, 340, 8), .08), DARK, nolayer=True, bv=0, th=.01)
    sparks([(.7, .72), (-.7, -.6)], WHITE, .16)
