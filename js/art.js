'use strict';
/* ================= PIXEL ART ================= */
const mkc=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c};
const h2r=h=>{const n=parseInt(h.slice(1),16);return[n>>16,n>>8&255,n&255]},r2h=(r,g,b)=>'#'+((1<<24)|(r<<16)|(g<<8)|b).toString(16).slice(1);
function hsl(h,s,l){const a=s*Math.min(l,1-l),f=n=>{const k=(n+h/30)%12;return Math.round(255*(l-a*Math.max(-1,Math.min(k-3,9-k,1))))};return r2h(f(0),f(8),f(4))}
function toHsl(hex){let[r,g,b]=h2r(hex).map(v=>v/255);const mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2;let h=0,s=0;if(mx!=mn){const d=mx-mn;s=l>.5?d/(2-mx-mn):d/(mx+mn);h=mx==r?(g-b)/d+(g<b?6:0):mx==g?(b-r)/d+2:(r-g)/d+4;h*=60}return[h,s,l]}
/* ombre teintée vers le bleu-violet, lumière vers le jaune : palette plus riche qu'un simple assombrissement */
function sh(hex,k){let[h,s,l]=toHsl(hex);const t=k<0?255:50,dh=((t-h+540)%360)-180;h=(h+dh*Math.min(.22,Math.abs(k)*.45)+360)%360;if(k<0){l*=1+k;s=Math.min(1,s*1.1)}else{l+=(1-l)*k;s*=1-k*.25}return hsl(h,s,l)}
const hue=(hex,d)=>{const[h,s,l]=toHsl(hex);return hsl((h+d+360)%360,s,l)};
const OLC='#1d1430';
function SG(w,h){const m=new Uint8Array(w*h),t=new Uint8Array(w*h),g={w,h,m,t,
 p(x,y,id,tn){x|=0;y|=0;if(x<0||y<0||x>=w||y>=h)return;m[y*w+x]=id;t[y*w+x]=tn||0},
 r(x,y,ww,hh,id,tn){for(let j=0;j<hh;j++)for(let i=0;i<ww;i++)g.p(x+i,y+j,id,tn)},
 row(y,a,b,id,tn){for(let x=a;x<=b;x++)g.p(x,y,id,tn)},
 e(cx,cy,rx,ry,id,tn,di){for(let y=Math.ceil(cy-ry);y<=cy+ry;y++)for(let x=Math.ceil(cx-rx);x<=cx+rx;x++){const dx=(x-cx)/rx,dy=(y-cy)/ry;if(dx*dx+dy*dy<=1&&(!di||(x+y)%2==0)&&(id||g.at(x,y)))g.p(x,y,id||g.at(x,y),tn)}},
 at(x,y){return x<0||y<0||x>=w||y>=h?0:m[y*w+x]},
 tone(cx,cy,rx,ry,tn,di){for(let y=Math.ceil(cy-ry);y<=cy+ry;y++)for(let x=Math.ceil(cx-rx);x<=cx+rx;x++){const dx=(x-cx)/rx,dy=(y-cy)/ry;if(dx*dx+dy*dy<=1&&g.at(x,y)&&(!di||(x+y)%2==0))t[y*w+x]=tn}}};return g}
/* tons : 0 auto (lumière en haut, ombre en bas et à droite du contour), 1 clair, 2 base, 3 sombre, 4 très sombre */
function bake(g,pal){const{w,h,m,t}=g,c=mkc(w+2,h+2),x=c.getContext('2d'),cache={},col=(id,tn)=>cache[id*8+tn]||(cache[id*8+tn]=tn==1?sh(pal[id],.27):tn==3?sh(pal[id],-.27):tn==4?sh(pal[id],-.5):pal[id]);
 for(let j=0;j<h;j++)for(let i=0;i<w;i++){const id=m[j*w+i];if(!id)continue;let tn=t[j*w+i];if(!tn)tn=(!g.at(i,j+1)||!g.at(i+1,j))?3:!g.at(i,j-1)?1:2;x.fillStyle=col(id,tn);x.fillRect(i+1,j+1,1,1)}
 x.fillStyle=OLC;for(let j=-1;j<=h;j++)for(let i=-1;i<=w;i++)if(!g.at(i,j)&&(g.at(i+1,j)||g.at(i-1,j)||g.at(i,j+1)||g.at(i,j-1)))x.fillRect(i+1,j+1,1,1);return c}
function tintC(s,color){const c=mkc(s.width,s.height),x=c.getContext('2d');x.drawImage(s,0,0);x.globalCompositeOperation='source-in';x.fillStyle=color;x.fillRect(0,0,c.width,c.height);return c}
function glowC(s){const c=mkc(s.width+2,s.height+2),x=c.getContext('2d'),wh=tintC(s,'#fff');[[0,1],[2,1],[1,0],[1,2]].forEach(([a,b])=>x.drawImage(wh,a,b));x.drawImage(s,1,1);return c}
function scaleC(s,k){const c=mkc(s.width*k,s.height*k),x=c.getContext('2d');x.imageSmoothingEnabled=false;x.drawImage(s,0,0,c.width,c.height);return c}
/* ---------- personnages ---------- */
function look(c){let s=c.seed||7;const r=n=>{s=(s*9301+49297)%233280;return Math.floor(s/233280*n)};const HAIR=['#2a2536','#e9d28a','#b8452f','#e8e6f2','#3f8f86','#f08fb4','#6a4630','#8a6ad0','#3a5fc0','#f0a03a'],SKIN=['#ffd9bd','#f6c8a4','#e0a880','#fbe6d6','#c98a62'],EYE=['#3aa0ff','#ff5d7a','#52d67a','#ffb43a','#a070ff','#40d0d0','#d04a4a'];
 let skin=SKIN[r(5)];if(c.race=='Gobelin')skin='#8fcf6a';if(c.race=='Orc')skin='#7fae6a';return{skin,hair:HAIR[r(10)],eye:EYE[r(7)],style:c.race=='Gobelin'?1:r(6),hue:r(40)-20}}
const SK=1,HR=2,EY=3,MA=4,SE=5,AC=6,ME=7,LE=8,WH=9,DK=10,WD=11,BL=12,GD=13,BS=14,GL=15,CP=16,D2=17,CO=18,C1=19;
/* cosmétiques du héros : teintes de tenue (L.tn), couleurs de cape (L.cape) et d'accessoire (L.acc) */
const TNC=[null,'#c03a3a','#2f9a5a','#2a2a48','#d0a030','#e070b0','#f2f2f6'],CAPC=[null,'#b02a3a','#2a2048','#e0b040'],ACCC=[null,'#d03a3a','#e0b040','#4fae4f','#3a5fc0','#3a2a40','#fff3a0',null];
const mixH=(a,b,k)=>{const A=h2r(a),B=h2r(b);return r2h(...A.map((v,i)=>Math.round(v+(B[i]-v)*k)))};
function charPal(c,L){const rc=({guerrier:['#b9c4d8','#3558b8'],gardien:['#8791a8','#8a3a3a'],assassin:['#34304a','#c0392b'],archer:['#3f8f52','#7a5a36'],sorcier:['#6a48b8','#e0b040'],soigneur:['#f2ecdd','#3fb0a0'],soutien:['#2c3458','#c0392b']}[c.role]||['#b9c4d8','#3558b8']).slice(),tn=TNC[L.tn|0];if(tn){rc[0]=mixH(rc[0],tn,.6);rc[1]=mixH(rc[1],sh(tn,-.25),.7)}const metal=c.role=='guerrier'||c.role=='gardien',E=ELEMS[c.elem].c;
 return[null,L.skin,L.hair,L.eye,metal?rc[0]:hue(rc[0],L.hue),metal?hue(rc[1],L.hue*4):rc[1],E,'#c9d2e2','#5a3d2e','#ffffff','#241a30','#8a5a34','#e6edf7',c.st>=5?'#ffd75a':'#e0b040','#ff9a9a',sh(E,.4),sh(E,-.3),'#2a2438',CAPC[L.cape|0]||'#b02a3a',ACCC[L.acc|0]||L.hair]}
/* races rares du tirage du héros (docs/intro.md §7) : teint et yeux imposés */
const RSKIN={'Démon':['#8a3a52','#ff3a3a'],'Mort-vivant':['#9fb4a0','#c8ff6a']};
function drawChar(c,fr){const L0=c.look||look(c),RS=RSKIN[c.race],L=RS?Object.assign({},L0,{skin:RS[0],eye:RS[1]}):L0,g=SG(30,28),R=c.role,b=fr.b||0,hs=L.style|0,fc=L.face|0,bd=L.body|0,sm=(c.race=='Nain'||c.race=='Gobelin'||bd==3)?2:0,o=b+sm,big=c.race=='Orc'||bd==2?1:bd==1?-1:0,at=fr.at||0,robe=R=='sorcier'||R=='soigneur',metal=R=='guerrier'||R=='gardien',x0=10-big,x1=19+big;
 if(c.st>=4&&!(L.cape>0&&L.cape<3))for(let y=16;y<=25;y++)g.row(y+b,8-big-(y>21?1:0),21+big+(y>21?1:0),CP,y>23?3:2);
 if(L.style==2)for(let y=8;y<=21;y++)g.row(y+o,7,22,HR,y>19?3:0);
 if(L.style==3)[[5,6],[4,7],[3,8],[3,9],[3,10],[3,11],[4,12],[4,13],[5,14],[5,15],[6,16]].forEach(([x,y],i)=>g.r(x,y+o,3,1,HR,i>7?3:i<2?1:0));
 if(L.style==5)for(let y=8;y<=19;y++){const d=y<12?0:1,e=y>17?1:0;g.r(5-d+e,y+o,3,1,HR,y>17?3:0);g.r(22+d-e,y+o,3,1,HR,y>17?3:0)}
 if(hs==7){[[21,4],[22,5],[23,6],[23,7],[24,8],[24,9],[24,10],[24,11],[23,12],[23,13]].forEach(([x,y],i)=>g.r(x,y+o,2,1,HR,i>7?3:i<2?1:0));g.p(22,5+o,AC,2)}
 if(hs==10){g.e(14.5,6+o,9.5,6.5,HR,0);g.tone(12,2+o,4,2,1)}
 const cpC=[0,'#b02a3a','#2a2048','#e0b040'][L.cape|0];if(cpC&&L.cape<3)for(let y=15;y<=25;y++)g.row(y+b,8-big-(y>21?1:0),21+big+(y>21?1:0),CO,y>23?3:y<17?1:2);
 /* ailes (Ange, Fée, Démon), derrière le corps */
 const wing=(W,col)=>W.forEach(([x,y,w],i)=>{g.r(x,y+o,w,1,col,i<2?1:i>W.length-3?3:2);g.r(30-x-w,y+o,w,1,col,i<2?1:i>W.length-3?3:2)});
 if(c.race=='Ange')wing([[3,11,3],[2,12,5],[2,13,6],[2,14,7],[3,15,6],[3,16,6],[4,17,5],[5,18,4],[6,19,3],[7,20,2]],WH);
 if(c.race=='Fée')wing([[4,9,3],[3,10,4],[3,11,5],[4,12,5],[6,13,3],[6,15,3],[5,16,4],[4,17,4],[5,18,3]],GL);
 if(c.race=='Démon')wing([[2,9,1],[2,10,2],[3,11,3],[3,12,5],[4,13,5],[3,14,6],[5,15,4],[4,16,4],[6,17,2]],D2);
 if(c.race=='Démon'){[[23,20],[24,19],[25,18],[25,17],[26,16]].forEach(([x,y])=>g.r(x,y+o,1,1,D2,2));g.r(26,14+o,2,2,D2,1);g.p(27,13+o,D2,1)}
 if(c.race=='Dragonide'){[[22,21],[23,21],[24,20],[25,19],[26,18],[26,17]].forEach(([x,y],i)=>g.r(x,y+o,i<2?2:1,2,AC,i%2?3:2))}
 if(R=='archer'){g.r(5,13+o,3,8,LE);g.p(5,12+o,WH,2);g.p(7,12+o,WH,2);g.p(6,11+o,WH,2)}
 if(c.race=='Homme-bête')[[23,20],[24,19],[25,18],[25,17],[24,16]].forEach(([x,y])=>g.r(x,y+o,2,1,HR));
 const legC=metal?ME:R=='archer'?SE:R=='soutien'||R=='assassin'?D2:MA;
 [[11,1],[16,2]].forEach(([x,s])=>{const up=fr.st==s?1:0;if(!robe)g.r(x,22+sm,3,3-sm,legC,0);g.r(x-(s==1?1:0),25-up,4,3,metal?ME:LE,metal?3:0)});
 g.row(15+o,12,17,MA);g.row(15+o,13,16,SK,3);for(let y=16;y<=21;y++)g.row(y+o,x0,x1,MA);
 for(let y=16;y<=20;y++){g.r(x0-2,y+o,2,1,MA);g.r(x1+1,y+o,2,1,MA)}g.r(x0-2,20+o,2,2,SK);g.r(x1+1,20+o,2,2,SK);
 if(metal){g.row(17+o,12,14,MA,1);g.p(12,18+o,MA,1);g.row(19+o,x0,x1,MA,3);g.row(20+o,x0,x1,LE,2);g.p(14,20+o,GD,2);g.p(15,20+o,GD,2);
  for(let y=21;y<=24-sm;y++)g.row(y+o,x0-(y>22?1:0),x1+(y>22?1:0),SE,y==24-sm?3:0);g.r(14,21+o,2,3-sm,SE,1);
  g.r(x0-3,15+o,3,3,MA,0);g.row(15+o,x0-3,x0-1,MA,1);g.r(x1+1,15+o,3,3,MA,0);g.row(15+o,x1+1,x1+3,MA,1);g.r(x0-2,19+o,2,2,MA,3);g.r(x1+1,19+o,2,2,MA,3);if(R=='gardien'){g.row(15+o,11,18,MA,1);g.row(16+o,12,17,MA,3)}}
 else if(R=='assassin'){g.row(15+o,10,19,SE);g.row(16+o,10,19,SE,3);[[7,16],[6,17],[6,18],[5,19],[5,20],[6,21],[5,22]].forEach(([x,y],i)=>g.r(x,y+o,2,1,SE,i>4?3:0));g.row(20+o,x0,x1,LE,2);g.row(18+o,11,13,MA,1)}
 else if(R=='archer'){[[11,16],[12,17],[14,18],[15,19],[17,20]].forEach(([x,y])=>g.r(x,y+o,2,1,LE,2));g.row(20+o,x0,x1,LE,2);for(let y=21;y<=22;y++)g.row(y+o,x0-1,x1+1,MA,y==22?3:0);g.row(16+o,11,13,MA,1)}
 else if(robe){for(let y=20;y<=26;y++){const d=y<22?0:y<25?1:2;g.row(Math.min(27,y+o),x0-d,x1+d,MA,0)}g.row(Math.min(27,26+o),x0-2,x1+2,SE,2);for(let y=16;y<=25;y++)g.r(14,Math.min(26,y+o),2,1,SE,y%3==0?1:2);
  for(let y=17;y<=20;y++){g.p(x0-3,y+o,MA);g.p(x1+3,y+o,MA)}g.r(x0-3,20+o,3,1,SE,2);g.r(x1+1,20+o,3,1,SE,2);if(R=='soigneur'){g.row(15+o,8,21,SE,0);g.row(16+o,8,21,SE,3)}g.r(11,27,2,1,LE);g.r(17,27,2,1,LE)}
 else{g.r(x0-2,15+o,3,2,GD,0);g.r(x1,15+o,3,2,GD,0);[17,19].forEach(y=>{g.p(13,y+o,GD,2);g.p(16,y+o,GD,2)});g.row(20+o,x0,x1,GD,2);for(let y=21;y<=23;y++){g.row(y+o,x0-1,x1+1,MA,0);g.p(x0-1,y+o,SE,2);g.p(x1+1,y+o,SE,2)}g.r(14,21+o,2,3,D2,2);g.row(16+o,11,13,MA,1)}
 if(c.st>=5){g.p(x0-1,16+o,GD,2);g.p(x1+1,16+o,GD,2)}
 const HS=[[11,18],[9,20],[8,21],[8,21],[8,21],[8,21],[8,21],[8,21],[8,21],[8,21],[9,20],[10,19]];
 HS.forEach(([a,z],i)=>g.row(3+i+o,a,z,SK,i==5?3:i>9?0:2));g.p(8,12+o,SK,3);g.p(21,12+o,SK,3);
 if(hs==8){for(let i=0;i<5;i++)g.row(3+i+o,12,17,HR,0);for(let y=0;y<3;y++)g.row(y+o,13,16,HR,y==0?1:0)}else if(hs==11){for(let i=0;i<4;i++)for(let x=HS[i][0];x<=HS[i][1];x++)if((x+i)%2)g.p(x,3+i+o,HR,3)}else for(let i=0;i<5;i++)g.row(3+i+o,HS[i][0],HS[i][1],HR,0);
 const side=hs==4?13:hs==2||hs==10?12:hs==6?9:hs==8||hs==11?7:11;for(let y=8;y<=side;y++){g.r(8,y+o,2,1,HR,y==side?3:0);g.r(20,y+o,2,1,HR,y==side?3:0)}
 ([[10,11,12,13,17,18,19],[10,11,13,14,16,18,19],[10,11,12,13,14,15,16,17,18,19],[10,11,12,13,14,15],[10,11,12,13,14,15,16,17,18,19],[10,11,12,17,18,19],[10,11,18,19],[10,11,12,13,14,18,19],[13,14,15,16],[10,11,12,13,16,17,18,19],[10,11,12,13,16,17,18,19],[]][hs]||[]).forEach(x=>g.p(x,8+o,HR,2));
 ([[10,12,19],[10,13,19],[10,11,18,19],[10,11,12],[10,19],[10,19],[],[10,11,19],[],[10,19],[10,19],[]][hs]||[]).forEach(x=>g.p(x,9+o,HR,3));
 if(hs==11){}else if(hs==8){g.p(14,1+o,HR,1);g.p(14,4+o,HR,1);g.p(15,5+o,HR,1);g.row(7+o,12,17,HR,3)}else{g.row(4+o,12,16,HR,1);g.row(5+o,10,11,HR,1);g.p(18,5+o,HR,1);g.p(19,6+o,HR,1);g.row(7+o,9,11,HR,3);g.row(7+o,18,20,HR,3)}
 if(hs==9)[8,21].forEach(x=>{g.e(x,3+o,2.2,2.2,HR,0);g.p(x-1,2+o,HR,1);g.p(x+(x<12?2:-2),4+o,AC,2)})
 if(L.style==1)[[7,6],[22,5],[10,2],[14,2],[15,2],[19,2],[23,8],[6,9],[12,1]].forEach(([x,y])=>g.p(x,y+o,HR,0));
 if(L.style==4){g.p(7,12+o,HR);g.p(22,12+o,HR);g.p(7,13+o,HR,3);g.p(22,13+o,HR,3)}
 [11,17].forEach(ex=>{g.r(ex,9+o,2,1,DK,2);g.p(ex,10+o,EY,2);g.p(ex+1,10+o,WH,2);g.p(ex,11+o,EY,3);g.p(ex+1,11+o,EY,1)});
 g.p(14,13+o,SK,3);g.p(15,13+o,SK,3);g.p(10,12+o,BS,2);g.p(19,12+o,BS,2);
 /* visages (héros personnalisé) : 1 lunettes · 2 taches de rousseur · 3 cicatrice · 4 barbe · 5 regard perçant */
 if(fc==1){[[10,13],[16,19]].forEach(([a,z])=>{g.row(9+o,a,z,DK,2);g.row(12+o,a,z,DK,2);[10,11].forEach(y=>{g.p(a,y+o,DK,2);g.p(z,y+o,DK,2)})});g.row(10+o,14,15,DK,2);g.p(9,10+o,DK,2);g.p(20,10+o,DK,2);g.p(11,10+o,WH,2);g.p(17,10+o,WH,2)}
 else if(fc==2){[[10,12],[11,13],[12,12],[17,12],[18,13],[19,12]].forEach(([x,y])=>g.p(x,y+o,LE,1));g.p(13,13+o,SK,3);g.p(16,13+o,SK,3);g.p(14,14+o,SK,4);g.p(15,14+o,SK,4)}
 else if(fc==3){[[20,9],[19,10],[19,11],[18,12],[17,13]].forEach(([x,y])=>g.p(x,y+o,BS,3));g.p(11,8+o,DK,2);g.p(17,8+o,DK,2)}
 else if(fc==4){g.row(12+o,13,16,HR,2);g.row(13+o,9,20,HR,2);g.row(14+o,10,19,HR,3);g.row(15+o,13,16,HR,3);[8,9,20,21].forEach(x=>g.p(x,12+o,HR,3));g.p(14,13+o,SK,3);g.p(15,13+o,SK,3)}
 else if(fc==5){[11,17].forEach(ex=>{g.r(ex,11+o,2,1,SK,2);g.p(ex,10+o,EY,2);g.p(ex+1,10+o,EY,3)});g.p(13,10+o,DK,2);g.p(16,10+o,DK,2);g.row(13+o,13,16,SK,3)}
 else if(fc==6){g.p(10,10+o,DK,2);g.p(19,10+o,DK,2);g.p(10,9+o,DK,2);g.p(19,9+o,DK,2);g.p(14,13+o,BS,3);g.p(15,13+o,BS,3);g.p(10,12+o,BS,3);g.p(19,12+o,BS,3)}
 else if(fc==7){g.row(11+o,9,10,AC,2);g.row(12+o,9,11,AC,3);g.row(11+o,19,20,AC,2);g.row(12+o,18,20,AC,3);g.row(13+o,14,15,AC,2)}
 else if(fc==8){g.r(17,9+o,2,3,DK,2);g.p(19,10+o,DK,3);g.row(8+o,13,16,DK,3);g.p(12,8+o,DK,3);g.p(17,8+o,DK,3);g.p(18,8+o,DK,3);g.p(19,8+o,DK,3);g.p(20,9+o,DK,3)}
 /* cosmétiques : accessoires (L.acc) et écharpe (L.cape==3) */
 const ac=L.acc|0;
 if(ac==1){g.row(7+o,8,21,C1,2);g.p(22,7+o,C1,2);g.p(23,8+o,C1,3);g.p(22,9+o,C1,3)}
 else if(ac==2){g.p(7,12+o,GD,1);g.p(22,12+o,GD,1);g.p(7,13+o,GD,3);g.p(22,13+o,GD,3)}
 else if(ac==3){g.row(4+o,8,21,C1,2);[9,12,15,18,21].forEach((x,i)=>g.p(x,3+o+(i==0||i==4?1:0),i%2?WH:BS,1))}
 else if(ac==4){g.row(1+o,12,17,C1,1);g.row(2+o,10,19,C1,1);g.row(3+o,9,20,C1,2);g.row(4+o,8,21,C1,2);g.row(5+o,8,21,WH,2);g.r(14,o,2,1,WH,1);for(let x=10;x<=19;x+=3)g.p(x,3+o,C1,3)}
 else if(ac==5){[[10,2],[9,1],[9,0]].forEach(([x,y],i)=>{g.p(x,y+o,C1,i?1:2);g.p(29-x,y+o,C1,i?1:2)})}
 else if(ac==6){g.row(o,11,18,C1,1)}
 else if(ac==7){[[9,2],[10,2],[9,1],[8,2]].forEach(([x,y])=>{g.p(x,y+o,HR);g.p(29-x,y+o,HR)});g.p(9,2+o,BS,2);g.p(20,2+o,BS,2)}
 if(L.cape==3){g.row(15+o,10,19,CO,2);g.row(16+o,11,18,CO,3);g.r(17,17+o,2,3,CO,2);g.p(17,20+o,CO,3)}
 if(c.race=='Elfe'){g.p(7,10+o,SK);g.p(6,9+o,SK);g.p(22,10+o,SK);g.p(23,9+o,SK)}
 if(c.race=='Gobelin'){g.r(5,9+o,3,2,SK);g.r(22,9+o,3,2,SK);g.p(4,8+o,SK);g.p(25,8+o,SK)}
 if(c.race=='Orc'){g.p(12,13+o,WH,2);g.p(17,13+o,WH,2);g.p(12,12+o,WH,2);g.p(17,12+o,WH,2)}
 if(c.race=='Homme-bête'){[[9,2],[10,1],[10,2],[11,2],[10,0]].forEach(([x,y])=>{g.p(x,y+o,HR);g.p(29-x,y+o,HR)});g.p(10,2+o,BS,2);g.p(19,2+o,BS,2)}
 if(c.race=='Nain'){for(let y=12;y<=16;y++)g.row(y+o,y<14?9:10+(y-14),y<14?20:19-(y-14),HR,y>14?3:0);g.row(13+o,13,16,SK,3)}
 if(c.race=='Fée'){g.p(7,10+o,SK);g.p(6,9+o,SK);g.p(22,10+o,SK);g.p(23,9+o,SK);g.p(5,7+o,WH,1);g.p(24,6+o,GL,1)}
 if(c.race=='Ange'){g.row(o,11,18,GD,1);g.p(10,1+o,GD,2);g.p(19,1+o,GD,2)}
 if(c.race=='Démon'){[[10,2],[9,1],[9,0],[8,0]].forEach(([x,y],i)=>{g.p(x,y+o,DK,i?1:2);g.p(29-x,y+o,DK,i?1:2)});g.p(14,13+o,WH,2)}
 if(c.race=='Dragonide'){[[10,2],[9,1],[9,2]].forEach(([x,y])=>{g.p(x,y+o,BL,1);g.p(29-x,y+o,BL,1)});[[9,11],[10,12],[20,11],[19,12],[8,10],[21,10]].forEach(([x,y])=>g.p(x,y+o,AC,2))}
 if(c.race=='Mort-vivant'){g.row(13+o,12,17,DK,3);[13,15,17].forEach(x=>g.p(x,12+o,DK,3));g.r(17,5+o,4,1,WH,2);g.r(18,6+o,3,1,WH,3)}
 if(c.st>=6){g.row(0+o,12,17,GD,1);g.p(11,1+o,GD,1);g.p(18,1+o,GD,1)}
 /* armes */
 if(R=='guerrier'||(R=='gardien')){const n=R=='gardien'?5:8;if(at)for(let i=0;i<n;i++){const x=22+i,y=18+o-Math.floor(i*.7);g.p(x,y,BL,1);g.p(x,y+1,BL,3)}else for(let i=0;i<n;i++){const x=7-i,y=20+o+Math.floor(i*.8);g.p(x,y,BL,1);g.p(x,y+1,BL,3)}
  if(at){g.p(21,17+o,GD,2);g.p(22,20+o,GD,2)}else{g.p(8,19+o,GD,2);g.p(8,22+o,GD,2)}
  if(R=='gardien'){const sx=22+(at?2:0);g.e(sx,19+o,5,6,GD,0);g.e(sx,19+o,3.4,4.4,AC,0);g.p(sx-1,17+o,WH,2);g.p(sx,19+o,GD,1);g.p(sx,20+o,GD,1);g.p(sx-1,20+o,GD,1);g.p(sx+1,20+o,GD,1)}}
 else if(R=='assassin'){[[7,21],[6,22],[5,23],[4,24]].forEach(([x,y])=>g.p(x,y+o,BL,1));if(at)for(let i=0;i<6;i++)g.p(22+i,19+o,BL,i%2?3:1);else[[22,20],[23,19],[24,18],[25,17]].forEach(([x,y])=>g.p(x,y+o,BL,1))}
 else if(R=='archer'){for(let y=13;y<=25;y++)g.p(24-(y<15||y>23?1:0),y+o,WD,y%2?2:3);g.p(22,12+o,WD,2);g.p(22,26+o,WD,2);for(let y=13;y<=25;y++)if(!g.at(22,y+o))g.p(22,y+o,WH,3);if(at){g.row(19+o,18,27,WD,2);g.p(28,19+o,BL,1)}}
 else if(R=='sorcier'){for(let y=9+o;y<=27;y++)g.p(23,y,WD,y%3?2:3);g.e(23,6+o,2,2,GL,2);g.p(22,5+o,WH,2);g.p(24,7+o,AC,3);if(at){g.p(26,4+o,GL,2);g.p(20,3+o,GL,2);g.p(27,8+o,WH,2)}}
 else if(R=='soigneur'){for(let y=10+o;y<=27;y++)g.p(23,y,GD,y%3?2:3);g.r(22,5+o,3,5,GD,2);g.p(23,7+o,GL,1);g.p(23,6+o,GL,1);g.p(23,8+o,GL,1);g.p(21,7+o,GD,2);g.p(25,7+o,GD,2);if(at){g.p(27,5+o,GL,1);g.p(20,4+o,WH,2)}}
 else{for(let y=2+o;y<=27;y++)g.p(23,y,WD,y%3?2:3);for(let y=3;y<=9;y++)g.row(y+o,24,29-(y%2),AC,y==9?3:0);g.row(4+o,25,27,GD,2);g.p(26,6+o,WH,2);g.p(23,1+o,GD,1)}
 return bake(g,charPal(c,L))}
const CS={};
/* portrait 20×18 recadré dans l'image idle (redéfini par chibi.js) */
function headC(i0){const h=mkc(20,18);h.getContext('2d').drawImage(i0,6,1,20,18,0,0,20,18);return h}
function cs(c){const L=c.look,k=c.id+':'+c.st+':'+c.role+':'+c.elem+':'+c.race+(L?':'+[L.skin,L.hair,L.eye,L.style,L.face|0,L.body|0,L.acc|0,L.cape|0,L.tn|0].join(','):'')+(typeof CHIBI!='undefined'&&CHIBI?':c'+(c.eq&&c.eq.arme?c.eq.arme.t:''):'');if(CS[k])return CS[k];const f=fr=>drawChar(c,fr),i0=f({b:0}),s={idle:[i0,f({b:1})],walk:[f({b:0,st:1}),f({b:1}),f({b:0,st:2}),f({b:1})],atk:f({at:1})};s.ko=f({b:0,ko:1});
 if(ASSETS['sprite_'+c.name]){const im=new Image();im.src=ASSETS['sprite_'+c.name];im.onload=()=>{const k2=mkc(32,30);k2.getContext('2d').drawImage(im,0,0,32,30);s.idle=[k2,k2];s.walk=[k2,k2,k2,k2];s.atk=k2;s.ko=k2;s.white=tintC(k2,'#fff');s.glow=glowC(k2)}}
 s.white=tintC(i0,'#fff');s.glow=glowC(i0);s.url=scaleC(s.glow,3).toDataURL();s.head=scaleC(headC(i0,c),2).toDataURL();return CS[k]=s}
/* ---------- monstres (tournés vers la droite) ---------- */
const MS={};
function monSprite(type,elem,kind){const k=type+elem+kind;if(MS[k])return MS[k];const E=ELEMS[elem].c;let g,pal;
 if(type=='slime'){g=SG(24,18);pal=[null,E,'#fff','#241a30',sh(E,.45)];g.e(12,11,9.5,6.5,1);g.r(3,13,19,4,1);g.row(17,5,19,1);g.tone(8,8,3.5,2.5,1,0);g.p(7,7,2,2);g.p(8,7,2,2);g.p(7,8,2,2);g.r(9,11,2,3,3,2);g.r(15,11,2,3,3,2);g.p(9,11,2,2);g.p(15,11,2,2);g.row(15,11,14,3,2);g.tone(14,15,7,2,3,1)}
 else if(type=='loup'){g=SG(30,22);pal=[null,'#70788c',E,'#241a30','#e8eaf2','#4f566a'];g.e(13,13,8.5,4.5,1);g.e(22,10,4.5,4.5,1);g.r(25,10,4,3,4,0);g.p(28,10,3,2);g.r(20,5,2,2,1);g.r(23,5,2,2,1);g.p(20,4,1);g.p(24,4,1);g.r(22,8,2,2,2,2);g.p(23,8,4,2);[[6,16],[10,17],[16,17],[19,16]].forEach(([x,y])=>g.r(x,y,2,22-y,5,0));[[5,11],[4,10],[3,9],[2,8]].forEach(([x,y])=>g.r(x,y,2,2,1));g.r(1,7,2,2,2,2);g.row(9,8,18,2,0);g.tone(13,16,7,2,3,1);g.row(13,26,28,3,2)}
 else if(type=='squelette'){g=SG(28,30);pal=[null,'#ece6d6',E,'#241a30','#9a8a7a','#c9c0aa'];g.e(13,8,6.5,6.5,1);g.r(10,13,7,2,1,3);[11,13,15].forEach(x=>g.p(x,14,3,2));g.r(10,7,2,3,3,2);g.r(15,7,2,3,3,2);g.p(11,8,2,2);g.p(16,8,2,2);g.p(13,10,3,2);g.r(13,15,1,8,5,2);[16,18,20].forEach(y=>g.row(y,9,17,1,0));g.r(7,16,1,7,1);g.r(19,16,1,6,1);g.r(10,22,7,2,1);g.r(10,24,2,5,1);g.r(15,24,2,5,1);g.r(9,29,3,1,5);g.r(15,29,3,1,5);for(let i=0;i<9;i++){g.p(20+Math.floor(i*.6),21-i,4,1);g.p(21+Math.floor(i*.6),21-i,4,3)}g.p(19,22,5,2)}
 else if(type=='golem'){g=SG(32,30);pal=[null,'#8b7d70',E,'#241a30','#6f6258','#a89a8a'];g.r(8,9,16,13,1);g.r(9,8,14,1,1);g.r(12,3,8,6,1);g.r(2,10,6,12,1);g.r(24,10,6,12,1);g.r(1,19,8,6,4,0);g.r(23,19,8,6,4,0);g.r(9,22,5,8,4,0);g.r(18,22,5,8,4,0);g.r(14,5,1,2,2,2);g.r(17,5,1,2,2,2);[[12,12],[13,13],[14,13],[15,14],[16,15],[16,16],[17,17],[18,17],[15,12],[19,13]].forEach(([x,y])=>g.p(x,y,2,2));g.tone(12,11,4,2,1,1);g.tone(20,19,4,3,3,1);g.row(4,13,15,5,2);g.r(3,11,2,2,5,2);g.r(25,11,2,2,5,2)}
 else if(type=='spectre'){g=SG(24,30);pal=[null,'#3d3760',E,'#17122a','#5a5288'];g.e(12,9,7.5,7.5,1);for(let y=12;y<=25;y++){const d=Math.floor((y-12)*.3);g.row(y,5+d-(y%4<2?1:0),19-d+(y%4<2?1:0),1,y>22?3:0)}g.r(11,26,2,2,1,3);g.p(12,28,1,3);g.e(12,10,4.5,4.5,3,2);g.r(9,10,2,2,2,2);g.r(14,10,2,2,2,2);g.p(10,10,4,1);g.tone(8,6,3,2.5,1,1);g.r(2,15,3,2,1);g.r(20,15,3,2,1);g.p(1,17,4,2);g.p(23,17,4,2);g.row(13,6,18,4,2)}
 else if(type=='champi'){g=SG(26,26);pal=[null,'#f1e6cf',E,'#241a30','#ffffff'];g.r(9,12,9,11,1);g.r(8,22,11,3,1);g.r(7,24,4,2,1,3);g.r(15,24,4,2,1,3);g.e(13,9,11.5,7.5,2);for(let x=0;x<26;x++)for(let y=13;y<18;y++)if(g.at(x,y)==2)g.p(x,y,x>8&&x<18&&y<23?1:0);g.row(12,2,23,2,3);[[7,5],[8,5],[7,6],[16,4],[17,4],[17,5],[12,8],[13,8],[20,8],[4,9]].forEach(([x,y])=>g.p(x,y,4,2));g.r(11,16,1,3,3,2);g.r(15,16,1,3,3,2);g.row(20,12,14,3,2);g.tone(9,5,5,3,1,1)}
 else if(type=='chacal'){g=SG(30,32);pal=[null,'#8a5a44',E,'#241a30','#e6edf7','#d9c7a0','#b98468'];g.r(10,1,2,7,1);g.r(18,1,2,7,1);g.p(10,0,1);g.p(19,0,1);g.r(10,3,1,3,6,2);g.r(19,3,1,3,6,2);g.e(14.5,9,5.5,5,1);g.r(13,10,4,3,6,0);g.p(15,10,3,2);g.r(11,8,2,1,2,2);g.r(17,8,2,1,2,2);g.r(9,14,12,8,1);g.r(12,15,6,5,6,0);g.r(6,14,3,9,1);g.r(21,14,3,9,1);g.r(10,21,10,4,5,0);g.row(21,10,19,3,2);g.r(11,25,3,5,1);g.r(16,25,3,5,1);g.r(10,30,4,2,1,3);g.r(16,30,4,2,1,3);[[5,23],[4,24],[3,25],[3,26],[4,27],[5,28]].forEach(([x,y])=>{g.p(x,y,4,1);g.p(29-x,y,4,1);g.p(x+1,y,4,3);g.p(28-x,y,4,3)})}
 else{g=SG(20,26);pal=[null,E,sh(E,.5),'#3a2c5e'];for(let y=1;y<=21;y++){const hw=Math.min((y-1)*.8,4,(23-y)*.9);for(let x=Math.ceil(10-hw);x<=10+hw;x++)g.p(x,y,1,x<9?1:x>10?3:2)}for(let y=10;y<=22;y++){const hw=Math.min((y-10)*.7,2);for(let x=Math.ceil(4-hw);x<=4+hw;x++)g.p(x,y,1,x<4?1:3);for(let x=Math.ceil(16-hw);x<=16+hw;x++)g.p(x,y,1,x<16?1:3)}g.r(2,22,16,3,3,0);g.p(9,5,2,2);g.p(9,6,2,2)}
 let c=bake(g,pal);if(kind=='elite'||kind=='mini'||kind=='boss'){const x=c.getContext('2d'),m=Math.floor(c.width/2);x.fillStyle=OLC;x.fillRect(m-5,0,10,1)}
 const s={s:c,white:tintC(c,'#fff')};if(kind=='mini')s.k=2;if(kind=='boss')s.k=3;if(kind=='elite')s.k=1;if(s.k>1){s.s=scaleC(c,s.k==3?2:1.5|0||1);s.s=scaleC(c,s.k==3?2:2);s.white=tintC(s.s,'#fff')}s.glow=glowC(s.s);return MS[k]=s}
function monIcon(type,elem,kind){const s=monSprite(type,elem,kind=='boss'||kind=='mini'?'norm':kind).s,c=mkc(20,18),x=c.getContext('2d');x.drawImage(s,Math.max(0,s.width-22),0,20,18,0,0,20,18);return scaleC(c,2).toDataURL()}
/* ---------- décor ---------- */
const OS={};
function obSprite(kind,col){const k=kind+col;if(OS[k])return OS[k];let g,pal=[null,col,'#7a5236','#ffffff',sh(col,.35),'#6a6478'];
 if(kind=='tree'){g=SG(26,32);g.r(11,21,4,10,2,0);g.p(10,30,2,3);g.p(15,30,2,3);g.p(12,23,2,3);g.e(13,11,10,9,1,2);g.e(6,16,5,5,1,2);g.e(20,16,5,5,1,2);g.tone(10,7,6,4,1,1);g.tone(9,6,3,2,1,0);g.tone(15,17,8,4,3,1);g.tone(13,19,7,2,3,0);g.tone(5,18,3,2,3,0);g.tone(21,18,3,2,3,0)}
 else if(kind=='pine'){g=SG(22,34);g.r(10,28,3,6,2,0);for(let L=0;L<4;L++)for(let j=0;j<9;j++){const y=1+L*6+j,hw=1+j*(.5+L*.12)+L;g.row(y,Math.round(11-hw),Math.round(10+hw),j<2&&L<3?3:1,j<2?(L<3?2:1):j>6?3:2)}g.tone(8,10,3,8,1,1)}
 else if(kind=='bush'){g=SG(18,13);g.e(9,7,8,5,1,2);g.e(4,9,3,3,1,2);g.e(14,9,3,3,1,2);g.tone(7,5,4,2,1,1);g.tone(11,10,5,2,3,1);g.p(5,7,3,2);g.p(12,5,3,2)}
 else if(kind=='rock'){g=SG(20,15);g.e(10,8,9,6,1,2);g.e(5,11,4,3,1,2);g.r(2,11,16,3,1,2);g.tone(8,5,5,2.5,1,0);g.tone(13,11,6,3,3,0);g.p(11,7,1,3);g.p(12,8,1,3);g.p(6,9,1,3)}
 else if(kind=='cactus'){g=SG(16,24);g.r(6,3,4,20,1,2);g.row(2,7,8,1,1);g.r(2,9,2,5,1,2);g.r(2,13,4,2,1,2);g.r(12,7,2,7,1,2);g.r(10,13,4,2,1,2);for(let y=3;y<23;y++){g.p(6,y,1,1);g.p(9,y,1,3)}g.p(2,9,1,1);g.p(13,7,1,3);g.p(7,2,3,2);g.p(4,6,3,2);g.p(11,10,3,2)}
 else if(kind=='crystal'){g=SG(18,26);for(let y=1;y<=22;y++){const hw=Math.min((y-1)*.8,3.6,(24-y));for(let x=Math.ceil(9-hw);x<=9+hw;x++)g.p(x,y,1,x<8?1:x>9?3:2)}for(let y=11;y<=22;y++){const hw=Math.min((y-11)*.7,1.6);for(let x=Math.ceil(3-hw);x<=3+hw;x++)g.p(x,y,1,x<3?1:3);for(let x=Math.ceil(15-hw);x<=15+hw;x++)g.p(x,y,1,x<15?1:3)}g.r(1,22,16,3,5,0);g.p(8,5,3,2);g.p(8,6,3,2)}
 else if(kind=='pillar'||kind=='pillarb'){g=SG(16,30);const top=kind=='pillar'?5:13;if(kind=='pillar')g.r(2,2,12,3,1,0);g.r(4,top,8,21,1,2);if(kind=='pillarb'){g.p(4,13,0);g.p(5,13,0);g.p(10,13,0);g.r(1,25,3,2,1,3)}g.r(2,26,12,3,1,0);for(let y=top;y<26;y++){g.p(4,y,1,1);g.p(7,y,1,3);g.p(11,y,1,3)}g.p(6,16,1,4);g.p(9,20,1,4)}
 else if(kind=='stal'){g=SG(14,22);for(let y=1;y<=21;y++){const hw=(y-1)*.28+.4;for(let x=Math.ceil(7-hw);x<=7+hw;x++)g.p(x,y,1,x<7?1:x>7?3:2)}}
 else{g=SG(22,28);pal[1]=col;g.r(10,10,3,18,1,2);[[9,12],[8,11],[7,10],[6,8],[5,6]].forEach(([x,y])=>g.r(x,y,2,2,1,2));[[13,14],[14,13],[15,11],[16,9],[17,6]].forEach(([x,y])=>g.r(x,y,2,2,1,2));[[11,8],[11,6],[12,4],[12,2]].forEach(([x,y])=>g.r(x,y,2,2,1,2));g.p(9,27,1,3);g.p(13,27,1,3)}
 return OS[k]=bake(g,pal)}
const BS_={};
function bSprite(k,lv){const key=k+lv;if(BS_[key])return BS_[key];const C=BLD[k].col,g=SG(54,58),pal=[null,'#9a96ae','#7a4a30',C,'#ffe08a','#f2ead6','#a9744a','#5a3d2e','#ffffff','#6f6a86','#e0b040','#ff8a3a'];
 if(lv==1){for(let y=12;y<=52;y++){const hw=(y-12)*.58+2;for(let x=Math.ceil(27-hw);x<=27+hw;x++)g.p(x,y,(Math.floor((x+60)/5)%2)?5:3,y>49?3:0)}for(let y=30;y<=52;y++){const hw=(y-30)*.3;for(let x=Math.ceil(27-hw);x<=27+hw;x++)g.p(x,y,7,y<34?4:2)}g.r(26,6,2,8,6,2);g.r(28,6,6,4,3,0);g.e(8,54,5,2.5,1,0);g.e(47,54,4,2.5,1,0);g.r(40,50,6,3,6,0)}
 else{const wall=lv==2?6:1;g.r(7,28,40,28,wall,2);if(lv==2){for(let x=7;x<47;x+=5)g.r(x,28,1,28,6,3);g.r(7,28,40,2,7,2);g.r(7,54,40,2,7,2)}else{for(let y=28;y<56;y+=5){g.row(y,7,46,9,2);for(let x=7+((y/5|0)%2?4:0);x<47;x+=8)g.r(x,y,1,Math.min(5,56-y),9,2)}for(let y=28;y<56;y++){g.p(7,y,1,1);g.p(46,y,1,3)}}
  for(let y=8;y<=29;y++){const ins=Math.floor((29-y)*.42);g.row(y,3+ins,50-ins,3,y==8?1:(y-8)%4==3?3:2)}g.row(30,7,46,wall,4);for(let y=9;y<=28;y+=4)for(let x=6+((y/4|0)%2?3:0);x<48;x+=6)if(g.at(x,y)==3)g.p(x,y,3,3);
  g.r(22,40,10,16,2,2);g.row(39,23,30,2,2);g.row(38,24,29,2,1);[24,27,30].forEach(x=>g.r(x,40,1,16,2,3));g.p(30,48,10,2);g.r(21,40,1,16,7,2);g.r(32,40,1,16,7,2);
  [[11,37],[37,37]].forEach(([x,y])=>{g.r(x,y,7,8,4,2);g.r(x+3,y,1,8,7,2);g.r(x,y+4,7,1,7,2);g.r(x-1,y-1,9,1,7,2);g.r(x-1,y+8,9,1,7,2);g.p(x+1,y+1,8,2)});
  if(lv==3){g.r(26,0,2,9,7,2);g.r(21,1,12,8,10,0);g.r(22,2,10,6,3,2);g.r(23,9,8,1,10,0);g.r(25,10,4,1,10,0)}else{g.r(20,33,14,5,5,0);g.r(21,34,12,3,3,2)}
  const ex=lv==3?27:27,ey=lv==3?5:35,E=(a)=>a.forEach(([x,y])=>g.p(ex+x,ey+y,8,2));
  if(k=='auberge')E([[-2,-1],[-1,-1],[0,-1],[-2,0],[-1,0],[0,0],[1,0],[-2,1],[-1,1],[0,1]]);else if(k=='ferme')E([[0,-2],[-1,-1],[1,-1],[0,-1],[0,0],[-1,1],[1,1],[0,1]]);else if(k=='camp')E([[2,-2],[1,-1],[0,0],[-1,1],[-2,1],[-1,2]]);else if(k=='inf')E([[0,-2],[0,-1],[-2,0],[-1,0],[0,0],[1,0],[2,0],[0,1],[0,2]]);else E([[-2,-1],[-1,-1],[0,-1],[1,-1],[2,-1],[0,0],[0,1],[-1,2],[0,2],[1,2]]);
  if(k=='forge'||k=='auberge'){g.r(38,3,7,11,1,2);g.r(37,2,9,2,9,0);if(k=='forge')g.r(11,37,7,8,11,2)}}
 return BS_[key]=bake(g,pal)}
/* bâtiments : sprite Blender bld_<k>_<palier> (3 paliers visuels), sinon dessin procédural */
const bTier=lv=>clamp(lv|0,1,3),bImg=(k,lv)=>aImg('bld_'+k+'_'+bTier(lv))||bSprite(k,lv),bUi=(k,lv)=>aSrc('bldui_'+k+'_'+bTier(lv))||scaleC(bSprite(k,lv),2).toDataURL();
function miscSprite(k){if(OS['m'+k])return OS['m'+k];let g,pal;
 if(k=='plot'){g=SG(22,18);pal=[null,'#8a5a34','#f2ead6','#9a96ae','#5a3d2e'];g.r(10,6,2,12,1,2);g.r(4,1,14,8,2,0);g.r(4,1,14,1,4,2);g.r(4,8,14,1,4,2);[[9,3],[10,3],[11,3],[12,3],[10,4],[11,4],[10,5],[11,5],[10,6],[11,6]].forEach(([x,y])=>g.p(x,y,4,2))}
 else if(k=='tower'){g=SG(30,50);pal=[null,'#9a96ae','#4a6ab8','#6f6a86','#ffe08a','#c0453a','#7a4a30'];g.r(4,20,22,30,1,2);for(let y=20;y<50;y++){g.r(4,y,3,1,1,1);g.r(22,y,4,1,1,3)}for(let y=24;y<50;y+=5)for(let x=5+((y/5|0)%2?4:0);x<26;x+=8)g.p(x,y,3,2);for(let y=24;y<50;y+=5)g.row(y,4,25,3,2);[2,8,14,20,26].forEach(x=>g.r(x,17,3,4,1,0));g.r(2,20,26,2,1,3);for(let y=3;y<=18;y++){const hw=(y-3)*.85;for(let x=Math.ceil(15-hw);x<=15+hw;x++)g.p(x,y,2,x<13?1:x>17?3:2)}g.r(15,0,1,4,6,2);g.r(16,0,5,3,5,0);g.r(13,30,4,6,4,2);g.r(13,29,4,1,3,2)}
 else if(k=='arch'){g=SG(34,40);pal=[null,'#8d86a8','#6f6a86','#4de0c0','#c58bff'];g.r(2,12,6,28,1,2);g.r(26,12,6,28,1,2);for(let y=0;y<12;y++){const ins=Math.max(0,5-y);g.row(y,2+ins,31-ins,1,y<2?1:2)}for(let y=6;y<12;y++){const ins=Math.max(0,11-y)*.9;g.row(y,Math.round(8+ins),Math.round(25-ins),0)}for(let y=12;y<40;y+=6){g.row(y,2,7,2,2);g.row(y,26,31,2,2)}[[4,16],[28,22],[4,28],[28,34],[16,2]].forEach(([x,y])=>{g.p(x,y,3,2);g.p(x+1,y,3,2);g.p(x,y+1,4,2)});g.r(0,37,10,3,2,0);g.r(24,37,10,3,2,0)}
 else if(k=='seal'){g=SG(14,24);pal=[null,'#8d86a8','#ffcf4a','#6f6a86'];g.r(3,6,8,16,1,2);g.r(1,21,12,3,1,0);g.r(2,4,10,3,1,0);for(let y=7;y<21;y++){g.p(3,y,1,1);g.p(10,y,1,3)}[[6,10],[7,10],[6,13],[7,13],[5,11],[8,12],[6,16],[7,16]].forEach(([x,y])=>g.p(x,y,2,2))}
 else if(k=='gate'||k=='gateo'){g=SG(40,38);pal=[null,'#6f6a86','#4a4660',k=='gate'?'#ff5a5a':'#ffcf4a','#8d86a8'];g.r(2,6,8,32,4,2);g.r(30,6,8,32,4,2);g.r(0,0,40,7,4,0);g.row(7,0,39,2,2);for(let y=12;y<38;y+=6){g.row(y,2,9,2,2);g.row(y,30,37,2,2)}if(k=='gate')for(let x=12;x<30;x+=4)g.r(x,8,2,30,1,0);g.r(5,16,2,4,3,2);g.r(33,16,2,4,3,2);g.r(18,2,4,3,3,2)}
 else if(k=='chest'||k=='chesto'){g=SG(16,13);pal=[null,'#a9712a','#e0b040','#5a3d2e','#241a30'];g.r(1,5,14,8,1,2);if(k=='chest'){g.r(1,1,14,5,1,0);g.row(5,1,14,3,2)}else{g.r(1,0,14,3,1,3);g.r(2,3,12,2,4,2)}g.r(1,5,1,8,2,2);g.r(14,5,1,8,2,2);g.r(7,5,2,3,2,2);g.row(12,1,14,1,3)}
 else if(k=='fire'){g=SG(16,10);pal=[null,'#7a4a30','#6a6478','#3a2a22'];g.r(2,5,12,3,1,0);g.r(4,3,8,3,1,0);g.e(2,8,2,1.5,2,0);g.e(13,8,2,1.5,2,0);g.e(8,9,2,1,2,0);g.p(6,4,3,2);g.p(9,6,3,2)}
 else if(k=='altar'){g=SG(18,18);pal=[null,'#8d86a8','#ff7ad9','#6f6a86','#fff'];g.r(2,10,14,8,1,2);g.r(0,8,18,3,1,0);g.row(11,2,15,3,2);g.e(9,4,3,3,2,2);g.p(8,3,4,2);g.p(8,13,2,2);g.p(9,14,2,2);g.p(10,13,2,2)}
 else if(k=='wood'){g=SG(18,11);pal=[null,'#a9744a','#e8c79a','#5a3d2e'];[[1,6],[7,6],[4,2],[10,2]].forEach(([x,y])=>{g.r(x,y,8,5,1,0);g.e(x+1,y+2,1.5,2,2,2);g.p(x+1,y+2,3,2)})}
 else if(k=='stone'){g=SG(18,13);pal=[null,'#a9a6b8','#ffffff','#7a768c'];g.e(6,8,5.5,4.5,1,2);g.e(12,9,5,3.5,1,2);g.e(9,5,4,3.5,1,2);g.tone(7,4,2,1.5,1,0);g.tone(12,10,4,2,3,0);g.p(4,6,2,2);g.p(13,7,2,2);g.p(9,3,2,2)}
 else if(k=='herb'){g=SG(14,12);pal=[null,'#4aa856','#ff7a8a','#fff'];g.e(7,8,6,4,1,2);g.tone(5,6,3,2,1,1);[[3,6],[7,4],[10,7],[5,9]].forEach(([x,y])=>{g.p(x,y,2,2);g.p(x,y-1,3,2)})}
 else if(k=='dummy'){g=SG(14,22);pal=[null,'#a9744a','#e8c79a','#c0453a'];g.r(6,8,2,14,1,2);g.r(1,10,12,2,1,0);g.e(7,5,3.5,3.5,2,2);g.r(4,12,6,6,2,0);g.p(6,14,3,2);g.p(7,15,3,2);g.r(4,21,6,1,1,3)}
 else if(k=='lever'||k=='levero'){g=SG(14,18);pal=[null,'#6f6a86','#8d86a8','#e0b040','#ff5a5a'];g.r(2,12,10,6,1,0);g.row(12,2,11,2,1);const up=k=='lever';for(let i=0;i<8;i++)g.p(up?7-Math.floor(i*.5):7+Math.floor(i*.5),11-i,2,2);g.e(up?4:10,3,2,2,up?4:3,0)}
 else if(k=='stele'){g=SG(16,24);pal=[null,'#8d86a8','#4de0c0','#6f6a86'];g.r(3,4,10,18,1,2);g.e(8,4,5,3,1,0);g.r(1,21,14,3,3,0);for(let y=8;y<20;y+=3)g.row(y,5,10,2,2)}
 else if(k=='brasero'){g=SG(14,14);pal=[null,'#6f6a86','#4a4660','#3a2a22'];g.r(2,4,10,4,1,0);g.row(4,1,12,1,1);g.r(6,8,2,4,2,2);g.r(3,12,8,2,2,0);g.r(3,5,8,2,3,2)}
 else if(k=='crop'){g=SG(14,10);pal=[null,'#e0b040','#5a9a3a'];[2,6,10].forEach(x=>{g.r(x,4,1,6,2,2);g.r(x-1,1,3,4,1,0)})}
 else{g=SG(8,8);pal=[null,'#fff'];g.r(0,0,8,8,1)}
 return OS['m'+k]=bake(g,pal)}
/* ---------- icônes d'objets (ASSETS[ITYPES[t].icon] prioritaire) ---------- */
const IS={};
function itemSprite(t,el){const k=t+(el||'');if(IS[k])return IS[k];const acc=el?ELEMS[el].c:({potion:'#e0484a',elixir:'#4de0c0',robe:'#6a48b8',cape:'#3a3458',grimoire:'#8a3a3a',etendard:'#c0392b',cuir:'#a9744a'}[t]||'#3fb0a0'),g=SG(16,16),pal=[null,'#c9d2e2','#8a5a34','#e0b040',acc,'#d04a4a','#a9744a','#ffffff','#4a4660','#bfe8ff','#ff8a3a','#ffe27a'];
 const ln=(x0,y0,x1,y1,id,tn)=>{const n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0))||1;for(let i=0;i<=n;i++)g.p(Math.round(lerp(x0,x1,i/n)),Math.round(lerp(y0,y1,i/n)),id,tn)};
 if(t=='epee'){ln(5,10,13,2,1,1);ln(6,10,13,3,1,3);ln(3,8,7,12,3,2);ln(2,13,4,11,2,2);g.p(1,14,3,2);g.p(5,10,4,2)}
 else if(t=='hache'){ln(3,14,11,4,2,2);g.e(11,5,3.5,3,1,0);g.r(10,4,2,3,2,2);g.p(13,5,4,2)}
 else if(t=='bouclier'){g.e(8,8,6,7,3,0);g.e(8,8,4.2,5.2,4,0);g.r(7,7,2,2,1,1)}
 else if(t=='dagues'){ln(3,3,9,9,1,1);ln(12,12,10,10,2,2);ln(13,3,7,9,1,1);ln(4,12,6,10,2,2);g.p(9,10,3,2);g.p(6,9,3,2)}
 else if(t=='arc'){for(let y=1;y<=14;y++)g.p(Math.round(5+3.5*Math.sin((y-1)/13*Math.PI)),y,2,y%2?2:3);ln(5,1,5,14,7,2);ln(3,8,13,8,2,2);g.p(14,8,1,1);g.p(3,7,4,2);g.p(3,9,4,2)}
 else if(t=='baton'){ln(3,15,11,5,2,2);g.e(12,3,2.5,2.5,4,0);g.p(11,2,7,2)}
 else if(t=='grimoire'){g.r(3,2,10,12,4,0);g.r(12,3,2,11,7,2);g.r(3,13,10,1,4,3);g.r(6,5,4,4,3,2);g.p(7,6,4,1)}
 else if(t=='sceptre'){ln(8,6,8,15,3,2);g.e(8,4,3,3,3,0);g.e(8,4,1.5,1.5,4,1);g.p(4,4,3,2);g.p(12,4,3,2)}
 else if(t=='luth'){ln(9,7,14,2,2,2);g.e(6,10,4.5,4,6,0);g.e(6,10,1.2,1.2,8,2);g.r(13,1,2,2,3,2)}
 else if(t=='robe'||t=='cape'){for(let y=2;y<=14;y++){const hw=2+Math.floor((y-2)*.42);g.row(y,8-hw,7+hw,4,0)}g.r(6,2,4,2,0);if(t=='robe')ln(8,4,8,14,3,2);else{g.row(3,4,11,4,3);g.p(7,4,3,2);g.p(8,4,3,2)}}
 else if(t=='lourde'||t=='cuir'){const id=t=='lourde'?1:6;g.r(3,4,10,9,id,0);g.r(1,3,4,3,id,1);g.r(11,3,4,3,id,1);g.r(6,3,4,2,0);g.row(11,3,12,3,2);g.r(7,6,2,4,id,3);if(el)g.p(8,8,4,2)}
 else if(t=='potion'||t=='elixir'){g.e(8,10,4.5,4.5,9,0);g.e(8,11,3.5,3,4,0);g.r(7,3,3,3,9,2);g.r(6,2,5,1,6,2);g.p(6,9,7,2)}
 else if(t=='torche'){ln(5,15,9,7,2,2);g.r(8,5,3,2,6,3);g.e(10,3,2.5,3,10,0);g.p(10,3,11,2);g.p(10,4,7,2)}
 else if(t=='pioche'){ln(4,15,10,5,2,2);ln(4,4,10,5,1,1);ln(10,5,14,10,1,3);g.p(10,5,3,2)}
 else if(t=='cle'){g.e(4,4,3,3,3,0);g.p(4,4,0);ln(6,6,13,13,3,2);g.r(11,12,2,2,3,2);g.r(9,10,2,2,3,2)}
 else if(t=='boussole'){g.e(8,8,6,6,3,0);g.e(8,8,4.5,4.5,7,0);ln(8,4,8,8,5,2);ln(8,9,8,12,8,2);g.p(8,8,3,2)}
 else if(t=='sablier'){g.row(1,3,12,2,2);g.row(14,3,12,2,2);for(let y=2;y<=13;y++){const hw=y<8?Math.max(1,6-(y-2)):Math.max(1,y-7);g.row(y,8-hw,7+hw,9,2)}g.row(12,5,10,11,2);g.row(13,4,11,11,2);g.row(3,5,10,11,2);g.p(7,8,11,2);g.p(8,9,11,2)}
 else if(t=='relique'){g.r(4,6,8,8,3,0);g.r(5,4,6,2,3,1);ln(8,7,8,12,7,2);ln(6,9,10,9,7,2);g.p(8,2,11,1)}
 else{ln(3,1,3,15,2,2);g.r(4,2,9,7,4,0);g.r(4,9,3,2,4,3);g.r(10,9,3,2,4,3);g.r(7,4,3,3,3,2)}
 return IS[k]=bake(g,pal)}
function itemSrc(it){const T=ITYPES[it.t],a=aSrc(T.icon);if(a)return a;const k='u'+it.t+(it.el||'');return IS[k]||(IS[k]=scaleC(itemSprite(it.t,it.el),3).toDataURL())}
/* dessine une icône d'objet sur le canevas (image ASSETS si chargée, sinon procédurale), pieds en (x,y) */
function dItem(t,x,y,sz=18){const im=aImg(ITYPES[t].icon);if(im)X.drawImage(im,Math.round(x-sz/2),Math.round(y-sz),sz,sz);else dS(itemSprite(t),x,y)}
