# Équilibrage — simulation longue de la partie

Banc d'essai : `tools/playtest.js` (Node + Playwright, Chromium headless). Il joue une partie neuve du premier clic à l'étage 40–47 en appelant les fonctions du jeu (`page.evaluate`) : bâtiments, invocations, postes de métier, équipement, éveils, Forge, recherches, repas, montures, bénédictions, marché, fusions, Tour étage par étage en combat automatique, événements, blessures, et (option `--cheatship`) bateau, commerce, exploration, pillage.

Lancer : `NODE_PATH=$(npm root -g) node tools/playtest.js --seed 21 --policy equilibre --days 100 --floor 60 --out /tmp/log.json`.

## 1. Méthode et limites

- **Horloge virtuelle** (`Date.now` simulé, `Math.random` à graine) : une partie est reproductible. Chaque action coûte un temps forfaitaire (≈ 3 s par tour d'allié, 45 s d'entrée d'étage, 90 s par passage au village…). Un étage complet ≈ 4–5 min de jeu actif.
- **Production hors ligne** : seuls les minuteurs horodatés (recherches, blessures, bateau) avancent onglet fermé ; vivres, Chasse, métiers ne produisent que « onglet ouvert » (`vTick` plafonne à 60 s). Les politiques simulent 0 à 6 h/jour d'onglet ouvert.
- **Politiques** : `equilibre` (3 séances de 40 min/jour, +3 étages au-dessus du niveau conseillé, farme si échec), `prudent` (1 séance de 60 min, +1), `intensif` (4 séances de 45 min, +8, choix « forcer » après blessure), `imprudent` (monte toujours à l'étage max sans reculer : mesure la mortalité), `fragments` (farm d'invocations + sacrifices quand l'or déborde).
- **Limites** : déplacements remplacés par des téléportations sur les cibles (pas de patrouilles qui poursuivent, de tempête de sable ni de foudre), 50 % des combats ouverts « avantage », une équipe soignée à chaque entrée d'étage (comme dans le jeu), choix d'événements par un score de risque simple, bateau/galaxie exercés surtout via `--cheatship` (le bot ne recrute presque jamais de mage : voir §6).
- Séries : avant = code d'origine (commit 7a7a60df + banc), après = code corrigé. Mêmes graines et politiques : `equilibre` 21/22, `prudent` 23, `intensif` 24, `imprudent` 25, `fragments` 26, galaxie 27 (bateau donné au jour 6).
- **Zéro erreur console / page** sur l'ensemble des parties (≈ 60 000 combats, 14 séries avant/après), avec et sans galaxie.

## 2. Courbe de progression (étage maximal en fonction du temps)

#### before

| Partie | j1 | j5 | j10 | j20 | j30 | j50 | j75 | j100 | Étage final | Jeu actif (h) |
|---|---|---|---|---|---|---|---|---|---|---|
| equilibre_21 | 10 | 22 | 22 | 28 | 32 | 32 | 42 | 42 | 42 (j100) | 222,5 |
| equilibre_22 | 12 | 19 | 25 | 25 | 28 | 32 | 37 | 42 | 42 (j100) | 228,8 |
| equilibre_27 | 14 | 19 | 22 | 28 | 32 | — | — | — | 32 (j40) | 95,1 |
| fragments_26 | 13 | 22 | 25 | 28 | 32 | 32 | — | — | 32 (j70) | 162,6 |
| imprudent_25 | 20 | 40 | 40 | 40 | 40 | — | — | — | 40 (j30) | 28,2 |
| intensif_24 | 20 | 27 | 30 | 33 | 37 | 42 | 42 | 47 | 47 (j100) | 324,3 |
| prudent_23 | 7 | 17 | 17 | 17 | 23 | 23 | 27 | — | 30 (j80) | 85,9 |

| Partie | 1er ★3 | 1er ★4 | 1er ★5 | 1er ★6 | équipe entière ★4 | ★5 | ★6 |
|---|---|---|---|---|---|---|---|
| equilibre_21 | j2 | j3 | j11 | j34 | j11 | j28 | j74 |
| equilibre_22 | j2 | j3 | j7 | j26 | j10 | j35 | j97 |
| equilibre_27 | j2 | j4 | j12 | — | j11 | j28 | — |
| fragments_26 | j1 | j3 | j6 | j44 | j8 | j30 | — |
| imprudent_25 | j1 | j2 | — | — | — | — | — |
| intensif_24 | j1 | j3 | j8 | j32 | j9 | j24 | j76 |
| prudent_23 | j2 | j7 | j33 | — | j29 | j75 | — |

| Partie | Or gagné (butin) | Or marché | Or final | Éclats finaux | Morts | Blessures | Combats | Erreurs bot / console |
|---|---|---|---|---|---|---|---|---|
| equilibre_21 | 5369 k | 1018 k | 4588 k | 2925 | 0 | 85 | 12146 | 0 / 0 |
| equilibre_22 | 4211 k | 915 k | 3128 k | 1869 | 0 | 103 | 12960 | 0 / 0 |
| equilibre_27 | 1334 k | 134 k | 189 k | 1989 | 0 | 1 | 5044 | 0 / 0 |
| fragments_26 | 2917 k | 662 k | 2244 k | 237 | 0 | 0 | 9124 | 0 / 0 |
| imprudent_25 | 75 k | 6 k | 0 k | 70 | 46 | 487 | 602 | 0 / 0 |
| intensif_24 | 8191 k | 1739 k | 7046 k | 3763 | 0 | 123 | 17538 | 0 / 0 |
| prudent_23 | 1062 k | 151 k | 678 k | 1515 | 0 | 1 | 4468 | 0 / 0 |

#### after

| Partie | j1 | j5 | j10 | j20 | j30 | j50 | j75 | j100 | Étage final | Jeu actif (h) |
|---|---|---|---|---|---|---|---|---|---|---|
| equilibre_21 | 13 | 19 | 25 | 28 | 28 | 32 | 37 | 37 | 37 (j100) | 230,6 |
| equilibre_22 | 13 | 19 | 22 | 28 | 32 | 37 | 37 | 42 | 42 (j100) | 232,3 |
| imprudent_25 | 20 | 33 | 33 | 33 | 33 | — | — | — | 33 (j30) | 22,4 |
| intensif_24 | 19 | 27 | 33 | 42 | 42 | 47 | 47 | — | 47 (j81) | 264,9 |
| prudent_23 | 7 | 11 | 17 | 17 | 26 | 30 | 30 | — | 30 (j80) | 86,8 |

| Partie | 1er ★3 | 1er ★4 | 1er ★5 | 1er ★6 | équipe entière ★4 | ★5 | ★6 |
|---|---|---|---|---|---|---|---|
| equilibre_21 | j1 | j7 | j10 | j37 | j9 | j32 | — |
| equilibre_22 | j2 | j9 | j11 | j26 | j11 | j25 | j85 |
| imprudent_25 | j1 | — | — | — | — | — | — |
| intensif_24 | j1 | j5 | j7 | j17 | j6 | j19 | j41 |
| prudent_23 | j6 | j22 | j27 | — | j27 | j41 | — |

| Partie | Or gagné (butin) | Or marché | Or final | Éclats finaux | Morts | Blessures | Combats | Erreurs bot / console |
|---|---|---|---|---|---|---|---|---|
| equilibre_21 | 3955 k | 862 k | 3050 k | 2550 | 0 | 57 | 12839 | 0 / 0 |
| equilibre_22 | 4018 k | 1028 k | 3077 k | 1042 | 0 | 101 | 13285 | 0 / 0 |
| imprudent_25 | 45 k | 7 k | 0 k | 54 | 22 | 318 | 563 | 0 / 0 |
| intensif_24 | 4956 k | 1532 k | 3879 k | 121 | 0 | 91 | 14543 | 0 / 0 |
| prudent_23 | 707 k | 240 k | 447 k | 522 | 0 | 0 | 4636 | 0 / 0 |

Lecture :
- **Avant** (équilibre) : étage 22 au jour 5 (≈ 10 h de jeu), 28 au jour 20, 32 au jour 30–50, 42 au jour 100. Le début est très rapide, puis un long plateau aux étages 28–32 (éveil 4★→5★→6★).
- Cible `docs/progression.md` §1.3 (niv. 30 → étage 15 en 1 semaine, niv. 40 → 21 en 2 semaines, niv. 50 → 28 en 3–4 semaines, niv. 60 → 38 en 1–2 mois) : les bandes basses sont franchies **2 à 7× trop vite** (équipe 4★ au jour 10 au lieu de la semaine ≈ 25), les bandes hautes sont **dans la cible** (équipe 5★ jour 25–35, 6★ jour 75–97).

## 3. Combat : TTK et survie (cibles §11 : TTK 2–5, survie 15–35)

TTK = attaques de base d'un personnage pour tuer un monstre normal ; survie = coups de monstre normal avant de tomber (moyennes de l'équipe, formules de `mkFoe`/`stats`). Parties `equilibre` 21 et 22, avant :

(before_equilibre_21.json, before_equilibre_22.json ; 2738 passages)
| Étages | Passages | Niveau médian | ★ médian | TTK (attaques/monstre) | Survie (coups) | Tours de combat (équipe) | Or/passage | Blessures/100 passages |
|---|---|---|---|---|---|---|---|---|
| 1–5 | 10 | 8,5 | 1,8 | 2,5 | 23,1 | 0,6 | 412 | 0 |
| 6–10 | 16 | 17,8 | 2 | 4 | 33,6 | 1,1 | 839 | 6,3 |
| 11–15 | 15 | 25,8 | 2,8 | 4,3 | 30,3 | 1 | 2652 | 0 |
| 16–20 | 89 | 32,5 | 3,3 | 5,9 | 31,7 | 0,8 | 1820 | 5,6 |
| 21–25 | 439 | 42,5 | 4,3 | 5,5 | 54,9 | 0,4 | 2329 | 5,9 |
| 26–30 | 217 | 47,5 | 4,8 | 6,1 | 64,6 | 0,7 | 2726 | 7,8 |
| 31–35 | 805 | 52,5 | 5,3 | 7,5 | 132,4 | 1,3 | 3251 | 7,6 |
| 36–40 | 758 | 55 | 5,5 | 11,3 | 107,6 | 0,4 | 3886 | 6,6 |
| 41–45 | 389 | 60 | 6 | 8,5 | 98,7 | 0,8 | 5148 | 7,2 |

Après :

(after_equilibre_21.json, after_equilibre_22.json ; 2843 passages)
| Étages | Passages | Niveau médian | ★ médian | TTK (attaques/monstre) | Survie (coups) | Tours de combat (équipe) | Or/passage | Blessures/100 passages |
|---|---|---|---|---|---|---|---|---|
| 1–5 | 10 | 7,8 | 1,5 | 2,7 | 23,5 | 0,7 | 425 | 10 |
| 6–10 | 11 | 17,5 | 2 | 3,6 | 32,3 | 1 | 615 | 9,1 |
| 11–15 | 19 | 25 | 2,5 | 4 | 31,5 | 1 | 1822 | 5,3 |
| 16–20 | 148 | 30 | 3 | 6,4 | 28,2 | 1,2 | 1208 | 7,4 |
| 21–25 | 220 | 42,5 | 4,3 | 5,2 | 57,6 | 0,6 | 1595 | 5,9 |
| 26–30 | 380 | 47,5 | 4,8 | 5,3 | 62,2 | 0,5 | 2092 | 6,3 |
| 31–35 | 713 | 52,5 | 5,3 | 6,3 | 108,5 | 1,3 | 2572 | 7 |
| 36–40 | 1116 | 55 | 5,5 | 10,5 | 105,4 | 0,4 | 3343 | 3,9 |
| 41–45 | 226 | 60 | 6 | 8,6 | 122,1 | 0,4 | 3691 | 6,2 |

- Dans la cible jusqu'à l'étage ~20 ; ensuite **TTK 5–11 et survie 50–130** : l'équipe, tenue au niveau conseillé +3, reste très au-dessus du plafond de dégâts des monstres. **100 % de victoires sur 3 300 passages** en jeu normal ; le combat n'est un obstacle qu'en cas de retard de ★ (voir §4).
- Combats de groupe : 0,4–1,3 « tour » d'équipe (4 alliés) : la plupart des groupes tombent avant que tout le monde ait joué.

## 4. Mortalité, blessures

| Politique | Passages | Blessures | Morts définitives |
|---|---|---|---|
| equilibre / prudent / intensif (avant) | ≈ 3 100 | ≈ 0,07 /passage | **0** |
| imprudent (avant) | 250 (96 % de déroutes à partir de l'étage 35) | 487 | **46** |
| imprudent (après) | 563 combats | 318 | **22** |

- Joué normalement, la **mort définitive n'arrive jamais** (blessures ≈ 7 pour 100 passages, quasi toutes légères) : l'Infirmerie et les 4 niveaux de blessure sont vécus comme du flavor.
- Joué trop haut (3★ niv. 30 aux étages 35–40, soit ≈ 20 étages au-dessus du conseillé), une défaite en entraîne d'autres : l'équipe de remplacement est plus faible, **spirale de mort** (46 morts en 10 jours). Pas de changement (risque voulu), mais il n'y a pas de filet : voir §7.
- Les choix « porter / renvoyer / forcer » ont été très rares (≈ 1 % des passages).

## 5. Économie

- **Sources d'or** (avant, equilibre) : butin de la Tour 4,2–5,4 M par partie de 100 jours (≈ 80 %), vente de surplus au Marché ≈ 1 M, démantèlement négligeable. Or par passage : ≈ 410 (étage 1–5), 840 (6–10), 1 800 (16–20), 3 200 (31–35), 5 100 (41–45) — **environ 2× la cible §11.7** (≈ 500 à l'étage 10, 1 000 à l'étage 20).
- **Puits d'or** : or final 3–7 M non dépensé. Les puits réels (bâtiments ≈ 10 k, éveils ≈ 100 k par équipe, fusions 100×N, modules du bateau, compétences) pèsent < 10 % des revenus. L'or n'est une contrainte que les 4–5 premiers jours.
- **Or → progression** : la chaîne Marché (parchemins/tomes/pierres ★1–2) + Fusion (3→1, N éclats, 100×N or) transforme l'or en ingrédients ★3–4 ; c'est ce qui rend les éveils 2★–4★ rapides (1er 4★ au jour 3).
- **Ressources de base saturées** : vivres au plafond dès le jour ≈ 21, bois jour ≈ 41–48, pierre jour 26–75 (plafonds Entrepôt). Les matériaux de Forge et essences plafonnent aussi (≈ 375–430 chacun) : noyaux, mithril, essences, cristaux sont produits 10× au-delà des besoins. Les éclats d'étoile s'accumulent (1 000–3 700 non utilisés).
- **Goulot réel** : parchemins ★4–★5 (éveils 4★→5★ et 5★→6★), pas l'or ni l'expérience (le Camp + les combats donnent 3 000 exp./étage, le niveau plafonne bien avant l'éveil).

## 6. Fonctions peu ou pas utilisées, exploits, bugs

- **Galaxie/bateau inaccessibles en jeu normal** : les 3 parties `equilibre` n'ont jamais bâti le bateau. Cause : l'Auberge (12 places max.) déborde de 3★+ (sauvetages VIP, éveils) qu'on ne peut pas sacrifier ; l'`Appel aux mages` refusait donc toute place (et 1 % de mages à l'invocation). Corrigé (§8). Avec bateau donné (série 27) : 82 voyages, 920 achats, 72 explorations, 26 pillages, 0 mort, 0 erreur.
- Peu utilisés : Laboratoire (14 brassages en 100 jours — potions rarement utiles car PV remis à chaque étage), montures (2 achats), rumeurs de la Taverne, Remparts niv. 3.
- **Exploits / contournements** : (a) Marché + Fusion = achat d'ingrédients ★ à l'or (voir §5) ; (b) Camp d'entraînement alimenté par des vivres débordants = exp. gratuite ; (c) vente massive de surplus au Marché (≈ 100 000 unités/partie) = or sans limite ; (d) farm « fragments » (invocation 50 or + sacrifice : 3–8 fragments) : mesuré, **pas plus rapide** que le jeu normal (étage 32 au jour 30 dans les deux cas) car limité par la capacité de l'Auberge ; (e) `forge(id)` n'avait pas de plafond de niveau d'arme côté code (seule l'interface bloquait) — corrigé.
- **Bugs corrigés** : onglets de la Forge masqués sous l'en-tête collant ; 5 et 8 confondus en police pixel ; rapport de défaite de raid listant chaque matériau.

## 7. Problèmes restants (non corrigés)

1. Or en excédent massif et sans puits tardif (propositions : achats d'ingrédients ★3+ au Marché à prix élevé, mercenaires, décoration du village).
2. Début de partie encore 2–4× plus rapide que la cible §1.3 (palier 20→40 franchi en 10 jours au lieu de 3 semaines) ; plateau 5★→6★ de 30–60 jours.
3. Matériaux de Forge saturés : revoir les taux de butin des matériaux de base/essences plutôt que les plafonds.
4. Aucune protection contre la spirale de mort (équipe de remplacement faible après une défaite) ; la mort n'a aucun poids pour un joueur prudent.
5. Capacité d'Auberge (12) sans moyen de renvoyer un 3★+.
6. Le bot n'exerce pas les orages/sablier/traques (limites du §1).

## 8. Modifications apportées (avant → après)

| Réglage | Avant | Après | Fichier | Effet mesuré |
|---|---|---|---|---|
| Or par combat gagné | (12 + 5·étage) × coefficient | (10 + 3,5·étage) × coefficient | `js/tower.js` | or/passage −25 à −35 % ; 1er 4★ jour 3 → jour 7–9 |
| Or d'un coffre | 30 + 8·étage | 30 + 5·étage | `js/tower.js` | idem |
| Éveil 2★→3★, or | 900 | 1 200 | `js/evolution.js` | idem |
| Éveil 3★→4★, or | 2 500 | 4 000 | `js/evolution.js` | prudent : 1er 4★ jour 7 → 22 |
| Noyau, élite | 20 % | 10 % | `js/evolution.js` | stock toujours au plafond : insuffisant |
| Noyau, quête / boss | 50 % / 2 | 25 % / 1 | `js/evolution.js` | idem |
| Appel aux mages, Auberge pleine | refusé | accepté tant qu'aucun mage au village | `js/mages.js` | débloque le bateau |
| Plafond de niveau d'arme (Forge) | interface seule | contrôlé dans `forge()` | `js/village.js` | bug |
| Onglets de panneau | défilent sous l'en-tête | collants sous l'en-tête (`--hh`) | `css/style.css`, `js/village.js` | bug |
| Chiffres | Pixelify Sans | Silkscreen (0–9 seulement) | `index.html`, `css/style.css`, `js/galaxy.js` | bug |
| Rapport de raid perdu | tous les matériaux | résumé (`cargoSum`) + détail repliable | `js/raids.js` | bug |

Docs mises à jour : `docs/evolution.md` (coûts d'or, noyaux), `docs/mages.md` (Appel aux mages). Sauvegardes : aucune structure modifiée, aucune migration.

## 9. Seconde passe : puits d'or, marché rationné, début de partie durci

Constat de la première passe : l'or ne servait plus à rien après le jour 5 (3–7 M inutilisés) et le marché d'ingrédients ★1–2 + la fusion rendaient les paliers 2★–4★ 2 à 7× trop rapides.

### Changements (avant → après)

| Réglage | Avant | Après | Fichier |
|---|---|---|---|
| Monuments (Hôtel de ville niv. 2+) | n'existent pas | Greniers royaux (capacités +10 %/niv.), Étendard (PV/ATQ/DEF équipe +1,5 %/niv.), Bourse des étoiles (+3 achats hebdomadaires/niv.) ; 5 niveaux ; coût = base × 3^niveau (15 k / 25 k / 20 k de base : ≈ 3,6 M, 6 M, 4,8 M pour achever chacun) | `js/monuments.js` |
| Marché : parchemins, pierres, tomes | prix de base (150·3^(★−1)), illimités | ×3, +1 par achat de la semaine, limite 5 par ingrédient et par semaine (+3 par niveau de Bourse) | `js/monuments.js` |
| Fusion d'ingrédients, or | 100 × N | 150 × N² | `js/evolution.js` |
| Essence de biome (combat) | 30 % / 50 % | 20 % / 40 % | `js/evolution.js` |
| Butin de golem | noyau 1 chance sur 3 | 1 sur 4 | `js/evolution.js` |
| Renvoi d'un personnage 3★+ | impossible (sacrifice 1–2★ seulement) | bouton « Renvoyer » (confirmation, équipement rendu à la réserve ; héros et Jeanne exclus) | `js/monuments.js`, `js/village.js` |

Interface : captures `eco_monuments.png` (panneau de l'Hôtel de ville) et `eco_team.png` (bouton Renvoyer) dans le dossier de travail ; aucune structure de sauvegarde modifiée (`G.mon` et `G.mkt.wk` sont créés à la demande, absents = niveau 0 / aucun achat).

### Résultats (graines 21, 28, 23, 24 ; 100 jours)

| Mesure | Avant 1re passe | Après 1re passe | Après 2e passe |
|---|---|---|---|
| 1er 4★ (équilibre) | jour 3 | jour 7–9 | jour 8–10 |
| 1er 4★ (prudent) | jour 7 | jour 22 | jour 15 |
| Équipe entière 5★ (équilibre) | jour 28–35 | jour 25–32 | jour 35–43 |
| Équipe entière 6★ | jour 74–97 | jour 85 | jour 82 (une partie sur deux) |
| Étage max au jour 100 (équilibre) | 42 | 37–42 | 37–42 |
| Or final (équilibre) | 3,1–4,6 M | 3,0 M | **24–377 k** |
| Or par passage, étages 21–25 | 2 330 | 1 600 | 1 370 |
| Blessures / 100 passages | 6–8 | 6–7 | 6–9 |
| Erreurs console / page | 0 | 0 | 0 |

- Les monuments absorbent ≈ 2,4 M d'or par partie (9–13 niveaux achetés) : l'or redevient une contrainte jusqu'en fin de partie. Les paliers 3★/4★ arrivent environ une semaine plus tard ; le rythme tardif et l'étage atteint au jour 100 ne bougent pas (la Bourse rend le goulot ★ payable en or).
- **Bateau atteignable en jeu normal** : le bot ne démarrait pas la recherche (le mage était affecté au Sanctuaire, ou les lingots/bois étaient consommés par la Forge). Corrigé côté bot ; graine 29 : bateau achevé, baptisé, 16 voyages, 15 explorations, 5 pillages, 0 erreur. Graine 28 : étape 4/5 à 70 jours.
- **Mort du héros (nouvelle règle)** : le banc détecte `FIN` et arrête la partie proprement (`heroDeath` dans le journal). Joueurs normaux (équilibre, prudent, intensif) : **0 mort du héros** sur ≈ 14 parties de 80–100 jours. Imprudent : **2 sur 2** (étage 31 et 34, jour 3, après 7–9 h de jeu), en rushant avec des 3★ niv. 30.

### Reste à surveiller
- L'étage 32→33 (6★ requis) bloque 30–40 jours en jeu prudent/équilibré ; la vraie réserve de parchemins ★5 reste le tirage de butin.
- Les noyaux, essences et cristaux restent au plafond (le butin de base est encore trop généreux) ; les Greniers royaux augmentent ces plafonds sans résoudre la surproduction.

## 10. Troisième passe : Tour aléatoire par partie et difficulté relevée

Demandes du créateur : « les niveaux et leurs règles sont aléatoires selon les parties, sauf les 3 premiers étages » et « il faut rajouter beaucoup de difficulté ». Code : `js/rules.js` (nouveau, chargé juste avant `main.js`), retouches dans `tower.js`, `battle.js`, `village.js`, `sheet.js`, `evolution.js`, `injuries.js`, `tools/playtest.js`.

### 10.1 Règles tirées pour chaque partie (`G.run`)

| Élément | Avant | Après |
|---|---|---|
| Étages 1–3 | bloc 1–5, Loi de la traque, Forêt | **identiques dans toutes les parties** : Forêt d'émeraude, « Étage du seuil » ☘ (aucune loi, aucun modificateur), groupes de 1–2 monstres, aucun élite, ATQ des monstres ×0,9 |
| Blocs | 1–5, 6–10… ordre fixe des 8 lois et des 6 biomes | 1–3 (fixe), **4–5 (bloc court)**, puis 6–10, 11–15… ; boss tous les 10, quête tous les 5 (inchangé) |
| Loi d'un bloc | `LAWK[bloc % 8]` | tirée au hasard (graine de la partie), jamais la loi ni le biome du bloc précédent ; bloc 4–5 sans duel ni gel |
| Lois combinées | — | à partir du bloc commençant à l'étage 16 : 25 % (16–25), 42 % (26–35), 60 % (36+) de chances d'une **seconde loi** (pas duel + gel ensemble) ; les deux s'appliquent à l'exploration et au combat (`hasLaw(k)`) |
| Modificateurs d'étage | — | 0 à 2 par étage après le 3e : Brouillard ≋, Ennemis enragés ♨ (ATQ +20 %), Horde ⁂ (+1 monstre/groupe), Élites renforcés ♛, Soins réduits ⊘ (−40 %, feux ÷2), Peaux de fer ⛨ (DEF +40 %) ; positifs (18 % des tirages) : Double butin ✦, Bénédiction ☀. Probabilité d'un modificateur ≈ 12 % + 2,2 %/étage (max 85 %), d'un second à partir de l'étage 18 |
| Niveau de loi (`lawLv`) | +1 tous les 8 blocs | +1 tous les 30 étages |

- `G.run = {v, seed, keep, b:[[loi, loi2, biome]…], m:{étage:[modificateurs]}}` : généré à la première lecture (nouvelle partie = nouvelle graine), mis en cache et sauvegardé ; même sauvegarde = mêmes règles après rechargement. La disposition des salles reste tirée à chaque entrée (comme avant).
- **Anciennes sauvegardes** (pas de `G.run`, `G.max > 1`) : `keep` = fin du bloc de 5 de l'étage max atteint ; les étages 4…keep gardent leur ancienne loi et leur ancien biome, sans modificateur ; les étages 1–3 deviennent l'« Étage du seuil » ; le hasard commence au bloc suivant (vérifié : `G.max = 17` → étages 4–20 identiques à l'ancien code, 21+ tirés).
- Affichage : bandeau d'entrée d'étage (lois, description, modificateurs, **danger**), ligne d'objectif (`☘`/`ϟ ❄ · ≋ Brouillard…`), bouton « Règles » (symboles), panneau Règles, bandeau de combat (`#blaw`), portail (symboles par étage, « +n » modificateurs, liseré coloré selon le danger), rumeurs et galaxie inchangées (lisent `lawOf`/`biomeOf`).

### 10.2 Difficulté

| Réglage | Avant | Après |
|---|---|---|
| Monstres (`foeBase`) | PV 130·1,20^(é−1), ATQ 24·1,16^(é−1), DEF 10+3é | en plus, après l'étage 3 : **ATQ ×1,06^(é−3)**, **PV ×1,035^(é−3)** (composés jusqu'à l'étage 45), DEF +1/étage ; étages 1–3 ATQ ×0,9 ; pillages galactiques : ancienne courbe (leurs chances affichées en dépendent) |
| Élites | quête « gardes » et VIP seulement | chaque groupe : 6 % + 1,2 %/étage (max 50 %, ×1,8 sous « Élites renforcés ») |
| Affixes d'élite | — | Enragé ♨, Blindé ⛨, Vampirique ♥, Invocateur ⁂, Explosif ✸, Rapide », Réfléchissant ◇, Régénérant ✚ ; élite : 1 (+1 dès l'étage 20, +1 dès 35) ; quête/boss : 1 dès 15, 2 dès 30 ; pastilles colorées au-dessus des PV, noms dans la fiche de cible |
| IA ennemie | cible au hasard (gardiens ×2) | dès l'étage 4 : cible les blessés et la ligne arrière (30 % → 85 % des coups selon l'étage) ; compétences par espèce (Hurlement du loup, Spores curatives, Cri glaçant qui vide l'énergie d'ultime, Carapace, Frappe brutale, Acide −25 % DEF, Curée) |
| Boss | mécaniques `MECH` | **phases** (boss : 66 % et 33 % des PV ; quête dès l'étage 15 : 50 %) : furie, serviteurs, bouclier ; **Cataclysme annoncé** un tour à l'avance (boss tous les 4 tours, 3 en phase 2+), interrompu par une rupture de ténacité, réduit de moitié par la Défense |
| PV entre deux étages | équipe soignée gratuitement à chaque entrée | PV conservés (`G.hpk`) ; récupération au village 4 %/min (+2 %/min par niveau d'Infirmerie) ou **repos complet payant** (vivres + or, portail) ; étages 1–3 toujours PV pleins |
| Feu de camp | 60 % | 40 % (20 % sous « Soins réduits ») |
| Or par combat / coffre | (10 + 3,5é) / 30 + 5é | (8 + 3é) / 25 + 4é ; éclat d'élite 1 → 50 % |
| Noyaux, essences, cristaux | élite 10 %, quête 25 %, golem 1/4, essence 20/40 % ×(1+é/12), veine +1 dès 15 | élite 5 %, quête 12 %, golem 1/6, essence 12/28 % ×(1+é/20), veine +1 dès 25 |
| Parchemins de gardien | boss 2, quête 1 | boss 1 + 50 %, quête 70 % |
| Mort à la chute | `deathP` | inchangé pour les compagnons ; **héros ÷4 si l'équipe gagne le combat** (le risque entier en cas de défaite reste affiché) |
| Danger affiché | — | `floorDanger(f)` : rapport survie/TTK de l'équipe face à l'étage (lois et modificateurs compris), étalonné sur le banc : Sûr ≥ 0,5 · Modéré ≥ 0,2 · Dangereux ≥ 0,09 · Très dangereux ≥ 0,04 · Mortel ; au-delà de « Dangereux » : « ⚠ très dangereux / mortel pour votre équipe », et si le héros en fait partie « le héros risque la mort définitive » |

Pas de sélecteur de difficulté (optionnel) : la difficulté par défaut est relevée.

### 10.3 Cibles

- Joueur équilibré : quelques morts de compagnons par 100 étages, blessures courantes, mort du héros rare mais réelle s'il force au-delà de son niveau (le danger est affiché avant d'entrer).
- Étage 30 vers le jour 60–80 plutôt que 30 ; or rare.
- Repère de puissance (docs/progression.md §1.3) : niv. 30 → étage 15, niv. 40 → 21, niv. 50 → 28, niv. 60 → 38.

### 10.4 Mesures (même code de banc, graines identiques ; `before` = commit 28b39e1f)

| Partie | Étage j5 / j10 / j20 / j30 / j45 / j60 | Fin | Passages | Défaites | Blessures | Morts | Héros mort | Or final | Ess./noyaux/crist. |
|---|---|---|---|---|---|---|---|---|---|
| equilibre 21 avant (60 j) | 19 / 22 / 25 / 28 / 32 / 37 | 37 | 957 | 0 | 75 | 0 | — | 409 k | 4 331 |
| equilibre 21 après (80 j) | 19 / 19 / 25 / 32 / 32 / 37 | 37 (j80) | 921 | 2 | 17 | 1 | — | 319 k (j60), 126 k (j80) | 4 430 |
| prudent 23 avant (60 j) | 11 / 17 / 17 / 23 / 23 / 26 | 26 | 369 | 0 | 1 | 0 | — | 23 k | 2 199 |
| prudent 23 après (60 j)¹ | 11 / 17 / 17 / 20 / 30 / 30 | 30 | 338 | 0 | 22 | 0 | — | 3 k | 1 793 |
| imprudent 25 avant | 33 au jour 1–3 | 33 | 35 | 3 | 11 | 3 | jour 3, étage 33 | — | — |
| imprudent 25 après | 23 au jour 1–3 | 23 | 28 | 6 | 33 | 6 | jour 3, étage 23 | — | — |
| intensif 24 après (+8 étages au-dessus du conseillé, « forcer ») | 21 au jour 2 | 21 | 51 | 5 | 78 | 28 | jour 5, étage 21 | — | — |

¹ avant la dernière retouche (parchemins rationnés, risque des compagnons entier).

Lecture :
- **Les mêmes équipes tombent 10 étages plus tôt** : un groupe 3★ niv. 30 plafonne vers l'étage 17–20 (avant : 33), ce qui colle au repère §1.3 (niv. 30 → étage 15). Le danger mesuré par étage concorde avec l'issue : ≥ 0,1 victoires sûres, 0,03–0,06 pertes répétées, ≤ 0,02 déroutes et morts.
- **Le jeu forcé tue désormais** : imprudent meurt 10 étages plus bas ; intensif (qui ne recule que de 3 étages) entre en spirale de mort au jour 2–5 en ignorant un danger « Mortel » affiché, alors qu'il ne perdait personne en 100 jours.
- **Le bot équilibré/prudent ne progresse pas plus lentement** : il est bridé par les éveils (★) et recule dès qu'il échoue (`farmAfter`), donc il ne combat presque jamais au-delà de son niveau (≈ 100 % de victoires, 1 mort en 921 passages). La cible « étage 30 vers le jour 60–80 » n'est **pas atteinte** sur ce banc (étage 30–32 vers les jours 30–45) ; le levier restant est l'économie d'éveil (parchemins ★4–★5), entamée ici (parchemins de gardien rationnés) mais non mesurée sur 80 jours.
- Or : −20 à −70 % en fin de partie équilibrée ; les repos payants et les monuments absorbent le reste. Noyaux/essences/cristaux : production réduite (taux), mais les stocks restent hauts sur 60–80 jours.
- Blessures moins nombreuses chez le bot équilibré (17 contre 75) : il se repose à 80 % de PV avant chaque étage et recule plus tôt.
- Avertissements console pendant le banc : `rescueFlow is not defined` (code de secours en cours d'écriture par un autre chantier, `js/tower.js`), sans lien avec cette passe ; aucune erreur de page.

### 10.5 Bot

`tools/playtest.js` : lit `hasLaw` (leviers sous Loi des verrous en loi secondaire), journalise lois, modificateurs et danger de chaque passage, se repose (payant) sous 80 % de PV ou attend au village, et `foeBase` pour TTK/survie ; délai de séance porté à 15 min (combats plus longs).

### 10.6 Non fait / à surveiller
- Sélecteur de difficulté (Normal / Difficile / Cauchemar) : non fait.
- Potions : non limitées davantage (déjà en doses).
- Aucune protection contre la spirale de mort (§7.4) : avec la nouvelle difficulté elle devient le premier danger d'un joueur qui force ; le danger affiché est le seul garde-fou.
- Les tempêtes, la foudre et les patrouilles ne sont toujours pas simulées par le bot ; les combinaisons de lois sont seulement vérifiées au chargement et sur captures.
