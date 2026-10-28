"""Zentrale Jahresangaben für alle Skripte. Beim Jahreswechsel hier anpassen (siehe JAHRESWECHSEL.md).

Die gleichen drei Jahre stehen für die App in js/sprache.js (HAUPTJAHR, VORJAHR, ENTWURFSJAHR).
skripte/jahr_pruefen.py prüft, dass beide Stellen übereinstimmen.
"""

# Beschlossener Haushalt, auf den sich Treemap, Anteile, Spiel und Verteilen beziehen (Soll)
HAUPTJAHR = "2026"
# Vergleichsjahr (Soll)
VORJAHR = "2025"
# Regierungsentwurf für das nächste Jahr, noch nicht beschlossen. None, wenn es gerade keinen gibt.
ENTWURFSJAHR = "2027"

# Rohdateien in daten/roh/ (werden nur gelesen)
ROHDATEIEN = {
    "2025": "HH_2025_ALL.csv",
    "2026": "HH_2026_ALL.csv",
    "2027": "HH_2027_RegE_ALL.csv",   # Regierungsentwurf, noch nicht beschlossen
}

# Summe des Kernhaushalts zum Abgleich, Tausend Euro (Gesamtplan bzw. Regierungsentwurf)
SUMMEN = {
    "2025": 502_546_135,
    "2026": 524_540_138,
    "2027": 555_435_744,   # 555,4 Mrd. Euro laut Bundesfinanzministerium und Bundestag
}

# Die Jahre, die in die Daten kommen, in zeitlicher Reihenfolge
JAHRE = tuple(j for j in (VORJAHR, HAUPTJAHR, ENTWURFSJAHR) if j)


def pruefe_handwerte(name, jahr):
    """Bricht ab, wenn von Hand eingetragene Werte (z. B. aus dem Vorspann) nicht zum Hauptjahr passen."""
    if jahr != HAUPTJAHR:
        raise SystemExit(f"{name} gilt für {jahr}, das Hauptjahr ist aber {HAUPTJAHR}. "
                         f"Bitte die Werte für {HAUPTJAHR} eintragen (siehe JAHRESWECHSEL.md).")
