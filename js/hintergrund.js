// Seite "Hintergrund": Einnahmen 2026, wovon die Höhe abhängt, Verlauf seit 1969, aktuelle Debatten.
// Daten: daten/hintergrund.json (Einnahmen in Tausend Euro, Zeitreihe in Mrd. Euro), daten/debatten.json.

let hg = null;
let debatten = null;

const el = (id) => document.getElementById(id);
const tx = (o) => o[SPRACHE] ?? o.de;
const mrdAusMrd = (n) => milliarden(n * 1e6);

function link(eltern, quelle, mitKlammer = true) {
  const a = document.createElement("a");
  a.href = quelle.url;
  a.textContent = mitKlammer ? `(${t("erkl.quelle")}: ${quelle.titel})` : quelle.titel;
  eltern.append(" ", a);
}

// ---------- Woher kommt das Geld? ----------

function zeigeEinnahmen() {
  const e = hg.einnahmen["2026"];
  el("einnahmen-text").textContent = t("hg.einnahmen.text", { gesamt: milliarden(e.gesamt) });

  const teile = [
    { name: t("hg.einnahmen.steuern"), wert: e.steuern, klasse: "teil-steuern" },
    { name: t("hg.einnahmen.kredite"), wert: e.kredite, klasse: "teil-kredite" },
    { name: t("hg.einnahmen.sonstige"), wert: e.sonstige, klasse: "teil-sonstige", zusatz: t("hg.einnahmen.sonstige.text") },
  ];
  const balken = el("einnahmen-balken");
  const legende = el("einnahmen-legende");
  balken.replaceChildren();
  legende.replaceChildren();
  balken.setAttribute("aria-label", teile.map((x) => `${x.name} ${prozent(x.wert / e.gesamt)}`).join(", "));
  for (const x of teile) {
    const anteil = x.wert / e.gesamt;
    const seg = document.createElement("div");
    seg.className = `teil ${x.klasse}`;
    seg.style.width = `${anteil * 100}%`;
    if (anteil > 0.12) seg.textContent = prozent(anteil);
    balken.appendChild(seg);

    const li = document.createElement("li");
    li.innerHTML = `<span class="punkt ${x.klasse}"></span><span><strong></strong> <span class="wert"></span><br><small></small></span>`;
    li.querySelector("strong").textContent = x.name;
    li.querySelector(".wert").textContent = `${milliarden(x.wert)} (${prozent(anteil)})`;
    li.querySelector("small").textContent = x.zusatz || "";
    legende.appendChild(li);
  }

  const liste = el("steuern");
  liste.replaceChildren();
  for (const s of e.groesste_steuern) {
    const li = document.createElement("li");
    li.innerHTML = "<span></span><strong></strong>";
    li.querySelector("span").textContent = s[SPRACHE] ?? s.de;
    li.querySelector("strong").textContent = milliarden(s.betrag);
    liste.appendChild(li);
  }

  const st = hg.steuern_alle_ebenen_2025;
  const p = el("steuer-verteilung");
  p.textContent = t("hg.steuern.anteil", {
    alle: mrdAusMrd(st.gesamt_mrd), bund: mrdAusMrd(st.bund_mrd), anteil: prozent(st.bund_mrd / st.gesamt_mrd),
  });
  link(p, { titel: "Art. 106 GG", url: "https://www.gesetze-im-internet.de/gg/art_106.html" });
}

// ---------- Wovon hängt die Höhe ab? ----------

function zeigeHoehe() {
  const sb = hg.schuldenbremse_2026;
  const zr = Object.fromEntries(hg.zeitreihe.map((z) => [z.jahr, z]));
  const karten = [
    { k: "k1", werte: {}, quelle: hg.steuern_alle_ebenen_2025.quelle },
    { k: "k2", werte: { zulaessig: mrdAusMrd(sb.zulaessig_mrd), nka: mrdAusMrd(sb.nettokredit_mrd), abzug: mrdAusMrd(sb.abzug_bereichsausnahme_mrd) },
      quelle: { titel: "Art. 115 GG", url: "https://www.gesetze-im-internet.de/gg/art_115.html" } },
    { k: "k3", werte: {}, quelle: null, verweis: "umschichten.html" },
    { k: "k4", werte: {}, quelle: { titel: "Art. 110 GG", url: "https://www.gesetze-im-internet.de/gg/art_110.html" } },
    { k: "k5", werte: { soll25: milliarden(hg.einnahmen["2025"].gesamt), ist25: mrdAusMrd(zr[2025].ausgaben) }, quelle: zr[2025].quelle },
  ];
  const raster = el("hoehe");
  raster.replaceChildren();
  karten.forEach((x, i) => {
    const karte = document.createElement("article");
    karte.className = "info-karte";
    karte.innerHTML = `<span class="info-nummer">${i + 1}</span><h3></h3><p></p>`;
    karte.querySelector("h3").textContent = t(`hg.${x.k}.titel`);
    const p = karte.querySelector("p");
    p.textContent = t(`hg.${x.k}.text`, x.werte);
    if (x.quelle) link(p, x.quelle);
    if (x.verweis) {
      const a = document.createElement("a");
      a.href = mitSprache(x.verweis);
      a.textContent = ` ${t("hg.k3.verweis")}`;
      p.appendChild(a);
    }
    raster.appendChild(karte);
  });
}

// ---------- Verlauf seit 1969 ----------

const SVG = "http://www.w3.org/2000/svg";
function svgEl(name, attrs, eltern) {
  const knoten = document.createElementNS(SVG, name);
  for (const [k, v] of Object.entries(attrs)) knoten.setAttribute(k, v);
  if (eltern) eltern.appendChild(knoten);
  return knoten;
}

function artName(art) {
  return t(`hg.art.${art}`);
}

function infoText(z) {
  return t("hg.geschichte.info", {
    jahr: z.jahr, art: artName(z.art), ausgaben: mrdAusMrd(z.ausgaben), kredite: mrdAusMrd(z.nettokredit),
    anteil: prozent(z.nettokredit / z.ausgaben), steuern: mrdAusMrd(z.steuern),
  });
}

function zeigeInfo(z) {
  const p = el("verlauf-info");
  p.textContent = infoText(z);
  link(p, z.quelle);
}

function zeichneVerlauf() {
  const box = el("verlauf");
  const breite = box.clientWidth;
  const hoehe = breite < 500 ? 240 : 300;
  const rand = { l: 36, r: 6, o: 22, u: 24 };
  const von = 1968;
  const bis = 2028;
  const max = 650;
  const x = (jahr) => rand.l + ((jahr - von) / (bis - von)) * (breite - rand.l - rand.r);
  const y = (wert) => rand.o + (1 - wert / max) * (hoehe - rand.o - rand.u);
  const bw = Math.max(4, ((breite - rand.l - rand.r) / (bis - von)) * 0.72);

  box.replaceChildren();
  const svg = svgEl("svg", { viewBox: `0 0 ${breite} ${hoehe}`, width: breite, height: hoehe, role: "img",
    "aria-label": t("hg.geschichte.titel") }, box);

  // Zeiträume mit besonderen Ereignissen
  hg.ereignisse.forEach((ev, i) => {
    svgEl("rect", { x: x(ev.von) - bw, y: rand.o - 16, width: x(ev.bis) - x(ev.von) + 2 * bw,
      height: hoehe - rand.o - rand.u + 16, class: "verlauf-zeitraum" }, svg);
    const nr = svgEl("text", { x: (x(ev.von) + x(ev.bis)) / 2, y: rand.o - 5, class: "verlauf-nummer", "text-anchor": "middle" }, svg);
    nr.textContent = String(i + 1);
  });

  // Gitterlinien
  for (let w = 0; w <= 600; w += 100) {
    svgEl("line", { x1: rand.l, x2: breite - rand.r, y1: y(w), y2: y(w), class: "verlauf-gitter" }, svg);
    const beschr = svgEl("text", { x: rand.l - 6, y: y(w) + 4, class: "verlauf-achse", "text-anchor": "end" }, svg);
    beschr.textContent = String(w);
  }
  for (const jahr of [1970, 1980, 1990, 2000, 2010, 2020]) {
    const beschr = svgEl("text", { x: x(jahr), y: hoehe - 6, class: "verlauf-achse", "text-anchor": "middle" }, svg);
    beschr.textContent = String(jahr);
  }

  // Balken: Ausgaben, darin der mit neuen Krediten bezahlte Teil
  for (const z of hg.zeitreihe) {
    const g = svgEl("g", { class: `verlauf-jahr${z.art !== "Ist" ? " verlauf-soll" : ""}`, tabindex: "0" }, svg);
    svgEl("rect", { x: x(z.jahr) - bw / 2, y: y(z.ausgaben), width: bw, height: y(0) - y(z.ausgaben), rx: Math.min(3, bw / 3), class: "balken-ausgaben" }, g);
    if (z.nettokredit > 0) {
      svgEl("rect", { x: x(z.jahr) - bw / 2, y: y(z.nettokredit), width: bw, height: y(0) - y(z.nettokredit), class: "balken-kredite" }, g);
    }
    // großzügige Trefferfläche
    svgEl("rect", { x: x(z.jahr) - Math.max(bw, 12) / 2, y: rand.o, width: Math.max(bw, 12), height: y(0) - rand.o, class: "verlauf-treffer" }, g);
    const titel = svgEl("title", {}, g);
    titel.textContent = infoText(z);
    g.addEventListener("click", () => zeigeInfo(z));
    g.addEventListener("keydown", (ev) => { if (ev.key === "Enter" || ev.key === " ") zeigeInfo(z); });
    g.addEventListener("mouseenter", () => zeigeInfo(z));
  }

  // Direkte Beschriftung (nur bei genug Platz): höchster Wert und Soll 2026
  if (breite < 560) return;
  const spitze = hg.zeitreihe.reduce((a, b) => (b.ausgaben > a.ausgaben ? b : a));
  const letzter = hg.zeitreihe[hg.zeitreihe.length - 1];
  // Spitze nur beschriften, wenn sie weit genug vom letzten Balken entfernt ist (sonst überlappen die Texte)
  for (const z of spitze.jahr < letzter.jahr - 8 ? [spitze, letzter] : [letzter]) {
    const beschr = svgEl("text", { x: x(z.jahr), y: y(z.ausgaben) - 5, class: "verlauf-wert", "text-anchor": z.jahr > 2024 ? "end" : "middle" }, svg);
    beschr.textContent = z.art !== "Ist" ? `${z.jahr} ${artName(z.art)}: ${Math.round(z.ausgaben)}` : `${z.jahr}: ${Math.round(z.ausgaben)}`;
  }
}

function fuelleVerlaufTabelle() {
  const tbody = el("verlauf-tabelle").querySelector("tbody");
  tbody.replaceChildren();
  for (const z of [...hg.zeitreihe].reverse()) {
    const tr = document.createElement("tr");
    tr.innerHTML = "<td></td><td></td><td></td><td></td>";
    const zellen = tr.querySelectorAll("td");
    zellen[0].textContent = `${z.jahr} (${artName(z.art)})`;
    zellen[1].textContent = mrdAusMrd(z.ausgaben);
    zellen[2].textContent = mrdAusMrd(z.nettokredit);
    zellen[3].textContent = mrdAusMrd(z.steuern);
    tbody.appendChild(tr);
  }
  const ol = el("ereignisse");
  ol.replaceChildren();
  for (const ev of hg.ereignisse) {
    const li = document.createElement("li");
    li.textContent = `${ev.von} ${t("hg.bis")} ${ev.bis}: ${tx(ev)}`;
    ol.appendChild(li);
  }
}

// ---------- Verteidigung und NATO ----------

function zeigeVerteidigung() {
  const v = hg.verteidigung;
  const mrd = (n) => (n == null ? "" : mrdAusMrd(n));
  const tbody = el("nato-haushalt").querySelector("tbody");
  tbody.replaceChildren();
  for (const z of v.haushalt) {
    const tr = document.createElement("tr");
    tr.innerHTML = "<td></td><td></td><td></td>";
    const zellen = tr.querySelectorAll("td");
    zellen[0].textContent = `${z.jahr} (${artName(z.art)})`;
    zellen[1].textContent = mrd(z.ep14_mrd);
    zellen[2].textContent = z.sondervermoegen_mrd == null ? t("nato.keine.angabe") : mrd(z.sondervermoegen_mrd);
    tbody.appendChild(tr);
  }
  const reihe = el("nato-reihe").querySelector("tbody");
  reihe.replaceChildren();
  for (const z of v.nato) {
    const tr = document.createElement("tr");
    tr.innerHTML = "<td></td><td></td><td></td>";
    const zellen = tr.querySelectorAll("td");
    zellen[0].textContent = `${z.jahr} (${artName(z.art)})`;
    zellen[1].textContent = mrd(z.mrd);
    // zwei Nachkommastellen wie im NATO-Bericht
    zellen[2].textContent = SPRACHE === "en" ? `${zahl(z.anteil_bip, 2)}%` : `${zahl(z.anteil_bip, 2)} %`;
    reihe.appendChild(tr);
  }
  const q = v.quote_2026;
  const p = el("nato-quote");
  p.textContent = t("nato.quote", {
    ziel_kern: prozent(v.ziel.kern / 100), ziel_sicherheit: prozent(v.ziel.sicherheit / 100),
    kern: prozent(q.kern / 100), sicherheit: prozent(q.sicherheit / 100), bis: v.ziel.deutschland_bis,
  });
  link(p, q.quelle);
  const quellen = el("nato-quellen");
  quellen.textContent = `${t("erkl.quellen")}:`;
  v.quellen.forEach((quelle, i) => { if (i) quellen.append(";"); link(quellen, quelle, false); });
}

// ---------- Ukraine-Hilfe ----------

function zeigeUkraine() {
  const ua = hg.ukraine;
  const summe = (jahr) => ua.posten.reduce((s, p) => s + p[jahr], 0);
  const im2026 = ua.posten.filter((p) => p["2026"] > 0).length;
  el("ua-einleitung").textContent = t("ua.einleitung", {
    n: im2026, summe: milliarden(summe("2026")), summe25: milliarden(summe("2025")), summe27: milliarden(summe("2027")),
  });

  const tbody = el("ua-tabelle").querySelector("tbody");
  tbody.replaceChildren();
  for (const p of ua.posten) {
    const tr = document.createElement("tr");
    tr.innerHTML = "<td><span></span><br><small></small></td><td></td><td></td><td></td>";
    const zellen = tr.querySelectorAll("td");
    zellen[0].querySelector("span").textContent = SPRACHE === "en" ? p.en : p.de;
    zellen[0].querySelector("small").textContent = `${t("suche.kapitel", { nr: p.kapitel })} · ${t("suche.titel", { nr: `${p.titel.slice(0, 3)} ${p.titel.slice(3)}` })}`;
    zellen[1].textContent = euro(p["2026"]);
    zellen[2].textContent = euro(p["2025"]);
    zellen[3].textContent = euro(p["2027"]);
    tbody.appendChild(tr);
  }
  const tfoot = el("ua-tabelle").querySelector("tfoot");
  tfoot.innerHTML = "<tr><th scope=\"row\"></th><td></td><td></td><td></td></tr>";
  tfoot.querySelector("th").textContent = t("ua.summe");
  tfoot.querySelectorAll("td")[0].textContent = euro(summe("2026"));
  tfoot.querySelectorAll("td")[1].textContent = euro(summe("2025"));
  tfoot.querySelectorAll("td")[2].textContent = euro(summe("2027"));

  zeigeTracker(ua.tracker);

  const q = el("ua-quellen");
  q.textContent = `${t("erkl.quellen")}:`;
  ua.quellen.forEach((quelle, i) => { if (i) q.append(";"); link(q, quelle, false); });
}

// Gesamte deutsche Hilfe laut Kiel Institut (aufsummiert seit Kriegsbeginn, nicht mit Haushaltsjahren vergleichbar)
function zeigeTracker(tr) {
  el("ua-tracker-text").textContent = t("ua.tracker.text", { stand: tr.stand });
  const tbody = el("ua-tracker").querySelector("tbody");
  tbody.replaceChildren();
  const zeilen = [["militaer", "ua.tracker.militaer"], ["humanitaer", "ua.tracker.humanitaer"],
    ["finanziell", "ua.tracker.finanziell"], ["gesamt", "ua.tracker.gesamt"], ["eu_anteil", "ua.tracker.eu"]];
  for (const [feld, text] of zeilen) {
    const zeile = document.createElement("tr");
    if (feld === "gesamt") zeile.className = "summenzeile";
    zeile.innerHTML = "<td></td><td></td><td></td>";
    const zellen = zeile.querySelectorAll("td");
    zellen[0].textContent = t(text);
    zellen[1].textContent = mrdAusMrd(tr.zugewiesen[feld]);
    zellen[2].textContent = mrdAusMrd(tr.zugesagt[feld]);
    tbody.appendChild(zeile);
  }
  const q = el("ua-tracker-quellen");
  q.textContent = `${t("erkl.quellen")}:`;
  tr.quellen.forEach((quelle, i) => { if (i) q.append(";"); link(q, quelle, false); });
}

// ---------- Debatten ----------

function zeigeDebatten() {
  const box = el("debatten");
  box.replaceChildren();
  for (const d of debatten.debatten) {
    const karte = document.createElement("article");
    karte.className = "debatte";
    karte.innerHTML = `<span class="debatte-etikett"></span><h3></h3><p class="debatte-stand"></p>`;
    karte.querySelector(".debatte-etikett").textContent = t("hg.debatte.stand");
    karte.querySelector("h3").textContent = tx(d.titel);
    karte.querySelector(".debatte-stand").textContent = tx(d.stand);

    d.abschnitte.forEach((ab, i) => {
      const det = document.createElement("details");
      det.className = "debatte-abschnitt";
      if (i === 0) det.open = true;
      det.innerHTML = "<summary></summary><ul></ul><p class=\"debatte-quelle\"></p>";
      det.querySelector("summary").textContent = tx(ab.titel);
      const ul = det.querySelector("ul");
      for (const punkt of ab.punkte) {
        const li = document.createElement("li");
        li.textContent = tx(punkt);
        ul.appendChild(li);
      }
      const q = det.querySelector(".debatte-quelle");
      q.textContent = `${t("erkl.quelle")}:`;
      link(q, ab.quelle, false);
      karte.appendChild(det);
    });

    const gut = document.createElement("p");
    gut.className = "ergebnis-hinweis";
    gut.innerHTML = "<strong></strong> <span></span>";
    gut.querySelector("strong").textContent = `${t("hg.debatte.gut")}:`;
    gut.querySelector("span").textContent = tx(d.gut_zu_wissen);
    karte.appendChild(gut);

    if (d.weitere_quellen) {
      const p = document.createElement("p");
      p.className = "debatte-quelle";
      p.textContent = `${t("hg.debatte.weitere")}:`;
      d.weitere_quellen.forEach((q, i) => { if (i) p.append(";"); link(p, q, false); });
      karte.appendChild(p);
    }
    box.appendChild(karte);
  }
}

function zeigeQuellen() {
  const ul = el("hg-quellen");
  const quellen = new Map();
  for (const z of hg.zeitreihe) quellen.set(z.quelle.url + z.quelle.titel, z.quelle);
  quellen.set("st", hg.steuern_alle_ebenen_2025.quelle);
  for (const q of quellen.values()) {
    const li = document.createElement("li");
    link(li, q, false);
    ul.appendChild(li);
  }
  const li = document.createElement("li");
  li.textContent = t("hg.quellen.hinweis");
  ul.appendChild(li);
}

// ---------- Start ----------

async function start() {
  try {
    [hg, debatten] = await Promise.all([
      fetch(datei("daten/hintergrund.json")).then((a) => a.json()),
      fetch(datei("daten/debatten.json")).then((a) => a.json()),
    ]);
  } catch (fehler) {
    el("einnahmen-text").textContent = t("fehler.laden");
    return;
  }
  zeigeEinnahmen();
  zeigeHoehe();
  zeichneVerlauf();
  fuelleVerlaufTabelle();
  zeigeVerteidigung();
  zeigeUkraine();
  zeigeDebatten();
  zeigeQuellen();

  let letzteBreite = el("verlauf").clientWidth;
  new ResizeObserver(() => {
    const breite = el("verlauf").clientWidth;
    if (breite !== letzteBreite) {
      letzteBreite = breite;
      zeichneVerlauf();
    }
  }).observe(el("verlauf"));
}

start();
