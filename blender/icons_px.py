"""icons_px.py - petites icones dessinees en PIL (suréchantillonnage x8 + seuil dur) : fam_* 16x16, cl_voie_* 16x16, ui_node_*.
Formes trop petites pour un rendu 3D lisible : pastille a contour #1d1430 + 3 tons (clair haut-gauche, sombre bas-droite) + pictogramme."""
import math
from PIL import Image, ImageDraw
import numpy as np

OLC = (0x1d, 0x14, 0x30)
SS = 8
FAMC = dict(soutien='#ffcf4a', soin='#5fe07a', protection='#bfe8ff', degats='#ff5a5a', controle='#c58bff', defense='#a9a6b8',
            chance='#4de0c0', decouverte='#6fd3ff', cuisine='#e8945a', celerite='#ff9a3a')
PXREG = {}


def h2(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def mixc(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def mask_of(n, fn):
    m = Image.new('L', (n * SS, n * SS), 0)
    fn(ImageDraw.Draw(m), lambda v: v * SS)
    return np.array(m.resize((n, n), Image.BOX)) >= 128


def paint(a, m, col, alpha=255):
    a[m] = list(col) + [alpha]


def circ(cx, cy, r):
    return lambda d, k: d.ellipse([k(cx - r), k(cy - r), k(cx + r), k(cy + r)], fill=255)


def poly(pts):
    return lambda d, k: d.polygon([(k(x), k(y)) for x, y in pts], fill=255)


def line(pts, w):
    def f(d, k):
        d.line([(k(x), k(y)) for x, y in pts], fill=255, width=max(1, int(w * SS)), joint='curve')
        for x, y in pts:
            d.ellipse([k(x - w / 2), k(y - w / 2), k(x + w / 2), k(y + w / 2)], fill=255)
    return f


def rectf(x0, y0, x1, y1):
    return lambda d, k: d.rectangle([k(x0), k(y0), k(x1), k(y1)], fill=255)


def many(*fs):
    return lambda d, k: [f(d, k) for f in fs]


def scaled(fn, s, c=8.0, dx=0.0, dy=0.0):
    """applique une homothetie (autour de c) au dessin fn (qui appelle k(v))."""
    return lambda d, k: fn(d, lambda v: k((v - c) * s + c + (dx if True else 0)))


def outline_of(img):
    """contour exterieur 1 px (l'image doit laisser 1 px de marge)."""
    a = np.array(img)
    al = a[..., 3] > 0
    m = np.zeros_like(al)
    m[1:, :] |= al[:-1, :]; m[:-1, :] |= al[1:, :]; m[:, 1:] |= al[:, :-1]; m[:, :-1] |= al[:, 1:]
    a[m & ~al] = list(OLC) + [255]
    return Image.fromarray(a, 'RGBA')


def disc(n, base, rim=True, hi=True):
    """pastille n x n : contour #1d1430 inclus, corps 3 tons. retourne (tableau RGBA, masque du corps)."""
    a = np.zeros((n, n, 4), np.uint8)
    c = n / 2.0
    b = h2(base)
    paint(a, mask_of(n, circ(c, c, n / 2.0)), OLC)
    body = mask_of(n, circ(c, c, n / 2.0 - 1))
    paint(a, body, b)
    r = n / 2.0 - 1
    dark = mask_of(n, circ(c, c, r)) & ~mask_of(n, circ(c - r * .2, c - r * .2, r * .93))
    paint(a, dark, mixc(b, (40, 20, 90), .4))
    if hi:
        light = mask_of(n, circ(c, c, r)) & ~mask_of(n, circ(c + r * .22, c + r * .22, r * .9))
        paint(a, light, mixc(b, (255, 255, 255), .5))
    return a, body


def glyph_layer(a, fn, col=(255, 255, 255), shadow=None, off=3.0):
    """pictogramme dessine dans un repere 0..10 place au centre de la pastille."""
    n = a.shape[0]
    f = lambda d, k: fn(d, lambda v: k(v + off))
    m = mask_of(n, f)
    if shadow:
        sh = np.zeros_like(m)
        sh[1:, 1:] = m[:-1, :-1]
        paint(a, sh & ~m & (a[..., 3] > 0), shadow)
    paint(a, m, col)


def ring_o(x0, y0, x1, y1, w):
    return lambda d, k: d.ellipse([k(x0), k(y0), k(x1), k(y1)], outline=255, width=max(1, int(w * SS)))


# ------------------------------------------------------------------ familles : pictogrammes blancs (repere 0..10)
GLY = {
    'soutien': many(line([(2, .6), (2, 9.6)], 1.5), poly([(2.4, 1), (9, 2.6), (6.6, 4.2), (9, 5.8), (2.4, 6.6)])),
    'soin': many(rectf(3.2, .4, 6.8, 9.6), rectf(.4, 3.2, 9.6, 6.8)),
    'protection': poly([(.4, 1), (5, .1), (9.6, 1), (9.6, 5.2), (5, 9.9), (.4, 5.2)]),
    'degats': many(line([(8.8, 1.2), (3.8, 6.2)], 2.4), poly([(9.8, .2), (9.8, 2.4), (7.8, .2)]),
                   line([(1.9, 4.7), (5.3, 8.1)], 1.5), line([(2.8, 7.2), (.9, 9.1)], 1.9)),
    'controle': many(ring_o(.5, .5, 5.7, 5.7, 1.5), ring_o(4.3, 4.3, 9.5, 9.5, 1.5)),
    'defense': poly([(.3, 9.2), (1.1, 4.6), (3.6, 1.4), (7.2, 1), (9.6, 4.4), (9.4, 9.2)]),
    'chance': many(circ(2.9, 2.9, 2.5), circ(7.1, 2.9, 2.5), circ(2.9, 7.1, 2.5), circ(7.1, 7.1, 2.5)),
    'decouverte': many(ring_o(.4, .4, 6.6, 6.6, 1.6), line([(5.7, 5.7), (9.4, 9.4)], 2.4)),
    'cuisine': many(lambda d, k: d.pieslice([k(.4), k(2.2), k(9.6), k(9.8)], 0, 180, fill=255), rectf(.2, 4.4, 9.8, 5.5),
                    line([(3, .4), (3.9, 1.5), (3, 2.7)], 1.1), line([(6.8, .4), (7.7, 1.5), (6.8, 2.7)], 1.1)),
    'celerite': poly([(0, 8.4), (1.4, 4), (5, .6), (9.8, .8), (7.4, 2.8), (9.8, 4), (7, 5.2), (8.4, 7.4), (5, 6.8), (3.4, 9.6)]),
}


CARVE = {
    'chance': many(line([(5, .1), (5, 2.2)], .9), line([(5, 7.8), (5, 9.9)], .9), line([(.1, 5), (2.2, 5)], .9), line([(7.8, 5), (9.9, 5)], .9)),
    'protection': line([(5, 2.2), (5, 7.4)], .8),
    'defense': line([(4.2, 1.4), (5.6, 4), (4.4, 6.6)], .9),
}


def fam(name):
    def f():
        a, body = disc(16, FAMC[name])
        glyph_layer(a, GLY[name], (255, 255, 255), shadow=mixc(h2(FAMC[name]), (40, 20, 90), .6))
        if name in CARVE:
            n = 16
            m = mask_of(n, lambda d, k: CARVE[name](d, lambda v: k(v + 3.0))) & body
            paint(a, m, mixc(h2(FAMC[name]), (40, 20, 90), .25))
        return Image.fromarray(a, 'RGBA')
    return f


for _n in FAMC:
    PXREG['fam_' + _n] = fam(_n)


# ------------------------------------------------------------------ pastilles de voie (16x16) : fond sombre, symbole colore
def voie(name):
    def f():
        a, body = disc(16, '#322c66', hi=False)
        if name == 'coeur':
            col = '#5fe07a'
            pts = []
            for i in range(48):
                t = 2 * math.pi * i / 48
                x = 16 * math.sin(t) ** 3
                z = 13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t)
                pts.append((8 + x / 17 * 5.4, 8.9 - (z + 2) / 15 * 5.4))
            paint(a, mask_of(16, poly(pts)), mixc(h2(col), (40, 20, 90), .4))
            paint(a, mask_of(16, poly([(8 + (x - 8) * .8 - .3, 8.9 + (y - 8.9) * .8 - .4) for x, y in pts])), h2(col))
            paint(a, mask_of(16, circ(6.2, 6.6, .9)), (216, 255, 224))
        elif name == 'lame':
            col = '#ff5a5a'
            paint(a, mask_of(16, poly([(12.4, 2.8), (13.4, 3.8), (6.2, 11), (5, 9.8)])), mixc(h2(col), (40, 20, 90), .35))
            paint(a, mask_of(16, poly([(12, 3.2), (12.9, 4.1), (6.1, 10.7), (5.3, 9.9)])), h2(col))
            paint(a, mask_of(16, line([(11.2, 4.6), (7.2, 8.8)], .8)), (255, 216, 216))
            paint(a, mask_of(16, line([(4.2, 8.4), (7.6, 11.8)], 1.6)), h2('#e0b040'))
            paint(a, mask_of(16, line([(5.6, 10.4), (3.4, 12.6)], 1.8)), h2('#a9744a'))
        else:
            col = '#6fd3ff'
            up = [(8 + x, 8 - 3.8 * max(0, 1 - (x / 5.6) ** 2) ** .8) for x in [-5.6 + .56 * i for i in range(21)]]
            dn = [(8 + x, 8 + 3.8 * max(0, 1 - (x / 5.6) ** 2) ** .8) for x in [5.6 - .56 * i for i in range(21)]]
            paint(a, mask_of(16, poly(up + dn)), (232, 248, 255))
            paint(a, mask_of(16, circ(8, 8, 3.0)), h2(col))
            paint(a, mask_of(16, circ(8, 8, 1.5)), (29, 58, 106))
            paint(a, mask_of(16, circ(7.2, 7.2, .7)), (255, 255, 255))
        return Image.fromarray(a, 'RGBA')
    return f


for _n in ('coeur', 'lame', 'esprit'):
    PXREG['cl_voie_' + _n] = voie(_n)


# ------------------------------------------------------------------ interface de l'arbre
def ui_lock():
    n = 12
    a = np.zeros((n + 2, n + 2, 4), np.uint8)   # marge de 1 px pour le contour, rognee ensuite
    def L(col, fn):
        paint(a, mask_of(n + 2, lambda d, k: fn(d, lambda v: k(v + 1))), h2(col))
    L('#6a6880', lambda d, k: d.ellipse([k(3.2), k(1.2), k(8.8), k(7.6)], outline=255, width=int(1.5 * SS)))
    L('#8a86a0', rectf(2.2, 5.4, 9.8, 10.6))
    L('#b9b5cc', rectf(2.2, 5.4, 9.8, 6.4))
    L('#5a5870', rectf(2.2, 9.6, 9.8, 10.6))
    L('#2a2848', circ(6, 7.9, 1.0))
    L('#2a2848', rectf(5.5, 8.1, 6.5, 9.4))
    im = outline_of(Image.fromarray(a, 'RGBA'))
    return crop_center(im, 12)


def crop_center(im, n):
    a = np.array(im)
    al = a[..., 3] > 0
    ys, xs = np.where(al)
    cx, cy = (xs.min() + xs.max()) // 2, (ys.min() + ys.max()) // 2
    x0, y0 = max(0, cx - n // 2), max(0, cy - n // 2)
    out = Image.new('RGBA', (n, n), (0, 0, 0, 0))
    out.paste(im.crop((x0, y0, x0 + n, y0 + n)), (0, 0))
    return out


PXREG['ui_node_lock'] = ui_lock


def ui_mystery():
    n = 32
    a, body = disc(n, '#8a86a0')
    g = mask_of(n, many(lambda d, k: d.arc([k(10.4), k(6.4), k(21.6), k(17.6)], 165, 40 + 360, fill=255, width=int(3.6 * SS)),
                        line([(16, 16.6), (16, 19.6)], 3.6), circ(16, 23.8, 2.2)))
    sh = np.zeros_like(g)
    sh[1:, 1:] = g[:-1, :-1]
    paint(a, sh & ~g & body, (74, 72, 104))
    paint(a, g, (255, 255, 255))
    return Image.fromarray(a, 'RGBA')


PXREG['ui_node_mystery'] = ui_mystery


def ui_next():
    n = 40
    y, x = np.mgrid[0:n, 0:n]
    r = np.hypot(x - 19.5, y - 19.5)
    ang = np.arctan2(y - 19.5, x - 19.5)
    a = np.zeros((n, n, 4), np.uint8)
    core = (r >= 16.0) & (r < 18.0)
    inner = (r >= 14.4) & (r < 16.0)
    hal_o = (r >= 18.0) & (r < 19.6)
    a[hal_o] = [255, 207, 74, 110]
    a[inner] = [255, 240, 160, 150]
    a[core] = [255, 215, 90, 255]
    a[core & (ang < -0.5) & (ang > -2.7)] = [255, 255, 255, 255]
    a[core & (ang > 0.6) & (ang < 2.4)] = [200, 150, 40, 255]
    for deg in range(0, 360, 90):
        cx, cy = 19.5 + 17.2 * math.cos(math.radians(deg)), 19.5 + 17.2 * math.sin(math.radians(deg))
        for dx in range(-2, 3):
            for dy in range(-2, 3):
                if (dx == 0 or dy == 0) and 0 <= int(round(cx)) + dx < n and 0 <= int(round(cy)) + dy < n:
                    a[int(round(cy)) + dy, int(round(cx)) + dx] = [255, 255, 255, 255]
    return Image.fromarray(a, 'RGBA')


PXREG['ui_node_next'] = ui_next
