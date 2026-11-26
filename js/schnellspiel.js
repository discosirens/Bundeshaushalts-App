// Schnellspiel: Karten mit Sparvorschlägen aus der Politik, jeweils Ja oder Nein.
// Daten: daten/karten.json (Beträge in Mrd. Euro, Beitrag zum Ziel "weniger Kredite nach der normalen Schuldenbremse").

let spiel = null;
let index = 0;
let entscheidungen = [];   // je Karte: true (Ja) oder false (Nein), in der Reihenfolge der Karten

const el = (id) => document.getElementById(id);
const tx = (o) => o[SPRACHE] ?? o.de;
const mrd = (n) => (n === 0 ? geldbetrag(0) : milliarden(n * 1e6));

function gespart() {
  return spiel.karten.reduce((s, k, i) => s + (entscheidungen[i] ? k.ziel_mrd : 0), 0);
}

// ---------- Fortschritt ----------

function zeigeStand() {
  const wert = gespart();
  const anteil = Math.min(1, wert / spiel.ziel_mrd);
  el("ziel-fuellung").style.width = `${anteil * 100}%`;
  el("ziel-fuellung").classList.toggle("erreicht", wert >= spiel.ziel_mrd);
  el("ziel-text").textContent = t("schnell.stand", { gespart: mrd(wert), ziel: mrd(spiel.ziel_mrd) });
  el("ziel-balken").setAttribute("aria-label", el("ziel-text").textContent);
}

// ---------- Eine Karte ----------

function abschnitt(eltern, titel, text) {
  const h = document.createElement("h3");
  h.textContent = titel;
  const p = document.createElement("p");
  p.textContent = text;
  eltern.append(h, p);
}

function zeigeKarte() {
  const k = spiel.karten[index];
  const box = el("schnell-karte");
  box.replaceChildren();
  box.hidden = false;

  const kopf = document.createElement("p");
  kopf.className = "schnell-kopf";
  kopf.innerHTML = "<span class=\"karte-art\"></span><span></span>";
  kopf.querySelector(".karte-art").textContent = t(`schnell.art.${k.art}`);
  kopf.querySelector(".karte-art").classList.add(`art-${k.art}`);
  kopf.lastChild.textContent = t("schnell.nummer", { n: index + 1, gesamt: spiel.karten.length });

  const h2 = document.createElement("h2");
  h2.className = "schnell-titel";
  h2.textContent = tx(k.titel);
  h2.tabIndex = -1;

  const text = document.createElement("p");
  text.textContent = tx(k.text);

  // Betrag für das Ziel; bei Aha-Karten erst nach der Entscheidung
  const betrag = document.createElement("p");
  betrag.className = "schnell-betrag";
  betrag.textContent = k.aha ? t("schnell.betrag.frage") : t("schnell.fuers.ziel", { betrag: mrd(k.ziel_mrd) });

  const mehr = document.createElement("details");
  mehr.className = "unterthema";
  mehr.innerHTML = "<summary></summary><div class=\"schnell-mehr\"></div>";
  mehr.querySelector("summary").textContent = t("schnell.mehr");
  const inhalt = mehr.querySelector(".schnell-mehr");
  abschnitt(inhalt, t("schnell.wer"), tx(k.wer));
  abschnitt(inhalt, t("schnell.rechnung"), tx(k.betrag));
  abschnitt(inhalt, t("schnell.braucht"), tx(k.braucht));
  const q = document.createElement("p");
  q.className = "debatte-quelle";
  q.textContent = `${t("erkl.quellen")}:`;
  k.quellen.forEach((quelle, i) => {
    if (i) q.append(";");
    const a = document.createElement("a");
    a.href = quelle.url;
    a.textContent = quelle.titel;
    q.append(" ", a);
  });
  inhalt.appendChild(q);

  const knoepfe = document.createElement("div");
  knoepfe.className = "schnell-knoepfe";
  const nein = document.createElement("button");
  nein.type = "button";
  nein.className = "schnell-wahl nein";
  nein.textContent = t("schnell.nein");
  const ja = document.createElement("button");
  ja.type = "button";
  ja.className = "schnell-wahl ja";
  ja.textContent = t("schnell.ja");
  nein.addEventListener("click", () => entscheide(false));
  ja.addEventListener("click", () => entscheide(true));
  knoepfe.append(nein, ja);

  box.append(kopf, h2, text, betrag, knoepfe, mehr);
  if (index > 0) {
    const zurueck = document.createElement("button");
    zurueck.type = "button";
    zurueck.className = "knopf-klein schnell-zurueck";
    zurueck.textContent = t("schnell.zurueck");
    zurueck.addEventListener("click", () => {
      index -= 1;
      entscheidungen.length = index;
      zeigeStand();
      zeigeKarte();
    });
    box.appendChild(zurueck);
  }
  h2.focus({ preventScroll: true });
  // Nach langem Aufklappen ("Mehr dazu") die neue Karte wieder ins Bild holen, unter dem Fortschrittsbalken
  const oben = box.getBoundingClientRect().top;
  const balken = el("ziel-stand").getBoundingClientRect().bottom;
  if (oben < balken) window.scrollBy({ top: oben - balken - 12 });
}

function entscheide(ja) {
  const k = spiel.karten[index];
  entscheidungen[index] = ja;
  zeigeStand();
  if (k.aha) {
    zeigeAha(k, ja);
    return;
  }
  weiter();
}

// Erklärung, warum eine Karte nicht zum Ziel beiträgt; danach weiter
function zeigeAha(k, ja) {
  const box = el("schnell-karte");
  box.querySelector(".schnell-knoepfe").remove();
  box.querySelector(".schnell-zurueck")?.remove();
  const betrag = box.querySelector(".schnell-betrag");
  betrag.textContent = t("schnell.fuers.ziel", { betrag: mrd(k.ziel_mrd) });
  const aha = document.createElement("div");
  aha.className = "schnell-aha";
  aha.setAttribute("role", "status");
  aha.innerHTML = "<strong></strong><p></p>";
  aha.querySelector("strong").textContent = t(ja ? "schnell.aha.ja" : "schnell.aha.nein");
  aha.querySelector("p").textContent = tx(k.aha);
  const knopf = document.createElement("button");
  knopf.type = "button";
  knopf.className = "knopf knopf-gross";
  knopf.textContent = t(index + 1 < spiel.karten.length ? "schnell.weiter" : "schnell.auswertung");
  knopf.addEventListener("click", weiter);
  betrag.after(aha, knopf);
  knopf.focus();
}

function weiter() {
  index += 1;
  if (index < spiel.karten.length) zeigeKarte();
  else zeigeEnde();
}

// ---------- Auswertung ----------

function summe(arten) {
  return spiel.karten.filter((k) => arten.includes(k.art)).reduce((s, k) => s + k.ziel_mrd, 0);
}

function zeigeEnde() {
  el("schnell-karte").hidden = true;
  const box = el("schnell-ende");
  box.replaceChildren();
  box.hidden = false;
  const wert = gespart();
  const angenommen = spiel.karten.filter((_, i) => entscheidungen[i]);

  const h2 = document.createElement("h2");
  h2.textContent = t(wert >= spiel.ziel_mrd ? "schnell.ende.erreicht" : "schnell.ende.verfehlt");
  h2.tabIndex = -1;
  const p = document.createElement("p");
  p.className = "ende-summe";
  p.textContent = t("schnell.ende.text", { gespart: mrd(wert), ziel: mrd(spiel.ziel_mrd) });

  // Kennzahlen: weniger Ausgaben, mehr Einnahmen, angenommene Karten
  const ausgaben = angenommen.filter((k) => k.art === "ausgabe").reduce((s, k) => s + k.ziel_mrd, 0);
  const einnahmen = angenommen.filter((k) => k.art === "einnahme").reduce((s, k) => s + k.ziel_mrd, 0);
  const beides = angenommen.filter((k) => k.art === "beides").reduce((s, k) => s + k.ziel_mrd, 0);
  const dl = document.createElement("dl");
  dl.className = "kennzahlen kennzahlen-ende";
  const zahlen = [["schnell.ende.ausgaben", mrd(ausgaben)], ["schnell.ende.einnahmen", mrd(einnahmen)]];
  if (beides) zahlen.push(["schnell.ende.beides", mrd(beides)]);
  zahlen.push(["schnell.ende.angenommen", `${angenommen.length} / ${spiel.karten.length}`]);
  for (const [schluessel, inhalt] of zahlen) {
    const div = document.createElement("div");
    div.innerHTML = "<dt></dt><dd></dd>";
    div.querySelector("dt").textContent = t(schluessel);
    div.querySelector("dd").textContent = inhalt;
    dl.appendChild(div);
  }

  // Von wem stammen die angenommenen Vorschläge? Nur aufzählen, nicht bewerten.
  const von = new Map();
  for (const k of angenommen) for (const f of k.fordernde) von.set(tx(f), (von.get(tx(f)) || 0) + 1);
  const vonTitel = document.createElement("h3");
  vonTitel.textContent = t("schnell.ende.von");
  const vonListe = document.createElement("p");
  vonListe.textContent = von.size
    ? [...von].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], LOCALE)).map(([name, n]) => (n > 1 ? `${name} (${n})` : name)).join(", ")
    : t("schnell.ende.keine");

  // Gut zu wissen: Reicht eine Seite allein?
  const nurAusgaben = summe(["ausgabe", "beides"]);
  const nurEinnahmen = summe(["einnahme", "beides"]);
  const gut = document.createElement("p");
  gut.className = "ergebnis-hinweis";
  gut.textContent = t(nurAusgaben < spiel.ziel_mrd && nurEinnahmen < spiel.ziel_mrd ? "schnell.ende.kombi" : "schnell.ende.alle", {
    alle: mrd(summe(["ausgabe", "einnahme", "beides"])), aus: mrd(nurAusgaben), ein: mrd(nurEinnahmen),
  });

  // Liste der Entscheidungen
  const details = document.createElement("details");
  details.className = "unterthema";
  details.innerHTML = "<summary></summary><ul class=\"ergebnis-liste\"></ul>";
  details.querySelector("summary").textContent = t("schnell.ende.entscheidungen");
  const ul = details.querySelector("ul");
  spiel.karten.forEach((k, i) => {
    const li = document.createElement("li");
    li.innerHTML = "<span></span><strong></strong>";
    li.querySelector("span").textContent = tx(k.titel);
    li.querySelector("strong").textContent = entscheidungen[i] ? `${t("schnell.ja")}: ${mrd(k.ziel_mrd)}` : t("schnell.nein");
    if (entscheidungen[i] && k.ziel_mrd > 0) li.querySelector("strong").className = "plus";
    ul.appendChild(li);
  });

  const hinweis = document.createElement("p");
  hinweis.className = "hinweis";
  hinweis.textContent = t("schnell.ende.hinweis");

  const knoepfe = document.createElement("div");
  knoepfe.className = "hero-knoepfe";
  const nochmal = document.createElement("button");
  nochmal.type = "button";
  nochmal.className = "knopf knopf-gross";
  nochmal.textContent = t("schnell.ende.nochmal");
  nochmal.addEventListener("click", starte);
  const ausfuehrlich = document.createElement("a");
  ausfuehrlich.className = "knopf knopf-gross knopf-rand";
  ausfuehrlich.href = mitSprache("spiel.html");
  ausfuehrlich.textContent = t("schnell.ende.ausfuehrlich");
  knoepfe.append(nochmal, ausfuehrlich);

  box.append(h2, p, dl, vonTitel, vonListe, gut, details, hinweis, knoepfe);
  h2.focus({ preventScroll: true });
  el("ziel-stand").scrollIntoView({ block: "start" });
}

// ---------- Start ----------

function starte() {
  index = 0;
  entscheidungen = [];
  el("schnell-start").hidden = true;
  el("schnell-ende").hidden = true;
  el("ziel-stand").hidden = false;
  zeigeStand();
  zeigeKarte();
}

// Prüft beim Laden, dass jede Karte vollständig ist (Deutsch und Englisch)
function pruefeKarten() {
  const fehler = [];
  for (const k of spiel.karten) {
    for (const feld of ["titel", "text", "betrag", "wer", "braucht"]) {
      if (!k[feld]?.de || !k[feld]?.en) fehler.push(`${k.id}: ${feld}`);
    }
    if (k.aha && (!k.aha.de || !k.aha.en)) fehler.push(`${k.id}: aha`);
    if (!Array.isArray(k.quellen) || k.quellen.length === 0) fehler.push(`${k.id}: quellen`);
    if (typeof k.ziel_mrd !== "number") fehler.push(`${k.id}: ziel_mrd`);
  }
  if (fehler.length) console.error("karten.json unvollständig:", fehler);
}

async function lade() {
  try {
    spiel = await fetch(datei("daten/karten.json")).then((a) => a.json());
  } catch (fehler) {
    el("schnell-einleitung").textContent = t("fehler.laden");
    el("schnell-starten").disabled = true;
    return;
  }
  pruefeKarten();
  el("schnell-einleitung").textContent = t("schnell.einleitung", {
    jahr: spiel.jahr, kredite: mrd(spiel.kredite_mrd), ziel: mrd(spiel.ziel_mrd), n: spiel.karten.length,
  });
  el("schnell-starten").addEventListener("click", starte);
}

lade();
