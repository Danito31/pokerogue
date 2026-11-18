#!/usr/bin/env node
'use strict';
/* Banc d'essai automatique de « Dungeon Setlers » (Node + Playwright, chromium headless).
   Joue une partie complète via les fonctions du jeu (page.evaluate), avec une horloge virtuelle (Date.now simulé)
   et un Math.random à graine : une partie est reproductible.
   Usage : NODE_PATH=$(npm root -g) node tools/playtest.js --seed 1 --policy equilibre --days 60 --floor 50 --out /chemin/log.json
   Politiques : imprudent (fonce toujours à l'étage max, sans jamais reculer : mesure de la mortalité) · fragments (comme equilibre + farm d'invocations/sacrifices pour les fragments d'éveil quand l'or déborde) · equilibre (3 séances/jour) · prudent (1 séance/jour, n'avance que si le niveau suit) · intensif (4 séances, fonce sans farmer).
   Hypothèses de modélisation (voir docs/equilibrage.md) : les étages sont parcourus sans déplacement réel (téléportation sur les cibles),
   les dangers de loi (tempête de sable, foudre) ne sont pas simulés, chaque action coûte un temps virtuel forfaitaire. */
const fs = require('fs');
const path = require('path');
const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, r) => (x.startsWith('--') ? a.concat([[x.slice(2), r[i + 1]]]) : a), []));
const SEED = +(args.seed || 1), POLICY = args.policy || 'equilibre', DAYS = +(args.days || 60), MAXF = +(args.floor || 50);
const OUT = args.out || path.join(process.cwd(), `playtest_${POLICY}_${SEED}.json`);
const URL = 'file://' + path.resolve(__dirname, '..', 'index.html');
const POL = {
  equilibre: { sessions: [8, 13, 20], min: 40, open: 3, push: 3, farmAfter: 2, injury: 'soin', adv: .5 },
  prudent: { sessions: [20], min: 60, open: 0, push: 1, farmAfter: 1, injury: 'soin', adv: .6 },
  fragments: { sessions: [8, 13, 20], min: 40, open: 3, push: 3, farmAfter: 2, injury: 'soin', adv: .5, frag: 1 },
  imprudent: { sessions: [7, 12, 17, 21], min: 45, open: 4, push: 99, farmAfter: 99, injury: 'forcer', adv: .25 },
  intensif: { sessions: [7, 12, 17, 21], min: 45, open: 6, push: 8, farmAfter: 3, injury: 'forcer', adv: .3 },
}[POLICY];
if (!POL) throw new Error('politique inconnue');

/* ====== code exécuté dans la page ====== */
function PAGE(SEED, POL, MAXF) {
  const W = window;
  W.LOG = []; W.ERRS = []; W.__ap = 0;
  const S = { act: 0, day: 0, fails: {}, farm: 0, st: { fights: 0, turns: 0, inj: 0, deaths: 0, events: 0, injAsk: 0, summons: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, mat: 0, item: 0 }, sacs: 0 }, flow: {}, last: {} };
  W.S = S;
  const tryf = (f, tag) => { try { return f() } catch (e) { W.ERRS.push({ tag: tag || f.name, msg: String(e && e.message), stack: String(e && e.stack || '').split('\n').slice(0, 4).join(' | '), day: S.day }); } };
  const L = (t, o) => W.LOG.push(Object.assign({ t, day: S.day, h: +(W.__off / 3600e3).toFixed(2), act: +(S.act / 3600).toFixed(2) }, o));
  /* ---- horloge ---- */
  function tickAll() { tryf(vTick, 'vTick'); tryf(mgTick, 'mgTick'); tryf(galTick, 'galTick'); tryf(injTick, 'injTick') }
  function spend(sec, tick = true) {
    if (tick) S.act += sec;
    let rem = sec;
    while (rem > 0) { const st = Math.min(30, rem); rem -= st; W.__off += st * 1000; if (tick) tickAll(); else tryf(injTick, 'injTick') }
  }
  function offline(sec, openFrac) {
    // openFrac : part du temps où l'onglet reste ouvert (production tournante) ; le reste : onglet fermé (seuls les minuteurs horodatés avancent)
    const on = sec * openFrac, off = sec - on;
    if (on > 0) { let r = on; while (r > 0) { const st = Math.min(60, r); r -= st; W.__off += st * 1000; tickAll() } }
    if (off > 0) { W.__off += off * 1000; tryf(injTick, 'injTick') }
    vtLast = Date.now(); mgLast = Date.now();
    tryf(galTick, 'galTick'); tryf(mgTick, 'mgTick');
  }
  /* ---- panneaux : fermeture automatique (les choix utiles sont faits par le bot) ---- */
  setInterval(() => {
    try {
      if (!W.__ap) return;
      if (typeof panelOpen !== 'undefined' && panelOpen && !W.EVOPEN) {
        const tx = ($('#pin') || {}).textContent || '';
        if (tx.includes('Que faites-vous') && W.injPick) { let ch = S.policy.injury; if (ch == 'soin' && !(injPot() || G.res.food >= 20)) ch = 'seul'; W.injPick(ch); S.st.injAsk++ }
        else if (tx.includes('pacte murmuré') && W.pactC) W.pactC(0);
        else closePanel();
      }
      const e = $('#evo'); if (e && !e.hidden) { try { evoClose() } catch (_) { e.hidden = true } }
    } catch (e) { W.ERRS.push({ tag: 'autopilot', msg: String(e.message), stack: String(e.stack).split('\n').slice(0, 3).join(' | '), day: S.day }) }
  }, 25);
  /* ---- instrumentation ---- */
  const _rb = runBattle;
  runBattle = async function (cfg) {
    S.cur = { allyT: 0 };
    const r = await _rb(cfg);
    const b = B; S.st.fights++; S.st.turns += S.cur.allyT;
    const a = b.A.length;
    S.last.fight = { res: r, allyT: S.cur.allyT, rounds: +(S.cur.allyT / Math.max(1, a)).toFixed(1), a, nf: (cfg.defs || []).length, kind: cfg.kind, lost: b.A.filter(u => !u.alive).length, hpLeft: Math.round(b.A.reduce((x, u) => x + Math.max(0, u.hp), 0)), mh: b.A.reduce((x, u) => x + u.mhp, 0) };
    if (S.fl) S.fl.fights.push(S.last.fight);
    return r;
  };
  S.gsrc = { loot: 0, marche: 0, demantele: 0, galaxie: 0, evenements: 0 };
  const _al = addLoot; addLoot = function (o) { const g0 = G.res.gold, r = _al.apply(this, arguments); S.gsrc.loot += G.res.gold - g0; return r };
  const _ms = mkSell; mkSell = function () { const g0 = G.res.gold, r = _ms.apply(this, arguments); S.gsrc.marche += G.res.gold - g0; return r };
  const _rc = recycle; recycle = function () { const g0 = G.res.gold, r = _rc.apply(this, arguments); S.gsrc.demantele += G.res.gold - g0; return r };
  const _gt = galTradeL; galTradeL = function () { const g0 = G.res.gold, r = _gt.apply(this, arguments); if (G.res.gold > g0) S.gsrc.galaxie += G.res.gold - g0; return r };
  /* un humain fuirait un combat interminable : au-delà de 600 tours d'unités, on bat en retraite (et on l'enregistre) */
  const _ap = aiPick; aiPick = function (u) { if (B && B.tn > 600) { if (!B.stale) { B.stale = 1; S.st.stale = (S.st.stale || 0) + 1; L('stale', { f: F && F.f, kind: B.kind, foes: B.E.filter(e => e.alive).map(e => [e.type, e.kind, e.mech, Math.round(100 * e.hp / e.mhp)]), allies: B.A.map(a => [a.n, a.alive, Math.round(100 * a.hp / a.mhp)]) }) } return { t: 'flee' } } return _ap.apply(this, arguments) };
  const _ts = turnStart; turnStart = function (u) { if (S.cur && u && u.ally) S.cur.allyT++; return _ts.apply(this, arguments) };
  const _ih = injHit; injHit = function (c, k, o) { S.st.inj++; if (S.fl) S.fl.inj.push(k); return _ih.apply(this, arguments) };
  const _id = injDie; injDie = function (c) { S.st.deaths++; if (S.fl) S.fl.deaths.push(c.name); return _id.apply(this, arguments) };
  /* ---- aides ---- */
  const pw = c => { const s = stats(c); return s.hp / 80 + s.atk * 3 + s.def * 2 };
  const cnt = o => Object.values(o || {}).reduce((a, b) => a + b, 0);
  const snapRes = () => ({ food: G.res.food | 0, wood: G.res.wood | 0, stone: G.res.stone | 0, gold: G.res.gold | 0, shard: G.res.shard | 0 });
  const snapMats = () => { const o = {}; for (const k in G.mats) o[k] = G.mats[k]; return o };
  const matTot = () => cnt(G.mats);
  const lvAvg = () => { const p = party(); return p.length ? p.reduce((a, c) => a + c.lv, 0) / p.length : 0 };
  const LVF = [[1, 1], [5, 2], [10, 4], [15, 6], [20, 9], [25, 12], [30, 15], [35, 18], [40, 21], [45, 24], [50, 28], [55, 33], [60, 38]];
  const floorForLv = lv => { let f = 1; for (const [l, ff] of LVF) if (lv >= l) f = ff; return f };
  /* ---- choix en attente (métier, sous-classe, éveil) ---- */
  function pendings() {
    PROGQ.length = 0;
    G.chars.forEach(c => tryf(() => {
      if (!c.cls) return; const P = c.cls.pend || {};
      if (P.job) { if (!c.job.voc) c.job.voc = vocOf(c); JSEL = c.job.voc[0]; evArm = 1; jobConfirm(c.id); evArm = 0 }
      if (P.sub) { const Lq = ROLE_SUBS[c.role] || ROLE_SUBS.guerrier; SUBSEL = Lq[0]; evArm = 2; subConfirm(c.id); evArm = 0 }
      if (P.aw && c.cls.spec) { AWSEL = c.cls.spec; evArm = 3; awConfirm(c.id); evArm = 0 }
    }, 'pending'));
    PROGQ.length = 0;
  }
  /* ---- bâtiments ---- */
  const PLAN = [['auberge', 1], ['ferme', 1], ['camp', 1], ['inf', 1], ['forge', 1], ['hdv', 1], ['auberge', 2], ['ferme', 2], ['chasse', 1], ['entrepot', 1], ['marche', 1], ['taverne', 1], ['forge', 2], ['inf', 2], ['camp', 2], ['hdv', 2], ['biblio', 1], ['labo', 1], ['ecurie', 1], ['sanctuaire', 1], ['entrepot', 2], ['auberge', 3], ['forge', 3], ['ferme', 3], ['chasse', 2], ['camp', 3], ['inf', 3], ['hdv', 3], ['biblio', 2], ['labo', 2], ['marche', 2], ['entrepot', 3], ['mage', 1], ['remparts', 1], ['chantier', 1], ['taverne', 2], ['ecurie', 2], ['sanctuaire', 2], ['biblio', 3], ['labo', 3], ['chasse', 3], ['marche', 3], ['mage', 2], ['chantier', 2], ['taverne', 3], ['ecurie', 3], ['sanctuaire', 3], ['remparts', 2], ['mage', 3], ['chantier', 3], ['remparts', 3]];
  const plotIdx = k => G.plots.findIndex(p => p && p.k == k);
  const freePlot = k => { const a = []; for (let i = 0; i < 17; i++) if (!G.plots[i] && plotOpen(i) && ((i == HSITE) == (k == 'hdv'))) a.push(i); return a[0] };
  function canBuild(k, lv) { if (!BLD[k]) return false; if (lv == 1) { const i = freePlot(k); return i != null && bUnl(k) && can(bCost(k, 1)) } const i = plotIdx(k); if (i < 0) return false; const pl = G.plots[i]; return pl.lv < lv && pl.lv < 3 && pl.lv < bMax(k) && can(bCost(k, pl.lv + 1)) }
  function builds() {
    for (let rep = 0; rep < 6; rep++) {
      const todo = PLAN.filter(([k, l]) => bl(k) < l && !(k == 'chantier' && !G.ballon));
      let ok = null;
      for (const [k, l] of todo.slice(0, 4)) { if (bl(k) != l - 1) continue; if (canBuild(k, l)) { ok = [k, l]; break } }
      if (!ok) break;
      const [k, l] = ok;
      if (l == 1) build(freePlot(k), k); else upB(plotIdx(k));
      L('build', { k, lv: l });
    }
  }
  /* ---- postes de travail ---- */
  function posts() {
    postFix();
    if (bl('mage')) G.chars.filter(c => c.mage && !c.party && !c.inj && !c.hero && !(c.job && c.job.post == 'mage')).forEach(c => { if (postedAt('mage').length < bSlots('mage')) tryf(() => postSet(c.id, 'mage'), 'postMage') });
    for (const k of G.plots.filter(p => p).map(p => p.k)) {
      const n = bSlots(k);
      for (let s = postedAt(k).length; s < n; s++) {
        const el = G.chars.filter(c => !c.inj && !c.party && !c.hero && (c.mage || (c.job && c.job.id)) && postsOf(c).includes(k) && !(c.job && c.job.post)).sort((a, b) => jEr(b) - jEr(a));
        if (!el.length) break;
        tryf(() => postSet(el[0].id, k), 'postSet');
      }
    }
  }
  /* ---- équipe et équipement ---- */
  function equipAll() {
    const P = G.chars.filter(c => c.party).sort((a, b) => a.party - b.party);
    const want = ['guerrier', 'gardien', 'soigneur', 'archer', 'sorcier', 'assassin'];
    P.forEach((c, i) => {
      const w0 = want.filter(r => !P.some((o, j) => j < i && o.role == r))[0] || 'guerrier';
      const sc = it => (ITYPES[it.t].role == w0 ? 3 : 0) + it.st * 1 + (it.lv || 0) * .05;
      const cands = G.items.filter(it => ITYPES[it.t].s == 'arme').sort((a, b) => sc(b) - sc(a));
      const cur = c.eq.arme;
      if (cands[0] && (!cur || sc(cands[0]) > sc(cur) + .5)) equip(c.id, cands[0].id);
    });
    for (const slot of ['armure', 'outil']) {
      P.forEach(c => {
        const cur = c.eq[slot];
        const sc = it => slot == 'outil' ? (it.t == 'potion' ? 100 + it.st + (it.q || 0) : it.t == 'elixir' ? 60 + it.st : ITYPES[it.t].b ? 20 + it.st : 10 + it.st) : it.st * 10 + (ITYPES[it.t].b && ITYPES[it.t].b.def || 0) * 10;
        const cands = G.items.filter(it => ITYPES[it.t].s == slot).sort((a, b) => sc(b) - sc(a));
        if (cands[0] && (!cur || sc(cands[0]) > sc(cur))) equip(c.id, cands[0].id);
      });
    }
  }
  function setParty() {
    const ok = G.chars.filter(c => !c.inj);
    const hero = ok.find(c => c.hero), sel = []; if (hero) sel.push(hero);
    const rest = ok.filter(c => c != hero).sort((a, b) => pw(b) - pw(a));
    for (const c of rest) { if (sel.length >= 4) break; sel.push(c) }
    const cur = G.chars.filter(c => c.party).map(c => c.id).sort().join(), nw = sel.map(c => c.id).sort().join();
    if (cur == nw) return;
    G.chars.forEach(c => { c.party = 0 }); sel.forEach((c, i) => { c.party = i + 1; if (c.job && c.job.post) { c.job.post = null; c.job.acc = 0 } }); reidx(); save();
  }
  function healAll() {
    const inf = bl('inf'); if (!inf) return;
    const c0 = infC(inf);
    G.chars.filter(c => c.inj || c.wd).sort((a, b) => b.st - a.st).forEach(c => { if (G.res.food >= c0 + 25) tryf(() => healC(c.id, c0), 'healC') });
  }
  /* ---- invocations ---- */
  function summons(reserveGold) {
    let n = 0;
    while (G.res.gold >= 50 + reserveGold && G.chars.length < capa() && n < 60) {
      const before = G.chars.length, g0 = G.res.gold;
      const k = Math.min(10, Math.floor((G.res.gold - reserveGold) / 50), capa() - G.chars.length + 2);
      if (k < 1) break;
      summon(k);
      SM.forEach(x => { if (x.c) S.st.summons[x.c.st]++; else if (x.it) S.st.summons.item++; else S.st.summons.mat++ });
      n += k; SM = [];
      if (G.chars.length == before && G.res.gold == g0) break;
    }
    if (n) L('summon', { n, chars: G.chars.length, cap: capa() });
  }
  function sacrifice() {
    if (G.chars.length < capa()) return;
    const cand = G.chars.filter(c => !c.hero && !c.lock && c.st <= 2 && !c.party && !(c.job && c.job.post) && !c.sig && c.lv < 25).sort((a, b) => a.st - b.st || a.lv - b.lv);
    for (const c of cand.slice(0, S.policy.frag ? 9 : 3)) { if (G.res.gold < 50) break; tryf(() => { sac(c.id); sac(c.id) }, 'sac'); S.st.sacs++ }
  }
  /* ---- évolutions ---- */
  function evolve() {
    const dbl = o => { const d = {}; for (const k in o) d[k] = o[k] * 2; return d };
    G.chars.slice().sort((a, b) => (b.party ? 1 : 0) - (a.party ? 1 : 0) || b.st - a.st).forEach(c => tryf(() => {
      const o = cEvoCost(c);
      if (o && cEvoReady(c) && canX(c.party || c.hero ? o : dbl(o))) { evArm = 0; doEvo(c.id); doEvo(c.id); L('evoChar', { n: c.name, st: c.st, lv: c.lv, party: c.party }); S.flow.evoChar = (S.flow.evoChar || 0) + 1 }
    }, 'doEvo'));
    G.chars.filter(c => c.party || c.hero).forEach(c => (c.skills || []).forEach((s, i) => tryf(() => {
      if (s.lv < 10 && mN('mat_tome_' + ((s.r || 0) + 1)) > 1) skStudy(c.id, i);
      if (s.lv >= 10 && s.r < 4 && canX(evoCost(s))) { skEvo(c.id, i); S.flow.skEvo = (S.flow.skEvo || 0) + 1 }
    }, 'skill')));
  }
  function gearEvo() {
    const L2 = bl('forge'); if (!L2) return;
    const all = []; G.chars.filter(c => c.party).forEach(c => SLK.forEach(k => c.eq[k] && all.push(c.eq[k])));
    all.sort((a, b) => b.st - a.st).forEach(it => tryf(() => {
      const o = iEvoCost(it); if (o && iEvoOk(it) && canX(o)) { iArm = 0; iEvo(it.id); iEvo(it.id); S.flow.iEvo = (S.flow.iEvo || 0) + 1 }
    }, 'iEvo'));
    G.chars.filter(c => c.party).forEach(c => tryf(() => {
      const it = c.eq.arme; if (!it) return; const w = it.lv || 0, o = { stone: 30 * (w + 1), gold: 40 * (w + 1) };
      if (w < 3 * L2 + fRf() && can(o) && G.res.gold > S.gold0 + o.gold) { forge(c.id); S.flow.wLv = (S.flow.wLv || 0) + 1 }
    }, 'forge'));
  }
  function crafting() {
    const L2 = bl('forge'); if (!L2) return;
    for (const i of [0, 4, 6, 5, 3, 2]) { const R = REFS[i]; if (!R || (R.lv || 1) > L2) continue; if (R.i.stone && G.res.stone < 120) continue; if (R.i.wood && G.res.wood < (G.ballon && G.ship && G.ship.stage < SHIPS.length ? 1500 : 120)) continue; if (R.i.food && G.res.food < 120) continue; if (R.i.gold && G.res.gold < S.gold0 + 40) continue; const m0 = mN(R.o); refine(i, i == 0 && G.ballon && G.ship && G.ship.stage < SHIPS.length ? 20 : 5); if (mN(R.o) > m0) S.flow.refine = (S.flow.refine || 0) + 1 }
    const P = G.chars.filter(c => c.party), roles = P.map(c => c.role);
    const have = t => G.items.some(it => it.t == t) || G.chars.some(c => c.eq.arme && c.eq.arme.t == t);
    const order = [];
    if (!roles.includes('gardien') && !have('bouclier')) order.push('bouclier');
    if (!roles.includes('soigneur') && !have('sceptre')) order.push('sceptre');
    if (!roles.includes('archer') && !have('arc')) order.push('arc');
    if (!roles.includes('sorcier') && !have('baton')) order.push('baton');
    P.forEach(c => { if (!c.eq.armure && !G.items.some(i => ITYPES[i.t].s == 'armure')) order.push('cuir') });
    order.push('lourde', 'cuir', 'epee');
    P.forEach(c => { if (!c.eq.outil && !G.items.some(i => i.t == 'potion')) order.push('potion') });
    let n = 0;
    const holdLingot = G.ballon && G.ship && G.ship.stage < SHIPS.length && mN('mat_lingot') < 14;
    for (const t of order) { if (n >= 4 || holdLingot) break; const R = RECIPES[t]; if (!R || (R.lv || 1) > L2) continue; const o = crCost(t); if (!canX(o) || G.res.gold < S.gold0 + o.gold) continue; craft(t); n++; S.flow.craft = (S.flow.craft || 0) + 1 }
    if (G.items.length > 40) { const junk = G.items.filter(it => it.st <= 1).slice(0, 10); junk.forEach(it => { rcy = it.id; recycle(it.id); S.flow.recycled = (S.flow.recycled || 0) + 1 }) }
  }
  function researches() {
    const L2 = bl('biblio'); if (!L2) return;
    rsTick(); const R = G.rs;
    for (const k of Object.keys(RSCH)) { if (R.q.length >= rsQmax()) break; if (rs(k) || R.q.some(a => a.k == k)) continue; const S2 = RSCH[k]; if (S2.lv > L2 || !canX(S2.c) || G.res.gold < S.gold0 + 100) continue; rsStart(k); S.flow.rs = (S.flow.rs || 0) + 1 }
  }
  function training() {
    const L2 = bl('camp'); if (!L2) return;
    const c0 = campC(L2), xg = campX(L2), res = 60 + (bl('inf') ? infC(bl('inf')) * 4 : 0);
    const T = G.chars.filter(c => !c.inj && c.lv < cap(c)).sort((a, b) => (b.party ? 1 : 0) - (a.party ? 1 : 0) || a.lv - b.lv);
    let n = 0;
    for (const c of T) { while (G.res.food >= c0 + res && n < 40 && c.lv < cap(c)) { train(c.id, c0, xg); n++; S.flow.train = (S.flow.train || 0) + 1 } if (G.res.food < c0 + res) break }
  }
  function misc() {
    tryf(() => { if (typeof monBuy != 'function') return; for (const k of MONK.slice().sort((a, b) => monCost(a, monLv(a)) - monCost(b, monLv(b)))) { const l = monLv(k); if (l < MONMAX && bl('hdv') >= 2 && G.res.gold > monCost(k, l) + S.gold0 + 3000) { monBuy(k); S.flow.monument = (S.flow.monument || 0) + 1 } } }, 'monuments');
    tryf(() => { if (bl('taverne') && !(G.mg && G.mg.meal && G.mg.meal.n > 0)) { const ks = Object.keys(TAVM).filter(k => TAVM[k].lv <= bl('taverne') && !(TAVM[k].rs && !mrs(TAVM[k].rs)) && canX(tavCost(k))); if (ks.length) { tavEat(ks[ks.length - 1]); S.flow.meal = (S.flow.meal || 0) + 1 } } }, 'meal');
    tryf(() => { if (bl('ecurie')) { mgEnsure(); for (const k of Object.keys(MOUNTS).reverse()) { if (!G.mg.mounts[k] && MOUNTS[k].lv <= bl('ecurie') && !(MOUNTS[k].rs && !mrs(MOUNTS[k].rs)) && canX(MOUNTS[k].c) && G.res.gold > S.gold0 + MOUNTS[k].c.gold) { mtAdopt(k); S.flow.mount = (S.flow.mount || 0) + 1; break } } if (G.mg.care < 70) { mtFeed('brosse'); mtFeed('foin') } } }, 'mount');
    tryf(() => { if (bl('sanctuaire')) { pray(); for (const k of Object.keys(BLESS)) { const b = BLESS[k]; if (b.lv <= bl('sanctuaire') && !(b.rs && !mrs(b.rs)) && !blOn(k) && canX(blCost(k)) && G.res.gold > S.gold0 + 150) { blBuy(k); S.flow.bless = (S.flow.bless || 0) + 1 } } } }, 'bless');
    tryf(() => { if (bl('labo')) { for (const k of ['potion', 'elixir']) { const R = LABR[k]; if (R && R.lv <= bl('labo') && canX(labCost(k)) && G.items.filter(i => i.t == k).length < 3 && G.res.gold > S.gold0 + 60) { brew(k); S.flow.brew = (S.flow.brew || 0) + 1 } } } }, 'brew');
    tryf(() => { if (G.res.gold > S.gold0 + 400) G.chars.filter(c => c.party).forEach(c => (c.skills || []).forEach((s, i) => { if (s.lv < 10 && s.r < 2) { const o = skCost(s); if (G.res.gold > S.gold0 + 300 + o.gold) { skUp(c.id, i); S.flow.skUp = (S.flow.skUp || 0) + 1 } } })) }, 'skUp');
  }
  /* besoins en ingrédients des prochains éveils (équipe) : sert à décider quoi acheter / fusionner */
  function needs() {
    const n = {};
    G.chars.filter(c => c.party || c.lv >= cap(c) - 5).forEach(c => { const o = cEvoCost(c); if (o) for (const k in o) if (isM(k)) n[k] = (n[k] || 0) + o[k] });
    G.chars.filter(c => c.party).forEach(c => SLK.forEach(k => { const it = c.eq[k]; if (it) { const o = iEvoCost(it); if (o) for (const x in o) if (isM(x)) n[x] = (n[x] || 0) + o[x] } }));
    if (G.ship && G.ship.stage < SHIPS.length) { const c = SHIPS[G.ship.stage].c; for (const k in c) if (isM(k)) n[k] = (n[k] || 0) + c[k] }
    return n;
  }
  function fuseUp() {
    const nd = needs();
    for (const kind of ['parchemin', 'pierre', 'tome']) {
      for (let n = 1; n <= (kind == 'tome' ? 4 : 5); n++) {
        const k = evoKey(kind, n), keep = nd[k] || 0, cost = fuseCost(kind, n);
        const hi = evoKey(kind, n + 1), want = (nd[hi] || 0) > mN(hi);
        if (!want && n + 1 > 3) continue;
        let guard = 0;
        while (guard++ < 20 && mN(k) >= 3 + keep && G.res.shard >= cost.shard && G.res.gold >= cost.gold + S.gold0 + 200) { fuse(kind, n, 1); S.flow.fuse = (S.flow.fuse || 0) + 1 }
      }
    }
    // fragments -> parchemin 1
    while (mN('mat_fragment') >= 10) { fuse('frag', 1, 1); S.flow.fuse = (S.flow.fuse || 0) + 1 }
  }
  function market() {
    tryf(() => {
      if (!bl('marche')) return;
      mkRoll();
      const nd = needs(), M = G.mkt;
      if (M && M.o) M.o.forEach((o, i) => { if (!o.left) return; const key = o.it ? null : o.k; const useful = o.it ? o.it.st >= 3 : (/^mat_(parchemin|pierre|tome)_/.test(key) || /^mat_(noyau|mithril|cristal|lingot)/.test(key) || /^mat_essence/.test(key) || key == 'mat_fragment'); const p = mkPrice(o); if (useful && G.res.gold > p + S.gold0 + 400) { const g0 = G.res.gold; mkBuy(i); if (G.res.gold < g0) S.flow.bought = (S.flow.bought || 0) + 1 } });
      for (const k of Object.keys(G.mats)) { if (!MATS[k] || !capped(k) || !VAL[k]) continue; if (/essence|noyau|mithril|cristal/.test(k) && (nd[k] || 0) >= G.mats[k]) continue; const keep = Math.round(capOf(k) * .5); if (G.mats[k] > keep + 10) { const n = G.mats[k] - keep; mkSell(k, n); S.flow.sold = (S.flow.sold || 0) + n } }
    }, 'market');
  }
  /* ---- tour de mage, chantier naval, bateau ---- */
  function mageShip() {
    if (bl('mage')) {
      mrsEnsure();
      if (G.chars.length >= capa() && Date.now() - (G.mrs.call || 0) >= CALL_P && canX(CALL_C)) { const v = G.chars.filter(c => !c.hero && !c.lock && c.st <= 2 && !c.party && !(c.job && c.job.post) && !c.sig).sort((a, b) => a.st - b.st || a.lv - b.lv)[0]; if (v) { sac(v.id); sac(v.id) } }
      const nm = G.chars.filter(c => c.mage).length; mageCall(); if (G.chars.filter(c => c.mage).length > nm) S.flow.mageCall = (S.flow.mageCall || 0) + 1;
      for (const k of ['nv_1', 'nv_2', 'nv_3', 'ar_noyau', 'df_1', 'df_2', 'df_3']) { if (!MRS[k] || mrs(k) || G.mrs.run.some(a => a.k == k)) continue; if (MRS[k].t > bl('mage') || !canX(MRS[k].c) || G.res.gold < S.gold0 + 100) continue; { const n0 = G.mrs.run.length; mrsStart(k); if (G.mrs.run.length > n0) S.flow.mrs = (S.flow.mrs || 0) + 1 } }
      for (const k of Object.keys(MRS)) { if (mrs(k) || G.mrs.run.some(a => a.k == k) || MRS[k].t > bl('mage') || !canX(MRS[k].c) || G.res.gold < S.gold0 + 2000) continue; { const n0 = G.mrs.run.length; mrsStart(k); if (G.mrs.run.length > n0) S.flow.mrs = (S.flow.mrs || 0) + 1 } }
    }
    if (bl('chantier')) {
      mgEnsure(); const Sh = G.ship;
      shipTick(Date.now());
      if (!Sh.q && Sh.stage < SHIPS.length) { const st = SHIPS[Sh.stage]; if (st.lv <= bl('chantier') && shipRsOk(st) && canX(st.c)) { shipStart(); S.flow.shipStage = (S.flow.shipStage || 0) + 1 } }
      for (const k of Object.keys(SHIPM)) { const n = (Sh.mods[k] || 0) + 1; if (n <= 3 && !modLock(k, n) && canX(modCost(k, n)) && G.res.gold > S.gold0 + modCost(k, n).gold + 500) { modUp(k); S.flow.mod = (S.flow.mod || 0) + 1 } }
      if (!Sh.pilot) { const m = G.chars.filter(c => c.mage && !c.inj).sort((a, b) => b.st - a.st)[0]; if (m) pilotSet(m.id) }
      if (Sh.stage >= SHIPS.length && pilotOf() && !Sh.ready) { shipBapt(); S.flow.baptized = 1 }
    }
  }
  /* ---- galaxie : commerce, présents, exploration, pillage occasionnel ---- */
  async function galaxy() {
    if (!galOpen()) return;
    const Q = galEnsure(), Sh = Q.ship; galTick();
    if (Sh.tr) return;
    S.gal = S.gal || { trips: 0 };
    if (Sh.at == 'home') {
      const pl = Q.planets.filter(p => p.disc && galTradeOk(p)).sort((a, b) => galDist('home', a.id) - galDist('home', b.id));
      if (!pl.length) return;
      const tgt = pl[S.gal.trips % Math.min(4, pl.length)], fu = galFuel(galDist('home', tgt.id));
      if (G.res.food < fu.food + 150 || pilotOf().inj || pilotOf().party) { if (pilotOf().party) { pilotOf().party = 0; reidx() } return }
      galGo(tgt.id, 'food'); S.gal.trips++; S.flow.trips = (S.flow.trips || 0) + 1; return;
    }
    const p = galP(Sh.at); if (!p) return;
    // commerce : on achète ce qui sert (ingrédients d'éveil, noyaux, cristaux), et on vend le surplus de vivres/bois/pierre
    const nd = needs();
    for (const of of galOffers(p)) {
      if (of.left < 1) continue; const useful = /^mat_(parchemin|pierre|tome)_|^mat_(noyau|mithril|cristal|lingot|fragment)|^mat_essence/.test(of.k);
      if (!useful || G.res.gold < of.price + S.gold0 + 500) continue;
      for (let i = 0; i < of.left && i < 10; i++) { if (G.res.gold < of.price + S.gold0 + 500) break; const g0 = G.res.gold; await galTrade(p.id, of.k, 'buy'); if (G.res.gold >= g0) break; S.flow.galBuy = (S.flow.galBuy || 0) + 1 }
    }
    for (const de of galDemand(p)) { const have = haveX(de.k), surplus = de.k == 'food' ? G.res.food - 600 : de.k == 'wood' ? G.res.wood - 400 : de.k == 'stone' ? G.res.stone - 400 : have - (nd[de.k] || 0) - 5; if (surplus >= de.n) { const g0 = G.res.gold; await galTrade(p.id, de.k, 'sell'); if (G.res.gold > g0) S.flow.galSell = (S.flow.galSell || 0) + 1 } }
    // présent
    if (p.gift + GAL.GIFT_CD * 60000 < Date.now() && G.res.gold > 5000 + S.gold0 && galAtt(p) < 50) { await galGift(p.id, G.res.gold > 20000 ? 1 : 0); S.flow.gift = (S.flow.gift || 0) + 1 }
    // recrutement de vagabond (3-5 étoiles)
    try { const W = galWand(p); if (W.here && !W.done && G.chars.length < capa() && G.res.gold > wandPrice(W.st) + S.gold0 + 500) { await galRecruit(p.id); S.flow.wand = (S.flow.wand || 0) + 1 } } catch (e) { }
    // exploration (une expédition dans un étage du biome de la planète)
    if (p.exp + GAL.EXP_CD * 60000 < Date.now() && party().length && !idealInj()) { galExplore(p.id); if (mode == 'floor') { S.flow.galExp = (S.flow.galExp || 0) + 1; await climb(F.f, true) } }
    // pillage : une fois sur quatre voyages, si les chances estimées sont bonnes
    if (mode == 'village' && S.gal.trips % 4 == 0 && !(p.shield > Date.now()) && party().length && !idealInj()) { const O = galOdds(p); if (O.w >= (S.policy.push >= 8 ? .35 : .7)) { S.flow.raids = (S.flow.raids || 0) + 1; const d0 = G.dead.length; await galRaid(p.id); S.flow.raidDead = (S.flow.raidDead || 0) + G.dead.length - d0; S.gal.trips++ } }
    if (mode == 'village' && !Sh.tr) { galGo('home', 'food') }
  }
  async function village() {
    spend(S.policy.villageSec || 90);
    tryf(pendings, 'pendings');
    tryf(() => { G.plots.forEach((p, i) => { if (p && p.k == 'ferme' && (p.stock | 0) >= 1) harvest(i); if (p && p.k == 'chasse') chaGet(i) }) }, 'harvest');
    tryf(healAll, 'heal');
    tryf(builds, 'builds');
    const nxt = PLAN.find(([k, l]) => bl(k) < l && !(k == 'chantier' && !G.ballon));
    S.gold0 = nxt && nxt[1] > 1 ? (bCost(nxt[0], nxt[1]).gold || 0) : 0;
    tryf(setParty, 'setParty');
    tryf(posts, 'posts');
    tryf(() => { sacrifice(); summons(Math.min(S.gold0, 300)) }, 'summons');
    if (S.policy.frag) for (let r = 0; r < 5 && G.res.gold > 20000 + S.gold0; r++) tryf(() => { sacrifice(); summons(20000) }, 'fragFarm');
    tryf(pendings, 'pendings');
    tryf(setParty, 'setParty');
    tryf(equipAll, 'equip');
    tryf(evolve, 'evolve');
    tryf(crafting, 'crafting');
    tryf(gearEvo, 'gearEvo');
    tryf(researches, 'research');
    tryf(training, 'training');
    tryf(misc, 'misc');
    tryf(market, 'market');
    tryf(fuseUp, 'fuse');
    tryf(mageShip, 'mageShip');
    try { await galaxy() } catch (e) { W.ERRS.push({ tag: 'galaxy', msg: String(e.message), stack: String(e.stack).split('\n').slice(0, 4).join(' | '), day: S.day }) }
    tryf(setParty, 'setParty'); tryf(equipAll, 'equip');
  }
  /* mort définitive du héros (js/hero.js : FIN non nul) = fin de la partie */
  const heroDead = () => { if (typeof FIN != 'undefined' && FIN) { if (!S.heroDeath) { S.heroDeath = { day: S.day, f: S.fl ? S.fl.f : G.max, act: +(S.act / 3600).toFixed(2), why: FIN.why }; L('herodeath', S.heroDeath) } return true } return false };
  /* ---- tour ---- */
  const avgHp = () => { const p = party(); if (!p.length) return 0; return p.reduce((a, c) => a + (F.hp[c.id] == null ? 1 : F.hp[c.id] / stats(c).hp), 0) / p.length };
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  function evPick() {
    const ch = EV.def.ch; let best = -1, bs = 1e9;
    ch.forEach((c, i) => { if (c.ok && !c.ok()) return; if (c.death || c.fight) return; const r = (c.risk || []).reduce((a, x) => a + x[1], 0); const s = r * 10 + i * .1 + (c.cls == 'red' ? 5 : 0); if (s < bs) { bs = s; best = i } });
    return best < 0 ? ch.length - 1 : best;
  }
  async function doEvent(e) {
    S.st.events++; S.fl.events.push(e.k);
    evtOpen(e);
    if (e.k == 'marchand') {
      tryf(() => { (e.stock || []).forEach((o, i) => { const p = shopP(o); if (o.it && o.it.t == 'potion' && o.left > 0 && G.res.gold > p + 200) shopBuy(i) }) }, 'shop');
      shopLeave(); return;
    }
    if (!EV) { W.EVOPEN = 0; return }
    evtPick(evPick());
    await evtDone();
  }
  async function climb(f, noEnter) {
    S.fl = { f, fights: [], inj: [], deaths: [], events: [], t0: S.act, lvA: lvAvg(), party: party().map(c => [c.name, c.lv, c.st, c.role]), res0: snapRes(), dead0: G.dead.length, mats0: matTot(), chars0: G.chars.length, items0: G.items.length };
    { const P = party(), FB = typeof foeBase == 'function' ? foeBase(f) : { hp: 130 * fScale(f, 1.2, 1.1), atk: 24 * fScale(f, 1.16, 1.08), def: 10 + 3 * f }, hpM = FB.hp, atkM = FB.atk, defM = FB.def; const v = P.map(c => stats(c)); S.fl.ttk = +(v.reduce((a, x) => a + hpM / (x.atk * 100 / (100 + defM)), 0) / Math.max(1, v.length)).toFixed(2); S.fl.surv = +(v.reduce((a, x) => a + x.hp / (atkM * 100 / (100 + x.def)), 0) / Math.max(1, v.length)).toFixed(1) }
    /* PV conservés entre les étages (js/rules.js) : repos payant si l'équipe est entamée, sinon attente au village */
    S.fl.dng = typeof floorDanger == 'function' ? +floorDanger(f).s.toFixed(2) : null;
    if (!noEnter && typeof teamHp == 'function' && f > 3) { let w = 0; while (teamHp() < .8 && w++ < 6) { const o = restCost(); if (can(o) && G.res.gold > o.gold + 200) { restNow(); S.st.rests2 = (S.st.rests2 || 0) + 1; S.st.restGold = (S.st.restGold || 0) + o.gold; break } spend(300) } }
    if (!noEnter) enterFloor(f); spend(45);
    let res = 'win', step = 0;
    const fires = () => F.ents.filter(e => e.t == 'fire' && !e.used);
    try {
      while (mode == 'floor' && step++ < 200) {
        if (heroDead()) { res = 'herodeath'; break }
        if (!party().length) { res = 'wipe'; break }
        const h = avgHp();
        if (h < .6) { const fr = fires()[0]; if (fr) { F.p.x = fr.x; F.p.y = fr.y; entAct(fr).f(); spend(20); continue } }
        if (h < .3 && S.policy.push < 3) { await leaveFloor('quit'); res = 'retreat'; break }
        const gs = F.groups.filter(g => g.alive).sort((a, b) => dist(a, F.p) - dist(b, F.p));
        const ent = F.ents.find(e => !e.used && ['chest', 'coffrev', 'wood', 'stone', 'herb', 'vein', 'hurt', 'altar', 'brasero', 'evt'].includes(e.t));
        if (gs.length) {
          const g = gs[0]; spend(dist(g, F.p) / 70);
          F.p.x = g.x; F.p.y = g.y;
          const r = Math.random(), adv = r < S.policy.adv ? 1 : r < S.policy.adv + .25 ? 0 : -1;
          const rr = await fight(g, adv);
          spend((S.last.fight ? S.last.fight.allyT : 4) * 3.2 + 8);
          if (rr == 'lose' || mode != 'floor') { res = 'wipe'; break }
          continue;
        }
        if (ent) {
          F.p.x = ent.x; F.p.y = ent.y;
          if (ent.t == 'evt') { await doEvent(ent); spend(25); if (mode != 'floor') { res = party().length ? 'quit' : 'wipe'; break } ent.used = 1; continue }
          if (ent.t == 'altar') { ent.used = 1; altar(0); spend(10); continue }
          const a = entAct(ent); if (a) a.f(); ent.used = 1; spend(12); continue;
        }
        if (F.seals < 3) {
          if (typeof hasLaw == 'function' ? hasLaw('verrous') : F.law == 'verrous') { const lv = F.ents.find(e => e.t == 'lever' && e.rn == F.order[F.seals] && !e.used); if (lv) { F.p.x = lv.x; F.p.y = lv.y; entAct(lv).f(); spend(10); continue } }
          const sl = F.ents.find(e => e.t == 'seal' && !e.used); if (sl) { F.p.x = sl.x; F.p.y = sl.y; entAct(sl).f(); spend(10); continue }
          res = 'stuck'; break;
        }
        const gate = F.ents.find(e => e.t == 'gate' || e.t == 'exit');
        if (!gate) { res = 'stuck'; break }
        F.p.x = gate.x; F.p.y = gate.y; spend(30);
        if (gate.t == 'gate') {
          if (h < .5 && fires()[0]) { const fr = fires()[0]; entAct(fr).f(); continue }
          await finalFight(gate); spend((S.last.fight ? S.last.fight.allyT : 4) * 3.2 + 15);
          if (mode != 'floor') { res = 'wipe'; break }
          if (gate.t == 'gate') { res = 'bossloss'; await leaveFloor('quit'); break }
          continue;
        }
        await leaveFloor('win'); res = 'win'; break;
      }
    } catch (e) { W.ERRS.push({ tag: 'climb', msg: String(e.message), stack: String(e.stack).split('\n').slice(0, 4).join(' | '), day: S.day }); res = 'error' }
    if (mode != 'village') { try { await leaveFloor('quit') } catch (_) { enterVillage() } }
    closePanel(); spend(20);
    const fl = S.fl, wins = fl.fights.filter(x => x.res == 'win').length;
    W.LOG.push({ t: 'floor', day: S.day, h: +(W.__off / 3600e3).toFixed(2), act: +(S.act / 3600).toFixed(2), f, res, laws: typeof lawsOf == 'function' ? lawsOf(f) : [F && F.law], mods: typeof modsOf == 'function' ? modsOf(f) : [], dng: fl.dng, dur: S.act - fl.t0, lvA: +fl.lvA.toFixed(1), party: fl.party, partyEnd: party().map(c => [c.name, c.lv, c.st]), fights: fl.fights.length, wins, ttk: fl.ttk, surv: fl.surv, rounds: fl.fights.length ? +(fl.fights.reduce((a, x) => a + x.rounds, 0) / fl.fights.length).toFixed(1) : 0, maxRounds: Math.max(0, ...fl.fights.map(x => x.rounds)), lost: fl.fights.reduce((a, x) => a + x.lost, 0), inj: fl.inj, deaths: G.dead.slice(fl.dead0), events: fl.events, gold: G.res.gold | 0, d: { gold: (G.res.gold | 0) - fl.res0.gold, wood: (G.res.wood | 0) - fl.res0.wood, stone: (G.res.stone | 0) - fl.res0.stone, food: (G.res.food | 0) - fl.res0.food, shard: (G.res.shard | 0) - fl.res0.shard, mats: matTot() - fl.mats0, chars: G.chars.length - fl.chars0, items: G.items.length - fl.items0 }, max: G.max, nchars: G.chars.length, rs: snapRes(), mats: matTot() });
    S.fl = null;
    if (res == 'win') S.fails[f] = 0; else S.fails[f] = (S.fails[f] || 0) + 1;
    return res;
  }
  /* puissance de l'équipe idéale (4 meilleurs, blessés compris) : on n'entre pas dans la Tour tant que les blessés ne sont pas soignés */
  const idealPow = () => G.chars.slice().sort((a, b) => pw(b) - pw(a)).slice(0, 4).reduce((a, c) => a + pw(c), 0);
  const curPow = () => party().reduce((a, c) => a + pw(c), 0), idealInj = () => G.chars.slice().sort((a, b) => pw(b) - pw(a)).slice(0, 4).some(c => c.inj);
  const powKey = () => { const t = G.chars.slice().sort((a, b) => pw(b) - pw(a)).slice(0, 4); return t.reduce((a, c) => a + c.st, 0) + '/' + Math.floor(t.reduce((a, c) => a + c.lv, 0) / 20) };
  function pickFloor() {
    const P = S.policy, mx = G.max;
    if (S.pk != powKey()) { S.pk = powKey(); S.fails = {} }
    const lvp = party().reduce((a, c) => a + c.lv, 0) / Math.max(1, party().length);
    let f = Math.min(mx, floorForLv(lvp) + P.push);
    while (f > 1 && (S.fails[f] || 0) >= P.farmAfter) f--;
    S.farm = f < mx ? 1 : 0;
    return Math.max(1, f);
  }
  async function session(minutes) {
    const end = S.act + minutes * 60;
    let guard = 0;
    while (S.act < end && guard++ < 60) {
      if (heroDead()) return 'done';
      await village();
      if (G.max > MAXF || heroDead()) return 'done';
      if (!party().length || idealInj()) { S.st.rests = (S.st.rests || 0) + 1; break }
      const f = pickFloor();
      const r = await climb(f);
      if (r == 'error') spend(60);
      if (r != 'win') { S.sessFail = (S.sessFail || 0) + 1; if (S.sessFail >= (S.policy.farmAfter < 2 ? 1 : 2)) { S.sessFail = 0; break } } else S.sessFail = 0;
    }
    return 'ok';
  }
  async function tryf0(f) { try { return await f() } catch (e) { W.ERRS.push({ tag: 'session', msg: String(e.message), stack: String(e.stack).split('\n').slice(0, 5).join(' | '), day: S.day }); return 'error' } }
  /* ---- API ---- */
  /* option --cheatship : donne un bateau prêt et un pilote mage au jour demandé, pour exercer la galaxie (le bot normal n'obtient presque jamais de mage) */
  function cheatShip() {
    mgEnsure(); mrsEnsure();
    let m = G.chars.find(c => c.mage); if (!m) { m = mk(3); m.mage = 'Arcanique'; m.eq.arme = mkItem('baton', 2); upRole(m); G.chars.push(m) }
    G.ballon = 1; ['nv_1', 'nv_2', 'nv_3', 'df_1', 'df_2'].forEach(k => G.mrs.done[k] = 1);
    G.ship.stage = SHIPS.length; G.ship.pilot = m.id; G.ship.ready = 1; for (const k in SHIPM) G.ship.mods[k] = Math.max(G.ship.mods[k] || 0, 2);
    if (!bl('chantier')) { const i = G.plots.findIndex((p, i) => !p && i > HSITE); if (i > 0) G.plots[i] = { k: 'chantier', lv: 3, stock: 0 } }
    galEnsure(); L('cheatship', {});
  }
  W.BOT = {
    cheatShip,
    boot(policy) {
      S.policy = policy; SPD = 2000; W.__off = 0;
      const c = mk(1, { name: 'Aria', race: 'Humain', mage: undefined, look: { hair: '#e9d28a', skin: '#ffd9bd', eye: '#3aa0ff', style: 1, hue: 0 }, eq: { arme: mkItem('epee', 1, { el: null }), armure: null, outil: null }, party: 0, lock: 1 });
      c.tal = talentRoll(); c.hero = 1; c.lock = 1; G.chars.forEach(o => { if (o.party) o.party++; if (o.party > 4) o.party = 0 }); c.party = 1; G.chars.unshift(c); reidx(); relSeed(); G.intro = 1; introEnd(); save();
      W.__ap = 1; if (!B_AUTO) tAuto(); vtLast = Date.now(); mgLast = Date.now(); G.injT = Date.now();
      L('boot', { tal: c.tal });
    },
    session: min => tryf0(() => session(min)),
    offline, spend, setDay(d) { S.day = d },
    snap() { return { heroDeath: S.heroDeath || null, dbg: { next: (() => { const st = G.ship && SHIPS[G.ship.stage]; if (!st) return null; const o = {}; for (const k in st.c) o[k] = [haveX(k), st.c[k]]; return { k: st.k, lv: st.lv, rs: shipRsOk(st), have: o, q: !!G.ship.q } })(), mchars: G.chars.filter(c => c.mage).map(c => [c.name, c.st, c.mage, c.party, c.inj, c.job && c.job.post, postsOf(c)]), mslots: bSlots('mage'), mposted: postedAt('mage').length, mnv1: [MRS.nv_1.t, canX(MRS.nv_1.c), MRS.nv_1.c], mage: bl('mage'), call: G.mrs && G.mrs.call, can: canX(CALL_C), cap: [G.chars.length, capa()], mages: G.chars.filter(c => c.mage).length, ship: G.ship && [G.ship.stage, !!G.ship.q, G.ship.ready], ballon: G.ballon, mrsDone: G.mrs && Object.keys(G.mrs.done), run: G.mrs && G.mrs.run.length, chantier: bl('chantier') }, gsrc: S.gsrc,  off: W.__off, max: G.max, chars: G.chars.length, gold: G.res.gold, res: snapRes(), mats: snapMats(), party: party().map(c => [c.name, c.lv, c.st, c.role]), plots: G.plots.map(p => p ? p.k + p.lv : null), dead: G.dead.length, act: S.act, st: S.st, flow: S.flow, items: G.items.length } },
    dump() { return { log: W.LOG, errs: W.ERRS, snap: this.snap(), chars: G.chars.map(c => ({ n: c.name, st: c.st, lv: c.lv, role: c.role, job: c.job && c.job.id, rank: c.job && c.job.id ? jRank(c) : 0, post: c.job && c.job.post, party: c.party, pers: c.pers, tal: c.tal, inj: c.inj, wd: c.wd && c.wd.k })) } },
    flushLog() { const l = W.LOG; W.LOG = []; return l },
    S,
  };
}

/* ====== orchestration Node ====== */
(async () => {
  const { chromium } = require('playwright');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 420, height: 800 } });
  const consoleErrs = [];
  page.on('pageerror', e => consoleErrs.push({ k: 'pageerror', m: String(e.message), s: String(e.stack || '').split('\n').slice(0, 3).join(' | ') }));
  page.on('console', m => { if (m.type() == 'error') consoleErrs.push({ k: 'console', m: m.text() }); else if (m.type() == 'warning') consoleErrs.push({ k: 'warn', m: m.text() }) });
  await page.addInitScript(seed => {
    let s = seed >>> 0;
    Math.random = () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 };
    const B = 1.7e12; window.__off = 0; Date.now = () => B + window.__off;
    try { localStorage.clear() } catch (e) { }
  }, SEED * 7919 + 13);
  /* accélération : les pauses et animations de combat sont résolues instantanément (le jeu lui-même n'est pas modifié sur disque) */
  const patch = (file, from, to) => page.route('**/js/' + file, r => { let t = fs.readFileSync(path.resolve(__dirname, '..', 'js', file), 'utf8'); if (!t.includes(from)) console.error('PATCH INTROUVABLE', file); t = t.replace(from, to); r.fulfill({ body: t, contentType: 'text/javascript' }) });
  if (!args.slow) {
    await patch('data.js', 'const sleep=ms=>new Promise(r=>setTimeout(r,ms/SPD))', 'const sleep=ms=>Promise.resolve()');
    await patch('village.js', 'function anim(ms,fn){return new Promise(r=>anims.push({t:0,d:ms/1000/SPD,fn,r}))}', 'function anim(ms,fn){fn(1);return Promise.resolve()}');
  }
  await page.goto(URL); await page.waitForTimeout(1500);
  await page.evaluate(`(${PAGE.toString()})(${SEED},${JSON.stringify(POL)},${MAXF})`);
  await page.evaluate(p => BOT.boot(p), POL);
  const out = { seed: SEED, policy: POLICY, args: { DAYS, MAXF }, days: [], log: [], errs: [], consoleErrs };
  const t0 = Date.now(); let done = false, lastMax = 1, lastMaxDay = 0;
  const activeH = POL.sessions.length * POL.min / 60, openFrac = Math.max(0, Math.min(1, POL.open / Math.max(1, 24 - activeH)));
  for (let day = 1; day <= DAYS && !done; day++) {
    await page.evaluate(d => BOT.setDay(d), day);
    let prevEnd = 0;
    for (const sh of POL.sessions) {
      const start = sh * 3600, gap = start - prevEnd;
      if (gap > 0) await page.evaluate(([g, o]) => BOT.offline(g, o), [gap, openFrac]);
      const r = await Promise.race([page.evaluate(m => BOT.session(m), POL.min), new Promise(r => setTimeout(() => r('timeout'), 900000))]);
      if (r == 'timeout') { console.error('timeout jour', day); done = true; break }
      prevEnd = start + POL.min * 60;
      if (args.verbose) { const l = await page.evaluate(() => BOT.flushLog()); out.log.push(...l); l.filter(x => x.t == 'floor').forEach(x => console.error(`  j${day} étage ${x.f} ${x.res} combats ${x.fights} tours ${x.rounds} niv ${x.lvA} or ${x.gold} morts ${x.deaths.length} bless ${x.inj.length}`)) }
      if (r == 'done') { done = true; break }
    }
    if (!done) await page.evaluate(([g, o]) => BOT.offline(g, o), [86400 - prevEnd, openFrac]);
    if (args.cheatship && day == +args.cheatship) await page.evaluate(() => BOT.cheatShip());
    const snap = await page.evaluate(() => BOT.snap());
    if (snap.heroDeath) { out.heroDeath = snap.heroDeath; done = true; console.error('MORT DU HÉROS jour ' + day + ' étage ' + snap.heroDeath.f); }
    out.days.push({ day, off: +(snap.off / 3600e3).toFixed(1), act: +(snap.act / 3600).toFixed(2), max: snap.max, chars: snap.chars, gold: snap.gold, res: snap.res, mats: snap.mats, plots: snap.plots, party: snap.party, dead: snap.dead });
    out.log.push(...await page.evaluate(() => BOT.flushLog()));
    if (snap.max > lastMax) { lastMax = snap.max; lastMaxDay = day }
    if (day - lastMaxDay >= +(args.stall || 30)) { console.error(`calage : étage ${snap.max} inchangé depuis ${day - lastMaxDay} jours`); done = true }
    if (day % 5 == 0 || done) console.error(`jour ${day} (${((Date.now() - t0) / 1000).toFixed(0)} s) : étage max ${snap.max}, ${snap.chars} perso, or ${snap.gold}, niv ${snap.party.map(p => p[1]).join('/')}, morts ${snap.dead}`);
    if (Date.now() - t0 > 1000 * +(args.budget || 1500)) { console.error('budget temps épuisé'); break }
  }
  const dump = await page.evaluate(() => BOT.dump());
  out.log.push(...dump.log); out.errs = dump.errs; out.final = dump.snap; out.chars = dump.chars; out.consoleErrs = consoleErrs;
  fs.writeFileSync(OUT, JSON.stringify(out));
  console.error(`écrit ${OUT} : étage max ${out.final.max}, erreurs bot ${out.errs.length}, erreurs console ${consoleErrs.length}`);
  await Promise.race([browser.close(), new Promise(r => setTimeout(r, 3000))]);
  process.exit(0);
})().catch(e => { console.error('ECHEC', e); process.exit(1) });
