# Pipeline d'assets 3D → pixel art — « La Tour des Étoiles »

Tout est généré par script avec **Blender 5.3 (module Python `bpy`, sans interface ni GPU)**, puis converti en pixel art
(Pillow + numpy). Rien n'est dessiné à la main : on peut tout régénérer, ou ouvrir un modèle dans Blender, le retoucher
et le re-rendre.

## Régénérer tous les assets

```
/opt/bvenv/bin/python blender/build_all.py            # tout (≈ 2 à 4 min, 4 processus en parallèle)
/opt/bvenv/bin/python blender/build_all.py --pack-only  # seulement assets.js / manifest.json / preview.png
```
Sorties : `assets/png/*.png`, `assets/assets.js`, `assets/manifest.json`, `assets/preview.png` (planche de contact ×3).
Dans le jeu : `<script src="assets/assets.js"></script>` puis `window.ASSETS_IMG['bld_forge_2']` (data URI utilisable
dans `new Image().src` ; fonctionne en `file://`).

## Scripts

| Fichier | Rôle |
|---|---|
| `common.py` | scène, caméra orthographique, éclairage, matériaux « toon », rendu 2 passes, pixelisation + contour |
| `buildings.py` | 11 bâtiments (+6 dans `buildings2.py`) × 3 niveaux (carte 54×58 + illustration 160×120) + terrain vide |
| `buildings2.py` | 6 bâtiments × 3 niveaux : taverne, mage, chantier (naval), remparts, ecurie, sanctuaire (mêmes `bld_`/`bldui_`) |
| `galaxy.py` | `planete_1..10` (64×64), `planete_joueur` (80×80), `galaxie_fond` (320×180, PIL, tileable en x), `bateau_vol` (4×64×48), `ile_pillage`, `ile_defense` (160×120) |
| `events.py` | 10 illustrations d'expédition 160×120 : `evt_marchand|blesse|coffre|creature|passage|faction|embuscade|autel|source|piege` |
| `icons_game.py` | `inj_*` (5 blessures) et `rs_*` (8 catégories de recherche), 32×32, via `iconlib` |
| `items.py` | 22 icônes d'équipement 24×24 |
| `materials.py` | icônes de craft/évolution 24×24 (`mat_parchemin_1..6`, `mat_tome_1..5`, `mat_pierre_1..6`, matériaux, `mat_essence_<élément>`) + `ui_enclume`, `ui_evolution` 32×32 |
| `ui.py` | icônes de ressources 16×16, étoiles, cadre 9-slice, boutons, ornements |
| `fx.py` | effets d'attaque animés (feuilles de sprites) |
| `extras.py` | portail de la tour, bateau montgolfier |
| `intro.py` | intro en BD : `intro_1..6` (320x180, scènes en perspective éclairées + palette commune + contours), `fx_vortex` (8x96x96), `intro_frame` (9-slice 12) |
| `iconlib.py` | bibliotheque d'emblèmes paramétriques (arcs de slash, étoiles d'impact, éclats, flammes, boucliers, orbes, flèches, runes, armes, outils…) + rendu Blender de face (2 passes, 3 teintes, contour `#1d1430`, liseré blanc des ultimes) |
| `icon_parts.py`, `icons_sk1.py`, `icons_sk2.py`, `icons_cl.py`, `icons_misc.py` | recettes des icônes de `docs/progression.md` §12 : `sk_*` (171, 32×32), `cl_*` (58, 48×48), `fr_*`, `job_*` (28), `ms_*` (9) |
| `icons_px.py` | petites icônes dessinées en PIL (`fam_*`, `cl_voie_*` 16×16, `ui_node_*`) |
| `icons.py` | lanceur : `/opt/bvenv/bin/python blender/icons.py <préfixe|all> [i/n] [--out dossier]` (≈ 0,25 s par icône ; `build_all.py --icons-only` = 4 processus, ≈ 50 s) |
| `rerender.py` | re-rend un `.blend` retouché |
| `build_all.py` | enchaîne tout et empaquette |

## Ouvrir et modifier un modèle dans Blender

Chaque modèle est sauvegardé dans `blender/models/` : `bld_<bâtiment>_<niveau>.blend`, `item_<clé>.blend`,
`fx_<nom>.blend`, `portail.blend`, `bateau.blend`, etc.

1. Ouvrir le `.blend` dans Blender (≥ 4.2 conseillé, testé en 5.3). Les objets sont des maillages simples (boîtes, cylindres,
   prismes) : on peut les déplacer (`G`), mettre à l'échelle (`S`), pivoter (`R`), en ajouter (`Shift+A`), supprimer (`X`).
2. **Couleurs** : chaque matériau s'appelle `m_<hex>` (ex. `m_c0453a`). Changer la *Base Color* du matériau change la couleur.
   Les matériaux `_E` sont lumineux (fenêtres, feu, gemmes) : ils ne sont pas ombrés dans le rendu final.
   **Important** : si vous changez une couleur, modifiez aussi la propriété personnalisée `px_hex` du matériau
   (Propriétés ▸ Matériau ▸ Propriétés personnalisées) car c'est elle que lit le rendu pixel art.
3. **Collection `ui_only`** : décor visible seulement sur l'illustration d'interface (sol, arbres…). Elle est masquée
   pour le sprite de carte. Pour les effets, les images clés (position/rotation/échelle) sont dans la timeline : on peut les
   éditer (échelle 0 = objet invisible).
4. Les paramètres de rendu (taille, caméra, échelle) sont dans la propriété personnalisée de la scène `px_renders`
   (ou `px_fx` pour les effets) : JSON modifiable (`w`, `h`, `az`, `el`, `ppu`, `anchor`, `t_dark`, `t_light`, `ss`…).
5. Re-rendre :
   ```
   /opt/bvenv/bin/python blender/rerender.py blender/models/bld_forge_2.blend
   /opt/bvenv/bin/python blender/build_all.py --pack-only
   ```
   Le prévisualiseur Blender (Cycles, Standard) donne une idée de la forme ; l'aspect final (3 teintes, contour #1d1430,
   palette) est appliqué par le post-traitement Python.

## Comment ça marche (chaîne de rendu)

1. Caméra **orthographique** (azimut 20°, élévation 30° : vue 3/4), fond transparent, Cycles CPU.
2. Passe « albédo » (couleurs unies exactes) + passe « ombrage » (diffuse blanc, soleil en haut à gauche, ambiance) :
   on obtient de vraies ombres portées sans bruit de couleur.
3. Suréchantillonnage ×3 à ×8 puis réduction par couleur majoritaire ; ombrage posterisé en 3 teintes
   (ombre froide violacée / base / lumière chaude, comme `sh()` du jeu) ; seuil alpha dur ; contour 1 px `#1d1430`.
4. Effets : matériaux émissifs, alignés sur une palette de 4 à 6 teintes, sans contour.

## Réglages utiles

* Taille de la carte : `PPUS` dans `buildings.py` (unités monde par pixel, par niveau) ; échelle des illustrations : `UPPU`.
* Seuils d'ombrage : `t_dark` / `t_light` dans `add_render(...)`.
* Cadre 9-slice : `ui_panel` (48×48, coins de 12 px) ; `ui_corner`, `ui_divider` (64×8), boutons `ui_button[_alt|_hot]` (48×16).
* Couleur d'un bâtiment : `BLD_COL` dans `common.py` / `buildings.py` et `BLD_INFO` dans `build_all.py`.
