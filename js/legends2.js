'use strict';
/* ================= LÉGENDES : EFFETS, INVOCATION, FICHE, CODEX, SPRITES, ÉVEIL DE JEANNE, CHRONIQUES =================
   Données : js/legends.js (LEG, LEG_RATE, objets ITYPES 'lg_<id>'). Règles et récit : docs/lore.md.
   Tout passe par des enveloppes (mk, roll, summon, pullHTML, kit, stats, gain, battleStart, turnStart, deal, hurt, heal, addSh, onKill, lootPassives,
   iName, iTxt, itemSprite, charPal, drawChar, sheetHead, openCodex, equip, unequip, renvoyer, doEvo, fight, vTick) : aucun autre fichier JS n'est modifié.
   État : c.leg (id de légende) · c.legE (échos : doublons, max 5) · G.legd {id:1} (légendes découvertes) · G.lore [n] (fragments de chronique) · G.legScene · drapeau G.v_leg.
   Débogage : window.LEGEND_FORCE = 'napoleon' (ou true) → les invocations suivantes donnent cette légende ; legGive('zeus') l'ajoute directement. */
const legOf=c=>c&&c.leg&&LEG[c.leg]||null;
const legHas=c=>!!(c&&c.leg&&c.eq&&SLK.some(k=>c.eq[k]&&ITYPES[c.eq[k].t]&&ITYPES[c.eq[k].t].leg==c.leg));
const legOwner=id=>G.chars.find(c=>c.leg==id)||null;
const legU=(u,id)=>!!(u&&u.c&&u.c.leg==id);
const legUI=(u,id)=>legU(u,id)&&legHas(u.c);
const legAl=id=>B&&B.A?B.A.find(u=>u.alive&&u.c&&u.c.leg==id)||null:null;
const legTM=(u,M)=>M*(1+.1*Math.max(0,(u.c.st||4)-4));
const isBig=t=>t&&(t.kind=='boss'||t.kind=='mini'||t.kind=='elite');
function legEnsure(){if(!G)return;if(!G.legd||typeof G.legd!='object')G.legd={};if(!Array.isArray(G.lore))G.lore=[];G.chars.forEach(c=>{if(c.leg&&!LEG[c.leg])delete c.leg;if(c.leg)G.legd[c.leg]=1});legPurge()}
/* objets uniques : liés à leur légende ; un objet orphelin (légende partie, morte, capturée) disparaît avec elle */
function legPurge(){if(G&&Array.isArray(G.items))G.items=G.items.filter(it=>!(it&&ITYPES[it.t]&&ITYPES[it.t].leg))}
/* ---------- création ---------- */
function legItem(id,st){const D=LEG[id];return mkItem('lg_'+id,st,{el:D.it.s=='arme'?D.elem:null,leg:id})}
function legMake(id){const D=LEG[id],eq={arme:null,armure:null,outil:null};eq[D.it.s]=legItem(id,D.st);if(D.it.s!='arme')eq.arme=mkItem(D.wpn||'epee',D.st,{el:null});
 const c=_legMk(D.st,{name:D.n,race:D.race,pers:D.pers,sub:D.subs[0],subs:D.subs.slice(),elem:D.elem,look:Object.assign({hue:0,body:0},D.look),leg:id,fixed:1,mage:undefined,eq});
 G.legd[id]=1;return c}
let LEGQ=0,LEGN=[];
const _legMk=mk;
function legPick(st){const f=window.LEGEND_FORCE;if(f){if(typeof f=='string'&&LEG[f]&&!LEG[f].noSum)return f;const L=LEGK.filter(k=>!LEG[k].noSum&&(LEG[k].st==st||st<4)&&!legOwner(k));return L.length?pick(L):null}
 if(st<4||!(Math.random()<(LEG_RATE[st]||0)))return null;return pick(LEGK.filter(k=>!LEG[k].noSum&&LEG[k].st==st))}
/* doublon : la légende déjà présente gagne un écho (+3 % PV/ATQ/DEF, 5 au plus), au-delà 20 éclats ; le tirage donne alors un personnage ordinaire */
function legEcho(id){const c=legOwner(id);if(!c)return;if((c.legE||0)<5){c.legE=(c.legE||0)+1;LEGN.push(`${c.name} : écho légendaire ${c.legE}/5 (+3 % PV, ATQ, DEF)`)}else{G.res.shard+=20;LEGN.push(`${c.name} : écho au maximum → +20 éclats`)}}
mk=function(st,o){if(LEGQ&&!(o&&o.leg)){const id=legPick(st);if(id){if(!legOwner(id))return legMake(id);legEcho(id)}}return _legMk(st,o)};
{const _rl=roll;roll=function(){const f=LEGQ&&window.LEGEND_FORCE;if(f)return typeof f=='string'&&LEG[f]?LEG[f].st:4;return _rl.apply(this,arguments)}}
{const _sm=summon;summon=function(n){LEGQ=1;LEGN=[];try{_sm.apply(this,arguments)}finally{LEGQ=0}const got=SM.filter(x=>x.c&&x.c.leg);if(got.length||LEGN.length)setTimeout(()=>toast(got.map(x=>`✦ LÉGENDE : <b>${x.c.name}</b>, ${LEG[x.c.leg].t}, rejoint le village !`).concat(LEGN).join('<br>'),5200),300)}}
{const _ph=pullHTML;pullHTML=function(){let h=_ph.apply(this,arguments);SM.forEach(x=>{if(x.c&&x.c.leg)h=h.replace(`<b>${x.c.name}</b>`,`<b>${x.c.name}</b><i class="lgt">✦ LÉGENDE</i>`)});return h}}
window.legGive=id=>{if(!LEG[id]||legOwner(id))return null;const c=legMake(id);G.chars.push(c);try{save();syncNPC()}catch(_){}return c};
/* ---------- éveil de Jeanne : premier éveil d'étoile (3★ → 4★) ---------- */
function legJeanne(c){if(!c||c.leg||!c.sig)return;const D=LEG.jeanne;c.leg='jeanne';c.name=D.n;c.elem=D.elem;if(c.eq.outil)G.items.push(c.eq.outil);c.eq.outil=legItem('jeanne',c.st);upRole(c);G.legd.jeanne=1;G.legScene='jeanne'}
{const _ev=doEvo;doEvo=function(id){const r=_ev.apply(this,arguments);try{const c=G.chars.find(x=>x.id==id);if(c){if(c.sig&&!c.leg&&c.st>=4){legJeanne(c);save();rp()}if(c.leg)SLK.forEach(k=>{const it=c.eq[k];if(it&&ITYPES[it.t].leg)it.st=Math.max(it.st,c.st)})}}catch(e){console.warn('légendes',e)}return r}}
function legScene(){const k=G.legScene;G.legScene=0;save();if(k!='jeanne')return;const c=legOwner('jeanne'),h=heroOf(),cap=h?h.name:'capitaine';if(!c)return;
 const L=[['n','Le parchemin d’éveil s’embrase entre ses mains. Une odeur de fumée, de bois mouillé, de foule. Rouen, 1431.'],['j','Je me souviens… Le bûcher. Les flammes qui montaient. Et au-dessus de la place, cette lumière bleue, carrée, comme une fenêtre.'],['j','On m’a tirée du feu pour m’amener ici. Sans mon nom. Sans mes Voix. Juste « Jeanne, commandante ».'],['j',`${cap}… tu savais ? Non. Personne ne sait qui a écrit ce jeu.`],['j','Je m’appelle Jeanne. Jeanne d’Arc. Et cette fois, je sais pour qui je me bats.'],['n','Jeanne d’Arc rejoint les Légendes. Elle relève l’Étendard de la Pucelle.']];
 openPanel(()=>['Souvenirs retrouvés',`<div class="lgsc"><img class="sp" src="${cs(c).url}" alt=""><div>${L.map(([w,t])=>w=='n'?`<p class="m"><i>${t}</i></p>`:`<p><b class="g">Jeanne</b> : « ${t} »</p>`).join('')}</div></div><p><button onclick="openSheet(${c.id})">Voir la fiche</button> <button class="alt" onclick="closePanel()">Continuer</button></p>`])}
/* ---------- kit : ultime de signature dès le niveau 1 ---------- */
{const _k=kit;kit=function(c){const o=_k(c),D=legOf(c);if(!D)return o;o.uid='lg_'+c.leg;o.ul=[D.ul[0],D.ul[1]];o.uk='sk_ult_lg_'+c.leg;return o}}
/* ---------- passives de signature (LFX) et effets d'objets uniques (LIX) ----------
   st(s,c) statistiques · start(u,A) début de combat · turn(u) début de tour · out(a,t,m,o)→m dégâts infligés · after(a,t,d,o) après un coup · inc(t,d)→d dégâts subis */
const LFX={
 napoleon:{start:(u,A)=>A.forEach(a=>{a.av*=.8})},
 vinci:{st:s=>{s.crit+=.05}},
 musashi:{out:(a,t,m)=>foes().length==1?m*1.2:m},
 cleopatre:{start:()=>{const e=B.E.filter(x=>x.alive&&x.kind!='obj').sort((x,y)=>y.atk-x.atk)[0];if(e){e.bf.atk={v:Math.min(bfv(e,'atk'),-.15),t:3};fl(e,'CHARMÉ','deb')}}},
 hannibal:{st:s=>{s.hp*=1.08;s.spd+=4}},
 vercingetorix:{start:(u,A)=>A.forEach(a=>{a.def*=1.08})},
 mulan:{st:s=>{s.def*=1.1;s.spd+=5}},
 robin:{out:(a,t,m)=>isBig(t)?m*1.25:m},
 tesla:{turn:u=>gainEn(u,10)},
 suntzu:{start:(u,A)=>A.forEach(a=>{a.crit+=.06})},
 gilgamesh:{st:s=>{s.atk*=1.1}},
 alexandre:{},
 arthur:{start:(u,A)=>{if(A.length>=3)A.forEach(a=>{a.atk*=1.06;a.def*=1.06})}},
 merlin:{start:u=>{u.extra1=1}},
 achille:{out:(a,t,m)=>m*1.25,inc:(t,d)=>d*1.1},
 hercule:{st:s=>{s.hp*=1.15},out:(a,t,m)=>isBig(t)?m*1.15:m},
 wukong:{},
 siegfried:{},
 zeus:{start:(u,A)=>A.forEach(a=>{a.sh=Math.max(a.sh,Math.round(a.mhp*.15));a.sht=3})},
 odin:{start:()=>{B.sp=clamp(B.sp+1,0,5);B.E.forEach(e=>{e.bf.def={v:Math.min(bfv(e,'def'),-.1),t:3}})}},
 thor:{st:s=>{s.hp*=1.12;s.atk*=1.08}},
 amaterasu:{},
 anubis:{},
 quetzal:{st:s=>{s.spd+=10},start:u=>{u.av=0}},
 jeanne:{}};
const LIX={
 napoleon:{start:(u,A)=>{B.sp=clamp(B.sp+1,0,5);A.forEach(a=>{a.spd+=4})}},
 vinci:{out:(a,t,m)=>t.broken?m*1.15:m},
 musashi:{after:(a,t,d,o)=>{if(t.alive&&!o.rep&&!o.x&&!o.rip&&!o.pet&&Math.random()<.25){fl(a,'NI-TEN','buf');deal(a,t,.4,5,{rep:1,x:1})}}},
 cleopatre:{},
 hannibal:{out:(a,t,m)=>t.hp>t.mhp*.7?m*1.2:m},
 vercingetorix:{},
 mulan:{turn:u=>{if(allies().some(x=>x.hp<x.mhp*.3)){bfT(u,u,'atk',.25,2);fl(u,'PIÉTÉ FILIALE','buf')}}},
 robin:{},
 tesla:{after:(a,t,d,o)=>{if((B.skill||B.ult)&&!o.rep&&!o.x&&!o.rip&&Math.random()<.3){const e=pick(real().filter(x=>x!=t));if(e)deal(a,e,.4,8,{rep:1,x:1,el:'foudre'})}}},
 suntzu:{start:()=>B.E.forEach(e=>{e.bf.def={v:Math.min(bfv(e,'def'),-.1),t:3}})},
 gilgamesh:{st:s=>{s.hp*=1.1},out:(a,t,m)=>t.kind=='boss'?m*1.1:m},
 alexandre:{start:(u,A)=>A.forEach(a=>{a.atk*=1.08})},
 arthur:{turn:u=>{if(noGelL()&&u.hp<u.mhp)heal(u,u.mhp*.04,null,1)}},
 merlin:{start:u=>{u.en=Math.min(100,u.en+20)},out:(a,t,m)=>B.skill&&!B.ult?m*1.15:m},
 achille:{st:s=>{s.crit+=.08}},
 hercule:{after:(a,t,d,o)=>{if(t.alive&&!o.pet&&Math.random()<.25)addDot(t,a,.2,3,'psn')}},
 wukong:{out:(a,t,m)=>m*(1+Math.min(.3,.06*Math.max(0,(a.turnsN||1)-1)))},
 siegfried:{inc:(t,d)=>d*.85},
 zeus:{after:(a,t,d,o)=>{if(!o.rep&&!o.x&&!o.rip&&!o.pet&&Math.random()<.2){const e=pick(real().filter(x=>x!=t));if(e){fl(e,'ÉCLAIR','brk');deal(a,e,.5,8,{rep:1,x:1,el:'foudre'})}}}},
 odin:{},
 thor:{},
 amaterasu:{},
 anubis:{after:(a,t,d,o)=>{if(t.alive&&t.hp<t.mhp*.15&&!['boss','mini','obj'].includes(t.kind)){hurt(t,t.hp+1,{});fl(t,'PESÉ','brk')}}},
 quetzal:{turn:()=>allies().forEach(a=>gainEn(a,10))},
 jeanne:{start:(u,A)=>{A.forEach(a=>{a.def*=1.08});B.sp=clamp(B.sp+1,0,5)}}};
const noGelL=()=>!B||B.law!='gel';
const legFx=(c,k)=>{const r=[],a=c&&c.leg&&LFX[c.leg],b=c&&c.leg&&legHas(c)&&LIX[c.leg];if(a&&a[k])r.push(a[k]);if(b&&b[k])r.push(b[k]);return r};
{const _st=stats;stats=function(c){const s=_st(c);if(!legOf(c))return s;legFx(c,'st').forEach(f=>f(s,c));const e=1+.03*Math.min(5,c.legE||0);s.hp*=e;s.atk*=e;s.def*=e;
 s.hp=Math.round(s.hp);s.atk=Math.round(s.atk);s.def=Math.round(s.def);s.spd=Math.round(s.spd);s.crit=Math.min(.75,s.crit);return s}}
{const _gn=gain;gain=function(c,x,raw){if(!raw&&c&&c.leg=='vinci')x*=1.15;return _gn.call(this,c,x,raw)}}
{const _bs=battleStart;battleStart=function(){const r=_bs.apply(this,arguments);try{B.A.forEach(u=>legFx(u.c,'start').forEach(f=>f(u,B.A)))}catch(e){console.warn('légendes',e)}return r}}
{const _ts=turnStart;turnStart=function(u){const r=_ts.apply(this,arguments);try{if(u&&u.ally&&u.alive){legFx(u.c,'turn').forEach(f=>f(u));const am=legAl('amaterasu');if(am&&noGelL()&&u.hp<u.mhp)heal(u,u.mhp*.04,null,1)}}catch(e){console.warn('légendes',e)}return r}}
{const _dl=deal;deal=function(a,t,mult,tb,o){o=o||{};try{
  if(a&&!a.ally&&t&&t.ally&&t.alive&&!o.rip&&legU(t,'wukong')&&Math.random()<.15){fl(t,'LEURRE !','buf');return 0}
  if(a&&a.ally&&a.c&&a.c.leg&&t&&t.alive){legFx(a.c,'out').forEach(f=>{mult=f(a,t,mult,o)});if(a.c.leg=='alexandre'&&tb)tb*=1.5;if(legUI(a,'odin')){o=Object.assign({},o,{sure:1,ign:Math.max(o.ign||0,.2)})}}}catch(e){console.warn('légendes',e)}
 const d=_dl.call(this,a,t,mult,tb,o);
 try{if(a&&a.ally&&a.alive&&a.c&&a.c.leg&&t&&d>0)legFx(a.c,'after').forEach(f=>f(a,t,d,o));
  if(a&&!a.ally&&t&&t.ally&&t.alive&&a.alive&&!o.rip&&d>0&&legUI(t,'vercingetorix'))hurt(a,d*.15,{})}catch(e){console.warn('légendes',e)}return d}}
{const _ht=hurt;hurt=function(t,d,o){try{if(t&&t.ally&&t.c&&B){legFx(t.c,'inc').forEach(f=>{d=f(t,d)});if(legAl('anubis'))d*=.92}}catch(e){console.warn('légendes',e)}
 const r=_ht.call(this,t,d,o);
 try{if(t&&t.ally&&t.alive&&t.hp<t.mhp*.3&&B){if(legU(t,'siegfried')&&!t.lgT){t.lgT=1;addSh(t,t.mhp*.3,t);fl(t,'TILLEUL','brk')}const j=legAl('jeanne');if(j&&!t.lgV){t.lgV=1;addSh(t,t.mhp*.2,j);fl(t,'LES VOIX','buf')}}}catch(e){console.warn('légendes',e)}return r}}
{const _hl=heal;heal=function(a,v,by,raw){if(by&&by.c&&legHas(by.c)){if(by.c.leg=='cleopatre')v*=1.15;if(by.c.leg=='amaterasu')v*=1.25}return _hl.call(this,a,v,by,raw)}}
{const _as=addSh;addSh=function(a,v,by){if(by&&by.c&&legHas(by.c)){if(by.c.leg=='cleopatre')v*=1.15;if(by.c.leg=='amaterasu')v*=1.25}return _as.call(this,a,v,by)}}
{const _ok=onKill;onKill=function(a,t){const r=_ok.apply(this,arguments);try{if(legU(a,'gilgamesh')&&(a.gk||0)<3){a.gk=(a.gk||0)+1;a.atk*=1.08;fl(a,'ROI D’URUK','buf')}}catch(_){}return r}}
{const _lp=lootPassives;lootPassives=function(o){const r=_lp.apply(this,arguments);try{if(B.A.some(u=>u.alive&&legUI(u,'robin')))o.gold=Math.round(o.gold*1.15)}catch(_){}return r}}
/* ---------- ultimes de signature (ULTS, js/combat.js) : run(u,s,M), M ×1,1 par étoile au-delà de 4 ---------- */
const hitT=async(u,t,m,tb,o)=>{if(t&&t.alive)await hitAnim(u,t,()=>deal(u,t,m,tb,o),ROLES[u.c.role].rg)};
Object.assign(ULTS,{
 lg_napoleon:async(u,s,M)=>{const m=legTM(u,M);await cast(u,'#ffcf4a');allies().forEach(a=>{bfT(u,a,'atk',.3,2);fl(a,'ATQ +30 %','buf')});setSP(2);await wave(u,ELEMS.feu.c);foes().forEach(e=>deal(u,e,1.2*m,10));await sleep(220)},
 lg_vinci:async(u,s,M)=>{const m=legTM(u,M);await aoeS(u,2*m,20);foes().forEach(e=>{if(e.alive&&e.kind!='obj'&&!e.weak.includes(u.elem)){e.weak.push(u.elem);fl(e,'FAIBLESSE !','brk')}});drawTI()},
 lg_musashi:async(u,s,M)=>{const m=legTM(u,M),t=tgt();if(!t)return;await hitAnim(u,t,()=>{},0);for(let i=0;i<6&&t.alive;i++){deal(u,t,.6*m,8,{crit:t.broken?1:undefined});if(i%2)await sleep(70)}},
 lg_cleopatre:async(u,s,M)=>{const m=legTM(u,M);await cast(u,'#6fdc6f');allies().forEach(a=>heal(a,a.mhp*.25,u));foes().forEach(e=>{addDot(e,u,.3*m,3,'psn')});await sleep(260)},
 lg_hannibal:async(u,s,M)=>{const m=legTM(u,M);await aoeS(u,1.8*m,15);foes().forEach(e=>pushT(e,.3));drawTL()},
 lg_vercingetorix:async(u,s,M)=>{await cast(u,'#bfe8ff');u.taunt=2;u.bf.def={v:Math.max(.5,bfv(u,'def')),t:2};allies().forEach(a=>addSh(a,a.mhp*.2,u));fl(u,'DERNIER CARRÉ','buf');await sleep(240)},
 lg_mulan:async(u,s,M)=>{const m=legTM(u,M);await aoeS(u,1.6*m,15);allies().forEach(a=>addSh(a,a.mhp*.12,u))},
 lg_robin:async(u,s,M)=>{const m=legTM(u,M),t=tgt();if(t)await hitAnim(u,t,()=>deal(u,t,5*m,30,{ign:.5,crit:1,sure:1}),1);setSP(1)},
 lg_tesla:async(u,s,M)=>{const m=legTM(u,M);await cast(u,'#c58bff');for(let i=0;i<5;i++){const e=pick(real());if(!e)break;await hitAnim(u,e,()=>deal(u,e,.9*m,15),1)}},
 lg_suntzu:async(u,s,M)=>{await cast(u,'#ffcf4a');foes().forEach(e=>pushT(e,.3));setSP(2);allies().forEach(a=>{bfT(u,a,'atk',.2,2);fl(a,'ATQ +20 %','buf')});drawTL();await sleep(220)},
 lg_gilgamesh:async(u,s,M)=>{const m=legTM(u,M),t=tgt();if(!t)return;await hitAnim(u,t,()=>{const f=foes(),i=f.indexOf(t);deal(u,t,4*m,30);[f[i-1],f[i+1]].forEach(e=>e&&deal(u,e,1.5*m,10))});if(!t.alive){gainEn(u,50);fl(u,'+50 ÉNERGIE','buf')}},
 lg_alexandre:async(u,s,M)=>{const m=legTM(u,M);await cast(u,'#ff6b3d');allies().forEach(a=>{bfT(u,a,'atk',.4,2);if(a!=u)advT(a,.5);fl(a,'PHALANGE','buf')});await wave(u,ELEMS.feu.c);foes().forEach(e=>deal(u,e,1.4*m,15));drawTL();await sleep(200)},
 lg_arthur:async(u,s,M)=>{const m=legTM(u,M);await hitT(u,tgt(),3.8*m,30);allies().forEach(a=>addSh(a,a.mhp*.15,u))},
 lg_merlin:async(u,s,M)=>{const m=legTM(u,M);await aoeS(u,2.2*m,20);foes().forEach(e=>{if(!e.alive||e.kind=='boss'||e.kind=='mini'||e.skipImm)return;e.skip=1;fl(e,'TEMPS FIGÉ','deb')})},
 lg_achille:async(u,s,M)=>{const m=legTM(u,M);let re=0;for(let i=0;i<5;i++){const t=real().slice().sort((a,b)=>a.hp-b.hp)[0];if(!t)break;await hitAnim(u,t,()=>deal(u,t,1.1*m,10));if(!t.alive&&!re){re=1;if(B.cur==u)u.extra=1;else u.av=0}}},
 lg_hercule:async(u,s,M)=>{const m=legTM(u,M);await aoeS(u,1.8*m,15);foes().forEach(e=>addDot(e,u,.35*m,3,'psn'))},
 lg_wukong:async(u,s,M)=>{const m=legTM(u,M);for(let i=0;i<6;i++){const e=pick(real());if(!e)break;await hitAnim(u,e,()=>deal(u,e,.9*m,8,{crit:u.crit+.2}))}},
 lg_siegfried:async(u,s,M)=>{const m=legTM(u,M);u.taunt=2;await hitT(u,tgt(),3*m,30,{el:'feu'});allies().forEach(a=>{a.bf.dr={v:Math.max(.25,bfv(a,'dr')),t:2}});fl(u,'SANG DE FAFNIR','buf')},
 lg_zeus:async(u,s,M)=>{const m=legTM(u,M);await cast(u,'#fff3a0');for(let i=0;i<4;i++){foes().forEach(e=>deal(u,e,.9*m,8));await wave(u,'#fff3a0');await sleep(90)}},
 lg_odin:async(u,s,M)=>{const m=legTM(u,M);await hitT(u,tgt(),5*m,40,{sure:1});await wave(u,ELEMS.arcane.c);foes().forEach(e=>deal(u,e,1.5*m,10,{sure:1}))},
 lg_thor:async(u,s,M)=>{const m=legTM(u,M);await hitT(u,tgt(),3.5*m,45);await wave(u,'#7ad9ff');foes().forEach(e=>deal(u,e,1.7*m,25));if(legHas(u.c)){gainEn(u,30);fl(u,'MJÖLLNIR REVIENT','buf')}},
 lg_amaterasu:async(u,s,M)=>{await cast(u,'#ffe27a');if(!B.lgAma){const a=B.A.find(x=>!x.alive);if(a){B.lgAma=1;a.alive=true;a.hp=Math.round(a.mhp*.3);a.av=1e4/a.spd;fl(a,'RELEVÉ !','brk')}}allies().forEach(a=>{heal(a,a.mhp*.5,u);purge(a)});drawTL();await sleep(260)},
 lg_anubis:async(u,s,M)=>{const m=legTM(u,M);await cast(u,'#8a7bd8');u.taunt=2;foes().forEach(e=>{if(e.kind!='obj')hurt(e,e.mhp*(e.kind=='boss'||e.kind=='mini'?.04:.12),{})});await wave(u,ELEMS.ombre.c);foes().forEach(e=>deal(u,e,1.5*m,15))},
 lg_quetzal:async(u,s,M)=>{await cast(u,'#2fb08a');allies().forEach(a=>{bfT(u,a,'atk',.35,2);gainEn(a,30);heal(a,a.mhp*.15,u);fl(a,'AUBE','buf')});await sleep(240)},
 lg_jeanne:async(u,s,M)=>{const m=legTM(u,M);await hitT(u,tgt(),3*m,30);allies().forEach(a=>{bfT(u,a,'atk',.25,2);addSh(a,a.mhp*.15,u);purge(a);fl(a,'ORLÉANS','buf')})}});
/* ---------- objets uniques : nom, texte, liaison ---------- */
{const _in=iName;iName=function(it){const T=it&&ITYPES[it.t];return T&&T.leg?T.n:_in.apply(this,arguments)}}
{const _it=iTxt;iTxt=function(it){const T=it&&ITYPES[it.t],s=_it.apply(this,arguments);return T&&T.leg?s+` · <b class="g">✦ ${LEG[T.leg].it.d}</b> · objet unique lié à ${LEG[T.leg].n}`:s}}
const legBound=(c,k)=>c&&c.eq&&c.eq[k]&&ITYPES[c.eq[k].t]&&ITYPES[c.eq[k].t].leg;
{const _eq=equip;equip=function(cid,iid){const c=G.chars.find(x=>x.id==cid),it=G.items.find(x=>x.id==iid);if(c&&it&&legBound(c,ITYPES[it.t].s))return toast(`${iName(c.eq[ITYPES[it.t].s])} est lié à ${c.name} : impossible de le retirer.`);return _eq.apply(this,arguments)}}
{const _uq=unequip;unequip=function(cid,k){const c=G.chars.find(x=>x.id==cid);if(legBound(c,k))return toast(`${iName(c.eq[k])} est lié à ${c.name} : impossible de le retirer.`);return _uq.apply(this,arguments)}}
{const _rv=renvoyer;renvoyer=function(){const r=_rv.apply(this,arguments);legPurge();return r}}
/* ---------- apparence : couleurs de tenue (pal) et traits de signature (ft) redessinables ---------- */
{const _cp=charPal;charPal=function(c,L){const p=_cp.apply(this,arguments),D=legOf(c);if(D&&D.pal)for(const i in D.pal)p[i]=D.pal[i];return p}}
/* FEAT[trait] = {z: 'back' (derrière le corps) | 'front' (devant), d(g, o, a, b, K)} — grille 30×28 de drawChar, o = décalage vertical (respiration).
   a, b = couleurs du trait ; K = couleurs communes (or, sombre, blanc, peau, cheveux, bois). Pour changer de style graphique, il suffit de redessiner ces fonctions. */
const mirrorX=(g,x,y,w,id,tn)=>{g.r(x,y,w,1,id,tn);g.r(30-x-w,y,w,1,id,tn)};
const FEAT={
 bicorne:{z:'front',d:(g,o,a,b,K)=>{g.row(5+o,4,25,a,3);g.row(4+o,5,24,a,2);g.row(3+o,7,22,a,2);g.row(2+o,9,20,a,2);g.row(1+o,10,19,a,1);g.row(0+o,12,17,a,1);g.row(5+o,6,23,b,2);g.p(4,4+o,a,3);g.p(25,4+o,a,3);g.e(14.5,2.5+o,1.4,1.4,K.white,1);g.p(14,2+o,b,2)}},
 epaulettes:{z:'front',d:(g,o,a)=>{g.r(6,15+o,3,2,a,1);g.r(21,15+o,3,2,a,1);[6,8,21,23].forEach(x=>g.p(x,17+o,a,3))}},
 beret:{z:'front',d:(g,o,a)=>{g.row(2+o,9,20,a,1);g.row(3+o,8,22,a,2);g.row(4+o,8,21,a,3);g.p(14,1+o,a,1)}},
 barbe_longue:{z:'front',d:(g,o,a)=>{[[12,10,19],[13,10,19],[14,11,18],[15,11,18],[16,12,17],[17,12,17],[18,13,16],[19,14,15]].forEach(([y,x0,x1])=>g.row(y+o,x0,x1,a,0));g.row(13+o,13,16,a,3)}},
 barbe_tressee:{z:'front',d:(g,o,a)=>{for(let y=13;y<=19;y++){const x0=y<15?10:11,x1=y<14?19:18;for(let x=x0;x<=x1;x++)g.p(x,y+o,a,y>13&&x%2?3:2)}g.row(13+o,13,16,a,3)}},
 moustache:{z:'front',d:(g,o,a)=>{g.row(12+o,12,17,a,2);g.p(11,13+o,a,2);g.p(18,13+o,a,2);g.p(11,14+o,a,3);g.p(18,14+o,a,3)}},
 chignon:{z:'front',d:(g,o,a)=>{g.e(14.5,1.5+o,2,1.6,a,0);g.row(3+o,13,16,a,3)}},
 bandeau:{z:'front',d:(g,o,a)=>{g.row(5+o,8,21,a,2);g.p(22,5+o,a,2);g.p(23,6+o,a,3);g.p(22,7+o,a,3)}},
 nemes:{z:'front',d:(g,o,a,b)=>{for(let y=2;y<=7;y++){const x0=y<3?10:y<4?9:8,x1=29-x0;g.row(y+o,x0,x1,y%2?a:b,y==2?1:2)}for(let y=8;y<=17;y++){g.r(7,y+o,2,1,y%2?a:b,2);g.r(21,y+o,2,1,y%2?a:b,2)}g.row(7+o,9,20,b,2);g.p(14,5+o,b,1);g.p(15,6+o,b,1)}},
 usekh:{z:'front',d:(g,o,a,b)=>{g.row(15+o,10,19,a,1);g.row(16+o,9,20,b,2);g.row(17+o,10,19,a,3)}},
 casque:{z:'front',d:(g,o,a,b)=>{g.row(2+o,10,19,a,1);g.row(3+o,9,20,a,1);for(let y=4;y<=7;y++)g.row(y+o,8,21,a,y>6?3:2);g.r(14,8+o,2,3,a,2);g.r(8,8+o,2,5,a,2);g.r(20,8+o,2,5,a,2);g.row(1+o,9,20,b,2);g.row(0+o,11,18,b,1);g.p(21,1+o,b,2);g.p(22,2+o,b,3)}},
 casque_aile:{z:'front',d:(g,o,a,b)=>{g.row(2+o,11,18,a,1);g.row(3+o,10,19,a,1);for(let y=4;y<=6;y++)g.row(y+o,9,20,a,2);g.row(7+o,8,21,a,3);mirrorX(g,6,4+o,3,b,2);mirrorX(g,5,3+o,3,b,1);mirrorX(g,4,2+o,3,b,1);mirrorX(g,3,1+o,2,b,1)}},
 chapeau_robin:{z:'front',d:(g,o,a,b)=>{g.row(5+o,8,21,a,3);g.row(4+o,9,20,a,2);g.row(3+o,10,20,a,2);g.row(2+o,12,21,a,1);g.row(1+o,15,23,a,1);g.p(24,1+o,a,2);[[9,3],[8,2],[7,1],[6,0]].forEach(([x,y],i)=>g.p(x,y+o,b,i?1:2))}},
 eclairs:{z:'front',d:(g,o,a,b)=>{[[3,6],[4,7],[3,8],[26,9],[25,10],[26,11],[2,18],[3,19],[27,20],[26,21],[24,2],[5,24]].forEach(([x,y],i)=>g.p(x,y+o,i%3==1?b:a,1))}},
 guan:{z:'front',d:(g,o,a,K)=>{g.r(12,0+o,6,3,a,2);g.row(2+o,10,19,a,3)}},
 couronne:{z:'front',d:(g,o,a,b)=>{g.row(4+o,9,20,a,3);g.row(3+o,9,20,a,2);[9,14,19].forEach(x=>g.r(x,1+o,2,2,a,1));g.p(14,3+o,b,1);g.p(15,3+o,b,1);g.p(11,3+o,b,2);g.p(18,3+o,b,2)}},
 chapeau_pointu:{z:'front',d:(g,o,a,b)=>{g.row(6+o,6,23,a,3);[[5,9,20],[4,10,19],[3,11,18],[2,12,17],[1,13,17],[0,15,18]].forEach(([y,x0,x1])=>g.row(y+o,x0,x1,a,y<2?1:2));[[12,4],[17,3],[15,5],[16,1]].forEach(([x,y])=>g.p(x,y+o,b,1))}},
 peau_lion:{z:'front',d:(g,o,a,b,K)=>{for(let y=6;y<=15;y++){g.r(6,y+o,2,1,b,y>13?3:2);g.r(22,y+o,2,1,b,y>13?3:2)}g.e(14.5,3.5+o,7.5,3.6,a,0);g.e(8.5,1+o,1.5,1.5,a,0);g.e(20.5,1+o,1.5,1.5,a,0);g.p(12,3+o,K.dark,2);g.p(17,3+o,K.dark,2);g.r(14,4+o,2,1,b,3);[11,13,16,18].forEach(x=>g.p(x,7+o,K.white,1));g.r(11,15+o,3,2,a,2);g.r(16,15+o,3,2,a,2)}},
 cerclet:{z:'front',d:(g,o,a)=>{g.row(5+o,8,21,a,1);g.p(14,4+o,a,1);g.p(15,4+o,a,1)}},
 queue:{z:'back',d:(g,o,a)=>{[[22,22],[23,22],[24,21],[25,20],[26,19],[26,18],[26,17],[25,16],[24,16]].forEach(([x,y])=>g.p(x,y+o,a,2))}},
 diademe:{z:'front',d:(g,o,a,b)=>{g.row(5+o,9,20,a,1);g.p(14,4+o,b,1);g.p(15,4+o,b,1)}},
 laurier:{z:'front',d:(g,o,a)=>{[[8,7],[8,6],[9,5],[10,4],[11,3],[7,6],[9,4],[12,3]].forEach(([x,y],i)=>{g.p(x,y+o,a,i%2?1:3);g.p(29-x,y+o,a,i%2?1:3)})}},
 cache_oeil:{z:'front',d:(g,o,a)=>{g.r(17,9+o,2,3,a,2);[[16,8],[15,7],[19,8],[20,7],[21,7]].forEach(([x,y])=>g.p(x,y+o,a,3))}},
 chapeau_large:{z:'front',d:(g,o,a)=>{g.row(5+o,4,25,a,3);g.row(4+o,6,23,a,2);g.row(3+o,10,19,a,2);g.row(2+o,10,19,a,1);g.row(1+o,11,18,a,1)}},
 corbeaux:{z:'front',d:(g,o,a,b,K)=>{g.r(4,14+o,3,1,a,2);g.p(5,13+o,a,1);g.p(3,14+o,K.gold,2);g.r(23,14+o,3,1,a,2);g.p(24,13+o,a,1);g.p(26,14+o,K.gold,2)}},
 halo:{z:'back',d:(g,o,a,b)=>{for(let y=-3;y<=20;y++)for(let x=2;x<=27;x++){const d=Math.hypot(x-14.5,y-8);if(d>=8.6&&d<10.2)g.p(x,y+o,a,d>9.6?3:1);else if(d>=11.2&&d<12.2&&(Math.round(Math.atan2(y-8,x-14.5)*8/Math.PI)%2==0))g.p(x,y+o,b,1)}}},
 peigne:{z:'front',d:(g,o,a)=>{g.p(20,4+o,a,1);g.p(21,3+o,a,1);g.p(22,2+o,a,2);g.p(21,2+o,a,3)}},
 tete_chacal:{z:'front',d:(g,o,a,b,K)=>{g.e(14.5,8+o,6,6.4,a,0);[[10,0],[10,1],[11,1],[9,2],[10,2],[11,2],[9,3],[10,3],[11,3],[12,3]].forEach(([x,y])=>{g.p(x,y+o,a,y<2?1:2);g.p(29-x,y+o,a,y<2?1:2)});g.p(10,2+o,b,2);g.p(19,2+o,b,2);
  for(let y=10;y<=13;y++)g.row(y+o,13,16,a,1);g.r(14,13+o,2,1,K.dark,2);g.p(11,8+o,b,1);g.p(12,8+o,b,2);g.p(17,8+o,b,2);g.p(18,8+o,b,1);for(let y=9;y<=15;y++){g.p(8,y+o,y%2?b:a,2);g.p(21,y+o,y%2?b:a,2)}}},
 plumes:{z:'front',d:(g,o,a,b,K)=>{[3,4,5,6,6,5,4,3].forEach((h,i)=>{const x=8+i*2;for(let y=4-h;y<=3;y++){g.p(x,y+o,i%2?b:a,y<1?1:2);g.p(x+1,y+o,i%2?b:a,3)}});g.row(4+o,8,21,K.gold,2)}},
 ailes:{z:'back',d:(g,o,a)=>{[[3,11,3],[2,12,5],[2,13,6],[2,14,7],[3,15,6],[3,16,6],[4,17,5],[5,18,4],[6,19,3],[7,20,2]].forEach(([x,y,w],i)=>mirrorX(g,x,y+o,w,a,i<2?1:i>7?3:2))}},
 etendard:{z:'back',d:(g,o,a,b,K)=>{for(let y=0;y<=26;y++)g.p(4,y+o,K.wood,y%3?2:3);g.p(4,0+o,b,1);g.r(5,1+o,7,7,a,0);g.p(11,8+o,a,3);g.p(9,8+o,a,3);g.p(8,3+o,b,1);g.p(7,4+o,b,2);g.p(8,4+o,b,1);g.p(9,4+o,b,2);g.p(8,5+o,b,3)}},
 lys:{z:'front',d:(g,o,a)=>{g.p(14,17+o,a,1);g.p(15,17+o,a,1);g.p(13,18+o,a,2);g.p(16,18+o,a,2);g.r(14,18+o,2,2,a,2)}}};
{const _dc=drawChar;drawChar=function(c,fr){const base=_dc.apply(this,arguments),D=legOf(c);if(!D||!D.ft||!D.ft.length)return base;
 const L=c.look||{},o=fr.b||0,pal=[null],ix=h=>{let i=pal.indexOf(h);if(i<0){pal.push(h);i=pal.length-1}return i};
 const K={gold:ix('#e0b040'),dark:ix('#241a30'),white:ix('#ffffff'),skin:ix(L.skin||'#ffd9bd'),hair:ix(L.hair||'#2a2536'),wood:ix('#8a5a34')};
 const gb=SG(30,28),gf=SG(30,28);let nb=0,nf=0;
 D.ft.forEach(([k,a,b])=>{const f=FEAT[k];if(!f)return;if(f.z=='back')nb++;else nf++;f.d(f.z=='back'?gb:gf,o,a?ix(a):K.gold,b?ix(b):K.gold,K)});
 const out=mkc(base.width,base.height),x=out.getContext('2d');if(nb)x.drawImage(bake(gb,pal),0,0);x.drawImage(base,0,0);if(nf)x.drawImage(bake(gf,pal),0,0);return out}}
/* icônes des objets uniques : forme + deux couleurs (LEG[id].it.ic), grille 16×16 */
const LICO={
 bicorne:(g,L)=>{g.row(10,1,14,1,3);g.row(9,2,13,1,2);g.row(8,3,12,1,2);g.row(7,4,11,1,1);g.row(6,6,9,1,1);g.row(10,2,13,2,2);g.p(8,7,4,1);g.p(7,7,2,1)},
 livre:(g,L)=>{g.r(3,3,10,11,1,0);g.r(5,4,7,9,2,2);g.r(3,3,2,11,1,3);g.row(6,6,10,6,3);g.row(8,6,10,6,3);g.row(10,6,9,6,3);g.p(10,5,3,1)},
 sabre2:(g,L)=>{L(2,13,12,3,1,1);L(3,13,13,3,1,3);L(13,13,3,3,1,1);g.r(1,13,3,2,2,2);g.r(12,13,3,2,2,2)},
 uraeus:(g,L)=>{L(8,6,8,15,1,2);g.e(8,4,3,2.5,2,0);g.e(8,3,1.5,1.5,1,1);g.p(8,2,4,1);g.row(15,6,10,1,3)},
 falcata:(g,L)=>{L(5,11,11,3,1,1);L(6,11,12,4,1,3);g.p(12,2,1,1);g.p(13,3,1,3);L(2,14,5,11,2,2);g.p(4,10,3,2)},
 bouclier:(g,L)=>{g.e(8,8,6.5,6.5,1,0);g.e(8,8,2,2,2,1);L(8,2,8,14,2,3);L(2,8,14,8,2,3)},
 epee:(g,L)=>{L(5,10,13,2,1,1);L(6,10,13,3,1,3);L(3,8,7,12,2,2);L(2,13,4,11,5,2);g.p(1,14,2,2)},
 arc:(g,L)=>{for(let y=1;y<=14;y++){const x=4+Math.round(3.5*Math.sin((y-1)/13*Math.PI));g.p(x,y,1,y%3?2:3)}L(4,1,4,14,4,2);g.r(7,7,1,2,2,2);g.p(3,1,2,1);g.p(3,14,2,1)},
 bobine:(g,L)=>{g.r(4,12,8,3,6,2);for(let y=5;y<=11;y++)g.row(y,6,9,1,y%2?1:3);g.e(8,3,3,2.2,2,0);g.p(3,2,7,1);g.p(13,3,7,1);g.p(12,1,7,1)},
 rouleau:(g,L)=>{g.r(4,4,8,8,1,0);g.r(2,3,2,10,2,2);g.r(12,3,2,10,2,2);g.row(6,5,10,6,3);g.row(8,5,10,6,3);g.row(10,5,9,6,3)},
 etendard:(g,L)=>{L(3,1,3,15,5,2);g.p(3,0,3,1);g.r(4,2,9,6,1,0);g.p(12,8,1,3);g.p(10,8,1,3);g.p(8,3,2,1);g.p(7,4,2,2);g.p(8,4,2,1);g.p(9,4,2,2);g.p(8,5,2,3)},
 baton:(g,L)=>{L(3,15,11,5,5,2);g.e(12,3,2.5,2.5,2,0);g.p(12,3,7,1);g.p(14,6,7,1);g.p(9,1,7,1)},
 lance:(g,L)=>{L(2,14,11,5,1,2);g.p(12,4,2,1);g.p(13,3,2,1);g.p(14,2,2,1);g.p(12,3,2,2);g.p(13,4,2,3);g.r(10,6,2,1,3,2)},
 bang:(g,L)=>{L(3,13,13,3,1,2);L(3,12,12,3,1,1);g.r(1,12,3,3,2,1);g.r(12,1,3,3,2,1)},
 foudre:(g,L)=>{L(10,1,6,7,1,1);L(11,1,7,7,1,2);L(6,7,11,8,1,1);L(11,8,6,15,1,1);L(10,9,5,15,2,2)},
 marteau:(g,L)=>{g.r(3,2,10,5,1,0);g.row(4,3,12,1,3);L(8,7,8,15,2,2);g.p(8,4,3,1);g.p(8,15,3,2)},
 miroir:(g,L)=>{g.e(8,8,6,6,1,0);g.e(8,8,4.2,4.2,2,1);g.p(6,6,4,1);g.p(7,5,4,1);[[8,0],[0,8],[15,8],[8,15]].forEach(([x,y])=>g.p(x,y,7,1))},
 balance:(g,L)=>{L(8,3,8,14,1,2);g.row(3,2,13,1,2);L(2,4,2,8,1,3);L(13,4,13,8,1,3);g.row(9,0,4,1,2);g.row(9,11,15,1,2);g.row(14,5,11,1,3);g.p(2,8,5,1);g.p(13,7,4,1);g.p(13,6,4,1);g.p(8,2,2,1)},
 plume:(g,L)=>{for(let t=0;t<=10;t++){const x=Math.round(4+t*.8),y=Math.round(14-t*1.2);g.r(x-1,y-1,3,2,1,t%2?1:2)}L(4,15,12,2,2,2)}};
{const _is=itemSprite;itemSprite=function(t,el){const T=ITYPES[t];if(!T||!T.leg)return _is.apply(this,arguments);const k='lg'+t;if(IS[k])return IS[k];
 const ic=LEG[T.leg].it.ic,g=SG(16,16),pal=[null,ic[1],ic[2],'#e0b040','#ffffff','#8a5a34','#1d1a2a','#fff3a0'],ln=(x0,y0,x1,y1,id,tn)=>{const n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0))||1;for(let i=0;i<=n;i++)g.p(Math.round(lerp(x0,x1,i/n)),Math.round(lerp(y0,y1,i/n)),id,tn)};
 (LICO[ic[0]]||LICO.epee)(g,ln);g.p(14,1,7,1);g.p(15,0,7,2);return IS[k]=bake(g,pal)}}
/* ---------- fiche : bloc « Légende » ---------- */
function legPrev(id){const D=LEG[id];return{id:'lg_'+id,name:D.n,st:D.st,race:D.race,role:D.it.role||ROLE_W&&Object.keys(ROLE_W).find(r=>ROLE_W[r]==(D.wpn||'epee'))||'guerrier',elem:D.elem,look:Object.assign({hue:0,body:0},D.look),leg:id,lv:1,seed:1}}
function legBlock(c){const D=legOf(c);if(!D)return'';const it=SLK.map(k=>c.eq[k]).find(x=>x&&ITYPES[x.t].leg==c.leg);
 return`<div class="lgb"><div><b class="lgn">✦ Légende</b> · <i>${D.t}</i> · <span class="m">${D.w}</span>${c.legE?` · <span class="trk">écho ${c.legE}/5</span>`:''}<div class="m"><img class="lgp" src="${typeof persIco=='function'?persIco(c.pers):pIco('sk_ame_'+(PKEY[c.pers]||'x'),'#ffd75a',c.pers)}" alt=""> Personnalité fixe : <b>${c.pers}</b> (${(c.subs||[]).join(', ')})</div></div><p class="m">${D.bio}</p><p class="lgq">« ${D.q} »</p>
 <div class="m"><b class="g">Passive · ${D.sp[0]}</b> : ${D.sp[1]}</div><div class="m"><b class="g">Ultime · ${D.ul[0]}</b> : ${D.ul[1]} <span class="tg">dès le niveau 1</span></div>
 <div class="lgi"><img src="${it?itemSrc(it):scaleC(itemSprite('lg_'+c.leg),3).toDataURL()}" alt=""><div><b>${D.it.n}</b> ${lgSt(it?it.st:D.st)} <span class="tg">unique · lié</span><div class="m">${D.it.d}${it?'':' <b class="w">(absent)</b>'}</div></div></div></div>`}
{const _sh=sheetHead;sheetHead=function(c){return _sh.apply(this,arguments)+legBlock(c)}}
/* ---------- codex : Légendes et Chroniques ---------- */
const LCS={},lgSt=n=>`<span class="lgs">${'★'.repeat(n)}</span>`;
function legSil(id){if(LCS[id])return LCS[id];const s=cs(legPrev(id));return LCS[id]=scaleC(glowC(tintC(s.idle[0],'#2a2438')),3).toDataURL()}
function legCodexHTML(){const ks=LEGK,n=ks.filter(k=>G.legd[k]).length;let h=`<h3 class="sh">✦ Légendes (${n}/${ks.length})</h3><p class="m">Figures de l’histoire et des mythes appelées par la Tour. Chacune est unique et porte un objet qu’on ne trouve nulle part ailleurs. Invocation : une partie des résultats 4★ (${LEG_RATE[4]*100} %), 5★ (${LEG_RATE[5]*100} %) et 6★ (${LEG_RATE[6]*100} %) devient une légende. Un doublon donne un écho à la légende déjà présente.</p><div class="lgg">`;
 [4,5,6].forEach(st=>{ks.filter(k=>LEG[k].st==st).forEach(k=>{const D=LEG[k],on=G.legd[k],own=legOwner(k);h+=`<div class="lgc${on?'':' lk'}" title="${on?D.bio.replace(/"/g,'&quot;'):'Légende non découverte'}"><img src="${on?cs(own||legPrev(k)).url:legSil(k)}" alt=""><b>${on?D.n:'???'}</b>${lgSt(st)}<span class="m">${on?D.it.n:D.w}</span>${on&&!own?'<span class="m w">absente du village</span>':''}</div>`})});
 h+='</div>';const lo=G.lore||[];h+=`<h3 class="sh">Chroniques (${lo.length}/${LORE.length})</h3><p class="m">Fragments trouvés sur les gardiens tous les dix étages. Ils racontent ce que la Tour ne dit pas.</p>`+(lo.length?lo.slice().sort((a,b)=>a-b).map(i=>`<div class="lgf"><b>${LORE[i][0]}</b><p class="m"><i>${LORE[i][1]}</i></p></div>`).join(''):'<p class="m">Aucun fragment pour l’instant. Battez le gardien de l’étage 10.</p>');return h}
{const _oc=openCodex;openCodex=function(){const r=_oc.apply(this,arguments);const f=PF;if(f){PF=()=>{const o=f();return[o[0],o[1]+legCodexHTML()]};rp()}return r}}
/* ---------- Chroniques : un fragment par gardien d'étage (10, 20, 30…), texte provisoire (docs/lore.md, à définir avec le créateur) ---------- */
const LORE=[
 ['I · La notice','« Dungeon Setlers — aucune notice, aucun studio, aucun nom au générique. » Quelqu’un a pourtant gravé au dos de la cartouche : « Pour celui qui lira jusqu’au bout. »'],
 ['II · Le seuil','Les gardiens ne sont pas nés monstres. Sous l’armure du premier, une plaque : « Appelé n° 0001 — étage atteint : 10 ».'],
 ['III · Les Appelés','La Tour ne prend que ceux dont l’histoire s’arrête : un bûcher, un exil, un serpent qui vole une herbe. Elle les prend à la dernière seconde, et garde le reste.'],
 ['IV · L’Archive','Quelque part au-dessus, une bibliothèque contient chaque récit jamais raconté. Les invocations n’y piochent pas au hasard : elles y empruntent.'],
 ['V · Le titre','Il manque une lettre au nom du jeu. Les Architectes l’ont retirée exprès. Ils disaient : « La Tour n’est pas finie tant que le T n’est pas rendu. »'],
 ['VI · Les dieux','Les dieux ne sont pas descendus : ils ont été invoqués, comme les autres. Zeus refuse d’en parler. Odin, lui, a pris des notes.'],
 ['VII · La galaxie','Chaque planète de la galaxie a sa Tour. Chaque Tour a son village. Certains villages ont abandonné. D’autres attendent un Joueur.'],
 ['VIII · Le Concepteur','La dernière ligne du code de la Tour n’est pas une instruction. C’est une question : « Et toi, qu’aurais-tu fait de la fin ? »']];
{const _fi=fight;fight=async function(g,adv,cfg){const f=F&&F.f,r=await _fi.apply(this,arguments);try{if(r=='win'&&cfg&&cfg.kind=='boss'&&f&&f%10==0){const i=f/10-1;if(LORE[i]&&!G.lore.includes(i)){G.lore.push(i);save();setTimeout(()=>toast(`Fragment de chronique : <b>${LORE[i][0]}</b> (Codex)`,4200),600)}}}catch(e){console.warn('chroniques',e)}return r}}
/* ---------- boucle village : scène d'éveil en attente, objets orphelins ---------- */
{const _vt=vTick;let lp=0;vTick=function(){const r=_vt.apply(this,arguments);try{if(G&&G.legScene&&mode=='village'&&!panelOpen&&!busy&&$('#evo').hidden&&$('#intro').hidden)legScene();if(++lp%5==0)legPurge()}catch(e){console.warn('légendes',e)}return r}}
/* ---------- migration (G.v_leg) : sauvegarde de secours, champs, Jeanne déjà éveillée ---------- */
function legBoot(){if(!G||!G.chars)return;if(!G.v_leg){try{if(!localStorage.getItem('tdE6_vl_bak')){const o=localStorage.getItem(SKEY);if(o)localStorage.setItem('tdE6_vl_bak',o)}}catch(_){}G.v_leg=1}
 legEnsure();const j=G.chars.find(c=>c.sig&&!c.leg&&c.st>=4);if(j)legJeanne(j)}
try{legBoot();save()}catch(e){console.warn('légendes',e)}
