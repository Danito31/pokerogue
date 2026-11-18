'use strict';
/* ================= PERSONNAGES CHIBI =================
   Style « chibi anime » des figurines : grosse tête (~55 % de la hauteur), grands yeux à reflets, petit corps.
   Même grille que le style classique (30×28 → toile 32×30 après contour), mêmes images (idle/walk/atk/white/glow/url/head) :
   aucun consommateur (carte, combat, fiches, CSS) ne change. Lit les mêmes données : look (héros : LOPT de hero.js), rôle, race, ★, élément.
   Disposition (y sans rebond) : 0-1 ornements (cornes, auréole, épis) · 2-16 tête (cheveux 2+, visage 4-16, yeux 10-13, bouche 15)
   · 17-21 torse et bras (mains 20-21) · 22-25 jambes · 26-27 pieds. « Petit », Nain, Gobelin : jambes plus courtes (haut du corps +2).
   Réglage « Style des personnages : Chibi / Classique » (localStorage 'tdChibi', par appareil) ; défaut Chibi.
   Traits de signature des légendes (FEAT de legends2.js, dessinés pour la grille classique) : en chibi, chaque FEAT[k].d est
   enveloppé (chFeatBridge) — tracé à part puis reprojeté sur la géométrie chibi (tête élargie, torse décalé), ou remplacé par
   CHFEAT[k](g, o, a, b, K) si une version chibi dessinée à la main existe (o = décalage vertical chibi du haut du corps). */
let CHIBI=1;try{CHIBI=localStorage.getItem('tdChibi')==='0'?0:1}catch(_){}
const drawCharClassic=drawChar;
const MO=20,LP=21,SC2=22,FRK=23,HN=24,HD=25;
/* teint des races rares adouci pour le chibi (le visage reste lisible) */
const CHRSKIN={'Démon':['#c45a6e','#ffe04a'],'Mort-vivant':['#a9c2aa','#c8ff6a']};
/* masque ASCII : '#' ton auto, '+' clair, '=' base, '-' sombre, '%' très sombre ; sym → miroir autour de x=14,5 */
const CHT={'#':0,'+':1,'=':2,'-':3,'%':4};
function chMask(g,rows,y0,x0,id,o,sym){for(let j=0;j<rows.length;j++){const r=rows[j];for(let i=0;i<r.length;i++){const tn=CHT[r[i]];if(tn==null)continue;g.p(x0+i,y0+j+o,id,tn);if(sym)g.p(29-x0-i,y0+j+o,id,tn)}}}
function chLine(g,x0,y0,x1,y1,id,tn){const n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0))||1;for(let i=0;i<=n;i++)g.p(Math.round(x0+(x1-x0)*i/n),Math.round(y0+(y1-y0)*i/n),id,tn)}
/* calotte commune (x 3..14, miroir), lignes 0..6 */
const CH_CAP=['','','........####','......######','....########','...#########','..##########'];
/* coiffures : f = devant (x 3..14 miroir, ou x 3..26 si full), bk = derrière le corps */
const CH_HAIR=[
 /* 0 mèche (asymétrique, balayée vers la gauche) */
 {full:1,f:['','','........########','......############','....################','...##################','..####################','..#####################.','..##############-###-##.','..#########-#..##..#..#.','..#####-##.........#.##.','..####..............##..','..###...............#...','..##....................']},
 /* 1 hérissés */
 {f:['......#....#','...#..##..##','..##.#######','.###########','..##########','.###########','..##########','.###########','..###.##.###','.##...#...##','.##.........','..#.........']},
 /* 2 longs */
 {f:CH_CAP.concat(['..##########','..####-#####','..##..#..#.#','..##........','..##........','..##........','..##........','..##........','..##........','...#........']),
  bk:['','','','','','','','.###########','.###########','.###########','.###########','.###########','.###########','.###########','.###########','.###########','.###########','.#######....','.#######....','.#######....','.-###-##....','.-#.--#.....','..-..-......']},
 /* 3 tresse */
 {f:CH_CAP.concat(['..##########','..#####-####','..##..#...##','..#.........','..#.........']),braid:1},
 /* 4 raie au milieu */
 {f:['','','........###.','......#####.','....#######.','...########.','..#########.','..########..','..#######...','..##.##-....','..##........','..##........','..##........','..##........','..-#........']},
 /* 5 couettes */
 {f:CH_CAP.concat(['..##########','..###-##-###','..##..#...##','..#.........']),
  bk:['','','','','.##.........','####........','####........','#####.......','####........','####........','####........','####........','####........','.###........','.###........','.###........','.###........','.##-........','..#-........','..-.........']},
 /* 6 court */
 {f:CH_CAP.concat(['..##########','..###-##-###','..##...#...#','..#.........'])},
 /* 7 queue de cheval */
 {f:CH_CAP.concat(['..##########','..####-#####','..##..#..#.#','..#.........']),pony:1},
 /* 8 crête */
 {f:['','...........#','..........##','..........##','..........##','..........##','..........##','...........#'],scalp:1},
 /* 9 macarons */
 {f:CH_CAP.concat(['..##########','..###-##-###','..##...#...#','..#.........']),buns:1},
 /* 10 volumineux */
 {f:['....#.##.###','..##########','.###########','############','############','############','############','############','.####-######','.###..#..#.#','####........','.###........','####........','.###........','.##.........','..#.........'],
  bk:['','','','','','','','','','','','','','','.##.........','.##.........','..#.........']},
 /* 11 rasé */
 {f:[],scalp:2}];
const CH_SKIN=[[10,19],[8,21],[7,22],[6,23],[6,23],[6,23],[6,23],[6,23],[6,23],[6,23],[7,22],[8,21],[10,19]];/* lignes 4..16 */
function chSpark(g,x,y,id){g.p(x,y,WH,2);g.p(x-1,y,id,1);g.p(x+1,y,id,1);g.p(x,y-1,id,1);g.p(x,y+1,id,1)}
/* ---- pont vers les traits des légendes ---- */
let CH_O=1,chFeatOK=0;const CHFEAT={};
/* reprojection : tête classique (lignes 0-14, x 8..21) → tête chibi (lignes o-1..o+16, x 6..23) ; torse classique (15+) → torse chibi (o+17+) */
function chRemap(d0,g,a,b,K){const t=SG(30,28),o=CH_O;d0(t,0,a,b,K);
 for(let y=0;y<28;y++){const hy=y-(o-1),head=hy<=17,sy=head?Math.floor(hy*15/18):y-(o+2);if(sy<0||sy>27)continue;
  for(let x=0;x<30;x++){const sx=Math.round(14.5+(x-14.5)/(head?1.28:.8)),id=t.at(sx,sy);if(id)g.p(x,y,id,t.t[sy*30+sx])}}}
function chFeatBridge(){if(chFeatOK||typeof FEAT=='undefined')return;chFeatOK=1;
 for(const k in FEAT){const f=FEAT[k];if(!f||typeof f.d!='function')continue;const d0=f.d;f.d=function(g,o,a,b,K){if(!CHIBI)return d0(g,o,a,b,K);if(CHFEAT[k])return CHFEAT[k](g,CH_O,a,b,K);return chRemap(d0,g,a,b,K)}}}
function drawChibi(c,fr){
 const L0=c.look||look(c),RS=CHRSKIN[c.race]||RSKIN[c.race],L=RS?Object.assign({},L0,{skin:RS[0],eye:RS[1]}):L0,g=SG(30,28),R=c.role,b=fr.b||0,hs=L.style|0,fc=L.face|0,bd=L.body|0,
  sm=(c.race=='Nain'||c.race=='Gobelin'||bd==3)?2:0,o=b+sm+1,big=c.race=='Orc'||bd==2?1:bd==1?-1:0,at=fr.at?1:0,ko=fr.ko?1:0,robe=R=='sorcier'||R=='soigneur',metal=R=='guerrier'||R=='gardien',
  x0=11-big,x1=18+big,H=CH_HAIR[hs]||CH_HAIR[6],ac=L.acc|0,wt=c.eq&&c.eq.arme?c.eq.arme.t:'',P=(x,y,id,tn)=>g.p(x,y+o,id,tn),M=(x,y,id,tn)=>{P(x,y,id,tn);P(29-x,y,id,tn)},RW=(y,a,z,id,tn)=>g.row(y+o,a,z,id,tn),
  LN=(a,b2,c2,d,id,tn)=>chLine(g,a,b2+o,c2,d+o,id,tn);
 CH_O=o;chFeatBridge();
 /* ---- arrière-plan : capes, ailes, cheveux longs, queues, carquois ---- */
 const capeC=L.cape>0&&L.cape<3?CO:c.st>=4?CP:0;
 if(capeC)for(let y=18;y<=26;y++){const d=y<20?0:y<23?1:2;g.row(Math.min(27,y+b),x0-2-d,x1+2+d,capeC,y>24?3:y<19?1:2);if(c.st>=5&&y==26)g.row(Math.min(27,y+b),x0-4,x1+4,GD,2)}
 const wing=(W,col)=>W.forEach(([x,y,w],i)=>{const tn=i<2?1:i>W.length-3?3:2;g.r(x,y+o,w,1,col,tn);g.r(30-x-w,y+o,w,1,col,tn)});
 if(c.race=='Ange')wing([[3,12,2],[1,13,5],[0,14,7],[0,15,8],[1,16,7],[1,17,7],[2,18,6],[3,19,5],[4,20,4],[6,21,2]],WH);
 if(c.race=='Fée'){wing([[2,10,3],[1,11,5],[0,12,7],[0,13,8],[1,14,7],[3,15,5],[2,17,6],[1,18,7],[1,19,6],[2,20,4],[3,21,2]],GL);M(2,12,WH,2);M(3,13,WH,1);M(3,19,WH,2)}
 if(c.race=='Démon')wing([[1,10,1],[1,11,2],[2,12,3],[2,13,5],[3,14,5],[2,15,6],[4,16,4],[3,17,4],[5,18,2]],D2);
 if(H.bk)chMask(g,H.bk,0,3,HR,o,1);
 if(hs==7)chMask(g,['....##','...###','..####','..###-','..###.','.####.','.###-.','.###..','.##-..','.#-...','.-....'],3,21,HR,o,0);
 if(c.race=='Démon'){chLine(g,x1,22,24,21,D2,2);chLine(g,24,21,26,18,D2,2);g.r(25,16,3,2,D2,1);g.p(26,15,D2,1)}
 if(c.race=='Dragonide')[[x1,21,2],[x1+2,22,2],[x1+4,22,2],[x1+6,21,1],[x1+7,20,1]].forEach(([x,y,h],i)=>g.r(x,y,i<2?2:1,h,AC,i%2?3:2));
 if(c.race=='Homme-bête'){chMask(g,['..##','.###','####','####','-##.','.-..'],17,21,HR,0,0)}
 if(R=='archer'){g.r(4,14+o,3,8,LE,0);g.row(14+o,4,6,LE,3);[[4,12],[5,11],[6,12]].forEach(([x,y])=>{g.p(x,y+o,WH,2);g.p(x,y+1+o,SE,2)})}
 /* ---- jambes et pieds (fixes, sauf pas de marche) ---- */
 const legC=metal?ME:R=='archer'?SE:R=='soutien'||R=='assassin'?D2:MA,shoeC=metal?ME:LE;
 [[x0+1,1],[x1-2,2]].forEach(([x,s])=>{const up=fr.st==s?1:0;if(!robe)for(let y=23+sm;y<=25;y++)g.r(x,y-up,2,1,legC,0);g.r(x-(s==1?1:0),26-up,3,2,shoeC,metal?3:0);g.p(x-(s==1?1:0)+(s==1?0:2),26-up,shoeC,1)});
 /* ---- torse et bras ---- */
 const ax0=x0-2,ax1=x1+1,armC=R=='assassin'?MA:MA;
 for(let y=17;y<=21;y++)RW(y,x0,x1,MA,0);
 for(let y=17;y<=19;y++){g.r(ax0,y+o,2,1,armC,y==17?1:0);g.r(ax1,y+o,2,1,armC,y==17?1:0)}
 const handC=R=='gardien'?ME:SK,raise=at&&(R=='sorcier'||R=='soigneur'||R=='guerrier')?2:0;
 g.r(ax0,20+o,2,2,handC,0);g.r(ax1,20+o-raise,2,2,handC,0);if(raise){g.r(ax1,18+o-raise,2,2,armC,0)}
 if(metal){RW(17,x0+1,x1-1,MA,1);RW(20,x0,x1,LE,2);P(14,20,GD,1);P(15,20,GD,2);RW(21,x0,x1,SE,0);P(14,21,SE,1);
  const pw=R=='gardien'?3:2;for(let i=0;i<pw;i++){g.row(16+i+o,ax0-(R=='gardien'?1:0),ax0+1+(i?1:0),MA,i?2:1);g.row(16+i+o,ax1-(i?1:0),ax1+1+(R=='gardien'?1:0),MA,i?2:1)}
  if(R=='gardien'){RW(18,13,16,SE,2);RW(19,13,16,SE,3)}else{P(13,18,MA,1);P(16,19,MA,3)}}
 else if(R=='assassin'){RW(17,x0-1,x1+1,SE,1);RW(18,x0,x1,SE,3);[[x0-2,18],[x0-3,19],[x0-3,20],[x0-4,21]].forEach(([x,y],i)=>g.r(x,y+o,2,1,SE,i>1?3:2));RW(20,x0,x1,LE,2);P(15,20,AC,1)}
 else if(R=='archer'){chLine(g,x0+1,17+o,x1-1,20+o,LE,2);RW(20,x0,x1,LE,3);RW(21,x0-1,x1+1,MA,0);P(x1-1,19,GD,2)}
 else if(robe){for(let y=22;y<=26;y++){const d=y<24?1:2;g.row(Math.min(26,y+o),x0-d,x1+d,MA,0)}g.row(Math.min(26,26+o),x0-2,x1+2,SE,2);if(!sm||o<2)g.row(27,x0-2,x1+2,0);
  for(let y=18;y<=25;y++)g.r(14,Math.min(26,y+o),2,1,SE,y%3==0?1:2);g.r(ax0,19+o,2,1,SE,2);g.r(ax1,19+o-raise,2,1,SE,2);
  if(R=='soigneur'){RW(17,x0-2,x1+2,SE,1);RW(18,x0-1,x1+1,SE,3)}else{P(14,18,AC,1);P(15,18,AC,2);RW(17,13,16,SE,2)}
  g.r(x0+1,27,2,1,LE,2);g.r(x1-2,27,2,1,LE,2)}
 else{RW(17,x0,x1,SE,1);for(let y=18;y<=21;y++){P(x0+1,y,SE,2);P(x1-1,y,SE,2)}[18,20].forEach(y=>{P(14,y,GD,1)});RW(21,x0,x1,MA,3);P(x0-1,22,MA,3);P(x1+1,22,MA,3)}
 if(capeC){RW(17,x0-1,x1+1,capeC,1);P(x0-2,18,capeC,2);P(x1+2,18,capeC,2)}
 if(c.st>=5){P(ax0,17,GD,1);P(ax1+1,17,GD,1)}
 if(L.cape==3){RW(17,x0-1,x1+1,CO,1);RW(18,x0,x1,CO,3);g.r(x1-2,19+o,2,2,CO,2);P(x1-2,21,CO,3)}
 /* ---- tête ---- */
 CH_SKIN.forEach(([a,z],i)=>RW(4+i,a,z,SK,i>=11?0:2));
 if(H.scalp){RW(2,11,18,SK,1);RW(3,9,20,SK,2)}
 /* oreilles de race (avant les cheveux pour Gobelin, après pour Elfe/Fée) */
 if(c.race=='Gobelin')chMask(g,['...#','.###','####','.-##','..-#'],9,2,SK,o,1);
 /* cheveux */
 if(H.scalp){for(let y=2;y<=8;y++)for(let x=5;x<=24;x++)if(g.at(x,y+o)==SK&&(y<7||x<8||x>21))g.p(x,y+o,SC2,y<4?1:2)}
 if(!H.full&&!H.scalp&&hs!=1&&hs!=10&&hs!=4)chMask(g,CH_CAP,0,3,HR,o,1);
 chMask(g,H.f,0,3,HR,o,!H.full);
 if(H.scalp==1){for(let y=-1;y<=7;y++)RW(y,y<1?14:13,y<1?15:16,HR,y<2?1:0);[[12,1],[12,3],[12,5],[17,2],[17,4],[17,6]].forEach(([x,y])=>P(x,y,HR,y<3?1:0))}
 if(H.buns)[6.5,22.5].forEach(x=>{g.e(x,3+o,2.8,2.8,HR,0);g.p(Math.floor(x)-1,1+o,HR,1);g.p(Math.floor(x),1+o,HR,1);g.p(Math.floor(x)-1,2+o,HR,1);const r=x<12?Math.floor(x)+2:Math.floor(x)-2;g.p(r,5+o,AC,1);g.p(r+(x<12?1:-1),5+o,AC,2)});
 if(!H.scalp){[[9,4],[10,4],[11,4],[8,5]].forEach(([x,y])=>{if(g.at(x,y+o)==HR)P(x,y,HR,1)});if(g.at(19,4+o)==HR)P(19,4,HR,1)}
 if(H.braid){for(let i=0;i<6;i++){const y=12+i*2;g.r(4,y+o,3,2,HR,i%2?3:1);P(5,y+1,HR,2)}P(5,24,AC,1);P(4,24,AC,2);P(6,24,AC,2);RW(11,5,6,HR,0)}
 if(c.race=='Elfe'||c.race=='Fée')chMask(g,['+...','-+..','.-##','..-#'],8,2,SK,o,1);
 /* ---- visage ---- */
 const eye=(ex,inner)=>{if(ko){g.row(13+o,ex,ex+2,DK,2);P(inner?ex+2:ex,12,DK,2);return}
  const sharp=fc==5||at;
  if(sharp){RW(11,ex,ex+2,DK,2);P(inner?ex+3:ex-1,11,DK,2);P(inner?ex+2:ex,10,DK,2);P(ex,12,WH,2);P(ex+1,12,EY,4);P(ex+2,12,EY,3);RW(13,ex,ex+2,EY,2);RW(14,ex,ex+2,EY,1);return}
  RW(10,ex,ex+2,DK,2);P(inner?ex-1:ex+3,10,DK,2);P(ex,11,WH,2);P(ex+1,11,EY,4);P(ex+2,11,EY,3);P(ex,12,EY,3);P(ex+1,12,EY,4);P(ex+2,12,EY,3);RW(13,ex,ex+2,EY,2);P(ex,14,EY,1);P(ex+1,14,EY,1);P(ex+2,14,WH,1)};
 eye(9,0);eye(18,1);
 if(!ko){if(fc!=4&&fc!=2){P(7,14,BS,2);P(8,14,BS,1);P(21,14,BS,1);P(22,14,BS,2)}}
 if(at||c.race=='Démon'&&0){RW(15,14,15,MO,3);RW(16,14,15,MO,4)}else if(ko){P(14,15,MO,3);P(15,15,MO,3)}else{P(14,15,MO,2);P(15,15,MO,2)}
 if(fc==1){[[8,12],[17,21]].forEach(([a,z])=>{RW(14,a,z,DK,2);for(let y=10;y<=13;y++){P(a,y,DK,2);P(z,y,DK,2)}RW(9,a+1,z-1,DK,2)});RW(11,13,16,DK,2);P(7,11,DK,2);P(22,11,DK,2)}
 else if(fc==2){[[7,14],[9,14],[8,15],[10,15],[20,14],[22,14],[21,15],[19,15]].forEach(([x,y])=>P(x,y,FRK,2))}
 else if(fc==3){[[22,10],[21,11],[21,12],[20,13],[20,14],[19,15]].forEach(([x,y])=>P(x,y,BS,3));P(20,9,BS,3)}
 else if(fc==4){RW(14,12,17,HR,2);RW(15,7,22,HR,0);RW(16,9,20,HR,3);RW(17,11,18,HR,3);for(let y=11;y<=14;y++){P(6,y,HR,2);P(23,y,HR,3)}RW(15,14,15,MO,3)}
 else if(fc==6){P(8,9,DK,2);P(21,9,DK,2);P(7,10,DK,2);P(22,10,DK,2);RW(15,14,15,LP,2);P(14,16,LP,3);P(15,16,LP,3);P(9,9,BS,3);P(20,9,BS,3)}
 else if(fc==7){RW(14,7,9,AC,2);RW(15,7,8,AC,3);RW(14,20,22,AC,2);RW(15,21,22,AC,3);P(14,13,AC,2);P(15,13,AC,2)}
 else if(fc==8){g.e(19+.0,11.5+o,2.2,2.6,DK,2);P(19,10,DK,1);chLine(g,17,9+o,6,6+o,DK,3);chLine(g,21,10+o,23,9+o,DK,3)}
 /* ---- races : tête ---- */
 if(c.race=='Orc'){P(12,14,WH,1);P(12,15,WH,2);P(17,14,WH,1);P(17,15,WH,2)}
 if(c.race=='Homme-bête'){chMask(g,['..+.','.##.','####','####'],-1,6,HR,o,1);M(8,1,BS,2);M(8,2,BS,3)}
 if(c.race=='Nain'){RW(14,7,22,HR,0);RW(15,7,22,HR,0);RW(16,8,21,HR,0);RW(17,9,20,HR,3);RW(18,10,19,HR,3);RW(19,12,17,HR,3);RW(14,12,17,HR,1);P(14,15,MO,3);P(15,15,MO,3)}
 if(c.race=='Démon'){chMask(g,['+...','##..','.##.','.-##'],0,7,HD,o,1);P(16,16,WH,2)}
 if(c.race=='Dragonide'){chMask(g,['+#..','.##+','..##','..-#'],0,7,HN,o,1);[[7,13],[8,14],[22,13],[21,14],[6,12],[23,12]].forEach(([x,y])=>P(x,y,AC,2))}
 if(c.race=='Mort-vivant'){RW(7,17,23,WH,2);RW(8,18,22,WH,3);P(20,7,WH,1);RW(14,19,22,DK,3);P(20,13,DK,3);P(21,15,DK,3);P(9,14,SK,3);P(10,14,SK,3)}
 if(c.race=='Ange'){RW(-1,11,18,GD,1);M(10,0,GD,2)}
 if(c.race=='Fée'){P(4,6,WH,1);P(25,4,GL,1)}
 /* ---- accessoires ---- */
 if(ac==1){RW(7,5,24,C1,2);RW(6,6,23,C1,1);P(25,7,C1,2);P(26,8,C1,3);P(25,9,C1,3)}
 else if(ac==2){M(5,13,GD,1);M(4,14,GD,2);M(6,14,GD,2);M(5,15,GD,3)}
 else if(ac==3){RW(3,8,21,C1,2);RW(4,7,22,C1,3);[8,11,14,17,21].forEach((x,i)=>{P(x,2,i%2?WH:BS,1);P(x,3,GD,1)})}
 else if(ac==4){RW(1,10,19,C1,1);RW(2,8,21,C1,1);RW(3,7,22,C1,2);RW(4,6,23,C1,2);RW(5,6,23,C1,2);RW(6,5,24,WH,2);RW(0,14,15,WH,1);for(let x=8;x<=21;x+=3)P(x,4,C1,3)}
 else if(ac==5)chMask(g,['+...','#+..','.##.','..#.'],-1,6,C1,o,1);
 else if(ac==6){RW(-1,11,18,C1,1);M(10,0,C1,2)}
 else if(ac==7){chMask(g,['.+..','.##.','####','####'],-1,5,HR,o,1);M(7,1,BS,2);M(7,2,BS,3)}
 if(c.st>=6&&ac!=4&&ac!=6&&c.race!='Ange'){RW(0,12,17,GD,2);[12,14,15,17].forEach(x=>P(x,-1,GD,1));P(14,0,AC,1)}
 /* ---- armes ---- */
 const hx=ax1,hy=20-raise;
 if(R=='guerrier'){const axe=wt=='hache';
  if(at){LN(hx+1,hy-1,hx+7,hy-7,BL,1);LN(hx+2,hy-1,hx+8,hy-7,BL,3);LN(hx-1,hy-1,hx+1,hy-3,GD,2);if(axe){g.e(hx+7.5,hy-6.5+o,2,2,ME,0);P(hx+7,hy-7,WH,2)}[[hx+4,hy-9],[hx+7,hy-10],[hx+9,hy-5]].forEach(([x,y])=>P(x,y,GL,1))}
  else if(axe){LN(hx+1,hy+1,hx+5,hy-5,WD,2);g.e(hx+5.5,hy-5+o,2,2.4,ME,0);P(hx+6,hy-6,WH,2)}
  else{LN(hx+2,hy+2,hx+7,hy+7,BL,1);LN(hx+3,hy+2,hx+7,hy+6,BL,3);LN(hx,hy+2,hx+2,hy,GD,2)}}
 else if(R=='gardien'){const sx=x1+4+(at?2:0),sy=19-(at?1:0);LN(ax0,21,ax0-3,24,BL,1);P(ax0+1,20,GD,2);
  g.e(sx,sy+o,3.6,4.6,GD,0);g.e(sx,sy+o,2.3,3.3,AC,0);P(sx-1,sy-2,WH,2);P(sx,sy,GD,1);P(sx,sy+1,GD,2)}
 else if(R=='assassin'){LN(ax0,22,ax0-2,24,BL,1);P(ax0+1,21,D2,2);
  if(at){LN(hx+2,19,hx+7,19,BL,1);P(hx+2,20,D2,2);[[hx+4,17],[hx+6,21],[hx+8,18]].forEach(([x,y])=>P(x,y,GL,1))}else{LN(hx+2,22,hx+4,24,BL,1);P(hx+1,21,D2,2)}}
 else if(R=='archer'){const bx=at?hx+4:hx+3;for(let y=11;y<=25;y++)P(bx+(y<13||y>23?-1:0),y,WD,y%2?2:3);for(let y=12;y<=24;y++)if(!g.at(bx-2+(at?-2:0),y+o)||at)P(bx-2-(at&&y>14&&y<22?2:0),y,WH,3);
  if(at){LN(hx-3,18,bx+2,18,WD,2);P(bx+3,18,BL,1);P(hx-3,17,WH,2)}}
 else if(R=='sorcier'){if(wt=='grimoire'){const by=at?13:16;g.r(22,by+o,5,4,AC,2);g.r(22,by+o,5,1,WH,1);g.r(24,by+o,1,4,D2,3);P(23,by+2,GL,1);if(at){chSpark(g,27,by-2+o,GL);chSpark(g,21,by-3+o,GL)}}
  else{const up=at?2:0;LN(hx+1,26-up,hx+5,8-up,WD,2);g.e(hx+5.5,5.5-up+o,2.2,2.2,GL,2);P(hx+5,5-up,WH,2);P(hx+6,6-up,AC,3);if(at){chSpark(g,hx+9,3+o,GL);chSpark(g,hx+2,1+o,GL);P(hx+9,9+o,WH,2)}}}
 else if(R=='soigneur'){const up=at?3:0;LN(hx+1,23-up,hx+3,12-up,GD,2);g.r(hx+2,8-up+o,3,4,GD,2);g.r(hx+1,9-up+o,5,2,GD,2);P(hx+3,9-up,GL,1);P(hx+3,10-up,GL,1);if(at){chSpark(g,hx+7,6+o,GL);chSpark(g,hx,3+o,GL)}}
 else{g.e(17,20.5+o,3.4,2.6,WD,0);g.tone(16,19.5+o,2,1,1);P(17,20,DK,2);P(16,21,GD,2);P(17,21,GD,2);P(18,21,GD,2);LN(19,19,24,14,LE,2);LN(20,19,24,15,WH,3);P(25,13,GD,1);P(24,13,GD,2);P(25,14,GD,3);if(at){[[25,9],[27,11],[22,7]].forEach(([x,y],i)=>{P(x,y,i%2?GL:AC,1);P(x+1,y-1,i%2?GL:AC,2);P(x+1,y-2,i%2?GL:AC,2)})}}
 const pal=charPal(c,L).slice();pal[MO]='#b0384e';pal[LP]='#e8435f';pal[SC2]=mixH(L.skin,L.hair,.32);pal[HN]='#e8d6a8';pal[HD]='#5a3050';pal[FRK]=mixH(L.skin,'#7a3a1e',.55);return bake(g,pal)}
drawChar=function(c,fr){return CHIBI?drawChibi(c,fr||{b:0}):drawCharClassic(c,fr)};
/* portrait (tête) recadré depuis l'image idle 32×30 */
headC=function(i0,c){const h=mkc(20,18),x=h.getContext('2d'),L=c&&c.look||{},sm=c&&(c.race=='Nain'||c.race=='Gobelin'||(L.body|0)==3)?2:0;if(CHIBI)x.drawImage(i0,5,1+sm,20,18,0,0,20,18);else x.drawImage(i0,6,1,20,18,0,0,20,18);return h};
function setChibi(v){CHIBI=v?1:0;try{localStorage.setItem('tdChibi',CHIBI?'1':'0')}catch(_){}for(const k in CS)delete CS[k];try{if(typeof hud=='function')hud()}catch(_){}}
/* réglage dans le panneau Équipe : « Style des personnages : Chibi / Classique » */
const chibiToggleHTML=()=>`<p class="m chst" style="text-align:center;margin:10px 0 2px">Style des personnages : <button class="${CHIBI?'':'alt'}" onclick="setChibi(1);rp()">Chibi</button> <button class="${CHIBI?'alt':''}" onclick="setChibi(0);rp()">Classique</button></p>`;
document.addEventListener('DOMContentLoaded',()=>{chFeatBridge();if(typeof openTeam!='function')return;const _ot=openTeam;openTeam=function(){const r=_ot.apply(this,arguments);const f=PF;if(f&&!f.chib){PF=()=>{const a=f();return[a[0],a[1]+chibiToggleHTML()]};PF.chib=1;rp()}return r}});
