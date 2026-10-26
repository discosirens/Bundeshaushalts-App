"""Erzeugt daten/laender.json: deutsche Entwicklungsleistungen (ODA) nach Empfängerland.

Aufruf (im Projektordner):  py skripte/laender_erzeugen.py

Quelle: OECD, Tabelle DAC2A (Aid (ODA) disbursements to countries and regions), Geber Deutschland,
laufende Preise, Mio. US-Dollar, 2020 bis 2024. Rohdaten: daten/roh/oecd_dac2a_deutschland_2020-2024.csv,
abgerufen am 26.10.2026 über die OECD-Datenschnittstelle:
https://sdmx.oecd.org/public/rest/data/OECD.DCD.FSD,DSD_DAC2@DF_DAC2A,1.7/DEU..206+201+207+216+240.USD.V?startPeriod=2020&format=csvfilewithlabels

Diese Zahlen sind tatsächlich ausgezahlte Beträge (Ist) aus allen staatlichen Quellen, nicht das Soll
des Bundeshaushalts. Sie werden in der App getrennt gezeigt und nie mit Haushaltszahlen addiert.
"""

import csv
import json
import sys
from pathlib import Path

PROJEKT = Path(__file__).resolve().parent.parent
ROH = PROJEKT / "daten" / "roh" / "oecd_dac2a_deutschland_2020-2024.csv"
ZIEL = PROJEKT / "daten" / "laender.json"

MASSE = {
    "206": "netto",          # ODA, Nettoauszahlungen (Auszahlungen minus Rückzahlungen von Krediten)
    "240": "brutto",         # ODA, Bruttoauszahlungen
    "201": "zuschuesse",     # Zuschüsse
    "207": "technisch",      # Technische Zusammenarbeit
    "216": "humanitaer",     # Humanitäre Hilfe
}

# Deutsche Ländernamen (Unicode CLDR, wie sie Browser für Ländernamen verwenden), mit wenigen Klarstellungen
NAMEN_DE = {
    "AFG": "Afghanistan", "AGO": "Angola", "ALB": "Albanien", "ARG": "Argentinien", "ARM": "Armenien",
    "ATG": "Antigua und Barbuda", "AZE": "Aserbaidschan", "BDI": "Burundi", "BEN": "Benin", "BFA": "Burkina Faso",
    "BGD": "Bangladesch", "BIH": "Bosnien und Herzegowina", "BLR": "Belarus", "BLZ": "Belize", "BOL": "Bolivien",
    "BRA": "Brasilien", "BTN": "Bhutan", "BWA": "Botsuana", "CAF": "Zentralafrikanische Republik", "CHN": "China",
    "CIV": "Côte d’Ivoire", "CMR": "Kamerun", "COD": "Demokratische Republik Kongo", "COG": "Republik Kongo",
    "COL": "Kolumbien", "COM": "Komoren", "CPV": "Cabo Verde", "CRI": "Costa Rica", "CUB": "Kuba",
    "DJI": "Dschibuti", "DMA": "Dominica", "DOM": "Dominikanische Republik", "DZA": "Algerien", "ECU": "Ecuador",
    "EGY": "Ägypten", "ERI": "Eritrea", "ETH": "Äthiopien", "FJI": "Fidschi", "FSM": "Mikronesien", "GAB": "Gabun",
    "GEO": "Georgien", "GHA": "Ghana", "GIN": "Guinea", "GMB": "Gambia", "GNB": "Guinea-Bissau",
    "GNQ": "Äquatorialguinea", "GRD": "Grenada", "GTM": "Guatemala", "GUY": "Guyana", "HND": "Honduras",
    "HTI": "Haiti", "IDN": "Indonesien", "IND": "Indien", "IRN": "Iran", "IRQ": "Irak", "JAM": "Jamaika",
    "JOR": "Jordanien", "KAZ": "Kasachstan", "KEN": "Kenia", "KGZ": "Kirgisistan", "KHM": "Kambodscha",
    "KIR": "Kiribati", "LAO": "Laos", "LBN": "Libanon", "LBR": "Liberia", "LBY": "Libyen", "LCA": "St. Lucia",
    "LKA": "Sri Lanka", "LSO": "Lesotho", "MAR": "Marokko", "MDA": "Republik Moldau", "MDG": "Madagaskar",
    "MDV": "Malediven", "MEX": "Mexiko", "MHL": "Marshallinseln", "MKD": "Nordmazedonien", "MLI": "Mali",
    "MMR": "Myanmar", "MNE": "Montenegro", "MNG": "Mongolei", "MOZ": "Mosambik", "MRT": "Mauretanien",
    "MUS": "Mauritius", "MWI": "Malawi", "MYS": "Malaysia", "NAM": "Namibia", "NER": "Niger", "NGA": "Nigeria",
    "NIC": "Nicaragua", "NPL": "Nepal", "NRU": "Nauru", "PAK": "Pakistan", "PAN": "Panama", "PER": "Peru",
    "PHL": "Philippinen", "PLW": "Palau", "PNG": "Papua-Neuguinea", "PRK": "Nordkorea", "PRY": "Paraguay",
    "PSE": "Palästinensische Gebiete", "RWA": "Ruanda", "SDN": "Sudan", "SEN": "Senegal", "SLB": "Salomonen",
    "SLE": "Sierra Leone", "SLV": "El Salvador", "SOM": "Somalia", "SRB": "Serbien", "SSD": "Südsudan",
    "STP": "São Tomé und Príncipe", "SUR": "Suriname", "SWZ": "Eswatini", "SYR": "Syrien", "TCD": "Tschad",
    "TGO": "Togo", "THA": "Thailand", "TJK": "Tadschikistan", "TKL": "Tokelau", "TKM": "Turkmenistan",
    "TLS": "Timor-Leste", "TON": "Tonga", "TUN": "Tunesien", "TUR": "Türkei", "TUV": "Tuvalu", "TZA": "Tansania",
    "UGA": "Uganda", "UKR": "Ukraine", "UZB": "Usbekistan", "VCT": "St. Vincent und die Grenadinen",
    "VEN": "Venezuela", "VNM": "Vietnam", "VUT": "Vanuatu", "WLF": "Wallis und Futuna", "WSM": "Samoa",
    "XKV": "Kosovo", "YEM": "Jemen", "ZAF": "Südafrika", "ZMB": "Sambia", "ZWE": "Simbabwe",
}
# Englische Namen kommen von der OECD; einige Kurzformen sind verständlicher
NAMEN_EN = {
    "CHN": "China", "LAO": "Laos", "PRK": "North Korea", "PSE": "Palestinian territories",
    "COD": "Democratic Republic of the Congo", "COG": "Republic of the Congo", "SYR": "Syria", "VNM": "Vietnam",
}


def main():
    with open(ROH, encoding="utf-8-sig", newline="") as f:
        zeilen = [z for z in csv.DictReader(f) if z["PRICE_BASE"] == "V" and z["MEASURE"] in MASSE]
    jahre = sorted({z["TIME_PERIOD"] for z in zeilen})
    letztes = jahre[-1]

    laender = {}
    summen = {}
    for z in zeilen:
        wert = round(float(z["OBS_VALUE"] or 0), 2)
        if z["RECIPIENT"] in ("ALLR", "DPGC"):
            summen.setdefault(z["RECIPIENT"], {}).setdefault(z["TIME_PERIOD"], {})[MASSE[z["MEASURE"]]] = wert
        code = z["RECIPIENT"]
        if code not in NAMEN_DE:
            continue  # Sammelgrößen (Regionen, Einkommensgruppen) und Organisationen
        land = laender.setdefault(code, {"code": code, "de": NAMEN_DE[code], "en": NAMEN_EN.get(code, z["Recipient"]),
                                         "jahre": {}})
        land["jahre"].setdefault(z["TIME_PERIOD"], {})[MASSE[z["MEASURE"]]] = wert

    fehlend = sorted(set(NAMEN_DE) - set(laender))
    if fehlend:
        print("Hinweis: keine Daten für", fehlend)

    liste = sorted(laender.values(), key=lambda l: -(l["jahre"].get(letztes, {}).get("netto") or 0))
    for rang, land in enumerate(liste, 1):
        land["rang"] = rang

    daten = {
        "einheit": "Mio. US-Dollar, laufende Preise",
        "art": "Ist (tatsächliche Auszahlungen)",
        "jahre": jahre,
        "letztes_jahr": letztes,
        "summen": {"alle_empfaenger": summen.get("ALLR", {}), "entwicklungslaender": summen.get("DPGC", {})},
        "quelle": {"titel": "OECD, Tabelle DAC2A: Aid (ODA) disbursements to countries and regions, Geber Deutschland, abgerufen am 26.10.2026",
                   "url": "https://data-explorer.oecd.org/"},
        "laender": liste,
    }
    ZIEL.write_text(json.dumps(daten, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")

    alle = summen["ALLR"][letztes]["netto"]
    zugeordnet = sum(l["jahre"].get(letztes, {}).get("netto", 0) for l in liste)
    print(f"Geschrieben: {ZIEL.relative_to(PROJEKT)} ({len(liste)} Länder, {jahre[0]} bis {letztes})")
    print(f"{letztes}: alle Empfänger {alle:,.0f} Mio. USD, davon einzelnen Ländern zugeordnet {zugeordnet:,.0f} Mio. USD")
    for land in liste[:5]:
        print(f"  {land['rang']}. {land['de']}: {land['jahre'][letztes]['netto']:,.1f} Mio. USD")
    if len(liste) < 130:
        print("FEHLER: zu wenige Länder gelesen")
        sys.exit(1)


if __name__ == "__main__":
    main()
