/**
 * Módulo extractor de datos de producto Falabella por SKU
 * Arquitectura de Doble Capa:
 *   1. Capa Rápida Directa (Browse API v3): Ultrarrápida (~200ms), sin overhead de navegador.
 *   2. Capa Headless Fallback: Chrome/Edge con bypass de bot e inspección de __NEXT_DATA__.
 */

const { execFile } = require('child_process');
const https = require('https');
const fs = require('fs');

// Rutas habituales de navegadores en Windows y entornos compatibles
const BROWSER_PATHS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium-browser'
];

function findBrowserPath() {
  for (const p of BROWSER_PATHS) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

/**
 * Sanitización Regex: Extrae secuencia numérica de 6+ dígitos desde:
 * - SKU puro (ej: 80758852)
 * - URL completa de producto (ej: https://www.falabella.com/falabella-cl/product/80758852/...)
 * - Texto con texto adicional (ej: "Producto SKU: 80758852 (en tienda)")
 */
function extractSkuFromInput(raw) {
  if (!raw) return null;
  const str = String(raw).trim();

  // 1. Si contiene /product/<id>/
  const urlMatch = str.match(/\/product\/(\d{6,})/i);
  if (urlMatch) return urlMatch[1];

  // 2. Si contiene prefijos como 'SKU: 80758852' o 'código: 80758852'
  const prefixMatch = str.match(/(?:sku|c[oó]digo|id|prod(?:ucto)?)[^\d]*(\d{6,})/i);
  if (prefixMatch) return prefixMatch[1];

  // 3. Cualquier secuencia numérica continua de 6 o más dígitos
  const match = str.match(/(\d{6,})/);
  return match ? match[1] : null;
}

/**
 * Formatea un número o cadena a formato numérico puro
 */
function parseNumericPrice(val) {
  if (val === null || val === undefined) return null;
  const clean = String(val).replace(/\D/g, '');
  if (!clean) return null;
  const n = parseInt(clean, 10);
  return isNaN(n) ? null : n;
}

/**
 * Formatea un número o cadena a formato CLP (ej. 869990 -> "$869.990")
 */
function formatCLP(val) {
  const n = parseNumericPrice(val);
  if (n === null) return '';
  return '$' + n.toLocaleString('es-CL');
}

/**
 * Convierte fecha DD/MM/AAAA a AAAA-MM-DD para inputs type="date"
 */
function parseDateToIso(str) {
  if (!str) return null;
  const match = str.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (match) {
    const [, d, m, y] = match;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return null;
}

/**
 * Extrae la categoría comercial del producto Falabella analizando:
 * 1. Mapeo prioritario de Línea Blanca / Electrohogar por título comercial oficial
 * 2. Atributo 'Tipo' exacto válido (ej. 'Notebook Gamer', 'Parlante Bluetooth')
 * 3. Atributos con IDs técnicos de clasificación Falabella (_tipo_de_*)
 * 4. Nombres alternativos por departamento ('Auricular', etc.)
 * 5. Atributos destacados (topSpecifications)
 * 6. Patrones de tecnología y audio en el título comercial
 * 7. Árbol de categorías / taxonomía si viene en la respuesta
 */
function extractCategoryFromProduct(product, marca, nombre) {
  if (!product) return 'General';
  let title = (nombre || product.displayName || product.name || '').trim();
  if (marca && title.toUpperCase().startsWith(marca)) {
    title = title.substring(marca.length).trim();
  }

  const specs = product.attributes?.specifications || [];
  const topSpecs = product.attributes?.topSpecifications || [];

  // 1. PRIORIDAD MÁXIMA: Especificación 'Tipo' explícita válida (ej. 'Notebook', 'Notebook Gamer', 'Parlante Bluetooth')
  const exactTipo = specs.find(s => s.name && s.name.trim().toLowerCase() === 'tipo' && !/pantalla|carga|gpu|bateria/i.test(s.name));
  if (exactTipo && exactTipo.value && !/indicadores|led|superior|frontal/i.test(exactTipo.value)) {
    const val = exactTipo.value.trim();
    if (!/^otros?\s*accesorios?$/i.test(val)) {
      if (/^notebook$/i.test(val)) return 'Notebooks';
      return val;
    }
  }

  // 2. Especificación técnica de ID Falabella (_tipo_de_*)
  const idTipo = specs.find(s => s.id && /_tipo_de_(portatil|auricular|altavoz|parlante|computador)/i.test(s.id));
  if (idTipo && idTipo.value) {
    const val = idTipo.value.trim();
    if (!/^otros?\s*accesorios?$/i.test(val)) {
      if (/^notebook$/i.test(val)) return 'Notebooks';
      return val;
    }
  }

  if (specs.some(s => s.id && /_tipo_de_mouse/i.test(s.id))) {
    return 'Mouse';
  }

  // 3. Nombres alternativos por departamento y topSpecifications
  const nameTipo = specs.find(s => /^(auricular|tipo de producto|tipo de auricular|tipo de altavoz)/i.test(s.name || ''));
  if (nameTipo && nameTipo.value && !/^otros?\s*accesorios?$/i.test(nameTipo.value.trim())) return nameTipo.value.trim();

  const topTipo = topSpecs.find(s => /^(tipo|auricular)/i.test(s.name || '') && !/carga|pantalla/i.test(s.name));
  if (topTipo && topTipo.value && !/superior|frontal|led/i.test(topTipo.value)) {
    const val = topTipo.value.trim();
    if (!/^otros?\s*accesorios?$/i.test(val)) {
      if (/^notebook$/i.test(val)) return 'Notebooks';
      return val;
    }
  }

  // 4. Mapeo de Línea Blanca / Electrohogar y Periféricos por título comercial oficial si no vino en 'Tipo'
  const priorityKeywords = [
    // Periféricos y accesorios de computación
    { regex: /^mouse\s*pad/i, cat: 'Mousepad' },
    { regex: /^mouse\s*(?:gamer)?/i, cat: (m) => /gamer/i.test(m[0]) ? 'Mouse Gamer' : 'Mouse' },
    { regex: /^teclado\s*(?:gamer)?/i, cat: (m) => /gamer/i.test(m[0]) ? 'Teclado Gamer' : 'Teclados' },
    { regex: /^monitor\s*(?:gamer)?/i, cat: (m) => /gamer/i.test(m[0]) ? 'Monitor Gamer' : 'Monitores' },
    { regex: /^impresora|multifuncional/i, cat: 'Impresoras' },
    { regex: /^webcam|c[áa]mara\s*web/i, cat: 'Cámaras Web' },
    { regex: /^(?:disco\s*(?:duro|externo|solido|s[oó]lido)|ssd)\b/i, cat: 'Almacenamiento' },
    { regex: /^pendrive|memoria\s*usb/i, cat: 'Pendrives' },
    { regex: /^tarjeta\s*de\s*memoria|micro\s*sd/i, cat: 'Tarjetas de Memoria' },
    { regex: /^router|repetidor|switch/i, cat: 'Conectividad y Redes' },
    { regex: /^silla\s*gamer/i, cat: 'Sillas Gamer' },
    { regex: /^mochila|funda\s*notebook|malet[íi]n/i, cat: 'Mochilas y Bolsos' },

    // Línea Blanca & Electrohogar
    { regex: /^lavadora\s*secadora/i, cat: 'Lavadoras Secadoras' },
    { regex: /^lavadora/i, cat: 'Lavadoras' },
    { regex: /^secadora/i, cat: 'Secadoras' },
    { regex: /^refrigerador/i, cat: 'Refrigeradores' },
    { regex: /^congelador|freezer/i, cat: 'Congeladores' },
    { regex: /^lavavajillas/i, cat: 'Lavavajillas' },
    { regex: /^cocina/i, cat: 'Cocinas' },
    { regex: /^microondas/i, cat: 'Microondas' },
    { regex: /^horno/i, cat: 'Hornos' },
    { regex: /^encimera/i, cat: 'Encimeras' },
    { regex: /^campana/i, cat: 'Campanas' },
    { regex: /^aspiradora/i, cat: 'Aspiradoras' },
    { regex: /^cafetera/i, cat: 'Cafeteras' },
    { regex: /^licuadora/i, cat: 'Licuadoras' },
    { regex: /^batidora/i, cat: 'Batidoras' },
    { regex: /^tostador/i, cat: 'Tostadoras' },
    { regex: /^hervidor/i, cat: 'Hervidores' },
    { regex: /^freidora|air\s*fryer/i, cat: 'Freidoras de Aire' },
    { regex: /^aire\s*acondicionado/i, cat: 'Aire Acondicionado' },
    { regex: /^estufa|calefactor/i, cat: 'Calefacción' },
    { regex: /^ventilador/i, cat: 'Ventiladores' },
    { regex: /^bicicleta/i, cat: 'Bicicletas' },
    { regex: /^scooter/i, cat: 'Scooters' },
    { regex: /^consola/i, cat: 'Consolas' }
  ];

  for (const item of priorityKeywords) {
    const m = title.match(item.regex);
    if (m) {
      return typeof item.cat === 'function' ? item.cat(m) : item.cat;
    }
  }

  // 5. Patrones adicionales de tecnología y audio en el título comercial
  const techPatterns = [
    { regex: /^(aud[íi]fonos?\s*(?:in-ear|over-ear|on-ear|true wireless|gamer|bluetooth)?)/i, cat: (m) => m[1].replace(/\b\w/g, c => c.toUpperCase()) },
    { regex: /^(parlante\s*(?:bluetooth|port[áa]til|torre)?)/i, cat: (m) => m[1].replace(/\b\w/g, c => c.toUpperCase()) },
    { regex: /^(smart\s*tv|televisor)/i, cat: () => 'Smart TV' },
    { regex: /^(notebook\s*(?:gamer)?|laptop)/i, cat: () => 'Notebooks' },
    { regex: /^(smartphone|celular|tel[ée]fono)/i, cat: () => 'Smartphones' },
    { regex: /^(tablet|ipad)/i, cat: () => 'Tablets' },
    { regex: /^(smartwatch|reloj inteligente)/i, cat: () => 'Smartwatches' }
  ];

  for (const tp of techPatterns) {
    const m = title.match(tp.regex);
    if (m) return tp.cat(m);
  }

  // 6. Taxonomía de categorías o breadCrumb de Falabella si existe
  if (product.categories && product.categories.length > 0) {
    const lastCat = product.categories[product.categories.length - 1];
    if (lastCat && lastCat.name) return lastCat.name.trim();
  }
  if (product.breadCrumb && product.breadCrumb.length > 0) {
    const rootBread = product.breadCrumb.find(b => b.isRoot && b.label)?.label;
    if (rootBread) return rootBread.trim();
    if (product.breadCrumb[0]?.label) return product.breadCrumb[0].label.trim();
  }

  return 'General';
}

/**
 * Parseo y Asignación de Precios normalizado desde cualquier fuente (Browse API o __NEXT_DATA__)
 */
function parseProductData(product, targetSku) {
  if (!product) {
    throw new Error('Estructura de producto no encontrada o vacía');
  }

  // 1. Normalización de variantes: Selecciona la variante activa comparando d.primaryVariantId === variant.id o la primera
  const variants = product.variants || [];
  let variant = variants.find(v => String(v.id) === String(targetSku) || v.id === product.primaryVariantId) || variants[0] || {};

  // 2. Limpieza de strings numéricos y clasificación de precios
  let cmrPriceNum = null;
  let internetPriceNum = null;
  let normalPriceNum = null;
  let fechaVigencia = null;

  const pricesList = variant.prices || product.prices || [];
  for (const p of pricesList) {
    const type = (p.type || p.label || '').toLowerCase();
    const val = Array.isArray(p.price) ? p.price[0] : (p.price || p.formattedPrice);
    if (!val) continue;

    if (p.validity && !fechaVigencia) {
      fechaVigencia = parseDateToIso(p.validity);
    }

    if (type.includes('cmr') || type.includes('tarjeta') || (p.icons && String(p.icons).includes('cmr'))) {
      cmrPriceNum = parseNumericPrice(val);
    } else if (type.includes('internet') || type.includes('oferta') || type.includes('event')) {
      internetPriceNum = parseNumericPrice(val);
    } else if (type.includes('normal') || type.includes('referencia') || p.crossed) {
      normalPriceNum = parseNumericPrice(val);
    }
  }

  // Si solo hay un precio disponible en la lista
  if (!normalPriceNum && !internetPriceNum && !cmrPriceNum && pricesList.length > 0) {
    const p0 = pricesList[0];
    const val0 = Array.isArray(p0.price) ? p0.price[0] : p0.price;
    normalPriceNum = parseNumericPrice(val0);
  }

  // 3. Lógica de clasificación de tipo de precio:
  //    - Si existe cmrPrice -> 'ou' (Oportunidad Única)
  //    - Si existe internetPrice y es menor que normalPrice -> 'oferta'
  //    - En cualquier otro caso -> 'normal'
  let tipoPrecio = 'normal';
  if (cmrPriceNum) {
    tipoPrecio = 'ou';
  } else if (internetPriceNum && (!normalPriceNum || internetPriceNum < normalPriceNum)) {
    tipoPrecio = 'oferta';
  }

  const marca = (product.brandName || product.brand || '').trim().toUpperCase();
  const nombre = (product.displayName || product.name || '').trim();

  // 4. Extracción de Categoría y Modelo desde especificaciones
  const specs = product.attributes?.specifications || [];
  const categoria = extractCategoryFromProduct(product, marca, nombre);
  let modelo = '';

  const modelSpec = specs.find(s => /^(modelo|nombre comercial)/i.test(s.name || ''));
  const isMarketingText = (s) => !s || typeof s !== 'string' || s.length > 40 || s.includes('\n') || s.split(' ').length > 6 || /^[A-ZÁÉÍÓÚ\s,]{12,}/.test(s);

  // Deducción inteligente de modelo
  const isConsumable = /botella\s*de\s*tinta|cartucho|tinta\s*negra|tinta\s*color/i.test(nombre);

  if (isConsumable && nombre) {
    let cleanTitle = nombre;
    if (marca) {
      const rxMarca = new RegExp('\\b' + marca + '\\b', 'gi');
      cleanTitle = cleanTitle.replace(rxMarca, '').replace(/\s{2,}/g, ' ').trim();
    }
    modelo = cleanTitle;
  } else {
    if (modelSpec && modelSpec.value && !isMarketingText(modelSpec.value.trim())) {
      modelo = modelSpec.value.trim();
    } else if (product.model && !isMarketingText(String(product.model).trim())) {
      modelo = String(product.model).trim();
    }

    if (!modelo && nombre) {
      let cleanTitle = nombre;
      if (marca && cleanTitle.toUpperCase().startsWith(marca)) {
        cleanTitle = cleanTitle.substring(marca.length).trim();
      }
      // Si contiene comas separando especificaciones (ej: "Monitor Gaming OMEN 27”, Full HD, IPS...")
      const commaParts = cleanTitle.split(',');
      if (commaParts.length > 1 && commaParts[0].trim().split(' ').length >= 2) {
        modelo = commaParts[0].trim();
      } else {
        modelo = cleanTitle.split(' ').slice(0, 4).join(' ');
      }
    }
  }

  return {
    sku: String(targetSku).trim(),
    marca: marca || 'MARCA',
    categoria: categoria || 'General',
    modelo: modelo || '',
    nombre: nombre,
    precioCmr: formatCLP(cmrPriceNum),
    precioOferta: formatCLP(internetPriceNum),
    precioNormal: formatCLP(normalPriceNum),
    precioCmrNum: cmrPriceNum,
    precioOfertaNum: internetPriceNum,
    precioNormalNum: normalPriceNum,
    tipoPrecio: tipoPrecio,
    vigenciaHasta: fechaVigencia,
    url: `https://www.falabella.com/falabella-cl/product/${targetSku}/`
  };
}

/**
 * Wrapper de compatibilidad con pruebas unitarias de __NEXT_DATA__
 */
function parseProductFromNextData(nextData, targetSku) {
  const pageProps = nextData?.props?.pageProps;
  const product = pageProps?.productData;
  return parseProductData(product, targetSku);
}

/**
 * Consulta la API pública directa de Falabella (Browse API v3)
 * Endpoint: https://www.falabella.com/s/browse/v3/product/cl?site=falabella-cl&productId={sku}
 * Timeout: 9000 ms con AbortController
 */
function fetchProductFromBrowseApi(sku, timeoutMs = 9000) {
  return new Promise((resolve, reject) => {
    const url = `https://www.falabella.com/s/browse/v3/product/cl?site=falabella-cl&productId=${encodeURIComponent(sku)}`;
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*'
      },
      timeout: timeoutMs
    };

    const req = https.get(url, options, (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error(`API respondió con status ${res.statusCode}`));
      }

      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const productData = json.data || json;
          if (!productData || (!productData.variants && !productData.id)) {
            return reject(new Error('Estructura de producto no válida en API Browse'));
          }
          const parsed = parseProductData(productData, sku);
          resolve(parsed);
        } catch (err) {
          reject(err);
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Timeout de ${timeoutMs}ms al consultar API de Falabella`));
    });
  });
}

/**
 * Fallback secundario: Extracción vía Chrome/Edge headless
 */
async function scrapeWithHeadlessBrowser(sku) {
  const browserPath = findBrowserPath();
  if (!browserPath) {
    throw new Error('No se encontró un navegador compatible (Chrome/Edge) para fallback headless');
  }

  const url = `https://www.falabella.com/falabella-cl/product/${sku}/`;
  const args = [
    '--headless=new',
    '--disable-blink-features=AutomationControlled',
    '--disable-gpu',
    '--no-first-run',
    '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    '--dump-dom',
    url
  ];

  return new Promise((resolve, reject) => {
    execFile(browserPath, args, { maxBuffer: 25 * 1024 * 1024, timeout: 35000 }, (err, stdout, stderr) => {
      if (err) {
        return reject(new Error(`Fallo al consultar Falabella (${err.message})`));
      }

      const match = stdout.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
      if (!match) {
        if (stdout.includes('Cloudflare') || stdout.includes('Un momento…')) {
          return reject(new Error('Cloudflare bloqueó la petición temporalmente. Intente nuevamente.'));
        }
        return reject(new Error('No se encontraron datos del producto para este SKU en falabella.com'));
      }

      try {
        const nextData = JSON.parse(match[1]);
        const parsed = parseProductFromNextData(nextData, sku);
        resolve(parsed);
      } catch (parseError) {
        reject(new Error(`Error al procesar __NEXT_DATA__: ${parseError.message}`));
      }
    });
  });
}

/**
 * Orquestador principal de extracción con estrategia de Fallback automático
 */
async function scrapeFalabellaProduct(skuInput) {
  const cleanSku = extractSkuFromInput(skuInput);
  if (!cleanSku) {
    throw new Error('SKU o URL inválida. Ingrese un código numérico de al menos 6 dígitos.');
  }

  // Intento 1: API Directa Browse v3 (Alta velocidad: ~200ms)
  try {
    const directData = await fetchProductFromBrowseApi(cleanSku, 9000);
    return directData;
  } catch (apiErr) {
    console.warn(`[Scraper] API directa no disponible para SKU ${cleanSku} (${apiErr.message}). Activando fallback headless...`);
  }

  // Intento 2: Fallback Headless Browser (__NEXT_DATA__)
  return await scrapeWithHeadlessBrowser(cleanSku);
}

module.exports = {
  scrapeFalabellaProduct,
  fetchProductFromBrowseApi,
  scrapeWithHeadlessBrowser,
  parseProductData,
  parseProductFromNextData,
  extractSkuFromInput,
  formatCLP,
  parseNumericPrice,
  parseDateToIso,
  findBrowserPath
};
