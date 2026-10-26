"""Erzeugt daten/haushalt.json aus den CSV-Rohdaten des Bundeshaushalts.

Aufruf (im Projektordner):  py skripte/haushalt_zu_json.py

Ergebnis: Ausgaben nach Einzelplan -> Kapitel -> Titel, jeweils für 2025 und 2026,
alle Beträge in Tausend Euro (wie in den Rohdaten).
"""

import csv
import json
import re
import sys
from pathlib import Path

PROJEKT = Path(__file__).resolve().parent.parent
ROH = PROJEKT / "daten" / "roh"
ZIEL = PROJEKT / "daten" / "haushalt.json"

JAHRE = {
    "2025": ROH / "HH_2025_ALL.csv",
    "2026": ROH / "HH_2026_ALL.csv",
}

# Summe der Ausgaben laut Gesamtplan 2026 (Tausend Euro), zum Abgleich.
GESAMTPLAN_2026 = 524_540_138

# Hauptgruppen des Gruppierungsplans: erste Ziffer der Titelnummer.
HAUPTGRUPPEN = {
    "4": "Personalausgaben",
    "5": "Sächliche Verwaltungsausgaben und Schuldendienst",
    "6": "Zuweisungen und Zuschüsse (ohne Investitionen)",
    "7": "Baumaßnahmen",
    "8": "Sonstige Ausgaben für Investitionen",
    "9": "Besondere Finanzierungsausgaben",
}


def kapitelname(text):
    """Entfernt Formatierungsreste wie '" (0690)"' am Ende des Kapitelnamens."""
    text = text.replace('"', "").strip()
    return re.sub(r"\s*\(\d{4}\)$", "", text)


def ist_anlage(kapiteltext):
    """Kapitel 'Anlage ...' sind Wirtschaftspläne von Sondervermögen, EU-Abführungen u. Ä.
    Sie werden im Haushaltsplan nur nachrichtlich abgedruckt und zählen nicht zum Kernhaushalt."""
    return kapiteltext.startswith("Anlage")


def lese_ausgaben(pfad):
    with open(pfad, encoding="utf-8-sig", newline="") as f:
        zeilen = list(csv.DictReader(f, delimiter=";"))
    # Die Spalte heißt in den Rohdaten "soll " (mit Leerzeichen); sicherheitshalber normalisieren.
    # Zeilen mit Titelgruppe haben am Ende ein überzähliges leeres Feld (Schlüssel None) - ignorieren.
    zeilen = [{k.strip(): (v or "").strip() for k, v in z.items() if k is not None} for z in zeilen]
    return [z for z in zeilen if z["einahmen-ausgaben"] == "A"]


def main():
    einzelplaene = {}

    for jahr, pfad in JAHRE.items():
        for z in lese_ausgaben(pfad):
            betrag = int(z["soll"] or 0)
            ep = einzelplaene.setdefault(z["einzelplan"], {
                "nr": z["einzelplan"],
                "name": z["einzelplan-text"],
                "kapitel": {},
            })
            ep["name"] = z["einzelplan-text"]  # neuester Name gewinnt (2026 wird zuletzt gelesen)

            kap_name = kapitelname(z["kapitel-text"])
            kap = ep["kapitel"].setdefault(z["kapitel"], {
                "nr": z["kapitel"],
                "name": kap_name,
                "anlage": ist_anlage(kap_name),
                "titel": {},
            })
            kap["name"] = kap_name

            titel = kap["titel"].setdefault(z["titel"], {
                "nr": z["titel"],
                "name": z["titel-text"],
                "art": HAUPTGRUPPEN.get(z["titel"][0], "Sonstige"),
                "funktion": z["funktion"],
                "titelgruppe": None,
                "soll": {j: None for j in JAHRE},
            })
            titel["name"] = z["titel-text"]
            titel["funktion"] = z["funktion"]
            if z["titelgruppe"]:
                titel["titelgruppe"] = {"nr": z["titelgruppe"], "name": z["tgr-text"]}
            titel["soll"][jahr] = betrag

    # Summen bilden. Einzelplan-Summen enthalten nur den Kernhaushalt (ohne Anlage-Kapitel).
    def summe(eintraege, jahr):
        return sum(e["soll"][jahr] or 0 for e in eintraege)

    summen = {j: {"kernhaushalt": 0, "anlagen": 0} for j in JAHRE}
    ergebnis = []
    for ep in sorted(einzelplaene.values(), key=lambda e: e["nr"]):
        kapitel_liste = []
        for kap in sorted(ep["kapitel"].values(), key=lambda k: k["nr"]):
            kap["titel"] = sorted(kap["titel"].values(), key=lambda t: t["nr"])
            kap["soll"] = {j: summe(kap["titel"], j) for j in JAHRE}
            for j in JAHRE:
                summen[j]["anlagen" if kap["anlage"] else "kernhaushalt"] += kap["soll"][j]
            kapitel_liste.append(kap)
        ep["kapitel"] = kapitel_liste
        ep["soll"] = {j: summe([k for k in kapitel_liste if not k["anlage"]], j) for j in JAHRE}
        ergebnis.append(ep)

    daten = {
        "einheit": "Tausend Euro",
        "hinweis": "Einzelplan-Summen und 'summen.kernhaushalt' ohne Kapitel mit anlage=true. "
                   "soll=null bedeutet: Titel gab es in diesem Jahr nicht.",
        "summen": summen,
        "einzelplaene": ergebnis,
    }
    ZIEL.write_text(json.dumps(daten, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")

    print(f"Geschrieben: {ZIEL.relative_to(PROJEKT)}")
    for j in JAHRE:
        s = summen[j]
        print(f"{j}: Kernhaushalt {s['kernhaushalt']:>13,} | Anlagen {s['anlagen']:>13,} | "
              f"alles {s['kernhaushalt'] + s['anlagen']:>13,}  (Tsd. Euro)".replace(",", "."))

    abweichung = summen["2026"]["kernhaushalt"] - GESAMTPLAN_2026
    if abweichung == 0:
        print("Prüfung 2026: Kernhaushalt stimmt exakt mit dem Gesamtplan überein.")
    else:
        print(f"Prüfung 2026: ABWEICHUNG von {abweichung:,} Tsd. Euro zum Gesamtplan!".replace(",", "."))
        sys.exit(1)


if __name__ == "__main__":
    main()
