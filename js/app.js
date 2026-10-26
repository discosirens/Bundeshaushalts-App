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

// Jede Kachel muss groß genug für eine Beschriftung sein (in Pixeln). Zu kleine Einträge kommen in "Weitere".
const MIN_BREITE = 80;
const MIN_HOEHE = 48;

// Laienverständliche Namen der Ausgabearten (Hauptgruppen des Gruppierungsplans, Feld "art" in haushalt.json)
const ARTEN = {
  "Personalausgaben": "art.personal",
  "Sächliche Verwaltungsausgaben und Schuldendienst": "art.sach",
  "Zuweisungen und Zuschüsse (ohne Investitionen)": "art.zuschuesse",
  "Baumaßnahmen": "art.bau",
  "Sonstige Ausgaben für Investitionen": "art.investitionen",
  "Besondere Finanzierungsausgaben": "art.besondere",
};

// Titelnamen, die seit Aufstellung des Haushaltsplans überholt sind
const TITEL_HINWEIS = { "1101/68112": "titel.buergergeld" };

let daten = null;
let kapitelTexte = { freigegeben: false, texte: {} };
let gesamt2026 = 0;
let aktuellerEp = null;   // null = Übersicht aller Einzelpläne
let ausgewaehlt = null;   // id des angetippten Feldes
let weitereStapel = [];   // geöffnete "Weitere"-Kacheln (jeweils Liste ihrer Einträge)

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
    s27: ep.soll["2027"],
  }));
}

function kapitelEintraege(ep) {
  return ep.kapitel
    .filter((k) => !k.anlage)
    .map((k) => {
      // Kapitel, das es 2025 noch nicht gab: alle Titel haben für 2025 keinen Wert.
      const gab2025 = k.titel.some((ti) => ti.soll["2025"] !== null);
      const gibt2027 = k.titel.some((ti) => ti.soll["2027"] != null);
      return {
        id: k.nr,
        typ: "kapitel",
        nr: k.nr,
        name: anzeigename(k.name),
        kurz: anzeigename(k.name),
        s26: k.soll["2026"],
        s25: gab2025 ? k.soll["2025"] : null,
        s27: gibt2027 ? k.soll["2027"] : null,
        kapitel: k,
      };
    });
}

function aktuelleEintraege() {
  if (weitereStapel.length) return weitereStapel[weitereStapel.length - 1];
  if (!aktuellerEp) return einzelplanEintraege();
  return kapitelEintraege(aktuellerEp);
}

// Sammelkachel "Weitere (n)" für zu kleine Einträge. Antippen öffnet sie als eigene Treemap.
function gruppeAus(klein) {
  const kinder = [...klein].sort((a, b) => b.s26 - a.s26);
  const s25 = kinder.every((e) => e.s25 === null) ? null : kinder.reduce((s, e) => s + (e.s25 || 0), 0);
  const name = t(aktuellerEp ? "treemap.weitere.kapitel" : "treemap.weitere.ep", { n: kinder.length });
  return { id: `weitere-${weitereStapel.length}`, typ: "gruppe", name, kurz: name,
    s26: kinder.reduce((s, e) => s + e.s26, 0), s25, kinder };
}

function rechneTreemap(liste, breite, hoehe) {
  const wurzel = d3.hierarchy({ children: liste })
    .sum((d) => d.s26 || 0)
    // "Weitere" immer zuletzt (unten rechts), sonst nach Größe
    .sort((a, b) => (a.data.typ === "gruppe") - (b.data.typ === "gruppe") || b.value - a.value);
  d3.treemap().size([breite, hoehe]).paddingInner(2).round(true)(wurzel);
  return wurzel.leaves();
}

// Layout so lange neu berechnen, bis jede Kachel groß genug für ihre Beschriftung ist.
// Ist am Ende auch "Weitere" zu klein, wird es als Knopf unter der Treemap gezeigt.
function berechneLayout(eintraege, breite, hoehe) {
  const zuKlein = (b) => b.x1 - b.x0 < MIN_BREITE || b.y1 - b.y0 < MIN_HOEHE;
  let sichtbar = eintraege.filter((e) => e.s26 > 0).sort((a, b) => b.s26 - a.s26);
  let weitere = [];
  let gruppeAlsKachel = true;
  for (let runde = 0; runde < 15; runde++) {
    const liste = weitere.length && gruppeAlsKachel ? [...sichtbar, gruppeAus(weitere)] : sichtbar;
    const blaetter = rechneTreemap(liste, breite, hoehe);
    const klein = blaetter.filter((b) => b.data.typ !== "gruppe" && zuKlein(b)).map((b) => b.data);
    if (klein.length && klein.length < sichtbar.length) {
      weitere = [...weitere, ...klein];
      sichtbar = sichtbar.filter((e) => !klein.includes(e));
      continue;
    }
    const gruppe = blaetter.find((b) => b.data.typ === "gruppe");
    if (gruppe && zuKlein(gruppe)) {
      // "Weitere" wird zum Knopf; das Layout ohne diese Kachel wird erneut geprüft
      gruppeAlsKachel = false;
      continue;
    }
    return { blaetter, knopf: weitere.length && !gruppeAlsKachel ? gruppeAus(weitere) : null };
  }
  return { blaetter: rechneTreemap(sichtbar, breite, hoehe), knopf: weitere.length ? gruppeAus(weitere) : null };
}

// ---------- Treemap ----------

function zeichneTreemap() {
  const behaelter = el("treemap");
  const breite = behaelter.clientWidth;
  const hoehe = behaelter.clientHeight;
  const { blaetter, knopf: weitereKnopf } = berechneLayout(aktuelleEintraege(), breite, hoehe);

  const mehr = el("treemap-mehr");
  mehr.replaceChildren();
  mehr.hidden = !weitereKnopf;
  if (weitereKnopf) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "weitere-knopf";
    b.textContent = t("treemap.weitere.knopf", { name: weitereKnopf.name, betrag: euro(weitereKnopf.s26) });
    b.addEventListener("click", () => waehle(weitereKnopf));
    mehr.appendChild(b);
  }

  behaelter.replaceChildren();
  for (const blatt of blaetter) {
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
    if (e.typ === "gruppe") knopf.classList.add("gruppe");
    if (e.id === ausgewaehlt) knopf.classList.add("aktiv");
    Object.assign(knopf.style, { left: `${blatt.x0}px`, top: `${blatt.y0}px`, width: `${w}px`, height: `${h}px` });
    knopf.setAttribute("aria-label", t("treemap.feld.label", { name: e.name, betrag: euro(e.s26) }));
    knopf.title = `${e.name}: ${euro(e.s26)}`;
    knopf.innerHTML = `<span class="name"></span><span class="betrag"></span>`;
    knopf.querySelector(".name").textContent = e.kurz;
    knopf.querySelector(".betrag").textContent = euro(e.s26);
    knopf.addEventListener("click", () => waehle(e));
    behaelter.appendChild(knopf);
    passeTextAn(knopf);
  }
}

// Langer Name passt nicht in die Kachel: erst kleinere Schrift, dann Name nach n Zeilen mit "…" kürzen.
// Der Betrag bleibt immer sichtbar, der volle Name steht im Detailkasten und im Tooltip.
function passeTextAn(knopf) {
  const passt = () => knopf.scrollHeight <= knopf.clientHeight + 1;
  if (passt()) return;
  knopf.classList.remove("gross");
  if (passt()) return;
  knopf.classList.add("klein");
  if (passt()) return;
  const name = knopf.querySelector(".name");
  const betrag = knopf.querySelector(".betrag");
  const stil = getComputedStyle(knopf);
  const innen = knopf.clientHeight - parseFloat(stil.paddingTop) - parseFloat(stil.paddingBottom) - betrag.offsetHeight;
  const zeile = parseFloat(getComputedStyle(name).lineHeight) || 15;
  const zeilen = Math.max(1, Math.floor(innen / zeile));
  name.classList.add("gekuerzt");
  name.style.webkitLineClamp = String(zeilen);
  name.style.lineClamp = String(zeilen);
}

// ---------- Interaktion ----------

function waehle(e) {
  if (e.typ === "gruppe") {
    weitereStapel.push(e.kinder);
    ausgewaehlt = null;
    el("details").hidden = true;
    zeigeEbene();
    el("treemap-titel").scrollIntoView({ behavior: "smooth", block: "start" });
  } else if (e.typ === "ep") {
    aktuellerEp = daten.einzelplaene.find((ep) => ep.nr === e.nr);
    weitereStapel = [];
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
  weitereStapel = [];
  ausgewaehlt = null;
  el("details").hidden = true;
  zeigeEbene();
}

function zurueckAusWeitere() {
  weitereStapel.pop();
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
      ${e.s27 === undefined ? "" : `<div class="entwurf"><dt>${t("details.entwurf27")}</dt><dd>${entwurfText(e)}</dd></div>`}
    </dl>`;
  kasten.querySelector("h2").textContent = `${kennung}: ${e.name}`;
  if (e.kapitel) zeigeKapitelInfo(kasten, e.kapitel);
  kasten.hidden = false;
}

// Entwurf 2027 mit Veränderung gegenüber dem Soll 2026
function entwurfText(e) {
  if (e.s27 === null) return t("details.entwurf.fehlt");
  const diff = e.s27 - e.s26;
  if (diff === 0 || e.s26 <= 0) return euro(e.s27);
  const klasse = diff > 0 ? "plus" : "minus";
  return `${euro(e.s27)} <small class="${klasse}">${euro(diff, true)} (${prozent(diff / e.s26, true)})</small>`;
}

function titelName(kap, ti) {
  const hinweis = TITEL_HINWEIS[`${kap.nr}/${ti.nr}`];
  const name = anzeigename(ti.name.replace(/"/g, "").replace(" der Die ", " der "));
  return hinweis ? `${name} ${t(hinweis)}` : name;
}

// Kurzinfo zu einem Kapitel: eigener Text (falls freigegeben), größte Posten, Ausgabearten.
function zeigeKapitelInfo(kasten, kap) {
  const text = kapitelTexte.freigegeben && kapitelTexte.texte[kap.nr];
  if (text) {
    const p = document.createElement("p");
    p.className = "kapitel-text";
    p.textContent = text[SPRACHE] ?? text.de;
    kasten.querySelector("h2").after(p);
  }

  const titel = kap.titel.filter((ti) => (ti.soll["2026"] || 0) > 0);
  if (titel.length === 0) return;
  const block = document.createElement("div");
  block.className = "kapitel-info";

  const h1 = document.createElement("h3");
  h1.textContent = t("kapitel.posten");
  const ol = document.createElement("ol");
  ol.className = "rangliste";
  for (const ti of [...titel].sort((a, b) => b.soll["2026"] - a.soll["2026"]).slice(0, 3)) {
    const li = document.createElement("li");
    li.innerHTML = "<span></span><strong></strong>";
    li.querySelector("span").textContent = titelName(kap, ti);
    li.querySelector("strong").textContent = euro(ti.soll["2026"]);
    ol.appendChild(li);
  }
  block.append(h1, ol);

  // Anteile der Ausgabearten an den positiven Beträgen
  const summe = titel.reduce((s, ti) => s + ti.soll["2026"], 0);
  const arten = {};
  for (const ti of titel) arten[ti.art] = (arten[ti.art] || 0) + ti.soll["2026"];
  const h2 = document.createElement("h3");
  h2.textContent = t("kapitel.arten");
  const balken = document.createElement("div");
  balken.className = "arten-liste";
  for (const [art, wert] of Object.entries(arten).sort((a, b) => b[1] - a[1]).slice(0, 4)) {
    const zeile = document.createElement("div");
    zeile.className = "art-zeile";
    zeile.innerHTML = `<span class="art-name"></span><span class="art-balken"><span></span></span><span class="art-wert"></span>`;
    zeile.querySelector(".art-name").textContent = t(ARTEN[art] || "art.sonstige");
    zeile.querySelector(".art-balken span").style.width = `${(wert / summe) * 100}%`;
    zeile.querySelector(".art-wert").textContent = prozent(wert / summe);
    balken.appendChild(zeile);
  }
  block.append(h2, balken);

  // Bereichsausnahme der Schuldenbremse je Posten gibt es nur im Entwurf 2027
  const ba27 = kap.titel.filter((ti) => ti.bereichsausnahme_2027).reduce((s, ti) => s + (ti.soll["2027"] || 0), 0);
  if (ba27 > 0) {
    const p = document.createElement("p");
    p.className = "ergebnis-hinweis";
    p.textContent = t("kapitel.ba27", { betrag: euro(ba27), gesamt: euro(kap.soll["2027"]) });
    block.appendChild(p);
  }

  const hinweis = document.createElement("p");
  hinweis.className = "hinweis";
  hinweis.textContent = t("kapitel.hinweis", { n: kap.titel.length });
  block.appendChild(hinweis);
  kasten.appendChild(block);
}

function zeigeEbene() {
  const pfad = el("pfad");
  pfad.replaceChildren();
  const knopf = (text, aktion) => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = text;
    b.addEventListener("click", aktion);
    pfad.appendChild(b);
  };
  if (aktuellerEp) knopf(t("treemap.zurueck"), zurUebersicht);
  if (weitereStapel.length) knopf(t("treemap.zurueck.weitere"), zurueckAusWeitere);

  if (aktuellerEp) {
    el("treemap-titel").textContent = epName(aktuellerEp);
    el("treemap-hinweis").textContent = t("treemap.hinweis.ep");
  } else {
    el("treemap-titel").textContent = weitereStapel.length ? t("treemap.titel.weitere") : t("treemap.titel");
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
    zeile.innerHTML = `<td><button type="button"></button></td><td>${euro(e.s26)}</td><td>${e.s25 === null ? t("tabelle.neu") : euro(e.s25)}</td><td class="${v.klasse}">${v.text}</td><td>${e.s27 == null ? "" : euro(e.s27)}</td>`;
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
    const antwort = await fetch(datei("daten/haushalt.json"));
    daten = await antwort.json();
    // Kapiteltexte sind optional: fehlen sie, bleibt es bei der automatischen Kurzinfo
    kapitelTexte = await fetch(datei("daten/kapitel_texte.json")).then((a) => a.json()).catch(() => kapitelTexte);
  } catch (fehler) {
    el("gesamt-text").textContent = t("fehler.laden");
    return;
  }
  gesamt2026 = daten.summen["2026"].kernhaushalt;
  el("gesamt").textContent = euro(gesamt2026);
  el("entwurf27").textContent = t("hero.entwurf", { betrag: euro(daten.summen["2027"].kernhaushalt) });
  zeigeFakten();

  zeigeEbene();
  if (typeof starteSuche === "function") starteSuche();

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
