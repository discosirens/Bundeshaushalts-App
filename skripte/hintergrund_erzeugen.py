"""Erzeugt daten/hintergrund.json für die Seite "Hintergrund".

Aufruf (im Projektordner):  py skripte/hintergrund_erzeugen.py

- Einnahmen 2025 und 2026 aus den Rohdaten (Kernhaushalt, Soll), Tausend Euro
- Zeitreihe der Ausgaben, Steuereinnahmen und Nettokreditaufnahme des Bundes (Mrd. Euro),
  von Hand übernommen aus den genannten BMF-Tabellen
"""

import csv
import json
import sys
from pathlib import Path

PROJEKT = Path(__file__).resolve().parent.parent
ROH = PROJEKT / "daten" / "roh"
ZIEL = PROJEKT / "daten" / "hintergrund.json"

SUMME_SOLL = {"2025": 502_546_135, "2026": 524_540_138}

QUELLE_BMF_2019 = {
    "titel": "BMF-Monatsbericht August 2019, Gesamtübersicht über die Entwicklung des Bundeshaushalts 1969 bis 2020",
    "url": "https://www.bundesfinanzministerium.de/Monatsberichte/2019/08/Inhalte/Kapitel-6-Statistiken/6-1-08-gesamtuebersicht-entwicklung-bundeshaushalt.html",
}
QUELLE_BMF_2026 = {
    "titel": "BMF-Monatsbericht August 2026, Bundeshaushalt Gesamtübersicht 2020 bis 2025",
    "url": "https://www.bundesfinanzministerium.de/Monatsberichte/Ausgabe/2026/08/Inhalte/Kapitel-5-Statistiken/5-1-s07-bundeshaushalt-gesamtuebersicht.html",
}
QUELLE_PLAN = {"titel": "Bundeshaushaltsplan 2026 (Soll), Vorspann", "url": "https://www.bundeshaushalt.de/"}

# Jahr: (Ausgaben, Steuereinnahmen, Nettokreditaufnahme) in Mrd. Euro, Ist-Ergebnisse.
# Bis 2001 von D-Mark in Euro umgerechnet (wie in der Quelle). Für 2019 liegt in diesen Quellen kein Ist vor.
ZEITREIHE = {
    1969: (42.1, 40.2, 0.0, QUELLE_BMF_2019),
    1975: (80.2, 61.0, 15.3, QUELLE_BMF_2019),
    1980: (110.3, 90.1, 13.9, QUELLE_BMF_2019),
    1985: (131.5, 105.5, 11.4, QUELLE_BMF_2019),
    1990: (194.4, 132.3, 23.9, QUELLE_BMF_2019),
    1995: (237.6, 187.2, 25.6, QUELLE_BMF_2019),
    2000: (244.4, 198.8, 23.8, QUELLE_BMF_2019),
    2005: (259.8, 190.1, 31.2, QUELLE_BMF_2019),
    2010: (303.7, 226.2, 44.0, QUELLE_BMF_2019),
    2015: (299.3, 281.7, 0.0, QUELLE_BMF_2019),
    2016: (310.6, 289.0, 0.0, QUELLE_BMF_2019),
    2017: (325.4, 309.4, 0.0, QUELLE_BMF_2019),
    2018: (336.7, 322.4, 0.0, QUELLE_BMF_2019),
    2020: (441.8, 283.3, 130.5, QUELLE_BMF_2026),
    2021: (556.6, 313.5, 215.4, QUELLE_BMF_2026),
    2022: (480.7, 337.2, 115.4, QUELLE_BMF_2026),
    2023: (457.1, 356.1, 27.2, QUELLE_BMF_2026),
    2024: (465.7, 375.0, 33.3, QUELLE_BMF_2026),
    2025: (493.3, 388.6, 66.9, QUELLE_BMF_2026),
}

EREIGNISSE = [
    {"von": 1990, "bis": 1995, "de": "Deutsche Einheit", "en": "German reunification"},
    {"von": 2009, "bis": 2010, "de": "Finanz- und Wirtschaftskrise", "en": "Financial and economic crisis"},
    {"von": 2015, "bis": 2018, "de": "Keine neuen Schulden", "en": "No new borrowing"},
    {"von": 2020, "bis": 2022, "de": "Corona-Pandemie und Energiekrise", "en": "COVID-19 pandemic and energy crisis"},
]

# Englische Namen der größten Steuern (Titel in Kap. 6001)
STEUER_EN = {
    "01501": "VAT",
    "01101": "Wage tax",
    "01601": "Import VAT",
    "01201": "Assessed income tax",
    "03103": "Energy tax",
    "01401": "Corporation tax",
    "03602": "Insurance tax",
    "03202": "Tobacco tax",
}


def lese_einnahmen(jahr):
    zeilen = []
    with open(ROH / f"HH_{jahr}_ALL.csv", encoding="utf-8-sig", newline="") as f:
        for z in csv.DictReader(f, delimiter=";"):
            z = {k.strip(): (v or "").strip() for k, v in z.items() if k is not None}
            if z["einahmen-ausgaben"] == "E" and not z["kapitel-text"].startswith("Anlage"):
                z["soll"] = int(z["soll"] or 0)
                zeilen.append(z)
    return zeilen


def main():
    fehler = []
    einnahmen = {}
    for jahr in ("2025", "2026"):
        zeilen = lese_einnahmen(jahr)
        gesamt = sum(z["soll"] for z in zeilen)
        if gesamt != SUMME_SOLL[jahr]:
            fehler.append(f"Einnahmen {jahr}: {gesamt:,} statt {SUMME_SOLL[jahr]:,}")
        # Hauptgruppe 0 = Steuern und steuerähnliche Abgaben; Kredite = Kap. 3201 Tit. 325 11
        steuern = sum(z["soll"] for z in zeilen if z["titel"].startswith("0"))
        kredite = sum(z["soll"] for z in zeilen if z["kapitel"] == "3201" and z["titel"] == "32511")
        groesste = sorted((z for z in zeilen if z["kapitel"] == "6001"), key=lambda z: -z["soll"])[:8]
        einnahmen[jahr] = {
            "gesamt": gesamt,
            "steuern": steuern,
            "kredite": kredite,
            "sonstige": gesamt - steuern - kredite,
            "groesste_steuern": [
                {"titel": z["titel"], "de": z["titel-text"].split(" (")[0], "en": STEUER_EN.get(z["titel"], z["titel-text"]),
                 "betrag": z["soll"]}
                for z in groesste
            ],
        }

    zeitreihe = [
        {"jahr": j, "art": "Ist", "ausgaben": a, "steuern": s, "nettokredit": n, "quelle": q}
        for j, (a, s, n, q) in sorted(ZEITREIHE.items())
    ]
    e26 = einnahmen["2026"]
    zeitreihe.append({
        "jahr": 2026, "art": "Soll",
        "ausgaben": round(SUMME_SOLL["2026"] / 1e6, 1),
        "steuern": round(e26["steuern"] / 1e6, 1),
        "nettokredit": round(e26["kredite"] / 1e6, 1),
        "quelle": QUELLE_PLAN,
    })

    daten = {
        "hinweis": "Einnahmen in Tausend Euro (Soll, Kernhaushalt). Zeitreihe in Mrd. Euro, nicht inflationsbereinigt.",
        "einnahmen": einnahmen,
        "steuern_alle_ebenen_2025": {
            "gesamt_mrd": 990.7, "art": "Schätzung",
            "quelle": {"titel": "BMF, Ergebnisse der 169. Steuerschätzung, Oktober 2025",
                       "url": "https://www.bundesfinanzministerium.de/Content/DE/Pressemitteilungen/Finanzpolitik/2025/10/2025-10-23-ergebnisse-der-169-steuerschaetzung.html"},
            "bund_mrd": 388.6, "bund_art": "Ist", "bund_quelle": QUELLE_BMF_2026,
        },
        "schuldenbremse_2026": {
            "zulaessig_mrd": 40.392, "nettokredit_mrd": 97.965, "abzug_bereichsausnahme_mrd": 57.573,
            "quelle": QUELLE_PLAN,
        },
        "zeitreihe": zeitreihe,
        "ereignisse": EREIGNISSE,
    }
    ZIEL.write_text(json.dumps(daten, ensure_ascii=False, indent=1), encoding="utf-8")

    print(f"Geschrieben: {ZIEL.relative_to(PROJEKT)}")
    for jahr, e in einnahmen.items():
        print(f"{jahr}: Steuern {e['steuern'] / 1e6:.1f} | Kredite {e['kredite'] / 1e6:.1f} | "
              f"Sonstige {e['sonstige'] / 1e6:.1f} | gesamt {e['gesamt'] / 1e6:.1f} Mrd. €")
    if fehler:
        print("FEHLER:\n  " + "\n  ".join(fehler))
        sys.exit(1)
    print("Prüfung bestanden: Einnahmen = Ausgaben laut Gesamtplan.")


if __name__ == "__main__":
    main()
