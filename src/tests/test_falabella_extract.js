/**
 * Test unitario y de integración para la extracción de datos desde Falabella
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const {
  parseProductData,
  parseProductFromNextData,
  scrapeFalabellaProduct,
  formatCLP,
  parseDateToIso,
  findBrowserPath,
  extractSkuFromInput
} = require('../server/falabella-scraper');

const C = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function logPass(msg) {
  console.log(`  ${C.green}✔${C.reset} ${msg}`);
}

function logFail(msg, err) {
  console.log(`  ${C.red}✖ ${msg}${C.reset}`, err ? err.message : '');
}

async function runTests() {
  console.log(`${C.bold}${C.cyan}=== SUITE: Extracción de Productos Falabella por SKU ===${C.reset}\n`);
  let passed = 0;
  let total = 0;

  function test(name, fn) {
    total++;
    try {
      fn();
      passed++;
      logPass(name);
    } catch (e) {
      logFail(name, e);
    }
  }

  async function asyncTest(name, fn) {
    total++;
    try {
      await fn();
      passed++;
      logPass(name);
    } catch (e) {
      logFail(name, e);
    }
  }

  // 1. Detección de navegador
  test('Detectar ejecutable de Chrome o Edge en el sistema', () => {
    const browser = findBrowserPath();
    assert.ok(browser, 'Debe existir una ruta válida a Chrome o Edge');
    assert.ok(fs.existsSync(browser), `El archivo ${browser} debe existir`);
  });

  // 2. Formateador CLP
  test('Conversión y formato de valores numéricos a CLP', () => {
    assert.strictEqual(formatCLP('869990'), '$869.990');
    assert.strictEqual(formatCLP(1199990), '$1.199.990');
    assert.strictEqual(formatCLP('$889.990'), '$889.990');
    assert.strictEqual(formatCLP(''), '');
  });

  // 3. Conversión de fechas DD/MM/AAAA a ISO AAAA-MM-DD
  test('Conversión de fecha de vigencia a ISO', () => {
    assert.strictEqual(parseDateToIso('19/10/2026'), '2026-10-19');
    assert.strictEqual(parseDateToIso('05/11/2026'), '2026-11-05');
  });

  // 4. Parseo de estructura __NEXT_DATA__ con mock completo (similar a SKU 80758852)
  test('Parsear producto correctamente desde __NEXT_DATA__ mock', () => {
    const mockNextData = {
      props: {
        pageProps: {
          productData: {
            name: "ASUS TUF Gaming A15 FA506 AMD Ryzen 7 NVIDIA RTX 3050 16GB RAM 512GB",
            brandName: "ASUS",
            variants: [
              {
                id: "80758852",
                prices: [
                  { type: "cmrPrice", price: ["869.990"], validity: "25/10/2026" },
                  { type: "internetPrice", price: ["889.990"] },
                  { type: "normalPrice", price: ["1.199.990"], crossed: true }
                ]
              }
            ],
            attributes: {
              specifications: [
                { name: "Tipo", value: "Notebook Gamer" },
                { name: "Nombre comercial Portátiles", value: "TUF Gaming A15" }
              ]
            }
          }
        }
      }
    };

    const res = parseProductFromNextData(mockNextData, '80758852');
    assert.strictEqual(res.sku, '80758852');
    assert.strictEqual(res.marca, 'ASUS');
    assert.strictEqual(res.categoria, 'Notebook Gamer');
    assert.strictEqual(res.modelo, 'TUF Gaming A15');
    assert.strictEqual(res.precioCmr, '$869.990');
    assert.strictEqual(res.precioOferta, '$889.990');
    assert.strictEqual(res.precioNormal, '$1.199.990');
    assert.strictEqual(res.vigenciaHasta, '2026-10-25');
    assert.strictEqual(res.tipoPrecio, 'ou');
  });

  // 5. Sanitización Regex de SKU o URLs de Falabella
  test('Sanitización Regex dual: extracción de SKU desde código puro o URL completa', () => {
    // Casos solicitados por el usuario
    assert.strictEqual(extractSkuFromInput('80758852'), '80758852');
    assert.strictEqual(extractSkuFromInput('https://www.falabella.com/falabella-cl/product/80758852/Notebook-Gamer-TUF-A15'), '80758852');
    assert.strictEqual(extractSkuFromInput('Producto SKU: 80758852 (en tienda)'), '80758852');
    // Casos adicionales con parámetros y variaciones
    assert.strictEqual(extractSkuFromInput('https://www.falabella.com/falabella-cl/product/80149813/AUDIFONO?sid=9999999'), '80149813');
    assert.strictEqual(extractSkuFromInput('Código: 80677657 en bodega'), '80677657');
    assert.strictEqual(extractSkuFromInput('invalido'), null);
    assert.strictEqual(extractSkuFromInput(''), null);
  });

  // 6. Extracción robusta de Categorías (auriculares, parlantes, televisores, títulos)
  test('Reconocimiento automático multinivel de categorías', () => {
    // Caso 1: ID de atributo tipo de auricular Falabella
    const pAuricular = {
      displayName: 'Audífonos Bluetooth Galaxy Buds Core',
      brandName: 'SAMSUNG',
      attributes: {
        specifications: [{ id: '2173_tipo_de_auricular', name: 'Auricular', value: 'Audífonos In-ear' }]
      }
    };
    const r1 = parseProductData(pAuricular, '80530068');
    assert.strictEqual(r1.categoria, 'Audífonos In-ear');

    // Caso 2: ID de tipo de altavoz
    const pAltavoz = {
      displayName: 'JBL Parlante Bluetooth Clip 5',
      brandName: 'JBL',
      attributes: {
        specifications: [{ id: '2171_tipo_de_altavoz', name: 'Tipo', value: 'Parlante Bluetooth' }]
      }
    };
    const r2 = parseProductData(pAltavoz, '17188061');
    assert.strictEqual(r2.categoria, 'Parlante Bluetooth');

    // Caso 3: Inferencia desde título comercial cuando no hay atributos
    const pTitle = {
      displayName: 'LG Smart TV 55 Pulgadas 4K OLED',
      brandName: 'LG',
      attributes: { specifications: [] }
    };
    const r3 = parseProductData(pTitle, '99999999');
    assert.strictEqual(r3.categoria, 'Smart TV');

    // Caso 4: Línea blanca / Electrohogar (Lavadoras) descartando falsos positivos de pantalla
    const pLavadora = {
      name: 'Lavadora Automática Superior 9.5 Kg 9,5 Bzg Mademsa',
      brandName: 'MADEMSA',
      attributes: {
        specifications: [
          { id: '1865_tipo_de_pantalla', name: 'Tipo de pantalla', value: 'Indicadores luminosos' },
          { id: '1861_tipo_de_lavadora', name: 'Tipo de lavadora', value: 'Automática' },
          { id: '1846_tipo_de_carga', name: 'Tipo de carga', value: 'Superior' }
        ]
      }
    };
    const r4 = parseProductData(pLavadora, '16283186');
    assert.strictEqual(r4.categoria, 'Lavadoras');

    // Caso 5: Periféricos de computación (Mouse HP)
    const pMouse = {
      name: 'Mouse HP 400 Quiet Wireless',
      brandName: 'HP',
      attributes: {
        specifications: [
          { id: '5225_tipo_de_mouse', name: 'Tipo de Mouse', value: 'Estandárd' },
          { id: '4393_conectividad_del_mouse', name: 'Conectividad del mouse', value: 'Bluetooth' }
        ]
      }
    };
    const r5 = parseProductData(pMouse, '80677657');
    assert.strictEqual(r5.categoria, 'Mouse');
  });

  // 7. Integración en vivo con Falabella (SKU 80758852 y soporte URL)
  await asyncTest('Extracción real en vivo desde Falabella para URL o SKU 80758852', async () => {
    const data = await scrapeFalabellaProduct('https://www.falabella.com/falabella-cl/product/80758852/Notebook-Gamer');
    assert.strictEqual(data.sku, '80758852');
    assert.strictEqual(data.marca, 'ASUS');
    assert.ok(data.nombre.includes('TUF Gaming'), `Nombre debe incluir TUF Gaming, recibido: ${data.nombre}`);
    assert.ok(data.precioCmr, 'Debe haber extraído Precio CMR');
    assert.strictEqual(data.tipoPrecio, 'ou', 'Debe clasificar tipo de precio como ou al tener CMR');
    assert.ok(data.precioOferta || data.precioNormal, 'Debe haber extraído Precio Oferta o Normal');
    console.log(`     -> Datos extraídos en vivo: ${data.marca} | ${data.categoria} | CMR: ${data.precioCmr} | Oferta: ${data.precioOferta} | Normal: ${data.precioNormal}`);
  });

  console.log(`\n${C.bold}Resultado: ${passed}/${total} pruebas pasadas.${C.reset}\n`);
  if (passed !== total) {
    process.exit(1);
  }
}

if (require.main === module) {
  runTests();
}

module.exports = { runTests };
