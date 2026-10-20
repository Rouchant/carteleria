/**
 * Módulo: Procesamiento por Lotes y Autollenado por SKU
 * Generador de Cartelería Retail | Falabella
 *
 * Implementa la Especificación Técnica de Extracción y Reconocimiento de Precios:
 * 1. Entrada y Parseo del SKU (`buscarSku`):
 *    - Sanitización Regex `/(\d{6,})/` para admitir tanto SKU numérico como URLs completas de Falabella.
 * 2. Consumo de Red y Evasión CORS (`fetchProducto`):
 *    - Endpoint Base Browse API v3 / API local.
 *    - Mecanismo de concurrencia y fallback (Local Server -> Directo -> Proxies públicos).
 *    - Wrapper `fetchTimeout` con `AbortController` fijado en 9000 ms.
 * 3. Parseo y Asignación de Precios (`aplicarProducto`):
 *    - Normalización de variantes (`primaryVariantId === variant.id` o `variants[0]`).
 *    - Limpieza de dígitos con `/\D/g`.
 *    - Clasificación de tipo de precio: 'ou' (Oportunidad Única), 'oferta' o 'normal'.
 * 4. Motor de Procesamiento por Lote (`loadBatchSkus`):
 *    - Entrada masiva con regex global `/\d{6,}/g` desduplicado con `Set`.
 *    - Sincronización visual fluida mediante `requestAnimationFrame`.
 */

/**
 * 1. Sanitización Regex: Extrae secuencia numérica de 6+ dígitos desde:
 *    - SKU puro (ej: 80758852)
 *    - URL completa de producto (ej: https://www.falabella.com/falabella-cl/product/80758852/...)
 *    - Texto con texto adicional (ej: "Producto SKU: 80758852 (en tienda)")
 */
function buscarSku(raw) {
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
 * Wrapper de fetch con timeout y AbortController
 */
async function fetchTimeout(resource, options = {}) {
  const { timeout = 9000, ...fetchOptions } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(resource, {
      ...fetchOptions,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
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

  // 1. Mapeo prioritario de Línea Blanca / Electrohogar y Periféricos por título comercial oficial
  const priorityKeywords = [
    // Periféricos y accesorios de computación
    { regex: /^mouse\s*pad/i, cat: 'Mousepad' },
    { regex: /^mouse\s*(?:gamer)?/i, cat: (m) => /gamer/i.test(m[0]) ? 'Mouse Gamer' : 'Mouse' },
    { regex: /^teclado\s*(?:gamer)?/i, cat: (m) => /gamer/i.test(m[0]) ? 'Teclado Gamer' : 'Teclados' },
    { regex: /^monitor\s*(?:gamer)?/i, cat: (m) => /gamer/i.test(m[0]) ? 'Monitor Gamer' : 'Monitores' },
    { regex: /^impresora|multifuncional/i, cat: 'Impresoras' },
    { regex: /^webcam|c[áa]mara\s*web/i, cat: 'Cámaras Web' },
    { regex: /^disco\s*(?:duro|externo|solido|s[oó]lido)|ssd/i, cat: 'Almacenamiento' },
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

  // 2. Especificación 'Tipo' explícita válida (ej: 'Notebook Gamer', 'Parlante Bluetooth')
  const exactTipo = specs.find(s => s.name && s.name.trim().toLowerCase() === 'tipo' && !/pantalla|carga|gpu|bateria/i.test(s.name));
  if (exactTipo && exactTipo.value && !/indicadores|led|superior|frontal/i.test(exactTipo.value)) {
    return exactTipo.value.trim();
  }

  // 3. Especificación técnica de ID Falabella (audífonos, portátiles, altavoces, mouse)
  const idTipo = specs.find(s => s.id && /_tipo_de_(portatil|auricular|altavoz|parlante|computador)/i.test(s.id));
  if (idTipo && idTipo.value) return idTipo.value.trim();

  if (specs.some(s => s.id && /_tipo_de_mouse/i.test(s.id))) {
    return 'Mouse';
  }

  // 4. Nombres alternativos por departamento
  const nameTipo = specs.find(s => /^(auricular|tipo de producto|tipo de auricular|tipo de altavoz)/i.test(s.name || ''));
  if (nameTipo && nameTipo.value) return nameTipo.value.trim();

  const topTipo = topSpecs.find(s => /^(tipo|auricular)/i.test(s.name || '') && !/carga|pantalla/i.test(s.name));
  if (topTipo && topTipo.value && !/superior|frontal|led/i.test(topTipo.value)) return topTipo.value.trim();

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

  // 6. Taxonomía de categorías si existe
  if (product.categories && product.categories.length > 0) {
    const lastCat = product.categories[product.categories.length - 1];
    if (lastCat && lastCat.name) return lastCat.name.trim();
  }

  return 'General';
}

/**
 * Normaliza los datos crudos del producto (de la API Browse o __NEXT_DATA__)
 */
function normalizarProducto(d, cleanSku) {
  if (!d) return null;

  // Si ya viene normalizado por el backend local
  if (d.sku && (d.precioCmr !== undefined || d.precioOferta !== undefined)) {
    return d;
  }

  const variants = d.variants || [];
  const variant = variants.find(v => String(v.id) === String(cleanSku) || v.id === d.primaryVariantId) || variants[0] || {};

  let cmrPriceNum = null;
  let internetPriceNum = null;
  let normalPriceNum = null;
  let fechaVigencia = null;

  const pricesList = variant.prices || d.prices || [];
  for (const p of pricesList) {
    const type = (p.type || p.label || '').toLowerCase();
    const val = Array.isArray(p.price) ? p.price[0] : (p.price || p.formattedPrice);
    if (!val) continue;

    if (p.validity && !fechaVigencia) {
      const match = String(p.validity).match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
      if (match) {
        fechaVigencia = `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
      }
    }

    const cleanDigits = String(val).replace(/\D/g, '');
    const num = cleanDigits ? parseInt(cleanDigits, 10) : null;
    if (num === null || isNaN(num)) continue;

    if (type.includes('cmr') || type.includes('tarjeta') || (p.icons && String(p.icons).includes('cmr'))) {
      cmrPriceNum = num;
    } else if (type.includes('internet') || type.includes('oferta') || type.includes('event')) {
      internetPriceNum = num;
    } else if (type.includes('normal') || type.includes('referencia') || p.crossed) {
      normalPriceNum = num;
    }
  }

  if (!normalPriceNum && !internetPriceNum && !cmrPriceNum && pricesList.length > 0) {
    const p0 = pricesList[0];
    const val0 = Array.isArray(p0.price) ? p0.price[0] : p0.price;
    const clean0 = String(val0).replace(/\D/g, '');
    normalPriceNum = clean0 ? parseInt(clean0, 10) : null;
  }

  // Clasificación comercial de tipo de precio
  let tipoPrecio = 'normal';
  if (cmrPriceNum) {
    tipoPrecio = 'ou';
  } else if (internetPriceNum && (!normalPriceNum || internetPriceNum < normalPriceNum)) {
    tipoPrecio = 'oferta';
  }

  const marca = (d.brandName || d.brand || '').trim().toUpperCase();
  const nombre = (d.displayName || d.name || '').trim();

  const specs = d.attributes?.specifications || [];
  const categoria = extractCategoryFromProduct(d, marca, nombre);
  let modelo = '';

  const modelSpec = specs.find(s => /^(modelo|nombre comercial)/i.test(s.name || ''));
  if (modelSpec && modelSpec.value) {
    modelo = modelSpec.value;
  } else if (d.model) {
    modelo = d.model;
  }

  if (!modelo && nombre) {
    let cleanTitle = nombre;
    if (marca && cleanTitle.toUpperCase().startsWith(marca)) {
      cleanTitle = cleanTitle.substring(marca.length).trim();
    }
    modelo = cleanTitle.split(' ').slice(0, 4).join(' ');
  }

  return {
    sku: String(cleanSku).trim(),
    marca: marca || 'MARCA',
    categoria: categoria || 'General',
    modelo: modelo || '',
    nombre: nombre || `${marca} ${modelo}`,
    precioCmr: cmrPriceNum ? formatCLP(cmrPriceNum) : '',
    precioOferta: internetPriceNum ? formatCLP(internetPriceNum) : '',
    precioNormal: normalPriceNum ? formatCLP(normalPriceNum) : '',
    precioCmrNum: cmrPriceNum,
    precioOfertaNum: internetPriceNum,
    precioNormalNum: normalPriceNum,
    tipoPrecio: tipoPrecio,
    vigenciaHasta: fechaVigencia,
    url: `https://www.falabella.com/falabella-cl/product/${cleanSku}/`
  };
}

/**
 * 2. Consumo de Red y Evasión CORS con Fallback Concurrente y Secuencial
 */
async function fetchProducto(skuInput) {
  const cleanSku = buscarSku(skuInput);
  if (!cleanSku) {
    throw new Error('SKU o URL inválida (se requieren 6 o más dígitos)');
  }

  // 1. Intento primario: Endpoint de alta velocidad del Servidor Local
  try {
    const res = await fetchTimeout(`/api/sku/${encodeURIComponent(cleanSku)}`, { timeout: 9000 });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        return normalizarProducto(json.data, cleanSku);
      }
    }
  } catch (err) {
    console.warn(`[fetchProducto] Fallo endpoint local para SKU ${cleanSku} (${err.message}). Probando endpoints de red...`);
  }

  // 2. Lista de URLs prioritarias: API directa y 3 proxies públicos
  const browseUrl = `https://www.falabella.com/s/browse/v3/product/cl?site=falabella-cl&productId=${encodeURIComponent(cleanSku)}`;
  const endpoints = [
    browseUrl,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(browseUrl)}`,
    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(browseUrl)}`,
    `https://corsproxy.io/?${encodeURIComponent(browseUrl)}`
  ];

  for (const url of endpoints) {
    try {
      const res = await fetchTimeout(url, {
        headers: {
          'Accept': 'application/json, text/plain, */*'
        },
        timeout: 9000
      });

      if (!res.ok) continue;

      const text = await res.text();
      let json;
      try {
        json = JSON.parse(text);
      } catch (parseErr) {
        continue;
      }

      const productData = json.data || json;
      if (productData && (productData.variants || productData.id || productData.name)) {
        return normalizarProducto(productData, cleanSku);
      }
    } catch (netErr) {
      // Continuar al siguiente endpoint en caso de timeout o CORS
      continue;
    }
  }

  throw new Error(`No se pudo obtener información del producto ${cleanSku} en ningún endpoint`);
}

/**
 * 3. Parseo y Asignación de Precios al Estado
 */
function aplicarProducto(d, isSingleManual = false) {
  if (!d) return;

  if (isSingleManual) {
    // Inyección completa a modo manual con selección inteligente de preset comercial
    state.sku = d.sku || '';
    if (d.marca) state.marca = d.marca;
    if (d.categoria) state.categoria = d.categoria;
    if (d.modelo) state.modelo = d.modelo;
    state.precioCmr = d.precioCmrNum || (d.precioCmr ? parseCLP(d.precioCmr) : null);
    state.precioOferta = d.precioOfertaNum || (d.precioOferta ? parseCLP(d.precioOferta) : null);
    state.precioNormal = d.precioNormalNum || (d.precioNormal ? parseCLP(d.precioNormal) : null);
    if (d.vigenciaHasta) {
      state.vigenciaHasta = d.vigenciaHasta;
      state.fechasPersonalizadas = true;
    }

    // Auto-activar preset según la clasificación comercial
    if (d.tipoPrecio === 'ou' && typeof applyPreset === 'function') {
      applyPreset('cmr');
    } else if (d.tipoPrecio === 'oferta' && typeof applyPreset === 'function') {
      applyPreset('oferta');
    } else if (typeof applyPreset === 'function') {
      applyPreset('normal');
    }

    if (typeof syncFormFromState === 'function') syncFormFromState();
    if (typeof updateCalculos === 'function') updateCalculos();
    if (typeof renderCartel === 'function') renderCartel();
  } else {
    // Asignación de item en lote
    applyProductToState(d);
  }
}

// Aplica los datos de un producto de lote al estado global para su renderizado
function applyProductToState(prod) {
  if (!prod) return;
  state.marca = prod.marca || '';
  state.categoria = prod.categoria || '';
  state.modelo = prod.modelo || '';
  state.sku = prod.sku || '';

  const getNum = (v1, v2) => {
    if (typeof v1 === 'number') return v1;
    if (typeof v2 === 'number') return v2;
    if (v1) return parseCLP(v1);
    if (v2) return parseCLP(v2);
    return null;
  };

  state.precioCmr = getNum(prod.precioCmr, prod.precioCmrNum);
  state.precioOferta = getNum(prod.precioOferta, prod.precioOfertaNum);
  state.precioNormal = getNum(prod.precioNormal, prod.precioNormalNum);
  if (prod.vigenciaDesde) state.vigenciaDesde = prod.vigenciaDesde;
  if (prod.vigenciaHasta) state.vigenciaHasta = prod.vigenciaHasta;
  state.cae = (prod.cae !== undefined && prod.cae !== null && prod.cae !== '') ? parseFloat(prod.cae) : (state.batchCae || 39.93);
}

// Calcula dimensiones y factor de escala para tarjetas en vista Mosaico
function getMosaicThumbnailConfig(template) {
  const DIMS = {
    'p118':        { w: 216, h: 279, targetW: 280 },
    't-6x4-sheet': { w: 216, h: 279, targetW: 280 },
    't-15x21':     { w: 150, h: 210, targetW: 260 },
    'p132':        { w: 130, h: 190, targetW: 260 },
    't-9x13':      { w: 90,  h: 130, targetW: 250 },
    't-9x7':       { w: 90,  h: 70,  targetW: 280 },
    'p123':        { w: 210, h: 48,  targetW: 340 },
    't-12x3':      { w: 120, h: 30,  targetW: 340 },
    'p121':        { w: 140, h: 95,  targetW: 280 },
    't-6x4':       { w: 60,  h: 40,  targetW: 260 }
  };
  const cfg = DIMS[template] || DIMS['p118'];
  const mmToPx = 96 / 25.4;
  const unscaledW = Math.round(cfg.w * mmToPx);
  const unscaledH = Math.round(cfg.h * mmToPx);
  const targetW = cfg.targetW;
  const scale = targetW / unscaledW;
  const targetH = Math.round(unscaledH * scale);
  return { targetW, targetH, scale };
}

// Renderizador reactivo según el modo actual (Manual o Lote)
function renderActiveView() {
  if (state.mode === 'manual') {
    if (typeof renderCartel === 'function') renderCartel();
    return;
  }

  const container = dom.cartelContainer;
  if (!container) return;
  container.innerHTML = '';

  const items = state.batchItems || [];
  if (items.length === 0) {
    container.innerHTML = `
      <div style="padding: 60px 20px; text-align: center; color: #64748b;">
        <div style="font-size: 36px; margin-bottom: 12px;">📋</div>
        <h3 style="font-size: 16px; color: #334155; margin-bottom: 6px;">Lote sin carteles activos</h3>
        <p style="font-size: 13px;">Ingresa SKUs o enlaces en el panel izquierdo y pulsa "Cargar Datos del Lote".</p>
      </div>
    `;
    return;
  }

  if (state.batchViewMode === 'mosaic') {
    // Vista en Mosaico con todos los carteles del lote
    if (dom.previewWrapper) {
      dom.previewWrapper.style.transform = 'none';
      dom.previewWrapper.style.transition = 'none';
    }
    if (dom.zoomLevelText) {
      dom.zoomLevelText.textContent = 'Mosaico';
    }

    const mosaicWrapper = document.createElement('div');
    mosaicWrapper.className = 'batch-mosaic-container';

    const thumbCfg = getMosaicThumbnailConfig(state.template);
    const savedState = { ...state };

    items.forEach((item, idx) => {
      applyProductToState(item);

      const card = document.createElement('div');
      card.className = `batch-mosaic-card ${idx === state.activeBatchIndex ? 'is-active' : ''}`;
      card.style.width = `${thumbCfg.targetW}px`;
      card.title = `Clic para ver ${item.sku || 'cartel'} en tamaño completo`;

      const viewport = document.createElement('div');
      viewport.className = 'batch-mosaic-viewport';
      viewport.style.width = `${thumbCfg.targetW}px`;
      viewport.style.height = `${thumbCfg.targetH}px`;

      const sheet = (typeof renderCartelElement === 'function') ? renderCartelElement() : null;
      if (sheet) {
        sheet.style.transform = `scale(${thumbCfg.scale})`;
        viewport.appendChild(sheet);
      }

      const footer = document.createElement('div');
      footer.className = 'batch-mosaic-footer';

      const bestPrice = item.precioCmr || item.precioOferta || item.precioNormal;
      const formattedPrice = bestPrice ? (typeof formatCLP === 'function' ? formatCLP(bestPrice) : `$${bestPrice}`) : '';

      footer.innerHTML = `
        <div class="batch-mosaic-badge">#${idx + 1}</div>
        <div class="batch-mosaic-meta">
          <div class="batch-mosaic-brand">${escapeHTML(item.marca || 'MARCA')}</div>
          <div class="batch-mosaic-sub">SKU: ${escapeHTML(item.sku || '')} ${item.modelo ? '• ' + escapeHTML(item.modelo) : ''}</div>
        </div>
        ${formattedPrice ? `<div class="batch-mosaic-price">${formattedPrice}</div>` : ''}
      `;

      card.appendChild(viewport);
      card.appendChild(footer);

      card.addEventListener('click', () => {
        state.activeBatchIndex = idx;
        state.batchViewMode = 'single';
        if (dom.btnToggleBatchViewText) dom.btnToggleBatchViewText.textContent = 'Ver Mosaico';
        applyProductToState(item);
        if (typeof syncFormFromState === 'function') syncFormFromState();
        if (typeof updateCalculos === 'function') updateCalculos();
        renderActiveView();
        renderBatchPreviewTabs();
        renderBatchItemsList();
      });

      mosaicWrapper.appendChild(card);
    });

    Object.assign(state, savedState);
    container.appendChild(mosaicWrapper);
  } else {
    // Vista individual del cartel activo en el lote
    if (dom.previewWrapper && typeof applyZoom === 'function') {
      applyZoom();
    }
    const activeItem = items[state.activeBatchIndex] || items[0];
    if (activeItem) {
      applyProductToState(activeItem);
      const sheet = typeof renderCartelElement === 'function' ? renderCartelElement() : null;
      if (sheet) container.appendChild(sheet);
    }
  }
}

// Cambiar de modo (Manual vs Lote)
function switchMode(mode) {
  state.mode = mode;
  if (dom.tabModeManual && dom.tabModeBatch) {
    dom.tabModeManual.classList.toggle('is-active', mode === 'manual');
    dom.tabModeBatch.classList.toggle('is-active', mode === 'batch');
    dom.tabModeManual.setAttribute('aria-selected', mode === 'manual');
    dom.tabModeBatch.setAttribute('aria-selected', mode === 'batch');
  }
  if (dom.panelModeManual && dom.panelModeBatch) {
    dom.panelModeManual.style.display = mode === 'manual' ? 'block' : 'none';
    dom.panelModeBatch.style.display = mode === 'batch' ? 'block' : 'none';
  }
  if (dom.manualFooterActions && dom.batchFooterActions) {
    const isManual = mode === 'manual';
    dom.manualFooterActions.style.display = isManual ? 'flex' : 'none';
    dom.batchFooterActions.style.display = isManual ? 'none' : 'flex';
    dom.manualFooterActions.classList.toggle('hidden', !isManual);
    dom.batchFooterActions.classList.toggle('hidden', isManual);
  }
  if (mode === 'batch') {
    if (dom.inputBatchCae) dom.inputBatchCae.value = state.batchCae || state.cae || 39.93;
    if (dom.inputBatchVigenciaDesde) dom.inputBatchVigenciaDesde.value = state.batchVigenciaDesde || state.vigenciaDesde;
    if (dom.inputBatchVigenciaHasta) dom.inputBatchVigenciaHasta.value = state.batchVigenciaHasta || state.vigenciaHasta;
    renderBatchItemsList();
  } else {
    // Modo individual: Cargar automáticamente el item activo del lote en el formulario si existe lote
    if (state.batchItems && state.batchItems.length > 0) {
      const activeItem = state.batchItems[state.activeBatchIndex] || state.batchItems[0];
      if (activeItem) {
        applyProductToState(activeItem);
        if (typeof syncFormFromState === 'function') syncFormFromState();
        if (typeof updateCalculos === 'function') updateCalculos();
      }
    }
    if (dom.inputCae) dom.inputCae.value = state.cae || state.batchCae || 39.93;
  }
  if (dom.batchPreviewBar) {
    const hasBatch = state.batchItems && state.batchItems.length > 0;
    dom.batchPreviewBar.classList.toggle('hidden', !hasBatch);
  }
  if (dom.previewStatusLabel) {
    const hasBatch = state.batchItems && state.batchItems.length > 0;
    dom.previewStatusLabel.textContent = mode === 'manual'
      ? (hasBatch ? `Individual (#${state.activeBatchIndex + 1}: ${state.sku || ''})` : 'Vista Previa en Vivo')
      : `Lote en Vivo (${state.batchItems.length} SKUs)`;
  }
  renderActiveView();
  showToast(mode === 'manual' ? 'Modo Individual activo' : 'Modo por Lote activo');
}

// Rellenado Automático de un SKU individual desde Falabella
async function autofillSingleSku() {
  const rawInput = (dom.inputSku ? dom.inputSku.value : '').trim();
  const sku = buscarSku(rawInput);
  if (!sku) {
    showToast('Ingresa un SKU numérico o enlace de Falabella (ej: 80739039)', 'warning');
    return;
  }

  // Normalizar el input visual al SKU limpio
  if (dom.inputSku) dom.inputSku.value = sku;

  const btn = dom.btnAutofillSku;
  const originalText = dom.btnAutofillText ? dom.btnAutofillText.textContent : 'Rellenar';
  if (btn) {
    btn.disabled = true;
    if (dom.btnAutofillText) dom.btnAutofillText.textContent = 'Buscando...';
  }

  try {
    showToast(`Consultando Falabella para SKU ${sku}...`);
    const d = await fetchProducto(sku);
    aplicarProducto(d, true);

    // Mostrar disclaimer en amarillo alertando sobre la revisión de precios en caja
    if (dom.autofillDisclaimer) {
      dom.autofillDisclaimer.classList.remove('hidden');
    }
    showToast('Recuerda revisar los precios en caja antes de implementarlos', 'warning');
  } catch (err) {
    console.error('Error autofill:', err);
    showToast(`Error al consultar SKU ${sku}: ${err.message}`, 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      if (dom.btnAutofillText) dom.btnAutofillText.textContent = originalText;
    }
  }
}

/**
/**
 * Extrae y desduplica SKUs desde cualquier formato:
 * - Separados por espacios (ej: "80758852 16347951 17201800")
 * - Separados por comas o punto y coma (ej: "80758852, 16347951, 17201800")
 * - Separados por saltos de línea (\n, \r\n)
 * - URLs completas de Falabella (/product/<id>/...)
 * - Textos mixtos ("SKU: 80758852 ...")
 */
function extractBatchSkus(rawText) {
  if (!rawText) return [];
  const result = [];

  // Dividir por saltos de línea, comas o punto y coma
  const lines = rawText.split(/[\r\n,;]+/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Si la línea contiene múltiples SKUs o tokens separados por espacios
    const spaceTokens = trimmed.split(/\s+/);
    for (const token of spaceTokens) {
      const cleanToken = token.trim();
      if (!cleanToken) continue;

      let sku = null;
      // 1. Extraer SKU desde URL completa (/product/<id>/...)
      const urlMatch = cleanToken.match(/\/product\/(\d{6,})/i);
      if (urlMatch) {
        sku = urlMatch[1];
      } else {
        // 2. Extraer mediante buscador de SKU o secuencia numérica directa de 6+ dígitos
        if (typeof buscarSku === 'function') {
          sku = buscarSku(cleanToken);
        }
        if (!sku) {
          const directMatch = cleanToken.match(/\b\d{6,}\b/) || cleanToken.match(/\d{6,}/);
          if (directMatch) sku = directMatch[0];
        }
      }

      if (sku) {
        result.push(String(sku).trim());
      }
    }
  }

  return result;
}

/**
 * 4. Motor de Procesamiento por Lote
 */
async function loadBatchSkus() {
  const raw = (dom.inputBatchSkus ? dom.inputBatchSkus.value : '').trim();
  if (!raw) {
    showToast('Pega o escribe los SKUs o enlaces en el área de texto', 'warning');
    return;
  }

  // Extracción masiva permitiendo duplicados intencionales del usuario
  const skus = extractBatchSkus(raw);

  if (skus.length === 0) {
    showToast('No se encontraron SKUs o enlaces válidos (mínimo 6 dígitos)', 'warning');
    return;
  }

  if (dom.btnLoadBatch) {
    dom.btnLoadBatch.disabled = true;
    if (dom.btnLoadBatchText) dom.btnLoadBatchText.textContent = 'Consultando Falabella...';
  }
  if (dom.batchStatusBox) {
    dom.batchStatusBox.classList.add('is-loading');
    if (dom.batchStatusText) dom.batchStatusText.textContent = `Cargando 0 de ${skus.length} productos...`;
  }

  // Inicializar estado del lote
  const defaultCae = (dom.inputBatchCae && dom.inputBatchCae.value) ? parseFloat(dom.inputBatchCae.value) : (state.batchCae || 39.93);
  state.batchCae = defaultCae;

  state.batchItems = skus.map((sku, idx) => ({
    id: `item_${sku}_${idx}_${Date.now()}`,
    sku: sku,
    marca: 'Consultando...',
    categoria: '',
    modelo: '',
    nombre: `SKU ${sku}`,
    precioCmr: null,
    precioOferta: null,
    precioNormal: null,
    vigenciaDesde: state.batchVigenciaDesde || state.vigenciaDesde,
    vigenciaHasta: state.batchVigenciaHasta || state.vigenciaHasta,
    cae: defaultCae,
    status: 'loading',
    errorMsg: ''
  }));

  state.activeBatchIndex = 0;
  renderBatchItemsList();
  renderBatchPreviewTabs();
  if (dom.batchPreviewBar) dom.batchPreviewBar.classList.remove('hidden');

  const fetchedCache = {};
  let completed = 0;
  for (let i = 0; i < state.batchItems.length; i++) {
    const item = state.batchItems[i];
    try {
      const d = fetchedCache[item.sku] || await fetchProducto(item.sku);
      fetchedCache[item.sku] = d;

      item.marca = d.marca || 'MARCA';
      item.categoria = d.categoria || 'General';
      item.modelo = d.modelo || '';
      item.nombre = d.nombre || `${item.marca} ${item.modelo}`;
      item.precioCmr = d.precioCmrNum || (d.precioCmr ? parseCLP(d.precioCmr) : null);
      item.precioCmrNum = item.precioCmr;
      item.precioOferta = d.precioOfertaNum || (d.precioOferta ? parseCLP(d.precioOferta) : null);
      item.precioOfertaNum = item.precioOferta;
      item.precioNormal = d.precioNormalNum || (d.precioNormal ? parseCLP(d.precioNormal) : null);
      item.precioNormalNum = item.precioNormal;
      if (d.vigenciaHasta) item.vigenciaHasta = d.vigenciaHasta;
      item.tipoPrecio = d.tipoPrecio || 'normal';
      item.status = 'success';
    } catch (err) {
      item.status = 'error';
      item.errorMsg = err.message;
      item.marca = 'ERROR';
    }

    completed++;
    if (dom.batchStatusText) {
      dom.batchStatusText.textContent = `Cargando ${completed} de ${skus.length} productos...`;
    }

    // Sincronización con requestAnimationFrame para refresco suave de UI
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

    renderBatchItemsList();
    renderBatchPreviewTabs();

    if (state.activeBatchIndex === i) {
      applyProductToState(item);
      if (typeof syncFormFromState === 'function') syncFormFromState();
      if (typeof updateCalculos === 'function') updateCalculos();
      if (state.batchViewMode === 'single') {
        renderActiveView();
      }
    }
  }


  if (dom.btnLoadBatch) {
    dom.btnLoadBatch.disabled = false;
    if (dom.btnLoadBatchText) dom.btnLoadBatchText.textContent = 'Cargar Datos del Lote';
  }
  if (dom.batchStatusBox) {
    dom.batchStatusBox.classList.remove('is-loading');
    if (dom.batchStatusText) {
      dom.batchStatusText.textContent = `Lote completado (${completed} de ${skus.length} productos listos)`;
    }
  }

  const activeItem = state.batchItems[state.activeBatchIndex] || state.batchItems[0];
  if (activeItem) {
    applyProductToState(activeItem);
    if (typeof syncFormFromState === 'function') syncFormFromState();
    if (typeof updateCalculos === 'function') updateCalculos();
  }

  renderBatchItemsList();
  renderBatchPreviewTabs();
  renderActiveView();
  showToast(`¡Lote completado: ${completed} carteles listos!`, 'success');
}

// Limpiar lista de lote completamente
function clearBatch() {
  state.batchItems = [];
  state.activeBatchIndex = 0;
  state.batchViewMode = 'single';
  if (dom.btnToggleBatchViewText) dom.btnToggleBatchViewText.textContent = 'Ver Mosaico';
  if (dom.inputBatchSkus) dom.inputBatchSkus.value = '';
  const semana = (typeof getSemanaVigenteActual === 'function') ? getSemanaVigenteActual() : semanaInicial;
  state.batchVigenciaDesde = semana.desde;
  state.batchVigenciaHasta = semana.hasta;
  if (dom.inputBatchVigenciaDesde) dom.inputBatchVigenciaDesde.value = semana.desde;
  if (dom.inputBatchVigenciaHasta) dom.inputBatchVigenciaHasta.value = semana.hasta;
  if (dom.batchStatusBox) {
    dom.batchStatusBox.classList.remove('is-loading');
    if (dom.batchStatusText) dom.batchStatusText.textContent = 'En espera de los SKU';
  }
  if (dom.batchCountBadge) dom.batchCountBadge.textContent = '0 carteles';
  if (dom.batchPillCounter) dom.batchPillCounter.textContent = 'Multi-SKU';
  if (dom.batchTabsList) dom.batchTabsList.innerHTML = '';
  if (dom.batchPreviewBar) dom.batchPreviewBar.classList.add('hidden');
  renderBatchItemsList();
  renderBatchPreviewTabs();
  if (state.mode === 'batch') {
    renderActiveView();
  } else if (typeof renderCartel === 'function') {
    renderCartel();
  }
  showToast('Lote limpiado');
}

// Aplica la vigencia y CAE del lote a todos los productos
function applyBatchVigenciaToAll() {
  const fDesde = dom.inputBatchVigenciaDesde ? dom.inputBatchVigenciaDesde.value : '';
  const fHasta = dom.inputBatchVigenciaHasta ? dom.inputBatchVigenciaHasta.value : '';
  const caeVal = dom.inputBatchCae ? parseFloat(dom.inputBatchCae.value) : null;

  if (!fDesde && !fHasta && (caeVal === null || isNaN(caeVal))) {
    showToast('Selecciona vigencia o ingresa un CAE para el lote', 'warning');
    return;
  }

  if (fDesde) state.batchVigenciaDesde = fDesde;
  if (fHasta) state.batchVigenciaHasta = fHasta;
  if (caeVal !== null && !isNaN(caeVal)) {
    state.batchCae = caeVal;
    state.cae = caeVal;
  }

  (state.batchItems || []).forEach(item => {
    if (fDesde) item.vigenciaDesde = fDesde;
    if (fHasta) item.vigenciaHasta = fHasta;
    if (caeVal !== null && !isNaN(caeVal)) item.cae = caeVal;
  });

  const activeItem = state.batchItems && state.batchItems[state.activeBatchIndex];
  if (activeItem) {
    applyProductToState(activeItem);
    if (typeof syncFormFromState === 'function') syncFormFromState();
    if (typeof updateCalculos === 'function') updateCalculos();
  }

  renderBatchItemsList();
  renderActiveView();
  showToast('Vigencia y CAE aplicados a todos los productos del lote', 'success');
}

// Alternar entre vista de cartel activo y mosaico en lote
function toggleBatchView() {
  state.batchViewMode = state.batchViewMode === 'single' ? 'mosaic' : 'single';
  if (dom.btnToggleBatchViewText) {
    dom.btnToggleBatchViewText.textContent = state.batchViewMode === 'single' ? 'Ver Mosaico' : 'Ver Individual';
  }
  renderActiveView();
}

// Renderiza las tarjetas de productos en el panel lateral de lote
function renderBatchItemsList() {
  const container = dom.batchItemsContainer;
  if (!container) return;

  const items = state.batchItems || [];
  if (dom.batchCountBadge) {
    dom.batchCountBadge.textContent = `${items.length} cartel${items.length === 1 ? '' : 'es'}`;
  }
  if (dom.batchPillCounter) {
    dom.batchPillCounter.textContent = items.length > 0 ? `${items.length} SKUs` : 'Multi-SKU';
  }

  if (items.length === 0) {
    container.innerHTML = `
      <div class="batch-empty-state" id="batchEmptyState">
        <div class="empty-icon">📦</div>
        <p>No hay SKUs cargados todavía.</p>
        <span>Ingresa los códigos SKU o enlaces arriba y presiona "Cargar Datos del Lote".</span>
      </div>
    `;
    return;
  }

  container.innerHTML = '';
  items.forEach((item, idx) => {
    const card = document.createElement('div');
    card.className = `batch-item-card ${idx === state.activeBatchIndex ? 'is-active' : ''}`;

    const cmrVal = item.precioCmr ? formatCLP(item.precioCmr) : '';
    const ofertaVal = item.precioOferta ? formatCLP(item.precioOferta) : '';
    const normalVal = item.precioNormal ? formatCLP(item.precioNormal) : '';
    const vigenciaVal = item.vigenciaHasta || '';
    const caeItemVal = (item.cae !== undefined && item.cae !== null) ? item.cae : (state.batchCae || 39.93);

    card.innerHTML = `
      <div class="batch-item-header">
        <div class="batch-item-info">
          <div class="batch-item-sku-row">
            <span class="batch-item-sku">SKU: ${item.sku}</span>
            <span class="batch-item-brand">${escapeHTML(item.marca || 'MARCA')}</span>
          </div>
          <div class="batch-item-name" title="${escapeHTML(item.nombre || '')}">${escapeHTML(item.nombre || item.modelo || 'Sin descripción')}</div>
        </div>
        <div class="batch-item-actions">
          <button type="button" class="btn-batch-card-action btn-delete-item" title="Eliminar SKU del lote" data-idx="${idx}">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>

      <div class="batch-item-prices-grid">
        <div class="batch-price-group">
          <label>Precio CMR</label>
          <input type="text" class="input-batch-cmr" data-idx="${idx}" placeholder="$000.000" value="${cmrVal}">
        </div>
        <div class="batch-price-group">
          <label>P. Oferta</label>
          <input type="text" class="input-batch-oferta" data-idx="${idx}" placeholder="$000.000" value="${ofertaVal}">
        </div>
        <div class="batch-price-group">
          <label>P. Normal</label>
          <input type="text" class="input-batch-normal" data-idx="${idx}" placeholder="$000.000" value="${normalVal}">
        </div>
      </div>

      <div class="batch-item-vigencia-row">
        <div class="batch-subgroup">
          <span>Hasta:</span>
          <input type="date" class="input-batch-vigencia" data-idx="${idx}" value="${vigenciaVal}">
        </div>
        <div class="batch-subgroup">
          <span>CAE (%):</span>
          <input type="number" step="0.01" class="input-batch-cae" data-idx="${idx}" placeholder="39.93" value="${caeItemVal}">
        </div>
      </div>
    `;

    // Al hacer clic o foco en cualquier parte de la tarjeta (incluyendo inputs), activarla de inmediato
    const activateThisCard = () => {
      if (state.activeBatchIndex !== idx) {
        state.activeBatchIndex = idx;
        applyProductToState(item);
        if (typeof syncFormFromState === 'function') syncFormFromState();
        if (typeof updateCalculos === 'function') updateCalculos();
        const allCards = container.querySelectorAll('.batch-item-card');
        allCards.forEach((c, i) => c.classList.toggle('is-active', i === idx));
        if (dom.batchTabsList) {
          Array.from(dom.batchTabsList.children).forEach((p, i) => p.classList.toggle('is-active', i === idx));
        }
        renderActiveView();
      }
    };

    card.addEventListener('click', (e) => {
      if (e.target.closest('button')) return;
      activateThisCard();
    });

    card.addEventListener('focusin', () => {
      activateThisCard();
    });

    const cmrInput = card.querySelector('.input-batch-cmr');
    cmrInput.addEventListener('input', (e) => {
      activateThisCard();
      const val = parseCLP(e.target.value);
      item.precioCmr = val;
      item.precioCmrNum = val;
      if (val !== null) {
        e.target.value = formatCLP(val);
      } else {
        e.target.value = '';
      }
      state.precioCmr = val;
      if (dom.inputPrecioCmr) {
        dom.inputPrecioCmr.value = val !== null ? formatCLP(val) : '';
      }
      if (typeof updateCalculos === 'function') updateCalculos();
      renderActiveView();
    });

    const ofertaInput = card.querySelector('.input-batch-oferta');
    ofertaInput.addEventListener('input', (e) => {
      activateThisCard();
      const val = parseCLP(e.target.value);
      item.precioOferta = val;
      item.precioOfertaNum = val;
      if (val !== null) {
        e.target.value = formatCLP(val);
      } else {
        e.target.value = '';
      }
      state.precioOferta = val;
      if (dom.inputPrecioOferta) {
        dom.inputPrecioOferta.value = val !== null ? formatCLP(val) : '';
      }
      if (typeof updateCalculos === 'function') updateCalculos();
      renderActiveView();
    });

    const normalInput = card.querySelector('.input-batch-normal');
    normalInput.addEventListener('input', (e) => {
      activateThisCard();
      const val = parseCLP(e.target.value);
      item.precioNormal = val;
      item.precioNormalNum = val;
      if (val !== null) {
        e.target.value = formatCLP(val);
      } else {
        e.target.value = '';
      }
      state.precioNormal = val;
      if (dom.inputPrecioNormal) {
        dom.inputPrecioNormal.value = val !== null ? formatCLP(val) : '';
      }
      if (typeof updateCalculos === 'function') updateCalculos();
      renderActiveView();
    });

    const vigenciaInput = card.querySelector('.input-batch-vigencia');
    vigenciaInput.addEventListener('change', (e) => {
      activateThisCard();
      item.vigenciaHasta = e.target.value;
      state.vigenciaHasta = e.target.value;
      if (dom.inputVigenciaHasta) {
        dom.inputVigenciaHasta.value = e.target.value;
      }
      renderActiveView();
    });

    const caeInput = card.querySelector('.input-batch-cae');
    if (caeInput) {
      caeInput.addEventListener('input', (e) => {
        activateThisCard();
        const val = parseFloat(e.target.value);
        const caeVal = isNaN(val) ? 39.93 : val;
        item.cae = caeVal;
        state.cae = caeVal;
        if (dom.inputCae) {
          dom.inputCae.value = e.target.value;
        }
        if (typeof updateCalculos === 'function') updateCalculos();
        renderActiveView();
      });
    }

    const btnDel = card.querySelector('.btn-delete-item');
    btnDel.addEventListener('click', (e) => {
      e.stopPropagation();
      state.batchItems.splice(idx, 1);
      if (state.activeBatchIndex >= state.batchItems.length) {
        state.activeBatchIndex = Math.max(0, state.batchItems.length - 1);
      }
      if (state.batchItems.length > 0) {
        const nextActive = state.batchItems[state.activeBatchIndex];
        if (nextActive) {
          applyProductToState(nextActive);
          if (typeof syncFormFromState === 'function') syncFormFromState();
          if (typeof updateCalculos === 'function') updateCalculos();
        }
      } else {
        if (dom.batchPreviewBar) dom.batchPreviewBar.classList.add('hidden');
      }
      renderBatchItemsList();
      renderBatchPreviewTabs();
      renderActiveView();
    });

    container.appendChild(card);
  });
}

// Renderiza las pestañas de navegación rápida en la barra de visualización del lote
function renderBatchPreviewTabs() {
  const tabsList = dom.batchTabsList;
  if (!tabsList) return;
  tabsList.innerHTML = '';

  const items = state.batchItems || [];
  if (dom.batchPreviewBar) {
    dom.batchPreviewBar.classList.toggle('hidden', items.length === 0);
  }

  items.forEach((item, idx) => {
    const pill = document.createElement('button');
    pill.type = 'button';
    pill.className = `batch-tab-pill ${idx === state.activeBatchIndex ? 'is-active' : ''}`;
    pill.title = `Seleccionar #${idx + 1} (${item.sku})`;
    pill.innerHTML = `
      <span>#${idx + 1}</span>
      <strong>${escapeHTML(item.sku || '')}</strong>
      <span>${escapeHTML(item.marca || 'MARCA')}</span>
    `;

    pill.addEventListener('click', (e) => {
      e.preventDefault();
      state.activeBatchIndex = idx;
      if (state.batchViewMode === 'mosaic') {
        state.batchViewMode = 'single';
        if (dom.btnToggleBatchViewText) dom.btnToggleBatchViewText.textContent = 'Ver Mosaico';
      }
      // Sincronizar datos del producto con el estado y formulario Individual SIN cambiar de pestaña
      applyProductToState(item);
      if (typeof syncFormFromState === 'function') syncFormFromState();
      if (typeof updateCalculos === 'function') updateCalculos();

      // Actualizar estado activo en pestañas sin recrear elementos
      if (dom.batchTabsList) {
        Array.from(dom.batchTabsList.children).forEach((p, i) => {
          p.classList.toggle('is-active', i === idx);
        });
      }

      // Actualizar tarjeta activa en el contenedor de lote sin recrear el DOM
      if (dom.batchItemsContainer) {
        Array.from(dom.batchItemsContainer.children).forEach((c, i) => {
          c.classList.toggle('is-active', i === idx);
        });
        const activeCard = dom.batchItemsContainer.children[idx];
        if (activeCard && typeof activeCard.scrollIntoView === 'function') {
          activeCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }

      renderActiveView();
    });

    tabsList.appendChild(pill);
  });
}

// Sincroniza las ediciones realizadas en el formulario Individual hacia el item del lote activo
function syncStateToActiveBatchItem() {
  if (state.mode !== 'manual') return; // PROTECCIÓN: Solo sincronizar si el usuario está editando activamente en la pestaña Individual
  if (!state.batchItems || state.batchItems.length === 0) return;
  const idx = state.activeBatchIndex;
  const item = state.batchItems[idx];
  if (!item) return;

  item.marca = state.marca || '';
  item.categoria = state.categoria || '';
  item.modelo = state.modelo || '';
  item.nombre = `${item.marca} ${item.modelo}`.trim() || item.nombre;
  item.sku = state.sku || '';
  const cleanNum = (v) => (typeof v === 'number' ? v : (v ? parseCLP(v) : null));
  item.precioCmr = cleanNum(state.precioCmr);
  item.precioCmrNum = item.precioCmr;
  item.precioOferta = cleanNum(state.precioOferta);
  item.precioOfertaNum = item.precioOferta;
  item.precioNormal = cleanNum(state.precioNormal);
  item.precioNormalNum = item.precioNormal;
  item.vigenciaDesde = state.vigenciaDesde;
  item.vigenciaHasta = state.vigenciaHasta;
  item.cae = state.cae;

  // Actualizar el texto del pill en la barra de preview si existe
  if (dom.batchTabsList && dom.batchTabsList.children[idx]) {
    const pill = dom.batchTabsList.children[idx];
    pill.innerHTML = `
      <span>#${idx + 1}</span>
      <strong>${escapeHTML(item.sku || '')}</strong>
      <span>${escapeHTML(item.marca || 'MARCA')}</span>
    `;
  }

  // Actualizar la tarjeta correspondiente en el panel de lote si existe
  if (dom.batchItemsContainer && dom.batchItemsContainer.children[idx]) {
    const card = dom.batchItemsContainer.children[idx];
    const skuEl = card.querySelector('.batch-item-sku');
    if (skuEl) skuEl.textContent = `SKU: ${item.sku}`;
    const brandEl = card.querySelector('.batch-item-brand');
    if (brandEl) brandEl.textContent = item.marca || 'MARCA';
    const nameEl = card.querySelector('.batch-item-name');
    if (nameEl) nameEl.textContent = item.nombre || item.modelo || 'Sin descripción';

    const cmrInput = card.querySelector('.input-batch-cmr');
    if (cmrInput && document.activeElement !== cmrInput) {
      cmrInput.value = item.precioCmr ? formatCLP(item.precioCmr) : '';
    }
    const ofertaInput = card.querySelector('.input-batch-oferta');
    if (ofertaInput && document.activeElement !== ofertaInput) {
      ofertaInput.value = item.precioOferta ? formatCLP(item.precioOferta) : '';
    }
    const normalInput = card.querySelector('.input-batch-normal');
    if (normalInput && document.activeElement !== normalInput) {
      normalInput.value = item.precioNormal ? formatCLP(item.precioNormal) : '';
    }
    const vigenciaInput = card.querySelector('.input-batch-vigencia');
    if (vigenciaInput && document.activeElement !== vigenciaInput) {
      vigenciaInput.value = item.vigenciaHasta || '';
    }
    const caeInput = card.querySelector('.input-batch-cae');
    if (caeInput && document.activeElement !== caeInput) {
      caeInput.value = item.cae || '';
    }
  }
}

// Vincula los eventos interactivos específicos del modo por lote y SKU autofill
function bindBatchEvents() {
  if (dom.tabModeManual) {
    dom.tabModeManual.addEventListener('click', () => switchMode('manual'));
  }
  if (dom.tabModeBatch) {
    dom.tabModeBatch.addEventListener('click', () => switchMode('batch'));
  }

  if (dom.btnAutofillSku) {
    dom.btnAutofillSku.addEventListener('click', () => autofillSingleSku());
  }
  if (dom.inputSku) {
    dom.inputSku.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        autofillSingleSku();
      }
    });
  }

  if (dom.btnLoadBatch) {
    dom.btnLoadBatch.addEventListener('click', () => loadBatchSkus());
  }
  if (dom.btnClearBatch) {
    dom.btnClearBatch.addEventListener('click', () => clearBatch());
  }
  if (dom.btnApplyBatchVigencia) {
    dom.btnApplyBatchVigencia.addEventListener('click', () => applyBatchVigenciaToAll());
  }
  if (dom.inputBatchVigenciaDesde) {
    dom.inputBatchVigenciaDesde.addEventListener('change', (e) => {
      state.batchVigenciaDesde = e.target.value;
    });
  }
  if (dom.inputBatchVigenciaHasta) {
    dom.inputBatchVigenciaHasta.addEventListener('change', (e) => {
      state.batchVigenciaHasta = e.target.value;
    });
  }
  if (dom.inputBatchCae) {
    dom.inputBatchCae.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      if (!isNaN(val)) {
        state.batchCae = val;
        state.cae = val;
        if (dom.inputCae) dom.inputCae.value = e.target.value;
        if (typeof updateCalculos === 'function') updateCalculos();
      }
    });
  }
  if (dom.btnToggleBatchView) {
    dom.btnToggleBatchView.addEventListener('click', () => toggleBatchView());
  }
  if (dom.btnBatchPrint) {
    dom.btnBatchPrint.addEventListener('click', () => {
      if (typeof printBatch === 'function') printBatch(state, renderCartelElement);
    });
  }
  if (dom.btnBatchDownloadPdf) {
    dom.btnBatchDownloadPdf.addEventListener('click', () => {
      if (typeof exportBatchToPDF === 'function') exportBatchToPDF(state, renderCartelElement);
    });
  }

  // Sincronizar estado inicial de botones de acción en pie de página
  const initialMode = state.mode || 'manual';
  if (dom.manualFooterActions && dom.batchFooterActions) {
    const isManual = initialMode === 'manual';
    dom.manualFooterActions.style.display = isManual ? 'flex' : 'none';
    dom.batchFooterActions.style.display = isManual ? 'none' : 'flex';
    dom.manualFooterActions.classList.toggle('hidden', !isManual);
    dom.batchFooterActions.classList.toggle('hidden', isManual);
  }
}

// Exportación global y modular
window.BatchManager = {
  buscarSku,
  fetchProducto,
  aplicarProducto,
  applyProductToState,
  renderActiveView,
  switchMode,
  autofillSingleSku,
  extractBatchSkus,
  loadBatchSkus,
  clearBatch,
  applyBatchVigenciaToAll,
  toggleBatchView,
  renderBatchItemsList,
  renderBatchPreviewTabs,
  syncStateToActiveBatchItem,
  bindBatchEvents
};

// Aliases en window para acceso directo
window.extractBatchSkus = extractBatchSkus;
window.buscarSku = buscarSku;
window.fetchProducto = fetchProducto;
window.aplicarProducto = aplicarProducto;
window.applyProductToState = applyProductToState;
window.renderActiveView = renderActiveView;
window.switchMode = switchMode;
window.autofillSingleSku = autofillSingleSku;
window.loadBatchSkus = loadBatchSkus;
window.clearBatch = clearBatch;
window.applyBatchVigenciaToAll = applyBatchVigenciaToAll;
window.toggleBatchView = toggleBatchView;
window.renderBatchItemsList = renderBatchItemsList;
window.renderBatchPreviewTabs = renderBatchPreviewTabs;
window.syncStateToActiveBatchItem = syncStateToActiveBatchItem;
window.bindBatchEvents = bindBatchEvents;
