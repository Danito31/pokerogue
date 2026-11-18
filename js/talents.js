'use strict';
/* ================= EFFETS : HÉRITAGE RACIAL DU HÉROS, PERSONNALITÉS SECRÈTES, TALENTS INNÉS SUPPLÉMENTAIRES =================
   Tout passe par des enveloppes des fonctions existantes (stats, gain, battleStart, turnStart, deal, heal, hurt, saveLethal, lootPassives, fightDrops,
   roll, injHit, galFuel, galTime, defRating, vTick, crCost, drift, addSh) : aucun fichier d'un autre système n'est modifié.
   RACET (js/data.js) : héros seulement. Prodige / Souverain : tout personnage de cette personnalité. */
const isH=c=>!!(c&&c.hero);
const raceT=c=>isH(c)&&RACET[c.race]||null;
const tOn=(u,k)=>!!(u&&u.c&&u.c.tal==k);
const noGel=()=>!B||B.law!='gel';
/* ---------- statistiques ---------- */
{const _st=stats;stats=function(c){const s=_st(c);if(!c)return s;const R=raceT(c),p=c.pers;
 if(R){s.hp*=1+(R.hp||0);s.atk*=1+(R.atk||0);s.def*=1+(R.def||0);s.spd+=R.spd||0;s.crit+=R.crit||0}
 if(p=='Prodige'){s.atk*=1.12;s.crit+=.08;s.spd+=6}if(p=='Souverain'){s.hp*=1.1;s.def*=1.1;s.atk*=1.08}
 const T=TSTAT[c.tal];if(T)T(s,c);
 s.hp=Math.round(s.hp);s.atk=Math.round(s.atk);s.def=Math.round(s.def);s.spd=Math.round(s.spd);s.crit=Math.min(.75,s.crit);return s}}
/* ---------- combat : début ---------- */
{const _bs=battleStart;battleStart=function(){const r=_bs.apply(this,arguments);try{const A=B.A;
 if(A.some(u=>u.c.pers=='Souverain'))A.forEach(a=>{a.atk*=1.06;a.def*=1.06});
 A.forEach(u=>{const P=u.ps||{};if(P.decret)A.forEach(a=>{a.sh=Math.max(a.sh,Math.round(a.mhp*.12*P.decret));a.sht=3});if(P.eclat)B.sp=clamp(B.sp+1,0,5);const f=TSTART[u.c.tal];if(f)f(u,A)})}catch(e){console.warn('talents',e)}return r}}
/* ---------- combat : début de tour ---------- */
{const _ts=turnStart;turnStart=function(u){const r=_ts.apply(this,arguments);try{if(u&&u.ally&&u.alive&&noGel()){const R=raceT(u.c);if(R&&R.regen&&u.hp<u.mhp)heal(u,u.mhp*R.regen,null,1);const an=B.A.find(x=>x.alive&&raceT(x.c)&&raceT(x.c).aura);if(an&&u.hp<u.mhp)heal(u,u.mhp*raceT(an.c).aura,null,1)}const f=u&&u.ally&&TTURN[u.c.tal];if(f&&u.alive)f(u)}catch(e){console.warn('talents',e)}return r}}
/* ---------- combat : dégâts infligés et subis ---------- */
{const _dl=deal;deal=function(a,t,mult,tb,o){o=o||{};if(a&&a.ally&&t&&t.alive){if(a.ps&&a.ps.eclat)mult*=1+.15*a.ps.eclat;const f=TDEAL[a.c.tal];if(f)mult=f(a,t,mult,o)}
 const d=_dl.call(this,a,t,mult,tb,o);try{if(a&&a.ally&&d>0&&a.alive){const R=raceT(a.c);if(R&&R.leech&&noGel())heal(a,d*R.leech,null,1);if(tOn(a,'vampire')&&noGel())heal(a,d*.08,null,1)}
  if(a&&!a.ally&&t&&t.ally&&t.alive&&a.alive&&!o.rip&&tOn(t,'contre')&&Math.random()<.15){fl(t,'CONTRE !','buf');_dl.call(this,t,a,.6,0,{rip:1})}}catch(e){console.warn('talents',e)}return d}}
{const _ht=hurt;hurt=function(t,d,o){if(t&&t.ally&&t.c){if(tOn(t,'titan'))d=Math.min(d,t.mhp*.35);if(tOn(t,'cuirasse'))d*=.92}return _ht.call(this,t,d,o)}}
{const _hl=heal;heal=function(a,v,by,raw){if(a&&a.c){const R=raceT(a.c);if(R&&R.heal)v*=1+R.heal;if(tOn(a,'estomac'))v*=1.1}if(by&&tOn(by,'guerisseur'))v*=1.25;return _hl.call(this,a,v,by,raw)}}
{const _as=addSh;addSh=function(a,v,by){if(by&&tOn(by,'guerisseur'))v*=1.25;return _as.call(this,a,v,by)}}
/* ---------- expérience et butin ---------- */
{const _gn=gain;gain=function(c,x,raw){if(!raw&&c){const R=raceT(c);if(R&&R.xp)x*=1+R.xp;const f=TXP[c.tal];if(f)x*=f(c);const h=heroOf();if(h&&h!=c&&h.tal=='mentor'&&c.party&&h.party)x*=1.15}return _gn.call(this,c,x,raw)}}
{const _lp=lootPassives;lootPassives=function(o){const r=_lp.apply(this,arguments);try{const al=B.A.filter(u=>u.alive);al.forEach(u=>{const R=raceT(u.c);if(R&&R.gold)o.gold=Math.round(o.gold*(1+R.gold));const f=TLOOT[u.c.tal];if(f)f(o,u,al)})}catch(e){console.warn('talents',e)}return r}}
/* ---------- tables d'effets des talents (remplies plus bas) ---------- */
const TSTAT={},TSTART={},TTURN={},TDEAL={},TXP={},TLOOT={};
const mul=(s,k,v)=>{s[k]*=v};
Object.assign(TSTAT,{
 matinal:s=>{mul(s,'def',1.06);mul(s,'hp',1.04)},costaud:s=>mul(s,'atk',1.06),sprinteur:s=>{s.spd+=5},veinard:s=>{s.crit+=.04},
 tank:s=>{mul(s,'hp',1.12);s.spd-=3},chrono:s=>{s.spd+=10},titan:s=>{mul(s,'hp',1.25);mul(s,'def',1.15)},destin:s=>{s.crit+=.15;mul(s,'atk',1.08)},
 ngplus:s=>{['hp','atk','def','spd'].forEach(k=>mul(s,k,1.12))}});
Object.assign(TSTART,{
 nuitblanche:u=>{u.en=Math.min(100,u.en+20)},bouclier0:u=>{u.sh=Math.max(u.sh,Math.round(u.mhp*.1));u.sht=3},
 chef:(u,A)=>A.forEach(a=>{a.def*=1.06}),eclaireur:(u,A)=>A.forEach(a=>{a.av*=.85}),chrono:u=>{u.extra1=1},
 archimage:u=>{u.en=Math.min(100,u.en+40)},omni:()=>{B.sp=clamp(B.sp+1,0,5)}});
Object.assign(TTURN,{
 regen:u=>{if(noGel()&&u.hp<u.mhp)heal(u,u.mhp*.03,null,1)},mana:u=>gainEn(u,10),
 septieme:u=>{if(!B.sevU&&(B.allyT||0)>=7){B.sevU=1;setSP(2);fl(u,'SEPTIÈME CIEL','buf')}},
 omni:u=>{for(const k in u.cd)if(u.cd[k]>0&&u.cd[k]<99)u.cd[k]--}});
Object.assign(TDEAL,{
 combo:(a,t,m)=>{a.cmb=(a.cmb||0)+1;if(a.cmb%3==0){fl(a,'COMBO ×3','buf');return m*1.4}return m},
 tueur:(a,t,m)=>['elite','mini','boss'].includes(t.kind)?m*1.2:m,
 affinite:(a,t,m)=>t.weak&&[a.elem,a.el2].some(e=>e&&t.weak.includes(e))?m*1.25:m,
 rage:(a,t,m)=>a.hp<a.mhp*.5?m*1.25:m,
 archimage:(a,t,m)=>B.skill?m*1.35:m,
 jackpot:(a,t,m,o)=>{if(!o.rip&&Math.random()<.1){fl(a,'JACKPOT !','brk');return m*3}return m}});
Object.assign(TXP,{speedrun:()=>1.2,ngplus:()=>1.25});
Object.assign(TLOOT,{
 radin:o=>{o.gold=Math.round(o.gold*1.1)},fortune:o=>{o.gold=Math.round(o.gold*1.3)},
 fouineur:o=>{if(Math.random()<.12)o.shard=(o.shard||0)+1},
 phenix:(o,u,al)=>al.forEach(x=>{if(F&&F.hp)F.hp[x.c.id]=Math.min(x.mhp,(F.hp[x.c.id]||Math.round(x.hp))+Math.round(x.mhp*.1))})});
/* ---------- autres accroches ---------- */
const hAlive=k=>!!(B&&B.A&&B.A.some(u=>u.alive&&tOn(u,k)));
{const _fd=fightDrops;fightDrops=function(){const o=_fd.apply(this,arguments);try{if(o&&typeof o=='object'){if(hAlive('glaneur')&&Math.random()<.2)madd(o,pick(BASEM),1);if(hAlive('fortune'))madd(o,pick(BASEM),1)}}catch(_){}return o}}
{const _ih=injHit;injHit=function(c){const r=_ih.apply(this,arguments);try{if(c&&c.tal=='tetu'&&c.wd&&c.wd.left>0)c.wd.left=Math.round(c.wd.left*.75)}catch(_){}return r}}
{const _cc=crCost;crCost=function(){const o=_cc.apply(this,arguments);if(o&&o.gold&&hasTal('bricoleur'))o.gold=Math.round(o.gold*.9);return o}}
{const _dr=drift;drift=function(a,b,k){if(hasTal('mediateur')&&k>0&&compat(a,b)<0)k*=.75;return _dr.call(this,a,b,k)}}
{const _dfr=defRating;defRating=function(){const v=_dfr.apply(this,arguments);return hasTal('gardien')?Math.round(v*1.15):v}}
{const _gf=galFuel;galFuel=function(){const o=_gf.apply(this,arguments);if(hasTal('navigateur')&&o)for(const k in o)o[k]=Math.max(1,Math.ceil(o[k]*.8));return o}}
{const _gt=galTime;galTime=function(){const v=_gt.apply(this,arguments);return hasTal('navigateur')?Math.round(v*.8):v}}
{const _rl=roll;roll=function(){let r=_rl.apply(this,arguments);if(hasTal('lien')&&r<=1&&Math.random()<.15)r=_rl.apply(this,arguments);return r}}
{const _sl=saveLethal;saveLethal=function(t,r){if(t&&t.c&&t.c.tal=='plotarmor'&&!t.paU){t.paU=1;flashT('PAS MAINTENANT');fl(t,'ARMURE SCÉNARISTIQUE','brk');say(t.n+' refuse de tomber : le scénario a besoin de lui !');B.saves=(B.saves||0)+1;return t.hp-1}return _sl.apply(this,arguments)}}
let TRESO=Date.now();{const _vt=vTick;vTick=function(){const r=_vt.apply(this,arguments);try{const now=Date.now();if(now-TRESO>=1e4){const n=Math.min(60,Math.floor((now-TRESO)/1e4));TRESO+=n*1e4;if(G&&G.intro!==0&&hasTal('tresorier'))G.res.gold+=n*Math.max(1,hdvLv())}}catch(_){}return r}}
