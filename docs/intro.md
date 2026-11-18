# Intro des nouveaux joueurs : BD, héros, roue des talents

Source : demande du créateur (« une animation / un scénario au début du jeu pour les nouveaux joueurs : plusieurs cases animées comme une BD, la dernière un otaku aspiré dans son écran ; le personnage principal devient un joueur 1★ avec un talent rare obtenu à une roue animée, et comme par hasard il tombe sur un truc rare »), bible §18 (Tutoriel et Jeanne).

Tout est dans `index.html` (blocs `TALENTS DU HÉROS` et `INTRO : BD ANIMÉE…`).

## 1. Déroulé

1. **BD animée** (nouvelle partie uniquement) : une planche de 6 cases (3×2 en paysage, 2×3 en format moyen, bande verticale façon webtoon en portrait). Chaque case apparaît avec un zoom rebondi et un flash, la caméra se pose dessus, l'image glisse lentement (Ken Burns) ; bulles tapées lettre par lettre. Toucher / clic / Espace / Entrée : termine la bulle, puis bulle suivante, puis case suivante. **Passer ▸▸** (ou Échap) va directement à la création du héros.
2. **Planche complète** (2 s), puis **aspiration plein écran** : la planche tourne et rétrécit dans le vortex, les objets de la chambre et l'otaku (sprite étiré, en vrille) sont avalés, voix « Bienvenue dans la Tour des Étoiles, Joueur 1. », fondu au blanc.
3. **Création du héros** : nom (suggestion au hasard, bouton « Au hasard »), 6 allures prédéfinies, couleurs de cheveux / peau / yeux, 6 coiffures, aperçu animé du sprite. Personnalité tirée comme pour les autres personnages (`initPers`), révélée par une carte qui se retourne ; **une seule relance**.
4. **Roue des talents** (voir §3), révélation (écran d'évolution réutilisé : rayons, étoiles de rareté, description, réplique).
5. **Arrivée au village** : le héros est capitaine (party 1, Jeanne passe 2e) ; Jeanne l'accueille dans une boîte de dialogue (portrait, texte tapé), puis l'objectif existant « bâtissez une Auberge » reprend le tutoriel.

## 2. Script

| Case | Image (facultative) | Texte |
|---|---|---|
| 1 | `intro_1` ville de nuit, une fenêtre allumée | *Récitatif* : « Banlieue, 3 h 12 du matin. » · « La ville dort. Enfin… presque toute la ville. » |
| 2 | `intro_2` chambre d'otaku vue de dos | Otaku : « Allez… juste UN dernier tirage. » · « 0,6 % de taux de drop. Ils se moquent de moi. » |
| 3 | `intro_3` écran-titre du jeu (titre « La Tour des Étoiles » et bouton clignotant « Commencer ? » en HTML par-dessus) | « « La Tour des Étoiles » ? Jamais entendu parler… » · « Pas de pub, pas d'éditeur, gratuit. Louche. Parfait. » |
| 4 | `intro_4` visage éclairé par l'écran, main sur la souris | *CLIC* (flash) · Voix de l'écran : « Joueur… tu as été choisi. » · « … Hein ? » |
| 5 | `intro_5` vortex qui jaillit de l'écran | *VWOOOOOM* (flash, secousses) · « AAAAH ! Mes figurines ! » · Voix : « La Tour t'attend. » |
| 6 | `intro_6` chambre vide, chaise qui tourne | *Récitatif* : « Le lendemain, on ne retrouva qu'une chaise qui tournait encore. » · « Et sur l'écran : « Joueur 1 connecté. » » |

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

**Roue truquée** : 16 segments ; chaque talent rare+ est précédé (dans le sens de lecture du pointeur) d'un segment commun/peu commun ; les segments communs sont plus larges, les légendaires plus étroits. `talentRoll()` tire le résultat avant l'animation : **toujours rare ou mieux** (rare 62 %, épique 30 %, légendaire 8 %, réparti également dans la rareté). Animation : 6 tours avec décélération (5,2 s), arrêt apparent sur le segment commun voisin (1,2 s), puis glissement lent sur le segment gagnant (1,7 s) ; tics du pointeur, étincelles, secousses, ampoules, flash et explosion de particules. La roue est dessinée pixel par pixel (168 px, agrandie sans lissage).

## 4. Le héros

- 1★, Humain, « joueur venu d'un autre monde », épée 1★ (Guerrier), `hero:1`, `lock:1`.
- Ne peut être ni sacrifié ni déverrouillé, ni capturé par l'ennemi (raids de la galaxie).
- **Mort définitive = fin de partie** (décision du créateur) : le héros subit les mêmes jets de mort que tout le monde — à terre en fin de combat (`deathPc`, ×2 s'il a été forcé à continuer), blessé porté pendant une déroute (`deathP/2`), péril d'événement, pillage, garde aux Remparts. `injDie(c, cause)` appelle alors `finPartie` (`js/hero.js`).
- **Écran de fin** : une dernière case de BD (le sprite du héros clignote puis se dissout en pixels vers l'écran, « Joueur 1… déconnecté. »), le titre « FIN DE PARTIE » et le bilan (cause, niveau et talent, jours joués depuis `G.t0`, étage max `G.max`, compagnons survivants, tombés `G.dead`, or). Seul bouton : « Nouvelle partie » (rechargement → intro complète).
- **Pas de résurrection** : à la mort, la partie est copiée dans `localStorage['tdE6_fin']` (`{date, sum, save}`), la clé `tdE6` est remplacée par `{"over":1}` (donc ni l'ancienne partie ni un vieux `tdE5` ne se rechargent), et le marqueur `tdE6_over` fait réapparaître l'écran de fin au rechargement ; `save()` devient inopérant.
- **Risque visible** : encadré rouge « ☠ Si <nom> (le héros) meurt, la partie est terminée » avec le pourcentage dans l'avertissement de combat (portail, événements de combat), les périls d'événement (risque ÷ taille de l'équipe), le choix après une chute (Porter / Forcer — « Forcer » demande une confirmation pour le héros), la préparation d'un pillage et l'avertissement des gardes. La fiche du héros le rappelle. Jeanne le dit dans le dialogue d'accueil.
- Anciennes sauvegardes : `G.v_perma` — un message unique annonce la nouvelle règle ; `G.t0` est posé à ce moment-là.
- Toujours en tête de l'équipe quand il y est (`reidx`) : c'est lui que l'on dirige au village, avec l'étiquette « ★ Nom ».

### 4.1 Apparence (créateur et Miroir)

`c.look = {skin, hair, eye, style, face, body, hue}` (persisté). `drawChar` (`js/art.js`) lit `style` 0-9, `face` 0-5 et `body` 0-3 ; un personnage sans `face`/`body` garde exactement son rendu d'avant.

- **Coiffures** (10) : Mèche, Hérissés, Longs, Tresse, Raie au milieu, Couettes, Court, Queue de cheval, Crête, Macarons. **Couleurs** : 12. **Visages** (6) : Classique, Lunettes, Taches de rousseur, Cicatrice, Barbe, Regard perçant. **Corps** (4) : Standard, Mince (torse −2 px), Costaud (+2 px, comme l'Orc), Petit (−2 px de jambes, comme le Nain). **Peau** : 6 teintes. **Yeux** : 8 couleurs.
- **Créateur** (« Qui es-tu, joueur ? », juste après l'aspiration, avant la roue) : grand aperçu animé, nom, 6 allures toutes faites, onglets Cheveux / Couleur / Visage / Corps / Peau / Yeux avec vignettes, ◀ ▶ et « 🎲 Aléatoire ». Utilisable à 360 px de large.
- **Miroir** (bouton de la fiche du héros) : même éditeur sur un brouillon, validation payante : **2 000 or**, puis ×1,5 à chaque passage (`G.mirN`) — un puits d'or.
- Cache des sprites : la clé de `cs(c)` inclut l'apparence, donc tout changement redessine le personnage partout.

## 5. Sauvegarde et migration (clé `tdE5`)

- `fresh()` pose `G.intro=0` → l'intro se lance au chargement tant que la création n'est pas terminée (rechargement en cours d'intro = l'intro recommence, rien n'est perdu).
- Fin de création : `G.intro=1`, héros ajouté en tête de `G.chars`.
- **Anciennes sauvegardes** (sans `intro`) : aucune intro, aucun héros, rien n'est modifié. Dans **Équipe**, le bouton « Voir l'intro et créer mon héros » joue l'intro et ajoute le héros à la partie existante (ressources, personnages et bâtiments conservés ; si l'équipe était pleine, le dernier membre passe en réserve).
- Avec un héros : « Revoir l'intro » rejoue la BD seule, sans toucher à la partie.
- « Nouvelle partie » relance l'intro complète.

## 6. Images attendues (`assets/assets.js`)

`intro_1`…`intro_6` (cases, toute taille ; recadrées en 3:2), `fx_vortex` (feuille horizontale 8 × 96 px, case 5 et aspiration), `intro_frame` (cadre 9-slice, tranche 12 px, centre ignoré). Chaque image absente est remplacée par un dessin procédural 192×128 du même cadrage ; les animations (étoiles, objets qui volent, traits de mouvement de la chaise, flash du clic) se superposent aux images.
