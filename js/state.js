'use strict';
/* ================= ÉTAT ================= */
let G=null,F=null;
const cap=c=>10*c.st,need=c=>{const L=c.lv,b=XPB.find(x=>L<x[0])||XPB[5];return Math.round(b[3]*(b[1]+b[2]*L))};
function mk(st,o={}){const v=()=>rnd(.92,1.08),pers=persRoll(st),c={id:G.nid++,name:pick(NOMS),st,race:raceFor(st),pers,role:'guerrier',elem:pick(EK),lv:1,xp:0,b:{hp:Math.round((220+90*st)*v()),atk:Math.round((26+11*st)*v()),def:Math.round((16+7*st)*v()),spd:ri(-4,4)},party:0,inj:0,lock:0,eq:{arme:null,armure:null,outil:null},seed:ri(1,99999)};
 if(Math.random()<.01)c.mage=pick(DOM);const ist=()=>clamp(st-ri(0,1),1,6);
 if(c.mage)c.eq.arme=mkItem(pick(['baton','grimoire']),ist());else if(Math.random()<.8)c.eq.arme=rndItem(ist(),'arme');
 if(Math.random()<.25+.05*st)c.eq.armure=rndItem(ist(),'armure');if(Math.random()<.3)c.eq.outil=rndItem(Math.max(1,st-1),'outil');
 Object.assign(c,o);upRole(c);initPers(c);codexOwn(c);return c}
/* ---------- objets ---------- */
function iName(it){const T=ITYPES[it.t];return T.n+(it.el?' '+(T.f?EAF[it.el]:ELEMS[it.el].a)+(T.pl?'s':''):'')}
function iStat(it){const T=ITYPES[it.t],k=(1+.45*(it.st-1))*(1+.08*(it.tr||0)),o={};for(const x in T.b||{})o[x]=T.b[x]*k;if(T.s=='arme')o.atk=(o.atk||0)+.08*(it.lv||0);return o}
function iTxt(it){const o=iStat(it),T=ITYPES[it.t],a=[],P=v=>Math.round(v*100);if(o.atk)a.push('ATQ +'+P(o.atk)+' %');if(o.def)a.push('DEF +'+P(o.def)+' %');if(o.hp)a.push('PV +'+P(o.hp)+' %');if(o.spd)a.push('VIT '+(o.spd>0?'+':'−')+Math.abs(Math.round(o.spd)));if(o.crit)a.push('Crit. +'+P(o.crit)+' %');
 if(it.el)a.push((T.s=='arme'?'frappe aussi en ':'résiste au ')+ELEMS[it.el].n);if(T.use=='soin')a.push(`soigne 40 % des PV (${it.q} dose${it.q>1?'s':''})`);if(T.use=='energie')a.push(`+50 d’énergie (${it.q} dose${it.q>1?'s':''})`);if(T.fx)a.push(FXD[T.fx]);if(T.role)a.push('classe : '+ROLES[T.role].n);if(T.tilt)a.push('oriente vers '+ROLES[T.tilt[0]].n);return a.join(' · ')}
function mkItem(t,st,o={}){const T=ITYPES[t],it={id:G.iid++,t,st:clamp(st,1,6),lv:0};if(T.s!='outil'&&st>=2&&Math.random()<.3+.08*st)it.el=pick(EK);if(T.q)it.q=T.q+Math.floor((it.st-1)/2);return Object.assign(it,o)}
function rndType(slot){const ks=Object.keys(ITYPES).filter(k=>!slot||ITYPES[k].s==slot);let x=Math.random()*ks.reduce((a,k)=>a+ITYPES[k].w,0);for(const k of ks){x-=ITYPES[k].w;if(x<0)return k}return ks[0]}
const rndItem=(st,slot)=>mkItem(rndType(slot),st);
/* rareté des objets : même échelle et mêmes proportions que les personnages (1★ 50 · 2★ 9 · 3★ 1 · 4★ 0,5 · 5★ 0,1 · 6★ 0,01) */
const RAR=[[1,50],[2,9],[3,1],[4,.5],[5,.1],[6,.01]];
function iRoll(){const x=Math.random()*60.61;let a=0;for(const[st,p]of RAR){a+=p;if(x<a)return st}return 1}
function roleOf(c){const e=c.eq||{};let k=e.arme?ITYPES[e.arme.t].role:'_';for(const it of[e.armure,e.outil]){const t=it&&ITYPES[it.t].tilt;if(t&&t.indexOf(k,1)>0)k=t[0]}return k=='_'?(c.mage?'sorcier':'guerrier'):k}
function upRole(c){if(!c.eq)c.eq={arme:null,armure:null,outil:null};c.role=roleOf(c)}
const hasFx=fx=>party().some(c=>c.eq&&SLK.some(k=>c.eq[k]&&ITYPES[c.eq[k].t].fx==fx));
function fresh(){G={res:{food:60,wood:140,stone:90,gold:500,shard:0},plots:[null,null,null,null,null,null,null,null,null,null,null],ver:7,rs:{done:{},q:[]},buff:{},chars:[],max:1,dead:[],nid:1,items:[],iid:1,rel:{},mats:{mat_minerai:6,mat_cuir:2,mat_bois:2,mat_tissu:1},intro:0};
 G.chars.push(mk(3,{name:'Jeanne',race:'Humain',pers:'Altruiste',sub:'Loyal',subs:['Loyal','Courageux'],fixed:1,skills:[{id:'egide',lv:1,r:0}],elem:'sacre',party:1,lock:1,sig:1,look:{skin:'#ffd9bd',hair:'#e9d28a',eye:'#3aa0ff',style:3,hue:0},mage:undefined,eq:{arme:mkItem('epee',3,{el:null}),armure:mkItem('cuir',2,{el:null}),outil:mkItem('potion',2)}}));
 G.items.push(mkItem('arc',1,{el:null}),mkItem('torche',1));return G}
