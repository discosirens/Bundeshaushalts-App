"""Setzt eine neue Versionsnummer für CSS, JavaScript und Daten in allen HTML-Seiten.

Aufruf (im Projektordner, vor jedem Hochladen):  py skripte/version_setzen.py

Hintergrund: GitHub Pages erlaubt Browsern, Dateien 10 Minuten zwischenzuspeichern. Ohne neue
Versionsnummer kann ein Browser eine neue Seite mit einer alten Datei kombinieren (dann fehlen
z. B. Texte). Die Nummer hängt als ?v=... an jeder Datei; die Skripte lesen sie aus
<meta name="app-version"> und hängen sie auch an die Daten-Abrufe.
"""

import re
from datetime import datetime
from pathlib import Path

PROJEKT = Path(__file__).resolve().parent.parent


def main():
    version = datetime.now().strftime("%Y%m%d%H%M%S")
    for seite in sorted(PROJEKT.glob("*.html")):
        text = seite.read_text(encoding="utf-8")
        # Lokale CSS- und JS-Dateien: ?v=... setzen oder ersetzen
        text = re.sub(r'((?:src|href)="(?:css|js)/[^"?]+)(?:\?v=[^"]*)?"', rf'\1?v={version}"', text)
        # Versions-Meta setzen oder ergänzen
        if 'name="app-version"' in text:
            text = re.sub(r'<meta name="app-version" content="[^"]*">', f'<meta name="app-version" content="{version}">', text)
        else:
            text = text.replace('<meta name="theme-color"', f'<meta name="app-version" content="{version}">\n  <meta name="theme-color"', 1)
        seite.write_text(text, encoding="utf-8")
        print(f"{seite.name}: Version {version}")


if __name__ == "__main__":
    main()
