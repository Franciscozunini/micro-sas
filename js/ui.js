/* ============================================================================
   UI DEL CALCULADOR — separada del motor de cálculo (js/calculo.js)
   ----------------------------------------------------------------------------
   Renderiza el formulario dentro de cada [data-calc], lo cablea y muestra el
   resultado en el orden que exige la especificación. No contiene lógica de
   cálculo ni alícuotas: todo eso vive en window.__CALC__.
   ============================================================================ */
(function () {
  "use strict";

  var CALC = window.__CALC__;
  var DATOS = window.__DATOS__ || {};

  // -------- helpers --------
  function $(sel, scope) { return (scope || document).querySelector(sel); }
  function $$(sel, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(sel)); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function safe(fn, name) { try { fn(); } catch (e) { console.warn("[" + name + "]", e); } }

  var fmtUsd = new Intl.NumberFormat("es-AR", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
  var fmtArs = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
  var fmtPct = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 });

  var uid = 0;

  // -------- iconos inline (sin dependencias) --------
  var ICON = {
    check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>',
    warn: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 2 20h20L12 3z"/><path d="M12 10v4"/><path d="M12 17h.01"/></svg>',
    stop: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M15 9l-6 6M9 9l6 6"/></svg>'
  };

  // -------- construcción de un campo --------
  function campo(cfg) {
    var id = cfg.id;
    var req = cfg.req ? ' <span class="req" aria-hidden="true">*</span>' : "";
    var prefijo = cfg.prefijo ? '<span class="prefijo">' + esc(cfg.prefijo) + "</span>" : "";
    var sufijo = cfg.sufijo ? '<span class="sufijo">' + esc(cfg.sufijo) + "</span>" : "";
    return (
      '<div class="campo" data-campo="' + cfg.name + '">' +
      '<label for="' + id + '">' + esc(cfg.label) + req + "</label>" +
      '<div class="input-wrap">' + prefijo +
      '<input id="' + id + '" name="' + cfg.name + '" type="number" ' +
      'inputmode="decimal" ' +
      (cfg.min != null ? 'min="' + cfg.min + '" ' : "") +
      (cfg.max != null ? 'max="' + cfg.max + '" ' : "") +
      (cfg.step != null ? 'step="' + cfg.step + '" ' : "") +
      (cfg.placeholder != null ? 'placeholder="' + esc(cfg.placeholder) + '" ' : "") +
      'aria-describedby="' + id + '-help ' + id + '-err">' +
      sufijo +
      "</div>" +
      (cfg.ayuda ? '<p class="ayuda" id="' + id + '-help">' + cfg.ayuda + "</p>" : '<span id="' + id + '-help" hidden></span>') +
      '<p class="error-campo" id="' + id + '-err" role="alert" hidden></p>' +
      "</div>"
    );
  }

  // -------- render del formulario dentro de un mount --------
  function render(mount) {
    var p = "c" + (++uid) + "-";
    var placeholderCot = esc(DATOS.placeholderCotizacion || "");

    var obligatorios =
      campo({ id: p + "fob", name: "fob", label: "Valor FOB del producto (USD)", req: true, min: 0, step: "0.01", prefijo: "US$",
        ayuda: "Precio de la mercadería <strong>sin incluir el envío</strong>. Es el dato clave: la franquicia se mide sobre este valor." }) +
      campo({ id: p + "flete", name: "flete", label: "Costo de envío / flete (USD)", req: true, min: 0, step: "0.01", prefijo: "US$",
        ayuda: "Lo que pagás por el envío. Va aparte del FOB." }) +
      campo({ id: p + "cotizacion", name: "cotizacion", label: "Cotización del dólar (ARS por USD)", min: 0, step: "0.01", prefijo: "$", placeholder: placeholderCot,
        ayuda: "Editá con la cotización que usás. No se consulta ninguna cotización online: el valor lo ponés vos. Si lo dejás vacío, mostramos el resultado sólo en dólares." }) +
      campo({ id: p + "unidades", name: "unidades", label: "Unidades del mismo producto", req: true, min: 1, step: "1", placeholder: "1",
        ayuda: "Cantidad de unidades iguales en el envío." }) +
      campo({ id: p + "peso", name: "peso", label: "Peso aproximado del paquete (kg)", req: true, min: 0, step: "0.1", sufijo: "kg",
        ayuda: "Peso estimado del paquete completo." });

    var avanzados =
      campo({ id: p + "seguro", name: "seguro", label: "Seguro (USD)", min: 0, step: "0.01", prefijo: "US$", placeholder: "0",
        ayuda: "Opcional. Por defecto 0. Suma al valor CIF." }) +
      campo({ id: p + "gastosCourier", name: "gastosCourier", label: "Gastos / cargos del courier (USD)", min: 0, step: "0.01", prefijo: "US$", placeholder: "0",
        ayuda: "Opcional. Cargos de gestión del courier, si los conocés." }) +
      campo({ id: p + "tributosManualPct", name: "tributosManualPct", label: "% de tributos sobre el excedente (si lo conocés)", min: 0, max: 100, step: "0.01", sufijo: "%",
        ayuda: "Opcional. Sólo si sabés la alícuota que te van a cobrar sobre el excedente de USD 400. Se muestra etiquetado como dato tuyo, no verificado por la herramienta." }) +
      campo({ id: p + "precioLocalArs", name: "precioLocalArs", label: "Precio del mismo producto en Argentina (ARS)", min: 0, step: "1", prefijo: "$",
        ayuda: "Opcional. Si lo cargás, te decimos si te conviene traerlo o comprarlo acá." });

    mount.innerHTML =
      '<form class="calc-form" novalidate>' +
      '<div class="calc-grid">' + obligatorios + "</div>" +
      '<details class="calc-avanzado">' +
      '<summary><span>Opciones avanzadas</span><small>seguro, gastos del courier, tributos y comparación local</small></summary>' +
      '<div class="calc-grid">' + avanzados + "</div>" +
      "</details>" +
      '<div class="calc-acciones">' +
      '<button type="submit" class="btn btn-primario">Calcular costo estimado</button>' +
      '<button type="button" class="btn btn-secundario" data-reset>Limpiar</button>' +
      "</div>" +
      "</form>" +
      '<div class="calc-resultado" data-resultado hidden aria-live="polite"></div>';

    var form = $("form", mount);
    var out = $("[data-resultado]", mount);
    var yaCalculado = false;

    function leer() {
      var d = {};
      $$("input", form).forEach(function (i) { d[i.name] = i.value; });
      return d;
    }

    function limpiarErrores() {
      $$(".campo", form).forEach(function (c) { c.classList.remove("con-error"); });
      $$(".error-campo", form).forEach(function (e) { e.hidden = true; e.textContent = ""; });
    }

    // Mapea errores del motor a los campos (heurística por palabra clave).
    function pintarErrores(errores) {
      limpiarErrores();
      var mapa = [
        { re: /FOB/i, name: "fob" },
        { re: /env[ií]o/i, name: "flete" },
        { re: /seguro/i, name: "seguro" },
        { re: /courier/i, name: "gastosCourier" },
        { re: /unidades/i, name: "unidades" },
        { re: /peso/i, name: "peso" },
        { re: /tributos manual/i, name: "tributosManualPct" }
      ];
      errores.forEach(function (msg) {
        var hit = mapa.filter(function (m) { return m.re.test(msg); })[0];
        var name = hit ? hit.name : "fob";
        var campoEl = $('.campo[data-campo="' + name + '"]', form);
        if (!campoEl) return;
        campoEl.classList.add("con-error");
        var errEl = $(".error-campo", campoEl);
        errEl.textContent = msg;
        errEl.hidden = false;
      });
    }

    function calcular() {
      var r = CALC.calcular(leer());
      if (!r.ok) {
        pintarErrores(r.errores);
        out.hidden = false;
        out.innerHTML =
          '<div class="res-bloqueo" role="alert"><strong>Revisá los datos para poder calcular:</strong><ul>' +
          r.errores.map(function (e) { return "<li>" + esc(e) + "</li>"; }).join("") +
          "</ul></div>";
        return;
      }
      limpiarErrores();
      out.hidden = false;
      out.innerHTML = vistaResultado(r);
      yaCalculado = true;
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      calcular();
      // Llevar el resultado a la vista en mobile.
      if (out.scrollIntoView) out.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });

    // Recalcular en vivo una vez que ya hubo un primer cálculo.
    form.addEventListener("input", function () {
      if (yaCalculado) calcular();
    });

    $("[data-reset]", form).addEventListener("click", function () {
      form.reset();
      limpiarErrores();
      out.hidden = true;
      out.innerHTML = "";
      yaCalculado = false;
    });

    // -------- prefill (páginas de ejemplo) --------
    var pre = mount.getAttribute("data-prefill");
    if (pre) {
      var data = null;
      try { data = DATOS.ejemplos ? DATOS.ejemplos[pre] : null; } catch (_) {}
      if (!data) { try { data = JSON.parse(pre); } catch (_) {} }
      if (data) {
        Object.keys(data).forEach(function (k) {
          var inp = $('input[name="' + k + '"]', form);
          if (inp) inp.value = data[k];
        });
        if (mount.getAttribute("data-autocalc") !== "no") calcular();
      }
    }
  }

  // -------- vista de resultado (orden exacto de la spec) --------
  function vistaResultado(r) {
    // Caso fuera de alcance: prominente, sin forzar cálculo.
    if (r.fueraDeAlcance) {
      var avFuera = r.advertencias.filter(function (a) { return a.tipo === "fuera-de-alcance"; })[0];
      return (
        '<div class="res-estado fuera">' + ICON.stop +
        "<div><h3>Fuera del alcance de este régimen</h3><p>" +
        esc(avFuera ? avFuera.texto : "") + "</p></div></div>" +
        disclaimerHTML()
      );
    }

    var html = "";

    // 1. Estado de elegibilidad del régimen.
    var otras = r.advertencias.filter(function (a) { return a.tipo !== "fuera-de-alcance"; });
    if (otras.length) {
      html +=
        '<div class="res-estado revisar">' + ICON.warn +
        "<div><h3>Revisá los límites del régimen</h3><ul>" +
        otras.map(function (a) { return "<li>" + esc(a.texto) + "</li>"; }).join("") +
        "</ul></div></div>";
    } else {
      html +=
        '<div class="res-estado ok">' + ICON.check +
        "<div><h3>Dentro de los límites del régimen</h3>" +
        "<p>Unidades, peso y valor entran en el régimen de Pequeños Envíos/Courier.</p></div></div>";
    }

    // 2. Estado de franquicia.
    if (r.franquicia.dentro) {
      html +=
        '<div class="res-franquicia dentro">✅ Dentro de la franquicia de USD ' +
        r.franquicia.limite.toLocaleString("es-AR") + " FOB</div>";
    } else {
      html +=
        '<div class="res-franquicia excede">⚠️ Superás la franquicia por ' +
        fmtUsd.format(r.franquicia.excedente) + " (FOB por encima de USD " +
        r.franquicia.limite.toLocaleString("es-AR") + ")</div>";
    }

    // 3. Desglose transparente línea por línea.
    html += '<div class="res-desglose"><h3>Desglose</h3><table><tbody>';
    r.desglose.forEach(function (d) {
      var clase = d.tipo === "subtotal" ? ' class="fila-subtotal"' : "";
      var valor;
      if (d.tipo === "texto") {
        valor = '<span class="valor-texto">' + esc(d.texto) + "</span>";
      } else {
        valor = "<strong>" + fmtUsd.format(d.usd) + "</strong>";
      }
      var etiqueta = d.etiqueta ? '<span class="etiqueta-manual">' + esc(d.etiqueta) + "</span>" : "";
      html += "<tr" + clase + "><td>" + esc(d.concepto) + etiqueta + "</td><td>" + valor + "</td></tr>";
    });
    html += "</tbody></table></div>";

    // 4. Costo total estimado (USD y, si hay cotización, ARS).
    html += '<div class="res-total"><span class="rotulo">Costo estimado</span>' +
      '<span class="total-usd">' + fmtUsd.format(r.valores.costoEstimadoUsd) + "</span>";
    if (r.valores.costoEstimadoArs !== null) {
      html += '<span class="total-ars">≈ ' + fmtArs.format(r.valores.costoEstimadoArs) +
        ' <small>(dólar a ' + fmtArs.format(r.valores.cotizacion) + ")</small></span>";
    } else {
      html += '<span class="total-nota">Cargá la cotización del dólar para verlo en pesos.</span>';
    }
    html += "</div>";

    // 5. Comparación de conveniencia (semáforo), sólo si hay precio local.
    if (r.conveniencia) {
      var c = r.conveniencia;
      var cfg = {
        "conviene": { clase: "verde", emoji: "🟢", titulo: "Te conviene traerlo" },
        "similar": { clase: "amarillo", emoji: "🟡", titulo: "Es más o menos lo mismo" },
        "no-conviene": { clase: "rojo", emoji: "🔴", titulo: "No te conviene traerlo" }
      }[c.nivel];
      var detalle;
      if (c.nivel === "similar") {
        detalle = "La diferencia con el precio local es chica (menos del " +
          fmtPct.format(CALC.CONVENIENCIA.MARGEN_SIMILAR * 100) + "%).";
      } else if (c.ahorroAbs >= 0) {
        detalle = "Ahorrás aproximadamente " + fmtArs.format(c.ahorroAbs) +
          " frente a comprarlo en Argentina.";
      } else {
        detalle = "Comprarlo en Argentina saldría unos " + fmtArs.format(-c.ahorroAbs) +
          " menos.";
      }
      html +=
        '<div class="res-conveniencia ' + cfg.clase + '">' +
        '<span class="semaforo">' + cfg.emoji + "</span>" +
        "<div><h3>" + cfg.titulo + "</h3><p>" + esc(detalle) +
        '</p><p class="comp-detalle">Estimado importándolo: ' + fmtArs.format(c.costoImportar) +
        " · Precio local cargado: " + fmtArs.format(c.precioLocal) + "</p></div></div>";
    }

    // 6 + 7. Disclaimer + fecha (siempre visibles, debajo del resultado).
    html += disclaimerHTML();

    // Espacio de anuncio DESPUÉS del resultado (placeholder, sin código real).
    html += adSlot("resultado");

    return html;
  }

  function disclaimerHTML() {
    return (
      '<div class="res-disclaimer">' +
      "<p>" + esc(DATOS.disclaimer || "") + "</p>" +
      '<p class="res-fecha">Reglas actualizadas al <time>' + esc(DATOS.fechaReglas || "") + "</time>. " +
      "Recordá: este régimen permite hasta " + (CALC.CONSTANTES.MAX_ENVIOS_ANIO) +
      " envíos por persona por año — no lo validamos automáticamente porque la herramienta no guarda historial.</p>" +
      "</div>"
    );
  }

  function adSlot(pos) {
    return (
      '<div class="ad-slot" data-ad="' + esc(pos) + '" aria-hidden="true">' +
      "<span>Publicidad</span>" +
      "<!-- PEGA AQUÍ TU CÓDIGO DE ADSENSE -->" +
      "</div>"
    );
  }

  // -------- boot --------
  function boot() {
    if (!CALC) { console.warn("[ui] motor de cálculo no cargado"); return; }
    $$("[data-calc]").forEach(function (m) { safe(function () { render(m); }, "render-calc"); });
    // Rellenar rótulos de constantes en el contenido estático (si existen).
    $$("[data-const]").forEach(function (el) {
      var k = el.getAttribute("data-const");
      if (CALC.CONSTANTES[k] != null) el.textContent = CALC.CONSTANTES[k].toLocaleString("es-AR");
    });
    // Año del footer.
    $$("[data-anio]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
    document.documentElement.classList.add("is-ready");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
