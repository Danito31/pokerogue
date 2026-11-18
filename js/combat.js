'use strict';
/* ---------- progression en combat : techniques, ultimes, sous-classes, formes (docs/progression.md §4, §5, §13.4) ---------- */
const fm=(u,k,n)=>!!u&&u.sp==k&&(u.aw||0)>=(n||0);
const anyF=(k,n)=>B&&B.A.some(a=>a.alive&&fm(a,k,n));
const lowAl=()=>allies().slice().sort((x,y)=>x.hp/x.mhp-y.hp/y.mhp)[0];
const strongAl=u=>allies().filter(x=>x!=u).sort((x,y)=>atkOf(y)-atkOf(x))[0]||u;
function pushT(t,k){if(!t||!t.alive)return;t.av+=Math.min(1,k)*1e4/t.spd}
function advT(a,k){a.av=Math.max(0,a.av-k*1e4/a.spd)}
function bfT(u,a,k,v,t){if(u&&u.ally&&(u.ps.refrain||fm(u,'chantre',1))&&(k=='atk'||k=='crit'))t++;a.bf[k]={v:k=='atk'||k=='def'||k=='dr'||k=='crit'?Math.max(v,bfv(a,k)):v,t}}
function addDot(t,by,v,n,k){if(!t||!t.alive)return;t.dot=t.dot||[];const mx=k=='psn'?(fm(by,'empoisonneur',1)?5:3):1,cur=t.dot.filter(d=>d.k==k);const dv=Math.round(atkOf(by)*v*(fm(by,'empoisonneur',3)?2*by.dvm:1));if(cur.length>=mx){cur.sort((a,b)=>a.t-b.t)[0].t=n;return}t.dot.push({k,v:dv,t:n,by});fl(t,k=='psn'?'POISON':'BRÛLURE','deb')}
function addHot(a,v,n,by){a.hot=a.hot||[];a.hot.push({v,t:n+(by&&fm(by,'druide',1)?1:0)})}
function purge(a){for(const k in a.bf)if(a.bf[k].v<0||k=='vul'||k=='nheal')delete a.bf[k];a.dot=[]}
/* début du tour d'une unité : poisons, brûlures, soins sur la durée, malédictions dévorantes */
function tickDot(u){if(u.dot&&u.dot.length){let d=0;u.dot.forEach(x=>{d+=x.v;x.t--});u.dot=u.dot.filter(x=>x.t>0);if(d>0){hurt(u,d,{});fl(u,'POISON','deb')}}
 if(!u.ally&&u.alive&&u.bf.vul&&anyF('occultiste',3)){hurt(u,u.mhp*(u.kind=='boss'||u.kind=='mini'?.01:.03),{})}
 if(u.ally&&u.alive&&u.hot&&u.hot.length){let h=0;u.hot.forEach(x=>{h+=x.v;x.t--});u.hot=u.hot.filter(x=>x.t>0);if(h>0&&!hasLaw('gel'))heal(u,u.mhp*h)}}
const teamDR=()=>B.A.filter(a=>a.alive).reduce((s,a)=>s+(fm(a,'chevalier',2)?.1:0)+(fm(a,'rempart',2)?.15:0)+(fm(a,'paladin',3)?.2:0),0);
const techP=u=>(u.c.lv>=25?1.15:1)*(u.c.lv>=55?1.3:1)*(kit(u.c).tid=='tech_'+u.sp&&u.aw>=1?1.25:1);
async function burst(u,t,n,m,tb,o,stop){if(!t)return 0;let k=0;await hitAnim(u,t,()=>{},rgU(u));for(let i=0;i<n;i++){if(!t.alive)break;const d=deal(u,t,m,tb,Object.assign({},o));k++;if(stop&&stop(i,d))n++;if(i%2==1)await sleep(70)}return k}
/* techniques : run(u,P) */
const TECHS={
 tech_entaille:(u,P)=>hitS(u,2.2*P,20),tech_poing:(u,P)=>hitS(u,1.8*P,20),tech_fendoir:(u,P)=>hitS(u,2.4*P,30),
 tech_bouclier:async(u,P)=>{await cast(u,'#bfe8ff');u.taunt=2;addSh(u,(u.def*2+u.mhp*.1)*P,u);await sleep(240)},
 tech_estoc:async(u,P)=>{const t=tgt();if(t)await hitAnim(u,t,()=>deal(u,t,2.6*P,20,{crit:t.broken?1:u.crit+.2}))},
 tech_volee:async(u,P)=>{for(let i=0;i<3;i++){const e=pick(real());if(!e)break;await hitAnim(u,e,()=>deal(u,e,.9*P,10),1)}},
 tech_deflagration:(u,P)=>aoeS(u,1.1*P,10),
 tech_glyphe:async(u,P)=>{await aoeS(u,.9*P,10);foes().forEach(e=>{e.bf.def={v:Math.min(bfv(e,'def'),-.1),t:2}})},
 tech_soin:async(u,P)=>{await cast(u,'#5fe07a');const a=lowAl();heal(a,(u.atk*1.6+a.mhp*.08)*P,u);await sleep(240)},
 tech_ralliement:async(u,P)=>{await cast(u,'#ffcf4a');const a=strongAl(u);bfT(u,a,'atk',.4*P,2);fl(a,'ATQ +'+pc(.4*P),'buf');fxOn('fx_buff',a);if(a!=u){a.av=0;fl(a,'AGIT !','buf')}await sleep(240)},
 tech_epeiste:async(u,P)=>{const t=tgt();if(!t)return;await hitAnim(u,t,()=>{const b=t.broken;deal(u,t,1.3*P,20);if(t.alive)deal(u,t,1.3*P,20,{crit:!b&&t.broken?1:undefined})})},
 tech_berserker:(u,P)=>hitS(u,2.4*P,20,{ls:.1}),
 tech_chevalier:async(u,P)=>{await hitS(u,2*P,20);const a=lowAl();if(a)addSh(a,a.mhp*.1*P,u)},
 tech_paladin:async(u,P)=>{await cast(u,'#ffe27a');u.taunt=2;addSh(u,u.def*2*P,u);allies().forEach(a=>heal(a,a.mhp*.06*P,u));await sleep(240)},
 tech_rempart:async(u,P)=>{await cast(u,'#bfe8ff');u.taunt=2;allies().forEach(a=>{a.bf.dr={v:Math.max(.15*Math.min(P,2),bfv(a,'dr')),t:2}});fl(u,'MUR D’ACIER','buf');await sleep(240)},
 tech_vengeur:async(u,P)=>{await cast(u,'#c58bff');u.taunt=2;u.bf.thorn={v:.3*P,t:2};fl(u,'ÉPINES','buf');await sleep(240)},
 tech_lameombre:async(u,P)=>{const t=tgt();if(t)await hitAnim(u,t,()=>deal(u,t,2.8*P*(t.turns?1:1.5),20))},
 tech_eclaireur:async(u,P)=>{const t=await hitS(u,1.6*P,15);if(t&&t.alive&&!t.weak.includes(u.elem)&&t.kind!='obj'){t.weak.push(u.elem);fl(t,'FAIBLESSE !','brk');drawTI()}u.haste=1},
 tech_duelliste:async(u,P)=>{const t=tgt();if(!t)return;t.bf.duel={v:.2,t:4,by:u};await hitAnim(u,t,()=>deal(u,t,2.2*P,20));fl(t,'DÉFI','deb')},
 tech_empoisonneur:async(u,P)=>{const t=await hitS(u,1.6*P,15);if(t&&t.alive)addDot(t,u,.25*P,3,'psn')},
 tech_tireur:(u,P)=>hitS(u,2.6*P,25,{ign:.3,crit:u.crit+.15,sure:1}),
 tech_rodeur:async(u,P)=>{for(let i=0;i<2;i++){const t=tgt();if(!t)break;await hitAnim(u,t,()=>deal(u,t,1.1*P,10),1)}const t=tgt();if(t){pushT(t,.2);drawTL()}},
 tech_tempete:async(u,P)=>{const n=5+(u.aw>=2?2:0);for(let i=0;i<n;i++){const e=pick(real());if(!e)break;await hitAnim(u,e,()=>deal(u,e,.55*P,6,{crit:u.crit+.1}),1)}},
 tech_elementaliste:async(u,P)=>{await aoeS(u,1.2*P,12);elemFx(u,foes(),1)},
 tech_arcaniste:async(u,P)=>{for(let i=0;i<4;i++){const e=pick(real());if(!e)break;await hitAnim(u,e,()=>deal(u,e,.6*P,6),1)}const a=allies().filter(x=>x.en<100).sort((x,y)=>y.en-x.en)[0];if(a)gainEn(a,10)},
 tech_chrono:async(u,P)=>{const t=await hitS(u,1.1*P,12);if(t)pushT(t,.35);const a=allies().filter(x=>x!=u).sort((x,y)=>x.av-y.av)[0];if(a)advT(a,.2);drawTL()},
 tech_occultiste:async(u,P)=>{const t=await hitS(u,1.3*P,15,{el:'ombre'});if(t&&t.alive){t.bf.vul={v:fm(u,'occultiste',2)?Math.min(.4,bfv(t,'vul')+.2):.2,t:3};fl(t,'MAUDIT','deb')}},
 tech_pretre:async(u,P)=>{await cast(u,'#ffe27a');const a=lowAl();heal(a,(u.atk*1.8+a.mhp*.1)*P,u);purge(a);await sleep(240)},
 tech_druide:async(u,P)=>{await cast(u,'#5fe07a');allies().sort((x,y)=>x.hp/x.mhp-y.hp/y.mhp).slice(0,2).forEach(a=>{addHot(a,.08*P,3,u);fl(a,'BOURGEON','heal')});await sleep(240)},
 tech_hemo:async(u,P)=>{const t=tgt();if(!t)return;let d=0;await hitAnim(u,t,()=>{d=deal(u,t,1.4*P,15)||0},1);const a=lowAl();if(a&&d)heal(a,d,u)},
 tech_troubadour:async(u,P)=>{await cast(u,'#ffcf4a');allies().forEach(a=>gainEn(a,10*P));setSP(1);await sleep(220)},
 tech_chantre:async(u,P)=>{await cast(u,'#ff5a5a');const a=strongAl(u);bfT(u,a,'atk',.45*P,2);bfT(u,a,'crit',.15,2);fl(a,'CHANT DE GUERRE','buf');if(a!=u)a.av=0;await sleep(220)},
 tech_enchanteur:async(u,P)=>{await cast(u,'#ff7ad9');const t=tgt(),el=t&&t.weak[0];allies().filter(x=>x!=u).sort((x,y)=>atkOf(y)-atkOf(x)).slice(0,u.aw>=1?2:1).concat(allies().length<2?[u]:[]).forEach(a=>{bfT(u,a,'def',.3*P,2);if(el)a.bf.ench={v:1,t:2,el};fl(a,'ENCHANTÉ','buf')});await sleep(220)}};
/* effet d'élément (Nova élémentaire, Archimage) */
function elemFx(u,list,k){const e=u.elem;list.forEach(t=>{if(!t.alive)return;if(e=='feu')addDot(t,u,.15*k,2,'brl');else if(e=='glace')pushT(t,.15*k);else if(e=='foudre'){const o=pick(real().filter(x=>x!=t));if(o)deal(u,o,.4*k,5)}else if(e=='nature')pushT(t,.1*k);else if(e=='ombre')t.bf.def={v:Math.min(bfv(t,'def'),-.1*k),t:2}});if(e=='sacre')allies().forEach(a=>heal(a,a.mhp*.05*k,u));if(e=='arcane')gainEn(u,10*k);drawTL()}
/* ultimes de spécialisation : run(u,s,M) — s = forme (0 base · 1 éveil · 2 apogée · 3 divin), M = puissance */
const ULTS={
 epeiste:async(u,s,M)=>{const t=tgt();if(!t)return;if(t.weak.includes(u.elem)&&t.mt){t.tough=0}let n=s>=3?12:6+(s>=1?2:0),k=0;await hitAnim(u,t,()=>{},0);for(let i=0;i<n&&t.alive;i++){const last=s>=3&&i==n-1,c0=t.hp;const cr=Math.random()<u.crit;deal(u,t,.7*M*(last?3:1),10,{crit:cr?1:0});if(cr&&s>=2&&n<12)n++;if(i%2)await sleep(60)}},
 berserker:async(u,s,M)=>{const T=s>=3?5:s>=2?4:3;await cast(u,'#ff5a5a');u.bf.atk={v:Math.max(s>=3?1.2:.6,bfv(u,'atk')),t:T};u.bf.cleave={v:.5,t:T};if(s>=1)u.bf.ls={v:.15,t:T};if(s>=3)u.bf.undy={v:1,t:T};fl(u,'RAGE ÉCARLATE','brk');const t=tgt();if(t)await hitAnim(u,t,()=>deal(u,t,1.5*M,20))},
 chevalier:async(u,s,M)=>{const t=tgt();if(t)await hitAnim(u,t,()=>deal(u,t,3*M,30));allies().forEach(a=>addSh(a,a.mhp*(s>=3?.35:s>=1?.2:.15),u));u.taunt=s>=2?2:1;if(s>=2)allies().forEach(a=>a.bf.dr={v:Math.max(.3,bfv(a,'dr')),t:2});if(s>=3)allies().forEach(a=>a.bf.immu={v:1,t:2})},
 jeanne:async(u,s,M)=>{const t=tgt();if(t)await hitAnim(u,t,()=>deal(u,t,3.2*M,30));allies().forEach(a=>{bfT(u,a,'atk',.25,2);fl(a,'ATQ +25 %','buf');addSh(a,a.mhp*(s>=3?.3:s>=1?.15:.12),u)});if(s>=2)u.taunt=2},
 paladin:async(u,s,M)=>{await cast(u,'#ffe27a');allies().forEach(a=>{addSh(a,a.mhp*(s>=3?.4:.2),u);heal(a,a.mhp*(s>=3?.5:.1),u);if(s>=1)purge(a)});foes().forEach(e=>deal(u,e,1.5*M,15,{el:'sacre'}));await sleep(260)},
 rempart:async(u,s,M)=>{await cast(u,'#bfe8ff');const T=s>=1?3:2;u.bf.fort={v:s>=3?1:.5,t:T,rf:s>=2?.25:0};u.bf.def={v:s>=3?2:1,t:T};u.taunt=T;fl(u,'FORTERESSE','buf');await sleep(260)},
 vengeur:async(u,s,M)=>{await cast(u,'#c58bff');const cp=s>=3?15:s>=1?8:6;let tot=0;foes().forEach(e=>{const m=Math.min(e.kind=='boss'&&s>=3?99:cp,1+.5*(u.taken||0)/Math.max(1,u.atk));tot+=deal(u,e,m*M/(s>=3?2:1),20)||0});if(s>=2)heal(u,tot*.3,u);await sleep(260)},
 lameombre:async(u,s,M)=>{u.hide=Math.max(u.hide||0,1);const n=s>=3?6:s>=1?4:3;for(let i=0;i<n;i++){const t=real().slice().sort((a,b)=>a.hp-b.hp)[0];if(!t)break;await hitAnim(u,t,()=>{deal(u,t,(s>=3?2.2:1.8)*M,15);if(s>=2&&t.alive&&t.hp<t.mhp*.2&&t.kind!='boss'&&t.kind!='mini'){hurt(t,t.hp+1,{crit:1});fl(t,'EXÉCUTÉ','brk')}});if(!t.alive){if(B.cur==u)u.extra=1;else u.av=0}}},
 eclaireur:async(u,s,M)=>{await cast(u,'#ff9a3a');allies().forEach(a=>{if(a!=u)a.av=0;if(s>=2)gainEn(a,20);if(s>=3)a.twice=1});setSP(s>=1?2:1);fl(u,'EMBUSCADE !','brk');drawTL();await sleep(240)},
 duelliste:async(u,s,M)=>{const t=tgt();if(!t)return;t.bf.duel={v:.2,t:s>=1?6:4,by:u};if(s>=2)t.bf.atk={v:-.3,t:3};let n=s>=3?10:5;await hitAnim(u,t,()=>{},0);for(let i=0;i<n&&t.alive;i++){const cr=Math.random()<u.crit;deal(u,t,(s>=3?1.5:1.1)*M,8,{crit:cr?1:0});if(cr&&n<10)n++;if(i%2)await sleep(60)}},
 empoisonneur:async(u,s,M)=>{await cast(u,'#6fdc6f');const n=s>=3?6:s>=1?4:3;foes().forEach(e=>{for(let i=0;i<n;i++){e.dot=e.dot||[];e.dot.push({k:'psn',v:Math.round(atkOf(u)*.25*M),t:3,by:u})}e.bf.def={v:s>=3?-.4:-.2,t:3};if(s>=2)e.sh=0;fl(e,'NUÉE TOXIQUE','deb')});await sleep(300)},
 tireur:async(u,s,M)=>{const t=tgt();if(!t)return;await hitAnim(u,t,()=>{deal(u,t,6*M,40,{ign:s>=2?1:.6,sure:1});if(s>=3)foes().filter(e=>e!=t).forEach(e=>deal(u,e,3*M,10,{ign:1,sure:1}))},1)},
 rodeur:async(u,s,M)=>{await aoeS(u,1.8*M,15);foes().forEach(e=>{pushT(e,s>=2?.4:.2)});allies().forEach(a=>{heal(a,a.mhp*(s>=1?.12:.08),u);if(s>=3)addHot(a,.1,3,u)});drawTL()},
 tempete:async(u,s,M)=>{const n=s>=3?6:s>=1?4:3;await cast(u);for(let i=0;i<n;i++){foes().forEach(e=>{deal(u,e,.9*M*(s>=3?1.3:1),8,{crit2:s>=2})});await wave(u,ELEMS[u.elem].c);await sleep(90)}},
 elementaliste:async(u,s,M)=>{await aoeS(u,2.6*M,25,{tb2:1,allwk:s>=3});if(s>=1)elemFx(u,foes(),2)},
 arcaniste:async(u,s,M)=>{await aoeS(u,2.2*M,20);foes().forEach(e=>{if(e.charging){e.charging=0;fl(e,'ANNULÉ','brk')}});allies().forEach(a=>{if(s>=3&&a==u)return;gainEn(a,s>=3?100:s>=1?35:25)});if(s>=2)setSP(2)},
 chrono:async(u,s,M)=>{await cast(u,'#c58bff');foes().forEach(e=>{const big=e.kind=='boss'||e.kind=='mini';if(e.skipImm||e.skip){fl(e,'RÉSISTE','buf');return}e.skip=s>=3?(big?1:2):s>=2&&!big?2:1;fl(e,'TEMPS FIGÉ','deb')});allies().forEach(a=>gainEn(a,s>=3?50:s>=1?30:20));await sleep(300)},
 occultiste:async(u,s,M)=>{let sac=s>=3?0:s>=1?.15:.25;if(u.aw>=1)sac/=2;if(sac){u.hp=Math.max(1,u.hp-u.mhp*sac);fl(u,'PACTE','deb')}await aoeS(u,3*M,20,{el:'ombre'});foes().forEach(e=>e.bf.vul={v:s>=2?.3:.2,t:3})},
 pretre:async(u,s,M)=>{await cast(u,'#ffe27a');if(s>=3)B.A.filter(a=>!a.alive).forEach(a=>{a.alive=true;a.hp=Math.round(a.mhp*.4);a.av=1e4/a.spd;fl(a,'RELEVÉ !','brk')});else if(s>=2&&!B.miracle){const a=B.A.find(x=>!x.alive);if(a){B.miracle=1;a.alive=true;a.hp=Math.round(a.mhp*.25);a.av=1e4/a.spd;fl(a,'RELEVÉ !','brk')}}allies().forEach(a=>{heal(a,a.mhp*(s>=3?.6:.35)*Math.min(M,1.5),u);purge(a);addSh(a,a.mhp*(s>=1?.15:.1),u)});drawTL();await sleep(260)},
 druide:async(u,s,M)=>{await cast(u,'#5fe07a');allies().forEach(a=>{addHot(a,s>=3?.2:.1,s>=1?4:3,u);a.bf.def={v:Math.max(s>=3?.4:.2,bfv(a,'def')),t:3}});if(s>=2)foes().forEach(e=>{e.dot=e.dot||[];e.dot.push({k:'brl',v:Math.round(atkOf(u)*.6*M),t:3,by:u})});fl(u,'FLORAISON','heal');await sleep(260)},
 hemo:async(u,s,M)=>{let tot=0;await cast(u,'#ff5a5a');foes().forEach(e=>{tot+=deal(u,e,1.6*M,15)||0});await wave(u,'#ff5a5a');const al=allies(),k=(s>=3?1:s>=1?.8:.6)*tot/Math.max(1,al.length);al.forEach(a=>{const ex=a.hp+k-a.mhp;heal(a,k,u);if(s>=2&&ex>0)addSh(a,ex,u)});await sleep(240)},
 troubadour:async(u,s,M)=>{await cast(u,'#ffcf4a');allies().forEach(a=>{if(s>=3&&a!=u)a.en=100;else gainEn(a,s>=1?50:40)});setSP(2);if(s>=2){const a=strongAl(u);if(a!=u){a.av=0;fl(a,'REJOUE','buf')}}drawTL();await sleep(240)},
 chantre:async(u,s,M)=>{await cast(u,'#ff5a5a');const T=s>=1?3:2;allies().forEach(a=>{bfT(u,a,'atk',s>=3?1:.4,T);bfT(u,a,'crit',s>=3?.4:.2,T);if(s>=2)a.bf.critm={v:1.8,t:T};fl(a,'HYMNE','buf')});setSP(2);await sleep(240)},
 enchanteur:async(u,s,M)=>{await cast(u,'#ff7ad9');const v=s>=3?.5:.3,T=s>=1||s>=3?2:1;foes().forEach(e=>{e.bf.atk={v:-v,t:2};if(s>=2)e.bf.def={v:-v,t:2};fl(e,'CHARMÉ','deb')});allies().forEach(a=>a.bf.allwk={v:1,t:T+1});await sleep(240)}};
const ULTM=[1,1.25,1.875,4.125];
/* sous-classes en combat : actives (id 'sub') */
const subP=u=>u.voie?1.5:1;
async function doSub(u){const S=u.sub,v=u.voie,k=subP(u);setSP(-1);gainEn(u,30);const sc=SUBCL[S];u.cd.sub=(S=='conteur'&&v=='esprit'?2:S=='exorciste'&&v=='esprit'?4:sc.a)+1;say(u.n+' — '+sc.sn);fl(u,sc.sn,'buf');B.skill=1;
 try{if(S=='exorciste'){await cast(u,'#ffe27a');(v=='coeur'?allies():[lowAl()]).forEach(a=>{purge(a);addSh(a,a.mhp*.08*k,u)});if(v=='lame'){const t=real().slice().sort((a,b)=>b.atk-a.atk)[0];if(t){for(const x in t.bf)if(t.bf[x].v>0)delete t.bf[x];await hitAnim(u,t,()=>deal(u,t,1.4*k,15,{el:'sacre'}),1)}}if(v=='esprit')real().filter(e=>e.mech.length).forEach(e=>{e.sealed=2;fl(e,'SCELLÉ','deb')})}
  else if(S=='saboteur'){await cast(u,'#c58bff');const L=foes().slice().sort((a,b)=>a.av-b.av).slice(0,v=='esprit'?2:1);L.forEach(e=>{pushT(e,v=='esprit'?.35:.25);e.bf.def={v:-.2*k,t:2};fl(e,'PIÈGE','deb')});if(v=='coeur'){foes().forEach(e=>{if(e.charging){e.charging=0;fl(e,'DÉSAMORCÉ','brk')}});allies().forEach(a=>gainEn(a,10))}if(v=='lame')foes().forEach(e=>deal(u,e,.9*k,10));drawTL()}
  else if(S=='alchi'){const els=[...new Set(allies().map(a=>a.elem))],cnt=e=>real().filter(x=>x.weak.includes(e)).length,pool=v=='esprit'?EK:els,el=pool.slice().sort((a,b)=>cnt(b)-cnt(a))[0];await cast(u,ELEMS[el].c);foes().forEach(e=>{deal(u,e,(v=='lame'?1.1:.7)*k,e.weak.includes(el)?30:10,{el});if(v=='lame')addDot(e,u,.15,2,'brl')});if(v=='coeur')allies().forEach(a=>heal(a,a.mhp*.05,u));await sleep(240)}
  else if(S=='pisteur'){await cast(u,'#c58bff');const L=[tgt()].concat(v=='esprit'?real().filter(e=>e!=tgt()).slice(0,1):[]).filter(Boolean);L.forEach(e=>{e.bf.mark={v:(v=='lame'?.25:.15)*k,t:3,by:u,v2:v};fl(e,'MARQUÉ','deb')});await sleep(200)}
  else if(S=='conteur'){await cast(u,'#ffcf4a');setSP(v=='esprit'?2:1);const al=allies().filter(a=>a.en<100).sort((a,b)=>b.en-a.en),t=al[0];allies().forEach(a=>gainEn(a,a==t?20*k:10*k));if(t&&v=='lame')bfT(u,t,'atk',.15,2);if(v=='coeur')allies().forEach(a=>heal(a,a.mhp*.06,u));await sleep(220)}
  else if(S=='tacticien'){await cast(u,'#ffcf4a');const L=(v=='coeur'?allies().filter(a=>a!=u).sort((a,b)=>a.hp/a.mhp-b.hp/b.mhp):allies().filter(a=>a!=u).sort((a,b)=>atkOf(b)-atkOf(a))).slice(0,v=='esprit'?2:1);(L.length?L:[u]).forEach(a=>{a.critB=.2*k;if(v=='lame'&&a!=u)a.av=0;else advT(a,.5);if(v=='coeur')addSh(a,a.mhp*.1,u);fl(a,'ORDRE !','buf')});drawTL();await sleep(200)}}
 finally{B.skill=0}}
function subAI(u){const S=u.sub;if(!S||!SUBCL[S].a||!skReady(u,'sub'))return 0;if(S=='exorciste')return allies().some(a=>Object.keys(a.bf).some(k=>a.bf[k].v<0)||(a.dot||[]).length||a.hp<a.mhp*.5)?5:2;if(S=='saboteur')return foes().some(e=>e.charging)?8:3.5;if(S=='alchi')return 2+foes().length;if(S=='pisteur'){const t=tgt();return t&&!t.bf.mark&&t.hp>t.mhp*.4?4.5:0}if(S=='conteur')return B.sp<=2?5:3;if(S=='tacticien')return allies().length>1?4:0;return 0}
/* fin d'action d'un allié : Médic, familier, rythme des formes */
async function afterAct(u){if(!u.alive||!B)return;if(u.hide>0)u.hide--;
 if(u.sub=='medic'){const a=lowAl();if(a&&a.hp<a.mhp&&!hasLaw('gel')){heal(a,a.mhp*(a.hp<a.mhp*.3?.05:.03)*subP(u),u);if(u.voie=='coeur')purge(a);if(u.voie=='lame')a.bf.atk={v:Math.max(.1,bfv(a,'atk')),t:1}}}
 if(u.pet&&real().length){for(let i=0;i<u.pet.n;i++){const hurtA=u.pet.heal&&allies().find(a=>a.hp<a.mhp*.5);if(hurtA){heal(hurtA,hurtA.mhp*.04,u);continue}const t=tgt()||pick(real());if(!t)break;fxOn('fx_slash',t,{a:.7});deal(u,t,u.pet.pw,5,{pet:1,el:u.pet.wk&&t.weak[0]||undefined});await sleep(120)}}
 if(fm(u,'tempete',3)&&B.skUsed){B.skUsed=0;let t=pick(real());for(let i=0;i<3&&t;i++){deal(u,t,.6,5);t=pick(real())}}}
