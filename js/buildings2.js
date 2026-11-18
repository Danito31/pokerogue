'use strict';
/* ================= SIX BÂTIMENTS SUPPLÉMENTAIRES (docs/mages.md) =================
   Taverne, Écurie, Sanctuaire, Tour de mage (recherches : js/mages.js), Remparts, Chantier naval (bateau montgolfier, bible §16).
   Terrains G.plots[11..16] (HSITE+1…), ouverts par l'Hôtel de ville (niv. 1 : 1, niv. 2 : 2, niv. 3 : 6).
   État : G.mg {meal, rum, tip, mount, mounts, care, brush, bless, pray, def} · G.ship {stage, q, mods, pilot, ready} · drapeau de migration G.v_mages.
   Accroches (sans toucher aux fichiers des autres) : enveloppes de battleStart, fight, addLoot, expStart, enterFloor, cEvoCost, vRefresh. */
const XPLOT0=HSITE+1,XPLOTS=6;
Object.assign(BLD,{
 taverne:{n:'Taverne',d:'Repas du cuisinier (bonus d’équipe pour quelques combats), rumeurs sur l’étage suivant, aventuriers de passage.',c:[90,40],g:250,col:'#b8743a',hv:1},
 ecurie:{n:'Écurie',d:'Montures : déplacement plus rapide dans les étages et vitesse en combat. Les bêtes demandent des soins.',c:[110,40],g:300,col:'#9a6a3a',hv:2},
 sanctuaire:{n:'Sanctuaire',d:'Prières et bénédictions temporaires (or, essences, protection) ; éveils des personnages moins chers.',c:[60,140],g:400,col:'#e8d070',hv:2},
 mage:{n:'Tour de mage',d:'Recherches magiques chronométrées menées par les mages : six domaines, navigation et défense.',c:[80,160],g:500,col:'#7a5ad8',hv:3},
 remparts:{n:'Remparts',d:'Défense du village (raids de la galaxie) ; postes de garde.',c:[60,220],g:400,col:'#8a8aa8',hv:3,mx:()=>mrs('df_1')?3:2,mxT:'recherche Fortification (Tour de mage) requise'},
 chantier:{n:'Chantier naval',d:'Construction et modules du bateau montgolfier magique, piloté par un mage.',c:[200,120],g:600,col:'#5a8ab8',hv:3,req:()=>!!G.ballon,rq:'Étage 20 franchi'}});
/* ---------- terrains supplémentaires ---------- */
const xPlotNeed=i=>i<=XPLOT0?1:i<=XPLOT0+1?2:3;
const xPlotOpen=i=>hdvLv()>=xPlotNeed(i);
const xPlotsAt=L=>L>=3?6:L>=2?2:L>=1?1:0;
function bLockT(k){const b=BLD[k],hv=k=='hdv'||!b.hv||hdvLv()>=b.hv;return hv?(b.rq||'')+' requis':`Hôtel de ville niv. ${b.hv} requis${b.req&&!b.req()?' · '+b.rq:''}`}
function bNeedT(k,lv){const b=BLD[k],hm=k=='hdv'?3:b.hv?Math.min(3,hdvLv()):hdvLv()>=1?3:2;return lv>hm?`Hôtel de ville niv. ${b.hv?lv:1} requis`:b.mxT||'—'}
/* ---------- postes propres : mages (Tour), fidèles (Sanctuaire), gardes (Remparts) ---------- */
function xPosts(c){const a=[];if(!G||!G.plots)return a;if(c.mage&&bl('mage'))a.push('mage');if((c.mage=='Sacrée'||c.elem=='sacre')&&bl('sanctuaire'))a.push('sanctuaire');if(bl('remparts')&&c.lv>=5)a.push('remparts');return a}
const guardPow=c=>Math.round(c.lv*c.st*2*(c.role=='gardien'?1.5:1)*(mrs('df_3')?1.5:1));
const fidW=c=>c.mage=='Sacrée'?2:1;
function xPostTxt(c,k,list){const t=k=='mage'?(c.mage?`Mage ${c.mage} : mène une recherche à la Tour`:''):k=='sanctuaire'?`Fidèle${c.mage=='Sacrée'?' (mage sacré, compte double)':''} : bénédictions +${15*fidW(c)} % de durée, prix −${10*fidW(c)} %`:k=='remparts'?`Garde : défense +${guardPow(c)}`:'';return t?(list?t:` · <span class="g">${t}</span>`):''}
const xPostWho=k=>k=='mage'?' · tout mage (recherches)':k=='sanctuaire'?' · mages sacrés et personnages d’élément Sacré (fidèles)':k=='remparts'?' · tout personnage niv. 5+ (gardes)':'';
/* ---------- état, migration ---------- */
function mgEnsure(){if(!G)return;if(!Array.isArray(G.plots))G.plots=[];while(G.plots.length<XPLOT0+XPLOTS)G.plots.push(null);
 if(!G.mg||typeof G.mg!='object')G.mg={};const M=G.mg;if(!(M.care>=0))M.care=100;if(!M.bless||typeof M.bless!='object')M.bless={};if(!M.mounts||typeof M.mounts!='object')M.mounts={};if(M.mount&&!MOUNTS[M.mount])M.mount=null;if(M.meal&&!TAVM[M.meal.k])M.meal=null;
 if(!G.ship||typeof G.ship!='object')G.ship={stage:0,q:null,mods:{},pilot:null,ready:0};const S=G.ship;if(!S.mods||typeof S.mods!='object')S.mods={};for(const k in SHIPM)if(!(S.mods[k]>=0))S.mods[k]=0;if(!(S.stage>=0))S.stage=0;S.stage=Math.min(S.stage,SHIPS.length);if(S.q&&!SHIPS[S.q.i])S.q=null;if(S.pilot&&!G.chars.some(c=>c.id==S.pilot&&c.mage)){S.pilot=null;S.ready=0}
 if(typeof mrsEnsure=='function')mrsEnsure()}
function mgMigrate(){if(!G)return;if(!G.v_mages){try{if(!localStorage.getItem('tdE6_vm_bak')){const o=localStorage.getItem(SKEY);if(o)localStorage.setItem('tdE6_vm_bak',o)}}catch(_){}
  G.plots=(G.plots||[]).map(p=>p&&BLD[p.k]?p:null);G.v_mages=1}mgEnsure()}
/* ---------- effets affichés (bEff) ---------- */
const XEFF={
 taverne:L=>[`Plats : ${Object.values(TAVM).filter(t=>t.lv<=L).length} / ${Object.keys(TAVM).length}`,`Rumeurs : étage suivant${L>=2?', carte 25 %':''}${L>=3?', quête':''}`,`Aventuriers de passage : jusqu’à ${[0,3,4,5][L]}★`],
 ecurie:L=>[`Montures : ${Object.values(MOUNTS).filter(m=>m.lv<=L).map(m=>m.s).join(', ')}`,`Soins naturels : +${4*L} / h`],
 sanctuaire:L=>[`Bénédictions : ${Object.values(BLESS).filter(b=>b.lv<=L).length} / ${Object.keys(BLESS).length}`,`Durée : ${Math.round(30*(1+.25*(L-1)))} min de base`,`Éveil des personnages : or −${Math.round((.05+.05*L)*100)} %${L>=2?', essences −10 %':''}`],
 mage:L=>[`Recherches : rang ${['','I','I–II','I–III'][L]}`,`Mages chercheurs : ${L}`],
 remparts:L=>[`Défense de base : ${[0,100,250,500][L]}`,`Gardes : ${L}`],
 chantier:L=>[`Étapes du bateau : ${['','1–2','1–4','1–5'][L]} / 5`,`Modules : niv. ${L} max.`]};
const XPAN={taverne:(i,pl)=>tavHTML(pl),ecurie:(i,pl)=>ecuHTML(pl),sanctuaire:(i,pl)=>sanHTML(pl),remparts:(i,pl)=>remHTML(pl),chantier:(i,pl)=>chaHTML(pl)};
const mgPc=v=>Math.round(v*100)+' %',mgMin=m=>m>=60?`${Math.floor(m/60)} h${m%60?' '+String(Math.round(m%60)).padStart(2,'0'):''}`:Math.max(1,Math.round(m))+' min';
const mgT=ms=>mgMin(Math.ceil(ms/60000));
const fxTxt=b=>[b.atk?`ATQ +${mgPc(b.atk)}`:'',b.def?`DEF +${mgPc(b.def)}`:'',b.hp?`PV +${mgPc(b.hp)}`:'',b.spd?`VIT +${b.spd}`:'',b.crit?`Crit. +${mgPc(b.crit)}`:'',b.heal?`soin ${mgPc(b.heal)} après chaque victoire`:''].filter(x=>x).join(', ');
/* ================= TAVERNE ================= */
const TAVM={
 ragout:{n:'Ragoût du chasseur',lv:1,c:{food:20,mat_viande:4},b:{atk:.08},n0:4,ic:'mat_viande'},
 soupe:{n:'Soupe de racines',lv:1,c:{food:40,mat_poussiere:1},b:{def:.1},n0:4,ic:'res_food'},
 brochettes:{n:'Brochettes épicées',lv:2,c:{mat_viande:3,mat_croc:2,gold:30},b:{spd:4,crit:.05},n0:5,ic:'mat_croc'},
 infusion:{n:'Infusion sylvestre',lv:2,rs:'na_seve',c:{food:30,mat_poussiere:2},b:{hp:.1,heal:.05},n0:5,ic:'mat_essence_nature'},
 festin:{n:'Festin des étoiles',lv:3,c:{food:60,mat_viande:6,mat_cristal:1,gold:100},b:{atk:.1,def:.1,hp:.1},n0:6,ic:'mat_cristal'}};
const cookR=()=>JR('cuisinier','taverne'),cookK=()=>1+Math.min(.6,.1*cookR()),cookN=()=>Math.min(3,Math.floor(cookR()/2));
const cookEvo=()=>JW('cuisinier','taverne').some(jEvo);
function tavCost(k){const o=Object.assign({},TAVM[k].c);if(cookEvo())for(const x in o)o[x]=Math.ceil(o[x]/2);return o}
function tavFx(k){const b=TAVM[k].b,m=cookK(),o={};for(const x in b)o[x]=x=='spd'?Math.round(b[x]*m):Math.round(b[x]*m*1000)/1000;return o}
function tavEat(k){mgEnsure();const T=TAVM[k];if(!T||T.lv>bl('taverne')||(T.rs&&!mrs(T.rs)))return;const o=tavCost(k);if(!canX(o))return;payX(o);G.mg.meal={k,n:T.n0+cookN(),b:tavFx(k)};jWork('cuisinier',5,'taverne');save();rp();toast(`${T.n} servi : ${fxTxt(G.mg.meal.b)} pendant ${G.mg.meal.n} combats.`,3200)}
const rumCost=()=>20+5*(G.max||1);
const RUMF=['Un marin ivre jure l’avoir vu de ses yeux…','La serveuse a tout entendu d’un groupe de retour de la Tour.','Un vieux cartographe griffonne un plan sur une serviette.','On chuchote au comptoir, entre deux chopes.'];
function rumInfo(f){const Lk=lawOf(f),Lw=LAWS[Lk],kind=f%10==0?'boss':f%5==0?'mini':'norm';return{f,law:Lk,kind,bi:biomeOf(f).n,tool:Lw.tool&&ITYPES[Lw.tool]?ITYPES[Lw.tool].n:null}}
function rumBuy(){mgEnsure();const c=rumCost();if(!bl('taverne')||G.res.gold<c)return;G.res.gold-=c;const f=G.max||1;G.mg.rum={f,t:pick(RUMF),L:bl('taverne')};jWork('cuisinier',2,'taverne');save();rp();toast(`Rumeur entendue sur l’étage ${f}.`)}
function rumHTML(){const R=G.mg.rum;if(!R)return'';const I=rumInfo(R.f),Lw=LAWS[I.law];return`<div class="lbr mgr"><img src="${pIco('rs_navigation','#b8743a','?')}" alt=""><div class="gr"><b>Rumeur · étage ${R.f}</b><div class="m"><i>${R.t}</i></div><ul class="eff"><li>${Lw.s} <b>${Lw.n}</b> : ${Lw.e}</li><li>Région : ${I.bi}${I.kind=='boss'?' — <b class="w">un boss y règne</b>':I.kind=='mini'?' — étage de quête':''}</li>${I.tool?`<li>Outil conseillé : <b>${I.tool}</b></li>`:''}${R.L>=2?'<li class="g">Piste : 25 % de la carte révélés à l’entrée</li>':''}${R.L>=3?'<li class="g">Le contenu de la quête vous sera soufflé à l’entrée</li>':''}</ul><div class="m">Valable pour la prochaine visite de cet étage.</div></div></div>`}
/* aventuriers de passage : un par tranche de 2 h (temps réel) */
const TIP_P=2*3600000;
function tipRoll(){const L=bl('taverne'),s=Math.floor(Date.now()/TIP_P),T=G.mg.tip;if(T&&T.s==s&&T.L==L)return T;const x=Math.random(),st=L>=3?(x<.6?3:x<.92?4:5):L>=2?(x<.5?2:x<.9?3:4):(x<.7?2:3);G.mg.tip={s,L,st,mg:Math.random()<.08?pick(DOM):null,name:pick(NOMS),done:0};return G.mg.tip}
const tipPrice=st=>150*st*st;
function tipHire(){mgEnsure();const T=tipRoll();if(T.done)return;const p=tipPrice(T.st);if(G.res.gold<p)return;if(G.chars.length>=capa())return toast('L’auberge est pleine : améliorez-la pour accueillir plus de monde.');G.res.gold-=p;const c=mk(T.st,{name:T.name});if(T.mg){c.mage=T.mg;c.eq.arme=mkItem(pick(['baton','grimoire']),Math.max(1,T.st-1));upRole(c)}G.chars.push(c);T.done=1;save();syncNPC();rp();toast(`<b>${c.name}</b> ${'★'.repeat(c.st)} rejoint le village${c.mage?' — c’est un mage '+c.mage+' !':''}`,3600)}
function tavHTML(pl){mgEnsure();const L=pl.lv,M=G.mg.meal,R=cookR(),T=tipRoll();
 let h=`<h3 class="sh">Repas</h3><p class="m">Un plat à la fois : ses effets s’appliquent à l’équipe pendant les prochains combats (en plus du repas de l’Auberge). ${R?`Cuisiniers à la taverne : effets ×${(cookK()+'').replace('.',',')}, +${cookN()} combat${cookN()>1?'s':''}${cookEvo()?', ingrédients ÷2 (Chef étoilé)':''}.`:'Un cuisinier en poste ici renforce les plats.'}</p>${M&&M.n>0?`<p class="g">Plat actif : <b>${TAVM[M.k].n}</b> — ${fxTxt(M.b)} · encore ${M.n} combat${M.n>1?'s':''}.</p>`:''}`;
 h+=Object.keys(TAVM).map(k=>{const t=TAVM[k],lk=t.lv>L,nr=t.rs&&!mrs(t.rs),o=tavCost(k);return`<div class="lbr mgt"><img src="${mSrc(t.ic)}" alt=""><div class="gr"><b>${t.n}</b> ${lk?`<span class="tg">Taverne niv. ${t.lv}</span>`:nr?`<span class="tg">recherche : ${MRS[t.rs].n}</span>`:''}<div class="m">${fxTxt(tavFx(k))} · ${t.n0+cookN()} combats</div><div class="cr">${costX(o)}<button class="ib" ${lk||nr||!canX(o)?'disabled':''} onclick="tavEat('${k}')">Commander</button></div></div></div>`}).join('');
 h+=`<h3 class="sh">Rumeurs</h3><p class="m">Pour ${rumCost()} or, les habitués racontent ce qui attend à l’étage ${G.max||1} (le prochain à franchir).</p>${rumHTML()}<p><button class="ib" ${G.res.gold<rumCost()?'disabled':''} onclick="rumBuy()">${rIco('gold')} ${rumCost()} · Écouter les rumeurs</button></p>`;
 const p=tipPrice(T.st),left=TIP_P-(Date.now()%TIP_P);
 h+=`<h3 class="sh">Aventurier de passage</h3><p class="m">Un nouvel aventurier toutes les 2 h (prochain dans ${mgT(left)}).</p>${T.done?'<p class="m">L’aventurier du moment a déjà rejoint le village.</p>':`<div class="pst"><i class="pe0">?</i><div class="gr"><b>${T.name}</b> ${stars(T.st)}<div class="m">${T.mg?`<span class="g">Mage ${T.mg}</span> · `:''}cherche un village où s’installer · places ${G.chars.length} / ${capa()}</div></div><button class="ib" ${G.res.gold<p||G.chars.length>=capa()?'disabled':''} onclick="tipHire()">${rIco('gold')} ${p} · Recruter</button></div>`}`;
 return h}
/* ================= ÉCURIE ================= */
const MOUNTS={
 poney:{n:'Poney des steppes',s:'Poney',lv:1,spd:2,c:{gold:200,food:60},d:'Déplacement +15 % dans les étages ; VIT +2 en combat.'},
 destrier:{n:'Destrier de guerre',s:'Destrier',lv:2,spd:4,atk:.03,c:{gold:600,mat_cuir:4,food:100},d:'Déplacement +15 % ; VIT +4, ATQ +3 % en combat.'},
 griffon:{n:'Griffon',s:'Griffon',lv:3,rs:'na_bete',spd:6,atk:.05,crit:.03,c:{gold:1500,mat_cristal:2,mat_viande:6},d:'Déplacement +15 % ; VIT +6, ATQ +5 %, Crit. +3 % en combat.'}};
const ecuR=()=>JR('eleveur','ecurie');
const careLoss=()=>Math.max(3,12-2*ecuR())*(mrs('na_bete')?.5:1);
const careRate=()=>4*bl('ecurie')+3*ecuR();
const BRUSH_P=30*60000;
function mtAdopt(k){mgEnsure();const m=MOUNTS[k];if(!m||G.mg.mounts[k]||m.lv>bl('ecurie')||(m.rs&&!mrs(m.rs))||!canX(m.c))return;payX(m.c);G.mg.mounts[k]=1;G.mg.mount=k;jWork('eleveur',5,'ecurie');save();rp();toast(`${m.n} rejoint l’Écurie : monture choisie.`)}
function mtPick(k){mgEnsure();if(k&&!G.mg.mounts[k])return;G.mg.mount=k||null;save();rp()}
function mtFeed(t){mgEnsure();const M=G.mg,o=t=='viande'?{mat_viande:3}:t=='foin'?{food:40}:null;if(t=='brosse'){if(Date.now()-(M.brush||0)<BRUSH_P)return;M.brush=Date.now();M.care=Math.min(100,M.care+10)}else{if(!o||!canX(o)||M.care>=100)return;payX(o);M.care=Math.min(100,M.care+(t=='viande'?50:25))}jWork('eleveur',3,'ecurie');save();rp()}
const mtOn=()=>F&&F.mgMt?MOUNTS[F.mgMt]:null;
function ecuHTML(pl){mgEnsure();const M=G.mg,L=pl.lv,R=ecuR(),bw=Date.now()-(M.brush||0);
 let h=`<p class="m">La monture choisie accompagne le capitaine dans la Tour : déplacement +15 % et bonus de combat, tant que ses soins restent à 25 ou plus. Chaque étage coûte ${(careLoss()+'').replace('.',',')} points de soins${R?' (éleveurs)':''}${mrs('na_bete')?' (Langage des bêtes)':''} ; récupération naturelle +${careRate()} / h.</p>`;
 h+=`<div class="cap"><span class="cn">${tabI2(pIco('job_eleveur','#9a6a3a','É'))}Soins</span><div class="xpb"><i style="width:${Math.round(M.care)}%;${M.care<25?'background:var(--orange,#ff9a3a)':''}"></i></div><b>${Math.floor(M.care)} / 100</b></div>`;
 h+=`<p><button class="alt" ${M.care>=100||!canX({food:40})?'disabled':''} onclick="mtFeed('foin')">Foin (40 vivres) +25</button> <button class="alt" ${M.care>=100||!canX({mat_viande:3})?'disabled':''} onclick="mtFeed('viande')">Ration (3 viandes) +50</button> <button class="alt" ${bw<BRUSH_P||M.care>=100?'disabled':''} onclick="mtFeed('brosse')">Panser +10${bw<BRUSH_P?' ('+mgT(BRUSH_P-bw)+')':''}</button></p>`;
 h+=Object.keys(MOUNTS).map(k=>{const m=MOUNTS[k],own=M.mounts[k],lk=m.lv>L,nr=m.rs&&!mrs(m.rs),on=M.mount==k;return`<div class="lbr mgt${on?' on':''}"><img src="${pIco('mt_'+k,'#9a6a3a',m.s[0])}" alt=""><div class="gr"><b>${m.n}</b> ${on?'<span class="tg ins">monture active</span>':''}${lk?`<span class="tg">Écurie niv. ${m.lv}</span>`:nr?`<span class="tg">recherche : ${MRS[m.rs].n}</span>`:''}<div class="m">${m.d}</div><div class="cr">${own?`<button class="${on?'on':'alt'}" onclick="mtPick(${on?'null':`'${k}'`})">${on?'Laisser à l’écurie':'Monter'}</button>`:`${costX(m.c)}<button class="ib" ${lk||nr||!canX(m.c)?'disabled':''} onclick="mtAdopt('${k}')">Adopter</button>`}</div></div></div>`}).join('');
 return h}
/* ================= SANCTUAIRE ================= */
const BLESS={
 fortune:{n:'Bénédiction de fortune',lv:1,c:{gold:200},m:30,d:'Or gagné dans la Tour +25 %.',ic:'res_gold'},
 astres:{n:'Bénédiction des astres',lv:2,c:{gold:300,mat_poussiere:2},m:30,d:'Après chaque victoire : 40 % de chances d’une essence de l’étage.',ic:'mat_essence_arcane'},
 egide:{n:'Égide sacrée',lv:2,rs:'sa_benir',c:{gold:300,mat_essence_sacre:1},m:30,d:'Équipe : DEF +8 %, PV +5 %.',ic:'mat_essence_sacre',b:{def:.08,hp:.05}},
 lumiere:{n:'Lumière des étoiles',lv:3,c:{gold:600,mat_essence_sacre:2},m:30,d:'Équipe : ATQ +6 % ; après chaque victoire, PV +5 %.',ic:'ui_star',b:{atk:.06,heal:.05}}};
const fidN=()=>postedAt('sanctuaire').filter(working).reduce((a,c)=>a+fidW(c),0);
const blDur=k=>Math.round(BLESS[k].m*(1+.25*(bl('sanctuaire')-1))*(1+.15*fidN())*(mrs('sa_benir')?1.25:1)*(mrs('te_boucle')?1.5:1));
function blCost(k){const d=Math.min(.3,.1*fidN()),o=Object.assign({},BLESS[k].c);for(const x in o)o[x]=x=='gold'?Math.round(o[x]*(1-d)):o[x];return o}
const blOn=k=>!!(G.mg&&G.mg.bless[k]>Date.now());
function blBuy(k){mgEnsure();const b=BLESS[k];if(!b||b.lv>bl('sanctuaire')||(b.rs&&!mrs(b.rs)))return;const o=blCost(k);if(!canX(o))return;payX(o);const now=Date.now();G.mg.bless[k]=Math.max(now,G.mg.bless[k]||0)+blDur(k)*60000;save();rp();toast(`${b.n} : ${mgMin(blDur(k))} de plus.`)}
const PRAY_P=8*3600000;
function pray(){mgEnsure();const M=G.mg;if(!bl('sanctuaire')||Date.now()-(M.pray||0)<PRAY_P)return;M.pray=Date.now();giveM({mat_essence_sacre:1});M.bless.fortune=Math.max(Date.now(),M.bless.fortune||0)+20*60000;save();rp();toast('Prière exaucée : +1 essence sacrée et 20 min de Bénédiction de fortune.',3200)}
function evoDisc(){const L=bl('sanctuaire');return{g:(L?.05+.05*L:0)+(mrs('sa_eveil')?.1:0),e:(L>=2?.1:0)+(mrs('sa_eveil')?.2:0)}}
function sanHTML(pl){mgEnsure();const M=G.mg,L=pl.lv,pw=Date.now()-(M.pray||0),D=evoDisc(),fn=fidN();
 let h=`<p class="m">Les bénédictions durent en temps réel (jeu fermé compris) et se prolongent si on les renouvelle. ${fn?`Fidèles en poste : durée +${15*fn} %, or −${Math.min(30,10*fn)} %.`:'Les mages sacrés et les personnages d’élément Sacré peuvent servir ici comme fidèles.'}</p>`;
 h+=`<div class="pst"><img class="sp" src="${mSrc('mat_essence_sacre')}" alt="" style="width:40px;height:40px"><div class="gr"><b>Prière</b><div class="m">Gratuite, toutes les 8 h : +1 essence sacrée et 20 min de Bénédiction de fortune.</div></div><button class="ib" ${pw<PRAY_P?'disabled':''} onclick="pray()">${pw<PRAY_P?mgT(PRAY_P-pw):'Prier'}</button></div>`;
 h+=Object.keys(BLESS).map(k=>{const b=BLESS[k],lk=b.lv>L,nr=b.rs&&!mrs(b.rs),o=blCost(k),on=blOn(k);return`<div class="lbr mgs${on?' on':''}"><img src="${mSrc(b.ic)}" alt=""><div class="gr"><b>${b.n}</b> ${on?`<span class="tg ins">active · ${mgT(M.bless[k]-Date.now())}</span>`:''}${lk?`<span class="tg">Sanctuaire niv. ${b.lv}</span>`:nr?`<span class="tg">recherche : ${MRS[b.rs].n}</span>`:''}<div class="m">${b.d} Durée : ${mgMin(blDur(k))}.</div><div class="cr">${costX(o)}<button class="ib" ${lk||nr||!canX(o)?'disabled':''} onclick="blBuy('${k}')">${on?'Prolonger':'Bénir'}</button></div></div></div>`}).join('');
 h+=`<p class="m">Éveil des personnages (Autel d’éveil) : or −${mgPc(D.g)}${D.e?`, essences −${mgPc(D.e)}`:''}${mrs('sa_eveil')?' (Rite d’éveil compris)':''}.</p>`;return h}
/* ================= REMPARTS ================= */
function defRating(){const L=bl('remparts');if(!L)return 0;const base=[0,100,250,500][L],gp=postedAt('remparts').filter(working).reduce((a,c)=>a+guardPow(c),0),m=1+(mrs('df_1')?.1:0)+(mrs('df_2')?.2:0)+(mrs('df_3')?.3:0);return Math.round((base+gp)*m)}
function remHTML(pl){mgEnsure();const L=pl.lv,g=postedAt('remparts').filter(working),m=1+(mrs('df_1')?.1:0)+(mrs('df_2')?.2:0)+(mrs('df_3')?.3:0);
 return`<div class="mgdef"><b class="bn">Défense du village : ${defRating()}</b><div class="m">Base ${[0,100,250,500][L]} + gardes ${g.reduce((a,c)=>a+guardPow(c),0)}${m>1?` · recherches ×${(Math.round(m*100)/100+'').replace('.',',')}`:''}</div></div><p class="m">Puissance d’un garde = niveau × étoiles × 2 (×1,5 pour un Gardien${mrs('df_3')?', ×1,5 Bouclier de ville':''}). La défense protégera le village des raids de la galaxie (bible §17, à venir) ; la Protection du bateau s’y ajoutera en voyage.</p>${L>=2&&!mrs('df_1')?'<p class="w">Niveau 3 : recherche <b>Fortification</b> à la Tour de mage.</p>':''}`}
/* ================= CHANTIER NAVAL ET BATEAU (bible §16) ================= */
const SHIPS=[
 {k:'quille',n:'Quille et coque',lv:1,c:{wood:600,stone:200,mat_bois:10,mat_minerai:10},m:20},
 {k:'nacelle',n:'Nacelle',lv:1,rs:['nv_1'],c:{wood:400,mat_cuir:12,mat_tissu:8,mat_lingot:4},m:30},
 {k:'enveloppe',n:'Enveloppe du ballon',lv:2,c:{gold:1500,mat_tissu:30,mat_cuir:10},m:60},
 {k:'greement',n:'Gréement et voilure magiques',lv:2,rs:['nv_2'],c:{gold:2500,mat_lingot:10,mat_cristal:6,mat_essence_foudre:3},m:90},
 {k:'coeur',n:'Cœur arcanique',lv:3,rs:['nv_3','ar_noyau'],c:{gold:4000,mat_noyau:3,mat_mithril:2,mat_essence_arcane:5},m:180}];
const SHIPM={
 stockage:{n:'Soutes',d:'Capacité de stockage et de transport',rq:[null,null,'nv_2'],v:l=>`${[100,300,600,1200][l]} unités`,x:'mat_bois'},
 vitesse:{n:'Hélices et voilure',d:'Vitesse et autonomie',rq:['nv_1','el_vent','te_acc'],v:l=>`×${([1,1.25,1.5,2][l]+'').replace('.',',')}`,x:'mat_tissu'},
 protection:{n:'Bouclier magique',d:'Protection magique et défense',rq:['df_1','ar_sceau','df_2'],v:l=>`${[0,100,250,500][l]} points`,x:'mat_lingot'},
 detection:{n:'Longue-vue astrale',d:'Détection de planètes et de signaux',rq:['nv_1','nv_2','nv_3'],v:l=>`portée ${[1,2,3,5][l]}`,x:'mat_cristal'},
 camouflage:{n:'Voile de camouflage',d:'Camouflage et discrétion',rq:['ob_ombre','ob_ombre','ob_neant'],v:l=>`discrétion ${[0,20,40,60][l]} %`,x:'mat_essence_ombre'},
 pillage:{n:'Grappins de pillage',d:'Modules d’exploration et de pillage',rq:[null,'df_1','ob_neant'],v:l=>`butin emporté ${[0,10,20,35][l]} %`,x:'mat_croc'}};
const shipR=()=>JR('architecte','chantier')+JR('forgeron','chantier');
const shipMul=()=>(1-Math.min(.4,.08*shipR()))*(mrs('te_acc')?.75:1);
const shipRsOk=s=>!s.rs||s.rs.every(mrs);
function shipStart(){mgEnsure();const S=G.ship,i=S.stage,s=SHIPS[i];if(!s||S.q||s.lv>bl('chantier')||!shipRsOk(s)||!canX(s.c))return;payX(s.c);S.q={i,t0:Date.now(),d:Math.round(s.m*60000*shipMul())};save();rp();toast(`Chantier : <b>${s.n}</b> en construction.`)}
function shipTick(now){const S=G.ship;if(!S||!S.q)return;if(now>=S.q.t0+S.q.d){const s=SHIPS[S.q.i];S.stage=Math.max(S.stage,S.q.i+1);S.q=null;jWork('architecte',20,'chantier');jWork('forgeron',20,'chantier');toast(`${tabI2(pIco('rs_navigation','#5a8ab8','N'))}Bateau : <b>${s.n}</b> achevé (${S.stage} / ${SHIPS.length}).`,3600);if(PF)try{rp()}catch(_){}}}
function modCost(k,n){const o={gold:600*n};o[SHIPM[k].x]=4*n;if(n>=2)o.mat_cristal=(o.mat_cristal||0)+2*(n-1);if(n>=3)o.mat_noyau=1;return o}
function modLock(k,n){const S=G.ship;if(S.stage<2)return'Nacelle requise';if(n>bl('chantier'))return`Chantier niv. ${n}`;const r=SHIPM[k].rq[n-1];return r&&!mrs(r)?'recherche : '+MRS[r].n:''}
function modUp(k){mgEnsure();const S=G.ship,n=(S.mods[k]||0)+1;if(n>3||modLock(k,n))return;const o=modCost(k,n);if(!canX(o))return;payX(o);S.mods[k]=n;jWork('architecte',10,'chantier');save();rp();toast(`Module ${SHIPM[k].n} : niveau ${n}.`)}
const pilotOf=()=>G.ship&&G.ship.pilot?G.chars.find(c=>c.id==G.ship.pilot&&c.mage):null;
function shipStats(){const S=G.ship,m=S.mods,p=pilotOf(),d=p&&p.mage;return{cap:[100,300,600,1200][m.stockage],spd:[1,1.25,1.5,2][m.vitesse]*(d=='Temporelle'?1.2:1)*(mrs('nv_3')?1.1:1),prot:Math.round([0,100,250,500][m.protection]*(d=='Arcanique'?1.2:1)),det:[1,2,3,5][m.detection]+(d=='Élémentaire'?1:0),cam:[0,20,40,60][m.camouflage]+(d=='Obscure'?10:0),pil:[0,10,20,35][m.pillage]}}
const PILB={Arcanique:'stabilise les systèmes : Protection +20 %',Temporelle:'optimise le voyage : Vitesse +20 %',Élémentaire:'gère les conditions : Détection +1',Obscure:'discrétion : Camouflage +10 points',Naturelle:'équipage serein : soins en voyage (à venir)',Sacrée:'protège l’équipage : blessures en voyage −25 % (à venir)'};
function pilotSet(id){mgEnsure();const c=id?G.chars.find(x=>x.id==id&&x.mage):null;G.ship.pilot=c?c.id:null;if(!c)G.ship.ready=0;save();rp()}
function shipBapt(){mgEnsure();const S=G.ship;if(S.stage<SHIPS.length||!pilotOf()||S.ready)return;S.ready=1;save();rp();evoReveal({img:aSrc('bateau_ui')||aSrc('bateau')||bUi('chantier',3),col:'#7ad0ff',title:'BATEAU PRÊT !',name:'Le bateau montgolfier magique',from:0,to:0,small:1,lines:[`Pilote : <b>${pilotOf().name}</b> (mage ${pilotOf().mage})`,'Le voyage entre les planètes de la galaxie viendra plus tard.']})}
function chaHTML(pl){mgEnsure();const S=G.ship,L=pl.lv,now=Date.now(),st=shipStats(),p=pilotOf(),R=shipR();
 let h=`<p class="m">Cinq étapes de construction (temps réel, jeu fermé compris)${R?` · architectes et forgerons ici : durée −${mgPc(Math.min(.4,.08*R))}`:''}${mrs('te_acc')?' · Accélération −25 %':''}. Le bateau ne peut être piloté que par un mage (bible §16.2).</p>`;
 h+=`<div class="shipst">${SHIPS.map((s,i)=>`<span class="${i<S.stage?'ok':S.q&&S.q.i==i?'run':''}" title="${s.n}">${i+1}</span>`).join('')}<b>${S.ready?'Prêt à voler':S.stage>=SHIPS.length?'Coque achevée':'Étape '+(S.stage+1)+' / '+SHIPS.length}</b></div>`;
 if(S.q){const s=SHIPS[S.q.i],k=Math.min(1,(now-S.q.t0)/S.q.d);h+=`<div class="rsq"><b>En construction : ${s.n}</b><div class="xpb"><i style="width:${Math.round(k*100)}%"></i></div><span class="m">${fmtT(Math.ceil(Math.max(0,S.q.t0+S.q.d-now)/1000))}</span></div>`}
 else if(S.stage<SHIPS.length){const s=SHIPS[S.stage],lk=s.lv>L,nr=!shipRsOk(s);h+=`<div class="lbr mgc"><img src="${bUi('chantier',Math.max(1,s.lv))}" alt=""><div class="gr"><b>Étape ${S.stage+1} : ${s.n}</b> ${lk?`<span class="tg">Chantier niv. ${s.lv}</span>`:''}${nr?s.rs.filter(r=>!mrs(r)).map(r=>`<span class="tg">recherche : ${MRS[r].n}</span>`).join(''):''}<div class="m">Durée : ${mgMin(s.m*shipMul())}</div><div class="cr">${costX(s.c)}<button class="ib" ${lk||nr||!canX(s.c)?'disabled':''} onclick="shipStart()">Construire</button></div></div></div>`}
 h+=`<h3 class="sh">Pilote</h3>${p?`<div class="pst"><img class="sp" src="${cs(p).url}" alt=""><div class="gr"><b>${p.name}</b> ${stars(p.st)}<div class="m">Mage ${p.mage} · ${PILB[p.mage]||''}</div></div><button class="alt" onclick="pilotSet(0)">Retirer</button></div>`:`<p class="m">${G.chars.some(c=>c.mage)?'Choisissez un mage :':'Aucun mage au village : invoquez-en un, recrutez-le à la taverne ou lancez l’Appel aux mages (Tour de mage).'}</p>`}${G.chars.filter(c=>c.mage&&c.id!=(p&&p.id)).map(c=>`<div class="pst"><img class="sp" src="${cs(c).url}" alt=""><div class="gr"><b>${c.name}</b> ${stars(c.st)}<div class="m">Mage ${c.mage} · ${PILB[c.mage]||''}</div></div><button class="alt" onclick="pilotSet(${c.id})">Nommer pilote</button></div>`).join('')}`;
 if(S.stage>=SHIPS.length&&!S.ready)h+=`<p><button class="ib hot" ${p?'':'disabled'} onclick="shipBapt()">Baptême du bateau</button>${p?'':' <span class="w">un pilote mage est requis</span>'}</p>`;
 h+=`<h3 class="sh">Modules (bible §16.3)</h3><p class="m">Capacité <b>${st.cap}</b> · vitesse <b>×${(Math.round(st.spd*100)/100+'').replace('.',',')}</b> · protection <b>${st.prot}</b> · détection <b>${st.det}</b> · camouflage <b>${st.cam} %</b> · pillage <b>${st.pil} %</b></p><div class="rsg">`+Object.keys(SHIPM).map(k=>{const M=SHIPM[k],n=S.mods[k]||0,lk=n<3?modLock(k,n+1):'',o=n<3?modCost(k,n+1):null;return`<div class="rsc mgm${n>=3?' done':''}"><div><b>${M.n}</b> ${stars(n,3)}</div><div class="m">${M.d} : ${M.v(n)}${n<3?` <span class="nx">→ ${M.v(n+1)}</span>`:''}</div>${n<3?`<div class="cr">${lk?`<span class="tg">${lk}</span>`:costX(o)}<button class="ib" ${lk||!canX(o)?'disabled':''} onclick="modUp('${k}')">Installer</button></div>`:''}</div>`}).join('')+'</div>';
 return h}
/* ================= EFFETS EN EXPÉDITION ET EN COMBAT ================= */
function mgCB(){const o={atk:0,def:0,hp:0,spd:0,crit:0,edef:0,heal:0};if(!G||!G.mg)return o;const M=G.mg,add=b=>{for(const k in b)o[k]=(o[k]||0)+b[k]};
 if(M.meal&&M.meal.n>0)add(M.meal.b);const mt=mtOn();if(mt)add({spd:mt.spd,atk:mt.atk||0,crit:mt.crit||0});
 for(const k in BLESS)if(blOn(k)&&BLESS[k].b)add(BLESS[k].b);
 if(mrs('el_affin'))o.atk+=.04;if(mrs('el_maitrise'))o.atk+=.06;if(mrs('ar_sceau'))o.def+=.04;if(mrs('ob_ombre'))o.crit+=.04;if(mrs('ob_male'))o.edef+=.06;if(mrs('te_boucle'))o.spd+=4;if(mrs('sa_soin'))o.heal+=.04;return o}
function mgBattle(){if(!B||!B.A)return;const o=mgCB();B.mgcb=o;B.A.forEach(u=>{u.atk*=1+o.atk;u.def*=1+o.def;if(o.hp){u.mhp=Math.round(u.mhp*(1+o.hp));u.hp=Math.round(u.hp*(1+o.hp))}if(o.spd){const s0=u.spd;u.spd+=o.spd;if(u.av&&u.spd>0)u.av=u.av*s0/u.spd}u.crit=Math.min(.75,u.crit+o.crit)});if(o.edef)(B.E||[]).forEach(e=>{if(e.def)e.def*=1-o.edef})}
function mgAfterFight(r){if(!r||!G||!G.mg)return;const M=G.mg,o=mgCB();if(M.meal&&M.meal.n>0){M.meal.n--;if(!M.meal.n)toast(`Le ${TAVM[M.meal.k].n.toLowerCase()} ne fait plus effet.`)}
 if(r=='win'&&F&&F.hp){if(o.heal)party().forEach(c=>{const m=stats(c).hp;if(F.hp[c.id]>0)F.hp[c.id]=Math.min(m,F.hp[c.id]+Math.round(m*o.heal))});if(blOn('astres')&&Math.random()<.4)addM({['mat_essence_'+pick(F.bi&&F.bi.el||EK)]:1})}save()}
const mgGoldMul=()=>(blOn('fortune')?1.25:1)*(mrs('ob_neant')?1.15:1);
function mgReveal(fr){if(!F||!F.w||!F.seen)return;const t=[];for(let i=0;i<N*N;i++)if(F.w[i])t.push(i);if(!t.length)return;let n=0;for(const i of t)if(F.seen[i])n++;const goal=Math.min(t.length,n+Math.round(t.length*fr));let g=0;while(n<goal&&g++<500){const p=pick(t),ex=p%N,ey=Math.floor(p/N);for(let j=-5;j<=5;j++)for(let i=-5;i<=5;i++){const a=ex+i,b=ey+j;if(a>=0&&b>=0&&a<N&&b<N&&i*i+j*j<=27&&!F.seen[b*N+a]){F.seen[b*N+a]=1;if(F.w[b*N+a])n++}}}}
function mgExp(m){mgEnsure();const M=G.mg;if(M.meal&&M.meal.n>0)m.push(`${TAVM[M.meal.k].n} : ${fxTxt(M.meal.b)} (${M.meal.n} combats)`);
 if(M.mount&&bl('ecurie')){const mt=MOUNTS[M.mount];if(M.care>=25){F.mgMt=M.mount;M.care=Math.max(0,M.care-careLoss());m.push(`Monture : ${mt.n} (déplacement +15 %, VIT +${mt.spd})`)}else m.push(`<span class="w">${mt.n} trop fatigué : soignez-le à l’Écurie</span>`)}
 const bs=Object.keys(BLESS).filter(blOn);if(bs.length)m.push('Bénédictions : '+bs.map(k=>BLESS[k].n.replace('Bénédiction ','')).join(', '));
 if(M.rum&&M.rum.f==F.f){const R=M.rum;M.rum=null;if(R.L>=2)mgReveal(.25);m.push(`Rumeur de la taverne${R.L>=2?' : 25 % de la carte révélés':' confirmée'}`);if(R.L>=3&&F.quest)m.push(F.quest)}}
/* enveloppes des fonctions des autres fichiers (aucune modification de battle.js / tower.js) */
{const _bs=battleStart;battleStart=function(){try{mgBattle()}catch(e){console.warn('mages:combat',e)}return _bs.apply(this,arguments)};
 const _fi=fight;fight=async function(){const r=await _fi.apply(this,arguments);try{mgAfterFight(r)}catch(e){console.warn('mages:après combat',e)}return r};
 const _al=addLoot;addLoot=function(o){try{const m=mgGoldMul();if(m>1&&o&&o.gold>0)o.gold=Math.round(o.gold*m)}catch(_){}return _al.apply(this,arguments)};
 const _es=expStart;expStart=function(){const m=_es.apply(this,arguments);try{mgExp(m)}catch(e){console.warn('mages:départ',e)}return m};
 const _ef=enterFloor;enterFloor=function(){const r=_ef.apply(this,arguments);try{if(F&&F.mgMt)F.mont=1}catch(_){}return r};
 const _ce=cEvoCost;cEvoCost=function(c){const o=_ce.apply(this,arguments);try{if(o){const D=evoDisc();for(const k in o){if(k=='gold'&&D.g)o[k]=Math.round(o[k]*(1-D.g));else if(k.startsWith('mat_essence_')&&D.e)o[k]=Math.max(1,Math.ceil(o[k]*(1-D.e)))}}}catch(_){}return o};
 const _vr=vRefresh;vRefresh=function(){if(V.hl!=hdvLv()){V.hl=hdvLv();V.open=null}return _vr.apply(this,arguments)}}
/* ---------- horloge (1 s) : soins de l'écurie, recherches naturelles, chantier, bénédictions, défense ---------- */
let mgLast=Date.now();
function mgTick(){const now=Date.now(),dt=Math.min(60,Math.max(0,(now-mgLast)/1000));mgLast=now;if(!G||G.intro===0)return;mgEnsure();const M=G.mg;
 if(bl('ecurie')&&M.care<100)M.care=Math.min(100,M.care+careRate()*dt/3600);
 const fb=(mrs('na_seve')?.1:0)+(mrs('na_flor')?.15:0);if(dt)G.plots.forEach(p=>{if(!p)return;if(fb&&p.k=='ferme')p.stock=Math.min(ferMax(p.lv),(p.stock||0)+p.lv/4*dt*ferMul()*fb);if(mrs('na_flor')&&p.k=='chasse'&&p.acc){const m=chaMul();for(const k in CHR)p.acc[k]=Math.min(CHR[k]*p.lv*m*4,(p.acc[k]||0)+CHR[k]*p.lv*m*.15*dt/3600)}});
 for(const k in M.bless)if(M.bless[k]&&M.bless[k]<=now){delete M.bless[k];if(BLESS[k])toast(`${BLESS[k].n} : terminée.`)}
 shipTick(now);if(typeof mrsTick=='function')mrsTick(now);M.def=defRating()}
setInterval(mgTick,1000);
