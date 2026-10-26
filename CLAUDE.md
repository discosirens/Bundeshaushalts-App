# Projektregeln: Bundeshaushalts-App

## Zweck und Haltung
- Politische Bildung zum deutschen Bundeshaushalt. Zielgruppe: Laien und Schulen.
- Neutral darstellen, keine Wertungen.

## Sprache der App
- Deutsch, einfach, konkret.
- Keine Gedankenstriche als Satzzeichen, keine Floskeln.

## Zahlen
- Jede Zahl in der App braucht Jahr, Art (Soll, Ist, Schätzung) und Quelle.
- Sondervermögen werden immer getrennt vom Kernhaushalt dargestellt und nie einfach addiert.
  Bei Themen wie Verteidigung wird die Summe aus Kernhaushalt und zugehörigem Sondervermögen
  zusätzlich ausgewiesen, mit Hinweis auf mögliche Doppelzählung.

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
