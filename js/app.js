// Startseite: große Zahl, Treemap nach Einzelplan und Kapitel, Detailkasten.
// Beträge in haushalt.json sind in Tausend Euro.

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

// ---------- Zahlen formatieren ----------

const zahl1 = (n) => n.toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

function euro(tausend, mitVorzeichen = false) {
  const e = tausend * 1000;
  const a = Math.abs(e);
  const zeichen = mitVorzeichen && e > 0 ? "+" : e < 0 ? "−" : "";
  if (a >= 1e9) return `${zeichen}${zahl1(a / 1e9)} Mrd. €`;
  if (a >= 1e6) return `${zeichen}${zahl1(a / 1e6)} Mio. €`;
  return `${zeichen}${Math.round(a).toLocaleString("de-DE")} €`;
}

function prozent(anteil, mitVorzeichen = false) {
  const p = anteil * 100;
  const zeichen = mitVorzeichen && p > 0 ? "+" : p < 0 ? "−" : "";
  const stellen = Math.abs(p) < 1 ? 2 : 1;
  return `${zeichen}${Math.abs(p).toLocaleString("de-DE", { minimumFractionDigits: stellen, maximumFractionDigits: stellen })} %`;
}

// Veränderung 2025 zu 2026 als Text, mit Sonderfällen für neue und entfallene Posten.
function veraenderung(e) {
  if (e.s25 === null) return { text: "neu in 2026", klasse: "" };
  const diff = e.s26 - e.s25;
  if (diff === 0) return { text: "unverändert", klasse: "" };
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

// ---------- Daten aufbereiten ----------

function einzelplanEintraege() {
  return daten.einzelplaene.map((ep) => ({
    id: ep.nr,
    typ: "ep",
    nr: ep.nr,
    name: ep.name,
    kurz: kurzname(ep.name),
    s26: ep.soll["2026"],
    s25: ep.soll["2025"],
  }));
}

function kapitelEintraege(ep) {
  return ep.kapitel
    .filter((k) => !k.anlage)
    .map((k) => {
      // Kapitel, das es 2025 noch nicht gab: alle Titel haben für 2025 keinen Wert.
      const gab2025 = k.titel.some((t) => t.soll["2025"] !== null);
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
    knopf.setAttribute("aria-label", `${e.name}: ${euro(e.s26)}, Soll 2026`);
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
    zeigeDetails(e, `Einzelplan ${e.nr}`);
    el("treemap-titel").scrollIntoView({ behavior: "smooth", block: "start" });
  } else {
    ausgewaehlt = e.id;
    zeichneTreemap();
    zeigeDetails(e, `Kapitel ${e.nr}`);
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
      <div><dt>Soll 2026</dt><dd>${euro(e.s26)}</dd></div>
      <div><dt>Soll 2025</dt><dd>${e.s25 === null ? "nicht vorhanden" : euro(e.s25)}</dd></div>
      <div><dt>Veränderung</dt><dd class="${v.klasse}">${v.text}</dd></div>
      <div><dt>Anteil am Kernhaushalt 2026</dt><dd>${prozent(e.s26 / gesamt2026)}</dd></div>
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
    zurueck.textContent = "← Alle Einzelpläne";
    zurueck.addEventListener("click", zurUebersicht);
    pfad.appendChild(zurueck);
    el("treemap-titel").textContent = aktuellerEp.name;
    el("treemap-hinweis").textContent = "Die Flächen zeigen die Kapitel dieses Einzelplans. Tippen Sie auf ein Kapitel für Details.";
  } else {
    el("treemap-titel").textContent = "Wofür gibt der Bund Geld aus?";
    el("treemap-hinweis").textContent = "Jede Fläche ist so groß wie die Ausgaben eines Einzelplans (meist ein Ministerium). Tippen Sie auf ein Feld für Details und Kapitel.";
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
    <h2>Nicht im Kernhaushalt enthalten</h2>
    <p>Zu diesem Einzelplan gehören Anlagen mit eigenem Wirtschaftsplan, zum Beispiel Sondervermögen. Sie werden getrennt geführt (Soll 2026):</p>
    <ul></ul>
    <p>Kernhaushalt dieses Einzelplans und Anlagen zusammen: <strong>${euro(kern + summeAnlagen)}</strong> (Soll 2026).
    Achtung: Fließt Geld aus dem Kernhaushalt in eine Anlage, ist dieser Betrag in der Summe doppelt enthalten.</p>`;
  const liste = kasten.querySelector("ul");
  for (const k of anlagen) {
    const li = document.createElement("li");
    const name = anzeigename(k.name.replace(/^Anlage \d+ /, ""));
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
    zeile.innerHTML = `<td><button type="button"></button></td><td>${euro(e.s26)}</td><td>${e.s25 === null ? "neu" : euro(e.s25)}</td><td class="${v.klasse}">${v.text}</td>`;
    const knopf = zeile.querySelector("button");
    knopf.textContent = e.typ === "ep" ? `${e.nr} ${e.kurz}` : `${e.nr} ${e.name}`;
    knopf.addEventListener("click", () => waehle(e));
    tbody.appendChild(zeile);
  }
  const ohneFlaeche = eintraege.filter((e) => e.s26 <= 0).length;
  el("tabelle-hinweis").textContent = ohneFlaeche
    ? `${ohneFlaeche} Einträge haben 2026 einen Betrag von null oder darunter und erscheinen deshalb nicht als Fläche. Negative Beträge sind meist pauschale Einsparvorgaben.`
    : "";
}

// Drei Zahlen zum Mitnehmen, alle aus dem Soll 2026 berechnet.
function zeigeFakten() {
  const euroGesamt = gesamt2026 * 1000;
  const proKopf = Math.round(euroGesamt / EINWOHNER / 10) * 10;
  const proSekunde = Math.round(euroGesamt / (365 * 24 * 60 * 60) / 100) * 100;
  const groesster = einzelplanEintraege().sort((a, b) => b.s26 - a.s26)[0];
  const fakten = [
    { wert: `${proKopf.toLocaleString("de-DE")} €`, text: "pro Einwohnerin und Einwohner", quelle: "Soll 2026 geteilt durch 83,5 Mio. Einwohner" },
    { wert: `${proSekunde.toLocaleString("de-DE")} €`, text: "gibt der Bund im Schnitt pro Sekunde aus", quelle: "Soll 2026 geteilt durch die Sekunden eines Jahres" },
    { wert: prozent(groesster.s26 / gesamt2026), text: `gehen an ${groesster.kurz}`, quelle: `Einzelplan ${groesster.nr}, Soll 2026` },
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
    el("gesamt-text").textContent = "Die Daten konnten nicht geladen werden.";
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
