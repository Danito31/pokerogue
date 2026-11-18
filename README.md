# Dungeon Setlers

Jeu web (page `index.html` + `css/` + `js/`) : village à construire, invocations de héros, ascension d'une tour étage par étage, combats au tour par tour.

## Lancer
Ouvrir `index.html` dans un navigateur (ou `python3 -m http.server` puis http://localhost:8000).

## Graphismes
Les modèles 3D sont faits avec Blender et rendus en sprites pixel art : voir `blender/` (scripts) et `assets/` (rendus).

## Organisation du code
```
index.html          page (HTML du jeu) ; charge css/style.css puis les scripts
css/style.css       toute la feuille de style
assets/assets.js    images Blender embarquées (chargé AVANT les scripts du jeu)
js/data.js          fusion ASSETS, données : éléments, rôles, races, BLD, objets, lois de la Tour, talents
js/state.js         état G (nouvelle partie), objets, raretés
js/personality.js   personnalités, sous-traits, réserve de compétences, relations de base
js/progression.js   classes, sous-classes, spécialisations, niveaux, arbre, paliers, relations, codex
js/evolution.js     évolution, ingrédients, artisanat (Forge), Sac, Autel d'éveil
js/buildings.js     métiers, postes, bâtiments (Hôtel de ville, entrepôt, bibliothèque, marché, labo), production, sauvegarde/migrations
js/art.js           pixel art : personnages, monstres, décor, bâtiments, icônes
js/village.js       moteur (boucle, entrées, panneaux), village, invocation, HUD, panneaux du village
js/sheet.js         fiche personnage à onglets, arbre, codex des personnalités, portail
js/tower.js         étages de la Tour, patrouilles, butin
js/battle.js        combat au tour par tour, objets, lois, effets animés
js/combat.js        techniques, ultimes, sous-classes en combat
js/intro.js         intro BD, création du héros, roue des talents, dialogue d'accueil
js/galaxy.js        galaxie solo : planètes PNJ, fournisseur GP (remplaçable par un serveur), carte, voyages, commerce, exploration (docs/galaxie.md)
js/raids.js         pillage, capture (extrêmement rare), Cachots, raids PNJ contre le village et défense
js/hero.js          héros : créateur gratuit, Miroir et cosmétiques (G.cosm), classe de départ et aptitude à la magie, mort définitive = fin de partie (docs/intro.md §4)
js/gacha.js         Tirage du destin (rouleaux personnalité/race à la création), Tour des modifications (relances), onglet Code (docs/codes.md)
js/talents.js       effets de l'héritage racial du héros, des personnalités secrètes et des talents innés supplémentaires (enveloppes)
js/rules.js         règles de la Tour propres à chaque partie (G.run : lois, biomes, modificateurs d'étage ; étages 1–3 fixes), échelle des monstres, affixes d'élite, IA ennemie, phases de boss, danger affiché, PV conservés entre étages (docs/equilibrage.md §10)
js/main.js          démarrage (boot) : toujours en dernier
```

### Lancer
Ouvrir `index.html` directement dans le navigateur (fonctionne en `file://`).

### Règle de jeu capitale
**Le héros peut mourir définitivement. S'il meurt, c'est la fin de la partie** : la sauvegarde est archivée (`tdE6_fin`) et seule une nouvelle partie est possible. Le risque (en %) est affiché avant chaque combat, pillage, poste de garde et choix risqué.

**Tirage du héros** : personnalité et race tirées à des rouleaux façon gacha (taux affichés, palier secret 0,01 %), relançables plus tard à la Tour des modifications contre des jetons (codes, quêtes) — même résultat : l'expérience reste, sinon retour au niveau 1 (docs/intro.md §7-8, docs/codes.md).

**Héros du joueur** : création de l'avatar gratuite, cosmétiques supplémentaires achetés au Miroir ; classe de départ au choix après la roue des talents — les classes magiques (ensorceleur, soigneur) exigent un talent à aptitude magique, et sans elle le héros ne manie jamais bâton, grimoire ni sceptre.

### Règles
- **Scripts classiques uniquement** (`<script src="js/xx.js"></script>`), pas de modules ES : ils échouent en `file://`.
- Tous les fichiers partagent la portée globale, comme l'ancien script unique : `const`/`let`/`function` de haut niveau sont visibles partout. Chaque fichier commence par `'use strict';`.
- **L'ordre de chargement compte** (voir `index.html`) : un fichier ne doit pas exécuter, au niveau supérieur, du code qui appelle une fonction ou lit une constante définie dans un fichier chargé plus tard. Le code de démarrage reste dans `js/main.js`, chargé en dernier.
- Pour ajouter un fichier : créer `js/xx.js` et ajouter sa balise `<script>` à la bonne place dans `index.html`.
