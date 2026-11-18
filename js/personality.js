'use strict';
/* ================= PERSONNALITÉS, COMPÉTENCES, PROGRESSION, RELATIONS (docs/personnalites.md) =================
   c.pers : personnalité principale · c.subs : 1 à 3 sous-traits (c.sub = le premier, pour les anciens points d'extension)
   c.gr : profil de croissance propre (stats par niveau, vitesse d'exp., paliers) · c.skills : [{id,lv,r}] · G.rel : relations par paire */
const FAM={soutien:{n:'Soutien',c:'#ffcf4a'},soin:{n:'Soin',c:'#5fe07a'},protection:{n:'Protection',c:'#bfe8ff'},degats:{n:'Dégâts',c:'#ff5a5a'},controle:{n:'Contrôle',c:'#c58bff'},defense:{n:'Défense',c:'#a9a6b8'},chance:{n:'Chance et butin',c:'#4de0c0'},decouverte:{n:'Découverte',c:'#6fd3ff'},cuisine:{n:'Cuisine',c:'#e8945a'},celerite:{n:'Célérité',c:'#ff9a3a'}},FK=Object.keys(FAM);
const RARN=['Commune','Peu commune','Rare','Épique','Légendaire'],RARC=['#c9d2e2','#5fd27a','#4fa8ff','#c27cff','#ffc233'],RARW=[50,28,14,6,2];
/* sous-traits (bible §6) : [personnalité d'origine, familles favorisées (poids moyen), sociabilité] */
const TRAITS={Protecteur:['Altruiste',{protection:2,defense:1},.1],Compatissant:['Altruiste',{soin:2},.15],Dévoué:['Altruiste',{soutien:2,protection:1},.1],Généreux:['Altruiste',{soutien:2,chance:1},.2],Loyal:['Altruiste',{protection:2,soutien:1},.2],Empathique:['Altruiste',{soin:2,soutien:1},.2],
 Compétitif:['Ambitieux',{degats:2,celerite:1},-.05],Orgueilleux:['Ambitieux',{degats:2},-.15],Déterminé:['Ambitieux',{degats:1,defense:1},0],
 Stratège:['Calculateur',{controle:2,soutien:1},0],Prudent:['Calculateur',{defense:2},0],Manipulateur:['Calculateur',{controle:2,chance:1},-.1],Méthodique:['Calculateur',{controle:1,decouverte:1},0],
 Téméraire:['Impulsif',{degats:2,celerite:1},0],Colérique:['Impulsif',{degats:2},-.25],Spontané:['Impulsif',{celerite:2},.1],Courageux:['Impulsif',{protection:1,degats:1},.05],
 Patient:['Stoïque',{defense:1,controle:1},.05],Froid:['Stoïque',{controle:1,degats:1},-.15],Résistant:['Stoïque',{defense:2},0],Discipliné:['Stoïque',{defense:1,soutien:1},0],
 Chercheur:['Curieux',{decouverte:2},0],Explorateur:['Curieux',{decouverte:1,chance:1},.05],Inventif:['Curieux',{decouverte:1,controle:1},0],Observateur:['Curieux',{controle:1,chance:1},0],
 Gourmet:['Gourmand',{cuisine:2},.05],Glouton:['Gourmand',{cuisine:1,defense:1},0],Cuisinier:['Gourmand',{cuisine:2,soin:1},.15],Épicurien:['Gourmand',{cuisine:1,chance:1},.1],
 Vaniteux:['Égoïste',{degats:2},-.2],Avare:['Égoïste',{chance:2},-.15],Cynique:['Égoïste',{controle:1,degats:1},-.2],Solitaire:['Égoïste',{degats:1,celerite:1},-.3],
 Rusé:['Opportuniste',{chance:1,controle:1},0],Chanceux:['Opportuniste',{chance:2},.05],Charmeur:['Opportuniste',{soutien:1,chance:1},.3],Débrouillard:['Opportuniste',{chance:1,decouverte:1},.05]};
for(const p in PERS)SUBS[p]=Object.keys(TRAITS).filter(t=>TRAITS[t][0]==p);
/* poids forts de la personnalité principale (toutes les familles gardent un poids de base 1 : jamais de garantie) */
const PFW={Altruiste:{soutien:6,soin:5,protection:5,defense:1},Ambitieux:{degats:6,celerite:2,soutien:1,chance:1},Calculateur:{controle:6,degats:2,chance:2,decouverte:1},Impulsif:{celerite:6,degats:4},Stoïque:{defense:6,protection:3,soin:1},Curieux:{decouverte:6,controle:2,chance:1,cuisine:1},Gourmand:{cuisine:6,soin:2,defense:1},Égoïste:{degats:7,celerite:2,controle:1},Opportuniste:{chance:7,degats:2,celerite:1}};
const RACEW={Humain:{soutien:.4},Elfe:{soin:.6,decouverte:.6},Nain:{defense:.6,cuisine:.6},Gobelin:{chance:.8},'Homme-bête':{celerite:.8},Orc:{degats:.8}};
const ROLEF={guerrier:'degats',gardien:'protection',assassin:'celerite',archer:'degats',sorcier:'controle',soigneur:'soin',soutien:'soutien'};
/* combinaisons (bible §6.1) : personnalité principale + sous-trait (ou sous-trait issu de l'autre personnalité) → bonus de pondération */
const COMBOS=[['Altruiste','Loyal',{protection:4},'Protection durable'],['Altruiste','Empathique',{soin:4},'Soin et soutien'],['Altruiste','Impulsif',{protection:3,celerite:1},'Sacrifice immédiat'],['Altruiste','Calculateur',{protection:2,controle:2},'Protection stratégique'],['Altruiste','Ambitieux',{soutien:4},'Chef protecteur'],['Stoïque','Calculateur',{defense:2,controle:2},'Défense tactique'],['Impulsif','Ambitieux',{degats:4},'Attaques agressives'],['Curieux','Calculateur',{decouverte:4},'Recherche et invention'],['Gourmand','Curieux',{cuisine:4},'Cuisine expérimentale'],['Égoïste','Opportuniste',{chance:2,degats:2},'Profiteur sans scrupules'],['Opportuniste','Curieux',{chance:2,decouverte:2},'Chasseur de trésors']];
/* profil de croissance : écarts par personnalité (additifs) ; les familles des sous-traits ajoutent un peu à la stat associée */
const PG={Altruiste:{hp:.1,def:.05,atk:-.1},Ambitieux:{atk:.15,hp:-.05,xp:.12},Calculateur:{crit:.002,def:-.05,lc:.1},Impulsif:{spd:.25,atk:.08,def:-.12,xp:.05},Stoïque:{hp:.18,def:.18,atk:-.1,spd:-.08,xp:-.1,ms:1,lc:.13},Curieux:{xp:.2,ms:-1,lc:-.07,hp:-.03,atk:-.03},Gourmand:{hp:.2,spd:-.05,atk:-.05,def:.03},Égoïste:{atk:.22,hp:-.08,def:-.08,lc:-.05},Opportuniste:{crit:.003,spd:.08,xp:.05,lc:.05}};
const FG={soutien:'hp',soin:'hp',protection:'def',degats:'atk',controle:'crit',defense:'def',chance:'crit',decouverte:'xp',cuisine:'hp',celerite:'spd'},GSC={hp:.03,atk:.03,def:.03,xp:.03,spd:.04,crit:.0005};
const OPPT={Altruiste:'Égoïste',Égoïste:'Altruiste'};
function rollSubs(pers,st){let n=1;if(Math.random()<.2+.1*st){n++;if(Math.random()<.06*st)n++}const out=[];let k=0;
 while(out.length<n&&k++<60){const own=Math.random()<.7,pool=own?SUBS[pers]:Object.keys(TRAITS).filter(t=>TRAITS[t][0]!=pers&&TRAITS[t][0]!=OPPT[pers]),t=pick(pool);if(t&&!out.includes(t))out.push(t)}return out}
function genGrowth(c){const g={hp:1,atk:1,def:1,spd:.1,crit:.001,xp:1,ms:5,lc:.75},P=PG[c.pers]||{};for(const k in P)g[k]+=P[k];
 (c.subs||[]).forEach(s=>{const T=TRAITS[s];if(T)for(const f in T[1])g[FG[f]]+=GSC[FG[f]]*T[1][f]});
 ['hp','atk','def','xp'].forEach(k=>g[k]=+clamp(g[k]+rnd(-.06,.06),.75,1.4).toFixed(3));g.spd=+clamp(g.spd+rnd(-.05,.05),0,.5).toFixed(3);g.crit=+clamp(g.crit+rnd(-.0005,.0005),0,.006).toFixed(4);g.lc=+clamp(g.lc+.05*Math.max(0,3-(c.st||1))+rnd(-.04,.04),.55,.95).toFixed(2);return g}/* 1★ et 2★ apprennent un peu plus souvent : la personnalité les garde utiles */
const GR0={hp:1,atk:1,def:1,spd:.1,crit:.001,xp:1,ms:5,lc:.75};
const hasT=(c,x)=>(c.subs||[]).includes(x)||(c.subs||[]).some(s=>TRAITS[s]&&TRAITS[s][0]==x);
const combosOf=c=>COMBOS.filter(([a,b])=>(c.pers==a&&hasT(c,b))||(c.pers==b&&hasT(c,a)));
function famW(c){const w={};FK.forEach(f=>w[f]=1);const add=o=>{for(const f in o||{})w[f]+=o[f]};add(PFW[c.pers]);(c.subs||[]).forEach(s=>TRAITS[s]&&add(TRAITS[s][1]));add(RACEW[c.race]);combosOf(c).forEach(x=>add(x[2]));const rf=ROLEF[c.role];if(rf)w[rf]+=.1*c.st;return w}
function famPct(c){const w=famW(c),t=FK.reduce((a,f)=>a+w[f],0);return FK.map(f=>[f,w[f]/t]).sort((a,b)=>b[1]-a[1])}
/* ---------- réserve de compétences ----------
   a:1 active (utilisable en combat, coûte 1 point de compétence, recharge cd tours) · sinon passive. r : rareté d'origine.
   P = puissance (niveau de compétence et évolution de rareté). dp : empêche la mort → très rare et limité. */
const pc=v=>Math.round(v*100)+' %',bfv=(u,k)=>u.bf&&u.bf[k]?u.bf[k].v:0;
const lowA=(ex)=>allies().filter(a=>a!=ex).sort((x,y)=>x.hp/x.mhp-y.hp/y.mhp)[0],ratioLow=()=>{const a=lowA();return a?a.hp/a.mhp:1},rgU=u=>ROLES[u.c.role].rg;
async function hitS(u,m,tb,o){const t=tgt();if(!t)return null;await hitAnim(u,t,()=>deal(u,t,m,tb,o),rgU(u));return t}
async function aoeS(u,m,tb,o){await cast(u);foes().forEach((e,i)=>fxOn('fx_blast',e,{delay:i*.05}));await wave(u,ELEMS[u.elem].c);foes().forEach(e=>deal(u,e,m,tb,o));await sleep(260)}
async function buffS(u,list,k,v,t,txt,col){await cast(u,col||'#ffcf4a');list.forEach(a=>{bfT(u,a,k,v,t);fl(a,txt,'buf');fxOn('fx_buff',a)});await sleep(220)}
const noBuff=k=>allies().filter(a=>!a.bf[k]).length;
const SKILLS={
 /* soutien */
 cri:{n:'Cri de ralliement',f:'soutien',a:1,r:0,cd:2,d:P=>`Équipe : ATQ +${pc(.15*P)} (2 tours).`,run:(u,P)=>buffS(u,allies(),'atk',.15*P,2,'ATQ +'+pc(.15*P)),ai:u=>noBuff('atk')>=2?4.5:0},
 inspir:{n:'Inspiration',f:'soutien',a:1,r:1,cd:3,d:P=>`+2 points de compétence ; l’allié le plus proche de son ultime gagne ${Math.round(25*P)} d’énergie.`,run:async(u,P)=>{await cast(u,'#ffcf4a');setSP(2);const a=allies().filter(x=>x.en<100).sort((x,y)=>y.en-x.en)[0];if(a){gainEn(a,25*P);fl(a,'ÉNERGIE','buf')}await sleep(200)},ai:u=>B.sp<=2?5:2},
 donabs:{n:'Don absolu',f:'soutien',a:1,r:2,cd:3,d:P=>`Sacrifie 20 % de ses PV : l’allié le plus blessé récupère ${pc(.35*P)} de ses PV et 30 d’énergie.`,run:async(u,P)=>{const a=lowA(u)||u;await cast(u,'#ff9a9a');u.hp=Math.max(1,u.hp-u.mhp*.2);fl(u,'DON','deb');heal(a,a.mhp*.35*P,u);gainEn(a,30);await sleep(220)},ai:u=>{const a=lowA(u);return a&&a.hp<a.mhp*.45&&u.hp>u.mhp*.5?7:0}},
 aura:{n:'Aura bienveillante',f:'soutien',r:0,d:P=>`Début de combat : ATQ de toute l’équipe +${pc(.05*P)}.`},
 miroir:{n:'Miroir empathique',f:'soutien',r:3,d:P=>`À chacun de ses tours, réagit à l’état de l’équipe : soigne de ${pc(.08*P)} un allié sous 40 % PV, sinon donne 15 d’énergie à l’allié qui en a le moins.`},
 chef:{n:'Chef de file',f:'soutien',r:2,d:P=>`Début de combat : +1 point de compétence et VIT de l’équipe +${Math.round(4*P)}.`},
 /* soin */
 premsoins:{n:'Premiers soins',f:'soin',a:1,r:0,cd:1,d:P=>`Soigne l’allié le plus blessé (${pc(.9*P)} de l’ATQ + ${pc(.06*P)} de ses PV max).`,run:async(u,P)=>{await cast(u,'#5fe07a');const a=lowA();heal(a,u.atk*.9*P+a.mhp*.06*P,u);await sleep(220)},ai:u=>{const r=ratioLow();return r<.5?7:r<.7?4.5:0}},
 rosee:{n:'Rosée apaisante',f:'soin',a:1,r:1,cd:3,d:P=>`Soigne toute l’équipe (${pc(.5*P)} de l’ATQ + 4 % des PV max).`,run:async(u,P)=>{await cast(u,'#5fe07a');allies().forEach(a=>heal(a,u.atk*.5*P+a.mhp*.04,u));await sleep(240)},ai:u=>{const n=allies().filter(a=>a.hp<a.mhp*.75).length;return n>=2?3+n*1.5:0}},
 regen:{n:'Régénération',f:'soin',r:0,d:P=>`Récupère ${pc(.04*P)} de ses PV à chacun de ses tours.`},
 bened:{n:'Bénédiction',f:'soin',r:2,d:P=>`Soins et boucliers prodigués +${pc(.2*P)}.`},
 souffle:{n:'Souffle de vie',f:'soin',a:1,r:3,cd:4,d:P=>`Soigne toute l’équipe de ${pc(.15*P)} de ses PV max et la couvre d’un léger bouclier.`,run:async(u,P)=>{await cast(u,'#5fe07a');allies().forEach(a=>{heal(a,a.mhp*.15*P,u);if(B.law!='gel'){a.sh=Math.max(a.sh,Math.round(a.mhp*.06*P));a.sht=3}});await sleep(260)},ai:u=>{const n=allies().filter(a=>a.hp<a.mhp*.65).length;return n>=2?5+n:0}},
 rappel:{n:'Rappel des étoiles',f:'soin',a:1,r:4,cd:99,dp:1,d:P=>`Une seule fois par combat : relève un allié à terre avec ${pc(Math.min(.5,.3*P))} de ses PV. Contrepartie : le lanceur perd 20 % de ses PV et toute son énergie.`,run:async(u,P)=>{const a=B.A.find(x=>!x.alive);await cast(u,'#fff3a0');if(a){a.alive=true;a.hp=Math.round(a.mhp*Math.min(.5,.3*P));a.av=1e4/a.spd;fl(a,'RELEVÉ !','brk');say(a.n+' se relève, porté par les étoiles !')}u.hp=Math.max(1,u.hp-u.mhp*.2);u.en=0;drawTL();await sleep(300)},ai:u=>B.A.some(x=>!x.alive)?10:-1},
 /* protection */
 egide:{n:'Égide',f:'protection',a:1,r:0,cd:1,d:P=>`Bouclier sur l’allié le plus blessé (${pc(1.2*P)} de la DEF + ${pc(.08*P)} de ses PV max).`,run:async(u,P)=>{await cast(u,'#bfe8ff');const a=lowA();addSh(a,u.def*1.2*P+a.mhp*.08*P,u);await sleep(220)},ai:u=>{const a=lowA();return a&&a.sh<=0&&a.hp<a.mhp*.6?6:0}},
 murviv:{n:'Mur vivant',f:'protection',a:1,r:1,cd:3,d:P=>`Provoque les ennemis (2 tours) et DEF +${pc(.3*P)}.`,run:async(u,P)=>{u.taunt=2;await buffS(u,[u],'def',.3*P,2,'PROVOCATION','#bfe8ff')},ai:u=>!u.taunt&&u.hp>u.mhp*.55&&allies().some(a=>a!=u&&a.hp<a.mhp*.5)?6:0},
 garde:{n:'Garde rapprochée',f:'protection',r:0,d:P=>`Début de combat : l’allié le plus fragile reçoit un bouclier de ${pc(.12*P)} de ses PV max.`},
 coeur:{n:'Cœur sacrificiel',f:'protection',r:2,d:P=>`Prend à sa charge ${pc(Math.min(.5,.25*P))} des dégâts destinés à ses alliés, tant qu’il garde plus de 30 % de ses PV.`},
 promesse:{n:'Promesse inviolable',f:'protection',a:1,r:3,cd:4,d:P=>`L’allié le plus fragile : bouclier (${pc(.2*P)} de ses PV max) et dégâts subis −40 % pendant 3 tours.`,run:async(u,P)=>{const a=lowA();await cast(u,'#bfe8ff');addSh(a,a.mhp*.2*P,u);a.bf.dr={v:.4,t:3};fl(a,'PROMESSE','buf');await sleep(240)},ai:u=>ratioLow()<.55?7:0},
 dernier:{n:'Dernier souffle',f:'protection',r:3,dp:1,d:P=>`Une fois par combat, empêche un coup fatal sur un allié (il reste à 1 PV). Contrepartie : le lanceur perd 25 % de ses PV.`},
 /* dégâts */
 frappe:{n:'Frappe puissante',f:'degats',a:1,r:0,cd:1,d:P=>`Cible unique (${pc(2*P)}).`,run:(u,P)=>hitS(u,2*P,20),ai:u=>4},
 tourb:{n:'Tourbillon',f:'degats',a:1,r:1,cd:2,d:P=>`Tous les ennemis (${pc(.9*P)}).`,run:(u,P)=>aoeS(u,.9*P,10),ai:u=>foes().length>=2?2+1.5*foes().length:0},
 grace:{n:'Coup de grâce',f:'degats',a:1,r:2,cd:2,d:P=>`Cible (${pc(1.6*P)}) ; dégâts doublés si elle a moins de 40 % de PV.`,run:(u,P)=>hitS(u,1.6*P,20,{exec:1}),ai:u=>{const t=tgt();return t&&t.hp<t.mhp*.4?7:3}},
 brute:{n:'Force brute',f:'degats',r:0,d:P=>`ATQ +${pc(.08*P)}.`},
 gloire:{n:'Soif de gloire',f:'degats',r:1,d:P=>`Chaque ennemi vaincu : dégâts +${pc(.1*P)} jusqu’à la fin du combat (3 fois au plus).`},
 meteore:{n:'Frappe météore',f:'degats',a:1,r:3,cd:3,d:P=>`Cible (${pc(3.4*P)}) en ignorant 40 % de sa DEF.`,run:(u,P)=>hitS(u,3.4*P,30,{ign:.4}),ai:u=>6},
 lame:{n:'Lame des étoiles',f:'degats',a:1,r:4,cd:4,d:P=>`Tous les ennemis (${pc(2*P)}), rupture accrue.`,run:(u,P)=>aoeS(u,2*P,25),ai:u=>3+2*foes().length},
 /* contrôle */
 entrave:{n:'Entrave',f:'controle',a:1,r:0,cd:2,d:P=>`Cible (${pc(.8*P)}) qui recule dans l’ordre des tours.`,run:async(u,P)=>{const t=await hitS(u,.8*P,10);if(t&&t.alive){t.av+=3000/t.spd*P;fl(t,'RALENTI','deb');drawTL()}},ai:u=>{const t=tgt();return t&&(t.kind!='norm'||t.charging)?5:3}},
 pointf:{n:'Point faible',f:'controle',a:1,r:1,cd:3,d:P=>`DEF de la cible −${pc(Math.min(.6,.3*P))} pendant 3 tours, puis frappe (${pc(.6*P)}).`,run:async(u,P)=>{const t=tgt();if(!t)return;t.bf.def={v:-Math.min(.6,.3*P),t:3};fl(t,'DEF −','deb');await hitS(u,.6*P,10)},ai:u=>{const t=tgt();return t&&!t.bf.def&&t.hp>t.mhp*.5?(t.kind=='norm'?3:6):0}},
 intim:{n:'Intimidation',f:'controle',a:1,r:1,cd:3,d:P=>`Tous les ennemis : ATQ −${pc(Math.min(.5,.2*P))} (2 tours).`,run:async(u,P)=>{await cast(u,'#c58bff');foes().forEach(e=>{e.bf.atk={v:-Math.min(.5,.2*P),t:2};fl(e,'ATQ −','deb')});await sleep(220)},ai:u=>foes().filter(e=>!e.bf.atk).length>=2||real().some(e=>e.kind!='norm'&&!e.bf.atk)?5:0},
 etourd:{n:'Coup étourdissant',f:'controle',a:1,r:2,cd:3,d:P=>`Cible (${pc(1.2*P)}) ; entame sa ténacité même sans faiblesse, deux fois plus avec.`,run:(u,P)=>hitS(u,1.2*P,30,{tbf:1}),ai:u=>{const t=tgt();return t&&t.mt&&!t.broken?(t.charging?9:5):2}},
 analyse:{n:'Analyse',f:'controle',r:0,d:P=>`Dégâts +${pc(.12*P)} sur une faiblesse, rupture de ténacité +${pc(.2*P)}.`},
 temps:{n:'Maître du temps',f:'controle',a:1,r:4,cd:5,d:P=>`Tous les ennemis reculent fortement dans l’ordre des tours ; l’équipe gagne ${Math.round(20*P)} d’énergie.`,run:async(u,P)=>{await cast(u,'#c58bff');foes().forEach(e=>{e.av+=5000/e.spd;fl(e,'TEMPS FIGÉ','deb')});allies().forEach(a=>gainEn(a,20*P));drawTL();await sleep(260)},ai:u=>foes().length>=2||real().some(e=>e.kind!='norm')?6:0},
 /* défense */
 peau:{n:'Peau de pierre',f:'defense',r:0,d:P=>`DEF +${pc(.1*P)}.`},
 vigueur:{n:'Vigueur',f:'defense',r:0,d:P=>`PV +${pc(.1*P)}.`},
 riposte:{n:'Riposte',f:'defense',r:1,d:P=>`25 % de chances de contre-attaquer (${pc(.6*P)}) quand il est frappé.`},
 inebr:{n:'Inébranlable',f:'defense',r:2,d:P=>`Sous 30 % de PV, dégâts subis −${pc(Math.min(.6,.3*P))}.`},
 forter:{n:'Forteresse',f:'defense',a:1,r:1,cd:3,d:P=>`Bouclier sur soi (${pc(2*P)} de la DEF + 12 % des PV max) et se met en garde.`,run:async(u,P)=>{await cast(u,'#bfe8ff');addSh(u,u.def*2*P+u.mhp*.12,u);u.guard=1;fl(u,'GARDE','buf');await sleep(200)},ai:u=>u.hp<u.mhp*.5&&u.sh<=0?6:0},
 refus:{n:'Refus de mourir',f:'defense',r:4,dp:1,d:P=>`Une fois par expédition dans la Tour : survit à un coup fatal avec 1 PV. Contrepartie : énergie à zéro et ATQ −20 % jusqu’à la fin du combat.`},
 /* chance et butin */
 fortune:{n:'Bonne fortune',f:'chance',r:0,d:P=>`Or gagné en combat +${pc(.1*P)}.`},
 lynx:{n:'Œil de lynx',f:'chance',r:0,d:P=>`Critique +${pc(.06*P)}.`},
 coupch:{n:'Coup de chance',f:'chance',a:1,r:1,cd:2,d:P=>`Cible (${pc(1.5*P)}), critique +40 %.`,run:(u,P)=>hitS(u,1.5*P,15,{crit:u.crit+.4}),ai:u=>4},
 toutrien:{n:'Tout ou rien',f:'chance',a:1,r:2,cd:2,d:P=>`Une chance sur deux : ${pc(3.2*P)} — sinon ${pc(.5*P)}.`,run:async(u,P)=>{const ok=Math.random()<.5;const t=await hitS(u,(ok?3.2:.5)*P,ok?25:5);if(t)fl(u,ok?'JACKPOT !':'RATÉ…',ok?'buf':'deb')},ai:u=>u.c.pers=='Opportuniste'||u.c.pers=='Impulsif'?5:3.5},
 trefle:{n:'Trèfle à quatre feuilles',f:'chance',r:3,d:P=>`${pc(Math.min(.3,.12*P))} de chances d’esquiver une attaque.`},
 leste:{n:'Main leste',f:'chance',r:1,d:P=>`${pc(Math.min(.5,.15*P))} de chances de dérober un éclat d’étoile après une victoire.`},
 /* découverte */
 erudit:{n:'Érudit',f:'decouverte',r:0,d:P=>`Expérience gagnée +${pc(.15*P)}.`},
 flair:{n:'Flair d’explorateur',f:'decouverte',r:1,d:P=>`Ressources trouvées en combat (bois, pierre) +${pc(.25*P)}, et en trouve plus souvent.`},
 invent:{n:'Étincelle d’invention',f:'decouverte',a:1,r:2,cd:2,d:P=>`Projectile de l’élément faible de la cible (${pc(1.4*P)}), forte rupture.`,run:(u,P)=>hitS(u,1.4*P,25,{wk:1}),ai:u=>{const t=tgt();return t&&t.weak.length&&!t.broken&&t.mt?5.5:0}},
 etude:{n:'Étude des monstres',f:'decouverte',r:2,d:P=>`Début de combat : ténacité des ennemis −${pc(Math.min(.5,.2*P))}.`},
 alchim:{n:'Alchimie',f:'decouverte',a:1,r:3,cd:4,d:P=>`Équipe : +${Math.round(25*P)} d’énergie et +1 point de compétence.`,run:async(u,P)=>{await cast(u,'#6fd3ff');allies().forEach(a=>{gainEn(a,25*P);fl(a,'ÉNERGIE','buf')});setSP(2);await sleep(240)},ai:u=>allies().some(a=>a.en>=50&&a.en<100)?5:2},
 /* cuisine */
 encas:{n:'En-cas partagé',f:'cuisine',a:1,r:0,cd:2,d:P=>`L’allié le plus blessé récupère ${pc(.12*P)} de ses PV et 15 d’énergie.`,run:async(u,P)=>{await cast(u,'#e8945a');const a=lowA();heal(a,a.mhp*.12*P,u);gainEn(a,15);await sleep(200)},ai:u=>ratioLow()<.65?5:0},
 festin:{n:'Festin',f:'cuisine',r:1,d:P=>`Après chaque victoire, l’équipe récupère ${pc(.08*P)} de ses PV.`},
 ragout:{n:'Ragoût fortifiant',f:'cuisine',r:2,d:P=>`Début de combat : ATQ et DEF de l’équipe +${pc(.05*P)}.`},
 epices:{n:'Épices de feu',f:'cuisine',a:1,r:1,cd:3,d:P=>`L’allié le plus fort : ATQ +${pc(.25*P)} (2 tours) et agit plus tôt.`,run:async(u,P)=>{const a=allies().filter(x=>x!=u).sort((x,y)=>y.atk-x.atk)[0]||u;await buffS(u,[a],'atk',.25*P,2,'ÉPICÉ !','#ff6b3d');if(a!=u)a.av*=.4;drawTL()},ai:u=>allies().length>1&&noBuff('atk')?4:0},
 banquet:{n:'Banquet légendaire',f:'cuisine',a:1,r:4,cd:5,d:P=>`Équipe : soigne ${pc(.25*P)} des PV max et ATQ +${pc(.25*P)} (2 tours).`,run:async(u,P)=>{await cast(u,'#e8945a');allies().forEach(a=>{heal(a,a.mhp*.25*P,u);a.bf.atk={v:Math.max(.25*P,bfv(a,'atk')),t:2};fl(a,'ATQ +'+pc(.25*P),'buf')});await sleep(260)},ai:u=>ratioLow()<.7||noBuff('atk')>=2?6:2},
 /* célérité */
 elan:{n:'Élan',f:'celerite',r:0,d:P=>`VIT +${Math.round(6*P)}.`},
 double:{n:'Double frappe',f:'celerite',a:1,r:0,cd:1,d:P=>`Deux coups rapides (${pc(.8*P)} chacun).`,run:async(u,P)=>{for(let i=0;i<2;i++){const t=tgt();if(!t)break;await hitAnim(u,t,()=>deal(u,t,.8*P,10),rgU(u))}},ai:u=>4},
 assaut:{n:'Assaut éclair',f:'celerite',a:1,r:1,cd:3,d:P=>`Cible (${pc(1.3*P)}), puis rejoue immédiatement.`,run:async(u,P)=>{await hitS(u,1.3*P,15);if(B.cur==u){u.extra=1;fl(u,'REJOUE','buf')}},ai:u=>5},
 premier:{n:'Premier sang',f:'celerite',r:1,d:P=>`Commence le combat avec ${Math.round(30*P)} d’énergie et agit plus tôt.`},
 furie:{n:'Furie',f:'celerite',a:1,r:2,cd:3,d:P=>`Quatre coups (${pc(.6*P)}) sur des ennemis au hasard.`,run:async(u,P)=>{for(let i=0;i<4;i++){const e=pick(real());if(!e)break;await hitAnim(u,e,()=>deal(u,e,.6*P,8),1)}},ai:u=>3+real().length},
 fougue:{n:'Fougue',f:'celerite',r:3,d:P=>`Après un coup critique : +15 d’énergie et son prochain tour arrive plus vite.`}};
/* nouvelles compétences d'arbre (✚) et signatures de personnalité (§8.2, §8.3) */
Object.assign(SKILLS,{
 refrain:{n:'Refrain tenace',f:'soutien',r:2,d:P=>`Les bonus d’équipe qu’il lance durent 1 tour de plus.`},
 vampir:{n:'Soif de sang',f:'soin',r:2,d:P=>`Vol de vie : ${pc(.12*P)} des dégâts infligés.`},
 phenix:{n:'Plume de phénix',f:'soin',r:4,dp:1,d:P=>`Une fois par expédition, quand il tombe : renaît à 40 % PV et brûle les ennemis (${pc(1.5*P)}).`},
 sentinel:{n:'Sentinelle',f:'protection',r:1,d:P=>`Quand un allié subit un critique : +20 d’énergie et bouclier de ${pc(.06*P)} PV sur cet allié.`},
 brasier:{n:'Brasier',f:'degats',a:1,r:1,cd:2,d:P=>`Cible (${pc(1.2*P)}) + brûlure 3 tours (${pc(.2*P)} ATQ/tour) ; Feu : ×1,2.`,run:async(u,P)=>{const t=await hitS(u,1.2*P*(u.elem=='feu'?1.2:1),15);if(t&&t.alive)addDot(t,u,.2*P*(u.elem=='feu'?1.2:1),3,'brl')},ai:u=>{const t=tgt();return t&&!(t.dot||[]).some(d=>d.k=='brl')?4.5:2.5}},
 chaine:{n:'Chaîne d’éclairs',f:'degats',a:1,r:2,cd:3,d:P=>`${pc(1.3*P)} qui rebondit 3 fois (−20 % par rebond).`,run:async(u,P)=>{let m=1.3*P,t=tgt();const hit=[];for(let i=0;i<4&&t;i++){const tt=t;await hitAnim(u,tt,()=>deal(u,tt,m,10),1);hit.push(tt);m*=.8;t=pick(real().filter(e=>!hit.includes(e)))||pick(real())}},ai:u=>3+real().length*.8},
 rayon:{n:'Rayon sacré',f:'degats',a:1,r:2,cd:2,d:P=>`Cible (${pc(1.8*P)}, ×1,5 contre Ombre et spectres) ; soigne le lanceur de 10 % des dégâts.`,run:async(u,P)=>{const t=tgt();if(!t)return;let d=0;await hitAnim(u,t,()=>{d=deal(u,t,1.8*P*(t.elem=='ombre'||t.type=='spectre'?1.5:1),15)||0},1);if(d)heal(u,d*.1,u)},ai:u=>{const t=tgt();return t&&(t.elem=='ombre'||t.type=='spectre')?6:4}},
 nova:{n:'Nova arcanique',f:'degats',a:1,r:3,cd:4,d:P=>`Tous (${pc(1.7*P)}), retire boucliers et bonus ennemis.`,run:async(u,P)=>{foes().forEach(e=>{e.sh=0;for(const k in e.bf)if(e.bf[k].v>0)delete e.bf[k]});await aoeS(u,1.7*P,15)},ai:u=>2+2*foes().length},
 ecrase:{n:'Écrasement sismique',f:'degats',a:1,r:3,cd:3,d:P=>`Tous (${pc(1.4*P)}) ; ×1,5 sur les ennemis brisés.`,run:async(u,P)=>{await cast(u);B.shake=6;foes().forEach(e=>deal(u,e,1.4*P*(e.broken?1.5:1),15));await sleep(260)},ai:u=>2+1.6*foes().length+foes().filter(e=>e.broken).length*2},
 lancegl:{n:'Lance de glace',f:'controle',a:1,r:1,cd:2,d:P=>`Cible (${pc(1.5*P)}), recule de 25 % (Glace : 40 %).`,run:async(u,P)=>{const t=await hitS(u,1.5*P,15);if(t&&t.alive){pushT(t,u.elem=='glace'?.4:.25);fl(t,'GELÉ','deb');drawTL()}},ai:u=>4},
 ronces:{n:'Ronces',f:'controle',a:1,r:1,cd:3,d:P=>`Tous (${pc(.6*P)}) + racines (recul 15 %).`,run:async(u,P)=>{await aoeS(u,.6*P,10);foes().forEach(e=>pushT(e,.15));drawTL()},ai:u=>foes().length>=2?2+foes().length:1},
 toxine:{n:'Toxine',f:'controle',r:1,d:P=>`Ses coups ont 25 % de chances d’empoisonner (3 tours, ${pc(.2*P)} ATQ/tour, cumul 3).`},
 malefice:{n:'Maléfice',f:'controle',a:1,r:2,cd:3,d:P=>`Cible : dégâts subis +${pc(Math.min(.5,.2*P))} et soins reçus −50 % (3 tours).`,run:async(u,P)=>{const t=tgt();if(!t)return;await cast(u,'#c58bff');t.bf.vul={v:Math.min(.5,.2*P),t:3};t.bf.nheal={v:.5,t:3};fl(t,'MALÉFICE','deb');fxOn('fx_el_ombre',t);await sleep(200)},ai:u=>{const t=tgt();return t&&!t.bf.vul&&t.hp>t.mhp*.4?(t.kind=='norm'?3:6):0}},
 epines:{n:'Peau d’épines',f:'defense',r:1,d:P=>`Renvoie ${pc(.12*P)} des dégâts de mêlée subis.`},
 tresor:{n:'Chasseur de trésors',f:'chance',r:2,d:P=>`Élites : ${pc(Math.min(.9,.3*P))} de chances d’une essence de plus ; coffres plus généreux.`},
 carto:{n:'Cartographie mentale',f:'decouverte',r:1,d:P=>`L’équipe n’est jamais prise en embuscade par les patrouilles.`},
 voile:{n:'Voile d’ombre',f:'celerite',r:2,d:P=>`Début de combat : impossible à cibler jusqu’à sa première action.`},
 hate:{n:'Hâte',f:'celerite',a:1,r:2,cd:3,d:P=>`L’allié le plus lent agit immédiatement.`,run:async(u,P)=>{const a=allies().filter(x=>x!=u).sort((x,y)=>x.spd-y.spd)[0]||u;await cast(u,'#ff9a3a');if(a!=u){a.av=0;fl(a,'HÂTE','buf');drawTL()}else{u.haste=1}await sleep(200)},ai:u=>allies().length>1?4:0},
 /* signatures */
 mainten:{n:'Main tendue',f:'soin',r:2,sig:'Altruiste',d:P=>`Quand un allié passe sous 30 % PV, le soigne aussitôt de ${pc(.12*P)} PV max (une fois par allié et par combat).`},
 couronne:{n:'Vers la couronne',f:'degats',r:2,sig:'Ambitieux',d:P=>`ATQ +${pc(.03*P)} par ennemi qu’il achève (max 5), +1 point de compétence au 3ᵉ.`},
 echiquier:{n:'Échiquier',f:'controle',a:1,r:2,cd:3,sig:'Calculateur',d:P=>`La cible et l’ennemi le plus rapide reculent de 30 % ; prochain coup de l’équipe sur eux : critique assuré.`,run:async(u,P)=>{const t=tgt();if(!t)return;await cast(u,'#c58bff');const f=foes().filter(e=>e!=t).sort((a,b)=>b.spd-a.spd)[0];[t,f].forEach(e=>{if(e){pushT(e,.3);e.ccrit=1;fl(e,'ÉCHEC !','deb')}});drawTL();await sleep(220)},ai:u=>foes().length>=2?5:3},
 foncer:{n:'Tête la première',f:'celerite',a:1,r:1,cd:2,sig:'Impulsif',d:P=>`Cible (${pc(1.7*P)}), agit en premier au tour suivant ; subit +10 % de dégâts 1 tour.`,run:async(u,P)=>{await hitS(u,1.7*P,15);u.haste=1;u.bf.vul={v:.1,t:2}},ai:u=>4.5},
 roc:{n:'Roc immuable',f:'defense',r:2,sig:'Stoïque',d:P=>`Ne subit jamais plus de ${pc(Math.max(.15,.25-.05*(P-1)))} de ses PV max en un coup.`},
 eureka:{n:'Eurêka !',f:'decouverte',r:1,sig:'Curieux',d:P=>`La première faiblesse touchée de chaque combat : rupture ×2 et +1 point de compétence.`},
 gouter:{n:'Goûteur',f:'cuisine',r:1,sig:'Gourmand',d:P=>`Soins reçus +${pc(.12*P)} ; les potions qu’il boit soignent ×1,5.`},
 moidabord:{n:'Moi d’abord',f:'degats',r:2,sig:'Égoïste',d:P=>`Dégâts +${pc(.14*P)} ; soins reçus +15 %.`},
 aubaine:{n:'Aubaine',f:'chance',r:2,sig:'Opportuniste',d:P=>`Quand un ennemi est brisé : +1 point de compétence et son prochain coup sur lui critique ×1,8.`}});
/* marques : spécialisations (×3) et sous-classes (×2) qui favorisent chaque compétence d'arbre (colonne « Favorisé par ») */
{const TG={cri:'chantre chevalier etendard',inspir:'troubadour arcaniste conteur',donabs:'pretre paladin',aura:'enchanteur troubadour etendard',miroir:'pretre enchanteur',chef:'chevalier chantre tacticien',refrain:'chantre troubadour conteur',
 premsoins:'pretre druide medic',rosee:'druide rodeur',regen:'druide berserker',bened:'pretre paladin',souffle:'pretre druide',rappel:'pretre',vampir:'hemo berserker',phenix:'pretre elementaliste',
 egide:'paladin chevalier garde',murviv:'rempart vengeur',garde:'chevalier rempart garde',coeur:'paladin garde',promesse:'paladin chevalier',dernier:'paladin chevalier',sentinel:'rempart chevalier garde',
 frappe:'berserker epeiste chevalier',tourb:'berserker elementaliste',grace:'lameombre duelliste',brute:'berserker vengeur',gloire:'duelliste berserker',meteore:'epeiste tireur',lame:'epeiste elementaliste',brasier:'elementaliste berserker chantre',chaine:'tempete elementaliste',rayon:'paladin pretre exorciste',nova:'arcaniste occultiste',ecrase:'berserker rempart vengeur',
 entrave:'chrono rodeur saboteur',pointf:'tireur empoisonneur pisteur',intim:'vengeur chantre enchanteur',etourd:'rempart epeiste',analyse:'tireur arcaniste runiste',temps:'chrono',lancegl:'elementaliste chrono',ronces:'rodeur druide',toxine:'empoisonneur lameombre alchi',malefice:'occultiste hemo',
 peau:'rempart',vigueur:'rempart chevalier',riposte:'vengeur epeiste garde',inebr:'rempart berserker',forter:'rempart paladin',refus:'berserker vengeur',epines:'vengeur rempart',
 fortune:'troubadour contreb',lynx:'tireur lameombre',coupch:'duelliste tempete',toutrien:'duelliste',trefle:'eclaireur troubadour',leste:'eclaireur contreb',tresor:'eclaireur troubadour contreb',
 erudit:'arcaniste',flair:'eclaireur rodeur',invent:'arcaniste empoisonneur alchi',etude:'tireur pisteur',alchim:'arcaniste alchi',carto:'eclaireur rodeur',
 encas:'druide troubadour',festin:'druide',ragout:'rempart chevalier',epices:'chantre',banquet:'druide troubadour',
 elan:'eclaireur tempete',double:'duelliste eclaireur',assaut:'eclaireur lameombre',premier:'lameombre eclaireur',furie:'berserker tempete',fougue:'duelliste',voile:'lameombre occultiste',hate:'chrono troubadour tacticien'};
 for(const k in TG)if(SKILLS[k])SKILLS[k].tg=TG[k].split(' ')}
const TREEK=Object.keys(SKILLS).filter(k=>!SKILLS[k].fx);
const SKK=TREEK;
/* puissance : +4 % par niveau de compétence, +40 % par cran de rareté gagné par évolution */
const skP=s=>1+.04*((s.lv||1)-1)+.4*Math.max(0,(s.r||0)-SKILLS[s.id].r);
const knownSk=c=>(c.skills||[]).filter(s=>SKILLS[s.id]);
function psOf(c){const o={};knownSk(c).forEach(s=>{if(!SKILLS[s.id].a)o[s.id]=Math.max(o[s.id]||0,skP(s))});return o}
const skMax=c=>Math.floor(cap(c)/((c.gr||GR0).ms));
const nextMs=c=>{const m=(c.gr||GR0).ms,n=(Math.floor(c.lv/m)+1)*m;return n<=cap(c)?n:null};
/* tirage d'une compétence à un palier : famille pondérée, puis rareté (les étoiles l'améliorent un peu) ; jamais garanti */
function drawSkill(c){const w=famW(c);let x=Math.random()*FK.reduce((a,f)=>a+w[f],0),f=FK[0];for(const k of FK){x-=w[k];if(x<0){f=k;break}}
 const ks=SKK.filter(k=>SKILLS[k].f==f),ww=ks.map(k=>{const S=SKILLS[k];return RARW[S.r]*Math.pow(1+.06*(c.st-1),S.r)*(S.dp?.25:1)*sigW(c,S)});let y=Math.random()*ww.reduce((a,b)=>a+b,0);for(let i=0;i<ks.length;i++){y-=ww[i];if(y<0)return ks[i]}return ks[0]}
let NEWSK=[];
function learnRoll(c,silent){if(!c.skills)c.skills=[];const g=c.gr||GR0;if(Math.random()>g.lc){if(!silent)NEWSK.push({c,miss:1});return null}
 const id=drawSkill(c),S=SKILLS[id],had=c.skills.find(s=>s.id==id);if(had){had.lv=Math.min(10,had.lv+2);if(!silent)NEWSK.push({c,s:had,up:1});return had}
 const s={id,lv:1,r:S.r};c.skills.push(s);if(!silent)NEWSK.push({c,s});return s}
function newSkTxt(){const a=NEWSK.filter(x=>!x.miss).map(x=>x.txt?`${x.c.name} ${x.txt}`:`${x.c.name} ${x.up?'perfectionne':'apprend'} <b style="color:${RARC[x.s.r]}">${SKILLS[x.s.id].n}</b>${x.up?' (niv. '+x.s.lv+')':' ('+RARN[x.s.r].toLowerCase()+(x.ins?', inspiré':'')+')'}`),m=NEWSK.filter(x=>x.miss).map(x=>x.c.name);NEWSK=[];return a.join(' · ')+(m.length?(a.length?' · ':'')+'<span class="m">palier sans inspiration : '+m.join(', ')+'</span>':'')}
/* initialisation / migration d'un personnage : sous-traits, profil de croissance, compétences des paliers déjà franchis */
function initPers(c,noProg){if(!PERS[c.pers])c.pers=pick(Object.keys(PERS));if(!Array.isArray(c.subs)||!c.subs.length)c.subs=c.sub&&TRAITS[c.sub]?[c.sub].concat(rollSubs(c.pers,c.st).filter(t=>t!=c.sub)).slice(0,1+(c.st>=3?1:0)+(Math.random()<.3?1:0)).slice(0,3):rollSubs(c.pers,c.st);c.subs=c.subs.filter(t=>TRAITS[t]);if(!c.subs.length)c.subs=[pick(SUBS[c.pers])];c.sub=c.subs[0];
 if(!c.gr)c.gr=genGrowth(c);const nw=!Array.isArray(c.skills);if(nw)c.skills=c.fixed&&c.sig?[{id:'egide',lv:1,r:0,src:'acquis'}]:[];c.skills=c.skills.filter(s=>s&&SKILLS[s.id]);if(!c.cls&&!noProg){initProg(c,1);treeCatch(c,1)}return c}
const skCost=s=>({gold:Math.round(30*s.lv*(s.r+1)*(1-JF.bibG(JR('bibliothecaire'))-(rs('archives')?.15:0)))}),evoCost=s=>({['mat_tome_'+(s.r+2)]:[2,3,3,4][s.r]||99,gold:[300,800,2000,5000][s.r]||99999});
function skUp(cid,i){const c=G.chars.find(x=>x.id==cid),s=c&&c.skills[i];if(!s||s.lv>=10)return;const o=skCost(s);if(!can(o))return;pay(o);s.lv++;save();rp();toast(`${SKILLS[s.id].n} : niveau ${s.lv}`)}
function skEvo(cid,i){const c=G.chars.find(x=>x.id==cid),s=c&&c.skills[i];if(!s||s.lv<10||s.r>=4)return;const o=evoCost(s);if(!canX(o))return;payX(o);if(JE('bibliothecaire')&&Math.random()<.15){giveM({['mat_tome_'+(s.r+2)]:1});setTimeout(()=>toast('L’archiviste récupère le tome !'),1500)}const P0=skP(s),S=SKILLS[s.id];s.r++;s.lv=1;save();rp();evoReveal({img:mSrc('mat_tome_'+(s.r+1)),col:RARC[s.r],title:'ÉVOLUTION !',name:S.n,from:s.r,to:s.r+1,small:1,lines:[`${c.name} · ${RARN[s.r-1]} → <b style="color:${RARC[s.r]}">${RARN[s.r]}</b> (retour au niveau 1)`,`Puissance ×${P0.toFixed(2)} → ×${skP(s).toFixed(2)} au niv. 1, jusqu’à ×${(skP(s)+.36).toFixed(2)} au niv. 10`,S.d(skP(s))]})}
