/* ============================================================================
   MOTOR DE CÁLCULO — Régimen de Pequeños Envíos / Courier (Argentina)
   ----------------------------------------------------------------------------
   Módulo PURO, aislado de la UI y testeable de forma independiente (Node o
   navegador). No toca el DOM. No hace llamadas de red. No inventa alícuotas.

   REGLA MÁS IMPORTANTE DE TODO EL PROYECTO:
   La franquicia de USD 400 se compara SÓLO contra el valor FOB, nunca contra
   el CIF. No romper ni simplificar esta regla.

   REGLA CRÍTICA — PROHIBIDO INVENTAR TASAS:
   Este archivo NO contiene ni debe contener ninguna alícuota de derecho de
   importación, tasa estadística, IVA ni impuestos internos. Cuando un tributo
   "corresponde" pero su alícuota no está verificada oficialmente, se devuelve
   SÓLO texto explicativo, nunca un número.
   ============================================================================ */

(function (root, factory) {
  "use strict";
  var api = factory();
  // Node (tests) y navegador (clásico, sin type=module).
  if (typeof module === "object" && module.exports) module.exports = api;
  if (typeof window !== "undefined") window.__CALC__ = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  /* ------------------------------------------------------------------
     1. CONSTANTES VERIFICADAS OFICIALMENTE
     Usar EXACTAMENTE estos valores. No redondear, no modificar, no ampliar.
     ------------------------------------------------------------------ */
  var CONSTANTES = Object.freeze({
    FRANQUICIA_FOB_USD: 400,   // franquicia: USD 400 sobre FOB
    TOPE_FOB_USD: 3000,        // tope FOB máximo por envío bajo este régimen
    TOPE_UNIDADES: 3,          // tope de unidades de la misma especie
    TOPE_PESO_KG: 50,          // tope de peso por paquete
    MAX_ENVIOS_ANIO: 5         // máximo de envíos por año por persona (sólo informativo)
  });

  /* ------------------------------------------------------------------
     2. UMBRALES DE CONVENIENCIA (semáforo)
     Centralizados en UN solo lugar, fáciles de modificar. No dispersar.
     ------------------------------------------------------------------ */
  var CONVENIENCIA = Object.freeze({
    // Margen relativo (fracción del precio local) dentro del cual la compra se
    // considera "similar". Fuera de ese margen: conviene / no conviene.
    MARGEN_SIMILAR: 0.10 // ±10 %
  });

  /* ------------------------------------------------------------------
     Helpers de números
     ------------------------------------------------------------------ */
  function esNumFinito(x) {
    return typeof x === "number" && isFinite(x);
  }

  // Convierte a número aceptando null/undefined/"" -> valor por defecto.
  // Acepta coma o punto decimal (formato AR). Devuelve NaN si no es parseable.
  function aNumero(v, porDefecto) {
    if (v === null || v === undefined || v === "") return porDefecto;
    if (typeof v === "number") return v;
    var s = String(v).trim().replace(/\s+/g, "");
    if (s === "") return porDefecto;
    // Si tiene coma decimal y no punto, tratamos la coma como separador decimal.
    if (s.indexOf(",") !== -1 && s.indexOf(".") === -1) s = s.replace(",", ".");
    else s = s.replace(/,/g, ""); // miles con coma
    var n = Number(s);
    return isNaN(n) ? NaN : n;
  }

  /* ------------------------------------------------------------------
     3. EVALUAR CONVENIENCIA — pura, testeable, umbrales centralizados
     costoImportar y precioLocal deben estar en la MISMA moneda (ARS).
     ------------------------------------------------------------------ */
  function evaluarConveniencia(costoImportar, precioLocal) {
    if (!esNumFinito(costoImportar) || !esNumFinito(precioLocal) || precioLocal <= 0) {
      return null;
    }
    // ahorro > 0  => importar sale más barato que comprar local.
    var ahorroRel = (precioLocal - costoImportar) / precioLocal;
    var m = CONVENIENCIA.MARGEN_SIMILAR;
    var nivel;
    if (ahorroRel >= m) nivel = "conviene";
    else if (ahorroRel <= -m) nivel = "no-conviene";
    else nivel = "similar";
    return {
      nivel: nivel,                    // "conviene" | "similar" | "no-conviene"
      ahorroRel: ahorroRel,            // fracción (positiva = ahorrás importando)
      ahorroAbs: precioLocal - costoImportar, // ARS (positivo = ahorrás)
      costoImportar: costoImportar,
      precioLocal: precioLocal
    };
  }

  /* ------------------------------------------------------------------
     4. TEXTOS FIJOS de tributos "no calculados"
     Centralizados para que ningún otro archivo los reescriba con un número.
     ------------------------------------------------------------------ */
  var TEXTOS = Object.freeze({
    dentro: {
      derechoImportacion: "$0 — exento",
      tasaEstadistica: "$0 — exenta",
      ivaImpuestosInternos:
        "puede corresponder según el tipo de producto — no calculado automáticamente en esta versión"
    },
    excede: {
      derechoImportacion:
        "corresponde sobre el excedente — no calculado automáticamente (alícuota no verificada oficialmente)",
      tasaEstadistica:
        "corresponde sobre el excedente — no calculado automáticamente (alícuota no verificada oficialmente)",
      ivaImpuestosInternos:
        "corresponde — no calculado automáticamente en esta versión"
    },
    etiquetaManual:
      "Tasa ingresada manualmente por el usuario — no verificada por la herramienta"
  });

  /* ------------------------------------------------------------------
     5. CÁLCULO PRINCIPAL
     input = {
       fob, flete, seguro, unidades, peso,          // obligatorios (seguro opc.)
       gastosCourier, tributosManualPct,            // opcionales
       cotizacion, precioLocalArs                   // opcionales
     }
     Devuelve un objeto estructurado (nunca lanza por datos del usuario).
     ------------------------------------------------------------------ */
  function calcular(input) {
    input = input || {};

    var errores = [];       // bloqueantes: no se debe mostrar resultado
    var advertencias = [];  // no bloqueantes: se muestran como avisos

    // --- Parseo de entradas ---
    var fob = aNumero(input.fob, NaN);
    var flete = aNumero(input.flete, NaN);
    var seguro = aNumero(input.seguro, 0);
    var unidades = aNumero(input.unidades, NaN);
    var peso = aNumero(input.peso, NaN);
    var gastosCourier = aNumero(input.gastosCourier, 0);
    var cotizacion = aNumero(input.cotizacion, NaN);
    var precioLocalArs = aNumero(input.precioLocalArs, NaN);

    // tributosManualPct: vacío por defecto (null significa "no ingresado").
    var tienePctManual =
      input.tributosManualPct !== null &&
      input.tributosManualPct !== undefined &&
      String(input.tributosManualPct).trim() !== "";
    var tributosManualPct = tienePctManual ? aNumero(input.tributosManualPct, NaN) : null;

    // --- Validaciones de obligatorios / rangos ---
    if (!esNumFinito(fob) || fob < 0) errores.push("Ingresá un valor FOB válido (USD, sin envío).");
    if (!esNumFinito(flete) || flete < 0) errores.push("Ingresá un costo de envío válido (USD).");
    if (seguro < 0 || isNaN(seguro)) errores.push("El seguro no puede ser negativo.");
    if (gastosCourier < 0 || isNaN(gastosCourier)) errores.push("Los gastos del courier no pueden ser negativos.");
    if (!esNumFinito(unidades) || unidades < 1 || Math.floor(unidades) !== unidades) {
      errores.push("Ingresá la cantidad de unidades (número entero, 1 o más).");
    }
    if (!esNumFinito(peso) || peso <= 0) errores.push("Ingresá un peso aproximado del paquete (kg).");

    // % de tributos manual fuera de rango: bloquea el cálculo hasta corregir.
    if (tienePctManual) {
      if (!esNumFinito(tributosManualPct) || tributosManualPct < 0 || tributosManualPct > 100) {
        errores.push("El % de tributos manual debe estar entre 0 y 100.");
      }
    }

    // La cotización, si viene, debe ser positiva para poder mostrar ARS.
    var cotizacionValida = esNumFinito(cotizacion) && cotizacion > 0;

    if (errores.length) {
      return {
        ok: false,
        errores: errores,
        advertencias: advertencias,
        constantes: CONSTANTES
      };
    }

    // --- Conceptos base (NO mezclar FOB con flete) ---
    var valorCIF = fob + flete + seguro; // suma total de la operación (no es la base de la franquicia)

    // --- Elegibilidad del régimen (avisos; sólo FOB>3000 saca de alcance) ---
    var fueraDeAlcance = false;
    if (fob > CONSTANTES.TOPE_FOB_USD) {
      fueraDeAlcance = true;
      advertencias.push({
        tipo: "fuera-de-alcance",
        texto:
          "Esta compra supera el tope de USD " +
          CONSTANTES.TOPE_FOB_USD.toLocaleString("es-AR") +
          " FOB del régimen de Pequeños Envíos/Courier. Esta calculadora no aplica a este caso; no se calcula un resultado."
      });
    }
    if (unidades > CONSTANTES.TOPE_UNIDADES) {
      advertencias.push({
        tipo: "unidades",
        texto:
          "Declarás " + unidades + " unidades del mismo producto. Con más de " +
          CONSTANTES.TOPE_UNIDADES +
          " unidades de la misma especie, el envío puede no calificar como envío sin fin comercial."
      });
    }
    if (peso > CONSTANTES.TOPE_PESO_KG) {
      advertencias.push({
        tipo: "peso",
        texto:
          "El paquete pesa " + peso + " kg y supera el tope de " +
          CONSTANTES.TOPE_PESO_KG + " kg de este régimen."
      });
    }

    // Si está fuera de alcance, NO forzar un cálculo.
    if (fueraDeAlcance) {
      return {
        ok: true,
        fueraDeAlcance: true,
        advertencias: advertencias,
        valores: { fob: fob, flete: flete, seguro: seguro, cif: valorCIF },
        constantes: CONSTANTES,
        textos: TEXTOS
      };
    }

    // --- Chequeo de franquicia — SÓLO contra FOB (regla de oro) ---
    var dentroDeFranquicia = fob <= CONSTANTES.FRANQUICIA_FOB_USD; // 400 inclusive
    var excedente = dentroDeFranquicia ? 0 : (fob - CONSTANTES.FRANQUICIA_FOB_USD);
    var t = dentroDeFranquicia ? TEXTOS.dentro : TEXTOS.excede;

    // --- Tributos manuales (opcional, sólo si hay excedente) ---
    var montoTributosManual = null;
    if (tributosManualPct !== null && excedente > 0) {
      montoTributosManual = excedente * (tributosManualPct / 100);
    }

    // --- Costo total estimado ---
    var costoEstimadoUsd = valorCIF + gastosCourier + (montoTributosManual || 0);
    var costoEstimadoArs = cotizacionValida ? costoEstimadoUsd * cotizacion : null;

    // --- Conveniencia (sólo si hay precio local y resultado en ARS) ---
    var conveniencia = null;
    if (esNumFinito(precioLocalArs) && precioLocalArs > 0 && costoEstimadoArs !== null) {
      conveniencia = evaluarConveniencia(costoEstimadoArs, precioLocalArs);
    }

    // --- Desglose transparente, línea por línea ---
    var desglose = [
      { concepto: "Valor FOB (mercadería)", tipo: "monto", usd: fob },
      { concepto: "Flete (envío)", tipo: "monto", usd: flete },
      { concepto: "Seguro", tipo: "monto", usd: seguro },
      { concepto: "Valor CIF (FOB + flete + seguro)", tipo: "subtotal", usd: valorCIF },
      { concepto: "Derecho de importación", tipo: "texto", texto: t.derechoImportacion },
      { concepto: "Tasa estadística", tipo: "texto", texto: t.tasaEstadistica },
      { concepto: "IVA / impuestos internos", tipo: "texto", texto: t.ivaImpuestosInternos },
      { concepto: "Gastos del courier", tipo: "monto", usd: gastosCourier }
    ];
    if (montoTributosManual !== null) {
      desglose.push({
        concepto: "Tributos sobre el excedente (ingresado por vos)",
        tipo: "monto",
        usd: montoTributosManual,
        etiqueta: TEXTOS.etiquetaManual
      });
    }

    return {
      ok: true,
      fueraDeAlcance: false,
      advertencias: advertencias,
      franquicia: {
        dentro: dentroDeFranquicia,
        limite: CONSTANTES.FRANQUICIA_FOB_USD,
        excedente: excedente
      },
      valores: {
        fob: fob,
        flete: flete,
        seguro: seguro,
        cif: valorCIF,
        gastosCourier: gastosCourier,
        excedente: excedente,
        montoTributosManual: montoTributosManual,
        tributosManualPct: tributosManualPct,
        costoEstimadoUsd: costoEstimadoUsd,
        costoEstimadoArs: costoEstimadoArs,
        cotizacion: cotizacionValida ? cotizacion : null
      },
      desglose: desglose,
      conveniencia: conveniencia,
      constantes: CONSTANTES,
      textos: TEXTOS
    };
  }

  /* ------------------------------------------------------------------
     API pública del módulo
     ------------------------------------------------------------------ */
  return {
    CONSTANTES: CONSTANTES,
    CONVENIENCIA: CONVENIENCIA,
    TEXTOS: TEXTOS,
    aNumero: aNumero,
    evaluarConveniencia: evaluarConveniencia,
    calcular: calcular
  };
});
