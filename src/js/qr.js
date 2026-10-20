/**
 * Generador de código QR para cartelería
 */

// Generador de QR dinámico hacia falabella.com/falabella-cl/product/{sku}/
function generateQRCode(containerEl, sku) {
  if (!containerEl) return;
  containerEl.innerHTML = '';
  const cleanSku = (sku || '').trim() || '80835902';
  const targetUrl = `https://www.falabella.com/falabella-cl/product/${cleanSku}/`;

  if (window.QRCode) {
    new QRCode(containerEl, {
      text: targetUrl,
      width: 256,
      height: 256,
      colorDark: '#000000',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.M
    });

    // CONVERSIÓN SÍNCRONA INMEDIATA:
    // QRCode.js dibuja en el canvas de forma síncrona. Convertimos inmediatamente a dataURL
    // y asignamos a un <img> para que esté disponible instantáneamente al imprimir o exportar
    // sin depender de callbacks asíncronos retardados.
    const canvas = containerEl.querySelector('canvas');
    if (canvas) {
      try {
        const dataUrl = canvas.toDataURL('image/png');
        let img = containerEl.querySelector('img');
        if (!img) {
          img = document.createElement('img');
          containerEl.appendChild(img);
        }
        img.src = dataUrl;
        img.style.display = 'block';
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'contain';
        img.alt = `Código QR Falabella SKU ${cleanSku}`;
        canvas.style.display = 'none';
      } catch (e) {
        canvas.style.display = 'block';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
      }
    }
  } else {
    // Fallback visual si la librería aún no ha cargado
    containerEl.innerHTML = `<div style="font-size:9px; border:1px solid #ccc; width:100%; height:100%; display:flex; align-items:center; justify-content:center;">QR SKU</div>`;
  }
}
