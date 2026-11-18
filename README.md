# La Tour des Étoiles

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
js/main.js          démarrage (boot) : toujours en dernier
```

### Lancer
Ouvrir `index.html` directement dans le navigateur (fonctionne en `file://`).

### Règles
- **Scripts classiques uniquement** (`<script src="js/xx.js"></script>`), pas de modules ES : ils échouent en `file://`.
- Tous les fichiers partagent la portée globale, comme l'ancien script unique : `const`/`let`/`function` de haut niveau sont visibles partout. Chaque fichier commence par `'use strict';`.
- **L'ordre de chargement compte** (voir `index.html`) : un fichier ne doit pas exécuter, au niveau supérieur, du code qui appelle une fonction ou lit une constante définie dans un fichier chargé plus tard. Le code de démarrage reste dans `js/main.js`, chargé en dernier.
- Pour ajouter un fichier : créer `js/xx.js` et ajouter sa balise `<script>` à la bonne place dans `index.html`.
