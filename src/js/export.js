/**
 * Mapeo completo de configuración para formatos y dimensiones de carteles
 */
const TEMPLATE_CONFIG_MAP = {
  'p118':        { name: 'Carta (P_118)',    w: 216, h: 279, orientation: 'portrait',  format: [216, 279] },
  't-6x4-sheet': { name: '6x4 Rejilla 18x', w: 216, h: 279, orientation: 'portrait',  format: [216, 279] },
  't-15x21':     { name: '153 (15x21)',     w: 150, h: 210, orientation: 'portrait',  format: [150, 210] },
  'p132':        { name: '151 (13x19)',     w: 130, h: 190, orientation: 'portrait',  format: [130, 190] },
  't-9x13':      { name: '131 (9x13)',      w: 90,  h: 130, orientation: 'portrait',  format: [90, 130] },
  't-9x7':       { name: '130 (9x7)',       w: 90,  h: 70,  orientation: 'landscape', format: [90, 70] },
  'p123':        { name: '210x48 Fleje',    w: 210, h: 48,  orientation: 'landscape', format: [210, 48] },
  't-12x3':      { name: '263 (12x3)',      w: 120, h: 30,  orientation: 'landscape', format: [120, 30] },
  'p121':        { name: 'Ficha P_121',     w: 140, h: 95,  orientation: 'landscape', format: [140, 95] },
  't-6x4':       { name: '308 (6x4)',       w: 60,  h: 40,  orientation: 'landscape', format: [60, 40] }
};

// Obtiene la configuración de papel milimétrico por plantilla usando el mapeo declarativo
function getPDFConfigForTemplate(tpl) {
  const cfg = TEMPLATE_CONFIG_MAP[tpl] || TEMPLATE_CONFIG_MAP['p118'];
  return {
    orientation: cfg.orientation,
    unit: 'mm',
    format: cfg.format
  };
}

// Carga dinámica bajo demanda de librerías de exportación pesadas (jspdf y html2canvas)
// Evita bloquear el renderizado inicial de la página y reduce el bundle inicial en >550 KiB
let _exportLibsPromise = null;
function ensureExportLibraries() {
  if (window.html2canvas && window.jspdf) {
    return Promise.resolve();
  }
  if (!_exportLibsPromise) {
    _exportLibsPromise = new Promise((resolve, reject) => {
      const loadScript = (src) => new Promise((res, rej) => {
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.onload = res;
        script.onerror = rej;
        document.head.appendChild(script);
      });
      const promises = [];
      if (!window.html2canvas) promises.push(loadScript('src/lib/html2canvas.min.js'));
      if (!window.jspdf) promises.push(loadScript('src/lib/jspdf.umd.min.js'));
      Promise.all(promises).then(() => resolve()).catch(reject);
    });
  }
  return _exportLibsPromise;
}

// Pre-carga silenciosa cuando la CPU del navegador entra en estado ocioso (idle)
if (typeof window !== 'undefined') {
  const idlePreload = () => {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => { ensureExportLibraries(); }, { timeout: 3500 });
    } else {
      setTimeout(() => { ensureExportLibraries(); }, 2500);
    }
  };
  if (document.readyState === 'complete') {
    idlePreload();
  } else {
    window.addEventListener('load', idlePreload);
  }
}

// Exportador a PDF de Alta Resolución (300 DPI) usando jsPDF y html2canvas
async function exportToPDF() {
  const sheet = dom.cartelContainer.querySelector('.cartel-sheet');
  if (!sheet) return;

  const btn = dom.btnDownloadPdf;
  const btnMobile = dom.btnDownloadPdfMobile;
  const originalText = btn ? btn.innerHTML : '';
  const originalTextMobile = btnMobile ? btnMobile.innerHTML : '';

  const spinnerHtml = `<svg class="spinner" viewBox="0 0 50 50" style="width:16px;height:16px;animation:spin 1s linear infinite;"><circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" stroke-width="5" stroke-dasharray="31.4 31.4"></circle></svg> Generando PDF...`;
  if (btn) {
    btn.innerHTML = spinnerHtml;
    btn.disabled = true;
  }
  if (btnMobile) {
    btnMobile.innerHTML = spinnerHtml;
    btnMobile.disabled = true;
  }

  let prevTransform = '';
  let prevTransition = '';
  let prevTab = '';

  // Temporizador de seguridad para evitar que el botón quede bloqueado bajo cualquier contingencia
  const safetyTimer = setTimeout(() => {
    if (btn) {
      btn.innerHTML = originalText;
      btn.disabled = false;
    }
    if (btnMobile) {
      btnMobile.innerHTML = originalTextMobile;
      btnMobile.disabled = false;
    }
  }, 8000);

  try {
    showToast('Procesando PDF en alta resolución...');
    await ensureExportLibraries();

    // Si estamos en móvil y en la pestaña de editor, activar temporalmente preview para que el cartel tenga dimensiones reales y html2canvas lo capture sin error
    if (dom && dom.appLayout) {
      prevTab = dom.appLayout.dataset.activeTab || '';
      if (prevTab === 'editor') {
        dom.appLayout.dataset.activeTab = 'preview';
      }
    }

    // Configuración milimétrica declarativa según formato
    const pdfConfig = getPDFConfigForTemplate(state.template);

    // Asegurar que las fuentes locales Lato estén 100% listas en memoria antes de capturar
    if (document.fonts) {
      await document.fonts.ready;
    }

    // Dimensiones milimétricas exactas desde el mapeo
    const curDim = TEMPLATE_CONFIG_MAP[state.template] || TEMPLATE_CONFIG_MAP['p118'];
    const mmToPx = 96 / 25.4;
    const fallbackWidth = Math.round(curDim.w * mmToPx);
    const fallbackHeight = Math.round(curDim.h * mmToPx);

    // Desactivar temporalmente el zoom de la vista previa para que html2canvas capture a escala 1:1 real
    prevTransform = (dom && dom.previewWrapper) ? dom.previewWrapper.style.transform : '';
    prevTransition = (dom && dom.previewWrapper) ? dom.previewWrapper.style.transition : '';
    if (dom && dom.previewWrapper) {
      dom.previewWrapper.style.transition = 'none';
      dom.previewWrapper.style.transform = 'none';
    }

    // Forzar reflujo y obtener dimensiones garantizadas (nunca 0)
    const sheetWidth = (sheet.offsetWidth && sheet.offsetWidth > 50) ? sheet.offsetWidth : fallbackWidth;
    const sheetHeight = (sheet.offsetHeight && sheet.offsetHeight > 50) ? sheet.offsetHeight : fallbackHeight;

    // Renderizado en alta resolución fotográfica (300 DPI) con jsPDF y html2canvas
    const canvas = await html2canvas(sheet, {
      scale: 3, // 3x equivale a ~300 DPI
      width: sheetWidth,
      height: sheetHeight,
      scrollX: 0,
      scrollY: 0,
      windowWidth: Math.max(1200, sheetWidth + 100),
      windowHeight: Math.max(1200, sheetHeight + 100),
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      onclone: (clonedDoc) => {
        // Asegurar que appLayout esté en 'preview' y no oculte el contenedor por media query móvil
        const clonedLayout = clonedDoc.getElementById('appLayout');
        if (clonedLayout) {
          clonedLayout.setAttribute('data-active-tab', 'preview');
        }

        // Inyectar estilos para asegurar que el área de previsualización sea 100% visible en el clon
        const exportFixStyle = clonedDoc.createElement('style');
        exportFixStyle.textContent = `
          .app-layout[data-active-tab="editor"] .preview-stage,
          .preview-stage {
            display: block !important;
            visibility: visible !important;
            width: auto !important;
            height: auto !important;
            overflow: visible !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .editor-sidebar,
          .mobile-nav-bar,
          .preview-toolbar,
          .mobile-preview-actions,
          .app-watermark {
            display: none !important;
          }
          .preview-canvas-container {
            display: block !important;
            width: auto !important;
            height: auto !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
          }
          .preview-wrapper {
            display: block !important;
            width: auto !important;
            height: auto !important;
            transform: none !important;
            transition: none !important;
            margin: 0 !important;
            padding: 0 !important;
          }
        `;
        clonedDoc.head.appendChild(exportFixStyle);

        const clonedWrapper = clonedDoc.getElementById('previewWrapper');
        if (clonedWrapper) {
          clonedWrapper.style.transition = 'none';
          clonedWrapper.style.transform = 'none';
        }

        const clonedContainer = clonedDoc.getElementById('canvasContainer');
        if (clonedContainer) {
          clonedContainer.style.overflow = 'visible';
          clonedContainer.style.padding = '0';
        }

        // Sincronizar fuentes locales cargadas en el documento con el iframe clonado
        if (clonedDoc.fonts && document.fonts && typeof document.fonts.forEach === 'function') {
          document.fonts.forEach(font => {
            try {
              clonedDoc.fonts.add(font);
            } catch (e) {}
          });
        }

        const clonedSheet = clonedDoc.querySelector('.cartel-sheet');
        if (clonedSheet) {
          clonedSheet.style.transform = 'none';
          clonedSheet.style.boxShadow = 'none';
          clonedSheet.style.outline = 'none';
          clonedSheet.style.border = 'none';
          // Espaciado sutil para evitar colapso de métricas en canvas sin alterar el diseño
          clonedSheet.style.letterSpacing = '0.02px';
          clonedSheet.style.wordSpacing = 'normal';
          clonedSheet.style.textRendering = 'auto';
          clonedSheet.style.webkitFontSmoothing = 'antialiased';
        }

        // Asegurar que ninguna guía de corte ni pseudo-elemento aparezca en el PDF generado
        const noCutStyle = clonedDoc.createElement('style');
        noCutStyle.textContent = '.cartel-sheet::after, .cartel-sheet::before { display: none !important; content: none !important; border: none !important; }';
        clonedDoc.head.appendChild(noCutStyle);
      }
    });

    const imgData = canvas.toDataURL('image/png');

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF(pdfConfig);

    const pdfWidth = doc.internal.pageSize.getWidth();
    const pdfHeight = doc.internal.pageSize.getHeight();

    doc.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');

    const filename = `Cartel_${state.template.toUpperCase()}_${(state.marca || 'PRODUCTO').replace(/\s+/g, '_')}_${state.sku || 'SKU'}.pdf`;

    // Detección de dispositivos iOS (iPhone, iPad, iPod)
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
                  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    if (isIOS) {
      const pdfBlob = doc.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);

      // Usar enlace de descarga directa compatible con Safari iOS 13+
      const downloadLink = document.createElement('a');
      downloadLink.href = blobUrl;
      downloadLink.download = filename;
      downloadLink.rel = 'noopener';
      document.body.appendChild(downloadLink);
      downloadLink.click();

      setTimeout(() => {
        if (downloadLink.parentNode) {
          downloadLink.parentNode.removeChild(downloadLink);
        }
        URL.revokeObjectURL(blobUrl);
      }, 3000);

      showToast(`PDF listo. Revisa tus descargas.`);
    } else {
      // Descarga directa tradicional en escritorio y Android
      doc.save(filename);
      showToast(`PDF "${filename}" descargado con éxito`);
    }
  } catch (error) {
    console.error('Error al generar PDF:', error);
    showToast('Error al generar PDF. Utiliza la opción de "Imprimir" para guardarlo.', 'error');
  } finally {
    clearTimeout(safetyTimer);

    // Reactivar botón inmediatamente
    if (btn) {
      btn.innerHTML = originalText;
      btn.disabled = false;
    }
    if (btnMobile) {
      btnMobile.innerHTML = originalTextMobile;
      btnMobile.disabled = false;
    }

    // Restaurar pestaña activa original si se modificó
    try {
      if (dom && dom.appLayout && prevTab) {
        dom.appLayout.dataset.activeTab = prevTab;
      }
    } catch (e) {
      console.warn('Advertencia restaurando pestaña:', e);
    }

    // Restaurar el zoom original de la vista previa
    try {
      if (dom && dom.previewWrapper) {
        dom.previewWrapper.style.transform = prevTransform;
        dom.previewWrapper.style.transition = prevTransition;
      }
    } catch (e) {
      console.warn('Advertencia restaurando vista previa:', e);
    }
  }
}

/**
 * Configuración de capacidad y agrupación por hoja Carta para impresión y exportación de lotes
 */
const BATCH_GROUPING_CONFIG = {
  't-12x3':      { capacity: 8,  layoutClass: 'layout-12x3' },
  't-6x4':       { capacity: 18, layoutClass: 'layout-6x4' },
  't-6x4-sheet': { capacity: 1,  layoutClass: 'layout-single' },
  't-9x7':       { capacity: 6,  layoutClass: 'layout-9x7' },
  't-9x13':      { capacity: 4,  layoutClass: 'layout-9x13' },
  'p132':        { capacity: 1,  layoutClass: 'layout-single' },
  't-15x21':     { capacity: 1,  layoutClass: 'layout-single' },
  'p153':        { capacity: 1,  layoutClass: 'layout-single' },
  'p118':        { capacity: 1,  layoutClass: 'layout-single' }
};

/**
 * Agrupa los items de un lote en hojas tamaño Carta físicas según su formato
 */
function buildBatchPrintPages(items, template) {
  const groupCfg = BATCH_GROUPING_CONFIG[template] || { capacity: 1, layoutClass: 'layout-single' };
  const pages = [];
  const capacity = groupCfg.capacity;
  const targetTemplate = template;

  // Si el formato es de 1 por página (Carta P_118, Góndola 13x19 P_132, Pedestal 15x21, 6x4 Rejilla 18x Hoja Completa):
  // Retornar directamente cada .cartel-sheet sin envolver en contenedor .batch-print-page,
  // garantizando un renderizado 100% idéntico a la impresión individual sin deformaciones ni compresión flex.
  if (capacity === 1) {
    items.forEach((item) => {
      applyProductToState(item);
      const sheet = (typeof renderCartelElement === 'function')
        ? renderCartelElement(targetTemplate)
        : null;
      if (sheet) {
        sheet.classList.add('batch-print-item');
        pages.push(sheet);
      }
    });
    return pages;
  }

  // Para formatos pequeños múltiples por página Carta (12x3, 6x4, 9x7, 9x13):
  for (let i = 0; i < items.length; i += capacity) {
    const chunk = items.slice(i, i + capacity);
    const page = document.createElement('div');
    page.className = `batch-print-page ${groupCfg.layoutClass}`;

    chunk.forEach((item) => {
      applyProductToState(item);
      const sheet = (typeof renderCartelElement === 'function')
        ? renderCartelElement(targetTemplate)
        : null;
      if (sheet) {
        sheet.classList.add('batch-print-item');
        page.appendChild(sheet);
      }
    });

    pages.push(page);
  }

  return pages;
}

// Exportador a PDF de Lote Multi-SKU (todas las hojas Carta en un único documento multipágina)
async function exportBatchToPDF() {
  const items = (state.batchItems || []).filter(item => item.status === 'success' || item.sku);
  if (!items.length) {
    showToast('No hay productos cargados en el lote para exportar.', 'warning');
    return;
  }

  const btn = dom.btnBatchDownloadPdf;
  const originalText = btn ? btn.innerHTML : '';
  const spinnerHtml = `<svg class="spinner" viewBox="0 0 50 50" style="width:16px;height:16px;animation:spin 1s linear infinite;"><circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" stroke-width="5" stroke-dasharray="31.4 31.4"></circle></svg> Exportando Lote...`;
  if (btn) {
    btn.innerHTML = spinnerHtml;
    btn.disabled = true;
  }

  const safetyTimer = setTimeout(() => {
    if (btn) {
      btn.innerHTML = originalText;
      btn.disabled = false;
    }
  }, 45000);

  const savedState = { ...state };
  let prevTransform = (dom && dom.previewWrapper) ? dom.previewWrapper.style.transform : '';
  let prevTransition = (dom && dom.previewWrapper) ? dom.previewWrapper.style.transition : '';
  const prevTab = dom.appLayout ? dom.appLayout.dataset.activeTab : 'editor';
  const originalContent = dom.cartelContainer ? dom.cartelContainer.innerHTML : '';

  try {
    showToast(`Generando PDF con ${items.length} carteles agrupados...`);
    await ensureExportLibraries();
    if (document.fonts) await document.fonts.ready;

    if (dom.appLayout) {
      dom.appLayout.dataset.activeTab = 'preview';
    }

    if (dom && dom.previewWrapper) {
      dom.previewWrapper.style.transition = 'none';
      dom.previewWrapper.style.transform = 'none';
    }

    const pages = buildBatchPrintPages(items, state.template);
    const mmToPx = 96 / 25.4;
    // Dimensiones estándar Hoja Carta: 216 x 279 mm
    const targetWidth = Math.round(216 * mmToPx);
    const targetHeight = Math.round(279 * mmToPx);

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [216, 279]
    });
    const pdfWidth = doc.internal.pageSize.getWidth();
    const pdfHeight = doc.internal.pageSize.getHeight();

    for (let pIdx = 0; pIdx < pages.length; pIdx++) {
      const page = pages[pIdx];
      dom.cartelContainer.innerHTML = '';
      dom.cartelContainer.appendChild(page);

      const canvas = await html2canvas(page, {
        scale: 3.125,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: targetWidth,
        height: targetHeight,
        windowWidth: targetWidth,
        windowHeight: targetHeight,
        onclone: (clonedDoc) => {
          const clonedTarget = clonedDoc.querySelector('.batch-print-page') || clonedDoc.querySelector('.cartel-sheet');
          if (clonedTarget) {
            clonedTarget.style.transform = 'none';
            clonedTarget.style.boxShadow = 'none';
          }
        }
      });

      const imgData = canvas.toDataURL('image/png');
      if (pIdx > 0) {
        doc.addPage([216, 279], 'portrait');
      }
      doc.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
    }

    const filename = `Carteleria_Lote_${items.length}_Carteles_${state.template.toUpperCase()}.pdf`;
    doc.save(filename);
    showToast(`PDF de lote "${filename}" descargado con éxito (${pages.length} páginas Carta, ${items.length} productos)`);
  } catch (err) {
    console.error('Error generando PDF de lote:', err);
    showToast('Error al generar PDF de lote. Intenta imprimir como alternativa.', 'error');
  } finally {
    clearTimeout(safetyTimer);
    if (btn) {
      btn.innerHTML = originalText;
      btn.disabled = false;
    }
    Object.assign(state, savedState);
    if (dom.appLayout) {
      dom.appLayout.dataset.activeTab = prevTab;
    }
    if (dom && dom.previewWrapper) {
      dom.previewWrapper.style.transform = prevTransform;
      dom.previewWrapper.style.transition = prevTransition;
    }
    if (dom.cartelContainer) {
      dom.cartelContainer.innerHTML = originalContent;
    }
    renderActiveView();
  }
}

// Impresión completa de todo el Lote en una única tirada agrupada en hojas Carta
function printBatch() {
  const items = (state.batchItems || []).filter(item => item.status === 'success' || item.sku);
  if (!items.length) {
    showToast('No hay productos en el lote para imprimir.', 'warning');
    return;
  }

  const container = dom.cartelContainer;
  if (!container) return;

  const bar = dom.batchPreviewBar || document.getElementById('batchPreviewBar');
  const prevBarDisplay = bar ? bar.style.display : '';
  const prevTransform = dom.previewWrapper ? dom.previewWrapper.style.transform : '';
  const prevTransition = dom.previewWrapper ? dom.previewWrapper.style.transition : '';
  const prevTab = dom.appLayout ? dom.appLayout.dataset.activeTab : 'editor';

  const originalContent = container.innerHTML;
  const savedState = { ...state };

  document.body.classList.add('is-batch-printing');

  try {
    // 1. Asegurar pestaña preview para que el cartel esté visible en el render-tree
    if (dom.appLayout) {
      dom.appLayout.dataset.activeTab = 'preview';
    }

    // 2. Ocultar de manera garantizada la barra de pestañas del lote para evitar que aparezca en el papel
    if (bar) bar.style.display = 'none';

    // 3. Desactivar transformaciones de escala/zoom para que el papel reciba las dimensiones físicas nativas
    if (dom.previewWrapper) {
      dom.previewWrapper.style.transition = 'none';
      dom.previewWrapper.style.transform = 'none';
    }

    container.innerHTML = '';
    const pages = buildBatchPrintPages(items, state.template);
    pages.forEach(page => container.appendChild(page));

    // 4. Pausa tras asegurar que las fuentes y recursos estén listos antes de invocar el motor de impresión
    const triggerNativePrint = () => {
      window.print();

      // 5. Restauración segura después de que el usuario interactúa con el diálogo de impresión
      setTimeout(() => {
        document.body.classList.remove('is-batch-printing');
        if (dom.appLayout) dom.appLayout.dataset.activeTab = prevTab;
        if (bar) bar.style.display = prevBarDisplay;
        if (dom.previewWrapper) {
          dom.previewWrapper.style.transform = prevTransform;
          dom.previewWrapper.style.transition = prevTransition;
        }
        Object.assign(state, savedState);
        container.innerHTML = originalContent;
        renderActiveView();
      }, 500);
    };

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => setTimeout(triggerNativePrint, 120));
    } else {
      setTimeout(triggerNativePrint, 150);
    }
  } catch (err) {
    console.error('Error en printBatch:', err);
    document.body.classList.remove('is-batch-printing');
    if (dom.appLayout) dom.appLayout.dataset.activeTab = prevTab;
    if (bar) bar.style.display = prevBarDisplay;
    if (dom.previewWrapper) {
      dom.previewWrapper.style.transform = prevTransform;
      dom.previewWrapper.style.transition = prevTransition;
    }
    Object.assign(state, savedState);
    container.innerHTML = originalContent;
    renderActiveView();
  }
}


