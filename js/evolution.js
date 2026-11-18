'use strict';
/* ================= ÉVOLUTION, INGRÉDIENTS ET ARTISANAT (docs/evolution.md) =================
   G.mats {clé: nombre} : ingrédients. Icônes : ASSETS[clé] (art Blender) sinon dessin procédural (matSprite).
   Coûts mixtes : une clé « mat_* » se lit dans G.mats, les autres dans G.res (canX / payX / costX). */
const TIERC=['#7f93a8','#4cb86a','#3f9cff','#b565ff','#ffc233','#ff5ccf'];
const MGR={evo:['Évolution','ui_evolution'],comp:['Compétences','mat_tome_3'],forge:['Forge','ui_enclume'],ess:['Essences','mat_essence_arcane']};
const MATS={};
for(let n=1;n<=6;n++)MATS['mat_parchemin_'+n]={n:'Parchemin d’évolution ★'+n,g:'evo',t:n,ic:'parch',c:TIERC[n-1],d:n<6?`Éveille un personnage ${n}★ en ${n+1}★ (Autel d’éveil, à l’Auberge).`:'Transcendance d’un personnage 6★ : niveau maximal +5 (trois fois au plus).',s:n<=2?'Coffres, gardiens, quêtes et boss ; invocations (matériaux) ; fusion de trois ★'+(n-1||1)+'.':n<=4?'Quêtes et boss des étages profonds, coffres verrouillés ; fusion.':'Très rare : boss des étages profonds (★'+n+' dès l’étage '+(n==5?15:25)+') ; fusion.'};
for(let n=1;n<=6;n++)MATS['mat_pierre_'+n]={n:'Pierre d’éveil ★'+n,g:'evo',t:n,ic:'pierre',c:TIERC[n-1],d:n<6?`Éveille un équipement ${n}★ en ${n+1}★ (Forge, onglet Éveil).`:'Transcendance d’un équipement 6★ : statistiques +8 % (trois fois au plus).',s:n<=4?'Coffres, gardiens, quêtes, boss ; démantèlement d’objets '+(n+1)+'★ ; fusion à la Forge.':'Très rare : boss des étages profonds ; démantèlement ; fusion.'};
MATS.mat_fragment={n:'Fragment de parchemin',g:'evo',ic:'frag',c:'#e8d9b5',d:'Dix fragments se relient en un parchemin d’évolution ★1 (Autel d’éveil).',s:'Sacrifice de personnages 1★ et 2★.'};
const TOMEN=['commune','peu commune','rare','épique','légendaire'];
for(let n=1;n<=5;n++)MATS['mat_tome_'+n]={n:'Tome de compétence '+TOMEN[n-1],g:'comp',t:n,ic:'tome',c:RARC[n-1],d:(n>1?`Fait évoluer une compétence niv. 10 vers la rareté ${TOMEN[n-1]}. `:'')+`Étudier un tome ${TOMEN[n-1]} fait gagner 2 niveaux à une compétence ${TOMEN[n-1]}.`,s:'Coffres, gardiens, quêtes et boss ; invocations (matériaux) ; fusion de trois tomes de rang inférieur.'};
[['mat_minerai','Minerai de fer','minerai','#9a96ae','Se raffine en lingots (3 → 1).','Monstres de pierre et squelettes, filons de pierre, démantèlement, Affinage (pierre).'],
 ['mat_lingot','Lingot d’acier','lingot','#c9d2e2','Armes et armures de métal ; éveil des objets de métal.','Affinage du minerai, démantèlement d’objets de métal.'],
 ['mat_mithril','Lingot de mithril','lingot','#7fe0ff','Métal noble : éveil 3★+ des objets de métal.','Affinage (lingots + cristal, Forge niv. 2), démantèlement d’objets 3★+.'],
 ['mat_cuir','Cuir tanné','cuir','#b07a48','Armures légères, poignées, reliures.','Loups et chacals, tannage des crocs, démantèlement.'],
 ['mat_tissu','Rouleau de tissu','tissu','#d9c8f0','Capes, robes, cordes d’arc, étendards.','Spectres et sporions, cueillette, tissage (vivres), démantèlement.'],
 ['mat_bois','Bois ouvragé','bois','#c08a52','Arcs, bâtons, luths, manches d’outils.','Tas de bois des étages, Affinage (bois du village), démantèlement.'],
 ['mat_cristal','Cristal pur','cristal','#c58bff','Bâtons, sceptres, grimoires, reliques ; éveil des objets magiques.','Veines de cristal (pioche), cristaux nourriciers, Affinage (poussière), démantèlement.'],
 ['mat_croc','Croc de bête','croc','#f2ead6','Dagues ; se tanne en cuir (3 → 1).','Loups, chacals.'],
 ['mat_noyau','Noyau de monstre','noyau','#ff5a7a','Catalyseur majeur de fabrication (rareté), éveil 4★+.','Élites, golems, champions et boss.'],
 ['mat_poussiere','Poussière d’étoile','poussiere','#ffe27a','Catalyseur mineur de fabrication, potions, éveil 2★+.','Gelées, spectres, sporions, squelettes, veines, démantèlement.']
].forEach(([k,n,ic,c,d,s])=>MATS[k]={n,g:'forge',ic,c,d,s});
const ESSN={feu:'Essence de feu',glace:'Essence de glace',foudre:'Essence de foudre',nature:'Essence de nature',sacre:'Essence sacrée',ombre:'Essence d’ombre',arcane:'Essence arcanique'};
EK.forEach(e=>MATS['mat_essence_'+e]={n:ESSN[e],g:'ess',ic:'ess',el:e,c:ELEMS[e].c,d:`Éveil des personnages ${ELEMS[e].n.toLowerCase()} ; imprègne un objet fabriqué de l’élément ${ELEMS[e].n.toLowerCase()}.`,s:'Combats dans les biomes de cet élément (plus nombreuses en profondeur), autels, sacrifice.'});
const MK=Object.keys(MATS);
/* ---------- accès, coûts mixtes ---------- */
const mN=k=>(G.mats&&G.mats[k])|0,isM=k=>k.slice(0,4)=='mat_',haveX=k=>isM(k)?mN(k):(G.res[k]|0);
const canX=o=>!!o&&Object.keys(o).every(k=>!o[k]||haveX(k)>=o[k]);
function payX(o){for(const k in o){if(!o[k])continue;if(isM(k)){G.mats[k]=mN(k)-o[k];if(G.mats[k]<=0)delete G.mats[k]}else G.res[k]-=o[k]}}
function giveM(o){if(!G.mats)G.mats={};for(const k in o)if(MATS[k]&&o[k]>0){if(capped(k))addCap(k,o[k]);else G.mats[k]=mN(k)+o[k]}}
const mIco=(k,c)=>`<img class="${c||'mi'}" src="${mSrc(k)}" alt="">`;
const costX=o=>`<span class="cost">${Object.keys(o).filter(k=>o[k]).map(k=>isM(k)?`<span class="rc${mN(k)<o[k]?' w':''}" title="${MATS[k].n}">${mIco(k)}<b>${mN(k)}/${o[k]}</b></span>`:`<span class="rc${(G.res[k]|0)<o[k]?' w':''}" title="${RES[k][0]}">${rIco(k)}<b>${o[k]}</b>${aSrc('res_'+k)?'':' '+RES[k][0].toLowerCase()}</span>`).join('')}</span>`;
const mTxt=o=>Object.keys(o).filter(k=>o[k]).map(k=>`<span class="rc" title="${MATS[k].n}">${mIco(k)}+${o[k]} ${MATS[k].n.replace(/ \(.*\)/,'')}</span>`).join(' ');
const mShort=o=>Object.keys(o).filter(k=>o[k]).map(k=>`<span class="rc" title="${MATS[k].n}">${mIco(k)}×${o[k]}</span>`).join(' ');
/* ---------- butin : rangs des ingrédients d'évolution selon la profondeur ----------
   rang N : poids de base 100/30/8/2/0,25/0,03 × (1 + étage/20)^(N−1), débloqué à l'étage 1/1/3/8/15/25 ; boss : étage +10 */
const TU=[1,1,3,8,15,25],TB=[100,30,8,2,.25,.03];
function tierW(f,boss){const fe=f+(boss?10:0),m=1+fe/20;return TB.map((b,i)=>fe>=TU[i]?b*Math.pow(m,i):0)}
function tierAt(f,boss){const w=tierW(f,boss);let x=Math.random()*w.reduce((a,b)=>a+b,0);for(let i=0;i<6;i++){x-=w[i];if(x<0)return i+1}return 1}
const evoKey=(kind,t)=>kind=='tome'?'mat_tome_'+clamp(t,1,5):'mat_'+kind+'_'+clamp(t,1,6);
const evoDrop=(f,kind,boss)=>evoKey(kind||pick(['parchemin','parchemin','pierre','tome']),tierAt(f,boss));
const BASEM=['mat_minerai','mat_minerai','mat_cuir','mat_tissu','mat_bois','mat_croc','mat_poussiere'];
const MDROP={slime:['mat_poussiere','mat_tissu'],loup:['mat_croc','mat_croc','mat_cuir'],chacal:['mat_croc','mat_cuir'],squelette:['mat_minerai','mat_poussiere'],golem:['mat_minerai','mat_minerai','mat_minerai','mat_noyau'],spectre:['mat_tissu','mat_poussiere'],champi:['mat_tissu','mat_poussiere'],cristal:['mat_cristal','mat_poussiere']};
function addM(o){if(F&&hasLaw('gel'))for(const k in o)o[k]*=2;giveM(o);if(F){F.mloot=F.mloot||{};for(const k in o)F.mloot[k]=(F.mloot[k]||0)+o[k]}return mTxt(o)}
const madd=(o,k,n)=>{o[k]=(o[k]||0)+n;return o};
/* combat gagné : monstres → matériaux, biome → essences de ses éléments */
function fightDrops(cfg,f,bi){const ch=PRk('chasseur'),o={},big=d=>d.kind=='elite'||d.kind=='mini'||d.kind=='boss',defs=(cfg.defs||[]).concat(...(cfg.waves||[]));
 shuffle(defs).slice(0,4).forEach(d=>{const L=MDROP[d.type];if(L&&Math.random()<Math.min(.95,(big(d)?.8:.4)+.05*ch))madd(o,pick(L),1+(big(d)?1:0)+(Math.random()<f/40?1:0))});
 if(defs.some(d=>d.kind=='elite')&&Math.random()<.1)madd(o,'mat_noyau',1);if(ch>=4&&defs.some(d=>d.kind=='elite'))madd(o,pick(['mat_croc','mat_cuir']),1);if(PE('chasseur')&&defs.some(d=>d.kind=='elite')&&Math.random()<.03)madd(o,evoDrop(f,'parchemin'),1);
 if(Math.random()<(cfg.kind=='norm'?.2:.4))madd(o,'mat_essence_'+pick(bi.el),1+Math.floor(f/12));
 if(Math.random()<.15)madd(o,bi.res=='wood'?'mat_bois':'mat_minerai',1);return o}
/* gardien vaincu : quêtes et boss donnent toujours des ingrédients d'évolution */
function guardDrops(f,kind,pact){const o={};if(kind=='boss'){madd(o,evoDrop(f,'parchemin',1),1);madd(o,evoDrop(f,'parchemin',1),1);madd(o,evoDrop(f,'pierre',1),1);madd(o,evoDrop(f,'tome',1),1);madd(o,'mat_noyau',1)}
 else if(kind=='mini'){madd(o,evoDrop(f,'parchemin'),1);madd(o,evoDrop(f,pick(['pierre','tome'])),1);if(Math.random()<.25)madd(o,'mat_noyau',1)}
 else if(Math.random()<.35)madd(o,evoDrop(f),1);if(pact)for(const k in o)o[k]*=2;return o}
/* ---------- évolution des personnages ---------- */
const EVOC=[null,{p:2,e:2,g:300},{p:3,e:4,g:1200,x:{mat_cristal:1}},{p:4,e:6,g:4000,x:{mat_cristal:3}},{p:5,e:10,g:6000,x:{mat_noyau:2}},{p:6,e:15,g:15000,x:{mat_noyau:4,mat_cristal:6}}];
const SUBP=.35;
function cEvoCost(c){const o={};if(c.st<6){const E=EVOC[c.st];o['mat_parchemin_'+c.st]=E.p;o['mat_essence_'+c.elem]=E.e;Object.assign(o,E.x||{});o.gold=E.g;return o}const t=c.tr||0;if(t>=3)return null;o.mat_parchemin_6=t+1;o['mat_essence_'+c.elem]=20;o.mat_noyau=5;o.gold=25000*(t+1);return o}
const cEvoReady=c=>c.lv>=cap(c)&&!!cEvoCost(c)&&(c.st<6||awOf(c)>=3);
function evoBase(c){const s=c.st,b=c.b;if(s>=6)return{hp:Math.round(b.hp*1.04),atk:Math.round(b.atk*1.04),def:Math.round(b.def*1.04)};return{hp:Math.round(b.hp*(220+90*(s+1))/(220+90*s)),atk:Math.round(b.atk*(26+11*(s+1))/(26+11*s)),def:Math.round(b.def*(16+7*(s+1))/(16+7*s))}}
let evArm=0;
function doEvo(id){const c=G.chars.find(x=>x.id==id);if(!c)return;const o=cEvoCost(c);if(!o||!cEvoReady(c)||!canX(o))return;if(evArm!=id){evArm=id;return rp()}evArm=0;
 const s0=stats(c),st0=c.st,cap0=cap(c),lines=[];payX(o);Object.assign(c.b,evoBase(c));if(c.st<6)c.st++;else c.tr=(c.tr||0)+1;
 if(c.subs.length<3&&Math.random()<SUBP){const pool=rollSubs(c.pers,6).concat(SUBS[c.pers]).filter(t=>!c.subs.includes(t)&&!(OPPT[c.pers]&&TRAITS[t][0]==OPPT[c.pers]));if(pool.length){const t=pool[0];c.subs.push(t);c.gr=genGrowth(c);lines.push(`Nouveau sous-trait : <b class="g">${t}</b>`)}}
 if(st0<6){c.tree.star[cap0]=bandOf(cap(c));revealTree(c);NEWSK=[];treeCatch(c);NEWSK.forEach(x=>{if(x.s)lines.push(`Nœud d’étoile : <b style="color:${RARC[x.s.r]}">${SKILLS[x.s.id].n}</b> ${x.up?'(niv. '+x.s.lv+')':'('+RARN[x.s.r].toLowerCase()+')'}`)});NEWSK=[];
  const bk=c.xpBank||0;if(bk>0){const lv0=c.lv;c.xpBank=0;gain(c,bk,1);lines.push(`Réserve d’expérience libérée : <b class="g">${bk}</b> exp.${c.lv>lv0?' → niveau <b class="g">'+c.lv+'</b>':''}`);const t=newSkTxt();if(t)lines.push(t)}
  const nb=treeOf(c).filter(n=>n.L>cap0&&n.L<=cap(c)).length;if(nb)lines.push(`${nb} nœud${nb>1?'s':''} de l’arbre révélé${nb>1?'s':''} (niv. ${cap0+1}–${cap(c)})`)}
 else lines.push(`Constellation <b class="g">${CONST[c.tr-1][0]}</b> : ${CONST[c.tr-1][1]}`);codexOwn(c);
 const s1=stats(c);if(st0<6)lines.unshift(`Niveau maximal <b>${cap0}</b> → <b class="g">${cap(c)}</b>`);lines.splice(st0<6?1:0,0,`PV ${s0.hp} → <b class="g">${s1.hp}</b> · ATQ ${s0.atk} → <b class="g">${s1.atk}</b> · DEF ${s0.def} → <b class="g">${s1.def}</b>`);
 save();syncNPC();rp();evoReveal({img:cs(c).url,col:ELEMS[c.elem].c,title:c.tr&&st0==6?'CONSTELLATION !':'ÉVEIL !',name:c.name,from:st0==6?6:st0,to:c.st,tr:c.tr||0,trNew:st0==6,lines})}
function promote(id){openEvo(id)}
/* ---------- compétences : niveau (or ou tome), évolution de rareté (tome du rang visé) ---------- */
const skStudyK=s=>'mat_tome_'+((s.r||0)+1);
function skStudy(cid,i){const c=G.chars.find(x=>x.id==cid),s=c&&c.skills[i];if(!s||s.lv>=10)return;const k=skStudyK(s),o={[k]:1};if(!canX(o))return;payX(o);s.lv=Math.min(10,s.lv+(JMX('bibliothecaire')>=5?3:2));save();rp();toast(`${mIco(k)} ${SKILLS[s.id].n} : niveau ${s.lv}`)}
/* ---------- recettes de la Forge ----------
   fam : famille de matériaux (éveil, démantèlement) ; c : coût ; g : or ; lv : niveau de Forge requis */
const FAMM={metal:['mat_lingot','mat_mithril'],bois:['mat_bois','mat_cristal'],cuir:['mat_cuir','mat_cristal'],tissu:['mat_tissu','mat_cristal'],magie:['mat_cristal','mat_noyau'],alch:['mat_poussiere','mat_cristal']};
const RECIPES={
 epee:{fam:'metal',c:{mat_lingot:3,mat_cuir:1},g:60},hache:{fam:'metal',c:{mat_lingot:3,mat_bois:1},g:60},bouclier:{fam:'metal',c:{mat_lingot:2,mat_bois:2},g:60},dagues:{fam:'metal',c:{mat_lingot:2,mat_croc:2,mat_cuir:1},g:60},
 arc:{fam:'bois',c:{mat_bois:3,mat_tissu:1},g:60},baton:{fam:'bois',c:{mat_bois:2,mat_cristal:1},g:80},grimoire:{fam:'magie',c:{mat_cuir:1,mat_tissu:2,mat_cristal:1},g:90,lv:2},sceptre:{fam:'magie',c:{mat_lingot:1,mat_cristal:2},g:90},luth:{fam:'bois',c:{mat_bois:3,mat_tissu:1},g:60},
 lourde:{fam:'metal',c:{mat_lingot:5,mat_cuir:1},g:100,lv:2},cuir:{fam:'cuir',c:{mat_cuir:3,mat_tissu:1},g:60},cape:{fam:'tissu',c:{mat_tissu:3,mat_cuir:1},g:70},robe:{fam:'tissu',c:{mat_tissu:3,mat_cristal:1},g:80},
 potion:{fam:'alch',c:{mat_poussiere:1,food:20},g:20},elixir:{fam:'alch',c:{mat_poussiere:2,mat_cristal:1},g:40},torche:{fam:'bois',c:{mat_bois:1,mat_tissu:1},g:20},pioche:{fam:'metal',c:{mat_bois:1,mat_lingot:1},g:30},
 cle:{fam:'metal',c:{mat_lingot:2},g:40},boussole:{fam:'metal',c:{mat_lingot:1,mat_cristal:1},g:50},sablier:{fam:'magie',c:{mat_cristal:2,mat_bois:1},g:60,lv:2},relique:{fam:'magie',c:{mat_cristal:2,mat_poussiere:2},g:90,lv:3},etendard:{fam:'tissu',c:{mat_bois:1,mat_tissu:2},g:50}};
/* rareté fabriquée : poids 1★…6★ selon le niveau de Forge ; catalyseurs : poussière (+1), noyau (+2) → poids × (1 + 0,2 × bonus)^(★−1) */
const CRW=[null,[60,30,9,1,0,0],[45,35,15,4,1,0],[32,38,21,7.5,1.4,.1]];
const CRO={p:0,n:0,el:null};let LASTCR=null,FTAB='craft',ATAB='inv',iArm=0,SACSEL=null;
function crOdds(L,b,six){L=clamp(L==null?bl('forge'):L,1,3);if(b==null){b=(CRO.p?1:0)+(CRO.n?2:0)+forgeB();six=JE('forgeron')}const k=1+.2*b,w=CRW[L].map((v,i)=>v*Math.pow(k,i)*(i==5&&six?2:1)),t=w.reduce((a,v)=>a+v,0);return w.map(v=>v/t)}
function crCost(t){const R=RECIPES[t],o={};for(const k in R.c)o[k]=R.c[k];if(CRO.p)madd(o,'mat_poussiere',2);if(CRO.n)madd(o,'mat_noyau',1);if(CRO.el&&ITYPES[t].s!='outil')madd(o,'mat_essence_'+CRO.el,2);o.gold=R.g;return o}
function crRoll(p){let x=Math.random();for(let i=0;i<6;i++){x-=p[i];if(x<0)return i+1}return 1}
function craft(t){const L=bl('forge'),R=RECIPES[t];if(!L||!R||(R.lv||1)>L)return;const o=crCost(t);if(!canX(o))return;payX(o);const st=crRoll(crOdds()),el=CRO.el&&ITYPES[t].s!='outil'?CRO.el:undefined,it=mkItem(t,st,el?{el}:{});G.items.push(it);LASTCR=it.id;save();rp();
 if(st>=4)evoReveal({img:itemSrc(it),col:TIERC[st-1],title:'CHEF-D’ŒUVRE !',name:iName(it),from:0,to:st,lines:[iTxt(it)],small:1});else toast(`Forgé : <b>${iName(it)}</b> ${'★'.repeat(st)}`)}
/* affinage et fusions */
const REFS=[{n:'Fondre le minerai',i:{mat_minerai:3,gold:10},o:'mat_lingot'},{n:'Allier le mithril',i:{mat_lingot:3,mat_cristal:1,gold:60},o:'mat_mithril',lv:2},{n:'Ouvrager le bois',i:{wood:25},o:'mat_bois'},{n:'Extraire le minerai',i:{stone:30},o:'mat_minerai'},
 {n:'Tanner les crocs',i:{mat_croc:3},o:'mat_cuir'},{n:'Tisser',i:{food:25,gold:10},o:'mat_tissu'},{n:'Condenser la poussière',i:{mat_poussiere:4},o:'mat_cristal'},{n:'Broyer un noyau',i:{mat_noyau:1},o:'mat_poussiere',q:3}];
function refine(i,n){const R=REFS[i];if(!R||(R.lv||1)>bl('forge'))return;let d=0;for(let j=0;j<n&&canX(refI(R));j++){payX(refI(R));giveM({[R.o]:R.q||1});d+=R.q||1}if(d){save();rp();toast(`${mIco(R.o)} +${d} ${MATS[R.o].n}`)}}
const fuseCost=(kind,n)=>kind=='frag'?{mat_fragment:10}:{[evoKey(kind,n)]:3,shard:n,gold:Math.round(150*n*n*(1-JF.alcF(JR('alchimiste'))))};
function fuse(kind,n,times){const o=fuseCost(kind,n),out=kind=='frag'?'mat_parchemin_1':evoKey(kind,n+1);let d=0;for(let j=0;j<times&&canX(o);j++){payX(o);giveM({[out]:1});d++}if(d){save();rp();toast(`Fusion : ${mIco(out)} +${d} ${MATS[out].n}`)}}
/* ---------- éveil des équipements ---------- */
const IEVO=[null,{p:1,a:3,g:150},{p:2,a:5,g:400,s:1,x:{mat_poussiere:1}},{p:3,a:4,b:2,g:1000,s:2,x:{mat_poussiere:2}},{p:4,a:6,b:3,g:2500,s:4,x:{mat_noyau:1}},{p:5,a:8,b:4,g:6000,s:8,x:{mat_noyau:2}}];
const IMAX=[0,3,5,6];
const famOf=it=>FAMM[(RECIPES[it.t]||{fam:'metal'}).fam];
function iEvoCost(it){const M=famOf(it),o={};if(it.st<6){const E=IEVO[it.st];o['mat_pierre_'+it.st]=Math.max(1,E.p-(JE('forgeron')?1:0));madd(o,M[0],E.a);if(E.b)madd(o,M[1],E.b);for(const k in E.x||{})madd(o,k,E.x[k]);if(E.s)o.shard=E.s;o.gold=E.g;return o}const t=it.tr||0;if(t>=3)return null;o.mat_pierre_6=t+1;madd(o,'mat_noyau',3);madd(o,M[1],6);o.gold=12000*(t+1);return o}
function findIt(id){const i=G.items.find(x=>x.id==id);if(i)return{it:i};for(const c of G.chars)for(const k of SLK)if(c.eq&&c.eq[k]&&c.eq[k].id==id)return{it:c.eq[k],c};return null}
const iEvoOk=it=>{const L=bl('forge');return it.st<6?it.st+1<=IMAX[L]:L>=3&&(it.tr||0)<3};
function iEvo(id){const r=findIt(id);if(!r)return;const it=r.it,o=iEvoCost(it);if(!o||!iEvoOk(it)||!canX(o))return;if(iArm!=id){iArm=id;return rp()}iArm=0;const t0=iTxt(it),st0=it.st;payX(o);
 if(it.st<6){it.st++;const T=ITYPES[it.t];if(T.q)it.q=Math.max(it.q||0,T.q+Math.floor((it.st-1)/2));if(T.s!='outil'&&!it.el&&Math.random()<.25)it.el=pick(EK)}else it.tr=(it.tr||0)+1;
 if(r.c)upRole(r.c);save();rp();evoReveal({img:itemSrc(it),col:TIERC[it.st-1],title:st0==6?'TRANSCENDANCE !':'ÉVEIL !',name:iName(it)+(it.lv?' +'+it.lv:''),from:st0==6?6:st0,to:it.st,tr:it.tr||0,trNew:st0==6,small:1,lines:[`<span class="m">Avant :</span> ${t0}`,`<span class="g">Après :</span> ${iTxt(it)}`]})}
/* ---------- démantèlement : or réduit + matériaux de la famille de l'objet ---------- */
function dismM(it){const M=famOf(it),st=it.st,o={};madd(o,M[0],st);if(st>=3)madd(o,M[1],Math.floor((st-1)/2));if(st>=2)madd(o,'mat_poussiere',st-1);if(st>=3)madd(o,'mat_pierre_'+(st-1),1);if(it.lv)madd(o,'mat_minerai',it.lv);if(it.tr)madd(o,'mat_pierre_6',it.tr);return o}
/* ---------- icônes procédurales des ingrédients (remplacées par ASSETS[clé] dès que l'art existe) ---------- */
const MSP={};
function matSprite(k){if(MSP[k])return MSP[k];const M=MATS[k]||{ic:k,c:'#ffcf4a'},C=M.c||'#ffcf4a',g=SG(16,16),pal=[null,C,'#f2e6c9','#a08a6a','#ffffff','#4a4660','#8a5a34','#ffcf4a','#c9d2e2'];
 const ln=(x0,y0,x1,y1,id,tn)=>{const n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0))||1;for(let i=0;i<=n;i++)g.p(Math.round(lerp(x0,x1,i/n)),Math.round(lerp(y0,y1,i/n)),id,tn)};
 const pips=n=>{for(let i=0;i<n;i++)g.p(8-n+2*i,15,7,1)},ic=M.ic;
 if(ic=='parch'){g.r(4,3,8,10,2,0);g.r(2,2,3,12,2,3);g.r(11,2,3,12,2,3);g.row(2,3,3,3,1);g.row(13,12,12,3,1);for(let y=5;y<=10;y+=2)g.row(y,6,10,3,2);g.e(8,11,2,1.6,1,0);g.p(8,11,4,1);pips(M.t||1)}
 else if(ic=='pierre'){for(let y=2;y<=13;y++){const hw=y<6?y-1:Math.max(0,13-y);g.row(y,8-hw,7+hw,1,y<6?1:y>10?3:2)}ln(5,5,8,2,4,1);g.p(6,6,4,1);g.row(6,3,12,1,3);pips(M.t||1)}
 else if(ic=='tome'){g.r(3,1,10,12,1,0);g.r(3,1,2,12,1,3);g.r(5,12,8,2,2,2);g.row(13,5,12,3,2);g.e(9,6,2.4,2.4,7,0);g.p(9,6,4,1);g.row(10,6,11,1,1);pips(M.t||1)}
 else if(ic=='frag'){[[3,4,9],[4,4,10],[5,5,11],[6,4,12],[7,5,11],[8,6,12],[9,7,11],[10,7,10],[11,8,9]].forEach(([y,a,b])=>g.row(y,a,b,2,0));g.row(6,6,9,3,2);g.row(8,7,10,3,2)}
 else if(ic=='minerai'){g.e(8,9,6,5,8,0);g.e(5,11,3,2.5,8,3);g.p(6,7,1,1);g.p(10,9,1,2);g.p(7,11,1,2);g.p(11,7,6,2);g.p(9,6,4,1)}
 else if(ic=='lingot'){for(let y=6;y<=11;y++){const d=Math.floor((y-6)*.6);g.row(y,4-d,11+d,1,y==6?1:y==11?3:2)}g.row(7,5,8,4,1);g.r(1,12,14,1,1,3)}
 else if(ic=='cuir'){g.e(8,8,6,6,1,0);[[2,3],[13,3],[2,13],[13,13],[8,1],[8,15]].forEach(([x,y])=>g.p(x,y,1,2));g.e(8,8,3,3,1,3);ln(5,6,10,10,2,3)}
 else if(ic=='tissu'){g.r(2,5,10,7,1,0);g.e(12,8.5,2.4,3.5,1,1);g.e(12,8.5,1,1.4,3,2);g.row(7,3,10,4,1);g.row(10,3,10,1,3);ln(2,12,0,14,1,2)}
 else if(ic=='bois'){g.r(1,4,14,4,6,0);g.r(2,9,13,4,6,0);g.row(5,3,12,3,2);g.row(11,4,13,3,2);g.e(14,6,1.5,1.5,7,2);g.e(1.6,11,1.4,1.4,7,2)}
 else if(ic=='cristal'){const sp=(cx,top,bot,hw)=>{for(let y=top;y<=bot;y++){const w=Math.min(hw,Math.floor((y-top)*.7));g.row(y,cx-w,cx+w,1,y<top+3?1:0)}};sp(8,1,14,3);sp(4,6,14,2);sp(12,5,14,2);g.p(8,4,4,1)}
 else if(ic=='croc'){for(let y=1;y<=13;y++){const w=Math.max(0,Math.floor((13-y)*.35));const cx=Math.round(6+Math.sin(y/13*2.2)*3);g.row(y,cx-w,cx+w,2,y<4?3:0)}g.p(7,3,4,1)}
 else if(ic=='noyau'){g.e(8,8,6,6,1,0);g.e(8,8,3.5,3.5,1,1);g.e(8,8,1.6,1.6,4,1);g.p(5,5,4,1);ln(1,8,2,8,1,3);ln(14,8,15,8,1,3)}
 else if(ic=='poussiere'){g.e(8,12,6,2.5,1,0);g.e(8,10,3.5,2,1,1);[[3,4],[12,3],[8,2],[5,7],[11,7]].forEach(([x,y])=>{g.p(x,y,4,1);g.p(x-1,y,1,2);g.p(x+1,y,1,2);g.p(x,y-1,1,2);g.p(x,y+1,1,2)})}
 else if(ic=='ess'){g.e(8,10,5,5,1,0);g.e(8,10,2.5,2.5,1,1);g.p(6,8,4,1);g.r(7,2,3,3,2,2);g.row(1,6,10,6,2);for(let y=4;y<=5;y++)g.row(y,7,9,8,2)}
 else if(ic=='viande'){g.e(9,6,5,4.5,1,0);g.e(8,5,2,1.5,1,1);ln(6,9,2,13,2,0);ln(5,9,1,13,2,0);g.p(1,14,2,1);g.p(0,13,2,0);g.p(2,15,2,0);g.p(0,15,2,3)}
 else if(k=='ui_enclume'){g.r(2,5,12,3,8,0);g.r(0,5,3,2,8,1);g.r(6,8,5,3,8,3);g.r(4,11,9,3,5,0);g.row(5,4,12,4,1)}
 else if(k=='ui_evolution'){for(let y=1;y<=8;y++){const w=Math.min(y-1,5);g.row(y,8-w,7+w,7,y<3?1:0)}g.r(5,9,6,6,7,0);g.p(7,10,4,1)}
 else if(k=='ui_sac'){g.e(8,10,6,5,6,0);g.r(5,3,6,3,6,0);g.row(2,5,10,3,2);g.r(6,8,4,3,7,0);g.p(7,9,4,1)}
 else{g.e(8,8,5,5,1,0)}
 return MSP[k]=bake(g,pal)}
const MSU={};
const mSrc=k=>aSrc(k)||MSU[k]||(MSU[k]=scaleC(matSprite(k),3).toDataURL());
/* ---------- révélation animée (éveil d'un personnage, d'un objet, d'une compétence) ---------- */
function evoReveal(o){const e=$('#evo'),on=aSrc('ui_star');let st='';for(let i=0;i<o.to;i++){const nw=!o.trNew&&i>=o.from,dl=nw?1.25+.22*(i-o.from):.3+.1*i;st+=on?`<img class="${nw?'nw':''}" style="animation-delay:${dl}s" src="${on}" alt="">`:`<b class="${nw?'nw':''}" style="animation-delay:${dl}s">★</b>`}
 if(o.tr)st+=`<b class="etr${o.trNew?' nw':''}" style="animation-delay:1.25s">✦${o.tr}</b>`;
 let ps='';for(let i=0;i<30;i++){const a=i/30*6.283+rnd(-.1,.1),d=rnd(110,300);ps+=`<i style="--x:${Math.round(Math.cos(a)*d)}px;--y:${Math.round(Math.sin(a)*d)}px;background:${pick([o.col,'#ffcf4a','#fff'])};animation-delay:${(1.2+rnd(0,.35)).toFixed(2)}s"></i>`}
 e.style.setProperty('--ec',o.col);e.classList.toggle('divin',!!o.divin);e.innerHTML=`<div class="rays"></div>${o.divin?'<div class="esky"></div>':''}<div class="eps">${ps}</div><div class="ewf"></div><div class="ec"><div class="et">${o.title}</div>${o.frame?`<div class="efr"><img class="eimg sm" src="${o.img}" alt=""><img class="eframe" src="${o.frame}" alt=""></div>`:`<img class="eimg${o.small?' sm':''}" src="${o.img}" alt="">`}<b class="en">${o.name}</b><div class="est">${st}</div><div class="ed">${o.lines.join('<br>')}</div><button onclick="evoClose()">${o.btn||'Magnifique !'}</button></div>`;e.hidden=false}
function evoClose(){const e=$('#evo');e.hidden=true;e.innerHTML='';e.classList.remove('divin');rp()}
/* ---------- onglets ---------- */
const tabI=k=>`<img src="${mSrc(k)}" alt="">`;
const tabsH=(cur,list,fn)=>`<div class="tabs">${list.map(([k,n,ic])=>`<button class="${cur==k?'on':'alt'}" onclick="${fn}('${k}')">${ic?tabI(ic):''}${n}</button>`).join('')}</div>`;
const tabTop=()=>{const t=document.querySelector('#pin .tabs');if(t)$('#pin').scrollTop=Math.max(0,t.offsetTop-70)};
function setFT(k){FTAB=k;iArm=0;rp();tabTop()}function setAT(k){ATAB=k;evArm=0;rp();tabTop()}
const plotOf=k=>G.plots.findIndex(p=>p&&p.k==k);
/* ---------- Sac : inventaire des ingrédients ---------- */
function openSac(){openPanel(()=>{const tot=MK.reduce((a,k)=>a+mN(k),0);let h=`<p class="m">Ingrédients rapportés de la Tour, des coffres, des invocations et du démantèlement. Touchez un ingrédient pour voir son usage et où le trouver.</p><p class="resl">${['food','wood','stone','gold','shard'].map(chip).join(' ')}</p>`;
 const sel=SACSEL&&MATS[SACSEL]?SACSEL:null;if(sel){const M=MATS[sel];h+=`<div class="mdet" style="--rc:${M.c}"><img src="${mSrc(sel)}" alt=""><div class="gr"><b>${M.n}</b> <span class="m">× ${mN(sel)}${capped(sel)?' / '+capOf(sel):''}</span><div>${M.d}</div><div class="m">Où le trouver : ${M.s}</div></div></div>`}
 const ab=plotOf('auberge'),fo=plotOf('forge');h+=`<p>${ab>=0?`<button class="alt" onclick="ATAB='autel';openB(${ab})">${tabI('ui_evolution')} Autel d’éveil</button> `:''}${fo>=0?`<button class="alt" onclick="FTAB='craft';openB(${fo})">${tabI('ui_enclume')} Forge</button>`:'<span class="m">Construisez une Forge pour fabriquer et éveiller l’équipement.</span>'}</p>`;
 for(const g in MGR){const ks=MK.filter(k=>MATS[k].g==g),n=ks.reduce((a,k)=>a+mN(k),0);h+=`<h3 class="sh mh">${tabI(MGR[g][1])}${MGR[g][0]} <span class="m">(${n})</span></h3><div class="mgrid">${ks.map(k=>{const M=MATS[k],q=mN(k);return`<div class="mt${q?'':' z'}${sel==k?' on':''}" style="--rc:${M.c}" onclick="SACSEL='${k}';rp()" title="${M.n}"><img src="${mSrc(k)}" alt=""><b class="q">${q}</b><span>${M.n.replace('Parchemin d’évolution','Parchemin').replace('Tome de compétence','Tome')}</span></div>`}).join('')}</div>`}
 return[`Sac · ${tot} ingrédient${tot>1?'s':''}`,h]})}
/* ---------- Autel d'éveil (Auberge) : évolution des personnages, fusions ---------- */
function evoNeed(c){return cEvoReady(c)?'<span class="g">niveau max. ✓</span>':c.lv>=cap(c)?'<span class="w">forme divine requise</span>':`<span class="w">niv. ${c.lv}/${cap(c)} requis</span>`}
function autelHTML(){let h=`<p class="m">Au niveau maximal de son rang (10 × étoiles), un personnage s’éveille d’une étoile grâce aux <b>parchemins d’évolution</b> de son rang, aux <b>essences</b> de son élément et à de l’or : niveau maximal +10, statistiques de base renforcées, un <b>nœud d’étoile</b> dans son arbre, les nœuds de la bande suivante révélés, sa <b>réserve d’expérience</b> rendue et ${Math.round(SUBP*100)} % de chances d’un nouveau sous-trait. Les 6★ divins (niv. 60) gagnent ensuite des <b>Constellations</b> (✦) avec des parchemins ★6.</p>`;
 const L=G.chars.filter(c=>cEvoCost(c)).sort((a,b)=>(cEvoReady(b)&&canX(cEvoCost(b)))-(cEvoReady(a)&&canX(cEvoCost(a)))||b.lv/cap(b)-a.lv/cap(a));
 h+=L.map(c=>{const o=cEvoCost(c),ok=c.lv>=cap(c)&&canX(o);return`<div class="row${ok?' rdy':''}"><img class="sp" src="${cs(c).url}" alt=""><div class="gr"><b>${c.name}</b> ${stars(c.st)}${c.tr?`<span class="trk">✦${c.tr}</span>`:''} <span class="m">→</span> ${c.st<6?stars(c.st+1):`<span class="trk">✦${(c.tr||0)+1}</span>`}<div class="m">${evoNeed(c)} · ${ELEMS[c.elem].n}</div><div>${costX(o)}</div></div><button class="${ok?'':'alt'}" onclick="openEvo(${c.id})">${ok?'Éveiller':'Détails'}</button></div>`}).join('')||'<p>Aucun personnage ne peut encore s’éveiller.</p>';
 h+=`<h3 class="sh mh">${tabI('mat_parchemin_2')}Fusion</h3><p class="m">Trois ingrédients d’un rang se fondent en un seul du rang supérieur (contre des éclats et de l’or). Dix fragments se relient en un parchemin ★1.</p>`+fuseRow('frag',0);
 for(let n=1;n<=5;n++)h+=fuseRow('parchemin',n);for(let n=1;n<=4;n++)h+=fuseRow('tome',n);return h}
function fuseRow(kind,n){const o=fuseCost(kind,n),out=kind=='frag'?'mat_parchemin_1':evoKey(kind,n+1),k=Object.keys(o).find(isM),mx=Math.floor(mN(k)/o[k]);return`<div class="row fu"><img class="mi big" src="${mSrc(k)}" alt=""><span class="m">→</span><img class="mi big" src="${mSrc(out)}" alt=""><div class="gr"><b>${MATS[out].n}</b><div>${costX(o)}</div></div><button ${canX(o)?'':'disabled'} onclick="fuse('${kind}',${n},1)">Fusionner</button>${mx>1?`<button class="alt" ${canX(o)?'':'disabled'} onclick="fuse('${kind}',${n},${mx})">×${mx}</button>`:''}</div>`}
function openEvo(id){evArm=0;openPanel(()=>{const c=G.chars.find(x=>x.id==id);if(!c)return['Éveil','<p>Personnage introuvable.</p>'];const o=cEvoCost(c),ab=plotOf('auberge');
 let h=`<p><button class="alt" onclick="openSheet(${c.id})">← Fiche</button> ${ab>=0?`<button class="alt" onclick="ATAB='autel';openB(${ab})">Autel d’éveil</button>`:''} <button class="alt" onclick="openSac()">${tabI('ui_sac')} Sac</button></p>`;
 if(!o)return[`Éveil · ${c.name}`,h+`<div class="row"><img class="sp" src="${cs(c).url}" alt=""><div class="gr"><b>${c.name}</b> ${stars(c.st)}<span class="trk">✦${c.tr||0}</span><p class="g">Puissance ultime atteinte : rien ne peut plus l’éveiller.</p></div></div>`];
 const s0=stats(c),nb=evoBase(c),k=x=>nb[x]/c.b[x],tr=c.st>=6,cap1=cap(c)+(tr?0:10),ok=cEvoReady(c),can0=canX(o);
 h+=`<div class="evh" style="--ec:${ELEMS[c.elem].c}"><div class="evp"><img src="${cs(c).url}" alt=""></div><div class="gr"><b class="bl">${c.name}</b><div class="evs">${stars(c.st,0,1)}${c.tr?`<span class="trk">✦${c.tr}</span>`:''}<span class="arr">➜</span>${tr?`${stars(6,0,1)}<span class="trk">✦${(c.tr||0)+1}</span>`:stars(c.st+1,0,1)}</div><div class="m">${c.race} · ${c.pers} · ${elc(c.elem)}</div></div></div>`;
 h+=`<h3 class="sh">Condition</h3><p>${ok?`<span class="g">✓ Niveau maximal atteint (${c.lv}/${cap(c)})</span>`:tr&&c.lv>=60?'<span class="w">✗ Forme divine requise (choix d’éveil du niv. 40 en attente ?)</span>':`<span class="w">✗ Atteindre le niveau ${cap(c)} (actuel : ${c.lv})</span> <span class="m">— entraînez-le au Camp ou dans la Tour.</span>`}</p>`;
 h+=`<h3 class="sh">Gains</h3><ul class="eff">${tr?`<li>Constellation <b class="g">${(CONST[c.tr||0]||CONST[2])[0]}</b> : ${(CONST[c.tr||0]||CONST[2])[1]}</li>`:`<li>Niveau maximal : ${cap(c)} <span class="nx">→ ${cap1}</span></li>`}<li>PV ${s0.hp} <span class="nx">→ ${Math.round(s0.hp*k('hp'))}</span> · ATQ ${s0.atk} <span class="nx">→ ${Math.round(s0.atk*k('atk'))}</span> · DEF ${s0.def} <span class="nx">→ ${Math.round(s0.def*k('def'))}</span> <span class="m">(au niveau actuel)</span></li>${tr?'':`<li>Nœud d’étoile au niv. ${cap(c)} (familles favorisées : ${famPct(c).slice(0,2).map(([f])=>FAM[f].n.toLowerCase()).join(', ')}) et nœuds des niv. ${cap(c)+1}–${cap1} révélés</li><li>Réserve d’expérience rendue : <b class="g">${c.xpBank||0}</b> exp.</li>`}<li>${c.subs.length<3?`${Math.round(SUBP*100)} % de chances d’un nouveau sous-trait`:'Sous-traits au complet (3)'}</li><li class="m">Race, personnalité et équipement sont conservés.</li></ul>`;
 h+=`<h3 class="sh">Ingrédients</h3><div class="up">${costX(o)}<button class="${evArm==c.id?'red':'ib hot'}" ${ok&&can0?'':'disabled'} onclick="doEvo(${c.id})">${evArm==c.id?'Confirmer l’éveil ? (ingrédients consommés)':tr?'Transcender ✦':'Éveiller → '+(c.st+1)+'★'}</button></div>${can0?'':'<p class="m">Ingrédients manquants en rouge : explorez la Tour (quêtes et boss), ouvrez des coffres ou fusionnez à l’Autel d’éveil.</p>'}`;
 return[`Éveil · ${c.name}`,h]})}
/* ---------- Forge : fabrication, affinage, éveil, renfort ---------- */
function oddsH(p){return`<div class="odds">${p.map((v,i)=>v>0?`<span style="width:${(v*100).toFixed(2)}%;background:${TIERC[i]}" title="${i+1}★ ${pcF(v)}">${v>.07?(i+1)+'★':''}</span>`:'').join('')}</div><div class="oddl">${p.map((v,i)=>`<span style="color:${TIERC[i]}">${i+1}★ <b>${pcF(v)}</b></span>`).join('')}</div>`}
const pcF=v=>v<=0?'0 %':v<.001?'<0,1 %':v<.1?(v*100).toFixed(1).replace('.',',')+' %':Math.round(v*100)+' %';
function forgeHTML(pl){const L=pl.lv;let h=tabsH(FTAB,[['craft','Fabriquer','ui_enclume'],['refine','Affiner','mat_lingot'],['eveil','Éveil','ui_evolution'],['renf','Renforcer','item_epee'],['hammer','Marteau','item_epee']],'setFT');
 if(FTAB=='craft'){const p=crOdds(),ess=EK.filter(e=>mN('mat_essence_'+e)>=2||CRO.el==e),last=LASTCR&&findIt(LASTCR);
  h+=`<p class="m">Fabriquez n’importe quel équipement. La rareté est tirée au hasard : une Forge plus haute et des <b>catalyseurs</b> l’améliorent. Une <b>essence</b> (×2) impose l’élément d’une arme ou d’une armure.</p>`;
  if(last)h+=`<div class="row lastc r${last.it.st}"><img class="sp ic r${last.it.st}" src="${itemSrc(last.it)}" alt=""><div class="gr"><span class="m">Dernière fabrication</span><br><b>${iName(last.it)}</b> ${stars(last.it.st)}<div class="m">${iTxt(last.it)}</div></div></div>`;
  h+=`<div class="crop"><div><b>Catalyseurs</b> <button class="${CRO.p?'on':'alt'}" onclick="CRO.p^=1;rp()">${mIco('mat_poussiere')} Poussière ×2 <small>(+1)</small></button> <button class="${CRO.n?'on':'alt'}" onclick="CRO.n^=1;rp()">${mIco('mat_noyau')} Noyau ×1 <small>(+2)</small></button></div><div><b>Élément</b> <button class="${CRO.el?'alt':'on'}" onclick="CRO.el=null;rp()">Aucun</button> ${ess.map(e=>`<button class="${CRO.el==e?'on':'alt'}" onclick="CRO.el='${e}';rp()">${mIco('mat_essence_'+e)}${ELEMS[e].n}</button>`).join(' ')}${ess.length?'':'<span class="m">(2 essences d’un élément requises)</span>'}</div><div class="m">Chances de rareté (Forge niv. ${L}${CRO.p||CRO.n?', catalyseurs':''}) :</div>${oddsH(p)}</div>`;
  h+=`<div class="rgrid">${Object.keys(RECIPES).map(t=>{const R=RECIPES[t],T=ITYPES[t],o=crCost(t),lk=(R.lv||1)>L,ok=!lk&&canX(o);return`<div class="rcd${ok?' ok':''}"><div class="hd"><img src="${itemSrc({t,st:1})}" alt=""><div><b>${T.n}</b><div class="m">${SLOTS[T.s]}${T.role?' · '+ROLES[T.role].n:''}</div></div></div><div>${costX(o)}</div><button class="ib${ok?' hot':''}" ${ok?'':'disabled'} onclick="craft('${t}')">${lk?'Forge niv. '+R.lv+' requise':'Fabriquer'}</button></div>`}).join('')}</div>`}
 else if(FTAB=='hammer')h+=hammerHTML(L);
 else if(FTAB=='refine'){h+=`<p class="m">Transformez les matières brutes : minerai en lingots, bois et pierre du village en matériaux de forge, crocs en cuir…</p><p class="resl">${['food','wood','stone','gold'].map(chip).join(' ')}</p>`+REFS.map((R,i)=>{const RI=refI(R),lk=(R.lv||1)>L,ok=!lk&&canX(RI),mx=Math.min(10,Math.floor(Math.min(...Object.keys(RI).map(k=>haveX(k)/RI[k]))));return`<div class="row fu"><div class="gr"><b>${R.n}</b><div>${costX(RI)} <span class="m">→</span> ${mIco(R.o)} <b>${R.q||1}</b> ${MATS[R.o].n} <span class="m">(${mN(R.o)})</span></div></div><button ${ok?'':'disabled'} onclick="refine(${i},1)">${lk?'Forge niv. '+R.lv:'Affiner'}</button>${!lk&&mx>1?`<button class="alt" onclick="refine(${i},${mx})">×${mx}</button>`:''}</div>`}).join('')}
 else if(FTAB=='eveil'){const all=G.items.map(it=>({it})).concat(...G.chars.map(c=>SLK.filter(k=>c.eq&&c.eq[k]).map(k=>({it:c.eq[k],c})))).filter(x=>iEvoCost(x.it)).sort((a,b)=>(canX(iEvoCost(b.it))&&iEvoOk(b.it))-(canX(iEvoCost(a.it))&&iEvoOk(a.it))||(b.c?1:0)-(a.c?1:0)||b.it.st-a.it.st);
  h+=`<p class="m">Une <b>pierre d’éveil</b> du rang de l’objet, des matériaux de sa famille et de l’or l’élèvent d’une étoile (niveau de renfort conservé, 25 % de chances d’un élément s’il n’en a pas). Éveil possible jusqu’à <b>${IMAX[L]}★</b> avec cette Forge${L<3?' (améliorez-la pour aller plus haut)':' ; transcendance ✦ des objets 6★'}.</p>`;
  h+=all.map(({it,c})=>{const o=iEvoCost(it),gate=iEvoOk(it),ok=gate&&canX(o);return`<div class="row${ok?' rdy':''}"><img class="sp ic r${it.st}" src="${itemSrc(it)}" alt=""><div class="gr"><b>${iName(it)}${it.lv?' +'+it.lv:''}</b> ${stars(it.st)}${it.tr?`<span class="trk">✦${it.tr}</span>`:''} <span class="m">→</span> ${it.st<6?stars(it.st+1):`<span class="trk">✦${(it.tr||0)+1}</span>`} <span class="m">${c?'porté par '+c.name:'en réserve'}</span><div>${costX(o)}</div></div><button class="${iArm==it.id?'red':ok?'':'alt'}" ${ok?'':'disabled'} onclick="iEvo(${it.id})">${!gate?'Forge niv. '+(it.st+1<=5?2:3)+' requise':iArm==it.id?'Confirmer ?':'Éveiller'}</button></div>`}).join('')||'<p>Aucun objet à éveiller.</p>';
  h+=`<h3 class="sh mh">${tabI('mat_pierre_2')}Fusion des pierres</h3>`;for(let n=1;n<=5;n++)h+=fuseRow('pierre',n)}
 else h+=`<p class="m">La Forge renforce l’arme équipée : chaque niveau ajoute 8 % d’attaque. Niveau d’arme maximal : ${3*L+fRf()}.</p>`+G.chars.map(c=>{const it=c.eq.arme,w=it?it.lv||0:0,o2={stone:30*(w+1),gold:40*(w+1)};return`<div class="row"><img class="sp" src="${cs(c).url}" alt="">${it?`<img class="sp ic r${it.st}" style="width:40px;height:40px" src="${itemSrc(it)}" alt="">`:''}<div class="gr"><b>${c.name}</b> <span class="m">${it?iName(it)+' +'+w:'à mains nues : équipez une arme'}</span>${it?`<div>${costX(o2)}</div>`:''}</div><button class="ib" ${!it||w>=3*L+fRf()||!can(o2)?'disabled':''} onclick="forge(${c.id})">Forger</button></div>`}).join('');
 return h}
