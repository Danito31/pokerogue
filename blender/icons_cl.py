"""icons_cl.py - emblemes 48x48 : sous-classes (cl_<sub>), specialisations (cl_<spe>), divins (cl_<spe>_divin), cadres de forme (fr_*)."""
from icon_parts import *
from icons_sk2 import lute

PLATE_DK = '#2a2450'


def E48(k, post=None):
    return icon(k, 48, post)


# ------------------------------------------------------------------ fonds
def plate_sub(fam):
    base = F[fam]
    fill(ngon(0, 0, .98, n=44), '#8a5a10', step=.02)
    fill(ngon(0, 0, .93, n=44), GOLD, step=.02)
    fill(ngon(0, 0, .8, n=44), '#7a5a10', step=.02)
    fill(ngon(0, 0, .76, n=44), mix(base, '#1d1040', .5), step=.02)
    fill(ngon(0, 0, .66, n=44), mix(base, '#1d1040', .22), step=.02)
    sparkle(0, .84, .08, WHITE) if False else None


def plate_spec(role, divine=False):
    a, b = ROLE[role]
    fill(ngon(0, 0, .98, n=44), mix(b, '#1d1040', .45), step=.02)
    fill(ngon(0, 0, .92, n=44), b, step=.02)
    fill(ngon(0, 0, .8, n=44), PLATE_DK, step=.02)
    fill(ngon(0, 0, .68, n=44), mix(a, '#1d1040', .38), step=.02)


def plate_divine():
    pl = pal('#ffd75a')
    burst(0, 0, 16, 1.0, .82, (pl[1], pl[2], WHITE, WHITE), rot=90)
    fill(ngon(0, 0, .8, n=44), '#b88a20', step=.02)
    fill(ngon(0, 0, .75, n=44), '#ffd75a', step=.02)
    fill(ngon(0, 0, .66, n=44), '#3a2a6a', step=.02)
    fill(ngon(0, 0, .6, n=44), '#52408a', step=.02)
    for a in range(0, 360, 45):
        r = math.radians(a + 22.5)
        sparkle(.93 * math.cos(r), .93 * math.sin(r), .12, WHITE)


def inner(s=.74, dx=0, dz=0):
    return xf(0, s, dx, dz)


def sub(key, fam, draw):
    @E48(key)
    def _():
        plate_sub(fam)
        with inner():
            draw()


def spec(key, role, draw):
    @E48(key)
    def _():
        plate_spec(role)
        with inner():
            draw()


def div(key, draw):
    @E48(key)
    def _():
        plate_divine()
        with inner():
            draw()


GLD = '#ffd75a'


# ================================================================== SOUS-CLASSES
def d_etendard():
    shield(0, -.25, .8, '#4a6ab8', trim='#c9d2e0')
    fill(stroke([(-.8, -.9), (.7, .95)], .12), WOODC, step=.02)
    fill([(.7, .95), (.1, .85), (.25, .55), (-.1, .45), (.45, .1)], GOLD, step=.02) if False else None
    fill([(.2, .9), (.95, .75), (.8, .5), (.95, .25), (.3, .35)], GOLD, step=.02)
    fill(stroke([(.9, -.9), (-.7, .95)], .12), WOOD_D, step=.01)
    fill([(-.2, .9), (-.9, .75), (-.75, .5), (-.9, .25), (-.3, .35)], '#c0392b', step=.02)


sub('cl_etendard', 'soutien', d_etendard)


def d_medic():
    fill([(-.95, .25), (.95, .25), (.95, -.5), (-.95, -.5)], '#f2ead6', step=.03)
    fill(rect(-.9, -.12, .14, .75), '#c9b890', step=.01)
    fill(rect(.9, -.12, .14, .75), '#c9b890', step=.01)
    cross(0, -.12, .52, '#5fe07a', t=.34)
    fill(stroke([(-.95, .5), (.95, .5)], .1), '#f2ead6', step=.01) if False else None


sub('cl_medic', 'soin', d_medic)


def d_runiste():
    hammer(-.3, -.05, .95, rot=-30, col='#dfe6f2', haft='#c98f5a', head=(.95, .55))
    rune(.55, .05, .7, '#e6d8ff', kind=4, w=.26)
    sparks([(.78, .85), (.15, .9)], WHITE, .16)


sub('cl_runiste', 'controle', d_runiste)


def d_exorciste():
    for i in range(10):
        a = math.radians(90 + 36 * i + 18)
        fill(ngon(.72 * math.cos(a), .15 + .62 * math.sin(a), .12, n=8), '#8a5a30' if i % 2 else '#a9744a', step=.005)
    lay(.03)
    fill([(-.1, -.4), (.1, -.4), (.1, -.7), (-.1, -.7)], '#a9744a', step=.01)
    cross(0, -.4, .28, GOLD, t=.3)
    fill(ngon(0, .15, .38, n=16), '#bfe8ff', True, step=.01)
    fill(star(0, .15, 6, .32, .16), '#ffe27a', True, step=.01)


sub('cl_exorciste', 'protection', d_exorciste)


def d_saboteur():
    fill(ngon(0, -.2, .72, n=24), '#3a3a58', step=.03)
    fill(ngon(-.25, .0, .22, .18, 8, 40), '#6a6a8a', True, nolayer=True)
    fill(rect(.2, .5, .3, .22, -30), '#5a5f78', step=.02)
    fill(stroke([(.28, .62), (.5, .85), (.4, 1.0)], .07), '#c9a070', step=.01)
    burst(.4, 1.0, 5, .3, .1, pal('#ff9a3a'))


sub('cl_saboteur', 'controle', d_saboteur)


def d_contreb():
    pouch(0, -.45, .75, '#7a4a30')
    mask(0, .3, .62, '#2a2040', eye='#ffffff', grim=False)
    fill(ngon(.0, .0, .06), GOLD, step=.01) if False else None
    coin(.62, -.7, .22, GOLD, mark=None)


sub('cl_contreb', 'chance', d_contreb)


def d_alchi():
    fill([(-.6, -.2), (.6, -.2), (.4, -.65), (-.4, -.65)], '#8a93aa', step=.03)
    fill(ngon(0, .3, .55, n=18), '#c9d2e0', step=.03)
    fill(ngon(0, .3, .38, n=18), '#6fd3ff', True, step=.02)
    fill(stroke([(.3, .6), (.85, .75), (.9, .3)], .12), '#c9d2e0', step=.01)
    flask(-.78, -.55, .3, '#6fd3ff', e_liq=True)
    flask(.78, -.55, .3, '#ffcf4a', e_liq=True)


sub('cl_alchi', 'decouverte', d_alchi)


def d_pisteur():
    pts = [(-.55, -.7), (-.7, .05), (-.4, .65), (.1, .8), (.55, .5), (.85, .1), (.5, .15), (.45, -.05), (.7, -.3), (.25, -.25), (.15, -.7)]
    fill(pts, '#8a6a4a', step=.03)
    fill([(.45, .15), (.85, .1), (.55, .5)], '#ffcf4a', step=.01)
    fill(ngon(.18, .3, .12, n=8), '#ffe27a', True, step=.01)
    fill(ngon(.2, .3, .05, n=6), DARK, nolayer=True, bv=0, th=.01)
    fill([(-.4, .2), (-.05, .1), (-.2, -.2)], '#4a3a2a', step=.01)
    arrow(-.9, -.85, .7, .6, '#c9a070', .3, .07, hcol='#e0e6f2', fl='#6fdc6f') if False else None
    arrow(-.9, -.8, -.3, -.2, '#c9a070', .28, .07, hcol='#e0e6f2', fl='#6fdc6f')


sub('cl_pisteur', 'controle', d_pisteur)


def d_dompteur():
    ring(0, .1, .75, .38, '#7a4a30', rz=.62)
    for a in range(0, 360, 30):
        r = math.radians(a)
        fill(star(.75 * math.cos(r), .1 + .62 * math.sin(r), 4, .12, .05), '#e0e6f2', step=.003)
    lay(.03)
    paw(0, .0, .38, '#ff9a3a')


sub('cl_dompteur', 'celerite', d_dompteur)


def d_garde():
    shield(.0, .0, .85, '#bfe8ff', kind='pavise', trim='#7a9ac8')
    sword(.0, .05, .68, rot=0, col='#dfe6f2')


sub('cl_garde', 'protection', d_garde)


def d_conteur():
    scroll(-.1, -.2, .85, rot=0)
    fill(stroke([(.2, -.5), (.95, .85)], .12), '#fff0a0', step=.02)
    fill([(.95, .85), (.65, .75), (.8, .5)], '#ffe27a', step=.01) if False else None
    fill([(.55, .1), (1.05, .95), (.8, .5)], '#f2ead6', step=.02)
    sparks([(-.7, .75)], GOLD, .15)


sub('cl_conteur', 'soutien', d_conteur)


def d_tacticien():
    fill(rect(0, -.55, 1.9, .9), '#e8d9a8', step=.03)
    for x in (-.5, .1, .6):
        fill(stroke([(x, -.2), (x + .15, -.85)], .06), '#c9a06a', nolayer=True, bv=0, th=.01)
    fill([(-.28, -.4), (.28, -.4), (.2, -.2), (-.2, -.2)], GOLD, step=.02)
    fill(rect(0, .1, .22, .5), GOLD, step=.02)
    fill(ngon(0, .62, .3), GOLD, step=.02)
    fill(rect(0, .28, .5, .12), '#e0b040', step=.01)
    fill(ngon(-.1, .72, .09, n=6), WHITE, True, nolayer=True)


sub('cl_tacticien', 'soutien', d_tacticien)


# ================================================================== SPECIALISATIONS
def d_epeiste():
    slash(-.0, -.1, .95, 110, 250, .5, pal('#5a8aff'), taper=.5)
    with xf(0, 1, 0, 0, flip=True):
        slash(-.0, -.1, .95, 110, 250, .5, pal('#5a8aff'), taper=.5)
    sword(0, 0, .95, rot=0)


spec('cl_epeiste', 'guerrier', d_epeiste)


def d_berserker():
    axe(0, 0, .95, rot=0, double=True, col='#c0392b', haft='#4a2a20')
    for x in (-.35, .35):
        fill([(x - .1, -.2), (x, -.55), (x + .1, -.2)], WHITE, step=.01)
    drop(-.7, -.7, .2, '#e83a4a')
    drop(.72, -.6, .2, '#e83a4a')


spec('cl_berserker', 'guerrier', d_berserker)


def d_chevalier():
    head_helm(0, -.1, .95, '#c9d2e0', plume='#3558b8')
    sword(.0, -.0, .0001) if False else None


spec('cl_chevalier', 'guerrier', d_chevalier)


def d_paladin():
    burst(0, .05, 12, 1.0, .7, pal('#ffcf4a'))
    shield(0, .0, .72, '#e0e6f2', trim='#b88a20')
    fill(star(0, .15, 8, .26, .12, 90), GOLD, True, step=.01)
    hammer(.62, -.25, .62, rot=35, col='#e0b040', haft='#7a4a30', head=(.8, .55))


spec('cl_paladin', 'gardien', d_paladin)


def d_rempart():
    shield(0, -.3, .9, '#7a8aa8', trim='#4a5a78')
    tower(0, .22, .72, '#c9d2e0')


spec('cl_rempart', 'gardien', d_rempart)


def d_vengeur():
    spike_ring(0, 0, .65, 10, '#e0e6f2', L=.28, w=.13)
    shield(0, 0, .72, '#7a8aa8', kind='round', trim='#4a5a78')
    bolt(0, 0, .55, pal('#ffe27a'))


spec('cl_vengeur', 'gardien', d_vengeur)


def d_lameombre():
    fill(ngon(0, 0, .8, n=28), '#c0b0f0', True, step=.01)
    fill(ngon(.32, .16, .7, n=28), PLATE_DK, step=.01)
    dagger(-.1, -.15, .85, rot=0, col='#d0b8f8', guard='#8a5ac8', hilt='#4a3a6a')
    sparks([(.6, .6)], WHITE, .12)


spec('cl_lameombre', 'assassin', d_lameombre)


def d_eclaireur():
    fill(ngon(0, 0, .8, n=28), '#e8d8b0', step=.02)
    fill(ngon(0, 0, .68, n=28), '#3a4a5a', step=.02)
    for a in (0, 90, 180, 270):
        with xf(a, 1, 0, 0):
            fill([(-.08, .5), (.08, .5), (0, .75)], '#ffe27a', step=.002, nolayer=True)
    dagger(0, 0, .8, rot=40, col='#e0e6f2', guard='#ff9a3a', hilt='#8a4a2a')
    wings(.35, -.35, .3, '#ffd0a0', e=False, mirror=False, rot=-20)


spec('cl_eclaireur', 'assassin', d_eclaireur)


def d_duelliste():
    for r_ in (42, -42):
        with xf(r_, 1, 0, 0):
            fill([(-.05, -.8), (.05, -.8), (.03, .85), (0, .95), (-.03, .85)], '#dfe6f2', step=.02)
            fill(ngon(0, -.5, .26, .14, 10), '#e0b040', step=.02)
    hand(0, -.2, .5, '#f2ead6', fist=False, rot=-15, cuff='#c0392b')


spec('cl_duelliste', 'assassin', d_duelliste)


def d_empoisonneur():
    dagger(.2, .2, .8, rot=20, col='#cfe8c8', guard='#4aa856')
    drop(.25, -.52, .2, '#5ad03a')
    flask(-.5, -.35, .5, '#5ad03a', e_liq=True)
    sparks([(.8, .8)], '#8af070', .12)


spec('cl_empoisonneur', 'assassin', d_empoisonneur)


def d_tireur():
    bow(-.15, 0, .95, rot=0, col='#c98f5a')
    ring(.5, 0, .35, .08, '#ff5a5a', True)
    for a in (0, 90, 180, 270):
        with xf(a, 1, .5, 0):
            fill(stroke([(0, .2), (0, .5)], .07), '#ff5a5a', True, step=.003)
    arrow(-.55, 0, .6, 0, '#e0c090', .26, .07, hcol='#e0e6f2', fl='#6fdc6f')


spec('cl_tireur', 'archer', d_tireur)


def d_rodeur():
    bow(-.3, 0, .95, rot=0, col='#8a5a30')
    leaf(.5, .2, .6, -30, '#6fdc6f', vein='#2f7a3a', w=.5)
    leaf(.35, -.45, .45, 40, '#4aa856', vein='#2f7a3a')
    fill(stroke([(-.35, -.5), (.3, -.1)], .06), '#c9a070', step=.01)


spec('cl_rodeur', 'archer', d_rodeur)


def d_tempete():
    bow(-.2, 0, .95, rot=0, col='#8a5a30')
    bolt(.4, .0, .62, pal('#ffe27a'))
    zig([(-.25, .1), (.0, .25), (.1, .0), (.3, .12)], .12, pal('#ffe27a'))


spec('cl_tempete', 'archer', d_tempete)


def d_elementaliste():
    staff(0, -.05, 1.0, rot=0, col='#a9744a')
    for (x, z, c) in ((0, .9, '#ffffff'), (-.55, .55, '#ff6b3d'), (.55, .55, '#6fd3ff'), (0, .38, '#6fdc6f')):
        orb(x, z, .24 if c != '#ffffff' else .2, c, e=True)
    orb(0, .9, .2, '#c58bff', e=True)
    fill(stroke([(-.45, .55), (0, .5), (.45, .55)], .06), '#a9744a', step=.002, nolayer=True)


spec('cl_elementaliste', 'sorcier', d_elementaliste)


def d_arcaniste():
    book(0, -.3, 1.0, '#6a48b8', CREAM)
    fill([(0, .95), (.3, .5), (0, .05), (-.3, .5)], pal('#ff7ad9')[0], True, step=.01)
    fill([(0, .85), (.2, .5), (0, .15), (-.2, .5)], '#ff7ad9', True, step=.01)
    fill([(0, .75), (.08, .5), (0, .3)], WHITE, True, step=.01)


spec('cl_arcaniste', 'sorcier', d_arcaniste)


def d_chrono():
    hourglass(0, 0, .8, '#8a5ac8', '#ff7ad9')
    wings(0, .05, .8, '#d8c8f8', e=False, mirror=True, rot=0) if False else None
    for sx in (-1, 1):
        with xf(0, 1, 0, 0, flip=(sx < 0)):
            for i, (a, L) in enumerate(((10, .8), (35, .72), (60, .58))):
                ar = math.radians(a)
                fill(stroke([(.65 + L * math.cos(ar) * .5 * k / 6, .1 + L * math.sin(ar) * .9 * k / 6) for k in range(7)], 0, 0, lambda t: .26 * sm(t, .5) + .02), '#e8d8ff', step=.003)
    lay(.02)


spec('cl_chrono', 'sorcier', d_chrono)


def d_occultiste():
    book(0, -.45, .95, '#4a2a7a', '#d8c8f8')
    skull(0, .4, .62, '#c58bff', eye='#2a1050')
    sparks([(-.8, .8), (.8, .8)], '#c58bff', .12)


spec('cl_occultiste', 'sorcier', d_occultiste)


def d_pretre():
    ring(0, .85, .4, .1, '#ffe27a', True, rz=.15)
    fill(stroke([(0, .4), (0, -.95)], .14, .2), '#e0b040', step=.02)
    cross(0, .0, .48, '#ffe27a', t=.28)
    fill(ngon(0, -.9, .14), '#ffcf4a', step=.01)


spec('cl_pretre', 'soigneur', d_pretre)


def d_druide():
    fill(stroke([(-.15, -.95), (-.05, -.4), (.15, .1), (.0, .55)], .22, .12), '#8a5a30', step=.02)
    fill(stroke([(.05, -.1), (.55, .0)], .1), '#8a5a30', step=.01)
    for x, z, s_ in ((0, .75, .3), (.5, .15, .22), (-.35, .3, .24), (.35, .5, .2)):
        fill(star(x, z, 5, s_, s_ * .45, 90), '#ff9ad0', step=.005)
        fill(ngon(x, z, s_ * .22, n=6), '#ffe27a', True, nolayer=True)
    leaf(.5, -.35, .3, 60, '#5fe07a', vein='#c8ffd8')
    leaf(-.5, -.1, .3, -60, '#5fe07a', vein='#c8ffd8')


spec('cl_druide', 'soigneur', d_druide)


def d_hemo():
    fill([(-.55, .8), (.55, .8), (.5, .3), (.2, -.2), (.12, -.55), (.35, -.75), (.5, -.9), (-.5, -.9), (-.35, -.75), (-.12, -.55), (-.2, -.2), (-.5, .3)], '#d0a040', step=.03)
    fill([(-.5, .75), (.5, .75), (.46, .35), (-.46, .35)], '#c0252a', True, step=.01)
    fill([(-.5, .75), (.5, .75), (.5, .66), (-.5, .66)], '#ff7a8a', True, nolayer=True)
    drop(0, -.4, .2, '#e83a4a') if False else None
    drop(.0, 1.0, .0001, '#e83a4a') if False else None
    drop(.62, .0, .22, '#e83a4a')


spec('cl_hemo', 'soigneur', d_hemo)


def d_troubadour():
    lute(-.2, -.1, .95, '#e0b040')
    fill(stroke([(.45, .85), (.75, .7), (.95, .2)], .12, .05), '#ff5a5a', step=.01)
    fill([(.35, .9), (.8, 1.0), (.7, .65)], '#f2ead6', step=.01)
    note(.7, -.5, .25, '#4de0c0', True)


spec('cl_troubadour', 'soutien', d_troubadour)


def d_chantre():
    bannerpole(-.35, .0, .85, '#c0392b', tip=GOLD)
    fill(stroke([(.0, -.7), (.4, -.5), (.75, -.15), (.95, .15)], .16, .7), '#e0b040', step=.02)
    shock(.9, .3, .45, .08, pal('#ffcf4a'), a0=-40, a1=40)


spec('cl_chantre', 'soutien', d_chantre)


def d_enchanteur():
    ring(0, .1, .6, .1, '#ff7ad9', True)
    fill(star(0, .1, 5, .52, .22, 90), '#ff7ad9', True, step=.01)
    fill(star(0, .1, 5, .3, .13, 90), '#ffc4f0', True, step=.01)
    staff(.5, -.55, .8, rot=40, col='#a9744a', top='#ffc4f0')


spec('cl_enchanteur', 'soutien', d_enchanteur)


# ================================================================== DIVINS (or #ffd75a, aura blanche, etoiles)
G1, G2, G3 = '#ffd75a', '#e0b040', '#fff0a0'


def dd_epeiste():
    for a in (-60, -30, 0, 30, 60):
        with xf(a, 1, 0, -.9):
            fill([(-.14, .1), (.14, .1), (.1, 1.5), (0, 1.8), (-.1, 1.5)], '#f2f6ff' if a % 60 == 0 else G3, step=.01)
            fill(rect(0, .15, .6, .1), G2, step=.004)
    crown(0, -.55, .5, G1)


div('cl_epeiste_divin', dd_epeiste)


def dd_berserker():
    flame(0, .0, 1.1, pal('#ff4a3a'), hw=.8)
    fill([(-.55, .55), (-.6, -.1), (-.3, -.7), (.3, -.7), (.6, -.1), (.55, .55), (.25, .35), (-.25, .35)], G1, step=.02)
    fill([(-.4, .15), (-.1, .08), (-.1, .0), (-.4, .0)], '#2a0a18', nolayer=True, bv=0, th=.01)
    fill([(.4, .15), (.1, .08), (.1, .0), (.4, .0)], '#2a0a18', nolayer=True, bv=0, th=.01)
    fill([(-.28, -.4), (.28, -.4), (.18, -.58), (-.18, -.58)], '#2a0a18', nolayer=True, bv=0, th=.01)
    for x in (-.15, .0, .15):
        fill([(x - .05, -.4), (x, -.5), (x + .05, -.4)], WHITE, nolayer=True, bv=0, th=.01)


div('cl_berserker_divin', dd_berserker)


def dd_chevalier():
    burst(0, 0, 14, 1.15, .75, pal('#ffd75a'))
    head_helm(0, -.1, .85, '#f2f6ff', plume=G1)
    fill(star(0, .78, 4, .2, .08), WHITE, True, step=.01)


div('cl_chevalier_divin', dd_chevalier)


def dd_paladin():
    wings(0, .0, 1.0, G1, e=False, mirror=True)
    shield(0, -.05, .65, '#ffffff', trim=G2, emblem=None)
    fill(star(0, .0, 8, .3, .13, 90), G1, True, step=.01)


div('cl_paladin_divin', dd_paladin)


def dd_rempart():
    mountain(0, -.1, 1.15, '#a9a6b8')
    shield(0, .55, .38, G1, trim=G2)


div('cl_rempart_divin', dd_rempart)


def dd_vengeur():
    spike_ring(0, 0, .6, 12, G1, L=.3, w=.12)
    shield(0, 0, .66, '#e0e6f2', kind='round', trim=G2)
    fill(rect(0, .0, .12, .9), G2, step=.01)
    fill(rect(0, .35, .85, .08), G2, step=.01)
    fill(ngon(-.4, .0, .22, .1, 10), G1, step=.01)
    fill(ngon(.4, .0, .22, .1, 10), G1, step=.01)
    bolt(0, -.1, .0001, pal('#ffe27a')) if False else None


div('cl_vengeur_divin', dd_vengeur)


def dd_lameombre():
    fill(ngon(0, 0, .72, n=28), '#1a1030', step=.01)
    fill(ngon(.28, .1, .62, n=28), '#52408a', step=.01)
    for a in (30, 90, 150, 210, 270, 330):
        with xf(a - 90, 1, 0, 0):
            dagger(0, .6, .3, rot=0, col='#e8d8ff', guard=G1, hilt=G2)
    lay(.02)
    sparks([(-.3, .0), (0, -.3)], WHITE, .1)


div('cl_lameombre_divin', dd_lameombre)


def dd_eclaireur():
    fill(stroke([(.9, .9), (-.2, -.2)], .9, .1, lambda t: .1 + .5 * (1 - t)), pal('#ffd75a')[0], True, step=.01)
    fill(stroke([(.85, .85), (-.2, -.2)], .5, .1, lambda t: .05 + .3 * (1 - t)), G3, True, step=.01)
    orb(-.35, -.35, .22, '#ffffff', e=True)
    with xf(25, 1, -.1, .0):
        wings(0, .0, .6, '#ffffff', e=False, mirror=False, rot=-30)
    boot(-.3, -.1, .5, G1, sole=G2, rot=20)
    wings(.1, .15, .45, WHITE, e=False, mirror=False, rot=60)


div('cl_eclaireur_divin', dd_eclaireur)


def dd_duelliste():
    for sx in (-1, 1):
        with xf(0, 1, 0, 0, flip=(sx < 0)):
            fill(stroke(arcpath(0, 0, .85, 200, 330, 10), .15), '#5fe07a', step=.01)
            for a, r in ((215, 1), (240, 1), (265, 1), (290, 1), (315, 1)):
                x, z = .85 * math.cos(math.radians(a)), .85 * math.sin(math.radians(a))
                with xf(a + 90 - 20, 1, x, z):
                    leaf(0, .2, .26, 0, G1, w=.5)
    for r_ in (40, -40):
        with xf(r_, 1, 0, .1):
            fill([(-.05, -.8), (.05, -.8), (.03, .75), (0, .85), (-.03, .75)], '#ffffff', step=.02)
            fill(ngon(0, -.5, .24, .13, 10), G1, step=.02)


div('cl_duelliste_divin', dd_duelliste)


def dd_empoisonneur():
    gstroke(arcpath(0, 0, .72, 20, 350, 30), .34, pal('#5ad03a'), prof=lambda t: .12 + .28 * sm(t, .3) * 1.2, fr=(1, .62, .3, 0))
    fill([(.75, .1), (1.0, .25), (.95, -.1), (.78, -.18)], '#3a8a2a', step=.01)
    fill(ngon(.88, .08, .06, n=6), G1, True, step=.01)
    fill(ngon(0, 0, .3, n=14), G1, True, step=.01) if False else None
    sparks([(0, 0)], G3, .2)


div('cl_empoisonneur_divin', dd_empoisonneur)


def dd_tireur():
    fill(stroke([(.95, .95), (-.55, -.55)], .9, .06, lambda t: .06 + .55 * (1 - t)), pal('#ffd75a')[1], True, step=.01)
    fill(stroke([(.9, .9), (-.55, -.55)], .4, .06, lambda t: .04 + .25 * (1 - t)), WHITE, True, step=.01)
    arrow(.0, .0, -.75, -.75, '#e0c090', .38, .12, hcol=G1, fl=G3) if False else None
    fill([(-.85, -.85), (-.3, -.6), (-.6, -.3)], G1, True, step=.01)
    burst(.15, .15, 5, .35, .1, pal('#ffffff'))


div('cl_tireur_divin', dd_tireur)


def dd_rodeur():
    ring(0, 0, .95, .1, G1, True)
    tree(0, -.05, 1.0, '#5fe07a')
    for x, z in ((-.5, .55), (.5, .6), (0, .85)):
        sparkle(x, z, .1, WHITE)


div('cl_rodeur_divin', dd_rodeur)


def dd_tempete():
    ring(0, 0, .85, .2, '#bfe8ff', True)
    ring(0, 0, .55, .14, '#6fd3ff', True)
    fill(ngon(0, 0, .3, n=18), '#ffffff', True, step=.01)
    for a in (45, 165, 285):
        with xf(a - 90, 1, 0, 0):
            bolt(0, .85, .22, pal('#ffe27a'))


div('cl_tempete_divin', dd_tempete)


def dd_elementaliste():
    for i, c in enumerate(('#ff6b3d', '#6fd3ff', '#6fdc6f', '#c58bff')):
        a = math.radians(45 + 90 * i)
        fill(stroke([(.0, 0), (.58 * math.cos(a), .58 * math.sin(a))], .22), pal(c)[1], True, step=.01)
        orb(.6 * math.cos(a), .6 * math.sin(a), .3, c, e=True)
    ring(0, 0, .6, .07, G1, True)
    orb(0, 0, .22, '#ffffff', e=True)


div('cl_elementaliste_divin', dd_elementaliste)


def dd_arcaniste():
    path = [(.85 * math.cos(t) / (1 + math.sin(t) ** 2), .85 * math.sin(t) * math.cos(t) / (1 + math.sin(t) ** 2) * 1.6) for t in [2 * math.pi * i / 48 for i in range(49)]]
    gstroke(path, .32, pal('#ff7ad9'), fr=(1, .62, .3, .1))
    sparks([(0, 0)], WHITE, .17)


div('cl_arcaniste_divin', dd_arcaniste)


def dd_chrono():
    for a in range(0, 360, 30):
        r = math.radians(a)
        fill(star(.88 * math.cos(r), .88 * math.sin(r), 4, .12, .045), WHITE if a % 90 == 0 else G1, True, step=.002, nolayer=True)
    lay(.03)
    hourglass(0, 0, .75, G2, '#ff7ad9', glass='#e8d8ff')


div('cl_chrono_divin', dd_chrono)


def dd_occultiste():
    ring(0, 0, .88, .16, '#8a5ac8', True)
    fill(ngon(0, 0, .72, n=30), '#0a0418', step=.01)
    ring(0, 0, .73, .06, '#c58bff', True)
    sparks([(-.25, .2), (.3, -.25)], '#c58bff', .1)


div('cl_occultiste_divin', dd_occultiste)


def dd_pretre():
    wings(0, -.2, .9, '#ffffff', e=False, mirror=True)
    burst(0, -.05, 14, .98, .55, pal('#ffd75a')) if False else None
    fill(ngon(0, .0, .5, .5, 22), G1, True, step=.01)
    fill(ngon(0, .0, .34, .34, 22), WHITE, True, step=.01)
    for a in range(0, 360, 45):
        r = math.radians(a)
        fill(star(.62 * math.cos(r), .62 * math.sin(r), 3, .14, .06, a), G1, True, step=.002, nolayer=True)


div('cl_pretre_divin', dd_pretre)


def dd_druide():
    fill(ngon(0, .15, .78, .85, 20), '#2f9a5a', step=.02)
    fill(ngon(-.2, .1, .5, .6, 16), '#5fe07a', step=.01)
    fill(ngon(0, -.1, .35, .55, 16), '#f2c9a0', step=.01)
    fill([(-.22, .0), (-.05, .02), (-.08, -.08), (-.22, -.06)], '#2f5a30', nolayer=True, bv=0, th=.01)
    fill([(.22, .0), (.05, .02), (.08, -.08), (.22, -.06)], '#2f5a30', nolayer=True, bv=0, th=.01)
    fill(stroke(arcpath(0, -.28, .1, 200, 340, 6), .05), '#c0453a', nolayer=True, bv=0, th=.01)
    for x, z in ((-.45, .6), (.45, .55), (0, .75), (-.6, 0), (.6, 0)):
        fill(star(x, z, 5, .13, .06), '#ff9ad0', True, step=.003)


div('cl_druide_divin', dd_druide)


def dd_hemo():
    heart(0, -.1, .85, '#c0252a')
    heart(-.1, .0, .55, '#e83a4a', e=False)
    crown(0, .62, .38, G1, gem='#ff5a6a')
    drop(.65, -.55, .17, '#e83a4a')


div('cl_hemo_divin', dd_hemo)


def dd_troubadour():
    path = [(-.75, -.8), (-.7, .1), (-.45, .8)]
    fill(stroke(arcpath(.0, -.25, .75, 25, 155, 12), .14), G2, step=.01) if False else None
    for sx in (-1, 1):
        fill(stroke([(sx * .5, -.9), (sx * .8, -.1), (sx * .6, .65), (sx * .22, .95)], .26, .2), G1, step=.01)
    fill(rect(0, -.88, 1.2, .2), G2, step=.01)
    fill(stroke([(-.5, .95), (.5, .95)], .1), G1, step=.01) if False else None
    for x in (-.3, -.1, .1, .3):
        fill(stroke([(x, -.75), (x, .7)], .035), WHITE, True, step=.002, nolayer=True)
    lay(.03)
    for x, z in ((-.9, .8), (.9, .8), (-.85, -.6), (.85, -.6), (0, 1.0)):
        fill(star(x, z, 5, .13, .06), WHITE, True, step=.003)


div('cl_troubadour_divin', dd_troubadour)


def dd_chantre():
    flame(0, -.1, 1.1, pal('#ff8a3a'), hw=.65)
    fill(ngon(0, -.1, .3, .42, 14), '#2a0a18', step=.01)
    fill(ngon(0, -.3, .12, .1, 10), '#ff5a5a', True, nolayer=True)
    for r_ in (.55, .8):
        shock(0, -.1, r_, .08, pal('#ffd75a'), a0=-50, a1=50) if False else None
    shock(0, -.1, .7, .09, pal('#ffd75a'), a0=-35, a1=35)
    shock(0, -.1, .7, .09, pal('#ffd75a'), a0=145, a1=215)


div('cl_chantre_divin', dd_chantre)


def dd_enchanteur():
    p = pal('#ffd75a')
    for i in range(8):
        a = 45 * i
        with xf(a, 1, 0, 0):
            fill(stroke([(0, .15), (.0, .5), (0, .8)], .0, .0, lambda t: .34 * sm(t, .6) + .02), pal('#ff7ad9')[1] if i % 2 else '#ffc4f0', True, step=.003)
    lay(.02)
    ring(0, 0, .9, .07, G1, True)
    orb(0, 0, .16, '#ffffff', e=True)


div('cl_enchanteur_divin', dd_enchanteur)


# ================================================================== CADRES DE FORME (centre transparent)
def band(r, w, col, e=False, n=44):
    ring(0, 0, r, w, col, e, n=n)


def gem(x, z, r, col):
    fill(star(x, z, 4, r, r * .55, 90), col, True, step=.01)
    fill(ngon(x, z, r * .5, n=6), WHITE, True, nolayer=True)


@E48('fr_eveil')
def _():
    band(.9, .22, '#8a93aa')
    band(.9, .13, '#dfe6f2')
    for a in (90, 0, 270, 180):
        r = math.radians(a)
        fill(ngon(.9 * math.cos(r), .9 * math.sin(r), .17, n=4, rot=45), '#6fd3ff', True, step=.01)
        fill(ngon(.9 * math.cos(r) - .02, .9 * math.sin(r) + .03, .07, n=4, rot=45), WHITE, True, nolayer=True)


@E48('fr_apogee')
def _():
    for sx in (-1, 1):
        with xf(0, 1, 0, 0, flip=(sx < 0)):
            for i, (a, L, col) in enumerate(((8, .5, '#e0b040'), (30, .5, '#ffd75a'), (52, .46, '#ffe27a'))):
                ar = math.radians(a)
                fill(stroke([(.56 + L * math.cos(ar) * k / 8, .12 + L * math.sin(ar) * k / 8 * 1.5 - .0) for k in range(9)], 0, 0, lambda t: .26 * sm(t, .45) + .03), col, step=.004)
    lay(.03)
    band(.62, .22, '#b88a20')
    band(.62, .13, '#ffd75a')
    fill(star(0, .66, 4, .2, .08, 90), WHITE, True, step=.01)


@E48('fr_divin')
def _():
    pl = pal('#ffd75a')
    spike_ring(0, 0, .9, 24, pl[2], L=.14, w=.07, e=True)
    band(.84, .2, '#b88a20')
    band(.84, .12, '#ffd75a')
    for a in range(0, 360, 30):
        r = math.radians(a + 15)
        sparkle(.96 * math.cos(r), .96 * math.sin(r), .08, WHITE) if False else None
    for a in range(0, 360, 45):
        r = math.radians(a + 90)
        fill(star(.84 * math.cos(r), .84 * math.sin(r), 4, .14, .06, 90), WHITE, True, step=.005)
