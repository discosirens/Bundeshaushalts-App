"""Hilfe beim Jahreswechsel (siehe JAHRESWECHSEL.md).

Aufruf (im Projektordner):  py skripte/jahr_pruefen.py [JAHR]

1. Prüft, ob die Jahre in skripte/jahre.py, js/sprache.js und den erzeugten Daten übereinstimmen.
2. Listet alle Stellen in von Hand gepflegten Texten und Werten, die JAHR nennen. Ohne Angabe ist JAHR
   das Vorjahr: Nach der Umstellung ist das das alte Hauptjahr, und genau diese Stellen müssen geprüft werden.
"""

import json
import re
import sys
from pathlib import Path

from jahre import ENTWURFSJAHR, HAUPTJAHR, VORJAHR

PROJEKT = Path(__file__).resolve().parent.parent

# Von Hand gepflegt: Texte und Werte, die nicht automatisch aus den Rohdaten kommen
HANDGEPFLEGT = [
    "js/sprache.js",
    "js/app.js",
    "js/suche.js",
    "skripte/bereiche_erzeugen.py",
    "skripte/hintergrund_erzeugen.py",
    "daten/runden.json",
    "daten/kapitel_texte.json",
    "daten/debatten.json",
    "daten/glossar.json",
    "daten/verfahren.json",
]


def jahre_pruefen():
    fehler = []
    js = (PROJEKT / "js/sprache.js").read_text(encoding="utf-8")
    for name, wert in (("HAUPTJAHR", HAUPTJAHR), ("VORJAHR", VORJAHR), ("ENTWURFSJAHR", ENTWURFSJAHR)):
        m = re.search(rf"^const {name} = (null|\"(\d{{4}})\");", js, re.M)
        js_wert = None if not m or m.group(1) == "null" else m.group(2)
        if js_wert != wert:
            fehler.append(f"{name}: skripte/jahre.py sagt {wert}, js/sprache.js sagt {js_wert}")
    haushalt = json.loads((PROJEKT / "daten/haushalt.json").read_text(encoding="utf-8"))
    if haushalt.get("jahre", {}).get("haupt") != HAUPTJAHR:
        fehler.append("daten/haushalt.json ist veraltet: py skripte/haushalt_zu_json.py ausführen")
    bereiche = json.loads((PROJEKT / "daten/bereiche.json").read_text(encoding="utf-8"))
    if bereiche.get("jahr") != HAUPTJAHR:
        fehler.append("daten/bereiche.json ist veraltet: py skripte/bereiche_erzeugen.py ausführen")
    hintergrund = json.loads((PROJEKT / "daten/hintergrund.json").read_text(encoding="utf-8"))
    if hintergrund.get("jahre", {}).get("haupt") != HAUPTJAHR:
        fehler.append("daten/hintergrund.json ist veraltet: py skripte/hintergrund_erzeugen.py ausführen")
    return fehler


def stellen(jahr):
    """Zeilen mit dem Jahr als eigene Zahl (nicht Teil einer längeren Zahl, z. B. in Adressen)."""
    muster = re.compile(rf"(?<![\d/]){jahr}(?![\d/])")
    for datei in HANDGEPFLEGT:
        pfad = PROJEKT / datei
        if not pfad.exists():
            continue
        treffer = [(nr, zeile.strip()) for nr, zeile in enumerate(pfad.read_text(encoding="utf-8").splitlines(), 1)
                   if muster.search(zeile)]
        if treffer:
            yield datei, treffer


def main():
    jahr = sys.argv[1] if len(sys.argv) > 1 else VORJAHR
    print(f"Jahre: Hauptjahr {HAUPTJAHR}, Vorjahr {VORJAHR}, Entwurf {ENTWURFSJAHR or 'keiner'}")
    fehler = jahre_pruefen()
    for f in fehler:
        print("FEHLER:", f)
    if not fehler:
        print("Jahre in Skripten, App und Daten stimmen überein.")

    print(f"\nVon Hand gepflegte Stellen, die {jahr} nennen (prüfen, ob sie noch stimmen):")
    gesamt = 0
    for datei, treffer in stellen(jahr):
        print(f"\n{datei} ({len(treffer)})")
        for nr, zeile in treffer:
            print(f"  {nr:>5}: {zeile[:150]}")
        gesamt += len(treffer)
    print(f"\n{gesamt} Stellen.")
    sys.exit(1 if fehler else 0)


if __name__ == "__main__":
    main()
