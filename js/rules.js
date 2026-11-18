'use strict';
/* ================= RÈGLES DE LA TOUR PROPRES À CHAQUE PARTIE (docs/equilibrage.md §10) =================
   G.run = {v, seed, keep, b:[[loi, loi2, biome]…], m:{étage:[modificateurs]}}
   - Étages 1–3 : identiques dans toutes les parties (Forêt d'émeraude, « Étage du seuil » : aucune loi, aucun modificateur).
   - Ensuite des blocs : 4–5 (bloc court), puis 6–10, 11–15… Chaque bloc tire au hasard (graine de la partie) un biome et une loi,
     jamais la même loi ni le même biome que le bloc précédent ; à partir de l'étage 16, une seconde loi peut s'ajouter (combinaison).
   - Chaque étage après le 3e peut porter 0 à 2 modificateurs (brouillard, ennemis enragés, double butin…), de plus en plus fréquents.
   - Ancienne sauvegarde sans G.run : les étages déjà atteints (jusqu'à la fin du bloc de G.max) gardent l'ancienne loi et l'ancien biome
     (ordre fixe d'avant), sans modificateur ; le hasard commence au bloc suivant.
   Tout est tiré d'un générateur à graine et mis en cache dans G.run : même sauvegarde = mêmes règles après rechargement.
   Chargé avant main.js (enveloppe aucune fonction ; lu à l'exécution par tower.js, battle.js, village.js, sheet.js, galaxy.js…). */
LAWS.calme={n:'Étage du seuil',s:'☘',e:'Les trois premiers étages sont les mêmes dans toutes les parties : aucune loi, des groupes plus petits. Apprenez à explorer et à combattre.',c:'Aucune règle particulière.'};
const RUN_FIX=3;
/* générateur à graine (mulberry32) */
function rngOf(seed,salt){let s=(seed^Math.imul(salt+0x9e37,0x85ebca6b))>>>0;return()=>{s=(s+0x6D2B79F5)|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const rPick=(r,a)=>a[Math.floor(r()*a.length)];
function runNew(){return{v:1,seed:Math.floor(Math.random()*2147483647),keep:0,b:[],m:{}}}
function runOf(){if(!G)return null;if(!G.run||typeof G.run!='object'){const r=runNew();if((G.max||1)>1){r.keep=Math.max(5,Math.ceil(G.max/5)*5);r.mig=1}G.run=r}if(!Array.isArray(G.run.b))G.run.b=[];if(!G.run.m||typeof G.run.m!='object')G.run.m={};return G.run}
/* blocs : 0 = étages 1–3, 1 = étages 4–5, puis b = 5(b−1)+1 … 5b */
const blockOf=f=>f<=RUN_FIX?0:f<=5?1:1+Math.floor((f-1)/5);
const blockRange=b=>b==0?[1,RUN_FIX]:b==1?[RUN_FIX+1,5]:[5*(b-1)+1,5*b];
const LAW_GENTLE=['traque','tenebres','prisme','verrous','orage','sablier'],LAW_NO=[['duel','gel']];
function runBlock(b){const R=runOf();if(!R)return['calme',null,0];if(R.b[b])return R.b[b];let v;const[s]=blockRange(b);
 if(b==0)v=['calme',null,0];
 else if(R.keep&&s<=R.keep){const ob=Math.floor((s-1)/5);v=[LAWK[ob%LAWK.length],null,ob%BIOMES.length]}
 else{const p=runBlock(b-1),r=rngOf(R.seed,b*131+7),law=rPick(r,(b==1?LAW_GENTLE:LAWK).filter(k=>k!=p[0]&&k!=p[1])),bi=rPick(r,BIOMES.map((x,i)=>i).filter(i=>i!=p[2]));
  const pc=s>=36?.6:s>=26?.42:s>=16?.25:0;let l2=null;if(r()<pc){const L=LAWK.filter(k=>k!=law&&k!=p[0]&&k!=p[1]&&!LAW_NO.some(x=>x.includes(k)&&x.includes(law)));if(L.length)l2=rPick(r,L)}v=[law,l2,bi]}
 R.b[b]=v;return v}
const lawOf=f=>runBlock(blockOf(f))[0],law2Of=f=>runBlock(blockOf(f))[1],lawsOf=f=>runBlock(blockOf(f)).slice(0,2).filter(Boolean),biomeOf=f=>BIOMES[runBlock(blockOf(f))[2]]||BIOMES[0],lawLv=f=>1+Math.floor(Math.max(0,f-1)/30);
/* loi active sur l'étage courant (une ou deux) */
const hasLaw=k=>!!F&&(F.law==k||F.law2==k);
const lawSyms=f=>lawsOf(f).map(k=>LAWS[k].s).join('');
/* ---------- modificateurs d'étage ---------- */
const FMODS={
 brouillard:{n:'Brouillard',s:'≋',c:'#9fb3c8',d:'Vision réduite de moitié ; la carte se dévoile moins vite.'},
 enrages:{n:'Ennemis enragés',s:'♨',c:'#ff5a3a',d:'ATQ des ennemis +20 %.'},
 horde:{n:'Horde',s:'⁂',c:'#ff9a3a',d:'Un monstre de plus dans chaque groupe.'},
 elites:{n:'Élites renforcés',s:'♛',c:'#ffcf4a',d:'Élites deux fois plus fréquents, un affixe de plus, PV +25 %.'},
 soins:{n:'Soins réduits',s:'⊘',c:'#c58bff',d:'Tous les soins −40 % ; les feux de camp ne rendent que la moitié.'},
 blindes:{n:'Peaux de fer',s:'⛨',c:'#bfc8d6',d:'DEF des ennemis +40 %.'},
 butin:{n:'Double butin',s:'✦',c:'#5fe07a',d:'Or et ressources ramassés ×2.',pos:1},
 aubaine:{n:'Bénédiction',s:'☀',c:'#4de0c0',d:'Équipe : ATQ +10 %, soins +20 %.',pos:1}};
const FMNEG=Object.keys(FMODS).filter(k=>!FMODS[k].pos),FMPOS=Object.keys(FMODS).filter(k=>FMODS[k].pos);
function modsOf(f){const R=runOf();if(!R||f<=RUN_FIX||(R.keep&&f<=R.keep))return[];if(R.m[f])return R.m[f];const r=rngOf(R.seed,10007+f*17),o=[];
 const p1=Math.min(.85,.12+.022*f),p2=f>=18?Math.min(.5,(f-15)*.016):0;
 if(r()<p1){o.push(r()<.18?rPick(r,FMPOS):rPick(r,FMNEG));if(r()<p2){const L=FMNEG.filter(k=>!o.includes(k));o.push(rPick(r,L))}}
 R.m[f]=o;return o}
const modOn=k=>!!F&&!!F.mods&&F.mods.includes(k);
const modTag=k=>`<span class="fmod${FMODS[k].pos?' pos':''}" style="border-color:${FMODS[k].c}" title="${FMODS[k].d}"><i style="color:${FMODS[k].c}">${FMODS[k].s}</i>${FMODS[k].n}</span>`;
/* ---------- échelle des monstres (remplace la formule de mkFoe) ----------
   Étages 1–3 : ATQ ×0,9 (apprentissage). Au-delà : ATQ ×1,05 par étage (composé, jusqu'à l'étage 45), PV +0,5 %/étage, DEF +1/étage en plus de l'ancienne courbe.
   Les pillages galactiques (F.law 'gxraid') gardent l'ancienne courbe : leurs chances affichées en dépendent. */
function foeBase(f,raid){const old={hp:130*fScale(f,1.2,1.1),atk:24*fScale(f,1.16,1.08),def:10+3*f};if(raid)return old;const k=Math.max(0,f-RUN_FIX);return{hp:old.hp*(1+.005*k),atk:old.atk*(f<=RUN_FIX?.9:Math.pow(1.05,Math.min(k,42))),def:old.def+k}}
/* ---------- affixes d'élite ---------- */
const AFX={
 enrage:{n:'Enragé',s:'♨',c:'#ff5a3a',d:'ATQ +25 % ; sous 50 % de PV, encore +25 %.'},
 blinde:{n:'Blindé',s:'⛨',c:'#bfc8d6',d:'DEF ×1,8 et ténacité +50 %.'},
 vampire:{n:'Vampirique',s:'♥',c:'#e0405a',d:'Se soigne de 35 % des dégâts qu’il inflige.'},
 invoc:{n:'Invocateur',s:'⁂',c:'#c58bff',d:'Appelle un serviteur tous les 3 tours (2 au plus).'},
 explosif:{n:'Explosif',s:'✸',c:'#ffb04a',d:'Explose à sa mort : 80 % de son ATQ à toute l’équipe.'},
 rapide:{n:'Rapide',s:'»',c:'#6fd3ff',d:'VIT +40 %.'},
 reflet:{n:'Réfléchissant',s:'◇',c:'#e8e8ff',d:'Renvoie 20 % des dégâts directs reçus.'},
 regen:{n:'Régénérant',s:'✚',c:'#5fe07a',d:'Récupère 6 % de ses PV à chaque tour.'}};
const AFXK=Object.keys(AFX);
function afxRoll(d,f,mods){if(d.afx)return d.afx;let n=0;if(f>RUN_FIX){if(d.kind=='elite')n=1+(f>=20?1:0)+(f>=35?1:0);else if(d.kind=='mini'||d.kind=='boss')n=(f>=15?1:0)+(f>=30?1:0)}if(n&&mods.includes('elites'))n++;
 const L=shuffle(AFXK.filter(k=>!(d.kind=='boss'&&k=='explosif')));d.afx=L.slice(0,Math.min(n,3));return d.afx}
function afxApply(u){(u.afx||[]).forEach(k=>{if(k=='enrage')u.atk*=1.25;if(k=='blinde'){u.def*=1.8;u.mt=u.tough=Math.ceil(u.tough*1.5)}if(k=='rapide')u.spd=Math.round(u.spd*1.4)})}
const afxTags=u=>(u.afx||[]).map(k=>`<span class="afx" style="color:${AFX[k].c}" title="${AFX[k].d}">${AFX[k].s} ${AFX[k].n}</span>`).join(' ');
/* chance qu'un groupe soit mené par un élite */
const eliteP=f=>f<=RUN_FIX?0:Math.min(.4,.04+.01*f)*(modsOf(f).includes('elites')?1.8:1);
/* ---------- IA ennemie ---------- */
const BACKR=['soigneur','sorcier','archer','soutien'];
/* choix de cible : les blessés et la ligne arrière attirent les coups ; plus l'étage est haut, plus l'ennemi est méthodique (étages 1–3 : au hasard) */
function foeTarget(e,pool){const f=F?F.f:1;if(f<=RUN_FIX||F.law=='gxraid'||Math.random()>Math.min(.85,.3+.015*f))return pick(pool);
 let best=pool[0],bs=-1;pool.forEach(a=>{const s=(1-a.hp/a.mhp)*2.2+(BACKR.includes(a.c.role)?.8:0)+(a.c.role=='gardien'?.4:0)-(a.guard?.6:0)+Math.random()*.9;if(s>bs){bs=s;best=a}});return best}
/* compétences de monstres (une toutes les 3 actions au plus, à partir de l'étage 4) */
const FOESK={
 loup:{n:'Hurlement',ok:e=>foes().length>1,run:async e=>{foes().forEach(x=>{if(x.kind!='obj'){x.bf.atk={v:Math.max(.2,bfv(x,'atk')),t:2};fl(x,'ATQ +20 %','deb')}})}},
 chacal:{n:'Curée',ok:e=>allies().some(a=>a.hp<a.mhp*.5),run:async e=>{const t=allies().slice().sort((a,b)=>a.hp/a.mhp-b.hp/b.mhp)[0];await hitAnim(e,t,()=>deal(e,t,1.6,0))}},
 champi:{n:'Spores curatives',ok:e=>foes().some(x=>x.kind!='obj'&&x.hp<x.mhp*.55),run:async e=>{const t=foes().filter(x=>x.kind!='obj').sort((a,b)=>a.hp/a.mhp-b.hp/b.mhp)[0];await cast(e,'#5fe07a');heal(t,t.mhp*.22)}},
 spectre:{n:'Cri glaçant',ok:e=>allies().some(a=>a.en>=50),run:async e=>{const t=allies().slice().sort((a,b)=>b.en-a.en)[0];await cast(e,'#c58bff');t.en=Math.max(0,t.en-40);fl(t,'ÉNERGIE −40','deb');say(e.n+' glace '+t.n+' : son ultime s’éloigne !')}},
 golem:{n:'Carapace',ok:e=>e.hp<e.mhp*.7&&!(e.sh>0),run:async e=>{await cast(e,'#bfe8ff');e.sh=Math.round(e.mhp*.2);e.sht=3;fl(e,'CARAPACE','buf')}},
 squelette:{n:'Frappe brutale',ok:e=>true,run:async e=>{const t=allies().slice().sort((a,b)=>a.hp-b.hp)[0];await hitAnim(e,t,()=>deal(e,t,1.5,0))}},
 slime:{n:'Acide',ok:e=>true,run:async e=>{const t=pick(allies());await hitAnim(e,t,()=>{deal(e,t,.8,0);if(t.alive){t.bf.def={v:Math.min(-.25,bfv(t,'def')),t:2};fl(t,'DEF −25 %','deb')}},1)}}};
async function foeSkill(e){const f=F?F.f:1;if(f<=RUN_FIX||F.law=='gxraid'||e.kind=='obj'||e.kind=='minion')return false;if((e.skc||0)>0){e.skc--;return false}const S=FOESK[e.type];if(!S||!S.ok(e)||Math.random()>Math.min(.5,.22+.008*f))return false;
 e.skc=2;say(e.n+' — '+S.n);fl(e,S.n,'deb');await S.run(e);await sleep(260);return true}
/* phases de boss : seuils de PV ; attaque dévastatrice annoncée un tour à l'avance (Défense ou rupture de ténacité pour l'interrompre) */
const phaseThr=e=>e.kind=='boss'?[.66,.33]:e.kind=='mini'&&F&&F.f>=15&&F.law!='gxraid'?[.5]:[];
async function foePhase(e){const th=phaseThr(e),p=e.phase||0;if(p>=th.length||e.hp/e.mhp>th[p])return false;e.phase=p+1;e.bf={};e.broken=0;e.tough=e.mt;e.atk*=1.2;e.spd+=8;
 flashT('PHASE '+(e.phase+1));B.shake=7;const pp=fpos(e);spark(pp[0],pp[1]+20,'#ff5a5a',30,90);
 if(e.phase==1){say(e.n+' entre en furie : nouvelle phase !');for(let i=0;i<(e.kind=='boss'?2:1);i++)addFoe({type:pick(F.bi.mon),elem:e.elem,kind:'minion'})}
 else{say(e.n+' puise dans ses dernières forces !');e.sh=Math.round(e.mhp*.15);e.sht=3;e.atk*=1.1}
 await sleep(700);drawTI();return true}
const teleN=e=>e.kind=='boss'?(e.phase?3:4):e.phase?3:0;
async function foeTele(e){if(e.tele){e.tele=0;const m=(e.kind=='boss'?2:1.7)*(e.phase>=2?1.25:1);say(e.n+' déchaîne le Cataclysme !');flashT('CATACLYSME');await anim(220,k=>e.ox=-16*Math.sin(k*3.14));B.shake=9;allies().forEach(a=>deal(e,a,m,0));await sleep(360);return true}
 const n=teleN(e);if(n&&e.turns%n==0&&!e.charging){e.tele=1;say(e.n+' rassemble son énergie : Cataclysme au prochain tour ! Défendez-vous ou brisez sa ténacité.');fl(e,'⚠ CATACLYSME','deb');await sleep(650);drawTI();return true}return false}
/* ---------- danger d'un étage pour l'équipe actuelle (affiché avant d'entrer) ---------- */
const DANG=[['Sûr','#5fe07a'],['Modéré','#c8e05f'],['Dangereux','#ffcf4a'],['Très dangereux','#ff9a3a'],['Mortel','#ff5a5a']];
function floorDanger(f,ps){ps=ps||party();if(!ps.length)return{lv:4,s:0,t:DANG[4][0],c:DANG[4][1]};const L=lawsOf(f),M=modsOf(f),b=foeBase(f);let atk=b.atk*(M.includes('enrages')?1.2:1),def=b.def*(M.includes('blindes')?1.4:1);
 if(f%10==0){atk*=1.25}else if(f%5==0)atk*=1.12;if(L.includes('duel'))ps=ps.slice(0,2);
 const v=ps.map(c=>stats(c)),ttk=v.reduce((a,x)=>a+b.hp/(x.atk*(M.includes('aubaine')?1.1:1)*100/(100+def)),0)/v.length,surv=v.reduce((a,x)=>a+x.hp/(atk*100/(100+x.def)),0)/v.length;
 let s=surv/(ttk*8)*(ps.length/4)**.5;if(L.includes('gel')||M.includes('soins'))s*=.8;if(L.includes('duel'))s*=.85;const lv=s>=1.5?0:s>=.9?1:s>=.55?2:s>=.3?3:4;return{lv,s,t:DANG[lv][0],c:DANG[lv][1],ttk,surv}}
function dangerHTML(f){const d=floorDanger(f),h=party().some(c=>c.hero);return`<div class="dng" style="border-color:${d.c}"><b style="color:${d.c}">Danger : ${d.t}</b>${d.lv>=3?` — <b class="w">⚠ ${d.lv>=4?'mortel':'très dangereux'} pour votre équipe</b>${h?' : <b class="w">le héros risque la mort définitive (fin de partie)</b>.':'.'}`:d.lv==2?' — combats serrés, blessures probables.':' — à votre portée.'}</div>`}
/* ---------- PV entre deux étages : l'équipe ne repart plus soignée gratuitement ----------
   G.hpk = {id: fraction de PV}, G.hpkT = horodatage. Récupération au village : 4 %/min (+2 %/min par niveau d'Infirmerie).
   Repos immédiat payant (vivres + or). Étages 1–3 : toujours PV pleins. */
const hpRate=()=>.04+.02*bl('inf');
function hpNow(c){const k=G.hpk&&G.hpk[c.id];if(k==null)return 1;return Math.min(1,k+Math.max(0,Date.now()-(G.hpkT||0))/60000*hpRate())}
function hpStore(){const now=Date.now(),o={};if(G.hpk)for(const id in G.hpk){const c=G.chars.find(x=>x.id==id);if(c){const v=hpNow(c);if(v<1)o[id]=v}}
 if(F&&F.hp&&F.law!='gxraid')for(const id in F.hp){const c=G.chars.find(x=>x.id==id);if(!c)continue;const m=stats(c).hp,v=clamp((F.hp[id]||0)/m,.05,1);if(v<1)o[id]=v;else delete o[id]}G.hpk=o;G.hpkT=now}
const teamHp=()=>{const p=party();return p.length?p.reduce((a,c)=>a+hpNow(c),0)/p.length:1};
function restCost(){const o={food:0,gold:0},f=G.max||1;party().forEach(c=>{const m=1-hpNow(c);if(m>0){o.food+=m*(10+f/2);o.gold+=m*(15+6*f)}});o.food=Math.ceil(o.food);o.gold=Math.ceil(o.gold);return o}
function restNow(){const o=restCost();if(!o.gold&&!o.food)return;if(!can(o))return toast('Pas assez de vivres ou d’or pour un repos complet.');pay(o);hpStore();party().forEach(c=>delete G.hpk[c.id]);save();toast('L’équipe se repose à l’Auberge : PV pleins.');if(typeof rp=='function')rp()}
function restHTML(){const h=teamHp();if(h>=.995)return'<p class="m">PV de l’équipe : pleins.</p>';const o=restCost();return`<p>PV de l’équipe : <b style="color:${h<.5?'var(--red)':'var(--gold)'}">${Math.round(h*100)} %</b> <span class="m">(récupération ${Math.round(hpRate()*100)} %/min au village — l’Infirmerie l’accélère)</span> <button class="alt" ${can(o)?'':'disabled'} onclick="restNow()">Repos complet (${o.food} vivres, ${o.gold} or)</button></p>`}
/* ---------- affichage des règles ---------- */
function rulesHTML(f,full){const L=lawsOf(f),M=modsOf(f),[b0,b1]=blockRange(blockOf(f));let h=L.map(k=>{const W=LAWS[k];return`<b>${W.s} ${W.n}</b>${full?`<p>${W.e}</p><p class="m">Combat : ${W.c}</p>`:''}`}).join(L.length>1?'<div class="g">+</div>':'');
 h+=`<div class="m">Étages ${b0}–${b1} · ${biomeOf(f).n}${L.length>1?' · <b class="w">deux lois combinées</b>':''}${f<=RUN_FIX?' · étages fixes d’apprentissage':''}</div>`;if(M.length)h+=full?M.map(k=>`<p class="m"><b style="color:${FMODS[k].c}">${FMODS[k].s} ${FMODS[k].n}</b> : ${FMODS[k].d}</p>`).join(''):`<div class="fmods">${M.map(modTag).join(' ')}</div>`;return h}
