# Système de personnalités — cahier des charges

Source : bible globale (§5, §6, §7, §14) + demandes du créateur.
Inspiration de ton : jeu de gestion de héros « gacha idle » mêlé à une tour à défendre/gravir — des personnages attachants, uniques, avec des comportements visibles.

## 1. Génération
- Personnages **non prédéfinis** : personnalité principale **aléatoire** + 1 à 3 sous-traits aléatoires (plus d'étoiles = plus de sous-traits possibles).
- Personnages prédéfinis (Jeanne, etc.) : personnalité fixée à la main.
- Deux personnages de même race et même rareté doivent pouvoir être totalement différents.

## 2. Personnalités principales (bible §6) + axe social
| Personnalité | Orientation compétences | Axe social |
|---|---|---|
| Altruiste | soutien, soin, protection (passives et actives) | gentil ; peut être **harcelé** (« bully ») par les égoïstes → baisse de moral |
| Ambitieux | puissance, réussite, dégâts | compétitif, rivalités fréquentes |
| Calculateur | contrôle, exploitation des faiblesses | froid, respecté, peu d'amitiés |
| Impulsif | attaques rapides, risques | réactions instinctives, conflits rapides |
| Stoïque | défense, résistance | neutre, stable, rarement en conflit |
| Curieux | découverte, recherche, invention | apprécié, lie facilement amitié |
| Gourmand | cuisine, buffs de repas | convivial |
| **Égoïste** (nouvelle) | **+ dégâts des compétences** | **isolement** : relations qui se dégradent, harcèle les altruistes |
| **Opportuniste** (nouvelle) | **+ chance / + critiques / butin** | **apprécié** par la plupart des autres personnalités |

Les sous-traits de la bible (Protecteur, Loyal, Empathique, Compétitif, Orgueilleux, Manipulateur, Téméraire, Patient, Froid, Inventif…) modulent les probabilités.

## 3. Compétences liées à la personnalité et au niveau
- Une **réserve de compétences** par famille (soutien, dégâts, contrôle, défense, découverte, cuisine, chance…), chaque compétence a une rareté (commune → légendaire, bible §7.2).
- Aux **paliers de niveau** (ex. niv. 5, 10, 15, 20…) le personnage tire une compétence : la probabilité de chaque famille est **pondérée** par personnalité principale (fort), sous-traits (moyen), race et rareté (faible). Pas de garantie : un altruiste a *plus de chances* d'avoir du soutien, pas 100 %.
- Compétences **actives** (utilisables en combat) et **passives** (bonus permanents ou réactions : « Cœur sacrificiel », « Promesse inviolable »…). Les compétences qui empêchent la mort restent très rares (bible §7.5).
- Combinaisons (bible §6.1) : Altruiste+Loyal → protection durable, Impulsif+Ambitieux → attaques agressives, Curieux+Calculateur → recherche… = bonus de pondération sur une famille.
- Montée de compétence jusqu'au niveau 10, puis évolution de rareté contre matériaux (bible §7.4).

## 4. Barres de progression différentes
Chaque personnage a sa **propre courbe** : croissance de stats par niveau pondérée par personnalité (ex. égoïste +ATQ, stoïque +DEF/PV, impulsif +VIT, opportuniste +chance/crit), vitesse d'XP, paliers de compétences propres. La fiche personnage affiche clairement cette progression (barre d'XP, prochain palier, compétences possibles « probables »).

## 5. Relations (bible §14)
- Valeur de relation entre chaque paire présente au village / dans l'équipe : amitié ↔ hostilité, + états (rivalité, respect, dépendance, harcèlement).
- Évolue avec le temps passé ensemble (équipe, combats) selon la compatibilité des personnalités (table de compatibilité : égoïste↘ tout le monde, opportuniste↗ tout le monde, égoïste harcèle altruiste, ambitieux rivalise avec ambitieux…).
- Effets : moral (bonus/malus de stats), dialogues dans le village (bulles), attaques combinées entre amis, provocations entre rivaux, personnage isolé qui refuse parfois un ordre ou se bat moins bien en groupe.
- Visible : panneau « Relations » sur la fiche + petites icônes dans l'équipe.

## 6. Équipement
Armes et armures ont **les mêmes raretés que les personnages (1★ à 6★)**.

## 7. Implémentation (index.html) — précisions
- **Génération** : 9 personnalités tirées uniformément ; 1 sous-trait, 2e à 20 % + 10 %/★ (1★ 30 %, 6★ 80 %), 3e à 6 %/★ si le 2e existe. 70 % des sous-traits viennent de la personnalité principale, 30 % d'une autre (jamais altruiste ↔ égoïste) — c'est ce qui rend possibles les combinaisons §6.1. Jeanne reste fixe : Altruiste (Loyal, Courageux), Égide de départ.
- **Pondération des familles** (10 familles : soutien, soin, protection, dégâts, contrôle, défense, chance/butin, découverte, cuisine, célérité) : base 1 partout, personnalité principale +4 à +7 (fort), chaque sous-trait +1/+2 (moyen), race +0,4 à +0,8 et classe +0,1 × étoiles (faible), combinaisons §6.1 +3/+4. Exemple mesuré : un altruiste obtient ~66 % de soutien/soin/protection, un égoïste ~15 %.
- **Paliers** : tous les 5 niveaux par défaut (Curieux 4, Stoïque 6) ; chance d'apprendre propre au personnage (55–95 %, rien n'est garanti). Un doublon fait gagner 2 niveaux à la compétence. Rareté tirée 50/28/14/6/2 (commune → légendaire), légèrement améliorée par les étoiles ; compétences qui empêchent la mort (Dernier souffle, Refus de mourir, Rappel des étoiles) ×0,25 et limitées à une fois par combat / par expédition.
- **Compétences** : 59 (actives : 1 point de compétence + temps de recharge, choisies au combat avec ⇄ ou la touche Q, utilisées par l'IA selon la situation ; passives : stats permanentes, effets de début de combat, de tour, réactions aux coups, butin). Niveau 1→10 contre de l'or, puis évolution de rareté contre des tomes de compétence et de l’or (voir docs/evolution.md) (+40 % de puissance par cran, retour au niveau 1).
- **Croissance** : multiplicateurs propres de PV/ATQ/DEF par niveau, VIT et critique gagnés par niveau, vitesse d'expérience, intervalle de palier et chance d'apprendre, issus de la personnalité, des sous-traits et d'un petit aléa.
- **Relations** : valeur −100…100 par paire, dérive toutes les 8 s au village (×0,4), lors des conversations entre voisins (×0,8) et après chaque combat pour l'équipe (×1,5, +0,5 en cas de victoire sauf paire très incompatible). Table de compatibilité dans le code (`CT`) ; les stoïques ne descendent pas sous −20, les opportunistes sous −10 (sauf avec un égoïste). États : ami ≥ 40, hostile ≤ −40, rival (deux ambitieux/compétitifs/orgueilleux ayant passé du temps ensemble), harcèlement (égoïste ↔ altruiste ≤ −25), respect (calculateur ou stoïque, ≥ 15) ; isolé = aucun ami et moyenne < −15.
- **Effets** : moral ±4 % par ami/hostile dans l'équipe, +2 % par rival, −10 % pour un altruiste harcelé si le harceleur est là (−4 % sinon), isolé −8 % en groupe de 3+ et 12 % de chances d'ignorer un ordre en mode manuel ; attaque combinée 12–24 % entre amis ; un rival « piqué au vif » gagne ATQ +15 % quand l'autre fait un critique ou un coup fatal.
