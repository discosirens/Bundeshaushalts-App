// Suche auf der Startseite: Einzelpläne, Kapitel und Posten (Titel) aus haushalt.json.
// Nutzt Funktionen und Daten aus app.js (daten, waehle, zeigeEbene, ...). Texte aus sprache.js.

// Zusätzliche Suchwörter für Posten, deren amtlicher Name nicht verrät, worum es geht (Deutsch und Englisch)
const SUCHWORTE = {
  "6002/68706": "Ukraine Militärhilfe Waffen Waffenlieferungen Ertüchtigung military aid weapons",
  "1101/68112": "Grundsicherung Grundsicherungsgeld Hartz basic income support citizen's income",
  "1101/63211": "Grundsicherung Miete Wohnkosten Heizung rent heating",
  "6002/68307": "Ökostrom EEG erneuerbare Energien Strompreis renewable energy electricity",
  "6002/68501": "Post Telekom Postbank Pensionen pensions",
  "1102/63681": "Rente Renten pension",
  "1102/63683": "Rente Renten pension",
  "1102/63684": "Rente Kindererziehung pension children",
  "1102/63201": "Grundsicherung Rente pension",
  "1501/63606": "Krankenkasse Krankenversicherung health insurance",
  "1502/85602": "Pflege Pflegeversicherung long-term care",
  "1701/68102": "parental allowance",
  "1701/68113": "child supplement",
  "2501/63201": "housing benefit",
  "2501/88206": "Wohnungsbau Sozialwohnungen social housing",
  "3002/68151": "Studium Studierende student grant",
  "3002/68150": "Schule student grant",
  "1405/55408": "ammunition",
  "3205/57501": "Zinsen Schulden interest debt",
  "6002/97201": "Sparvorgabe Kürzung Minderausgabe savings cut",
  "0501/68732": "humanitäre Hilfe Nothilfe Katastrophenhilfe humanitarian aid",
  "2301/89611": "Entwicklungshilfe Entwicklungszusammenarbeit KfW development aid",
  "2301/89603": "Entwicklungshilfe Entwicklungszusammenarbeit GIZ development aid",
};

// Suchwörter für Einzelpläne (Nummer) und Kapitel (Nummer)
const SUCHWORTE_GRUPPE = {
  "11": "Rente Soziales Arbeitsmarkt pension social",
  "14": "Bundeswehr Militär Streitkräfte armed forces military",
  "32": "Zinsen Schulden interest debt",
  "60": "Finanzen finance",
  "3205": "Zinsen interest",
  "1102": "Rente pension",
  "1101": "Grundsicherungsgeld Bürgergeld Jobcenter basic income support",
  "6093": "Sondervermögen Infrastruktur special fund",
  "6092": "Klimafonds KTF Klimaschutz climate fund",
  "1491": "Sondervermögen special fund",
};

const MAX_TREFFER = 15;
let suchIndex = null;
let laenderDaten = null;   // OECD-Länderdaten, für Länder-Treffer (andere Zahlenart als der Haushalt)

async function ladeLaender() {
  if (laenderDaten) return;
  try {
    laenderDaten = await fetch(datei("daten/laender.json")).then((a) => a.json());
  } catch (fehler) {
    laenderDaten = { laender: [] };
  }
}

function landTreffer(anfrage) {
  if (!laenderDaten) return [];
  const woerter = norm(anfrage).split(/\s+/).filter((w) => w.length >= 2);
  if (woerter.length === 0) return [];
  return laenderDaten.laender.filter((l) => {
    const name = norm(`${l.de} ${l.en}`);
    return woerter.every((w) => name.includes(w));
  }).slice(0, 3);
}

function landKarte(l) {
  const jahr = laenderDaten.letztes_jahr;
  const li = document.createElement("li");
  const a = document.createElement("a");
  a.className = "treffer treffer-land";
  a.href = `${mitSprache("hintergrund.html")}&land=${l.code}#laender`;
  a.innerHTML = `<span class="treffer-text"><strong></strong><small></small></span><span class="treffer-betrag"></span>`;
  a.querySelector("strong").textContent = SPRACHE === "en" ? l.en : l.de;
  a.querySelector("small").textContent = t("suche.land.titel", { jahr });
  a.querySelector(".treffer-betrag").textContent = usd(l.jahre[jahr]?.netto || 0);
  li.appendChild(a);
  return li;
}

function norm(text) {
  return text.toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss");
}

function baueSuchIndex() {
  const index = [];
  for (const ep of daten.einzelplaene) {
    const en = EP_NAMEN_EN[ep.nr] || [];
    index.push({ typ: "ep", ep, name: epName(ep), text: norm([ep.name, ...en, SUCHWORTE_GRUPPE[ep.nr] || ""].join(" ")),
      betrag: ep.soll[HAUPTJAHR] });
    for (const k of ep.kapitel) {
      const kname = anzeigename(k.name.replace(/^Anlage \d+ /, ""));
      index.push({ typ: "kapitel", ep, k, name: SPRACHE === "en" && ANLAGEN_EN[k.nr] ? ANLAGEN_EN[k.nr] : kname,
        text: norm(`${k.name} ${ANLAGEN_EN[k.nr] || ""} ${SUCHWORTE_GRUPPE[k.nr] || ""}`), betrag: k.soll[HAUPTJAHR] });
      for (const ti of k.titel) {
        const extra = SUCHWORTE[`${k.nr}/${ti.nr}`] || "";
        index.push({ typ: "titel", ep, k, ti, name: titelName(k, ti), text: norm(`${ti.name} ${extra}`), betrag: ti.soll[HAUPTJAHR] });
      }
    }
  }
  return index;
}

const TYP_RANG = { ep: 0, kapitel: 1, titel: 2 };

function suche(anfrage) {
  const woerter = norm(anfrage).split(/\s+/).filter((w) => w.length >= 2);
  if (woerter.length === 0) return null;
  if (!suchIndex) suchIndex = baueSuchIndex();
  return suchIndex
    .filter((e) => woerter.every((w) => e.text.includes(w)))
    .sort((a, b) => TYP_RANG[a.typ] - TYP_RANG[b.typ] || Math.abs(b.betrag || 0) - Math.abs(a.betrag || 0));
}

function pfadText(e) {
  const teile = [t("suche.ep", { nr: e.ep.nr })];
  if (e.k) teile.push(t("suche.kapitel", { nr: e.k.nr }));
  if (e.ti) teile.push(t("suche.titel", { nr: `${e.ti.nr.slice(0, 3)} ${e.ti.nr.slice(3)}` }));
  let text = teile.join(" · ");
  if (e.k && e.k.anlage) text += ` · ${t("suche.anlage")}`;
  return text;
}

function zeigeTreffer(anfrage) {
  const liste = el("suche-ergebnisse");
  const info = el("suche-info");
  liste.replaceChildren();
  const treffer = suche(anfrage);
  if (treffer === null) {
    info.textContent = SPRACHE === "en" ? t("suche.hinweis.en") : "";
    return;
  }
  const laenderTreffer = landTreffer(anfrage);
  for (const l of laenderTreffer) liste.appendChild(landKarte(l));
  if (treffer.length === 0) {
    info.textContent = laenderTreffer.length ? t("suche.land.info") : t("suche.keine");
    return;
  }
  info.textContent = treffer.length > MAX_TREFFER
    ? t("suche.mehr", { n: treffer.length, m: MAX_TREFFER })
    : t(treffer.length === 1 ? "suche.anzahl.eins" : "suche.anzahl", { n: treffer.length });
  for (const e of treffer.slice(0, MAX_TREFFER)) {
    const li = document.createElement("li");
    const b = document.createElement("button");
    b.type = "button";
    b.className = "treffer";
    b.innerHTML = `<span class="treffer-text"><strong></strong><small></small></span><span class="treffer-betrag"></span>`;
    b.querySelector("strong").textContent = e.name;
    b.querySelector("small").textContent = pfadText(e);
    b.querySelector(".treffer-betrag").textContent = e.betrag ? euro(e.betrag) : "0 €";
    b.addEventListener("click", () => oeffneTreffer(e));
    li.appendChild(b);
    liste.appendChild(li);
  }
}

// Treffer in der Treemap öffnen: Einzelplan, Kapitel oder Kapitel des Postens mit Markierung
function oeffneTreffer(e) {
  el("suche-ergebnisse").replaceChildren();
  el("suche-info").textContent = "";
  if (e.typ === "ep") {
    waehle(einzelplanEintraege().find((x) => x.nr === e.ep.nr));
    return;
  }
  aktuellerEp = e.ep;
  weitereStapel = [];
  ausgewaehlt = null;
  el("details").hidden = true;
  zeigeEbene();

  let kasten;
  if (e.k.anlage) {
    kasten = el("anlagen");
  } else {
    waehle(kapitelEintraege(e.ep).find((x) => x.nr === e.k.nr));
    kasten = el("details");
  }
  if (e.ti) {
    const p = document.createElement("p");
    p.className = "suchtreffer";
    p.textContent = t("suche.markiert", { name: e.name, betrag: euro(e.betrag || 0) });
    kasten.prepend(p);
  }
  kasten.scrollIntoView({ behavior: "smooth", block: "start" });
}

function starteSuche() {
  const feld = el("suchfeld");
  let zeitgeber = null;
  feld.addEventListener("input", () => {
    clearTimeout(zeitgeber);
    zeitgeber = setTimeout(() => zeigeTreffer(feld.value), 150);
  });
  feld.addEventListener("keydown", (ereignis) => {
    if (ereignis.key === "Enter") {
      const erster = el("suche-ergebnisse").querySelector("button");
      if (erster) erster.click();
    }
  });
  if (SPRACHE === "en") el("suche-info").textContent = t("suche.hinweis.en");
  ladeLaender();
}
