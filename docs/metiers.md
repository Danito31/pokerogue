# Métiers, postes et nouveaux bâtiments

Source : `docs/progression.md` §6 (14 métiers, poids au niv. 5, 7 rangs, évolution au niv. 45, bâtiments de poste), bible §4 (bâtiments) et §8 (métiers, économie), `docs/evolution.md` (matériaux, artisanat).
Code : `index.html`, bloc `MÉTIERS, POSTES ET NOUVEAUX BÂTIMENTS` (juste avant `SKEY`). Toutes les valeurs ci-dessous sont celles du code.

## 1. Village et Hôtel de ville

Le village compte **10 terrains** et un **site réservé à l’Hôtel de ville** (au nord du portail, `G.plots[10]`). Les terrains 0 à 5 sont ceux des anciennes sauvegardes (bâtiments conservés tels quels) ; les terrains verrouillés sont affichés en transparence avec le niveau d’Hôtel de ville requis.

| Hôtel de ville | sans | niv. 1 | niv. 2 | niv. 3 |
|---|---|---|---|---|
| Terrains ouverts | 6 | 8 | 10 | 10 |
| Bâtiments constructibles | Auberge, Ferme, Camp, Infirmerie, Forge | + Chasse, Entrepôt, Marché | + Bibliothèque, Laboratoire | tous |
| Niveau max. des nouveaux bâtiments | – | 1 | 2 | 3 |
| Niveau 3 des 5 premiers bâtiments | non (niv. 2 max.) | oui | oui | oui |
| Production Ferme et Chasse | – | – | – | +10 % |

Un bâtiment déjà au niveau 3 dans une ancienne sauvegarde le reste (seule l’amélioration est contrôlée). Maître bâtisseur (Architecte évolué) : +1 terrain en avance (7 / 9 / 10).

### Coûts
Niveau `L` : bois `c₀ × L`, pierre `c₁ × L`, or `g × (L − 1)` ; Architectes en poste : −4 % par rang cumulé (max. −28 %), évolué : −10 % de plus sur les améliorations.

| Bâtiment | c₀ (bois) | c₁ (pierre) | g (or) | Poste(s) |
|---|---|---|---|---|
| Auberge / Ferme / Camp / Infirmerie / Forge | 60/50/70/60/40 | 30/20/50/60/90 | 0 | inchangés |
| Hôtel de ville | 120 | 120 | 500 | Architecte, Cartographe |
| Installations de chasse | 80 | 40 | 150 | Chasseur, Éleveur |
| Entrepôt | 100 | 60 | 150 | Mineur |
| Marché | 70 | 50 | 200 | Marchand |
| Bibliothèque | 90 | 90 | 300 | Bibliothécaire, tout mage |
| Laboratoire d’alchimie | 60 | 100 | 300 | Alchimiste, Apothicaire |

Aucun coût ne dépasse la capacité de base (800) : l’Entrepôt n’est jamais un passage obligé.

## 2. Les six nouveaux bâtiments

### Installations de chasse
Production par heure et par niveau : **viande 10, crocs 3, cuir 1,5**, × (1 + 0,15 × rangs de Chasseurs en poste + 0,25 Tannerie + 0,10 Hôtel de ville niv. 3). La réserve se remplit jusqu’à 4 h de production ; bouton **Récupérer** (soumis aux capacités). Repère : un étage rapporte ~10 matériaux en ~5 min ; la chasse niv. 3 avec un Chasseur confirmé donne ~60 viandes, 18 crocs et 9 cuirs par heure, sans jouer.

### Entrepôt — capacités
| Entrepôt | sans | niv. 1 | niv. 2 | niv. 3 |
|---|---|---|---|---|
| Bois, pierre | 800 | 2 000 | 5 000 | 12 000 |
| Vivres | 500 | 1 500 | 3 000 | 6 000 |
| Matériaux de forge et essences (par type) | 60 | 150 | 300 | 600 |

Recherche *Rayonnages* : +25 %. Non limités : or, éclats, parchemins, pierres d’éveil, tomes, fragments. Au-delà de la capacité, le gain est perdu (message « Entrepôt plein ») ; **rien n’est jamais retiré** : un stock d’ancienne sauvegarde au-dessus du plafond reste intact, seuls les nouveaux gains sont bloqués. Le HUD colore en orange une ressource pleine.

### Marché
Offres : 3 + niveau (+1 *Négoce*, +1 si un Marchand de rang ≥ 3 est en poste, +1 offre rare du Prince marchand). Renouvellement toutes les **30 min** (horloge réelle) ou contre 60 or.

| Niveau | Marchandises (lot × stock) |
|---|---|
| 1 | vivres/bois/pierre 100 ×3 ; minerai 5, cuir 3, tissu 3, bois ouvragé 3, crocs 5, viande 10, poussière 3 (×2) |
| 2 | + lingots 2, cristal 2, essence 2 (×2) ; parchemin ★1, tome commun, pierre ★1, fragments 5 (×1) |
| 3 | + noyau, mithril, parchemin ★2, tome peu commun, pierre ★2, objet d’équipement 2–3★ (×1) |

Valeurs (or par unité) : vivres 0,4 · bois/pierre 0,8 · viande 4 · croc 6 · minerai 8 · poussière 10 · bois ouvragé 12 · cuir/tissu 15 · fragment 15 · lingot 30 · cristal 40 · essence 50 · noyau 120 · mithril 150 · parchemin ★n 150 × 3ⁿ⁻¹ · pierre et tome ★n 120 × 3ⁿ⁻¹ · objet 120 × ★².
Achat = valeur × (1 − remise), remise = 3 % par rang de Marchand (max. 24 %) + 5 % *Négoce* + 15 % Prince marchand, plafonnée à 40 %. Vente = 40 % de la valeur × (1 + 5 % par rang, max. +40 %), ressources par lots de 50. Pas d’arbitrage possible (vente ≤ 56 % < achat ≥ 60 %).

### Bibliothèque — recherches
Une recherche à la fois, file d’attente = niveau. Le temps réel compte (jeu fermé compris). Durée × max(0,5 ; 1 − 5 % par rang de Bibliothécaire) × (1 − 10 % par mage en poste, 2 au plus).

| Recherche | Biblio. | Coût | Durée | Effet |
|---|---|---|---|---|
| Agronomie | 1 | 300 or, 2 tissus | 10 min | Ferme +15 % |
| Tannerie | 1 | 300 or, 4 crocs | 10 min | Chasse +25 % ; tanner 2 crocs au lieu de 3 |
| Rayonnages | 1 | 400 or, 3 bois ouvragés | 15 min | capacités +25 % |
| Pédagogie | 1 | 500 or, 1 tome commun | 20 min | exp. de métier +25 % |
| Herboristerie | 2 | 600 or, 3 poussières | 20 min | recette du Philtre de vigueur |
| Négoce | 2 | 800 or | 30 min | +1 offre, achats −5 % |
| Métallurgie | 2 | 1 000 or, 3 lingots | 30 min | catalyseur de Forge +0,5 |
| Cartographie | 2 | 700 or, 2 tissus | 25 min | 15 % de chaque étage révélé |
| Médecine | 3 | 1 200 or, 2 cristaux | 45 min | mort −5 points, soins −25 % |
| Archives des étoiles | 3 | 1 500 or, 1 tome peu commun | 60 min | niveaux de compétence −15 % d’or |
| Transmutation | 3 | 1 500 or, 2 noyaux | 60 min | distillation : 2 essences |

Point d’accroche pour les **recherches des mages** (bible §9.4) : table `MAGE_RS` (vide) ; un mage peut déjà être affecté à la Bibliothèque comme chercheur, quel que soit son métier.

### Laboratoire d’alchimie
| Recette | Niv. | Coût | Résultat |
|---|---|---|---|
| Potion de soin | 1 | 2 viandes, 1 poussière, 10 or | objet potion, rareté tirée |
| Élixir d’énergie | 1 | 2 poussières, 1 cristal, 30 or | objet élixir (+1 dose si Alchimiste rang ≥ 4) |
| Philtre de vigueur | 2 + Herboristerie | 3 viandes, 2 poussières, 30 or | équipe DEF +12 % pour 3 combats (cumul 9) |
| Distillation d’essence | 2 | 1 cristal, 2 poussières, 40 or | 1 essence de l’élément choisi (2 avec Transmutation) |
| Transmutation | Grand alchimiste | 3 essences | 1 essence d’un autre élément |

Rareté : table de la Forge au niveau du Laboratoire, catalyseur +0,15 par rang d’Alchimiste au labo (Apothicaire au labo : moitié). Niv. 1 : 3★+ 10 %, niv. 3 sans métier : 30 %. La potion du labo (viande) est moins chère en or que celle de la Forge (vivres + 20 or) : la chasse alimente l’alchimie.

## 3. Métiers

### Attribution, postes
Attribution au niv. 5 inchangée (§6.2 de `progression.md` : deux vocations pondérées, confirmation en deux temps, « Plus tard » possible). Chaque bâtiment a **un poste par niveau** (Hôtel de ville compris). Un personnage en poste **ne peut pas être dans l’équipe** : l’affecter le retire de l’équipe (refusé s’il est le dernier combattant), l’ajouter à l’équipe le retire de son poste. Blessé : il garde son poste mais ne travaille pas. Seuls les métiers adaptés peuvent prendre un poste (bâtiment cible, sinon repli tant que la cible n’existe pas ; dès que la cible est construite, le poste y migre).

| Métier | Poste (repli) |
|---|---|
| Cuisinier | Auberge |
| Architecte | Hôtel de ville (sinon tout bâtiment) |
| Chasseur | Installations de chasse |
| Cueilleur, Fermier | Ferme |
| Éleveur | Chasse ou Ferme |
| Entraîneur | Camp |
| Forgeron | Forge |
| Mineur | Entrepôt (Forge) |
| Alchimiste | Laboratoire (Infirmerie) |
| Marchand | Marché (Auberge) |
| Apothicaire | Infirmerie ou Laboratoire |
| Cartographe | Hôtel de ville |
| Bibliothécaire | Bibliothèque (Auberge) |

### Rangs et expérience
Rangs (points cumulés / niveau requis) : Apprenti 0 / 5 · Novice 100 / 10 · Travailleur 300 / 20 · Confirmé 700 / 30 · Expert 1 500 / 40 · Maître 3 000 / 45 · Grand maître 6 000 / 50. Rang = min(rang par points, rang permis par le niveau).
Gains : **+1 point toutes les 10 s en poste** (jeu ouvert, toutes vues ; plafond de 60 s par pas quand l’onglet dort) ; actions : fabrication/préparation +5, soin +5, repas +5, séance du Camp +3, achat/vente +2, recherche terminée +30, construction/amélioration +20 (aux travailleurs du métier concerné) ; fin d’étage gagnée : +20 pour les métiers d’expédition dans l’équipe (chasseur, cueilleur, cartographe, mineur, marchand, cuisinier, éleveur, apothicaire, alchimiste), +10 pour les autres. ×1,25 vocation naturelle, ×1,25 *Pédagogie*. Repère : Confirmé ≈ 2 h de poste, Grand maître ≈ 17 h.
Niv. 60 divin, rang 7 : aura de Grand maître, effet compté comme rang 10,5. Plusieurs travailleurs du même métier : leurs rangs s’additionnent (R), sous les plafonds indiqués.

### Effets (r = rang ; R = somme des rangs en poste)
| Métier | Village (en poste) | Expédition (dans l’équipe) | Évolution (niv. 45) |
|---|---|---|---|
| Cuisinier | repas au départ (20 vivres) : ATQ/DEF +2 % × R (max. 20 %) pendant 5 combats | après chaque victoire : PV +1 % × r | *Chef étoilé* : repas gratuit, 8 combats |
| Architecte | constructions −4 % × R (max. 28 %) | – | *Maître bâtisseur* : +1 terrain, améliorations −10 % |
| Chasseur | Chasse +15 % × R | matériaux de monstre +5 points × r ; r ≥ 4 : +1 croc/cuir par élite | *Traqueur légendaire* : élites 3 % parchemin |
| Cueilleur | 1 poussière / max(2, 10 / r) min | herbes : tissu 20 + 6 × r % ; r ≥ 3 : poussière 50 % | *Herboriste sylvain* : +1 essence de nature par étage |
| Entraîneur | séance : vivres −5 % × R (max. 35 %), exp. +8 % × R | – | *Maître d’armes* : exp. de séance ×1,25 |
| Fermier | Ferme +8 % × R, réserve +10 % × R | – | *Seigneur des moissons* : bois = 1/4 des vivres récoltés |
| Forgeron | catalyseur +0,15 × R ; affinage −5 % × R d’or (max. 35 %) ; r ≥ 4 : renfort max. +1 | – | *Forgeron des étoiles* : éveil d’objet −1 pierre, 6★ ×2 |
| Éleveur | 1 cuir (+1 tissu dès r 4) / max(3, 15 / r) min | familier du Dompteur +10 % × r | *Maître des bêtes* : déplacement +15 % dans les étages |
| Mineur | 1 minerai / max(2, 12 / r) min ; extraction max(16, 30 − 2 × R) pierres | r ≥ 3 : veines sans pioche ; r ≥ 5 : +1 cristal | *Mineur des profondeurs* : 10 % de noyau |
| Alchimiste | labo : catalyseur +0,15 × R ; fusions −5 % × R d’or (max. 35 %) ; r ≥ 3 : condenser 3 poussières ; r ≥ 4 : élixirs +1 dose | – | *Grand alchimiste* : transmutation |
| Marchand | achats −3 % × R, ventes +5 % × R ; démantèlement +5 % × R ; r ≥ 3 : +1 offre | or des combats +3 % × r | *Prince marchand* : offre rare, prix −15 % |
| Apothicaire | soins −8 % × R (max. 56 %), mort −2 points × R (min. 5 %) ; soigne seul un blessé / max(3, 30 / r) min | potions +5 % × r | *Grand apothicaire* : soin seul en 5 min au plus |
| Cartographe | en poste : révèle 5 % × r de chaque étage | révèle 10 % × r (max. 70 %) ; r ≥ 4 coffres sur la carte ; r ≥ 6 leviers et ordre runique | *Arpenteur des étoiles* : porte de l’étage toujours visible |
| Bibliothécaire | compétences −5 % × R d’or (max. 35 %) ; r ≥ 5 : Étudier +3 ; recherches −5 % × R | – | *Archiviste* : 15 % de tome récupéré à l’évolution de rareté |

Écarts assumés avec `progression.md` §6.1 : l’Éleveur peut aussi travailler à la Chasse ; l’Apothicaire aussi au Laboratoire ; l’Entraîneur évolué gagne ×1,25 d’exp. (au lieu de « 2 personnages par séance ») ; le Chef étoilé a un repas gratuit de 8 combats (au lieu de 2 repas cumulables) ; l’Arpenteur voit la porte de l’étage (l’aperçu de l’étage suivant viendra avec la carte de la Tour) ; l’étal du Marchand est remplacé par le Marché.

### Reconversion
Onglet Métier : 500 × ★ or, n’importe lequel des 14 métiers, retour au rang Apprenti (points à zéro, poste libéré).

## 4. Interface
- Carte : 10 terrains + site de l’Hôtel de ville, terrains verrouillés en transparence (« Hôtel de ville niv. N »), travailleurs qui flânent près de leur bâtiment.
- Panneaux : illustration `bldui_*`, étoiles, effets actuel → suivant, coût avec icônes, puis le contenu propre au bâtiment et la section **Postes** (emplacements libres en pointillé, bouton Affecter → liste des personnages qualifiés, rang et effet).
- Fiche, onglet **Métier** : icône (dorée si évolué), rang, barre de points, poste, effets actuels village/expédition, rang suivant, évolution au niv. 45, reconversion.
- Niv. 45 : révélation « Métier évolué » (file `PROGQ`, type `jobevo`).

## 5. Sauvegarde
Clé `tdE6` conservée (version interne `G.ver = 7`). Avant migration, copie `tdE6_v6_bak`. `G.plots` complété à 11 cases (terrains existants inchangés) ; ajouts : `G.rs {done,q}`, `G.mkt`, `G.buff {phil}`, `c.job {post, t, acc}` ; les personnages niv. ≥ 5 sans métier ont un choix en attente (comme `migrateProg`). Stocks au-delà des nouvelles capacités : conservés.
