# Projektregeln: Bundeshaushalts-App

## Zweck und Haltung
- Politische Bildung zum deutschen Bundeshaushalt. Zielgruppe: junge politisch Interessierte und interessierte
  Erwachsene, ohne Vorwissen.
- Neutral darstellen, keine Wertungen.

## Sprache der App
- Deutsch, einfach, konkret. Die App duzt (Zielgruppe auch Jugendliche).
- Keine Gedankenstriche als Satzzeichen, keine Floskeln. Gilt auch für die englische Fassung.
- Die App ist zweisprachig (Deutsch und Englisch, Umschalter oben, `?lang=en`). Jeder neue Text braucht
  beide Sprachen: Oberflächentexte in `js/sprache.js`, Bereichstexte in `skripte/bereiche_erzeugen.py`
  (`BEREICHE_EN`, `TITEL_EN`). Amtliche Kapitelnamen bleiben auf Deutsch, mit Hinweis.

## Zahlen
- Jede Zahl in der App braucht Jahr, Art (Soll, Ist, Schätzung, Entwurf) und Quelle.
- Der Regierungsentwurf 2027 (`HH_2027_RegE_ALL.csv`) ist noch nicht beschlossen: immer als „Entwurf 2027“
  kennzeichnen, nie als Soll. Die Treemap und alle Anteile beziehen sich weiter auf das Soll 2026.
- Sondervermögen werden immer getrennt vom Kernhaushalt dargestellt und nie einfach addiert.
  Bei Themen wie Verteidigung wird die Summe aus Kernhaushalt und zugehörigem Sondervermögen
  zusätzlich ausgewiesen, mit Hinweis auf mögliche Doppelzählung.
- Bereichsausnahme der Schuldenbremse (Art. 115 Abs. 2 GG): Welche Ausgaben dazugehören, richtet sich
  nach dem Vorspann zum Bundeshaushaltsplan 2026 (Gesamtplan Teil II A, `daten/roh/Vorspann_2026.pdf`).
  Ausgenommen ist nur der Teil über 1 % des BIP. 2026: 100,9 Mrd. € Ausgaben der Bereichsausnahme,
  davon 57,6 Mrd. € ausgenommen (Schwelle 43,3 Mrd. €). Nie den Gesamtbetrag als „ausgenommen“ darstellen.

## Technik
- Statische Web-App ohne Server (HTML, CSS, JavaScript).
- Startseite ist `index.html` im Hauptordner, weil GitHub Pages genutzt wird.
- Muss auf dem Handy gut funktionieren.

## Daten
- Rohdaten in `daten/roh/` werden nie verändert, nur gelesen.
- Beträge in den Rohdaten und in `daten/haushalt.json` sind in Tausend Euro.
- Kernhaushalt = alle Ausgaben ohne die Kapitel, deren Name mit „Anlage“ beginnt
  (Sondervermögen, EU-Abführungen u. a.). Details in der README.
- `daten/haushalt.json` wird mit `py skripte/haushalt_zu_json.py` erzeugt, nicht von Hand bearbeitet.
- `daten/runden.json` (Haushaltsspiel) wird von Hand gepflegt, Deutsch und Englisch. Jede Option muss
  aufgehen (Mehrausgaben minus Kürzungen minus Kredite = Ziel der Runde; das Spiel prüft das beim Laden).
  Über alle Runden hinweg stehen Kürzungen in verschiedenen politischen Richtungen zur Wahl.
  Rückmeldungen nur aus belegten Daten, keine erfundenen Wirtschaftseffekte.
- `daten/hintergrund.json` wird mit `py skripte/hintergrund_erzeugen.py` erzeugt (Einnahmen aus den Rohdaten,
  Zeitreihe aus BMF-Tabellen mit Quelle je Jahr).
- `daten/debatten.json` (aktuelle Debatten) wird von Hand gepflegt: Positionen immer zuschreiben, nie bewerten,
  jede Zahl mit Quelle, Stand-Datum je Debatte in `stand_datum` mitführen. Bei neuen Entwicklungen (Gesetze, Zahlen) aktualisieren.
- `daten/kapitel_texte.json`: handgeschriebene Erklärungen der 30 größten Kapitel (Deutsch und Englisch).
  Die App zeigt sie nur bei `"freigegeben": true`; Freigabe erst nach Prüfung durch mich.
- Suche: Posten mit unklaren amtlichen Namen bekommen in `js/suche.js` zusätzliche Suchwörter (Deutsch und
  Englisch), z. B. „Ukraine“ für die Ertüchtigungshilfe (Kap. 6002 Tit. 687 06).
- Externe Daten (NATO, Kiel Institut) sind andere Zahlenarten als das Haushalts-Soll: immer getrennt zeigen,
  mit Stand und Quelle, nie mit Haushaltszahlen addieren. Neue Tracker-Version: Dateiname in
  `skripte/hintergrund_erzeugen.py` (TRACKER) anpassen und das Skript ausführen.
- `daten/laender.json` wird mit `py skripte/laender_erzeugen.py` aus OECD-Daten (DAC2A) erzeugt: Ist-Auszahlungen
  in Mio. US-Dollar, alle staatlichen Quellen, nicht das Haushalts-Soll. Immer getrennt vom Haushalt zeigen,
  nie in Euro umrechnen oder addieren. Neue OECD-Daten: als neue Rohdatei ablegen, Dateinamen im Skript anpassen.
- `daten/verfahren.json` (Zeitstrahl) wird von Hand gepflegt: Termine aus dem Zeitplan des Bundestages. Ob ein
  Schritt erledigt ist, berechnet die App aus dem heutigen Datum; verschobene Termine hier anpassen. Für ein neues
  Haushaltsjahr die Schritte mit den neuen Terminen ersetzen.
- `daten/glossar.json` (Begriffe) wird von Hand gepflegt: neutral, höchstens drei kurze Sätze, Quelle bei
  Rechtsbegriffen. `muster` sind die Wortformen, die im Text anklickbar werden; sehr häufige Wörter mit `"auto": false`.
- Sicherheit: Jede Seite hat eine Content Security Policy (meta-Tag). Neue externe Quellen für Skripte oder Daten
  müssen dort eingetragen werden, sonst blockiert der Browser sie. Die D3-Bibliothek hat eine Prüfsumme
  (`integrity`); bei einer neuen D3-Version die Prüfsumme neu berechnen und mit der Angabe von cdnjs vergleichen.
  Keine Inline-Skripte und keine style-Attribute im HTML (die CSP erlaubt sie nicht; Stil per CSS oder element.style).
- Das Bürgergeld heißt seit 1. Juli 2026 Grundsicherungsgeld; im Haushaltsplan 2026 steht noch „Bürgergeld“.

## Zusammenarbeit
- Maßgeblich ist das GitHub-Repository https://github.com/discosirens/Bundeshaushalts-App.
  Vor jeder Arbeit den Stand von GitHub holen, nach jeder Änderung committen und hochladen.
- Vor jedem Hochladen von Änderungen an HTML, CSS, JavaScript oder Daten `py skripte/version_setzen.py`
  ausführen. Es hängt eine neue Versionsnummer an alle Dateien, damit Browser keine veralteten Dateien
  aus dem Zwischenspeicher mit neuen mischen (GitHub Pages speichert 10 Minuten zwischen).
- Commits anonym unter `discosirens` mit der GitHub-Noreply-Adresse, nie mit Klarnamen oder privater E-Mail.
- Ich bin kein Entwickler: Erkläre am Ende jeder Sitzung kurz, was du geändert hast.
