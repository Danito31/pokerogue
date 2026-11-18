"""icons.py - rend le jeu d'icones de docs/progression.md section 12 (sk_*, cl_*, fr_*, job_*, ms_*, fam_*, ui_node_*).
Usage :  /opt/bvenv/bin/python blender/icons.py <groupe> [i/n] [--out dir]
  groupe = prefixe de cle (ex. sk_tech, cl_, all). i/n : tranche i (0..n-1) sur n (parallelisme par build_all.py).
Les icones 16x16 (fam_*, cl_voie_*) et le cadenas sont dessinees en PIL (icons_px.py) ; le reste vient de scenes Blender."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from iconlib import *
import icons_sk1, icons_sk2, icons_cl, icons_misc, icons_game  # noqa  (enregistrent les recettes dans REG)
from icons_px import PXREG


def keys_for(group):
    ks = sorted(set(REG) | set(PXREG))
    if group in ('all', '*'):
        return ks
    return [k for k in ks if k.startswith(group)]


def main(argv):
    out = PNG_DIR
    if '--out' in argv:
        i = argv.index('--out')
        out = argv[i + 1]
        del argv[i:i + 2]
        os.makedirs(out, exist_ok=True)
    group = argv[0] if argv else 'all'
    ks = keys_for(group)
    if len(argv) > 1 and '/' in argv[1]:
        i, n = [int(v) for v in argv[1].split('/')]
        ks = ks[i::n]
    px = [k for k in ks if k in PXREG]
    for k in px:
        PXREG[k]().save(os.path.join(out, k + '.png'))
    ks = [k for k in ks if k in REG]
    reset_scene()
    t = run_keys(ks, out)
    print('icons %s %s : %d icones en %.1fs' % (group, argv[1] if len(argv) > 1 else '', len(ks), t))


if __name__ == '__main__':
    main(sys.argv[1:])
