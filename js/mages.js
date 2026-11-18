'use strict';
/* ================= MAGES ET RECHERCHES MAGIQUES (bible §9, docs/mages.md) =================
   Tour de mage (BLD.mage, js/buildings2.js) : chaque mage en poste mène UNE recherche à la fois.
   Domaines : arcane, nature, elementaire, sacre, obscur, temporel (c.mage = 'Arcanique'…) + navigation (bateau) + defense.
   Durée de base : rang I 30 min, II 90 min, III 4 h (bible : « par exemple 24 h », réduit pour le jeu), × étoiles, niveau, domaine, recherches.
   La recherche n'avance que si son mage travaille (en poste, ni blessé ni en équipe) ; le temps jeu fermé compte.
   État : G.mrs {done:{k:1}, run:[{k,mid,p,last,d}], call (dernier Appel aux mages), insp (inspiration −25 %)}. Remplit MAGE_RS (Bibliothèque). */
const MDOM={Arcanique:'arcane',Naturelle:'nature','Élémentaire':'elementaire','Sacrée':'sacre',Obscure:'obscur',Temporelle:'temporel'};
const MDK={arcane:{n:'Arcanique',e:'arcane',c:'#ff7ad9'},nature:{n:'Naturelle',e:'nature',c:'#6fdc6f'},elementaire:{n:'Élémentaire',e:'feu',c:'#ff6b3d'},sacre:{n:'Sacrée',e:'sacre',c:'#ffe27a'},obscur:{n:'Obscure',e:'ombre',c:'#8a7bd8'},temporel:{n:'Temporelle',e:'glace',c:'#6fd3ff'},navigation:{n:'Navigation',c:'#7ad0ff',m:['Arcanique','Temporelle']},defense:{n:'Défense',c:'#b0b0c8',m:['Sacrée','Élémentaire']}};
const MRT=[0,30,90,240];
const MRS={
 ar_flux:{n:'Flux arcanique',dom:'arcane',t:1,d:'Bibliothèque : durée des recherches −10 %.'},
 ar_sceau:{n:'Sceaux de stabilisation',dom:'arcane',t:2,d:'Équipe : DEF +4 % ; bateau : Bouclier magique niv. 2.'},
 ar_noyau:{n:'Cœur arcanique',dom:'arcane',t:3,d:'Bateau : permet l’étape 5 (Cœur arcanique).'},
 na_seve:{n:'Sève vive',dom:'nature',t:1,d:'Ferme +10 % ; Taverne : plat Infusion sylvestre.'},
 na_bete:{n:'Langage des bêtes',dom:'nature',t:2,d:'Écurie : Griffon ; soins perdus par étage ÷2.'},
 na_flor:{n:'Grande floraison',dom:'nature',t:3,d:'Ferme +15 %, Installations de chasse +15 %.'},
 el_affin:{n:'Affinité élémentaire',dom:'elementaire',t:1,d:'Équipe : ATQ +4 %.'},
 el_vent:{n:'Maîtrise des vents',dom:'elementaire',t:2,d:'Bateau : Hélices et voilure niv. 2.'},
 el_maitrise:{n:'Tempête domptée',dom:'elementaire',t:3,d:'Équipe : ATQ +6 % de plus.'},
 sa_benir:{n:'Bénédictions',dom:'sacre',t:1,d:'Sanctuaire : Égide sacrée ; bénédictions +25 % de durée.'},
 sa_soin:{n:'Lumière guérisseuse',dom:'sacre',t:2,d:'Après chaque victoire : équipe PV +4 %.'},
 sa_eveil:{n:'Rite d’éveil',dom:'sacre',t:3,d:'Éveil des personnages : or −10 %, essences −20 %.'},
 ob_ombre:{n:'Voile d’ombre',dom:'obscur',t:1,d:'Équipe : Crit. +4 % ; bateau : Camouflage niv. 1–2.'},
 ob_male:{n:'Malédiction',dom:'obscur',t:2,d:'Ennemis : DEF −6 % au début du combat.'},
 ob_neant:{n:'Pacte du néant',dom:'obscur',t:3,d:'Or gagné dans la Tour +15 % ; bateau : Camouflage 3, Pillage 3.'},
 te_sablier:{n:'Sablier des mages',dom:'temporel',t:1,d:'Tour de mage : durée des recherches −10 %.'},
 te_acc:{n:'Accélération',dom:'temporel',t:2,d:'Chantier naval : durée −25 % ; bateau : Hélices niv. 3.'},
 te_boucle:{n:'Boucle temporelle',dom:'temporel',t:3,d:'Équipe : VIT +4 ; bénédictions ×1,5 de durée.'},
 nv_1:{n:'Cartes célestes',dom:'navigation',t:1,d:'Bateau : étape 2 (Nacelle) ; Longue-vue et Hélices niv. 1.'},
 nv_2:{n:'Aérostatique',dom:'navigation',t:2,d:'Bateau : étape 4 (Gréement) ; Soutes niv. 3, Longue-vue niv. 2.'},
 nv_3:{n:'Navigation stellaire',dom:'navigation',t:3,d:'Bateau : étape 5 ; Longue-vue niv. 3 ; vitesse +10 %.'},
 df_1:{n:'Fortification',dom:'defense',t:1,d:'Remparts niv. 3 ; défense +10 % ; Bouclier magique niv. 1.'},
 df_2:{n:'Glyphes de garde',dom:'defense',t:2,d:'Défense +20 % ; Bouclier magique niv. 3.'},
 df_3:{n:'Bouclier de ville',dom:'defense',t:3,d:'Défense +30 % ; gardes ×1,5.'}};
function mrsCost(k){const S=MRS[k],t=S.t,D=MDK[S.dom];if(S.dom=='navigation')return[null,{gold:500,mat_tissu:4,mat_cristal:2},{gold:1500,mat_lingot:4,mat_cristal:3},{gold:4000,mat_mithril:2,mat_noyau:2}][t];
 if(S.dom=='defense')return[null,{gold:500,stone:300},{gold:1500,mat_lingot:6},{gold:4000,mat_mithril:3}][t];const e='mat_essence_'+D.e;return[null,{gold:400,[e]:2},{gold:1200,[e]:4,mat_cristal:2},{gold:3000,[e]:6,mat_noyau:2}][t]}
Object.keys(MRS).forEach(k=>{MRS[k].c=mrsCost(k);MRS[k].m=MRT[MRS[k].t];MRS[k].lv=MRS[k].t});
Object.assign(MAGE_RS,MRS);
const mrs=k=>!!(G&&G.mrs&&G.mrs.done&&G.mrs.done[k]);
function mrsEnsure(){if(!G.mrs||typeof G.mrs!='object')G.mrs={};const R=G.mrs;if(!R.done||typeof R.done!='object')R.done={};if(!Array.isArray(R.run))R.run=[];R.run=R.run.filter(a=>a&&MRS[a.k]&&G.chars.some(c=>c.id==a.mid))}
const mageWorking=c=>!!(c&&c.mage&&c.job&&c.job.post=='mage'&&working(c));
const mrsMatch=(c,k)=>{const D=MRS[k].dom;return MDOM[c.mage]==D?.7:MDK[D].m&&MDK[D].m.includes(c.mage)?.85:1};
function mrsMul(c,k){return Math.max(.25,(1-.06*(c.st-1))*mrsMatch(c,k)*(1-.004*Math.min(60,c.lv))*(mrs('te_sablier')?.9:1)*(G.mrs.insp?.75:1))}
const mrsDur=(c,k)=>Math.round(MRS[k].m*60000*mrsMul(c,k));
const percee=(c,k)=>Math.min(.5,.04*c.st+(mrsMatch(c,k)<1?.1:0));
const freeMages=()=>postedAt('mage').filter(c=>c.mage&&!G.mrs.run.some(a=>a.mid==c.id));
function bestMage(k){const L=freeMages().filter(c=>!c.inj&&!c.party);return L.sort((a,b)=>mrsDur(a,k)-mrsDur(b,k))[0]||null}
function mrsStart(k,mid){mrsEnsure();const S=MRS[k],R=G.mrs;if(!S||mrs(k)||R.run.some(a=>a.k==k)||S.t>bl('mage')||!canX(S.c))return;const c=mid?freeMages().find(x=>x.id==mid):bestMage(k);if(!c)return toast('Aucun mage libre en poste à la Tour.');payX(S.c);R.run.push({k,mid:c.id,p:0,last:Date.now(),d:mrsDur(c,k)});if(R.insp)R.insp=0;save();rp();toast(`${c.name} commence : <b>${S.n}</b>.`)}
function mrsCancel(k){const R=G.mrs,i=R.run.findIndex(a=>a.k==k);if(i<0)return;R.run.splice(i,1);giveM(MRS[k].c);for(const x in MRS[k].c)if(!isM(x))G.res[x]+=MRS[k].c[x];save();rp()}
function mrsTick(now){const R=G.mrs;if(!R||!R.run.length)return;now=now||Date.now();for(const a of R.run.slice()){const c=G.chars.find(x=>x.id==a.mid);if(mageWorking(c))a.p+=Math.max(0,now-a.last);a.last=now;if(a.p<a.d)continue;
  R.run.splice(R.run.indexOf(a),1);R.done[a.k]=1;const S=MRS[a.k];if(c){jXP(c,30,1);gain(c,25*S.t*S.t)}let br='';if(c&&Math.random()<percee(c,a.k)){R.insp=1;const g=Math.round((S.c.gold||0)/2);G.res.gold+=g;br=` — <b class="g">Percée !</b> +${g} or, prochaine recherche −25 %`}
  toast(`${tabI2(pIco('rs_'+S.dom,MDK[S.dom].c,'R'))}Recherche magique terminée : <b>${S.n}</b>${br}`,4000);if(PF)try{rp()}catch(_){}}}
/* Appel aux mages : un mage garanti (1★ 40 % · 2★ 40 % · 3★ 17 % · 4★ 3 %), toutes les 12 h */
const CALL_P=12*3600000,CALL_C={gold:800,mat_cristal:2,mat_essence_arcane:1};
function mageCall(){mrsEnsure();const R=G.mrs;if(!bl('mage')||Date.now()-(R.call||0)<CALL_P||!canX(CALL_C))return;if(G.chars.length>=capa()&&G.chars.some(c=>c.mage))return toast('L’auberge est pleine : améliorez-la pour accueillir plus de monde.');payX(CALL_C);R.call=Date.now();const x=Math.random(),st=x<.4?1:x<.8?2:x<.97?3:4,c=mk(st);c.mage=pick(DOM);c.eq.arme=mkItem(pick(['baton','grimoire']),Math.max(1,st-1));upRole(c);G.chars.push(c);save();syncNPC();rp();toast(`L’appel est entendu : <b>${c.name}</b> ${'★'.repeat(st)}, mage ${c.mage}, rejoint le village.`,4000)}
let MRTAB='arcane';function setMR(k){MRTAB=k;rp();tabTop()}
function mageHTML(i,pl){mgEnsure();mrsTick();const R=G.mrs,L=pl.lv,now=Date.now(),cw=now-(R.call||0),M=postedAt('mage').filter(c=>c.mage);
 let h=`<p class="m">Chaque mage en poste mène une recherche à la fois ; elle n’avance que pendant qu’il travaille (jeu fermé compris). Durée réduite par les étoiles (−6 % par ★ au-delà de 1), le niveau (−0,4 % par niveau) et le domaine du mage (−30 %, −15 % pour la navigation et la défense selon le domaine)${mrs('te_sablier')?', Sablier des mages −10 %':''}${R.insp?' · <b class="g">inspiration : prochaine recherche −25 %</b>':''}. Une percée (4 % par ★, +10 % dans son domaine) rembourse la moitié de l’or.</p>`;
 h+=M.length?M.map(c=>{const a=R.run.find(x=>x.mid==c.id);return`<div class="rsq"><img class="sp" src="${cs(c).url}" alt="" style="width:40px"><b>${c.name}</b> ${stars(c.st)} <span class="m">mage ${c.mage}</span>${a?`<span>${MRS[a.k].n}</span><div class="xpb"><i style="width:${Math.round(Math.min(1,a.p/a.d)*100)}%"></i></div><span class="m">${mageWorking(c)?fmtT(Math.ceil((a.d-a.p)/1000)):'en pause'}</span><button class="alt" onclick="mrsCancel('${a.k}')">Annuler</button>`:'<span class="m">libre</span>'}</div>`}).join(''):`<p class="w">Aucun mage en poste : affectez-en un dans la section Postes ci-dessous.</p>`;
 h+=`<div class="pst"><img class="sp" src="${pIco('rs_arcane','#7a5ad8','✦')}" alt="" style="width:40px;height:40px"><div class="gr"><b>Appel aux mages</b><div class="m">Un mage garanti (1★ 40 % · 2★ 40 % · 3★ 17 % · 4★ 3 %), domaine au hasard ; une fois toutes les 12 h. Mages au village : ${G.chars.filter(c=>c.mage).length}.</div><div class="cr">${costX(CALL_C)}</div></div><button class="ib" ${cw<CALL_P||!canX(CALL_C)?'disabled':''} onclick="mageCall()">${cw<CALL_P?mgT(CALL_P-cw):'Appeler'}</button></div>`;
 h+=tabsH(MRTAB,Object.keys(MDK).map(d=>[d,MDK[d].n+` ${Object.keys(MRS).filter(k=>MRS[k].dom==d&&mrs(k)).length}/3`,'rs_'+d]),'setMR');
 const ks=Object.keys(MRS).filter(k=>MRS[k].dom==MRTAB);
 h+=`<div class="rsg">`+ks.map(k=>{const S=MRS[k],done=mrs(k),run=R.run.find(a=>a.k==k),lk=S.t>L,bm=bestMage(k);return`<div class="rsc mgr${done?' done':''}${lk?' lk':''}" style="border-left-color:${MDK[S.dom].c}"><div><img class="rsi" src="${pIco('rs_'+S.dom,MDK[S.dom].c,'IIII'[S.t])}" alt=""><b>${S.n}</b> <span class="tg">rang ${'I'.repeat(S.t)}</span>${done?'<span class="tg ins">acquise</span>':run?'<span class="tg">en cours</span>':lk?`<span class="tg">Tour niv. ${S.t}</span>`:''}</div><div class="m">${S.d}</div>${done||run?'':`<div class="cr">${costX(S.c)}<span class="m">${bm?mgMin(mrsDur(bm,k)/60000)+' ('+bm.name+')':mgMin(S.m)+' de base'}</span><button class="ib" ${lk||!bm||!canX(S.c)?'disabled':''} onclick="mrsStart('${k}')">Rechercher</button></div>`}</div>`}).join('')+'</div>';
 return h}
XPAN.mage=mageHTML;
/* Bibliothèque : ligne d'accroche (remplace « à venir ») */
function mgBibLine(){const n=Object.keys(MRS).filter(mrs).length;return`<p class="m">Recherches des mages (${n} / ${Object.keys(MRS).length}) : à la <b>Tour de mage</b>${bl('mage')?'':' (Hôtel de ville niv. 3)'} — domaines, navigation du bateau, défense. Un mage en poste ici accélère les recherches de la Bibliothèque de 10 %${mrs('ar_flux')?' ; Flux arcanique : −10 % de plus':''}.</p>`}
{const _rm=rsMul;rsMul=function(){return _rm.apply(this,arguments)*(mrs('ar_flux')?.9:1)}}
function mgBoot(){mgMigrate();mrsTick()}
