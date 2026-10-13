/**
 * Generador de Cartelería Retail - Orquestador Principal
 * Control de ciclo de vida del DOM, eventos reactivos y renderizado en vivo
 */

let dom = {};

// Inicialización de la aplicación al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
  initDOMReferences();
  bindEvents();
  syncFormFromState();
  initCategoriaManager();
  renderCartel();
  applyZoom();
});

// Captura de referencias a elementos interactivos del DOM
function initDOMReferences() {
  dom = {
    // Inputs
    inputMarca: document.getElementById('inputMarca'),
    inputCategoria: document.getElementById('inputCategoria'),
    categoriaDropdown: document.getElementById('categoriaDropdown'),
    categoriaCountBadge: document.getElementById('categoriaCountBadge'),
    btnClearCategoria: document.getElementById('btnClearCategoria'),
    inputModelo: document.getElementById('inputModelo'),
    inputSku: document.getElementById('inputSku'),
    inputVigenciaDesde: document.getElementById('inputVigenciaDesde'),
    inputVigenciaHasta: document.getElementById('inputVigenciaHasta'),
    inputPrecioCmr: document.getElementById('inputPrecioCmr'),
    inputPrecioOferta: document.getElementById('inputPrecioOferta'),
    inputPrecioNormal: document.getElementById('inputPrecioNormal'),
    inputCae: document.getElementById('inputCae'),
    checkAutoCalc: document.getElementById('checkAutoCalc'),
    inputCuotaManual: document.getElementById('inputCuotaManual'),
    inputCtcManual: document.getElementById('inputCtcManual'),
    calcSummaryBox: document.getElementById('calcSummaryBox'),
    calcCuotaDisplay: document.getElementById('calcCuotaDisplay'),
    calcCtcDisplay: document.getElementById('calcCtcDisplay'),
    manualCalcFields: document.getElementById('manualCalcFields'),

    // Canvas / Preview
    previewWrapper: document.getElementById('previewWrapper'),
    cartelContainer: document.getElementById('cartelContainer'),
    zoomLevelText: document.getElementById('zoomLevelText'),

    // Acciones
    btnZoomIn: document.getElementById('btnZoomIn'),
    btnZoomOut: document.getElementById('btnZoomOut'),
    btnZoomReset: document.getElementById('btnZoomReset'),
    btnPrint: document.getElementById('btnPrint'),
    btnDownloadPdf: document.getElementById('btnDownloadPdf'),

    // Selector de plantillas y presets
    templateCards: document.querySelectorAll('.template-card'),
    presetChips: document.querySelectorAll('.preset-chip')
  };
}

// Inicialización del autocompletado inteligente de categorías
function initCategoriaManager() {
  if (window.CategoriasManager && typeof window.CategoriasManager.initAutocomplete === 'function') {
    CategoriasManager.initAutocomplete(
      dom.inputCategoria,
      dom.categoriaDropdown,
      dom.categoriaCountBadge,
      dom.btnClearCategoria
    );
  }
}

// Vinculación de eventos de usuario
function bindEvents() {
  // Inputs de texto
  const textInputs = [
    { el: dom.inputMarca, key: 'marca' },
    { el: dom.inputCategoria, key: 'categoria' },
    { el: dom.inputModelo, key: 'modelo' },
    { el: dom.inputSku, key: 'sku' },
    { el: dom.inputVigenciaDesde, key: 'vigenciaDesde' },
    { el: dom.inputVigenciaHasta, key: 'vigenciaHasta' }
  ];

  textInputs.forEach(item => {
    const handleUpdate = (e) => {
      state[item.key] = e.target.value.trim();
      if (item.key === 'vigenciaDesde' || item.key === 'vigenciaHasta') {
        state.fechasPersonalizadas = true;
      }
      renderCartel();
    };

    item.el.addEventListener('input', handleUpdate);
    if (item.key === 'vigenciaDesde' || item.key === 'vigenciaHasta') {
      item.el.addEventListener('change', handleUpdate);
    }
  });

  // Inputs monetarios con formateo en tiempo real
  const moneyInputs = [
    { el: dom.inputPrecioCmr, key: 'precioCmr' },
    { el: dom.inputPrecioOferta, key: 'precioOferta' },
    { el: dom.inputPrecioNormal, key: 'precioNormal' }
  ];

  moneyInputs.forEach(item => {
    item.el.addEventListener('input', (e) => {
      const num = parseCLP(e.target.value);
      state[item.key] = num;
      if (num !== null) {
        e.target.value = formatCLP(num);
      } else {
        e.target.value = '';
      }
      updateCalculos();
      renderCartel();
    });
  });

  // CAE
  dom.inputCae.addEventListener('input', (e) => {
    state.cae = parseFloat(e.target.value) || 0;
    updateCalculos();
    renderCartel();
  });

  // Checkbox de autocalcular cuotas
  dom.checkAutoCalc.addEventListener('change', (e) => {
    state.autoCalcularCuotas = e.target.checked;
    dom.manualCalcFields.style.display = state.autoCalcularCuotas ? 'none' : 'grid';
    updateCalculos();
    renderCartel();
  });

  // Inputs manuales de cuotas
  dom.inputCuotaManual.addEventListener('input', (e) => {
    state.cuotaMontoManual = parseCLP(e.target.value) || 0;
    e.target.value = formatCLP(state.cuotaMontoManual);
    renderCartel();
  });

  dom.inputCtcManual.addEventListener('input', (e) => {
    state.ctcManual = parseCLP(e.target.value) || 0;
    e.target.value = formatCLP(state.ctcManual);
    renderCartel();
  });

  // Selector de plantillas
  dom.templateCards.forEach(card => {
    card.addEventListener('click', () => {
      dom.templateCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      state.template = card.dataset.template;
      renderCartel();
      showToast(`Plantilla cambiada a ${card.dataset.name}`);
    });
  });

  // Zoom
  dom.btnZoomIn.addEventListener('click', () => {
    state.zoom = Math.min(state.zoom + 0.1, 1.6);
    applyZoom();
  });

  dom.btnZoomOut.addEventListener('click', () => {
    state.zoom = Math.max(state.zoom - 0.1, 0.4);
    applyZoom();
  });

  dom.btnZoomReset.addEventListener('click', () => {
    state.zoom = state.zoom === 0.75 ? 1.0 : 0.75;
    applyZoom();
  });

  // Botón Imprimir
  dom.btnPrint.addEventListener('click', () => {
    window.print();
  });

  // Manejadores nativos para garantizar escala 1:1 en la impresión del navegador
  window.addEventListener('beforeprint', () => {
    if (dom.previewWrapper) {
      dom.previewWrapper.style.transform = 'none';
    }
  });

  window.addEventListener('afterprint', () => {
    applyZoom();
  });

  // Botón Descargar PDF
  dom.btnDownloadPdf.addEventListener('click', () => {
    exportToPDF();
  });

  // Chips de presets
  dom.presetChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const type = chip.dataset.preset;
      applyPreset(type);
    });
  });
}

// Aplicar zoom visual al preview
function applyZoom() {
  dom.previewWrapper.style.transform = `scale(${state.zoom})`;
  dom.zoomLevelText.textContent = `${Math.round(state.zoom * 100)}%`;
}

// Renderizador principal del Cartel en el DOM
function renderCartel() {
  const container = dom.cartelContainer;
  if (!container) return;
  container.innerHTML = '';

  const tpl = state.template;
  const hasCmr = state.precioCmr && state.precioCmr > 0;
  const hasOferta = state.precioOferta && state.precioOferta > 0;
  const hasNormal = state.precioNormal && state.precioNormal > 0;

  // Determinar modo
  let modoClass = '';
  if (!hasCmr && !hasOferta && hasNormal) {
    modoClass = 'solo-normal';
  } else if (!hasCmr && hasOferta) {
    modoClass = 'sin-cmr';
  }

  const sheet = document.createElement('div');
  sheet.className = `cartel-sheet ${tpl} ${modoClass}`;

  // Formateo de fechas
  const fDesde = formatDateChile(state.vigenciaDesde);
  const fHasta = formatDateChile(state.vigenciaHasta);
  const vigenciaStr = (fDesde && fHasta) ? `VIGENCIA ${fDesde} A ${fHasta}` : 'VIGENCIA DISPONIBLE EN TIENDA';

  // Cálculos de cuota
  const financiamiento = getValoresCuotaActuales();

  // Renderizar según plantilla seleccionada
  if (tpl === 'p118' || tpl === 'p132') {
    renderVerticalTemplate(sheet, tpl, {
      hasCmr,
      hasOferta,
      hasNormal,
      vigenciaStr,
      financiamiento
    });
  } else if (tpl === 't-15x21') {
    render15x21(sheet, {
      hasCmr,
      hasOferta,
      hasNormal,
      vigenciaStr,
      financiamiento
    });
  } else if (tpl === 't-9x13') {
    render9x13(sheet, {
      hasCmr,
      hasOferta,
      hasNormal,
      vigenciaStr,
      financiamiento
    });
  } else if (tpl === 't-9x7') {
    render9x7(sheet, {
      hasCmr,
      hasOferta,
      hasNormal,
      vigenciaStr,
      financiamiento
    });
  } else if (tpl === 'p123') {
    renderFlejeHorizontal(sheet, {
      hasCmr,
      hasOferta,
      hasNormal,
      vigenciaStr
    });
  } else if (tpl === 't-12x3') {
    render12x3(sheet, {
      hasCmr,
      hasOferta,
      hasNormal,
      vigenciaStr
    });
  } else if (tpl === 'p121') {
    renderFichaP121(sheet, {
      hasCmr,
      hasOferta,
      hasNormal,
      vigenciaStr,
      financiamiento
    });
  } else if (tpl === 't-6x4') {
    render6x4(sheet, {
      hasCmr,
      hasOferta,
      hasNormal,
      vigenciaStr,
      financiamiento
    });
  } else if (tpl === 't-6x4-sheet') {
    render6x4Sheet(sheet, {
      hasCmr,
      hasOferta,
      hasNormal,
      vigenciaStr,
      financiamiento
    });
  }

  container.appendChild(sheet);

  // Generar QR para las plantillas que lo soportan (P_118, P_132 y 15x21)
  if (tpl === 'p118' || tpl === 'p132' || tpl === 't-15x21') {
    const qrTarget = sheet.querySelector('.qr-box');
    if (qrTarget) {
      generateQRCode(qrTarget, state.sku);
    }
  }
}
