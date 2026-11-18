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
