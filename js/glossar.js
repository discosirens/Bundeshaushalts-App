// Glossar: markiert Fachbegriffe im Text und zeigt eine kurze Erklärung (daten/glossar.json),
// mit der Maus beim Überfahren, auf dem Handy beim Antippen.
// Läuft auf allen Seiten. Pro Hauptabschnitt der Seite wird nur das erste Vorkommen eines Begriffs markiert,
// damit der Text lesbar bleibt. Inhalte, die später per JavaScript entstehen, werden ebenfalls erfasst.

(() => {
  // Hier werden keine Begriffe markiert: Überschriften, Links, Knöpfe, Tabellen, Eingaben, Treemap
  const AUSSCHLUSS = "a, button, h1, h2, h3, h4, summary, label, th, td, input, textarea, select, option, nav, script, style, svg, " +
    ".topbar, .treemap, .treemap-mehr, .suche, .glossar-box, .begriff, [data-kein-glossar]";
  // Hauptabschnitte: direkte Kinder von <main> und der Kopfbereich
  const abschnittVon = (element) => element.closest("main > *") || element.closest(".hero") || document.body;

  let begriffe = [];
  let muster = null;
  const nachWort = new Map();   // Wortform in Kleinbuchstaben -> Begriff
  let box = null;
  let ausloeser = null;

  const sprachTeil = (b) => b[SPRACHE] ?? b.de;
  const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  function baueMuster() {
    const formen = [];
    for (const b of begriffe) {
      if (!b.auto) continue;
      for (const m of sprachTeil(b).muster) {
        formen.push(m);
        nachWort.set(m.toLowerCase(), b);
      }
    }
    if (formen.length === 0) return;
    formen.sort((a, b) => b.length - a.length);   // längere Formen zuerst ("Globale Minderausgabe" vor "Minderausgabe")
    // Wortanfang, Wortform, bis zu zwei Buchstaben Endung (Sondervermögens, Einzelplans), Wortende
    muster = new RegExp(`(?<![\\p{L}\\p{N}-])(${formen.map(escape).join("|")})(\\p{L}{0,2})(?![\\p{L}\\p{N}])`, "giu");
  }

  function bereitsMarkiert(abschnitt, id) {
    return abschnitt.querySelector(`.begriff[data-begriff="${id}"]`) !== null;
  }

  function markiereTextknoten(knoten) {
    const eltern = knoten.parentElement;
    if (!eltern || eltern.closest(AUSSCHLUSS)) return;
    const abschnitt = abschnittVon(eltern);
    const text = knoten.nodeValue;
    muster.lastIndex = 0;
    const funde = [];
    for (const treffer of text.matchAll(muster)) {
      const b = nachWort.get(treffer[1].toLowerCase());
      if (!b || funde.some((f) => f.b === b) || bereitsMarkiert(abschnitt, b.id)) continue;
      // Kurze Abkürzungen (BIP, GDP, ODA) nur in Großbuchstaben
      if (treffer[1].length <= 3 && treffer[1] !== treffer[1].toUpperCase()) continue;
      funde.push({ b, start: treffer.index, ende: treffer.index + treffer[0].length });
    }
    // Von hinten nach vorne ersetzen, damit die Positionen stimmen
    for (const f of funde.reverse()) {
      const rest = knoten.splitText(f.start);
      rest.splitText(f.ende - f.start);
      // <span> statt <button>, damit der Begriff wie normaler Text umbricht; Tastatur siehe unten
      const knopf = document.createElement("span");
      knopf.className = "begriff";
      knopf.setAttribute("role", "button");
      knopf.tabIndex = 0;
      knopf.dataset.begriff = f.b.id;
      knopf.textContent = rest.nodeValue;
      knopf.setAttribute("aria-haspopup", "dialog");
      rest.replaceWith(knopf);
    }
  }

  function durchsuche(wurzel) {
    if (!muster) return;
    if (wurzel.nodeType === Node.TEXT_NODE) {
      markiereTextknoten(wurzel);
      return;
    }
    if (wurzel.nodeType !== Node.ELEMENT_NODE || wurzel.closest(AUSSCHLUSS)) return;
    const walker = document.createTreeWalker(wurzel, NodeFilter.SHOW_TEXT);
    const knoten = [];
    while (walker.nextNode()) knoten.push(walker.currentNode);
    for (const k of knoten) markiereTextknoten(k);
  }

  // ---------- Erklärungsfenster ----------

  function baueBox() {
    box = document.createElement("div");
    box.className = "glossar-box";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "false");
    box.setAttribute("aria-labelledby", "glossar-box-titel");
    box.hidden = true;
    box.innerHTML = `<div class="glossar-box-kopf"><strong id="glossar-box-titel"></strong>
      <button type="button" class="glossar-zu"></button></div><p class="glossar-box-text"></p>
      <p class="glossar-box-fuss"></p>`;
    const zu = box.querySelector(".glossar-zu");
    zu.setAttribute("aria-label", t("glossar.schliessen"));
    zu.textContent = "×";
    zu.addEventListener("click", () => schliesse());
    document.body.appendChild(box);
  }

  // Mit Maus: Erklärung erscheint beim Überfahren direkt am Begriff. Auf dem Handy: beim Antippen, unten am Rand.
  const MIT_MAUS = window.matchMedia("(hover: hover) and (pointer: fine)");
  let angeheftet = false;   // per Klick oder Enter geöffnet: bleibt offen, bis man schließt
  let zeitOeffnen = null;
  let zeitSchliessen = null;

  function begriffVon(knopf) {
    return begriffe.find((x) => x.id === knopf.dataset.begriff);
  }

  function fuelleBox(b) {
    const teil = sprachTeil(b);
    box.querySelector("strong").textContent = teil.wort;
    box.querySelector(".glossar-box-text").textContent = teil.text;
    const fuss = box.querySelector(".glossar-box-fuss");
    fuss.replaceChildren();
    if (b.quelle) {
      const q = document.createElement("a");
      q.href = b.quelle.url;
      q.textContent = `${t("erkl.quelle")}: ${b.quelle.titel}`;
      fuss.append(q, " · ");
    }
    const alle = document.createElement("a");
    alle.href = document.body.dataset.seite === "hg" ? "#glossar" : `${mitSprache("hintergrund.html")}#glossar`;
    alle.textContent = t("glossar.alle");
    alle.addEventListener("click", () => schliesse(false));
    fuss.append(alle);
  }

  // Fenster unter (oder, wenn kein Platz ist, über) dem Begriff platzieren
  function platziere() {
    if (!box || box.hidden || !ausloeser || !box.classList.contains("am-begriff")) return;
    const zeile = ausloeser.getClientRects()[0] || ausloeser.getBoundingClientRect();
    const ganz = ausloeser.getBoundingClientRect();
    const breite = box.offsetWidth;
    const hoehe = box.offsetHeight;
    let oben = ganz.bottom + 8;
    if (oben + hoehe > window.innerHeight - 8 && ganz.top - hoehe - 8 > 8) oben = ganz.top - hoehe - 8;
    const links = Math.min(Math.max(zeile.left, 16), window.innerWidth - breite - 16);
    box.style.top = `${Math.round(oben)}px`;
    box.style.left = `${Math.round(links)}px`;
  }

  function oeffne(b, knopf, { anheften }) {
    if (!box) baueBox();
    clearTimeout(zeitSchliessen);
    ausloeser = knopf;
    angeheftet = anheften;
    fuelleBox(b);
    const amBegriff = MIT_MAUS.matches || !anheften;
    box.classList.toggle("am-begriff", amBegriff);
    if (!amBegriff) {
      box.style.top = "";
      box.style.left = "";
    }
    box.hidden = false;
    platziere();
    if (anheften) box.querySelector(".glossar-zu").focus();
  }

  function schliesse(fokusZurueck = true) {
    clearTimeout(zeitOeffnen);
    clearTimeout(zeitSchliessen);
    if (!box || box.hidden) return;
    box.hidden = true;
    if (fokusZurueck && angeheftet && ausloeser && document.contains(ausloeser)) ausloeser.focus();
    angeheftet = false;
    ausloeser = null;
  }

  function spaeterSchliessen() {
    clearTimeout(zeitOeffnen);
    if (angeheftet) return;
    clearTimeout(zeitSchliessen);
    zeitSchliessen = setTimeout(() => schliesse(false), 250);
  }

  // Maus: kurz verweilen öffnet, Verlassen schließt (mit kleiner Pause, damit man ins Fenster fahren kann)
  document.addEventListener("pointerover", (ereignis) => {
    if (ereignis.pointerType !== "mouse") return;
    if (box && box.contains(ereignis.target)) {
      clearTimeout(zeitSchliessen);
      return;
    }
    const knopf = ereignis.target.closest(".begriff");
    if (!knopf || (knopf === ausloeser && !box.hidden)) return;
    if (angeheftet && !box.hidden) return;
    clearTimeout(zeitOeffnen);
    clearTimeout(zeitSchliessen);
    zeitOeffnen = setTimeout(() => {
      const b = begriffVon(knopf);
      if (b) oeffne(b, knopf, { anheften: false });
    }, 150);
  });
  document.addEventListener("pointerout", (ereignis) => {
    if (ereignis.pointerType !== "mouse") return;
    const von = ereignis.target.closest(".begriff, .glossar-box");
    if (!von) return;
    const nach = ereignis.relatedTarget instanceof Element ? ereignis.relatedTarget.closest(".begriff, .glossar-box") : null;
    if (nach === von) return;
    if (nach && nach === box) {
      clearTimeout(zeitSchliessen);
      return;
    }
    spaeterSchliessen();
  });

  // Tastatur: Begriff ansteuern zeigt die Erklärung, Enter heftet sie an (Fokus ins Fenster)
  document.addEventListener("focusin", (ereignis) => {
    const knopf = ereignis.target.closest?.(".begriff");
    if (knopf && !(angeheftet && box && !box.hidden)) {
      const b = begriffVon(knopf);
      if (b) oeffne(b, knopf, { anheften: false });
    }
  });
  document.addEventListener("focusout", (ereignis) => {
    if (!ereignis.target.closest?.(".begriff, .glossar-box")) return;
    const nach = ereignis.relatedTarget instanceof Element ? ereignis.relatedTarget.closest(".begriff, .glossar-box") : null;
    if (!nach) spaeterSchliessen();
  });

  document.addEventListener("click", (ereignis) => {
    const knopf = ereignis.target.closest(".begriff");
    if (knopf) {
      const b = begriffVon(knopf);
      if (b) oeffne(b, knopf, { anheften: true });
      return;
    }
    if (box && !box.hidden && !box.contains(ereignis.target)) schliesse(false);
  });
  document.addEventListener("keydown", (ereignis) => {
    if (ereignis.key === "Escape") schliesse();
    const knopf = ereignis.target.closest?.(".begriff");
    if (knopf && (ereignis.key === "Enter" || ereignis.key === " ")) {
      ereignis.preventDefault();
      knopf.click();
    }
  });
  window.addEventListener("scroll", platziere, { passive: true });
  window.addEventListener("resize", platziere);

  // ---------- Liste aller Begriffe (Hintergrund-Seite) ----------

  function zeigeListe() {
    const liste = document.getElementById("glossar-liste");
    if (!liste) return;
    liste.replaceChildren();
    const sortiert = [...begriffe].sort((a, b) => sprachTeil(a).wort.localeCompare(sprachTeil(b).wort, SPRACHE));
    for (const b of sortiert) {
      const teil = sprachTeil(b);
      const dt = document.createElement("dt");
      dt.id = `begriff-${b.id}`;
      dt.textContent = teil.wort;
      const dd = document.createElement("dd");
      dd.textContent = teil.text;
      if (b.quelle) {
        const q = document.createElement("a");
        q.href = b.quelle.url;
        q.textContent = `(${t("erkl.quelle")}: ${b.quelle.titel})`;
        dd.append(" ", q);
      }
      liste.append(dt, dd);
    }
  }

  async function start() {
    try {
      const daten = await fetch(datei("daten/glossar.json")).then((a) => a.json());
      begriffe = daten.begriffe;
    } catch (fehler) {
      return;   // ohne Glossar funktioniert die Seite wie bisher
    }
    zeigeListe();
    baueMuster();
    durchsuche(document.body);

    // Später erzeugte Inhalte (Daten werden nachgeladen) gesammelt nachbearbeiten
    let neu = new Set();
    let geplant = false;
    new MutationObserver((aenderungen) => {
      for (const a of aenderungen) {
        if (a.type === "characterData") neu.add(a.target);
        for (const k of a.addedNodes) neu.add(k);
      }
      if (geplant) return;
      geplant = true;
      requestAnimationFrame(() => {
        const liste = neu;
        neu = new Set();
        geplant = false;
        for (const k of liste) if (k.isConnected) durchsuche(k);
      });
    }).observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  start();
})();
