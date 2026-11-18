'use strict';
/* Images personnalisées (facultatif) : ASSETS['sprite_Jeanne']='data:image/png;base64,...' — sprite 32×30 px tourné vers la droite, pieds en bas.
   Icônes d'objets : ASSETS['item_epee'], ASSETS['item_arc'], ASSETS['item_potion']… (une clé par type d'objet, voir ITYPES[t].icon) — image carrée ; à défaut, dessin procédural. */
const ASSETS={};
/* Art Blender (assets/assets.js → window.ASSETS_IMG) fusionné dans ASSETS : les clés déjà présentes dans ASSETS restent prioritaires.
   Toute image absente retombe sur le dessin procédural. */
const IMG={},IALIAS={item_armure_cuir:'item_armure_legere',item_potion:'item_potion_soin',item_elixir:'item_potion_energie'};
const aKey=k=>ASSETS[k]?k:IALIAS[k]&&ASSETS[IALIAS[k]]?IALIAS[k]:null,aSrc=k=>{k=aKey(k);return k?ASSETS[k]:null};
function aImg(k){k=aKey(k);if(!k)return null;let im=IMG[k];if(!im){im=IMG[k]=new Image();im.src=ASSETS[k]}return im.complete&&im.naturalWidth?im:null}
function loadAssets(){const src=window.ASSETS_IMG||{};for(const k in src)if(!ASSETS[k])ASSETS[k]=src[k];
 const ps=Object.keys(ASSETS).filter(k=>/^data:image|\.(png|webp|gif|jpe?g)$/i.test(ASSETS[k])).map(k=>{const im=IMG[k]=new Image();im.src=ASSETS[k];return(im.decode?im.decode():new Promise((r,j)=>{im.onload=r;im.onerror=j})).catch(()=>{delete IMG[k];delete ASSETS[k]})});
 return Promise.race([Promise.all(ps),new Promise(r=>setTimeout(r,5000))])}
/* habillage d'interface (cadre 9-slice, boutons, séparateur) depuis les images, en variables CSS */
function artCSS(){const r=document.documentElement.style,m={'--a-panel':'ui_panel','--a-btn':'ui_button','--a-btn2':'ui_button_alt','--a-btn3':'ui_button_hot','--a-div':'ui_divider'};for(const v in m){const a=aSrc(m[v]);if(a)r.setProperty(v,`url("${a}")`)}
 const b=document.body.classList;b.toggle('art',!!aSrc('ui_panel'));b.toggle('artb',!!(aSrc('ui_button')&&aSrc('ui_button_alt')&&aSrc('ui_button_hot')));b.toggle('artd',!!aSrc('ui_divider'))}
const $=s=>document.querySelector(s),rnd=(a,b)=>a+Math.random()*(b-a),ri=(a,b)=>Math.floor(rnd(a,b+1)),pick=a=>a[Math.floor(Math.random()*a.length)],clamp=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,k)=>a+(b-a)*k;
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=ri(0,i);[a[i],a[j]]=[a[j],a[i]]}return a};
let SPD=1;const sleep=ms=>new Promise(r=>setTimeout(r,ms/SPD));
/* ================= DONNÉES ================= */
const ELEMS={feu:{n:'Feu',c:'#ff6b3d',a:'ardent'},glace:{n:'Glace',c:'#6fd3ff',a:'givré'},foudre:{n:'Foudre',c:'#c58bff',a:'foudroyant'},nature:{n:'Nature',c:'#6fdc6f',a:'sylvestre'},sacre:{n:'Sacré',c:'#ffe27a',a:'radieux'},ombre:{n:'Ombre',c:'#8a7bd8',a:'ténébreux'},arcane:{n:'Arcane',c:'#ff7ad9',a:'arcanique'}},EK=Object.keys(ELEMS);
const ROLES={guerrier:{n:'Guerrier',hp:1,atk:1.1,def:1,spd:100,sk:['Taillade','Frappe lourde sur une cible (220 %).'],ul:['Déferlante','Cible (320 %) et ennemis voisins (160 %).']},
 gardien:{n:'Gardien',hp:1.35,atk:.75,def:1.5,spd:92,sk:['Rempart','Provoque les ennemis et gagne un bouclier.'],ul:['Bastion','Bouclier pour toute l’équipe.']},
 assassin:{n:'Assassin',hp:.8,atk:1.3,def:.75,spd:114,sk:['Estoc','Cible unique (260 %). Critique assuré sur un ennemi brisé.'],ul:['Exécution','Cible unique (450 %). Rejoue si la cible tombe.']},
 archer:{n:'Archer',hp:.85,atk:1.15,def:.8,spd:106,rg:1,sk:['Volée','Trois flèches sur des cibles aléatoires (90 % chacune).'],ul:['Pluie de flèches','Tous les ennemis (180 %).']},
 sorcier:{n:'Ensorceleur',hp:.8,atk:1.2,def:.8,spd:98,rg:1,sk:['Déflagration','Tous les ennemis (110 %).'],ul:['Cataclysme','Tous les ennemis (240 %).']},
 soigneur:{n:'Soigneur',hp:.95,atk:.8,def:.9,spd:102,rg:1,sk:['Soin','Soigne l’allié le plus blessé.'],ul:['Renouveau','Soigne toute l’équipe.']},
 soutien:{n:'Soutien',hp:.95,atk:.8,def:.95,spd:108,rg:1,sk:['Ralliement','L’allié le plus fort : ATQ +40 % (2 tours) et agit immédiatement.'],ul:['Hymne','Équipe : ATQ +30 % (2 tours) et +2 points de compétence.']}};
/* Kit de compétences : point d'extension pour un futur système personnalité → compétences.
   kit(c) renvoie {sk:[nom,desc], ul:[nom,desc]} ; par défaut celui de la classe, surchargeable par c.kit ou par KITS_PERS[c.pers]/KITS_SUB[c.sub]. */
const KITS_PERS={},KITS_SUB={};
function kit(c){const R=ROLES[c.role]||ROLES.guerrier,C=c.cls||{},sp=C.spec&&SPECS[C.spec],hm=harmOf(c),wt=c.eq&&c.eq.arme?c.eq.arme.t:(c.mage?'grimoire':'_');
 let tid=WTECH[wt]||'tech_poing',sk=TECHN[tid],uid='role',stage=0,ul=R.ul,ulM=1,uk=ROLE_ULK[c.role];
 if(sp&&c.lv>=20&&hm){tid='tech_'+C.spec;sk=[sp.tn,sp.td]}
 if(sp&&c.lv>=35&&hm){uid=C.spec;stage=awOf(c);uk='sk_ult_'+C.spec;ul=[stage>=3?sp.un[1]:sp.un[0],stage>=3?sp.ud[3]+' (divin)':sp.ud[0]+(stage?' · '+sp.ud.slice(1,stage+1).join(' · '):'')]}else if(sp&&c.lv>=35)ulM=1.2;
 const o=Object.assign({sk,ul,tid,uid,stage,ulM,uk},KITS_PERS[c.pers]&&KITS_PERS[c.pers][c.role]||{},KITS_SUB[c.sub]&&KITS_SUB[c.sub][c.role]||{},c.kit||{});
 if(c.sig){o.uk='sk_ult_commandant';if(c.lv>=35){o.uid='jeanne';o.stage=awOf(c);o.ul=[o.stage>=3?'Ordre de l’Aube':'Ordre du commandant','Cible (320 %), équipe ATQ +25 % et bouclier 12 %.']}else{o.uid='role';o.ul=['Ordre du commandant','Cible (280 %), équipe ATQ +25 %.']}}return o}
const PERS={Altruiste:'Soins et boucliers +20 %',Ambitieux:'ATQ +10 %',Calculateur:'Critique +12 %',Impulsif:'Vitesse +8, DEF −10 %',Stoïque:'PV et DEF +12 %',Curieux:'Rupture de ténacité +30 %',Gourmand:'Récupère 5 % de PV à chaque tour',Égoïste:'Dégâts des compétences +15 % · s’isole des autres',Opportuniste:'Critique +6 %, or +10 % · apprécié de tous',Prodige:'ATQ +12 %, critique +8 %, VIT +6 · secrète',Souverain:'PV, DEF +10 %, ATQ +8 %, équipe ATQ et DEF +6 % · secrète'};
/* personnalités secrètes (docs/personnalites.md §8) : 0,01 % au tirage du héros ; 6★ invoqués seulement, 1 chance sur 10 000 */
const PSEC=['Prodige','Souverain'],PBASE=Object.keys(PERS).filter(p=>!PSEC.includes(p));
const persRoll=st=>(st||1)>=6&&Math.random()<1e-4?pick(PSEC):pick(PBASE);
const SUBS={};/* rempli plus bas depuis TRAITS */
const LN={Altruiste:['Prenez soin de vous, capitaine.','Je protégerai tout le monde.','Si quelqu’un est blessé, appelez-moi.'],Ambitieux:['Un jour, je serai le meilleur.','Aucun étage ne m’arrêtera.','Le sommet de la Tour m’attend.'],Calculateur:['Chaque pas est un calcul.','J’ai étudié leurs faiblesses.','Rien n’est laissé au hasard.'],Impulsif:['On y va ? Maintenant !','Je m’ennuie. Castagnons !','Réfléchir ? Plus tard !'],Stoïque:['…','Je tiendrai.','La patience est une arme.'],Curieux:['Que cache le dernier étage ?','Chaque étage est un monde entier !','J’ai trouvé une pierre bizarre, regarde !'],Gourmand:['Ça sent bon la soupe !','J’ai faim…','Ce soir, ragoût pour tout le monde !'],Égoïste:['Moi d’abord. Les autres suivront… ou pas.','Pourquoi partager la gloire ?','Ne compte pas sur moi pour te couvrir.'],Opportuniste:['Il y a toujours une bonne affaire à saisir.','Le hasard sourit aux audacieux !','Tu as entendu parler du trésor du 7e étage ?'],Prodige:['J’ai déjà compris comment ça marche.','Encore un étage ? Facile.','Je n’ai jamais perdu. Pas encore.'],Souverain:['Suivez-moi. Je réponds de chacun de vous.','Un roi ne recule pas.','Relevez la tête : nous sommes une couronne.']};
const RACES=[['Elfe',2],['Nain',2],['Gobelin',2],['Homme-bête',3],['Orc',3]];
/* Humain en très grande majorité ; races non humaines dès 2★ (Homme-bête et Orc dès 3★). */
function raceFor(st){if(st<2||Math.random()<.7)return'Humain';return pick(RACES.filter(r=>st>=r[1]))[0]}
/* ---------- tirage du héros (écran « Tirage » de l'intro, Tour des modifications : js/gacha.js, docs/intro.md §7) ----------
   Tirage honnête (contrairement à la roue des talents) : un palier selon p (%), puis une entrée au hasard dans le palier.
   Le palier de race (1★ → 6★) est une rareté de race, PAS les étoiles du héros (qui reste 1★). */
const GTC=['#c9d2e2','#5fd27a','#4fa8ff','#c27cff','#ffc233','#ff4df0'];
const PTIERS=[{n:'Commune',c:0,p:48,L:['Stoïque','Gourmand','Impulsif']},{n:'Peu commune',c:1,p:30,L:['Altruiste','Curieux','Ambitieux']},{n:'Rare',c:2,p:16,L:['Calculateur','Opportuniste']},{n:'Épique',c:3,p:5.99,L:['Égoïste']},{n:'Secrète',c:5,p:.01,L:['Prodige','Souverain']}];
const RTIERS=[{n:'1★',c:0,p:70,L:['Humain']},{n:'2★',c:1,p:20,L:['Nain','Elfe','Gobelin']},{n:'3★',c:2,p:8,L:['Orc','Fée']},{n:'4★',c:3,p:1,L:['Homme-bête']},{n:'5★',c:4,p:.99,L:['Dragonide','Mort-vivant']},{n:'6★',c:5,p:.01,L:['Ange','Démon']}];
function tierRoll(T){let x=Math.random()*T.reduce((a,t)=>a+t.p,0);for(const t of T){x-=t.p;if(x<0)return pick(t.L)}return T[0].L[0]}
const tierOf=(T,k)=>Math.max(0,T.findIndex(t=>t.L.includes(k)));
/* héritage racial : appliqué au héros seulement (les invocations gardent l'équilibre d'avant) ; effets dans js/talents.js */
const RACET={Humain:{d:'Polyvalent : expérience +8 %',xp:.08},Nain:{d:'Robuste : DEF +8 %, PV +4 %',def:.08,hp:.04},Elfe:{d:'Agile : VIT +4, critique +3 %',spd:4,crit:.03},Gobelin:{d:'Filou : critique +5 %, or des combats +5 %',crit:.05,gold:.05},
 Orc:{d:'Brute : ATQ +10 %, PV +5 %',atk:.1,hp:.05},Fée:{d:'Poussière féerique : VIT +6, soins reçus +15 %',spd:6,heal:.15},'Homme-bête':{d:'Instinct sauvage : ATQ +10 %, VIT +6',atk:.1,spd:6},
 Dragonide:{d:'Écailles de dragon : PV +14 %, ATQ et DEF +10 %',hp:.14,atk:.1,def:.1},'Mort-vivant':{d:'Chair morte : PV +16 %, DEF +12 %, régénère 3 % PV par tour',hp:.16,def:.12,regen:.03},
 Ange:{d:'Grâce céleste : PV, ATQ et DEF +18 % ; l’équipe récupère 3 % PV par tour',hp:.18,atk:.18,def:.18,aura:.03},Démon:{d:'Pacte infernal : ATQ +30 %, critique +10 %, vol de vie 10 %',atk:.3,crit:.1,leech:.1}};
const EAF={feu:'ardente',glace:'givrée',foudre:'foudroyante',nature:'sylvestre',sacre:'radieuse',ombre:'ténébreuse',arcane:'arcanique'};
const SLOTS={arme:'Arme',armure:'Armure',outil:'Outil / potion'},SLK=['arme','armure','outil'];
/* Objets. icon = clé stable pour ASSETS (image personnalisée) ; role = classe donnée par l'arme ; tilt = [classe, classes d'origine…] ('_' = à mains nues). */
const ITYPES={
 epee:{n:'Épée',f:1,s:'arme',role:'guerrier',b:{atk:.10},icon:'item_epee',w:10},
 hache:{n:'Hache',f:1,s:'arme',role:'guerrier',b:{atk:.15,spd:-3},icon:'item_hache',w:6},
 bouclier:{n:'Bouclier',s:'arme',role:'gardien',b:{def:.14,hp:.08},icon:'item_bouclier',w:8},
 dagues:{n:'Dagues',f:1,pl:1,s:'arme',role:'assassin',b:{atk:.08,crit:.05},icon:'item_dagues',w:8},
 arc:{n:'Arc',s:'arme',role:'archer',b:{atk:.09,crit:.03},icon:'item_arc',w:8},
 baton:{n:'Bâton',s:'arme',role:'sorcier',b:{atk:.10},icon:'item_baton',w:6},
 grimoire:{n:'Grimoire',s:'arme',role:'sorcier',b:{atk:.06,hp:.05,crit:.02},icon:'item_grimoire',w:4},
 sceptre:{n:'Sceptre',s:'arme',role:'soigneur',b:{atk:.05,hp:.08},icon:'item_sceptre',w:8},
 luth:{n:'Luth',s:'arme',role:'soutien',b:{hp:.06,spd:4},icon:'item_luth',w:8},
 lourde:{n:'Armure lourde',f:1,s:'armure',b:{def:.18,hp:.10,spd:-5},tilt:['gardien','_','guerrier'],icon:'item_armure_lourde',w:6},
 cuir:{n:'Armure de cuir',f:1,s:'armure',b:{def:.08,spd:3},icon:'item_armure_cuir',w:8},
 cape:{n:'Cape furtive',f:1,s:'armure',b:{def:.04,spd:5,crit:.03},tilt:['assassin','_','guerrier'],fx:'furtif',icon:'item_cape',w:5},
 robe:{n:'Robe de mage',f:1,s:'armure',b:{hp:.06,atk:.05},tilt:['sorcier','_'],icon:'item_robe',w:5},
 potion:{n:'Potion de soin',f:1,s:'outil',use:'soin',q:2,icon:'item_potion',w:10},
 elixir:{n:'Élixir d’énergie',s:'outil',use:'energie',q:2,icon:'item_elixir',w:5},
 torche:{n:'Torche',f:1,s:'outil',fx:'lumiere',icon:'item_torche',w:6},
 pioche:{n:'Pioche',f:1,s:'outil',fx:'creuser',icon:'item_pioche',w:5},
 cle:{n:'Passe-partout',s:'outil',fx:'crocheter',icon:'item_cle',w:4},
 boussole:{n:'Boussole',f:1,s:'outil',fx:'carte',icon:'item_boussole',w:4},
 sablier:{n:'Sablier de poche',s:'outil',fx:'temps',icon:'item_sablier',w:3},
 relique:{n:'Relique sacrée',f:1,s:'outil',b:{hp:.05},tilt:['soigneur','_','sorcier','guerrier'],icon:'item_relique',w:3},
 etendard:{n:'Étendard',s:'outil',b:{atk:.04},tilt:['soutien','_','guerrier','gardien'],icon:'item_etendard',w:3}};
const FXD={furtif:'Patrouilles : repéré deux fois moins loin',lumiere:'Ténèbres : éclaire bien plus loin, ne rate jamais',creuser:'Extrait les veines de cristal, double bois et pierre',crocheter:'Ouvre coffres verrouillés et portes à leviers',carte:'Révèle sceaux, leviers et porte sur la carte',temps:'Loi du sablier : +60 s'};
const ROLE_W={guerrier:'epee',gardien:'bouclier',assassin:'dagues',archer:'arc',sorcier:'baton',soigneur:'sceptre',soutien:'luth'};
const NOMS=['Aldric','Brienne','Corentin','Dahlia','Eloïse','Fenris','Gwenn','Hadrien','Iseult','Joran','Kaelis','Lyanna','Mordal','Nolwenn','Osric','Perrine','Quentin','Roxane','Sören','Thaïs','Ulric','Vaelis','Wilfrid','Yseult','Armel','Bérénice','Cyprien','Éloi','Maëlle','Tugdual'];
const DOM=['Arcanique','Naturelle','Élémentaire','Sacrée','Obscure','Temporelle'];
const BLD={auberge:{n:'Auberge',d:'Recrutement et capacité d’accueil.',c:[60,30],col:'#c0453a'},ferme:{n:'Ferme',d:'Produit des vivres à récolter.',c:[50,20],col:'#5a9a3a'},camp:{n:'Camp d’entraînement',d:'Entraîne les personnages contre des vivres.',c:[70,50],col:'#d08a2a'},inf:{n:'Infirmerie',d:'Soigne les blessés, réduit le risque de mort.',c:[60,60],col:'#3fb0a0'},forge:{n:'Forge',d:'Fabrique, affine, renforce et éveille l’équipement.',c:[40,90],col:'#5a5f78'}};
const RES={food:['Vivres','#d9794a'],wood:['Bois','#a9744a'],stone:['Pierre','#a9a6b8'],gold:['Or','#ffcf4a'],shard:['Éclats','#ff7ad9']};
const MECH={serviteurs:['Serviteurs','Invoque des serviteurs ; presque invulnérable tant qu’ils vivent.'],metamorphose:['Métamorphose','Sous 50 % de PV, change de forme : plus rapide, plus fort, nouvelles faiblesses.'],miroir:['Miroir','Renvoie 30 % des dégâts des compétences et des ultimes.'],charge:['Charge dévastatrice','Prépare une attaque de zone : brisez sa ténacité pour l’annuler.'],enrage:['Rage croissante','Son attaque augmente à chaque tour.'],cristaux:['Cristaux nourriciers','Deux cristaux le soignent à chaque tour tant qu’ils existent.'],zones:['Arène brisée','Fissure le sol sous un combattant, puis l’écrase au tour suivant : la Défense divise le choc par trois.']};
const E0={slime:{n:'Gelée',spd:84,hp:1.1,atk:.9},loup:{n:'Loup',spd:112,hp:.85,atk:1.1},squelette:{n:'Squelette',spd:96,hp:1,atk:1},golem:{n:'Golem',spd:76,hp:1.5,atk:1.15},spectre:{n:'Spectre',spd:104,hp:.8,atk:1.2,rg:1},champi:{n:'Sporion',spd:88,hp:1.2,atk:.85,rg:1},chacal:{n:'Chacal',spd:108,hp:.95,atk:1.15},cristal:{n:'Cristal nourricier',spd:90,hp:.9,atk:0}};
const KM={norm:{hp:1,atk:1,t:30},minion:{hp:.5,atk:.7,t:20},elite:{hp:2.6,atk:1.3,t:60},mini:{hp:4.5,atk:1.5,t:90},boss:{hp:7.5,atk:1.7,t:120},obj:{hp:1.2,atk:0,t:0}};
const BIOMES=[
 {k:'foret',n:'Forêt d’émeraude',g:['#58a650','#62b058','#4f9c48'],sp:['#458c40','#7cc468'],blk:['#2a5c36','#234e2e'],obs:[['tree','#3f9a4c'],['tree','#2f8642'],['tree','#4aa856'],['bush','#4aa856'],['rock','#8f958f']],deco:['#ffe066','#ff8fb3','#ffffff'],sky:['#d6f2e6','#a8dccd','#74b9a2'],dark:0,part:'#bfe86a',mon:['loup','champi','slime','chacal'],el:['nature','foudre','ombre'],res:'wood'},
 {k:'desert',n:'Désert d’ocre',g:['#e3c070','#ecca7c','#d9b464'],sp:['#c9a252','#f6dc9a'],blk:['#b98a4a','#a87a3e'],obs:[['cactus','#4f9a5a'],['rock','#c79a5e'],['rock','#b98850'],['dead','#8a6a4a']],deco:['#fff2c0','#d98a4a','#c9a252'],sky:['#fff0c0','#f7cf8a','#e0a060'],dark:0,part:'#f6e2a8',mon:['squelette','chacal','golem','slime'],el:['feu','sacre','foudre'],res:'stone'},
 {k:'givre',n:'Toundra de givre',g:['#e6f1fa','#dae9f5','#f2f8fd'],sp:['#c2d8ea','#ffffff'],blk:['#9fbfd6','#8fb1ca'],obs:[['pine','#3f7f72'],['pine','#4a8f80'],['rock','#a9c6dc'],['crystal','#bfe8ff']],deco:['#bfe6ff','#ffffff','#9fc8e6'],sky:['#eef6ff','#cfe2f5','#a8c4e0'],dark:0,part:'#ffffff',mon:['loup','spectre','golem','slime'],el:['glace','arcane','ombre'],res:'wood'},
 {k:'cendre',n:'Forge de cendres',g:['#4c3c3c','#564442','#423434'],sp:['#3a2c2c','#6a5450'],blk:['#e85a1a','#ff8a2a'],obs:[['rock','#3a2e2e'],['stal','#4a3838'],['crystal','#ff8a3a'],['dead','#2a2020']],deco:['#ff8a3a','#ffcf4a','#6a5450'],sky:['#5a2420','#3a1818','#201010'],dark:.42,part:'#ffb04a',mon:['golem','slime','spectre','squelette'],el:['feu','ombre','foudre'],res:'stone'},
 {k:'ruines',n:'Ruines oubliées',g:['#9a96a8','#a5a1b3','#8f8b9d'],sp:['#7f7b90','#bcb8c8'],blk:['#4a4660','#403c56'],obs:[['pillar','#b3aec4'],['pillarb','#b3aec4'],['rock','#7a768c'],['tree','#5f8f6a']],deco:['#6fdc6f','#c58bff','#7f7b90'],sky:['#dcd8f0','#b9b4d6','#8f8ab4'],dark:0,part:'#e0dcf5',mon:['squelette','spectre','champi','chacal'],el:['sacre','ombre','arcane'],res:'stone'},
 {k:'cristal',n:'Cavernes de cristal',g:['#4a3a7a','#54428a','#40326c'],sp:['#34285a','#6a58a8'],blk:['#1c1236','#160e2c'],obs:[['crystal','#ff7ad9'],['crystal','#7ad9ff'],['crystal','#c58bff'],['rock','#3a2c5e'],['stal','#3a2c5e']],deco:['#ff7ad9','#7ad9ff','#6a58a8'],sky:['#4a3a8a','#2a1c5a','#160e30'],dark:.5,part:'#ff9ae6',mon:['slime','spectre','golem','champi'],el:['arcane','glace','foudre'],res:'stone'}];
/* Lois de la Tour : chaque bloc de 5 étages a un biome fixe et une loi d'exploration + combat. */
const LAWS={
 traque:{n:'Loi de la traque',s:'◉',tool:'cape',e:'Des patrouilles arpentent l’étage. Elles ne voient que ce qui bouge : restez immobile quand elles approchent. Une Cape furtive réduit leur vue de moitié.',c:'Repéré, vous subissez une embuscade (l’ennemi a l’initiative). Frappez le premier : avantage et +50 % d’expérience.'},
 sablier:{n:'Loi du sablier',s:'⧗',tool:'sablier',e:'Le temps est compté. Ramassez les sabliers (+25 s). Le temps écoulé, la tempête de sable ronge l’équipe et les monstres s’enragent.',c:'Chaque tour de combat consomme 2 s du sablier ; chaque victoire en rend 10.'},
 gel:{n:'Loi du gel',s:'❄',e:'Aucun soin : les feux de camp sont gelés, les prières restent muettes. En échange, tout le butin est doublé.',c:'Potions figées, pas de récupération ; les soins se figent en boucliers de glace (60 %).'},
 tenebres:{n:'Loi des ténèbres',s:'☾',tool:'torche',e:'L’obscurité est presque totale. Allumez les braseros pour éclairer l’étage ; une Torche porte la lumière plus loin.',c:'On se bat à tâtons : 20 % des attaques ratent, sauf celles de Feu ou de Sacré et celles d’un porteur de torche.'},
 verrous:{n:'Loi des verrous',s:'⚿',tool:'cle',e:'Pas de sceaux : trois leviers runiques ouvrent la porte, dans l’ordre gravé sur la stèle près de l’entrée. Une erreur les réarme. Un Passe-partout force la porte.',c:'Les ennemis sont liés à une rune : seul son élément les blesse pleinement (sinon −40 % de dégâts).'},
 prisme:{n:'Loi du prisme',s:'◈',e:'Des prismes accordent le champ élémentaire : touchez celui de votre élément avant d’affronter le gardien.',c:'Le champ change tous les trois tours : l’élément favorisé inflige +50 % de dégâts et brise deux fois plus vite.'},
 duel:{n:'Loi du duel',s:'⚔',e:'Seuls les deux premiers membres de l’équipe entrent dans l’étage.',c:'Les ennemis se présentent un par un. L’énergie d’ultime monte 50 % plus vite ; expérience +50 %.'},
 orage:{n:'Loi de l’orage',s:'ϟ',e:'La foudre frappe au hasard : esquivez les cercles qui s’illuminent au sol.',c:'Le temps change tous les quatre tours : vent arrière (vous agissez plus tôt), vent contraire (l’ennemi aussi), orage (la Foudre agit aussitôt et frappe +30 %).'}};
const LAWK=Object.keys(LAWS),RUNE=['☼','☾','★'],WXN={arriere:'Vent arrière',contraire:'Vent contraire',orage:'Orage'};
const blockOf=f=>Math.floor((f-1)/5),lawOf=f=>LAWK[blockOf(f)%LAWK.length],biomeOf=f=>BIOMES[blockOf(f)%BIOMES.length],lawLv=f=>1+Math.floor(blockOf(f)/LAWK.length);
const fmtT=t=>{t=Math.max(0,Math.ceil(t));return Math.floor(t/60)+':'+String(t%60).padStart(2,'0')};
const QUESTS={gardes:'Chaque sceau est gardé par un champion',vagues:'Survivre à trois vagues',proteger:'Protéger le cristal-phare pendant 8 tours',ordre:'Détruire les trois pylônes dans l’ordre (I, II, III)',choix:'Un pacte vous sera proposé avant le combat'};
/* ================= TALENTS DU HÉROS (docs/intro.md) =================
   c.tal : trait inné unique du héros (distinct des compétences), tiré à la roue des talents de l'intro.
   La roue est truquée « comme par hasard » : le résultat est toujours rare ou mieux (rare 62 %, épique 30 %, légendaire 8 %).
   magie:1 = aptitude à la magie : seul un tel talent ouvre au héros les classes magiques (bâton, grimoire, sceptre). Environ 1 tirage sur 3. */
const TALENTS={
 debutant:{n:'Chance du débutant',r:0,d:'Tant que le héros est sous le niveau 10 : critique +10 %.',ic:['..X.X..','.XXXXX.','XXXXXXX','.XXXXX.','..XXX..','...X...','..X....']},
 endurant:{n:'Endurance de gamer',r:0,d:'Des années de nuits blanches : PV du héros +10 %.',ic:['.......','XXXXX..','XXXXXXX','XXXXX.X','XXXXXXX','XXXXX..','.XXX...']},
 reflexes:{n:'Réflexes de joueur',r:1,d:'VIT +8, et le héros agit plus tôt au début de chaque combat.',ic:['X..X...','.X..X..','..X..X.','...X..X','..X..X.','.X..X..','X..X...']},
 poche:{n:'Inventaire infini',r:1,d:'Auberge : +3 places d’accueil. 20 % de chances de doubler les ingrédients gagnés en combat.',ic:['.XXXXX.','XXXXXXX','X..X..X','XXXXXXX','X.....X','X.....X','XXXXXXX']},
 eclair:{n:'Apprentissage éclair',r:2,magie:1,d:'Expérience gagnée par le héros ×1,5.',ic:['...XXX.','..XXX..','.XXX...','XXXXXX.','...XXX.','..XX...','.X.....']},
 charisme:{n:'Charisme de héros',r:2,d:'Les liens avec le héros se renforcent deux fois plus vite et se dégradent deux fois moins. Premières impressions +10.',ic:['.XX.XX.','XXXXXXX','XXXXXXX','XXXXXXX','.XXXXX.','..XXX..','...X...']},
 armes:{n:'Maître d’armes',r:2,d:'Maîtrise toutes les armes : bonus de l’arme équipée ×1,5 et critique +5 %.',ic:['X.....X','.X...X.','..X.X..','...X...','..X.X..','XX...XX','XX...XX']},
 souffle:{n:'Second souffle',r:2,d:'Une fois par combat, sous 30 % de PV : récupère 35 % de ses PV et 30 d’énergie.',ic:['..XXX..','..XXX..','XXXXXXX','XXXXXXX','XXXXXXX','..XXX..','..XXX..']},
 oeil:{n:'Œil du joueur',r:3,magie:1,d:'Voit l’interface cachée : PV, ATQ, DEF, VIT, ténacité et ordre de passage exacts des ennemis, mécaniques détaillées, probabilités exactes de l’Auberge.',ic:['.......','..XXX..','.XX.XX.','XX.X.XX','.XX.XX.','..XXX..','.......']},
 gacha:{n:'Gacha béni',r:3,d:'Invocations : chances de 3★ et plus ×1,5, et un 3★ garanti au plus tard à la 30e invocation sans 3★ (compteur de pitié).',ic:['...X...','...X...','XXXXXXX','.XXXXX.','..XXX..','.XX.XX.','X.....X']},
 sauvegarde:{n:'Sauvegarde rapide',r:4,magie:1,d:'Une fois par expédition dans la Tour, un coup fatal « recharge la sauvegarde » : le héros revient à 40 % de ses PV.',ic:['XXXXXX.','X.XX.XX','X.XX..X','XXXXXXX','X.....X','X.....X','XXXXXXX']},
 protag:{n:'Aura de protagoniste',r:4,d:'PV, ATQ et DEF du héros +15 % ; toute l’équipe qu’il accompagne gagne ATQ +5 %.',ic:['X..X..X','XX.X.XX','XXXXXXX','XXXXXXX','X.X.X.X','XXXXXXX','.......']}};
const TALK=Object.keys(TALENTS);
/* tirage truqué de la roue : jamais commune ni peu commune */
function talentRoll(){const x=Math.random()*100,r=x<8?4:x<38?3:2;return pick(TALK.filter(k=>TALENTS[k].r==r))}
const heroOf=()=>G&&G.chars?G.chars.find(c=>c.hero):null;
function hasTal(k){const h=heroOf();return!!h&&h.tal==k}
/* médaillon de talent (pixel art 24×24, icône 7×7 de TALENTS[k].ic) */
function talBadge(k){const T=TALENTS[k],c=mkc(24,24),x=c.getContext('2d'),col=RARC[T.r],R=(a,b,w,h,f)=>{x.fillStyle=f;x.fillRect(a,b,w,h)};
 for(let y=0;y<24;y++)for(let i=0;i<24;i++){const d=Math.hypot(i-11.5,y-11.5);if(d<11.5)R(i,y,1,1,d>10.4?OLC:d>9?sh(col,-.35):(i+y<20?sh(col,.3):col))}
 R(6,5,3,1,'rgba(255,255,255,.7)');R(5,6,1,3,'rgba(255,255,255,.7)');
 T.ic.forEach((row,j)=>[...row].forEach((ch,i)=>{if(ch=='X'){R(5+i*2+1,5+j*2+1,2,2,'rgba(0,0,0,.35)');R(5+i*2,5+j*2,2,2,T.r>=4?'#fff6c0':'#fff')}}));return c}
const talTag=c=>c&&c.tal&&TALENTS[c.tal]?`<span class="tg" style="border-color:${RARC[TALENTS[c.tal].r]};color:${RARC[TALENTS[c.tal].r]}" title="${TALENTS[c.tal].d}">✦ ${TALENTS[c.tal].n}</span>`:'';
function talH(c){const T=TALENTS[c.tal];if(!T)return'<p class="m">Aucun talent.</p>';return`<div class="skr" style="--rc:${RARC[T.r]}"><img src="${scaleC(talBadge(c.tal),2).toDataURL()}" alt="" style="width:40px;height:40px;image-rendering:pixelated"><div class="gr"><b style="color:${RARC[T.r]}">${T.n}</b> <span class="tg">talent inné</span> <span class="m">${RARN[T.r]}</span><div class="m">${T.d}</div><div class="m">${T.magie?'<b style="color:#c58bff">✦ Aptitude à la magie</b> : bâtons, grimoires et sceptres autorisés.':'Sans aptitude à la magie : bâtons, grimoires et sceptres interdits au héros.'}</div></div></div>`}
/* Inventaire infini : double parfois les ingrédients d’un combat */
function pocheX(o){if(hasTal('poche')&&Math.random()<.2)for(const k in o)o[k]*=2;return o}
