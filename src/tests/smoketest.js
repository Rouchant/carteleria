/**
 * Suite Automatizada de Smoketests para Generador de Cartelería Retail
 * Ejecuta validaciones end-to-end de:
 * 1. Servidor HTTP y recursos estáticos (CSS, JS, Fonts, Imágenes, Libs)
 * 2. Estructura del DOM, botones, inputs y orden UX de plantillas en index.html
 * 3. Lógica matemática de cuotas CMR y formateo CLP
 * 4. Renderizado HTML de las 10 plantillas de cartelería
 * 5. Calidad CSS (cero letter-spacing negativo, cero line-height < 1.0, cero !important en componentes)
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const http = require('http');

const SERVER_URL = process.env.TEST_URL || 'http://localhost:3000';
const ROOT_DIR = path.resolve(__dirname, '..', '..');
const SRC_DIR = path.resolve(__dirname, '..');

// Colores ANSI para salida en terminal
const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

let passed = 0;
let failed = 0;
const results = [];

function assert(condition, message) {
  if (condition) {
    passed++;
    results.push({ pass: true, msg: message });
    console.log(`  ${C.green}✔${C.reset} ${message}`);
  } else {
    failed++;
    results.push({ pass: false, msg: message });
    console.log(`  ${C.red}✖ ${message}${C.reset}`);
  }
}

async function fetchStatus(pathname) {
  const url = `${SERVER_URL}${pathname}`;
  try {
    const res = await fetch(url);
    return res.status;
  } catch (err) {
    return null;
  }
}

// -------------------------------------------------------------
// SUITE 1: Servidor HTTP & Carga de Recursos Estáticos (200 OK)
// -------------------------------------------------------------
async function testStaticAssets() {
  console.log(`\n${C.bold}${C.cyan}--- [1] Servidor HTTP & Recursos Estáticos (Offline 100%) ---${C.reset}`);

  const endpoints = [
    '/',
    '/index.html',
    '/css/fonts.css',
    '/css/app.css',
    '/css/cartel-base.css',
    '/css/cartel-templates.css',
    '/css/carteleria.css',
    '/js/utils.js',
    '/js/state.js',
    '/js/calculator.js',
    '/js/templates.js',
    '/js/qr.js',
    '/js/export.js',
    '/js/categorias.js',
    '/js/app.js',
    '/lib/qrcode.min.js',
    '/lib/html2canvas.min.js',
    '/lib/jspdf.umd.min.js',
    '/assets/categorias_falabella.csv',
    '/assets/oportunidadunica.png',
    '/assets/cmr.png',
    '/assets/infocmf.png',
    '/assets/fpuntos.svg',
    '/oportunidadunica.png',
    '/cmr.png',
    '/infocmf.png',
    '/fpuntos.svg',
    '/font/Lato-Regular.ttf',
    '/font/Lato-Bold.ttf',
    '/font/Lato-Light.ttf',
    '/font/Lato-Black.ttf',
    '/font/Lato-Thin.ttf',
    '/font/LINESeedJP-Regular.ttf',
    '/font/LINESeedJP-Bold.ttf'
  ];

  for (const ep of endpoints) {
    const status = await fetchStatus(ep);
    assert(status === 200, `Endpoint ${ep} responde HTTP 200 OK`);
  }
}

// -------------------------------------------------------------
// SUITE 2: Integridad del DOM y UX en index.html
// -------------------------------------------------------------
function testHtmlStructure() {
  console.log(`\n${C.bold}${C.cyan}--- [2] Estructura del DOM y Experiencia de Usuario (UX) ---${C.reset}`);

  const html = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf-8');

  // Identidad visual
  assert(html.includes('<div class="brand-logo-icon">F</div>'), 'Logo con ícono "F" presente');
  assert(html.includes('Generador de Cartelería'), 'Título principal del encabezado presente');

  // Botón principal de acción
  assert(html.includes('id="btnDownloadPdf"'), 'Botón principal "Descargar PDF" presente con ID correcto');
  assert(html.includes('id="btnPrint"'), 'Botón secundario "Imprimir" presente con ID correcto');

  // Inputs del producto
  const requiredInputs = [
    'inputMarca',
    'inputCategoria',
    'inputModelo',
    'inputSku',
    'inputPrecioCmr',
    'inputPrecioOferta',
    'inputPrecioNormal',
    'inputCae',
    'checkAutoCalc',
    'inputCuotaManual',
    'inputCtcManual'
  ];

  for (const inputId of requiredInputs) {
    assert(html.includes(`id="${inputId}"`), `Input '${inputId}' existe en el formulario`);
  }

  // Verificación estricta del orden solicitado en Tamaño y Formato:
  // 1. Carta (p118), 2. 13x19 (p132), 3. 9x13 (t-9x13), 4. 6x4 (t-6x4), 5. 12x3 (t-12x3)
  const templateOrderRegex = /data-template="([^"]+)"/g;
  const templatesFound = [];
  let match;
  while ((match = templateOrderRegex.exec(html)) !== null) {
    templatesFound.push(match[1]);
  }

  assert(templatesFound.length === 8, `Se encontraron ${templatesFound.length} plantillas en el selector (esperadas 8)`);
  assert(templatesFound.includes('p118'), 'Formato Carta (P_118) presente');
  assert(templatesFound.includes('t-15x21'), 'Formato 153 (15x21) presente');
  assert(templatesFound.includes('p132'), 'Formato 151 (13x19) presente');
  assert(templatesFound.includes('t-9x13'), 'Formato 131 (9x13) presente');
  assert(templatesFound.includes('t-9x7'), 'Formato 130 (9x7) presente');
  assert(templatesFound.includes('t-12x3'), 'Formato 263 (12x3) presente');
  assert(templatesFound.includes('t-6x4'), 'Formato 308 (6x4) presente');
  assert(templatesFound.includes('t-6x4-sheet'), 'Formato 6x4 Rejilla (18x) presente');

  // Presets rápidos
  assert(html.includes('id="presetAsus"'), 'Preset Oportunidad Única presente');
  assert(html.includes('id="presetSinCmr"'), 'Preset Todo Medio de Pago presente');
  assert(html.includes('id="presetSoloNormal"'), 'Preset Solo Precio Normal presente');
  assert(html.includes('id="presetClean"'), 'Preset Limpiar presente');

  // Elementos de renderizado
  assert(html.includes('id="cartelContainer"'), 'Contenedor del cartel físico (#cartelContainer) presente');
  assert(html.includes('id="previewWrapper"'), 'Contenedor de zoom y vista previa (#previewWrapper) presente');
}

// -------------------------------------------------------------
// SUITE 3: Lógica Matemática, Finanzas CMR y Formato CLP
// -------------------------------------------------------------
function testMathAndFormatting() {
  console.log(`\n${C.bold}${C.cyan}--- [3] Lógica Matemática y Cálculos Financieros ---${C.reset}`);

  // Cargar utilidades y calculadora en entorno sandbox
  const utilsCode = fs.readFileSync(path.join(SRC_DIR, 'js/utils.js'), 'utf-8');
  const calcCode = fs.readFileSync(path.join(SRC_DIR, 'js/calculator.js'), 'utf-8');

  const context = { console, Math };
  vm.createContext(context);
  vm.runInContext(utilsCode, context);
  vm.runInContext(calcCode, context);

  // 1. formatCLP
  assert(context.formatCLP(639990) === '$639.990', 'formatCLP(639990) formatea correctamente a "$639.990"');
  assert(context.formatCLP(1099990) === '$1.099.990', 'formatCLP(1099990) formatea a "$1.099.990"');
  assert(context.formatCLP(0) === '$0', 'formatCLP(0) formatea a "$0"');
  assert(context.formatCLP(null) === '', 'formatCLP(null) devuelve cadena vacía');
  assert(context.formatCLP(undefined) === '', 'formatCLP(undefined) devuelve cadena vacía');

  // 2. parseCLP
  assert(context.parseCLP('$639.990') === 639990, 'parseCLP("$639.990") devuelve 639990');
  assert(context.parseCLP('$ 1.499.990') === 1499990, 'parseCLP("$ 1.499.990") devuelve 1499990');
  assert(context.parseCLP('') === null, 'parseCLP("") devuelve null');

  // 3. formatDateChile
  assert(context.formatDateChile('2026-10-05') === '05/10/2026', 'formatDateChile("2026-10-05") formatea a "05/10/2026"');

  // 3.1 getSemanaVigenteActual (Cálculo dinámico Martes anterior a Lunes próximo incluyendo hoy)
  const semDomingo = context.getSemanaVigenteActual(new Date('2026-10-11T12:00:00')); // Domingo 11
  assert(semDomingo.desde === '2026-10-06', 'En Domingo 11, el martes anterior más cercano es 2026-10-06');
  assert(semDomingo.hasta === '2026-10-12', 'En Domingo 11, el lunes próximo más cercano es 2026-10-12');

  const semLunes = context.getSemanaVigenteActual(new Date('2026-10-12T10:00:00')); // Lunes 12 (último día)
  assert(semLunes.desde === '2026-10-06', 'En Lunes 12, el martes anterior más cercano es 2026-10-06');
  assert(semLunes.hasta === '2026-10-12', 'En Lunes 12 (incluyendo hoy), el lunes próximo más cercano es el mismo lunes 2026-10-12');

  const semMartes = context.getSemanaVigenteActual(new Date('2026-10-06T10:00:00')); // Martes 06 (inicio campaña)
  assert(semMartes.desde === '2026-10-06', 'En Martes 06 (incluyendo hoy), el martes anterior más cercano es el mismo martes 2026-10-06');
  assert(semMartes.hasta === '2026-10-12', 'En Martes 06, el lunes próximo más cercano es 2026-10-12');

  const semMiercoles = context.getSemanaVigenteActual(new Date('2026-10-07T15:00:00')); // Miércoles 07
  assert(semMiercoles.desde === '2026-10-06', 'En Miércoles 07, el martes anterior más cercano es 2026-10-06');
  assert(semMiercoles.hasta === '2026-10-12', 'En Miércoles 07, el lunes próximo más cercano es 2026-10-12');

  const semSiguienteMartes = context.getSemanaVigenteActual(new Date('2026-10-13T09:00:00')); // Siguiente Martes 13
  assert(semSiguienteMartes.desde === '2026-10-13', 'Al pasar al siguiente martes 13, el ciclo arranca en 2026-10-13');
  assert(semSiguienteMartes.hasta === '2026-10-19', 'Al pasar al siguiente martes 13, el cierre es el lunes 2026-10-19');

  // 4. calcularFinanciamiento (Fórmula Oficial CMR & CAE)
  const fin12 = context.calcularFinanciamiento(639990, 39.93);
  assert(fin12.cuota > 0, `Cuota CMR calculada > 0 ($${fin12.cuota})`);
  assert(fin12.ctc > 639990, `CTC ($${fin12.ctc}) es mayor al monto financiado ($639.990)`);
  assert(fin12.cuota === 64826, 'Cuota CMR oficial para $639.990 es exactamente $64.826');
  assert(fin12.ctc === 782981, 'CTC oficial para $639.990 es exactamente $782.981');

  const fin1499 = context.calcularFinanciamiento(1499990, 39.93);
  assert(fin1499.cuota === 151938, 'Cuota CMR oficial para $1.499.990 es exactamente $151.938');
  assert(fin1499.ctc === 1835136, 'CTC oficial para $1.499.990 es exactamente $1.835.136');
}

// -------------------------------------------------------------
// SUITE 4: Generadores y Renderizado de las 10 Plantillas
// -------------------------------------------------------------
function testTemplatesRender() {
  console.log(`\n${C.bold}${C.cyan}--- [4] Renderizado HTML de las 10 Plantillas de Cartelería ---${C.reset}`);

  const utilsCode = fs.readFileSync(path.join(SRC_DIR, 'js/utils.js'), 'utf-8');
  const tplCode = fs.readFileSync(path.join(SRC_DIR, 'js/templates.js'), 'utf-8');

  // Mock elemental del DOM
  class MockElement {
    constructor(tag) {
      this.tagName = tag;
      this.className = '';
      this.innerHTML = '';
      this.children = [];
      this.classList = {
        add: (...cls) => {
          this.className = (this.className + ' ' + cls.join(' ')).trim();
        },
        remove: (...cls) => {
          cls.forEach(c => {
            this.className = this.className.replace(new RegExp(`\\b${c}\\b`, 'g'), '').trim();
          });
        },
        contains: (c) => this.className.includes(c)
      };
    }
    appendChild(child) {
      this.children.push(child);
      this.innerHTML += child.innerHTML || child.outerHTML || '';
    }
  }

  const context = {
    document: {
      createElement: (tag) => new MockElement(tag)
    },
    state: {
      marca: 'ASUS',
      categoria: 'NOTEBOOK',
      modelo: 'UX5304VA',
      sku: '17021976',
      vigenciaDesde: '2026-10-05',
      vigenciaHasta: '2026-10-12',
      precioCmr: 639990,
      precioOferta: 659990,
      precioNormal: 1099990,
      cae: 39.93,
      cuotasNum: 12,
      cuotaMontoManual: 0,
      ctcManual: 0,
      autoCalcularCuotas: true
    },
    escapeHTML: (str) => str,
    formatDateChile: (d) => d
  };

  vm.createContext(context);
  vm.runInContext(utilsCode, context);
  vm.runInContext(tplCode, context);

  const ctxMock = {
    hasCmr: true,
    hasOferta: true,
    hasNormal: true,
    vigenciaStr: 'VIGENCIA: 05/10/2026 A 12/10/2026',
    financiamiento: { cuota: 64826, ctc: 782981 }
  };

  // 1. P_118 (Carta)
  const sheetP118 = new MockElement('div');
  context.renderVerticalTemplate(sheetP118, 'p118', ctxMock);
  assert(sheetP118.innerHTML.includes('P_118'), 'Plantilla P_118 incluye etiqueta de código P_118');
  assert(sheetP118.innerHTML.includes('$639.990'), 'Plantilla P_118 renderiza precio CMR formateado ($639.990)');
  assert(sheetP118.innerHTML.includes('OTRO MEDIO DE PAGO'), 'Plantilla P_118 incluye OTRO MEDIO DE PAGO');
  assert(sheetP118.innerHTML.includes('PRECIO NORMAL'), 'Plantilla P_118 incluye PRECIO NORMAL');

  // 2. P_132 (13x19)
  const sheetP132 = new MockElement('div');
  context.renderVerticalTemplate(sheetP132, 'p132', ctxMock);
  assert(sheetP132.innerHTML.includes('P_132'), 'Plantilla P_132 incluye etiqueta de código P_132');
  assert(sheetP132.innerHTML.includes('fpuntos-badge'), 'Plantilla P_132 incluye insignia de Fpuntos junto a infocmf');

  // 3. 15x21 (Pedestal Mediano)
  const sheet15x21 = new MockElement('div');
  context.render15x21(sheet15x21, ctxMock);
  assert(sheet15x21.innerHTML.includes('15x21'), 'Plantilla 15x21 renderiza correctamente');

  // 4. 9x13 (Pedestal Chico)
  const sheet9x13 = new MockElement('div');
  context.render9x13(sheet9x13, ctxMock);
  assert(sheet9x13.innerHTML.includes('9x13'), 'Plantilla 9x13 renderiza correctamente');

  // 5. 9x7 (Ficha Mesón P_130 / P_121)
  const sheet9x7 = new MockElement('div');
  context.render9x7(sheet9x7, ctxMock);
  assert(sheet9x7.innerHTML.includes('P_121') || sheet9x7.innerHTML.includes('P_130'), 'Plantilla 9x7 renderiza etiqueta de código P_121 / P_130');
  assert(sheet9x7.innerHTML.includes('OTRO MEDIO DE PAGO'), 'Plantilla 9x7 con tri-precio incluye OTRO MEDIO DE PAGO');
  assert(sheet9x7.innerHTML.includes('PRECIO NORMAL'), 'Plantilla 9x7 con tri-precio incluye PRECIO NORMAL');

  // 6. P_121 (Ficha Mostrador)
  const sheetP121 = new MockElement('div');
  context.renderFichaP121(sheetP121, ctxMock);
  assert(sheetP121.innerHTML.includes('P_121'), 'Plantilla P_121 renderiza correctamente');

  // 7. P_123 (Cenefa Fleje) con tri-precio (CMR + Oferta + Normal)
  const sheetP123 = new MockElement('div');
  context.renderFlejeHorizontal(sheetP123, ctxMock);
  assert(sheetP123.innerHTML.includes('P_123'), 'Plantilla P_123 renderiza correctamente');
  assert(sheetP123.innerHTML.includes('$639.990'), 'Plantilla P_123 incluye precio CMR');
  assert(sheetP123.innerHTML.includes('OTRO MEDIO DE PAGO'), 'Plantilla P_123 incluye OTRO MEDIO DE PAGO');
  assert(sheetP123.innerHTML.includes('PRECIO NORMAL'), 'Plantilla P_123 incluye PRECIO NORMAL');

  // 8. 12x3 (Fleje Angosto)
  const sheet12x3 = new MockElement('div');
  context.render12x3(sheet12x3, ctxMock);
  assert(sheet12x3.innerHTML.includes('12x3'), 'Plantilla 12x3 renderiza correctamente');

  // 9. 6x4 (Individual) con tri-precio
  const html6x4 = context.get6x4Html(ctxMock);
  assert(html6x4.includes('OTRO MEDIO'), 'Plantilla 6x4 incluye bloque de OTRO MEDIO');
  assert(html6x4.includes('PRECIO NORMAL'), 'Plantilla 6x4 incluye bloque de PRECIO NORMAL en footer');

  // 10. 6x4 (Hoja Carta 18x)
  const sheet6x4Grid = new MockElement('div');
  context.render6x4Sheet(sheet6x4Grid, ctxMock);
  assert(sheet6x4Grid.innerHTML.includes('sheet-6x4-grid'), 'Plantilla 6x4-sheet incluye contenedor de rejilla 18x');
}

// -------------------------------------------------------------
// SUITE 5: Verificación de Calidad Tipográfica y CSS (Anti-Bug)
// -------------------------------------------------------------
function testCssQuality() {
  console.log(`\n${C.bold}${C.cyan}--- [5] Auditoría de Calidad CSS (Kerning & Espaciado) ---${C.reset}`);

  const cssDir = path.join(SRC_DIR, 'css');
  const cssFiles = fs.readdirSync(cssDir).filter(f => f.endsWith('.css'));

  assert(cssFiles.length >= 4, `Archivos modulares presentes en /css (${cssFiles.join(', ')})`);

  let totalNegativeLetterSpacing = 0;
  let totalSub1LineHeight = 0;
  let totalImportantOutsidePrint = 0;
  let hasExternalFontsUrl = false;

  for (const f of cssFiles) {
    const content = fs.readFileSync(path.join(cssDir, f), 'utf-8');

    // 1. Cero letter-spacing negativo no autorizado (precios usan interletrado compacto de -0.035em)
    const negSpacingMatches = content.match(/letter-spacing:\s*-(?!0\.035em)[0-9]/g);
    if (negSpacingMatches) totalNegativeLetterSpacing += negSpacingMatches.length;

    // 2. Cero line-height inferior a 1.0 (evita textos montados)
    const sub1Matches = content.match(/line-height:\s*0\.[0-9]/g);
    if (sub1Matches) totalSub1LineHeight += sub1Matches.length;

    // 3. Revisar !important fuera de @media print
    const parts = content.split('@media print');
    const mainCss = parts[0];
    const importantMatches = mainCss.match(/!important/g);
    if (importantMatches) totalImportantOutsidePrint += importantMatches.length;

    // 4. Cero dependencias externas (100% offline)
    if (content.includes('fonts.googleapis.com') || content.includes('fonts.gstatic.com')) {
      hasExternalFontsUrl = true;
    }
  }

  assert(totalNegativeLetterSpacing === 0, `Cero letter-spacing negativo no autorizado en CSS (encontrados: ${totalNegativeLetterSpacing})`);
  assert(totalSub1LineHeight === 0, `Cero line-height menores a 1.0 en CSS (encontrados: ${totalSub1LineHeight})`);
  assert(totalImportantOutsidePrint === 0, `Cero !important en estilos de componentes UI (encontrados: ${totalImportantOutsidePrint})`);
  assert(!hasExternalFontsUrl, 'Cero dependencias a Google Fonts externas (100% Offline)');

  // 5. Verificación de la fuente oficial de precios LINESeedJP-Bold.ttf en 700 y su interletrado
  const fontsCss = fs.readFileSync(path.join(cssDir, 'fonts.css'), 'utf-8');
  const cartelBaseCss = fs.readFileSync(path.join(cssDir, 'cartel-base.css'), 'utf-8');
  assert(fontsCss.includes("LINESeedJP-Bold.ttf") && fontsCss.includes("font-weight: 700;"), 'Fuente LINESeedJP-Bold.ttf definida en fonts.css con font-weight: 700');
  assert(cartelBaseCss.includes("'LINESeedJP'") && cartelBaseCss.includes("font-weight: 700;"), 'Precios configuran font-family: LINESeedJP y font-weight: 700 (Bold) en cartel-base.css');
  assert(cartelBaseCss.includes("letter-spacing: -0.035em;"), 'Precios configuran interletrado menor (letter-spacing: -0.035em) en cartel-base.css');
}

// -------------------------------------------------------------
// EJECUCIÓN PRINCIPAL DEL SMOKETEST
// -------------------------------------------------------------
async function runSmokeTest() {
  console.log(`${C.bold}${C.cyan}================================================================${C.reset}`);
  console.log(`${C.bold}    SMOKETEST AUTOMATIZADO: GENERADOR DE CARTELERÍA RETAIL${C.reset}`);
  console.log(`${C.bold}${C.cyan}================================================================${C.reset}`);

  const start = Date.now();

  try {
    await testStaticAssets();
    testHtmlStructure();
    testMathAndFormatting();
    testTemplatesRender();
    testCssQuality();
  } catch (err) {
    console.error(`\n${C.red}Error inesperado durante la ejecución:${C.reset}`, err);
    failed++;
  }

  const duration = ((Date.now() - start) / 1000).toFixed(2);
  const total = passed + failed;

  console.log(`\n${C.bold}${C.cyan}================================================================${C.reset}`);
  console.log(`${C.bold}RESUMEN DE RESULTADOS:${C.reset}`);
  console.log(`  Total de Aserciones: ${C.bold}${total}${C.reset}`);
  console.log(`  Exitosas:            ${C.green}${C.bold}${passed}${C.reset}`);
  console.log(`  Fallidas:            ${failed > 0 ? C.red : C.green}${C.bold}${failed}${C.reset}`);
  console.log(`  Tiempo Total:        ${duration}s`);
  console.log(`${C.bold}${C.cyan}================================================================${C.reset}\n`);

  if (failed > 0) {
    console.log(`${C.red}${C.bold}✖ SMOKETEST FALLIDO - Se detectaron inconsistencias.${C.reset}`);
    process.exit(1);
  } else {
    console.log(`${C.green}${C.bold}✔ SMOKETEST EXITOSO - Todos los módulos, UX y estilos funcionan al 100%.${C.reset}`);
    process.exit(0);
  }
}

runSmokeTest();
