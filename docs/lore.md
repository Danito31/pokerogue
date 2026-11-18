# Lore, légendes et secrets — proposition à affiner avec le créateur

Demandes du créateur :
- « Les personnages haut étoiles peuvent être des personnages connus de différents mondes comme Napoléon Bonaparte, Gilgamesh, etc. Perso unique avec item unique, 4, 5 et 6 étoiles. »
- « De l'histoire ou du lore dans le jeu, des secrets à trouver etc. qu'on pourra définir ensemble. »
- « Jeanne est liée à Jeanne d'Arc justement, avant éveil de ses souvenirs (éveil). »

Statut : la **partie 1 (Légendes)** est implémentée (`js/legends.js`, `js/legends2.js`). La **partie 2 (récit, factions, secrets)** est une **proposition** : seul un petit crochet existe en jeu (les *Chroniques*, 8 fragments trouvés sur les gardiens des étages 10, 20… 80, visibles dans le Codex, texte provisoire). Tout le reste est à valider (voir §9, questions ouvertes).

---

## 1. Légendes (implémenté)

### 1.1 Règles
- **Uniques** : au plus un exemplaire par sauvegarde. Nom, race, personnalité et sous-traits, élément, passive de signature, ultime de signature, biographie, réplique : **fixes**.
- **Objet unique** : apparaît équipé sur la légende, a la même rareté qu'elle, un effet spécial, et **ne s'obtient nulle part ailleurs**. Il est **lié** : impossible de le retirer, de l'équiper sur un autre ou de le recycler. Si la légende quitte le village (renvoi, mort, capture), l'objet disparaît avec elle et la légende redevient invocable. Quand la légende s'éveille d'une étoile, son objet monte avec elle.
- **Invocation** : les taux d'étoiles de l'Auberge ne changent pas. Une part des résultats 4★ / 5★ / 6★ devient une légende de ce rang : **10 % des 4★, 15 % des 5★, 25 % des 6★** (`LEG_RATE`). Soit environ 1 légende 4★ toutes les 2 000 invocations, 1 légende 5★ toutes les 6 700, 1 dieu toutes les 40 000 (hors talent Gacha béni).
- **Doublon** : si la légende tirée est déjà au village, le tirage donne un personnage ordinaire de même rang **et** la légende gagne un **écho** (+3 % PV, ATQ, DEF, cumulable 5 fois) ; au-delà, +20 éclats.
- **Ultime de signature dès le niveau 1** (remplace l'ultime de classe et, plus tard, celui de spécialisation ; il profite des formes d'éveil de la spécialisation). Puissance ×1,1 par étoile au-delà de 4.
- **Équilibre** : statistiques de base d'un personnage ordinaire de même rang ; la passive et l'objet valent à peu près un bon talent ou une compétence épique (+10 à +25 % dans un domaine). Une légende 4★ ne bat pas un 6★ ordinaire bien monté ; un dieu reste un 6★ (plafond de niveau 60, constellations). Elles comptent en fin de partie sans gagner seules.
- **Race** : surtout Humain ; Sun Wukong est Homme-bête ; les dieux ont la race **Divinité** (aucune règle de race ne leur est propre : pondérations neutres, pas d'héritage racial puisque ce n'est pas le héros).
- **Codex** : section « Légendes » (silhouettes pour les non découvertes, mention « absente du village » si elle est partie) + « Chroniques ».
- **Sprites** : dessin procédural existant + **liste de traits de signature** par légende (`ft`, ex. `['bicorne','#1d1a2a','#d0a030']`) et couleurs de tenue (`pal`). Chaque trait est une petite fonction de `FEAT` (`js/legends2.js`) : si le style des personnages change, on redessine ces fonctions sans toucher aux données. Icônes d'objets : forme + deux couleurs (`it.ic`, table `LICO`).
- **Débogage** : `window.LEGEND_FORCE = 'napoleon'` (ou `true`) force les invocations suivantes ; `legGive('zeus')` ajoute une légende.

### 1.2 Liste (24 invocables + Jeanne d'Arc)

| ★ | Légende | Origine | Classe · élément | Personnalité | Objet unique (effet) | Passive | Ultime |
|---|---|---|---|---|---|---|---|
| 4 | Napoléon Bonaparte | France | Guerrier · Feu | Ambitieux (Déterminé, Stratège) | **Bicorne de l'Empereur** (outil) : +1 point de compétence, équipe VIT +4 | Coup d'œil d'Austerlitz : équipe agit plus tôt au 1er tour | Soleil d'Austerlitz |
| 4 | Léonard de Vinci | Italie | Ensorceleur · Arcane | Curieux (Inventif, Observateur) | **Codex de Vinci** : +15 % contre les ennemis en rupture | Uomo universale : crit. +5 %, exp. +15 % | Machine volante |
| 4 | Miyamoto Musashi | Japon | Guerrier · Glace | Stoïque (Discipliné, Stratège) | **Lames Niten** : 25 % de second coup | Livre des cinq anneaux : +20 % contre un ennemi seul | Deux ciels |
| 4 | Cléopâtre | Égypte | Soigneur · Nature | Calculateur (Manipulateur, Charmeur) | **Uraeus de Cléopâtre** : soins +15 % | Charme du Nil : ennemi le plus fort ATQ −15 % | Morsure de l'aspic |
| 4 | Hannibal Barca | Carthage | Guerrier · Feu | Ambitieux (Déterminé, Stratège) | **Falcata de Carthage** : +20 % sur les ennemis > 70 % PV | Par-delà les Alpes : PV +8 %, VIT +4 | Charge des éléphants |
| 4 | Vercingétorix | Gaule | Gardien · Nature | Stoïque (Résistant, Courageux) | **Bouclier d'Alésia** : renvoie 15 % des dégâts | Chef des Arvernes : équipe DEF +8 % | Dernier carré d'Alésia |
| 4 | Hua Mulan | Chine | Guerrier · Foudre | Altruiste (Dévoué, Déterminé) | **Épée de la Piété filiale** : ATQ +25 % si un allié < 30 % | Douze ans sous l'armure : DEF +10 %, VIT +5 | Avalanche du col |
| 4 | Robin des Bois | Angleterre | Archer · Nature | Opportuniste (Rusé, Généreux) | **Arc de Sherwood** : or +15 % | Voler aux riches : +25 % contre élites et boss | Flèche fendue |
| 4 | Nikola Tesla | Europe/Amérique | Ensorceleur · Foudre | Curieux (Inventif, Méthodique) | **Bobine de Wardenclyffe** : arcs électriques | Courant alternatif : +10 énergie par tour | Tour de Wardenclyffe |
| 4 | Sun Tzu | Chine | Soutien · Ombre | Calculateur (Stratège, Patient) | **L'Art de la guerre** : ennemis DEF −10 % | Connais ton ennemi : équipe crit. +6 % | Treize articles |
| 5 | Gilgamesh | Mésopotamie | Guerrier · Sacré | Ambitieux (Orgueilleux, Compétitif) | **Épée d'Uruk** : PV +10 %, +10 % contre les boss | Celui qui a tout vu : ATQ +10 %, +8 % par ennemi vaincu | Chute du Taureau céleste |
| 5 | Alexandre le Grand | Macédoine | Soutien · Feu | Ambitieux (Déterminé, Charmeur) | **Étendard de Macédoine** : équipe ATQ +8 % | Le nœud gordien : rupture +50 % | Phalange de Gaugamèles |
| 5 | le roi Arthur | Bretagne | Guerrier · Glace | Altruiste (Loyal, Protecteur) | **Excalibur** : le fourreau régénère 4 %/tour | La Table ronde : équipe ATQ/DEF +6 % | Lame du lac |
| 5 | Merlin | Bretagne | Ensorceleur · Arcane | Curieux (Chercheur, Rusé) | **Bâton de Merlin** : +20 énergie, compétences +15 % | Il vit à rebours : agit deux fois au 1er tour | Brume d'Avalon |
| 5 | Achille | Grèce | Guerrier · Foudre | Impulsif (Colérique, Compétitif) | **Lance de Pélée** : crit. +8 % | Le talon : dégâts +25 %, subis +10 % | Colère d'Achille |
| 5 | Hercule | Grèce | Archer · Nature | Stoïque (Résistant, Courageux) | **Arc d'Héraclès** : poison de l'Hydre | Douze travaux : PV +15 %, +15 % contre élites et boss | Venin de l'Hydre |
| 5 | Sun Wukong | Chine | Assassin · Arcane | Impulsif (Spontané, Téméraire) | **Ruyi Jingu Bang** : +6 % par tour (max +30 %) | 72 métamorphoses : 15 % de leurre | Chaos au Palais céleste |
| 5 | Siegfried | Germanie | Gardien · Feu | Stoïque (Discipliné, Orgueilleux) | **Balmung** : dégâts subis −15 % | La feuille de tilleul : bouclier 30 % sous 30 % PV | Chute de Fafnir |
| 6 | Zeus | Olympe | Ensorceleur · Foudre | Souverain (Impérieux, Orgueilleux) | **Foudre de Zeus** : éclairs en chaîne | Égide : bouclier 15 % pour l'équipe | Colère de l'Olympe |
| 6 | Odin | Asgard | Guerrier · Arcane | Prodige (Génial, Stratège) | **Gungnir** : ne rate jamais, ignore 20 % DEF | Hugin et Munin : +1 point, ennemis DEF −10 % | Lance de l'Aïeul |
| 6 | Thor | Asgard | Guerrier · Foudre | Impulsif (Colérique, Courageux) | **Mjöllnir** : +30 énergie après l'ultime | Fils de la Terre : PV +12 %, ATQ +8 % | Tonnerre d'Asgard |
| 6 | Amaterasu | Takamagahara | Soigneur · Sacré | Altruiste (Compatissant, Généreux) | **Miroir Yata** : soins +25 % | Soleil levant : équipe +4 % PV/tour | Sortie de la caverne (relève 1 allié/combat) |
| 6 | Anubis | Douat | Gardien · Ombre | Calculateur (Méthodique, Froid) | **Balance des âmes** : achève sous 15 % PV | Gardien de la nécropole : équipe −8 % dégâts | Jugement d'Osiris |
| 6 | Quetzalcóatl | Mésoamérique | Soutien · Nature | Curieux (Explorateur, Généreux) | **Plume de Quetzal** : équipe +10 énergie/tour | Vent d'Ehécatl : VIT +10, agit en premier | Aube de Tollan |
| 4 | **Jeanne d'Arc** (éveil de Jeanne) | France | Guerrier · Sacré | Altruiste (Loyal, Courageux) | **Étendard de la Pucelle** (outil) : équipe DEF +8 %, +1 point | Les Voix : bouclier 20 % au premier passage d'un allié sous 30 % | Libération d'Orléans |

Zeus et Odin portent les personnalités secrètes (Souverain, Prodige) : cohérent avec la règle « 6★ seulement ». Jeanne d'Arc n'est pas invocable.

### 1.3 Jeanne, c'est Jeanne d'Arc (implémenté)
- La commandante « Jeanne » du village **est Jeanne d'Arc**, arrachée par la Tour au bûcher de Rouen (30 mai 1431) à la dernière seconde, **mémoire effacée**.
- **Déclencheur** : son **premier éveil d'étoile (3★ → 4★, Autel d'éveil)**. Choix : c'est le premier vrai « éveil » du jeu, il demande le niveau 30 et des parchemins, donc tombe en milieu de partie (vers les étages 15–25), juste avant l'ouverture de la galaxie.
- **Effet** : elle devient **Jeanne d'Arc, la Pucelle d'Orléans** (nom, statut de légende, Étendard de la Pucelle dans l'emplacement d'outil — l'ancien outil va à la réserve —, passive *Les Voix*, ultime *Libération d'Orléans*, traits de sprite étendard et fleur de lys). Une **courte scène** (« Souvenirs retrouvés ») se joue au village après la révélation d'éveil.
- Ancienne sauvegarde où Jeanne est déjà 4★ ou plus : elle s'éveille au chargement (scène jouée au retour au village).

---

## 2. Prémisse du monde (proposition)

**Le jeu que personne ne connaît.** Le héros, otaku 1★, trouve « Dungeon Setlers » : aucune notice, aucun studio, rien sur Internet, une faute dans le titre. Il lance la partie… et se réveille au pied de la Tour.

**La Tour.** Une structure sans fin bâtie par une civilisation disparue, les **Architectes**. Ils ne pouvaient pas créer de héros : ils pouvaient seulement les **emprunter**. La Tour « appelle » des âmes **au moment exact où leur histoire s'arrête** — le bûcher de Jeanne, Napoléon à Sainte-Hélène, Gilgamesh à qui le serpent vole l'herbe d'immortalité, Tesla seul dans sa chambre d'hôtel — et les dépose dans le village. C'est ça, l'Auberge : le guichet de l'**Appel**.
- Les 1★ aux noms ordinaires sont des **gens dont personne n'a écrit l'histoire** : ils n'ont pas de légende… pas encore.
- Les légendes 4–5★ sont des **récits très lus** : la Tour a eu assez de « matière » pour les reconstituer.
- Les **dieux 6★** ne sont pas descendus de leur plein gré : ils sont faits de la **foi** de milliers d'humains, et la Tour a appris à les invoquer comme les autres. Certains sont furieux (Zeus), d'autres curieux (Odin, Quetzalcóatl), un seul est venu pour juger (Anubis).

**Pourquoi le héros ?** Parce que c'est un **Joueur** : la Tour ne peut pas se gravir elle-même, elle a besoin de quelqu'un qui comprend les règles d'un jeu (d'où l'interface, les étoiles, le gacha). Le jeu a été écrit **pour lui** — ou pour quelqu'un comme lui.

**Qui a fait le jeu ?** Proposition : **le Concepteur**, dernier Architecte, qui a « emballé » la Tour sous forme de jeu vidéo pour atteindre un Joueur dans un autre monde. La faute du titre (*Setlers* au lieu de *Settlers*) est volontaire : **le T manquant**, c'est la **Tour** elle-même, à « rendre » au jeu en atteignant le sommet (secret principal, §6).

**Au sommet.** La **Salle du Concepteur** : une console, une chaise vide, et l'**Archive** — la bibliothèque de tous les récits. Le boss final peut être (au choix du créateur, §9) le Concepteur, la Tour elle-même devenue consciente, ou le héros d'une partie précédente (lien avec le talent *Nouvelle Partie +*).

**La galaxie.** Chaque planète a **sa propre Tour** et son village. Les planètes PNJ sont d'autres villages, d'autres Joueurs (ou leurs restes). Le bateau qui s'ouvre après l'étage 20 révèle que l'ascension n'est pas solitaire.

## 3. Factions (proposition)

| Faction | Qui | Rôle |
|---|---|---|
| **Le Village** | le héros, Jeanne, les Appelés | le joueur |
| **Les Architectes** | civilisation disparue | ont bâti la Tour ; traces dans les ruines (biome « Ruines oubliées »), stèles, Chroniques |
| **Les Gardiens d'étage** | boss tous les 10 étages | **anciens Appelés** qui ont échoué et que la Tour a gardés (plaque « Appelé n° 0001 ») ; on peut en libérer certains (§6) |
| **L'Olympe en exil** | dieux invoqués | divisés : ceux qui veulent rentrer, ceux qui veulent prendre la Tour |
| **La Compagnie des étoiles** | marchands de la galaxie | commercent entre Tours ; savent des choses et les vendent |
| **Les Effacés** | âmes dont la Tour a perdu le récit | ennemis des derniers étages (« spectres sans nom ») ; ce qui arrive si on échoue |

## 4. Arc principal en actes (proposition, liée aux paliers existants)

| Acte | Étages | Titre | Événements |
|---|---|---|---|
| I | 1–10 | **L'Éveil** | Arrivée du héros, Jeanne commandante sans mémoire, premiers Appelés. Boss 10 : Gardien du seuil → *Chronique I* (« la notice »). |
| II | 11–20 | **Les Appelés** | Les légendes commencent à répondre à l'Appel. Boss 20 : *Chronique II* (le gardien était un Appelé) ; **le ballon / bateau** (étage 20 franchi). |
| III | 21–30 | **La mémoire de Jeanne** | **Éveil de Jeanne → Jeanne d'Arc** (§1.3). Elle reconnaît la lumière bleue de Rouen dans les failles de la Tour. Boss 30 : *Chronique III* (la Tour prend les histoires qui s'arrêtent). |
| IV | 31–40 | **La galaxie** | D'autres Tours, d'autres villages ; un village abandonné dont le Joueur a disparu. Boss 40 : *Chronique IV* (l'Archive). |
| V | 41–50 | **Le T manquant** | Les ruines des Architectes ; on comprend la faute du titre. Boss 50 : *Chronique V*. |
| VI | 51–60 | **Le crépuscule des dieux** | Les dieux 6★ se disputent la Tour ; Odin propose un pacte, Zeus un défi. Boss 60 : *Chronique VI*. |
| VII | 61–80 | **Les Effacés** | Étages où les monstres n'ont plus de nom ; risque d'effacement des Appelés. Boss 70–80 : *Chroniques VII–VIII*. |
| VIII | 81–100 ? | **La Salle du Concepteur** | Le sommet, l'Archive, le choix final (§6, fins). |

## 5. Jeanne (backstory proposée)
- 1412–1431 : Domrémy, les Voix, Orléans, Reims, Compiègne, le procès, le bûcher.
- À la dernière seconde, une « fenêtre bleue et carrée » s'ouvre au-dessus de la place : l'Appel. La Tour la prend **sans son nom** (le récit le plus lu d'elle étant sa mort, la Tour n'a gardé que son courage).
- Au village, elle accueille le héros comme commandante, sans savoir pourquoi les bannières et l'odeur de fumée la troublent.
- **Indices avant l'éveil** (à ajouter en bulles de village, peu coûteux) : elle sursaute devant les feux de camp ; elle refuse d'entrer dans le biome « Forge de cendres » sans raison ; elle fredonne un air de Lorraine ; elle demande si quelqu'un a « entendu des voix ».
- **Après l'éveil** : nouvelles répliques, relation spéciale avec Napoléon (deux chefs de guerre français, quatre siècles d'écart), et avec Merlin (qui « se souvient » d'elle avant qu'elle ne le rencontre).

## 6. Secrets à trouver (proposition, ~15)
1. **Le T manquant** : une lettre « T » gravée cachée dans un étage de Ruines (loi des verrous) ; la rapporter au sommet débloque la **vraie fin**.
2. **Chroniques** (implémenté en partie) : 8 fragments sur les gardiens ; les réunir révèle une phrase codée (la première lettre de chaque fragment).
3. **Salle des Architectes** : un étage sur cent cache une porte sans sceau, visible seulement avec la Boussole **et** une Torche équipées.
4. **Plaque d'Appelé** : vaincre un gardien sans perdre personne lui laisse la vie ; il rejoint le village comme personnage 3★ au nom gravé.
5. **Le code de la notice** : le texte de la Chronique I contient un code utilisable dans l'onglet Code (docs/codes.md).
6. **Napoléon + Jeanne** dans la même équipe : réplique unique et bonus caché « France éternelle » (ATQ +5 %).
7. **Arthur + Merlin** : Merlin prédit la fin d'un combat ; Excalibur brille (+1 point de compétence).
8. **Gilgamesh + le serpent** : vaincre 100 serpents/chacals avec Gilgamesh dans l'équipe → il retrouve « l'herbe de jouvence » (objet unique secondaire).
9. **Les trois tonnerres** : Zeus, Thor et Tesla ensemble → éclair commun (ultime combiné).
10. **Anubis pèse le héros** : parler à Anubis au village après une victoire sans perte → indice sur la fin.
11. **Odin et le puits** : offrir 1 000 éclats au puits du village, Odin dans l'équipe → une rune gravée (énigme menant au T manquant).
12. **Réplique cachée de Tesla** : le soir (heure réelle 3 h 06, 3-6-9), il parle de la « fréquence de la Tour ».
13. **Le village abandonné** : une planète PNJ sans habitants contient le journal d'un ancien Joueur.
14. **Jeanne avant l'éveil** : lui parler 7 fois près d'un feu → elle murmure « Rouen » (indice de l'éveil).
15. **Le générique** : finir le jeu sans jamais invoquer de légende (« vraie partie de 1★ ») → générique alternatif avec le nom du Concepteur.
16. **Fin secrète** : réunir le T manquant + les 8 Chroniques + Jeanne d'Arc éveillée dans l'équipe au sommet → le héros peut **rendre leur fin** aux Appelés (ils rentrent mourir dans leur monde, ou restent : choix déchirant).

## 7. Codes cachés dans le lore (proposition)
- Initiales des Chroniques ; dates (1431, 1815) ; le nombre de travaux d'Hercule ; la fréquence 3-6-9 de Tesla. Chaque code se saisit dans l'onglet **Code** (usage unique, docs/codes.md).

## 8. Ce qui reste à implémenter si validé
- Bulles de village des légendes (répliques `q` déjà écrites, à brancher dans les conversations).
- Combinaisons entre légendes (§6, 6–9), indices de Jeanne avant l'éveil, plaques d'Appelé, salle des Architectes, le T manquant, fins.
- Sauvetage rare d'une légende sur un étage de boss (aujourd'hui seuls des personnages ordinaires).

## 9. Questions ouvertes pour le créateur
1. **Qui a fait le jeu ?** (a) le Concepteur, dernier Architecte ; (b) la Tour elle-même, devenue consciente ; (c) le héros d'une boucle précédente (Nouvelle Partie +) ; (d) autre.
2. **Que trouve-t-on au sommet ?** (a) la Salle du Concepteur et l'Archive ; (b) une porte vers le monde réel du héros ; (c) une autre Tour, plus grande (ascension infinie) ; (d) autre.
3. **Les dieux 6★ sont-ils** (a) les vrais dieux, capturés ; (b) des « échos » faits de la foi humaine ; (c) des Architectes qui se font passer pour des dieux ?
4. **Le ton** : (a) épique sérieux ; (b) épique avec beaucoup d'humour (anachronismes, Napoléon qui découvre le gacha) ; (c) mélancolique (les Appelés sont des morts en sursis).
5. **Le héros otaku** : (a) personnage muet ; (b) quelques répliques méta (il commente « comme dans un jeu ») ; (c) très bavard.
6. **Fins** : (a) une seule ; (b) bonne / mauvaise / vraie ; (c) fins multiples selon les légendes réunies.
7. **Taux d'apparition des légendes** : (a) garder 10 / 15 / 25 % des 4★ / 5★ / 6★ ; (b) plus rare ; (c) plus fréquent ; (d) ajouter un compteur de pitié de légende.
8. **Objets uniques** : (a) liés à leur légende (actuel) ; (b) transférables à n'importe qui mais avec effet réduit ; (c) le héros seul peut les emprunter.
9. **Liste des légendes** : en ajouter / retirer ? (pistes : Cú Chulainn, Ramsès II, Gengis Khan, Marie Curie, Charlemagne, Shaka, Mansa Moussa, Pachacutec, Baba Yaga, Hel, Shiva, Ra…).
10. **Jeanne d'Arc** : l'éveil au premier passage 3★ → 4★ (actuel) vous convient-il, ou préférez-vous un événement scénarisé à un étage précis (ex. boss 30) ?
11. **Nom du jeu** : la faute « Setlers » est-elle volontaire ? Si oui, le secret du **T manquant** peut devenir le fil rouge.
