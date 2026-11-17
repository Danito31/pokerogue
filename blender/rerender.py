"""rerender.py - re-rend un .blend modifie a la main :
   /opt/bvenv/bin/python blender/rerender.py blender/models/bld_forge_2.blend
Les PNG sont ecrits dans assets/png/ ; ensuite : build_all.py --pack-only (regenere assets.js, manifest, preview)."""
import sys, os, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *

for path in sys.argv[1:]:
    bpy.ops.wm.open_mainfile(filepath=os.path.abspath(path))
    sc = bpy.context.scene
    if 'px_fx' in sc:
        from fx import render_fx
        print(render_fx(json.loads(sc['px_fx'])))
    else:
        for p in run_renders():
            print(p)
