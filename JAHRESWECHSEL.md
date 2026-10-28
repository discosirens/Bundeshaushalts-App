# Jahreswechsel: Umstellung auf ein neues Haushaltsjahr

Die App zeigt als Hauptzahl immer den **beschlossenen** Haushalt (Soll) eines Jahres, das „Hauptjahr“.
Dazu kommen ein Vergleichsjahr („Vorjahr“) und, solange es einen gibt, der Regierungsentwurf für das
nächste Jahr („Entwurfsjahr“). Die drei Jahre stehen an zwei Stellen:

- `skripte/jahre.py` (für die Skripte, die die Daten erzeugen)
- `js/sprache.js`, ganz oben: `HAUPTJAHR`, `VORJAHR`, `ENTWURFSJAHR` (für die App)

In Oberflächentexten stehen die Jahre als Platzhalter `{haushaltsjahr}`, `{vorjahr}` und `{entwurfsjahr}`.
Texte, die neben dem Jahr auch von Hand eingetragene Zahlen enthalten (zum Beispiel die erlaubten Kredite),
nennen das Jahr bewusst fest. Diese Stellen müssen beim Wechsel einzeln geprüft werden.

Beispiel unten: Wechsel von 2026 auf 2027.

## 1. Nach dem Beschluss im Bundestag (Ende November), solange die Datei noch fehlt

- [ ] Startseite: Hinweis, dass der Bundestag den Haushalt beschlossen hat und die beschlossenen Zahlen folgen
      (`hero.entwurf` und `quellen.entwurf` in `js/sprache.js`, Deutsch und Englisch).
- [ ] Den Entwurf genauer benennen: „Regierungsentwurf 2027 (vor den Änderungen des Bundestages)“, damit niemand
      die Entwurfszahlen für das Ergebnis hält (`details.entwurf` und die Texte mit `{entwurfsjahr}`).
- [ ] Zeitstrahl `daten/verfahren.json`: Termine prüfen, verschobene Termine anpassen.
- [ ] Die Hauptzahlen bleiben beim Soll 2026, solange 2026 läuft.

**Falls der Haushalt bis 1. Januar nicht beschlossen ist:** Es gilt die vorläufige Haushaltsführung
(Art. 111 GG, steht im Glossar). Die App bleibt beim alten Hauptjahr und bekommt einen kurzen Hinweis.

## 2. Dateien besorgen

Vom Bundesfinanzministerium (bundeshaushalt.de), in `daten/roh/` ablegen (Rohdaten nie verändern):

- [ ] CSV des beschlossenen Haushalts, z. B. `HH_2027_ALL.csv` (gleiches Format wie `HH_2026_ALL.csv`)
- [ ] Vorspann zum Haushaltsplan, z. B. `Vorspann_2027.pdf` (Bereichsausnahme und Schuldenbremse)

## 3. Umstellen

**Jahre**
- [ ] `skripte/jahre.py`: `HAUPTJAHR = "2027"`, `VORJAHR = "2026"`, `ENTWURFSJAHR = None`.
      Bei `ROHDATEIEN` die neue Datei eintragen, bei `SUMMEN` die Summe des Kernhaushalts laut Gesamtplan.
- [ ] `js/sprache.js` oben: dieselben Jahre, `ENTWURFSJAHR = null`.
      Ohne Entwurf blendet die App die Entwurfs-Spalten und -Hinweise selbst aus.

**Von Hand übernommene Werte** (die Skripte brechen ab, solange diese nicht zum Hauptjahr passen)
- [ ] `skripte/bereiche_erzeugen.py`: `BA_JAHR`, `BA_SOLL`, `BA_SCHWELLE`, `BA_ABZUG` aus dem neuen Vorspann
      (Gesamtplan Teil II A). Prüfen, ob die Liste der IT-Titelgruppen (`BA_IT_TITELGRUPPEN`) noch stimmt.
- [ ] `skripte/hintergrund_erzeugen.py`: `SCHULDENBREMSE_JAHR` und `SCHULDENBREMSE` (Vorspann, Teil II B),
      NATO-Quote (`quote`), Finanzplan Verteidigung (`FINANZPLAN_EP14`), Steuern aller Ebenen.
- [ ] CLAUDE.md, Abschnitt „Zahlen“: Hauptjahr und die Werte der Bereichsausnahme aktualisieren.

**Daten neu erzeugen**
- [ ] `py skripte/haushalt_zu_json.py`
- [ ] `py skripte/bereiche_erzeugen.py`
- [ ] `py skripte/hintergrund_erzeugen.py`

**Handgeschriebene Texte prüfen**
- [ ] `py skripte/jahr_pruefen.py` ausführen. Es prüft, ob alle Jahresangaben zusammenpassen, und listet jede
      von Hand gepflegte Stelle, die noch das alte Jahr (jetzt das Vorjahr) nennt. Jede Stelle durchgehen:
      - `js/sprache.js`: z. B. erlaubte Kredite, Bereichsausnahme, Einwohnerzahl
      - `skripte/bereiche_erzeugen.py`: „Gut zu wissen“ und Erklärungen der 14 Bereiche (Deutsch und Englisch)
      - `daten/runden.json`: Spielrunden. Jede Option muss weiter aufgehen, das Spiel prüft das beim Laden.
      - `daten/kapitel_texte.json`: Erklärungen der größten Kapitel. Bis zur Prüfung `"freigegeben": false` setzen.
      - `daten/debatten.json`: Zahlen und `stand_datum`
- [ ] Einwohnerzahl: `EINWOHNER` in `js/app.js` und `quellen.einwohner`, falls es eine neue Zahl gibt.
- [ ] Suche: neue oder umbenannte Posten mit unklaren Namen bekommen Suchwörter in `js/suche.js`.

**Abschluss**
- [ ] App im Browser auf Handy und Computer ansehen (Deutsch und Englisch), Spiel einmal durchspielen.
- [ ] `py skripte/version_setzen.py`, committen, hochladen.

## 4. Im Lauf des Jahres

- [ ] Frühjahr: Ist-Zahlen des alten Jahres vom BMF in die Zeitreihe (`ZEITREIHE` in `skripte/hintergrund_erzeugen.py`).
- [ ] Juli: Regierungsentwurf für das nächste Jahr. CSV ablegen, `ENTWURFSJAHR` an beiden Stellen setzen,
      `ROHDATEIEN` und `SUMMEN` ergänzen, Daten neu erzeugen. Zeitstrahl `daten/verfahren.json` auf das neue
      Verfahren umstellen. Die Texte zum Entwurf aus Schritt 1 wieder auf „Entwurf“ zurücksetzen.
- [ ] Jederzeit: neuer NATO-Bericht, neue Version des Ukraine Support Trackers, neue OECD-Daten (siehe CLAUDE.md).
