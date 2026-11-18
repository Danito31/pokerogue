'use strict';
/* ================= PROGRESSION (docs/progression.md) =================
   Plafond 10×★, courbe d'exp. par bande, réserve d'exp., multiplicateurs de niveau (LVM), arbre personnel (23 nœuds, graine c.seed),
   sous-classes (niv. 10, choix), spécialisations révélées (niv. 20), ultimes (35), éveil (40, passerelles), apogée (50), divinité (60), constellations (✦).
   Champs : c.cls {sub,spec,aw,pend} · c.job {id,pm,voc,post} · c.tree {v,fix,ins,got,star} · c.xpBank · c.deck · G.codex */
const VOIE={Altruiste:'coeur',Stoïque:'coeur',Gourmand:'coeur',Ambitieux:'lame',Impulsif:'lame',Égoïste:'lame',Calculateur:'esprit',Curieux:'esprit',Opportuniste:'esprit'};
const VOIEN={coeur:['Cœur','#5fe07a'],lame:['Lame','#ff5a5a'],esprit:['Esprit','#6fd3ff']};
const voieOf=c=>VOIE[c.pers]||'coeur';
/* âmes (niv. 1) : effets déjà appliqués par la personnalité (stats, heal, deal) */
const AMES={Altruiste:['Âme dévouée','Soins et boucliers +20 %'],Ambitieux:['Âme conquérante','ATQ +10 %'],Calculateur:['Âme lucide','Critique +12 %'],Impulsif:['Âme ardente','VIT +8, DEF −10 %'],Stoïque:['Âme de roc','PV et DEF +12 %'],Curieux:['Âme chercheuse','Rupture de ténacité +30 %'],Gourmand:['Âme gourmande','Récupère 5 % PV à chaque tour'],Égoïste:['Âme solitaire','Dégâts des compétences +15 % (s’isole)'],Opportuniste:['Âme filoute','Critique +6 %, or +10 %']};
const PKEY={Altruiste:'altruiste',Ambitieux:'ambitieux',Calculateur:'calculateur',Impulsif:'impulsif',Stoïque:'stoique',Curieux:'curieux',Gourmand:'gourmand',Égoïste:'egoiste',Opportuniste:'opportuniste'};
const AMEF=p=>{const o=PFW[p]||{};return Object.keys(o).sort((a,b)=>o[b]-o[a])[0]||'soutien'};
/* techniques d'arme (niv. 1) */
const WTECH={epee:'tech_entaille',hache:'tech_fendoir',bouclier:'tech_bouclier',dagues:'tech_estoc',arc:'tech_volee',baton:'tech_deflagration',grimoire:'tech_glyphe',sceptre:'tech_soin',luth:'tech_ralliement',_:'tech_poing'};
const TECHN={tech_entaille:['Entaille','Cible (220 %).'],tech_fendoir:['Fendoir','Cible (240 %), forte rupture.'],tech_poing:['Coup de poing','Cible (180 %).'],tech_bouclier:['Bouclier levé','Provoque 2 tours, bouclier (200 % DEF + 10 % PV).'],tech_estoc:['Estoc','Cible (260 %), critique assuré sur un ennemi brisé.'],tech_volee:['Volée','3 flèches de 90 % sur des cibles au hasard.'],tech_deflagration:['Déflagration','Tous les ennemis (110 %).'],tech_glyphe:['Glyphe','Tous les ennemis (90 %) et DEF −10 % (2 tours).'],tech_soin:['Soin','Allié le plus blessé : 160 % ATQ + 8 % PV max.'],tech_ralliement:['Ralliement','Allié le plus fort : ATQ +40 % (2 tours) et agit immédiatement.']};
const ROLE_ULK={guerrier:'sk_ult_guerrier',gardien:'sk_ult_gardien',assassin:'sk_ult_assassin',archer:'sk_ult_archer',sorcier:'sk_ult_sorcier',soigneur:'sk_ult_soigneur',soutien:'sk_ult_soutien'};
/* sous-classes (niv. 10) : f famille favorisée, a active (cd), v formes de voie (niv. 30) */
const SUBCL={
 etendard:{n:'Porte-étendard',f:'soutien',sn:'Étendard levé',d:'Passif : début de combat, équipe ATQ +6 %, DEF +4 %.',v:{coeur:['Héraut de l’aube','+ l’équipe régénère 3 % PV par tour pendant 3 tours.'],lame:['Seigneur de guerre','ATQ de l’équipe +12 %, +2 % par ennemi vaincu (max +10 %).'],esprit:['Maréchal','+1 point de compétence et VIT de l’équipe +6 au début du combat.']}},
 medic:{n:'Médic de campagne',f:'soin',sn:'Pansement express',d:'Passif : après chacune de ses actions, l’allié le plus blessé récupère 3 % PV max (5 % sous 30 %).',v:{coeur:['Ange de campagne','purifie aussi un affaiblissement du soigné.'],lame:['Chirurgien de guerre','le soigné gagne ATQ +10 % (1 tour).'],esprit:['Apothicaire de terrain','potions de l’équipe +30 %, 20 % de chances de ne pas consommer la dose.']}},
 runiste:{n:'Runiste',f:'controle',sn:'Rune d’arme',d:'Passif : ses coups posent une rune (3 tours) : équipe +8 % de dégâts sur la cible, rupture +15 %.',v:{coeur:['Runiste gardien','le prochain allié frappé par la cible runée reçoit un bouclier de 4 % PV.'],lame:['Runiste de sang','+15 % et la rune explose à la mort de la cible (60 % ATQ aux autres).'],esprit:['Grand runiste','la rune compte comme une faiblesse (rupture pleine).']}},
 exorciste:{n:'Exorciste',f:'protection',a:3,sn:'Purification',d:'Active (recharge 3) : retire les affaiblissements d’un allié + bouclier 8 % PV max ; +30 % de dégâts contre spectres et Ombre.',v:{coeur:['Purificateur','affecte toute l’équipe.'],lame:['Inquisiteur','frappe aussi l’ennemi le plus fort (140 %, Sacré) et lui retire ses bonus.'],esprit:['Sceau-mage','scelle la mécanique de boss 2 tours ; recharge 4.']}},
 saboteur:{n:'Saboteur',f:'controle',a:3,sn:'Piège à mâchoires',d:'Active (recharge 3) : l’ennemi le plus rapide recule de 25 % et perd 20 % de DEF (2 tours).',v:{coeur:['Démineur','annule une Charge dévastatrice ; équipe +10 d’énergie.'],lame:['Artificier','le piège explose : 90 % à tous.'],esprit:['Maître des pièges','2 cibles, recul 35 %.']}},
 contreb:{n:'Contrebandier',f:'chance',sn:'Poches profondes',d:'Passif : or +8 % ; chaque critique a 10 % de chances de voler un matériau (une fois par monstre).',v:{coeur:['Receleur généreux','chaque vol soigne l’équipe de 4 %.'],lame:['Pillard','+6 % de dégâts par vol réussi (max 3).'],esprit:['Prince des voleurs','20 % ; 2 % de voler un parchemin.']}},
 alchi:{n:'Alchimiste de combat',f:'decouverte',a:2,sn:'Fiole volatile',d:'Active (recharge 2) : fiole d’un élément de l’équipe, tous 70 % ; rupture pleine si faiblesse.',v:{coeur:['Herboriste','la fiole soigne aussi l’équipe de 5 %.'],lame:['Grenadier','110 % + brûlure 2 tours.'],esprit:['Transmutateur','choisit l’élément faible commun au plus d’ennemis.']}},
 pisteur:{n:'Pisteur',f:'controle',a:2,sn:'Marque du chasseur',d:'Active (recharge 2) : marque (3 tours) : équipe +15 % de dégâts sur elle.',v:{coeur:['Garde-forestier','un allié frappé par la cible marquée gagne 10 d’énergie.'],lame:['Chasseur de primes','+25 % ; si la cible meurt, son or ×2 et le Pisteur rejoue.'],esprit:['Vigie','marque 2 cibles.']}},
 dompteur:{n:'Dompteur',f:'celerite',sn:'Compagnon',d:'Passif : un familier attaque à la fin de chacun de ses tours (35 % ATQ).',v:{coeur:['Ami des bêtes','si un allié est sous 50 %, le familier le soigne de 4 %.'],lame:['Maître de meute','deux familiers.'],esprit:['Chimériste','le familier frappe l’élément faible de sa cible.']}},
 garde:{n:'Garde du corps',f:'protection',sn:'Interposition',d:'Passif : 30 % de chances d’encaisser à la place d’un allié sous 50 % PV, dégâts encaissés −30 %.',v:{coeur:['Bouclier juré','50 % de chances.'],lame:['Rempart vengeur','chaque interposition riposte à 80 %.'],esprit:['Garde tacticienne','chaque interposition donne 15 d’énergie et avance son tour de 20 %.']}},
 conteur:{n:'Conteur',f:'soutien',a:3,sn:'Récit héroïque',d:'Active (recharge 3) : +1 point de compétence ; l’allié le plus proche de son ultime +20 d’énergie, les autres +10.',v:{coeur:['Conteur des veillées','+ soin de 6 % à toute l’équipe.'],lame:['Conteur de batailles','l’allié qui reçoit 20 d’énergie gagne ATQ +15 % (2 tours).'],esprit:['Maître des légendes','+2 points au lieu de +1, recharge 2.']}},
 tacticien:{n:'Tacticien',f:'soutien',a:3,sn:'Ordre de bataille',d:'Active (recharge 3) : l’allié le plus fort avance de 50 % et gagne critique +20 % (1 action).',v:{coeur:['Capitaine protecteur','vise l’allié le plus blessé, + bouclier 10 %.'],lame:['Commandant de choc','l’allié agit immédiatement.'],esprit:['Grand stratège','affecte 2 alliés.']}}};
const ROLE_SUBS={guerrier:['etendard','medic','runiste'],gardien:['medic','exorciste','etendard'],assassin:['saboteur','contreb','alchi'],archer:['pisteur','dompteur','saboteur'],sorcier:['runiste','exorciste','alchi'],soigneur:['garde','conteur','exorciste'],soutien:['conteur','tacticien','dompteur']};
/* spécialisations (niv. 20) : id,n,rôle,armes,équipement,personnalités,sous-traits,mage,élém.,mods,familles,technique,ultime,formes,effets de forme,passerelles */
const SPECS={};
[['epeiste','Épéiste','guerrier','epee','','Calculateur,Ambitieux,Stoïque','Méthodique,Discipliné,Compétitif','','','crit:.05','degats,controle','Lame croisée|2 coups de 130 % ; le second est critique si le premier brise.','Mille entailles|Lame de la première nuit|6 coups de 70 % sur la cible, rupture totale si faiblesse|+2 coups|chaque critique ajoute un coup (max 12)|12 coups, le dernier ×3','Maître-lame|Sabre céleste|Souverain des Lames','riposte innée 30 %|chaque rupture qu’il provoque lui rend un point de compétence|attaques de base à 2 coups, ruptures ×2','duelliste'],
 ['berserker','Berserker','guerrier','hache','','Impulsif,Égoïste,Ambitieux','Colérique,Téméraire,Orgueilleux','','feu','atk:.08,def:-.08','degats,celerite','Fendoir sanglant|Cible (240 %), vol de vie 10 %.','Rage écarlate|Cataclysme de chair|3 tours : ATQ +60 %, coups aussi sur les voisins (50 %)|+ vol de vie 15 %|dure 4 tours|5 tours, ATQ +120 %, ne peut tomber sous 1 PV','Fléau rouge|Avatar de la Rage|Titan du Carnage','immunisé au recul|sous 30 % PV : dégâts +50 % et vol de vie 20 %|survit à un coup fatal 2 tours (1×/combat) ; ATQ +1 % par % de PV manquant','vengeur'],
 ['chevalier','Chevalier','guerrier','epee,hache','lourde,etendard','Altruiste,Stoïque,Gourmand','Loyal,Protecteur,Courageux','','sacre','hp:.08','protection,degats','Charge du serment|Cible (200 %) + bouclier 10 % PV sur l’allié le plus faible.','Serment d’acier|Aube du serment|cible 300 %, équipe bouclier 15 % PV, provoque 1 tour|boucliers 20 %|provoque 2 tours, dégâts subis −30 %|cible 600 %, boucliers 35 %, équipe immunisée 1 tour','Chevalier-lige|Haut-chevalier de l’Aube|Seigneur-Soleil','ses boucliers +30 %|équipe : dégâts subis −10 % tant qu’il est debout|chaque tour allié : bouclier 6 % PV sur l’allié le plus faible','paladin'],
 ['paladin','Paladin','gardien','bouclier','relique,lourde','Altruiste,Stoïque','Protecteur,Dévoué,Compatissant','Sacrée','sacre','heal:.15','protection,soin','Bouclier béni|Provoque 2 tours, bouclier sur soi (200 % DEF), équipe soin 6 %.','Jugement radieux|Lumière première|équipe bouclier 20 % + soin 10 % ; ennemis 150 % (Sacré)|purifie|ennemis 250 %|équipe soin 50 %, bouclier 40 %, ennemis 400 %','Croisé|Champion céleste|Égide incarnée','ses soins posent aussi un bouclier (30 %)|ses boucliers soignent de 50 % de leur reste en expirant|dégâts subis par l’équipe −20 %, purification à chaque tour','chevalier,pretre'],
 ['rempart','Rempart','gardien','bouclier','lourde','Stoïque,Calculateur,Gourmand','Résistant,Patient,Prudent','','','def:.10','defense,protection','Mur d’acier|Provoque 2 tours, dégâts subis par l’équipe −15 % (1 tour).','Forteresse vivante|Montagne qui marche|2 tours : encaisse 50 % des dégâts de l’équipe, DEF ×2|3 tours|renvoie 25 % des dégâts encaissés|3 tours, encaisse 100 %, DEF ×3','Bastion|Citadelle|Montagne éternelle','provoque en permanence au-dessus de 50 % PV|dégâts subis par l’équipe −15 %|encaisse 30 % des dégâts de l’équipe, DEF ×1,5','chevalier'],
 ['vengeur','Vengeur','gardien','bouclier','cape','Impulsif,Égoïste,Ambitieux','Colérique,Déterminé,Vaniteux','','foudre','atk:.06','defense,degats','Bouclier épineux|Provoque, renvoie 30 % des dégâts reçus (2 tours).','Représailles|Dette de sang|tous : 100 % ATQ + 50 % des dégâts subis (max 600 % ATQ)|max 800 %|se soigne de 30 % du total|max 1 500 %','Némésis|Juge d’épines|Dieu des Représailles','renvoie 15 % des dégâts subis|ses ripostes touchent tous les ennemis|renvoie 40 % des dégâts subis','berserker'],
 ['lameombre','Lame de l’ombre','assassin','dagues','cape','Égoïste,Calculateur','Froid,Cynique,Solitaire','Obscure','ombre','crit:.08','degats,celerite','Coup sournois|Cible (280 %) ; ×1,5 si elle n’a pas encore agi.','Danse des ombres|Éclipse|intouchable 1 tour, puis 3 coups de 180 % sur l’ennemi le plus faible|4 coups|exécute sous 20 % (hors boss)|6 coups de 220 %','Ombre sans nom|Faucheur|Nuit souveraine','furtif après chaque élimination|achève les ennemis sous 12 % PV (hors boss)|invisible tant qu’il n’a pas frappé deux fois ; critique ×2,2','duelliste,occultiste'],
 ['eclaireur','Éclaireur','assassin','dagues','boussole,torche','Curieux,Opportuniste','Explorateur,Observateur,Débrouillard','','','spd:8','celerite,decouverte','Frappe-éclair|Cible (160 %), révèle une faiblesse, son tour revient plus vite.','Embuscade parfaite|Ciel ouvert|toute l’équipe agit immédiatement, +1 point de compétence|+1 point|l’équipe gagne +20 d’énergie|l’équipe joue deux fois de suite','Vif-argent|Vent-du-sommet|Messager des Étoiles','premier à agir à chaque combat|+1 action au premier tour|l’équipe agit avant les ennemis au premier tour','rodeur'],
 ['duelliste','Duelliste','assassin','dagues,epee','cuir','Ambitieux,Impulsif','Compétitif,Orgueilleux,Courageux','','','atk:.05,crit:.03','celerite,chance','Défi|Cible (220 %), la défie : dégâts mutuels +20 %, pare 30 % de ses attaques.','Duel à mort|Combat éternel|5 coups de 110 %, chaque critique ajoute un coup|3 tours|la cible perd 30 % d’ATQ|10 coups de 150 %','Maître duelliste|Lame invaincue|Champion éternel','30 % de parade contre la cible défiée|la cible défiée subit +35 % de ses dégâts|chaque ennemi vaincu le soigne de 15 % et il rejoue','epeiste'],
 ['empoisonneur','Empoisonneur','assassin','dagues','potion,elixir','Calculateur,Gourmand,Curieux','Inventif,Méthodique,Manipulateur','','nature','','controle,decouverte','Lame enduite|Cible (160 %) + poison 3 tours (25 % ATQ/tour, cumul 3).','Nuée toxique|Fin de toute chose|tous : poison ×3 cumuls (25 % ATQ/tour) et DEF −20 %|×4 cumuls|poison ignore les boucliers|poison ×6, DEF −40 %','Maître des venins|Peste noire|Fléau primordial','poison cumulable jusqu’à 5|le poison se propage à un voisin à la mort|poisons ×2','occultiste'],
 ['tireur','Tireur d’élite','archer','arc','','Calculateur,Stoïque,Égoïste','Patient,Froid,Prudent','','','crit:.06','degats,chance','Tir visé|Cible (260 %), ignore 30 % DEF, critique +15 %.','Tir du jugement|Trait d’étoile|cible 600 %, ignore 60 % DEF, ne rate jamais|750 %|ignore 100 % DEF|1 500 %, traverse tous les ennemis (50 %)','Tireur fantôme|Flèche du destin|L’Étoile filante','ses tirs ne ratent jamais|ignore 50 % de DEF en permanence|première attaque de chaque combat ×4','lameombre'],
 ['rodeur','Rôdeur','archer','arc','cuir,boussole','Curieux,Altruiste,Gourmand','Explorateur,Patient,Observateur','Naturelle','nature','hp:.06','controle,soin','Flèche de ronces|2 flèches de 110 %, racines (recul 20 %).','Colère sylvestre|Forêt-Monde|tous 180 %, recul 20 %, équipe soin 8 %|soin 12 %|racines 2 tours|tous 350 %, équipe régénère 10 %/tour 3 tours','Gardien des bois|Seigneur des bêtes|Cœur de la Forêt-Monde','obtient un familier (35 %)|familier ×2 de puissance|ronces : ennemis −15 % VIT, équipe régénère 3 %/tour','druide'],
 ['tempete','Archer de tempête','archer','arc','','Impulsif,Ambitieux,Opportuniste','Téméraire,Spontané,Chanceux','','foudre','spd:5','celerite,degats','Salve|5 flèches de 55 % au hasard, critique +10 %.','Ouragan de flèches|Ciel déchiré|tous : 3 vagues de 90 %|4 vagues|chaque vague peut critiquer deux fois|6 vagues + foudre','Tempétueux|Œil du cyclone|Souverain des Tempêtes','chaque critique ajoute une flèche (60 %)|ses salves touchent +2 fois|chaque compétence déclenche une Chaîne d’éclairs (60 %)','elementaliste'],
 ['elementaliste','Élémentaliste','sorcier','baton','robe','Impulsif,Ambitieux,Égoïste','Téméraire,Colérique,Orgueilleux','Élémentaire','feu,glace,foudre','atk:.06','degats,controle','Nova élémentaire|Tous (120 %) + effet de son élément.','Cataclysme primordial|Genèse|tous 260 %, rupture ×2|+ effet d’élément ×2|2 éléments|tous 520 %, frappe toujours une faiblesse','Archimage|Avatar élémentaire|Dieu des Éléments','l’effet d’élément s’applique à toutes ses compétences|ses dégâts comptent comme deux éléments|frappe toujours une faiblesse','tempete'],
 ['arcaniste','Arcaniste','sorcier','grimoire','robe','Curieux,Calculateur','Chercheur,Inventif,Méthodique','Arcanique','arcane','','decouverte,soutien','Missiles arcaniques|4 missiles de 60 % ; +10 d’énergie à l’allié le plus proche de son ultime.','Singularité|Big-bang|tous 220 %, annule les charges, équipe +25 d’énergie|+35 d’énergie|+2 points de compétence|tous 450 %, équipe +100 d’énergie (sauf lui)','Haut-arcaniste|Tisseur de mana|Source infinie','+1 point de compétence tous les 3 tours|les ultimes de l’équipe coûtent 80 d’énergie|l’équipe gagne +10 d’énergie à chaque tour','chrono,enchanteur'],
 ['chrono','Chronomancien','sorcier','baton,grimoire','sablier','Stoïque,Calculateur','Patient,Stratège,Discipliné','Temporelle','','spd:6','controle,celerite','Distorsion|Cible (110 %), recule de 35 % ; un allié avance de 20 %.','Arrêt du temps|Éternité figée|les ennemis sautent leur prochain tour ; équipe +20 d’énergie|+30 d’énergie|2 tours sautés pour les ennemis normaux|les ennemis sautent 2 tours, équipe +50 d’énergie','Gardien du temps|Seigneur des heures|Éternité','l’équipe commence 20 % plus tôt|les ennemis ne peuvent jamais agir deux fois de suite|une fois par combat, rembobine l’équipe (PV, énergie)','arcaniste'],
 ['occultiste','Occultiste','sorcier','grimoire','','Égoïste,Opportuniste,Calculateur','Manipulateur,Cynique,Rusé','Obscure','ombre','atk:.05,hp:-.05','controle,degats','Malédiction|Cible (130 %, Ombre), dégâts subis +20 % (3 tours).','Pacte des abysses|Néant dévorant|sacrifie 25 % PV : tous 300 % et malédiction (dégâts subis +20 %, 3 tours)|sacrifie 15 %|malédiction +30 %|tous 650 %, sacrifie 0 %','Maître des pactes|Prince abyssal|Néant','ses sacrifices de PV sont réduits de moitié|ses malédictions se cumulent (2)|ses malédictions dévorent 3 % PV max par tour (boss 1 %)','hemo'],
 ['pretre','Prêtre','soigneur','sceptre','relique','Altruiste,Stoïque,Calculateur','Compatissant,Empathique,Dévoué','Sacrée','sacre','heal:.15','soin,protection','Lumière salvatrice|Allié le plus blessé : 180 % ATQ + 10 % PV max, purifie.','Miracle|Aurore|équipe soin 35 % PV max, purifie, bouclier 10 %|bouclier 15 %|relève un allié à terre (25 %), 1×/combat|relève tous les alliés à 40 %, soin 60 %','Grand prêtre|Saint|Aube incarnée','soins +20 %, purifie à chaque soin|Rappel des étoiles sans contrepartie (1×/combat)|relève le premier allié qui tombe (50 % PV), 1×/combat','paladin'],
 ['druide','Druide','soigneur','sceptre,baton','','Gourmand,Curieux,Altruiste','Cuisinier,Explorateur,Patient','Naturelle','nature','hp:.06','soin,cuisine','Bourgeon|2 alliés : soin sur 3 tours (8 % PV/tour).','Floraison|Printemps éternel|équipe régénère 10 %/tour (3 tours), DEF +20 %|4 tours|+ ronces : ennemis 60 %/tour|régénère 20 %/tour 4 tours, DEF +40 %','Archidruide|Esprit de la sève|Mère-Forêt','ses soins sur la durée durent 1 tour de plus|sa régénération touche aussi les alliés à terre (1×)|équipe régénère 8 %/tour','rodeur'],
 ['hemo','Hémomancien','soigneur','sceptre','','Égoïste,Ambitieux,Impulsif','Vaniteux,Colérique,Déterminé','','ombre','atk:.08','soin,degats','Saignée|Cible (140 %), soigne l’allié le plus blessé de 100 % des dégâts.','Marée écarlate|Océan de sang|tous 160 % ; l’équipe récupère 60 % des dégâts totaux|80 %|excédent en bouclier|tous 400 %, récupère 100 %','Seigneur du sang|Cœur écarlate|Dieu-Sang','vol de vie 15 % sur toutes ses attaques|l’excédent de soin devient bouclier|ses dégâts soignent l’équipe (100 %, répartis)','occultiste'],
 ['troubadour','Troubadour','soutien','luth','','Opportuniste,Gourmand,Curieux','Charmeur,Épicurien,Spontané','','','spd:4','soutien,chance','Ballade entraînante|Équipe +10 d’énergie, +1 point de compétence.','Grand final|Symphonie céleste|équipe +40 d’énergie, +2 points de compétence|+50 d’énergie|l’allié le plus fort rejoue|l’équipe a son ultime prêt (sauf lui)','Ménestrel royal|Voix d’or|Muse céleste','or +15 %, l’équipe commence avec +15 d’énergie|+1 point de compétence un tour allié sur deux|l’équipe commence avec 50 d’énergie, +1 point par tour','eclaireur'],
 ['chantre','Chantre de guerre','soutien','luth','etendard','Ambitieux,Impulsif,Égoïste','Compétitif,Téméraire,Orgueilleux','','feu','atk:.05','soutien,degats','Chant de guerre|Allié le plus fort : ATQ +45 %, critique +15 % (2 tours), agit immédiatement.','Hymne des conquérants|Chant du monde|équipe ATQ +40 %, critique +20 % (2 tours), +2 points|3 tours|+ dégâts critiques ×1,8|ATQ +100 %, critique +40 % (3 tours)','Skalde|Tambour du monde|Voix de la Guerre','ses bonus d’ATQ durent 1 tour de plus|équipe critique +15 %|équipe ATQ +35 %, critique +20 %','chevalier'],
 ['enchanteur','Enchanteur','soutien','luth','relique','Calculateur,Stoïque,Altruiste','Stratège,Prudent,Généreux','Arcanique','','def:.06','soutien,controle','Enchantement|Allié : DEF +30 %, son arme gagne l’élément faible de la cible (2 tours).','Grand charme|Harmonie universelle|ennemis ATQ −30 % (2 tours) ; l’équipe frappe toutes les faiblesses 1 tour|2 tours|ennemis DEF −30 % aussi|ennemis ATQ/DEF −50 %, faiblesses 2 tours','Haut-enchanteur|Tisse-destin|Harmonie','ses enchantements touchent un second allié|ennemis : ATQ −15 % permanent|toutes les attaques de l’équipe touchent une faiblesse','arcaniste']
].forEach(a=>{const L=s=>s?s.split(','):[],md={};L(a[9]).forEach(x=>{const[k,v]=x.split(':');md[k]=+v});const t=a[11].split('|'),u=a[12].split('|');SPECS[a[0]]={n:a[1],r:a[2],w:L(a[3]),t:L(a[4]),p:L(a[5]),s:L(a[6]),m:L(a[7]),e:L(a[8]),mods:md,f:L(a[10]),tn:t[0],td:t[1],un:[u[0],u[1]],ud:u.slice(2),aw:a[13].split('|'),awd:a[14].split('|'),pass:L(a[15])}});
const SPK=Object.keys(SPECS);
/* métiers (§6) : attribution au niv. 5 seulement — effets et postes viendront avec les nouveaux bâtiments */
const JOBS={cuisinier:['Cuisinier','Auberge','Chef étoilé'],architecte:['Architecte','Hôtel de ville','Maître bâtisseur'],chasseur:['Chasseur','Installations de chasse','Traqueur légendaire'],cueilleur:['Cueilleur','Ferme','Herboriste sylvain'],entraineur:['Entraîneur','Camp','Maître d’armes'],fermier:['Fermier','Ferme','Seigneur des moissons'],forgeron:['Forgeron','Forge','Forgeron des étoiles'],eleveur:['Éleveur','Ferme','Maître des bêtes'],mineur:['Mineur','Entrepôt','Mineur des profondeurs'],alchimiste:['Alchimiste','Laboratoire d’alchimie','Grand alchimiste'],marchand:['Marchand','Marché','Prince marchand'],apothicaire:['Apothicaire','Infirmerie','Grand apothicaire'],cartographe:['Cartographe','Hôtel de ville','Arpenteur des étoiles'],bibliothecaire:['Bibliothécaire','Bibliothèque','Archiviste']};
const JOBD={cuisinier:'Repas avant chaque départ : équipe ATQ/DEF +2 % par rang (5 premiers combats).',architecte:'Coûts de construction −4 % par rang.',chasseur:'Matériaux de monstre +5 % par rang.',cueilleur:'Poussière et herbes au fil du temps.',entraineur:'Séances du Camp moins chères, exp. +8 % par rang.',fermier:'Production de la Ferme +8 % par rang.',forgeron:'Catalyseur de rareté et affinage moins cher.',eleveur:'Cuir et tissu au fil du temps.',mineur:'Extraction de minerai moins chère.',alchimiste:'Fusions moins chères, élixirs renforcés.',marchand:'Or des combats +3 % par rang, étal à l’Auberge.',apothicaire:'Soins des blessés moins chers, risque de mort réduit.',cartographe:'Révèle une partie de la carte à l’entrée d’étage.',bibliothecaire:'Niveaux de compétence moins chers.'};
const JOBW={Altruiste:{apothicaire:4,cuisinier:2,fermier:2,eleveur:2},Ambitieux:{marchand:3,forgeron:3,entraineur:3,architecte:2},Calculateur:{architecte:4,marchand:3,bibliothecaire:3,alchimiste:2},Impulsif:{chasseur:5,mineur:3,entraineur:2},Stoïque:{mineur:4,forgeron:4,fermier:2,entraineur:2},Curieux:{cartographe:4,bibliothecaire:3,alchimiste:3,cueilleur:2},Gourmand:{cuisinier:6,fermier:2,eleveur:2},Égoïste:{marchand:4,chasseur:3,alchimiste:2},Opportuniste:{marchand:5,cueilleur:2,cartographe:2},
 _t:{Cuisinier:{cuisinier:4},Gourmet:{cuisinier:3},Chercheur:{bibliothecaire:3},Explorateur:{cartographe:3},Inventif:{alchimiste:2,forgeron:1},Avare:{marchand:3},Méthodique:{architecte:2},Patient:{fermier:2},Résistant:{mineur:2},Compatissant:{apothicaire:2},Débrouillard:{cueilleur:2},Téméraire:{chasseur:2}},
 _r:{Nain:{forgeron:2,mineur:2},Elfe:{cueilleur:2,apothicaire:2},Gobelin:{marchand:2,alchimiste:2},'Homme-bête':{chasseur:2,eleveur:2},Orc:{mineur:2,chasseur:2},Humain:{architecte:1,fermier:1}}};
/* ---------- niveaux, expérience, réserve ---------- */
const XPB=[[10,30,20,1],[20,40,17,1],[30,50,20,1],[40,60,20,1],[50,80,24,1],[60,80,24,1.6]];
const bandOf=L=>Math.min(6,Math.floor((L-1)/10)+1);
const RB=[0,.09,.08,.07,.07,.08,.12],KK={atk:1,hp:.62,def:.4},BUMP={20:1.06,30:1.04,40:1.12,50:1.15,60:1.6};
const LVM={};for(const k in KK){const a=[1,1];for(let L=2;L<=60;L++)a[L]=a[L-1]*(1+RB[bandOf(L)]*KK[k])*(BUMP[L]?1+(BUMP[L]-1)*KK[k]:1);LVM[k]=a}
const tilt=(g,L)=>1+.5*((g||1)-1)*(L-1)/59;
const bandXP=cp=>{let t=0;for(let L=cp;L<cp+10;L++)t+=need({lv:L});return t};
const bankMax=c=>c.st>=6?0:Math.round(bandXP(10*c.st)/2);
function bankAdd(c,x){const m=bankMax(c),b=c.xpBank||0;c.xpBank=Math.max(b,Math.min(m,b+Math.round(x*.5)))}
/* ---------- état de progression d'un personnage ---------- */
const awOf=c=>!c.cls||c.cls.pend.aw?0:c.cls.aw||0;
const harmOf=c=>!c.cls||!c.cls.spec||SPECS[c.cls.spec].r==c.role;
const pendOf=c=>c.cls?Object.keys(c.cls.pend).filter(k=>c.cls.pend[k]):[];
let PROGQ=[];
const CONST=[['✦1 Écho divin','statistiques +4 % ; passif divin +50 %'],['✦2 Ciel ouvert','statistiques +4 % ; ultime divin +20 %, commence chaque combat avec 30 d’énergie'],['✦3 Aura stellaire','statistiques +4 % ; équipe +5 % PV/ATQ/DEF tant qu’il est vivant']];
function initProg(c,isNew){if(!c.cls||typeof c.cls!='object')c.cls={sub:null,spec:null,aw:0,pend:{}};if(!c.cls.pend)c.cls.pend={};
 if(!c.job||typeof c.job!='object')c.job={id:null,pm:0,voc:null,post:null};
 if(!c.tree||typeof c.tree!='object')c.tree={v:1,fix:{},ins:[],got:[],star:{}};['ins','got'].forEach(k=>{if(!Array.isArray(c.tree[k]))c.tree[k]=[]});if(!c.tree.fix)c.tree.fix={};if(!c.tree.star)c.tree.star={};
 if(!(c.xpBank>=0))c.xpBank=0;if(!Array.isArray(c.deck))c.deck=[];if(!c.seed)c.seed=ri(1,99999);
 if(isNew&&c.st>=4&&!c.tree.star[1])c.tree.star[1]=bandOf(10*c.st);
 revealTree(c);return c}
/* ---------- arbre personnel (§7) ---------- */
const TSLOTS=[[3,'G'],[6,'G'],[8,'G',1],[12,'G'],[14,'S'],[16,'G'],[18,'G'],[22,'V'],[24,'G'],[26,'V'],[28,'G'],[32,'G'],[34,'G'],[37,'G'],[38,'G'],[42,'V'],[44,'G'],[47,'G'],[48,'G'],[52,'D'],[54,'D'],[56,'D'],[58,'D']];
const BANDW=[null,[70,25,5,0,0],[45,35,17,3,0],[25,35,30,9,1],[10,30,38,18,4],[0,15,40,33,12],[0,0,25,45,30]];
const RMIN=[3,3,3,12,22],TREE_V=1;
function treeRng(c,L){let s=((c.seed||1)*2654435761^L*40503^TREE_V*97)>>>0;return()=>{s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function slotsOf(c){const g=c.gr||GR0;let s=TSLOTS.map(x=>({L:x[0],k:x[1],act:!!x[2]}));
 if(g.ms<=4)s.push({L:11,k:'G',gen:1},{L:31,k:'G',gen:1},{L:51,k:'D',gen:1});
 if(g.ms>=6){s=s.filter(x=>x.L!=16&&x.L!=37&&x.L!=47);s.forEach(x=>{if(x.L==18||x.L==38||x.L==48)x.pat=1})}
 const S=(c.tree&&c.tree.star)||{};for(const L in S)s.push({L:+L,k:'G',star:1,band:S[L]});
 s.forEach(x=>x.key=(x.star?'s':'')+x.L);return s.sort((a,b)=>a.L-b.L||(a.star?1:0)-(b.star?1:0))}
const sigW=(c,S)=>!S.sig?1:S.sig==c.pers?5:(c.subs||[]).some(t=>TRAITS[t]&&TRAITS[t][0]==S.sig)?.5:0;
const specGuess=c=>c.cls&&c.cls.spec||(specFore(c)[0]||[])[0]||null;
function genNode(c,sl,used,st){const rng=treeRng(c,sl.star?100+sl.L:sl.L),w=famW(c),sub=c.cls&&c.cls.sub,sp=sl.k=='V'||sl.k=='D'?specGuess(c):c.cls&&c.cls.spec;
 if(sl.k=='S'&&sub)w[SUBCL[sub].f]+=2;if(sl.k=='V'&&sp)SPECS[sp].f.forEach(f=>w[f]+=3);if(sl.k=='D'){if(sp)SPECS[sp].f.forEach(f=>w[f]+=2);w[AMEF(c.pers)]+=1}
 let band=sl.star?sl.band||bandOf(sl.L+1):bandOf(sl.L);if(sl.pat)band=Math.min(6,band+1);const BW=BANDW[band],fams=FK.slice(),sm=1+.06*((c.st||1)-1);
 while(fams.length){let x=rng()*fams.reduce((a,f)=>a+w[f],0),f=fams[fams.length-1];for(const k of fams){x-=w[k];if(x<0){f=k;break}}
  const cand=TREEK.filter(id=>{const S=SKILLS[id];return S.f==f&&!used.has(id)&&BW[S.r]>0&&(sl.star||sl.L>=RMIN[S.r])&&!(S.dp&&st.dp)&&(!sl.act||st.act||S.a)&&sigW(c,S)>0});
  if(!cand.length){fams.splice(fams.indexOf(f),1);continue}
  const ww=cand.map(id=>{const S=SKILLS[id],tg=S.tg||[];return BW[S.r]*Math.pow(sm,S.r)*(sp&&tg.includes(sp)?3:sub&&tg.includes(sub)?2:1)*sigW(c,S)*(S.dp?.25:1)});
  let y=rng()*ww.reduce((a,b)=>a+b,0),id=cand[cand.length-1];for(let i=0;i<cand.length;i++){y-=ww[i];if(y<0){id=cand[i];break}}
  return{id,ins:rng()<((c.gr||GR0).lc-.5)/2}}
 return null}
function treeOf(c){const T=c.tree||{fix:{},ins:[],got:[],star:{}},used=new Set(Object.values(T.fix)),st={act:false,dp:Object.values(T.fix).some(id=>SKILLS[id]&&SKILLS[id].dp)},out=[],sub=c.cls&&c.cls.sub,spec=c.cls&&c.cls.spec;
 for(const s of slotsOf(c)){let id=T.fix[s.key],ins=T.ins.includes(s.key),fixed=!!id;
  if(!id){const n=genNode(c,s,used,st);if(!n)continue;id=n.id;ins=n.ins;used.add(id)}
  const S=SKILLS[id];if(!S)continue;if(S.a)st.act=true;if(S.dp)st.dp=true;
  out.push(Object.assign({},s,{id,ins,fixed,got:T.got.includes(s.key),pres:!fixed&&((s.k=='S'&&!sub)||((s.k=='V'||s.k=='D')&&!spec))}))}
 return out}
function fixNode(c,n){const T=c.tree;if(T.fix[n.key])return;T.fix[n.key]=n.id;if(n.ins&&!T.ins.includes(n.key))T.ins.push(n.key)}
function revealTree(c){const cp=cap(c);treeOf(c).forEach(n=>{if(!n.fixed&&n.L<=cp&&!n.pres)fixNode(c,n)})}
/* débloque tous les nœuds ≤ niveau actuel (q : silencieux) ; renvoie le nombre de nœuds débloqués */
function treeCatch(c,q){let k=0;treeOf(c).forEach(n=>{if(n.got||n.L>c.lv)return;fixNode(c,n);c.tree.got.push(n.key);k++;const S=SKILLS[n.id],r=Math.min(4,S.r+(n.ins?1:0)),had=c.skills.find(s=>s.id==n.id);
  if(had){had.lv=Math.min(10,had.lv+2);if(!q)NEWSK.push({c,s:had,up:1})}else{const s={id:n.id,lv:1,r,src:'arbre'};c.skills.push(s);if(!q)NEWSK.push({c,s,ins:n.ins})}codexSig(c,n.id)});return k}
/* ---------- spécialisation (§4.4) ---------- */
function specScores(c){const e=c.eq||{};return SPK.filter(k=>SPECS[k].r==c.role).map(k=>{const S=SPECS[k];let s=0;if(e.arme&&S.w.includes(e.arme.t))s+=4;if([e.armure,e.outil].some(it=>it&&S.t.includes(it.t)))s+=2;if(S.p.includes(c.pers))s+=3;s+=(c.subs||[]).filter(t=>S.s.includes(t)).length;if(c.mage&&S.m.includes(c.mage))s+=4;if(S.e.includes(c.elem))s+=1;return[k,s]})}
function specFore(c){if(c.sig&&c.name=='Jeanne'&&c.role=='guerrier')return[['chevalier',1]];const L=specScores(c),t=L.reduce((a,x)=>a+x[1]*x[1],0);return L.map(([k,s])=>[k,t?s*s/t:1/L.length]).sort((a,b)=>b[1]-a[1])}
function specOf(c){const L=specFore(c);let x=treeRng(c,777)();for(const[k,p]of L){x-=p;if(x<0)return k}return L[0][0]}
/* ---------- vocations (§6.2) ---------- */
function vocOf(c){const w={};for(const k in JOBS)w[k]=1;const add=o=>{for(const k in o||{})w[k]+=o[k]};add(JOBW[c.pers]);(c.subs||[]).forEach(t=>add(JOBW._t[t]));add(JOBW._r[c.race]);if(c.mage)add({bibliothecaire:4,alchimiste:2});
 const rng=treeRng(c,555),out=[];for(let i=0;i<2;i++){const ks=Object.keys(w).filter(k=>!out.includes(k));let x=rng()*ks.reduce((a,k)=>a+w[k],0);for(const k of ks){x-=w[k];if(x<0){out.push(k);break}}if(out.length<=i)out.push(ks[0])}return out}
/* ---------- paliers (§2) ---------- */
function milestone(c,L,q){const C=c.cls,P=(t)=>{if(!q)PROGQ.push({t,cid:c.id})},say=t=>{if(!q)NEWSK.push({c,txt:t})};
 if(L==5&&!c.job.id){C.pend.job=1;if(!c.job.voc)c.job.voc=vocOf(c);P('job');say('ressent une vocation (métier à choisir)')}
 if(L==10&&!C.sub){C.pend.sub=1;P('sub');say('peut choisir sa <b class="g">sous-classe</b>')}
 if(L==15){const f=specFore(c)[0];if(f)say(`vocation pressentie : <b class="g">${SPECS[f[0]].n}</b> (${Math.round(f[1]*100)} %)`)}
 if(L==20&&!C.spec){C.spec=specOf(c);revealTree(c);codexSpec(c);P('spec');say(`se spécialise : <b class="g">${SPECS[C.spec].n}</b>`)}
 if(L==25)say('maîtrise sa technique (+15 %)');
 if(L==30&&C.sub){codexVoie(c);say(`sous-classe améliorée : <b class="g">${SUBCL[C.sub].v[voieOf(c)][0]}</b>`)}
 if(L==35){P('ult');say(`débloque un nouvel ultime : <b class="g">${kit(c).ul[0]}</b>`)}
 if(L==40&&!C.aw&&!C.pend.aw&&C.spec){C.pend.aw=1;P('aw');say('peut s’<b class="g">éveiller</b>')}
 if(L==45&&c.job.id){P('jobevo');say(`métier évolué : ${JOBS[c.job.id][2]}`)}
 if(L==50){C.aw=Math.max(C.aw,2);if(!C.pend.aw)P('aw2');say('atteint l’<b class="g">apogée</b>')}
 if(L==55)say('éclat divin : technique divine (+30 %), +1 point de compétence en combat');
 if(L==60&&c.st>=6){C.aw=3;if(!C.pend.aw)P('aw3');say('devient une <b class="g">divinité</b> !')}}
/* migration d'un personnage (tdE5 → tdE6) : niveaux au-dessus du plafond → réserve, paliers rétroactifs, nœuds ≤ niveau */
function migrateProg(c){const fresh=!c.cls;initProg(c);if(!fresh)return 0;const cp=10*c.st;
 if(c.lv>cp){let x=c.xp||0;for(let L=cp;L<c.lv;L++)x+=need({lv:L});c.xpBank=(c.xpBank||0)+x;c.lv=cp;c.xp=0;c.migBank=x}
 c.skills.forEach(s=>s.src=s.src||'acquis');
 if(c.lv>=5&&!c.job.id){c.cls.pend.job=1;c.job.voc=vocOf(c)}if(c.lv>=10&&!c.cls.sub)c.cls.pend.sub=1;
 if(c.lv>=20&&!c.cls.spec)c.cls.spec=specOf(c);if(c.lv>=40&&!c.cls.aw)c.cls.pend.aw=1;if(c.lv>=50)c.cls.aw=Math.max(c.cls.aw,2);if(c.lv>=60&&c.st>=6)c.cls.aw=3;
 revealTree(c);return treeCatch(c,1)}
/* ---------- codex des personnalités (§9) ---------- */
function cdx(p){if(!G.codex||typeof G.codex!='object')G.codex={};return G.codex[p]=G.codex[p]||{own:0,subs:[],sig:0,spec:[],voie:[],rel:{},combo:[]}}
const cdxAdd=(a,v)=>{if(v&&!a.includes(v))a.push(v)};
function codexOwn(c){if(!PERS[c.pers])return;const e=cdx(c.pers);e.own=1;(c.subs||[]).forEach(t=>{if(TRAITS[t]&&TRAITS[t][0]==c.pers)cdxAdd(e.subs,t);else if(TRAITS[t])cdxAdd(cdx(TRAITS[t][0]).subs,t)});combosOf(c).forEach(x=>cdxAdd(e.combo,x[1]));if(c.cls&&c.cls.spec&&c.lv>=20)codexSpec(c);if(c.cls&&c.cls.sub&&c.lv>=30)codexVoie(c)}
function codexSpec(c){if(PERS[c.pers]&&c.cls.spec)cdxAdd(cdx(c.pers).spec,c.cls.spec)}
function codexVoie(c){if(PERS[c.pers]&&c.cls.sub)cdxAdd(cdx(c.pers).voie,c.cls.sub)}
function codexSig(c,id){const S=SKILLS[id];if(S&&S.sig)cdx(S.sig).sig=1}
function codexRel(a,b,k){if(!PERS[a.pers]||!PERS[b.pers]||k=='neutre')return;cdx(a.pers).rel[b.pers]=k;cdx(b.pers).rel[a.pers]=k}
/* ---------- relations (bible §14) ---------- */
const PK=['Altruiste','Ambitieux','Calculateur','Impulsif','Stoïque','Curieux','Gourmand','Égoïste','Opportuniste'];
/* table de compatibilité (dérive par période passée ensemble ; symétrique) */
const CT=[
/*        Alt  Amb  Cal  Imp  Sto  Cur  Gou  Ego  Opp */
/*Alt*/ [ .6, .3, .2, .2, .3, .5, .5,-1.2, .6],
/*Amb*/ [ .3,-.2, .1,-.1, .1, .3, .2, -.6, .5],
/*Cal*/ [ .2, .1, .1,-.4, .3, .3, .1, -.3, .4],
/*Imp*/ [ .2,-.1,-.4,-.3, 0 , .3, .3, -.7, .5],
/*Sto*/ [ .3, .1, .3, 0 , .2, .2, .2, -.2, .3],
/*Cur*/ [ .5, .3, .3, .3, .2, .6, .6, -.3, .6],
/*Gou*/ [ .5, .2, .1, .3, .2, .6, .8, -.5, .6],
/*Ego*/ [-1.2,-.6,-.3,-.7,-.2,-.3,-.5,-.8, .1],
/*Opp*/ [ .6, .5, .4, .5, .3, .6, .6, .1, .4]];
const soc=c=>(c.subs||[]).reduce((a,s)=>a+(TRAITS[s]?TRAITS[s][2]:0),0);
function compat(a,b){const i=PK.indexOf(a.pers),j=PK.indexOf(b.pers);const base=i<0||j<0?0:CT[i][j],ch=((((a.seed||1)*31+(b.seed||1)*17)%100)/100-.5)*.3;return base+soc(a)+soc(b)+ch}
const rk=(a,b)=>a.id<b.id?a.id+'_'+b.id:b.id+'_'+a.id;
function rel(a,b){if(!G.rel)G.rel={};const k=rk(a,b);let r=G.rel[k];if(!r)r=G.rel[k]={v:Math.round(clamp(compat(a,b)*10+rnd(-5,5),-20,20)+(a.tal=='charisme'||b.tal=='charisme'?10:0)),tt:0};return r}
const amb=c=>c.pers=='Ambitieux'||(c.subs||[]).some(s=>s=='Compétitif'||s=='Orgueilleux');
function drift(a,b,k){const r=rel(a,b);let d=compat(a,b)*k;if(a.tal=='charisme'||b.tal=='charisme')d*=d>0?2:.5;if(d<0&&(a.pers=='Stoïque'||b.pers=='Stoïque')&&r.v<=-20)d=0;if(d<0&&(a.pers=='Opportuniste'||b.pers=='Opportuniste')&&a.pers!='Égoïste'&&b.pers!='Égoïste'&&r.v<=-10)d=0;
 r.v=+clamp(r.v+d,-100,100).toFixed(2);r.tt=+(r.tt+Math.abs(k)).toFixed(2);if(!r.rv&&amb(a)&&amb(b)&&r.tt>=6)r.rv=1;return r}
/* état d'une paire : harcèlement (égoïste → altruiste), hostilité, rivalité, amitié, respect, neutre */
function relState(a,b){const r=rel(a,b),v=r.v;
 if(v<=-25&&((a.pers=='Égoïste'&&b.pers=='Altruiste')||(b.pers=='Égoïste'&&a.pers=='Altruiste')))return{k:'harcele',by:a.pers=='Égoïste'?a:b,v};
 if(r.rv&&v>-40)return{k:'rival',v};if(v<=-40)return{k:'hostile',v};if(v>=40)return{k:'ami',v};
 if(v>=15&&['Calculateur','Stoïque'].some(p=>a.pers==p||b.pers==p))return{k:'respect',v};return{k:'neutre',v}}
const RELN={ami:['♥','Ami','#ff8fb3'],rival:['⚔','Rival','#ffcf4a'],harcele:['⚠','Harcèlement','#ff5a5a'],hostile:['✖','Hostile','#ff5a5a'],respect:['◆','Respect','#4de0c0'],neutre:['·','Neutre','#a9a4d0']};
const others=c=>G.chars.filter(o=>o!=c);
function isoOf(c){const os=others(c);if(os.length<2)return false;let s=0,f=0;os.forEach(o=>{const st=relState(c,o);s+=st.v;if(st.k=='ami')f++});return !f&&s/os.length<-15}
const bullied=c=>c.pers=='Altruiste'&&others(c).some(o=>relState(c,o).k=='harcele');
/* moral en combat : amis +4 %, hostiles −4 %, rival +2 % (stimulant), harcelé −10 % si le harceleur est là (−4 % sinon), isolé −8 % en groupe */
function moraleOf(c,team){let m=0;team.forEach(o=>{if(o==c)return;const s=relState(c,o);if(s.k=='ami')m+=.04;else if(s.k=='hostile')m-=.04;else if(s.k=='rival')m+=.02;else if(s.k=='harcele'&&s.by!=c)m-=.10});if(bullied(c)&&!team.some(o=>o!=c&&relState(c,o).k=='harcele'))m-=.04;if(isoOf(c)&&team.length>=3)m-=.08;return clamp(m,-.2,.15)}
function relTick(list,k){for(let i=0;i<list.length;i++)for(let j=i+1;j<list.length;j++)drift(list[i],list[j],k)}
function relBattle(list,win){relTick(list,1.5);if(win)for(let i=0;i<list.length;i++)for(let j=i+1;j<list.length;j++){const r=rel(list[i],list[j]);if(compat(list[i],list[j])>-.4)r.v=Math.min(100,+(r.v+.5).toFixed(2))}}
function relPrune(){if(!G.rel)G.rel={};const ids=new Set(G.chars.map(c=>c.id));for(const k in G.rel){const[a,b]=k.split('_').map(Number);if(!ids.has(a)||!ids.has(b)||!G.rel[k]||typeof G.rel[k].v!='number')delete G.rel[k]}}
function relSeed(){G.chars.forEach((a,i)=>G.chars.slice(i+1).forEach(b=>{const r=rel(a,b);if(!r.tt&&a.party&&b.party){r.tt=4;r.v=+clamp(r.v+compat(a,b)*6,-100,100).toFixed(2)}}))}
function relIcons(c){const cnt={};others(c).forEach(o=>{const k=relState(c,o).k;if(k!='neutre')cnt[k]=(cnt[k]||0)+1});let h=Object.keys(cnt).map(k=>`<span class="rli" style="color:${RELN[k][2]}" title="${RELN[k][1]} ×${cnt[k]}">${RELN[k][0]}${cnt[k]}</span>`).join('');if(bullied(c))h+='<span class="rli" style="color:#ff5a5a" title="Harcelé : moral en baisse">☹</span>';if(isoOf(c))h+='<span class="rli" style="color:#a9a4d0" title="Isolé">◌ isolé</span>';return h}
/* répliques de village selon la relation */
const RLN={ami:['{b}, tu es un vrai ami.','On fait la paire, {b} !','Avec toi à mes côtés, {b}, je n’ai peur de rien.','{b} ! Je t’ai gardé une part de tarte.'],
 rival:['{b}, la prochaine fois, je ferai mieux que toi.','Tu n’es pas mauvais, {b}… pour l’instant.','Je compte tes victoires, {b}. Et je vais les dépasser.'],
 bully:['Hé {b}, porte mon sac, tu adores aider, non ?','Toujours à jouer les saints, {b} ?','Pousse-toi, {b}. Les héros passent d’abord.','Ta gentillesse me fatigue, {b}.'],
 victim:['… Je fais de mon mieux, {b}.','Pourquoi tu me parles comme ça, {b} ?','Un jour, tu comprendras, {b}.'],
 hostile:['Ne m’adresse pas la parole, {b}.','Je te garde à l’œil, {b}.','Encore toi, {b} ?'],
 respect:['Je respecte ton sang-froid, {b}.','Bien joué l’autre jour, {b}.','Ton plan était solide, {b}.'],
 opp:['Ah, {b} ! Toujours un bon plan en poche ?','{b}, tu tombes à pic, comme d’habitude.','On dirait que la chance te suit, {b}.'],
 iso:['Je préfère être seul.','Personne ne me comprend ici.','Laissez-moi tranquille.'],
 neutre:['Belle journée, {b}.','Tu as vu la Tour ce matin, {b} ?','Salut, {b}.']};
function relLine(a,b){if(isoOf(a)&&Math.random()<.4)return pick(RLN.iso);if(!b)return pick(LN[a.pers]||['…']);const s=relState(a,b);let L;
 if(s.k=='harcele')L=s.by==a?RLN.bully:RLN.victim;else if(s.k!='neutre')L=RLN[s.k];else if(b.pers=='Opportuniste'&&s.v>10&&Math.random()<.6)L=RLN.opp;else L=Math.random()<.5?LN[a.pers]:RLN.neutre;return pick(L).replace('{b}',b.name)}
