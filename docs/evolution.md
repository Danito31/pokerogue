# Évolution, ingrédients et artisanat

Source : demande du créateur (« évoluer les personnages avec des ingrédients, par exemple un parchemin d'évolution selon les étoiles ; pareil pour les compétences ; crafter les armes/armures et les faire évoluer aussi »), bible §7.4 (compétences niv. 10 puis rareté contre matériaux), §8 (forgeron, minerai, métaux, peaux, matériaux magiques à rareté), §10 (taux d'invocation).
Inspiration : jeux de héros « gacha idle » — chaque palier se mérite, les rangs élevés sont rares, les ressources de bas rang restent utiles (fusion, affinage).

Tout est dans `index.html` (bloc `ÉVOLUTION, INGRÉDIENTS ET ARTISANAT`). Les icônes viennent de `assets/assets.js` (clés ci-dessous) ; une icône absente est dessinée procéduralement (`matSprite`).

## 1. Inventaire : `G.mats`

`G.mats = {clé: nombre}`, sauvegardé avec la partie (clé `tdE5`). Migration : une ancienne sauvegarde (tdE4/tdE5 sans `mats`) reçoit le petit lot de départ ; les clés inconnues ou nulles sont supprimées. Nouvelle partie : 6 minerais, 2 cuirs, 2 bois ouvragés, 1 tissu.

| Groupe (Sac) | Clés | Usage |
|---|---|---|
| Évolution | `mat_parchemin_1..6` (Parchemin d'évolution ★N) | éveil d'un personnage N★ → N+1★ ; ★6 = transcendance d'un 6★ |
| | `mat_pierre_1..6` (Pierre d'éveil ★N) | éveil d'un équipement N★ → N+1★ ; ★6 = transcendance |
| | `mat_fragment` (Fragment de parchemin, icône procédurale) | 10 → 1 parchemin ★1 |
| Compétences | `mat_tome_1..5` (commune → légendaire) | évolution de rareté ; « Étudier » (+2 niveaux) |
| Forge | `mat_minerai`, `mat_lingot`, `mat_mithril`, `mat_cuir`, `mat_tissu`, `mat_bois`, `mat_cristal`, `mat_croc`, `mat_noyau`, `mat_poussiere` | fabrication, affinage, éveil des objets |
| Essences | `mat_essence_feu/glace/foudre/nature/sacre/ombre/arcane` | éveil des personnages de l'élément, élément imposé à la fabrication |

Interface : bouton **Sac** dans le HUD (village et étages), tuiles groupées avec compteur, tuiles vides grisées, fiche détaillée (usage + où le trouver) au toucher, raccourcis vers l'Autel d'éveil et la Forge.

## 2. Sources

### Rang des ingrédients d'évolution selon la profondeur
Poids du rang N : `base[N] × (1 + étage/20)^(N−1)` avec base = 100 / 30 / 8 / 2 / 0,25 / 0,03, et rang débloqué à partir de l'étage 1 / 1 / 3 / 8 / 15 / 25. Les boss tirent comme 10 étages plus bas.

| Étage | ★1 | ★2 | ★3 | ★4 | ★5 | ★6 |
|---|---|---|---|---|---|---|
| 1 | 77 % | 23 % | – | – | – | – |
| 5 | 67 % | 24 % | 8 % | – | – | – |
| 10 | 60 % | 26 % | 11 % | 4 % | – | – |
| 20 | 47 % | 29 % | 15 % | 8 % | 1,7 % | – |
| 30 | 37 % | 28 % | 19 % | 12 % | 3,8 % | 1,2 % |

(mesuré sur 20 000 tirages ; les tomes sont plafonnés au rang 5)

### Tableau des sources
| Source | Gains |
|---|---|
| Combat gagné | par monstre (4 au plus) 40 % (élite/champion 80 %) : gelée → poussière/tissu, loup/chacal → croc/cuir, squelette → minerai/poussière, golem → minerai/noyau, spectre/sporion → tissu/poussière, cristal → cristal/poussière ; +1 si élite, chance +1 croissante avec l'étage. Essence d'un élément du biome : 30 % (50 % élite/gardien), quantité 1 + ⌊étage/12⌋. 15 % : bois ouvragé (biome boisé) ou minerai. Élite : 20 % noyau. |
| Gardien d'étage normal | 35 % : un parchemin/pierre/tome du rang de l'étage |
| Quête (étage ×5) | 1 parchemin + 1 pierre ou tome (rang de l'étage), 50 % noyau ; pacte : ×2 |
| Boss (étage ×10) | 2 parchemins + 1 pierre + 1 tome (rang boss = étage +10), 2 noyaux ; pacte : ×2 |
| Coffre | 55 % : 1–2 matériaux de base (+1 tous les 10 étages) ; 26 % : un ingrédient d'évolution |
| Coffre verrouillé | 1 ingrédient d'évolution (étage +5) + 2 matériaux |
| Tas de bois / pierre / herbes | 35 % bois ouvragé / 35 % 1–2 minerais / 20 % tissu |
| Veine de cristal (pioche) | 1 cristal (2 dès l'étage 15) + 1 poussière |
| Autel (trésor) | 2 essences d'un élément du biome |
| Loi du gel | tous ces gains doublés (comme le reste du butin) |
| Invocation « matériaux » | la part équipement reste 13,13 % ; les 26,26 % restants donnent 4–10 bois, 3–8 pierre, 1–3 matériaux de base, 50 % un matériau de plus, 30 % un parchemin/tome/pierre (★1 80 %, ★2 18 %, ★3 2 %). Totaux de la bible inchangés (39,39 % / 50 / 9 / 1 / 0,5 / 0,1 / 0,01). |
| Démantèlement (Réserve) | or : 5 × ★² + 8 × renfort ; matériau principal de la famille × ★ ; matériau noble ⌊(★−1)/2⌋ dès 3★ ; poussière ★−1 dès 2★ ; pierre d'éveil ★(N−1) dès 3★ ; minerai = niveau de renfort ; pierre ★6 = transcendance |
| Sacrifice (1★ ou 2★ non verrouillé, double confirmation conservée) | 1★ : 40 exp. + 3 fragments + 1 essence de son élément ; 2★ : 120 exp. + 8 fragments + 2 essences |

## 3. Éveil des personnages (Auberge → onglet « Autel d'éveil », fiche, équipe)

Condition : **niveau maximal du rang** (`cap = 10 + 10 × ★ + 5 × transcendance`).

| Éveil | Parchemins | Essence de son élément | Autres | Or |
|---|---|---|---|---|
| 1★ → 2★ | ★1 × 2 | 2 | – | 300 |
| 2★ → 3★ | ★2 × 3 | 4 | cristal 1 | 900 |
| 3★ → 4★ | ★3 × 4 | 6 | cristal 3 | 2 500 |
| 4★ → 5★ | ★4 × 5 | 10 | noyau 2 | 6 000 |
| 5★ → 6★ | ★5 × 6 | 15 | noyau 4, cristal 6 | 15 000 |
| 6★ transcendance ✦1/✦2/✦3 | ★6 × 1/2/3 | 20 | noyau 5 | 25 000 / 50 000 / 75 000 |

Effets : +1★ (niveau max. +10), statistiques de base mises à l'échelle du nouveau rang (même formule que la génération : PV 220+90★, ATQ 26+11★, DEF 16+7★), **une compétence tirée d'office** (même pondération personnalité/sous-traits/race ; doublon = +2 niveaux), **35 %** de chances d'un nouveau sous-trait (si moins de 3 ; profil de croissance recalculé). Transcendance : niveau max. +5, stats de base +4 %. Race, personnalité, élément et équipement conservés. L'ancienne « promotion contre éclats » est remplacée (la fonction `promote` ouvre l'éveil).
Interface : fiche d'éveil (condition, gains chiffrés, ingrédients rouges si manquants, confirmation en deux temps), puis révélation animée (rayons de la couleur de l'élément, flash, étoiles qui s'allument, nouvelle étoile qui tombe, gains et compétence).

### Fusion (Autel d'éveil ; pierres à la Forge)
3 ingrédients ★N → 1 ★N+1 contre N éclats et 100 × N or (parchemins ★1→★6, tomes 1→5, pierres ★1→★6). 10 fragments → 1 parchemin ★1. Les éclats gardent ainsi un usage.

## 4. Compétences

- Niveau 1 → 10 : or (`30 × niveau × (rareté + 1)`, inchangé), ou **Étudier** un tome de la rareté actuelle : +2 niveaux sans or.
- Évolution de rareté au niveau 10 (remplace les éclats) : tome de la rareté **visée** + or, retour au niveau 1, +40 % de puissance par cran.

| Évolution | Tomes | Or |
|---|---|---|
| commune → peu commune | peu commune × 2 | 300 |
| peu commune → rare | rare × 3 | 800 |
| rare → épique | épique × 3 | 2 000 |
| épique → légendaire | légendaire × 4 | 5 000 |

Révélation animée (icône du tome, nouvelle rareté, puissance avant/après).

## 5. Forge

Onglets : **Fabriquer**, **Affiner**, **Éveil**, **Renforcer** (l'ancienne amélioration d'arme, +8 % ATQ par niveau, max 3 × niveau de Forge).

### Recettes (tous les types d'objets)
| Objet | Matériaux | Or | Forge |
|---|---|---|---|
| Épée | lingot 3, cuir 1 | 60 | 1 |
| Hache | lingot 3, bois 1 | 60 | 1 |
| Bouclier | lingot 2, bois 2 | 60 | 1 |
| Dagues | lingot 2, croc 2, cuir 1 | 60 | 1 |
| Arc | bois 3, tissu 1 | 60 | 1 |
| Bâton | bois 2, cristal 1 | 80 | 1 |
| Grimoire | cuir 1, tissu 2, cristal 1 | 90 | 2 |
| Sceptre | lingot 1, cristal 2 | 90 | 1 |
| Luth | bois 3, tissu 1 | 60 | 1 |
| Armure lourde | lingot 5, cuir 1 | 100 | 2 |
| Armure de cuir | cuir 3, tissu 1 | 60 | 1 |
| Cape furtive | tissu 3, cuir 1 | 70 | 1 |
| Robe de mage | tissu 3, cristal 1 | 80 | 1 |
| Potion de soin | poussière 1, vivres 20 | 20 | 1 |
| Élixir d'énergie | poussière 2, cristal 1 | 40 | 1 |
| Torche | bois 1, tissu 1 | 20 | 1 |
| Pioche | bois 1, lingot 1 | 30 | 1 |
| Passe-partout | lingot 2 | 40 | 1 |
| Boussole | lingot 1, cristal 1 | 50 | 1 |
| Sablier de poche | cristal 2, bois 1 | 60 | 2 |
| Relique sacrée | cristal 2, poussière 2 | 90 | 3 |
| Étendard | bois 1, tissu 2 | 50 | 1 |

### Rareté fabriquée
Poids selon le niveau de Forge, puis catalyseurs : **poussière ×2** (bonus +1) et/ou **noyau ×1** (bonus +2) ; poids du rang ★ multiplié par `(1 + 0,2 × bonus)^(★−1)`.

| Forge | 1★ | 2★ | 3★ | 4★ | 5★ | 6★ |
|---|---|---|---|---|---|---|
| niv. 1 | 60 % | 30 % | 9 % | 1 % | – | – |
| niv. 2 | 45 % | 35 % | 15 % | 4 % | 1 % | – |
| niv. 3 | 32 % | 38 % | 21 % | 7,5 % | 1,4 % | 0,1 % |
| niv. 3 + poussière + noyau | 17 % | 32 % | 29 % | 16 % | 4,9 % | 0,56 % |

Vérifié sur 20 000 fabrications par ligne (écart < 0,5 point). **Essence ×2** (arme/armure) : élément imposé ; sinon le hasard habituel de `mkItem`. Un objet 4★+ déclenche la révélation « Chef-d'œuvre ».

### Affinage
| Opération | Entrée | Sortie |
|---|---|---|
| Fondre le minerai | minerai 3 + 10 or | lingot 1 |
| Allier le mithril (Forge 2) | lingot 3 + cristal 1 + 60 or | mithril 1 |
| Ouvrager le bois | bois du village 25 | bois ouvragé 1 |
| Extraire le minerai | pierre du village 30 | minerai 1 |
| Tanner les crocs | croc 3 | cuir 1 |
| Tisser | vivres 25 + 10 or | tissu 1 |
| Condenser la poussière | poussière 4 | cristal 1 |
| Broyer un noyau | noyau 1 | poussière 3 |

### Éveil des équipements
Familles (recettes) : métal → lingot / mithril ; bois → bois / cristal ; cuir → cuir / cristal ; tissu → tissu / cristal ; magie → cristal / noyau ; alchimie → poussière / cristal.

| Éveil | Pierre | Matériau principal | Matériau noble | Autres | Éclats | Or |
|---|---|---|---|---|---|---|
| 1★ → 2★ | ★1 × 1 | 3 | – | – | – | 150 |
| 2★ → 3★ | ★2 × 2 | 5 | – | poussière 1 | 1 | 400 |
| 3★ → 4★ | ★3 × 3 | 4 | 2 | poussière 2 | 2 | 1 000 |
| 4★ → 5★ | ★4 × 4 | 6 | 3 | noyau 1 | 4 | 2 500 |
| 5★ → 6★ | ★5 × 5 | 8 | 4 | noyau 2 | 8 | 6 000 |
| 6★ transcendance ✦1–3 | ★6 × 1/2/3 | – | 6 | noyau 3 | – | 12 000 × rang |

Plafond selon la Forge : niv. 1 → 3★, niv. 2 → 5★, niv. 3 → 6★ et transcendance. Effets : +1★ (stats de l'objet `× (1 + 0,45 × (★−1))`), niveau de renfort conservé, doses des potions augmentées, 25 % de chances de gagner un élément s'il n'en a pas ; transcendance : stats +8 % par rang. Fonctionne sur les objets en réserve comme sur ceux portés. Confirmation en deux temps, révélation animée.

## 6. Équilibrage (intention)
- Un 1★ ramené à 2★ demande ~2 parchemins ★1 (2–4 coffres/gardiens des premiers étages) : premier éveil en une soirée.
- Jeanne (3★ → 4★) demande le niveau 40 et 4 parchemins ★3, disponibles à partir de l'étage 3 mais surtout via quêtes/boss et la fusion (12 ★2 → 4 ★3) : objectif de moyen terme.
- 5★/6★ : ingrédients débloqués aux étages 15 / 25, ~2–4 % et ~1 % des tirages même chez les boss ; la fusion (3 → 1) offre une voie lente mais sûre.
- L'or des coûts suit le gain par étage (≈ 500 or à l'étage 10, ≈ 1 000 à l'étage 20).
- La fabrication rend surtout du 1★–2★ : elle sert à combler un emplacement et à produire des pierres via le démantèlement des 3★+, sans concurrencer les objets de boss.
