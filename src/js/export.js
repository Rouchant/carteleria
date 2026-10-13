/**
 * Módulo de exportación a PDF de alta resolución (300 DPI)
 */

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

    // Si estamos en móvil y en la pestaña de editor, activar temporalmente preview para que el cartel tenga dimensiones reales y html2canvas lo capture sin error
    if (dom && dom.appLayout) {
      prevTab = dom.appLayout.dataset.activeTab || '';
      if (prevTab === 'editor') {
        dom.appLayout.dataset.activeTab = 'preview';
      }
    }

    // Opciones milimétricas de papel según formato
    let pdfConfig = {
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter'
    };

    if (state.template === 'p118' || state.template === 't-6x4-sheet') {
      pdfConfig = { orientation: 'portrait', unit: 'mm', format: [216, 279] };
    } else if (state.template === 't-15x21') {
      pdfConfig = { orientation: 'portrait', unit: 'mm', format: [150, 210] };
    } else if (state.template === 'p132') {
      pdfConfig = { orientation: 'portrait', unit: 'mm', format: [130, 190] };
    } else if (state.template === 't-9x13') {
      pdfConfig = { orientation: 'portrait', unit: 'mm', format: [90, 130] };
    } else if (state.template === 't-9x7') {
      pdfConfig = { orientation: 'landscape', unit: 'mm', format: [90, 70] };
    } else if (state.template === 'p123') {
      pdfConfig = { orientation: 'landscape', unit: 'mm', format: [210, 48] };
    } else if (state.template === 't-12x3') {
      pdfConfig = { orientation: 'landscape', unit: 'mm', format: [120, 30] };
    } else if (state.template === 'p121') {
      pdfConfig = { orientation: 'landscape', unit: 'mm', format: [140, 95] };
    } else if (state.template === 't-6x4') {
      pdfConfig = { orientation: 'landscape', unit: 'mm', format: [60, 40] };
    }

    // Asegurar que las fuentes locales Lato estén 100% listas en memoria antes de capturar
    if (document.fonts) {
      await document.fonts.ready;
    }

    // Dimensiones de plantilla en mm como fallback infalible ante cualquier estado del DOM
    const templateDims = {
      p118: { w: 216, h: 279 },
      't-6x4-sheet': { w: 216, h: 279 },
      't-15x21': { w: 150, h: 210 },
      p132: { w: 130, h: 190 },
      't-9x13': { w: 90, h: 130 },
      't-9x7': { w: 90, h: 70 },
      p123: { w: 210, h: 48 },
      't-12x3': { w: 120, h: 30 },
      p121: { w: 140, h: 95 },
      't-6x4': { w: 60, h: 40 }
    };
    const curDim = templateDims[state.template] || { w: 216, h: 279 };
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
