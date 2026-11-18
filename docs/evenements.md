# Événements d'expédition et blessures détaillées

Code : `js/injuries.js` (blessures) et `js/events.js` (événements, réputation). Bible §11 et §15.

## 1. Blessures (c.wd)

`c.wd = {k, tot, left, fz?, dis?}` : type, durée totale et temps restant (temps réel, sauvegardé ; le jeu ferme = le temps compte). `c.inj` reste le drapeau « indisponible » lu par le reste du code.

| Type | Durée | Repos (indisponible) | Malus | Notes |
|---|---|---|---|---|
| Blessure légère | 12 min | non | ATQ −10 %, DEF −10 % | reste dans l'équipe |
| Traumatisme | 30 min | non | Crit. −40 % | technique de classe impossible (attaque simple), 2 compétences passives coupées |
| Fracture | 45 min | non | VIT −35 %, ATQ −10 % | ultime impossible, déplacements −25 % si capitaine |
| Épuisement extrême | 25 min | oui (tout) | — | indisponible pour combattre |
| Blessure profonde | 60 min | 40 min | puis PV −15 %, ATQ −20 %, DEF −20 %, VIT −10 % | repos prolongé puis convalescence |

Blessure « forcée » (continuer malgré tout) : malus ×1,4 et risque de mort ×2 à la prochaine chute. Une nouvelle blessure plus grave remplace l'ancienne ; sinon elle rallonge la durée de 25 %.

**Gravité à la chute** (`injFall`) : score = profondeur (étage/46 × 0,3) + dégâts excédentaires du coup fatal (jusqu'à 0,4) + type de combat (élite 0,1 / quête 0,15 / boss 0,25) + hasard (0–0,25) ; Stoïque / Résistant −0,1. Plus le score est haut, plus profonde et fracture sont probables.

**Mort définitive** : à la chute, tirage `deathP()` (Infirmerie, Apothicaire, Médecine), ×2 pour un blessé forcé. Le héros y est soumis comme les autres : **s'il meurt, la partie est terminée** (docs/intro.md §4) ; le pourcentage est affiché en rouge dans chaque choix à risque.

### Soins
- **Temps** : vitesse de rétablissement ×1 en expédition (+0,5 avec un Soigneur valide dans l'équipe) ; au village : +0,5 par niveau d'Infirmerie, +0,25 Médecine, +0,25 +0,05×rang d'Apothicaire en poste, +0,15 si un Soigneur se repose.
- **Infirmerie** : « Soigner » coûte `infC` vivres (moitié pour une blessure légère) ; guérison complète. L'Apothicaire en poste soigne seul un blessé (légers compris) à son rythme habituel.
- **Potions** (réserve, dont celles du Laboratoire) : −50 % du temps restant (guérit légère et traumatisme).
- **En expédition**, après une chute grave (profonde, épuisement), choix : soigner sur place (1 dose de potion ou 20 vivres → stade plus léger, retour dans l'équipe) · porter (−30 % de durée, équipe −12 % de vitesse par porté, un porté peut mourir à 50 % de deathP si toute l'équipe tombe) · renvoyer seul (20 % d'aggravation +50 %, jamais mortel) · continuer (RISQUE DE MORT ×2, épuisement exclu) · interrompre l'expédition (butin gardé, blessés −30 %).
- Affichage : icônes `inj_<k>` (repli procédural), badge avec minuteur et malus sur fiche, équipe, HUD d'étage, cartes de combat (message au début), Infirmerie, portail ; avertissements de mort avant combats de boss, portail, choix à risque.

## 2. Événements

1 à 2 par étage **ordinaire** (jamais étage de quête ni de boss). Marqueur losange sur la carte ; embuscades et pièges sont cachés (visibles avec un Cartographe, un Chasseur rang 2+, ou à moins de 30 px) et se déclenchent au contact. Illustration `evt_<k>` (160×120, repli procédural). Chaque choix affiche son risque (type et %) ; les risques mortels sont encadrés en rouge. Les choix marqués ⏳ coûtent 8 s sous la loi du sablier ; sous la loi des ténèbres, les actions de précision perdent 20 %.

| Événement | Poids | Choix (risque) | Hooks |
|---|---|---|---|
| Marchand ambulant | 10 | acheter (stock propre à l'étage : potion, vivres, matériaux, parchemin, objet ; rare si Ombres ≥ 3), vendre des matériaux | remise Compagnie (3 %/pt), métier Marchand, Charmeur/Opportuniste |
| Blessé à secourir | 10 | soigner (aucun risque ; recrutement 35 %, butin 45 %) · fouiller (légère 20 %, Veilleurs −2) · ignorer | Soigneur/Apothicaire : gratuit ; Altruiste +15 % |
| Coffre piégé / camp abandonné | 14 | forcer (légère 25 %, profonde 7 %) · fouiller (réussite 50 % +) · laisser ; camp : fouiller (embuscade 25 %) · se reposer (+40 % PV, embuscade 20 %) · vivres seuls | Cartographe, Mineur, Calculateur |
| Créature mystérieuse | 8 | libérer (légère 25 %, Sylves +2, carte/éclat) · capturer (légère 35 %, Sylves −3, Marchands +1) · abattre (fracture 15 %, légère 20 %, Sylves −2) · ignorer | personnalités |
| Passage secret | 6 | raccourci (légère 20 %, fracture 10 %) · sonder · renoncer | Mineur, Cartographe |
| Rencontre de faction | 6 | payer (+2 rép.) · négocier (40 % +) · forcer (combat d'élite, −3 rép.) | amis : aide gratuite |
| Embuscade / patrouille | 12 | combattre (initiative selon Chasseur/Cartographe) · fuir (selon VIT) · payer ou signe des Ombres · contourner | Chasseur, Cartographe, Ombres |
| Autel des étoiles | 8 | offrande (bénédiction +10 % ATQ/DEF, 4 combats) · prier (+25 % PV, soigne légère) · piller (traumatisme 45 %, profonde 10 %) | gel : effets réduits |
| Source de soin | 8 | boire (+50 % PV ; légère 15 %) · baigner les blessés (temps ÷2) · fioles (potion) | Sylves ≥ 3 : bénie ; gel : ×0,5 |
| Piège | 10 | esquiver · désarmer · foncer (profonde 30 %, fracture 30 %, légère 25 %, **mort 6 %**) · contourner (si détecté) | Mineur, Cartographe, passe-partout |

**Relations** : chaque choix a une valeur morale (aide, égoïsme, cupidité, violence, prudence, risque, honneur, curiosité). Les membres de même avis se rapprochent (+2), d'avis opposés se frictionnent (−2,5) ; un message nomme ceux qui approuvent ou désapprouvent (ex. Altruiste aime aider, Égoïste dislike partager).

**Réputation** `G.rep` (−10 à +10) : Veilleurs de la Tour (soins), Compagnie des Marchands (prix), Confrérie des Ombres (embuscades évitées, stock rare), Cercle des Sylves (créatures, sources). Visible au portail (bouton Détail).

## 3. Sauvegarde
`G.v_inj` (ancien `inj` → blessure profonde à moitié de durée), `G.rep`, `G.injT` (dernier tick). Migrations idempotentes (`injBoot`, `evtBoot`, appelées dans `main.js`).
