// Auditoría de accesibilidad completa del widget y del panel docente.
import puppeteer from 'puppeteer-core';
import fs from 'fs';
import http from 'http';
import path from 'path';

const dir = path.dirname(new URL(import.meta.url).pathname);
const shots = path.join(dir, 'shots');
fs.mkdirSync(shots, {recursive: true});
const srv = http.createServer((q, r) => {
  const f = path.join(dir, decodeURIComponent(q.url.split('?')[0]));
  if (!f.startsWith(dir) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, {'Content-Type': f.endsWith('.html') ? 'text/html' : 'application/javascript'});
  fs.createReadStream(f).pipe(r);
}).listen(8770);
const BASE = 'http://localhost:8770';
const axeSrc = fs.readFileSync(path.join(dir, 'node_modules/axe-core/axe.min.js'), 'utf8');
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];
const sleep = ms => new Promise(r => setTimeout(r, ms));
const browser = await puppeteer.launch({executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox']});
const R = {axe: [], keyboard: {}, reflow: [], spacing: [], motion: [], docsKeyboard: {}};

async function newPage({w = 1280, h = 900, scheme = 'light', motion = 'no-preference'} = {}) {
  const page = await browser.newPage();
  await page.setViewport({width: w, height: h});
  await page.emulateMediaFeatures([{name: 'prefers-color-scheme', value: scheme}, {name: 'prefers-reduced-motion', value: motion}]);
  page.on('pageerror', e => console.log('pageerror', e.message));
  return page;
}
async function openChat(page, teacher) {
  await page.goto(`${BASE}/harness.html?bundle=${process.env.CHAT || 'new'}&t=${teacher ? 1 : 0}`);
  await page.waitForFunction('window.__ready');
  await sleep(600);
  await page.evaluate(() => window.dispatchEvent(new CustomEvent('nexusai:toggle-panel')));
  await sleep(900);
}
async function axe(page, ctx) {
  await page.addScriptTag({content: axeSrc});
  const res = await page.evaluate(async (tags) => {
    const r = await axe.run(document, {runOnly: {type: 'tag', values: tags}});
    return {passes: r.passes.length, violations: r.violations.map(v => ({id: v.id, impact: v.impact, tags: v.tags.filter(t => /^wcag|best/.test(t)), help: v.help,
      nodes: v.nodes.map(n => n.target.join(' ') + ' → ' + (n.failureSummary || '').split('\n').slice(1).join(' ').trim())}))};
  }, TAGS);
  R.axe.push({ctx, ...res});
}
async function gotoTab(page, label) {
  if (label === 'Chat') return true;
  const nav = await page.$('button[aria-label="Navegación"]');
  if (!nav) return false;
  await nav.click(); await sleep(400);
  const ok = await page.evaluate(l => {
    const b = [...document.querySelectorAll('.nexusai-navmenu__item')].find(x => x.textContent.trim().includes(l));
    if (b) b.click(); return !!b;
  }, label);
  await sleep(1200);
  return ok;
}

// 1) axe en todas las vistas, ambos roles y esquemas
const VIEWS = {0: ['Chat', 'Modo Estudio', 'Buscar', 'Calendario'], 1: ['Chat', 'Modo Estudio', 'Calendario', 'Revisión del curso', 'Resumen del foro']};
for (const scheme of ['light', 'dark']) for (const t of [0, 1]) for (const view of VIEWS[t]) {
  const page = await newPage({scheme});
  await openChat(page, t);
  if (!(await gotoTab(page, view))) { R.axe.push({ctx: `${scheme}/${t ? 'docente' : 'alumno'}/${view}`, error: 'pestaña no encontrada'}); await page.close(); continue; }
  if (view === 'Chat') {
    const ta = await page.$('#local-nexusai-container textarea');
    if (ta) { await ta.type('¿Qué es una base de datos relacional?'); await page.keyboard.press('Enter'); await sleep(3500); }
  }
  await page.screenshot({path: path.join(shots, `chat-${scheme}-${t ? 'docente' : 'alumno'}-${view.replace(/\s+/g, '_')}.png`)});
  await axe(page, `widget/${scheme}/${t ? 'docente' : 'alumno'}/${view}`);
  await page.close();
}
for (const scheme of ['light', 'dark']) {
  const page = await newPage({scheme});
  await page.goto(`${BASE}/docs.html?bundle=${process.env.DOC || 'docnew'}`); await page.waitForFunction('window.__ready'); await sleep(2000);
  const n = await page.$$eval('.nexusai-doc-nav__item', x => x.length);
  for (let i = 0; i < n; i++) {
    const name = await page.evaluate(i => { const b = document.querySelectorAll('.nexusai-doc-nav__item')[i]; b.click(); return b.textContent.trim().replace(/\d+$/, ''); }, i);
    await sleep(900);
    await page.screenshot({path: path.join(shots, `docente-${scheme}-${i}.png`)});
    await axe(page, `panel-docente/${scheme}/${name}`);
  }
  await page.close();
}

// 2) Teclado en el widget (alumno)
{
  const page = await newPage();
  await openChat(page, 0);
  const describe = () => {
    const a = document.activeElement;
    if (!a || a === document.body) return {el: 'body'};
    const cs = getComputedStyle(a);
    const name = (a.getAttribute('aria-label') || a.getAttribute('title') || a.placeholder || a.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40);
    return {el: a.tagName.toLowerCase() + (a.className && typeof a.className === 'string' ? '.' + a.className.split(' ')[0] : ''), name,
      inPanel: !!a.closest('#local-nexusai-container'),
      focusVisible: a.matches(':focus-visible'),
      indicator: (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) || cs.boxShadow !== 'none'};
  };
  // Abrir desde el disparador con teclado (como el ícono de la barra de Moodle)
  await page.evaluate(() => window.dispatchEvent(new CustomEvent('nexusai:toggle-panel'))); await sleep(500);
  await page.focus('#trigger'); await page.keyboard.press('Enter'); await sleep(800);
  R.keyboard.afterOpen = await page.evaluate(describe);
  R.keyboard.dialog = await page.evaluate(() => { const d = document.querySelector('#local-nexusai-container [role=dialog]'); return d ? {role: 'dialog', modal: d.getAttribute('aria-modal'), labelledby: d.getAttribute('aria-labelledby')} : null; });
  const seq = [];
  for (let i = 0; i < 30; i++) { await page.keyboard.press('Tab'); seq.push(await page.evaluate(describe)); }
  R.keyboard.tabSequence = seq;
  // Enviar con teclado
  await page.evaluate(() => document.querySelector('#local-nexusai-container textarea')?.focus());
  await page.keyboard.type('Hola'); await page.keyboard.press('Enter'); await sleep(3000);
  R.keyboard.enterSends = await page.evaluate(() => document.querySelectorAll('.nexusai-msg--user').length > 0);
  R.keyboard.live = await page.evaluate(() => [...document.querySelectorAll('#local-nexusai-container [aria-live]')].map(e => e.className.split(' ')[0] + ':' + e.getAttribute('aria-live') + ' "' + e.textContent.slice(0, 60) + '"'));
  // Ctrl+K y Escape
  await page.keyboard.down('Control'); await page.keyboard.press('k'); await page.keyboard.up('Control'); await sleep(600);
  R.keyboard.ctrlK = await page.evaluate(() => document.querySelector('#nexusai-title')?.textContent.trim());
  await page.keyboard.press('Escape'); await sleep(500);
  R.keyboard.escapeCloses = await page.evaluate(() => !document.querySelector('#local-nexusai-container [role=dialog]'));
  R.keyboard.focusAfterEscape = await page.evaluate(describe);
  await page.close();
}

// 3) Teclado en el panel docente
{
  const page = await newPage();
  await page.goto(`${BASE}/docs.html?bundle=${process.env.DOC || 'docnew'}`); await page.waitForFunction('window.__ready'); await sleep(2000);
  const seq = [];
  for (let i = 0; i < 25; i++) {
    await page.keyboard.press('Tab');
    seq.push(await page.evaluate(() => { const a = document.activeElement; const cs = getComputedStyle(a);
      return {el: a.tagName.toLowerCase(), name: (a.getAttribute('aria-label') || a.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40),
        indicator: (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) || cs.boxShadow !== 'none'}; }));
  }
  R.docsKeyboard.tabSequence = seq;
  // Activar la 2.ª pestaña con Enter
  await page.evaluate(() => document.querySelectorAll('.nexusai-doc-nav__item')[1].focus());
  await page.keyboard.press('Enter'); await sleep(800);
  R.docsKeyboard.enterActivates = await page.evaluate(() => document.querySelectorAll('.nexusai-doc-nav__item')[1].classList.contains('nexusai-doc-nav__item--active'));
  R.docsKeyboard.ariaCurrent = await page.evaluate(() => document.querySelector('.nexusai-doc-nav__item--active')?.getAttribute('aria-current'));
  await page.close();
}

// 4) Reflow (320 px = 1280 px al 400 %) y zoom 200 %
const overflow = () => {
  const root = document.querySelector('.nexusai-panel, #local-nexusai-container [role=dialog], .nexusai-documents');
  const r = root?.getBoundingClientRect();
  const wide = [...(root?.querySelectorAll('*') || [])].filter(e => { const b = e.getBoundingClientRect(); return b.width > 0 && (b.right > innerWidth + 1 || b.left < -1); })
    .slice(0, 5).map(e => e.className && typeof e.className === 'string' ? e.className.split(' ')[0] : e.tagName);
  return {vw: innerWidth, docScroll: document.documentElement.scrollWidth, panel: r ? [Math.round(r.left), Math.round(r.width)] : null, outside: wide};
};
for (const [w, h, label] of [[320, 640, '320px (400 %)'], [640, 450, '200 %']]) {
  let page = await newPage({w, h});
  await openChat(page, 0);
  R.reflow.push({ctx: `widget ${label}`, ...(await page.evaluate(overflow))});
  await page.screenshot({path: path.join(shots, `reflow-widget-${w}.png`)});
  await page.close();
  page = await newPage({w, h});
  await page.goto(`${BASE}/docs.html?bundle=${process.env.DOC || 'docnew'}`); await page.waitForFunction('window.__ready'); await sleep(2000);
  R.reflow.push({ctx: `panel docente ${label}`, ...(await page.evaluate(overflow))});
  await page.screenshot({path: path.join(shots, `reflow-docente-${w}.png`), fullPage: true});
  await page.close();
}

// 5) Espaciado de texto (1.4.12)
const SPACING = '* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; } p { margin-bottom: 2em !important; }';
const clipped = () => [...document.querySelectorAll('#local-nexusai-container *, .nexusai-documents *')].filter(e => {
  const cs = getComputedStyle(e); if (!e.textContent.trim() || e.children.length > 2) return false;
  const hid = /hidden|clip/.test(cs.overflow + cs.overflowX + cs.overflowY);
  return hid && cs.textOverflow !== 'ellipsis' && !e.classList.contains('nexusai-sr-only') && (e.scrollHeight > e.clientHeight + 2 || e.scrollWidth > e.clientWidth + 2);
}).slice(0, 8).map(e => (e.className.split ? e.className.split(' ')[0] : e.tagName) + ': ' + e.textContent.trim().slice(0, 30));
{
  let page = await newPage(); await openChat(page, 0);
  const ta = await page.$('#local-nexusai-container textarea'); await ta.type('Pregunta de prueba'); await page.keyboard.press('Enter'); await sleep(3000);
  await page.addStyleTag({content: SPACING}); await sleep(300);
  R.spacing.push({ctx: 'widget', clipped: await page.evaluate(clipped)});
  await page.screenshot({path: path.join(shots, 'spacing-widget.png')}); await page.close();
  page = await newPage(); await page.goto(`${BASE}/docs.html?bundle=${process.env.DOC || 'docnew'}`); await page.waitForFunction('window.__ready'); await sleep(2000);
  await page.addStyleTag({content: SPACING}); await sleep(300);
  R.spacing.push({ctx: 'panel docente', clipped: await page.evaluate(clipped)});
  await page.close();
}

// 6) Movimiento reducido
for (const motion of ['no-preference', 'reduce']) {
  const page = await newPage({motion}); await openChat(page, 0);
  const ta = await page.$('#local-nexusai-container textarea'); await ta.type('Hola'); await page.keyboard.press('Enter'); await sleep(200);
  const anim = await page.evaluate(() => [...document.querySelectorAll('#local-nexusai-container *')].filter(e => {
    const cs = getComputedStyle(e);
    return cs.animationName !== 'none' && parseFloat(cs.animationDuration) > 0.01;
  }).map(e => e.className.split ? e.className.split(' ')[0] : e.tagName));
  R.motion.push({motion, animated: [...new Set(anim)]});
  await page.close();
}

fs.writeFileSync(path.join(dir, process.env.OUT || 'full-results.json'), JSON.stringify(R, null, 1));
await browser.close(); srv.close();

// Resumen
for (const a of R.axe) console.log(`${a.ctx}: ${a.error || `${a.passes} reglas OK, ${a.violations.length} con fallos`}${a.violations?.length ? ' → ' + a.violations.map(v => `${v.id}[${v.impact}](${v.nodes.length})`).join(', ') : ''}`);
console.log('\nKEYBOARD', JSON.stringify({afterOpen: R.keyboard.afterOpen, dialog: R.keyboard.dialog, enterSends: R.keyboard.enterSends, live: R.keyboard.live, ctrlK: R.keyboard.ctrlK, escapeCloses: R.keyboard.escapeCloses, focusAfterEscape: R.keyboard.focusAfterEscape}));
console.log('TAB SEQ'); R.keyboard.tabSequence.forEach((s, i) => console.log(` ${i + 1}. ${s.el} "${s.name}" panel=${s.inPanel} indicador=${s.indicator}`));
console.log('DOCS', JSON.stringify({enter: R.docsKeyboard.enterActivates, ariaCurrent: R.docsKeyboard.ariaCurrent}));
R.docsKeyboard.tabSequence.forEach((s, i) => console.log(` ${i + 1}. ${s.el} "${s.name}" indicador=${s.indicator}`));
console.log('REFLOW', JSON.stringify(R.reflow));
console.log('SPACING', JSON.stringify(R.spacing));
console.log('MOTION', JSON.stringify(R.motion));
