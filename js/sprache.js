// Zweisprachigkeit: alle Texte der Oberfläche auf Deutsch (du) und Englisch, dazu Zahlenformate.
// Sprache kommt aus ?lang=de|en, sonst aus der letzten Wahl, sonst Deutsch.
// Statische Texte im HTML tragen data-t="schluessel" (Text) oder data-t-html="schluessel" (mit Links).

const SPRACHEN = ["de", "en"];

const SPRACHE = (() => {
  const ausAdresse = new URLSearchParams(location.search).get("lang");
  if (SPRACHEN.includes(ausAdresse)) {
    try { localStorage.setItem("sprache", ausAdresse); } catch (fehler) { /* Speicher gesperrt */ }
    return ausAdresse;
  }
  try {
    const gespeichert = localStorage.getItem("sprache");
    if (SPRACHEN.includes(gespeichert)) return gespeichert;
  } catch (fehler) { /* Speicher gesperrt */ }
  return "de";
})();

const TEXTE = {
  de: {
    "marke": "Bundeshaushalt <span>verständlich</span>",
    "nav.ueberblick": "Überblick",
    "nav.verteilen": "Selbst verteilen",
    "nav.sprache": "Sprache",

    "index.titel": "Bundeshaushalt verständlich",
    "index.beschreibung": "Wofür gibt der Bund sein Geld aus? Der Bundeshaushalt 2026 einfach erklärt.",
    "hero.dachzeile": "Bundeshaushalt 2026",
    "hero.vor": "Der Bund darf 2026",
    "hero.nach": "ausgeben.",
    "hero.unter": "Soll laut Haushaltsplan, Kernhaushalt. Wofür? Das zeigt dir diese Seite.",
    "hero.knopf.ansehen": "Ausgaben ansehen ↓",
    "hero.knopf.verteilen": "Selbst verteilen →",
    "fakten.label": "Zahlen zum Haushalt 2026",
    "fakt.kopf.text": "pro Einwohnerin und Einwohner",
    "fakt.kopf.quelle": "Soll 2026 geteilt durch 83,5 Mio. Einwohner",
    "fakt.sekunde.text": "gibt der Bund im Schnitt pro Sekunde aus",
    "fakt.sekunde.quelle": "Soll 2026 geteilt durch die Sekunden eines Jahres",
    "fakt.anteil.text": "gehen an {name}",
    "fakt.anteil.quelle": "Einzelplan {nr}, Soll 2026",

    "treemap.titel": "Wofür gibt der Bund Geld aus?",
    "treemap.hinweis": "Jede Fläche ist so groß wie die Ausgaben eines Einzelplans (meist ein Ministerium). Tipp auf ein Feld für Details und Kapitel.",
    "treemap.hinweis.ep": "Die Flächen zeigen die Kapitel dieses Einzelplans. Tipp auf ein Kapitel für Details.",
    "treemap.zurueck": "← Alle Einzelpläne",
    "treemap.label": "Ausgaben als Flächen",
    "treemap.legende": "Soll 2026 in Mrd. €. Farben unterscheiden die Einzelpläne, sie bewerten nichts.",
    "treemap.feld.label": "{name}: {betrag}, Soll 2026",

    "details.einzelplan": "Einzelplan {nr}",
    "details.kapitel": "Kapitel {nr}",
    "details.soll26": "Soll 2026",
    "details.soll25": "Soll 2025",
    "details.veraenderung": "Veränderung",
    "details.anteil": "Anteil am Kernhaushalt 2026",
    "details.fehlt": "nicht vorhanden",
    "veraenderung.neu": "neu in 2026",
    "veraenderung.gleich": "unverändert",
    "tabelle.neu": "neu",

    "anlagen.titel": "Nicht im Kernhaushalt enthalten",
    "anlagen.text": "Zu diesem Einzelplan gehören Anlagen mit eigenem Wirtschaftsplan, zum Beispiel Sondervermögen. Sie werden getrennt geführt (Soll 2026):",
    "anlagen.summe": "Kernhaushalt dieses Einzelplans und Anlagen zusammen: <strong>{betrag}</strong> (Soll 2026). Achtung: Fließt Geld aus dem Kernhaushalt in eine Anlage, ist dieser Betrag in der Summe doppelt enthalten.",

    "tabelle.zusammenfassung": "Alle Werte als Tabelle",
    "tabelle.name": "Name",
    "tabelle.hinweis": "{n} Einträge haben 2026 einen Betrag von null oder darunter und erscheinen deshalb nicht als Fläche. Negative Beträge sind meist pauschale Einsparvorgaben.",

    "aufruf.etikett": "Mitmachen",
    "aufruf.titel": "Wie würdest du das Geld verteilen?",
    "aufruf.text": "Schieb Milliarden zwischen 14 Bereichen hin und her und finde heraus, was gesetzlich festgelegt ist.",
    "aufruf.knopf": "Jetzt ausprobieren →",

    "quellen.titel": "Quellen",
    "quellen.ausgaben": "Ausgaben: Bundeshaushaltsplan 2025 und 2026, Soll-Werte (vom Bundestag beschlossene Beträge), Bundesministerium der Finanzen, <a href=\"https://www.bundeshaushalt.de/\">bundeshaushalt.de</a>.",
    "quellen.einwohner": "Einwohnerzahl: 83,5 Millionen zum 31.12.2025, Statistisches Bundesamt, <a href=\"https://www.destatis.de/DE/Presse/Pressemitteilungen/2026/06/PD26_203_124.html\">Pressemitteilung Nr. 203 vom 16. Juni 2026</a>.",
    "quellen.berechnung": "Beträge pro Kopf und pro Sekunde: eigene Berechnung aus diesen Quellen.",
    "quellen.kern": "Alle Beträge betreffen den Kernhaushalt. Sondervermögen und andere Anlagen zum Haushaltsplan sind nicht enthalten und werden gesondert gezeigt.",
    "fehler.laden": "Die Daten konnten nicht geladen werden.",

    "um.titel": "Haushalt umschichten",
    "um.beschreibung": "Wie würdest du den Bundeshaushalt 2026 verteilen? Geld zwischen 14 Bereichen verschieben.",
    "um.dachzeile": "Mitmachen · Bundeshaushalt 2026",
    "um.ueberschrift": "Wie würdest du das Geld verteilen?",
    "um.einleitung": "Ausgangspunkt sind die Ausgaben des Bundes 2026 in 14 Bereichen (Soll, Kernhaushalt ohne Sondervermögen). Verschieb Geld zwischen den Bereichen. Bei gebundenen Ausgaben siehst du, was eine Änderung voraussetzen würde.",
    "um.schritt1": "Aufgabe wählen",
    "um.aufgabe.label": "Aufgabe",
    "um.schritt2": "Geld verschieben",
    "um.schritt2.hinweis": "Mit − und + änderst du einen Bereich um 1 Mrd. €, mit dem Regler in Schritten von 0,1 Mrd. €.",
    "um.schritt3": "Dein Ergebnis",
    "um.zuruecksetzen": "Zurücksetzen",
    "um.quellen.titel": "Quellen und Hinweise",
    "um.quellen.werte": "Ausgangswerte: Bundeshaushaltsplan 2026, Soll-Werte, Bundesministerium der Finanzen, <a href=\"https://www.bundeshaushalt.de/\">bundeshaushalt.de</a>. Zuordnung zu Bereichen nach dem Funktionenplan des Bundes.",
    "um.quellen.bindung": "Einstufung der Bindung: eigene Bewertung auf Grundlage der genannten Gesetze, siehe „Mehr erfahren“ bei jedem Bereich.",
    "um.quellen.modell": "Vereinfachung: Dieses Modell verschiebt nur Ausgaben. Einnahmen, Kredite und Sondervermögen bleiben unverändert.",

    "sz.frei.titel": "Frei umschichten",
    "sz.frei.text": "Verteil die Ausgaben 2026 neu. Die Gesamtsumme bleibt gleich: Was ein Bereich mehr bekommt, muss ein anderer weniger bekommen.",
    "sz.verteidigung.titel": "Verteidigung plus 10 Mrd. €",
    "sz.verteidigung.text": "Angenommen, für Verteidigung sollen 10 Mrd. € mehr bereitstehen und die Gesamtsumme bleibt gleich. Wo würdest du 10 Mrd. € einsparen?",
    "sz.bildung.titel": "Bildung und Forschung plus 5 Mrd. €",
    "sz.bildung.text": "Angenommen, für Bildung, Forschung und Kultur sollen 5 Mrd. € mehr bereitstehen und die Gesamtsumme bleibt gleich. Wo würdest du 5 Mrd. € einsparen?",
    "sz.zinsen.titel": "Zinsen steigen um 5 Mrd. €",
    "sz.zinsen.text": "Angenommen, die Zinsen für die Schulden des Bundes steigen um 5 Mrd. €. Dieses Geld muss gezahlt werden. Wo würdest du 5 Mrd. € einsparen?",
    "sz.sparen.titel": "10 Mrd. € weniger ausgeben",
    "sz.sparen.text": "Angenommen, der Bund soll 2026 insgesamt 10 Mrd. € weniger ausgeben als geplant. In welchen Bereichen würdest du kürzen?",

    "bindung.gesetzlich gebunden": "gesetzlich gebunden",
    "bindung.teilweise gebunden": "teilweise gebunden",
    "bindung.politisch frei gestaltbar": "politisch frei gestaltbar",
    "bindung.hinweis.gesetzlich gebunden": "Gesetzlich gebunden: Eine Änderung wäre nur mit einer Gesetzesänderung möglich.",
    "bindung.hinweis.teilweise gebunden": "Teilweise gebunden: Ein Teil ist gesetzlich oder vertraglich festgelegt.",
    "bindung.hinweis.politisch frei gestaltbar": "Politisch frei gestaltbar: Die Höhe legen Regierung und Bundestag im Haushalt fest.",

    "karte.soll": "Soll 2026: {betrag} ({anteil})",
    "karte.unveraendert": "unverändert",
    "karte.plan": "Dein Plan: {wert} ({diff}, {prozent})",
    "karte.fest": "Durch die Aufgabe festgelegt: {diff}.",
    "karte.minus": "1 Mrd. € weniger",
    "karte.plus": "1 Mrd. € mehr",
    "karte.regler": "{name}: Änderung gegenüber Soll 2026",
    "karte.mehr": "Mehr erfahren",
    "erkl.was": "Was ist das?",
    "erkl.wer": "Wer bekommt das Geld?",
    "erkl.posten": "Größte Posten (Soll 2026)",
    "erkl.warum": "Warum so viel?",
    "erkl.gut": "Gut zu wissen",
    "erkl.bindung": "Bindung",
    "erkl.schuldenbremse": "Schuldenbremse",
    "erkl.schuldenbremse.text": "{betrag} dieses Bereichs zählen 2026 zur Bereichsausnahme der Schuldenbremse. Von der Schuldenbremse ausgenommen ist aber nur der Teil dieser Ausgaben, der insgesamt über 1 % der Wirtschaftsleistung liegt.",
    "erkl.quellen": "Quellen",
    "erkl.quelle": "Quelle",

    "bilanz.nichts": "Noch nichts verschoben. Gesamtsumme: {summe}",
    "bilanz.aus": "Ausgeglichen: Dein Plan erfüllt die Aufgabe.",
    "bilanz.zuviel": "Noch {betrag} einsparen",
    "bilanz.zuwenig": "Noch {betrag} übrig zum Verteilen",
    "ergebnis.summe": "Ausgaben laut deinem Plan: {plan}. Soll 2026: {soll}.",
    "ergebnis.leer": "Du hast noch nichts verändert.",
    "ergebnis.gesetzlich.eins": "Du hast einen gesetzlich gebundenen Bereich verändert ({namen}). Dafür wären Gesetzesänderungen nötig.",
    "ergebnis.gesetzlich.mehr": "Du hast {n} gesetzlich gebundene Bereiche verändert ({namen}). Dafür wären Gesetzesänderungen nötig.",
    "ergebnis.ausnahme": "Für Verteidigung und Militärhilfe gilt die Bereichsausnahme der Schuldenbremse: Ausgaben über 1 % der Wirtschaftsleistung dürfen mit Krediten bezahlt werden. Dieses Modell verschiebt trotzdem nur Ausgaben innerhalb der Gesamtsumme.",
  },

  en: {
    "marke": "Federal Budget <span>explained</span>",
    "nav.ueberblick": "Overview",
    "nav.verteilen": "Try it yourself",
    "nav.sprache": "Language",

    "index.titel": "German Federal Budget Explained",
    "index.beschreibung": "What does Germany's federal government spend its money on? The 2026 federal budget explained simply.",
    "hero.dachzeile": "German federal budget 2026",
    "hero.vor": "In 2026, the federal government may spend",
    "hero.nach": "in total.",
    "hero.unter": "Budgeted amount (Soll) in the core budget. What is it spent on? This page shows you.",
    "hero.knopf.ansehen": "See the spending ↓",
    "hero.knopf.verteilen": "Try it yourself →",
    "fakten.label": "Figures on the 2026 budget",
    "fakt.kopf.text": "per inhabitant",
    "fakt.kopf.quelle": "2026 budget divided by 83.5 million inhabitants",
    "fakt.sekunde.text": "spent by the federal government per second on average",
    "fakt.sekunde.quelle": "2026 budget divided by the seconds in a year",
    "fakt.anteil.text": "goes to {name}",
    "fakt.anteil.quelle": "Budget section {nr}, 2026 budget",

    "treemap.titel": "What does the federal government spend money on?",
    "treemap.hinweis": "Each tile is sized by the spending of one budget section (usually a ministry). Tap a tile for details and chapters.",
    "treemap.hinweis.ep": "The tiles show the chapters of this budget section. Tap a chapter for details. Chapter names are shown in the official German wording.",
    "treemap.zurueck": "← All budget sections",
    "treemap.label": "Spending shown as tiles",
    "treemap.legende": "2026 budget in € billion. Colours only tell budget sections apart; they carry no judgement.",
    "treemap.feld.label": "{name}: {betrag}, 2026 budget",

    "details.einzelplan": "Budget section {nr}",
    "details.kapitel": "Chapter {nr}",
    "details.soll26": "Budget 2026",
    "details.soll25": "Budget 2025",
    "details.veraenderung": "Change",
    "details.anteil": "Share of core budget 2026",
    "details.fehlt": "not in budget",
    "veraenderung.neu": "new in 2026",
    "veraenderung.gleich": "unchanged",
    "tabelle.neu": "new",

    "anlagen.titel": "Not included in the core budget",
    "anlagen.text": "This budget section has annexes with their own financial plans, for example special funds. They are kept separate (2026 budget):",
    "anlagen.summe": "Core budget of this section and annexes together: <strong>{betrag}</strong> (2026 budget). Note: if money flows from the core budget into an annex, that amount is counted twice in this total.",

    "tabelle.zusammenfassung": "All values as a table",
    "tabelle.name": "Name",
    "tabelle.hinweis": "{n} entries have an amount of zero or less in 2026 and therefore do not appear as tiles. Negative amounts are mostly lump-sum savings targets.",

    "aufruf.etikett": "Get involved",
    "aufruf.titel": "How would you split the money?",
    "aufruf.text": "Move billions between 14 areas and find out what is fixed by law.",
    "aufruf.knopf": "Try it now →",

    "quellen.titel": "Sources",
    "quellen.ausgaben": "Spending: Federal budget plans 2025 and 2026, budgeted amounts (Soll, approved by the Bundestag), Federal Ministry of Finance, <a href=\"https://www.bundeshaushalt.de/\">bundeshaushalt.de</a> (in German).",
    "quellen.einwohner": "Population: 83.5 million on 31 Dec 2025, Federal Statistical Office, <a href=\"https://www.destatis.de/DE/Presse/Pressemitteilungen/2026/06/PD26_203_124.html\">press release no. 203 of 16 June 2026</a> (in German).",
    "quellen.berechnung": "Amounts per person and per second: own calculation from these sources.",
    "quellen.kern": "All amounts refer to the core budget. Special funds and other annexes to the budget are not included and are shown separately.",
    "fehler.laden": "The data could not be loaded.",

    "um.titel": "Rebalance the budget",
    "um.beschreibung": "How would you split Germany's 2026 federal budget? Move money between 14 areas.",
    "um.dachzeile": "Get involved · Federal budget 2026",
    "um.ueberschrift": "How would you split the money?",
    "um.einleitung": "The starting point is federal spending in 2026 in 14 areas (budgeted amounts, core budget without special funds). Move money between the areas. For fixed spending, you will see what a change would require.",
    "um.schritt1": "Choose a task",
    "um.aufgabe.label": "Task",
    "um.schritt2": "Move money",
    "um.schritt2.hinweis": "Use − and + to change an area by €1bn, or the slider in steps of €0.1bn.",
    "um.schritt3": "Your result",
    "um.zuruecksetzen": "Reset",
    "um.quellen.titel": "Sources and notes",
    "um.quellen.werte": "Starting values: Federal budget plan 2026, budgeted amounts, Federal Ministry of Finance, <a href=\"https://www.bundeshaushalt.de/\">bundeshaushalt.de</a> (in German). Areas are based on the federal functional classification (Funktionenplan).",
    "um.quellen.bindung": "How fixed spending is: our own assessment based on the laws cited, see “Learn more” for each area.",
    "um.quellen.modell": "Simplification: this model only moves spending. Revenue, borrowing and special funds stay unchanged.",

    "sz.frei.titel": "Rebalance freely",
    "sz.frei.text": "Redistribute 2026 spending. The total stays the same: whatever one area gains, another has to lose.",
    "sz.verteidigung.titel": "Defence plus €10bn",
    "sz.verteidigung.text": "Suppose defence is to get €10bn more and the total stays the same. Where would you save €10bn?",
    "sz.bildung.titel": "Education and research plus €5bn",
    "sz.bildung.text": "Suppose education, research and culture are to get €5bn more and the total stays the same. Where would you save €5bn?",
    "sz.zinsen.titel": "Interest rises by €5bn",
    "sz.zinsen.text": "Suppose interest on federal debt rises by €5bn. This money has to be paid. Where would you save €5bn?",
    "sz.sparen.titel": "Spend €10bn less",
    "sz.sparen.text": "Suppose the federal government has to spend €10bn less in 2026 than planned. Which areas would you cut?",

    "bindung.gesetzlich gebunden": "fixed by law",
    "bindung.teilweise gebunden": "partly fixed",
    "bindung.politisch frei gestaltbar": "politically flexible",
    "bindung.hinweis.gesetzlich gebunden": "Fixed by law: a change would require changing the law.",
    "bindung.hinweis.teilweise gebunden": "Partly fixed: part of it is set by law or by contracts.",
    "bindung.hinweis.politisch frei gestaltbar": "Politically flexible: the government and the Bundestag set the amount in the budget.",

    "karte.soll": "Budget 2026: {betrag} ({anteil})",
    "karte.unveraendert": "unchanged",
    "karte.plan": "Your plan: {wert} ({diff}, {prozent})",
    "karte.fest": "Set by the task: {diff}.",
    "karte.minus": "€1bn less",
    "karte.plus": "€1bn more",
    "karte.regler": "{name}: change from 2026 budget",
    "karte.mehr": "Learn more",
    "erkl.was": "What is it?",
    "erkl.wer": "Who gets the money?",
    "erkl.posten": "Largest items (2026 budget)",
    "erkl.warum": "Why so much?",
    "erkl.gut": "Good to know",
    "erkl.bindung": "How fixed is it?",
    "erkl.schuldenbremse": "Debt brake",
    "erkl.schuldenbremse.text": "{betrag} of this area falls under the debt brake exemption in 2026. However, only the part of this spending that exceeds 1% of economic output in total is exempt from the debt brake.",
    "erkl.quellen": "Sources (in German)",
    "erkl.quelle": "Source",

    "bilanz.nichts": "Nothing moved yet. Total: {summe}",
    "bilanz.aus": "Balanced: your plan solves the task.",
    "bilanz.zuviel": "Still {betrag} to save",
    "bilanz.zuwenig": "{betrag} left to distribute",
    "ergebnis.summe": "Spending in your plan: {plan}. 2026 budget: {soll}.",
    "ergebnis.leer": "You have not changed anything yet.",
    "ergebnis.gesetzlich.eins": "You changed one area that is fixed by law ({namen}). This would require changing the law.",
    "ergebnis.gesetzlich.mehr": "You changed {n} areas that are fixed by law ({namen}). This would require changing the law.",
    "ergebnis.ausnahme": "Defence and military aid fall under the debt brake exemption: spending above 1% of economic output may be financed by borrowing. This model nevertheless only moves spending within the total.",
  },
};

// Englische Namen der Einzelpläne: [voller Name, Kurzname]
const EP_NAMEN_EN = {
  "01": ["Federal President and Office of the Federal President", "Federal President"],
  "02": ["German Bundestag", "Bundestag"],
  "03": ["Bundesrat", "Bundesrat"],
  "04": ["Federal Chancellor and Federal Chancellery", "Chancellery"],
  "05": ["Federal Foreign Office", "Foreign Office"],
  "06": ["Federal Ministry of the Interior", "Interior"],
  "07": ["Federal Ministry of Justice and Consumer Protection", "Justice"],
  "08": ["Federal Ministry of Finance", "Finance"],
  "09": ["Federal Ministry for Economic Affairs and Energy", "Economy and Energy"],
  "10": ["Federal Ministry of Agriculture, Food and Regional Identity", "Agriculture and Food"],
  "11": ["Federal Ministry of Labour and Social Affairs", "Labour and Social Affairs"],
  "12": ["Federal Ministry of Transport", "Transport"],
  "14": ["Federal Ministry of Defence", "Defence"],
  "15": ["Federal Ministry of Health", "Health"],
  "16": ["Federal Ministry for the Environment, Climate Action, Nature Conservation and Nuclear Safety", "Environment"],
  "17": ["Federal Ministry of Education, Family Affairs, Senior Citizens, Women and Youth", "Education and Family"],
  "19": ["Federal Constitutional Court", "Constitutional Court"],
  "20": ["Federal Court of Audit", "Court of Audit"],
  "21": ["Federal Commissioner for Data Protection and Freedom of Information", "Data Protection"],
  "22": ["Independent Oversight Council", "Oversight Council"],
  "23": ["Federal Ministry for Economic Cooperation and Development", "Development"],
  "24": ["Federal Ministry for Digital Transformation and Government Modernisation", "Digital and Modernisation"],
  "25": ["Federal Ministry for Housing, Urban Development and Building", "Housing and Building"],
  "30": ["Federal Ministry of Research, Technology and Space", "Research and Technology"],
  "32": ["Federal debt", "Federal debt"],
  "60": ["General financial administration", "General finance"],
};

// Englische Namen der Anlagen (Sondervermögen u. a.) nach Kapitelnummer
const ANLAGEN_EN = {
  "1090": "EU agricultural market measures (Annex E)",
  "1091": "Administrative budget of the Federal Institute for Risk Assessment (BfR)",
  "1092": "Administrative budget of the Federal Office for Agriculture and Food (BLE)",
  "1490": "NATO Security Investment Programme in Germany (Annex N)",
  "1491": "Bundeswehr special fund",
  "6090": "EU own resources (Annex E)",
  "6092": "Climate and Transformation Fund",
  "6093": "Special fund for infrastructure and climate neutrality",
  "6098": "Special fund Reconstruction Aid 2021",
};

function t(schluessel, werte = {}) {
  let text = TEXTE[SPRACHE][schluessel] ?? TEXTE.de[schluessel] ?? schluessel;
  for (const [name, wert] of Object.entries(werte)) text = text.replaceAll(`{${name}}`, wert);
  return text;
}

// ---------- Zahlen ----------

const LOCALE = SPRACHE === "en" ? "en-GB" : "de-DE";

function zahl(n, stellen) {
  return n.toLocaleString(LOCALE, { minimumFractionDigits: stellen, maximumFractionDigits: stellen });
}

// Betrag aus Tausend Euro: "524,5 Mrd. €" bzw. "€524.5bn"
function euro(tausend, mitVorzeichen = false) {
  const e = tausend * 1000;
  const a = Math.abs(e);
  const zeichen = mitVorzeichen && e > 0 ? "+" : e < 0 ? "−" : "";
  let betrag;
  if (SPRACHE === "en") {
    if (a >= 1e9) betrag = `€${zahl(a / 1e9, 1)}bn`;
    else if (a >= 1e6) betrag = `€${zahl(a / 1e6, 1)}m`;
    else betrag = `€${zahl(Math.round(a), 0)}`;
  } else {
    if (a >= 1e9) betrag = `${zahl(a / 1e9, 1)} Mrd. €`;
    else if (a >= 1e6) betrag = `${zahl(a / 1e6, 1)} Mio. €`;
    else betrag = `${zahl(Math.round(a), 0)} €`;
  }
  return zeichen + betrag;
}

// Immer in Milliarden, für den Umschicht-Modus
function milliarden(tausend, mitVorzeichen = false) {
  const n = tausend / 1e6;
  const zeichen = mitVorzeichen && n > 0.0001 ? "+" : n < -0.0001 ? "−" : "";
  return SPRACHE === "en" ? `${zeichen}€${zahl(Math.abs(n), 1)}bn` : `${zeichen}${zahl(Math.abs(n), 1)} Mrd. €`;
}

function prozent(anteil, mitVorzeichen = false) {
  const p = anteil * 100;
  const zeichen = mitVorzeichen && p > 0.005 ? "+" : p < -0.005 ? "−" : "";
  const stellen = Math.abs(p) < 1 ? 2 : 1;
  return `${zeichen}${zahl(Math.abs(p), stellen)}${SPRACHE === "en" ? "%" : " %"}`;
}

function geldbetrag(euroGanz) {
  return SPRACHE === "en" ? `€${zahl(euroGanz, 0)}` : `${zahl(euroGanz, 0)} €`;
}

// ---------- Seite einrichten ----------

// Interne Links behalten die gewählte Sprache.
function mitSprache(href) {
  const url = new URL(href, location.href);
  url.searchParams.set("lang", SPRACHE);
  return url.pathname.split("/").pop() + url.search + url.hash;
}

function wendeTexteAn() {
  document.documentElement.lang = SPRACHE;
  for (const knoten of document.querySelectorAll("[data-t]")) knoten.textContent = t(knoten.dataset.t);
  for (const knoten of document.querySelectorAll("[data-t-html]")) knoten.innerHTML = t(knoten.dataset.tHtml);
  for (const knoten of document.querySelectorAll("[data-t-label]")) knoten.setAttribute("aria-label", t(knoten.dataset.tLabel));
  const seite = document.body.dataset.seite;
  document.title = t(`${seite}.titel`);
  document.querySelector('meta[name="description"]')?.setAttribute("content", t(`${seite}.beschreibung`));
  for (const a of document.querySelectorAll("a[data-intern]")) a.setAttribute("href", mitSprache(a.getAttribute("href")));
  for (const a of document.querySelectorAll("a[data-lang]")) {
    const url = new URL(location.href);
    url.searchParams.set("lang", a.dataset.lang);
    url.hash = "";
    a.href = url.pathname.split("/").pop() + url.search;
    if (a.dataset.lang === SPRACHE) a.setAttribute("aria-current", "true");
  }
}

wendeTexteAn();
