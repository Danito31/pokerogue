'use strict';
/* ================= GALAXIE SOLO (bible §2.2, §16 ; docs/galaxie.md) =================
   Une galaxie-serveur générée (graine par sauvegarde) de planètes PNJ. Tout accès aux AUTRES planètes passe par
   le fournisseur GP (interface GalaxyProvider, implémentée ici en local : LocalGalaxy) pour qu'un vrai serveur
   multijoueur puisse le remplacer sans toucher à l'interface (voir docs/galaxie.md §9).
   État : G.gal {seed, planets[], ship{at, tr, cargo}, log[], nr{next, inc}, prot, prison[], lost[], st{}} · migration G.v_gal.
   Accès : bateau G.ship prêt (baptême) ET piloté par un mage ; avant : vue verrouillée (aperçu).
   Pillage, capture, prison et défense : js/raids.js (chargé juste après). */
const GAL={N:16,TS:1,W:960,H:540,PX:40,MIN_UA:2.5,FOOD_UA:8,ESS_UA:4,EXP_CD:20,WAND_P:4*3600000,RESTOCK_P:3600000,GIFT_CD:20};
/* biomes des planètes (art planete_1..10) → biome de la Tour utilisé pour l'exploration et le décor des combats */
const GBIO=[null,
 {n:'Monde forestier',bk:'foret',sells:['wood','food','mat_bois','mat_cuir','mat_essence_nature'],buys:['stone','mat_lingot','mat_cristal']},
 {n:'Monde désertique',bk:'desert',sells:['stone','mat_minerai','mat_essence_feu','mat_croc'],buys:['food','wood','mat_tissu']},
 {n:'Monde de glace',bk:'givre',sells:['mat_tissu','mat_essence_glace','mat_cristal','mat_viande'],buys:['wood','mat_essence_feu','food']},
 {n:'Monde volcanique',bk:'cendre',sells:['mat_lingot','mat_minerai','mat_essence_feu','mat_noyau'],buys:['food','mat_essence_glace','mat_bois']},
 {n:'Monde océanique',bk:'foret',sells:['food','mat_viande','mat_poussiere','mat_essence_foudre'],buys:['wood','stone','mat_lingot']},
 {n:'Monde de cristal',bk:'cristal',sells:['mat_cristal','mat_essence_arcane','mat_mithril','mat_poussiere'],buys:['food','mat_cuir','mat_bois']},
 {n:'Monde des ruines',bk:'ruines',sells:['mat_parchemin_1','mat_essence_sacre','mat_pierre_1','stone'],buys:['food','mat_lingot','mat_cuir']},
 {n:'Géante annelée',bk:'desert',sells:['mat_essence_foudre','mat_minerai','mat_fragment','mat_cristal'],buys:['food','wood','mat_tissu']},
 {n:'Monde crépusculaire',bk:'cristal',sells:['mat_essence_ombre','mat_tome_1','mat_poussiere','mat_noyau'],buys:['food','mat_essence_sacre','mat_cuir']},
 {n:'Monde doré',bk:'ruines',sells:['gold','mat_essence_sacre','mat_pierre_1','mat_mithril'],buys:['food','wood','mat_cristal']}];
const GSYL=[['Ar','Bel','Cor','Dra','El','Fen','Gal','Hel','Ith','Kor','Lun','Mor','Nym','Or','Pyr','Quel','Ryn','Syl','Tar','Ul','Vel','Xer','Zan','Aub','Cael','Mira'],['dor','mire','thys','vane','gard','lune','rak','sis','thar','wen','zir','nor','phée','dis','bel','ion','ora','yth']];
const GTIT=['Archonte','Capitaine','Régent','Doyen','Souverain','Gardien'];
/* humeur de base du dirigeant selon sa personnalité (docs/personnalites.md) : attitude, riposte, goût des présents */
const GPERS={Altruiste:{a:20,r:-.2,g:{all:1.2}},Opportuniste:{a:10,r:0,g:{gold:1.2}},Curieux:{a:10,r:-.05,g:{mat:1.5}},Gourmand:{a:5,r:0,g:{food:2}},Stoïque:{a:0,r:-.15,g:{}},Calculateur:{a:-5,r:.05,g:{gold:1.1}},Ambitieux:{a:-15,r:.15,g:{all:.8}},Impulsif:{a:-10,r:.25,g:{}},'Égoïste':{a:-20,r:.1,g:{gold:1.5}}};
/* graine : remplace Math.random le temps de la génération (mk, pick, ri… restent ceux du jeu) */
function galRng(seed){let a=seed>>>0;return()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function galSeeded(seed,fn){const R0=Math.random;Math.random=galRng(seed);try{return fn()}finally{Math.random=R0}}
/* ---------- puissance (comparaisons lisibles) ---------- */
function cPow(c){try{const s=stats(c);return Math.round(s.hp/6+s.atk*2+s.def*1.5+s.spd)}catch(_){return 0}}
const partyPow=()=>party().reduce((a,c)=>a+cPow(c),0);
function galLv(){const L=G.chars.map(c=>c.lv|0).sort((a,b)=>b-a).slice(0,4);return Math.max(5,Math.round(L.reduce((a,v)=>a+v,0)/Math.max(1,L.length)))}
/* génère un personnage PNJ sans l'ajouter au codex du joueur */
function galMk(st,o){const co=codexOwn;codexOwn=()=>{};try{const c=mk(st,o||{});c.party=0;c.lock=0;c.job=null;c.lvk=Math.round(rnd(.85,1.1)*100)/100;return c}finally{codexOwn=co}}
const galAttk=p=>p.att+3*repOf(p.fac);
const galAtt=p=>clamp(Math.round(galAttk(p)),-100,100);
const attK=v=>v>=60?'allie':v>=30?'ami':v<=-30?'hostile':'neutre';
const ATTN={allie:['Allié','#5fe07a'],ami:['Amical','#9fe07a'],neutre:['Neutre','#d0cce0'],hostile:['Hostile','#ff5a5a']};
const attTag=p=>{const v=galAtt(p),k=attK(v);return`<span class="tg gatt" style="border-color:${ATTN[k][1]};color:${ATTN[k][1]}">${ATTN[k][0]} ${v>0?'+':''}${v}</span>`};
/* ---------- génération ---------- */
function galGen(seed){return galSeeded(seed,()=>{const P=[],cx=GAL.W/2,cy=GAL.H/2,names=new Set();let tr=0;
 while(P.length<GAL.N&&tr++<20000){const a=rnd(0,6.283),r=Math.sqrt(rnd(.08,1)),x=Math.round(cx+Math.cos(a)*r*420),y=Math.round(cy+Math.sin(a)*r*228);if(x<40||y<40||x>GAL.W-40||y>GAL.H-46)continue;if(Math.hypot(x-cx,y-cy)<110)continue;if(P.some(q=>Math.hypot(q.x-x,q.y-y)<92))continue;P.push({x,y})}
 const rk=P.map(q=>Math.hypot(q.x-cx,q.y-cy)).map((d,i,a)=>a.filter(v=>v<d).length);
 return P.map((q,i)=>{let n;do n=pick(GSYL[0])+pick(GSYL[1]);while(names.has(n));names.add(n);const art=1+(i%10),B=GBIO[art],d=Math.hypot(q.x-cx,q.y-cy),tier=Math.round(clamp(.55+.9*rk[i]/(P.length-1)+rnd(-.08,.08),.5,1.5)*100)/100,vil=clamp(Math.round(1+tier*2.7),1,5);
  const own=galMk(clamp(Math.round(2+tier*1.8+rnd(-.5,.5)),2,6),{name:pick(GTIT)+' '+pick(NOMS)});own.lvk=1.05;
  const nc=2+Math.min(4,vil),chars=[];for(let k=0;k<nc;k++)chars.push(galMk(clamp(Math.round(1.3+tier*1.6+rnd(-1,1)),1,5)));
  const p={id:i+1,n,art,bk:B.bk,bn:B.n,x:q.x,y:q.y,tier,vil,fac:pick(FK2),own,chars,att:clamp(Math.round((GPERS[own.pers]||{a:0}).a+rnd(-20,20)),-60,60),pm:Math.round(rnd(.85,1.25)*100)/100,disc:0,vis:0,lastR:0,shield:0,exp:0,gift:0,rest:Date.now(),wand:null,stock:{}};
  p.cap=galCap(p);for(const k in p.cap)p.stock[k]=Math.round(p.cap[k]*rnd(.55,.9));return p})})}
/* capacité de stockage d'une planète (biens accessibles au commerce et au pillage) */
function galCap(p){const v=p.vil,o={food:400*v,wood:450*v,stone:450*v,gold:Math.round(250*v*(1+p.tier))};GBIO[p.art].sells.forEach(k=>{if(k in o)o[k]=Math.round(o[k]*1.6);else o[k]=isM(k)?Math.max(2,Math.round(v*(VAL[k]>=100?1.2:VAL[k]>=30?4:9))):o[k]});return o}
const galPos=at=>at=='home'||!at?{x:GAL.W/2,y:GAL.H/2}:galP(at);
const galP=id=>G.gal&&G.gal.planets.find(p=>p.id==id)||null;
const galDist=(a,b)=>{const A=galPos(a),B2=galPos(b);return Math.hypot(A.x-B2.x,A.y-B2.y)/GAL.PX};
const galUA=v=>(Math.round(v*10)/10+'').replace('.',',')+' ua';
/* mise à l'échelle des PNJ sur la progression du joueur (recalculée quand le niveau de référence change) */
function galScale(p){const L=galLv();if(p.sl==L)return;p.sl=L;[p.own].concat(p.chars).forEach(c=>{c.lv=clamp(Math.round(L*p.tier*(c.lvk||1)),1,cap(c));c.xp=0;try{if(!c.cls)initProg(c,1)}catch(_){}});p.def=galDefOf(p)}
function galDefOf(p){return Math.round((60*Math.pow(p.vil,1.5)+p.chars.filter(c=>!c.gxdown).slice(0,p.vil).reduce((a,c)=>a+c.lv*c.st*2,0))*(1+.1*(p.vil-1)))}
const galProt=p=>Math.round((.25+.08*p.vil)*100)/100;
const galPow=p=>{galScale(p);return galDefenders(p).reduce((a,c)=>a+cPow(c),0)};
function galDefenders(p){return[p.own].concat(p.chars.filter(c=>!c.gxdown).sort((a,b)=>cPow(b)-cPow(a)).slice(0,Math.min(3,p.vil)))}
/* ---------- état, migration ---------- */
const galOpen=()=>!!(G&&G.ship&&G.ship.ready&&typeof pilotOf=='function'&&pilotOf());
function galEnsure(){if(!G)return null;if(!G.gal||typeof G.gal!='object'){G.gal={seed:(Math.random()*2147483647)|0}}const Q=G.gal;if(!(Q.seed>0))Q.seed=1+((Math.random()*2147483646)|0);
 if(!Array.isArray(Q.log))Q.log=[];if(!Array.isArray(Q.prison))Q.prison=[];if(!Array.isArray(Q.lost))Q.lost=[];if(!Q.st||typeof Q.st!='object')Q.st={};if(!Q.nr||typeof Q.nr!='object')Q.nr={next:0,inc:null};
 if(!Q.ship||typeof Q.ship!='object')Q.ship={at:'home',tr:null,cargo:{}};if(!Q.ship.cargo||typeof Q.ship.cargo!='object')Q.ship.cargo={};if(!Array.isArray(Q.ship.cargo.items))Q.ship.cargo.items=[];
 if(!Array.isArray(Q.planets)||!Q.planets.length){if(G.ship&&G.ship.ready){Q.planets=galGen(Q.seed);galLog('disc','La longue-vue astrale s’ouvre sur la galaxie : '+Q.planets.length+' planètes gravitent autour de votre monde.')}else Q.planets=[]}
 if(Q.ship.at!='home'&&!galP(Q.ship.at))Q.ship.at='home';if(Q.ship.tr&&(!(Q.ship.tr.t0>0)||(Q.ship.tr.to!='home'&&!galP(Q.ship.tr.to))))Q.ship.tr=null;return Q}
function galMigrate(){if(!G)return;if(!G.v_gal){try{if(!localStorage.getItem('tdE6_vg_bak')){const o=localStorage.getItem(SKEY);if(o)localStorage.setItem('tdE6_vg_bak',o)}}catch(_){}G.v_gal=1}galEnsure()}
function galLog(k,txt){const Q=G.gal;if(!Q||!Array.isArray(Q.log))return;Q.log.unshift({t:Date.now(),k,txt});if(Q.log.length>120)Q.log.length=120}
/* ================= FOURNISSEUR DE GALAXIE (interface) =================
   list()/get(id) : lecture synchrone du cache (ce qu'un client garde de la dernière réponse serveur).
   Les opérations qui modifient une AUTRE planète sont asynchrones : un serveur les arbitrerait (voir docs/galaxie.md §9). */
const LocalGalaxy={kind:'local',
 list(){const Q=galEnsure();return Q?Q.planets:[]},
 get(id){return galP(id)},
 async trade(id,o){return galTradeL(id,o)},
 async gift(id,o){return galGiftL(id,o)},
 async recruit(id){return galRecruitL(id)},
 async raidPrep(id){return galRaidPrepL(id)},
 async raidResolve(id,out){return galRaidResolveL(id,out)},
 async incoming(){return G.gal.nr.inc},
 async defendResolve(inc,D){return galDefendL(inc,D)},
 async ransom(id,cid){return galRansomL(id,cid)},
 tick(now){galWorld(now)}};
let GP=LocalGalaxy;
/* ---------- découverte (brouillard) : portée de la Longue-vue autour du village et de la position du bateau ---------- */
const galRange=()=>2+1.5*shipStats().det;
function galDiscover(from){const Q=G.gal,R=galRange(),o=galPos(from);let n=0;Q.planets.forEach(p=>{if(!p.disc&&Math.hypot(p.x-o.x,p.y-o.y)/GAL.PX<=R){p.disc=1;n++;galLog('disc',`Planète découverte : <b>${p.n}</b> (${p.bn}).`)}});return n}
/* ---------- monde : réapprovisionnement, vagabonds, défenseurs remplacés ---------- */
function galWorld(now){const Q=G.gal;if(!Q||!Q.planets.length)return;Q.planets.forEach(p=>{const k=Math.floor((now-(p.rest||now))/GAL.RESTOCK_P);if(k<1)return;p.rest+=k*GAL.RESTOCK_P;const f=1-Math.pow(.65,Math.min(k,24));for(const x in p.cap)p.stock[x]=Math.round((p.stock[x]||0)+(p.cap[x]-(p.stock[x]||0))*f);
  p.chars.forEach(c=>{if(c.gxdown&&now>c.gxdown)delete c.gxdown});const want=2+Math.min(4,p.vil);while(p.chars.length<want){p.chars.push(galMk(clamp(Math.round(1.3+p.tier*1.6+rnd(-1,1)),1,5)));p.sl=0}})}
/* ================= DÉPLACEMENTS ================= */
const shipBusy=()=>!!(G.gal&&G.gal.ship.tr);
function galFuel(d,kind){const p=pilotOf(),nat=p&&p.mage=='Naturelle';if(kind=='ess')return{n:Math.max(1,Math.ceil(d/GAL.ESS_UA))};return{food:Math.ceil(GAL.FOOD_UA*d*(nat?.75:1))}}
function galEssKey(n){const ks=['mat_essence_arcane','mat_essence_foudre'].sort((a,b)=>mN(b)-mN(a));return mN(ks[0])>=n?ks[0]:null}
function galTime(d,kind){return Math.round(d*GAL.MIN_UA*60000/shipStats().spd*(kind=='ess'?.8:1)*GAL.TS)}
function galCanGo(to){const Q=G.gal,S=Q.ship,p=pilotOf();if(!galOpen())return'Bateau non prêt';if(S.tr)return'Le bateau est déjà en route';if(S.at==to)return'Le bateau y est déjà';if(!p)return'Aucun pilote';if(p.inj)return`Le pilote ${p.name} est blessé`;if(p.party&&mode!='village')return'Le pilote est en expédition';return''}
function galGo(to,kind){const Q=galEnsure(),S=Q.ship,why=galCanGo(to);if(why)return toast(why);const d=galDist(S.at,to),fu=galFuel(d,kind);let paid;
 if(kind=='ess'){const ek=galEssKey(fu.n);if(!ek)return toast(`Il faut ${fu.n} essence(s) arcanique ou de foudre.`);paid={[ek]:fu.n}}else{if(G.res.food<fu.food)return toast(`Il faut ${fu.food} vivres.`);paid={food:fu.food}}payX(paid);
 const st=shipStats(),risk=galRisk(S.at,to,st);S.tr={from:S.at,to,t0:Date.now(),d:galTime(d,kind),ua:Math.round(d*10)/10,ic:Math.random()<risk?1:0,risk:Math.round(risk*1000)/1000,fuel:paid};
 const dn=to=='home'?'le village':galP(to).n;galLog('travel',`Départ vers <b>${dn}</b> (${galUA(d)}, ${mgT(S.tr.d)}) — ${kind=='ess'?mTxt(paid):paid.food+' vivres'}.`);Q.st.trips=(Q.st.trips||0)+1;save();hud();if(PF)rp();toast(`Le bateau met le cap sur ${dn} : arrivée dans ${mgT(S.tr.d)}.`)}
/* interception en route : planètes hostiles proches du trajet, réduite par le camouflage */
function segD(px,py,ax,ay,bx,by){const dx=bx-ax,dy=by-ay,l=dx*dx+dy*dy,t=l?clamp(((px-ax)*dx+(py-ay)*dy)/l,0,1):0;return Math.hypot(px-(ax+dx*t),py-(ay+dy*t))}
function galRisk(from,to,st){const A=galPos(from),B2=galPos(to);let r=0;G.gal.planets.forEach(p=>{if(p.id==to||p.id==from||galAtt(p)>-30)return;if(segD(p.x,p.y,A.x,A.y,B2.x,B2.y)/GAL.PX<2.5)r+=.12});return Math.min(.4,r)*(1-(st||shipStats()).cam/100)}
function galArrive(now){const Q=G.gal,S=Q.ship,T=S.tr;if(!T||now<T.t0+T.d)return;S.tr=null;S.at=T.to;const dn=T.to=='home'?'le village':galP(T.to).n;let msg=`Le bateau est arrivé : <b>${dn}</b>.`;
 if(T.ic){const st=shipStats(),need=Math.round((80+12*(G.max||1))*rnd(.7,1.3)),sac=(pilotOf()||{}).mage=='Sacrée';if(st.prot+partyPow()/20>=need){msg+=' Des pillards ont tenté une interception : le bouclier les a repoussés.';galLog('travel','Interception repoussée en route vers '+dn+'.')}else{const lost=galCargoCut(sac?.15:.25);msg+=` <span class="w">Interception en route : ${lost||'rien de précieux'} perdu.</span>`;galLog('travel',`Interception en route vers ${dn} : ${lost||'soutes vides, rien de perdu'}.`)}}
 if(T.to=='home'){const u=galUnload();if(u)msg+=' Soutes déchargées : '+u;}else{const p=galP(T.to);p.vis=(p.vis||0)+1;p.disc=1}
 const n=galDiscover(T.to);if(n)msg+=` ${n} planète${n>1?'s':''} découverte${n>1?'s':''}.`;galLog('travel',msg);toast(msg,4200);save();hud();if(PF)try{rp()}catch(_){}}
/* ---------- soutes (Stockage du bateau) ---------- */
const galU=(k,n)=>k=='gold'?n/25:isM(k)?n*(VAL[k]>=100?3:1):n/10;
function cargoUsed(){const C=G.gal.ship.cargo;let u=0;for(const k in C)if(k!='items')u+=galU(k,C[k]);return Math.round(u+5*C.items.length)}
const cargoFree=()=>Math.max(0,shipStats().cap-cargoUsed());
function cargoAdd(o,items){const C=G.gal.ship.cargo;for(const k in o)if(o[k]>0)C[k]=(C[k]||0)+o[k];(items||[]).forEach(it=>C.items.push(it))}
function cargoTxt(o,items){const a=[];for(const k in o)if(o[k]>0&&k!='items')a.push(isM(k)?`${o[k]} ${MATS[k].n.replace(/ \(.*\)/,'')}`:`${o[k]} ${RES[k][0].toLowerCase()}`);(items||[]).forEach(it=>a.push(iName(it)+' '+'★'.repeat(it.st)));return a.join(', ')}
function galCargoCut(f){const C=G.gal.ship.cargo,o={};for(const k in C){if(k=='items')continue;const n=Math.floor(C[k]*f);if(n>0){o[k]=n;C[k]-=n}}let its=[];if(C.items.length&&Math.random()<f)its=C.items.splice(ri(0,C.items.length-1),1);return cargoTxt(o,its)}
function galUnload(){const C=G.gal.ship.cargo,o={},its=C.items.slice();for(const k in C){if(k=='items'||!(C[k]>0))continue;o[k]=C[k];if(isM(k))giveM({[k]:C[k]});else if(capped(k))addCap(k,C[k]);else G.res[k]=(G.res[k]|0)+C[k]}its.forEach(it=>G.items.push(it));G.gal.ship.cargo={items:[]};return cargoTxt(o,its)}
/* ================= COMMERCE ================= */
const galLot=k=>k=='food'||k=='wood'||k=='stone'?100:k=='gold'?0:VAL[k]<20?5:VAL[k]<60?2:1;
const galAttBuy=p=>{const k=attK(galAtt(p));return k=='allie'?.85:k=='ami'?.92:k=='hostile'?1.25:1};
const galAttSell=p=>{const k=attK(galAtt(p));return k=='allie'?1.12:k=='ami'?1.06:k=='hostile'?.85:1};
function galOffers(p){return GBIO[p.art].sells.filter(k=>k!='gold'&&VAL[k]).map(k=>{const n=galLot(k);return{k,n,left:Math.floor((p.stock[k]||0)/n),price:Math.max(1,Math.ceil(VAL[k]*n*p.pm*galAttBuy(p)*(1-mkBuyD())))}})}
function galDemand(p){return GBIO[p.art].buys.filter(k=>VAL[k]).map(k=>{const n=galLot(k);return{k,n,price:Math.max(1,Math.floor(VAL[k]*n*.45*1.25*(1+mkSellB())*galAttSell(p)))}})}
const galTradeOk=p=>galAtt(p)>-60;
function galTradeL(id,o){const p=galP(id),S=G.gal.ship;if(!p||S.at!=id||S.tr)return{ok:0,why:'Le bateau doit être amarré à cette planète.'};if(!galTradeOk(p))return{ok:0,why:`${p.own.name} refuse tout commerce avec vous.`};
 if(o.buy){const of=galOffers(p).find(x=>x.k==o.buy);if(!of||of.left<1)return{ok:0,why:'Rupture de stock.'};if(G.res.gold<of.price)return{ok:0,why:`Il faut ${of.price} or.`};if(cargoFree()<galU(of.k,of.n))return{ok:0,why:'Soutes pleines : rentrez décharger au village.'};
  G.res.gold-=of.price;p.stock[of.k]-=of.n;p.stock.gold=(p.stock.gold|0)+of.price;cargoAdd({[of.k]:of.n});return{ok:1,txt:`Achat : ${cargoTxt({[of.k]:of.n})} pour ${of.price} or (dans les soutes).`}}
 if(o.sell){const de=galDemand(p).find(x=>x.k==o.sell);if(!de)return{ok:0,why:'Ils n’en veulent pas.'};if(haveX(de.k)<de.n)return{ok:0,why:'Stock insuffisant au village.'};if((p.stock.gold|0)<de.price)return{ok:0,why:`${p.n} n’a plus assez d’or.`};
  payX({[de.k]:de.n});p.stock.gold-=de.price;p.stock[de.k]=(p.stock[de.k]||0)+de.n;G.res.gold+=de.price;return{ok:1,txt:`Vente : ${cargoTxt({[de.k]:de.n})} pour ${de.price} or.`}}
 return{ok:0,why:'?'}}
async function galTrade(id,k,side){const r=await GP.trade(id,side=='buy'?{buy:k}:{sell:k});if(!r.ok)return toast(r.why);try{jWork('marchand',2)}catch(_){}G.gal.st.trades=(G.gal.st.trades||0)+1;galLog('trade',`${galP(id).n} — ${r.txt}`);save();hud();rp();toast(r.txt)}
/* ================= DIPLOMATIE ================= */
function galGiftVal(p,o){const g=(GPERS[p.own.pers]||{g:{}}).g;let v=0;for(const k in o){const base=(VAL[k]||(k=='gold'?1:0))*o[k];v+=base*(k=='gold'?(g.gold||1):k=='food'?(g.food||1):isM(k)?(g.mat||1):1)}return v*(g.all||1)}
const galGiftPts=(p,o)=>Math.min(15,Math.floor(galGiftVal(p,o)/(40+8*(G.max||1))));
const GIFTS=[['g1',{gold:500}],['g2',{gold:2000}],['f1',{food:300}],['m1',{mat_cristal:2}],['m2',{mat_lingot:4}]];
function galGiftL(id,o){const p=galP(id),S=G.gal.ship;if(!p||S.at!=id||S.tr)return{ok:0,why:'Le bateau doit être amarré à cette planète.'};const left=p.gift+GAL.GIFT_CD*60000-Date.now();if(left>0)return{ok:0,why:`${p.own.name} attend avant d’accepter un autre présent (${mgT(left)}).`};if(!canX(o))return{ok:0,why:'Vous n’avez pas de quoi offrir ce présent.'};
 const pts=galGiftPts(p,o);payX(o);for(const k in o)p.stock[k]=(p.stock[k]||0)+o[k];p.att=clamp(p.att+pts,-100,100);p.gift=Date.now();return{ok:1,pts,txt:`${p.own.name} accepte votre présent (${cargoTxt(o)}) : attitude +${pts}.`}}
async function galGift(id,i){const r=await GP.gift(id,GIFTS[i][1]);if(!r.ok)return toast(r.why);galLog('dipl',`${galP(id).n} — ${r.txt}`);save();hud();rp();toast(r.txt)}
/* ================= RECRUTEMENT (vagabonds rares) ================= */
function galWand(p){const s=Math.floor(Date.now()/GAL.WAND_P);if(p.wand&&p.wand.s==s)return p.wand;const x=Math.random();p.wand={s,st:x<.6?3:x<.92?4:5,mg:Math.random()<.15?pick(DOM):null,name:pick(NOMS),done:0,here:Math.random()<.7};return p.wand}
const wandPrice=st=>200*st*st;
function galRecruitL(id){const p=galP(id),S=G.gal.ship;if(!p||S.at!=id||S.tr)return{ok:0,why:'Le bateau doit être amarré à cette planète.'};const W=galWand(p);if(!W.here||W.done)return{ok:0,why:'Personne à recruter pour l’instant.'};if(galAtt(p)<-10)return{ok:0,why:`${p.own.name} interdit à ses vagabonds de vous suivre.`};
 const pr=wandPrice(W.st);if(G.res.gold<pr)return{ok:0,why:`Il faut ${pr} or.`};if(G.chars.length>=capa())return{ok:0,why:'L’auberge est pleine.'};G.res.gold-=pr;const c=mk(W.st,{name:W.name});if(W.mg){c.mage=W.mg;c.eq.arme=mkItem(pick(['baton','grimoire']),Math.max(1,W.st-1));upRole(c)}G.chars.push(c);W.done=1;return{ok:1,c,txt:`<b>${c.name}</b> ${'★'.repeat(c.st)} quitte ${p.n} et rejoint votre village${c.mage?' — mage '+c.mage+' !':'.'}`}}
async function galRecruit(id){const r=await GP.recruit(id);if(!r.ok)return toast(r.why);try{syncNPC()}catch(_){}galLog('dipl',r.txt);save();hud();rp();toast(r.txt,3600)}
/* ================= EXPLORATION : une expédition dans un étage du biome de la planète ================= */
function galFloor(p){const ok=f=>f%5&&biomeOf(f).k==p.bk,M=G.max||1;for(let f=M;f>=1;f--)if(ok(f))return f;for(let f=M+1;f<M+31;f++)if(ok(f))return f;return M}
let GXP=null;
function galExplore(id){const p=galP(id),S=G.gal.ship;if(!p||S.at!=id||S.tr)return toast('Le bateau doit être amarré à cette planète.');if(galAtt(p)<=-30)return toast(`${p.own.name} vous interdit de débarquer.`);const left=p.exp+GAL.EXP_CD*60000-Date.now();if(left>0)return toast(`Les éclaireurs se reposent (${mgT(left)}).`);if(!party().length)return toast('Composez d’abord une équipe.');
 p.exp=Date.now();GXP=id;galLog('expl',`Expédition sur <b>${p.n}</b> (${p.bn}).`);save();closePanel();enterFloor(galFloor(p))}
{const _ef=enterFloor;enterFloor=function(){const r=_ef.apply(this,arguments);try{if(GXP&&F){F.gx=GXP;const p=galP(GXP);GXP=null;toast(`Exploration de <b>${p.n}</b> — ${p.bn}. Les règles de la Tour s’y appliquent aussi.`,3600)}}catch(e){console.warn('galaxie:exploration',e)}return r};
 const _lf=leaveFloor;leaveFloor=async function(why){const gx=F&&F.gx,m0=G.max,b0=G.ballon;const r=await _lf.apply(this,arguments);if(gx)try{G.max=m0;G.ballon=b0;galExploreEnd(gx,why)}catch(e){console.warn('galaxie:retour',e)}return r}}
function galExploreEnd(id,why){const p=galP(id);if(!p)return;if(why!='win'){galLog('expl',`Expédition sur ${p.n} interrompue.`);save();return}const o={};GBIO[p.art].sells.filter(k=>isM(k)).slice(0,3).forEach(k=>o[k]=VAL[k]>=100?1:ri(1,3));giveM(o);p.att=clamp(p.att+3,-100,100);G.gal.st.expl=(G.gal.st.expl||0)+1;
 galLog('expl',`Expédition réussie sur <b>${p.n}</b> : ${cargoTxt(o)} ; ${p.own.name} apprécie (+3).`);save();toast(`Exploration de ${p.n} réussie : ${mTxt(o)}`,4000)}
/* ================= INTERFACE ================= */
const GV={tab:'carte',sel:null,pt:'info'};
function openGal(t){galEnsure();if(t)GV.tab=t;openPanel(galPanel);galStart()}
const galSetT=t=>{GV.tab=t;rp();galStart();tabTop()},galSetPT=t=>{GV.pt=t;rp();tabTop()};
function galSel(id){GV.sel=id;GV.tab='planete';GV.pt='info';rp();tabTop()}
function galPanel(){const Q=galEnsure();if(!galOpen())return['Galaxie',galLocked()];const inc=Q.nr.inc;
 let h=galShipBar()+tabsH(GV.tab,[['carte','Carte','planete_joueur'],['planete','Planètes','planete_1'],['defense','Défense'+(inc?' ⚠':''),'ile_defense'],['journal','Journal','rs_navigation']],'galSetT');
 if(GV.tab=='carte')h+=galMapHTML();else if(GV.tab=='planete')h+=GV.sel&&galP(GV.sel)&&galP(GV.sel).disc?galPlanetHTML(galP(GV.sel)):galListHTML();else if(GV.tab=='defense')h+=typeof galDefHTML=='function'?galDefHTML():'';else h+=galJournalHTML();return['Galaxie',h]}
function galLocked(){const S=G.ship,st=S?S.stage:0,p=pilotOf();return`<div class="gmap lock"><canvas id="galc" width="${GAL.W}" height="${GAL.H}"></canvas><div class="glk"><b>Galaxie inexplorée</b></div></div><p>Votre planète flotte seule dans le brouillard d’étoiles. Le bateau montgolfier magique ouvrira le voyage vers les autres planètes de la galaxie (bible §16).</p><ul class="eff"><li class="${st>=5?'g':''}">Construire le bateau au Chantier naval : ${st} / 5 étapes</li><li class="${p?'g':''}">Nommer un pilote mage : ${p?p.name+' (mage '+p.mage+')':'aucun'}</li><li class="${S&&S.ready?'g':''}">Baptême du bateau : ${S&&S.ready?'fait':'à faire'}</li></ul><p class="m">Une fois prêt : voyages, commerce, explorations, diplomatie, recrutements… et pillages. D’autres planètes pourront aussi vous attaquer : pensez aux Remparts.</p>${bl('chantier')?`<p><button class="alt" onclick="closePanel();openB(G.plots.findIndex(p=>p&&p.k=='chantier'))">Aller au Chantier naval</button></p>`:''}`}
function galShipBar(){const Q=G.gal,S=Q.ship,st=shipStats(),p=pilotOf(),T=S.tr;const where=T?`en route vers <b>${T.to=='home'?'le village':galP(T.to).n}</b> · arrivée <span data-gt="${T.t0+T.d}">${mgT(T.t0+T.d-Date.now())}</span>`:S.at=='home'?'amarré au <b>village</b>':`amarré à <b>${galP(S.at).n}</b>`;
 return`<div class="gbar"><img src="${aSrc('bateau_ui')||aSrc('bateau')||''}" alt=""><div class="gr"><b>Bateau montgolfier</b> — ${where}<div class="m">Pilote ${p?p.name+' (mage '+p.mage+')':'—'} · vitesse ×${(Math.round(st.spd*100)/100+'').replace('.',',')} · soutes ${cargoUsed()} / ${st.cap} · bouclier ${st.prot} · camouflage ${st.cam} % · portée ${galUA(galRange())}</div></div>${!T&&S.at!='home'?`<button class="alt" onclick="galGoAsk('home')">Rentrer</button>`:''}</div>`}
function galMapHTML(){const Q=G.gal,d=Q.planets.filter(p=>p.disc).length;return`<div class="gmap"><canvas id="galc" width="${GAL.W}" height="${GAL.H}"></canvas></div><p class="m">Touchez une planète pour l’ouvrir. ${d} / ${Q.planets.length} planètes découvertes · les signaux « ? » sont hors de portée de la Longue-vue (portée ${galUA(galRange())} autour du village et du bateau).</p>`+galListHTML(1)}
function galListHTML(short){const Q=G.gal,L=Q.planets.filter(p=>p.disc).sort((a,b)=>galDist(Q.ship.at,a.id)-galDist(Q.ship.at,b.id));if(!L.length)return'<p class="m">Aucune planète découverte : améliorez la Longue-vue astrale ou voyagez.</p>';
 return(short?'<h3 class="sh">Planètes connues</h3>':'')+`<div class="glist">${L.map(p=>{galScale(p);return`<div class="gpl" onclick="galSel(${p.id})"><img src="${aSrc('planete_'+p.art)}" alt=""><div class="gr"><b>${p.n}</b> ${attTag(p)}${Q.ship.at==p.id?'<span class="tg ins">bateau ici</span>':''}${Q.nr.inc&&Q.nr.inc.pid==p.id?'<span class="tg w">attaque en cours</span>':''}<div class="m">${p.bn} · ${p.own.name} (${p.own.pers}) · ${galUA(galDist(Q.ship.at,p.id))} · village niv. ${p.vil} · puissance ${galPow(p)}</div></div></div>`}).join('')}</div>`}
function galGoAsk(to){const Q=G.gal,S=Q.ship,d=galDist(S.at,to),why=galCanGo(to),f1=galFuel(d,'food'),f2=galFuel(d,'ess'),ek=galEssKey(f2.n),risk=galRisk(S.at,to),dn=to=='home'?'le village':galP(to).n;
 GV.go=to;GV.tab='planete';if(to!='home')GV.sel=to;openPanel(()=>['Voyage vers '+dn,`<div class="gtrip"><img src="${aSrc(to=='home'?'planete_joueur':'planete_'+galP(to).art)}" alt=""><div class="gr"><b>${dn}</b><div class="m">Distance ${galUA(d)} · bateau ×${(Math.round(shipStats().spd*100)/100+'').replace('.',',')}${pilotOf()&&pilotOf().mage=='Temporelle'?' (pilote temporel +20 %)':''}</div><div class="m">Risque d’interception : <b class="${risk>.15?'w':''}">${Math.round(risk*100)} %</b>${shipStats().cam?` (camouflage −${shipStats().cam} % compris)`:''}</div></div></div>${why?`<p class="w">${why}</p>`:''}
 <div class="row"><div class="gr"><b>Vivres</b><div class="m">${f1.food} vivres${pilotOf()&&pilotOf().mage=='Naturelle'?' (pilote naturel −25 %)':''} · durée ${mgT(galTime(d,'food'))}</div></div><button class="ib" ${why||G.res.food<f1.food?'disabled':''} onclick="galGo(${to=='home'?"'home'":to},'food');openGal('carte')">Partir</button></div>
 <div class="row"><div class="gr"><b>Essences</b><div class="m">${f2.n} essence${f2.n>1?'s':''} arcanique ou de foudre (vous : ${mN('mat_essence_arcane')} / ${mN('mat_essence_foudre')}) · durée ${mgT(galTime(d,'ess'))} (−20 %)</div></div><button class="ib" ${why||!ek?'disabled':''} onclick="galGo(${to=='home'?"'home'":to},'ess');openGal('carte')">Partir</button></div>
 <p class="m">Pendant le voyage, le bateau ne peut ni commercer, ni explorer, ni piller. Les achats et le butin voyagent dans les soutes et sont déchargés au retour au village.</p><button class="alt" onclick="openGal()">Retour</button>`])}
function galPlanetHTML(p){const Q=G.gal,S=Q.ship,here=S.at==p.id&&!S.tr;galScale(p);const v=galAtt(p);
 let h=`<p><button class="alt" onclick="GV.sel=null;rp()">‹ Toutes les planètes</button></p><div class="ghead"><img src="${aSrc('planete_'+p.art)}" alt=""><div class="gr"><b class="bn">${p.n}</b> ${attTag(p)}<div class="m">${p.bn} · ${galUA(galDist(S.at,p.id))} du bateau · ${galUA(galDist('home',p.id))} du village</div><div class="m">Dirigeant : <b>${p.own.name}</b> ${stars(p.own.st)} · ${p.own.pers} (${(p.own.subs||[]).join(', ')}) · niv. ${p.own.lv}</div><div class="m">Faction : <span style="color:${FACT[p.fac].c}">${FACT[p.fac].e} ${FACT[p.fac].n}</span> (votre réputation ${repOf(p.fac)>0?'+':''}${repOf(p.fac)} → attitude ${repOf(p.fac)>=0?'+':''}${3*repOf(p.fac)})</div><div class="xpb gattb"><i style="width:${(v+100)/2}%;background:${ATTN[attK(v)][1]}"></i></div></div></div>`;
 h+=here?'':`<p>${S.tr?`<span class="m">Le bateau est en route.</span>`:`<button class="ib hot" onclick="galGoAsk(${p.id})">Voyager jusqu’ici (${galUA(galDist(S.at,p.id))})</button>`}</p>`;
 h+=tabsH(GV.pt,[['info','Planète'],['trade','Commerce'],['expl','Explorer'],['dipl','Diplomatie'],['recr','Recrutement'],['raid','Pillage']],'galSetPT');
 if(GV.pt=='info')h+=galInfoHTML(p);else if(!here)h+=`<p class="w">Le bateau doit être amarré à ${p.n} pour cela.</p>`+(GV.pt=='raid'&&typeof galRaidHTML=='function'?galRaidHTML(p,0):'');
 else if(GV.pt=='trade')h+=galTradeHTML(p);else if(GV.pt=='expl')h+=galExplHTML(p);else if(GV.pt=='dipl')h+=galDiplHTML(p);else if(GV.pt=='recr')h+=galRecrHTML(p);else if(GV.pt=='raid')h+=typeof galRaidHTML=='function'?galRaidHTML(p,1):'';return h}
function galInfoHTML(p){const now=Date.now();return`<ul class="eff"><li>Village niv. ${p.vil} · défense <b>${p.def}</b> · puissance des défenseurs <b>${galPow(p)}</b> (votre équipe : ${partyPow()})</li><li>Protection des réserves : ${Math.round(galProt(p)*100)} % du stock hors d’atteinte d’un pillage</li><li>Spécialités : ${GBIO[p.art].sells.map(k=>k=='gold'?'or':isM(k)?MATS[k].n.replace(/ \(.*\)/,''):RES[k][0].toLowerCase()).join(', ')}</li>${p.shield>now?`<li class="g">Sous protection après un pillage : encore <span data-gt="${p.shield}">${mgT(p.shield-now)}</span></li>`:''}</ul>
 <h3 class="sh">Habitants</h3><div class="gch">${[p.own].concat(p.chars).map(c=>`<div class="gc${c.gxdown?' dn':''}"><img src="${cs(c).url}" alt=""><div><b>${c.name}</b> ${stars(c.st)}<div class="m">${c.race} · ${(ROLES[c.role]||ROLES.guerrier).n} · ${c.pers} · niv. ${c.lv}${c.mage?' · mage '+c.mage:''}${c==p.own?' · <b>dirigeant</b>':''}${c.gxdown?' · <span class="w">blessé</span>':''}</div></div></div>`).join('')}</div>${(G.gal.lost||[]).filter(l=>l.pid==p.id).length?`<p class="w">Retient ${G.gal.lost.filter(l=>l.pid==p.id).map(l=>l.c.name).join(', ')} (vos personnages capturés) — onglet Défense.</p>`:''}`}
function galTradeHTML(p){if(!galTradeOk(p))return`<p class="w">${p.own.name} refuse tout commerce avec vous (attitude ${galAtt(p)}). Offrez un présent pour renouer.</p>`;const bd=mkBuyD(),sb=mkSellB();
 return`<p class="m">Prix propres à ${p.n} (×${(p.pm+'').replace('.',',')}) et à son attitude${bd?` · Marchand : achats −${Math.round(bd*100)} %`:''}${sb?`, ventes +${Math.round(sb*100)} %`:''}. Achats chargés dans les soutes (${cargoUsed()} / ${shipStats().cap}). Or de la planète : ${p.stock.gold|0}.</p><h3 class="sh">Acheter</h3>`+galOffers(p).map(o=>`<div class="row gtr"><img class="mi" src="${isM(o.k)?mSrc(o.k):aSrc('res_'+o.k)||''}" alt=""><div class="gr"><b>${o.n} ${isM(o.k)?MATS[o.k].n:RES[o.k][0]}</b><div class="m">stock : ${o.left} lot${o.left>1?'s':''} · ${galU(o.k,o.n)} place${galU(o.k,o.n)>1?'s':''}</div></div><button class="ib" ${o.left<1||G.res.gold<o.price||cargoFree()<galU(o.k,o.n)?'disabled':''} onclick="galTrade(${p.id},'${o.k}','buy')">${rIco('gold')} ${o.price}</button></div>`).join('')+
 `<h3 class="sh">Vendre</h3>`+galDemand(p).map(o=>`<div class="row gtr"><img class="mi" src="${isM(o.k)?mSrc(o.k):aSrc('res_'+o.k)||''}" alt=""><div class="gr"><b>${o.n} ${isM(o.k)?MATS[o.k].n:RES[o.k][0]}</b><div class="m">vous : ${haveX(o.k)} · très demandé ici</div></div><button class="alt" ${haveX(o.k)<o.n||(p.stock.gold|0)<o.price?'disabled':''} onclick="galTrade(${p.id},'${o.k}','sell')">+${o.price} or</button></div>`).join('')}
function galExplHTML(p){const left=p.exp+GAL.EXP_CD*60000-Date.now(),f=galFloor(p),lw=LAWS[lawOf(f)];return`<p>Débarquer l’équipe pour une courte expédition sur ${p.n} : un étage du biome <b>${biomeOf(f).n}</b> (difficulté de l’étage ${f}${f>(G.max||1)?' — <b class="w">au-delà de votre progression</b>':''}), avec ses événements, sa loi (${lw.s} ${lw.n}) et son butin habituel. La progression de la Tour n’avance pas. Réussite : quelques spécialités de la planète et attitude +3.</p><div class="warn">⚠ Comme dans la Tour, un personnage à terre à la fin d’un combat peut mourir pour toujours (${Math.round(deathP()*100)} %). Le héros ne meurt jamais.</div>${galAtt(p)<=-30?`<p class="w">${p.own.name} vous interdit de débarquer.</p>`:''}<p><button class="ib hot" ${left>0||galAtt(p)<=-30||!party().length?'disabled':''} onclick="galExplore(${p.id})">${left>0?'Éclaireurs au repos ('+mgT(left)+')':'Explorer'}</button></p>`}
function galDiplHTML(p){const left=p.gift+GAL.GIFT_CD*60000-Date.now(),g=GPERS[p.own.pers]||{g:{}};return`<p class="m">${p.own.name} est ${p.own.pers.toLowerCase()} : ${g.g.gold>1?'l’or le touche particulièrement. ':''}${g.g.food>1?'les vivres le touchent particulièrement. ':''}${g.g.mat>1?'les matériaux rares le fascinent. ':''}${g.g.all>1?'tout geste sincère compte double. ':''}${g.g.all<1?'il se méfie des cadeaux. ':''}L’attitude règle les prix, l’accès (exploration, recrutement) et le risque d’attaque contre votre village. Réputation de faction : chaque point vaut ±3.</p>`+GIFTS.map(([k,o],i)=>`<div class="row"><div class="gr"><b>Présent</b> ${costX(o)}<div class="m">attitude +${galGiftPts(p,o)}</div></div><button class="ib" ${left>0||!canX(o)?'disabled':''} onclick="galGift(${p.id},${i})">${left>0?mgT(left):'Offrir'}</button></div>`).join('')}
function galRecrHTML(p){const W=galWand(p),pr=wandPrice(W.st),left=GAL.WAND_P-(Date.now()%GAL.WAND_P);return`<p class="m">Des vagabonds rares (3★ à 5★, parfois mages) passent sur les planètes ; un nouveau toutes les 4 h (prochain dans ${mgT(left)}).</p>`+(!W.here||W.done?'<p class="m">Aucun vagabond disponible pour le moment.</p>':`<div class="pst"><i class="pe0">?</i><div class="gr"><b>${W.name}</b> ${stars(W.st)}<div class="m">${W.mg?`<span class="g">Mage ${W.mg}</span> · `:''}vagabond des étoiles · places ${G.chars.length} / ${capa()}${galAtt(p)<-10?' · <span class="w">le dirigeant s’y oppose</span>':''}</div></div><button class="ib" ${G.res.gold<pr||G.chars.length>=capa()||galAtt(p)<-10?'disabled':''} onclick="galRecruit(${p.id})">${rIco('gold')} ${pr} · Recruter</button></div>`)}
const GLK={travel:['Voyage','#7ad0ff'],trade:['Commerce','#ffcf4a'],raid:['Pillage','#ff7a5a'],def:['Défense','#b0b0c8'],capt:['Capture','#ff7ad9'],dipl:['Diplomatie','#5fe07a'],expl:['Exploration','#6fdc6f'],disc:['Découverte','#c58bff']};
function galJournalHTML(){const L=G.gal.log;const S=G.gal.st;return`<p class="m">Voyages ${S.trips|0} · échanges ${S.trades|0} · explorations ${S.expl|0} · pillages ${S.raids|0} (${S.raidW|0} réussis) · défenses ${S.defs|0} (${S.defW|0} victoires) · captures ${S.capt|0}</p>`+(L.length?`<div class="glog">${L.map(e=>{const d=new Date(e.t),k=GLK[e.k]||['',''];return`<div><span class="m">${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}</span> <b style="color:${k[1]}">${k[0]}</b> ${e.txt}</div>`}).join('')}</div>`:'<p class="m">Le journal galactique est vide.</p>')}
/* ---------- carte animée (canvas 960×540 : fond galaxie_fond ×3 en défilement horizontal, planètes, bateau_vol 4 images à 8 i/s) ---------- */
let galRAF=0;
function galStart(){setTimeout(()=>{const c=document.getElementById('galc');if(!c)return;if(!c.dataset.on){c.dataset.on=1;c.addEventListener('click',galClick)}if(!galRAF)galRAF=requestAnimationFrame(galLoop)},0)}
function galLoop(){const c=document.getElementById('galc');if(!c||$('#panel').hidden){galRAF=0;return}try{galDraw(c)}catch(e){console.warn('galaxie:carte',e);galRAF=0;return}galRAF=requestAnimationFrame(galLoop)}
function galShipXY(now){const S=G.gal.ship,T=S.tr;if(T){const k=clamp((now-T.t0)/T.d,0,1),A=galPos(T.from),B2=galPos(T.to);return{x:lerp(A.x,B2.x,k),y:lerp(A.y,B2.y,k)-Math.sin(k*Math.PI)*24,dx:B2.x-A.x,mv:1}}const P=galPos(S.at);return{x:P.x+38,y:P.y-40,dx:-1,mv:0}}
function galDraw(c){const x=c.getContext('2d'),W=c.width,H=c.height,now=Date.now(),t=now/1000;x.imageSmoothingEnabled=false;const bg=aImg('galaxie_fond');
 if(bg){const s=H/bg.height,bw=bg.width*s,o=(t*6)%bw;for(let X0=-o;X0<W;X0+=bw)x.drawImage(bg,Math.round(X0),0,Math.ceil(bw)+1,H)}else{x.fillStyle='#160e30';x.fillRect(0,0,W,H)}
 if(!galOpen()||!G.gal.planets.length){x.fillStyle='rgba(10,8,24,.55)';x.fillRect(0,0,W,H);const pj=aImg('planete_joueur');if(pj)x.drawImage(pj,W/2-40,H/2-40+Math.round(Math.sin(t)*2));return}
 const Q=G.gal,R=galRange()*GAL.PX,S=Q.ship,sp=galShipXY(now);
 x.setLineDash([6,6]);x.strokeStyle='rgba(77,224,192,.35)';x.lineWidth=2;[[W/2,H/2],S.tr?null:[galPos(S.at).x,galPos(S.at).y]].forEach(q=>{if(!q)return;x.beginPath();x.arc(q[0],q[1],R,0,6.283);x.stroke()});
 if(S.tr){const A=galPos(S.tr.from),B2=galPos(S.tr.to);x.strokeStyle='rgba(255,207,74,.8)';x.beginPath();x.moveTo(A.x,A.y);x.lineTo(B2.x,B2.y);x.stroke()}
 if(GV.sel&&galP(GV.sel)&&!S.tr){const A=galPos(S.at),p=galP(GV.sel);x.strokeStyle='rgba(255,255,255,.35)';x.beginPath();x.moveTo(A.x,A.y);x.lineTo(p.x,p.y);x.stroke()}
 const inc=Q.nr.inc;if(inc&&galP(inc.pid)){const p=galP(inc.pid),k=clamp((now-inc.t0)/(inc.at-inc.t0),0,1);x.strokeStyle='rgba(255,90,90,.85)';x.beginPath();x.moveTo(p.x,p.y);x.lineTo(lerp(p.x,W/2,k),lerp(p.y,H/2,k));x.stroke()}
 x.setLineDash([]);
 Q.planets.forEach(p=>{if(p.disc)return;if(Math.hypot(p.x-W/2,p.y-H/2)>R+100&&Math.hypot(p.x-galPos(S.at).x,p.y-galPos(S.at).y)>R+100)return;if(Math.floor(t*2+p.id)%3==0)return;x.fillStyle='rgba(200,180,255,.7)';x.fillRect(p.x-2,p.y-2,4,4);x.font='14px "Pixelify Sans",monospace';x.textAlign='center';x.fillText('?',p.x,p.y-8)});
 const pj=aImg('planete_joueur');if(pj)x.drawImage(pj,W/2-40,H/2-40+Math.round(Math.sin(t*.8)*2));galLabel(x,'Votre village',W/2,H/2+50,'#ffcf4a');
 Q.planets.forEach(p=>{if(!p.disc)return;const im=aImg('planete_'+p.art),bob=Math.round(Math.sin(t*.9+p.id)*2);if(GV.sel==p.id){x.strokeStyle='#ffcf4a';x.lineWidth=3;x.beginPath();x.arc(p.x,p.y+bob,38+Math.sin(t*4)*2,0,6.283);x.stroke()}
  if(im)x.drawImage(im,p.x-32,p.y-32+bob);else{x.fillStyle='#8a7bd8';x.beginPath();x.arc(p.x,p.y,24,0,6.283);x.fill()}const k=attK(galAtt(p));galLabel(x,p.n,p.x,p.y+44,ATTN[k][1]);if(inc&&inc.pid==p.id&&Math.floor(t*4)%2){x.fillStyle='#ff5a5a';x.fillRect(p.x+22,p.y-34,6,14);x.fillRect(p.x+22,p.y-16,6,6)}});
 const bv=aImg('bateau_vol');if(bv){const fr=Math.floor(t*8)%4,bob=sp.mv?0:Math.round(Math.sin(t*2)*3),X1=Math.round(sp.x-32),Y1=Math.round(sp.y-24+bob);if(sp.dx>0){x.save();x.translate(X1+64,Y1);x.scale(-1,1);x.drawImage(bv,fr*64,0,64,48,0,0,64,48);x.restore()}else x.drawImage(bv,fr*64,0,64,48,X1,Y1,64,48)}}
function galLabel(x,t,cx,cy,col){x.font='15px "Pixelify Sans",monospace';x.textAlign='center';x.fillStyle='rgba(10,8,24,.75)';const w=x.measureText(t).width;x.fillRect(Math.round(cx-w/2-4),cy-13,Math.round(w+8),18);x.fillStyle=col||'#fff';x.fillText(t,cx,cy)}
function galClick(e){const c=e.currentTarget,r=c.getBoundingClientRect(),mx=(e.clientX-r.left)*c.width/r.width,my=(e.clientY-r.top)*c.height/r.height;if(!galOpen())return;let best=null,bd=46;G.gal.planets.forEach(p=>{if(!p.disc)return;const d=Math.hypot(p.x-mx,p.y-my);if(d<bd){bd=d;best=p}});if(best)galSel(best.id)}
/* ---------- accroches : HUD (bouton Galaxie), Chantier naval, pilote ---------- */
{const _hud=hud;hud=function(){const r=_hud.apply(this,arguments);try{if(mode=='village'&&G&&G.ballon){const m=$('#menu');if(m&&!m.querySelector('.galb')){const inc=G.gal&&G.gal.nr&&G.gal.nr.inc;const b=document.createElement('button');b.className='alt galb'+(inc?' red':'');b.innerHTML=`<img src="${aSrc('planete_joueur')||''}" alt="">Galaxie${inc?` <span data-gt="${inc.at}">${mgT(inc.at-Date.now())}</span>`:''}`;b.onclick=()=>openGal(inc?'defense':null);m.prepend(b)}}}catch(e){console.warn('galaxie:hud',e)}return r}}
{const _ch=XPAN.chantier;XPAN.chantier=function(i,pl){let h=_ch.apply(this,arguments);try{if(G.ship&&G.ship.ready)h=`<p><button class="ib hot" onclick="openGal('carte')">${tabI2(aSrc('planete_joueur')||'')}Carte de la galaxie</button></p>`+h}catch(_){}return h}}
Object.assign(PILB,{Naturelle:'équipage serein : vivres du voyage −25 %',Sacrée:'protège l’équipage : pertes en cas d’interception réduites (15 % au lieu de 25 %)'});
/* ---------- horloge (1 s) : arrivées, découverte, monde, minuteurs ---------- */
function galTick(){if(!G||G.intro===0||!G.gal)return;const now=Date.now();try{if(galOpen()&&!G.gal.planets.length)galEnsure();galArrive(now);GP.tick(now);if(galOpen()&&G.gal.planets.length&&!shipBusy()){const before=G.gal.planets.filter(p=>p.disc).length;galDiscover('home');if(G.gal.ship.at!='home')galDiscover(G.gal.ship.at);if(G.gal.planets.filter(p=>p.disc).length!=before){save();if(PF==galPanel)rp()}}if(typeof raidTick=='function')raidTick(now)}catch(e){console.warn('galaxie:tick',e)}
 document.querySelectorAll('[data-gt]').forEach(e=>{e.textContent=mgT(Math.max(0,+e.dataset.gt-now))})}
setInterval(galTick,1000);
function galBoot(){galMigrate()}
{const s=document.createElement('style');s.textContent=`.gmap{position:relative;border:2px solid #000;background:#160e30;margin:6px 0;line-height:0}.gmap canvas{width:100%;height:auto;aspect-ratio:16/9;image-rendering:pixelated;display:block;cursor:pointer}.gmap.lock canvas{cursor:default}.glk{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;line-height:1.3;color:var(--gold);font-size:20px;text-shadow:2px 2px 0 #000}
.gbar,.ghead,.gtrip{display:flex;gap:10px;align-items:center;background:var(--panel2);border:2px solid #000;border-left:6px solid #7ad0ff;padding:6px 8px;margin:6px 0}.gbar>img{width:64px;height:48px;object-fit:contain;image-rendering:pixelated}.ghead>img,.gtrip>img{width:80px;height:80px;image-rendering:pixelated}.gbar .gr,.ghead .gr,.gtrip .gr{flex:1;min-width:0}
.glist{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:6px}.gpl{display:flex;gap:8px;align-items:center;background:var(--panel2);border:2px solid #000;padding:4px 6px;cursor:pointer}.gpl:hover{box-shadow:0 0 0 2px var(--gold) inset}.gpl>img{width:48px;height:48px;image-rendering:pixelated}.gpl .gr{min-width:0}
.tg.gatt{background:rgba(0,0,0,.35)}.gattb{margin-top:4px}.gch{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:6px}.gc{display:flex;gap:6px;align-items:center;background:var(--panel2);border:2px solid #000;padding:3px 6px}.gc.dn{opacity:.6}.gc>img{width:48px;height:45px;image-rendering:pixelated}
.gtr .mi{width:28px;height:28px;image-rendering:pixelated}.glog{max-height:420px;overflow:auto;border:2px solid #000;background:var(--panel2);padding:4px 8px}.glog>div{padding:3px 0;border-bottom:1px solid rgba(255,255,255,.08);font-size:13px}
#menu .galb img{width:20px;height:20px;image-rendering:pixelated;vertical-align:-5px;margin-right:4px}#menu .galb.red{animation:galp 1s steps(2) infinite}@keyframes galp{50%{filter:brightness(1.4)}}
.grep{display:flex;gap:10px;align-items:flex-start;flex-wrap:wrap}.grep>img{width:320px;max-width:100%;image-rendering:pixelated;border:2px solid #000}.grep .gr{flex:1;min-width:220px}.gods{display:flex;height:14px;border:2px solid #000;margin:4px 0}.gods i{display:block;height:100%}
@media (max-width:560px){.ghead>img,.gtrip>img{width:56px;height:56px}.gbar>img{width:48px;height:36px}.glist,.gch{grid-template-columns:1fr}}`;document.head.appendChild(s)}
