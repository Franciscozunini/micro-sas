#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generador de páginas de contenido (dev-only, NO se sube al hosting).
Produce <slug>/index.html para las guías por tienda y los ejemplos numéricos,
reutilizando un shell común (head/header/footer/scripts) y escribiendo el
cuerpo diferenciado de cada página.

Uso:  python tools/generar_paginas.py
"""
import os, html

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VER = "20260902"
BASE = "https://importar.ar"

BRAND_MARK = ('<span class="brand-mark"><svg viewBox="0 0 24 24">'
              '<path d="M12 3 21 7.2 12 11.4 3 7.2 12 3Z"/>'
              '<path d="M3 7.2V17l9 4.2 9-4.2V7.2"/>'
              '<path d="M12 11.4v10"/></svg></span>')

HEADER = f'''  <header class="site-header">
    <div class="container">
      <a class="brand" href="/">{BRAND_MARK}ImportáAR</a>
      <nav class="nav-links" aria-label="Navegación principal">
        <a href="/calculadora-importacion-argentina/">Calculadora</a>
        <a href="/que-es-la-franquicia-de-400-dolares/">Franquicia USD 400</a>
        <a href="/impuestos-compras-exterior-argentina/">Impuestos</a>
        <a class="nav-cta" href="/calculadora-importacion-argentina/">Calcular ahora</a>
      </nav>
    </div>
  </header>'''

FOOTER = f'''  <footer class="site-footer">
    <div class="container">
      <div class="footer-grid">
        <div class="footer-brand">
          <a class="brand" href="/">{BRAND_MARK}ImportáAR</a>
          <p>Calculadora gratuita y sin registro del costo de importar por el régimen de Pequeños Envíos/Courier en Argentina. Estimación informativa, no asesoría fiscal ni aduanera.</p>
        </div>
        <div class="footer-col"><h4>Herramienta</h4><ul><li><a href="/calculadora-importacion-argentina/">Calculadora</a></li><li><a href="/que-es-la-franquicia-de-400-dolares/">Franquicia USD 400</a></li><li><a href="/impuestos-compras-exterior-argentina/">Impuestos de importación</a></li></ul></div>
        <div class="footer-col"><h4>Guías y ejemplos</h4><ul><li><a href="/comprar-en-amazon-y-traer-a-argentina/">Amazon</a></li><li><a href="/comprar-en-aliexpress-y-traer-a-argentina/">AliExpress</a></li><li><a href="/cuanto-cuesta-traer-una-notebook/">Traer una notebook</a></li><li><a href="/cuanto-cuesta-traer-una-ps5/">Traer una PS5</a></li></ul></div>
      </div>
      <div class="footer-bottom">
        <span>© <span data-anio>2026</span> ImportáAR · Estimación informativa, no asesoría fiscal ni aduanera.</span>
        <span><a href="/privacidad/">Privacidad</a> · <a href="/aviso-legal/">Aviso legal</a></span>
      </div>
    </div>
  </footer>'''

SCRIPTS = f'''  <script defer src="/js/calculo.js?v={VER}"></script>
  <script defer src="/js/datos.js?v={VER}"></script>
  <script defer src="/js/ui.js?v={VER}"></script>'''


def faq_jsonld(pairs):
    items = ",".join(
        '{ "@type": "Question", "name": %s, "acceptedAnswer": { "@type": "Answer", "text": %s } }'
        % (jstr(q), jstr(a)) for q, a in pairs)
    return ('<script type="application/ld+json">\n  { "@context": "https://schema.org", '
            '"@type": "FAQPage", "mainEntity": [' + items + '] }\n  </script>')


def jstr(s):
    import json
    return json.dumps(s, ensure_ascii=False)


def faq_html(pairs):
    out = ['<h2>Preguntas frecuentes</h2>', '<div class="faq">']
    for q, a in pairs:
        out.append('<details><summary>%s</summary><div><p>%s</p></div></details>'
                   % (html.escape(q), a))
    out.append('</div>')
    return "\n        ".join(out)


def calc_block(prefill=None, empty_intro=""):
    attrs = 'data-calc'
    if prefill:
        attrs += f' data-prefill="{prefill}"'
    head = ('<div class="tool-head"><h2>Probalo con tus números</h2>'
            f'<p>{empty_intro or "Cambiá los valores por los de tu compra. El cálculo es instantáneo y privado."}</p></div>')
    return f'''<div class="embed-tool">
        <div class="tool-card">
          {head}
          <div {attrs}></div>
          <noscript><p class="noscript-msg">La calculadora necesita JavaScript activado.</p></noscript>
        </div>
      </div>'''


def page(slug, title, desc, eyebrow, h1, sub, body, faq, crumb):
    faqp_html = faq_html(faq) if faq else ""
    faqp_ld = "\n  " + faq_jsonld(faq) if faq else ""
    doc = f'''<!doctype html>
<html lang="es-AR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{html.escape(title)}</title>
  <meta name="description" content="{html.escape(desc)}">
  <link rel="canonical" href="{BASE}/{slug}/">
  <meta name="theme-color" content="#0a6cff">
  <meta name="robots" content="index, follow">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="ImportáAR">
  <meta property="og:locale" content="es_AR">
  <meta property="og:title" content="{html.escape(h1)}">
  <meta property="og:description" content="{html.escape(desc)}">
  <meta property="og:url" content="{BASE}/{slug}/">
  <meta property="og:image" content="{BASE}/assets/og-default.svg">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap">
  <link rel="stylesheet" href="/styles.css?v={VER}">{faqp_ld}
</head>
<body>
  <a class="skip-link" href="#main">Saltar al contenido</a>
{HEADER}

  <main id="main">
    <section class="page-hero">
      <div class="container narrow">
        <nav class="breadcrumb" aria-label="Migas"><a href="/">Inicio</a> <span>›</span> <span>{html.escape(crumb)}</span></nav>
        <span class="eyebrow">{html.escape(eyebrow)}</span>
        <h1>{html.escape(h1)}</h1>
        <p class="sub">{html.escape(sub)}</p>
      </div>
    </section>

    <section style="padding-top:0">
      <div class="container narrow article">
        {body}
        {faqp_html}
        <div class="callout" style="margin-top:2rem">
          <h3>Seguí calculando</h3>
          <p>Abrí la <a href="/calculadora-importacion-argentina/">calculadora completa</a> o mirá otros ejemplos:</p>
          <ul>
            <li><a href="/cuanto-cuesta-traer-una-notebook/">Traer una notebook</a></li>
            <li><a href="/cuanto-cuesta-traer-un-celular/">Traer un celular</a></li>
            <li><a href="/cuanto-cuesta-traer-una-ps5/">Traer una PS5</a></li>
            <li><a href="/que-es-la-franquicia-de-400-dolares/">Qué es la franquicia de USD 400</a></li>
          </ul>
        </div>
      </div>
    </section>
  </main>

{FOOTER}

{SCRIPTS}
</body>
</html>
'''
    outdir = os.path.join(ROOT, slug)
    os.makedirs(outdir, exist_ok=True)
    with open(os.path.join(outdir, "index.html"), "w", encoding="utf-8", newline="\n") as f:
        f.write(doc)
    print("  escrito:", slug + "/index.html")


DISCLAIMER_NOTE = ('<blockquote>Los montos de derecho de importación, tasa estadística, IVA e '
                   'impuestos internos dependen de la categoría del producto y pueden variar: '
                   'esta guía no los inventa. Para el monto final exacto, consultá con tu courier o con ARCA.</blockquote>')

# ---------------------------------------------------------------------------
# CONTENIDO POR PÁGINA (diferenciado, no thin content)
# ---------------------------------------------------------------------------
PAGES = []

PAGES.append(dict(
    slug="comprar-en-amazon-y-traer-a-argentina",
    title="Comprar en Amazon y traerlo a Argentina: cuánto sale | ImportáAR",
    desc="Cómo estimar el costo de traer una compra de Amazon a Argentina por el régimen courier: separar producto y envío, la franquicia de USD 400 y el Import Fees Deposit.",
    eyebrow="Guía por tienda",
    h1="Comprar en Amazon y traerlo a Argentina",
    sub="Amazon muestra el precio del producto y el envío por separado en el checkout: esa distinción es justo la que necesita la calculadora.",
    crumb="Comprar en Amazon",
    body=f'''<p class="lead">Amazon es de las tiendas más fáciles de estimar, porque en el checkout ya te separa <strong>precio del producto</strong> y <strong>envío internacional</strong>. Eso encaja con la lógica del régimen courier: la franquicia de USD 400 se mide sobre el producto (FOB), no sobre el total.</p>

        <h2>Paso 1: encontrá el FOB real</h2>
        <p>El <strong>valor FOB</strong> es el precio de la mercadería sin el envío. En Amazon, es el precio de lista del artículo (antes de "Shipping" y del "Import Fees Deposit"). Si comprás varias unidades del mismo producto, el FOB es la suma de todas.</p>
        <p><span class="tag-warn">Ojo</span> Amazon a veces cobra por adelantado un <strong>"Import Fees Deposit"</strong> (un depósito estimado de impuestos de importación). Ese cargo no es el FOB ni el flete: es la estimación que hace Amazon de los tributos. Cárgalo, si querés tenerlo en cuenta, en "Gastos del courier" — pero recordá que es una estimación de Amazon, no un valor oficial.</p>

        <h2>Paso 2: el envío va aparte</h2>
        <p>El costo de "Shipping" es tu <strong>flete</strong>. Sumado al FOB y al seguro forma el CIF, que es el total de la operación — pero no cambia si estás dentro o fuera de la franquicia. Eso lo decide sólo el FOB.</p>

        <h2>Paso 3: mirá los topes</h2>
        <ul>
          <li>Productos de marca (electrónica, zapatillas) suelen tener FOB alto: es fácil pasar los USD 400 y generar excedente.</li>
          <li>El régimen admite hasta <strong><span data-const="TOPE_UNIDADES">3</span> unidades</strong> de la misma especie: si comprás 4 del mismo modelo, puede no calificar como envío sin fin comercial.</li>
          <li>Tope de <strong>USD <span data-const="TOPE_FOB_USD">3.000</span></strong> FOB por envío.</li>
        </ul>
        {DISCLAIMER_NOTE}
        {calc_block(empty_intro="Cargá el precio del producto de Amazon en FOB y el Shipping en flete.")}
        <h2>Ejemplo rápido</h2>
        <p>Unos auriculares de USD 220 con USD 35 de envío: FOB 220 (dentro de la franquicia), CIF 255. No hay excedente, y el IVA/impuestos internos podrían corresponder según el producto pero no se calculan automáticamente. Si en cambio comprás un producto de USD 650, hay un excedente de USD 250 sobre el que corresponden tributos.</p>''',
    faq=[
        ("¿El Import Fees Deposit de Amazon es lo que voy a pagar de impuestos?",
         "Es una estimación que hace Amazon y puede diferir de lo que finalmente aplique el courier o la aduana. No es un valor oficial. En la calculadora podés cargarlo como gasto del courier si querés tenerlo en cuenta."),
        ("¿Puedo juntar varios productos distintos en un envío?",
         "Sí, mientras el FOB total no supere los USD 3.000 y no haya más de 3 unidades de la misma especie. El límite de 3 es por producto igual, no por el total de ítems distintos."),
        ("¿El envío cuenta para la franquicia de USD 400?",
         "No. La franquicia se compara sólo contra el FOB (el producto). El envío suma al CIF y al costo total, pero no define si estás dentro de la franquicia."),
    ],
))

PAGES.append(dict(
    slug="comprar-en-aliexpress-y-traer-a-argentina",
    title="Comprar en AliExpress y traerlo a Argentina: cuánto sale | ImportáAR",
    desc="Guía para estimar el costo de traer compras de AliExpress a Argentina: envíos baratos, unidades iguales y el tope de 3, y la franquicia de USD 400 sobre el FOB.",
    eyebrow="Guía por tienda",
    h1="Comprar en AliExpress y traerlo a Argentina",
    sub="En AliExpress el envío suele ser barato o gratis y los productos económicos: la mayoría de las compras entran cómodas en la franquicia de USD 400.",
    crumb="Comprar en AliExpress",
    body=f'''<p class="lead">AliExpress tiene dos particularidades que conviene entender: el <strong>envío muchas veces es gratis o muy barato</strong> (flete bajo) y es común comprar <strong>varias unidades del mismo ítem</strong>, donde aparece el tope de 3 de la misma especie.</p>

        <h2>El FOB en AliExpress</h2>
        <p>El precio que ves del producto es tu FOB. Si el vendedor ofrece "Free Shipping", tu flete es 0 y el CIF es igual al FOB. Cuando el envío tiene costo (por ejemplo, envíos premium o AliExpress Standard), ese valor es el flete y va aparte.</p>

        <h2>El tope de 3 unidades de la misma especie</h2>
        <p>Comprar 5 fundas iguales o 4 veces el mismo repuesto puede exceder el límite de <strong><span data-const="TOPE_UNIDADES">3</span> unidades</strong> de la misma especie y hacer que el envío no califique como sin fin comercial. Si te pasa, la calculadora te lo advierte, pero no te bloquea: la decisión final depende del criterio del courier y la aduana.</p>

        <h2>Muchos ítems baratos: sumá el FOB</h2>
        <p>Si armás un carrito con varios productos distintos, el FOB relevante es la <strong>suma de todos</strong>. Aun así, con precios bajos es difícil superar los USD 400: por eso la mayoría de las compras de AliExpress quedan dentro de la franquicia.</p>
        {DISCLAIMER_NOTE}
        {calc_block(empty_intro="Poné el precio del producto en FOB y, si el envío tiene costo, cargalo en flete.")}
        <h2>Ejemplo rápido</h2>
        <p>Un accesorio de USD 18 con envío gratis: FOB 18, flete 0, CIF 18. Dentro de la franquicia, sin excedente. Un pedido combinado de USD 460 en varios productos distintos, en cambio, genera un excedente de USD 60 sobre el que corresponden tributos que no se calculan automáticamente.</p>''',
    faq=[
        ("¿El 'Free Shipping' de AliExpress cambia los impuestos?",
         "El envío gratis hace que tu flete sea 0, así que el CIF es igual al FOB. Pero la franquicia siempre se mide sobre el FOB, tengas o no envío gratis."),
        ("Compré 5 unidades iguales, ¿tengo problema?",
         "Podrías: con más de 3 unidades de la misma especie el envío puede no calificar como sin fin comercial. Es un aviso, no un bloqueo: consultá con tu courier."),
        ("¿Y si el pedido tarde meses en llegar?",
         "El tiempo de envío no cambia el cálculo de costos. Lo que definís acá es cuánto te sale, no cuánto tarda."),
    ],
))

PAGES.append(dict(
    slug="comprar-en-temu-y-traer-a-argentina",
    title="Comprar en Temu y traerlo a Argentina: cuánto sale | ImportáAR",
    desc="Cómo estimar el costo de traer una compra de Temu a Argentina: carritos de muchos productos chicos, FOB total y el régimen de Pequeños Envíos/Courier.",
    eyebrow="Guía por tienda",
    h1="Comprar en Temu y traerlo a Argentina",
    sub="Temu incentiva carritos grandes de productos baratos. La clave es sumar bien el FOB total y no confundir el precio combinado con el envío.",
    crumb="Comprar en Temu",
    body=f'''<p class="lead">Temu funciona con <strong>muchos productos de bajo precio</strong> en un mismo pedido. Individualmente casi nada supera los USD 400, pero el <strong>FOB total del carrito</strong> puede acercarse a la franquicia si cargás muchas cosas.</p>

        <h2>Sumá el FOB de todo el carrito</h2>
        <p>Para el régimen courier, lo que importa es el valor total de la mercadería del envío. Si tu carrito tiene 20 ítems que suman USD 380, ese es tu FOB y estás dentro de la franquicia. Si suma USD 520, hay un excedente de USD 120.</p>

        <h2>Envío y "descuentos" no son lo mismo que el FOB</h2>
        <p>Temu muestra muchos precios tachados y promociones. Lo que necesitás para el cálculo es el <strong>precio que efectivamente pagás</strong> por la mercadería (FOB) y, aparte, el costo de envío (flete) si lo hubiera.</p>

        <h2>Unidades iguales</h2>
        <p>Si comprás varias unidades del mismo producto, recordá el tope de <strong><span data-const="TOPE_UNIDADES">3</span></strong> de la misma especie. En Temu es fácil caer en esto al aprovechar ofertas por cantidad.</p>
        {DISCLAIMER_NOTE}
        {calc_block(empty_intro="Cargá el total de la mercadería del carrito en FOB y el envío en flete.")}
        <h2>Ejemplo rápido</h2>
        <p>Un carrito de USD 300 en artículos variados con USD 12 de envío: FOB 300, flete 12, CIF 312. Dentro de la franquicia. Si el mismo carrito trepa a USD 700, aparece un excedente de USD 300 sobre el que corresponden tributos según el tipo de producto.</p>''',
    faq=[
        ("¿Cada producto de Temu tiene su propia franquicia?",
         "No. La franquicia es por envío y se mide sobre el FOB total de la mercadería de ese envío, no producto por producto."),
        ("Temu me muestra un precio final con todo incluido, ¿qué pongo?",
         "Tratá de separar mercadería y envío. Si el precio ya incluye envío gratis, ese total es tu FOB y el flete es 0."),
        ("¿Conviene dividir en varios pedidos?",
         "Podés, pero recordá el límite informativo de 5 envíos por persona por año. La herramienta no lo valida porque no guarda historial."),
    ],
))

PAGES.append(dict(
    slug="comprar-en-shein-y-traer-a-argentina",
    title="Comprar en Shein y traerlo a Argentina: cuánto sale | ImportáAR",
    desc="Guía para estimar el costo de traer ropa de Shein a Argentina: unidades de la misma especie, peso liviano y la franquicia de USD 400 sobre el FOB.",
    eyebrow="Guía por tienda",
    h1="Comprar en Shein y traerlo a Argentina",
    sub="La ropa es liviana y barata: el peso rara vez es un problema y la franquicia de USD 400 suele cubrir el pedido. Lo que hay que cuidar son las unidades iguales.",
    crumb="Comprar en Shein",
    body=f'''<p class="lead">En Shein comprás <strong>indumentaria y accesorios</strong>: productos livianos y de precio moderado. Difícilmente te acerques al tope de <span data-const="TOPE_PESO_KG">50</span> kg, y el FOB total del pedido suele quedar dentro de la franquicia.</p>

        <h2>Cuidado con las unidades de la misma especie</h2>
        <p>El punto sensible en Shein es comprar <strong>varias prendas iguales</strong> (por ejemplo, 4 remeras del mismo modelo y color). Eso puede superar el tope de <strong><span data-const="TOPE_UNIDADES">3</span> unidades</strong> de la misma especie. Prendas distintas no tienen ese problema: el límite es por producto igual.</p>

        <h2>El peso casi nunca es el límite</h2>
        <p>Un pedido típico de ropa pesa pocos kilos, muy lejos del tope de <span data-const="TOPE_PESO_KG">50</span> kg. Igual cargalo en la calculadora para que el cálculo sea completo.</p>

        <h2>El FOB es la ropa, no el envío</h2>
        <p>El precio de las prendas es tu FOB. El costo de envío que Shein agrega en el checkout es el flete y va aparte. Con precios bajos, la mayoría de los carritos quedan dentro de la franquicia de USD 400.</p>
        {DISCLAIMER_NOTE}
        {calc_block(empty_intro="Sumá el precio de las prendas en FOB y el envío de Shein en flete.")}
        <h2>Ejemplo rápido</h2>
        <p>Un pedido de USD 90 en varias prendas distintas con USD 15 de envío: FOB 90, flete 15, CIF 105. Cómodo dentro de la franquicia. Si compraras 4 unidades del mismo buzo, la herramienta te advertiría por el tope de unidades iguales.</p>''',
    faq=[
        ("Compré 3 remeras iguales y 3 pantalones iguales, ¿está bien?",
         "Sí: el tope de 3 es por especie. 3 remeras iguales y 3 pantalones iguales son dos especies distintas, cada una dentro del límite."),
        ("¿El peso de la ropa afecta el costo?",
         "En sí no cambia el cálculo de la franquicia. El peso sólo importa para no superar el tope de 50 kg del régimen, algo casi imposible con ropa."),
        ("¿La franquicia me alcanza para un pedido grande de Shein?",
         "Casi siempre: para superar los USD 400 de FOB en ropa hay que cargar bastante. Usá la calculadora con el total del carrito para confirmarlo."),
    ],
))

PAGES.append(dict(
    slug="que-es-la-franquicia-de-400-dolares",
    title="Qué es la franquicia de USD 400 y cómo funciona | ImportáAR",
    desc="Explicación clara de la franquicia de USD 400 del régimen de Pequeños Envíos/Courier: por qué se mide sobre el FOB y no sobre el CIF, y qué pasa con el excedente.",
    eyebrow="Concepto clave",
    h1="Qué es la franquicia de USD 400 y cómo funciona",
    sub="Es el corazón del régimen courier y la fuente de casi todas las dudas. La regla se resume en una frase: la franquicia mira el producto, no el total.",
    crumb="Franquicia USD 400",
    body=f'''<p class="lead">La <strong>franquicia de USD 400</strong> es un monto de valor de mercadería que, por envío, tiene un tratamiento preferencial dentro del régimen de Pequeños Envíos/Courier. La pregunta del millón es: ¿USD 400 <em>de qué</em>?</p>

        <h2>Se mide sobre el FOB, no sobre el CIF</h2>
        <p>Esta es la regla que hay que grabarse. La franquicia se compara contra el <strong>valor FOB</strong> — el precio de la mercadería, sin envío ni seguro — y <strong>no</strong> contra el CIF (que suma el flete y el seguro).</p>
        <table class="example-table">
          <thead><tr><th>Concepto</th><th>Cuenta para la franquicia</th></tr></thead>
          <tbody>
            <tr><td>Valor del producto (FOB)</td><td>Sí</td></tr>
            <tr><td>Envío / flete</td><td>No</td></tr>
            <tr><td>Seguro</td><td>No</td></tr>
            <tr><td>Valor CIF (FOB + flete + seguro)</td><td>No es la base</td></tr>
          </tbody>
        </table>
        <p>Por eso una compra puede tener un CIF alto por el envío y seguir dentro de la franquicia si el producto en sí vale hasta USD 400.</p>

        <h2>El valor 400 es inclusive</h2>
        <p>Un FOB de <strong>exactamente USD 400</strong> se considera dentro de la franquicia. Recién a partir de USD 400,01 hay excedente.</p>

        <h2>Qué es el excedente</h2>
        <p>Si el FOB supera los USD 400, el <strong>excedente</strong> es la diferencia: <code>FOB − 400</code>. Sobre ese excedente corresponden tributos (derecho de importación, tasa estadística, IVA según el producto). Sus alícuotas dependen de la categoría y pueden variar, por eso una herramienta honesta no las inventa.</p>
        <blockquote>Ejemplo: FOB de USD 650 → excedente de USD 250. Los tributos aplican sobre esos 250, no sobre los 650 ni sobre el CIF.</blockquote>

        <h2>Otros límites del régimen</h2>
        <ul>
          <li>Tope de <strong>USD <span data-const="TOPE_FOB_USD">3.000</span></strong> FOB por envío.</li>
          <li>Hasta <strong><span data-const="TOPE_UNIDADES">3</span> unidades</strong> de la misma especie.</li>
          <li>Hasta <strong><span data-const="TOPE_PESO_KG">50</span> kg</strong> por paquete.</li>
          <li>Hasta <strong><span data-const="MAX_ENVIOS_ANIO">5</span> envíos</strong> por persona por año (aviso informativo).</li>
        </ul>''',
    faq=[
        ("Si mi producto sale USD 390 pero el envío USD 300, ¿pago excedente?",
         "No. El FOB es 390, menor a 400, así que estás dentro de la franquicia. El CIF de 690 no cambia eso: la franquicia mira sólo el FOB."),
        ("¿La franquicia es por año o por envío?",
         "Por envío. Podés usarla en cada envío, dentro del límite informativo de 5 envíos por persona por año."),
        ("¿El excedente paga impuestos sobre todo el valor o sólo sobre la diferencia?",
         "Sólo sobre el excedente (FOB − 400). La herramienta calcula ese excedente pero no inventa la alícuota que se aplica."),
    ],
))

PAGES.append(dict(
    slug="impuestos-compras-exterior-argentina",
    title="Impuestos de compras al exterior en Argentina, explicado | ImportáAR",
    desc="Qué tributos pueden aplicar al importar por courier a Argentina: derecho de importación, tasa estadística, IVA e impuestos internos, y por qué no siempre se calculan de antemano.",
    eyebrow="En profundidad",
    h1="Impuestos de compras al exterior en Argentina",
    sub="Un repaso honesto de qué tributos existen, cuáles dependen del producto y por qué una calculadora seria no te tira un número mágico.",
    crumb="Impuestos de importación",
    body=f'''<p class="lead">Cuando traés algo del exterior por el régimen courier, pueden intervenir varios tributos. Entenderlos ayuda a leer el resultado de la calculadora — y a entender por qué algunos montos <strong>no se calculan automáticamente</strong>.</p>

        <h2>Los tributos que pueden aparecer</h2>
        <h3>Derecho de importación</h3>
        <p>Es el tributo aduanero sobre la mercadería importada. Dentro de la franquicia de USD 400 sobre el FOB, no se aplica. Sobre el excedente, corresponde — pero su alícuota depende de la categoría del producto.</p>
        <h3>Tasa estadística</h3>
        <p>Es una tasa asociada al servicio aduanero. Dentro de la franquicia no aplica; sobre el excedente puede corresponder según el caso.</p>
        <h3>IVA e impuestos internos</h3>
        <p>El IVA y, para ciertos productos, los impuestos internos, pueden corresponder según el tipo de bien. Son los más dependientes de la categoría del producto.</p>

        <h2>Por qué no siempre se pueden calcular de antemano</h2>
        <p>Las alícuotas de estos tributos <strong>dependen de la categoría del producto</strong> (posición arancelaria) y pueden variar. Una calculadora que te muestra un único número "final" para cualquier producto está, en el mejor de los casos, promediando, y en el peor, inventando.</p>
        <p>Por eso este proyecto toma una decisión distinta: <strong>calcula con precisión lo que se puede calcular de forma confiable</strong> (la franquicia, el CIF, el excedente) y es <strong>explícito</strong> sobre lo que no. Cuando un tributo corresponde pero su alícuota no está verificada oficialmente, lo dice con todas las letras en vez de mostrar una cifra falsa.</p>
        {DISCLAIMER_NOTE}

        <h2>¿Y si conozco la alícuota?</h2>
        <p>Si tu courier te informó qué porcentaje de tributos te van a cobrar sobre el excedente, podés cargarlo en las <strong>opciones avanzadas</strong> de la calculadora. El monto resultante se muestra siempre etiquetado como <em>"tasa ingresada manualmente por el usuario — no verificada por la herramienta"</em>, para que quede claro de dónde salió.</p>

        <h2>Lo que sí podés estimar con confianza</h2>
        <ul>
          <li>Si tu compra está <strong>dentro o fuera</strong> de la franquicia de USD 400 (mirando el FOB).</li>
          <li>El <strong>valor CIF</strong> (FOB + flete + seguro).</li>
          <li>El <strong>excedente</strong> exacto si el FOB supera los USD 400.</li>
          <li>El <strong>costo estimado</strong> en dólares y en pesos (con tu cotización) sumando lo conocido.</li>
        </ul>
        <p>Para el monto final exacto de los tributos que dependen del producto, la fuente correcta es tu <strong>courier</strong> o <strong>ARCA</strong>.</p>''',
    faq=[
        ("¿Por qué esta calculadora no me da el número final de impuestos?",
         "Porque las alícuotas de derecho de importación, tasa estadística e IVA dependen de la categoría del producto y pueden variar. Preferimos decir qué no se calcula antes que inventar un número."),
        ("¿Dentro de la franquicia pago algo de impuestos?",
         "El derecho de importación y la tasa estadística no aplican dentro de la franquicia. El IVA e impuestos internos pueden corresponder según el producto; por eso lo marcamos como 'no calculado automáticamente' en vez de ponerlo en cero de forma tajante."),
        ("¿Dónde consulto el monto exacto?",
         "Con tu courier, que suele informarte los cargos antes de liberar el envío, o con ARCA."),
    ],
))

# --------- Ejemplos con calculadora embebida (prefill) ---------
PAGES.append(dict(
    slug="cuanto-cuesta-traer-una-notebook",
    title="Cuánto cuesta traer una notebook a Argentina (ejemplo) | ImportáAR",
    desc="Ejemplo numérico real de cuánto sale importar una notebook a Argentina por courier, con la calculadora embebida: FOB, flete, franquicia de USD 400 y excedente.",
    eyebrow="Ejemplo con números",
    h1="Cuánto cuesta traer una notebook a Argentina",
    sub="Las notebooks casi siempre superan la franquicia de USD 400: veamos qué pasa con un caso típico y probalo con tus propios números.",
    crumb="Traer una notebook",
    body=f'''<p class="lead">Una notebook es el caso donde más se nota la franquicia: casi cualquier modelo decente tiene un FOB por encima de los USD 400, así que aparece un excedente. Tomemos un ejemplo y sigámoslo línea por línea.</p>

        <h2>El caso de ejemplo</h2>
        <p>Una notebook de <strong>USD 850</strong> (FOB), con <strong>USD 90</strong> de envío, 1 unidad, ~2 kg, y una cotización de referencia de <strong>$1.200</strong> por dólar.</p>
        <table class="example-table">
          <thead><tr><th>Dato</th><th>Valor</th></tr></thead>
          <tbody>
            <tr><td>Valor FOB (producto)</td><td>USD 850</td></tr>
            <tr><td>Flete (envío)</td><td>USD 90</td></tr>
            <tr><td>Valor CIF (FOB + flete + seguro)</td><td>USD 940</td></tr>
            <tr><td>Excedente sobre la franquicia (850 − 400)</td><td>USD 450</td></tr>
          </tbody>
        </table>
        <p>Como el FOB (850) supera los USD 400, la notebook queda <strong>fuera de la franquicia</strong> y hay un excedente de <strong>USD 450</strong>. Sobre ese excedente corresponden derecho de importación, tasa estadística e IVA según la categoría — montos que <strong>no calculamos automáticamente</strong> porque sus alícuotas dependen del producto y pueden variar.</p>
        {DISCLAIMER_NOTE}
        <h2>Probalo (ya está cargado el ejemplo)</h2>
        <p>Cambiá los valores por los de la notebook que estás mirando. Si tu courier te pasó la alícuota de tributos, cargala en las opciones avanzadas para ver el monto estimado del excedente.</p>
        {calc_block(prefill="notebook", empty_intro="Ejemplo cargado: notebook de USD 850 + USD 90 de envío. Editá lo que quieras.")}
        <h2>Cómo leer el resultado</h2>
        <p>El costo estimado en USD que ves es el CIF más los gastos que hayas cargado; el excedente te avisa que faltan sumar los tributos que dependen del producto. Para saber si te conviene, cargá en las opciones avanzadas el <strong>precio de esa misma notebook en Argentina</strong> y mirá el semáforo.</p>''',
    faq=[
        ("¿Una notebook siempre paga excedente?",
         "Casi siempre, porque su FOB suele superar los USD 400. Sólo un equipo muy económico (FOB de hasta 400) quedaría dentro de la franquicia."),
        ("¿El costo estimado incluye todos los impuestos?",
         "No. Incluye el CIF y los gastos que cargues, y te marca que hay un excedente con tributos no calculados automáticamente. No es una cifra definitiva ni cerrada."),
        ("¿Cómo sé si conviene traerla o comprarla acá?",
         "Cargá el precio local de la misma notebook en las opciones avanzadas: la herramienta compara y te muestra 🟢 conviene, 🟡 similar o 🔴 no conviene."),
    ],
))

PAGES.append(dict(
    slug="cuanto-cuesta-traer-un-celular",
    title="Cuánto cuesta traer un celular a Argentina (ejemplo) | ImportáAR",
    desc="Ejemplo numérico de cuánto sale importar un celular a Argentina por courier, con la calculadora embebida: cómo queda un smartphone frente a la franquicia de USD 400.",
    eyebrow="Ejemplo con números",
    h1="Cuánto cuesta traer un celular a Argentina",
    sub="Un smartphone puede quedar justo en el borde de la franquicia. Veamos un caso de gama media y probalo con el modelo que querés traer.",
    crumb="Traer un celular",
    body=f'''<p class="lead">Los celulares son un caso interesante: los de gama media rondan la franquicia de USD 400, así que un modelo puede quedar dentro y otro, apenas más caro, generar excedente.</p>

        <h2>El caso de ejemplo</h2>
        <p>Un smartphone de <strong>USD 520</strong> (FOB), con <strong>USD 45</strong> de envío, 1 unidad, ~1 kg, cotización de referencia <strong>$1.200</strong>.</p>
        <table class="example-table">
          <thead><tr><th>Dato</th><th>Valor</th></tr></thead>
          <tbody>
            <tr><td>Valor FOB (producto)</td><td>USD 520</td></tr>
            <tr><td>Flete (envío)</td><td>USD 45</td></tr>
            <tr><td>Valor CIF</td><td>USD 565</td></tr>
            <tr><td>Excedente (520 − 400)</td><td>USD 120</td></tr>
          </tbody>
        </table>
        <p>Con FOB 520, el celular queda <strong>fuera de la franquicia</strong> por USD 120. Si en cambio mirás un modelo de USD 380, estaría <strong>dentro</strong> de la franquicia (recordá: el envío no cuenta para ese límite).</p>
        {DISCLAIMER_NOTE}
        <h2>Probalo (ejemplo cargado)</h2>
        {calc_block(prefill="celular", empty_intro="Ejemplo cargado: celular de USD 520 + USD 45 de envío. Editá con tu modelo.")}
        <h2>El detalle de la gama media</h2>
        <p>Cambiá el FOB entre USD 380 y USD 520 y observá cómo el resultado pasa de "dentro de la franquicia" a "excedente". Es la mejor forma de ver por qué la franquicia se mide sobre el producto y no sobre el total.</p>''',
    faq=[
        ("¿Un celular de USD 399 con envío caro paga excedente?",
         "No. El FOB (399) está por debajo de 400, así que está dentro de la franquicia aunque el envío sea alto. El envío no cuenta para el límite."),
        ("¿Puedo traer dos celulares iguales?",
         "Sí, hasta 3 unidades de la misma especie. Pero recordá que el FOB se suma: dos celulares de USD 300 dan un FOB de 600, con excedente."),
        ("¿El resultado incluye el impuesto del excedente?",
         "No automáticamente: las alícuotas dependen del producto. Si conocés la que te aplican, cargala en opciones avanzadas."),
    ],
))

PAGES.append(dict(
    slug="cuanto-cuesta-traer-una-ps5",
    title="Cuánto cuesta traer una PS5 a Argentina (ejemplo) | ImportáAR",
    desc="Ejemplo numérico de cuánto sale importar una PlayStation 5 a Argentina por courier, con la calculadora embebida: FOB, flete por ser voluminosa y excedente.",
    eyebrow="Ejemplo con números",
    h1="Cuánto cuesta traer una PS5 a Argentina",
    sub="Una consola es grande y pesada: el flete pesa más que en otros productos. Veamos cómo se reparte el costo y probalo con tu caso.",
    crumb="Traer una PS5",
    body=f'''<p class="lead">La PlayStation 5 combina dos cosas que la hacen un buen ejemplo: un <strong>FOB por encima de la franquicia</strong> y un <strong>flete alto</strong> por su tamaño y peso. Ideal para ver cómo se separan producto y envío.</p>

        <h2>El caso de ejemplo</h2>
        <p>Una PS5 de <strong>USD 500</strong> (FOB), con <strong>USD 120</strong> de envío (es voluminosa), 1 unidad, ~5 kg, cotización de referencia <strong>$1.200</strong>.</p>
        <table class="example-table">
          <thead><tr><th>Dato</th><th>Valor</th></tr></thead>
          <tbody>
            <tr><td>Valor FOB (consola)</td><td>USD 500</td></tr>
            <tr><td>Flete (envío voluminoso)</td><td>USD 120</td></tr>
            <tr><td>Valor CIF</td><td>USD 620</td></tr>
            <tr><td>Excedente (500 − 400)</td><td>USD 100</td></tr>
          </tbody>
        </table>
        <p>El FOB (500) supera la franquicia: hay un excedente de <strong>USD 100</strong>. El flete de USD 120 sube el CIF y el costo total, pero <strong>no</strong> cambia el excedente, porque la franquicia mira sólo el FOB.</p>
        {DISCLAIMER_NOTE}
        <h2>Probalo (ejemplo cargado)</h2>
        {calc_block(prefill="ps5", empty_intro="Ejemplo cargado: PS5 de USD 500 + USD 120 de envío. Ajustá a tu compra.")}
        <h2>El peso importa (pero no tanto como pensás)</h2>
        <p>Con ~5 kg, la PS5 está muy lejos del tope de <span data-const="TOPE_PESO_KG">50</span> kg, así que el peso no es un problema de elegibilidad. Lo que sí conviene mirar es el flete: en productos voluminosos puede ser una parte importante del costo total.</p>''',
    faq=[
        ("¿El envío caro de la PS5 aumenta el excedente?",
         "No. El excedente es FOB − 400, y el flete no forma parte del FOB. El envío sube el costo total y el CIF, pero no el excedente ni la base de la franquicia."),
        ("¿Puedo traer una PS5 por este régimen?",
         "Sí, si el FOB no supera los USD 3.000 y respetás los demás límites. Una consola entra cómoda en esos topes."),
        ("¿Cuánto pago finalmente de impuestos por el excedente?",
         "Depende de la alícuota que aplique tu courier/aduana, que no calculamos automáticamente. Cargala en opciones avanzadas si la conocés, o consultá con tu courier."),
    ],
))


def main():
    print("Generando páginas de contenido…")
    for p in PAGES:
        page(p["slug"], p["title"], p["desc"], p["eyebrow"], p["h1"], p["sub"],
             p["body"], p["faq"], p["crumb"])
    print("Listo:", len(PAGES), "páginas.")


if __name__ == "__main__":
    main()
