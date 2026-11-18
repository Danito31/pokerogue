# Galaxie solo, voyages, pillage, capture et défense

Sources : bible §2.2 (serveur-galaxie), §16 (galaxie, planètes, bateau), §17 (pillage, défense, capture), §19 (principes : capture extrêmement rare, mort annoncée, risques lisibles) ; `docs/mages.md` (bateau `G.ship`, modules, pilote), `docs/metiers.md` (Marchand), `docs/evenements.md` (réputation `G.rep`), `docs/personnalites.md` (compatibilité, réactions).
Code : `js/galaxy.js` (planètes, fournisseur, carte, voyages, commerce, diplomatie, recrutement, exploration, journal) et `js/raids.js` (pillage, capture, Cachots, raids PNJ, défense), chargés après `js/mages.js` et avant `js/main.js`. Toutes les valeurs ci-dessous sont celles du code (`GAL`, `RAID`).

## 1. Accès
- Bouton **Galaxie** dans le HUD du village dès l’étage 20 franchi (`G.ballon`). Avant que le bateau soit prêt : **vue verrouillée** (votre planète seule dans le brouillard, liste des étapes : 5 étapes du Chantier, pilote mage, baptême).
- Ouverte quand `G.ship.ready` **et** un pilote mage est nommé (`pilotOf()`). Retirer le pilote referme la galaxie (le baptême est à refaire, règle de `js/buildings2.js`).
- Le Chantier naval affiche aussi un bouton « Carte de la galaxie ».

## 2. Génération (graine par sauvegarde)
`G.gal.seed` ; pendant la génération `Math.random` est remplacé par un générateur à graine (mulberry32), donc `mk()`, `pick()`… restent ceux du jeu.
- **16 planètes** placées dans une ellipse de 420 × 228 px autour du village (carte 960 × 540, 1 ua = 40 px), à ≥ 110 px du village et ≥ 92 px entre elles.
- **Palier** `tier` = 0,55 + 0,9 × rang de distance / 15 ± 0,08 (0,5–1,5) : les planètes proches sont faibles, les lointaines fortes et riches.
- **Biome** selon l’image `planete_1..10` : forestier, désertique, glace, volcanique, océanique, cristal, ruines, géante annelée, crépusculaire, doré → biome de la Tour (forêt, désert, givre, cendres, ruines, cristal) pour l’exploration et le décor de combat ; chaque biome a 4 spécialités vendues et 3 marchandises demandées.
- **Dirigeant** : personnage `mk()` de 2★ à 6★ (2 + 1,8 × palier), titre (Archonte, Capitaine…), personnalité et sous-traits normaux. **Habitants** : 2 + niveau du village (max. 6) personnages `mk()` 1★–5★ (1,3 + 1,6 × palier ± 1). Ils ne sont pas ajoutés au codex du joueur.
- **Niveau du village** = 1 + 2,7 × palier (1–5). **Faction** au hasard (Veilleurs, Marchands, Ombres, Sylves).
- **Mise à l’échelle** : à chaque changement de L (moyenne des 4 meilleurs niveaux du joueur, min. 5), chaque PNJ passe au niveau L × palier × (0,85–1,1), plafonné à 10 × étoiles.
- **Défense** = (60 × niv^1,5 + Σ niveau × étoiles × 2 des niv premiers habitants) × (1 + 0,1 × (niv − 1)). **Puissance** d’un personnage `cPow` = PV/6 + ATQ × 2 + DEF × 1,5 + VIT (sur `stats(c)`).
- **Réserves** (capacité) : vivres 400 × niv, bois/pierre 450 × niv, or 250 × niv × (1 + palier), spécialités ×1,6 ; matériaux : 9 / 4 / 1,2 × niv selon leur valeur. Départ à 55–90 % ; réapprovisionnement de 35 % de l’écart par heure ; habitants morts remplacés à l’heure.

## 3. Attitude (−100 … +100)
Attitude = valeur propre + 3 × réputation de la faction (`G.rep`, −10…+10). Base : personnalité du dirigeant (Altruiste +20, Opportuniste +10, Curieux +10, Gourmand +5, Stoïque 0, Calculateur −5, Impulsif −10, Ambitieux −15, Égoïste −20) ± 20.

| Attitude | État | Effets |
|---|---|---|
| ≥ 60 | Allié | achats ×0,85, ventes ×1,12, ne vous attaque jamais |
| ≥ 30 | Amical | achats ×0,92, ventes ×1,06 |
| −29 … 29 | Neutre | prix normaux |
| ≤ −30 | Hostile | achats ×1,25, ventes ×0,85, débarquement (exploration) interdit, intercepte les voyages proches |
| ≤ −60 | — | refuse tout commerce |
| < −10 | — | interdit le recrutement de ses vagabonds |

**Présents** (diplomatie) : 500 or, 2 000 or, 300 vivres, 2 cristaux, 4 lingots ; attitude + ⌊valeur / (40 + 8 × étage max)⌋, max. +15, un présent toutes les 20 min. Goûts : Égoïste or ×1,5, Opportuniste or ×1,2, Calculateur or ×1,1, Gourmand vivres ×2, Curieux matériaux ×1,5, Altruiste tout ×1,2, Ambitieux tout ×0,8.

## 4. Découverte (brouillard)
Portée de la Longue-vue = 2 + 1,5 × détection ua (détection = module 1/2/3/5, +1 pilote élémentaire) autour du village **et** de la position du bateau à chaque arrivée. Les planètes hors de portée (jusqu’à +2,5 ua) apparaissent comme des signaux « ? ». Une planète qui vous attaque se révèle.

## 5. Voyages
- Durée = distance × 2,5 min / vitesse du bateau (module Hélices ×1/1,25/1,5/2, pilote temporel +20 %, *Navigation stellaire* +10 %) × `GAL.TS` (1 ; échelle de jeu). Exemples à ×1 : 3 ua = 7 min 30, 10 ua = 25 min.
- Carburant au choix : **vivres** 8 / ua (pilote naturel −25 %) ou **essences** arcanique ou de foudre, 1 / 4 ua, voyage −20 %.
- Pendant le voyage : ni commerce, ni exploration, ni pillage ; un seul trajet à la fois ; pilote blessé = départ impossible.
- **Interception** : +12 % par planète hostile à moins de 2,5 ua du trajet, max. 40 %, × (1 − camouflage %) (Voile 0/20/40/60 %, pilote obscur +10). Résolue à l’arrivée : repoussée si bouclier + puissance d’équipe / 20 ≥ (80 + 12 × étage max) × 0,7–1,3 ; sinon 25 % de chaque marchandise des soutes perdue (15 % avec un pilote sacré) et 25 % de chance de perdre un objet.
- **Soutes** (module Stockage 100/300/600/1 200 places) : 1 place = 10 vivres/bois/pierre, 25 or, 1 matériau (3 pour noyau, mithril, parchemins ≥ 2…), 5 par objet. Achats et butin voyagent dans les soutes et sont **déchargés au retour au village** (plafonds de l’Entrepôt respectés).

## 6. Visite d’une planète
- **Commerce** (bateau amarré) : offres = spécialités en stock, lots du Marché (100 ressources, 5/2/1 matériaux selon leur valeur), prix = valeur × lot × prix propre à la planète (0,85–1,25) × attitude × (1 − remise Marchand `mkBuyD`). Vente des marchandises demandées : valeur × lot × 0,45 × 1,25 × (1 + bonus Marchand `mkSellB`) × attitude, payée avec l’or de la planète (limité). Les échanges donnent +2 d’expérience de métier aux Marchands.
- **Exploration** : l’équipe débarque dans un vrai étage de la Tour du biome de la planète (le plus haut étage ordinaire ≤ votre progression ; sinon le premier au-delà, signalé « au-delà de votre progression »), avec sa loi, ses événements et son butin. La progression de la Tour (`G.max`) n’avance pas. Réussite : 1–3 de chaque spécialité matériau et attitude +3. Une exploration par planète toutes les 20 min ; interdit si hostile.
- **Recrutement** : un vagabond rare toutes les 4 h par planète (présent 70 %) : 3★ 60 %, 4★ 32 %, 5★ 8 % ; mage 15 %. Prix 200 × ★² or (5★ = 5 000). Place à l’Auberge requise, attitude ≥ −10.

## 7. Pillage (bible §17.1)
- Prérequis : bateau amarré, équipe non vide, planète hors période de protection.
- **Risque lisible** : force = puissance d’équipe × (1 + bouclier / 2 000) contre défense = puissance des défenseurs × (1 + 0,5 × déf / (déf + 3 000)) ; chances estimées = 1 / (1 + (D/A)³) et risque Faible (≥ 80 %), Modéré (≥ 55 %), Élevé (≥ 30 %), Extrême. L’écran rappelle la mort définitive (deathP) et le taux de capture.
- **Combat** : système de combat existant (`runBattle`, faux étage minimal, loi « ⚑ Pillage » sans effet) contre le dirigeant (élite) + jusqu’à 3 habitants (selon le niveau du village), avec leurs vrais sprites et `stats()` × bonus de défense. Membre de l’équipe à terre : mort définitive au taux `deathPc` (héros jamais), sinon blessure (`injFall`).
- **Défenseurs vaincus** : en cas de victoire, 15 % périssent (sauf le dirigeant), les autres restent **vivants, blessés 1 h**.
- **Butin** (victoire) : réserves exposées = stock × (1 − protection), protection = 25 % + 8 % × niveau du village (33–65 %) ; vous emportez (40 + Grappins 0/10/20/35) % de l’exposé, toutes catégories (or, vivres, bois, pierre, matériaux) ; équipement 30 % (rareté ≈ palier × 3) ; objet rare 10 % (parchemin/tome/pierre ★1–2, noyau ou mithril). Tout est réduit à la place libre des soutes.
- **Sauvetage** : une victoire libère tous vos personnages retenus par cette planète.
- **Conséquences** : attitude −30 (−15 si échec), autres planètes de la faction −8, réputation de la faction −2, **protection de la planète 2 h**, **riposte** : 60 % après une victoire (40 % après un échec), + modificateur du dirigeant (Impulsif +25 %, Ambitieux +15 %, Égoïste +10 %, Calculateur +5 %, Curieux −5 %, Stoïque −15 %, Altruiste −20 %), −20 % si palier < 0,8 ; elle part 30 à 90 min plus tard (préavis normal).

## 8. Capture de personnages (bible §17.2–17.5) — extrêmement rare
- **Conditions cumulatives** : l’attaquant gagne ; la cible (tirée parmi les habitants **vivants** à la fin du combat, dirigeant exclu) ; **tirage distinct** réussi.
- **Taux** : 0,4 % × (1 + 0,15 × niveau des Grappins) × (0,5 + 0,5 × PV restants de l’équipe) × 0,5 si la cible a 5★ ou plus × 1,1 si un Opportuniste ou un Calculateur est dans l’équipe ; **plafond 0,8 %**. Le taux exact est affiché dans le rapport (« Tentative de capture sur X : échec (0,46 %) »).
- **Mesuré** (Playwright, 50 000 pillages gagnés simulés, PV restants aléatoires, Grappins niv. 1) : **169 captures = 0,34 %** (moyenne théorique 0,38 %) ; 0 capture sur 5 000 pillages perdus.
- Une capture coûte en plus −25 d’attitude avec l’ancien propriétaire.
- **Loyauté** envers l’ancien propriétaire = compatibilité des personnalités `compat(captif, dirigeant)` bornée à −1…+1.
- **Réaction** (poids, §17.3) : base Acceptation 30, Refus 40, Prison 30 ; Opportuniste +40 A ; Égoïste +15 A +10 P ; Ambitieux +10 A +5 R ; Calculateur, Curieux +15 A ; Gourmand +10 A ; Stoïque +15 R ; Altruiste +20 R ; Impulsif +30 P ; sous-traits Loyal +30 R, Courageux/Téméraire +15 P, Manipulateur +10 A, Orgueilleux +10 R +10 P, Patient +5 A ; loyauté > 0 : A −30 × loy, R +30 × loy ; loyauté < 0 : A +25 × |loy| ; héros au talent Charisme +15 A ; minimum 2. Mesuré sur les 169 captures : 61 acceptations, 60 refus, 48 prisons.
- **États** (§17.4) :
  - **Acceptation** : rejoint le village, démoralisé 30 min (ATQ/DEF −15 %). S’il reste loyal (> 0,3), 1 %/h de **désertion** pendant 6 h (hors équipe). Auberge pleine → prison si une cellule est libre, sinon rendu contre rançon (150 × ★² or).
  - **Refus / démoralisation** : au village mais refuse l’équipe et le poste de garde pendant 90 min × (Stoïque 1,5, Opportuniste 0,5) × (Loyal 1,5) × (1 + loyauté positive) ; ATQ/DEF −15 % ; **rébellion** (fuite) 4 %/h × (1 + loyauté) × 1,5 si Impulsif. Actions : **Apaiser** (100 × ★ or, refus −30 %, toutes les 30 min), **Emprisonner**, **Libérer** (attitude +12). À la fin : acceptation + démoralisation 30 min.
  - **Prisonnier** : **Cachots** des Remparts, 1 cellule par niveau (0 sans Remparts). Ne combat pas, ne travaille pas, ne compte pas à l’Auberge. **Évasion** : max(0,5 %, 3 % × 1,5 si Impulsif ou Courageux × (1 + loyauté) − 0,5 point par garde en poste) par heure. Actions : **Négocier** toutes les 30 min, réussite 12 % + 4 %/h de détention (max. +30) + 10 % Opportuniste/Calculateur − 15 % × loyauté, bornée 3–60 % → acceptation ; **Libérer** (attitude +12) ; **Rançon** 150 × ★² or (attitude +6) ; **Échanger** contre un de vos personnages retenu par la même planète. Cachots pleins → choix immédiat : libérer (attitude +10) ou rançon.
- La capture n’est jamais une mort : le personnage garde son équipement, ses niveaux et sa personnalité.

## 9. Raids PNJ contre votre village (§17, défense)
- Seulement quand la galaxie est ouverte. Premier tirage après 1 h de grâce + 2 à 5 h ; ensuite tous les 2 à 5 h (× 1,6 s’il n’existe aucune planète hostile). Attaquant tiré au poids max(0, 30 − attitude)^1,3 (alliés et planètes protégées exclus). Riposte programmée prioritaire.
- **Préavis 10 min** : toast, bouton Galaxie rouge avec minuteur, onglet Défense (forces, chances, tribut). **Tribut** = 1,5 × force : annule le raid (attitude +2).
- **Force d’attaque** = (60 + 18 × étage max) × palier × 0,85–1,15 (× 1,25 pour une riposte). **Défense** = `G.mg.def` (Remparts : base 100/250/500 + gardes + recherches de défense, `defRating`) + bouclier du bateau s’il est à quai (0/100/250/500, pilote arcanique +20 %) + milice 40. Victoire si tirage < 1 / (1 + (A/D)³).
- **Victoire** : prime 0,3 × A or, attitude de l’attaquant −5 ; chaque garde 15 % de blessure légère.
- **Défaite** : l’Entrepôt protège 25/40/55/70 % (niv. 0–3) de chaque réserve ; l’attaquant prend 15 % + 10 % × (min(3, A/D) − 1) de l’exposé (or, vivres, bois, pierre, matériaux), limité à 300 + 30 × étage max places ; 10 % de chance de voler un objet non équipé.
- **Gardes** (seuls exposés : personnages postés aux Remparts ; l’équipe et le reste du village ne risquent rien) : en défaite, 60 % de blessure (légère ×2, fracture, profonde, traumatisme) ; **mort définitive** seulement sur blessure profonde, à deathP × 0,1 (mesuré : 0,14 % par garde et par défaite avec deathP = 10 %) ; le héros aussi — sa mort termine la partie — mais il ne peut pas être capturé. **Capture par l’ennemi** : 0,3 % par garde blessé (mesuré 0,23 % par garde et par défaite), récupérable par rançon (250 × ★² × (1 + niv/30) or), échange de prisonniers ou victoire de pillage sur cette planète. Avertissements affichés aux Remparts et dans l’onglet Défense.
- **Protection** : aucun raid PNJ pendant **3 h** après une attaque (victoire ou défaite). Rapports illustrés `ile_defense` (victoire) / `ile_pillage` (défaite).

## 10. Journal galactique
Onglet Journal : 120 dernières entrées horodatées (voyage, commerce, exploration, diplomatie, découverte, pillage, défense, capture) et compteurs (`G.gal.st`).

## 11. Brancher un vrai serveur multijoueur
Toute lecture ou modification d’une **autre** planète passe par l’objet global `GP` (interface *GalaxyProvider*), aujourd’hui `LocalGalaxy` :

| Méthode | Rôle | Local | Serveur |
|---|---|---|---|
| `list()` / `get(id)` | planètes connues (synchrone) | `G.gal.planets` | cache client rafraîchi par un `GET /galaxy/planets` (instantané public : nom, biome, dirigeant, attitude, défense, réserves exposées) |
| `trade(id, {buy|sell})` | achat/vente | `galTradeL` | `POST /planets/:id/trade`, stock et prix arbitrés par le serveur |
| `gift(id, offre)` | présent | `galGiftL` | `POST /planets/:id/gift` |
| `recruit(id)` | vagabond | `galRecruitL` | `POST /planets/:id/recruit` |
| `raidPrep(id)` | défenseurs à affronter | `galRaidPrepL` | instantané signé des défenseurs (personnages du joueur cible) |
| `raidResolve(id, issue)` | butin, capture, conséquences | `galRaidResolveL` | le client envoie l’issue du combat (ou le serveur rejoue le combat avec la graine) ; butin, **tirage de capture** et protections sont décidés côté serveur |
| `incoming()` / `defendResolve(raid, défense)` | raids contre le joueur | `G.gal.nr`, `galDefendL` | flux poussé (WebSocket) ; résolution serveur avec la défense publiée du joueur |
| `ransom(id, perso)` | rachat d’un captif | `galRansomL` | `POST /planets/:id/ransom` |
| `tick(now)` | évolution du monde | `galWorld` | inutile (le serveur fait vivre les planètes) |

Les méthodes qui modifient une autre planète sont **asynchrones** et toute l’interface les attend (`await GP.trade(...)`) : un `RemoteGalaxy` peut renvoyer des promesses réseau sans autre changement. Pour brancher un serveur : définir `RemoteGalaxy` avec les mêmes méthodes, puis `GP = RemoteGalaxy` avant `galBoot()`. Ce qui reste local au joueur : son bateau (position, soutes, voyages), son village, ses Cachots, son journal. Dans un vrai serveur, chaque planète PNJ devient la planète d’un joueur (bible §16.4) : `own`/`chars` sont alors ses personnages publiés, `def` sa `G.mg.def`, `stock` ses réserves exposées — la capture d’un personnage d’un autre joueur doit rester arbitrée par le serveur avec les mêmes taux.

## 12. Sauvegarde et accroches
- Clé `tdE6` inchangée. `G.gal = {seed, planets[], ship{at, tr, cargo}, log[], nr{next, inc, ret}, prot, prison[], lost[], capq, lastDef, st{}, lt}` ; captif : `c.gx = {from, fn, on, t, loy, st, until, dem, calm, react}`.
- Migration idempotente `galMigrate` (drapeau `G.v_gal`, sauvegarde `tdE6_vg_bak`), appelée par `galBoot()` depuis `js/main.js` ; `galEnsure()` complète l’état à chaque accès ; les planètes sont générées dès que le bateau est baptisé.
- Enveloppes (aucune modification des autres fichiers JS hors `main.js`) : `hud` (bouton Galaxie), `XPAN.chantier` (bouton carte), `XPAN.remparts` (avertissement + Cachots), `shipBapt` (texte), `enterFloor` / `leaveFloor` (exploration, `G.max` préservé), `mkFoe` (défenseurs-personnages), `stats` (démoralisation), `tParty` (refus). Horloge `galTick` (1 s) : arrivées, découverte, monde, captifs, raids, minuteurs.

## 13. Non couvert / limites
- Pas de vrai serveur : les « autres joueurs » sont des PNJ ; `GAL.TS` permet d’accélérer ou ralentir tous les voyages et raids.
- Les captifs ne retournent pas « se venger » individuellement ; un personnage capturé par l’ennemi n’est pas utilisé par la planète PNJ.
