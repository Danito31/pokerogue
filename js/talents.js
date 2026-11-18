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
