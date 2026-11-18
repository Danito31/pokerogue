'use strict';
/* ================= MÉTIERS, POSTES ET NOUVEAUX BÂTIMENTS (docs/metiers.md, docs/progression.md §6) =================
   Bâtiments : hdv (niveau du village), chasse, entrepot, marche, biblio, labo. G.plots[0..9] = terrains, G.plots[HSITE] = site de l'Hôtel de ville.
   Postes : c.job.post = clé du bâtiment ; un poste par niveau de bâtiment ; un personnage en poste n'est pas dans l'équipe.
   Rangs : c.job.pm (points de métier) ; rang = min(rang par points, rang permis par le niveau). Évolution au niv. 45.
   État : G.rs {done,q} recherches · G.mkt marché · G.buff {phil} philtres · G.ver 7. */
const HSITE=10;
Object.assign(BLD,{
 hdv:{n:'Hôtel de ville',d:'Niveau du village : nombre de terrains, bâtiments et niveaux accessibles.',c:[120,120],g:500,col:'#4a6ab8'},
 chasse:{n:'Installations de chasse',d:'Produit viande, crocs et cuir au fil du temps.',c:[80,40],g:150,col:'#6a7a3a',hv:1},
 entrepot:{n:'Entrepôt',d:'Augmente la capacité de stockage des ressources et des matériaux.',c:[100,60],g:150,col:'#8a7050',hv:1},
 marche:{n:'Marché',d:'Achat et vente de ressources, matériaux et objets ; offres renouvelées toutes les 30 min.',c:[70,50],g:200,col:'#d8b838',hv:1},
 biblio:{n:'Bibliothèque',d:'Recherches chronométrées qui débloquent des bonus permanents.',c:[90,90],g:300,col:'#8a5ac8',hv:2},
 labo:{n:'Laboratoire d’alchimie',d:'Potions, élixirs, philtres et essences à partir de matériaux.',c:[60,100],g:300,col:'#d0508a',hv:2}});
MATS.mat_viande={n:'Viande',g:'forge',ic:'viande',c:'#d0604a',d:'Potions et philtres du Laboratoire ; se vend au Marché.',s:'Installations de chasse ; Marché.'};
MK.push('mat_viande');
/* ---------- niveau du village (Hôtel de ville) ---------- */
const hdvLv=()=>bl('hdv');
const plotsOpen=()=>Math.min(10,6+2*hdvLv()+(JE('architecte')?1:0));
const plotOpen=i=>i==HSITE||!!(G.plots&&G.plots[i])||i<plotsOpen();
const plotNeed=i=>i<6?0:Math.max(1,Math.ceil((i+1-6-(JE('architecte')?1:0))/2));
const bUnl=k=>k=='hdv'||!BLD[k].hv||hdvLv()>=BLD[k].hv;
const bMax=k=>k=='hdv'?3:BLD[k].hv?Math.min(3,hdvLv()):hdvLv()>=1?3:2;
/* coût d'un niveau : bois/pierre × niveau, or × (niveau − 1) ; Architecte : −4 % par rang (max −28 %), évolué −10 % de plus sur les améliorations */
function archD(up){const R=JR('architecte');return Math.min(.28,.04*R)+(up&&JE('architecte')?.1:0)}
function bCost(k,lv){const b=BLD[k],m=1-archD(lv>1),o={wood:Math.round(b.c[0]*lv*m),stone:Math.round(b.c[1]*lv*m)};if(b.g&&lv>1)o.gold=Math.round(b.g*(lv-1)*m);return o}
/* ---------- stockage (Entrepôt) ---------- */
const CAPT={wood:[800,2000,5000,12000],stone:[800,2000,5000,12000],food:[500,1500,3000,6000],mat:[60,150,300,600]};
const capped=k=>k=='wood'||k=='stone'||k=='food'||(isM(k)&&MATS[k]&&(MATS[k].g=='forge'||MATS[k].g=='ess'));
function capOf(k){const L=bl('entrepot'),t=CAPT[isM(k)?'mat':k];return t?Math.round(t[L]*(rs('rayon')?1.25:1)):Infinity}
let OVF={},ovfT=0;
/* ajoute n à une ressource ou un matériau en respectant la capacité ; jamais de retrait si on dépasse déjà (anciennes sauvegardes) */
function addCap(k,n){if(!(n>0))return 0;const m=isM(k),cur=m?mN(k):(G.res[k]|0),cp=capped(k)?capOf(k):Infinity,nv=Math.max(cur,Math.min(cur+n,cp)),d=nv-cur;if(m){if(nv>0)G.mats[k]=nv}else G.res[k]=nv;if(d<n){OVF[k]=(OVF[k]||0)+n-d;if(!ovfT)ovfT=setTimeout(ovfToast,400)}return d}
function ovfToast(){ovfT=0;const ks=Object.keys(OVF);if(!ks.length)return;toast(`Entrepôt plein : ${ks.map(k=>`${OVF[k]} ${(isM(k)?MATS[k].n:RES[k][0]).toLowerCase()}`).join(', ')} perdu${ks.length>1||OVF[ks[0]]>1?'s':''}. Construisez ou améliorez l’Entrepôt.`,3600);OVF={}}
/* ---------- métiers : postes ---------- */
const JOBP={cuisinier:[['auberge']],architecte:[['hdv'],'*'],chasseur:[['chasse']],cueilleur:[['ferme']],entraineur:[['camp']],fermier:[['ferme']],forgeron:[['forge']],eleveur:[['chasse','ferme']],mineur:[['entrepot'],['forge']],alchimiste:[['labo'],['inf']],marchand:[['marche'],['auberge']],apothicaire:[['inf','labo']],cartographe:[['hdv']],bibliothecaire:[['biblio'],['auberge']]};
const JEXP=['chasseur','cueilleur','cartographe','mineur','marchand','cuisinier','eleveur','apothicaire','alchimiste'];
function jobPosts(id){const P=JOBP[id];if(!P)return[];let a=P[0].filter(k=>bl(k));if(!a.length&&P[1])a=P[1]=='*'?G.plots.filter(p=>p).map(p=>p.k):P[1].filter(k=>bl(k));return a}
function postsOf(c){const a=c.job&&c.job.id?jobPosts(c.job.id).slice():[];if(c.mage&&bl('biblio')&&!a.includes('biblio'))a.push('biblio');return a}
const jobOK=c=>!!(c.job&&c.job.id&&jobPosts(c.job.id).includes(c.job.post));
const working=c=>!!(c.job&&c.job.post&&!c.inj&&!c.party);
const bSlots=k=>bl(k);
const postedAt=k=>G.chars.filter(c=>c.job&&c.job.post==k);
/* ---------- rangs ---------- */
const JRK=[0,100,300,700,1500,3000,6000],JRL=[5,10,20,30,40,45,50];
function jRank(c){const J=c.job;if(!J||!J.id)return 0;let r=1;for(let i=1;i<7;i++){if((J.pm||0)>=JRK[i]&&c.lv>=JRL[i])r=i+1;else break}return r}
const jEvo=c=>!!(c.job&&c.job.id&&c.lv>=45);
const jEr=c=>{const r=jRank(c);return r==7&&c.lv>=60&&awOf(c)>=3?10.5:r};
const jName=c=>c.job&&c.job.id?JOBS[c.job.id][jEvo(c)?2:0]:'Sans métier';
const jIco=c=>pIco('job_'+c.job.id+(jEvo(c)?'_evo':''),'#e8945a',JOBS[c.job.id][0]);
function JW(id,k){return G.chars.filter(c=>working(c)&&c.job.id==id&&jobOK(c)&&(!k||c.job.post==k))}
function JR(id,k){return JW(id,k).reduce((a,c)=>a+jEr(c),0)}
const JE=id=>JW(id).some(jEvo);
const JMX=id=>JW(id).reduce((a,c)=>Math.max(a,jRank(c)),0);
function PRk(id){let m=0;if(G&&G.chars)party().forEach(c=>{if(c.job&&c.job.id==id)m=Math.max(m,jEr(c))});return m}
const PE=id=>party().some(c=>c.job&&c.job.id==id&&jEvo(c));
/* ---------- expérience de métier ---------- */
const jMul=c=>(c.job.nat?1.25:1)*(rs('pedago')?1.25:1);
function jXP(c,n,q){if(!c||!c.job||!c.job.id||!(n>0))return;const r0=jRank(c);c.job.pm=Math.round(((c.job.pm||0)+n*jMul(c))*100)/100;const r1=jRank(c);if(r1>r0&&!q)toast(`${tabI2(jIco(c))}<b>${c.name}</b> : ${jName(c)} — rang <b class="g">${JRANKN[r1-1]}</b> !`,3200)}
const tabI2=src=>`<img src="${src}" alt="" style="width:20px;height:20px;vertical-align:-5px;image-rendering:pixelated;margin-right:4px">`;
function jWork(id,n,k){JW(id,k).forEach(c=>jXP(c,n))}
/* ---------- effets chiffrés (r = rang d'un travailleur, R = somme des rangs en poste) ---------- */
const JF={cuiK:R=>Math.min(.2,.02*R),chaB:R=>.15*R,cueT:r=>Math.max(2,10/r),entF:R=>Math.min(.35,.05*R),entX:R=>.08*R,ferP:R=>.08*R,ferS:R=>.1*R,forC:R=>.15*R,forG:R=>Math.min(.35,.05*R),eleT:r=>Math.max(3,15/r),minS:R=>Math.max(16,30-2*R),minT:r=>Math.max(2,12/r),alcF:R=>Math.min(.35,.05*R),marB:R=>Math.min(.24,.03*R),marS:R=>Math.min(.4,.05*R),apoF:R=>Math.min(.56,.08*R),apoD:R=>.02*R,apoT:r=>Math.max(3,30/r),carR:r=>Math.min(.7,.1*r),bibG:R=>Math.min(.35,.05*R),bibT:R=>Math.min(.5,.05*R)};
const pcj=v=>Math.round(v*100)+' %',mnj=v=>(Math.round(v*10)/10+'').replace('.',',')+' min';
/* lignes d'effet d'un métier au rang r (village : en poste ; expédition : dans l'équipe) */
function jobFx(id,r,ev){const f=JF,v=[],x=[];r=Math.max(1,r);
 if(id=='cuisinier'){v.push(`Repas avant chaque départ (${ev?'gratuit':'20 vivres'}) : équipe ATQ/DEF +${pcj(f.cuiK(r))} pendant ${ev?8:5} combats`);x.push(`Après chaque victoire : équipe PV +${r} %`)}
 if(id=='architecte'){v.push(`Constructions et améliorations −${pcj(Math.min(.28,.04*r))}${ev?' (améliorations −10 % de plus)':''}`);if(ev)v.push('+1 terrain constructible en avance sur l’Hôtel de ville')}
 if(id=='chasseur'){v.push(`Installations de chasse : production +${pcj(f.chaB(r))}`);x.push(`Matériaux de monstre : chance +${r*5} points${r>=4?' ; +1 croc ou cuir sur les élites':''}${ev?' ; élites : 3 % de chances d’un parchemin':''}`)}
 if(id=='cueilleur'){v.push(`1 poussière d’étoile toutes les ${mnj(f.cueT(r))}`);x.push(`Herbes : tissu ${20+6*r} %${r>=3?', poussière 50 %':''}${ev?' ; +1 essence de nature par étage':''}`)}
 if(id=='entraineur'){v.push(`Séances du Camp : vivres −${pcj(f.entF(r))}, exp. +${pcj(f.entX(r))}${ev?' ; exp. ×1,25 en plus':''}`)}
 if(id=='fermier'){v.push(`Ferme : production +${pcj(f.ferP(r))}, réserve max. +${pcj(f.ferS(r))}`);if(ev)v.push('La Ferme récolte aussi du bois (1/4 des vivres)')}
 if(id=='forgeron'){v.push(`Fabrication : catalyseur de rareté +${(f.forC(r)+'').replace('.',',')} ; affinage −${pcj(f.forG(r))} d’or${r>=4?' ; renfort max. +1':''}`);if(ev)v.push('Éveil d’objet : 1 pierre de moins ; chance de 6★ ×2')}
 if(id=='eleveur'){v.push(`1 cuir${r>=4?' et 1 tissu':''} toutes les ${mnj(f.eleT(r))}`);x.push(`Familier du Dompteur +${r*10} %${ev?' ; monture : déplacement +15 % dans les étages':''}`)}
 if(id=='mineur'){v.push(`1 minerai toutes les ${mnj(f.minT(r))} ; extraction : ${f.minS(r)} pierres par minerai`);x.push(`${r>=3?'Veines de cristal sans pioche':'Veines : pioche requise (sans pioche dès le rang 3)'}${r>=5?', +1 cristal':''}${ev?' ; 10 % de noyau':''}`)}
 if(id=='alchimiste'){v.push(`Laboratoire : rareté +${(f.forC(r)+'').replace('.',',')} ; fusions −${pcj(f.alcF(r))} d’or${r>=3?' ; condenser la poussière : 3 au lieu de 4':''}${r>=4?' ; élixirs +1 dose':''}`);if(ev)v.push('Transmutation : 3 essences → 1 essence d’un autre élément')}
 if(id=='marchand'){v.push(`Marché : achats −${pcj(f.marB(r))}, ventes +${pcj(f.marS(r))} ; démantèlement +${r*5} % d’or${r>=3?' ; +1 offre':''}`);if(ev)v.push('Offre rare (parchemins et tomes ★1–3), tous les prix −15 %');x.push(`Or des combats +${r*3} %`)}
 if(id=='apothicaire'){v.push(`Infirmerie : soins −${pcj(f.apoF(r))} de vivres, risque de mort −${2*r} points ; soigne seul un blessé toutes les ${mnj(ev?Math.min(5,f.apoT(r)):f.apoT(r))}`);x.push(`Potions : soin +${r*5} %`)}
 if(id=='cartographe'){v.push(`En poste : révèle ${Math.round(f.carR(r)*50)} % de chaque étage`);x.push(`Révèle ${pcj(f.carR(r))} de la carte à l’entrée${r>=4?' ; coffres sur la carte':''}${r>=6?' ; leviers et ordre runique':''}${ev?' ; la porte de l’étage est toujours visible':''}`)}
 if(id=='bibliothecaire'){v.push(`Compétences : niveaux −${pcj(f.bibG(r))} d’or${r>=5?' ; Étudier : +3 niveaux':''} ; recherches −${pcj(f.bibT(r))} de durée`);if(ev)v.push('15 % de chances de récupérer le tome lors d’une évolution de rareté')}
 return{v,x}}
/* ---------- recherches (Bibliothèque) ---------- */
const RSCH={
 agri:{n:'Agronomie',d:'Ferme : production +15 %.',lv:1,c:{gold:300,mat_tissu:2},m:10},
 tannerie:{n:'Tannerie',d:'Installations de chasse : production +25 % ; tanner coûte 2 crocs au lieu de 3.',lv:1,c:{gold:300,mat_croc:4},m:10},
 rayon:{n:'Rayonnages',d:'Capacités de stockage +25 %.',lv:1,c:{gold:400,mat_bois:3},m:15},
 pedago:{n:'Pédagogie',d:'Expérience de métier +25 %.',lv:1,c:{gold:500,mat_tome_1:1},m:20},
 herbo:{n:'Herboristerie',d:'Laboratoire : recette du Philtre de vigueur.',lv:2,c:{gold:600,mat_poussiere:3},m:20},
 negoce:{n:'Négoce',d:'Marché : +1 offre, achats −5 %.',lv:2,c:{gold:800},m:30},
 metal:{n:'Métallurgie',d:'Forge : catalyseur de rareté +0,5 en permanence.',lv:2,c:{gold:1000,mat_lingot:3},m:30},
 cartes:{n:'Cartographie',d:'À l’entrée d’un étage, 15 % de la carte est révélée.',lv:2,c:{gold:700,mat_tissu:2},m:25},
 medecine:{n:'Médecine',d:'Infirmerie : risque de mort −5 points, soins −25 % de vivres.',lv:3,c:{gold:1200,mat_cristal:2},m:45},
 archives:{n:'Archives des étoiles',d:'Niveaux de compétence −15 % d’or.',lv:3,c:{gold:1500,mat_tome_2:1},m:60},
 transmut:{n:'Transmutation',d:'Laboratoire : une distillation donne 2 essences.',lv:3,c:{gold:1500,mat_noyau:2},m:60}};
/* point d'accroche : recherches propres aux mages (bible §9.4 : bateau montgolfier, technologies magiques). Clé → {n,d,dom,lv,c,m}. Vide pour l'instant. */
const MAGE_RS={};
const rs=k=>!!(G&&G.rs&&G.rs.done&&G.rs.done[k]);
const rsMages=()=>postedAt('biblio').filter(c=>c.mage&&!c.inj&&!c.party).length;
function rsMul(){return Math.max(.5,1-JF.bibT(JR('bibliothecaire')))*(1-.1*Math.min(2,rsMages()))}
const rsQmax=()=>bl('biblio');
function rsTick(now){const R=G.rs;if(!R||!R.q.length)return;let t=now||Date.now();while(R.q.length){const a=R.q[0];if(!a.t0)a.t0=t;const end=a.t0+a.d;if(end>t)break;R.q.shift();R.done[a.k]=1;jWork('bibliothecaire',30);toast(`${tabI('mat_tome_3')} Recherche terminée : <b>${RSCH[a.k].n}</b>`,3200);if(R.q.length)R.q[0].t0=end;if(PF)try{rp()}catch(_){}}}
/* ---------- marché ---------- */
const VAL={food:.4,wood:.8,stone:.8,mat_viande:4,mat_croc:6,mat_minerai:8,mat_poussiere:10,mat_bois:12,mat_cuir:15,mat_tissu:15,mat_lingot:30,mat_cristal:40,mat_noyau:120,mat_mithril:150,mat_fragment:15};
EK.forEach(e=>VAL['mat_essence_'+e]=50);for(let n=1;n<=6;n++){VAL['mat_parchemin_'+n]=150*Math.pow(3,n-1);VAL['mat_pierre_'+n]=120*Math.pow(3,n-1);if(n<=5)VAL['mat_tome_'+n]=120*Math.pow(3,n-1)}
const MKP=[null,[['food',100,3],['wood',100,3],['stone',100,3],['mat_minerai',5,2],['mat_cuir',3,2],['mat_tissu',3,2],['mat_bois',3,2],['mat_croc',5,2],['mat_viande',10,2],['mat_poussiere',3,2]],[['mat_lingot',2,2],['mat_cristal',2,2],['ess',2,2],['mat_parchemin_1',1,1],['mat_tome_1',1,1],['mat_pierre_1',1,1],['mat_fragment',5,1]],[['mat_noyau',1,1],['mat_mithril',1,1],['mat_parchemin_2',1,1],['mat_tome_2',1,1],['mat_pierre_2',1,1],['item',1,1]]];
const MKT_P=30*60000;
const mkBuyD=()=>Math.min(.4,JF.marB(JR('marchand'))+(rs('negoce')?.05:0)+(JE('marchand')?.15:0)),mkSellB=()=>JF.marS(JR('marchand'));
const mkN=()=>3+bl('marche')+(rs('negoce')?1:0)+(JMX('marchand')>=3?1:0);
const iPrice=it=>120*it.st*it.st;
function mkPrice(o){if(o.it)return Math.ceil(iPrice(o.it)*(1-mkBuyD()));return Math.max(1,Math.ceil(VAL[o.k]*o.n*(1-mkBuyD())))}
const sellP=k=>Math.max(1,Math.floor(VAL[k]*.4*(1+mkSellB())*100))/100;
function mkRoll(force){const L=bl('marche');if(!L)return;const slot=Math.floor(Date.now()/MKT_P);if(!force&&G.mkt&&G.mkt.s==slot&&G.mkt.L==L&&G.mkt.o.length>=mkN()-(G.mkt.rare?1:0))return;const pool=[];for(let l=1;l<=L;l++)pool.push(...MKP[l]);const o=[];
 shuffle(pool.slice()).slice(0,mkN()).forEach(([k,n,q])=>{if(k=='item'){const it=rndItem(ri(2,3));o.push({it,left:1});return}if(k=='ess')k='mat_essence_'+pick(EK);o.push({k,n,left:q})});
 let rare=null;if(JE('marchand')){const x=Math.random(),t=x<.6?1:x<.92?2:3;rare={k:evoKey(pick(['parchemin','tome']),t),n:1,left:1,rare:1};o.push(rare)}
 G.mkt={s:slot,L,o,rare:!!rare,rf:G.mkt&&G.mkt.s==slot?G.mkt.rf||0:0}}
/* ---------- laboratoire ---------- */
const LABR={potion:{n:'Potion de soin',it:'potion',c:{mat_viande:2,mat_poussiere:1,gold:10},lv:1},elixir:{n:'Élixir d’énergie',it:'elixir',c:{mat_poussiere:2,mat_cristal:1,gold:30},lv:1},
 phil:{n:'Philtre de vigueur',c:{mat_viande:3,mat_poussiere:2,gold:30},lv:2,rs:'herbo',d:'Équipe : DEF +12 % pendant les 3 prochains combats (cumulable jusqu’à 9 combats).'},
 ess:{n:'Distillation d’essence',c:{mat_cristal:1,mat_poussiere:2,gold:40},lv:2,d:'1 essence de l’élément choisi (2 avec la recherche Transmutation).'}};
const labB=()=>JF.forC(JR('alchimiste','labo')+JR('apothicaire','labo')/2);
const labOdds=()=>crOdds(bl('labo'),labB());
/* ---------- production du village (horloge commune, 1 s ; dt plafonné à 60 s quand l'onglet dort) ---------- */
const CHR={mat_viande:10,mat_croc:3,mat_cuir:1.5};
const chaMul=()=>(1+JF.chaB(JR('chasseur','chasse'))+(rs('tannerie')?.25:0)+(hdvLv()>=3?.1:0));
const ferMul=()=>(1+JF.ferP(JR('fermier'))+(rs('agri')?.15:0)+(hdvLv()>=3?.1:0)),ferMax=lv=>Math.round(60*lv*(1+JF.ferS(JR('fermier'))));
let vtLast=Date.now();
function vTick(){const now=Date.now(),dt=Math.min(60,Math.max(0,(now-vtLast)/1000));vtLast=now;if(!G||G.intro===0||!dt)return;
 G.plots.forEach(p=>{if(!p)return;if(p.k=='ferme')p.stock=Math.min(ferMax(p.lv),(p.stock||0)+p.lv/4*dt*ferMul());
  if(p.k=='chasse'){p.acc=p.acc||{};const m=chaMul();for(const k in CHR)p.acc[k]=Math.min(CHR[k]*p.lv*m*4,(p.acc[k]||0)+CHR[k]*p.lv*m*dt/3600)}});
 G.chars.forEach(c=>{if(!working(c))return;const J=c.job;J.t=(J.t||0)+dt;while(J.t>=10){J.t-=10;jXP(c,1)}if(!jobOK(c))return;const r=jRank(c);
  const per=(min,fn)=>{J.acc=(J.acc||0)+dt;const P=min*60;while(J.acc>=P){J.acc-=P;fn()}};
  if(J.id=='cueilleur')per(JF.cueT(r),()=>addCap('mat_poussiere',1));
  else if(J.id=='eleveur')per(JF.eleT(r),()=>{addCap('mat_cuir',1);if(r>=4)addCap('mat_tissu',1)});
  else if(J.id=='mineur')per(JF.minT(r),()=>addCap('mat_minerai',1));
  else if(J.id=='apothicaire'&&J.post=='inf'){const inj=G.chars.filter(x=>x.inj||x.wd);if(inj.length)per(jEvo(c)?Math.min(5,JF.apoT(r)):JF.apoT(r),()=>{const x=G.chars.find(x=>x.inj||x.wd);if(x){injCure(x);jXP(c,5);toast(`${c.name} a soigné <b>${x.name}</b> à l’Infirmerie.`);if(mode=='village')syncNPC()}});else J.acc=0}});
 rsTick(now);vtS+=dt;if(vtS>=10){vtS=0;save()}}
let vtS=0;
/* ---------- postes : affecter / retirer ---------- */
function postSet(cid,k){const c=G.chars.find(x=>x.id==cid);if(!c)return;if(!k){c.job.post=null;c.job.acc=0;save();syncNPC();vRefresh();rp();return}
 if(!postsOf(c).includes(k))return toast('Ce métier n’a pas de poste dans ce bâtiment.');if(c.inj)return toast(`${c.name} est blessé : soignez-le d’abord.`);
 if(postedAt(k).filter(x=>x!=c).length>=bSlots(k))return toast('Tous les postes sont occupés : améliorez le bâtiment pour en ouvrir un de plus.');
 if(c.party){if(party().length<2)return toast('Il faut au moins un combattant dans l’équipe.');c.party=0;reidx()}
 c.job.post=k;c.job.acc=0;save();syncNPC();vRefresh();toast(`${c.name} prend son poste : <b>${BLD[k].n}</b>.`);rp()}
/* remet les postes en ordre : bâtiment cible construit → le poste y migre ; poste devenu invalide → libéré */
function postFix(){G.chars.forEach(c=>{if(!c.job)return;const J=c.job;if(!J.post)return;const P=postsOf(c);if(!P.includes(J.post)){const t=P.find(k=>postedAt(k).length<bSlots(k));J.post=t||null}else if(J.id&&JOBP[J.id]&&!JOBP[J.id][0].includes(J.post)&&!(c.mage&&J.post=='biblio')){const t=JOBP[J.id][0].find(k=>bl(k)&&postedAt(k).length<bSlots(k));if(t)J.post=t}});
 G.plots.forEach(p=>{if(!p)return;const w=postedAt(p.k);w.slice(bSlots(p.k)).forEach(c=>c.job.post=null)})}
let POSTB=null;
function postesHTML(i){const pl=G.plots[i],k=pl.k,w=postedAt(k),n=bSlots(k),el=G.chars.filter(c=>postsOf(c).includes(k)&&c.job.post!=k);
 let h=`<h3 class="sh mh">${tabI2(pIco('job_architecte','#e8945a','P'))}Postes <span class="m">(${w.length} / ${n})</span></h3><p class="m">Un poste par niveau. Un personnage en poste travaille au village : il gagne de l’expérience de métier (+1 toutes les 10 s) mais ne part pas en expédition.</p><div class="posts">`;
 for(let s=0;s<n;s++){const c=w[s];if(c){const ok=jobOK(c),mg=c.mage&&k=='biblio'&&!ok,r=jRank(c),fx=ok?jobFx(c.job.id,jEr(c),jEvo(c)).v:[];h+=`<div class="pst${c.inj?' inj':''}"><img class="sp" src="${cs(c).url}" alt=""><div class="gr"><b>${c.name}</b> ${stars(c.st)}<div class="m">${c.job.id?`${tabI2(jIco(c))}${jName(c)} · ${JRANKN[Math.max(0,r-1)]}`:''}${mg?' · <span class="g">mage chercheur : recherches −10 %</span>':''}</div>${c.inj?'<div class="w">Blessé : ne travaille pas</div>':''}${fx.length?`<div class="m pfx">${fx[0]}</div>`:''}</div><button class="alt" onclick="postSet(${c.id})">Retirer</button></div>`}
  else h+=`<div class="pst emp"><i class="pe0">+</i><div class="gr"><b class="m">Poste libre</b><div class="m">${el.length?el.length+' personnage'+(el.length>1?'s':'')+' qualifié'+(el.length>1?'s':''):'Aucun métier adapté pour l’instant'}</div></div><button ${el.length?'':'disabled'} onclick="openPost(${i})">Affecter</button></div>`}
 const jl=Object.keys(JOBP).filter(j=>jobPosts(j).includes(k));h+=`</div><p class="m">Métiers utiles ici : ${jl.length?jl.map(j=>`${tabI2(pIco('job_'+j,'#e8945a',JOBS[j][0]))}${JOBS[j][0]}`).join(' · '):'aucun'}${k=='biblio'?' · tout mage (recherches)':''}.</p>`;return h}
function openPost(i){POSTB=i;openPanel(()=>{const pl=G.plots[i];if(!pl)return['Postes',''];const k=pl.k,full=postedAt(k).length>=bSlots(k),L=G.chars.filter(c=>postsOf(c).includes(k)&&c.job.post!=k).sort((a,b)=>jEr(b)-jEr(a));
 return[`Affecter · ${BLD[k].n}`,`<p><button class="alt" onclick="openB(${i})">← ${BLD[k].n}</button></p><p class="m">Choisissez un travailleur. ${full?'<b class="w">Tous les postes sont occupés.</b>':''} Un membre de l’équipe qui prend un poste quitte l’équipe.</p>`+(L.map(c=>{const r=jRank(c),ok=jobPosts(c.job.id||'').includes(k),fx=ok?jobFx(c.job.id,jEr(c),jEvo(c)):{v:[]};return`<div class="pst"><img class="sp" src="${cs(c).url}" alt=""><div class="gr"><b>${c.name}</b> ${stars(c.st)} <span class="m">niv. ${c.lv}</span>${c.party?' <span class="tg">dans l’équipe</span>':''}${c.job.post?` <span class="tg">en poste : ${BLD[c.job.post].n}</span>`:''}<div class="m">${c.job.id?`${tabI2(jIco(c))}${jName(c)} · ${JRANKN[Math.max(0,r-1)]}${c.job.nat?' · vocation':''}`:'Mage'}</div>${ok?`<div class="m pfx">${fx.v[0]||''}</div>`:'<div class="m pfx">Mage chercheur : recherches −10 %</div>'}</div><button ${full||c.inj?'disabled':''} onclick="postSet(${c.id},'${k}');openB(${i})">${c.inj?'Blessé':'Affecter'}</button></div>`}).join('')||'<p>Aucun personnage n’a de métier adapté à ce bâtiment.</p>')]})}
/* ---------- panneaux des nouveaux bâtiments ---------- */
const HDVT=[['Terrains',L=>`${Math.min(10,6+2*L)}`],['Bâtiments',L=>L<1?'les 5 premiers':L<2?'+ Chasse, Entrepôt, Marché':L<3?'+ Bibliothèque, Laboratoire':'tous'],['Niveau max. des nouveaux bâtiments',L=>`${L}`],['Niveau 3 des premiers bâtiments',L=>L>=1?'oui':'non'],['Production (Ferme, Chasse)',L=>L>=3?'+10 %':'—']];
function hdvHTML(pl){const L=pl.lv;return`<table class="ht"><tr><th></th>${[0,1,2,3].map(l=>`<th class="${l==L?'on':''}">${l?'niv. '+l:'sans'}</th>`).join('')}</tr>${HDVT.map(([n,f])=>`<tr><td>${n}</td>${[0,1,2,3].map(l=>`<td class="${l==L?'on':''}">${f(l)}</td>`).join('')}</tr>`).join('')}</table><p class="m">Terrains ouverts : <b>${plotsOpen()} / 10</b>${JE('architecte')?' (dont +1 du Maître bâtisseur)':''}. Architectes et Cartographes y prennent leur poste.</p>`}
function chasseHTML(i,pl){const a=pl.acc||{},m=chaMul();return`<p class="m">Production par heure (×${m.toFixed(2).replace('.',',')}) ; la réserve se remplit jusqu’à 4 h de production.</p><div class="chs">${Object.keys(CHR).map(k=>`<div class="mt" style="--rc:${MATS[k].c}"><img src="${mSrc(k)}" alt=""><b class="q">${Math.floor(a[k]||0)}</b><span>${MATS[k].n} · ${(Math.round(CHR[k]*pl.lv*m*10)/10+'').replace('.',',')}/h</span></div>`).join('')}</div><button class="ib" ${Object.keys(CHR).some(k=>(a[k]||0)>=1)?'':'disabled'} onclick="chaGet(${i})">Récupérer</button>`}
function chaGet(i){const pl=G.plots[i];if(!pl||!pl.acc)return;const o={};for(const k in CHR){const n=Math.floor(pl.acc[k]||0);if(n>0){const d=addCap(k,n);pl.acc[k]-=n;if(d)o[k]=d}}save();rp();if(Object.keys(o).length)toast('Chasse : '+mShort(o))}
function entrepotHTML(pl){const L=pl.lv,row=(k,nm,ic)=>{const v=isM(k)?mN(k):G.res[k]|0,cp=capOf(k),nx=L<3?Math.round(CAPT[isM(k)?'mat':k][L+1]*(rs('rayon')?1.25:1)):0;return`<div class="cap"><span class="cn">${ic}${nm}</span><div class="xpb"><i style="width:${Math.min(100,Math.round(v/cp*100))}%;${v>=cp?'background:var(--orange,#ff9a3a)':''}"></i></div><b>${v} / ${cp}</b>${nx?`<span class="nx">→ ${nx}</span>`:''}</div>`};
 const top=MK.filter(k=>capped(k)&&isM(k)).sort((a,b)=>mN(b)-mN(a)).slice(0,6);
 return`<p class="m">Au-delà de la capacité, les gains sont perdus. Rien n’est jamais retiré : un stock déjà au-dessus reste intact. Or, éclats et ingrédients d’évolution ne sont pas limités.</p>${row('food','Vivres',rIco('food'))}${row('wood','Bois',rIco('wood'))}${row('stone','Pierre',rIco('stone'))}<p class="m" style="margin-top:8px">Matériaux et essences : <b>${capOf('mat_minerai')}</b> par type. Les plus remplis :</p>${top.map(k=>row(k,MATS[k].n,mIco(k))).join('')}`}
function marcheHTML(){mkRoll();const M=G.mkt,left=MKT_P-(Date.now()%MKT_P),d=mkBuyD(),sb=mkSellB();
 let h=tabsH(MTAB,[['buy','Acheter','res_gold'],['sell','Vendre','res_gold']],'setMT');
 if(MTAB=='buy'){h+=`<p class="m">Nouvelles offres dans <b>${fmtT(Math.ceil(left/1000))}</b>${d?` · prix −${pcj(d)}`:''}. <button class="alt" ${G.res.gold<60?'disabled':''} onclick="mkRefresh()">Renouveler (60 or)</button></p><div class="mko">`+M.o.map((o,i)=>{const p=mkPrice(o),img=o.it?itemSrc(o.it):mSrc(o.k),nm=o.it?iName(o.it)+' '+stars(o.it.st):(isM(o.k)?MATS[o.k].n:RES[o.k][0]),q=o.it?'':'×'+o.n,full=!o.it&&capped(o.k)&&haveX(o.k)>=capOf(o.k);return`<div class="mk${o.left?'':' sold'}${o.rare?' rare':''}"><img src="${img}" alt=""><div class="gr"><b>${nm}</b> <span class="m">${q}</span>${o.rare?'<div class="g">Offre du Prince marchand</div>':''}<div class="m">Reste : ${o.left}${full?' · <span class="w">stock plein</span>':''}</div></div><button class="ib" ${!o.left||G.res.gold<p||full?'disabled':''} onclick="mkBuy(${i})">${rIco('gold')} ${p}</button></div>`}).join('')+'</div>'}
 else{const ks=Object.keys(VAL).filter(k=>haveX(k)>0);h+=`<p class="m">Le Marché rachète à 40 % de la valeur${sb?` (+${pcj(sb)} grâce aux marchands)`:''}. Ressources par lots de 50.</p><div class="mko">`+(ks.map(k=>{const res=!isM(k),lot=res?50:1,u=sellP(k),have=haveX(k),n1=res?50:1,n2=res?500:10;return`<div class="mk"><img src="${res?aSrc('res_'+k)||mSrc(k):mSrc(k)}" alt=""><div class="gr"><b>${res?RES[k][0]:MATS[k].n}</b> <span class="m">× ${have}</span><div class="m">${rIco('gold')} ${Math.floor(u*lot*100)/100} / ${res?'50':'unité'}</div></div><span class="mkb"><button class="alt" ${have<n1?'disabled':''} onclick="mkSell('${k}',${n1})">${res?'50':'1'}</button><button class="alt" ${have<n1?'disabled':''} onclick="mkSell('${k}',${n2})">${res?'500':'10'}</button></span></div>`}).join('')||'<p>Rien à vendre.</p>')+'</div>'}
 return h}
let MTAB='buy';function setMT(k){MTAB=k;rp();tabTop()}
function mkRefresh(){if(G.res.gold<60)return;G.res.gold-=60;mkRoll(1);save();rp()}
function mkBuy(i){const o=G.mkt&&G.mkt.o[i];if(!o||!o.left)return;const p=mkPrice(o);if(G.res.gold<p)return;if(!o.it&&capped(o.k)&&haveX(o.k)>=capOf(o.k))return toast('Stock plein : agrandissez l’Entrepôt.');G.res.gold-=p;o.left--;
 if(o.it){G.items.push(o.it);toast(`Acheté : <b>${iName(o.it)}</b> (dans la réserve)`);o.it=Object.assign({},o.it,{id:G.iid++})}else{addCap(o.k,o.n);toast(`Acheté : ${isM(o.k)?mIco(o.k):rIco(o.k)} ×${o.n}`)}jWork('marchand',2);save();rp()}
function mkSell(k,n){n=Math.min(n,haveX(k));if(!isM(k))n=Math.floor(n/50)*50;if(n<=0)return;const g=Math.floor(sellP(k)*n);payX({[k]:n});G.res.gold+=g;jWork('marchand',2);save();rp();toast(`Vendu ×${n} : +${g} or`)}
function bibHTML(pl){rsTick();const R=G.rs,L=pl.lv,mul=rsMul(),now=Date.now();let h=`<p class="m">Une recherche à la fois ; file d’attente : <b>${R.q.length} / ${rsQmax()}</b>. Durée ×${mul.toFixed(2).replace('.',',')}${JR('bibliothecaire')?' (bibliothécaires)':''}${rsMages()?' (mages chercheurs)':''}. Le temps passe même jeu fermé.</p>`;
 if(R.q.length)h+=R.q.map((a,j)=>{const S=RSCH[a.k],t0=j==0?a.t0:0,k=t0?Math.min(1,(now-t0)/a.d):0,rem=t0?Math.max(0,a.t0+a.d-now):a.d;return`<div class="rsq"><b>${j==0?'En cours':'En attente'} : ${S.n}</b><div class="xpb"><i style="width:${Math.round(k*100)}%"></i></div><span class="m">${fmtT(Math.ceil(rem/1000))}</span>${j>0?`<button class="alt" onclick="rsCancel(${j})">Annuler</button>`:''}</div>`}).join('');
 h+=`<div class="rsg">`+Object.keys(RSCH).map(k=>{const S=RSCH[k],done=rs(k),inq=R.q.some(a=>a.k==k),lk=S.lv>L,o=S.c;return`<div class="rsc${done?' done':''}${lk?' lk':''}"><div><b>${S.n}</b> ${done?'<span class="tg ins">acquise</span>':lk?`<span class="tg">Bibliothèque niv. ${S.lv}</span>`:''}</div><div class="m">${S.d}</div>${done?'':`<div class="cr">${costX(o)}<span class="m">${mnj(S.m*mul)}</span><button class="ib" ${done||inq||lk||R.q.length>=rsQmax()||!canX(o)?'disabled':''} onclick="rsStart('${k}')">${inq?'En file':'Rechercher'}</button></div>`}</div>`}).join('')+`</div><p class="m">Recherches des mages (bateau montgolfier, magie) : à venir. Un mage en poste ici accélère déjà les recherches de 10 %.</p>`;return h}
function rsStart(k){const S=RSCH[k],R=G.rs;if(!S||rs(k)||R.q.some(a=>a.k==k)||R.q.length>=rsQmax()||S.lv>bl('biblio')||!canX(S.c))return;payX(S.c);R.q.push({k,d:Math.round(S.m*60000*rsMul()),t0:R.q.length?0:Date.now()});save();rp()}
function rsCancel(j){const R=G.rs,a=R.q[j];if(!a||j==0)return;R.q.splice(j,1);giveM(RSCH[a.k].c);for(const k in RSCH[a.k].c)if(!isM(k))G.res[k]+=RSCH[a.k].c[k];save();rp()}
let LABEL='feu',LTRF='feu';
function laboHTML(pl){const L=pl.lv,p=labOdds(),alc=JMX('alchimiste');let h=`<p class="m">Rareté des potions et élixirs : ${p.map((v,i)=>v>.0005?`${i+1}★ ${pcF(v)}`:'').filter(x=>x).join(' · ')}${labB()?` (alchimistes : catalyseur +${(Math.round(labB()*100)/100+'').replace('.',',')})`:''}.</p>${G.buff&&G.buff.phil?`<p class="g">Philtres actifs : DEF +12 % pendant ${G.buff.phil} combat${G.buff.phil>1?'s':''}.</p>`:''}`;
 h+=Object.keys(LABR).map(k=>{const R=LABR[k],lk=R.lv>L,nr=R.rs&&!rs(R.rs),o=labCost(k),dis=lk||nr||!canX(o)||(k=='phil'&&(G.buff.phil||0)>=9);return`<div class="lbr"><img src="${R.it?aSrc(ITYPES[R.it].icon)||mSrc('mat_poussiere'):k=='ess'?mSrc('mat_essence_'+LABEL):mSrc('mat_viande')}" alt=""><div class="gr"><b>${R.n}</b> ${lk?`<span class="tg">Laboratoire niv. ${R.lv}</span>`:nr?`<span class="tg">recherche : ${RSCH[R.rs].n}</span>`:''}<div class="m">${R.d||(R.it?ITYPES[R.it].n+' de rareté aléatoire'+(R.it=='elixir'&&alc>=4?' (+1 dose)':''):'')}</div>${k=='ess'?`<div class="els">${EK.map(e=>`<button class="${LABEL==e?'on':'alt'}" style="--ec:${ELEMS[e].c}" onclick="LABEL='${e}';rp()">${ELEMS[e].n}</button>`).join('')}</div>`:''}<div class="cr">${costX(o)}<button class="ib" ${dis?'disabled':''} onclick="brew('${k}')">Préparer</button></div></div></div>`}).join('');
 if(JE('alchimiste')){const o={['mat_essence_'+LTRF]:3};h+=`<div class="lbr"><img src="${mSrc('mat_essence_'+LABEL)}" alt=""><div class="gr"><b>Transmutation</b> <span class="tg ins">Grand alchimiste</span><div class="m">3 essences d’un élément → 1 essence de l’élément choisi ci-dessus (${ELEMS[LABEL].n}).</div><div class="els">${EK.filter(e=>e!=LABEL).map(e=>`<button class="${LTRF==e?'on':'alt'}" onclick="LTRF='${e}';rp()">${ELEMS[e].n} (${mN('mat_essence_'+e)})</button>`).join('')}</div><div class="cr">${costX(o)}<button class="ib" ${LTRF==LABEL||!canX(o)?'disabled':''} onclick="transm()">Transmuter</button></div></div></div>`}
 return h}
function labCost(k){return Object.assign({},LABR[k].c)}
function brew(k){const R=LABR[k],L=bl('labo');if(!R||R.lv>L||(R.rs&&!rs(R.rs)))return;const o=labCost(k);if(!canX(o))return;if(k=='phil'&&(G.buff.phil||0)>=9)return;payX(o);jWork('alchimiste',5,'labo');jWork('apothicaire',5,'labo');
 if(R.it){const st=crRoll(labOdds()),it=mkItem(R.it,st);if(R.it=='elixir'&&JMX('alchimiste')>=4)it.q=(it.q||1)+1;G.items.push(it);save();rp();if(st>=4)evoReveal({img:itemSrc(it),col:TIERC[st-1],title:'CHEF-D’ŒUVRE !',name:iName(it),from:0,to:st,lines:[iTxt(it)],small:1});else toast(`Préparé : <b>${iName(it)}</b> ${'★'.repeat(st)} (dans la réserve)`);return}
 if(k=='phil'){G.buff.phil=Math.min(9,(G.buff.phil||0)+3);toast('Philtre de vigueur prêt : DEF +12 % pendant les 3 prochains combats.')}
 if(k=='ess'){const n=rs('transmut')?2:1,d=addCap('mat_essence_'+LABEL,n);toast(`Distillé : ${mIco('mat_essence_'+LABEL)} +${d} ${MATS['mat_essence_'+LABEL].n}`)}
 save();rp()}
function transm(){if(!JE('alchimiste')||LTRF==LABEL)return;const o={['mat_essence_'+LTRF]:3};if(!canX(o))return;payX(o);addCap('mat_essence_'+LABEL,1);jWork('alchimiste',5);save();rp();toast(`Transmutation : ${mIco('mat_essence_'+LABEL)} +1`)}
/* ---------- onglet Métier de la fiche ---------- */
function jobHTML(c){const J=c.job;if(c.lv<5)return`<p class="m">Le métier s’éveille au niveau 5 : deux vocations seront proposées selon la personnalité, les sous-traits et la race.</p>${c.mage?'<p class="m">Mage : peut déjà prendre un poste de chercheur à la Bibliothèque.</p>':''}`;
 if(!J.id)return`<p>Deux vocations attendent : ${(J.voc||vocOf(c)).map(k=>`<b class="g">${JOBS[k][0]}</b>`).join(' ou ')}.</p><button onclick="openJobChoice(${c.id})">Choisir le métier</button>`;
 const r=jRank(c),ev=jEvo(c),pm=J.pm||0,nx=r<7?JRK[r]:0,lvB=r<7&&pm>=JRK[r]&&c.lv<JRL[r],k0=JRK[r-1],fx=jobFx(J.id,jEr(c),ev),fn=r<7?jobFx(J.id,r+1,ev||r+1>=6):null,P=postsOf(c);
 let h=`<div class="jhd"><img class="jbig${ev?' evo':''}" src="${jIco(c)}" alt=""><div class="gr"><b class="bn">${jName(c)}</b>${ev?` <span class="m">(${JOBS[J.id][0]} évolué)</span>`:''}<div><span class="tg">${JRANKN[r-1]} · rang ${r}/7</span>${J.nat?'<span class="tg ins">vocation naturelle (+25 %)</span>':''}${rs('pedago')?'<span class="tg ins">Pédagogie (+25 %)</span>':''}</div>
 <div class="xpl"><span>${Math.floor(pm)} pts</span><div class="xpb"><i style="width:${r<7?Math.round(Math.min(1,(pm-k0)/(nx-k0))*100):100}%"></i></div><span class="m">${r<7?nx+' pts':'maximum'}</span></div>${lvB?`<p class="w">Rang ${JRANKN[r]} : niveau ${JRL[r]} requis${r+1==6?' (métier évolué)':''}.</p>`:''}</div></div>`;
 h+=`<h3 class="sh">Poste</h3>`;if(J.post){const pi=plotOf(J.post);h+=`<div class="pst"><img class="sp" src="${bUi(J.post,bl(J.post))}" alt="" style="width:64px;height:48px"><div class="gr"><b>${BLD[J.post].n}</b>${c.inj?' <span class="w">blessé : ne travaille pas</span>':''}<div class="m">${jobOK(c)?'Effets village actifs (ci-dessous). +1 pt de métier toutes les 10 s.':'Mage chercheur : recherches −10 %.'}</div></div>${pi>=0?`<button class="alt" onclick="openB(${pi})">Voir</button>`:''}<button class="alt" onclick="postSet(${c.id})">Retirer</button></div>`}
 else h+=`<p class="m">${P.length?`Sans poste. Postes possibles : ${P.map(k=>{const pi=plotOf(k),fr=postedAt(k).length<bSlots(k);return`<button class="alt" ${fr&&!c.inj?'':'disabled'} onclick="postSet(${c.id},'${k}')">${BLD[k].n} (${postedAt(k).length}/${bSlots(k)})</button>`}).join(' ')}${c.party?' <br>Prendre un poste le retire de l’équipe.':''}`:`Aucun bâtiment de poste construit (${JOBP[J.id][0].map(k=>BLD[k].n).join(' / ')}).`}${JEXP.includes(J.id)?' Dans l’équipe, ses effets d’expédition s’appliquent.':''}</p>`;
 const li=a=>a.length?`<ul class="eff">${a.map(t=>`<li>${t}</li>`).join('')}</ul>`:'<p class="m">—</p>';
 h+=`<h3 class="sh">Effets actuels (rang ${r})</h3><p class="m">Au village (en poste) :</p>${li(fx.v)}${fx.x.length?`<p class="m">En expédition (dans l’équipe) :</p>${li(fx.x)}`:''}`;
 if(fn)h+=`<h3 class="sh">Rang suivant : ${JRANKN[r]}</h3><p class="m">${JRK[r]} pts${JRL[r]>c.lv?` et niveau ${JRL[r]}`:''}.</p>${li(fn.v.filter(t=>!fx.v.includes(t)).concat(fn.x.filter(t=>!fx.x.includes(t))))}`;
 const fe=jobFx(J.id,Math.max(r,1),1),evl=fe.v.concat(fe.x).filter(t=>!jobFx(J.id,Math.max(r,1),0).v.concat(jobFx(J.id,Math.max(r,1),0).x).includes(t));
 h+=`<h3 class="sh">Évolution (niv. 45)</h3><div class="skr" style="--rc:#ffcf4a"><img class="ski" src="${pIco('job_'+J.id+'_evo','#ffcf4a',JOBS[J.id][2])}" alt=""><div class="gr"><b>${JOBS[J.id][2]}</b> ${ev?'<span class="tg ins">obtenue</span>':`<span class="m">au niveau 45 (actuel ${c.lv})</span>`}<div class="m">Débloque les rangs Maître et Grand maître.</div>${li(evl)}</div></div>`;
 const cost=500*c.st;h+=`<h3 class="sh">Reconversion</h3><p class="m">Changer de métier coûte <b>${cost} or</b> et ramène au rang Apprenti (points remis à zéro).</p><button class="alt" onclick="openRecon(${c.id})">Choisir un autre métier…</button>`;
 return h}
let RSEL=null;
function openRecon(id){const c=G.chars.find(x=>x.id==id);if(!c)return;RSEL=null;evArm=0;openPanel(()=>{const cost=500*c.st;return[`Reconversion · ${c.name}`,`<p><button class="alt" onclick="openSheet(${c.id})">← Fiche</button></p><p class="m">Coût : <b>${cost} or</b> · retour au rang Apprenti. La vocation naturelle (+25 %) ne vaut que pour <b>${JOBS[(c.job.voc||[c.job.id])[0]][0]}</b>.</p><div class="jcards jall">${Object.keys(JOBS).filter(k=>k!=c.job.id).map(k=>`<button class="jcard${RSEL==k?' on':''}" onclick="RSEL='${k}';evArm=0;rp()"><img src="${pIco('job_'+k,'#e8945a',JOBS[k][0])}" alt=""><b>${JOBS[k][0]}</b>${(c.job.voc||[])[0]==k?'<span class="rib">Vocation</span>':''}<span class="m">${jobFx(k,1,0).v.concat(jobFx(k,1,0).x)[0]||''}</span><span class="m">Poste : ${JOBP[k][0].map(b=>BLD[b].n).join(' / ')}</span></button>`).join('')}</div><p class="chb"><button class="${evArm==3?'red':''}" ${RSEL&&G.res.gold>=cost?'':'disabled'} onclick="reconOk(${c.id})">${evArm==3?'Confirmer ?':'Se reconvertir'}</button></p>`]})}
function reconOk(id){const c=G.chars.find(x=>x.id==id),cost=500*c.st;if(!c||!RSEL||G.res.gold<cost)return;if(evArm!=3){evArm=3;return rp()}evArm=0;G.res.gold-=cost;c.job.id=RSEL;c.job.pm=0;c.job.nat=(c.job.voc||[])[0]==RSEL;c.job.post=null;c.job.acc=0;save();toast(`${c.name} devient <b>${JOBS[RSEL][0]}</b> (apprenti).`);openSheet(c.id)}
/* ---------- départ en expédition : repas du Cuisinier, philtres ; carte du Cartographe ---------- */
function expStart(){F.meal=null;const R=JR('cuisinier','auberge');if(R){const ev=JE('cuisinier');if(ev||G.res.food>=20){if(!ev)G.res.food-=20;F.meal={n:ev?8:5,k:JF.cuiK(R)};jWork('cuisinier',5,'auberge')}}
 const pr=Math.max(PRk('cartographe'),JMX('cartographe')?JR('cartographe','hdv')/2:0),fr=Math.min(.85,JF.carR(pr)+(rs('cartes')?.15:0));F.carto=PRk('cartographe');F.cartoE=PE('cartographe');
 if(fr>0){const t=[];for(let i=0;i<N*N;i++)if(F.w[i])t.push(i);const goal=Math.round(t.length*fr);let n=0,g=0;const cs0=shuffle(F.ents.slice());while(n<goal&&g++<400){const e=cs0.length?cs0.pop():{x:pick(t)%N*16,y:Math.floor(pick(t)/N)*16},ex=e.x>>4,ey=e.y>>4;for(let j=-5;j<=5;j++)for(let i=-5;i<=5;i++){const a=ex+i,b=ey+j;if(a>=0&&b>=0&&a<N&&b<N&&i*i+j*j<=27&&!F.seen[b*N+a]){F.seen[b*N+a]=1;if(F.w[b*N+a])n++}}}}
 const m=[];if(F.meal)m.push(`Repas du cuisinier : ATQ/DEF +${pcj(F.meal.k)} (${F.meal.n} combats)`);if(G.buff.phil)m.push(`Philtre : DEF +12 % (${G.buff.phil} combats)`);if(fr>0)m.push(`Carte : ${pcj(fr)} révélés`);if(F.carto>=6&&F.law=='verrous')m.push('Ordre runique : '+F.order.map(i=>RUNE[i]).join(' → '));return m}
/* fin d'étage : expérience de métier de l'équipe, essences du cueilleur évolué */
function expEnd(win){if(!win)return;party().forEach(c=>{if(c.job&&c.job.id)jXP(c,JEXP.includes(c.job.id)?20:10)});if(PE('cueilleur'))addM({mat_essence_nature:1})}
/* migration : sauvegarde tdE6 → version 7 (métiers, nouveaux bâtiments) ; copie de sécurité tdE6_v6_bak */
function migrateJobs(){if((G.ver|0)>=7&&G.plots.length>HSITE)return fixJobs();try{if(!localStorage.getItem('tdE6_v6_bak')){const o=localStorage.getItem('tdE6');if(o)localStorage.setItem('tdE6_v6_bak',o)}}catch(_){}
 if(!Array.isArray(G.plots))G.plots=[];while(G.plots.length<=HSITE)G.plots.push(null);G.plots=G.plots.slice(0,HSITE+1).map(p=>p&&BLD[p.k]?p:null);G.ver=7;fixJobs()}
function fixJobs(){while(G.plots.length<=HSITE)G.plots.push(null);if(!G.rs||typeof G.rs!='object')G.rs={done:{},q:[]};if(!G.rs.done)G.rs.done={};if(!Array.isArray(G.rs.q))G.rs.q=[];G.rs.q=G.rs.q.filter(a=>a&&RSCH[a.k]);if(!G.buff||typeof G.buff!='object')G.buff={};
 G.chars.forEach(c=>{if(!c.job||typeof c.job!='object')c.job={id:null,pm:0,voc:null,post:null};if(c.job.id&&!JOBS[c.job.id])c.job.id=null;if(!(c.job.pm>=0))c.job.pm=0;if(c.job.post&&!BLD[c.job.post])c.job.post=null;if(c.job.post&&c.party)c.party=0;if(c.cls&&c.lv>=5&&!c.job.id&&!c.cls.pend.job){c.cls.pend.job=1;if(!c.job.voc)c.job.voc=vocOf(c)}});
 if(G.chars.length&&!G.chars.some(c=>c.party&&!c.inj)){const c=G.chars.find(c=>!c.inj)||G.chars[0];c.party=1;if(c.job)c.job.post=null}postFix()}
/* ---------- coûts et effets des premiers bâtiments, ajustés par les métiers ---------- */
const campC=lv=>Math.round(Math.max(10,28-6*lv)*(1-JF.entF(JR('entraineur','camp')))),campX=lv=>Math.round((40+20*lv)*(1+JF.entX(JR('entraineur','camp')))*(JE('entraineur')?1.25:1));
const infC=lv=>Math.round(Math.max(8,34-8*lv)*(1-JF.apoF(JR('apothicaire','inf')))*(rs('medecine')?.75:1));
const fRf=()=>JMX('forgeron')>=4?1:0,forgeB=()=>JF.forC(JR('forgeron','forge'))+(rs('metal')?.5:0);
function refI(R){const o=Object.assign({},R.i);if(o.gold)o.gold=Math.round(o.gold*(1-JF.forG(JR('forgeron'))));if(R.o=='mat_minerai'&&o.stone&&JR('mineur'))o.stone=JF.minS(JR('mineur'));if(R.o=='mat_cristal'&&o.mat_poussiere&&JMX('alchimiste')>=3)o.mat_poussiere=3;if(R.o=='mat_cuir'&&o.mat_croc&&rs('tannerie'))o.mat_croc=2;return o}
function harvest(i){const p=G.plots[i];if(!p)return;const n=p.stock|0;p.stock-=n;addCap('food',n);if(JE('fermier'))addCap('wood',Math.floor(n/4));save();rp()}
function jobEvoReveal(c){const id=c.job.id,a=jobFx(id,jRank(c),0),b=jobFx(id,jRank(c),1),nw=b.v.concat(b.x).filter(t=>!a.v.concat(a.x).includes(t));evoReveal({img:pIco('job_'+id+'_evo','#ffcf4a',JOBS[id][2]),col:'#ffcf4a',title:'MÉTIER ÉVOLUÉ !',name:JOBS[id][2],from:0,to:0,small:1,lines:[`${c.name} · ${JOBS[id][0]} → <b class="g">${JOBS[id][2]}</b>`,'Rangs Maître et Grand maître accessibles'].concat(nw.map(t=>'<span class="g">'+t+'</span>'))})}
const SKEY='tdE6';
function save(){try{localStorage.setItem(SKEY,JSON.stringify(G))}catch(e){}}
/* migration des anciennes sauvegardes (tdE4) : rôle fixe → arme équipée correspondante, niveau de forge conservé */
function migrate(){if(!Array.isArray(G.items))G.items=[];G.items=G.items.filter(it=>it&&ITYPES[it.t]);G.chars.forEach(c=>{if(c.eq)SLK.forEach(k=>{if(c.eq[k]&&!ITYPES[c.eq[k].t])c.eq[k]=null})});if(!G.iid)G.iid=1;if(!G.dead)G.dead=[];G.chars.forEach(c=>{if(!c.eq){c.eq={arme:mkItem(c.mage&&c.role=='sorcier'?'baton':ROLE_W[c.role]||'epee',Math.max(1,c.st-1),{lv:c.wpn||0,el:null}),armure:null,outil:null};delete c.wpn}upRole(c);if(c.sig&&c.name=='Jeanne'&&!c.subs){c.subs=['Loyal','Courageux'];c.fixed=1}initPers(c,1)});G.chars.forEach((a,i)=>G.chars.slice(i+1).forEach(b=>{try{codexRel(a,b,relState(a,b).k)}catch(_){}}));const mg=[];G.chars.forEach(c=>{const k=migrateProg(c);if(k||c.migBank)mg.push({id:c.id,n:k,bank:c.migBank||0,lv:c.lv});delete c.migBank;codexOwn(c)});if(mg.length)PROGQ.push({t:'mig',L:mg});if(!G.mats||typeof G.mats!='object'||Array.isArray(G.mats))G.mats={mat_minerai:6,mat_cuir:2,mat_bois:2,mat_tissu:1};for(const k in G.mats)if(!MATS[k]||!(G.mats[k]>0))delete G.mats[k];else G.mats[k]=Math.floor(G.mats[k]);relPrune();relSeed()}
try{let raw=localStorage.getItem(SKEY);if(!raw){const o=localStorage.getItem('tdE5')||localStorage.getItem('tdE4');if(o){try{localStorage.setItem('tdE5_bak',o)}catch(_){}raw=o}}G=JSON.parse(raw)}catch(e){G=null}if(!G||!G.chars||!G.chars.length)fresh();else try{migrate();save()}catch(e){console.warn('migration',e);try{localStorage.setItem(SKEY+'_bak',JSON.stringify(G))}catch(_){}G.chars=G.chars.filter(c=>c&&c.b);G.chars.forEach(c=>{try{upRole(c)}catch(_){c.eq={arme:null,armure:null,outil:null};c.role='guerrier'}try{initPers(c)}catch(_){c.subs=[pick(SUBS[c.pers]||['Loyal'])];c.gr=Object.assign({},GR0);c.skills=[]}});G.rel={};if(!G.chars.length)fresh()}
if(!G.mats||typeof G.mats!='object'||Array.isArray(G.mats))G.mats={};
function eqB(c){const o={atk:0,def:0,hp:0,spd:0,crit:0},e=c.eq||{};SLK.forEach(k=>{if(e[k]){const b=iStat(e[k]),m=k=='arme'&&c.tal=='armes'?1.5:1;for(const x in b)o[x]+=b[x]*m}});return o}
/* stats : croissance par niveau propre au personnage (c.gr) + passifs permanents des compétences */
function stats(c){const R=ROLES[c.role]||ROLES.guerrier,g=c.gr||GR0,Lv=clamp(c.lv|0,1,60),L=Lv-1,q=eqB(c),P=psOf(c),pv=k=>P[k]||0,md=c.cls&&c.cls.spec&&Lv>=20&&harmOf(c)?SPECS[c.cls.spec].mods:{},aw=awOf(c),cst=1+.04*(c.st>=6?Math.min(3,c.tr||0):0);
 let hp=c.b.hp*R.hp*LVM.hp[Lv]*tilt(g.hp,Lv)*(1+q.hp+.1*pv('vigueur')+(md.hp||0))*cst,atk=c.b.atk*R.atk*LVM.atk[Lv]*tilt(g.atk,Lv)*(1+q.atk+.08*pv('brute')+(md.atk||0))*cst,def=c.b.def*R.def*LVM.def[Lv]*tilt(g.def,Lv)*(1+q.def+.1*pv('peau')+(md.def||0))*cst,spd=R.spd+c.b.spd+q.spd+Math.floor(g.spd*L)+Math.round(6*pv('elan'))+(md.spd||0)+(aw>=1?3:0)+(aw>=3?5:0),crit=.05+.01*c.st+q.crit+g.crit*L+.06*pv('lynx')+(md.crit||0)+(aw>=1?.03:0)+(aw>=3?.05:0);const p=c.pers;
 if(p=='Ambitieux')atk*=1.1;if(p=='Opportuniste')crit+=.06;if(p=='Calculateur')crit+=.12;if(p=='Impulsif'){spd+=8;def*=.9}if(p=='Stoïque'){hp*=1.12;def*=1.12}
 const tl=c.tal;if(tl=='debutant'&&c.lv<10)crit+=.1;if(tl=='endurant')hp*=1.1;if(tl=='reflexes')spd+=8;if(tl=='armes')crit+=.05;if(tl=='protag'){hp*=1.15;atk*=1.15;def*=1.15}return{hp:Math.round(hp),atk:Math.round(atk),def:Math.round(def),spd:Math.round(spd),crit:Math.min(.75,crit),heal:md.heal||0}}
const party=()=>{const p=G.chars.filter(c=>c.party&&!c.inj).sort((a,b)=>a.party-b.party);return F&&F.law=='duel'?p.slice(0,2):p};
const bl=k=>{const p=G.plots.find(p=>p&&p.k==k);return p?p.lv:0},capa=()=>3+3*bl('auberge')+(hasTal('poche')?3:0),deathP=()=>Math.max(.05,Math.max(.1,.4-.1*bl('inf'))-JF.apoD(JR('apothicaire','inf'))-(rs('medecine')?.05:0));
/* expérience : vitesse propre (c.gr.xp, Érudit) ; chaque palier de compétences (multiple de c.gr.ms) déclenche un tirage */
const xpMul=c=>Math.min(2,(c.gr||GR0).xp*(1+.15*(psOf(c).erudit||0))*(c.tal=='eclair'?1.5:1));
function gain(c,x,raw){x=Math.round(x*(raw?1:xpMul(c)));if(!c.cls)initProg(c);if(c.lv>=cap(c)){bankAdd(c,x);return 0}c.xp+=x;let up=0;while(c.lv<cap(c)&&c.xp>=need(c)){c.xp-=need(c);c.lv++;up=1;treeCatch(c);milestone(c,c.lv)}if(c.lv>=cap(c)&&c.xp>0){bankAdd(c,c.xp);c.xp=0}return up}
