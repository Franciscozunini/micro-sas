/* ============================================================================
   TESTS UNITARIOS del motor de cálculo (js/calculo.js)
   ----------------------------------------------------------------------------
   Sin dependencias. Corre en Node:   node js/calculo.test.js
   O en el navegador: /tests/  (index.html carga este archivo).

   Cubre, como mínimo:
   - Caso dentro de franquicia (FOB <= 400).
   - Caso que supera la franquicia (FOB > 400) con excedente correcto.
   - Caso fuera de alcance (FOB > 3000): no fuerza cálculo.
   - Caso con % de tributos manuales ingresados.
   - Casos límite: FOB == 400, >3 unidades, >50 kg, cotización 0/vacía,
     precio local ausente, % manual fuera de rango.
   - Regla de oro: la franquicia se compara SÓLO contra FOB, no contra CIF.
   ============================================================================ */

(function () {
  "use strict";

  var CALC =
    (typeof module === "object" && module.exports)
      ? require("./calculo.js")
      : window.__CALC__;

  // -------- mini framework --------
  var resultados = [];
  function test(nombre, fn) {
    try {
      fn();
      resultados.push({ nombre: nombre, ok: true });
    } catch (e) {
      resultados.push({ nombre: nombre, ok: false, error: e.message });
    }
  }
  function assert(cond, msg) {
    if (!cond) throw new Error(msg || "assert falló");
  }
  function eq(a, b, msg) {
    if (a !== b) throw new Error((msg || "esperado igual") + " → " + a + " !== " + b);
  }
  function cerca(a, b, msg, eps) {
    eps = eps || 1e-9;
    if (Math.abs(a - b) > eps) throw new Error((msg || "esperado ≈") + " → " + a + " ≉ " + b);
  }

  var base = { fob: 100, flete: 20, unidades: 1, peso: 1 };

  // ---------------------------------------------------------------------------
  // 1. Dentro de franquicia (FOB <= 400): exento, sin inventar montos.
  // ---------------------------------------------------------------------------
  test("Dentro de franquicia: FOB 300 -> exento y CIF correcto", function () {
    var r = CALC.calcular({ fob: 300, flete: 50, seguro: 10, unidades: 1, peso: 2 });
    assert(r.ok, "debe ser ok");
    assert(!r.fueraDeAlcance, "no fuera de alcance");
    assert(r.franquicia.dentro === true, "dentro de franquicia");
    eq(r.franquicia.excedente, 0, "excedente 0");
    // CIF = 300 + 50 + 10 = 360 (comprobado a mano)
    cerca(r.valores.cif, 360, "CIF");
    // costo estimado USD = CIF + gastosCourier(0) + manual(0) = 360
    cerca(r.valores.costoEstimadoUsd, 360, "costo USD");
    // Nunca inventa IVA: el desglose trae SÓLO texto para IVA.
    var iva = r.desglose.filter(function (d) { return d.concepto.indexOf("IVA") === 0; })[0];
    assert(iva && iva.tipo === "texto", "IVA debe ser texto explicativo");
    assert(/no calculado autom/i.test(iva.texto), "IVA no calculado automáticamente");
  });

  // ---------------------------------------------------------------------------
  // 2. Caso límite: FOB exactamente 400 -> dentro de franquicia (inclusive).
  // ---------------------------------------------------------------------------
  test("Límite: FOB == 400 cuenta como dentro de franquicia", function () {
    var r = CALC.calcular({ fob: 400, flete: 30, unidades: 1, peso: 1 });
    assert(r.franquicia.dentro === true, "400 es inclusive");
    eq(r.franquicia.excedente, 0, "excedente 0 en 400");
  });

  // ---------------------------------------------------------------------------
  // 3. Supera la franquicia (FOB > 400): excedente = FOB - 400, sin alícuota.
  // ---------------------------------------------------------------------------
  test("Supera franquicia: FOB 600 -> excedente 200 y sin inventar alícuota", function () {
    var r = CALC.calcular({ fob: 600, flete: 40, unidades: 1, peso: 1 });
    assert(r.franquicia.dentro === false, "fuera de franquicia");
    cerca(r.franquicia.excedente, 200, "excedente 200"); // 600 - 400
    var di = r.desglose.filter(function (d) { return d.concepto.indexOf("Derecho") === 0; })[0];
    assert(di.tipo === "texto", "derecho de importación es texto, no monto");
    assert(/no verificada oficialmente/i.test(di.texto), "sin alícuota inventada");
  });

  // ---------------------------------------------------------------------------
  // 4. REGLA DE ORO: la franquicia se compara SÓLO contra FOB, no contra CIF.
  //    FOB 380 + flete 200 => CIF 580 (>400) pero DEBE estar dentro de franquicia.
  // ---------------------------------------------------------------------------
  test("Regla de oro: FOB 380 con CIF 580 sigue dentro de franquicia (FOB<=400)", function () {
    var r = CALC.calcular({ fob: 380, flete: 200, unidades: 1, peso: 1 });
    cerca(r.valores.cif, 580, "CIF 580");
    assert(r.franquicia.dentro === true, "la franquicia mira FOB (380), no CIF (580)");
    eq(r.franquicia.excedente, 0, "sin excedente");
  });

  // ---------------------------------------------------------------------------
  // 5. Fuera de alcance (FOB > 3000): no fuerza cálculo de franquicia.
  // ---------------------------------------------------------------------------
  test("Fuera de alcance: FOB 3500 marca fueraDeAlcance y no calcula franquicia", function () {
    var r = CALC.calcular({ fob: 3500, flete: 100, unidades: 1, peso: 1 });
    assert(r.ok, "ok con aviso");
    assert(r.fueraDeAlcance === true, "fuera de alcance");
    assert(r.franquicia === undefined, "no calcula franquicia fuera de alcance");
    assert(r.desglose === undefined, "no fuerza desglose fuera de alcance");
    var av = r.advertencias.filter(function (a) { return a.tipo === "fuera-de-alcance"; })[0];
    assert(av, "advertencia de fuera de alcance presente");
  });

  // ---------------------------------------------------------------------------
  // 6. Tributos manuales ingresados: monto = excedente * pct/100, con etiqueta.
  //    FOB 900 -> excedente 500; pct 20 -> 100 USD.
  // ---------------------------------------------------------------------------
  test("Tributos manuales: excedente 500 y 20% -> 100 USD con etiqueta de usuario", function () {
    var r = CALC.calcular({ fob: 900, flete: 0, unidades: 1, peso: 1, tributosManualPct: 20 });
    cerca(r.franquicia.excedente, 500, "excedente 500");
    cerca(r.valores.montoTributosManual, 100, "manual 100"); // 500 * 0.20
    // costo USD = CIF(900) + gastos(0) + manual(100) = 1000
    cerca(r.valores.costoEstimadoUsd, 1000, "costo USD con manual");
    var linea = r.desglose.filter(function (d) { return d.etiqueta; })[0];
    assert(linea && /no verificada por la herramienta/i.test(linea.etiqueta), "etiqueta de usuario");
  });

  // ---------------------------------------------------------------------------
  // 7. Tributos manuales SIN excedente (dentro de franquicia): no aplica monto.
  // ---------------------------------------------------------------------------
  test("Tributos manuales ignorados si no hay excedente (FOB 300, 20%)", function () {
    var r = CALC.calcular({ fob: 300, flete: 0, unidades: 1, peso: 1, tributosManualPct: 20 });
    assert(r.valores.montoTributosManual === null, "sin excedente -> sin monto manual");
  });

  // ---------------------------------------------------------------------------
  // 8. % manual fuera de rango (negativo o > 100): bloquea el cálculo.
  // ---------------------------------------------------------------------------
  test("% manual > 100 bloquea el cálculo con error", function () {
    var r = CALC.calcular({ fob: 900, flete: 0, unidades: 1, peso: 1, tributosManualPct: 150 });
    assert(r.ok === false, "no ok");
    assert(r.errores.some(function (e) { return /entre 0 y 100/.test(e); }), "error de rango");
  });
  test("% manual negativo bloquea el cálculo con error", function () {
    var r = CALC.calcular({ fob: 900, flete: 0, unidades: 1, peso: 1, tributosManualPct: -5 });
    assert(r.ok === false, "no ok");
  });

  // ---------------------------------------------------------------------------
  // 9. Cotización: con cotización -> ARS; sin/0 -> ARS null.
  // ---------------------------------------------------------------------------
  test("Cotización válida produce costoEstimadoArs", function () {
    var r = CALC.calcular({ fob: 100, flete: 0, unidades: 1, peso: 1, cotizacion: 1000 });
    cerca(r.valores.costoEstimadoArs, 100000, "100 USD * 1000"); // 100 * 1000
  });
  test("Cotización 0 -> ARS null (sólo USD)", function () {
    var r = CALC.calcular({ fob: 100, flete: 0, unidades: 1, peso: 1, cotizacion: 0 });
    assert(r.valores.costoEstimadoArs === null, "sin ARS si cotización 0");
  });
  test("Cotización vacía -> ARS null (sólo USD)", function () {
    var r = CALC.calcular({ fob: 100, flete: 0, unidades: 1, peso: 1, cotizacion: "" });
    assert(r.valores.costoEstimadoArs === null, "sin ARS si cotización vacía");
  });

  // ---------------------------------------------------------------------------
  // 10. Advertencias no bloqueantes: >3 unidades y >50 kg NO impiden el cálculo.
  // ---------------------------------------------------------------------------
  test(">3 unidades: advierte pero calcula", function () {
    var r = CALC.calcular({ fob: 100, flete: 0, unidades: 5, peso: 1 });
    assert(r.ok && !r.fueraDeAlcance, "calcula igual");
    assert(r.advertencias.some(function (a) { return a.tipo === "unidades"; }), "advierte unidades");
  });
  test(">50 kg: advierte pero calcula", function () {
    var r = CALC.calcular({ fob: 100, flete: 0, unidades: 1, peso: 75 });
    assert(r.ok && !r.fueraDeAlcance, "calcula igual");
    assert(r.advertencias.some(function (a) { return a.tipo === "peso"; }), "advierte peso");
  });

  // ---------------------------------------------------------------------------
  // 11. Conveniencia: sin precio local -> null; con precio local -> semáforo.
  // ---------------------------------------------------------------------------
  test("Sin precio local -> conveniencia null", function () {
    var r = CALC.calcular({ fob: 100, flete: 0, unidades: 1, peso: 1, cotizacion: 1000 });
    assert(r.conveniencia === null, "sin semáforo");
  });
  test("Conveniencia: importar 100k vs local 200k -> conviene (verde)", function () {
    var r = CALC.calcular({ fob: 100, flete: 0, unidades: 1, peso: 1, cotizacion: 1000, precioLocalArs: 200000 });
    assert(r.conveniencia && r.conveniencia.nivel === "conviene", "verde");
  });
  test("Conveniencia: importar 100k vs local 105k -> similar (amarillo)", function () {
    var r = CALC.calcular({ fob: 100, flete: 0, unidades: 1, peso: 1, cotizacion: 1000, precioLocalArs: 105000 });
    assert(r.conveniencia && r.conveniencia.nivel === "similar", "amarillo");
  });
  test("Conveniencia: importar 100k vs local 80k -> no conviene (rojo)", function () {
    var r = CALC.calcular({ fob: 100, flete: 0, unidades: 1, peso: 1, cotizacion: 1000, precioLocalArs: 80000 });
    assert(r.conveniencia && r.conveniencia.nivel === "no-conviene", "rojo");
  });

  // ---------------------------------------------------------------------------
  // 12. Validaciones de obligatorios.
  // ---------------------------------------------------------------------------
  test("FOB faltante -> error bloqueante", function () {
    var r = CALC.calcular({ flete: 10, unidades: 1, peso: 1 });
    assert(r.ok === false && r.errores.length > 0, "error de FOB");
  });
  test("Unidades no entero -> error", function () {
    var r = CALC.calcular({ fob: 100, flete: 0, unidades: 1.5, peso: 1 });
    assert(r.ok === false, "unidades deben ser enteras");
  });

  // ---------------------------------------------------------------------------
  // 13. evaluarConveniencia como función pura, con umbral centralizado.
  // ---------------------------------------------------------------------------
  test("evaluarConveniencia respeta el umbral MARGEN_SIMILAR", function () {
    var m = CALC.CONVENIENCIA.MARGEN_SIMILAR;
    assert(m === 0.10, "umbral esperado 0.10 (editar en un solo lugar)");
    eq(CALC.evaluarConveniencia(85, 100).nivel, "conviene", "15% de ahorro conviene");
    eq(CALC.evaluarConveniencia(100, 100).nivel, "similar", "igual precio = similar");
    eq(CALC.evaluarConveniencia(120, 100).nivel, "no-conviene", "20% más caro no conviene");
  });

  // ---------------------------------------------------------------------------
  // 14. Constantes verificadas: no deben cambiar por accidente.
  // ---------------------------------------------------------------------------
  test("Constantes verificadas tienen los valores oficiales", function () {
    var C = CALC.CONSTANTES;
    eq(C.FRANQUICIA_FOB_USD, 400, "franquicia 400");
    eq(C.TOPE_FOB_USD, 3000, "tope 3000");
    eq(C.TOPE_UNIDADES, 3, "3 unidades");
    eq(C.TOPE_PESO_KG, 50, "50 kg");
    eq(C.MAX_ENVIOS_ANIO, 5, "5 envíos/año");
  });

  // -------- reporte --------
  var pasaron = resultados.filter(function (r) { return r.ok; }).length;
  var fallaron = resultados.length - pasaron;

  function linea(r) {
    return (r.ok ? "  ✅ " : "  ❌ ") + r.nombre + (r.ok ? "" : "\n       " + r.error);
  }

  if (typeof document !== "undefined") {
    var cont = document.getElementById("resultados");
    if (cont) {
      cont.innerHTML =
        '<p class="tests-resumen ' + (fallaron ? "malo" : "bueno") + '">' +
        pasaron + " de " + resultados.length + " tests pasaron" +
        (fallaron ? " · " + fallaron + " fallaron" : " · todo verde") +
        "</p><ul>" +
        resultados
          .map(function (r) {
            return '<li class="' + (r.ok ? "ok" : "fail") + '">' +
              (r.ok ? "✅ " : "❌ ") + r.nombre +
              (r.ok ? "" : '<br><small>' + r.error + "</small>") + "</li>";
          })
          .join("") +
        "</ul>";
    }
  } else {
    console.log("\n=== TESTS MOTOR DE CÁLCULO (Pequeños Envíos/Courier) ===\n");
    resultados.forEach(function (r) { console.log(linea(r)); });
    console.log("\n" + pasaron + "/" + resultados.length + " tests pasaron" + (fallaron ? " · " + fallaron + " FALLARON" : " · TODO VERDE") + "\n");
    if (typeof process !== "undefined" && process.exit) process.exit(fallaron ? 1 : 0);
  }
})();
