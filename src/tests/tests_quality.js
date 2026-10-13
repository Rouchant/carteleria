/**
 * Suite de Pruebas Unitarias y Auditoría de Puntuación de Calidad
 * Generador de Cartelería Retail Falabella
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Configuración de colores ANSI
const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  white: '\x1b[37m'
};

const stats = {
  total: 0,
  passed: 0,
  failed: 0,
  categories: {
    unitUtils: { passed: 0, total: 0, weight: 25 },
    unitCalculator: { passed: 0, total: 0, weight: 20 },
    unitTemplates: { passed: 0, total: 0, weight: 30 },
    cssTypography: { passed: 0, total: 0, weight: 15 },
    resilienceUX: { passed: 0, total: 0, weight: 10 }
  }
};

let currentCategory = 'unitUtils';

function test(name, fn) {
  stats.total++;
  stats.categories[currentCategory].total++;
  try {
    fn();
    stats.passed++;
    stats.categories[currentCategory].passed++;
    console.log(`  ${C.green}✔${C.reset} ${name}`);
  } catch (err) {
    stats.failed++;
    console.log(`  ${C.red}✖ ${name}${C.reset}`);
    console.log(`    ${C.dim}${err.message}${C.reset}`);
  }
}

function expect(actual) {
  return {
    toBe(expected) {
      if (actual !== expected) {
        throw new Error(`Esperado: ${JSON.stringify(expected)} | Obtenido: ${JSON.stringify(actual)}`);
      }
    },
    toEqual(expected) {
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`Esperado: ${JSON.stringify(expected)} | Obtenido: ${JSON.stringify(actual)}`);
      }
    },
    toBeGreaterThan(expected) {
      if (!(actual > expected)) {
        throw new Error(`Esperado > ${expected} | Obtenido: ${actual}`);
      }
    },
    toContain(expected) {
      if (typeof actual === 'string' && !actual.includes(expected)) {
        throw new Error(`Se esperaba que contuviera: "${expected}"`);
      } else if (Array.isArray(actual) && !actual.includes(expected)) {
        throw new Error(`Se esperaba que el array contuviera: ${JSON.stringify(expected)}`);
      }
    },
    notToContain(expected) {
      if (typeof actual === 'string' && actual.includes(expected)) {
        throw new Error(`NO se esperaba que contuviera: "${expected}"`);
      }
    },
    toBeNull() {
      if (actual !== null) {
        throw new Error(`Esperado null | Obtenido: ${actual}`);
      }
    },
    toBeTruthy() {
      if (!actual) {
        throw new Error(`Esperado valor verídico | Obtenido: ${actual}`);
      }
    }
  };
}

// Mock DOM
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
  querySelector() { return null; }
  querySelectorAll() { return []; }
}

// Cargar códigos en contexto VM
const ROOT_DIR = path.resolve(__dirname, '..', '..');
const SRC_DIR = path.resolve(__dirname, '..');
const utilsCode = fs.readFileSync(path.join(SRC_DIR, 'js/utils.js'), 'utf-8');
const calcCode = fs.readFileSync(path.join(SRC_DIR, 'js/calculator.js'), 'utf-8');
const tplCode = fs.readFileSync(path.join(SRC_DIR, 'js/templates.js'), 'utf-8');
const stateCode = fs.readFileSync(path.join(SRC_DIR, 'js/state.js'), 'utf-8');
const exportCode = fs.readFileSync(path.join(SRC_DIR, 'js/export.js'), 'utf-8');

const ctx = {
  console,
  Math,
  Date,
  String,
  RegExp,
  document: {
    createElement: (tag) => new MockElement(tag)
  },
  showToast: () => {}
};
vm.createContext(ctx);
vm.runInContext(utilsCode, ctx);
vm.runInContext(calcCode, ctx);
vm.runInContext(stateCode, ctx);
vm.runInContext(tplCode, ctx);

console.log(`\n${C.bold}${C.cyan}================================================================${C.reset}`);
console.log(`${C.bold}${C.cyan}  SUITE DE PRUEBAS UNITARIAS & AUDITORÍA DE CALIDAD RETAIL      ${C.reset}`);
console.log(`${C.bold}${C.cyan}================================================================${C.reset}`);

// -------------------------------------------------------------
// 1. PRUEBAS UNITARIAS: Módulo utils.js
// -------------------------------------------------------------
currentCategory = 'unitUtils';
console.log(`\n${C.bold}${C.yellow}--- [1] Pruebas Unitarias: Formateo y Fechas (utils.js) ---${C.reset}`);

test('formatCLP formatea enteros con separador de miles y signo peso', () => {
  expect(ctx.formatCLP(639990)).toBe('$639.990');
  expect(ctx.formatCLP(1099990)).toBe('$1.099.990');
  expect(ctx.formatCLP(5000)).toBe('$5.000');
});

test('formatCLP maneja 0 correctamente', () => {
  expect(ctx.formatCLP(0)).toBe('$0');
});

test('formatCLP retorna cadena vacía ante null o undefined', () => {
  expect(ctx.formatCLP(null)).toBe('');
  expect(ctx.formatCLP(undefined)).toBe('');
  expect(ctx.formatCLP('')).toBe('');
});

test('parseCLP extrae el valor entero de strings con formato chileno', () => {
  expect(ctx.parseCLP('$639.990')).toBe(639990);
  expect(ctx.parseCLP('$ 1.499.990')).toBe(1499990);
  expect(ctx.parseCLP('9990')).toBe(9990);
});

test('parseCLP retorna null ante entradas vacías o inválidas', () => {
  expect(ctx.parseCLP('')).toBeNull();
  expect(ctx.parseCLP('abc')).toBeNull();
  expect(ctx.parseCLP(null)).toBeNull();
});

test('formatDateChile convierte formato ISO YYYY-MM-DD a DD/MM/YYYY', () => {
  expect(ctx.formatDateChile('2026-10-06')).toBe('06/10/2026');
  expect(ctx.formatDateChile('2026-10-12')).toBe('12/10/2026');
});

test('escapeHTML neutraliza caracteres especiales XSS', () => {
  expect(ctx.escapeHTML('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
  expect(ctx.escapeHTML('HP & ASUS > LENOVO')).toBe('HP &amp; ASUS &gt; LENOVO');
});

test('getSemanaVigenteActual: En Martes (inicio campaña) desde es hoy y hasta el próximo lunes', () => {
  const mar = ctx.getSemanaVigenteActual(new Date('2026-10-06T10:00:00')); // Martes 6
  expect(mar.desde).toBe('2026-10-06');
  expect(mar.hasta).toBe('2026-10-12');
});

test('getSemanaVigenteActual: En Miércoles desde es el martes de ayer y hasta el próximo lunes', () => {
  const mie = ctx.getSemanaVigenteActual(new Date('2026-10-07T12:00:00')); // Miércoles 7
  expect(mie.desde).toBe('2026-10-06');
  expect(mie.hasta).toBe('2026-10-12');
});

test('getSemanaVigenteActual: En Domingo desde es el martes previo y hasta mañana lunes', () => {
  const dom = ctx.getSemanaVigenteActual(new Date('2026-10-11T18:00:00')); // Domingo 11
  expect(dom.desde).toBe('2026-10-06');
  expect(dom.hasta).toBe('2026-10-12');
});

test('getSemanaVigenteActual: En Lunes (último día) desde es el martes previo y hasta hoy lunes', () => {
  const lun = ctx.getSemanaVigenteActual(new Date('2026-10-12T09:00:00')); // Lunes 12
  expect(lun.desde).toBe('2026-10-06');
  expect(lun.hasta).toBe('2026-10-12');
});

test('getSemanaVigenteActual: Al cambiar a Martes 13 arranca nuevo ciclo hasta Lunes 19', () => {
  const nextMar = ctx.getSemanaVigenteActual(new Date('2026-10-13T00:01:00')); // Martes 13
  expect(nextMar.desde).toBe('2026-10-13');
  expect(nextMar.hasta).toBe('2026-10-19');
});

// -------------------------------------------------------------
// 2. PRUEBAS UNITARIAS: Módulo calculator.js
// -------------------------------------------------------------
currentCategory = 'unitCalculator';
console.log(`\n${C.bold}${C.yellow}--- [2] Pruebas Unitarias: Cálculos Financieros CMR (calculator.js) ---${C.reset}`);

test('calcularFinanciamiento genera cuota y CTC oficiales para monto retail', () => {
  const fin1 = ctx.calcularFinanciamiento(639990, 39.93);
  expect(fin1.cuota).toBe(64826);
  expect(fin1.ctc).toBe(782981);

  const fin2 = ctx.calcularFinanciamiento(1499990, 39.93);
  expect(fin2.cuota).toBe(151938);
  expect(fin2.ctc).toBe(1835136);
});

test('calcularFinanciamiento responde cuota 0 y ctc 0 ante capital nulo o menor o igual a cero', () => {
  expect(ctx.calcularFinanciamiento(0, 39.93).cuota).toBe(0);
  expect(ctx.calcularFinanciamiento(null, 39.93).cuota).toBe(0);
  expect(ctx.calcularFinanciamiento(-500, 39.93).cuota).toBe(0);
});

test('calcularCTC devuelve Costo Total del Crédito mayor al capital financiado', () => {
  const fin = ctx.calcularFinanciamiento(1000000, 39.93);
  expect(fin.ctc).toBeGreaterThan(1000000);
});

test('calcularFinanciamiento ajusta cuota según variación del CAE', () => {
  const finBase = ctx.calcularFinanciamiento(639990, 39.93);
  const finMayorCAE = ctx.calcularFinanciamiento(639990, 50.0);
  expect(finMayorCAE.cuota).toBeGreaterThan(finBase.cuota);
});

// -------------------------------------------------------------
// 3. PRUEBAS UNITARIAS: Renderizado de Plantillas (templates.js)
// -------------------------------------------------------------
currentCategory = 'unitTemplates';
console.log(`\n${C.bold}${C.yellow}--- [3] Pruebas Unitarias: Renderizado de Plantillas (templates.js) ---${C.reset}`);

const baseCtxMock = {
  hasCmr: true,
  hasOferta: true,
  hasNormal: true,
  vigenciaStr: 'VIGENCIA: 06/10/2026 A 12/10/2026',
  financiamiento: { cuota: 64826, ctc: 782981 }
};

test('renderVerticalTemplate (P_118) renderiza tri-precio con badges y QR', () => {
  const sheet = new MockElement('div');
  ctx.renderVerticalTemplate(sheet, 'p118', baseCtxMock);
  expect(sheet.innerHTML).toContain('P_118');
  expect(sheet.innerHTML).toContain('$999.990');
  expect(sheet.innerHTML).toContain('OTRO MEDIO DE PAGO');
  expect(sheet.innerHTML).toContain('PRECIO NORMAL');
  expect(sheet.innerHTML).notToContain('NaN');
  expect(sheet.innerHTML).notToContain('undefined');
});

test('renderVerticalTemplate (P_132 - 13x19) incluye logo Fpuntos e info CMF', () => {
  const sheet = new MockElement('div');
  ctx.renderVerticalTemplate(sheet, 'p132', baseCtxMock);
  expect(sheet.innerHTML).toContain('P_132');
  expect(sheet.innerHTML).toContain('fpuntos-badge');
  expect(sheet.innerHTML).toContain('infocmf.png');
});

test('render9x7 en modo Tri-precio genera estructura idéntica a muestra oficial (P_121)', () => {
  const sheet = new MockElement('div');
  ctx.render9x7(sheet, baseCtxMock);
  expect(sheet.innerHTML).toContain('P_121');
  expect(sheet.innerHTML).toContain('oportunidadunica.png');
  expect(sheet.innerHTML).toContain('cmr.png');
  expect(sheet.innerHTML).toContain('$999.990');
  expect(sheet.innerHTML).toContain('OTRO MEDIO DE PAGO');
  expect(sheet.innerHTML).toContain('PRECIO NORMAL');
  expect(sheet.classList.contains('tri-price')).toBeTruthy();
});

test('render9x7 sin CMR renderiza código P_130 con PRECIO OFERTA principal', () => {
  const sheet = new MockElement('div');
  const sinCmrCtx = { ...baseCtxMock, hasCmr: false };
  ctx.render9x7(sheet, sinCmrCtx);
  expect(sheet.innerHTML).toContain('P_130');
  expect(sheet.innerHTML).toContain('PRECIO OFERTA');
  expect(sheet.innerHTML).toContain('PRECIO NORMAL');
});

test('render12x3 incluye etiqueta PRECIO OFERTA en rojo cuando no hay CMR', () => {
  const sheet = new MockElement('div');
  const sinCmrCtx = { ...baseCtxMock, hasCmr: false };
  ctx.render12x3(sheet, sinCmrCtx);
  expect(sheet.innerHTML).toContain('price-oferta-main-label');
  expect(sheet.innerHTML).toContain('PRECIO OFERTA:');
  expect(sheet.innerHTML).toContain('$999.990');
  expect(sheet.innerHTML).toContain('PRECIO NORMAL:');
});

test('render6x4 individual y hoja carta 18x generan celdas completas', () => {
  const sheet6x4 = new MockElement('div');
  ctx.render6x4(sheet6x4, baseCtxMock);
  expect(sheet6x4.innerHTML).toContain('OTRO MEDIO');
  expect(sheet6x4.innerHTML).toContain('PRECIO NORMAL');

  const sheetGrid = new MockElement('div');
  ctx.render6x4Sheet(sheetGrid, baseCtxMock);
  expect(sheetGrid.innerHTML).toContain('sheet-6x4-grid');
  expect(sheetGrid.innerHTML).toContain('grid-cell-label');
});

// -------------------------------------------------------------
// 4. AUDITORÍA CSS: Tipografía y Kerning
// -------------------------------------------------------------
currentCategory = 'cssTypography';
console.log(`\n${C.bold}${C.yellow}--- [4] Auditoría CSS: Calidad Tipográfica y Reglas Retail ---${C.reset}`);

const cartelCss = fs.readFileSync(path.join(SRC_DIR, 'css/cartel-templates.css'), 'utf-8');
const baseCss = fs.readFileSync(path.join(SRC_DIR, 'css/cartel-base.css'), 'utf-8');
const fontsCss = fs.readFileSync(path.join(SRC_DIR, 'css/fonts.css'), 'utf-8');

test('Interletrado compacto en números de precios (letter-spacing menor)', () => {
  expect(baseCss).toContain('letter-spacing: -0.035em;');
  const unapprovedNegSpacing = (cartelCss + baseCss).match(/letter-spacing:\s*-(?!0\.035em)[0-9]/gi);
  expect(unapprovedNegSpacing).toBeNull();
});

test('Cero line-height menor a 1.0 (evita corte de ascendentes/descendentes)', () => {
  const match = (cartelCss + baseCss).match(/line-height:\s*0\.[0-9]+/gi);
  expect(match).toBeNull();
});

test('Fuentes corporativas LINESeedJP y Lato definidas con archivos locales ttf', () => {
  expect(fontsCss).toContain("font-family: 'LINESeedJP'");
  expect(fontsCss).toContain("font-family: 'Lato'");
  expect(fontsCss).toContain('font/LINESeedJP-Bold.ttf');
  expect(fontsCss).notToContain('fonts.googleapis.com');
  expect(fontsCss).notToContain('fonts.gstatic.com');
});

test('Clase .t-12x3 .price-oferta-main-label tiene color rojo #df0024', () => {
  const match = cartelCss.match(/\.t-12x3\s+\.price-oferta-main-label\s*\{[^}]*color:\s*#df0024/i);
  expect(match !== null).toBeTruthy();
});

test('Texto de vigencia y fechas (.vigencia-text) tiene color #212121 y font-weight 400', () => {
  const matchBase = baseCss.match(/\.vigencia-text\s*\{[^}]*font-weight:\s*400;[^}]*color:\s*#212121;/i);
  expect(matchBase !== null).toBeTruthy();
});

// -------------------------------------------------------------
// 5. RESILIENCIA, UX Y DOM (index.html & export.js)
// -------------------------------------------------------------
currentCategory = 'resilienceUX';
console.log(`\n${C.bold}${C.yellow}--- [5] Resiliencia y UX: DOM & Exportación ---${C.reset}`);

const indexHtml = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf-8');

test('Botones de Ejemplos Rápidos NO contienen códigos entre paréntesis', () => {
  expect(indexHtml).toContain('>Oportunidad Única</button>');
  expect(indexHtml).toContain('>Todo Medio de Pago</button>');
  expect(indexHtml).toContain('>Solo Precio Normal</button>');
  expect(indexHtml).toContain('>Limpiar</button>');
  expect(indexHtml).notToContain('Oportunidad Única (P_118)');
  expect(indexHtml).notToContain('Todo Medio de Pago (P_141)');
  expect(indexHtml).notToContain('Solo Precio Normal (P_156)');
});

test('Las 8 plantillas en index.html siguen el orden seleccionado por el usuario', () => {
  const tplMatches = [...indexHtml.matchAll(/data-template="([^"]+)"/g)].map(m => m[1]);
  const expectedOrder = ['p118', 'p132', 't-9x13', 't-9x7', 't-6x4', 't-12x3', 't-6x4-sheet', 't-15x21'];
  expect(tplMatches).toEqual(expectedOrder);
});

test('exportToPDF en export.js tiene bloque finally protegido con clearTimeout y reactivación inmediata', () => {
  expect(exportCode).toContain('clearTimeout(safetyTimer)');
  expect(exportCode).toContain('btn.disabled = false');
  expect(exportCode).toContain('btn.innerHTML = originalText');
  expect(exportCode).toContain('const safetyTimer = setTimeout');
});

test('Línea gris de corte configurada exclusivamente en @media print para formatos menores', () => {
  expect(baseCss).toContain('.cartel-sheet:not(.p118):not(.t-6x4-sheet):not(.sheet-6x4)::after');
  expect(baseCss).toContain('border: 1px dashed #888888 !important;');
  expect(baseCss).toContain('margin: 0 !important;');
  expect(exportCode).toContain('noCutStyle.textContent = \'.cartel-sheet::after, .cartel-sheet::before { display: none !important;');
});

// -------------------------------------------------------------
// CÁLCULO DE PUNTUACIÓN DE CALIDAD
// -------------------------------------------------------------
console.log(`\n${C.bold}${C.cyan}================================================================${C.reset}`);
console.log(`${C.bold}${C.cyan}                  PUNTUACIÓN DE CALIDAD                         ${C.reset}`);
console.log(`${C.bold}${C.cyan}================================================================${C.reset}`);

let weightedScore = 0;
const catNames = {
  unitUtils: 'Módulo de Utilidades & Fechas (utils.js)',
  unitCalculator: 'Algoritmo Financiero CMR (calculator.js)',
  unitTemplates: 'Renderizado de Plantillas (templates.js)',
  cssTypography: 'Calidad CSS, Tipografía y Estilos Retail',
  resilienceUX: 'Resiliencia, UX y Estructura DOM'
};

for (const [key, cat] of Object.entries(stats.categories)) {
  const catScore = cat.total > 0 ? (cat.passed / cat.total) * 100 : 100;
  const contrib = (catScore * cat.weight) / 100;
  weightedScore += contrib;
  const bar = '█'.repeat(Math.round(catScore / 5)) + '░'.repeat(20 - Math.round(catScore / 5));
  console.log(`  ${catNames[key].padEnd(44)}: ${C.bold}${C.green}${catScore.toFixed(0)}%${C.reset} [${bar}] (${cat.passed}/${cat.total})`);
}

const finalGrade = weightedScore >= 95 ? 'A+ (Excelente / Producción)' : weightedScore >= 85 ? 'A (Muy Bueno)' : 'B (Requiere Atención)';

console.log(`${C.bold}${C.cyan}----------------------------------------------------------------${C.reset}`);
console.log(`  ${C.bold}Total de Aserciones :${C.reset} ${stats.total}`);
console.log(`  ${C.bold}Aserciones Exitosas :${C.reset} ${C.green}${stats.passed}${C.reset}`);
console.log(`  ${C.bold}Aserciones Fallidas :${C.reset} ${stats.failed === 0 ? C.green + '0' : C.red + stats.failed}${C.reset}`);
console.log(`  ${C.bold}Puntuación Global   :${C.reset} ${C.bold}${C.green}${weightedScore.toFixed(1)} / 100${C.reset}`);
console.log(`  ${C.bold}Dictamen de Calidad :${C.reset} ${C.bold}${C.green}${finalGrade}${C.reset}`);
console.log(`${C.bold}${C.cyan}================================================================\n${C.reset}`);

if (stats.failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
