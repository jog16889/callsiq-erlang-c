'use strict';
// Ejecutar: node test.js
const assert = require('assert');
const { erlangB, erlangC, calcular } = require('./index.js');

const close = (a, b, tol = 1e-4) => assert.ok(Math.abs(a - b) < tol, `${a} != ${b}`);

// Valores de referencia de las tablas de Erlang (A = 10 erlangs).
close(erlangB(10, 10), 0.2146);
close(erlangC(11, 10), 0.6821);
close(erlangC(12, 10), 0.4494);
close(erlangC(13, 10), 0.2853);
assert.strictEqual(erlangC(10, 10), 1, 'con n <= A la cola no es estable');

// 100 llamadas en 30 min, 180 s de AHT, objetivo 80/20 y 30 % de shrinkage.
const r = calcular({ calls: 100, interval: 30, aht: 180, sl_target: 80, sl_seconds: 20, shrinkage: 30 });
assert.deepStrictEqual(r.errors, []);
assert.strictEqual(r.traffic, 10);
assert.strictEqual(r.agents, 14);
assert.strictEqual(r.hire, 20);
assert.ok(r.serviceLevel >= 0.8);

// El límite de ocupación puede exigir más agentes que el nivel de servicio.
const o = calcular({ calls: 100, interval: 30, aht: 180, sl_target: 80, sl_seconds: 20, max_occupancy: 65, shrinkage: 0 });
assert.strictEqual(o.limitedBy, 'occupancy');
assert.ok(o.occupancy <= 0.65);

// Entradas no válidas.
assert.deepStrictEqual(calcular({ calls: 0, interval: 30, aht: 180, sl_target: 80, sl_seconds: 20, shrinkage: 0 }).errors, ['calls']);
assert.deepStrictEqual(calcular({ calls: 10, interval: 30, aht: 180, sl_target: 100, sl_seconds: 20, shrinkage: 0 }).errors, ['sl_target']);

console.log('OK: todas las pruebas pasan');
