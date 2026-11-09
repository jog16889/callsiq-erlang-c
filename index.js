/* Erlang C para dimensionar centros de llamadas. De la calculadora de CallsIQ: https://callsiq.com/herramientas/calculadora-erlang-c-agentes/ */
(function (root) {
  'use strict';

  var EPS = 1e-9;
  var MAX_AGENTS = 100000;

  // Erlang B por recursión estable: B(0) = 1; B(n) = A·B(n-1) / (n + A·B(n-1)).
  function erlangB(n, A) {
    var b = 1;
    for (var k = 1; k <= n; k++) b = (A * b) / (k + A * b);
    return b;
  }

  // Erlang C a partir de Erlang B: C = n·B / (n - A·(1 - B)). Vale 1 si n <= A.
  function erlangCFromB(n, A, b) {
    if (n <= A) return 1;
    return (n * b) / (n - A * (1 - b));
  }

  function erlangC(n, A) {
    if (A <= 0) return 0;
    return erlangCFromB(n, A, erlangB(n, A));
  }

  // Proporción atendida en t segundos o menos: SL = 1 - C·e^(-(n-A)·t/AHT).
  function serviceLevelFromC(c, n, A, aht, t) {
    if (n <= A) return 0;
    return 1 - c * Math.exp(-(n - A) * t / aht);
  }

  // Espera media de todas las llamadas: ASA = C·AHT / (n - A).
  function asaFromC(c, n, A, aht) {
    if (n <= A) return Infinity;
    return (c * aht) / (n - A);
  }

  function metrics(n, A, aht, t) {
    var c = erlangC(n, A);
    return {
      agents: n,
      pWait: c,
      serviceLevel: serviceLevelFromC(c, n, A, aht, t),
      asa: asaFromC(c, n, A, aht),
      occupancy: n > 0 ? A / n : NaN
    };
  }

  function validate(e) {
    var errors = [];
    function bad(v) { return typeof v !== 'number' || !isFinite(v); }
    if (bad(e.calls) || e.calls <= 0) errors.push('calls');
    if (bad(e.interval) || e.interval <= 0) errors.push('interval');
    if (bad(e.aht) || e.aht <= 0) errors.push('aht');
    if (bad(e.sl_target) || e.sl_target <= 0 || e.sl_target >= 100) errors.push('sl_target');
    if (bad(e.sl_seconds) || e.sl_seconds < 0) errors.push('sl_seconds');
    if (!(e.max_occupancy === undefined || e.max_occupancy === null || (typeof e.max_occupancy === 'number' && isNaN(e.max_occupancy)) ||
        (typeof e.max_occupancy === 'number' && e.max_occupancy >= 0 && e.max_occupancy <= 100))) errors.push('max_occupancy');
    if (bad(e.shrinkage) || e.shrinkage < 0 || e.shrinkage >= 100) errors.push('shrinkage');
    return errors;
  }

  // entrada: calls, interval (min), aht (s), sl_target (%), sl_seconds (s), max_occupancy (%, 0 o vacío = sin límite), shrinkage (%).
  function calcular(e) {
    var errors = validate(e);
    if (errors.length) return { errors: errors };
    var A = e.calls * e.aht / (e.interval * 60);
    if (A > MAX_AGENTS / 2) return { errors: ['too_large'], traffic: A };
    var target = e.sl_target / 100;
    var t = e.sl_seconds;
    var maxOcc = (typeof e.max_occupancy === 'number' && e.max_occupancy > 0) ? e.max_occupancy / 100 : null;

    // Recorre n = 1, 2, … reutilizando la recursión de Erlang B: coste lineal y sin factoriales.
    var b = 1, n = 0, nService = null, nRequired = null;
    while (n < MAX_AGENTS) {
      n += 1;
      b = (A * b) / (n + A * b);
      if (n <= A) continue;
      var c = erlangCFromB(n, A, b);
      var sl = serviceLevelFromC(c, n, A, e.aht, t);
      var meetsSL = sl >= target - EPS;
      if (meetsSL && nService === null) nService = n;
      if (meetsSL && (maxOcc === null || A / n <= maxOcc + EPS)) { nRequired = n; break; }
    }
    if (nRequired === null) return { errors: ['too_large'], traffic: A };

    var main = metrics(nRequired, A, e.aht, t);
    var rows = [];
    for (var k = 0; k < 5; k++) rows.push(metrics(nRequired + k, A, e.aht, t));
    var hire = Math.ceil(nRequired / (1 - e.shrinkage / 100) - EPS);

    return {
      errors: [],
      traffic: A,
      agents: nRequired,
      agentsForServiceLevel: nService,
      limitedBy: nRequired > nService ? 'occupancy' : 'service_level',
      serviceLevel: main.serviceLevel,
      asa: main.asa,
      pWait: main.pWait,
      occupancy: main.occupancy,
      waitIfDelayed: e.aht / (nRequired - A),
      hire: hire,
      target: target,
      seconds: t,
      maxOccupancy: maxOcc,
      table: rows
    };
  }

  var api = { calcular: calcular, erlangB: erlangB, erlangC: erlangC, metrics: metrics };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ErlangC = api;
})(this);
