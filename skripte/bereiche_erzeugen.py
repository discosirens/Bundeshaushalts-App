"""Erzeugt daten/bereiche.json für den Umschicht-Modus.

Aufruf (im Projektordner):  py skripte/bereiche_erzeugen.py

Jeder Ausgabetitel des Kernhaushalts wird genau einem Bereich zugeordnet, auf Basis
der Funktionskennziffer (Funktionenplan des Bundes). Abweichungen davon stehen in
ABWEICHUNGEN und werden in bereiche.json dokumentiert.
Alle Beträge in Tausend Euro, Soll laut Bundeshaushaltsplan.
"""

import csv
import json
import re
import sys
from collections import defaultdict
from pathlib import Path

PROJEKT = Path(__file__).resolve().parent.parent
ROH = PROJEKT / "daten" / "roh"
ZIEL = PROJEKT / "daten" / "bereiche.json"
JAHRE = ("2025", "2026")
GESAMTPLAN_2026 = 524_540_138

QUELLE_HAUSHALT = {"titel": "Bundeshaushaltsplan 2026 (Soll), Bundesministerium der Finanzen",
                   "url": "https://www.bundeshaushalt.de/"}
QUELLE_VORSPANN = {"titel": "Bundeshaushaltsplan 2026, Vorspann, Gesamtplan Teil II A: Ausgaben der Bereichsausnahme",
                   "url": "https://www.bundeshaushalt.de/"}


def gesetz(titel, pfad):
    return {"titel": titel, "url": f"https://www.gesetze-im-internet.de/{pfad}"}


# ---------------------------------------------------------------------------
# Zuordnung: Funktionskennziffer -> Bereich. Längstes passendes Präfix gewinnt.
# ---------------------------------------------------------------------------

FUNKTIONEN = {
    "rente":        ["221", "222", "226", "229", "28"],
    "gesundheit":   ["223", "224", "227", "31"],
    "arbeit":       ["225", "25"],
    "familie":      ["21", "23", "24", "26", "29"],
    "verteidigung": ["03"],
    "ukraine":      [],  # nur über Abweichung
    "zinsen":       ["83"],
    "bildung":      ["11", "12", "13", "14", "15", "16", "18", "19"],
    "verkehr":      ["71", "72", "73", "74", "75", "77", "79"],
    "wirtschaft":   ["51", "52", "53", "61", "62", "63", "64", "65", "66", "68", "69"],
    "staat":        ["01", "04", "05", "06"],
    "aussen":       ["02"],
    "umwelt":       ["32", "33", "34", "41", "42", "43"],
    "finanzen":     ["81", "82", "84", "85", "86", "88", "89"],
}

# Abweichungen von der Funktionenlogik: (Kapitel, Titel) -> Bereich
ABWEICHUNGEN = [
    {
        "kapitel": "6002", "titel": "68706", "bereich": "ukraine",
        "funktion_amtlich": "032 (Verteidigung)",
        "begruendung": "Eigener Bereich für die Szenarien: Die Hilfe für völkerrechtswidrig angegriffene "
                       "Staaten ist eine eigene politische Entscheidung, steht im Einzelplan 60 und nicht im "
                       "Verteidigungsetat und bildet eine eigene Kategorie der Bereichsausnahme (Art. 115 GG).",
    },
]

# Hinweise zur Gliederung, die keine Abweichung von der Funktionenlogik sind, aber erklärt werden sollten.
GLIEDERUNGSHINWEISE = [
    "Die Oberfunktion 22 (Sozialversicherung, 158,8 Mrd. €, Soll 2026) ist nach ihren amtlichen Unterfunktionen "
    "aufgeteilt: 221, 222, 226, 229 (Renten) zu 'Rente', 223, 224, 227 (Unfall, Kranken, Pflege) zu 'Gesundheit', "
    "225 (Arbeitslosenversicherung) zu 'Arbeitsmarkt'. Grund: Ein Bereich mit 30 % des Haushalts wäre für Szenarien "
    "nicht aussagekräftig.",
    "Die Oberfunktion 28 (Leistungen nach SGB XII, vor allem Grundsicherung im Alter) ist mit den Renten "
    "zusammengefasst, weil sie das Alterseinkommen ergänzt.",
    "Kleine Oberfunktionen sind zusammengefasst wie in der amtlichen Funktionenübersicht des Vorspanns "
    "(z. B. 'Übrige Bereiche aus 1' bei Bildung, Forschung und Kultur).",
]


# ---------------------------------------------------------------------------
# Bereichsausnahme nach § 1a Artikel 115-Gesetz, Regeln laut Vorspann 2026 (Gesamtplan Teil II A)
# ---------------------------------------------------------------------------

BA_SOLL_2026 = {
    "Verteidigung": 82_235_190,
    "Zivil- und Bevölkerungsschutz": 2_082_074,
    "Nachrichtendienste": 2_201_125,
    "Schutz informationstechnischer Systeme": 2_797_068,
    "Hilfe für völkerrechtswidrig angegriffene Staaten": 11_546_799,
}
BA_IT_TITELGRUPPEN = {
    ("0112", "01"), ("0212", "08"), ("0312", "01"), ("0412", "01"), ("0432", "01"), ("0452", "08"),
    ("0512", "05"), ("0614", "02"), ("0624", "01"), ("0625", "03"), ("0633", "01"), ("0812", "01"),
    ("0813", "01"), ("0815", "01"), ("0816", "01"), ("1011", "01"), ("1112", "55"), ("1113", "55"),
    ("1114", "55"), ("1115", "55"), ("1116", "55"), ("1503", "03"), ("1512", "09"), ("1513", "09"),
    ("1515", "09"), ("1516", "09"), ("1517", "09"), ("1612", "02"), ("1613", "03"), ("1614", "02"),
    ("1615", "04"), ("1616", "03"), ("1912", "01"), ("2012", "01"), ("2112", "01"), ("2212", "01"),
    ("2402", "03"), ("3004", "20"),
}


def bereichsausnahme(z):
    kap, tit, tgr = z["kapitel"], z["titel"], z["titelgruppe"]
    if kap.startswith("14"):
        ausgenommen = ((kap == "1406" and tgr == "01") or (kap == "1408" and tit == "85301")
                       or (kap == "1409" and tgr == "01") or (kap == "1413" and (tit == "83102" or tgr == "08"))
                       or tit.startswith("98"))
        if not ausgenommen:
            return "Verteidigung"
    if ((kap == "0602" and tgr == "02") or (kap == "0616" and tgr not in ("01", "03"))
            or (kap == "0628" and tit not in ("98101", "98103") and tgr != "02")
            or (kap == "0629" and tit not in ("98101", "98103") and tgr != "01")):
        return "Zivil- und Bevölkerungsschutz"
    if kap in ("0414", "0626"):
        return "Nachrichtendienste"
    if ((kap, tgr) in BA_IT_TITELGRUPPEN or (kap == "0602" and tit in ("54402", "53217"))
            or (kap == "0623" and tit not in ("83101", "98101", "98103") and tgr != "01")):
        return "Schutz informationstechnischer Systeme"
    if kap == "6002" and tit == "68706":
        return "Hilfe für völkerrechtswidrig angegriffene Staaten"
    return None


# ---------------------------------------------------------------------------
# Texte je Bereich. Sprachregeln laut CLAUDE.md: einfach, konkret, keine Gedankenstriche, keine Wertung.
# "Größte Posten" wird automatisch aus den Daten ergänzt.
# ---------------------------------------------------------------------------

BEREICHE = [
    {
        "id": "rente", "name": "Rente und Grundsicherung im Alter",
        "bindung": "gesetzlich gebunden",
        "begruendung": "Höhe der Bundeszuschüsse und der Beiträge für Kindererziehungszeiten ist im SGB VI "
                       "festgelegt. Die Grundsicherung im Alter erstattet der Bund den Ländern vollständig (§ 46a SGB XII).",
        "quelle": [gesetz("§ 213 SGB VI: Zuschüsse des Bundes", "sgb_6/__213.html"),
                   gesetz("§ 177 SGB VI: Beiträge für Kindererziehungszeiten", "sgb_6/__177.html"),
                   gesetz("§ 46a SGB XII: Erstattung durch den Bund", "sgb_12/__46a.html")],
        "erklaerung": {
            "was_ist_das": "Zuschüsse des Bundes an die gesetzliche Rentenversicherung und Geld für die Grundsicherung "
                           "im Alter. Grundsicherung bekommen ältere Menschen, deren Rente und Vermögen nicht zum Leben reichen.",
            "wer_bekommt_das_geld": "Der Bund überweist das Geld an die Rentenversicherung, nicht direkt an Rentnerinnen "
                                    "und Rentner. Die Grundsicherung zahlen Ämter der Kommunen aus, der Bund erstattet die Kosten.",
            "warum_so_viel": "Die Zuschüsse stehen im Gesetz und steigen mit Löhnen und Beitragssatz. Für jedes Kind "
                             "zahlt der Bund Rentenbeiträge für Zeiten der Kindererziehung.",
            "gut_zu_wissen": [
                {"text": "Die Renten werden überwiegend aus Beiträgen bezahlt. Etwa drei Viertel der Einnahmen der "
                         "Rentenversicherung sind Beiträge (Schätzung 2025).",
                 "quelle": {"titel": "Deutsche Rentenversicherung, Pressemitteilung vom 10.12.2025",
                            "url": "https://www.deutsche-rentenversicherung.de/DRV/DE/Ueber-uns-und-Presse/Presse/Pressemitteilungen/Pressemitteilungen-archiv/2025/2025-12-10-bvv-gunkel.html"}},
            ],
        },
    },
    {
        "id": "gesundheit", "name": "Gesundheit und Pflege",
        "bindung": "gesetzlich gebunden",
        "begruendung": "Der Zuschuss an die Krankenversicherung ist mit 14,5 Mrd. € pro Jahr im Gesetz festgelegt "
                       "(§ 221 SGB V). Die Darlehen an Gesundheitsfonds und Pflegeversicherung beruhen auf Gesetzen; "
                       "kleinere Posten (Gesundheitsschutz) sind politisch gestaltbar.",
        "quelle": [gesetz("§ 221 SGB V: Beteiligung des Bundes", "sgb_5/__221.html"), QUELLE_HAUSHALT],
        "erklaerung": {
            "was_ist_das": "Zuschüsse und Darlehen des Bundes an die gesetzliche Kranken- und Pflegeversicherung, dazu "
                           "Gesundheitsschutz, zum Beispiel Vorsorge für Pandemien.",
            "wer_bekommt_das_geld": "Das Geld geht an den Gesundheitsfonds, den gemeinsamen Geldtopf der Krankenkassen, "
                                    "und an die Pflegeversicherung. Ärztinnen, Kliniken und Versicherte bekommen es nicht direkt.",
            "warum_so_viel": "Den Zuschuss von 14,5 Mrd. € pro Jahr legt das Gesetz fest. Er gleicht Leistungen aus, "
                             "die die Kassen für die Allgemeinheit erbringen.",
            "gut_zu_wissen": [
                {"text": "2026 leiht der Bund der Pflegeversicherung 3,2 Mrd. € und dem Gesundheitsfonds 2,3 Mrd. € "
                         "(Soll). Darlehen müssen zurückgezahlt werden.",
                 "quelle": {"titel": "Bundeshaushaltsplan 2026, Kap. 1501 Tit. 856 01 und Kap. 1502 Tit. 856 02",
                            "url": "https://www.bundeshaushalt.de/"}},
            ],
        },
    },
    {
        "id": "arbeit", "name": "Arbeitsmarkt und Grundsicherungsgeld",
        "bindung": "gesetzlich gebunden",
        "begruendung": "Grundsicherungsgeld und Beteiligung an Unterkunft und Heizung sind Rechtsansprüche nach dem "
                       "SGB II (rund drei Viertel des Bereichs). Eingliederungsleistungen und Verwaltungskosten werden "
                       "als Budget festgelegt und sind politisch gestaltbar.",
        "quelle": [gesetz("§ 46 SGB II: Finanzierung aus Bundesmitteln", "sgb_2/__46.html")],
        "erklaerung": {
            "was_ist_das": "Grundsicherungsgeld für Menschen, die arbeiten können, aber nicht genug zum Leben haben. "
                           "Dazu kommen Hilfen bei der Arbeitssuche, Weiterbildung und die Kosten der Jobcenter.",
            "wer_bekommt_das_geld": "Jobcenter zahlen das Grundsicherungsgeld an die Berechtigten. Miete und Heizung "
                                    "zahlen die Kommunen, der Bund erstattet ihnen einen Teil.",
            "warum_so_viel": "Wer die Voraussetzungen erfüllt, hat einen Rechtsanspruch. Die Höhe hängt von der Zahl "
                             "der Berechtigten, den Regelsätzen und den Mieten ab.",
            "gut_zu_wissen": [
                {"text": "Bis Juni 2026 hieß die Leistung Bürgergeld, so steht sie auch noch im Haushaltsplan 2026. "
                         "Seit Juli gelten strengere Pflichten und höhere Kürzungen.",
                 "quelle": {"titel": "Bundesregierung: Neue Grundsicherung löst Bürgergeld ab",
                            "url": "https://www.bundesregierung.de/breg-de/aktuelles/neue-grundsicherung-2399562"}},
                {"text": "Arbeitslosengeld zahlt die Bundesagentur für Arbeit aus Beiträgen. Der Bund leiht ihr 2026 "
                         "aber 3,97 Mrd. € (Soll).",
                 "quelle": {"titel": "Bundeshaushaltsplan 2026, Kap. 1101 Tit. 856 22", "url": "https://www.bundeshaushalt.de/"}},
            ],
        },
    },
    {
        "id": "familie", "name": "Familie und weitere Sozialleistungen",
        "bindung": "teilweise gebunden",
        "begruendung": "Elterngeld, Kinderzuschlag, Wohngeld und Unterhaltsvorschuss sind Rechtsansprüche "
                       "(gut zwei Drittel). Integrationskurse, Freiwilligendienste und Härteleistungen sind "
                       "teilweise politisch gestaltbar.",
        "quelle": [gesetz("§ 32 WoGG: Erstattung des Wohngeldes", "wogg/__32.html"),
                   gesetz("§ 8 UVG: Aufteilung der Kosten", "uhvorschg/__8.html")],
        "erklaerung": {
            "was_ist_das": "Leistungen für Familien wie Elterngeld, Kinderzuschlag und Unterhaltsvorschuss. Dazu kommen "
                           "Wohngeld, Integrationskurse und Entschädigungen, etwa für Opfer von Krieg und Unrecht.",
            "wer_bekommt_das_geld": "Familien und Haushalte, ausgezahlt von Elterngeldstellen, Familienkassen und "
                                    "Wohngeldstellen. Wohngeld zahlen Bund und Länder je zur Hälfte, den Unterhaltsvorschuss "
                                    "trägt der Bund zu 40 %.",
            "warum_so_viel": "Die meisten Leistungen sind Rechtsansprüche. Die Höhe hängt von der Zahl der Geburten, "
                             "den Einkommen der Familien und den Mieten ab.",
            "gut_zu_wissen": [
                {"text": "Das Kindergeld steht fast nicht in diesem Bereich. Es wird über die Einkommensteuer "
                         "abgewickelt und verringert die Steuereinnahmen.",
                 "quelle": gesetz("§ 31 EStG: Familienleistungsausgleich", "estg/__31.html")},
            ],
        },
    },
    {
        "id": "verteidigung", "name": "Verteidigung",
        "bindung": "teilweise gebunden",
        "begruendung": "Die Höhe ist eine politische Entscheidung. Personalkosten und laufende Beschaffungsverträge "
                       "binden aber einen großen Teil für Jahre.",
        "quelle": [QUELLE_HAUSHALT],
        "erklaerung": {
            "was_ist_das": "Ausgaben für die Bundeswehr: Personal, Ausrüstung, Munition, Betrieb und Gebäude.",
            "wer_bekommt_das_geld": "Ein großer Teil geht als Gehalt an Soldatinnen, Soldaten und zivile Beschäftigte. "
                                    "Der Rest geht an Unternehmen, die Waffen, Fahrzeuge, Munition und Dienstleistungen liefern.",
            "warum_so_viel": "Die Größe der Bundeswehr, laufende Beschaffungsverträge und politische Entscheidungen über "
                             "die Ausstattung bestimmen die Höhe.",
            "gut_zu_wissen": [
                {"text": "Dazu kommt das Sondervermögen Bundeswehr, ein getrennter Geldtopf mit eigenen Krediten: "
                         "25,5 Mrd. € (Soll 2026), hier nicht enthalten.",
                 "quelle": {"titel": "Bundeshaushaltsplan 2026, Kap. 1491", "url": "https://www.bundeshaushalt.de/"}},
                {"text": "Verteidigungsausgaben über 1 % der Wirtschaftsleistung zählen nicht für die Schuldenbremse, "
                         "die Regel zur Begrenzung neuer Schulden.",
                 "quelle": gesetz("Art. 115 Grundgesetz", "gg/art_115.html")},
            ],
        },
    },
    {
        "id": "ukraine", "name": "Militärische Hilfe für die Ukraine",
        "bindung": "politisch frei gestaltbar",
        "begruendung": "Kein Gesetz schreibt die Höhe vor; Regierung und Bundestag legen sie jährlich fest. "
                       "Bereits geschlossene Lieferverträge können einen Teil binden.",
        "quelle": [QUELLE_HAUSHALT],
        "erklaerung": {
            "was_ist_das": "Geld für Waffen, Munition und Ausrüstung für Staaten, die völkerrechtswidrig angegriffen "
                           "werden. 2026 ist es für die Ukraine vorgesehen, ein Schwerpunkt ist die Luftverteidigung.",
            "wer_bekommt_das_geld": "Die Ukraine erhält vor allem Ausrüstung. Das Geld selbst geht überwiegend an "
                                    "Unternehmen, bei denen die Ausrüstung bestellt wird.",
            "warum_so_viel": "Die Höhe ist eine politische Entscheidung über die Unterstützung der Ukraine.",
            "gut_zu_wissen": [
                {"text": "Humanitäre Hilfe und Kosten für Geflüchtete aus der Ukraine stehen in anderen Bereichen.",
                 "quelle": QUELLE_HAUSHALT},
                {"text": "Die Bundesregierung nennt für 2026 rund 11,5 Mrd. € Militärhilfe für die Ukraine.",
                 "quelle": {"titel": "Bundesregierung: Bundeshaushalt 2026",
                            "url": "https://www.bundesregierung.de/breg-de/aktuelles/bundeshaushalt-2026-2374030"}},
            ],
        },
        "zusatzquellen": [{"titel": "BMVg: Vier Jahre Ukraine-Unterstützung",
                           "url": "https://www.bmvg.de/de/aktuelles/vier-jahre-ukraine-unterstuetzung-6071848"}],
    },
    {
        "id": "zinsen", "name": "Zinsen für Schulden",
        "bindung": "gesetzlich gebunden",
        "begruendung": "Zinsen sind vertraglich zugesagt und kurzfristig nicht veränderbar, auch nicht durch ein "
                       "Gesetz. Die Stufe 'gesetzlich gebunden' ist hier die nächstliegende.",
        "quelle": [QUELLE_HAUSHALT],
        "erklaerung": {
            "was_ist_das": "Zinsen, die der Bund für seine Schulden zahlt. Der Bund leiht sich Geld, indem er Wertpapiere "
                           "verkauft, zum Beispiel Bundesanleihen.",
            "wer_bekommt_das_geld": "Alle, die Bundeswertpapiere besitzen: Banken, Versicherungen, Fonds, Anleger im "
                                    "Ausland und Privatpersonen.",
            "warum_so_viel": "Die Höhe hängt von der Menge der Schulden ab und davon, wie hoch die Zinsen waren, als die "
                             "Wertpapiere ausgegeben wurden.",
            "gut_zu_wissen": [
                {"text": "Rückzahlungen von Krediten stehen nicht als Ausgabe im Haushalt. Fällige Kredite werden "
                         "meist mit neuen Krediten abgelöst.",
                 "quelle": gesetz("§ 15 Abs. 1 Bundeshaushaltsordnung", "bho/__15.html")},
                {"text": "Hier stehen auch Zinsen für Sondervermögen, also getrennte Geldtöpfe mit eigenen Krediten. "
                         "2026 sind es zum Beispiel 0,67 Mrd. € für das Sondervermögen Infrastruktur (Soll).",
                 "quelle": {"titel": "Bundeshaushaltsplan 2026, Kap. 3205 Tit. 575 30", "url": "https://www.bundeshaushalt.de/"}},
            ],
        },
    },
    {
        "id": "bildung", "name": "Bildung, Forschung und Kultur",
        "bindung": "teilweise gebunden",
        "begruendung": "BAföG und Aufstiegs-BAföG sind Rechtsansprüche. Große Teile sind in mehrjährigen Bund-Länder-"
                       "Vereinbarungen festgelegt (Hochschulen, Forschungsorganisationen). Projektförderung ist "
                       "politisch gestaltbar.",
        "quelle": [QUELLE_HAUSHALT],
        "erklaerung": {
            "was_ist_das": "Geld für Forschungseinrichtungen, Hochschulen, Ausbildungsförderung wie BAföG sowie für Kultur "
                           "und Medien.",
            "wer_bekommt_das_geld": "Forschungsorganisationen wie Helmholtz und Max Planck, die Deutsche "
                                    "Forschungsgemeinschaft, über Programme die Länder und ihre Hochschulen. BAföG geht "
                                    "an Schülerinnen, Schüler und Studierende.",
            "warum_so_viel": "Viele Beträge stehen in mehrjährigen Vereinbarungen zwischen Bund und Ländern. Beim BAföG "
                             "bestimmt die Zahl der Berechtigten die Höhe.",
            "gut_zu_wissen": [
                {"text": "Schulen bezahlen Länder und Kommunen, nicht der Bund. Bildung ist nach dem Grundgesetz vor "
                         "allem Aufgabe der Länder.",
                 "quelle": gesetz("Art. 30 Grundgesetz", "gg/art_30.html")},
            ],
        },
    },
    {
        "id": "verkehr", "name": "Verkehr",
        "bindung": "teilweise gebunden",
        "begruendung": "Welche Straßen und Schienen gebaut werden, ist politisch gestaltbar. Erhalt, Betrieb der "
                       "Autobahn GmbH und laufende Bauverträge binden aber einen großen Teil.",
        "quelle": [QUELLE_HAUSHALT],
        "erklaerung": {
            "was_ist_das": "Bau, Erhalt und Betrieb von Autobahnen, Bundesstraßen, Schienenwegen und Wasserstraßen sowie "
                           "Förderung des Nahverkehrs.",
            "wer_bekommt_das_geld": "Vor allem Unternehmen des Bundes: die Autobahn GmbH und die Deutsche Bahn für ihr "
                                    "Schienennetz. Dazu Baufirmen und die Länder für den Nahverkehr.",
            "warum_so_viel": "Bauprogramme wie der Bundesverkehrswegeplan und der Zustand von Straßen, Brücken und "
                             "Gleisen bestimmen die Höhe.",
            "gut_zu_wissen": [
                {"text": "Weitere Milliarden kommen 2026 aus dem Sondervermögen Infrastruktur, einem getrennten "
                         "Geldtopf mit eigenen Krediten. Allein 16,3 Mrd. € gehen in den Erhalt der Schienenwege "
                         "(Soll). Sie sind hier nicht enthalten.",
                 "quelle": {"titel": "Bundeshaushaltsplan 2026, Kap. 6093 Tit. 891 13", "url": "https://www.bundeshaushalt.de/"}},
            ],
        },
    },
    {
        "id": "wirtschaft", "name": "Wirtschaft, Energie und Landwirtschaft",
        "bindung": "teilweise gebunden",
        "begruendung": "Der größte Posten, der Ausgleich des EEG-Kontos, ist ein gesetzlicher Anspruch der "
                       "Netzbetreiber (§ 6 EnFG). Zahlungen aus Bürgschaften sind vertraglich. Wirtschafts- und "
                       "Agrarförderprogramme sind politisch gestaltbar.",
        "quelle": [gesetz("§ 6 Energiefinanzierungsgesetz: Ausgleichsanspruch", "enfg/__6.html")],
        "erklaerung": {
            "was_ist_das": "Förderung von Unternehmen, Regionen und Landwirtschaft sowie Ausgaben für Energie. Der größte "
                           "Posten bezahlt die Förderung von Strom aus Wind, Sonne und anderen erneuerbaren Quellen.",
            "wer_bekommt_das_geld": "Der größte Betrag geht an die Betreiber der großen Stromnetze, die damit die "
                                    "Ökostrom-Förderung auszahlen. Weitere Empfänger: Unternehmen, Länder und Betriebe "
                                    "der Landwirtschaft.",
            "warum_so_viel": "Die Ökostrom-Förderung steigt, wenn der Strompreis an der Börse sinkt oder mehr Anlagen "
                             "gefördert werden. Bürgschaften kosten Geld, wenn Schuldner nicht zahlen.",
            "gut_zu_wissen": [
                {"text": "Seit 2023 wird die Ökostrom-Förderung nicht mehr über eine Umlage auf der Stromrechnung "
                         "bezahlt. Fehlt Geld auf dem Förderkonto, gleicht der Bund es aus.",
                 "quelle": gesetz("§ 6 Energiefinanzierungsgesetz", "enfg/__6.html")},
            ],
        },
    },
    {
        "id": "staat", "name": "Verwaltung, Sicherheit und Justiz",
        "bindung": "teilweise gebunden",
        "begruendung": "Pensionen und Besoldung sind gesetzlich festgelegt, Stellenzahl und Sachausgaben politisch "
                       "gestaltbar.",
        "quelle": [QUELLE_HAUSHALT],
        "erklaerung": {
            "was_ist_das": "Ausgaben für Ministerien, Bundestag, Bundespolizei, Zoll, Steuerverwaltung, Gerichte und "
                           "Nachrichtendienste. Dazu kommen Pensionen ehemaliger Beamtinnen und Beamter.",
            "wer_bekommt_das_geld": "Ein großer Teil geht als Gehalt an Beschäftigte des Bundes und als Pension an "
                                    "frühere Beamtinnen und Beamte.",
            "warum_so_viel": "Die Zahl der Beschäftigten und die gesetzlich festgelegten Gehälter und Pensionen "
                             "bestimmen den größten Teil der Höhe.",
            "gut_zu_wissen": [
                {"text": "10,3 Mrd. € (Soll 2026) gehen an die Postbeamtenversorgungskasse. Daraus werden Pensionen "
                         "früherer Beamter von Bundespost, Telekom und Postbank bezahlt.",
                 "quelle": {"titel": "Bundeshaushaltsplan 2026, Kap. 6002 Tit. 685 01", "url": "https://www.bundeshaushalt.de/"}},
            ],
        },
    },
    {
        "id": "aussen", "name": "Außenpolitik und Entwicklung",
        "bindung": "politisch frei gestaltbar",
        "begruendung": "Die Höhe ist überwiegend politisch bestimmt. Beiträge an internationale Organisationen und "
                       "mehrjährige Projektzusagen binden einen Teil.",
        "quelle": [QUELLE_HAUSHALT],
        "erklaerung": {
            "was_ist_das": "Ausgaben für Botschaften und Außenpolitik, humanitäre Hilfe und Entwicklungszusammenarbeit, "
                           "also Unterstützung für ärmere Länder.",
            "wer_bekommt_das_geld": "Vor allem Organisationen, die Projekte umsetzen: die staatliche Förderbank KfW, die "
                                    "Gesellschaft für Internationale Zusammenarbeit (GIZ), die Weltbank und Hilfsorganisationen.",
            "warum_so_viel": "Die Höhe ist überwiegend eine politische Entscheidung. Internationale Zusagen und "
                             "mehrjährige Projekte binden einen Teil.",
            "gut_zu_wissen": [
                {"text": "Die größten Posten sind Projekte, die mit Partnerländern vereinbart werden, nicht freie "
                         "Zahlungen an deren Regierungen.",
                 "quelle": {"titel": "Bundeshaushaltsplan 2026, Kap. 2301 Tit. 896 03 und 896 11",
                            "url": "https://www.bundeshaushalt.de/"}},
            ],
        },
    },
    {
        "id": "umwelt", "name": "Umwelt, Wohnen und Sport",
        "bindung": "teilweise gebunden",
        "begruendung": "Endlagerung und Strahlenschutz folgen aus gesetzlichen Pflichten. Wohnungsbau und Städtebau "
                       "beruhen auf Vereinbarungen mit den Ländern (Art. 104d GG). Naturschutz und Sport sind politisch "
                       "gestaltbar.",
        "quelle": [gesetz("Art. 104d Grundgesetz", "gg/art_104d.html")],
        "erklaerung": {
            "was_ist_das": "Sozialer Wohnungsbau, Städtebau, Naturschutz, Strahlenschutz, die Suche nach einem Endlager "
                           "für Atommüll und Sportförderung.",
            "wer_bekommt_das_geld": "Für Wohnungsbau und Städtebau bekommen die Länder Geld und verteilen es weiter. "
                                    "Für die Endlagerung bezahlt der Bund eigene Gesellschaften.",
            "warum_so_viel": "Bund und Länder vereinbaren die Wohnungs- und Städtebauförderung. Die Kosten der "
                             "Endlagerung folgen aus gesetzlichen Pflichten.",
            "gut_zu_wissen": [
                {"text": "Die meisten Ausgaben für Klimaschutz stehen nicht hier, sondern im Klima- und "
                         "Transformationsfonds, einem getrennten Geldtopf: 34,8 Mrd. € (Soll 2026).",
                 "quelle": {"titel": "Bundeshaushaltsplan 2026, Kap. 6092", "url": "https://www.bundeshaushalt.de/"}},
            ],
        },
    },
    {
        "id": "finanzen", "name": "Allgemeine Finanzwirtschaft",
        "bindung": "teilweise gebunden",
        "begruendung": "Bundeseisenbahnvermögen und Kohleregionen-Hilfen beruhen auf Gesetzen. Pauschale "
                       "Einsparvorgaben und Vorsorgeposten sind politisch gestaltbar.",
        "quelle": [QUELLE_HAUSHALT],
        "erklaerung": {
            "was_ist_das": "Posten ohne eigenes Fachgebiet: Geld für Sondervermögen (getrennte Geldtöpfe des Bundes), "
                           "Hilfen für Kohleregionen, Kosten des Bundeseisenbahnvermögens und pauschale Einsparvorgaben.",
            "wer_bekommt_das_geld": "Sondervermögen, Länder und das Bundeseisenbahnvermögen. Es versorgt unter anderem "
                                    "frühere Beamtinnen und Beamte der Bahn.",
            "warum_so_viel": "Der Betrag ist klein, weil hier auch negative Posten stehen, vor allem eine globale "
                             "Minderausgabe von 8 Mrd. € (Soll 2026).",
            "gut_zu_wissen": [
                {"text": "Eine globale Minderausgabe ist eine Sparvorgabe ohne festgelegten Posten. Sie muss im Laufe "
                         "des Jahres erbracht werden.",
                 "quelle": {"titel": "Bundeshaushaltsplan 2026, Kap. 6002 Tit. 972 01", "url": "https://www.bundeshaushalt.de/"}},
            ],
        },
    },
]


# ---------------------------------------------------------------------------
# Englische Fassung. "gut" in derselben Reihenfolge wie gut_zu_wissen (Quellen werden übernommen).
# Quellen bleiben deutschsprachige Dokumente.
# ---------------------------------------------------------------------------

BEREICHE_EN = {
    "rente": {
        "name": "Pensions and basic income in old age",
        "begruendung": "The amount of federal grants and of contributions for child-raising periods is set in "
                       "Social Code Book VI. The federal government fully reimburses the states for basic income "
                       "support in old age (Section 46a Social Code Book XII).",
        "was": "Federal grants to the statutory pension insurance and money for basic income support in old age. "
               "Older people get basic income support if their pension and savings are not enough to live on.",
        "wer": "The federal government pays the money to the pension insurance, not directly to pensioners. "
               "Local authorities pay out basic income support; the federal government reimburses the costs.",
        "warum": "The grants are set by law and rise with wages and the contribution rate. For every child, the "
                 "federal government pays pension contributions for the time spent raising it.",
        "gut": ["Pensions are mainly paid from contributions. About three quarters of the pension insurance's "
                "income comes from contributions (estimate for 2025)."],
    },
    "gesundheit": {
        "name": "Health and long-term care",
        "begruendung": "The grant to health insurance is fixed by law at €14.5 billion a year (Section 221 Social "
                       "Code Book V). Loans to the Health Fund and long-term care insurance are based on laws; "
                       "smaller items (health protection) can be shaped politically.",
        "was": "Federal grants and loans to statutory health and long-term care insurance, plus health "
               "protection, for example pandemic preparedness.",
        "wer": "The money goes to the Health Fund, the joint pot of the health insurers, and to long-term care "
               "insurance. Doctors, hospitals and insured people do not receive it directly.",
        "warum": "The law sets the grant at €14.5 billion a year. It compensates for services the insurers "
                 "provide for society as a whole.",
        "gut": ["In 2026 the federal government lends €3.2 billion to long-term care insurance and €2.3 billion "
                "to the Health Fund (budget). Loans have to be repaid."],
    },
    "arbeit": {
        "name": "Labour market and basic income support",
        "begruendung": "Basic income support (Grundsicherungsgeld) and the federal share of housing and heating "
                       "costs are legal entitlements under Social Code Book II (about three quarters of this area). "
                       "Job support and administrative costs are set as a budget and can be shaped politically.",
        "was": "Basic income support (Grundsicherungsgeld) for people who can work but do not have enough to live "
               "on. It also covers help with job seeking, further training and the costs of job centres.",
        "wer": "Job centres pay basic income support to those entitled. Local authorities pay rent and heating; the "
               "federal government reimburses part of it.",
        "warum": "Anyone who meets the conditions has a legal entitlement. The amount depends on the number of "
                 "recipients, the standard rates and rents.",
        "gut": ["Until June 2026 the benefit was called citizen's income (Bürgergeld), as in the 2026 budget plan. "
                "Stricter duties and larger cuts now apply.",
                "Unemployment benefit is paid by the Federal Employment Agency from contributions. In 2026, "
                "however, the federal government lends it €3.97 billion (budget)."],
    },
    "familie": {
        "name": "Families and other social benefits",
        "begruendung": "Parental allowance, child supplement, housing benefit and child maintenance advance are "
                       "legal entitlements (more than two thirds). Integration courses, volunteer services and "
                       "hardship payments can partly be shaped politically.",
        "was": "Benefits for families such as parental allowance, child supplement and child maintenance advance. "
               "Also housing benefit, integration courses and compensation, for example for victims of war and "
               "injustice.",
        "wer": "Families and households, paid out by local benefit offices and family benefit offices. Housing "
               "benefit is shared half and half by federal and state governments; the federal government pays "
               "40% of the child maintenance advance.",
        "warum": "Most benefits are legal entitlements. The amount depends on the number of births, family "
                 "incomes and rents.",
        "gut": ["Child benefit (Kindergeld) hardly appears in this area. It is handled through income tax and "
                "reduces tax revenue instead."],
    },
    "verteidigung": {
        "name": "Defence",
        "begruendung": "The amount is a political decision. Staff costs and ongoing procurement contracts, "
                       "however, tie up a large share for years.",
        "was": "Spending on the German armed forces (Bundeswehr): staff, equipment, ammunition, operations and "
               "buildings.",
        "wer": "A large share goes as pay to soldiers and civilian staff. The rest goes to companies that supply "
               "weapons, vehicles, ammunition and services.",
        "warum": "The size of the armed forces, ongoing procurement contracts and political decisions about "
                 "equipment determine the amount.",
        "gut": ["On top of this comes the Bundeswehr special fund, a separate pot with its own borrowing: "
                "€25.5 billion (budget 2026), not included here.",
                "Defence spending above 1% of economic output does not count towards the debt brake, the rule "
                "that limits new borrowing."],
    },
    "ukraine": {
        "name": "Military aid for Ukraine",
        "begruendung": "No law sets the amount; the government and the Bundestag decide it every year. Supply "
                       "contracts already signed may tie up part of it.",
        "was": "Money for weapons, ammunition and equipment for states attacked in violation of international "
               "law. In 2026 it is earmarked for Ukraine, with a focus on air defence.",
        "wer": "Ukraine mainly receives equipment. The money itself mostly goes to the companies from which the "
               "equipment is ordered.",
        "warum": "The amount is a political decision about supporting Ukraine.",
        "gut": ["Humanitarian aid and costs for refugees from Ukraine are in other areas.",
                "The federal government states around €11.5 billion in military aid for Ukraine for 2026."],
    },
    "zinsen": {
        "name": "Interest on debt",
        "begruendung": "Interest is contractually agreed and cannot be changed in the short term, not even by "
                       "law. 'Fixed by law' is the closest of the three levels.",
        "was": "Interest the federal government pays on its debt. It borrows money by selling securities, for "
               "example federal bonds (Bundesanleihen).",
        "wer": "Everyone who holds federal securities: banks, insurers, funds, investors abroad and private "
               "individuals.",
        "warum": "The amount depends on how much debt there is and on interest rates at the time the securities "
                 "were issued.",
        "gut": ["Repayments of loans are not shown as spending in the budget. Loans that fall due are usually "
                "replaced by new loans.",
                "This area also includes interest for special funds, separate pots with their own borrowing. In "
                "2026, for example, €0.67 billion for the infrastructure special fund (budget)."],
    },
    "bildung": {
        "name": "Education, research and culture",
        "begruendung": "Student and upgrading grants (BAföG, Aufstiegs-BAföG) are legal entitlements. Large parts "
                       "are fixed in multi-year federal-state agreements (universities, research organisations). "
                       "Project funding can be shaped politically.",
        "was": "Money for research institutions, universities, student grants such as BAföG, and culture and "
               "media.",
        "wer": "Research organisations such as Helmholtz and Max Planck, the German Research Foundation, and via "
               "programmes the states and their universities. BAföG goes to pupils and students.",
        "warum": "Many amounts are fixed in multi-year agreements between federal and state governments. For "
                 "BAföG, the number of eligible students determines the amount.",
        "gut": ["Schools are paid for by the states and municipalities, not the federal government. Under the "
                "Basic Law, education is mainly a matter for the states."],
    },
    "verkehr": {
        "name": "Transport",
        "begruendung": "Which roads and railways are built can be shaped politically. Maintenance, operation of "
                       "Autobahn GmbH and ongoing construction contracts tie up a large share.",
        "was": "Building, maintaining and running motorways, federal roads, railways and waterways, and support "
               "for local public transport.",
        "wer": "Mainly federally owned companies: Autobahn GmbH and Deutsche Bahn for its rail network. Also "
               "construction firms and the states for local public transport.",
        "warum": "Construction programmes such as the Federal Transport Infrastructure Plan and the condition of "
                 "roads, bridges and tracks determine the amount.",
        "gut": ["More billions come in 2026 from the infrastructure special fund, a separate pot with its own "
                "borrowing. €16.3 billion alone goes to maintaining the rail network (budget). This is not "
                "included here."],
    },
    "wirtschaft": {
        "name": "Economy, energy and agriculture",
        "begruendung": "The largest item, balancing the renewable energy (EEG) account, is a legal claim of the "
                       "grid operators (Section 6 Energy Financing Act). Payments under guarantees are "
                       "contractual. Business and farm support programmes can be shaped politically.",
        "was": "Support for businesses, regions and agriculture, and spending on energy. The largest item pays "
               "for support for electricity from wind, sun and other renewable sources.",
        "wer": "The largest amount goes to the operators of the big power grids, who use it to pay out renewable "
               "energy support. Other recipients: businesses, states and farms.",
        "warum": "Renewable energy support rises when the wholesale electricity price falls or more plants are "
                 "supported. Guarantees cost money when debtors do not pay.",
        "gut": ["Since 2023, renewable energy support has no longer been paid through a levy on electricity "
                "bills. If the support account runs short, the federal government balances it."],
    },
    "staat": {
        "name": "Administration, security and justice",
        "begruendung": "Pensions and civil servants' pay are set by law; the number of posts and running costs "
                       "can be shaped politically.",
        "was": "Spending on ministries, the Bundestag, the Federal Police, customs, tax administration, courts "
               "and intelligence services. Also pensions of former civil servants.",
        "wer": "A large share goes as pay to federal employees and as pensions to former civil servants.",
        "warum": "The number of employees and the salaries and pensions set by law determine most of the "
                 "amount.",
        "gut": ["€10.3 billion (budget 2026) goes to the postal civil servants' pension fund. It pays pensions of "
                "former civil servants of the Federal Post Office, Telekom and Postbank."],
    },
    "aussen": {
        "name": "Foreign policy and development",
        "begruendung": "The amount is mostly a political decision. Contributions to international organisations "
                       "and multi-year project commitments tie up part of it.",
        "was": "Spending on embassies and foreign policy, humanitarian aid and development cooperation, that is "
               "support for poorer countries.",
        "wer": "Mainly organisations that carry out projects: the state development bank KfW, the German Agency "
               "for International Cooperation (GIZ), the World Bank and aid organisations.",
        "warum": "The amount is mostly a political decision. International commitments and multi-year projects "
                 "tie up part of it.",
        "gut": ["The largest items are projects agreed with partner countries, not free payments to their "
                "governments."],
    },
    "umwelt": {
        "name": "Environment, housing and sport",
        "begruendung": "Final disposal and radiation protection follow from legal obligations. Housing and urban "
                       "development rest on agreements with the states (Article 104d Basic Law). Nature "
                       "conservation and sport can be shaped politically.",
        "was": "Social housing, urban development, nature conservation, radiation protection, the search for a "
               "final repository for nuclear waste, and support for sport.",
        "wer": "For housing and urban development, the states receive money and pass it on. For final disposal, "
               "the federal government pays its own companies.",
        "warum": "Federal and state governments agree on housing and urban development funding. The costs of "
                 "final disposal follow from legal obligations.",
        "gut": ["Most climate protection spending is not here but in the Climate and Transformation Fund, a "
                "separate pot: €34.8 billion (budget 2026)."],
    },
    "finanzen": {
        "name": "General financial management",
        "begruendung": "The Federal Railway Fund and aid for coal regions are based on laws. Lump-sum savings "
                       "targets and reserve items can be shaped politically.",
        "was": "Items without a specific policy field: money for special funds (separate federal pots), aid for "
               "coal regions, costs of the Federal Railway Fund and lump-sum savings targets.",
        "wer": "Special funds, states and the Federal Railway Fund, which among other things provides for former "
               "railway civil servants.",
        "warum": "The amount is small because negative items are also listed here, above all a lump-sum "
                 "spending cut of €8 billion (budget 2026).",
        "gut": ["A lump-sum spending cut (globale Minderausgabe) is a savings target without a specified item. "
                "It has to be achieved during the year."],
    },
}

# Deutsche Titelnamen, die seit Aufstellung des Haushaltsplans überholt sind
TITEL_DE = {
    ("1101", "68112"): "Bürgergeld (seit Juli 2026 Grundsicherungsgeld)",
}

# Englische Namen der derzeit größten Titel. Fehlt ein Titel, bleibt der deutsche Name stehen.
TITEL_EN = {
    ("1102", "63681"): "Federal grant to the general pension insurance",
    ("1102", "63683"): "Additional federal grant to the general pension insurance",
    ("1102", "63684"): "Contributions for child-raising periods to the general pension insurance",
    ("1501", "63606"): "Lump-sum payment to health insurers for tasks in the public interest (Health Fund)",
    ("1502", "85602"): "Multi-year loan to the long-term care insurance compensation fund",
    ("1501", "85601"): "Multi-year loan to the Health Fund",
    ("1101", "68112"): "Basic income support (until June 2026 Bürgergeld)",
    ("1101", "63211"): "Federal share of housing and heating costs",
    ("1101", "63613"): "Administrative costs of basic income support for jobseekers",
    ("1701", "68102"): "Parental allowance (Elterngeld)",
    ("1701", "68113"): "Child supplement (Kinderzuschlag)",
    ("2501", "63201"): "Housing benefit (Wohngeld)",
    ("1403", "42301"): "Pay of career and fixed-term soldiers",
    ("1405", "55408"): "Procurement of ammunition",
    ("1407", "55319"): "Clothing supply for the armed forces",
    ("6002", "68706"): "Capacity building for states attacked in violation of international law (security, "
                       "defence, stabilisation)",
    ("3205", "57501"): "Interest on federal bonds (Bundesanleihen)",
    ("3205", "57503"): "Interest on federal notes (Bundesobligationen)",
    ("3205", "57505"): "Interest on federal treasury notes (Bundesschatzanweisungen)",
    ("3004", "68570"): "Helmholtz centres (operations)",
    ("3003", "68530"): "German Research Foundation (DFG): running costs",
    ("3003", "63205"): "Future Contract for strengthening study and teaching",
    ("1201", "89111"): "Investments of Autobahn GmbH",
    ("1201", "68212"): "Autobahn GmbH: operations, planning and administration",
    ("1202", "89101"): "Construction grants for rail investments in the federal requirements plan",
    ("6002", "68307"): "Grants to relieve electricity prices",
    ("3208", "87601"): "Compensation and costs from foreign-related guarantees and debt rescheduling",
    ("6002", "67104"): "Reimbursement of losses from the guarantee for the KfW special programme 2020",
    ("6002", "68501"): "Grant to the postal civil servants' pension fund",
    ("0625", "42201"): "Pay of civil servants (Federal Police)",
    ("0813", "42201"): "Pay of civil servants (Customs)",
    ("2301", "89611"): "Bilateral financial cooperation (grants)",
    ("2301", "89603"): "Bilateral technical cooperation",
    ("0501", "68732"): "Humanitarian aid abroad",
    ("2501", "88206"): "Social housing",
    ("1603", "89101"): "Final disposal and site selection procedure",
    ("2501", "89305"): "Grants for buying a home (Baukindergeld)",
    ("1216", "63401"): "Reimbursement of administrative expenses of the Federal Railway Fund",
    ("6002", "46171"): "Reinforcement of personnel expenditure",
    ("6002", "63401"): "Allocation to the special fund Reconstruction Aid 2021",
}


def lese(jahr):
    zeilen = []
    with open(ROH / f"HH_{jahr}_ALL.csv", encoding="utf-8-sig", newline="") as f:
        for z in csv.DictReader(f, delimiter=";"):
            z = {k.strip(): (v or "").strip() for k, v in z.items() if k is not None}
            if z["einahmen-ausgaben"] == "A" and not z["kapitel-text"].startswith("Anlage"):
                z["soll"] = int(z["soll"] or 0)
                zeilen.append(z)
    return zeilen


def sauber(text):
    """Formatierungsreste und ' - ' aus Namen der Rohdaten entfernen."""
    text = text.replace('"', "").strip()
    text = re.sub(r"\s*\(\d{4}\)$", "", text)
    text = re.sub(r" - ([^-]{1,12})$", r" (\1)", text)
    text = text.replace(" der Die ", " der ")
    return text.replace(" - ", ": ")


def mrd(tausend):
    e = tausend / 1e6
    if abs(e) >= 1:
        return f"{e:.1f}".replace(".", ",") + " Mrd. €"
    return f"{tausend / 1e3:.0f}".replace(".", ",") + " Mio. €"


def mrd_en(tausend):
    e = tausend / 1e6
    if abs(e) >= 1:
        return f"€{e:.1f}bn"
    return f"€{tausend / 1e3:.0f}m"


PRAEFIX = {p: b for b, liste in FUNKTIONEN.items() for p in liste}
ABW = {(a["kapitel"], a["titel"]): a["bereich"] for a in ABWEICHUNGEN}


def bereich_von(z):
    if (z["kapitel"], z["titel"]) in ABW:
        return ABW[(z["kapitel"], z["titel"])]
    f = z["funktion"]
    for laenge in (3, 2):
        if f[:laenge] in PRAEFIX:
            return PRAEFIX[f[:laenge]]
    raise ValueError(f"Funktion {f} (Kap. {z['kapitel']} Tit. {z['titel']}) keinem Bereich zugeordnet")


def woerter(text):
    return len(re.findall(r"\S+", text))


def main():
    ids = [b["id"] for b in BEREICHE]
    assert set(ids) == set(FUNKTIONEN), "Bereichsliste und Funktionszuordnung passen nicht zusammen"

    summe = {j: defaultdict(int) for j in JAHRE}
    titel26 = defaultdict(list)
    funk = defaultdict(set)
    eps = defaultdict(lambda: defaultdict(lambda: {"name": "", "2025": 0, "2026": 0}))
    kaps = defaultdict(lambda: defaultdict(lambda: {"name": "", "2025": 0, "2026": 0}))
    ba = defaultdict(lambda: defaultdict(int))
    ba_kategorie = defaultdict(int)
    abw_betrag = defaultdict(lambda: {j: 0 for j in JAHRE})

    for jahr in JAHRE:
        for z in lese(jahr):
            b = bereich_von(z)
            summe[jahr][b] += z["soll"]
            if (z["kapitel"], z["titel"]) in ABW:
                abw_betrag[(z["kapitel"], z["titel"])][jahr] += z["soll"]
            ep = eps[b][z["einzelplan"]]
            ep["name"] = z["einzelplan-text"]
            ep[jahr] += z["soll"]
            kap = kaps[b][z["kapitel"]]
            kap["name"] = sauber(z["kapitel-text"])
            kap[jahr] += z["soll"]
            if jahr == "2026":
                funk[b].add(z["funktion"])
                titel26[b].append(z)
                kat = bereichsausnahme(z)
                if kat:
                    ba[b][kat] += z["soll"]
                    ba_kategorie[kat] += z["soll"]

    # Prüfungen
    fehler = []
    gesamt26 = sum(summe["2026"].values())
    if gesamt26 != GESAMTPLAN_2026:
        fehler.append(f"Summe 2026 {gesamt26:,} statt {GESAMTPLAN_2026:,}")
    for kat, soll in BA_SOLL_2026.items():
        if ba_kategorie[kat] != soll:
            fehler.append(f"Bereichsausnahme '{kat}': {ba_kategorie[kat]:,} statt {soll:,}")

    bereiche = []
    for d in BEREICHE:
        b = d["id"]
        top = sorted(titel26[b], key=lambda z: -z["soll"])[:3]
        namen = [TITEL_DE.get((z["kapitel"], z["titel"]), sauber(z["titel-text"])) for z in top]
        posten = []
        for z, name in zip(top, namen):
            # Gleichnamige Titel (z. B. Beamtenbezüge) durch das Kapitel unterscheidbar machen
            if namen.count(name) > 1:
                name = f"{name} ({sauber(z['kapitel-text'])})"
            posten.append({"kapitel": z["kapitel"], "titel": z["titel"], "name": name,
                           "betrag_2026": z["soll"], "text": f"{name}: {mrd(z['soll'])}"})
        e = d["erklaerung"]
        anzahl = sum(woerter(e[t]) for t in ("was_ist_das", "wer_bekommt_das_geld", "warum_so_viel"))
        anzahl += sum(woerter(p["text"]) for p in posten) + sum(woerter(g["text"]) for g in e["gut_zu_wissen"])
        if anzahl > 150:
            fehler.append(f"Bereich {b}: {anzahl} Wörter (maximal 150)")

        en = BEREICHE_EN[b]
        if len(en["gut"]) != len(e["gut_zu_wissen"]):
            fehler.append(f"Bereich {b}: Anzahl 'Gut zu wissen' Deutsch und Englisch verschieden")
        posten_en = []
        for p in posten:
            name_en = TITEL_EN.get((p["kapitel"], p["titel"]), p["name"])
            posten_en.append({"name": name_en, "text": f"{name_en}: {mrd_en(p['betrag_2026'])}"})
        anzahl_en = sum(woerter(en[t]) for t in ("was", "wer", "warum"))
        anzahl_en += sum(woerter(p["text"]) for p in posten_en) + sum(woerter(g) for g in en["gut"])
        if anzahl_en > 150:
            fehler.append(f"Bereich {b}: {anzahl_en} Wörter Englisch (maximal 150)")
        englisch = {
            "name": en["name"],
            "begruendung": en["begruendung"],
            "erklaerung": {
                "was_ist_das": en["was"],
                "wer_bekommt_das_geld": en["wer"],
                "groesste_posten": posten_en,
                "warum_so_viel": en["warum"],
                "gut_zu_wissen": [{"text": t, "quelle": g["quelle"]} for t, g in zip(en["gut"], e["gut_zu_wissen"])],
                "woerter": anzahl_en,
            },
        }

        ba_summe = sum(ba[b].values())
        s26, s25 = summe["2026"][b], summe["2025"][b]
        quellen = [QUELLE_HAUSHALT] + d.get("zusatzquellen", [])
        for g in e["gut_zu_wissen"]:
            if g["quelle"] not in quellen:
                quellen.append(g["quelle"])
        bereiche.append({
            "id": b,
            "name": d["name"],
            "betrag_2026": s26,
            "betrag_2025": s25,
            "anteil_2026": round(s26 / gesamt26, 4),
            "funktionen": FUNKTIONEN[b],
            "funktionskennziffern": sorted(funk[b]),
            "abweichungen": [f"Kap. {a['kapitel']} Tit. {a['titel']}" for a in ABWEICHUNGEN if a["bereich"] == b],
            "einzelplaene": [{"nr": nr, "name": v["name"], "betrag_2026": v["2026"], "betrag_2025": v["2025"]}
                             for nr, v in sorted(eps[b].items(), key=lambda x: -x[1]["2026"]) if v["2026"] or v["2025"]],
            "kapitel": [{"nr": nr, "name": v["name"], "betrag_2026": v["2026"], "betrag_2025": v["2025"]}
                        for nr, v in sorted(kaps[b].items(), key=lambda x: -x[1]["2026"]) if v["2026"] or v["2025"]],
            "bindung": d["bindung"],
            "begruendung": d["begruendung"],
            "quelle": d["quelle"],
            "bereichsausnahme": {
                "betroffen": "ganz" if ba_summe == s26 else ("teilweise" if ba_summe else "nein"),
                "betrag_2026": ba_summe,
                "kategorien": dict(ba[b]),
            },
            "erklaerung": {
                "was_ist_das": e["was_ist_das"],
                "wer_bekommt_das_geld": e["wer_bekommt_das_geld"],
                "groesste_posten": posten,
                "warum_so_viel": e["warum_so_viel"],
                "gut_zu_wissen": e["gut_zu_wissen"],
                "quellen": quellen,
                "woerter": anzahl,
            },
            "en": englisch,
        })

    daten = {
        "einheit": "Tausend Euro",
        "art": "Soll laut Bundeshaushaltsplan 2025 und 2026, Kernhaushalt ohne Sondervermögen",
        "quelle": QUELLE_HAUSHALT,
        "summe_2026": gesamt26,
        "summe_2025": sum(summe["2025"].values()),
        "zuordnung": "Jeder Ausgabetitel ist genau einem Bereich zugeordnet, nach seiner Funktionskennziffer "
                     "(Funktionenplan des Bundes). Längstes passendes Präfix gewinnt; Ausnahmen siehe 'abweichungen'.",
        "abweichungen": [{**a, "betrag_2026": abw_betrag[(a["kapitel"], a["titel"])]["2026"],
                          "betrag_2025": abw_betrag[(a["kapitel"], a["titel"])]["2025"]} for a in ABWEICHUNGEN],
        "gliederungshinweise": GLIEDERUNGSHINWEISE,
        "bindung_stufen": {
            "gesetzlich gebunden": "nur durch Gesetzesänderung veränderbar",
            "teilweise gebunden": "ein Teil ist gesetzlich oder vertraglich festgelegt, ein Teil politisch gestaltbar",
            "politisch frei gestaltbar": "Höhe wird im Haushaltsverfahren politisch festgelegt",
        },
        "bereichsausnahme": {
            "erklaerung": "Nach Art. 115 Abs. 2 GG zählen Ausgaben für Verteidigung, Zivil- und Bevölkerungsschutz, "
                          "Nachrichtendienste, Schutz informationstechnischer Systeme und Hilfe für völkerrechtswidrig "
                          "angegriffene Staaten nicht für die Schuldenbremse, soweit sie 1 % des Bruttoinlandsprodukts "
                          "übersteigen. Die Beträge je Bereich zeigen alle Ausgaben dieser Kategorien, nicht nur den "
                          "Teil über 1 %.",
            "summe_2026": sum(ba_kategorie.values()),
            "schwelle_1_prozent_bip_2026": 43_290_000,
            "abzug_2026": 57_573_000,
            "kategorien_2026": dict(ba_kategorie),
            "quelle": [QUELLE_VORSPANN, gesetz("Art. 115 Grundgesetz", "gg/art_115.html")],
            "hinweis": "Für 2025 nicht berechnet. Schwelle und Abzug laut Vorspann 2026 in Millionen Euro "
                       "(43.290 und 57.573), hier in Tausend Euro.",
        },
        "bereiche": bereiche,
    }
    ZIEL.write_text(json.dumps(daten, ensure_ascii=False, indent=1), encoding="utf-8")

    print(f"Geschrieben: {ZIEL.relative_to(PROJEKT)}")
    for x in bereiche:
        print(f"{x['name']:<40} {x['betrag_2026'] / 1e6:7.1f} Mrd. €  {x['anteil_2026'] * 100:5.1f} %  "
              f"BA: {x['bereichsausnahme']['betroffen']:<9}  {x['erklaerung']['woerter']} / "
              f"{x['en']['erklaerung']['woerter']} Wörter (DE/EN)")
    print(f"Summe 2026: {gesamt26:,}".replace(",", "."))
    if fehler:
        print("FEHLER:\n  " + "\n  ".join(fehler))
        sys.exit(1)
    print("Prüfungen bestanden: Summe 2026 und Bereichsausnahme stimmen mit dem Gesamtplan überein.")


if __name__ == "__main__":
    main()
