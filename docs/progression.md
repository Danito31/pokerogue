# Progression des personnages — niveaux, classes, arbres, métiers

Document de conception pour **Dungeon Setlers**.
Sources : demande du créateur (paliers 5/10/20/30/35/40/45/50/60, limite de niveau par étoile, arbre personnel visible, icône par compétence), bible globale (§5 rôles, §6 personnalités, §7 compétences, §8 métiers, §9 mages), `docs/personnalites.md` (§7 système en place), `docs/evolution.md` (éveil par parchemins), code actuel de `index.html` (`ROLES`, `ITYPES`, `roleOf`, `kit`, `SKILLS`, `famW`, `drawSkill`, `cap`, `need`, `gain`, `stats`, `doEvo`, `mkFoe`, `KM`).

Ce document décrit un système **implémentable dans le code actuel** : chaque règle donne ses chiffres, ses identifiants et le point d'accroche dans `index.html` (§13).

---

## Sommaire

0. Principes et vocabulaire
1. Niveaux maximum, rythme et éveil des étoiles
2. Table des paliers (niv. 1 → 60)
3. Statistiques par bande de niveaux
4. Système de classes (techniques d'arme, sous-classes, spécialisations, éveils, divinités)
5. Ultimes
6. Métiers
7. Arbre de compétences personnalisé
8. Catalogue des compétences
9. Index des personnalités (codex)
10. Interface
11. Équilibrage et vérifications
12. Liste des icônes (pipeline graphique)
13. Implémentation et migration

---

## 0. Principes et vocabulaire

**Quatre règles d'or**

1. **On ne choisit pas les compétences.** Chaque personnage a un **arbre personnel** généré une fois (graine `c.seed`) à partir de sa personnalité, de ses sous-traits, de sa race, de ses étoiles, puis de sa sous-classe et de sa spécialisation. L'arbre est **visible à l'avance** : le joueur voit ce que son personnage va gagner, et quand.
2. **On choisit deux choses seulement** : la **sous-classe** au niveau 10 (parmi 3) et, à l'éveil du niveau 40, l'éventuelle **passerelle** vers une autre classe (si la classe le permet). Le métier du niveau 5 est proposé (2 vocations) et le joueur confirme.
3. **L'arme fait la classe** (déjà vrai : `roleOf(c)`). La **spécialisation** du niveau 20 est *révélée* par l'arme portée et la personnalité ; ensuite, changer d'arme met la spécialisation « en sommeil » sans rien effacer (§4.5).
4. **Les étoiles fixent le plafond** : 1★ = niv. 10, 2★ = 20, 3★ = 30, 4★ = 40, 5★ = 50, 6★ = 60 (les « dieux »). Un personnage au plafond doit être éveillé (parchemins, `docs/evolution.md`) pour continuer.

**Vocabulaire**

| Terme | Sens | Champ de données |
|---|---|---|
| Rôle | classe de base dérivée de l'arme (7 : guerrier, gardien, assassin, archer, sorcier, soigneur, soutien) | `c.role` (inchangé) |
| Voie | grande orientation issue de la personnalité : **Cœur**, **Lame** ou **Esprit** | calculée (`voieOf(c)`) |
| Technique | compétence de rôle (bouton « compétence » actuel), donnée par l'arme, puis par la spécialisation | `kit(c).sk` |
| Ultime | compétence d'énergie (100) | `kit(c).ul` |
| Sous-classe | classe de soutien choisie au niv. 10, améliorée au niv. 30 selon la voie | `c.cls.sub` |
| Spécialisation | classe de base spécialisée, révélée au niv. 20 | `c.cls.spec` |
| Éveil / Apogée / Divinité | formes de la spécialisation aux niv. 40 / 50 / 60 | `c.cls.aw` = 1 / 2 / 3 |
| Nœud | case de l'arbre personnel, débloquée automatiquement à son niveau | `c.tree` |
| Métier | rôle économique attribué au niv. 5, rangs apprenti → grand maître, évolution au niv. 45 | `c.job` |

**Les trois voies** (une par groupe de trois personnalités — sert aux améliorations de sous-classe, aux variantes d'ultime et à l'équilibrage) :

| Voie | Personnalités | Fantaisie | Couleur d'interface |
|---|---|---|---|
| **Cœur** | Altruiste, Stoïque, Gourmand | protéger, nourrir, tenir | `#5fe07a` |
| **Lame** | Ambitieux, Impulsif, Égoïste | frapper, dominer, oser | `#ff5a5a` |
| **Esprit** | Calculateur, Curieux, Opportuniste | comprendre, exploiter, profiter | `#6fd3ff` |

---

## 1. Niveaux maximum, rythme et éveil des étoiles

### 1.1 Plafonds

`cap(c) = 10 × c.st` (1★ 10 · 2★ 20 · 3★ 30 · 4★ 40 · 5★ 50 · 6★ 60).

L'ancienne formule (`10 + 10★ + 5 × transcendance`) disparaît. La **transcendance** ✦1–3 des personnages 6★ est **conservée mais réaffectée** : elle ne donne plus de niveaux, elle devient les **Constellations** (§1.5).

### 1.2 Courbe d'expérience

Expérience pour passer du niveau L au niveau L+1 (`need(c)`) :

| Bande | Formule `need(L)` | Exemples | Total de la bande |
|---|---|---|---|
| 1 → 10 | `30 + 20·L` | niv. 1 : 50 · niv. 9 : 210 | 1 170 |
| 10 → 20 | `40 + 17·L` | niv. 10 : 210 · niv. 19 : 363 | 2 865 |
| 20 → 30 | `50 + 20·L` | niv. 20 : 450 · niv. 29 : 630 | 5 400 |
| 30 → 40 | `60 + 20·L` | niv. 30 : 660 · niv. 39 : 840 | 7 500 |
| 40 → 50 | `80 + 24·L` | niv. 40 : 1 040 · niv. 49 : 1 256 | 11 480 |
| 50 → 60 | `1,6 × (80 + 24·L)` | niv. 50 : 2 048 · niv. 59 : 2 394 | 22 208 |

Total 1 → 60 : **≈ 50 600 exp.** La vitesse personnelle (`xpMul(c)` : profil `c.gr.xp`, Érudit) s'applique comme aujourd'hui.

Implémentation :
```js
const XPB=[[10,30,20,1],[20,40,17,1],[30,50,20,1],[40,60,20,1],[50,80,24,1],[60,80,24,1.6]];
const need=c=>{const L=c.lv,b=XPB.find(x=>L<x[0])||XPB[5];return Math.round(b[3]*(b[1]+b[2]*L))};
```

### 1.3 Rythme attendu

Hypothèse de mesure : un étage « normal » rapporte ≈ 7,5 combats × `(20 + 8·étage)` exp. à chaque membre vivant de l'équipe (`fight()`), plus les gardiens (×2 à ×4). Le Camp d'entraînement et Érudit accélèrent d'environ 20 %.

| Bande | Atteinte (équipe active, sans camp) | Temps de jeu indicatif | Verrou réel |
|---|---|---|---|
| 1 → 10 | étage 4 | 1 soirée | 2 parchemins ★1 pour passer 2★ |
| 10 → 20 | étage 9 | 2–3 soirées | 3 parchemins ★2 |
| 20 → 30 | étage 15 | 1 semaine | 4 parchemins ★3 (dès l'étage 3, surtout quêtes/boss) |
| 30 → 40 | étage 21 | 2 semaines | 5 parchemins ★4 (dès l'étage 8) |
| 40 → 50 | étage 28 | 3–4 semaines | 6 parchemins ★5 (dès l'étage 15) |
| 50 → 60 | étage 38 | 1–2 mois | expérience ×1,6 ; parchemins ★6 pour les Constellations |

Intention : **l'expérience va un peu plus vite que les étages** ; le vrai verrou est l'éveil d'étoile. Arriver au plafond tôt n'est pas du temps perdu grâce à la **réserve d'expérience**.

### 1.4 Réserve d'expérience et interaction avec l'éveil d'étoile

- Au plafond, **50 % de l'expérience gagnée** part dans `c.xpBank` (au lieu d'être perdue comme aujourd'hui), plafonnée à **la moitié du total de la bande suivante** (ex. un 2★ niv. 20 stocke au plus 2 700 exp.).
- À l'éveil d'étoile (`doEvo`), la réserve est **versée immédiatement** via `gain()` (les paliers franchis se déclenchent normalement, avec leur annonce).
- **Il faut être au plafond pour éveiller** (règle inchangée : `cEvoReady`). L'éveil :
  1. relève le plafond de 10 niveaux ;
  2. **révèle** les nœuds de la bande suivante de l'arbre (§7.4) ;
  3. accorde le **nœud d'étoile** (remplace « une compétence tirée d'office ») : un nœud bonus placé au niveau de l'ancien plafond, tiré dans la rareté de la nouvelle bande ;
  4. garde les 35 % de chances d'un nouveau sous-trait (les nœuds encore cachés en tiennent compte, les nœuds déjà révélés ne bougent pas).
- Les paliers de classe (10, 20, 30…) se déclenchent **au niveau**, donc après l'éveil : un 1★ niv. 10 choisit sa sous-classe, s'éveille 2★, puis atteint la spécialisation au niv. 20.

### 1.5 Transcendance → Constellations (6★ niv. 60 uniquement)

Coût inchangé (`cEvoCost`, parchemin ★6 × 1/2/3, 20 essences, 5 noyaux, 25 000/50 000/75 000 or). Condition : niv. 60 **et** forme divine obtenue.

| Rang | Nom | Effet |
|---|---|---|
| ✦1 | Écho divin | statistiques de base +4 % ; le passif divin (§4.8) +50 % |
| ✦2 | Ciel ouvert | statistiques +4 % ; ultime divin +20 % de puissance et commence chaque combat avec 30 d'énergie |
| ✦3 | Aura stellaire | statistiques +4 % ; toute l'équipe +5 % PV/ATQ/DEF tant qu'il est vivant |

### 1.6 Migration des sauvegardes (aucune perte)

Nouvelle clé de sauvegarde `tdE6` (copie de secours `tdE5_bak` écrite avant migration). Pour chaque personnage :

1. **Niveau au-dessus du nouveau plafond** (ex. Jeanne 3★ niv. 36, plafond 40 → 30) : l'expérience représentée par les niveaux en trop est convertie **avec la nouvelle courbe** et versée dans `c.xpBank` **sans plafond** (exception de migration) ; `c.lv = cap(c)`, `c.xp = 0`. Badge « Prêt pour l'éveil » sur la fiche. Exemple : Jeanne niv. 36 → niv. 30 + réserve de Σ need(30..35) = 660+680+700+720+740+760 = **4 260 exp.**, rendues dès son éveil 4★.
2. **Transcendance** : `c.tr` conservé et converti en Constellations ; le personnage garde son niveau s'il est ≤ 60, sinon point 1.
3. **Compétences déjà apprises** (`c.skills`) : toutes conservées, marquées « acquises » (hors arbre). Un nœud de l'arbre qui tombe sur une compétence déjà connue donne **+2 niveaux** (règle actuelle des doublons).
4. **Paliers déjà franchis** : appliqués rétroactivement à l'ouverture.
   - Spécialisation (niv. ≥ 20) : verrouillée d'après l'arme portée (§4.4), sans choix.
   - Métier (niv. ≥ 5), sous-classe (niv. ≥ 10), passerelle d'éveil (niv. ≥ 40) : **choix en attente** (pastille rouge sur la fiche ; l'effet n'est actif qu'une fois choisi, rien n'expire).
   - Nœuds ≤ niveau : débloqués d'un coup (annonce groupée « L'arbre de X s'est éveillé : 7 nœuds »).
5. Profil de croissance `c.gr` conservé ; `ms` et `lc` sont réinterprétés (§7.3).

---

## 2. Table des paliers (niv. 1 → 60)

Légende : **★** = plafond d'étoile · **N** = nœud de l'arbre personnel (compétence débloquée automatiquement, rareté selon la bande, §7) · **G** générique · **S** lié à la sous-classe · **V** lié à la spécialisation (vocation) · **D** divin · « stats » = croissance de la bande seulement (§3).
Personnalités : **Curieux** gagne 3 nœuds « Éclair de génie » (niv. 11, 31, 51) ; **Stoïque** perd 3 nœuds (niv. 16, 37, 47) mais ses nœuds 18, 38 et 48 montent d'une rareté (« Patience récompensée »).

| Niv. | Déblocage | Détail |
|---|---|---|
| 1 | **Technique d'arme** · **Âme** · Ultime d'apprenti | technique selon l'arme (ex. épée → *Entaille*), passif d'âme de la personnalité (§8.1), ultime de rôle actuel (`ROLES.ul`) |
| 2 | stats | |
| 3 | N1 (G) | première compétence de l'arbre |
| 4 | stats | |
| 5 | **MÉTIER** (ms_5) | 2 vocations proposées, le joueur confirme (§6.2) |
| 6 | N2 (G) | |
| 7 | stats | |
| 8 | N3 (G, **active garantie**) | si l'arbre n'a encore aucune active, ce nœud en est une |
| 9 | stats | |
| 10 | **SOUS-CLASSE** (ms_10) · ★1 | choix parmi 3 sous-classes du rôle, compétence de sous-classe (§4.3) |
| 11 | stats · *Curieux : N (G)* | |
| 12 | N4 (G) | |
| 13 | stats | |
| 14 | N5 (S) | famille favorisée par la sous-classe |
| 15 | stats · *pressentiment* | la fiche affiche la spécialisation pressentie et sa probabilité |
| 16 | N6 (G) · *Stoïque : —* | |
| 17 | stats | |
| 18 | N7 (G) · *Stoïque : +1 rareté* | |
| 19 | stats | |
| 20 | **SPÉCIALISATION** (ms_20) · ★2 | technique de spécialisation remplace la technique d'arme ; bonus de stats ×1,06 |
| 21 | stats | |
| 22 | N8 (V) | compétence marquée de la spécialisation |
| 23 | stats | |
| 24 | N9 (G) | |
| 25 | **Maîtrise de technique** | technique +15 % de puissance, recharge des actives de spécialisation −1 tour (min. 1) |
| 26 | N10 (V) | |
| 27 | stats | |
| 28 | N11 (G) | |
| 29 | stats | |
| 30 | **SOUS-CLASSE AMÉLIORÉE** (ms_30) · ★3 | forme de voie (Cœur/Lame/Esprit) de la sous-classe ; bonus ×1,04 |
| 31 | stats · *Curieux : N (G)* | |
| 32 | N12 (G) | |
| 33 | stats | |
| 34 | N13 (G) | |
| 35 | **ULTIME** (ms_35) | l'ultime de spécialisation remplace l'ultime d'apprenti (§5) |
| 36 | stats | |
| 37 | N14 (G) · *Stoïque : —* | |
| 38 | N15 (G) · *Stoïque : +1 rareté* | |
| 39 | stats | |
| 40 | **ÉVEIL** (ms_40) · ★4 | forme éveillée ou **passerelle** vers une autre classe ; technique éveillée ; ultime +25 % ; bonus ×1,12 ; VIT +3 |
| 41 | stats | |
| 42 | N16 (V) | compétence marquée de la forme éveillée |
| 43 | stats | |
| 44 | N17 (G) | |
| 45 | **ÉVOLUTION DU MÉTIER** (ms_45) | métier évolué, rangs Maître et Grand maître accessibles (§6.4) |
| 46 | stats | |
| 47 | N18 (G) · *Stoïque : —* | |
| 48 | N19 (G) · *Stoïque : +1 rareté* | |
| 49 | stats | |
| 50 | **APOGÉE** (ms_50) · ★5 | forme d'apogée ; ultime ×1,5 + effet majeur ; bonus ×1,15 ; métier : Grand maître |
| 51 | stats · *Curieux : N (D)* | |
| 52 | N20 (D) | bande divine : rare minimum |
| 53 | stats | |
| 54 | N21 (D) | |
| 55 | **Éclat divin** | technique divine (+30 %), +1 point de compétence au début de chaque combat |
| 56 | N22 (D) | |
| 57 | stats | |
| 58 | N23 (D) | |
| 59 | stats | |
| 60 | **DIVINITÉ** (ms_60) · ★6 | forme divine, passif divin, **ultime divin** ; bonus ×1,60 ; VIT +5 ; « l'écart monstrueux » |

Il se passe quelque chose d'important **tous les 2 niveaux au plus** (3 au plus pour un Stoïque). Bilan à niv. 60 : 1 technique (3 fois améliorée), 1 âme, 1 sous-classe (améliorée), 1 spécialisation (3 formes), 1 ultime (4 formes), 1 métier (évolué), **23 nœuds** (26 Curieux, 20 Stoïque) + 5 nœuds d'étoile.

---

## 3. Statistiques par bande de niveaux

### 3.1 Formule

Aujourd'hui : `stat = base × rôle × (1 + 0,1·g·(L−1)) × (1 + équipement + passifs)` — croissance **linéaire**, alors que les monstres croissent **exponentiellement** (`mkFoe` : PV ×1,20 et ATQ ×1,16 par étage). Résultat mesuré (§11.3) : à l'étage 28, il faut ~40 attaques de base pour tuer un monstre normal. Nouvelle formule, **multiplicative par bande** :

```
stat = base(★) × rôle × spé × LVM[k][L] × tilt(g, L) × (1 + équipement + passifs) × voie/personnalité (inchangé)
LVM[k][L] = Π_{l=2..L} (1 + RB[bande(l)] × K[k])  ×  Π paliers atteints (1 + (BUMP[p] − 1) × K[k])
tilt(g, L) = 1 + 0,5 × (g − 1) × (L − 1) / 59        (g = c.gr.hp / atk / def, entre 0,75 et 1,4 → ±20 % au niv. 60)
```

| Constante | Valeur |
|---|---|
| `RB` (croissance d'ATQ par niveau) | bande 1 (2–10) : 9 % · bande 2 (11–20) : 8 % · bande 3 (21–30) : 7 % · bande 4 (31–40) : 7 % · bande 5 (41–50) : 8 % · bande 6 (51–60) : **12 %** |
| `K` (part de la croissance) | ATQ 1 · PV 0,62 · DEF 0,40 (la DEF reste basse : la formule de dégâts `100/(100+DEF)` sature vite) |
| `BUMP` (paliers) | 20 : ×1,06 · 30 : ×1,04 · 40 : ×1,12 · 50 : ×1,15 · 60 : **×1,60** |
| VIT | `R.spd + b.spd + équipement + ⌊g.spd × (L−1)⌋` (inchangé) + 3 (niv. 40) + 5 (niv. 60) |
| Critique | inchangé (`0,05 + 0,01★ + g.crit·(L−1)`) + 3 % (éveil) + 5 % (divin) ; plafond 75 % |

`LVM` est précalculé une fois (tableau 61 × 3).

### 3.2 Multiplicateurs de niveau (`LVM`, g = 1)

| Niv. | ATQ | PV | DEF | | Niv. | ATQ | PV | DEF |
|---|---|---|---|---|---|---|---|---|
| 1 | 1,00 | 1,00 | 1,00 | | 35 | 14,3 | 5,3 | 3,0 |
| 5 | 1,41 | 1,24 | 1,15 | | 39 | 18,7 | 6,3 | 3,3 |
| 10 | 2,17 | 1,63 | 1,37 | | **40** | **22,4** | **7,1** | **3,6** |
| 15 | 3,2 | 2,1 | 1,6 | | 45 | 32,9 | 9,0 | 4,2 |
| 19 | 4,3 | 2,5 | 1,8 | | 49 | 44,8 | 10,9 | 4,7 |
| **20** | **5,0** | **2,7** | **1,9** | | **50** | **55,6** | **12,5** | **5,2** |
| 25 | 7,0 | 3,4 | 2,2 | | 55 | 98 | 17,9 | 6,6 |
| 29 | 9,1 | 4,0 | 2,5 | | 59 | 154 | 23,9 | 7,9 |
| **30** | **10,2** | **4,3** | **2,6** | | **60** | **276** | **35,2** | **10,3** |

Le saut **50 → 60** multiplie l'ATQ par **×5** et les PV par **×2,8** (contre ×2,5 / ×1,8 pour 40 → 50) : c'est « l'écart monstrueux » des 6★.

### 3.3 Multiplicateurs d'étoiles (inchangés, rappel)

Base générée : PV `220 + 90★`, ATQ `26 + 11★`, DEF `16 + 7★` (`mk`, `evoBase`).

| ★ | PV | ATQ | DEF | Plafond | ATQ au plafond (base × LVM) relative à un 1★ niv. 10 |
|---|---|---|---|---|---|
| 1 | ×1,00 | ×1,00 | ×1,00 | 10 | ×1 |
| 2 | ×1,29 | ×1,30 | ×1,30 | 20 | ×3,0 |
| 3 | ×1,58 | ×1,59 | ×1,61 | 30 | ×7,5 |
| 4 | ×1,87 | ×1,89 | ×1,91 | 40 | ×19,5 |
| 5 | ×2,16 | ×2,19 | ×2,22 | 50 | ×56 |
| 6 | ×2,45 | ×2,49 | ×2,52 | 60 | ×317 |

### 3.4 Modificateurs de spécialisation

Appliqués à partir du niv. 20 tant que la spécialisation est « en harmonie » avec l'arme (§4.5). Ils s'ajoutent aux multiplicateurs de rôle `ROLES[r].hp/atk/def`. Voir colonne « Mods » du tableau §4.4.

---

## 4. Système de classes

Ordre de construction d'un personnage :

```
Arme portée ─► Rôle (7) ─► Technique d'arme (niv. 1)
                       └─► Sous-classe (niv. 10, choix parmi 3) ─► forme de voie (niv. 30)
                       └─► Spécialisation (niv. 20, révélée : arme + personnalité) ─► Ultime (35)
                                   ─► Éveil (40, ou passerelle) ─► Apogée (50) ─► Divinité (60)
```

### 4.1 Techniques d'arme (niv. 1)

La technique (bouton de compétence, 1 point, `doSkill` branche « role ») prend le **nom, l'icône et une petite variante** de l'arme portée. La mécanique de base reste celle du rôle (`ROLES[r].sk`).

| Arme (`ITYPES`) | Rôle | Technique | Effet (P = 1) | Icône |
|---|---|---|---|---|
| epee | guerrier | **Entaille** | cible 220 % | `sk_tech_entaille` |
| hache | guerrier | **Fendoir** | cible 240 %, +10 rupture ; VIT −3 jusqu'au tour suivant | `sk_tech_fendoir` |
| (mains nues) | guerrier | **Coup de poing** | cible 180 % | `sk_tech_poing` |
| bouclier | gardien | **Bouclier levé** (l'actuel « Rempart », renommé pour ne pas se confondre avec la spécialisation) | provoque 2 tours, bouclier 200 % DEF + 10 % PV | `sk_tech_bouclier` |
| dagues | assassin | **Estoc** | cible 260 %, critique assuré sur un ennemi brisé | `sk_tech_estoc` |
| arc | archer | **Volée** | 3 flèches de 90 % sur des cibles au hasard | `sk_tech_volee` |
| baton | sorcier | **Déflagration** | tous 110 % | `sk_tech_deflagration` |
| grimoire | sorcier | **Glyphe** | tous 90 % et DEF −10 % (2 tours) | `sk_tech_glyphe` |
| sceptre | soigneur | **Soin** | allié le plus blessé : 160 % ATQ + 8 % PV max | `sk_tech_soin` |
| luth | soutien | **Ralliement** | allié le plus fort : ATQ +40 % (2 tours) et agit immédiatement | `sk_tech_ralliement` |

Un mage sans arme (`c.mage`, rôle sorcier) utilise **Glyphe**.

### 4.2 Ultimes d'apprenti (niv. 1 → 34)

Les ultimes actuels (`ROLES[r].ul`) restent l'ultime de tout personnage **avant le niv. 35** : Déferlante (guerrier), Bastion (gardien), Exécution (assassin), Pluie de flèches (archer), Cataclysme (sorcier), Renouveau (soigneur), Hymne (soutien). Icônes `sk_ult_<rôle>` (7). Jeanne garde *Ordre du commandant* (`sk_ult_commandant`) comme ultime unique à toutes les étapes (§5.3).

### 4.3 Sous-classes (niv. 10, choix du joueur) et formes de voie (niv. 30)

Une sous-classe est une **classe de soutien** qui complète la classe principale : elle donne **une compétence de sous-classe** (active ou passive) au niv. 10, oriente le nœud S du niv. 14 (famille favorisée +2 dans `famW`), et se transforme au niv. 30 selon la **voie** du personnage (Cœur/Lame/Esprit : imposée par la personnalité, pas choisie). À la forme de voie, la compétence de sous-classe gagne **×1,5 de puissance** plus l'effet indiqué.

**Sous-classes proposées par rôle (3 chacune)** :

| Rôle | Option A | Option B | Option C |
|---|---|---|---|
| Guerrier | Porte-étendard | Médic de campagne | Runiste |
| Gardien | Médic de campagne | Exorciste | Porte-étendard |
| Assassin | Saboteur | Contrebandier | Alchimiste de combat |
| Archer | Pisteur | Dompteur | Saboteur |
| Sorcier | Runiste | Exorciste | Alchimiste de combat |
| Soigneur | Garde du corps | Conteur | Exorciste |
| Soutien | Conteur | Tacticien | Dompteur |

L'écran de choix (§10.3) affiche pour chaque option la **forme de voie que ce personnage obtiendra au niv. 30**, et une étoile « conseillé » sur l'option dont la famille favorisée est la plus haute dans `famPct(c)`.

**Les 12 sous-classes**

| id | Sous-classe | Famille favorisée | Compétence (niv. 10) | Cœur (niv. 30) | Lame (niv. 30) | Esprit (niv. 30) |
|---|---|---|---|---|---|---|
| `etendard` | **Porte-étendard** | soutien | *Étendard levé* (P) : début de combat, équipe ATQ +6 %, DEF +4 % | **Héraut de l'aube** : + l'équipe régénère 3 % PV/tour pendant 3 tours | **Seigneur de guerre** : ATQ équipe +12 % (au lieu de 6), +2 % par ennemi vaincu par l'équipe (max +10 %) | **Maréchal** : +1 point de compétence et VIT équipe +6 au début du combat |
| `medic` | **Médic de campagne** | soin | *Pansement express* (P) : après chacune de ses actions, l'allié le plus blessé récupère 3 % PV max (5 % sous 30 %) | **Ange de campagne** : purifie aussi un affaiblissement du soigné | **Chirurgien de guerre** : le soigné gagne ATQ +10 % (1 tour) | **Apothicaire de terrain** : potions de l'équipe +30 %, 20 % de chances de ne pas consommer la dose |
| `runiste` | **Runiste** | contrôle | *Rune d'arme* (P) : ses coups posent une rune de son élément (3 tours) : équipe +8 % de dégâts de cet élément sur la cible, rupture +15 % | **Runiste gardien** : le prochain allié frappé par la cible runée reçoit un bouclier de 4 % PV | **Runiste de sang** : +15 % et la rune explose à la mort de la cible (60 % ATQ aux autres ennemis) | **Grand runiste** : la rune compte comme une faiblesse (rupture pleine) |
| `exorciste` | **Exorciste** | protection | *Purification* (A, recharge 3) : retire les affaiblissements d'un allié + bouclier 8 % PV max ; +30 % de dégâts contre spectres et ennemis d'Ombre | **Purificateur** : affecte toute l'équipe | **Inquisiteur** : frappe aussi l'ennemi le plus fort (140 %, Sacré) et lui retire ses bonus | **Sceau-mage** : scelle la mécanique de boss (`MECH` : serviteurs, miroir, cristaux…) 2 tours ; recharge 4 |
| `saboteur` | **Saboteur** | contrôle | *Piège à mâchoires* (A, recharge 3) : l'ennemi le plus rapide recule de 25 % et perd 20 % de DEF (2 tours) | **Démineur** : annule une *Charge dévastatrice* en cours ; équipe +10 d'énergie | **Artificier** : le piège explose : 90 % à tous | **Maître des pièges** : 2 cibles, recul 35 % |
| `contreb` | **Contrebandier** | chance | *Poches profondes* (P) : or +8 % ; chaque critique a 10 % de chances de voler un matériau (une fois par monstre) | **Receleur généreux** : chaque vol soigne l'équipe de 4 % | **Pillard** : +6 % de dégâts par vol réussi dans le combat (max 3) | **Prince des voleurs** : 20 % ; 2 % de voler un parchemin du rang de l'étage |
| `alchi` | **Alchimiste de combat** | découverte | *Fiole volatile* (A, recharge 2) : fiole d'un élément de l'équipe, tous 70 % ; rupture pleine si l'élément est une faiblesse | **Herboriste** : la fiole soigne aussi l'équipe de 5 % | **Grenadier** : 110 % + brûlure ou poison 2 tours | **Transmutateur** : choisit l'élément faible commun au plus d'ennemis |
| `pisteur` | **Pisteur** | contrôle | *Marque du chasseur* (A, recharge 2) : marque (3 tours) : équipe +15 % de dégâts sur elle, révèle une faiblesse de plus | **Garde-forestier** : un allié frappé par la cible marquée gagne 10 d'énergie | **Chasseur de primes** : +25 % ; si la cible meurt, son or ×2 et le Pisteur rejoue | **Vigie** : marque 2 cibles |
| `dompteur` | **Dompteur** | célérité | *Compagnon* (P) : un familier (loup, faucon ou sanglier selon la race) attaque à la fin de chacun de ses tours : 35 % ATQ, élément du maître | **Ami des bêtes** : si un allié est sous 50 %, le familier le soigne de 4 % au lieu d'attaquer | **Maître de meute** : deux familiers | **Chimériste** : le familier frappe l'élément faible de sa cible |
| `garde` | **Garde du corps** | protection | *Interposition* (P) : 30 % de chances d'encaisser à la place d'un allié sous 50 % PV, dégâts encaissés −30 % | **Bouclier juré** : 50 % de chances | **Rempart vengeur** : chaque interposition riposte à 80 % | **Garde tacticienne** : chaque interposition donne 15 d'énergie et avance son tour de 20 % |
| `conteur` | **Conteur** | soutien | *Récit héroïque* (A, recharge 3) : +1 point de compétence ; l'allié le plus proche de son ultime gagne 20 d'énergie, les autres 10 | **Conteur des veillées** : + soin de 6 % à toute l'équipe | **Conteur de batailles** : l'allié qui reçoit 20 d'énergie gagne aussi ATQ +15 % (2 tours) | **Maître des légendes** : +2 points au lieu de +1, recharge 2 |
| `tacticien` | **Tacticien** | soutien | *Ordre de bataille* (A, recharge 3) : l'allié le plus fort avance de 50 % dans l'ordre des tours et gagne critique +20 % (1 action) | **Capitaine protecteur** : vise plutôt l'allié le plus blessé, + bouclier 10 % | **Commandant de choc** : l'allié agit immédiatement | **Grand stratège** : affecte 2 alliés |

Changer de sous-classe : **Reconversion** à l'Auberge, 300 × ★ or + 1 tome du rang de l'étoile ; la forme de voie suit (elle dépend de la personnalité). La sous-classe ne dépend pas de l'arme : elle reste active même hors harmonie.

### 4.4 Spécialisations (niv. 20, révélées)

**Décision : la spécialisation n'est pas choisie dans un menu, elle est révélée** par ce que le personnage *fait* (l'arme qu'il porte) et *est* (sa personnalité). Raisons :
- cohérent avec la règle du créateur (« tu ne choisis pas ce qu'il prend ») et avec le système existant où **l'arme fait déjà la classe** ;
- le joueur garde une **influence lisible** : à partir du niv. 15, la fiche affiche la spécialisation pressentie et sa probabilité ; changer d'arme ou d'armure avant le niv. 20 change le pronostic ;
- la sous-classe (niv. 10) et la passerelle (niv. 40) restent les deux vrais choix : on évite trois menus de choix successifs.

**Calcul** (`specOf(c)`, au passage du niv. 20 ; seules les spécialisations du rôle actuel sont candidates) :

```
score(spé) = 4 × [type d'arme ∈ spé.w] + 2 × [armure ou outil ∈ spé.t] + 3 × [c.pers ∈ spé.p]
           + 1 × (nombre de sous-traits ∈ spé.s) + 4 × [c.mage ∈ spé.m] + 1 × [c.elem ∈ spé.e]
probabilité affichée = score² / Σ score²  ;  tirage pondéré avec la graine c.seed (déterministe).
```

Le tirage est **déterministe** (graine) : recharger ne change rien ; seul l'équipement porté au moment du niv. 20 compte.

**Les 23 spécialisations**

| id | Spécialisation | Rôle | Arme (w) | Équipement (t) | Personnalités (p) | Sous-traits (s) | Mage (m) / élém. (e) | Mods | Identité mécanique |
|---|---|---|---|---|---|---|---|---|---|
| `epeiste` | **Épéiste** | guerrier | epee | – | Calculateur, Ambitieux, Stoïque | Méthodique, Discipliné, Compétitif | – | crit +5 % | précision, ruptures, parades |
| `berserker` | **Berserker** | guerrier | hache | – | Impulsif, Égoïste, Ambitieux | Colérique, Téméraire, Orgueilleux | feu | ATQ +8 %, DEF −8 % | plus il est blessé, plus il frappe : ATQ + (1 − PV%) × 60 % ; soins reçus −20 % |
| `chevalier` | **Chevalier** | guerrier | epee, hache | lourde, etendard | Altruiste, Stoïque, Gourmand | Loyal, Protecteur, Courageux | sacre | PV +8 % | frappe et protège : chaque technique pose un bouclier |
| `paladin` | **Paladin** | gardien | bouclier | relique, lourde | Altruiste, Stoïque | Protecteur, Dévoué, Compatissant | Sacrée / sacre | soins +15 % | protection et lumière : boucliers + soins de groupe |
| `rempart` | **Rempart** | gardien | bouclier | lourde | Stoïque, Calculateur, Gourmand | Résistant, Patient, Prudent | – | DEF +10 % | mur absolu : réduit les dégâts de toute l'équipe |
| `vengeur` | **Vengeur** | gardien | bouclier | cape | Impulsif, Égoïste, Ambitieux | Colérique, Déterminé, Vaniteux | foudre | ATQ +6 % | renvoie les dégâts, ripostes, représailles |
| `lameombre` | **Lame de l'ombre** | assassin | dagues | cape | Égoïste, Calculateur | Froid, Cynique, Solitaire | Obscure / ombre | crit +8 % | furtivité au premier tour, exécutions |
| `eclaireur` | **Éclaireur** | assassin | dagues | boussole, torche | Curieux, Opportuniste | Explorateur, Observateur, Débrouillard | – | VIT +8 | initiative, révèle les faiblesses, exploration (patrouilles −25 % de vue) |
| `duelliste` | **Duelliste** | assassin | dagues, epee | cuir | Ambitieux, Impulsif | Compétitif, Orgueilleux, Courageux | – | ATQ +5 %, crit +3 % | marque un adversaire, duel, parades |
| `empoisonneur` | **Empoisonneur** | assassin | dagues | potion, elixir | Calculateur, Gourmand, Curieux | Inventif, Méthodique, Manipulateur | nature | – | poisons cumulables (dégâts sur la durée) |
| `tireur` | **Tireur d'élite** | archer | arc | – | Calculateur, Stoïque, Égoïste | Patient, Froid, Prudent | – | crit +6 % | tirs uniques massifs, ignore la DEF |
| `rodeur` | **Rôdeur** | archer | arc | cuir, boussole | Curieux, Altruiste, Gourmand | Explorateur, Patient, Observateur | Naturelle / nature | PV +6 % | nature, ronces, ralentissements, petit soin |
| `tempete` | **Archer de tempête** | archer | arc | – | Impulsif, Ambitieux, Opportuniste | Téméraire, Spontané, Chanceux | foudre | VIT +5 | salves multiples, foudre, critiques en chaîne |
| `elementaliste` | **Élémentaliste** | sorcier | baton | robe | Impulsif, Ambitieux, Égoïste | Téméraire, Colérique, Orgueilleux | Élémentaire / feu, glace, foudre | ATQ +6 % | gros dégâts de zone + effet de l'élément |
| `arcaniste` | **Arcaniste** | sorcier | grimoire | robe | Curieux, Calculateur | Chercheur, Inventif, Méthodique | Arcanique / arcane | – | énergie et points de compétence, manipulation de l'ultime |
| `chrono` | **Chronomancien** | sorcier | baton, grimoire | sablier | Stoïque, Calculateur | Patient, Stratège, Discipliné | Temporelle | VIT +6 | ordre des tours |
| `occultiste` | **Occultiste** | sorcier | grimoire | – | Égoïste, Opportuniste, Calculateur | Manipulateur, Cynique, Rusé | Obscure / ombre | ATQ +5 %, PV −5 % | malédictions, sacrifice de PV contre puissance |
| `pretre` | **Prêtre** | soigneur | sceptre | relique | Altruiste, Stoïque, Calculateur | Compatissant, Empathique, Dévoué | Sacrée / sacre | soins +15 % | soins massifs, purification |
| `druide` | **Druide** | soigneur | sceptre, baton | – | Gourmand, Curieux, Altruiste | Cuisinier, Explorateur, Patient | Naturelle / nature | PV +6 % | soins sur la durée, régénération, ronces |
| `hemo` | **Hémomancien** | soigneur | sceptre | – | Égoïste, Ambitieux, Impulsif | Vaniteux, Colérique, Déterminé | ombre | ATQ +8 % | soigne en drainant les ennemis |
| `troubadour` | **Troubadour** | soutien | luth | – | Opportuniste, Gourmand, Curieux | Charmeur, Épicurien, Spontané | – | VIT +4 | énergie, points de compétence, or |
| `chantre` | **Chantre de guerre** | soutien | luth | etendard | Ambitieux, Impulsif, Égoïste | Compétitif, Téméraire, Orgueilleux | feu | ATQ +5 % | bonus d'ATQ et de critique, cris |
| `enchanteur` | **Enchanteur** | soutien | luth | relique | Calculateur, Stoïque, Altruiste | Stratège, Prudent, Généreux | Arcanique | DEF +6 % | enchante les alliés (DEF, élément), affaiblit les ennemis |

Exemples :
- **Jeanne** (Altruiste ; Loyal, Courageux ; épée, armure de cuir, Sacré) : Chevalier 3+1+1+1 (+ épée 4) = **10**, Épéiste 4, Berserker 0 → Chevalier ≈ 86 %.
- Un **Impulsif Colérique** qui porte une hache : Berserker 4+3+1 = 8, Chevalier 4 (la hache est aussi une arme de chevalier) → Berserker ≈ 80 %. S'il prend une épée au niv. 19 : Épéiste 4, Berserker 4 (personnalité + trait), Chevalier 4 → incertain, la fiche l'annonce.

### 4.5 Arme et spécialisation après le niv. 20

`c.cls.spec` est **verrouillée** au niv. 20 ; `c.role` reste calculé par `roleOf(c)`.

| Situation | Effet |
|---|---|
| Arme du **même rôle** que la spécialisation (ex. Épéiste avec une hache) | **En harmonie** : technique, ultime, nœuds V et mods de spécialisation actifs. |
| Arme d'un **autre rôle** (ex. Épéiste avec un arc) | **En sommeil** : le personnage joue le rôle de l'arc avec la technique d'arme (*Volée*), l'ultime d'apprenti de l'archer (×1,2 dès le niv. 35), sans mods de spécialisation ; les nœuds V sont grisés (« en sommeil ») ; tous les autres nœuds, la sous-classe et le métier restent actifs. Rien n'est perdu : reprendre une épée réveille tout. |
| Mage sans arme | rôle sorcier (règle actuelle) ; un mage spécialisé sorcier reste en harmonie. |

L'icône de rôle de l'équipe affiche un petit croissant gris « en sommeil » ; l'écran d'équipement prévient avant l'équipement (« Berserker → en sommeil avec un Bâton »).

### 4.6 Éveil (niv. 40) et passerelles

Au niv. 40 (gratuit, déclenché par le niveau, cinématique §10.4), le joueur choisit :
- **Éveil dans la voie** : forme éveillée de sa spécialisation ;
- **Passerelle** (si la spécialisation en a) : devient la spécialisation cible **au stade éveillé**. Condition : posséder (porté ou en réserve) une arme du rôle cible ; elle est équipée automatiquement. Les nœuds ≤ 40 sont conservés, les nœuds V au-delà sont régénérés pour la nouvelle spécialisation, la sous-classe est conservée.

Effets de l'éveil : technique éveillée (+25 % et effet de la forme), ultime +25 % et effet « 40 » (§5), bonus de stats ×1,12, VIT +3, crit +3 %.

| Spécialisation | Forme éveillée (40) | Passerelles possibles |
|---|---|---|
| Épéiste | **Maître-lame** — riposte innée 30 % | Duelliste |
| Berserker | **Fléau rouge** — immunisé au recul dans l'ordre des tours | Vengeur |
| Chevalier | **Chevalier-lige** — ses boucliers +30 % | Paladin |
| Paladin | **Croisé** — ses soins posent aussi un bouclier de 30 % de la valeur | Chevalier, Prêtre |
| Rempart | **Bastion** — provoque en permanence tant qu'il a plus de 50 % PV | Chevalier |
| Vengeur | **Némésis** — renvoie 15 % des dégâts subis en permanence | Berserker |
| Lame de l'ombre | **Ombre sans nom** — furtif aussi après chaque élimination | Duelliste, Occultiste |
| Éclaireur | **Vif-argent** — premier à agir à chaque combat | Rôdeur |
| Duelliste | **Maître duelliste** — 30 % de parade contre la cible défiée | Épéiste |
| Empoisonneur | **Maître des venins** — poison cumulable jusqu'à 5 | Occultiste |
| Tireur d'élite | **Tireur fantôme** — ses tirs ne peuvent pas rater (ténèbres comprises) | Lame de l'ombre |
| Rôdeur | **Gardien des bois** — obtient le familier du Dompteur (35 %) | Druide |
| Archer de tempête | **Tempétueux** — chaque critique ajoute une flèche (60 %) | Élémentaliste |
| Élémentaliste | **Archimage** — l'effet d'élément s'applique à toutes ses compétences | Archer de tempête |
| Arcaniste | **Haut-arcaniste** — +1 point de compétence tous les 3 tours | Chronomancien, Enchanteur |
| Chronomancien | **Gardien du temps** — l'équipe commence 20 % plus tôt dans l'ordre | Arcaniste |
| Occultiste | **Maître des pactes** — ses sacrifices de PV sont réduits de moitié | Hémomancien |
| Prêtre | **Grand prêtre** — soins +20 %, purifie à chaque soin | Paladin |
| Druide | **Archidruide** — ses soins sur la durée durent 1 tour de plus | Rôdeur |
| Hémomancien | **Seigneur du sang** — vol de vie 15 % sur toutes ses attaques | Occultiste |
| Troubadour | **Ménestrel royal** — or +15 %, l'équipe commence avec +15 d'énergie | Éclaireur |
| Chantre de guerre | **Skalde** — ses bonus d'ATQ durent 1 tour de plus | Chevalier |
| Enchanteur | **Haut-enchanteur** — ses enchantements touchent un second allié | Arcaniste |

### 4.7 Apogée (niv. 50)

« Max de base » : un éveil qui reste **très fort**. Bonus ×1,15, ultime ×1,5 + effet majeur (§5), compétence de forme dans le nœud V42 améliorée d'une rareté, métier au rang Grand maître possible.

| Spécialisation (ou cible de passerelle) | Apogée (50) | Effet de forme |
|---|---|---|
| Épéiste | **Sabre céleste** | chaque rupture qu'il provoque lui rend un point de compétence |
| Berserker | **Avatar de la Rage** | sous 30 % PV : dégâts +50 % et vol de vie 20 % |
| Chevalier | **Haut-chevalier de l'Aube** | équipe : dégâts subis −10 % tant qu'il est debout |
| Paladin | **Champion céleste** | ses boucliers soignent de 50 % de leur valeur restante en expirant |
| Rempart | **Citadelle** | dégâts subis par l'équipe −15 % |
| Vengeur | **Juge d'épines** | ses ripostes touchent tous les ennemis |
| Lame de l'ombre | **Faucheur** | ses coups achèvent les ennemis sous 12 % PV (hors boss) |
| Éclaireur | **Vent-du-sommet** | +1 action au premier tour de chaque combat |
| Duelliste | **Lame invaincue** | la cible défiée subit +35 % de ses dégâts |
| Empoisonneur | **Peste noire** | le poison se propage à un voisin à la mort |
| Tireur d'élite | **Flèche du destin** | ignore 50 % de DEF en permanence |
| Rôdeur | **Seigneur des bêtes** | familier ×2 de puissance, il provoque à sa place |
| Archer de tempête | **Œil du cyclone** | ses salves touchent +2 fois |
| Élémentaliste | **Avatar élémentaire** | ses dégâts comptent comme deux éléments (le sien + le plus faible) |
| Arcaniste | **Tisseur de mana** | les ultimes de l'équipe coûtent 80 d'énergie |
| Chronomancien | **Seigneur des heures** | les ennemis ne peuvent jamais agir deux fois de suite |
| Occultiste | **Prince abyssal** | ses malédictions se cumulent (2) |
| Prêtre | **Saint** | *Rappel des étoiles* utilisable une fois par combat sans contrepartie |
| Druide | **Esprit de la sève** | sa régénération touche aussi les alliés à terre (relève à 10 % une fois par expédition) |
| Hémomancien | **Cœur écarlate** | l'excédent de soin devient bouclier |
| Troubadour | **Voix d'or** | +1 point de compétence à chaque tour d'un allié sur deux |
| Chantre de guerre | **Tambour du monde** | équipe critique +15 % permanent |
| Enchanteur | **Tisse-destin** | ennemis : ATQ −15 % permanent |

### 4.8 Divinité (niv. 60, 6★ uniquement)

Les 6★ niv. 60 sont considérés comme des **dieux**. Bonus de stats ×1,60, VIT +5, crit +5 %, **passif divin**, **ultime divin**, emblème divin `cl_<spé>_divin`, aura dorée permanente sur le sprite et la fiche.

| Spécialisation | Forme divine | Fantaisie | Passif divin (identité) |
|---|---|---|---|
| Épéiste | **Souverain des Lames** | l'épée qui a tranché la première nuit | toute attaque de base devient *Lame croisée* ; ruptures ×2 |
| Berserker | **Titan du Carnage** | une colère que la Tour elle-même redoute | ne peut pas tomber sous 1 PV pendant 2 tours après un coup fatal (1 fois par combat) ; ATQ +1 % par % de PV manquant |
| Chevalier | **Seigneur-Soleil** | le serment fait chair | au début de chaque tour allié, bouclier de 6 % PV sur l'allié le plus faible |
| Paladin | **Égide incarnée** | un bouclier qui pense | dégâts subis par l'équipe −20 %, purification à chaque tour |
| Rempart | **Montagne éternelle** | rien ne passe | encaisse 30 % des dégâts de l'équipe, DEF ×1,5 |
| Vengeur | **Dieu des Représailles** | chaque coup reçu est une dette | renvoie 40 % des dégâts subis à leur auteur |
| Lame de l'ombre | **Nuit souveraine** | l'ombre entre deux étoiles | invisible tant qu'il n'a pas frappé deux fois ; critique ×2,2 |
| Éclaireur | **Messager des Étoiles** | le premier à voir le sommet | l'équipe agit toujours avant les ennemis au premier tour ; étage révélé à l'entrée |
| Duelliste | **Champion éternel** | n'a jamais perdu un duel | chaque ennemi vaincu le soigne de 15 % et rejoue |
| Empoisonneur | **Fléau primordial** | la décomposition de toute chose | poisons ×2, ignorent boucliers et résistances |
| Tireur d'élite | **L'Étoile filante** | une flèche par siècle, toujours au but | première attaque de chaque combat ×4 |
| Rôdeur | **Cœur de la Forêt-Monde** | la forêt marche avec lui | ronces permanentes : ennemis −15 % VIT, équipe régénère 3 %/tour |
| Archer de tempête | **Souverain des Tempêtes** | il pleut des flèches et des éclairs | chaque compétence déclenche une Chaîne d'éclairs (60 %) |
| Élémentaliste | **Dieu des Éléments** | les quatre éléments obéissent | frappe toujours une faiblesse |
| Arcaniste | **Source infinie** | le mana sans fond | l'équipe gagne +10 d'énergie à chaque tour |
| Chronomancien | **Éternité** | le temps n'a plus de prise | une fois par combat, rembobine l'équipe au début du tour précédent (PV, énergie) |
| Occultiste | **Néant** | ce qui reste quand tout s'éteint | ses malédictions dévorent 3 % PV max par tour (boss : 1 %) |
| Prêtre | **Aube incarnée** | la lumière qui relève | relève automatiquement le premier allié qui tombe (50 % PV), 1 fois par combat |
| Druide | **Mère-Forêt** | tout ce qui pousse la connaît | équipe régénère 8 %/tour |
| Hémomancien | **Dieu-Sang** | le cœur battant de la Tour | 100 % des dégâts qu'il inflige soignent l'équipe (répartis) |
| Troubadour | **Muse céleste** | sa chanson ouvre les cieux | équipe commence avec 50 d'énergie, +1 point par tour |
| Chantre de guerre | **Voix de la Guerre** | un cri qui fait trembler les étages | équipe ATQ +35 %, critique +20 % permanent |
| Enchanteur | **Harmonie** | l'accord parfait du monde | toutes les attaques de l'équipe touchent une faiblesse |

Les passifs divins qui empêchent la mort restent bornés (une fois par combat) conformément à la bible §7.5.

---

## 5. Ultimes

### 5.1 Règles

- Niv. 1–34 : **ultime d'apprenti** du rôle (`ROLES[r].ul`, inchangé).
- Niv. 35 : **ultime de spécialisation** (nom, icône `sk_ult_<spé>`, cinématique `cutIn` avec le nom).
- Niv. 40 : **+25 %** de puissance et effet « Éveil ».
- Niv. 50 : **×1,5** (cumulé : ×1,875 de la base) et effet « Apogée ».
- Niv. 60 : **×2,2** de la base ×1,875 (≈ ×4,1), nouveau nom divin et effet « Divin ».
- Hors harmonie (§4.5) : ultime d'apprenti du rôle porté, ×1,2.
- Coût d'énergie : 100 (80 avec Tisseur de mana).

Les multiplicateurs ci-dessous sont des % de l'ATQ (dégâts) ou des PV max / ATQ (soins) à la puissance de base (niv. 35).

### 5.2 Table des ultimes

| Spé. | Ultime (35) | Base | Éveil (40) | Apogée (50) | Divin (60) |
|---|---|---|---|---|---|
| Épéiste | **Mille entailles** | 6 coups de 70 % sur la cible ; rupture totale si faiblesse | +2 coups | chaque coup critique ajoute un coup (max 12) | **Lame de la première nuit** : 12 coups, le dernier ×3 |
| Berserker | **Rage écarlate** | 3 tours : ATQ +60 %, coups aussi sur les voisins (50 %), immunisé au contrôle | + vol de vie 15 % | dure 4 tours | **Cataclysme de chair** : 5 tours, ATQ +120 %, ne peut tomber sous 1 PV |
| Chevalier | **Serment d'acier** | cible 300 %, équipe bouclier 15 % PV, provoque 1 tour | boucliers 20 % | provoque 2 tours, dégâts subis −30 % | **Aube du serment** : cible 600 %, boucliers 35 %, équipe immunisée 1 tour |
| Paladin | **Jugement radieux** | équipe bouclier 20 % + soin 10 % ; ennemis 150 % (Sacré) | purifie | ennemis 250 % | **Lumière première** : équipe soin 50 %, bouclier 40 %, ennemis 400 % |
| Rempart | **Forteresse vivante** | 2 tours : encaisse 50 % des dégâts de l'équipe, DEF ×2 | 3 tours | renvoie 25 % des dégâts encaissés | **Montagne qui marche** : 3 tours, encaisse 100 %, DEF ×3 |
| Vengeur | **Représailles** | tous : 100 % ATQ + 50 % des dégâts subis pendant le combat (max 600 % ATQ) | max 800 % | se soigne de 30 % du total | **Dette de sang** : max 1 500 %, sans plafond contre les boss |
| Lame de l'ombre | **Danse des ombres** | intouchable 1 tour, puis 3 coups de 180 % sur l'ennemi le plus faible ; rejoue s'il tombe | 4 coups | exécute sous 20 % (hors boss) | **Éclipse** : 6 coups de 220 %, rejoue à chaque élimination |
| Éclaireur | **Embuscade parfaite** | toute l'équipe agit immédiatement, +1 point de compétence | +1 point | l'équipe gagne +20 d'énergie | **Ciel ouvert** : l'équipe joue deux fois de suite |
| Duelliste | **Duel à mort** | isole la cible 2 tours : 5 coups de 110 %, chaque critique ajoute un coup | 3 tours | la cible ne peut viser que lui, −30 % ATQ | **Combat éternel** : 10 coups de 150 % |
| Empoisonneur | **Nuée toxique** | tous : poison ×3 cumuls (25 % ATQ/tour) et DEF −20 % | ×4 cumuls | poison ignore les boucliers | **Fin de toute chose** : poison ×6, DEF −40 % |
| Tireur d'élite | **Tir du jugement** | cible 600 %, ignore 60 % DEF, ne rate jamais | 750 % | ignore 100 % DEF | **Trait d'étoile** : 1 500 %, traverse tous les ennemis (50 % aux autres) |
| Rôdeur | **Colère sylvestre** | tous 180 %, recul 20 %, équipe soin 8 % | soin 12 % | racines 2 tours (ennemis −30 % VIT) | **Forêt-Monde** : tous 350 %, équipe régénère 10 %/tour 3 tours |
| Archer de tempête | **Ouragan de flèches** | tous : 3 vagues de 90 % | 4 vagues | chaque vague peut critiquer deux fois | **Ciel déchiré** : 6 vagues + foudre (×1,3 Foudre) |
| Élémentaliste | **Cataclysme primordial** | tous 260 %, rupture ×2 | + effet d'élément ×2 | 2 éléments | **Genèse** : tous 520 %, frappe toujours une faiblesse |
| Arcaniste | **Singularité** | tous 220 %, annule les charges, équipe +25 d'énergie | +35 d'énergie | +2 points de compétence | **Big-bang** : tous 450 %, équipe +100 d'énergie (sauf lui) |
| Chronomancien | **Arrêt du temps** | les ennemis sautent leur prochain tour ; équipe +20 d'énergie | +30 d'énergie | 2 tours sautés pour les ennemis normaux | **Éternité figée** : les ennemis sautent 2 tours, l'équipe +50 d'énergie |
| Occultiste | **Pacte des abysses** | sacrifie 25 % PV : tous 300 % et malédiction (dégâts subis +20 %, 3 tours) | sacrifie 15 % | malédiction +30 % | **Néant dévorant** : tous 650 %, sacrifie 0 % |
| Prêtre | **Miracle** | équipe soin 35 % PV max, purifie, bouclier 10 % | bouclier 15 % | relève un allié à terre (25 %), 1 fois par combat | **Aurore** : relève tous les alliés à terre à 40 %, soin 60 % |
| Druide | **Floraison** | équipe régénère 10 %/tour (3 tours), DEF +20 % | 4 tours | + ronces : ennemis 60 %/tour | **Printemps éternel** : régénère 20 %/tour 4 tours, DEF +40 % |
| Hémomancien | **Marée écarlate** | tous 160 % ; l'équipe récupère 60 % des dégâts totaux | 80 % | excédent en bouclier | **Océan de sang** : tous 400 %, récupère 100 % |
| Troubadour | **Grand final** | équipe +40 d'énergie, +2 points de compétence | +50 d'énergie | l'allié le plus fort rejoue | **Symphonie céleste** : l'équipe ultime prête (100) sauf lui |
| Chantre de guerre | **Hymne des conquérants** | équipe ATQ +40 %, critique +20 % (2 tours), +2 points | 3 tours | + dégâts critiques ×1,8 | **Chant du monde** : ATQ +100 %, critique +40 % (3 tours) |
| Enchanteur | **Grand charme** | ennemis ATQ −30 % (2 tours) ; l'équipe frappe toutes les faiblesses 1 tour | 2 tours | ennemis DEF −30 % aussi | **Harmonie universelle** : ennemis ATQ/DEF −50 %, faiblesses 2 tours |

### 5.3 Jeanne

*Ordre du commandant* (cible 280 %, équipe ATQ +25 %) reste son ultime de 1 à 34, puis devient **la variante Chevalier** : 35 = cible 320 %, équipe ATQ +25 % et bouclier 12 % ; 40/50/60 suivent les mêmes multiplicateurs que *Serment d'acier* (divin : **Ordre de l'Aube**). Icône unique `sk_ult_commandant`.

---

## 6. Métiers

> **Implémenté** : postes, rangs, effets, évolution et les six nouveaux bâtiments sont en place ; tous les chiffres définitifs (y compris les écarts avec le tableau ci-dessous) sont dans `docs/metiers.md`.

### 6.1 Liste et effets

Un métier rend utile un personnage même faible en combat (bible §8). Effet **village** : quand le personnage est **en poste** (affecté au bâtiment indiqué, hors équipe ; chaque bâtiment a **autant de postes que son niveau**). Effet **expédition** : quand il est dans l'équipe. `r` = rang (1 apprenti … 7 grand maître).

| id | Métier | Bâtiment de poste | Effet village (par rang r) | Effet expédition | Évolution (niv. 45) | Bonus d'évolution |
|---|---|---|---|---|---|---|
| `cuisinier` | Cuisinier | Auberge | prépare un **repas** (20 vivres) avant chaque départ : équipe ATQ/DEF +2 %×r pour les 5 premiers combats | après chaque victoire, équipe PV +1 %×r | **Chef étoilé** | 2 repas cumulables, *Festin* gratuit |
| `architecte` | Architecte | Hôtel de ville (sinon : tout bâtiment) | coûts de construction et d'amélioration −4 %×r (max −28 %) | – | **Maître bâtisseur** | +1 emplacement de construction (7ᵉ), améliorations −10 % de plus |
| `chasseur` | Chasseur | Installations de chasse (sinon : expédition seule) | – | chance de matériaux de monstre +5 %×r ; dès r 4, +1 croc/cuir sur les élites | **Traqueur légendaire** | élites : 3 % de chances d'un parchemin du rang de l'étage |
| `cueilleur` | Cueilleur | Ferme | 1 poussière toutes les 10 min ÷ r (min. 2 min) | tas d'herbes : tissu 20 % → 20 + 6 %×r, + poussière dès r 3 | **Herboriste sylvain** | essences de Nature +1 par étage |
| `entraineur` | Entraîneur | Camp | séance : vivres −5 %×r, exp. +8 %×r | – | **Maître d'armes** | 2 personnages par séance ; la réserve d'exp. monte à 75 % au plafond |
| `fermier` | Fermier | Ferme | production +8 %×r, réserve max +10 %×r | – | **Seigneur des moissons** | la ferme produit aussi du bois (1/4 des vivres) |
| `forgeron` | Forgeron | Forge | catalyseur de rareté +0,15×r (§5 de `evolution.md`), affinage −5 %×r d'or ; renfort max +1 dès r 4 | – | **Forgeron des étoiles** | éveil d'objet : 1 pierre de moins (min. 1) ; chance 6★ ×2 à la fabrication |
| `eleveur` | Éleveur | Ferme | 1 cuir (et 1 tissu dès r 4) toutes les 15 min ÷ r | familier du Dompteur +10 %×r | **Maître des bêtes** | une monture : l'équipe se déplace 15 % plus vite dans les étages |
| `mineur` | Mineur | Entrepôt (sinon : Forge) | extraction : pierre 30 → 30 − 2×r par minerai | veines de cristal sans pioche dès r 3, +1 cristal dès r 5 | **Mineur des profondeurs** | 10 % de chances de noyau dans les veines |
| `alchimiste` | Alchimiste | Laboratoire d'alchimie (sinon : Infirmerie) | condenser la poussière 4 → 3 dès r 3 ; fusions −5 %×r d'or | élixirs +1 dose dès r 4 | **Grand alchimiste** | transmutation d'essences : 3 → 1 d'un autre élément |
| `marchand` | Marchand | Marché (sinon : Auberge) | dès r 3, **étal** à l'Auberge (3 offres/jour : fragments, tomes ★1–2, matériaux contre or) ; démantèlement +5 %×r d'or | or des combats +3 %×r | **Prince marchand** | 4ᵉ offre (parchemins ★1–3), prix −15 % |
| `apothicaire` | Apothicaire | Infirmerie | soin des blessés −8 %×r vivres ; risque de mort −2 points×r (min. 5 %) | potions +5 %×r de soin | **Grand apothicaire** | un blessé grave se soigne seul en 5 min |
| `cartographe` | Cartographe | Hôtel de ville (sinon : expédition seule) | – | révèle 10 %×r de la carte à l'entrée d'étage ; dès r 4 les coffres, dès r 6 les leviers et l'ordre runique | **Arpenteur des étoiles** | voit l'étage suivant (loi, biome, quête) avant d'y entrer |
| `bibliothecaire` | Bibliothécaire | Bibliothèque (sinon : Auberge) | niveaux de compétence −5 %×r d'or ; *Étudier* +3 niveaux dès r 5 ; recherches des mages −5 %×r de durée | – | **Archiviste** | 15 % de chances de récupérer le tome lors d'une évolution de rareté |

Bâtiments : 11 dans le code (`BLD`) : auberge, ferme, camp, inf, forge, et depuis les métiers `hdv`, `chasse`, `biblio`, `labo`, `entrepot`, `marche` (`docs/metiers.md` §1–2). Chaque métier a un **poste cible** et parfois un **repli** ; dès que le bâtiment cible existe, le poste y migre automatiquement.

Un personnage **niv. 60 divin** conserve son métier et ajoute l'**aura de Grand maître** : effet du rang 7 ×1,5.

### 6.2 Attribution au niv. 5

Au niv. 5, deux **vocations** sont tirées (sans remise) avec les poids ci-dessous ; la première est la **vocation naturelle** (+25 % d'expérience de métier). Le joueur confirme l'une des deux (écran de 2 cartes). Base 1 pour chaque métier.

| Source | Poids ajoutés |
|---|---|
| Altruiste | apothicaire +4, cuisinier +2, fermier +2, éleveur +2 |
| Ambitieux | marchand +3, forgeron +3, entraîneur +3, architecte +2 |
| Calculateur | architecte +4, marchand +3, bibliothécaire +3, alchimiste +2 |
| Impulsif | chasseur +5, mineur +3, entraîneur +2 |
| Stoïque | mineur +4, forgeron +4, fermier +2, entraîneur +2 |
| Curieux | cartographe +4, bibliothécaire +3, alchimiste +3, cueilleur +2 |
| Gourmand | cuisinier +6, fermier +2, éleveur +2 |
| Égoïste | marchand +4, chasseur +3, alchimiste +2 |
| Opportuniste | marchand +5, cueilleur +2, cartographe +2 |
| Sous-traits | Cuisinier → cuisinier +4 ; Gourmet → cuisinier +3 ; Chercheur → bibliothécaire +3 ; Explorateur → cartographe +3 ; Inventif → alchimiste +2, forgeron +1 ; Avare → marchand +3 ; Méthodique → architecte +2 ; Patient → fermier +2 ; Résistant → mineur +2 ; Compatissant → apothicaire +2 ; Débrouillard → cueilleur +2 ; Téméraire → chasseur +2 |
| Race | Nain : forgeron +2, mineur +2 · Elfe : cueilleur +2, apothicaire +2 · Gobelin : marchand +2, alchimiste +2 · Homme-bête : chasseur +2, éleveur +2 · Orc : mineur +2, chasseur +2 · Humain : architecte +1, fermier +1 |
| Mage (`c.mage`) | bibliothécaire +4, alchimiste +2 |

Changer de métier : **Reconversion** à l'Auberge (500 × ★ or), retour au rang Apprenti.

### 6.3 Rangs

Expérience de métier `c.job.pm` : **+1 toutes les 10 s en poste** (village ouvert, même horloge que les relations) ; **+20 par étage terminé** pour les métiers d'expédition dans l'équipe (chasseur, cueilleur, cartographe, et la part expédition des autres) ; ×1,25 pour la vocation naturelle.

| Rang | Nom | Points cumulés | Niveau de personnage requis |
|---|---|---|---|
| 1 | Apprenti | 0 | 5 |
| 2 | Novice | 100 | 10 |
| 3 | Travailleur | 300 | 20 |
| 4 | Confirmé | 700 | 30 |
| 5 | Expert | 1 500 | 40 |
| 6 | Maître | 3 000 | 45 (métier évolué) |
| 7 | Grand maître | 6 000 | 50 |

Le rang affiché est `min(rang par points, rang permis par le niveau)` ; les points continuent de s'accumuler au-delà.

### 6.4 Évolution du métier (niv. 45)

Automatique au niv. 45 : nouveau nom (tableau §6.1), icône `job_<id>_evo`, bonus d'évolution, accès aux rangs 6 et 7. Petite révélation (comme l'évolution de compétence, icône du métier qui se dore).

---

## 7. Arbre de compétences personnalisé

### 7.1 Principe

Chaque personnage possède **un arbre unique**, présenté comme une **frise verticale du niv. 1 au niv. 60**. Les nœuds se débloquent **automatiquement** à leur niveau : pas de points à dépenser, pas de choix. L'arbre est **visible à l'avance** (§7.4). Il remplace le tirage aléatoire actuel aux paliers (`learnRoll` tous les `c.gr.ms` niveaux avec une chance `c.gr.lc`) : un nœud est **garanti**, et ce qu'il contient est connu.

Deux personnages de même rôle diffèrent par : la **graine** (`c.seed`), la **personnalité** (poids forts), les **sous-traits** (poids moyens, combinaisons §6.1), la **race** et les **étoiles** (poids faibles, rareté), la **sous-classe** (nœud S), la **spécialisation** (nœuds V) et le **rythme** de leur personnalité (Curieux/Stoïque, §7.3).

### 7.2 Génération (déterministe)

```js
// emplacements : [niv., type] — type G générique, S sous-classe, V spécialisation, D divin ; act = active garantie
const SLOTS=[[3,'G'],[6,'G'],[8,'G',1],[12,'G'],[14,'S'],[16,'G'],[18,'G'],[22,'V'],[24,'G'],[26,'V'],[28,'G'],
             [32,'G'],[34,'G'],[37,'G'],[38,'G'],[42,'V'],[44,'G'],[47,'G'],[48,'G'],[52,'D'],[54,'D'],[56,'D'],[58,'D']];
const BANDW=[null,[70,25,5,0,0],[45,35,17,3,0],[25,35,30,9,1],[10,30,38,18,4],[0,15,40,33,12],[0,0,25,45,30]];
const bandOf=L=>Math.min(6,Math.floor((L-1)/10)+1);
function treeRng(c,L){let s=(c.seed*2654435761^L*40503^TREE_V*97)>>>0;return()=>{s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
```

Pour chaque emplacement, dans l'ordre des niveaux (un générateur `treeRng(c, niv.)` par emplacement, pour qu'un changement n'affecte que les nœuds concernés) :

1. **Famille** : poids `famW(c)` actuels (personnalité +4 à +7, sous-traits +1/+2, race +0,4/+0,8, rôle +0,1×★, combinaisons +3/+4), plus :
   - emplacement **S** : +2 sur la famille favorisée de la sous-classe (§4.3) ;
   - emplacement **V** : +3 sur chacune des **2 familles de la spécialisation** (tableau ci-dessous) ;
   - emplacement **D** : +2 sur les familles de la spécialisation, +1 sur la famille de l'âme.
2. **Compétence** dans la famille, parmi celles **absentes de l'arbre** et de rareté autorisée par la bande :
   `poids = BANDW[bande][r] × (1 + 0,06 × (★ − 1))^r × marque × signature × survie`
   - **marque** : ×3 si la compétence est marquée pour la spécialisation (colonne « Favorisé par » §8), ×2 pour la sous-classe ;
   - **signature** (§8.2) : ×5 pour sa personnalité, ×0,5 si un sous-trait vient de cette personnalité, ×0 sinon ;
   - **survie** (`dp` : Dernier souffle, Refus de mourir, Rappel des étoiles, Plume de phénix) : ×0,25 et **une seule par arbre**.
   - Si la famille n'a plus de candidat, on retire une famille.
3. **Inspiration** : avec la probabilité `(c.gr.lc − 0,5) / 2` (2,5 % à 22,5 %), le nœud est **inspiré** : la compétence est apprise **une rareté au-dessus** de sa rareté d'origine (même règle de puissance que l'évolution : +40 %, `skP`).
4. Emplacement niv. 8 (`act`) : si l'arbre ne contient encore aucune active, seules les actives sont candidates.

**Familles des spécialisations** (pour les nœuds V et D) :

| Spé. | Familles | Spé. | Familles | Spé. | Familles |
|---|---|---|---|---|---|
| Épéiste | dégâts, contrôle | Éclaireur | célérité, découverte | Arcaniste | découverte, soutien |
| Berserker | dégâts, célérité | Duelliste | célérité, chance | Chronomancien | contrôle, célérité |
| Chevalier | protection, dégâts | Empoisonneur | contrôle, découverte | Occultiste | contrôle, dégâts |
| Paladin | protection, soin | Tireur d'élite | dégâts, chance | Prêtre | soin, protection |
| Rempart | défense, protection | Rôdeur | contrôle, soin | Druide | soin, cuisine |
| Vengeur | défense, dégâts | Archer de tempête | célérité, dégâts | Hémomancien | soin, dégâts |
| Lame de l'ombre | dégâts, célérité | Élémentaliste | dégâts, contrôle | Troubadour | soutien, chance |
| | | | | Chantre de guerre | soutien, dégâts |
| | | | | Enchanteur | soutien, contrôle |

### 7.3 Rythme personnel (réutilise `c.gr`)

- `c.gr.ms ≤ 4` (Curieux, ou profil très rapide) : **+3 nœuds G** aux niv. 11, 31 et 51 (*Éclair de génie*, le niv. 51 est un nœud D).
- `c.gr.ms ≥ 6` (Stoïque) : **les nœuds 16, 37 et 47 disparaissent**, les nœuds 18, 38 et 48 tirent leur rareté dans la bande suivante (*Patience récompensée*).
- `c.gr.lc` (55–95 %) devient la **chance d'inspiration** (point 3 ci-dessus) : un 1★ (qui a un `lc` plus haut) a plus de nœuds inspirés — la personnalité les garde utiles.
- **Nœud d'étoile** : à chaque éveil d'étoile, un nœud G supplémentaire est ajouté au niveau de l'ancien plafond (10, 20, 30, 40 ou 50), tiré dans la bande du nouveau plafond. Un personnage né 4★+ reçoit un nœud d'étoile au niv. 1 (*Né sous une étoile*).

### 7.4 Visibilité, révélation, figement

| Zone de la frise | Affichage | Figé ? |
|---|---|---|
| Nœuds débloqués (niv. ≤ niveau actuel) | icône pleine, cadre de rareté, niveau de compétence | oui |
| Nœuds révélés (niv. ≤ plafond d'étoile) | icône pleine désaturée, nom, effet, « dans N niveaux » ; le prochain nœud pulse | oui, **au moment de la révélation** (création ou éveil d'étoile) — exception : S avant le choix de sous-classe et V avant le niv. 20, affichés comme **pressentis** (cadre pointillé, « selon votre sous-classe » / « si Berserker ») et figés au palier |
| Bande suivante (plafond < niv. ≤ plafond + 10) | « ? » sur fond de la **couleur de famille**, cadre de rareté | non (les sous-traits gagnés à l'éveil peuvent encore la changer) |
| Au-delà | silhouette « ??? » grise ; les **bannières de paliers** (5, 10, 20, 30, 35, 40, 45, 50, 60) restent toujours visibles | non |

Stockage : `c.tree = {v:1, fix:{"3":"brute", "6":"elan", …}, ins:[8,24], got:[3,6]}` (`fix` : nœuds figés, `ins` : niveaux inspirés, `got` : niveaux débloqués). `treeOf(c)` renvoie la liste complète : nœuds figés + nœuds calculés à la volée pour le reste.

Déblocage : dans `gain()`, à chaque niveau atteint, si un nœud existe à ce niveau → `c.skills.push({id, lv:1, r:S.r + inspiré, src:'arbre'})`, ou +2 niveaux si la compétence est déjà connue ; annonce via `NEWSK` (texte actuel « X apprend … »).

### 7.5 Compétences préparées

Avec ~25 compétences à niv. 60, le combat limite les **actives utilisables** : la technique + **4 actives préparées** (les passives sont toutes actives). Par défaut, les 4 actives de plus haute rareté (puis les plus récentes) sont préparées ; le joueur peut **épingler** une active sur la fiche. Ce n'est pas choisir ce que le personnage apprend, seulement ce qu'il emporte. Le bouton ⇄ / touche Q et l'IA ne parcourent que les préparées.

### 7.6 Exemple : deux Berserkers 3★

| Niv. | Brunehilde — Impulsif (Téméraire), Orc | Sören — Égoïste (Avare, Rusé), Humain |
|---|---|---|
| 1 | Fendoir · Âme ardente | Fendoir · Âme solitaire |
| 3 | Élan | Force brute |
| 6 | Double frappe | Bonne fortune |
| 8 | Assaut éclair (active garantie) | Tout ou rien |
| 10 | Sous-classe : Runiste | Sous-classe : Médic de campagne |
| 12 | Force brute | Main leste |
| 14 | Coup étourdissant (S : contrôle) | Premiers soins (S : soin) |
| 16 | Premier sang | *Moi d'abord* (signature Égoïste) |
| 18 | Tête la première (signature Impulsif) | Œil de lynx |
| 20 | Berserker : *Fendoir sanglant* | Berserker : *Fendoir sanglant* |
| 22 | Furie (V) | Frappe puissante (V) |
| 24 | Brasier | Soif de sang |
| 26 | Tourbillon (V, inspiré) | Écrasement sismique (V) |
| 28 | Fougue | Chasseur de trésors |
| 30 | Runiste de sang (Lame) | Chirurgien de guerre (Lame) |

---

## 8. Catalogue des compétences

**171 compétences au total** : 86 compétences d'arbre (59 actuelles conservées avec leurs identifiants + 18 nouvelles + 9 signatures), 9 âmes, 12 compétences de sous-classe, 10 techniques d'arme, 23 techniques de spécialisation, 7 ultimes d'apprenti, 23 ultimes de spécialisation, 1 ultime unique (Jeanne) — soit 171 icônes `sk_*`. Les effets sont donnés à puissance P = 1 (niveau 1, rareté d'origine) ; la puissance suit `skP` (+4 %/niveau, +40 %/rareté gagnée).

**Rareté → niveau minimum d'apparition dans l'arbre** : commune, peu commune, rare : niv. 3 · épique : niv. 12 · légendaire : niv. 22 (poids `BANDW`, §7.2).

Colonnes : **Favorisé par** = spécialisations (×3, marque) et sous-classes (×2) · personnalités (via les familles et combinaisons). **Icône** : clé `sk_<id>`, 32×32, emblème pixel-art gras sur fond transparent, contour sombre `#1d1430`, couleur dominante = couleur de la famille (`FAM`).

### 8.1 Âmes (niv. 1, une par personnalité — reprend `PERS`)

| id | Nom | Effet | Icône `sk_ame_*` |
|---|---|---|---|
| `ame_altruiste` | Âme dévouée | soins et boucliers +20 % | cœur doré entouré de deux mains ouvertes |
| `ame_ambitieux` | Âme conquérante | ATQ +10 % | couronne rouge sur une épée dressée |
| `ame_calculateur` | Âme lucide | critique +12 % | œil violet inscrit dans un losange de cible |
| `ame_impulsif` | Âme ardente | VIT +8, DEF −10 % | flamme orange en forme d'éclair |
| `ame_stoique` | Âme de roc | PV et DEF +12 % | montagne grise avec un halo calme |
| `ame_curieux` | Âme chercheuse | rupture de ténacité +30 % | loupe cyan sur une étoile |
| `ame_gourmand` | Âme gourmande | récupère 5 % PV à chaque tour | bol fumant ambré avec une cuillère |
| `ame_egoiste` | Âme solitaire | dégâts des compétences +15 % (s'isole) | silhouette sombre auréolée de rouge, dos tourné |
| `ame_opportuniste` | Âme filoute | critique +6 %, or +10 % | pièce turquoise lancée avec un clin d'œil |

### 8.2 Signatures de personnalité (nœuds d'arbre, ×5 pour leur personnalité)

| id | Nom | Pers. | Fam. | A/P | Effet (P = 1) | Rareté | Icône |
|---|---|---|---|---|---|---|---|
| `mainten` | Main tendue | Altruiste | soin | P | quand un allié passe sous 30 % PV, agit aussitôt pour le soigner de 12 % PV max (une fois par allié et par combat) | rare | main verte tendue vers une petite silhouette, éclats de lumière |
| `couronne` | Vers la couronne | Ambitieux | dégâts | P | ATQ +3 % par ennemi qu'il achève (max 5), +1 point de compétence au 3ᵉ | rare | couronne rouge au-dessus de marches montantes |
| `echiquier` | Échiquier | Calculateur | contrôle | A (3) | la cible et l'ennemi le plus rapide reculent de 30 % ; prochain coup de l'équipe sur eux critique assuré | rare | pièce de cavalier violette sur damier |
| `foncer` | Tête la première | Impulsif | célérité | A (2) | cible 170 %, agit en premier au tour suivant ; subit +10 % de dégâts 1 tour | peu commune | tête casquée chargeant avec traînée orange |
| `roc` | Roc immuable | Stoïque | défense | P | ne subit jamais plus de 25 % de ses PV max en un coup (−2 points par niveau de puissance, min. 15 %) | rare | rocher gris fendu d'une ligne de lumière, impact qui rebondit |
| `eureka` | Eurêka ! | Curieux | découverte | P | la première faiblesse touchée de chaque combat : rupture ×2 et +1 point de compétence | peu commune | ampoule cyan avec un point d'exclamation |
| `gouter` | Goûteur | Gourmand | cuisine | P | soins reçus +12 % ; les potions qu'il boit soignent ×1,5 | peu commune | langue/cuillère dorée au-dessus d'une marmite |
| `moidabord` | Moi d'abord | Égoïste | dégâts | P | dégâts +14 % ; reçoit 50 % de plus des soins de groupe, les autres alliés −3 % | rare | main rouge qui attire une pièce vers soi |
| `aubaine` | Aubaine | Opportuniste | chance | P | quand un ennemi est brisé : +1 point de compétence et son prochain coup sur lui critique ×1,8 (au lieu de ×1,5) | rare | fer à cheval turquoise frappant une cible fissurée |

### 8.3 Compétences d'arbre par famille (59 actuelles + 18 nouvelles)

Les compétences existantes gardent **id, nom, effet et rareté** (`SKILLS`) ; les nouvelles sont marquées ✚.

#### Soutien — `#ffcf4a` (doré)

| id | Nom | A/P (rech.) | Effet (P = 1) | Rareté | Favorisé par | Icône — visuel |
|---|---|---|---|---|---|---|
| `cri` | Cri de ralliement | A (2) | équipe ATQ +15 % (2 tours) | commune | Chantre, Chevalier · Porte-étendard · Ambitieux, Altruiste | bouche criant avec trois ondes dorées |
| `inspir` | Inspiration | A (3) | +2 points de compétence ; l'allié le plus proche de son ultime +25 d'énergie | peu commune | Troubadour, Arcaniste · Conteur · Curieux | étoile dorée jaillissant d'une tête stylisée |
| `donabs` | Don absolu | A (3) | sacrifie 20 % PV : l'allié le plus blessé +35 % PV max et 30 d'énergie | rare | Prêtre, Paladin · Altruiste | deux mains se passant un cœur lumineux |
| `aura` | Aura bienveillante | P | début de combat : équipe ATQ +5 % | commune | Enchanteur, Troubadour · Porte-étendard · Altruiste | halo doré concentrique en trois anneaux |
| `miroir` | Miroir empathique | P | à chacun de ses tours : soigne 8 % un allié sous 40 %, sinon +15 d'énergie à l'allié qui en a le moins | épique | Prêtre, Enchanteur · Altruiste (Empathique) | miroir ovale doré reflétant un cœur |
| `chef` | Chef de file | P | début : +1 point de compétence, VIT équipe +4 | rare | Chevalier, Chantre · Tacticien · Ambitieux | bannière triangulaire plantée, pointe dorée |
| `refrain` ✚ | Refrain tenace | P | les bonus d'équipe qu'il lance durent 1 tour de plus | rare | Chantre, Troubadour · Conteur | trois notes de musique dorées en spirale |

#### Soin — `#5fe07a` (vert)

| id | Nom | A/P (rech.) | Effet (P = 1) | Rareté | Favorisé par | Icône — visuel |
|---|---|---|---|---|---|---|
| `premsoins` | Premiers soins | A (1) | allié le plus blessé : 90 % ATQ + 6 % PV max | commune | Prêtre, Druide · Médic | croix verte avec un bandage enroulé |
| `rosee` | Rosée apaisante | A (3) | équipe : 50 % ATQ + 4 % PV max | peu commune | Druide, Rôdeur | trois gouttes de rosée sur une feuille |
| `regen` | Régénération | P | récupère 4 % PV à chacun de ses tours | commune | Druide, Berserker · Gourmand | spirale verte ascendante avec un « + » |
| `bened` | Bénédiction | P | soins et boucliers prodigués +20 % | rare | Prêtre, Paladin · Altruiste | mains jointes avec rayons verts et dorés |
| `souffle` | Souffle de vie | A (4) | équipe : 15 % PV max + léger bouclier (6 %) | épique | Prêtre, Druide | tourbillon vert qui emporte une feuille |
| `rappel` | Rappel des étoiles | A (1×/combat) | relève un allié à 30 % PV ; le lanceur perd 20 % PV et toute son énergie | légendaire · survie | Prêtre · Altruiste | étoile filante descendant sur une silhouette couchée |
| `mainten` | *(signature, §8.2)* | | | | | |
| `vampir` ✚ | Soif de sang | P | vol de vie : 12 % des dégâts infligés | rare | Hémomancien, Berserker · Égoïste | croc rouge et vert d'où perle une goutte |
| `phenix` ✚ | Plume de phénix | P (1×/expédition) | quand il tombe : renaît à 40 % PV et brûle les ennemis (150 %) | légendaire · survie | Prêtre, Élémentaliste (Feu) | plume enflammée dorée et verte |

#### Protection — `#bfe8ff` (bleu ciel)

| id | Nom | A/P (rech.) | Effet (P = 1) | Rareté | Favorisé par | Icône — visuel |
|---|---|---|---|---|---|---|
| `egide` | Égide | A (1) | bouclier sur l'allié le plus blessé : 120 % DEF + 8 % PV max | commune | Paladin, Chevalier · Garde du corps · Altruiste | écu bleu ciel avec un éclat en étoile |
| `murviv` | Mur vivant | A (3) | provoque (2 tours) et DEF +30 % | peu commune | Rempart, Vengeur | pan de mur bleuté avec un chevron de provocation |
| `garde` | Garde rapprochée | P | début : bouclier de 12 % PV sur l'allié le plus fragile | commune | Chevalier, Rempart · Garde du corps | petit écu devant une silhouette |
| `coeur` | Cœur sacrificiel | P | prend 25 % des dégâts destinés aux alliés (au-dessus de 30 % PV) | rare | Paladin · Garde du corps · Altruiste | cœur fendu abrité par un bouclier |
| `promesse` | Promesse inviolable | A (4) | allié le plus fragile : bouclier 20 % PV, dégâts subis −40 % (3 tours) | épique | Paladin, Chevalier · Altruiste (Loyal) | deux auriculaires liés par un ruban lumineux |
| `dernier` | Dernier souffle | P (1×/combat) | empêche un coup fatal sur un allié (1 PV) ; le lanceur perd 25 % PV | épique · survie | Paladin, Chevalier · Altruiste | bougie presque éteinte derrière un bouclier |
| `sentinel` ✚ | Sentinelle | P | quand un allié subit un critique : +20 d'énergie et bouclier 6 % PV sur cet allié | peu commune | Rempart, Chevalier · Garde du corps | œil ouvert gravé au centre d'un écu |

#### Dégâts — `#ff5a5a` (rouge)

| id | Nom | A/P (rech.) | Effet (P = 1) | Rareté | Favorisé par | Icône — visuel |
|---|---|---|---|---|---|---|
| `frappe` | Frappe puissante | A (1) | cible 200 % | commune | Berserker, Épéiste, Chevalier | étoile d'impact rouge avec onde de choc |
| `tourb` | Tourbillon | A (2) | tous 90 % | peu commune | Berserker, Élémentaliste | arc de lame rouge en cercle complet |
| `grace` | Coup de grâce | A (2) | cible 160 %, doublé sous 40 % PV | rare | Lame de l'ombre, Duelliste | dague plongeant vers un crâne |
| `brute` | Force brute | P | ATQ +8 % | commune | Berserker, Vengeur · Égoïste, Ambitieux | poing serré avec traits de force |
| `gloire` | Soif de gloire | P | +10 % de dégâts par ennemi vaincu (3 fois) | peu commune | Duelliste, Berserker · Ambitieux | couronne de laurier rouge |
| `meteore` | Frappe météore | A (3) | cible 340 %, ignore 40 % DEF | épique | Épéiste, Tireur d'élite | météore rouge-orangé en piqué |
| `lame` | Lame des étoiles | A (4) | tous 200 %, rupture accrue | légendaire | Épéiste, Élémentaliste | épée constellée d'étoiles, halo rouge |
| `brasier` ✚ | Brasier | A (2) | cible 120 % + brûlure 3 tours (20 % ATQ/tour) ; Feu : ×1,2 | peu commune | Élémentaliste, Berserker, Chantre | flamme rouge-orangé en spirale |
| `chaine` ✚ | Chaîne d'éclairs | A (3) | 130 % qui rebondit 3 fois (−20 % par rebond) | rare | Archer de tempête, Élémentaliste | éclair violet en zigzag ramifié |
| `rayon` ✚ | Rayon sacré | A (2) | cible 180 % (×1,5 contre Ombre/spectres), soigne le lanceur de 10 % des dégâts | rare | Paladin, Prêtre · Exorciste | rayon doré vertical sur une cible |
| `nova` ✚ | Nova arcanique | A (4) | tous 170 %, retire boucliers et bonus ennemis | épique | Arcaniste, Occultiste | orbe rose qui explose en anneau |
| `ecrase` ✚ | Écrasement sismique | A (3) | tous 140 % ; ×1,5 sur les ennemis brisés | épique | Berserker, Rempart, Vengeur | marteau frappant le sol, fissures rayonnantes |
| `couronne`, `moidabord` | *(signatures, §8.2)* | | | | | |

#### Contrôle — `#c58bff` (violet)

| id | Nom | A/P (rech.) | Effet (P = 1) | Rareté | Favorisé par | Icône — visuel |
|---|---|---|---|---|---|---|
| `entrave` | Entrave | A (2) | cible 80 %, recule de 30 % dans l'ordre | commune | Chronomancien, Rôdeur · Saboteur | chaînes violettes en boucle |
| `pointf` | Point faible | A (3) | DEF de la cible −30 % (3 tours), puis 60 % | peu commune | Tireur d'élite, Empoisonneur · Pisteur | cible fissurée en son centre |
| `intim` | Intimidation | A (3) | ennemis ATQ −20 % (2 tours) | peu commune | Vengeur, Chantre, Enchanteur | masque grimaçant violet |
| `etourd` | Coup étourdissant | A (3) | cible 120 %, entame la ténacité même sans faiblesse | rare | Rempart, Épéiste | marteau entouré de petites étoiles qui tournent |
| `analyse` | Analyse | P | +12 % de dégâts sur faiblesse, rupture +20 % | commune | Tireur d'élite, Arcaniste · Runiste · Calculateur | loupe sur un hexagone de faiblesse |
| `temps` | Maître du temps | A (5) | ennemis reculent fortement ; équipe +20 d'énergie | légendaire | Chronomancien | sablier violet fissuré |
| `lancegl` ✚ | Lance de glace | A (2) | cible 150 %, recule de 25 % (Glace : 40 %) | peu commune | Élémentaliste, Chronomancien | éclat de glace pointu, bleu-violet |
| `ronces` ✚ | Ronces | A (3) | tous 60 % + racines (recul 15 %) | peu commune | Rôdeur, Druide | lianes épineuses vertes et violettes en cercle |
| `toxine` ✚ | Toxine | P | ses coups ont 25 % de chances d'empoisonner (3 tours, 20 % ATQ/tour, cumul 3) | peu commune | Empoisonneur, Lame de l'ombre · Alchimiste | goutte verte marquée d'un crâne |
| `malefice` ✚ | Maléfice | A (3) | cible : dégâts subis +20 % et soins reçus −50 % (3 tours) | rare | Occultiste, Hémomancien | œil violet entouré de runes sombres |
| `echiquier` | *(signature, §8.2)* | | | | | |

#### Défense — `#a9a6b8` (gris acier)

| id | Nom | A/P (rech.) | Effet (P = 1) | Rareté | Favorisé par | Icône — visuel |
|---|---|---|---|---|---|---|
| `peau` | Peau de pierre | P | DEF +10 % | commune | Rempart · Stoïque | bras couvert d'écailles de pierre |
| `vigueur` | Vigueur | P | PV +10 % | commune | Rempart, Chevalier · Stoïque, Gourmand | cœur gris musclé avec un « + » |
| `riposte` | Riposte | P | 25 % de chances de contre-attaquer (60 %) quand il est frappé | peu commune | Vengeur, Épéiste · Garde du corps | deux épées croisées avec flèche de retour |
| `inebr` | Inébranlable | P | sous 30 % PV : dégâts subis −30 % | rare | Rempart, Berserker | pied ancré dans un rocher |
| `forter` | Forteresse | A (3) | bouclier sur soi (200 % DEF + 12 % PV) et se met en garde | peu commune | Rempart, Paladin | tour de château grise crénelée |
| `refus` | Refus de mourir | P (1×/expédition) | survit à un coup fatal avec 1 PV ; énergie à zéro, ATQ −20 % | légendaire · survie | Berserker, Vengeur · Stoïque, Impulsif | crâne fissuré d'où sort une flamme |
| `epines` ✚ | Peau d'épines | P | renvoie 12 % des dégâts de mêlée subis | peu commune | Vengeur, Rempart | carapace grise hérissée de pointes |
| `roc` | *(signature, §8.2)* | | | | | |

#### Chance et butin — `#4de0c0` (turquoise)

| id | Nom | A/P (rech.) | Effet (P = 1) | Rareté | Favorisé par | Icône — visuel |
|---|---|---|---|---|---|---|
| `fortune` | Bonne fortune | P | or gagné en combat +10 % | commune | Troubadour · Contrebandier · Opportuniste | pièce turquoise brillante |
| `lynx` | Œil de lynx | P | critique +6 % | commune | Tireur d'élite, Lame de l'ombre | œil félin à pupille fendue |
| `coupch` | Coup de chance | A (2) | cible 150 %, critique +40 % | peu commune | Duelliste, Archer de tempête | dé en vol montrant un 6 |
| `toutrien` | Tout ou rien | A (2) | une chance sur deux : 320 %, sinon 50 % | rare | Duelliste · Opportuniste, Impulsif | pièce à deux faces (étoile / crâne) |
| `trefle` | Trèfle à quatre feuilles | P | 12 % d'esquive | épique | Éclaireur, Troubadour | trèfle turquoise à quatre feuilles |
| `leste` | Main leste | P | 15 % de chances de dérober un éclat après une victoire | peu commune | Éclaireur · Contrebandier · Égoïste (Avare) | main gantée saisissant un éclat |
| `tresor` ✚ | Chasseur de trésors | P | coffres : 20 % d'un objet de plus ; élites : 30 % d'une essence de plus | rare | Éclaireur, Troubadour · Contrebandier · Opportuniste, Curieux | coffre ouvert d'où jaillit un éclat |
| `aubaine` | *(signature, §8.2)* | | | | | |

#### Découverte — `#6fd3ff` (cyan)

| id | Nom | A/P (rech.) | Effet (P = 1) | Rareté | Favorisé par | Icône — visuel |
|---|---|---|---|---|---|---|
| `erudit` | Érudit | P | expérience +15 % | commune | Arcaniste · Curieux | livre ouvert cyan avec une étoile |
| `flair` | Flair d'explorateur | P | ressources trouvées en combat +25 % | peu commune | Éclaireur, Rôdeur | boussole à aiguille scintillante |
| `invent` | Étincelle d'invention | A (2) | projectile de l'élément faible de la cible (140 %), forte rupture | rare | Arcaniste, Empoisonneur · Alchimiste | engrenage cyan qui crache une étincelle |
| `etude` | Étude des monstres | P | début : ténacité des ennemis −20 % | rare | Tireur d'élite · Pisteur | bestiaire ouvert avec une griffure |
| `alchim` | Alchimie | A (4) | équipe +25 d'énergie, +1 point de compétence | épique | Arcaniste · Alchimiste | fiole cyan qui bouillonne |
| `carto` ✚ | Cartographie mentale | P | entrée d'étage : 15 % de la carte révélée ; l'équipe a l'initiative contre les patrouilles | peu commune | Éclaireur, Rôdeur · Cartographe (métier : +5 %) | parchemin de carte avec une croix cyan |
| `eureka` | *(signature, §8.2)* | | | | | |

#### Cuisine — `#e8945a` (ambre)

| id | Nom | A/P (rech.) | Effet (P = 1) | Rareté | Favorisé par | Icône — visuel |
|---|---|---|---|---|---|---|
| `encas` | En-cas partagé | A (2) | allié le plus blessé : 12 % PV et 15 d'énergie | commune | Druide, Troubadour · Gourmand | sandwich croustillant |
| `festin` | Festin | P | après chaque victoire, équipe +8 % PV | peu commune | Druide · Gourmand | gigot doré |
| `ragout` | Ragoût fortifiant | P | début : équipe ATQ et DEF +5 % | rare | Rempart, Chevalier · Gourmand | marmite fumante |
| `epices` | Épices de feu | A (3) | allié le plus fort : ATQ +25 % (2 tours), agit plus tôt | peu commune | Chantre · Gourmand, Impulsif | piment enflammé |
| `banquet` | Banquet légendaire | A (5) | équipe : 25 % PV max et ATQ +25 % (2 tours) | légendaire | Druide, Troubadour · Gourmand | cloche de service dorée soulevée, vapeur |
| `gouter` | *(signature, §8.2)* | | | | | |

#### Célérité — `#ff9a3a` (orange)

| id | Nom | A/P (rech.) | Effet (P = 1) | Rareté | Favorisé par | Icône — visuel |
|---|---|---|---|---|---|---|
| `elan` | Élan | P | VIT +6 | commune | Éclaireur, Archer de tempête · Impulsif | botte ailée orange |
| `double` | Double frappe | A (1) | deux coups de 80 % | commune | Duelliste, Éclaireur | deux traits de slash parallèles |
| `assaut` | Assaut éclair | A (3) | cible 130 %, puis rejoue | peu commune | Éclaireur, Lame de l'ombre | éclair orange en forme de flèche |
| `premier` | Premier sang | P | commence avec 30 d'énergie et agit plus tôt | peu commune | Lame de l'ombre, Éclaireur · Impulsif | goutte rouge et chevron orange |
| `furie` | Furie | A (3) | quatre coups de 60 % au hasard | rare | Berserker, Archer de tempête | quatre griffures orange |
| `fougue` | Fougue | P | après un critique : +15 d'énergie, son tour arrive plus vite | épique | Duelliste · Impulsif | flamme orange en chevron double |
| `voile` ✚ | Voile d'ombre | P | début de combat : impossible à cibler jusqu'à sa première action | rare | Lame de l'ombre, Occultiste | cape violette qui se dissout en fumée orange |
| `hate` ✚ | Hâte | A (3) | l'allié le plus lent agit immédiatement, VIT +15 (2 tours) | rare | Chronomancien, Troubadour · Tacticien | horloge à ailes orange |
| `foncer` | *(signature, §8.2)* | | | | | |

Récapitulatif des compétences d'arbre : soutien 7, soin 8, protection 7, dégâts 12, contrôle 10, défense 7, chance 7, découverte 6, cuisine 5, célérité 8 = **77** (59 actuelles + 18 ✚), plus les **9 signatures** (§8.2) = **86 compétences d'arbre**. Un arbre de niv. 60 en utilise 23 à 26 : environ un tiers de la réserve, ce qui garde chaque personnage singulier.

### 8.4 Techniques de spécialisation (niv. 20 ; éveillées au niv. 40 : +25 % et effet de forme ; divines au niv. 55 : +30 %)

| id | Spé. | Technique | Effet (P = 1, 1 point) | Icône `sk_tech_<spé>` |
|---|---|---|---|---|
| `tech_epeiste` | Épéiste | **Lame croisée** | 2 coups de 130 % ; le 2ᵉ critique assuré si le 1ᵉʳ brise | deux arcs de slash bleu acier en X |
| `tech_berserker` | Berserker | **Fendoir sanglant** | cible 240 %, vol de vie 10 % | hache rouge avec arc de sang |
| `tech_chevalier` | Chevalier | **Charge du serment** | cible 200 % + bouclier 10 % PV sur l'allié le plus faible | lance et écu doré en charge |
| `tech_paladin` | Paladin | **Bouclier béni** | provoque 2 tours, bouclier sur soi (200 % DEF), équipe soin 6 % | écu doré rayonnant d'une croix |
| `tech_rempart` | Rempart | **Mur d'acier** | provoque 2 tours, dégâts subis par l'équipe −15 % (1 tour) | mur d'acier riveté bleu-gris |
| `tech_vengeur` | Vengeur | **Bouclier épineux** | provoque, renvoie 30 % des dégâts reçus (2 tours) | bouclier à pointes avec éclair |
| `tech_lameombre` | Lame de l'ombre | **Coup sournois** | cible 280 % ; ×1,5 si la cible n'a pas encore agi | dague violette sortant d'une ombre |
| `tech_eclaireur` | Éclaireur | **Frappe-éclair** | cible 160 %, révèle une faiblesse, avance de 30 % | dague orange avec traînée de vitesse |
| `tech_duelliste` | Duelliste | **Défi** | cible 220 %, la marque : dégâts mutuels +20 %, pare 30 % de ses attaques | gant jeté entre deux rapières |
| `tech_empoisonneur` | Empoisonneur | **Lame enduite** | cible 160 % + poison 3 tours (25 % ATQ/tour, cumul 3) | dague dégoulinant de venin vert |
| `tech_tireur` | Tireur d'élite | **Tir visé** | cible 260 %, ignore 30 % DEF, critique +15 % | flèche dans un viseur en croix |
| `tech_rodeur` | Rôdeur | **Flèche de ronces** | 2 flèches de 110 %, racines (recul 20 %) | flèche entourée de ronces vertes |
| `tech_tempete` | Archer de tempête | **Salve** | 5 flèches de 55 % au hasard, critique +10 % | éventail de cinq flèches électriques |
| `tech_elementaliste` | Élémentaliste | **Nova élémentaire** | tous 120 % + effet de son élément (Feu brûlure · Glace recul · Foudre rebond · Nature racines · Sacré soin 5 % · Ombre DEF −10 % · Arcane +10 d'énergie) | orbe multicolore à quatre quartiers qui éclate |
| `tech_arcaniste` | Arcaniste | **Missiles arcaniques** | 4 missiles de 60 % ; +10 d'énergie à l'allié le plus proche de son ultime | quatre losanges roses en éventail |
| `tech_chrono` | Chronomancien | **Distorsion** | cible 110 %, recule de 35 % ; un allié avance de 20 % | cadran d'horloge tordu en spirale |
| `tech_occultiste` | Occultiste | **Malédiction** | cible 130 % (Ombre), dégâts subis +20 % (3 tours) | crâne violet entouré d'un cercle runique |
| `tech_pretre` | Prêtre | **Lumière salvatrice** | allié le plus blessé : 180 % ATQ + 10 % PV max, purifie | colonne de lumière dorée sur une croix verte |
| `tech_druide` | Druide | **Bourgeon** | 2 alliés : soin sur 3 tours (8 % PV/tour) | bourgeon vert qui s'ouvre |
| `tech_hemo` | Hémomancien | **Saignée** | cible 140 %, soigne l'allié le plus blessé de 100 % des dégâts | goutte rouge reliée à une croix verte |
| `tech_troubadour` | Troubadour | **Ballade entraînante** | équipe +10 d'énergie, +1 point de compétence | luth doré avec notes turquoise |
| `tech_chantre` | Chantre de guerre | **Chant de guerre** | allié le plus fort : ATQ +45 %, critique +15 % (2 tours), agit immédiatement | cor de guerre rouge soufflant des ondes |
| `tech_enchanteur` | Enchanteur | **Enchantement** | allié : DEF +30 %, son arme gagne l'élément faible de la cible (2 tours) | baguette dessinant un sceau rose sur une épée |

Les **compétences de sous-classe** (12) sont décrites §4.3, les **ultimes** §5 ; leurs icônes au §12.

### 8.5 Fourchettes de puissance par rang (référence d'équilibrage)

| Rang | Active mono-cible | Active de zone | Soin mono | Soin de groupe | Passif stat | Bouclier |
|---|---|---|---|---|---|---|
| Commune | 180–220 % | 80–110 % | 90 % ATQ + 6 % PV | – | +6–10 % | 120 % DEF + 8 % PV |
| Peu commune | 120–170 % + effet | 60–90 % + effet | – | 50 % ATQ + 4 % PV | +10–15 % / effet conditionnel | 200 % DEF + 12 % PV |
| Rare | 160–220 % + effet fort | 90–140 % | 12–35 % PV | – | +12–20 % ou réaction | 15–20 % PV |
| Épique | 300–350 % (ignore DEF) | 140–170 % + effet | – | 15 % PV + bouclier | effets d'équipe | 20 % PV + −40 % dégâts |
| Légendaire | – | 200 % + rupture | relève (limité) | 25 % PV + buff | 1×/combat | – |
| Technique (niv. 1 / 20) | 220–260 % | 110–120 % | 160–180 % ATQ + 8–10 % PV | – | – | 200 % DEF |
| Ultime (35 / 40 / 50 / 60) | 300–600 % → ×1,25 → ×1,875 → ×4,1 | 180–300 % → idem | 35 % PV → idem | | | |

Plafonds globaux (déjà en partie dans `deal`) : réduction de dégâts 80 %, esquive 30 %, critique 75 %, recul d'ordre ≤ 1 tour complet par action, aucune immunité totale plus de 1 tour sauf divinités (bornées).

---

## 9. Index des personnalités (codex)

### 9.1 Fonctionnement

Écran **Codex › Personnalités** : 9 entrées. Une entrée est **verrouillée** (silhouette, « ??? », indice) tant que le joueur n'a jamais possédé de personnage de cette personnalité. Elle se **révèle par morceaux** :

| Morceau | Se révèle quand… |
|---|---|
| Description, voie, âme, familles favorisées | on possède (ou a possédé) un personnage de cette personnalité |
| Chaque sous-trait | un personnage possédé l'a |
| Signature | elle apparaît dans un nœud **révélé** d'un arbre (ou est apprise) |
| Chaque spécialisation favorisée | un personnage de cette personnalité l'obtient au niv. 20 (sinon : silhouette d'emblème) |
| Chaque forme de voie (sous-classe niv. 30) | un personnage de la voie l'obtient |
| Chaque tendance de relation | l'état correspondant (ami, rival, hostile, harcèlement, respect) a été observé entre cette personnalité et l'autre |
| Combinaisons (bible §6.1) | un personnage possédé la déclenche (`combosOf`) |

Stockage : `G.codex = {Altruiste:{own:1, subs:['Loyal'], sig:0, spec:['chevalier'], voie:['etendard'], rel:{Égoïste:'harcele'}, combo:['Loyal']}, …}`, mis à jour dans `mk`, `doEvo`, au palier 20/30, et dans `relAfter`. Un personnage mort reste compté (le codex se souvient). Récompense : chaque entrée **complète à 100 %** donne 5 fragments de parchemin et 1 tome ★2 (une fois).

### 9.2 Entrées

#### Altruiste — voie du Cœur
- **Description** : « Il se met entre le danger et les autres sans y penser. On le trouve toujours au chevet d'un blessé. » Gentil ; peut être **harcelé** par les égoïstes.
- **Âme** : *Âme dévouée* (soins et boucliers +20 %).
- **Familles favorisées** : soutien +6, soin +5, protection +5, défense +1.
- **Sous-traits** : Protecteur, Compatissant, Dévoué, Généreux, Loyal, Empathique.
- **Signature** : *Main tendue*. Fortement favorisées : Égide, Cœur sacrificiel, Promesse inviolable, Don absolu, Miroir empathique, Dernier souffle, Rappel des étoiles.
- **Combinaisons** : + Loyal → protection durable ; + Empathique → soin et soutien ; + Impulsif → sacrifice immédiat ; + Calculateur → protection stratégique ; + Ambitieux → chef protecteur.
- **Spécialisations favorisées** : Chevalier, Paladin, Rôdeur, Prêtre, Druide, Enchanteur.
- **Formes de voie** : Héraut de l'aube, Ange de campagne, Runiste gardien, Purificateur, Démineur, Receleur généreux, Herboriste, Garde-forestier, Ami des bêtes, Bouclier juré, Conteur des veillées, Capitaine protecteur.
- **Métiers probables** : apothicaire, cuisinier, fermier, éleveur.
- **Relations** : ami facile des Altruistes et Opportunistes (+0,6), des Curieux et Gourmands (+0,5) ; **harcelé par les Égoïstes** (−1,2 : −10 % de moral si le harceleur est dans l'équipe).

#### Ambitieux — voie de la Lame
- **Description** : « Le sommet de la Tour n'est pas un rêve, c'est un rendez-vous. » Compétitif, rivalités fréquentes.
- **Âme** : *Âme conquérante* (ATQ +10 %). **Familles** : dégâts +6, célérité +2, soutien +1, chance +1.
- **Sous-traits** : Compétitif, Orgueilleux, Déterminé (Opportuniste existe comme personnalité à part).
- **Signature** : *Vers la couronne*. Favorisées : Frappe puissante, Soif de gloire, Chef de file, Cri de ralliement, Frappe météore.
- **Combinaisons** : + Impulsif → attaques agressives ; + Altruiste → chef protecteur.
- **Spécialisations** : Épéiste, Berserker, Vengeur, Duelliste, Archer de tempête, Élémentaliste, Hémomancien, Chantre de guerre.
- **Formes de voie** (Lame) : Seigneur de guerre, Chirurgien de guerre, Runiste de sang, Inquisiteur, Artificier, Pillard, Grenadier, Chasseur de primes, Maître de meute, Rempart vengeur, Conteur de batailles, Commandant de choc.
- **Métiers** : marchand, forgeron, entraîneur, architecte.
- **Relations** : **rival** des autres Ambitieux (−0,2, état « rival » : +2 % de moral et « piqué au vif ») ; bon avec Opportunistes (+0,5) ; froid avec les Égoïstes (−0,6).

#### Calculateur — voie de l'Esprit
- **Description** : « Chaque pas est un calcul. Il a déjà lu vos faiblesses — et les siennes. » Froid, respecté, peu d'amitiés.
- **Âme** : *Âme lucide* (critique +12 %). **Familles** : contrôle +6, dégâts +2, chance +2, découverte +1.
- **Sous-traits** : Stratège, Prudent, Manipulateur, Méthodique.
- **Signature** : *Échiquier*. Favorisées : Analyse, Point faible, Coup étourdissant, Maître du temps, Entrave.
- **Combinaisons** : + Altruiste → protection stratégique ; + Stoïque → défense tactique ; + Curieux → recherche et invention.
- **Spécialisations** : Épéiste, Rempart, Lame de l'ombre, Empoisonneur, Tireur d'élite, Arcaniste, Chronomancien, Occultiste, Prêtre, Enchanteur.
- **Formes de voie** (Esprit) : Maréchal, Apothicaire de terrain, Grand runiste, Sceau-mage, Maître des pièges, Prince des voleurs, Transmutateur, Vigie, Chimériste, Garde tacticienne, Maître des légendes, Grand stratège.
- **Métiers** : architecte, marchand, bibliothécaire, alchimiste.
- **Relations** : **respect** facile (état « respect » dès +15) ; tensions avec les Impulsifs (−0,4) ; bon avec Opportunistes (+0,4), Stoïques et Curieux (+0,3).

#### Impulsif — voie de la Lame
- **Description** : « Réfléchir ? Plus tard ! » Réactions instinctives, conflits rapides, courage réel.
- **Âme** : *Âme ardente* (VIT +8, DEF −10 %). **Familles** : célérité +6, dégâts +4.
- **Sous-traits** : Téméraire, Colérique, Spontané, Courageux.
- **Signature** : *Tête la première*. Favorisées : Élan, Double frappe, Assaut éclair, Premier sang, Furie, Fougue, Tout ou rien.
- **Combinaisons** : + Ambitieux → attaques agressives ; + Altruiste → sacrifice immédiat.
- **Spécialisations** : Berserker, Vengeur, Duelliste, Archer de tempête, Élémentaliste, Hémomancien, Chantre de guerre.
- **Formes de voie** : celles de la Lame (voir Ambitieux).
- **Métiers** : chasseur, mineur, entraîneur.
- **Relations** : conflits avec Calculateurs (−0,4), Impulsifs (−0,3), Égoïstes (−0,7) ; s'entend avec Opportunistes (+0,5), Curieux et Gourmands (+0,3).

#### Stoïque — voie du Cœur
- **Description** : « … Je tiendrai. » Neutre, stable, rarement en conflit. **Rythme lent mais sûr** (moins de nœuds, mieux rangés).
- **Âme** : *Âme de roc* (PV et DEF +12 %). **Familles** : défense +6, protection +3, soin +1.
- **Sous-traits** : Patient, Froid, Résistant, Discipliné.
- **Signature** : *Roc immuable*. Favorisées : Peau de pierre, Vigueur, Inébranlable, Forteresse, Refus de mourir.
- **Combinaisons** : + Calculateur → défense tactique.
- **Spécialisations** : Épéiste, Chevalier, Paladin, Rempart, Tireur d'élite, Chronomancien, Prêtre, Enchanteur.
- **Formes de voie** : celles du Cœur (voir Altruiste).
- **Métiers** : mineur, forgeron, fermier, entraîneur.
- **Relations** : ne descend **jamais sous −20** ; respect facile ; légèrement positif avec tous sauf Égoïstes (−0,2).
- **Particularité d'arbre** : *Patience récompensée* (§7.3).

#### Curieux — voie de l'Esprit
- **Description** : « Chaque étage est un monde entier ! » Apprécié, lie facilement amitié. **Rythme rapide** (3 nœuds de plus).
- **Âme** : *Âme chercheuse* (rupture +30 %). **Familles** : découverte +6, contrôle +2, chance +1, cuisine +1.
- **Sous-traits** : Chercheur, Explorateur, Inventif, Observateur.
- **Signature** : *Eurêka !*. Favorisées : Érudit, Flair d'explorateur, Étincelle d'invention, Étude des monstres, Alchimie, Cartographie mentale.
- **Combinaisons** : + Calculateur → recherche et invention ; + Gourmand → cuisine expérimentale ; + Opportuniste → chasseur de trésors.
- **Spécialisations** : Éclaireur, Empoisonneur, Rôdeur, Arcaniste, Druide, Troubadour.
- **Formes de voie** : celles de l'Esprit (voir Calculateur).
- **Métiers** : cartographe, bibliothécaire, alchimiste, cueilleur.
- **Relations** : ami des Curieux, Gourmands, Opportunistes (+0,6) et Altruistes (+0,5).
- **Particularité d'arbre** : *Éclair de génie* (§7.3).

#### Gourmand — voie du Cœur
- **Description** : « Ce soir, c'est moi qui cuisine. » Convivial ; le moral de la table, c'est lui.
- **Âme** : *Âme gourmande* (5 % PV par tour). **Familles** : cuisine +6, soin +2, défense +1.
- **Sous-traits** : Gourmet, Glouton, Cuisinier, Épicurien.
- **Signature** : *Goûteur*. Favorisées : En-cas partagé, Festin, Ragoût fortifiant, Épices de feu, Banquet légendaire.
- **Combinaisons** : + Curieux → cuisine expérimentale.
- **Spécialisations** : Chevalier, Rempart, Empoisonneur, Rôdeur, Druide, Troubadour.
- **Formes de voie** : celles du Cœur.
- **Métiers** : cuisinier (très probable), fermier, éleveur.
- **Relations** : **meilleurs amis entre Gourmands** (+0,8) ; +0,6 avec Curieux et Opportunistes ; froid avec Égoïstes (−0,5).

#### Égoïste — voie de la Lame
- **Description** : « Moi d'abord. Vous, ensuite… peut-être. » Puissant mais **isolé** ; harcèle les altruistes.
- **Âme** : *Âme solitaire* (dégâts des compétences +15 %). **Familles** : dégâts +7, célérité +2, contrôle +1.
- **Sous-traits** : Vaniteux, Avare, Cynique, Solitaire.
- **Signature** : *Moi d'abord*. Favorisées : Force brute, Soif de sang, Main leste, Coup de grâce, Maléfice.
- **Combinaisons** : + Opportuniste → profiteur sans scrupules.
- **Spécialisations** : Berserker, Vengeur, Lame de l'ombre, Tireur d'élite, Élémentaliste, Occultiste, Hémomancien, Chantre de guerre.
- **Formes de voie** : celles de la Lame.
- **Métiers** : marchand, chasseur, alchimiste.
- **Relations** : négatif avec presque tous (Altruiste −1,2, Égoïste −0,8, Impulsif −0,7) ; seul l'Opportuniste le tolère (+0,1). Isolé : −8 % en groupe de 3+, 12 % d'ignorer un ordre.

#### Opportuniste — voie de l'Esprit
- **Description** : « Une porte fermée ? Il y a toujours une fenêtre. » Chanceux, **apprécié de tous**.
- **Âme** : *Âme filoute* (critique +6 %, or +10 %). **Familles** : chance +7, dégâts +2, célérité +1.
- **Sous-traits** : Rusé, Chanceux, Charmeur, Débrouillard.
- **Signature** : *Aubaine*. Favorisées : Bonne fortune, Œil de lynx, Coup de chance, Tout ou rien, Trèfle, Chasseur de trésors.
- **Combinaisons** : + Égoïste → profiteur sans scrupules ; + Curieux → chasseur de trésors.
- **Spécialisations** : Éclaireur, Archer de tempête, Occultiste, Troubadour.
- **Formes de voie** : celles de l'Esprit.
- **Métiers** : marchand (très probable), cueilleur, cartographe.
- **Relations** : positif avec tous (+0,3 à +0,6), ne descend pas sous −10 (sauf avec un Égoïste).

---

## 10. Interface (mobile 390 px d'abord)

Contraintes communes : largeur utile 358 px (marges 16 px), cibles tactiles ≥ 44 px, texte 13–15 px, aucun défilement horizontal, feuilles du bas (« bottom sheets ») pour les détails, animations désactivées avec `prefers-reduced-motion` (fondu seulement). Icônes 32×32 affichées à ×1 (32 px) dans les listes et ×2 (64 px, `image-rendering: pixelated`) dans les détails.

### 10.1 Fiche personnage : onglets

La fiche actuelle (`openSheet`, une seule colonne) devient une fiche à **5 onglets** collés en haut sous l'en-tête (portrait, nom, étoiles, chaîne de classe) :

| Onglet | Contenu |
|---|---|
| **Profil** | stats, personnalité, sous-traits, combinaisons, barre d'exp. + **réserve d'exp.**, éveil d'étoile, choix en attente (pastilles rouges) |
| **Arbre** | frise 1 → 60 (§10.2) |
| **Compétences** | technique, ultime, compétences apprises (niveau, étude, évolution — interface actuelle), 4 emplacements « préparées » avec épingle |
| **Métier** | métier, rang, points, poste, effets actuels et au rang suivant, évolution à 45 |
| **Relations** | panneau actuel |

L'onglet ouvert est mémorisé (`localStorage`, avec repli silencieux). En-tête : `Guerrier › Berserker › Fléau rouge` + badge de sous-classe (emblème 24 px + pastille de voie) + icône de métier.

### 10.2 Onglet « Arbre » : frise verticale

```
┌──────────────────────────────────────┐
│ Niv. 27 / 30  ▓▓▓▓▓▓▓░░  Réserve 0   │  ← barre fixe
│ [Tout] [Actives] [Passives] [Paliers]│  ← filtres (puces)
├──────────────────────────────────────┤
│ 20 ═[ms_20]═ SPÉCIALISATION : BERSERKER ══ │ bannière 48 px
│ 22 ●─[▣] Furie            active · rare │ débloqué
│ 24 ●─[▣] Brasier      active · p.commune│
│ 25 ◆─ Maîtrise de technique (+15 %)     │ petit palier
│ 26 ●─[▣] Tourbillon ✦inspiré            │
│ 28 ◎─[▣] Fougue        dans 1 niveau    │ PROCHAIN (pulse)
│ 30 ═[ms_30]═ SOUS-CLASSE AMÉLIORÉE : Runiste de sang ═│
│ ┄┄┄┄┄┄ Plafond 3★ — éveil requis [Voir l'éveil] ┄┄┄┄┄ │
│ 32 ○─[?] (rouge) Dégâts · rare           │ bande suivante
│ 34 ○─[?] (gris) Défense · épique         │
│ 35 ═[ms_35]═ ULTIME : Rage écarlate ════ │ toujours visible
│ 37 ·─[???]                               │ au-delà
└──────────────────────────────────────┘
```

- Colonne niveau 28 px, ligne de vie 4 px (or = parcourue, gris = à venir), nœud 40×40 (icône 32 + cadre de rareté 4 px aux couleurs `RARC`), texte à droite (nom, puces « active/passive », famille, effet en 1 ligne, « dans N niv. »).
- **États** : débloqué (couleur pleine, coche 10 px) · prochain (halo pulsé `ui_node_next`, 1,2 s) · révélé (désaturé à 60 %, cadenas `ui_node_lock`) · pressenti (cadre pointillé + mention « si Berserker » / « selon la sous-classe ») · mystère (`ui_node_mystery` teinté de la couleur de famille + cadre de rareté) · inconnu (silhouette grise « ??? ») · en sommeil (croissant gris, nœuds V hors harmonie).
- **Bannières** des 9 paliers (badge `ms_<niv>` 48 px, titre, sous-titre) toujours visibles, y compris au-delà du plafond, pour donner l'envie.
- Ouverture : défilement automatique sur le prochain nœud. Toucher un nœud → feuille du bas : icône ×2, nom, rareté, famille, effet à la puissance actuelle, niveau de déblocage, origine (« Nœud V · Berserker », « inspiré », « nœud d'étoile »).
- Nœuds d'étoile : petite étoile dorée accrochée au nœud.

### 10.3 Choix de la sous-classe (niv. 10)

Plein écran (modal), titre « Niv. 10 — Choisissez une voie de soutien », portrait animé à gauche du titre. **3 cartes empilées** (hauteur ~120 px chacune) : emblème `cl_<sub>` 48 px, nom, compétence du niv. 10 (icône + 2 lignes), « **Au niv. 30 : Seigneur de guerre** » avec la pastille de voie, famille favorisée (puce colorée), étoile « conseillé ». Toucher une carte la sélectionne (bordure dorée) ; bouton **Confirmer** en deux temps (motif `evArm` existant). Bouton secondaire « Plus tard » (choix en attente, pastille rouge). Le combat n'est jamais bloqué.

### 10.4 Révélation de spécialisation (niv. 20) et cinématiques d'éveil (40, 50, 60)

Réutilise `evoReveal` (rayons de couleur, flash, lignes de gains) avec un emblème au lieu des étoiles.

| Moment | Séquence (durées à vitesse ×1) |
|---|---|
| **Niv. 15** | toast « Vocation pressentie : Berserker (72 %) » + bannière du niv. 20 mise à jour |
| **Niv. 20** | 0–0,5 s rayons couleur de rôle ; 0,5–1,2 s emblème `cl_<spé>` qui tombe et s'imprime ; 1,2 s+ : nom, nouvelle technique (icône ×2, avant → après), mods |
| **Niv. 40** (Éveil) | avant la cinématique : 2 cartes si passerelle possible (« Éveil : Fléau rouge » / « Passerelle : Vengeur — nécessite un bouclier »), confirmation en deux temps. Puis 0–0,6 s assombrissement + rayons de l'élément ; 0,6–1,4 s le sprite s'élève, silhouette blanche ; 1,4–2,2 s emblème + cadre `fr_eveil` qui claque (secousse 5 px) ; ensuite lignes : forme, technique éveillée, ultime +25 %, stats avant → après |
| **Niv. 50** (Apogée) | même structure, cadre `fr_apogee`, double vague de rayons, étincelles argentées |
| **Niv. 60** (Divinité) | 3,5 s : le fond devient un ciel étoilé, particules dorées montantes, sprite avec aura dorée permanente, cadre `fr_divin`, nom divin en grandes capitales, ultime divin présenté (icône + nom) |

Toucher pour passer après 1 s. Les annonces de palier hors combat apparaissent dans la fenêtre « Après le combat » (lignes `NEWSK`) avec un bouton « Voir » qui ouvre la cinématique.

### 10.5 Métier (niv. 5)

Feuille du bas : « Une vocation s'éveille ». 2 cartes côte à côte (171 px chacune) : icône `job_<id>` 32 px ×2, nom, effet village au rang I, bâtiment de poste ; la vocation naturelle porte le ruban « Vocation (+25 % exp. de métier) ». Bouton **Confirmer**.

### 10.6 Codex

Accès : bouton **Codex** de l'Auberge (et du menu). Grille **3 × 3** de cartes 114 × 128 px : `sk_ame_<pers>` ×2, nom, anneau de progression (%). Carte verrouillée : silhouette, « ??? », indice (« Recrutez quelqu'un qui ne pense qu'à lui »). Fiche d'entrée (défilement vertical) : en-tête (emblème, nom, puce de voie, description, %), puis sections repliables : Familles (barres colorées `FAM`), Sous-traits (puces, inconnues en « ??? »), Signature et compétences favorisées (icônes 32), Spécialisations (grille d'emblèmes 48, silhouettes si non vues), Formes de voie, Combinaisons, Relations (liste « ↗ Ami facile : Curieux, Gourmand… » / « ↘ Conflits : … »), **Vos personnages** (portraits, toucher → fiche).

### 10.7 Équipe et combat

- Portrait d'équipe : emblème de spécialisation 16 px en bas à droite ; croissant gris si en sommeil ; pastille rouge si un choix attend.
- Combat : bouton de technique avec l'icône `sk_tech_*` ; bouton d'ultime avec `sk_ult_*` et cadre de forme (`fr_eveil` / `fr_apogee` / `fr_divin`) ; ⇄ parcourt la technique et les 4 préparées.

---

## 11. Équilibrage et vérifications

### 11.1 Échelle des monstres (code actuel, `mkFoe` / `KM`)

```
PV  = 130 × 1,20^(étage−1) × type.hp × KM[kind].hp     (norm 1 · élite 2,6 · mini 4,5 · boss 7,5)
ATQ =  24 × 1,16^(étage−1) × type.atk × KM[kind].atk   (norm 1 · élite 1,3 · mini 1,5 · boss 1,7)
DEF =  10 + 3 × étage
dégâts = ATQ × mult × 100 / (100 + DEF)  (deal)
```

### 11.2 Hypothèses du banc d'essai

Personnage « DPS » de rôle guerrier (ATQ ×1,1), étoiles = ⌈niv./10⌉, équipement du même rang (ATQ ×(1,15 + 0,10★), PV ×(1 + 0,05★), DEF ×(1 + 0,04★)), g = 1, aucun passif. Monstre normal, type moyen. **TTK** = attaques de base pour tuer le monstre ; **survie** = coups de monstre pour tomber. Cibles : TTK 2–5 (une technique à 220 % tue en 1–2), survie 15–35 (une équipe de 4 avec un soigneur tient un combat de groupe).

### 11.3 Résultats (calculés)

| Niv. | ★ | Étage attendu | PV monstre | ATQ monstre | ATQ perso | PV perso | DEF perso | **TTK nouveau** | TTK actuel | **Survie nouvelle** | Survie actuelle |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 1 | 1 | 130 | 24 | 51 | 326 | 24 | 2,9 | 2,9 | 17 | 17 |
| 5 | 1 | 2 | 156 | 28 | 72 | 404 | 28 | 2,5 | 2,5 | 19 | 22 |
| 10 | 1 | 4 | 225 | 37 | 110 | 531 | 33 | 2,5 | 2,8 | 19 | 24 |
| 15 | 2 | 6 | 323 | 50 | 227 | 914 | 52 | 1,8 | 2,4 | 28 | 37 |
| 20 | 2 | 9 | 559 | 79 | 354 | 1 207 | 62 | 2,2 | 3,7 | 25 | 32 |
| 25 | 3 | 12 | 966 | 123 | 656 | 1 912 | 92 | 2,1 | 4,4 | 30 | 38 |
| 30 | 3 | 15 | 1 669 | 192 | 957 | 2 423 | 107 | 2,7 | 7,0 | 26 | 30 |
| 35 | 4 | 18 | 2 884 | 299 | 1 702 | 3 701 | 151 | 2,8 | 9,0 | 31 | 33 |
| 40 | 4 | 21 | 4 984 | 467 | 2 674 | 4 918 | 182 | 3,2 | 14,7 | 30 | 26 |
| 45 | 5 | 24 | 8 612 | 729 | 4 839 | 7 538 | 256 | 3,2 | 19,7 | 37 | 27 |
| 50 | 5 | 28 | 17 858 | 1 320 | 8 177 | 10 495 | 317 | 4,2 | 39,9 | 33 | 17 |
| 55 | 6 | 33 | 44 437 | 2 772 | 17 360 | 17 726 | 471 | 5,3 | ≈ 90 | 37 | ≈ 12 |
| 60 | 6 | 38 | 110 573 | 5 823 | 48 951 | 34 817 | 739 | 5,1 | ≈ 180 | 50 | ≈ 8 |

Lecture : **la courbe actuelle s'effondre après l'étage 20** (40 attaques pour un monstre normal à l'étage 28) ; la nouvelle garde un TTK de 2 à 5 jusqu'à l'étage 38, sans rendre les débuts plus faciles (niv. 1–10 identiques à ±10 %).

### 11.4 L'écart monstrueux (même étage)

| Étage | 5★ niv. 50 : TTK / survie | 6★ niv. 60 : TTK / survie | Rapport de dégâts |
|---|---|---|---|
| 28 | 4,2 / 33 | 0,7 / 221 (un coup) | ×6 |
| 32 | 9,3 / 18 | 1,6 / 122 | ×6 |
| 36 | 20,5 / 10 | 3,4 / 68 | ×6 |
| 40 | 45 / 5,6 | 7,5 / 37 | ×6 |

Un dieu fait **6 fois plus de dégâts** qu'un 5★ au maximum et encaisse **6 à 7 fois plus** de coups (PV ×3,3 et DEF ×2,3), avant même son passif et son ultime divins.

### 11.5 Recommandation : adoucir la Tour au-delà de l'étage 40

Sans changement, l'étage 50 demande 52 attaques à un dieu (PV ×1,20 par étage sans fin). Recommandation (à appliquer dans `mkFoe`) : au-delà de l'étage 40, **PV ×1,10 et ATQ ×1,08 par étage** (au lieu de 1,20 / 1,16). Effet : un 6★ niv. 60 garde un TTK de 13 à l'étage 45 et 22 à l'étage 50 (contenu de fin de jeu, Constellations utiles), un 5★ niv. 50 y devient impuissant (TTK 77–131) : la divinité reste l'objectif.

```js
const fScale=(f,a,b)=>Math.pow(a,Math.min(f,40)-1)*Math.pow(b,Math.max(0,f-40));
// mhp: 130*fScale(f,1.2,1.10)*…   atk: 24*fScale(f,1.16,1.08)*…
```

### 11.6 Contrôles d'empilement

| Risque | Garde-fou |
|---|---|
| Passifs d'ATQ cumulés (Force brute, âme, mods, sous-classe, chant) | les bonus de buff (`bf.atk`) prennent le max, pas la somme (règle actuelle `buffS`) ; passifs permanents additifs plafonnés à +60 % hors niveau |
| Réduction de dégâts | `clamp(bfv(t,'dr'),0,.8)` existant + Citadelle/Égide incarnée comptées dans le même plafond |
| Survie (`dp`) | une seule par arbre ; une fois par combat/expédition ; passifs divins bornés |
| Points de compétence | plafond de la réserve inchangé (`setSP`) ; Voix d'or / Muse céleste ne dépassent pas ce plafond |
| Énergie | +100 au plus par action ; Symphonie céleste exclut le lanceur |
| Ordre des tours | un ennemi ne peut perdre plus d'un tour complet par action ; Arrêt du temps divin : 2 tours, boss 1 |
| Vitesse d'exp. | Érudit + vocation + camp : ×2 au plus |

### 11.7 Économie liée

- Or : les coûts de compétence (`30 × niv. × (rareté + 1)`) et d'éveil restent ; les reconversions (300–500 × ★) restent marginales face aux ≈ 500 or/étage (étage 10) et 1 000 (étage 20).
- Parchemins : inchangés (`EVOC`) ; ils deviennent l'unique verrou de progression, ce qui renforce leur valeur.

---

## 12. Liste des icônes (pipeline graphique)

### 12.1 Consignes de rendu

- **Style** : emblème d'effet en pixel-art gras, lisible à 32 px — arcs de slash, étoiles d'impact, flammes, éclats de glace, boucliers, auras, flèches, orbes (référence : les planches d'effets d'attaque envoyées par le créateur). Une forme principale, une couleur dominante, 2–3 tons (clair en haut à gauche, sombre en bas à droite, comme `bake`), **contour 1 px `#1d1430`** (`OLC`), fond transparent, pas de texte.
- **Couleur dominante** = groupe de la table (couleur de famille `FAM` pour les compétences d'arbre, couleur de rôle pour les techniques et ultimes). Les ultimes ont une composition plus chargée (forme + onde/éclats en arrière-plan) et un liseré blanc 1 px interne.
- **Tailles** : compétences `sk_*` et métiers `job_*` 32×32 ; emblèmes `cl_*`, cadres `fr_*` et badges `ms_*` 48×48 ; familles `fam_*` et pastilles de voie 16×16 ; interface de l'arbre selon la table.
- **Sorties** : `assets/png/<clé>.png`, clés ajoutées à `assets/assets.js` / `manifest.json` comme les autres ; nouveau script suggéré `blender/icons.py` (groupé par couleur). Une icône absente est remplacée en jeu par une pastille de la couleur de famille avec l'initiale (repli procédural, comme `matSprite`).
- Cadres de rareté des nœuds : dessinés en CSS (`RARC`), pas d'image.

### 12.2 Décompte

| Type | Préfixe | Nombre | Taille |
|---|---|---|---|
| Compétences d'arbre (59 actuelles + 18 nouvelles + 9 signatures) | `sk_<id>` | 86 | 32×32 |
| Âmes | `sk_ame_*` | 9 | 32×32 |
| Compétences de sous-classe | `sk_sub_*` | 12 | 32×32 |
| Techniques d'arme | `sk_tech_*` | 10 | 32×32 |
| Techniques de spécialisation | `sk_tech_<spé>` | 23 | 32×32 |
| Ultimes d'apprenti + Jeanne | `sk_ult_<rôle>`, `sk_ult_commandant` | 8 | 32×32 |
| Ultimes de spécialisation | `sk_ult_<spé>` | 23 | 32×32 |
| **Sous-total compétences** | `sk_*` | **171** | |
| Emblèmes de sous-classe | `cl_<sub>` | 12 | 48×48 |
| Emblèmes de spécialisation | `cl_<spé>` | 23 | 48×48 |
| Emblèmes divins | `cl_<spé>_divin` | 23 | 48×48 |
| Pastilles de voie | `cl_voie_*` | 3 | 16×16 |
| Cadres de forme | `fr_eveil`, `fr_apogee`, `fr_divin` | 3 | 48×48 |
| Métiers + métiers évolués | `job_<id>`, `job_<id>_evo` | 28 | 32×32 |
| Badges de palier | `ms_<niv>` | 9 | 48×48 |
| Familles | `fam_<id>` | 10 | 16×16 |
| Interface de l'arbre | `ui_node_*` | 3 | 12 / 32 / 40 |
| **Total** | | **285** | |

Les formes éveillées (40) et d'apogée (50) réutilisent l'emblème de spécialisation avec le cadre `fr_eveil` / `fr_apogee` ; les formes de voie (30) réutilisent l'emblème de sous-classe avec la pastille `cl_voie_*` ; les ultimes éveillés réutilisent leur icône avec le cadre de forme.

### 12.3 Table complète

| Groupe (couleur) | Clé | Taille | Visuel |
|---|---|---|---|
| Soutien `#ffcf4a` | `sk_cri` | 32×32 | bouche criant avec trois ondes dorées |
| Soutien `#ffcf4a` | `sk_inspir` | 32×32 | étoile dorée jaillissant d'une tête stylisée |
| Soutien `#ffcf4a` | `sk_donabs` | 32×32 | deux mains se passant un cœur lumineux |
| Soutien `#ffcf4a` | `sk_aura` | 32×32 | halo doré concentrique en trois anneaux |
| Soutien `#ffcf4a` | `sk_miroir` | 32×32 | miroir ovale doré reflétant un cœur |
| Soutien `#ffcf4a` | `sk_chef` | 32×32 | bannière triangulaire plantée, pointe dorée |
| Soutien `#ffcf4a` | `sk_refrain` | 32×32 | trois notes de musique dorées en spirale |
| Soutien `#ffcf4a` | `sk_sub_etendard` | 32×32 | étendard doré planté, drapeau claquant (compétence de sous-classe) |
| Soutien `#ffcf4a` | `sk_sub_conteur` | 32×32 | livre ouvert doré dont s'échappent des étoiles (compétence de sous-classe) |
| Soutien `#ffcf4a` | `sk_sub_tacticien` | 32×32 | carte de bataille avec flèches et pion doré (compétence de sous-classe) |
| Soin `#5fe07a` | `sk_premsoins` | 32×32 | croix verte avec un bandage enroulé |
| Soin `#5fe07a` | `sk_rosee` | 32×32 | trois gouttes de rosée sur une feuille |
| Soin `#5fe07a` | `sk_regen` | 32×32 | spirale verte ascendante avec un « + » |
| Soin `#5fe07a` | `sk_bened` | 32×32 | mains jointes avec rayons verts et dorés |
| Soin `#5fe07a` | `sk_souffle` | 32×32 | tourbillon vert qui emporte une feuille |
| Soin `#5fe07a` | `sk_rappel` | 32×32 | étoile filante descendant sur une silhouette couchée |
| Soin `#5fe07a` | `sk_vampir` | 32×32 | croc rouge et vert d'où perle une goutte |
| Soin `#5fe07a` | `sk_phenix` | 32×32 | plume enflammée dorée et verte |
| Soin `#5fe07a` | `sk_mainten` | 32×32 | main verte tendue vers une petite silhouette, éclats de lumière (signature Altruiste) |
| Soin `#5fe07a` | `sk_sub_medic` | 32×32 | sacoche de médecin avec croix verte (compétence de sous-classe) |
| Protection `#bfe8ff` | `sk_egide` | 32×32 | écu bleu ciel avec un éclat en étoile |
| Protection `#bfe8ff` | `sk_murviv` | 32×32 | pan de mur bleuté avec un chevron de provocation |
| Protection `#bfe8ff` | `sk_garde` | 32×32 | petit écu devant une silhouette |
| Protection `#bfe8ff` | `sk_coeur` | 32×32 | cœur fendu abrité par un bouclier |
| Protection `#bfe8ff` | `sk_promesse` | 32×32 | deux auriculaires liés par un ruban lumineux |
| Protection `#bfe8ff` | `sk_dernier` | 32×32 | bougie presque éteinte derrière un bouclier |
| Protection `#bfe8ff` | `sk_sentinel` | 32×32 | œil ouvert gravé au centre d'un écu |
| Protection `#bfe8ff` | `sk_sub_exorciste` | 32×32 | talisman de papier et sceau doré sur fond bleu ciel (compétence de sous-classe) |
| Protection `#bfe8ff` | `sk_sub_garde` | 32×32 | grand pavois bleu ciel devant une petite silhouette (compétence de sous-classe) |
| Dégâts `#ff5a5a` | `sk_frappe` | 32×32 | étoile d'impact rouge avec onde de choc |
| Dégâts `#ff5a5a` | `sk_tourb` | 32×32 | arc de lame rouge en cercle complet |
| Dégâts `#ff5a5a` | `sk_grace` | 32×32 | dague plongeant vers un crâne |
| Dégâts `#ff5a5a` | `sk_brute` | 32×32 | poing serré avec traits de force |
| Dégâts `#ff5a5a` | `sk_gloire` | 32×32 | couronne de laurier rouge |
| Dégâts `#ff5a5a` | `sk_meteore` | 32×32 | météore rouge-orangé en piqué |
| Dégâts `#ff5a5a` | `sk_lame` | 32×32 | épée constellée d'étoiles, halo rouge |
| Dégâts `#ff5a5a` | `sk_brasier` | 32×32 | flamme rouge-orangé en spirale |
| Dégâts `#ff5a5a` | `sk_chaine` | 32×32 | éclair violet en zigzag ramifié |
| Dégâts `#ff5a5a` | `sk_rayon` | 32×32 | rayon doré vertical sur une cible |
| Dégâts `#ff5a5a` | `sk_nova` | 32×32 | orbe rose qui explose en anneau |
| Dégâts `#ff5a5a` | `sk_ecrase` | 32×32 | marteau frappant le sol, fissures rayonnantes |
| Dégâts `#ff5a5a` | `sk_couronne` | 32×32 | couronne rouge au-dessus de marches montantes (signature Ambitieux) |
| Dégâts `#ff5a5a` | `sk_moidabord` | 32×32 | main rouge qui attire une pièce vers soi (signature Égoïste) |
| Contrôle `#c58bff` | `sk_entrave` | 32×32 | chaînes violettes en boucle |
| Contrôle `#c58bff` | `sk_pointf` | 32×32 | cible fissurée en son centre |
| Contrôle `#c58bff` | `sk_intim` | 32×32 | masque grimaçant violet |
| Contrôle `#c58bff` | `sk_etourd` | 32×32 | marteau entouré de petites étoiles qui tournent |
| Contrôle `#c58bff` | `sk_analyse` | 32×32 | loupe sur un hexagone de faiblesse |
| Contrôle `#c58bff` | `sk_temps` | 32×32 | sablier violet fissuré |
| Contrôle `#c58bff` | `sk_lancegl` | 32×32 | éclat de glace pointu, bleu-violet |
| Contrôle `#c58bff` | `sk_ronces` | 32×32 | lianes épineuses vertes et violettes en cercle |
| Contrôle `#c58bff` | `sk_toxine` | 32×32 | goutte verte marquée d'un crâne |
| Contrôle `#c58bff` | `sk_malefice` | 32×32 | œil violet entouré de runes sombres |
| Contrôle `#c58bff` | `sk_echiquier` | 32×32 | pièce de cavalier violette sur damier (signature Calculateur) |
| Contrôle `#c58bff` | `sk_sub_runiste` | 32×32 | pierre gravée d'une rune violette lumineuse (compétence de sous-classe) |
| Contrôle `#c58bff` | `sk_sub_saboteur` | 32×32 | piège à mâchoires refermé, dents violettes (compétence de sous-classe) |
| Contrôle `#c58bff` | `sk_sub_pisteur` | 32×32 | empreinte de patte dans une cible violette (compétence de sous-classe) |
| Défense `#a9a6b8` | `sk_peau` | 32×32 | bras couvert d'écailles de pierre |
| Défense `#a9a6b8` | `sk_vigueur` | 32×32 | cœur gris musclé avec un « + » |
| Défense `#a9a6b8` | `sk_riposte` | 32×32 | deux épées croisées avec flèche de retour |
| Défense `#a9a6b8` | `sk_inebr` | 32×32 | pied ancré dans un rocher |
| Défense `#a9a6b8` | `sk_forter` | 32×32 | tour de château grise crénelée |
| Défense `#a9a6b8` | `sk_refus` | 32×32 | crâne fissuré d'où sort une flamme |
| Défense `#a9a6b8` | `sk_epines` | 32×32 | carapace grise hérissée de pointes |
| Défense `#a9a6b8` | `sk_roc` | 32×32 | rocher gris fendu d'une ligne de lumière, impact qui rebondit (signature Stoïque) |
| Chance et butin `#4de0c0` | `sk_fortune` | 32×32 | pièce turquoise brillante |
| Chance et butin `#4de0c0` | `sk_lynx` | 32×32 | œil félin à pupille fendue |
| Chance et butin `#4de0c0` | `sk_coupch` | 32×32 | dé en vol montrant un 6 |
| Chance et butin `#4de0c0` | `sk_toutrien` | 32×32 | pièce à deux faces (étoile / crâne) |
| Chance et butin `#4de0c0` | `sk_trefle` | 32×32 | trèfle turquoise à quatre feuilles |
| Chance et butin `#4de0c0` | `sk_leste` | 32×32 | main gantée saisissant un éclat |
| Chance et butin `#4de0c0` | `sk_tresor` | 32×32 | coffre ouvert d'où jaillit un éclat |
| Chance et butin `#4de0c0` | `sk_aubaine` | 32×32 | fer à cheval turquoise frappant une cible fissurée (signature Opportuniste) |
| Chance et butin `#4de0c0` | `sk_sub_contreb` | 32×32 | bourse ouverte d'où tombent des pièces turquoise (compétence de sous-classe) |
| Découverte `#6fd3ff` | `sk_erudit` | 32×32 | livre ouvert cyan avec une étoile |
| Découverte `#6fd3ff` | `sk_flair` | 32×32 | boussole à aiguille scintillante |
| Découverte `#6fd3ff` | `sk_invent` | 32×32 | engrenage cyan qui crache une étincelle |
| Découverte `#6fd3ff` | `sk_etude` | 32×32 | bestiaire ouvert avec une griffure |
| Découverte `#6fd3ff` | `sk_alchim` | 32×32 | fiole cyan qui bouillonne |
| Découverte `#6fd3ff` | `sk_carto` | 32×32 | parchemin de carte avec une croix cyan |
| Découverte `#6fd3ff` | `sk_eureka` | 32×32 | ampoule cyan avec un point d'exclamation (signature Curieux) |
| Découverte `#6fd3ff` | `sk_sub_alchi` | 32×32 | fiole ronde lancée, liquide cyan qui gicle (compétence de sous-classe) |
| Cuisine `#e8945a` | `sk_encas` | 32×32 | sandwich croustillant |
| Cuisine `#e8945a` | `sk_festin` | 32×32 | gigot doré |
| Cuisine `#e8945a` | `sk_ragout` | 32×32 | marmite fumante |
| Cuisine `#e8945a` | `sk_epices` | 32×32 | piment enflammé |
| Cuisine `#e8945a` | `sk_banquet` | 32×32 | cloche de service dorée soulevée, vapeur |
| Cuisine `#e8945a` | `sk_gouter` | 32×32 | langue/cuillère dorée au-dessus d'une marmite (signature Gourmand) |
| Célérité `#ff9a3a` | `sk_elan` | 32×32 | botte ailée orange |
| Célérité `#ff9a3a` | `sk_double` | 32×32 | deux traits de slash parallèles |
| Célérité `#ff9a3a` | `sk_assaut` | 32×32 | éclair orange en forme de flèche |
| Célérité `#ff9a3a` | `sk_premier` | 32×32 | goutte rouge et chevron orange |
| Célérité `#ff9a3a` | `sk_furie` | 32×32 | quatre griffures orange |
| Célérité `#ff9a3a` | `sk_fougue` | 32×32 | flamme orange en chevron double |
| Célérité `#ff9a3a` | `sk_voile` | 32×32 | cape violette qui se dissout en fumée orange |
| Célérité `#ff9a3a` | `sk_hate` | 32×32 | horloge à ailes orange |
| Célérité `#ff9a3a` | `sk_foncer` | 32×32 | tête casquée chargeant avec traînée orange (signature Impulsif) |
| Célérité `#ff9a3a` | `sk_sub_dompteur` | 32×32 | tête de loup orange de profil (compétence de sous-classe) |
| Âmes (couleur de la voie : Cœur vert, Lame rouge, Esprit cyan) | `sk_ame_altruiste` | 32×32 | cœur doré entouré de deux mains ouvertes |
| Âmes (couleur de la voie : Cœur vert, Lame rouge, Esprit cyan) | `sk_ame_ambitieux` | 32×32 | couronne rouge sur une épée dressée |
| Âmes (couleur de la voie : Cœur vert, Lame rouge, Esprit cyan) | `sk_ame_calculateur` | 32×32 | œil violet inscrit dans un losange de cible |
| Âmes (couleur de la voie : Cœur vert, Lame rouge, Esprit cyan) | `sk_ame_impulsif` | 32×32 | flamme orange en forme d'éclair |
| Âmes (couleur de la voie : Cœur vert, Lame rouge, Esprit cyan) | `sk_ame_stoique` | 32×32 | montagne grise avec un halo calme |
| Âmes (couleur de la voie : Cœur vert, Lame rouge, Esprit cyan) | `sk_ame_curieux` | 32×32 | loupe cyan sur une étoile |
| Âmes (couleur de la voie : Cœur vert, Lame rouge, Esprit cyan) | `sk_ame_gourmand` | 32×32 | bol fumant ambré avec une cuillère |
| Âmes (couleur de la voie : Cœur vert, Lame rouge, Esprit cyan) | `sk_ame_egoiste` | 32×32 | silhouette sombre auréolée de rouge, dos tourné |
| Âmes (couleur de la voie : Cœur vert, Lame rouge, Esprit cyan) | `sk_ame_opportuniste` | 32×32 | pièce turquoise lancée avec un clin d'œil |
| Guerrier — acier #b9c4d8 / bleu #3558b8 | `sk_tech_entaille` | 32×32 | arc de slash blanc-bleu en croissant, traînée nette (référence : planches d'effets d'attaque) |
| Guerrier — acier #b9c4d8 / bleu #3558b8 | `sk_tech_fendoir` | 32×32 | hache qui s'abat, arc épais vertical et éclats |
| Guerrier — acier #b9c4d8 / bleu #3558b8 | `sk_tech_poing` | 32×32 | poing ganté avec étoile d'impact jaune |
| Guerrier — acier #b9c4d8 / bleu #3558b8 | `sk_tech_epeiste` | 32×32 | deux arcs de slash bleu acier en X |
| Guerrier — acier #b9c4d8 / bleu #3558b8 | `sk_tech_berserker` | 32×32 | hache rouge avec arc de sang |
| Guerrier — acier #b9c4d8 / bleu #3558b8 | `sk_tech_chevalier` | 32×32 | lance et écu doré en charge |
| Guerrier — acier #b9c4d8 / bleu #3558b8 | `sk_ult_guerrier` | 32×32 | Déferlante : grand arc de lame bleu qui balaie trois silhouettes |
| Guerrier — acier #b9c4d8 / bleu #3558b8 | `sk_ult_commandant` | 32×32 | Ordre du commandant (Jeanne) : épée levée devant un étendard sacré doré |
| Guerrier — acier #b9c4d8 / bleu #3558b8 | `sk_ult_epeiste` | 32×32 | Mille entailles : six arcs de slash entrecroisés en rosace |
| Guerrier — acier #b9c4d8 / bleu #3558b8 | `sk_ult_berserker` | 32×32 | Rage écarlate : silhouette hurlante dans une aura rouge en flammes |
| Guerrier — acier #b9c4d8 / bleu #3558b8 | `sk_ult_chevalier` | 32×32 | Serment d'acier : épée plantée dans un écu, rayons dorés |
| Gardien — bleu ciel #bfe8ff / or | `sk_tech_bouclier` | 32×32 | écu levé avec chevron de provocation et petit bouclier lumineux |
| Gardien — bleu ciel #bfe8ff / or | `sk_tech_paladin` | 32×32 | écu doré rayonnant d'une croix |
| Gardien — bleu ciel #bfe8ff / or | `sk_tech_rempart` | 32×32 | mur d'acier riveté bleu-gris |
| Gardien — bleu ciel #bfe8ff / or | `sk_tech_vengeur` | 32×32 | bouclier à pointes avec éclair |
| Gardien — bleu ciel #bfe8ff / or | `sk_ult_gardien` | 32×32 | Bastion : dôme de boucliers hexagonaux bleu ciel |
| Gardien — bleu ciel #bfe8ff / or | `sk_ult_paladin` | 32×32 | Jugement radieux : marteau sacré descendant dans un rayon |
| Gardien — bleu ciel #bfe8ff / or | `sk_ult_rempart` | 32×32 | Forteresse vivante : silhouette fusionnée avec une muraille |
| Gardien — bleu ciel #bfe8ff / or | `sk_ult_vengeur` | 32×32 | Représailles : bouclier qui renvoie un éclair rouge en ricochet |
| Assassin — nuit #34304a / rouge #c0392b | `sk_tech_estoc` | 32×32 | pointe de dague perçante, trait fin et étincelle rouge |
| Assassin — nuit #34304a / rouge #c0392b | `sk_tech_lameombre` | 32×32 | dague violette sortant d'une ombre |
| Assassin — nuit #34304a / rouge #c0392b | `sk_tech_eclaireur` | 32×32 | dague orange avec traînée de vitesse |
| Assassin — nuit #34304a / rouge #c0392b | `sk_tech_duelliste` | 32×32 | gant jeté entre deux rapières |
| Assassin — nuit #34304a / rouge #c0392b | `sk_tech_empoisonneur` | 32×32 | dague dégoulinant de venin vert |
| Assassin — nuit #34304a / rouge #c0392b | `sk_ult_assassin` | 32×32 | Exécution : croix de deux slashs rouges sur fond noir |
| Assassin — nuit #34304a / rouge #c0392b | `sk_ult_lameombre` | 32×32 | Danse des ombres : trois dagues autour d'un croissant de lune violet |
| Assassin — nuit #34304a / rouge #c0392b | `sk_ult_eclaireur` | 32×32 | Embuscade parfaite : œil orange au centre de flèches convergentes |
| Assassin — nuit #34304a / rouge #c0392b | `sk_ult_duelliste` | 32×32 | Duel à mort : deux rapières croisées dans un cercle d'arène |
| Assassin — nuit #34304a / rouge #c0392b | `sk_ult_empoisonneur` | 32×32 | Nuée toxique : nuage vert avec crânes qui tourbillonnent |
| Archer — vert #3f8f52 / bois | `sk_tech_volee` | 32×32 | trois flèches parallèles en vol, traînées vertes |
| Archer — vert #3f8f52 / bois | `sk_tech_tireur` | 32×32 | flèche dans un viseur en croix |
| Archer — vert #3f8f52 / bois | `sk_tech_rodeur` | 32×32 | flèche entourée de ronces vertes |
| Archer — vert #3f8f52 / bois | `sk_tech_tempete` | 32×32 | éventail de cinq flèches électriques |
| Archer — vert #3f8f52 / bois | `sk_ult_archer` | 32×32 | Pluie de flèches : flèches tombant en pluie oblique |
| Archer — vert #3f8f52 / bois | `sk_ult_tireur` | 32×32 | Tir du jugement : flèche unique perçant un viseur, onde blanche |
| Archer — vert #3f8f52 / bois | `sk_ult_rodeur` | 32×32 | Colère sylvestre : tête de cerf faite de ronces, feuilles en éclat |
| Archer — vert #3f8f52 / bois | `sk_ult_tempete` | 32×32 | Ouragan de flèches : spirale de flèches et d'éclairs |
| Sorcier — violet #6a48b8 / rose arcane | `sk_tech_deflagration` | 32×32 | explosion ronde violette à huit pointes |
| Sorcier — violet #6a48b8 / rose arcane | `sk_tech_glyphe` | 32×32 | cercle runique rose au sol avec glyphe central |
| Sorcier — violet #6a48b8 / rose arcane | `sk_tech_elementaliste` | 32×32 | orbe multicolore à quatre quartiers qui éclate |
| Sorcier — violet #6a48b8 / rose arcane | `sk_tech_arcaniste` | 32×32 | quatre losanges roses en éventail |
| Sorcier — violet #6a48b8 / rose arcane | `sk_tech_chrono` | 32×32 | cadran d'horloge tordu en spirale |
| Sorcier — violet #6a48b8 / rose arcane | `sk_tech_occultiste` | 32×32 | crâne violet entouré d'un cercle runique |
| Sorcier — violet #6a48b8 / rose arcane | `sk_ult_sorcier` | 32×32 | Cataclysme : météore violet et onde de choc |
| Sorcier — violet #6a48b8 / rose arcane | `sk_ult_elementaliste` | 32×32 | Cataclysme primordial : quatre orbes élémentaires en croix qui fusionnent |
| Sorcier — violet #6a48b8 / rose arcane | `sk_ult_arcaniste` | 32×32 | Singularité : trou noir rose avec anneau d'accrétion |
| Sorcier — violet #6a48b8 / rose arcane | `sk_ult_chrono` | 32×32 | Arrêt du temps : horloge figée, aiguilles brisées, éclats violets |
| Sorcier — violet #6a48b8 / rose arcane | `sk_ult_occultiste` | 32×32 | Pacte des abysses : main squelettique sortant d'un cercle violet |
| Soigneur — turquoise #3fb0a0 / vert | `sk_tech_soin` | 32×32 | croix verte lumineuse sur une goutte |
| Soigneur — turquoise #3fb0a0 / vert | `sk_tech_pretre` | 32×32 | colonne de lumière dorée sur une croix verte |
| Soigneur — turquoise #3fb0a0 / vert | `sk_tech_druide` | 32×32 | bourgeon vert qui s'ouvre |
| Soigneur — turquoise #3fb0a0 / vert | `sk_tech_hemo` | 32×32 | goutte rouge reliée à une croix verte |
| Soigneur — turquoise #3fb0a0 / vert | `sk_ult_soigneur` | 32×32 | Renouveau : fleur verte qui éclot en anneau de lumière |
| Soigneur — turquoise #3fb0a0 / vert | `sk_ult_pretre` | 32×32 | Miracle : ailes de lumière autour d'une croix verte |
| Soigneur — turquoise #3fb0a0 / vert | `sk_ult_druide` | 32×32 | Floraison : grand arbre stylisé en fleurs, pétales |
| Soigneur — turquoise #3fb0a0 / vert | `sk_ult_hemo` | 32×32 | Marée écarlate : vague de sang en croissant avec goutte centrale |
| Soutien — doré #ffcf4a / rouge | `sk_tech_ralliement` | 32×32 | luth doré émettant une onde et un chevron vers le haut |
| Soutien — doré #ffcf4a / rouge | `sk_tech_troubadour` | 32×32 | luth doré avec notes turquoise |
| Soutien — doré #ffcf4a / rouge | `sk_tech_chantre` | 32×32 | cor de guerre rouge soufflant des ondes |
| Soutien — doré #ffcf4a / rouge | `sk_tech_enchanteur` | 32×32 | baguette dessinant un sceau rose sur une épée |
| Soutien — doré #ffcf4a / rouge | `sk_ult_soutien` | 32×32 | Hymne : partition dorée en éventail avec étoiles |
| Soutien — doré #ffcf4a / rouge | `sk_ult_troubadour` | 32×32 | Grand final : luth flamboyant, notes en feu d'artifice |
| Soutien — doré #ffcf4a / rouge | `sk_ult_chantre` | 32×32 | Hymne des conquérants : cor de guerre et bannière rouge, ondes |
| Soutien — doré #ffcf4a / rouge | `sk_ult_enchanteur` | 32×32 | Grand charme : sceau rose à étoile à huit branches |
| Emblèmes de sous-classe (cadre rond doré, fond couleur de la famille favorisée) | `cl_etendard` | 48×48 | étendard doré croisé sur un écu |
| Emblèmes de sous-classe (cadre rond doré, fond couleur de la famille favorisée) | `cl_medic` | 48×48 | brassard blanc à croix verte |
| Emblèmes de sous-classe (cadre rond doré, fond couleur de la famille favorisée) | `cl_runiste` | 48×48 | marteau de runiste et rune violette |
| Emblèmes de sous-classe (cadre rond doré, fond couleur de la famille favorisée) | `cl_exorciste` | 48×48 | chapelet et sceau sacré |
| Emblèmes de sous-classe (cadre rond doré, fond couleur de la famille favorisée) | `cl_saboteur` | 48×48 | bombe ronde à mèche allumée |
| Emblèmes de sous-classe (cadre rond doré, fond couleur de la famille favorisée) | `cl_contreb` | 48×48 | masque de voleur sur une bourse |
| Emblèmes de sous-classe (cadre rond doré, fond couleur de la famille favorisée) | `cl_alchi` | 48×48 | alambic et deux fioles |
| Emblèmes de sous-classe (cadre rond doré, fond couleur de la famille favorisée) | `cl_pisteur` | 48×48 | tête de faucon et flèche |
| Emblèmes de sous-classe (cadre rond doré, fond couleur de la famille favorisée) | `cl_dompteur` | 48×48 | collier clouté et patte |
| Emblèmes de sous-classe (cadre rond doré, fond couleur de la famille favorisée) | `cl_garde` | 48×48 | pavois et épée en garde |
| Emblèmes de sous-classe (cadre rond doré, fond couleur de la famille favorisée) | `cl_conteur` | 48×48 | plume et parchemin déroulé |
| Emblèmes de sous-classe (cadre rond doré, fond couleur de la famille favorisée) | `cl_tacticien` | 48×48 | pion d'échecs doré sur carte |
| Emblèmes de spécialisation — Guerrier — acier #b9c4d8 / bleu #3558b8 | `cl_epeiste` | 48×48 | épée droite verticale entre deux arcs de slash |
| Emblèmes de spécialisation — Guerrier — acier #b9c4d8 / bleu #3558b8 | `cl_berserker` | 48×48 | hache double ensanglantée, crocs |
| Emblèmes de spécialisation — Guerrier — acier #b9c4d8 / bleu #3558b8 | `cl_chevalier` | 48×48 | heaume à plumet et épée |
| Emblèmes de spécialisation — Gardien — bleu ciel #bfe8ff / or | `cl_paladin` | 48×48 | écu à soleil doré et marteau |
| Emblèmes de spécialisation — Gardien — bleu ciel #bfe8ff / or | `cl_rempart` | 48×48 | tour crénelée devant un écu |
| Emblèmes de spécialisation — Gardien — bleu ciel #bfe8ff / or | `cl_vengeur` | 48×48 | écu à pointes et éclair |
| Emblèmes de spécialisation — Assassin — nuit #34304a / rouge #c0392b | `cl_lameombre` | 48×48 | dague dans un croissant de lune |
| Emblèmes de spécialisation — Assassin — nuit #34304a / rouge #c0392b | `cl_eclaireur` | 48×48 | boussole et dague ailée |
| Emblèmes de spécialisation — Assassin — nuit #34304a / rouge #c0392b | `cl_duelliste` | 48×48 | rapière et gant de défi |
| Emblèmes de spécialisation — Assassin — nuit #34304a / rouge #c0392b | `cl_empoisonneur` | 48×48 | dague et fiole verte |
| Emblèmes de spécialisation — Archer — vert #3f8f52 / bois | `cl_tireur` | 48×48 | arc long et viseur |
| Emblèmes de spécialisation — Archer — vert #3f8f52 / bois | `cl_rodeur` | 48×48 | arc et feuille de chêne |
| Emblèmes de spécialisation — Archer — vert #3f8f52 / bois | `cl_tempete` | 48×48 | arc chargé d'éclairs |
| Emblèmes de spécialisation — Sorcier — violet #6a48b8 / rose arcane | `cl_elementaliste` | 48×48 | bâton à quatre orbes élémentaires |
| Emblèmes de spécialisation — Sorcier — violet #6a48b8 / rose arcane | `cl_arcaniste` | 48×48 | grimoire ouvert et losange rose |
| Emblèmes de spécialisation — Sorcier — violet #6a48b8 / rose arcane | `cl_chrono` | 48×48 | sablier ailé |
| Emblèmes de spécialisation — Sorcier — violet #6a48b8 / rose arcane | `cl_occultiste` | 48×48 | crâne et grimoire violet |
| Emblèmes de spécialisation — Soigneur — turquoise #3fb0a0 / vert | `cl_pretre` | 48×48 | sceptre et auréole |
| Emblèmes de spécialisation — Soigneur — turquoise #3fb0a0 / vert | `cl_druide` | 48×48 | bâton noueux fleuri |
| Emblèmes de spécialisation — Soigneur — turquoise #3fb0a0 / vert | `cl_hemo` | 48×48 | calice de sang |
| Emblèmes de spécialisation — Soutien — doré #ffcf4a / rouge | `cl_troubadour` | 48×48 | luth et plume au chapeau |
| Emblèmes de spécialisation — Soutien — doré #ffcf4a / rouge | `cl_chantre` | 48×48 | cor de guerre et étendard |
| Emblèmes de spécialisation — Soutien — doré #ffcf4a / rouge | `cl_enchanteur` | 48×48 | baguette et sceau étoilé |
| Emblèmes divins (or #ffd75a, aura blanche, étoiles) | `cl_epeiste_divin` | 48×48 | Souverain des Lames : couronne d'épées en éventail |
| Emblèmes divins (or #ffd75a, aura blanche, étoiles) | `cl_berserker_divin` | 48×48 | Titan du Carnage : masque de titan rugissant dans les flammes |
| Emblèmes divins (or #ffd75a, aura blanche, étoiles) | `cl_chevalier_divin` | 48×48 | Seigneur-Soleil : heaume solaire rayonnant |
| Emblèmes divins (or #ffd75a, aura blanche, étoiles) | `cl_paladin_divin` | 48×48 | Égide incarnée : écu vivant aux ailes d'or |
| Emblèmes divins (or #ffd75a, aura blanche, étoiles) | `cl_rempart_divin` | 48×48 | Montagne éternelle : montagne couronnée d'un écu |
| Emblèmes divins (or #ffd75a, aura blanche, étoiles) | `cl_vengeur_divin` | 48×48 | Dieu des Représailles : écu épineux et balance |
| Emblèmes divins (or #ffd75a, aura blanche, étoiles) | `cl_lameombre_divin` | 48×48 | Nuit souveraine : lune noire et étoiles en dagues |
| Emblèmes divins (or #ffd75a, aura blanche, étoiles) | `cl_eclaireur_divin` | 48×48 | Messager des Étoiles : sandale ailée et comète |
| Emblèmes divins (or #ffd75a, aura blanche, étoiles) | `cl_duelliste_divin` | 48×48 | Champion éternel : laurier d'or et rapières croisées |
| Emblèmes divins (or #ffd75a, aura blanche, étoiles) | `cl_empoisonneur_divin` | 48×48 | Fléau primordial : serpent ouroboros vert |
| Emblèmes divins (or #ffd75a, aura blanche, étoiles) | `cl_tireur_divin` | 48×48 | L'Étoile filante : flèche-comète |
| Emblèmes divins (or #ffd75a, aura blanche, étoiles) | `cl_rodeur_divin` | 48×48 | Cœur de la Forêt-Monde : arbre-monde dans un cercle |
| Emblèmes divins (or #ffd75a, aura blanche, étoiles) | `cl_tempete_divin` | 48×48 | Souverain des Tempêtes : œil de cyclone et éclairs |
| Emblèmes divins (or #ffd75a, aura blanche, étoiles) | `cl_elementaliste_divin` | 48×48 | Dieu des Éléments : quatre éléments en roue |
| Emblèmes divins (or #ffd75a, aura blanche, étoiles) | `cl_arcaniste_divin` | 48×48 | Source infinie : symbole de l'infini rose |
| Emblèmes divins (or #ffd75a, aura blanche, étoiles) | `cl_chrono_divin` | 48×48 | Éternité : sablier dans un anneau d'étoiles |
| Emblèmes divins (or #ffd75a, aura blanche, étoiles) | `cl_occultiste_divin` | 48×48 | Néant : disque noir cerné de violet |
| Emblèmes divins (or #ffd75a, aura blanche, étoiles) | `cl_pretre_divin` | 48×48 | Aube incarnée : soleil levant ailé |
| Emblèmes divins (or #ffd75a, aura blanche, étoiles) | `cl_druide_divin` | 48×48 | Mère-Forêt : visage féminin en feuillage |
| Emblèmes divins (or #ffd75a, aura blanche, étoiles) | `cl_hemo_divin` | 48×48 | Dieu-Sang : cœur couronné |
| Emblèmes divins (or #ffd75a, aura blanche, étoiles) | `cl_troubadour_divin` | 48×48 | Muse céleste : lyre étoilée |
| Emblèmes divins (or #ffd75a, aura blanche, étoiles) | `cl_chantre_divin` | 48×48 | Voix de la Guerre : bouche-cor flamboyante |
| Emblèmes divins (or #ffd75a, aura blanche, étoiles) | `cl_enchanteur_divin` | 48×48 | Harmonie : rosace parfaite à huit pétales |
| Pastilles de voie | `cl_voie_coeur` | 16×16 | cœur vert #5fe07a (pastille de coin) |
| Pastilles de voie | `cl_voie_lame` | 16×16 | lame rouge #ff5a5a (pastille de coin) |
| Pastilles de voie | `cl_voie_esprit` | 16×16 | œil cyan #6fd3ff (pastille de coin) |
| Cadres de forme (centre transparent) | `fr_eveil` | 48×48 | cadre rond argenté avec 4 gemmes |
| Cadres de forme (centre transparent) | `fr_apogee` | 48×48 | cadre doré avec ailes stylisées |
| Cadres de forme (centre transparent) | `fr_divin` | 48×48 | cadre d'or rayonnant, couronne d'étoiles, centre transparent |
| Métiers (bois / cuir, accent de la couleur du bâtiment) | `job_cuisinier` | 32×32 | toque et louche |
| Métiers (bois / cuir, accent de la couleur du bâtiment) | `job_architecte` | 32×32 | équerre et compas |
| Métiers (bois / cuir, accent de la couleur du bâtiment) | `job_chasseur` | 32×32 | arc court et trophée de bois de cerf |
| Métiers (bois / cuir, accent de la couleur du bâtiment) | `job_cueilleur` | 32×32 | panier d'herbes |
| Métiers (bois / cuir, accent de la couleur du bâtiment) | `job_entraineur` | 32×32 | mannequin d'entraînement |
| Métiers (bois / cuir, accent de la couleur du bâtiment) | `job_fermier` | 32×32 | fourche et gerbe de blé |
| Métiers (bois / cuir, accent de la couleur du bâtiment) | `job_forgeron` | 32×32 | marteau sur enclume |
| Métiers (bois / cuir, accent de la couleur du bâtiment) | `job_eleveur` | 32×32 | tête de vache et cloche |
| Métiers (bois / cuir, accent de la couleur du bâtiment) | `job_mineur` | 32×32 | pioche et pépite |
| Métiers (bois / cuir, accent de la couleur du bâtiment) | `job_alchimiste` | 32×32 | fiole et creuset |
| Métiers (bois / cuir, accent de la couleur du bâtiment) | `job_marchand` | 32×32 | balance et pièce |
| Métiers (bois / cuir, accent de la couleur du bâtiment) | `job_apothicaire` | 32×32 | mortier et pilon |
| Métiers (bois / cuir, accent de la couleur du bâtiment) | `job_cartographe` | 32×32 | carte roulée et boussole |
| Métiers (bois / cuir, accent de la couleur du bâtiment) | `job_bibliothecaire` | 32×32 | pile de livres et lunettes |
| Métiers évolués (même base + liseré doré) | `job_cuisinier_evo` | 32×32 | Chef étoilé : toque ornée d'une étoile dorée |
| Métiers évolués (même base + liseré doré) | `job_architecte_evo` | 32×32 | Maître bâtisseur : équerre dorée sur un plan de tour |
| Métiers évolués (même base + liseré doré) | `job_chasseur_evo` | 32×32 | Traqueur légendaire : tête de loup argenté |
| Métiers évolués (même base + liseré doré) | `job_cueilleur_evo` | 32×32 | Herboriste sylvain : panier fleuri luisant |
| Métiers évolués (même base + liseré doré) | `job_entraineur_evo` | 32×32 | Maître d'armes : râtelier d'armes doré |
| Métiers évolués (même base + liseré doré) | `job_fermier_evo` | 32×32 | Seigneur des moissons : gerbe dorée couronnée |
| Métiers évolués (même base + liseré doré) | `job_forgeron_evo` | 32×32 | Forgeron des étoiles : enclume étoilée, étincelles bleues |
| Métiers évolués (même base + liseré doré) | `job_eleveur_evo` | 32×32 | Maître des bêtes : selle et fer à cheval dorés |
| Métiers évolués (même base + liseré doré) | `job_mineur_evo` | 32×32 | Mineur des profondeurs : lanterne et cristal violet |
| Métiers évolués (même base + liseré doré) | `job_alchimiste_evo` | 32×32 | Grand alchimiste : pierre philosophale rouge |
| Métiers évolués (même base + liseré doré) | `job_marchand_evo` | 32×32 | Prince marchand : coffre doré débordant |
| Métiers évolués (même base + liseré doré) | `job_apothicaire_evo` | 32×32 | Grand apothicaire : caducée vert |
| Métiers évolués (même base + liseré doré) | `job_cartographe_evo` | 32×32 | Arpenteur des étoiles : astrolabe doré |
| Métiers évolués (même base + liseré doré) | `job_bibliothecaire_evo` | 32×32 | Archiviste : grand tome à fermoir étoilé |
| Badges de palier (médaillon numéroté, bronze 5–30, argent 35–45, or 50, or étoilé 60) | `ms_5` | 48×48 | outil croisé (marteau + plume) sur médaillon bronze — Métier |
| Badges de palier (médaillon numéroté, bronze 5–30, argent 35–45, or 50, or étoilé 60) | `ms_10` | 48×48 | deux écus liés — Sous-classe |
| Badges de palier (médaillon numéroté, bronze 5–30, argent 35–45, or 50, or étoilé 60) | `ms_20` | 48×48 | arme verticale dans un blason — Spécialisation |
| Badges de palier (médaillon numéroté, bronze 5–30, argent 35–45, or 50, or étoilé 60) | `ms_30` | 48×48 | blason à trois pastilles de voie — Sous-classe améliorée |
| Badges de palier (médaillon numéroté, bronze 5–30, argent 35–45, or 50, or étoilé 60) | `ms_35` | 48×48 | éclair d'énergie dans un cercle — Ultime |
| Badges de palier (médaillon numéroté, bronze 5–30, argent 35–45, or 50, or étoilé 60) | `ms_40` | 48×48 | œil qui s'ouvre, rayons argentés — Éveil |
| Badges de palier (médaillon numéroté, bronze 5–30, argent 35–45, or 50, or étoilé 60) | `ms_45` | 48×48 | enclume dorée et étoile — Évolution du métier |
| Badges de palier (médaillon numéroté, bronze 5–30, argent 35–45, or 50, or étoilé 60) | `ms_50` | 48×48 | aile d'or sur médaillon — Apogée |
| Badges de palier (médaillon numéroté, bronze 5–30, argent 35–45, or 50, or étoilé 60) | `ms_60` | 48×48 | couronne d'étoiles sur soleil — Divinité |
| Familles (pictogramme blanc sur pastille de la couleur FAM) | `fam_soutien` | 16×16 | bannière |
| Familles (pictogramme blanc sur pastille de la couleur FAM) | `fam_soin` | 16×16 | croix |
| Familles (pictogramme blanc sur pastille de la couleur FAM) | `fam_protection` | 16×16 | écu |
| Familles (pictogramme blanc sur pastille de la couleur FAM) | `fam_degats` | 16×16 | épée |
| Familles (pictogramme blanc sur pastille de la couleur FAM) | `fam_controle` | 16×16 | chaîne |
| Familles (pictogramme blanc sur pastille de la couleur FAM) | `fam_defense` | 16×16 | rocher |
| Familles (pictogramme blanc sur pastille de la couleur FAM) | `fam_chance` | 16×16 | trèfle |
| Familles (pictogramme blanc sur pastille de la couleur FAM) | `fam_decouverte` | 16×16 | loupe |
| Familles (pictogramme blanc sur pastille de la couleur FAM) | `fam_cuisine` | 16×16 | bol |
| Familles (pictogramme blanc sur pastille de la couleur FAM) | `fam_celerite` | 16×16 | aile |
| Interface de l'arbre | `ui_node_lock` | 12×12 | petit cadenas gris |
| Interface de l'arbre | `ui_node_mystery` | 32×32 | « ? » blanc sur disque neutre (teinté en jeu) |
| Interface de l'arbre | `ui_node_next` | 40×40 | anneau lumineux doré (halo du prochain nœud) |

---

## 13. Implémentation et migration

### 13.1 Nouvelles données (bloc `PROGRESSION` dans `index.html`, après `SKILLS`)

```js
const VOIE={Altruiste:'coeur',Stoïque:'coeur',Gourmand:'coeur',Ambitieux:'lame',Impulsif:'lame',Égoïste:'lame',Calculateur:'esprit',Curieux:'esprit',Opportuniste:'esprit'};
const voieOf=c=>VOIE[c.pers]||'coeur';
const WTECH={epee:'tech_entaille',hache:'tech_fendoir',bouclier:'tech_bouclier',dagues:'tech_estoc',arc:'tech_volee',baton:'tech_deflagration',grimoire:'tech_glyphe',sceptre:'tech_soin',luth:'tech_ralliement',_:'tech_poing'};
const SUBCL={etendard:{n:'Porte-étendard',f:'soutien',sk:'sub_etendard',v:{coeur:'Héraut de l’aube',lame:'Seigneur de guerre',esprit:'Maréchal'}}, /* … 12 entrées, §4.3 */};
const ROLE_SUBS={guerrier:['etendard','medic','runiste'],gardien:['medic','exorciste','etendard'],assassin:['saboteur','contreb','alchi'],archer:['pisteur','dompteur','saboteur'],sorcier:['runiste','exorciste','alchi'],soigneur:['garde','conteur','exorciste'],soutien:['conteur','tacticien','dompteur']};
const SPECS={berserker:{n:'Berserker',r:'guerrier',w:['hache'],t:[],p:['Impulsif','Égoïste','Ambitieux'],s:['Colérique','Téméraire','Orgueilleux'],m:[],e:['feu'],
  mods:{atk:.08,def:-.08},f:['degats','celerite'],tech:'tech_berserker',ult:'ult_berserker',aw:['Fléau rouge','Avatar de la Rage','Titan du Carnage'],pass:['vengeur']}, /* … 23 entrées, §4.4 */};
const JOBS={forgeron:{n:'Forgeron',post:['forge'],evo:'Forgeron des étoiles'}, /* … 14 entrées, §6.1 */};
const JRANK=[0,100,300,700,1500,3000,6000],JRANKN=['Apprenti','Novice','Travailleur','Confirmé','Expert','Maître','Grand maître'],JRLV=[5,10,20,30,40,45,50];
// + SLOTS, BANDW, bandOf, treeRng (§7.2) ; XPB (§1.2) ; RB, K, BUMP, LVM (§3.1)
```

Les nouvelles compétences (✚, signatures, âmes, sous-classes) s'ajoutent à `SKILLS` avec le même format (`n,f,a,r,cd,d,run,ai`, `dp` pour la survie) et deux champs : `tg` (spécialisations/sous-classes qui les marquent) et `sig` (personnalité de signature). Les âmes et compétences de sous-classe ont `fx:1` (exclues des tirages). Techniques et ultimes vont dans `TECHS` / `ULTS` (`{n, d, run(u,P), ic}`), appelés par `doSkill` / `doUlt` à la place des branches par rôle.

### 13.2 Nouveaux champs de personnage

| Champ | Contenu | Défaut |
|---|---|---|
| `c.cls` | `{sub:null, spec:null, aw:0, pend:{}}` — `aw` 0 / 1 (éveil) / 2 (apogée) / 3 (divin) ; `pend` = choix en attente (`job`, `sub`, `aw`) | créé par `initProg(c)` |
| `c.job` | `{id:null, pm:0, voc:null, post:null}` | idem |
| `c.tree` | `{v:1, fix:{}, ins:[], got:[], star:{}}` (`star` : nœuds d'étoile par niveau) | idem |
| `c.xpBank` | réserve d'expérience | 0 |
| `c.deck` | ids des actives épinglées (max 4) | `[]` |
| `G.codex` | §9.1 | `{}` |

### 13.3 Fonctions à modifier

| Fonction | Changement |
|---|---|
| `cap(c)` | `10*c.st` |
| `need(c)` | §1.2 |
| `stats(c)` | remplacer `(1+.1*g.X*L)` par `LVM[X][c.lv]*tilt(g.X,c.lv)` ; ajouter `SPECS[spec].mods` si en harmonie ; VIT/crit des paliers 40/60 ; Constellations ✦ |
| `gain(c,x)` | au plafond : 50 % vers `c.xpBank` (plafond §1.4) ; à chaque niveau : `treeUnlock(c,L)` (remplace `learnRoll` au multiple de `ms`) puis `milestone(c,L)` |
| `milestone(c,L)` *(nouvelle)* | 5 → `pend.job` + 2 vocations ; 10 → `pend.sub` ; 15 → toast pressentiment ; 20 → `cls.spec=specOf(c)`, fige les nœuds V ; 25/55 → maîtrise ; 30 → forme de voie ; 35 → ultime ; 40 → `pend.aw` (choix passerelle) ; 45 → évolution du métier ; 50 → `aw=2` ; 60 → `aw=3` (si 6★). Chaque palier pousse une ligne dans `NEWSK` et une cinématique en file (`PROGQ`) jouée hors combat |
| `kit(c)` | renvoie `{sk, ul, tid, uid, stage}` : technique = `WTECH[type d'arme]` → `SPECS[spec].tech` si niv. ≥ 20 et en harmonie ; ultime = `ROLES.ul` → `SPECS[spec].ult` si niv. ≥ 35 et en harmonie ; `stage` = 0…3 pour les multiplicateurs §5.1. Les surcharges `KITS_PERS`/`KITS_SUB`/`c.kit`/`c.sig` restent prioritaires (Jeanne) |
| `doSkill` / `doUlt` | si `TECHS[tid]` / `ULTS[uid]` existe, l'appeler ; sinon branche par rôle actuelle (repli) |
| `doEvo(id)` | supprimer `drawSkill` d'office → nœud d'étoile ; révéler et figer les nœuds ≤ nouveau plafond ; verser `xpBank` via `gain` ; à 6★ niv. 60 : `tr++` = Constellation (plus de +5 niveaux) |
| `evoNeed`, fiche | textes « niv. max » mis à jour ; onglets §10.1 |
| `initPers(c)` | n'appelle plus `learnRoll` en boucle ; appelle `initProg(c)` |
| `learnRoll`, `drawSkill` | conservés pour les tirages hors arbre (sacrifice, récompenses) ; `drawSkill` exclut `fx`, applique `sig` |
| `upRole(c)` | inchangé ; ajoute `c.harm = !c.cls.spec || SPECS[c.cls.spec].r==c.role` |
| `mkFoe(d)` | option §11.5 (`fScale`) au-delà de l'étage 40 |
| `train`, Camp | Entraîneur (§6.1) |
| Village (tick 8 s) | `+1 pm` par tranche de 10 s pour les personnages en poste |

### 13.4 Mécanismes de combat à ajouter

| Mécanisme | Représentation | Utilisé par |
|---|---|---|
| Poison / brûlure (dégâts sur la durée) | `u.dot=[{k:'psn',v,t,n}]`, appliqué au début du tour de la cible, cumul `n` ≤ 3 (5 Maître des venins) | Empoisonneur, Toxine, Brasier, Grenadier |
| Soin sur la durée | `u.hot=[{v,t}]` au début du tour | Druide, Héraut de l'aube, Floraison |
| Marque | `t.mark={by,v,t}` → `deal` multiplie par `1+v` | Pisteur, Défi, Malédiction, Maléfice |
| Furtivité | `u.stealth=t` → `tgt()` côté ennemi l'ignore tant qu'un autre allié est debout | Lame de l'ombre, Voile d'ombre, Danse des ombres |
| Renvoi de dégâts | `u.thorn=v` → après `hurt`, renvoie `d×v` à l'attaquant | Vengeur, Peau d'épines |
| Saut de tour | `t.skip=n` → `foeTurn` consomme et passe | Arrêt du temps |
| Interposition | dans `deal`, si `t.ally` et un garde éligible : redirige vers le garde (dégâts ×0,7) | Garde du corps, Rempart (ultime), Cœur sacrificiel (existe déjà en partie) |
| Familier | `u.pet={pow,el}` → coup à la fin de chaque tour du maître | Dompteur, Gardien des bois |
| Vol de vie | `u.ls=v` → `heal(u, d×v)` après `deal` | Berserker, Soif de sang, Hémomancien |

### 13.5 Migration (`migrate()`, clé `tdE6`)

```js
function migrateProg(c){initProg(c);const cp=10*c.st;
 if(c.lv>cp){let x=c.xp;for(let L=cp;L<c.lv;L++)x+=need({lv:L});c.xpBank=(c.xpBank||0)+x;c.lv=cp;c.xp=0}
 c.skills.forEach(s=>s.src=s.src||'acquis');
 if(c.lv>=5&&!c.job.id)c.cls.pend.job=1;if(c.lv>=10&&!c.cls.sub)c.cls.pend.sub=1;
 if(c.lv>=20&&!c.cls.spec)c.cls.spec=specOf(c);if(c.lv>=40&&!c.cls.aw)c.cls.pend.aw=1;if(c.lv>=50)c.cls.aw=Math.max(c.cls.aw,2);
 revealTree(c);for(let L=1;L<=c.lv;L++)treeUnlock(c,L,1)}   // silencieux, puis une annonce groupée
```

Avant toute migration : copie `tdE5_bak`. En cas d'erreur, la sauvegarde d'origine reste intacte (même filet que le `try/catch` actuel).

### 13.6 Ordre de réalisation conseillé

1. **Socle** : `cap`, `need`, réserve d'exp., `LVM`/`stats`, migration (jouable seul, corrige déjà l'échelle).
2. **Arbre** : `SLOTS`, `treeOf`, `treeUnlock`, nouvelles compétences, onglet Arbre.
3. **Classes** : techniques d'arme, sous-classes + écran de choix, spécialisations + révélation, harmonie.
4. **Ultimes et éveils** : `TECHS`/`ULTS`, paliers 35/40/50/60, cinématiques, passerelles, Constellations.
5. **Métiers** : attribution, postes, rangs, effets, évolution.
6. **Codex**.
7. **Icônes** (en parallèle dès l'étape 2 : la table §12.3 est complète).

### 13.7 Vérifications de recette

- Un 1★ neuf : nœuds 3, 6, 8 visibles et nommés ; 12–18 en « ? » colorés ; bannières 5/10/20… visibles ; au niv. 10, choix de sous-classe ; plafond bloquant ; l'expérience gagnée au plafond remplit la réserve et se libère à l'éveil 2★.
- Deux personnages de même rôle, même étoile, personnalités différentes : arbres différents ; même graine + mêmes entrées → même arbre (rechargement).
- Changer d'arme entre les niv. 15 et 19 change le pronostic de spécialisation ; après le niv. 20, une arme d'un autre rôle met la spécialisation en sommeil sans perte, la remettre la réveille.
- Jeanne (sauvegarde existante 3★ niv. > 30) : niv. 30, réserve > 0, Chevalier, choix de métier et de sous-classe en attente, *Ordre du commandant* conservé.
- Étage 28 avec un 5★ niv. 50 : un monstre normal tombe en 4–5 attaques de base (§11.3).
- Mobile 390 px : aucune barre de défilement horizontale dans la fiche, la frise, le choix de sous-classe et le codex.
