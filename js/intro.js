'use strict';
/* ================= INTRO : BD ANIMÉE, CRÉATION DU HÉROS, ROUE DES TALENTS (docs/intro.md) =================
   Nouvelle partie (G.intro===0) : 6 cases de BD → aspiration dans l'écran → héros 1★ humain → roue des talents → accueil de Jeanne.
   « Passer » saute la BD (la création du héros reste nécessaire) ; « Revoir l'intro » (Équipe) rejoue la BD sans rien toucher à la partie.
   Images facultatives (ASSETS) : intro_1..intro_6 (cases), fx_vortex (feuille horizontale 8 × 96 px), intro_frame (cadre 9-slice, tranche 12).
   Sans elles : dessins procéduraux en 192×128 (même cadrage). Les textes et boutons sont en HTML par-dessus. */
const frT=s=>s.replace(/ ([?!:;»])/g,' $1').replace(/« /g,'« ');
const BDW=192,BDH=128,mixC=(a,b,k)=>{const A=h2r(a),B2=h2r(b);return r2h(...A.map((v,i)=>Math.round(v+(B2[i]-v)*clamp(k,0,1))))};
const eOut=k=>1-Math.pow(1-clamp(k,0,1),3),eIn=k=>clamp(k,0,1)**2,eIO=k=>{k=clamp(k,0,1);return k*k*(3-2*k)},eBack=k=>{k=clamp(k,0,1);const c=1.7;return 1+(c+1)*Math.pow(k-1,3)+c*Math.pow(k-1,2)};
/* script de la BD : b = bulles (say = parole, cap = récitatif, voice = voix de l'écran, sfx = onomatopée) ; x,y = position dans la case, ax,ay = point d'ancrage de la bulle ; auto = s'affiche seule ; fx = effet */
const BDP=[
 {k:'intro_1',kb:[1,96,64,1.4,104,60],b:[{k:'cap',t:'Banlieue, 3 h 12 du matin.',x:.03,y:.05},{k:'cap',t:'La ville dort. Enfin… presque toute la ville.',x:.97,y:.95,ax:1,ay:1}]},
 {k:'intro_2',kb:[1.3,96,66,1,96,64],b:[{k:'say',t:'Allez… juste UN dernier tirage.',x:.05,y:.06,tx:.8},{k:'say',t:'0,6 % de taux de drop. Ils se moquent de moi.',x:.95,y:.56,ax:1,tx:.15}]},
 {k:'intro_3',kb:[1,96,64,1.16,96,56],ov:1,b:[{k:'say',t:'« La Tour des Étoiles » ? Jamais entendu parler…',x:.03,y:.3,tx:.6,w:.4},{k:'say',t:'Pas de pub, pas d’éditeur, gratuit. Louche. Parfait.',x:.97,y:.97,ax:1,ay:1,up:1,tx:.7,w:.58}]},
 {k:'intro_4',kb:[1.25,92,58,1.55,104,64],b:[{k:'sfx',t:'CLIC',x:.56,y:.62,fx:'flash'},{k:'voice',t:'Joueur… tu as été choisi.',x:.5,y:.06,ax:.5,auto:1,fx:'voice'},{k:'say',t:'… Hein ?',x:.04,y:.62,tx:.7}]},
 {k:'intro_5',kb:[1,96,64,1.25,96,56],shake:1,b:[{k:'sfx',t:'VWOOOOOM',x:.5,y:.04,ax:.5,fx:'boom'},{k:'say',t:'AAAAH ! Mes figurines !',x:.03,y:.66,tx:.7},{k:'voice',t:'La Tour t’attend.',x:.97,y:.95,ax:1,ay:1}]},
 {k:'intro_6',kb:[1.35,96,74,1,96,64],b:[{k:'cap',t:'Le lendemain, on ne retrouva qu’une chaise qui tournait encore.',x:.03,y:.05},{k:'cap',t:'Et sur l’écran : « Joueur 1 connecté. »',x:.97,y:.95,ax:1,ay:1}]}];
const OTK={id:0,name:'?',st:1,role:'soutien',elem:'arcane',race:'Humain',eq:{},look:{skin:'#ffd9bd',hair:'#2a2536',eye:'#3aa0ff',style:0,hue:0}};
let INTRO=null,introCover=false;const BDOFF=[],BDS={};
/* ---------- petits outils de dessin (192×128) ---------- */
const bR=(x,c,a,b,w,h)=>{x.fillStyle=c;x.fillRect(Math.round(a),Math.round(b),Math.round(w),Math.round(h))};
function bC(x,cx,cy,r,c){x.fillStyle=c;for(let y=-r;y<=r;y++){const w=Math.floor(Math.sqrt(r*r-y*y));x.fillRect(Math.round(cx-w),Math.round(cy+y),w*2+1,1)}}
function bE(x,cx,cy,rx,ry,c){x.fillStyle=c;for(let y=-ry;y<=ry;y++){const w=Math.floor(rx*Math.sqrt(Math.max(0,1-(y*y)/(ry*ry))));x.fillRect(Math.round(cx-w),Math.round(cy+y),w*2+1,1)}}
function bBands(x,top,bot,y0,y1,n){const h=(y1-y0)/n;for(let i=0;i<n;i++)bR(x,mixC(top,bot,i/(n-1)),0,y0+i*h,BDW,h+1)}
function bStars(x,t,n,h,seed){const r=vrng(seed);for(let i=0;i<n;i++){const a=r(BDW),b=r(h),s=Math.sin(t*2.2+i*1.7);bR(x,s>.75?'#ffffff':s>0?'#b9b4e0':'#5a5490',a,b,1,1);if(s>.95){bR(x,'#fff',a-1,b,3,1);bR(x,'#fff',a,b-1,1,3)}}}
function bMini(k){if(BDS[k])return BDS[k];const c=mkc(8,8),x=c.getContext('2d'),R=(a,b,w,h,f)=>bR(x,f,a,b,w,h);
 if(k=='can'){R(2,1,4,7,'#e04a4a');R(2,1,4,1,'#c9d2e2');R(3,3,2,2,'#fff')}else if(k=='can2'){R(2,1,4,7,'#4de0c0');R(2,1,4,1,'#c9d2e2');R(3,4,2,1,'#14302a')}
 else if(k=='cup'){R(1,2,6,6,'#f2e6c9');R(1,4,6,2,'#d2603a');R(0,1,8,1,'#c9a36a')}else if(k=='paper'){R(1,1,6,6,'#f2ecdd');R(2,2,4,1,'#8a8aa8');R(2,4,3,1,'#8a8aa8')}
 else if(k=='fig'){R(3,0,2,2,'#f08fb4');R(2,2,4,3,'#ff5ccf');R(3,5,2,3,'#3a3880');R(3,1,2,1,'#ffd9bd')}else{R(1,3,6,3,'#3a3456');R(0,4,2,3,'#3a3456');R(6,4,2,3,'#3a3456');R(5,3,1,1,'#ff5a5a');R(2,4,1,1,'#4de0c0')}
 return BDS[k]=c}
/* chambre vue de dos (cases 2 et 6) : fl = scintillement de l'écran ; who = 1 si le joueur est assis */
function bRoom(x,t,fl,who,scr){bBands(x,'#120f28','#1d1940',0,100,5);bR(x,'#0c0a1c',0,100,BDW,28);bR(x,'#17132e',0,99,BDW,2);
 bR(x,'#2c2252',12,14,24,32);bR(x,'#ff7ad9',15,18,18,14);bR(x,'#2c2252',19,22,10,8);bR(x,'#f2e6c9',15,36,18,2);bR(x,'#1c3450',154,12,26,34);bR(x,'#4de0c0',158,16,18,12);bR(x,'#ffcf4a',162,32,10,2);bR(x,'#ffcf4a',162,36,8,2);
 bR(x,'#2a2440',6,58,40,3);[['#ff5ccf',10],['#5aa8ff',18],['#ffcf4a',26],['#4de0c0',34]].forEach(([c,a],i)=>{bR(x,c,a,51,5,7);bR(x,'#ffd9bd',a+1,48,3,3);bR(x,c,a,47,5,2)});
 const sc=mixC('#14305a','#9fe6ff',fl);x.globalAlpha=.09+.06*fl;x.fillStyle='#6fd3ff';x.beginPath();x.moveTo(64,34);x.lineTo(128,34);x.lineTo(190,128);x.lineTo(2,128);x.closePath();x.fill();x.globalAlpha=1;
 bR(x,'#231c36',26,84,140,6);bR(x,'#171226',30,90,4,24);bR(x,'#171226',158,90,4,24);bR(x,'#3a3060',26,84,140,1);
 bR(x,'#0b0a16',60,28,72,46);bR(x,'#0b0a16',90,74,12,10);bR(x,'#0b0a16',84,82,24,3);bR(x,sc,63,31,66,40);scr&&scr(x,63,31,66,40,t);
 for(let y=31;y<71;y+=2){x.globalAlpha=.12;bR(x,'#000',63,y,66,1)}x.globalAlpha=1;
 bR(x,'#e04a4a',38,77,4,7);bR(x,'#c9d2e2',38,77,4,1);bR(x,'#4de0c0',44,78,4,6);bR(x,'#c9d2e2',44,78,4,1);bR(x,'#3a3456',32,82,5,2);
 bR(x,'#f2e6c9',142,76,9,8);bR(x,'#d2603a',142,79,9,2);for(let i=0;i<3;i++){const sy=(t*10+i*6)%18;x.globalAlpha=1-sy/18;bR(x,'#c9d2e2',145+Math.round(Math.sin(t*3+sy*.5+i)*1.5),73-sy,1,2)}x.globalAlpha=1;
 bR(x,'#3a3456',64,84,20,2)}
function bTitle(x,a,b,w,h,t){bBands(x,'#1a1050','#6a3aa8',b,b+h,6);const r=vrng(5);for(let i=0;i<14;i++){const s=Math.sin(t*3+i);bR(x,s>.5?'#fff':'#9a96c8',a+r(w),b+r(h*.6),1,1)}
 const cx=a+w/2,gy=b+h;bR(x,'#1c1440',a,gy-6,w,6);for(let y=b+h*.18;y<gy-5;y++){const k=(y-b-h*.18)/(h*.82-5),hw=Math.round(2+k*7);bR(x,'#2a1f5a',cx-hw,y,hw*2,1)}
 for(let y=b+h*.3;y<gy-8;y+=4)bR(x,(Math.floor(y+t*2)%3)?'#ffe08a':'#6a5aa8',cx-1,y,2,2);const bl=Math.sin(t*5)>0;bR(x,bl?'#ffcf4a':'#fff6c0',cx-1,b+h*.18-3,2,2);if(bl){bR(x,'#ffcf4a',cx-3,b+h*.18-2,6,1)}}
/* ---------- les six cases ---------- */
const BDSC=[
 (x,t,ov)=>{if(ov){bStars(x,t,12,40,3);return}
  bBands(x,'#070618','#2c2060',0,96,8);bStars(x,t,46,72,7);bC(x,158,20,9,'#f2e6c9');bC(x,155,18,2,'#d8ccb0');bC(x,161,24,1,'#d8ccb0');bC(x,154,24,1,'#d8ccb0');
  let r=vrng(21),bx=-4;while(bx<BDW){const w=10+Math.floor(r(14)),h=26+Math.floor(r(34));bR(x,'#19153c',bx,128-h,w,h);for(let wy=128-h+3;wy<124;wy+=5)for(let wx=bx+2;wx<bx+w-2;wx+=4)if(r()<.18)bR(x,'#3a3470',wx,wy,2,2);bx+=w+1}
  r=vrng(33);bx=-6;while(bx<BDW){const hero=bx>78&&bx<100,w=hero?26:12+Math.floor(r(16)),h=hero?66:18+Math.floor(r(30));bR(x,'#0d0a22',bx,128-h,w,h);bR(x,'#1d1840',bx,128-h,w,1);
   for(let wy=128-h+4;wy<124;wy+=6)for(let wx=bx+2;wx<bx+w-3;wx+=5){const on=r()<.22,fk=on&&Math.sin(t*1.3+wx*7+wy)>.97;if(on&&!fk)bR(x,'#ffd36a',wx,wy,3,3)}
   if(hero){const p=.6+.4*Math.sin(t*4)*Math.sin(t*1.7+1);x.globalAlpha=.22*p;bR(x,'#6fd3ff',bx+4,128-h+9,18,16);x.globalAlpha=.4*p;bR(x,'#6fd3ff',bx+7,128-h+12,12,10);x.globalAlpha=1;bR(x,mixC('#6fd3ff','#e8fbff',p),bx+9,128-h+14,8,6);bR(x,'#0d0a22',bx+12,128-h+14,1,6)}bx+=w+1}
  for(let i=0;i<3;i++){const lx=30+i*64;bR(x,'#2a2440',lx,110,1,18);x.globalAlpha=.25;bC(x,lx,110,5,'#ffcf4a');x.globalAlpha=1;bR(x,'#ffe08a',lx-1,109,3,2)}},
 (x,t,ov)=>{const fl=.65+.25*Math.sin(t*7)*Math.sin(t*2.3)+(Math.sin(t*23)>.97?-.3:0);if(ov){x.globalAlpha=.08*(1-fl);bR(x,'#000',0,0,BDW,BDH);x.globalAlpha=1;return}
  bRoom(x,t,fl,1,(x,a,b,w,h,t)=>{bR(x,'#ff7ad9',a+6,b+6,22,28);bR(x,'#ffcf4a',a+34,b+8,26,4);bR(x,'#ffcf4a',a+34,b+15,18,3);bR(x,'#4de0c0',a+34,b+26,24,6);if(Math.sin(t*6)>0)bR(x,'#fff',a+38,b+27,16,4)});
  bR(x,'#2a2440',78,72,36,36);bR(x,'#3a3060',78,72,36,2);bR(x,'#1d1835',94,108,4,12);bR(x,'#1d1835',82,118,28,3);
  bR(x,'#1f1a35',72,80,48,22);bR(x,'#16122a',70,88,6,16);bR(x,'#16122a',116,88,6,16);bC(x,96,64,11,'#120f22');[[86,54],[90,51],[96,50],[102,51],[106,55],[84,60]].forEach(([a,b])=>bR(x,'#120f22',a-1,b-1,3,3));
  x.globalAlpha=.7*fl;[[88,55],[92,53],[97,53],[102,54],[105,58]].forEach(([a,b])=>bR(x,'#8fe0ff',a,b,2,1));x.globalAlpha=1;bR(x,'#3a3456',84,58,2,10);bR(x,'#3a3456',106,58,2,10);bR(x,'#3a3456',86,52,20,2);bR(x,'#ff5a5a',83,62,3,5);bR(x,'#ff5a5a',106,62,3,5)},
 (x,t,ov)=>{if(ov)return;bR(x,'#0b0a16',0,0,BDW,BDH);bR(x,'#18142e',4,2,184,104);bR(x,'#2a2448',4,2,184,2);bTitle(x,16,10,160,88,t);for(let y=10;y<98;y+=2){x.globalAlpha=.1;bR(x,'#000',16,y,160,1)}x.globalAlpha=.06;x.fillStyle='#fff';x.beginPath();x.moveTo(16,10);x.lineTo(70,10);x.lineTo(30,98);x.lineTo(16,98);x.fill();x.globalAlpha=1;
  bR(x,'#14112a',0,106,BDW,22);bR(x,'#26203e',30,110,132,12);for(let i=0;i<16;i++)for(let j=0;j<2;j++)bR(x,'#3a3456',33+i*8,112+j*5,6,3);bR(x,'#4de0c0',96+Math.round(Math.sin(t)*2),2,0,0)},
 (x,t,ov,ev)=>{const fa=ev.flash!=null?t-ev.flash:-1,va=ev.voice!=null?clamp((t-ev.voice)/1.2,0,1):0,fl=.8+.2*Math.sin(t*9)*Math.sin(t*3.1);
  if(!ov){bR(x,'#08070f',0,0,BDW,BDH);x.globalAlpha=.25;bE(x,86,60,60,56,mixC('#2a5a9a','#6a2aa8',va));x.globalAlpha=1;const sk=mixC('#8fc0ec','#c8a0f0',va*.8),sd=mixC('#41608f','#4a2a7a',va);
   bR(x,'#1f2a4a',34,104,110,24);bR(x,'#2a3a60',34,104,110,2);bE(x,86,92,10,10,sd);bE(x,86,60,34,40,sk);for(let y=24;y<100;y++){const w=Math.floor(34*Math.sqrt(Math.max(0,1-((y-60)/40)**2)));bR(x,sd,86+w-9,y,9,1)}
   bE(x,88,30,40,22,'#120f22');[[50,40],[56,46],[64,44],[72,48],[80,44],[90,48],[100,44],[110,46],[118,40],[122,52]].forEach(([a,b])=>{bR(x,'#120f22',a-3,b-4,7,6);bR(x,'#120f22',a-1,b+2,3,3)});
   const ln=fa>=0?mixC('#dff6ff','#e8b8ff',va):'#dff6ff';[[56,50],[90,50]].forEach(([a,b])=>{bR(x,'#1d1430',a-2,b-2,26,18);bR(x,ln,a,b,22,14);for(let y=b+1;y<b+14;y+=3)bR(x,mixC('#6fd3ff','#b565ff',va),a+1,y,20,1);x.globalAlpha=.35;bR(x,'#14305a',a+8,b+5,5,5);x.globalAlpha=1});bR(x,'#1d1430',78,55,12,2);
   if(va>.3){bR(x,'#2a1a40',80,84,6,6);bR(x,'#1d1430',81,85,4,4)}else bR(x,'#3a4a7a',80,86,8,2);
   bE(x,158,112,12,15,'#c9d2e6');bR(x,'#8a90a8',157,98,2,10);bE(x,154,100,13,6,sk);[0,1,2].forEach(i=>bR(x,sd,146+i*6,96,1,6))}
  if(fa>=0&&fa<.6){const k=fa/.6,mx=ov?22:158,my=ov?104:98;x.globalAlpha=1-k;[[-1,-1],[0,-1],[1,-1],[-1,0],[1,0]].forEach(([a,b])=>{for(let i=0;i<4;i++)bR(x,'#ffcf4a',mx+a*(10+i+k*10),my+b*(8+i+k*8),2,2)});x.globalAlpha=1}
  if(ov&&va){x.globalAlpha=.18*va;bR(x,'#b565ff',0,0,BDW,BDH);x.globalAlpha=1}},
 (x,t,ov,ev)=>{const bt=ev.boom!=null?t-ev.boom:-1,R=Math.min(62,22+t*12+(bt>0?bt*20:0)),cx=96,cy=48;
  if(!ov){bR(x,'#0d0a1e',0,0,BDW,BDH);bR(x,'#08061a',0,104,BDW,24);bR(x,'#231c36',22,88,148,6);bR(x,'#0b0a16',62,26,68,46);
   for(let i=0;i<12;i++){const a=i/12*6.283+t*.6;x.globalAlpha=.08+.05*Math.sin(t*5+i);x.fillStyle=i%2?'#c58bff':'#4de0c0';x.beginPath();x.moveTo(cx,cy);x.lineTo(cx+Math.cos(a)*220,cy+Math.sin(a)*220);x.lineTo(cx+Math.cos(a+.18)*220,cy+Math.sin(a+.18)*220);x.fill()}x.globalAlpha=1;
   const vx=aImg('fx_vortex');if(vx){const fh=vx.naturalHeight,n=Math.max(1,Math.round(vx.naturalWidth/fh)),f=Math.floor(t*12)%n,s=R*2.2;x.drawImage(vx,f*fh,0,fh,fh,cx-s/2,cy-s/2,s,s)}
   else{for(let a=0;a<5;a++)for(let k=0;k<44;k++){const rr=k/44,an=a*1.2566+rr*5.5-t*5,ra=rr*R;bR(x,['#c58bff','#4de0c0','#ff7ad9','#ffffff','#5aa8ff'][(k+a)%5],cx+Math.cos(an)*ra,cy+Math.sin(an)*ra*.8,1+rr*3,1+rr*3)}bC(x,cx,cy,5,'#fff');bC(x,cx,cy,3,'#fff6ff')}
   const pull=.5+.5*Math.sin(t*14);bR(x,'#2a2440',80,96,32,30);const sy=Math.round(4+pull*3),fy=18;bR(x,'#1f1a35',86,62-sy+fy,20,26+sy);bC(x,96,58-sy+fy,8,'#120f22');bR(x,'#8fe0ff',90,50-sy+fy,12,1);bR(x,'#1f1a35',84,40-sy*2+fy,4,22);bR(x,'#1f1a35',104,40-sy*2+fy,4,22);bR(x,'#ffd9bd',84,38-sy*2+fy,4,3);bR(x,'#ffd9bd',104,38-sy*2+fy,4,3)}
  ['can','cup','paper','fig','pad','can2','paper','fig','paper','can'].forEach((k,j)=>{const u=(t*.32+j*.137)%1,an=j*2.1+u*9,ra=(1-u)*95+6;const im=bMini(k);x.save();x.translate(Math.round(cx+Math.cos(an)*ra),Math.round(cy+Math.sin(an)*ra*.7));x.rotate(an*2);x.globalAlpha=Math.min(1,(1-u)*3);x.drawImage(im,-4,-4);x.restore()});x.globalAlpha=1;
  if(bt>=0&&bt<.5){x.globalAlpha=(1-bt/.5)*.8;bR(x,'#fff',0,0,BDW,BDH);x.globalAlpha=1}},
 (x,t,ov)=>{const sp=Math.cos(t*5.5),aw=Math.abs(sp);
  if(!ov){bRoom(x,t,.35,0,(x,a,b,w,h,t)=>{bR(x,'#0b1430',a,b,w,h);bR(x,'#c9d2e2',a+12,b+17,42,1);bR(x,'#1d3a6a',a+12,b+20,42,4);bR(x,'#4de0c0',a+12,b+20,Math.round(42*((t*.25)%1)),4);if(Math.sin(t*4)>0)bR(x,'#4de0c0',a+31,b+28,4,2)});
   const w=Math.max(4,Math.round(36*aw));bR(x,sp>0?'#2a2440':'#3a3266',96-w/2,70,w,36);bR(x,'#3a3060',96-w/2,70,w,2);bR(x,'#1d1835',80,104,32,5);bR(x,'#1d1835',94,108,4,10);bR(x,'#1d1835',82,117,28,3)}
  const chx=ov?146:96,chy=ov?90:96,chr=ov?.6:1;x.globalAlpha=.75;for(let i=0;i<3;i++){const a=t*6+i*2.1,ry=(6+i*3)*chr;for(let k=0;k<5;k++){const an=a+k*.12;bR(x,ov?'#fff6c0':'#a9a4d0',chx+Math.cos(an)*(26+i*4)*chr,chy+Math.sin(an)*ry,2,1)}}x.globalAlpha=1;
  for(let i=0;i<4;i++){const u=(t*.12+i*.27)%1;x.save();x.translate(Math.round(30+i*42+Math.sin(t*1.5+i)*8),Math.round(-6+u*130));x.rotate(Math.sin(t*2+i)*.6);x.drawImage(bMini('paper'),-4,-4);x.restore()}}];
/* ---------- mise en page (cases 3:2) et caméra ---------- */
function bdLayout(W,H){const cols=W/H<.8?1:W/H<1.25?2:3,rows=Math.ceil(6/cols),g=W<520?10:16,m=W<520?12:22;let pw;
 if(cols==1)pw=Math.min(W-2*m,560);else pw=Math.min((W-2*m-(cols-1)*g)/cols,(H-2*m-(rows-1)*g)/rows*1.5);const ph=pw/1.5,PW=cols*pw+(cols-1)*g,PH=rows*ph+(rows-1)*g,x0=(W-PW)/2,y0=cols==1?m:(H-PH)/2;
 return{W,H,cols,PW,PH,x0,y0,pw,ph,r:BDP.map((_,i)=>({x:x0+(i%cols)*(pw+g),y:y0+Math.floor(i/cols)*(ph+g),w:pw,h:ph}))}}
function bdCamT(L,i){if(i<0||i>=BDP.length){const s=Math.min(1,(L.H-24)/(L.PH+16),(L.W-16)/(L.PW+16));return{x:L.x0+L.PW/2,y:L.y0+L.PH/2,s}}const r=L.r[i];return{x:r.x+r.w/2,y:r.y+r.h/2,s:clamp(Math.min(L.W*.94/r.w,L.H*.64/r.h),1,2.4)}}
const bdS=(I,p)=>[(p[0]-I.cam.x)*I.cam.s+I.L.W/2,(p[1]-I.cam.y)*I.cam.s+I.L.H/2];
function bdRect(I,r){const a=bdS(I,[r.x,r.y]);return{x:a[0],y:a[1],w:r.w*I.cam.s,h:r.h*I.cam.s}}
/* repère d'une case : coordonnées logiques 192×128 → écran (cadrage « Ken Burns ») */
function bdMap(i,R,tp){const P=BDP[i],kb=P.kb,e=eIO(tp/9),z=lerp(kb[0],kb[3],e),vw=BDW/z,vh=BDH/z,sx=clamp(lerp(kb[1],kb[4],e)-vw/2,0,BDW-vw),sy=clamp(lerp(kb[2],kb[5],e)-vh/2,0,BDH-vh),m=R.w/vw;return{m,ox:R.x-sx*m,oy:R.y-sy*m}}
function nine(x,im,a,b,w,h,s,bw){const W=im.naturalWidth,H=im.naturalHeight,xs=[0,s,W-s,W],ys=[0,s,H-s,H],dx=[a,a+bw,a+w-bw,a+w],dy=[b,b+bw,b+h-bw,b+h];for(let j=0;j<3;j++)for(let i=0;i<3;i++){if(i==1&&j==1)continue;x.drawImage(im,xs[i],ys[j],xs[i+1]-xs[i],ys[j+1]-ys[j],dx[i],dy[j],dx[i+1]-dx[i],dy[j+1]-dy[j])}}
function bdPanel(x,I,i,tp,act){const R0=bdRect(I,I.L.r[i]);let R=R0,al=1,fw=0;if(act&&tp<.55){const k=eBack(tp/.55),s=1.14-.14*k;R={x:R0.x+R0.w*(1-s)/2,y:R0.y+R0.h*(1-s)/2,w:R0.w*s,h:R0.h*s};al=clamp(tp/.22,0,1);fw=1-clamp(tp/.4,0,1)}
 if(R.x>I.L.W||R.y>I.L.H||R.x+R.w<0||R.y+R.h<0)return R;const P=BDP[i],img=aImg(P.k),off=BDOFF[i]||(BDOFF[i]=mkc(BDW,BDH)),ox=off.getContext('2d'),ev=act?I.ev:{flash:-9,voice:-9,boom:-9};
 ox.clearRect(0,0,BDW,BDH);BDSC[i](ox,act?tp:6+i,!!img,ev);let shx=0,shy=0;if(act&&P.shake){const a=I.ev.boom!=null&&tp-I.ev.boom<1.2?5:1.6;shx=rnd(-a,a);shy=rnd(-a,a)}
 const M=bdMap(i,R,act?tp:9);x.save();x.globalAlpha=al;x.fillStyle='#000';x.fillRect(R.x-4,R.y-4,R.w+8,R.h+8);x.beginPath();x.rect(R.x,R.y,R.w,R.h);x.clip();x.save();x.translate(M.ox+shx,M.oy+shy);x.scale(M.m,M.m);
 if(img){const k=Math.max(BDW/img.naturalWidth,BDH/img.naturalHeight),w=img.naturalWidth*k,h=img.naturalHeight*k;x.drawImage(img,(BDW-w)/2,(BDH-h)/2,w,h)}x.drawImage(off,0,0);x.restore();
 if(act&&I.ev.flash!=null&&tp-I.ev.flash<.35){x.globalAlpha=al*(1-(tp-I.ev.flash)/.35);x.fillStyle='#fff';x.fillRect(R.x,R.y,R.w,R.h)}if(fw){x.globalAlpha=fw;x.fillStyle='#fff';x.fillRect(R.x,R.y,R.w,R.h)}
 if(!act&&I.ph=='comic'){x.globalAlpha=.22;x.fillStyle='#14122a';x.fillRect(R.x,R.y,R.w,R.h)}x.restore();x.save();x.globalAlpha=al;const fr=aImg('intro_frame');if(fr){const bw=Math.max(6,Math.round(R.w/32));nine(x,fr,R.x-bw/2,R.y-bw/2,R.w+bw,R.h+bw,12,bw)}else{x.strokeStyle='#000';x.lineWidth=Math.max(3,R.w/90);x.strokeRect(R.x,R.y,R.w,R.h);x.strokeStyle='#fff';x.lineWidth=1;x.strokeRect(R.x+x.lineWidth*0+2.5,R.y+2.5,R.w-5,R.h-5)}x.restore();return R}
let BDPAT=null;function bdPage(x,I,showAct){const L=I.L,a=bdS(I,[L.x0-14,L.y0-14]),s=I.cam.s;if(!BDPAT){const p=mkc(6,6),q=p.getContext('2d');q.fillStyle='#efe3c4';q.fillRect(0,0,6,6);q.fillStyle='#e2d3ad';q.fillRect(1,1,2,2);q.fillRect(4,4,1,1);BDPAT=x.createPattern(p,'repeat')}
 x.save();x.fillStyle='rgba(0,0,0,.35)';x.fillRect(a[0]+8,a[1]+8,(L.PW+28)*s,(L.PH+28)*s);x.fillStyle=BDPAT;x.translate(a[0],a[1]);x.fillRect(0,0,(L.PW+28)*s,(L.PH+28)*s);x.restore();
 const n=I.ph=='comic'?I.pi:BDP.length;for(let i=0;i<=Math.min(n,BDP.length-1);i++){const act=I.ph=='comic'&&i==I.pi;const R=bdPanel(x,I,i,act?I.pt:9,act);if(act)I.R=R}}
/* ---------- bulles (HTML, tapées lettre par lettre) ---------- */
function bdBub(d,R){const el=document.createElement('div');el.className='bub '+d.k+(d.up?' up':'');el.style.setProperty('--tx',Math.round((d.tx==null?.25:d.tx)*100)+'%');const t=frT(d.t);el.innerHTML='<span class="v"></span><span class="h">'+t+'</span><i class="cur">▼</i>';$('#ibl').appendChild(el);return{d,el,t,n:0,R}}
function bdBubPos(I,b,R){const d=b.d,el=b.el,fs=d.k=='sfx'?clamp(R.w*.1,30,92):clamp(R.w/38,13,19);el.style.fontSize=fs+'px';if(d.w)el.style.maxWidth=Math.max(130,d.w*R.w)+'px';const w=el.offsetWidth,h=el.offsetHeight;let l=R.x+d.x*R.w-(d.ax||0)*w,t=R.y+d.y*R.h-(d.ay||0)*h;l=clamp(l,8,I.L.W-8-w);t=clamp(t,8,I.L.H-8-h);el.style.transform=`translate(${Math.round(l)}px,${Math.round(t)}px)`}
function bdClearBubs(){INTRO.bubs=[];$('#ibl').innerHTML=''}
function bdShowNext(){const I=INTRO,P=BDP[I.pi];I.bi++;const d=P.b[I.bi];if(!d)return;const b=bdBub(d);I.bubs.push(b);I.typing=b;if(d.fx)I.ev[d.fx]=I.pt;if(d.k=='sfx')b.n=b.t.length}
function bdType(I,dt){const b=I.typing;if(!b)return;b.n=Math.min(b.t.length,b.n+dt*(b.d.k=='voice'?24:40));const s=b.t.slice(0,Math.floor(b.n));b.el.firstChild.textContent=s;b.el.children[1].textContent=b.t.slice(s.length);if(b.n>=b.t.length){b.el.classList.add('done');I.typing=null;const nx=BDP[I.pi]&&BDP[I.pi].b[I.bi+1];if(nx&&nx.auto)I.wait=.45}}
function bdFinish(b){b.n=b.t.length;b.el.firstChild.textContent=b.t;b.el.children[1].textContent='';b.el.classList.add('done')}
/* écran du titre dans la case 3 (texte HTML net par-dessus l'image ou le dessin) */
/* avec l'image intro_3 (320×180, recadrée en 3:2) : titre et bouton posés sur ceux de l'écran dessiné ; sinon au centre du dessin procédural */
function bdScreen(I,R,tp){let e=$('#iscr');if(I.ph!='comic'||I.pi!=2||!R){if(e)e.remove();return}if(!e){e=document.createElement('div');e.id='iscr';e.innerHTML='<b>La Tour des Étoiles</b><span>Commencer ?</span>';$('#ibl').prepend(e)}
 const im=!!aImg('intro_3'),M=bdMap(2,R,tp),P=im?[[126,18],[131,86]]:[[122,22],[122,80]],fs=Math.max(8,M.m*6.4);e.classList.toggle('img',im);e.style.opacity=clamp((tp-.35)/.4,0,1);
 [...e.children].forEach((c,i)=>{c.style.fontSize=(i?fs*.62:fs)+'px';c.style.transform=`translate(${Math.round(M.ox+P[i][0]*M.m)}px,${Math.round(M.oy+P[i][1]*M.m)}px) translate(-50%,-50%)`})}
/* ---------- aspiration plein écran ---------- */
function drawVortex(x,cx,cy,S,t,al,px){x.save();x.globalAlpha=al;const vx=aImg('fx_vortex');if(vx){const fh=vx.naturalHeight,n=Math.max(1,Math.round(vx.naturalWidth/fh)),f=Math.floor(t*12)%n;x.imageSmoothingEnabled=false;x.save();x.globalAlpha=al*.6;x.translate(cx,cy);x.rotate(t*1.4);x.drawImage(vx,f*fh,0,fh,fh,-S*.8,-S*.8,S*1.6,S*1.6);x.restore()}
 const C=['#c58bff','#4de0c0','#ff7ad9','#ffffff','#5aa8ff','#ffcf4a'];for(let a=0;a<6;a++)for(let k=0;k<70;k++){const rr=((k/70)+t*.35)%1,an=a*1.047+rr*6.5-t*3.2,ra=rr*S,sz=Math.round((1+rr*5)*px/3)*3||3;x.fillStyle=C[(k+a)%6];x.globalAlpha=al*(rr<.08?rr/.08:1);x.fillRect(Math.round((cx+Math.cos(an)*ra)/px)*px,Math.round((cy+Math.sin(an)*ra)/px)*px,sz,sz)}
 x.globalAlpha=al;const g=x.createRadialGradient(cx,cy,0,cx,cy,S*.22);g.addColorStop(0,'#ffffff');g.addColorStop(.4,'rgba(255,240,255,.8)');g.addColorStop(1,'rgba(197,139,255,0)');x.fillStyle=g;x.fillRect(cx-S,cy-S,S*2,S*2);x.restore()}
function drawSuck(x,I){const L=I.L,t=I.t,cx=L.W/2,cy=L.H/2,S=Math.max(L.W,L.H)*.75,px=Math.max(3,Math.round(Math.min(L.W,L.H)/160));x.fillStyle='#0b0a18';x.fillRect(0,0,L.W,L.H);drawVortex(x,cx,cy,S,t,clamp(t/.9,0,1),px);
 if(t<1.7){const e=eIn(t/1.7),c0=bdCamT(L,-1);x.save();x.globalAlpha=1-e*.4;x.translate(cx,cy);x.rotate(e*e*5);x.scale(1-e,1-e);x.translate(-cx,-cy);I.cam={x:c0.x,y:c0.y,s:c0.s};bdPage(x,I,0);x.restore()}
 x.save();x.strokeStyle='rgba(255,255,255,.55)';x.lineWidth=2;for(let i=0;i<26;i++){const an=i*2.4+t*.3,u=(t*1.6+i*.37)%1,r1=S*(1.2-u),r2=r1-S*.18;x.globalAlpha=clamp(t-.3,0,1)*(1-u);x.beginPath();x.moveTo(cx+Math.cos(an)*r1,cy+Math.sin(an)*r1);x.lineTo(cx+Math.cos(an)*r2,cy+Math.sin(an)*r2);x.stroke()}x.restore();
 x.imageSmoothingEnabled=false;['can','cup','paper','fig','pad','can2','paper','fig'].forEach((k,j)=>{const u=clamp((t-.6-j*.18)/1.9,0,1);if(u<=0||u>=1)return;const an=j*.785+u*7,ra=(1-eIn(u))*S*.95,s=px*2*(1-u*.7);x.save();x.translate(cx+Math.cos(an)*ra,cy+Math.sin(an)*ra);x.rotate(u*12+j);x.drawImage(bMini(k),-4*s,-4*s,8*s,8*s);x.restore()});
 const u=clamp((t-.9)/2.5,0,1);if(u>0&&u<1){const sp=I.otk||(I.otk=drawChar(OTK,{b:0})),an=1.9+u*6.5,ra=Math.pow(1-u,1.4)*Math.min(L.W,L.H)*.42,s=px*2*Math.pow(1-u,.7),sx=s*(1-.65*u),sy=s*(1+1.6*u);x.save();x.translate(cx+Math.cos(an)*ra,cy+Math.sin(an)*ra);x.rotate(u*u*16);x.scale(sx,sy);x.drawImage(sp,-sp.width/2,-sp.height/2);x.restore()}
 const wc=clamp((t-2.9)/1.1,0,1);if(wc>0){const g=x.createRadialGradient(cx,cy,0,cx,cy,Math.max(1,S*1.6*wc));g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.7,'rgba(255,255,255,.85)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,L.W,L.H)}
 const wo=clamp((t-3.7)/.5,0,1);if(wo>0){x.fillStyle=`rgba(255,255,255,${wo})`;x.fillRect(0,0,L.W,L.H)}}
/* fond « entre deux mondes » (création du héros, roue) */
function drawVoid(x,I){const L=I.L,t=I.t,cx=L.W/2,cy=L.H*.45,px=Math.max(2,Math.round(Math.min(L.W,L.H)/200));const g=x.createRadialGradient(cx,cy,0,cx,cy,Math.max(L.W,L.H)*.8);g.addColorStop(0,'#3a2a7a');g.addColorStop(.5,'#1c1444');g.addColorStop(1,'#0b0a18');x.fillStyle=g;x.fillRect(0,0,L.W,L.H);
 const r=vrng(77);for(let i=0;i<120;i++){const a=r(6.283),sp=.08+r(.25),u=(t*sp+r())%1,ra=u*u*Math.max(L.W,L.H)*.8,s=u>.6?px*2:px;x.globalAlpha=Math.min(1,u*3)*.9;x.fillStyle=i%7?'#e9e4ff':pick(['#4de0c0','#ff7ad9','#ffcf4a']);x.fillRect(Math.round((cx+Math.cos(a)*ra)/px)*px,Math.round((cy+Math.sin(a)*ra)/px)*px,s,s)}x.globalAlpha=1;
 drawVortex(x,cx,cy,Math.min(L.W,L.H)*.5,t*.35,.14,px)}
/* ---------- boucle de l'intro ---------- */
function introSize(I){const st=$('#intro'),W=st.clientWidth||innerWidth,H=st.clientHeight||innerHeight,dpr=Math.min(2,devicePixelRatio||1),cv=$('#ic');if(cv.width!=Math.round(W*dpr)||cv.height!=Math.round(H*dpr)){cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr)}I.dpr=dpr;I.L=bdLayout(W,H);return cv.getContext('2d')}
function introFrame(ts){const I=INTRO;if(!I)return;requestAnimationFrame(introFrame);const dt=Math.min(.05,I.last?(ts-I.last)/1000:0);I.last=ts;I.t+=dt;const x=introSize(I);x.setTransform(I.dpr,0,0,I.dpr,0,0);x.imageSmoothingEnabled=false;const L=I.L;
 if(I.ph=='comic'||I.ph=='page'){I.pt+=dt;const tg=bdCamT(L,I.ph=='comic'?I.pi:-1);if(!I.cam)I.cam=Object.assign({},tg);const k=1-Math.exp(-dt*(I.ph=='page'?3:4.5));I.cam.x+=(tg.x-I.cam.x)*k;I.cam.y+=(tg.y-I.cam.y)*k;I.cam.s+=(tg.s-I.cam.s)*k;
  x.fillStyle='#0b0a18';x.fillRect(0,0,L.W,L.H);bdPage(x,I,1);
  if(I.ph=='comic'){if(I.wait>0){I.wait-=dt;if(I.wait<=0){I.wait=0;bdShowNext()}}bdType(I,dt);I.bubs.forEach(b=>bdBubPos(I,b,I.R));bdScreen(I,I.R,I.pt);const P=BDP[I.pi],last=!I.typing&&!I.wait&&I.bi>=P.b.length-1;$('#ihint').hidden=!(!I.typing&&!I.wait&&I.bi>=0);$('#ihint').textContent=last&&I.pi==BDP.length-1?'Touchez pour continuer ▸':'Touchez pour continuer ▾'}
  else{$('#ihint').hidden=true;if(I.pt>2.2)introSuck()}}
 else if(I.ph=='suck'){drawSuck(x,I);if(I.vb){I.vb.n=Math.min(I.vb.t.length,I.vb.n+dt*26);bdFinish0(I.vb);const el=I.vb.el;el.style.fontSize=clamp(L.W/30,16,24)+'px';el.style.transform=`translate(${Math.round(L.W/2-el.offsetWidth/2)}px,${Math.round(L.H*.78-el.offsetHeight/2)}px)`;el.style.opacity=clamp((3.6-I.t)/.4,0,1)}if(I.t>=4.25)I.o.create?heroStart():introOut()}
 else if(I.ph=='hero'||I.ph=='wheel'){drawVoid(x,I);if(I.ph=='hero')heroPrev(I);else wheelUpd(I,dt)}
 else x.clearRect(0,0,L.W,L.H);if(I.ph=='dlg')dlgUpd(I,dt)}
function bdFinish0(b){const s=b.t.slice(0,Math.floor(b.n));b.el.firstChild.textContent=s;b.el.children[1].textContent=b.t.slice(s.length);if(b.n>=b.t.length)b.el.classList.add('done')}
function startIntro(o={}){if(INTRO)return;closePanel();const e=$('#intro');e.hidden=false;e.className='';$('#iui').innerHTML='';$('#ibl').innerHTML='';$('#ifade').style.cssText='';INTRO={o,ph:'comic',pi:-1,t:0,pt:0,bubs:[],ev:{},wait:0};introCover=true;$('#iskip').hidden=false;bdNext();requestAnimationFrame(introFrame)}
function bdNext(){const I=INTRO;I.pi++;bdClearBubs();if(I.pi>=BDP.length){I.ph='page';I.pt=0;return}I.pt=0;I.bi=-1;I.ev={};I.typing=null;I.wait=.6}
function introTap(){const I=INTRO;if(!I)return;if(I.ph=='comic'){if(I.typing){bdFinish(I.typing);I.typing=null;const nx=BDP[I.pi].b[I.bi+1];if(nx&&nx.auto)I.wait=.2;return}if(I.wait>0){I.wait=0;bdShowNext();return}if(I.bi<BDP[I.pi].b.length-1){bdShowNext();return}bdNext()}else if(I.ph=='page')introSuck();else if(I.ph=='dlg')dlgTap();else if(I.ph=='wheel')wheelSpin()}
function introSuck(){const I=INTRO;bdClearBubs();I.ph='suck';I.t=0;$('#ihint').hidden=true;setTimeout(()=>{if(INTRO!=I||I.ph!='suck')return;const b=bdBub({k:'voice',t:'Bienvenue dans la Tour des Étoiles, Joueur 1.'});b.el.classList.add('vc');I.vb=b},1300)}
function introSkip(){const I=INTRO;if(!I)return;if(I.ph=='dlg')return dlgEnd();if(I.ph!='comic'&&I.ph!='page'&&I.ph!='suck')return;bdClearBubs();if(I.o.create)heroStart();else introOut()}
function flashW(){const f=$('#ifade');f.style.transition='none';f.style.background='#fff';f.style.opacity=1;void f.offsetWidth;f.style.transition='opacity .7s';f.style.opacity=0}
function introOut(){const I=INTRO;bdClearBubs();$('#iskip').hidden=true;const f=$('#ifade');I.ph='out';introCover=false;f.style.transition='none';f.style.background='#fff';f.style.opacity=1;$('#intro').className='clear';void f.offsetWidth;f.style.transition='opacity .8s';f.style.opacity=0;setTimeout(introEnd,820)}
function introEnd(){INTRO=null;introCover=false;const e=$('#intro');e.hidden=true;$('#iui').innerHTML='';$('#ibl').innerHTML='';$('#evo').classList.remove('top');hud();if(mode=='village')villageLabels()}
/* ---------- création du héros ---------- */
const HAIRS=['#2a2536','#6a4630','#e9d28a','#b8452f','#f0a03a','#e8e6f2','#f08fb4','#8a6ad0','#3a5fc0','#3f8f86','#101018','#9aa0b0'],SKINS=['#fbe6d6','#ffd9bd','#f6c8a4','#e0a880','#c98a62','#8a5a3a'],EYES=['#3aa0ff','#52d67a','#ff5d7a','#ffb43a','#a070ff','#40d0d0','#d04a4a','#6a4630'];
const HLOOKS=[['Otaku classique','#2a2536','#ffd9bd','#3aa0ff',0,0,0],['Protagoniste','#6a4630','#f6c8a4','#52d67a',4,0,0],['Héroïne pastel','#f08fb4','#fbe6d6','#ff5d7a',2,2,1],['Rival ténébreux','#e8e6f2','#e0a880','#d04a4a',5,5,0],['Intello','#8a6ad0','#ffd9bd','#ffb43a',9,1,3],['Baroudeur','#b8452f','#c98a62','#40d0d0',7,4,2]];
const HNAMES=['Kenji','Yuki','Léo','Sacha','Noa','Ren','Maxime','Lou','Hiro','Camille','Aki','Jules'];
function heroStart(){const I=INTRO;bdClearBubs();flashW();I.ph='hero';I.t=0;$('#iskip').hidden=true;$('#ihint').hidden=true;$('#intro').className='';
 if(!I.c){const L0=HLOOKS[0];I.c=mk(1,{name:pick(HNAMES),race:'Humain',mage:undefined,look:{hair:L0[1],skin:L0[2],eye:L0[3],style:L0[4],face:0,body:0,hue:0},eq:{arme:mkItem('epee',1,{el:null}),armure:null,outil:null},party:0,lock:1});upRole(I.c);I.rer=1;I.pr=0}
 heroUI()}
function heroUI(){const I=INTRO,c=I.c;ledBind(c,()=>{I.pk=null});
 const pc0=I.pr?`<div class="pcard"><div class="pin"><b class="g">${c.pers}</b> <span class="m">— ${PERS[c.pers]}</span><div>${c.subs.map(t=>`<span class="tg">${t}</span>`).join('')}</div><div class="m"><i>« ${LN[c.pers][0]} »</i></div></div></div>${I.rer?`<button class="alt" onclick="heroPers(1)">Relancer la personnalité (1 fois)</button>`:'<span class="m">Relance utilisée : c’est donc ça, ta vraie nature.</span>'}`:`<button class="hot2" onclick="heroPers(0)">Révéler ma personnalité</button>`;
 $('#iui').innerHTML=`<div class="hc px"><h2>Qui es-tu, joueur ?</h2><p class="m" style="text-align:center;margin:0 0 8px">Un humain de ton monde, arrivé dans la Tour : <b class="g">1★ · Joueur venu d’un autre monde</b>.</p>
 <div class="hct"><div class="hpv"><canvas id="hprev" width="32" height="30"></canvas></div><div class="hcf"><label class="m" for="hname">Nom du héros</label><div style="display:flex;gap:6px;margin:3px 0 8px"><input id="hname" class="hn" maxlength="14" value="${c.name}" autocomplete="off" spellcheck="false" oninput="heroName(this.value)"><button class="alt" onclick="heroRndName()" title="Nom au hasard">Au hasard</button></div>
 <div class="m">Allures toutes faites</div><div class="hps">${HLOOKS.map((p,i)=>`<button class="alt" onclick="heroPreset(${i})" title="${p[0]}"><img src="${heroMini(p)}" alt="${p[0]}"></button>`).join('')}</div></div></div>
 <div id="led">${ledHTML()}</div>
 <h3 class="sh">Personnalité</h3><div id="hpers">${pc0}</div><p style="text-align:center;margin:12px 0 0"><button id="hgo" ${I.pr?'':'disabled'} onclick="heroDone()">${I.pr?'Valider → Roue des talents':'Révèle d’abord ta personnalité'}</button></p></div>`}
function heroMini(p){const c=Object.assign({},INTRO.c,{look:{hair:p[1],skin:p[2],eye:p[3],style:p[4],face:p[5]|0,body:p[6]|0,hue:0}});return scaleC(drawChar(c,{b:0}),2).toDataURL()}
function heroPrev(I){const cv=$('#hprev');if(!cv)return;const fr=Math.floor(I.t*2)%2,k=JSON.stringify(I.c.look)+fr;if(I.pk==k)return;I.pk=k;const x=cv.getContext('2d');x.clearRect(0,0,32,30);x.drawImage(drawChar(I.c,{b:fr}),0,0)}
function heroPreset(i){const p=HLOOKS[i];Object.assign(INTRO.c.look,{hair:p[1],skin:p[2],eye:p[3],style:p[4],face:p[5]|0,body:p[6]|0});INTRO.pk=null;ledDraw()}
const heroClean=s=>(s||'').replace(/[^\p{L}\p{N} \-]/gu,'').replace(/\s+/g,' ').trim().slice(0,14);
function heroName(v){INTRO.c.name=heroClean(v)||INTRO.c.name}
function heroRndName(){const c=INTRO.c;c.name=pick(HNAMES.filter(n=>n!=c.name));$('#hname').value=c.name}
function heroPers(re){const I=INTRO,c=I.c;if(re){if(!I.rer)return;I.rer=0;c.pers=pick(Object.keys(PERS).filter(p=>p!=c.pers));c.subs=null;c.sub=undefined;c.gr=undefined;c.skills=undefined;c.cls=undefined;c.tree=undefined;c.job=undefined;initPers(c)}I.pr=1;heroUI();const e=$('.pcard');if(e)e.classList.add('flip')}
function heroDone(){const I=INTRO,v=$('#hname');if(v)I.c.name=heroClean(v.value)||I.c.name;wheelStart()}
/* ---------- roue des talents (pixel art, 168 px logiques) ---------- */
const WHW=[1.5,1.3,1,.85,.7];
function wheelSegs(){const hi=shuffle(TALK.filter(k=>TALENTS[k].r>=2)),lo=TALK.filter(k=>TALENTS[k].r<2),s=[];hi.forEach((k,i)=>{s.push(k);s.push(lo[i%lo.length])});const tot=s.reduce((a,k)=>a+WHW[TALENTS[k].r],0);let a=0;return s.map(k=>{const w=WHW[TALENTS[k].r]/tot*Math.PI*2,o={k,a,w,c:[h2r(sh(RARC[TALENTS[k].r],.3)),h2r(RARC[TALENTS[k].r]),h2r(sh(RARC[TALENTS[k].r],-.32))]};a+=w;return o})}
const TAU=Math.PI*2,md=(v,m)=>((v%m)+m)%m;
function wheelStart(){const I=INTRO;I.ph='wheel';const W=I.wh={segs:wheelSegs(),R:rnd(0,TAU),st:'idle',t:0,flap:0,seg:-1,parts:[],shake:0};const sz=168;
 $('#iui').innerHTML=`<div class="whl"><h2>Roue des talents</h2><div class="bub voice vs">${frT('Chaque joueur reçoit un talent inné. Tourne la roue… et accepte ton destin.')}</div><div class="wwr"><canvas id="wcv" width="${sz}" height="${sz}"></canvas></div><div class="wtk"><b id="wtn">—</b><span id="wtr"></span></div><div class="wsy"><img src="${scaleC(drawChar(I.c,{b:0}),2).toDataURL()}" alt=""><div id="wsay" class="bub say up" style="--tx:12%" hidden></div></div><button id="wgo" onclick="wheelSpin()">Lancer la roue !</button></div>`;
 W.px=new Float32Array(sz*sz*2);for(let y=0;y<sz;y++)for(let x=0;x<sz;x++){const dx=x+.5-sz/2,dy=y+.5-sz/2-2;W.px[(y*sz+x)*2]=Math.hypot(dx,dy);W.px[(y*sz+x)*2+1]=Math.atan2(dy,dx)}W.id=$('#wcv').getContext('2d').createImageData(sz,sz);wheelFit()}
function wheelFit(){const c=$('#wcv');if(!c)return;const W=INTRO.L?INTRO.L.W:innerWidth,H=INTRO.L?INTRO.L.H:innerHeight,k=Math.max(1,Math.min((W-36)/168,(H-300)/168,3));const kk=k>=2?Math.floor(k*2)/2:k;c.style.width=c.style.height=Math.round(168*kk)+'px'}
const wPtr=R=>md(-Math.PI/2-R,TAU),wSegAt=(W,p)=>{for(let i=0;i<W.segs.length;i++){const s=W.segs[i];if(p>=s.a&&p<s.a+s.w)return i}return W.segs.length-1};
function wSay(t){const e=$('#wsay');if(!e)return;e.hidden=false;e.classList.remove('pop');void e.offsetWidth;e.classList.add('pop');e.textContent=frT(t)}
function wheelSpin(){const I=INTRO,W=I.wh;if(!W||W.st!='idle')return;$('#wgo').disabled=true;$('#wgo').textContent='…';W.tal=talentRoll();const n=W.segs.length,ti=W.segs.findIndex(s=>s.k==W.tal),lo=W.segs[(ti+1)%n],tg=W.segs[ti];
 const pA=lo.a+lo.w*.16,pC=tg.a+tg.w*.5;W.R0=W.R;W.RA=W.R+TAU*6+md((-Math.PI/2-pA)-W.R,TAU);W.RC=W.RA+md((-Math.PI/2-pC)-W.RA,TAU);W.st='spin';W.t=0;W.said=0;wSay('Allez, la roue… viens à moi !')}
function wheelUpd(I,dt){const W=I.wh;if(!W)return;wheelFit();W.t+=dt;const TA=5.2,TB=1.2,TC=1.7;
 if(W.st=='idle')W.R+=dt*.25;else if(W.st=='spin'){const t=W.t;if(t<TA)W.R=W.R0+(W.RA-W.R0)*(1-Math.pow(1-t/TA,4));else if(t<TA+TB){W.R=W.RA+Math.sin((t-TA)*18)*.004*(1-(t-TA)/TB);if(W.said<1){W.said=1;wSay('… '+RARN[TALENTS[W.segs[W.seg].k].r]+'. Évidemment. Toujours ma chance.')}}
  else if(t<TA+TB+TC){if(W.said<2){W.said=2;wSay('Hein ? Elle… bouge encore ?!')}W.R=W.RA+(W.RC-W.RA)*eIO((t-TA-TB)/TC);W.shake=1.5}else{W.R=W.RC;W.st='win';W.t=0;W.shake=6;const cx=84,cy=8;for(let i=0;i<50;i++){const a=rnd(0,TAU),v=rnd(20,90);W.parts.push({x:cx,y:cy+30,vx:Math.cos(a)*v,vy:Math.sin(a)*v-30,l:rnd(.6,1.3),c:pick([RARC[TALENTS[W.tal].r],'#ffcf4a','#fff'])})}}}
 else if(W.st=='win'&&W.t>1.1&&!W.rev){W.rev=1;talReveal()}
 const sg=wSegAt(W,wPtr(W.R));if(sg!=W.seg){if(W.seg>=0&&W.st!='idle'){W.flap=1;for(let i=0;i<3;i++)W.parts.push({x:84+rnd(-3,3),y:12,vx:rnd(-30,30),vy:rnd(-40,-10),l:rnd(.2,.4),c:'#ffcf4a'});if(W.st=='spin'&&W.t>TA)W.shake=Math.max(W.shake,3)}W.seg=sg;const T=TALENTS[W.segs[sg].k];$('#wtn').textContent=T.n;$('#wtn').style.color=RARC[T.r];$('#wtr').textContent=RARN[T.r]}
 W.flap=Math.max(0,W.flap-dt*6);W.shake=Math.max(0,W.shake-dt*8);const c=$('#wcv');if(c)c.style.transform=W.shake>.2?`translate(${rnd(-W.shake,W.shake).toFixed(1)}px,${rnd(-W.shake,W.shake).toFixed(1)}px)`:'';wheelDraw(W)}
function wheelDraw(W){const c=$('#wcv');if(!c)return;const x=c.getContext('2d'),sz=168,R=72,d=W.id.data,P=W.px,n=W.segs.length,LUT=new Int8Array(720),win=W.st=='win'?W.segs.findIndex(s=>s.k==W.tal):-1,pul=win>=0?.5+.5*Math.sin(W.t*12):0,fr=Math.floor(performance.now()/60);
 for(let i=0;i<720;i++){const a=md(i/720*TAU,TAU);LUT[i]=wSegAt(W,a)}
 for(let i=0,j=0;i<sz*sz;i++,j+=4){const r=P[i*2];if(r>R+7){d[j+3]=0;continue}let col;
  if(r>R+1){col=r>R+5.5||r<R+2.2?[255,207,74]:[58,42,90]}else if(r>R){col=[29,20,48]}else if(r<9){col=r>7.6?[29,20,48]:r<4?[255,246,192]:[255,207,74]}
  else{const ang=md(P[i*2+1]-W.R,TAU),si=LUT[Math.floor(ang/TAU*720)%720],s=W.segs[si],db=Math.min(ang-s.a,s.a+s.w-ang)*r;if(db<.9&&db>=0)col=[29,20,48];else{col=r>R-3?s.c[2]:r<R*.42?s.c[0]:s.c[1];if(r>R*.42&&r<R*.47&&(i+Math.floor(i/sz))%2)col=s.c[0];if(TALENTS[s.k].r==4&&(i*7+fr*13)%173==0)col=[255,255,255];if(si==win){const k=pul*.55;col=[col[0]+(255-col[0])*k,col[1]+(255-col[1])*k,col[2]+(255-col[2])*k]}}}
  d[j]=col[0];d[j+1]=col[1];d[j+2]=col[2];d[j+3]=255}
 x.putImageData(W.id,0,0);const cx=84,cy=86;
 W.segs.forEach((s,si)=>{const a=s.a+s.w/2+W.R,q=s.w*R*.68>=14?2:1,ix=Math.round(cx+Math.cos(a)*R*.68-3.5*q),iy=Math.round(cy+Math.sin(a)*R*.68-3.5*q),ic=TALENTS[s.k].ic;ic.forEach((row,j)=>{for(let i=0;i<7;i++)if(row[i]=='X'){x.fillStyle='rgba(20,10,40,.45)';x.fillRect(ix+i*q+1,iy+j*q+1,q,q);x.fillStyle=si==win&&pul>.5?'#fff6c0':'#ffffff';x.fillRect(ix+i*q,iy+j*q,q,q)}})});
 for(let i=0;i<20;i++){const a=i/20*TAU,on=W.st=='win'?Math.floor(W.t*10)%2==0:W.st=='spin'?(i+Math.floor(W.t*14))%3==0:(i+Math.floor(performance.now()/300))%4==0;x.fillStyle=on?'#fff6c0':'#8a6a30';x.fillRect(Math.round(cx+Math.cos(a)*(R+4))-1,Math.round(cy+Math.sin(a)*(R+4))-1,2,2)}
 const tip=Math.round(-W.flap*4);for(let j=0;j<11;j++){const hw=Math.round((11-j)/2),ox=Math.round(tip*j/10);x.fillStyle=OLC;x.fillRect(cx-hw-1+ox,4+j,hw*2+2,1);x.fillStyle=j<2?'#fff6c0':'#ff5a5a';x.fillRect(cx-hw+ox,4+j,hw*2,1)}x.fillStyle=OLC;x.fillRect(cx-1+tip,15,2,1);
 for(let i=W.parts.length-1;i>=0;i--){const p=W.parts[i];p.l-=1/60;if(p.l<=0){W.parts.splice(i,1);continue}p.x+=p.vx/60;p.y+=p.vy/60;p.vy+=60/60;x.fillStyle=p.c;x.fillRect(Math.round(p.x),Math.round(p.y),p.l>.3?2:1,p.l>.3?2:1)}}
const TLINE=['','','… Attends, c’est RARE ?!','ÉPIQUE ?! Sérieusement ?!','LÉ-GEN-DAIRE ?! … Comme par hasard.'];
function talReveal(){const I=INTRO,k=I.wh.tal,T=TALENTS[k];$('#evo').classList.add('top');evoReveal({img:scaleC(talBadge(k),4).toDataURL(),col:RARC[T.r],title:'TALENT '+RARN[T.r].toUpperCase()+' !',name:T.n,from:0,to:T.r+1,small:1,btn:'Entrer dans la Tour',
  lines:[`<b style="color:${RARC[T.r]}">${RARN[T.r]}</b> · talent inné de ${I.c.name}`,T.d,`<span class="ihl"><b>${I.c.name}</b> — « ${frT(TLINE[T.r])} »</span>`,`<span class="m"><i>${frT('Voix : « Comme par hasard, oui. »')}</i></span>`]});const b=$('#evo button');if(b)b.onclick=heroFinish}
/* le héros rejoint la partie (nouvelle ou ancienne sauvegarde sans héros : rien n'est effacé) */
function heroFinish(){const I=INTRO,c=I.c;if(!c||I.done)return;I.done=1;const e=$('#evo');e.hidden=true;e.innerHTML='';e.classList.remove('top');
 c.tal=I.wh.tal;c.hero=1;c.lock=1;if(!G.t0)G.t0=Date.now();G.v_perma=1;G.chars.forEach(o=>{if(o.party)o.party++;if(o.party>4)o.party=0});c.party=1;G.chars.unshift(c);reidx();relSeed();G.intro=1;for(const k in CS)if(k.startsWith(c.id+':'))delete CS[k];
 V.p.x=V.px;V.p.y=V.py+40;V.p.d=1;enterVillage();const j=G.chars.find(o=>o.sig&&o.name=='Jeanne');const n=j&&V.npc.find(o=>o.c==j);if(n){n.x=V.p.x+24;n.y=V.p.y-2;n.tx=null;n.w=14;n.d=-1}
 I.ph='dlg';$('#iui').innerHTML='';const f=$('#ifade');f.style.transition='none';f.style.background='#fff';f.style.opacity=1;$('#intro').className='clear';introCover=false;void f.offsetWidth;f.style.transition='opacity 1.1s';f.style.opacity=0;
 const tn=TALENTS[c.tal],L=[];if(j){L.push(['j','Hé, toi ! Tu viens de tomber du portail… la tête la première.'],['h','Aïe… Où suis-je ? C’est pas ma chambre, ça.'],['j','Au pied de la Tour des Étoiles. Je suis Jeanne, commandante de ce village.'],['j','Ces habits étranges, cet air perdu… Tu viens d’un autre monde. Les anciens appelaient ça un « joueur ».'],
  ['h',`Un joueur 1★… Génial. Mais j’ai eu un talent ${RARN[tn.r].toLowerCase()} : ${tn.n} !`],['j',tn.r>=4?`${tn.n} ? Légendaire… Je n’en avais jamais vu. La Tour ne choisit personne au hasard.`:`${tn.n} ? Voilà qui est rare. La Tour ne choisit personne au hasard.`],
  ['j','Bien. À partir d’aujourd’hui, tu es notre capitaine. Je marcherai à tes côtés — et je te protégerai.'],['j','Mais retiens bien ceci : dans la Tour, la mort est définitive. Si tu tombes pour de bon, tout s’arrête. Pour toi… et pour nous.'],['j','Première leçon : sans toit, pas de compagnons. Bâtis une Auberge sur un terrain libre : approche-toi d’un panneau.'],['j','Ensuite, nous invoquerons des recrues. Le premier 1★ te montrera comment transmettre son expérience… mais rien ne t’oblige à sacrifier qui que ce soit.'])}
 else L.push(['h',`Me voilà dans la Tour des Étoiles… Talent : ${tn.n}. À moi de jouer !`]);
 I.dl={L,i:-1,c,j};$('#iskip').hidden=true;setTimeout(()=>{if(INTRO==I)dlgNext()},700)}
/* ---------- dialogue d'accueil (boîte en bas, portrait, texte tapé) ---------- */
function dlgNext(){const I=INTRO,D=I.dl;D.i++;if(D.i>=D.L.length)return dlgEnd();const[w,t]=D.L[D.i],c=w=='j'?D.j:D.c;$('#iui').innerHTML=`<div class="dlg px"><img src="${cs(c).url}" alt=""><div class="dgt"><b class="g">${c.name}</b><p><span class="v"></span><span class="h">${frT(t)}</span><i class="cur">▼</i></p></div><button class="alt dsk" onclick="dlgEnd()">Passer ▸▸</button></div>`;D.t=frT(t);D.n=0;D.done=0}
function dlgUpd(I,dt){const D=I.dl;if(!D||D.i<0||D.done)return;D.n=Math.min(D.t.length,D.n+dt*42);const p=$('.dlg p');if(!p)return;const s=D.t.slice(0,Math.floor(D.n));p.firstChild.textContent=s;p.children[1].textContent=D.t.slice(s.length);if(D.n>=D.t.length){D.done=1;p.classList.add('done')}}
function dlgTap(){const I=INTRO,D=I&&I.dl;if(!D||D.i<0)return;if(!D.done){D.n=D.t.length;return}dlgNext()}
function dlgEnd(){const I=INTRO;if(!I)return;G.intro=1;save();introEnd();toast('Objectif : bâtissez une Auberge sur un terrain libre (approchez d’un panneau).',4200)}
function replayIntro(){closePanel();startIntro({create:!heroOf()})}
