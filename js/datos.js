/* ============================================================================
   DATOS / MANIFEST — window.__DATOS__
   Contenido de marca y textos reutilizables. Sin lógica de cálculo.
   ============================================================================ */
(function () {
  "use strict";

  window.__DATOS__ = {
    marca: "ImportáAR",
    tagline: "Cuánto te termina saliendo traerlo a Argentina",
    dominio: "importar.ar",

    // Fecha de última actualización de las REGLAS mostradas (visible siempre).
    fechaReglas: "2 de septiembre de 2026",

    // Disclaimer EXACTO (no modificar el texto).
    disclaimer:
      "Esta es una estimación informativa basada en el régimen de Pequeños " +
      "Envíos/Courier vigente a la fecha indicada abajo. No incluye el monto " +
      "exacto de derecho de importación, tasa estadística, IVA ni impuestos " +
      "internos cuando corresponden, ya que estos dependen de alícuotas y " +
      "categorías de producto que pueden variar. Para el monto final exacto, " +
      "consultá con tu courier o con ARCA.",

    // Placeholder de cotización (editable; NO se consulta ninguna API).
    placeholderCotizacion: "1200",

    // Ejemplos numéricos para las páginas de contenido (prefill del calculador).
    ejemplos: {
      notebook: { fob: 850, flete: 90, seguro: 0, unidades: 1, peso: 2, cotizacion: 1200 },
      celular: { fob: 520, flete: 45, seguro: 0, unidades: 1, peso: 1, cotizacion: 1200 },
      ps5: { fob: 500, flete: 120, seguro: 0, unidades: 1, peso: 5, cotizacion: 1200 }
    }
  };
})();
