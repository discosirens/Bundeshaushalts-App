// Umschicht-Modus: Geld zwischen den 14 Bereichen aus daten/bereiche.json verschieben.
// Alle Beträge intern in Tausend Euro, wie in den Daten. Texte und Zahlenformate kommen aus sprache.js.

const MRD = 1_000_000;          // 1 Mrd. € in Tausend Euro
const SCHRITT = 100_000;        // Reglerschritt: 0,1 Mrd. €
const TOLERANZ = 50_000;        // unter 0,05 Mrd. € gilt als ausgeglichen

// Aufgaben geben nur eine Annahme vor. Wie sie gelöst wird, entscheidet die Nutzerin oder der Nutzer.
// Titel und Text stehen in sprache.js unter "sz.<id>.titel" und "sz.<id>.text".
const SZENARIEN = [
  { id: "frei", fest: {}, zielaenderung: 0 },
  { id: "verteidigung", fest: { verteidigung: 10 * MRD }, zielaenderung: 0 },
  { id: "bildung", fest: { bildung: 5 * MRD }, zielaenderung: 0 },
  { id: "zinsen", fest: { zinsen: 5 * MRD }, zielaenderung: 0 },
  { id: "sparen", fest: {}, zielaenderung: -10 * MRD },
];

let daten = null;
let szenario = SZENARIEN[0];
const werte = {};     // aktueller Plan je Bereich (Tausend Euro)
const karten = {};    // DOM-Elemente je Bereich

const el = (id) => document.getElementById(id);
const mrd = milliarden;

// Texte eines Bereichs in der gewählten Sprache
const bName = (b) => (SPRACHE === "en" ? b.en.name : b.name);
const bBegruendung = (b) => (SPRACHE === "en" ? b.en.begruendung : b.begruendung);
const bErklaerung = (b) => (SPRACHE === "en" ? b.en.erklaerung : b.erklaerung);

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
    knopf.textContent = t(`sz.${s.id}.titel`);
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
        <button type="button" class="knopf-rund minus">−</button>
        <input type="range" step="${SCHRITT}">
        <button type="button" class="knopf-rund plus">+</button>
      </div>
      <p class="karte-hinweis" hidden></p>
      <details class="mehr">
        <summary></summary>
        <div class="mehr-inhalt"></div>
      </details>`;
    karte.querySelector("h3").textContent = bName(b);
    karte.querySelector(".bindung").textContent = t(`bindung.${b.bindung}`);
    karte.querySelector(".soll").textContent = t("karte.soll", { betrag: mrd(basis(b)), anteil: prozent(b.anteil_2026) });
    karte.querySelector("summary").textContent = t("karte.mehr");
    karte.querySelector(".minus").setAttribute("aria-label", t("karte.minus"));
    karte.querySelector(".plus").setAttribute("aria-label", t("karte.plus"));

    const regler = karte.querySelector("input");
    // Der Regler bildet die Änderung ab, damit die Schritte genau 0,1 Mrd. € sind.
    regler.min = -basis(b);
    regler.max = basis(b);
    regler.setAttribute("aria-label", t("karte.regler", { name: bName(b) }));
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
  const e = bErklaerung(b);
  absatz(box, t("erkl.was"), e.was_ist_das);
  absatz(box, t("erkl.wer"), e.wer_bekommt_das_geld);

  const h = document.createElement("h4");
  h.textContent = t("erkl.posten");
  const ul = document.createElement("ul");
  for (const p of e.groesste_posten) {
    const li = document.createElement("li");
    li.textContent = p.text;
    ul.appendChild(li);
  }
  box.append(h, ul);

  absatz(box, t("erkl.warum"), e.warum_so_viel);

  const hg = document.createElement("h4");
  hg.textContent = t("erkl.gut");
  const ug = document.createElement("ul");
  for (const g of e.gut_zu_wissen) {
    const li = document.createElement("li");
    li.textContent = `${g.text} `;
    const a = document.createElement("a");
    a.href = g.quelle.url;
    a.textContent = `(${t("erkl.quelle")}: ${g.quelle.titel})`;
    li.appendChild(a);
    ug.appendChild(li);
  }
  box.append(hg, ug);

  absatz(box, t("erkl.bindung"), `${t(`bindung.${b.bindung}`)}. ${bBegruendung(b)}`);
  if (b.bereichsausnahme.betroffen !== "nein") {
    absatz(box, t("erkl.schuldenbremse"), t("erkl.schuldenbremse.text", { betrag: mrd(b.bereichsausnahme.betrag_2026) }));
  }

  const hq = document.createElement("h4");
  hq.textContent = t("erkl.quellen");
  box.appendChild(hq);
  const quellen = b.erklaerung.quellen;
  linkListe(box, [...quellen, ...b.quelle.filter((q) => !quellen.some((x) => x.url === q.url && x.titel === q.titel))]);
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
  el("szenario-text").textContent = t(`sz.${s.id}.text`);
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
      ? t("karte.unveraendert")
      : t("karte.plan", { wert: mrd(werte[b.id]), diff: mrd(diff, true), prozent: prozent(diff / basis(b), true) });

    const hinweis = karte.querySelector(".karte-hinweis");
    if (fest) {
      hinweis.textContent = t("karte.fest", { diff: mrd(diff, true) });
      hinweis.hidden = false;
    } else if (Math.abs(diff) >= TOLERANZ) {
      hinweis.textContent = t(`bindung.hinweis.${b.bindung}`);
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
    text.textContent = t("bilanz.nichts", { summe: mrd(planSumme()) });
  } else if (Math.abs(offen) < TOLERANZ) {
    text.textContent = t("bilanz.aus");
    leiste.classList.add("ausgeglichen");
  } else if (offen > 0) {
    text.textContent = t("bilanz.zuviel", { betrag: mrd(offen) });
    leiste.classList.add("zu-viel");
  } else {
    text.textContent = t("bilanz.zuwenig", { betrag: mrd(-offen) });
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
  summe.textContent = t("ergebnis.summe", { plan: mrd(planSumme()), soll: mrd(daten.summe_2026) });
  box.appendChild(summe);

  if (geaendert.length === 0) {
    const p = document.createElement("p");
    p.className = "hinweis";
    p.textContent = t("ergebnis.leer");
    box.appendChild(p);
    return;
  }

  const ul = document.createElement("ul");
  ul.className = "ergebnis-liste";
  for (const b of geaendert) {
    const li = document.createElement("li");
    const diff = aenderung(b);
    li.innerHTML = `<span></span><strong class="${diff > 0 ? "plus" : "minus"}"></strong>`;
    li.querySelector("span").textContent = bName(b);
    li.querySelector("strong").textContent = mrd(diff, true);
    ul.appendChild(li);
  }
  box.appendChild(ul);

  const gesetzlich = geaendert.filter((b) => b.bindung === "gesetzlich gebunden" && !(b.id in szenario.fest));
  if (gesetzlich.length) {
    const p = document.createElement("p");
    p.className = "ergebnis-hinweis";
    const namen = gesetzlich.map(bName).join(", ");
    p.textContent = gesetzlich.length === 1
      ? t("ergebnis.gesetzlich.eins", { namen })
      : t("ergebnis.gesetzlich.mehr", { n: gesetzlich.length, namen });
    box.appendChild(p);
  }
  if (geaendert.some((b) => b.bereichsausnahme.betroffen !== "nein" && ["verteidigung", "ukraine"].includes(b.id))) {
    const p = document.createElement("p");
    p.className = "ergebnis-hinweis";
    p.textContent = t("ergebnis.ausnahme");
    box.appendChild(p);
  }
}

// ---------- Start ----------

async function start() {
  try {
    const antwort = await fetch(datei("daten/bereiche.json"));
    daten = await antwort.json();
  } catch (fehler) {
    el("bereiche").textContent = t("fehler.laden");
    return;
  }
  baueSzenarien();
  baueBereiche();
  el("zuruecksetzen").addEventListener("click", () => waehleSzenario(szenario));
  waehleSzenario(SZENARIEN[0]);
}

start();
