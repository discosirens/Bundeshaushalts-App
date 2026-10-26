// Umschicht-Modus: Geld zwischen den 14 Bereichen aus daten/bereiche.json verschieben.
// Alle Beträge intern in Tausend Euro, wie in den Daten.

const MRD = 1_000_000;          // 1 Mrd. € in Tausend Euro
const SCHRITT = 100_000;        // Reglerschritt: 0,1 Mrd. €
const TOLERANZ = 50_000;        // unter 0,05 Mrd. € gilt als ausgeglichen

// Aufgaben geben nur eine Annahme vor. Wie sie gelöst wird, entscheidet die Nutzerin oder der Nutzer.
const SZENARIEN = [
  {
    id: "frei",
    titel: "Frei umschichten",
    text: "Verteilen Sie die Ausgaben 2026 neu. Die Gesamtsumme bleibt gleich: Was ein Bereich mehr bekommt, muss ein anderer weniger bekommen.",
    fest: {},
    zielaenderung: 0,
  },
  {
    id: "verteidigung",
    titel: "Verteidigung plus 10 Mrd. €",
    text: "Angenommen, für Verteidigung sollen 10 Mrd. € mehr bereitstehen und die Gesamtsumme bleibt gleich. Wo würden Sie 10 Mrd. € einsparen?",
    fest: { verteidigung: 10 * MRD },
    zielaenderung: 0,
  },
  {
    id: "bildung",
    titel: "Bildung und Forschung plus 5 Mrd. €",
    text: "Angenommen, für Bildung, Forschung und Kultur sollen 5 Mrd. € mehr bereitstehen und die Gesamtsumme bleibt gleich. Wo würden Sie 5 Mrd. € einsparen?",
    fest: { bildung: 5 * MRD },
    zielaenderung: 0,
  },
  {
    id: "zinsen",
    titel: "Zinsen steigen um 5 Mrd. €",
    text: "Angenommen, die Zinsen für die Schulden des Bundes steigen um 5 Mrd. €. Dieses Geld muss gezahlt werden. Wo würden Sie 5 Mrd. € einsparen?",
    fest: { zinsen: 5 * MRD },
    zielaenderung: 0,
  },
  {
    id: "sparen",
    titel: "10 Mrd. € weniger ausgeben",
    text: "Angenommen, der Bund soll 2026 insgesamt 10 Mrd. € weniger ausgeben als geplant. In welchen Bereichen würden Sie kürzen?",
    fest: {},
    zielaenderung: -10 * MRD,
  },
];

const BINDUNG_HINWEIS = {
  "gesetzlich gebunden": "Gesetzlich gebunden: Eine Änderung wäre nur mit einer Gesetzesänderung möglich.",
  "teilweise gebunden": "Teilweise gebunden: Ein Teil ist gesetzlich oder vertraglich festgelegt.",
  "politisch frei gestaltbar": "Politisch frei gestaltbar: Die Höhe legen Regierung und Bundestag im Haushalt fest.",
};

let daten = null;
let szenario = SZENARIEN[0];
const werte = {};     // aktueller Plan je Bereich (Tausend Euro)
const karten = {};    // DOM-Elemente je Bereich

const el = (id) => document.getElementById(id);

// ---------- Formatierung ----------

function mrd(tausend, mitVorzeichen = false) {
  const n = tausend / MRD;
  const zeichen = mitVorzeichen && n > 0.0001 ? "+" : n < -0.0001 ? "−" : "";
  return `${zeichen}${Math.abs(n).toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} Mrd. €`;
}

function prozent(anteil, mitVorzeichen = false) {
  const p = anteil * 100;
  const zeichen = mitVorzeichen && p > 0.05 ? "+" : p < -0.05 ? "−" : "";
  return `${zeichen}${Math.abs(p).toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`;
}

// ---------- Berechnung ----------

const basis = (b) => b.betrag_2026;
const aenderung = (b) => werte[b.id] - basis(b);
const zielSumme = () => daten.summe_2026 + szenario.zielaenderung;
const planSumme = () => daten.bereiche.reduce((s, b) => s + werte[b.id], 0);

function setzeWert(b, wert) {
  if (b.id in szenario.fest) return;
  werte[b.id] = Math.max(0, Math.min(2 * basis(b), wert));
  aktualisiere();
}

// ---------- Aufbau ----------

function baueSzenarien() {
  const box = el("szenarien");
  for (const s of SZENARIEN) {
    const knopf = document.createElement("button");
    knopf.type = "button";
    knopf.className = "szenario";
    knopf.setAttribute("role", "radio");
    knopf.dataset.id = s.id;
    knopf.textContent = s.titel;
    knopf.addEventListener("click", () => waehleSzenario(s));
    box.appendChild(knopf);
  }
}

function baueBereiche() {
  const liste = el("bereiche");
  for (const b of daten.bereiche) {
    const karte = document.createElement("article");
    karte.className = "bereich-karte";
    karte.innerHTML = `
      <div class="karte-kopf">
        <h3></h3>
        <span class="bindung"></span>
      </div>
      <p class="karte-werte">
        <span class="soll"></span>
        <span class="plan"></span>
      </p>
      <div class="regler">
        <button type="button" class="knopf-rund minus" aria-label="1 Mrd. € weniger">−</button>
        <input type="range" step="${SCHRITT}">
        <button type="button" class="knopf-rund plus" aria-label="1 Mrd. € mehr">+</button>
      </div>
      <p class="karte-hinweis" hidden></p>
      <details class="mehr">
        <summary>Mehr erfahren</summary>
        <div class="mehr-inhalt"></div>
      </details>`;
    karte.querySelector("h3").textContent = b.name;
    karte.querySelector(".bindung").textContent = b.bindung;
    karte.querySelector(".soll").textContent = `Soll 2026: ${mrd(basis(b))} (${prozent(b.anteil_2026)})`;

    const regler = karte.querySelector("input");
    // Der Regler bildet die Änderung ab, damit die Schritte genau 0,1 Mrd. € sind.
    regler.min = -basis(b);
    regler.max = basis(b);
    regler.setAttribute("aria-label", `${b.name}: Änderung gegenüber Soll 2026`);
    regler.addEventListener("input", () => setzeWert(b, basis(b) + Number(regler.value)));
    karte.querySelector(".minus").addEventListener("click", () => setzeWert(b, werte[b.id] - MRD));
    karte.querySelector(".plus").addEventListener("click", () => setzeWert(b, werte[b.id] + MRD));

    fuelleErklaerung(karte.querySelector(".mehr-inhalt"), b);
    karten[b.id] = karte;
    liste.appendChild(karte);
  }
}

function absatz(eltern, titel, text) {
  const h = document.createElement("h4");
  h.textContent = titel;
  const p = document.createElement("p");
  p.textContent = text;
  eltern.append(h, p);
}

function linkListe(eltern, quellen) {
  const ul = document.createElement("ul");
  for (const q of quellen) {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = q.url;
    a.textContent = q.titel;
    li.appendChild(a);
    ul.appendChild(li);
  }
  eltern.appendChild(ul);
}

function fuelleErklaerung(box, b) {
  const e = b.erklaerung;
  absatz(box, "Was ist das?", e.was_ist_das);
  absatz(box, "Wer bekommt das Geld?", e.wer_bekommt_das_geld);

  const h = document.createElement("h4");
  h.textContent = "Größte Posten (Soll 2026)";
  const ul = document.createElement("ul");
  for (const p of e.groesste_posten) {
    const li = document.createElement("li");
    li.textContent = p.text;
    ul.appendChild(li);
  }
  box.append(h, ul);

  absatz(box, "Warum so viel?", e.warum_so_viel);

  const hg = document.createElement("h4");
  hg.textContent = "Gut zu wissen";
  const ug = document.createElement("ul");
  for (const g of e.gut_zu_wissen) {
    const li = document.createElement("li");
    li.textContent = `${g.text} `;
    const a = document.createElement("a");
    a.href = g.quelle.url;
    a.textContent = `(Quelle: ${g.quelle.titel})`;
    li.appendChild(a);
    ug.appendChild(li);
  }
  box.append(hg, ug);

  absatz(box, "Bindung", `${b.bindung}. ${b.begruendung}`);
  if (b.bereichsausnahme.betroffen !== "nein") {
    absatz(box, "Schuldenbremse",
      `${mrd(b.bereichsausnahme.betrag_2026)} dieses Bereichs zählen 2026 zur Bereichsausnahme der Schuldenbremse. ` +
      "Von der Schuldenbremse ausgenommen ist aber nur der Teil dieser Ausgaben, der insgesamt über 1 % der Wirtschaftsleistung liegt.");
  }

  const hq = document.createElement("h4");
  hq.textContent = "Quellen";
  box.appendChild(hq);
  linkListe(box, [...e.quellen, ...b.quelle.filter((q) => !e.quellen.some((x) => x.url === q.url && x.titel === q.titel))]);
}

// ---------- Anzeige ----------

function waehleSzenario(s) {
  szenario = s;
  for (const b of daten.bereiche) werte[b.id] = basis(b) + (s.fest[b.id] || 0);
  for (const knopf of el("szenarien").children) {
    const aktiv = knopf.dataset.id === s.id;
    knopf.classList.toggle("aktiv", aktiv);
    knopf.setAttribute("aria-checked", String(aktiv));
  }
  el("szenario-text").textContent = s.text;
  aktualisiere();
}

function aktualisiere() {
  for (const b of daten.bereiche) {
    const karte = karten[b.id];
    const diff = aenderung(b);
    const fest = b.id in szenario.fest;
    const regler = karte.querySelector("input");
    regler.value = diff;
    regler.disabled = fest;
    karte.querySelector(".minus").disabled = fest || werte[b.id] <= 0;
    karte.querySelector(".plus").disabled = fest || werte[b.id] >= 2 * basis(b);
    karte.classList.toggle("geaendert", Math.abs(diff) >= TOLERANZ);

    const plan = karte.querySelector(".plan");
    plan.textContent = Math.abs(diff) < TOLERANZ
      ? "unverändert"
      : `Ihr Plan: ${mrd(werte[b.id])} (${mrd(diff, true)}, ${prozent(diff / basis(b), true)})`;

    const hinweis = karte.querySelector(".karte-hinweis");
    if (fest) {
      hinweis.textContent = `Durch die Aufgabe festgelegt: ${mrd(diff, true)}.`;
      hinweis.hidden = false;
    } else if (Math.abs(diff) >= TOLERANZ) {
      hinweis.textContent = BINDUNG_HINWEIS[b.bindung];
      hinweis.hidden = false;
    } else {
      hinweis.hidden = true;
    }
  }
  zeigeBilanz();
  zeigeErgebnis();
}

function zeigeBilanz() {
  const offen = planSumme() - zielSumme();
  const text = el("bilanz-text");
  const leiste = el("bilanz");
  leiste.classList.remove("ausgeglichen", "zu-viel", "zu-wenig");
  const nichtsVerschoben = daten.bereiche.every((b) => Math.abs(aenderung(b)) < TOLERANZ);
  if (nichtsVerschoben && Math.abs(offen) < TOLERANZ) {
    text.textContent = `Noch nichts verschoben. Gesamtsumme: ${mrd(planSumme())}`;
  } else if (Math.abs(offen) < TOLERANZ) {
    text.textContent = "Ausgeglichen: Ihr Plan erfüllt die Aufgabe.";
    leiste.classList.add("ausgeglichen");
  } else if (offen > 0) {
    text.textContent = `Noch ${mrd(offen)} einsparen`;
    leiste.classList.add("zu-viel");
  } else {
    text.textContent = `Noch ${mrd(-offen)} übrig zum Verteilen`;
    leiste.classList.add("zu-wenig");
  }
}

function zeigeErgebnis() {
  const box = el("ergebnis");
  box.replaceChildren();
  const geaendert = daten.bereiche
    .filter((b) => Math.abs(aenderung(b)) >= TOLERANZ)
    .sort((a, b) => aenderung(b) - aenderung(a));

  const summe = document.createElement("p");
  summe.textContent = `Ausgaben laut Ihrem Plan: ${mrd(planSumme())}. Soll 2026: ${mrd(daten.summe_2026)}.`;
  box.appendChild(summe);

  if (geaendert.length === 0) {
    const p = document.createElement("p");
    p.className = "hinweis";
    p.textContent = "Sie haben noch nichts verändert.";
    box.appendChild(p);
    return;
  }

  const ul = document.createElement("ul");
  ul.className = "ergebnis-liste";
  for (const b of geaendert) {
    const li = document.createElement("li");
    const diff = aenderung(b);
    li.innerHTML = `<span></span><strong class="${diff > 0 ? "plus" : "minus"}"></strong>`;
    li.querySelector("span").textContent = b.name;
    li.querySelector("strong").textContent = mrd(diff, true);
    ul.appendChild(li);
  }
  box.appendChild(ul);

  const gesetzlich = geaendert.filter((b) => b.bindung === "gesetzlich gebunden" && !(b.id in szenario.fest));
  if (gesetzlich.length) {
    const p = document.createElement("p");
    p.className = "ergebnis-hinweis";
    p.textContent = `Sie haben ${gesetzlich.length === 1 ? "einen gesetzlich gebundenen Bereich" : `${gesetzlich.length} gesetzlich gebundene Bereiche`} verändert (${gesetzlich.map((b) => b.name).join(", ")}). Dafür wären Gesetzesänderungen nötig.`;
    box.appendChild(p);
  }
  if (geaendert.some((b) => b.bereichsausnahme.betroffen !== "nein" && ["verteidigung", "ukraine"].includes(b.id))) {
    const p = document.createElement("p");
    p.className = "ergebnis-hinweis";
    p.textContent = "Für Verteidigung und Militärhilfe gilt die Bereichsausnahme der Schuldenbremse: Ausgaben über 1 % der Wirtschaftsleistung dürfen mit Krediten bezahlt werden. Dieses Modell verschiebt trotzdem nur Ausgaben innerhalb der Gesamtsumme.";
    box.appendChild(p);
  }
}

// ---------- Start ----------

async function start() {
  try {
    const antwort = await fetch("daten/bereiche.json");
    daten = await antwort.json();
  } catch (fehler) {
    el("bereiche").textContent = "Die Daten konnten nicht geladen werden.";
    return;
  }
  baueSzenarien();
  baueBereiche();
  el("zuruecksetzen").addEventListener("click", () => waehleSzenario(szenario));
  waehleSzenario(SZENARIEN[0]);
}

start();
