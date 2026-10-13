/**
 * Módulo de exportación a PDF de alta resolución (300 DPI)
 */

// Exportador a PDF de Alta Resolución (300 DPI) usando jsPDF y html2canvas
async function exportToPDF() {
  const sheet = dom.cartelContainer.querySelector('.cartel-sheet');
  if (!sheet) return;

  const btn = dom.btnDownloadPdf;
  const originalText = btn.innerHTML;
  btn.innerHTML = `<svg class="spinner" viewBox="0 0 50 50" style="width:16px;height:16px;animation:spin 1s linear infinite;"><circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" stroke-width="5" stroke-dasharray="31.4 31.4"></circle></svg> Generando PDF...`;
  btn.disabled = true;

  let prevTransform = '';
  let prevTransition = '';

  // Temporizador de seguridad para evitar que el botón quede bloqueado bajo cualquier contingencia
  const safetyTimer = setTimeout(() => {
    if (btn) {
      btn.innerHTML = originalText;
      btn.disabled = false;
    }
  }, 8000);

  try {
    showToast('Procesando PDF en alta resolución...');

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

    // Desactivar temporalmente el zoom de la vista previa para que html2canvas capture a escala 1:1 real
    prevTransform = (dom && dom.previewWrapper) ? dom.previewWrapper.style.transform : '';
    prevTransition = (dom && dom.previewWrapper) ? dom.previewWrapper.style.transition : '';
    if (dom && dom.previewWrapper) {
      dom.previewWrapper.style.transition = 'none';
      dom.previewWrapper.style.transform = 'none';
    }

    // Forzar reflujo para que las dimensiones no-escaladas se apliquen de inmediato
    const sheetWidth = sheet.offsetWidth;
    const sheetHeight = sheet.offsetHeight;

    // Renderizado en alta resolución fotográfica (300 DPI) con jsPDF y html2canvas
    const canvas = await html2canvas(sheet, {
      scale: 3, // 3x equivale a ~300 DPI
      width: sheetWidth,
      height: sheetHeight,
      scrollX: 0,
      scrollY: 0,
      windowWidth: sheetWidth + 50,
      windowHeight: sheetHeight + 50,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      onclone: (clonedDoc) => {
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
        if (clonedDoc.fonts && document.fonts) {
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
    doc.save(filename);

    showToast(`PDF "${filename}" descargado con éxito`);
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
