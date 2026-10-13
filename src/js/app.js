/**
 * Generador de Cartelería Retail - Orquestador Principal
 * Control de ciclo de vida del DOM, eventos reactivos y renderizado en vivo
 */

let dom = {};

// Detección precisa de dispositivos móviles (teléfonos/tablets) para aplicar escala 90% en impresión móvil sin alterar PC
function detectMobileDevice() {
  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) ||
                   (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (isMobile) {
    document.documentElement.classList.add('is-mobile-device');
    document.body.classList.add('is-mobile-device');
  } else {
    document.documentElement.classList.remove('is-mobile-device');
    document.body.classList.remove('is-mobile-device');
  }
  return isMobile;
}

// Inicialización de la aplicación al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
  detectMobileDevice();
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
    btnZoomFit: document.getElementById('btnZoomFit'),
    btnPrint: document.getElementById('btnPrint'),
    btnDownloadPdf: document.getElementById('btnDownloadPdf'),

    // Layout y Móvil
    appLayout: document.getElementById('appLayout'),
    canvasContainer: document.getElementById('canvasContainer'),
    tabEditor: document.getElementById('tabEditor'),
    tabPreview: document.getElementById('tabPreview'),
    btnViewCartelMobile: document.getElementById('btnViewCartelMobile'),
    btnBackEditorMobile: document.getElementById('btnBackEditorMobile'),
    btnPrintMobile: document.getElementById('btnPrintMobile'),
    btnDownloadPdfMobile: document.getElementById('btnDownloadPdfMobile'),

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
    state.zoom = Math.min(Math.round((state.zoom + 0.1) * 100) / 100, 1.8);
    applyZoom();
  });

  dom.btnZoomOut.addEventListener('click', () => {
    state.zoom = Math.max(Math.round((state.zoom - 0.1) * 100) / 100, 0.2);
    applyZoom();
  });

  dom.btnZoomReset.addEventListener('click', () => {
    state.zoom = state.zoom === 0.75 ? 1.0 : 0.75;
    applyZoom();
  });

  if (dom.btnZoomFit) {
    dom.btnZoomFit.addEventListener('click', () => {
      autoFitZoom();
    });
  }

  // Disparador de impresión con preparación previa del DOM (vital para Chrome en iOS y WKWebView)
  function triggerPrint() {
    detectMobileDevice();
    const prevTab = dom.appLayout ? dom.appLayout.dataset.activeTab : 'editor';

    // 1. Asegurar que la pestaña activa sea preview para que el cartel esté visible en el render-tree móvil
    if (dom.appLayout) {
      dom.appLayout.dataset.activeTab = 'preview';
    }

    // 2. Desactivar transform de zoom inmediatamente (Chrome iOS no dispara beforeprint)
    const prevTransform = dom.previewWrapper ? dom.previewWrapper.style.transform : '';
    const prevTransition = dom.previewWrapper ? dom.previewWrapper.style.transition : '';
    if (dom.previewWrapper) {
      dom.previewWrapper.style.transition = 'none';
      dom.previewWrapper.style.transform = 'none';
    }

    // 3. Pequeña espera para reflujo garantizado antes de invocar el motor de impresión nativo
    setTimeout(() => {
      window.print();

      // 4. Restaurar zoom y pestaña después de presentar el diálogo de impresión
      setTimeout(() => {
        if (dom.previewWrapper) {
          dom.previewWrapper.style.transform = prevTransform;
          dom.previewWrapper.style.transition = prevTransition;
        }
        if (dom.appLayout) {
          dom.appLayout.dataset.activeTab = prevTab;
        }
      }, 500);
    }, 120);
  }

  // Botón Imprimir
  dom.btnPrint.addEventListener('click', () => {
    triggerPrint();
  });

  // Manejadores nativos para garantizar escala adecuada en la impresión del navegador
  window.addEventListener('beforeprint', () => {
    detectMobileDevice();
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

  // Eventos de Navegación Móvil
  if (dom.tabEditor) {
    dom.tabEditor.addEventListener('click', () => switchMobileTab('editor'));
  }
  if (dom.tabPreview) {
    dom.tabPreview.addEventListener('click', () => switchMobileTab('preview'));
  }
  if (dom.btnViewCartelMobile) {
    dom.btnViewCartelMobile.addEventListener('click', () => switchMobileTab('preview'));
  }
  if (dom.btnBackEditorMobile) {
    dom.btnBackEditorMobile.addEventListener('click', () => switchMobileTab('editor'));
  }
  if (dom.btnPrintMobile) {
    dom.btnPrintMobile.addEventListener('click', () => triggerPrint());
  }
  if (dom.btnDownloadPdfMobile) {
    dom.btnDownloadPdfMobile.addEventListener('click', () => exportToPDF());
  }

  // Ajuste automático al redimensionar pantalla
  window.addEventListener('resize', () => {
    if (window.innerWidth <= 900 && dom.appLayout && dom.appLayout.dataset.activeTab === 'preview') {
      autoFitZoom();
    }
  });
}

// Aplicar zoom visual al preview
function applyZoom() {
  dom.previewWrapper.style.transform = `scale(${state.zoom})`;
  dom.zoomLevelText.textContent = `${Math.round(state.zoom * 100)}%`;
}

// Cambiar pestaña activa en dispositivos móviles
function switchMobileTab(tab) {
  if (!dom.appLayout) return;
  dom.appLayout.dataset.activeTab = tab;

  if (dom.tabEditor && dom.tabPreview) {
    dom.tabEditor.classList.toggle('is-active', tab === 'editor');
    dom.tabPreview.classList.toggle('is-active', tab === 'preview');
  }

  if (tab === 'preview') {
    setTimeout(() => {
      autoFitZoom();
    }, 40);
  }
}

// Auto-ajustar zoom al ancho visible de pantalla
function autoFitZoom() {
  if (!dom.canvasContainer || !dom.cartelContainer) return;
  const sheet = dom.cartelContainer.querySelector('.cartel-sheet') || dom.cartelContainer.firstElementChild;
  if (!sheet) return;

  const containerWidth = dom.canvasContainer.clientWidth;
  const sheetWidth = sheet.offsetWidth || 794;

  if (containerWidth > 0 && sheetWidth > 0) {
    const isMobile = window.innerWidth <= 900;
    const padding = isMobile ? 24 : 60;
    const idealZoom = Math.min(Math.max((containerWidth - padding) / sheetWidth, 0.2), 1.4);
    state.zoom = Math.round(idealZoom * 100) / 100;
    applyZoom();
  }
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
