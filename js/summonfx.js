'use strict';
/* ================= ANIMATION D'INVOCATION (Auberge) =================
   Avant les cartes à retourner : cercle magique runique, particules en spirale, pilier de lumière dont la couleur annonce la meilleure rareté
   (blanc/vert/bleu/violet, or dès 5★, arc-en-ciel pour 6★), puis les cartes jaillissent du cercle. Canvas pixel (1 px logique = 3 px écran).
   Bouton « Passer » ou toucher l'écran : saute l'animation. Désactivée avec prefers-reduced-motion (et dans le banc d'essai : window.__off).
   Appelée par summon() (js/village.js) : summonFx(SM) renvoie true si elle a pris la main ; elle rappelle rp() à la fin. */
let SFX=null;
const SFC=['#9fc4ff','#c9d2e2','#5fd27a','#4fa8ff','#c27cff','#ffc233','rainbow'];
function summonFx(list){
 let rm=false;try{rm=matchMedia('(prefers-reduced-motion:reduce)').matches}catch(_){}
 const st=document.getElementById('stage');
 if(SFX||rm||window.__off!==undefined||!st||!list||!list.length)return false;
 const best=Math.max(0,...list.map(x=>x.m?0:(x.c?x.c.st:x.it?x.it.st:1))),n=Math.min(list.length,10);
 const ov=document.createElement('div');ov.id='smo';ov.innerHTML='<canvas></canvas><div class="smt">Invocation…</div><button class="alt smk">Passer ▸▸</button>';st.appendChild(ov);
 const cv=ov.querySelector('canvas'),W=Math.max(110,Math.round(st.clientWidth/3)),H=Math.max(150,Math.round(st.clientHeight/3));cv.width=W;cv.height=H;
 const x=cv.getContext('2d'),cx=W/2,cy=Math.round(H*.7),rx=Math.min(W*.4,54),ry=Math.round(rx*.36);
 let seed=(Date.now()&0xffff)||7;const R=()=>(seed=(seed*1103515245+12345)&0x7fffffff)/0x7fffffff;/* propre générateur : ne touche pas au Math.random du jeu */
 const col=t=>{const c=SFC[best];return c=='rainbow'?`hsl(${Math.floor(t*360)%360},100%,66%)`:c},scol=s=>SFC[Math.min(6,s)]=='rainbow'?'#ff7be5':SFC[Math.min(6,s)];
 const T1=1.5,T2=1.9,T3=3.4,TE=3.8;let t=0,P=[],done=0,fl=0,last=performance.now(),beepT=0,burst=0,fin=0;
 const px=(a,b,w,h,c,al)=>{x.globalAlpha=al==null?1:al;x.fillStyle=c;x.fillRect(Math.round(a),Math.round(b),w||1,h||1);x.globalAlpha=1};
 const ell=(r1,r2,rot,c,al,step)=>{for(let a=0;a<360;a+=step||3){const q=(a+rot)*Math.PI/180;px(cx+r1*Math.cos(q),cy+r2*Math.sin(q),1,1,c,al)}};
 const line=(a,b,c,al)=>{const L=Math.max(Math.abs(b[0]-a[0]),Math.abs(b[1]-a[1]))|0;for(let i=0;i<=L;i++)px(a[0]+(b[0]-a[0])*i/(L||1),a[1]+(b[1]-a[1])*i/(L||1),1,1,c,al)};
 const cards=[];for(let i=0;i<n;i++){const per=n>5?5:n,row=n>5?Math.floor(i/5):0,cnt=n>5?(row==0?5:n-5):n,k=n>5?i%5:i,gw=24;cards.push({i,s:list[i].m?0:(list[i].c?list[i].c.st:list[i].it?list[i].it.st:1),fx:cx+(k-(cnt-1)/2)*gw,fy:Math.round(H*(n>5?.2:.3))+row*(n>5?34:0),dx:(R()-.5)*50,t0:T2+i*.08})}
 const beep=(f,d,v)=>{try{gBeep(f,d,'square',v||.03)}catch(_){}};
 function finish(){if(fin)return;fin=1;ov.classList.add('out');setTimeout(()=>{ov.remove();SFX=null;rp()},220)}
 SFX=ov;
 function draw(){
  x.clearRect(0,0,W,H);x.fillStyle='rgba(8,6,22,.82)';x.fillRect(0,0,W,H);
  const k1=Math.min(1,t/1.0),ap=1-Math.pow(1-k1,3),pw=t<T2?0:Math.min(1,(t-T2)/.35),fade=t>T3?Math.max(0,1-(t-T3)/(TE-T3)):1,rot=t*60,c=col(t);
  /* pilier */
  if(t>=T1){const k=Math.min(1,(t-T1)/.35),w=Math.round((10+rx*.45*Math.min(1,(t-T1)/.5))*(1+.08*Math.sin(t*24))),hh=Math.round(cy*k);
   for(let y=0;y<hh;y+=1){const yy=cy-y,a=(.55*(1-y/cy*.5))*fade;px(cx-w/2,yy,w,1,c,a*.7);px(cx-w*.3,yy,Math.round(w*.6),1,c,a);px(cx-w*.12,yy,Math.max(2,Math.round(w*.24)),1,'#fff',a)}
   for(let i=0;i<5;i++){const yy=cy-((t*70+i*30)%cy);px(cx-w/2,yy,w,1,'#fff',.35*fade)}}
  /* cercle */
  const g=ap*fade;
  if(g>0){ell(rx*ap*1.12,ry*ap*1.12,0,c,.5*g,2);ell(rx*ap,ry*ap,rot,c,g,2);ell(rx*ap*.62,ry*ap*.62,-rot*1.4,c,.8*g,3);
   const V=[];for(let i=0;i<5;i++){const q=(rot*.8+i*144)*Math.PI/180;V.push([cx+rx*ap*.62*Math.cos(q),cy+ry*ap*.62*Math.sin(q)])}for(let i=0;i<5;i++)line(V[i],V[(i+1)%5],c,.55*g);
   for(let i=0;i<8;i++){const q=(rot+i*45)*Math.PI/180,X=cx+rx*ap*Math.cos(q),Y=cy+ry*ap*Math.sin(q);px(X-1,Y-1,3,3,'#fff',g);px(X,Y-2,1,5,c,g);px(X-2,Y,5,1,c,g)}
   const gl=x.createRadialGradient(cx,cy,2,cx,cy,rx);gl.addColorStop(0,'rgba(255,255,255,.35)');gl.addColorStop(1,'rgba(255,255,255,0)');x.globalAlpha=g*(.4+.3*Math.sin(t*10));x.fillStyle=gl;x.fillRect(cx-rx,cy-ry*1.6,rx*2,ry*3.2);x.globalAlpha=1}
  /* particules */
  if(t<T2&&!burst){for(let i=0;i<2+Math.floor(t*2);i++){const a=R()*6.283,r=rx*(.9+R()*.5);P.push({x:cx+Math.cos(a)*r,y:cy+Math.sin(a)*r*.36,vx:-Math.cos(a)*r*.6,vy:-(14+R()*50)*(1+t),l:.7+R()*.6,c:R()<.3?'#fff':c,s:R()<.3?2:1,sp:a})}}
  for(let i=P.length-1;i>=0;i--){const p=P[i];p.l-=.016;if(p.l<=0){P.splice(i,1);continue}if(p.sp!=null){const q=Math.atan2(p.y-cy,p.x-cx)+.12;p.vx+=(-Math.sin(q))*40*.016;}p.x+=p.vx*.016;p.y+=p.vy*.016;px(p.x,p.y,p.s,p.s,p.c,Math.min(1,p.l*2)*fade)}
  /* cartes */
  for(const cd of cards){const u=Math.min(1,Math.max(0,(t-cd.t0)/.75));if(t<cd.t0)continue;const e=1-Math.pow(1-u,3),ex=cx+(cd.fx-cx)*e+cd.dx*Math.sin(u*Math.PI),ey=(cy-6)+(cd.fy-(cy-6))*e-Math.sin(u*Math.PI)*18,w=n==1?18:14,h=n==1?26:20,a=fade;
   if(u<1&&R()<.7)P.push({x:ex+w/2,y:ey+h/2,vx:(R()-.5)*20,vy:(R()-.5)*20,l:.35,c:scol(cd.s>=3?cd.s:0),s:1});
   const gc=cd.s>=3?scol(cd.s):'#8f9cff',pul=cd.s>=3?.5+.3*Math.sin(t*14):.25;x.globalAlpha=a*pul;x.fillStyle=gc;x.fillRect(Math.round(ex-2),Math.round(ey-2),w+4,h+4);x.globalAlpha=a;
   px(ex-1,ey-1,w+2,h+2,'#000',a);px(ex,ey,w,h,'#2a2858',a);for(let q=2;q<h-2;q+=4)px(ex+1,ey+q,w-2,2,'#3a3880',a);px(ex+w/2-1,ey+h/2-3,2,6,'#ffcf4a',a);px(ex+w/2-3,ey+h/2-1,6,2,'#ffcf4a',a);px(ex,ey,w,1,gc,a)}
  if(fl>0){x.globalAlpha=Math.min(1,fl);x.fillStyle='#fff';x.fillRect(0,0,W,H);x.globalAlpha=1}
 }
 function tick(now){if(fin||!ov.isConnected)return;const dt=Math.min(.05,(now-last)/1000);last=now;t+=dt;fl=Math.max(0,fl-dt*3);
  if(t<T1&&t>=beepT){beep(180+t*260,.08,.02);beepT+=.16}
  if(t>=T2&&!burst){burst=1;fl=.9;try{gJingle(best>=3)}catch(_){}for(let i=0;i<60;i++){const a=R()*6.283,v=20+R()*70;P.push({x:cx,y:cy-4,vx:Math.cos(a)*v,vy:Math.sin(a)*v-30,l:.5+R()*.6,c:R()<.5?'#fff':col(R()),s:R()<.3?2:1})}}
  if(t>=TE)return finish();draw();requestAnimationFrame(tick)}
 ov.addEventListener('pointerdown',finish);requestAnimationFrame(tick);return true}
(function(){const s=document.createElement('style');s.textContent=`#smo{position:absolute;inset:0;z-index:12;background:#080616;transition:opacity .22s;touch-action:manipulation;cursor:pointer}#smo.out{opacity:0}#smo canvas{width:100%;height:100%;display:block;image-rendering:pixelated;image-rendering:crisp-edges}
#smo .smt{position:absolute;left:0;right:0;top:12px;text-align:center;color:var(--gold);letter-spacing:3px;text-shadow:2px 2px 0 #000;animation:smb 1s steps(2) infinite}#smo .smk{position:absolute;left:50%;bottom:16px;transform:translateX(-50%)}@keyframes smb{50%{opacity:.45}}
@media (prefers-reduced-motion:reduce){#smo .smt{animation:none}}`;document.head.appendChild(s)})();
