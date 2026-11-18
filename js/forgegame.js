'use strict';
/* ================= FORGER AU MARTEAU (mini-jeu de la Forge) =================
   Onglet « Marteau » de la Forge : on choisit un type d'objet et une rareté (1★…6★), on paie les matériaux,
   puis on frappe le métal au bon moment (jauge de chauffe, zone idéale). Plusieurs coups par essai, 3 essais par paiement.
   Réussite : objet de la rareté visée (mkItem, mêmes règles que toute fabrication). Échec des 3 essais : 1 ticket de forge
   de cette rareté (G.ftk = {1..6}) ; 10 tickets d'une rareté = un objet de cette rareté tiré au hasard parmi tous les types.
   État : G.ftk {1..6} · G.fgp {t, st, left} (paiement en cours, repris au rechargement) · migration G.v_fg.
   Le moteur (fgNew / fgStep / fgStrike) est pur (sans DOM) : il sert aussi aux mesures de taux de réussite. */
/* v : balayages/s du curseur ; h : demi-largeur de la zone « Bien » (Parfait = 38 %) ; n : coups ; need : points requis
   (Parfait 2, Bien 1, Raté 0) ; A : dérive de la zone (5★–6★) ; w : rapidité de la dérive */
const FGT={
 1:{v:.5,h:.035,n:3,need:3,A:0,w:0,d:'Facile'},
 2:{v:.58,h:.045,n:4,need:5,A:0,w:0,d:'Moyen'},
 3:{v:.66,h:.05,n:5,need:7,A:0,w:0,d:'Difficile'},
 4:{v:.74,h:.055,n:6,need:9,A:.05,w:2.2,d:'Très difficile'},
 5:{v:.82,h:.05,n:7,need:11,A:.10,w:2.8,d:'Extrême'},
 6:{v:.9,h:.055,n:8,need:13,A:.14,w:3.4,d:'Légendaire'}};
const FGM=[0,1,2,3,4,6,8],FGTRY=3,FGTK=10,FGNAMES=['Raté !','Bien !','PARFAIT !'];
let FGS={t:'epee',st:1,run:null,loop:0,parts:[],pop:null,shake:0,lastS:''};
const fgRM=()=>{try{return matchMedia('(prefers-reduced-motion:reduce)').matches}catch(_){return false}};
/* ---------- moteur ---------- */
function fgNew(st,job){const P=Object.assign({},FGT[st]);if(job)P.h*=1.1;const e={st,P,i:0,pts:0,res:[],ph:Math.random()*2,zt:0,state:'wait',tm:.9,anim:0,hx:.5,ok:false,c:.5,zp:0};fgZone(e);return e}
function fgZone(e){const P=e.P,m=P.h+P.A+.03;e.c=m+Math.random()*(1-2*m);e.zp=Math.random()*6.28;e.zt=0}
const fgV=e=>e.P.v*(1+.06*e.i);
function fgX(e){const m=e.ph%2;return m<1?m:2-m}
const fgZc=e=>e.c+e.P.A*Math.sin(e.zt*e.P.w+e.zp);
function fgStep(e,dt){
 if(e.state=='wait'){e.tm-=dt;if(e.tm<=0)e.state='play'}
 else if(e.state=='play'){e.ph+=dt*fgV(e);e.zt+=dt}
 else if(e.state=='hit'){e.tm-=dt;if(e.tm<=0){if(e.i>=e.P.n||e.pts+2*(e.P.n-e.i)<e.P.need){e.state='done';e.ok=e.pts>=e.P.need}else{fgZone(e);e.state='play'}}}
 if(e.anim>0)e.anim=Math.max(0,e.anim-dt*3.2)}
function fgStrike(e){if(e.state!='play')return -1;const x=fgX(e),d=Math.abs(x-fgZc(e)),g=d<=e.P.h*.38?2:d<=e.P.h?1:0;e.res.push(g);e.pts+=g;e.i++;e.hx=x;e.state='hit';e.tm=.55;e.anim=1;return g}
/* ---------- état, coûts, migration ---------- */
function fgEnsure(){if(!G)return;if(!G.ftk||typeof G.ftk!='object')G.ftk={};for(let n=1;n<=6;n++)if(typeof G.ftk[n]!='number'||!(G.ftk[n]>=0))G.ftk[n]=0;if(G.fgp&&(!RECIPES[G.fgp.t]||!(G.fgp.st>=1&&G.fgp.st<=6)||!(G.fgp.left>0)))G.fgp=null;G.v_fg=1}
function fgBoot(){if(!G)return;if(!G.v_fg){try{if(!localStorage.getItem('tdE6_vf_bak')){const o=localStorage.getItem(SKEY);if(o)localStorage.setItem('tdE6_vf_bak',o)}}catch(_){}}fgEnsure()}
function fgCost(t,st){const R=RECIPES[t],m=FGM[st],o={};for(const k in R.c)o[k]=R.c[k]*m;if(st>=4)o.mat_noyau=st-3;o.gold=R.g*m;return o}
function fgSound(k){try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return;FGS.ac=FGS.ac||new A();const c=FGS.ac;if(c.state=='suspended')c.resume();const z=[[[180,.09,'square',.12],[90,.12,'sawtooth',.1]],[[320,.08,'square',.1],[520,.1,'triangle',.1]],[[660,.07,'square',.12],[990,.09,'square',.1],[1320,.16,'triangle',.12]],[[90,.2,'sawtooth',.1]],[[440,.12,'triangle',.1],[660,.12,'triangle',.1],[880,.3,'triangle',.12]]][k]||[];z.forEach(([f,d,ty,v],i)=>{const o=c.createOscillator(),g=c.createGain(),t0=c.currentTime+i*.07;o.type=ty;o.frequency.setValueAtTime(f,t0);g.gain.setValueAtTime(v,t0);g.gain.exponentialRampToValueAtTime(.001,t0+d);o.connect(g);g.connect(c.destination);o.start(t0);o.stop(t0+d+.02)})}catch(_){}}
/* ---------- icône de ticket (pixel art) ---------- */
const FGI={};
function fgTk(st){if(FGI[st])return FGI[st];const c=document.createElement('canvas');c.width=14;c.height=10;const x=c.getContext('2d'),C=TIERC[st-1],R=(col,a,b,w,h)=>{x.fillStyle=col;x.fillRect(a,b,w,h)};R('#14122a',1,0,12,10);R('#14122a',0,1,14,8);R(C,1,1,12,8);R('#14122a',0,4,1,2);R('#14122a',13,4,1,2);R('rgba(255,255,255,.45)',2,1,10,1);R('#14122a',3,2,1,6);R('#fff7d0',6,3,2,4);R('#fff7d0',5,4,4,2);R('rgba(0,0,0,.3)',2,8,10,1);const o=document.createElement('canvas');o.width=42;o.height=30;const y=o.getContext('2d');y.imageSmoothingEnabled=false;y.drawImage(c,0,0,42,30);return FGI[st]=o.toDataURL()}
const fgTkI=(st,w)=>`<img class="fgti" src="${fgTk(st)}" alt="" style="width:${w||28}px">`;
/* ---------- interface ---------- */
function fgInfoTxt(st){const P=FGT[st];return `${P.n} coups par essai · ${FGTRY} essais · au moins ${P.need} points sur ${2*P.n}${P.A?' · zone mouvante':''}`}
function hammerHTML(L){fgEnsure();const T=ITYPES;let h='';
 h+=`<p class="m">Forgez à la main : frappez le métal quand le curseur est dans la <b>zone dorée</b> (clic, toucher ou <b>Espace</b>). Plus la rareté visée est haute, plus c’est dur. Si les ${FGTRY} essais échouent, vous gagnez un <b>ticket de forge</b> de cette rareté ; <b>${FGTK} tickets</b> s’échangent contre un objet de cette rareté tiré au hasard parmi tous les types.</p>`;
 h+=`<div class="fgtk">${[1,2,3,4,5,6].map(n=>{const k=G.ftk[n],ok=k>=FGTK;return`<div class="fgt${ok?' rdy':''}" style="border-color:${TIERC[n-1]}">${fgTkI(n,30)}<b>${k}/${FGTK}</b><div class="fgb"><i style="width:${Math.min(100,k*100/FGTK)}%;background:${TIERC[n-1]}"></i></div><button class="${ok?'ib hot':'alt'}" ${ok?'':'disabled'} onclick="fgExchange(${n})">Échanger</button></div>`}).join('')}</div>`;
 const last=LASTCR&&findIt(LASTCR);
 if(FGS.run)return h+fgRunHTML();
 if(G.fgp){const p=G.fgp;return h+`<div class="crop"><div><b>Forge en cours</b> : ${T[p.t].n} ${stars(p.st)} — il reste <b>${p.left}</b> essai${p.left>1?'s':''}.</div><div><button class="ib hot" onclick="fgBegin()">Reprendre</button></div></div>`}
 if(!RECIPES[FGS.t]||(RECIPES[FGS.t].lv||1)>L)FGS.t='epee';
 const o=fgCost(FGS.t,FGS.st),ok=canX(o),P=FGT[FGS.st];
 h+=`<div class="crop"><b>Objet</b>`+SLK.map(s=>`<div class="fgty"><span class="m">${SLOTS[s]}</span>${Object.keys(RECIPES).filter(t=>T[t].s==s).map(t=>{const lk=(RECIPES[t].lv||1)>L;return`<button class="${FGS.t==t?'on':'alt'}" ${lk?'disabled':''} title="${T[t].n}${lk?' (Forge niv. '+RECIPES[t].lv+')':''}" onclick="FGS.t='${t}';rp()"><img src="${itemSrc({t,st:1})}" alt="">${T[t].n}</button>`}).join('')}</div>`).join('')+`</div>`;
 h+=`<div class="crop"><b>Rareté visée</b><div class="fgst">${[1,2,3,4,5,6].map(n=>`<button class="${FGS.st==n?'on':'alt'}" style="${FGS.st==n?'':'color:'+TIERC[n-1]}" onclick="FGS.st=${n};rp()">${n}★</button>`).join('')}</div><div class="m">Difficulté : <b style="color:${TIERC[FGS.st-1]}">${P.d}</b> — ${fgInfoTxt(FGS.st)}</div><div>${costX(o)}</div><button class="ib${ok?' hot':''}" ${ok?'':'disabled'} onclick="fgStart()">Forger ${T[FGS.t].n} ${FGS.st}★</button></div>`;
 if(last)h+=`<div class="row lastc r${last.it.st}"><img class="sp ic r${last.it.st}" src="${itemSrc(last.it)}" alt=""><div class="gr"><span class="m">Dernier objet obtenu</span><br><b>${iName(last.it)}</b> ${stars(last.it.st)}<div class="m">${iTxt(last.it)}</div></div></div>`;
 return h}
function fgRunHTML(){const r=FGS.run,P=FGT[r.st],T=ITYPES[r.t];let h=`<div class="fgrun"><div class="fgh"><b>${T.n}</b> ${stars(r.st)} <span class="m">· ${P.d}</span></div><div class="fgs" id="fgs" aria-live="polite"></div>`;
 h+=`<canvas id="fgc" class="fgc" width="320" height="176" aria-label="Enclume : frappez quand le curseur est dans la zone dorée" onpointerdown="fgHit(event)"></canvas>`;
 if(r.phase=='ready')h+=`<p class="m">Essai ${FGTRY-r.left+1} / ${FGTRY}. ${fgInfoTxt(r.st)}.</p><button class="ib hot" onclick="fgAttempt()">Chauffer le métal</button>`;
 else if(r.phase=='play')h+=`<button class="ib hot fgbtn" onpointerdown="fgHit(event)">Frapper ! <small>(Espace)</small></button>`;
 else if(r.phase=='between')h+=`<p class="w">Le métal s’est fendu… il reste <b>${r.left}</b> essai${r.left>1?'s':''}.</p><button class="ib hot" onclick="fgAttempt()">Nouvel essai</button>`;
 else if(r.phase=='result'){const o=r.out;h+=o.ok?`<p class="g">Réussite ! <b>${iName(o.it)}</b> ${stars(o.it.st)} rejoint votre réserve.</p><div class="m">${iTxt(o.it)}</div>`:`<p class="w">Échec : les ${FGTRY} essais sont perdus. Vous gagnez 1 ticket de forge ${stars(r.st)} ${fgTkI(r.st,24)} (${G.ftk[r.st]} / ${FGTK}).</p>`;h+=`<button class="ib" onclick="FGS.run=null;rp()">Fermer</button>`}
 return h+`</div>`}
function fgStart(){fgEnsure();const t=FGS.t,st=FGS.st,R=RECIPES[t];if(!bl('forge')||!R||(R.lv||1)>bl('forge')||G.fgp)return;const o=fgCost(t,st);if(!canX(o))return;payX(o);G.fgp={t,st,left:FGTRY};save();fgBegin()}
function fgBegin(){if(!G.fgp)return;FGS.run={t:G.fgp.t,st:G.fgp.st,left:G.fgp.left,phase:'ready',e:null,out:null};FGS.parts=[];FGS.pop=null;rp();fgView()}
function fgView(){setTimeout(()=>{const c=document.getElementById('fgc');if(c&&c.scrollIntoView)c.scrollIntoView({block:'center'})},40)}
function fgAttempt(){const r=FGS.run;if(!r||(r.phase!='ready'&&r.phase!='between'))return;let job=0;try{job=JE('forgeron')}catch(_){}r.e=fgNew(r.st,job);r.phase='play';FGS.lastS='';rp();fgView();fgSound(0);if(!FGS.loop){FGS.loop=1;FGS.t0=0;requestAnimationFrame(fgFrame)}}
function fgHit(ev){if(ev){ev.preventDefault&&ev.preventDefault()}const r=FGS.run;if(!r||r.phase!='play'||!r.e)return;const e=r.e,g=fgStrike(e);if(g<0)return;fgSound(g==2?2:g==1?1:3);FGS.pop={g,t:0};const px=160,py=121,n=g==2?26:g==1?13:5,rm=fgRM();for(let i=0;i<(rm?Math.ceil(n/3):n);i++){const a=-Math.PI*(.1+.8*Math.random()),s=40+Math.random()*(g==2?110:75);FGS.parts.push({x:px+(Math.random()*16-8),y:py,vx:Math.cos(a)*s,vy:Math.sin(a)*s,l:.35+Math.random()*.4,c:g?['#fff7d0','#ffd23a','#ff9a2a','#ff6a1a'][i%4]:'#7a7a88'})}if(!rm)FGS.shake=g==2?5:g==1?3:1}
function fgFin(){const r=FGS.run,e=r.e;if(e.ok){const it=mkItem(r.t,r.st);G.items.push(it);LASTCR=it.id;G.fgp=null;r.out={ok:1,it};r.phase='result';save();fgSound(4);if(r.st>=4)evoReveal({img:itemSrc(it),col:TIERC[r.st-1],title:'FORGÉ AU MARTEAU !',name:iName(it),from:0,to:r.st,lines:[iTxt(it)],small:1})}
 else{r.left--;if(r.left>0){G.fgp.left=r.left;r.phase='between';save()}else{G.fgp=null;fgEnsure();G.ftk[r.st]++;r.out={ok:0};r.phase='result';save();fgSound(3)}}
 rp()}
function fgExchange(n){fgEnsure();if(G.ftk[n]<FGTK)return;G.ftk[n]-=FGTK;const t=pick(Object.keys(RECIPES)),it=mkItem(t,n);G.items.push(it);LASTCR=it.id;save();rp();
 if(n>=4)evoReveal({img:itemSrc(it),col:TIERC[n-1],title:'TICKETS ÉCHANGÉS !',name:iName(it),from:0,to:n,lines:[iTxt(it)],small:1});else toast(`${fgTkI(n,20)} ${FGTK} tickets → <b>${iName(it)}</b> ${'★'.repeat(n)}`)}
/* ---------- boucle et dessin ---------- */
function fgFrame(ts){const r=FGS.run;if(!r){FGS.loop=0;return}requestAnimationFrame(fgFrame);const dt=Math.min(.05,(ts-(FGS.t0||ts))/1000);FGS.t0=ts;const cv=document.getElementById('fgc');if(!cv||!r.e)return;
 if(r.phase=='play'){fgStep(r.e,dt);if(r.e.state=='done')fgFin()}
 for(let i=FGS.parts.length-1;i>=0;i--){const p=FGS.parts[i];p.l-=dt;if(p.l<=0){FGS.parts.splice(i,1);continue}p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=260*dt}
 if(FGS.pop){FGS.pop.t+=dt;if(FGS.pop.t>.9)FGS.pop=null}if(FGS.shake>0)FGS.shake=Math.max(0,FGS.shake-dt*22);
 fgDraw(cv,FGS.run);const s=document.getElementById('fgs');if(s){const e=r.e,tx=r.phase=='play'&&e.state=='wait'?'Prêt…':`Essai ${Math.min(FGTRY,FGTRY-r.left+(r.phase=='play'?1:0))}/${FGTRY} · coup ${Math.min(e.i+1,e.P.n)}/${e.P.n} · points ${e.pts}/${e.P.need}`;if(tx!=FGS.lastS){FGS.lastS=tx;s.textContent=tx}}}
function fgDraw(cv,r){const X=cv.getContext('2d'),e=r.e,P=e.P,W=320,H=176,T=performance.now()/1000,C=TIERC[r.st-1],R=(c,x,y,w,h)=>{X.fillStyle=c;X.fillRect(Math.round(x),Math.round(y),w,h)};X.imageSmoothingEnabled=false;
 X.save();const sh=FGS.shake;if(sh>0)X.translate(Math.round((Math.random()-.5)*sh),Math.round((Math.random()-.5)*sh));
 R('#1b1526',-6,-6,W+12,H+12);for(let y=0;y<H;y+=8)for(let x=(y/8%2)*12;x<W;x+=24)R('#231b32',x,y,22,6);
 /* four */R('#0e0a14',14,70,52,52);R('#2c2438',10,66,60,6);const fl=.6+.4*Math.sin(T*9)*Math.sin(T*5.3);R('#7a2410',20,84,40,32);R('#e8591a',24,90,32,26);R(fl>.6?'#ffcf4a':'#ff8a2a',30,98,20,18);R('#fff2b0',36,106,8,10);
 R('#2c2438',0,150,W,26);R('#3a3048',0,150,W,3);
 /* jauge */const gx=16,gw=288,gy=22,gh=18;R('#000',gx-3,gy-3,gw+6,gh+6);for(let i=0;i<48;i++){const k=i/47;R(`rgb(${Math.round(90+150*k)},${Math.round(30+110*k*k)},${Math.round(30*(1-k))})`,gx+i*6,gy,6,gh)}
 const zc=fgZc(e),zx=gx+(zc-P.h)*gw,zw=2*P.h*gw,px=2*P.h*.38*gw,live=e.state=='play'||e.state=='hit'||e.state=='wait';
 R('rgba(0,0,0,.35)',gx,gy,gw,gh);R('#ffd23a',zx,gy,zw,gh);R('#fff7d0',zc*gw+gx-px/2,gy,px,gh);R('#8a5a10',zx,gy,zw,2);R('#8a5a10',zx,gy+gh-2,zw,2);R('#14122a',zx-2,gy-6,2,gh+12);R('#14122a',zx+zw,gy-6,2,gh+12);
 const cx=gx+(e.state=='wait'?.5:(e.state=='hit'||e.state=='done'?e.hx:fgX(e)))*gw;R('#000',cx-3,gy-9,6,gh+18);R('#fff',cx-1,gy-8,2,gh+16);R('#fff',cx-4,gy-10,8,3);R('#fff',cx-4,gy+gh+7,8,3);
 /* coups */const n=P.n,pw=Math.min(18,Math.floor((W-40)/n)-4),tot=n*(pw+4)-4;for(let i=0;i<n;i++){const g=e.res[i];R('#000',(W-tot)/2+i*(pw+4)-1,50,pw+2,12);R(g==null?'#3a3450':g==2?'#ffd23a':g==1?'#ff9a2a':'#c0453a',(W-tot)/2+i*(pw+4),51,pw,10)}
 /* enclume */const heat=Math.min(1,e.pts/Math.max(1,P.need));R('#14122a',118,134,84,16);R('#4a4a5e',122,126,76,10);R('#6a6a82',122,126,76,3);R('#4a4a5e',134,136,52,12);R('#3a3a4c',126,148,68,4);R('#6a6a82',100,126,22,5);R('#4a4a5e',104,131,18,3);
 const mc=`rgb(${Math.round(110+145*heat)},${Math.round(110-10*heat+40*heat*heat)},${Math.round(130-110*heat)})`;R(mc,134,118,52,8);R('rgba(255,255,255,.25)',134,118,52,2);if(heat>.5){X.globalAlpha=.25+.2*Math.sin(T*8);R('#ff9a2a',130,114,60,14);X.globalAlpha=1}
 /* marteau : abaissé au moment du coup, relevé ensuite */const an=e.anim>0?e.anim:0,bob=e.state=='play'?.04*Math.sin(T*4):0;X.save();X.translate(236,148);X.rotate(-.35+bob-.85*an);R('#000',-5,-68,10,70);R('#6a3f1c',-3,-66,6,66);R('#8a5a30',-3,-66,2,66);R('#000',-16,-82,32,20);R('#8a8aa2',-14,-80,28,16);R('#c8c8da',-14,-80,28,3);X.restore();
 /* particules */FGS.parts.forEach(p=>R(p.c,p.x,p.y,p.l>.2?3:2,p.l>.2?3:2));
 if(FGS.pop){const o=FGS.pop,k=o.t/.9;X.globalAlpha=Math.max(0,1-k*k);X.font='bold 18px monospace';X.textAlign='center';const tx=FGNAMES[o.g],ty=92-k*14;X.fillStyle='#000';X.fillText(tx,162,ty+2);X.fillStyle=o.g==2?'#ffe27a':o.g==1?'#ffa83a':'#d86a5a';X.fillText(tx,160,ty);X.globalAlpha=1}
 if(r.phase=='ready'||e.state=='wait'){X.fillStyle='rgba(10,8,20,.55)';X.fillRect(0,0,W,H);X.font='bold 14px monospace';X.textAlign='center';X.fillStyle=C;X.fillText(e.state=='wait'&&r.phase=='play'?'PRÊT…':'FORGE',160,92)}
 X.restore()}
/* ---------- entrées et styles ---------- */
if(typeof document!='undefined'){
 document.addEventListener('keydown',ev=>{if((ev.code=='Space'||ev.key==' '||ev.key=='Enter')&&FGS.run&&FGS.run.phase=='play'&&document.getElementById('fgc')){const t=ev.target;if(t&&/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))return;ev.preventDefault();if(!ev.repeat)fgHit()}});
 const s=document.createElement('style');s.textContent=`.fgtk{display:grid;grid-template-columns:repeat(6,1fr);gap:4px;margin:8px 0}.fgt{background:var(--panel2);border:2px solid #000;border-bottom-width:3px;padding:4px 2px;display:flex;flex-direction:column;align-items:center;gap:2px;font-size:12px}.fgt.rdy{box-shadow:0 0 8px #ffd23a}.fgt button{font-size:11px;padding:2px 3px}.fgti{image-rendering:pixelated}.fgb{width:90%;height:5px;background:#000}.fgb i{display:block;height:100%}.fgty{display:flex;flex-wrap:wrap;gap:4px;align-items:center}.fgty>.m{width:100%}.fgty button img{width:20px;height:20px;image-rendering:pixelated}.fgst{display:flex;gap:4px;flex-wrap:wrap}.fgst button{min-width:44px}.fgrun{display:flex;flex-direction:column;gap:8px;align-items:stretch}.fgc{width:100%;max-width:480px;aspect-ratio:320/176;image-rendering:pixelated;border:3px solid #000;touch-action:none;align-self:center;cursor:pointer}.fgs{font-size:13px;color:var(--teal,#7fe0d0);min-height:18px}.fgbtn{padding:14px;font-size:16px;touch-action:none}@media (max-width:420px){.fgtk{grid-template-columns:repeat(3,1fr)}}`;document.head.appendChild(s)}
