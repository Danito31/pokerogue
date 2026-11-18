'use strict';
/* ================= TIRAGE DU HÉROS (gacha), TOUR DES MODIFICATIONS, CODES (docs/intro.md §7, docs/codes.md) =================
   Rouleaux horizontaux façon machine à sous (défilement de gauche à droite, décélération, quasi-victoire, flash).
   Tirage honnête selon PTIERS / RTIERS (js/data.js) ; talents relancés selon RARW (tous les paliers, pas la roue truquée).
   État : G.rr (jetons de relance) · G.codes [{h,t}] (codes utilisés : empreintes seulement) · c.cls0 (classe de départ du héros) · drapeau G.v_gacha.
   Accroches (sans toucher aux fichiers des autres) : BLD/XEFF/XPAN (bâtiment), bSprite (sprite), openTeam (bouton Code), finalFight/evtDone (jetons), heroBoot (migration).
   Test : window.GACHA_FORCE={pers:'Prodige',race:'Ange',tal:'...',cls:'...'} impose le résultat des tirages suivants (outil de test, docs/codes.md). */
const GRM=()=>{try{return matchMedia('(prefers-reduced-motion:reduce)').matches}catch(_){return false}};
const gFmtP=v=>(v>=1?+v.toFixed(2):v>=.1?+v.toFixed(3):+v.toFixed(4)).toLocaleString('fr-FR',{maximumFractionDigits:4})+' %';
/* petits bips 8 bits (WebAudio, silencieux si indisponible) */
const GSND={ac:null};
function gBeep(f,d,type,v,at){try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return;const c=GSND.ac=GSND.ac||new A();if(c.state=='suspended')c.resume();const t=c.currentTime+(at||0),o=c.createOscillator(),g=c.createGain();o.type=type||'square';o.frequency.value=f;g.gain.setValueAtTime(v||.035,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(c.destination);o.start(t);o.stop(t+d+.02)}catch(_){}}
const gJingle=top=>{(top?[523,659,784,1047,1319,1568]:[523,659,784]).forEach((f,i)=>gBeep(f,.16,'square',.045,i*.09))};
const gForce=k=>{const F0=window.GACHA_FORCE;return F0&&F0[k]?F0[k]:null};
/* ---------- tables de tirage ---------- */
const persIco=k=>pIco('sk_ame_'+(PKEY[k]||'x'),VOIEN[VOIE[k]||'coeur'][1],k);
const RTAL=()=>RARN.map((n,r)=>({n,c:r,p:RARW[r]/RARW.reduce((a,v)=>a+v,0)*100,L:TALK.filter(k=>TALENTS[k].r==r)}));
const RCLS=c=>{const L=CLS0.filter(([r])=>!(MAGR.includes(r)&&!heroMag(c))).map(x=>x[0]);return[{n:'Classe',c:0,p:100,L}]};
const talentRollFair=()=>gForce('tal')||tierRoll(RTAL());
const persRollHero=()=>gForce('pers')||tierRoll(PTIERS);
const raceRollHero=()=>gForce('race')||tierRoll(RTIERS);
/* entrées des rouleaux : {k,n,col,tn,img,top} */
function gEntries(kind,c){
 if(kind=='pers')return PTIERS.flatMap((t,i)=>t.L.map(k=>({k,n:k,col:GTC[t.c],tn:t.n,img:persIco(k),top:i==PTIERS.length-1,ti:i})));
 if(kind=='race')return RTIERS.flatMap((t,i)=>t.L.map(k=>({k,n:k,col:GTC[t.c],tn:'Race '+t.n,img:scaleC(drawChar(Object.assign({},c,{id:-9,race:k}),{b:0}),2).toDataURL(),top:i==RTIERS.length-1,ti:i})));
 if(kind=='tal')return TALK.map(k=>({k,n:TALENTS[k].n,col:RARC[TALENTS[k].r],tn:RARN[TALENTS[k].r],img:scaleC(talBadge(k),2).toDataURL(),top:TALENTS[k].r==4,ti:TALENTS[k].r}));
 return RCLS(c)[0].L.map(r=>({k:r,n:ROLES[r].n,col:'#ffcf4a',tn:'Classe',img:scaleC(drawChar(Object.assign({},c,{id:-9,role:r}),{b:0}),2).toDataURL(),top:0,ti:0}))}
const gTables=(kind,c)=>kind=='pers'?PTIERS:kind=='race'?RTIERS:kind=='tal'?RTAL():RCLS(c);
/* tableau des taux : paliers, %, entrées */
function oddsHTML(kind,c){const T=gTables(kind,c),col=t=>kind=='tal'?RARC[t.c]:kind=='cls'?'#ffcf4a':GTC[t.c];
 return`<div class="gaods">${T.map((t,i)=>`<div class="gaor${kind!='tal'&&kind!='cls'&&i==T.length-1?' sec':''}" style="--rc:${col(t)}"><div class="gaoh"><b>${kind=='race'?'Race '+t.n:t.n}</b><span>${gFmtP(t.p)}</span></div><div class="gaol">${t.L.map(k=>`<span class="tg" title="${kind=='pers'?PERS[k]:kind=='race'?RACET[k].d:kind=='tal'?TALENTS[k].d:ROLES[k].sk[1]}">${kind=='tal'?TALENTS[k].n:kind=='cls'?ROLES[k].n:k} <small>${gFmtP(t.p/t.L.length)}</small></span>`).join('')}</div></div>`).join('')}</div>`}
/* ---------- rouleau ---------- */
function reelHTML(id,label){return`<div class="rl"><div class="rlh"><b>${label}</b><span id="${id}_r" class="m">—</span></div><div class="reel" id="${id}"><div class="rst"></div><i class="rptr"></i><i class="rfl"></i></div></div>`}
const rCell=e=>`<div class="rcl" style="--rc:${e.col}"><img src="${e.img}" alt=""><span>${e.n}</span><em>${e.tn}</em></div>`;
function reelSet(id,E,k){const el=$('#'+id);if(!el)return;const e=E.find(x=>x.k==k)||E[0],i=E.indexOf(e),L=[-4,-3,-2,-1,0,1,2,3,4].map(d=>E[((i+d)%E.length+E.length)%E.length]),st=el.querySelector('.rst');st.innerHTML=L.map(rCell).join('');
 const cw=st.firstChild.offsetWidth||84;st.style.transform=`translateX(${Math.round(el.clientWidth/2-4.5*cw)}px)`;st.children[4].classList.add('win');const r=$('#'+id+'_r');if(r){r.innerHTML=`<b style="color:${e.col}">${e.n}</b> · ${e.tn}`}}
/* tire au sort la bande, pose la cible (et la quasi-victoire juste après elle), défile de gauche à droite, s'arrête au bord, se recale */
function reelSpin(id,E,k,o={}){return new Promise(res=>{const el=$('#'+id);if(!el)return res();const st=el.querySelector('.rst'),rm=GRM(),N=rm?14:46,ti=4,tg=E.find(x=>x.k==k)||E[0],best=E.filter(x=>x.k!=k).sort((a,b)=>b.ti-a.ti),cells=[];
  for(let i=0;i<N;i++)cells.push(pick(E));cells[ti]=tg;if(best.length){cells[ti-1]=best[0];cells[ti+1]=best[Math.min(best.length-1,1+Math.floor(Math.random()*2))]}
  st.innerHTML=cells.map(rCell).join('');const cw=st.firstChild.offsetWidth||84,W=el.clientWidth,tx=i=>W/2-(i+.5)*cw,x0=tx(N-3),xn=tx(ti)+(rm?0:.36*cw),x1=tx(ti),D=(o.dur||3.4)*(rm?.25:1),t0=performance.now();let last=-1;el.classList.add('spin');
  const rr=$('#'+id+'_r');if(rr)rr.textContent='…';
  (function f(now){if(!el.isConnected)return res();const t=(now-t0)/1000;let x,done=0;
   if(t<D){const k=t/D;x=x0+(xn-x0)*(1-Math.pow(1-k,4.2))}else if(!rm&&t<D+.45)x=xn;else if(!rm&&t<D+.8){const k=(t-D-.45)/.35;x=xn+(x1-xn)*eIO(k)}else{x=x1;done=1}
   st.style.transform=`translateX(${x.toFixed(1)}px)`;const ci=Math.floor((W/2-x)/cw);if(ci!=last){if(last>=0&&!rm){const e=cells[ci]||tg;gBeep(260+e.ti*90,.025,'square',.025);el.classList.remove('tk');void el.offsetWidth;el.classList.add('tk')}last=ci}
   if(!done)return requestAnimationFrame(f);el.classList.remove('spin');const wc=st.children[ti];wc.classList.add('win');el.style.setProperty('--fc',tg.col);el.classList.remove('flash','big');void el.offsetWidth;el.classList.add('flash');if(tg.top){el.classList.add('big');gJingle(1)}else gBeep(tg.ti>=2?880:620,.12,'triangle',.05);
   if(rr)rr.innerHTML=`<b style="color:${tg.col}">${tg.n}</b> · ${tg.tn}`;res(tg)})(t0)})}
/* ---------- application au héros ---------- */
function gReinit(c,pers){if(pers){c.subs=null;c.sub=undefined;c.gr=undefined}const job=c.job;c.skills=undefined;c.cls=undefined;c.tree=undefined;c.job=undefined;c.deck=[];c.lv=1;c.xp=0;c.xpBank=0;initPers(c);if(job&&job.id)c.job=job;for(const k in CS)if(k.startsWith(c.id+':'))delete CS[k]}
/* ================= ÉCRAN « TIRAGE » DE L'INTRO (après le créateur, avant la roue des talents) ================= */
function gachaIntro(){const I=INTRO;if(!I)return;I.ph='gacha';I.t=0;I.ga=I.ga||{tab:'tir',done:0,rerP:1,rerR:1,spin:0,keep:null};gachaUI()}
function gachaUI(){const I=INTRO,c=I.c,A=I.ga,sec=PSEC.includes(c.pers),tp=tierOf(PTIERS,c.pers),tr=tierOf(RTIERS,c.race);
 const res=A.done?`<div class="gres"><div class="pcard flip"><div class="pin"><b style="color:${GTC[PTIERS[tp].c]}">${c.pers}</b> <span class="tg" style="border-color:${GTC[PTIERS[tp].c]};color:${GTC[PTIERS[tp].c]}">${PTIERS[tp].n}</span> <span class="m">— ${PERS[c.pers]}</span><div>${c.subs.map(t=>`<span class="tg">${t}</span>`).join('')}</div><div class="m"><i>« ${(LN[c.pers].find(l=>/[a-zà-ÿ]{3}/i.test(l))||PERS[c.pers])} »</i></div></div></div>
  <div class="pcard flip"><div class="pin"><b style="color:${GTC[RTIERS[tr].c]}">${c.race}</b> <span class="tg" style="border-color:${GTC[RTIERS[tr].c]};color:${GTC[RTIERS[tr].c]}">Race ${RTIERS[tr].n}</span><div class="m">Héritage : ${RACET[c.race].d}</div><div class="m">Le héros reste <b>1★</b> : « ${RTIERS[tr].n} » est la rareté de sa race.</div></div></div>${sec||tr>=4?`<p class="gsec">✦ ${sec?'PERSONNALITÉ SECRÈTE':'RACE '+RTIERS[tr].n.toUpperCase()} ✦ <span class="m">${sec?'1 chance sur 10 000':gFmtP(RTIERS[tr].p)}</span></p>`:''}</div>`:'';
 const btns=A.spin?'<button disabled>…</button>':A.done?`${A.rerP?`<button class="alt" onclick="gachaRoll('p')">🔁 Relancer la personnalité (1 gratuite)</button>`:'<span class="m">Personnalité : relance utilisée.</span>'} ${A.rerR?`<button class="alt" onclick="gachaRoll('r')">🔁 Relancer la race (1 gratuite)</button>`:'<span class="m">Race : relance utilisée.</span>'} <button onclick="gachaOK()">Valider → Roue des talents</button>`:`<button class="hot2" onclick="gachaRoll(0)">Lancer les rouleaux !</button>`;
 $('#iui').innerHTML=`<div class="hc px gaw"><h2>Tirage du destin</h2><div class="ltb gtb"><button class="${A.tab=='tir'?'on':'alt'}" ${A.spin?'disabled':''} onclick="gachaTab('tir')">🎰 Tirage</button><button class="${A.tab=='odds'?'on':'alt'}" ${A.spin?'disabled':''} onclick="gachaTab('odds')">📊 Taux d’apparition</button></div>`+
 (A.tab=='odds'?`<p class="m">Tirage honnête, sans trucage (contrairement à une certaine roue…). Un palier est tiré selon son pourcentage, puis une entrée au hasard dans ce palier.</p><h3 class="sh">Personnalité</h3>${oddsHTML('pers')}<h3 class="sh">Race (rareté 1★ → 6★)</h3>${oddsHTML('race')}<p class="m">Le héros reste un personnage <b>1★</b> (règle du jeu) ; le palier de race est la rareté de sa lignée et de son héritage. Les invocations gardent leurs règles (races non humaines dès 2★).</p><p style="text-align:center"><button onclick="gachaTab('tir')">← Retour au tirage</button></p>`:
 `<p class="m" style="text-align:center;margin:0 0 6px">Deux rouleaux, aucun trucage : ta <b>personnalité</b> et ta <b>race</b>.</p><div class="gpv"><canvas id="gprev" width="32" height="30"></canvas></div>${reelHTML('grp','Personnalité')}${reelHTML('grr','Race')}<div id="gres">${res}</div><p class="gbt">${btns}</p>`)+`</div>`;
 if(A.tab=='tir'){const Ep=gEntries('pers'),Er=gEntries('race',c);reelSet('grp',Ep,A.done||A.keep=='p'?c.pers:pick(Ep).k);reelSet('grr',Er,A.done||A.keep=='r'?c.race:pick(Er).k);if(!A.done)['grp','grr'].filter(id=>!(A.keep=='p'&&id=='grp'||A.keep=='r'&&id=='grr')).forEach(id=>{const e=$('#'+id+' .rcl.win');if(e)e.classList.remove('win');const r=$('#'+id+'_r');if(r)r.textContent='?'})}I.gpk=null}
function gachaTab(t){const A=INTRO&&INTRO.ga;if(!A||A.spin)return;A.tab=t;gachaUI()}
async function gachaRoll(re){const I=INTRO,A=I&&I.ga;if(!A||A.spin)return;/* re : 0 = tirage initial (les deux rouleaux), 'p' = relance de la personnalité seule, 'r' = relance de la race seule (une relance gratuite par rouleau) */
 if(re=='p'){if(!A.rerP)return;A.rerP=0}else if(re=='r'){if(!A.rerR)return;A.rerR=0}
 const c=I.c,keep=re=='p'?'r':re=='r'?'p':null;A.spin=1;A.done=0;A.keep=keep;gachaUI();const p=keep=='p'?c.pers:persRollHero(),r=keep=='r'?c.race:raceRollHero(),Ep=gEntries('pers'),Er=gEntries('race',c);
 const a=keep=='p'?0:reelSpin('grp',Ep,p,{dur:3.2}),b=keep=='r'?0:reelSpin('grr',Er,r,{dur:keep?3.2:4.3});await a;await b;if(INTRO!=I)return;
 const pc=c.pers!=p;c.pers=p;c.race=r;gReinit(c,pc||!keep);A.spin=0;A.done=1;A.keep=null;const top=(keep!='p'&&PSEC.includes(p))||(keep!='r'&&tierOf(RTIERS,r)>=5);if(top||(keep!='p'&&tierOf(RTIERS,r)>=4)){flashW();if(!GRM())$('#iui').classList.add('gshk')}setTimeout(()=>{const u=$('#iui');if(u)u.classList.remove('gshk')},700);gachaUI()}
function gachaOK(){const I=INTRO;if(!I||!I.ga||!I.ga.done||I.ga.spin)return;wheelStart()}
function gachaPrev(I){const cv=$('#gprev');if(!cv)return;const fr=Math.floor(I.t*2)%2,k=I.c.race+JSON.stringify(I.c.look)+fr;if(I.gpk==k)return;I.gpk=k;const x=cv.getContext('2d');x.clearRect(0,0,32,30);x.drawImage(drawChar(I.c,{b:fr}),0,0)}
/* ================= TOUR DES MODIFICATIONS (bâtiment) ================= */
Object.assign(BLD,{modif:{n:'Tour des modifications',d:'Relance le destin du héros (talent, classe de départ, personnalité, race) contre des jetons de relance. Même résultat : l’expérience reste ; résultat différent : retour au niveau 1.',c:[150,180],g:900,col:'#c27cff',hv:2,req:()=>(G.max||1)>10,rq:'Étage 10 franchi'}});
const MODT={tal:['Talent inné',1],cls:['Classe de départ',1],pers:['Personnalité',2],race:['Race',3]};
XEFF.modif=L=>[`Relances : ${Object.keys(MODT).filter(k=>MODT[k][1]<=L).map(k=>MODT[k][0].toLowerCase()).join(', ')}`,`Jetons en réserve : ${G&&G.rr||0}`];
const modVal=(c,k)=>k=='tal'?c.tal:k=='cls'?c.cls0||c.role:c[k];
const modName=(k,v)=>k=='tal'?(TALENTS[v]?TALENTS[v].n:'—'):k=='cls'?(ROLES[v]?ROLES[v].n:v):v;
let MODS=null;
XPAN.modif=(i,pl)=>{const h=heroOf(),L=pl.lv,n=G.rr||0;if(!h)return'<p class="m">Aucun héros : la Tour des modifications ne répond qu’au joueur venu d’un autre monde.</p>';
 let s=`<h3 class="sh">Jetons de relance</h3><p class="grr"><b>🎟 ${n}</b> jeton${n>1?'s':''} · <button class="alt" onclick="openCodes()">Entrer un code</button></p><p class="m">On gagne des jetons avec les <b>codes</b> (usage unique par partie), les <b>quêtes</b> des étages de quête et des boss, et parfois en expédition (événements).</p>`;
 if(MODS){const k=MODS.k,lv=h.lv,ok=n>=1;s+=`<div class="gcf"><b>Relancer : ${MODT[k][0]} de ${h.name}</b><p>Actuellement : <b>${modName(k,modVal(h,k))}</b>. Coût : <b>1 jeton</b>.</p><ul><li><b class="g">Même résultat</b> : rien ne change, l’expérience est conservée.</li><li><b class="w">Résultat différent</b> : ${h.name} perd toute son expérience — retour au <b>niveau 1</b> (actuellement niv. ${lv}/${cap(h)}), exp. et réserve d’exp. remises à zéro, arbre, compétences, sous-classe, spécialisation et éveil effacés. <b>Rien n’est transféré</b> d’un résultat à l’autre.</li>${k=='tal'?'<li>Si le nouveau talent n’a pas d’aptitude à la magie, les classes magiques se ferment et une arme magique équipée part dans la réserve.</li>':''}${k=='cls'?'<li>Une arme 1★ de la nouvelle classe est équipée ; l’ancienne arme va dans la réserve.</li>':''}${k=='pers'?'<li>Nouveaux sous-traits et nouvelle courbe de progression.</li>':''}</ul><p class="m">Le métier et l’équipement sont conservés. Taux :</p>${oddsHTML(k,h)}<p class="gbt"><button class="alt" onclick="modCancel()">Annuler</button> <button class="red" ${ok?'':'disabled'} onclick="modGo()">${ok?'Confirmer et lancer (1 jeton)':'Pas de jeton'}</button></p></div>`;return s}
 s+=`<h3 class="sh">Destin de ${h.name}</h3>`+Object.keys(MODT).map(k=>{const v=modVal(h,k),lk=MODT[k][1]>L,col=k=='tal'?RARC[TALENTS[v]?TALENTS[v].r:0]:k=='pers'?GTC[PTIERS[tierOf(PTIERS,v)].c]:k=='race'?GTC[RTIERS[tierOf(RTIERS,v)].c]:'#ffcf4a',tag=k=='tal'&&TALENTS[v]?RARN[TALENTS[v].r]:k=='pers'?PTIERS[tierOf(PTIERS,v)].n:k=='race'?'Race '+RTIERS[tierOf(RTIERS,v)].n:'';
  return`<div class="row"><div class="gr"><b>${MODT[k][0]}</b> : <b style="color:${col}">${modName(k,v)}</b> ${tag?`<span class="tg" style="border-color:${col};color:${col}">${tag}</span>`:''}${k=='race'&&RACET[v]?`<div class="m">${RACET[v].d}</div>`:''}</div>${lk?`<span class="w">Tour niv. ${MODT[k][1]}</span>`:`<button ${n>=1?'':'disabled'} onclick="modAsk('${k}')">Relancer (1 🎟)</button>`}</div>`}).join('')+`<p class="m">Seul le héros peut être relancé. ${h.name} reste un personnage 1★ quoi qu’il arrive.</p>`;return s};
function modAsk(k){if(!MODT[k])return;MODS={k};rp();setTimeout(()=>{const e=$('.gcf');if(e&&e.scrollIntoView)e.scrollIntoView({block:'start'})},30)}
function modCancel(){MODS=null;rp()}
async function modGo(){const h=heroOf(),M=MODS;if(!h||!M||(G.rr||0)<1||!bl('modif')||MODT[M.k][1]>bl('modif'))return;const k=M.k,old=modVal(h,k),v=k=='tal'?talentRollFair():k=='pers'?persRollHero():k=='race'?raceRollHero():(gForce('cls')||pick(RCLS(h)[0].L));
 G.rr--;MODS=null;save();closePanel();const E=gEntries(k,h),lv0=h.lv,same=v==old;
 const ov=document.createElement('div');ov.id='gov';ov.innerHTML=`<div class="gob px"><h2>Tour des modifications</h2><p class="m" style="text-align:center">${MODT[k][0]} de ${h.name} · ancien : <b>${modName(k,old)}</b></p>${reelHTML('gmr',MODT[k][0])}<div id="gmres"></div></div>`;$('#stage').appendChild(ov);
 const e=await reelSpin('gmr',E,v,{dur:3.6});
 if(!same){if(k=='race')h.race=v;else if(k=='pers')h.pers=v;else if(k=='tal')h.tal=v;else{h.cls0=v;const w=h.eq&&h.eq.arme;if(w)G.items.push(w);h.eq.arme=mkItem(ROLE_W[v]||'epee',1,{el:null})}gReinit(h,k=='pers');upRole(h);try{codexOwn(h)}catch(_){}}
 save();hud();try{if(mode=='village')syncNPC()}catch(_){}
 const big=e&&e.top;if(big&&!GRM()){ov.classList.add('gshk');flashT&&flashT(k=='pers'?'SECRÈTE !':'6★ !')}
 $('#gmres').innerHTML=`<p class="gbig" style="color:${e?e.col:'#fff'}">${modName(k,v)}</p>${same?`<p class="g">Même résultat ! Rien ne change : ${h.name} garde son niveau ${lv0} et toute son expérience.</p>`:`<p class="w">Nouveau destin : ${h.name} repart du niveau 1 (il était niv. ${lv0}). Rien n’est transféré.</p>`}${k=='race'&&RACET[v]?`<p class="m">${RACET[v].d}</p>`:k=='tal'&&TALENTS[v]?`<p class="m">${TALENTS[v].d}${TALENTS[v].magie?' <b style="color:#c58bff">✦ Aptitude à la magie</b>':''}</p>`:k=='pers'?`<p class="m">${PERS[v]}</p>`:''}<p class="m">Jetons restants : 🎟 ${G.rr||0}</p><p class="gbt"><button onclick="modClose()">OK</button></p>`}
function modClose(){const o=$('#gov');if(o)o.remove();const i=G.plots.findIndex(p=>p&&p.k=='modif');if(i>=0)openB(i)}
/* sprite procédural : tour violette aux runes (3 paliers) */
{const _bs=bSprite;bSprite=function(k,lv){if(k!='modif')return _bs(k,lv);const key='modif'+lv;if(BS_[key])return BS_[key];const g=SG(54,58),pal=[null,'#9a96ae','#5a3d8a','#c27cff','#ffe08a','#f2ead6','#3a2a5a','#2a1c40','#ffffff','#6f6a86','#ff4df0','#7ad9ff'],H=[0,30,38,44][clamp(lv|0,1,3)],top=56-H;
 for(let y=top;y<56;y++)g.row(y,19,34,(y-top)%7==6?9:1,0);g.r(15,50,24,6,1,0);g.row(49,15,38,9,1);g.r(24,47,6,9,7,0);g.row(46,25,28,7,0);g.p(28,51,4,2);
 for(let y=top+4;y<44;y+=8){g.r(22,y,2,3,11,0);g.r(30,y,2,3,11,0);g.p(22,y,8,2)}
 for(let i=0;i<10;i++)g.row(top-1-i,18+Math.floor(i*.85),35-Math.floor(i*.85),3,i<2?3:0);g.row(top,17,36,2,0);
 if(lv>=2){g.r(26,top-13,2,3,10,0);g.p(26,top-13,8,2)}if(lv>=3){[[13,20],[40,24],[11,34],[42,38],[14,44],[39,12]].forEach(([x,y])=>{g.p(x,y,10,0);g.p(x+1,y,4,0)});g.r(25,top-15,4,1,4,0)}
 if(lv==1){g.r(14,top+2,2,H-2,6,0);g.r(38,top+2,2,H-2,6,0);for(let y=top+4;y<56;y+=8)g.row(y,14,39,6,1)}
 return BS_[key]=bake(g,pal)}}
/* ================= CODES (usage unique par partie) ================= */
/* empreinte cyrb53 (53 bits) du code normalisé et salé : aucun code en clair dans le source (voir docs/codes.md : un vrai système payant exige une validation côté serveur) */
function gHash(str,seed){let h1=0xdeadbeef^(seed||0),h2=0x41c6ce57^(seed||0);for(let i=0;i<str.length;i++){const ch=str.charCodeAt(i);h1=Math.imul(h1^ch,2654435761);h2=Math.imul(h2^ch,1597334677)}h1=Math.imul(h1^(h1>>>16),2246822507);h1^=Math.imul(h2^(h2>>>13),3266489909);h2=Math.imul(h2^(h2>>>16),2246822507);h2^=Math.imul(h1^(h1>>>13),3266489909);return(4294967296*(2097151&h2)+(h1>>>0)).toString(36)}
const codeNorm=s=>String(s||'').toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^A-Z0-9]/g,'');
const codeKey=s=>gHash('DS1:'+codeNorm(s),7);
/* récompenses : rr jetons de relance, gold or, it [type d'objet ('' = arme au hasard), étoiles], m matériaux */
const CODES={
 'xeyo1jk2bm':{n:'Bienvenue, joueur',r:{rr:1,gold:1000}},
 'vuhli5xc0s':{n:'La Tour des Étoiles',r:{rr:3}},
 '2awi5wbfbpy':{n:'Forge ardente',r:{it:['',3],gold:500}},
 'tmpjo6cg0x':{n:'Pack du destin',r:{rr:5,gold:5000}},
 'lt51cuscf5':{n:'Testeur secret',r:{rr:10}}};
const codeRwTxt=r=>[r.rr?`🎟 ${r.rr} jeton${r.rr>1?'s':''} de relance`:'',r.gold?`${fmtN(r.gold)} or`:'',r.it?`une arme ${r.it[1]}★`:''].filter(x=>x).join(', ');
let CODEMSG='';
function codeTry(v){if(!G)return;if(!Array.isArray(G.codes))G.codes=[];const n=codeNorm(v);if(n.length<4){CODEMSG='<p class="w">Code trop court.</p>';return rp()}const h=codeKey(v),C=CODES[h];
 if(!C){CODEMSG='<p class="w">Code inconnu. Vérifiez l’orthographe (majuscules, tirets et espaces ne comptent pas).</p>';return rp()}
 if(G.codes.some(x=>x.h==h)){CODEMSG=`<p class="w">Code déjà utilisé dans cette partie (« ${C.n} »). Chaque code ne sert qu’une fois par partie.</p>`;return rp()}
 const r=C.r;if(r.rr)G.rr=(G.rr||0)+r.rr;if(r.gold)G.res.gold+=r.gold;let it='';if(r.it){const o=r.it[0]?mkItem(r.it[0],r.it[1]):rndItem(r.it[1],'arme');G.items.push(o);it=iName(o)}
 G.codes.push({h,t:Date.now(),n:C.n});save();hud();CODEMSG=`<p class="g">✔ Code « ${C.n} » accepté : ${codeRwTxt(r)}${it?` (${it})`:''}.</p>`;gJingle(0);rp()}
function openCodes(){CODEMSG='';openPanel(()=>{const U=(G.codes||[]);return['Code',`<p class="m">Entrez un code cadeau. Chaque code n’est utilisable <b>qu’une seule fois par partie</b>. Les jetons de relance servent à la <b>Tour des modifications</b> (bâtiment, après l’étage 10).</p>
 <form class="gcode" onsubmit="event.preventDefault();codeTry(this.code.value)"><input name="code" id="gcodein" class="hn" maxlength="32" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="XXXX-XXXX" aria-label="Code"><button type="submit">Valider</button></form>${CODEMSG}
 <p>Jetons de relance : <b>🎟 ${G.rr||0}</b>${bl('modif')?` · <button class="alt" onclick="modOpen()">Tour des modifications</button>`:' · <span class="m">Tour des modifications pas encore bâtie</span>'}</p>
 ${U.length?`<h3 class="sh">Codes utilisés (${U.length})</h3>${U.map(x=>`<div class="m">✔ ${x.n||'Code'} · ${new Date(x.t).toLocaleDateString('fr-FR')}</div>`).join('')}`:''}`]});setTimeout(()=>{const e=$('#gcodein');if(e&&matchMedia('(pointer:fine)').matches)e.focus()},50)}
{const _ob=openB;openB=function(i){MODS=null;return _ob.apply(this,arguments)}}
function modOpen(){const i=G.plots.findIndex(p=>p&&p.k=='modif');if(i>=0){MODS=null;openB(i)}}
/* bouton « Code » dans l'Équipe (à côté de « Revoir l'intro ») */
{const _ot=openTeam;openTeam=function(){const r=_ot.apply(this,arguments);const f=PF;if(f)PF=()=>{const o=f();try{o[1]=o[1].replace('<button class="alt" onclick="replayIntro()">','<button class="alt" onclick="openCodes()">🎟 Code</button><button class="alt" onclick="replayIntro()">')}catch(_){}return o};rp();return r}}
/* ================= JETONS GAGNÉS EN JEU ================= */
function rrGive(n,why){if(!G||!n)return;G.rr=(G.rr||0)+n;save();setTimeout(()=>toast(`🎟 +${n} jeton${n>1?'s':''} de relance${why?' — '+why:''} (Tour des modifications).`,4200),1600)}
/* étages de quête (tous les 5 étages) : 20 % ; boss : 35 % ; événements d'expédition : 4 % */
{const _ff=finalFight;finalFight=async function(e){const k=F&&F.kind,q=F&&F.qk,d0=F&&F.done,r=await _ff.apply(this,arguments);try{if(F&&F.done&&!d0&&(k=='mini'||k=='boss')&&Math.random()<(k=='boss'?.35:.2))rrGive(1,k=='boss'?'trophée du boss':'quête accomplie'+(q?' ('+QUESTS[q].toLowerCase()+')':''))}catch(_){}return r}}
{const _ed=evtDone;evtDone=async function(){const r=await _ed.apply(this,arguments);try{if(G&&mode=='floor'&&Math.random()<.04)rrGive(1,'trouvaille d’expédition')}catch(_){}return r}}
/* ================= MIGRATION ================= */
function gachaBoot(){if(!G)return;if(!(G.rr>=0))G.rr=0;if(!Array.isArray(G.codes))G.codes=[];const h=heroOf();if(h&&!h.cls0)h.cls0=CLS0.some(x=>x[0]==h.role)?h.role:'guerrier';if(!G.v_gacha)G.v_gacha=1}
{const _hb=heroBoot;heroBoot=function(){const r=_hb.apply(this,arguments);try{gachaBoot()}catch(e){console.warn('tirage',e)}return r}}
(function(){const s=document.createElement('style');s.textContent=`
.gaw{max-width:560px}.gtb{margin:2px 0 8px}.gpv{display:flex;justify-content:center}#gprev{width:96px;height:90px;image-rendering:pixelated;animation:bob 1.6s ease-in-out infinite alternate}
.rl{margin:6px 0 8px}.rlh{display:flex;justify-content:space-between;align-items:baseline;gap:8px;font-size:13px;margin-bottom:3px}.rlh b{letter-spacing:1px;text-transform:uppercase;font-size:12px;color:#ffcf4a}
.reel{position:relative;height:78px;overflow:hidden;background:#0d0b1e;border:3px solid #000;box-shadow:0 0 0 2px #ffcf4a,inset 0 0 18px #000;touch-action:manipulation}
.reel .rst{position:absolute;left:0;top:0;height:100%;display:flex;will-change:transform}
.rcl{flex:none;width:84px;height:100%;box-sizing:border-box;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;border-right:2px solid #000;background:linear-gradient(#24204a,#151230);border-top:4px solid var(--rc);color:#fff;font-size:11px;line-height:1.05;text-align:center;padding:2px}
.rcl img{width:32px;height:32px;image-rendering:pixelated;object-fit:contain}.rcl span{font-weight:700;color:var(--rc);max-width:80px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.rcl em{font-style:normal;font-size:9px;opacity:.8}
.rcl.win{background:linear-gradient(#4a3a10,#221a08);box-shadow:inset 0 0 0 2px var(--rc)}
.reel .rptr{position:absolute;left:50%;top:-2px;bottom:-2px;width:0;border-left:2px solid #ff5a5a;box-shadow:0 0 6px #ff5a5a;pointer-events:none}.reel .rptr:before,.reel .rptr:after{content:'';position:absolute;left:-8px;border:7px solid transparent}.reel .rptr:before{top:0;border-top-color:#ff5a5a}.reel .rptr:after{bottom:0;border-bottom-color:#ff5a5a}
.reel.tk .rptr{animation:gtk .08s}@keyframes gtk{50%{transform:translateX(-2px)}}
.reel:before,.reel:after{content:'';position:absolute;top:0;bottom:0;width:22%;z-index:1;pointer-events:none}.reel:before{left:0;background:linear-gradient(90deg,#0d0b1e,transparent)}.reel:after{right:0;background:linear-gradient(-90deg,#0d0b1e,transparent)}
.reel .rfl{position:absolute;inset:0;background:var(--fc,#fff);opacity:0;pointer-events:none;z-index:2}.reel.flash .rfl{animation:gfl .6s}.reel.big .rfl{animation:gfl 1.4s 2}.reel.big{box-shadow:0 0 0 2px #ff4df0,0 0 22px #ff4df0}@keyframes gfl{0%{opacity:.85}100%{opacity:0}}
.gres{display:grid;gap:6px;margin-top:6px}.gres .pcard{margin:0}.gsec{text-align:center;font-weight:700;color:#ff4df0;letter-spacing:2px;animation:gsec 1s ease-in-out infinite alternate;margin:4px 0}@keyframes gsec{to{color:#ffe27a;text-shadow:0 0 10px #ff4df0}}
.gbt{text-align:center;margin:10px 0 0;display:flex;gap:6px;justify-content:center;flex-wrap:wrap;align-items:center}
.gshk{animation:gshk .5s}@keyframes gshk{20%{transform:translate(-5px,3px)}40%{transform:translate(4px,-4px)}60%{transform:translate(-3px,-2px)}80%{transform:translate(3px,3px)}}
.gaods{display:grid;gap:5px}.gaor{border:2px solid var(--rc);background:#16132e;padding:4px 6px}.gaor.sec{box-shadow:0 0 10px var(--rc)}.gaoh{display:flex;justify-content:space-between;color:var(--rc);font-size:13px}.gaol{display:flex;flex-wrap:wrap;gap:3px;margin-top:3px}.gaol .tg small{opacity:.75}
.gcf{border:3px solid #c27cff;background:#1d1438;padding:8px;margin:8px 0}.gcf ul{margin:6px 0;padding-left:18px;font-size:13px}.grr b{font-size:18px;color:#ffcf4a}
#gov{position:absolute;inset:0;z-index:40;background:rgba(6,5,16,.88);display:flex;align-items:center;justify-content:center;padding:12px;overflow:auto}.gob{width:min(480px,100%);padding:12px}.gbig{text-align:center;font:700 clamp(20px,6vw,30px) var(--font);margin:8px 0 2px;text-shadow:2px 2px 0 #000}
.gcode{display:flex;gap:6px;margin:8px 0}.gcode input{flex:1;min-width:0;text-transform:uppercase;letter-spacing:2px}
@media (prefers-reduced-motion:reduce){.reel.flash .rfl,.reel.big .rfl,.gsec,.gshk,.reel.tk .rptr{animation:none}}
@media (max-width:400px){.rcl{width:72px}.rcl span{max-width:68px}.reel{height:72px}}`;document.head.appendChild(s)})();
