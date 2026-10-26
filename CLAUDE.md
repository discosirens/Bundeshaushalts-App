# Projektregeln: Bundeshaushalts-App

## Zweck und Haltung
- Politische Bildung zum deutschen Bundeshaushalt. Zielgruppe: Laien und Schulen.
- Neutral darstellen, keine Wertungen.

## Sprache der App
- Deutsch, einfach, konkret. Die App duzt (Zielgruppe auch Jugendliche).
- Keine Gedankenstriche als Satzzeichen, keine Floskeln. Gilt auch für die englische Fassung.
- Die App ist zweisprachig (Deutsch und Englisch, Umschalter oben, `?lang=en`). Jeder neue Text braucht
  beide Sprachen: Oberflächentexte in `js/sprache.js`, Bereichstexte in `skripte/bereiche_erzeugen.py`
  (`BEREICHE_EN`, `TITEL_EN`). Amtliche Kapitelnamen bleiben auf Deutsch, mit Hinweis.

## Zahlen
- Jede Zahl in der App braucht Jahr, Art (Soll, Ist, Schätzung) und Quelle.
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

## Zusammenarbeit
- Maßgeblich ist das GitHub-Repository https://github.com/discosirens/Bundeshaushalts-App.
  Vor jeder Arbeit den Stand von GitHub holen, nach jeder Änderung committen und hochladen.
- Commits anonym unter `discosirens` mit der GitHub-Noreply-Adresse, nie mit Klarnamen oder privater E-Mail.
- Ich bin kein Entwickler: Erkläre am Ende jeder Sitzung kurz, was du geändert hast.
