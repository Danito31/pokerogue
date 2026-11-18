# Intro des nouveaux joueurs : BD, héros, roue des talents

Source : demande du créateur (« une animation / un scénario au début du jeu pour les nouveaux joueurs : plusieurs cases animées comme une BD, la dernière un otaku aspiré dans son écran ; le personnage principal devient un joueur 1★ avec un talent rare obtenu à une roue animée, et comme par hasard il tombe sur un truc rare »), bible §18 (Tutoriel et Jeanne).

Tout est dans `index.html` (blocs `TALENTS DU HÉROS` et `INTRO : BD ANIMÉE…`).

## 1. Déroulé

1. **BD animée** (nouvelle partie uniquement) : une planche de 6 cases (3×2 en paysage, 2×3 en format moyen, bande verticale façon webtoon en portrait). Chaque case apparaît avec un zoom rebondi et un flash, la caméra se pose dessus, l'image glisse lentement (Ken Burns) ; bulles tapées lettre par lettre. Toucher / clic / Espace / Entrée : termine la bulle, puis bulle suivante, puis case suivante. **Passer ▸▸** (ou Échap) va directement à la création du héros.
2. **Planche complète** (2 s), puis **aspiration plein écran** : la planche tourne et rétrécit dans le vortex, les objets de la chambre et l'otaku (sprite étiré, en vrille) sont avalés, voix « Bienvenue dans la Tour des Étoiles, Joueur 1. », fondu au blanc.
3. **Création du héros** (gratuite, §4.1) : nom (suggestion au hasard, bouton « Au hasard »), 6 allures prédéfinies, onglets coiffure / couleur / visage / corps / peau / yeux, aperçu animé du sprite.
3 bis. **Tirage du destin** (§7) : deux rouleaux façon machine à sous, PERSONNALITÉ et RACE, tirage honnête selon les taux affichés dans l'onglet « Taux d'apparition » ; **une seule relance** (des deux rouleaux).
4. **Roue des talents** (voir §3), révélation (écran d'évolution réutilisé : rayons, étoiles de rareté, description, réplique).
5. **Classe de départ** (§4.2) : arme 1★ au choix ; classes magiques seulement avec un talent à aptitude magique.
6. **Arrivée au village** : le héros est capitaine (party 1, Jeanne passe 2e) ; Jeanne l'accueille dans une boîte de dialogue (portrait, texte tapé), puis l'objectif existant « bâtissez une Auberge » reprend le tutoriel.

## 2. Script

| Case | Image (facultative) | Texte |
|---|---|---|
| 1 | `intro_1` ville de nuit, une fenêtre allumée | *Récitatif* : « Banlieue, 3 h 12 du matin. » · « La ville dort. Enfin… presque toute la ville. » |
| 2 | `intro_2` chambre d'otaku vue de dos | Otaku : « Allez… juste UN dernier tirage. » · « 0,6 % de taux de drop. Ils se moquent de moi. » |
| 3 | `intro_3` écran-titre du jeu (titre « Dungeon Setlers » et bouton clignotant « Commencer ? » en HTML par-dessus) | « « Dungeon Setlers » ? Jamais entendu parler… » · « Pas de pub, pas d'éditeur, gratuit. Louche. Parfait. » |
| 4 | `intro_4` visage éclairé par l'écran, main sur la souris | *CLIC* (flash) · Voix de l'écran : « Joueur… tu as été choisi. » · « … Hein ? » |
| 5 | `intro_5` vortex qui jaillit de l'écran | *VWOOOOOM* (flash, secousses) · « AAAAH ! WTF ?! » · Voix : « La Tour t'attend. » |
| 6 | `intro_6` chambre vide, chaise qui tourne | *Récitatif* : « Le lendemain, on ne retrouva qu'une chaise qui tournait encore. » · « Et sur l'écran : « Joueur 1 connecté. » » |

Jeanne commente aussi une race non humaine (« un joueur de race Fée ? La Tour a de l'humour ») et une personnalité secrète.

Roue : « Allez, la roue… viens à moi ! » → (la roue semble s'arrêter) « … Commune. Évidemment. Toujours ma chance. » → « Hein ? Elle… bouge encore ?! » → « … Attends, c'est RARE ?! » / « ÉPIQUE ?! Sérieusement ?! » / « LÉ-GEN-DAIRE ?! … Comme par hasard. » — Voix : « Comme par hasard, oui. »

Jeanne (bible §18 : autoritaire, loyale, protectrice) : elle a vu le joueur tomber du portail, se présente comme commandante, reconnaît un « joueur » venu d'un autre monde, commente le talent, le nomme capitaine et promet de le protéger, puis lance le tutoriel (Auberge, invocations ; le premier 1★ servira à montrer le transfert d'expérience « sans obligation de sacrifier qui que ce soit »).

## 3. Talents (`c.tal`, `TALENTS`)

Trait inné unique du héros, distinct des compétences. Visible sur la fiche (« Talent de joueur ») et dans la liste de l'équipe.

| Talent | Rareté | Effet (branché dans le code) |
|---|---|---|
| Chance du débutant | Commune | Critique +10 % sous le niveau 10 (`stats`) |
| Endurance de gamer | Commune | PV +10 % (`stats`) |
| Réflexes de joueur | Peu commune | VIT +8 (`stats`) ; agit plus tôt en début de combat (`battleStart`) |
| Inventaire infini | Peu commune | Auberge +3 places (`capa`) ; 20 % de chances de doubler les ingrédients d'un combat (`pocheX`) |
| Apprentissage éclair | Rare | Expérience ×1,5 (`xpMul`) |
| Charisme de héros | Rare | Dérive des relations ×2 vers le haut, ×0,5 vers le bas ; première impression +10 (`drift`, `rel`) |
| Maître d'armes | Rare | Bonus de l'arme équipée ×1,5 (`eqB`) ; critique +5 % |
| Second souffle | Rare | Une fois par combat sous 30 % de PV : +35 % PV et +30 énergie (`hurt`) |
| Œil du joueur | Épique | Fiche de cible : PV, ATQ, DEF, VIT, ténacité, critique et ordre de passage exacts, mécaniques détaillées (`drawTI`/`oeilH`) ; Auberge : probabilités exactes de 3★+ |
| Gacha béni | Épique | 3★ et plus ×1,5 (pris sur le 1★, `roll`) ; pitié : 3★ garanti à la 30e invocation sans 3★ (`G.pity`, affiché à l'Auberge) |
| Sauvegarde rapide | Légendaire | Une fois par expédition, un coup fatal ramène le héros à 40 % de ses PV (`saveLethal`) |
| Aura de protagoniste | Légendaire | PV/ATQ/DEF du héros +15 % ; équipe ATQ +5 % quand il combat (`stats`, `battleStart`) |

Talents ajoutés (43, effets dans `js/talents.js` par enveloppes des fonctions existantes ; tous agissent sur le jeu) :

| Talent | Rareté | Effet (accroche) |
|---|---|---|
| Lève-tôt | Commune | DEF +6 %, PV +4 % (`stats`) |
| Bras de fer | Commune | ATQ +6 % (`stats`) |
| Sprinteur | Commune | VIT +5 (`stats`) |
| Radin | Commune | Or des combats +10 % si le héros finit debout (`lootPassives`) |
| Glaneur | Commune | 20 % : +1 ingrédient de base après une victoire (`fightDrops`) |
| Estomac d'acier | Commune | Soins reçus +10 % (`heal`) |
| Nuit blanche | Commune | +20 d'énergie au début du combat (`battleStart`) |
| Tête dure | Commune | Blessures guéries 25 % plus vite (`injHit`) |
| Petit veinard | Commune | Critique +4 % (`stats`) |
| Bricoleur | Commune | Forge : fabrication −10 % d'or (`crCost`) |
| Peau de cuir | Commune | Dégâts subis −8 % (`hurt`) |
| Speedrunner | Peu commune | Expérience +20 % (`gain`) |
| Tank né | Peu commune | PV +12 %, VIT −3 (`stats`) |
| Combo ×3 | Peu commune | Chaque 3ᵉ coup +40 % (`deal`) |
| Bouclier de départ | Peu commune | Bouclier 10 % PV max au début du combat (`battleStart`) |
| Médiateur | Peu commune | Dégradation des relations −25 % pour tous (`drift`) |
| Fouineur | Peu commune | 12 % : +1 éclat après une victoire (`lootPassives`) |
| Récupération passive | Peu commune | 3 % PV par tour, sauf loi du gel (`turnStart`) |
| Contre-attaque | Peu commune | 15 % : riposte à 60 % quand il est frappé (`deal`) |
| Septième ciel | Peu commune | Au 7ᵉ tour de l'équipe : +2 points de compétence (`turnStart`) |
| Gardien du village | Peu commune | Défense du village +15 % (`defRating`) |
| Navigateur stellaire | Peu commune | Galaxie : carburant et durée −20 % (`galFuel`, `galTime`) |
| Source de mana ✦ | Rare | +10 énergie à chacun de ses tours (`turnStart`) |
| Soif de sang | Rare | Vol de vie 8 % (`deal`) |
| Tueur de géants | Rare | +20 % contre élites, champions, boss (`deal`) |
| Affinité élémentaire ✦ | Rare | +25 % sur une faiblesse (`deal`) |
| Chef de guerre | Rare | Équipe DEF +6 % (`battleStart`) |
| Rage du joueur | Rare | Sous 50 % PV : dégâts +25 % (`deal`) |
| Trésorier | Rare | Village : +1 or / 10 s par niveau d'Hôtel de ville (`vTick`) |
| Mains guérisseuses ✦ | Rare | Soins et boucliers prodigués +25 % (`heal`, `addSh`) |
| Mentor | Rare | Compagnons de l'équipe : exp. +15 % (`gain`) |
| Éclaireur né | Rare | Toute l'équipe agit plus tôt (`battleStart`) |
| Maître du temps ✦ | Épique | VIT +10, agit deux fois à son premier tour (`stats`, `battleStart`) |
| Fortune insolente | Épique | Or ×1,3 et +1 ingrédient après une victoire (`lootPassives`, `fightDrops`) |
| Lien des âmes ✦ | Épique | Invocation sans personnage ou 1★ : 15 % de relance (`roll`) |
| Corps de titan | Épique | PV +25 %, DEF +15 %, jamais plus de 35 % PV max en un coup (`stats`, `hurt`) |
| Lame du destin | Épique | Critique +15 %, ATQ +8 % (`stats`) |
| Cendres du phénix | Épique | Équipe +10 % PV après chaque victoire (`lootPassives`) |
| Nouvelle Partie + | Légendaire | PV/ATQ/DEF/VIT +12 %, exp. +25 % (`stats`, `gain`) |
| Archimage ✦ | Légendaire | Compétences actives +35 %, +40 énergie au début (`deal`, `battleStart`) |
| Coup du jackpot | Légendaire | 10 % : dégâts ×3 (`deal`) |
| Armure scénaristique | Légendaire | Une fois par combat, un coup fatal laisse 1 PV (`saveLethal`) |
| Talent universel ✦ | Légendaire | +1 point de compétence au début, recharges deux fois plus rapides (`battleStart`, `turnStart`) |

✦ = aptitude à la magie (`magie:1`). En tout 55 talents (13 communs, 13 peu communs, 14 rares, 8 épiques, 7 légendaires) ; 10 des 29 talents rares et plus sont magiques (environ 1/3).

**Roue truquée** : 16 segments (le talent tiré, puis 7 autres talents rares et plus pour faire 4 rares, 2 épiques, 2 légendaires, chacun précédé d'un commun/peu commun pris au hasard) ; chaque talent rare+ est précédé (dans le sens de lecture du pointeur) d'un segment commun/peu commun ; les segments communs sont plus larges, les légendaires plus étroits. `talentRoll()` tire le résultat avant l'animation : **toujours rare ou mieux** (rare 62 %, épique 30 %, légendaire 8 %, réparti également dans la rareté). Animation : 6 tours avec décélération (5,2 s), arrêt apparent sur le segment commun voisin (1,2 s), puis glissement lent sur le segment gagnant (1,7 s) ; tics du pointeur, étincelles, secousses, ampoules, flash et explosion de particules. La roue est dessinée pixel par pixel (168 px, agrandie sans lissage).

## 4. Le héros

- 1★, Humain, « joueur venu d'un autre monde », arme 1★ de la classe choisie (§4.2), `hero:1`, `lock:1`.
- Ne peut être ni sacrifié ni déverrouillé, ni capturé par l'ennemi (raids de la galaxie).
- **Mort définitive = fin de partie** (décision du créateur) : le héros subit les mêmes jets de mort que tout le monde — à terre en fin de combat (`deathPc`, ×2 s'il a été forcé à continuer), blessé porté pendant une déroute (`deathP/2`), péril d'événement, pillage, garde aux Remparts. `injDie(c, cause)` appelle alors `finPartie` (`js/hero.js`).
- **Écran de fin** : une dernière case de BD (le sprite du héros clignote puis se dissout en pixels vers l'écran, « Joueur 1… déconnecté. »), le titre « FIN DE PARTIE » et le bilan (cause, niveau et talent, jours joués depuis `G.t0`, étage max `G.max`, compagnons survivants, tombés `G.dead`, or). Seul bouton : « Nouvelle partie » (rechargement → intro complète).
- **Pas de résurrection** : à la mort, la partie est copiée dans `localStorage['tdE6_fin']` (`{date, sum, save}`), la clé `tdE6` est remplacée par `{"over":1}` (donc ni l'ancienne partie ni un vieux `tdE5` ne se rechargent), et le marqueur `tdE6_over` fait réapparaître l'écran de fin au rechargement ; `save()` devient inopérant.
- **Risque visible** : encadré rouge « ☠ Si <nom> (le héros) meurt, la partie est terminée » avec le pourcentage dans l'avertissement de combat (portail, événements de combat), les périls d'événement (risque ÷ taille de l'équipe), le choix après une chute (Porter / Forcer — « Forcer » demande une confirmation pour le héros), la préparation d'un pillage et l'avertissement des gardes. La fiche du héros le rappelle. Jeanne le dit dans le dialogue d'accueil.
- Anciennes sauvegardes : `G.v_perma` — un message unique annonce la nouvelle règle ; `G.t0` est posé à ce moment-là.
- Toujours en tête de l'équipe quand il y est (`reidx`) : c'est lui que l'on dirige au village, avec l'étiquette « ★ Nom ».

### 4.1 Apparence (créateur gratuit, Miroir et cosmétiques)

`c.look = {skin, hair, eye, style 0-11, face 0-8, body 0-3, acc 0-7, cape 0-3, tn 0-6, hue}` (persisté). `drawChar` (`js/art.js`) lit ces champs ; un personnage qui ne les a pas garde exactement son rendu d'avant. Catalogue : `LOPT` (`js/hero.js`), prix 0 = jeu de base.

| Catégorie | Offert à la création | Cosmétiques à acheter (or) |
|---|---|---|
| Cheveux | Mèche, Hérissés, Longs, Tresse, Raie au milieu, Couettes, Court | Rasé 1 000 · Queue de cheval 1 500 · Macarons 3 000 · Crête 4 000 · Volumineux 6 000 |
| Couleur | 10 teintes | Noir de jais 1 000 · Argent 3 000 · Rouge vif 3 000 · Cyan néon 8 000 · Or pur 20 000 |
| Visage | Classique, Lunettes, Taches de rousseur, Barbe | Cicatrice 2 000 · Regard perçant 3 000 · Maquillage 3 000 · Cache-œil 6 000 · Peinture de guerre 8 000 |
| Corps | Standard, Mince, Costaud, Petit | — |
| Peau | 6 teintes | — |
| Yeux | 8 teintes | Yeux d'or 3 000 · Magenta 3 000 · Blanc spectral 8 000 |
| Accessoire | aucun | Bandeau 1 000 · Boucle d'oreille 2 000 · Bonnet 3 000 · Couronne de fleurs 4 000 · Oreilles de chat 8 000 · Cornes 12 000 · Auréole 30 000 |
| Cape | aucune | Écharpe dorée 4 000 · Cape écarlate 6 000 · Cape nocturne 10 000 |
| Tenue (teinte) | d'origine | Rouge 1 500 · Émeraude 1 500 · Nuit 3 000 · Rose 3 000 · Blanc 8 000 · Or 20 000 |

Rareté affichée selon le prix : commun ≤ 2 000, rare ≤ 6 000, épique ≤ 12 000, légendaire au-delà.

- **Créateur** (« Qui es-tu, joueur ? », juste après l'aspiration, avant la roue) : **gratuit**, uniquement le jeu de base. Grand aperçu animé, nom, 6 allures toutes faites (toutes gratuites), onglets Cheveux / Couleur / Visage / Corps / Peau / Yeux avec vignettes, ◀ ▶ et « 🎲 Aléatoire ». Utilisable à 360 px de large.
- **Miroir** (bouton de la fiche du héros) : même éditeur sur un brouillon, avec tous les onglets (Accessoire, Cape, Tenue en plus). Passer d'une option possédée à une autre est **gratuit** ; une option 🔒 s'affiche avec son prix, se prévisualise, et le bouton devient « Acheter et appliquer (total) ». Achat définitif : `G.cosm` (liste `'cat:valeur'`). « Aléatoire » ne pioche que dans ce qui est possédé. Un puits d'or.
- Migration (`G.v_cosm`) : l'apparence actuelle d'un héros existant est acquise (rien ne se perd).
- Cache des sprites : la clé de `cs(c)` inclut l'apparence, donc tout changement redessine le personnage partout.

### 4.2 Classe de départ et aptitude à la magie

- Après la révélation du talent, bouton « Choisir ma classe » : écran **Ta classe de départ**. Choisir une classe = choisir l'arme 1★ de départ (la classe découle de l'arme : `roleOf`) : Guerrier (épée), Gardien (bouclier), Assassin (dagues), Archer (arc), Soutien (luth), Ensorceleur (bâton), Soigneur (sceptre). Pure personnalisation de niveau 1, aucun avantage de puissance ; la classe change ensuite avec l'équipement, comme pour tous.
- **Aptitude à la magie** : seulement si le talent porte `magie:1` (`TALENTS`, `js/data.js`, ✦ dans le tableau §3) — environ 1 tirage sur 3 avec la roue truquée (rare 62 % × 4/14 + épique 30 % × 3/8 + légendaire 8 % × 3/7 ≈ 32 %). La révélation du talent et sa fiche l'indiquent.
- Sans aptitude : Ensorceleur et Soigneur apparaissent grisés « 🔒 Nécessite une aptitude à la magie (talent) ». **Plus tard aussi** : le héros ne peut pas équiper bâton, grimoire ni sceptre (bouton grisé avec la raison dans l'écran d'équipement, `equip` refuse) et ne peut pas basculer en ensorceleur/soigneur par une armure ou un outil (`roleOf` enveloppé). **Garde centrale** (`js/hero.js`) : `canWield(c, objet)` (liste d'équipement, `equip`, passerelles d'éveil `pasW`) et `heroArmFix`, appelé par `upRole` : tout chemin qui pose une arme puis recalcule la classe (équipement, Forge, Autel, éveil, migrations, chargement de la partie) range d'office une arme magique interdite dans la réserve. Les autres personnages ne sont pas concernés.
- Migration (`G.v_mag`) : un héros sans aptitude qui tenait une arme magique la range dans la réserve (message).

## 5. Sauvegarde et migration (clé `tdE5`)

- `fresh()` pose `G.intro=0` → l'intro se lance au chargement tant que la création n'est pas terminée (rechargement en cours d'intro = l'intro recommence, rien n'est perdu).
- Fin de création : `G.intro=1`, héros ajouté en tête de `G.chars`.
- **Anciennes sauvegardes** (sans `intro`) : aucune intro, aucun héros, rien n'est modifié. Dans **Équipe**, le bouton « Voir l'intro et créer mon héros » joue l'intro et ajoute le héros à la partie existante (ressources, personnages et bâtiments conservés ; si l'équipe était pleine, le dernier membre passe en réserve).
- Avec un héros : « Revoir l'intro » rejoue la BD seule, sans toucher à la partie.
- « Nouvelle partie » relance l'intro complète.

## 6. Images attendues (`assets/assets.js`)

`intro_1`…`intro_6` (cases, toute taille ; recadrées en 3:2), `fx_vortex` (feuille horizontale 8 × 96 px, case 5 et aspiration), `intro_frame` (cadre 9-slice, tranche 12 px, centre ignoré). Chaque image absente est remplacée par un dessin procédural 192×128 du même cadrage ; les animations (étoiles, objets qui volent, traits de mouvement de la chaise, flash du clic) se superposent aux images.

## 7. Tirage du destin (gacha du héros, `js/gacha.js`)

Demande du créateur : « une mini roulette (défilement de gauche à droite façon machine à sous) sur les noms de personnalité, style gacha, à la création du héros ; un onglet dédié avec la liste des raretés et des personnalités ; une catégorie secrète (0,01 %) avec deux personnalités ultra-puissantes ; la race aussi (70 % humain, 20 % nain/elfe…, 1 % homme-bête, 0,01 % ange/démon), jusqu'à 6★. »

- Écran **Tirage du destin**, juste après le créateur : onglets **🎰 Tirage** et **📊 Taux d'apparition**. Deux rouleaux horizontaux (PERSONNALITÉ, RACE) : la bande défile de gauche à droite, décélère, s'arrête au bord de la case gagnante — juste avant la meilleure case voisine (quasi-victoire) — puis se recale ; tics sonores (WebAudio 8 bits), flash de la couleur du palier, secousse et fanfare pour un palier secret / 6★. Le rouleau de race s'arrête une seconde après celui de la personnalité. `prefers-reduced-motion` : défilement court, sans recalage ni secousse. Utilisable à 360 px (cases de 72 px, boutons tactiles).
- **Tirage honnête** (contrairement à la roue des talents) : un palier selon son pourcentage, puis une entrée au hasard dans le palier (`tierRoll`, `PTIERS`, `RTIERS` dans `js/data.js`). Une relance gratuite des deux rouleaux, puis « Valider → Roue des talents ».

| Personnalité | Taux du palier | Entrées (taux chacune) |
|---|---|---|
| Commune | 48 % | Stoïque, Gourmand, Impulsif (16 %) |
| Peu commune | 30 % | Altruiste, Curieux, Ambitieux (10 %) |
| Rare | 16 % | Calculateur, Opportuniste (8 %) |
| Épique | 5,99 % | Égoïste |
| **Secrète** | **0,01 %** | **Prodige, Souverain** (0,005 %) — voir docs/personnalites.md §8 |

| Race (rareté) | Taux | Entrées | Héritage racial (héros seulement) |
|---|---|---|---|
| 1★ | 70 % | Humain | Expérience +8 % |
| 2★ | 20 % | Nain, Elfe, Gobelin (6,67 %) | Nain DEF +8 % PV +4 % · Elfe VIT +4 crit +3 % · Gobelin crit +5 %, or +5 % |
| 3★ | 8 % | Orc, **Fée** (4 %) | Orc ATQ +10 % PV +5 % · Fée VIT +6, soins reçus +15 % |
| 4★ | 1 % | Homme-bête | ATQ +10 %, VIT +6 |
| 5★ | 0,99 % | **Dragonide**, **Mort-vivant** (0,495 %) | Dragonide PV +14 % ATQ/DEF +10 % · Mort-vivant PV +16 % DEF +12 %, 3 % PV/tour |
| 6★ | 0,01 % | **Ange**, **Démon** (0,005 %) | Ange PV/ATQ/DEF +18 %, équipe 3 % PV/tour · Démon ATQ +30 %, crit +10 %, vol de vie 10 % |

- **Le héros reste 1★** (règle du jeu) : « 1★ → 6★ » est la **rareté de la race** (et la force de son héritage), pas les étoiles du personnage. L'héritage racial (`RACET`) ne s'applique qu'au héros (effets : `js/talents.js`) ; les invocations gardent exactement leurs règles (`raceFor` : races non humaines dès 2★, Homme-bête et Orc dès 3★ ; les nouvelles races n'y apparaissent pas).
- Nouvelles races dessinées (`drawChar`, `js/art.js`) : Fée (ailes translucides couleur d'élément, oreilles pointues, étincelles), Dragonide (cornes d'os, écailles aux joues, queue), Mort-vivant (teint gris-vert, yeux verts, coutures, bandage), Ange (grandes ailes blanches, auréole dorée), Démon (teint pourpre sombre, yeux rouges, cornes, ailes de chauve-souris, queue fléchée, croc). La race fait partie de la clé du cache des sprites.
- Familles de compétences (`RACEW`) : Fée soin/célérité, Dragonide dégâts/défense, Mort-vivant défense/contrôle, Ange soin/protection, Démon dégâts/contrôle.
- La fiche du héros (talent) rappelle race, palier, héritage et personnalité.

## 8. Tour des modifications (bâtiment, `js/gacha.js`)

- Débloquée par l'**Hôtel de ville niv. 2** et l'**étage 10 franchi** (`G.max > 10`). Coût : 150 bois, 180 pierre (niv. 1) ; 900 or par niveau ensuite. Sprite procédural (tour violette aux runes, échafaudage au niv. 1, gemme au niv. 2, runes flottantes au niv. 3) ; image Blender possible via `bld_modif_1..3`.
- **Jetons de relance** `G.rr` (un seul type, générique — le plus simple à vendre plus tard). Sources : codes (onglet Code, docs/codes.md), victoire sur le champion d'un **étage de quête** (20 %) ou un **boss** (35 %), événements d'expédition (4 %). Les jetons s'accumulent même avant la construction.
- Cibles (héros seulement) : niv. 1 **talent inné** et **classe de départ** ; niv. 2 + **personnalité** ; niv. 3 + **race**. Mêmes rouleaux et mêmes taux que la création, mais **honnêtes** : le talent suit `RARW` sur toutes les raretés (commune 50 %, peu commune 28 %, rare 14 %, épique 6 %, légendaire 2 %), pas la roue truquée. La classe est tirée parmi les classes permises (sans aptitude magique : ni ensorceleur ni soigneur).
- **Confirmation obligatoire** avant de lancer, avec la conséquence et le tableau des taux. Règle du créateur : **même résultat → rien ne change, l'expérience reste ; résultat différent → le héros perd son expérience**. « Expérience » = niveau, exp., réserve d'exp. et tout ce que les niveaux ont débloqué (arbre, compétences, sous-classe, spécialisation, éveil) : retour au **niveau 1** (plafond 10 du 1★ inchangé). **Rien n'est transféré** de l'ancien au nouveau. Métier, équipement, relations et objets sont conservés.
- Conséquences : talent sans aptitude magique → `upRole` → `heroArmFix` range une arme magique dans la réserve ; nouvelle classe → arme 1★ de cette classe équipée (l'ancienne en réserve), `c.cls0` mis à jour ; nouvelle personnalité → nouveaux sous-traits et nouvelle courbe (`c.gr`).
- Champs : `G.rr`, `G.codes`, `c.cls0` (classe de départ, posée à la création ; migration : classe actuelle). Migration `G.v_gacha` (anciennes sauvegardes : 0 jeton, aucune modification du héros).
- Outil de test : `window.GACHA_FORCE={pers,race,tal,cls}` impose le résultat des tirages suivants (création et Tour).
