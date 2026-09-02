#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Genera un único archivo HTML autocontenido (CSS + JS embebidos) a partir de la
home, para abrir con doble clic sin servidor. dev-only.
Uso: python tools/build_standalone.py
"""
import os, re, base64

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST = os.path.join(ROOT, "dist")
os.makedirs(DIST, exist_ok=True)

def rd(*p):
    with open(os.path.join(ROOT, *p), encoding="utf-8") as f:
        return f.read()

html = rd("index.html")
css = rd("styles.css")
js = "\n".join([rd("js", "calculo.js"), rd("js", "datos.js"), rd("js", "ui.js")])

# favicon como data URI
fav = base64.b64encode(rd("favicon.svg").encode("utf-8")).decode("ascii")
fav_uri = "data:image/svg+xml;base64," + fav

# 1. CSS inline
html = html.replace(
    '<link rel="stylesheet" href="/styles.css?v=20260902">',
    "<style>\n" + css + "\n</style>")

# 2. favicon inline
html = html.replace('href="/favicon.svg"', 'href="' + fav_uri + '"')

# 3. Reemplazar los 3 scripts externos por un único bloque inline
html = re.sub(
    r'  <script defer src="/js/calculo\.js\?v=20260902"></script>\s*'
    r'<script defer src="/js/datos\.js\?v=20260902"></script>\s*'
    r'<script defer src="/js/ui\.js\?v=20260902"></script>',
    lambda m: "  <script>\n" + js + "\n</script>",
    html, flags=re.S)
# fallback si el layout tiene saltos de línea distintos: quitar cualquier script /js/ suelto
html = re.sub(r'\s*<script defer src="/js/[^"]+"></script>', "", html)
if "window.__CALC__" not in html:  # asegurar que el JS quedó embebido
    html = html.replace("</body>", "  <script>\n" + js + "\n</script>\n</body>")

# 4. Links internos de directorio -> ancla a la calculadora (no romper offline)
html = re.sub(r'href="/[a-z0-9\-]+/"', 'href="#calculadora"', html)
html = html.replace('href="/"', 'href="#"')

# 5. Nota de versión offline en el título del documento (no visible)
out = os.path.join(DIST, "importar-ar-calculadora.html")
with open(out, "w", encoding="utf-8", newline="\n") as f:
    f.write(html)
print("escrito:", os.path.relpath(out, ROOT), "(", len(html), "bytes )")
