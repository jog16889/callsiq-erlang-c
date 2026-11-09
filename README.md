# callsiq-erlang-c

Erlang C para dimensionar un centro de llamadas: cuántos agentes hacen falta para cumplir un nivel de servicio, con la espera media (ASA), la probabilidad de espera y la ocupación. Es JavaScript sin dependencias que funciona en el navegador y en Node.

Es el motor de la **[calculadora Erlang C de CallsIQ](https://callsiq.com/herramientas/calculadora-erlang-c-agentes/)**, que añade la interfaz, la tabla de escenarios y la explicación de cada resultado. Para usarla no hace falta instalar nada.

## Uso

```js
const { calcular, erlangC } = require('./index.js');

calcular({
  calls: 100,        // llamadas en el intervalo
  interval: 30,      // minutos
  aht: 180,          // tiempo medio de gestión, en segundos
  sl_target: 80,     // % que se quiere atender…
  sl_seconds: 20,    // …en estos segundos o menos
  max_occupancy: 85, // opcional: % máximo de ocupación (0 o vacío = sin límite)
  shrinkage: 30      // % de tiempo no disponible (pausas, formación, ausencias)
});
// → { traffic: 10, agents: 14, hire: 20, serviceLevel: 0.888, asa: 7.8, occupancy: 0.714, … }

erlangC(12, 10); // 0.4494: probabilidad de esperar con 12 agentes y 10 erlangs
```

En el navegador, `<script src="index.js"></script>` expone `window.ErlangC`.

## Cómo calcula

- Tráfico: `A = llamadas × AHT / (intervalo en segundos)`.
- Erlang B por recursión estable, sin factoriales: `B(n) = A·B(n−1) / (n + A·B(n−1))`.
- Erlang C a partir de B: `C = n·B / (n − A·(1 − B))`.
- Nivel de servicio: `SL = 1 − C·e^(−(n−A)·t/AHT)`. ASA: `C·AHT / (n − A)`.
- Plantilla a contratar: `agentes / (1 − shrinkage)`, redondeada hacia arriba.

Supone llegadas de Poisson, tiempos de gestión exponenciales y que nadie abandona la cola. Con abandonos altos, Erlang C sobrestima los agentes necesarios: la [guía de CallsIQ](https://callsiq.com/guias/calcular-personal-atender-llamadas/) explica cuándo conviene otro modelo.

## Pruebas

```bash
node test.js
```

## English

Dependency-free Erlang C for call center staffing: agents needed for a service level target, ASA, probability of waiting and occupancy. It powers the [CallsIQ Erlang C calculator](https://callsiq.com/en/tools/erlang-c-staffing-calculator/). Input and output field names are the same as in the Spanish example above.

## Licencia

MIT © Joaquín Orozco · [CallsIQ](https://callsiq.com/)
