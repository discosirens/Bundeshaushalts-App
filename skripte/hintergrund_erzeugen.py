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

SUMME_SOLL = {"2025": 502_546_135, "2026": 524_540_138, "2027": 555_435_744}  # 2027: Regierungsentwurf
DATEIEN = {"2025": "HH_2025_ALL.csv", "2026": "HH_2026_ALL.csv", "2027": "HH_2027_RegE_ALL.csv"}

QUELLE_BMF_2019 = {
    "titel": "BMF-Monatsbericht August 2019, Gesamtübersicht über die Entwicklung des Bundeshaushalts 1969 bis 2020",
    "url": "https://www.bundesfinanzministerium.de/Monatsberichte/2019/08/Inhalte/Kapitel-6-Statistiken/6-1-08-gesamtuebersicht-entwicklung-bundeshaushalt.html",
}
QUELLE_BMF_2026 = {
    "titel": "BMF-Monatsbericht August 2026, Bundeshaushalt Gesamtübersicht 2020 bis 2025",
    "url": "https://www.bundesfinanzministerium.de/Monatsberichte/Ausgabe/2026/08/Inhalte/Kapitel-5-Statistiken/5-1-s07-bundeshaushalt-gesamtuebersicht.html",
}
QUELLE_PLAN = {"titel": "Bundeshaushaltsplan 2026 (Soll), Vorspann", "url": "https://www.bundeshaushalt.de/"}
QUELLE_ENTWURF = {"titel": "Regierungsentwurf zum Bundeshaushalt 2027 (noch nicht beschlossen)", "url": "https://www.bundeshaushalt.de/"}

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


# Ukraine-Hilfe: der Ertüchtigungstitel (nennt die Ukraine nicht im Namen) und alle Titel mit "Ukraine" im Namen
UKRAINE_TITEL = {("6002", "68706")}
UKRAINE_EN = {
    ("6002", "68706"): "Capacity building for states attacked in violation of international law (military aid)",
    ("6002", "68721"): "German share of the interest subsidy for EU macro-financial assistance to Ukraine",
    ("0904", "68711"): "Energy and economic policy cooperation with Ukraine",
    ("0903", "68701"): "Energy and economic policy cooperation with Ukraine (new chapter from 2027)",
    ("6002", "67106"): "Losses from guarantees for the KfW special programme Ukraine, Belarus, Russia",
    ("2310", "89602"): "Obligations from an untied energy loan to Ukraine",
    ("6002", "67111"): "KfW expenses related to support for Ukraine",
    ("1010", "68307"): "Aid to mitigate the consequences of the war in Ukraine (agriculture)",
    ("0502", "54627"): "Expenses related to the Ukraine Recovery Conference 2024",
    ("2310", "54601"): "Expenses related to the Ukraine Recovery Conference 2024",
    ("6002", "67621"): "Securing the German share of an EU macro-financial loan",
    ("6002", "68707"): "Financial support for Ukraine",
}


def ukraine_posten():
    werte = {}
    for jahr in ("2025", "2026", "2027"):
        with open(ROH / DATEIEN[jahr], encoding="utf-8-sig", newline="") as f:
            for z in csv.DictReader(f, delimiter=";"):
                z = {k.strip(): (v or "").strip() for k, v in z.items() if k is not None}
                schluessel = (z["kapitel"], z["titel"])
                if z["einahmen-ausgaben"] != "A":
                    continue
                if schluessel in UKRAINE_TITEL or "Ukraine" in z["titel-text"]:
                    eintrag = werte.setdefault(schluessel, {
                        "kapitel": z["kapitel"], "titel": z["titel"], "einzelplan": z["einzelplan"],
                        "de": z["titel-text"].replace('"', ""), "en": UKRAINE_EN.get(schluessel, z["titel-text"]),
                        "2025": 0, "2026": 0, "2027": 0,
                    })
                    eintrag[jahr] = int(z["soll"] or 0)
                    if jahr != "2027":
                        eintrag["de"] = z["titel-text"].replace('"', "")  # Name laut Haushalt 2026
    posten = [p for p in werte.values() if p["2025"] or p["2026"] or p["2027"]]
    return sorted(posten, key=lambda p: -p["2026"])


# ---------------------------------------------------------------------------
# Verteidigung: Bundeshaushalt und NATO-Definition
# ---------------------------------------------------------------------------

QUELLE_NATO = {"titel": "NATO: Defence Expenditure of NATO Countries (2014-2025), Juni 2025, Tabellen 1 und 3 (daten/roh/def-exp-2025-en.pdf)",
               "url": "https://www.nato.int/cps/en/natohq/topics_49198.htm"}
QUELLE_FINANZBERICHT = {"titel": "BMF: Finanzbericht 2027, Abschnitt 1.4.3.5 Verteidigung einschließlich NATO-Quote",
                        "url": "https://www.bundesfinanzministerium.de/Content/DE/Downloads/Broschueren_Bestellservice/finanzbericht-2027.pdf?__blob=publicationFile&v=3"}

# Deutschland nach NATO-Definition: Jahr -> (Mio. Euro, laufende Preise; Anteil am realen BIP in %; Art)
NATO_DEUTSCHLAND = {
    2014: (34_749, 1.16, "Ist"),
    2019: (46_936, 1.33, "Ist"),
    2020: (51_392, 1.49, "Ist"),
    2021: (52_431, 1.43, "Ist"),
    2022: (58_266, 1.48, "Ist"),
    2023: (67_621, 1.61, "Ist"),
    2024: (86_638, 2.00, "Schätzung"),
}

# Finanzplan des Bundes: Einzelplan 14 in Mrd. Euro (Finanzbericht 2027)
FINANZPLAN_EP14 = {2028: 153.92, 2029: 162.94, 2030: 183.66}


def pruefe_nato_pdf():
    """Vergleicht die Werte oben mit dem NATO-PDF, falls pdftotext verfügbar ist."""
    import shutil
    import subprocess
    if not shutil.which("pdftotext"):
        return "nicht geprüft (pdftotext fehlt)"
    text = subprocess.run(["pdftotext", "-raw", str(ROH / "def-exp-2025-en.pdf"), "-"],
                          capture_output=True).stdout.decode("latin-1")
    zeile = next((z for z in text.splitlines() if z.startswith("Germany* (Euros)")), "")
    werte = [int(w.replace(",", "")) for w in zeile.split()[2:] if w.replace(",", "").isdigit()]
    jahre = list(range(2014, 2014 + len(werte)))
    abweichung = [j for j, w in zip(jahre, werte) if j in NATO_DEUTSCHLAND and NATO_DEUTSCHLAND[j][0] != w]
    return "stimmt mit dem PDF überein" if werte and not abweichung else f"ABWEICHUNG bei {abweichung or 'Lesen'}"


def verteidigung():
    haushalt = []
    for jahr in ("2025", "2026", "2027"):
        ep14 = sv = 0
        with open(ROH / DATEIEN[jahr], encoding="utf-8-sig", newline="") as f:
            for z in csv.DictReader(f, delimiter=";"):
                z = {k.strip(): (v or "").strip() for k, v in z.items() if k is not None}
                if z["einahmen-ausgaben"] != "A":
                    continue
                if z["einzelplan"] == "14" and not z["kapitel-text"].startswith("Anlage"):
                    ep14 += int(z["soll"] or 0)
                if z["kapitel"] == "1491":
                    sv += int(z["soll"] or 0)
        haushalt.append({"jahr": int(jahr), "art": "Entwurf" if jahr == "2027" else "Soll",
                         "ep14_mrd": round(ep14 / 1e6, 1), "sondervermoegen_mrd": round(sv / 1e6, 1)})
    for jahr, wert in FINANZPLAN_EP14.items():
        haushalt.append({"jahr": jahr, "art": "Finanzplan", "ep14_mrd": wert, "sondervermoegen_mrd": None})
    return {
        "haushalt": haushalt,
        "nato": [{"jahr": j, "mrd": round(m / 1000, 1), "anteil_bip": a, "art": art}
                 for j, (m, a, art) in sorted(NATO_DEUTSCHLAND.items())],
        "quote_2026": {"kern": 2.7, "sicherheit": 1.5, "art": "Schätzung", "quelle": QUELLE_FINANZBERICHT},
        "ziel": {"kern": 3.5, "sicherheit": 1.5, "deutschland_bis": 2029},
        "quellen": [QUELLE_NATO, QUELLE_FINANZBERICHT, QUELLE_PLAN, QUELLE_ENTWURF],
        "pruefung": pruefe_nato_pdf(),
    }


# ---------------------------------------------------------------------------
# Ukraine Support Tracker (Kiel Institut): gesamte deutsche Hilfe seit Kriegsbeginn
# ---------------------------------------------------------------------------

TRACKER = "bc5059ba-ef38-4f08-988a-746a03905a6c-Ukraine_Support_Tracker__Release_31.xlsx"
QUELLE_TRACKER = {"titel": "Kiel Institut für Weltwirtschaft: Ukraine Support Tracker, Release 31, Stand 31. August 2026 (Blatt Country Summary (€))",
                  "url": "https://www.kielinstitut.de/research/topics/war-against-ukraine/ukraine-support-tracker/"}
QUELLE_TRACKER_DEF = {"titel": "Kiel Institut: Dataset Documentation, Definitionen von Zusage und Zuweisung (PDF)",
                      "url": "https://www.kielinstitut.de/fileadmin/Dateiverwaltung/Subject_Dossiers_Topics/Ukraine/Ukraine_Support_Tracker/Dataset_Documentation.pdf"}


def tracker_deutschland():
    import sys
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    import xlsx_lesen
    z, texte, blaetter = xlsx_lesen.oeffne(ROH / TRACKER)
    alle = list(xlsx_lesen.zeilen(z, texte, blaetter["Country Summary (€)"]))
    kopf = next(r for r in alle if r.get("B") == "Country")
    # Manche Überschriften kommen doppelt vor (Mrd. Euro und % BIP): jeweils die erste Spalte (Mrd. Euro) nehmen
    spalte = {}
    for buchstabe, name in kopf.items():
        spalte.setdefault(name, buchstabe)
    zeile = next(r for r in alle if r.get("B") == "Germany")
    wert = lambda name: round(float(zeile[spalte[name]]), 2)
    # Plausibilität: Summe der drei Arten muss die Gesamtsumme ergeben
    for art in ("allocations", "commitments"):
        teile = sum(wert(f"{x} {art}") for x in ("Military", "Humanitarian", "Financial"))
        if abs(teile - wert(f"Total bilateral {art}")) > 0.05:
            raise ValueError(f"Tracker: {art} passen nicht zusammen")
    return {
        "zugewiesen": {"militaer": wert("Military allocations"), "humanitaer": wert("Humanitarian allocations"),
                       "finanziell": wert("Financial allocations"), "gesamt": wert("Total bilateral allocations"),
                       "eu_anteil": wert("Share in total EU allocations")},
        "zugesagt": {"militaer": wert("Military commitments"), "humanitaer": wert("Humanitarian commitments"),
                     "finanziell": wert("Financial commitments"), "gesamt": wert("Total bilateral commitments"),
                     "eu_anteil": wert("Share in total EU commitments")},
        "einheit": "Mrd. Euro, aufsummiert seit Kriegsbeginn",
        "stand": "31. August 2026",
        "quellen": [QUELLE_TRACKER, QUELLE_TRACKER_DEF],
    }


def lese_einnahmen(jahr):
    zeilen = []
    with open(ROH / DATEIEN[jahr], encoding="utf-8-sig", newline="") as f:
        for z in csv.DictReader(f, delimiter=";"):
            z = {k.strip(): (v or "").strip() for k, v in z.items() if k is not None}
            if z["einahmen-ausgaben"] == "E" and not z["kapitel-text"].startswith("Anlage"):
                z["soll"] = int(z["soll"] or 0)
                zeilen.append(z)
    return zeilen


def main():
    fehler = []
    einnahmen = {}
    for jahr in ("2025", "2026", "2027"):
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
    e27 = einnahmen["2027"]
    zeitreihe.append({
        "jahr": 2027, "art": "Entwurf",
        "ausgaben": round(SUMME_SOLL["2027"] / 1e6, 1),
        "steuern": round(e27["steuern"] / 1e6, 1),
        "nettokredit": round(e27["kredite"] / 1e6, 1),
        "quelle": QUELLE_ENTWURF,
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
        "verteidigung": verteidigung(),
        "ukraine": {
            "hinweis": "Soll in Tausend Euro. Titel 6002/687 06 plus alle Titel mit 'Ukraine' im Namen.",
            "posten": ukraine_posten(),
            "tracker": tracker_deutschland(),
            "quellen": [
                {"titel": "Bundesregierung: Militärische Unterstützungsleistungen für die Ukraine, Stand 17. April 2025 (PDF)",
                 "url": "https://www.bundesregierung.de/breg-de/bundesregierung/2054526-2054526.pdf"},
                {"titel": "ZDFheute, Merz: Waffenlieferungen an Ukraine künftig nicht mehr öffentlich",
                 "url": "https://www.zdfheute.de/politik/ausland/bundeskanzler-friedrich-merz-stopp-waffenlieferungen-veroeffentlichung-ukraine-krieg-russland-100.html"},
                {"titel": "Bundesregierung: Bundeshaushalt 2026",
                 "url": "https://www.bundesregierung.de/breg-de/aktuelles/bundeshaushalt-2026-2374030"},
                QUELLE_PLAN,
            ],
        },
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
