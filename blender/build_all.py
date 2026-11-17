"""build_all.py - regenere TOUT : modeles .blend, PNG, assets/assets.js, assets/manifest.json, assets/preview.png.
Usage :  /opt/bvenv/bin/python blender/build_all.py [--pack-only | --icons-only]"""
import sys, os, json, time, base64, subprocess, glob
from concurrent.futures import ThreadPoolExecutor
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
ASSETS = os.path.join(ROOT, 'assets')
PNG = os.path.join(ASSETS, 'png')
PY = sys.executable
sys.path.insert(0, HERE)

BLD = ['auberge', 'ferme', 'camp', 'inf', 'forge', 'hdv', 'chasse', 'biblio', 'labo', 'entrepot', 'marche']
BLD_INFO = {  # nom affiche + couleur du batiment (identique a buildings.py / BLD du jeu)
    'auberge': ('Auberge', '#c0453a'), 'ferme': ('Ferme', '#5a9a3a'), 'camp': ("Camp d'entraînement", '#d08a2a'),
    'inf': ('Infirmerie', '#3fb0a0'), 'forge': ('Forge', '#5a5f78'), 'hdv': ('Hôtel de ville', '#4a6ab8'),
    'chasse': ('Installations de chasse', '#6a7a3a'), 'biblio': ('Bibliothèque', '#8a5ac8'),
    'labo': ("Laboratoire d'alchimie", '#d0508a'), 'entrepot': ('Entrepôt', '#8a7050'), 'marche': ('Marché', '#d8b838')}


def jobs(icons_only=False):
    if icons_only:
        return [['icons.py', 'all', '%d/4' % i] for i in range(4)]
    J = [['buildings.py', 'plot']]
    for k in BLD:
        J.append(['buildings.py', k])
    J += [['items.py'], ['ui.py'], ['extras.py'], ['materials.py'], ['intro.py', 'panels'], ['intro.py', 'vortex', 'frame']]
    fx = ['slash', 'shield', 'stab', 'arrow', 'blast', 'heal', 'buff', 'el_feu', 'el_glace', 'el_foudre', 'el_nature',
          'el_sacre', 'el_ombre', 'el_arcane', 'ult_guerrier', 'ult_gardien', 'ult_assassin', 'ult_archer',
          'ult_sorcier', 'ult_soigneur', 'ult_soutien']
    J += [['fx.py'] + fx[:7], ['fx.py'] + fx[7:14], ['fx.py'] + fx[14:]]
    # icones de progression (docs/progression.md section 12) : 285 icones, 4 tranches egales
    J += [['icons.py', 'all', '%d/4' % i] for i in range(4)]
    return J


def run(j):
    t = time.time()
    r = subprocess.run([PY, os.path.join(HERE, j[0])] + j[1:], capture_output=True, text=True)
    err = [l for l in (r.stdout + r.stderr).splitlines() if 'Traceback' in l or 'Error' in l]
    print('  %-14s %-10s %5.1fs %s' % (j[0], ' '.join(j[1:3]), time.time() - t, 'ECHEC ' + ' | '.join(err[:2]) if r.returncode else 'ok'), flush=True)
    return r.returncode


def pack():
    from PIL import Image, ImageDraw, ImageFont
    files = sorted(glob.glob(os.path.join(PNG, '*.png')))
    man, data = {}, {}
    for f in files:
        k = os.path.splitext(os.path.basename(f))[0]
        if k.startswith('_') or k.startswith('t_'):
            continue
        im = Image.open(f).convert('RGBA')
        im.save(f, optimize=True)
        b = open(f, 'rb').read()
        data[k] = 'data:image/png;base64,' + base64.b64encode(b).decode()
        e = dict(file='png/%s.png' % os.path.basename(f)[:-4], w=im.width, h=im.height)
        if k.startswith('fx_'):
            fs = im.height
            e.update(kind='fx', frames=im.width // fs, frame_w=fs, frame_h=fs, fps=14)
        elif k.startswith('bld_') or k.startswith('bldui_'):
            bk, lv = k.split('_')[1], int(k.split('_')[2])
            e.update(kind='building_map' if k.startswith('bld_') else 'building_ui', building=bk, level=lv, col=BLD_INFO[bk][1], name=BLD_INFO[bk][0])
        elif k.startswith('item_'):
            e['kind'] = 'item'
        elif k.startswith('intro_') and k != 'intro_frame':
            e['kind'] = 'intro'
        elif k == 'intro_frame':
            e.update(kind='ui', slice=12)
        elif k.startswith('mat_'):
            e['kind'] = 'material'
        elif k.startswith('res_'):
            e['kind'] = 'resource'
        elif k.startswith('sk_'):
            e['kind'] = 'skill'
        elif k.startswith('cl_voie_') or k.startswith('fr_') or k.startswith('ms_') or k.startswith('fam_'):
            e['kind'] = 'badge'
        elif k.startswith('cl_'):
            e['kind'] = 'class'
        elif k.startswith('job_'):
            e['kind'] = 'job'
        elif k.startswith('ui_'):
            e['kind'] = 'ui'
            if k == 'ui_panel':
                e['slice'] = 12
        else:
            e['kind'] = 'misc'
        man[k] = e
    js = ("/* Genere par blender/build_all.py - ne pas editer. Images PNG pixel-art en data URI. */\n"
          "Object.assign(window.ASSETS_IMG=window.ASSETS_IMG||{},%s);\n" % json.dumps(data, separators=(',', ':')))
    open(os.path.join(ASSETS, 'assets.js'), 'w').write(js)
    manifest = dict(version=1, buildings={k: dict(name=v[0], col=v[1]) for k, v in BLD_INFO.items()},
                    note="Cles: bld_<k>_<lv> (54x58), bldui_<k>_<lv> (160x120), plot_empty, res_<k> (16x16), ui_*, item_<key> (24x24), mat_<key> (24x24 : parchemin_1-6, tome_1-5, pierre_1-6, minerai, lingot, mithril, cuir, tissu, bois, cristal, croc, noyau, poussiere, essence_<elem>), ui_enclume/ui_evolution (32x32), "
                         "fx_<nom> (feuilles horizontales ; fx_vortex = 8 images 96x96), "
                         "icones de progression (kind skill|class|job|badge|ui) : sk_<id|ame_*|sub_*|tech_*|ult_*> (32x32), cl_<sous-classe|spe|spe_divin> (48x48), cl_voie_* et fam_* (16x16), fr_* et ms_<niv> (48x48), job_<id>[_evo] (32x32), ui_node_lock/mystery/next (12/32/40), portail, bateau, bateau_ui, intro_1..intro_6 (planches de BD 320x180), intro_frame (cadre 9-slice 48x48, slice 12).", assets=man)
    json.dump(manifest, open(os.path.join(ASSETS, 'manifest.json'), 'w'), indent=1, ensure_ascii=False)
    # ---- planche de contact x3 (x2 pour les grandes images) sur le fond du jeu
    W = 2400
    bg = (0x14, 0x12, 0x2a, 255)
    groups = [('sk_', 'Competences'), ('cl_voie', 'Pastilles de voie'), ('cl_', 'Emblemes de classe'), ('fr_', 'Cadres de forme'), ('ms_', 'Badges de palier'),
              ('job_', 'Metiers'), ('fam_', 'Familles'), ('ui_node', 'Arbre (UI)'),
              ('bld_', 'Batiments (carte)'), ('plot_', 'Terrain'), ('portail', 'Portail'), ('res_', 'Ressources'), ('ui_', 'UI'),
              ('item_', 'Objets'), ('mat_', 'Materiaux / evolution'), ('fx_el', 'Elements'), ('fx_ult', 'Ultimes'), ('fx_', 'Effets de role'), ('bateau', 'Bateau'), ('intro_', 'Intro (BD)'), ('bldui_', 'Illustrations')]
    used = set()
    placed = []
    y = 8
    font = ImageFont.load_default()
    items_by_group = []
    for pre, title in groups:
        ks = [k for k in man if k.startswith(pre) and k not in used]
        used.update(ks)
        if pre == 'fx_':
            ks = [k for k in ks]
        items_by_group.append((title, ks))
    canvas_items = []
    for title, ks in items_by_group:
        if not ks:
            continue
        canvas_items.append(('T', title, 0, 0, y))
        y += 14
        x, rowh = 8, 0
        for k in ks:
            im = Image.open(os.path.join(PNG, k + '.png'))
            sc = 3 if max(im.size) <= 100 else (2 if max(im.size) <= 400 else 1)
            if im.width * sc > W - 16:
                sc = max(1, (W - 16) // im.width)
            w, h = im.width * sc, im.height * sc
            if x + w > W - 8:
                x, y, rowh = 8, y + rowh + 8, 0
            canvas_items.append(('I', k, sc, x, y))
            x += w + 8
            rowh = max(rowh, h)
        y += rowh + 14
    pv = Image.new('RGBA', (W, y + 8), bg)
    d = ImageDraw.Draw(pv)
    for t, k, sc, x, yy in canvas_items:
        if t == 'T':
            d.text((8, yy), k, fill=(0xf2, 0xe6, 0xc9, 255), font=font)
        else:
            im = Image.open(os.path.join(PNG, k + '.png')).convert('RGBA')
            im = im.resize((im.width * sc, im.height * sc), Image.NEAREST)
            pv.paste(im, (x, yy), im)
    pv.convert('RGB').save(os.path.join(ASSETS, 'preview.png'), optimize=True)
    icon_sheets(man)
    print('assets.js : %.2f Mo, %d images ; preview.png %dx%d' % (os.path.getsize(os.path.join(ASSETS, 'assets.js')) / 1e6, len(data), pv.width, pv.height))



def icon_sheets(man):
    """planches de contact des icones de progression : assets/preview_icons.png (tout) + preview_icons_<type>.png."""
    from PIL import Image, ImageDraw, ImageFont
    font = ImageFont.load_default()
    kinds = ['skill', 'class', 'job', 'badge', 'ui']
    prefix_order = ['sk_ame', 'sk_sub', 'sk_tech', 'sk_ult', 'sk_', 'cl_voie', 'fam_', 'fr_', 'ms_']

    def sheet(ks, W=1700, sc_of=lambda im: 4 if im.width <= 32 else (3 if im.width <= 48 else 2), label=True):
        items, x, y, rowh = [], 6, 6, 0
        for k in ks:
            im = Image.open(os.path.join(PNG, k + '.png')).convert('RGBA')
            sc = sc_of(im)
            w, h = im.width * sc, im.height * sc
            if x + w + 6 > W:
                x, y, rowh = 6, y + rowh + 6, 0
            items.append((k, im, sc, x, y))
            x += w + 6
            rowh = max(rowh, h)
        out = Image.new('RGBA', (W, y + rowh + 8), (0x14, 0x12, 0x2a, 255))
        for k, im, sc, xx, yy in items:
            im = im.resize((im.width * sc, im.height * sc), Image.NEAREST)
            out.paste(im, (xx, yy), im)
        return out.convert('RGB')
    allk = []
    for kd in kinds:
        ks = sorted(k for k, e in man.items() if e.get('kind') == kd and (kd != 'ui' or k.startswith('ui_node')))
        if not ks:
            continue
        ks = sorted(ks, key=lambda k: (next((i for i, p in enumerate(prefix_order) if k.startswith(p)), 99), k))
        sheet(ks).save(os.path.join(ASSETS, 'preview_icons_%s.png' % kd), optimize=True)
        allk += ks
    sheet(allk, sc_of=lambda im: 3 if im.width <= 32 else (2 if im.width <= 48 else 2)).save(os.path.join(ASSETS, 'preview_icons.png'), optimize=True)


if __name__ == '__main__':
    t0 = time.time()
    if '--pack-only' not in sys.argv:
        print('Rendu (4 processus Blender en parallele)...')
        with ThreadPoolExecutor(4) as ex:
            rc = list(ex.map(run, jobs('--icons-only' in sys.argv)))
        print('echecs :', sum(1 for r in rc if r))
    pack()
    print('Total : %.0f s' % (time.time() - t0))
