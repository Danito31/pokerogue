'use strict';
/* ================= BLESSURES DÉTAILLÉES (bible §15.1, docs/evenements.md) =================
   c.wd = {k, tot, left, fz?, dis?, ask?}  — durées en millisecondes de jeu réel ; left décroît avec le temps (vitesse injRate).
   c.inj reste le drapeau « indisponible » lu par tout le reste du code (équipe, postes, village) : il vaut 1 tant que la blessure impose le repos.
   Blessure légère / fracture / traumatisme : le personnage reste dans l'équipe avec des malus. Profonde : repos puis convalescence. Épuisement : indisponible.
   La mort définitive (deathP) touche aussi le héros : sa mort termine la partie (finPartie, js/hero.js). Chargé après combat.js (il enveloppe stats, hurt, doUlt…). */
const INJ={
 legere:{n:'Blessure légère',e:'🩹',r:1,tot:12,rest:0,m:{atk:.9,def:.9},d:'ATQ −10 %, DEF −10 %',col:'#ffcf4a'},
 trauma:{n:'Traumatisme',e:'💫',r:2,tot:30,rest:0,m:{crit:.6},blk:['skill'],d:'Crit. −40 %, technique de classe impossible, compétences passives coupées',col:'#c58bff'},
 fracture:{n:'Fracture',e:'🦴',r:2,tot:45,rest:0,m:{spd:.65,atk:.9},blk:['ult'],mv:.75,d:'VIT −35 %, ATQ −10 %, ultime impossible, déplacements −25 %',col:'#ff9a3a'},
 epuisement:{n:'Épuisement extrême',e:'💤',r:3,tot:25,rest:25,m:{},d:'indisponible pour combattre',col:'#6fd3ff'},
 profonde:{n:'Blessure profonde',e:'🩸',r:4,tot:60,rest:40,m:{hp:.85,atk:.8,def:.8,spd:.9},d:'repos 40 min, puis convalescence : PV −15 %, ATQ −20 %, DEF −20 %, VIT −10 %',col:'#ff5a5a'}};
const INJK=['legere','profonde','fracture','trauma','epuisement'];
const injT=ms=>{const m=Math.ceil(ms/60000);return m<=0?'< 1 min':m>=60?Math.floor(m/60)+' h '+String(m%60).padStart(2,'0'):m+' min'};
/* icône : image Blender inj_<k> si elle est embarquée, sinon pastille procédurale (emoji sur fond de la couleur de la blessure) */
function injIco(k,sz){sz=sz||20;const I=INJ[k],s=aSrc('inj_'+(k=='legere'?'legere':k));return s?`<img class="injic" style="width:${sz}px;height:${sz}px" src="${s}" alt="${I.n}">`:`<span class="injic fb" style="width:${sz}px;height:${sz}px;font-size:${Math.round(sz*.7)}px;background:${I.col}33;border-color:${I.col}">${I.e}</span>`}
const injUn=c=>!!(c.wd&&INJ[c.wd.k]&&INJ[c.wd.k].rest&&c.wd.tot-c.wd.left<INJ[c.wd.k].rest*60000);
function injMods(c){const w=c&&c.wd;if(!w||!INJ[w.k])return null;const o={};for(const x in INJ[w.k].m){const v=INJ[w.k].m[x];o[x]=w.fz?Math.max(.2,1-(1-v)*1.4):v}return o}
function injMalus(c){const w=c.wd;if(!w||!INJ[w.k])return'';const M=injMods(c),P=v=>Math.round((1-v)*100),a=[];if(M.hp)a.push('PV −'+P(M.hp)+' %');if(M.atk)a.push('ATQ −'+P(M.atk)+' %');if(M.def)a.push('DEF −'+P(M.def)+' %');if(M.spd)a.push('VIT −'+P(M.spd)+' %');if(M.crit)a.push('Crit. −'+P(M.crit)+' %');const I=INJ[w.k];if(I.blk&&I.blk.includes('ult'))a.push('ultime impossible');if(I.blk&&I.blk.includes('skill'))a.push('technique de classe impossible'+(w.dis&&w.dis.length?', '+w.dis.length+' passif'+(w.dis.length>1?'s':'')+' coupé'+(w.dis.length>1?'s':''):''));if(I.mv)a.push('déplacements −25 %');if(w.k=='epuisement')a.push('indisponible');if(w.k=='profonde'&&injUn(c))return'repos complet (indisponible), puis '+a.join(', ');return a.join(' · ')}
/* badge complet : icône + nom + minuteur + malus */
function injBadge(c,full){const w=c.wd;if(!w||!INJ[w.k])return'';const I=INJ[w.k];return`<span class="injbd" style="border-color:${I.col}" title="${I.n} — ${injMalus(c)}">${injIco(w.k,18)}<b style="color:${I.col}">${I.n}${w.fz?' (forcé)':''}</b> <span class="m" data-injt="${c.id}">${injT(w.left/injRate(c))}</span>${full?`<span class="m"> · ${injMalus(c)}</span>`:''}</span>`}
/* vitesse de rétablissement : 1 en expédition (+0,5 avec un Soigneur valide dans l'équipe) ; au village : Infirmerie +0,5 par niveau, Apothicaire en poste, Médecine, Soigneurs au repos */
function injRate(c){const exp=c.party&&!c.inj&&(mode=='floor'||mode=='battle');let r=1;if(exp){if(G.chars.some(x=>x!=c&&x.party&&!x.inj&&x.role=='soigneur'))r+=.5}else{r+=.5*bl('inf')+(rs('medecine')?.25:0);const a=JR('apothicaire','inf');if(a)r+=.25+.05*a;if(G.chars.some(x=>x!=c&&!x.inj&&!x.party&&x.role=='soigneur'))r+=.15}return r}
function injRateWhy(){const a=JR('apothicaire','inf'),p=['base ×1'];if(bl('inf'))p.push('Infirmerie niv. '+bl('inf')+' +'+(.5*bl('inf')).toString().replace('.',','));if(rs('medecine'))p.push('Médecine +0,25');if(a)p.push('Apothicaire en poste +'+(.25+.05*a).toFixed(2).replace('.',','));return p.join(' · ')}
function injHit(c,k,o){o=o||{};const I=INJ[k];if(!I)return;const ms=I.tot*60000;let w=c.wd;
 if(w&&INJ[w.k]){if(I.r>INJ[w.k].r)w={k,tot:ms,left:ms};else{w.left=Math.min(w.tot*1.5,w.left+ms*.25);w.tot=Math.max(w.tot,w.left)}}else w={k,tot:ms,left:ms};
 if(w.k=='trauma'&&!w.dis){const ks=Object.keys(_psOf(c));w.dis=shuffle(ks).slice(0,2)}
 if(o.battle)w.ask=1;c.wd=w;if(injUn(c)){c.inj=1;c.party=0}return w}
function injCure(c){delete c.wd;c.inj=0;if(typeof syncNPC=='function'&&mode=='village')syncNPC()}
function injDie(c,why){const snap=c.hero?JSON.stringify(G):null;G.dead.push(c.name);stash(c);G.chars=G.chars.filter(x=>x!=c);if(F&&F.carry)F.carry=F.carry.filter(i=>i!=c.id);try{relPrune()}catch(_){}if(c.hero)finPartie(c,why,snap)}
const deathPc=c=>Math.min(.9,deathP()*(c.wd&&c.wd.fz?2:1));
/* ---------- gravité à la chute : profondeur, dégâts excédentaires, type de combat, hasard ---------- */
function injFall(u,res,cfg){const c=u.c,f=F?F.f:1,kd=cfg&&cfg.kind;let s=Math.min(1,f/46*.3+Math.min(1,(u.ovk||0)*1.2)*.4+(kd=='boss'?.25:kd=='mini'?.15:kd=='elite'?.1:0)+Math.random()*.25);if(c.pers=='Stoïque'||(c.subs||[]).includes('Résistant'))s-=.1;s=clamp(s,0,1);
 const W={legere:45*(1-s)+4,trauma:14,fracture:10+22*s,epuisement:14,profonde:6+60*s};let x=Math.random()*Object.values(W).reduce((a,b)=>a+b,0),k='legere';for(const q in W){x-=W[q];if(x<=0){k=q;break}}
 injHit(c,k,{battle:1});if(res=='lose')c.party=0;else if(!c.inj)F.hp[c.id]=Math.max(1,Math.round(stats(c).hp*.25));
 const I=INJ[k];return`<p>${injIco(k,18)} ${u.n} est à terre : <b style="color:${I.col}">${I.n}</b> — ${injMalus(c)} (${injT(c.wd.left)}).${c.inj?' Il ne peut plus combattre.':' Il reste dans l’équipe, affaibli.'}</p>`}
/* ---------- choix après une chute grave en expédition ---------- */
const injPot=()=>G.items.find(it=>it&&it.t=='potion'&&it.q>0);
function injPotUse(){const it=injPot();if(!it)return false;it.q--;if(it.q<=0)G.items=G.items.filter(x=>x!=it);return true}
function injTreat(c){const w=c.wd;if(!w)return;const nx={profonde:'legere',fracture:'legere',epuisement:'legere'}[w.k];if(!nx)return injCure(c);const ms=INJ[nx].tot*60000*.6;c.wd={k:nx,tot:ms,left:ms};c.inj=0}
async function injAsk(c){const ult=c.wd.k=='epuisement',pot=injPot(),can=!!pot||G.res.food>=20,dp=Math.round(deathP()*100),dp2=Math.round(deathPc(Object.assign({},c,{wd:Object.assign({},c.wd,{fz:1})}))*100),nc=(F.carry||[]).length;
 window.injPick=a=>{window.injSel=a;closePanel()};window.injSel=null;
 await waitPanel(()=>[`${INJ[c.wd.k].n} — ${c.name}`,`<div class="row"><img class="sp" src="${cs(c).url}" alt=""><div class="gr"><b>${c.name}</b> ${injBadge(c,1)}<div class="m">Vivant, mais hors de combat. Que faites-vous ?</div></div></div>
 <div class="row"><div class="gr"><b>Soigner sur place</b><div class="m">${pot?'Consomme 1 dose de potion de la réserve.':'Consomme 20 vivres (cataplasme).'} La blessure passe à un stade plus léger et ${c.name} rejoint l’équipe${c.wd.k=='epuisement'?'':' à 30 % des PV'}.</div><div class="m g">Sans risque.</div></div><button ${can?'':'disabled'} onclick="injPick('soin')">Soigner</button></div>
 <div class="row"><div class="gr"><b>Le porter</b><div class="m">Rétablissement −30 % de durée. L’équipe avance ${Math.round(12)} % plus lentement par blessé porté (${nc?nc+' déjà porté'+(nc>1?'s':''):'aucun porté'}).</div><div class="m w">Risque : si toute l’équipe tombe, un blessé porté peut mourir (${Math.round(dp/2)} %).</div>${c.hero?heroRisk(Math.round(dp/2)):''}</div><button class="alt" onclick="injPick('porter')">Porter</button></div>
 <div class="row"><div class="gr"><b>Le renvoyer seul au village</b><div class="m">Sans frais. Il rentre par ses propres moyens.</div><div class="m w">Risque : 20 % d’aggravation en chemin (convalescence +50 %). Jamais mortel.</div></div><button class="alt" onclick="injPick('seul')">Renvoyer</button></div>
 ${ult?'':`<div class="row" style="border-color:var(--red)"><div class="gr"><b class="w">Continuer quand même avec lui</b><div class="m">Il reste dans l’équipe à 20 % des PV, malus ×1,4.</div><div class="warn" style="margin:4px 0">⚠ <b>RISQUE DE MORT</b> : s’il retombe, <b>${dp2} %</b> de chances de mourir pour toujours (au lieu de ${dp} %).</div>${c.hero?heroRisk():''}</div><button class="red" onclick="${c.hero?`if(this.dataset.ok)injPick('forcer');else{this.dataset.ok=1;this.textContent='Confirmer : risquer la fin de partie'}`:`injPick('forcer')`}">Forcer</button></div>`}
 <div class="row"><div class="gr"><b>Interrompre l’expédition</b><div class="m">Retour immédiat au village avec le butin ; tous les blessés sont portés (−30 % de durée). La progression de l’étage est perdue.</div></div><button class="alt" onclick="injPick('quit')">Rentrer</button></div>`],false);
 return window.injSel||'seul'}
async function injAfter(){if(!F||!G.chars)return;const L=G.chars.filter(c=>c.wd&&c.wd.ask&&c.inj);G.chars.forEach(c=>{if(c.wd&&c.wd.ask&&!c.inj)delete c.wd.ask});
 for(const c of L){if(!F)return;const a=await injAsk(c);delete c.wd.ask;
  if(a=='soin'){if(!injPotUse())G.res.food-=20;injTreat(c);c.party=99;F.hp[c.id]=Math.max(1,Math.round(stats(c).hp*.3));toast(`${c.name} est soigné sur place : ${c.wd?INJ[c.wd.k].n.toLowerCase():'guéri'}.`)}
  else if(a=='porter'){F.carry=(F.carry||[]).concat(c.id);c.wd.left*=.7;toast(`${c.name} est porté : l’équipe ralentit.`)}
  else if(a=='forcer'){c.inj=0;c.wd.fz=1;c.party=99;F.hp[c.id]=Math.max(1,Math.round(stats(c).hp*.2));toast(`${c.name} serre les dents et reprend sa place. Risque de mort accru !`,3200)}
  else if(a=='quit'){L.forEach(x=>{if(x.wd&&x.wd.ask!==0&&x!=c)x.wd.left*=.7});c.wd.left*=.7;reidx();save();await leaveFloor('quit');return}
  else{if(Math.random()<.2){c.wd.left*=1.5;toast(`${c.name} rentre seul… et s’aggrave en chemin.`)}else toast(`${c.name} rentre au village.`)}
  reidx();syncFol();hud()}
 save()}
/* ---------- tick : minuteurs, convalescence, expiration ---------- */
function injTick(){if(!G||G.intro===0||!G.chars)return;const now=Date.now(),dt=Math.min(30*864e5,Math.max(0,now-(G.injT||now)));G.injT=now;let ch=0;
 G.chars.forEach(c=>{if(c.inj&&!c.wd)c.wd={k:'profonde',tot:36e5,left:18e5};if(c.wd&&!INJ[c.wd.k]){delete c.wd}if(!c.wd)return;if(dt)c.wd.left-=dt*injRate(c);
  if(c.wd.left<=0){const nm=c.name,k=c.wd.k;injCure(c);ch=1;if(!introCover)toast(`${nm} est rétabli (${INJ[k].n.toLowerCase()} guérie).`,2600)}
  else if(c.inj&&!injUn(c)){c.inj=0;ch=1;toast(`${c.name} peut quitter le lit : convalescence (malus encore ${injT(c.wd.left/injRate(c))}).`,3000)}});
 if(ch){save();if(mode=='village'&&typeof syncNPC=='function')syncNPC();if(panelOpen&&PF)try{rp()}catch(_){}}
 document.querySelectorAll('[data-injt]').forEach(e=>{const c=G.chars.find(x=>x.id==e.dataset.injt);if(c&&c.wd)e.textContent=injT(c.wd.left/injRate(c))})}
function injBoot(){if(!G)return;if(!G.v_inj){G.chars.forEach(c=>{if(c.inj&&!c.wd)c.wd={k:'profonde',tot:36e5,left:18e5}});G.v_inj=1}
 G.chars.forEach(c=>{if(c.wd&&!INJ[c.wd.k])delete c.wd;if(c.wd){delete c.wd.ask;if(c.wd.left>c.wd.tot*1.6)c.wd.left=c.wd.tot}});if(!G.injT)G.injT=Date.now();injTick()}
/* ---------- enveloppes : stats, passifs, combat ---------- */
const _stats=stats;stats=function(c){const s=_stats(c),M=injMods(c);if(!M)return s;for(const k in M)s[k]=k=='crit'?s[k]*M[k]:Math.max(k=='spd'?1:1,Math.round(s[k]*M[k]));return s};
const _psOf=psOf;psOf=function(c){const o=_psOf(c);if(c&&c.wd&&c.wd.dis)c.wd.dis.forEach(k=>delete o[k]);return o};
const injBlock=(c,t)=>!!(c&&c.wd&&INJ[c.wd.k]&&INJ[c.wd.k].blk&&INJ[c.wd.k].blk.includes(t));
const _hurt=hurt;hurt=function(t,d,o){const h0=t.hp,a0=t.alive,r=_hurt(t,d,o);if(t.ally&&a0&&!t.alive)t.ovk=Math.max(0,d-h0)/Math.max(1,t.mhp);return r};
const _doUlt=doUlt;doUlt=async function(u){if(u.ally&&injBlock(u.c,'ult')){u.en=Math.min(u.en,40);fl(u,'FRACTURE','deb');say(u.n+' ne peut pas tenir l’effort : l’ultime est impossible (fracture).');return}return _doUlt(u)};
const _doSkill=doSkill;doSkill=async function(u,id){if(u.ally&&injBlock(u.c,'skill')&&(!id||id=='role'||id=='sub')){fl(u,'TRAUMA','deb');say(u.n+' est traumatisé : il n’ose plus lancer sa technique et attaque simplement.');return doBasic(u)}return _doSkill(u,id)};
const _setSP=setSP;setSP=function(d){_setSP(d);try{injBattleDeco()}catch(_){}};
function injBattleDeco(){if(!B||!B.A)return;B.A.forEach((u,i)=>{const e=document.getElementById('pc'+i);if(!e||e.querySelector('.injb')||!u.c||!u.c.wd)return;const I=INJ[u.c.wd.k];e.insertAdjacentHTML('beforeend',`<span class="injb" title="${I.n} — ${injMalus(u.c)}">${injIco(u.c.wd.k,16)}</span>`);e.title=I.n+' — '+injMalus(u.c);if(!B.injSaid){B.injSaid={}}if(!B.injSaid[u.c.id]){B.injSaid[u.c.id]=1;say(u.n+' : '+I.n.toLowerCase()+' ('+injMalus(u.c)+').')}})}
const _hud=hud;hud=function(){_hud();try{if(mode=='floor'&&F){const tm=document.querySelectorAll('#team .tm');party().forEach((c,i)=>{if(tm[i]&&c.wd)tm[i].insertAdjacentHTML('beforeend',`<span class="injb" title="${INJ[c.wd.k].n} — ${injMalus(c)}">${injIco(c.wd.k,16)}</span>`)});if(F.carry&&F.carry.length)document.getElementById('team').insertAdjacentHTML('beforeend',`<div class="tm px" title="Blessés portés : l’équipe avance plus lentement"><b>🛏 ${F.carry.length}</b></div>`)}}catch(_){}};
const _charRow=charRow;charRow=function(c,btn){let h=_charRow(c,btn);if(c.wd){h=h.replace(/ <b class="w">blessé<\/b>/,'');h=h.replace('<div class="m">PV ',`<div>${injBadge(c,1)}</div><div class="m">PV `)}return h};
const _sheetHead=sheetHead;sheetHead=function(c){let h=_sheetHead(c);if(c.wd){h=h.replace(/ · <b class="w">blessé<\/b>/,'');h=h.replace('<div class="m">PV ',`<div>${injBadge(c,1)}</div><div class="m">PV `)}return h};
const _leaveFloor=leaveFloor;leaveFloor=async function(why){if(F&&why=='wipe'){const L=[];(F.carry||[]).forEach(id=>{const c=G.chars.find(x=>x.id==id);if(c&&Math.random()<deathP()/2){injDie(c,'porte');L.push(`<p class="w">${c.name}, porté par l’équipe, n’a pas survécu à la déroute. Rien ne le ramènera.</p>`)}else if(c)L.push(`<p>${c.name}, porté, a survécu à la déroute.</p>`)});G.chars.forEach(c=>{if(c.wd)delete c.wd.ask});if(L.length)await waitPanel(()=>['Les blessés portés',L.join('')+'<button onclick="closePanel()">Continuer</button>'],false)}
 else G.chars.forEach(c=>{if(c.wd)delete c.wd.ask});return _leaveFloor(why)};
/* déplacement : porter des blessés (−12 % chacun), fracture du capitaine (−25 %) */
function injMove(){let m=1;if(F&&F.carry)m-=.12*F.carry.length;const c=party()[0];if(c&&c.wd&&INJ[c.wd.k]&&INJ[c.wd.k].mv)m*=INJ[c.wd.k].mv;return Math.max(.4,m)}
/* ---------- avertissements ---------- */
function injWarnHTML(){const w=party().filter(c=>c.wd);return`⚠ <b>Combat à risque : mort définitive.</b> Un personnage à terre à la fin du combat meurt pour toujours avec <b>${Math.round(deathP()*100)} %</b> de chances${w.length?' (<b>×2</b> pour un blessé forcé à continuer)':''} ; sinon il est blessé (typé : légère, profonde, fracture, traumatisme, épuisement).${heroIn()?heroRisk(Math.round(deathPc(heroOf())*100)):''}${w.length?'<br>'+w.map(c=>`${injIco(c.wd.k,14)} ${c.name} : ${INJ[c.wd.k].n.toLowerCase()} (${injMalus(c)})`).join('<br>'):''}`}
function injInfHTML(c0){const L=G.chars.filter(c=>c.wd||c.inj),dp=Math.round(deathP()*100);let h=`<p class="m">Rétablissement : <b>×${injRate({party:0,inj:1}).toFixed(2).replace('.',',')}</b> (${injRateWhy()}). Mort après un combat : <b>${dp} %</b> (Infirmerie et Apothicaire réduisent ce risque).</p>`;
 if(!L.length)return h+'<p>Aucun blessé. Tant mieux.</p>';const pot=injPot();
 return h+L.map(c=>{const k=c.wd?c.wd.k:'profonde',cost=k=='legere'?Math.max(2,Math.round(c0/2)):c0;return`<div class="row"><img class="sp" src="${cs(c).url}" alt=""><div class="gr"><b>${c.name}</b> ${injBadge(c,1)}</div><button class="ib" ${G.res.food<cost?'disabled':''} onclick="healC(${c.id},${cost})">Soigner (${cost} vivres)</button>${pot?`<button class="ib alt" onclick="injPotion(${c.id})">Potion (−50 % de temps)</button>`:''}</div>`}).join('')}
function injPotion(id){const c=G.chars.find(x=>x.id==id);if(!c||!c.wd||!injPotUse())return;if(c.wd.k=='legere'||c.wd.k=='trauma')injCure(c);else c.wd.left*=.5;save();rp()}
const _openPortal=openPortal;openPortal=function(){_openPortal();const f=PF;PF=()=>{const r=f(),w=party().filter(c=>c.wd);if(w.length)r[1]=r[1].replace('<p>Équipe :',`<div class="warn">${w.map(c=>`${injIco(c.wd.k,16)} <b>${c.name}</b> est blessé : ${injBadge(c)} — ${injMalus(c)}`).join('<br>')}<br><b>Ce personnage sera moins efficace (${w.length>1?'ces personnages':'il'} et ses coéquipiers risquent davantage).</b> Soignez-le à l’Infirmerie avant de partir.</div><p>Équipe :`);return r};rp()};
(function(){const s=document.createElement('style');s.textContent=`.injic{display:inline-block;image-rendering:pixelated;vertical-align:-4px;object-fit:contain}.injic.fb{border:2px solid;box-sizing:border-box;text-align:center;line-height:1.2em}.injbd{display:inline-flex;align-items:center;gap:4px;border:2px solid;background:rgba(0,0,0,.35);padding:1px 6px 1px 3px;margin:2px 4px 2px 0;font-size:12px;flex-wrap:wrap}.injb{position:absolute;top:-8px;right:-6px;z-index:2;pointer-events:none}.tm,.pc{position:relative}`;document.head.appendChild(s)})();
setInterval(()=>{try{injTick()}catch(e){console.warn('injTick',e)}},1000);
