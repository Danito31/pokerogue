'use strict';
/* ================= HÉROS : APPARENCE (créateur + Miroir + cosmétiques), CLASSE DE DÉPART, APTITUDE À LA MAGIE, MORT DÉFINITIVE =================
   Apparence : c.look = {skin, hair, eye, style 0-11, face 0-8, body 0-3, acc 0-7, cape 0-3, tn 0-6, hue}. drawChar (art.js) lit ces champs ;
   un personnage sans eux garde exactement son rendu.
   Création (intro) : gratuite, avec le jeu de base (options à prix 0). Ensuite, au Miroir : passer d'une option possédée à une autre est gratuit,
   acheter un nouveau cosmétique coûte de l'or (G.cosm = liste 'cat:valeur' possédés).
   Classe de départ : choisie après la roue = arme 1★ de départ ; classes magiques seulement si le talent a magie:1 (TALENTS, data.js).
   Mort du héros (décision du créateur) : il suit les mêmes jets de mort que tout le monde. S'il meurt, la partie est terminée :
   la sauvegarde est archivée dans 'tdE6_fin', remplacée par un marqueur ('tdE6_over'), et seul « Nouvelle partie » reste possible.
   Chargé après raids.js, avant main.js. */
/* catalogue : [nom, prix] (prix 0 = jeu de base offert à la création) ; couleurs : [hex, nom, prix] */
const LOPT={
 style:[['Mèche',0],['Hérissés',0],['Longs',0],['Tresse',0],['Raie au milieu',0],['Couettes',0],['Court',0],['Queue de cheval',1500],['Crête',4000],['Macarons',3000],['Volumineux',6000],['Rasé',1000]],
 hair:HAIRS.map((v,i)=>[v,'Teinte '+(i+1),0]).concat([['#101018','Noir de jais',1000],['#9aa0b0','Argent',3000],['#ff3a5a','Rouge vif',3000],['#40e0ff','Cyan néon',8000],['#ffd75a','Or pur',20000]]),
 face:[['Classique',0],['Lunettes',0],['Taches de rousseur',0],['Cicatrice',2000],['Barbe',0],['Regard perçant',3000],['Maquillage',3000],['Peinture de guerre',8000],['Cache-œil',6000]],
 body:[['Standard',0],['Mince',0],['Costaud',0],['Petit',0]],
 skin:SKINS.map((v,i)=>[v,'Teinte '+(i+1),0]),
 eye:EYES.map((v,i)=>[v,'Teinte '+(i+1),0]).concat([['#ffe066','Yeux d’or',3000],['#ff3ad0','Magenta',3000],['#f4f4ff','Blanc spectral',8000]]),
 acc:[['Aucun',0],['Bandeau',1000],['Boucle d’oreille',2000],['Couronne de fleurs',4000],['Bonnet',3000],['Cornes',12000],['Auréole',30000],['Oreilles de chat',8000]],
 cape:[['Aucune',0],['Cape écarlate',6000],['Cape nocturne',10000],['Écharpe dorée',4000]],
 tn:[['D’origine',0],['Rouge',1500],['Émeraude',1500],['Nuit',3000],['Or',20000],['Rose',3000],['Blanc',8000]]};
const LCOL={hair:1,skin:1,eye:1},LTABS=[['style','Cheveux'],['hair','Couleur'],['face','Visage'],['body','Corps'],['skin','Peau'],['eye','Yeux'],['acc','Accessoire'],['cape','Cape'],['tn','Tenue']];
const LDEF={face:0,body:0,acc:0,cape:0,tn:0};
/* options d'une catégorie : [{v, n, p}] */
const lOpts=k=>LOPT[k].map((o,i)=>LCOL[k]?{v:o[0],n:o[1],p:o[2]}:{v:i,n:o[0],p:o[1]});
const lPrice=(k,v)=>{const o=lOpts(k).find(o=>o.v==v);return o?o.p:0};
const cosOwn=(k,v)=>lPrice(k,v)==0||!!(G&&G.cosm&&G.cosm.includes(k+':'+v));
const cosRar=p=>p<=2000?1:p<=6000?2:p<=12000?3:4,cosRarN=p=>['','Commun','Rare','Épique','Légendaire'][cosRar(p)];
/* ---------- éditeur d'apparence partagé (LED = {c, tab, cb, shop}) : shop=0 → création (jeu de base seul), shop=1 → Miroir ---------- */
let LED=null;
function ledBind(c,cb,shop){const L=c.look||(c.look=Object.assign({},look(c)));for(const k in LDEF)if(L[k]==null)L[k]=LDEF[k];LED={c,tab:LED&&(shop||!['acc','cape','tn'].includes(LED.tab))?LED.tab:'style',cb,shop:!!shop}}
const ledTabs=()=>LTABS.filter(([k])=>LED.shop||lOpts(k).some(o=>o.p==0)&&lOpts(k).filter(o=>o.p==0).length>1);
const ledList=k=>lOpts(k).filter(o=>LED.shop||o.p==0);
function ledImg(L,head){const c=Object.assign({},LED.c,{look:L}),i0=drawChar(c,{b:0});if(!head)return scaleC(i0,2).toDataURL();return scaleC(headC(i0,c),3).toDataURL()}
function ledCur(){const k=LED.tab,A=ledList(k),L=LED.c.look,i=A.findIndex(o=>o.v==L[k]),o=A[i]||A[0];return`${LTABS.find(t=>t[0]==k)[1]} : <b>${o.n}</b> (${i+1}/${A.length})${LED.shop&&!cosOwn(k,o.v)?` · <b class="g">🔒 ${fmtN(o.p)} or</b>`:''}`}
function ledTag(k,o){if(!LED.shop||o.p==0)return'';return cosOwn(k,o.v)?'<i class="lown">✔</i>':`<i class="lprc" style="--rc:${RARC[cosRar(o.p)]}">🔒 ${fmtN(o.p)}</i>`}
function ledHTML(){const L=LED.c.look,t=LED.tab,A=ledList(t);let b;
 if(!LCOL[t])b=`<div class="lgr">${A.map(o=>`<button class="lop${(L[t]|0)==o.v?' on':''}${LED.shop&&!cosOwn(t,o.v)?' lk':''}" onclick="ledSet('${t}',${o.v})" title="${o.n}${o.p?' — '+cosRarN(o.p)+', '+fmtN(o.p)+' or':''}"><img src="${ledImg(Object.assign({},L,{[t]:o.v}),t!='body'&&t!='cape'&&t!='tn')}" alt=""><span>${o.n}</span>${ledTag(t,o)}</button>`).join('')}</div>`;
 else b=`<div class="sw lsw">${A.map(o=>`<button class="${L[t]==o.v?'on':''}${LED.shop&&!cosOwn(t,o.v)?' lk':''}" style="background:${o.v}" onclick="ledSet('${t}','${o.v}')" title="${o.n}${o.p?' — '+fmtN(o.p)+' or':''}" aria-label="${o.n}">${LED.shop&&!cosOwn(t,o.v)?'🔒':''}</button>`).join('')}</div>`;
 return`<div class="ltb">${ledTabs().map(([k,n])=>`<button class="${t==k?'on':'alt'}" onclick="ledTab('${k}')">${n}</button>`).join('')}</div>${b}<div class="lnav"><button class="alt" onclick="ledStep(-1)" aria-label="Précédent">◀</button><span class="m">${ledCur()}</span><button class="alt" onclick="ledStep(1)" aria-label="Suivant">▶</button><button class="alt" onclick="ledRnd()">🎲 Aléatoire</button></div>${LED.shop?'':'<p class="m" style="text-align:center;margin:2px 0 0">Création gratuite. D’autres coiffures, couleurs, accessoires, capes et tenues s’achèteront plus tard au <b>Miroir</b> (fiche du héros).</p>'}`}
function ledDraw(){const e=$('#led');if(e&&LED)e.innerHTML=ledHTML();if(LED&&LED.cb)LED.cb()}
function ledTab(k){LED.tab=k;ledDraw()}
function ledSet(k,v){LED.c.look[k]=v;ledDraw()}
function ledStep(d){const k=LED.tab,A=ledList(k),L=LED.c.look,i=A.findIndex(o=>o.v==L[k]);L[k]=A[md(i+d,A.length)].v;ledDraw()}
/* aléatoire : parmi ce qui est offert (création) ou possédé (Miroir) — jamais d'achat surprise */
function ledRnd(){const L=LED.c.look,P=k=>{const A=lOpts(k).filter(o=>LED.shop?cosOwn(k,o.v):o.p==0);return pick(A).v};LTABS.forEach(([k])=>{L[k]=P(k)});if(Math.random()<.5)L.face=0;ledDraw()}
/* aperçu animé (respiration idle, cadre 32×30) */
function ledPrev(id,t){const cv=$('#'+id);if(!cv||!LED)return;const x=cv.getContext('2d');x.clearRect(0,0,32,30);x.drawImage(drawChar(LED.c,{b:Math.floor(t*2)%2}),0,0)}
/* ---------- Miroir (fiche du héros) : options possédées gratuites, nouveaux cosmétiques payants ---------- */
const fmtN=n=>Math.round(n).toLocaleString('fr-FR').replace(/ | /g,' ');
let MIR=null,MIRIV=0;
const mirBuy=()=>{const L=MIR.c.look,B=[];LTABS.forEach(([k])=>{if(!cosOwn(k,L[k]))B.push({k,v:L[k],p:lPrice(k,L[k]),n:lOpts(k).find(o=>o.v==L[k]).n})});return B};
const mirPrice=()=>{const h=heroOf();if(!h||!G)return 1000;const c=lOpts('acc').concat(lOpts('cape')).filter(o=>o.p).map(o=>o.p);return Math.min(...c)};
function openMirror(){const h=heroOf();if(!h)return;cosEnsure();MIR={c:Object.assign({},h,{look:Object.assign({},LDEF,h.look||look(h))})};ledBind(MIR.c,null,1);
 openPanel(()=>{const B=mirBuy(),p=B.reduce((a,b)=>a+b.p,0),same=JSON.stringify(MIR.c.look)==JSON.stringify(Object.assign({},LDEF,h.look||look(h))),nOwn=(G.cosm||[]).length;
  return['Miroir',`<p><button class="alt" onclick="mirBack()">← Fiche de ${h.name}</button></p><p class="m">Un vieux miroir de la Tour, cerclé de runes. Changer entre des options déjà possédées est <b>gratuit</b> ; un cosmétique marqué 🔒 s’achète une fois pour toutes (${nOwn} acheté${nOwn>1?'s':''}).</p>
 <div class="mir"><div class="hpv"><canvas id="mprev" width="32" height="30"></canvas></div><div class="gr"><b>${h.name}</b>${B.length?`<div class="m">À acheter : ${B.map(b=>`<b style="color:${RARC[cosRar(b.p)]}">${b.n}</b> (${fmtN(b.p)})`).join(', ')}</div><div class="m">Total : <b class="g">${fmtN(p)} or</b> (vous avez ${fmtN(Math.floor(G.res.gold))})</div>`:`<div class="m">${same?'Votre apparence actuelle.':'Uniquement des options possédées : gratuit.'}</div>`}<p style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px"><button ${same||G.res.gold<p?'disabled':''} onclick="mirOK()">${same?'Aucun changement':B.length?`Acheter et appliquer (${fmtN(p)} or)`:'Appliquer (gratuit)'}</button><button class="alt" onclick="openMirror()">Annuler les changements</button></p>${B.length&&G.res.gold<p?'<div class="m w">Pas assez d’or.</div>':''}</div></div><div id="led">${ledHTML()}</div>`]});
 LED.cb=()=>{try{rp()}catch(_){}};clearInterval(MIRIV);const t0=performance.now();MIRIV=setInterval(()=>{if(!$('#mprev')){clearInterval(MIRIV);return}ledPrev('mprev',(performance.now()-t0)/1000)},120)}
function mirBack(){const h=heroOf();if(h)openSheet(h.id);else closePanel()}
function mirOK(){const h=heroOf();if(!h||!MIR)return;const B=mirBuy(),p=B.reduce((a,b)=>a+b.p,0);if(G.res.gold<p)return;G.res.gold-=p;cosEnsure();B.forEach(b=>G.cosm.push(b.k+':'+b.v));h.look=Object.assign({},MIR.c.look);for(const k in CS)if(k.startsWith(h.id+':'))delete CS[k];save();hud();try{if(mode=='village')syncNPC()}catch(_){}toast(B.length?`Nouveau look pour ${h.name} : ${B.map(b=>b.n).join(', ')} (−${fmtN(p)} or).`:`${h.name} change d’apparence.`,3200);mirBack()}
/* cosmétiques possédés ; migration : l'apparence actuelle du héros est acquise */
function cosEnsure(){if(!G)return;if(!Array.isArray(G.cosm))G.cosm=[];const h=heroOf();if(h&&!G.v_cosm){const L=h.look||{};LTABS.forEach(([k])=>{if(L[k]!=null&&!cosOwn(k,L[k]))G.cosm.push(k+':'+L[k])});G.v_cosm=1}}
/* ---------- aptitude à la magie : le héros sans talent magique ne manie ni bâton, ni grimoire, ni sceptre ---------- */
const MAGW=['baton','grimoire','sceptre'],MAGR=['sorcier','soigneur'];
const heroMag=c=>!!(c&&TALENTS[c.tal]&&TALENTS[c.tal].magie);
const heroNoMag=c=>!!(c&&c.hero&&!heroMag(c));
const MAGWHY='Nécessite une aptitude à la magie (talent)';
/* garde centrale : canWield (affichage, équipement, passerelles d'éveil) + heroArmFix appelé par upRole — tout chemin qui pose une arme
   puis recalcule la classe (équiper, Forge, Autel, éveil, migrations, chargement) range d'office une arme magique interdite dans la réserve */
const canWield=(c,it)=>!(it&&MAGW.includes(it.t)&&heroNoMag(c));
function heroArmFix(c,quiet){const w=c&&c.eq&&c.eq.arme;if(!w||canWield(c,w))return null;c.eq.arme=null;if(G&&Array.isArray(G.items))G.items.push(w);if(!quiet)try{toast(`${c.name} n’a pas d’aptitude à la magie : ${iName(w)} rangé dans la réserve.`,4000)}catch(_){}return w}
{const _ur=upRole;upRole=function(c){if(c&&c.hero&&G)heroArmFix(c);return _ur(c)}}
{const _ro=roleOf;roleOf=function(c){const r=_ro(c);if(heroNoMag(c)&&MAGR.includes(r)){const w=c.eq&&c.eq.arme;return w&&!MAGW.includes(w.t)?ITYPES[w.t].role:'guerrier'}return r}}
{const _eq=equip;equip=function(cid,iid){const c=G.chars.find(x=>x.id==cid),it=G.items.find(x=>x.id==iid);if(c&&it&&!canWield(c,it)){toast(`${c.name} ne sait pas manier : ${iName(it)}. ${MAGWHY}.`,3200);return}return _eq(cid,iid)}}
{const _ir=itemRow;itemRow=function(it,btn,c){if(c&&!canWield(c,it)&&/onclick="equip\(/.test(btn||'')){btn=`<button disabled title="${MAGWHY}">🔒 ${MAGWHY}</button>`;c=null}return _ir(it,btn,c)}}
/* ---------- classe de départ (après la roue) : une arme 1★ qui fixe la classe, sans avantage de puissance ---------- */
const CLS0=[['guerrier','epee'],['gardien','bouclier'],['assassin','dagues'],['archer','arc'],['soutien','luth'],['sorcier','baton'],['soigneur','sceptre']];
function clsStart(){const I=INTRO;if(!I||I.done)return;const e=$('#evo');e.hidden=true;e.innerHTML='';e.classList.remove('top');I.c.tal=I.wh.tal;I.ph='cls';I.t=0;if(!I.cls)I.cls=(I.c.eq.arme&&ITYPES[I.c.eq.arme.t].role)||'guerrier';if(MAGR.includes(I.cls)&&!heroMag(I.c))I.cls='guerrier';clsUI()}
function clsUI(){const I=INTRO,c=I.c,mag=heroMag(c),T=TALENTS[c.tal];
 $('#iui').innerHTML=`<div class="hc px"><h2>Ta classe de départ</h2><p class="m" style="text-align:center;margin:0 0 8px">Une simple arme de niveau 1 pour te reconnaître : <b>aucun avantage de puissance</b>. Ta classe changera avec ton équipement.<br>Talent : <b style="color:${RARC[T.r]}">${T.n}</b> — ${mag?'<b style="color:#c58bff">✦ aptitude à la magie</b>':'pas d’aptitude à la magie'}.</p>
 <div class="hct"><div class="hpv"><canvas id="cprev" width="32" height="30"></canvas></div><div class="hcf"><b class="g">${ROLES[I.cls].n}</b> <span class="m">· ${ITYPES[(CLS0.find(x=>x[0]==I.cls)||CLS0[0])[1]].n} 1★</span><div class="m">${ROLES[I.cls].sk[0]} : ${ROLES[I.cls].sk[1]}</div><div class="m">Ultime — ${ROLES[I.cls].ul[0]} : ${ROLES[I.cls].ul[1]}</div></div></div>
 <div class="lgr" style="margin-top:8px">${CLS0.map(([r,w])=>{const lk=MAGR.includes(r)&&!mag;return`<button class="lop${I.cls==r?' on':''}${lk?' lk':''}" ${lk?`disabled title="${MAGWHY}"`:`onclick="clsPick('${r}')"`}><img src="${scaleC(drawChar(Object.assign({},c,{role:r}),{b:0}),2).toDataURL()}" alt=""><span>${ROLES[r].n}</span>${lk?'<i class="lprc" style="--rc:#c58bff">🔒 Magie</i>':''}</button>`}).join('')}</div>
 ${mag?'':`<p class="m" style="text-align:center">🔒 Ensorceleur et soigneur : ${MAGWHY.toLowerCase()}. Seul un talent de la roue l’accorde.</p>`}<p style="text-align:center;margin:12px 0 0"><button onclick="clsDone()">Valider → Entrer dans la Tour</button></p></div>`}
function clsPick(r){const I=INTRO;if(MAGR.includes(r)&&!heroMag(I.c))return;I.cls=r;I.cpk=null;clsUI()}
function clsPrev(I){const cv=$('#cprev');if(!cv)return;const fr=Math.floor(I.t*2)%2,k=I.cls+fr;if(I.cpk==k)return;I.cpk=k;const x=cv.getContext('2d');x.clearRect(0,0,32,30);x.drawImage(drawChar(Object.assign({},I.c,{role:I.cls}),{b:fr}),0,0)}
function clsDone(){const I=INTRO,c=I.c,w=(CLS0.find(x=>x[0]==I.cls)||CLS0[0])[1];c.cls0=I.cls;c.eq.arme=mkItem(w,1,{el:null});upRole(c);heroFinish()}
/* ---------- mort définitive du héros : avertissements ---------- */
const heroIn=L=>(L||party()).some(c=>c.hero);
function heroRisk(pct,inParty){const h=heroOf();if(!h||(inParty!==undefined&&!inParty))return'';return`<div class="hrk">☠ <b>Si ${h.name} (le héros) meurt, la partie est terminée.</b>${pct!=null?` Risque de mort : <b>${String(pct).replace('.',',')} %</b>.`:''}</div>`}
/* ---------- fin de partie ---------- */
let FIN=null;
function finSum(c,why){const d=G.t0?Math.max(1,Math.ceil((Date.now()-G.t0)/864e5)):1,dead=(G.dead||[]).filter(n=>n!=c.name);
 return{name:c.name,look:c.look||look(c),role:c.role,elem:c.elem,st:c.st,race:c.race,lv:c.lv,tal:c.tal||null,why:why||'tour',f:F&&F.f||null,max:G.max||1,jours:d,alive:G.chars.filter(x=>x!=c).length,dead,gold:Math.floor(G.res&&G.res.gold||0),t:Date.now()}}
function finPartie(c,why,snap){if(FIN)return;const S=finSum(c,why);FIN=S;save=function(){};
 const d=new Date().toISOString();try{localStorage.setItem('tdE6_fin','{"date":'+JSON.stringify(d)+',"sum":'+JSON.stringify(S)+',"save":'+(snap||JSON.stringify(G))+'}')}catch(e){try{localStorage.setItem('tdE6_fin',JSON.stringify({date:d,sum:S}))}catch(_){}}
 try{localStorage.setItem('tdE6_over',JSON.stringify(S))}catch(_){}try{localStorage.setItem(SKEY,'{"over":1}')}catch(_){}
 setTimeout(()=>finShow(S),700)}
const FINWHY={tour:S=>S.f?`Tombé à l’étage ${S.f} de la Tour.`:'Tombé dans la Tour.',evt:S=>`Emporté par un péril de l’expédition${S.f?', à l’étage '+S.f:''}.`,porte:S=>`Porté blessé par ses compagnons, il n’a pas survécu à la déroute${S.f?' (étage '+S.f+')':''}.`,raid:()=>'Tombé lors d’un pillage, loin dans la galaxie.',garde:()=>'Mort en défendant le village contre un raid.'};
function finShow(S){if($('#fin'))return;try{closePanel()}catch(_){}const e=document.createElement('div');e.id='fin';const T=S.tal&&typeof TALENTS!='undefined'&&TALENTS[S.tal];
 e.innerHTML=`<div class="fpn"><canvas id="fcv" width="192" height="128"></canvas><div class="bub cap fc1">${frT('Quelque part, un écran s’éteint.')}</div><div class="bub voice fc2">${frT('Joueur 1… déconnecté.')}</div><div class="bub sfx fc3">BZZT…</div></div>
 <h1 class="fti">FIN DE PARTIE</h1><div class="fsm px"><p class="fwy">${frT((FINWHY[S.why]||FINWHY.tour)(S))}</p>
 <ul><li>Héros : <b>${S.name}</b> · niv. ${S.lv}${T?` · talent <b>${T.n}</b>`:''}</li><li>Jours joués : <b>${S.jours}</b></li><li>Étage le plus haut atteint : <b>${S.max}</b></li><li>Compagnons survivants : <b>${S.alive}</b></li><li>Tombés avant lui : <b>${S.dead.length}</b>${S.dead.length?` <span class="m">(${S.dead.slice(-8).join(', ')}${S.dead.length>8?'…':''})</span>`:''}</li><li>Or laissé au village : <b>${fmtN(S.gold)}</b></li></ul>
 <p class="m">${frT('La mort du héros est définitive. La partie a été archivée ; une nouvelle aventure commence par une nouvelle aspiration.')}</p><p style="text-align:center;margin:10px 0 0"><button onclick="finNew()">Nouvelle partie</button></p></div>`;
 document.body.appendChild(e);finAnim(S)}
function finNew(){try{localStorage.removeItem('tdE6_over');localStorage.setItem(SKEY,'{"over":1}')}catch(_){}location.reload()}
/* case finale : le sprite du héros clignote, se fige, puis se dissout en pixels qui remontent vers l'écran */
function finAnim(S){const cv=$('#fcv');if(!cv)return;const x=cv.getContext('2d'),c={id:-7,name:S.name,st:S.st||1,role:S.role||'guerrier',elem:S.elem||'arcane',race:S.race||'Humain',look:S.look,eq:{}},sp=drawChar(c,{b:0}),sw=sp.width,sh2=sp.height,K=2,ox=96-sw,oy=72-sh2;
 const D=sp.getContext('2d').getImageData(0,0,sw,sh2).data,P=[];for(let j=0;j<sh2;j++)for(let i=0;i<sw;i++){const a=(j*sw+i)*4;if(D[a+3]>0)P.push({i,j,c:`rgb(${D[a]},${D[a+1]},${D[a+2]})`,th:.15+.7*(j/sh2)*.4+Math.random()*.55,x:0,y:0,vx:0,vy:0,go:0})}
 const st=[];for(let i=0;i<70;i++)st.push([Math.random()*192,Math.random()*128,Math.random()*6]);const t0=performance.now();
 (function loop(){if(!$('#fcv'))return;const t=(performance.now()-t0)/1000;requestAnimationFrame(loop);
  x.fillStyle='#07060f';x.fillRect(0,0,192,128);st.forEach(s=>{const b=Math.sin(t*2+s[2]);x.fillStyle=b>.6?'#d8d0ff':'#3a3570';x.fillRect(s[0]|0,s[1]|0,1,1)});
  x.fillStyle='#1b1640';x.beginPath();x.ellipse(96,74,26,5,0,0,7);x.fill();
  const k=clamp((t-1.6)/3.2,0,1),gl=t<1.6&&Math.random()<.18;
  P.forEach(p=>{if(!p.go&&k>p.th){p.go=1;p.x=ox+p.i*K;p.y=oy+p.j*K;p.vx=(Math.random()-.5)*14;p.vy=-10-Math.random()*26}
   if(p.go){p.x+=p.vx/60;p.y+=p.vy/60;p.vy-=12/60;const life=1-clamp((k-p.th)*2.2,0,1);if(life<=0)return;x.globalAlpha=life;x.fillStyle=life<.6?'#c58bff':p.c;x.fillRect(p.x|0,p.y|0,life>.5?2:1,life>.5?2:1);x.globalAlpha=1}
   else{const dx=gl&&p.j%5<2?3:0;x.fillStyle=t>1.1&&Math.floor(t*10)%2&&t<1.6?'#ffffff':p.c;x.fillRect(ox+p.i*K+dx,oy+p.j*K,K,K)}});
  for(let y=0;y<128;y+=2){x.fillStyle='rgba(0,0,0,.18)';x.fillRect(0,y,192,1)}
  if(t>0.4)$('#fin').classList.add('s1');if(t>2.2)$('#fin').classList.add('s2');if(t>4.8)$('#fin').classList.add('s3')})()}
/* démarrage : marqueur de fin présent → l'écran de fin revient au rechargement, rien n'est ressuscité */
(function(){let S=null;try{S=JSON.parse(localStorage.getItem('tdE6_over')||'null')}catch(_){}if(!S)return;FIN=S;save=function(){};const _si=startIntro;startIntro=function(o){if(FIN)return;return _si(o)};setTimeout(()=>finShow(S),50)})();
function heroBoot(){if(!G||FIN)return;if(!G.t0)G.t0=Date.now();cosEnsure();const h=heroOf();if(h){G.v_mag=1;const w=heroArmFix(h,1);if(w)setTimeout(()=>toast(`${h.name} n’a pas d’aptitude à la magie : ${iName(w)} rangé dans la réserve.`,5000),9500);upRole(h)}if(!G.v_perma){G.v_perma=1;if(heroOf()&&G.intro)setTimeout(()=>toast('Nouvelle règle : <b>le héros peut mourir définitivement</b>. S’il meurt, c’est la fin de la partie. Les risques sont affichés avant chaque combat.',7000),2500)}}
(function(){const s=document.createElement('style');s.textContent=`
.ltb{display:flex;flex-wrap:wrap;gap:4px;margin:8px 0 6px}.ltb button{font-size:13px;padding:5px 8px;flex:1 1 auto}
.lgr{display:grid;grid-template-columns:repeat(auto-fill,minmax(70px,1fr));gap:5px}.lop{display:flex;flex-direction:column;align-items:center;gap:2px;padding:3px 2px;background:var(--panel2);color:var(--text);font-size:11px;line-height:1.1;min-height:44px}.lop img,#pin .bd .lop>img{width:60px;height:auto;max-width:100%;image-rendering:pixelated}#pin .bd .lop{display:flex}.lop.on{background:var(--gold);color:#221c33}
.lop{position:relative}.lop.lk{background:#1a1838}.lop.lk.on{background:#6a5420;color:#fff;outline:2px solid var(--gold)}.lop.lk img{opacity:.7}.lop:disabled{filter:grayscale(1);opacity:.75;cursor:not-allowed}.lop:disabled img{opacity:.5}.lprc,.lown{position:absolute;top:1px;right:1px;font-style:normal;font-size:9px;line-height:1;padding:1px 3px;background:#000;color:var(--rc,#ffcf4a);border:1px solid var(--rc,#ffcf4a)}.lown{color:#5fe07a;border-color:#5fe07a}.lsw button.lk{font-size:11px;opacity:.85}.lsw{margin:6px 0}.lsw button{width:34px;height:34px}.lnav{display:flex;align-items:center;justify-content:center;gap:6px;flex-wrap:wrap;margin:8px 0 2px}.lnav .m{min-width:150px;text-align:center}.lnav button{font-size:13px;padding:5px 10px}
#hprev,#cprev{width:160px;height:150px}#cprev{image-rendering:pixelated;margin-bottom:6px;animation:bob 1.6s ease-in-out infinite alternate}.hpv{width:176px;height:176px}
.mir{display:flex;gap:12px;align-items:center;flex-wrap:wrap}#mprev{width:128px;height:120px;image-rendering:pixelated;margin-bottom:6px;animation:bob 1.6s ease-in-out infinite alternate}.mir .hpv{width:140px;height:140px}
.hrk{border:3px solid #ff3a5a;background:#3a0c18;color:#ffd0d8;padding:6px 8px;margin:6px 0;font-size:13px;box-shadow:0 0 10px rgba(255,40,80,.35)}
#fin{position:absolute;inset:0;z-index:50;background:#000;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;gap:10px;overflow:auto;padding:16px;touch-action:manipulation;-webkit-overflow-scrolling:touch}
#fin .fpn{position:relative;width:min(576px,100%);aspect-ratio:3/2;flex:none;border:4px solid #fff;box-shadow:0 0 0 4px #000,0 0 0 7px #fff;opacity:0;transition:opacity 1.2s}#fin.s1 .fpn{opacity:1}
#fcv{width:100%;height:100%;image-rendering:pixelated;display:block}
#fin .bub{position:absolute;animation:none;opacity:0;transition:opacity .6s}#fin .fc1{left:8px;top:8px;right:auto;bottom:auto}#fin .fc2{left:auto;top:auto;right:8px;bottom:8px}#fin .fc3{left:50%;top:14%;right:auto;bottom:auto;translate:-50% 0;font-size:clamp(14px,4vw,22px);color:#ff5a6a}#fin.s3 .fc3{opacity:1}#fin.s2 .fc1,#fin.s3 .fc2{opacity:1}
.fti{margin:4px 0 0;font:700 clamp(30px,9vw,56px) var(--font);color:#ff3a4a;letter-spacing:3px;text-align:center;text-shadow:4px 4px 0 #000,0 0 18px rgba(255,40,60,.7);-webkit-text-stroke:2px #000;paint-order:stroke fill;opacity:0;transform:scale(1.6);transition:opacity .5s,transform .5s cubic-bezier(.2,1.6,.4,1)}#fin.s3 .fti{opacity:1;transform:none}
.fsm{width:min(576px,100%);padding:10px 14px;opacity:0;transition:opacity .8s .4s;flex:none}#fin.s3 .fsm{opacity:1}.fsm ul{margin:6px 0;padding-left:20px;font-size:14px}.fsm li{margin:3px 0}.fwy{color:#ffb0b8;margin:0 0 4px}
@media (max-width:560px){.hpv{width:150px;height:150px}#hprev,#cprev{width:128px;height:120px}.lgr{grid-template-columns:repeat(auto-fill,minmax(62px,1fr))}.lop img,#pin .bd .lop>img{width:52px}}`;document.head.appendChild(s)})();
