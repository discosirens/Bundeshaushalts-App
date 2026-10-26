"""Minimaler Leser für Excel-Dateien (.xlsx) mit der Python-Standardbibliothek.

Eine .xlsx-Datei ist ein ZIP-Archiv mit XML-Dateien. Gelesen werden die zuletzt
berechneten Zellwerte, keine Formeln. Verwendet von hintergrund_erzeugen.py.
"""

import html
import re
import zipfile


def oeffne(pfad):
    """Gibt (zip, gemeinsame Texte, {Blattname: Pfad im Archiv}) zurück."""
    z = zipfile.ZipFile(pfad)
    texte = []
    if "xl/sharedStrings.xml" in z.namelist():
        xml = z.read("xl/sharedStrings.xml").decode("utf8")
        for si in re.findall(r"<si>(.*?)</si>", xml, re.S):
            texte.append(html.unescape("".join(re.findall(r"<t[^>]*>(.*?)</t>", si, re.S))))
    mappe = z.read("xl/workbook.xml").decode("utf8")
    rels = dict(re.findall(r'Id="([^"]+)"[^>]*Target="([^"]+)"', z.read("xl/_rels/workbook.xml.rels").decode("utf8")))
    blaetter = {html.unescape(name): "xl/" + rels[rid].lstrip("/").replace("xl/", "")
                for name, rid in re.findall(r'<sheet [^>]*name="([^"]+)"[^>]*r:id="([^"]+)"', mappe)}
    return z, texte, blaetter


def zeilen(z, texte, blattpfad):
    """Liefert jede Zeile als {Spaltenbuchstabe: Wert}."""
    xml = z.read(blattpfad).decode("utf8")
    for zeile in re.findall(r"<row[^>]*>(.*?)</row>", xml, re.S):
        werte = {}
        for spalte, attribute, inhalt in re.findall(r'<c r="([A-Z]+)\d+"([^>]*)>(.*?)</c>', zeile, re.S):
            v = re.search(r"<v>(.*?)</v>", inhalt, re.S)
            inline = re.search(r"<t[^>]*>(.*?)</t>", inhalt, re.S)
            if 't="s"' in attribute and v:
                werte[spalte] = texte[int(v.group(1))]
            elif v:
                werte[spalte] = html.unescape(v.group(1))
            elif inline:
                werte[spalte] = html.unescape(inline.group(1))
        yield werte
