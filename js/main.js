'use strict';
/* ================= BOUCLE ================= */
let last=0,hudT=0;
function frame(ts){requestAnimationFrame(frame);const dt=Math.min(.05,(ts-last)/1000||0);last=ts;T+=dt;if(introCover)return;
 for(let i=anims.length-1;i>=0;i--){const a=anims[i];a.t+=dt;const k=Math.min(1,a.t/a.d);a.fn(k);if(k>=1){anims.splice(i,1);a.r()}}
 X.fillStyle='#14122a';X.fillRect(0,0,LW,LH);
 if(mode=='village'){updVillage(dt);drawVillage()}else if(mode=='floor'&&F){updFloor(dt);if(mode=='floor'&&F)drawFloor()}else if(mode=='battle'&&B){updBattle(dt);drawBattle()}
 const ox=mode=='battle'?0:camX,oy=mode=='battle'?0:camY;for(let i=parts.length-1;i>=0;i--){const p=parts[i];p.l-=dt;if(p.l<=0){parts.splice(i,1);continue}p.x+=p.vx*dt;p.y+=p.vy*dt;if(!p.w)p.vy+=90*dt;X.fillStyle=p.c;X.fillRect(Math.round(p.x-ox),Math.round(p.y-oy),p.l>.25?2:1,p.l>.25?2:1)}
 if(vig)X.drawImage(vig,0,0);updLabs();if(mode!='battle')setActs();hudT+=dt;if(hudT>.3){hudT=0;progTick();if(mode=='floor'&&F){drawMini();objective()}else if(mode=='village')objective()}}
setInterval(vTick,1000);
window.addEventListener('error',e=>{const t=$('#toast');t.hidden=false;t.textContent='Erreur : '+e.message});
try{migrateJobs();save()}catch(e){console.warn('métiers',e);try{fixJobs()}catch(_){}}
try{mgBoot();save()}catch(e){console.warn('mages',e)}
try{injBoot();evtBoot();save()}catch(e){console.warn('blessures',e)}
try{fgBoot();save()}catch(e){console.warn('forge marteau',e)}
try{galBoot();save()}catch(e){console.warn('galaxie',e)}
try{heroBoot();save()}catch(e){console.warn('héros',e)}
try{runOf();save()}catch(e){console.warn('règles de la Tour',e)}
loadAssets().then(()=>{artCSS();for(const k in BS_)delete BS_[k];buildVillage();enterVillage();requestAnimationFrame(frame);if(G.intro===0)startIntro({create:1})});
$('#intro').addEventListener('pointerdown',e=>{if(e.target.closest('button,input,label,.hc,.whl'))return;introTap()});
