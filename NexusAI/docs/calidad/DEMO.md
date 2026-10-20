# Guion de la demo (TPC-11)

> Issue [#583](https://github.com/nexusai-ucc/nexusAI/issues/583) · Épica [#584](https://github.com/nexusai-ucc/nexusAI/issues/584) · Versión 1.0, 20/10/2026

El enunciado pide una *"demostración con un despliegue nuevo, con las integraciones, pruebas y cargas exigidas"*. La demo dura unos **12 minutos**. Cada paso dice qué hacer, qué se ve y qué decir. Si algo falla en vivo, hay un plan B con una corrida ya hecha, porque el TP también se trata de mostrar que el pipeline detecta los problemas.

## Antes de la demo (el día anterior)

1. **`staging` actualizado y en verde.** Mergear `development` → `staging` y comprobar que `deploy-staging.yml` dé verde: deploy, commit verificado y smoke.
2. **Promover `staging` → `main`** (PR del equipo). **No despliega producción**, que sigue siendo manual (`DEPLOY_ORACLE.md`). Habilita el botón *Run workflow* de `load-test.yml` e `integration-external.yml`, porque GitHub solo los ofrece desde la rama por defecto, y hace que empiece a correr la prueba diaria contra Gemini.
3. **Dejar preparado un cambio chico** en una rama, para el deploy nuevo de la demo. Por ejemplo, una línea del changelog. Abrir el PR a `development` y esperar el CI verde.
4. Pestañas abiertas:
   - el PR del paso 3;
   - *Actions*;
   - [SonarCloud](https://sonarcloud.io/summary/overall?id=nexusai-ucc_nexusAI&branch=development);
   - el informe en PDF.

## La demo

### 1. El cambio pasa por el pipeline (2 min)
- **Hacer:** mostrar el PR del paso 3 con sus checks en verde (backend, widget, Moodle en 7 combinaciones, Quality Gate, SonarCloud) y mergearlo.
- **Decir:** "Ningún cambio entra a `development` sin pruebas en tres lenguajes y sin el gate de SonarCloud: bloquea con menos de 80 % de cobertura del código nuevo o con bugs y vulnerabilidades. Así se ve un rojo:" → mostrar el PR #602 (cobertura 0 %, duplicación 72,3 %).

### 2. Despliegue nuevo + smoke E2E (3 min)
- **Hacer:** mergear el PR `development` → `staging`. En *Actions*, abrir *Deploy staging + smoke*.
- **Se ve:**
  1. **Deploy en la VM**: el log de `deploy_vm.sh` (rama, fast-forward, container healthy) y "Commit desplegado y verificado".
  2. **Smoke E2E**: `[OK] health`, `[OK] chat firmado` (con `gpt-4o-mini` real) y `[OK] anti-replay (401)`.
- **Decir:** "El pipeline entra a la VM con una clave que solo puede ejecutar el script de deploy. Verifica que quedó el commit exacto y prueba de punta a punta: firma HMAC como el plugin, base, embeddings, el LLM real y el anti-replay. Si staging no responde, el pipeline queda en rojo." → mostrar la [corrida roja](https://github.com/nexusai-ucc/nexusAI/actions/runs/39322438708).
- **Plan B:** la [corrida verde de referencia](https://github.com/nexusai-ucc/nexusAI/actions/runs/39322298675).

### 3. Integración externa contra el proveedor real (2 min)
- **Hacer:** *Actions* → *Integración externa (LLM real)* → *Run workflow*. Mientras corre, mostrar `NexusAI/contracts/` y [INTEGRACION_EXTERNA.md](INTEGRACION_EXTERNA.md) §2.
- **Se ve:** los 3 tests contra Gemini (chat dentro del SLA, el fallback ante un 404 real y los embeddings de 768 dimensiones) y la tabla de latencias.
- **Decir:** "Los dobles de prueba no podían mostrar que Gemini devuelve los embeddings sin `index` (DEF-07), ni que Google retira modelos sin aviso. Esta prueba sí."
- **Plan B:** si Gemini tarda (ya pasó: [112 s](https://github.com/nexusai-ucc/nexusAI/actions/runs/39260816477)), es justamente lo que la prueba tiene que detectar. Mostrar la [corrida verde](https://github.com/nexusai-ucc/nexusAI/actions/runs/39257509226) como referencia.

### 4. Carga (3 min)
- **Hacer:** *Actions* → *Pruebas de carga (k6)* → *Run workflow* con `target=staging` (escenario `real`: 2 usuarios durante 2 min con el LLM real).
- **Mientras corre:** mostrar la [corrida oficial](https://github.com/nexusai-ucc/nexusAI/actions/runs/39330079364), porque el stress y el sostenido tardan 25 min en total. Hay que mostrar:
  - la tabla por escalón de 10 a 100 usuarios;
  - DEF-09 antes y después ([PRUEBAS_DE_CARGA.md](PRUEBAS_DE_CARGA.md) §2.2).
- **Decir:** "Con 40 alumnos el chat colapsaba: cada pedido retenía una conexión a la base mientras esperaba al LLM y pedía otra para registrar el consumo. Lo encontró esta prueba y no la funcional. Con el fix, 100 alumnos con un p95 de 2,5 s."
- **Se ve al terminar:** los umbrales en verde y el p95 real contra el SLA de 8 s.

### 5. Calidad medida (2 min)
- **Hacer:** abrir SonarCloud en `development` (A/A/A) y el historial de actividad.
- **Decir:**
  - "Del 15/10 a hoy: 26 bugs a 0 y 14 vulnerabilidades a 0, y la cobertura de 56,6 a 83,6 %. El gate solo mira el código nuevo: lo heredado bajó porque lo atacamos a propósito."
  - Cerrar con los 9 defectos y la técnica que encontró cada uno (informe, sección 6).

## Si alguien pregunta

| Pregunta | Dónde está la respuesta |
|---|---|
| ¿Por qué nivel 3? | Informe §2.2; [LINEA_BASE.md](LINEA_BASE.md) |
| ¿Qué no cumplieron? | Informe §3.2 |
| ¿Cómo se ve un defecto rojo/verde? | DEF-01 y DEF-09 en [REGISTRO_DEFECTOS.md](REGISTRO_DEFECTOS.md) |
| ¿Cómo eligieron SonarCloud? | Matriz de decisión en [HERRAMIENTA_SONARCLOUD.md](HERRAMIENTA_SONARCLOUD.md) |
| ¿Por qué la carga no fue contra staging? | [PRUEBAS_DE_CARGA.md](PRUEBAS_DE_CARGA.md) §1.1 |
| ¿Qué técnica de caja negra usaron? | [CASOS_DE_PRUEBA.md](CASOS_DE_PRUEBA.md): tablas de decisión §3.1 y §4.3 |

## Ensayo

| Fecha | Paso | Corrida | Resultado |
|---|---|---|---|
| _pendiente_ | 2 · Deploy + smoke | | |
| _pendiente_ | 3 · Integración externa | | |
| _pendiente_ | 4 · Carga contra staging | | |

## Historial de versiones

| Versión | Fecha | Cambios |
|---|---|---|
| 1.0 | 20/10/2026 | Guion, preparación, plan B por paso y preguntas frecuentes |
