// Haushaltsspiel: sechs Runden aus daten/runden.json, Rückmeldung nur aus belegten Daten (bereiche.json).
// Beträge in bereiche.json in Tausend Euro, in runden.json in Mrd. Euro.

const MRD = 1_000_000;

let bereiche = null;   // Bereiche nach id
let sollHaupt = 0;
let runden = [];
let nr = 0;            // aktuelle Runde (Index)
const plan = {};       // Änderung je Bereich in Tausend Euro
const kredite = { ausnahme: 0, regel: 0 };   // zusätzliche Kredite in Tausend Euro
const entscheidungen = [];

const el = (id) => document.getElementById(id);
const tx = (o) => o[SPRACHE] ?? o.de;
const bName = (b) => (SPRACHE === "en" ? b.en.name : b.name);
const bWer = (b) => (SPRACHE === "en" ? b.en.erklaerung : b.erklaerung).wer_bekommt_das_geld;
const ersterSatz = (text) => text.split(/(?<=\.)\s/)[0];

// ---------- Rechnen ----------

const summePlan = () => Object.values(plan).reduce((s, v) => s + v, 0);
const kreditGesamt = () => kredite.ausnahme + kredite.regel;

// Gesetzlich gebundene Bereiche, die insgesamt gekürzt wurden
function gesetzlichGekuerzt() {
  return Object.keys(plan).filter((id) => plan[id] < -1 && bereiche[id].bindung === "gesetzlich gebunden");
}

function pruefeRunden() {
  for (const r of runden) {
    for (const o of r.optionen) {
      const aenderung = [...Object.values(r.fest), ...Object.values(o.aenderungen)].reduce((s, v) => s + v, 0);
      if (Math.abs(aenderung - o.kredit - r.ziel) > 0.001) {
        console.error(`Runde ${r.id}, Option ${o.id} geht nicht auf`);
      }
      for (const id of [...Object.keys(r.fest), ...Object.keys(o.aenderungen)]) {
        if (!bereiche[id]) console.error(`Runde ${r.id}: unbekannter Bereich ${id}`);
      }
    }
  }
}

// ---------- Anzeige: Status ----------

function zeigeStatus() {
  el("status").hidden = false;
  el("status-runde").textContent = `${Math.min(nr + 1, runden.length)} / ${runden.length}`;
  el("status-ausgaben").textContent = milliarden(sollHaupt + summePlan());
  el("status-kredite").textContent = milliarden(kreditGesamt(), true);
  el("status-gesetze").textContent = String(gesetzlichGekuerzt().length);
  el("fortschritt").style.width = `${(entscheidungen.length / runden.length) * 100}%`;
}

// ---------- Anzeige: Runde ----------

function zeigeRunde() {
  const r = runden[nr];
  const box = el("runde");
  box.hidden = false;
  box.innerHTML = `
    <p class="runde-nummer"></p>
    <h2 class="runde-titel"></h2>
    <p class="runde-situation"></p>
    <p class="runde-hintergrund"><strong></strong> <span></span> <a></a></p>
    <h3 class="runde-frage"></h3>
    <div class="optionen"></div>
    <div class="rueckmeldung" hidden></div>`;
  box.querySelector(".runde-nummer").textContent = t("spiel.runde", { n: nr + 1, m: runden.length });
  box.querySelector(".runde-titel").textContent = tx(r.titel);
  box.querySelector(".runde-situation").textContent = tx(r.situation);
  box.querySelector(".runde-hintergrund strong").textContent = `${t("spiel.hintergrund")}:`;
  box.querySelector(".runde-hintergrund span").textContent = tx(r.hintergrund);
  const quelle = box.querySelector(".runde-hintergrund a");
  quelle.href = r.quelle.url;
  quelle.textContent = `(${t("erkl.quelle")}: ${r.quelle.titel})`;
  box.querySelector(".runde-frage").textContent = t("spiel.frage");

  const optionen = box.querySelector(".optionen");
  r.optionen.forEach((o, i) => {
    const knopf = document.createElement("button");
    knopf.type = "button";
    knopf.className = "option";
    knopf.innerHTML = `<span class="option-buchstabe"></span><span class="option-text"><strong></strong><span></span></span>`;
    knopf.querySelector(".option-buchstabe").textContent = "ABC"[i];
    knopf.querySelector("strong").textContent = tx(o.titel);
    knopf.querySelector(".option-text > span").textContent = tx(o.text);
    knopf.addEventListener("click", () => entscheide(r, o, knopf));
    optionen.appendChild(knopf);
  });
  zeigeStatus();
  el("spiel").scrollIntoView({ behavior: "smooth", block: "start" });
}

function entscheide(r, o, knopf) {
  for (const k of el("runde").querySelectorAll(".option")) {
    k.disabled = true;
    k.classList.toggle("gewaehlt", k === knopf);
  }
  const aenderungen = {};
  for (const [id, mrd] of [...Object.entries(r.fest), ...Object.entries(o.aenderungen)]) {
    aenderungen[id] = (aenderungen[id] || 0) + Math.round(mrd * MRD);
  }
  for (const [id, wert] of Object.entries(aenderungen)) plan[id] = (plan[id] || 0) + wert;
  const kredit = Math.round(o.kredit * MRD);
  if (o.kredit_ausnahme) kredite.ausnahme += kredit;
  else kredite.regel += kredit;
  entscheidungen.push({ runde: r, option: o });

  zeigeRueckmeldung(aenderungen, o, kredit);
  zeigeStatus();
}

function zeigeRueckmeldung(aenderungen, o, kredit) {
  const box = el("runde").querySelector(".rueckmeldung");
  box.hidden = false;
  const h = document.createElement("h3");
  h.textContent = t("spiel.rueckmeldung");
  const ul = document.createElement("ul");
  ul.className = "rueckmeldung-liste";

  const eintraege = Object.entries(aenderungen).sort((a, b) => b[1] - a[1]);
  for (const [id, wert] of eintraege) {
    const b = bereiche[id];
    const li = document.createElement("li");
    li.innerHTML = `<div class="rm-kopf"><span></span><strong></strong></div>`;
    li.querySelector(".rm-kopf span").textContent = bName(b);
    const betrag = li.querySelector(".rm-kopf strong");
    betrag.textContent = milliarden(wert, true);
    betrag.className = wert > 0 ? "plus" : "minus";
    if (wert < 0) {
      const p1 = document.createElement("p");
      p1.textContent = t(`bindung.hinweis.${b.bindung}`);
      const p2 = document.createElement("p");
      p2.textContent = `${t("spiel.betroffen")}: ${ersterSatz(bWer(b))}`;
      li.append(p1, p2);
    }
    ul.appendChild(li);
  }

  if (kredit !== 0) {
    const li = document.createElement("li");
    li.innerHTML = `<div class="rm-kopf"><span></span><strong></strong></div><p></p>`;
    li.querySelector(".rm-kopf span").textContent = t("spiel.status.kredite");
    li.querySelector(".rm-kopf strong").textContent = milliarden(kredit, true);
    let text;
    if (kredit < 0) text = t("spiel.kredit.weniger", { betrag: milliarden(-kredit) });
    else if (o.kredit_ausnahme) text = t("spiel.kredit.ausnahme");
    else text = t("spiel.kredit.regel");
    li.querySelector("p").textContent = text;
    if (kredit > 0) {
      const a = document.createElement("a");
      a.href = "https://www.gesetze-im-internet.de/gg/art_115.html";
      a.textContent = ` (${t("erkl.quelle")}: Art. 115 GG)`;
      li.querySelector("p").appendChild(a);
    }
    ul.appendChild(li);
  }

  if (eintraege.length === 0 && kredit === 0) {
    const li = document.createElement("li");
    li.textContent = t("spiel.nichts");
    ul.appendChild(li);
  }

  const weiter = document.createElement("button");
  weiter.type = "button";
  weiter.className = "knopf knopf-gross";
  weiter.textContent = nr + 1 < runden.length ? t("spiel.weiter") : t("spiel.auswertung");
  weiter.addEventListener("click", () => {
    nr += 1;
    if (nr < runden.length) zeigeRunde();
    else zeigeEnde();
  });
  box.append(h, ul, weiter);
  box.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ---------- Auswertung ----------

function zeigeEnde() {
  el("runde").hidden = true;
  const box = el("ende");
  box.hidden = false;
  box.replaceChildren();
  zeigeStatus();

  const h = document.createElement("h2");
  h.textContent = t("spiel.ende.titel");
  const summe = document.createElement("p");
  summe.className = "ende-summe";
  summe.textContent = t("spiel.ende.ausgaben", { plan: milliarden(sollHaupt + summePlan()), soll: milliarden(sollHaupt) });
  box.append(h, summe);

  // Kennzahlen
  const dl = document.createElement("dl");
  dl.className = "kennzahlen kennzahlen-ende";
  const gesetzlich = gesetzlichGekuerzt();
  for (const [titel, wert] of [
    [t("spiel.status.kredite"), milliarden(kreditGesamt(), true)],
    [t("spiel.ende.kredite.ausnahme"), milliarden(kredite.ausnahme, true)],
    [t("spiel.ende.kredite.regel"), milliarden(kredite.regel, true)],
    [t("spiel.status.gesetze"), String(gesetzlich.length)],
  ]) {
    const div = document.createElement("div");
    div.innerHTML = "<dt></dt><dd></dd>";
    div.querySelector("dt").textContent = titel;
    div.querySelector("dd").textContent = wert;
    dl.appendChild(div);
  }
  box.appendChild(dl);

  // Hinweise
  const hinweise = [];
  hinweise.push(gesetzlich.length
    ? t("spiel.ende.gesetze", { namen: gesetzlich.map((id) => bName(bereiche[id])).join(", ") })
    : t("spiel.ende.keinegesetze"));
  if (kredite.regel > 0) hinweise.push(t("spiel.ende.notlage", { betrag: milliarden(kredite.regel) }));
  if (kreditGesamt() > 0) hinweise.push(t("spiel.ende.zinsen"));
  for (const text of hinweise) {
    const p = document.createElement("p");
    p.className = "ergebnis-hinweis";
    p.textContent = text;
    box.appendChild(p);
  }

  // Änderungen je Bereich
  const h3 = document.createElement("h3");
  h3.textContent = t("spiel.ende.aenderungen");
  const ul = document.createElement("ul");
  ul.className = "ergebnis-liste";
  const geaendert = Object.entries(plan).filter(([, v]) => Math.abs(v) >= 50_000).sort((a, b) => b[1] - a[1]);
  for (const [id, wert] of geaendert) {
    const li = document.createElement("li");
    li.innerHTML = `<span></span><strong></strong>`;
    li.querySelector("span").textContent = bName(bereiche[id]);
    const s = li.querySelector("strong");
    s.textContent = `${milliarden(wert, true)} (${prozent(wert / bereiche[id].betrag, true)})`;
    s.className = wert > 0 ? "plus" : "minus";
    ul.appendChild(li);
  }
  box.append(h3, ul);

  // Deine Entscheidungen
  const h4 = document.createElement("h3");
  h4.textContent = t("spiel.ende.entscheidungen");
  const ol = document.createElement("ol");
  ol.className = "entscheidungen";
  for (const e of entscheidungen) {
    const li = document.createElement("li");
    li.innerHTML = "<strong></strong> <span></span>";
    li.querySelector("strong").textContent = `${tx(e.runde.titel)}:`;
    li.querySelector("span").textContent = tx(e.option.titel);
    ol.appendChild(li);
  }
  box.append(h4, ol);

  const hinweis = document.createElement("p");
  hinweis.className = "hinweis";
  hinweis.textContent = t("spiel.ende.neutral");
  box.appendChild(hinweis);

  const knoepfe = document.createElement("div");
  knoepfe.className = "hero-knoepfe";
  const nochmal = document.createElement("button");
  nochmal.type = "button";
  nochmal.className = "knopf knopf-gross";
  nochmal.textContent = t("spiel.nochmal");
  nochmal.addEventListener("click", neuStarten);
  const frei = document.createElement("a");
  frei.className = "knopf knopf-rand";
  frei.href = mitSprache("umschichten.html");
  frei.textContent = t("spiel.frei");
  knoepfe.append(nochmal, frei);
  box.appendChild(knoepfe);
  box.scrollIntoView({ behavior: "smooth", block: "start" });
}

function neuStarten() {
  nr = 0;
  for (const id of Object.keys(plan)) delete plan[id];
  kredite.ausnahme = 0;
  kredite.regel = 0;
  entscheidungen.length = 0;
  el("ende").hidden = true;
  el("start").hidden = true;
  zeigeRunde();
}

// ---------- Start ----------

async function start() {
  try {
    const [b, r] = await Promise.all([
      fetch(datei("daten/bereiche.json")).then((a) => a.json()),
      fetch(datei("daten/runden.json")).then((a) => a.json()),
    ]);
    bereiche = Object.fromEntries(b.bereiche.map((x) => [x.id, x]));
    sollHaupt = b.summe;
    runden = r.runden;
  } catch (fehler) {
    el("start").textContent = t("fehler.laden");
    return;
  }
  pruefeRunden();
  el("starten").addEventListener("click", neuStarten);
}

start();
