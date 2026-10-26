// Zweisprachigkeit: alle Texte der Oberfläche auf Deutsch (du) und Englisch, dazu Zahlenformate.
// Sprache kommt aus ?lang=de|en, sonst aus der letzten Wahl, sonst Deutsch.
// Statische Texte im HTML tragen data-t="schluessel" (Text) oder data-t-html="schluessel" (mit Links).

const SPRACHEN = ["de", "en"];

// Versionsnummer aus <meta name="app-version"> (gesetzt von skripte/version_setzen.py).
// Wird an Daten-Abrufe angehängt, damit der Browser keine veraltete Datei aus dem Zwischenspeicher nimmt.
const APP_VERSION = document.querySelector('meta[name="app-version"]')?.content || "";
const datei = (pfad) => (APP_VERSION ? `${pfad}?v=${APP_VERSION}` : pfad);

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
    "nav.verteilen": "Verteilen",
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
    "treemap.zurueck.weitere": "← Zurück",
    "treemap.weitere.ep": "Weitere {n} Einzelpläne",
    "treemap.weitere.kapitel": "Weitere {n} Kapitel",
    "treemap.titel.weitere": "Kleinere Einzelpläne",
    "treemap.weitere.knopf": "{name}: zusammen {betrag} →",
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
    "aufruf.titel": "Was würdest du entscheiden?",
    "aufruf.text": "Übernimm im Spiel das Finanzministerium für sechs Runden. Oder verteil das Geld frei auf 14 Bereiche und finde heraus, was gesetzlich festgelegt ist.",
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

    "nav.spielen": "Spielen",
    "hero.knopf.spiel": "Spiel starten →",
    "aufruf.spiel": "Spiel starten →",
    "aufruf.frei": "Frei umschichten",
    "spiel.titel": "Haushaltsspiel",
    "spiel.beschreibung": "Übernimm das Finanzministerium: sechs Runden, sechs Entscheidungen zum Bundeshaushalt 2026.",
    "spiel.dachzeile": "Haushaltsspiel · 2026",
    "spiel.ueberschrift": "Du entscheidest über den Haushalt",
    "spiel.einleitung": "Du übernimmst das Finanzministerium. In sechs Runden kommt jeweils eine neue Situation auf dich zu. Du wählst einen von drei Wegen und erfährst, was deine Entscheidung voraussetzt und wen sie betrifft. Startpunkt ist der Haushalt 2026 (Soll, Kernhaushalt).",
    "spiel.regeln.titel": "So geht's",
    "spiel.regel1": "Jede Runde geht auf: Wer mehr ausgibt, muss woanders kürzen oder Kredite aufnehmen.",
    "spiel.regel2": "Das Spiel bewertet nicht. Es zeigt dir Fakten zu deinen Entscheidungen: welche Gesetze betroffen wären, wen eine Kürzung trifft und was die Schuldenbremse erlaubt.",
    "spiel.regel3": "Vereinfachung: Einnahmen bleiben gleich, Folgen für die Wirtschaft berechnet das Spiel nicht.",
    "spiel.start": "Spiel starten",
    "spiel.status.runde": "Runde",
    "spiel.status.ausgaben": "Ausgaben 2026",
    "spiel.status.kredite": "Zusätzliche Kredite",
    "spiel.status.gesetze": "Nötige Gesetzesänderungen",
    "spiel.runde": "Runde {n} von {m}",
    "spiel.hintergrund": "Hintergrund",
    "spiel.frage": "Wofür entscheidest du dich?",
    "spiel.rueckmeldung": "Was deine Entscheidung bedeutet",
    "spiel.betroffen": "Wer das Geld bekommt",
    "spiel.kredit.weniger": "Du nimmst {betrag} weniger Kredite auf.",
    "spiel.kredit.ausnahme": "Das ist erlaubt: Ausgaben für Verteidigung und Hilfe für angegriffene Staaten über 1 % der Wirtschaftsleistung zählen nicht für die Schuldenbremse. Für neue Kredite fallen in den Folgejahren Zinsen an.",
    "spiel.kredit.regel": "Die Schuldenbremse erlaubt 2026 Kredite von 40,4 Mrd. €, und diese Grenze ist im Haushaltsplan schon ganz ausgeschöpft. Mehr Kredite wären nur möglich, wenn die Mehrheit der Mitglieder des Bundestags eine Notlage beschließt, etwa nach einer Naturkatastrophe. Für neue Kredite fallen in den Folgejahren Zinsen an.",
    "spiel.nichts": "Du hast nichts verändert.",
    "spiel.weiter": "Nächste Runde →",
    "spiel.auswertung": "Zur Auswertung →",
    "spiel.ende.titel": "Dein Haushalt 2026",
    "spiel.ende.ausgaben": "Ausgaben nach deinen Entscheidungen: {plan}. Laut Haushaltsplan (Soll): {soll}.",
    "spiel.ende.kredite.ausnahme": "davon für die Bereichsausnahme",
    "spiel.ende.kredite.regel": "davon über der Grenze der Schuldenbremse",
    "spiel.ende.gesetze": "Du hast gesetzlich gebundene Bereiche gekürzt: {namen}. Dafür müsste der Bundestag Gesetze ändern.",
    "spiel.ende.keinegesetze": "Du hast keinen gesetzlich gebundenen Bereich gekürzt. Deine Kürzungen könnte der Bundestag mit dem Haushalt beschließen.",
    "spiel.ende.notlage": "{betrag} deiner zusätzlichen Kredite liegen über der Grenze der Schuldenbremse. Dafür müsste der Bundestag eine Notlage beschließen.",
    "spiel.ende.zinsen": "Für deine zusätzlichen Kredite fallen in den kommenden Jahren Zinsen an. Die Höhe hängt vom Zinsniveau ab und ist hier nicht berechnet.",
    "spiel.ende.aenderungen": "Deine Änderungen gegenüber dem Soll 2026",
    "spiel.ende.entscheidungen": "Deine Entscheidungen",
    "spiel.ende.neutral": "Es gibt keine richtige oder falsche Lösung. Jede Entscheidung hat Folgen für andere Bereiche und für die Menschen, die von diesem Geld leben.",
    "spiel.nochmal": "Noch einmal spielen",
    "spiel.frei": "Frei umschichten",
    "spiel.quellen.schuldenbremse": "Schuldenbremse: Bundeshaushaltsplan 2026, Vorspann, Gesamtplan Teil II B (zulässige Kreditaufnahme 40,4 Mrd. €); <a href=\"https://www.gesetze-im-internet.de/gg/art_115.html\">Art. 115 Grundgesetz</a>.",
    "spiel.quellen.modell": "Die Situationen sind Annahmen zum Üben, keine Prognosen. Das Spiel berechnet keine Folgen für Wirtschaft oder Einnahmen.",

    "nav.hintergrund": "Hintergrund",
    "hg.titel": "Hintergrund zum Bundeshaushalt",
    "hg.beschreibung": "Woher kommt das Geld des Bundes, wovon hängt die Höhe des Haushalts ab, und wie hat er sich entwickelt?",
    "hg.dachzeile": "Hintergrund · Bundeshaushalt",
    "hg.ueberschrift": "Wie funktioniert der Bundeshaushalt?",
    "hg.einleitung": "Woher kommt das Geld, wer entscheidet über die Höhe, und wie hat sich der Haushalt seit 1969 entwickelt? Dazu zwei aktuelle Debatten.",
    "hg.einnahmen.titel": "Woher kommt das Geld?",
    "hg.einnahmen.text": "Der Haushalt muss ausgeglichen sein: Was der Bund ausgibt, muss er einnehmen oder sich leihen. 2026 plant er Einnahmen von {gesamt} (Soll, Kernhaushalt).",
    "hg.einnahmen.steuern": "Steuern",
    "hg.einnahmen.kredite": "Neue Kredite",
    "hg.einnahmen.sonstige": "Sonstige Einnahmen",
    "hg.einnahmen.sonstige.text": "zum Beispiel Lkw-Maut und Geld aus dem Wiederaufbaufonds der EU",
    "hg.steuern.titel": "Die größten Steuereinnahmen des Bundes (Soll 2026)",
    "hg.steuern.anteil": "Der Bund bekommt nur einen Teil aller Steuern. 2025 nahmen Bund, Länder und Gemeinden zusammen rund {alle} ein (Schätzung). Davon blieben dem Bund {bund} (Ist), also etwa {anteil}. Große Steuern wie Lohn- und Umsatzsteuer werden nach festen Regeln zwischen Bund, Ländern und Gemeinden aufgeteilt.",
    "hg.hoehe.titel": "Wovon hängt die Höhe ab?",
    "hg.k1.titel": "Wie viel Steuern hereinkommen",
    "hg.k1.text": "Die Steuereinnahmen hängen davon ab, wie viel Menschen verdienen und Unternehmen einnehmen, wie viel gekauft wird und was in den Steuergesetzen steht. Zweimal im Jahr schätzen Fachleute, wie viel Steuern zu erwarten sind.",
    "hg.k2.titel": "Wie viel Kredit erlaubt ist",
    "hg.k2.text": "Die Schuldenbremse im Grundgesetz begrenzt neue Schulden. 2026 sind {zulaessig} erlaubt. Ausgaben für Verteidigung und einige Sicherheitsbereiche über 1 % der Wirtschaftsleistung zählen nicht mit, 2026 sind das {abzug}. Deshalb plant der Bund insgesamt {nka} neue Kredite (Soll).",
    "hg.k3.titel": "Was gesetzlich festgelegt ist",
    "hg.k3.text": "Ein großer Teil der Ausgaben steht in Gesetzen, etwa die Zuschüsse an die Rentenversicherung oder das Grundsicherungsgeld. Diese Ausgaben ändern sich nur, wenn auch die Gesetze geändert werden.",
    "hg.k3.verweis": "Probier es im Umschicht-Modus aus.",
    "hg.k4.titel": "Wer entscheidet",
    "hg.k4.text": "Die Bundesregierung beschließt einen Entwurf. Der Bundestag berät ihn, ändert ihn oft und beschließt ihn als Haushaltsgesetz. Der Bundesrat kann dazu Stellung nehmen.",
    "hg.k5.titel": "Soll und Ist",
    "hg.k5.text": "Soll ist der Plan, Ist das tatsächlich ausgegebene Geld. Für 2025 waren {soll25} geplant, ausgegeben wurden {ist25}.",
    "hg.geschichte.titel": "So hat sich der Haushalt entwickelt",
    "hg.geschichte.text": "Ausgaben des Bundes in Mrd. € (Ist, 2026 Soll, 2027 Entwurf). Die Beträge sind nicht um die Inflation bereinigt. Werte vor 2002 sind von D-Mark in Euro umgerechnet.",
    "hg.geschichte.ausgaben": "Ausgaben",
    "hg.geschichte.kredite": "davon mit neuen Krediten bezahlt",
    "hg.geschichte.kredite.kurz": "Neue Kredite",
    "hg.geschichte.ereignis": "besondere Zeiträume (Nummern unten)",
    "hg.geschichte.steuern": "Steuern",
    "hg.geschichte.tipp": "Tipp auf einen Balken, um die Werte zu sehen.",
    "hg.geschichte.info": "{jahr} ({art}): Ausgaben {ausgaben}, davon mit neuen Krediten bezahlt {kredite} ({anteil}). Steuereinnahmen {steuern}.",
    "hg.art.Ist": "Ist",
    "hg.art.Soll": "Soll",
    "hg.art.Entwurf": "Entwurf",
    "hg.geschichte.tabelle": "Alle Werte als Tabelle",
    "hg.geschichte.jahr": "Jahr",
    "hg.geschichte.luecke": "Vor 2015 zeigt die Quelle nur jedes fünfte Jahr. Für 2019 enthalten die verwendeten Quellen keinen Ist-Wert.",
    "hg.bis": "bis",
    "hg.debatten.titel": "Aktuelle Debatten",
    "hg.debatten.text": "Zwei Themen, über die gerade viel gestritten wird. Hier stehen Fakten und die wichtigsten Positionen, ohne Bewertung.",
    "hg.debatte.stand": "Stand: Oktober 2026",
    "hg.debatte.gut": "Gut zu wissen",
    "hg.debatte.weitere": "Weitere Quellen",
    "hg.quellen.hinweis": "Einnahmen 2025 und 2026: Bundeshaushaltsplan, Soll. Die Quellen der Debatten stehen direkt bei den Abschnitten.",

    "kapitel.posten": "Größte Posten (Soll 2026)",
    "kapitel.arten": "Wofür das Geld ausgegeben wird",
    "kapitel.hinweis": "Das Kapitel hat {n} Posten (Titel). Die Anteile beziehen sich auf alle positiven Beträge 2026. Postennamen wie im Haushaltsplan.",
    "art.personal": "Personal (Gehälter, Pensionen)",
    "art.sach": "Sachausgaben, Beschaffung und Zinsen",
    "art.zuschuesse": "Zuschüsse und Zahlungen an andere",
    "art.bau": "Bauprojekte",
    "art.investitionen": "Investitionen, Darlehen und Beteiligungen",
    "art.besondere": "Sonstige Finanzierungsposten",
    "art.sonstige": "Sonstiges",
    "titel.buergergeld": "(seit Juli 2026 Grundsicherungsgeld)",

    "hero.entwurf": "Für 2027 plant die Bundesregierung {betrag}. Das ist ein Entwurf, der Bundestag hat ihn noch nicht beschlossen.",
    "details.entwurf27": "Entwurf 2027",
    "details.entwurf.fehlt": "nicht im Entwurf",
    "kapitel.ba27": "Laut Entwurf 2027 fallen {betrag} dieses Kapitels (von {gesamt}) unter die Bereichsausnahme der Schuldenbremse.",
    "quellen.entwurf": "Entwurf 2027: Regierungsentwurf zum Bundeshaushalt 2027, vom Kabinett am 6. Juli 2026 beschlossen, vom Bundestag noch nicht beschlossen, <a href=\"https://www.bundeshaushalt.de/\">bundeshaushalt.de</a>; <a href=\"https://www.bundestag.de/presse/hib/kurzmeldungen-1205070\">Bundestag: Haushaltsentwurf 2027 zugeleitet</a>.",

    "suche.label": "Im Haushalt suchen",
    "suche.platzhalter": "z. B. Elterngeld, Bundeswehr, Ukraine",
    "suche.anzahl": "{n} Treffer",
    "suche.anzahl.eins": "1 Treffer",
    "suche.mehr": "{n} Treffer, die {m} wichtigsten werden gezeigt. Gib weitere Wörter ein, um einzugrenzen.",
    "suche.keine": "Keine Treffer. Probier ein anderes Wort. Suchst du nach einem Land? Ausgaben wie Entwicklungszusammenarbeit oder humanitäre Hilfe sind im Haushaltsplan meist nicht nach Ländern aufgeteilt, sondern stehen in allgemeinen Posten. Versuch zum Beispiel „Zusammenarbeit“ oder „humanitäre Hilfe“.",
    "suche.ep": "Einzelplan {nr}",
    "suche.kapitel": "Kapitel {nr}",
    "suche.titel": "Posten {nr}",
    "suche.anlage": "nicht im Kernhaushalt",
    "suche.markiert": "Dein Suchtreffer: {name}: {betrag} (Soll 2026)",
    "suche.hinweis.en": "",

    "ua.titel": "Ukraine-Hilfe im Haushalt",
    "ua.einleitung": "Im Kernhaushalt 2026 stehen {n} Posten mit Bezug zur Ukraine, zusammen {summe} (Soll). 2025 waren es {summe25}, im Entwurf 2027 sind {summe27} vorgesehen. Fast alles davon ist Militärhilfe.",
    "ua.posten": "Posten",
    "ua.summe": "Zusammen",
    "ua.hinweis.programm": "Die Liste enthält den Posten für die Militärhilfe und alle Posten mit „Ukraine“ im Namen. Der Posten zu den KfW-Garantien betrifft ein gemeinsames Programm für die Ukraine, Belarus und Russland.",
    "ua.aufschluesselung.titel": "Warum die Militärhilfe nicht aufgeschlüsselt ist",
    "ua.aufschluesselung.text": "Die Militärhilfe ist im Haushaltsplan ein einziger Posten. Er nennt die Ukraine nicht beim Namen, sondern gilt für „völkerrechtswidrig angegriffene Staaten“. Wofür das Geld genau ausgegeben wird, steht nicht im Plan. Damit werden unter anderem Lieferungen der Industrie bezahlt. Bis April 2025 veröffentlichte die Bundesregierung eine Liste der gelieferten Waffen und Ausrüstung. Seit Mai 2025 tut sie das nicht mehr. Bundeskanzler Merz begründete das damit, dass Russland aus den Angaben keine Vorteile ziehen soll.",
    "ua.fehlt.titel": "Was nicht als Ukraine-Posten erkennbar ist",
    "ua.fehlt.1": "Kosten für Geflüchtete aus der Ukraine, zum Beispiel im Grundsicherungsgeld. Der Haushalt weist sie nicht nach Herkunftsland getrennt aus.",
    "ua.fehlt.2": "Humanitäre Hilfe im Ausland, die im Haushalt nicht nach Ländern aufgeteilt ist.",
    "ua.fazit": "Den gesamten Umfang der deutschen Unterstützung für die Ukraine kann man aus dem Bundeshaushalt deshalb nicht vollständig ablesen.",
  },

  en: {
    "marke": "Federal Budget <span>explained</span>",
    "nav.ueberblick": "Overview",
    "nav.verteilen": "Rebalance",
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
    "treemap.zurueck.weitere": "← Back",
    "treemap.weitere.ep": "{n} more budget sections",
    "treemap.weitere.kapitel": "{n} more chapters",
    "treemap.titel.weitere": "Smaller budget sections",
    "treemap.weitere.knopf": "{name}: {betrag} in total →",
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
    "aufruf.titel": "What would you decide?",
    "aufruf.text": "Take over the finance ministry in the game for six rounds. Or split the money freely across 14 areas and find out what is fixed by law.",
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

    "nav.spielen": "Play",
    "hero.knopf.spiel": "Start the game →",
    "aufruf.spiel": "Start the game →",
    "aufruf.frei": "Rebalance freely",
    "spiel.titel": "Budget game",
    "spiel.beschreibung": "Take over the finance ministry: six rounds, six decisions on Germany's 2026 federal budget.",
    "spiel.dachzeile": "Budget game · 2026",
    "spiel.ueberschrift": "You decide on the budget",
    "spiel.einleitung": "You take over the finance ministry. In each of six rounds a new situation comes up. You choose one of three paths and find out what your decision requires and who it affects. The starting point is the 2026 budget (Soll, core budget).",
    "spiel.regeln.titel": "How it works",
    "spiel.regel1": "Every round has to balance: if you spend more, you have to cut elsewhere or borrow.",
    "spiel.regel2": "The game does not judge. It shows you facts about your decisions: which laws would be affected, who a cut hits and what the debt brake allows.",
    "spiel.regel3": "Simplification: revenue stays the same, and the game does not calculate effects on the economy.",
    "spiel.start": "Start the game",
    "spiel.status.runde": "Round",
    "spiel.status.ausgaben": "Spending 2026",
    "spiel.status.kredite": "Additional borrowing",
    "spiel.status.gesetze": "Laws that need changing",
    "spiel.runde": "Round {n} of {m}",
    "spiel.hintergrund": "Background",
    "spiel.frage": "What do you choose?",
    "spiel.rueckmeldung": "What your decision means",
    "spiel.betroffen": "Who gets the money",
    "spiel.kredit.weniger": "You borrow {betrag} less.",
    "spiel.kredit.ausnahme": "This is allowed: spending on defence and aid for attacked states above 1% of economic output does not count towards the debt brake. New borrowing means interest payments in the following years.",
    "spiel.kredit.regel": "In 2026 the debt brake allows borrowing of €40.4bn, and the budget plan already uses this limit in full. More borrowing would only be possible if a majority of the members of the Bundestag declares an emergency, for example after a natural disaster. New borrowing means interest payments in the following years.",
    "spiel.nichts": "You did not change anything.",
    "spiel.weiter": "Next round →",
    "spiel.auswertung": "See your results →",
    "spiel.ende.titel": "Your 2026 budget",
    "spiel.ende.ausgaben": "Spending after your decisions: {plan}. In the budget plan (Soll): {soll}.",
    "spiel.ende.kredite.ausnahme": "of which for the exemption",
    "spiel.ende.kredite.regel": "of which above the debt brake limit",
    "spiel.ende.gesetze": "You cut areas that are fixed by law: {namen}. The Bundestag would have to change laws for this.",
    "spiel.ende.keinegesetze": "You did not cut any area that is fixed by law. The Bundestag could decide your cuts as part of the budget.",
    "spiel.ende.notlage": "{betrag} of your additional borrowing is above the debt brake limit. The Bundestag would have to declare an emergency for this.",
    "spiel.ende.zinsen": "Your additional borrowing means interest payments in the coming years. The amount depends on interest rates and is not calculated here.",
    "spiel.ende.aenderungen": "Your changes compared with the 2026 budget",
    "spiel.ende.entscheidungen": "Your decisions",
    "spiel.ende.neutral": "There is no right or wrong answer. Every decision has consequences for other areas and for the people who depend on this money.",
    "spiel.nochmal": "Play again",
    "spiel.frei": "Rebalance freely",
    "spiel.quellen.schuldenbremse": "Debt brake: Federal budget plan 2026, preface, overall plan part II B (permitted borrowing €40.4bn, in German); <a href=\"https://www.gesetze-im-internet.de/gg/art_115.html\">Article 115 Basic Law</a> (in German).",
    "spiel.quellen.modell": "The situations are assumptions for practice, not forecasts. The game does not calculate effects on the economy or on revenue.",

    "nav.hintergrund": "Background",
    "hg.titel": "Background on the federal budget",
    "hg.beschreibung": "Where does the federal government's money come from, what determines the size of the budget, and how has it developed?",
    "hg.dachzeile": "Background · Federal budget",
    "hg.ueberschrift": "How does the federal budget work?",
    "hg.einleitung": "Where does the money come from, who decides how much is spent, and how has the budget developed since 1969? Plus two current debates.",
    "hg.einnahmen.titel": "Where does the money come from?",
    "hg.einnahmen.text": "The budget has to balance: whatever the federal government spends, it has to take in or borrow. For 2026 it plans revenue of {gesamt} (Soll, core budget).",
    "hg.einnahmen.steuern": "Taxes",
    "hg.einnahmen.kredite": "New borrowing",
    "hg.einnahmen.sonstige": "Other revenue",
    "hg.einnahmen.sonstige.text": "for example the truck toll and money from the EU recovery fund",
    "hg.steuern.titel": "The federal government's largest tax revenues (2026 budget)",
    "hg.steuern.anteil": "The federal government only receives part of all taxes. In 2025, federal, state and local government together collected around {alle} (estimate). The federal government kept {bund} of this (outturn), about {anteil}. Large taxes such as wage tax and VAT are split between federal, state and local government according to fixed rules.",
    "hg.hoehe.titel": "What determines the amount?",
    "hg.k1.titel": "How much tax comes in",
    "hg.k1.text": "Tax revenue depends on how much people earn and companies make, how much is bought, and what the tax laws say. Twice a year, experts estimate how much tax to expect.",
    "hg.k2.titel": "How much borrowing is allowed",
    "hg.k2.text": "The debt brake in the Basic Law limits new debt. In 2026, {zulaessig} is allowed. Spending on defence and some security areas above 1% of economic output does not count; in 2026 that is {abzug}. That is why the federal government plans {nka} of new borrowing in total (Soll).",
    "hg.k3.titel": "What is fixed by law",
    "hg.k3.text": "A large share of spending is set in laws, for example the grants to the pension insurance or basic income support. This spending only changes if the laws are changed too.",
    "hg.k3.verweis": "Try it in the rebalancing mode.",
    "hg.k4.titel": "Who decides",
    "hg.k4.text": "The federal government adopts a draft. The Bundestag debates it, often amends it and passes it as the budget act. The Bundesrat can comment on it.",
    "hg.k5.titel": "Planned and actual",
    "hg.k5.text": "“Soll” is the plan, “Ist” is the money actually spent. For 2025, {soll25} was planned and {ist25} was spent.",
    "hg.geschichte.titel": "How the budget has developed",
    "hg.geschichte.text": "Federal spending in € billion (outturn, 2026 planned, 2027 draft). Amounts are not adjusted for inflation. Values before 2002 are converted from Deutschmarks to euros.",
    "hg.geschichte.ausgaben": "Spending",
    "hg.geschichte.kredite": "of which paid for with new borrowing",
    "hg.geschichte.kredite.kurz": "New borrowing",
    "hg.geschichte.ereignis": "special periods (numbers below)",
    "hg.geschichte.steuern": "Taxes",
    "hg.geschichte.tipp": "Tap a bar to see the values.",
    "hg.geschichte.info": "{jahr} ({art}): spending {ausgaben}, of which paid for with new borrowing {kredite} ({anteil}). Tax revenue {steuern}.",
    "hg.art.Ist": "outturn",
    "hg.art.Soll": "planned",
    "hg.art.Entwurf": "draft",
    "hg.geschichte.tabelle": "All values as a table",
    "hg.geschichte.jahr": "Year",
    "hg.geschichte.luecke": "Before 2015 the source only shows every fifth year. The sources used contain no outturn for 2019.",
    "hg.bis": "to",
    "hg.debatten.titel": "Current debates",
    "hg.debatten.text": "Two topics that are hotly debated right now. Here are the facts and the main positions, without judgement.",
    "hg.debatte.stand": "As of October 2026",
    "hg.debatte.gut": "Good to know",
    "hg.debatte.weitere": "More sources",
    "hg.quellen.hinweis": "Revenue 2025 and 2026: federal budget plan, Soll. The sources for the debates are given directly with each section.",

    "kapitel.posten": "Largest items (2026 budget)",
    "kapitel.arten": "What the money is spent on",
    "kapitel.hinweis": "This chapter has {n} items (titles). Shares refer to all positive amounts in 2026. Item names in the official German wording.",
    "art.personal": "Staff (salaries, pensions)",
    "art.sach": "Running costs, procurement and interest",
    "art.zuschuesse": "Grants and payments to others",
    "art.bau": "Construction",
    "art.investitionen": "Investment, loans and holdings",
    "art.besondere": "Other financing items",
    "art.sonstige": "Other",
    "titel.buergergeld": "(basic income support since July 2026)",

    "hero.entwurf": "For 2027 the federal government plans {betrag}. This is a draft that the Bundestag has not yet passed.",
    "details.entwurf27": "Draft 2027",
    "details.entwurf.fehlt": "not in the draft",
    "kapitel.ba27": "According to the 2027 draft, {betrag} of this chapter (out of {gesamt}) falls under the debt brake exemption.",
    "quellen.entwurf": "Draft 2027: government draft of the 2027 federal budget, adopted by the cabinet on 6 July 2026, not yet passed by the Bundestag, <a href=\"https://www.bundeshaushalt.de/\">bundeshaushalt.de</a>; <a href=\"https://www.bundestag.de/presse/hib/kurzmeldungen-1205070\">Bundestag: 2027 budget draft submitted</a> (in German).",

    "suche.label": "Search the budget",
    "suche.platzhalter": "e.g. Ukraine, pension, Bundeswehr",
    "suche.anzahl": "{n} results",
    "suche.anzahl.eins": "1 result",
    "suche.mehr": "{n} results; the {m} most important are shown. Add more words to narrow it down.",
    "suche.keine": "No results. Try another word. Looking for a country? Spending such as development cooperation or humanitarian aid is usually not split by country in the budget plan but listed in general items. Try, for example, “Zusammenarbeit” (cooperation) or “humanitäre Hilfe” (humanitarian aid).",
    "suche.ep": "Budget section {nr}",
    "suche.kapitel": "Chapter {nr}",
    "suche.titel": "Item {nr}",
    "suche.anlage": "not in the core budget",
    "suche.markiert": "Your search result: {name}: {betrag} (2026 budget)",
    "suche.hinweis.en": "Item and chapter names are in German. Common English terms such as Ukraine, pension or housing benefit also work.",

    "ua.titel": "Aid to Ukraine in the budget",
    "ua.einleitung": "The 2026 core budget contains {n} items related to Ukraine, totalling {summe} (Soll). In 2025 it was {summe25}; the 2027 draft plans {summe27}. Almost all of it is military aid.",
    "ua.posten": "Item",
    "ua.summe": "Total",
    "ua.hinweis.programm": "The list contains the military aid item and all items with “Ukraine” in their name. The item on KfW guarantees concerns a joint programme for Ukraine, Belarus and Russia.",
    "ua.aufschluesselung.titel": "Why the military aid is not broken down",
    "ua.aufschluesselung.text": "In the budget plan, military aid is a single item. It does not name Ukraine but applies to “states attacked in violation of international law”. The plan does not say exactly what the money is spent on. Among other things, it pays for deliveries from industry. Until April 2025 the federal government published a list of the weapons and equipment delivered. Since May 2025 it no longer does so. Chancellor Merz said the reason was that Russia should not gain any advantage from the information.",
    "ua.fehlt.titel": "What cannot be identified as Ukraine items",
    "ua.fehlt.1": "Costs for refugees from Ukraine, for example in basic income support. The budget does not show them separately by country of origin.",
    "ua.fehlt.2": "Humanitarian aid abroad, which the budget does not split by country.",
    "ua.fazit": "The full extent of German support for Ukraine therefore cannot be read completely from the federal budget.",
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
  let text = TEXTE[SPRACHE][schluessel] ?? TEXTE.de[schluessel];
  if (text === undefined) {
    // Nie den internen Schlüssel anzeigen; Hinweis nur für die Entwicklung
    console.warn(`Text fehlt: ${schluessel}`);
    return "";
  }
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
  for (const knoten of document.querySelectorAll("[data-t-placeholder]")) knoten.setAttribute("placeholder", t(knoten.dataset.tPlaceholder));
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
