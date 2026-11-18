'use strict';
/* ================= PUITS D'OR : MONUMENTS, MARCHÉ LIMITÉ, RENVOI (docs/equilibrage.md §9) =================
   G.mon {greniers, etendard, bourse} = niveaux 0..5 ; coût du niveau n+1 = base × 3^n (≈ 2,4 M d'or pour un monument complet à base 10 k).
   Marché : les parchemins, pierres et tomes coûtent ×3 (+1 par achat de la semaine) et sont limités par semaine (3 + niveau de la Bourse) par ingrédient. */
const MON={
 greniers:{n:'Greniers royaux',d:'Capacités de stockage +10 % par niveau (ressources et matériaux).',b:15000},
 etendard:{n:'Étendard du village',d:'PV, ATQ et DEF de l’équipe +1,5 % par niveau.',b:25000},
 bourse:{n:'Bourse des étoiles',d:'Marché : +1 achat hebdomadaire par ingrédient d’éveil et par niveau.',b:20000}};
const MONK=Object.keys(MON),MONMAX=5;
const monLv=k=>(G&&G.mon&&G.mon[k])|0,monCost=(k,l)=>Math.round(MON[k].b*Math.pow(3,l));
function monBuy(k){if(!G.mon)G.mon={};const l=monLv(k);if(!MON[k]||l>=MONMAX||bl('hdv')<2)return;const g=monCost(k,l);if(G.res.gold<g)return;G.res.gold-=g;G.mon[k]=l+1;save();rp();toast(`${MON[k].n} : niveau ${l+1}`)}
{const _h=hdvHTML;hdvHTML=function(pl){let h=_h.apply(this,arguments);if(pl.lv<2)return h;
 return h+`<h3 class="sh">Monuments (puits d’or)</h3><p class="m">Bâtiments de prestige : chaque niveau coûte trois fois plus que le précédent, pour un bonus permanent modeste.</p>`+MONK.map(k=>{const M=MON[k],l=monLv(k),g=monCost(k,l);return`<div class="row"><div class="gr"><b>${M.n}</b> ${stars(l,MONMAX)}<div class="m">${M.d}</div></div>${l>=MONMAX?'<b class="g">Achevé</b>':`<span class="cost"><span class="rc${G.res.gold<g?' w':''}">${rIco('gold')}<b>${g}</b></span></span><button class="ib" ${G.res.gold<g?'disabled':''} onclick="monBuy('${k}')">Bâtir</button>`}</div>`}).join('')}}
{const _c=capOf;capOf=function(k){const v=_c.apply(this,arguments);return v==Infinity?v:Math.round(v*(1+.1*monLv('greniers')))};
 const _s=stats;stats=function(c){const s=_s.apply(this,arguments);const l=monLv('etendard');if(l&&c&&c.party){const m=1+.015*l;s.hp=Math.round(s.hp*m);s.atk=Math.round(s.atk*m);s.def=Math.round(s.def*m)}return s}}
/* Marché : ingrédients d'éveil plus chers et rationnés */
const isEvM=k=>/^mat_(parchemin|pierre|tome)_/.test(k||''),wkOf=()=>{const w=Math.floor(Date.now()/6048e5);if(!G.mkt)return{n:{}};if(!G.mkt.wk||G.mkt.wk.w!=w)G.mkt.wk={w,n:{}};return G.mkt.wk},wkLim=()=>3+monLv('bourse');
{const _p=mkPrice;mkPrice=function(o){let p=_p.apply(this,arguments);if(o&&!o.it&&isEvM(o.k))p=Math.ceil(p*(3+(wkOf().n[o.k]||0)));return p};
 const _b=mkBuy;mkBuy=function(i){const o=G.mkt&&G.mkt.o[i];if(!o||!o.left)return _b.apply(this,arguments);if(!o.it&&isEvM(o.k)){const W=wkOf();if((W.n[o.k]||0)>=wkLim())return toast('Limite hebdomadaire atteinte pour cet ingrédient (la Bourse des étoiles l’augmente).')}
  const g0=G.res.gold,r=_b.apply(this,arguments);if(o&&!o.it&&isEvM(o.k)&&G.res.gold<g0){const W=wkOf();W.n[o.k]=(W.n[o.k]||0)+1}return r}}
/* Renvoyer un personnage 3★+ (les 1–2★ se sacrifient) : libère une place, l'équipement retourne à la réserve ; le héros et Jeanne restent */
function renvoyer(id){const c=G.chars.find(x=>x.id==id);if(!c||c.hero||c.sig||c.st<3)return;if(!c.arm){c.arm=1;return rp()}stash(c);G.chars=G.chars.filter(x=>x!=c);G.dead=G.dead;reidx();try{relPrune()}catch(_){}save();syncNPC();rp();toast(c.name+' quitte le village. Son équipement est rangé dans la réserve.',3200)}
