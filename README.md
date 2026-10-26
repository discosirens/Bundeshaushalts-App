# Bundeshaushalts-App
Den Bundeshaushalt verständlich machen

Ziel: eine statische Web-App (HTML, CSS, JavaScript, kein Server), die den deutschen
Bundeshaushalt für Laien verständlich darstellt. Online: https://discosirens.github.io/Bundeshaushalts-App/
(Deutsch und Englisch, Umschalter oben).

## Ordnerstruktur

```
index.html          Startseite: Gesamtsumme, Treemap nach Einzelplan und Kapitel
umschichten.html    Umschicht-Modus: Geld zwischen 14 Bereichen verschieben
spiel.html          Haushaltsspiel: sechs Runden als Finanzministerin oder Finanzminister
hintergrund.html    Hintergrund: Einnahmen, Höhe des Haushalts, Verlauf seit 1969, aktuelle Debatten
css/stil.css        Gestaltung beider Seiten (hell und dunkel)
js/sprache.js       alle Oberflächentexte Deutsch/Englisch, Zahlenformate, Sprachwahl
js/app.js           Logik der Startseite
js/umschichten.js   Logik des Umschicht-Modus
js/spiel.js         Logik des Haushaltsspiels
js/hintergrund.js   Logik der Hintergrund-Seite (Verlaufsgrafik als SVG)
daten/
  roh/              Rohdaten, unverändert (CSV, PDF, Excel)
  haushalt.json     aufbereitete Ausgaben 2025 und 2026 (wird vom Skript erzeugt)
  bereiche.json     14 Bereiche mit Erklärungen auf Deutsch und Englisch (wird vom Skript erzeugt)
  runden.json       Situationen und Optionen des Haushaltsspiels (von Hand gepflegt)
  hintergrund.json  Einnahmen 2025/2026 und Zeitreihe seit 1969 (wird vom Skript erzeugt)
  debatten.json     aktuelle Debatten mit Positionen und Quellen (von Hand gepflegt)
  kapitel_texte.json Erklärungen der 30 größten Kapitel (von Hand gepflegt, mit Freigabe-Schalter)
skripte/
  haushalt_zu_json.py
  bereiche_erzeugen.py
  hintergrund_erzeugen.py
```

## Die CSV-Dateien `HH_2025_ALL.csv` und `HH_2026_ALL.csv`

- Format: UTF-8, Trennzeichen Semikolon, Texte in Anführungszeichen.
- Jede Zeile ist ein **Titel**, also die kleinste Einheit des Haushalts (ein einzelner Posten,
  z. B. „Elterngeld“ oder „Zinsen für Bundesanleihen“).
- Alle Beträge sind in **Tausend Euro**. `1100` bedeutet also 1,1 Mio. Euro.
- 2025: 7.411 Zeilen, 2026: 7.450 Zeilen. Einnahmen und Ausgaben stehen gemeinsam in einer Datei.

Der Haushalt ist hierarchisch aufgebaut: **Einzelplan** (meist ein Ministerium) →
**Kapitel** (ein Aufgabenbereich oder eine Behörde) → **Titel** (ein einzelner Posten).

| Spalte | Bedeutung | Beispiel |
|---|---|---|
| `einzelplan` | Nummer des Einzelplans (2-stellig). Meist ein Ministerium, aber auch z. B. `32` Bundesschuld oder `60` Allgemeine Finanzverwaltung. 26 Einzelpläne. | `11` |
| `einzelplan-text` | Name des Einzelplans | Bundesministerium für Arbeit und Soziales |
| `einahmen-ausgaben` | `E` = Einnahme, `A` = Ausgabe (Schreibfehler „einahmen“ steht so in den Daten) | `A` |
| `einahmen-ausgaben-text` | Art der Einnahme/Ausgabe (z. B. „Personalausgaben“). **Nur bei rund einem Drittel der Zeilen ausgefüllt**, deshalb nicht verlässlich. Die Art lässt sich stattdessen aus der ersten Ziffer der Titelnummer ablesen (siehe unten). | Personalausgaben |
| `kapitel` | Nummer des Kapitels (4-stellig, die ersten zwei Ziffern = Einzelplan) | `1101` |
| `kapitel-text` | Name des Kapitels. Bei einigen Kapiteln mit Formatierungsresten wie `" (0690)"` am Ende. | Leistungen nach dem Zweiten und Dritten Buch Sozialgesetzbuch |
| `titel` | Nummer des Titels (5-stellig). Die ersten 3 Ziffern sind die **Gruppe** nach dem bundesweiten Gruppierungsplan (= *was für eine Art* Ausgabe), die letzten 2 eine laufende Nummer. Eindeutig ist ein Posten nur zusammen mit dem Kapitel. | `68112` |
| `funktion` | Funktionskennziffer (3-stellig) nach dem Funktionenplan: *wofür* das Geld ausgegeben wird (z. B. Soziales, Verteidigung, Bildung), quer über alle Ministerien. | `251` |
| `titel-text` | Bezeichnung des Postens | Bürgergeld |
| `flex` | `ja`/`nein`: Ob die Ausgabe „flexibilisiert“ ist, d. h. nicht verbrauchtes Geld ins nächste Jahr übertragen oder zwischen Posten verschoben werden darf. Bei Einnahmen leer. | `nein` |
| `seite` | Seitenzahl im gedruckten Haushaltsplan | `13` |
| `soll ` | **Der Betrag** in Tausend Euro, den das Parlament für das Jahr bewilligt hat („Soll“). Der Spaltenname enthält ein Leerzeichen am Ende. Kann negativ sein (z. B. Titel 972xx „Globale Minderausgaben“: pauschale Einsparvorgaben). | `28050000` |
| `titelgruppe` | Nummer einer Titelgruppe: mehrere Titel, die inhaltlich zusammengehören (z. B. ein Förderprogramm). Meist leer. | `57` |
| `tgr-text` | Name der Titelgruppe | Versorgung der Beamtinnen und Beamten … |

Hinweis: Zeilen mit Titelgruppe haben am Zeilenende ein überzähliges, immer leeres Feld.
Die Datei für 2027 (`HH_2027_RegE_ALL.csv`, Regierungsentwurf) hat zusätzlich die Spalte
`bereichsausnahme`.

### Art der Ausgabe aus der Titelnummer (erste Ziffer)

| Ziffer | Bedeutung |
|---|---|
| 4 | Personalausgaben |
| 5 | Sächliche Verwaltungsausgaben, Militärische Beschaffungen, Schuldendienst (Zinsen) |
| 6 | Zuweisungen und Zuschüsse (ohne Investitionen), z. B. Rentenzuschuss, Grundsicherungsgeld (bis Juni 2026 Bürgergeld) |
| 7 | Baumaßnahmen |
| 8 | Sonstige Investitionen |
| 9 | Besondere Finanzierungsausgaben (u. a. globale Minderausgaben) |

(Ziffern 0–3 sind Einnahmen.)

## Das Skript: `daten/haushalt.json` erzeugen

```
py skripte/haushalt_zu_json.py
```

Das Skript liest die beiden CSV-Dateien, nimmt nur die Ausgaben und schreibt
`daten/haushalt.json` mit dieser Struktur:

```
{
  "einheit": "Tausend Euro",
  "summen": { "2025": {"kernhaushalt": …, "anlagen": …}, "2026": {…} },
  "einzelplaene": [
    { "nr": "11", "name": "…", "soll": {"2025": …, "2026": …},
      "kapitel": [
        { "nr": "1101", "name": "…", "anlage": false, "soll": {…},
          "titel": [
            { "nr": "68112", "name": "Bürgergeld", "art": "Zuweisungen und Zuschüsse …",
              "funktion": "…", "titelgruppe": null, "soll": {"2025": …, "2026": …} }
          ] } ] } ]
}
```

- `soll: null` bei einem Titel heißt: Diesen Posten gab es in dem Jahr nicht (neu oder entfallen).
- `anlage: true` markiert Kapitel, die nicht zum Kernhaushalt zählen (siehe nächster Abschnitt).
- Die Summen der Einzelpläne enthalten nur den Kernhaushalt.

## Prüfung: Summe der Ausgaben 2026

Laut Gesamtplan betragen die Ausgaben 2026 **524.540.138 Tsd. Euro** (≈ 524,5 Mrd. Euro).

Zählt man **alle** Ausgabezeilen der CSV zusammen, kommt man auf 694.268.209 Tsd. Euro, also
rund **169,7 Mrd. Euro zu viel**.

**Grund:** Die CSV enthält auch Kapitel, deren Name mit „Anlage“ beginnt. Diese sind im
Haushaltsplan nur zur Information abgedruckt und gehören nicht zum Kernhaushalt:

| Kapitel | Inhalt | 2026 (Tsd. Euro) |
|---|---|---:|
| 6093 | Sondervermögen Infrastruktur und Klimaneutralität | 58.067.704 |
| 6090 | Eigenmittel der EU (Abführungen an die EU, werden direkt von den Steuereinnahmen abgezogen) | 43.613.000 |
| 6092 | Klima- und Transformationsfonds | 34.803.623 |
| 1491 | Sondervermögen Bundeswehr | 25.509.765 |
| 1090 | EU-Mittel für Landwirtschaft (Marktordnung) | 4.445.700 |
| 6098 | Sondervermögen Aufbauhilfe 2021 | 2.500.000 |
| 1490 | NATO-Sicherheits-Investitionsprogramm | 416.000 |
| 1092, 1091 | Verwaltungshaushalte von BLE und BfR | 372.279 |
| übrige Anlagen | (Betrag 0) | 0 |
| **Summe** | | **169.728.071** |

Sondervermögen sind eigene „Nebenhaushalte“ mit eigenen Krediten. Zum Teil bekommen sie Geld aus
dem Kernhaushalt (diese Zuweisung steht dort als normaler Titel), würden also bei
Addition doppelt gezählt.

**Ohne die Anlage-Kapitel ergibt sich exakt 524.540.138 Tsd. Euro – keine Abweichung.**
Für 2025 ergeben sich auf dieselbe Weise 502.546.135 Tsd. Euro.

Das Skript führt diese Prüfung bei jedem Lauf automatisch durch und meldet einen Fehler,
falls die Summe nicht stimmt.
