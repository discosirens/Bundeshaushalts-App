// Startseite: große Zahl, Treemap nach Einzelplan und Kapitel, Detailkasten.
// Beträge in haushalt.json sind in Tausend Euro. Texte und Zahlenformate kommen aus sprache.js.

const EINWOHNER = 83_500_000; // 31.12.2025, Statistisches Bundesamt, PM Nr. 203 vom 16.06.2026

// Feste Farbe je Einzelplan (nur zur Unterscheidung). Kleinere Einzelpläne teilen sich eine neutrale Farbe.
// "dunkel" = dunkle Schrift auf heller Farbe für ausreichenden Kontrast.
const EP_FARBEN = {
  "11": { farbe: "var(--ep-a)", dunkel: false },
  "14": { farbe: "var(--ep-b)", dunkel: false },
  "60": { farbe: "var(--ep-c)", dunkel: true },
  "32": { farbe: "var(--ep-d)", dunkel: true },
  "12": { farbe: "var(--ep-e)", dunkel: true },
  "30": { farbe: "var(--ep-f)", dunkel: true },
  "15": { farbe: "var(--ep-g)", dunkel: false },
};
const EP_REST = { farbe: "var(--ep-rest)", dunkel: true };

let daten = null;
let gesamt2026 = 0;
let aktuellerEp = null;   // null = Übersicht aller Einzelpläne
let ausgewaehlt = null;   // id des angetippten Feldes

const el = (id) => document.getElementById(id);

// Veränderung 2025 zu 2026 als Text, mit Sonderfällen für neue und entfallene Posten.
function veraenderung(e) {
  if (e.s25 === null) return { text: t("veraenderung.neu"), klasse: "" };
  const diff = e.s26 - e.s25;
  if (diff === 0) return { text: t("veraenderung.gleich"), klasse: "" };
  const klasse = diff > 0 ? "plus" : "minus";
  if (e.s25 <= 0) return { text: euro(diff, true), klasse };
  return { text: `${euro(diff, true)} (${prozent(diff / e.s25, true)})`, klasse };
}

// Namen aus den Rohdaten ohne " - " zeigen (Projektregel: keine Gedankenstriche).
// Kurzer Zusatz am Ende kommt in Klammern ("... - GAK" -> "... (GAK)"), sonst Doppelpunkt.
function anzeigename(name) {
  return name.replace(/ - ([^-]{1,12})$/, " ($1)").replace(/ - /g, ": ");
}

function kurzname(name) {
  const kurz = name
    .replace(/^Bundesministerium (für|der|des) /, "")
    .replace(/^Die Bundesbeauftragte für /, "Beauftragte für ");
  return kurz.charAt(0).toUpperCase() + kurz.slice(1);
}

// Einzelplan-Namen in der gewählten Sprache. Kapitelnamen bleiben amtlich deutsch.
function epName(ep) {
  return SPRACHE === "en" && EP_NAMEN_EN[ep.nr] ? EP_NAMEN_EN[ep.nr][0] : ep.name;
}
function epKurz(ep) {
  return SPRACHE === "en" && EP_NAMEN_EN[ep.nr] ? EP_NAMEN_EN[ep.nr][1] : kurzname(ep.name);
}

// ---------- Daten aufbereiten ----------

function einzelplanEintraege() {
  return daten.einzelplaene.map((ep) => ({
    id: ep.nr,
    typ: "ep",
    nr: ep.nr,
    name: epName(ep),
    kurz: epKurz(ep),
    s26: ep.soll["2026"],
    s25: ep.soll["2025"],
  }));
}

function kapitelEintraege(ep) {
  return ep.kapitel
    .filter((k) => !k.anlage)
    .map((k) => {
      // Kapitel, das es 2025 noch nicht gab: alle Titel haben für 2025 keinen Wert.
      const gab2025 = k.titel.some((ti) => ti.soll["2025"] !== null);
      return {
        id: k.nr,
        typ: "kapitel",
        nr: k.nr,
        name: anzeigename(k.name),
        kurz: anzeigename(k.name),
        s26: k.soll["2026"],
        s25: gab2025 ? k.soll["2025"] : null,
      };
    });
}

function aktuelleEintraege() {
  if (!aktuellerEp) return einzelplanEintraege();
  return kapitelEintraege(aktuellerEp);
}

// ---------- Treemap ----------

function zeichneTreemap() {
  const behaelter = el("treemap");
  const breite = behaelter.clientWidth;
  const hoehe = behaelter.clientHeight;
  const eintraege = aktuelleEintraege().filter((e) => e.s26 > 0);

  const wurzel = d3.hierarchy({ children: eintraege })
    .sum((d) => d.s26 || 0)
    .sort((a, b) => b.value - a.value);
  d3.treemap().size([breite, hoehe]).paddingInner(2).round(true)(wurzel);

  behaelter.replaceChildren();
  for (const blatt of wurzel.leaves()) {
    const e = blatt.data;
    const w = blatt.x1 - blatt.x0;
    const h = blatt.y1 - blatt.y0;
    const knopf = document.createElement("button");
    knopf.type = "button";
    knopf.className = "feld";
    if (w > 200 && h > 120) knopf.classList.add("gross");
    if (w < 90 || h < 44) knopf.classList.add("klein");
    if (w < 36 || h < 22) knopf.classList.add("winzig");
    // In der Kapitel-Ansicht behalten alle Felder die Farbe ihres Einzelplans.
    const stil = EP_FARBEN[aktuellerEp ? aktuellerEp.nr : e.nr] || EP_REST;
    knopf.style.background = stil.farbe;
    if (stil.dunkel) knopf.classList.add("dunkel");
    if (e.id === ausgewaehlt) knopf.classList.add("aktiv");
    Object.assign(knopf.style, { left: `${blatt.x0}px`, top: `${blatt.y0}px`, width: `${w}px`, height: `${h}px` });
    knopf.setAttribute("aria-label", t("treemap.feld.label", { name: e.name, betrag: euro(e.s26) }));
    knopf.title = `${e.name}: ${euro(e.s26)}`;
    knopf.innerHTML = `<span class="name"></span><span class="betrag"></span>`;
    knopf.querySelector(".name").textContent = e.kurz;
    knopf.querySelector(".betrag").textContent = euro(e.s26);
    knopf.addEventListener("click", () => waehle(e));
    behaelter.appendChild(knopf);
  }
}

// ---------- Interaktion ----------

function waehle(e) {
  if (e.typ === "ep") {
    aktuellerEp = daten.einzelplaene.find((ep) => ep.nr === e.nr);
    ausgewaehlt = null;
    zeigeEbene();
    zeigeDetails(e, t("details.einzelplan", { nr: e.nr }));
    el("treemap-titel").scrollIntoView({ behavior: "smooth", block: "start" });
  } else {
    ausgewaehlt = e.id;
    zeichneTreemap();
    zeigeDetails(e, t("details.kapitel", { nr: e.nr }));
    el("details").scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
}

function zurUebersicht() {
  aktuellerEp = null;
  ausgewaehlt = null;
  el("details").hidden = true;
  zeigeEbene();
}

function zeigeDetails(e, kennung) {
  const v = veraenderung(e);
  const kasten = el("details");
  kasten.innerHTML = `
    <h2></h2>
    <dl>
      <div><dt>${t("details.soll26")}</dt><dd>${euro(e.s26)}</dd></div>
      <div><dt>${t("details.soll25")}</dt><dd>${e.s25 === null ? t("details.fehlt") : euro(e.s25)}</dd></div>
      <div><dt>${t("details.veraenderung")}</dt><dd class="${v.klasse}">${v.text}</dd></div>
      <div><dt>${t("details.anteil")}</dt><dd>${prozent(e.s26 / gesamt2026)}</dd></div>
    </dl>`;
  kasten.querySelector("h2").textContent = `${kennung}: ${e.name}`;
  kasten.hidden = false;
}

function zeigeEbene() {
  const pfad = el("pfad");
  pfad.replaceChildren();
  if (aktuellerEp) {
    const zurueck = document.createElement("button");
    zurueck.type = "button";
    zurueck.textContent = t("treemap.zurueck");
    zurueck.addEventListener("click", zurUebersicht);
    pfad.appendChild(zurueck);
    el("treemap-titel").textContent = epName(aktuellerEp);
    el("treemap-hinweis").textContent = t("treemap.hinweis.ep");
  } else {
    el("treemap-titel").textContent = t("treemap.titel");
    el("treemap-hinweis").textContent = t("treemap.hinweis");
  }
  zeichneTreemap();
  zeigeAnlagen();
  fuelleTabelle();
}

// Sondervermögen und andere Anlagen: getrennt zeigen, nie in den Kernhaushalt einrechnen.
function zeigeAnlagen() {
  const kasten = el("anlagen");
  const anlagen = aktuellerEp ? aktuellerEp.kapitel.filter((k) => k.anlage && k.soll["2026"] > 0) : [];
  if (anlagen.length === 0) {
    kasten.hidden = true;
    return;
  }
  const summeAnlagen = anlagen.reduce((s, k) => s + k.soll["2026"], 0);
  const kern = aktuellerEp.soll["2026"];
  kasten.innerHTML = `
    <h2>${t("anlagen.titel")}</h2>
    <p>${t("anlagen.text")}</p>
    <ul></ul>
    <p>${t("anlagen.summe", { betrag: euro(kern + summeAnlagen) })}</p>`;
  const liste = kasten.querySelector("ul");
  for (const k of anlagen) {
    const li = document.createElement("li");
    const name = SPRACHE === "en" && ANLAGEN_EN[k.nr]
      ? ANLAGEN_EN[k.nr]
      : anzeigename(k.name.replace(/^Anlage \d+ /, ""));
    li.textContent = `${name}: ${euro(k.soll["2026"])}`;
    liste.appendChild(li);
  }
  kasten.hidden = false;
}

function fuelleTabelle() {
  const eintraege = aktuelleEintraege().sort((a, b) => b.s26 - a.s26);
  const tbody = el("tabelle").querySelector("tbody");
  tbody.replaceChildren();
  for (const e of eintraege) {
    const v = veraenderung(e);
    const zeile = document.createElement("tr");
    zeile.innerHTML = `<td><button type="button"></button></td><td>${euro(e.s26)}</td><td>${e.s25 === null ? t("tabelle.neu") : euro(e.s25)}</td><td class="${v.klasse}">${v.text}</td>`;
    const knopf = zeile.querySelector("button");
    knopf.textContent = e.typ === "ep" ? `${e.nr} ${e.kurz}` : `${e.nr} ${e.name}`;
    knopf.addEventListener("click", () => waehle(e));
    tbody.appendChild(zeile);
  }
  const ohneFlaeche = eintraege.filter((e) => e.s26 <= 0).length;
  el("tabelle-hinweis").textContent = ohneFlaeche ? t("tabelle.hinweis", { n: ohneFlaeche }) : "";
}

// Drei Zahlen zum Mitnehmen, alle aus dem Soll 2026 berechnet.
function zeigeFakten() {
  const euroGesamt = gesamt2026 * 1000;
  const proKopf = Math.round(euroGesamt / EINWOHNER / 10) * 10;
  const proSekunde = Math.round(euroGesamt / (365 * 24 * 60 * 60) / 100) * 100;
  const groesster = einzelplanEintraege().sort((a, b) => b.s26 - a.s26)[0];
  const fakten = [
    { wert: geldbetrag(proKopf), text: t("fakt.kopf.text"), quelle: t("fakt.kopf.quelle") },
    { wert: geldbetrag(proSekunde), text: t("fakt.sekunde.text"), quelle: t("fakt.sekunde.quelle") },
    {
      wert: prozent(groesster.s26 / gesamt2026),
      text: t("fakt.anteil.text", { name: groesster.kurz }),
      quelle: t("fakt.anteil.quelle", { nr: groesster.nr }),
    },
  ];
  const liste = el("fakten");
  liste.replaceChildren();
  for (const f of fakten) {
    const li = document.createElement("li");
    li.className = "fakt";
    li.innerHTML = `<span class="fakt-wert"></span><span class="fakt-text"></span><span class="fakt-quelle"></span>`;
    li.querySelector(".fakt-wert").textContent = f.wert;
    li.querySelector(".fakt-text").textContent = f.text;
    li.querySelector(".fakt-quelle").textContent = f.quelle;
    liste.appendChild(li);
  }
}

// ---------- Start ----------

async function start() {
  try {
    const antwort = await fetch("daten/haushalt.json");
    daten = await antwort.json();
  } catch (fehler) {
    el("gesamt-text").textContent = t("fehler.laden");
    return;
  }
  gesamt2026 = daten.summen["2026"].kernhaushalt;
  el("gesamt").textContent = euro(gesamt2026);
  zeigeFakten();

  zeigeEbene();

  let letzteBreite = el("treemap").clientWidth;
  new ResizeObserver(() => {
    const breite = el("treemap").clientWidth;
    if (breite !== letzteBreite) {
      letzteBreite = breite;
      zeichneTreemap();
    }
  }).observe(el("treemap"));
}

start();
