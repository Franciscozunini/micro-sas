# ImportáAR — Calculadora de importación a Argentina

Web gratuita, **sin registro y sin login**, que estima cuánto sale traer un
producto del exterior a Argentina por el **régimen de Pequeños Envíos/Courier**.
No es una calculadora de impuestos más: calcula con precisión lo que se puede
calcular de forma confiable (franquicia, CIF, excedente) y es **explícita y
honesta** sobre qué tributos no calcula automáticamente, en vez de inventar un
número.

## Características

- **100% del lado del navegador.** Sin backend, sin base de datos, sin API keys,
  sin cuentas. Deployable como sitio estático (Hostinger u otro).
- **Regla de oro respetada:** la franquicia de USD 400 se compara **sólo contra
  el valor FOB**, nunca contra el CIF.
- **Prohibido inventar tasas:** ninguna alícuota de derecho de importación, tasa
  estadística, IVA o impuestos internos está hardcodeada. Cuando corresponde
  pero no está verificada, se muestra texto explicativo.
- **Comparación de conveniencia** (semáforo 🟢🟡🔴) con umbral centralizado.
- **SEO:** 9 páginas de contenido diferenciado + home + calculadora, con
  `sitemap.xml`, `robots.txt`, metadatos y JSON-LD por página.
- **Espacios de anuncios** preparados (placeholders, sin código real de AdSense).

## Estructura

```
index.html                                  Home (hero + calculadora + contenido)
calculadora-importacion-argentina/          Página principal de la herramienta
comprar-en-{amazon,aliexpress,temu,shein}…/ Guías por tienda
que-es-la-franquicia-de-400-dolares/        Concepto
impuestos-compras-exterior-argentina/       Concepto en profundidad
cuanto-cuesta-traer-{una-notebook,un-celular,una-ps5}/  Ejemplos con calculadora embebida
privacidad/  aviso-legal/                    Legales (esqueletos con TODO del dueño)
tests/                                       Runner de tests en el navegador (noindex)
styles.css                                   Estilos (único archivo)
js/
  calculo.js       Motor de cálculo PURO (window.__CALC__ / module.exports)
  calculo.test.js  Tests unitarios (Node y navegador)
  datos.js         Datos de marca (window.__DATOS__)
  ui.js            Render y cableado del calculador (separado del motor)
assets/og-default.svg  Imagen Open Graph
favicon.svg  robots.txt  sitemap.xml  .htaccess
tools/           Scripts de desarrollo (NO se suben al hosting)
```

## Motor de cálculo

Toda la lógica vive en `js/calculo.js`, **aislada de la UI** para poder testearla.
Expone `calcular(input)` y `evaluarConveniencia(...)`, más las constantes
verificadas (`FRANQUICIA_FOB_USD = 400`, `TOPE_FOB_USD = 3000`,
`TOPE_UNIDADES = 3`, `TOPE_PESO_KG = 50`, `MAX_ENVIOS_ANIO = 5`).

Para cambiar el umbral del semáforo de conveniencia, editá **un solo lugar**:
`CONVENIENCIA.MARGEN_SIMILAR` en `js/calculo.js`.

## Tests

```bash
node js/calculo.test.js      # en consola
```

O abrí `/tests/` en el navegador (requiere servir por http, ver abajo).

Cubren: dentro de franquicia, supera franquicia, fuera de alcance (FOB > 3000),
tributos manuales, y los casos límite (FOB == 400, >3 unidades, >50 kg,
cotización 0/vacía, % manual fuera de rango, regla FOB-no-CIF).

## Previsualizar en local

La calculadora funciona en `file://`, pero para replicar el hosting conviene
servir por http:

```bash
python3 -m http.server 8137
# abrí http://localhost:8137/
```

## Publicar en Hostinger

Subí **todo el contenido de esta carpeta al `public_html`** del hosting, con
`index.html` en la raíz. Podés **excluir** la carpeta `tools/` y este `README.md`
(son de desarrollo). El `.htaccess` ya está incluido.

## Para el dueño del sitio (pendientes antes de monetizar)

1. Reemplazar el dominio `importar.ar` por el real en `canonical`, `og:url`,
   `sitemap.xml` y `robots.txt` si cambia.
2. Completar datos de contacto/titular en `privacidad/` y `aviso-legal/`.
3. Pegar el código de AdSense en los `<div class="ad-slot">`
   (marcados con `<!-- PEGA AQUÍ TU CÓDIGO DE ADSENSE -->`) y agregar tu CMP de
   cookies en el `<head>` (marcado con TODO).
4. Revisar la fecha de "reglas actualizadas" (`fechaReglas` en `js/datos.js`).

## Preparado para el futuro (no construido aún)

- Selección de courier con tarifas propias.
- Reglas por categoría de producto (NCM), una vez verificadas oficialmente.
- Enlaces de afiliados reales.
- Conversión de cotización vía API (opcional, sin reemplazar el input manual).
