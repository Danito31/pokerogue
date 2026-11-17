"""icons_misc.py - metiers (job_*, job_*_evo : 32x32) et badges de palier (ms_* : 48x48)."""
from icon_parts import *

BLDC = {'auberge': '#c0453a', 'ferme': '#5a9a3a', 'camp': '#d08a2a', 'inf': '#3fb0a0', 'forge': '#5a5f78', 'hdv': '#4a6ab8',
        'chasse': '#6a7a3a', 'biblio': '#8a5ac8', 'labo': '#d0508a', 'entrepot': '#8a7050', 'marche': '#d8b838'}
JOBS = {'cuisinier': 'auberge', 'architecte': 'hdv', 'chasseur': 'chasse', 'cueilleur': 'ferme', 'entraineur': 'camp',
        'fermier': 'ferme', 'forgeron': 'forge', 'eleveur': 'ferme', 'mineur': 'entrepot', 'alchimiste': 'labo',
        'marchand': 'marche', 'apothicaire': 'inf', 'cartographe': 'hdv', 'bibliothecaire': 'biblio'}


def jplate(bld, evo):
    c = BLDC[bld]
    if evo:
        fill(ngon(0, 0, .99, n=36), '#8a5a10', step=.02)
        fill(ngon(0, 0, .93, n=36), GOLD, step=.02)
        fill(ngon(0, 0, .84, n=36), shade(c, -.2), step=.02)
    else:
        fill(ngon(0, 0, .97, n=36), shade(c, -.35), step=.02)
        fill(ngon(0, 0, .88, n=36), c, step=.02)
    fill(ngon(0, 0, .72, n=36), '#2a1c18', step=.02)
    fill(ngon(0, 0, .66, n=36), '#5c4232', step=.02)


# ------------------------------------------------------------------ motifs
def toque(cx, cz, s, star_=False):
    with xf(0, s, cx, cz):
        for x, z, r in ((-.45, .35, .42), (0, .55, .5), (.45, .35, .42)):
            fill(ngon(x, z, r, n=14), '#f8f4ea', step=.004)
        fill(rect(0, -.25, 1.2, .8), '#f8f4ea', step=.02)
        fill(rect(0, -.62, 1.25, .2), '#c9c6d8', step=.02)
        if star_:
            fill(star(0, .42, 5, .3, .13), GOLD, True, step=.02)
    lay(.04)


def ladle(cx, cz, s, rot=0):
    with xf(rot, s, cx, cz):
        fill(stroke([(0, -1), (0, .5)], .14), '#c9d2e0', step=.02)
        fill(ngon(0, .65, .36, .3, 12), '#c9d2e0', step=.02)
        fill(ngon(0, .65, .24, .2, 10), '#6a7090', nolayer=True, bv=0, th=.01)


def square_tool(cx, cz, s, col, rot=0):
    with xf(rot, s, cx, cz):
        fill([(-.9, .9), (-.5, .9), (-.5, -.5), (.9, -.5), (.9, -.9), (-.9, -.9)], col, step=.02)
        for t in (-.2, .1, .4, .7):
            fill(rect(-.9 + .15, t, .22, .06), shade(col, -.4), nolayer=True, bv=0, th=.01)


def compass_tool(cx, cz, s, col, rot=0):
    with xf(rot, s, cx, cz):
        fill(stroke([(0, .7), (-.6, -.95)], .16, .06), col, step=.02)
        fill(stroke([(0, .7), (.6, -.95)], .16, .06), shade(col, -.2), step=.02)
        fill(ngon(0, .72, .2, n=10), '#e0b040', step=.02)
        fill(stroke([(0, .9), (0, 1.0)], .1), '#e0b040', step=.01)


def antlers(cx, cz, s, col):
    with xf(0, s, cx, cz):
        for sx in (-1, 1):
            with xf(0, 1, 0, 0, flip=(sx < 0)):
                fill(stroke([(.15, -.5), (.4, .1), (.6, .55), (.5, .95)], .16, .08), col, step=.005)
                fill(stroke([(.4, .1), (.85, .3)], .12, .06), col, step=.005)
                fill(stroke([(.55, .5), (.95, .75)], .1, .05), col, step=.005)
        fill([(-.3, -.5), (.3, -.5), (.4, -.9), (-.4, -.9)], '#8a6a4a', step=.01)
    lay(.04)


def basket(cx, cz, s, col='#c98f5a', flowers=False):
    with xf(0, s, cx, cz):
        for x, z, a, c in ((-.3, .45, 30, '#5fe07a'), (.0, .6, 0, '#3fae5a'), (.3, .45, -30, '#5fe07a')):
            leaf(x, z, .5, a, c, vein='#c8ffd8')
        if flowers:
            for x, z, c in ((-.3, .85, '#ff9ad0'), (.2, .95, '#ffe27a'), (.45, .6, '#ff9ad0')):
                fill(star(x, z, 5, .2, .09), c, True, step=.003)
                fill(ngon(x, z, .06, n=6), WHITE, True, nolayer=True)
        fill(stroke(arcpath(0, .0, .55, 10, 170, 10), .12), '#7a4a30', step=.01)
        fill([(-.8, .0), (.8, .0), (.6, -.8), (-.6, -.8)], col, step=.03)
        for t in (-.55, -.2, .15):
            fill(stroke([(-.75, t), (.75, t)], .05), shade(col, -.35), nolayer=True, bv=0, th=.01)
        for x in (-.45, -.15, .15, .45):
            fill(stroke([(x, -.05), (x * .85, -.75)], .05), shade(col, -.35), nolayer=True, bv=0, th=.01)
    lay(.04)


def dummy(cx, cz, s, col='#c98f5a'):
    with xf(0, s, cx, cz):
        fill(stroke([(0, -1), (0, .4)], .2), WOOD_D, step=.02)
        fill(stroke([(-.8, .05), (.8, .05)], .2), WOOD_D, step=.02)
        fill(ngon(0, .75, .32, n=12), '#e8d8a0', step=.02)
        fill(rect(0, -.2, .7, .75), '#d8c080', step=.02)
        fill(ngon(0, -.2, .25, n=12), '#c0453a', step=.01)
        fill(ngon(0, -.2, .12, n=10), '#f2ead6', step=.01)
        fill(rect(0, -.98, .8, .14), WOOD_D, step=.01)
    lay(.04)


def pitchfork(cx, cz, s, rot=0, col='#c9d2e0'):
    with xf(rot, s, cx, cz):
        fill(stroke([(0, -1), (0, .25)], .14), WOOD_D, step=.02)
        fill(stroke(arcpath(0, .35, .45, 180, 360, 8)[::-1] if False else [(-.45, .95), (-.45, .4), (0, .15), (.45, .4), (.45, .95)], .1), col, step=.02)
        fill(stroke([(0, .15), (0, 1.0)], .1), col, step=.01)


def wheat(cx, cz, s, rot=0, col='#e0b040', crown_=False):
    with xf(rot, s, cx, cz):
        for a in (-24, 0, 24):
            with xf(a, 1, 0, -.9):
                fill(stroke([(0, 0), (0, 1.5)], .06), '#8a7040', step=.003)
                for k in range(5):
                    z = .6 + k * .2
                    for sx in (-1, 1):
                        fill([(sx * .02, z), (sx * .22, z + .16), (sx * .05, z + .2)], col, step=.001)
                fill(ngon(0, 1.72, .08, .15, 8), col, step=.003)
        fill(stroke([(-.45, -.35), (.45, -.35)], .16), '#c0453a', step=.02)
        if crown_:
            crown(0, .85, .3, GOLD)
    lay(.04)


def hammer_anvil(cx, cz, s, spark=False):
    with xf(0, s, cx, cz):
        anvil(.0, -.45, .85, '#8a93aa')
        hammer(.2, .35, .62, rot=-35, col='#c9d2e0')
        if spark:
            burst(-.5, .1, 4, .3, .08, pal('#6fd3ff'))
            fill(star(0, .6, 5, .22, .1), GOLD, True, step=.01)
    lay(.04)


def cow(cx, cz, s, bell=True):
    with xf(0, s, cx, cz):
        for sx in (-1, 1):
            fill(stroke([(sx * .35, .5), (sx * .75, .75), (sx * .7, 1.0)], .14, .06), '#f2ead6', step=.004)
            fill(ngon(sx * .72, .35, .28, .16, 10, -sx * 30), '#d8b090', step=.004)
        fill([(-.5, .6), (.5, .6), (.55, -.1), (.35, -.6), (-.35, -.6), (-.55, -.1)], '#f8f4ea', step=.02)
        fill(ngon(-.3, .35, .22, .2, 8), '#5a4a40', step=.005)
        fill(ngon(0, -.4, .38, .26, 12), '#e8a0a0', step=.01)
        for sx in (-1, 1):
            fill(ngon(sx * .17, -.4, .05, n=6), '#6a3a3a', nolayer=True, bv=0, th=.01)
            fill(ngon(sx * .27, .15, .08, n=6), DARK, nolayer=True, bv=0, th=.01)
        if bell:
            fill(stroke([(-.4, -.7), (.4, -.7)], .1), '#c0453a', step=.005)
            fill([(-.16, -.7), (.16, -.7), (.22, -1.0), (-.22, -1.0)], GOLD, step=.005)
    lay(.04)


def pick(cx, cz, s, rot=0):
    with xf(rot, s, cx, cz):
        fill(stroke([(0, -1), (0, .7)], .15), WOOD_D, step=.02)
        fill(stroke([(-.9, .45), (-.45, .8), (0, .8), (.45, .8), (.9, .45)], .22, .22), '#c9d2e0', step=.02) if False else None
        fill([(-.95, .05), (-.5, .45), (0, .55), (.5, .45), (.95, .05), (.55, .3), (0, .35), (-.55, .3)], '#c9d2e0', step=.02)


def nugget(cx, cz, s, col=GOLD):
    with xf(0, s, cx, cz):
        fill([(-.7, -.5), (-.5, .2), (0, .5), (.55, .25), (.75, -.4), (.1, -.7)], col, step=.02)
        fill([(-.4, .05), (-.05, .3), (.2, .1)], shade(col, .5), True, nolayer=True)
    lay(.04)


def crucible(cx, cz, s, liquid='#ff7ad9'):
    with xf(0, s, cx, cz):
        fill([(-.7, .1), (.7, .1), (.5, -.7), (-.5, -.7)], '#5a5f78', step=.02)
        fill(rect(0, .1, 1.5, .15), '#8a93aa', step=.01)
        fill(ngon(0, .12, .6, .12, 12), liquid, True, step=.01)
        for x, z in ((-.2, .4), (.2, .6), (.05, .85)):
            fill(ngon(x, z, .1, n=6), liquid, True, step=.003)
    lay(.04)


def scales(cx, cz, s):
    with xf(0, s, cx, cz):
        fill(stroke([(0, -.9), (0, .8)], .12), '#e0b040', step=.02)
        fill(rect(0, -.9, .8, .16), '#e0b040', step=.01)
        fill(stroke([(-.8, .55), (.8, .55)], .1), '#e0b040', step=.01)
        for sx in (-1, 1):
            fill(stroke([(sx * .8, .55), (sx * .55, -.1)], .04), '#c9d2e0', step=.004)
            fill(stroke([(sx * .8, .55), (sx * 1.05, -.1)], .04), '#c9d2e0', step=.004)
            fill([(sx * .5, -.1), (sx * 1.1, -.1), (sx * .8, -.4)], '#e0b040', step=.01)
        fill(ngon(0, .85, .13), '#e0b040', step=.01)
    lay(.04)


def mortar(cx, cz, s, col='#c9d2e0'):
    with xf(0, s, cx, cz):
        fill(stroke([(.1, -.1), (.8, .8)], .24, .16), '#8a6a4a', step=.01)
        fill(ngon(.85, .85, .16, n=8), '#8a6a4a', step=.01)
        fill([(-.85, .0), (.85, .0), (.6, -.5), (.2, -.8), (-.2, -.8), (-.6, -.5)], col, step=.03)
        fill(rect(0, -.88, .6, .14), shade(col, -.3), step=.01)
        fill(rect(0, .02, 1.8, .14), shade(col, -.15), step=.01)
        fill(ngon(-.3, -.3, .08, n=6), WHITE, True, nolayer=True)
        fill(ngon(0, .0, .4, .1, 10), '#5fe07a', step=.005)
    lay(.04)


def rolled_map(cx, cz, s, rot=0):
    with xf(rot, s, cx, cz):
        fill([(-.5, .7), (.7, .7), (.7, -.5), (-.5, -.5)], '#efe0b0', step=.02)
        fill(rect(-.55, .1, .35, 1.25), '#d8c080', step=.01)
        fill(ngon(-.55, .72, .17, n=10), '#efe0b0', step=.005)
        fill(stroke([(-.2, -.2), (.1, .2), (.4, -.1)], .06), '#c9a06a', nolayer=True, bv=0, th=.01)
        fill(stroke([(.25, .4), (.55, .1)], .13), '#c0453a', True, step=.003)
        fill(stroke([(.55, .4), (.25, .1)], .13), '#c0453a', True, step=.003)
    lay(.04)


def compass_rose(cx, cz, r, col=CYAN):
    fill(ngon(cx, cz, r, n=18), '#3a8ad8', step=.02)
    fill(ngon(cx, cz, r * .82, n=18), '#e8f4ff', step=.01)
    fill([(cx, cz + r * .7), (cx + r * .17, cz), (cx, cz - r * .1), (cx - r * .17, cz)], '#ff5a5a', step=.005)
    fill([(cx, cz - r * .7), (cx + r * .17, cz), (cx, cz + r * .1), (cx - r * .17, cz)], '#3a8ad8', step=.003)
    lay(.03)


def book_stack(cx, cz, s):
    with xf(0, s, cx, cz):
        for z, c, w in ((-.7, '#8a5ac8', 1.7), (-.28, '#c0453a', 1.5), (.14, '#4a6ab8', 1.6)):
            fill(rect(0, z, w, .38), c, step=.02)
            fill(rect(.0, z, w - .1, .07), '#f2ead6', nolayer=True, bv=0, th=.01)
            fill(rect(-w / 2 + .18, z, .06, .38), GOLD, nolayer=True, bv=0, th=.01)
        fill(rect(.1, .6, 1.2, .3), '#2f9a5a', step=.02)
    lay(.04)


def glasses(cx, cz, s):
    with xf(0, s, cx, cz):
        for x in (-.42, .42):
            ring(x, 0, .32, .1, '#c9d2e0', n=14)
            fill(ngon(x, 0, .22, n=12), '#cfeaff', True, nolayer=True)
        fill(stroke([(-.12, .05), (.12, .05)], .08), '#c9d2e0', step=.005)
    lay(.04)


# ------------------------------------------------------------------ recettes
def J(name, draw, evo=False):
    key = 'job_%s%s' % (name, '_evo' if evo else '')

    @icon(key, 32)
    def _():
        jplate(JOBS[name], evo)
        with xf(0, .72, 0, 0):
            draw()
        if evo:
            sparkle(.66, .66, .17, WHITE)


J('cuisinier', lambda: (toque(-.15, .15, .95), ladle(.62, -.15, .8, rot=-35)))
J('architecte', lambda: (square_tool(-.15, -.1, .85, '#c9d2e0'), compass_tool(.35, .1, .8, '#e0b040', rot=-15)))
J('chasseur', lambda: (antlers(.35, .0, .75, '#e8d8b0'), bow(-.5, 0, .9, col='#c98f5a')))
J('cueilleur', lambda: basket(0, -.05, 1.0))
J('entraineur', lambda: dummy(0, 0, 1.0))
J('fermier', lambda: (pitchfork(-.45, 0, 1.0, rot=0), wheat(.5, -.05, .9)))
J('forgeron', lambda: hammer_anvil(0, 0, 1.0))
J('eleveur', lambda: cow(0, 0, 1.0))
J('mineur', lambda: (pick(-.2, .0, 1.0, rot=35), nugget(.5, -.55, .55)))
J('alchimiste', lambda: (flask(-.4, .3, .7, '#ff7ad9', e_liq=True), crucible(.4, -.4, .75)))
J('marchand', lambda: (scales(0, .1, 1.0), coin(.0, -.75, .25, GOLD, mark=None)))
J('apothicaire', lambda: mortar(0, 0, 1.0))
J('cartographe', lambda: (rolled_map(-.2, .05, 1.0), compass_rose(.6, -.55, .38)))
J('bibliothecaire', lambda: (book_stack(0, -.1, .95), glasses(.0, .8, .45)))


def _caduceus():
    fill(stroke([(0, -.95), (0, .85)], .12), '#c9d2e0', step=.02)
    for sx in (-1, 1):
        with xf(0, 1, 0, 0, flip=(sx < 0)):
            for k, L in enumerate((.85, .68, .5)):
                ar = math.radians(8 + 22 * k)
                fill(stroke([(.1 + L * math.cos(ar) * j / 6, .72 + L * math.sin(ar) * j / 6 * .9) for j in range(7)], 0, 0, lambda t: .24 * sm(t, .5) + .02), '#e8fff0', step=.003)
    fill(stroke([(.3, -.6), (-.3, -.25), (.3, .1), (-.3, .45)], .13), '#5fe07a', step=.01)
    fill(stroke([(-.3, -.6), (.3, -.25), (-.3, .1), (.3, .45)], .13), '#3fae5a', step=.003)
    fill(ngon(0, .9, .16), GOLD, step=.01)


def _astrolabe():
    ring(0, 0, .9, .2, GOLD)
    ring(0, 0, .6, .1, '#e0b040')
    fill(star(0, 0, 8, .75, .2, 90), '#ffe27a', True, step=.01)
    fill(ngon(0, 0, .14), WHITE, True, step=.01)
    fill(ngon(0, 1.0, .13), GOLD, step=.01)


def _philo():
    fill(ngon(0, 0, .8, n=24), pal('#c0252a')[0], True, step=.01)
    fill(ngon(0, 0, .66, n=24), '#e83a4a', True, step=.01)
    fill([(0, .5), (.45, -.3), (-.45, -.3)], '#ffd0d8', True, step=.01)
    fill([(0, -.5), (.45, .3), (-.45, .3)], '#ff9aa8', True, step=.003, nolayer=True)
    fill(ngon(0, 0, .12), WHITE, True, step=.01)
    sparks([(.7, .7), (-.75, -.5)], '#ffb0b8', .15)


def _tome():
    fill(rect(0, 0, 1.6, 1.9), '#6a48b8', step=.02)
    fill(rect(-.7, 0, .2, 1.9), '#4a2a7a', step=.01)
    fill(rect(.05, 0, 1.2, 1.5), '#8a68d8', step=.01)
    fill(star(.05, 0, 5, .45, .2), GOLD, True, step=.01)
    fill(rect(.8, 0, .2, .5), GOLD, step=.01)
    fill(ngon(.8, 0, .12), WHITE, True, step=.003, nolayer=True)


def _rack():
    fill(rect(0, -.2, 1.9, .16), '#7a4a30', step=.02)
    fill(rect(-.8, -.7, .16, 1.0), '#7a4a30', step=.01)
    fill(rect(.8, -.7, .16, 1.0), '#7a4a30', step=.01)
    sword(-.45, .15, .6, rot=0, col='#fff0a0', hilt=GOLD)
    sword(.45, .15, .6, rot=0, col='#fff0a0', hilt=GOLD)
    axe(0, .2, .6, rot=0, col=GOLD, haft='#7a4a30') if False else None
    fill(star(0, .7, 5, .25, .11), GOLD, True, step=.01)


def _wolf_silver():
    wolf(0, 0, 1.0, '#dfe6f2')


def _saddle():
    fill([(-.9, .1), (-.5, .55), (.5, .55), (.9, .1), (.7, -.3), (-.7, -.3)], '#8a4a2a', step=.02)
    fill([(-.6, .1), (-.35, .35), (.35, .35), (.6, .1)], '#c0453a', step=.01)
    fill(stroke([(-.55, -.3), (-.55, -.7)], .1), '#5a3a28', step=.005)
    fill(stroke([(.55, -.3), (.55, -.7)], .1), '#5a3a28', step=.005)
    horseshoe(0, -.7, .38, GOLD)
    fill(ngon(-.55, -.78, .16, n=8), GOLD, step=.003)


def _lantern_crystal():
    lantern(-.4, .0, .8, '#8a93aa')
    crystal(.55, -.2, .55, '#c58bff')


def _chest():
    chest(0, -.2, .9, '#7a4a30')
    for x, z, r in ((-.4, .35, .22), (0, .5, .24), (.4, .35, .22), (-.15, .65, .18)):
        coin(x, z, r, GOLD, mark=None)
    sparks([(.7, .8)], WHITE, .14)


def _plan_square():
    tower(.35, .1, .55, '#8a93aa')
    square_tool(-.3, -.1, .8, GOLD)


J('architecte', lambda: _plan_square(), evo=True)
J('cuisinier', lambda: (toque(-.1, .15, .95, star_=True), ladle(.65, -.15, .8, rot=-35)), evo=True)
J('chasseur', _wolf_silver, evo=True)
J('cueilleur', lambda: basket(0, -.05, 1.0, flowers=True), evo=True)
J('entraineur', _rack, evo=True)
J('fermier', lambda: wheat(0, 0, 1.2, crown_=True, col=GOLD), evo=True)
J('forgeron', lambda: hammer_anvil(0, 0, 1.0, spark=True), evo=True)
J('eleveur', _saddle, evo=True)
J('mineur', _lantern_crystal, evo=True)
J('alchimiste', _philo, evo=True)
J('marchand', _chest, evo=True)
J('apothicaire', _caduceus, evo=True)
J('cartographe', _astrolabe, evo=True)
J('bibliothecaire', _tome, evo=True)


# ================================================================== BADGES DE PALIER (medaillon numerote, 48x48)
FONT = {'0': '111101101101111', '1': '010110010010111', '2': '111001111100111', '3': '111001111001111', '4': '101101111001001',
        '5': '111100111001111', '6': '111100111101111', '7': '111001010010010', '8': '111101111101111', '9': '111101111001111'}


def stamp_num(n, col=(255, 255, 255)):
    def post(img):
        a = np.array(img)
        s = str(n)
        W, H, sc = 3 * len(s) + (len(s) - 1), 5, 2
        pix = []
        for i, ch in enumerate(s):
            for r in range(5):
                for c in range(3):
                    if FONT[ch][r * 3 + c] == '1':
                        pix.append((i * 4 + c, r))
        x0 = 24 - (W * sc) // 2
        y0 = 48 - 5 * sc - 5
        dk = (0x1d, 0x14, 0x30)
        mask = np.zeros((48, 48), bool)
        for (px, py) in pix:
            for dx in range(sc):
                for dy in range(sc):
                    mask[y0 + py * sc + dy, x0 + px * sc + dx] = True
        ol = mask.copy()
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (-1, -1), (1, -1), (-1, 1)):
            ol |= np.roll(np.roll(mask, dy, 0), dx, 1)
        a[ol] = list(dk) + [255]
        a[mask] = list(col) + [255]
        return Image.fromarray(a, 'RGBA')
    return post


METAL = {'bronze': ('#8a5a30', '#c98f5a', '#e8b888'), 'argent': ('#8a93aa', '#c9d2e0', '#f2f6ff'), 'or': ('#b88a20', '#ffd75a', '#fff0a0')}


def medal(kind, stars=False):
    rim, face, hi = METAL[kind]
    if stars:
        burst(0, 0, 16, 1.0, .88, pal('#ffd75a'))
    fill(ngon(0, 0, .96, n=40), rim, step=.02)
    fill(ngon(0, 0, .84, n=40), face, step=.02)
    fill(ngon(0, 0, .7, n=40), '#4a3a7a' if kind == 'or' else shade(face, -.25), step=.02)
    if stars:
        for a in range(0, 360, 45):
            r = math.radians(a + 22.5)
            fill(star(.9 * math.cos(r), .9 * math.sin(r), 4, .11, .045), WHITE, True, step=.002, nolayer=True)
    lay(.03)


def M_(lv, kind, draw, stars=False):
    @icon('ms_%d' % lv, 48, post=stamp_num(lv))
    def _():
        medal(kind, stars)
        with xf(0, .5, 0, .2):
            draw()


M_(5, 'bronze', lambda: (hammer(-.15, 0, 1.0, rot=35, col='#c9d2e0'), fill(stroke([(.7, -.8), (-.55, .75)], .14), '#f2ead6', step=.02), fill([(-.55, .75), (-.9, .9), (-.7, .55)], '#fff6d8', step=.01)))


def _two_shields():
    shield(-.45, 0, .7, '#4a6ab8', trim='#c9d2e0')
    shield(.45, .0, .7, '#c0453a', trim='#c9d2e0')
    ring(0, 0, .22, .1, GOLD)


M_(10, 'bronze', _two_shields)


def _weapon_blazon():
    shield(0, 0, 1.0, '#4a2a7a', trim=GOLD, kind='kite')
    sword(0, .1, .7, rot=0, col='#dfe6f2')


M_(20, 'bronze', _weapon_blazon)


def _tri_blazon():
    shield(0, 0, 1.0, '#4a2a7a', trim=GOLD, kind='kite')
    for x, z, c in ((0, .35, '#5fe07a'), (-.3, -.1, '#ff5a5a'), (.3, -.1, '#6fd3ff')):
        fill(ngon(x, z, .24, n=14), c, True, step=.01)
        fill(ngon(x - .06, z + .07, .08, n=6), WHITE, True, nolayer=True)


M_(30, 'bronze', _tri_blazon)
M_(35, 'argent', lambda: (ring(0, 0, .9, .13, '#6a9aff', True), bolt(0, 0, .65, pal('#ffcf4a'))))


def _eye_open():
    burst(0, 0, 12, 1.1, .75, pal('#dfe6f2'))
    eye(0, 0, .95, '#ffffff', pupil='#1d3a6a', iris='#6fd3ff')


M_(40, 'argent', _eye_open)
M_(45, 'argent', lambda: (anvil(0, -.2, .9, '#e0b040'), fill(star(0, .65, 5, .38, .17), WHITE, True, step=.01), fill(star(0, .65, 5, .5, .2), GOLD, True, step=.004, nolayer=True) if False else None))


def _wing():
    with xf(0, 1, -.25, 0):
        for i, (a, L) in enumerate(((-10, 1.2), (15, 1.15), (40, 1.0), (65, .8))):
            ar = math.radians(a)
            fill(stroke([(L * math.cos(ar) * k / 8 * .9 - .3, -.3 + L * math.sin(ar) * k / 8 * 1.1) for k in range(9)], 0, 0, lambda t: .4 * sm(t, .5) + .02), '#ffd75a' if i % 2 else '#ffe27a', step=.006)
    fill(ngon(-.35, -.35, .2, n=10), '#b88a20', step=.01)


M_(50, 'or', _wing)


def _sun_crown():
    burst(0, -.1, 12, .95, .6, pal('#ffd75a'))
    fill(ngon(0, -.1, .5, n=20), '#ffe27a', True, step=.01)
    for a in range(0, 360, 51):
        r = math.radians(a + 90)
        fill(star(.78 * math.cos(r), -.1 + .78 * math.sin(r), 5, .17, .08), WHITE, True, step=.003)
    crown(0, -.1, .5, '#ffd75a', gem='#ff5a8a')


M_(60, 'or', _sun_crown, stars=True)
