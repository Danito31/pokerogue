'use strict';
/* ================= HÉROS : APPARENCE (créateur de l'intro + Miroir) ET MORT DÉFINITIVE (fin de partie) =================
   Apparence : c.look = {skin, hair, eye, style 0-9, face 0-5, body 0-3, hue}. drawChar (art.js) lit face/body ; sans ces champs, rien ne change.
   Mort du héros (décision du créateur) : il suit les mêmes jets de mort que tout le monde. S'il meurt, la partie est terminée :
   la sauvegarde est archivée dans 'tdE6_fin', remplacée par un marqueur ('tdE6_over'), et seul « Nouvelle partie » reste possible.
   Chargé après raids.js, avant main.js. */
const HSTY=['Mèche','Hérissés','Longs','Tresse','Raie au milieu','Couettes','Court','Queue de cheval','Crête','Macarons'];
const HFAC=['Classique','Lunettes','Taches de rousseur','Cicatrice','Barbe','Regard perçant'];
const HBOD=['Standard','Mince','Costaud','Petit'];
const LTABS=[['style','Cheveux'],['hair','Couleur'],['face','Visage'],['body','Corps'],['skin','Peau'],['eye','Yeux']];
/* ---------- éditeur d'apparence partagé (LED = {c, tab, cb}) ---------- */
let LED=null;
function ledBind(c,cb){const L=c.look||(c.look=Object.assign({},look(c)));if(L.face==null)L.face=0;if(L.body==null)L.body=0;LED={c,tab:LED?LED.tab:'style',cb}}
function ledImg(L,head){const c=Object.assign({},LED.c,{look:L}),i0=drawChar(c,{b:0});if(!head)return scaleC(i0,2).toDataURL();const h=mkc(20,18);h.getContext('2d').drawImage(i0,6,1,20,18,0,0,20,18);return scaleC(h,3).toDataURL()}
const ledArr=k=>k=='style'?HSTY:k=='face'?HFAC:k=='body'?HBOD:k=='hair'?HAIRS:k=='skin'?SKINS:EYES;
function ledCur(){const k=LED.tab,A=ledArr(k),L=LED.c.look,i=typeof A[0]=='string'&&A[0][0]=='#'?A.indexOf(L[k]):L[k]|0,n=LTABS.find(t=>t[0]==k)[1];return`${n} : <b>${k=='style'||k=='face'||k=='body'?A[i]:'teinte '+(i+1)}</b> (${i+1}/${A.length})`}
function ledHTML(){const L=LED.c.look,t=LED.tab;let b;
 if(t=='style'||t=='face'||t=='body')b=`<div class="lgr">${ledArr(t).map((n,i)=>`<button class="lop${(L[t]|0)==i?' on':''}" onclick="ledSet('${t}',${i})" title="${n}"><img src="${ledImg(Object.assign({},L,{[t]:i}),t!='body')}" alt=""><span>${n}</span></button>`).join('')}</div>`;
 else b=`<div class="sw lsw">${ledArr(t).map(v=>`<button class="${L[t]==v?'on':''}" style="background:${v}" onclick="ledSet('${t}','${v}')" aria-label="${v}"></button>`).join('')}</div>`;
 return`<div class="ltb">${LTABS.map(([k,n])=>`<button class="${t==k?'on':'alt'}" onclick="ledTab('${k}')">${n}</button>`).join('')}</div>${b}<div class="lnav"><button class="alt" onclick="ledStep(-1)" aria-label="Précédent">◀</button><span class="m">${ledCur()}</span><button class="alt" onclick="ledStep(1)" aria-label="Suivant">▶</button><button class="alt" onclick="ledRnd()">🎲 Aléatoire</button></div>`}
function ledDraw(){const e=$('#led');if(e&&LED)e.innerHTML=ledHTML();if(LED&&LED.cb)LED.cb()}
function ledTab(k){LED.tab=k;ledDraw()}
function ledSet(k,v){LED.c.look[k]=v;ledDraw()}
function ledStep(d){const k=LED.tab,A=ledArr(k),L=LED.c.look;if(A[0][0]=='#'){L[k]=A[md(A.indexOf(L[k])+d,A.length)]}else L[k]=md((L[k]|0)+d,A.length);ledDraw()}
function ledRnd(){const L=LED.c.look;Object.assign(L,{style:ri(0,HSTY.length-1),face:Math.random()<.4?0:ri(1,HFAC.length-1),body:Math.random()<.4?0:ri(1,HBOD.length-1),hair:pick(HAIRS),skin:pick(SKINS),eye:pick(EYES)});ledDraw()}
/* aperçu animé (respiration idle, cadre 32×30) */
function ledPrev(id,t){const cv=$('#'+id);if(!cv||!LED)return;const x=cv.getContext('2d');x.clearRect(0,0,32,30);x.drawImage(drawChar(LED.c,{b:Math.floor(t*2)%2}),0,0)}
/* ---------- Miroir (fiche du héros) : changer d'apparence contre de l'or ---------- */
const mirPrice=()=>Math.round(2000*Math.pow(1.5,G.mirN||0)/100)*100;
let MIR=null,MIRIV=0;
function openMirror(){const h=heroOf();if(!h)return;MIR={c:Object.assign({},h,{look:Object.assign({face:0,body:0},h.look||look(h))})};ledBind(MIR.c,null);
 openPanel(()=>{const p=mirPrice(),same=JSON.stringify(MIR.c.look)==JSON.stringify(Object.assign({face:0,body:0},h.look||look(h)));return['Miroir',`<p><button class="alt" onclick="mirBack()">← Fiche de ${h.name}</button></p><p class="m">Un vieux miroir de la Tour, cerclé de runes : il remodèle l’apparence de celui qui s’y regarde. Chaque passage coûte plus cher que le précédent.</p>
 <div class="mir"><div class="hpv"><canvas id="mprev" width="32" height="30"></canvas></div><div class="gr"><b>${h.name}</b><div class="m">Prix : <b class="g">${fmtN(p)} or</b> (vous avez ${fmtN(Math.floor(G.res.gold))})${G.mirN?` · déjà ${G.mirN} passage${G.mirN>1?'s':''}`:''}</div><p style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px"><button ${same||G.res.gold<p?'disabled':''} onclick="mirOK()">${same?'Aucun changement':`Valider (${fmtN(p)} or)`}</button><button class="alt" onclick="openMirror()">Annuler les changements</button></p></div></div><div id="led">${ledHTML()}</div>`]});
 LED.cb=()=>{try{rp()}catch(_){}};clearInterval(MIRIV);const t0=performance.now();MIRIV=setInterval(()=>{if(!$('#mprev')){clearInterval(MIRIV);return}ledPrev('mprev',(performance.now()-t0)/1000)},120)}
const fmtN=n=>Math.round(n).toLocaleString('fr-FR').replace(/ | /g,' ');
function mirBack(){const h=heroOf();if(h)openSheet(h.id);else closePanel()}
function mirOK(){const h=heroOf(),p=mirPrice();if(!h||!MIR||G.res.gold<p)return;G.res.gold-=p;G.mirN=(G.mirN||0)+1;h.look=Object.assign({},MIR.c.look);for(const k in CS)if(k.startsWith(h.id+':'))delete CS[k];save();hud();try{if(mode=='village')syncNPC()}catch(_){}toast(`${h.name} se découvre un nouveau visage dans le miroir. (−${fmtN(p)} or)`,3200);mirBack()}
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
const FINWHY={tour:S=>S.f?`Tombé à l’étage ${S.f} de la Tour des Étoiles.`:'Tombé dans la Tour des Étoiles.',evt:S=>`Emporté par un péril de l’expédition${S.f?', à l’étage '+S.f:''}.`,porte:S=>`Porté blessé par ses compagnons, il n’a pas survécu à la déroute${S.f?' (étage '+S.f+')':''}.`,raid:()=>'Tombé lors d’un pillage, loin dans la galaxie.',garde:()=>'Mort en défendant le village contre un raid.'};
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
function heroBoot(){if(!G||FIN)return;if(!G.t0)G.t0=Date.now();if(!G.v_perma){G.v_perma=1;if(heroOf()&&G.intro)setTimeout(()=>toast('Nouvelle règle : <b>le héros peut mourir définitivement</b>. S’il meurt, c’est la fin de la partie. Les risques sont affichés avant chaque combat.',7000),2500)}}
(function(){const s=document.createElement('style');s.textContent=`
.ltb{display:flex;flex-wrap:wrap;gap:4px;margin:8px 0 6px}.ltb button{font-size:13px;padding:5px 8px;flex:1 1 auto}
.lgr{display:grid;grid-template-columns:repeat(auto-fill,minmax(70px,1fr));gap:5px}.lop{display:flex;flex-direction:column;align-items:center;gap:2px;padding:3px 2px;background:var(--panel2);color:var(--text);font-size:11px;line-height:1.1;min-height:44px}.lop img,#pin .bd .lop>img{width:60px;height:auto;max-width:100%;image-rendering:pixelated}#pin .bd .lop{display:flex}.lop.on{background:var(--gold);color:#221c33}
.lsw{margin:6px 0}.lsw button{width:34px;height:34px}.lnav{display:flex;align-items:center;justify-content:center;gap:6px;flex-wrap:wrap;margin:8px 0 2px}.lnav .m{min-width:150px;text-align:center}.lnav button{font-size:13px;padding:5px 10px}
#hprev{width:160px;height:150px}.hpv{width:176px;height:176px}
.mir{display:flex;gap:12px;align-items:center;flex-wrap:wrap}#mprev{width:128px;height:120px;image-rendering:pixelated;margin-bottom:6px;animation:bob 1.6s ease-in-out infinite alternate}.mir .hpv{width:140px;height:140px}
.hrk{border:3px solid #ff3a5a;background:#3a0c18;color:#ffd0d8;padding:6px 8px;margin:6px 0;font-size:13px;box-shadow:0 0 10px rgba(255,40,80,.35)}
#fin{position:absolute;inset:0;z-index:50;background:#000;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;gap:10px;overflow:auto;padding:16px;touch-action:manipulation;-webkit-overflow-scrolling:touch}
#fin .fpn{position:relative;width:min(576px,100%);aspect-ratio:3/2;flex:none;border:4px solid #fff;box-shadow:0 0 0 4px #000,0 0 0 7px #fff;opacity:0;transition:opacity 1.2s}#fin.s1 .fpn{opacity:1}
#fcv{width:100%;height:100%;image-rendering:pixelated;display:block}
#fin .bub{position:absolute;animation:none;opacity:0;transition:opacity .6s}#fin .fc1{left:8px;top:8px;right:auto;bottom:auto}#fin .fc2{left:auto;top:auto;right:8px;bottom:8px}#fin .fc3{left:50%;top:14%;right:auto;bottom:auto;translate:-50% 0;font-size:clamp(14px,4vw,22px);color:#ff5a6a}#fin.s3 .fc3{opacity:1}#fin.s2 .fc1,#fin.s3 .fc2{opacity:1}
.fti{margin:4px 0 0;font:700 clamp(30px,9vw,56px) var(--font);color:#ff3a4a;letter-spacing:3px;text-align:center;text-shadow:4px 4px 0 #000,0 0 18px rgba(255,40,60,.7);-webkit-text-stroke:2px #000;paint-order:stroke fill;opacity:0;transform:scale(1.6);transition:opacity .5s,transform .5s cubic-bezier(.2,1.6,.4,1)}#fin.s3 .fti{opacity:1;transform:none}
.fsm{width:min(576px,100%);padding:10px 14px;opacity:0;transition:opacity .8s .4s;flex:none}#fin.s3 .fsm{opacity:1}.fsm ul{margin:6px 0;padding-left:20px;font-size:14px}.fsm li{margin:3px 0}.fwy{color:#ffb0b8;margin:0 0 4px}
@media (max-width:560px){.hpv{width:150px;height:150px}#hprev{width:128px;height:120px}.lgr{grid-template-columns:repeat(auto-fill,minmax(62px,1fr))}.lop img,#pin .bd .lop>img{width:52px}}`;document.head.appendChild(s)})();
