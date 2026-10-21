// Pruebas de carga del backend de NexusAI con k6 (TPC-09, #581).
//
// Escenario con -e SCENARIO=<nombre> (ver docs/calidad/PRUEBAS_DE_CARGA.md):
//   smoke       1 VU, 30 s: el script y el ambiente andan.
//   sostenido   esfuerzo sostenido: 10 VUs constantes durante 10 min.
//   stress      rampa por escalones hasta 100 VUs, para encontrar el quiebre.
//   rate_limit  un alumno manda 30 preguntas juntas: el límite por minuto (20)
//               tiene que cortar con 429 y nunca con 5xx.
//   dedup       re-subida del mismo archivo (CONT-04): SLA < 1 s.
//   real        corrida chica contra un ambiente con el LLM real (staging).
//
// Cada pedido se firma con HMAC igual que el plugin (backend_client.php):
// hex(hmac_sha256(secret, timestamp + nonce + body)).
//
// Variables: BASE_URL, NEXUSAI_API_KEY, NEXUSAI_SHARED_SECRET, SCENARIO,
// COURSE_ID (default 9001), SUMMARY_DIR (default .).

import http from 'k6/http';
import crypto from 'k6/crypto';
import encoding from 'k6/encoding';
import { check, sleep, fail } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

const BASE_URL = (__ENV.BASE_URL || 'http://localhost:8001').replace(/\/$/, '');
const API_KEY = __ENV.NEXUSAI_API_KEY || 'load-test-api-key';
const SECRET = __ENV.NEXUSAI_SHARED_SECRET || 'load-test-shared-secret';
const SCENARIO = __ENV.SCENARIO || 'smoke';
const COURSE_ID = Number(__ENV.COURSE_ID || 9001);
const CMID = 101;
const SLA_CHAT_MS = 8000; // TESTING.md §6: query RAG hasta la primera respuesta
const SLA_DEDUP_MS = 1000; // TESTING.md §6: dedup CONT-04

const chatOk = new Rate('chat_ok');
const chatWithContext = new Rate('chat_con_contexto');
const chatDuration = new Trend('chat_duration', true);
const status429 = new Counter('respuestas_429');
const status5xx = new Counter('respuestas_5xx');
const dedupDuration = new Trend('dedup_duration', true);
// Un umbral sobre una métrica sin muestras pasa "en verde" sin haber probado
// nada (p. ej. si el setup falla). chats_enviados > 0 lo impide.
const chatsSent = new Counter('chats_enviados');

const QUESTIONS = [
  'Que es una pila y cuales son sus operaciones?',
  'Cual es la diferencia entre una pila y una cola?',
  'Para que sirve una cola de prioridad?',
  'Como se recorre un arbol binario en inorden?',
  'Que complejidad tiene buscar en un arbol binario de busqueda?',
];

const MATERIAL = `Unidad 3: Estructuras de datos lineales y arboles.
Una pila es una estructura de datos LIFO: el ultimo elemento en entrar es el
primero en salir. Sus operaciones son push (apilar), pop (desapilar) y peek.
Una cola es una estructura FIFO: el primero en entrar es el primero en salir.
Sus operaciones son enqueue y dequeue. Una cola de prioridad atiende primero
al elemento de mayor prioridad y se implementa con un heap.
Un arbol binario tiene a lo sumo dos hijos por nodo. El recorrido inorden
visita el subarbol izquierdo, la raiz y el subarbol derecho. En un arbol
binario de busqueda balanceado buscar cuesta O(log n); degenerado, O(n).`;

// ---------------------------------------------------------------- escenarios

const SCENARIOS = {
  smoke: {
    executor: 'constant-vus', vus: 1, duration: '30s', exec: 'chat',
  },
  sostenido: {
    executor: 'constant-vus', vus: 10, duration: '10m', exec: 'chat',
  },
  stress: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '30s', target: 10 }, { duration: '90s', target: 10 },
      { duration: '30s', target: 20 }, { duration: '90s', target: 20 },
      { duration: '30s', target: 40 }, { duration: '90s', target: 40 },
      { duration: '30s', target: 60 }, { duration: '90s', target: 60 },
      { duration: '30s', target: 80 }, { duration: '90s', target: 80 },
      { duration: '30s', target: 100 }, { duration: '90s', target: 100 },
      { duration: '30s', target: 0 },
    ],
    gracefulRampDown: '30s',
    exec: 'chat',
  },
  rate_limit: {
    executor: 'per-vu-iterations', vus: 1, iterations: 1, exec: 'rateLimit',
  },
  dedup: {
    executor: 'per-vu-iterations', vus: 1, iterations: 20, exec: 'dedup',
  },
  real: {
    executor: 'constant-vus', vus: 2, duration: '2m', exec: 'chat',
  },
};

// Umbrales: si no se cumplen, k6 sale con código 99 y el pipeline queda en rojo.
const THRESHOLDS = {
  smoke: {
    chats_enviados: ['count>0'],
    chat_ok: ['rate==1'],
    chat_duration: [`p(95)<${SLA_CHAT_MS}`],
  },
  sostenido: {
    chats_enviados: ['count>0'],
    chat_ok: ['rate>0.99'],
    chat_duration: [`p(95)<${SLA_CHAT_MS}`],
    'http_req_duration{name:health}': ['p(95)<500'],
    respuestas_5xx: ['count==0'],
  },
  // El stress busca el quiebre: no aborta. El análisis (analyze_k6.py) informa
  // en qué escalón el p95 pasa el SLA o aparecen errores.
  stress: { chats_enviados: ['count>0'] },
  rate_limit: {
    respuestas_429: ['count==10'],
    respuestas_5xx: ['count==0'],
  },
  dedup: {
    dedup_duration: [`p(95)<${SLA_DEDUP_MS}`],
    checks: ['rate==1'],
  },
  real: {
    chats_enviados: ['count>0'],
    chat_ok: ['rate>0.95'],
    chat_duration: [`p(95)<${SLA_CHAT_MS}`],
  },
};

if (!SCENARIOS[SCENARIO]) {
  throw new Error(`SCENARIO desconocido: ${SCENARIO}`);
}

export const options = {
  scenarios: { [SCENARIO]: SCENARIOS[SCENARIO] },
  thresholds: THRESHOLDS[SCENARIO],
  summaryTrendStats: ['avg', 'min', 'med', 'p(90)', 'p(95)', 'p(99)', 'max'],
};

// ------------------------------------------------------------------- firma

// JSON solo ASCII (los no-ASCII como \uXXXX): la firma se calcula sobre los
// mismos bytes que viajan, sin depender de cómo k6 codifica los strings.
function asciiJson(value) {
  return JSON.stringify(value).replace(
    /[\u0080-￿]/g,
    (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`,
  );
}

function signed(body) {
  const timestamp = String(Math.floor(Date.now() / 1000));
  const iter = typeof __ITER === 'undefined' ? 'setup' : __ITER; // en setup() no existe
  const nonce = `${__VU}-${iter}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const signature = crypto.hmac('sha256', SECRET, timestamp + nonce + body, 'hex');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${API_KEY}`,
    'X-Timestamp': timestamp,
    'X-Nonce': nonce,
    'X-Signature': signature,
  };
}

function post(path, payload, name) {
  const body = asciiJson(payload);
  const res = http.post(`${BASE_URL}${path}`, body, { headers: signed(body), tags: { name } });
  if (res.status === 429) status429.add(1);
  if (res.status >= 500) status5xx.add(1);
  return res;
}

function get(path, name) {
  return http.get(`${BASE_URL}${path}`, { headers: signed(''), tags: { name } });
}

// ------------------------------------------------------------------- setup

function uploadMaterial() {
  return post('/api/v1/documents', {
    course_id: COURSE_ID,
    uploader_id: 1,
    filename: 'unidad3-estructuras.txt',
    mime_type: 'text/plain',
    content_b64: encoding.b64encode(MATERIAL),
    cmid: CMID,
  }, 'upload');
}

export function setup() {
  const health = http.get(`${BASE_URL}/health`, { tags: { name: 'health' } });
  if (health.status !== 200) fail(`/health respondió ${health.status}`);
  if (SCENARIO === 'real') return { env: health.json('env') };

  // Material indexado para que cada chat haga RAG de verdad (pgvector + prompt con contexto).
  const up = uploadMaterial();
  if (up.status !== 202 && up.status !== 200) fail(`upload respondió ${up.status}: ${up.body}`);
  const id = up.json('id');
  for (let i = 0; i < 60; i++) {
    const st = get(`/api/v1/documents/${id}`, 'document_status').json('status');
    if (st === 'indexed') return { documentId: id, env: health.json('env') };
    if (st === 'error') fail('la indexación del material terminó en error');
    sleep(1);
  }
  fail('el material no quedó indexado en 60 s');
}

// --------------------------------------------------------------- escenarios

let userId = 0;

export function chat() {
  // Cada VU es un alumno distinto: se mide el sistema, no el límite por alumno.
  if (!userId) userId = 100000 + __VU;
  const question = QUESTIONS[(__VU + __ITER) % QUESTIONS.length];

  const res = post('/api/v1/chat/messages', {
    course_id: COURSE_ID,
    user_id: userId,
    question,
    history: [],
    visible_cmids: SCENARIO === 'real' ? [] : [CMID],
  }, 'chat');

  const ok = check(res, {
    'chat 200': (r) => r.status === 200,
    'chat con respuesta': (r) => r.status === 200 && (r.json('answer') || '').length > 0,
  });
  chatsSent.add(1);
  chatOk.add(ok);
  chatDuration.add(res.timings.duration);
  if (res.status === 200 && SCENARIO !== 'real') {
    chatWithContext.add((res.json('metrics.chunks_retrieved') || 0) > 0);
  }

  // Cada tanto, el health (lo que miran el smoke de TPC-08 y el monitoreo).
  if (__ITER % 5 === 0) http.get(`${BASE_URL}/health`, { tags: { name: 'health' } });

  // Tiempo de "pensar" de un alumno entre preguntas.
  sleep(3 + Math.random() * 2);
}

export function rateLimit() {
  // La ventana del límite es fija por minuto: arrancar lejos del cambio de minuto
  // para que las 30 preguntas caigan en la misma ventana.
  const second = new Date().getSeconds();
  if (second > 40) sleep(62 - second);

  const user = 900000 + Math.floor(Math.random() * 1000);
  const requests = [];
  for (let i = 0; i < 30; i++) {
    const body = asciiJson({
      course_id: COURSE_ID, user_id: user, question: QUESTIONS[i % QUESTIONS.length],
      history: [], visible_cmids: [CMID],
    });
    requests.push({
      method: 'POST', url: `${BASE_URL}/api/v1/chat/messages`, body,
      params: { headers: signed(body), tags: { name: 'chat_rate_limit' } },
    });
  }
  const responses = http.batch(requests);
  let ok = 0;
  for (const r of responses) {
    if (r.status === 200) ok += 1;
    if (r.status === 429) status429.add(1);
    if (r.status >= 500) status5xx.add(1);
  }
  check(ok, { '20 pedidos dentro del límite responden 200': (n) => n === 20 });
}

export function dedup() {
  const res = uploadMaterial();
  check(res, {
    'dedup 200 (mismo documento, sin reindexar)': (r) => r.status === 200,
  });
  dedupDuration.add(res.timings.duration);
  sleep(0.5);
}

// ----------------------------------------------------------------- reporte

function fmt(ms) {
  return ms === undefined ? '—' : `${(ms / 1000).toFixed(2)} s`;
}

export function handleSummary(data) {
  const m = data.metrics;
  const trend = (name) => (m[name] ? m[name].values : {});
  const chatT = trend('chat_duration');
  const reqs = m.http_reqs ? m.http_reqs.values : {};
  const lines = [
    `### Carga: escenario \`${SCENARIO}\``,
    '',
    `- Pedidos HTTP: ${reqs.count || 0} (${(reqs.rate || 0).toFixed(2)}/s)`,
    `- Chats enviados: ${m.chats_enviados ? m.chats_enviados.values.count : 0}`,
    `- Chats OK: ${m.chat_ok ? (m.chat_ok.values.rate * 100).toFixed(2) : '—'} %`,
    `- Chats con contexto recuperado (RAG): ${m.chat_con_contexto ? (m.chat_con_contexto.values.rate * 100).toFixed(1) : '—'} %`,
    `- 429: ${m.respuestas_429 ? m.respuestas_429.values.count : 0} · 5xx: ${m.respuestas_5xx ? m.respuestas_5xx.values.count : 0}`,
    `- VUs máx.: ${m.vus_max ? m.vus_max.values.max : '—'}`,
    '',
    '| Métrica | p50 | p90 | p95 | p99 | máx. |',
    '|---|---|---|---|---|---|',
    `| Chat (punta a punta) | ${fmt(chatT.med)} | ${fmt(chatT['p(90)'])} | ${fmt(chatT['p(95)'])} | ${fmt(chatT['p(99)'])} | ${fmt(chatT.max)} |`,
  ];
  const dedupT = trend('dedup_duration');
  if (dedupT.med !== undefined) {
    lines.push(`| Re-subida (dedup) | ${fmt(dedupT.med)} | ${fmt(dedupT['p(90)'])} | ${fmt(dedupT['p(95)'])} | ${fmt(dedupT['p(99)'])} | ${fmt(dedupT.max)} |`);
  }
  lines.push('', '**Umbrales**', '');
  for (const [name, metric] of Object.entries(m)) {
    if (!metric.thresholds) continue;
    for (const [expr, res] of Object.entries(metric.thresholds)) {
      lines.push(`- ${res.ok ? '✅' : '❌'} \`${name}\`: \`${expr}\``);
    }
  }
  if (SCENARIO === 'stress') {
    lines.push('- El stress no aborta por latencia: busca el punto de quiebre (ver el análisis por escalón).');
  }
  const dir = __ENV.SUMMARY_DIR || '.';
  return {
    stdout: `${lines.join('\n')}\n`,
    [`${dir}/summary-${SCENARIO}.md`]: `${lines.join('\n')}\n`,
    [`${dir}/summary-${SCENARIO}.json`]: JSON.stringify(data, null, 2),
  };
}
