# Mages, recherches magiques et six nouveaux bâtiments

Sources : bible §4 (bâtiments), §8 (métiers), §9 (mages et recherches), §16 (bateau montgolfier), §17 (défense) ; `docs/metiers.md`.
Code : `js/buildings2.js` (bâtiments, bateau, effets en expédition et en combat) et `js/mages.js` (recherches des mages), chargés juste avant `js/main.js`. Toutes les valeurs ci-dessous sont celles du code.

## 1. Village : six terrains de plus

La carte est élargie de 8 tuiles (38 → 46 de large) : les anciens terrains sont décalés de 64 px vers l’est et deux colonnes de trois terrains s’ajoutent à l’ouest et à l’est (`G.plots[11..16]`).

| Hôtel de ville | niv. 1 | niv. 2 | niv. 3 |
|---|---|---|---|
| Terrains supplémentaires ouverts | 1 | 2 | 6 |
| Total des terrains (hors site de l’Hôtel de ville) | 9 | 12 | 16 |
| Nouveaux bâtiments | Taverne | + Écurie, Sanctuaire | + Tour de mage, Remparts, Chantier naval |

À l’Hôtel de ville niv. 3, chaque bâtiment a son terrain (16 bâtiments, 16 terrains). Niveau max. : comme les bâtiments récents (= niveau de l’Hôtel de ville). Exceptions : **Remparts niv. 3** demandent la recherche *Fortification* ; le **Chantier naval** ne se construit qu’après l’étage 20 (`G.ballon`).

| Bâtiment | c₀ (bois) | c₁ (pierre) | g (or) | Postes |
|---|---|---|---|---|
| Taverne | 90 | 40 | 250 | Cuisinier |
| Écurie | 110 | 40 | 300 | Éleveur |
| Sanctuaire | 60 | 140 | 400 | fidèles : mages sacrés et personnages d’élément Sacré |
| Tour de mage | 80 | 160 | 500 | tout mage |
| Remparts | 60 | 220 | 400 | gardes : tout personnage niv. 5+ |
| Chantier naval | 200 | 120 | 600 | Architecte, Forgeron |

Même formule de coût que `docs/metiers.md` (bois/pierre × niveau, or × (niveau − 1), réduction des Architectes). Un poste par niveau.

## 2. Taverne
**Repas** (un plat actif, `G.mg.meal`, s’ajoute au repas automatique de l’Auberge) :

| Plat | Niv. | Coût | Effet de base | Combats |
|---|---|---|---|---|
| Ragoût du chasseur | 1 | 20 vivres, 4 viandes | ATQ +8 % | 4 |
| Soupe de racines | 1 | 40 vivres, 1 poussière | DEF +10 % | 4 |
| Brochettes épicées | 2 | 3 viandes, 2 crocs, 30 or | VIT +4, Crit. +5 % | 5 |
| Infusion sylvestre | 2 + *Sève vive* | 30 vivres, 2 poussières | PV +10 %, soin 5 % après chaque victoire | 5 |
| Festin des étoiles | 3 | 60 vivres, 6 viandes, 1 cristal, 100 or | ATQ/DEF/PV +10 % | 6 |

Cuisiniers en poste à la taverne (R = somme des rangs) : effets × (1 + min(0,6 ; 0,1 × R)), +⌊R/2⌋ combats (max. +3) ; Chef étoilé : ingrédients ÷ 2. Un combat (gagné, perdu ou fui) consomme une charge.

**Rumeurs** : 20 + 5 × `G.max` or ; décrivent l’étage `G.max` (le prochain à franchir) : loi et son effet, région, boss ou quête, outil conseillé. Taverne niv. 2 : 25 % de la carte révélés à l’entrée ; niv. 3 : la quête est annoncée. Valable une visite (`G.mg.rum`).

**Aventurier de passage** : un par tranche de 2 h réelles. Étoiles : niv. 1 : 2★ 70 % / 3★ 30 % ; niv. 2 : 2★ 50 / 3★ 40 / 4★ 10 ; niv. 3 : 3★ 60 / 4★ 32 / 5★ 8. 8 % de mages. Prix : 150 × ★² or (4★ = 2 400). Place à l’Auberge requise.

## 3. Écurie (montures)
| Monture | Niv. | Adoption | Effets (si soins ≥ 25) |
|---|---|---|---|
| Poney des steppes | 1 | 200 or, 60 vivres | déplacement +15 % (`F.mont`), VIT +2 |
| Destrier de guerre | 2 | 600 or, 4 cuirs, 100 vivres | +15 %, VIT +4, ATQ +3 % |
| Griffon | 3 + *Langage des bêtes* | 1 500 or, 2 cristaux, 6 viandes | +15 %, VIT +6, ATQ +5 %, Crit. +3 % |

Soins (`G.mg.care`, 0–100) : chaque étage coûte max(3, 12 − 2 × R éleveurs) points (÷ 2 avec *Langage des bêtes*) ; récupération +4 × niveau + 3 × R par heure ; foin (40 vivres) +25, ration (3 viandes) +50, panser (gratuit, toutes les 30 min) +10.

## 4. Sanctuaire
Bénédictions en temps réel (prolongeables, `G.mg.bless`) :

| Bénédiction | Niv. | Coût | Effet |
|---|---|---|---|
| Fortune | 1 | 200 or | or gagné dans la Tour +25 % (`addLoot`) |
| Astres | 2 | 300 or, 2 poussières | après chaque victoire, 40 % : 1 essence d’un élément de l’étage |
| Égide sacrée | 2 + *Bénédictions* | 300 or, 1 essence sacrée | DEF +8 %, PV +5 % |
| Lumière des étoiles | 3 | 600 or, 2 essences sacrées | ATQ +6 %, PV +5 % après chaque victoire |

Durée : 30 min × (1 + 0,25 × (niv. − 1)) × (1 + 0,15 × fidèles) × 1,25 *Bénédictions* × 1,5 *Boucle temporelle*. Fidèles (un mage sacré compte double) : or −10 % chacun (max. 30 %). **Prière** gratuite toutes les 8 h : +1 essence sacrée, +20 min de Fortune.
**Éveil des personnages** (`cEvoCost`) : or −(5 + 5 × niv.) % ; niv. 2+ : essences −10 % ; *Rite d’éveil* : or −10 %, essences −20 % de plus.

## 5. Remparts
Défense = (base 100 / 250 / 500 + puissance des gardes) × (1 + 0,1 *Fortification* + 0,2 *Glyphes* + 0,3 *Bouclier de ville*). Garde : niveau × étoiles × 2 (×1,5 Gardien, ×1,5 *Bouclier de ville*). Valeur stockée dans `G.mg.def` pour les raids de la galaxie (bible §17, à venir).

## 6. Chantier naval et bateau (bible §16)
`G.ship = {stage, q, mods, pilot, ready}`. Étapes (temps réel, une à la fois) :

| # | Étape | Chantier | Recherches | Coût | Durée |
|---|---|---|---|---|---|
| 1 | Quille et coque | 1 | – | 600 bois, 200 pierre, 10 bois ouvragés, 10 minerais | 20 min |
| 2 | Nacelle | 1 | Cartes célestes | 400 bois, 12 cuirs, 8 tissus, 4 lingots | 30 min |
| 3 | Enveloppe du ballon | 2 | – | 1 500 or, 30 tissus, 10 cuirs | 1 h |
| 4 | Gréement et voilure magiques | 2 | Aérostatique | 2 500 or, 10 lingots, 6 cristaux, 3 essences de foudre | 1 h 30 |
| 5 | Cœur arcanique | 3 | Navigation stellaire, Cœur arcanique | 4 000 or, 3 noyaux, 2 mithrils, 5 essences arcaniques | 3 h |

Durée × (1 − min(0,4 ; 0,08 × R architectes + forgerons au chantier)) × 0,75 *Accélération*. Étape 5 faite + **pilote mage** (`G.ship.pilot`) → **Baptême** (`G.ship.ready = 1`). Le voyage entre planètes reste à faire.

Modules (§16.3), niveaux 1–3, après la Nacelle, niveau ≤ niveau du Chantier ; coût niv. n : 600 × n or + 4 × n d’un matériau propre (+ 2 × (n − 1) cristaux, + 1 noyau au niv. 3) :

| Module | Valeurs niv. 0–3 | Recherches niv. 1 / 2 / 3 |
|---|---|---|
| Soutes (stockage) | 100 / 300 / 600 / 1 200 | – / – / Aérostatique |
| Hélices et voilure (vitesse) | ×1 / 1,25 / 1,5 / 2 | Cartes célestes / Maîtrise des vents / Accélération |
| Bouclier magique (protection) | 0 / 100 / 250 / 500 | Fortification / Sceaux / Glyphes |
| Longue-vue astrale (détection) | portée 1 / 2 / 3 / 5 | Cartes / Aérostatique / Navigation stellaire |
| Voile de camouflage | 0 / 20 / 40 / 60 % | Voile d’ombre / Voile d’ombre / Pacte du néant |
| Grappins de pillage | 0 / 10 / 20 / 35 % | – / Fortification / Pacte du néant |

Bonus du pilote selon son domaine (§16.2) : Arcanique protection +20 %, Temporelle vitesse +20 %, Élémentaire détection +1, Obscure camouflage +10 ; Naturelle et Sacrée : bonus de voyage notés « à venir ». *Navigation stellaire* : vitesse +10 %.

## 7. Mages et recherches (bible §9)
Un mage (`c.mage` = domaine, 1 % des invocations) s’obtient aussi par l’**aventurier de passage** (8 %) ou l’**Appel aux mages** de la Tour : 800 or, 2 cristaux, 1 essence arcanique, toutes les 12 h, mage garanti (1★ 40 %, 2★ 40 %, 3★ 17 %, 4★ 3 %), domaine au hasard.

Chaque mage en poste à la Tour mène **une** recherche (`G.mrs.run`) ; elle n’avance que pendant qu’il travaille (en poste, ni blessé ni dans l’équipe), jeu fermé compris. Rang de recherche ≤ niveau de la Tour.

**Durée** (la bible cite « par exemple 24 h » ; ramené à des durées jouables) : rang I 30 min, II 1 h 30, III 4 h, × (1 − 0,06 × (★ − 1)) × domaine (0,7 dans son domaine ; 0,85 pour la navigation par un mage arcanique ou temporel, pour la défense par un mage sacré ou élémentaire) × (1 − 0,004 × niveau) × 0,9 *Sablier des mages* × 0,75 inspiration ; plancher 0,25.
**Résultat** : à la fin, exp. de métier +30 et exp. 25 × rang² au mage ; **percée** (4 % par ★, +10 % dans son domaine, max. 50 %) : moitié de l’or rendue et inspiration (prochaine recherche −25 %).
**Coûts** : domaines : I 400 or + 2 essences, II 1 200 or + 4 essences + 2 cristaux, III 3 000 or + 6 essences + 2 noyaux (essence : arcane, nature, feu pour Élémentaire, sacrée, ombre pour Obscure, glace pour Temporelle) ; navigation : 500 or + 4 tissus + 2 cristaux / 1 500 or + 4 lingots + 3 cristaux / 4 000 or + 2 mithrils + 2 noyaux ; défense : 500 or + 300 pierre / 1 500 or + 6 lingots / 4 000 or + 3 mithrils.

| Domaine (icône) | I | II | III |
|---|---|---|---|
| Arcanique (`rs_arcane`) | Flux arcanique : Bibliothèque −10 % | Sceaux de stabilisation : DEF +4 %, Bouclier 2 | Cœur arcanique : étape 5 |
| Naturelle (`rs_nature`) | Sève vive : Ferme +10 %, Infusion sylvestre | Langage des bêtes : Griffon, soins ÷2 | Grande floraison : Ferme +15 %, Chasse +15 % |
| Élémentaire (`rs_elementaire`) | Affinité : ATQ +4 % | Maîtrise des vents : Hélices 2 | Tempête domptée : ATQ +6 % |
| Sacrée (`rs_sacre`) | Bénédictions : Égide, durée +25 % | Lumière guérisseuse : PV +4 % après victoire | Rite d’éveil : éveil moins cher |
| Obscure (`rs_obscur`) | Voile d’ombre : Crit. +4 %, Camouflage 1–2 | Malédiction : ennemis DEF −6 % | Pacte du néant : or +15 %, Camouflage 3, Pillage 3 |
| Temporelle (`rs_temporel`) | Sablier des mages : Tour −10 % | Accélération : Chantier −25 %, Hélices 3 | Boucle temporelle : VIT +4, bénédictions ×1,5 |
| Navigation (`rs_navigation`) | Cartes célestes : étape 2, modules niv. 1 | Aérostatique : étape 4, Soutes 3 | Navigation stellaire : étape 5, vitesse +10 % |
| Défense (`rs_defense`) | Fortification : Remparts 3, défense +10 % | Glyphes de garde : +20 % | Bouclier de ville : +30 %, gardes ×1,5 |

La table est copiée dans `MAGE_RS` (accroche de la Bibliothèque) ; la Bibliothèque affiche le compte des recherches magiques et renvoie à la Tour.

## 8. Accroches dans le code
Aucune modification de `battle.js` / `tower.js` : `js/buildings2.js` enveloppe `battleStart` (bonus d’équipe appliqués aux unités avant le calcul du combat ; DEF ennemie), `fight` (charge de repas, soins après victoire, essence des Astres), `addLoot` (or), `expStart` (monture, rumeur, messages de départ), `enterFloor` (`F.mont`), `cEvoCost` (éveil) et `vRefresh` ; `js/mages.js` enveloppe `rsMul`. Horloge propre `mgTick` (1 s) : soins de l’écurie, production naturelle, chantier, fin des bénédictions, recherches, `G.mg.def`.

## 9. Sauvegarde
Clé `tdE6` inchangée. Migration idempotente `mgMigrate` (drapeau `G.v_mages`, appelée par `mgBoot` depuis `js/main.js`) : copie `tdE6_vm_bak`, `G.plots` porté à 17 cases (bâtiments existants inchangés), `G.mg`, `G.ship`, `G.mrs` créés. `mgEnsure` complète l’état à chaque accès (nouvelle partie comprise).
